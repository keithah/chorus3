import { describe, expect, it, vi } from 'vitest';

import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  createVideoWriteStore,
  type VideoWriteEpisodeItem,
  type VideoWriteStoreOptions,
  type VideoWriteWriteMethods
} from './videoWriteStore.svelte';

class FakeKodiClient implements KodiJsonRpcHttpClient {
  async call<TResult>(): Promise<TResult> {
    return 'OK' as TResult;
  }
}

function expectCloneSafe(value: unknown): void {
  const clone = structuredClone(value);
  expect(clone).toEqual(value);
  expect(clone).not.toBe(value);
}

function createWriteMethods(): VideoWriteWriteMethods {
  return {
    setMovieDetails: vi.fn().mockResolvedValue('OK'),
    setEpisodeDetails: vi.fn().mockResolvedValue('OK')
  };
}

function createHarness(overrides: Partial<VideoWriteStoreOptions> = {}) {
  const writeMethods = createWriteMethods();
  const client = new FakeKodiClient();
  const store = createVideoWriteStore({
    createClient: () => client,
    now: () => '2026-05-01T10:20:30.000Z',
    writeMethods,
    ...overrides
  });

  return { store, writeMethods, client };
}

function serializeSnapshot(snapshot: unknown): string {
  return JSON.stringify(snapshot);
}

