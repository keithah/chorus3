import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import { HELP_TOPICS, normalizeHelpTopicId } from './helpTopics';

export type AppPageStatus = 'implemented' | 'static' | 'deferred';
export type AppPageSurfaceKind =
  | 'home'
  | 'music'
  | 'movies'
  | 'tv'
  | 'browser'
  | 'addons'
  | 'playlists'
  | 'settings'
  | 'help'
  | 'remote'
  | 'search'
  | 'lab'
  | 'pvr';

export interface AppPageMetadata {
  readonly routeKind: PrimaryRoute['kind'];
  readonly surfaceKind: AppPageSurfaceKind;
  readonly status: AppPageStatus;
  readonly heading: string;
  readonly stageLabel: string;
  readonly statusLabel: string;
  readonly description: string;
  readonly deferredMessage: string;
}

type StaticAppPageMetadata = Pick<
  AppPageMetadata,
  'surfaceKind' | 'status' | 'heading' | 'stageLabel' | 'statusLabel'
>;

const APP_PAGE_METADATA_BY_KIND = {
  home: implemented('home', 'Music', 'Music home', 'Library landing'),
  music: implemented('music', 'Music', 'Music library', 'Library root'),
  musicTop: implemented('music', 'Recently added music', 'Music library', 'Recent albums'),
  musicArtists: implemented('music', 'Artists', 'Music library', 'Artist index'),
  musicAlbums: implemented('music', 'Albums', 'Music library', 'Album index'),
  musicGenres: implemented('music', 'Genres', 'Music library', 'Genre index'),
  musicVideos: implemented('music', 'Music videos', 'Music library', 'Music video index'),
  musicVideoDetail: implemented('music', 'Music video details', 'Music library', 'Detail surface'),
  musicAlbumDetail: implemented('music', 'Album details', 'Music library', 'Detail surface'),
  musicArtistDetail: implemented('music', 'Artist details', 'Music library', 'Detail surface'),
  musicGenreDetail: implemented('music', 'Genre details', 'Music library', 'Detail surface'),
  movies: implemented('movies', 'Movies', 'Movie library', 'Library root'),
  moviesRecent: staticSurface(
    'movies',
    'Recently added movies',
    'Movie library',
    'Reference route'
  ),
  movieDetail: deferred('movies', 'Movie details', 'Movie library', 'Deferred detail surface'),
  tvshows: implemented('tv', 'TV shows', 'TV library', 'Library root'),
  tvshowsRecent: staticSurface('tv', 'Recently added TV shows', 'TV library', 'Reference route'),
  tvshowDetail: deferred('tv', 'TV show details', 'TV library', 'Deferred detail surface'),
  tvshowSeasonDetail: deferred('tv', 'Season details', 'TV library', 'Deferred detail surface'),
  tvshowEpisodeDetail: deferred('tv', 'Episode details', 'TV library', 'Deferred detail surface'),
  browser: implemented('browser', 'Browser / Files', 'File browser', 'Primary files surface'),
  browserItem: implemented('browser', 'Browser item', 'File browser', 'Directory/file surface'),
  addonsAll: staticSurface('addons', 'Add-ons', 'Add-on catalog', 'Static route'),
  addonsVideo: staticSurface('addons', 'Video add-ons', 'Add-on catalog', 'Static route'),
  addonsAudio: staticSurface('addons', 'Audio add-ons', 'Add-on catalog', 'Static route'),
  addonsExecutable: staticSurface('addons', 'Executable add-ons', 'Add-on catalog', 'Static route'),
  addonDetail: staticSurface('addons', 'Add-on details', 'Add-on catalog', 'Detail surface'),
  addonExecute: implemented('addons', 'Execute add-on', 'Add-on catalog', 'Action route'),
  currentPlaylist: implemented('playlists', 'Current playlist', 'Playlist library', 'Kodi queue'),
  playlists: implemented('playlists', 'Playlists', 'Playlist library', 'Local playlists'),
  playlistDetail: implemented(
    'playlists',
    'Playlist details',
    'Playlist library',
    'Local playlist detail'
  ),
  settingsWeb: staticSurface('settings', 'Web interface settings', 'Settings', 'Static route'),
  settingsKodi: staticSurface('settings', 'Kodi settings', 'Settings', 'Static route'),
  settingsKodiSection: staticSurface(
    'settings',
    'Kodi settings section',
    'Settings',
    'Section route'
  ),
  settingsAddons: staticSurface('settings', 'Add-on settings', 'Settings', 'Static route'),
  settingsNav: staticSurface('settings', 'Navigation settings', 'Settings', 'Static route'),
  settingsSearch: staticSurface('settings', 'Search settings', 'Settings', 'Static route'),
  help: staticSurface('help', 'Help', 'Help', 'Static route'),
  helpOverview: staticSurface('help', 'Help overview', 'Help', 'Static route'),
  helpPage: implemented('help', 'Help page', 'Help', 'Chorus2 help topic'),
  remote: staticSurface('remote', 'Remote', 'Remote control', 'Static route'),
  search: implemented('search', 'Search', 'Search', 'Search surface'),
  searchMedia: implemented('search', 'Media search', 'Search', 'Search results'),
  lab: implemented('lab', 'Lab', 'Lab', 'Developer tools'),
  labApiBrowser: implemented('lab', 'API browser', 'Lab', 'JSON-RPC browser'),
  labApiBrowserMethod: implemented('lab', 'API browser method', 'Lab', 'JSON-RPC method'),
  labScreenshot: implemented('lab', 'Screenshot', 'Lab', 'Kodi screenshot tool'),
  labIconBrowser: implemented('lab', 'Icon browser', 'Lab', 'Icon catalog'),
  thumbsup: implemented('playlists', 'Thumbs up', 'Playlist library', 'Local thumbs-up surface'),
  pvrTv: implemented('pvr', 'PVR TV', 'PVR', 'PVR TV channel list'),
  pvrTvChannel: implemented('pvr', 'PVR TV channel', 'PVR', 'PVR TV channel detail'),
  pvrRadio: implemented('pvr', 'PVR radio', 'PVR', 'PVR radio channel list'),
  pvrRadioChannel: implemented('pvr', 'PVR radio channel', 'PVR', 'PVR radio channel detail'),
  pvrRecordings: implemented('pvr', 'PVR recordings', 'PVR', 'PVR recording list')
} as const satisfies Record<PrimaryRoute['kind'], StaticAppPageMetadata>;

