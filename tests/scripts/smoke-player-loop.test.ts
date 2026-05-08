import { describe, expect, it, vi, type Mock } from 'vitest';

import { parsePlayerLoopSmokeEnv, runPlayerLoopSmoke } from '../../scripts/smoke-player-loop.mjs';

const SECRET_PASSWORD = 'sentinel-secret-password';
const SECRET_AUTH = `Basic ${Buffer.from(`media-user:${SECRET_PASSWORD}`, 'utf8').toString('base64')}`;
const SECRET_PATH = 'smb://media-user:sentinel-secret-password@nas.local/Movies/Secret.mkv';
const SECRET_PREPARED_URL =
  'http://media-user:sentinel-secret-password@kodi.local:8080/vfs/Secret.mkv';

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
  expect(text).not.toContain(SECRET_PREPARED_URL);
  expect(text).not.toContain('smb://');
}

function calledMethods(fetchImpl: SmokeFetchMock): string[] {
  return fetchImpl.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).method);
}

describe('player-loop smoke env parsing', () => {
  it('skips with a clear non-secret message when Kodi env is absent', () => {
    const result = parsePlayerLoopSmokeEnv({});

    expect(result).toEqual({
      ok: true,
      skipped: true,
      lines: [
        'Kodi player-loop smoke skipped: set KODI_HTTP_URL or KODI_HOST/KODI_PORT to probe player diagnostics.',
        'Local media runtime proof: App renders a browser HTMLMediaElement adapter wired to localPlayerStore; covered by src/App.test.ts.',
        'Local media event proof: threshold scrobble/resume/watched decisions are driven from browser media events; covered by src/lib/stores/localPlayer.test.ts.',
        'Optional variables: KODI_USERNAME, KODI_PASSWORD, KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS, KODI_SMOKE_LOCAL_PATH, KODI_SMOKE_ENABLE_WRITES.'
      ]
    });
  });

  it('parses safe endpoint diagnostics without preserving secrets', () => {
    const result = parsePlayerLoopSmokeEnv({
      KODI_HOST: 'kodi.local',
      KODI_PORT: '8081',
      KODI_USERNAME: 'media-user',
      KODI_PASSWORD: SECRET_PASSWORD,
      KODI_SMOKE_LOCAL_PATH: SECRET_PATH
    });

    expect(result).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'http://kodi.local:8081/jsonrpc',
        endpointDescription: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8081,
          path: '/jsonrpc',
          hasCredentials: true
        },
        localPath: SECRET_PATH,
        enableWrites: false
      }
    });
    expectSecretSafe(JSON.stringify(result.config?.endpointDescription));
    expect(result.config?.endpoint).not.toContain('@');
  });

  it('rejects URL userinfo and malformed write gate values without leaking secrets', () => {
    const urlResult = parsePlayerLoopSmokeEnv({
      KODI_HTTP_URL: 'http://media-user:sentinel-secret-password@kodi.local/jsonrpc'
    });
    const gateResult = parsePlayerLoopSmokeEnv({
      KODI_HOST: 'kodi.local',
      KODI_SMOKE_ENABLE_WRITES: 'maybe',
      KODI_PASSWORD: SECRET_PASSWORD
    });

    expect(urlResult.ok).toBe(false);
    expect(urlResult.lines.join('\n')).toContain('must not include credentials');
    expectSecretSafe(urlResult.lines.join('\n'));
    expect(gateResult.ok).toBe(false);
    expect(gateResult.lines.join('\n')).toContain('KODI_SMOKE_ENABLE_WRITES');
    expectSecretSafe(gateResult.lines.join('\n'));
  });
});

describe('player-loop smoke runner', () => {
  it('runs only read-only player diagnostics by default and prints secret-safe output', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 2, result: [{ playerid: 1, type: 'audio' }] })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 3,
          result: {
            speed: 1,
            percentage: 42.5,
            repeat: 'off',
            shuffled: false,
            time: { hours: 0, minutes: 1, seconds: 2 },
            totaltime: { hours: 0, minutes: 3, seconds: 4 }
          }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 4,
          result: { item: { id: 7, type: 'song', title: 'Safe Title', file: SECRET_PATH } }
        })
      );

    const result = await runPlayerLoopSmoke(
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
        password: SECRET_PASSWORD,
        enableWrites: false
      },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(calledMethods(fetchImpl)).toEqual([
      'JSONRPC.Ping',
      'Player.GetActivePlayers',
      'Player.GetProperties',
      'Player.GetItem'
    ]);
    expect(result.lines.join('\n')).toContain(
      'Kodi player-loop smoke succeeded for http://kodi.local:8080/jsonrpc.'
    );
    expect(result.lines.join('\n')).toContain(
      'Endpoint: http://kodi.local:8080/jsonrpc (credentials configured: yes).'
    );
    expect(result.lines.join('\n')).toContain('Active players: audio#1.');
    expect(result.lines.join('\n')).toContain(
      'Player 1: speed 1, 42.5%, repeat off, shuffled false.'
    );
    expect(result.lines.join('\n')).toContain('Player 1 item: song#7 Safe Title.');
    expect(result.lines.join('\n')).toContain(
      'Local media runtime proof: App renders a browser HTMLMediaElement adapter wired to localPlayerStore; covered by src/App.test.ts.'
    );
    expect(result.lines.join('\n')).toContain(
      'Local media event proof: threshold scrobble/resume/watched decisions are driven from browser media events; covered by src/lib/stores/localPlayer.test.ts.'
    );
    expect(result.lines.join('\n')).toContain(
      'Local prep: skipped (set KODI_SMOKE_LOCAL_PATH to opt in).'
    );
    expect(result.lines.join('\n')).toContain(
      'Scrobble write: skipped (set KODI_SMOKE_ENABLE_WRITES=true plus KODI_SMOKE_SCROBBLE_SONG_ID to opt in).'
    );
    expectSecretSafe(result.lines.join('\n'));

    const [, firstInit] = fetchImpl.mock.calls[0];
    expect((firstInit?.headers as Headers).get('Authorization')).toBe(SECRET_AUTH);
  });

  it('runs local prep only when explicitly configured and redacts prepared URLs and paths', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 2, result: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 3, result: { details: { path: SECRET_PREPARED_URL } } })
      );

    const result = await runPlayerLoopSmoke(
      {
        endpoint: 'http://kodi.local:8080/jsonrpc',
        endpointDescription: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 500,
          hasCredentials: false
        },
        timeoutMs: 500,
        localPath: SECRET_PATH,
        enableWrites: false
      },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(calledMethods(fetchImpl)).toEqual([
      'JSONRPC.Ping',
      'Player.GetActivePlayers',
      'Files.PrepareDownload'
    ]);
    expect(result.lines.join('\n')).toContain('Active players: none.');
    expect(result.lines.join('\n')).toContain('Local prep: succeeded for configured path.');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('does not call scrobble writes unless explicitly gated', async () => {
    const fetchImpl: SmokeFetchMock = vi
      .fn<SmokeFetch>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 2, result: [] }));

    const result = await runPlayerLoopSmoke(
      {
        endpoint: 'http://kodi.local:8080/jsonrpc',
        endpointDescription: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 500,
          hasCredentials: false
        },
        timeoutMs: 500,
        scrobbleSongId: 12,
        enableWrites: false
      },
      { fetchImpl }
    );

    expect(result.ok).toBe(true);
    expect(calledMethods(fetchImpl)).not.toContain('AudioLibrary.SetSongDetails');
    expect(result.lines.join('\n')).toContain('Scrobble write: skipped');
    expectSecretSafe(result.lines.join('\n'));
  });
});
