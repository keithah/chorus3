export type ThemeName = 'dark' | 'light';

export const DEFAULT_THEME: ThemeName = 'dark';
export const THEME_STORAGE_KEY = 'chorus3.theme';

export interface ThemeEnvironment {
  document?: Document;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}

export function isThemeName(value: unknown): value is ThemeName {
  return value === 'dark' || value === 'light';
}

function readStoredTheme(storage?: Pick<Storage, 'getItem'> | null): ThemeName | null {
  if (!storage) {
    return null;
  }

  try {
    const storedTheme = storage.getItem(THEME_STORAGE_KEY);

    return isThemeName(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: ThemeName, storage?: Pick<Storage, 'setItem'> | null): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be disabled or quota-limited. The root data-theme remains authoritative.
  }
}

export function resolveInitialTheme(storage?: Pick<Storage, 'getItem'> | null): ThemeName {
  return readStoredTheme(storage) ?? DEFAULT_THEME;
}

export function applyTheme(theme: unknown, environment: ThemeEnvironment = {}): ThemeName {
  const nextTheme = isThemeName(theme) ? theme : DEFAULT_THEME;
  const root = environment.document?.documentElement;

  if (root) {
    root.dataset.theme = nextTheme;
  }

  persistTheme(nextTheme, environment.storage);

  return nextTheme;
}

export function toggleTheme(environment: ThemeEnvironment = {}): ThemeName {
  const currentTheme = environment.document?.documentElement.dataset.theme;
  const nextTheme: ThemeName = currentTheme === 'light' ? 'dark' : 'light';

  return applyTheme(nextTheme, environment);
}
