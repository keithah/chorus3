import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, sep } from 'node:path';
import { cwd } from 'node:process';

import { flushSync, mount, tick, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import App from '../../src/App.svelte';
import { preloadAppPageSurfaceRoutesForTest } from '../../src/lib/testing/appPageSurfacePreload';
import { KODI_WEBINTERFACE_BASE_PATH, parseAppRoute } from '../../src/lib/app/appRouter';
import { parseNowPlayingRouteQuery } from '../../src/lib/app/nowPlayingRouteQuery';
import {
  M007_VISUAL_PROOF_FORBIDDEN_TEXT,
  createM007VisualProofAppProps
} from '../../src/lib/testing/m007VisualProofFixtures';
import {
  collectReachableItemsWithConcurrency,
  mapWithConcurrency
} from '../../scripts/bounded-concurrency.mjs';
import { getKodiPackageRouteFallbacks } from '../../scripts/kodi-package-route-contract.mjs';

const projectRoot = cwd();
const packageRoot = join(projectRoot, 'dist/kodi/webinterface.chorus3');
const secretProbeSearch =
  '?m007-visual-proof=1&token=Basic&password=CHORUS3_SENTINEL_SECRET&next=smb://admin:p@ssword@nas/private&storage=localStorage';
const routeFallbacks = getKodiPackageRouteFallbacks();
const PROOF_ROUTE_CONCURRENCY = 4;
const PROOF_ASSET_CONCURRENCY = 6;
const PROOF_FETCH_TIMEOUT_MS = 10_000;

const routeMatrix = [
  { name: 'active-root', urlPath: '/', appPath: '/', expectedRouteKind: 'home' },
  {
    name: 'package-root',
    urlPath: `${KODI_WEBINTERFACE_BASE_PATH}/`,
    appPath: `${KODI_WEBINTERFACE_BASE_PATH}/`,
    expectedRouteKind: 'home'
  },
  ...routeFallbacks.flatMap((fallback) => [
    {
      name: `active-root-${fallback.name}`,
      urlPath: fallback.routePath,
      appPath: fallback.routePath,
      expectedRouteKind: expectedRenderedPageRouteKind(fallback.routePath)
    },
    {
      name: `package-mounted-${fallback.name}`,
      urlPath: `${KODI_WEBINTERFACE_BASE_PATH}${fallback.routePath}`,
      appPath: `${KODI_WEBINTERFACE_BASE_PATH}${fallback.routePath}`,
      expectedRouteKind: expectedRenderedPageRouteKind(fallback.routePath)
    }
  ])
] as const;

let server: Server | undefined;
let origin = '';
let mountedComponent: Record<string, unknown> | undefined;
let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;
let consoleErrors: string[] = [];
let assetFetchCache = new Map<string, Promise<{ ok: boolean; status: number; body: string }>>();

describe('M007 no-live packaged browser proof', () => {
  beforeAll(async () => {
    await preloadAppPageSurfaceRoutesForTest();
    expect(
      existsSync(packageRoot),
      `${packageRoot} must exist; run npm run package:kodi first.`
    ).toBe(true);
    assertRequiredFallbackFilesExist();

    server = createPackageStaticServer(packageRoot);
    await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Unable to allocate a local static server port for package proof.');
    }

    origin = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    unmountCurrentApp();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    consoleErrors = [];
    consoleErrorSpy = undefined;
    document.body.innerHTML = '';
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      if (!server) {
        resolve();
        return;
      }

      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('serves every active-root and package-mounted direct route with clean package assets', async () => {
    expect.assertions(routeMatrix.length * 8);
    assetFetchCache = new Map();

    await mapWithConcurrency(routeMatrix, PROOF_ROUTE_CONCURRENCY, async (route) => {
      const result = await fetchRouteAndAssets(route.urlPath);

      expect(result.status, `${route.name} route ${route.urlPath} should return HTML`).toBe(200);
      expect(result.html, `${route.name} should include the Kodi webinterface marker`).toContain(
        'chorus3:kodi-webinterface'
      );
      expect(result.html, `${route.name} should include the package base resolver`).toContain(
        'data-chorus3-kodi-base-resolver'
      );
      expect(
        result.html,
        `${route.name} should not include setup console fallback copy`
      ).not.toMatch(/Setup console|Multi-host console|Save trusted Kodi endpoints/u);
      expect(result.html, `${route.name} should not include generic not-found copy`).not.toMatch(
        /route not found|Route not found|Settings route not found|Add-ons route not found/u
      );
      expect(
        result.preBaseFailedAssets,
        `${route.name} should not expose pre-base/speculative JS/CSS/font/image failures: ${result.preBaseFailedAssets.join(', ')}`
      ).toEqual([]);
      expect(
        result.failedAssets,
        `${route.name} should not have failed JS/CSS/font/image assets: ${result.failedAssets.join(', ')}`
      ).toEqual([]);
      expect(
        result.assetCount,
        `${route.name} should prove at least one JS and one CSS asset`
      ).toBeGreaterThanOrEqual(2);
    });
  }, 60_000);

  it('mounts every direct route with shell or now-playing anchors, clean console, and redacted visible DOM', async () => {
    for (const route of routeMatrix) {
      const target = await renderRoute(route);
      const text = target.textContent ?? '';
      const links = Array.from(target.querySelectorAll('a[href]'));

      const isNowPlayingRoute = stripPackageMount(route.appPath) === '/now-playing';
      const pageSurface = target.querySelector('[data-app-page-surface]');
      const shellSurface = target.querySelector('.chorus-app');

      expect(
        pageSurface ?? shellSurface,
        `${route.name} should render a primary shell surface or now-playing route`
      ).toBeInstanceOf(HTMLElement);
      if (isNowPlayingRoute) {
        expect(
          target.querySelector('.now-playing-panel [role="status"], .now-playing-panel button'),
          `${route.name} should render Chorus now-playing status or controls`
        ).toBeInstanceOf(HTMLElement);
      } else {
        expect(links.length, `${route.name} should render navigable shell anchors`).toBeGreaterThan(
          0
        );
      }
      expect(text, `${route.name} should not render setup console copy`).not.toMatch(
        /Setup console|Multi-host console|Save trusted Kodi endpoints/u
      );
      expect(text, `${route.name} should not render generic not-found copy`).not.toMatch(
        /route not found|Route not found|Settings route not found|Add-ons route not found/u
      );
      expect(
        consoleErrors,
        `${route.name} should not emit console errors while mounting: ${consoleErrors.join('\n')}`
      ).toEqual([]);
      if (isNowPlayingRoute) {
        for (const expected of ['Now playing', 'M007 Safe Groove', 'Local player is ready']) {
          expect(text, `${route.name} should include route anchor text ${expected}`).toContain(
            expected
          );
        }
      }
      const redactionFailures = scanVisibleDomForRedactionCategories(text).filter((failure) => {
        if (stripPackageMount(route.appPath).startsWith('/help/')) {
          return !['forbidden:http://', 'forbidden:https://'].includes(failure);
        }

        return true;
      });
      expect(redactionFailures, `${route.name} visible DOM redaction scan`).toEqual([]);
      if (!isNowPlayingRoute) {
        expect(
          links.some((link) => link.getAttribute('href')?.startsWith(KODI_WEBINTERFACE_BASE_PATH)),
          `${route.name} package-mounted shell should produce package-base anchors`
        ).toBe(true);
      }

      unmountCurrentApp();
      consoleErrors = [];
      consoleErrorSpy?.mockClear();
    }
  }, 60_000);

  it('mounts local-player as the only standalone browser player surface with inert dispatches', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const packageMountedHost = {
      id: 'kodi-package-origin',
      label: 'This Kodi',
      host: '127.0.0.1',
      port: Number(new URL(origin).port),
      useTls: false,
      useWebSocket: false
    };
    const actionDispatch = {
      streamMovieItem: vi.fn().mockResolvedValue(undefined)
    };

    mountedComponent = mount(App, {
      target,
      props: {
        route: { kind: 'localPlayer', media: 'movie', id: 1 },
        packageMountedHost,
        localPlayerSnapshot: {
          status: 'idle',
          mediaKind: 'video',
          source: null,
          item: null,
          currentSeconds: 0,
          durationSeconds: null,
          volume: 100,
          muted: false,
          lastError: null,
          kodiPausedForLocal: false,
          resumeAvailable: false,
          lastUpdatedAt: null
        },
        playerDispatch: createM007VisualProofAppProps({
          pathname: '/now-playing',
          search: secretProbeSearch
        }).playerDispatch,
        localBrowserPlayerActionDispatch: actionDispatch
      }
    }) as Record<string, unknown>;

    flushSync();
    await tick();

    expect(actionDispatch.streamMovieItem).toHaveBeenCalledWith({ movieid: 1 });
    expect(target.querySelector('.local-browser-player')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.local-media-runtime')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('#download')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('#stream')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('#switch-player')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.chorus-app')).toBeNull();
    expect(target.querySelector('.classic-rail')).toBeNull();
  });
});

function createPackageStaticServer(root: string): Server {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const resolved = resolvePackageRequestPath(root, url.pathname);

    if (!resolved) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': contentTypeFor(resolved) });
    createReadStream(resolved).pipe(response);
  });
}

