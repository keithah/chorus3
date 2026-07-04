#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import { argv, env, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_M004_VIDEO_SMOKE_PORT = 8080;
export const DEFAULT_M004_VIDEO_SMOKE_PATH = '/jsonrpc';
export const DEFAULT_M004_VIDEO_SMOKE_TIMEOUT_MS = 5000;
export const VIDEO_SMOKE_LIMITS = { start: 0, end: 5 };
export const VIDEO_SMOKE_METHODS = [
  'JSONRPC.Ping',
  'VideoLibrary.GetMovies',
  'VideoLibrary.GetTVShows',
  'VideoLibrary.GetSeasons',
  'VideoLibrary.GetEpisodes',
  'Files.GetDirectory'
];

const SKIP_LINES = [
  'M004 video smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe read-only video diagnostics.',
  'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
];

const MOVIE_PROBE = {
  method: 'VideoLibrary.GetMovies',
  params: {
    limits: VIDEO_SMOKE_LIMITS,
    properties: ['title', 'year', 'runtime', 'thumbnail']
  },
  resultKey: 'movies'
};

const TV_SHOW_PROBE = {
  method: 'VideoLibrary.GetTVShows',
  params: {
    limits: VIDEO_SMOKE_LIMITS,
    properties: ['title', 'year', 'thumbnail']
  },
  resultKey: 'tvshows'
};

const SEASON_PROBE = {
  method: 'VideoLibrary.GetSeasons',
  params: {
    limits: VIDEO_SMOKE_LIMITS,
    properties: ['season', 'episode', 'thumbnail']
  },
  resultKey: 'seasons'
};

const REMAINING_VIDEO_PROBES = [
  {
    method: 'VideoLibrary.GetEpisodes',
    params: {
      limits: VIDEO_SMOKE_LIMITS,
      properties: ['title', 'season', 'episode', 'runtime', 'thumbnail']
    },
    resultKey: 'episodes'
  },
  {
    method: 'Files.GetDirectory',
    params: { directory: 'special://videoplaylists', media: 'video', limits: VIDEO_SMOKE_LIMITS },
    resultKey: 'files',
    successLine: 'Video playlist root: listed read-only metadata only.'
  }
];

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveInteger(value, name) {
  if (!hasValue(value)) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parseBoolean(value, name) {
  if (!hasValue(value)) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`${name} must be one of true/false, yes/no, on/off, or 1/0.`);
}

function normalizePath(path) {
  if (!hasValue(path)) {
    return DEFAULT_M004_VIDEO_SMOKE_PATH;
  }

  const trimmed = path.trim();
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function createEndpointDescription(url, timeoutMs, hasCredentials) {
  return {
    protocol: url.protocol,
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : DEFAULT_M004_VIDEO_SMOKE_PORT)),
    path: `${url.pathname || DEFAULT_M004_VIDEO_SMOKE_PATH}${url.search}`,
    timeoutMs,
    hasCredentials
  };
}

function parseUrlEndpoint(rawUrl, timeoutMs, hasCredentials) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('KODI_HTTP_URL must be a valid http:// or https:// URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('KODI_HTTP_URL must use http:// or https://.');
  }

  if (!url.hostname) {
    throw new Error('KODI_HTTP_URL must include a hostname.');
  }

  if (url.username || url.password) {
    throw new Error(
      'KODI_HTTP_URL must not include credentials; use KODI_USERNAME and KODI_PASSWORD.'
    );
  }

  if (!url.pathname || url.pathname === '/') {
    url.pathname = DEFAULT_M004_VIDEO_SMOKE_PATH;
  }

  return {
    endpoint: url.toString(),
    endpointDescription: createEndpointDescription(url, timeoutMs, hasCredentials)
  };
}

function buildSplitEndpoint(sourceEnv, timeoutMs, hasCredentials) {
  const host = sourceEnv.KODI_HOST?.trim();
  if (!host) {
    throw new Error('KODI_HOST is required when KODI_HTTP_URL is not set.');
  }

  const port =
    parsePositiveInteger(sourceEnv.KODI_PORT, 'KODI_PORT') ?? DEFAULT_M004_VIDEO_SMOKE_PORT;
  if (port > 65535) {
    throw new Error('KODI_PORT must be between 1 and 65535.');
  }

  const useTls = parseBoolean(sourceEnv.KODI_USE_TLS, 'KODI_USE_TLS');
  const endpoint = new URL(`${useTls ? 'https' : 'http'}://${host}`);
  endpoint.port = String(port);
  endpoint.pathname = normalizePath(sourceEnv.KODI_PATH);

  return {
    endpoint: endpoint.toString(),
    endpointDescription: createEndpointDescription(endpoint, timeoutMs, hasCredentials)
  };
}

