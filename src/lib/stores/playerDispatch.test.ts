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
};

type PlayerDispatchWithPlaylists = ReturnType<typeof createPlayerDispatch> & {
  playPlaylistItem(item: unknown): Promise<void>;
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
  refreshError: unknown = null;

  async refresh(reason: Parameters<PlayerDispatchPlayerStore['refresh']>[0]): Promise<void> {
    this.refreshReasons.push(reason);

    if (this.refreshError) {
      throw this.refreshError;
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
        mediaKind: 'video',
        playlistKind: 'smart'
      },
      {
        file: 'special://profile/playlists/music/recent.xsp',
        mediaKind: 'music',
        playlistKind: 'basic'
      },
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

  it('rejects invalid file playback items before calling Kodi or Local playback', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();
    const invalidItems = [
      { file: '', mediaKind: 'audio' },
      { file: '   ', mediaKind: 'audio' },
      { file: 42, mediaKind: 'audio' },
      { file: 'smb://nas/music/special.mp3', mediaKind: 'video' },
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

  it('starts local playback by pausing Kodi first, then preparing a stream URL, then loading local media', async () => {
    const { client, dispatch, localPlayerStore, playerStore } = createHarness();

    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/special.mp3' },
      mode: 'redirect'
    });

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
    expect(playerStore.refreshReasons).toEqual([]);
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
    client.enqueue('Player.PlayPause', { speed: 0 });
    client.enqueue('Files.PrepareDownload', {
      details: { path: '/vfs/special.mp3' },
      mode: 'redirect'
    });
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

  it('rejects Kodi-only commands when running in Local mode', async () => {
    const { client, dispatch, playerStore } = createHarness();
    dispatch.setMode('local');

    await dispatch.setShuffle(true);

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'setShuffle',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'mode',
        code: 'mode/unsupported-local'
      }
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
