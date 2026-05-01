import { describe, expect, it, vi, type Mock } from 'vitest';

import {
  VIDEO_SMOKE_METHODS,
  parseM004VideoSmokeEnv,
  runM004VideoSmoke,
  runM004VideoSmokeCli
} from './smoke-m004-video.mjs';

const SECRET_PASSWORD = 'sentinel-secret-password';
const SECRET_AUTH = `Basic ${Buffer.from(`video-user:${SECRET_PASSWORD}`, 'utf8').toString('base64')}`;
const SECRET_PATH = 'smb://video-user:sentinel-secret-password@nas.local/Video/Secret.mkv';
const SECRET_URL = 'http://video-user:sentinel-secret-password@kodi.local:8080/vfs/Secret.mkv';
const SECRET_BODY = JSON.stringify({ file: SECRET_PATH, url: SECRET_URL, token: SECRET_PASSWORD });

const MUTATING_METHOD_PATTERN =
  /Set(?:Movie|Episode|TVShow)Details|Player\.|Playlist\.|VideoLibrary\.Scan|VideoLibrary\.Refresh|Files\.PrepareDownload|Input\./;

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
  expect(text).not.toContain('Basic ');
  expect(text).not.toContain(SECRET_PATH);
  expect(text).not.toContain(SECRET_URL);
  expect(text).not.toContain('smb://');
  expect(text).not.toContain('special://videoplaylists');
  expect(text).not.toContain(SECRET_BODY);
}

function calledBodies(fetchImpl: SmokeFetchMock): Array<{ method: string; params?: unknown }> {
  return fetchImpl.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
}

function successResponses({ tvshowid = 5501 }: { tvshowid?: unknown } = {}): Response[] {
  return [
    jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 2,
      result: { movies: [{ movieid: 4401, file: SECRET_PATH }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 3,
      result: { tvshows: [{ tvshowid, file: SECRET_PATH }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 4,
      result: { seasons: [{ season: 1, file: SECRET_PATH }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 5,
      result: { episodes: [{ episodeid: 6601, file: SECRET_PATH }], limits: { total: 1 } }
    }),
    jsonResponse({
      jsonrpc: '2.0',
      id: 6,
      result: { files: [{ file: SECRET_PATH }], limits: { total: 1 } }
    })
  ];
}

function emptyResponses(): Response[] {
  return [
    jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }),
    jsonResponse({ jsonrpc: '2.0', id: 2, result: { movies: [], limits: { total: 0 } } }),
    jsonResponse({ jsonrpc: '2.0', id: 3, result: { tvshows: [], limits: { total: 0 } } }),
    jsonResponse({ jsonrpc: '2.0', id: 4, result: { episodes: [], limits: { total: 0 } } }),
    jsonResponse({ jsonrpc: '2.0', id: 5, result: { files: [], limits: { total: 0 } } })
  ];
}

describe('M004 video smoke env parsing', () => {
  it('skips with exit-safe non-secret output and no network when Kodi env is absent', async () => {
    const fetchImpl: SmokeFetchMock = vi.fn<SmokeFetch>();

    const result = await runM004VideoSmokeCli({}, { fetchImpl });

    expect(result).toEqual({
      ok: true,
      skipped: true,
      lines: [
        'M004 video smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe read-only video diagnostics.',
        'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
      ]
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expectSecretSafe(result.lines.join('\n'));
  });

  it('parses KODI_HTTP_URL with default JSON-RPC path and secret-safe endpoint metadata', () => {
    const result = parseM004VideoSmokeEnv({ KODI_HTTP_URL: 'https://kodi.local:8443' });

    expect(result).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'https://kodi.local:8443/jsonrpc',
        endpointDescription: {
          protocol: 'https:',
          host: 'kodi.local',
          port: 8443,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: false
        },
        timeoutMs: 5000
      }
    });
    expectSecretSafe(JSON.stringify(result.config?.endpointDescription));
  });

  it('parses split host env with TLS, path, and Basic Auth env credentials without exposing secrets in metadata', () => {
    const result = parseM004VideoSmokeEnv({
      KODI_HOST: 'kodi.local',
      KODI_PORT: '8081',
      KODI_USE_TLS: 'true',
      KODI_PATH: 'kodi/jsonrpc',
      KODI_USERNAME: 'video-user',
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
        username: 'video-user',
        password: SECRET_PASSWORD,
        timeoutMs: 1200
      }
    });
    expectSecretSafe(JSON.stringify(result.config?.endpointDescription));
  });

  it.each([
    [{ KODI_HTTP_URL: 'http://kodi.local/jsonrpc', KODI_HOST: 'kodi.local' }, 'Use either'],
    [
      { KODI_HTTP_URL: 'http://video-user:sentinel-secret-password@kodi.local/jsonrpc' },
      'must not include credentials'
    ],
    [{ KODI_HTTP_URL: 'ftp://kodi.local/jsonrpc' }, 'must use http:// or https://'],
    [{ KODI_HOST: '   ' }, 'KODI_HOST is required'],
    [{ KODI_HOST: 'kodi.local', KODI_PORT: '0' }, 'KODI_PORT must be a positive integer'],
    [{ KODI_HOST: 'kodi.local', KODI_PORT: '70000' }, 'KODI_PORT must be between'],
    [{ KODI_HOST: 'kodi.local', KODI_TIMEOUT_MS: 'NaN' }, 'KODI_TIMEOUT_MS must be']
  ])('rejects malformed env without leaking secrets: %o', (env, expectedMessage) => {
    const result = parseM004VideoSmokeEnv({ ...env, KODI_PASSWORD: SECRET_PASSWORD });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: 'invalid-env' });
    expect(result.lines.join('\n')).toContain(expectedMessage);
    expectSecretSafe(result.lines.join('\n'));
  });
});

