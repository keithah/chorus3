import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient, type KodiNotification } from '$lib/kodi';
import { createPlayerStore, type PlayerStoreNotificationSource } from './player.svelte';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

type CallRecord = {
  method: string;
  params?: unknown;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

class FakeKodiClient implements KodiJsonRpcHttpClient {
  readonly calls: CallRecord[] = [];
  readonly responses = new Map<string, unknown[]>();

  enqueue(method: string, response: unknown): void {
    this.responses.set(method, [...(this.responses.get(method) ?? []), response]);
  }

  async call<TResult>(method: string, params?: unknown): Promise<TResult> {
    this.calls.push(params === undefined ? { method } : { method, params });
    const queue = this.responses.get(method) ?? [];
    if (queue.length === 0) {
      throw new Error(`Unexpected Kodi call: ${method}`);
    }

    const response = queue.shift();
    this.responses.set(method, queue);

    if (response instanceof Error) {
      throw response;
    }

    if (isDeferred(response)) {
      return response.promise as Promise<TResult>;
    }

    return response as TResult;
  }
}

class FakeNotificationSource implements PlayerStoreNotificationSource {
  readonly listeners = new Set<(notification: KodiNotification) => void>();
  subscribeCalls = 0;
  unsubscribeCalls = 0;

  subscribeToNotifications(listener: (notification: KodiNotification) => void): () => void {
    this.subscribeCalls += 1;
    this.listeners.add(listener);

    return () => {
      this.unsubscribeCalls += 1;
      this.listeners.delete(listener);
    };
  }

  emit(method: string): void {
    for (const listener of [...this.listeners]) {
      listener({ jsonrpc: '2.0', method } as KodiNotification);
    }
  }
}

class FakeTimers {
  nextId = 1;
  readonly intervals = new Map<number, () => void>();
  clearCalls = 0;

  setInterval(callback: () => void): number {
    const id = this.nextId++;
    this.intervals.set(id, callback);
    return id;
  }

  clearInterval(id: number): void {
    this.clearCalls += 1;
    this.intervals.delete(id);
  }

  tick(id: number): void {
    this.intervals.get(id)?.();
  }
}

function isDeferred(value: unknown): value is Deferred<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'promise' in value &&
    value.promise instanceof Promise
  );
}

function createStoreHarness() {
  const client = new FakeKodiClient();
  const notifications = new FakeNotificationSource();
  const timers = new FakeTimers();
  let nowMs = 1_000;
  const store = createPlayerStore({
    client,
    notificationSource: notifications,
    now: () => new Date(nowMs).toISOString(),
    timers: {
      setInterval: (callback) => timers.setInterval(callback),
      clearInterval: (id) => timers.clearInterval(id as number)
    }
  });

  return {
    client,
    notifications,
    store,
    timers,
    setNow: (value: number) => {
      nowMs = value;
    }
  };
}

function enqueueNoPlayer(client: FakeKodiClient): void {
  client.enqueue('Player.GetActivePlayers', []);
  client.enqueue('Application.GetProperties', { volume: 44, muted: false });
}

function enqueueActivePlayer(client: FakeKodiClient): void {
  client.enqueue('Player.GetActivePlayers', [{ playerid: 1, type: 'video' }]);
  client.enqueue('Application.GetProperties', { volume: 80, muted: true });
  client.enqueue('Player.GetItem', {
    item: {
      label: 'Example Movie',
      title: 'Example Title',
      type: 'movie',
      file: 'smb://secret/movie.mkv'
    }
  });
  client.enqueue('Player.GetProperties', {
    playlistid: 7,
    position: 3,
    speed: 1,
    percentage: 25,
    time: { hours: 1, minutes: 2, seconds: 3, milliseconds: 400 },
    totaltime: { hours: 2, minutes: 0, seconds: 0 },
    audiostreams: [{ codec: 'aac', channels: 2 }],
    currentaudiostream: { codec: 'aac', channels: 2 },
    subtitles: [{ language: 'eng' }],
    currentsubtitle: { language: 'eng' },
    videostreams: [{ codec: 'h264', width: 1920, height: 1080 }],
    currentvideostream: { codec: 'h264', width: 1920, height: 1080 }
  });
}

