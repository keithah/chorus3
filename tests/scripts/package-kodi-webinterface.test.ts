import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_ADDON_ID,
  KODI_WEBINTERFACE_MARKER,
  getKodiArtifactPaths,
  packageKodiWebinterface,
  renderAddonXml,
  stageKodiWebinterfacePackage,
  validateAddonInputs
} from '../../scripts/package-kodi-webinterface.mjs';
import {
  KODI_PACKAGE_BASE_PATH,
  getKodiPackageRouteFallbacks
} from '../../scripts/kodi-package-route-contract.mjs';

const testRoots: string[] = [];

function createFixture(files: Record<string, string>): string {
  const root = join(tmpdir(), `chorus3-kodi-package-${randomUUID()}`);
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
      id: DEFAULT_ADDON_ID,
      name: 'Chorus3',
      summary: 'A modern Kodi web interface.',
      description: 'A packaged static Kodi webinterface add-on.',
      source: 'https://example.test/chorus3',
      license: 'GPL-2.0-or-later',
      language: 'en_GB',
      platform: 'all'
    }),
    'kodi/addon.xml.template': [
      '<addon id="{{id}}" name="{{name}}" version="{{version}}" provider-name="{{name}}">',
      '  <requires><import addon="xbmc.json" version="6.0.0" /></requires>',
      '  <extension point="xbmc.webinterface" />',
      '  <extension point="xbmc.addon.metadata">',
      '    <summary lang="{{language}}">{{summary}}</summary>',
      '    <description lang="{{language}}">{{description}}</description>',
      '    <source>{{source}}</source>',
      '    <license>{{license}}</license>',
      '    <platform>{{platform}}</platform>',
      '  </extension>',
      '</addon>'
    ].join('\n'),
    'dist/index.html': [
      '<!doctype html>',
      '<html>',
      '<head><title>Chorus3</title></head>',
      '<body><script type="module" src="./assets/app.js"></script></body>',
      '</html>'
    ].join(''),
    'dist/assets/app.js': 'console.log("chorus3")',
    'dist/assets/app.css': ':root { color-scheme: dark; }',
    'dist/now-playing/index.html': '<!doctype html><main>Now playing</main>',
    'dist/favicon.svg': '<svg />',
    ...overrides
  };
}

