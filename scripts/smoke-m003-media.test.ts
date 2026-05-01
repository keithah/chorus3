import { describe, expect, it, vi, type Mock } from 'vitest';

import {
  MEDIA_SMOKE_METHODS,
  parseM003MediaSmokeEnv,
  runM003MediaSmoke
} from './smoke-m003-media.mjs';

const SECRET_PASSWORD = 'sentinel-secret-password';
const SECRET_AUTH = `Basic ${Buffer.from(`media-user:${SECRET_PASSWORD}`, 'utf8').toString('base64')}`;
const SECRET_PATH = 'smb://media-user:sentinel-secret-password@nas.local/Music/Secret.flac';
const SECRET_URL = 'http://media-user:sentinel-secret-password@kodi.local:8080/vfs/Secret.flac';
const SECRET_BODY = JSON.stringify({ file: SECRET_PATH, url: SECRET_URL, token: SECRET_PASSWORD });

type SmokeFetch = typeof fetch;
type SmokeFetchMock = Mock<SmokeFetch>;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

function expectSecretSafe(text: string): void {
  expect(text).not.toContain(SECRET_PASSWORD);
  expect(text).not.toContain(SECRET_AUTH);
  expect(text).not.toContain('Authorization');
  expect(text).not.toContain(SECRET_PATH);
  expect(text).not.toContain(SECRET_URL);
  expect(text).not.toContain('smb://');
  expect(text).not.toContain('special://musicplaylists');
  expect(text).not.toContain(SECRET_BODY);
}

