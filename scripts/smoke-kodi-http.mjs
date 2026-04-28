#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import { argv, env, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_KODI_SMOKE_PORT = 8080;
export const DEFAULT_KODI_SMOKE_PATH = '/jsonrpc';
export const DEFAULT_KODI_SMOKE_TIMEOUT_MS = 5000;
export const APPLICATION_PROPERTIES = ['name', 'version', 'volume', 'muted'];

const SKIP_LINES = [
  'Kodi HTTP smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe a live Kodi endpoint.',
  'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
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
    return DEFAULT_KODI_SMOKE_PATH;
  }

  const trimmed = path.trim();
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function parseUrlEndpoint(rawUrl) {
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
    url.pathname = DEFAULT_KODI_SMOKE_PATH;
  }

  return url.toString();
}

function buildSplitEndpoint(sourceEnv) {
  const host = sourceEnv.KODI_HOST?.trim();
  if (!host) {
    throw new Error('KODI_HOST is required when KODI_HTTP_URL is not set.');
  }

  const port = parsePositiveInteger(sourceEnv.KODI_PORT, 'KODI_PORT') ?? DEFAULT_KODI_SMOKE_PORT;
  if (port > 65535) {
    throw new Error('KODI_PORT must be between 1 and 65535.');
  }

  const useTls = parseUseTls(sourceEnv.KODI_USE_TLS);
  const endpoint = new URL(`${useTls ? 'https' : 'http'}://${host}`);
  endpoint.port = String(port);
  endpoint.pathname = normalizePath(sourceEnv.KODI_PATH);

  return endpoint.toString();
}

export function parseKodiSmokeEnv(sourceEnv = env) {
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
      DEFAULT_KODI_SMOKE_TIMEOUT_MS;
    const endpoint = hasUrl
      ? parseUrlEndpoint(sourceEnv.KODI_HTTP_URL)
      : buildSplitEndpoint(sourceEnv);

    return {
      ok: true,
      skipped: false,
      config: {
        endpoint,
        timeoutMs,
        username: hasValue(sourceEnv.KODI_USERNAME) ? sourceEnv.KODI_USERNAME.trim() : undefined,
        password: hasValue(sourceEnv.KODI_PASSWORD) ? sourceEnv.KODI_PASSWORD : undefined
      }
    };
  } catch (error) {
    return {
      ok: false,
      code: 'invalid-env',
      lines: [`Kodi HTTP smoke configuration error: ${safeErrorMessage(error)}`]
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

function formatVersion(version) {
  if (typeof version === 'string' && version.trim()) {
    return version.trim();
  }

  if (version && typeof version === 'object') {
    const parts = [version.major, version.minor, version.patch].filter(
      (part) => part !== undefined && part !== null && part !== ''
    );

    if (parts.length > 0) {
      return parts.join('.');
    }
  }

  return 'version unknown';
}

function formatApplication(application) {
  const name =
    typeof application?.name === 'string' && application.name.trim() ? application.name : 'Kodi';
  const version = formatVersion(application?.version);
  const volume = typeof application?.volume === 'number' ? application.volume : 'unknown';
  const muted = typeof application?.muted === 'boolean' ? String(application.muted) : 'unknown';

  return `Application: ${name} ${version}, volume ${volume}, muted ${muted}.`;
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
        `Kodi HTTP smoke failed for ${config.endpoint}: HTTP ${response.status} ${response.statusText || 'Error'}.`
      );
    }

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      return createFailure(
        'malformed-response',
        `Kodi HTTP smoke failed for ${config.endpoint}: Kodi returned an invalid JSON response.`
      );
    }

    if (!envelope || typeof envelope !== 'object' || envelope.jsonrpc !== '2.0') {
      return createFailure(
        'malformed-response',
        `Kodi HTTP smoke failed for ${config.endpoint}: Kodi returned a malformed JSON-RPC envelope.`
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
        `Kodi HTTP smoke failed for ${config.endpoint}: JSON-RPC ${code} ${message}.`
      );
    }

    if (!('result' in envelope)) {
      return createFailure(
        'malformed-response',
        `Kodi HTTP smoke failed for ${config.endpoint}: Kodi JSON-RPC envelope did not include a result.`
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
        `Kodi HTTP smoke failed for ${config.endpoint}: request timed out after ${config.timeoutMs}ms.`
      );
    }

    return createFailure(
      'network',
      `Kodi HTTP smoke failed for ${config.endpoint}: Could not reach Kodi.`
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function runKodiHttpSmoke(config, { fetchImpl = fetch } = {}) {
  const ping = await postJsonRpc(config, 'JSONRPC.Ping', undefined, 1, fetchImpl);
  if (!ping.ok) {
    return ping;
  }

  const application = await postJsonRpc(
    config,
    'Application.GetProperties',
    { properties: APPLICATION_PROPERTIES },
    2,
    fetchImpl
  );
  if (!application.ok) {
    return application;
  }

  return {
    ok: true,
    lines: [
      `Kodi HTTP smoke succeeded for ${config.endpoint}.`,
      `Ping result: ${String(ping.result)}.`,
      formatApplication(application.result)
    ]
  };
}

export async function runKodiSmokeCli(sourceEnv = env) {
  const parsed = parseKodiSmokeEnv(sourceEnv);

  if (!parsed.ok || parsed.skipped) {
    return parsed;
  }

  return runKodiHttpSmoke(parsed.config);
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = await runKodiSmokeCli();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