export function getAppPageMetadata(route: PrimaryRoute): AppPageMetadata {
  const metadata = getStaticAppPageMetadata(route);

  return {
    routeKind: route.kind,
    surfaceKind: metadata.surfaceKind,
    status: metadata.status,
    heading: metadata.heading,
    stageLabel: metadata.stageLabel,
    statusLabel: metadata.statusLabel,
    description: appPageDescription(route),
    deferredMessage: appPageDeferredMessage(route, metadata.status)
  };
}

function getStaticAppPageMetadata(route: PrimaryRoute): StaticAppPageMetadata {
  if (route.kind === 'helpPage') {
    const topicId = normalizeHelpTopicId(route.pageid);

    if (topicId) {
      return staticSurface('help', HELP_TOPICS[topicId].title, 'Help', 'Static route');
    }
  }

  return APP_PAGE_METADATA_BY_KIND[route.kind] ?? APP_PAGE_METADATA_BY_KIND.home;
}

export function getAppPageLabel(route: PrimaryRoute): string {
  return getAppPageMetadata(route).heading;
}

function appPageDescription(route: PrimaryRoute): string {
  if (route.kind === 'home') {
    return 'chorus3 home: a package-safe Chorus media controller home stage for direct root loads.';
  }

  if (route.kind === 'music') {
    return 'Browse music library, discovery, search, files, and playlist surfaces in Chorus.';
  }

  if (route.kind === 'movies') {
    return 'Browse movie library surfaces without falling back to setup or unknown-route UI.';
  }

  if (route.kind === 'tvshows') {
    return 'Browse TV library surfaces without falling back to setup or unknown-route UI.';
  }

  if (route.kind === 'remote') {
    return 'Send safe Kodi remote input and playback commands from Chorus.';
  }

  if (route.kind === 'addonsAll') {
    return 'Inspect installed add-ons and write-state diagnostics inside Chorus.';
  }

  if (route.kind === 'addonDetail') {
    return 'Inspect one installed add-on inside Chorus without exposing the add-on identifier in route metadata.';
  }

  if (route.kind === 'settingsWeb') {
    return 'Manage package-safe web interface settings without exposing host setup as the root default.';
  }

  if (route.kind === 'settingsKodi') {
    return 'Browse Kodi settings sections and categories while preserving existing settings-panel write guards.';
  }

  if (route.kind === 'settingsKodiSection') {
    return 'Select a known Kodi settings section without exposing route ids or unsafe setting values.';
  }

  if (route.kind === 'settingsAddons') {
    return 'Review add-on settings route context while deep add-on-specific settings remain deferred behind a safe boundary.';
  }

  if (route.kind === 'settingsNav') {
    return 'Review navigation settings route context without claiming mutable menu editing is implemented.';
  }

  if (route.kind === 'settingsSearch') {
    return 'Review search settings route context without claiming search-provider editing is implemented.';
  }

  if (route.kind === 'search' || route.kind === 'searchMedia') {
    return 'Search Kodi media through the Chorus2-compatible global search route.';
  }

  if (route.kind === 'help' || route.kind === 'helpOverview') {
    return 'Browse safe static help without loading external files or exposing route payloads.';
  }

  if (route.kind === 'helpPage') {
    return normalizeHelpTopicId(route.pageid)
      ? 'Browse a known safe static help topic without loading external files.'
      : 'Render a safe static help fallback for an unknown help route without reflecting the help identifier.';
  }

  if (route.kind === 'browser') {
    return 'Browse media sources in an app-native frame while deeper browser parity lands in later slices.';
  }

  if (route.kind === 'playlists') {
    return 'Manage local browser playlists with durable storage while browsing Kodi media playlists separately.';
  }

  if (route.kind === 'playlistDetail') {
    return 'Manage one local browser playlist without exposing route ids or stored media paths.';
  }

  return 'This supported route is wired to a Chorus frame; fuller behavior can land without changing the route boundary.';
}

