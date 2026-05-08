import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  createActiveKodiJsonRpcHttpClient,
  createConfigStore,
  createPlayerDispatch,
  savedKodiHostToKodiHttpHost,
  type PlayerDispatchPlayerStore,
  type PlayerStoreSnapshot,
  type SavedKodiHost
} from './index';

type CallRecord = {
  method: string;
  params?: unknown;
};

type PlayerDispatchWithFiles = ReturnType<typeof createPlayerDispatch> & {
  playFileItem(item: unknown): Promise<void>;
  setLocalFilePlaylist(items: readonly unknown[], startFile?: string): void;
  canNavigateLocalFilePlaylist(): boolean;
};

type PlayerDispatchWithPlaylists = ReturnType<typeof createPlayerDispatch> & {
  playPlaylistItem(item: unknown): Promise<void>;
};

type PlayerDispatchWithMovies = ReturnType<typeof createPlayerDispatch> & {
  playMovieItem(item: unknown): Promise<void>;
};

type PlayerDispatchWithMovieStream = ReturnType<typeof createPlayerDispatch> & {
  streamMovieItem(item: unknown): Promise<void>;
};

type PlayerDispatchWithEpisodes = ReturnType<typeof createPlayerDispatch> & {
  playEpisodeItem(item: unknown): Promise<void>;
  streamEpisodeItem(item: unknown): Promise<void>;
};

type PlayerDispatchWithMusicVideos = ReturnType<typeof createPlayerDispatch> & {
  playMusicVideoItem(item: unknown): Promise<void>;
  streamMusicVideoItem(item: unknown): Promise<void>;
};

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

class FakePlayerStore implements PlayerDispatchPlayerStore {
  snapshot: PlayerStoreSnapshot = createSnapshot({
    activePlayers: [{ playerid: 7, type: 'video' }],
    primaryPlayer: { playerid: 7, type: 'video' },
    playbackStatus: 'active',
    item: { file: 'smb://nas/music/special.mp3', label: 'Special', type: 'song', id: 9 }
  });
  readonly refreshReasons: string[] = [];
  readonly refreshSnapshots: PlayerStoreSnapshot[] = [];
  refreshError: unknown = null;

  enqueueRefreshSnapshot(snapshot: PlayerStoreSnapshot): void {
    this.refreshSnapshots.push(snapshot);
  }

  async refresh(reason: Parameters<PlayerDispatchPlayerStore['refresh']>[0]): Promise<void> {
    this.refreshReasons.push(reason);

    if (this.refreshError) {
      throw this.refreshError;
    }

    const nextSnapshot = this.refreshSnapshots.shift();
    if (nextSnapshot) {
      this.snapshot = nextSnapshot;
    }
  }
}

class FakeLocalPlayerStore {
  snapshot = {
    status: 'idle',
    mediaKind: 'unknown',
    item: null,
    currentSeconds: 0,
    durationSeconds: 120,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null
  } as const;

  readonly calls: Array<{ method: string; args?: unknown }> = [];
  loadError: unknown = null;

  async loadAndPlay(args: unknown): Promise<void> {
    this.calls.push({ method: 'loadAndPlay', args });
    if (this.loadError) {
      throw this.loadError;
    }
  }

  async togglePlayPause(): Promise<void> {
    this.calls.push({ method: 'togglePlayPause' });
  }

  stop(): void {
    this.calls.push({ method: 'stop' });
  }

  seekToSeconds(seconds: number): void {
    this.calls.push({ method: 'seekToSeconds', args: seconds });
  }

  setVolume(volume: number): void {
    this.calls.push({ method: 'setVolume', args: volume });
  }

  setMuted(muted: boolean): void {
    this.calls.push({ method: 'setMuted', args: muted });
  }
}

function createActiveHost(overrides: Partial<SavedKodiHost> = {}): SavedKodiHost {
  return {
    id: 'living-room',
    label: 'Living Room',
    host: 'kodi.local',
    port: 8080,
    username: 'admin',
    password: 'p@ssword',
    useTls: false,
    useWebSocket: true,
    ...overrides
  };
}

function createSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'none',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: null,
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    activePlayers: [],
    primaryPlayer: null,
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
  const playerStore = new FakePlayerStore();
  const localPlayerStore = new FakeLocalPlayerStore();
  const configStore = { activeHost: createActiveHost() } as unknown as {
    activeHost: SavedKodiHost | null;
  };

  const dispatch = createPlayerDispatch({
    playerStore,
    localPlayerStore: localPlayerStore as never,
    configStore: configStore as never,
    createClient: () => client,
    now: () => '2026-01-02T00:00:00.000Z'
  });

  return { client, dispatch, playerStore, localPlayerStore, configStore };
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local/jsonrpc');
  expect(serialized).not.toContain('localStorage');
}

function createMoviePlayerSnapshot(
  overrides: Partial<PlayerStoreSnapshot> = {}
): PlayerStoreSnapshot {
  return createSnapshot({
    activePlayers: [{ playerid: 7, type: 'video' }],
    primaryPlayer: { playerid: 7, type: 'video' },
    playbackStatus: 'active',
    item: {
      file: 'smb://nas/movies/arrival.mkv',
      label: 'Arrival',
      title: 'Arrival',
      type: 'movie',
      movieid: 4401
    },
    properties: { speed: 1, type: 'video' },
    ...overrides
  });
}

function createEpisodePlayerSnapshot(
  overrides: Partial<PlayerStoreSnapshot> = {}
): PlayerStoreSnapshot {
  return createSnapshot({
    activePlayers: [{ playerid: 7, type: 'video' }],
    primaryPlayer: { playerid: 7, type: 'video' },
    playbackStatus: 'active',
    item: {
      file: 'smb://nas/tv/severance/s02e01.mkv',
      label: 'Hello, Ms. Cobel',
      title: 'Hello, Ms. Cobel',
      showtitle: 'Severance',
      type: 'episode',
      episodeid: 8801
    },
    properties: { speed: 1, type: 'video' },
    ...overrides
  });
}

