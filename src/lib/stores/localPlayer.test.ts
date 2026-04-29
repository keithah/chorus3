import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createLocalPlayerStore, prepareLocalStreamUrl } from './localPlayer.svelte';
import type { MediaElementAdapter } from './localPlayer.svelte';
import type { SavedKodiHost } from './config.svelte';

type Listener = () => void;

type FakeAdapterOptions = {
  duration?: number;
  volume?: number;
  muted?: boolean;
  playError?: Error | null;
};

class FakeMediaAdapter implements MediaElementAdapter {
  src = '';
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  ended = false;
  volume = 1;
  muted = false;

  readonly #listeners = new Map<string, Set<Listener>>();
  readonly calls: string[] = [];

  playError: Error | null = null;

  constructor(options: FakeAdapterOptions = {}) {
    if (typeof options.duration === 'number') {
      this.duration = options.duration;
    }
    if (typeof options.volume === 'number') {
      this.volume = options.volume;
    }
    if (typeof options.muted === 'boolean') {
      this.muted = options.muted;
    }
    this.playError = options.playError ?? null;
  }

  async play(): Promise<void> {
    this.calls.push('play');
    if (this.playError) {
      throw this.playError;
    }
    this.paused = false;
  }

  pause(): void {
    this.calls.push('pause');
    this.paused = true;
  }

  load(): void {
    this.calls.push('load');
  }

  addEventListener(type: string, listener: Listener): void {
    const set = this.#listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.#listeners.set(type, set);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.#listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    for (const listener of this.#listeners.get(type) ?? []) {
      listener();
    }
  }

  listenerCount(type: string): number {
    return this.#listeners.get(type)?.size ?? 0;
  }
}

function expectCloneSafeSnapshot(getSnapshot: () => unknown): void {
  const first = getSnapshot();
  const second = getSnapshot();

  expect(first).toEqual(second);
  expect(first).not.toBe(second);

  expect(() => structuredClone(first)).not.toThrow();
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local');
}

describe('local player store', () => {
  it('starts idle with clone-safe snapshot defaults', () => {
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });

    expect(store.snapshot).toMatchObject({
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
      lastUpdatedAt: null
    });

    expectCloneSafeSnapshot(() => store.snapshot);
  });

  it('loads and transitions to playing on canplay', async () => {
    const adapter = new FakeMediaAdapter({ duration: 120, volume: 0.5, muted: true });
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });
    store.attach(adapter);

    const promise = store.loadAndPlay({
      source: 'http://example.test/stream',
      item: { id: 7, label: 'Song', type: 'song' },
      mediaKind: 'audio',
      kodiWasPaused: true
    });

    expect(store.snapshot.status).toBe('loading');
    expect(adapter.calls).toEqual(['load', 'play']);

    adapter.emit('canplay');
    await promise;

    expect(store.snapshot).toMatchObject({
      status: 'playing',
      mediaKind: 'audio',
      durationSeconds: 120,
      volume: 50,
      muted: true,
      kodiPausedForLocal: true,
      resumeAvailable: true
    });
  });

  it('tracks time updates and duration updates', () => {
    const adapter = new FakeMediaAdapter({ duration: 90 });
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });
    store.attach(adapter);

    void store.loadAndPlay({
      source: 'http://example.test/stream',
      item: { id: 1, label: 'Item', type: 'unknown' },
      mediaKind: 'unknown',
      kodiWasPaused: false
    });

    adapter.currentTime = 12.25;
    adapter.emit('timeupdate');

    expect(store.snapshot.currentSeconds).toBeCloseTo(12.25);

    adapter.duration = 100;
    adapter.emit('durationchange');

    expect(store.snapshot.durationSeconds).toBe(100);
  });

  it('reports play() rejection as a safe error and leaves resume available', async () => {
    const adapter = new FakeMediaAdapter({ playError: new Error('NotAllowedError: play failed') });
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });
    store.attach(adapter);

    await store.loadAndPlay({
      source: 'http://example.test/stream',
      item: { id: 2, label: 'Song', type: 'song' },
      mediaKind: 'audio',
      kodiWasPaused: true
    });

    expect(store.snapshot).toMatchObject({
      status: 'error',
      resumeAvailable: true,
      lastError: {
        code: 'media/play-rejected'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports media errors without leaking the source URL', async () => {
    const adapter = new FakeMediaAdapter();
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });
    store.attach(adapter);

    await store.loadAndPlay({
      source: 'http://admin:p@ssword@kodi.local/stream',
      item: { id: 3, label: 'Video', type: 'movie' },
      mediaKind: 'video',
      kodiWasPaused: false
    });

    adapter.emit('error');

    expect(store.snapshot).toMatchObject({
      status: 'error',
      lastError: {
        code: 'media/error'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('supports pause and stop state transitions', async () => {
    const adapter = new FakeMediaAdapter();
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });
    store.attach(adapter);

    await store.loadAndPlay({
      source: 'http://example.test/stream',
      item: { id: 5, label: 'Track', type: 'song' },
      mediaKind: 'audio',
      kodiWasPaused: false
    });

    store.pause();
    expect(adapter.calls).toContain('pause');
    expect(store.snapshot.status).toBe('paused');

    store.stop();
    expect(store.snapshot).toMatchObject({
      status: 'idle',
      item: null,
      lastError: null
    });
  });

  it('tracks volume and mute changes through the adapter', () => {
    const adapter = new FakeMediaAdapter({ volume: 0.25, muted: false });
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });
    store.attach(adapter);

    store.setVolume(80);
    expect(adapter.volume).toBeCloseTo(0.8);

    store.setMuted(true);
    expect(adapter.muted).toBe(true);

    adapter.emit('volumechange');
    expect(store.snapshot).toMatchObject({
      volume: 80,
      muted: true
    });
  });

  it('cleans up event listeners on detach', () => {
    const adapter = new FakeMediaAdapter();
    const store = createLocalPlayerStore({ now: () => '2026-02-01T00:00:00.000Z' });

    store.attach(adapter);
    expect(adapter.listenerCount('canplay')).toBeGreaterThan(0);

    store.detach();
    expect(adapter.listenerCount('canplay')).toBe(0);
    expect(adapter.listenerCount('error')).toBe(0);
  });
});

