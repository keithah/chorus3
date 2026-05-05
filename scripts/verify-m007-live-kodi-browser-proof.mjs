#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { argv, env, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  KODI_PACKAGE_BASE_PATH,
  getKodiPackageRouteFallbacks
} from './kodi-package-route-contract.mjs';

export const DEFAULT_LIVE_KODI_ORIGIN = 'http://localhost:8080';
export const DEFAULT_LIVE_KODI_TIMEOUT_MS = 5000;
export const LIVE_KODI_MARKERS = Object.freeze([
  'chorus3:kodi-webinterface',
  'data-chorus3-kodi-base-resolver'
]);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const SAFE_REMOTE_PROPERTIES = Object.freeze(['volume']);
const FAILURE_CLASSES = new Set([
  'unavailable',
  'auth-required',
  'timeout',
  'malformed-response',
  'wrong-webinterface',
  'route-failed',
  'asset-failed',
  'browser-error',
  'browser-timeout',
  'console-error',
  'remote-sanitized-failure',
  'remote-timeout',
  'remote-malformed'
]);

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeLocalKodiOrigin(rawOrigin = DEFAULT_LIVE_KODI_ORIGIN) {
  let url;

  try {
    url = new URL(rawOrigin || DEFAULT_LIVE_KODI_ORIGIN);
  } catch {
    throw new Error('Kodi live proof origin must be a valid URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Kodi live proof origin must use http:// or https://.');
  }

  if (url.username || url.password) {
    throw new Error(
      'Kodi live proof origin must not include credentials; use KODI_USERNAME and KODI_PASSWORD.'
    );
  }

  const hostname = url.hostname.toLowerCase();
  if (!LOCAL_HOSTNAMES.has(hostname)) {
    throw new Error('Kodi live proof origin is local-only and must target localhost or loopback.');
  }

  url.hash = '';
  url.search = '';
  url.pathname = '/';

  return url.toString();
}

export function buildLiveRouteMatrix(rawOrigin = DEFAULT_LIVE_KODI_ORIGIN) {
  const origin = normalizeLocalKodiOrigin(rawOrigin);
  const routes = [
    {
      id: 'active-root',
      label: 'Active root',
      path: '/',
      url: new URL('/', origin).toString(),
      surface: 'active-root'
    },
    {
      id: 'package-root',
      label: 'Package root',
      path: `${KODI_PACKAGE_BASE_PATH}/`,
      url: new URL(`${KODI_PACKAGE_BASE_PATH}/`, origin).toString(),
      surface: 'package-root'
    }
  ];

  for (const fallback of getKodiPackageRouteFallbacks()) {
    const path = `${KODI_PACKAGE_BASE_PATH}${fallback.routePath}`.replace(/\/+/gu, '/');
    routes.push({
      id: `package-${fallback.name}`,
      label: `Package ${fallback.name}`,
      path,
      url: new URL(path, origin).toString(),
      surface: 'package-route'
    });
  }

  assertBoundedRouteMatrix(routes);
  return routes;
}

function assertBoundedRouteMatrix(routes) {
  const allowedPaths = new Set([
    '/',
    `${KODI_PACKAGE_BASE_PATH}/`,
    ...getKodiPackageRouteFallbacks().map(
      (fallback) => `${KODI_PACKAGE_BASE_PATH}${fallback.routePath}`
    )
  ]);

  for (const route of routes) {
    if (!allowedPaths.has(route.path)) {
      throw new Error(`Live Kodi proof route outside bounded contract: ${route.id}.`);
    }
  }
}

