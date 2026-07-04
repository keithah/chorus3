import { describe, expect, it, vi } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  createLocalScrobbleStore,
  evaluateLocalPlaybackProgress,
  evaluateLocalScrobblePolicy,
  extractLocalLibraryItemId,
  type LocalScrobbleLibraryMethods
} from './localScrobble.svelte';
import type { LocalPlayerStoreSnapshot } from './localPlayer.svelte';

function createLocalSnapshot(
  overrides: Partial<LocalPlayerStoreSnapshot> = {}
): LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'unknown',
    source: null,
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

function expectCloneSafe(value: unknown): void {
  const clone = structuredClone(value);
  expect(clone).toEqual(value);
  expect(clone).not.toBe(value);
}

describe('local scrobble policy', () => {
  it('extracts explicit song/movie/episode ids without raw paths', () => {
    expect(extractLocalLibraryItemId({ type: 'song', songid: 12, label: 'Song' })).toEqual({
      kind: 'song',
      id: 12
    });
    expect(extractLocalLibraryItemId({ type: 'movie', movieid: 7, label: 'Movie' })).toEqual({
      kind: 'movie',
      id: 7
    });
    expect(extractLocalLibraryItemId({ type: 'episode', episodeid: 9, label: 'Episode' })).toEqual({
      kind: 'episode',
      id: 9
    });
  });

  it('falls back to generic id when type identifies the library kind', () => {
    expect(extractLocalLibraryItemId({ type: 'song', id: 12, label: 'Song' })).toEqual({
      kind: 'song',
      id: 12
    });
    expect(extractLocalLibraryItemId({ type: 'movie', id: 7, label: 'Movie' })).toEqual({
      kind: 'movie',
      id: 7
    });
    expect(extractLocalLibraryItemId({ type: 'episode', id: 9, label: 'Episode' })).toEqual({
      kind: 'episode',
      id: 9
    });
  });

  it('does not write for idle, loading, or error states', () => {
    for (const status of ['idle', 'loading', 'error'] as const) {
      const decision = evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status,
          mediaKind: 'audio',
          item: { type: 'song', songid: 1, label: 'Track' },
          currentSeconds: 300,
          durationSeconds: 500
        })
      );

      expect(decision).toMatchObject({ shouldWrite: false, reason: `status/${status}` });
      expectCloneSafe(decision);
    }
  });

  it('does not write for unsupported media kinds or missing items', () => {
    expect(
      evaluateLocalScrobblePolicy(createLocalSnapshot({ status: 'playing', mediaKind: 'unknown' }))
    ).toMatchObject({ shouldWrite: false, reason: 'media/unsupported' });

    expect(
      evaluateLocalScrobblePolicy(createLocalSnapshot({ status: 'playing', mediaKind: 'audio' }))
    ).toMatchObject({ shouldWrite: false, reason: 'item/missing' });
  });

  it('requires a supported audio library id before scrobbling', () => {
    const decision = evaluateLocalScrobblePolicy(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'movie', movieid: 5, label: 'Wrong kind' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );

    expect(decision).toMatchObject({ shouldWrite: false, reason: 'item/missing-songid' });
  });

  it('requires known audio duration unless playback ended', () => {
    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'audio',
          item: { type: 'song', songid: 1, label: 'Track' },
          currentSeconds: 300,
          durationSeconds: null
        })
      )
    ).toMatchObject({ shouldWrite: false, reason: 'duration/unknown' });

    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'ended',
          mediaKind: 'audio',
          item: { type: 'song', songid: 1, label: 'Track' },
          currentSeconds: 0,
          durationSeconds: null
        })
      )
    ).toMatchObject({ shouldWrite: true, action: 'audio-scrobble' });
  });

  it('scrobbles audio only after max of four minutes or half duration', () => {
    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'audio',
          item: { type: 'song', songid: 2, label: 'Long Track' },
          currentSeconds: 239,
          durationSeconds: 300
        })
      )
    ).toMatchObject({ shouldWrite: false, reason: 'threshold/not-crossed' });

    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'audio',
          item: { type: 'song', songid: 2, label: 'Long Track' },
          currentSeconds: 300,
          durationSeconds: 500
        })
      )
    ).toMatchObject({
      shouldWrite: true,
      action: 'audio-scrobble',
      item: { kind: 'song', id: 2 }
    });
  });

  it('writes video resume after 30 seconds before watched threshold', () => {
    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'video',
          item: { type: 'movie', movieid: 3, label: 'Movie' },
          currentSeconds: 29,
          durationSeconds: 600
        })
      )
    ).toMatchObject({ shouldWrite: false, reason: 'threshold/not-crossed' });

    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'video',
          item: { type: 'movie', movieid: 3, label: 'Movie' },
          currentSeconds: 30,
          durationSeconds: 600
        })
      )
    ).toEqual({
      shouldWrite: true,
      action: 'video-resume',
      item: { kind: 'movie', id: 3 },
      resume: { position: 30, total: 600 }
    });
  });

  it('writes video watched when ended or at least 90 percent complete', () => {
    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'video',
          item: { type: 'episode', episodeid: 4, label: 'Episode' },
          currentSeconds: 540,
          durationSeconds: 600
        })
      )
    ).toMatchObject({
      shouldWrite: true,
      action: 'video-watched',
      item: { kind: 'episode', id: 4 }
    });

    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'ended',
          mediaKind: 'video',
          item: { type: 'movie', movieid: 5, label: 'Movie' },
          currentSeconds: 0,
          durationSeconds: null
        })
      )
    ).toMatchObject({ shouldWrite: true, action: 'video-watched' });
  });

  it('requires known duration for in-progress video decisions', () => {
    expect(
      evaluateLocalScrobblePolicy(
        createLocalSnapshot({
          status: 'playing',
          mediaKind: 'video',
          item: { type: 'movie', movieid: 6, label: 'Movie' },
          currentSeconds: 45,
          durationSeconds: null
        })
      )
    ).toMatchObject({ shouldWrite: false, reason: 'duration/unknown' });
  });
});

