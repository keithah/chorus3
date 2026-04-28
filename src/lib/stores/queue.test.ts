import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient, type KodiNotification } from '$lib/kodi';
import {
  createQueueStore,
  type QueueStoreNotificationSource,
  type QueueStorePlayerStore
} from './queue.svelte';
import type { PlayerStoreSnapshot } from './player.svelte';

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

class FakeNotificationSource implements QueueStoreNotificationSource {
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

class FakePlayerStore implements QueueStorePlayerStore {
  snapshot: PlayerStoreSnapshot = createPlayerSnapshot({
    queue: { playlistid: 7, position: 1 }
  });
}

function isDeferred(value: unknown): value is Deferred<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'promise' in value &&
    value.promise instanceof Promise
  );
}

function createPlayerSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: null,
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    activePlayers: [{ playerid: 1, type: 'audio' }],
    primaryPlayer: { playerid: 1, type: 'audio' },
    item: null,
    properties: null,
    application: { volume: 50, muted: false },
    queue: { playlistid: null, position: null },
    time: { currentSeconds: null, totalSeconds: null },
    lastError: null,
    ...overrides
  };
}

function createHarness() {
  const client = new FakeKodiClient();
  const notifications = new FakeNotificationSource();
  const playerStore = new FakePlayerStore();
  let nowMs = 1_000;
  const store = createQueueStore({
    client,
    playerStore,
    notificationSource: notifications,
    now: () => new Date(nowMs).toISOString()
  });

  return {
    client,
    notifications,
    playerStore,
    store,
    setNow: (value: number) => {
      nowMs = value;
    }
  };
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local/jsonrpc');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('smb://secret');
}

