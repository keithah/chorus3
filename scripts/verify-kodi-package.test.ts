import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  KODI_WEBINTERFACE_BASE_PATH,
  buildPrimaryAppRoute,
  parseAppRoute
} from '../src/lib/app/appRouter';
import {
  DEFAULT_DOC_PATH,
  DEFAULT_PACKAGE_ROOT,
  listZipEntries,
  validateKodiPackage,
  validateKodiPackageDocs,
  validatePackageRouteSupport,
  runKodiPackageVerification
} from './verify-kodi-package.mjs';

const testRoots: string[] = [];

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
      name: 'Chorus3',
      summary: 'A modern Kodi web interface.',
      description: 'A packaged static Kodi webinterface add-on.',
      source: 'https://example.test/chorus3',
      language: 'en_GB',
      platform: 'all'
    }),
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/addon.xml`]: validAddonXml(),
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/index.html`]:
      '<!doctype html><meta name="chorus3:kodi-webinterface" content="webinterface.chorus3"><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">',
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.js`]: 'console.log("chorus3")',
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.css`]: ':root { color-scheme: dark; }',
    [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/now-playing/index.html`]:
      '<!doctype html><main>Now playing</main>',
    [DEFAULT_DOC_PATH]: [
      '# M005 Kodi package UAT',
      'Run `npm run verify`, `npm run package:kodi`, and `npm run verify:kodi-package`.',
      'The zip is `dist/kodi/webinterface.chorus3-<version>.zip`.',
      'See docs/m005-now-playing-uat.md for packaged /now-playing checks.',
      'Use http://kodi.local:8080/addons/webinterface.chorus3/ without URL credentials.'
    ].join('\n'),
    ...overrides
  };
}

function validAddonXml(
  overrides: { id?: string; name?: string; version?: string; webinterface?: boolean } = {}
) {
  const id = overrides.id ?? DEFAULT_PACKAGE_ROOT;
  const name = overrides.name ?? 'Chorus3';
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
    `${DEFAULT_PACKAGE_ROOT}/now-playing/index.html`,
    ...extra
  ];
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
  it('accepts a staged package and zip listing with manifest, relative assets, and now-playing output', async () => {
    const root = createFixture(baseFiles());

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(true);
    expect(result.lines).toContain('[manifest] addon.xml matches webinterface.chorus3 1.2.3.');
    expect(result.lines).toContain(
      '[html-assets] index.html uses relative asset URLs and Kodi webinterface marker.'
    );
    expect(result.lines).toContain('[archive] zip root webinterface.chorus3 contains 5 entries.');
    expect(result.lines).toContain(
      '[now-playing] packaged now-playing entry and route support are present.'
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

  it('rejects package-escaping Chorus2 asset references in staged HTML without echoing raw content', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/index.html`]:
          '<!doctype html><meta name="chorus3:kodi-webinterface" content="webinterface.chorus3"><script type="module" src="./assets/app.js"></script><img src="/chorus2-assets/themes/base/images/logo.png?token=secret-value">'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[html-assets] dist/kodi/webinterface.chorus3/index.html must not reference root-absolute /chorus2-assets package-escaping assets.'
    );
    expect(result.lines.join('\n')).not.toContain('secret-value');
    expect(result.lines.join('\n')).not.toContain('logo.png?token');
  });

  it('rejects package-escaping asset references in staged JavaScript and CSS while allowing relative Vite assets', async () => {
    const root = createFixture(
      baseFiles({
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.js`]:
          'const logo = "/chorus2-assets/themes/base/images/logo.png"; const ok = "./assets/chunk.js";',
        [`dist/kodi/${DEFAULT_PACKAGE_ROOT}/assets/app.css`]:
          '@font-face { src: url("/fonts/opensans.woff2"); } .ok { background: url("../assets/bg.png"); }'
      })
    );

    const result = await validateKodiPackage({ root, zipEntries: validZipEntries() });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[bundle-assets] dist/kodi/webinterface.chorus3/assets/app.js must not reference root-absolute /chorus2-assets package-escaping assets.'
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
    rmSync(join(root, `dist/kodi/${DEFAULT_PACKAGE_ROOT}/now-playing/index.html`));

    const result = await validateKodiPackage({
      root,
      zipEntries: validZipEntries().filter((entry) => !entry.includes('now-playing')),
      parsePackageRoute: () => ({ kind: 'addonDetail', addonid: DEFAULT_PACKAGE_ROOT })
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[now-playing] webinterface.chorus3/now-playing/index.html is missing from zip'
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
        '[route] primary-files-alias-package /addons/webinterface.chorus3/files resolves to chorus2Placeholder/files.',
        '[route] legacy-video-movies-package /addons/webinterface.chorus3/video/movies resolves to video/videoMovies.',
        '[route] now-playing-package /addons/webinterface.chorus3/now-playing resolves to nowPlaying.'
      ])
    );

    expect(buildPrimaryAppRoute({ kind: 'browser' })).toBe('/browser');
    expect(buildPrimaryAppRoute({ kind: 'browser' })).not.toBe('/lab/api-browser');
  });

  it('names route-specific expected and actual identities when a packaged route resolves incorrectly', () => {
    const result = validatePackageRouteSupport({
      addonId: DEFAULT_PACKAGE_ROOT,
      parsePackageRoute: (path, packageBasePath) => {
        if (path === `${packageBasePath}/playlists`) {
          return { kind: 'primary', route: { kind: 'help' } };
        }

        if (path === `${packageBasePath}/browser`) {
          return { kind: 'labApiBrowser' };
        }

        return parseAppRoute(path, '', { packageBasePath });
      }
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      '[route] primary-playlists-package /addons/webinterface.chorus3/playlists must resolve to primary/playlists; got primary/help.'
    );
    expect(result.lines.join('\n')).toContain(
      '[route] primary-browser-package /addons/webinterface.chorus3/browser must resolve to primary/browser; got labApiBrowser.'
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

describe('Kodi package UAT documentation checks', () => {
  it('accepts docs that link now-playing UAT and avoid credential-bearing examples', () => {
    const root = createFixture({
      [DEFAULT_DOC_PATH]: [
        '# M005 Kodi package UAT',
        'Run `npm run verify`, `npm run package:kodi`, and `npm run verify:kodi-package`.',
        'The zip is `dist/kodi/webinterface.chorus3-<version>.zip`.',
        'See docs/m005-now-playing-uat.md for packaged /now-playing checks.',
        'Use http://kodi.local:8080/addons/webinterface.chorus3/ without URL credentials.'
      ].join('\n')
    });

    const result = validateKodiPackageDocs({ root });

    expect(result.ok).toBe(true);
  });

  it('rejects missing docs link hooks and credential-like examples without echoing secret values', () => {
    const root = createFixture({
      [DEFAULT_DOC_PATH]: [
        '# M005 Kodi package UAT',
        'Run `npm run verify`.',
        'Bad examples: username=alice password=hunter2 token=abc http://user:pass@kodi.local Authorization Basic abc'
      ].join('\n')
    });

    const result = validateKodiPackageDocs({ root });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(
      `[docs] ${DEFAULT_DOC_PATH} must link docs/m005-now-playing-uat.md`
    );
    expect(result.lines.join('\n')).toContain(
      `[docs] ${DEFAULT_DOC_PATH} contains forbidden credential-bearing example`
    );
    expect(result.lines.join('\n')).not.toContain('hunter2');
    expect(result.lines.join('\n')).not.toContain('user:pass');
  });
});
