#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { basename, dirname, extname, join, relative, sep } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  KODI_PACKAGE_BASE_PATH,
  getKodiPackageRouteFallbacks
} from './kodi-package-route-contract.mjs';

export const DEFAULT_ADDON_ID = 'webinterface.chorus3';
export const PACKAGE_ROOT = 'dist/kodi';
export const TEMPLATE_PATH = 'kodi/addon.xml.template';
export const METADATA_PATH = 'kodi/addon-metadata.json';
export const PACKAGE_JSON_PATH = 'package.json';
export const DIST_INDEX_PATH = 'dist/index.html';
export const KODI_WEBINTERFACE_MARKER = '<meta name="chorus3:kodi-webinterface" content="{{id}}">';
export const KODI_WEBINTERFACE_BASE_RESOLVER = `<script data-chorus3-kodi-base-resolver>
(function () {
  var packageBase = '${KODI_PACKAGE_BASE_PATH}/';
  var pathname = (window.location && window.location.pathname) || '/';
  var baseHref = pathname === '${KODI_PACKAGE_BASE_PATH}' || pathname.indexOf(packageBase) === 0 ? packageBase : '/';
  document.write('<base href="' + baseHref.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '">');
})();
</script>`;

const REQUIRED_METADATA_FIELDS = [
  'id',
  'name',
  'summary',
  'description',
  'source',
  'license',
  'language',
  'platform'
];
const TEMPLATE_PLACEHOLDERS = new Set([
  'id',
  'name',
  'version',
  'summary',
  'description',
  'source',
  'license',
  'language',
  'platform'
]);
const ADDON_ID_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/;
const PACKAGE_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const FORBIDDEN_SEGMENTS = new Set([
  '.git',
  '.gsd',
  '.planning',
  '.audits',
  'node_modules',
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
  '.env.test'
]);
const ALLOWED_EXTENSIONS = new Set([
  '',
  '.avif',
  '.css',
  '.gif',
  '.htm',
  '.html',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.png',
  '.svg',
  '.txt',
  '.wasm',
  '.webmanifest',
  '.webp',
  '.woff',
  '.woff2',
  '.xml'
]);
const DETERMINISTIC_MTIME = new Date('2000-01-01T00:00:00.000Z');

export function getKodiArtifactPaths(root, addonId, packageVersion) {
  const packageRoot = join(root, PACKAGE_ROOT);
  return {
    packageRoot,
    stageDir: join(packageRoot, addonId),
    zipPath: join(packageRoot, `${addonId}-${packageVersion}.zip`)
  };
}

export function validateAddonInputs({ root = cwd() } = {}) {
  const metadata = readJsonFile(join(root, METADATA_PATH), 'metadata');
  const packageJson = readJsonFile(join(root, PACKAGE_JSON_PATH), 'package.json');
  const template = readRequiredTextFile(join(root, TEMPLATE_PATH), TEMPLATE_PATH);

  validateMetadata(metadata);
  const packageVersion = validatePackageVersion(packageJson.version);
  validateTemplate(template);

  return { metadata, packageVersion, template };
}

export function renderAddonXml({ root = cwd() } = {}) {
  const { metadata, packageVersion, template } = validateAddonInputs({ root });
  const values = {
    id: metadata.id,
    name: metadata.name.trim(),
    version: packageVersion,
    summary: metadata.summary.trim(),
    description: metadata.description.trim(),
    source: metadata.source.trim(),
    license: metadata.license.trim(),
    language: metadata.language.trim(),
    platform: metadata.platform.trim()
  };

  return {
    addonId: values.id,
    packageVersion,
    addonXml: template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_match, key) => escapeXml(values[key]))
  };
}

