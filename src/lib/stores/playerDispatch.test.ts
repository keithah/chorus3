import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createConfigStore } from './config.svelte';
import { createActiveKodiJsonRpcHttpClient, savedKodiHostToKodiHttpHost } from './kodiClient';
import { createPlayerDispatch, type PlayerDispatchPlayerStore } from './playerDispatch.svelte';
import type { PlayerStoreSnapshot } from './player.svelte';

type CallRecord = {
  method: string;
  params?: unknown;
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
    playbackStatus: 'active'
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
  const dispatch = createPlayerDispatch({
    playerStore,
    createClient: () => client,
    now: () => '2026-01-02T00:00:00.000Z'
  });

  return { client, dispatch, playerStore };
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

  it('rejects unsupported local mode safely', async () => {
    const { client, dispatch, playerStore } = createHarness();
    dispatch.setMode('local');

    await dispatch.playPause();

    expect(client.calls).toEqual([]);
    expect(playerStore.refreshReasons).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'error',
      lastCommand: 'playPause',
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
