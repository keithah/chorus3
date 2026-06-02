import {
  buildKodiJsonRpcWebSocketUrl,
  describeKodiWebSocketEndpoint,
  type KodiWebSocketEndpointDescription,
  type KodiWebSocketHost
} from './host';
import {
  parseKodiNotificationMessage,
  type KodiNotification,
  type MalformedKodiNotification
} from './notifications';

export interface KodiWebSocketLike {
  readonly readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type KodiWebSocketImplementation = new (url: string) => KodiWebSocketLike;

export type KodiWebSocketClientErrorCode =
  | 'unsupported'
  | 'network'
  | 'connect-timeout'
  | 'not-open'
  | 'send-failed'
  | 'heartbeat-failed'
  | 'malformed-notification';

export interface KodiWebSocketClientError {
  code: KodiWebSocketClientErrorCode;
  message: string;
  endpoint: KodiWebSocketEndpointDescription;
  malformed?: MalformedKodiNotification;
}

export type KodiWebSocketClientEvent =
  | { type: 'connecting'; endpoint: KodiWebSocketEndpointDescription }
  | { type: 'open'; endpoint: KodiWebSocketEndpointDescription; lastConnectedAt: string }
  | {
      type: 'notification';
      endpoint: KodiWebSocketEndpointDescription;
      notification: KodiNotification;
    }
  | { type: 'error'; endpoint: KodiWebSocketEndpointDescription; error: KodiWebSocketClientError }
  | {
      type: 'close';
      endpoint: KodiWebSocketEndpointDescription;
      code: number;
      reason: string;
      wasClean: boolean;
      intentional: boolean;
    }
  | {
      type: 'reconnecting';
      endpoint: KodiWebSocketEndpointDescription;
      attempt: number;
      delayMs: number;
    };

export type KodiWebSocketClientListener = (event: KodiWebSocketClientEvent) => void;
export type KodiWebSocketUnsubscribe = () => void;

export interface KodiWebSocketClientOptions {
  WebSocketImpl?: KodiWebSocketImplementation;
  connectTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  reconnectDelaysMs?: number[];
}

export interface KodiWebSocketSendSuccess {
  ok: true;
  id: number;
}

export interface KodiWebSocketSendFailure {
  ok: false;
  error: KodiWebSocketClientError;
}

export type KodiWebSocketSendResult = KodiWebSocketSendSuccess | KodiWebSocketSendFailure;

export interface KodiWebSocketClient {
  connect(): void;
  disconnect(): void;
  destroy(): void;
  subscribe(listener: KodiWebSocketClientListener): KodiWebSocketUnsubscribe;
  send(method: string, params?: unknown): KodiWebSocketSendResult;
}

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const WEBSOCKET_CONNECTING = 0;
const WEBSOCKET_OPEN = 1;

function getDefaultWebSocketImplementation(): KodiWebSocketImplementation | undefined {
  return typeof WebSocket === 'undefined'
    ? undefined
    : (WebSocket as unknown as KodiWebSocketImplementation);
}

function resolveWebSocketImplementation(
  options: KodiWebSocketClientOptions
): KodiWebSocketImplementation | undefined {
  return Object.prototype.hasOwnProperty.call(options, 'WebSocketImpl')
    ? options.WebSocketImpl
    : getDefaultWebSocketImplementation();
}

function normalizePositiveInterval(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? value : fallback;
}

function normalizeReconnectDelays(delays: number[] | undefined): number[] {
  const normalized = delays?.filter((delay) => Number.isFinite(delay) && delay >= 0) ?? [];
  return normalized.length > 0 ? normalized : DEFAULT_RECONNECT_DELAYS_MS;
}

export function createKodiJsonRpcWebSocketClient(
  hostConfig: KodiWebSocketHost,
  options: KodiWebSocketClientOptions = {}
): KodiWebSocketClient {
  const endpoint = describeKodiWebSocketEndpoint(hostConfig);
  const url = buildKodiJsonRpcWebSocketUrl(hostConfig).toString();
  const WebSocketImpl = resolveWebSocketImplementation(options);
  const connectTimeoutMs = normalizePositiveInterval(
    options.connectTimeoutMs,
    DEFAULT_CONNECT_TIMEOUT_MS
  );
  const heartbeatIntervalMs = normalizePositiveInterval(
    options.heartbeatIntervalMs,
    DEFAULT_HEARTBEAT_INTERVAL_MS
  );
  const reconnectDelaysMs = normalizeReconnectDelays(options.reconnectDelaysMs);
  const listeners = new Set<KodiWebSocketClientListener>();

  let socket: KodiWebSocketLike | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  let intentionallyClosed = false;
  let reconnectAttempt = 0;
  let requestId = 0;
  let sessionId = 0;

  function dispatch(event: KodiWebSocketClientEvent): void {
    for (const listener of [...listeners]) {
      try {
        listener(event);
      } catch {
        // Subscriber failures must not prevent other subscribers from receiving lifecycle signals.
      }
    }
  }

  function createError(
    code: KodiWebSocketClientErrorCode,
    message: string,
    malformed?: MalformedKodiNotification
  ): KodiWebSocketClientError {
    return malformed === undefined
      ? { code, message, endpoint }
      : { code, message, endpoint, malformed };
  }

  function emitError(error: KodiWebSocketClientError): void {
    dispatch({ type: 'error', endpoint, error });
  }

  function clearHeartbeat(): void {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function clearConnectTimeout(): void {
    if (connectTimer !== null) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  }

  function clearReconnect(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function detachSocketHandlers(currentSocket: KodiWebSocketLike | null): void {
    if (!currentSocket) {
      return;
    }

    currentSocket.onopen = null;
    currentSocket.onmessage = null;
    currentSocket.onerror = null;
    currentSocket.onclose = null;
  }

  function cleanupSocket(): void {
    clearConnectTimeout();
    clearHeartbeat();
    detachSocketHandlers(socket);
    socket = null;
  }

  function startConnectTimeout(currentSessionId: number): void {
    clearConnectTimeout();
    connectTimer = setTimeout(() => {
      connectTimer = null;
      if (currentSessionId !== sessionId || destroyed || intentionallyClosed) {
        return;
      }

      const currentSocket = socket;
      socket = null;
      detachSocketHandlers(currentSocket);
      currentSocket?.close(1000, 'Kodi WebSocket connection timed out.');
      emitError(
        createError(
          'connect-timeout',
          `Kodi WebSocket did not connect within ${connectTimeoutMs}ms.`
        )
      );
      scheduleReconnect();
    }, connectTimeoutMs);
  }

  function reconnectDelayForAttempt(attempt: number): number {
    return reconnectDelaysMs[Math.min(attempt - 1, reconnectDelaysMs.length - 1)] ?? 30_000;
  }

  function scheduleReconnect(): void {
    if (destroyed || intentionallyClosed || reconnectTimer !== null) {
      return;
    }

    clearHeartbeat();
    reconnectAttempt += 1;
    const attempt = reconnectAttempt;
    const delayMs = reconnectDelayForAttempt(attempt);

    dispatch({ type: 'reconnecting', endpoint, attempt, delayMs });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      cleanupSocket();
      connect();
    }, delayMs);
  }

  function startHeartbeat(currentSessionId: number): void {
    clearHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (currentSessionId !== sessionId || destroyed || intentionallyClosed) {
        return;
      }

      const currentSocket = socket;
      if (!currentSocket || currentSocket.readyState !== WEBSOCKET_OPEN) {
        emitError(
          createError(
            'heartbeat-failed',
            'Kodi WebSocket heartbeat failed because the socket is not open.'
          )
        );
        scheduleReconnect();
        return;
      }

      const result = send('JSONRPC.Ping');
      if (!result.ok) {
        emitError(createError('heartbeat-failed', 'Kodi WebSocket heartbeat send failed.'));
        scheduleReconnect();
      }
    }, heartbeatIntervalMs);
  }

  function handleOpen(currentSessionId: number): void {
    if (currentSessionId !== sessionId || destroyed) {
      return;
    }

    clearConnectTimeout();
    dispatch({ type: 'open', endpoint, lastConnectedAt: new Date().toISOString() });
    startHeartbeat(currentSessionId);
  }

  function handleMessage(currentSessionId: number, event: MessageEvent<string>): void {
    if (currentSessionId !== sessionId || destroyed) {
      return;
    }

    const result = parseKodiNotificationMessage(String(event.data));
    if (result.ok) {
      dispatch({ type: 'notification', endpoint, notification: result.notification });
      return;
    }

    emitError(createError('malformed-notification', result.error.message, result.error));
  }

  function handleError(currentSessionId: number): void {
    if (currentSessionId !== sessionId || destroyed) {
      return;
    }

    clearConnectTimeout();
    emitError(createError('network', 'Kodi WebSocket emitted an error event.'));
    scheduleReconnect();
  }

  function handleClose(currentSessionId: number, event: CloseEvent): void {
    if (currentSessionId !== sessionId || destroyed) {
      return;
    }

    const intentional = intentionallyClosed;
    cleanupSocket();
    dispatch({
      type: 'close',
      endpoint,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      intentional
    });

    if (!intentional) {
      scheduleReconnect();
    }
  }

  function connect(): void {
    if (
      destroyed ||
      socket?.readyState === WEBSOCKET_CONNECTING ||
      socket?.readyState === WEBSOCKET_OPEN
    ) {
      return;
    }

    clearReconnect();
    intentionallyClosed = false;
    sessionId += 1;
    const currentSessionId = sessionId;

    dispatch({ type: 'connecting', endpoint });

    if (!WebSocketImpl) {
      emitError(createError('unsupported', 'Browser WebSocket support is not available.'));
      return;
    }

    try {
      socket = new WebSocketImpl(url);
    } catch {
      emitError(createError('network', 'Kodi WebSocket could not be constructed.'));
      return;
    }

    socket.onopen = () => handleOpen(currentSessionId);
    socket.onmessage = (event) => handleMessage(currentSessionId, event);
    socket.onerror = () => handleError(currentSessionId);
    socket.onclose = (event) => handleClose(currentSessionId, event);
    startConnectTimeout(currentSessionId);
  }

  function disconnect(): void {
    intentionallyClosed = true;
    clearReconnect();
    clearConnectTimeout();
    clearHeartbeat();

    const currentSocket = socket;
    if (!currentSocket) {
      return;
    }

    currentSocket.close(1000, 'Client disconnected.');
  }

  function destroy(): void {
    destroyed = true;
    intentionallyClosed = true;
    clearReconnect();
    clearConnectTimeout();
    clearHeartbeat();
    detachSocketHandlers(socket);
    socket?.close(1000, 'Client destroyed.');
    socket = null;
    listeners.clear();
  }

  function subscribe(listener: KodiWebSocketClientListener): KodiWebSocketUnsubscribe {
    if (destroyed) {
      return () => undefined;
    }

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function send(method: string, params?: unknown): KodiWebSocketSendResult {
    const currentSocket = socket;
    if (!currentSocket || currentSocket.readyState !== WEBSOCKET_OPEN) {
      const error = createError('not-open', 'Kodi WebSocket is not open.');
      emitError(error);
      return { ok: false, error };
    }

    const id = (requestId += 1);
    const request =
      params === undefined
        ? { jsonrpc: '2.0', id, method }
        : { jsonrpc: '2.0', id, method, params };

    try {
      currentSocket.send(JSON.stringify(request));
      return { ok: true, id };
    } catch {
      const error = createError('send-failed', 'Kodi WebSocket send failed.');
      emitError(error);
      scheduleReconnect();
      return { ok: false, error };
    }
  }

  return {
    connect,
    disconnect,
    destroy,
    subscribe,
    send
  };
}