describe('M004 video smoke runner', () => {
  it('runs bounded read-only M004 video method probes and prints method-level safe summaries', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(successResponses()[0])
      .mockResolvedValueOnce(successResponses()[1])
      .mockResolvedValueOnce(successResponses()[2])
      .mockResolvedValueOnce(successResponses()[3])
      .mockResolvedValueOnce(successResponses()[4])
      .mockResolvedValueOnce(successResponses()[5]);

    const result = await runM004VideoSmoke(
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
        username: 'video-user',
        password: SECRET_PASSWORD
      },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(calledBodies(fetchImpl)).toEqual([
      { jsonrpc: '2.0', id: 1, method: 'JSONRPC.Ping' },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'VideoLibrary.GetMovies',
        params: {
          limits: { start: 0, end: 5 },
          properties: ['title', 'year', 'runtime', 'thumbnail']
        }
      },
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'VideoLibrary.GetTVShows',
        params: {
          limits: { start: 0, end: 5 },
          properties: ['title', 'year', 'thumbnail']
        }
      },
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'VideoLibrary.GetSeasons',
        params: {
          tvshowid: 5501,
          limits: { start: 0, end: 5 },
          properties: ['season', 'episode', 'thumbnail']
        }
      },
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'VideoLibrary.GetEpisodes',
        params: {
          limits: { start: 0, end: 5 },
          properties: ['title', 'season', 'episode', 'runtime', 'thumbnail']
        }
      },
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'Files.GetDirectory',
        params: {
          directory: 'special://videoplaylists',
          media: 'video',
          limits: { start: 0, end: 5 }
        }
      }
    ]);

    for (const body of calledBodies(fetchImpl)) {
      expect(body.method).not.toMatch(MUTATING_METHOD_PATTERN);
      expect(JSON.stringify(body.params ?? {})).not.toContain('file');
    }

    const [, firstInit] = fetchImpl.mock.calls[0];
    expect((firstInit?.headers as Headers).get('Authorization')).toBe(SECRET_AUTH);
    const output = result.lines.join('\n');
    expect(output).toContain('M004 video smoke succeeded for configured Kodi endpoint.');
    for (const method of VIDEO_SMOKE_METHODS) {
      expect(output).toContain(`${method}: ok`);
    }
    expect(output).toContain('Video playlist root: listed read-only metadata only.');
    expect(output).toContain(
      'Write probes: unsupported in S07; no play, queue, watched/resume, stream preparation, artwork refresh, or library mutation methods were called.'
    );
    expectSecretSafe(output);
  });

  it('treats empty video libraries as valid and reports skipped season probe when no TV show ID exists', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(emptyResponses()[0])
      .mockResolvedValueOnce(emptyResponses()[1])
      .mockResolvedValueOnce(emptyResponses()[2])
      .mockResolvedValueOnce(emptyResponses()[3])
      .mockResolvedValueOnce(emptyResponses()[4]);

    const result = await runM004VideoSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    expect(calledBodies(fetchImpl).map((body) => body.method)).toEqual([
      'JSONRPC.Ping',
      'VideoLibrary.GetMovies',
      'VideoLibrary.GetTVShows',
      'VideoLibrary.GetEpisodes',
      'Files.GetDirectory'
    ]);
    expect(result.lines.join('\n')).toContain(
      'VideoLibrary.GetSeasons: skipped (no finite TV show ID returned).'
    );
    expect(result.lines.join('\n')).toContain('VideoLibrary.GetMovies: ok (0 returned, total 0).');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('skips season probe when probe-derived TV show ID is non-finite', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(successResponses({ tvshowid: Number.NaN })[0])
      .mockResolvedValueOnce(successResponses({ tvshowid: Number.NaN })[1])
      .mockResolvedValueOnce(successResponses({ tvshowid: Number.NaN })[2])
      .mockResolvedValueOnce(successResponses({ tvshowid: Number.NaN })[4])
      .mockResolvedValueOnce(successResponses({ tvshowid: Number.NaN })[5]);

    const result = await runM004VideoSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(calledBodies(fetchImpl).map((body) => body.method)).not.toContain(
      'VideoLibrary.GetSeasons'
    );
    expect(result.lines.join('\n')).toContain(
      'VideoLibrary.GetSeasons: skipped (no finite TV show ID returned).'
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

      const result = await runM004VideoSmoke(
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

    const result = await runM004VideoSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(result.lines.join('\n')).toContain('invalid JSON response');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('classifies malformed JSON-RPC envelopes, missing results, and unexpected result shapes', async () => {
    const malformedFetch: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValue(jsonResponse({ jsonrpc: '1.0', id: 1, result: SECRET_BODY }));
    const missingResultFetch: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValue(jsonResponse({ jsonrpc: '2.0', id: 1 }));
    const badShapeFetch: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 2, result: { movies: 'not-array' } })
      );

    const malformed = await runM004VideoSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl: malformedFetch }
    );
    const missing = await runM004VideoSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl: missingResultFetch }
    );
    const badShape = await runM004VideoSmoke(
      { endpoint: 'http://kodi.local:8080/jsonrpc', timeoutMs: 500, password: SECRET_PASSWORD },
      { fetchImpl: badShapeFetch }
    );

    expect(malformed).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(missing).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(badShape).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(malformed.lines.join('\n')).toContain('malformed JSON-RPC envelope');
    expect(missing.lines.join('\n')).toContain('did not include a result');
    expect(badShape.lines.join('\n')).toContain(
      'VideoLibrary.GetMovies returned an unexpected result shape'
    );
    expectSecretSafe(
      `${malformed.lines.join('\n')}\n${missing.lines.join('\n')}\n${badShape.lines.join('\n')}`
    );
  });

  it('classifies JSON-RPC errors without leaking hostile error payloads', async () => {
    const fetchImpl: SmokeFetchMock = vi.fn<SmokeFetch>().mockResolvedValue(
      jsonResponse({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32602, message: `bad params ${SECRET_BODY}`, data: SECRET_PATH }
      })
    );

    const result = await runM004VideoSmoke(
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

    const network = await runM004VideoSmoke(
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

    const pending = runM004VideoSmoke(
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
});
