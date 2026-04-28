import {
  buildKodiJsonRpcHttpUrl,
  buildKodiRequestHeaders,
  describeKodiEndpoint,
  normalizeKodiHttpHost,
  type KodiEndpointDescription,
  type KodiHttpHost
} from './host';

export type JsonRpcId = number | string | null;
export type JsonRpcParams = Record<string, unknown> | unknown[];

export interface JsonRpcRequest<TParams extends JsonRpcParams = JsonRpcParams> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: TParams;
}

export interface JsonRpcSuccess<TResult = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: TResult;
}

export interface JsonRpcError {
  code: number;
  message: string;
}

export interface JsonRpcFailure {
  jsonrpc: '2.0';
  id: JsonRpcId;
  error: JsonRpcError;
}

export type KodiHttpClientErrorCode =
  | 'timeout'
  | 'network'
  | 'auth'
  | 'http'
  | 'invalid-json'
  | 'malformed-response'
  | 'json-rpc-error';

export interface KodiHttpClientErrorDetails {
  endpoint: KodiEndpointDescription;
  method: string;
  status?: number;
  statusText?: string;
  timeoutMs?: number;
  jsonRpcError?: JsonRpcError;
}

interface KodiHttpClientErrorInit {
  code: KodiHttpClientErrorCode;
  method: string;
  endpoint: KodiEndpointDescription;
  status?: number;
  statusText?: string;
  timeoutMs?: number;
  jsonRpcError?: JsonRpcError;
}

export class KodiHttpClientError extends Error {
  readonly code: KodiHttpClientErrorCode;
  readonly endpoint: KodiEndpointDescription;
  readonly method: string;
  readonly status?: number;
  readonly statusText?: string;
  readonly timeoutMs?: number;
  readonly jsonRpcError?: JsonRpcError;
  readonly details: KodiHttpClientErrorDetails;

  constructor(init: KodiHttpClientErrorInit) {
    super(createKodiHttpClientErrorMessage(init));
    this.name = 'KodiHttpClientError';
    this.code = init.code;
    this.endpoint = init.endpoint;
    this.method = init.method;
    this.status = init.status;
    this.statusText = init.statusText;
    this.timeoutMs = init.timeoutMs;
    this.jsonRpcError = init.jsonRpcError;
    this.details = buildErrorDetails(init);
  }
}

export interface KodiHttpClientOptions {
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface KodiHttpCallOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface KodiJsonRpcHttpClient {
  call<TResult, TParams extends JsonRpcParams = JsonRpcParams>(
    method: string,
    params?: TParams,
    options?: KodiHttpCallOptions
  ): Promise<TResult>;
}

const TIMEOUT_SENTINEL = Symbol('kodi-timeout');

export function isKodiHttpClientError(error: unknown): error is KodiHttpClientError {
  return error instanceof KodiHttpClientError;
}

export function getKodiHttpClientErrorMessage(error: KodiHttpClientError): string {
  return error.message;
}

export function createKodiJsonRpcHttpClient(
  hostConfig: KodiHttpHost,
  options: KodiHttpClientOptions = {}
): KodiJsonRpcHttpClient {
  const host = normalizeKodiHttpHost(hostConfig);
  const endpoint = describeKodiEndpoint(host);
  const url = buildKodiJsonRpcHttpUrl(host).toString();
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  let nextId = 1;

  return {
    async call<TResult, TParams extends JsonRpcParams = JsonRpcParams>(
      method: string,
      params?: TParams,
      callOptions: KodiHttpCallOptions = {}
    ): Promise<TResult> {
      const requestId = nextId++;
      const request = buildJsonRpcRequest(method, requestId, params);
      const timeoutMs = callOptions.timeoutMs ?? host.timeoutMs;
      const controller = new AbortController();
      let didTimeout = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const abortFromCaller = (): void => {
        controller.abort();
      };

      if (callOptions.signal?.aborted) {
        controller.abort();
      } else {
        callOptions.signal?.addEventListener('abort', abortFromCaller, { once: true });
      }

      try {
        if (!fetchImpl) {
          throw createClientError({ code: 'network', endpoint, method });
        }

        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          timeoutId = setTimeout(() => {
            didTimeout = true;
            controller.abort();
            reject(TIMEOUT_SENTINEL);
          }, timeoutMs);
        });

        const response = await Promise.race([
          fetchImpl(url, {
            method: 'POST',
            headers: buildKodiRequestHeaders(host),
            body: JSON.stringify(request),
            signal: controller.signal
          }),
          timeoutPromise
        ]);

        if (!response.ok) {
          throw createClientError({
            code: response.status === 401 || response.status === 403 ? 'auth' : 'http',
            endpoint,
            method,
            status: response.status,
            statusText: response.statusText
          });
        }

        const envelope = await parseJson(response, endpoint, method);

        return unwrapJsonRpcEnvelope<TResult>(envelope, requestId, endpoint, method);
      } catch (error) {
        if (isKodiHttpClientError(error)) {
          throw error;
        }

        if (error === TIMEOUT_SENTINEL || didTimeout) {
          throw createClientError({ code: 'timeout', endpoint, method, timeoutMs });
        }

        throw createClientError({ code: 'network', endpoint, method });
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        callOptions.signal?.removeEventListener('abort', abortFromCaller);
      }
    }
  };
}