export function redactForLiveKodiProof(value) {
  return String(value ?? '')
    .replace(/https?:\/\/[^\s`|)]+:[^\s`|)@]+@[^\s`|)]+/giu, '[redacted-credential-url]')
    .replace(
      /\b(?:Authorization|Proxy-Authorization)\s*:\s*(?:Basic\s+|Bearer\s+)?[^\s`|)]+/giu,
      '[redacted-authorization]'
    )
    .replace(/\bBasic\s+[A-Za-z0-9+/=._:-]{8,}/gu, '[redacted-authorization]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gu, '[redacted-authorization]')
    .replace(/\{[^\n{}]*"jsonrpc"\s*:[^\n{}]*\}/giu, '[redacted-json-rpc-body]')
    .replace(
      /\b(?:password|passwd|token|secret|credential)=[^\s`|)]+/giu,
      '[redacted-secret-param]'
    )
    .replace(
      /(?:^|\s)(?:\/(?:Users|home|Volumes|mnt|media|var|tmp)\/[^\s`|)]+)/gu,
      ' [redacted-local-path]'
    )
    .replace(/\b(?:smb|nfs|special):\/\/[^\s`|)]+/giu, '[redacted-media-path]')
    .replace(
      /(?:^|[\s`|])(?:\.gsd|\.planning|\.audits)(?:\/[^\s`|)]*)?/giu,
      ' [redacted-ignored-path]'
    )
    .trim();
}

export function classifyRootProbe(response, body) {
  if (response.status === 401 || response.status === 403) {
    return status('probe', 'auth-required', { httpClass: `http-${response.status}` });
  }

  if (!response.ok) {
    return status('probe', 'route-failed', { httpClass: httpStatusClass(response.status) });
  }

  if (body === undefined) {
    return status('probe', 'passed', { httpClass: 'http-2xx' });
  }

  if (LIVE_KODI_MARKERS.some((marker) => body.includes(marker))) {
    return status('probe', 'passed', { httpClass: 'http-2xx' });
  }

  return status('probe', 'wrong-webinterface', { httpClass: 'http-2xx' });
}

export async function classifyJsonRpcProbe(response) {
  if (response.status === 401 || response.status === 403) {
    return status('probe', 'auth-required', { httpClass: `http-${response.status}` });
  }

  if (!response.ok) {
    return status('probe', 'route-failed', { httpClass: httpStatusClass(response.status) });
  }

  let envelope;
  try {
    envelope = await response.json();
  } catch {
    return status('probe', 'malformed-response', { httpClass: 'http-2xx' });
  }

  if (!envelope || typeof envelope !== 'object' || envelope.jsonrpc !== '2.0') {
    return status('probe', 'malformed-response', { httpClass: 'http-2xx' });
  }

  if ('error' in envelope) {
    return status('probe', 'remote-sanitized-failure', { httpClass: 'http-2xx' });
  }

  if (!('result' in envelope)) {
    return status('probe', 'malformed-response', { httpClass: 'http-2xx' });
  }

  return status('probe', 'passed', { httpClass: 'http-2xx' });
}

export function sanitizeBrowserDiagnostic(message) {
  const redacted = redactForLiveKodiProof(message);
  const lower = redacted.toLowerCase();

  if (/timeout|timed out/u.test(lower)) {
    return status('browser', 'browser-timeout', { messageClass: 'timeout' });
  }

  if (/404|not found|missing/u.test(lower) && /asset|\.js|\.css|\.woff|\.png|\.svg/u.test(lower)) {
    return status('browser', 'asset-failed', { messageClass: 'asset-missing' });
  }

  if (/console|uncaught|typeerror|referenceerror|syntaxerror|error:/u.test(lower)) {
    return status('browser', 'console-error', { messageClass: 'script-error' });
  }

  if (/err_connection|network|failed to fetch|connection refused/u.test(lower)) {
    return status('browser', 'browser-error', { messageClass: 'network-error' });
  }

  return status('browser', 'browser-error', { messageClass: 'diagnostic' });
}

export async function runLiveKodiProof(options = {}) {
  const origin = normalizeLocalKodiOrigin(options.origin ?? DEFAULT_LIVE_KODI_ORIGIN);
  const timeoutMs = parseTimeoutMs(options.timeoutMs ?? DEFAULT_LIVE_KODI_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;
  const credentials = credentialsFromEnv(options.env ?? env);
  const routes = buildLiveRouteMatrix(origin);
  const startedAt = new Date().toISOString();

  const probe = await probeRoot(origin, timeoutMs, fetchImpl);
  const jsonRpc = await probeJsonRpc(origin, timeoutMs, fetchImpl, credentials);
  const routeResults = [];
  const browserDiagnostics = [];

  if (!['unavailable', 'auth-required', 'timeout'].includes(probe.statusClass)) {
    for (const route of routes) {
      const routeResult = await checkLiveRoute(route, timeoutMs, fetchImpl);
      routeResults.push(routeResult);
    }
  } else {
    for (const route of routes) {
      routeResults.push({
        ...status('route', probe.statusClass, {
          routeId: route.id,
          pathClass: classifyPath(route.path),
          httpClass: probe.httpClass ?? 'not-run',
          assetClass: 'not-run',
          visibleDomRedactionClass: 'not-run'
        })
      });
    }
  }

  if (typeof options.browserDiagnostics === 'function') {
    const diagnostics = await options.browserDiagnostics({ origin, routes: routeResults });
    for (const diagnostic of diagnostics ?? []) {
      browserDiagnostics.push(
        typeof diagnostic === 'string'
          ? sanitizeBrowserDiagnostic(diagnostic)
          : sanitizeBrowserDiagnostic(JSON.stringify(diagnostic))
      );
    }
  }

  const remote = await maybeRunSafeRemoteCommand({
    origin,
    timeoutMs,
    fetchImpl,
    credentials,
    jsonRpc,
    routeResults
  });

  const statusClass = classifyOverallStatus({
    probe,
    jsonRpc,
    routeResults,
    browserDiagnostics,
    remote
  });
  const r069Validated = statusClass === 'passed';

  return {
    startedAt,
    originClass: 'local-loopback',
    statusClass,
    r069Validated,
    probe,
    jsonRpc,
    routes: routeResults,
    browserDiagnostics,
    remote
  };
}

async function probeRoot(origin, timeoutMs, fetchImpl) {
  const url = new URL('/', origin).toString();

  try {
    const response = await fetchWithTimeout(fetchImpl, url, { method: 'GET' }, timeoutMs);
    const body = await safeText(response);
    return classifyRootProbe(response, body);
  } catch (error) {
    return classifyFetchFailure('probe', error);
  }
}

async function probeJsonRpc(origin, timeoutMs, fetchImpl, credentials) {
  try {
    const response = await postKodiJsonRpc(
      origin,
      { method: 'JSONRPC.Ping' },
      timeoutMs,
      fetchImpl,
      credentials
    );
    return classifyJsonRpcProbe(response);
  } catch (error) {
    return classifyFetchFailure('probe', error);
  }
}

async function checkLiveRoute(route, timeoutMs, fetchImpl) {
  try {
    const response = await fetchWithTimeout(fetchImpl, route.url, { method: 'GET' }, timeoutMs);
    const html = await safeText(response);
    const base = new URL(route.url);
    const assetFailures = response.ok
      ? await collectAssetFailures(html, base, timeoutMs, fetchImpl)
      : [];
    const visibleDomRedactionClass =
      scanVisibleTextForRedaction(html).length === 0 ? 'passed' : 'redaction-failed';

    let statusClass = 'passed';
    if (response.status === 401 || response.status === 403) {
      statusClass = 'auth-required';
    } else if (!response.ok) {
      statusClass = 'route-failed';
    } else if (assetFailures.length > 0) {
      statusClass = 'asset-failed';
    } else if (!LIVE_KODI_MARKERS.some((marker) => html.includes(marker))) {
      statusClass = 'wrong-webinterface';
    } else if (visibleDomRedactionClass !== 'passed') {
      statusClass = 'route-failed';
    }

    return status('route', statusClass, {
      routeId: route.id,
      pathClass: classifyPath(route.path),
      httpClass: httpStatusClass(response.status),
      assetClass: assetFailures.length === 0 ? 'passed' : 'asset-failed',
      visibleDomRedactionClass
    });
  } catch (error) {
    return {
      ...classifyFetchFailure('route', error),
      routeId: route.id,
      pathClass: classifyPath(route.path),
      httpClass: 'not-available',
      assetClass: 'not-run',
      visibleDomRedactionClass: 'not-run'
    };
  }
}

async function maybeRunSafeRemoteCommand({
  origin,
  timeoutMs,
  fetchImpl,
  credentials,
  jsonRpc,
  routeResults
}) {
  const remoteRoute = routeResults.find((route) => route.routeId === 'package-remote');

  if (jsonRpc.statusClass !== 'passed' || remoteRoute?.statusClass !== 'passed') {
    return status('remote', 'remote-sanitized-failure', { remoteCommandClass: 'not-run' });
  }

  try {
    const response = await postKodiJsonRpc(
      origin,
      {
        method: 'Application.GetProperties',
        params: { properties: SAFE_REMOTE_PROPERTIES }
      },
      timeoutMs,
      fetchImpl,
      credentials
    );

    if (response.status === 401 || response.status === 403) {
      return status('remote', 'remote-sanitized-failure', { remoteCommandClass: 'auth-required' });
    }

    if (!response.ok) {
      return status('remote', 'remote-sanitized-failure', {
        remoteCommandClass: httpStatusClass(response.status)
      });
    }

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      return status('remote', 'remote-malformed', { remoteCommandClass: 'malformed-response' });
    }

    if (
      !envelope ||
      typeof envelope !== 'object' ||
      envelope.jsonrpc !== '2.0' ||
      !('result' in envelope)
    ) {
      return status('remote', 'remote-malformed', { remoteCommandClass: 'malformed-response' });
    }

    return status('remote', 'passed', { remoteCommandClass: 'volume-readback' });
  } catch (error) {
    if (isTimeoutError(error)) {
      return status('remote', 'remote-timeout', { remoteCommandClass: 'timeout' });
    }

    return status('remote', 'remote-sanitized-failure', { remoteCommandClass: 'network-error' });
  }
}

async function postKodiJsonRpc(origin, request, timeoutMs, fetchImpl, credentials) {
  return fetchWithTimeout(
    fetchImpl,
    new URL('/jsonrpc', origin).toString(),
    {
      method: 'POST',
      headers: createHeaders(credentials),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...request })
    },
    timeoutMs
  );
}

function createHeaders(credentials) {
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  if (credentials.username && credentials.password) {
    headers.set(
      'Authorization',
      `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`, 'utf8').toString('base64')}`
    );
  }

  return headers;
}

