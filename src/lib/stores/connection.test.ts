import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KodiHttpClientError, type KodiHttpConnectionTestResult } from '$lib/kodi';
import {
  createConnectionStore,
  type ConnectionStoreOptions,
  type ConnectionStoreSnapshot
} from './connection.svelte';
import type {
  KodiHttpHost,
  KodiJsonRpcHttpClient,
  KodiWebSocketClient,
  KodiWebSocketClientEvent,
  KodiWebSocketHost,
  KodiWebSocketUnsubscribe
} from '$lib/kodi';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const healthyResult: KodiHttpConnectionTestResult = {
  ping: 'pong',
  jsonRpcVersion: { version: '2.0' },
  application: { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 55, muted: false }
};

class FakeWebSocketClient implements KodiWebSocketClient {
  readonly events: KodiWebSocketClientEvent[] = [];
  readonly listeners = new Set<(event: KodiWebSocketClientEvent) => void>();
  connectCalls = 0;
  disconnectCalls = 0;
  destroyCalls = 0;

  connect(): void {
    this.connectCalls += 1;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
  }

  destroy(): void {
    this.destroyCalls += 1;
    this.listeners.clear();
  }

  subscribe(listener: (event: KodiWebSocketClientEvent) => void): KodiWebSocketUnsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(): never {
    throw new Error('Not needed by connection store tests.');
  }

  emit(event: KodiWebSocketClientEvent): void {
    this.events.push(event);
    for (const listener of [...this.listeners]) {
      listener(event);
    }
  }
}

function makeOptions(overrides: Partial<ConnectionStoreOptions> = {}) {
  const httpClients: KodiJsonRpcHttpClient[] = [];
  const httpHosts: KodiHttpHost[] = [];
  const webSocketHosts: KodiWebSocketHost[] = [];
  const webSocketClients: FakeWebSocketClient[] = [];
  const httpResults: Array<Promise<KodiHttpConnectionTestResult>> = [
    Promise.resolve(healthyResult)
  ];

  const options: ConnectionStoreOptions = {
    createHttpClient: vi.fn((host: KodiHttpHost) => {
      httpHosts.push(host);
      const client: KodiJsonRpcHttpClient = {
        call: vi.fn()
      };
      httpClients.push(client);
      return client;
    }),
    testHttpConnection: vi.fn(() => httpResults.shift() ?? Promise.resolve(healthyResult)),
    createWebSocketClient: vi.fn((host: KodiWebSocketHost) => {
      webSocketHosts.push(host);
      const client = new FakeWebSocketClient();
      webSocketClients.push(client);
      return client;
    }),
    ...overrides
  };

  return { options, httpResults, httpHosts, webSocketHosts, webSocketClients };
}

function snapshot(store: { snapshot: ConnectionStoreSnapshot }): ConnectionStoreSnapshot {
  return store.snapshot;
}

