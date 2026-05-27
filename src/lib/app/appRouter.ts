import {
  buildVideoRoute,
  parseVideoRoute,
  type DashboardRoute,
  type VideoRoute
} from '../video/videoRouter';
import { getChorus2ParityRowById, type Chorus2ParityStatus } from './chorus2ParityLedger';
import { buildPrimaryRoutePath, parsePrimaryRoutePath, type PrimaryRoute } from './primaryRoutes';

export type AppDashboardRoute = DashboardRoute;
export type PrimaryAppRoute = { kind: 'primary'; route: PrimaryRoute };
export type SettingsRoute = { kind: 'settings' };
export type SettingsUnknownRoute = { kind: 'settingsUnknown'; pathLabel: string };
export type RemoteRoute = { kind: 'remote' };
export type AddonsRoute = { kind: 'addons' };
export type AddonDetailRoute = { kind: 'addonDetail'; addonid: string };
export type AddonsUnknownRoute = { kind: 'addonsUnknown'; pathLabel: string };
export type LabUnknownRoute = { kind: 'labUnknown'; pathLabel: string };
export type NowPlayingRoute = { kind: 'nowPlaying' };
export type LocalPlayerRoute =
  | { kind: 'localPlayer'; media: 'movie' | 'episode' | 'musicvideo'; id: number }
  | {
      kind: 'localPlayer';
      media: 'music';
      musicKind: 'artist' | 'album' | 'song';
      id: number;
    };
export type DelegatedVideoRoute = { kind: 'video'; route: Exclude<VideoRoute, DashboardRoute> };
export type ParityPlaceholderStatus = 'missing' | 'deferred' | 'intentionallyChanged';

export interface ParityRoutePlaceholder {
  readonly id: string;
  readonly ledgerIds: readonly string[];
  readonly surface: string;
  readonly title: string;
  readonly status: ParityPlaceholderStatus;
  readonly owner: string;
  readonly description: string;
  readonly recoveryRoute: string;
  readonly routePath: string;
}

export type ParityPlaceholderRoute = {
  kind: 'parityPlaceholder';
  placeholder: ParityRoutePlaceholder;
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
  | LabUnknownRoute
  | NowPlayingRoute
  | LocalPlayerRoute
  | DelegatedVideoRoute
  | ParityPlaceholderRoute;

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
  packageSearch?: unknown;
  routeMode?: 'path' | 'hash';
}

export const KODI_WEBINTERFACE_ADDON_ID = 'webinterface.chorus3';
export const KODI_WEBINTERFACE_BASE_PATH = `/addons/${KODI_WEBINTERFACE_ADDON_ID}`;
const KODI_WEBINTERFACE_ADDON_SEGMENT = `/addons/${KODI_WEBINTERFACE_ADDON_ID}`;

const ROOT_PATH = '/';
const SETTINGS_PATH = '/settings';
const REMOTE_PATH = '/remote';
const ADDONS_PATH = '/addons';
const LAB_PATH = '/lab';
const NOW_PLAYING_PATH = '/now-playing';
const LOCAL_PLAYER_PATH = '/local-player';
const UNKNOWN_SETTINGS_PATH = '/settings/unknown';
const UNKNOWN_ADDONS_PATH = '/addons/[redacted]';
const UNKNOWN_LAB_PATH = '/lab/[redacted]';
const UNSAFE_SEGMENT = '[redacted]';
const MAX_SAFE_PATH_SEGMENT_LENGTH = 128;
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

const PARITY_PLACEHOLDER_DEFINITIONS: readonly ParityRoutePlaceholder[] = [];

const PARITY_PLACEHOLDERS_BY_ID = new Map(
  PARITY_PLACEHOLDER_DEFINITIONS.map((placeholder) => [placeholder.id, placeholder])
);
const PARITY_PLACEHOLDERS_BY_ROUTE_PATH = new Map(
  PARITY_PLACEHOLDER_DEFINITIONS.map((placeholder) => [placeholder.routePath, placeholder])
);

