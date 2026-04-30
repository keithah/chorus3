import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  createMusicBrowseStore,
  type MusicBrowseSelection,
  type MusicBrowseStoreSnapshot
} from './index';

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
  const store = createMusicBrowseStore({
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

function artistSelection(overrides: Partial<MusicBrowseSelection> = {}): MusicBrowseSelection {
  return { kind: 'artist', id: 7, label: 'Autechre', ...overrides } as MusicBrowseSelection;
}

function albumSelection(overrides: Partial<MusicBrowseSelection> = {}): MusicBrowseSelection {
  return { kind: 'album', id: 11, label: 'Tri Repetae', ...overrides } as MusicBrowseSelection;
}

function genreSelection(overrides: Partial<MusicBrowseSelection> = {}): MusicBrowseSelection {
  return { kind: 'genre', id: 3, label: 'Electronic', ...overrides } as MusicBrowseSelection;
}

function enqueueAlbumsAndSongs(client: FakeKodiClient): void {
  client.enqueue('AudioLibrary.GetAlbums', {
    albums: [
      {
        albumid: 11,
        label: 'Tri Repetae',
        title: 'Tri Repetae',
        artist: ['Autechre'],
        year: 1995,
        thumbnail: 'album.jpg'
      },
      { albumid: 12, label: '', title: '', artist: [123], year: Number.NaN },
      { albumid: Number.POSITIVE_INFINITY, label: 'Dropped album' }
    ],
    limits: { start: 0, end: 50, total: 2 }
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
      },
      { songid: 102, label: '', file: 'http://admin:p@ssword@kodi.local/song.mp3' },
      { songid: Number.NaN, label: 'Dropped song' }
    ],
    limits: { start: 0, end: 50, total: 2 }
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

describe('music browse store', () => {
  it('starts with stable inspectable idle defaults', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      selection: null,
      albums: [],
      songs: [],
      limits: {
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 0, total: 0 }
      },
      isEmpty: true,
      lastError: null
    } satisfies MusicBrowseStoreSnapshot);
  });

  it('browses an artist with exact bounded Kodi filters and safe sort params', async () => {
    const { client, store } = createHarness();
    enqueueAlbumsAndSongs(client);

    await store.browseArtist({ artistid: 7, label: 'Autechre' });

    expect(client.calls).toEqual([
      {
        method: 'AudioLibrary.GetAlbums',
        params: {
          properties: ['title', 'artist', 'year', 'thumbnail'],
          limits: { start: 0, end: 50 },
          filter: { artistid: 7 },
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
          limits: { start: 0, end: 50 },
          filter: { artistid: 7 }
        }
      }
    ]);
    expect(JSON.stringify(client.calls)).not.toContain('file');
  });

  it('normalizes artist browse albums and songs without leaking raw song files', async () => {
    const { client, setNow, store } = createHarness();
    enqueueAlbumsAndSongs(client);
    setNow(2_000);

    await store.browseArtist({ artistid: 7, label: 'Autechre' });

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'artist:7',
      lastUpdatedAt: new Date(2_000).toISOString(),
      selection: { kind: 'artist', id: 7, label: 'Autechre' },
      albums: [
        {
          albumid: 11,
          label: 'Tri Repetae',
          title: 'Tri Repetae',
          artist: ['Autechre'],
          year: 1995,
          thumbnail: 'album.jpg'
        },
        { albumid: 12, label: 'Unknown album' }
      ],
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
          lastplayed: '2026-01-01 01:02:03'
        },
        { songid: 102, label: 'Unknown song' }
      ],
      limits: {
        albums: { start: 0, end: 50, total: 2 },
        songs: { start: 0, end: 50, total: 2 }
      },
      isEmpty: false,
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('browses an album with exact track-sorted song params and no album request', async () => {
    const { client, store } = createHarness();
    client.enqueue('AudioLibrary.GetSongs', {
      songs: [{ songid: 101, label: 'Dael', track: 1 }],
      limits: { start: 0, end: 50, total: 1 }
    });

    await store.browseAlbum({ albumid: 11, label: 'Tri Repetae' });

    expect(client.calls).toEqual([
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
          limits: { start: 0, end: 50 },
          filter: { albumid: 11 },
          sort: { method: 'track', order: 'ascending' }
        }
      }
    ]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'album:11',
      selection: { kind: 'album', id: 11, label: 'Tri Repetae' },
      albums: [],
      songs: [{ songid: 101, label: 'Dael', track: 1 }],
      limits: {
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 50, total: 1 }
      },
      isEmpty: false
    });
  });

  it('browses a genre with exact bounded Kodi filters and reports empty detail state', async () => {
    const { client, store } = createHarness();
    client.enqueue('AudioLibrary.GetAlbums', { albums: [], limits: { start: 0, end: 0, total: 0 } });
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });

    await store.browseGenre({ genreid: 3, label: 'Electronic' });

    expect(client.calls).toEqual([
      {
        method: 'AudioLibrary.GetAlbums',
        params: {
          properties: ['title', 'artist', 'year', 'thumbnail'],
          limits: { start: 0, end: 50 },
          filter: { genreid: 3 },
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
          limits: { start: 0, end: 50 },
          filter: { genreid: 3 }
        }
      }
    ]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'genre:3',
      selection: { kind: 'genre', id: 3, label: 'Electronic' },
      albums: [],
      songs: [],
      isEmpty: true,
      lastError: null
    });
  });

  it('normalizes malformed responses and invalid list entries to safe empty detail lists', async () => {
    const { client, store } = createHarness();
    client.enqueue('AudioLibrary.GetAlbums', { albums: { bad: true } });
    client.enqueue('AudioLibrary.GetSongs', {
      songs: ['bad', null, { songid: 5, label: '', file: 'smb://secret/music/song.flac' }]
    });

    await store.browseArtist({ artistid: 7, label: 'Autechre' });

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      albums: [],
      songs: [{ songid: 5, label: 'Unknown song' }],
      limits: {
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 1, total: 1 }
      },
      isEmpty: false
    });
    expectSecretSafe(store.snapshot);
  });

  it('ignores invalid selections without making Kodi calls or building filters from labels', async () => {
    const { client, store } = createHarness();

    await store.browseArtist({ artistid: Number.NaN, label: 'smb://secret/artist' });
    await store.browseAlbum({ albumid: -1, label: 'http://admin:p@ssword@kodi.local/album' });
    await store.browseGenre({ genreid: Number.POSITIVE_INFINITY, label: 'Electronic' });

    expect(client.calls).toEqual([]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/invalid-selection',
      selection: null,
      albums: [],
      songs: [],
      lastError: {
        source: 'client',
        code: 'client/invalid-selection',
        message: 'A finite positive music browse selection id is required.'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('clears selection and cancels in-flight browse work', async () => {
    const { client, store } = createHarness();
    const slowAlbums = deferred<unknown>();
    const slowSongs = deferred<unknown>();
    client.enqueue('AudioLibrary.GetAlbums', slowAlbums);
    client.enqueue('AudioLibrary.GetSongs', slowSongs);

    const browse = store.browseArtist({ artistid: 7, label: 'Autechre' });
    await flushPromises();

    store.clearSelection();
    slowAlbums.resolve({ albums: [{ albumid: 11, label: 'Old album' }] });
    slowSongs.resolve({ songs: [{ songid: 101, label: 'Old song' }] });
    await browse;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'idle',
      lastRefreshReason: 'manual',
      selection: null,
      albums: [],
      songs: [],
      limits: {
        albums: { start: 0, end: 0, total: 0 },
        songs: { start: 0, end: 0, total: 0 }
      },
      isEmpty: true,
      lastError: null
    });
  });

  it('preserves previous safe detail data and exposes sanitized errors when browsing fails', async () => {
    const { client, setNow, store } = createHarness();
    enqueueAlbumsAndSongs(client);
    await store.browseArtist({ artistid: 7, label: 'Autechre' });
    const previous = store.snapshot;

    client.enqueue(
      'AudioLibrary.GetSongs',
      new Error(
        'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/music, localStorage, password, raw response body'
      )
    );
    setNow(3_000);

    await store.browseAlbum({ albumid: 11, label: 'Tri Repetae' });

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      lastUpdatedAt: new Date(3_000).toISOString(),
      selection: { kind: 'album', id: 11, label: 'Tri Repetae' },
      albums: previous.albums,
      songs: previous.songs,
      limits: previous.limits,
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports a no-client failure without clearing previous safe browse data', async () => {
    const client = new FakeKodiClient();
    const { store } = createHarness({ createClient: () => client });
    enqueueAlbumsAndSongs(client);
    await store.browseArtist({ artistid: 7, label: 'Autechre' });

    const unavailable = createMusicBrowseStore({
      createClient: () => null,
      now: () => '2026-01-01T00:00:00.000Z'
    });

    await unavailable.browseGenre({ genreid: 3, label: 'Electronic' });

    expect(unavailable.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/no-active-host',
      albums: [],
      songs: [],
      lastError: {
        source: 'client',
        code: 'client/no-active-host',
        message: 'Kodi HTTP client is not configured for music browse refresh.'
      }
    });
  });

  it('sanitizes Kodi HTTP errors while preserving cloned endpoint diagnostics', async () => {
    const { client, store } = createHarness();
    client.enqueue(
      'AudioLibrary.GetAlbums',
      new KodiHttpClientError({
        code: 'http',
        method: 'AudioLibrary.GetAlbums',
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

    await store.browseArtist({ artistid: 7, label: 'Autechre' });

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

  it('suppresses stale overlapping browse responses so older data cannot overwrite newer snapshots', async () => {
    const { client, store } = createHarness();
    const slowAlbums = deferred<unknown>();
    const slowSongs = deferred<unknown>();
    client.enqueue('AudioLibrary.GetAlbums', slowAlbums);
    client.enqueue('AudioLibrary.GetSongs', slowSongs);

    const slowBrowse = store.browseArtist({ artistid: 7, label: 'Old artist' });
    await flushPromises();

    client.enqueue('AudioLibrary.GetSongs', { songs: [{ songid: 2, label: 'New song' }] });
    await store.browseAlbum({ albumid: 11, label: 'New album' });

    slowAlbums.resolve({ albums: [{ albumid: 1, label: 'Old album' }] });
    slowSongs.resolve({ songs: [{ songid: 1, label: 'Old song' }] });
    await slowBrowse;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'album:11',
      selection: { kind: 'album', id: 11, label: 'New album' },
      albums: [],
      songs: [{ songid: 2, label: 'New song' }]
    });
  });

  it('returns cloned snapshots so callers cannot mutate browse internals', async () => {
    const { client, store } = createHarness();
    enqueueAlbumsAndSongs(client);
    await store.browseArtist({ artistid: 7, label: 'Autechre' });

    const snapshot = store.snapshot;
    snapshot.selection!.label = 'Mutated selection';
    snapshot.albums[0].label = 'Mutated album';
    snapshot.albums[0].artist!.push('Mutated artist');
    snapshot.songs[0].artist!.push('Mutated song artist');
    snapshot.limits.albums.total = 999;

    expect(store.snapshot.selection).toEqual({ kind: 'artist', id: 7, label: 'Autechre' });
    expect(store.snapshot.albums[0]).toEqual({
      albumid: 11,
      label: 'Tri Repetae',
      title: 'Tri Repetae',
      artist: ['Autechre'],
      year: 1995,
      thumbnail: 'album.jpg'
    });
    expect(store.snapshot.songs[0].artist).toEqual(['Autechre']);
    expect(store.snapshot.limits.albums.total).toBe(2);
  });

  it('accepts normalized selection picks only and uses finite ids with safe fallback labels', async () => {
    const { client, store } = createHarness();
    client.enqueue('AudioLibrary.GetSongs', { songs: [], limits: { start: 0, end: 0, total: 0 } });

    await store.browseAlbum({ albumid: 11, label: '' });

    expect(client.calls[0].params).toMatchObject({ filter: { albumid: 11 } });
    expect(store.snapshot.selection).toEqual({ kind: 'album', id: 11, label: 'Unknown album' });
    expectSecretSafe(store.snapshot);
  });
});
