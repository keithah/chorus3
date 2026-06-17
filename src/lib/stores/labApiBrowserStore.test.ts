import { describe, expect, it, vi } from 'vitest';

import type { KodiJsonRpcHttpClient, JsonRpcIntrospectionResult } from '$lib/kodi';
import {
  createLabApiBrowserStore,
  type LabApiBrowserStoreMethods
} from './labApiBrowser.svelte.ts';

const INTROSPECTION: JsonRpcIntrospectionResult = {
  methods: {
    'Player.Open': {
      description: 'Open media',
      params: [{ name: 'item', required: true, type: 'object' }],
      returns: { type: 'string' }
    },
    'JSONRPC.Ping': {
      description: 'Ping Kodi',
      params: [],
      returns: { type: 'string' }
    },
    'VideoLibrary.GetMovies': {
      description: 'List movies',
      params: [{ name: 'properties', type: 'array' }],
      returns: { type: 'object' }
    },
    'System.Shutdown': {
      description: 'Shutdown system',
      params: [],
      returns: { type: 'string' }
    }
  }
};

const MALFORMED_INTROSPECTION = { methods: null } as never;

function createClient(): KodiJsonRpcHttpClient {
  return { call: vi.fn() };
}

function createMethods(overrides: Partial<LabApiBrowserStoreMethods> = {}) {
  const calls: Array<{ method: string; params?: Record<string, unknown> }> = [];
  const methods: LabApiBrowserStoreMethods = {
    async getJsonRpcIntrospection() {
      calls.push({ method: 'JSONRPC.Introspect' });
      return INTROSPECTION;
    },
    async callJsonRpc(_client, method, params) {
      calls.push({ method, params });
      return { ok: true, method, params };
    },
    ...overrides
  };
  return { calls, methods };
}

function makeStore(overrides: Partial<LabApiBrowserStoreMethods> = {}) {
  const { calls, methods } = createMethods(overrides);
  const store = createLabApiBrowserStore({
    createClient: () => createClient(),
    methods,
    now: () => '2026-05-01T23:00:00.000Z'
  });
  return { calls, store };
}

function expectNoForbiddenText(value: unknown) {
  expect(JSON.stringify(value)).not.toMatch(
    /https?:\/\/|smb:\/\/|file:\/\/|special:\/\/|Authorization|Basic|Bearer|admin:p@ssword|super-secret-password|SENTINEL_SECRET|CHORUS3_SENTINEL_SECRET|localStorage|sessionStorage|\/home\/|\/Users\/|raw\s+(body|payload|response)|password|token|secret/i
  );
}