describe('local scrobble store', () => {
  class FakeKodiClient implements KodiJsonRpcHttpClient {
    async call<TResult>(): Promise<TResult> {
      return 'OK' as TResult;
    }
  }

  function createLibraryMethods(): LocalScrobbleLibraryMethods {
    return {
      getSongDetails: vi.fn().mockResolvedValue({ songdetails: { songid: 9, playcount: 0 } }),
      setSongDetails: vi.fn().mockResolvedValue('OK'),
      setMovieDetails: vi.fn().mockResolvedValue('OK'),
      setEpisodeDetails: vi.fn().mockResolvedValue('OK')
    };
  }

  function createHarness(
    snapshot: LocalPlayerStoreSnapshot,
    client: KodiJsonRpcHttpClient | null = new FakeKodiClient()
  ) {
    const libraryMethods = createLibraryMethods();
    const localPlayerStore = { snapshot };
    const store = createLocalScrobbleStore({
      localPlayerStore,
      createClient: () => client,
      now: () => '2026-04-29T20:30:15.000Z',
      libraryMethods
    });

    return { store, libraryMethods, localPlayerStore };
  }

  it('starts idle with clone-safe snapshot defaults', () => {
    const { store } = createHarness(createLocalSnapshot());

    expect(store.snapshot).toMatchObject({
      status: 'idle',
      lastAction: null,
      lastError: null,
      lastWriteAt: null,
      lastPolicyReason: null,
      writeCounts: { audioScrobbles: 0, videoResumes: 0, videoWatched: 0 }
    });
    expectCloneSafe(store.snapshot);
  });

  it('writes an audio scrobble after threshold success', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );

    await store.evaluateAndWrite('local:timeupdate');

    expect(libraryMethods.getSongDetails).toHaveBeenCalledWith(expect.any(FakeKodiClient), {
      songid: 9,
      properties: ['playcount']
    });
    expect(libraryMethods.setSongDetails).toHaveBeenCalledWith(expect.any(FakeKodiClient), {
      songid: 9,
      playcount: 1,
      lastplayed: '2026-04-29 20:30:15'
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastAction: 'audio-scrobble',
      lastPolicyReason: 'audio-scrobble',
      lastWriteAt: '2026-04-29T20:30:15.000Z',
      writeCounts: { audioScrobbles: 1 }
    });
  });

  it('increments existing audio playcount when scrobbling', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );
    vi.mocked(libraryMethods.getSongDetails).mockResolvedValue({
      songdetails: { songid: 9, label: 'Track', playcount: 4 }
    });

    await store.evaluateAndWrite('local:timeupdate');

    expect(libraryMethods.setSongDetails).toHaveBeenCalledWith(expect.any(FakeKodiClient), {
      songid: 9,
      playcount: 5,
      lastplayed: '2026-04-29 20:30:15'
    });
  });

  it('writes movie resume progress', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'video',
        item: { type: 'movie', movieid: 7, label: 'Movie' },
        currentSeconds: 120,
        durationSeconds: 600
      })
    );

    await store.evaluateAndWrite();

    expect(libraryMethods.setMovieDetails).toHaveBeenCalledWith(expect.any(FakeKodiClient), {
      movieid: 7,
      resume: { position: 120, total: 600 }
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastAction: 'video-resume',
      writeCounts: { videoResumes: 1 }
    });
  });

  it('writes episode watched progress', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'ended',
        mediaKind: 'video',
        item: { type: 'episode', episodeid: 3, label: 'Episode' },
        currentSeconds: 0,
        durationSeconds: null
      })
    );

    await store.evaluateAndWrite();

    expect(libraryMethods.setEpisodeDetails).toHaveBeenCalledWith(expect.any(FakeKodiClient), {
      episodeid: 3,
      playcount: 1,
      lastplayed: '2026-04-29 20:30:15'
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastAction: 'video-watched',
      writeCounts: { videoWatched: 1 }
    });
  });

  it('suppresses duplicate writes for the same action and item', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );

    await store.evaluateAndWrite();
    await store.evaluateAndWrite();

    expect(libraryMethods.setSongDetails).toHaveBeenCalledTimes(1);
    expect(store.snapshot).toMatchObject({
      status: 'skipped',
      lastPolicyReason: 'write/duplicate',
      writeCounts: { audioScrobbles: 1 }
    });
  });

  it('suppresses duplicate writes while the first matching write is still in flight', async () => {
    let resolveWrite: (value: 'OK') => void = () => {};
    const pendingWrite = new Promise<'OK'>((resolve) => {
      resolveWrite = resolve;
    });
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );
    vi.mocked(libraryMethods.setSongDetails).mockReturnValue(pendingWrite);

    const first = store.evaluateAndWrite('local:timeupdate');
    const second = store.evaluateAndWrite('local:timeupdate');
    await vi.waitFor(() => expect(libraryMethods.setSongDetails).toHaveBeenCalledTimes(1));

    expect(libraryMethods.setSongDetails).toHaveBeenCalledTimes(1);

    resolveWrite('OK');
    await Promise.all([first, second]);
    expect(store.snapshot.writeCounts.audioScrobbles).toBe(1);
  });

  it('writes updated resume positions for the same video item', async () => {
    const localPlayerStore = {
      snapshot: createLocalSnapshot({
        status: 'playing',
        mediaKind: 'video',
        item: { type: 'movie', movieid: 7, label: 'Movie' },
        currentSeconds: 30,
        durationSeconds: 600
      })
    };
    const libraryMethods = createLibraryMethods();
    const store = createLocalScrobbleStore({
      localPlayerStore,
      createClient: () => new FakeKodiClient(),
      now: () => '2026-04-29T20:30:15.000Z',
      libraryMethods
    });

    await store.evaluateAndWrite();
    localPlayerStore.snapshot = {
      ...localPlayerStore.snapshot,
      currentSeconds: 120
    };
    await store.evaluateAndWrite();

    expect(libraryMethods.setMovieDetails).toHaveBeenCalledTimes(2);
    expect(libraryMethods.setMovieDetails).toHaveBeenNthCalledWith(1, expect.any(FakeKodiClient), {
      movieid: 7,
      resume: { position: 30, total: 600 }
    });
    expect(libraryMethods.setMovieDetails).toHaveBeenNthCalledWith(2, expect.any(FakeKodiClient), {
      movieid: 7,
      resume: { position: 120, total: 600 }
    });
  });

  it('reports missing active host safely when a write is needed', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      }),
      null
    );

    await store.evaluateAndWrite();

    expect(libraryMethods.setSongDetails).not.toHaveBeenCalled();
    expect(store.snapshot).toMatchObject({
      status: 'error',
      lastError: { source: 'config', code: 'config/no-active-host' }
    });
  });

  it('records unsupported id policy as skipped without calling Kodi', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'movie', movieid: 1, label: 'Wrong kind' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );

    await store.evaluateAndWrite();

    expect(libraryMethods.setSongDetails).not.toHaveBeenCalled();
    expect(store.snapshot).toMatchObject({
      status: 'skipped',
      lastPolicyReason: 'item/missing-songid'
    });
  });

  it('sanitizes wrapper failures without leaking secrets or file paths', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );
    vi.mocked(libraryMethods.setSongDetails).mockRejectedValue(
      new Error(
        'failed for Authorization: Basic token at http://admin:p@ssword@kodi.local/jsonrpc and smb://nas/private/song.flac from localStorage'
      )
    );

    await store.evaluateAndWrite();

    expect(store.snapshot).toMatchObject({
      status: 'error',
      lastError: { source: 'write', code: 'write/failed' }
    });
    const serialized = JSON.stringify(store.snapshot);
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('Basic ');
    expect(serialized).not.toContain('admin:p@ssword');
    expect(serialized).not.toContain('smb://');
    expect(serialized).not.toContain('song.flac');
    expect(serialized).not.toContain('localStorage');
  });

  it('preserves Kodi HTTP endpoint diagnostics while sanitizing the message', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 9, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );
    vi.mocked(libraryMethods.setSongDetails).mockRejectedValue(
      new KodiHttpClientError({
        code: 'auth',
        method: 'AudioLibrary.SetSongDetails',
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

    await store.evaluateAndWrite();

    expect(store.snapshot).toMatchObject({
      status: 'error',
      lastError: {
        source: 'http',
        code: 'auth',
        endpoint: { host: 'kodi.local', hasCredentials: true }
      }
    });
    expect(JSON.stringify(store.snapshot)).not.toContain('p@ssword');
  });

  it('evaluateLocalPlaybackProgress triggers the store with a lifecycle reason', async () => {
    const { store, libraryMethods } = createHarness(
      createLocalSnapshot({
        status: 'playing',
        mediaKind: 'audio',
        item: { type: 'song', songid: 12, label: 'Track' },
        currentSeconds: 300,
        durationSeconds: 500
      })
    );

    await evaluateLocalPlaybackProgress({
      scrobbleStore: store,
      reason: 'local:timeupdate'
    });

    expect(libraryMethods.setSongDetails).toHaveBeenCalledTimes(1);
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastEvaluationReason: 'local:timeupdate',
      lastAction: 'audio-scrobble'
    });
  });

  it('evaluateLocalPlaybackProgress does not throw when an evaluator fails', async () => {
    const scrobbleStore = {
      evaluateAndWrite: vi.fn().mockRejectedValue(new Error('unexpected evaluator failure'))
    };

    await expect(
      evaluateLocalPlaybackProgress({ scrobbleStore, reason: 'local:ended' })
    ).resolves.toBeUndefined();
    expect(scrobbleStore.evaluateAndWrite).toHaveBeenCalledWith('local:ended');
  });
});
