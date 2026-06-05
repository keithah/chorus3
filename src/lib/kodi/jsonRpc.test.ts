import { describe, expect, it, vi, type Mock } from 'vitest';

import { buildBasicAuthHeader } from './host';
import {
  KodiHttpClientError,
  createKodiJsonRpcHttpClient,
  getKodiHttpClientErrorMessage,
  isKodiHttpClientError,
  type KodiHttpClientOptions
} from './jsonRpc';

const SECRET_PASSWORD = 'super-secret-password';
const AUTH_HEADER = buildBasicAuthHeader('media-user', SECRET_PASSWORD);

type FetchImpl = NonNullable<KodiHttpClientOptions['fetchImpl']>;
type FetchMock = Mock<FetchImpl>;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

function createFetchMock(response: Response): FetchMock {
  return vi.fn<FetchImpl>().mockResolvedValue(response);
}

function expectSecretSafe(error: KodiHttpClientError): void {
  const serialized = JSON.stringify({
    message: error.message,
    details: error.details,
    userMessage: getKodiHttpClientErrorMessage(error)
  });

  expect(serialized).not.toContain(SECRET_PASSWORD);
  expect(serialized).not.toContain(AUTH_HEADER);
  expect(serialized).not.toContain('Authorization');
}

describe('Kodi JSON-RPC HTTP client', () => {
  it('posts a JSON-RPC 2.0 request and unwraps the typed result', async () => {
    const fetchImpl = createFetchMock(
      jsonResponse({ jsonrpc: '2.0', id: 1, result: { version: { major: 21 } } })
    );
    const client = createKodiJsonRpcHttpClient(
      { host: 'kodi.local', username: 'media-user', password: SECRET_PASSWORD },
      { fetchImpl }
    );

    const result = await client.call<{ version: { major: number } }, { properties: string[] }>(
      'Application.GetProperties',
      { properties: ['version'] }
    );

    expect(result.version.major).toBe(21);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('http://kodi.local:8080/jsonrpc');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toBeInstanceOf(Headers);
    expect((init?.headers as Headers).get('Accept')).toBe('application/json');
    expect((init?.headers as Headers).get('Content-Type')).toBe('application/json');
    expect((init?.headers as Headers).get('Authorization')).toBe(AUTH_HEADER);
    expect(JSON.parse(String(init?.body))).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'Application.GetProperties',
      params: { properties: ['version'] }
    });
  });

  it('omits params when none are provided and increments request ids', async () => {
    const fetchImpl = vi
      .fn<FetchImpl>()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 2, result: 'pong-again' }));
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(client.call<string>('JSONRPC.Ping')).resolves.toBe('pong');
    await expect(client.call<string>('JSONRPC.Ping')).resolves.toBe('pong-again');

    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body))).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'JSONRPC.Ping'
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[1][1]?.body))).toMatchObject({ id: 2 });
  });

  it('posts JSON-RPC batches and returns results in request order', async () => {
    const fetchImpl = createFetchMock(
      jsonResponse([
        { jsonrpc: '2.0', id: 2, result: 'second' },
        { jsonrpc: '2.0', id: 1, result: 'first' }
      ])
    );
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(
      client.callBatch?.([
        { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 10 } } },
        { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 11 } } }
      ])
    ).resolves.toEqual(['first', 'second']);

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body))).toEqual([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'Playlist.Add',
        params: { playlistid: 1, item: { episodeid: 10 } }
      },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'Playlist.Add',
        params: { playlistid: 1, item: { episodeid: 11 } }
      }
    ]);
  });

  it('classifies a JSON-RPC error inside a batch against the failed method', async () => {
    const fetchImpl = createFetchMock(
      jsonResponse([
        { jsonrpc: '2.0', id: 1, result: 'OK' },
        { jsonrpc: '2.0', id: 2, error: { code: -32602, message: 'Invalid params' } }
      ])
    );
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(
      client.callBatch?.([
        { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 10 } } },
        { method: 'Player.Open', params: { item: { playlistid: 1 } } }
      ])
    ).rejects.toMatchObject({
      code: 'json-rpc-error',
      method: 'Player.Open',
      jsonRpcError: { code: -32602, message: 'Invalid params' }
    });
  });

  it('does not send an HTTP request for empty batches', async () => {
    const fetchImpl = createFetchMock(jsonResponse([]));
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(client.callBatch?.([])).resolves.toEqual([]);

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('turns Kodi JSON-RPC error envelopes into typed safe errors', async () => {
    const fetchImpl = createFetchMock(
      jsonResponse({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32601, message: 'Method not found', data: { nested: true } }
      })
    );
    const client = createKodiJsonRpcHttpClient(
      { host: 'kodi.local', username: 'media-user', password: SECRET_PASSWORD },
      { fetchImpl }
    );

    await expect(client.call('Player.Nope')).rejects.toMatchObject({
      code: 'json-rpc-error',
      method: 'Player.Nope',
      jsonRpcError: { code: -32601, message: 'Method not found' }
    });

    try {
      await client.call('Player.Nope');
    } catch (error) {
      expect(isKodiHttpClientError(error)).toBe(true);
      expectSecretSafe(error as KodiHttpClientError);
    }
  });

  it.each([
    [401, 'Unauthorized', 'auth'],
    [403, 'Forbidden', 'auth'],
    [500, 'Internal Server Error', 'http']
  ] as const)('classifies HTTP %s as %s', async (status, statusText, code) => {
    const fetchImpl = createFetchMock(jsonResponse({ ok: false }, { status, statusText }));
    const client = createKodiJsonRpcHttpClient(
      { host: 'kodi.local', username: 'media-user', password: SECRET_PASSWORD },
      { fetchImpl }
    );

    await expect(client.call('JSONRPC.Ping')).rejects.toMatchObject({
      code,
      status,
      statusText,
      method: 'JSONRPC.Ping'
    });

    try {
      await client.call('JSONRPC.Ping');
    } catch (error) {
      expectSecretSafe(error as KodiHttpClientError);
    }
  });

  it('classifies fetch rejections as network failures without leaking raw messages', async () => {
    const fetchImpl = vi
      .fn<FetchImpl>()
      .mockRejectedValue(new Error(`connect failed with ${SECRET_PASSWORD}`));
    const client = createKodiJsonRpcHttpClient(
      { host: 'kodi.local', username: 'media-user', password: SECRET_PASSWORD },
      { fetchImpl }
    );

    await expect(client.call('JSONRPC.Ping')).rejects.toMatchObject({
      code: 'network',
      method: 'JSONRPC.Ping'
    });

    try {
      await client.call('JSONRPC.Ping');
    } catch (error) {
      expect(getKodiHttpClientErrorMessage(error as KodiHttpClientError)).toContain(
        'Could not reach Kodi'
      );
      expectSecretSafe(error as KodiHttpClientError);
    }
  });

  it('retries transient failures once for idempotent read calls', async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchImpl = vi
      .fn<FetchImpl>()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'pong' }));
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    const pending = client.call<string>('JSONRPC.Ping');
    await vi.advanceTimersByTimeAsync(99);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toBe('pong');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    randomSpy.mockRestore();
    vi.useRealTimers();
  });

  it('does not retry write-shaped calls after transient failures', async () => {
    const fetchImpl = vi
      .fn<FetchImpl>()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: 'ok' }));
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(client.call('Playlist.Add')).rejects.toMatchObject({
      code: 'network',
      method: 'Playlist.Add'
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('aborts hanging fetches on client timeout and clears timers', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fetchImpl = vi.fn<FetchImpl>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation timed out.', 'AbortError'));
          });
        })
    );
    const client = createKodiJsonRpcHttpClient(
      { host: 'kodi.local', timeoutMs: 25, username: 'media-user', password: SECRET_PASSWORD },
      { fetchImpl }
    );

    const pending = client.call('JSONRPC.Ping', undefined, { retryAttempts: 0 });
    const capturedError: Promise<KodiHttpClientError> = pending.then(
      () => {
        throw new Error('Expected timeout failure.');
      },
      (error: unknown) => error as KodiHttpClientError
    );
    const timeoutAssertion = expect(pending).rejects.toMatchObject({
      code: 'timeout',
      timeoutMs: 25,
      method: 'JSONRPC.Ping'
    });

    await vi.advanceTimersByTimeAsync(25);

    await timeoutAssertion;
    expectSecretSafe(await capturedError);
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('classifies caller-provided aborts separately from client timeouts', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn<FetchImpl>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Caller aborted.', 'AbortError'));
          });
        })
    );
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    const pending = client.call('JSONRPC.Ping', undefined, { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({
      code: 'network',
      method: 'JSONRPC.Ping'
    });
  });

  it('classifies invalid JSON responses', async () => {
    const fetchImpl = createFetchMock(
      new Response('{not json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(client.call('JSONRPC.Ping')).rejects.toMatchObject({
      code: 'invalid-json',
      method: 'JSONRPC.Ping'
    });
  });

  it.each([
    ['success without result', { jsonrpc: '2.0', id: 1 }],
    ['wrong jsonrpc version', { jsonrpc: '1.0', id: 1, result: 'pong' }],
    ['neither result nor error', { jsonrpc: '2.0', id: 1, foo: 'bar' }],
    ['non-object JSON', 'pong']
  ])('classifies malformed envelopes: %s', async (_name, envelope) => {
    const fetchImpl = createFetchMock(jsonResponse(envelope));
    const client = createKodiJsonRpcHttpClient({ host: 'kodi.local' }, { fetchImpl });

    await expect(client.call('JSONRPC.Ping')).rejects.toMatchObject({
      code: 'malformed-response',
      method: 'JSONRPC.Ping'
    });
  });
});
