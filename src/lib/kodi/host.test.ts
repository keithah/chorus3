import { describe, expect, it } from 'vitest';

import {
  DEFAULT_KODI_HTTP_PATH,
  DEFAULT_KODI_HTTP_PORT,
  DEFAULT_KODI_TIMEOUT_MS,
  DEFAULT_KODI_WEBSOCKET_PATH,
  DEFAULT_KODI_WEBSOCKET_PORT,
  buildBasicAuthHeader,
  buildKodiJsonRpcHttpUrl,
  buildKodiJsonRpcWebSocketUrl,
  buildKodiRequestHeaders,
  describeKodiEndpoint,
  describeKodiWebSocketEndpoint,
  normalizeKodiHttpHost,
  normalizeKodiWebSocketHost
} from './host';

describe('Kodi HTTP host primitives', () => {
  it('normalizes the default HTTP endpoint and timeout', () => {
    const host = normalizeKodiHttpHost({ host: ' living-room-kodi.local ' });

    expect(host).toEqual({
      host: 'living-room-kodi.local',
      port: DEFAULT_KODI_HTTP_PORT,
      useTls: false,
      path: DEFAULT_KODI_HTTP_PATH,
      timeoutMs: DEFAULT_KODI_TIMEOUT_MS
    });
    expect(buildKodiJsonRpcHttpUrl(host).toString()).toBe(
      'http://living-room-kodi.local:8080/jsonrpc'
    );
  });

  it('builds a TLS endpoint with an explicit port and no URL userinfo', () => {
    const host = normalizeKodiHttpHost({
      host: 'kodi.example.test',
      port: 9443,
      useTls: true,
      username: 'media-user',
      password: 'super-secret-password'
    });

    const url = buildKodiJsonRpcHttpUrl(host);

    expect(url.toString()).toBe('https://kodi.example.test:9443/jsonrpc');
    expect(url.username).toBe('');
    expect(url.password).toBe('');
  });

  it('uses the TLS default HTTP port when no explicit port is configured', () => {
    expect(buildKodiJsonRpcHttpUrl({ host: 'kodi.example.test', useTls: true }).toString()).toBe(
      'https://kodi.example.test/jsonrpc'
    );
  });

  it('splits a bare host:port HTTP host instead of treating the port as part of the hostname', () => {
    expect(normalizeKodiHttpHost({ host: 'kodi.local:18080' })).toMatchObject({
      host: 'kodi.local',
      port: 18080
    });
    expect(buildKodiJsonRpcHttpUrl({ host: 'kodi.local:18080' }).toString()).toBe(
      'http://kodi.local:18080/jsonrpc'
    );
  });

  it.each([
    ['jsonrpc', '/jsonrpc'],
    ['/jsonrpc', '/jsonrpc'],
    ['//jsonrpc', '/jsonrpc'],
    ['/kodi/jsonrpc/', '/kodi/jsonrpc'],
    ['api/jsonrpc?profile=kids', '/api/jsonrpc?profile=kids']
  ])('normalizes custom path %s', (path, expectedPath) => {
    const host = normalizeKodiHttpHost({ host: 'kodi.local', path });

    expect(buildKodiJsonRpcHttpUrl(host).toString()).toBe(`http://kodi.local:8080${expectedPath}`);
  });

  it('builds fresh JSON request headers without authorization by default', () => {
    const firstHeaders = buildKodiRequestHeaders({ host: 'kodi.local' });
    const secondHeaders = buildKodiRequestHeaders({ host: 'kodi.local' });

    expect(firstHeaders).toBeInstanceOf(Headers);
    expect(firstHeaders).not.toBe(secondHeaders);
    expect(firstHeaders.get('Content-Type')).toBe('application/json');
    expect(firstHeaders.get('Accept')).toBe('application/json');
    expect(firstHeaders.has('Authorization')).toBe(false);
  });

  it('adds Basic Auth only when both username and password are present', () => {
    const unauthenticated = buildKodiRequestHeaders({ host: 'kodi.local', username: 'media-user' });
    const authenticated = buildKodiRequestHeaders({
      host: 'kodi.local',
      username: 'media-user',
      password: "p@ss word:/?#[]@!$&'()*+,;="
    });

    expect(buildBasicAuthHeader('media-user', "p@ss word:/?#[]@!$&'()*+,;=")).toMatch(/^Basic /);
    expect(unauthenticated.has('Authorization')).toBe(false);
    expect(authenticated.get('Authorization')).toMatch(/^Basic /);
    expect(authenticated.get('Authorization')).not.toContain('p@ss word');
  });

  it('encodes non-Latin-1 Basic Auth credentials without throwing', () => {
    expect(() => buildBasicAuthHeader('media-user', 'pässwörd')).not.toThrow();
    expect(buildBasicAuthHeader('media-user', 'pässwörd')).toBe(
      'Basic bWVkaWEtdXNlcjpww6Rzc3fDtnJk'
    );
  });

  it('describes endpoints without credentials or authorization values', () => {
    const endpoint = describeKodiEndpoint({
      host: 'https://admin:super-secret-password@kodi.example.test/',
      port: 8443,
      path: '/jsonrpc',
      username: 'admin',
      password: 'super-secret-password',
      timeoutMs: 2500
    });

    expect(endpoint).toEqual({
      protocol: 'https:',
      host: 'kodi.example.test',
      port: 8443,
      path: '/jsonrpc',
      timeoutMs: 2500,
      hasCredentials: true
    });
    expect(JSON.stringify(endpoint)).not.toContain('super-secret-password');
    expect(JSON.stringify(endpoint)).not.toContain('Authorization');
    expect(buildKodiJsonRpcHttpUrl(normalizeKodiHttpHost(endpoint)).toString()).not.toContain('@');
  });

  it('rejects empty hostnames with deterministic non-secret messages', () => {
    expect(() => normalizeKodiHttpHost({ host: '   ', password: 'super-secret-password' })).toThrow(
      'Kodi HTTP host is required.'
    );

    try {
      normalizeKodiHttpHost({ host: '   ', password: 'super-secret-password' });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).not.toContain('super-secret-password');
    }
  });
});

