#!/usr/bin/env node
import { argv, env, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_KODI_WS_SMOKE_PORT = 9090;
export const DEFAULT_KODI_WS_SMOKE_PATH = '/jsonrpc';
export const DEFAULT_KODI_WS_SMOKE_TIMEOUT_MS = 5000;

const SKIP_LINES = [
  'Kodi WebSocket smoke skipped: set KODI_WS_URL or KODI_HOST/KODI_PORT to probe a live Kodi WebSocket endpoint.',
  'Optional variables: KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
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

function parseUseTls(value) {
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

  throw new Error('KODI_USE_TLS must be one of true/false, yes/no, on/off, or 1/0.');
}

function normalizePath(path) {
  if (!hasValue(path)) {
    return DEFAULT_KODI_WS_SMOKE_PATH;
  }

  const trimmed = path.trim();
  if (trimmed.includes('?')) {
    throw new Error('KODI_PATH must not include a query string for WebSocket smoke probes.');
  }

  const normalized = `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  return normalized === '/' ? DEFAULT_KODI_WS_SMOKE_PATH : normalized;
}

function describeUrl(url) {
  return {
    protocol: url.protocol === 'wss:' ? 'wss' : 'ws',
    host: url.hostname,
    port: Number(url.port || DEFAULT_KODI_WS_SMOKE_PORT),
    path: url.pathname || DEFAULT_KODI_WS_SMOKE_PATH
  };
}

function formatEndpoint(description) {
  return `${description.protocol}://${description.host}:${description.port}${description.path}`;
}

function parseUrlEndpoint(rawUrl) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('KODI_WS_URL must be a valid ws:// or wss:// URL.');
  }

  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('KODI_WS_URL must use ws:// or wss://.');
  }

  if (!url.hostname) {
    throw new Error('KODI_WS_URL must include a hostname.');
  }

  if (url.username || url.password) {
    throw new Error('KODI_WS_URL must not include credentials.');
  }

  if (url.search) {
    throw new Error('KODI_WS_URL must not include a query string.');
  }

  if (!url.pathname || url.pathname === '/') {
    url.pathname = DEFAULT_KODI_WS_SMOKE_PATH;
  }

  if (!url.port) {
    url.port = String(DEFAULT_KODI_WS_SMOKE_PORT);
  }

  const endpointDescription = describeUrl(url);
  return { endpoint: formatEndpoint(endpointDescription), endpointDescription };
}

function buildSplitEndpoint(sourceEnv) {
  const host = sourceEnv.KODI_HOST?.trim();
  if (!host) {
    throw new Error('KODI_HOST is required when KODI_WS_URL is not set.');
  }

  const port = parsePositiveInteger(sourceEnv.KODI_PORT, 'KODI_PORT') ?? DEFAULT_KODI_WS_SMOKE_PORT;
  if (port > 65535) {
    throw new Error('KODI_PORT must be between 1 and 65535.');
  }

  const useTls = parseUseTls(sourceEnv.KODI_USE_TLS);
  const path = normalizePath(sourceEnv.KODI_PATH);
  const endpointDescription = {
    protocol: useTls ? 'wss' : 'ws',
    host,
    port,
    path
  };

  return { endpoint: formatEndpoint(endpointDescription), endpointDescription };
}

export function parseKodiWebSocketSmokeEnv(sourceEnv = env) {
  const hasUrl = sourceEnv.KODI_WS_URL !== undefined && sourceEnv.KODI_WS_URL !== '';
  const hasHost = sourceEnv.KODI_HOST !== undefined && sourceEnv.KODI_HOST !== '';

  if (!hasUrl && !hasHost) {
    return { ok: true, skipped: true, lines: SKIP_LINES };
  }

  try {
    if (hasUrl && hasHost) {
      throw new Error('Use either KODI_WS_URL or KODI_HOST/KODI_PORT, not both.');
    }

    const timeoutMs =
      parsePositiveInteger(sourceEnv.KODI_TIMEOUT_MS, 'KODI_TIMEOUT_MS') ??
      DEFAULT_KODI_WS_SMOKE_TIMEOUT_MS;
    const endpoint = hasUrl
      ? parseUrlEndpoint(sourceEnv.KODI_WS_URL)
      : buildSplitEndpoint(sourceEnv);

    return {
      ok: true,
      skipped: false,
      config: {
        ...endpoint,
        timeoutMs
      }
    };
  } catch (error) {
    return {
      ok: false,
      code: 'invalid-env',
      lines: [`Kodi WebSocket smoke configuration error: ${safeErrorMessage(error)}`]
    };
  }
}

