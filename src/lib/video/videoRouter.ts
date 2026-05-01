export type DashboardRoute = { kind: 'dashboard' };
export type VideoMoviesRoute = { kind: 'videoMovies' };
export type VideoMovieDetailRoute = { kind: 'videoMovieDetail'; movieid: number };
export type VideoMovieStreamRoute = { kind: 'videoMovieStream'; movieid: number };
export type VideoTvShowsRoute = { kind: 'videoTvShows' };
export type VideoTvShowDetailRoute = { kind: 'videoTvShowDetail'; tvshowid: number };
export type VideoTvSeasonDetailRoute = {
  kind: 'videoTvSeasonDetail';
  tvshowid: number;
  season: number;
};
export type VideoEpisodeDetailRoute = {
  kind: 'videoEpisodeDetail';
  tvshowid: number;
  season: number;
  episodeid: number;
};
export type VideoUnknownRoute = { kind: 'videoUnknown'; pathLabel: string };

export type VideoRoute =
  | DashboardRoute
  | VideoMoviesRoute
  | VideoMovieDetailRoute
  | VideoMovieStreamRoute
  | VideoTvShowsRoute
  | VideoTvShowDetailRoute
  | VideoTvSeasonDetailRoute
  | VideoEpisodeDetailRoute
  | VideoUnknownRoute;

export interface VideoRouteHistory {
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
}

export interface NavigateVideoRouteOptions {
  history?: VideoRouteHistory | null;
}

const ROOT_PATH = '/';
const MOVIES_PATH = '/video/movies';
const TV_PATH = '/video/tv';
const UNKNOWN_VIDEO_PATH = '/video/unknown';
const UNSAFE_SEGMENT = '[redacted]';
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

export function parseVideoRoute(pathname: unknown, search?: unknown): VideoRoute {
  void normalizeSearch(search);

  const path = normalizePathnameInput(pathname);

  if (path === ROOT_PATH) {
    return { kind: 'dashboard' };
  }

  if (path === MOVIES_PATH) {
    return { kind: 'videoMovies' };
  }

  if (path === TV_PATH) {
    return { kind: 'videoTvShows' };
  }

  if (path.startsWith('/video/')) {
    return parseVideoPath(path);
  }

  return { kind: 'videoUnknown', pathLabel: normalizePathLabel(path) };
}

export function buildVideoRoute(route: VideoRoute): string {
  if (!isRouteLike(route)) {
    return UNKNOWN_VIDEO_PATH;
  }

  if (route.kind === 'dashboard') {
    return ROOT_PATH;
  }

  if (route.kind === 'videoMovies') {
    return MOVIES_PATH;
  }

  if (route.kind === 'videoTvShows') {
    return TV_PATH;
  }

  if (route.kind === 'videoMovieDetail') {
    return isFinitePositiveSafeInteger(route.movieid)
      ? `${MOVIES_PATH}/${route.movieid}`
      : UNKNOWN_VIDEO_PATH;
  }

  if (route.kind === 'videoMovieStream') {
    return isFinitePositiveSafeInteger(route.movieid)
      ? `${MOVIES_PATH}/${route.movieid}/stream`
      : UNKNOWN_VIDEO_PATH;
  }

  if (route.kind === 'videoTvShowDetail') {
    return buildVideoTvShowRoute(route.tvshowid);
  }

  if (route.kind === 'videoTvSeasonDetail') {
    return buildVideoSeasonRoute(route.tvshowid, route.season);
  }

  if (route.kind === 'videoEpisodeDetail') {
    return buildVideoEpisodeRoute(route.tvshowid, route.season, route.episodeid);
  }

  if (route.kind === 'videoUnknown') {
    return normalizePathLabel(route.pathLabel || UNKNOWN_VIDEO_PATH);
  }

  return UNKNOWN_VIDEO_PATH;
}

export function buildVideoTvRoute(): string {
  return TV_PATH;
}

export function buildVideoTvShowRoute(tvshowid: number): string {
  return isFinitePositiveSafeInteger(tvshowid) ? `${TV_PATH}/${tvshowid}` : UNKNOWN_VIDEO_PATH;
}

export function buildVideoSeasonRoute(tvshowid: number, season: number): string {
  return isFinitePositiveSafeInteger(tvshowid) && isFinitePositiveSafeInteger(season)
    ? `${TV_PATH}/${tvshowid}/seasons/${season}`
    : UNKNOWN_VIDEO_PATH;
}

export function buildVideoEpisodeRoute(
  tvshowid: number,
  season: number,
  episodeid: number
): string {
  return isFinitePositiveSafeInteger(tvshowid) &&
    isFinitePositiveSafeInteger(season) &&
    isFinitePositiveSafeInteger(episodeid)
    ? `${TV_PATH}/${tvshowid}/seasons/${season}/episodes/${episodeid}`
    : UNKNOWN_VIDEO_PATH;
}

