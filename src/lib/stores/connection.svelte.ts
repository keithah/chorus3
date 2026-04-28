import {
  KodiHttpClientError,
  createKodiJsonRpcHttpClient,
  describeKodiEndpoint,
  describeKodiWebSocketEndpoint,
  isKodiHttpClientError,
  testKodiHttpConnection,
  type ApplicationPropertiesResult,
  type KodiEndpointDescription,
  type KodiHttpConnectionTestResult,
  type KodiHttpHost,
  type KodiJsonRpcHttpClient,
  type KodiWebSocketClient,
  type KodiWebSocketClientError,
  type KodiWebSocketClientEvent,
  type KodiWebSocketEndpointDescription,
  type KodiWebSocketHost,
  type KodiWebSocketUnsubscribe,
  type KodiVersion
} from '$lib/kodi';
import { createKodiJsonRpcWebSocketClient } from '$lib/kodi/webSocket';

export type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'degraded' | 'failed';
export type ConnectionErrorSource = 'host' | 'http' | 'websocket';

export interface ConnectionErrorSnapshot {
  source: ConnectionErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription | KodiWebSocketEndpointDescription;
}

export interface ConnectionStoreSnapshot {
  status: ConnectionStatus;
  lastError: ConnectionErrorSnapshot | null;
  kodiVersion: KodiVersion | string | null;
  applicationName: string | null;
  lastConnectedAt: string | null;
  reconnectAttempt: number;
  webSocketDegraded: boolean;
  endpoint: KodiEndpointDescription | null;
  webSocketEndpoint: KodiWebSocketEndpointDescription | null;
}

export interface ConnectionStoreOptions {
  createHttpClient?: (host: KodiHttpHost) => KodiJsonRpcHttpClient;
  testHttpConnection?: (
    client: KodiJsonRpcHttpClient,
    options?: { signal?: AbortSignal }
  ) => Promise<KodiHttpConnectionTestResult>;
  createWebSocketClient?: (host: KodiWebSocketHost) => KodiWebSocketClient;
}

export class ConnectionStore {
  status = $state<ConnectionStatus>('idle');
  lastError = $state<ConnectionErrorSnapshot | null>(null);
  kodiVersion = $state<KodiVersion | string | null>(null);
  applicationName = $state<string | null>(null);
  lastConnectedAt = $state<string | null>(null);
  reconnectAttempt = $state(0);
  webSocketDegraded = $state(false);
  endpoint = $state<KodiEndpointDescription | null>(null);
  webSocketEndpoint = $state<KodiWebSocketEndpointDescription | null>(null);

