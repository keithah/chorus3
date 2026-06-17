import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  KODI_WEBINTERFACE_BASE_PATH,
  buildPrimaryAppRoute,
  parseAppRoute,
  type AppRoute
} from '../../src/lib/app/appRouter';
import { createM007VisualProofAppProps } from '../../src/lib/testing/m007VisualProofFixtures';
import { getKodiPackageRouteFallbacks } from '../../scripts/kodi-package-route-contract.mjs';
import {
  DEFAULT_PACKAGE_ROOT,
  listZipEntries,
  validateKodiPackage,
  validatePackageRouteSupport,
  runKodiPackageVerification
} from '../../scripts/verify-kodi-package.mjs';

const testRoots: string[] = [];
const SECRET_SEARCH =
  '?m007-visual-proof=1&token=Basic&password=CHORUS3_SENTINEL_SECRET&next=smb://admin:p@ssword@nas/private&storage=localStorage';

function createFixture(files: Record<string, string>): string {
  const root = join(tmpdir(), `chorus3-kodi-verify-${randomUUID()}`);
  testRoots.push(root);

  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  return root;
}

function baseFiles(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    'package.json': JSON.stringify({ name: 'chorus3', version: '1.2.3' }),
    'kodi/addon-metadata.json': JSON.stringify({
      id: DEFAULT_PACKAGE_ROOT,
      name: 'Chorus 3',
      summary: 'A modern Kodi web interface.',
      description: 'A packaged static Kodi webinterface add-on.',
      source: 'https://example.test/chorus3',
      language: 'en_GB',
      platform: 'all'
    }),
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/addon.xml`]: validAddonXml(),
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/index.html`]: validPackageHtml(),
    ...fallbackFiles(),
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.js`]: 'console.log("chorus3")',
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.css`]: ':root { color-scheme: dark; }',
    ...overrides
  };
}

function fallbackFiles(html = validPackageHtml()): Record<string, string> {
  return Object.fromEntries(
    getKodiPackageRouteFallbacks().map((fallback) => [
      `dist/kodi/${DEFAULT_PACKAGE_ROOT}/${fallback.stagedIndexPath}`,
      html
    ])
  );
}

function fallbackByName(name: string) {
  const fallback = getKodiPackageRouteFallbacks().find((entry) => entry.name === name);

  if (!fallback) {
    throw new Error(`Missing package route fallback fixture ${name}.`);
  }

  return fallback;
}

function fallbackStagePath(name: string): string {
  return fallbackByName(name).stagedIndexPath;
}

function stagedFallbackFile(name: string): string {
  return `dist/kodi/${DEFAULT_PACKAGE_ROOT}/${fallbackStagePath(name)}`;
}

function zippedFallbackFile(name: string): string {
  return `${DEFAULT_PACKAGE_ROOT}/${fallbackStagePath(name)}`;
}

function validPackageHtml() {
  return [
    '<!doctype html><html><head>',
    '<meta name="chorus3:kodi-webinterface" content="webinterface.chorus3">',
    '<script data-chorus3-kodi-base-resolver>',
    `(function () { var packageBase = '/addons/${DEFAULT_PACKAGE_ROOT}/'; document.write('<base href="' + packageBase + '">'); })();`,
    '</script>',
    '<script type="module" src="./assets/app.js"></script>',
    '<link rel="stylesheet" href="./assets/app.css">',
    '</head><body><main>Chorus 3</main></body></html>'
  ].join('');
}