function successResponses(): Response[] {
  return [
    jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 2,
      result: { artists: [{ artistid: 1 }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 3,
      result: { albums: [{ albumid: 2 }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 4,
      result: { songs: [{ songid: 3, file: SECRET_PATH }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 5,
      result: { genres: [{ genreid: 4 }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 6,
      result: { sources: [{ file: SECRET_PATH }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 7,
      result: { files: [{ file: SECRET_PATH }], limits: { total: 1 } }
    })
  ];
}

function calledBodies(fetchImpl: SmokeFetchMock): unknown[] {
  return fetchImpl.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
}

describe('M003 media smoke env parsing', () => {
  it('skips with a clear non-secret message when Kodi env is absent', () => {
    const result = parseM003MediaSmokeEnv({});

    expect(result).toEqual({
      ok: true,
      skipped: true,
      lines: [
        'M003 media smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe read-only media diagnostics.',
        'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
      ]
    });
  });

  it('parses split host env with credentials without exposing secrets in safe endpoint metadata', () => {
    const result = parseM003MediaSmokeEnv({
      KODI_HOST: 'kodi.local',
      KODI_PORT: '8081',
      KODI_USE_TLS: 'true',
      KODI_PATH: 'kodi/jsonrpc',
      KODI_USERNAME: 'media-user',
      KODI_PASSWORD: SECRET_PASSWORD,
      KODI_TIMEOUT_MS: '1200'
    });

    expect(result).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'https://kodi.local:8081/kodi/jsonrpc',
        endpointDescription: {
          protocol: 'https:',
          host: 'kodi.local',
          port: 8081,
          path: '/kodi/jsonrpc',
          timeoutMs: 1200,
          hasCredentials: true
        },
        username: 'media-user',
        password: SECRET_PASSWORD,
        timeoutMs: 1200
      }
    });
    expectSecretSafe(JSON.stringify(result.config?.endpointDescription));
  });

  it.each([
    [{ KODI_HTTP_URL: 'http://kodi.local/jsonrpc', KODI_HOST: 'kodi.local' }, 'Use either'],
    [
      { KODI_HTTP_URL: 'http://media-user:sentinel-secret-password@kodi.local/jsonrpc' },
      'must not include credentials'
    ],
    [{ KODI_HOST: '   ' }, 'KODI_HOST is required'],
    [{ KODI_HOST: 'kodi.local', KODI_PORT: '70000' }, 'KODI_PORT must be between'],
    [{ KODI_HOST: 'kodi.local', KODI_TIMEOUT_MS: 'NaN' }, 'KODI_TIMEOUT_MS must be']
  ])('rejects malformed env without leaking secrets: %o', (env, expectedMessage) => {
    const result = parseM003MediaSmokeEnv({ ...env, KODI_PASSWORD: SECRET_PASSWORD });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: 'invalid-env' });
    expect(result.lines.join('\n')).toContain(expectedMessage);
    expectSecretSafe(result.lines.join('\n'));
  });
});

describe('M003 media smoke runner', () => {
  it('runs bounded read-only M003 media method probes and prints method-level safe summaries', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(successResponses()[0])
      .mockResolvedValueOnce(successResponses()[1])
      .mockResolvedValueOnce(successResponses()[2])
      .mockResolvedValueOnce(successResponses()[3])
      .mockResolvedValueOnce(successResponses()[4])
      .mockResolvedValueOnce(successResponses()[5])
      .mockResolvedValueOnce(successResponses()[6]);

    const result = await runM003MediaSmoke(
      {
        endpoint: 'http://kodi.local:8080/jsonrpc',
        endpointDescription: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 500,
          hasCredentials: true
        },
        timeoutMs: 500,
        username: 'media-user',
        password: SECRET_PASSWORD
      },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(7);
    expect(calledBodies(fetchImpl)).toEqual([
      { jsonrpc: '2.0', id: 1, method: 'JSONRPC.Ping' },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'AudioLibrary.GetArtists',
        params: { limits: { start: 0, end: 5 }, properties: ['thumbnail'] }
      },
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'AudioLibrary.GetAlbums',
        params: { limits: { start: 0, end: 5 }, properties: ['artist', 'year', 'thumbnail'] }
      },
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'AudioLibrary.GetSongs',
        params: { limits: { start: 0, end: 5 }, properties: ['artist', 'album', 'duration'] }
      },
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'AudioLibrary.GetGenres',
        params: { limits: { start: 0, end: 5 }, properties: ['thumbnail'] }
      },
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'Files.GetSources',
        params: { media: 'music' }
      },
      {
        jsonrpc: '2.0',
        id: 7,
        method: 'Files.GetDirectory',
        params: {
          directory: 'special://musicplaylists',
          media: 'music',
          limits: { start: 0, end: 5 }
        }
      }
    ]);

    const [, firstInit] = fetchImpl.mock.calls[0];
    expect((firstInit?.headers as Headers).get('Authorization')).toBe(SECRET_AUTH);
    expect(result.lines.join('\n')).toContain(
      'M003 media smoke succeeded for http://kodi.local:8080/jsonrpc.'
    );
    for (const method of MEDIA_SMOKE_METHODS) {
      expect(result.lines.join('\n')).toContain(`${method}: ok`);
    }
    expect(result.lines.join('\n')).toContain(
      'Smart playlist root: listed read-only metadata only.'
    );
    expect(result.lines.join('\n')).toContain(
      'Write probes: unsupported in S07; no play, queue, or library mutation methods were called.'
    );
    expectSecretSafe(result.lines.join('\n'));
  });

  it.each([
    [401, 'Unauthorized', 'auth'],
    [500, 'Internal Server Error', 'http']
  ] as const)(
    'classifies HTTP %s as %s without leaking secrets',
    async (status, statusText, code) => {
      const fetchImpl: SmokeFetchMock = vi
        .fn<SmokeFetch>()
        .mockResolvedValue(jsonResponse({ raw: SECRET_BODY }, { status, statusText }));

      const result = await runM003MediaSmoke(
        { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
        { fetchImpl }
      );

      expect(result).toMatchObject({ ok: false, code });
      expect(result.lines.join('\n')).toContain(`${status} ${statusText}`);
      expect(result.lines.join('\n')).toContain('JSONRPC.Ping');
      expectSecretSafe(result.lines.join('\n'));
    }
  );

  it('classifies invalid JSON responses as malformed without leaking raw bodies', async () => {
    const fetchImpl: SmokeFetchMock = vi.fn<SmokeFetch>().mockResolvedValue(
      new Response(`not json ${SECRET_BODY}`, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(result.lines.join('\n')).toContain('invalid JSON response');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('classifies malformed JSON-RPC envelopes and missing results', async () => {
    const malformedFetch: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValue(jsonResponse({ jsonrpc: '1.0', id: 1, result: SECRET_BODY }));
    const missingResultFetch: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValue(jsonResponse({ jsonrpc: '2.0', id: 1 }));

    const malformed = await runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl: malformedFetch }
    );
    const missing = await runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl: missingResultFetch }
    );

    expect(malformed).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(missing).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(malformed.lines.join('\n')).toContain('malformed JSON-RPC envelope');
    expect(missing.lines.join('\n')).toContain('did not include a result');
    expectSecretSafe(`${malformed.lines.join('\n')}\n${missing.lines.join('\n')}`);
  });

  it('classifies JSON-RPC errors without leaking hostile error payloads', async () => {
    const fetchImpl: SmokeFetchMock = vi.fn<SmokeFetch>().mockResolvedValue(
      jsonResponse({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32602, message: `bad params ${SECRET_BODY}`, data: SECRET_PATH }
      })
    );

    const result = await runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'json-rpc-error' });
    expect(result.lines.join('\n')).toContain('JSON-RPC -32602');
    expect(result.lines.join('\n')).not.toContain('bad params');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('classifies fetch rejections and smoke-owned aborts as network or timeout without leaking raw errors', async () => {
    const rejectedFetch: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockRejectedValue(new Error(`connect failed ${SECRET_BODY}`));

    const network = await runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl: rejectedFetch }
    );

    expect(network).toMatchObject({ ok: false, code: 'network' });
    expect(network.lines.join('\n')).toContain('Could not reach Kodi');
    expectSecretSafe(network.lines.join('\n'));

    vi.useFakeTimers();
    const timeoutFetch: SmokeFetchMock = vi.fn<SmokeFetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('timed out', 'AbortError'));
          });
        })
    );

    const pending = runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 25, password: SECRET_PASSWORD },
      { fetchImpl: timeoutFetch }
    );
    await vi.advanceTimersByTimeAsync(25);
    const timeout = await pending;

    expect(timeout).toMatchObject({ ok: false, code: 'timeout' });
    expect(timeout.lines.join('\n')).toContain('JSONRPC.Ping timed out after 25ms');
    expectSecretSafe(timeout.lines.join('\n'));

    vi.useRealTimers();
  });

  it('rejects unexpected result shapes as malformed at the method that returned them', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 2, result: { artists: 'not-array' } })
      );

    const result = await runM003MediaSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(result.lines.join('\n')).toContain(
      'AudioLibrary.GetArtists returned an unexpected result shape'
    );
    expectSecretSafe(result.lines.join('\n'));
  });
});
