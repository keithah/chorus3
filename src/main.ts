import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import {
  createM003BrowserProofAppProps,
  type M003BrowserProofAppProps
} from './lib/testing/m003BrowserProofFixtures';
import {
  createM004BrowserProofAppProps,
  type M004BrowserProofAppProps
} from './lib/testing/m004BrowserProofFixtures';
import {
  createM005BrowserProofAppProps,
  type M005BrowserProofAppProps
} from './lib/testing/m005BrowserProofFixtures';
import {
  createM007VisualProofAppProps,
  type M007VisualProofAppProps
} from './lib/testing/m007VisualProofFixtures';
import { applyTheme, resolveInitialTheme } from './lib/theme/theme';
import {
  KODI_WEBINTERFACE_BASE_PATH,
  parseAppRoute,
  resolveKodiWebinterfacePackageBasePath,
  type AppRoute
} from './lib/app/appRouter';
import { parseNowPlayingEmbedQuery } from './lib/app/nowPlayingEmbedQuery';
import type { SavedKodiHost } from './lib/stores';
import type { VideoRoute } from './lib/video/videoRouter';

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
  nowPlayingEmbedQuery?: ReturnType<typeof parseNowPlayingEmbedQuery>;
}

type AppProps = { route: AppRoute; packageMountedHost?: SavedKodiHost | null } & Partial<
  Omit<
    M003BrowserProofAppProps &
      M004BrowserProofAppProps &
      M005BrowserProofAppProps &
      M007VisualProofAppProps,
    'route'
  >
> & { packageBasePath?: string };

const canLoadM003BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM004BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM005BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM007VisualProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';

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
      ? { route, nowPlayingEmbedQuery: parseNowPlayingEmbedQuery(routeLocation.search) }
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

export function resolveEntrypointAppProps(
  location: EntrypointLocation | null | undefined = globalThis.window?.location,
  env: EntrypointEnv = import.meta.env
): AppProps {
  const context = resolveEntrypointContext(location);
  const { route } = context;
  const nowPlayingBaseProps = context.nowPlayingEmbedQuery
    ? {
        nowPlayingEmbedQuery: context.nowPlayingEmbedQuery,
        ...(context.nowPlayingEmbedQuery.locale
          ? { localeSnapshot: { locale: context.nowPlayingEmbedQuery.locale } }
          : {})
      }
    : {};

  if (canLoadM007VisualProofFixtures && shouldUseM007VisualProofFixtures(location, env)) {
    return createM007VisualProofAppProps(location);
  }

  if (canLoadM004BrowserProofFixtures && shouldUseM004BrowserProofFixtures(location, env)) {
    const props = createM004BrowserProofAppProps(location);
    return { ...props, route: toAppRoute(props.route) };
  }

  if (canLoadM003BrowserProofFixtures && shouldUseM003BrowserProofFixtures(location, env)) {
    return { route, ...createM003BrowserProofAppProps() };
  }

  if (canLoadM005BrowserProofFixtures && shouldUseM005BrowserProofFixtures(location, env)) {
    const props = createM005BrowserProofAppProps(location);
    return props.settingsSnapshot || props.addonsSnapshot || props.nowPlayingEmbedQuery
      ? props
      : { route, ...nowPlayingBaseProps };
  }

  return {
    route,
    ...nowPlayingBaseProps,
    ...createPackageMountedHostProps(location),
    ...createPackageBasePathProps(location)
  };
}

function createPackageBasePathProps(
  location: EntrypointLocation | null | undefined
): Pick<AppProps, 'packageBasePath'> {
  const packageBasePath = resolveKodiWebinterfacePackageBasePath(location?.pathname);
  return packageBasePath ? { packageBasePath } : {};
}

function createPackageMountedHostProps(
  location: EntrypointLocation | null | undefined
): Pick<AppProps, 'packageMountedHost'> {
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

function toAppRoute(route: VideoRoute): AppRoute {
  return route.kind === 'dashboard' ? route : { kind: 'video', route };
}

const initialContext = resolveEntrypointContext(window.location);
const initialTheme =
  initialContext.nowPlayingEmbedQuery?.theme ?? resolveInitialTheme(window.localStorage);
applyTheme(initialTheme, {
  document,
  storage: initialContext.nowPlayingEmbedQuery?.theme ? null : window.localStorage
});

const target = document.getElementById('app');

if (!target) {
  throw new Error('Unable to mount chorus3: #app element was not found.');
}

const app = mount(App, {
  target,
  props: resolveEntrypointAppProps(window.location)
});

export default app;
