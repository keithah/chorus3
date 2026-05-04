import {
  buildVideoRoute,
  parseVideoRoute,
  type DashboardRoute,
  type VideoRoute
} from '../video/videoRouter';
import { getChorus2ParityRowById, type Chorus2ParityStatus } from './chorus2ParityLedger';
import {
  buildPrimaryRoutePath,
  parsePrimaryRoutePath,
  type PrimaryRoute
} from './primaryRoutes';

export type AppDashboardRoute = DashboardRoute;
export type PrimaryAppRoute = { kind: 'primary'; route: PrimaryRoute };
export type SettingsRoute = { kind: 'settings' };
export type SettingsUnknownRoute = { kind: 'settingsUnknown'; pathLabel: string };
export type RemoteRoute = { kind: 'remote' };
export type AddonsRoute = { kind: 'addons' };
export type AddonDetailRoute = { kind: 'addonDetail'; addonid: string };
export type AddonsUnknownRoute = { kind: 'addonsUnknown'; pathLabel: string };
export type LabShortcutsRoute = { kind: 'labShortcuts' };
export type LabApiBrowserRoute = { kind: 'labApiBrowser' };
export type LabUnknownRoute = { kind: 'labUnknown'; pathLabel: string };
export type NowPlayingRoute = { kind: 'nowPlaying' };
export type DelegatedVideoRoute = { kind: 'video'; route: Exclude<VideoRoute, DashboardRoute> };
export type Chorus2PlaceholderStatus = 'missing' | 'deferred' | 'intentionallyChanged';

export interface Chorus2RoutePlaceholder {
  readonly id: string;
  readonly ledgerIds: readonly string[];
  readonly surface: string;
  readonly title: string;
  readonly status: Chorus2PlaceholderStatus;
  readonly owner: string;
  readonly description: string;
  readonly recoveryRoute: string;
  readonly routePath: string;
}

export type Chorus2PlaceholderRoute = {
  kind: 'chorus2Placeholder';
  placeholder: Chorus2RoutePlaceholder;
};

export type AppRoute =
  | PrimaryAppRoute
  | AppDashboardRoute
  | SettingsRoute
  | SettingsUnknownRoute
  | RemoteRoute
  | AddonsRoute
  | AddonDetailRoute
  | AddonsUnknownRoute
  | LabShortcutsRoute
  | LabApiBrowserRoute
  | LabUnknownRoute
  | NowPlayingRoute
  | DelegatedVideoRoute
  | Chorus2PlaceholderRoute;

export interface AppRouteHistory {
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
}

export interface NavigateAppRouteOptions {
  history?: AppRouteHistory | null;
}

export interface ParseAppRouteOptions {
  packageBasePath?: unknown;
}

export interface BuildAppRouteOptions {
  packageBasePath?: unknown;
}

export const KODI_WEBINTERFACE_ADDON_ID = 'webinterface.chorus3';
export const KODI_WEBINTERFACE_BASE_PATH = `/addons/${KODI_WEBINTERFACE_ADDON_ID}`;

const ROOT_PATH = '/';
const SETTINGS_PATH = '/settings';
const REMOTE_PATH = '/remote';
const ADDONS_PATH = '/addons';
const LAB_PATH = '/lab';
const LAB_SHORTCUTS_PATH = '/lab/shortcuts';
const LAB_API_BROWSER_PATH = '/lab/api-browser';
const NOW_PLAYING_PATH = '/now-playing';
const UNKNOWN_SETTINGS_PATH = '/settings/unknown';
const UNKNOWN_ADDONS_PATH = '/addons/[redacted]';
const UNKNOWN_LAB_PATH = '/lab/[redacted]';
const UNSAFE_SEGMENT = '[redacted]';
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