describe('connection store', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('starts idle with observable safe defaults', () => {
    const { options } = makeOptions();
    const store = createConnectionStore(options);

    expect(snapshot(store)).toEqual({
      status: 'idle',
      lastError: null,
      kodiVersion: null,
      applicationName: null,
      lastConnectedAt: null,
      reconnectAttempt: 0,
      webSocketDegraded: false,
      endpoint: null,
      webSocketEndpoint: null
    });
  });

  it('connects through HTTP diagnostics before starting the WebSocket client', async () => {
    const { options, webSocketClients } = makeOptions();
    const store = createConnectionStore(options);

    await store.connect({ host: 'kodi.local', username: 'admin', password: 'secret' });

    expect(snapshot(store)).toMatchObject({
      status: 'connected',
      kodiVersion: { major: 21, minor: 1 },
      applicationName: 'Kodi',
      webSocketDegraded: false,
      reconnectAttempt: 0,
      endpoint: {
        protocol: 'http:',
        host: 'kodi.local',
        port: 8080,
        path: '/jsonrpc',
        timeoutMs: 5000,
        hasCredentials: true
      },
      webSocketEndpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      }
    });
    expect(webSocketClients).toHaveLength(1);
    expect(webSocketClients[0]?.connectCalls).toBe(1);
    expect(JSON.stringify(snapshot(store))).not.toContain('secret');
    expect(JSON.stringify(snapshot(store))).not.toContain('admin:secret');
  });

  it('records WebSocket open time without treating the initial open as a reconnect', async () => {
    const { options, webSocketClients } = makeOptions();
    const store = createConnectionStore(options);

    await store.connect({ host: 'kodi.local' });
    webSocketClients[0]?.emit({
      type: 'open',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      },
      lastConnectedAt: '2026-04-28T07:00:00.000Z'
    });

    expect(snapshot(store)).toMatchObject({
      status: 'connected',
      lastConnectedAt: '2026-04-28T07:00:00.000Z',
      reconnectAttempt: 0,
      webSocketDegraded: false,
      lastError: null
    });
  });

  it('keeps HTTP version visible while WebSocket close/error events degrade the session', async () => {
    const { options, webSocketClients } = makeOptions();
    const store = createConnectionStore(options);

    await store.connect({ host: 'kodi.local' });
    webSocketClients[0]?.emit({
      type: 'close',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      },
      code: 1006,
      reason: 'network interrupted',
      wasClean: false,
      intentional: false
    });
    webSocketClients[0]?.emit({
      type: 'reconnecting',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      },
      attempt: 2,
      delayMs: 2000
    });

    expect(snapshot(store)).toMatchObject({
      status: 'degraded',
      kodiVersion: { major: 21, minor: 1 },
      applicationName: 'Kodi',
      webSocketDegraded: true,
      reconnectAttempt: 2,
      lastError: {
        source: 'websocket',
        code: 'closed',
        message: 'Kodi WebSocket closed unexpectedly (code 1006).',
        endpoint: { host: 'kodi.local', port: 9090, path: '/jsonrpc' }
      }
    });
  });

  it('maps malformed WebSocket notification errors to safe degraded state without crashing', async () => {
    const { options, webSocketClients } = makeOptions();
    const store = createConnectionStore(options);

    await store.connect({ host: 'kodi.local' });

    expect(() => {
      webSocketClients[0]?.emit({
        type: 'error',
        endpoint: {
          protocol: 'ws:',
          host: 'kodi.local',
          port: 9090,
          path: '/jsonrpc',
          hasCredentials: false
        },
        error: {
          code: 'malformed-notification',
          message: 'Kodi WebSocket notification message is not valid JSON.',
          endpoint: {
            protocol: 'ws:',
            host: 'kodi.local',
            port: 9090,
            path: '/jsonrpc',
            hasCredentials: false
          },
          malformed: { code: 'invalid-json', message: 'bad' }
        }
      });
      webSocketClients[0]?.emit({ type: 'mystery' } as unknown as KodiWebSocketClientEvent);
    }).not.toThrow();

    expect(snapshot(store)).toMatchObject({
      status: 'degraded',
      webSocketDegraded: true,
      lastError: {
        source: 'websocket',
        code: 'malformed-notification',
        message: 'Kodi WebSocket notification message is not valid JSON.'
      }
    });
  });

  it('does not start WebSocket when HTTP diagnostics fail and keeps the error secret-safe', async () => {
    const { options, httpResults, webSocketClients } = makeOptions();
    httpResults.splice(
      0,
      httpResults.length,
      Promise.reject(
        new KodiHttpClientError({
          code: 'auth',
          method: 'JSONRPC.Ping',
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: true
          },
          status: 401,
          statusText: 'Unauthorized'
        })
      )
    );
    const store = createConnectionStore(options);

    await store.connect({ host: 'kodi.local', username: 'admin', password: 'secret' });

    expect(snapshot(store)).toMatchObject({
      status: 'failed',
      kodiVersion: null,
      applicationName: null,
      webSocketDegraded: false,
      lastError: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured username or password while calling JSONRPC.Ping.',
        endpoint: { host: 'kodi.local', hasCredentials: true }
      }
    });
    expect(webSocketClients).toHaveLength(0);
    expect(JSON.stringify(snapshot(store))).not.toContain('secret');
  });

  it('surfaces invalid host input as a safe failure', async () => {
    const { options, webSocketClients } = makeOptions();
    const store = createConnectionStore(options);

    await store.connect({ host: '   ' });

    expect(snapshot(store)).toMatchObject({
      status: 'failed',
      endpoint: null,
      webSocketEndpoint: null,
      lastError: {
        source: 'host',
        code: 'invalid-host',
        message: 'Kodi HTTP host is required.'
      }
    });
    expect(webSocketClients).toHaveLength(0);
  });

  it('disconnects and destroys the active WebSocket client while resetting transient state', async () => {
    const { options, webSocketClients } = makeOptions();
    const store = createConnectionStore(options);

    await store.connect({ host: 'kodi.local' });
    store.disconnect();

    expect(webSocketClients[0]?.disconnectCalls).toBe(1);
    expect(snapshot(store)).toMatchObject({
      status: 'idle',
      lastError: null,
      webSocketDegraded: false,
      reconnectAttempt: 0
    });

    await store.connect({ host: 'kodi.local' });
    store.destroy();

    expect(webSocketClients[1]?.destroyCalls).toBe(1);
    expect(snapshot(store)).toMatchObject({
      status: 'idle',
      lastError: null,
      endpoint: null,
      webSocketEndpoint: null
    });
  });

  it('ignores stale HTTP completions and stale WebSocket events after host switches', async () => {
    const firstHttp = deferred<KodiHttpConnectionTestResult>();
    const secondHttp = deferred<KodiHttpConnectionTestResult>();
    const { options, httpResults, webSocketClients } = makeOptions();
    httpResults.splice(0, httpResults.length, firstHttp.promise, secondHttp.promise);
    const store = createConnectionStore(options);

    const firstConnect = store.connect({ host: 'first.local' });
    const secondConnect = store.connect({ host: 'second.local' });

    firstHttp.resolve({
      ...healthyResult,
      application: { name: 'First Kodi', version: { major: 19 } }
    });
    await firstConnect;
    expect(snapshot(store)).toMatchObject({
      status: 'checking',
      endpoint: { host: 'second.local' }
    });
    expect(webSocketClients).toHaveLength(0);

    secondHttp.resolve(healthyResult);
    await secondConnect;
    expect(snapshot(store)).toMatchObject({
      status: 'connected',
      applicationName: 'Kodi',
      endpoint: { host: 'second.local' }
    });
    expect(webSocketClients).toHaveLength(1);

    const staleWebSocketClient = webSocketClients[0];
    const thirdHttp = deferred<KodiHttpConnectionTestResult>();
    httpResults.push(thirdHttp.promise);
    const thirdConnect = store.connect({ host: 'third.local' });

    staleWebSocketClient?.emit({
      type: 'open',
      endpoint: {
        protocol: 'ws:',
        host: 'second.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      },
      lastConnectedAt: '1999-01-01T00:00:00.000Z'
    });
    await flushPromises();

    expect(snapshot(store)).toMatchObject({
      status: 'checking',
      endpoint: { host: 'third.local' },
      lastConnectedAt: null
    });

    thirdHttp.resolve(healthyResult);
    await thirdConnect;
    expect(snapshot(store)).toMatchObject({
      status: 'connected',
      endpoint: { host: 'third.local' },
      lastConnectedAt: null
    });
  });
});
