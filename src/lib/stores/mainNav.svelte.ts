export const MAIN_NAV_STORAGE_KEY = 'mainNav';

export type MainNavStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key'> & {
  readonly length: number;
};

export interface MainNavRow {
  id: string;
  title: string;
  path: string;
  icon: string;
  classes: string;
  parent: number;
  weight: number;
}

export interface MainNavSnapshot {
  rows: MainNavRow[];
  customized: boolean;
}

export interface MainNavStoreOptions {
  storage?: MainNavStorage | null;
}

export const DEFAULT_MAIN_NAV_ROWS: readonly MainNavRow[] = [
  row(1, 'Music', 'music', 'mdi-av-my-library-music', 'nav-music'),
  row(11, 'Movies', 'movies/recent', 'mdi-av-movie', 'nav-movies'),
  row(21, 'TV shows', 'tvshows/recent', 'mdi-hardware-tv', 'nav-tv'),
  row(31, 'Browser', 'browser', 'mdi-action-view-list', 'nav-browser'),
  row(81, 'PVR', 'pvr/tv', 'mdi-action-settings-input-antenna', 'pvr-link'),
  row(71, 'Add-ons', 'addons/all', 'mdi-action-extension', 'nav-addons'),
  row(41, 'Thumbs up', 'thumbsup', 'mdi-action-thumb-up', 'nav-thumbs-up'),
  row(42, 'Playlists', 'playlists', 'mdi-action-assignment', 'playlists'),
  row(51, 'Settings', 'settings/web', 'mdi-action-settings', 'nav-settings'),
  row(61, 'Help', 'help', 'mdi-action-help', 'nav-help')
];

export const MAIN_NAV_ICON_OPTIONS = [
  'mdi-av-my-library-music',
  'mdi-av-movie',
  'mdi-hardware-tv',
  'mdi-action-view-list',
  'mdi-action-settings-input-antenna',
  'mdi-action-extension',
  'mdi-action-thumb-up',
  'mdi-action-assignment',
  'mdi-action-settings',
  'mdi-action-help'
] as const;

export class MainNavStore {
  #snapshot = $state<MainNavSnapshot>({
    rows: cloneRows(DEFAULT_MAIN_NAV_ROWS),
    customized: false
  });
  readonly #storage: MainNavStorage | null;

  constructor(options: MainNavStoreOptions = {}) {
    this.#storage = options.storage ?? null;
    this.#load();
  }

  get snapshot(): MainNavSnapshot {
    return {
      rows: cloneRows(this.#snapshot.rows),
      customized: this.#snapshot.customized
    };
  }

  replace(rows: readonly Partial<MainNavRow>[]): void {
    this.#snapshot = {
      rows: normalizeRows(rows),
      customized: true
    };
    this.#persist();
  }

  reset(): void {
    this.#snapshot = {
      rows: cloneRows(DEFAULT_MAIN_NAV_ROWS),
      customized: false
    };
    this.#clearPersisted();
  }

  #load(): void {
    if (!this.#storage) return;

    try {
      const rows = readBackboneCollection(this.#storage);
      if (rows.length > 0) {
        this.#snapshot = { rows, customized: true };
      }
    } catch {
      this.reset();
    }
  }

  #persist(): void {
    if (!this.#storage) return;

    try {
      this.#clearPersisted();
      this.#storage.setItem(MAIN_NAV_STORAGE_KEY, JSON.stringify(this.#snapshot.rows));
    } catch {
      // Keep the in-memory menu for this browser session when storage is unavailable.
    }
  }

  #clearPersisted(): void {
    if (!this.#storage) return;

    try {
      const keys: string[] = [];
      for (let index = 0; index < this.#storage.length; index += 1) {
        const key = this.#storage.key(index);
        if (key === MAIN_NAV_STORAGE_KEY || key?.startsWith(`${MAIN_NAV_STORAGE_KEY}-`)) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        this.#storage.removeItem(key);
      }
    } catch {
      // In-memory state remains authoritative.
    }
  }
}

export function createMainNavStore(options: MainNavStoreOptions = {}): MainNavStore {
  return new MainNavStore(options);
}

export const mainNavStore = createMainNavStore({
  storage: typeof localStorage === 'undefined' ? null : localStorage
});

export function blankMainNavRow(weight: number): MainNavRow {
  return {
    id: String(1000 + weight),
    title: '',
    path: '',
    icon: 'mdi-action-extension',
    classes: '',
    parent: 0,
    weight
  };
}

function row(id: number, title: string, path: string, icon: string, classes: string): MainNavRow {
  return {
    id: String(id),
    title,
    path,
    icon,
    classes,
    parent: 0,
    weight: 0
  };
}

function readBackboneCollection(storage: MainNavStorage): MainNavRow[] {
  const raw = storage.getItem(MAIN_NAV_STORAGE_KEY);
  const jsonRows = parseJsonRows(raw);
  if (jsonRows) return normalizeRows(jsonRows);

  const ids = raw
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (!ids?.length) return [];

  return normalizeRows(
    ids
      .map((id, index) => readBackboneModel(storage, id, index))
      .filter((item): item is MainNavRow => item !== null)
  );
}

function parseJsonRows(raw: string | null): Partial<MainNavRow>[] | null {
  if (!raw || !['[', '{'].includes(raw.trimStart()[0] ?? '')) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as Partial<MainNavRow>[];
    if (isRecord(parsed) && Array.isArray(parsed.rows)) {
      return parsed.rows as Partial<MainNavRow>[];
    }
  } catch {
    return null;
  }
  return null;
}

function readBackboneModel(storage: MainNavStorage, id: string, weight: number): MainNavRow | null {
  const raw = storage.getItem(`${MAIN_NAV_STORAGE_KEY}-${id}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    return normalizeRow({ ...parsed, id, weight }, weight);
  } catch {
    return null;
  }
}

function normalizeRows(rows: readonly Partial<MainNavRow>[]): MainNavRow[] {
  return rows
    .map((item, index) => normalizeRow(item, index))
    .filter((item) => item.title !== '' && item.path !== '');
}

function normalizeRow(item: Partial<MainNavRow>, fallbackWeight: number): MainNavRow {
  const weight =
    typeof item.weight === 'number' && Number.isFinite(item.weight)
      ? Math.max(0, Math.floor(item.weight))
      : fallbackWeight;

  return {
    id: normalizeId(item.id, weight),
    title: normalizeString(item.title, 120),
    path: normalizePath(item.path),
    icon: normalizeIcon(item.icon),
    classes: normalizeClassName(item.classes),
    parent: 0,
    weight
  };
}

function normalizeId(value: unknown, weight: number): string {
  if (typeof value === 'string' && /^[a-z0-9._-]+$/i.test(value)) {
    return value;
  }
  return String(1000 + weight);
}

function normalizeIcon(value: unknown): string {
  const icon = normalizeString(value, 80);
  return icon || 'mdi-action-extension';
}

function normalizePath(value: unknown): string {
  return normalizeString(value, 256)
    .replace(/^#+/, '')
    .replace(/^\/+/, '')
    .replace(/[<>"']/g, '');
}

function normalizeClassName(value: unknown): string {
  return normalizeString(value, 80).replace(/[^a-z0-9 _-]/gi, '');
}

function normalizeString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cloneRows(rows: readonly MainNavRow[]): MainNavRow[] {
  return rows.map((item, index) => ({ ...item, weight: index }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
