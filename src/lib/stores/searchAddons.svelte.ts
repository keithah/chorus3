export const SEARCH_ADDONS_STORAGE_KEY = 'searchAddons';

export type SearchAddonsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key'> & {
  readonly length: number;
};

export type SearchAddonMedia = 'music' | 'video';

export interface SearchAddonSetting {
  id: string;
  title: string;
  url: string;
  media: SearchAddonMedia;
  weight: number;
}

export interface SearchAddonsSnapshot {
  rows: SearchAddonSetting[];
}

export interface SearchAddonsStoreOptions {
  storage?: SearchAddonsStorage | null;
}

export class SearchAddonsStore {
  #snapshot = $state<SearchAddonsSnapshot>({ rows: [] });
  readonly #storage: SearchAddonsStorage | null;

  constructor(options: SearchAddonsStoreOptions = {}) {
    this.#storage = options.storage ?? null;
    this.#load();
  }

  get snapshot(): SearchAddonsSnapshot {
    return { rows: this.#snapshot.rows.map((row) => ({ ...row })) };
  }

  replace(rows: readonly Partial<SearchAddonSetting>[]): void {
    this.#snapshot = { rows: normalizeRows(rows) };
    this.#persist();
  }

  clear(): void {
    this.#snapshot = { rows: [] };
    this.#clearPersisted();
  }

  #load(): void {
    if (!this.#storage) return;

    try {
      this.#snapshot = { rows: readBackboneCollection(this.#storage) };
    } catch {
      this.#snapshot = { rows: [] };
      this.#clearPersisted();
    }
  }

  #persist(): void {
    if (!this.#storage) return;

    try {
      this.#clearPersisted();
      this.#storage.setItem(SEARCH_ADDONS_STORAGE_KEY, JSON.stringify(this.#snapshot.rows));
    } catch {
      // Keep the in-memory settings active for this session when browser storage fails.
    }
  }

  #clearPersisted(): void {
    if (!this.#storage) return;

    try {
      const keys: string[] = [];
      for (let index = 0; index < this.#storage.length; index += 1) {
        const key = this.#storage.key(index);
        if (key === SEARCH_ADDONS_STORAGE_KEY || key?.startsWith(`${SEARCH_ADDONS_STORAGE_KEY}-`)) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        this.#storage.removeItem(key);
      }
    } catch {
      // Nothing useful to recover here; the in-memory view remains authoritative.
    }
  }
}

export function createSearchAddonsStore(options: SearchAddonsStoreOptions = {}): SearchAddonsStore {
  return new SearchAddonsStore(options);
}

export const searchAddonsStore = createSearchAddonsStore({
  storage: typeof localStorage === 'undefined' ? null : localStorage
});

export function blankSearchAddon(weight: number): SearchAddonSetting {
  return {
    id: `custom.addon.${weight}`,
    title: '',
    url: '',
    media: 'music',
    weight
  };
}

function readBackboneCollection(storage: SearchAddonsStorage): SearchAddonSetting[] {
  const raw = storage.getItem(SEARCH_ADDONS_STORAGE_KEY);
  const jsonRows = parseJsonRows(raw);
  if (jsonRows) return normalizeRows(jsonRows);

  const ids = raw
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (!ids?.length) return [];

  const rows = ids
    .map((id, index) => readBackboneModel(storage, id, index))
    .filter((row): row is SearchAddonSetting => row !== null);

  return normalizeRows(rows);
}

function parseJsonRows(raw: string | null): Partial<SearchAddonSetting>[] | null {
  if (!raw || !['[', '{'].includes(raw.trimStart()[0] ?? '')) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as Partial<SearchAddonSetting>[];
    if (isRecord(parsed) && Array.isArray(parsed.rows)) {
      return parsed.rows as Partial<SearchAddonSetting>[];
    }
  } catch {
    return null;
  }
  return null;
}

function readBackboneModel(
  storage: SearchAddonsStorage,
  id: string,
  weight: number
): SearchAddonSetting | null {
  const raw = storage.getItem(`${SEARCH_ADDONS_STORAGE_KEY}-${id}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    return normalizeRow({ ...parsed, id, weight }, weight);
  } catch {
    return null;
  }
}

function normalizeRows(rows: readonly Partial<SearchAddonSetting>[]): SearchAddonSetting[] {
  return rows
    .map((row, index) => normalizeRow(row, index))
    .filter((row) => row.title !== '' || row.url !== '');
}

function normalizeRow(
  row: Partial<SearchAddonSetting>,
  fallbackWeight: number
): SearchAddonSetting {
  const weight =
    typeof row.weight === 'number' && Number.isFinite(row.weight) ? row.weight : fallbackWeight;

  return {
    id: normalizeId(row.id, weight),
    title: normalizeString(row.title),
    url: normalizeString(row.url),
    media: row.media === 'video' ? 'video' : 'music',
    weight
  };
}

function normalizeId(value: unknown, weight: number): string {
  if (typeof value === 'string' && /^[a-z0-9._-]+$/i.test(value)) {
    return value;
  }
  return `custom.addon.${weight}`;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 2048) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
