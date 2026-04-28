import { describe, expect, it } from 'vitest';

import {
  DEFAULT_KODI_HTTP_PATH,
  DEFAULT_KODI_HTTP_PORT,
  DEFAULT_KODI_TIMEOUT_MS,
  buildBasicAuthHeader,
  buildKodiJsonRpcHttpUrl,
  buildKodiRequestHeaders,
  describeKodiEndpoint,
  normalizeKodiHttpHost
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
