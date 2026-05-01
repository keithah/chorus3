import { describe, expect, it, vi } from 'vitest';

import type {
  FileDirectoryParams,
  FileDirectoryResult,
  KodiFileItem,
  KodiMusicLibraryItem,
  PlayerGoToTarget,
  PlayerOpenItem,
  PlayerOpenParams,
  PlayerRepeatValue,
  PlayerSeekValue,
  PlayerShuffleValue,
  PlaylistAddParams,
  PlaylistItemPropertyName
} from './methods';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from './jsonRpc';
import {
  addFilePlaylistItem,
  addMusicPlaylistItem,
  addPlaylistItem,
  clearPlaylist,
  getActivePlayers,
  getApplicationProperties,
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibraryGenres,
  getAudioLibrarySongs,
  getFileDirectory,
  getFileSources,
  getJsonRpcVersion,
  getPlayerItem,
  getPlayerProperties,
  getPlaylistItems,
  getSystemProperties,
  getVideoLibraryEpisodes,
  getVideoLibraryMovies,
  getVideoLibraryTvShows,
  goToPlayerItem,
  openPlayer,
  openPlayerFile,
  openPlayerItem,
  pingKodi,
  playPausePlayer,
  prepareFileDownload,
  removePlaylistItem,
  seekPlayer,
  setApplicationMute,
  setApplicationVolume,
  setEpisodeDetails,
  setMovieDetails,
  setPlayerAudioStream,
  setPlayerRepeat,
  setPlayerShuffle,
  setPlayerSubtitle,
  setSongDetails,
  stopPlayer,
  swapPlaylistItems,
  testKodiHttpConnection
} from './methods';

type ExpectTrue<T extends true> = T;
type IsNotAssignable<TValue, TTarget> = [TValue] extends [TTarget] ? false : true;

export type KodiCommandWrapperTypeAssertions = [
  ExpectTrue<IsNotAssignable<number, PlayerSeekValue>>,
  ExpectTrue<IsNotAssignable<string, PlayerSeekValue>>,
  ExpectTrue<IsNotAssignable<'invalid-repeat', PlayerRepeatValue>>,
  ExpectTrue<IsNotAssignable<'invalid-shuffle', PlayerShuffleValue>>,
  ExpectTrue<IsNotAssignable<'last', PlayerGoToTarget>>,
  ExpectTrue<IsNotAssignable<'unknownPlaylistProperty', PlaylistItemPropertyName>>,
  ExpectTrue<IsNotAssignable<number, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<string, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<number, KodiFileItem>>,
  ExpectTrue<IsNotAssignable<string, KodiFileItem>>,
  ExpectTrue<IsNotAssignable<{ songid: number }, KodiFileItem>>,
  ExpectTrue<IsNotAssignable<{ file: string }, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<{ episodeid: number }, PlayerOpenItem>>,
  ExpectTrue<IsNotAssignable<{ item: { file: string } }, PlayerOpenParams>>,
  ExpectTrue<IsNotAssignable<{ playlistid: 0; item: { file: string } }, PlaylistAddParams>>
];

type RecordedCall = {
  method: string;
  params?: unknown;
};

