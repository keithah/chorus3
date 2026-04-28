export const DEFAULT_KODI_HTTP_PORT = 8080;
export const DEFAULT_KODI_HTTP_PATH = '/jsonrpc';
export const DEFAULT_KODI_WEBSOCKET_PORT = 9090;
export const DEFAULT_KODI_WEBSOCKET_PATH = '/jsonrpc';
export const DEFAULT_KODI_TIMEOUT_MS = 5000;

export interface KodiHttpHost {
  host: string;
  port?: number;
  useTls?: boolean;
  username?: string;
  password?: string;
  path?: string;
  timeoutMs?: number;
}

export interface NormalizedKodiHttpHost {
  host: string;
  port: number;
  useTls: boolean;
  username?: string;
  password?: string;
  path: string;
  timeoutMs: number;
}

export interface KodiEndpointDescription {
  protocol: 'http:' | 'https:';
  host: string;
  port: number;
  path: string;
  timeoutMs: number;
  hasCredentials: boolean;
}

export interface KodiWebSocketHost {
  host: string;
  port?: number;
  useTls?: boolean;
  username?: string;
  password?: string;
  path?: string;
}

export interface NormalizedKodiWebSocketHost {
  host: string;
  port: number;
  useTls: boolean;
  path: string;
}

export interface KodiWebSocketEndpointDescription {
  protocol: 'ws:' | 'wss:';
  host: string;
  port: number;
  path: string;
  hasCredentials: false;
}

function parseHostUrl(host: string): URL | null {
  try {
    return new URL(host);
  } catch {
    return null;
  }
}

function normalizeHttpPath(path: string | undefined): string {
  const rawPath = path?.trim() || DEFAULT_KODI_HTTP_PATH;
  const [pathname = '', query] = rawPath.split('?', 2);
  const normalizedPathname = `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  const safePathname = normalizedPathname === '/' ? DEFAULT_KODI_HTTP_PATH : normalizedPathname;

  return query === undefined ? safePathname : `${safePathname}?${query}`;
}

function normalizeWebSocketPath(path: string | undefined): string {
  const rawPath = path?.trim() || DEFAULT_KODI_WEBSOCKET_PATH;

  if (rawPath.includes('?')) {
    throw new Error('Kodi WebSocket path must not include a query string.');
  }

  const normalizedPathname = `/${rawPath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  return normalizedPathname === '/' ? DEFAULT_KODI_WEBSOCKET_PATH : normalizedPathname;
}

function normalizeHttpPort(port: number | string | undefined, useTls: boolean): number {
  if (port === undefined || port === '') {
    return DEFAULT_KODI_HTTP_PORT;
  }

  const normalizedPort = typeof port === 'number' ? port : Number(port);

  if (!Number.isInteger(normalizedPort) || normalizedPort < 1 || normalizedPort > 65535) {
    throw new Error('Kodi HTTP port must be an integer between 1 and 65535.');
  }

  return normalizedPort || (useTls ? 443 : DEFAULT_KODI_HTTP_PORT);
}

function normalizeWebSocketPort(port: number | string | undefined): number {
  if (port === undefined || port === '') {
    return DEFAULT_KODI_WEBSOCKET_PORT;
  }

  const normalizedPort = typeof port === 'number' ? port : Number(port);

  if (!Number.isInteger(normalizedPort) || normalizedPort < 1 || normalizedPort > 65535) {
    throw new Error('Kodi WebSocket port must be an integer between 1 and 65535.');
  }

  return normalizedPort;
}

function appendOptionalCredentials(
  normalized: Omit<NormalizedKodiHttpHost, 'username' | 'password'>,
  username: string | undefined,
  password: string | undefined
): NormalizedKodiHttpHost {
  return {
    ...normalized,
    ...(username ? { username } : {}),
    ...(password ? { password } : {})
  };
}

export function normalizeKodiHttpHost(hostConfig: KodiHttpHost): NormalizedKodiHttpHost {
  const trimmedHost = hostConfig.host.trim();

  if (!trimmedHost) {
    throw new Error('Kodi HTTP host is required.');
  }

  const parsedUrl = parseHostUrl(trimmedHost);
  const hasUrlProtocol = parsedUrl?.protocol === 'http:' || parsedUrl?.protocol === 'https:';
  const useTls = hostConfig.useTls ?? (hasUrlProtocol ? parsedUrl.protocol === 'https:' : false);
  const host = hasUrlProtocol ? parsedUrl.hostname : trimmedHost.replace(/^\/+|\/+$/g, '');

  if (!host) {
    throw new Error('Kodi HTTP host is required.');
  }

  const port = normalizeHttpPort(
    hostConfig.port ?? (hasUrlProtocol ? parsedUrl.port : undefined),
    useTls
  );
  const path = normalizeHttpPath(
    hostConfig.path ?? (hasUrlProtocol ? `${parsedUrl.pathname}${parsedUrl.search}` : undefined)
  );
  const timeoutMs = hostConfig.timeoutMs ?? DEFAULT_KODI_TIMEOUT_MS;

  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new Error('Kodi HTTP timeout must be greater than zero milliseconds.');
  }

  return appendOptionalCredentials(
    {
      host,
      port,
      useTls,
      path,
      timeoutMs
    },
    hostConfig.username?.trim() || (hasUrlProtocol ? parsedUrl.username : undefined),
    hostConfig.password || (hasUrlProtocol ? parsedUrl.password : undefined)
  );
}

