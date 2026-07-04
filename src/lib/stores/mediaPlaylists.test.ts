import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createMediaPlaylistsStore, type MediaPlaylistsStoreSnapshot } from './index';

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
  options: {
    client?: FakeKodiClient;
    createClient?: () => KodiJsonRpcHttpClient | null;
    media?: 'music' | 'video';
  } = {}
) {
  const client = options.client ?? new FakeKodiClient();
  let nowMs = 1_000;
  const store = createMediaPlaylistsStore({
    ...(options.createClient ? { createClient: options.createClient } : { client }),
    ...(options.media ? { media: options.media } : {}),
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

  expect(serialized).not.toContain('special://musicplaylists');
  expect(serialized).not.toContain('special://videoplaylists');
  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('https://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('smb://secret');
  expect(serialized).not.toContain('C:\\Users\\keith');
  expect(serialized).not.toContain('/mnt/private');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('raw response body');
}

function playlistId(snapshot: MediaPlaylistsStoreSnapshot, label: string): string {
  const id = snapshot.playlists.find((playlist) => playlist.label === label)?.id;
  expect(id).toEqual(expect.any(String));
  return id!;
}

function entryId(snapshot: MediaPlaylistsStoreSnapshot, label: string): string {
  const id = snapshot.entries.find((entry) => entry.label === label)?.id;
  expect(id).toEqual(expect.any(String));
  return id!;
}

describe('media playlists store', () => {
  it('starts with stable inspectable idle defaults for music media', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      media: 'music',
      playlists: [],
      entries: [],
      breadcrumbs: [],
      isEmpty: true,
      lastError: null
    } satisfies MediaPlaylistsStoreSnapshot);
  });

  it('refreshes music smart playlists with exact Kodi params, opaque ids, capabilities, and no raw paths', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('Files.GetDirectory', {
      files: [
        {
          file: 'special://musicplaylists/Favorites.xsp',
          filetype: 'file',
          label: 'Favorites'
        },
        {
          file: 'special://musicplaylists/Party.m3u',
          filetype: 'file',
          label: 'Party mix'
        },
        {
          file: 'special://musicplaylists/Radio.pls',
          filetype: 'file',
          label: 'Radio'
        },
        {
          file: 'special://musicplaylists/Notes.txt',
          filetype: 'file',
          label: 'Notes'
        },
        {
          file: 'smb://secret/music/smartplaylist.xsp',
          filetype: 'file',
          label: 'smb://secret/music/smartplaylist.xsp'
        },
        { file: '', filetype: 'file', label: 'No path' }
      ]
    });
    setNow(2_000);

    await store.refreshPlaylists();

    expect(client.calls).toEqual([
      {
        method: 'Files.GetDirectory',
        params: {
          directory: 'special://musicplaylists',
          limits: { start: 0, end: 500 },
          media: 'music',
          properties: ['title', 'file'],
          sort: { method: 'label', order: 'ascending' }
        }
      }
    ]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(2_000).toISOString(),
      media: 'music',
      playlists: [
        {
          id: 'playlist:1',
          label: 'Favorites',
          media: 'music',
          kind: 'smart',
          extension: 'xsp',
          capabilities: { canBrowse: true, canPlay: true, canQueue: true }
        },
        {
          id: 'playlist:2',
          label: 'Party mix',
          media: 'music',
          kind: 'basic',
          extension: 'm3u',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true }
        },
        {
          id: 'playlist:3',
          label: 'Radio',
          media: 'music',
          kind: 'basic',
          extension: 'pls',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true }
        },
        {
          id: 'playlist:4',
          label: 'smartplaylist.xsp',
          media: 'music',
          kind: 'smart',
          extension: 'xsp',
          capabilities: { canBrowse: true, canPlay: true, canQueue: true }
        }
      ],
      entries: [],
      breadcrumbs: [],
      isEmpty: false,
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('normalizes malformed root payloads to a safe ready empty playlist list', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetDirectory', { files: { bad: true } });

    await store.refreshPlaylists();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      playlists: [],
      entries: [],
      breadcrumbs: [],
      isEmpty: true,
      lastError: null
    });
  });

  it('opens smart playlist contents through the private xsp path and exposes safe entries', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'special://musicplaylists/Favorites.xsp', filetype: 'file', label: 'Favorites' }
      ]
    });
    await store.refreshPlaylists();

    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'smb://secret/music/Dael.flac', filetype: 'file', label: 'Dael', type: 'song' },
        {
          file: 'C:\\Users\\keith\\Music\\bad.mp3',
          filetype: 'file',
          label: 'C:\\Users\\keith\\Music\\bad.mp3'
        },
        { file: 'smb://secret/music/Albums/', filetype: 'directory', label: 'Albums' },
        { file: '', filetype: 'file', label: 'No path' }
      ]
    });
    setNow(3_000);

    await store.openPlaylist(playlistId(store.snapshot, 'Favorites'));

    expect(client.calls[1]).toEqual({
      method: 'Files.GetDirectory',
      params: {
        directory: 'special://musicplaylists/Favorites.xsp',
        limits: { start: 0, end: 500 },
        media: 'music',
        properties: ['title', 'artist', 'album', 'duration', 'track', 'thumbnail', 'file'],
        sort: { method: 'label', order: 'ascending' }
      }
    });
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'playlist:playlist:1',
      lastUpdatedAt: new Date(3_000).toISOString(),
      breadcrumbs: [{ id: 'playlist:1', label: 'Favorites' }],
      entries: [
        {
          id: 'entry:1',
          label: 'Dael',
          mediaKind: 'audio',
          extension: 'flac',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          id: 'entry:2',
          label: 'bad.mp3',
          mediaKind: 'audio',
          extension: 'mp3',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          id: 'entry:3',
          label: 'Albums',
          mediaKind: 'unsupported',
          capabilities: { canPlay: false, canQueue: false }
        }
      ],
      isEmpty: false,
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('resolves raw playlist paths only for current supported smart playlist ids', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'special://musicplaylists/Favorites.xsp', filetype: 'file', label: 'Favorites' },
        { file: 'special://musicplaylists/Party.m3u', filetype: 'file', label: 'Party mix' }
      ]
    });
    await store.refreshPlaylists();

    expect(store.getPlayablePlaylist(playlistId(store.snapshot, 'Favorites'))).toEqual({
      ok: true,
      playlist: {
        id: 'playlist:1',
        label: 'Favorites',
        mediaKind: 'music',
        playlistKind: 'smart',
        file: 'special://musicplaylists/Favorites.xsp'
      }
    });
    expect(store.getPlayablePlaylist(playlistId(store.snapshot, 'Party mix'))).toEqual({
      ok: true,
      playlist: {
        id: 'playlist:2',
        label: 'Party mix',
        mediaKind: 'music',
        playlistKind: 'basic',
        file: 'special://musicplaylists/Party.m3u'
      }
    });
    expect(store.getPlayablePlaylist('playlist:999')).toMatchObject({
      ok: false,
      error: { code: 'client/unknown-playlist' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('records safe input errors for unknown and unsupported playlist ids without Kodi calls', async () => {
    const { client, store } = createHarness();

    await store.openPlaylist('playlist:missing');
    expect(client.calls).toEqual([]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/unknown-playlist',
      lastError: { source: 'client', code: 'client/unknown-playlist' }
    });

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'special://musicplaylists/Party.m3u', filetype: 'file', label: 'Party mix' }]
    });
    await store.refreshPlaylists();
    const partyMixId = playlistId(store.snapshot, 'Party mix');
    expect(store.getPlayablePlaylist(partyMixId)).toMatchObject({
      ok: true,
      playlist: { playlistKind: 'basic', file: 'special://musicplaylists/Party.m3u' }
    });
    await store.openPlaylist(partyMixId);

    expect(client.calls).toHaveLength(1);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/unsupported-playlist',
      lastError: { source: 'client', code: 'client/unsupported-playlist' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('preserves previous safe data and exposes sanitized errors when refresh and open fail', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'special://musicplaylists/Favorites.xsp', filetype: 'file', label: 'Favorites' }
      ]
    });
    await store.refreshPlaylists();
    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/music/Dael.flac', filetype: 'file', label: 'Dael' }]
    });
    await store.openPlaylist(playlistId(store.snapshot, 'Favorites'));
    const previous = store.snapshot;

    client.enqueue(
      'Files.GetDirectory',
      new Error(
        'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/music, localStorage, password, raw response body'
      )
    );
    setNow(4_000);
    await store.refreshPlaylists();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      lastUpdatedAt: new Date(4_000).toISOString(),
      playlists: previous.playlists,
      entries: previous.entries,
      breadcrumbs: previous.breadcrumbs,
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);

    client.enqueue(
      'Files.GetDirectory',
      new Error('Authorization Basic p@ssword for /mnt/private')
    );
    await store.openPlaylist(playlistId(store.snapshot, 'Favorites'));

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      playlists: previous.playlists,
      entries: previous.entries,
      breadcrumbs: [{ id: 'playlist:1', label: 'Favorites' }],
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports no active client as safe diagnostic state', async () => {
    const store = createMediaPlaylistsStore({
      createClient: () => null,
      now: () => '2026-01-01T00:00:00.000Z'
    });

    await store.refreshPlaylists();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/no-active-host',
      playlists: [],
      entries: [],
      lastError: {
        source: 'client',
        code: 'client/no-active-host',
        message: 'Kodi HTTP client is not configured for media playlists.'
      }
    });
  });

  it('sanitizes Kodi HTTP errors while preserving cloned endpoint diagnostics', async () => {
    const { client, store } = createHarness();
    client.enqueue(
      'Files.GetDirectory',
      new KodiHttpClientError({
        code: 'http',
        method: 'Files.GetDirectory',
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

    await store.refreshPlaylists();

    const firstSnapshot = store.snapshot;
    expect(firstSnapshot.lastError).toMatchObject({
      source: 'http',
      code: 'http',
      endpoint: { host: 'kodi.local', hasCredentials: true }
    });
    expectSecretSafe(firstSnapshot);

    expect(Object.isFrozen(firstSnapshot.lastError!.endpoint)).toBe(true);
    expect(() => {
      firstSnapshot.lastError!.endpoint!.host = 'mutated.example';
    }).toThrow(TypeError);
    expect(store.snapshot.lastError!.endpoint!.host).toBe('kodi.local');
  });

  it('suppresses stale overlapping refresh and open responses', async () => {
    const { client, store } = createHarness();
    const slowRoot = deferred<unknown>();
    client.enqueue('Files.GetDirectory', slowRoot);

    const slowRefresh = store.refreshPlaylists();
    await flushPromises();

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'special://musicplaylists/New.xsp', filetype: 'file', label: 'New' }]
    });
    await store.refreshPlaylists();

    slowRoot.resolve({
      files: [{ file: 'special://musicplaylists/Old.xsp', filetype: 'file', label: 'Old' }]
    });
    await slowRefresh;

    expect(store.snapshot.playlists).toEqual([
      {
        id: 'playlist:1',
        label: 'New',
        media: 'music',
        kind: 'smart',
        extension: 'xsp',
        capabilities: { canBrowse: true, canPlay: true, canQueue: true }
      }
    ]);

    const id = playlistId(store.snapshot, 'New');
    const slowOpenDeferred = deferred<unknown>();
    client.enqueue('Files.GetDirectory', slowOpenDeferred);
    const slowOpen = store.openPlaylist(id);
    await flushPromises();

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/new/New.flac', filetype: 'file', label: 'New file' }]
    });
    await store.openPlaylist(id);

    slowOpenDeferred.resolve({
      files: [{ file: 'smb://secret/old/Old.flac', filetype: 'file', label: 'Old file' }]
    });
    await slowOpen;

    expect(store.snapshot.entries).toEqual([
      {
        id: 'entry:1',
        label: 'New file',
        mediaKind: 'audio',
        extension: 'flac',
        capabilities: { canPlay: true, canQueue: true }
      }
    ]);
    expectSecretSafe(store.snapshot);
  });

  it('returns cached frozen snapshots so callers cannot mutate media playlist internals', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'special://musicplaylists/Favorites.xsp', filetype: 'file', label: 'Favorites' }
      ]
    });
    await store.refreshPlaylists();
    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/music/Dael.flac', filetype: 'file', label: 'Dael' }]
    });
    await store.openPlaylist(playlistId(store.snapshot, 'Favorites'));

    const snapshot = store.snapshot;
    expect(store.snapshot).toBe(snapshot);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.playlists[0].capabilities)).toBe(true);
    expect(Object.isFrozen(snapshot.entries[0].capabilities)).toBe(true);
    expect(() => {
      snapshot.playlists[0].label = 'Mutated playlist';
    }).toThrow(TypeError);
    expect(() => {
      snapshot.entries[0].capabilities.canQueue = false;
    }).toThrow(TypeError);

    expect(store.snapshot).toMatchObject({
      playlists: [
        {
          id: 'playlist:1',
          label: 'Favorites',
          capabilities: { canBrowse: true, canPlay: true, canQueue: true }
        }
      ],
      entries: [
        {
          id: 'entry:1',
          label: 'Dael',
          capabilities: { canPlay: true, canQueue: true }
        }
      ],
      breadcrumbs: [{ id: 'playlist:1', label: 'Favorites' }]
    });

    expect(store.getPlayablePlaylist(entryId(store.snapshot, 'Dael'))).toMatchObject({
      ok: false,
      error: { code: 'client/unknown-playlist' }
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Dael'))).toEqual({
      ok: true,
      entry: {
        id: 'entry:1',
        label: 'Dael',
        media: 'music',
        mediaKind: 'audio',
        file: 'smb://secret/music/Dael.flac'
      }
    });
    expect(store.getPlayableEntry('entry:999')).toMatchObject({
      ok: false,
      error: { code: 'client/unknown-entry' }
    });
  });

  it('refreshes video smart playlists with video Kodi params, opaque ids, playback capabilities, and safe labels', async () => {
    const { client, setNow, store } = createHarness({ media: 'video' });
    client.enqueue('Files.GetDirectory', {
      files: [
        {
          file: 'special://videoplaylists/Recently Added.xsp',
          filetype: 'file',
          label: 'Recently Added'
        },
        { file: 'special://videoplaylists/Trailers.m3u', filetype: 'file', label: 'Trailers' },
        { file: 'special://videoplaylists/Notes.txt', filetype: 'file', label: 'Notes' },
        {
          file: 'special://videoplaylists/Private.xsp',
          filetype: 'file',
          label: 'special://videoplaylists/Private.xsp'
        },
        { file: '', filetype: 'file', label: 'No path' }
      ]
    });
    setNow(5_000);

    await store.refreshPlaylists();

    expect(client.calls).toEqual([
      {
        method: 'Files.GetDirectory',
        params: {
          directory: 'special://videoplaylists',
          limits: { start: 0, end: 500 },
          media: 'video',
          properties: ['title', 'file'],
          sort: { method: 'label', order: 'ascending' }
        }
      }
    ]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(5_000).toISOString(),
      media: 'video',
      playlists: [
        {
          id: 'playlist:1',
          label: 'Recently Added',
          media: 'video',
          kind: 'smart',
          extension: 'xsp',
          capabilities: { canBrowse: true, canPlay: true, canQueue: true }
        },
        {
          id: 'playlist:2',
          label: 'Trailers',
          media: 'video',
          kind: 'basic',
          extension: 'm3u',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true }
        },
        {
          id: 'playlist:3',
          label: 'Private.xsp',
          media: 'video',
          kind: 'smart',
          extension: 'xsp',
          capabilities: { canBrowse: true, canPlay: true, canQueue: true }
        }
      ],
      entries: [],
      breadcrumbs: [],
      isEmpty: false,
      lastError: null
    });
    expect(store.getPlayablePlaylist(playlistId(store.snapshot, 'Recently Added'))).toEqual({
      ok: true,
      playlist: {
        id: playlistId(store.snapshot, 'Recently Added'),
        label: 'Recently Added',
        mediaKind: 'video',
        playlistKind: 'smart',
        file: 'special://videoplaylists/Recently Added.xsp'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('opens video smart playlists with actionable video entries and non-actionable unsupported files', async () => {
    const { client, setNow, store } = createHarness({ media: 'video' });
    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'special://videoplaylists/Movies.xsp', filetype: 'file', label: 'Movies' }]
    });
    await store.refreshPlaylists();

    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'smb://secret/video/Movie.mkv', filetype: 'file', label: 'Movie' },
        { file: 'smb://secret/video/Clip.MP4', filetype: 'file', label: 'Clip' },
        { file: 'smb://secret/video/Trailer.m4v', filetype: 'file', label: 'Trailer' },
        { file: 'smb://secret/video/Archive.avi', filetype: 'file', label: 'Archive' },
        { file: 'smb://secret/video/Phone.mov', filetype: 'file', label: 'Phone' },
        { file: 'smb://secret/video/Web.webm', filetype: 'file', label: 'Web' },
        { file: 'smb://secret/video/Song.flac', filetype: 'file', label: 'Song' },
        { file: 'smb://secret/video/Folder/', filetype: 'directory', label: 'Folder' },
        { file: '', filetype: 'file', label: 'No path' }
      ]
    });
    setNow(6_000);

    await store.openPlaylist(playlistId(store.snapshot, 'Movies'));

    expect(client.calls[1]).toEqual({
      method: 'Files.GetDirectory',
      params: {
        directory: 'special://videoplaylists/Movies.xsp',
        limits: { start: 0, end: 500 },
        media: 'video',
        properties: ['title', 'artist', 'album', 'duration', 'track', 'thumbnail', 'file'],
        sort: { method: 'label', order: 'ascending' }
      }
    });
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'playlist:playlist:1',
      lastUpdatedAt: new Date(6_000).toISOString(),
      breadcrumbs: [{ id: 'playlist:1', label: 'Movies' }],
      entries: [
        {
          label: 'Movie',
          mediaKind: 'video',
          extension: 'mkv',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          label: 'Clip',
          mediaKind: 'video',
          extension: 'mp4',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          label: 'Trailer',
          mediaKind: 'video',
          extension: 'm4v',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          label: 'Archive',
          mediaKind: 'video',
          extension: 'avi',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          label: 'Phone',
          mediaKind: 'video',
          extension: 'mov',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          label: 'Web',
          mediaKind: 'video',
          extension: 'webm',
          capabilities: { canPlay: true, canQueue: true }
        },
        {
          label: 'Song',
          mediaKind: 'unsupported',
          extension: 'flac',
          capabilities: { canPlay: false, canQueue: false }
        },
        {
          label: 'Folder',
          mediaKind: 'unsupported',
          capabilities: { canPlay: false, canQueue: false }
        }
      ],
      isEmpty: false,
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('keeps video playlist errors, unknown ids, empty payloads, and stale responses safe', async () => {
    const { client, store } = createHarness({ media: 'video' });

    client.enqueue('Files.GetDirectory', { files: [] });
    await store.refreshPlaylists();
    expect(store.snapshot).toMatchObject({ media: 'video', playlists: [], isEmpty: true });

    await store.openPlaylist('playlist:missing');
    expect(store.snapshot.lastError).toMatchObject({ code: 'client/unknown-playlist' });

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'special://videoplaylists/Movies.xsp', filetype: 'file', label: 'Movies' }]
    });
    await store.refreshPlaylists();

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'special://videoplaylists/Movies.xsp', filetype: 'file', label: 'Movies' }]
    });
    const slowRefresh = store.refreshPlaylists();
    client.enqueue(
      'Files.GetDirectory',
      new Error('Failed opening special://videoplaylists/Secret.xsp with p@ssword')
    );
    await store.openPlaylist(playlistId(store.snapshot, 'Movies'));
    await slowRefresh;

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      lastError: { code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });
});