afterEach(() => {
  vi.restoreAllMocks();

  for (const root of testRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('Kodi add-on manifest rendering', () => {
  it('uses package.json as the version source and renders required Kodi webinterface entries', () => {
    const root = createFixture(baseFiles());

    const result = renderAddonXml({ root });

    expect(result.addonXml).toContain('id="webinterface.chorus3"');
    expect(result.addonXml).toContain('name="Chorus3"');
    expect(result.addonXml).toContain('version="1.2.3"');
    expect(result.addonXml).toContain('<import addon="xbmc.json" version="6.0.0" />');
    expect(result.addonXml).toContain('<extension point="xbmc.webinterface" />');
    expect(result.addonXml).toContain('<extension point="xbmc.addon.metadata">');
  });

  it.each([
    [
      'unsafe add-on id',
      {
        'kodi/addon-metadata.json': JSON.stringify({
          id: '../bad',
          name: 'Chorus3',
          summary: 'A modern Kodi web interface.',
          description: 'A packaged static Kodi webinterface add-on.',
          source: 'https://example.test/chorus3',
          license: 'GPL-2.0-or-later',
          language: 'en_GB',
          platform: 'all'
        })
      },
      'metadata.id'
    ],
    [
      'blank name',
      { 'kodi/addon-metadata.json': JSON.stringify({ id: DEFAULT_ADDON_ID, name: '   ' }) },
      'metadata.name'
    ],
    [
      'missing package version',
      { 'package.json': JSON.stringify({ name: 'chorus3' }) },
      'package.json version'
    ],
    [
      'invalid package version',
      { 'package.json': JSON.stringify({ name: 'chorus3', version: '1.2' }) },
      'package.json version'
    ],
    [
      'Kodi rejects placeholder zero package version',
      { 'package.json': JSON.stringify({ name: 'chorus3', version: '0.0.0' }) },
      'package.json version'
    ],
    [
      'invalid template placeholder',
      { 'kodi/addon.xml.template': '<addon id="{{id}}">{{unexpected}}</addon>' },
      'template placeholder'
    ]
  ])('rejects malformed inputs: %s', (_name, overrides, expectedMessage) => {
    const root = createFixture(baseFiles(overrides));

    expect(() => validateAddonInputs({ root })).toThrow(expectedMessage);
  });
});

describe('Kodi package staging', () => {
  it('stages addon.xml and built files under the add-on root without source or planning files', () => {
    const root = createFixture({
      ...baseFiles(),
      'src/ignored.ts': 'throw new Error("not packaged")',
      '.gsd/ignored.md': 'local planning only',
      'scripts/ignored.test.ts': 'test("not packaged", () => {})'
    });

    const result = stageKodiWebinterfacePackage({ root });

    expect(result.entries).toEqual(
      [
        'webinterface.chorus3/addon.xml',
        'webinterface.chorus3/assets/app.css',
        'webinterface.chorus3/assets/app.js',
        'webinterface.chorus3/favicon.svg',
        'webinterface.chorus3/index.html',
        ...getKodiPackageRouteFallbacks().map(
          (fallback) => `webinterface.chorus3/${fallback.stagedIndexPath}`
        )
      ].sort()
    );
    expect(readFileSync(join(result.stageDir, 'addon.xml'), 'utf8')).toContain('version="1.2.3"');
    expect(readFileSync(join(result.stageDir, 'index.html'), 'utf8')).toContain(
      KODI_WEBINTERFACE_MARKER.replace('{{id}}', DEFAULT_ADDON_ID)
    );
    expect(existsSync(join(result.stageDir, 'src/ignored.ts'))).toBe(false);
    expect(existsSync(join(result.stageDir, '.gsd/ignored.md'))).toBe(false);
  });

  it('stages a now-playing entrypoint from the SPA index when Vite emits only the app shell', () => {
    const root = createFixture(baseFiles());
    rmSync(join(root, 'dist/now-playing'), { force: true, recursive: true });

    const result = stageKodiWebinterfacePackage({ root });

    expect(result.entries).toContain('webinterface.chorus3/now-playing/index.html');
    expect(readFileSync(join(result.stageDir, 'now-playing/index.html'), 'utf8')).toBe(
      readFileSync(join(result.stageDir, 'index.html'), 'utf8')
    );
  });

  it('fails before staging when the Vite build output is missing index.html', () => {
    const root = createFixture(baseFiles({ 'dist/index.html': '' }));
    rmSync(join(root, 'dist/index.html'));

    expect(() => stageKodiWebinterfacePackage({ root })).toThrow('build output dist/index.html');
  });

  it.each([
    ['dist/.env', 'SECRET=1'],
    ['dist/.gsd/state.json', '{}'],
    ['dist/assets/app.test.js', 'test("not shipped", () => {})']
  ])('rejects forbidden build entries before zip creation: %s', (path, contents) => {
    const root = createFixture(baseFiles({ [path]: contents }));

    expect(() => stageKodiWebinterfacePackage({ root })).toThrow(path);
  });

  it('normalizes staged file timestamps for deterministic zip input', () => {
    const root = createFixture(baseFiles());

    const result = stageKodiWebinterfacePackage({ root });

    const stagedIndex = statSync(join(result.stageDir, 'index.html'));
    const stagedAddonXml = statSync(join(result.stageDir, 'addon.xml'));
    expect(stagedIndex.mtime.toISOString()).toBe('2000-01-01T00:00:00.000Z');
    expect(stagedAddonXml.mtime.toISOString()).toBe('2000-01-01T00:00:00.000Z');
  });

  it('keeps nested assets and public files in deterministic order', () => {
    const root = createFixture({
      ...baseFiles(),
      'dist/assets/nested/chunk.js': 'export const value = 1;',
      'dist/robots.txt': 'User-agent: *',
      'dist/empty-assets/.keep': ''
    });

    const result = stageKodiWebinterfacePackage({ root });

    const expectedEntries = [
      'webinterface.chorus3/addon.xml',
      'webinterface.chorus3/assets/app.css',
      'webinterface.chorus3/assets/app.js',
      'webinterface.chorus3/assets/nested/chunk.js',
      'webinterface.chorus3/empty-assets/.keep',
      'webinterface.chorus3/favicon.svg',
      'webinterface.chorus3/index.html',
      'webinterface.chorus3/robots.txt',
      ...getKodiPackageRouteFallbacks().map(
        (fallback) => `webinterface.chorus3/${fallback.stagedIndexPath}`
      )
    ].sort();

    expect(result.entries).toEqual(expectedEntries);
  });

  it('stages every fallback from the shared route contract with deterministic package entries', () => {
    const root = createFixture(baseFiles());

    const result = stageKodiWebinterfacePackage({ root });
    const fallbackEntries = getKodiPackageRouteFallbacks().map(
      (fallback) => `${DEFAULT_ADDON_ID}/${fallback.stagedIndexPath}`
    );

    for (const entry of fallbackEntries) {
      expect(result.entries).toContain(entry);
      expect(existsSync(join(result.stageDir, entry.replace(`${DEFAULT_ADDON_ID}/`, '')))).toBe(
        true
      );
    }

    expect(
      result.entries.filter((entry) => entry === `${DEFAULT_ADDON_ID}/now-playing/index.html`)
    ).toHaveLength(1);
    expect(result.entries).not.toContain(`${DEFAULT_ADDON_ID}//index.html`);
    expect(result.entries).not.toContain(`${DEFAULT_ADDON_ID}/./index.html`);
  });

  it('overwrites now-playing with the resolved SPA shell instead of preserving an emitted nested page', () => {
    const root = createFixture(baseFiles());

    const result = stageKodiWebinterfacePackage({ root });
    const rootHtml = readFileSync(join(result.stageDir, 'index.html'), 'utf8');
    const nowPlayingHtml = readFileSync(join(result.stageDir, 'now-playing/index.html'), 'utf8');

    expect(nowPlayingHtml).toBe(rootHtml);
    expect(nowPlayingHtml).not.toContain('<main>Now playing</main>');
  });

  it('injects the package base resolver before package-rooted asset script and stylesheet tags', () => {
    const root = createFixture(
      baseFiles({
        'dist/index.html': [
          '<!doctype html>',
          '<html><head>',
          '<link rel="stylesheet" href="./assets/app.css">',
          '</head><body>',
          '<script type="module" src="./assets/app.js"></script>',
          '</body></html>'
        ].join('')
      })
    );

    const result = stageKodiWebinterfacePackage({ root });
    const nestedHtml = readFileSync(
      join(result.stageDir, 'settings/kodi/interface/index.html'),
      'utf8'
    );
    const resolverIndex = nestedHtml.indexOf('data-chorus3-kodi-base-resolver');
    const cssAsset = `href="${KODI_PACKAGE_BASE_PATH}/assets/app.css"`;
    const jsAsset = `src="${KODI_PACKAGE_BASE_PATH}/assets/app.js"`;
    const firstAssetIndex = Math.min(nestedHtml.indexOf(cssAsset), nestedHtml.indexOf(jsAsset));

    expect(nestedHtml).toContain(KODI_PACKAGE_BASE_PATH);
    expect(nestedHtml).toContain(cssAsset);
    expect(nestedHtml).toContain(jsAsset);
    expect(nestedHtml).not.toContain('href="./assets/app.css"');
    expect(nestedHtml).not.toContain('src="./assets/app.js"');
    expect(resolverIndex).toBeGreaterThan(-1);
    expect(firstAssetIndex).toBeGreaterThan(resolverIndex);
  });

  it.each([
    ['blank fallback path', { name: 'blank', routePath: '/blank', stagedIndexPath: '' }],
    [
      'traversal fallback path',
      { name: 'escape', routePath: '/escape', stagedIndexPath: '../escape/index.html' }
    ],
    [
      'root duplicate fallback path',
      { name: 'root', routePath: '/', stagedIndexPath: 'index.html' }
    ]
  ])('rejects malformed route fallback contract entries: %s', (_name, fallback) => {
    const root = createFixture(baseFiles());

    expect(() =>
      stageKodiWebinterfacePackage({
        root,
        routeFallbacks: [fallback]
      })
    ).toThrow('[fallback]');
  });

  it('rejects unsafe HTML when the resolver injection point would follow asset tags', () => {
    const root = createFixture(
      baseFiles({
        'dist/index.html': '<!doctype html><script type="module" src="./assets/app.js"></script>'
      })
    );

    expect(() => stageKodiWebinterfacePackage({ root })).toThrow('[fallback]');
  });
});

describe('Kodi package zip creation', () => {
  it('uses deterministic artifact names rooted under the add-on id', () => {
    const paths = getKodiArtifactPaths('/tmp/project', DEFAULT_ADDON_ID, '1.2.3');

    expect(paths.packageRoot).toBe('/tmp/project/dist/kodi');
    expect(paths.stageDir).toBe('/tmp/project/dist/kodi/webinterface.chorus3');
    expect(paths.zipPath).toBe('/tmp/project/dist/kodi/webinterface.chorus3-1.2.3.zip');
  });

  it('creates the zip through an injectable runner and reports phase-specific diagnostics', async () => {
    const root = createFixture(baseFiles());
    const runZip = vi.fn(async ({ cwd, args }) => {
      expect(cwd).toBe(join(root, 'dist/kodi'));
      expect(args).toEqual(['-X', '-r', 'webinterface.chorus3-1.2.3.zip', 'webinterface.chorus3']);
      writeFileSync(join(root, 'dist/kodi/webinterface.chorus3-1.2.3.zip'), 'zip-bytes');
      return { status: 0, stderr: '', stdout: '' };
    });

    const result = await packageKodiWebinterface({ root, runZip });

    expect(result.ok).toBe(true);
    expect(result.zipPath).toBe(join(root, 'dist/kodi/webinterface.chorus3-1.2.3.zip'));
    expect(result.lines).toEqual([
      '[metadata] rendered addon.xml for webinterface.chorus3 1.2.3.',
      `[staging] staged ${getKodiPackageRouteFallbacks().length + 5} entries under dist/kodi/webinterface.chorus3.`,
      '[zip] created dist/kodi/webinterface.chorus3-1.2.3.zip.'
    ]);
  });

  it('returns actionable failures when zip is unavailable', async () => {
    const root = createFixture(baseFiles());
    const result = await packageKodiWebinterface({
      root,
      runZip: vi.fn(async () => {
        throw Object.assign(new Error('spawn zip ENOENT'), { code: 'ENOENT' });
      })
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain('[zip] zip executable is unavailable');
    expect(result.lines.join('\n')).toContain('Install zip');
  });

  it('returns actionable failures when zip exits non-zero or does not create the artifact', async () => {
    const root = createFixture(baseFiles());
    const result = await packageKodiWebinterface({
      root,
      runZip: vi.fn(async () => ({ status: 12, stderr: 'permission denied', stdout: '' }))
    });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain('[zip] zip failed with exit code 12');
    expect(result.lines.join('\n')).toContain('permission denied');
  });
});
