import { describe, expect, it, vi } from 'vitest';

import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  createLocalScrobbleStore,
  createPlayerDispatch,
  createQueueDispatch,
  type LocalPlayerStoreSnapshot,
  type PlayerDispatchPlayerStore,
  type PlayerStoreSnapshot,
  type QueueDispatchPlayerStore,
  type QueueDispatchQueueStore,
  type SavedKodiHost
} from './index';

type CallRecord = { method: string; params?: unknown };

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

    return response as TResult;
  }
}

class FakePlayerStore implements PlayerDispatchPlayerStore, QueueDispatchPlayerStore {
  snapshot: PlayerStoreSnapshot = createPlayerSnapshot();
  readonly refreshReasons: string[] = [];

  async refresh(
    reason:
      | Parameters<PlayerDispatchPlayerStore['refresh']>[0]
      | Parameters<QueueDispatchPlayerStore['refresh']>[0]
  ): Promise<void> {
    this.refreshReasons.push(reason);
  }
}

class FakeLocalPlayerStore {
  snapshot: LocalPlayerStoreSnapshot = createLocalSnapshot();
  readonly loadAndPlay = vi.fn(async (input: { item: LocalPlayerStoreSnapshot['item'] }) => {
    this.snapshot = createLocalSnapshot({
      status: 'playing',
      mediaKind: 'audio',
      item: input.item,
      currentSeconds: 300,
      durationSeconds: 500
    });
  });
  readonly togglePlayPause = vi.fn();
  readonly stop = vi.fn();
  readonly seekToSeconds = vi.fn();
  readonly setVolume = vi.fn();
  readonly setMuted = vi.fn();
}

class FakeQueueStore implements QueueDispatchQueueStore {
  snapshot: QueueDispatchQueueStore['snapshot'] = {
    playlistid: 1,
    items: [
      { position: 0, label: 'First' },
      { position: 1, label: 'Second' }
    ]
  };
  readonly refreshReasons: string[] = [];

  async refresh(reason: Parameters<QueueDispatchQueueStore['refresh']>[0]): Promise<void> {
    this.refreshReasons.push(reason);
  }
}

function createPlayerSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: null,
    lastUpdatedAt: '2026-04-29T20:00:00.000Z',
    activePlayers: [{ playerid: 0, type: 'audio' }],
    primaryPlayer: { playerid: 0, type: 'audio' },
    item: {
      type: 'song',
      label: 'Special Track',
      title: 'Special Track',
      songid: 42,
      file: 'smb://nas/music/special.flac'
    },
    properties: { speed: 1, percentage: 50 },
    application: { volume: 50, muted: false },
    queue: { playlistid: 1, position: 0 },
    time: { currentSeconds: 250, totalSeconds: 500 },
    lastError: null,
    ...overrides
  };
}

function createLocalSnapshot(
  overrides: Partial<LocalPlayerStoreSnapshot> = {}
): LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'unknown',
    item: null,
    currentSeconds: 0,
    durationSeconds: null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null,
    ...overrides
  };
}

function createActiveHost(): SavedKodiHost {
  return {
    id: 'living-room',
    label: 'Living Room',
    host: 'kodi.local',
    port: 8080,
    username: 'admin',
    password: 'p@ssword',
    useTls: false,
    useWebSocket: true
  };
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('smb://');
  expect(serialized).not.toContain('special.flac');
  expect(serialized).not.toContain('localStorage');
}

