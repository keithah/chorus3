import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createKodiJsonRpcWebSocketClient,
  type KodiWebSocketClientEvent,
  type KodiWebSocketImplementation
} from './webSocket';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  message(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  error(): void {
    this.onerror?.(new Event('error'));
  }

  closeFromServer(code = 1006, reason = 'network interrupted', wasClean = false): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean }));
  }

  send(data: string): void {
    if (this.readyState !== FakeWebSocket.OPEN) {
      throw new Error('Fake socket is not open.');
    }

    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code ?? 1000, reason, wasClean: true }));
  }
}

function createClient(options: Parameters<typeof createKodiJsonRpcWebSocketClient>[1] = {}) {
  return createKodiJsonRpcWebSocketClient(
    { host: 'kodi.local' },
    {
      WebSocketImpl: FakeWebSocket as unknown as KodiWebSocketImplementation,
      heartbeatIntervalMs: 1000,
      reconnectDelaysMs: [100, 200, 30_000],
      ...options
    }
  );
}

function collectEvents() {
  const events: KodiWebSocketClientEvent[] = [];
  return {
    events,
    listener: (event: KodiWebSocketClientEvent) => events.push(event),
    types: () => events.map((event) => event.type)
  };
}

describe('createKodiJsonRpcWebSocketClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a native WebSocket and emits connecting/open events with safe endpoint details', () => {
    const client = createClient();
    const { events, listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0]?.url).toBe('ws://kodi.local:9090/jsonrpc');

    FakeWebSocket.instances[0]?.open();

    expect(types()).toEqual(['connecting', 'open']);
    expect(events[0]).toMatchObject({
      type: 'connecting',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      }
    });
    expect(JSON.stringify(events)).not.toContain('ws://');
  });

  it('parses notifications and fans out to multiple subscribers until they unsubscribe', () => {
    const client = createClient();
    const first = collectEvents();
    const second = collectEvents();
    const unsubscribeFirst = client.subscribe(first.listener);
    client.subscribe(second.listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    unsubscribeFirst();
    FakeWebSocket.instances[0]?.message(
      JSON.stringify({ jsonrpc: '2.0', method: 'Player.OnPlay', params: { speed: 1 } })
    );

    expect(first.types()).toEqual(['connecting', 'open']);
    expect(second.types()).toEqual(['connecting', 'open', 'notification']);
    expect(second.events.at(-1)).toMatchObject({
      type: 'notification',
      notification: { method: 'Player.OnPlay', params: { speed: 1 } }
    });
  });

  it('keeps dispatching when one subscriber throws', () => {
    const client = createClient();
    const observed = collectEvents();
    client.subscribe(() => {
      throw new Error('subscriber failed');
    });
    client.subscribe(observed.listener);

    expect(() => client.connect()).not.toThrow();

    expect(observed.types()).toEqual(['connecting']);
  });

  it('emits malformed-notification errors without closing the socket session', () => {
    const client = createClient();
    const { events, listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.message('{not-json');

    expect(types()).toEqual(['connecting', 'open', 'error']);
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      error: {
        code: 'malformed-notification',
        message: 'Kodi WebSocket notification message is not valid JSON.',
        endpoint: { host: 'kodi.local', port: 9090, path: '/jsonrpc' },
        malformed: { code: 'invalid-json' }
      }
    });
    expect(FakeWebSocket.instances[0]?.readyState).toBe(FakeWebSocket.OPEN);
  });

  it('reports send before open as a typed safe error', () => {
    const client = createClient();
    const { events, listener } = collectEvents();
    client.subscribe(listener);

    const result = client.send('JSONRPC.Ping');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error).toMatchObject({
      code: 'not-open',
      endpoint: { host: 'kodi.local', port: 9090, path: '/jsonrpc' }
    });
    expect(events.at(-1)).toMatchObject({ type: 'error', error: { code: 'not-open' } });
  });

  it('sends JSON-RPC requests and heartbeat pings while open', () => {
    const client = createClient();

    client.connect();
    FakeWebSocket.instances[0]?.open();
    expect(client.send('Player.GetActivePlayers')).toMatchObject({ ok: true });
    vi.advanceTimersByTime(1000);

    expect(FakeWebSocket.instances[0]?.sent.map((payload) => JSON.parse(payload))).toEqual([
      { jsonrpc: '2.0', id: 1, method: 'Player.GetActivePlayers' },
      { jsonrpc: '2.0', id: 2, method: 'JSONRPC.Ping' }
    ]);
  });

  it('emits close and reconnecting after unexpected close with capped backoff progression', () => {
    const client = createClient({ reconnectDelaysMs: [100, 200, 30_000] });
    const { events, listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.closeFromServer();

    expect(types()).toEqual(['connecting', 'open', 'close', 'reconnecting']);
    expect(events.at(-1)).toMatchObject({ type: 'reconnecting', attempt: 1, delayMs: 100 });
    vi.advanceTimersByTime(100);
    expect(FakeWebSocket.instances).toHaveLength(2);

    FakeWebSocket.instances[1]?.open();
    FakeWebSocket.instances[1]?.closeFromServer();
    expect(events.at(-1)).toMatchObject({ type: 'reconnecting', attempt: 2, delayMs: 200 });
    vi.advanceTimersByTime(200);
    expect(FakeWebSocket.instances).toHaveLength(3);

    FakeWebSocket.instances[2]?.open();
    FakeWebSocket.instances[2]?.closeFromServer();
    expect(events.at(-1)).toMatchObject({ type: 'reconnecting', attempt: 3, delayMs: 30_000 });
    vi.advanceTimersByTime(30_000);
    expect(FakeWebSocket.instances).toHaveLength(4);
  });

  it('detaches handlers from closed sockets before reconnecting', () => {
    const client = createClient();
    const { listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket?.open();
    firstSocket?.closeFromServer();

    expect(firstSocket?.onopen).toBeNull();
    expect(firstSocket?.onmessage).toBeNull();
    expect(firstSocket?.onerror).toBeNull();
    expect(firstSocket?.onclose).toBeNull();

    vi.advanceTimersByTime(100);
    expect(FakeWebSocket.instances).toHaveLength(2);
    firstSocket?.message(JSON.stringify({ jsonrpc: '2.0', method: 'Player.OnPlay' }));

    expect(types()).toEqual(['connecting', 'open', 'close', 'reconnecting', 'connecting']);
  });

  it('emits error and schedules reconnect after socket error', () => {
    const client = createClient();
    const { listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.error();

    expect(types()).toEqual(['connecting', 'open', 'error', 'reconnecting']);
  });

  it('times out stalled WebSocket connections and schedules reconnect', () => {
    const client = createClient({ connectTimeoutMs: 250 });
    const { events, listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(250);

    expect(types()).toEqual(['connecting', 'error', 'reconnecting']);
    expect(events.at(-2)).toMatchObject({
      type: 'error',
      error: { code: 'connect-timeout' }
    });
    vi.advanceTimersByTime(100);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('does not reconnect after manual disconnect and clears heartbeat', () => {
    const client = createClient();
    const { listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    client.disconnect();
    vi.advanceTimersByTime(10_000);

    expect(types()).toEqual(['connecting', 'open', 'close']);
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0]?.sent).toEqual([]);
  });

  it('destroy tears down subscribers and pending reconnect callbacks', () => {
    const client = createClient();
    const { listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.closeFromServer();
    client.destroy();
    vi.advanceTimersByTime(30_000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(types()).toEqual(['connecting', 'open', 'close', 'reconnecting']);
  });

  it('emits unsupported errors when no WebSocket implementation is available', () => {
    const client = createKodiJsonRpcWebSocketClient(
      { host: 'kodi.local' },
      { WebSocketImpl: undefined, heartbeatIntervalMs: 1000 }
    );
    const { events, listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();

    expect(types()).toEqual(['connecting', 'error']);
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      error: { code: 'unsupported', endpoint: { host: 'kodi.local' } }
    });
  });

  it('emits network errors if the WebSocket constructor throws without leaking raw errors', () => {
    const WebSocketImpl = vi.fn(() => {
      throw new Error('secret constructor detail');
    }) as unknown as KodiWebSocketImplementation;
    const client = createKodiJsonRpcWebSocketClient(
      { host: 'kodi.local' },
      { WebSocketImpl, heartbeatIntervalMs: 1000 }
    );
    const { events, listener } = collectEvents();
    client.subscribe(listener);

    client.connect();

    expect(events.at(-1)).toMatchObject({ type: 'error', error: { code: 'network' } });
    expect(JSON.stringify(events)).not.toContain('secret constructor detail');
  });

  it('emits a safe error when heartbeat send fails and schedules reconnect', () => {
    const client = createClient();
    const { events, listener, types } = collectEvents();
    client.subscribe(listener);

    client.connect();
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]!.readyState = FakeWebSocket.CLOSED;
    vi.advanceTimersByTime(1000);

    expect(types()).toContain('error');
    expect(types()).toContain('reconnecting');
    expect(events.find((event) => event.type === 'error')).toMatchObject({
      type: 'error',
      error: { code: 'heartbeat-failed' }
    });
  });
});
