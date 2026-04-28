import { describe, expect, it, vi } from 'vitest';

import {
  CONFIG_STORAGE_KEY,
  createConfigStore,
  validateSavedKodiHostInput,
  type ConfigStorage,
  type SavedKodiHostInput
} from './config.svelte';

function createStorage(initial: Record<string, string> = {}): ConfigStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    })
  };
}

function createThrowingStorage(options: { read?: boolean; write?: boolean } = {}): ConfigStorage {
  return {
    getItem: vi.fn(() => {
      if (options.read) {
        throw new Error('raw read failure with secret-password');
      }

      return null;
    }),
    setItem: vi.fn(() => {
      if (options.write) {
        throw new Error('raw write failure with secret-password');
      }
    }),
    removeItem: vi.fn()
  };
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
  useTls: true,
  useWebSocket: false
};

function persistedValue(storage: ConfigStorage): string {
  const calls = vi.mocked(storage.setItem).mock.calls;
  const latestCall = calls.at(-1);

  if (!latestCall) {
    throw new Error('Expected storage.setItem to have been called.');
  }

  return latestCall[1];
}

describe('config store', () => {
  it('persists multiple named hosts and reloads them from injected storage', () => {
    const storage = createStorage();
    const store = createConfigStore({ storage });

    expect(store.addHost(kitchenHost).ok).toBe(true);
    expect(store.addHost(denHost).ok).toBe(true);
    store.setActiveHost('den');

    expect(storage.setItem).toHaveBeenLastCalledWith(
      CONFIG_STORAGE_KEY,
      expect.stringContaining('Kitchen Kodi')
    );

    const reloaded = createConfigStore({
      storage: createStorage({ [CONFIG_STORAGE_KEY]: persistedValue(storage) })
    });

    expect(reloaded.snapshot).toMatchObject({
      activeHostId: 'den',
      storageWarning: null,
      validationErrors: {}
    });
    expect(reloaded.snapshot.hosts).toEqual([
      kitchenHost,
      {
        ...denHost,
        useWebSocket: false
      }
    ]);
    expect(reloaded.activeHost).toEqual({
      ...denHost,
      useWebSocket: false
    });
  });

  it('selects an active host deterministically and clears active host when deleting it', () => {
    const store = createConfigStore({ storage: createStorage() });

    store.addHost(kitchenHost);
    store.addHost(denHost);
    expect(store.activeHost?.id).toBe('kitchen');

    expect(store.setActiveHost('den')).toEqual({
      ok: true,
      host: expect.objectContaining({ id: 'den' })
    });
    expect(store.activeHost?.id).toBe('den');

    expect(store.deleteHost('den')).toEqual({ ok: true });
    expect(store.snapshot.activeHostId).toBe('kitchen');
    expect(store.activeHost?.id).toBe('kitchen');

    expect(store.deleteHost('kitchen')).toEqual({ ok: true });
    expect(store.snapshot.hosts).toEqual([]);
    expect(store.snapshot.activeHostId).toBeNull();
    expect(store.activeHost).toBeNull();
  });

  it('recovers invalid localStorage with a safe inspectable warning', () => {
    const rawJson = JSON.stringify({
      hosts: [
        {
          id: 'broken',
          label: 'Broken',
          host: 'http://user:leaked-password@kodi.local',
          useTls: false,
          useWebSocket: true
        }
      ],
      activeHostId: 'broken'
    });
    const store = createConfigStore({ storage: createStorage({ [CONFIG_STORAGE_KEY]: rawJson }) });

    expect(store.snapshot.hosts).toEqual([]);
    expect(store.snapshot.activeHostId).toBeNull();
    expect(store.snapshot.storageWarning).toMatchObject({ code: 'invalid-storage' });
    expect(store.snapshot.storageWarning?.message).toContain('Saved Kodi host settings were reset');
    expect(store.snapshot.storageWarning?.message).not.toContain('leaked-password');
    expect(store.snapshot.storageWarning?.message).not.toContain(rawJson);
  });

  it('keeps in-memory state and exposes safe warnings when storage throws', () => {
    const readFailure = createConfigStore({ storage: createThrowingStorage({ read: true }) });

    expect(readFailure.snapshot.storageWarning).toMatchObject({ code: 'read-failed' });
    expect(readFailure.snapshot.storageWarning?.message).not.toContain('secret-password');

    const writeStorage = createThrowingStorage({ write: true });
    const writeFailure = createConfigStore({ storage: writeStorage });

    expect(writeFailure.addHost(kitchenHost).ok).toBe(true);
    expect(writeFailure.snapshot.hosts).toHaveLength(1);
    expect(writeFailure.snapshot.storageWarning).toMatchObject({ code: 'write-failed' });
    expect(writeFailure.snapshot.storageWarning?.message).not.toContain('secret-password');
  });

  it('refuses to persist invalid host records and returns field-level validation errors', () => {
    const storage = createStorage();
    const store = createConfigStore({ storage });

    const result = store.addHost({
      id: '',
      label: ' ',
      host: 'http://admin:secret@kodi.local',
      port: 70000,
      username: ' ',
      password: '',
      useTls: false,
      useWebSocket: true
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        host: 'Host must not include a protocol, path, query string, or credentials.',
        id: 'Host id is required.',
        label: 'Label is required.',
        port: 'HTTP port must be an integer between 1 and 65535.',
        password: 'Password cannot be blank when provided.',
        username: 'Username cannot be blank when provided.'
      }
    });
    if (result.ok) {
      throw new Error('Expected invalid host input to be rejected.');
    }
    expect(store.snapshot.validationErrors).toEqual(result.errors);
    expect(store.snapshot.hosts).toEqual([]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('returns safe errors for unknown host mutations', () => {
    const store = createConfigStore({ storage: createStorage() });

    expect(store.updateHost('missing', kitchenHost)).toEqual({
      ok: false,
      errors: { id: 'No saved Kodi host exists for this id.' }
    });
    expect(store.deleteHost('missing')).toEqual({
      ok: false,
      errors: { id: 'No saved Kodi host exists for this id.' }
    });
    expect(store.setActiveHost('missing')).toEqual({
      ok: false,
      errors: { activeHostId: 'Choose a saved Kodi host before making it active.' }
    });
  });

  it('validates persisted host shapes and optional credentials without leaking secrets', () => {
    expect(validateSavedKodiHostInput(kitchenHost)).toEqual({
      ok: true,
      host: kitchenHost
    });

    const invalid = validateSavedKodiHostInput({
      ...kitchenHost,
      host: 'kodi.local/jsonrpc',
      port: 1.5,
      password: 'Authorization: Basic abc123'
    });

    expect(invalid).toEqual({
      ok: false,
      errors: {
        host: 'Host must not include a protocol, path, query string, or credentials.',
        password: 'Password must not contain Authorization header content.',
        port: 'HTTP port must be an integer between 1 and 65535.'
      }
    });
    expect(JSON.stringify(invalid)).not.toContain('abc123');
  });

  it('resets hosts, active selection, validation errors, and warnings', () => {
    const store = createConfigStore({ storage: createStorage() });

    store.addHost(kitchenHost);
    store.setActiveHost('kitchen');
    store.reset();

    expect(store.snapshot).toEqual({
      hosts: [],
      activeHostId: null,
      activeHost: null,
      validationErrors: {},
      storageWarning: null
    });
  });
});
