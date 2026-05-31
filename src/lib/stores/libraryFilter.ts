export type LibraryFilterType = 'string' | 'number' | 'float' | 'array' | 'object' | 'boolean';
export type LibrarySortOrder = 'asc' | 'desc';
export type LibraryFilterCallback =
  | 'multiple'
  | 'unwatched'
  | 'watched'
  | 'inprogress'
  | 'thumbsup';

export interface LibrarySortField {
  alias: string;
  type: 'string' | 'number' | 'float' | 'other';
  defaultSort?: boolean;
  defaultOrder: LibrarySortOrder;
  key: string;
}

export interface LibraryFilterField {
  alias: string;
  type: LibraryFilterType;
  key: string;
  property?: string;
  sortOrder: LibrarySortOrder;
  filterCallback: LibraryFilterCallback;
}

export interface LibraryAvailableFilters {
  sort: string[];
  filter: string[];
}

export interface LibraryFilterOption {
  key: string;
  value: string | number | boolean;
  title: string;
  active: boolean;
}

export interface LibraryActiveFilter {
  key: string;
  values: Array<string | number | boolean>;
  title: string;
}

export interface LibraryParsedSortField extends LibrarySortField {
  active: boolean;
  order: LibrarySortOrder;
  title: string;
}

export interface LibraryParsedFilterField extends LibraryFilterField {
  active: boolean;
  title: string;
}

export interface LibrarySortState {
  method: string;
  order: LibrarySortOrder;
}

type StoredFilters = Record<string, Array<string | number | boolean>>;
type StoreBucket<T> = Record<string, T>;

const FILTER_STORE_PREFIX = 'filter:store:';

export const LIBRARY_SORT_FIELDS: readonly LibrarySortField[] = [
  { alias: 'title', type: 'string', defaultSort: true, defaultOrder: 'asc', key: 'title' },
  { alias: 'title', type: 'string', defaultSort: true, defaultOrder: 'asc', key: 'label' },
  { alias: 'year', type: 'number', defaultOrder: 'desc', key: 'year' },
  { alias: 'date added', type: 'string', defaultOrder: 'desc', key: 'dateadded' },
  { alias: 'rating', type: 'float', defaultOrder: 'desc', key: 'rating' },
  { alias: 'artist', type: 'string', defaultOrder: 'asc', key: 'artist' },
  { alias: 'random', type: 'other', defaultOrder: 'asc', key: 'random' },
  { alias: 'album', type: 'string', defaultOrder: 'asc', key: 'album' }
];

export const LIBRARY_FILTER_FIELDS: readonly LibraryFilterField[] = [
  { alias: 'year', type: 'number', key: 'year', sortOrder: 'desc', filterCallback: 'multiple' },
  { alias: 'genre', type: 'array', key: 'genre', sortOrder: 'asc', filterCallback: 'multiple' },
  { alias: 'mood', type: 'array', key: 'mood', sortOrder: 'asc', filterCallback: 'multiple' },
  { alias: 'style', type: 'array', key: 'style', sortOrder: 'asc', filterCallback: 'multiple' },
  {
    alias: 'unwatched',
    type: 'boolean',
    key: 'unwatched',
    sortOrder: 'asc',
    filterCallback: 'unwatched'
  },
  {
    alias: 'watched',
    type: 'boolean',
    key: 'watched',
    sortOrder: 'asc',
    filterCallback: 'watched'
  },
  {
    alias: 'in progress',
    type: 'boolean',
    key: 'inprogress',
    sortOrder: 'asc',
    filterCallback: 'inprogress'
  },
  { alias: 'writer', type: 'array', key: 'writer', sortOrder: 'asc', filterCallback: 'multiple' },
  {
    alias: 'director',
    type: 'array',
    key: 'director',
    sortOrder: 'asc',
    filterCallback: 'multiple'
  },
  { alias: 'tag', type: 'array', key: 'tag', sortOrder: 'asc', filterCallback: 'multiple' },
  {
    alias: 'actor',
    type: 'object',
    property: 'name',
    key: 'cast',
    sortOrder: 'asc',
    filterCallback: 'multiple'
  },
  {
    alias: 'set',
    type: 'string',
    property: 'set',
    key: 'set',
    sortOrder: 'asc',
    filterCallback: 'multiple'
  },
  {
    alias: 'rated',
    type: 'string',
    property: 'mpaa',
    key: 'mpaa',
    sortOrder: 'asc',
    filterCallback: 'multiple'
  },
  {
    alias: 'studio',
    type: 'array',
    property: 'studio',
    key: 'studio',
    sortOrder: 'asc',
    filterCallback: 'multiple'
  },
  {
    alias: 'label',
    type: 'string',
    property: 'albumlabel',
    key: 'albumlabel',
    sortOrder: 'asc',
    filterCallback: 'multiple'
  },
  {
    alias: 'Thumbs up',
    type: 'boolean',
    key: 'thumbsUp',
    sortOrder: 'asc',
    filterCallback: 'thumbsup'
  },
  { alias: 'album', type: 'string', key: 'album', sortOrder: 'asc', filterCallback: 'multiple' },
  { alias: 'artist', type: 'array', key: 'artist', sortOrder: 'asc', filterCallback: 'multiple' }
];