validateParityPlaceholderLedgerIds();

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
  const path = buildAppRoutePath(route);
  const packageBasePath = normalizePackageBasePath(options.packageBasePath);
  if (options.routeMode === 'hash') {
    return `${packageHashBasePath(packageBasePath, options.packageSearch)}${toHashRoute(path)}`;
  }

  return packageBasePath ? prefixPackageBasePath(path, packageBasePath) : path;
}

export function buildPrimaryAppRoute(
  route: PrimaryRoute,
  options: BuildAppRouteOptions = {}
): string {
  const path = buildPrimaryRoutePath(route);
  return buildPathWithOptions(path, options);
}

export function buildKodiPackageSafePrimaryAppRoute(
  route: PrimaryRoute,
  options: BuildAppRouteOptions = {}
): string {
  if (isKodiPackagePathMode(options) && !isKodiPackageStaticPrimaryRoute(route)) {
    const packageBasePath = normalizePackageBasePath(options.packageBasePath);
    return `${packageHashBasePath(packageBasePath, options.packageSearch)}${toHashRoute(
      buildPrimaryRoutePath(route)
    )}`;
  }

  const path = isKodiPackagePathMode(options)
    ? buildKodiPackageSafePrimaryRoutePath(route)
    : buildPrimaryRoutePath(route);
  return buildPathWithOptions(path, options);
}

export function buildKodiPackageSafeVideoAppRoute(
  route: VideoRoute,
  options: BuildAppRouteOptions = {}
): string {
  const path = buildVideoRoute(route);
  if (isKodiPackagePathMode(options)) {
    const packageBasePath = normalizePackageBasePath(options.packageBasePath);
    return `${packageHashBasePath(packageBasePath, options.packageSearch)}${toHashRoute(path)}`;
  }

  return buildPathWithOptions(path, options);
}

function buildPathWithOptions(path: string, options: BuildAppRouteOptions): string {
  const packageBasePath = normalizePackageBasePath(options.packageBasePath);
  if (options.routeMode === 'hash') {
    return `${packageHashBasePath(packageBasePath, options.packageSearch)}${toHashRoute(path)}`;
  }

  return packageBasePath ? prefixPackageBasePath(path, packageBasePath) : path;
}

