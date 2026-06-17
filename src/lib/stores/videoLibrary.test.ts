import { describe, expect, it } from 'vitest';

import {
  KodiHttpClientError,
  type KodiHttpCallOptions,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createVideoLibraryStore, type VideoLibraryStoreSnapshot } from './index';

type CallRecord = {
  method: string;
  params?: unknown;
  options?: KodiHttpCallOptions;
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
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

function callParams(calls: readonly CallRecord[]): Array<{ method: string; params?: unknown }> {
  return calls.map(({ method, params }) =>
    params === undefined ? { method } : { method, params }
  );
}

class FakeKodiClient implements KodiJsonRpcHttpClient {
  readonly calls: CallRecord[] = [];
  readonly responses = new Map<string, unknown[]>();

  enqueue(method: string, response: unknown): void {
    this.responses.set(method, [...(this.responses.get(method) ?? []), response]);
  }

  async call<TResult>(
    method: string,
    params?: unknown,
    options?: KodiHttpCallOptions
  ): Promise<TResult> {
    this.calls.push({ ...(params === undefined ? { method } : { method, params }), options });
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

function isDeferred(value: unknown): value is Deferred<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'promise' in value &&
    value.promise instanceof Promise
  );
}

function createHarness(
  options: { client?: FakeKodiClient; createClient?: () => KodiJsonRpcHttpClient | null } = {}
) {
  const client = options.client ?? new FakeKodiClient();
  let nowMs = 1_000;
  const store = createVideoLibraryStore({
    ...(options.createClient ? { createClient: options.createClient } : { client }),
    now: () => new Date(nowMs).toISOString()
  });

  return {
    client,
    store,
    setNow: (value: number) => {
      nowMs = value;
    }
  };
}

function enqueueSuccessfulMovies(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetMovies', {
    movies: [
      {
        movieid: 42,
        label: 'Alien',
        title: 'Alien',
        year: 1979,
        runtime: 7020,
        thumbnail: 'poster.jpg',
        fanart: 'fanart.jpg',
        art: { poster: 'poster.jpg', fanart: 'fanart.jpg', invalid: 123 },
        playcount: 1,
        lastplayed: '2026-01-01 01:02:03',
        resume: { position: 12.5, total: 7020 },
        dateadded: '2025-12-31 23:59:58',
        file: 'smb://secret/video/Alien.mkv'
      },
      { movieid: 43, label: '', file: 'http://admin:p@ssword@kodi.local/video/hostile.mkv' },
      { movieid: Number.NaN, label: 'Dropped movie' }
    ],
    limits: { start: 0, end: 25, total: 2 }
  });
  enqueueEmptyTvShows(client);
  enqueueEmptyRecentVideo(client);
}

function enqueueEmptyTvShows(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetTVShows', {
    tvshows: [],
    limits: { start: 0, end: 0, total: 0 }
  });
}

function enqueueEmptyRecentVideo(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetMovies', { movies: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('VideoLibrary.GetMovies', { movies: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('VideoLibrary.GetEpisodes', {
    episodes: [],
    limits: { start: 0, end: 0, total: 0 }
  });
  client.enqueue('VideoLibrary.GetEpisodes', {
    episodes: [],
    limits: { start: 0, end: 0, total: 0 }
  });
  enqueueEmptyMusicVideos(client);
}

function enqueueEmptyMusicVideos(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetMusicVideos', {
    musicvideos: [],
    limits: { start: 0, end: 0, total: 0 }
  });
}