export class LibraryFilterStore {
  readonly #storage: StorageLike;

  constructor(storage: StorageLike = browserStorage()) {
    this.#storage = storage;
  }

  setAvailable(path: string, available: LibraryAvailableFilters): LibraryAvailableFilters {
    this.#setStore(path, cloneAvailable(available), 'available');
    return cloneAvailable(available);
  }

  getAvailable(path: string): LibraryAvailableFilters {
    const stored = this.#getStore<LibraryAvailableFilters>(path, 'available');
    return {
      sort: Array.isArray(stored.sort) ? [...stored.sort] : [],
      filter: Array.isArray(stored.filter) ? [...stored.filter] : []
    };
  }

  setStoreFilters(path: string, filters: StoredFilters): StoredFilters {
    const normalized = normalizeFilters(filters);
    this.#setStore(path, normalized, 'filters');
    return normalized;
  }

  getStoreFilters(path: string): StoredFilters {
    return normalizeFilters(this.#getStore<StoredFilters>(path, 'filters'));
  }

  getStoreFiltersKey(path: string, key: string): Array<string | number | boolean> {
    return [...(this.getStoreFilters(path)[key] ?? [])];
  }

  updateStoreFiltersKey(
    path: string,
    key: string,
    values: Array<string | number | boolean> = []
  ): StoredFilters {
    const filters = this.getStoreFilters(path);
    filters[key] = [...values];
    return this.setStoreFilters(path, filters);
  }

  toggleStoreFiltersKey(
    path: string,
    key: string,
    value: string | number | boolean
  ): Array<string | number | boolean> {
    const values = this.getStoreFiltersKey(path, key);
    const next = values.some((entry) => entry === value)
      ? values.filter((entry) => entry !== value)
      : [...values, value];
    this.updateStoreFiltersKey(path, key, next);
    return next;
  }

  setStoreSort(path: string, method: string, order: LibrarySortOrder = 'asc'): LibrarySortState {
    const sort = { method, order };
    this.#setStore(path, sort, 'sort');
    return sort;
  }

  getStoreSort(path: string): LibrarySortState {
    const stored = this.#getStore<Partial<LibrarySortState>>(path, 'sort');
    if (typeof stored.method === 'string' && isSortOrder(stored.order)) {
      return { method: stored.method, order: stored.order };
    }

    const fallback =
      this.getFilterFields(path, 'sort').find((field) => field.defaultSort) ??
      this.getFilterFields(path, 'sort')[0] ??
      LIBRARY_SORT_FIELDS[0];
    return { method: fallback.key, order: fallback.defaultOrder };
  }

  initFromParams(
    path: string,
    available: LibraryAvailableFilters,
    params: URLSearchParams | Record<string, string | undefined>
  ): void {
    const entries =
      params instanceof URLSearchParams
        ? Object.fromEntries(params.entries())
        : Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
    if (Object.keys(entries).length === 0) return;

    this.setAvailable(path, available);
    this.setStoreFilters(path, {});

    if (typeof entries.sort === 'string') {
      this.setStoreSort(path, entries.sort, isSortOrder(entries.order) ? entries.order : 'asc');
    }

    for (const key of available.filter) {
      const rawValues =
        params instanceof URLSearchParams
          ? params.getAll(key)
          : typeof entries[key] === 'string'
            ? [entries[key]]
            : [];
      const values = rawValues.filter((value) => value.length > 0);
      if (values.length === 0) continue;
      const settings = getFilterSettings(key, false);
      this.updateStoreFiltersKey(
        path,
        key,
        values.map((value) =>
          settings?.type === 'number' ? Number.parseInt(value, 10) : decodeURIComponent(value)
        )
      );
    }
  }

  getFilterFields(path: string, type: 'sort'): LibrarySortField[];
  getFilterFields(path: string, type: 'filter'): LibraryFilterField[];
  getFilterFields(
    path: string,
    type: 'sort' | 'filter'
  ): LibrarySortField[] | LibraryFilterField[] {
    const available = this.getAvailable(path)[type];
    if (type === 'sort') {
      return available.flatMap(
        (key) => LIBRARY_SORT_FIELDS.find((field) => field.key === key) ?? []
      );
    }
    return available.flatMap(
      (key) => LIBRARY_FILTER_FIELDS.find((field) => field.key === key) ?? []
    );
  }

  getSortableEntities(path: string): LibraryParsedSortField[] {
    const params = this.getStoreSort(path);
    return this.getFilterFields(path, 'sort').map((field) => ({
      ...field,
      active: field.key === params.method,
      order: field.key === params.method ? toggleOrder(params.order) : field.defaultOrder,
      title: field.alias
    }));
  }

  getFilterableEntities(path: string): LibraryParsedFilterField[] {
    const active = new Set(this.getFilterActive(path).map((item) => item.key));
    return this.getFilterFields(path, 'filter').map((field) => ({
      ...field,
      active: active.has(field.key),
      title: field.alias
    }));
  }

  getFilterActive(path: string): LibraryActiveFilter[] {
    return Object.entries(this.getStoreFilters(path)).map(([key, values]) => ({
      key,
      values: [...values],
      title: values.join(', ')
    }));
  }

  getFilterOptions<T extends Record<string, unknown>>(
    path: string,
    key: string,
    items: readonly T[]
  ): LibraryFilterOption[] {
    const values = this.getStoreFiltersKey(path, key);
    const settings = getFilterSettings(key, false);
    const extracted = uniqueValues(
      items.flatMap((item) => extractFilterValues(item, key, settings))
    ).sort((left, right) => comparePrimitive(left, right, settings?.sortOrder ?? 'asc'));

    return extracted.map((value) => ({
      key,
      value,
      title: String(value),
      active: values.includes(value)
    }));
  }

  applyFilters<T extends Record<string, unknown>>(path: string, items: readonly T[]): T[] {
    const sort = this.getStoreSort(path);
    let result = sortItems(items, sort.method, sort.order);
    for (const [key, values] of Object.entries(this.getStoreFilters(path))) {
      if (values.length === 0) continue;
      result = applySingleFilter(result, key, values, getFilterSettings(key, false));
    }
    return result;
  }

  #setStore<T>(path: string, value: T, type: string): void {
    const bucket = this.#getBucket<T>(type);
    bucket[path] = value;
    this.#storage.setItem(`${FILTER_STORE_PREFIX}${type}`, JSON.stringify(bucket));
  }

