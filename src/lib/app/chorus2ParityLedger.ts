export const CHORUS2_PARITY_KIND_VALUES = [
  'route',
  'nav',
  'control',
  'action',
  'jsonrpc'
] as const;

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
    id: `nav:${family}:${surface.replace('*', 'wildcard').replace(/[^A-Za-z0-9]+/gu, '-')}`.toLowerCase().replace(/-$/u, ''),
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
    notes: owner.startsWith('D043') ? 'Guarded destructive method; do not expose without confirmation.' : undefined
  });
});

export const CHORUS2_PARITY_LEDGER = [
  ...ROUTE_ROWS,
  ...NAV_ROWS,
  ...CONTROL_ROWS,
  ...ACTION_ROWS,
  ...JSON_RPC_ROWS
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
