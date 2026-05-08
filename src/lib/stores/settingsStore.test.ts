import { describe, expect, it, vi } from 'vitest';

import { KodiHttpClientError, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createSettingsStore, type SettingsStoreMethods } from './settingsStore.svelte';

type Call = { method: string; args: unknown[] };

const SECTION_RESPONSE = {
  sections: [
    { id: 'system', label: 'System' },
    { id: 'services', label: 'Services' }
  ]
};

const SYSTEM_CATEGORIES = {
  categories: [
    { id: 'audio', label: 'Audio' },
    { id: 'display', label: 'Display' }
  ]
};

const SERVICES_CATEGORIES = {
  categories: [{ id: 'webserver', label: 'Web server' }]
};

const AUDIO_SETTINGS = {
  settings: [
    { id: 'audio.mute', label: 'Mute', type: 'boolean', value: false },
    { id: 'audio.volume', label: 'Volume', type: 'integer', value: 50 },
    { id: 'audio.name', label: 'Profile name', type: 'string', value: 'Living Room' },
    {
      id: 'audio.output',
      label: 'Output',
      type: 'string',
      value: 'hdmi',
      options: [{ value: 'hdmi', label: 'HDMI' }]
    },
    { id: 'audio.scan', label: 'Scan', type: 'action', value: null },
    { id: 'audio.path', label: 'Path', type: 'path', value: 'smb://nas/secret.mkv' }
  ]
};

const DISPLAY_SETTINGS = {
  settings: [{ id: 'display.mode', label: 'Mode', type: 'string', value: 'windowed' }]
};

function createClient(): KodiJsonRpcHttpClient {
  return { call: vi.fn() };
}

function createMethods(overrides: Partial<SettingsStoreMethods> = {}) {
  const calls: Call[] = [];
  const methods: SettingsStoreMethods = {
    async getSettingsSections(_client, params) {
      calls.push({ method: 'getSettingsSections', args: [params] });
      return SECTION_RESPONSE;
    },
    async getSettingsCategories(_client, params) {
      calls.push({ method: 'getSettingsCategories', args: [params] });
      return params?.section === 'services' ? SERVICES_CATEGORIES : SYSTEM_CATEGORIES;
    },
    async getSettings(_client, params) {
      calls.push({ method: 'getSettings', args: [params] });
      return params?.category === 'display' ? DISPLAY_SETTINGS : AUDIO_SETTINGS;
    },
    async setSettingValue(_client, params) {
      calls.push({ method: 'setSettingValue', args: [params] });
      return 'OK';
    },
    ...overrides
  };

  return { calls, methods };
}

function makeStore(overrides: Partial<SettingsStoreMethods> = {}) {
  const { calls, methods } = createMethods(overrides);
  const store = createSettingsStore({
    createClient: () => createClient(),
    methods,
    now: () => '2026-05-01T20:00:00.000Z'
  });
  return { calls, store };
}