describe('Kodi WebSocket host primitives', () => {
  it('normalizes the default WebSocket endpoint', () => {
    const host = normalizeKodiWebSocketHost({ host: ' living-room-kodi.local ' });

    expect(DEFAULT_KODI_WEBSOCKET_PORT).toBe(9090);
    expect(DEFAULT_KODI_WEBSOCKET_PATH).toBe('/jsonrpc');
    expect(host).toEqual({
      host: 'living-room-kodi.local',
      port: DEFAULT_KODI_WEBSOCKET_PORT,
      useTls: false,
      path: DEFAULT_KODI_WEBSOCKET_PATH
    });
    expect(buildKodiJsonRpcWebSocketUrl(host).toString()).toBe(
      'ws://living-room-kodi.local:9090/jsonrpc'
    );
  });

  it('builds TLS WebSocket endpoints with explicit ports and no URL userinfo', () => {
    const host = normalizeKodiWebSocketHost({
      host: 'kodi.example.test',
      port: 9443,
      useTls: true
    });

    const url = buildKodiJsonRpcWebSocketUrl(host);

    expect(url.toString()).toBe('wss://kodi.example.test:9443/jsonrpc');
    expect(url.username).toBe('');
    expect(url.password).toBe('');
  });

  it.each([
    ['jsonrpc', '/jsonrpc'],
    ['/jsonrpc', '/jsonrpc'],
    ['//jsonrpc', '/jsonrpc'],
    ['/kodi/jsonrpc/', '/kodi/jsonrpc']
  ])('normalizes WebSocket path %s', (path, expectedPath) => {
    const host = normalizeKodiWebSocketHost({ host: 'kodi.local', path });

    expect(buildKodiJsonRpcWebSocketUrl(host).toString()).toBe(
      `ws://kodi.local:9090${expectedPath}`
    );
  });

  it('accepts ws and wss URL input with path and port', () => {
    expect(normalizeKodiWebSocketHost({ host: 'ws://kodi.local:19090/events' })).toEqual({
      host: 'kodi.local',
      port: 19090,
      useTls: false,
      path: '/events'
    });
    expect(
      buildKodiJsonRpcWebSocketUrl({ host: 'wss://kodi.example.test:9443/kodi/jsonrpc' }).toString()
    ).toBe('wss://kodi.example.test:9443/kodi/jsonrpc');
  });

  it('splits a bare host:port WebSocket host', () => {
    expect(normalizeKodiWebSocketHost({ host: 'kodi.local:19090' })).toEqual({
      host: 'kodi.local',
      port: 19090,
      useTls: false,
      path: DEFAULT_KODI_WEBSOCKET_PATH
    });
    expect(buildKodiJsonRpcWebSocketUrl({ host: 'kodi.local:19090' }).toString()).toBe(
      'ws://kodi.local:19090/jsonrpc'
    );
  });

  it('rejects invalid WebSocket ports and query paths with deterministic non-secret messages', () => {
    expect(() => normalizeKodiWebSocketHost({ host: 'kodi.local', port: 70000 })).toThrow(
      'Kodi WebSocket port must be an integer between 1 and 65535.'
    );
    expect(() =>
      normalizeKodiWebSocketHost({ host: 'kodi.local', path: '/jsonrpc?token=secret' })
    ).toThrow('Kodi WebSocket path must not include a query string.');
  });

  it('rejects WebSocket URL userinfo and config passwords without leaking secret values', () => {
    expect(() =>
      normalizeKodiWebSocketHost({ host: 'ws://admin:secret-token@kodi.local/jsonrpc' })
    ).toThrow('Kodi WebSocket URL must not include credentials.');
    expect(() =>
      normalizeKodiWebSocketHost({ host: 'kodi.local', password: 'secret-token' })
    ).toThrow('Kodi WebSocket credentials are not supported in endpoint URLs.');

    for (const action of [
      () => normalizeKodiWebSocketHost({ host: 'ws://admin:secret-token@kodi.local/jsonrpc' }),
      () => normalizeKodiWebSocketHost({ host: 'kodi.local', password: 'secret-token' })
    ]) {
      try {
        action();
      } catch (error) {
        expect(String(error)).not.toContain('secret-token');
      }
    }
  });

  it('describes WebSocket endpoints without credentials', () => {
    const endpoint = describeKodiWebSocketEndpoint({
      host: 'wss://kodi.example.test:9443/kodi/jsonrpc'
    });

    expect(endpoint).toEqual({
      protocol: 'wss:',
      host: 'kodi.example.test',
      port: 9443,
      path: '/kodi/jsonrpc',
      hasCredentials: false
    });
    expect(JSON.stringify(endpoint)).not.toContain('Authorization');
    expect(JSON.stringify(endpoint)).not.toContain('@');
  });
});
