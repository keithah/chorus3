import { describe, expect, it, vi } from 'vitest';

import type {
  AddonEnabledFilter,
  AddonInstalledFilter,
  AddonPropertyName,
  AddonSetEnabledValue,
  AddonsExecuteAddonParams,
  AddonsGetAddonDetailsParams,
  AddonsGetAddonsParams,
  AddonsSetAddonEnabledParams,
  AudioLibraryCleanParams,
  AudioLibraryScanParams,
  AudioLibrarySetAlbumDetailsParams,
  AudioLibrarySetArtistDetailsParams,
  FileDirectoryParams,
  FileDirectoryResult,
  FileDetailsParams,
  FileDetailsResult,
  KodiFileItem,
  KodiMovieLibraryItem,
  KodiMusicLibraryItem,
  KodiPlaylistFileItem,
  PlayerGoToTarget,
  PlayerOpenItem,
  RemoteInputAction,
  RemoteInputCommand,
  PlayerOpenMovieParams,
  PlayerOpenParams,
  PlayerPartyModeValue,
  PlayerRepeatValue,
  PlayerSeekValue,
  PlayerShuffleValue,
  PlaylistAddMovieParams,
  PlaylistAddParams,
  PlaylistInsertParams,
  PlaylistItemPropertyName,
  PvrGetBroadcastsParams,
  PvrGetChannelDetailsParams,
  PvrGetChannelsParams,
  PvrDeleteTimerParams,
  PvrGetRecordingDetailsParams,
  PvrRecordParams,
  PvrTimerBroadcastParams,
  SettingsGetCategoriesParams,
  SettingsGetSettingsParams,
  SettingsSetSettingValueParams,
  SettingsSettingValue,
  VideoLibraryRefreshMovieParams,
  VideoLibraryCleanParams,
  VideoLibraryScanParams,
  VideoLibrarySetMusicVideoDetailsParams,
  VideoLibrarySetTvShowDetailsParams,
  JsonRpcIntrospectionParams
} from './methods';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from './jsonRpc';
import {
  addFilePlaylistItem,
  addMoviePlaylistItem,
  addMusicPlaylistItem,
  addPlaylistFileItem,
  addPlaylistItem,
  cleanAudioLibrary,
  cleanVideoLibrary,
  clearPlaylist,
  executeAddon,
  getAddonDetails,
  getAddons,
  getActivePlayers,
  getApplicationProperties,
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibraryGenres,
  getAudioLibrarySongs,
  getFileDirectory,
  getFileDetails,
  getFileSources,
  getJsonRpcIntrospection,
  getJsonRpcVersion,
  getPlayerItem,
  getPlayerProperties,
  insertPlaylistItem,
  getPlaylistItems,
  getPvrBroadcasts,
  getPvrChannelDetails,
  getPvrChannels,
  getPvrRecordingDetails,
  getPvrRecordings,
  recordPvrChannel,
  togglePvrTimer,
  addPvrTimer,
  deletePvrTimer,
  getSettings,
  getSettingsCategories,
  getSettingsSections,
  getSystemProperties,
  getVideoLibraryEpisodes,
  getVideoLibraryMusicVideoDetails,
  getVideoLibraryMusicVideos,
  getVideoLibraryMovieDetails,
  getVideoLibraryMovies,
  getVideoLibraryTvShows,
  getVideoLibraryTvShowDetails,
  getVideoLibrarySeasons,
  getVideoLibrarySeasonDetails,
  getVideoLibraryEpisodeDetails,
  getVideoLibraryAvailableArt,
  getVideoLibraryAvailableArtTypes,
  refreshVideoLibraryMovie,
  refreshVideoLibraryTvShow,
  refreshVideoLibraryEpisode,
  setSeasonDetails,
  goToPlayerItem,
  openPlayer,
  openPlayerFile,
  openPlayerItem,
  openPlayerMovieItem,
  openPlayerPlaylistFile,
  pingKodi,
  playPausePlayer,
  prepareFileDownload,
  removePlaylistItem,
  seekPlayer,
  scanAudioLibrary,
  scanVideoLibrary,
  executeInputAction,
  sendInputCommand,
  sendInputText,
  setAddonEnabled,
  setApplicationMute,
  setApplicationVolume,
  setAlbumDetails,
  setArtistDetails,
  setEpisodeDetails,
  setMovieDetails,
  setMusicVideoDetails,
  setTvShowDetails,
  setPlayerAudioStream,
  setPlayerPartyMode,
  setPlayerRepeat,
  setPlayerShuffle,
  setPlayerSubtitle,
  setSettingValue,
  setSongDetails,
  stopPlayer,
  swapPlaylistItems,
  testKodiHttpConnection
} from './methods';

