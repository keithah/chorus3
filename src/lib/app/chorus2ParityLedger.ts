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
const APP_REMOTE_ROUTE_EVIDENCE = [
  'src/App.test.ts',
  'src/lib/app/appRouter.ts',
  'src/lib/app/appRouter.test.ts',
  'src/lib/components/RemoteInputPanel.svelte'
];
const REMOTE_INPUT_PANEL_EVIDENCE = [
  'src/App.test.ts',
  'src/lib/components/RemoteInputPanel.svelte',
  'src/lib/components/RemoteInputPanel.test.ts'
];
const REMOTE_INPUT_DISPATCH_EVIDENCE = [
  'src/lib/kodi/methods.ts',
  'src/lib/kodi/methods.test.ts',
  'src/lib/stores/remoteInputDispatch.svelte.ts',
  'src/lib/stores/remoteInputDispatch.test.ts'
];
const VIDEO_ROUTER_EVIDENCE = ['src/lib/video/videoRouter.ts'];
const CHORUS2_VIDEO_ALIAS_EVIDENCE = [
  'src/App.test.ts',
  'src/lib/app/appRouter.ts',
  'src/lib/app/appRouter.test.ts'
];
const CHORUS2_PRIMARY_NAV_EVIDENCE = [
  'src/lib/app-shell/appNavigation.ts',
  'src/lib/app-pages/AppPageSurface.svelte',
  'src/lib/app/primaryRoutes.ts'
];
const PARITY_PLACEHOLDER_ROUTE_EVIDENCE = [
  'src/App.test.ts',
  'src/main.test.ts',
  'src/lib/app/appRouter.ts',
  'src/lib/app/appRouter.test.ts'
];
const KODI_METHODS_EVIDENCE = ['src/lib/kodi/methods.ts'];
const SCANNER_EVIDENCE = ['src/lib/app/chorus2ParityLedger.ts'];

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
    status: 'implemented',
    owner: 'M006/S04',
    evidence: APP_ROUTER_EVIDENCE,
    notes: 'Chorus2 type-filter aliases route to the implemented AddonsPage filters.'
  }),
  row({
    id: 'route:addon:addon-execute-id',
    kind: 'route',
    family: 'addon',
    surface: 'addon/execute/:id',
    status: 'implemented',
    owner: 'M006/S04'
  }),
  row({
    id: 'route:album:albums',
    kind: 'route',
    family: 'album',
    surface: 'albums',
    status: 'implemented',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:artist:artists',
    kind: 'route',
    family: 'artist',
    surface: 'artists',
    status: 'implemented',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:browser:browser',
    kind: 'route',
    family: 'browser',
    surface: 'browser',
    status: 'implemented',
    owner: 'M006/S04'
  }),
  row({
    id: 'route:browser:files',
    kind: 'route',
    family: 'browser',
    surface: 'files',
    status: 'implemented',
    owner: 'M006/S04'
  }),
  row({
    id: 'route:category:category',
    kind: 'route',
    family: 'category',
    surface: 'category',
    status: 'implemented',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:epg:epg',
    kind: 'route',
    family: 'epg',
    surface: 'epg',
    status: 'implemented',
    owner: 'R056/M006/S04'
  }),
  row({
    id: 'route:help:help',
    kind: 'route',
    family: 'help',
    surface: 'help',
    status: 'implemented',
    owner: 'R057/M006/S04'
  }),
  row({
    id: 'route:input:remote',
    kind: 'route',
    family: 'input',
    surface: 'remote',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: APP_REMOTE_ROUTE_EVIDENCE,
    notes: 'Remote/Input route renders the bounded remote panel and is package-base aware.'
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
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R055/M006/S04'
  }),
  row({
    id: 'route:movie:movies',
    kind: 'route',
    family: 'movie',
    surface: 'movies',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 movies alias is promoted to the existing video movies route.'
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
    status: 'implemented',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'route:playlist:playlists',
    kind: 'route',
    family: 'playlist',
    surface: 'playlists',
    status: 'implemented',
    owner: 'R055/M006/S04'
  }),
  row({
    id: 'route:pvr:pvr',
    kind: 'route',
    family: 'pvr',
    surface: 'pvr',
    status: 'implemented',
    owner: 'R056/M006/S04'
  }),
  row({
    id: 'route:search:search',
    kind: 'route',
    family: 'search',
    surface: 'search',
    status: 'implemented',
    owner: 'R057/M006/S04'
  }),
  row({
    id: 'route:thumbs:thumbsup',
    kind: 'route',
    family: 'thumbs',
    surface: 'thumbsup',
    status: 'implemented',
    owner: 'R055/M006/S04'
  }),
  row({
    id: 'route:tvshow:tvshows',
    kind: 'route',
    family: 'tvshow',
    surface: 'tvshows',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 TV shows alias is promoted to the existing video TV route.'
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
  ['music', 'music', 'implemented', 'R054/M006/S04'],
  ['music', 'music/genres', 'implemented', 'R054/M006/S04'],
  ['music', 'music/top', 'implemented', 'R054/M006/S04'],
  ['music', 'music/artists', 'implemented', 'R054/M006/S04'],
  ['music', 'music/albums', 'implemented', 'R054/M006/S04'],
  ['musicvideo', 'music/videos', 'implemented', 'R054/M006/S04'],
  ['movie', 'movies/recent', 'implemented', 'M006/S04'],
  ['movie', 'movies', 'implemented', 'M006/S04'],
  ['tvshow', 'tvshows/recent', 'implemented', 'M006/S04'],
  ['tvshow', 'tvshows', 'implemented', 'M006/S04'],
  ['browser', 'browser', 'implemented', 'M006/S04'],
  ['pvr', 'pvr/tv', 'implemented', 'R056/M006/S04'],
  ['pvr', 'pvr/radio', 'implemented', 'R056/M006/S04'],
  ['pvr', 'pvr/recordings', 'implemented', 'R056/M006/S04'],
  ['addon', 'addons/all', 'implemented', 'M006/S04'],
  ['addon', 'addons/video', 'implemented', 'M006/S04'],
  ['addon', 'addons/audio', 'implemented', 'M006/S04'],
  ['addon', 'addons/executable', 'implemented', 'M006/S04'],
  ['settings', 'settings/*', 'implemented', 'M006/S01'],
  ['thumbs', 'thumbsup', 'implemented', 'R055/M006/S04'],
  ['playlist', 'playlists', 'implemented', 'R055/M006/S04'],
  ['help', 'help', 'implemented', 'R057/M006/S04']
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
    evidence:
      family === 'browser' && surface === 'browser'
        ? PARITY_PLACEHOLDER_ROUTE_EVIDENCE
        : status === 'implemented' && owner === 'M006/S04'
          ? CHORUS2_PRIMARY_NAV_EVIDENCE
          : SCANNER_EVIDENCE
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

const IMPLEMENTED_REMOTE_CONTROL_SURFACES = new Set<string>([
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
]);

const CONTROL_ROWS = CONTROL_SURFACES.map((surface) =>
  row({
    id: `control:remote:${surface}`,
    kind: 'control',
    family: 'remote',
    surface,
    status: IMPLEMENTED_REMOTE_CONTROL_SURFACES.has(surface) ? 'implemented' : 'missing',
    owner: 'M006/S03',
    evidence: IMPLEMENTED_REMOTE_CONTROL_SURFACES.has(surface)
      ? REMOTE_INPUT_PANEL_EVIDENCE
      : SCANNER_EVIDENCE,
    notes: IMPLEMENTED_REMOTE_CONTROL_SURFACES.has(surface)
      ? 'Bounded Remote/Input command rendered and tested on the real remote panel.'
      : undefined
  })
);

const ACTION_ROWS = [
  row({
    id: 'action:remote:input-remote-controls',
    kind: 'action',
    family: 'remote',
    surface: 'input remote controls',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: [
      'src/App.test.ts',
      'src/lib/components/RemoteInputPanel.svelte',
      'src/lib/stores/remoteInputDispatch.svelte.ts'
    ],
    notes: 'Remote/Input controls dispatch through the bounded command snapshot store.'
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
    status: 'implemented',
    owner: 'R056/M006/S04'
  }),
  row({
    id: 'action:library:library-write-commands',
    kind: 'action',
    family: 'library',
    surface: 'library write commands',
    status: 'implemented',
    owner: 'R054/M006/S04'
  }),
  row({
    id: 'action:system:power-commands',
    kind: 'action',
    family: 'system',
    surface: 'power commands',
    status: 'implemented',
    owner: 'D043/M006/S05',
    notes: 'Destructive power actions require an explicit guard before exposure.'
  })
] as const;

const IMPLEMENTED_REMOTE_INPUT_METHODS = new Set<string>([
  'Input.Left',
  'Input.Up',
  'Input.Right',
  'Input.Down',
  'Input.Back',
  'Input.Select',
  'Input.ContextMenu',
  'Input.Info',
  'Input.Home',
  'Input.SendText',
  'Input.ExecuteAction'
]);

const JSON_RPC_METHODS = [
  ['Input.Left', 'implemented', 'M006/S03'],
  ['Input.Up', 'implemented', 'M006/S03'],
  ['Input.Right', 'implemented', 'M006/S03'],
  ['Input.Down', 'implemented', 'M006/S03'],
  ['Input.Back', 'implemented', 'M006/S03'],
  ['Input.Select', 'implemented', 'M006/S03'],
  ['Input.ContextMenu', 'implemented', 'M006/S03'],
  ['Input.Info', 'implemented', 'M006/S03'],
  ['Input.Home', 'implemented', 'M006/S03'],
  ['Input.SendText', 'implemented', 'M006/S03'],
  ['Input.ExecuteAction', 'implemented', 'M006/S03'],
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
  ['Application.Quit', 'implemented', 'D043/M006/S05'],
  ['System.GetProperties', 'implemented', 'M006/S01'],
  ['System.Shutdown', 'implemented', 'D043/M006/S05'],
  ['System.Reboot', 'implemented', 'D043/M006/S05'],
  ['System.Suspend', 'implemented', 'D043/M006/S05'],
  ['System.Hibernate', 'implemented', 'D043/M006/S05'],
  ['Playlist.Insert', 'implemented', 'M006/S04'],
  ['Playlist.Remove', 'implemented', 'M006/S01'],
  ['Playlist.Clear', 'implemented', 'M006/S01'],
  ['Playlist.GetItems', 'implemented', 'M006/S01'],
  ['PVR.Record', 'implemented', 'R056/M006/S04'],
  ['PVR.ToggleTimer', 'implemented', 'R056/M006/S04'],
  ['PVR.AddTimer', 'implemented', 'R056/M006/S04'],
  ['PVR.DeleteTimer', 'implemented', 'R056/M006/S04'],
  ['Addons.ExecuteAddon', 'implemented', 'M006/S04'],
  ['Files.PrepareDownload', 'implemented', 'M006/S01'],
  ['AudioLibrary.SetAlbumDetails', 'implemented', 'R054/M006/S04'],
  ['AudioLibrary.SetArtistDetails', 'implemented', 'R054/M006/S04'],
  ['AudioLibrary.SetSongDetails', 'implemented', 'M006/S01'],
  ['AudioLibrary.Scan', 'implemented', 'R054/M006/S04'],
  ['AudioLibrary.Clean', 'implemented', 'R054/M006/S04'],
  ['VideoLibrary.SetEpisodeDetails', 'implemented', 'M006/S01'],
  ['VideoLibrary.SetMovieDetails', 'implemented', 'M006/S01'],
  ['VideoLibrary.SetTVShowDetails', 'implemented', 'M006/S04'],
  ['VideoLibrary.SetMusicVideoDetails', 'implemented', 'R054/M006/S04'],
  ['VideoLibrary.Scan', 'implemented', 'R054/M006/S04'],
  ['VideoLibrary.Clean', 'implemented', 'R054/M006/S04'],
  ['VideoLibrary.RefreshMovie', 'implemented', 'M006/S04'],
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
    evidence: IMPLEMENTED_REMOTE_INPUT_METHODS.has(surface)
      ? REMOTE_INPUT_DISPATCH_EVIDENCE
      : implemented
        ? KODI_METHODS_EVIDENCE
        : SCANNER_EVIDENCE,
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
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:76', 'src/lib/stores/addonsStore.svelte.ts'],
    notes:
      'AddonsStore exposes clone-safe enabled add-on snapshots for Chorus2 request-handler parity.'
  }),
  row({
    id: 'action:addon:addon-entities',
    kind: 'action',
    family: 'addon',
    surface: 'addon:entities',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: ['src/js/entities/kodi/addon.js.coffee:71', 'src/lib/stores/addonsStore.svelte.ts'],
    notes:
      'AddonsStore exposes all/type-filtered add-on entities and normalizes provider capabilities.'
  }),
  row({
    id: 'action:addon:addon-excluded-paths',
    kind: 'action',
    family: 'addon',
    surface: 'addon:excludedPaths',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: [
      'src/js/apps/addon/addon_app.js.coffee:80',
      'src/js/apps/addon/youtube/addon_youtube_app.js.coffee:27',
      'src/lib/stores/addonsStore.svelte.ts',
      'src/lib/stores/mediaFiles.svelte.ts'
    ],
    notes: 'YouTube plugin excluded breadcrumb paths are shared with the media file browser.'
  }),
  row({
    id: 'action:addon:addon-is-enabled',
    kind: 'action',
    family: 'addon',
    surface: 'addon:isEnabled',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:72', 'src/lib/stores/addonsStore.svelte.ts'],
    notes: 'AddonsStore mirrors the enabled add-on filter lookup used by Chorus2 request handlers.'
  }),
  row({
    id: 'action:addon:addon-pvr-enabled',
    kind: 'action',
    family: 'addon',
    surface: 'addon:pvr:enabled',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/addon/pvr/addons_pvr_ap.js.coffee:9'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:addon:addon-search-enabled',
    kind: 'action',
    family: 'addon',
    surface: 'addon:search:enabled',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:88', 'src/lib/stores/addonsStore.svelte.ts'],
    notes: 'Enabled add-ons now produce Chorus2-compatible provider search settings.'
  }),
  row({
    id: 'action:addon:addon-search-settings',
    kind: 'action',
    family: 'addon',
    surface: 'addon:search:settings:',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: [
      'src/js/apps/addon/googlemusic/addon_googlemusic_app.js.coffee:15',
      'src/js/apps/addon/mixcloud/addon_mixcloud_app.js.coffee:14',
      'src/js/apps/addon/radio/addon_radio_app.js.coffee:15',
      'src/js/apps/addon/soundcloud/addon_soundcloud_app.js.coffee:14',
      'src/js/apps/addon/youtube/addon_youtube_app.js.coffee:13',
      'src/lib/stores/addonsStore.svelte.ts'
    ],
    notes: 'Known Chorus2 provider search URL templates are exposed from the Add-ons store.'
  }),
  row({
    id: 'action:album:album-action',
    kind: 'action',
    family: 'album',
    surface: 'album:action',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:38'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-action-items',
    kind: 'action',
    family: 'album',
    surface: 'album:action:items',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:41'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-edit',
    kind: 'action',
    family: 'album',
    surface: 'album:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-entities',
    kind: 'action',
    family: 'album',
    surface: 'album:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:63'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-entity',
    kind: 'action',
    family: 'album',
    surface: 'album:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-fields',
    kind: 'action',
    family: 'album',
    surface: 'album:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:67'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:album:album-list-view',
    kind: 'action',
    family: 'album',
    surface: 'album:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/list/list_controller.js.coffee:75'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:albums:albums-withsongs-view',
    kind: 'action',
    family: 'albums',
    surface: 'albums:withsongs:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/show/show_controller.js.coffee:98'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-action',
    kind: 'action',
    family: 'artist',
    surface: 'artist:action',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:38'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-action-items',
    kind: 'action',
    family: 'artist',
    surface: 'artist:action:items',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:41'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-edit',
    kind: 'action',
    family: 'artist',
    surface: 'artist:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-entities',
    kind: 'action',
    family: 'artist',
    surface: 'artist:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:63'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-entity',
    kind: 'action',
    family: 'artist',
    surface: 'artist:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-fields',
    kind: 'action',
    family: 'artist',
    surface: 'artist:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:70'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:artist:artist-list-view',
    kind: 'action',
    family: 'artist',
    surface: 'artist:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/list/list_controller.js.coffee:75'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:body:body-state',
    kind: 'action',
    family: 'body',
    surface: 'body:state',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:142'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:broadcast:broadcast-action',
    kind: 'action',
    family: 'broadcast',
    surface: 'broadcast:action',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/epg_app.js.coffee:36'],
    notes: 'Broadcast timer actions are wired through the PVR page and typed JSON-RPC wrappers.'
  }),
  row({
    id: 'action:broadcast:broadcast-entities',
    kind: 'action',
    family: 'broadcast',
    surface: 'broadcast:entities',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/epg.js.coffee:65'],
    notes: 'PVR store loads broadcast collections for selected TV/radio channels.'
  }),
  row({
    id: 'action:broadcast:broadcast-entity',
    kind: 'action',
    family: 'broadcast',
    surface: 'broadcast:entity',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/epg.js.coffee:61'],
    notes: 'Selected channel broadcast rows are normalized for the PVR surface.'
  }),
  row({
    id: 'action:browser:browser-directory-view',
    kind: 'action',
    family: 'browser',
    surface: 'browser:directory:view',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/browser/list/list_controller.js.coffee:172'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:browser:browser-file-view',
    kind: 'action',
    family: 'browser',
    surface: 'browser:file:view',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/browser/list/list_controller.js.coffee:168'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:cast:cast-entities',
    kind: 'action',
    family: 'cast',
    surface: 'cast:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/cast.js.coffee:45'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:cast:cast-list-view',
    kind: 'action',
    family: 'cast',
    surface: 'cast:list:view',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/cast/cast_app.js.coffee:19'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:channel:channel-entities',
    kind: 'action',
    family: 'channel',
    surface: 'channel:entities',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:108'],
    notes:
      'PVR store normalizes channel collections and the PVR page renders Chorus2 child actions.'
  }),
  row({
    id: 'action:channel:channel-entity',
    kind: 'action',
    family: 'channel',
    surface: 'channel:entity',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:104'],
    notes: 'PVR store can load and replace single channel details with PVR.GetChannelDetails.'
  }),
  row({
    id: 'action:command:command-audio-add',
    kind: 'action',
    family: 'command',
    surface: 'command:audio:add',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:51'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-audio-play',
    kind: 'action',
    family: 'command',
    surface: 'command:audio:play',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-audio-clean',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:audio:clean',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:72'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-controller',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:controller',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:26'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-player',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:player',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:21'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-kodi-video-clean',
    kind: 'action',
    family: 'command',
    surface: 'command:kodi:video:clean',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-local-controller',
    kind: 'action',
    family: 'command',
    surface: 'command:local:controller',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:39'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-local-player',
    kind: 'action',
    family: 'command',
    surface: 'command:local:player',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:34'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:command:command-video-play',
    kind: 'action',
    family: 'command',
    surface: 'command:video:play',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/command_app.js.coffee:55'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-app-get',
    kind: 'action',
    family: 'config',
    surface: 'config:app:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:34'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-app-set',
    kind: 'action',
    family: 'config',
    surface: 'config:app:set',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:43'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-static-get',
    kind: 'action',
    family: 'config',
    surface: 'config:static:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:54'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:config:config-static-set',
    kind: 'action',
    family: 'config',
    surface: 'config:static:set',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/config/configApp.js.coffee:60'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-action',
    kind: 'action',
    family: 'episode',
    surface: 'episode:action',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:105'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-action-items',
    kind: 'action',
    family: 'episode',
    surface: 'episode:action:items',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:111'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-action-watched',
    kind: 'action',
    family: 'episode',
    surface: 'episode:action:watched',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:142'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-build-collection',
    kind: 'action',
    family: 'episode',
    surface: 'episode:build:collection',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:86'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-edit',
    kind: 'action',
    family: 'episode',
    surface: 'episode:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:152'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-entities',
    kind: 'action',
    family: 'episode',
    surface: 'episode:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:74'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-entity',
    kind: 'action',
    family: 'episode',
    surface: 'episode:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:70'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-fields',
    kind: 'action',
    family: 'episode',
    surface: 'episode:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:90'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-list-view',
    kind: 'action',
    family: 'episode',
    surface: 'episode:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/episode/episode_controller.js.coffee:101'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:episode:episode-tvshow-entities',
    kind: 'action',
    family: 'episode',
    surface: 'episode:tvshow:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:78'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:fanarttv:fanarttv-artist-image-entities',
    kind: 'action',
    family: 'fanarttv',
    surface: 'fanarttv:artist:image:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/fanarttv.js.coffee:75'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:file:file-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:249'],
    notes:
      'Browser file and folder entries resolve to validated playable/downloadable file entities.'
  }),
  row({
    id: 'action:file:file-entity',
    kind: 'action',
    family: 'file',
    surface: 'file:entity',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:240'],
    notes: 'Browser store resolves current safe file entities by id.'
  }),
  row({
    id: 'action:file:file-parsed-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:parsed:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:257'],
    notes: 'Browser store parses Files.GetDirectory records into safe file snapshots.'
  }),
  row({
    id: 'action:file:file-path-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:path:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:253'],
    notes: 'Direct encoded path routes open Kodi file directories.'
  }),
  row({
    id: 'action:file:file-source-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:source:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:261'],
    notes:
      'Browser store normalizes Files.GetSources plus enabled audio/video add-ons and playlist roots into media source snapshots.'
  }),
  row({
    id: 'action:file:file-source-media-entities',
    kind: 'action',
    family: 'file',
    surface: 'file:source:media:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:265'],
    notes:
      'Music and video file source stores load source-scoped directories, add-on roots, and playlist roots.'
  }),
  row({
    id: 'action:file:file-source-mediatypes',
    kind: 'action',
    family: 'file',
    surface: 'file:source:mediatypes',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:269'],
    notes: 'Music/video browser routes dispatch to distinct file source stores.'
  }),
  row({
    id: 'action:file:file-url-entity',
    kind: 'action',
    family: 'file',
    surface: 'file:url:entity',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:244'],
    notes:
      'Browser file urls resolve through Files.PrepareDownload and sanitized local stream urls.'
  }),
  row({
    id: 'action:filter:filter-active',
    kind: 'action',
    family: 'filter',
    surface: 'filter:active',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:410'],
    notes: 'LibraryFilterStore exposes active filter entities for the current route path.'
  }),
  row({
    id: 'action:filter:filter-active-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:active:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:69'],
    notes: 'LibraryFilterStore models FilterActive entity rows with key, values, and title.'
  }),
  row({
    id: 'action:filter:filter-apply-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:apply:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:414'],
    notes: 'LibraryFilterStore applies stored sort and active filters to library collections.'
  }),
  row({
    id: 'action:filter:filter-filterable-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:filterable:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:425'],
    notes:
      'LibraryFilterStore returns active-aware filterable fields constrained by route availability.'
  }),
  row({
    id: 'action:filter:filter-filters-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:filters:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:60'],
    notes: 'LibraryFilterStore models Chorus2 filter field entity collections.'
  }),
  row({
    id: 'action:filter:filter-filters-options-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:filters:options:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:63'],
    notes: 'LibraryFilterStore builds active option entities from collection values.'
  }),
  row({
    id: 'action:filter:filter-init',
    kind: 'action',
    family: 'filter',
    surface: 'filter:init',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:429'],
    notes: 'LibraryFilterStore initializes route sort and filter state from URL-style params.'
  }),
  row({
    id: 'action:filter:filter-options',
    kind: 'action',
    family: 'filter',
    surface: 'filter:options',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:399'],
    notes: 'LibraryFilterStore extracts and sorts filter option collections for the selected key.'
  }),
  row({
    id: 'action:filter:filter-show',
    kind: 'action',
    family: 'filter',
    surface: 'filter:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:391'],
    notes: 'LibraryPage renders the Chorus2 filter sidebar panes using the filter store.'
  }),
  row({
    id: 'action:filter:filter-sort-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sort:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/filter/filter.js.coffee:66'],
    notes: 'LibraryFilterStore models sortable entity rows with active state and toggled order.'
  }),
  row({
    id: 'action:filter:filter-sort-store-get',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sort:store:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:494'],
    notes: 'LibraryFilterStore returns stored route sort with Chorus2 default fallback.'
  }),
  row({
    id: 'action:filter:filter-sort-store-set',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sort:store:set',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:490'],
    notes: 'LibraryFilterStore persists route sort method/order in the Chorus2 namespace.'
  }),
  row({
    id: 'action:filter:filter-sortable-entities',
    kind: 'action',
    family: 'filter',
    surface: 'filter:sortable:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:421'],
    notes: 'LibraryFilterStore returns route-available sortable fields.'
  }),
  row({
    id: 'action:filter:filter-store-get',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:460'],
    notes: 'LibraryFilterStore returns non-empty route filter state from the Chorus2 namespace.'
  }),
  row({
    id: 'action:filter:filter-store-key-get',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:key:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:464'],
    notes: 'LibraryFilterStore returns stored values for a single route filter key.'
  }),
  row({
    id: 'action:filter:filter-store-key-toggle',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:key:toggle',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:473'],
    notes: 'LibraryFilterStore toggles individual filter option values like Chorus2.'
  }),
  row({
    id: 'action:filter:filter-store-key-update',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:key:update',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:468'],
    notes: 'LibraryFilterStore replaces stored values for a single route filter key.'
  }),
  row({
    id: 'action:filter:filter-store-set',
    kind: 'action',
    family: 'filter',
    surface: 'filter:store:set',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/filter/filter_app.js.coffee:455'],
    notes: 'LibraryFilterStore stores route filters under the Chorus2 filter namespace.'
  }),
  row({
    id: 'action:form:form-item-entities',
    kind: 'action',
    family: 'form',
    surface: 'form:item:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/form/form.js.coffee:82'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-popup-wrapper',
    kind: 'action',
    family: 'form',
    surface: 'form:popup:wrapper',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/components/form/form_controller.js.coffee:50'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-render-items',
    kind: 'action',
    family: 'form',
    surface: 'form:render:items',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/components/form/form_controller.js.coffee:41'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-value-entities',
    kind: 'action',
    family: 'form',
    surface: 'form:value:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/form/form.js.coffee:86'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:form:form-wrapper',
    kind: 'action',
    family: 'form',
    surface: 'form:wrapper',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/components/form/form_controller.js.coffee:46'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:genre:genre-entities',
    kind: 'action',
    family: 'genre',
    surface: 'genre:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/genres.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:genre:genre-entity',
    kind: 'action',
    family: 'genre',
    surface: 'genre:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/genres.js.coffee:54'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:help:help-page',
    kind: 'action',
    family: 'help',
    surface: 'help:page',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/help/help_app.js.coffee:52'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:help:help-subnav',
    kind: 'action',
    family: 'help',
    surface: 'help:subnav',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/help/help_app.js.coffee:48'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:images:images-fanart-set',
    kind: 'action',
    family: 'images',
    surface: 'images:fanart:set',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/images/images_app.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:images:images-path-entity',
    kind: 'action',
    family: 'images',
    surface: 'images:path:entity',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/images/images_app.js.coffee:68'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:images:images-path-get',
    kind: 'action',
    family: 'images',
    surface: 'images:path:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/images/images_app.js.coffee:63'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-action',
    kind: 'action',
    family: 'input',
    surface: 'input:action',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:144'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-remote-toggle',
    kind: 'action',
    family: 'input',
    surface: 'input:remote:toggle',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:141'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-resume',
    kind: 'action',
    family: 'input',
    surface: 'input:resume',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:147'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-send',
    kind: 'action',
    family: 'input',
    surface: 'input:send',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:138'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-textbox',
    kind: 'action',
    family: 'input',
    surface: 'input:textbox',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:130'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:input:input-textbox-close',
    kind: 'action',
    family: 'input',
    surface: 'input:textbox:close',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:135'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:introspect:introspect-dictionary',
    kind: 'action',
    family: 'introspect',
    surface: 'introspect:dictionary',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:89'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:introspect:introspect-entities',
    kind: 'action',
    family: 'introspect',
    surface: 'introspect:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:85'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:introspect:introspect-entity',
    kind: 'action',
    family: 'introspect',
    surface: 'introspect:entity',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:81'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:loading:loading-get-view',
    kind: 'action',
    family: 'loading',
    surface: 'loading:get:view',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/loading/loading_app.js.coffee:20'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:loading:loading-show-page',
    kind: 'action',
    family: 'loading',
    surface: 'loading:show:page',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/loading/loading_app.js.coffee:16'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:loading:loading-show-view',
    kind: 'action',
    family: 'loading',
    surface: 'loading:show:view',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/loading/loading_app.js.coffee:11'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplayer:localplayer-clear-entities',
    kind: 'action',
    family: 'localplayer',
    surface: 'localplayer:clear:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:206'],
    notes: 'Recording collections are loaded and rendered on the PVR recordings route.'
  }),
  row({
    id: 'action:localplayer:localplayer-get-entities',
    kind: 'action',
    family: 'localplayer',
    surface: 'localplayer:get:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:202'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplayer:localplayer-item-add-entities',
    kind: 'action',
    family: 'localplayer',
    surface: 'localplayer:item:add:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:210'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-add-entity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:add:entity',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:124'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-addentity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:addentity',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:101'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-clear-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:clear:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:138'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:134'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-entity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:entity',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-item-add-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:item:add:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:151'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-item-entities',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:item:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:147'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-item-updateorder',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:item:updateorder',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:156'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-newlist',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:newlist',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:104'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-reload',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:reload',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:107'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-remove-entity',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:remove:entity',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:128'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:localplaylist:localplaylist-rename',
    kind: 'action',
    family: 'localplaylist',
    surface: 'localplaylist:rename',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/localPlaylist/localPlaylist_app.js.coffee:110'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-action',
    kind: 'action',
    family: 'movie',
    surface: 'movie:action',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-action-items',
    kind: 'action',
    family: 'movie',
    surface: 'movie:action:items',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:41'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-action-watched',
    kind: 'action',
    family: 'movie',
    surface: 'movie:action:watched',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:50'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-build-collection',
    kind: 'action',
    family: 'movie',
    surface: 'movie:build:collection',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:72'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-edit',
    kind: 'action',
    family: 'movie',
    surface: 'movie:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/movie_app.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-entities',
    kind: 'action',
    family: 'movie',
    surface: 'movie:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:68'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-entity',
    kind: 'action',
    family: 'movie',
    surface: 'movie:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:64'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-fields',
    kind: 'action',
    family: 'movie',
    surface: 'movie:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:76'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:movie:movie-list-view',
    kind: 'action',
    family: 'movie',
    surface: 'movie:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/movie/list/list_controller.js.coffee:77'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicbrainz:musicbrainz-artist-entity',
    kind: 'action',
    family: 'musicbrainz',
    surface: 'musicbrainz:artist:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/musicbrainz.js.coffee:38'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-action',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:action',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:42'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-action-items',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:action:items',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-build-collection',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:build:collection',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:74'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-edit',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-entities',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:66'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-entity',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:62'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-fields',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:70'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:musicvideo:musicvideo-list-view',
    kind: 'action',
    family: 'musicvideo',
    surface: 'musicvideo:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/list/list_controller.js.coffee:76'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-array-entities',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:array:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:179'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-children-show',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:children:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/navMain/navMain_app.js.coffee:29'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-collection-show',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:collection:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/navMain/navMain_app.js.coffee:32'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-entities',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:171'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-update-defaults',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:update:defaults',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:190'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:nav-main:nav-main-update-entities',
    kind: 'action',
    family: 'nav-main',
    surface: 'navMain:update:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:186'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:notification:notification-show',
    kind: 'action',
    family: 'notification',
    surface: 'notification:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/notifications/notifications_app.js.coffee:7'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:player:player-kodi-progress-update',
    kind: 'action',
    family: 'player',
    surface: 'player:kodi:progress:update',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/player/player_app.js.coffee:176'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:player:player-kodi-timer',
    kind: 'action',
    family: 'player',
    surface: 'player:kodi:timer',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/player/player_app.js.coffee:163',
      'src/js/apps/state/kodi/kodi.js.coffee:30',
      'src/js/apps/state/kodi/kodi.js.coffee:59'
    ],
    notes: 'Recording rows resolve file playback through the shared file player dispatch.'
  }),
  row({
    id: 'action:player:player-local-progress-update',
    kind: 'action',
    family: 'player',
    surface: 'player:local:progress:update',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/player/player_app.js.coffee:172'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-export',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:export',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/playlist/playlist_app.js.coffee:35',
      'src/lib/app-pages/PlaylistsPage.svelte:142',
      'src/App.svelte:995'
    ],
    notes: 'Local playlists export as m3u downloads.'
  }),
  row({
    id: 'action:playlist:playlist-kodi-entities',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:kodi:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/kodi/playlist.js.coffee:92'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-kodi-entity-api',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:kodi:entity:api',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/kodi/playlist.js.coffee:102'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-list',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:list',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/playlist_app.js.coffee:31'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-local-partymode',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:local:partymode',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/localParty/local_party.js.coffee:60'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:playlist:playlist-refresh',
    kind: 'action',
    family: 'playlist',
    surface: 'playlist:refresh',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/playlist/playlist_app.js.coffee:49'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:recording:recording-entities',
    kind: 'action',
    family: 'recording',
    surface: 'recording:entities',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:117', 'src/lib/stores/pvr.svelte.ts'],
    notes: 'PVR store loads and sorts recording collections for the recordings route.'
  }),
  row({
    id: 'action:recording:recording-entity',
    kind: 'action',
    family: 'recording',
    surface: 'recording:entity',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:113', 'src/lib/stores/pvr.svelte.ts'],
    notes: 'PVR store exposes cached recording entities and can refresh a single recording detail.'
  }),
  row({
    id: 'action:search-addons:search-addons-entities',
    kind: 'action',
    family: 'search-addons',
    surface: 'searchAddons:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/search/searchAddons.js.coffee:41'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search-addons:search-addons-update-defaults',
    kind: 'action',
    family: 'search-addons',
    surface: 'searchAddons:update:defaults',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/search/searchAddons.js.coffee:49'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search-addons:search-addons-update-entities',
    kind: 'action',
    family: 'search-addons',
    surface: 'searchAddons:update:entities',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/search/searchAddons.js.coffee:45'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:search:search-go',
    kind: 'action',
    family: 'search',
    surface: 'search:go',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/search/search_app.js.coffee:51'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-entities',
    kind: 'action',
    family: 'season',
    surface: 'season:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:63'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-entity',
    kind: 'action',
    family: 'season',
    surface: 'season:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:59'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-fields',
    kind: 'action',
    family: 'season',
    surface: 'season:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:68'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:season:season-list-view',
    kind: 'action',
    family: 'season',
    surface: 'season:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/season/season_controller.js.coffee:82'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-action-add',
    kind: 'action',
    family: 'selected',
    surface: 'selected:action:add',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:103'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-action-localadd',
    kind: 'action',
    family: 'selected',
    surface: 'selected:action:localadd',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:110'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-action-play',
    kind: 'action',
    family: 'selected',
    surface: 'selected:action:play',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:96'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-clear-items',
    kind: 'action',
    family: 'selected',
    surface: 'selected:clear:items',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:88'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-get-items',
    kind: 'action',
    family: 'selected',
    surface: 'selected:get:items',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-get-media',
    kind: 'action',
    family: 'selected',
    surface: 'selected:get:media',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:80'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-set-media',
    kind: 'action',
    family: 'selected',
    surface: 'selected:set:media',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:92'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:selected:selected-update-items',
    kind: 'action',
    family: 'selected',
    surface: 'selected:update:items',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/selected/selected_app.js.coffee:84'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-kodi-entities',
    kind: 'action',
    family: 'settings',
    surface: 'settings:kodi:entities',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/entities/kodi/settings.js.coffee:132'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-kodi-filtered-entities',
    kind: 'action',
    family: 'settings',
    surface: 'settings:kodi:filtered:entities',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/entities/kodi/settings.js.coffee:136'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-kodi-save-entities',
    kind: 'action',
    family: 'settings',
    surface: 'settings:kodi:save:entities',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/entities/kodi/settings.js.coffee:141'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:settings:settings-subnav',
    kind: 'action',
    family: 'settings',
    surface: 'settings:subnav',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:56'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:shell:shell-disconnect',
    kind: 'action',
    family: 'shell',
    surface: 'shell:disconnect',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:158'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:shell:shell-reconnect',
    kind: 'action',
    family: 'shell',
    surface: 'shell:reconnect',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:147'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:shell:shell-view-ready',
    kind: 'action',
    family: 'shell',
    surface: 'shell:view:ready',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:129'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:sockets:sockets-active',
    kind: 'action',
    family: 'sockets',
    surface: 'sockets:active',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:55'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-albumparse-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:albumparse:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:161'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-build-collection',
    kind: 'action',
    family: 'song',
    surface: 'song:build:collection',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:153'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-byid-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:byid:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:157'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-custom-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:custom:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:149'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-edit',
    kind: 'action',
    family: 'song',
    surface: 'song:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/song/song_app.js.coffee:4'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-entities',
    kind: 'action',
    family: 'song',
    surface: 'song:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:145'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-entity',
    kind: 'action',
    family: 'song',
    surface: 'song:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:141'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-fields',
    kind: 'action',
    family: 'song',
    surface: 'song:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:165'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:song:song-list-view',
    kind: 'action',
    family: 'song',
    surface: 'song:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/song/list/list_controller.js.coffee:58'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-current',
    kind: 'action',
    family: 'state',
    surface: 'state:current',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:151'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-kodi',
    kind: 'action',
    family: 'state',
    surface: 'state:kodi',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:145'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-kodi-get',
    kind: 'action',
    family: 'state',
    surface: 'state:kodi:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/kodi.js.coffee:21'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-kodi-update',
    kind: 'action',
    family: 'state',
    surface: 'state:kodi:update',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/kodi.js.coffee:18'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-local',
    kind: 'action',
    family: 'state',
    surface: 'state:local',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:147'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-local-get',
    kind: 'action',
    family: 'state',
    surface: 'state:local:get',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/local/local.js.coffee:17'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-local-update',
    kind: 'action',
    family: 'state',
    surface: 'state:local:update',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/local/local.js.coffee:14'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:state:state-ws-init',
    kind: 'action',
    family: 'state',
    surface: 'state:ws:init',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/state_app.js.coffee:156'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:themoviedb:themoviedb-movie-image-entities',
    kind: 'action',
    family: 'themoviedb',
    surface: 'themoviedb:movie:image:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/themoviedb.js.coffee:95'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:themoviedb:themoviedb-tv-image-entities',
    kind: 'action',
    family: 'themoviedb',
    surface: 'themoviedb:tv:image:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/themoviedb.js.coffee:100'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:thumbsup:thumbsup-check',
    kind: 'action',
    family: 'thumbsup',
    surface: 'thumbsup:check',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:188'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:thumbsup:thumbsup-get-entities',
    kind: 'action',
    family: 'thumbsup',
    surface: 'thumbsup:get:entities',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:184'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:thumbsup:thumbsup-toggle-entity',
    kind: 'action',
    family: 'thumbsup',
    surface: 'thumbsup:toggle:entity',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/entities/localPlaylist/localPlaylist.js.coffee:173'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-action',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:action',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:108'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-action-items',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:action:items',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:126'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-action-watched',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:action:watched',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:132'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-edit',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:edit',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/tvshow_app.js.coffee:146'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-entities',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:65'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-entity',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:entity',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:61'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-fields',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:fields',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:69'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:tvshow:tvshow-list-view',
    kind: 'action',
    family: 'tvshow',
    surface: 'tvshow:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/tvshow/list/list_controller.js.coffee:78'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-dropdown-bind-close',
    kind: 'action',
    family: 'ui',
    surface: 'ui:dropdown:bind:close',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:146'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-close',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:close',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:107', 'src/js/apps/ui/ui_app.js.coffee:127'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-confirm',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:confirm',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:111'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-form-show',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:form:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:123'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-options',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:options',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:137'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-show',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:116'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-modal-youtube',
    kind: 'action',
    family: 'ui',
    surface: 'ui:modal:youtube',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:131'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-playermenu',
    kind: 'action',
    family: 'ui',
    surface: 'ui:playermenu',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:142'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:ui:ui-textinput-show',
    kind: 'action',
    family: 'ui',
    surface: 'ui:textinput:show',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/ui/ui_app.js.coffee:89'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:when:when-entity-fetched',
    kind: 'action',
    family: 'when',
    surface: 'when:entity:fetched',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/_base/_fetch.js.coffee:18'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-list-view',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:list:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/external/youtube/youtube_controller.js.coffee:37'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-search-entities',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:search:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/youtube.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-search-popup',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:search:popup',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/external/youtube/youtube_controller.js.coffee:31'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-search-view',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:search:view',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/external/youtube/youtube_controller.js.coffee:28'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'action:youtube:youtube-trailer-entities',
    kind: 'action',
    family: 'youtube',
    surface: 'youtube:trailer:entities',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/external/youtube.js.coffee:56'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:all',
    kind: 'control',
    family: 'remote',
    surface: 'all',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/helpers/entities.js.coffee:74'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'control:remote:context-menu',
    kind: 'control',
    family: 'remote',
    surface: 'ContextMenu',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: REMOTE_INPUT_PANEL_EVIDENCE,
    notes: 'Bounded Remote/Input context menu command rendered and tested on the real remote panel.'
  }),
  row({
    id: 'control:remote:google',
    kind: 'control',
    family: 'remote',
    surface: 'google',
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/settings/show/addons/addons_controller.js.coffee:3'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:addons:get-addons',
    kind: 'jsonrpc',
    family: 'addons',
    surface: 'Addons.GetAddons',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/command/kodi/helpers/addon.js.coffee:27',
      'src/js/apps/command/kodi/helpers/addon.js.coffee:6',
      'src/js/entities/kodi/file.js.coffee:62',
      'src/lib/kodi/methods.ts',
      'src/lib/stores/addonsStore.svelte.ts'
    ],
    notes: 'Typed Kodi wrapper is wired through the Add-ons store and AddonsPage filters.'
  }),
  row({
    id: 'jsonrpc:addons:set-addon-enabled',
    kind: 'jsonrpc',
    family: 'addons',
    surface: 'Addons.SetAddonEnabled',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: [
      'src/js/apps/settings/show/addons/addons_controller.js.coffee:82',
      'src/lib/kodi/methods.ts',
      'src/lib/stores/addonsStore.svelte.ts'
    ],
    notes: 'Typed Kodi wrapper is guarded by the Add-ons store confirmation flow.'
  }),
  row({
    id: 'jsonrpc:application:on-volume-changed',
    kind: 'jsonrpc',
    family: 'application',
    surface: 'Application.OnVolumeChanged',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:151'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:clean',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.Clean',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:33'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-albums',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetAlbums',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/album.js.coffee:46'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-artist-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetArtistDetails',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:33'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-artists',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetArtists',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/artist.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-genres',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetGenres',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/genres.js.coffee:40'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-song-details',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetSongDetails',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/song.js.coffee:111', 'src/js/entities/kodi/song.js.coffee:85'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:get-songs',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.GetSongs',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:181'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-clean-started',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnCleanStarted',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:177'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-scan-finished',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnScanFinished',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:170'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-scan-started',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnScanStarted',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:166'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:on-update',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.OnUpdate',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:193'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:audio-library:scan',
    kind: 'jsonrpc',
    family: 'audio-library',
    surface: 'AudioLibrary.Scan',
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S04',
    evidence: [
      'src/js/entities/kodi/file.js.coffee:194',
      'src/lib/kodi/methods.ts',
      'src/lib/stores/mediaFiles.svelte.ts'
    ],
    notes: 'Typed Kodi wrapper is wired through the Browser files page and playlist browsing.'
  }),
  row({
    id: 'jsonrpc:files:get-file-details',
    kind: 'jsonrpc',
    family: 'files',
    surface: 'Files.GetFileDetails',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/file.js.coffee:184', 'src/lib/kodi/methods.ts'],
    notes: 'Typed Kodi wrapper is available for browser file detail parity.'
  }),
  row({
    id: 'jsonrpc:files:get-sources',
    kind: 'jsonrpc',
    family: 'files',
    surface: 'Files.GetSources',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: [
      'src/js/entities/kodi/file.js.coffee:60',
      'src/lib/kodi/methods.ts',
      'src/lib/stores/mediaFiles.svelte.ts'
    ],
    notes: 'Typed Kodi wrapper is wired through the Browser files source list.'
  }),
  row({
    id: 'jsonrpc:gui:window',
    kind: 'jsonrpc',
    family: 'gui',
    surface: 'GUI.Window',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/command/kodi/helpers/gui.coffee:12'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:action',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.Action',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/input/input_app.js.coffee:24'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:all',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.all',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:google',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.google',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:imdb',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.imdb',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:on-input-finished',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.OnInputFinished',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:215'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:on-input-requested',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.OnInputRequested',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:197'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:soundcloud',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.soundcloud',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:stop',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.Stop',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:tmdb',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.tmdb',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:input:tvdb',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.tvdb',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: ['src/js/apps/command/kodi/helpers/input.js.coffee:7'],
    notes: 'Remote/Input parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:get-active-players',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.GetActivePlayers',
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/lab/apiBrowser.js.coffee:66'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:jsonrpc:ping',
    kind: 'jsonrpc',
    family: 'jsonrpc',
    surface: 'JSONRPC.Ping',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/helpers/connection.js.coffee:28'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-pause',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnPause',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:129'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-play',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnPlay',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:105'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-property-changed',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnPropertyChanged',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:125'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-resume',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnResume',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:112'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-seek',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnSeek',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:136'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:player:on-stop',
    kind: 'jsonrpc',
    family: 'player',
    surface: 'Player.OnStop',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:119'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:playlist:on-add',
    kind: 'jsonrpc',
    family: 'playlist',
    surface: 'Playlist.OnAdd',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:playlist:on-clear',
    kind: 'jsonrpc',
    family: 'playlist',
    surface: 'Playlist.OnClear',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:playlist:on-remove',
    kind: 'jsonrpc',
    family: 'playlist',
    surface: 'Playlist.OnRemove',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:142'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:channel-list',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.ChannelList',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:12', 'src/js/apps/pvr/pvr_app.js.coffee:16'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-broadcasts',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetBroadcasts',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/epg.js.coffee:38', 'src/js/entities/kodi/epg.js.coffee:48'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-channel-details',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetChannelDetails',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:59'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-channels',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetChannels',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:69'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-recording-details',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetRecordingDetails',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:82'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:get-recordings',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.GetRecordings',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/entities/kodi/pvr.js.coffee:91'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:recording-list',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.RecordingList',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:20'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:pvr:router',
    kind: 'jsonrpc',
    family: 'pvr',
    surface: 'PVR.Router',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/pvr_app.js.coffee:24', 'src/js/apps/pvr/pvr_app.js.coffee:3'],
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:get-categories',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.GetCategories',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:109'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:get-sections',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.GetSections',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:101'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:settings:get-settings',
    kind: 'jsonrpc',
    family: 'settings',
    surface: 'Settings.GetSettings',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/kodi/settings.js.coffee:76'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:system:on-quit',
    kind: 'jsonrpc',
    family: 'system',
    surface: 'System.OnQuit',
    status: 'implemented',
    owner: 'D043/M006/S05',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:220'],
    notes: 'Guarded destructive method; do not expose without confirmation.'
  }),
  row({
    id: 'jsonrpc:system:on-restart',
    kind: 'jsonrpc',
    family: 'system',
    surface: 'System.OnRestart',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:225'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:system:on-wake',
    kind: 'jsonrpc',
    family: 'system',
    surface: 'System.OnWake',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:225'],
    notes: 'Command/action parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:clean',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.Clean',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:39'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-episodes',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetEpisodes',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/episode.js.coffee:50'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-movie-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMovieDetails',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/movie.js.coffee:36'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-movies',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMovies',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:33'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-music-videos',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetMusicVideos',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/musicvideo.js.coffee:44'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-seasons',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetSeasons',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/season.js.coffee:45'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-tvshow-details',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetTVShowDetails',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:36'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:get-tvshows',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.GetTVShows',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/kodi/tvshow.js.coffee:47'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-clean-finished',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnCleanFinished',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:189'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-clean-started',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnCleanStarted',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:185'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-scan-finished',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnScanFinished',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:159'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-scan-started',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnScanStarted',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:155'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:on-update',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.OnUpdate',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/state/kodi/notifications.js.coffee:193'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'jsonrpc:video-library:refresh-episode',
    kind: 'jsonrpc',
    family: 'video-library',
    surface: 'VideoLibrary.RefreshEpisode',
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:23'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:add-ons-search-settings:add-ons-search-settings',
    kind: 'nav',
    family: 'add-ons-search-settings',
    surface: 'addOnsSearchSettings',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: [
      'src/js/apps/addon/addon_app.js.coffee:38',
      'src/js/apps/addon/addon_app.js.coffee:89',
      'src/lib/stores/addonsStore.svelte.ts'
    ],
    notes: 'Add-ons store rebuilds the enabled provider search-settings cache used by Chorus2.'
  }),
  row({
    id: 'nav:add-ons:add-ons',
    kind: 'nav',
    family: 'add-ons',
    surface: 'Add-ons',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/list/list_controller.js.coffee:31'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-all',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/all',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:49'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-executable',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/executable',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:51'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:addons:addons-video',
    kind: 'nav',
    family: 'addons',
    surface: 'addons/video',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:48'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:auto:auto',
    kind: 'nav',
    family: 'auto',
    surface: 'auto',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:14'],
    notes: 'Selected broadcast play dispatches channel playback like Chorus2.'
  }),
  row({
    id: 'nav:broadcast-record:broadcast-record',
    kind: 'nav',
    family: 'broadcast-record',
    surface: 'broadcast:record',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:16'],
    notes: 'Selected broadcast record dispatches the channel recording toggle.'
  }),
  row({
    id: 'nav:broadcast-timer:broadcast-timer',
    kind: 'nav',
    family: 'broadcast-timer',
    surface: 'broadcast:timer',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:18'],
    notes: 'Selected broadcast timer dispatches PVR.ToggleTimer.'
  }),
  row({
    id: 'nav:childview-broadcast-play:childview-broadcast-play',
    kind: 'nav',
    family: 'childview-broadcast-play',
    surface: 'childview:broadcast:play',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:6'],
    notes: 'Broadcast rows expose Chorus2 play actions.'
  }),
  row({
    id: 'nav:childview-broadcast-record:childview-broadcast-record',
    kind: 'nav',
    family: 'childview-broadcast-record',
    surface: 'childview:broadcast:record',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:8'],
    notes: 'Broadcast rows expose Chorus2 record actions.'
  }),
  row({
    id: 'nav:childview-broadcast-timer:childview-broadcast-timer',
    kind: 'nav',
    family: 'childview-broadcast-timer',
    surface: 'childview:broadcast:timer',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/epg/list/list_controller.js.coffee:10'],
    notes: 'Broadcast rows expose Chorus2 timer actions.'
  }),
  row({
    id: 'nav:childview-channel-play:childview-channel-play',
    kind: 'nav',
    family: 'childview-channel-play',
    surface: 'childview:channel:play',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/channelList/channel_list_controller.js.coffee:29'],
    notes: 'Channel rows expose Chorus2 play actions.'
  }),
  row({
    id: 'nav:childview-channel-record:childview-channel-record',
    kind: 'nav',
    family: 'childview-channel-record',
    surface: 'childview:channel:record',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/channelList/channel_list_controller.js.coffee:33'],
    notes: 'Channel rows expose Chorus2 record actions.'
  }),
  row({
    id: 'nav:childview-filter-add:childview-filter-add',
    kind: 'nav',
    family: 'childview-filter-add',
    surface: 'childview:filter:add',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:79'],
    notes: 'LibraryPage active filter empty state opens the filter selection pane.'
  }),
  row({
    id: 'nav:childview-filter-filterable-select:childview-filter-filterable-select',
    kind: 'nav',
    family: 'childview-filter-filterable-select',
    surface: 'childview:filter:filterable:select',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:53'],
    notes:
      'LibraryPage selects boolean filters immediately and opens option panes for other filters.'
  }),
  row({
    id: 'nav:childview-filter-option-remove:childview-filter-option-remove',
    kind: 'nav',
    family: 'childview-filter-option-remove',
    surface: 'childview:filter:option:remove',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:74'],
    notes: 'LibraryPage active filter chips clear a stored filter key.'
  }),
  row({
    id: 'nav:childview-filter-option-select:childview-filter-option-select',
    kind: 'nav',
    family: 'childview-filter-option-select',
    surface: 'childview:filter:option:select',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:91'],
    notes: 'LibraryPage option rows toggle stored option values without closing the pane.'
  }),
  row({
    id: 'nav:childview-filter-sortable-select:childview-filter-sortable-select',
    kind: 'nav',
    family: 'childview-filter-sortable-select',
    surface: 'childview:filter:sortable:select',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:42'],
    notes: 'LibraryPage sort rows persist the next Chorus2 sort order.'
  }),
  row({
    id: 'nav:childview-recording-play:childview-recording-play',
    kind: 'nav',
    family: 'childview-recording-play',
    surface: 'childview:recording:play',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:29'],
    notes: 'Recording rows expose Chorus2 play actions.'
  }),
  row({
    id: 'nav:desc:desc',
    kind: 'nav',
    family: 'desc',
    surface: 'desc',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:11'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:en:en',
    kind: 'nav',
    family: 'en',
    surface: 'en',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:23', 'src/js/apps/help/help_app.js.coffee:53'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:file:file',
    kind: 'nav',
    family: 'file',
    surface: 'file',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:31'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:filter-layout-close-filters:filter-layout-close-filters',
    kind: 'nav',
    family: 'filter-layout-close-filters',
    surface: 'filter:layout:close:filters',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:17'],
    notes: 'LibraryPage filter pane title returns to the current filter/sort pane.'
  }),
  row({
    id: 'nav:filter-layout-close-options:filter-layout-close-options',
    kind: 'nav',
    family: 'filter-layout-close-options',
    surface: 'filter:layout:close:options',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:19'],
    notes: 'LibraryPage options pane title returns to filter selection.'
  }),
  row({
    id: 'nav:filter-layout-open-filters:filter-layout-open-filters',
    kind: 'nav',
    family: 'filter-layout-open-filters',
    surface: 'filter:layout:open:filters',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:21'],
    notes: 'LibraryPage Filters/Add filter controls slide open the filter selection pane.'
  }),
  row({
    id: 'nav:filter-layout-open-options:filter-layout-open-options',
    kind: 'nav',
    family: 'filter-layout-open-options',
    surface: 'filter:layout:open:options',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:23'],
    notes: 'LibraryPage non-boolean filter selection opens the options pane.'
  }),
  row({
    id: 'nav:filter-option-deselectall:filter-option-deselectall',
    kind: 'nav',
    family: 'filter-option-deselectall',
    surface: 'filter:option:deselectall',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:97'],
    notes: 'LibraryPage options pane clears the selected filter key via Deselect all.'
  }),
  row({
    id: 'nav:filter-remove-all:filter-remove-all',
    kind: 'nav',
    family: 'filter-remove-all',
    surface: 'filter:remove:all',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/filter/show/show_controller.js.coffee:121'],
    notes: 'LibraryPage active filter bar removes all stored filters for the route.'
  }),
  row({
    id: 'nav:general:general',
    kind: 'nav',
    family: 'general',
    surface: 'General',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:46'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-addons',
    kind: 'nav',
    family: 'help',
    surface: 'help/addons',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:41'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-app-changelog',
    kind: 'nav',
    family: 'help',
    surface: 'help/app-changelog',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:39'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-app-readme',
    kind: 'nav',
    family: 'help',
    surface: 'help/app-readme',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:38'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-developers',
    kind: 'nav',
    family: 'help',
    surface: 'help/developers',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:42'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-keybind-readme',
    kind: 'nav',
    family: 'help',
    surface: 'help/keybind-readme',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:40'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-lang-readme',
    kind: 'nav',
    family: 'help',
    surface: 'help/lang-readme',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:43'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:help:help-license',
    kind: 'nav',
    family: 'help',
    surface: 'help/license',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:44'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:landing-set-more:landing-set-more',
    kind: 'nav',
    family: 'landing-set-more',
    surface: 'landing:set:more',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/landing/show/landing_controller.js.coffee:60'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:movies:movies',
    kind: 'nav',
    family: 'movies',
    surface: 'movies',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 movies nav alias is promoted to the existing video movies route.'
  }),
  row({
    id: 'nav:movies:movies-recent',
    kind: 'nav',
    family: 'movies',
    surface: 'movies/recent',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 recent movies nav alias is promoted to the existing video movies route.'
  }),
  row({
    id: 'nav:music:music-videos',
    kind: 'nav',
    family: 'music',
    surface: 'music/videos',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/entities/nav/navMain.js.coffee:24'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:play-list:play-list',
    kind: 'nav',
    family: 'play-list',
    surface: 'PlayList',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: ['src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:33'],
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:play:play',
    kind: 'nav',
    family: 'play',
    surface: 'play',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:playlists:playlists',
    kind: 'nav',
    family: 'playlists',
    surface: 'playlists',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:pvr:pvr',
    kind: 'nav',
    family: 'pvr',
    surface: 'PVR',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'PVR main navigation routes to the Chorus2-style TV channel surface.'
  }),
  row({
    id: 'nav:record:record',
    kind: 'nav',
    family: 'record',
    surface: 'record',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/epg/list/list_controller.js.coffee:17',
      'src/js/apps/epg/list/list_controller.js.coffee:9'
    ],
    notes: 'PVR channel and broadcast record actions are exposed.'
  }),
  row({
    id: 'nav:sections:sections',
    kind: 'nav',
    family: 'sections',
    surface: 'Sections',
    status: 'implemented',
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
    status: 'implemented',
    owner: 'M006/S01',
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
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/entities/nav/navMain.js.coffee:63'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:settings:settings-search',
    kind: 'nav',
    family: 'settings',
    surface: 'settings/search',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/entities/nav/navMain.js.coffee:65'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:settings:settings-web',
    kind: 'nav',
    family: 'settings',
    surface: 'settings/web',
    status: 'implemented',
    owner: 'M006/S01',
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
    status: 'implemented',
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
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:timer:timer',
    kind: 'nav',
    family: 'timer',
    surface: 'timer',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: [
      'src/js/apps/epg/list/list_controller.js.coffee:11',
      'src/js/apps/epg/list/list_controller.js.coffee:19'
    ],
    notes: 'Broadcast timer actions are exposed through the selected channel EPG list.'
  }),
  row({
    id: 'nav:tvshows:tvshows',
    kind: 'nav',
    family: 'tvshows',
    surface: 'tvshows',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 TV shows nav alias is promoted to the existing video TV route.'
  }),
  row({
    id: 'nav:tvshows:tvshows-recent',
    kind: 'nav',
    family: 'tvshows',
    surface: 'tvshows/recent',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 recent TV nav alias is promoted to the existing video TV route.'
  }),
  row({
    id: 'nav:unknown:root',
    kind: 'nav',
    family: 'unknown',
    surface: '/',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/landing/show/landing_controller.js.coffee:82'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'nav:url:url',
    kind: 'nav',
    family: 'url',
    surface: 'url(',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/landing/show/landing_controller.js.coffee:81'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:addons:settings-addons',
    kind: 'route',
    family: 'addons',
    surface: 'settings/addons',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:8'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:api-browser:lab-api-browser',
    kind: 'route',
    family: 'api-browser',
    surface: 'lab/api-browser',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:19'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:api-browser:lab-api-browser-method',
    kind: 'route',
    family: 'api-browser',
    surface: 'lab/api-browser/:method',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:20'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:episode:tvshow-tvshowid-season-episodeid',
    kind: 'route',
    family: 'episode',
    surface: 'tvshow/:tvshowid/:season/:episodeid',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 episode route is promoted to the existing video episode route.'
  }),
  row({
    id: 'route:execute:addon-execute-id',
    kind: 'route',
    family: 'execute',
    surface: 'addon/execute/:id',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:filtered-page:music-genre-filter',
    kind: 'route',
    family: 'filtered-page',
    surface: 'music/genre/:filter',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:9'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:help-overview:help',
    kind: 'route',
    family: 'help-overview',
    surface: 'help',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:help-overview:help-overview',
    kind: 'route',
    family: 'help-overview',
    surface: 'help/overview',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:help-page:help-id',
    kind: 'route',
    family: 'help-page',
    surface: 'help/:id',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/help/help_app.js.coffee:7'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:home-page:home',
    kind: 'route',
    family: 'home-page',
    surface: 'home',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:home-page:root',
    kind: 'route',
    family: 'home-page',
    surface: '/',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/shell/shell_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:icon-browser:lab-icon-browser',
    kind: 'route',
    family: 'icon-browser',
    surface: 'lab/icon-browser',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:22'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:kodi:settings-kodi',
    kind: 'route',
    family: 'kodi',
    surface: 'settings/kodi',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:kodi:settings-kodi-section',
    kind: 'route',
    family: 'kodi',
    surface: 'settings/kodi/:section',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:7'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:lab-landing:lab',
    kind: 'route',
    family: 'lab-landing',
    surface: 'lab',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:18'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:movies-recent',
    kind: 'route',
    family: 'landing-page',
    surface: 'movies/recent',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 recent movies landing alias is promoted to the existing video movies route.'
  }),
  row({
    id: 'route:landing-page:music',
    kind: 'route',
    family: 'landing-page',
    surface: 'music',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:music-top',
    kind: 'route',
    family: 'landing-page',
    surface: 'music/top',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/landing/landing_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:landing-page:tvshows-recent',
    kind: 'route',
    family: 'landing-page',
    surface: 'tvshows/recent',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 recent TV landing alias is promoted to the existing video TV route.'
  }),
  row({
    id: 'route:list:addons-type',
    kind: 'route',
    family: 'list',
    surface: 'addons/:type',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/addon/addon_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:browser',
    kind: 'route',
    family: 'list',
    surface: 'browser',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: ['src/js/apps/browser/browser_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:movies',
    kind: 'route',
    family: 'list',
    surface: 'movies',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 movie list route is promoted to the existing video movies route.'
  }),
  row({
    id: 'route:list:music-albums',
    kind: 'route',
    family: 'list',
    surface: 'music/albums',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:music-artists',
    kind: 'route',
    family: 'list',
    surface: 'music/artists',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:5'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:music-videos',
    kind: 'route',
    family: 'list',
    surface: 'music/videos',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:playlist',
    kind: 'route',
    family: 'list',
    surface: 'playlist',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:playlist-id',
    kind: 'route',
    family: 'list',
    surface: 'playlist/:id',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:playlists',
    kind: 'route',
    family: 'list',
    surface: 'playlists',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:search-media-query',
    kind: 'route',
    family: 'list',
    surface: 'search/:media/:query',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: ['src/js/apps/search/search_app.js.coffee:6'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:thumbsup',
    kind: 'route',
    family: 'list',
    surface: 'thumbsup',
    status: 'implemented',
    owner: 'R055/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Playlist/local-player parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:list:tvshows',
    kind: 'route',
    family: 'list',
    surface: 'tvshows',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 TV list route is promoted to the existing video TV route.'
  }),
  row({
    id: 'route:local:settings-web',
    kind: 'route',
    family: 'local',
    surface: 'settings/web',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:music-genres:music-genres',
    kind: 'route',
    family: 'music-genres',
    surface: 'music/genres',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/category/category_app.js.coffee:7'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:nav-main:settings-nav',
    kind: 'route',
    family: 'nav-main',
    surface: 'settings/nav',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:9'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:radio:pvr-radio',
    kind: 'route',
    family: 'radio',
    surface: 'pvr/radio',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:radio:pvr-radio-channelid',
    kind: 'route',
    family: 'radio',
    surface: 'pvr/radio/:channelid',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:recordings:pvr-recordings',
    kind: 'route',
    family: 'recordings',
    surface: 'pvr/recordings',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:remote-page:remote',
    kind: 'route',
    family: 'remote-page',
    surface: 'remote',
    status: 'implemented',
    owner: 'M006/S03',
    evidence: APP_REMOTE_ROUTE_EVIDENCE,
    notes: 'Chorus2 remote page alias is now the bounded Remote/Input route.'
  }),
  row({
    id: 'route:screen-shot:lab-screenshot',
    kind: 'route',
    family: 'screen-shot',
    surface: 'lab/screenshot',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: ['src/js/apps/lab/lab_app.js.coffee:21'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:search:settings-search',
    kind: 'route',
    family: 'search',
    surface: 'settings/search',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/js/apps/settings/settings_app.js.coffee:10'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:season:tvshow-tvshowid-season',
    kind: 'route',
    family: 'season',
    surface: 'tvshow/:tvshowid/:season',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 TV season route is promoted to the existing video season route.'
  }),
  row({
    id: 'route:tv:pvr-tv',
    kind: 'route',
    family: 'tv',
    surface: 'pvr/tv',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:tv:pvr-tv-channelid',
    kind: 'route',
    family: 'tv',
    surface: 'pvr/tv/:channelid',
    status: 'implemented',
    owner: 'R056/M006/S04',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'PVR parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:browser-media-id',
    kind: 'route',
    family: 'view',
    surface: 'browser/:media/:id',
    status: 'implemented',
    owner: 'M006/S02',
    evidence: PARITY_PLACEHOLDER_ROUTE_EVIDENCE,
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:movie-id',
    kind: 'route',
    family: 'view',
    surface: 'movie/:id',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 movie detail route is promoted to the existing video movie detail route.'
  }),
  row({
    id: 'route:view:music-album-id',
    kind: 'route',
    family: 'view',
    surface: 'music/album/:id',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/album/album_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:music-artist-id',
    kind: 'route',
    family: 'view',
    surface: 'music/artist/:id',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/artist/artist_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:music-video-id',
    kind: 'route',
    family: 'view',
    surface: 'music/video/:id',
    status: 'implemented',
    owner: 'R054/M006/S04',
    evidence: ['src/js/apps/musicvideo/musicvideo_app.js.coffee:6'],
    notes: 'Media parity backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:search',
    kind: 'route',
    family: 'view',
    surface: 'search',
    status: 'implemented',
    owner: 'R057/M006/S04',
    evidence: ['src/js/apps/search/search_app.js.coffee:5'],
    notes: 'Route/menu alias backlog from Chorus2 source scan.'
  }),
  row({
    id: 'route:view:tvshow-tvshowid',
    kind: 'route',
    family: 'view',
    surface: 'tvshow/:tvshowid',
    status: 'implemented',
    owner: 'M006/S04',
    evidence: CHORUS2_VIDEO_ALIAS_EVIDENCE,
    notes: 'Chorus2 TV show detail route is promoted to the existing video TV show detail route.'
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
