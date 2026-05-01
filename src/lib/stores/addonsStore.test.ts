import { describe, expect, it, vi } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createAddonsStore, type AddonsStoreMethods } from './addonsStore.svelte.ts';

type Call = { method: string; args: unknown[] };

const ADDONS_RESPONSE = {
  addons: [
    {
      addonid: 'plugin.video.alpha',
      name: 'Alpha Video',
      version: '1.0.0',
      summary: 'Stream Alpha safely',
      description: 'A video plugin',
      author: 'Team Alpha',
      enabled: true,
      installed: true,
      type: 'xbmc.python.pluginsource',
      broken: false,
      dependencies: [{ addonid: 'xbmc.python' }],
      extrainfo: [{ key: 'provider', value: 'Alpha' }],
      path: 'smb://nas/secret-addon',
      thumbnail: 'http://admin:p@ssword@example.test/thumb.png'
    },
    {
      addonid: 'service.beta',
      name: 'Beta Service',
      version: '2.0.0',
      summary: 'Background helper',
      author: 'Team Beta',
      enabled: false,
      installed: true,
      type: 'xbmc.service',
      broken: 'Requires credentials in http://user:pass@example.test/raw body',
      dependencies: 'not-an-array',
      extrainfo: { unsafe: 'localStorage CHORUS_SENTINEL_SECRET' }
    }
  ]
};

const ALPHA_DETAIL = {
  addondetails: {
    addonid: 'plugin.video.alpha',
    name: 'Alpha Video',
    version: '1.0.0',
    summary: 'Stream Alpha safely',
    description: 'Detailed Alpha description',
    author: 'Team Alpha',
    enabled: true,
    installed: true,
    type: 'xbmc.python.pluginsource',
    broken: false,
    dependencies: [{ addonid: 'xbmc.python' }, { addonid: 'script.module.requests' }],
    extrainfo: [{ key: 'provider', value: 'Alpha' }],
    path: '/home/kodi/.kodi/addons/plugin.video.alpha',
    fanart: 'https://example.test/fanart.jpg'
  }
};

function createClient(): KodiJsonRpcHttpClient {
  return { call: vi.fn() };
}

function createMethods(overrides: Partial<AddonsStoreMethods> = {}) {
  const calls: Call[] = [];
  const methods: AddonsStoreMethods = {
    async getAddons(_client, params) {
      calls.push({ method: 'getAddons', args: [params] });
      return ADDONS_RESPONSE;
    },
    async getAddonDetails(_client, params) {
      calls.push({ method: 'getAddonDetails', args: [params] });
      return ALPHA_DETAIL;
    },
    async setAddonEnabled(_client, params) {
      calls.push({ method: 'setAddonEnabled', args: [params] });
      return 'OK';
    },
    ...overrides
  };

  return { calls, methods };
}

function makeStore(overrides: Partial<AddonsStoreMethods> = {}) {
  const { calls, methods } = createMethods(overrides);
  const store = createAddonsStore({
    createClient: () => createClient(),
    methods,
    now: () => '2026-05-01T21:00:00.000Z'
  });
  return { calls, store };
}

function expectNoForbiddenText(value: unknown) {
  expect(JSON.stringify(value)).not.toMatch(
    /smb:\/\/|https?:\/\/|\/home\/|admin:p@ssword|user:pass|Authorization|Basic|raw body|localStorage|sessionStorage|CHORUS_SENTINEL_SECRET|password/i
  );
}

