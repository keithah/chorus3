import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, sep } from 'node:path';
import { cwd } from 'node:process';

import { flushSync, mount, tick, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import App from '../src/App.svelte';
import { KODI_WEBINTERFACE_BASE_PATH } from '../src/lib/app/appRouter';
import { parseNowPlayingEmbedQuery } from '../src/lib/app/nowPlayingEmbedQuery';
import {
  M007_VISUAL_PROOF_FORBIDDEN_TEXT,
  createM007VisualProofAppProps
} from '../src/lib/testing/m007VisualProofFixtures';
import { getKodiPackageRouteFallbacks } from './kodi-package-route-contract.mjs';

const projectRoot = cwd();
const packageRoot = join(projectRoot, 'dist/kodi/webinterface.chorus3');
const secretProbeSearch =
  '?m007-visual-proof=1&token=Basic&password=CHORUS3_SENTINEL_SECRET&next=smb://admin:p@ssword@nas/private&storage=localStorage';
const routeFallbacks = getKodiPackageRouteFallbacks();

const routeMatrix = [
  { name: 'active-root', urlPath: '/', appPath: '/', expectedText: ['Chorus'] },
  {
    name: 'package-root',
    urlPath: `${KODI_WEBINTERFACE_BASE_PATH}/`,
    appPath: `${KODI_WEBINTERFACE_BASE_PATH}/`,
    expectedText: ['Chorus']
  },
  ...routeFallbacks.flatMap((fallback) => [
    {
      name: `active-root-${fallback.name}`,
      urlPath: fallback.routePath,
      appPath: fallback.routePath,
      expectedText: expectedRouteText(fallback.routePath)
    },
    {
      name: `package-mounted-${fallback.name}`,
      urlPath: `${KODI_WEBINTERFACE_BASE_PATH}${fallback.routePath}`,
      appPath: `${KODI_WEBINTERFACE_BASE_PATH}${fallback.routePath}`,
      expectedText: expectedRouteText(fallback.routePath)
    }
  ])
] as const;

let server: Server | undefined;
let origin = '';
let mountedComponent: Record<string, unknown> | undefined;
let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;
let consoleErrors: string[] = [];

describe('M007 no-live packaged browser proof', () => {
  beforeAll(async () => {
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

    for (const route of routeMatrix) {
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
    }
  }, 60_000);

  it('mounts every direct route with shell or now-playing anchors, clean console, and redacted visible DOM', async () => {
    for (const route of routeMatrix) {
      const target = await renderRoute(route.appPath);
      const text = target.textContent ?? '';
      const links = Array.from(target.querySelectorAll('a[href]'));

      const isNowPlayingRoute = stripPackageMount(route.appPath) === '/now-playing';

      expect(
        target.querySelector('[data-app-page-surface], .embed-route'),
        `${route.name} should render a primary shell surface or now-playing route`
      ).toBeInstanceOf(HTMLElement);
      if (isNowPlayingRoute) {
        expect(
          target.querySelector('.embed-route [role="status"], .embed-route button'),
          `${route.name} should render now-playing status or controls`
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
      for (const expected of route.expectedText) {
        expect(text, `${route.name} should include route anchor text ${expected}`).toContain(
          expected
        );
      }
      expect(
        scanVisibleDomForRedactionCategories(text),
        `${route.name} visible DOM redaction scan`
      ).toEqual([]);
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
    response.end(readFileSync(resolved));
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
  const routeResponse = await fetch(routeUrl);
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
  const assetUrls = new Set<string>(extractHtmlAssetUrls(html, assetBaseUrl));
  const failedAssets: string[] = [];

  for (const assetUrl of Array.from(assetUrls)) {
    const assetResponse = await fetch(assetUrl);
    const assetLabel = classifyAsset(assetUrl);

    if (!assetResponse.ok) {
      failedAssets.push(`${assetLabel}:${new URL(assetUrl).pathname}:${assetResponse.status}`);
      continue;
    }

    const body = await assetResponse.text();

    if (assetLabel === 'css') {
      for (const nestedAssetUrl of extractCssAssetUrls(body, new URL(assetUrl))) {
        assetUrls.add(nestedAssetUrl);
      }
    }

    if (assetLabel === 'js') {
      for (const nestedAssetUrl of extractImportMetaAssetUrls(body, new URL(assetUrl))) {
        assetUrls.add(nestedAssetUrl);
      }
    }
  }

  return {
    status: routeResponse.status,
    html,
    assetCount: assetUrls.size,
    failedAssets,
    preBaseFailedAssets
  };
}

async function fetchPreBaseAssetFailures(html: string, documentUrl: URL): Promise<string[]> {
  const failures: string[] = [];

  for (const assetUrl of extractHtmlAssetUrls(html, documentUrl)) {
    const response = await fetch(assetUrl);

    if (!response.ok) {
      failures.push(`${classifyAsset(assetUrl)}:${new URL(assetUrl).pathname}:${response.status}`);
    }
  }

  return failures;
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

async function renderRoute(pathname: string): Promise<HTMLElement> {
  consoleErrors = [];
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args.map((arg) => String(arg)).join(' '));
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 200 }))
  );

  window.history.replaceState(null, '', `${pathname}${secretProbeSearch}`);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = createRouteProps(pathname);

  mountedComponent = mount(App, { target, props }) as Record<string, unknown>;
  flushSync();
  await tick();

  return target;
}

function createRouteProps(pathname: string): Record<string, unknown> {
  const rootRelativePathname = stripPackageMount(pathname);
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
      route: { kind: 'nowPlaying' },
      packageMountedHost,
      nowPlayingEmbedQuery: parseNowPlayingEmbedQuery('?theme=dark&locale=en'),
      nowPlayingHostSummary: { label: 'This Kodi', hasCredentials: false },
      nowPlayingRefreshDispatch: vi.fn()
    };
  }

  return { ...baseProps, packageMountedHost };
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

function expectedRouteText(routePath: string): string[] {
  if (routePath === '/now-playing') {
    return ['Now playing', 'This Kodi'];
  }

  if (routePath === '/settings/kodi/interface') {
    return ['Kodi settings section'];
  }

  if (routePath === '/addons/plugin.video.safe-demo') {
    return ['Safe Video Demo'];
  }

  if (routePath === '/music/genres') {
    return ['Genres'];
  }

  if (routePath === '/help/keyboard') {
    return ['Keyboard'];
  }

  const firstSegment = routePath.split('/').filter(Boolean)[0] ?? 'home';
  const labels: Record<string, string> = {
    addons: 'Add-ons',
    browser: 'Browser',
    files: 'Browser',
    help: 'Help',
    movies: 'Movies',
    music: 'Music',
    playlists: 'Playlists',
    remote: 'Remote',
    settings: 'Web interface',
    tvshows: 'TV shows'
  };

  return [labels[firstSegment] ?? 'Chorus'];
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