describe('integrated player loop store contracts', () => {
  it('starts local playback, scrobbles progress, and mutates queue through shared safe boundaries', async () => {
    const client = new FakeKodiClient();
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/special.flac' },
      mode: 'redirect'
    });
    client.enqueue('AudioLibrary.SetSongDetails', 'OK');
    client.enqueue('Playlist.Remove', 'OK');

    const playerStore = new FakePlayerStore();
    const localPlayerStore = new FakeLocalPlayerStore();
    const queueStore = new FakeQueueStore();
    const playerDispatch = createPlayerDispatch({
      playerStore,
      localPlayerStore: localPlayerStore as never,
      configStore: { activeHost: createActiveHost() } as never,
      createClient: () => client,
      now: () => '2026-04-29T20:10:00.000Z'
    });
    const localScrobbleStore = createLocalScrobbleStore({
      localPlayerStore,
      createClient: () => client,
      now: () => '2026-04-29T20:11:00.000Z'
    });
    const queueDispatch = createQueueDispatch({
      queueStore,
      playerStore,
      createClient: () => client,
      now: () => '2026-04-29T20:12:00.000Z'
    });

    await playerDispatch.startLocalPlayback();
    await localScrobbleStore.evaluateAndWrite('local:timeupdate');
    await queueDispatch.removeAt(1);

    expect(client.calls).toEqual([
      { method: 'Player.PlayPause', params: { playerid: 0 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/special.flac' } },
      {
        method: 'AudioLibrary.SetSongDetails',
        params: { songid: 42, playcount: 1, lastplayed: '2026-04-29 20:11:00' }
      },
      { method: 'Playlist.Remove', params: { playlistid: 1, position: 1 } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:startLocalPlayback', 'command:removeAt']);
    expect(queueStore.refreshReasons).toEqual(['command:removeAt']);
    expect(playerDispatch.snapshot).toMatchObject({ mode: 'local', commandStatus: 'success' });
    expect(localScrobbleStore.snapshot).toMatchObject({
      status: 'success',
      lastAction: 'audio-scrobble',
      writeCounts: { audioScrobbles: 1 }
    });
    expect(queueDispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'removeAt'
    });

    expectSecretSafe(playerDispatch.snapshot);
    expectSecretSafe(localScrobbleStore.snapshot);
    expectSecretSafe(queueDispatch.snapshot);
  });

  it('opens and queues music through shared dispatch seams without leaking the local file', async () => {
    const client = new FakeKodiClient();
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Playlist.Add', 'OK');

    const playerStore = new FakePlayerStore();
    playerStore.snapshot = createPlayerSnapshot({ activePlayers: [], primaryPlayer: null });
    const queueStore = new FakeQueueStore();
    queueStore.snapshot = { playlistid: null, items: [] };
    const localPlayerStore = new FakeLocalPlayerStore();
    localPlayerStore.snapshot = createLocalSnapshot({
      status: 'playing',
      mediaKind: 'audio',
      item: {
        type: 'song',
        songid: 42,
        label: 'Special Track',
        file: 'smb://nas/music/special.flac'
      } as unknown as LocalPlayerStoreSnapshot['item'],
      currentSeconds: 120,
      durationSeconds: 500,
      resumeAvailable: true
    });
    const playerDispatch = createPlayerDispatch({
      mode: 'local',
      playerStore,
      localPlayerStore: localPlayerStore as never,
      configStore: { activeHost: createActiveHost() } as never,
      createClient: () => client,
      now: () => '2026-04-29T20:10:00.000Z'
    });
    const queueDispatch = createQueueDispatch({
      queueStore,
      playerStore,
      createClient: () => client,
      now: () => '2026-04-29T20:12:00.000Z'
    });

    await playerDispatch.playMusicItem({ kind: 'song', songid: 42 });
    await queueDispatch.queueMusicItem({ kind: 'song', songid: 42 });

    expect(localPlayerStore.stop).toHaveBeenCalledTimes(1);
    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { songid: 42 } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { songid: 42 } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playMusicItem', 'command:queueMusicItem']);
    expect(queueStore.refreshReasons).toEqual(['command:queueMusicItem']);
    expect(playerDispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playMusicItem',
      lastError: null
    });
    expect(queueDispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMusicItem',
      lastError: null
    });
    expectSecretSafe(playerDispatch.snapshot);
    expectSecretSafe(queueDispatch.snapshot);
  });

  it('opens and queues movie items through shared dispatch seams while handing Local playback back to Kodi', async () => {
    const client = new FakeKodiClient();
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Playlist.Add', 'OK');

    const playerStore = new FakePlayerStore();
    playerStore.snapshot = createPlayerSnapshot({
      activePlayers: [],
      primaryPlayer: null,
      item: { type: 'movie', label: 'Neon Harbor', movieid: 4401 }
    });
    const queueStore = new FakeQueueStore();
    queueStore.snapshot = { playlistid: null, items: [] };
    const localPlayerStore = new FakeLocalPlayerStore();
    localPlayerStore.snapshot = createLocalSnapshot({
      status: 'playing',
      mediaKind: 'video',
      item: {
        type: 'movie',
        movieid: 4401,
        label: 'Neon Harbor',
        file: 'smb://nas/movies/neon-harbor.mkv'
      } as unknown as LocalPlayerStoreSnapshot['item'],
      currentSeconds: 120,
      durationSeconds: 7200,
      resumeAvailable: true
    });
    const playerDispatch = createPlayerDispatch({
      mode: 'local',
      playerStore,
      localPlayerStore: localPlayerStore as never,
      configStore: { activeHost: createActiveHost() } as never,
      createClient: () => client,
      now: () => '2026-04-29T20:10:00.000Z'
    });
    const queueDispatch = createQueueDispatch({
      queueStore,
      playerStore,
      createClient: () => client,
      now: () => '2026-04-29T20:12:00.000Z'
    });

    await (
      playerDispatch as unknown as { playMovieItem(item: unknown): Promise<void> }
    ).playMovieItem({
      movieid: 4401,
      resume: true
    });
    await (
      queueDispatch as unknown as { queueMovieItem(item: unknown): Promise<void> }
    ).queueMovieItem({
      movieid: 4401
    });

    expect(localPlayerStore.stop).toHaveBeenCalledTimes(1);
    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 }, options: { resume: true } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { movieid: 4401 } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playMovieItem', 'command:queueMovieItem']);
    expect(queueStore.refreshReasons).toEqual(['command:queueMovieItem']);
    expect(playerDispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playMovieItem',
      lastError: null
    });
    expect(queueDispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'queueMovieItem',
      lastError: null
    });
    expectSecretSafe(playerDispatch.snapshot);
    expectSecretSafe(queueDispatch.snapshot);
  });

  it('keeps failure snapshots safe across local preparation, scrobble, and queue commands', async () => {
    const client = new FakeKodiClient();
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue(
      'Files.PrepareDownload',
      new Error(
        'prepare failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://nas/private/special.flac from localStorage'
      )
    );
    client.enqueue(
      'AudioLibrary.SetSongDetails',
      new Error(
        'write failed for Authorization: Basic token smb://nas/private/special.flac http://admin:p@ssword@kodi.local/jsonrpc'
      )
    );
    client.enqueue(
      'Playlist.Remove',
      new Error('queue failed for Authorization: Basic token smb://nas/private/special.flac')
    );

    const playerStore = new FakePlayerStore();
    const localPlayerStore = new FakeLocalPlayerStore();
    const queueStore = new FakeQueueStore();
    const playerDispatch = createPlayerDispatch({
      playerStore,
      localPlayerStore: localPlayerStore as never,
      configStore: { activeHost: createActiveHost() } as never,
      createClient: () => client,
      now: () => '2026-04-29T20:10:00.000Z'
    });
    const localScrobbleStore = createLocalScrobbleStore({
      localPlayerStore: {
        snapshot: createLocalSnapshot({
          status: 'playing',
          mediaKind: 'audio',
          item: { type: 'song', songid: 42, label: 'Special Track' },
          currentSeconds: 300,
          durationSeconds: 500
        })
      },
      createClient: () => client,
      now: () => '2026-04-29T20:11:00.000Z'
    });
    const queueDispatch = createQueueDispatch({
      queueStore,
      playerStore,
      createClient: () => client,
      now: () => '2026-04-29T20:12:00.000Z'
    });

    await playerDispatch.startLocalPlayback();
    await localScrobbleStore.evaluateAndWrite('local:timeupdate');
    await queueDispatch.removeAt(1);

    expect(playerDispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'startLocalPlayback',
      lastError: { source: 'command', code: 'command/prepare-download-failed' }
    });
    expect(localScrobbleStore.snapshot).toMatchObject({
      status: 'error',
      lastError: { source: 'write', code: 'write/failed' }
    });
    expect(queueDispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'removeAt',
      lastError: { source: 'command', code: 'command/failed' }
    });

    expectSecretSafe(playerDispatch.snapshot);
    expectSecretSafe(localScrobbleStore.snapshot);
    expectSecretSafe(queueDispatch.snapshot);
  });
});