  #getStore<T extends object>(path: string, type: string): T {
    const bucket = this.#getBucket<T>(type);
    return bucket[path] ?? ({} as T);
  }

  #getBucket<T>(type: string): StoreBucket<T> {
    const raw = this.#storage.getItem(`${FILTER_STORE_PREFIX}${type}`);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? (parsed as StoreBucket<T>) : {};
    } catch {
      return {};
    }
  }
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

export const libraryFilterStore = new LibraryFilterStore();

function browserStorage(): StorageLike {
  if (typeof localStorage !== 'undefined') return localStorage;
  return createMemoryStorage();
}

function cloneAvailable(available: LibraryAvailableFilters): LibraryAvailableFilters {
  return { sort: [...available.sort], filter: [...available.filter] };
}

function normalizeFilters(value: unknown): StoredFilters {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, values]) => {
      if (!Array.isArray(values)) return [];
      const normalized = values.filter(
        (entry): entry is string | number | boolean =>
          typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean'
      );
      return normalized.length > 0 ? [[key, normalized]] : [];
    })
  );
}

function getFilterSettings(key: string, availableOnly = false): LibraryFilterField | undefined {
  if (availableOnly) return undefined;
  return LIBRARY_FILTER_FIELDS.find((field) => field.key === key);
}