const CHORUS2_PLACEHOLDER_DEFINITIONS = [
  placeholder({
    id: 'moviesRecent',
    ledgerIds: ['nav:movie:movies-recent'],
    surface: 'movies/recent',
    title: 'Recent Movies',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 recent-movies navigation is visible but not implemented in Chorus3 yet.',
    recoveryRoute: '/video/movies',
    routePath: '/movies/recent'
  }),
  placeholder({
    id: 'tvShowsRecent',
    ledgerIds: ['nav:tvshow:tvshows-recent'],
    surface: 'tvshows/recent',
    title: 'Recent TV Shows',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 recent-TV navigation is visible but not implemented in Chorus3 yet.',
    recoveryRoute: '/video/tv',
    routePath: '/tvshows/recent'
  }),
  placeholder({
    id: 'playlists',
    ledgerIds: ['route:playlist:playlists'],
    surface: 'playlists',
    title: 'Chorus2 Playlists',
    status: 'deferred',
    owner: 'R055/M006/S04',
    description: 'Playlist parity is deferred to the playlist/local-player parity owner.',
    recoveryRoute: '/',
    routePath: '/playlists'
  }),
  placeholder({
    id: 'localPlaylist',
    ledgerIds: ['route:local-playlist:localplaylist'],
    surface: 'localPlaylist',
    title: 'Chorus2 Local Playlist',
    status: 'deferred',
    owner: 'R055/M006/S04',
    description: 'Local playlist parity is deferred to the playlist/local-player parity owner.',
    recoveryRoute: '/playlists',
    routePath: '/localPlaylist'
  }),
  placeholder({
    id: 'help',
    ledgerIds: ['route:help-overview:help'],
    surface: 'help',
    title: 'Chorus2 Help',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 help landing route is tracked but not rendered in Chorus3 yet.',
    recoveryRoute: '/',
    routePath: '/help'
  }),
  placeholder({
    id: 'helpOverview',
    ledgerIds: ['route:help-overview:help-overview'],
    surface: 'help/overview',
    title: 'Chorus2 Help Overview',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 help overview content is tracked but not rendered in Chorus3 yet.',
    recoveryRoute: '/help',
    routePath: '/help/overview'
  }),
  placeholder({
    id: 'helpPage',
    ledgerIds: ['route:help-page:help-id'],
    surface: 'help/:id',
    title: 'Chorus2 Help Page',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 help page routes are tracked without reflecting raw help IDs.',
    recoveryRoute: '/help',
    routePath: '/help/[id]'
  }),
  placeholder({
    id: 'browser',
    ledgerIds: ['route:browser:browser', 'nav:browser:browser'],
    surface: 'browser',
    title: 'Chorus2 Browser',
    status: 'missing',
    owner: 'M006/S04',
    description: 'Chorus2 browser navigation is visible but awaits file-browser parity work.',
    recoveryRoute: '/',
    routePath: '/browser'
  }),
  placeholder({
    id: 'files',
    ledgerIds: ['route:browser:files'],
    surface: 'files',
    title: 'Chorus2 Files',
    status: 'missing',
    owner: 'M006/S04',
    description: 'Chorus2 files navigation is tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/',
    routePath: '/files'
  }),
  placeholder({
    id: 'browserMedia',
    ledgerIds: ['route:view:browser-media-id'],
    surface: 'browser/:media/:id',
    title: 'Chorus2 Browser Item',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 browser item routes are tracked without reflecting raw media paths.',
    recoveryRoute: '/browser',
    routePath: '/browser/[media]/[id]'
  }),
  placeholder({
    id: 'settingsWeb',
    ledgerIds: ['route:local:settings-web'],
    surface: 'settings/web',
    title: 'Web Settings',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 web settings are tracked separately from the implemented settings shell.',
    recoveryRoute: '/settings',
    routePath: '/settings/web'
  }),
  placeholder({
    id: 'settingsKodi',
    ledgerIds: ['route:kodi:settings-kodi'],
    surface: 'settings/kodi',
    title: 'Kodi Settings',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 Kodi settings require a future settings parity implementation.',
    recoveryRoute: '/settings',
    routePath: '/settings/kodi'
  }),
  placeholder({
    id: 'settingsKodiSection',
    ledgerIds: ['route:kodi:settings-kodi-section'],
    surface: 'settings/kodi/:section',
    title: 'Kodi Settings Section',
    status: 'missing',
    owner: 'M006/S02',
    description:
      'Chorus2 Kodi settings subsections are tracked without reflecting raw section IDs.',
    recoveryRoute: '/settings/kodi',
    routePath: '/settings/kodi/[section]'
  }),
  placeholder({
    id: 'settingsNav',
    ledgerIds: ['route:nav-main:settings-nav'],
    surface: 'settings/nav',
    title: 'Navigation Settings',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 navigation settings are visible but not implemented in Chorus3 yet.',
    recoveryRoute: '/settings',
    routePath: '/settings/nav'
  }),
  placeholder({
    id: 'settingsSearch',
    ledgerIds: ['route:search:settings-search'],
    surface: 'settings/search',
    title: 'Search Settings',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 search settings are visible but not implemented in Chorus3 yet.',
    recoveryRoute: '/settings',
    routePath: '/settings/search'
  }),
  placeholder({
    id: 'settingsAddons',
    ledgerIds: ['route:addons:settings-addons'],
    surface: 'settings/addons',
    title: 'Add-on Settings',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 add-on settings are visible but not implemented in Chorus3 yet.',
    recoveryRoute: '/settings',
    routePath: '/settings/addons'
  }),
  placeholder({
    id: 'lab',
    ledgerIds: ['route:lab-landing:lab'],
    surface: 'lab',
    title: 'Chorus2 Lab',
    status: 'missing',
    owner: 'M006/S02',
    description:
      'Chorus2 lab landing is tracked separately from implemented Chorus3 lab shortcuts.',
    recoveryRoute: '/lab/shortcuts',
    routePath: '/lab'
  }),
  placeholder({
    id: 'labScreenshot',
    ledgerIds: ['route:screen-shot:lab-screenshot'],
    surface: 'lab/screenshot',
    title: 'Lab Screenshot',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 screenshot tooling is tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/lab/shortcuts',
    routePath: '/lab/screenshot'
  }),
  placeholder({
    id: 'labIconBrowser',
    ledgerIds: ['route:icon-browser:lab-icon-browser'],
    surface: 'lab/icon-browser',
    title: 'Lab Icon Browser',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 icon browser tooling is tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/lab/shortcuts',
    routePath: '/lab/icon-browser'
  }),
  placeholder({
    id: 'labApiBrowserMethod',
    ledgerIds: ['route:api-browser:lab-api-browser-method'],
    surface: 'lab/api-browser/:method',
    title: 'Lab API Browser Method',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 method-specific API browser routes do not dispatch JSON-RPC in Chorus3.',
    recoveryRoute: '/lab/api-browser',
    routePath: '/lab/api-browser/[method]'
  }),
  placeholder({
    id: 'addonsVideo',
    ledgerIds: ['nav:addon:addons-video'],
    surface: 'addons/video',
    title: 'Video Add-ons',
    status: 'missing',
    owner: 'M006/S02',
    description:
      'Chorus2 add-on type-filter navigation is not implemented in the current add-ons shell.',
    recoveryRoute: '/addons',
    routePath: '/addons/video'
  }),
  placeholder({
    id: 'addonsAudio',
    ledgerIds: ['nav:addons:addons-audio'],
    surface: 'addons/audio',
    title: 'Audio Add-ons',
    status: 'deferred',
    owner: 'R054/M006/S04',
    description:
      'Chorus2 audio add-on type-filter navigation is deferred to the media parity owner.',
    recoveryRoute: '/addons',
    routePath: '/addons/audio'
  }),
  placeholder({
    id: 'addonsExecutable',
    ledgerIds: ['nav:addons:addons-executable'],
    surface: 'addons/executable',
    title: 'Executable Add-ons',
    status: 'missing',
    owner: 'M006/S02',
    description:
      'Chorus2 executable add-on type-filter navigation is not implemented in the current add-ons shell.',
    recoveryRoute: '/addons',
    routePath: '/addons/executable'
  }),
  placeholder({
    id: 'addonExecute',
    ledgerIds: ['route:execute:addon-execute-id'],
    surface: 'addon/execute/:id',
    title: 'Execute Add-on',
    status: 'missing',
    owner: 'M006/S02',
    description:
      'Chorus2 add-on execution routes are visible but intentionally non-dispatching here.',
    recoveryRoute: '/addons',
    routePath: '/addon/execute/[id]'
  }),
  placeholder({
    id: 'search',
    ledgerIds: ['route:view:search'],
    surface: 'search',
    title: 'Chorus2 Search',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 search landing is tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/',
    routePath: '/search'
  }),
  placeholder({
    id: 'searchVideo',
    ledgerIds: ['route:list:search-media-query'],
    surface: 'search/:media/:query',
    title: 'Video Search',
    status: 'missing',
    owner: 'M006/S02',
    description: 'Chorus2 media search routes are tracked without reflecting raw query text.',
    recoveryRoute: '/search',
    routePath: '/search/video/[query]'
  }),
  placeholder({
    id: 'pvr',
    ledgerIds: ['route:pvr:pvr', 'nav:pvr:pvr'],
    surface: 'pvr',
    title: 'Chorus2 PVR',
    status: 'deferred',
    owner: 'R056/M006/S04',
    description: 'PVR parity is deferred to the PVR parity owner.',
    recoveryRoute: '/',
    routePath: '/pvr'
  }),
  placeholder({
    id: 'pvrTv',
    ledgerIds: ['route:tv:pvr-tv'],
    surface: 'pvr/tv',
    title: 'PVR TV',
    status: 'deferred',
    owner: 'R056/M006/S04',
    description: 'Chorus2 PVR TV routes are tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/pvr',
    routePath: '/pvr/tv'
  }),
  placeholder({
    id: 'pvrTvChannel',
    ledgerIds: ['route:tv:pvr-tv-channelid'],
    surface: 'pvr/tv/:channelid',
    title: 'PVR TV Channel',
    status: 'deferred',
    owner: 'R056/M006/S04',
    description: 'Chorus2 PVR TV channel routes are tracked without reflecting raw channel IDs.',
    recoveryRoute: '/pvr/tv',
    routePath: '/pvr/tv/[channelid]'
  }),
  placeholder({
    id: 'pvrRadio',
    ledgerIds: ['route:radio:pvr-radio'],
    surface: 'pvr/radio',
    title: 'PVR Radio',
    status: 'deferred',
    owner: 'R056/M006/S04',
    description: 'Chorus2 PVR radio routes are tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/pvr',
    routePath: '/pvr/radio'
  }),
  placeholder({
    id: 'pvrRadioChannel',
    ledgerIds: ['route:radio:pvr-radio-channelid'],
    surface: 'pvr/radio/:channelid',
    title: 'PVR Radio Channel',
    status: 'deferred',
    owner: 'R056/M006/S04',
    description: 'Chorus2 PVR radio channel routes are tracked without reflecting raw channel IDs.',
    recoveryRoute: '/pvr/radio',
    routePath: '/pvr/radio/[channelid]'
  }),
  placeholder({
    id: 'pvrRecordings',
    ledgerIds: ['route:recordings:pvr-recordings'],
    surface: 'pvr/recordings',
    title: 'PVR Recordings',
    status: 'deferred',
    owner: 'R056/M006/S04',
    description: 'Chorus2 PVR recordings are tracked but not implemented in Chorus3 yet.',
    recoveryRoute: '/pvr',
    routePath: '/pvr/recordings'
  }),
  placeholder({
    id: 'musicVideos',
    ledgerIds: ['route:musicvideo:music-videos'],
    surface: 'music/videos',
    title: 'Music Videos',
    status: 'deferred',
    owner: 'R054/M006/S04',
    description: 'Music video parity is deferred to the media parity owner.',
    recoveryRoute: '/',
    routePath: '/music/videos'
  }),
  placeholder({
    id: 'thumbsup',
    ledgerIds: ['route:thumbs:thumbsup', 'nav:thumbsup:thumbsup'],
    surface: 'thumbsup',
    title: 'Thumbs Up',
    status: 'deferred',
    owner: 'R055/M006/S04',
    description: 'Thumbs-up playlist parity is deferred to the playlist/local-player parity owner.',
    recoveryRoute: '/playlists',
    routePath: '/thumbsup'
  })
] as const satisfies readonly Chorus2RoutePlaceholder[];