export function stageKodiWebinterfacePackage({
  root = cwd(),
  routeFallbacks = getKodiPackageRouteFallbacks()
} = {}) {
  const indexPath = join(root, DIST_INDEX_PATH);

  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    throw new Error(
      `[build-output] missing required build output ${DIST_INDEX_PATH}; run npm run build before packaging.`
    );
  }

  const { addonId, packageVersion, addonXml } = renderAddonXml({ root });
  const paths = getKodiArtifactPaths(root, addonId, packageVersion);

  rmSync(paths.packageRoot, { force: true, recursive: true });
  mkdirSync(paths.stageDir, { recursive: true });
  writeFileSync(join(paths.stageDir, 'addon.xml'), `${addonXml.trim()}\n`);

  const buildFiles = collectBuildFiles(join(root, 'dist'), paths.packageRoot, root);
  const entries = [`${addonId}/addon.xml`];

  for (const file of buildFiles) {
    const relativeToDist = toPosixPath(relative(join(root, 'dist'), file));
    assertAllowedBuildEntry(relativeToDist);
    const target = join(paths.stageDir, relativeToDist);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(file, target);
    entries.push(`${addonId}/${relativeToDist}`);
  }

  injectKodiWebinterfaceMarker({ addonId, stageDir: paths.stageDir });
  stageRouteFallbackEntrypoints({
    addonId,
    entries,
    routeFallbacks,
    sourceHtml: readFileSync(join(paths.stageDir, 'index.html'), 'utf8'),
    stageDir: paths.stageDir
  });

  entries.sort((left, right) => left.localeCompare(right));
  normalizeTimestamps(paths.stageDir);

  return {
    addonId,
    packageVersion,
    packageRoot: paths.packageRoot,
    stageDir: paths.stageDir,
    zipPath: paths.zipPath,
    entries
  };
}

export async function packageKodiWebinterface({ root = cwd(), runZip = runSystemZip } = {}) {
  let staged;

  try {
    staged = stageKodiWebinterfacePackage({ root });
  } catch (error) {
    return { ok: false, lines: [formatErrorMessage(error)] };
  }

  const zipName = basename(staged.zipPath);
  const lines = [
    `[metadata] rendered addon.xml for ${staged.addonId} ${staged.packageVersion}.`,
    `[staging] staged ${staged.entries.length} entries under ${toPosixPath(relative(root, staged.stageDir))}.`
  ];

  try {
    const result = await runZip({
      cwd: staged.packageRoot,
      args: ['-X', '-r', zipName, staged.addonId]
    });

    if (result.status !== 0) {
      return {
        ok: false,
        lines: [
          ...lines,
          `[zip] zip failed with exit code ${result.status}: ${sanitizeZipOutput(result.stderr || result.stdout || 'no output')}`
        ]
      };
    }
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return {
        ok: false,
        lines: [
          ...lines,
          '[zip] zip executable is unavailable. Install zip and rerun npm run package:kodi.'
        ]
      };
    }

    return {
      ok: false,
      lines: [...lines, `[zip] zip failed: ${sanitizeZipOutput(formatErrorMessage(error))}`]
    };
  }

  if (!existsSync(staged.zipPath) || !statSync(staged.zipPath).isFile()) {
    return {
      ok: false,
      lines: [
        ...lines,
        `[zip] zip completed but did not create ${toPosixPath(relative(root, staged.zipPath))}.`
      ]
    };
  }

  return {
    ok: true,
    addonId: staged.addonId,
    packageVersion: staged.packageVersion,
    stageDir: staged.stageDir,
    zipPath: staged.zipPath,
    entries: staged.entries,
    lines: [...lines, `[zip] created ${toPosixPath(relative(root, staged.zipPath))}.`]
  };
}

export function runSystemZip({ cwd, args }) {
  return new Promise((resolve, reject) => {
    const child = spawn('zip', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
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

function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('[metadata] metadata must be a JSON object.');
  }

  for (const field of REQUIRED_METADATA_FIELDS) {
    if (typeof metadata[field] !== 'string' || metadata[field].trim() === '') {
      throw new Error(`[metadata] metadata.${field} must be a non-blank string.`);
    }
  }

  if (
    !ADDON_ID_PATTERN.test(metadata.id) ||
    metadata.id.includes('..') ||
    metadata.id.includes('/')
  ) {
    throw new Error(
      '[metadata] metadata.id must be a safe reverse-DNS Kodi add-on id such as webinterface.chorus3.'
    );
  }
}

function validatePackageVersion(version) {
  if (typeof version !== 'string' || !PACKAGE_VERSION_PATTERN.test(version)) {
    throw new Error(
      '[metadata] package.json version must be a semver-like x.y.z string used for addon.xml and zip naming.'
    );
  }

  if (version === '0.0.0') {
    throw new Error(
      '[metadata] package.json version must not be 0.0.0; Kodi rejects placeholder add-on versions during install.'
    );
  }

  return version;
}

function validateTemplate(template) {
  const placeholders = [...template.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)].map((match) => match[1]);

  for (const placeholder of placeholders) {
    if (!TEMPLATE_PLACEHOLDERS.has(placeholder)) {
      throw new Error(`[metadata] template placeholder {{${placeholder}}} is not supported.`);
    }
  }

  for (const placeholder of TEMPLATE_PLACEHOLDERS) {
    if (!placeholders.includes(placeholder)) {
      throw new Error(`[metadata] template placeholder {{${placeholder}}} is required.`);
    }
  }
}

function readJsonFile(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `[metadata] ${label} is missing or invalid JSON at ${toPosixPath(path)}: ${formatErrorMessage(error)}`
    );
  }
}

