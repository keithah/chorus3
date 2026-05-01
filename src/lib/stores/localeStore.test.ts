import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  createLocaleStore,
  type LocaleStorage
} from './locale.svelte';

function createStorage(initial: Record<string, string> = {}): LocaleStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    })
  };
}

function createThrowingStorage(options: { read?: boolean; write?: boolean } = {}): LocaleStorage {
  return {
    getItem: vi.fn(() => {
      if (options.read) {
        throw new Error('raw locale read failure with token=secret');
      }

      return null;
    }),
    setItem: vi.fn(() => {
      if (options.write) {
        throw new Error('raw locale write failure with token=secret');
      }
    })
  };
}

describe('LocaleStore', () => {
  it('defaults to English without touching Kodi host storage', () => {
    const storage = createStorage({ 'chorus3.kodi.hosts': JSON.stringify({ secret: true }) });
    const store = createLocaleStore({ storage });

    expect(store.locale).toBe(DEFAULT_LOCALE);
    expect(store.snapshot).toEqual({ locale: 'en' });
    expect(storage.getItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY);
    expect(storage.getItem).not.toHaveBeenCalledWith('chorus3.kodi.hosts');
  });

  it('loads a valid persisted locale from the dedicated locale key', () => {
    const store = createLocaleStore({ storage: createStorage({ [LOCALE_STORAGE_KEY]: 'de' }) });

    expect(store.snapshot).toEqual({ locale: 'de' });
  });

  it('ignores invalid persisted values and falls back to the default locale', () => {
    const store = createLocaleStore({ storage: createStorage({ [LOCALE_STORAGE_KEY]: 'fr' }) });

    expect(store.snapshot).toEqual({ locale: 'en' });
  });

  it('sets and toggles locales while persisting only the locale id', () => {
    const storage = createStorage();
    const store = createLocaleStore({ storage });

    store.setLocale('de');
    expect(store.snapshot).toEqual({ locale: 'de' });
    expect(storage.setItem).toHaveBeenLastCalledWith(LOCALE_STORAGE_KEY, 'de');

    store.toggleLocale();
    expect(store.snapshot).toEqual({ locale: 'en' });
    expect(storage.setItem).toHaveBeenLastCalledWith(LOCALE_STORAGE_KEY, 'en');
  });

  it('rejects unknown locale ids without mutating or persisting state', () => {
    const storage = createStorage();
    const store = createLocaleStore({ storage });

    expect(store.setLocale('fr')).toEqual({ ok: false, locale: 'en' });
    expect(store.snapshot).toEqual({ locale: 'en' });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('keeps in-memory locale when storage reads or writes throw', () => {
    const readFailure = createLocaleStore({ storage: createThrowingStorage({ read: true }) });
    expect(readFailure.snapshot).toEqual({ locale: 'en' });

    const writeStorage = createThrowingStorage({ write: true });
    const writeFailure = createLocaleStore({ storage: writeStorage });

    expect(writeFailure.setLocale('de')).toEqual({ ok: true, locale: 'de' });
    expect(writeFailure.snapshot).toEqual({ locale: 'de' });
    expect(JSON.stringify(writeFailure.snapshot)).not.toContain('secret');
  });

  it('returns clone-safe snapshots that are not affected by caller mutation', () => {
    const store = createLocaleStore();
    const snapshot = store.snapshot as { locale: string };

    snapshot.locale = 'de';

    expect(store.snapshot).toEqual({ locale: 'en' });
  });
});