const CHORUS2_PLACEHOLDERS_BY_ID = new Map(
  CHORUS2_PLACEHOLDER_DEFINITIONS.map((placeholder) => [placeholder.id, placeholder])
);
const CHORUS2_PLACEHOLDERS_BY_ROUTE_PATH = new Map(
  CHORUS2_PLACEHOLDER_DEFINITIONS.map((placeholder) => [placeholder.routePath, placeholder])
);

validateChorus2PlaceholderLedgerIds();

export function parseAppRoute(
  pathname: unknown,
  search?: unknown,
  options: ParseAppRouteOptions = {}
): AppRoute {
  void normalizeSearch(search);

  const path = stripPackageBasePath(
    normalizePathnameInput(pathname),
    normalizePackageBasePath(options.packageBasePath)
  );

  const primaryRoute = parsePrimaryRoutePath(path);

  if (primaryRoute) {
    return { kind: 'primary', route: primaryRoute };
  }

  if (path === ROOT_PATH) {
    return { kind: 'dashboard' };
  }

  if (path === '/movies') {
    return { kind: 'video', route: { kind: 'videoMovies' } };
  }

  if (path === '/tvshows') {
    return { kind: 'video', route: { kind: 'videoTvShows' } };
  }

  if (path === REMOTE_PATH) {
    return { kind: 'remote' };
  }

  const chorus2VideoAlias = parseChorus2VideoAliasRoute(path);

  if (chorus2VideoAlias) {
    return chorus2VideoAlias;
  }

  const chorus2Placeholder = parseChorus2PlaceholderRoute(path);

  if (chorus2Placeholder) {
    return { kind: 'chorus2Placeholder', placeholder: chorus2Placeholder };
  }

  if (path === SETTINGS_PATH) {
    return { kind: 'settings' };
  }

  if (path.startsWith(`${SETTINGS_PATH}/`)) {
    return { kind: 'settingsUnknown', pathLabel: normalizePathLabel(path, UNKNOWN_SETTINGS_PATH) };
  }

  if (path === ADDONS_PATH) {
    return { kind: 'addons' };
  }

  if (path.startsWith(`${ADDONS_PATH}/`)) {
    const segments = path.split('/').filter(Boolean);
    const decodedAddonId = segments.length === 2 ? safeDecode(segments[1] ?? '').trim() : '';

    return isSafeAddonId(decodedAddonId)
      ? { kind: 'addonDetail', addonid: decodedAddonId }
      : { kind: 'addonsUnknown', pathLabel: UNKNOWN_ADDONS_PATH };
  }

  if (path === LAB_SHORTCUTS_PATH) {
    return { kind: 'labShortcuts' };
  }

  if (path === LAB_API_BROWSER_PATH) {
    return { kind: 'labApiBrowser' };
  }

  if (path === NOW_PLAYING_PATH) {
    return { kind: 'nowPlaying' };
  }

  if (path.startsWith(`${NOW_PLAYING_PATH}/`)) {
    return {
      kind: 'settingsUnknown',
      pathLabel: normalizeUnknownNowPlayingPathLabel(path)
    };
  }

  if (path === LAB_PATH || path.startsWith(`${LAB_PATH}/`)) {
    return { kind: 'labUnknown', pathLabel: normalizeUnknownLabPathLabel(path) };
  }

  if (path.startsWith('/video/')) {
    const videoRoute = parseVideoRoute(path, search);
    return videoRoute.kind === 'dashboard'
      ? { kind: 'dashboard' }
      : { kind: 'video', route: videoRoute };
  }

  return { kind: 'settingsUnknown', pathLabel: normalizePathLabel(path, '/[redacted]') };
}