describe('AddonsStore', () => {
  it('loads installed add-ons, exposes clone-safe snapshots, and filters/groups locally', async () => {
    const { calls, store } = makeStore();

    await store.loadAddons();

    expect(store.snapshot).toMatchObject({
      loadStatus: 'success',
      detailStatus: 'idle',
      writeStatus: 'idle',
      selectedAddonId: null,
      searchQuery: '',
      groupBy: 'none',
      lastError: null,
      pendingToggle: null,
      lastWrite: null,
      rollbackEnabled: null,
      refreshAfterWrite: null,
      writeCounts: { attempted: 0, succeeded: 0, failed: 0 }
    });
    expect(store.snapshot.addons.map((addon) => addon.addonid)).toEqual([
      'plugin.video.alpha',
      'service.beta'
    ]);
    expect(store.snapshot.addons[0]).toMatchObject({
      name: 'Alpha Video',
      enabled: true,
      installed: true,
      dependencyCount: 1,
      extrainfoCount: 1
    });
    expect(store.snapshot.addons[0]).not.toHaveProperty('path');
    expect(store.snapshot.addons[0]).not.toHaveProperty('thumbnail');
    expectNoForbiddenText(store.snapshot);
    expect(calls).toEqual([
      {
        method: 'getAddons',
        args: [
          {
            installed: true,
            enabled: 'all',
            properties: [
              'name',
              'version',
              'summary',
              'description',
              'author',
              'enabled',
              'installed',
              'type',
              'broken',
              'dependencies',
              'extrainfo'
            ]
          }
        ]
      }
    ]);

    const leakedSnapshot = store.snapshot;
    leakedSnapshot.addons[0].name = 'Mutated outside';
    leakedSnapshot.visibleAddons.length = 0;
    expect(store.snapshot.addons[0].name).toBe('Alpha Video');
    expect(store.snapshot.visibleAddons).toHaveLength(2);

    store.setSearchQuery(' ALPHA http://admin:p@ssword@example.test ');
    expect(store.snapshot.searchQuery).toBe('ALPHA [redacted-url]');
    expect(store.snapshot.visibleAddons.map((addon) => addon.addonid)).toEqual([
      'plugin.video.alpha'
    ]);

    store.setGroupBy('enabled');
    expect(
      store.snapshot.groups.map((group) => [group.key, group.label, group.addons.length])
    ).toEqual([['enabled', 'Enabled', 1]]);
    expect(calls).toHaveLength(1);
  });

  it('loads add-on detail with safe IDs, preserves previous detail on failures, and suppresses stale responses', async () => {
    const detailDelay = { resolve: null as null | (() => void) };
    let delayedOnce = false;
    const { calls, store } = makeStore({
      async getAddonDetails(_client, params) {
        calls.push({ method: 'getAddonDetails', args: [params] });
        if (params.addonid === 'plugin.video.alpha' && !delayedOnce) {
          delayedOnce = true;
          await new Promise<void>((resolve) => {
            detailDelay.resolve = resolve;
          });
          return {
            addondetails: { ...ALPHA_DETAIL.addondetails, name: 'Stale Alpha', enabled: false }
          };
        }
        return {
          addondetails: {
            addonid: 'service.beta',
            name: 'Beta Service',
            enabled: false,
            installed: true,
            type: 'xbmc.service'
          }
        };
      }
    });

    const firstLoad = store.loadAddonDetail('plugin.video.alpha');
    await vi.waitFor(() => expect(detailDelay.resolve).toBeTypeOf('function'));
    const secondLoad = store.loadAddonDetail('service.beta');
    if (!detailDelay.resolve) throw new Error('Expected first detail request to be pending.');
    detailDelay.resolve();
    await Promise.all([firstLoad, secondLoad]);

    expect(store.snapshot.detailStatus).toBe('success');
    expect(store.snapshot.selectedAddonId).toBe('service.beta');
    expect(store.snapshot.detail?.name).toBe('Beta Service');
    expect(store.snapshot.detail?.enabled).toBe(false);

    await store.loadAddonDetail('http://evil.test/addon');
    expect(store.snapshot.detailStatus).toBe('error');
    expect(store.snapshot.lastError?.code).toBe('validation/invalid-addon-id');
    expect(store.snapshot.detail?.addonid).toBe('service.beta');

    const { store: malformedStore } = makeStore({
      async getAddonDetails() {
        return { addondetails: null } as never;
      }
    });
    await malformedStore.loadAddonDetail('plugin.video.alpha');
    expect(malformedStore.snapshot.detailStatus).toBe('error');
    expect(malformedStore.snapshot.lastError?.code).toBe('addons/malformed-response');
    expectNoForbiddenText(malformedStore.snapshot);

    expect(calls.filter((call) => call.method === 'getAddonDetails')).toHaveLength(2);
  });

  it('handles list no-host, malformed, HTTP, and stale responses without leaking raw diagnostics', async () => {
    const listDelay = { resolve: null as null | (() => void) };
    let delayedOnce = false;
    const { store } = makeStore({
      async getAddons() {
        if (!delayedOnce) {
          delayedOnce = true;
          await new Promise<void>((resolve) => {
            listDelay.resolve = resolve;
          });
          return { addons: [{ addonid: 'stale.addon', name: 'Stale' }] };
        }
        return { addons: [{ addonid: 'fresh.addon', name: 'Fresh' }] };
      }
    });

    const firstLoad = store.loadAddons();
    await vi.waitFor(() => expect(listDelay.resolve).toBeTypeOf('function'));
    const secondLoad = store.loadAddons();
    if (!listDelay.resolve) throw new Error('Expected first list request to be pending.');
    listDelay.resolve();
    await Promise.all([firstLoad, secondLoad]);
    expect(store.snapshot.addons.map((addon) => addon.addonid)).toEqual(['fresh.addon']);

    const noHostStore = createAddonsStore({ createClient: () => null });
    await noHostStore.loadAddons();
    expect(noHostStore.snapshot.loadStatus).toBe('error');
    expect(noHostStore.snapshot.lastError?.code).toBe('config/no-active-host');

    const { store: malformedStore } = makeStore({
      async getAddons() {
        return { addons: null } as never;
      }
    });
    await malformedStore.loadAddons();
    expect(malformedStore.snapshot.lastError?.code).toBe('addons/malformed-response');

    const { store: httpStore } = makeStore({
      async getAddons() {
        throw new KodiHttpClientError({
          code: 'timeout',
          method: 'Addons.GetAddons',
          timeoutMs: 10,
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 10,
            hasCredentials: true
          }
        });
      }
    });
    await httpStore.loadAddons();
    expect(httpStore.snapshot.lastError).toMatchObject({ source: 'http', code: 'timeout' });
    expectNoForbiddenText(httpStore.snapshot);
  });

  it('rejects unsafe toggles without Kodi calls and rolls back rejected writes', async () => {
    const { calls, store } = makeStore({
      async setAddonEnabled() {
        calls.push({ method: 'setAddonEnabled', args: [] });
        throw new Error(
          'Authorization: Basic CHORUS_SENTINEL_SECRET failed for http://admin:p@ssword@kodi.local/jsonrpc raw body'
        );
      }
    });

    await store.loadAddonDetail('plugin.video.alpha');
    await store.setAddonEnabled('', false);
    expect(store.snapshot.writeStatus).toBe('error');
    expect(store.snapshot.lastError?.code).toBe('validation/invalid-addon-id');
    expect(calls.filter((call) => call.method === 'setAddonEnabled')).toHaveLength(0);

    await store.setAddonEnabled('plugin.video.alpha', false);
    expect(store.snapshot.writeStatus).toBe('error');
    expect(store.snapshot.detail?.enabled).toBe(true);
    expect(store.snapshot.pendingToggle).toBeNull();
    expect(store.snapshot.rollbackEnabled).toBe(true);
    expect(store.snapshot.lastWrite).toMatchObject({
      addonid: 'plugin.video.alpha',
      enabled: false,
      status: 'error',
      at: '2026-05-01T21:00:00.000Z'
    });
    expect(store.snapshot.writeCounts).toEqual({ attempted: 1, succeeded: 0, failed: 1 });
    expectNoForbiddenText(store.snapshot);
  });

  it('records successful writes from refreshed truth and keeps write success when refresh fails', async () => {
    let detailEnabled = true;
    let failRefreshAfterWrite = false;
    const { calls, store } = makeStore({
      async getAddonDetails(_client, params) {
        calls.push({ method: 'getAddonDetails', args: [params] });
        if (failRefreshAfterWrite) {
          throw new Error('Refresh failed with raw body http://admin:p@ssword@example.test');
        }
        return {
          addondetails: {
            ...ALPHA_DETAIL.addondetails,
            addonid: params.addonid,
            enabled: detailEnabled
          }
        };
      },
      async setAddonEnabled(_client, params) {
        calls.push({ method: 'setAddonEnabled', args: [params] });
        detailEnabled = params.enabled === true;
        return 'OK';
      }
    });

    await store.loadAddons();
    await store.loadAddonDetail('plugin.video.alpha');
    await store.setAddonEnabled('plugin.video.alpha', false);

    expect(calls.at(-3)).toEqual({
      method: 'setAddonEnabled',
      args: [{ addonid: 'plugin.video.alpha', enabled: false }]
    });
    expect(store.snapshot).toMatchObject({
      writeStatus: 'success',
      pendingToggle: null,
      rollbackEnabled: true,
      lastWrite: {
        addonid: 'plugin.video.alpha',
        enabled: false,
        status: 'success',
        at: '2026-05-01T21:00:00.000Z'
      },
      refreshAfterWrite: {
        addonid: 'plugin.video.alpha',
        requestedAt: '2026-05-01T21:00:00.000Z',
        refreshed: true
      },
      writeCounts: { attempted: 1, succeeded: 1, failed: 0 }
    });
    expect(store.snapshot.detail?.enabled).toBe(false);
    expect(
      store.snapshot.addons.find((addon) => addon.addonid === 'plugin.video.alpha')?.enabled
    ).toBe(false);

    detailEnabled = true;
    failRefreshAfterWrite = true;
    await store.setAddonEnabled('plugin.video.alpha', true);

    expect(store.snapshot.writeStatus).toBe('success');
    expect(store.snapshot.lastError).toMatchObject({
      source: 'refresh',
      code: 'refresh/failed'
    });
    expect(store.snapshot.refreshAfterWrite).toMatchObject({
      addonid: 'plugin.video.alpha',
      refreshed: false
    });
    expect(store.snapshot.detail?.enabled).toBe(false);
    expect(store.snapshot.writeCounts).toEqual({ attempted: 2, succeeded: 2, failed: 0 });
    expectNoForbiddenText(store.snapshot);
  });
});
