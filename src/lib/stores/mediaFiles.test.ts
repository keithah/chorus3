import { describe, expect, it } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createMediaFilesStore, type MediaFilesMedia, type MediaFilesStoreSnapshot } from './index';

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
    media?: MediaFilesMedia;
  } = {}
) {
  const client = options.client ?? new FakeKodiClient();
  let nowMs = 1_000;
  const store = createMediaFilesStore({
    ...(options.createClient ? { createClient: options.createClient } : { client }),
    media: options.media,
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

  expect(serialized).not.toContain('"file":"');
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

function firstSourceId(snapshot: MediaFilesStoreSnapshot): string {
  const id = snapshot.sources[0]?.id;
  expect(id).toEqual(expect.any(String));
  return id!;
}

function entryId(snapshot: MediaFilesStoreSnapshot, label: string): string {
  const id = snapshot.entries.find((entry) => entry.label === label)?.id;
  expect(id).toEqual(expect.any(String));
  return id!;
}

describe('media files store', () => {
  it('starts with stable inspectable idle defaults for music media', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      refreshStatus: 'idle',
      lastRefreshReason: 'init',
      lastUpdatedAt: null,
      media: 'music',
      sources: [],
      entries: [],
      breadcrumbs: [],
      isEmpty: true,
      lastError: null
    } satisfies MediaFilesStoreSnapshot);
  });

  it('refreshes music sources with exact Kodi params and opaque safe source snapshots', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [
        { file: 'smb://secret/music/', label: 'Music share' },
        {
          file: 'http://admin:p@ssword@kodi.local/music/',
          label: 'http://admin:p@ssword@kodi.local/music'
        },
        { file: '', label: 'No path' },
        { file: '/mnt/private/music/', label: '' }
      ]
    });
    setNow(2_000);

    await store.refreshSources();

    expect(client.calls).toEqual([
      { method: 'Files.GetSources', params: { media: 'music' } },
      {
        method: 'Addons.GetAddons',
        params: {
          type: 'xbmc.addon.audio',
          content: 'unknown',
          enabled: true,
          properties: ['path', 'name']
        }
      }
    ]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: new Date(2_000).toISOString(),
      media: 'music',
      sources: [
        { id: expect.any(String), label: 'Music share' },
        { id: expect.any(String), label: 'Source 2' },
        { id: expect.any(String), label: 'music' },
        { id: 'playlist:music', label: 'Playlists' }
      ],
      entries: [],
      breadcrumbs: [],
      isEmpty: false,
      lastError: null
    });
    expect(store.snapshot.sources.map((source) => source.id)).toEqual([
      'source:1',
      'source:2',
      'source:3',
      'playlist:music'
    ]);
    expectSecretSafe(store.snapshot);
  });

  it('adds enabled Chorus2 add-on source rows to the browser source list', async () => {
    const { client, store } = createHarness({ media: 'video' });
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/videos/', label: 'Videos' }]
    });
    client.enqueue('Addons.GetAddons', {
      addons: [
        { addonid: 'plugin.video.youtube', name: 'YouTube' },
        { addonid: 'plugin.video.bad/password', name: 'Bad' }
      ]
    });

    await store.refreshSources();

    expect(client.calls).toEqual([
      { method: 'Files.GetSources', params: { media: 'video' } },
      {
        method: 'Addons.GetAddons',
        params: {
          type: 'xbmc.addon.video',
          content: 'unknown',
          enabled: true,
          properties: ['path', 'name']
        }
      }
    ]);
    expect(store.snapshot.sources).toEqual([
      { id: 'source:1', label: 'Videos' },
      { id: 'addon:plugin.video.youtube', label: 'YouTube' },
      { id: 'playlist:video', label: 'Playlists' }
    ]);
  });

  it('normalizes malformed source payloads to a safe ready empty source list', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetSources', { sources: { bad: true } });

    await store.refreshSources();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      sources: [{ id: 'playlist:music', label: 'Playlists' }],
      entries: [],
      breadcrumbs: [],
      isEmpty: false,
      lastError: null
    });
  });

  it('opens a source directory with exact Kodi params, breadcrumbs, capabilities, and no raw paths', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/music/', label: 'Music share' }]
    });
    await store.refreshSources();
    client.enqueue('Files.GetDirectory', {
      files: [
        {
          file: 'smb://secret/music/Albums/',
          filetype: 'directory',
          label: 'Albums',
          type: 'unknown'
        },
        { file: 'smb://secret/music/Dael.FLAC', filetype: 'file', label: 'Dael', type: 'song' },
        { file: 'smb://secret/music/cover.jpg', filetype: 'file', label: 'Cover', type: 'picture' },
        {
          file: 'smb://secret/music/No Label.mp3',
          filetype: 'file',
          label: 'smb://secret/music/No Label.mp3'
        },
        { file: '', filetype: 'file', label: 'Empty path' },
        {
          file: 'C:\\Users\\keith\\Music\\bad.wav',
          filetype: 'file',
          label: 'C:\\Users\\keith\\Music\\bad.wav'
        }
      ]
    });
    setNow(3_000);

    await store.openSource(firstSourceId(store.snapshot));

    expect(client.calls.find((call) => call.method === 'Files.GetDirectory')).toEqual({
      method: 'Files.GetDirectory',
      params: {
        directory: 'smb://secret/music/',
        limits: { start: 0, end: 500 },
        media: 'music',
        properties: [
          'title',
          'artist',
          'album',
          'duration',
          'track',
          'thumbnail',
          'dateadded',
          'year',
          'file'
        ],
        sort: { method: 'label', order: 'ascending' }
      }
    });
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'ready',
      lastRefreshReason: 'source:source:1',
      lastUpdatedAt: new Date(3_000).toISOString(),
      breadcrumbs: [{ id: 'source:1', label: 'Music share' }],
      entries: [
        {
          id: 'entry:1',
          kind: 'directory',
          label: 'Albums',
          capabilities: { canBrowse: true, canPlay: true, canQueue: true }
        },
        {
          id: 'entry:2',
          kind: 'file',
          label: 'Dael',
          mediaKind: 'audio',
          extension: 'flac',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
        },
        {
          id: 'entry:3',
          kind: 'file',
          label: 'Cover',
          mediaKind: 'unsupported',
          extension: 'jpg',
          capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: true }
        },
        {
          id: 'entry:4',
          kind: 'file',
          label: 'No Label.mp3',
          mediaKind: 'audio',
          extension: 'mp3',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
        },
        {
          id: 'entry:5',
          kind: 'file',
          label: 'bad.wav',
          mediaKind: 'audio',
          extension: 'wav',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
        }
      ],
      isEmpty: false,
      lastError: null
    });
    expectSecretSafe(store.snapshot);
  });

  it('opens Chorus2 plugin paths with breadcrumb rows and add-on excluded path suppression', async () => {
    const { client, store } = createHarness({ media: 'video' });
    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'plugin://plugin.video.youtube/video/1', filetype: 'file', label: 'Clip' }]
    });

    await store.openPath('plugin://plugin.video.youtube/kodion/search/results/');

    expect(client.calls[0]).toMatchObject({
      method: 'Files.GetDirectory',
      params: {
        directory: 'plugin://plugin.video.youtube/kodion/search/results/',
        media: 'video'
      }
    });
    expect(store.snapshot.breadcrumbs).toEqual([
      { id: 'plugin://plugin.video.youtube/', label: 'plugin.video.youtube' },
      { id: 'plugin://plugin.video.youtube/kodion/search/results/', label: 'results' }
    ]);
    expect(store.snapshot.entries).toMatchObject([
      {
        id: 'entry:1',
        label: 'Clip',
        capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: false }
      }
    ]);

    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'plugin://plugin.video.youtube/video/2', filetype: 'file', label: 'Root Clip' }
      ]
    });
    await store.openDirectory(store.snapshot.breadcrumbs[0].id);

    expect(
      client.calls.filter((call) => call.method === 'Files.GetDirectory').at(-1)
    ).toMatchObject({
      method: 'Files.GetDirectory',
      params: {
        directory: 'plugin://plugin.video.youtube/',
        media: 'video'
      }
    });
    expect(store.snapshot.breadcrumbs).toEqual([
      { id: 'plugin://plugin.video.youtube/', label: 'plugin.video.youtube' }
    ]);
  });

  it('opens a folder entry with breadcrumb extension and clears stale entry maps', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/music/', label: 'Music share' }]
    });
    await store.refreshSources();
    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'smb://secret/music/Albums/', filetype: 'directory', label: 'Albums' },
        { file: 'smb://secret/music/Dael.flac', filetype: 'file', label: 'Dael' }
      ]
    });
    await store.openSource(firstSourceId(store.snapshot));
    const oldFileId = entryId(store.snapshot, 'Dael');

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/music/Albums/Track.m4a', filetype: 'file', label: 'Track' }]
    });
    await store.openDirectory(entryId(store.snapshot, 'Albums'));

    expect(
      client.calls.filter((call) => call.method === 'Files.GetDirectory').at(-1)
    ).toMatchObject({
      method: 'Files.GetDirectory',
      params: { directory: 'smb://secret/music/Albums/', media: 'music' }
    });
    expect(store.snapshot).toMatchObject({
      lastRefreshReason: 'directory:entry:1',
      breadcrumbs: [
        { id: 'source:1', label: 'Music share' },
        { id: 'entry:1', label: 'Albums' }
      ],
      entries: [{ id: 'entry:1', label: 'Track', extension: 'm4a' }]
    });
    expect(store.getPlayableEntry(oldFileId)).toEqual({
      ok: false,
      error: {
        source: 'client',
        code: 'client/unknown-entry',
        message: 'The selected media file entry is no longer available.'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('resolves raw file paths only for current supported audio file entries', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/music/', label: 'Music share' }]
    });
    await store.refreshSources();
    client.enqueue('Files.GetDirectory', {
      files: [
        { file: 'smb://secret/music/Dael.mp3', filetype: 'file', label: 'Dael' },
        { file: 'smb://secret/music/Track.aac', filetype: 'file', label: 'Track AAC' },
        { file: 'smb://secret/music/Track.ogg', filetype: 'file', label: 'Track OGG' },
        { file: 'smb://secret/music/Track.wav', filetype: 'file', label: 'Track WAV' },
        { file: 'smb://secret/music/video.mkv', filetype: 'file', label: 'Video' },
        { file: 'smb://secret/music/Albums/', filetype: 'directory', label: 'Albums' }
      ]
    });
    await store.openSource(firstSourceId(store.snapshot));

    expect(store.getPlayableEntry(entryId(store.snapshot, 'Dael'))).toEqual({
      ok: true,
      entry: {
        id: 'entry:1',
        label: 'Dael',
        media: 'music',
        itemType: 'file',
        mediaKind: 'audio',
        file: 'smb://secret/music/Dael.mp3'
      }
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Track AAC'))).toMatchObject({
      ok: true
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Track OGG'))).toMatchObject({
      ok: true
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Track WAV'))).toMatchObject({
      ok: true
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Video'))).toEqual({
      ok: false,
      error: {
        source: 'client',
        code: 'client/unsupported-entry',
        message: 'The selected media file entry cannot be played or queued.'
      }
    });
    expect(store.getDownloadableEntry(entryId(store.snapshot, 'Video'))).toEqual({
      ok: true,
      entry: {
        id: 'entry:5',
        label: 'Video',
        media: 'music',
        file: 'smb://secret/music/video.mkv'
      }
    });
    expect(store.getDownloadableEntry(entryId(store.snapshot, 'Albums'))).toEqual({
      ok: false,
      error: {
        source: 'client',
        code: 'client/unsupported-entry',
        message: 'The selected media file entry cannot be downloaded.'
      }
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Albums'))).toEqual({
      ok: true,
      entry: {
        id: 'entry:6',
        label: 'Albums',
        media: 'music',
        itemType: 'directory',
        mediaKind: 'audio',
        file: 'smb://secret/music/Albums/'
      }
    });
    expect(store.getPlayableEntry('entry:999')).toMatchObject({
      ok: false,
      error: { code: 'client/unknown-entry' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('resolves raw video file paths for video browser entries', async () => {
    const { client, store } = createHarness({ media: 'video' });
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/videos/', label: 'Video share' }]
    });
    await store.refreshSources();
    client.enqueue('Files.GetDirectory', {
      files: [
        {
          file: 'smb://secret/videos/Big Buck Bunny.mkv',
          filetype: 'file',
          label: 'Big Buck Bunny'
        },
        { file: 'smb://secret/videos/Trailer.mp4', filetype: 'file', label: 'Trailer' },
        { file: 'smb://secret/videos/poster.jpg', filetype: 'file', label: 'Poster' }
      ]
    });
    await store.openSource(firstSourceId(store.snapshot));

    expect(store.getPlayableEntry(entryId(store.snapshot, 'Big Buck Bunny'))).toEqual({
      ok: true,
      entry: {
        id: 'entry:1',
        label: 'Big Buck Bunny',
        media: 'video',
        itemType: 'file',
        mediaKind: 'video',
        file: 'smb://secret/videos/Big Buck Bunny.mkv'
      }
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Trailer'))).toMatchObject({
      ok: true,
      entry: { mediaKind: 'video' }
    });
    expect(store.getPlayableEntry(entryId(store.snapshot, 'Poster'))).toMatchObject({
      ok: false,
      error: { code: 'client/unsupported-entry' }
    });
    expect(store.getDownloadableEntry(entryId(store.snapshot, 'Poster'))).toEqual({
      ok: true,
      entry: {
        id: 'entry:3',
        label: 'Poster',
        media: 'video',
        file: 'smb://secret/videos/poster.jpg'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('records safe input errors for unknown source and directory ids without Kodi calls', async () => {
    const { client, store } = createHarness();

    await store.openSource('source:missing');
    await store.openDirectory('entry:missing');

    expect(client.calls).toEqual([]);
    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/unknown-entry',
      sources: [],
      entries: [],
      breadcrumbs: [],
      lastError: {
        source: 'client',
        code: 'client/unknown-entry',
        message: 'The selected media file entry is no longer available.'
      }
    });
    expectSecretSafe(store.snapshot);
  });

  it('preserves previous safe source data and exposes sanitized errors when source refresh fails', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/music/', label: 'Music share' }]
    });
    await store.refreshSources();
    const previous = store.snapshot;

    client.enqueue(
      'Files.GetSources',
      new Error(
        'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/music, localStorage, password, raw response body'
      )
    );
    setNow(4_000);

    await store.refreshSources();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      lastUpdatedAt: new Date(4_000).toISOString(),
      sources: previous.sources,
      entries: previous.entries,
      breadcrumbs: previous.breadcrumbs,
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('preserves previous safe directory data and exposes sanitized errors when directory browse fails', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/music/', label: 'Music share' }]
    });
    await store.refreshSources();
    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/music/Dael.flac', filetype: 'file', label: 'Dael' }]
    });
    await store.openSource(firstSourceId(store.snapshot));
    const previous = store.snapshot;

    client.enqueue(
      'Files.GetDirectory',
      new Error('Authorization Basic p@ssword failed for smb://secret/music raw response body')
    );
    await store.openSource(firstSourceId(store.snapshot));

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:refresh-failed',
      sources: previous.sources,
      entries: previous.entries,
      breadcrumbs: previous.breadcrumbs,
      lastError: { source: 'unknown', code: 'refresh-failed' }
    });
    expectSecretSafe(store.snapshot);
  });

  it('reports no active client as safe diagnostic state', async () => {
    const store = createMediaFilesStore({
      createClient: () => null,
      now: () => '2026-01-01T00:00:00.000Z'
    });

    await store.refreshSources();

    expect(store.snapshot).toMatchObject({
      refreshStatus: 'error',
      lastRefreshReason: 'error:client/no-active-host',
      sources: [],
      entries: [],
      lastError: {
        source: 'client',
        code: 'client/no-active-host',
        message: 'Kodi HTTP client is not configured for media files.'
      }
    });
  });

  it('sanitizes Kodi HTTP errors while preserving cloned endpoint diagnostics', async () => {
    const { client, store } = createHarness();
    client.enqueue(
      'Files.GetSources',
      new KodiHttpClientError({
        code: 'http',
        method: 'Files.GetSources',
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

    await store.refreshSources();

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

  it('suppresses stale overlapping refresh and directory responses', async () => {
    const { client, store } = createHarness();
    const slowSources = deferred<unknown>();
    client.enqueue('Files.GetSources', slowSources);

    const slowRefresh = store.refreshSources();
    await flushPromises();

    client.enqueue('Files.GetSources', { sources: [{ file: 'smb://secret/new/', label: 'New' }] });
    await store.refreshSources();

    slowSources.resolve({ sources: [{ file: 'smb://secret/old/', label: 'Old' }] });
    await slowRefresh;

    expect(store.snapshot.sources).toEqual([
      { id: 'source:1', label: 'New' },
      { id: 'playlist:music', label: 'Playlists' }
    ]);

    const sourceId = firstSourceId(store.snapshot);
    const slowDirectory = deferred<unknown>();
    client.enqueue('Files.GetDirectory', slowDirectory);
    const slowOpen = store.openSource(sourceId);
    await flushPromises();

    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/new/New.flac', filetype: 'file', label: 'New file' }]
    });
    await store.openSource(sourceId);

    slowDirectory.resolve({
      files: [{ file: 'smb://secret/old/Old.flac', filetype: 'file', label: 'Old file' }]
    });
    await slowOpen;

    expect(store.snapshot.entries).toEqual([
      {
        id: 'entry:1',
        kind: 'file',
        label: 'New file',
        mediaKind: 'audio',
        extension: 'flac',
        capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
      }
    ]);
    expectSecretSafe(store.snapshot);
  });

  it('returns cloned snapshots so callers cannot mutate media files internals', async () => {
    const { client, store } = createHarness();
    client.enqueue('Files.GetSources', {
      sources: [{ file: 'smb://secret/music/', label: 'Music share' }]
    });
    await store.refreshSources();
    client.enqueue('Files.GetDirectory', {
      files: [{ file: 'smb://secret/music/Dael.flac', filetype: 'file', label: 'Dael' }]
    });
    await store.openSource(firstSourceId(store.snapshot));

    const snapshot = store.snapshot;
    snapshot.sources[0].label = 'Mutated source';
    snapshot.entries[0].label = 'Mutated entry';
    snapshot.entries[0].capabilities.canPlay = false;
    snapshot.breadcrumbs[0].label = 'Mutated crumb';

    expect(store.snapshot).toMatchObject({
      sources: [
        { id: 'source:1', label: 'Music share' },
        { id: 'playlist:music', label: 'Playlists' }
      ],
      entries: [
        {
          id: 'entry:1',
          label: 'Dael',
          capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
        }
      ],
      breadcrumbs: [{ id: 'source:1', label: 'Music share' }]
    });
  });
});
