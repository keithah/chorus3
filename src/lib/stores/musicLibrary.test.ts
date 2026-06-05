import { describe, expect, it } from 'vitest';

import {
  KodiHttpClientError,
  type KodiHttpCallOptions,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createMusicLibraryStore, type MusicLibraryStoreSnapshot } from './index';

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
  const store = createMusicLibraryStore({
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

function enqueueSuccessfulLibrary(client: FakeKodiClient): void {
  client.enqueue('AudioLibrary.GetArtists', {
    artists: [
      { artistid: 1, label: 'Autechre', thumbnail: 'artist.jpg', genre: ['Electronic'] },
      { artistid: 2, label: '', genre: ['Ambient', 123] },
      { artistid: Number.NaN, label: 'Dropped artist' }
    ],
    limits: { start: 0, end: 25, total: 2 }
  });
  client.enqueue('AudioLibrary.GetAlbums', {
    albums: [
      {
        albumid: 10,
        label: 'Tri Repetae',
        title: 'Tri Repetae',
        artist: ['Autechre'],
        year: 1995,
        thumbnail: 'album.jpg'
      },
      { albumid: 11, label: '', title: '', artist: 'invalid', year: Number.POSITIVE_INFINITY }
    ],
    limits: { start: 0, end: 25, total: 2 }
  });
  client.enqueue('AudioLibrary.GetSongs', {
    songs: [
      {
        songid: 100,
        label: 'Dael',
        title: 'Dael',
        artist: ['Autechre'],
        album: 'Tri Repetae',
        duration: 380,
        track: 1,
        thumbnail: 'song.jpg',
        playcount: 4,
        lastplayed: '2026-01-01 01:02:03',
        dateadded: '2025-12-31 23:59:58',
        file: 'smb://secret/music/Dael.flac'
      },
      { songid: 101, label: '', file: 'http://admin:p@ssword@kodi.local/song.mp3' }
    ],
    limits: { start: 0, end: 25, total: 2 }
  });
  client.enqueue('AudioLibrary.GetSongs', {
    songs: [{ songid: 110, label: 'Recently Added', dateadded: '2026-02-01 01:02:03' }],
    limits: { start: 0, end: 25, total: 1 }
  });
  client.enqueue('AudioLibrary.GetSongs', {
    songs: [{ songid: 111, label: 'Recently Played', lastplayed: '2026-02-02 01:02:03' }],
    limits: { start: 0, end: 25, total: 1 }
  });
  client.enqueue('AudioLibrary.GetSongs', {
    songs: [{ songid: 112, label: 'Most Played', playcount: 99 }],
    limits: { start: 0, end: 25, total: 1 }
  });
  client.enqueue('AudioLibrary.GetGenres', {
    genres: [
      { genreid: 200, label: 'Electronic', title: 'Electronic', thumbnail: 'genre.jpg' },
      { genreid: 201, label: '' },
      { genreid: 202, genre: 'Rock' }
    ],
    limits: { start: 0, end: 25, total: 3 }
  });
}

function enqueueEmptyLibrary(client: FakeKodiClient): void {
  client.enqueue('AudioLibrary.GetArtists', {
    artists: [],
    limits: { start: 0, end: 0, total: 0 }
  });
  client.enqueue('AudioLibrary.GetAlbums', { albums: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
  client.enqueue('AudioLibrary.GetGenres', { genres: [], limits: { start: 0, end: 0, total: 0 } });
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

describe('music library store', () => {
  it('starts with stable inspectable idle defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      artists: [],
      albums: [],
      songs: [],
      recentlyAddedSongs: [],
      recentlyPlayedSongs: [],
      mostPlayedSongs: [],
      genres: [],
      limits: {
        artists: { start: 0, end: 0, total: 0 },
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 0, total: 0 },
        recentlyAddedSongs: { start: 0, end: 0, total: 0 },
        recentlyPlayedSongs: { start: 0, end: 0, total: 0 },
        mostPlayedSongs: { start: 0, end: 0, total: 0 },
        genres: { start: 0, end: 0, total: 0 }
      },
      isEmpty: true,
      lastError: null
    } satisfies MusicLibraryStoreSnapshot);
  });

  it('requests the curated Kodi music lists with bounded safe params', async () => {
    const { client, store } = createHarness();
    enqueueEmptyLibrary(client);

    await store.refresh('manual');

    expect(callParams(client.calls)).toEqual([
      {
        method: 'AudioLibrary.GetArtists',
        params: {
          properties: ['thumbnail', 'genre', 'mood', 'style'],
          limits: { start: 0, end: 500 }
        }
      },
      {
        method: 'AudioLibrary.GetAlbums',
        params: {
          properties: [
            'title',
            'artist',
            'year',
            'thumbnail',
            'genre',
            'mood',
            'style',
            'albumlabel',
            'rating',
            'dateadded',
            'playcount'
          ],
          limits: { start: 0, end: 500 }
        }
      },
      {
        method: 'AudioLibrary.GetSongs',
        params: {
          properties: [
            'title',
            'artist',
            'album',
            'duration',
            'track',
            'thumbnail',
            'playcount',
            'lastplayed',
            'dateadded',
            'genre',
            'year',
            'rating',
            'mood'
          ],
          limits: { start: 0, end: 500 }
        }
      },
      {
        method: 'AudioLibrary.GetSongs',
        params: {
          properties: [
            'title',
            'artist',
            'album',
            'duration',
            'track',
            'thumbnail',
            'playcount',
            'lastplayed',
            'dateadded',
            'year',
            'rating'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'dateadded', order: 'descending' }
        }
      },
      {
        method: 'AudioLibrary.GetSongs',
        params: {
          properties: [
            'title',
            'artist',
            'album',
            'duration',
            'track',
            'thumbnail',
            'playcount',
            'lastplayed',
            'dateadded',
            'year',
            'rating'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'lastplayed', order: 'descending' }
        }
      },
      {
        method: 'AudioLibrary.GetSongs',
        params: {
          properties: [
            'title',
            'artist',
            'album',
            'duration',
            'track',
            'thumbnail',
            'playcount',
            'lastplayed',
            'dateadded',
            'year',
            'rating'
          ],
          limits: { start: 0, end: 25 },
          sort: { method: 'playcount', order: 'descending' }
        }
      },
      {
        method: 'AudioLibrary.GetGenres',
        params: { properties: ['title', 'thumbnail'], limits: { start: 0, end: 500 } }
      }
    ]);
    expect(JSON.stringify(client.calls)).not.toContain('file');
  });

  it('deduplicates identical in-flight refreshes instead of restarting Kodi reads', async () => {
    const { client, store } = createHarness();
    const artists = deferred<unknown>();
    client.enqueue('AudioLibrary.GetArtists', artists);
    client.enqueue('AudioLibrary.GetAlbums', {
      albums: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetGenres', {
      genres: [],
      limits: { start: 0, end: 0, total: 0 }
    });

    const first = store.refresh('manual');
    const second = store.refresh('manual');
    await flushPromises();

    expect(client.calls).toHaveLength(7);

    artists.resolve({ artists: [], limits: { start: 0, end: 0, total: 0 } });
    await Promise.all([first, second]);

    expect(client.calls).toHaveLength(7);
    expect(store.snapshot.refreshStatus).toBe('ready');
  });

  it('normalizes successful artist album song and genre snapshots without leaking raw song files', async () => {
    const { client, setNow, store } = createHarness();
    enqueueSuccessfulLibrary(client);
    setNow(2_000);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(2_000).toISOString(),
      isEmpty: false,
      lastError: null,
      artists: [
        { artistid: 1, label: 'Autechre', thumbnail: 'artist.jpg', genre: ['Electronic'] },
        { artistid: 2, label: 'Unknown artist', genre: ['Ambient'] }
      ],
      albums: [
        {
          albumid: 10,
          label: 'Tri Repetae',
          title: 'Tri Repetae',
          artist: ['Autechre'],
          year: 1995,
          thumbnail: 'album.jpg'
        },
        { albumid: 11, label: 'Unknown album' }
      ],
      songs: [
        {
          songid: 100,
          label: 'Dael',
          title: 'Dael',
          artist: ['Autechre'],
          album: 'Tri Repetae',
          duration: 380,
          track: 1,
          thumbnail: 'song.jpg',
          playcount: 4,
          lastplayed: '2026-01-01 01:02:03',
          dateadded: '2025-12-31 23:59:58'
        },
        { songid: 101, label: 'Unknown song' }
      ],
      recentlyAddedSongs: [
        { songid: 110, label: 'Recently Added', dateadded: '2026-02-01 01:02:03' }
      ],
      recentlyPlayedSongs: [
        { songid: 111, label: 'Recently Played', lastplayed: '2026-02-02 01:02:03' }
      ],
      mostPlayedSongs: [{ songid: 112, label: 'Most Played', playcount: 99 }],
      genres: [
        { genreid: 200, label: 'Electronic', title: 'Electronic', thumbnail: 'genre.jpg' },
        { genreid: 201, label: 'Unknown genre' },
        { genreid: 202, label: 'Rock' }
      ]
    });
    expect(store.snapshot.limits).toEqual({
      artists: { start: 0, end: 25, total: 2 },
      albums: { start: 0, end: 25, total: 2 },
      songs: { start: 0, end: 25, total: 2 },
      recentlyAddedSongs: { start: 0, end: 25, total: 1 },
      recentlyPlayedSongs: { start: 0, end: 25, total: 1 },
      mostPlayedSongs: { start: 0, end: 25, total: 1 },
      genres: { start: 0, end: 25, total: 3 }
    });
    expectSecretSafe(store.snapshot);
  });

  it('normalizes malformed list fields and missing limits to empty safe lists', async () => {
    const { client, store } = createHarness();
    client.enqueue('AudioLibrary.GetArtists', { artists: null });
    client.enqueue('AudioLibrary.GetAlbums', { albums: { bad: true } });
    client.enqueue('AudioLibrary.GetSongs', {
      songs: ['bad', 123, null, { songid: 5, label: '' }]
    });
    client.enqueue('AudioLibrary.GetSongs', {
      songs: [
        'bad',
        { songid: Number.NaN, label: 'Dropped recent', file: 'smb://secret/recent.flac' },
        { songid: 6, label: 'Recent safe', dateadded: '2026-03-01 01:02:03' }
      ]
    });
    client.enqueue('AudioLibrary.GetSongs', { songs: { bad: true } });
    client.enqueue('AudioLibrary.GetSongs', {
      songs: [{ songid: 7, label: 'Top safe', playcount: 5 }]
    });
    client.enqueue('AudioLibrary.GetGenres', { genres: undefined });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      artists: [],
      albums: [],
      songs: [{ songid: 5, label: 'Unknown song' }],
      recentlyAddedSongs: [{ songid: 6, label: 'Recent safe', dateadded: '2026-03-01 01:02:03' }],
      recentlyPlayedSongs: [],
      mostPlayedSongs: [{ songid: 7, label: 'Top safe', playcount: 5 }],
      genres: [],
      isEmpty: false,
      limits: {
        artists: { start: 0, end: 0, total: 0 },
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 1, total: 1 },
        recentlyAddedSongs: { start: 0, end: 1, total: 1 },
        recentlyPlayedSongs: { start: 0, end: 0, total: 0 },
        mostPlayedSongs: { start: 0, end: 1, total: 1 },
        genres: { start: 0, end: 0, total: 0 }
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('sets isEmpty only when all normalized standard and discovery lists are empty', async () => {
    const empty = createHarness();
    enqueueEmptyLibrary(empty.client);
    await empty.store.refresh('manual');
    expect(empty.store.snapshot.isEmpty).toBe(true);

    const nonEmpty = createHarness();
    nonEmpty.client.enqueue('AudioLibrary.GetArtists', {
      artists: [{ artistid: 1, label: 'Autechre' }]
    });
    nonEmpty.client.enqueue('AudioLibrary.GetAlbums', { albums: [] });
    nonEmpty.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    nonEmpty.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    nonEmpty.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    nonEmpty.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    nonEmpty.client.enqueue('AudioLibrary.GetGenres', { genres: [] });
    await nonEmpty.store.refresh('manual');
    expect(nonEmpty.store.snapshot.isEmpty).toBe(false);

    const discoveryOnly = createHarness();
    discoveryOnly.client.enqueue('AudioLibrary.GetArtists', { artists: [] });
    discoveryOnly.client.enqueue('AudioLibrary.GetAlbums', { albums: [] });
    discoveryOnly.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    discoveryOnly.client.enqueue('AudioLibrary.GetSongs', {
      songs: [{ songid: 10, label: 'Recently Added' }]
    });
    discoveryOnly.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    discoveryOnly.client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    discoveryOnly.client.enqueue('AudioLibrary.GetGenres', { genres: [] });
    await discoveryOnly.store.refresh('manual');
    expect(discoveryOnly.store.snapshot.isEmpty).toBe(false);
  });

  it('preserves previous safe data and exposes sanitized errors when refresh fails', async () => {
    const { client, setNow, store } = createHarness();
    enqueueSuccessfulLibrary(client);
    await store.refresh('manual');
    const previousSongs = store.snapshot.songs;
    const previousRecentlyAddedSongs = store.snapshot.recentlyAddedSongs;
    const previousRecentlyPlayedSongs = store.snapshot.recentlyPlayedSongs;
    const previousMostPlayedSongs = store.snapshot.mostPlayedSongs;

    client.enqueue(
      'AudioLibrary.GetArtists',
      new Error(
        'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/music, localStorage, password, raw response body'
      )
    );
    setNow(3_000);

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      lastUpdatedAt: new Date(3_000).toISOString(),
      songs: previousSongs,
      recentlyAddedSongs: previousRecentlyAddedSongs,
      recentlyPlayedSongs: previousRecentlyPlayedSongs,
      mostPlayedSongs: previousMostPlayedSongs,
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports a no-client failure without requiring a live Kodi host', async () => {
    const { store } = createHarness({ createClient: () => null });

    await store.refresh('manual');

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/no-active-host',
      artists: [],
      albums: [],
      songs: [],
      recentlyAddedSongs: [],
      recentlyPlayedSongs: [],
      mostPlayedSongs: [],
      genres: [],
      lastError: {
        source: 'client',
        code: 'client/no-active-host',
        message: 'Kodi HTTP client is not configured for music library refresh.'
      }
    });
  });

  it('sanitizes Kodi HTTP errors while preserving cloned endpoint diagnostics', async () => {
    const { client, store } = createHarness();
    client.enqueue(
      'AudioLibrary.GetArtists',
      new KodiHttpClientError({
        code: 'http',
        method: 'AudioLibrary.GetArtists',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        },
        status: 500,
        statusText: 'Authorization Basic p@ssword raw response body'
      })
    );
    client.enqueue('AudioLibrary.GetAlbums', {
      albums: [],
      limits: { start: 0, end: 0, total: 0 }
    });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetGenres', {
      genres: [],
      limits: { start: 0, end: 0, total: 0 }
    });

    await store.refresh('manual');

    const firstSnapshot = store.snapshot;
    expect(firstSnapshot.lastError).toMatchObject({
      source: 'http',
      code: 'http',
      endpoint: { host: 'kodi.local', hasCredentials: true }
    });
    expectSecretSafe(firstSnapshot);

    firstSnapshot.lastError!.endpoint!.host = 'mutated.example';
    expect(store.snapshot.lastError!.endpoint!.host).toBe('kodi.local');
  });

  it('suppresses stale overlapping refresh responses so older data cannot overwrite newer snapshots', async () => {
    const { client, store } = createHarness();
    const slowArtists = deferred<unknown>();
    const slowAlbums = deferred<unknown>();
    const slowSongs = deferred<unknown>();
    const slowRecentlyAddedSongs = deferred<unknown>();
    const slowRecentlyPlayedSongs = deferred<unknown>();
    const slowMostPlayedSongs = deferred<unknown>();
    const slowGenres = deferred<unknown>();
    client.enqueue('AudioLibrary.GetArtists', slowArtists);
    client.enqueue('AudioLibrary.GetAlbums', slowAlbums);
    client.enqueue('AudioLibrary.GetSongs', slowSongs);
    client.enqueue('AudioLibrary.GetSongs', slowRecentlyAddedSongs);
    client.enqueue('AudioLibrary.GetSongs', slowRecentlyPlayedSongs);
    client.enqueue('AudioLibrary.GetSongs', slowMostPlayedSongs);
    client.enqueue('AudioLibrary.GetGenres', slowGenres);

    const slowRefresh = store.refresh('manual');
    await flushPromises();
    const staleSignal = client.calls[0].options?.signal;
    expect(staleSignal?.aborted).toBe(false);

    client.enqueue('AudioLibrary.GetArtists', { artists: [{ artistid: 2, label: 'New artist' }] });
    client.enqueue('AudioLibrary.GetAlbums', { albums: [] });
    client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    client.enqueue('AudioLibrary.GetSongs', { songs: [{ songid: 20, label: 'New recent' }] });
    client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    client.enqueue('AudioLibrary.GetSongs', { songs: [] });
    client.enqueue('AudioLibrary.GetGenres', { genres: [] });
    await store.refresh('poll');
    expect(staleSignal?.aborted).toBe(true);

    slowArtists.resolve({ artists: [{ artistid: 1, label: 'Old artist' }] });
    slowAlbums.resolve({ albums: [] });
    slowSongs.resolve({ songs: [] });
    slowRecentlyAddedSongs.resolve({ songs: [{ songid: 10, label: 'Old recent' }] });
    slowRecentlyPlayedSongs.resolve({ songs: [] });
    slowMostPlayedSongs.resolve({ songs: [] });
    slowGenres.resolve({ genres: [] });
    await slowRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'poll',
      artists: [{ artistid: 2, label: 'New artist' }],
      recentlyAddedSongs: [{ songid: 20, label: 'New recent' }]
    });
  });

  it('returns cloned snapshots so callers cannot mutate store internals', async () => {
    const { client, store } = createHarness();
    enqueueSuccessfulLibrary(client);
    await store.refresh('manual');

    const snapshot = store.snapshot;
    snapshot.artists[0].label = 'Mutated artist';
    snapshot.artists[0].genre!.push('Mutated genre');
    snapshot.albums[0].artist!.push('Mutated album artist');
    snapshot.songs[0].artist!.push('Mutated song artist');
    snapshot.recentlyAddedSongs[0].label = 'Mutated recent';
    snapshot.recentlyPlayedSongs[0].label = 'Mutated played';
    snapshot.mostPlayedSongs[0].label = 'Mutated top';
    snapshot.limits.artists.total = 999;
    snapshot.limits.recentlyAddedSongs.total = 999;

    expect(store.snapshot.artists[0]).toEqual({
      artistid: 1,
      label: 'Autechre',
      thumbnail: 'artist.jpg',
      genre: ['Electronic']
    });
    expect(store.snapshot.albums[0].artist).toEqual(['Autechre']);
    expect(store.snapshot.songs[0].artist).toEqual(['Autechre']);
    expect(store.snapshot.recentlyAddedSongs[0].label).toBe('Recently Added');
    expect(store.snapshot.recentlyPlayedSongs[0].label).toBe('Recently Played');
    expect(store.snapshot.mostPlayedSongs[0].label).toBe('Most Played');
    expect(store.snapshot.limits.artists.total).toBe(2);
    expect(store.snapshot.limits.recentlyAddedSongs.total).toBe(1);
  });
});
