#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import { argv, env, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_PLAYER_LOOP_SMOKE_PORT = 8080;
export const DEFAULT_PLAYER_LOOP_SMOKE_PATH = '/jsonrpc';
export const DEFAULT_PLAYER_LOOP_SMOKE_TIMEOUT_MS = 5000;

const PLAYER_PROPERTIES = ['speed', 'time', 'totaltime', 'percentage', 'repeat', 'shuffled'];
const PLAYER_ITEM_PROPERTIES = ['title', 'type', 'id'];

const SKIP_LINES = [
  'Kodi player-loop smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe player diagnostics.',
  'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS, KODI_SMOKE_LOCAL_PATH, KODI_SMOKE_ENABLE_WRITES.'
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
    return DEFAULT_PLAYER_LOOP_SMOKE_PATH;
  }

  const trimmed = path.trim();
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function createEndpointDescription(url, timeoutMs, hasCredentials) {
  return {
    protocol: url.protocol,
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : DEFAULT_PLAYER_LOOP_SMOKE_PORT)),
    path: `${url.pathname || DEFAULT_PLAYER_LOOP_SMOKE_PATH}${url.search}`,
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
    url.pathname = DEFAULT_PLAYER_LOOP_SMOKE_PATH;
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
    parsePositiveInteger(sourceEnv.KODI_PORT, 'KODI_PORT') ?? DEFAULT_PLAYER_LOOP_SMOKE_PORT;
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

export function parsePlayerLoopSmokeEnv(sourceEnv = env) {
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
      DEFAULT_PLAYER_LOOP_SMOKE_TIMEOUT_MS;
    const username = hasValue(sourceEnv.KODI_USERNAME) ? sourceEnv.KODI_USERNAME.trim() : undefined;
    const password = hasValue(sourceEnv.KODI_PASSWORD) ? sourceEnv.KODI_PASSWORD : undefined;
    const hasCredentials = Boolean(username && password);
    const endpointDetails = hasUrl
      ? parseUrlEndpoint(sourceEnv.KODI_HTTP_URL, timeoutMs, hasCredentials)
      : buildSplitEndpoint(sourceEnv, timeoutMs, hasCredentials);
    const enableWrites = parseBoolean(
      sourceEnv.KODI_SMOKE_ENABLE_WRITES,
      'KODI_SMOKE_ENABLE_WRITES'
    );
    const scrobbleSongId = parsePositiveInteger(
      sourceEnv.KODI_SMOKE_SCROBBLE_SONG_ID,
      'KODI_SMOKE_SCROBBLE_SONG_ID'
    );

    return {
      ok: true,
      skipped: false,
      config: {
        ...endpointDetails,
        timeoutMs,
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
        ...(hasValue(sourceEnv.KODI_SMOKE_LOCAL_PATH)
          ? { localPath: sourceEnv.KODI_SMOKE_LOCAL_PATH.trim() }
          : {}),
        ...(scrobbleSongId ? { scrobbleSongId } : {}),
        enableWrites
      }
    };
  } catch (error) {
    return {
      ok: false,
      code: 'invalid-env',
      lines: [`Kodi player-loop smoke configuration error: ${safeErrorMessage(error)}`]
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
        `Kodi player-loop smoke failed for ${config.endpoint}: HTTP ${response.status} ${response.statusText || 'Error'} while calling ${method}.`
      );
    }

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      return createFailure(
        'malformed-response',
        `Kodi player-loop smoke failed for ${config.endpoint}: Kodi returned an invalid JSON response while calling ${method}.`
      );
    }

    if (!envelope || typeof envelope !== 'object' || envelope.jsonrpc !== '2.0') {
      return createFailure(
        'malformed-response',
        `Kodi player-loop smoke failed for ${config.endpoint}: Kodi returned a malformed JSON-RPC envelope while calling ${method}.`
      );
    }

    if ('error' in envelope) {
      const jsonRpcError = envelope.error;
      const code =
        jsonRpcError && typeof jsonRpcError === 'object' && 'code' in jsonRpcError
          ? jsonRpcError.code
          : 'unknown';
      const message =
        jsonRpcError && typeof jsonRpcError === 'object' && typeof jsonRpcError.message === 'string'
          ? jsonRpcError.message
          : 'Kodi JSON-RPC error';

      return createFailure(
        'json-rpc-error',
        `Kodi player-loop smoke failed for ${config.endpoint}: JSON-RPC ${code} ${message} while calling ${method}.`
      );
    }

    if (!('result' in envelope)) {
      return createFailure(
        'malformed-response',
        `Kodi player-loop smoke failed for ${config.endpoint}: Kodi JSON-RPC envelope did not include a result while calling ${method}.`
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
        `Kodi player-loop smoke failed for ${config.endpoint}: ${method} timed out after ${config.timeoutMs}ms.`
      );
    }

    return createFailure(
      'network',
      `Kodi player-loop smoke failed for ${config.endpoint}: Could not reach Kodi while calling ${method}.`
    );
  } finally {
    clearTimeout(timeout);
  }
}

function formatEndpointDescription(description) {
  return `${description.protocol}//${description.host}:${description.port}${description.path} (credentials configured: ${description.hasCredentials ? 'yes' : 'no'}).`;
}

function formatActivePlayers(players) {
  if (!Array.isArray(players) || players.length === 0) {
    return 'Active players: none.';
  }

  const formatted = players.map((player) => {
    const type = typeof player?.type === 'string' && player.type ? player.type : 'unknown';
    const id = Number.isInteger(player?.playerid) ? player.playerid : 'unknown';
    return `${type}#${id}`;
  });

  return `Active players: ${formatted.join(', ')}.`;
}

