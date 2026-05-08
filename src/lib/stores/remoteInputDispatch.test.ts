import { describe, expect, it } from 'vitest';

import {
  KodiHttpClientError,
  type KodiJsonRpcHttpClient,
  type RemoteInputCommand
} from '$lib/kodi';
import { createRemoteInputDispatch } from './remoteInputDispatch.svelte';

type CallRecord = {
  method: string;
  params?: unknown;
};

class FakeKodiClient implements KodiJsonRpcHttpClient {
  readonly calls: CallRecord[] = [];
  readonly responses = new Map<string, unknown[]>();

  enqueue(method: string, response: unknown): void {
    this.responses.set(method, [...(this.responses.get(method) ?? []), response]);
  }

  async call<TResult>(method: string, params?: unknown): Promise<TResult> {
    this.calls.push(params === undefined ? { method } : { method, params });
    const queue = this.responses.get(method) ?? [];

    if (queue.length === 0) {
      throw new Error(`Unexpected Kodi call: ${method}`);
    }

    const response = queue.shift();
    this.responses.set(method, queue);

    if (response instanceof Error) {
      throw response;
    }

    return response as TResult;
  }
}

function createHarness(
  options: { client?: FakeKodiClient | null; createClientThrows?: unknown } = {}
) {
  const client = options.client === undefined ? new FakeKodiClient() : options.client;
  let createClientCalls = 0;
  const dispatch = createRemoteInputDispatch({
    createClient: () => {
      createClientCalls += 1;
      if (options.createClientThrows) {
        throw options.createClientThrows;
      }
      return client;
    },
    now: () => '2026-01-02T00:00:00.000Z'
  });

  return {
    client,
    dispatch,
    get createClientCalls() {
      return createClientCalls;
    }
  };
}

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local/jsonrpc');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('sessionStorage');
  expect(serialized).not.toContain('smb://');
  expect(serialized).not.toContain('special://');
  expect(serialized).not.toContain('RAW_RESPONSE_BODY');
}