describe('LabApiBrowserStore', () => {
  it('loads and normalizes introspection into sorted namespaces and redacted clone-safe metadata', async () => {
    const { calls, store } = makeStore();

    await store.loadIntrospection();

    expect(store.snapshot.introspectionStatus).toBe('success');
    expect(store.snapshot.namespaces.map((namespace) => namespace.name)).toEqual([
      'JSONRPC',
      'Player',
      'System',
      'VideoLibrary'
    ]);
    expect(store.snapshot.methods.map((method) => method.name)).toEqual([
      'JSONRPC.Ping',
      'Player.Open',
      'System.Shutdown',
      'VideoLibrary.GetMovies'
    ]);
    expect(store.snapshot.methods.find((method) => method.name === 'JSONRPC.Ping')).toMatchObject({
      namespace: 'JSONRPC',
      shortName: 'Ping',
      guard: { level: 'safe', requiresConfirmation: false, blocked: false }
    });
    expect(store.snapshot.methods.find((method) => method.name === 'Player.Open')).toMatchObject({
      guard: { level: 'confirmation-required', requiresConfirmation: true, blocked: false }
    });
    expect(
      store.snapshot.methods.find((method) => method.name === 'System.Shutdown')
    ).toMatchObject({
      guard: { level: 'blocked', requiresConfirmation: false, blocked: true }
    });
    expect(calls).toEqual([{ method: 'JSONRPC.Introspect' }]);

    const leaked = store.snapshot;
    expect(store.snapshot).toBe(leaked);
    expect(Object.isFrozen(leaked.methods[0])).toBe(true);
    expect(() => {
      leaked.methods[0].name = 'Mutated.Outside';
    }).toThrow(TypeError);
    expect(() => {
      leaked.namespaces[0].methods.length = 0;
    }).toThrow(TypeError);
    expect(store.snapshot.methods[0].name).toBe('JSONRPC.Ping');
    expect(store.snapshot.namespaces[0].methods).toHaveLength(1);
    expectNoForbiddenText(store.snapshot);
  });

  it('handles no active host, malformed introspection, empty introspection, errors, and stale introspection responses', async () => {
    const noHostStore = createLabApiBrowserStore({ createClient: () => null });
    await noHostStore.loadIntrospection();
    expect(noHostStore.snapshot.introspectionStatus).toBe('error');
    expect(noHostStore.snapshot.lastError?.code).toBe('config/no-active-host');

    const { store: malformedStore } = makeStore({
      async getJsonRpcIntrospection() {
        return MALFORMED_INTROSPECTION;
      }
    });
    await malformedStore.loadIntrospection();
    expect(malformedStore.snapshot.introspectionStatus).toBe('error');
    expect(malformedStore.snapshot.lastError?.code).toBe('introspection/malformed-response');

    const { store: emptyStore } = makeStore({
      async getJsonRpcIntrospection() {
        return { methods: {} };
      }
    });
    await emptyStore.loadIntrospection();
    expect(emptyStore.snapshot.introspectionStatus).toBe('success');
    expect(emptyStore.snapshot.methods).toEqual([]);
    expect(emptyStore.snapshot.namespaces).toEqual([]);

    const { store: errorStore } = makeStore({
      async getJsonRpcIntrospection() {
        throw new Error(
          'failed at http://admin:p@ssword@kodi.local/jsonrpc with raw response SENTINEL_SECRET'
        );
      }
    });
    await errorStore.loadIntrospection();
    expect(errorStore.snapshot.introspectionStatus).toBe('error');
    expect(errorStore.snapshot.lastError?.code).toBe('introspection/failed');
    expectNoForbiddenText(errorStore.snapshot);

    let resolveFirst: (() => void) | null = null;
    let delayedOnce = false;
    const { store: staleStore } = makeStore({
      async getJsonRpcIntrospection() {
        if (!delayedOnce) {
          delayedOnce = true;
          await new Promise<void>((resolve) => {
            resolveFirst = resolve;
          });
          return { methods: { 'Application.GetProperties': {} } };
        }
        return { methods: { 'JSONRPC.Ping': {} } };
      }
    });
    const firstLoad = staleStore.loadIntrospection();
    await vi.waitFor(() => expect(resolveFirst).toBeTypeOf('function'));
    const secondLoad = staleStore.loadIntrospection();
    if (!resolveFirst) throw new Error('Expected first introspection request to be pending.');
    const resolveIntrospection = resolveFirst as () => void;
    resolveIntrospection();
    await Promise.all([firstLoad, secondLoad]);
    expect(staleStore.snapshot.methods.map((method) => method.name)).toEqual(['JSONRPC.Ping']);
  });

  it('runs safe calls, records redacted raw request/response snapshots, and rejects malformed params before calling', async () => {
    const { calls, store } = makeStore({
      async callJsonRpc(_client, method, params) {
        calls.push({ method, params });
        return {
          ok: true,
          url: 'http://admin:p@ssword@kodi.local/jsonrpc',
          result: { file: '/Users/keith/Movies/secret.mkv', visible: 'kept' }
        };
      }
    });
    await store.loadIntrospection();
    store.selectMethod('VideoLibrary.GetMovies');
    store.setParamsText('{"properties":["title"],"limits":{"start":0,"end":5}}');

    await store.runSelectedMethod();

    expect(store.snapshot.callStatus).toBe('success');
    expect(store.snapshot.lastCall).toMatchObject({
      method: 'VideoLibrary.GetMovies',
      guardLevel: 'safe',
      requestedAt: '2026-05-01T23:00:00.000Z',
      completedAt: '2026-05-01T23:00:00.000Z'
    });
    expect(store.snapshot.rawRequestJson).toContain('VideoLibrary.GetMovies');
    expect(store.snapshot.rawResponseJson).toContain('visible');
    expectNoForbiddenText(store.snapshot);
    expect(calls.filter((call) => call.method === 'VideoLibrary.GetMovies')).toEqual([
      {
        method: 'VideoLibrary.GetMovies',
        params: { properties: ['title'], limits: { start: 0, end: 5 } }
      }
    ]);

    store.setParamsText('{not valid');
    await store.runSelectedMethod();
    expect(store.snapshot.callStatus).toBe('error');
    expect(store.snapshot.validationError).toBe('Params must be valid JSON object text.');
    expect(calls.filter((call) => call.method === 'VideoLibrary.GetMovies')).toHaveLength(1);

    store.setParamsText('["array-is-not-accepted"]');
    await store.runSelectedMethod();
    expect(store.snapshot.validationError).toBe(
      'Params must be a JSON object, not an array or scalar.'
    );
    expect(calls.filter((call) => call.method === 'VideoLibrary.GetMovies')).toHaveLength(1);
  });

  it('requires explicit confirmation for mutating methods and resets confirmation when params change', async () => {
    const { calls, store } = makeStore();
    await store.loadIntrospection();
    store.selectMethod('Player.Open');
    store.setParamsText('{"item":{"songid":1}}');

    await store.runSelectedMethod();

    expect(store.snapshot.callStatus).toBe('needs-confirmation');
    expect(store.snapshot.confirmation).toMatchObject({ method: 'Player.Open', confirmed: false });
    expect(calls.filter((call) => call.method === 'Player.Open')).toHaveLength(0);

    store.confirmSelectedMethod();
    await store.runSelectedMethod();
    expect(store.snapshot.callStatus).toBe('success');
    expect(calls.filter((call) => call.method === 'Player.Open')).toHaveLength(1);

    store.setParamsText('{"item":{"songid":2}}');
    await store.runSelectedMethod();
    expect(store.snapshot.callStatus).toBe('needs-confirmation');
    expect(calls.filter((call) => call.method === 'Player.Open')).toHaveLength(1);
  });

  it('blocks destructive methods and unknown methods without calling the client', async () => {
    const { calls, store } = makeStore();
    await store.loadIntrospection();

    store.selectMethod('System.Shutdown');
    await store.runSelectedMethod();
    expect(store.snapshot.callStatus).toBe('blocked');
    expect(store.snapshot.guardDecision).toMatchObject({ level: 'blocked', blocked: true });

    store.selectMethod('VideoLibrary.RefreshTVShow');
    await store.runSelectedMethod();
    expect(store.snapshot.callStatus).toBe('error');
    expect(store.snapshot.lastError?.code).toBe('validation/unknown-method');
    expect(calls.filter((call) => call.method !== 'JSONRPC.Introspect')).toHaveLength(0);
  });

  it('handles no host, rejected calls, malformed responses, hostile secrets, and stale call responses safely', async () => {
    const noHostStore = createLabApiBrowserStore({
      createClient: () => null,
      methods: createMethods().methods
    });
    noHostStore.selectMethod('JSONRPC.Ping');
    await noHostStore.runSelectedMethod();
    expect(noHostStore.snapshot.callStatus).toBe('error');
    expect(noHostStore.snapshot.lastError?.code).toBe('config/no-active-host');

    const { store: rejectingStore } = makeStore({
      async callJsonRpc() {
        throw new Error(
          'Authorization: Basic SENTINEL_SECRET failed for smb://nas/media/movie.mkv raw payload'
        );
      }
    });
    await rejectingStore.loadIntrospection();
    rejectingStore.selectMethod('JSONRPC.Ping');
    await rejectingStore.runSelectedMethod();
    expect(rejectingStore.snapshot.callStatus).toBe('error');
    expect(rejectingStore.snapshot.rawErrorJson).toContain('[redacted]');
    expectNoForbiddenText(rejectingStore.snapshot);

    const { store: malformedStore } = makeStore({
      async callJsonRpc() {
        return undefined;
      }
    });
    await malformedStore.loadIntrospection();
    malformedStore.selectMethod('JSONRPC.Ping');
    await malformedStore.runSelectedMethod();
    expect(malformedStore.snapshot.callStatus).toBe('error');
    expect(malformedStore.snapshot.lastError?.code).toBe('call/malformed-response');

    let resolveFirst: ((value: unknown) => void) | null = null;
    let delayedOnce = false;
    const { store: staleStore } = makeStore({
      async callJsonRpc(_client, method, params) {
        if (!delayedOnce) {
          delayedOnce = true;
          return await new Promise((resolve) => {
            resolveFirst = resolve;
          });
        }
        return { fresh: true, method, params };
      }
    });
    await staleStore.loadIntrospection();
    staleStore.selectMethod('JSONRPC.Ping');
    const firstRun = staleStore.runSelectedMethod();
    await vi.waitFor(() => expect(resolveFirst).toBeTypeOf('function'));
    const secondRun = staleStore.runSelectedMethod();
    if (!resolveFirst) throw new Error('Expected first call request to be pending.');
    const resolveCall = resolveFirst as (value: unknown) => void;
    resolveCall({ stale: true });
    await Promise.all([firstRun, secondRun]);
    expect(staleStore.snapshot.callStatus).toBe('success');
    expect(staleStore.snapshot.rawResponseJson).toContain('fresh');
    expect(staleStore.snapshot.rawResponseJson).not.toContain('stale');
  });
});