function formatPlayerProperties(playerid, properties) {
  const speed = typeof properties?.speed === 'number' ? properties.speed : 'unknown';
  const percentage =
    typeof properties?.percentage === 'number' ? `${properties.percentage}%` : 'unknown';
  const repeat = typeof properties?.repeat === 'string' ? properties.repeat : 'unknown';
  const shuffled =
    typeof properties?.shuffled === 'boolean' ? String(properties.shuffled) : 'unknown';

  return `Player ${playerid}: speed ${speed}, ${percentage}, repeat ${repeat}, shuffled ${shuffled}.`;
}

function formatPlayerItem(playerid, itemResult) {
  const item = itemResult?.item;
  const type = typeof item?.type === 'string' && item.type ? item.type : 'unknown';
  const id = Number.isInteger(item?.id) ? item.id : 'unknown';
  const title = typeof item?.title === 'string' && item.title.trim() ? ` ${item.title.trim()}` : '';

  return `Player ${playerid} item: ${type}#${id}${title}.`;
}

function firstSafePlayerId(players) {
  if (!Array.isArray(players)) {
    return undefined;
  }

  return players.find((player) => Number.isInteger(player?.playerid))?.playerid;
}

async function appendPlayerDiagnostics(config, fetchImpl, lines, requestId) {
  const activePlayers = await postJsonRpc(
    config,
    'Player.GetActivePlayers',
    undefined,
    requestId.next(),
    fetchImpl
  );
  if (!activePlayers.ok) {
    return activePlayers;
  }

  lines.push(formatActivePlayers(activePlayers.result));
  const playerid = firstSafePlayerId(activePlayers.result);
  if (playerid === undefined) {
    return { ok: true };
  }

  const properties = await postJsonRpc(
    config,
    'Player.GetProperties',
    { playerid, properties: PLAYER_PROPERTIES },
    requestId.next(),
    fetchImpl
  );
  if (!properties.ok) {
    return properties;
  }
  lines.push(formatPlayerProperties(playerid, properties.result));

  const item = await postJsonRpc(
    config,
    'Player.GetItem',
    { playerid, properties: PLAYER_ITEM_PROPERTIES },
    requestId.next(),
    fetchImpl
  );
  if (!item.ok) {
    return item;
  }
  lines.push(formatPlayerItem(playerid, item.result));

  return { ok: true };
}

async function appendLocalPrepDiagnostics(config, fetchImpl, lines, requestId) {
  if (!config.localPath) {
    lines.push('Local prep: skipped (set KODI_SMOKE_LOCAL_PATH to opt in).');
    return { ok: true };
  }

  const prepared = await postJsonRpc(
    config,
    'Files.PrepareDownload',
    { path: config.localPath },
    requestId.next(),
    fetchImpl
  );
  if (!prepared.ok) {
    return prepared;
  }

  lines.push('Local prep: succeeded for configured path.');
  return { ok: true };
}

async function appendScrobbleDiagnostics(config, fetchImpl, lines, requestId) {
  if (!config.enableWrites || !config.scrobbleSongId) {
    lines.push(
      'Scrobble write: skipped (set KODI_SMOKE_ENABLE_WRITES=true plus KODI_SMOKE_SCROBBLE_SONG_ID to opt in).'
    );
    return { ok: true };
  }

  const scrobble = await postJsonRpc(
    config,
    'AudioLibrary.SetSongDetails',
    {
      songid: config.scrobbleSongId,
      userrating: 0
    },
    requestId.next(),
    fetchImpl
  );
  if (!scrobble.ok) {
    return scrobble;
  }

  lines.push('Scrobble write: succeeded for configured song id.');
  return { ok: true };
}

function createRequestId() {
  let id = 1;
  return {
    next() {
      return id++;
    }
  };
}

export async function runPlayerLoopSmoke(config, { fetchImpl = fetch } = {}) {
  const requestId = createRequestId();
  const ping = await postJsonRpc(config, 'JSONRPC.Ping', undefined, requestId.next(), fetchImpl);
  if (!ping.ok) {
    return ping;
  }

  const lines = [
    `Kodi player-loop smoke succeeded for ${config.endpoint}.`,
    `Endpoint: ${formatEndpointDescription(config.endpointDescription)}`,
    `Ping result: ${String(ping.result)}.`
  ];

  const playerDiagnostics = await appendPlayerDiagnostics(config, fetchImpl, lines, requestId);
  if (!playerDiagnostics.ok) {
    return playerDiagnostics;
  }

  const localPrepDiagnostics = await appendLocalPrepDiagnostics(
    config,
    fetchImpl,
    lines,
    requestId
  );
  if (!localPrepDiagnostics.ok) {
    return localPrepDiagnostics;
  }

  const scrobbleDiagnostics = await appendScrobbleDiagnostics(config, fetchImpl, lines, requestId);
  if (!scrobbleDiagnostics.ok) {
    return scrobbleDiagnostics;
  }

  return {
    ok: true,
    lines
  };
}

export async function runPlayerLoopSmokeCli(sourceEnv = env) {
  const parsed = parsePlayerLoopSmokeEnv(sourceEnv);

  if (!parsed.ok || parsed.skipped) {
    return parsed;
  }

  return runPlayerLoopSmoke(parsed.config);
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = await runPlayerLoopSmokeCli();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
