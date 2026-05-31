import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  isThemeName,
  resolveInitialTheme,
  toggleTheme,
  type ThemeName
} from './theme';

function createStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    })
  };
}

function createThrowingStorage(): Storage {
  return {
    get length(): number {
      throw new Error('storage length unavailable');
    },
    clear: vi.fn(() => {
      throw new Error('storage clear unavailable');
    }),
    getItem: vi.fn(() => {
      throw new Error('storage read unavailable');
    }),
    key: vi.fn(() => {
      throw new Error('storage key unavailable');
    }),
    removeItem: vi.fn(() => {
      throw new Error('storage remove unavailable');
    }),
    setItem: vi.fn(() => {
      throw new Error('storage write unavailable');
    })
  };
}

describe('theme contract', () => {
  it('accepts only supported theme names', () => {
    expect(isThemeName('dark')).toBe(false);
    expect(isThemeName('light')).toBe(true);
    expect(isThemeName('system')).toBe(false);
    expect(isThemeName(null)).toBe(false);
  });

  it('falls back to the default theme when no preference is stored', () => {
    expect(resolveInitialTheme(createStorage())).toBe(DEFAULT_THEME);
  });

  it('resolves a valid stored preference', () => {
    const storage = createStorage({ [THEME_STORAGE_KEY]: 'light' });

    expect(resolveInitialTheme(storage)).toBe('light');
  });

  it('ignores invalid stored preferences and returns the default theme', () => {
    const storage = createStorage({ [THEME_STORAGE_KEY]: 'solarized' });

    expect(resolveInitialTheme(storage)).toBe(DEFAULT_THEME);
  });

  it('sets html data-theme and persists valid themes', () => {
    const storage = createStorage();

    const applied = applyTheme('light', { document, storage });

    expect(applied).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
  });

  it('falls back before applying malformed theme values', () => {
    const storage = createStorage();

    const applied = applyTheme('solarized', { document, storage });

    expect(applied).toBe(DEFAULT_THEME);
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, DEFAULT_THEME);
  });

  it('still mutates the root when storage read or write fails', () => {
    const storage = createThrowingStorage();

    expect(resolveInitialTheme(storage)).toBe(DEFAULT_THEME);
    expect(applyTheme('light', { document, storage })).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it.each<[string, ThemeName]>([
    ['dark', 'light'],
    ['light', 'light']
  ])('toggles %s to %s and persists the next theme', (currentTheme, nextTheme) => {
    const storage = createStorage();
    document.documentElement.dataset.theme = currentTheme;

    const toggled = toggleTheme({ document, storage });

    expect(toggled).toBe(nextTheme);
    expect(document.documentElement.dataset.theme).toBe(nextTheme);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, nextTheme);
  });
});
