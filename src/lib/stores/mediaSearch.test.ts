import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createMediaSearchStore, type MediaSearchStoreSnapshot } from './index';

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
  const store = createMediaSearchStore({
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

function enqueueMusicResults(client: FakeKodiClient): void {
  client.enqueue('AudioLibrary.GetArtists', {
    artists: [
      { artistid: 7, label: 'Autechre', thumbnail: 'artist.jpg', genre: ['Electronic'] },
      { artistid: Number.NaN, label: 'Dropped artist' }
    ],
    limits: { start: 0, end: 25, total: 1 }
  });
  client.enqueue('AudioLibrary.GetAlbums', {
    albums: [
      {
        albumid: 11,
        label: 'Tri Repetae',
        title: 'Tri Repetae',
        artist: ['Autechre'],
        year: 1995,
        thumbnail: 'album.jpg'
      }
    ],
    limits: { start: 0, end: 25, total: 1 }
  });
  client.enqueue('AudioLibrary.GetSongs', {
    songs: [
      {
        songid: 101,
        label: 'Dael',
        title: 'Dael',
        artist: ['Autechre'],
        album: 'Tri Repetae',
        duration: 380,
        track: 1,
        thumbnail: 'song.jpg',
        playcount: 4,
        lastplayed: '2026-01-01 01:02:03',
        file: 'smb://secret/music/Dael.flac'
      }
    ],
    limits: { start: 0, end: 25, total: 1 }
  });
  client.enqueue('AudioLibrary.GetGenres', {
    genres: [{ genreid: 3, label: 'Electronic', title: 'Electronic', thumbnail: 'genre.jpg' }],
    limits: { start: 0, end: 25, total: 1 }
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
  expect(serialized).not.toContain('https://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('smb://secret');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('raw response body');
}

describe('media search store', () => {
  it('starts with stable inspectable idle defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      searchStatus: 'idle',
      scope: 'music',
      query: '',
      lastUpdatedAt: null,
      results: {
        artists: [],
        albums: [],
        songs: [],
        genres: []
      },
      limits: {
        artists: { start: 0, end: 0, total: 0 },
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 0, total: 0 },
        genres: { start: 0, end: 0, total: 0 }
      },
      resultCounts: {
        artists: 0,
        albums: 0,
        songs: 0,
        genres: 0,
        total: 0
      },
      isEmpty: true,
      lastError: null
    } satisfies MediaSearchStoreSnapshot);
  });

  it('clears blank and one-character queries without making Kodi calls', async () => {
    const { client, store } = createHarness();

    await store.search('');
    await store.search('   ');
    await store.search({ scope: 'music', text: 'a' });

    expect(client.calls).toEqual([]);
    expect(store.snapshot).toMatchObject({
      searchStatus: 'idle',
      query: '',
      results: { artists: [], albums: [], songs: [], genres: [] },
      resultCounts: { artists: 0, albums: 0, songs: 0, genres: 0, total: 0 },
      isEmpty: true,
      lastError: null
    });
  });

  it('searches music with exact bounded Kodi filters and safe properties', async () => {
    const { client, store } = createHarness();
    enqueueMusicResults(client);

    await store.search({ scope: 'music', text: 'ae' });

    expect(client.calls).toEqual([
      {
        method: 'AudioLibrary.GetArtists',
        params: {
          properties: ['thumbnail', 'genre'],
          limits: { start: 0, end: 25 },
          filter: { field: 'artist', operator: 'contains', value: 'ae' },
          sort: { method: 'label', order: 'ascending' }
        }
      },
      {
        method: 'AudioLibrary.GetAlbums',
        params: {
          properties: ['title', 'artist', 'year', 'thumbnail'],
          limits: { start: 0, end: 25 },
          filter: { field: 'album', operator: 'contains', value: 'ae' },
          sort: { method: 'label', order: 'ascending' }
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
            'lastplayed'
          ],
          limits: { start: 0, end: 25 },
          filter: { field: 'title', operator: 'contains', value: 'ae' },
          sort: { method: 'title', order: 'ascending' }
        }
      },
      {
        method: 'AudioLibrary.GetGenres',
        params: {
          properties: ['title', 'thumbnail'],
          limits: { start: 0, end: 25 },
          filter: { field: 'title', operator: 'contains', value: 'ae' },
          sort: { method: 'title', order: 'ascending' }
        }
      }
    ]);
    expectSecretSafe(client.calls);
  });

  it('normalizes grouped music results and counts without leaking raw files', async () => {
    const { client, setNow, store } = createHarness();
    enqueueMusicResults(client);
    setNow(2_000);

    await store.search('ae');

    expect(store.snapshot).toMatchObject({
      searchStatus: 'ready',
      scope: 'music',
      query: 'ae',
      lastUpdatedAt: new Date(2_000).toISOString(),
      results: {
        artists: [
          {
            kind: 'artist',
            artistid: 7,
            label: 'Autechre',
            thumbnail: 'artist.jpg',
            genre: ['Electronic']
          }
        ],
        albums: [
          {
            kind: 'album',
            albumid: 11,
            label: 'Tri Repetae',
            title: 'Tri Repetae',
            artist: ['Autechre'],
            year: 1995,
            thumbnail: 'album.jpg'
          }
        ],
        songs: [
          {
            kind: 'song',
            songid: 101,
            label: 'Dael',
            title: 'Dael',
            artist: ['Autechre'],
            album: 'Tri Repetae',
            duration: 380,
            track: 1,
            thumbnail: 'song.jpg',
            playcount: 4,
            lastplayed: '2026-01-01 01:02:03'
          }
        ],
        genres: [
          {
            kind: 'genre',
            genreid: 3,
            label: 'Electronic',
            title: 'Electronic',
            thumbnail: 'genre.jpg'
          }
        ]
      },
      limits: {
        artists: { start: 0, end: 25, total: 1 },
        albums: { start: 0, end: 25, total: 1 },
        songs: { start: 0, end: 25, total: 1 },
        genres: { start: 0, end: 25, total: 1 }
      },
      resultCounts: { artists: 1, albums: 1, songs: 1, genres: 1, total: 4 },
      isEmpty: false,
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('normalizes malformed responses to safe empty result groups', async () => {
    const { client, store } = createHarness();
    client.enqueue('AudioLibrary.GetArtists', { artists: { bad: true } });
    client.enqueue('AudioLibrary.GetAlbums', { albums: null });
    client.enqueue('AudioLibrary.GetSongs', { songs: ['bad', null] });
    client.enqueue('AudioLibrary.GetGenres', { genres: undefined });

    await store.search('ae');

    expect(store.snapshot).toMatchObject({
      searchStatus: 'ready',
      query: 'ae',
      results: { artists: [], albums: [], songs: [], genres: [] },
      limits: {
        artists: { start: 0, end: 0, total: 0 },
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 0, total: 0 },
        genres: { start: 0, end: 0, total: 0 }
      },
      resultCounts: { artists: 0, albums: 0, songs: 0, genres: 0, total: 0 },
      isEmpty: true,
      lastError: null
    });
  });

  it('preserves previous safe results and exposes sanitized errors when search fails', async () => {
    const { client, setNow, store } = createHarness();
    enqueueMusicResults(client);
    await store.search('ae');
    const previous = store.snapshot;

    client.enqueue(
      'AudioLibrary.GetArtists',
      new Error(
        'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/music, localStorage, password, raw response body'
      )
    );
    setNow(3_000);

    await store.search('bad');

    expect(store.snapshot).toMatchObject({
      searchStatus: 'error',
      scope: 'music',
      query: 'bad',
      lastUpdatedAt: new Date(3_000).toISOString(),
      results: previous.results,
      limits: previous.limits,
      resultCounts: previous.resultCounts,
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports a no-client failure as safe diagnostic state', async () => {
    const store = createMediaSearchStore({
      createClient: () => null,
      now: () => '2026-01-01T00:00:00.000Z'
    });

    await store.search('ae');

    expect(store.snapshot).toMatchObject({
      searchStatus: 'error',
      query: 'ae',
      results: { artists: [], albums: [], songs: [], genres: [] },
      lastError: {
        source: 'client',
        code: 'client/no-active-host',
        message: 'Kodi HTTP client is not configured for media search.'
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

    await store.search('ae');

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

  it('suppresses stale overlapping search responses so older data cannot overwrite newer snapshots', async () => {
    const { client, store } = createHarness();
    const slowArtists = deferred<unknown>();
    const slowAlbums = deferred<unknown>();
    const slowSongs = deferred<unknown>();
    const slowGenres = deferred<unknown>();
    client.enqueue('AudioLibrary.GetArtists', slowArtists);
    client.enqueue('AudioLibrary.GetAlbums', slowAlbums);
    client.enqueue('AudioLibrary.GetSongs', slowSongs);
    client.enqueue('AudioLibrary.GetGenres', slowGenres);

    const slowSearch = store.search('old');
    await flushPromises();

    enqueueMusicResults(client);
    await store.search('new');

    slowArtists.resolve({ artists: [{ artistid: 1, label: 'Old artist' }] });
    slowAlbums.resolve({ albums: [{ albumid: 1, label: 'Old album' }] });
    slowSongs.resolve({ songs: [{ songid: 1, label: 'Old song' }] });
    slowGenres.resolve({ genres: [{ genreid: 1, label: 'Old genre' }] });
    await slowSearch;

    expect(store.snapshot).toMatchObject({
      searchStatus: 'ready',
      query: 'new',
      resultCounts: { artists: 1, albums: 1, songs: 1, genres: 1, total: 4 },
      results: {
        artists: [{ kind: 'artist', artistid: 7, label: 'Autechre' }],
        albums: [{ kind: 'album', albumid: 11, label: 'Tri Repetae' }],
        songs: [{ kind: 'song', songid: 101, label: 'Dael' }],
        genres: [{ kind: 'genre', genreid: 3, label: 'Electronic' }]
      }
    });
  });

  it('returns cloned snapshots so callers cannot mutate search internals', async () => {
    const { client, store } = createHarness();
    enqueueMusicResults(client);
    await store.search('ae');

    const snapshot = store.snapshot;
    snapshot.results.artists[0].label = 'Mutated artist';
    snapshot.results.artists[0].genre!.push('Mutated genre');
    snapshot.results.albums[0].artist!.push('Mutated album artist');
    snapshot.results.songs[0].artist!.push('Mutated song artist');
    snapshot.limits.artists.total = 999;
    snapshot.resultCounts.total = 999;

    expect(store.snapshot.results.artists[0]).toEqual({
      kind: 'artist',
      artistid: 7,
      label: 'Autechre',
      thumbnail: 'artist.jpg',
      genre: ['Electronic']
    });
    expect(store.snapshot.results.albums[0].artist).toEqual(['Autechre']);
    expect(store.snapshot.results.songs[0].artist).toEqual(['Autechre']);
    expect(store.snapshot.limits.artists.total).toBe(1);
    expect(store.snapshot.resultCounts.total).toBe(4);
  });

  it('clears in-flight search work and prevents pending results from landing', async () => {
    const { client, store } = createHarness();
    const slowArtists = deferred<unknown>();
    const slowAlbums = deferred<unknown>();
    const slowSongs = deferred<unknown>();
    const slowGenres = deferred<unknown>();
    client.enqueue('AudioLibrary.GetArtists', slowArtists);
    client.enqueue('AudioLibrary.GetAlbums', slowAlbums);
    client.enqueue('AudioLibrary.GetSongs', slowSongs);
    client.enqueue('AudioLibrary.GetGenres', slowGenres);

    const search = store.search('old');
    await flushPromises();

    store.clear();
    slowArtists.resolve({ artists: [{ artistid: 1, label: 'Old artist' }] });
    slowAlbums.resolve({ albums: [{ albumid: 1, label: 'Old album' }] });
    slowSongs.resolve({ songs: [{ songid: 1, label: 'Old song' }] });
    slowGenres.resolve({ genres: [{ genreid: 1, label: 'Old genre' }] });
    await search;

    expect(store.snapshot).toMatchObject({
      searchStatus: 'idle',
      query: '',
      results: { artists: [], albums: [], songs: [], genres: [] },
      resultCounts: { artists: 0, albums: 0, songs: 0, genres: 0, total: 0 },
      isEmpty: true,
      lastError: null
    });
  });
});