function buildJsonRpcRequest<TParams extends JsonRpcParams>(
  method: string,
  id: number,
  params: TParams | undefined
): JsonRpcRequest<TParams> {
  return params === undefined
    ? { jsonrpc: '2.0', id, method }
    : { jsonrpc: '2.0', id, method, params };
}

async function parseJson(
  response: Response,
  endpoint: KodiEndpointDescription,
  method: string
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw createClientError({ code: 'invalid-json', endpoint, method });
  }
}

function unwrapJsonRpcEnvelope<TResult>(
  envelope: unknown,
  requestId: JsonRpcId,
  endpoint: KodiEndpointDescription,
  method: string
): TResult {
  if (!isRecord(envelope) || envelope.jsonrpc !== '2.0' || envelope.id !== requestId) {
    throw createClientError({ code: 'malformed-response', endpoint, method });
  }

  const hasResult = Object.prototype.hasOwnProperty.call(envelope, 'result');
  const hasError = Object.prototype.hasOwnProperty.call(envelope, 'error');

  if (hasResult === hasError) {
    throw createClientError({ code: 'malformed-response', endpoint, method });
  }

  if (hasError) {
    const jsonRpcError = parseJsonRpcError(envelope.error);

    if (!jsonRpcError) {
      throw createClientError({ code: 'malformed-response', endpoint, method });
    }

    throw createClientError({ code: 'json-rpc-error', endpoint, method, jsonRpcError });
  }

  return envelope.result as TResult;
}

function parseJsonRpcError(error: unknown): JsonRpcError | null {
  if (!isRecord(error) || typeof error.code !== 'number' || typeof error.message !== 'string') {
    return null;
  }

  return {
    code: error.code,
    message: error.message
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createClientError(init: KodiHttpClientErrorInit): KodiHttpClientError {
  return new KodiHttpClientError(init);
}

function buildErrorDetails(init: KodiHttpClientErrorInit): KodiHttpClientErrorDetails {
  return {
    endpoint: init.endpoint,
    method: init.method,
    ...(init.status === undefined ? {} : { status: init.status }),
    ...(init.statusText === undefined ? {} : { statusText: init.statusText }),
    ...(init.timeoutMs === undefined ? {} : { timeoutMs: init.timeoutMs }),
    ...(init.jsonRpcError === undefined ? {} : { jsonRpcError: init.jsonRpcError })
  };
}

function createKodiHttpClientErrorMessage(init: KodiHttpClientErrorInit): string {
  switch (init.code) {
    case 'timeout':
      return `Kodi did not respond to ${init.method} within ${init.timeoutMs}ms.`;
    case 'network':
      return `Could not reach Kodi while calling ${init.method}. Check that Kodi is online and reachable.`;
    case 'auth':
      return `Kodi rejected the configured username or password while calling ${init.method}.`;
    case 'http':
      return `Kodi returned HTTP ${init.status ?? 'error'} while calling ${init.method}.`;
    case 'invalid-json':
      return `Kodi returned a response that was not valid JSON while calling ${init.method}.`;
    case 'malformed-response':
      return `Kodi returned an unexpected JSON-RPC response while calling ${init.method}.`;
    case 'json-rpc-error':
      return `Kodi JSON-RPC error ${init.jsonRpcError?.code ?? 'unknown'} while calling ${init.method}: ${
        init.jsonRpcError?.message ?? 'Unknown Kodi error'
      }.`;
  }
}