function extractFilterValues(
  item: Record<string, unknown>,
  key: string,
  settings: LibraryFilterField | undefined
): Array<string | number | boolean> {
  const raw = item[key];
  if (settings?.type === 'object' && Array.isArray(raw)) {
    return raw
      .slice(0, 5)
      .map((entry) => (isRecord(entry) && settings.property ? entry[settings.property] : undefined))
      .filter(isPrimitiveFilterValue);
  }
  if (Array.isArray(raw)) return raw.filter(isPrimitiveFilterValue);
  return isPrimitiveFilterValue(raw) ? [raw] : [];
}

function applySingleFilter<T extends Record<string, unknown>>(
  items: readonly T[],
  key: string,
  values: Array<string | number | boolean>,
  settings: LibraryFilterField | undefined
): T[] {
  switch (settings?.filterCallback) {
    case 'unwatched':
      return items.filter((item) => numericValue(item.playcount) === 0 && item.watched !== true);
    case 'watched':
      return items.filter((item) => numericValue(item.playcount) > 0 || item.watched === true);
    case 'inprogress':
      return items.filter((item) => {
        const resume = isRecord(item.resume) ? item.resume : {};
        return numericValue(resume.position) > 0;
      });
    case 'thumbsup':
      return items.filter((item) => item.thumbsUp === true);
    case 'multiple':
    default:
      return items.filter((item) =>
        extractFilterValues(item, key, settings).some((value) => values.includes(value))
      );
  }
}

function sortItems<T extends Record<string, unknown>>(
  items: readonly T[],
  key: string,
  order: LibrarySortOrder
): T[] {
  const result = [...items];
  if (key === 'random') {
    return stableRandomSort(result);
  }
  return result.sort((left, right) =>
    comparePrimitive(sortValue(left[key]), sortValue(right[key]), order)
  );
}

function sortValue(value: unknown): string | number | boolean {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ');
  if (isPrimitiveFilterValue(value)) return value;
  return '';
}

function stableRandomSort<T extends Record<string, unknown>>(items: readonly T[]): T[] {
  return [...items].sort(
    (left, right) => stableHash(JSON.stringify(left)) - stableHash(JSON.stringify(right))
  );
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function uniqueValues(values: Array<string | number | boolean>): Array<string | number | boolean> {
  return [...new Set(values)];
}

function comparePrimitive(
  left: string | number | boolean,
  right: string | number | boolean,
  order: LibrarySortOrder
): number {
  const direction = order === 'desc' ? -1 : 1;
  if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
  return String(left).localeCompare(String(right), undefined, { numeric: true }) * direction;
}

function toggleOrder(order: LibrarySortOrder): LibrarySortOrder {
  return order === 'asc' ? 'desc' : 'asc';
}

function isSortOrder(value: unknown): value is LibrarySortOrder {
  return value === 'asc' || value === 'desc';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitiveFilterValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function numericValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