function readRequiredTextFile(path, label) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    throw new Error(`[metadata] ${label} is missing or unreadable: ${formatErrorMessage(error)}`);
  }
}

function collectBuildFiles(distDir, packageRoot, root) {
  const files = [];

  function visit(path) {
    const relativeToDist = toPosixPath(relative(distDir, path));

    if (relativeToDist === toPosixPath(relative(distDir, packageRoot))) {
      return;
    }

    const stats = statSync(path);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(path).sort((left, right) => left.localeCompare(right))) {
        visit(join(path, entry));
      }
      return;
    }

    if (stats.isFile()) {
      files.push(path);
    }
  }

  for (const entry of readdirSync(distDir).sort((left, right) => left.localeCompare(right))) {
    if (entry === 'kodi') {
      continue;
    }
    visit(join(distDir, entry));
  }

  return files.sort((left, right) =>
    toPosixPath(relative(root, left)).localeCompare(toPosixPath(relative(root, right)))
  );
}

function stageRouteFallbackEntrypoints({ addonId, entries, routeFallbacks, sourceHtml, stageDir }) {
  for (const fallback of routeFallbacks) {
    validateRouteFallback(fallback);
    const target = join(stageDir, fallback.stagedIndexPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, sourceHtml);

    const entry = `${addonId}/${fallback.stagedIndexPath}`;
    if (!entries.includes(entry)) {
      entries.push(entry);
    }
  }
}

