import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_ADDON_ID,
  getKodiArtifactPaths,
  packageKodiWebinterface,
  renderAddonXml,
  stageKodiWebinterfacePackage,
  validateAddonInputs
} from './package-kodi-webinterface.mjs';

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
      '    <platform>{{platform}}</platform>',
      '  </extension>',
      '</addon>'
    ].join('\n'),
    'dist/index.html': '<!doctype html><script type="module" src="./assets/app.js"></script>',
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

    expect(result.entries).toEqual([
      'webinterface.chorus3/addon.xml',
      'webinterface.chorus3/assets/app.css',
      'webinterface.chorus3/assets/app.js',
      'webinterface.chorus3/favicon.svg',
      'webinterface.chorus3/index.html',
      'webinterface.chorus3/now-playing/index.html'
    ]);
    expect(readFileSync(join(result.stageDir, 'addon.xml'), 'utf8')).toContain('version="1.2.3"');
    expect(existsSync(join(result.stageDir, 'src/ignored.ts'))).toBe(false);
    expect(existsSync(join(result.stageDir, '.gsd/ignored.md'))).toBe(false);
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

    expect(result.entries).toEqual([
      'webinterface.chorus3/addon.xml',
      'webinterface.chorus3/assets/app.css',
      'webinterface.chorus3/assets/app.js',
      'webinterface.chorus3/assets/nested/chunk.js',
      'webinterface.chorus3/empty-assets/.keep',
      'webinterface.chorus3/favicon.svg',
      'webinterface.chorus3/index.html',
      'webinterface.chorus3/now-playing/index.html',
      'webinterface.chorus3/robots.txt'
    ]);
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
      '[staging] staged 6 entries under dist/kodi/webinterface.chorus3.',
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
