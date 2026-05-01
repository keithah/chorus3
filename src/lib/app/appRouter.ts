import {
  buildVideoRoute,
  parseVideoRoute,
  type DashboardRoute,
  type VideoRoute
} from '../video/videoRouter';

export type AppDashboardRoute = DashboardRoute;
export type SettingsRoute = { kind: 'settings' };
export type SettingsUnknownRoute = { kind: 'settingsUnknown'; pathLabel: string };
export type AddonsRoute = { kind: 'addons' };
export type AddonDetailRoute = { kind: 'addonDetail'; addonid: string };
export type AddonsUnknownRoute = { kind: 'addonsUnknown'; pathLabel: string };
export type LabShortcutsRoute = { kind: 'labShortcuts' };
export type LabApiBrowserRoute = { kind: 'labApiBrowser' };
export type LabUnknownRoute = { kind: 'labUnknown'; pathLabel: string };
export type DelegatedVideoRoute = { kind: 'video'; route: Exclude<VideoRoute, DashboardRoute> };

export type AppRoute =
  | AppDashboardRoute
  | SettingsRoute
  | SettingsUnknownRoute
  | AddonsRoute
  | AddonDetailRoute
  | AddonsUnknownRoute
  | LabShortcutsRoute
  | LabApiBrowserRoute
  | LabUnknownRoute
  | DelegatedVideoRoute;

export interface AppRouteHistory {
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
}

export interface NavigateAppRouteOptions {
  history?: AppRouteHistory | null;
}

const ROOT_PATH = '/';
const SETTINGS_PATH = '/settings';
const ADDONS_PATH = '/addons';
const LAB_PATH = '/lab';
const LAB_SHORTCUTS_PATH = '/lab/shortcuts';
const LAB_API_BROWSER_PATH = '/lab/api-browser';
const UNKNOWN_SETTINGS_PATH = '/settings/unknown';
const UNKNOWN_ADDONS_PATH = '/addons/[redacted]';
const UNKNOWN_LAB_PATH = '/lab/[redacted]';
const UNSAFE_SEGMENT = '[redacted]';
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

export function parseAppRoute(pathname: unknown, search?: unknown): AppRoute {
  void normalizeSearch(search);

  const path = normalizePathnameInput(pathname);

  if (path === ROOT_PATH) {
    return { kind: 'dashboard' };
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

export function buildAppRoute(route: AppRoute): string {
  if (!isRouteLike(route)) {
    return ROOT_PATH;
  }

  if (route.kind === 'dashboard') {
    return ROOT_PATH;
  }

  if (route.kind === 'settings') {
    return SETTINGS_PATH;
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