export function normalizeKodiWebSocketHost(
  hostConfig: KodiWebSocketHost
): NormalizedKodiWebSocketHost {
  const trimmedHost = hostConfig.host.trim();

  if (!trimmedHost) {
    throw new Error('Kodi WebSocket host is required.');
  }

  if (hostConfig.username || hostConfig.password) {
    throw new Error('Kodi WebSocket credentials are not supported in endpoint URLs.');
  }

  const parsedUrl = parseHostUrl(trimmedHost);
  const hasUrlProtocol = parsedUrl?.protocol === 'ws:' || parsedUrl?.protocol === 'wss:';

  if (parsedUrl && !hasUrlProtocol) {
    throw new Error('Kodi WebSocket host URL must use ws: or wss:.');
  }

  if (hasUrlProtocol && (parsedUrl.username || parsedUrl.password)) {
    throw new Error('Kodi WebSocket URL must not include credentials.');
  }

  const useTls = hostConfig.useTls ?? (hasUrlProtocol ? parsedUrl.protocol === 'wss:' : false);
  const host = hasUrlProtocol ? parsedUrl.hostname : trimmedHost.replace(/^\/+|\/+$/g, '');

  if (!host) {
    throw new Error('Kodi WebSocket host is required.');
  }

  return {
    host,
    port: normalizeWebSocketPort(hostConfig.port ?? (hasUrlProtocol ? parsedUrl.port : undefined)),
    useTls,
    path: normalizeWebSocketPath(
      hostConfig.path ?? (hasUrlProtocol ? parsedUrl.pathname : undefined)
    )
  };
}

export function buildKodiJsonRpcHttpUrl(hostConfig: KodiHttpHost): URL {
  const host = normalizeKodiHttpHost(hostConfig);
  const url = new URL(`${host.useTls ? 'https' : 'http'}://${host.host}`);

  url.port = String(host.port);
  url.pathname = host.path.split('?', 1)[0] || DEFAULT_KODI_HTTP_PATH;

  const query = host.path.includes('?') ? host.path.slice(host.path.indexOf('?') + 1) : '';
  url.search = query;

  return url;
}

export function buildKodiJsonRpcWebSocketUrl(hostConfig: KodiWebSocketHost): URL {
  const host = normalizeKodiWebSocketHost(hostConfig);
  const url = new URL(`${host.useTls ? 'wss' : 'ws'}://${host.host}`);

  url.port = String(host.port);
  url.pathname = host.path || DEFAULT_KODI_WEBSOCKET_PATH;

  return url;
}

function encodeBase64(value: string): string {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new TextEncoder().encode(value);
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const combined = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    output += alphabet[(combined >> 18) & 63];
    output += alphabet[(combined >> 12) & 63];
    output += second === undefined ? '=' : alphabet[(combined >> 6) & 63];
    output += third === undefined ? '=' : alphabet[combined & 63];
  }

  return output;
}

export function buildBasicAuthHeader(username: string, password: string): string {
  return `Basic ${encodeBase64(`${username}:${password}`)}`;
}

export function buildKodiRequestHeaders(hostConfig: KodiHttpHost): Headers {
  const host = normalizeKodiHttpHost(hostConfig);
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  if (host.username && host.password) {
    headers.set('Authorization', buildBasicAuthHeader(host.username, host.password));
  }

  return headers;
}

export function describeKodiEndpoint(hostConfig: KodiHttpHost): KodiEndpointDescription {
  const host = normalizeKodiHttpHost(hostConfig);

  return {
    protocol: host.useTls ? 'https:' : 'http:',
    host: host.host,
    port: host.port,
    path: host.path,
    timeoutMs: host.timeoutMs,
    hasCredentials: Boolean(host.username && host.password)
  };
}

export function describeKodiWebSocketEndpoint(
  hostConfig: KodiWebSocketHost
): KodiWebSocketEndpointDescription {
  const host = normalizeKodiWebSocketHost(hostConfig);

  return {
    protocol: host.useTls ? 'wss:' : 'ws:',
    host: host.host,
    port: host.port,
    path: host.path,
    hasCredentials: false
  };
}