describe('queue store', () => {
  it('starts idle with inspectable safe defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      playlistid: null,
      activePosition: null,
      items: [],
      limits: { start: 0, end: 0, total: 0 },
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      lastError: null
    });
  });

  it('clears to ready state without calling Kodi when there is no active playlist', async () => {
    const { client, playerStore, store, setNow } = createHarness();
    client.enqueue('Playlist.GetItems', {
      items: [{ label: 'Old item', file: 'smb://secret/old.mp3' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    await store.refresh('manual');
    playerStore.snapshot = createPlayerSnapshot({ queue: { playlistid: null, position: null } });
    setNow(2_000);

    await store.refresh('manual');

    expect(client.calls).toHaveLength(1);
    expect(store.snapshot).toEqual({
      refreshStatus: 'ready',
      playlistid: null,
      activePosition: null,
      items: [],
      limits: { start: 0, end: 0, total: 0 },
      lastRefreshReason: 'manual',
      lastUpdatedAt: '1970-01-01T00:00:02.000Z',
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('refreshes authoritative queue order with exact Playlist.GetItems params', async () => {
    const { client, store } = createHarness();
    client.enqueue('Playlist.GetItems', {
      items: [
        {
          label: 'Second shuffled item',
          title: 'Title B',
          type: 'song',
          file: 'smb://secret/b.mp3'
        },
        {
          label: 'First shuffled item',
          artist: ['Artist A'],
          duration: 123,
          file: 'smb://secret/a.mp3'
        }
      ],
      limits: { start: 0, end: 2, total: 2 }
    });

    await store.refresh('manual');

    expect(client.calls).toEqual([
      {
        method: 'Playlist.GetItems',
        params: {
          playlistid: 7,
          properties: expect.arrayContaining([
            'label',
            'title',
            'artist',
            'duration',
            'thumbnail',
            'type'
          ])
        }
      }
    ]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playlistid: 7,
      activePosition: 1,
      items: [
        { position: 0, label: 'Second shuffled item', title: 'Title B', type: 'song' },
        { position: 1, label: 'First shuffled item', artist: ['Artist A'], duration: 123 }
      ],
      limits: { start: 0, end: 2, total: 2 },
      lastRefreshReason: 'manual',
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('normalizes malformed playlist payloads into a safe empty ready state', async () => {
    const { client, store } = createHarness();
    client.enqueue('Playlist.GetItems', {
      items: 'not-an-array',
      limits: { start: 'bad', total: Number.POSITIVE_INFINITY }
    });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playlistid: 7,
      activePosition: 1,
      items: [],
      limits: { start: 0, end: 0, total: 0 },
      lastError: null
    });
  });

  it('normalizes missing item labels and active positions outside the returned range safely', async () => {
    const { client, playerStore, store } = createHarness();
    playerStore.snapshot = createPlayerSnapshot({ queue: { playlistid: 7, position: 99 } });
    client.enqueue('Playlist.GetItems', {
      items: [{ title: 'Title-only item' }, { artist: ['Unknown Artist'] }, null],
      limits: { start: 0, end: 3, total: 3 }
    });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      activePosition: 99,
      items: [
        { position: 0, label: 'Title-only item', title: 'Title-only item' },
        { position: 1, label: 'Queue item 2', artist: ['Unknown Artist'] }
      ]
    });
  });

  it('reports missing active client as a sanitized error while preserving previous safe items', async () => {
    const client = new FakeKodiClient();
    const playerStore = new FakePlayerStore();
    let activeClient: KodiJsonRpcHttpClient | null = client;
    const store = createQueueStore({
      playerStore,
      createClient: () => activeClient,
      now: () => '2026-01-02T00:00:00.000Z'
    });
    client.enqueue('Playlist.GetItems', {
      items: [{ label: 'Safe existing item', file: 'smb://secret/existing.mp3' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    await store.refresh('manual');
    const readyItems = store.snapshot.items;
    activeClient = null;

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      playlistid: 7,
      activePosition: 1,
      items: readyItems,
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'client',
        code: 'client/no-active-host'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('sanitizes HTTP and generic refresh errors while preserving previous safe queue state', async () => {
    const { client, store } = createHarness();
    client.enqueue('Playlist.GetItems', {
      items: [{ label: 'Existing item', file: 'smb://secret/existing.mp3' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    await store.refresh('manual');
    const readySnapshot = store.snapshot;
    client.enqueue(
      'Playlist.GetItems',
      new KodiHttpClientError({
        code: 'auth',
        method: 'Playlist.GetItems',
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
      playlistid: readySnapshot.playlistid,
      activePosition: readySnapshot.activePosition,
      items: readySnapshot.items,
      limits: readySnapshot.limits,
      lastRefreshReason: 'poll',
      lastError: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured credentials while calling Playlist.GetItems.',
        endpoint: { host: 'kodi.local', hasCredentials: true }
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('suppresses stale overlapping refresh completions', async () => {
    const { client, store } = createHarness();
    const first = deferred<unknown>();
    client.enqueue('Playlist.GetItems', first);

    const firstRefresh = store.refresh('manual');
    await flushPromises();

    client.enqueue('Playlist.GetItems', {
      items: [{ label: 'Fresh item' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    await store.refresh('notification:Playlist.OnAdd');

    first.resolve({
      items: [{ label: 'Stale item' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    await firstRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'notification:Playlist.OnAdd',
      items: [{ position: 0, label: 'Fresh item' }]
    });
  });

  it('uses queue notifications only as refetch triggers and ignores unrelated notifications', async () => {
    const { client, notifications, store } = createHarness();

    expect(store.startNotificationRefresh()).toBe(true);
    expect(store.startNotificationRefresh()).toBe(false);
    notifications.emit('Player.OnPause');
    notifications.emit('VideoLibrary.OnUpdate');
    expect(client.calls).toHaveLength(0);

    client.enqueue('Playlist.GetItems', {
      items: [{ label: 'Refetched from HTTP', file: 'smb://secret/refetch.mp3' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    notifications.emit('Playlist.OnRemove');
    await flushPromises();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'notification:Playlist.OnRemove',
      items: [{ position: 0, label: 'Refetched from HTTP' }]
    });
    expect(client.calls).toEqual([
      {
        method: 'Playlist.GetItems',
        params: {
          playlistid: 7,
          properties: expect.any(Array)
        }
      }
    ]);

    store.stopNotificationRefresh();
    store.stopNotificationRefresh();
    expect(notifications.subscribeCalls).toBe(1);
    expect(notifications.unsubscribeCalls).toBe(1);
  });

  it('does not crash when notification auto-refresh is started without a source', () => {
    const playerStore = new FakePlayerStore();
    const store = createQueueStore({
      playerStore,
      client: new FakeKodiClient(),
      notificationSource: null
    });

    expect(store.startNotificationRefresh()).toBe(false);
    store.stopNotificationRefresh();
    store.destroy();
  });
});
