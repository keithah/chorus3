import { describe, expect, it, vi } from 'vitest';

import { KodiHttpClientError, type KodiHttpConnectionTestResult } from '$lib/kodi';
import { createConfigStore, type ConfigStore, type SavedKodiHostInput } from './config.svelte';
import {
  createHostConnectionStore,
  type HostConnectionStoreSnapshot
} from './hostConnection.svelte';
import type { KodiHttpHost, KodiJsonRpcHttpClient } from '$lib/kodi';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const kitchenHost: SavedKodiHostInput = {
  id: 'kitchen',
  label: 'Kitchen Kodi',
  host: 'kodi-kitchen.local',
  port: 8080,
  username: 'kodi',
  password: 'super-secret',
  useTls: false,
  useWebSocket: true
};

const denHost: SavedKodiHostInput = {
  id: 'den',
  label: 'Den Kodi',
  host: '192.168.1.40',
  useTls: false,
  useWebSocket: false
};

const healthyResult: KodiHttpConnectionTestResult = {
  ping: 'pong',
  jsonRpcVersion: { version: '2.0' },
  application: { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 55, muted: false }
};

function createConfigWithHosts(): ConfigStore {
  const configStore = createConfigStore();
  configStore.addHost(kitchenHost);
  configStore.addHost(denHost);
  return configStore;
}

function snapshot(store: { snapshot: HostConnectionStoreSnapshot }): HostConnectionStoreSnapshot {
  return store.snapshot;
}

describe('host connection store', () => {
  it('tests a saved host through the HTTP diagnostic client with safe observable status', async () => {
    const configStore = createConfigWithHosts();
    const httpHosts: KodiHttpHost[] = [];
    const httpClient: KodiJsonRpcHttpClient = { call: vi.fn() };
    const store = createHostConnectionStore({
      configStore,
      createHttpClient: vi.fn((host) => {
        httpHosts.push(host);
        return httpClient;
      }),
      testHttpConnection: vi.fn(async () => healthyResult)
    });

    await store.testHost('kitchen');

    expect(httpHosts).toEqual([
      {
        host: 'kodi-kitchen.local',
        port: 8080,
        username: 'kodi',
        password: 'super-secret',
        useTls: false
      }
    ]);
    expect(snapshot(store).hostTests.kitchen).toMatchObject({
      status: 'success',
      error: null,
      endpoint: {
        protocol: 'http:',
        host: 'kodi-kitchen.local',
        port: 8080,
        path: '/jsonrpc',
        timeoutMs: 5000,
        hasCredentials: true
      },
      kodiVersion: { major: 21, minor: 1 },
      applicationName: 'Kodi'
    });
    expect(JSON.stringify(snapshot(store))).not.toContain('super-secret');
  });

  it('stores safe HTTP failures without activating the failed host', async () => {
    const configStore = createConfigWithHosts();
    const connectionStore = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      destroy: vi.fn(),
      snapshot: { status: 'idle' }
    };
    const store = createHostConnectionStore({
      configStore,
      connectionStore,
      createHttpClient: vi.fn(() => ({ call: vi.fn() })),
      testHttpConnection: vi.fn(async () => {
        throw new KodiHttpClientError({
          code: 'auth',
          method: 'JSONRPC.Ping',
          endpoint: {
            protocol: 'http:',
            host: 'kodi-kitchen.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: true
          },
          status: 401,
          statusText: 'Unauthorized'
        });
      })
    });

    await store.testHost('kitchen');

    expect(snapshot(store).hostTests.kitchen).toMatchObject({
      status: 'failed',
      error: {
        source: 'http',
        code: 'auth',
        message: 'Kodi rejected the configured username or password while calling JSONRPC.Ping.',
        endpoint: { host: 'kodi-kitchen.local', hasCredentials: true }
      }
    });
    expect(configStore.snapshot.activeHostId).toBe('kitchen');
    expect(connectionStore.connect).not.toHaveBeenCalled();
    expect(JSON.stringify(snapshot(store))).not.toContain('super-secret');
  });

  it('suppresses stale test results when a host is edited or deleted before completion', async () => {
    const configStore = createConfigWithHosts();
    const first = deferred<KodiHttpConnectionTestResult>();
    const second = deferred<KodiHttpConnectionTestResult>();
    const results = [first.promise, second.promise];
    const store = createHostConnectionStore({
      configStore,
      createHttpClient: vi.fn(() => ({ call: vi.fn() })),
      testHttpConnection: vi.fn(() => results.shift() ?? Promise.resolve(healthyResult))
    });

    const staleTest = store.testHost('kitchen');
    configStore.updateHost('kitchen', { ...kitchenHost, label: 'Updated Kitchen' });
    first.resolve({
      ...healthyResult,
      application: { name: 'Stale Kodi', version: { major: 19 } }
    });
    await staleTest;

    expect(snapshot(store).hostTests.kitchen).toMatchObject({ status: 'testing' });

    const currentTest = store.testHost('kitchen');
    second.resolve(healthyResult);
    await currentTest;

    expect(snapshot(store).hostTests.kitchen).toMatchObject({
      status: 'success',
      applicationName: 'Kodi'
    });

    const deleted = deferred<KodiHttpConnectionTestResult>();
    results.push(deleted.promise);
    const deletedTest = store.testHost('den');
    configStore.deleteHost('den');
    deleted.resolve(healthyResult);
    await deletedTest;

    expect(snapshot(store).hostTests.den).toBeUndefined();
  });

  it('activates saved hosts through the connection store and disconnects when active host disappears', async () => {
    const configStore = createConfigWithHosts();
    const connectionStore = {
      connect: vi.fn(async () => undefined),
      disconnect: vi.fn(),
      destroy: vi.fn(),
      snapshot: { status: 'idle' }
    };
    const store = createHostConnectionStore({ configStore, connectionStore });

    await store.activateHost('den');

    expect(configStore.snapshot.activeHostId).toBe('den');
    expect(connectionStore.connect).toHaveBeenCalledWith({
      id: 'den',
      label: 'Den Kodi',
      host: '192.168.1.40',
      useTls: false,
      useWebSocket: false
    });
    expect(snapshot(store)).toMatchObject({
      activeHostId: 'den',
      activeHostSummary: { id: 'den', label: 'Den Kodi', host: '192.168.1.40', port: 8080 }
    });

    configStore.deleteHost('kitchen');
    configStore.deleteHost('den');
    store.syncActiveHost();

    expect(connectionStore.disconnect).toHaveBeenCalledTimes(1);
    expect(snapshot(store)).toMatchObject({
      activeHostId: null,
      activeHostSummary: null,
      controllerError: null
    });
  });

  it('refuses unknown active hosts with safe controller error state', async () => {
    const configStore = createConfigWithHosts();
    const connectionStore = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      destroy: vi.fn(),
      snapshot: { status: 'idle' }
    };
    const store = createHostConnectionStore({ configStore, connectionStore });

    await store.activateHost('missing');

    expect(connectionStore.connect).not.toHaveBeenCalled();
    expect(snapshot(store).controllerError).toEqual({
      source: 'config',
      code: 'unknown-host',
      message: 'Choose a saved Kodi host before connecting.'
    });
  });
});
