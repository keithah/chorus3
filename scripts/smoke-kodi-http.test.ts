import { describe, expect, it, vi, type Mock } from 'vitest';

import {
  DEFAULT_KODI_SMOKE_TIMEOUT_MS,
  parseKodiSmokeEnv,
  runKodiHttpSmoke
} from './smoke-kodi-http.mjs';

const SECRET_PASSWORD = 'sentinel-secret-password';
const SECRET_AUTH = `Basic ${Buffer.from(`media-user:${SECRET_PASSWORD}`, 'utf8').toString('base64')}`;

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
}

describe('Kodi HTTP smoke env parsing', () => {
  it('skips with a clear non-secret message when Kodi env is absent', () => {
    const result = parseKodiSmokeEnv({});

    expect(result).toEqual({
      ok: true,
      skipped: true,
      lines: [
        'Kodi HTTP smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe a live Kodi endpoint.',
        'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
      ]
    });
  });

  it('parses URL env without preserving URL userinfo or secret output details', () => {
    const result = parseKodiSmokeEnv({
      KODI_HTTP_URL: 'https://kodi.example.test:9443/kodi/jsonrpc?profile=main',
      KODI_USERNAME: 'media-user',
      KODI_PASSWORD: SECRET_PASSWORD,
      KODI_TIMEOUT_MS: '2500'
    });

    expect(result).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'https://kodi.example.test:9443/kodi/jsonrpc?profile=main',
        timeoutMs: 2500,
        username: 'media-user',
        password: SECRET_PASSWORD
      }
    });
    expect(result.config?.endpoint).not.toContain(SECRET_PASSWORD);
    expect(result.config?.endpoint).not.toContain('@');
  });

  it('parses split host env with defaults and timeout override', () => {
    expect(
      parseKodiSmokeEnv({
        KODI_HOST: 'kodi.local',
        KODI_PORT: '8081',
        KODI_USE_TLS: 'true',
        KODI_PATH: 'jsonrpc',
        KODI_TIMEOUT_MS: '1000'
      })
    ).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'https://kodi.local:8081/jsonrpc',
        timeoutMs: 1000
      }
    });

    expect(parseKodiSmokeEnv({ KODI_HOST: 'kodi.local' })).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'http://kodi.local:8080/jsonrpc',
        timeoutMs: DEFAULT_KODI_SMOKE_TIMEOUT_MS
      }
    });
  });

  it.each([
    [{ KODI_HTTP_URL: 'http://kodi.local/jsonrpc', KODI_HOST: 'kodi.local' }, 'Use either'],
    [{ KODI_HTTP_URL: 'http://user:password@kodi.local/jsonrpc' }, 'must not include credentials'],
    [{ KODI_HOST: '   ' }, 'KODI_HOST is required'],
    [{ KODI_HOST: 'kodi.local', KODI_PORT: '0' }, 'KODI_PORT must be'],
    [{ KODI_HOST: 'kodi.local', KODI_TIMEOUT_MS: 'nope' }, 'KODI_TIMEOUT_MS must be']
  ])('rejects malformed env without leaking secrets: %o', (env, expectedMessage) => {
    const result = parseKodiSmokeEnv({ ...env, KODI_PASSWORD: SECRET_PASSWORD });

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(expectedMessage);
    expectSecretSafe(result.lines.join('\n'));
  });
});

describe('Kodi HTTP smoke runner', () => {
  it('posts Ping and Application.GetProperties and prints safe success diagnostics', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 2,
          result: {
            name: 'Kodi',
            version: { major: 21, minor: 1 },
            volume: 57,
            muted: false
          }
        })
      );

    const result = await runKodiHttpSmoke(
      {
        endpoint: 'http://kodi.local:8080/jsonrpc',
        timeoutMs: 500,
        username: 'media-user',
        password: SECRET_PASSWORD
      },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(result.lines).toEqual([
      'Kodi HTTP smoke succeeded for http://kodi.local:8080/jsonrpc.',
      'Ping result: pong.',
      'Application: Kodi 21.1, volume 57, muted false.'
    ]);
    expectSecretSafe(result.lines.join('\n'));
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const [firstUrl, firstInit] = fetchImpl.mock.calls[0];
    const [secondUrl, secondInit] = fetchImpl.mock.calls[1];
    expect(String(firstUrl)).toBe('http://kodi.local:8080/jsonrpc');
    expect(String(secondUrl)).toBe('http://kodi.local:8080/jsonrpc');
    expect((firstInit?.headers as Headers).get('Authorization')).toBe(SECRET_AUTH);
    expect((secondInit?.headers as Headers).get('Authorization')).toBe(SECRET_AUTH);
    expect(JSON.parse(String(firstInit?.body))).toMatchObject({ method: 'JSONRPC.Ping' });
    expect(JSON.parse(String(secondInit?.body))).toMatchObject({
      method: 'Application.GetProperties',
      params: { properties: ['name', 'version', 'volume', 'muted'] }
    });
  });

  it.each([
    [401, 'Unauthorized', 'auth'],
    [500, 'Internal Server Error', 'http']
  ] as const)(
    'classifies HTTP %s as %s without leaking secrets',
    async (status, statusText, code) => {
      const fetchImpl: SmokeFetchMock = vi
        .fn<SmokeFetch>()
        .mockResolvedValue(jsonResponse({ ok: false }, { status, statusText }));

      const result = await runKodiHttpSmoke(
        {
          endpoint: 'http://kodi.local:8080/jsonrpc',
          timeoutMs: 500,
          username: 'media-user',
          password: SECRET_PASSWORD
        },
        { fetchImpl }
      );

      expect(result).toMatchObject({ ok: false, code });
      expect(result.lines.join('\n')).toContain(`${status} ${statusText}`);
      expectSecretSafe(result.lines.join('\n'));
    }
  );

  it('classifies invalid JSON responses as malformed without leaking secrets', async () => {
    const fetchImpl: SmokeFetchMock = vi.fn<SmokeFetch>().mockResolvedValue(
      new Response(`not json ${SECRET_PASSWORD}`, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await runKodiHttpSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(result.lines.join('\n')).toContain('Kodi returned an invalid JSON response');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('classifies fetch rejections as network failures without leaking raw errors', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockRejectedValue(new Error(`connect failed ${SECRET_PASSWORD}`));

    const result = await runKodiHttpSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'network' });
    expect(result.lines.join('\n')).toContain('Could not reach Kodi');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('classifies smoke-owned aborts as timeouts', async () => {
    vi.useFakeTimers();
    const fetchImpl: SmokeFetchMock = vi.fn<SmokeFetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('timed out', 'AbortError'));
          });
        })
    );

    const pending = runKodiHttpSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 25, password: SECRET_PASSWORD },
      { fetchImpl }
    );
    await vi.advanceTimersByTimeAsync(25);
    const result = await pending;

    expect(result).toMatchObject({ ok: false, code: 'timeout' });
    expect(result.lines.join('\n')).toContain('timed out after 25ms');
    expectSecretSafe(result.lines.join('\n'));

    vi.useRealTimers();
  });
});
