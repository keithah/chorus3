import type { PrimaryRoute } from '$lib/app/primaryRoutes';

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
  | 'pvr';

export interface AppPageMetadata {
  readonly routeKind: PrimaryRoute['kind'];
  readonly surfaceKind: AppPageSurfaceKind;
  readonly status: AppPageStatus;
  readonly heading: string;
  readonly stageLabel: string;
  readonly statusLabel: string;
}

type StaticAppPageMetadata = Omit<AppPageMetadata, 'routeKind'>;

const APP_PAGE_METADATA_BY_KIND = {
  home: implemented('home', 'Music', 'Music home', 'Library landing'),
  music: implemented('music', 'Music', 'Music library', 'Library root'),
  musicTop: implemented('music', 'Recently added music', 'Music library', 'Recent albums'),
  musicArtists: implemented('music', 'Artists', 'Music library', 'Artist index'),
  musicAlbums: implemented('music', 'Albums', 'Music library', 'Album index'),
  musicGenres: implemented('music', 'Genres', 'Music library', 'Genre index'),
  musicVideos: deferred('music', 'Music videos', 'Music library', 'Deferred media surface'),
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
  browserItem: deferred('browser', 'Browser item', 'File browser', 'Deferred detail surface'),
  addonsAll: staticSurface('addons', 'Add-ons', 'Add-on catalog', 'Static route'),
  addonsVideo: staticSurface('addons', 'Video add-ons', 'Add-on catalog', 'Static route'),
  addonsAudio: staticSurface('addons', 'Audio add-ons', 'Add-on catalog', 'Static route'),
  addonsExecutable: staticSurface('addons', 'Executable add-ons', 'Add-on catalog', 'Static route'),
  addonExecute: deferred('addons', 'Execute add-on', 'Add-on catalog', 'Deferred action route'),
  playlists: staticSurface('playlists', 'Playlists', 'Playlist library', 'Static route'),
  playlistDetail: deferred(
    'playlists',
    'Playlist details',
    'Playlist library',
    'Deferred detail surface'
  ),
  settingsWeb: staticSurface('settings', 'Web interface settings', 'Settings', 'Static route'),
  settingsKodi: staticSurface('settings', 'Kodi settings', 'Settings', 'Static route'),
  settingsKodiSection: deferred(
    'settings',
    'Kodi settings section',
    'Settings',
    'Deferred detail surface'
  ),
  settingsAddons: staticSurface('settings', 'Add-on settings', 'Settings', 'Static route'),
  settingsNav: staticSurface('settings', 'Navigation settings', 'Settings', 'Static route'),
  settingsSearch: staticSurface('settings', 'Search settings', 'Settings', 'Static route'),
  help: staticSurface('help', 'Help', 'Help', 'Static route'),
  helpOverview: staticSurface('help', 'Help overview', 'Help', 'Static route'),
  helpPage: deferred('help', 'Help page', 'Help', 'Deferred detail surface'),
  remote: staticSurface('remote', 'Remote', 'Remote control', 'Static route'),
  search: deferred('search', 'Search', 'Search', 'Deferred search surface'),
  searchMedia: deferred('search', 'Media search', 'Search', 'Deferred search surface'),
  thumbsup: deferred('playlists', 'Thumbs up', 'Playlist library', 'Deferred playlist surface'),
  pvrTv: deferred('pvr', 'PVR TV', 'PVR', 'Deferred PVR surface'),
  pvrRadio: deferred('pvr', 'PVR radio', 'PVR', 'Deferred PVR surface'),
  pvrRecordings: deferred('pvr', 'PVR recordings', 'PVR', 'Deferred PVR surface')
} as const satisfies Record<PrimaryRoute['kind'], StaticAppPageMetadata>;

export function getAppPageMetadata(route: PrimaryRoute): AppPageMetadata {
  const metadata = APP_PAGE_METADATA_BY_KIND[route.kind] ?? APP_PAGE_METADATA_BY_KIND.home;

  return {
    routeKind: route.kind,
    surfaceKind: metadata.surfaceKind,
    status: metadata.status,
    heading: metadata.heading,
    stageLabel: metadata.stageLabel,
    statusLabel: metadata.statusLabel
  };
}

export function getAppPageLabel(route: PrimaryRoute): string {
  return getAppPageMetadata(route).heading;
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