function appPageDeferredMessage(route: PrimaryRoute, status: AppPageStatus): string {
  if (
    status === 'implemented' ||
    route.kind === 'home' ||
    route.kind === 'settingsKodiSection' ||
    route.kind === 'helpOverview' ||
    (route.kind === 'helpPage' && Boolean(normalizeHelpTopicId(route.pageid)))
  ) {
    return '';
  }

  if (route.kind === 'browserItem' || route.kind === 'helpPage' || route.kind === 'addonExecute') {
    return 'This route has a safe Chorus deferred frame while deeper behavior remains owned by a later slice.';
  }

  return 'This route is supported by Chorus while fuller behavior lands behind the same safe boundary.';
}

function implemented(
  surfaceKind: AppPageSurfaceKind,
  heading: string,
  stageLabel: string,
  statusLabel: string
): StaticAppPageMetadata {
  return { surfaceKind, status: 'implemented', heading, stageLabel, statusLabel };
}

function staticSurface(
  surfaceKind: AppPageSurfaceKind,
  heading: string,
  stageLabel: string,
  statusLabel: string
): StaticAppPageMetadata {
  return { surfaceKind, status: 'static', heading, stageLabel, statusLabel };
}

function deferred(
  surfaceKind: AppPageSurfaceKind,
  heading: string,
  stageLabel: string,
  statusLabel: string
): StaticAppPageMetadata {
  return { surfaceKind, status: 'deferred', heading, stageLabel, statusLabel };
}
