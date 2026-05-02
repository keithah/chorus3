export const CHORUS2_PARITY_KIND_VALUES = ['route', 'nav', 'control', 'action', 'jsonrpc'] as const;

export const CHORUS2_PARITY_STATUS_VALUES = [
  'implemented',
  'missing',
  'deferred',
  'out-of-scope'
] as const;

export type Chorus2ParityKind = (typeof CHORUS2_PARITY_KIND_VALUES)[number];
export type Chorus2ParityStatus = (typeof CHORUS2_PARITY_STATUS_VALUES)[number];

export interface Chorus2ParityRow {
  readonly id: string;
  readonly kind: Chorus2ParityKind;
  readonly family: string;
  readonly surface: string;
  readonly status: Chorus2ParityStatus;
  readonly owner: string;
  readonly evidence: readonly string[];
  readonly notes?: string;
}

type RowInput = Omit<Chorus2ParityRow, 'evidence'> & {
  readonly evidence?: readonly string[];
};

const APP_ROUTER_EVIDENCE = ['src/lib/app/appRouter.ts'];
const VIDEO_ROUTER_EVIDENCE = ['src/lib/video/videoRouter.ts'];
const KODI_METHODS_EVIDENCE = ['src/lib/kodi/methods.ts'];
const SCANNER_EVIDENCE = ['scripts/scan-chorus2-parity.mjs'];

function row(input: RowInput): Chorus2ParityRow {
  return {
    ...input,
    evidence: input.evidence?.length ? [...input.evidence].sort() : SCANNER_EVIDENCE
  };
}

const ROUTE_ROWS = [
  row({
    id: 'route:shell:root',
    kind: 'route',
    family: 'shell',
    surface: '/',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE,
    notes: 'Current dashboard route covers the Chorus2 home shell entry point.'
  }),
  row({
    id: 'route:settings:settings',
    kind: 'route',
    family: 'settings',
    surface: 'settings',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:addon:addons',
    kind: 'route',
    family: 'addon',
    surface: 'addons',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:addon:addons-addonid',
    kind: 'route',
    family: 'addon',
    surface: 'addons/:addonid',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:addon:addons-type',
    kind: 'route',
    family: 'addon',
    surface: 'addons/:type',
    status: 'missing',
    owner: 'M006/S02',
    notes: 'Chorus2 type-filter aliases are not accepted by the current addon route parser.'
  }),
  row({
    id: 'route:addon:addon-execute-id',
    kind: 'route',
    family: 'addon',
    surface: 'addon/execute/:id',
    status: 'missing',
    owner: 'M006/S04'
  }),
  row({
    id: 'route:album:albums',
    kind: 'route',
    family: 'album',
    surface: 'albums',
    status: 'deferred',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:artist:artists',
    kind: 'route',
    family: 'artist',
    surface: 'artists',
    status: 'deferred',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:browser:browser',
    kind: 'route',
    family: 'browser',
    surface: 'browser',
    status: 'missing',
    owner: 'M006/S04'
  }),
  row({
    id: 'route:browser:files',
    kind: 'route',
    family: 'browser',
    surface: 'files',
    status: 'missing',
    owner: 'M006/S04'
  }),
  row({
    id: 'route:category:category',
    kind: 'route',
    family: 'category',
    surface: 'category',
    status: 'deferred',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:epg:epg',
    kind: 'route',
    family: 'epg',
    surface: 'epg',
    status: 'deferred',
    owner: 'R056/M006/S04'
  }),
  row({
    id: 'route:help:help',
    kind: 'route',
    family: 'help',
    surface: 'help',
    status: 'deferred',
    owner: 'R057/M006/S04'
  }),
  row({
    id: 'route:input:remote',
    kind: 'route',
    family: 'input',
    surface: 'remote',
    status: 'missing',
    owner: 'M006/S03'
  }),
  row({
    id: 'route:lab:lab-shortcuts',
    kind: 'route',
    family: 'lab',
    surface: 'lab/shortcuts',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:lab:lab-api-browser',
    kind: 'route',
    family: 'lab',
    surface: 'lab/api-browser',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:lab:lab-edge',
    kind: 'route',
    family: 'lab',
    surface: 'lab/*',
    status: 'deferred',
    owner: 'R057/M006/S04'
  }),
  row({
    id: 'route:landing:landing',
    kind: 'route',
    family: 'landing',
    surface: 'landing',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: APP_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:local-playlist:localplaylist',
    kind: 'route',
    family: 'local-playlist',
    surface: 'localPlaylist',
    status: 'deferred',
    owner: 'R055/M006/S04'
  }),
  row({
    id: 'route:movie:movies',
    kind: 'route',
    family: 'movie',
    surface: 'movies',
    status: 'missing',
    owner: 'M006/S02',
    evidence: VIDEO_ROUTER_EVIDENCE,
    notes: 'Current parser supports video/movies, not the Chorus2 movies alias.'
  }),
  row({
    id: 'route:movie:video-movies',
    kind: 'route',
    family: 'movie',
    surface: 'video/movies',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: VIDEO_ROUTER_EVIDENCE
  }),
  row({
    id: 'route:musicvideo:music-videos',
    kind: 'route',
    family: 'musicvideo',
    surface: 'music/videos',
    status: 'deferred',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:playlist:playlists',
    kind: 'route',
    family: 'playlist',
    surface: 'playlists',
    status: 'deferred',
    owner: 'R055/M006/S04'
  }),
  row({
    id: 'route:pvr:pvr',
    kind: 'route',
    family: 'pvr',
    surface: 'pvr',
    status: 'deferred',
    owner: 'R056/M006/S04'
  }),
  row({
    id: 'route:search:search',
    kind: 'route',
    family: 'search',
    surface: 'search',
    status: 'deferred',
    owner: 'R057/M006/S04'
  }),
  row({
    id: 'route:thumbs:thumbsup',
    kind: 'route',
    family: 'thumbs',
    surface: 'thumbsup',
    status: 'deferred',
    owner: 'R055/M006/S04'
  }),
  row({
    id: 'route:tvshow:tvshows',
    kind: 'route',
    family: 'tvshow',
    surface: 'tvshows',
    status: 'missing',
    owner: 'M006/S02',
    evidence: VIDEO_ROUTER_EVIDENCE,
    notes: 'Current parser supports video/tv, not the Chorus2 tvshows alias.'
  }),
  row({
    id: 'route:tvshow:video-tv',
    kind: 'route',
    family: 'tvshow',
    surface: 'video/tv',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: VIDEO_ROUTER_EVIDENCE
  })
] as const;

const NAV_SURFACES = [
  ['music', 'music', 'deferred', 'R054/M006/S04'],
  ['music', 'music/genres', 'deferred', 'R054/M006/S04'],
  ['music', 'music/top', 'deferred', 'R054/M006/S04'],
  ['music', 'music/artists', 'deferred', 'R054/M006/S04'],
  ['music', 'music/albums', 'deferred', 'R054/M006/S04'],
  ['musicvideo', 'music/videos', 'deferred', 'R054/M006/S04'],
  ['movie', 'movies/recent', 'missing', 'M006/S02'],
  ['movie', 'movies', 'missing', 'M006/S02'],
  ['tvshow', 'tvshows/recent', 'missing', 'M006/S02'],
  ['tvshow', 'tvshows', 'missing', 'M006/S02'],
  ['browser', 'browser', 'missing', 'M006/S04'],
  ['pvr', 'pvr/tv', 'deferred', 'R056/M006/S04'],
  ['pvr', 'pvr/radio', 'deferred', 'R056/M006/S04'],
  ['pvr', 'pvr/recordings', 'deferred', 'R056/M006/S04'],
  ['addon', 'addons/all', 'missing', 'M006/S02'],
  ['addon', 'addons/video', 'missing', 'M006/S02'],
  ['addon', 'addons/audio', 'missing', 'M006/S02'],
  ['addon', 'addons/executable', 'missing', 'M006/S02'],
  ['settings', 'settings/*', 'implemented', 'M006/S01'],
  ['thumbs', 'thumbsup', 'deferred', 'R055/M006/S04'],
  ['playlist', 'playlists', 'deferred', 'R055/M006/S04'],
  ['help', 'help', 'deferred', 'R057/M006/S04']
] as const;