function credentialsFromEnv(sourceEnv) {
  return {
    username: hasValue(sourceEnv.KODI_USERNAME) ? sourceEnv.KODI_USERNAME.trim() : undefined,
    password: hasValue(sourceEnv.KODI_PASSWORD) ? sourceEnv.KODI_PASSWORD : undefined
  };
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function collectAssetFailures(html, baseUrl, timeoutMs, fetchImpl) {
  const failures = [];
  for (const assetUrl of extractHtmlAssetUrls(html, baseUrl)) {
    try {
      const response = await fetchWithTimeout(fetchImpl, assetUrl, { method: 'GET' }, timeoutMs);
      if (!response.ok) {
        failures.push(classifyAsset(assetUrl));
      }
    } catch (error) {
      failures.push(isTimeoutError(error) ? 'asset-timeout' : 'asset-failed');
    }
  }

  return failures;
}

function extractHtmlAssetUrls(html, documentUrl) {
  const urls = [];
  const assetPattern =
    /\b(?:src|href)=(['"])([^'"]+\.(?:js|css|woff2?|svg|png|jpe?g))(?:\?[^'"]*)?\1/giu;

  for (const match of html.matchAll(assetPattern)) {
    urls.push(new URL(match[2], documentUrl).toString());
  }

  return urls;
}

function classifyAsset(assetUrl) {
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

function scanVisibleTextForRedaction(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style[\s\S]*?<\/style>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ');
  const failures = [];

  for (const [label, pattern] of [
    ['authorization', /Authorization\s*[:=]|\bBearer\s+|\bBasic\s+[A-Za-z0-9+/=._:-]+/iu],
    ['credential-param', /\b(?:password|passwd|token|secret|credential)=/iu],
    ['raw-url', /(?:https?:|smb:|file:|special:)\/\//iu],
    ['local-path', /(?:^|\s)(?:\/(?:Users|home|Volumes|mnt|media|var|tmp)\/|[A-Za-z]:\\)/u]
  ]) {
    if (pattern.test(text)) {
      failures.push(label);
    }
  }

  return failures;
}

function classifyFetchFailure(phase, error) {
  if (isTimeoutError(error)) {
    return status(phase, 'timeout', { httpClass: 'timeout' });
  }

  return status(phase, 'unavailable', { httpClass: 'network-error' });
}

function isTimeoutError(error) {
  return (
    error?.name === 'AbortError' ||
    error?.message === 'timeout' ||
    error?.cause?.message === 'timeout' ||
    /timeout|aborted/iu.test(String(error?.message ?? ''))
  );
}

function classifyOverallStatus({ probe, jsonRpc, routeResults, browserDiagnostics, remote }) {
  const orderedFailures = [probe, jsonRpc, ...routeResults, ...browserDiagnostics, remote].filter(
    (item) => item && item.statusClass !== 'passed'
  );

  if (orderedFailures.length === 0) {
    return 'passed';
  }

  const first = orderedFailures[0].statusClass;
  return FAILURE_CLASSES.has(first) ? first : 'route-failed';
}

function status(phase, statusClass, extra = {}) {
  return { phase, statusClass, ...extra };
}

function httpStatusClass(statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    return 'http-2xx';
  }
  if (statusCode === 401 || statusCode === 403) {
    return `http-${statusCode}`;
  }
  if (statusCode >= 300 && statusCode < 400) {
    return 'http-3xx';
  }
  if (statusCode >= 400 && statusCode < 500) {
    return 'http-4xx';
  }
  if (statusCode >= 500) {
    return 'http-5xx';
  }
  return 'http-unknown';
}

function classifyPath(path) {
  if (path === '/') {
    return 'active-root';
  }
  if (path === `${KODI_PACKAGE_BASE_PATH}/`) {
    return 'package-root';
  }
  if (path.endsWith('/remote')) {
    return 'package-remote';
  }
  if (path.endsWith('/now-playing')) {
    return 'package-now-playing';
  }
  return 'package-route';
}

function parseTimeoutMs(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Kodi live proof timeout must be a positive integer.');
  }
  return parsed;
}

export function createLiveKodiProofSummary(result) {
  const lines = [
    `M007 live Kodi proof status: ${result.statusClass}.`,
    `Origin class: ${result.originClass}.`,
    `R069 validation: ${result.r069Validated ? 'live-pass evidence present' : 'blocked; live-pass evidence absent'}.`,
    `Probe: ${result.probe.statusClass}.`,
    `Status endpoint: ${result.jsonRpc.statusClass}.`,
    `Remote safe command: ${result.remote.statusClass}.`,
    'Routes:'
  ];

  for (const route of result.routes) {
    lines.push(
      `- ${route.routeId}: ${route.statusClass}; path=${route.pathClass}; http=${route.httpClass}; asset=${route.assetClass}; visible-dom=${route.visibleDomRedactionClass}.`
    );
  }

  if (result.browserDiagnostics.length > 0) {
    lines.push('Browser diagnostics:');
    for (const diagnostic of result.browserDiagnostics) {
      lines.push(`- ${diagnostic.statusClass}: ${diagnostic.messageClass}.`);
    }
  }

  return redactForLiveKodiProof(lines.join('\n'));
}

export function renderProofDocEvidenceBlock(result) {
  const summary = createLiveKodiProofSummary(result);
  return [
    '<!-- S09_LIVE_KODI_RUNNER_EVIDENCE_START -->',
    '## S09 Live Kodi Runner Evidence',
    '',
    `Recorded status classification: ${result.statusClass}.`,
    '',
    '```text',
    summary,
    '```',
    '',
    result.r069Validated
      ? 'R069 may be validated only by this live-pass evidence when paired with the command gates above.'
      : 'R069 remains blocked until live Kodi install/browser proof passes.',
    '<!-- S09_LIVE_KODI_RUNNER_EVIDENCE_END -->'
  ].join('\n');
}

export function updateProofDocWithRunnerEvidence(doc, result) {
  const block = renderProofDocEvidenceBlock(result);
  const pattern =
    /<!-- S09_LIVE_KODI_RUNNER_EVIDENCE_START -->[\s\S]*?<!-- S09_LIVE_KODI_RUNNER_EVIDENCE_END -->/u;

  if (pattern.test(doc)) {
    return doc.replace(pattern, block);
  }

  return `${doc.trim()}\n\n${block}\n`;
}

function parseCliArgs(args) {
  const parsed = {
    origin: DEFAULT_LIVE_KODI_ORIGIN,
    output: undefined,
    dryRun: false,
    timeoutMs: DEFAULT_LIVE_KODI_TIMEOUT_MS
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--origin') {
      parsed.origin = args[++index];
    } else if (arg === '--output') {
      parsed.output = args[++index];
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--timeout-ms') {
      parsed.timeoutMs = parseTimeoutMs(args[++index]);
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(
    `Usage: node scripts/verify-m007-live-kodi-browser-proof.mjs [--origin http://localhost:8080] [--dry-run] [--output docs/m007-live-kodi-install-proof.md] [--timeout-ms 5000]\n\nClassifies a local-only live Kodi Chorus3 proof run without printing credentials, raw transport bodies, local paths, media paths, or ignored planning paths. Credentials, when needed, must come from KODI_USERNAME and KODI_PASSWORD.`
  );
}

export async function runLiveKodiProofCli(args = argv.slice(2)) {
  const cli = parseCliArgs(args);
  if (cli.help) {
    printHelp();
    return { exitCode: 0 };
  }

  const result = await runLiveKodiProof(cli);
  const summary = createLiveKodiProofSummary(result);
  console.log(summary);

  if (cli.output && !cli.dryRun) {
    const doc = readFileSync(cli.output, 'utf8');
    writeFileSync(cli.output, updateProofDocWithRunnerEvidence(doc, result));
    console.log(`Proof document updated with sanitized ${result.statusClass} classification.`);
  }

  return { exitCode: 0, result };
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  try {
    const { exitCode } = await runLiveKodiProofCli();
    exit(exitCode);
  } catch (error) {
    console.error(redactForLiveKodiProof(error instanceof Error ? error.message : String(error)));
    exit(1);
  }
}
