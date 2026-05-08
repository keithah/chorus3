import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient, type KodiNotification } from '$lib/kodi';
import {
  createQueueDispatch,
  createQueueStore,
  type PlayerStoreSnapshot,
  type QueueDispatchPlayerStore,
  type QueueDispatchQueueStore,
  type QueueStoreNotificationSource,
  type QueueStorePlayerStore,
  type QueueStoreSnapshot,
  type QueueDispatch
} from './index';

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

class FakePlayerStore implements QueueStorePlayerStore, QueueDispatchPlayerStore {
  snapshot: PlayerStoreSnapshot = createPlayerSnapshot({
    queue: { playlistid: 7, position: 1 }
  });
  readonly refreshReasons: string[] = [];
  refreshError: unknown = null;

  async refresh(reason: Parameters<QueueDispatchPlayerStore['refresh']>[0]): Promise<void> {
    this.refreshReasons.push(reason);

    if (this.refreshError) {
      throw this.refreshError;
    }
  }
}

class FakeQueueDispatchStore implements QueueDispatchQueueStore {
  snapshot: QueueStoreSnapshot = createQueueSnapshot();
  readonly refreshReasons: string[] = [];
  refreshError: unknown = null;

  async refresh(reason: Parameters<QueueDispatchQueueStore['refresh']>[0]): Promise<void> {
    this.refreshReasons.push(reason);

    if (this.refreshError) {
      throw this.refreshError;
    }
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

function createQueueSnapshot(overrides: Partial<QueueStoreSnapshot> = {}): QueueStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playlistid: 7,
    activePosition: 1,
    items: [
      { position: 0, label: 'First item' },
      { position: 1, label: 'Second item' },
      { position: 2, label: 'Third item' }
    ],
    limits: { start: 0, end: 3, total: 3 },
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
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

function createDispatchHarness() {
  const client = new FakeKodiClient();
  const playerStore = new FakePlayerStore();
  const queueStore = new FakeQueueDispatchStore();
  const dispatch = createQueueDispatch({
    playerStore,
    queueStore,
    createClient: () => client,
    now: () => '2026-01-02T00:00:00.000Z'
  });

  return { client, dispatch, playerStore, queueStore };
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

type QueueDispatchWithMusic = QueueDispatch & {
  queueMusicItem(item: unknown): Promise<void>;
};

type QueueDispatchWithMovies = QueueDispatch & {
  queueMovieItem(item: unknown): Promise<void>;
};

type QueueDispatchWithEpisodes = QueueDispatch & {
  queueEpisodeItem(item: unknown): Promise<void>;
};

type QueueDispatchWithMusicVideos = QueueDispatch & {
  queueMusicVideoItem(item: unknown): Promise<void>;
};

type QueueDispatchWithFiles = QueueDispatch & {
  queueFileItem(item: unknown): Promise<void>;
};

type QueueDispatchWithPlaylists = QueueDispatch & {
  queuePlaylistItem(item: unknown): Promise<void>;
};

function asMusicDispatch(dispatch: QueueDispatch): QueueDispatchWithMusic {
  return dispatch as QueueDispatchWithMusic;
}

function asMovieDispatch(dispatch: QueueDispatch): QueueDispatchWithMovies {
  return dispatch as QueueDispatchWithMovies;
}

function asEpisodeDispatch(dispatch: QueueDispatch): QueueDispatchWithEpisodes {
  return dispatch as QueueDispatchWithEpisodes;
}

function asMusicVideoDispatch(dispatch: QueueDispatch): QueueDispatchWithMusicVideos {
  return dispatch as QueueDispatchWithMusicVideos;
}

function asFileDispatch(dispatch: QueueDispatch): QueueDispatchWithFiles {
  return dispatch as QueueDispatchWithFiles;
}

function asPlaylistDispatch(dispatch: QueueDispatch): QueueDispatchWithPlaylists {
  return dispatch as QueueDispatchWithPlaylists;
}

describe('queue dispatch', () => {
  it('queues movie items through Playlist.Add with video playlist id and authoritative refetches', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    queueStore.snapshot = createQueueSnapshot({
      playlistid: null,
      activePosition: null,
      items: []
    });
    client.enqueue('Playlist.Add', 'OK');

    await asMovieDispatch(dispatch).queueMovieItem({ movieid: 4401 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { movieid: 4401 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueMovieItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueMovieItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMovieItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('rejects invalid movie queue ids before calling Kodi or refreshing stores', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const invalidInputs = [
      { movieid: 0 },
      { movieid: -1 },
      { movieid: 1.5 },
      { movieid: Number.POSITIVE_INFINITY },
      { movieid: Number.NaN },
      { movieid: '4401' },
      { movieid: Number.MAX_SAFE_INTEGER + 1 },
      { movieid: 4401, file: 'smb://secret/movie.mkv' },
      { movieid: 4401, songid: 42 }
    ];

    for (const input of invalidInputs) {
      await asMovieDispatch(dispatch).queueMovieItem(input);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'queueMovieItem',
        lastError: { source: 'input', code: 'input/invalid-movie-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active clients for movie queue commands without refreshing', async () => {
    const playerStore = new FakePlayerStore();
    const queueStore = new FakeQueueDispatchStore();
    const dispatch = createQueueDispatch({
      playerStore,
      queueStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await asMovieDispatch(dispatch).queueMovieItem({ movieid: 4401 });

    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueMovieItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('sanitizes movie queue command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Add',
      new Error(
        'add failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://secret/movie.mkv from localStorage raw body'
      )
    );

    await asMovieDispatch(dispatch).queueMovieItem({ movieid: 4401 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { movieid: 4401 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueMovieItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueMovieItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueMovieItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('serializes movie queue commands and preserves success when refreshes fail', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const pending = deferred<unknown>();
    client.enqueue('Playlist.Add', pending);
    client.enqueue('Playlist.Add', 'OK');
    queueStore.refreshError = new Error('queue refresh failed with smb://secret/movie.mkv');
    playerStore.refreshError = new Error('player refresh failed with Authorization: Basic token');
    const movieDispatch = asMovieDispatch(dispatch);

    const firstCall = movieDispatch.queueMovieItem({ movieid: 4401 });
    await flushPromises();
    await movieDispatch.queueMovieItem({ movieid: 4402 });

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueMovieItem',
      lastError: { code: 'command/already-running' }
    });

    pending.resolve('OK');
    await firstCall;
    await movieDispatch.queueMovieItem({ movieid: 4403 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { movieid: 4401 } } },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { movieid: 4403 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueMovieItem', 'command:queueMovieItem']);
    expect(playerStore.refreshReasons).toEqual([
      'command:queueMovieItem',
      'command:queueMovieItem'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMovieItem',
      lastError: null
    });
  });

  it('queues episode items through Playlist.Add with video playlist id and authoritative refetches', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    queueStore.snapshot = createQueueSnapshot({
      playlistid: null,
      activePosition: null,
      items: []
    });
    client.enqueue('Playlist.Add', 'OK');

    await asEpisodeDispatch(dispatch).queueEpisodeItem({ episodeid: 8801 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 8801 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueEpisodeItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueEpisodeItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueEpisodeItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('queues music video items through Playlist.Add with video playlist id', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    queueStore.snapshot = createQueueSnapshot({
      playlistid: null,
      activePosition: null,
      items: []
    });
    client.enqueue('Playlist.Add', 'OK');

    await asMusicVideoDispatch(dispatch).queueMusicVideoItem({ musicvideoid: 7701 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { musicvideoid: 7701 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueMusicVideoItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueMusicVideoItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMusicVideoItem',
      lastError: null
    });
  });

  it('rejects invalid episode queue ids before calling Kodi or refreshing stores', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const invalidInputs = [
      {},
      { episodeid: 0 },
      { episodeid: -1 },
      { episodeid: 1.5 },
      { episodeid: Number.POSITIVE_INFINITY },
      { episodeid: Number.NaN },
      { episodeid: '8801' },
      { episodeid: Number.MAX_SAFE_INTEGER + 1 },
      { episodeid: 8801, file: 'smb://secret/episode.mkv' },
      { episodeid: 8801, movieid: 4401 }
    ];

    for (const input of invalidInputs) {
      await asEpisodeDispatch(dispatch).queueEpisodeItem(input);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'queueEpisodeItem',
        lastError: { source: 'input', code: 'input/invalid-episode-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active clients for episode queue commands without refreshing', async () => {
    const playerStore = new FakePlayerStore();
    const queueStore = new FakeQueueDispatchStore();
    const dispatch = createQueueDispatch({
      playerStore,
      queueStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await asEpisodeDispatch(dispatch).queueEpisodeItem({ episodeid: 8801 });

    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueEpisodeItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('sanitizes episode queue command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Add',
      new Error(
        'add failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://secret/episode.mkv from localStorage raw body'
      )
    );

    await asEpisodeDispatch(dispatch).queueEpisodeItem({ episodeid: 8801 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 8801 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueEpisodeItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueEpisodeItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueEpisodeItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('queues smart playlist files through Playlist.Add with audio playlist id and authoritative refetches', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    queueStore.snapshot = createQueueSnapshot({
      playlistid: null,
      activePosition: null,
      items: []
    });
    client.enqueue('Playlist.Add', 'OK');

    await asPlaylistDispatch(dispatch).queuePlaylistItem({
      file: 'special://profile/playlists/music/recent.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'special://profile/playlists/music/recent.xsp' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queuePlaylistItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('queues video smart playlist files through Playlist.Add with video playlist id', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue('Playlist.Add', 'OK');

    await asPlaylistDispatch(dispatch).queuePlaylistItem({
      file: 'special://profile/playlists/video/recent.xsp',
      mediaKind: 'video',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 1, item: { file: 'special://profile/playlists/video/recent.xsp' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queuePlaylistItem',
      lastError: null
    });
  });

  it('queues standard playlist files through Playlist.Add', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue('Playlist.Add', 'OK');

    await asPlaylistDispatch(dispatch).queuePlaylistItem({
      file: 'special://profile/playlists/music/party.m3u',
      mediaKind: 'music',
      playlistKind: 'basic'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'special://profile/playlists/music/party.m3u' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queuePlaylistItem',
      lastError: null
    });
  });

  it('rejects invalid playlist queue inputs before calling Kodi or refreshing stores', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const invalidInputs = [
      { file: '', mediaKind: 'music', playlistKind: 'smart' },
      { file: '   ', mediaKind: 'music', playlistKind: 'smart' },
      { file: 42, mediaKind: 'music', playlistKind: 'smart' },
      {
        file: 'special://profile/playlists/music/recent.xsp',
        mediaKind: 'music',
        playlistKind: 'smart',
        songid: 42
      },
      {
        kind: 'song',
        songid: 42,
        file: 'special://profile/playlists/music/recent.xsp',
        mediaKind: 'music',
        playlistKind: 'smart'
      }
    ];

    for (const input of invalidInputs) {
      await asPlaylistDispatch(dispatch).queuePlaylistItem(input);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'queuePlaylistItem',
        lastError: { source: 'input', code: 'input/invalid-playlist-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('serializes playlist queue commands and preserves success when refreshes fail', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const pending = deferred<unknown>();
    client.enqueue('Playlist.Add', pending);
    client.enqueue('Playlist.Add', 'OK');
    queueStore.refreshError = new Error('queue refresh failed with smb://secret/song.flac');
    playerStore.refreshError = new Error('player refresh failed with Authorization: Basic token');
    const playlistDispatch = asPlaylistDispatch(dispatch);

    const firstCall = playlistDispatch.queuePlaylistItem({
      file: 'special://profile/playlists/music/first.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });
    await flushPromises();
    await playlistDispatch.queuePlaylistItem({
      file: 'special://profile/playlists/music/second.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queuePlaylistItem',
      lastError: { code: 'command/already-running' }
    });

    pending.resolve('OK');
    await firstCall;
    await playlistDispatch.queuePlaylistItem({
      file: 'special://profile/playlists/music/third.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'special://profile/playlists/music/first.xsp' } }
      },
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'special://profile/playlists/music/third.xsp' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual([
      'command:queuePlaylistItem',
      'command:queuePlaylistItem'
    ]);
    expect(playerStore.refreshReasons).toEqual([
      'command:queuePlaylistItem',
      'command:queuePlaylistItem'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queuePlaylistItem',
      lastError: null
    });
  });

  it('reports missing active clients for playlist queue commands without refreshing', async () => {
    const playerStore = new FakePlayerStore();
    const queueStore = new FakeQueueDispatchStore();
    const dispatch = createQueueDispatch({
      playerStore,
      queueStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await asPlaylistDispatch(dispatch).queuePlaylistItem({
      file: 'special://profile/playlists/music/recent.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queuePlaylistItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('sanitizes playlist queue command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Add',
      new Error(
        'add failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://secret/song.flac from localStorage raw body'
      )
    );

    await asPlaylistDispatch(dispatch).queuePlaylistItem({
      file: 'special://profile/playlists/music/recent.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'special://profile/playlists/music/recent.xsp' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queuePlaylistItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queuePlaylistItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('queues audio file items through Playlist.Add with audio playlist id and authoritative refetches', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    queueStore.snapshot = createQueueSnapshot({
      playlistid: null,
      activePosition: null,
      items: []
    });
    client.enqueue('Playlist.Add', 'OK');

    await asFileDispatch(dispatch).queueFileItem({
      file: 'smb://nas/music/special.mp3',
      mediaKind: 'audio'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'smb://nas/music/special.mp3' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueFileItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueFileItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueFileItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('queues video file browser items through Playlist.Add with video playlist id', async () => {
    const { client, dispatch } = createDispatchHarness();
    client.enqueue('Playlist.Add', 'OK');

    await asFileDispatch(dispatch).queueFileItem({
      file: 'smb://nas/videos/Big Buck Bunny.mkv',
      mediaKind: 'video'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 1, item: { file: 'smb://nas/videos/Big Buck Bunny.mkv' } }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueFileItem',
      lastError: null
    });
  });

  it('queues browser directory items through Playlist.Add with directory payload', async () => {
    const { client, dispatch } = createDispatchHarness();
    client.enqueue('Playlist.Add', 'OK');

    await asFileDispatch(dispatch).queueFileItem({
      file: 'smb://nas/music/Albums/',
      mediaKind: 'audio',
      itemType: 'directory'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { directory: 'smb://nas/music/Albums/' } }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueFileItem',
      lastError: null
    });
  });

  it('rejects invalid file queue inputs before calling Kodi or refreshing stores', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const invalidInputs = [
      { file: '', mediaKind: 'audio' },
      { file: '   ', mediaKind: 'audio' },
      { file: 42, mediaKind: 'audio' },
      { file: 'smb://secret/song.flac', mediaKind: 'unknown' },
      { kind: 'song', songid: 42, file: 'smb://secret/song.flac', mediaKind: 'audio' }
    ];

    for (const input of invalidInputs) {
      await asFileDispatch(dispatch).queueFileItem(input);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'queueFileItem',
        lastError: { source: 'input', code: 'input/invalid-file-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('serializes file queue commands and preserves success when refreshes fail', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const pending = deferred<unknown>();
    client.enqueue('Playlist.Add', pending);
    client.enqueue('Playlist.Add', 'OK');
    queueStore.refreshError = new Error('queue refresh failed with smb://secret/song.flac');
    playerStore.refreshError = new Error('player refresh failed with Authorization: Basic token');
    const fileDispatch = asFileDispatch(dispatch);

    const firstCall = fileDispatch.queueFileItem({
      file: 'smb://nas/music/first.mp3',
      mediaKind: 'audio'
    });
    await flushPromises();
    await fileDispatch.queueFileItem({ file: 'smb://nas/music/second.mp3', mediaKind: 'audio' });

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueFileItem',
      lastError: { code: 'command/already-running' }
    });

    pending.resolve('OK');
    await firstCall;
    await fileDispatch.queueFileItem({ file: 'smb://nas/music/third.mp3', mediaKind: 'audio' });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'smb://nas/music/first.mp3' } }
      },
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'smb://nas/music/third.mp3' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueFileItem', 'command:queueFileItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueFileItem', 'command:queueFileItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueFileItem',
      lastError: null
    });
  });

  it('sanitizes file queue command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Add',
      new Error(
        'add failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://secret/song.flac from localStorage raw body'
      )
    );

    await asFileDispatch(dispatch).queueFileItem({
      file: 'smb://nas/music/special.mp3',
      mediaKind: 'audio'
    });

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'smb://nas/music/special.mp3' } }
      }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueFileItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueFileItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueFileItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('queues music songs, albums, and artists through audio Playlist.Add without active playlist state', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    queueStore.snapshot = createQueueSnapshot({
      playlistid: null,
      activePosition: null,
      items: []
    });
    client.enqueue('Playlist.Add', 'OK');
    client.enqueue('Playlist.Add', 'OK');
    client.enqueue('Playlist.Add', 'OK');
    const musicDispatch = asMusicDispatch(dispatch);

    await musicDispatch.queueMusicItem({ kind: 'song', songid: 42 });
    await musicDispatch.queueMusicItem({ kind: 'album', albumid: 7 });
    await musicDispatch.queueMusicItem({ kind: 'artist', artistid: 3 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 0, item: { songid: 42 } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { albumid: 7 } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { artistid: 3 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual([
      'command:queueMusicItem',
      'command:queueMusicItem',
      'command:queueMusicItem'
    ]);
    expect(playerStore.refreshReasons).toEqual([
      'command:queueMusicItem',
      'command:queueMusicItem',
      'command:queueMusicItem'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMusicItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('rejects invalid music queue inputs before calling Kodi or refreshing stores', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const musicDispatch = asMusicDispatch(dispatch);
    const invalidInputs = [
      { kind: 'song', songid: Number.NaN },
      { kind: 'song', songid: Number.POSITIVE_INFINITY },
      { kind: 'song', songid: 0 },
      { kind: 'song', songid: -1 },
      { kind: 'song', songid: 1.5 },
      { songid: 42, albumid: 7 },
      {},
      { movieid: 9 },
      { kind: 'song', songid: 42, file: 'smb://secret/song.flac' }
    ];

    for (const input of invalidInputs) {
      await musicDispatch.queueMusicItem(input);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'queueMusicItem',
        lastError: { source: 'input', code: 'input/invalid-music-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active clients for music queue commands without refreshing', async () => {
    const playerStore = new FakePlayerStore();
    const queueStore = new FakeQueueDispatchStore();
    const dispatch = createQueueDispatch({
      playerStore,
      queueStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await asMusicDispatch(dispatch).queueMusicItem({ kind: 'song', songid: 42 });

    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueMusicItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('sanitizes music queue command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Add',
      new Error(
        'add failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://secret/song.flac from localStorage raw body'
      )
    );

    await asMusicDispatch(dispatch).queueMusicItem({ kind: 'song', songid: 42 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 0, item: { songid: 42 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueMusicItem']);
    expect(playerStore.refreshReasons).toEqual(['command:queueMusicItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueMusicItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('serializes music queue commands and preserves success when refreshes fail', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const pending = deferred<unknown>();
    client.enqueue('Playlist.Add', pending);
    client.enqueue('Playlist.Add', 'OK');
    queueStore.refreshError = new Error('queue refresh failed with smb://secret/song.flac');
    playerStore.refreshError = new Error('player refresh failed with Authorization: Basic token');
    const musicDispatch = asMusicDispatch(dispatch);

    const firstCall = musicDispatch.queueMusicItem({ kind: 'song', songid: 42 });
    await flushPromises();
    await musicDispatch.queueMusicItem({ kind: 'album', albumid: 7 });

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'queueMusicItem',
      lastError: { code: 'command/already-running' }
    });

    pending.resolve('OK');
    await firstCall;
    await musicDispatch.queueMusicItem({ kind: 'artist', artistid: 3 });

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 0, item: { songid: 42 } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { artistid: 3 } } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:queueMusicItem', 'command:queueMusicItem']);
    expect(playerStore.refreshReasons).toEqual([
      'command:queueMusicItem',
      'command:queueMusicItem'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMusicItem',
      lastError: null
    });
  });

  it('starts with inspectable idle command state', () => {
    const { dispatch } = createDispatchHarness();

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    });
  });

  it('removes, clears, and swaps queue items with exact Kodi params and authoritative refetches', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue('Playlist.Remove', 'OK');
    client.enqueue('Playlist.Clear', 'OK');
    client.enqueue('Playlist.Swap', 'OK');

    await dispatch.removeAt(2);
    await dispatch.clear();
    await dispatch.swap(0, 2);

    expect(client.calls).toEqual([
      { method: 'Playlist.Remove', params: { playlistid: 7, position: 2 } },
      { method: 'Playlist.Clear', params: { playlistid: 7 } },
      { method: 'Playlist.Swap', params: { playlistid: 7, position1: 0, position2: 2 } }
    ]);
    expect(queueStore.refreshReasons).toEqual([
      'command:removeAt',
      'command:clear',
      'command:swap'
    ]);
    expect(playerStore.refreshReasons).toEqual([
      'command:removeAt',
      'command:clear',
      'command:swap'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'swap',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('blocks invalid positions, identical swaps, and missing active playlists before calling Kodi', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();

    await dispatch.removeAt(-1);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-position' });

    await dispatch.removeAt(Number.NaN);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-position' });

    await dispatch.swap(0, 0);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/identical-positions' });

    await dispatch.swap(0, 99);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-position' });

    queueStore.snapshot = createQueueSnapshot({ playlistid: null, activePosition: null });
    playerStore.snapshot = createPlayerSnapshot({ queue: { playlistid: null, position: null } });
    await dispatch.clear();

    expect(client.calls).toEqual([]);
    expect(queueStore.refreshReasons).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'clear',
      lastError: { code: 'queue/no-active-playlist' }
    });
  });

  it('serializes queue commands while one is already running', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    const pending = deferred<unknown>();
    client.enqueue('Playlist.Remove', pending);

    const firstCall = dispatch.removeAt(1);
    await flushPromises();
    await dispatch.clear();

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'clear',
      lastError: { code: 'command/already-running' }
    });

    pending.resolve('OK');
    await firstCall;

    expect(client.calls).toEqual([
      { method: 'Playlist.Remove', params: { playlistid: 7, position: 1 } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:removeAt']);
    expect(playerStore.refreshReasons).toEqual(['command:removeAt']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'removeAt',
      lastError: null
    });
  });

  it('sanitizes command failures and still refetches queue and player state after Kodi was reached', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Remove',
      new KodiHttpClientError({
        code: 'auth',
        method: 'Playlist.Remove',
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

    await dispatch.removeAt(2);

    expect(client.calls).toEqual([
      { method: 'Playlist.Remove', params: { playlistid: 7, position: 2 } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:removeAt']);
    expect(playerStore.refreshReasons).toEqual(['command:removeAt']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'removeAt',
      lastError: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured credentials while calling Playlist.Remove.'
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('preserves command failure state when queue rollback refetch also fails', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue(
      'Playlist.Clear',
      new Error(
        'failed with Authorization: Basic token for http://admin:p@ssword@kodi.local/jsonrpc from localStorage'
      )
    );
    queueStore.refreshError = new Error('queue refresh failed');

    await dispatch.clear();

    expect(client.calls).toEqual([{ method: 'Playlist.Clear', params: { playlistid: 7 } }]);
    expect(queueStore.refreshReasons).toEqual(['command:clear']);
    expect(playerStore.refreshReasons).toEqual(['command:clear']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'clear',
      lastError: {
        source: 'command',
        code: 'command/failed'
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('keeps successful command status inspectable when player refresh fails after Kodi and queue refresh succeed', async () => {
    const { client, dispatch, playerStore, queueStore } = createDispatchHarness();
    client.enqueue('Playlist.Swap', 'OK');
    playerStore.refreshError = new Error('player refresh failed with admin:p@ssword');

    await dispatch.swap(0, 2);

    expect(client.calls).toEqual([
      { method: 'Playlist.Swap', params: { playlistid: 7, position1: 0, position2: 2 } }
    ]);
    expect(queueStore.refreshReasons).toEqual(['command:swap']);
    expect(playerStore.refreshReasons).toEqual(['command:swap']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'swap',
      lastError: null
    });
  });
});

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
            'file',
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
        {
          position: 0,
          label: 'Second shuffled item',
          title: 'Title B',
          type: 'song'
        },
        {
          position: 1,
          label: 'First shuffled item',
          artist: ['Artist A'],
          duration: 123
        }
      ],
      limits: { start: 0, end: 2, total: 2 },
      lastRefreshReason: 'manual',
      lastError: null
    });
    expect(store.getPlayableItems()).toEqual([
      {
        position: 0,
        label: 'Second shuffled item',
        file: 'smb://secret/b.mp3',
        type: 'song'
      },
      {
        position: 1,
        label: 'First shuffled item',
        file: 'smb://secret/a.mp3',
        duration: 123
      }
    ]);
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
