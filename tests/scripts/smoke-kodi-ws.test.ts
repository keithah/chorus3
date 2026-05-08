import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_KODI_WS_SMOKE_PATH,
  DEFAULT_KODI_WS_SMOKE_PORT,
  DEFAULT_KODI_WS_SMOKE_TIMEOUT_MS,
  parseKodiWebSocketSmokeEnv,
  runKodiWebSocketSmoke
} from '../../scripts/smoke-kodi-ws.mjs';

const SECRET_PASSWORD = 'sentinel-secret-password';

type FakeWebSocketRecord = {
  url: string;
  sent: string[];
  close: ReturnType<typeof vi.fn>;
  emitOpen: () => void;
  emitMessage: (data: string) => void;
  emitError: () => void;
  emitClose: (code?: number) => void;
};

function createFakeWebSocket({ throwOnConstruct = false } = {}) {
  const sockets: FakeWebSocketRecord[] = [];

  class FakeWebSocket extends EventTarget {
    static OPEN = 1;
    static CLOSED = 3;

    readyState = 0;
    sent: string[] = [];
    close = vi.fn(() => {
      this.readyState = FakeWebSocket.CLOSED;
    });

    constructor(public readonly url: string) {
      super();

      if (throwOnConstruct) {
        throw new Error(`constructor leaked ${SECRET_PASSWORD}`);
      }

      sockets.push({
        url,
        sent: this.sent,
        close: this.close,
        emitOpen: () => {
          this.readyState = FakeWebSocket.OPEN;
          this.dispatchEvent(new Event('open'));
        },
        emitMessage: (data: string) => {
          this.dispatchEvent(new MessageEvent('message', { data }));
        },
        emitError: () => {
          this.dispatchEvent(new Event('error'));
        },
        emitClose: (code = 1006) => {
          this.readyState = FakeWebSocket.CLOSED;
          this.dispatchEvent(new CloseEvent('close', { code }));
        }
      });
    }

    send(data: string): void {
      this.sent.push(data);
    }
  }

  return { sockets, WebSocketImpl: FakeWebSocket as unknown as typeof WebSocket };
}

function expectSecretSafe(text: string): void {
  expect(text).not.toContain(SECRET_PASSWORD);
  expect(text).not.toContain('user:');
  expect(text).not.toContain('@');
}

describe('Kodi WebSocket smoke env parsing', () => {
  it('skips with a clear non-secret message when Kodi WebSocket env is absent', () => {
    const result = parseKodiWebSocketSmokeEnv({});

    expect(result).toEqual({
      ok: true,
      skipped: true,
      lines: [
        'Kodi WebSocket smoke skipped: set KODI_WS_URL or KODI_HOST/KODI_PORT to probe a live Kodi WebSocket endpoint.',
        'Optional variables: KODI_USE_TLS, KODI_PATH, KODI_TIMEOUT_MS.'
      ]
    });
  });

  it('parses URL env without preserving URL userinfo or secret output details', () => {
    const result = parseKodiWebSocketSmokeEnv({
      KODI_WS_URL: 'wss://kodi.example.test:9443/kodi/jsonrpc',
      KODI_TIMEOUT_MS: '2500'
    });

    expect(result).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: 'wss://kodi.example.test:9443/kodi/jsonrpc',
        endpointDescription: {
          protocol: 'wss',
          host: 'kodi.example.test',
          port: 9443,
          path: '/kodi/jsonrpc'
        },
        timeoutMs: 2500
      }
    });
  });

  it('parses split host env with WebSocket defaults', () => {
    expect(parseKodiWebSocketSmokeEnv({ KODI_HOST: 'kodi.local' })).toMatchObject({
      ok: true,
      skipped: false,
      config: {
        endpoint: `ws://kodi.local:${DEFAULT_KODI_WS_SMOKE_PORT}${DEFAULT_KODI_WS_SMOKE_PATH}`,
        timeoutMs: DEFAULT_KODI_WS_SMOKE_TIMEOUT_MS
      }
    });
  });

  it.each([
    [{ KODI_WS_URL: 'http://kodi.local/jsonrpc' }, 'must use ws:// or wss://'],
    [
      { KODI_WS_URL: `ws://user:${SECRET_PASSWORD}@kodi.local/jsonrpc` },
      'must not include credentials'
    ],
    [{ KODI_HOST: 'kodi.local', KODI_PORT: '70000' }, 'KODI_PORT must be between 1 and 65535'],
    [{ KODI_HOST: 'kodi.local', KODI_USE_TLS: 'maybe' }, 'KODI_USE_TLS must be'],
    [{ KODI_HOST: 'kodi.local', KODI_TIMEOUT_MS: 'nope' }, 'KODI_TIMEOUT_MS must be']
  ])('rejects malformed env without leaking secrets: %o', (env, expectedMessage) => {
    const result = parseKodiWebSocketSmokeEnv(env);

    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(expectedMessage);
    expectSecretSafe(result.lines.join('\n'));
  });
});

