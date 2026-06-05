import { buildVideoRoute, parseVideoRoute, type VideoRoute } from '../video/videoRouter';
import { buildPrimaryRoutePath, parsePrimaryRoutePath, type PrimaryRoute } from './primaryRoutes';
import { isThumbsUpRoutePath, THUMBS_UP_PRIMARY_ROUTE } from './thumbsUpLegacyRoutes';
import { buildLocalPlayerRoutePath, parseLocalPlayerRoute } from './appLocalPlayerRoute';
import {
  buildPackageAwareRoutePath,
  isPackagePathMode,
  normalizePackageBasePath,
  routePathFromPackagePath
} from './appPackageRoutePath';
import {
  hasUnsafePathPayload,
  normalizePathLabel,
  normalizePathnameInput,
  normalizeSearch,
  parseSafeIntegerSegment
} from './appRoutePathSafety';

import type {
  AppRoute,
  BuildAppRouteOptions,
  DelegatedVideoRoute,
  KodiPackageRouteBuildOptions,
  NavigateAppRouteOptions,
  ParseAppRouteOptions,
  ParityRoutePlaceholder
} from './appRouteTypes';

export type {
  AddonDetailRoute,
  AddonsRoute,
  AddonsUnknownRoute,
  AppDashboardRoute,
  AppRoute,
  AppRouteHistory,
  BuildAppRouteOptions,
  DelegatedVideoRoute,
  KodiPackageRouteBuildOptions,
  LabUnknownRoute,
  LocalPlayerRoute,
  NavigateAppRouteOptions,
  NowPlayingRoute,
  ParityPlaceholderRoute,
  ParityPlaceholderStatus,
  ParityRoutePlaceholder,
  ParseAppRouteOptions,
  PrimaryAppRoute,
  RemoteRoute,
  SettingsRoute,
  SettingsUnknownRoute
} from './appRouteTypes';

export const KODI_WEBINTERFACE_ADDON_ID = 'webinterface.chorus3';
export const KODI_WEBINTERFACE_BASE_PATH = `/addons/${KODI_WEBINTERFACE_ADDON_ID}`;
const KODI_WEBINTERFACE_ADDON_SEGMENT = `/addons/${KODI_WEBINTERFACE_ADDON_ID}`;

const ROOT_PATH = '/';
const UNSAFE_SEGMENT = '[redacted]';
const SETTINGS_PATH = '/settings';
const REMOTE_PATH = '/remote';
const ADDONS_PATH = '/addons';
const LAB_PATH = '/lab';
const NOW_PLAYING_PATH = '/now-playing';
const UNKNOWN_SETTINGS_PATH = '/settings/unknown';
const UNKNOWN_ADDONS_PATH = '/addons/[redacted]';
const UNKNOWN_LAB_PATH = '/lab/[redacted]';

const PARITY_PLACEHOLDER_DEFINITIONS: readonly ParityRoutePlaceholder[] = [];

const PARITY_PLACEHOLDERS_BY_ID = new Map(
  PARITY_PLACEHOLDER_DEFINITIONS.map((placeholder) => [placeholder.id, placeholder])
);
const PARITY_PLACEHOLDERS_BY_ROUTE_PATH = new Map(
  PARITY_PLACEHOLDER_DEFINITIONS.map((placeholder) => [placeholder.routePath, placeholder])
);