describe('player store', () => {
  it('starts idle with stable safe defaults', () => {
    const { store } = createStoreHarness();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'idle',
      playbackStatus: 'none',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      activePlayers: [],
      primaryPlayer: null,
      item: null,
      properties: null,
      application: { volume: null, muted: null },
      queue: { playlistid: null, position: null },
      time: { currentSeconds: null, totalSeconds: null },
      lastError: null
    });
  });

  it('refreshes no-player state while still reading application volume', async () => {
    const { client, store, setNow } = createStoreHarness();
    setNow(2_000);
    enqueueNoPlayer(client);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playbackStatus: 'none',
      lastRefreshReason: 'manual',
      lastUpdatedAt: '1970-01-01T00:00:02.000Z',
      activePlayers: [],
      primaryPlayer: null,
      item: null,
      properties: null,
      application: { volume: 44, muted: false },
      queue: { playlistid: null, position: null },
      time: { currentSeconds: null, totalSeconds: null },
      lastError: null
    });
    expect(client.calls.map((call) => call.method)).toEqual([
      'Player.GetActivePlayers',
      'Application.GetProperties'
    ]);
  });

  it('refreshes one active player with item, properties, volume, normalized time, and queue identity', async () => {
    const { client, store } = createStoreHarness();
    enqueueActivePlayer(client);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playbackStatus: 'active',
      activePlayers: [{ playerid: 1, type: 'video' }],
      primaryPlayer: { playerid: 1, type: 'video' },
      item: { label: 'Example Movie', title: 'Example Title', type: 'movie' },
      application: { volume: 80, muted: true },
      properties: { speed: 1, percentage: 25 },
      queue: { playlistid: 7, position: 3 },
      time: { currentSeconds: 3723.4, totalSeconds: 7200 },
      lastError: null
    });
    expect(client.calls).toEqual([
      { method: 'Player.GetActivePlayers' },
      { method: 'Application.GetProperties', params: { properties: ['volume', 'muted'] } },
      {
        method: 'Player.GetItem',
        params: { playerid: 1, properties: expect.arrayContaining(['label', 'title', 'file']) }
      },
      {
        method: 'Player.GetProperties',
        params: {
          playerid: 1,
          properties: expect.arrayContaining(['time', 'totaltime', 'playlistid'])
        }
      }
    ]);
  });

  it('represents multiple players explicitly and chooses a deterministic primary for display reads', async () => {
    const { client, store } = createStoreHarness();
    client.enqueue('Player.GetActivePlayers', [
      { playerid: 2, type: 'audio' },
      { playerid: 1, type: 'video' }
    ]);
    client.enqueue('Application.GetProperties', { volume: 51, muted: false });
    client.enqueue('Player.GetItem', { item: { label: 'Video wins' } });
    client.enqueue('Player.GetProperties', { playlistid: 4, position: 9, speed: 0 });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playbackStatus: 'multiple',
      activePlayers: [
        { playerid: 2, type: 'audio' },
        { playerid: 1, type: 'video' }
      ],
      primaryPlayer: { playerid: 1, type: 'video' },
      item: { label: 'Video wins' },
      queue: { playlistid: 4, position: 9 },
      properties: { speed: 0 }
    });
  });

  it('normalizes malformed active players and missing property fields without crashing', async () => {
    const { client, store } = createStoreHarness();
    client.enqueue('Player.GetActivePlayers', [
      { playerid: 'bad', type: 'video' },
      { playerid: 5 }
    ]);
    client.enqueue('Application.GetProperties', {});
    client.enqueue('Player.GetItem', {});
    client.enqueue('Player.GetProperties', {
      time: { seconds: 0 },
      totaltime: { seconds: 0 },
      speed: 0
    });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playbackStatus: 'active',
      activePlayers: [{ playerid: 5, type: 'unknown' }],
      primaryPlayer: { playerid: 5, type: 'unknown' },
      item: null,
      application: { volume: null, muted: null },
      queue: { playlistid: null, position: null },
      time: { currentSeconds: 0, totalSeconds: 0 },
      properties: { speed: 0 }
    });
  });

  it('redacts HTTP errors and preserves the previous safe player snapshot', async () => {
    const { client, store } = createStoreHarness();
    enqueueActivePlayer(client);
    await store.refresh('manual');
    const readySnapshot = store.snapshot;

    client.enqueue(
      'Player.GetActivePlayers',
      new KodiHttpClientError({
        code: 'auth',
        method: 'Player.GetActivePlayers',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        },
        status: 401,
        statusText: 'Unauthorized'
      })
    );

    await store.refresh('poll');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      playbackStatus: 'active',
      activePlayers: readySnapshot.activePlayers,
      primaryPlayer: readySnapshot.primaryPlayer,
      item: readySnapshot.item,
      queue: readySnapshot.queue,
      lastRefreshReason: 'poll',
      lastError: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured credentials while calling Player.GetActivePlayers.',
        endpoint: { host: 'kodi.local', hasCredentials: true }
      }
    });
    const serialized = JSON.stringify(store.snapshot);
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('admin:secret');
    expect(serialized).not.toContain('ws://user:pass@');
    expect(serialized).not.toContain('localStorage');
  });

  it('suppresses stale overlapping refresh completions', async () => {
    const { client, store } = createStoreHarness();
    const firstActive = deferred<unknown>();
    client.enqueue('Player.GetActivePlayers', firstActive);

    const firstRefresh = store.refresh('manual');
    await flushPromises();

    client.enqueue('Player.GetActivePlayers', []);
    client.enqueue('Application.GetProperties', { volume: 22, muted: false });
    const secondRefresh = store.refresh('notification:Player.OnStop');
    await secondRefresh;

    firstActive.resolve([{ playerid: 1, type: 'video' }]);
    client.enqueue('Application.GetProperties', { volume: 99, muted: true });
    client.enqueue('Player.GetItem', { item: { label: 'stale' } });
    client.enqueue('Player.GetProperties', { playlistid: 1, position: 1 });
    await firstRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playbackStatus: 'none',
      lastRefreshReason: 'notification:Player.OnStop',
      application: { volume: 22, muted: false },
      item: null,
      queue: { playlistid: null, position: null }
    });
  });

  it('uses relevant notifications only as refresh triggers and exposes queue trigger reason', async () => {
    const { client, notifications, store } = createStoreHarness();
    store.startNotificationRefresh();

    notifications.emit('VideoLibrary.OnUpdate');
    expect(client.calls).toHaveLength(0);

    enqueueNoPlayer(client);
    notifications.emit('Player.OnPause');
    await flushPromises();
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'notification:Player.OnPause'
    });

    enqueueNoPlayer(client);
    notifications.emit('Playlist.OnAdd');
    await flushPromises();
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'notification:Playlist.OnAdd',
      lastQueueRefreshReason: 'notification:Playlist.OnAdd'
    });
  });

  it('starts and stops polling idempotently with fake timer hooks', async () => {
    const { client, store, timers } = createStoreHarness();

    expect(store.startPolling(1000)).toBe(true);
    expect(store.startPolling(1000)).toBe(false);
    expect(timers.intervals.size).toBe(1);

    enqueueNoPlayer(client);
    timers.tick(1);
    await flushPromises();
    expect(store.snapshot.lastRefreshReason).toBe('poll');

    store.stopPolling();
    store.stopPolling();
    expect(timers.intervals.size).toBe(0);
    expect(timers.clearCalls).toBe(1);
    expect(() => store.startPolling(0)).toThrow('Polling interval must be greater than 0ms.');
  });

  it('unsubscribes notification listeners and stops polling on destroy', () => {
    const { notifications, store, timers } = createStoreHarness();

    store.startNotificationRefresh();
    store.startNotificationRefresh();
    store.startPolling(1000);
    store.destroy();
    store.destroy();

    expect(notifications.subscribeCalls).toBe(1);
    expect(notifications.unsubscribeCalls).toBe(1);
    expect(timers.intervals.size).toBe(0);
  });
});