export function buildAppRoute(route: AppRoute, options: BuildAppRouteOptions = {}): string {
  const path = buildAppRoutePath(route);
  const packageBasePath = normalizePackageBasePath(options.packageBasePath);

  return packageBasePath ? prefixPackageBasePath(path, packageBasePath) : path;
}

export function buildPrimaryAppRoute(
  route: PrimaryRoute,
  options: BuildAppRouteOptions = {}
): string {
  const path = buildPrimaryRoutePath(route);
  const packageBasePath = normalizePackageBasePath(options.packageBasePath);

  return packageBasePath ? prefixPackageBasePath(path, packageBasePath) : path;
}

function buildAppRoutePath(route: AppRoute): string {
  if (!isRouteLike(route)) {
    return ROOT_PATH;
  }

  if (route.kind === 'dashboard') {
    return ROOT_PATH;
  }

  if (route.kind === 'primary') {
    return buildPrimaryRoutePath(route.route);
  }

  if (route.kind === 'settings') {
    return SETTINGS_PATH;
  }

  if (route.kind === 'remote') {
    return REMOTE_PATH;
  }

  if (route.kind === 'settingsUnknown') {
    return normalizePathLabel(route.pathLabel || UNKNOWN_SETTINGS_PATH, UNKNOWN_SETTINGS_PATH);
  }

  if (route.kind === 'addons') {
    return ADDONS_PATH;
  }

  if (route.kind === 'addonDetail') {
    return isSafeAddonId(route.addonid)
      ? `${ADDONS_PATH}/${encodeURIComponent(route.addonid)}`
      : UNKNOWN_ADDONS_PATH;
  }

  if (route.kind === 'addonsUnknown') {
    return normalizePathLabel(route.pathLabel || UNKNOWN_ADDONS_PATH, UNKNOWN_ADDONS_PATH);
  }

  if (route.kind === 'labShortcuts') {
    return LAB_SHORTCUTS_PATH;
  }

  if (route.kind === 'labApiBrowser') {
    return LAB_API_BROWSER_PATH;
  }

  if (route.kind === 'nowPlaying') {
    return NOW_PLAYING_PATH;
  }

  if (route.kind === 'chorus2Placeholder') {
    return normalizeChorus2PlaceholderRoutePath(route.placeholder);
  }

  if (route.kind === 'labUnknown') {
    return normalizePathLabel(route.pathLabel || UNKNOWN_LAB_PATH, UNKNOWN_LAB_PATH);
  }

  if (route.kind === 'video') {
    return buildVideoRoute(route.route as VideoRoute);
  }

  return ROOT_PATH;
}