function safeErrorMessage(error) {
  return error instanceof Error && error.message ? error.message : 'Unknown failure.';
}

function createFailure(config, code, message) {
  return {
    ok: false,
    code,
    lines: [
      `Kodi WebSocket smoke failed for ${formatEndpoint(config.endpointDescription)}: ${message}`
    ]
  };
}

function getDefaultWebSocket() {
  return typeof WebSocket === 'undefined' ? undefined : WebSocket;
}

function parsePingEnvelope(data) {
  let envelope;

  try {
    envelope = JSON.parse(String(data));
  } catch {
    return { ok: false, code: 'malformed-response', message: 'Kodi returned invalid JSON.' };
  }

  if (!envelope || typeof envelope !== 'object' || envelope.jsonrpc !== '2.0') {
    return {
      ok: false,
      code: 'malformed-response',
      message: 'Kodi returned a malformed JSON-RPC envelope.'
    };
  }

  if (envelope.id !== 1) {
    return {
      ok: false,
      code: 'malformed-response',
      message: 'Kodi returned an unexpected JSON-RPC response id.'
    };
  }

  if ('error' in envelope) {
    const rpcError = envelope.error;
    const code =
      rpcError && typeof rpcError === 'object' && 'code' in rpcError ? rpcError.code : 'unknown';
    const message =
      rpcError && typeof rpcError === 'object' && typeof rpcError.message === 'string'
        ? rpcError.message
        : 'Kodi JSON-RPC error';

    return { ok: false, code: 'json-rpc-error', message: `JSON-RPC ${code} ${message}.` };
  }

  if (!('result' in envelope)) {
    return {
      ok: false,
      code: 'malformed-response',
      message: 'Kodi JSON-RPC envelope did not include a result.'
    };
  }

  return { ok: true, result: envelope.result };
}

export async function runKodiWebSocketSmoke(config, options = {}) {
  const WebSocketImpl = Object.prototype.hasOwnProperty.call(options, 'WebSocketImpl')
    ? options.WebSocketImpl
    : getDefaultWebSocket();

  if (!WebSocketImpl) {
    return {
      ok: true,
      skipped: true,
      lines: ['Kodi WebSocket smoke skipped: native WebSocket is unavailable in this Node runtime.']
    };
  }

  return new Promise((resolve) => {
    let socket;
    let settled = false;
    let opened = false;

    function settle(result, closeCode, closeReason) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (socket && closeCode !== undefined) {
        try {
          socket.close(closeCode, closeReason);
        } catch {
          // Closing is best-effort after the smoke result is already determined.
        }
      }

      resolve(result);
    }

    const timeout = setTimeout(() => {
      settle(
        createFailure(config, 'timeout', `ping timed out after ${config.timeoutMs}ms.`),
        1000,
        'smoke-timeout'
      );
    }, config.timeoutMs);

    try {
      socket = new WebSocketImpl(config.endpoint);
    } catch {
      settle(createFailure(config, 'network', 'Could not open Kodi WebSocket.'));
      return;
    }

    socket.addEventListener('open', () => {
      opened = true;
      socket.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'JSONRPC.Ping' }));
    });

    socket.addEventListener('message', (event) => {
      const parsed = parsePingEnvelope(event.data);
      if (!parsed.ok) {
        settle(createFailure(config, parsed.code, parsed.message), 1000, 'smoke-failed');
        return;
      }

      settle(
        {
          ok: true,
          lines: [
            `Kodi WebSocket smoke succeeded for ${formatEndpoint(config.endpointDescription)}.`,
            `Ping result: ${String(parsed.result)}.`
          ]
        },
        1000,
        'smoke-complete'
      );
    });

    socket.addEventListener('error', () => {
      settle(
        createFailure(config, 'network', 'Could not reach Kodi WebSocket.'),
        1000,
        'smoke-error'
      );
    });

    socket.addEventListener('close', (event) => {
      settle(
        createFailure(
          config,
          'closed',
          `${opened ? 'Kodi WebSocket closed' : 'Kodi WebSocket closed before ping completed'} (code ${event.code}).`
        )
      );
    });
  });
}

export async function runKodiWebSocketSmokeCli(sourceEnv = env) {
  const parsed = parseKodiWebSocketSmokeEnv(sourceEnv);

  if (!parsed.ok || parsed.skipped) {
    return parsed;
  }

  return runKodiWebSocketSmoke(parsed.config);
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = await runKodiWebSocketSmokeCli();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