  readonly #createHttpClient: (host: KodiHttpHost) => KodiJsonRpcHttpClient;
  readonly #testHttpConnection: (
    client: KodiJsonRpcHttpClient,
    options?: { signal?: AbortSignal }
  ) => Promise<KodiHttpConnectionTestResult>;
  readonly #createWebSocketClient: (host: KodiWebSocketHost) => KodiWebSocketClient;

  #sessionId = 0;
  #webSocketClient: KodiWebSocketClient | null = null;
  #unsubscribeWebSocket: KodiWebSocketUnsubscribe | null = null;

  constructor(options: ConnectionStoreOptions = {}) {
    this.#createHttpClient = options.createHttpClient ?? createKodiJsonRpcHttpClient;
    this.#testHttpConnection = options.testHttpConnection ?? testKodiHttpConnection;
    this.#createWebSocketClient = options.createWebSocketClient ?? createKodiJsonRpcWebSocketClient;
  }

  get snapshot(): ConnectionStoreSnapshot {
    return {
      status: this.status,
      lastError: this.lastError,
      kodiVersion: this.kodiVersion,
      applicationName: this.applicationName,
      lastConnectedAt: this.lastConnectedAt,
      reconnectAttempt: this.reconnectAttempt,
      webSocketDegraded: this.webSocketDegraded,
      endpoint: this.endpoint,
      webSocketEndpoint: this.webSocketEndpoint
    };
  }

  async connect(host: KodiHttpHost & KodiWebSocketHost): Promise<void> {
    const sessionId = this.#startSession();
    this.status = 'checking';
    this.lastError = null;
    this.kodiVersion = null;
    this.applicationName = null;
    this.lastConnectedAt = null;
    this.reconnectAttempt = 0;
    this.webSocketDegraded = false;

    let endpoint: KodiEndpointDescription;
    let webSocketEndpoint: KodiWebSocketEndpointDescription;

    try {
      endpoint = describeKodiEndpoint(host);
      webSocketEndpoint = describeKodiWebSocketEndpoint(toWebSocketHost(host));
    } catch (error) {
      if (!this.#isActive(sessionId)) {
        return;
      }

      this.status = 'failed';
      this.endpoint = null;
      this.webSocketEndpoint = null;
      this.lastError = createHostError(error);
      return;
    }

    this.endpoint = endpoint;
    this.webSocketEndpoint = webSocketEndpoint;

    try {
      const client = this.#createHttpClient(host);
      const result = await this.#testHttpConnection(client);

      if (!this.#isActive(sessionId)) {
        return;
      }

      this.#applyHttpSuccess(result);
      this.status = 'connected';
      this.lastError = null;
      this.#startWebSocket(sessionId, toWebSocketHost(host));
    } catch (error) {
      if (!this.#isActive(sessionId)) {
        return;
      }

      this.status = 'failed';
      this.lastError = createHttpError(error, endpoint);
      this.webSocketDegraded = false;
      this.#clearWebSocket('destroy');
    }
  }

  disconnect(): void {
    this.#sessionId += 1;
    this.#clearWebSocket('disconnect');
    this.#resetTransientState();
  }

  destroy(): void {
    this.#sessionId += 1;
    this.#clearWebSocket('destroy');
    this.#resetAllState();
  }

  #startSession(): number {
    this.#sessionId += 1;
    this.#clearWebSocket('destroy');
    return this.#sessionId;
  }

  #isActive(sessionId: number): boolean {
    return sessionId === this.#sessionId;
  }

  #startWebSocket(sessionId: number, host: KodiWebSocketHost): void {
    try {
      const client = this.#createWebSocketClient(host);
      this.#webSocketClient = client;
      this.#unsubscribeWebSocket = client.subscribe((event) => {
        if (!this.#isActive(sessionId)) {
          return;
        }

        this.#handleWebSocketEvent(event);
      });
      client.connect();
    } catch (error) {
      if (!this.#isActive(sessionId)) {
        return;
      }

      this.#markWebSocketDegraded(
        createWebSocketSetupError(error, this.webSocketEndpoint ?? undefined)
      );
    }
  }

  #handleWebSocketEvent(event: KodiWebSocketClientEvent): void {
    switch (event.type) {
      case 'connecting':
      case 'notification':
        return;
      case 'open':
        this.status = 'connected';
        this.webSocketDegraded = false;
        this.lastConnectedAt = event.lastConnectedAt;
        this.reconnectAttempt = 0;
        this.lastError = null;
        return;
      case 'error':
        this.#markWebSocketDegraded(createWebSocketError(event.error));
        return;
      case 'close':
        if (!event.intentional) {
          this.#markWebSocketDegraded(createWebSocketCloseError(event));
        }
        return;
      case 'reconnecting':
        this.status = 'degraded';
        this.webSocketDegraded = true;
        this.reconnectAttempt = event.attempt;
        return;
      default:
        return;
    }
  }

  #markWebSocketDegraded(error: ConnectionErrorSnapshot): void {
    this.status = 'degraded';
    this.webSocketDegraded = true;
    this.lastError = error;
  }

  #applyHttpSuccess(result: KodiHttpConnectionTestResult): void {
    this.kodiVersion = extractKodiVersion(result.application, result.jsonRpcVersion.version);
    this.applicationName =
      typeof result.application.name === 'string' ? result.application.name : null;
  }

  #clearWebSocket(mode: 'disconnect' | 'destroy'): void {
    this.#unsubscribeWebSocket?.();
    this.#unsubscribeWebSocket = null;

    const client = this.#webSocketClient;
    this.#webSocketClient = null;

    if (!client) {
      return;
    }

    if (mode === 'disconnect') {
      client.disconnect();
    } else {
      client.destroy();
    }
  }

  #resetTransientState(): void {
    this.status = 'idle';
    this.lastError = null;
    this.lastConnectedAt = null;
    this.reconnectAttempt = 0;
    this.webSocketDegraded = false;
  }

  #resetAllState(): void {
    this.#resetTransientState();
    this.kodiVersion = null;
    this.applicationName = null;
    this.endpoint = null;
    this.webSocketEndpoint = null;
  }
}

function toWebSocketHost(host: KodiHttpHost & KodiWebSocketHost): KodiWebSocketHost {
  return {
    host: host.host,
    ...(host.port === undefined ? {} : { port: host.port }),
    ...(host.useTls === undefined ? {} : { useTls: host.useTls }),
    ...(host.path === undefined ? {} : { path: host.path })
  };
}

function extractKodiVersion(
  application: ApplicationPropertiesResult,
  jsonRpcVersion: KodiHttpConnectionTestResult['jsonRpcVersion']['version']
): KodiVersion | string | null {
  return application.version ?? jsonRpcVersion ?? null;
}

function createHostError(error: unknown): ConnectionErrorSnapshot {
  return {
    source: 'host',
    code: 'invalid-host',
    message: error instanceof Error ? error.message : 'Kodi host configuration is invalid.'
  };
}

function createHttpError(
  error: unknown,
  fallbackEndpoint: KodiEndpointDescription
): ConnectionErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: error.message,
      endpoint: error.endpoint
    };
  }

  return {
    source: 'http',
    code: 'network',
    message:
      error instanceof Error ? error.message : 'Could not reach Kodi while testing HTTP JSON-RPC.',
    endpoint: fallbackEndpoint
  };
}

function createWebSocketError(error: KodiWebSocketClientError): ConnectionErrorSnapshot {
  return {
    source: 'websocket',
    code: error.code,
    message: error.message,
    endpoint: error.endpoint
  };
}

function createWebSocketCloseError(
  event: Extract<KodiWebSocketClientEvent, { type: 'close' }>
): ConnectionErrorSnapshot {
  return {
    source: 'websocket',
    code: 'closed',
    message: `Kodi WebSocket closed unexpectedly (code ${event.code}).`,
    endpoint: event.endpoint
  };
}

function createWebSocketSetupError(
  error: unknown,
  endpoint?: KodiWebSocketEndpointDescription
): ConnectionErrorSnapshot {
  return {
    source: 'websocket',
    code: 'setup-failed',
    message: error instanceof Error ? error.message : 'Kodi WebSocket setup failed.',
    ...(endpoint === undefined ? {} : { endpoint })
  };
}

export function createConnectionStore(options: ConnectionStoreOptions = {}): ConnectionStore {
  return new ConnectionStore(options);
}

export const connectionStore = createConnectionStore();