describe('prepareLocalStreamUrl', () => {
  type CallRecord = { method: string; params?: unknown };

  class FakeKodiClient implements KodiJsonRpcHttpClient {
    readonly calls: CallRecord[] = [];
    response: unknown = null;
    error: unknown = null;

    async call<TResult>(method: string, params?: unknown): Promise<TResult> {
      this.calls.push(params === undefined ? { method } : { method, params });

      if (this.error) {
        throw this.error;
      }

      return this.response as TResult;
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

  it('combines a relative prepared path with the active host origin', async () => {
    const client = new FakeKodiClient();
    client.response = { details: { path: '/vfs/special.mp3' }, mode: 'redirect' };

    await expect(
      prepareLocalStreamUrl({
        client,
        file: 'smb://nas/music/special.mp3',
        activeHost: createActiveHost()
      })
    ).resolves.toBe('http://kodi.local:8080/vfs/special.mp3');

    expect(client.calls).toEqual([
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/special.mp3' } }
    ]);
  });

  it('passes through an absolute prepared URL after stripping credentials', async () => {
    const client = new FakeKodiClient();
    client.response = {
      details: { path: 'http://admin:p@ssword@kodi.local:8080/vfs/secret.mp3' },
      mode: 'redirect'
    };

    await expect(
      prepareLocalStreamUrl({
        client,
        file: 'smb://nas/music/secret.mp3',
        activeHost: createActiveHost({ useTls: true })
      })
    ).resolves.toBe('http://kodi.local:8080/vfs/secret.mp3');
  });

  it('rejects missing file inputs', async () => {
    const client = new FakeKodiClient();

    await expect(
      prepareLocalStreamUrl({ client, file: '   ', activeHost: createActiveHost() })
    ).rejects.toMatchObject({ code: 'input/missing-file' });
  });

  it('rejects missing active host configuration', async () => {
    const client = new FakeKodiClient();

    await expect(
      prepareLocalStreamUrl({ client, file: 'smb://nas/music/song.mp3', activeHost: null })
    ).rejects.toMatchObject({ code: 'config/no-active-host' });
  });

  it('rethrows Kodi HTTP errors so dispatch can capture endpoint diagnostics', async () => {
    const client = new FakeKodiClient();
    client.error = new KodiHttpClientError({
      code: 'auth',
      method: 'Files.PrepareDownload',
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
    });

    await expect(
      prepareLocalStreamUrl({
        client,
        file: 'smb://nas/music/song.mp3',
        activeHost: createActiveHost()
      })
    ).rejects.toBe(client.error);
  });

  it('sanitizes generic prepare failures without leaking URLs', async () => {
    const client = new FakeKodiClient();
    client.error = new Error('failed for http://admin:p@ssword@kodi.local/vfs/secret.mp3');

    await expect(
      prepareLocalStreamUrl({
        client,
        file: 'smb://nas/music/song.mp3',
        activeHost: createActiveHost()
      })
    ).rejects.toMatchObject({
      code: 'command/prepare-download-failed'
    });

    try {
      await prepareLocalStreamUrl({
        client,
        file: 'smb://nas/music/song.mp3',
        activeHost: createActiveHost()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      expect(message).not.toContain('admin:p@ssword');
      expect(message).not.toContain('http://admin:p@ssword');
    }
  });
});
