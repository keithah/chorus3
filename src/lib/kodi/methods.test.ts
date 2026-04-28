import { describe, expect, it, vi } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from './jsonRpc';
import {
  getActivePlayers,
  getApplicationProperties,
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibrarySongs,
  getFileSources,
  getJsonRpcVersion,
  getPlayerProperties,
  getSystemProperties,
  getVideoLibraryEpisodes,
  getVideoLibraryMovies,
  getVideoLibraryTvShows,
  pingKodi,
  prepareFileDownload,
  testKodiHttpConnection
} from './methods';

type RecordedCall = {
  method: string;
  params?: unknown;
};

function createFakeClient(results: unknown[] = []): KodiJsonRpcHttpClient & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  return {
    calls,
    async call<TResult>(method: string, params?: unknown): Promise<TResult> {
      calls.push(params === undefined ? { method } : { method, params });
      return results.shift() as TResult;
    }
  };
}

describe('Kodi curated method wrappers', () => {
  it('pings Kodi without params', async () => {
    const client = createFakeClient(['pong']);

    await expect(pingKodi(client)).resolves.toBe('pong');

    expect(client.calls).toEqual([{ method: 'JSONRPC.Ping' }]);
  });

  it('gets the JSON-RPC version without params', async () => {
    const client = createFakeClient([{ version: '2.0' }]);

    await expect(getJsonRpcVersion(client)).resolves.toEqual({ version: '2.0' });

    expect(client.calls).toEqual([{ method: 'JSONRPC.Version' }]);
  });

  it('gets requested application properties exactly', async () => {
    const client = createFakeClient([{ name: 'Kodi', version: { major: 21 } }]);

    await expect(getApplicationProperties(client, ['name', 'version'])).resolves.toEqual({
      name: 'Kodi',
      version: { major: 21 }
    });

    expect(client.calls).toEqual([
      { method: 'Application.GetProperties', params: { properties: ['name', 'version'] } }
    ]);
  });

  it('preserves empty application property arrays', async () => {
    const client = createFakeClient([{}]);

    await expect(getApplicationProperties(client, [])).resolves.toEqual({});

    expect(client.calls).toEqual([
      { method: 'Application.GetProperties', params: { properties: [] } }
    ]);
  });

  it('gets requested system properties exactly', async () => {
    const client = createFakeClient([{ canreboot: true, canshutdown: false }]);

    await expect(getSystemProperties(client, ['canreboot', 'canshutdown'])).resolves.toEqual({
      canreboot: true,
      canshutdown: false
    });

    expect(client.calls).toEqual([
      { method: 'System.GetProperties', params: { properties: ['canreboot', 'canshutdown'] } }
    ]);
  });

  it('gets active players without params', async () => {
    const client = createFakeClient([[{ playerid: 0, type: 'audio' }]]);

    await expect(getActivePlayers(client)).resolves.toEqual([{ playerid: 0, type: 'audio' }]);

    expect(client.calls).toEqual([{ method: 'Player.GetActivePlayers' }]);
  });

  it('gets player properties with numeric playerid and requested properties', async () => {
    const client = createFakeClient([{ speed: 1, percentage: 12.5 }]);

    await expect(getPlayerProperties(client, 1, ['speed', 'percentage'])).resolves.toEqual({
      speed: 1,
      percentage: 12.5
    });

    expect(client.calls).toEqual([
      {
        method: 'Player.GetProperties',
        params: { playerid: 1, properties: ['speed', 'percentage'] }
      }
    ]);
  });

  it('gets file sources for the requested media type', async () => {
    const client = createFakeClient([{ sources: [{ file: 'smb://nas/music/', label: 'Music' }] }]);

    await expect(getFileSources(client, 'music')).resolves.toEqual({
      sources: [{ file: 'smb://nas/music/', label: 'Music' }]
    });

    expect(client.calls).toEqual([{ method: 'Files.GetSources', params: { media: 'music' } }]);
  });

  it('prepares a file download preserving the requested path', async () => {
    const client = createFakeClient([{ details: { path: '/vfs/special.mp3' }, mode: 'redirect' }]);

    await expect(prepareFileDownload(client, 'smb://nas/music/special.mp3')).resolves.toEqual({
      details: { path: '/vfs/special.mp3' },
      mode: 'redirect'
    });

    expect(client.calls).toEqual([
      { method: 'Files.PrepareDownload', params: { path: 'smb://nas/music/special.mp3' } }
    ]);
  });

  it('gets audio library artists preserving requested params', async () => {
    const client = createFakeClient([{ artists: [{ artistid: 7, label: 'Bowie' }], limits: { total: 1 } }]);
    const params = { properties: ['thumbnail'], limits: { start: 0, end: 25 } } as const;

    await expect(getAudioLibraryArtists(client, params)).resolves.toEqual({
      artists: [{ artistid: 7, label: 'Bowie' }],
      limits: { total: 1 }
    });

    expect(client.calls).toEqual([{ method: 'AudioLibrary.GetArtists', params }]);
  });

  it('gets audio library albums preserving requested params', async () => {
    const client = createFakeClient([{ albums: [{ albumid: 3, label: 'Low' }] }]);
    const params = { artistid: 7, properties: ['year'], limits: { start: 0, end: 10 } } as const;

    await expect(getAudioLibraryAlbums(client, params)).resolves.toEqual({
      albums: [{ albumid: 3, label: 'Low' }]
    });

    expect(client.calls).toEqual([{ method: 'AudioLibrary.GetAlbums', params }]);
  });

  it('gets audio library songs preserving requested params', async () => {
    const client = createFakeClient([{ songs: [{ songid: 9, label: 'Sound and Vision' }] }]);
    const params = { albumid: 3, properties: ['duration', 'track'] } as const;

    await expect(getAudioLibrarySongs(client, params)).resolves.toEqual({
      songs: [{ songid: 9, label: 'Sound and Vision' }]
    });

    expect(client.calls).toEqual([{ method: 'AudioLibrary.GetSongs', params }]);
  });

  it('gets video library movies preserving requested params', async () => {
    const client = createFakeClient([{ movies: [{ movieid: 2, label: 'Alien' }] }]);
    const params = { properties: ['year', 'runtime'], limits: { start: 0, end: 50 } } as const;

    await expect(getVideoLibraryMovies(client, params)).resolves.toEqual({
      movies: [{ movieid: 2, label: 'Alien' }]
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetMovies', params }]);
  });

  it('gets video library TV shows preserving requested params', async () => {
    const client = createFakeClient([{ tvshows: [{ tvshowid: 4, label: 'Severance' }] }]);
    const params = { properties: ['episode', 'watchedepisodes'] } as const;

    await expect(getVideoLibraryTvShows(client, params)).resolves.toEqual({
      tvshows: [{ tvshowid: 4, label: 'Severance' }]
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetTVShows', params }]);
  });

  it('gets video library episodes preserving requested params', async () => {
    const client = createFakeClient([{ episodes: [{ episodeid: 8, label: 'Hello, Ms. Cobel' }] }]);
    const params = { tvshowid: 4, season: 1, properties: ['runtime'] } as const;

    await expect(getVideoLibraryEpisodes(client, params)).resolves.toEqual({
      episodes: [{ episodeid: 8, label: 'Hello, Ms. Cobel' }]
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetEpisodes', params }]);
  });

  it('propagates Kodi HTTP client errors unchanged', async () => {
    const error = new KodiHttpClientError({
      code: 'timeout',
      endpoint: {
        protocol: 'http:',
        host: 'kodi.local',
        port: 8080,
        path: '/jsonrpc',
        timeoutMs: 25,
        hasCredentials: false
      },
      method: 'JSONRPC.Ping',
      timeoutMs: 25
    });
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(pingKodi(client)).rejects.toBe(error);
  });

  it('tests the connection with a stable ping, version, and application property sequence', async () => {
    const client = createFakeClient([
      'pong',
      { version: '2.0' },
      { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 80, muted: false }
    ]);

    await expect(testKodiHttpConnection(client)).resolves.toEqual({
      ping: 'pong',
      jsonRpcVersion: { version: '2.0' },
      application: { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 80, muted: false }
    });

    expect(client.calls).toEqual([
      { method: 'JSONRPC.Ping' },
      { method: 'JSONRPC.Version' },
      {
        method: 'Application.GetProperties',
        params: { properties: ['name', 'version', 'volume', 'muted'] }
      }
    ]);
  });
});