export function isDelegatedVideoRoute(route: unknown): route is DelegatedVideoRoute {
  return isRouteLike(route) && route.kind === 'video' && isRouteLike(route.route);
}

export function unwrapVideoRoute(route: AppRoute): VideoRoute {
  return isDelegatedVideoRoute(route) ? route.route : { kind: 'dashboard' };
}

export function getChorus2PlaceholderMetadata(id: string): Chorus2RoutePlaceholder | undefined {
  return CHORUS2_PLACEHOLDERS_BY_ID.get(id);
}

export function getChorus2PlaceholderMetadataTable(): readonly Chorus2RoutePlaceholder[] {
  return CHORUS2_PLACEHOLDER_DEFINITIONS;
}

export function navigateAppRoute(route: AppRoute, options: NavigateAppRouteOptions = {}): boolean {
  const history = 'history' in options ? options.history : globalThis.history;

  if (!history || typeof history.pushState !== 'function') {
    return false;
  }

  try {
    history.pushState(
      { routeKind: isRouteLike(route) ? route.kind : 'dashboard' },
      '',
      buildAppRoute(route)
    );
    return true;
  } catch {
    return false;
  }
}

function parseChorus2VideoAliasRoute(path: string): AppRoute | null {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 2 && segments[0] === 'movies' && segments[1] === 'recent') {
    return { kind: 'video', route: { kind: 'videoMovies' } };
  }

  if (segments.length === 2 && segments[0] === 'tvshows' && segments[1] === 'recent') {
    return { kind: 'video', route: { kind: 'videoTvShows' } };
  }

  if (segments[0] === 'movie') {
    const movieid = parseSafeIntegerSegment(segments[1]);

    return segments.length === 2 && movieid !== null
      ? { kind: 'video', route: { kind: 'videoMovieDetail', movieid } }
      : malformedChorus2VideoAliasRoute();
  }

  if (segments[0] === 'tvshow') {
    const tvshowid = parseSafeIntegerSegment(segments[1]);
    const season = parseSafeIntegerSegment(segments[2]);
    const episodeid = parseSafeIntegerSegment(segments[3]);

    if (segments.length === 2 && tvshowid !== null) {
      return { kind: 'video', route: { kind: 'videoTvShowDetail', tvshowid } };
    }

    if (segments.length === 3 && tvshowid !== null && season !== null) {
      return { kind: 'video', route: { kind: 'videoTvSeasonDetail', tvshowid, season } };
    }

    if (segments.length === 4 && tvshowid !== null && season !== null && episodeid !== null) {
      return {
        kind: 'video',
        route: { kind: 'videoEpisodeDetail', tvshowid, season, episodeid }
      };
    }

    return malformedChorus2VideoAliasRoute();
  }

  return null;
}