function createMusicVideoPlayerSnapshot(
  overrides: Partial<PlayerStoreSnapshot> = {}
): PlayerStoreSnapshot {
  return createSnapshot({
    activePlayers: [{ playerid: 7, type: 'video' }],
    primaryPlayer: { playerid: 7, type: 'video' },
    playbackStatus: 'active',
    item: {
      file: 'smb://nas/videos/live-cut.mkv',
      label: 'Live cut',
      title: 'Live cut',
      type: 'musicvideo',
      musicvideoid: 7701,
      thumbnail: 'image://musicvideo-live-cut.jpg/'
    },
    properties: { speed: 1, type: 'video' },
    ...overrides
  });
}

describe('active Kodi client resolution', () => {
  it('converts a saved Kodi host into an HTTP host without exposing summaries', () => {
    const host = savedKodiHostToKodiHttpHost({
      id: 'living-room',
      label: 'Living Room',
      host: 'kodi.local',
      port: 8088,
      username: 'admin',
      password: 'p@ssword',
      useTls: true,
      useWebSocket: true
    });

    expect(host).toEqual({
      host: 'kodi.local',
      port: 8088,
      username: 'admin',
      password: 'p@ssword',
      useTls: true
    });
  });

  it('returns null when no active saved host is configured', () => {
    const configStore = createConfigStore({ storage: null });

    expect(createActiveKodiJsonRpcHttpClient({ configStore })).toBeNull();
  });
});