describe('video write store', () => {
  it('starts idle with a clone-safe diagnostic snapshot', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      status: 'idle',
      lastOperation: null,
      lastUpdatedAt: null,
      summary: { total: 0, succeeded: 0, failed: 0 },
      failedItems: [],
      lastError: null,
      writeCounts: {
        moviesWatched: 0,
        moviesUnwatched: 0,
        episodesWatched: 0,
        episodesUnwatched: 0,
        movieResumes: 0,
        episodeResumes: 0,
        retries: 0
      }
    });
    expectCloneSafe(store.snapshot);

    const mutated = store.snapshot;
    mutated.summary.total = 99;
    mutated.failedItems.push({ kind: 'movie', id: 1, label: 'mutated', error: null });
    expect(store.snapshot.summary.total).toBe(0);
    expect(store.snapshot.failedItems).toEqual([]);
  });

  it('rejects invalid movie and episode IDs before creating a client or calling write methods', async () => {
    const createClient = vi.fn(() => new FakeKodiClient());
    const { store, writeMethods } = createHarness({ createClient });

    for (const invalidId of [0, -1, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      await store.markMovieWatched({ movieid: invalidId, label: `movie ${invalidId}` }, true);
      expect(store.snapshot).toMatchObject({
        status: 'error',
        lastOperation: 'movie-watched',
        summary: { total: 1, succeeded: 0, failed: 1 },
        lastError: { source: 'validation', code: 'validation/invalid-id' }
      });

      await store.markEpisodeWatched({ episodeid: invalidId, label: `episode ${invalidId}` }, true);
      expect(store.snapshot).toMatchObject({
        status: 'error',
        lastOperation: 'episode-watched',
        summary: { total: 1, succeeded: 0, failed: 1 },
        lastError: { source: 'validation', code: 'validation/invalid-id' }
      });
    }

    expect(createClient).not.toHaveBeenCalled();
    expect(writeMethods.setMovieDetails).not.toHaveBeenCalled();
    expect(writeMethods.setEpisodeDetails).not.toHaveBeenCalled();
  });

  it('reports missing active Kodi client without calling write methods', async () => {
    const { store, writeMethods } = createHarness({ createClient: () => null });

    await store.markMovieWatched({ movieid: 44, label: 'Movie' }, true);

    expect(writeMethods.setMovieDetails).not.toHaveBeenCalled();
    expect(store.snapshot).toMatchObject({
      status: 'error',
      lastOperation: 'movie-watched',
      summary: { total: 1, succeeded: 0, failed: 1 },
      lastError: { source: 'config', code: 'config/no-active-host' },
      failedItems: [{ kind: 'movie', id: 44, label: 'Movie' }]
    });
  });

  it('marks single movies watched and unwatched with explicit Kodi write payloads', async () => {
    const { store, writeMethods, client } = createHarness();

    await store.markMovieWatched({ movieid: 44, label: 'Movie' }, true);
    await store.markMovieWatched({ movieid: 44, label: 'Movie' }, false);

    expect(writeMethods.setMovieDetails).toHaveBeenNthCalledWith(1, client, {
      movieid: 44,
      playcount: 1,
      lastplayed: '2026-05-01 10:20:30'
    });
    expect(writeMethods.setMovieDetails).toHaveBeenNthCalledWith(2, client, {
      movieid: 44,
      playcount: 0,
      resume: { position: 0, total: 0 }
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'movie-unwatched',
      summary: { total: 1, succeeded: 1, failed: 0 },
      writeCounts: { moviesWatched: 1, moviesUnwatched: 1 }
    });
  });

  it('marks single episodes watched and unwatched with explicit Kodi write payloads', async () => {
    const { store, writeMethods, client } = createHarness();

    await store.markEpisodeWatched({ episodeid: 66, label: 'Episode' }, true);
    await store.markEpisodeWatched({ episodeid: 66, label: 'Episode' }, false);

    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(1, client, {
      episodeid: 66,
      playcount: 1,
      lastplayed: '2026-05-01 10:20:30'
    });
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(2, client, {
      episodeid: 66,
      playcount: 0,
      resume: { position: 0, total: 0 }
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'episode-unwatched',
      summary: { total: 1, succeeded: 1, failed: 0 },
      writeCounts: { episodesWatched: 1, episodesUnwatched: 1 }
    });
  });

  it('writes movie and episode resume positions after clamping invalid numeric fields', async () => {
    const { store, writeMethods, client } = createHarness();

    await store.writeMovieResume({ movieid: 44, label: 'Movie' }, { position: 120.5, total: 600 });
    await store.writeEpisodeResume(
      { episodeid: 66, label: 'Episode' },
      { position: Number.NaN, total: -20 }
    );

    expect(writeMethods.setMovieDetails).toHaveBeenCalledWith(client, {
      movieid: 44,
      resume: { position: 120.5, total: 600 }
    });
    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledWith(client, {
      episodeid: 66,
      resume: { position: 0, total: 0 }
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'episode-resume',
      writeCounts: { movieResumes: 1, episodeResumes: 1 }
    });
  });

  it('runs 103-episode batches sequentially and records total/succeeded/failed counts', async () => {
    const { store, writeMethods } = createHarness();
    const episodes: VideoWriteEpisodeItem[] = Array.from({ length: 103 }, (_, index) => ({
      episodeid: index + 1,
      label: `Episode ${index + 1}`
    }));

    await store.markEpisodesWatched(episodes, true);

    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledTimes(103);
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(1, expect.any(FakeKodiClient), {
      episodeid: 1,
      playcount: 1,
      lastplayed: '2026-05-01 10:20:30'
    });
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(
      103,
      expect.any(FakeKodiClient),
      {
        episodeid: 103,
        playcount: 1,
        lastplayed: '2026-05-01 10:20:30'
      }
    );
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'episodes-batch-watched',
      summary: { total: 103, succeeded: 103, failed: 0 },
      failedItems: [],
      writeCounts: { episodesWatched: 103 }
    });
  });

  it('uses JSON-RPC batches for default watched and unwatched writes when the client supports them', async () => {
    const batchCalls: unknown[] = [];
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn(),
      async callBatch<TResult = unknown>(calls: readonly unknown[]) {
        batchCalls.push(calls);
        return calls.map(() => 'OK' as TResult);
      }
    };
    const store = createVideoWriteStore({
      createClient: () => client,
      now: () => '2026-05-01T10:20:30.000Z'
    });

    await store.markEpisodesWatched(
      [1, 2, 3].map((episodeid) => ({ episodeid, label: `Episode ${episodeid}` })),
      true
    );

    expect(batchCalls).toEqual([
      [
        {
          method: 'VideoLibrary.SetEpisodeDetails',
          params: { episodeid: 1, playcount: 1, lastplayed: '2026-05-01 10:20:30' }
        },
        {
          method: 'VideoLibrary.SetEpisodeDetails',
          params: { episodeid: 2, playcount: 1, lastplayed: '2026-05-01 10:20:30' }
        },
        {
          method: 'VideoLibrary.SetEpisodeDetails',
          params: { episodeid: 3, playcount: 1, lastplayed: '2026-05-01 10:20:30' }
        }
      ]
    ]);
    expect(store.snapshot).toMatchObject({
      status: 'success',
      summary: { total: 3, succeeded: 3, failed: 0 },
      writeCounts: { episodesWatched: 3 }
    });
  });

  it('chunks large default watched writes into bounded JSON-RPC batches', async () => {
    const batchSizes: number[] = [];
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn(),
      async callBatch<TResult = unknown>(calls: readonly unknown[]) {
        batchSizes.push(calls.length);
        return calls.map(() => 'OK' as TResult);
      }
    };
    const store = createVideoWriteStore({
      createClient: () => client,
      now: () => '2026-05-01T10:20:30.000Z'
    });

    await store.markEpisodesWatched(
      Array.from({ length: 103 }, (_value, index) => ({
        episodeid: index + 1,
        label: `Episode ${index + 1}`
      })),
      true
    );

    expect(batchSizes).toEqual([50, 50, 3]);
    expect(store.snapshot).toMatchObject({
      status: 'success',
      summary: { total: 103, succeeded: 103, failed: 0 },
      writeCounts: { episodesWatched: 103 }
    });
  });

  it('keeps custom write method batches on the per-target path', async () => {
    const { store, writeMethods } = createHarness();

    await store.markEpisodesWatched(
      [
        { episodeid: 1, label: 'Episode 1' },
        { episodeid: 2, label: 'Episode 2' }
      ],
      true
    );

    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledTimes(2);
  });

  it('continues episode batches after individual write failures and records sanitized failures', async () => {
    const { store, writeMethods } = createHarness();
    vi.mocked(writeMethods.setEpisodeDetails).mockImplementation(async (_client, params) => {
      if (params.episodeid === 2 || params.episodeid === 4) {
        throw new Error(
          `Authorization: Basic token failed for http://admin:p@ssword@kodi.local/jsonrpc /mnt/private/episode${params.episodeid}.mkv localStorage CHORUS_SENTINEL_SECRET`
        );
      }
      return 'OK';
    });

    await store.markEpisodesWatched(
      [1, 2, 3, 4, 5].map((episodeid) => ({
        episodeid,
        label: `Episode ${episodeid} smb://nas/private/episode${episodeid}.mkv`
      })),
      true
    );

    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledTimes(5);
    expect(store.snapshot).toMatchObject({
      status: 'partial',
      summary: { total: 5, succeeded: 3, failed: 2 },
      failedItems: [
        { kind: 'episode', id: 2 },
        { kind: 'episode', id: 4 }
      ]
    });

    const serialized = serializeSnapshot(store.snapshot);
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('Basic ');
    expect(serialized).not.toContain('admin:p@ssword');
    expect(serialized).not.toContain('http://');
    expect(serialized).not.toContain('/mnt/private');
    expect(serialized).not.toContain('smb://');
    expect(serialized).not.toContain('localStorage');
    expect(serialized).not.toContain('CHORUS_SENTINEL_SECRET');
  });

  it('continues 103-episode batches after item failures and retries sanitized failed IDs only', async () => {
    const { store, writeMethods } = createHarness();
    vi.mocked(writeMethods.setEpisodeDetails).mockImplementation(async (_client, params) => {
      if (params.episodeid === 2 || params.episodeid === 101) {
        throw new Error(
          `Authorization: Basic token failed for http://admin:p@ssword@kodi.local/jsonrpc /mnt/private/episode${params.episodeid}.mkv localStorage CHORUS_SENTINEL_SECRET`
        );
      }
      return 'OK';
    });
    const episodes: VideoWriteEpisodeItem[] = Array.from({ length: 103 }, (_, index) => ({
      episodeid: index + 1,
      label: `Episode ${index + 1} smb://nas/private/episode${index + 1}.mkv`
    }));

    await store.markEpisodesWatched(episodes, true);

    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledTimes(103);
    expect(store.snapshot).toMatchObject({
      status: 'partial',
      lastOperation: 'episodes-batch-watched',
      summary: { total: 103, succeeded: 101, failed: 2 },
      failedItems: [
        { kind: 'episode', id: 2, label: 'Episode 2 redacted-path' },
        { kind: 'episode', id: 101, label: 'Episode 101 redacted-path' }
      ],
      writeCounts: { episodesWatched: 101 }
    });

    const serializedFailure = serializeSnapshot(store.snapshot);
    expect(serializedFailure).not.toContain('Authorization');
    expect(serializedFailure).not.toContain('Basic ');
    expect(serializedFailure).not.toContain('admin:p@ssword');
    expect(serializedFailure).not.toContain('http://');
    expect(serializedFailure).not.toContain('/mnt/private');
    expect(serializedFailure).not.toContain('smb://');
    expect(serializedFailure).not.toContain('localStorage');
    expect(serializedFailure).not.toContain('CHORUS_SENTINEL_SECRET');

    vi.mocked(writeMethods.setEpisodeDetails).mockResolvedValue('OK');
    vi.mocked(writeMethods.setEpisodeDetails).mockClear();

    await store.retryFailed();

    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledTimes(2);
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(1, expect.any(FakeKodiClient), {
      episodeid: 2,
      playcount: 1,
      lastplayed: '2026-05-01 10:20:30'
    });
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(2, expect.any(FakeKodiClient), {
      episodeid: 101,
      playcount: 1,
      lastplayed: '2026-05-01 10:20:30'
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'retry-failed',
      summary: { total: 2, succeeded: 2, failed: 0 },
      failedItems: [],
      writeCounts: { episodesWatched: 103, retries: 1 }
    });
  });

  it('retries failed IDs only and clears failures after retry success', async () => {
    const { store, writeMethods } = createHarness();
    vi.mocked(writeMethods.setEpisodeDetails).mockImplementation(async (_client, params) => {
      if (params.episodeid === 2 || params.episodeid === 4) {
        throw new Error('temporary write failure');
      }
      return 'OK';
    });

    await store.markEpisodesWatched(
      [1, 2, 3, 4, 5].map((episodeid) => ({ episodeid, label: `Episode ${episodeid}` })),
      false
    );
    vi.mocked(writeMethods.setEpisodeDetails).mockResolvedValue('OK');
    vi.mocked(writeMethods.setEpisodeDetails).mockClear();

    await store.retryFailed();

    expect(writeMethods.setEpisodeDetails).toHaveBeenCalledTimes(2);
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(1, expect.any(FakeKodiClient), {
      episodeid: 2,
      playcount: 0,
      resume: { position: 0, total: 0 }
    });
    expect(writeMethods.setEpisodeDetails).toHaveBeenNthCalledWith(2, expect.any(FakeKodiClient), {
      episodeid: 4,
      playcount: 0,
      resume: { position: 0, total: 0 }
    });
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'retry-failed',
      summary: { total: 2, succeeded: 2, failed: 0 },
      failedItems: [],
      writeCounts: { episodesUnwatched: 5, retries: 1 }
    });
  });

  it('treats empty batches and retry with no failed items as zero-write successes', async () => {
    const { store, writeMethods } = createHarness();

    await store.markEpisodesWatched([], true);
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'episodes-batch-watched',
      summary: { total: 0, succeeded: 0, failed: 0 }
    });

    await store.retryFailed();
    expect(writeMethods.setEpisodeDetails).not.toHaveBeenCalled();
    expect(store.snapshot).toMatchObject({
      status: 'success',
      lastOperation: 'retry-failed',
      summary: { total: 0, succeeded: 0, failed: 0 },
      writeCounts: { retries: 0 }
    });
  });
});