function malformedChorus2VideoAliasRoute(): AppRoute {
  return { kind: 'settingsUnknown', pathLabel: '/[redacted]' };
}

function parseSafeIntegerSegment(segment: string | undefined): number | null {
  if (typeof segment !== 'string') {
    return null;
  }

  const decoded = safeDecode(segment).trim();

  if (decoded !== segment || !/^\d+$/u.test(segment)) {
    return null;
  }

  const parsed = Number(segment);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseChorus2PlaceholderRoute(path: string): Chorus2RoutePlaceholder | null {
  const direct = CHORUS2_PLACEHOLDERS_BY_ROUTE_PATH.get(path);

  if (direct) {
    return direct;
  }

  if (path.startsWith('/addon/execute/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('addonExecute') ?? null;
  }

  if (path.startsWith('/help/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('helpPage') ?? null;
  }

  if (path.startsWith('/browser/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('browserMedia') ?? null;
  }

  if (path.startsWith('/files/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('files') ?? null;
  }

  if (path.startsWith('/settings/kodi/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('settingsKodiSection') ?? null;
  }

  if (path.startsWith('/search/video/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('searchVideo') ?? null;
  }

  if (path.startsWith('/pvr/tv/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('pvrTvChannel') ?? null;
  }

  if (path.startsWith('/pvr/radio/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('pvrRadioChannel') ?? null;
  }

  if (path.startsWith('/lab/api-browser/')) {
    return CHORUS2_PLACEHOLDERS_BY_ID.get('labApiBrowserMethod') ?? null;
  }

  return null;
}

function normalizeChorus2PlaceholderRoutePath(placeholder: Chorus2RoutePlaceholder): string {
  return CHORUS2_PLACEHOLDERS_BY_ID.get(placeholder.id)?.routePath ?? ROOT_PATH;
}

function normalizePackageBasePath(packageBasePath: unknown): string {
  if (typeof packageBasePath !== 'string' || !packageBasePath.trim()) {
    return '';
  }

  const normalized = normalizePathnameInput(packageBasePath);
  return normalized === ROOT_PATH || normalized.includes(UNSAFE_SEGMENT) ? '' : normalized;
}

function stripPackageBasePath(pathname: string, packageBasePath: string): string {
  if (!packageBasePath) {
    return pathname;
  }

  if (pathname === packageBasePath) {
    return ROOT_PATH;
  }

  return pathname.startsWith(`${packageBasePath}/`)
    ? normalizePathnameInput(pathname.slice(packageBasePath.length))
    : pathname;
}

function prefixPackageBasePath(pathname: string, packageBasePath: string): string {
  const path = normalizePathnameInput(pathname);
  return path === ROOT_PATH ? packageBasePath : `${packageBasePath}${path}`;
}

function normalizePathnameInput(pathname: unknown): string {
  if (pathname === null || pathname === undefined || pathname === '') {
    return ROOT_PATH;
  }

  if (typeof pathname !== 'string') {
    return '/[redacted]';
  }

  const pathOnly = pathname.split(/[?#]/, 1)[0]?.trim() ?? '';

  if (!pathOnly) {
    return ROOT_PATH;
  }

  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const compacted = withLeadingSlash.replace(/\/{2,}/g, '/');
  const withoutTrailingSlash = compacted.length > 1 ? compacted.replace(/\/+$/g, '') : compacted;

  return withoutTrailingSlash === '' ? ROOT_PATH : withoutTrailingSlash;
}

function normalizeSearch(search: unknown): URLSearchParams | null {
  if (typeof search !== 'string' || search.length === 0) {
    return null;
  }

  try {
    return new URLSearchParams(search);
  } catch {
    return null;
  }
}

function normalizePathLabel(pathname: string, fallback: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const safeSegments = segments.map(sanitizePathSegment).slice(0, 5);
  const pathLabel = `/${safeSegments.join('/')}`;

  return pathLabel === '/' ? fallback : pathLabel;
}

function normalizeUnknownLabPathLabel(pathname: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return UNKNOWN_LAB_PATH;
  }

  const labPayloadSegments = segments.slice(1);
  const hasUnsafePayload = labPayloadSegments.some(
    (segment) => sanitizePathSegment(segment) === UNSAFE_SEGMENT
  );

  return hasUnsafePayload ? UNKNOWN_LAB_PATH : normalizePathLabel(normalized, UNKNOWN_LAB_PATH);
}

function normalizeUnknownNowPlayingPathLabel(pathname: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return `${NOW_PLAYING_PATH}/${UNSAFE_SEGMENT}`;
  }

  const nowPlayingPayloadSegments = segments.slice(1);
  const hasUnsafePayload = nowPlayingPayloadSegments.some(
    (segment) => sanitizePathSegment(segment) === UNSAFE_SEGMENT
  );

  return hasUnsafePayload
    ? `${NOW_PLAYING_PATH}/${UNSAFE_SEGMENT}`
    : normalizePathLabel(normalized, `${NOW_PLAYING_PATH}/${UNSAFE_SEGMENT}`);
}

function sanitizePathSegment(segment: string): string {
  const decoded = safeDecode(segment).trim();

  if (!decoded || FORBIDDEN_SEGMENT_PATTERN.test(decoded) || decoded.includes('/')) {
    return UNSAFE_SEGMENT;
  }

  if (!/^[a-z0-9._-]+$/i.test(decoded)) {
    return UNSAFE_SEGMENT;
  }

  return decoded;
}

function isSafeAddonId(addonid: unknown): addonid is string {
  if (typeof addonid !== 'string') {
    return false;
  }

  const decoded = safeDecode(addonid).trim();

  return (
    decoded === addonid &&
    /^[A-Za-z0-9._-]+$/.test(decoded) &&
    !FORBIDDEN_SEGMENT_PATTERN.test(decoded)
  );
}

function placeholder(input: Chorus2RoutePlaceholder): Chorus2RoutePlaceholder {
  return {
    ...input,
    ledgerIds: [...input.ledgerIds],
    routePath: normalizePathnameInput(input.routePath),
    recoveryRoute: normalizePathnameInput(input.recoveryRoute)
  };
}

function validateChorus2PlaceholderLedgerIds(): void {
  for (const placeholder of CHORUS2_PLACEHOLDER_DEFINITIONS) {
    for (const ledgerId of placeholder.ledgerIds) {
      const row = getChorus2ParityRowById(ledgerId);

      if (!row) {
        throw new Error(
          `Missing Chorus2 parity ledger row for placeholder ${placeholder.id}: ${ledgerId}`
        );
      }

      if (row.owner !== placeholder.owner) {
        throw new Error(
          `Chorus2 placeholder ${placeholder.id} owner ${placeholder.owner} does not match ledger row ${ledgerId} owner ${row.owner}`
        );
      }

      if (toPlaceholderStatus(row.status) !== placeholder.status) {
        throw new Error(
          `Chorus2 placeholder ${placeholder.id} status ${placeholder.status} does not match ledger row ${ledgerId} status ${row.status}`
        );
      }
    }
  }
}

function toPlaceholderStatus(status: Chorus2ParityStatus): Chorus2PlaceholderStatus {
  if (status === 'missing' || status === 'deferred') {
    return status;
  }

  if (status === 'out-of-scope') {
    return 'intentionallyChanged';
  }

  throw new Error(`Unsupported Chorus2 placeholder status: ${status}`);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isRouteLike(route: unknown): route is Record<string, unknown> {
  return typeof route === 'object' && route !== null && 'kind' in route;
}