describe('player dispatch', () => {
  it('starts with Kodi mode and inspectable idle command state', () => {
    const { dispatch } = createHarness();

    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    });
  });

  it('opens song, album, and artist music items through Player.Open without requiring an active player', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.Open', 'OK');

    await dispatch.playMusicItem({ kind: 'song', songid: 42 });
    await dispatch.playMusicItem({ kind: 'album', albumid: 7 });
    await dispatch.playMusicItem({ kind: 'artist', artistid: 3 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { songid: 42 } } },
      { method: 'Player.Open', params: { item: { albumid: 7 } } },
      { method: 'Player.Open', params: { item: { artistid: 3 } } }
    ]);
    expect(playerStore.refreshReasons).toEqual([
      'command:playMusicItem',
      'command:playMusicItem',
      'command:playMusicItem'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playMusicItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('opens movie items through Player.Open with optional resume and without requiring an active player', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.Open', 'OK');
    const movieDispatch = dispatch as PlayerDispatchWithMovies;

    await movieDispatch.playMovieItem({ movieid: 4401 });
    await movieDispatch.playMovieItem({ movieid: 4401, resume: true });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.Open', params: { item: { movieid: 4401 }, options: { resume: true } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playMovieItem', 'command:playMovieItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playMovieItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('stops Local playback only after movie Player.Open succeeds', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithMovies).playMovieItem({ movieid: 4401, resume: true });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 }, options: { resume: true } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playMovieItem']);
    expect(localPlayerStore.calls).toEqual([{ method: 'stop' }]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playMovieItem',
      lastError: null
    });
  });

  it('rejects invalid movie playback ids before calling Kodi or refreshing', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidItems = [
      { movieid: 0 },
      { movieid: -1 },
      { movieid: 1.5 },
      { movieid: Number.POSITIVE_INFINITY },
      { movieid: Number.NaN },
      { movieid: '4401' },
      { movieid: Number.MAX_SAFE_INTEGER + 1 },
      { movieid: 4401, resume: 'yes' },
      { movieid: 4401, file: 'smb://nas/movies/leak.mkv' }
    ];

    for (const item of invalidItems) {
      await (dispatch as PlayerDispatchWithMovies).playMovieItem(item);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'playMovieItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-movie-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active-host client state for movie playback without Kodi calls or refresh', async () => {
    const playerStore = new FakePlayerStore();
    const dispatch = createPlayerDispatch({
      playerStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await (dispatch as PlayerDispatchWithMovies).playMovieItem({ movieid: 4401 });

    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playMovieItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('sanitizes movie playback command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    client.enqueue(
      'Player.Open',
      new Error(
        'movie failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://nas/movies/leak.mkv from localStorage raw body'
      )
    );

    await (dispatch as PlayerDispatchWithMovies).playMovieItem({ movieid: 4401 });

    expect(client.calls).toEqual([{ method: 'Player.Open', params: { item: { movieid: 4401 } } }]);
    expect(playerStore.refreshReasons).toEqual(['command:playMovieItem']);
    expect(localPlayerStore.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'error',
      lastCommand: 'playMovieItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('streams a movie through Kodi open, refreshed file resolution, prepared Local URL, and Kodi pause', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    playerStore.enqueueRefreshSnapshot(createMoviePlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/arrival.mkv' },
      mode: 'redirect'
    });

    await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem({ movieid: 4401 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/movies/arrival.mkv' } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:streamMovieItem']);
    expect(localPlayerStore.calls).toHaveLength(1);
    expect(localPlayerStore.calls[0]).toEqual({
      method: 'loadAndPlay',
      args: {
        source: 'http://kodi.local:8080/vfs/arrival.mkv',
        mediaKind: 'video',
        kodiWasPaused: true,
        item: { label: 'Arrival', title: 'Arrival', type: 'movie', movieid: 4401 }
      }
    });
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'streamMovieItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
    expectSecretSafe(dispatch.snapshot);
    expectSecretSafe(localPlayerStore.calls);
  });

  it('streams a movie with the resume option through the curated movie wrapper', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.enqueueRefreshSnapshot(createMoviePlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/arrival.mkv' },
      mode: 'redirect'
    });
    client.enqueue('Player.PlayPause', { speed: 0 });

    await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem({
      movieid: 4401,
      resume: true
    });

    expect(client.calls[0]).toEqual({
      method: 'Player.Open',
      params: { item: { movieid: 4401 }, options: { resume: true } }
    });
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'streamMovieItem'
    });
  });

  it('rejects invalid movie stream ids before calling Kodi or Local playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidItems = [
      { movieid: 0 },
      { movieid: -1 },
      { movieid: 1.5 },
      { movieid: Number.POSITIVE_INFINITY },
      { movieid: Number.NaN },
      { movieid: '4401' },
      { movieid: Number.MAX_SAFE_INTEGER + 1 },
      { movieid: 4401, resume: 'yes' },
      { movieid: 4401, file: 'smb://nas/movies/leak.mkv' }
    ];

    for (const item of invalidItems) {
      await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem(item);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'streamMovieItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-movie-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active-host client state for movie streaming without Kodi calls or refresh', async () => {
    const playerStore = new FakePlayerStore();
    const dispatch = createPlayerDispatch({
      playerStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem({ movieid: 4401 });

    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'streamMovieItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('requires one active video player and a file after opening a movie for streaming', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidSnapshots = [
      createSnapshot({ activePlayers: [], primaryPlayer: null }),
      createSnapshot({
        playbackStatus: 'multiple',
        activePlayers: [
          { playerid: 2, type: 'audio' },
          { playerid: 7, type: 'video' }
        ],
        primaryPlayer: { playerid: 7, type: 'video' }
      }),
      createSnapshot({
        activePlayers: [{ playerid: 2, type: 'audio' }],
        primaryPlayer: { playerid: 2, type: 'audio' },
        item: { file: 'smb://nas/music/song.flac', label: 'Song', type: 'song' }
      }),
      createMoviePlayerSnapshot({ item: { label: 'Arrival', title: 'Arrival', type: 'movie' } })
    ];

    for (const snapshot of invalidSnapshots) {
      playerStore.enqueueRefreshSnapshot(snapshot);
      client.enqueue('Player.Open', 'OK');
      await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem({ movieid: 4401 });
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'streamMovieItem'
      });
    }

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.Open', params: { item: { movieid: 4401 } } }
    ]);
    expect(client.calls.some((call) => call.method === 'Files.PrepareDownload')).toBe(false);
    expect(client.calls.some((call) => call.method === 'Player.PlayPause')).toBe(false);
    expect(playerStore.refreshReasons).toEqual([
      'command:streamMovieItem',
      'command:streamMovieItem',
      'command:streamMovieItem',
      'command:streamMovieItem'
    ]);
    expect(localPlayerStore.calls).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('does not pause Kodi when movie stream preparation fails and keeps diagnostics redacted', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.enqueueRefreshSnapshot(createMoviePlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue(
      'Files.PrepareDownload',
      new Error(
        'prepare failed for smb://nas/movies/arrival.mkv Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc localStorage'
      )
    );

    await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem({ movieid: 4401 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/movies/arrival.mkv' } }
    ]);
    expect(localPlayerStore.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'streamMovieItem',
      lastError: { source: 'command', code: 'command/prepare-download-failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('records Local load failures after pausing Kodi for movie streaming', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.enqueueRefreshSnapshot(createMoviePlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/arrival.mkv' },
      mode: 'redirect'
    });
    localPlayerStore.loadError = new Error(
      'local load rejected for http://admin:p@ssword@kodi.local/vfs/arrival.mkv Authorization: Basic token localStorage'
    );

    await (dispatch as PlayerDispatchWithMovieStream).streamMovieItem({ movieid: 4401 });

    expect(client.calls.map((call) => call.method)).toEqual([
      'Player.Open',
      'Player.PlayPause',
      'Files.PrepareDownload'
    ]);
    expect(localPlayerStore.calls[0]?.method).toBe('loadAndPlay');
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'error',
      lastCommand: 'streamMovieItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('opens episode items through Player.Open with optional resume and without requiring an active player', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.Open', 'OK');
    const episodeDispatch = dispatch as PlayerDispatchWithEpisodes;

    await episodeDispatch.playEpisodeItem({ episodeid: 8801 });
    await episodeDispatch.playEpisodeItem({ episodeid: 8801, resume: true });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { episodeid: 8801 } } },
      { method: 'Player.Open', params: { item: { episodeid: 8801 }, options: { resume: true } } }
    ]);
    expect(playerStore.refreshReasons).toEqual([
      'command:playEpisodeItem',
      'command:playEpisodeItem'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playEpisodeItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('opens music video items through Player.Open without requiring an active player', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithMusicVideos).playMusicVideoItem({ musicvideoid: 7701 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { musicvideoid: 7701 } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playMusicVideoItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playMusicVideoItem',
      lastError: null
    });
  });

  it('streams a music video through Kodi open, prepared Local URL, and Kodi pause', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    playerStore.enqueueRefreshSnapshot(createMusicVideoPlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/live-cut.mkv' },
      mode: 'redirect'
    });

    await (dispatch as PlayerDispatchWithMusicVideos).streamMusicVideoItem({ musicvideoid: 7701 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { musicvideoid: 7701 } } },
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/videos/live-cut.mkv' } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:streamMusicVideoItem']);
    expect(localPlayerStore.calls).toEqual([
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/live-cut.mkv',
          mediaKind: 'video',
          kodiWasPaused: true,
          item: {
            label: 'Live cut',
            title: 'Live cut',
            type: 'musicvideo',
            musicvideoid: 7701,
            thumbnail: 'image://musicvideo-live-cut.jpg/'
          }
        }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'streamMusicVideoItem',
      lastError: null
    });
    expectSecretSafe(dispatch.snapshot);
    expectSecretSafe(localPlayerStore.calls);
  });

  it('stops Local playback only after episode Player.Open succeeds', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithEpisodes).playEpisodeItem({
      episodeid: 8801,
      resume: true
    });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { episodeid: 8801 }, options: { resume: true } } }
    ]);
    expect(localPlayerStore.calls).toEqual([{ method: 'stop' }]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playEpisodeItem',
      lastError: null
    });
  });

  it('rejects invalid episode playback and stream inputs before calling Kodi or Local playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidItems = [
      {},
      { episodeid: 0 },
      { episodeid: -1 },
      { episodeid: 1.5 },
      { episodeid: Number.POSITIVE_INFINITY },
      { episodeid: '8801' },
      { episodeid: Number.MAX_SAFE_INTEGER + 1 },
      { episodeid: 8801, resume: 'yes' },
      { episodeid: 8801, file: 'smb://nas/tv/leak.mkv' },
      { episodeid: 8801, label: 'smb://nas/tv/leak.mkv' }
    ];

    for (const item of invalidItems) {
      await (dispatch as PlayerDispatchWithEpisodes).playEpisodeItem(item);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'playEpisodeItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-episode-item' }
      });

      await (dispatch as PlayerDispatchWithEpisodes).streamEpisodeItem(item);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'streamEpisodeItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-episode-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active-host client state for episode playback and streaming without refresh', async () => {
    const playerStore = new FakePlayerStore();
    const dispatch = createPlayerDispatch({
      playerStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    }) as PlayerDispatchWithEpisodes;

    await dispatch.playEpisodeItem({ episodeid: 8801 });
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playEpisodeItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });

    await dispatch.streamEpisodeItem({ episodeid: 8801 });
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'streamEpisodeItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
    expect(playerStore.refreshReasons).toEqual([]);
  });

  it('sanitizes episode playback command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    client.enqueue(
      'Player.Open',
      new Error(
        'episode failed for Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc smb://nas/tv/leak.mkv from localStorage raw body'
      )
    );

    await (dispatch as PlayerDispatchWithEpisodes).playEpisodeItem({ episodeid: 8801 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { episodeid: 8801 } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playEpisodeItem']);
    expect(localPlayerStore.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'error',
      lastCommand: 'playEpisodeItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('streams an episode through Kodi open, refreshed file resolution, prepared Local URL, and Kodi pause', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    playerStore.enqueueRefreshSnapshot(createEpisodePlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/severance-s02e01.mkv' },
      mode: 'redirect'
    });

    await (dispatch as PlayerDispatchWithEpisodes).streamEpisodeItem({
      episodeid: 8801,
      title: 'Hello, Ms. Cobel'
    });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { episodeid: 8801 } } },
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/tv/severance/s02e01.mkv' } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:streamEpisodeItem']);
    expect(localPlayerStore.calls).toEqual([
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/severance-s02e01.mkv',
          mediaKind: 'video',
          kodiWasPaused: true,
          item: {
            label: 'Hello, Ms. Cobel',
            title: 'Hello, Ms. Cobel',
            type: 'episode',
            episodeid: 8801
          }
        }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'streamEpisodeItem',
      lastError: null
    });
    expectSecretSafe(dispatch.snapshot);
    expectSecretSafe(localPlayerStore.calls);
  });

  it('records Local load failures after pausing Kodi for episode streaming', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.enqueueRefreshSnapshot(createEpisodePlayerSnapshot());
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/severance-s02e01.mkv' },
      mode: 'redirect'
    });
    localPlayerStore.loadError = new Error(
      'local load rejected for http://admin:p@ssword@kodi.local/vfs/episode.mkv Authorization: Basic token localStorage'
    );

    await (dispatch as PlayerDispatchWithEpisodes).streamEpisodeItem({ episodeid: 8801 });

    expect(client.calls.map((call) => call.method)).toEqual([
      'Player.Open',
      'Player.PlayPause',
      'Files.PrepareDownload'
    ]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'error',
      lastCommand: 'streamEpisodeItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('opens audio file items through Player.Open and refreshes with file-specific command state', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithFiles).playFileItem({
      file: 'smb://nas/music/special.mp3',
      mediaKind: 'audio'
    });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { file: 'smb://nas/music/special.mp3' } } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playFileItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playFileItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('opens video file browser items through Kodi even when Local mode is selected', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithFiles).playFileItem({
      file: 'smb://nas/videos/Big Buck Bunny.mkv',
      mediaKind: 'video'
    });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { file: 'smb://nas/videos/Big Buck Bunny.mkv' } } }
    ]);
    expect(localPlayerStore.calls).toEqual([{ method: 'stop' }]);
    expect(playerStore.refreshReasons).toEqual(['command:playFileItem']);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playFileItem',
      lastError: null
    });
  });

  it('opens browser directory items through Kodi directory playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithFiles).playFileItem({
      file: 'smb://nas/music/Albums/',
      mediaKind: 'audio',
      itemType: 'directory'
    });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { directory: 'smb://nas/music/Albums/' } } }
    ]);
    expect(localPlayerStore.calls).toEqual([{ method: 'stop' }]);
    expect(playerStore.refreshReasons).toEqual(['command:playFileItem']);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playFileItem'
    });
  });

  it('plays smart playlist files through Player.Open without active-player resolution or Local stream preparation', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithPlaylists).playPlaylistItem({
      file: 'special://profile/playlists/music/recent.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Player.Open',
        params: { item: { file: 'special://profile/playlists/music/recent.xsp' } }
      }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playPlaylistItem']);
    expect(localPlayerStore.calls).toEqual([{ method: 'stop' }]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playPlaylistItem',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('plays video smart playlist files through Player.Open', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithPlaylists).playPlaylistItem({
      file: 'special://profile/playlists/video/recent.xsp',
      mediaKind: 'video',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Player.Open',
        params: { item: { file: 'special://profile/playlists/video/recent.xsp' } }
      }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playPlaylistItem']);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playPlaylistItem',
      lastError: null
    });
  });

  it('plays standard playlist files through Player.Open', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue('Player.Open', 'OK');

    await (dispatch as PlayerDispatchWithPlaylists).playPlaylistItem({
      file: 'special://profile/playlists/music/party.m3u',
      mediaKind: 'music',
      playlistKind: 'basic'
    });

    expect(client.calls).toEqual([
      {
        method: 'Player.Open',
        params: { item: { file: 'special://profile/playlists/music/party.m3u' } }
      }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playPlaylistItem']);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'playPlaylistItem',
      lastError: null
    });
  });

  it('stops Local mode only after playlist Player.Open succeeds', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.snapshot = createSnapshot({ activePlayers: [], primaryPlayer: null });
    client.enqueue(
      'Player.Open',
      new Error('Kodi rejected smb://secret/song.flac Authorization: Basic token')
    );

    await (dispatch as PlayerDispatchWithPlaylists).playPlaylistItem({
      file: 'special://profile/playlists/music/recent.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(client.calls).toEqual([
      {
        method: 'Player.Open',
        params: { item: { file: 'special://profile/playlists/music/recent.xsp' } }
      }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playPlaylistItem']);
    expect(localPlayerStore.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'error',
      lastCommand: 'playPlaylistItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('rejects invalid playlist playback inputs before calling Kodi or Local playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidItems = [
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

    for (const item of invalidItems) {
      await (dispatch as PlayerDispatchWithPlaylists).playPlaylistItem(item);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'playPlaylistItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-playlist-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active-host client state for playlist playback without Kodi calls or refresh', async () => {
    const playerStore = new FakePlayerStore();
    const dispatch = createPlayerDispatch({
      playerStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await (dispatch as PlayerDispatchWithPlaylists).playPlaylistItem({
      file: 'special://profile/playlists/music/recent.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });

    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playPlaylistItem',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('plays audio file items locally through prepared stream URLs without exposing raw file paths in public errors', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/special.mp3' },
      mode: 'redirect'
    });

    await (dispatch as PlayerDispatchWithFiles).playFileItem({
      file: 'smb://nas/music/special.mp3',
      mediaKind: 'audio'
    });

    expect(client.calls).toEqual([
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/special.mp3' } }
    ]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls[0]?.method).toBe('loadAndPlay');
    expect(localPlayerStore.calls[0]?.args).toMatchObject({
      source: 'http://kodi.local:8080/vfs/special.mp3',
      mediaKind: 'audio',
      kodiWasPaused: false,
      item: { label: 'File item', type: 'file' }
    });
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'playFileItem',
      lastError: null
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('uses browser local playlist context for local next and previous without asking Kodi to change tracks', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const fileDispatch = dispatch as PlayerDispatchWithFiles;
    dispatch.setMode('local');
    fileDispatch.setLocalFilePlaylist(
      [
        {
          file: 'smb://nas/music/first.mp3',
          mediaKind: 'audio',
          label: 'First Track',
          type: 'song'
        },
        {
          file: 'smb://nas/music/second.mp3',
          mediaKind: 'audio',
          label: 'Second Track',
          type: 'song'
        }
      ],
      'smb://nas/music/first.mp3'
    );
    expect(fileDispatch.canNavigateLocalFilePlaylist()).toBe(true);
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/first.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/second.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/first.mp3' },
      mode: 'redirect'
    });

    await fileDispatch.playFileItem({
      file: 'smb://nas/music/first.mp3',
      mediaKind: 'audio'
    });
    await dispatch.next();
    await dispatch.previous();

    expect(client.calls).toEqual([
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/first.mp3' } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/second.mp3' } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/first.mp3' } }
    ]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls).toEqual([
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/first.mp3',
          mediaKind: 'audio',
          kodiWasPaused: false,
          item: { label: 'First Track', type: 'song' }
        }
      },
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/second.mp3',
          mediaKind: 'audio',
          kodiWasPaused: false,
          item: { label: 'Second Track', type: 'song' }
        }
      },
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/first.mp3',
          mediaKind: 'audio',
          kodiWasPaused: false,
          item: { label: 'First Track', type: 'song' }
        }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'previous',
      lastError: null
    });
  });

  it('uses local shuffle to skip sequential local next selection', async () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      const { client, dispatch, localPlayerStore } = createHarness();
      const fileDispatch = dispatch as PlayerDispatchWithFiles;
      dispatch.setMode('local');
      fileDispatch.setLocalFilePlaylist(
        [
          { file: 'smb://nas/music/first.mp3', mediaKind: 'audio', label: 'First Track' },
          { file: 'smb://nas/music/second.mp3', mediaKind: 'audio', label: 'Second Track' },
          { file: 'smb://nas/music/third.mp3', mediaKind: 'audio', label: 'Third Track' }
        ],
        'smb://nas/music/first.mp3'
      );
      client.enqueue('Files.PrepareDownload', {
        details: { path: '/vfs/first.mp3' },
        mode: 'redirect'
      });
      client.enqueue('Files.PrepareDownload', {
        details: { path: '/vfs/second.mp3' },
        mode: 'redirect'
      });

      await fileDispatch.playFileItem({
        file: 'smb://nas/music/first.mp3',
        mediaKind: 'audio'
      });
      await dispatch.setShuffle(true);
      await dispatch.next();

      expect(client.calls).toEqual([
        { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/first.mp3' } },
        { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/second.mp3' } }
      ]);
      expect(localPlayerStore.calls.at(-1)).toEqual({
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/second.mp3',
          mediaKind: 'audio',
          kodiWasPaused: false,
          item: { label: 'Second Track', type: 'file' }
        }
      });
    } finally {
      Math.random = originalRandom;
    }
  });

  it('rejects invalid file playback items before calling Kodi or Local playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidItems = [
      { file: '', mediaKind: 'audio' },
      { file: '   ', mediaKind: 'audio' },
      { file: 42, mediaKind: 'audio' },
      { file: 'smb://nas/music/special.mp3', mediaKind: 'unknown' },
      { kind: 'song', songid: 42, file: 'smb://nas/music/special.mp3', mediaKind: 'audio' }
    ];

    for (const item of invalidItems) {
      await (dispatch as PlayerDispatchWithFiles).playFileItem(item);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'playFileItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-file-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('sanitizes file playback preparation and local load failures', async () => {
    const { client, dispatch, localPlayerStore } = createHarness();
    dispatch.setMode('local');
    client.enqueue('Files.PrepareDownload', {
      details: { path: '' },
      mode: 'redirect'
    });

    await (dispatch as PlayerDispatchWithFiles).playFileItem({
      file: 'smb://nas/music/special.mp3',
      mediaKind: 'audio'
    });

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playFileItem',
      lastError: { source: 'command', code: 'command/prepare-download-missing-path' }
    });
    expectSecretSafe(dispatch.snapshot);

    client.enqueue('Files.PrepareDownload', {
      details: { path: 'http://admin:p@ssword@kodi.local:8080/vfs/special.mp3' },
      mode: 'redirect'
    });
    localPlayerStore.loadError = new Error(
      'local load rejected for http://admin:p@ssword@kodi.local/vfs/special.mp3 Authorization: Basic token localStorage'
    );

    await (dispatch as PlayerDispatchWithFiles).playFileItem({
      file: 'smb://nas/music/special.mp3',
      mediaKind: 'audio'
    });

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playFileItem',
      lastError: { source: 'command', code: 'command/failed' }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('rejects malformed music playback items before calling Kodi', async () => {
    const { client, dispatch, playerStore } = createHarness();
    const invalidItems = [
      { kind: 'song', songid: Number.NaN },
      { kind: 'song', songid: Number.POSITIVE_INFINITY },
      { kind: 'song', songid: 0 },
      { kind: 'album', albumid: -1 },
      { kind: 'artist', artistid: 1.5 },
      { kind: 'song', songid: 42, albumid: 7 },
      {},
      { kind: 'genre', genreid: 9 },
      { kind: 'song', songid: 42, file: 'smb://nas/music/leak.flac' }
    ];

    for (const item of invalidItems) {
      await dispatch.playMusicItem(item as never);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'error',
        lastCommand: 'playMusicItem',
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: { source: 'input', code: 'input/invalid-music-item' }
      });
    }

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expectSecretSafe(dispatch.snapshot);
  });

  it('reports missing active-host client state for music playback without Kodi calls or refresh', async () => {
    const playerStore = new FakePlayerStore();
    const dispatch = createPlayerDispatch({
      playerStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await dispatch.playMusicItem({ kind: 'song', songid: 42 });

    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playMusicItem',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'config',
        code: 'config/no-active-host'
      }
    });
  });

  it('sanitizes music playback command failures and refreshes after Kodi was reached', async () => {
    const { client, dispatch, playerStore } = createHarness();
    client.enqueue(
      'Player.Open',
      new KodiHttpClientError({
        code: 'auth',
        method: 'Player.Open',
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

    await dispatch.playMusicItem({ kind: 'song', songid: 42 });

    expect(client.calls).toEqual([{ method: 'Player.Open', params: { item: { songid: 42 } } }]);
    expect(playerStore.refreshReasons).toEqual(['command:playMusicItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playMusicItem',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured credentials while calling Player.Open.'
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('keeps music playback success inspectable when the follow-up refresh fails', async () => {
    const { client, dispatch, playerStore } = createHarness();
    client.enqueue('Player.Open', 'OK');
    playerStore.refreshError = new Error(
      'refresh failed with admin:p@ssword Authorization: Basic token smb://nas/music/leak.flac localStorage raw-body'
    );

    await dispatch.playMusicItem({ kind: 'album', albumid: 7 });

    expect(client.calls).toEqual([{ method: 'Player.Open', params: { item: { albumid: 7 } } }]);
    expect(playerStore.refreshReasons).toEqual(['command:playMusicItem']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playMusicItem',
      lastError: null
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('calls play/pause through the wrapper and refreshes authoritative player state', async () => {
    const { client, dispatch, playerStore } = createHarness();
    client.enqueue('Player.PlayPause', { speed: 0 });

    await dispatch.playPause();

    expect(client.calls).toEqual([{ method: 'Player.PlayPause', params: { playerid: 7 } }]);
    expect(playerStore.refreshReasons).toEqual(['command:playPause']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'playPause',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('routes all Kodi command methods with exact wrapper parameter shapes', async () => {
    const { client, dispatch, playerStore } = createHarness();
    for (const method of [
      'Player.Stop',
      'Player.GoTo',
      'Player.GoTo',
      'Player.Seek',
      'Player.Seek',
      'Player.Seek',
      'Application.SetVolume',
      'Application.SetMute',
      'Player.SetShuffle',
      'Player.SetPartymode',
      'Player.SetRepeat',
      'Player.SetAudioStream',
      'Player.SetSubtitle'
    ]) {
      client.enqueue(method, method === 'Application.SetMute' ? true : 'OK');
    }

    await dispatch.stop();
    await dispatch.previous();
    await dispatch.next();
    await dispatch.seekPercentage(64.5);
    await dispatch.seekRelativeSeconds(-30);
    await dispatch.seekStep('bigforward');
    await dispatch.setVolume(101);
    await dispatch.toggleMute();
    await dispatch.setShuffle(true);
    await dispatch.setPartyMode('toggle');
    await dispatch.setRepeat('cycle');
    await dispatch.setAudioStream('next');
    await dispatch.setSubtitle('off');

    expect(client.calls).toEqual([
      { method: 'Player.Stop', params: { playerid: 7 } },
      { method: 'Player.GoTo', params: { playerid: 7, to: 'previous' } },
      { method: 'Player.GoTo', params: { playerid: 7, to: 'next' } },
      { method: 'Player.Seek', params: { playerid: 7, value: { percentage: 64.5 } } },
      { method: 'Player.Seek', params: { playerid: 7, value: { seconds: -30 } } },
      { method: 'Player.Seek', params: { playerid: 7, value: { step: 'bigforward' } } },
      { method: 'Application.SetVolume', params: { volume: 100 } },
      { method: 'Application.SetMute', params: { mute: 'toggle' } },
      { method: 'Player.SetShuffle', params: { playerid: 7, shuffle: true } },
      { method: 'Player.SetPartymode', params: { playerid: 7, partymode: 'toggle' } },
      { method: 'Player.SetRepeat', params: { playerid: 7, repeat: 'cycle' } },
      { method: 'Player.SetAudioStream', params: { playerid: 7, stream: 'next' } },
      { method: 'Player.SetSubtitle', params: { playerid: 7, subtitle: 'off' } }
    ]);
    expect(playerStore.refreshReasons).toEqual([
      'command:stop',
      'command:previous',
      'command:next',
      'command:seekPercentage',
      'command:seekRelativeSeconds',
      'command:seekStep',
      'command:setVolume',
      'command:toggleMute',
      'command:setShuffle',
      'command:setPartyMode',
      'command:setRepeat',
      'command:setAudioStream',
      'command:setSubtitle'
    ]);
  });

  it('routes supported commands through LocalPlayerStore when mode is local', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');

    await dispatch.playPause();
    await dispatch.stop();
    await dispatch.seekRelativeSeconds(15);
    await dispatch.setVolume(42);
    await dispatch.toggleMute();

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(localPlayerStore.calls.map((call) => call.method)).toEqual([
      'togglePlayPause',
      'stop',
      'seekToSeconds',
      'setVolume',
      'setMuted'
    ]);
  });

  it('uses Kodi playlist navigation to move between tracks while staying in Local mode', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.enqueueRefreshSnapshot(
      createSnapshot({
        activePlayers: [{ playerid: 7, type: 'audio' }],
        primaryPlayer: { playerid: 7, type: 'audio' },
        playbackStatus: 'active',
        item: { file: 'smb://nas/music/next.mp3', label: 'Next Track', type: 'song', id: 44 },
        properties: { speed: 1, type: 'audio' }
      })
    );
    client.enqueue('Player.GoTo', 'OK');
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/next.mp3' },
      mode: 'redirect'
    });

    await dispatch.next();

    expect(client.calls).toEqual([
      { method: 'Player.GoTo', params: { playerid: 7, to: 'next' } },
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/next.mp3' } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:next']);
    expect(localPlayerStore.calls).toEqual([
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/next.mp3',
          item: { id: 44, label: 'Next Track', type: 'song' },
          mediaKind: 'audio',
          kodiWasPaused: true
        }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'next',
      lastError: null
    });
  });

  it('waits for Kodi to report a changed file before loading local next playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.enqueueRefreshSnapshot(
      createSnapshot({
        activePlayers: [{ playerid: 7, type: 'audio' }],
        primaryPlayer: { playerid: 7, type: 'audio' },
        playbackStatus: 'active',
        item: { file: 'smb://nas/music/special.mp3', label: 'Special', type: 'song', id: 9 },
        properties: { speed: 1, type: 'audio' }
      })
    );
    playerStore.enqueueRefreshSnapshot(
      createSnapshot({
        activePlayers: [{ playerid: 7, type: 'audio' }],
        primaryPlayer: { playerid: 7, type: 'audio' },
        playbackStatus: 'active',
        item: { file: 'smb://nas/music/later.mp3', label: 'Later Track', type: 'song', id: 45 },
        properties: { speed: 1, type: 'audio' }
      })
    );
    client.enqueue('Player.GoTo', 'OK');
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/later.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Player.PlayPause', { speed: 0 });

    await dispatch.next();

    expect(playerStore.refreshReasons).toEqual(['command:next', 'command:next']);
    expect(localPlayerStore.calls).toEqual([
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/later.mp3',
          item: { id: 45, label: 'Later Track', type: 'song' },
          mediaKind: 'audio',
          kodiWasPaused: true
        }
      }
    ]);
  });

  it('plays music library items locally when Local mode is already selected', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    dispatch.setMode('local');
    playerStore.enqueueRefreshSnapshot(
      createSnapshot({
        activePlayers: [{ playerid: 7, type: 'audio' }],
        primaryPlayer: { playerid: 7, type: 'audio' },
        playbackStatus: 'active',
        item: {
          file: 'smb://nas/music/bayani/opening-salvo.mp3',
          label: 'Opening Salvo',
          type: 'song',
          id: 166,
          thumbnail: 'image://album-cover/'
        },
        properties: { speed: 1, type: 'audio' }
      })
    );
    client.enqueue('Player.Open', 'OK');
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/opening-salvo.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Player.PlayPause', { speed: 0 });

    await dispatch.playMusicItem({ kind: 'album', albumid: 24 });

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { albumid: 24 } } },
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      {
        method: 'Files.PrepareDownload',
        params: { path: 'smb://nas/music/bayani/opening-salvo.mp3' }
      }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:playMusicItem']);
    expect(localPlayerStore.calls).toEqual([
      {
        method: 'loadAndPlay',
        args: {
          source: 'http://kodi.local:8080/vfs/opening-salvo.mp3',
          item: {
            id: 166,
            label: 'Opening Salvo',
            type: 'song',
            thumbnail: 'image://album-cover/'
          },
          mediaKind: 'audio',
          kodiWasPaused: true
        }
      }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'playMusicItem',
      lastError: null
    });
  });

  it('starts local playback from a fresh Kodi snapshot, pauses Kodi, then prepares a stream URL', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();

    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/special.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Player.PlayPause', { speed: 0 });

    await dispatch.startLocalPlayback();

    expect(client.calls).toEqual([
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/special.mp3' } }
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:startLocalPlayback']);

    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'startLocalPlayback'
    });

    expect(localPlayerStore.calls[0]?.method).toBe('loadAndPlay');
    const serializedArgs = JSON.stringify(localPlayerStore.calls[0]?.args);
    expect(serializedArgs).toContain('http://kodi.local:8080/vfs/special.mp3');
    expect(serializedArgs).not.toContain('smb://nas/music/special.mp3');
  });

  it('refreshes stale Kodi state before starting local playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot({
      activePlayers: [],
      primaryPlayer: null,
      item: null,
      properties: { speed: 0, type: 'audio' }
    });
    playerStore.enqueueRefreshSnapshot(
      createSnapshot({
        activePlayers: [{ playerid: 7, type: 'audio' }],
        primaryPlayer: { playerid: 7, type: 'audio' },
        playbackStatus: 'active',
        item: { file: 'smb://nas/music/fresh.mp3', label: 'Fresh', type: 'song', id: 42 },
        properties: { speed: 1, type: 'audio' }
      })
    );
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/fresh.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Player.PlayPause', { speed: 0 });

    await dispatch.startLocalPlayback();

    expect(playerStore.refreshReasons).toEqual(['command:startLocalPlayback']);
    expect(client.calls).toEqual([
      { method: 'Player.PlayPause', params: { playerid: 7 } },
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/fresh.mp3' } }
    ]);
    expect(localPlayerStore.calls[0]?.args).toMatchObject({
      source: 'http://kodi.local:8080/vfs/fresh.mp3',
      item: { label: 'Fresh', type: 'song' },
      mediaKind: 'audio',
      kodiWasPaused: true
    });
    expect(dispatch.snapshot).toMatchObject({
      mode: 'local',
      commandStatus: 'success',
      lastCommand: 'startLocalPlayback'
    });
  });

  it('does not start local playback when Kodi pause fails', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    client.enqueue(
      'Player.PlayPause',
      new KodiHttpClientError({
        code: 'auth',
        method: 'Player.PlayPause',
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

    await dispatch.startLocalPlayback();

    expect(client.calls).toEqual([{ method: 'Player.PlayPause', params: { playerid: 7 } }]);
    expect(playerStore.refreshReasons).toEqual(['command:startLocalPlayback']);
    expect(localPlayerStore.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'startLocalPlayback',
      lastError: { source: 'http', code: 'auth' }
    });
  });

  it('does not start local playback when stream preparation fails', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue(
      'Files.PrepareDownload',
      new KodiHttpClientError({
        code: 'network',
        method: 'Files.PrepareDownload',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        }
      })
    );

    await dispatch.startLocalPlayback();

    expect(client.calls.map((call) => call.method)).toEqual([
      'Player.PlayPause',
      'Files.PrepareDownload'
    ]);
    expect(playerStore.refreshReasons).toEqual(['command:startLocalPlayback']);
    expect(localPlayerStore.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'startLocalPlayback',
      lastError: { source: 'http', code: 'network' }
    });
  });

  it('records a failed local media start attempt while leaving Kodi paused', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/special.mp3' },
      mode: 'redirect'
    });
    client.enqueue('Player.PlayPause', { speed: 0 });
    localPlayerStore.loadError = new Error('NotAllowedError: play rejected');

    await dispatch.startLocalPlayback();

    expect(playerStore.refreshReasons).toEqual(['command:startLocalPlayback']);
    expect(localPlayerStore.calls[0]?.method).toBe('loadAndPlay');
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'startLocalPlayback',
      lastError: { source: 'command', code: 'command/failed' }
    });
  });

  it('resumes playback on Kodi and switches mode back to kodi', async () => {
    const { client, dispatch, playerStore } = createHarness();
    dispatch.setMode('local');
    client.enqueue('Player.PlayPause', { speed: 1 });

    await dispatch.resumeOnKodi();

    expect(client.calls).toEqual([{ method: 'Player.PlayPause', params: { playerid: 7 } }]);
    expect(playerStore.refreshReasons).toEqual(['command:resumeOnKodi']);
    expect(dispatch.snapshot).toMatchObject({
      mode: 'kodi',
      commandStatus: 'success',
      lastCommand: 'resumeOnKodi'
    });
  });

  it('blocks no-player and multiple-player states before calling Kodi', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot();

    await dispatch.stop();

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'stop',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'player',
        code: 'player/no-active-player'
      }
    });

    playerStore.snapshot = createSnapshot({
      playbackStatus: 'multiple',
      activePlayers: [
        { playerid: 2, type: 'audio' },
        { playerid: 7, type: 'video' }
      ],
      primaryPlayer: { playerid: 2, type: 'audio' }
    });

    await dispatch.next();

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'next',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'player',
        code: 'player/multiple-active-players'
      }
    });
  });

  it('blocks volume and mute commands when there is no safe single active player', async () => {
    const { client, dispatch, playerStore } = createHarness();
    playerStore.snapshot = createSnapshot();

    await dispatch.setVolume(50);
    await dispatch.toggleMute();

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'toggleMute',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'player',
        code: 'player/no-active-player'
      }
    });
  });

  it('reports missing active-host client state without calling Kodi or refresh', async () => {
    const playerStore = new FakePlayerStore();
    const dispatch = createPlayerDispatch({
      playerStore,
      createClient: () => null,
      now: () => '2026-01-02T00:00:00.000Z'
    });

    await dispatch.playPause();

    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playPause',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'config',
        code: 'config/no-active-host'
      }
    });
  });

  it('supports local shuffle while rejecting other Kodi-only commands in Local mode', async () => {
    const { client, dispatch, playerStore } = createHarness();
    dispatch.setMode('local');

    await dispatch.setShuffle(true);

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'setShuffle',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: null
    });

    await dispatch.setRepeat('all');
    expect(dispatch.snapshot.lastError).toMatchObject({
      source: 'mode',
      code: 'mode/unsupported-local'
    });
  });

  it('rejects malformed command inputs before calling Kodi', async () => {
    const { client, dispatch, playerStore } = createHarness();

    await dispatch.seekPercentage(Number.POSITIVE_INFINITY);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-seek-percentage' });

    await dispatch.seekPercentage(-1);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-seek-percentage' });

    await dispatch.setVolume(Number.NaN);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-volume' });

    await dispatch.setAudioStream(Number.POSITIVE_INFINITY);
    expect(dispatch.snapshot.lastError).toMatchObject({ code: 'input/invalid-audio-stream' });

    await dispatch.setSubtitle('bad' as never);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'setSubtitle',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: { code: 'input/invalid-subtitle' }
    });

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
  });

  it('sanitizes command failures and refreshes only after the command reached Kodi', async () => {
    const { client, dispatch, playerStore } = createHarness();
    client.enqueue(
      'Player.Stop',
      new KodiHttpClientError({
        code: 'auth',
        method: 'Player.Stop',
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

    await dispatch.stop();

    expect(client.calls).toEqual([{ method: 'Player.Stop', params: { playerid: 7 } }]);
    expect(playerStore.refreshReasons).toEqual(['command:stop']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'stop',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured credentials while calling Player.Stop.'
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('sanitizes generic command failures without leaking credential-like text', async () => {
    const { client, dispatch, playerStore } = createHarness();
    client.enqueue(
      'Player.Stop',
      new Error(
        'failed with Authorization: Basic token for http://admin:p@ssword@kodi.local/jsonrpc from localStorage'
      )
    );

    await dispatch.stop();

    expect(client.calls).toEqual([{ method: 'Player.Stop', params: { playerid: 7 } }]);
    expect(playerStore.refreshReasons).toEqual(['command:stop']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'stop',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'command',
        code: 'command/failed'
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('keeps command status inspectable when the follow-up refresh fails', async () => {
    const { client, dispatch, playerStore } = createHarness();
    client.enqueue('Player.Stop', 'OK');
    playerStore.refreshError = new Error(
      'refresh failed with admin:p@ssword and Authorization: Basic token'
    );

    await dispatch.stop();

    expect(client.calls).toEqual([{ method: 'Player.Stop', params: { playerid: 7 } }]);
    expect(playerStore.refreshReasons).toEqual(['command:stop']);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'stop',
      lastError: null
    });
    expectSecretSafe(dispatch.snapshot);
  });
});
