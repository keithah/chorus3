export type DashboardRoute = { kind: 'dashboard' };
export type VideoMoviesRoute = { kind: 'videoMovies' };
export type VideoMovieDetailRoute = { kind: 'videoMovieDetail'; movieid: number };
export type VideoUnknownRoute = { kind: 'videoUnknown'; pathLabel: string };

export type VideoRoute =
  | DashboardRoute
  | VideoMoviesRoute
  | VideoMovieDetailRoute
  | VideoUnknownRoute;

export interface VideoRouteHistory {
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
}

export interface NavigateVideoRouteOptions {
  history?: VideoRouteHistory | null;
}

const ROOT_PATH = '/';
const MOVIES_PATH = '/video/movies';
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

  if (route.kind === 'videoMovieDetail') {
    return isFinitePositiveSafeInteger(route.movieid)
      ? `${MOVIES_PATH}/${route.movieid}`
      : UNKNOWN_VIDEO_PATH;
  }

  if (route.kind === 'videoUnknown') {
    return normalizePathLabel(route.pathLabel || UNKNOWN_VIDEO_PATH);
  }

  return UNKNOWN_VIDEO_PATH;
}

export function isVideoRoute(route: unknown): route is Exclude<VideoRoute, DashboardRoute> {
  if (!isRouteLike(route)) {
    return false;
  }

  if (route.kind === 'videoMovies' || route.kind === 'videoUnknown') {
    return true;
  }

  return route.kind === 'videoMovieDetail' && isFinitePositiveSafeInteger(route.movieid);
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

  const hadTrailingSlash = path.endsWith('/');
  const segments = path.split('/').filter(Boolean);

  if (
    segments.length === 3 &&
    segments[0] === 'video' &&
    segments[1] === 'movies' &&
    isMovieIdSegment(segments[2])
  ) {
    return { kind: 'videoMovieDetail', movieid: Number(segments[2]) };
  }

  if (
    hadTrailingSlash &&
    segments.length === 3 &&
    segments[0] === 'video' &&
    segments[1] === 'movies' &&
    isMovieIdSegment(segments[2])
  ) {
    return { kind: 'videoMovieDetail', movieid: Number(segments[2]) };
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

function isMovieIdSegment(segment: string): boolean {
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