const NAV_ROWS = NAV_SURFACES.map(([family, surface, status, owner]) =>
  row({
    id: `nav:${family}:${surface.replace('*', 'wildcard').replace(/[^A-Za-z0-9]+/gu, '-')}`
      .toLowerCase()
      .replace(/-$/u, ''),
    kind: 'nav',
    family,
    surface,
    status,
    owner,
    evidence: SCANNER_EVIDENCE
  })
);

const CONTROL_SURFACES = [
  'left',
  'up',
  'right',
  'down',
  'back',
  'select',
  'contextmenu',
  'info',
  'home',
  'sendtext',
  'executeaction',
  'osd',
  'playpause',
  'stop',
  'volumeup',
  'volumedown'
] as const;

const CONTROL_ROWS = CONTROL_SURFACES.map((surface) =>
  row({
    id: `control:remote:${surface}`,
    kind: 'control',
    family: 'remote',
    surface,
    status: 'missing',
    owner: 'M006/S03',
    evidence: SCANNER_EVIDENCE
  })
);

const ACTION_ROWS = [
  row({
    id: 'action:remote:input-remote-controls',
    kind: 'action',
    family: 'remote',
    surface: 'input remote controls',
    status: 'missing',
    owner: 'M006/S03'
  }),
  row({
    id: 'action:player:playback-commands',
    kind: 'action',
    family: 'player',
    surface: 'playback commands',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: KODI_METHODS_EVIDENCE
  }),
  row({
    id: 'action:playlist:playlist-commands',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist commands',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: KODI_METHODS_EVIDENCE
  }),
  row({
    id: 'action:pvr:pvr-commands',
    kind: 'action',
    family: 'pvr',
    surface: 'PVR commands',
    status: 'deferred',
    owner: 'R056/M006/S04'
  }),
  row({
    id: 'action:library:library-write-commands',
    kind: 'action',
    family: 'library',
    surface: 'library write commands',
    status: 'deferred',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'action:system:power-commands',
    kind: 'action',
    family: 'system',
    surface: 'power commands',
    status: 'deferred',
    owner: 'D043/M006/S05',
    notes: 'Destructive power actions require an explicit guard before exposure.'
  })
] as const;

const JSON_RPC_METHODS = [
  ['Input.Left', 'missing', 'M006/S03'],
  ['Input.Up', 'missing', 'M006/S03'],
  ['Input.Right', 'missing', 'M006/S03'],
  ['Input.Down', 'missing', 'M006/S03'],
  ['Input.Back', 'missing', 'M006/S03'],
  ['Input.Select', 'missing', 'M006/S03'],
  ['Input.ContextMenu', 'missing', 'M006/S03'],
  ['Input.Info', 'missing', 'M006/S03'],
  ['Input.Home', 'missing', 'M006/S03'],
  ['Input.SendText', 'missing', 'M006/S03'],
  ['Input.ExecuteAction', 'missing', 'M006/S03'],
  ['Player.PlayPause', 'implemented', 'M006/S01'],
  ['Player.Stop', 'implemented', 'M006/S01'],
  ['Player.GoTo', 'implemented', 'M006/S01'],
  ['Player.SetRepeat', 'implemented', 'M006/S01'],
  ['Player.SetShuffle', 'implemented', 'M006/S01'],
  ['Player.Seek', 'implemented', 'M006/S01'],
  ['Player.GetActivePlayers', 'implemented', 'M006/S01'],
  ['Player.GetProperties', 'implemented', 'M006/S01'],
  ['Player.GetItem', 'implemented', 'M006/S01'],
  ['Application.GetProperties', 'implemented', 'M006/S01'],
  ['Application.SetVolume', 'implemented', 'M006/S01'],
  ['Application.SetMute', 'implemented', 'M006/S01'],
  ['Application.Quit', 'deferred', 'D043/M006/S05'],
  ['System.GetProperties', 'implemented', 'M006/S01'],
  ['System.Shutdown', 'deferred', 'D043/M006/S05'],
  ['System.Reboot', 'deferred', 'D043/M006/S05'],
  ['System.Suspend', 'deferred', 'D043/M006/S05'],
  ['System.Hibernate', 'deferred', 'D043/M006/S05'],
  ['Playlist.Insert', 'missing', 'M006/S04'],
  ['Playlist.Remove', 'implemented', 'M006/S01'],
  ['Playlist.Clear', 'implemented', 'M006/S01'],
  ['Playlist.GetItems', 'implemented', 'M006/S01'],
  ['PVR.Record', 'deferred', 'R056/M006/S04'],
  ['PVR.ToggleTimer', 'deferred', 'R056/M006/S04'],
  ['PVR.AddTimer', 'deferred', 'R056/M006/S04'],
  ['PVR.DeleteTimer', 'deferred', 'R056/M006/S04'],
  ['Addons.ExecuteAddon', 'missing', 'M006/S04'],
  ['Files.PrepareDownload', 'implemented', 'M006/S01'],
  ['AudioLibrary.SetAlbumDetails', 'deferred', 'R054/M006/S04'],
  ['AudioLibrary.SetArtistDetails', 'deferred', 'R054/M006/S04'],
  ['AudioLibrary.SetSongDetails', 'implemented', 'M006/S01'],
  ['AudioLibrary.Scan', 'deferred', 'R054/M006/S04'],
  ['AudioLibrary.Clean', 'deferred', 'R054/M006/S04'],
  ['VideoLibrary.SetEpisodeDetails', 'implemented', 'M006/S01'],
  ['VideoLibrary.SetMovieDetails', 'implemented', 'M006/S01'],
  ['VideoLibrary.SetTVShowDetails', 'missing', 'M006/S04'],
  ['VideoLibrary.SetMusicVideoDetails', 'deferred', 'R054/M006/S04'],
  ['VideoLibrary.Scan', 'deferred', 'R054/M006/S04'],
  ['VideoLibrary.Clean', 'deferred', 'R054/M006/S04'],
  ['VideoLibrary.RefreshMovie', 'missing', 'M006/S04'],
  ['VideoLibrary.RefreshTVShow', 'implemented', 'M006/S01'],
  ['VideoLibrary.RefreshEpisode', 'implemented', 'M006/S01']
] as const;

const JSON_RPC_ROWS = JSON_RPC_METHODS.map(([surface, status, owner]) => {
  const [family, method] = surface.split('.') as [string, string];
  const implemented = status === 'implemented';
  return row({
    id: `jsonrpc:${family.toLowerCase()}:${method.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()}`,
    kind: 'jsonrpc',
    family: family.toLowerCase(),
    surface,
    status,
    owner,
    evidence: implemented ? KODI_METHODS_EVIDENCE : SCANNER_EVIDENCE,
    notes: owner.startsWith('D043')
      ? 'Guarded destructive method; do not expose without confirmation.'
      : undefined
  });
});

