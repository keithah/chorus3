import type { Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import {
  buildLiveRouteMatrix,
  classifyJsonRpcProbe,
  classifyRootProbe,
  createLiveKodiProofSummary,
  normalizeLocalKodiOrigin,
  redactForLiveKodiProof,
  runLiveKodiProof,
  sanitizeBrowserDiagnostic
} from '../../scripts/verify-m007-live-kodi-browser-proof.mjs';

describe('M007 live Kodi proof runner helpers', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  });

  it('defaults to localhost and rejects non-local, invalid, and credential-bearing origins', () => {
    expect(normalizeLocalKodiOrigin()).toBe('http://localhost:8080/');
    expect(normalizeLocalKodiOrigin('http://127.0.0.1:8080//addons//')).toBe(
      'http://127.0.0.1:8080/'
    );
    expect(() => normalizeLocalKodiOrigin('not a url')).toThrow(/valid URL/u);
    expect(() => normalizeLocalKodiOrigin('http://user:pass@localhost:8080')).toThrow(
      /must not include credentials/u
    );
    expect(() => normalizeLocalKodiOrigin('http://example.com:8080')).toThrow(/local-only/u);
  });

  it('builds a bounded route matrix from the package route contract with active root, package root, remote, and now-playing', () => {
    const routes = buildLiveRouteMatrix('http://localhost:8080/');
    const routeIds = routes.map((route) => route.id);
    const paths = routes.map((route) => route.path);

    expect(routeIds[0]).toBe('active-root');
    expect(routeIds[1]).toBe('package-root');
    expect(paths).toContain('/');
    expect(paths).toContain('/addons/webinterface.chorus3/');
    expect(paths).toContain('/addons/webinterface.chorus3/remote');
    expect(paths).toContain('/addons/webinterface.chorus3/now-playing');
    expect(routes.every((route) => route.url.startsWith('http://localhost:8080/'))).toBe(true);
    expect(new Set(routeIds).size).toBe(routeIds.length);
  });

  it('redacts credentials, raw payloads, local paths, media paths, and ignored planning paths from evidence', () => {
    const redacted = redactForLiveKodiProof(
      'Authorization: Basic abcdefgh http://user:pass@localhost:8080 {"jsonrpc":"2.0","method":"Input.ExecuteAction"} /home/me/movie smb://nas/share .gsd/browser-artifacts secret=abc'
    );

    expect(redacted).toContain('[redacted-authorization]');
    expect(redacted).toContain('[redacted-credential-url]');
    expect(redacted).toContain('[redacted-json-rpc-body]');
    expect(redacted).toContain('[redacted-local-path]');
    expect(redacted).toContain('[redacted-media-path]');
    expect(redacted).toContain('[redacted-ignored-path]');
    expect(redacted).not.toMatch(
      /Basic abcdefgh|user:pass|jsonrpc|\/home\/me|smb:\/\/|\.gsd|secret=abc/u
    );
  });

  it('classifies root and JSON-RPC responses without exposing raw response bodies', async () => {
    expect(classifyRootProbe(new Response('login', { status: 401 }))).toMatchObject({
      statusClass: 'auth-required'
    });
    expect(
      classifyRootProbe(
        new Response('<html>Kodi web interface</html>', { status: 200 }),
        '<html>Kodi web interface</html>'
      )
    ).toMatchObject({
      statusClass: 'wrong-webinterface'
    });
    expect(
      classifyRootProbe(
        new Response('<html data-chorus3-kodi-base-resolver>chorus3:kodi-webinterface</html>', {
          status: 200
        }),
        '<html data-chorus3-kodi-base-resolver>chorus3:kodi-webinterface</html>'
      )
    ).toMatchObject({ statusClass: 'passed' });

    expect(await classifyJsonRpcProbe(new Response('not json', { status: 200 }))).toMatchObject({
      statusClass: 'malformed-response'
    });
    expect(
      await classifyJsonRpcProbe(
        Response.json({ jsonrpc: '2.0', id: 1, result: 'pong' }, { status: 200 })
      )
    ).toMatchObject({ statusClass: 'passed' });
  });

  it('sanitizes browser diagnostic messages to bounded status classes', () => {
    expect(sanitizeBrowserDiagnostic('GET /assets/app.js 404 /home/me/project')).toMatchObject({
      statusClass: 'asset-failed',
      messageClass: 'asset-missing'
    });
    expect(sanitizeBrowserDiagnostic('Uncaught TypeError: token=secret')).toMatchObject({
      statusClass: 'console-error',
      messageClass: 'script-error'
    });
    expect(sanitizeBrowserDiagnostic('net::ERR_CONNECTION_REFUSED')).toMatchObject({
      statusClass: 'browser-error',
      messageClass: 'network-error'
    });
  });

  it('returns unavailable for a refused local listener without validating R069', async () => {
    const result = await runLiveKodiProof({
      origin: 'http://127.0.0.1:9',
      dryRun: true,
      timeoutMs: 100,
      fetchImpl: fetch
    });

    expect(result.statusClass).toBe('unavailable');
    expect(result.r069Validated).toBe(false);
    expect(createLiveKodiProofSummary(result)).not.toMatch(
      /R069 validated|Authorization|jsonrpc|\/home\//iu
    );
  });

  it('reports wrong-webinterface, failed assets, console errors, and malformed JSON-RPC with sanitized evidence', async () => {
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === '/jsonrpc') {
        return new Response('not json', {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.pathname === '/missing.js') {
        return new Response('missing', {
          status: 404,
          headers: { 'content-type': 'text/javascript; charset=utf-8' }
        });
      }

      return new Response(
        '<html><head><script src="/missing.js"></script></head><body>Kodi default UI</body></html>',
        { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    };

    const result = await runLiveKodiProof({
      origin: 'http://127.0.0.1:8080',
      dryRun: true,
      timeoutMs: 500,
      fetchImpl,
      browserDiagnostics: async () => [sanitizeBrowserDiagnostic('console error: /home/me')]
    });

    expect(result.r069Validated).toBe(false);
    expect(result.probe.statusClass).toBe('wrong-webinterface');
    expect(result.jsonRpc.statusClass).toBe('malformed-response');
    expect(result.routes.some((route) => route.statusClass === 'asset-failed')).toBe(true);
    expect(result.browserDiagnostics.some((item) => item.statusClass === 'console-error')).toBe(
      true
    );
    expect(createLiveKodiProofSummary(result)).not.toMatch(/not json|\/home\/me|jsonrpc/u);
  });

  it('checks live routes with bounded concurrency', async () => {
    let jsonRpcPassed = false;
    let activeRouteFetches = 0;
    let maxActiveRouteFetches = 0;

    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === '/jsonrpc') {
        jsonRpcPassed = true;
        return Response.json({ jsonrpc: '2.0', id: 1, result: 'pong' }, { status: 200 });
      }

      if (jsonRpcPassed) {
        activeRouteFetches += 1;
        maxActiveRouteFetches = Math.max(maxActiveRouteFetches, activeRouteFetches);
        await new Promise((resolve) => setTimeout(resolve, 0));
        activeRouteFetches -= 1;
      }

      return new Response(
        '<html data-chorus3-kodi-base-resolver><meta name="chorus3:kodi-webinterface"></html>',
        { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    };

    const result = await runLiveKodiProof({
      origin: 'http://127.0.0.1:8080',
      dryRun: true,
      timeoutMs: 500,
      fetchImpl,
      routeConcurrency: 3
    });

    expect(result.routes.length).toBeGreaterThan(3);
    expect(maxActiveRouteFetches).toBeGreaterThan(1);
    expect(maxActiveRouteFetches).toBeLessThanOrEqual(3);
  });
});