describe('Kodi WebSocket smoke runner', () => {
  it('skips when native WebSocket support is unavailable', async () => {
    const result = await runKodiWebSocketSmoke(
      {
        endpoint: 'ws://kodi.local:9090/jsonrpc',
        endpointDescription: { protocol: 'ws', host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        timeoutMs: 500
      },
      { WebSocketImpl: undefined }
    );

    expect(result).toEqual({
      ok: true,
      skipped: true,
      lines: ['Kodi WebSocket smoke skipped: native WebSocket is unavailable in this Node runtime.']
    });
  });

  it('opens one WebSocket, sends JSONRPC.Ping, and prints safe success diagnostics', async () => {
    const { sockets, WebSocketImpl } = createFakeWebSocket();
    const pending = runKodiWebSocketSmoke(
      {
        endpoint: 'ws://kodi.local:9090/jsonrpc',
        endpointDescription: { protocol: 'ws', host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        timeoutMs: 500
      },
      { WebSocketImpl }
    );

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();
    sockets[0].emitMessage(JSON.stringify({ jsonrpc: '2.0', id: 1, result: 'pong' }));
    const result = await pending;

    expect(result).toEqual({
      ok: true,
      lines: [
        'Kodi WebSocket smoke succeeded for ws://kodi.local:9090/jsonrpc.',
        'Ping result: pong.'
      ]
    });
    expect(JSON.parse(sockets[0].sent[0])).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'JSONRPC.Ping'
    });
    expect(sockets[0].close).toHaveBeenCalledWith(1000, 'smoke-complete');
  });

  it('classifies constructor failures without leaking raw errors', async () => {
    const { WebSocketImpl } = createFakeWebSocket({ throwOnConstruct: true });

    const result = await runKodiWebSocketSmoke(
      {
        endpoint: 'ws://kodi.local:9090/jsonrpc',
        endpointDescription: { protocol: 'ws', host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        timeoutMs: 500
      },
      { WebSocketImpl }
    );

    expect(result).toMatchObject({ ok: false, code: 'network' });
    expect(result.lines.join('\n')).toContain('Could not open Kodi WebSocket');
    expectSecretSafe(result.lines.join('\n'));
  });

  it('classifies close before open as a safe connection failure', async () => {
    const { sockets, WebSocketImpl } = createFakeWebSocket();
    const pending = runKodiWebSocketSmoke(
      {
        endpoint: 'ws://kodi.local:9090/jsonrpc',
        endpointDescription: { protocol: 'ws', host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        timeoutMs: 500
      },
      { WebSocketImpl }
    );

    sockets[0].emitClose(1006);
    const result = await pending;

    expect(result).toMatchObject({ ok: false, code: 'closed' });
    expect(result.lines.join('\n')).toContain('closed before ping completed');
  });

  it('classifies malformed ping responses as safe smoke failures', async () => {
    const { sockets, WebSocketImpl } = createFakeWebSocket();
    const pending = runKodiWebSocketSmoke(
      {
        endpoint: 'ws://kodi.local:9090/jsonrpc',
        endpointDescription: { protocol: 'ws', host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        timeoutMs: 500
      },
      { WebSocketImpl }
    );

    sockets[0].emitOpen();
    sockets[0].emitMessage('{not-json');
    const result = await pending;

    expect(result).toMatchObject({ ok: false, code: 'malformed-response' });
    expect(result.lines.join('\n')).toContain('invalid JSON');
  });

  it('times out with safe endpoint diagnostics', async () => {
    vi.useFakeTimers();
    const { WebSocketImpl } = createFakeWebSocket();
    const pending = runKodiWebSocketSmoke(
      {
        endpoint: `ws://user:${SECRET_PASSWORD}@kodi.local:9090/jsonrpc`,
        endpointDescription: { protocol: 'ws', host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        timeoutMs: 25
      },
      { WebSocketImpl }
    );

    await vi.advanceTimersByTimeAsync(25);
    const result = await pending;

    expect(result).toMatchObject({ ok: false, code: 'timeout' });
    expect(result.lines.join('\n')).toContain('ws://kodi.local:9090/jsonrpc');
    expectSecretSafe(result.lines.join('\n'));
    vi.useRealTimers();
  });
});