type ExpectTrue<T extends true> = T;
type IsNotAssignable<TValue, TTarget> = [TValue] extends [TTarget] ? false : true;

export type KodiCommandWrapperTypeAssertions = [
  ExpectTrue<IsNotAssignable<number, PlayerSeekValue>>,
  ExpectTrue<IsNotAssignable<string, RemoteInputCommand>>,
  ExpectTrue<IsNotAssignable<string, RemoteInputAction>>,
  ExpectTrue<IsNotAssignable<'sendText', RemoteInputCommand>>,
  ExpectTrue<IsNotAssignable<'power', RemoteInputCommand>>,
  ExpectTrue<IsNotAssignable<string, PlayerSeekValue>>,
  ExpectTrue<IsNotAssignable<'invalid-repeat', PlayerRepeatValue>>,
  ExpectTrue<IsNotAssignable<'invalid-shuffle', PlayerShuffleValue>>,
  ExpectTrue<IsNotAssignable<'invalid-party', PlayerPartyModeValue>>,
  ExpectTrue<IsNotAssignable<'last', PlayerGoToTarget>>,
  ExpectTrue<IsNotAssignable<'unknownPlaylistProperty', PlaylistItemPropertyName>>,
  ExpectTrue<IsNotAssignable<number, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<string, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<{ movieid: number }, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<number, KodiMovieLibraryItem>>,
  ExpectTrue<IsNotAssignable<string, KodiMovieLibraryItem>>,
  ExpectTrue<IsNotAssignable<{ songid: number }, KodiMovieLibraryItem>>,
  ExpectTrue<IsNotAssignable<{ file: string }, KodiMovieLibraryItem>>,
  ExpectTrue<IsNotAssignable<number, KodiFileItem>>,
  ExpectTrue<IsNotAssignable<string, KodiFileItem>>,
  ExpectTrue<IsNotAssignable<number, KodiPlaylistFileItem>>,
  ExpectTrue<IsNotAssignable<string, KodiPlaylistFileItem>>,
  ExpectTrue<IsNotAssignable<{ songid: number }, KodiFileItem>>,
  ExpectTrue<IsNotAssignable<{ file: string }, KodiMusicLibraryItem>>,
  ExpectTrue<IsNotAssignable<{ episodeid: number }, PlayerOpenItem>>,
  ExpectTrue<IsNotAssignable<{ item: { file: string } }, PlayerOpenParams>>,
  ExpectTrue<IsNotAssignable<{ item: { movieid: number } }, PlayerOpenParams>>,
  ExpectTrue<IsNotAssignable<{ item: { songid: number } }, PlayerOpenMovieParams>>,
  ExpectTrue<IsNotAssignable<{ playlistid: 0; item: { file: string } }, PlaylistAddParams>>,
  ExpectTrue<IsNotAssignable<{ playlistid: 0; item: { movieid: number } }, PlaylistAddParams>>,
  ExpectTrue<IsNotAssignable<{ playlistid: 0; item: { songid: number } }, PlaylistAddMovieParams>>,
  ExpectTrue<IsNotAssignable<{ playlistid: 0; item: { songid: number } }, PlaylistInsertParams>>,
  ExpectTrue<IsNotAssignable<'sometimes', AddonEnabledFilter>>,
  ExpectTrue<IsNotAssignable<'partial', AddonInstalledFilter>>,
  ExpectTrue<IsNotAssignable<'unknownAddonProperty', AddonPropertyName>>,
  ExpectTrue<IsNotAssignable<'enabled', AddonSetEnabledValue>>,
  ExpectTrue<IsNotAssignable<string, AddonsGetAddonsParams>>,
  ExpectTrue<IsNotAssignable<string, AddonsGetAddonDetailsParams>>,
  ExpectTrue<IsNotAssignable<{ addonid: string }, AddonsSetAddonEnabledParams>>,
  ExpectTrue<IsNotAssignable<{ enabled: true }, AddonsSetAddonEnabledParams>>,
  ExpectTrue<IsNotAssignable<{ params: string[] }, AddonsExecuteAddonParams>>,
  ExpectTrue<IsNotAssignable<{ albumid: string }, AudioLibrarySetAlbumDetailsParams>>,
  ExpectTrue<IsNotAssignable<{ artistid: string }, AudioLibrarySetArtistDetailsParams>>,
  ExpectTrue<IsNotAssignable<string, AudioLibraryScanParams>>,
  ExpectTrue<IsNotAssignable<string, AudioLibraryCleanParams>>,
  ExpectTrue<IsNotAssignable<{ channelgroupid: 'all' }, PvrGetChannelsParams>>,
  ExpectTrue<IsNotAssignable<{ channelid: string }, PvrGetChannelDetailsParams>>,
  ExpectTrue<IsNotAssignable<{ channelid: string }, PvrGetBroadcastsParams>>,
  ExpectTrue<IsNotAssignable<{ recordingid: string }, PvrGetRecordingDetailsParams>>,
  ExpectTrue<IsNotAssignable<{ channel: 'alltv' }, PvrRecordParams>>,
  ExpectTrue<IsNotAssignable<{ broadcastid: string }, PvrTimerBroadcastParams>>,
  ExpectTrue<IsNotAssignable<{ timerid: string }, PvrDeleteTimerParams>>,
  ExpectTrue<IsNotAssignable<string, SettingsGetCategoriesParams>>,
  ExpectTrue<IsNotAssignable<string, SettingsGetSettingsParams>>,
  ExpectTrue<IsNotAssignable<{ setting: string; value: undefined }, SettingsSetSettingValueParams>>,
  ExpectTrue<IsNotAssignable<{ tvshowid: string }, VideoLibrarySetTvShowDetailsParams>>,
  ExpectTrue<IsNotAssignable<{ musicvideoid: string }, VideoLibrarySetMusicVideoDetailsParams>>,
  ExpectTrue<IsNotAssignable<{ movieid: string }, VideoLibraryRefreshMovieParams>>,
  ExpectTrue<IsNotAssignable<string, VideoLibraryScanParams>>,
  ExpectTrue<IsNotAssignable<string, VideoLibraryCleanParams>>,
  ExpectTrue<IsNotAssignable<symbol, SettingsSettingValue>>
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
  it('gets add-ons preserving requested params and raw result shape', async () => {
    const client = createFakeClient([
      {
        addons: [
          {
            addonid: 'plugin.video.youtube',
            name: 'YouTube',
            type: 'xbmc.python.pluginsource',
            enabled: true
          }
        ],
        limits: { start: 0, end: 1, total: 1 }
      }
    ]);
    const params = {
      type: 'xbmc.python.pluginsource',
      enabled: 'all',
      installed: true,
      properties: ['name', 'version', 'enabled'],
      limits: { start: 0, end: 25 },
      sort: { method: 'name', order: 'ascending' }
    } as const satisfies AddonsGetAddonsParams;

    await expect(getAddons(client, params)).resolves.toEqual({
      addons: [
        {
          addonid: 'plugin.video.youtube',
          name: 'YouTube',
          type: 'xbmc.python.pluginsource',
          enabled: true
        }
      ],
      limits: { start: 0, end: 1, total: 1 }
    });

    expect(client.calls).toEqual([{ method: 'Addons.GetAddons', params }]);
  });

  it('gets add-on details preserving the exact addon id and properties', async () => {
    const client = createFakeClient([
      {
        addondetails: {
          addonid: 'plugin.video.youtube',
          name: 'YouTube',
          version: '7.0.0',
          enabled: true
        }
      }
    ]);
    const params = {
      addonid: 'plugin.video.youtube',
      properties: ['name', 'version', 'enabled']
    } as const satisfies AddonsGetAddonDetailsParams;

    await expect(getAddonDetails(client, params)).resolves.toEqual({
      addondetails: {
        addonid: 'plugin.video.youtube',
        name: 'YouTube',
        version: '7.0.0',
        enabled: true
      }
    });

    expect(client.calls).toEqual([{ method: 'Addons.GetAddonDetails', params }]);
  });

  it('sets add-on enabled state preserving the exact value including toggle', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(
      setAddonEnabled(client, { addonid: 'plugin.video.youtube', enabled: false })
    ).resolves.toBe('OK');
    await expect(
      setAddonEnabled(client, { addonid: 'plugin.video.youtube', enabled: 'toggle' })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'Addons.SetAddonEnabled',
        params: { addonid: 'plugin.video.youtube', enabled: false }
      },
      {
        method: 'Addons.SetAddonEnabled',
        params: { addonid: 'plugin.video.youtube', enabled: 'toggle' }
      }
    ]);
  });

  it('executes add-ons preserving optional params and wait flag', async () => {
    const client = createFakeClient(['OK']);
    const params = {
      addonid: 'script.audio.alpha',
      params: { mode: 'play' },
      wait: false
    } as const satisfies AddonsExecuteAddonParams;

    await expect(executeAddon(client, params)).resolves.toBe('OK');

    expect(client.calls).toEqual([{ method: 'Addons.ExecuteAddon', params }]);
  });

  it('propagates add-on wrapper transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(getAddons(client)).rejects.toBe(error);
    await expect(getAddonDetails(client, { addonid: 'plugin.video.youtube' })).rejects.toBe(error);
    await expect(
      setAddonEnabled(client, { addonid: 'plugin.video.youtube', enabled: true })
    ).rejects.toBe(error);
    await expect(executeAddon(client, { addonid: 'script.audio.alpha' })).rejects.toBe(error);
  });

  it('sends bounded remote input commands as exact zero-param Input method calls', async () => {
    const commandToMethod = [
      ['left', 'Input.Left'],
      ['up', 'Input.Up'],
      ['right', 'Input.Right'],
      ['down', 'Input.Down'],
      ['back', 'Input.Back'],
      ['select', 'Input.Select'],
      ['contextMenu', 'Input.ContextMenu'],
      ['info', 'Input.Info'],
      ['home', 'Input.Home']
    ] as const satisfies readonly (readonly [RemoteInputCommand, string])[];
    const client = createFakeClient(commandToMethod.map(() => 'OK'));

    for (const [command] of commandToMethod) {
      await expect(sendInputCommand(client, command)).resolves.toBe('OK');
    }

    expect(client.calls).toEqual(commandToMethod.map(([, method]) => ({ method })));
  });

  it('sends text and supported input actions with bounded params', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(sendInputText(client, 'Search terms')).resolves.toBe('OK');
    await expect(executeInputAction(client, 'osd')).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Input.SendText', params: { text: 'Search terms' } },
      { method: 'Input.ExecuteAction', params: { action: 'osd' } }
    ]);
  });

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

  it('gets JSON-RPC introspection preserving exact params and call options', async () => {
    const params = {
      filter: { id: 'Player.Open', type: 'method' },
      getdescriptions: true,
      getmetadata: false
    } as const satisfies JsonRpcIntrospectionParams;
    const options = { timeoutMs: 125 };
    const result = {
      methods: {
        'Player.Open': {
          type: 'method',
          description: 'Open playback item'
        }
      }
    };
    const call = vi.fn().mockResolvedValue(result);
    const client: KodiJsonRpcHttpClient = { call };

    await expect(getJsonRpcIntrospection(client, params, options)).resolves.toBe(result);

    expect(call).toHaveBeenCalledWith('JSONRPC.Introspect', params, options);
  });

  it('gets JSON-RPC introspection without params and propagates transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const call = vi.fn().mockRejectedValue(error);
    const client: KodiJsonRpcHttpClient = { call };

    await expect(getJsonRpcIntrospection(client)).rejects.toBe(error);

    expect(call).toHaveBeenCalledWith('JSONRPC.Introspect', undefined, undefined);
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

  it('opens movie player items with exact movie id and optional resume params', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(openPlayerMovieItem(client, { movieid: 4401 })).resolves.toBe('OK');
    await expect(openPlayerMovieItem(client, { movieid: 4401 }, { resume: true })).resolves.toBe(
      'OK'
    );

    expect(client.calls).toEqual([
      { method: 'Player.Open', params: { item: { movieid: 4401 } } },
      { method: 'Player.Open', params: { item: { movieid: 4401 }, options: { resume: true } } }
    ]);
  });

  it('adds movie playlist items preserving video playlist id and movie id', async () => {
    const client = createFakeClient(['OK']);

    await expect(addMoviePlaylistItem(client, { movieid: 4401 })).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { movieid: 4401 } } }
    ]);
  });

  it('inserts playlist items preserving playlist id, position, and item identity', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(
      insertPlaylistItem(client, { playlistid: 0, position: 1, item: { songid: 42 } })
    ).resolves.toBe('OK');
    await expect(
      insertPlaylistItem(client, { playlistid: 1, position: 0, item: { file: 'movie.mkv' } })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Playlist.Insert', params: { playlistid: 0, position: 1, item: { songid: 42 } } },
      {
        method: 'Playlist.Insert',
        params: { playlistid: 1, position: 0, item: { file: 'movie.mkv' } }
      }
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

  it('sets player party mode preserving the requested value', async () => {
    const client = createFakeClient(['OK']);

    await expect(setPlayerPartyMode(client, 1, 'toggle')).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'Player.SetPartymode', params: { playerid: 1, partymode: 'toggle' } }
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

  it('gets file details preserving requested file params', async () => {
    const client = createFakeClient([
      {
        filedetails: {
          file: 'smb://nas/music/song.flac',
          filetype: 'file',
          label: 'Song',
          title: 'Song'
        }
      }
    ]);
    const params = {
      file: 'smb://nas/music/song.flac',
      media: 'music',
      properties: ['file', 'title', 'artist']
    } as const satisfies FileDetailsParams;

    await expect(getFileDetails(client, params)).resolves.toEqual({
      filedetails: {
        file: 'smb://nas/music/song.flac',
        filetype: 'file',
        label: 'Song',
        title: 'Song'
      }
    } satisfies FileDetailsResult);

    expect(client.calls).toEqual([{ method: 'Files.GetFileDetails', params }]);
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

  it('opens a playlist file item preserving the exact smart playlist file payload', async () => {
    const client = createFakeClient(['OK']);
    const item = {
      file: 'special://profile/playlists/music/recent.xsp'
    } as const satisfies KodiPlaylistFileItem;

    await expect(openPlayerPlaylistFile(client, item)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'Player.Open',
        params: { item: { file: 'special://profile/playlists/music/recent.xsp' } }
      }
    ]);
  });

  it('adds a playlist file item preserving playlist id and exact smart playlist file payload', async () => {
    const client = createFakeClient(['OK']);
    const item = {
      file: 'special://profile/playlists/music/recent.xsp'
    } as const satisfies KodiPlaylistFileItem;

    await expect(addPlaylistFileItem(client, 0, item)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'Playlist.Add',
        params: { playlistid: 0, item: { file: 'special://profile/playlists/music/recent.xsp' } }
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

  it('sets audio library album and artist details with curated writable fields', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(
      setAlbumDetails(client, {
        albumid: 7,
        title: 'Bayani',
        artist: ['Blue Scholars'],
        art: { thumb: 'image://album.jpg/' }
      })
    ).resolves.toBe('OK');
    await expect(
      setArtistDetails(client, {
        artistid: 9,
        artist: 'Blue Scholars',
        genre: ['Hip-Hop'],
        art: { fanart: 'image://artist.jpg/' }
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'AudioLibrary.SetAlbumDetails',
        params: {
          albumid: 7,
          title: 'Bayani',
          artist: ['Blue Scholars'],
          art: { thumb: 'image://album.jpg/' }
        }
      },
      {
        method: 'AudioLibrary.SetArtistDetails',
        params: {
          artistid: 9,
          artist: 'Blue Scholars',
          genre: ['Hip-Hop'],
          art: { fanart: 'image://artist.jpg/' }
        }
      }
    ]);
  });

  it('scans and cleans the audio library with Chorus2-compatible clean defaults', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(scanAudioLibrary(client)).resolves.toBe('OK');
    await expect(cleanAudioLibrary(client)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'AudioLibrary.Scan', params: {} },
      { method: 'AudioLibrary.Clean', params: { showdialogs: false } }
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

  it('sets video library TV show details with curated writable fields', async () => {
    const client = createFakeClient(['OK']);

    await expect(
      setTvShowDetails(client, {
        tvshowid: 5501,
        playcount: 1,
        lastplayed: '2026-04-29 20:30:00',
        art: { poster: 'image://poster.jpg/' }
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.SetTVShowDetails',
        params: {
          tvshowid: 5501,
          playcount: 1,
          lastplayed: '2026-04-29 20:30:00',
          art: { poster: 'image://poster.jpg/' }
        }
      }
    ]);
  });

  it('sets video library music video details with curated writable fields', async () => {
    const client = createFakeClient(['OK']);

    await expect(
      setMusicVideoDetails(client, {
        musicvideoid: 77,
        playcount: 1,
        title: 'Live cut',
        artist: ['The Band'],
        resume: { position: 55, total: 300 }
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.SetMusicVideoDetails',
        params: {
          musicvideoid: 77,
          playcount: 1,
          title: 'Live cut',
          artist: ['The Band'],
          resume: { position: 55, total: 300 }
        }
      }
    ]);
  });

  it('preserves rejected library write transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(setSongDetails(client, { songid: 42, playcount: 1 })).rejects.toBe(error);
    await expect(setAlbumDetails(client, { albumid: 7, title: 'Bayani' })).rejects.toBe(error);
    await expect(setTvShowDetails(client, { tvshowid: 5501, playcount: 1 })).rejects.toBe(error);
    await expect(setMusicVideoDetails(client, { musicvideoid: 77, playcount: 1 })).rejects.toBe(
      error
    );
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

  it('gets video library movie details preserving exact id and requested properties', async () => {
    const client = createFakeClient([
      {
        moviedetails: {
          movieid: 4401,
          label: 'Neon Harbor',
          title: 'Neon Harbor',
          resume: { position: 120, total: 600 }
        }
      }
    ]);
    const params = { movieid: 4401, properties: ['title', 'resume', 'playcount'] } as const;

    await expect(getVideoLibraryMovieDetails(client, params)).resolves.toEqual({
      moviedetails: {
        movieid: 4401,
        label: 'Neon Harbor',
        title: 'Neon Harbor',
        resume: { position: 120, total: 600 }
      }
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetMovieDetails', params }]);
  });

  it('gets video library music videos preserving requested params', async () => {
    const client = createFakeClient([
      {
        musicvideos: [{ musicvideoid: 77, label: 'Live cut' }],
        limits: { start: 0, end: 1, total: 1 }
      }
    ]);
    const params = {
      properties: ['title', 'artist', 'album', 'thumbnail'],
      limits: { start: 0, end: 25 },
      sort: { method: 'title', order: 'ascending' }
    } as const;

    await expect(getVideoLibraryMusicVideos(client, params)).resolves.toEqual({
      musicvideos: [{ musicvideoid: 77, label: 'Live cut' }],
      limits: { start: 0, end: 1, total: 1 }
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetMusicVideos', params }]);
  });

  it('gets video library music video details preserving exact id and requested properties', async () => {
    const client = createFakeClient([
      {
        musicvideodetails: {
          musicvideoid: 77,
          label: 'Live cut',
          title: 'Live cut',
          artist: ['The Band']
        }
      }
    ]);
    const params = { musicvideoid: 77, properties: ['title', 'artist', 'plot'] } as const;

    await expect(getVideoLibraryMusicVideoDetails(client, params)).resolves.toEqual({
      musicvideodetails: {
        musicvideoid: 77,
        label: 'Live cut',
        title: 'Live cut',
        artist: ['The Band']
      }
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetMusicVideoDetails', params }]);
  });

  it('gets video library TV shows with curated default properties that exclude file', async () => {
    const client = createFakeClient([{ tvshows: [{ tvshowid: 5501, label: 'Severance' }] }]);

    await expect(getVideoLibraryTvShows(client)).resolves.toEqual({
      tvshows: [{ tvshowid: 5501, label: 'Severance' }]
    });

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.GetTVShows',
        params: {
          properties: [
            'title',
            'sorttitle',
            'thumbnail',
            'fanart',
            'art',
            'year',
            'plot',
            'episode',
            'watchedepisodes',
            'playcount',
            'lastplayed',
            'genre',
            'studio',
            'rating',
            'userrating'
          ]
        }
      }
    ]);
    expect((client.calls[0]?.params as { properties: string[] }).properties).not.toContain('file');
  });

  it('gets video library TV shows preserving explicit requested params', async () => {
    const client = createFakeClient([{ tvshows: [{ tvshowid: 4, label: 'Severance' }] }]);
    const params = { properties: ['episode', 'watchedepisodes'] } as const;

    await expect(getVideoLibraryTvShows(client, params)).resolves.toEqual({
      tvshows: [{ tvshowid: 4, label: 'Severance' }]
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetTVShows', params }]);
  });

  it('gets video library TV show details with exact id and curated default properties', async () => {
    const client = createFakeClient([
      { tvshowdetails: { tvshowid: 5501, label: 'Severance', title: 'Severance' } }
    ]);

    await expect(getVideoLibraryTvShowDetails(client, { tvshowid: 5501 })).resolves.toEqual({
      tvshowdetails: { tvshowid: 5501, label: 'Severance', title: 'Severance' }
    });

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.GetTVShowDetails',
        params: {
          tvshowid: 5501,
          properties: [
            'title',
            'sorttitle',
            'thumbnail',
            'fanart',
            'art',
            'year',
            'plot',
            'episode',
            'watchedepisodes',
            'playcount',
            'lastplayed',
            'genre',
            'studio',
            'rating',
            'userrating'
          ]
        }
      }
    ]);
    expect((client.calls[0]?.params as { properties: string[] }).properties).not.toContain('file');
  });

  it('gets video library seasons preserving show id and requested params', async () => {
    const client = createFakeClient([{ seasons: [{ season: 1, label: 'Season 1' }] }]);
    const params = {
      tvshowid: 5501,
      properties: ['season', 'episode', 'watchedepisodes']
    } as const;

    await expect(getVideoLibrarySeasons(client, params)).resolves.toEqual({
      seasons: [{ season: 1, label: 'Season 1' }]
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetSeasons', params }]);
  });

  it('gets video library season details preserving exact show and season ids', async () => {
    const client = createFakeClient([{ seasondetails: { season: 1, label: 'Season 1' } }]);
    const params = {
      tvshowid: 5501,
      season: 1,
      properties: ['season', 'thumbnail', 'art']
    } as const;

    await expect(getVideoLibrarySeasonDetails(client, params)).resolves.toEqual({
      seasondetails: { season: 1, label: 'Season 1' }
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetSeasonDetails', params }]);
  });

  it('gets video library episodes preserving requested params', async () => {
    const client = createFakeClient([{ episodes: [{ episodeid: 8, label: 'Hello, Ms. Cobel' }] }]);
    const params = { tvshowid: 4, season: 1, properties: ['runtime'] } as const;

    await expect(getVideoLibraryEpisodes(client, params)).resolves.toEqual({
      episodes: [{ episodeid: 8, label: 'Hello, Ms. Cobel' }]
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetEpisodes', params }]);
  });

  it('gets video library episode details preserving exact episode id and requested properties', async () => {
    const client = createFakeClient([
      { episodedetails: { episodeid: 6601, label: 'Hello, Ms. Cobel', season: 1, episode: 1 } }
    ]);
    const params = {
      episodeid: 6601,
      properties: ['title', 'season', 'episode', 'resume']
    } as const;

    await expect(getVideoLibraryEpisodeDetails(client, params)).resolves.toEqual({
      episodedetails: { episodeid: 6601, label: 'Hello, Ms. Cobel', season: 1, episode: 1 }
    });

    expect(client.calls).toEqual([{ method: 'VideoLibrary.GetEpisodeDetails', params }]);
  });

  it('gets available art and art types with raw Kodi result objects', async () => {
    const client = createFakeClient([
      { availableart: { poster: [{ url: 'image://poster.jpg/' }] } },
      { availablearttypes: ['poster', 'fanart'] }
    ]);

    await expect(
      getVideoLibraryAvailableArt(client, { media: 'season', tvshowid: 5501, season: 1 })
    ).resolves.toEqual({ availableart: { poster: [{ url: 'image://poster.jpg/' }] } });
    await expect(getVideoLibraryAvailableArtTypes(client, { media: 'season' })).resolves.toEqual({
      availablearttypes: ['poster', 'fanart']
    });

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.GetAvailableArt',
        params: { media: 'season', tvshowid: 5501, season: 1 }
      },
      { method: 'VideoLibrary.GetAvailableArtTypes', params: { media: 'season' } }
    ]);
  });

  it('refreshes movies, TV shows, and episodes with exact Kodi method names', async () => {
    const client = createFakeClient(['OK', 'OK', 'OK']);

    await expect(refreshVideoLibraryMovie(client, { movieid: 4401 })).resolves.toBe('OK');
    await expect(refreshVideoLibraryTvShow(client, { tvshowid: 5501 })).resolves.toBe('OK');
    await expect(refreshVideoLibraryEpisode(client, { episodeid: 6601 })).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'VideoLibrary.RefreshMovie', params: { movieid: 4401 } },
      { method: 'VideoLibrary.RefreshTVShow', params: { tvshowid: 5501 } },
      { method: 'VideoLibrary.RefreshEpisode', params: { episodeid: 6601 } }
    ]);
  });

  it('scans and cleans the video library with Chorus2-compatible clean defaults', async () => {
    const client = createFakeClient(['OK', 'OK']);

    await expect(scanVideoLibrary(client, { directory: '/media/movies' })).resolves.toBe('OK');
    await expect(cleanVideoLibrary(client)).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'VideoLibrary.Scan', params: { directory: '/media/movies' } },
      { method: 'VideoLibrary.Clean', params: { showdialogs: false } }
    ]);
  });

  it('sets video library season details with curated artwork write fields', async () => {
    const client = createFakeClient(['OK']);

    await expect(
      setSeasonDetails(client, {
        tvshowid: 5501,
        season: 1,
        art: { poster: 'image://poster.jpg/' }
      })
    ).resolves.toBe('OK');

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.SetSeasonDetails',
        params: { tvshowid: 5501, season: 1, art: { poster: 'image://poster.jpg/' } }
      }
    ]);
  });

  it('propagates TV wrapper transport errors unchanged without leaking raw payloads', async () => {
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
      method: 'VideoLibrary.GetTVShows'
    });
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(getVideoLibraryTvShows(client)).rejects.toBe(error);
    expect(JSON.stringify(error)).not.toMatch(/Authorization|Basic|SENTINEL_SECRET|raw/i);
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

  it('gets settings sections preserving requested params', async () => {
    const client = createFakeClient([{ sections: [{ id: 'system', label: 'System' }] }]);
    const params = { level: 'expert' } as const;

    await expect(getSettingsSections(client, params)).resolves.toEqual({
      sections: [{ id: 'system', label: 'System' }]
    });

    expect(client.calls).toEqual([{ method: 'Settings.GetSections', params }]);
  });

  it('gets settings categories preserving section and level params', async () => {
    const client = createFakeClient([{ categories: [{ id: 'audio', label: 'Audio' }] }]);
    const params = { section: 'system', level: 'standard' } as const;

    await expect(getSettingsCategories(client, params)).resolves.toEqual({
      categories: [{ id: 'audio', label: 'Audio' }]
    });

    expect(client.calls).toEqual([{ method: 'Settings.GetCategories', params }]);
  });

  it('gets settings preserving category and level params', async () => {
    const client = createFakeClient([{ settings: [{ id: 'audio.volume', label: 'Volume' }] }]);
    const params = { category: 'audio', level: 'expert' } as const;

    await expect(getSettings(client, params)).resolves.toEqual({
      settings: [{ id: 'audio.volume', label: 'Volume' }]
    });

    expect(client.calls).toEqual([
      { method: 'Settings.GetSettings', params: { level: 'expert', filter: { category: 'audio' } } }
    ]);
  });

  it('gets PVR channels, channel details, and broadcasts with Chorus2-compatible params', async () => {
    const client = createFakeClient([
      { channels: [{ channelid: 12, label: 'KEXP' }], limits: { start: 0, end: 1, total: 1 } },
      { channeldetails: { channelid: 12, label: 'KEXP', channeltype: 'radio' } },
      { broadcasts: [{ broadcastid: 45, label: 'Morning Show' }] }
    ]);

    await expect(
      getPvrChannels(client, {
        channelgroupid: 'allradio',
        properties: ['thumbnail', 'channeltype', 'broadcastnow'],
        limits: { start: 0, end: 25 }
      })
    ).resolves.toEqual({
      channels: [{ channelid: 12, label: 'KEXP' }],
      limits: { start: 0, end: 1, total: 1 }
    });
    await expect(
      getPvrChannelDetails(client, { channelid: 12, properties: ['thumbnail', 'channeltype'] })
    ).resolves.toEqual({
      channeldetails: { channelid: 12, label: 'KEXP', channeltype: 'radio' }
    });
    await expect(
      getPvrBroadcasts(client, {
        channelid: 12,
        properties: ['title', 'runtime', 'starttime'],
        limits: { start: 0, end: 10 }
      })
    ).resolves.toEqual({ broadcasts: [{ broadcastid: 45, label: 'Morning Show' }] });

    expect(client.calls).toEqual([
      {
        method: 'PVR.GetChannels',
        params: {
          channelgroupid: 'allradio',
          properties: ['thumbnail', 'channeltype', 'broadcastnow'],
          limits: { start: 0, end: 25 }
        }
      },
      {
        method: 'PVR.GetChannelDetails',
        params: { channelid: 12, properties: ['thumbnail', 'channeltype'] }
      },
      {
        method: 'PVR.GetBroadcasts',
        params: {
          channelid: 12,
          properties: ['title', 'runtime', 'starttime'],
          limits: { start: 0, end: 10 }
        }
      }
    ]);
  });

  it('gets PVR recordings and recording details preserving requested params', async () => {
    const client = createFakeClient([
      { recordings: [{ recordingid: 91, label: 'Match replay' }] },
      { recordingdetails: { recordingid: 91, title: 'Match replay', channel: 'Sports' } }
    ]);

    await expect(
      getPvrRecordings(client, {
        properties: ['channel', 'file', 'title', 'resume'],
        limits: { start: 0, end: 25 }
      })
    ).resolves.toEqual({ recordings: [{ recordingid: 91, label: 'Match replay' }] });
    await expect(
      getPvrRecordingDetails(client, {
        recordingid: 91,
        properties: ['channel', 'file', 'title']
      })
    ).resolves.toEqual({
      recordingdetails: { recordingid: 91, title: 'Match replay', channel: 'Sports' }
    });

    expect(client.calls).toEqual([
      {
        method: 'PVR.GetRecordings',
        params: {
          properties: ['channel', 'file', 'title', 'resume'],
          limits: { start: 0, end: 25 }
        }
      },
      {
        method: 'PVR.GetRecordingDetails',
        params: { recordingid: 91, properties: ['channel', 'file', 'title'] }
      }
    ]);
  });

  it('runs PVR record and timer commands with Chorus2-compatible params', async () => {
    const client = createFakeClient(['OK', 'OK', 'OK', 'OK']);

    await expect(recordPvrChannel(client, { channel: 12, record: 'toggle' })).resolves.toBe('OK');
    await expect(togglePvrTimer(client, { broadcastid: 45, timerrule: false })).resolves.toBe('OK');
    await expect(addPvrTimer(client, { broadcastid: 45, timerrule: true })).resolves.toBe('OK');
    await expect(deletePvrTimer(client, { timerid: 77 })).resolves.toBe('OK');

    expect(client.calls).toEqual([
      { method: 'PVR.Record', params: { channel: 12, record: 'toggle' } },
      { method: 'PVR.ToggleTimer', params: { broadcastid: 45, timerrule: false } },
      { method: 'PVR.AddTimer', params: { broadcastid: 45, timerrule: true } },
      { method: 'PVR.DeleteTimer', params: { timerid: 77 } }
    ]);
  });

  it('sets a settings value preserving setting id and scalar value', async () => {
    const client = createFakeClient(['OK']);
    const params = { setting: 'audio.mute', value: true } as const;

    await expect(setSettingValue(client, params)).resolves.toBe('OK');

    expect(client.calls).toEqual([{ method: 'Settings.SetSettingValue', params }]);
  });

  it('propagates Settings wrapper transport errors unchanged', async () => {
    const error = new Error('transport unavailable');
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(error)
    };

    await expect(getSettingsSections(client)).rejects.toBe(error);
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