function enqueueEmptyMovies(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetMovies', { movies: [], limits: { start: 0, end: 0, total: 0 } });
  enqueueEmptyTvShows(client);
  enqueueEmptyRecentVideo(client);
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('file');
  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('https://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('smb://secret');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('raw response body');
}

describe('video library store', () => {
  it('starts with stable inspectable idle defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      movies: [],
      tvShows: [],
      recentlyAddedMovies: [],
      recentlyPlayedMovies: [],
      recentlyAddedEpisodes: [],
      recentlyPlayedEpisodes: [],
      musicVideos: [],
      limits: {
        movies: { start: 0, end: 0, total: 0 },
        tvShows: { start: 0, end: 0, total: 0 },
        recentlyAddedMovies: { start: 0, end: 0, total: 0 },
        recentlyPlayedMovies: { start: 0, end: 0, total: 0 },
        recentlyAddedEpisodes: { start: 0, end: 0, total: 0 },
        recentlyPlayedEpisodes: { start: 0, end: 0, total: 0 },
        musicVideos: { start: 0, end: 0, total: 0 }
      },
      isEmpty: true,
      lastError: null
    } satisfies VideoLibraryStoreSnapshot);
  });

  it('requests bounded read-only video queries including music videos and sorted recent snapshots', async () => {
    const { client, store } = createHarness();
    enqueueEmptyMovies(client);

    await store.refresh('poll');

    expect(callParams(client.calls)).toEqual([
      {
        method: 'VideoLibrary.GetMovies',
        params: {
          properties: [
            'title',
            'year',
            'runtime',
            'thumbnail',
            'art',
            'playcount',
            'genre',
            'rating',
            'mpaa',
            'studio',
            'tag',
            'cast',
            'director',
            'writer',
            'set',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 500 }
        }
      },
      {
        method: 'VideoLibrary.GetTVShows',
        params: {
          properties: [
            'title',
            'year',
            'thumbnail',
            'art',
            'episode',
            'watchedepisodes',
            'playcount',
            'genre',
            'rating',
            'mpaa',
            'studio',
            'tag',
            'cast',
            'lastplayed',
            'dateadded'
          ],
          limits: { start: 0, end: 500 }
        }
      },
      {
        method: 'VideoLibrary.GetMovies',
        params: {
          properties: [
            'title',
            'year',
            'runtime',
            'thumbnail',
            'art',
            'playcount',
            'genre',
            'rating',
            'mpaa',
            'studio',
            'tag',
            'cast',
            'director',
            'writer',
            'set',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'dateadded', order: 'descending' }
        }
      },
      {
        method: 'VideoLibrary.GetMovies',
        params: {
          properties: [
            'title',
            'year',
            'runtime',
            'thumbnail',
            'art',
            'playcount',
            'genre',
            'rating',
            'mpaa',
            'studio',
            'tag',
            'cast',
            'director',
            'writer',
            'set',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'lastplayed', order: 'descending' }
        }
      },
      {
        method: 'VideoLibrary.GetEpisodes',
        params: {
          properties: [
            'title',
            'showtitle',
            'season',
            'episode',
            'thumbnail',
            'fanart',
            'art',
            'playcount',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'dateadded', order: 'descending' }
        }
      },
      {
        method: 'VideoLibrary.GetEpisodes',
        params: {
          properties: [
            'title',
            'showtitle',
            'season',
            'episode',
            'thumbnail',
            'fanart',
            'art',
            'playcount',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'lastplayed', order: 'descending' }
        }
      },
      {
        method: 'VideoLibrary.GetMusicVideos',
        params: {
          properties: [
            'title',
            'artist',
            'album',
            'year',
            'runtime',
            'thumbnail',
            'art',
            'genre',
            'director',
            'studio',
            'tag',
            'rating',
            'playcount',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 500 },
          sort: { method: 'title', order: 'ascending' }
        }
      }
    ]);
    expect(JSON.stringify(client.calls)).not.toContain('file');
  });

  it('deduplicates identical in-flight refreshes instead of restarting Kodi reads', async () => {
    const { client, store } = createHarness();
    const movies = deferred<unknown>();
    client.enqueue('VideoLibrary.GetMovies', movies);
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);

    const first = store.refresh('manual');
    const second = store.refresh('manual');
    await flushPromises();

    expect(client.calls).toHaveLength(7);

    movies.resolve({ movies: [], limits: { start: 0, end: 0, total: 0 } });
    await Promise.all([first, second]);

    expect(client.calls).toHaveLength(7);
    expect(store.snapshot.refreshStatus).toBe('ready');
  });

  it('normalizes successful recent video snapshots and clones recent arrays on read', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    enqueueEmptyTvShows(client);
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 50, label: 'New movie', art: { poster: 'poster.jpg' } }],
      limits: { start: 0, end: 25, total: 1 }
    });
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 51, label: 'Played movie', resume: { position: 4, total: 100 } }],
      limits: { start: 0, end: 25, total: 1 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [
        { episodeid: 60, label: 'Global episode', title: 'No route identity', showtitle: 'Show' }
      ],
      limits: { start: 0, end: 25, total: 1 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [
        {
          episodeid: 61,
          tvshowid: 7,
          season: 1,
          episode: 2,
          label: 'Played episode',
          art: { thumb: 'thumb.jpg' },
          resume: { position: 5, total: 100 }
        }
      ],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyMusicVideos(client);

    await store.refresh('poll');

    const snapshot = store.snapshot;
    expect(snapshot).toMatchObject({
      refreshStatus: 'ready',
      recentlyAddedMovies: [{ movieid: 50, label: 'New movie', art: { poster: 'poster.jpg' } }],
      recentlyPlayedMovies: [{ movieid: 51, label: 'Played movie', resume: { position: 4 } }],
      recentlyAddedEpisodes: [
        { episodeid: 60, label: 'Global episode', title: 'No route identity', showtitle: 'Show' }
      ],
      recentlyPlayedEpisodes: [
        {
          episodeid: 61,
          tvshowid: 7,
          season: 1,
          episode: 2,
          label: 'Played episode',
          art: { thumb: 'thumb.jpg' },
          resume: { position: 5 }
        }
      ],
      limits: {
        recentlyAddedMovies: { start: 0, end: 25, total: 1 },
        recentlyPlayedMovies: { start: 0, end: 25, total: 1 },
        recentlyAddedEpisodes: { start: 0, end: 25, total: 1 },
        recentlyPlayedEpisodes: { start: 0, end: 25, total: 1 }
      },
      isEmpty: false
    });

    expect(() => {
      snapshot.recentlyAddedMovies[0].art!.poster = 'mutated.jpg';
    }).toThrow(TypeError);
    expect(() => {
      snapshot.recentlyPlayedMovies[0].resume!.position = 99;
    }).toThrow(TypeError);
    expect(() => {
      snapshot.recentlyPlayedEpisodes[0].art!.thumb = 'mutated.jpg';
    }).toThrow(TypeError);
    expect(() => {
      snapshot.recentlyPlayedEpisodes[0].resume!.position = 99;
    }).toThrow(TypeError);
    expect(() => {
      snapshot.limits.recentlyAddedMovies.total = 99;
    }).toThrow(TypeError);

    expect(store.snapshot.recentlyAddedMovies[0].art!.poster).toBe('poster.jpg');
    expect(store.snapshot.recentlyPlayedMovies[0].resume!.position).toBe(4);
    expect(store.snapshot.recentlyPlayedEpisodes[0].art!.thumb).toBe('thumb.jpg');
    expect(store.snapshot.recentlyPlayedEpisodes[0].resume!.position).toBe(5);
    expect(store.snapshot.limits.recentlyAddedMovies.total).toBe(1);
    expectSecretSafe(store.snapshot);
  });

  it('loads large movie libraries in pages while preserving full-library filters', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetMovies', {
      movies: Array.from({ length: 500 }, (_, index) => ({
        movieid: index + 1,
        label: `Movie ${index + 1}`
      })),
      limits: { start: 0, end: 500, total: 503 }
    });
    enqueueEmptyTvShows(client);
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [],
      limits: { start: 0, end: 25, total: 0 }
    });
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [],
      limits: { start: 0, end: 25, total: 0 }
    });
    client.enqueue('VideoLibrary.GetMovies', {
      movies: Array.from({ length: 3 }, (_, index) => ({
        movieid: index + 501,
        label: `Movie ${index + 501}`
      })),
      limits: { start: 500, end: 503, total: 503 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [],
      limits: { start: 0, end: 25, total: 0 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [],
      limits: { start: 0, end: 25, total: 0 }
    });
    enqueueEmptyMusicVideos(client);

    await store.refresh('manual');

    expect(store.snapshot.movies).toHaveLength(503);
    expect(store.snapshot.limits.movies).toEqual({ start: 0, end: 503, total: 503 });
    expect(store.snapshot.isEmpty).toBe(false);
    expect(store.snapshot.movies.at(-1)).toMatchObject({ movieid: 503, label: 'Movie 503' });
    expect(
      client.calls
        .filter((call) => call.method === 'VideoLibrary.GetMovies')
        .map((call) => ({
          limits: (call.params as { limits?: unknown }).limits
        }))
    ).toEqual([
      { limits: { start: 0, end: 500 } },
      { limits: { start: 0, end: 25 } },
      { limits: { start: 0, end: 25 } },
      { limits: { start: 500, end: 503 } }
    ]);
  });

  it('normalizes successful movie snapshots without leaking raw file fields', async () => {
    const { client, setNow, store } = createHarness();
    enqueueSuccessfulMovies(client);
    setNow(2_000);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(2_000).toISOString(),
      isEmpty: false,
      limits: { movies: { start: 0, end: 25, total: 2 } },
      movies: [
        {
          movieid: 42,
          label: 'Alien',
          title: 'Alien',
          year: 1979,
          runtime: 7020,
          thumbnail: 'poster.jpg',
          fanart: 'fanart.jpg',
          art: { poster: 'poster.jpg', fanart: 'fanart.jpg' },
          playcount: 1,
          lastplayed: '2026-01-01 01:02:03',
          resume: { position: 12.5, total: 7020 },
          dateadded: '2025-12-31 23:59:58',
          watched: true
        },
        { movieid: 43, label: 'Unknown movie' }
      ],
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('returns frozen cached snapshots so callers cannot mutate store state', async () => {
    const { client, store } = createHarness();
    enqueueSuccessfulMovies(client);

    await store.refresh('manual');

    const snapshot = store.snapshot;
    expect(store.snapshot).toBe(snapshot);
    expect(Object.isFrozen(snapshot.movies[0])).toBe(true);
    expect(() => {
      snapshot.movies[0].label = 'Mutated';
    }).toThrow(TypeError);
    expect(() => {
      snapshot.movies[0].art!.poster = 'mutated.jpg';
    }).toThrow(TypeError);
    expect(() => {
      snapshot.movies[0].resume!.position = 99;
    }).toThrow(TypeError);
    expect(() => {
      snapshot.limits.movies.total = 999;
    }).toThrow(TypeError);

    expect(store.snapshot.movies[0]).toMatchObject({
      label: 'Alien',
      art: { poster: 'poster.jpg' },
      resume: { position: 12.5 }
    });
    expect(store.snapshot.limits.movies.total).toBe(2);
  });

  it('preserves prior movies and records sanitized errors when refresh fails', async () => {
    const { client, setNow, store } = createHarness();
    enqueueSuccessfulMovies(client);
    await store.refresh('manual');

    setNow(3_000);
    client.enqueue(
      'VideoLibrary.GetMovies',
      new KodiHttpClientError({
        code: 'json-rpc-error',
        method: 'VideoLibrary.GetMovies',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        },
        jsonRpcError: {
          code: -32000,
          message:
            'Authorization: Basic abc123 raw response body smb://secret/video http://admin:p@ssword@kodi.local localStorage'
        }
      })
    );
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:json-rpc-error',
      lastUpdatedAt: new Date(3_000).toISOString(),
      movies: [
        { movieid: 42, label: 'Alien' },
        { movieid: 43, label: 'Unknown movie' }
      ],
      lastError: { source: 'http', code: 'json-rpc-error' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('preserves prior safe snapshots and sanitizes errors when a recent query fails', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 1, label: 'Base movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyTvShows(client);
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 2, label: 'Recent movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 3, label: 'Played movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    enqueueEmptyMusicVideos(client);
    await store.refresh('manual');

    setNow(3_500);
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 4, label: 'Replacement base movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyTvShows(client);
    client.enqueue(
      'VideoLibrary.GetMovies',
      new Error('smb://secret/recent Authorization: Basic abc123')
    );
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    enqueueEmptyMusicVideos(client);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      lastUpdatedAt: new Date(3_500).toISOString(),
      movies: [{ movieid: 1, label: 'Base movie' }],
      recentlyAddedMovies: [{ movieid: 2, label: 'Recent movie' }],
      recentlyPlayedMovies: [{ movieid: 3, label: 'Played movie' }],
      lastError: {
        source: 'unknown',
        code: 'refresh-failed',
        message: 'redacted-path credentials [redacted]'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('records sanitized client errors when no active Kodi client exists', async () => {
    const { store } = createHarness({ createClient: () => null });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/no-active-host',
      lastError: {
        source: 'client',
        code: 'client/no-active-host',
        message: 'Kodi HTTP client is not configured for video library refresh.'
      }
    });
    expect(store.snapshot.movies).toEqual([]);
  });

  it('normalizes malformed movie responses to an empty ready snapshot with fallback limits', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetMovies', {
      movies: { malformed: true },
      limits: { start: Number.NaN, end: Number.NaN, total: 'bad' }
    });
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      movies: [],
      limits: { movies: { start: 0, end: 0, total: 0 } },
      isEmpty: true,
      lastError: null
    });
  });

  it('suppresses stale refresh results when a newer request completes first', async () => {
    const { client, setNow, store } = createHarness();
    const slow = deferred<unknown>();
    client.enqueue('VideoLibrary.GetMovies', slow);
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 7, label: 'Fresh movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);

    const slowRefresh = store.refresh('manual');
    await flushPromises();
    const staleSignal = client.calls[0].options?.signal;
    expect(staleSignal?.aborted).toBe(false);
    setNow(4_000);
    await store.refresh('poll');
    expect(staleSignal?.aborted).toBe(true);
    slow.resolve({
      movies: [{ movieid: 8, label: 'Stale movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    await slowRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'poll',
      lastUpdatedAt: new Date(4_000).toISOString(),
      movies: [{ movieid: 7, label: 'Fresh movie' }]
    });
  });

  it('ignores stale failed requests after a newer successful refresh', async () => {
    const { client, store } = createHarness();
    const slow = deferred<unknown>();
    client.enqueue('VideoLibrary.GetMovies', slow);
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 7, label: 'Fresh movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);

    const slowRefresh = store.refresh('manual');
    await flushPromises();
    const staleSignal = client.calls[0].options?.signal;
    await store.refresh('poll');
    expect(staleSignal?.aborted).toBe(true);
    slow.reject(new Error('Authorization: Basic abc123 raw response body smb://secret/video'));
    await slowRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      movies: [{ movieid: 7, label: 'Fresh movie' }],
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('destroy suppresses in-flight refresh completion', async () => {
    const { client, store } = createHarness();
    const slow = deferred<unknown>();
    client.enqueue('VideoLibrary.GetMovies', slow);
    enqueueEmptyTvShows(client);
    enqueueEmptyRecentVideo(client);

    const refresh = store.refresh('manual');
    await flushPromises();
    const staleSignal = client.calls[0].options?.signal;
    store.destroy();
    expect(staleSignal?.aborted).toBe(true);
    slow.resolve({ movies: [{ movieid: 1, label: 'Too late' }] });
    await refresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'loading',
      movies: [],
      lastError: null
    });
  });
});