function isKodiPackagePathMode(options: BuildAppRouteOptions): boolean {
  return options.routeMode === 'path' && normalizePackageBasePath(options.packageBasePath) !== '';
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

function parseLocalPlayerRoute(path: string): LocalPlayerRoute | null {
  if (path === LOCAL_PLAYER_PATH || !path.startsWith(`${LOCAL_PLAYER_PATH}/`)) {
    return null;
  }

  const segments = path
    .slice(LOCAL_PLAYER_PATH.length + 1)
    .split('/')
    .filter(Boolean);

  if (segments[0] === 'music') {
    const musicKind = segments[1];
    const id = parseSafeIntegerSegment(segments[2]);

    return segments.length === 3 &&
      (musicKind === 'artist' || musicKind === 'album' || musicKind === 'song') &&
      id !== null
      ? { kind: 'localPlayer', media: 'music', musicKind, id }
      : null;
  }

  const media = segments[0];
  const id = parseSafeIntegerSegment(segments[1]);

  return segments.length === 2 &&
    (media === 'movie' || media === 'episode' || media === 'musicvideo') &&
    id !== null
    ? { kind: 'localPlayer', media, id }
    : null;
}

function buildLocalPlayerRoutePath(route: LocalPlayerRoute): string {
  if (!Number.isSafeInteger(route.id) || route.id <= 0) {
    return ROOT_PATH;
  }

  if (route.media === 'music') {
    return route.musicKind === 'artist' || route.musicKind === 'album' || route.musicKind === 'song'
      ? `${LOCAL_PLAYER_PATH}/music/${route.musicKind}/${route.id}`
      : ROOT_PATH;
  }

  return route.media === 'movie' || route.media === 'episode' || route.media === 'musicvideo'
    ? `${LOCAL_PLAYER_PATH}/${route.media}/${route.id}`
    : ROOT_PATH;
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

function normalizePackageBasePath(packageBasePath: unknown): string {
  if (typeof packageBasePath !== 'string' || !packageBasePath.trim()) {
    return '';
  }

  const normalized = normalizePathnameInput(packageBasePath);
  return normalized === ROOT_PATH || normalized.includes(UNSAFE_SEGMENT) ? '' : normalized;
}

function stripPackageBasePath(pathname: string, packageBasePath: string): string {
  if (!packageBasePath) {
    return normalizeIndexFallbackPath(pathname);
  }

  if (pathname === packageBasePath) {
    return ROOT_PATH;
  }

  const stripped = pathname.startsWith(`${packageBasePath}/`)
    ? normalizePathnameInput(pathname.slice(packageBasePath.length))
    : pathname;

  return normalizeIndexFallbackPath(stripped);
}

function normalizeIndexFallbackPath(pathname: string): string {
  const path = normalizePathnameInput(pathname);
  if (path === '/index.html') {
    return ROOT_PATH;
  }

  return path.endsWith('/index.html') ? path.slice(0, -'/index.html'.length) || ROOT_PATH : path;
}

function prefixPackageBasePath(pathname: string, packageBasePath: string): string {
  const path = normalizePathnameInput(pathname);
  return path === ROOT_PATH ? packageBasePath : `${packageBasePath}${path}`;
}

function packageHashBasePath(packageBasePath: string, packageSearch?: unknown): string {
  if (!packageBasePath) {
    return '';
  }

  return `${packageBasePath}/${normalizePackageSearch(packageSearch ?? globalThis.location?.search)}`;
}

function toHashRoute(pathname: string): string {
  const path = normalizePathnameInput(pathname);
  return path === ROOT_PATH ? '#home' : `#${path.slice(1)}`;
}

function normalizePackageSearch(search: unknown): string {
  if (typeof search !== 'string') {
    return '';
  }

  const trimmed = search.trim();
  if (!trimmed || trimmed === '?' || !trimmed.startsWith('?') || trimmed.length > 128) {
    return '';
  }

  if (FORBIDDEN_SEGMENT_PATTERN.test(trimmed)) {
    return '';
  }

  return trimmed.replace(/#/gu, '');
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

  if (
    !decoded ||
    decoded.length > MAX_SAFE_PATH_SEGMENT_LENGTH ||
    FORBIDDEN_SEGMENT_PATTERN.test(decoded) ||
    decoded.includes('/')
  ) {
    return UNSAFE_SEGMENT;
  }

  if (!/^[a-z0-9._-]+$/i.test(decoded)) {
    return UNSAFE_SEGMENT;
  }

  return decoded;
}

function validateParityPlaceholderLedgerIds(): void {
  for (const placeholder of PARITY_PLACEHOLDER_DEFINITIONS) {
    for (const ledgerId of placeholder.ledgerIds) {
      const row = getChorus2ParityRowById(ledgerId);

      if (!row) {
        throw new Error(
          `Missing classic parity ledger row for placeholder ${placeholder.id}: ${ledgerId}`
        );
      }

      if (row.owner !== placeholder.owner) {
        throw new Error(
          `classic placeholder ${placeholder.id} owner ${placeholder.owner} does not match ledger row ${ledgerId} owner ${row.owner}`
        );
      }

      if (toPlaceholderStatus(row.status) !== placeholder.status) {
        throw new Error(
          `classic placeholder ${placeholder.id} status ${placeholder.status} does not match ledger row ${ledgerId} status ${row.status}`
        );
      }
    }
  }
}

function toPlaceholderStatus(status: Chorus2ParityStatus): ParityPlaceholderStatus {
  if (status === 'missing' || status === 'deferred') {
    return status;
  }

  if (status === 'out-of-scope') {
    return 'intentionallyChanged';
  }

  throw new Error(`Unsupported classic placeholder status: ${status}`);
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