export function parseM004VideoSmokeEnv(sourceEnv = env) {
  const hasUrl = sourceEnv.KODI_HTTP_URL !== undefined && sourceEnv.KODI_HTTP_URL !== '';
  const hasHost = sourceEnv.KODI_HOST !== undefined && sourceEnv.KODI_HOST !== '';

  if (!hasUrl && !hasHost) {
    return { ok: true, skipped: true, lines: SKIP_LINES };
  }

  try {
    if (hasUrl && hasHost) {
      throw new Error('Use either KODI_HTTP_URL or KODI_HOST/KODI_PORT, not both.');
    }

    const timeoutMs =
      parsePositiveInteger(sourceEnv.KODI_TIMEOUT_MS, 'KODI_TIMEOUT_MS') ??
      DEFAULT_M004_VIDEO_SMOKE_TIMEOUT_MS;
    const username = hasValue(sourceEnv.KODI_USERNAME) ? sourceEnv.KODI_USERNAME.trim() : undefined;
    const password = hasValue(sourceEnv.KODI_PASSWORD) ? sourceEnv.KODI_PASSWORD : undefined;
    const hasCredentials = Boolean(username && password);
    const endpointDetails = hasUrl
      ? parseUrlEndpoint(sourceEnv.KODI_HTTP_URL, timeoutMs, hasCredentials)
      : buildSplitEndpoint(sourceEnv, timeoutMs, hasCredentials);

    return {
      ok: true,
      skipped: false,
      config: {
        ...endpointDetails,
        timeoutMs,
        ...(username ? { username } : {}),
        ...(password ? { password } : {})
      }
    };
  } catch (error) {
    return {
      ok: false,
      code: 'invalid-env',
      lines: [`M004 video smoke configuration error: ${safeErrorMessage(error)}`]
    };
  }
}

function safeErrorMessage(error) {
  return error instanceof Error && error.message ? error.message : 'Unknown failure.';
}

function createHeaders(config) {
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  if (config.username && config.password) {
    headers.set(
      'Authorization',
      `Basic ${Buffer.from(`${config.username}:${config.password}`, 'utf8').toString('base64')}`
    );
  }

  return headers;
}

function createJsonRpcRequest(id, method, params) {
  const request = { jsonrpc: '2.0', id, method };

  if (params !== undefined) {
    request.params = params;
  }

  return request;
}

function classifyHttpStatus(status) {
  if (status === 401 || status === 403) {
    return 'auth';
  }

  return 'http';
}

function createFailure(code, message) {
  return {
    ok: false,
    code,
    lines: [message]
  };
}

async function postJsonRpc(config, method, params, id, fetchImpl) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.timeoutMs);

  try {
    const response = await fetchImpl(config.endpoint, {
      method: 'POST',
      headers: createHeaders(config),
      body: JSON.stringify(createJsonRpcRequest(id, method, params)),
      signal: controller.signal
    });

    if (!response.ok) {
      return createFailure(
        classifyHttpStatus(response.status),
        `M004 video smoke failed for configured Kodi endpoint: HTTP ${response.status} ${response.statusText || 'Error'} while calling ${method}.`
      );
    }

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      return createFailure(
        'malformed-response',
        `M004 video smoke failed for configured Kodi endpoint: Kodi returned an invalid JSON response while calling ${method}.`
      );
    }

    if (!envelope || typeof envelope !== 'object' || envelope.jsonrpc !== '2.0') {
      return createFailure(
        'malformed-response',
        `M004 video smoke failed for configured Kodi endpoint: Kodi returned a malformed JSON-RPC envelope while calling ${method}.`
      );
    }

    if ('error' in envelope) {
      const jsonRpcError = envelope.error;
      const code =
        jsonRpcError && typeof jsonRpcError === 'object' && 'code' in jsonRpcError
          ? jsonRpcError.code
          : 'unknown';

      return createFailure(
        'json-rpc-error',
        `M004 video smoke failed for configured Kodi endpoint: JSON-RPC ${code} while calling ${method}.`
      );
    }

    if (!('result' in envelope)) {
      return createFailure(
        'malformed-response',
        `M004 video smoke failed for configured Kodi endpoint: Kodi JSON-RPC envelope did not include a result while calling ${method}.`
      );
    }

    return { ok: true, result: envelope.result };
  } catch (error) {
    if (
      timedOut ||
      (error instanceof DOMException && error.name === 'AbortError' && controller.signal.aborted)
    ) {
      return createFailure(
        'timeout',
        `M004 video smoke failed for configured Kodi endpoint: ${method} timed out after ${config.timeoutMs}ms.`
      );
    }

    return createFailure(
      'network',
      `M004 video smoke failed for configured Kodi endpoint: Could not reach Kodi while calling ${method}.`
    );
  } finally {
    clearTimeout(timeout);
  }
}

