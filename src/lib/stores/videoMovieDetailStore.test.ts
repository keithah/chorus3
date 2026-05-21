import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createVideoMovieDetailStore, type VideoMovieDetailStoreSnapshot } from './index';

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
  const store = createVideoMovieDetailStore({
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

function enqueueSuccessfulDetail(client: FakeKodiClient, movieid = 42, label = 'Alien'): void {
  client.enqueue('VideoLibrary.GetMovieDetails', {
    moviedetails: {
      movieid,
      label,
      title: label,
      year: 1979,
      runtime: 7020,
      plot: 'Safe plot.',
      tagline: 'Safe tagline.',
      genre: ['Horror'],
      director: ['Ridley Scott'],
      studio: ['20th Century Fox'],
      mpaa: 'R',
      rating: 8.5,
      userrating: 9,
      premiered: '1979-05-25',
      uniqueid: { imdb: 'tt0078748' },
      thumbnail: 'image://poster.jpg/',
      fanart: 'image://fanart.jpg/',
      art: { poster: 'image://poster.jpg/' },
      playcount: 1,
      resume: { position: 12.5, total: 7020 },
      file: 'smb://secret/video/Alien.mkv'
    }
  });
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('file');
  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('smb://secret');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('raw response body');
}

describe('video movie detail store', () => {
  it('starts with stable inspectable idle defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      selectedMovieId: null,
      detail: null,
      lastError: null
    } satisfies VideoMovieDetailStoreSnapshot);
  });

  it('rejects invalid ids before issuing Kodi calls', async () => {
    const { client, store } = createHarness();

    await store.refreshMovieDetail(0);
    await store.refreshMovieDetail(Number.POSITIVE_INFINITY);
    await store.refreshMovieDetail(1.5);

    expect(client.calls).toEqual([]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/invalid-movieid',
      selectedMovieId: null,
      detail: null,
      lastError: { source: 'client', code: 'client/invalid-movieid' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('requests safe rich detail properties without raw file and normalizes detail snapshots', async () => {
    const { client, setNow, store } = createHarness();
    enqueueSuccessfulDetail(client);
    setNow(2_000);

    await store.refreshMovieDetail(42);

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]).toMatchObject({
      method: 'VideoLibrary.GetMovieDetails',
      params: {
        movieid: 42,
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
          'dateadded',
          'plot',
          'plotoutline',
          'tagline',
          'genre',
          'director',
          'studio',
          'mpaa',
          'rating',
          'userrating',
          'premiered',
          'uniqueid'
        ]
      }
    });
    expect(JSON.stringify(client.calls)).not.toContain('file');
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(2_000).toISOString(),
      selectedMovieId: 42,
      detail: {
        movieid: 42,
        label: 'Alien',
        plot: 'Safe plot.',
        tagline: 'Safe tagline.',
        thumbnail: 'image://poster.jpg/',
        fanart: 'image://fanart.jpg/',
        art: { poster: 'image://poster.jpg/' },
        watched: true,
        resume: { position: 12.5, total: 7020 },
        thumbnailAvailable: true,
        fanartAvailable: true,
        artwork: { poster: true },
        versions: { status: 'unsupported' }
      },
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('clones snapshots on read so callers cannot mutate store state', async () => {
    const { client, store } = createHarness();
    enqueueSuccessfulDetail(client);

    await store.refreshMovieDetail(42);

    const snapshot = store.snapshot;
    snapshot.detail!.label = 'Mutated';
    snapshot.detail!.resume!.position = 99;
    snapshot.detail!.artwork.poster = false;
    snapshot.detail!.versions = { status: 'error', message: 'mutated' };

    expect(store.snapshot.detail).toMatchObject({
      label: 'Alien',
      resume: { position: 12.5 },
      artwork: { poster: true },
      versions: { status: 'unsupported' }
    });
  });

  it('preserves prior detail and records sanitized errors when refresh fails', async () => {
    const { client, setNow, store } = createHarness();
    enqueueSuccessfulDetail(client);
    await store.refreshMovieDetail(42);

    setNow(3_000);
    client.enqueue(
      'VideoLibrary.GetMovieDetails',
      new KodiHttpClientError({
        code: 'json-rpc-error',
        method: 'VideoLibrary.GetMovieDetails',
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

    await store.refreshMovieDetail(42);

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:json-rpc-error',
      lastUpdatedAt: new Date(3_000).toISOString(),
      selectedMovieId: 42,
      detail: { movieid: 42, label: 'Alien' },
      lastError: { source: 'http', code: 'json-rpc-error' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('records no-client and malformed response failures without unsafe data', async () => {
    const { store } = createHarness({ createClient: () => null });

    await store.refreshMovieDetail(42);

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/no-active-host',
      selectedMovieId: 42,
      detail: null,
      lastError: { source: 'client', code: 'client/no-active-host' }
    });

    const { client, store: malformedStore } = createHarness();
    client.enqueue('VideoLibrary.GetMovieDetails', { moviedetails: { movieid: 'bad' } });

    await malformedStore.refreshMovieDetail(42);

    expect(malformedStore.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/malformed-movie-detail',
      selectedMovieId: 42,
      detail: null,
      lastError: { source: 'client', code: 'client/malformed-movie-detail' }
    });
    expectSecretSafe([store.snapshot, malformedStore.snapshot]);
  });

  it('suppresses stale successes and stale failures after a newer detail request completes', async () => {
    const { client, setNow, store } = createHarness();
    const slow = deferred<unknown>();
    client.enqueue('VideoLibrary.GetMovieDetails', slow);
    enqueueSuccessfulDetail(client, 8, 'Fresh movie');

    const slowRefresh = store.refreshMovieDetail(7);
    await flushPromises();
    setNow(4_000);
    await store.refreshMovieDetail(8);
    slow.resolve({ moviedetails: { movieid: 7, label: 'Stale movie' } });
    await slowRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      selectedMovieId: 8,
      detail: { movieid: 8, label: 'Fresh movie' }
    });

    const failedSlow = deferred<unknown>();
    client.enqueue('VideoLibrary.GetMovieDetails', failedSlow);
    enqueueSuccessfulDetail(client, 9, 'Newest movie');
    const failedRefresh = store.refreshMovieDetail(7);
    await flushPromises();
    await store.refreshMovieDetail(9);
    failedSlow.reject(
      new Error('Authorization: Basic abc123 raw response body smb://secret/video')
    );
    await failedRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      selectedMovieId: 9,
      detail: { movieid: 9, label: 'Newest movie' },
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });
});