function validAddonXml(
  overrides: { id?: string; name?: string; version?: string; webinterface?: boolean } = {}
) {
  const id = overrides.id ?? DEFAULT_PACKAGE_ROOT;
  const name = overrides.name ?? 'Chorus 3';
  const version = overrides.version ?? '1.2.3';
  const webinterface = overrides.webinterface ?? true;

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<addon id="${id}" name="${name}" version="${version}" provider-name="${name}">`,
    '  <requires><import addon="xbmc.json" version="6.0.0" /></requires>',
    webinterface
      ? '  <extension point="xbmc.webinterface" />'
      : '  <extension point="xbmc.service" />',
    '  <extension point="xbmc.addon.metadata">',
    '    <summary lang="en_GB">A modern Kodi web interface.</summary>',
    '    <description lang="en_GB">A packaged static Kodi webinterface add-on.</description>',
    '    <source>https://example.test/chorus3</source>',
    '    <language>en_GB</language>',
    '    <platform>all</platform>',
    '  </extension>',
    '</addon>'
  ].join('\n');
}

function validZipEntries(extra: string[] = []) {
  return [
    `${DEFAULT_PACKAGE_ROOT}/addon.xml`,
    `${DEFAULT_PACKAGE_ROOT}/index.html`,
    `${DEFAULT_PACKAGE_ROOT}/assets/app.js`,
    `${DEFAULT_PACKAGE_ROOT}/assets/app.css`,
    ...getKodiPackageRouteFallbacks().map(
      (fallback) => `${DEFAULT_PACKAGE_ROOT}/${fallback.stagedIndexPath}`
    ),
    ...extra
  ];
}

function comparableRoute(route: AppRoute): AppRoute {
  return route.kind === 'dashboard' ? { kind: 'primary', route: { kind: 'home' } } : route;
}

function parsePackageFallbackRoute(routePath: string): AppRoute {
  return comparableRoute(
    parseAppRoute(routePath, SECRET_SEARCH, {
      packageBasePath: KODI_WEBINTERFACE_BASE_PATH
    })
  );
}

function isKnownPackageFallbackRoute(route: AppRoute): boolean {
  if (
    route.kind === 'settingsUnknown' ||
    route.kind === 'addonsUnknown' ||
    route.kind === 'labUnknown'
  ) {
    return false;
  }

  return route.kind !== 'video' || route.route.kind !== 'videoUnknown';
}

afterEach(() => {
  vi.restoreAllMocks();

  for (const root of testRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('Kodi package structural verification', () => {
  it('packages built dist artifacts before validating the CLI verification contract', async () => {
    const packageBeforeValidate = vi.fn(async () => ({
      ok: true,
      lines: ['[staging] staged package from dist.']
    }));
    const validate = vi.fn(async () => ({
      ok: true,
      lines: ['[route] /addons/webinterface.chorus3/remote resolves to remote.']
    }));

    const result = await runKodiPackageVerification({
      root: '/fixture-root',
      packageBeforeValidate,
      validate
    });

    expect(result.ok).toBe(true);
    expect(packageBeforeValidate).toHaveBeenCalledWith({ root: '/fixture-root' });
    expect(validate).toHaveBeenCalledWith({ root: '/fixture-root' });
    expect(result.lines).toEqual([
      '[staging] staged package from dist.',
      '[route] /addons/webinterface.chorus3/remote resolves to remote.'
    ]);
  });

  it('fails before validation when package staging cannot be created from build output', async () => {
    const packageBeforeValidate = vi.fn(async () => ({
      ok: false,
      lines: [
        '[build-output] missing required build output dist/index.html; run npm run build before packaging.'
      ]
    }));
    const validate = vi.fn(async () => ({ ok: true, lines: [] }));

    const result = await runKodiPackageVerification({
      root: '/fixture-root',
      packageBeforeValidate,
      validate
    });

    expect(result.ok).toBe(false);
    expect(validate).not.toHaveBeenCalled();
    expect(result.lines.join('\n')).toContain('run npm run build before packaging');
  });
  it('accepts a staged package and zip listing with manifest, package-safe assets, and now-playing output', async () => {
    const root = createFixture(baseFiles());

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(true);
    expect(result.lines).toContain('[manifest] addon.xml matches webinterface.chorus3 1.2.3.');
    expect(result.lines).toContain(
      '[html-assets] index.html uses package-safe asset URLs and Kodi webinterface marker.'
    );
    expect(result.lines).toContain(
      `[archive] zip root webinterface.chorus3 contains ${validZipEntries().length} entries.`
    );
    expect(result.lines).toContain(
      `[route-fallback] ${getKodiPackageRouteFallbacks().length} staged route fallback files include safe package asset prerequisites.`
    );
    expect(result.lines).toContain(
      '[now-playing] packaged now-playing entry and route support are present.'
    );
  });

  it('rejects missing nested route fallback files with route-specific diagnostics', async () => {
    const root = createFixture(baseFiles());
    rmSync(join(root, stagedFallbackFile('settings-kodi-interface')));

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[route-fallback] settings-kodi-interface ${stagedFallbackFile('settings-kodi-interface')} is missing from staged package.`
    );
  });

  it('rejects missing route fallback zip entries with route-specific diagnostics', async () => {
    const root = createFixture(baseFiles());

    const result = await validateKodiPackage({
      root,
      zipEntries: validZipEntries().filter((entry) => entry !== zippedFallbackFile('help-keyboard'))
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[route-fallback] help-keyboard ${zippedFallbackFile('help-keyboard')} is missing from zip.`
    );
  });

  it('rejects route fallback HTML with missing or reordered base resolver before assets', async () => {
    const root = createFixture(
      baseFiles({
        [stagedFallbackFile('settings-kodi-interface')]: [
          '<!doctype html><html><head>',
          '<meta name="chorus3:kodi-webinterface" content="webinterface.chorus3">',
          '<script type="module" src="./assets/app.js"></script>',
          '<script data-chorus3-kodi-base-resolver></script>',
          '</head></html>'
        ].join('')
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[route-fallback] settings-kodi-interface ${stagedFallbackFile('settings-kodi-interface')} places the Kodi package base resolver after asset tags.`
    );
  });

  it('rejects static root-absolute asset references in route fallback HTML without echoing raw paths', async () => {
    const root = createFixture(
      baseFiles({
        [stagedFallbackFile('help-keyboard')]: validPackageHtml().replace(
          './assets/app.js',
          '/assets/app.js?token=secret-value'
        )
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[route-fallback] help-keyboard ${stagedFallbackFile('help-keyboard')} must not reference root-absolute /assets URLs.`
    );
    expect(result.lines.join('\n')).not.toContain('secret-value');
  });

  it('keeps high-risk now-playing and settings route fallbacks mechanically checked', async () => {
    const root = createFixture(baseFiles());
    rmSync(join(root, stagedFallbackFile('now-playing')));
    rmSync(join(root, stagedFallbackFile('settings-kodi-interface')));

    const result = await validateKodiPackage({
      root,
      zipEntries: validZipEntries().filter(
        (entry) =>
          entry !== zippedFallbackFile('now-playing') &&
          entry !== zippedFallbackFile('settings-kodi-interface')
      )
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[route-fallback] now-playing ${stagedFallbackFile('now-playing')} is missing from staged package.`
    );
    expect(result.lines.join('\n')).toContain(
      `[route-fallback] settings-kodi-interface ${stagedFallbackFile('settings-kodi-interface')} is missing from staged package.`
    );
  });

  it('rejects missing manifest and missing staged package outputs with actionable paths', async () => {
    const root = createFixture(baseFiles());
    rmSync(join(root, 'dist/kodi/webinterface.chorus3/addon.xml'));

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[manifest] dist/kodi/webinterface.chorus3/addon.xml is missing'
    );
  });

  it('rejects malformed manifests, wrong metadata, and bad webinterface extension points', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/addon.xml`]: validAddonXml({
          id: 'webinterface.other',
          webinterface: false
        })
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[manifest] dist/kodi/webinterface.chorus3/addon.xml id must be webinterface.chorus3'
    );
    expect(result.lines.join('\n')).toContain(
      '[manifest] dist/kodi/webinterface.chorus3/addon.xml must include extension point xbmc.webinterface'
    );
  });

  it('rejects root-absolute asset URLs in index.html', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/index.html`]:
          '<script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[html-assets] dist/kodi/webinterface.chorus3/index.html must not reference root-absolute /assets URLs'
    );
  });

  it('rejects package-escaping classic asset references in staged HTML without echoing raw content', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/index.html`]:
          '<!doctype html><meta name="chorus3:kodi-webinterface" content="webinterface.chorus3"><script type="module" src="./assets/app.js"></script><img src="/classic-assets/themes/base/images/logo.png?token=secret-value">'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[html-assets] dist/kodi/webinterface.chorus3/index.html must not reference root-absolute /classic-assets package-escaping assets.'
    );
    expect(result.lines.join('\n')).not.toContain('secret-value');
    expect(result.lines.join('\n')).not.toContain('logo.png?token');
  });

  it('rejects package-escaping asset references in staged JavaScript and CSS while allowing relative Vite assets', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.js`]:
          'const logo = "/classic-assets/themes/base/images/logo.png"; const ok = "./assets/chunk.js";',
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.css`]:
          '@font-face { src: url("/fonts/opensans.woff2"); } .ok { background: url("../assets/bg.png"); }'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[bundle-assets] dist/kodi/webinterface.chorus3/assets/app.js must not reference root-absolute /classic-assets package-escaping assets.'
    );
    expect(result.lines.join('\n')).toContain(
      '[bundle-assets] dist/kodi/webinterface.chorus3/assets/app.css must not reference root-absolute /fonts package-escaping assets.'
    );
    expect(result.lines.join('\n')).not.toContain('opensans.woff2');
    expect(result.lines.join('\n')).not.toContain('logo.png');
  });

  it('rejects root-absolute image and theme references in staged bundles with package-relative diagnostics', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.js`]:
          'const legacyImage = "/images/fallback.png";',
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.css`]:
          '.legacy { background-image: url(/themes/base/images/backdrop.jpg); }'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[bundle-assets] dist/kodi/webinterface.chorus3/assets/app.js must not reference root-absolute /images package-escaping assets.'
    );
    expect(result.lines.join('\n')).toContain(
      '[bundle-assets] dist/kodi/webinterface.chorus3/assets/app.css must not reference root-absolute /themes package-escaping assets.'
    );
    expect(result.lines.join('\n')).not.toContain('fallback.png');
    expect(result.lines.join('\n')).not.toContain('backdrop.jpg');
  });

  it('rejects missing Kodi webinterface marker in index.html', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/index.html`]:
          '<!doctype html><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[html-assets] dist/kodi/webinterface.chorus3/index.html must include the Kodi webinterface marker'
    );
  });

  it('rejects unsafe archive roots and loose files outside the add-on directory', async () => {
    const root = createFixture(baseFiles());

    const result = await validateKodiPackage({
      root,
      zipEntries: ['addon.xml', ...validZipEntries(), 'webinterface.other/index.html']
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[archive] addon.xml must be rooted under webinterface.chorus3/'
    );
    expect(result.lines.join('\n')).toContain(
      '[archive] webinterface.other/index.html must be rooted under webinterface.chorus3/'
    );
  });

  it('rejects forbidden archive entries while allowing nested safe static assets', async () => {
    const root = createFixture(
      baseFiles({ [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/nested/chunk.js`]: 'export {};' })
    );

    const result = await validateKodiPackage({
      root,
      zipEntries: validZipEntries([
        `${DEFAULT_PACKAGE_ROOT}/assets/nested/chunk.js`,
        `${DEFAULT_PACKAGE_ROOT}/.env`,
        `${DEFAULT_PACKAGE_ROOT}/src/App.svelte`,
        `${DEFAULT_PACKAGE_ROOT}/browser-state/session.json`,
        `${DEFAULT_PACKAGE_ROOT}/package-lock.json`,
        `${DEFAULT_PACKAGE_ROOT}/vite.config.ts`,
        `${DEFAULT_PACKAGE_ROOT}/assets/app.test.js`
      ])
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[forbidden] webinterface.chorus3/.env is not allowed in Kodi package'
    );
    expect(result.lines.join('\n')).toContain(
      '[forbidden] webinterface.chorus3/src/App.svelte is not allowed in Kodi package'
    );
    expect(result.lines.join('\n')).toContain(
      '[forbidden] webinterface.chorus3/assets/app.test.js is not allowed in Kodi package'
    );
    expect(result.lines.join('\n')).not.toContain('assets/nested/chunk.js is not allowed');
  });

  it('rejects missing now-playing package output and missing route support', async () => {
    const root = createFixture(baseFiles());
    rmSync(join(root, stagedFallbackFile('now-playing')));

    const result = await validateKodiPackage({
      root,
      zipEntries: validZipEntries().filter((entry) => !entry.includes('now-playing')),
      parsePackageRoute: () => ({ kind: 'addonDetail', addonid: DEFAULT_PACKAGE_ROOT })
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[now-playing] ${zippedFallbackFile('now-playing')} is missing from zip`
    );
    expect(result.lines.join('\n')).toContain(
      '[route] now-playing-package /addons/webinterface.chorus3/now-playing must resolve to nowPlaying; got addonDetail.'
    );
  });

  it('validates real app route support for standalone and packaged primary routes plus aliases', () => {
    const result = validatePackageRouteSupport({
      addonId: DEFAULT_PACKAGE_ROOT,
      parsePackageRoute: (path, packageBasePath) => parseAppRoute(path, '', { packageBasePath })
    });

    expect(KODI_WEBINTERFACE_BASE_PATH).toBe('/addons/webinterface.chorus3');
    expect(result.ok).toBe(true);
    expect(result.lines).toEqual(
      expect.arrayContaining([
        '[route] primary-home-root / resolves to primary/home.',
        '[route] primary-home-package /addons/webinterface.chorus3 resolves to primary/home.',
        '[route] primary-music-package /addons/webinterface.chorus3/music resolves to primary/music.',
        '[route] primary-movies-package /addons/webinterface.chorus3/movies resolves to primary/movies.',
        '[route] primary-browser-package /addons/webinterface.chorus3/browser resolves to primary/browser.',
        '[route] primary-files-alias-package /addons/webinterface.chorus3/files resolves to primary/browser.',
        '[route] submenu-music-genres-package /addons/webinterface.chorus3/music/genres resolves to primary/musicGenres.',
        '[route] submenu-movies-recent-package /addons/webinterface.chorus3/movies/recent resolves to primary/moviesRecent.',
        '[route] submenu-tvshows-recent-package /addons/webinterface.chorus3/tvshows/recent resolves to primary/tvshowsRecent.',
        '[route] submenu-addons-video-package /addons/webinterface.chorus3/addons/video resolves to primary/addonsVideo.',
        '[route] submenu-addons-audio-package /addons/webinterface.chorus3/addons/audio resolves to primary/addonsAudio.',
        '[route] submenu-addons-executable-package /addons/webinterface.chorus3/addons/executable resolves to primary/addonsExecutable.',
        '[route] primary-addon-detail-package /addons/webinterface.chorus3/addons/plugin.video.safe-demo resolves to primary/addonDetail.',
        '[route] submenu-settings-kodi-package /addons/webinterface.chorus3/settings/kodi resolves to primary/settingsKodi.',
        '[route] submenu-settings-kodi-section-package /addons/webinterface.chorus3/settings/kodi/interface resolves to primary/settingsKodiSection.',
        '[route] submenu-help-page-package /addons/webinterface.chorus3/help/keyboard resolves to primary/helpPage.',
        '[route] submenu-help-readme-package /addons/webinterface.chorus3/help/readme resolves to primary/helpPage.',
        '[route] submenu-help-changelog-package /addons/webinterface.chorus3/help/changelog resolves to primary/helpPage.',
        '[route] submenu-help-translations-package /addons/webinterface.chorus3/help/translations resolves to primary/helpPage.',
        '[route] submenu-help-license-package /addons/webinterface.chorus3/help/license resolves to primary/helpPage.',
        '[route] legacy-video-movies-package /addons/webinterface.chorus3/video/movies resolves to primary/movies.',
        '[route] legacy-video-tv-package /addons/webinterface.chorus3/video/tv resolves to primary/tvshows.',
        '[route] now-playing-package /addons/webinterface.chorus3/now-playing resolves to nowPlaying.'
      ])
    );

    expect(buildPrimaryAppRoute({ kind: 'browser' })).toBe('/browser');
    expect(buildPrimaryAppRoute({ kind: 'browser' })).not.toBe('/lab/api-browser');
  });

  it('keeps visual proof fixtures aligned with every packaged fallback route', () => {
    for (const fallback of getKodiPackageRouteFallbacks()) {
      if (fallback.routePath === '/now-playing') {
        continue;
      }

      const props = createM007VisualProofAppProps({
        pathname: fallback.routePath,
        search: SECRET_SEARCH
      });

      expect(props.route, fallback.name).toEqual(parsePackageFallbackRoute(fallback.routePath));
    }
  });

  it('keeps every packaged fallback route parseable by the real app route parser', () => {
    for (const fallback of getKodiPackageRouteFallbacks()) {
      const actual = parsePackageFallbackRoute(fallback.routePath);

      if (fallback.routePath === '/now-playing') {
        expect(actual, fallback.name).toEqual({ kind: 'nowPlaying' });
      } else {
        expect(isKnownPackageFallbackRoute(actual), fallback.name).toBe(true);
      }
    }
  });

  it('names route-specific expected and actual identities when a packaged route resolves incorrectly', () => {
    const result = validatePackageRouteSupport({
      addonId: DEFAULT_PACKAGE_ROOT,
      parsePackageRoute: (path, packageBasePath) => {
        if (path === `${packageBasePath}/playlists`) {
          return { kind: 'primary', route: { kind: 'help' } };
        }

        if (path === `${packageBasePath}/browser`) {
          return { kind: 'settingsUnknown', pathLabel: '/[redacted]' };
        }

        return parseAppRoute(path, '', { packageBasePath });
      }
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[route] primary-playlists-package /addons/webinterface.chorus3/playlists must resolve to primary/playlists; got primary/help.'
    );
    expect(result.lines.join('\n')).toContain(
      '[route] primary-browser-package /addons/webinterface.chorus3/browser must resolve to primary/browser; got settingsUnknown.'
    );
  });

  it('names submenu and guarded route failures when package route support regresses', () => {
    const result = validatePackageRouteSupport({
      addonId: DEFAULT_PACKAGE_ROOT,
      parsePackageRoute: (path, packageBasePath) => {
        if (path === `${packageBasePath}/music/genres`) {
          return { kind: 'settingsUnknown', pathLabel: '/[redacted]' };
        }

        if (path === `${packageBasePath}/settings/kodi/interface`) {
          return { kind: 'settingsUnknown', pathLabel: '/[redacted]' };
        }

        if (path === `${packageBasePath}/help/keyboard`) {
          return { kind: 'labUnknown', pathLabel: '/[redacted]' };
        }

        return parseAppRoute(path, '', { packageBasePath });
      }
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[route] submenu-music-genres-package /addons/webinterface.chorus3/music/genres must resolve to primary/musicGenres; got settingsUnknown.'
    );
    expect(result.lines.join('\n')).toContain(
      '[route] submenu-settings-kodi-section-package /addons/webinterface.chorus3/settings/kodi/interface must resolve to primary/settingsKodiSection; got settingsUnknown.'
    );
    expect(result.lines.join('\n')).toContain(
      '[route] submenu-help-page-package /addons/webinterface.chorus3/help/keyboard must resolve to primary/helpPage; got labUnknown.'
    );
  });

  it('treats route parser exceptions as route-specific verifier failures', () => {
    const result = validatePackageRouteSupport({
      addonId: DEFAULT_PACKAGE_ROOT,
      parsePackageRoute: (path, packageBasePath) => {
        if (path === `${packageBasePath}/files`) {
          throw new Error('boom with token=secret-value');
        }

        return parseAppRoute(path, '', { packageBasePath });
      }
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[route] primary-files-alias-package /addons/webinterface.chorus3/files failed to parse.'
    );
    expect(result.lines.join('\n')).not.toContain('secret-value');
  });

  it('rejects setup-console fallback strings and lab-api Browser/Files targets in staged bundles', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.js`]: [
          'const primaryShellFallback = "Multi-host console";',
          'const browserHref = "/lab/api-browser";',
          'const filesHref = "/lab/api-browser";',
          'const secret = "token=secret-value";'
        ].join('\n')
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[bundle-shell] primary shell bundle must not include setup-console fallback copy.'
    );
    expect(result.lines.join('\n')).toContain(
      '[bundle-shell] Browser/Files primary targets must not point at /lab/api-browser.'
    );
    expect(result.lines.join('\n')).not.toContain('secret-value');
  });
});

describe('Kodi package zip listing', () => {
  it('returns actionable failures when unzip exits non-zero', async () => {
    const result = await listZipEntries('/tmp/missing.zip', {
      runUnzip: vi.fn(async () => ({
        status: 9,
        stdout: '',
        stderr: 'cannot find zipfile directory'
      }))
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('[zip-listing] /tmp/missing.zip failed with exit code 9');
    expect(result.error).toContain('cannot find zipfile directory');
  });
});
