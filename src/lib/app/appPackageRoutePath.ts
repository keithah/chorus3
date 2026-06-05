import { normalizePathnameInput } from './appRoutePathSafety';

const ROOT_PATH = '/';
const UNSAFE_SEGMENT = '[redacted]';
const FORBIDDEN_PACKAGE_QUERY_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

export interface PackageAwareRoutePathOptions {
  packageBasePath?: unknown;
  packageSearch?: unknown;
  routeMode?: 'path' | 'hash';
}

export function normalizePackageBasePath(packageBasePath: unknown): string {
  if (typeof packageBasePath !== 'string' || !packageBasePath.trim()) {
    return '';
  }

  const normalized = normalizePathnameInput(packageBasePath);
  return normalized === ROOT_PATH || normalized.includes(UNSAFE_SEGMENT) ? '' : normalized;
}

export function routePathFromPackagePath(pathname: unknown, packageBasePath: unknown): string {
  return stripPackageBasePath(
    normalizePathnameInput(pathname),
    normalizePackageBasePath(packageBasePath)
  );
}

export function buildPackageAwareRoutePath(
  pathname: string,
  options: PackageAwareRoutePathOptions = {}
): string {
  const packageBasePath = normalizePackageBasePath(options.packageBasePath);
  if (options.routeMode === 'hash') {
    return `${packageHashBasePath(packageBasePath, options.packageSearch)}${toHashRoute(pathname)}`;
  }

  if (!packageBasePath) {
    return normalizePathnameInput(pathname);
  }

  return `${prefixPackageBasePath(pathname, packageBasePath)}${normalizePackageSearch(
    options.packageSearch
  )}`;
}

export function isPackagePathMode(options: PackageAwareRoutePathOptions): boolean {
  return options.routeMode === 'path' && normalizePackageBasePath(options.packageBasePath) !== '';
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

  if (FORBIDDEN_PACKAGE_QUERY_PATTERN.test(trimmed)) {
    return '';
  }

  return trimmed.replace(/#/gu, '');
}
