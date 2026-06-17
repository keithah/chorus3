import {
  KODI_WEBINTERFACE_BASE_PATH,
  parseAppRoute,
  resolveKodiWebinterfacePackageBasePath,
  type AppRoute
} from './appRouter';
import { parseNowPlayingRouteQuery } from './nowPlayingRouteQuery';
import type { SavedKodiHost } from '../stores';
import type { LocaleStoreSnapshot } from '$lib/stores/locale.svelte';

const KODI_WEBINTERFACE_MARKER_NAME = 'chorus3:kodi-webinterface';

export interface EntrypointEnv {
  DEV?: boolean;
  MODE?: string;
}

export interface EntrypointLocation {
  pathname?: unknown;
  search?: unknown;
  hash?: unknown;
  protocol?: unknown;
  hostname?: unknown;
  port?: unknown;
}

interface EntrypointContext {
  route: AppRoute;
  nowPlayingRouteQuery?: ReturnType<typeof parseNowPlayingRouteQuery>;
}

export type BaseEntrypointAppProps = {
  route: AppRoute;
  packageMountedHost?: SavedKodiHost | null;
  packageBasePath?: string;
  nowPlayingRouteQuery?: ReturnType<typeof parseNowPlayingRouteQuery>;
  localeSnapshot?: LocaleStoreSnapshot;
};

export function shouldUseM003BrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  return shouldUseBrowserProofFixtures(location, env, 'm003-browser-proof');
}

export function shouldUseM004BrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  return shouldUseBrowserProofFixtures(location, env, 'm004-browser-proof');
}

export function shouldUseM005BrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  return shouldUseBrowserProofFixtures(location, env, 'm005-browser-proof');
}

export function shouldUseM007VisualProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  return shouldUseBrowserProofFixtures(location, env, 'm007-visual-proof');
}

export function resolveEntrypointRoute(
  location: EntrypointLocation | null | undefined = globalThis.window?.location
): AppRoute {
  return resolveEntrypointContext(location).route;
}

function resolveEntrypointContext(
  location: EntrypointLocation | null | undefined = globalThis.window?.location
): EntrypointContext {
  try {
    const routeLocation = resolveHashRouteLocation(location);
    const packageBasePath =
      resolveKodiWebinterfacePackageBasePath(location?.pathname) || KODI_WEBINTERFACE_BASE_PATH;
    const route = parseAppRoute(routeLocation.pathname, routeLocation.search, {
      packageBasePath
    });
    return route.kind === 'nowPlaying'
      ? { route, nowPlayingRouteQuery: parseNowPlayingRouteQuery(routeLocation.search) }
      : { route };
  } catch {
    return { route: { kind: 'dashboard' } };
  }
}

function resolveHashRouteLocation(
  location: EntrypointLocation | null | undefined
): Pick<EntrypointLocation, 'pathname' | 'search'> {
  const pathname = location?.pathname;
  const packageBasePath = resolveKodiWebinterfacePackageBasePath(pathname);
  const hashRoute = parseHashRoute(location?.hash);
  if (packageBasePath && hashRoute) {
    return hashRoute;
  }

  if (packageBasePath && normalizeEntrypointPath(pathname) !== packageBasePath) {
    return { pathname, search: location?.search };
  }

  const normalizedPathname = normalizeEntrypointPath(pathname);
  if (hashRoute && (normalizedPathname === '/' || normalizedPathname === '/index.html')) {
    return hashRoute;
  }

  return { pathname: location?.pathname, search: location?.search };
}

function normalizeEntrypointPath(pathname: unknown): string {
  if (typeof pathname !== 'string' || pathname.trim() === '') {
    return '/';
  }

  const path = pathname.trim().replace(/\/+$/u, '');
  return path || '/';
}

function parseHashRoute(hash: unknown): Pick<EntrypointLocation, 'pathname' | 'search'> | null {
  if (typeof hash !== 'string' || hash.length <= 1) {
    return null;
  }

  const raw = hash.slice(1).trim();
  if (!raw) {
    return { pathname: '/', search: '' };
  }

  const [path = '', query = ''] = raw.split('?', 2);
  return {
    pathname: path.startsWith('/') ? path : `/${path}`,
    search: query ? `?${query}` : ''
  };
}

function shouldUseBrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv,
  key: string
): boolean {
  if (!env.DEV && env.MODE !== 'test') {
    return false;
  }

  try {
    const search = location?.search;

    if (typeof search !== 'string' || !search) {
      return false;
    }

    return new URLSearchParams(search).get(key) === '1';
  } catch {
    return false;
  }
}

export function resolveBaseEntrypointAppProps(
  location: EntrypointLocation | null | undefined = globalThis.window?.location
): BaseEntrypointAppProps {
  const context = resolveEntrypointContext(location);
  const { route } = context;
  const nowPlayingRouteProps = context.nowPlayingRouteQuery
    ? {
        nowPlayingRouteQuery: context.nowPlayingRouteQuery,
        ...(context.nowPlayingRouteQuery.locale
          ? { localeSnapshot: { locale: context.nowPlayingRouteQuery.locale } }
          : {})
      }
    : {};

  return {
    route,
    ...nowPlayingRouteProps,
    ...createPackageMountedHostProps(location),
    ...createPackageBasePathProps(location)
  };
}

function createPackageBasePathProps(
  location: EntrypointLocation | null | undefined
): Partial<Pick<BaseEntrypointAppProps, 'packageBasePath'>> {
  const packageBasePath = resolveKodiWebinterfacePackageBasePath(location?.pathname);
  return packageBasePath ? { packageBasePath } : {};
}

function createPackageMountedHostProps(
  location: EntrypointLocation | null | undefined
): Partial<Pick<BaseEntrypointAppProps, 'packageMountedHost'>> {
  const host = createPackageMountedHost(location);
  return host ? { packageMountedHost: host } : {};
}

function createPackageMountedHost(
  location: EntrypointLocation | null | undefined
): SavedKodiHost | null {
  if (!isKodiPackageEntrypoint(location?.pathname)) {
    return null;
  }

  if (typeof location?.hostname !== 'string' || location.hostname.trim() === '') {
    return null;
  }

  const useTls = location.protocol === 'https:';
  const port = parseOriginPort(location.port, useTls);

  return {
    id: 'kodi-package-origin',
    label: 'This Kodi',
    host: location.hostname,
    port,
    useTls,
    useWebSocket: false
  };
}

function isKodiPackageEntrypoint(pathname: unknown): boolean {
  if (isPackageMountedPath(pathname)) {
    return true;
  }

  return isRootPath(pathname) && hasKodiWebinterfaceMarker();
}

function isPackageMountedPath(pathname: unknown): boolean {
  return resolveKodiWebinterfacePackageBasePath(pathname) !== '';
}

function isRootPath(pathname: unknown): boolean {
  return typeof pathname === 'string' && (pathname.trim() === '' || pathname === '/');
}

function hasKodiWebinterfaceMarker(): boolean {
  try {
    return (
      globalThis.document
        ?.querySelector(`meta[name="${KODI_WEBINTERFACE_MARKER_NAME}"]`)
        ?.getAttribute('content') === 'webinterface.chorus3'
    );
  } catch {
    return false;
  }
}

function parseOriginPort(port: unknown, useTls: boolean): number {
  if (typeof port === 'string' && port.trim() !== '') {
    const parsed = Number(port);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535) {
      return parsed;
    }
  }

  return useTls ? 443 : 80;
}