function formatEndpointDescription(description) {
  return `${description.protocol}//${description.host}:${description.port}${description.path} (credentials configured: ${description.hasCredentials ? 'yes' : 'no'}, timeout ${description.timeoutMs}ms).`;
}

function countResultItems(result, key) {
  const items = result?.[key];
  if (!Array.isArray(items)) {
    return undefined;
  }

  return items.length;
}

function totalResultItems(result) {
  const total = result?.limits?.total;
  return Number.isInteger(total) ? total : undefined;
}

function validateProbeResult(method, result, resultKey) {
  const count = countResultItems(result, resultKey);
  if (count === undefined) {
    return createFailure(
      'malformed-response',
      `M004 video smoke failed: ${method} returned an unexpected result shape.`
    );
  }

  return { ok: true, count, total: totalResultItems(result) };
}

function formatProbeLine(method, validation) {
  const total = validation.total === undefined ? 'unknown' : validation.total;
  return `${method}: ok (${validation.count} returned, total ${total}).`;
}

function createRequestId() {
  let id = 1;
  return {
    next() {
      return id++;
    }
  };
}

function firstFinitePositiveSafeInteger(items, propertyName) {
  if (!Array.isArray(items)) {
    return undefined;
  }

  for (const item of items) {
    const candidate = item?.[propertyName];
    if (Number.isSafeInteger(candidate) && candidate > 0) {
      return candidate;
    }
  }

  return undefined;
}

async function runProbe(config, probe, requestId, fetchImpl) {
  const result = await postJsonRpc(config, probe.method, probe.params, requestId.next(), fetchImpl);
  if (!result.ok) {
    return result;
  }

  const validation = validateProbeResult(probe.method, result.result, probe.resultKey);
  if (!validation.ok) {
    return validation;
  }

  return { ok: true, result: result.result, lines: [formatProbeLine(probe.method, validation)] };
}

export async function runM004VideoSmoke(config, { fetchImpl = fetch } = {}) {
  const requestId = createRequestId();
  const ping = await postJsonRpc(config, 'JSONRPC.Ping', undefined, requestId.next(), fetchImpl);
  if (!ping.ok) {
    return ping;
  }

  const lines = [
    'M004 video smoke succeeded for configured Kodi endpoint.',
    config.endpointDescription
      ? `Endpoint: ${formatEndpointDescription(config.endpointDescription)}`
      : undefined,
    `JSONRPC.Ping: ok (${String(ping.result)}).`
  ].filter(Boolean);

  const [movieResult, tvShowResult] = await Promise.all([
    runProbe(config, MOVIE_PROBE, requestId, fetchImpl),
    runProbe(config, TV_SHOW_PROBE, requestId, fetchImpl)
  ]);
  if (!movieResult.ok) {
    return movieResult;
  }
  lines.push(...movieResult.lines);

  if (!tvShowResult.ok) {
    return tvShowResult;
  }
  lines.push(...tvShowResult.lines);

  const tvshowid = firstFinitePositiveSafeInteger(tvShowResult.result?.tvshows, 'tvshowid');
  if (tvshowid === undefined) {
    lines.push('VideoLibrary.GetSeasons: skipped (no finite TV show ID returned).');
  } else {
    const seasonResult = await runProbe(
      config,
      { ...SEASON_PROBE, params: { tvshowid, ...SEASON_PROBE.params } },
      requestId,
      fetchImpl
    );
    if (!seasonResult.ok) {
      return seasonResult;
    }
    lines.push(...seasonResult.lines);
  }

  const remainingProbeResults = await Promise.all(
    REMAINING_VIDEO_PROBES.map((probe) => runProbe(config, probe, requestId, fetchImpl))
  );

  for (let index = 0; index < remainingProbeResults.length; index += 1) {
    const result = remainingProbeResults[index];
    if (!result.ok) {
      return result;
    }

    lines.push(...result.lines);
    const probe = REMAINING_VIDEO_PROBES[index];
    if (probe.successLine) {
      lines.push(probe.successLine);
    }
  }

  lines.push(
    'Write probes: unsupported in S07; no play, queue, watched/resume, stream preparation, artwork refresh, or library mutation methods were called.'
  );

  return {
    ok: true,
    lines
  };
}

export async function runM004VideoSmokeCli(sourceEnv = env, options = {}) {
  const parsed = parseM004VideoSmokeEnv(sourceEnv);

  if (!parsed.ok || parsed.skipped) {
    return parsed;
  }

  return runM004VideoSmoke(parsed.config, options);
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = await runM004VideoSmokeCli();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