function resolvePackageRequestPath(root: string, pathname: string): string | null {
  const packageRelativePath = stripPackageMount(pathname);
  const normalizedPath = packageRelativePath.replace(/^\/+/, '');
  const candidates =
    normalizedPath.endsWith('/') || normalizedPath === ''
      ? [join(root, normalizedPath, 'index.html')]
      : [join(root, normalizedPath), join(root, normalizedPath, 'index.html')];

  for (const candidate of candidates) {
    if (isPathInside(root, candidate) && existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function stripPackageMount(pathname: string): string {
  if (pathname === KODI_WEBINTERFACE_BASE_PATH) {
    return '/';
  }

  if (pathname.startsWith(`${KODI_WEBINTERFACE_BASE_PATH}/`)) {
    return pathname.slice(KODI_WEBINTERFACE_BASE_PATH.length) || '/';
  }

  return pathname;
}

function isPathInside(root: string, candidate: string): boolean {
  const normalizedRoot = normalize(root);
  const normalizedCandidate = normalize(candidate);
  const pathFromRoot = relative(normalizedRoot, normalizedCandidate);

  return (
    pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !pathFromRoot.includes(`..${sep}`))
  );
}

function contentTypeFor(path: string): string {
  switch (extname(path)) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.svg':
      return 'image/svg+xml';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

async function fetchRouteAndAssets(urlPath: string): Promise<{
  status: number;
  html: string;
  assetCount: number;
  failedAssets: string[];
  preBaseFailedAssets: string[];
}> {
  const routeUrl = new URL(urlPath, origin);
  const routeResponse = await fetchWithTimeout(routeUrl);
  const html = await routeResponse.text();

  if (!routeResponse.ok) {
    return {
      status: routeResponse.status,
      html,
      assetCount: 0,
      failedAssets: [`route:${urlPath}`],
      preBaseFailedAssets: [`route:${urlPath}`]
    };
  }

  const preBaseFailedAssets = await fetchPreBaseAssetFailures(html, routeUrl);
  const assetBaseUrl = resolveKodiBaseUrl(routeUrl);
  const failedAssets: string[] = [];
  const assetUrls = await collectReachableItemsWithConcurrency(
    extractHtmlAssetUrls(html, assetBaseUrl),
    PROOF_ASSET_CONCURRENCY,
    async (assetUrl: string) => {
      const assetLabel = classifyAsset(assetUrl);
      const assetResponse = await fetchAssetWithCache(assetUrl);

      if (!assetResponse.ok) {
        failedAssets.push(`${assetLabel}:${new URL(assetUrl).pathname}:${assetResponse.status}`);
        return [];
      }

      if (assetLabel === 'css') {
        return extractCssAssetUrls(assetResponse.body, new URL(assetUrl));
      }

      if (assetLabel === 'js') {
        return extractImportMetaAssetUrls(assetResponse.body, new URL(assetUrl));
      }

      return [];
    }
  );

  return {
    status: routeResponse.status,
    html,
    assetCount: assetUrls.length,
    failedAssets,
    preBaseFailedAssets
  };
}

function fetchAssetWithCache(
  assetUrl: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const cached = assetFetchCache.get(assetUrl);
  if (cached) return cached;

  const promise = fetchWithTimeout(assetUrl).then(async (response) => ({
    ok: response.ok,
    status: response.status,
    body: response.ok ? await response.text() : ''
  }));
  assetFetchCache.set(assetUrl, promise);
  return promise;
}

function fetchWithTimeout(input: URL | string): Promise<Response> {
  const controller = new AbortController();
  const timeoutError = new Error(`Fetch timed out after ${PROOF_FETCH_TIMEOUT_MS}ms.`);
  const timeout = setTimeout(() => {
    controller.abort(timeoutError);
  }, PROOF_FETCH_TIMEOUT_MS);
  let fallbackTimeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<Response>((_, reject) => {
    fallbackTimeout = setTimeout(() => reject(timeoutError), PROOF_FETCH_TIMEOUT_MS);
  });

  return fetch(input, { signal: controller.signal })
    .catch((error: unknown) => {
      if (error instanceof TypeError && String(error.message).includes('instance of AbortSignal')) {
        return Promise.race([fetch(input), timeoutPromise]);
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    });
}

async function fetchPreBaseAssetFailures(html: string, documentUrl: URL): Promise<string[]> {
  const results = await mapWithConcurrency(
    extractHtmlAssetUrls(html, documentUrl),
    PROOF_ASSET_CONCURRENCY,
    async (assetUrl) => {
      const response = await fetchAssetWithCache(assetUrl);

      return response.ok
        ? null
        : `${classifyAsset(assetUrl)}:${new URL(assetUrl).pathname}:${response.status}`;
    }
  );

  return results.filter((failure): failure is string => failure !== null);
}

function resolveKodiBaseUrl(documentUrl: URL): URL {
  const pathname = documentUrl.pathname;
  const packageBase = `${KODI_WEBINTERFACE_BASE_PATH}/`;
  const basePath =
    pathname === KODI_WEBINTERFACE_BASE_PATH || pathname.startsWith(packageBase)
      ? packageBase
      : '/';

  return new URL(basePath, documentUrl.origin);
}

function extractHtmlAssetUrls(html: string, documentUrl: URL): string[] {
  const urls: string[] = [];
  const assetPattern =
    /\b(?:src|href)=(['"])([^'"]+\.(?:js|css|woff2?|svg|png|jpe?g))(?:\?[^'"]*)?\1/giu;

  for (const match of html.matchAll(assetPattern)) {
    urls.push(new URL(match[2], documentUrl).href);
  }

  return urls;
}

function extractCssAssetUrls(css: string, cssUrl: URL): string[] {
  const urls: string[] = [];
  const cssUrlPattern = /url\((['"]?)([^)'"?#]+\.(?:woff2?|svg|png|jpe?g))(?:\?[^)'"#]*)?\1\)/giu;

  for (const match of css.matchAll(cssUrlPattern)) {
    urls.push(new URL(match[2], cssUrl).href);
  }

  return urls;
}

function extractImportMetaAssetUrls(js: string, scriptUrl: URL): string[] {
  const urls: string[] = [];
  const importMetaAssetPattern =
    /new URL\((['"])([^'"]+\.(?:woff2?|svg|png|jpe?g))\1,\s*import\.meta\.url\)/giu;

  for (const match of js.matchAll(importMetaAssetPattern)) {
    urls.push(new URL(match[2], scriptUrl).href);
  }

  return urls;
}

function classifyAsset(assetUrl: string): 'css' | 'font' | 'image' | 'js' {
  const pathname = new URL(assetUrl).pathname;

  if (/\.css$/iu.test(pathname)) {
    return 'css';
  }

  if (/\.js$/iu.test(pathname)) {
    return 'js';
  }

  if (/\.woff2?$/iu.test(pathname)) {
    return 'font';
  }

  return 'image';
}

async function renderRoute(route: (typeof routeMatrix)[number]): Promise<HTMLElement> {
  consoleErrors = [];
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args.map((arg) => String(arg)).join(' '));
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 200 }))
  );

  window.history.replaceState(null, '', `${route.appPath}${secretProbeSearch}`);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = createRouteProps(route.appPath);
  assertPackageProofRouteParsed(props.route, route.name);

  mountedComponent = mount(App, { target, props }) as Record<string, unknown>;
  flushSync();
  await tick();
  assertInitialRouteIdentity(target, route);

  return target;
}

function createRouteProps(pathname: string): Record<string, unknown> {
  const rootRelativePathname = stripPackageMount(pathname);
  const route = resolvePackageProofRoute(pathname);
  const baseProps = createM007VisualProofAppProps({ pathname, search: secretProbeSearch });
  const packageMountedHost = {
    id: 'kodi-package-origin',
    label: 'This Kodi',
    host: '127.0.0.1',
    port: Number(new URL(origin).port),
    useTls: false,
    useWebSocket: false
  };

  if (rootRelativePathname === '/now-playing') {
    return {
      ...baseProps,
      route,
      packageMountedHost,
      nowPlayingRouteQuery: parseNowPlayingRouteQuery('?theme=dark&locale=en')
    };
  }

  return {
    ...baseProps,
    route,
    packageMountedHost
  };
}

function assertInitialRouteIdentity(
  target: HTMLElement,
  route: (typeof routeMatrix)[number]
): void {
  if (route.expectedRouteKind === null) {
    return;
  }

  expect(
    target.querySelector('[data-app-page-surface]')?.getAttribute('data-app-page-route'),
    `${route.name} should initially mount the expected app page route`
  ).toBe(route.expectedRouteKind);
}

function resolvePackageProofRoute(routePath: string): unknown {
  return parseAppRoute(routePath, secretProbeSearch, {
    packageBasePath: KODI_WEBINTERFACE_BASE_PATH
  });
}

function expectedRenderedPageRouteKind(routePath: string): string | null {
  const route = resolvePackageProofRoute(routePath);

  if (!isRecord(route)) {
    return null;
  }

  if (route.kind === 'nowPlaying') {
    return null;
  }

  if (route.kind !== 'primary' || !isRecord(route.route) || typeof route.route.kind !== 'string') {
    return null;
  }

  return route.route.kind === 'labScreenshot' ? 'lab' : route.route.kind;
}

function assertPackageProofRouteParsed(route: unknown, routeName: string): void {
  expect(isRecord(route), `${routeName} should resolve through the package route parser`).toBe(
    true
  );

  if (!isRecord(route)) {
    return;
  }

  expect(
    route.kind,
    `${routeName} should resolve through the package route parser without falling back to an unknown route`
  ).not.toMatch(/Unknown$/u);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unmountCurrentApp(): void {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }
}

function assertRequiredFallbackFilesExist(): void {
  for (const fallback of routeFallbacks) {
    const fallbackPath = join(packageRoot, fallback.stagedIndexPath);
    expect(
      existsSync(fallbackPath),
      `missing generated fallback for ${fallback.name}: ${fallback.stagedIndexPath}`
    ).toBe(true);
  }
}

function scanVisibleDomForRedactionCategories(text: string): string[] {
  const failures: string[] = [];

  for (const forbidden of M007_VISUAL_PROOF_FORBIDDEN_TEXT) {
    if (text.includes(forbidden)) {
      failures.push(`forbidden:${forbidden}`);
    }
  }

  const categoryPatterns = [
    ['authorization', /Authorization\s*[:=]|\bBearer\s+|\bBasic\s+[A-Za-z0-9+/=._:-]+/iu],
    ['credential-param', /\b(?:password|passwd|token|secret|credential)=/iu],
    ['credential-word', /CHORUS3_SENTINEL_SECRET|admin:p@ssword|super-secret-password/iu],
    ['storage', /\b(?:localStorage|sessionStorage)\b/iu],
    ['raw-url', /(?:https?:|smb:|file:|special:)\/\//iu],
    ['local-path', /(?:^|\s)(?:\/(?:Users|home|Volumes|mnt|media|var|tmp)\/|[A-Za-z]:\\)/u]
  ] as const;

  for (const [category, pattern] of categoryPatterns) {
    if (pattern.test(text)) {
      failures.push(`category:${category}`);
    }
  }

  return failures;
}
