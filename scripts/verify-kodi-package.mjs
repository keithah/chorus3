#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { packageKodiWebinterface } from './package-kodi-webinterface.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_PACKAGE_ROOT = 'webinterface.chorus3';
export const DEFAULT_DOC_PATH = 'docs/m005-kodi-package-uat.md';
export const PACKAGE_ROOT = 'dist/kodi';
export const METADATA_PATH = 'kodi/addon-metadata.json';
export const PACKAGE_JSON_PATH = 'package.json';

const MAX_LISTED_FAILURES = 10;
const REQUIRED_ZIP_ENTRIES = ['addon.xml', 'index.html', 'now-playing/index.html'];
const REQUIRED_MANIFEST_SNIPPETS = [
  '<requires',
  'addon="xbmc.json"',
  'point="xbmc.webinterface"',
  'point="xbmc.addon.metadata"',
  '<summary',
  '<description',
  '<source',
  '<platform'
];
const FORBIDDEN_SEGMENTS = new Set([
  '.git',
  '.gsd',
  '.planning',
  '.audits',
  'node_modules',
  'browser-state',
  'playwright-report',
  'test-results',
  'coverage',
  '__tests__',
  'src',
  'scripts'
]);
const FORBIDDEN_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'vite.config.ts',
  'vite.config.js',
  'vitest.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'eslint.config.js',
  'svelte.config.js'
]);
const FORBIDDEN_EXTENSIONS = /\.(?:svelte|ts|tsx)$/i;
const TEST_FILE_PATTERN = /(?:^|[/.])(?:test|spec)\.[cm]?[jt]sx?$/i;
const ROOT_ABSOLUTE_ASSET_PATTERN = /\b(?:src|href)=(['"])\/assets\//i;
const PACKAGE_ESCAPING_ASSET_ROOTS = ['chorus2-assets', 'images', 'themes', 'fonts'];
const PACKAGE_ESCAPING_ASSET_PATTERN =
  /(?:["'(=:\s]|url\(\s*)(\/(?:chorus2-assets|images|themes|fonts)(?=\/|["')?\s]))/gi;
const SCANNED_BUNDLE_EXTENSIONS = new Set(['.html', '.js', '.css']);
const KODI_WEBINTERFACE_MARKER_PATTERN =
  /<meta\s+[^>]*name=(['"])chorus3:kodi-webinterface\1[^>]*content=(['"])webinterface\.chorus3\2/i;
const CREDENTIAL_DOC_PATTERN =
  /(?:\b(?:username|password|token)=|:\/\/[^\s/@]+:[^\s/@]+@|\bAuthorization\b|\bBasic\s+)/i;

export async function runKodiPackageVerification({
  root = cwd(),
  packageBeforeValidate = packageKodiWebinterface,
  validate = validateKodiPackage
} = {}) {
  const packageResult = await packageBeforeValidate({ root });

  if (!packageResult.ok) {
    return packageResult;
  }

  const validationResult = await validate({ root });

  return {
    ok: validationResult.ok,
    lines: [...packageResult.lines, ...validationResult.lines]
  };
}

export async function validateKodiPackage({ root = cwd(), zipEntries, parsePackageRoute } = {}) {
  const lines = [];
  const packageJson = readJson(join(root, PACKAGE_JSON_PATH), 'package.json', lines);
  const metadata = readJson(join(root, METADATA_PATH), 'metadata', lines);
  const addonId = safeString(metadata?.id) || DEFAULT_PACKAGE_ROOT;
  const packageVersion = safeString(packageJson?.version);
  const stageRoot = join(root, PACKAGE_ROOT, addonId);

  validateManifest({ root, addonId, packageVersion, metadata, lines });
  validateHtmlAssets({ root, addonId, lines });
  validateStagedBundleAssetReferences({ root, addonId, lines });

  const entries = Array.isArray(zipEntries)
    ? zipEntries
    : await loadZipEntries({ root, addonId, packageVersion, lines });

  if (entries) {
    validateArchiveEntries({ entries, addonId, lines });
  }

  validateNowPlaying({ root, addonId, entries, parsePackageRoute, lines });
  lines.push(...validateKodiPackageDocs({ root }).lines);

  const ok = !lines.some((line) =>
    /^\[(?:metadata|manifest|html-assets|bundle-assets|archive|forbidden|zip-listing|now-playing|route|docs)\].*(?:missing|must|failed|invalid|mismatch|not allowed|forbidden|unreadable|blank|expected)/i.test(
      line
    )
  );

  if (ok) {
    if (existsSync(stageRoot)) {
      lines.unshift(`[staging] inspected ${toPosixPath(relative(root, stageRoot))}.`);
    }
  }

  return { ok, lines };
}

export async function listZipEntries(zipPath, { runUnzip = runSystemUnzip } = {}) {
  try {
    const result = await runUnzip({ args: ['-Z1', zipPath] });

    if (result.status !== 0) {
      return {
        ok: false,
        entries: [],
        error: `[zip-listing] ${toPosixPath(zipPath)} failed with exit code ${result.status}: ${sanitizeOutput(result.stderr || result.stdout || 'no output')}`
      };
    }

    return {
      ok: true,
      entries: result.stdout
        .split(/\r?\n/g)
        .map((entry) => entry.trim())
        .filter(Boolean)
    };
  } catch (error) {
    return {
      ok: false,
      entries: [],
      error: `[zip-listing] ${toPosixPath(zipPath)} failed: ${sanitizeOutput(formatErrorMessage(error))}`
    };
  }
}

export function runSystemUnzip({ args }) {
  return new Promise((resolve, reject) => {
    const child = spawn('unzip', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      resolve({ status: status ?? 1, stdout, stderr });
    });
  });
}

export function validatePackageRouteSupport({
  addonId = DEFAULT_PACKAGE_ROOT,
  parsePackageRoute
} = {}) {
  const packageBasePath = `/addons/${addonId}`;
  const routeChecks = [
    { path: '/', expected: { kind: 'dashboard' } },
    { path: '/video/movies', expected: { kind: 'video', routeKind: 'videoMovies' } },
    { path: '/video/tv', expected: { kind: 'video', routeKind: 'videoTvShows' } },
    { path: '/browser', expected: { kind: 'chorus2Placeholder', placeholderId: 'browser' } },
    { path: '/addons', expected: { kind: 'addons' } },
    { path: '/remote', expected: { kind: 'remote' } },
    { path: '/playlists', expected: { kind: 'chorus2Placeholder', placeholderId: 'playlists' } },
    { path: '/settings', expected: { kind: 'settings' } },
    { path: '/help', expected: { kind: 'chorus2Placeholder', placeholderId: 'help' } },
    { path: '/now-playing', expected: { kind: 'nowPlaying' } }
  ];
  const lines = [];

  for (const check of routeChecks) {
    const mountedPath = `${packageBasePath}${check.path}`;
    const route = parsePackageRoute
      ? parsePackageRoute(mountedPath, packageBasePath)
      : defaultPackageRouteParser(mountedPath, packageBasePath);
    const expectedLabel = formatExpectedRouteIdentity(check.expected);

    if (!routeMatchesExpectedDescriptor(route, check.expected)) {
      lines.push(`[route] ${mountedPath} must resolve to ${expectedLabel}.`);
      continue;
    }

    lines.push(`[route] ${mountedPath} resolves to ${expectedLabel}.`);
  }

  return {
    ok: lines.every((line) => !line.includes(' must ')),
    lines
  };
}

export function validateKodiPackageDocs({ root = cwd(), docPath = DEFAULT_DOC_PATH } = {}) {
  const path = join(root, docPath);
  const lines = [];

  if (!existsSync(path) || !statSync(path).isFile()) {
    return { ok: false, lines: [`[docs] ${docPath} is missing.`] };
  }

  const contents = readFileSync(path, 'utf8');
  const requiredSnippets = [
    'docs/m005-now-playing-uat.md',
    'npm run verify',
    'npm run package:kodi',
    'npm run verify:kodi-package',
    'dist/kodi/webinterface.chorus3-<version>.zip'
  ];

  for (const snippet of requiredSnippets) {
    if (!contents.includes(snippet)) {
      lines.push(`[docs] ${docPath} must link ${snippet}.`);
    }
  }

  if (CREDENTIAL_DOC_PATTERN.test(contents)) {
    lines.push(`[docs] ${docPath} contains forbidden credential-bearing example.`);
  }

  if (lines.length === 0) {
    lines.push(`[docs] ${docPath} links package and now-playing UAT without credential examples.`);
  }

  return {
    ok: lines.every((line) => !line.includes(' must ') && !line.includes('forbidden')),
    lines
  };
}

async function loadZipEntries({ root, addonId, packageVersion, lines }) {
  if (!packageVersion) {
    lines.push('[zip-listing] package.json version is blank; cannot determine zip path.');
    return null;
  }

  const zipPath = join(root, PACKAGE_ROOT, `${addonId}-${packageVersion}.zip`);
  if (!existsSync(zipPath) || !statSync(zipPath).isFile()) {
    lines.push(`[zip-listing] ${toPosixPath(relative(root, zipPath))} is missing.`);
    return null;
  }

  const result = await listZipEntries(zipPath);
  if (!result.ok) {
    lines.push(result.error.replace(toPosixPath(zipPath), toPosixPath(relative(root, zipPath))));
    return null;
  }

  return result.entries;
}

function validateManifest({ root, addonId, packageVersion, metadata, lines }) {
  const relativePath = `${PACKAGE_ROOT}/${addonId}/addon.xml`;
  const path = join(root, relativePath);

  if (!existsSync(path) || !statSync(path).isFile()) {
    lines.push(`[manifest] ${relativePath} is missing.`);
    return;
  }

  const xml = readFileSync(path, 'utf8');
  const attrs = parseAddonAttributes(xml);

  if (!attrs) {
    lines.push(`[manifest] ${relativePath} is malformed or missing root addon attributes.`);
    return;
  }

  if (attrs.id !== addonId) {
    lines.push(`[manifest] ${relativePath} id must be ${addonId}.`);
  }

  if (attrs.name !== safeString(metadata?.name)) {
    lines.push(`[manifest] ${relativePath} name must match kodi/addon-metadata.json.`);
  }

  if (attrs.version !== packageVersion) {
    lines.push(`[manifest] ${relativePath} version must match package.json.`);
  }

  for (const snippet of REQUIRED_MANIFEST_SNIPPETS) {
    if (!xml.includes(snippet)) {
      const label =
        snippet === 'point="xbmc.webinterface"' ? 'extension point xbmc.webinterface' : snippet;
      lines.push(`[manifest] ${relativePath} must include ${label}.`);
    }
  }

  if (!safeString(attrs.id) || !safeString(attrs.name) || !safeString(attrs.version)) {
    lines.push(`[manifest] ${relativePath} id, name, and version must be non-blank.`);
  }

  if (!lines.some((line) => line.startsWith('[manifest]') && line.includes('must'))) {
    lines.push(`[manifest] addon.xml matches ${addonId} ${packageVersion}.`);
  }
}

function validateHtmlAssets({ root, addonId, lines }) {
  const relativePath = `${PACKAGE_ROOT}/${addonId}/index.html`;
  const path = join(root, relativePath);

  if (!existsSync(path) || !statSync(path).isFile()) {
    lines.push(`[html-assets] ${relativePath} is missing.`);
    return;
  }

  const html = readFileSync(path, 'utf8');

  if (ROOT_ABSOLUTE_ASSET_PATTERN.test(html)) {
    lines.push(`[html-assets] ${relativePath} must not reference root-absolute /assets URLs.`);
    return;
  }

  if (!KODI_WEBINTERFACE_MARKER_PATTERN.test(html)) {
    lines.push(`[html-assets] ${relativePath} must include the Kodi webinterface marker.`);
    return;
  }

  lines.push('[html-assets] index.html uses relative asset URLs and Kodi webinterface marker.');
}

function validateStagedBundleAssetReferences({ root, addonId, lines }) {
  const stageRoot = join(root, PACKAGE_ROOT, addonId);

  if (!existsSync(stageRoot) || !statSync(stageRoot).isDirectory()) {
    return;
  }

  const files = collectScannableBundleFiles(stageRoot);

  for (const file of files) {
    const relativePath = toPosixPath(relative(root, file));
    const packageRelativePath = toPosixPath(relative(stageRoot, file));
    const phase = packageRelativePath === 'index.html' ? 'html-assets' : 'bundle-assets';
    const contents = readFileSync(file, 'utf8');
    const escapingRoots = findPackageEscapingAssetRoots(contents);

    for (const rootName of escapingRoots) {
      lines.push(
        `[${phase}] ${relativePath} must not reference root-absolute /${rootName} package-escaping assets.`
      );
    }
  }
}

function collectScannableBundleFiles(stageRoot) {
  const files = [];

  function visit(path) {
    const stats = statSync(path);

    if (stats.isDirectory()) {
      for (const entry of readdirSync(path).sort((left, right) => left.localeCompare(right))) {
        visit(join(path, entry));
      }
      return;
    }

    if (stats.isFile() && SCANNED_BUNDLE_EXTENSIONS.has(getExtension(path))) {
      files.push(path);
    }
  }

  visit(stageRoot);
  return files;
}

function findPackageEscapingAssetRoots(contents) {
  const roots = new Set();

  for (const match of contents.matchAll(PACKAGE_ESCAPING_ASSET_PATTERN)) {
    const matchedRoot = match[1]?.slice(1);

    if (PACKAGE_ESCAPING_ASSET_ROOTS.includes(matchedRoot)) {
      roots.add(matchedRoot);
    }
  }

  return [...roots];
}

function validateArchiveEntries({ entries, addonId, lines }) {
  const normalizedEntries = entries.map(normalizeArchiveEntry).filter(Boolean);
  const rootPrefix = `${addonId}/`;
  const badRoots = normalizedEntries.filter(
    (entry) => entry !== addonId && !entry.startsWith(rootPrefix)
  );

  for (const entry of summarizeEntries(badRoots)) {
    lines.push(`[archive] ${entry} must be rooted under ${addonId}/.`);
  }

  for (const suffix of REQUIRED_ZIP_ENTRIES) {
    const requiredEntry = `${addonId}/${suffix}`;
    if (!normalizedEntries.includes(requiredEntry)) {
      lines.push(`[archive] ${requiredEntry} is missing from zip.`);
    }
  }

  const hasJsAsset = normalizedEntries.some(
    (entry) => entry.startsWith(`${addonId}/assets/`) && entry.endsWith('.js')
  );
  const hasCssAsset = normalizedEntries.some(
    (entry) => entry.startsWith(`${addonId}/assets/`) && entry.endsWith('.css')
  );

  if (!hasJsAsset) {
    lines.push(`[archive] ${addonId}/assets/ must contain at least one JavaScript asset.`);
  }

  if (!hasCssAsset) {
    lines.push(`[archive] ${addonId}/assets/ must contain at least one CSS asset.`);
  }

  const forbidden = normalizedEntries.filter((entry) => isForbiddenArchiveEntry(entry, addonId));
  for (const entry of summarizeEntries(forbidden)) {
    lines.push(`[forbidden] ${entry} is not allowed in Kodi package.`);
  }

  if (
    badRoots.length === 0 &&
    forbidden.length === 0 &&
    REQUIRED_ZIP_ENTRIES.every((suffix) => normalizedEntries.includes(`${addonId}/${suffix}`)) &&
    hasJsAsset &&
    hasCssAsset
  ) {
    lines.push(`[archive] zip root ${addonId} contains ${normalizedEntries.length} entries.`);
  }
}

function validateNowPlaying({ root, addonId, entries, parsePackageRoute, lines }) {
  const nowPlayingEntry = `${addonId}/now-playing/index.html`;
  const relativePath = `${PACKAGE_ROOT}/${nowPlayingEntry}`;
  const path = join(root, relativePath);

  if (!existsSync(path) || !statSync(path).isFile()) {
    lines.push(`[now-playing] ${nowPlayingEntry} is missing from staged package.`);
  }

  if (Array.isArray(entries) && !entries.map(normalizeArchiveEntry).includes(nowPlayingEntry)) {
    lines.push(`[now-playing] ${nowPlayingEntry} is missing from zip.`);
  }

  const routeResult = validatePackageRouteSupport({ addonId, parsePackageRoute });
  lines.push(...routeResult.lines);

  if (
    existsSync(path) &&
    (!Array.isArray(entries) || entries.map(normalizeArchiveEntry).includes(nowPlayingEntry)) &&
    routeResult.ok
  ) {
    lines.push('[now-playing] packaged now-playing entry and route support are present.');
  }
}

function parseAddonAttributes(xml) {
  const addonMatch = xml.match(/<addon\s+([^>]+)>/i);
  if (!addonMatch) {
    return null;
  }

  const attrs = {};
  for (const match of addonMatch[1].matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)=(['"])(.*?)\2/g)) {
    attrs[match[1]] = match[3].trim();
  }

  return attrs;
}

function isForbiddenArchiveEntry(entry, addonId) {
  const segments = entry.split('/').filter(Boolean);
  const packageRelativeSegments = segments[0] === addonId ? segments.slice(1) : segments;
  const name = packageRelativeSegments.at(-1) ?? '';

  return (
    packageRelativeSegments.some((segment) => FORBIDDEN_SEGMENTS.has(segment)) ||
    FORBIDDEN_BASENAMES.has(name) ||
    name.startsWith('.env.') ||
    FORBIDDEN_EXTENSIONS.test(name) ||
    TEST_FILE_PATTERN.test(name)
  );
}

function normalizeArchiveEntry(entry) {
  return String(entry).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/g, '').trim();
}

function defaultPackageRouteParser(path, packageBasePath) {
  const normalizedBase = normalizePath(packageBasePath);
  const normalizedPath = normalizePath(path);
  const stripped =
    normalizedPath === normalizedBase ? '/' : normalizedPath.slice(normalizedBase.length);

  switch (stripped) {
    case '/':
      return { kind: 'dashboard' };
    case '/video/movies':
      return { kind: 'video', route: { kind: 'videoMovies' } };
    case '/video/tv':
      return { kind: 'video', route: { kind: 'videoTvShows' } };
    case '/browser':
      return { kind: 'chorus2Placeholder', placeholder: { id: 'browser' } };
    case '/addons':
      return { kind: 'addons' };
    case '/remote':
      return { kind: 'remote' };
    case '/playlists':
      return { kind: 'chorus2Placeholder', placeholder: { id: 'playlists' } };
    case '/settings':
      return { kind: 'settings' };
    case '/help':
      return { kind: 'chorus2Placeholder', placeholder: { id: 'help' } };
    case '/now-playing':
      return { kind: 'nowPlaying' };
    default:
      return { kind: 'dashboard' };
  }
}

function routeMatchesExpectedDescriptor(route, expected) {
  if (!route || typeof route !== 'object' || route.kind !== expected.kind) {
    return false;
  }

  if (expected.routeKind) {
    return (
      route.route && typeof route.route === 'object' && route.route.kind === expected.routeKind
    );
  }

  if (expected.placeholderId) {
    return (
      route.placeholder &&
      typeof route.placeholder === 'object' &&
      route.placeholder.id === expected.placeholderId
    );
  }

  return true;
}

function formatExpectedRouteIdentity(expected) {
  if (expected.routeKind) {
    return `${expected.kind}/${expected.routeKind}`;
  }

  if (expected.placeholderId) {
    return `${expected.kind}/${expected.placeholderId}`;
  }

  return expected.kind;
}

function getExtension(path) {
  const name = String(path).split(/[\\/]/).at(-1) ?? '';
  const dotIndex = name.lastIndexOf('.');

  return dotIndex === -1 ? '' : name.slice(dotIndex).toLowerCase();
}

function normalizePath(path) {
  const stringPath = typeof path === 'string' && path.trim() ? path.trim() : '/';
  const withSlash = stringPath.startsWith('/') ? stringPath : `/${stringPath}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/g, '') : withSlash;
}

function readJson(path, label, lines) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    lines.push(
      `[metadata] ${label} is missing or invalid JSON at ${toPosixPath(path)}: ${sanitizeOutput(formatErrorMessage(error))}`
    );
    return null;
  }
}

function summarizeEntries(entries) {
  if (entries.length <= MAX_LISTED_FAILURES) {
    return entries;
  }

  return [
    ...entries.slice(0, MAX_LISTED_FAILURES),
    `... ${entries.length - MAX_LISTED_FAILURES} more entries`
  ];
}

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeOutput(output) {
  return String(output)
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function formatErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = await runKodiPackageVerification();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
