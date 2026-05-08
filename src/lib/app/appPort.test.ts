import { describe, expect, it, vi } from 'vitest';

import {
  AddonControllerPort,
  AppConfigPort,
  ApplicationPort,
  CastPort,
  FormPort,
  GuiPort,
  InputPort,
  JsonRpcAliasPort,
  KodiCommandPort,
  LocalPlayerPort,
  LocalPlaylistPort,
  MediaEntityPort,
  MetadataLookupPort,
  MainNavigationPort,
  MediaPlaylistPort,
  NavigationAliasPort,
  PlayerEventPort,
  RuntimePort,
  SearchAddonsPort,
  SearchPort,
  SelectionPort,
  SystemPort,
  UiPort,
  imageEntity,
  imagePath,
  loadingView,
  whenEntityFetched
} from './appPort';

class MemoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class FakeClient {
  readonly calls: Array<{ method: string; params?: unknown }> = [];
  async call(method: string, params?: unknown): Promise<unknown> {
    this.calls.push(params === undefined ? { method } : { method, params });
    return { ok: true, method, params };
  }
}

describe('application port facades', () => {
  it('stores app/static config request handlers', () => {
    const compat = new AppConfigPort(new MemoryStorage());

    expect(compat.getApp('browserSort', { method: 'none' })).toEqual({ method: 'none' });
    expect(compat.setApp('browserSort', { method: 'label' })).toEqual({ method: 'label' });
    expect(compat.getApp('browserSort', { method: 'none' })).toEqual({ method: 'label' });

    expect(compat.getStatic('modalOpen', false)).toBe(false);
    expect(compat.setStatic('modalOpen', true)).toBe(true);
    expect(compat.getStatic('modalOpen', false)).toBe(true);
  });

  it('tracks selected items and derives media', () => {
    const selected = new SelectionPort();
    selected.updateItems('add', { id: 7, uid: 'song:7', type: 'song', label: 'Track' });

    expect(selected.getItems()).toEqual([{ id: 7, uid: 'song:7', type: 'song', label: 'Track' }]);
    expect(selected.getMedia()).toBe('audio');
    expect(selected.getType()).toBe('song');

    selected.updateItems('remove', { id: 7, uid: 'song:7', type: 'song' });
    expect(selected.getItems()).toEqual([]);
  });

  it('models modal, options, youtube, text input, and player menu helpers', () => {
    const ui = new UiPort();

    expect(ui.showModal('Title', 'Body', '', true, 'info')).toMatchObject({
      open: true,
      kind: 'modal',
      titleHtml: 'Title',
      bodyHtml: 'Body',
      style: 'info'
    });
    expect(ui.options('Pick', ['One'])).toMatchObject({ kind: 'options', options: ['One'] });
    expect(ui.youtube('Trailer', 'abc-123<script>')).toMatchObject({
      kind: 'youtube',
      bodyHtml: expect.stringContaining('abc-123script')
    });
    expect(ui.textInput('Input required', { msg: 'Name', defaultVal: 'Kodi' })).toMatchObject({
      kind: 'textinput',
      defaultValue: 'Kodi'
    });
    expect(ui.playerMenu('open')).toBe(true);
    expect(ui.playerMenu('toggle')).toBe(false);
    expect(ui.close()).toMatchObject({ open: false, kind: null });
  });

  it('applies and submits form item formats recursively', () => {
    const form = new FormPort();
    const items = form.itemEntities(
      [
        { id: 'genre', format: 'array.string' },
        { id: 'rating', format: 'integer', children: [{ id: 'score', format: 'float' }] }
      ],
      { genre: ['Hip Hop', 'Rap'], rating: '5', score: '3.5' }
    );

    expect(items[0]).toMatchObject({ defaultValue: 'Hip Hop; Rap', defaultsApplied: true });
    expect(items[1]).toMatchObject({ defaultValue: 5, defaultsApplied: true });
    expect(items[1].children?.[0]).toMatchObject({ defaultValue: '3.5', defaultsApplied: true });

    expect(
      form.valueEntities(
        [
          { id: 'genre', format: 'array.string' },
          { id: 'years', format: 'array.integer' },
          { id: 'rating', format: 'float' },
          { id: 'skip', format: 'prevent.submit' }
        ],
        { genre: 'Hip Hop; Rap', years: '2020; 2024', rating: '8.5', skip: 'x' }
      )
    ).toEqual({ genre: ['Hip Hop', 'Rap'], years: [2020, 2024], rating: 8.5 });
  });

  it('provides nav main array/default entities and helper views', async () => {
    const nav = new MainNavigationPort();
    expect(nav.entities('all').some((row) => row.path === 'music')).toBe(true);
    expect(nav.arrayEntities([{ path: 'custom', title: 'Custom' }])).toEqual([
      {
        id: 'custom',
        title: 'Custom',
        path: 'custom',
        icon: '',
        classes: '',
        parent: 0,
        weight: 0
      }
    ]);

    expect(imagePath('image://foo.jpg/')).toBe('/image/image%3A%2F%2Ffoo.jpg%2F');
    expect(imageEntity({ thumbnail: 'image://foo.jpg/' })).toEqual({
      thumbnail: '/image/image%3A%2F%2Ffoo.jpg%2F'
    });
    expect(loadingView('Loading folder...')).toEqual({
      message: 'Loading folder...',
      status: 'loading'
    });

    const callback = vi.fn();
    await expect(whenEntityFetched(Promise.resolve('ready'), callback)).resolves.toBe('ready');
    expect(callback).toHaveBeenCalledWith('ready');
  });

  it('maps command controllers to JSON-RPC calls', async () => {
    const client = new FakeClient();
    const commands = new KodiCommandPort(client as never);

    await commands.kodiPlayer('PlayPause', { playerid: 1 });
    await commands.kodiController('auto', 'Input').sendInput('Left');
    await commands.kodiController('auto', 'Input').sendText('hello');
    await commands.audioAdd('songid', 55);
    await commands.videoPlay('movieid', 77, true);

    expect(client.calls).toEqual([
      { method: 'Player.PlayPause', params: { playerid: 1 } },
      { method: 'Input.Left' },
      { method: 'Input.SendText', params: { text: 'hello' } },
      { method: 'Playlist.Add', params: { playlistid: 0, item: { songid: 55 } } },
      { method: 'Player.Open', params: { item: { movieid: 77 }, options: { resume: true } } }
    ]);
  });

  it('ports input textbox, remote toggle, action, and resume handlers', async () => {
    const client = new FakeClient();
    const input = new InputPort();
    const controller = new KodiCommandPort(client as never).kodiController('auto', 'Input');
    const dispatch = { playPause: vi.fn().mockResolvedValue('resumed') };

    expect(input.textbox('search')).toEqual({
      remoteOpen: false,
      textboxOpen: true,
      textboxValue: 'search'
    });
    expect(input.remoteToggle()).toMatchObject({ remoteOpen: true });
    expect(input.textboxClose()).toMatchObject({ textboxOpen: false, textboxValue: '' });

    await input.send(controller, 'home');
    await input.action(controller, 'osd');
    await input.raw(controller, 'Stop');
    await input.resume(dispatch as never);

    expect(client.calls).toEqual([
      { method: 'Input.Home' },
      { method: 'Input.ExecuteAction', params: { action: 'osd' } },
      { method: 'Input.Stop' }
    ]);
    expect(input.externalLookup('imdb', 'Big Buck Bunny')).toBe(
      'https://www.imdb.com/find/?q=Big%20Buck%20Bunny'
    );
    expect(input.handleKodiInputRequested()).toMatchObject({ textboxOpen: true });
    expect(input.handleKodiInputFinished()).toMatchObject({ textboxOpen: false });
    expect(dispatch.playPause).toHaveBeenCalledTimes(1);
  });

  it('ports media entity detail/write helpers and watched toggles', async () => {
    const client = new FakeClient();
    const media = new MediaEntityPort(client as never);

    await media.movies({ properties: ['title'] });
    await media.movieDetails({ movieid: 7, properties: ['title'] });
    await media.setAlbum({ albumid: 2, title: 'Bayani' });
    await media.setWatched('movie', 7, true);

    expect(client.calls).toEqual([
      { method: 'VideoLibrary.GetMovies', params: { properties: ['title'] } },
      { method: 'VideoLibrary.GetMovieDetails', params: { movieid: 7, properties: ['title'] } },
      { method: 'AudioLibrary.SetAlbumDetails', params: { albumid: 2, title: 'Bayani' } },
      { method: 'VideoLibrary.SetMovieDetails', params: { movieid: 7, playcount: 1 } }
    ]);
  });

  it('ports local and Kodi playlist wrapper behavior', async () => {
    const localSnapshot = {
      playlists: [
        {
          id: 'playlist-a',
          label: 'A',
          createdAt: 'now',
          updatedAt: 'now',
          items: [{ id: 'item-a', kind: 'audio', label: 'Track', position: 0, addedAt: 'now' }]
        }
      ],
      selectedPlaylistId: 'playlist-a',
      selectedPlaylist: null,
      playlistCount: 1,
      selectedItemCount: 1,
      mutationStatus: 'idle',
      lastMutation: null,
      validationErrors: {},
      storageWarning: null,
      lastError: null,
      lastUpdatedAt: null
    } as const;
    const localDispatch = {
      createPlaylist: vi.fn().mockReturnValue({ ok: true, playlist: localSnapshot.playlists[0] }),
      renamePlaylist: vi.fn().mockReturnValue({ ok: true, playlist: localSnapshot.playlists[0] }),
      removePlaylist: vi.fn().mockReturnValue({ ok: true }),
      selectPlaylist: vi.fn().mockReturnValue({ ok: true, playlist: localSnapshot.playlists[0] }),
      clearPlaylist: vi.fn().mockReturnValue({ ok: true }),
      addItems: vi.fn().mockReturnValue({ ok: true, items: [] }),
      removeItem: vi.fn().mockReturnValue({ ok: true }),
      moveItem: vi.fn().mockReturnValue({ ok: true }),
      reorderItems: vi.fn().mockReturnValue({ ok: true }),
      getPlayableItems: vi
        .fn()
        .mockReturnValue([
          { id: 'item-a', kind: 'audio', label: 'Track', file: 'x.mp3', position: 0 }
        ]),
      reset: vi.fn()
    };
    const local = new LocalPlaylistPort(localDispatch as never);

    expect(local.entities(localSnapshot as never)[0].label).toBe('A');
    local.newList('New');
    local.rename('playlist-a', 'Renamed');
    local.updateOrder('playlist-a', ['item-a']);
    expect(local.itemEntities('playlist-a')).toEqual([
      { id: 'item-a', kind: 'audio', label: 'Track', file: 'x.mp3', position: 0 }
    ]);

    const store = {
      snapshot: {
        playlists: [
          {
            id: 'playlist:1',
            label: 'Smart',
            capabilities: { canBrowse: true, canPlay: true, canQueue: true }
          }
        ],
        entries: [
          { id: 'entry:1', label: 'Song', capabilities: { canPlay: true, canQueue: true } }
        ],
        breadcrumbs: [{ id: 'playlist:1', label: 'Smart' }]
      },
      refreshPlaylists: vi.fn().mockResolvedValue(undefined),
      openPlaylist: vi.fn().mockResolvedValue(undefined),
      getPlayablePlaylist: vi
        .fn()
        .mockReturnValue({ ok: true, playlist: { id: 'playlist:1', file: 'special://x.xsp' } }),
      clear: vi.fn()
    };
    const kodi = new MediaPlaylistPort(store as never);

    await kodi.refresh();
    await expect(kodi.entityApi('playlist:1')).resolves.toMatchObject({
      entries: [{ id: 'entry:1', label: 'Song' }],
      breadcrumbs: [{ id: 'playlist:1' }]
    });
    expect(kodi.entities()).toEqual([
      {
        id: 'playlist:1',
        label: 'Smart',
        capabilities: { canBrowse: true, canPlay: true, canQueue: true }
      }
    ]);
  });

  it('ports runtime shell, loading, notification, search, cast, and navigation surfaces', () => {
    const runtime = new RuntimePort();
    expect(runtime.setBodyState('player-open')).toMatchObject({ bodyState: 'player-open' });
    expect(runtime.showLoading('page', 'Loading app')).toMatchObject({
      loading: { kind: 'page', message: 'Loading app' }
    });
    expect(runtime.showNotification('Ready')).toMatchObject({ notifications: ['Ready'] });
    expect(runtime.disconnect()).toMatchObject({ shellConnected: false, shellReady: false });
    expect(runtime.reconnect()).toMatchObject({ shellConnected: true });
    expect(runtime.viewReady()).toMatchObject({ shellReady: true });
    expect(runtime.setSocketsActive(true)).toMatchObject({ socketsActive: true });

    expect(new SearchPort().go('Bayani')).toBe('#search?q=Bayani');
    const addOnSearch = new SearchAddonsPort();
    expect(addOnSearch.updateEntities([{ id: 'youtube' }])).toEqual([{ id: 'youtube' }]);
    expect(addOnSearch.updateDefaults()).toEqual([]);
    expect(new CastPort().listView([{ name: 'Actor' }])).toEqual({
      view: 'list',
      items: [{ name: 'Actor' }]
    });
    expect(new NavigationAliasPort().route('/music/albums')).toBe('#music/albums');
    expect(new NavigationAliasPort().row('/')).toMatchObject({ id: 'home', path: '' });
  });

  it('ports generic JSON-RPC, add-on, GUI, application, system, and player event surfaces', async () => {
    const client = new FakeClient();
    const jsonrpc = new JsonRpcAliasPort(client as never);
    await jsonrpc.ping();
    await jsonrpc.introspect({ getdescriptions: true });
    await jsonrpc.activePlayers();
    await jsonrpc.properties({ playerid: 1, properties: ['speed'] });
    await jsonrpc.item({ playerid: 1, properties: ['title'] });

    await new AddonControllerPort(client as never).execute({ addonid: 'plugin.video.test' });
    await new GuiPort(client as never).window({ window: 'home' });
    await new ApplicationPort(client as never).quit();
    await new SystemPort(client as never).shutdown();

    const playerEvents = new PlayerEventPort();
    playerEvents.startKodiTimer();
    expect(playerEvents.timerActive).toBe(true);
    expect(playerEvents.handleNotification('Player.OnPlay')).toBe('Player.OnPlay');
    playerEvents.stopKodiTimer();
    expect(playerEvents.timerActive).toBe(false);

    expect(client.calls).toEqual([
      { method: 'JSONRPC.Ping' },
      { method: 'JSONRPC.Introspect', params: { getdescriptions: true } },
      { method: 'Player.GetActivePlayers' },
      { method: 'Player.GetProperties', params: { playerid: 1, properties: ['speed'] } },
      { method: 'Player.GetItem', params: { playerid: 1, properties: ['title'] } },
      { method: 'Addons.ExecuteAddon', params: { addonid: 'plugin.video.test' } },
      { method: 'GUI.Window', params: { window: 'home' } },
      { method: 'Application.Quit' },
      { method: 'System.Shutdown' }
    ]);
  });

  it('ports deferred library, local-player, system notification, and metadata surfaces', async () => {
    const client = new FakeClient();
    const media = new MediaEntityPort(client as never);
    await media.albumDetails({ albumid: 1, properties: ['title'] });
    await media.artistDetails({ artistid: 2, properties: ['artist'] });
    await media.songDetails({ songid: 3, properties: ['title'] });
    await media.seasonDetails({ tvshowid: 4, season: 1, properties: ['season'] });
    await media.refreshMovie({ movieid: 5 });
    await media.scanAudio();
    await media.scanVideo();

    const localDispatch = {
      reset: vi.fn(),
      addItems: vi.fn().mockReturnValue({ ok: true, items: [] })
    };
    const local = new LocalPlayerPort();
    local.clearEntities(localDispatch as never);
    local.addItemEntities(localDispatch as never, 'playlist-a', [
      { kind: 'audio', label: 'Track', file: 'x.mp3' }
    ]);
    expect(localDispatch.reset).toHaveBeenCalledTimes(1);
    expect(localDispatch.addItems).toHaveBeenCalledWith('playlist-a', [
      { kind: 'audio', label: 'Track', file: 'x.mp3' }
    ]);

    const notified = vi.fn();
    expect(new SystemPort(client as never).handleNotification('System.OnWake', notified)).toBe(
      'Kodi has woken'
    );
    expect(
      new ApplicationPort(client as never).handleVolumeChanged({ volume: 75 }, notified)
    ).toEqual({ volume: 75 });
    expect(notified).toHaveBeenCalledTimes(2);

    const metadata = new MetadataLookupPort();
    expect(metadata.musicbrainzArtist('Blue Scholars')).toContain('Blue%20Scholars');
    expect(metadata.themoviedbMovieImages('Big Buck Bunny')).toContain('Big%20Buck%20Bunny');
    expect(metadata.youtubeTrailer('Big Buck Bunny')).toContain('trailer');

    expect(client.calls).toEqual([
      { method: 'AudioLibrary.GetAlbumDetails', params: { albumid: 1, properties: ['title'] } },
      { method: 'AudioLibrary.GetArtistDetails', params: { artistid: 2, properties: ['artist'] } },
      { method: 'AudioLibrary.GetSongDetails', params: { songid: 3, properties: ['title'] } },
      {
        method: 'VideoLibrary.GetSeasonDetails',
        params: { tvshowid: 4, season: 1, properties: ['season'] }
      },
      { method: 'VideoLibrary.RefreshMovie', params: { movieid: 5 } },
      { method: 'AudioLibrary.Scan', params: {} },
      { method: 'VideoLibrary.Scan', params: {} }
    ]);
  });
});