describe('SettingsStore', () => {
  it('loads sections, categories, active settings, and safe diagnostics', async () => {
    const { calls, store } = makeStore();

    await store.load();

    expect(store.snapshot).toMatchObject({
      loadStatus: 'success',
      writeStatus: 'idle',
      selectedSectionId: 'system',
      selectedCategoryId: 'audio',
      lastError: null,
      writeCounts: { attempted: 0, succeeded: 0, failed: 0 },
      refreshAfterWrite: null,
      rollbackValue: null
    });
    expect(store.snapshot.sections).toEqual(SECTION_RESPONSE.sections);
    expect(store.snapshot.categories).toEqual(SYSTEM_CATEGORIES.categories);
    expect(
      store.snapshot.settings.map((setting) => [setting.id, setting.editKind, setting.readOnly])
    ).toEqual([
      ['audio.mute', 'boolean', false],
      ['audio.volume', 'integer', false],
      ['audio.name', 'string', false],
      ['audio.output', 'enum', false],
      ['audio.scan', 'unsupported', true],
      ['audio.path', 'unsupported', true]
    ]);
    expect(JSON.stringify(store.snapshot)).not.toMatch(
      /smb:\/\/nas|secret\.mkv|Authorization|Basic/i
    );
    expect(calls).toEqual([
      { method: 'getSettingsSections', args: [{ level: 'expert' }] },
      { method: 'getSettingsCategories', args: [{ section: 'system', level: 'expert' }] },
      { method: 'getSettings', args: [{ section: 'system', category: 'audio', level: 'expert' }] }
    ]);
  });

  it('switches sections and categories using current request results', async () => {
    const { store } = makeStore();

    await store.load();
    await store.selectSection('services');

    expect(store.snapshot.selectedSectionId).toBe('services');
    expect(store.snapshot.selectedCategoryId).toBe('webserver');
    expect(store.snapshot.categories).toEqual(SERVICES_CATEGORIES.categories);

    await store.selectCategory('audio');
    expect(store.snapshot.lastError?.code).toBe('validation/invalid-category');
    expect(store.snapshot.selectedCategoryId).toBe('webserver');
  });

  it('writes supported values optimistically, refreshes active category, and records diagnostics', async () => {
    let getSettingsCount = 0;
    const { calls, store } = makeStore({
      async getSettings(_client, params) {
        calls.push({ method: 'getSettings', args: [params] });
        getSettingsCount += 1;
        if (getSettingsCount === 1) {
          return AUDIO_SETTINGS;
        }
        return {
          settings: [{ id: 'audio.volume', label: 'Volume', type: 'integer', value: 75 }]
        };
      }
    });

    await store.load();
    await store.writeSettingValue('audio.volume', 75);

    expect(calls.at(-2)).toEqual({
      method: 'setSettingValue',
      args: [{ setting: 'audio.volume', value: 75 }]
    });
    expect(calls.at(-1)).toEqual({
      method: 'getSettings',
      args: [{ section: 'system', category: 'audio', level: 'expert' }]
    });
    expect(store.snapshot).toMatchObject({
      writeStatus: 'success',
      rollbackValue: 50,
      lastWrite: {
        settingId: 'audio.volume',
        value: 75,
        status: 'success',
        at: '2026-05-01T20:00:00.000Z'
      },
      refreshAfterWrite: { settingId: 'audio.volume', categoryId: 'audio', refreshed: true },
      writeCounts: { attempted: 1, succeeded: 1, failed: 0 }
    });
    expect(store.snapshot.settings.find((setting) => setting.id === 'audio.volume')?.value).toBe(
      75
    );
  });

  it('rejects invalid or unsupported writes without calling Kodi', async () => {
    const { calls, store } = makeStore();

    await store.load();
    await store.writeSettingValue('audio.scan', true);
    await store.writeSettingValue('audio.volume', 'loud');

    expect(calls.filter((call) => call.method === 'setSettingValue')).toHaveLength(0);
    expect(store.snapshot.writeStatus).toBe('error');
    expect(store.snapshot.lastError?.code).toBe('validation/invalid-value');
    expect(store.snapshot.writeCounts).toEqual({ attempted: 0, succeeded: 0, failed: 0 });
  });

  it('rolls back and redacts write failures', async () => {
    const { store } = makeStore({
      async setSettingValue() {
        throw new Error(
          'Authorization: Basic SENTINEL_SECRET failed for http://admin:p@ssword@kodi.local/jsonrpc raw body'
        );
      }
    });

    await store.load();
    await store.writeSettingValue('audio.mute', true);

    expect(store.snapshot.writeStatus).toBe('error');
    expect(store.snapshot.settings.find((setting) => setting.id === 'audio.mute')?.value).toBe(
      false
    );
    expect(store.snapshot.rollbackValue).toBe(false);
    expect(store.snapshot.lastError).toMatchObject({ source: 'write', code: 'write/failed' });
    expect(store.snapshot.writeCounts).toEqual({ attempted: 1, succeeded: 0, failed: 1 });
    expect(JSON.stringify(store.snapshot)).not.toMatch(
      /SENTINEL_SECRET|admin:p@ssword|Authorization|Basic|raw body/i
    );
  });

  it('preserves previous state on no active host, client errors, malformed responses, and stale responses', async () => {
    const clientError = new KodiHttpClientError({
      code: 'timeout',
      method: 'Settings.GetSettings',
      timeoutMs: 25,
      endpoint: {
        protocol: 'http:',
        host: 'kodi.local',
        port: 8080,
        path: '/jsonrpc',
        timeoutMs: 25,
        hasCredentials: false
      }
    });
    const settingsDelay = { resolve: null as null | (() => void) };
    let delayedOnce = false;
    const { store } = makeStore({
      async getSettings(_client, params) {
        if (params?.category === 'audio' && !delayedOnce) {
          delayedOnce = true;
          await new Promise<void>((resolve) => {
            settingsDelay.resolve = resolve;
          });
          return AUDIO_SETTINGS;
        }
        return DISPLAY_SETTINGS;
      }
    });

    const initialLoad = store.load();
    await vi.waitFor(() => expect(settingsDelay.resolve).toBeTypeOf('function'));
    const secondLoad = store.load();
    if (!settingsDelay.resolve)
      throw new Error('Expected the first settings request to be pending.');
    settingsDelay.resolve();
    await Promise.all([initialLoad, secondLoad]);
    expect(store.snapshot.loadStatus).toBe('success');

    const previousSettings = store.snapshot.settings;
    const noHostStore = createSettingsStore({ createClient: () => null });
    await noHostStore.load();
    expect(noHostStore.snapshot.lastError?.code).toBe('config/no-active-host');

    const { store: malformedStore } = makeStore({
      async getSettingsSections() {
        return { sections: 'not-an-array' } as never;
      }
    });
    await malformedStore.load();
    expect(malformedStore.snapshot.lastError?.code).toBe('settings/malformed-response');

    const { store: errorStore } = makeStore({
      async getSettings() {
        throw clientError;
      }
    });
    await errorStore.load();
    expect(errorStore.snapshot.settings).toEqual([]);
    expect(errorStore.snapshot.lastError).toMatchObject({ source: 'http', code: 'timeout' });
    expect(JSON.stringify(errorStore.snapshot)).not.toMatch(/Authorization|Basic|raw/i);
    expect(previousSettings.length).toBeGreaterThan(0);
  });
});