export function parseAppRoute(
  pathname: unknown,
  search?: unknown,
  options: ParseAppRouteOptions = {}
): AppRoute {
  void normalizeSearch(search);

  const path = routePathFromPackagePath(pathname, options.packageBasePath);

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

  const videoAlias = parseVideoAliasRoute(path);

  if (videoAlias) {
    return videoAlias;
  }

  const parityPlaceholder = parseParityPlaceholderRoute(path);

  if (parityPlaceholder) {
    return { kind: 'parityPlaceholder', placeholder: parityPlaceholder };
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
    return { kind: 'addonsUnknown', pathLabel: UNKNOWN_ADDONS_PATH };
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

  const localPlayerRoute = parseLocalPlayerRoute(path);

  if (localPlayerRoute) {
    return localPlayerRoute;
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

  if (isThumbsUpRoutePath(path)) {
    return { kind: 'primary', route: THUMBS_UP_PRIMARY_ROUTE };
  }

  return { kind: 'settingsUnknown', pathLabel: normalizePathLabel(path, '/[redacted]') };
}

export function resolveKodiWebinterfacePackageBasePath(pathname: unknown): string {
  const normalized = normalizePathnameInput(pathname);
  const markerIndex = normalized.indexOf(KODI_WEBINTERFACE_ADDON_SEGMENT);

  if (markerIndex < 0) {
    return '';
  }

  const markerEnd = markerIndex + KODI_WEBINTERFACE_ADDON_SEGMENT.length;
  const suffix = normalized.slice(markerEnd);

  if (suffix !== '' && !suffix.startsWith('/')) {
    return '';
  }

  return normalizePackageBasePath(normalized.slice(0, markerEnd));
}

export function buildAppRoute(route: AppRoute, options: BuildAppRouteOptions = {}): string {
  return buildPackageAwareRoutePath(buildAppRoutePath(route), options);
}

export function createKodiPackageRouteBuildOptions(
  options: KodiPackageRouteBuildOptions = {}
): BuildAppRouteOptions {
  const packageBasePath = normalizePackageBasePath(options.packageBasePath);

  return packageBasePath
    ? {
        packageBasePath,
        packageSearch: options.packageSearch,
        routeMode: 'hash'
      }
    : { packageBasePath: '' };
}

export function buildPrimaryAppRoute(
  route: PrimaryRoute,
  options: BuildAppRouteOptions = {}
): string {
  return buildPackageAwareRoutePath(buildPrimaryRoutePath(route), options);
}

export function buildKodiPackageSafePrimaryAppRoute(
  route: PrimaryRoute,
  options: BuildAppRouteOptions = {}
): string {
  if (isKodiPackagePathMode(options) && !isKodiPackageStaticPrimaryRoute(route)) {
    return buildPackageAwareRoutePath(buildPrimaryRoutePath(route), {
      ...options,
      routeMode: 'hash'
    });
  }

  const path = isKodiPackagePathMode(options)
    ? buildKodiPackageSafePrimaryRoutePath(route)
    : buildPrimaryRoutePath(route);
  return buildPackageAwareRoutePath(path, options);
}

export function buildKodiPackageSafeVideoAppRoute(
  route: VideoRoute,
  options: BuildAppRouteOptions = {}
): string {
  const path = buildVideoRoute(route);
  if (isKodiPackagePathMode(options)) {
    return buildPackageAwareRoutePath(path, { ...options, routeMode: 'hash' });
  }

  return buildPackageAwareRoutePath(path, options);
}

function isKodiPackagePathMode(options: BuildAppRouteOptions): boolean {
  return isPackagePathMode(options);
}

function isKodiPackageStaticPrimaryRoute(route: PrimaryRoute): boolean {
  switch (route.kind) {
    case 'home':
    case 'music':
    case 'musicTop':
    case 'musicArtists':
    case 'musicAlbums':
    case 'musicGenres':
    case 'musicVideos':
    case 'movies':
    case 'moviesRecent':
    case 'tvshows':
    case 'tvshowsRecent':
    case 'browser':
    case 'addonsAll':
    case 'addonsVideo':
    case 'addonsAudio':
    case 'addonsExecutable':
    case 'currentPlaylist':
    case 'playlists':
    case 'settingsWeb':
    case 'settingsKodi':
      return true;
    case 'settingsKodiSection':
      return isKodiPackageStaticSettingsSection(route.section);
    case 'settingsAddons':
    case 'settingsNav':
    case 'settingsSearch':
    case 'help':
    case 'helpOverview':
    case 'remote':
    case 'search':
    case 'lab':
    case 'labApiBrowser':
    case 'labScreenshot':
    case 'labIconBrowser':
    case 'thumbsup':
    case 'pvrTv':
    case 'pvrEpg':
    case 'pvrRadio':
    case 'pvrRecordings':
      return true;
    default:
      return false;
  }
}

function buildKodiPackageSafePrimaryRoutePath(route: PrimaryRoute): string {
  switch (route.kind) {
    case 'music':
      return '/music/home';
    case 'movies':
      return '/movies/all';
    case 'tvshows':
      return '/tvshows/all';
    case 'settingsKodi':
      return '/settings/kodi/home';
    case 'settingsKodiSection':
      return isKodiPackageStaticSettingsSection(route.section)
        ? `/settings/kodi/${route.section}`
        : buildPrimaryRoutePath(route);
    case 'help':
      return '/help/about';
    case 'lab':
      return '/lab/home';
    default:
      return buildPrimaryRoutePath(route);
  }
}

function isKodiPackageStaticSettingsSection(section: string): boolean {
  return ['games', 'interface', 'media', 'player', 'pvr', 'services', 'system'].includes(section);
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

  if (route.kind === 'addonsUnknown') {
    return normalizePathLabel(route.pathLabel || UNKNOWN_ADDONS_PATH, UNKNOWN_ADDONS_PATH);
  }

  if (route.kind === 'nowPlaying') {
    return NOW_PLAYING_PATH;
  }

  if (route.kind === 'localPlayer') {
    return buildLocalPlayerRoutePath(route);
  }

  if (route.kind === 'parityPlaceholder') {
    return normalizeParityPlaceholderRoutePath(route.placeholder);
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

export function getParityPlaceholderMetadata(id: string): ParityRoutePlaceholder | undefined {
  return PARITY_PLACEHOLDERS_BY_ID.get(id);
}

export function getParityPlaceholderMetadataTable(): readonly ParityRoutePlaceholder[] {
  return PARITY_PLACEHOLDER_DEFINITIONS;
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

function parseVideoAliasRoute(path: string): AppRoute | null {
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
      : malformedVideoAliasRoute();
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

    return malformedVideoAliasRoute();
  }

  return null;
}

function malformedVideoAliasRoute(): AppRoute {
  return { kind: 'settingsUnknown', pathLabel: '/[redacted]' };
}

function parseParityPlaceholderRoute(path: string): ParityRoutePlaceholder | null {
  const direct = PARITY_PLACEHOLDERS_BY_ROUTE_PATH.get(path);

  if (direct) {
    return direct;
  }

  return null;
}

function normalizeParityPlaceholderRoutePath(placeholder: ParityRoutePlaceholder): string {
  return PARITY_PLACEHOLDERS_BY_ID.get(placeholder.id)?.routePath ?? ROOT_PATH;
}

function normalizeUnknownLabPathLabel(pathname: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return UNKNOWN_LAB_PATH;
  }

  return hasUnsafePathPayload(normalized, 1)
    ? UNKNOWN_LAB_PATH
    : normalizePathLabel(normalized, UNKNOWN_LAB_PATH);
}

function normalizeUnknownNowPlayingPathLabel(pathname: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return `${NOW_PLAYING_PATH}/${UNSAFE_SEGMENT}`;
  }

  return hasUnsafePathPayload(normalized, 1)
    ? `${NOW_PLAYING_PATH}/${UNSAFE_SEGMENT}`
    : normalizePathLabel(normalized, `${NOW_PLAYING_PATH}/${UNSAFE_SEGMENT}`);
}

function isRouteLike(route: unknown): route is Record<string, unknown> {
  return typeof route === 'object' && route !== null && 'kind' in route;
}