describe('remote input dispatch', () => {
  it('starts with an inspectable idle command snapshot', () => {
    const { dispatch } = createHarness();

    expect(dispatch.snapshot).toEqual({
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    });
  });

  it('sends supported remote input commands through the curated Input wrapper', async () => {
    const { client, dispatch } = createHarness();
    client?.enqueue('Input.Left', 'OK');

    await dispatch.send('left');

    expect(client?.calls).toEqual([{ method: 'Input.Left' }]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'left',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
  });

  it('routes every supported command to exactly one zero-param Input method', async () => {
    const commandToMethod = [
      ['left', 'Input.Left'],
      ['up', 'Input.Up'],
      ['right', 'Input.Right'],
      ['down', 'Input.Down'],
      ['back', 'Input.Back'],
      ['select', 'Input.Select'],
      ['contextMenu', 'Input.ContextMenu'],
      ['info', 'Input.Info'],
      ['home', 'Input.Home']
    ] as const satisfies readonly (readonly [RemoteInputCommand, string])[];
    const { client, dispatch } = createHarness();

    for (const [, method] of commandToMethod) {
      client?.enqueue(method, 'OK');
    }

    for (const [command] of commandToMethod) {
      await dispatch.send(command);
    }

    expect(client?.calls).toEqual(commandToMethod.map(([, method]) => ({ method })));
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'home',
      lastError: null
    });
  });

  it('rejects malformed commands before creating or calling a Kodi client', async () => {
    const invalidCommands = ['', 'sendText', 'power', null, undefined, { command: 'left' }];

    for (const command of invalidCommands) {
      const { client, createClientCalls, dispatch } = createHarness();

      await dispatch.send(command as never);

      expect(createClientCalls).toBe(0);
      expect(client?.calls).toEqual([]);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'failed',
        lastCommand: null,
        lastCompletedAt: '2026-01-02T00:00:00.000Z',
        lastError: {
          source: 'input',
          code: 'input/unknown-remote-command'
        }
      });
      expectSecretSafe(dispatch.snapshot);
    }
  });

  it('sends text to Kodi without storing the submitted text in diagnostics', async () => {
    const { client, dispatch } = createHarness();
    client?.enqueue('Input.SendText', 'OK');

    await dispatch.sendText('admin:p@ssword');

    expect(client?.calls).toEqual([
      { method: 'Input.SendText', params: { text: 'admin:p@ssword' } }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'sendText',
      lastError: null,
      lastCompletedAt: '2026-01-02T00:00:00.000Z'
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('sends supported execute actions through Input.ExecuteAction', async () => {
    const { client, dispatch } = createHarness();
    client?.enqueue('Input.ExecuteAction', 'OK');

    await dispatch.executeAction('showsubtitles');

    expect(client?.calls).toEqual([
      { method: 'Input.ExecuteAction', params: { action: 'showsubtitles' } }
    ]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'success',
      lastCommand: 'executeAction',
      lastError: null
    });
  });

  it('rejects malformed text and execute actions before calling Kodi', async () => {
    for (const text of ['', 'x'.repeat(1001)]) {
      const { client, dispatch, createClientCalls } = createHarness();
      await dispatch.sendText(text);
      expect(createClientCalls).toBe(0);
      expect(client?.calls).toEqual([]);
      expect(dispatch.snapshot).toMatchObject({
        commandStatus: 'failed',
        lastCommand: 'sendText',
        lastError: { source: 'input', code: 'input/invalid-text' }
      });
    }

    const { client, dispatch, createClientCalls } = createHarness();
    await dispatch.executeAction('powerdown' as never);
    expect(createClientCalls).toBe(0);
    expect(client?.calls).toEqual([]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'failed',
      lastCommand: 'executeAction',
      lastError: { source: 'input', code: 'input/unknown-remote-action' }
    });
  });

  it('reports missing active-host client state without Kodi calls', async () => {
    const harness = createHarness({ client: null });

    await harness.dispatch.send('select');

    expect(harness.createClientCalls).toBe(1);
    expect(harness.dispatch.snapshot).toMatchObject({
      commandStatus: 'failed',
      lastCommand: 'select',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'config',
        code: 'config/no-active-host'
      }
    });
    expectSecretSafe(harness.dispatch.snapshot);
  });

  it('sanitizes active client creation failures without calling Kodi', async () => {
    const harness = createHarness({
      client: null,
      createClientThrows: new Error(
        'client failed for Authorization: Basic token at http://admin:p@ssword@kodi.local/jsonrpc from localStorage and smb://nas/leak.mkv RAW_RESPONSE_BODY'
      )
    });

    await harness.dispatch.send('info');

    expect(harness.createClientCalls).toBe(1);
    expect(harness.dispatch.snapshot).toMatchObject({
      commandStatus: 'failed',
      lastCommand: 'info',
      lastError: {
        source: 'command',
        code: 'command/failed'
      }
    });
    expectSecretSafe(harness.dispatch.snapshot);
  });

  it('sanitizes Kodi HTTP client errors with only safe endpoint details', async () => {
    const { client, dispatch } = createHarness();
    client?.enqueue(
      'Input.Back',
      new KodiHttpClientError({
        code: 'timeout',
        method: 'Input.Back',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        },
        timeoutMs: 5000
      })
    );

    await dispatch.send('back');

    expect(client?.calls).toEqual([{ method: 'Input.Back' }]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'failed',
      lastCommand: 'back',
      lastCompletedAt: '2026-01-02T00:00:00.000Z',
      lastError: {
        source: 'http',
        code: 'timeout',
        message: 'Kodi request timed out after 5000ms while calling Input.Back.',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        }
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('sanitizes generic and malformed response errors without raw body leakage', async () => {
    const { client, dispatch } = createHarness();
    client?.enqueue(
      'Input.Home',
      new Error(
        'Malformed JSON-RPC envelope RAW_RESPONSE_BODY Authorization: Basic token http://admin:p@ssword@kodi.local/jsonrpc special://profile/leak localStorage'
      )
    );

    await dispatch.send('home');

    expect(client?.calls).toEqual([{ method: 'Input.Home' }]);
    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'failed',
      lastCommand: 'home',
      lastError: {
        source: 'command',
        code: 'command/failed'
      }
    });
    expectSecretSafe(dispatch.snapshot);
  });

  it('returns clone-safe snapshots so consumers cannot mutate dispatch state', async () => {
    const { client, dispatch } = createHarness();
    client?.enqueue(
      'Input.Info',
      new KodiHttpClientError({
        code: 'network',
        method: 'Input.Info',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: false
        }
      })
    );

    await dispatch.send('info');

    const snapshot = dispatch.snapshot;
    snapshot.commandStatus = 'success';
    snapshot.lastCommand = 'left';
    if (snapshot.lastError?.endpoint) {
      snapshot.lastError.endpoint.host = 'mutated.example';
    }

    expect(dispatch.snapshot).toMatchObject({
      commandStatus: 'failed',
      lastCommand: 'info',
      lastError: {
        endpoint: { host: 'kodi.local' }
      }
    });
  });
});