export function isVideoRoute(route: unknown): route is Exclude<VideoRoute, DashboardRoute> {
  if (!isRouteLike(route)) {
    return false;
  }

  if (
    route.kind === 'videoMovies' ||
    route.kind === 'videoTvShows' ||
    route.kind === 'videoUnknown'
  ) {
    return true;
  }

  if (route.kind === 'videoTvShowDetail') {
    return isFinitePositiveSafeInteger(route.tvshowid);
  }

  if (route.kind === 'videoTvSeasonDetail') {
    return isFinitePositiveSafeInteger(route.tvshowid) && isFinitePositiveSafeInteger(route.season);
  }

  if (route.kind === 'videoEpisodeDetail') {
    return (
      isFinitePositiveSafeInteger(route.tvshowid) &&
      isFinitePositiveSafeInteger(route.season) &&
      isFinitePositiveSafeInteger(route.episodeid)
    );
  }

  return (
    (route.kind === 'videoMovieDetail' || route.kind === 'videoMovieStream') &&
    isFinitePositiveSafeInteger(route.movieid)
  );
}

export function navigateVideoRoute(
  route: VideoRoute,
  options: NavigateVideoRouteOptions = {}
): boolean {
  const history = 'history' in options ? options.history : globalThis.history;

  if (!history || typeof history.pushState !== 'function') {
    return false;
  }

  try {
    history.pushState(
      { routeKind: isRouteLike(route) ? route.kind : 'videoUnknown' },
      '',
      buildVideoRoute(route)
    );
    return true;
  } catch {
    return false;
  }
}

function parseVideoPath(path: string): VideoRoute {
  if (path === MOVIES_PATH) {
    return { kind: 'videoMovies' };
  }

  if (path === TV_PATH) {
    return { kind: 'videoTvShows' };
  }

  const segments = path.split('/').filter(Boolean);

  if (
    segments.length === 3 &&
    segments[0] === 'video' &&
    segments[1] === 'movies' &&
    isPositiveSafeIntegerSegment(segments[2])
  ) {
    return { kind: 'videoMovieDetail', movieid: Number(segments[2]) };
  }

  if (
    segments.length === 4 &&
    segments[0] === 'video' &&
    segments[1] === 'movies' &&
    isPositiveSafeIntegerSegment(segments[2]) &&
    segments[3] === 'stream'
  ) {
    return { kind: 'videoMovieStream', movieid: Number(segments[2]) };
  }

  if (
    segments.length === 3 &&
    segments[0] === 'video' &&
    segments[1] === 'tv' &&
    isPositiveSafeIntegerSegment(segments[2])
  ) {
    return { kind: 'videoTvShowDetail', tvshowid: Number(segments[2]) };
  }

  if (
    segments.length === 5 &&
    segments[0] === 'video' &&
    segments[1] === 'tv' &&
    isPositiveSafeIntegerSegment(segments[2]) &&
    segments[3] === 'seasons' &&
    isPositiveSafeIntegerSegment(segments[4])
  ) {
    return {
      kind: 'videoTvSeasonDetail',
      tvshowid: Number(segments[2]),
      season: Number(segments[4])
    };
  }

  if (
    segments.length === 7 &&
    segments[0] === 'video' &&
    segments[1] === 'tv' &&
    isPositiveSafeIntegerSegment(segments[2]) &&
    segments[3] === 'seasons' &&
    isPositiveSafeIntegerSegment(segments[4]) &&
    segments[5] === 'episodes' &&
    isPositiveSafeIntegerSegment(segments[6])
  ) {
    return {
      kind: 'videoEpisodeDetail',
      tvshowid: Number(segments[2]),
      season: Number(segments[4]),
      episodeid: Number(segments[6])
    };
  }

  return { kind: 'videoUnknown', pathLabel: normalizePathLabel(path) };
}

function normalizePathnameInput(pathname: unknown): string {
  if (pathname === null || pathname === undefined || pathname === '') {
    return ROOT_PATH;
  }

  if (typeof pathname !== 'string') {
    return UNKNOWN_VIDEO_PATH;
  }

  const pathOnly = pathname.split(/[?#]/, 1)[0]?.trim() ?? '';

  if (!pathOnly) {
    return ROOT_PATH;
  }

  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const compacted = withLeadingSlash.replace(/\/{2,}/g, '/');

  return compacted === '' ? ROOT_PATH : compacted;
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

function isPositiveSafeIntegerSegment(segment: string): boolean {
  if (!/^\d+$/.test(segment)) {
    return false;
  }

  return isFinitePositiveSafeInteger(Number(segment));
}

function isFinitePositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isRouteLike(route: unknown): route is VideoRoute {
  return typeof route === 'object' && route !== null && 'kind' in route;
}

function normalizePathLabel(pathname: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const safeSegments = segments.map(sanitizePathSegment).slice(0, 5);
  const pathLabel = `/${safeSegments.join('/')}`;

  return pathLabel === '/' ? UNKNOWN_VIDEO_PATH : pathLabel;
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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