function validateRouteFallback(fallback) {
  if (!fallback || typeof fallback !== 'object') {
    throw new Error('[fallback] route fallback must be an object.');
  }

  if (typeof fallback.name !== 'string' || fallback.name.trim() === '') {
    throw new Error('[fallback] route fallback name must be a non-blank string.');
  }

  if (typeof fallback.routePath !== 'string' || !fallback.routePath.startsWith('/')) {
    throw new Error(`[fallback] ${fallback.name} routePath must be an absolute app route.`);
  }

  const stagedIndexPath = fallback.stagedIndexPath;
  if (typeof stagedIndexPath !== 'string' || stagedIndexPath.trim() === '') {
    throw new Error(`[fallback] ${fallback.name} stagedIndexPath must be non-blank.`);
  }

  const normalizedPath = toPosixPath(stagedIndexPath);
  const segments = normalizedPath.split('/');
  const normalizedRouteFile = fallback.routePath.replace(/^\//u, '');
  const isNestedIndex = normalizedPath.endsWith('/index.html');
  const isExtensionlessRouteFile = normalizedPath === normalizedRouteFile;
  if (
    normalizedPath !== stagedIndexPath ||
    normalizedPath.startsWith('/') ||
    normalizedPath.includes('//') ||
    segments.includes('..') ||
    segments.includes('.') ||
    normalizedPath === 'index.html' ||
    (!isNestedIndex && !isExtensionlessRouteFile)
  ) {
    throw new Error(
      `[fallback] ${fallback.name} stagedIndexPath ${stagedIndexPath} must be a nested safe index.html path or extensionless route file.`
    );
  }
}

function injectKodiWebinterfaceMarker({ addonId, stageDir }) {
  const indexPath = join(stageDir, 'index.html');
  const html = readFileSync(indexPath, 'utf8');
  const marker = KODI_WEBINTERFACE_MARKER.replace('{{id}}', escapeHtmlAttribute(addonId));
  const transformed = injectKodiWebinterfaceHead({ html, marker, sourceLabel: 'dist/index.html' });

  writeFileSync(indexPath, transformed);
}

function injectKodiWebinterfaceHead({ html, marker, sourceLabel }) {
  if (html.includes('data-chorus3-kodi-base-resolver')) {
    if (!html.includes('name="chorus3:kodi-webinterface"')) {
      throw new Error(
        `[fallback] ${sourceLabel} has resolver but is missing Kodi webinterface marker.`
      );
    }
    assertResolverBeforeAssets({ html, sourceLabel });
    return html;
  }

  const headMatch = /<head\b[^>]*>/i.exec(html);
  if (!headMatch || headMatch.index === undefined) {
    throw new Error(
      `[fallback] ${sourceLabel} is missing a <head> injection point before staged asset tags.`
    );
  }

  const firstAssetIndex = findFirstAssetTagIndex(html);
  if (firstAssetIndex !== -1 && firstAssetIndex < headMatch.index) {
    throw new Error(
      `[fallback] ${sourceLabel} has asset tags before the safe base resolver injection point.`
    );
  }

  const insertion = `\n    ${marker}\n    ${KODI_WEBINTERFACE_BASE_RESOLVER.replaceAll('\n', '\n    ')}`;
  const transformed = rewriteKodiPackageAssetTags(
    html.replace(/<head\b([^>]*)>/i, `<head$1>${insertion}`)
  );
  assertResolverBeforeAssets({ html: transformed, sourceLabel });
  return transformed;
}

function rewriteKodiPackageAssetTags(html) {
  return html.replace(
    /\b(src|href)=(['"])\.\/assets\//gi,
    (_match, attribute, quote) => `${attribute}=${quote}${KODI_PACKAGE_BASE_PATH}/assets/`
  );
}

function assertResolverBeforeAssets({ html, sourceLabel }) {
  const resolverIndex = html.indexOf('data-chorus3-kodi-base-resolver');
  const firstAssetIndex = findFirstAssetTagIndex(html);

  if (resolverIndex === -1) {
    throw new Error(`[fallback] ${sourceLabel} is missing the Kodi package base resolver.`);
  }

  if (firstAssetIndex !== -1 && resolverIndex > firstAssetIndex) {
    throw new Error(
      `[fallback] ${sourceLabel} places the Kodi package base resolver after asset tags.`
    );
  }
}

function findFirstAssetTagIndex(html) {
  const packageAssetRoot = escapeRegExp(`${KODI_PACKAGE_BASE_PATH}/assets/`);
  const assetTagPattern = new RegExp(
    `\\b(?:src|href)=(['"])(?:\\./assets/|${packageAssetRoot})`,
    'gi'
  );
  const indexes = [...html.matchAll(assetTagPattern)].map((match) => match.index ?? -1);
  return indexes.length === 0 ? -1 : Math.min(...indexes);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTimestamps(path) {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    for (const entry of readdirSync(path).sort((left, right) => left.localeCompare(right))) {
      normalizeTimestamps(join(path, entry));
    }
  }

  utimesSync(path, DETERMINISTIC_MTIME, DETERMINISTIC_MTIME);
}

function assertAllowedBuildEntry(relativePath) {
  const segments = relativePath.split('/');
  const name = segments.at(-1) ?? '';

  if (relativePath.includes('..') || relativePath.startsWith('/')) {
    throw new Error(
      `[staging] forbidden build entry dist/${relativePath}: path must stay within dist/.`
    );
  }

  if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment))) {
    throw new Error(
      `[staging] forbidden build entry dist/${relativePath}: forbidden directory segment.`
    );
  }

  if (FORBIDDEN_BASENAMES.has(name) || name.startsWith('.env.')) {
    throw new Error(
      `[staging] forbidden build entry dist/${relativePath}: environment files are never packaged.`
    );
  }

  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(name)) {
    throw new Error(
      `[staging] forbidden build entry dist/${relativePath}: test files are never packaged.`
    );
  }

  if (!ALLOWED_EXTENSIONS.has(extname(name).toLowerCase())) {
    throw new Error(`[staging] forbidden build entry dist/${relativePath}: unexpected file type.`);
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function sanitizeZipOutput(output) {
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
  const result = await packageKodiWebinterface();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