function createFakeClient(
  results: unknown[] = []
): KodiJsonRpcHttpClient & { calls: RecordedCall[] } {
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

  it('gets the current player item with numeric playerid and requested properties', async () => {
    const client = createFakeClient([{ item: { id: 9, label: 'Episode 1', type: 'episode' } }]);

    await expect(getPlayerItem(client, 1, ['title', 'file', 'thumbnail'])).resolves.toEqual({
      item: { id: 9, label: 'Episode 1', type: 'episode' }
    });

    expect(client.calls).toEqual([
      {
        method: 'Player.GetItem',
        params: { playerid: 1, properties: ['title', 'file', 'thumbnail'] }
      }
    ]);
  });

  it('preserves empty player item property arrays', async () => {
    const client = createFakeClient([{ item: { label: 'Unknown' } }]);

    await expect(getPlayerItem(client, 0, [])).resolves.toEqual({ item: { label: 'Unknown' } });

    expect(client.calls).toEqual([
      {
        method: 'Player.GetItem',
        params: { playerid: 0, properties: [] }
      }
    ]);
  });

  it('propagates player item transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(getPlayerItem(client, 1, ['title'])).rejects.toBe(error);
  });

  it('gets playlist items preserving requested params including empty properties and limits', async () => {
    const client = createFakeClient([
      {
        items: [
          { id: 11, label: 'Track One', type: 'song' },
          { id: 12, label: 'Track Two', type: 'song' }
        ],
        limits: { start: 0, end: 2, total: 2 }
      }
    ]);
    const params = { playlistid: 0, properties: [], limits: { start: 0, end: 25 } } as const;

    await expect(getPlaylistItems(client, params)).resolves.toEqual({
      items: [
        { id: 11, label: 'Track One', type: 'song' },
        { id: 12, label: 'Track Two', type: 'song' }
      ],
      limits: { start: 0, end: 2, total: 2 }
    });

    expect(client.calls).toEqual([{ method: 'Playlist.GetItems', params }]);
  });

  it('gets playlist items preserving optional sort params', async () => {
    const client = createFakeClient([{ items: [{ label: 'Track One' }] }]);
    const params = {
      playlistid: 1,
      properties: ['title', 'artist'],
      sort: { method: 'label', order: 'ascending' }
    } as const;

    await expect(getPlaylistItems(client, params)).resolves.toEqual({
      items: [{ label: 'Track One' }]
    });

    expect(client.calls).toEqual([{ method: 'Playlist.GetItems', params }]);
  });

  it('opens player items preserving song, album, artist, and playlist library ids', async () => {
    const client = createFakeClient(['OK', 'OK', 'OK', 'OK']);

    await expect(openPlayer(client, { item: { songid: 42 } })).resolves.toBe('OK');
    await expect(openPlayerItem(client, { albumid: 7 })).resolves.toBe('OK');
    await expect(openPlayerItem(client, { artistid: 3 })).resolves.toBe('OK');
    await expect(openPlayerItem(client, { playlistid: 0 })).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { songid: 42 } } },
      { method: 'Player.Open', params: { item: { albumid: 7 } } },
      { method: 'Player.Open', params: { item: { artistid: 3 } } },
      { method: 'Player.Open', params: { item: { playlistid: 0 } } }
    ]);
  });

  it('adds music playlist items preserving audio playlist id and library item ids', async () => {
    const client = createFakeClient(['OK', 'OK', 'OK']);

    await expect(addPlaylistItem(client, { playlistid: 0, item: { songid: 42 } })).resolves.toBe(
      'OK'
    );
    await expect(addMusicPlaylistItem(client, { albumid: 7 })).resolves.toBe('OK');
    await expect(addMusicPlaylistItem(client, { artistid: 3 })).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 0, item: { songid: 42 } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { albumid: 7 } } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { artistid: 3 } } }
    ]);
  });

  it('propagates player open transport errors unchanged', async () => {
    const error = new KodiHttpClientError({
      code: 'network',
      endpoint: {
        protocol: 'http:',
        host: 'kodi.local',
        port: 8080,
        path: '/jsonrpc',
        timeoutMs: 25,
        hasCredentials: false
      },
      method: 'Player.Open'
    });
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(openPlayer(client, { item: { songid: 42 } })).rejects.toBe(error);
  });

  it('propagates playlist add transport errors unchanged', async () => {
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
      method: 'Playlist.Add',
      timeoutMs: 25
    });
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(addPlaylistItem(client, { playlistid: 0, item: { songid: 42 } })).rejects.toBe(
      error
    );
  });

  it('removes a playlist item preserving playlist id and position', async () => {
    const client = createFakeClient(['OK']);

    await expect(removePlaylistItem(client, 0, 3)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Playlist.Remove', params: { playlistid: 0, position: 3 } }
    ]);
  });

  it('clears a playlist preserving playlist id', async () => {
    const client = createFakeClient(['OK']);

    await expect(clearPlaylist(client, 1)).resolves.toBe('OK');

    expect(client.calls).toEqual([{ method: 'Playlist.Clear', params: { playlistid: 1 } }]);
  });

  it('swaps playlist items using Playlist.Swap semantics', async () => {
    const client = createFakeClient(['OK']);

    await expect(swapPlaylistItems(client, 0, 2, 5)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Playlist.Swap', params: { playlistid: 0, position1: 2, position2: 5 } }
    ]);
  });

  it('propagates playlist command transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(removePlaylistItem(client, 0, 3)).rejects.toBe(error);
  });

  it('toggles player playback with the exact player id', async () => {
    const client = createFakeClient([{ speed: 0 }]);

    await expect(playPausePlayer(client, 1)).resolves.toEqual({ speed: 0 });

    expect(client.calls).toEqual([{ method: 'Player.PlayPause', params: { playerid: 1 } }]);
  });

  it('stops player playback with the exact player id', async () => {
    const client = createFakeClient(['OK']);

    await expect(stopPlayer(client, 1)).resolves.toBe('OK');

    expect(client.calls).toEqual([{ method: 'Player.Stop', params: { playerid: 1 } }]);
  });

  it('goes to a player item preserving the requested target', async () => {
    const client = createFakeClient(['OK']);

    await expect(goToPlayerItem(client, 1, 'next')).resolves.toBe('OK');

    expect(client.calls).toEqual([{ method: 'Player.GoTo', params: { playerid: 1, to: 'next' } }]);
  });

  it('seeks player playback preserving percentage object values', async () => {
    const client = createFakeClient([{ percentage: 42.5 }]);

    await expect(seekPlayer(client, 1, { percentage: 42.5 })).resolves.toEqual({
      percentage: 42.5
    });

    expect(client.calls).toEqual([
      { method: 'Player.Seek', params: { playerid: 1, value: { percentage: 42.5 } } }
    ]);
  });

  it('seeks player playback preserving relative seconds object values', async () => {
    const client = createFakeClient([{ percentage: 55 }]);

    await expect(seekPlayer(client, 1, { seconds: -30 })).resolves.toEqual({ percentage: 55 });

    expect(client.calls).toEqual([
      { method: 'Player.Seek', params: { playerid: 1, value: { seconds: -30 } } }
    ]);
  });

  it('sets application volume preserving the requested volume', async () => {
    const client = createFakeClient([67]);

    await expect(setApplicationVolume(client, 67)).resolves.toBe(67);

    expect(client.calls).toEqual([{ method: 'Application.SetVolume', params: { volume: 67 } }]);
  });

  it('sets application mute preserving the requested mute value', async () => {
    const client = createFakeClient([true]);

    await expect(setApplicationMute(client, true)).resolves.toBe(true);

    expect(client.calls).toEqual([{ method: 'Application.SetMute', params: { mute: true } }]);
  });

  it('sets player shuffle preserving the requested value', async () => {
    const client = createFakeClient(['OK']);

    await expect(setPlayerShuffle(client, 1, 'toggle')).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.SetShuffle', params: { playerid: 1, shuffle: 'toggle' } }
    ]);
  });

  it('sets player repeat preserving the requested value', async () => {
    const client = createFakeClient(['OK']);

    await expect(setPlayerRepeat(client, 1, 'cycle')).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.SetRepeat', params: { playerid: 1, repeat: 'cycle' } }
    ]);
  });

  it('sets player audio stream preserving the requested stream selector', async () => {
    const client = createFakeClient(['OK']);

    await expect(setPlayerAudioStream(client, 1, 2)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.SetAudioStream', params: { playerid: 1, stream: 2 } }
    ]);
  });

  it('sets player subtitle preserving the requested subtitle selector', async () => {
    const client = createFakeClient(['OK']);

    await expect(setPlayerSubtitle(client, 1, 'off')).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.SetSubtitle', params: { playerid: 1, subtitle: 'off' } }
    ]);
  });

  it('propagates rejected command wrapper transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(stopPlayer(client, 1)).rejects.toBe(error);
  });

  it('gets file sources for the requested media type', async () => {
    const client = createFakeClient([{ sources: [{ file: 'smb://nas/music/', label: 'Music' }] }]);

    await expect(getFileSources(client, 'music')).resolves.toEqual({
      sources: [{ file: 'smb://nas/music/', label: 'Music' }]
    });

    expect(client.calls).toEqual([{ method: 'Files.GetSources', params: { media: 'music' } }]);
  });

  it('gets file directory entries preserving requested directory params', async () => {
    const client = createFakeClient([
      {
        files: [
          { file: 'smb://nas/music/Album/', filetype: 'directory', label: 'Album' },
          { file: 'smb://nas/music/song.flac', filetype: 'file', label: 'Song', type: 'unknown' }
        ],
        limits: { start: 0, end: 2, total: 2 }
      }
    ]);
    const params = {
      directory: 'smb://nas/music/',
      media: 'music',
      properties: ['file', 'title'],
      sort: { method: 'label', order: 'ascending' },
      limits: { start: 0, end: 25 }
    } as const satisfies FileDirectoryParams;

    await expect(getFileDirectory(client, params)).resolves.toEqual({
      files: [
        { file: 'smb://nas/music/Album/', filetype: 'directory', label: 'Album' },
        { file: 'smb://nas/music/song.flac', filetype: 'file', label: 'Song', type: 'unknown' }
      ],
      limits: { start: 0, end: 2, total: 2 }
    } satisfies FileDirectoryResult);

    expect(client.calls).toEqual([{ method: 'Files.GetDirectory', params }]);
  });

  it('opens a player file item preserving the exact file payload', async () => {
    const client = createFakeClient(['OK']);
    const item = { file: 'smb://nas/music/song.flac' } as const satisfies KodiFileItem;

    await expect(openPlayerFile(client, item)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { file: 'smb://nas/music/song.flac' } } }
    ]);
  });

  it('adds a file playlist item preserving playlist id and exact file payload', async () => {
    const client = createFakeClient(['OK']);
    const item = { file: 'smb://nas/music/song.flac' } as const satisfies KodiFileItem;

    await expect(addFilePlaylistItem(client, 0, item)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'smb://nas/music/song.flac' } }
      }
    ]);
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

  it('sets audio library song details with narrow scrobble fields', async () => {
    const client = createFakeClient(['OK']);

    await expect(
      setSongDetails(client, {
        songid: 42,
        playcount: 3,
        lastplayed: '2026-04-29 20:00:00'
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'AudioLibrary.SetSongDetails',
        params: { songid: 42, playcount: 3, lastplayed: '2026-04-29 20:00:00' }
      }
    ]);
  });

  it('sets video library movie details with resume progress', async () => {
    const client = createFakeClient(['OK']);

    await expect(
      setMovieDetails(client, {
        movieid: 7,
        playcount: 1,
        lastplayed: '2026-04-29 20:30:00',
        resume: { position: 123.5, total: 600 }
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.SetMovieDetails',
        params: {
          movieid: 7,
          playcount: 1,
          lastplayed: '2026-04-29 20:30:00',
          resume: { position: 123.5, total: 600 }
        }
      }
    ]);
  });

  it('sets video library episode details with resume progress', async () => {
    const client = createFakeClient(['OK']);

    await expect(
      setEpisodeDetails(client, {
        episodeid: 11,
        resume: { position: 55, total: 300 }
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.SetEpisodeDetails',
        params: { episodeid: 11, resume: { position: 55, total: 300 } }
      }
    ]);
  });

  it('preserves rejected library write transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(setSongDetails(client, { songid: 42, playcount: 1 })).rejects.toBe(error);
  });

  it('gets audio library artists preserving requested params', async () => {
    const client = createFakeClient([
      { artists: [{ artistid: 7, label: 'Bowie' }], limits: { total: 1 } }
    ]);
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

  it('gets audio library genres preserving requested params', async () => {
    const client = createFakeClient([
      {
        genres: [{ genreid: 4, label: 'Ambient' }],
        limits: { start: 0, end: 1, total: 1 }
      }
    ]);
    const params = {
      properties: ['title'],
      limits: { start: 0, end: 25 },
      sort: { method: 'label' }
    } as const;

    await expect(getAudioLibraryGenres(client, params)).resolves.toEqual({
      genres: [{ genreid: 4, label: 'Ambient' }],
      limits: { start: 0, end: 1, total: 1 }
    });

    expect(client.calls).toEqual([{ method: 'AudioLibrary.GetGenres', params }]);
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
