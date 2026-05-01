import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createVideoTvStore, type VideoTvStoreSnapshot } from './index';

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
  const store = createVideoTvStore({
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

describe('video TV store', () => {
  it('starts with stable inspectable idle defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      selectedTvShowId: null,
      selectedSeason: null,
      selectedEpisodeId: null,
      tvShows: [],
      tvShowDetail: null,
      seasons: [],
      episodes: [],
      episodeDetail: null,
      limits: {
        tvShows: { start: 0, end: 0, total: 0 },
        seasons: { start: 0, end: 0, total: 0 },
        episodes: { start: 0, end: 0, total: 0 }
      },
      seasonArtworkCapability: { status: 'unavailable', reason: 'No season selected.' },
      lastError: null
    } satisfies VideoTvStoreSnapshot);
  });

  it('requests bounded TV show reads without Kodi file properties', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetTVShows', {
      tvshows: [{ tvshowid: 7, label: 'Severance', episode: 9, watchedepisodes: 3 }],
      limits: { start: 0, end: 25, total: 1 }
    });

    await store.refreshTvShows('manual');

    expect(client.calls).toEqual([
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
    expect(store.snapshot.tvShows[0]).toMatchObject({
      tvshowid: 7,
      unwatchedEpisodes: 6,
      hasUnwatched: true
    });
  });

  it('refreshes TV show details and seasons while preserving safe snapshots', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('VideoLibrary.GetTVShowDetails', {
      tvshowdetails: {
        tvshowid: 7,
        label: 'Severance',
        plot: 'Safe plot',
        art: { poster: 'poster.jpg', file: 'smb://secret/poster.jpg' },
        episode: 9,
        watchedepisodes: 3,
        file: 'smb://secret/show'
      }
    });
    client.enqueue('VideoLibrary.GetSeasons', {
      seasons: [
        { tvshowid: 7, season: 2, label: 'Season 2', episode: 3, watchedepisodes: 1 },
        { tvshowid: 7, season: -1, label: 'Dropped specials' }
      ],
      limits: { start: 0, end: 25, total: 1 }
    });
    setNow(2_000);

    await store.refreshTvShow(7, 'manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(2_000).toISOString(),
      selectedTvShowId: 7,
      tvShowDetail: {
        tvshowid: 7,
        label: 'Severance',
        plot: 'Safe plot',
        artwork: { poster: true },
        unwatchedEpisodes: 6,
        hasUnwatched: true
      },
      seasons: [
        {
          tvshowid: 7,
          season: 2,
          label: 'Season 2',
          unwatchedEpisodes: 2,
          hasUnwatched: true
        }
      ],
      limits: { seasons: { start: 0, end: 25, total: 1 } },
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('refreshes ordered season episodes and episode detail with resume state', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetEpisodes', {
      episodes: [
        {
          episodeid: 12,
          tvshowid: 7,
          season: 2,
          episode: 2,
          label: 'Second',
          playcount: 1,
          resume: { position: 0, total: 3600 }
        },
        {
          episodeid: 11,
          tvshowid: 7,
          season: 2,
          episode: 1,
          title: 'First',
          playcount: 0,
          resume: { position: 123, total: 3600 },
          file: 'http://admin:p@ssword@kodi.local/episode.mkv'
        }
      ],
      limits: { start: 0, end: 25, total: 2 }
    });
    client.enqueue('VideoLibrary.GetEpisodeDetails', {
      episodedetails: {
        episodeid: 11,
        tvshowid: 7,
        season: 2,
        episode: 1,
        title: 'First',
        plot: 'Safe episode plot',
        playcount: 0,
        resume: { position: 123, total: 3600 }
      }
    });

    await store.refreshSeasonEpisodes(7, 2, 'manual');
    await store.refreshEpisodeDetail(11, 'manual');

    expect(store.snapshot.episodes.map((episode) => episode.episodeid)).toEqual([11, 12]);
    expect(store.snapshot).toMatchObject({
      selectedTvShowId: 7,
      selectedSeason: 2,
      selectedEpisodeId: 11,
      episodes: [
        { episodeid: 11, label: 'First', watched: false, resume: { position: 123, total: 3600 } },
        { episodeid: 12, label: 'Second', watched: true, resume: { position: 0, total: 3600 } }
      ],
      episodeDetail: {
        episodeid: 11,
        label: 'First',
        plot: 'Safe episode plot',
        watched: false,
        resume: { position: 123, total: 3600 }
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports season artwork capability as supported unsupported unavailable or error honestly', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetAvailableArtTypes', {
      availablearttypes: ['poster', 'fanart']
    });
    client.enqueue('VideoLibrary.GetAvailableArt', {
      availableart: { poster: ['image://poster.jpg/'], fanart: [], file: ['smb://secret/art.jpg'] }
    });

    await store.refreshSeasonArtworkCapability(7, 2, 'manual');

    expect(store.snapshot.seasonArtworkCapability).toEqual({
      status: 'supported',
      reason: 'Season artwork refresh is available.',
      availableArtTypes: ['poster', 'fanart'],
      availableArtwork: { poster: true, fanart: false }
    });
    expectSecretSafe(store.snapshot.seasonArtworkCapability);

    client.enqueue('VideoLibrary.GetAvailableArtTypes', { availablearttypes: [] });
    client.enqueue('VideoLibrary.GetAvailableArt', { availableart: {} });
    await store.refreshSeasonArtworkCapability(7, 3, 'manual');
    expect(store.snapshot.seasonArtworkCapability).toMatchObject({ status: 'unsupported' });

    client.enqueue(
      'VideoLibrary.GetAvailableArtTypes',
      new KodiHttpClientError({
        code: 'json-rpc-error',
        method: 'VideoLibrary.GetAvailableArtTypes',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        },
        jsonRpcError: {
          code: -32601,
          message: 'Authorization: Basic abc123 raw response body smb://secret/art'
        }
      })
    );
    await store.refreshSeasonArtworkCapability(7, 4, 'manual');
    expect(store.snapshot.seasonArtworkCapability).toMatchObject({
      status: 'error',
      message: expect.stringContaining('credentials [redacted]')
    });
    expectSecretSafe(store.snapshot);
  });

  it('rejects invalid IDs before calling Kodi and preserves prior safe data on later failures', async () => {
    const { client, store } = createHarness();
    await store.refreshTvShow(Number.NaN, 'manual');
    await store.refreshSeasonEpisodes(7, -1, 'manual');
    await store.refreshEpisodeDetail(0, 'manual');
    await store.refreshSeasonArtworkCapability(7, Number.POSITIVE_INFINITY, 'manual');

    expect(client.calls).toEqual([]);
    expect(store.snapshot.lastError).toMatchObject({ source: 'client' });

    client.enqueue('VideoLibrary.GetTVShows', {
      tvshows: [{ tvshowid: 7, label: 'Safe show' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    await store.refreshTvShows('manual');
    client.enqueue(
      'VideoLibrary.GetTVShows',
      new Error('Authorization: Basic abc123 raw response body smb://secret/show')
    );
    await store.refreshTvShows('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      tvShows: [{ tvshowid: 7, label: 'Safe show' }],
      lastError: { code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('clones snapshots and suppresses stale TV show refresh responses', async () => {
    const { client, store } = createHarness();
    client.enqueue('VideoLibrary.GetTVShows', {
      tvshows: [{ tvshowid: 7, label: 'Mutable', art: { poster: 'poster.jpg' } }],
      limits: { start: 0, end: 25, total: 1 }
    });
    await store.refreshTvShows('manual');

    const snapshot = store.snapshot;
    snapshot.tvShows[0].label = 'Mutated';
    snapshot.tvShows[0].art!.poster = 'mutated.jpg';
    snapshot.limits.tvShows.total = 999;

    expect(store.snapshot.tvShows[0]).toMatchObject({
      label: 'Mutable',
      art: { poster: 'poster.jpg' }
    });
    expect(store.snapshot.limits.tvShows.total).toBe(1);

    const slow = deferred<unknown>();
    client.enqueue('VideoLibrary.GetTVShows', slow);
    client.enqueue('VideoLibrary.GetTVShows', {
      tvshows: [{ tvshowid: 8, label: 'Fresh show' }],
      limits: { start: 0, end: 25, total: 1 }
    });

    const slowRefresh = store.refreshTvShows('manual');
    await flushPromises();
    await store.refreshTvShows('poll');
    slow.resolve({
      tvshows: [{ tvshowid: 9, label: 'Stale show' }],
      limits: { start: 0, end: 25, total: 1 }
    });
    await slowRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'poll',
      tvShows: [{ tvshowid: 8, label: 'Fresh show' }]
    });
  });
});