const SOURCE_SCANNED_BACKLOG_ROWS = [
  row({
    id: 'action:addon:addon-enabled-addons',
    kind: 'action',
    family: 'addon',
    surface: 'addon:enabled:addons',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-entities',
    kind: 'action',
    family: 'addon',
    surface: 'addon:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/addon.js.coffee:71'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-excluded-paths',
    kind: 'action',
    family: 'addon',
    surface: 'addon:excludedPaths',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/addon/addon_app.js.coffee:80',
      'src/js/apps/addon/youtube/addon_youtube_app.js.coffee:27'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-is-enabled',
    kind: 'action',
    family: 'addon',
    surface: 'addon:isEnabled',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:72'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-pvr-enabled',
    kind: 'action',
    family: 'addon',
    surface: 'addon:pvr:enabled',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/addon/pvr/addons_pvr_ap.js.coffee:9'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-search-enabled',
    kind: 'action',
    family: 'addon',
    surface: 'addon:search:enabled',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:88'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-search-settings',
    kind: 'action',
    family: 'addon',
    surface: 'addon:search:settings:',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/addon/googlemusic/addon_googlemusic_app.js.coffee:15',
      'src/js/apps/addon/mixcloud/addon_mixcloud_app.js.coffee:14',
      'src/js/apps/addon/radio/addon_radio_app.js.coffee:15',
      'src/js/apps/addon/soundcloud/addon_soundcloud_app.js.coffee:14',
      'src/js/apps/addon/youtube/addon_youtube_app.js.coffee:13'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-action',
    kind: 'action',
    family: 'album',
    surface: 'album:action',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:38'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-action-items',
    kind: 'action',
    family: 'album',
    surface: 'album:action:items',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:41'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-edit',
    kind: 'action',
    family: 'album',
    surface: 'album:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-entities',
    kind: 'action',
    family: 'album',
    surface: 'album:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:63'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-entity',
    kind: 'action',
    family: 'album',
    surface: 'album:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-fields',
    kind: 'action',
    family: 'album',
    surface: 'album:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:67'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-list-view',
    kind: 'action',
    family: 'album',
    surface: 'album:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/list/list_controller.js.coffee:75'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:albums:albums-withsongs-view',
    kind: 'action',
    family: 'albums',
    surface: 'albums:withsongs:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/show/show_controller.js.coffee:98'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-action',
    kind: 'action',
    family: 'artist',
    surface: 'artist:action',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:38'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-action-items',
    kind: 'action',
    family: 'artist',
    surface: 'artist:action:items',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:41'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-edit',
    kind: 'action',
    family: 'artist',
    surface: 'artist:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-entities',
    kind: 'action',
    family: 'artist',
    surface: 'artist:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:63'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-entity',
    kind: 'action',
    family: 'artist',
    surface: 'artist:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-fields',
    kind: 'action',
    family: 'artist',
    surface: 'artist:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:70'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-list-view',
    kind: 'action',
    family: 'artist',
    surface: 'artist:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/list/list_controller.js.coffee:75'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:body:body-state',
    kind: 'action',
    family: 'body',
    surface: 'body:state',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:142'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:broadcast:broadcast-action',
    kind: 'action',
    family: 'broadcast',
    surface: 'broadcast:action',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/epg_app.js.coffee:36'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:broadcast:broadcast-entities',
    kind: 'action',
    family: 'broadcast',
    surface: 'broadcast:entities',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/epg.js.coffee:65'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:broadcast:broadcast-entity',
    kind: 'action',
    family: 'broadcast',
    surface: 'broadcast:entity',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/epg.js.coffee:61'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:browser:browser-directory-view',
    kind: 'action',
    family: 'browser',
    surface: 'browser:directory:view',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/browser/list/list_controller.js.coffee:172'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:browser:browser-file-view',
    kind: 'action',
    family: 'browser',
    surface: 'browser:file:view',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/browser/list/list_controller.js.coffee:168'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:cast:cast-entities',
    kind: 'action',
    family: 'cast',
    surface: 'cast:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/cast.js.coffee:45'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:cast:cast-list-view',
    kind: 'action',
    family: 'cast',
    surface: 'cast:list:view',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/cast/cast_app.js.coffee:19'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:channel:channel-entities',
    kind: 'action',
    family: 'channel',
    surface: 'channel:entities',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:108'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:channel:channel-entity',
    kind: 'action',
    family: 'channel',
    surface: 'channel:entity',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:104'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-audio-add',
    kind: 'action',
    family: 'command',
    surface: 'command:audio:add',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:51'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-audio-play',
    kind: 'action',
    family: 'command',
    surface: 'command:audio:play',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-audio-clean',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:audio:clean',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:72'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-controller',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:controller',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:26'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-player',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:player',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:21'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-video-clean',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:video:clean',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-local-controller',
    kind: 'action',
    family: 'command',
    surface: 'command:local:controller',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:39'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-local-player',
    kind: 'action',
    family: 'command',
    surface: 'command:local:player',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:34'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-video-play',
    kind: 'action',
    family: 'command',
    surface: 'command:video:play',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:55'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-app-get',
    kind: 'action',
    family: 'config',
    surface: 'config:app:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:34'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-app-set',
    kind: 'action',
    family: 'config',
    surface: 'config:app:set',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:43'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-static-get',
    kind: 'action',
    family: 'config',
    surface: 'config:static:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:54'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-static-set',
    kind: 'action',
    family: 'config',
    surface: 'config:static:set',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:60'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-action',
    kind: 'action',
    family: 'episode',
    surface: 'episode:action',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:105'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-action-items',
    kind: 'action',
    family: 'episode',
    surface: 'episode:action:items',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:111'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-action-watched',
    kind: 'action',
    family: 'episode',
    surface: 'episode:action:watched',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:142'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-build-collection',
    kind: 'action',
    family: 'episode',
    surface: 'episode:build:collection',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:86'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-edit',
    kind: 'action',
    family: 'episode',
    surface: 'episode:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:152'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-entities',
    kind: 'action',
    family: 'episode',
    surface: 'episode:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:74'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-entity',
    kind: 'action',
    family: 'episode',
    surface: 'episode:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:70'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-fields',
    kind: 'action',
    family: 'episode',
    surface: 'episode:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:90'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-list-view',
    kind: 'action',
    family: 'episode',
    surface: 'episode:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/episode/episode_controller.js.coffee:101'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-tvshow-entities',
    kind: 'action',
    family: 'episode',
    surface: 'episode:tvshow:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:78'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:fanarttv:fanarttv-artist-image-entities',
    kind: 'action',
    family: 'fanarttv',
    surface: 'fanarttv:artist:image:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/fanarttv.js.coffee:75'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:249'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-entity',
    kind: 'action',
    family: 'file',
    surface: 'file:entity',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:240'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-parsed-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:parsed:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:257'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-path-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:path:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:253'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-source-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:source:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:261'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-source-media-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:source:media:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:265'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-source-mediatypes',
    kind: 'action',
    family: 'file',
    surface: 'file:source:mediatypes',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:269'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-url-entity',
    kind: 'action',
    family: 'file',
    surface: 'file:url:entity',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:244'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-active',
    kind: 'action',
    family: 'filter',
    surface: 'filter:active',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:410'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-active-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:active:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:69'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-apply-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:apply:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:414'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-filterable-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:filterable:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:425'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-filters-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:filters:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:60'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-filters-options-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:filters:options:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:63'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-init',
    kind: 'action',
    family: 'filter',
    surface: 'filter:init',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:429'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-options',
    kind: 'action',
    family: 'filter',
    surface: 'filter:options',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:399'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-show',
    kind: 'action',
    family: 'filter',
    surface: 'filter:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:391'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-sort-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sort:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:66'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-sort-store-get',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sort:store:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:494'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-sort-store-set',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sort:store:set',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:490'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-sortable-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sortable:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:421'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-store-get',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:460'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-store-key-get',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:key:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:464'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-store-key-toggle',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:key:toggle',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:473'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-store-key-update',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:key:update',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:468'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:filter:filter-store-set',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:set',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:455'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-item-entities',
    kind: 'action',
    family: 'form',
    surface: 'form:item:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/form/form.js.coffee:82'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-popup-wrapper',
    kind: 'action',
    family: 'form',
    surface: 'form:popup:wrapper',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/components/form/form_controller.js.coffee:50'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-render-items',
    kind: 'action',
    family: 'form',
    surface: 'form:render:items',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/components/form/form_controller.js.coffee:41'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-value-entities',
    kind: 'action',
    family: 'form',
    surface: 'form:value:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/form/form.js.coffee:86'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-wrapper',
    kind: 'action',
    family: 'form',
    surface: 'form:wrapper',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/components/form/form_controller.js.coffee:46'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:genre:genre-entities',
    kind: 'action',
    family: 'genre',
    surface: 'genre:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/genres.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:genre:genre-entity',
    kind: 'action',
    family: 'genre',
    surface: 'genre:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/genres.js.coffee:54'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:help:help-page',
    kind: 'action',
    family: 'help',
    surface: 'help:page',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/help/help_app.js.coffee:52'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:help:help-subnav',
    kind: 'action',
    family: 'help',
    surface: 'help:subnav',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/help/help_app.js.coffee:48'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:images:images-fanart-set',
    kind: 'action',
    family: 'images',
    surface: 'images:fanart:set',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/images/images_app.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:images:images-path-entity',
    kind: 'action',
    family: 'images',
    surface: 'images:path:entity',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/images/images_app.js.coffee:68'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:images:images-path-get',
    kind: 'action',
    family: 'images',
    surface: 'images:path:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/images/images_app.js.coffee:63'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-action',
    kind: 'action',
    family: 'input',
    surface: 'input:action',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:144'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-remote-toggle',
    kind: 'action',
    family: 'input',
    surface: 'input:remote:toggle',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:141'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-resume',
    kind: 'action',
    family: 'input',
    surface: 'input:resume',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:147'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-send',
    kind: 'action',
    family: 'input',
    surface: 'input:send',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:138'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-textbox',
    kind: 'action',
    family: 'input',
    surface: 'input:textbox',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:130'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-textbox-close',
    kind: 'action',
    family: 'input',
    surface: 'input:textbox:close',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:135'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:introspect:introspect-dictionary',
    kind: 'action',
    family: 'introspect',
    surface: 'introspect:dictionary',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:89'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:introspect:introspect-entities',
    kind: 'action',
    family: 'introspect',
    surface: 'introspect:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:85'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:introspect:introspect-entity',
    kind: 'action',
    family: 'introspect',
    surface: 'introspect:entity',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:81'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:loading:loading-get-view',
    kind: 'action',
    family: 'loading',
    surface: 'loading:get:view',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/loading/loading_app.js.coffee:20'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:loading:loading-show-page',
    kind: 'action',
    family: 'loading',
    surface: 'loading:show:page',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/loading/loading_app.js.coffee:16'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:loading:loading-show-view',
    kind: 'action',
    family: 'loading',
    surface: 'loading:show:view',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/loading/loading_app.js.coffee:11'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplayer:localplayer-clear-entities',
    kind: 'action',
    family: 'localplayer',
    surface: 'localplayer:clear:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:206'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplayer:localplayer-get-entities',
    kind: 'action',
    family: 'localplayer',
    surface: 'localplayer:get:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:202'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplayer:localplayer-item-add-entities',
    kind: 'action',
    family: 'localplayer',
    surface: 'localplayer:item:add:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:210'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-add-entity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:add:entity',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:124'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-addentity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:addentity',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:101'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-clear-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:clear:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:138'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:134'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-entity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:entity',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-item-add-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:item:add:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:151'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-item-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:item:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:147'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-item-updateorder',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:item:updateorder',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:156'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-newlist',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:newlist',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:104'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-reload',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:reload',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:107'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-remove-entity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:remove:entity',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:128'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-rename',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:rename',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:110'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-action',
    kind: 'action',
    family: 'movie',
    surface: 'movie:action',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-action-items',
    kind: 'action',
    family: 'movie',
    surface: 'movie:action:items',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:41'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-action-watched',
    kind: 'action',
    family: 'movie',
    surface: 'movie:action:watched',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:50'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-build-collection',
    kind: 'action',
    family: 'movie',
    surface: 'movie:build:collection',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:72'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-edit',
    kind: 'action',
    family: 'movie',
    surface: 'movie:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-entities',
    kind: 'action',
    family: 'movie',
    surface: 'movie:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:68'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-entity',
    kind: 'action',
    family: 'movie',
    surface: 'movie:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:64'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-fields',
    kind: 'action',
    family: 'movie',
    surface: 'movie:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:76'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-list-view',
    kind: 'action',
    family: 'movie',
    surface: 'movie:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/list/list_controller.js.coffee:77'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicbrainz:musicbrainz-artist-entity',
    kind: 'action',
    family: 'musicbrainz',
    surface: 'musicbrainz:artist:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/musicbrainz.js.coffee:38'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-action',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:action',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:42'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-action-items',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:action:items',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-build-collection',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:build:collection',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:74'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-edit',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-entities',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:66'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-entity',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:62'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-fields',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:70'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-list-view',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/list/list_controller.js.coffee:76'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-array-entities',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:array:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:179'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-children-show',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:children:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/navMain/navMain_app.js.coffee:29'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-collection-show',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:collection:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/navMain/navMain_app.js.coffee:32'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-entities',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:171'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-update-defaults',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:update:defaults',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:190'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-update-entities',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:update:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:186'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:notification:notification-show',
    kind: 'action',
    family: 'notification',
    surface: 'notification:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/notifications/notifications_app.js.coffee:7'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:player:player-kodi-progress-update',
    kind: 'action',
    family: 'player',
    surface: 'player:kodi:progress:update',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/player/player_app.js.coffee:176'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:player:player-kodi-timer',
    kind: 'action',
    family: 'player',
    surface: 'player:kodi:timer',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/player/player_app.js.coffee:163',
      'src/js/apps/state/kodi/kodi.js.coffee:30',
      'src/js/apps/state/kodi/kodi.js.coffee:59'
    ],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:player:player-local-progress-update',
    kind: 'action',
    family: 'player',
    surface: 'player:local:progress:update',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/player/player_app.js.coffee:172'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-export',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:export',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/playlist_app.js.coffee:35'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-kodi-entities',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:kodi:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/kodi/playlist.js.coffee:92'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-kodi-entity-api',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:kodi:entity:api',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/kodi/playlist.js.coffee:102'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-list',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:list',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/playlist_app.js.coffee:31'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-local-partymode',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:local:partymode',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/localParty/local_party.js.coffee:60'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-refresh',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:refresh',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/playlist_app.js.coffee:49'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:recording:recording-entities',
    kind: 'action',
    family: 'recording',
    surface: 'recording:entities',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:117'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:recording:recording-entity',
    kind: 'action',
    family: 'recording',
    surface: 'recording:entity',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:113'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search-addons:search-addons-entities',
    kind: 'action',
    family: 'search-addons',
    surface: 'searchAddons:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/search/searchAddons.js.coffee:41'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search-addons:search-addons-update-defaults',
    kind: 'action',
    family: 'search-addons',
    surface: 'searchAddons:update:defaults',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/search/searchAddons.js.coffee:49'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search-addons:search-addons-update-entities',
    kind: 'action',
    family: 'search-addons',
    surface: 'searchAddons:update:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/search/searchAddons.js.coffee:45'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search:search-go',
    kind: 'action',
    family: 'search',
    surface: 'search:go',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/search/search_app.js.coffee:51'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-entities',
    kind: 'action',
    family: 'season',
    surface: 'season:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:63'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-entity',
    kind: 'action',
    family: 'season',
    surface: 'season:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-fields',
    kind: 'action',
    family: 'season',
    surface: 'season:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:68'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-list-view',
    kind: 'action',
    family: 'season',
    surface: 'season:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/season/season_controller.js.coffee:82'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-action-add',
    kind: 'action',
    family: 'selected',
    surface: 'selected:action:add',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:103'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-action-localadd',
    kind: 'action',
    family: 'selected',
    surface: 'selected:action:localadd',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:110'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-action-play',
    kind: 'action',
    family: 'selected',
    surface: 'selected:action:play',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:96'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-clear-items',
    kind: 'action',
    family: 'selected',
    surface: 'selected:clear:items',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:88'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-get-items',
    kind: 'action',
    family: 'selected',
    surface: 'selected:get:items',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-get-media',
    kind: 'action',
    family: 'selected',
    surface: 'selected:get:media',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:80'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-set-media',
    kind: 'action',
    family: 'selected',
    surface: 'selected:set:media',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:92'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-update-items',
    kind: 'action',
    family: 'selected',
    surface: 'selected:update:items',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:84'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-kodi-entities',
    kind: 'action',
    family: 'settings',
    surface: 'settings:kodi:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:132'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-kodi-filtered-entities',
    kind: 'action',
    family: 'settings',
    surface: 'settings:kodi:filtered:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:136'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-kodi-save-entities',
    kind: 'action',
    family: 'settings',
    surface: 'settings:kodi:save:entities',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:141'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-subnav',
    kind: 'action',
    family: 'settings',
    surface: 'settings:subnav',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:56'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:shell:shell-disconnect',
    kind: 'action',
    family: 'shell',
    surface: 'shell:disconnect',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:158'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:shell:shell-reconnect',
    kind: 'action',
    family: 'shell',
    surface: 'shell:reconnect',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:147'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:shell:shell-view-ready',
    kind: 'action',
    family: 'shell',
    surface: 'shell:view:ready',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:129'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:sockets:sockets-active',
    kind: 'action',
    family: 'sockets',
    surface: 'sockets:active',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:55'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-albumparse-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:albumparse:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:161'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-build-collection',
    kind: 'action',
    family: 'song',
    surface: 'song:build:collection',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:153'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-byid-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:byid:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:157'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-custom-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:custom:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:149'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-edit',
    kind: 'action',
    family: 'song',
    surface: 'song:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/song/song_app.js.coffee:4'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:145'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-entity',
    kind: 'action',
    family: 'song',
    surface: 'song:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:141'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-fields',
    kind: 'action',
    family: 'song',
    surface: 'song:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:165'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-list-view',
    kind: 'action',
    family: 'song',
    surface: 'song:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/song/list/list_controller.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-current',
    kind: 'action',
    family: 'state',
    surface: 'state:current',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:151'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-kodi',
    kind: 'action',
    family: 'state',
    surface: 'state:kodi',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:145'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-kodi-get',
    kind: 'action',
    family: 'state',
    surface: 'state:kodi:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/kodi.js.coffee:21'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-kodi-update',
    kind: 'action',
    family: 'state',
    surface: 'state:kodi:update',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/kodi.js.coffee:18'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-local',
    kind: 'action',
    family: 'state',
    surface: 'state:local',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:147'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-local-get',
    kind: 'action',
    family: 'state',
    surface: 'state:local:get',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/local/local.js.coffee:17'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-local-update',
    kind: 'action',
    family: 'state',
    surface: 'state:local:update',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/local/local.js.coffee:14'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-ws-init',
    kind: 'action',
    family: 'state',
    surface: 'state:ws:init',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:156'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:themoviedb:themoviedb-movie-image-entities',
    kind: 'action',
    family: 'themoviedb',
    surface: 'themoviedb:movie:image:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/themoviedb.js.coffee:95'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:themoviedb:themoviedb-tv-image-entities',
    kind: 'action',
    family: 'themoviedb',
    surface: 'themoviedb:tv:image:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/themoviedb.js.coffee:100'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:thumbsup:thumbsup-check',
    kind: 'action',
    family: 'thumbsup',
    surface: 'thumbsup:check',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:188'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:thumbsup:thumbsup-get-entities',
    kind: 'action',
    family: 'thumbsup',
    surface: 'thumbsup:get:entities',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:184'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:thumbsup:thumbsup-toggle-entity',
    kind: 'action',
    family: 'thumbsup',
    surface: 'thumbsup:toggle:entity',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:173'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-action',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:action',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:108'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-action-items',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:action:items',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:126'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-action-watched',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:action:watched',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:132'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-edit',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:edit',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:146'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-entities',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:65'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-entity',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:entity',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:61'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-fields',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:fields',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:69'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-list-view',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/list/list_controller.js.coffee:78'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-dropdown-bind-close',
    kind: 'action',
    family: 'ui',
    surface: 'ui:dropdown:bind:close',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:146'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-close',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:close',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:107', 'src/js/apps/ui/ui_app.js.coffee:127'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-confirm',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:confirm',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:111'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-form-show',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:form:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:123'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-options',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:options',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:137'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-show',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:116'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-youtube',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:youtube',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:131'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-playermenu',
    kind: 'action',
    family: 'ui',
    surface: 'ui:playermenu',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:142'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-textinput-show',
    kind: 'action',
    family: 'ui',
    surface: 'ui:textinput:show',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:89'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:when:when-entity-fetched',
    kind: 'action',
    family: 'when',
    surface: 'when:entity:fetched',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/_base/_fetch.js.coffee:18'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-list-view',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:list:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/external/youtube/youtube_controller.js.coffee:37'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-search-entities',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:search:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/youtube.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-search-popup',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:search:popup',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/external/youtube/youtube_controller.js.coffee:31'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-search-view',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:search:view',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/external/youtube/youtube_controller.js.coffee:28'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-trailer-entities',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:trailer:entities',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/youtube.js.coffee:56'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:all',
    kind: 'control',
    family: 'remote',
    surface: 'all',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/helpers/entities.js.coffee:74'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:context-menu',
    kind: 'control',
    family: 'remote',
    surface: 'ContextMenu',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/remote/tpl/remote_control.jst.eco:19'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:google',
    kind: 'control',
    family: 'remote',
    surface: 'google',
    status: 'missing',
    owner: 'M006/S03',
    evidence: [
      'src/js/apps/album/show/tpl/details_meta.jst.eco:47',
      'src/js/apps/artist/show/tpl/details_meta.jst.eco:51',
      'src/js/apps/movie/show/tpl/details_meta.jst.eco:77',
      'src/js/apps/musicvideo/show/tpl/details_meta.jst.eco:50',
      'src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:83',
      'src/js/apps/tvshow/show/tpl/details_meta.jst.eco:45'
    ],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:imdb',
    kind: 'control',
    family: 'remote',
    surface: 'imdb',
    status: 'missing',
    owner: 'M006/S03',
    evidence: [
      'src/js/apps/movie/show/tpl/details_meta.jst.eco:78',
      'src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:84',
      'src/js/apps/tvshow/show/tpl/details_meta.jst.eco:46'
    ],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:soundcloud',
    kind: 'control',
    family: 'remote',
    surface: 'soundcloud',
    status: 'missing',
    owner: 'M006/S03',
    evidence: [
      'src/js/apps/album/show/tpl/details_meta.jst.eco:48',
      'src/js/apps/artist/show/tpl/details_meta.jst.eco:52'
    ],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:tmdb',
    kind: 'control',
    family: 'remote',
    surface: 'tmdb',
    status: 'missing',
    owner: 'M006/S03',
    evidence: [
      'src/js/apps/movie/show/tpl/details_meta.jst.eco:79',
      'src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:86',
      'src/js/apps/tvshow/show/tpl/details_meta.jst.eco:48'
    ],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:tvdb',
    kind: 'control',
    family: 'remote',
    surface: 'tvdb',
    status: 'missing',
    owner: 'M006/S03',
    evidence: [
      'src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:85',
      'src/js/apps/tvshow/show/tpl/details_meta.jst.eco:47'
    ],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:addons:controller',
    kind: 'jsonrpc',
    family: 'addons',
    surface: 'Addons.Controller',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/settings/show/addons/addons_controller.js.coffee:3'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:addons:get-addons',
    kind: 'jsonrpc',
    family: 'addons',
    surface: 'Addons.GetAddons',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/addon.js.coffee:27',
      'src/js/apps/command/kodi/helpers/addon.js.coffee:6',
      'src/js/entities/kodi/file.js.coffee:62'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:addons:set-addon-enabled',
    kind: 'jsonrpc',
    family: 'addons',
    surface: 'Addons.SetAddonEnabled',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/settings/show/addons/addons_controller.js.coffee:82'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:application:on-volume-changed',
    kind: 'jsonrpc',
    family: 'application',
    surface: 'Application.OnVolumeChanged',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:151'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:clean',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.Clean',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:36',
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-album-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetAlbumDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:33'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-albums',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetAlbums',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:46'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-artist-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetArtistDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:33'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-artists',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetArtists',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-genres',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetGenres',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/genres.js.coffee:40'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-song-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetSongDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:111', 'src/js/entities/kodi/song.js.coffee:85'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-songs',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetSongs',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/entities/kodi/song.js.coffee:122',
      'src/js/entities/kodi/song.js.coffee:137'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-clean-finished',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnCleanFinished',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:181'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-clean-started',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnCleanStarted',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:177'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-scan-finished',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnScanFinished',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:170'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-scan-started',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnScanStarted',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:166'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-update',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnUpdate',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:193'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:scan',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.Scan',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:31',
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:set-album-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.SetAlbumDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:12',
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:set-artist-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.SetArtistDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:19',
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:set-song-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.SetSongDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:26',
      'src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:files:get-directory',
    kind: 'jsonrpc',
    family: 'files',
    surface: 'Files.GetDirectory',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:194'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:files:get-file-details',
    kind: 'jsonrpc',
    family: 'files',
    surface: 'Files.GetFileDetails',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:184'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:files:get-sources',
    kind: 'jsonrpc',
    family: 'files',
    surface: 'Files.GetSources',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:60'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:gui:window',
    kind: 'jsonrpc',
    family: 'gui',
    surface: 'GUI.Window',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/kodi/helpers/gui.coffee:12'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:action',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.Action',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:24'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:all',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.all',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:google',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.google',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:imdb',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.imdb',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:on-input-finished',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.OnInputFinished',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:215'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:on-input-requested',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.OnInputRequested',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:197'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:soundcloud',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.soundcloud',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:stop',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.Stop',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:tmdb',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.tmdb',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:tvdb',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.tvdb',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:get-active-players',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.GetActivePlayers',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/command/kodi/_base/api.js.coffee:103',
      'src/js/apps/command/kodi/_base/api.js.coffee:37',
      'src/js/apps/command/kodi/_base/api.js.coffee:71'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:get-item',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.GetItem',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/command/kodi/_base/api.js.coffee:110',
      'src/js/apps/command/kodi/_base/api.js.coffee:37'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:get-properties',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.GetProperties',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/command/kodi/_base/api.js.coffee:109',
      'src/js/apps/command/kodi/_base/api.js.coffee:37'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:introspect',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.Introspect',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:66'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:ping',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.Ping',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/helpers/connection.js.coffee:28'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-pause',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnPause',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:129'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-play',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnPlay',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:105'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-property-changed',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnPropertyChanged',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:125'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-resume',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnResume',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:112'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-seek',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnSeek',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:136'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-stop',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnStop',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:119'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:playlist:on-add',
    kind: 'jsonrpc',
    family: 'playlist',
    surface: 'Playlist.OnAdd',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:playlist:on-clear',
    kind: 'jsonrpc',
    family: 'playlist',
    surface: 'Playlist.OnClear',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:playlist:on-remove',
    kind: 'jsonrpc',
    family: 'playlist',
    surface: 'Playlist.OnRemove',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:channel-list',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.ChannelList',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/pvr/channelList/channel_list_controller.js.coffee:1',
      'src/js/apps/pvr/channelList/channel_list_view.js.coffee:1'
    ],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:channel-list-controller',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.ChannelList.Controller',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:12', 'src/js/apps/pvr/pvr_app.js.coffee:16'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-broadcasts',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetBroadcasts',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/epg.js.coffee:38', 'src/js/entities/kodi/epg.js.coffee:48'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-channel-details',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetChannelDetails',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:59'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-channels',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetChannels',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:69'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-recording-details',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetRecordingDetails',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:82'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-recordings',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetRecordings',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:91'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:recording-list',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.RecordingList',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:1',
      'src/js/apps/pvr/recordingList/recording_list_view.js.coffee:1'
    ],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:recording-list-controller',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.RecordingList.Controller',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:20'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:router',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.Router',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:24', 'src/js/apps/pvr/pvr_app.js.coffee:3'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:get-categories',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.GetCategories',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:109'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:get-sections',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.GetSections',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:101'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:get-settings',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.GetSettings',
    status: 'missing',
    owner: 'M006/S04',
    evidence: [
      'src/js/entities/kodi/settings.js.coffee:120',
      'src/js/entities/kodi/settings.js.coffee:47'
    ],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:set-setting-value',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.SetSettingValue',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:system:on-quit',
    kind: 'jsonrpc',
    family: 'system',
    surface: 'System.OnQuit',
    status: 'deferred',
    owner: 'D043/M006/S05',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:220'],
    notes: 'Guarded destructive method; do not expose without confirmation.'
  }),
  row({
    id: 'jsonrpc:system:on-restart',
    kind: 'jsonrpc',
    family: 'system',
    surface: 'System.OnRestart',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:225'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:system:on-wake',
    kind: 'jsonrpc',
    family: 'system',
    surface: 'System.OnWake',
    status: 'missing',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:225'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:clean',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.Clean',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:43',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-episode-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetEpisodeDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:39'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-episodes',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetEpisodes',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:50'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-movie-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMovieDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:36'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-movies',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMovies',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/entities/kodi/movie.js.coffee:47',
      'src/js/helpers/customMixins/kodi_entities.js.coffee:11'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-music-video-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMusicVideoDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:33'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-music-videos',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMusicVideos',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:44'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-seasons',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetSeasons',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-tvshow-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetTVShowDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:36'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-tvshows',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetTVShows',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-clean-finished',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnCleanFinished',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:189'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-clean-started',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnCleanStarted',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:185'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-scan-finished',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnScanFinished',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:159'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-scan-started',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnScanStarted',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:155'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-update',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnUpdate',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:193'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:refresh-episode',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.RefreshEpisode',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:85'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:refresh-movie',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.RefreshMovie',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:73'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:refresh-tvshow',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.RefreshTVShow',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:79'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:scan',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.Scan',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:38',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:set-episode-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.SetEpisodeDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:12',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:set-movie-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.SetMovieDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:19',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:set-music-video-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.SetMusicVideoDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:33',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:set-tvshow-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.SetTVShowDetails',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:26',
      'src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:add-on:add-on',
    kind: 'nav',
    family: 'add-on',
    surface: 'AddOn',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:23'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:add-ons-search-settings:add-ons-search-settings',
    kind: 'nav',
    family: 'add-ons-search-settings',
    surface: 'addOnsSearchSettings',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/apps/addon/addon_app.js.coffee:38',
      'src/js/apps/addon/addon_app.js.coffee:89'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:add-ons:add-ons',
    kind: 'nav',
    family: 'add-ons',
    surface: 'Add-ons',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/list/list_controller.js.coffee:31'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-all',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/all',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/apps/addon/list/list_controller.js.coffee:31',
      'src/js/entities/nav/navMain.js.coffee:46',
      'src/js/entities/nav/navMain.js.coffee:47'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-audio',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/audio',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:49'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-executable',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/executable',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/entities/nav/navMain.js.coffee:51'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-video',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/video',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/entities/nav/navMain.js.coffee:48'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:auto:auto',
    kind: 'nav',
    family: 'auto',
    surface: 'auto',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/apps/addon/addon_app.js.coffee:23',
      'src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30',
      'src/js/apps/pvr/channelList/channel_list_controller.js.coffee:34'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:broadcast-play:broadcast-play',
    kind: 'nav',
    family: 'broadcast-play',
    surface: 'broadcast:play',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:14'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:broadcast-record:broadcast-record',
    kind: 'nav',
    family: 'broadcast-record',
    surface: 'broadcast:record',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:16'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:broadcast-timer:broadcast-timer',
    kind: 'nav',
    family: 'broadcast-timer',
    surface: 'broadcast:timer',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:18'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-broadcast-play:childview-broadcast-play',
    kind: 'nav',
    family: 'childview-broadcast-play',
    surface: 'childview:broadcast:play',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:6'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-broadcast-record:childview-broadcast-record',
    kind: 'nav',
    family: 'childview-broadcast-record',
    surface: 'childview:broadcast:record',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:8'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-broadcast-timer:childview-broadcast-timer',
    kind: 'nav',
    family: 'childview-broadcast-timer',
    surface: 'childview:broadcast:timer',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:10'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-channel-play:childview-channel-play',
    kind: 'nav',
    family: 'childview-channel-play',
    surface: 'childview:channel:play',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/channelList/channel_list_controller.js.coffee:29'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-channel-record:childview-channel-record',
    kind: 'nav',
    family: 'childview-channel-record',
    surface: 'childview:channel:record',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/channelList/channel_list_controller.js.coffee:33'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-filter-add:childview-filter-add',
    kind: 'nav',
    family: 'childview-filter-add',
    surface: 'childview:filter:add',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:79'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-filter-filterable-select:childview-filter-filterable-select',
    kind: 'nav',
    family: 'childview-filter-filterable-select',
    surface: 'childview:filter:filterable:select',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:53'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-filter-option-remove:childview-filter-option-remove',
    kind: 'nav',
    family: 'childview-filter-option-remove',
    surface: 'childview:filter:option:remove',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:74'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-filter-option-select:childview-filter-option-select',
    kind: 'nav',
    family: 'childview-filter-option-select',
    surface: 'childview:filter:option:select',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:91'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-filter-sortable-select:childview-filter-sortable-select',
    kind: 'nav',
    family: 'childview-filter-sortable-select',
    surface: 'childview:filter:sortable:select',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:42'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:childview-recording-play:childview-recording-play',
    kind: 'nav',
    family: 'childview-recording-play',
    surface: 'childview:recording:play',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:29'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:desc:desc',
    kind: 'nav',
    family: 'desc',
    surface: 'desc',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:11'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:en:en',
    kind: 'nav',
    family: 'en',
    surface: 'en',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:23', 'src/js/apps/help/help_app.js.coffee:53'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:file:file',
    kind: 'nav',
    family: 'file',
    surface: 'file',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:31'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-layout-close-filters:filter-layout-close-filters',
    kind: 'nav',
    family: 'filter-layout-close-filters',
    surface: 'filter:layout:close:filters',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:17'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-layout-close-options:filter-layout-close-options',
    kind: 'nav',
    family: 'filter-layout-close-options',
    surface: 'filter:layout:close:options',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:19'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-layout-open-filters:filter-layout-open-filters',
    kind: 'nav',
    family: 'filter-layout-open-filters',
    surface: 'filter:layout:open:filters',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:21'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-layout-open-options:filter-layout-open-options',
    kind: 'nav',
    family: 'filter-layout-open-options',
    surface: 'filter:layout:open:options',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:23'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-option-deselectall:filter-option-deselectall',
    kind: 'nav',
    family: 'filter-option-deselectall',
    surface: 'filter:option:deselectall',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:97'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-remove-all:filter-remove-all',
    kind: 'nav',
    family: 'filter-remove-all',
    surface: 'filter:remove:all',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:121'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:general:general',
    kind: 'nav',
    family: 'general',
    surface: 'General',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:46'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-addons',
    kind: 'nav',
    family: 'help',
    surface: 'help/addons',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:41'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-app-changelog',
    kind: 'nav',
    family: 'help',
    surface: 'help/app-changelog',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:39'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-app-readme',
    kind: 'nav',
    family: 'help',
    surface: 'help/app-readme',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:38'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-developers',
    kind: 'nav',
    family: 'help',
    surface: 'help/developers',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:42'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-keybind-readme',
    kind: 'nav',
    family: 'help',
    surface: 'help/keybind-readme',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:40'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-lang-readme',
    kind: 'nav',
    family: 'help',
    surface: 'help/lang-readme',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:43'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-license',
    kind: 'nav',
    family: 'help',
    surface: 'help/license',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:44'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:landing-set-more:landing-set-more',
    kind: 'nav',
    family: 'landing-set-more',
    surface: 'landing:set:more',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/landing/show/landing_controller.js.coffee:60'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:movies:movies',
    kind: 'nav',
    family: 'movies',
    surface: 'movies',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:29'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:movies:movies-recent',
    kind: 'nav',
    family: 'movies',
    surface: 'movies/recent',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/entities/nav/navMain.js.coffee:27',
      'src/js/entities/nav/navMain.js.coffee:28'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:music:music-videos',
    kind: 'nav',
    family: 'music',
    surface: 'music/videos',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:24'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:play-list:play-list',
    kind: 'nav',
    family: 'play-list',
    surface: 'PlayList',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:33'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:play:play',
    kind: 'nav',
    family: 'play',
    surface: 'play',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/apps/epg/list/list_controller.js.coffee:15',
      'src/js/apps/epg/list/list_controller.js.coffee:7'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:player:player',
    kind: 'nav',
    family: 'player',
    surface: 'Player',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:playlists:playlists',
    kind: 'nav',
    family: 'playlists',
    surface: 'playlists',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:58'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:pvr:pvr',
    kind: 'nav',
    family: 'pvr',
    surface: 'PVR',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/epg/list/list_controller.js.coffee:53',
      'src/js/apps/pvr/channelList/channel_list_controller.js.coffee:34',
      'src/js/apps/pvr/channelList/channel_list_controller.js.coffee:40',
      'src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:38'
    ],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:record:record',
    kind: 'nav',
    family: 'record',
    surface: 'record',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/epg/list/list_controller.js.coffee:17',
      'src/js/apps/epg/list/list_controller.js.coffee:9'
    ],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:sections:sections',
    kind: 'nav',
    family: 'sections',
    surface: 'Sections',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/apps/category/list/list_controller.js.coffee:28',
      'src/js/apps/filter/show/show_controller.js.coffee:145',
      'src/js/apps/landing/show/landing_controller.js.coffee:29'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:settings:settings-addons',
    kind: 'nav',
    family: 'settings',
    surface: 'settings/addons',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/entities/nav/navMain.js.coffee:52',
      'src/js/entities/nav/navMain.js.coffee:64'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:settings:settings-nav',
    kind: 'nav',
    family: 'settings',
    surface: 'settings/nav',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/entities/nav/navMain.js.coffee:63'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:settings:settings-search',
    kind: 'nav',
    family: 'settings',
    surface: 'settings/search',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/entities/nav/navMain.js.coffee:65'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:settings:settings-web',
    kind: 'nav',
    family: 'settings',
    surface: 'settings/web',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/entities/nav/navMain.js.coffee:61',
      'src/js/entities/nav/navMain.js.coffee:62'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:show:show',
    kind: 'nav',
    family: 'show',
    surface: 'show',
    status: 'missing',
    owner: 'M006/S02',
    evidence: [
      'src/js/apps/addon/list/list_controller.js.coffee:13',
      'src/js/apps/category/list/list_controller.js.coffee:12',
      'src/js/apps/epg/list/list_controller.js.coffee:34',
      'src/js/apps/filter/show/show_controller.js.coffee:10',
      'src/js/apps/landing/show/landing_controller.js.coffee:12',
      'src/js/apps/landing/show/landing_controller.js.coffee:14',
      'src/js/apps/landing/show/landing_controller.js.coffee:58',
      'src/js/apps/pvr/channelList/channel_list_controller.js.coffee:15',
      'src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:15',
      'src/js/apps/settings/settings_app.js.coffee:38'
    ],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:thumbsup:thumbsup',
    kind: 'nav',
    family: 'thumbsup',
    surface: 'thumbsup',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:55'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:timer:timer',
    kind: 'nav',
    family: 'timer',
    surface: 'timer',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/epg/list/list_controller.js.coffee:11',
      'src/js/apps/epg/list/list_controller.js.coffee:19'
    ],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:tvshows:tvshows',
    kind: 'nav',
    family: 'tvshows',
    surface: 'tvshows',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:34'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:tvshows:tvshows-recent',
    kind: 'nav',
    family: 'tvshows',
    surface: 'tvshows/recent',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: [
      'src/js/entities/nav/navMain.js.coffee:32',
      'src/js/entities/nav/navMain.js.coffee:33'
    ],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:unknown:root',
    kind: 'nav',
    family: 'unknown',
    surface: '/',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/landing/show/landing_controller.js.coffee:82'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:url:url',
    kind: 'nav',
    family: 'url',
    surface: 'url(',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/landing/show/landing_controller.js.coffee:81'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:addons:settings-addons',
    kind: 'route',
    family: 'addons',
    surface: 'settings/addons',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:8'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:api-browser:lab-api-browser',
    kind: 'route',
    family: 'api-browser',
    surface: 'lab/api-browser',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:19'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:api-browser:lab-api-browser-method',
    kind: 'route',
    family: 'api-browser',
    surface: 'lab/api-browser/:method',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:20'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:episode:tvshow-tvshowid-season-episodeid',
    kind: 'route',
    family: 'episode',
    surface: 'tvshow/:tvshowid/:season/:episodeid',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:8'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:execute:addon-execute-id',
    kind: 'route',
    family: 'execute',
    surface: 'addon/execute/:id',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:filtered-page:music-genre-filter',
    kind: 'route',
    family: 'filtered-page',
    surface: 'music/genre/:filter',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:9'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:help-overview:help',
    kind: 'route',
    family: 'help-overview',
    surface: 'help',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:help-overview:help-overview',
    kind: 'route',
    family: 'help-overview',
    surface: 'help/overview',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:help-page:help-id',
    kind: 'route',
    family: 'help-page',
    surface: 'help/:id',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:7'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:home-page:home',
    kind: 'route',
    family: 'home-page',
    surface: 'home',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:home-page:root',
    kind: 'route',
    family: 'home-page',
    surface: '/',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:icon-browser:lab-icon-browser',
    kind: 'route',
    family: 'icon-browser',
    surface: 'lab/icon-browser',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:22'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:kodi:settings-kodi',
    kind: 'route',
    family: 'kodi',
    surface: 'settings/kodi',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:kodi:settings-kodi-section',
    kind: 'route',
    family: 'kodi',
    surface: 'settings/kodi/:section',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:7'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:lab-landing:lab',
    kind: 'route',
    family: 'lab-landing',
    surface: 'lab',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:18'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:movies-recent',
    kind: 'route',
    family: 'landing-page',
    surface: 'movies/recent',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:7'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:music',
    kind: 'route',
    family: 'landing-page',
    surface: 'music',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:music-top',
    kind: 'route',
    family: 'landing-page',
    surface: 'music/top',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:tvshows-recent',
    kind: 'route',
    family: 'landing-page',
    surface: 'tvshows/recent',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:8'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:addons-type',
    kind: 'route',
    family: 'list',
    surface: 'addons/:type',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:browser',
    kind: 'route',
    family: 'list',
    surface: 'browser',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/browser/browser_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:movies',
    kind: 'route',
    family: 'list',
    surface: 'movies',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:music-albums',
    kind: 'route',
    family: 'list',
    surface: 'music/albums',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:music-artists',
    kind: 'route',
    family: 'list',
    surface: 'music/artists',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:music-videos',
    kind: 'route',
    family: 'list',
    surface: 'music/videos',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:playlist',
    kind: 'route',
    family: 'list',
    surface: 'playlist',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/playlist_app.js.coffee:5'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:playlist-id',
    kind: 'route',
    family: 'list',
    surface: 'playlist/:id',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:6'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:playlists',
    kind: 'route',
    family: 'list',
    surface: 'playlists',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:5'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:search-media-query',
    kind: 'route',
    family: 'list',
    surface: 'search/:media/:query',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/search/search_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:thumbsup',
    kind: 'route',
    family: 'list',
    surface: 'thumbsup',
    status: 'deferred',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/thumbs/thumbs_app.js.coffee:5'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:tvshows',
    kind: 'route',
    family: 'list',
    surface: 'tvshows',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:local:settings-web',
    kind: 'route',
    family: 'local',
    surface: 'settings/web',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:music-genres:music-genres',
    kind: 'route',
    family: 'music-genres',
    surface: 'music/genres',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/category/category_app.js.coffee:7'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:nav-main:settings-nav',
    kind: 'route',
    family: 'nav-main',
    surface: 'settings/nav',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:9'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:radio:pvr-radio',
    kind: 'route',
    family: 'radio',
    surface: 'pvr/radio',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:6'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:radio:pvr-radio-channelid',
    kind: 'route',
    family: 'radio',
    surface: 'pvr/radio/:channelid',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/epg_app.js.coffee:6'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:recordings:pvr-recordings',
    kind: 'route',
    family: 'recordings',
    surface: 'pvr/recordings',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:7'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:remote-page:remote',
    kind: 'route',
    family: 'remote-page',
    surface: 'remote',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/input/input_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:screen-shot:lab-screenshot',
    kind: 'route',
    family: 'screen-shot',
    surface: 'lab/screenshot',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:21'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:search:settings-search',
    kind: 'route',
    family: 'search',
    surface: 'settings/search',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:10'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:season:tvshow-tvshowid-season',
    kind: 'route',
    family: 'season',
    surface: 'tvshow/:tvshowid/:season',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:7'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:tv:pvr-tv',
    kind: 'route',
    family: 'tv',
    surface: 'pvr/tv',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:5'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:tv:pvr-tv-channelid',
    kind: 'route',
    family: 'tv',
    surface: 'pvr/tv/:channelid',
    status: 'deferred',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/epg_app.js.coffee:5'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:browser-media-id',
    kind: 'route',
    family: 'view',
    surface: 'browser/:media/:id',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/browser/browser_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:movie-id',
    kind: 'route',
    family: 'view',
    surface: 'movie/:id',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:music-album-id',
    kind: 'route',
    family: 'view',
    surface: 'music/album/:id',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:music-artist-id',
    kind: 'route',
    family: 'view',
    surface: 'music/artist/:id',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:music-video-id',
    kind: 'route',
    family: 'view',
    surface: 'music/video/:id',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:search',
    kind: 'route',
    family: 'view',
    surface: 'search',
    status: 'missing',
    owner: 'M006/S02',
    evidence: ['src/js/apps/search/search_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:tvshow-tvshowid',
    kind: 'route',
    family: 'view',
    surface: 'tvshow/:tvshowid',
    status: 'deferred',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  })
] as const;
export const CHORUS2_PARITY_LEDGER = [
  ...ROUTE_ROWS,
  ...NAV_ROWS,
  ...CONTROL_ROWS,
  ...ACTION_ROWS,
  ...JSON_RPC_ROWS,
  ...SOURCE_SCANNED_BACKLOG_ROWS
].sort((left, right) => left.id.localeCompare(right.id)) as readonly Chorus2ParityRow[];

export function getChorus2ParityRowsByFamily(family: string): readonly Chorus2ParityRow[] {
  return sortedRows(CHORUS2_PARITY_LEDGER.filter((row) => row.family === family));
}

export function getChorus2ParityRowsByStatus(
  status: Chorus2ParityStatus
): readonly Chorus2ParityRow[] {
  return sortedRows(CHORUS2_PARITY_LEDGER.filter((row) => row.status === status));
}

export function getChorus2ParityRowById(id: string): Chorus2ParityRow | undefined {
  return CHORUS2_PARITY_LEDGER.find((row) => row.id === id);
}

function sortedRows(rows: readonly Chorus2ParityRow[]): readonly Chorus2ParityRow[] {
  return [...rows].sort((left, right) => left.id.localeCompare(right.id));
}
