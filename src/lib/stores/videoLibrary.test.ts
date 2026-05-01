import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createVideoLibraryStore, type VideoLibraryStoreSnapshot } from './index';

type CallRecord = {
  method: string;
  params?: unknown;
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
}

function enqueueEmptyTvShows(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetTVShows', {
    tvshows: [],
    limits: { start: 0, end: 0, total: 0 }
  });
}

function enqueueEmptyMovies(client: FakeKodiClient): void {
  client.enqueue('VideoLibrary.GetMovies', { movies: [], limits: { start: 0, end: 0, total: 0 } });
  enqueueEmptyTvShows(client);
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
      limits: { movies: { start: 0, end: 0, total: 0 }, tvShows: { start: 0, end: 0, total: 0 } },
      isEmpty: true,
      lastError: null
    } satisfies VideoLibraryStoreSnapshot);
  });

  it('requests bounded read-only Kodi movie properties without raw file paths', async () => {
    const { client, store } = createHarness();
    enqueueEmptyMovies(client);

    await store.refresh('manual');

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.GetMovies',
        params: {
          properties: [
            'title',
            'year',
            'runtime',
            'thumbnail',
            'fanart',
            'art',
            'playcount',
            'lastplayed',
            'resume',
            'dateadded'
          ],
          limits: { start: 0, end: 25 }
        }
      },
      {
        method: 'VideoLibrary.GetTVShows',
        params: {
          properties: [
            'title',
            'year',
            'thumbnail',
            'fanart',
            'art',
            'episode',
            'watchedepisodes',
            'playcount',
            'lastplayed',
            'dateadded'
          ],
          limits: { start: 0, end: 25 }
        }
      }
    ]);
    expect(JSON.stringify(client.calls)).not.toContain('file');
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

  it('clones snapshots on read so callers cannot mutate store state', async () => {
    const { client, store } = createHarness();
    enqueueSuccessfulMovies(client);

    await store.refresh('manual');

    const snapshot = store.snapshot;
    snapshot.movies[0].label = 'Mutated';
    snapshot.movies[0].art!.poster = 'mutated.jpg';
    snapshot.movies[0].resume!.position = 99;
    snapshot.limits.movies.total = 999;

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
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 7, label: 'Fresh movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyTvShows(client);

    const slowRefresh = store.refresh('manual');
    await flushPromises();
    setNow(4_000);
    await store.refresh('poll');
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
    client.enqueue('VideoLibrary.GetMovies', {
      movies: [{ movieid: 7, label: 'Fresh movie' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    enqueueEmptyTvShows(client);

    const slowRefresh = store.refresh('manual');
    await flushPromises();
    await store.refresh('manual');
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

    const refresh = store.refresh('manual');
    await flushPromises();
    store.destroy();
    slow.resolve({ movies: [{ movieid: 1, label: 'Too late' }] });
    await refresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'loading',
      movies: [],
      lastError: null
    });
  });
});
