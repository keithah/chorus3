#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_IGNORED_SEGMENTS = new Set([
  '.git',
  '.gsd',
  '.svelte-kit',
  'build',
  'coverage',
  'dist',
  'node_modules'
]);

const SCANNABLE_FILE_PATTERN = /\.(?:coffee|eco|js|jsx|ts|tsx|html|hbs|json)$/u;
const JSON_RPC_METHOD_PATTERN = /\b([A-Z][A-Za-z0-9]+(?:\.[A-Z][A-Za-z0-9]+)+)\b/g;
const COMMAND_HANDLER_PATTERN =
  /\b(?:App|app)\.(?:commands|reqres)\.setHandler\s*(?:\(\s*)?(['"])([^'"]+)\1/g;
const REMOTE_CONTROL_PATTERN = /\bdata-type\s*=\s*(['"])([^'"]+)\1/g;
const NAV_PATH_PATTERN = /(?:\bpath\s*:\s*|,\s*)(['"])(\/?[A-Za-z0-9_/#:?.-][^'"]*)\1/g;
const COMMAND_NAMESPACE_PATTERN = /\bcommandNameSpace\s*:\s*(['"])([^'"]+)\1/;
const GET_COMMAND_LITERAL_PATTERN = /(?:@|\bthis\.)?getCommand\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
const GET_COMMAND_DYNAMIC_PATTERN = /(?:@|\bthis\.)?getCommand\s*\(\s*type\s*\)/g;
const SECRETISH_PATTERN =
  /(?:authorization|basic\s+[a-z0-9+/=]+|password|token|localStorage|sessionStorage|[?&][A-Za-z0-9_.-]*(?:token|password|secret)[A-Za-z0-9_.-]*=)/iu;

function createResult(items = [], diagnostics = []) {
  return {
    diagnostics: [...diagnostics].sort((left, right) => left.localeCompare(right)),
    items: sortItems(dedupeItems(items))
  };
}

export function scanChorus2Parity({ root = cwd() } = {}) {
  const absoluteRoot = isAbsolute(root) ? root : join(cwd(), root);
  const displayRoot = displayScanRoot(absoluteRoot);

  if (!existsSync(absoluteRoot)) {
    return createResult([], [`[scan] missing scan root: ${displayRoot}`]);
  }

  const files = collectFiles(absoluteRoot, absoluteRoot, DEFAULT_IGNORED_SEGMENTS);
  const items = [];
  const diagnostics = [];
  const remoteControls = [];

  for (const file of files) {
    const path = repoRelativePath(file, absoluteRoot);
    let source;

    try {
      source = readFileSync(file, 'utf8');
    } catch (error) {
      diagnostics.push(`[scan] failed to read ${path}: ${error.code ?? 'read-error'}`);
      continue;
    }

    const remote = extractRemoteControlTypes(source, path);
    remoteControls.push(...remote.items);

    for (const result of [
      extractAppRoutes(source, path),
      extractNavPaths(source, path),
      remote,
      extractCommandHandlers(source, path),
      extractJsonRpcMethods(source, path),
      extractDynamicJsonRpcMethods(source, path)
    ]) {
      items.push(...result.items);
      diagnostics.push(...result.diagnostics);
    }
  }

  const dynamicWithGlobalControls = files.flatMap((file) => {
    const path = repoRelativePath(file, absoluteRoot);
    let source;

    try {
      source = readFileSync(file, 'utf8');
    } catch {
      return [];
    }

    if (!GET_COMMAND_DYNAMIC_PATTERN.test(source) || !COMMAND_NAMESPACE_PATTERN.test(source)) {
      GET_COMMAND_DYNAMIC_PATTERN.lastIndex = 0;
      COMMAND_NAMESPACE_PATTERN.lastIndex = 0;
      return [];
    }

    GET_COMMAND_DYNAMIC_PATTERN.lastIndex = 0;
    COMMAND_NAMESPACE_PATTERN.lastIndex = 0;
    const local = extractDynamicJsonRpcMethods(source, path, {
      remoteControlTypes: remoteControls.map((item) => item.surface)
    });
    diagnostics.push(...local.diagnostics);
    return local.items;
  });

  items.push(...dynamicWithGlobalControls);

  return createResult(items, diagnostics);
}

export function extractAppRoutes(source, path) {
  const lines = splitLines(source);
  const items = [];
  const diagnostics = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const marker = line.match(/^(\s*)appRoutes\s*:\s*$/u);

    if (!marker) {
      continue;
    }

    const baseIndent = marker[1].length;

    for (let row = index + 1; row < lines.length; row += 1) {
      const current = lines[row];

      if (current.trim() === '') {
        continue;
      }

      const indent = current.match(/^\s*/u)?.[0].length ?? 0;
      if (indent <= baseIndent) {
        break;
      }

      const routeMatch = current.match(/^\s*(['"])([^'"]*)\1\s*:\s*(['"])([^'"]+)\3/u);

      if (!routeMatch) {
        diagnostics.push(
          `[scan] ${sanitizeEvidencePath(path)}:${row + 1} skipped malformed appRoutes row: ${sanitizeText(current.trim())}`
        );
        continue;
      }

      const route = routeMatch[2];
      const handler = routeMatch[4];
      items.push(makeItem('route', familyFromHandler(handler), route, path, row + 1));
    }
  }

  return createResult(items, diagnostics);
}

export function extractNavPaths(source, path) {
  if (!/\b(?:navMain|nav\.push|nav\s*=)\b/u.test(source)) {
    return createResult();
  }

  const items = [];

  for (const match of source.matchAll(NAV_PATH_PATTERN)) {
    const surface = match[2];
    items.push(
      makeItem(
        'nav',
        familyFromPath(surface),
        surface,
        path,
        lineNumberForOffset(source, match.index ?? 0)
      )
    );
  }

  return createResult(items);
}

export function extractRemoteControlTypes(source, path) {
  const items = [];

  for (const match of source.matchAll(REMOTE_CONTROL_PATTERN)) {
    const surface = match[2];
    items.push(
      makeItem('control', 'remote', surface, path, lineNumberForOffset(source, match.index ?? 0))
    );
  }

  return createResult(items);
}

export function extractCommandHandlers(source, path) {
  const items = [];

  for (const match of source.matchAll(COMMAND_HANDLER_PATTERN)) {
    const surface = match[2];
    items.push(
      makeItem(
        'action',
        surface.split(':')[0] || 'command',
        surface,
        path,
        lineNumberForOffset(source, match.index ?? 0)
      )
    );
  }

  return createResult(items);
}

export function extractJsonRpcMethods(source, path) {
  const items = [];

  for (const match of source.matchAll(JSON_RPC_METHOD_PATTERN)) {
    const surface = match[1];

    if (!isLikelyJsonRpcMethod(surface)) {
      continue;
    }

    items.push(
      makeItem(
        'jsonrpc',
        surface.split('.')[0],
        surface,
        path,
        lineNumberForOffset(source, match.index ?? 0)
      )
    );
  }

  return createResult(items);
}

export function extractDynamicJsonRpcMethods(source, path, options = {}) {
  const namespaceMatch = source.match(COMMAND_NAMESPACE_PATTERN);
  const namespace = namespaceMatch?.[2];

  if (!namespace) {
    return createResult();
  }

  const namespaceLine = lineNumberForOffset(source, namespaceMatch.index ?? 0);
  const methods = [];

  for (const match of source.matchAll(GET_COMMAND_LITERAL_PATTERN)) {
    methods.push({ line: lineNumberForOffset(source, match.index ?? 0), value: match[2] });
  }

  if (GET_COMMAND_DYNAMIC_PATTERN.test(source)) {
    for (const type of [
      ...extractRemoteControlTypes(source, path).items.map((item) => item.surface),
      ...(options.remoteControlTypes ?? [])
    ]) {
      methods.push({ line: namespaceLine, value: type });
    }
  }
  GET_COMMAND_DYNAMIC_PATTERN.lastIndex = 0;

  const items = methods.map(({ line, value }) =>
    makeItem('jsonrpc', namespace, `${namespace}.${value}`, path, line, [
      `${sanitizeEvidencePath(path)}:${namespaceLine}`
    ])
  );

  return createResult(items);
}

export function normalizeParityId(kind, family, surface) {
  return [
    kind,
    slugify(String(family || 'unknown')),
    slugifySurface(kind, String(surface ?? 'unknown'))
  ].join(':');
}

export function formatScanSummary(scan) {
  const counts = new Map();

  for (const kind of ['route', 'nav', 'control', 'action', 'jsonrpc']) {
    counts.set(kind, 0);
  }

  for (const item of scan.items) {
    counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  }

  const families = uniqueSorted(scan.items.map((item) => item.family));
  const lines = [
    '[scan] Chorus2 parity scan summary',
    `items: ${scan.items.length}`,
    ...[...counts].map(([kind, count]) => `${kind}: ${count}`),
    `families: ${families.length > 0 ? families.join(', ') : '(none)'}`,
    `diagnostics: ${scan.diagnostics.length}`
  ];

  lines.push(...scan.diagnostics);
  return lines.join('\n');
}

function collectFiles(path, root, ignoredSegments) {
  let stats;

  try {
    stats = statSync(path);
  } catch {
    return [];
  }

  const relativePath = repoRelativePath(path, root);
  if (relativePath && includesIgnoredSegment(relativePath, ignoredSegments)) {
    return [];
  }

  if (stats.isFile()) {
    return SCANNABLE_FILE_PATTERN.test(relativePath) ? [path] : [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(path, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => collectFiles(join(path, entry.name), root, ignoredSegments));
}

function includesIgnoredSegment(path, ignoredSegments) {
  return toPosixPath(path)
    .split('/')
    .some((segment) => ignoredSegments.has(segment));
}

function makeItem(kind, family, surface, path, line, extraEvidence = []) {
  const normalizedFamily = normalizeFamily(family);
  const safeSurface = sanitizeSurface(surface);
  return {
    evidence: uniqueSorted([`${sanitizeEvidencePath(path)}:${line}`, ...extraEvidence]),
    family: normalizedFamily,
    id: normalizeParityId(kind, normalizedFamily, safeSurface),
    kind,
    surface: safeSurface
  };
}

function dedupeItems(items) {
  const byId = new Map();

  for (const item of items) {
    const existing = byId.get(item.id);

    if (!existing) {
      byId.set(item.id, { ...item, evidence: uniqueSorted(item.evidence) });
      continue;
    }

    existing.evidence = uniqueSorted([...existing.evidence, ...item.evidence]);
  }

  return [...byId.values()];
}

function sortItems(items) {
  return [...items].sort((left, right) => left.id.localeCompare(right.id));
}

function isLikelyJsonRpcMethod(surface) {
  const family = surface.split('.')[0];
  return /^(?:Addons|Application|AudioLibrary|Files|GUI|Input|JSONRPC|PVR|Player|Playlist|Profiles|Settings|System|Textures|VideoLibrary|XBMC)$/u.test(
    family
  );
}

function familyFromHandler(handler) {
  return handler.replace(/([a-z0-9])([A-Z])/gu, '$1-$2');
}

function familyFromPath(path) {
  const [first, second] = path.replace(/^\/+|\/+$/gu, '').split('/');
  return first || second || 'root';
}

function normalizeFamily(family) {
  return slugify(String(family || 'unknown'));
}

function slugifySurface(kind, surface) {
  if (surface === '' || surface === '/') {
    return 'root';
  }

  let value = surface;

  if (kind === 'jsonrpc' && surface.includes('.')) {
    value = surface.slice(surface.indexOf('.') + 1);
  }

  return slugify(value.replace(/:([A-Za-z0-9_]+)/gu, '-$1'));
}

function slugify(value) {
  return (
    value
      .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '') || 'unknown'
  );
}

function sanitizeSurface(surface) {
  const value = String(surface ?? '').trim();

  if (SECRETISH_PATTERN.test(value)) {
    return '[redacted]';
  }

  return value.split('?')[0].replace(/#.*$/u, '');
}

function sanitizeText(text) {
  const value = String(text ?? '').trim();
  return SECRETISH_PATTERN.test(value) ? '[redacted]' : value;
}

function sanitizeEvidencePath(path) {
  return toPosixPath(path)
    .replace(/^[A-Za-z]:/u, '')
    .replace(/^\/+tmp\/[A-Za-z0-9_.-]+\//u, '');
}

function displayScanRoot(path) {
  const relativePath = toPosixPath(relative(cwd(), path));

  if (!relativePath || relativePath === '.') {
    return '.';
  }

  if (relativePath.startsWith('..')) {
    return toPosixPath(path).split('/').pop() || '.';
  }

  return relativePath;
}

function repoRelativePath(path, root) {
  const relativePath = toPosixPath(relative(root, path));

  if (!relativePath || relativePath === '.') {
    return toPosixPath(path).split('/').pop() || '.';
  }

  if (relativePath.startsWith('..')) {
    return toPosixPath(path).split('/').slice(-2).join('/');
  }

  return relativePath;
}

function toPosixPath(path) {
  return String(path).split('\\').join('/');
}

function splitLines(source) {
  return source.split(/\r?\n/u);
}

function lineNumberForOffset(contents, offset) {
  return contents.slice(0, offset).split(/\r?\n/u).length;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function parseArgs(args) {
  const parsed = { format: 'summary', root: 'chorus2-21.x-1.0.1' };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--root') {
      parsed.root = args[index + 1] ?? parsed.root;
      index += 1;
    } else if (arg === '--format') {
      parsed.format = args[index + 1] ?? parsed.format;
      index += 1;
    }
  }

  return parsed;
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const options = parseArgs(argv.slice(2));

  if (!['json', 'summary'].includes(options.format)) {
    console.error('[scan] unsupported --format. Expected json or summary.');
    exit(1);
  }

  const scan = scanChorus2Parity({ root: options.root });

  if (options.format === 'json') {
    console.log(JSON.stringify(scan, null, 2));
  } else {
    console.log(formatScanSummary(scan));
  }

  if (
    scan.items.length === 0 &&
    scan.diagnostics.some((diagnostic) => diagnostic.includes('missing scan root'))
  ) {
    exit(1);
  }
}
