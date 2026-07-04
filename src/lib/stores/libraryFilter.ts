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
type FilterOptionValueCache = WeakMap<object, Map<string, Array<string | number | boolean>>>;

export type LibraryFilterPair<T> = {
  item: T;
  record: Record<string, unknown>;
};

function identityFilterRecord<T extends Record<string, unknown>>(item: T): Record<string, unknown> {
  return item;
}

const FILTER_STORE_PREFIX = 'filter:store:';
const FILTER_STORE_PATH_PREFIX = 'filter:store:path:';

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

const LIBRARY_SORT_FIELD_BY_KEY = new Map(LIBRARY_SORT_FIELDS.map((field) => [field.key, field]));
const LIBRARY_FILTER_FIELD_BY_KEY = new Map(
  LIBRARY_FILTER_FIELDS.map((field) => [field.key, field])
);

export class LibraryFilterStore {
  readonly #storage: StorageLike;
  readonly #memoryStore = new Map<string, string>();
  readonly #filterOptionValues = new WeakMap<readonly object[], FilterOptionValueCache>();

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
        values.map((value) => (settings?.type === 'number' ? Number.parseInt(value, 10) : value))
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
      return available.flatMap((key) => LIBRARY_SORT_FIELD_BY_KEY.get(key) ?? []);
    }
    return available.flatMap((key) => LIBRARY_FILTER_FIELD_BY_KEY.get(key) ?? []);
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
    return this.getFilterOptionsFrom(path, key, items, identityFilterRecord);
  }

  getFilterOptionsFrom<TItem extends object>(
    path: string,
    key: string,
    items: readonly TItem[],
    recordFromItem: (item: TItem) => Record<string, unknown>
  ): LibraryFilterOption[] {
    const values = this.getStoreFiltersKey(path, key);
    const activeValues = new Set(values);
    const settings = getFilterSettings(key, false);
    const extracted = this.#getFilterOptionValues(
      items,
      key,
      settings?.sortOrder ?? 'asc',
      recordFromItem
    );

    return extracted.map((value) => ({
      key,
      value,
      title: String(value),
      active: activeValues.has(value)
    }));
  }

  #getFilterOptionValues<TItem extends object>(
    items: readonly TItem[],
    key: string,
    sortOrder: LibrarySortOrder,
    recordFromItem: (item: TItem) => Record<string, unknown>
  ): Array<string | number | boolean> {
    let cache = this.#filterOptionValues.get(items);
    if (!cache) {
      cache = new WeakMap<object, Map<string, Array<string | number | boolean>>>();
      this.#filterOptionValues.set(items, cache);
    }

    let mapperCache = cache.get(recordFromItem);
    if (!mapperCache) {
      mapperCache = new Map<string, Array<string | number | boolean>>();
      cache.set(recordFromItem, mapperCache);
    }

    const cacheKey = `${key}:${sortOrder}`;
    const cached = mapperCache.get(cacheKey);
    if (cached) return cached;

    const settings = getFilterSettings(key, false);
    const extracted = uniqueValues(
      items.flatMap((item) => extractFilterValues(recordFromItem(item), key, settings))
    ).sort((left, right) => comparePrimitive(left, right, sortOrder));
    mapperCache.set(cacheKey, extracted);
    return extracted;
  }

  applyFilters<T extends Record<string, unknown>>(path: string, items: readonly T[]): T[] {
    return this.applyFilterPairs(
      path,
      items.map((item) => ({ item, record: item }))
    );
  }

  applyFilterPairs<T>(path: string, items: readonly LibraryFilterPair<T>[]): T[] {
    const sort = this.getStoreSort(path);
    let result = [...items];
    for (const [key, values] of Object.entries(this.getStoreFilters(path))) {
      if (values.length === 0) continue;
      result = applySingleFilter(result, key, values, getFilterSettings(key, false));
    }
    return sortFilterPairs(result, sort.method, sort.order).map((pair) => pair.item);
  }

  #setStore<T>(path: string, value: T, type: string): void {
    const key = this.#pathStorageKey(type, path);
    const serialized = JSON.stringify(value);
    this.#memoryStore.set(key, serialized);

    try {
      this.#storage.setItem(key, serialized);
    } catch {
      // Browser storage can be disabled or full; keep in-memory filters usable.
    }
  }

  #getStore<T extends object>(path: string, type: string): T {
    const key = this.#pathStorageKey(type, path);
    let raw = this.#memoryStore.get(key) ?? null;
    if (raw === null) {
      raw = this.#getStorageItem(key);
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return isRecord(parsed) ? (parsed as T) : ({} as T);
      } catch {
        return {} as T;
      }
    }

    return this.#getLegacyBucket<T>(type)[path] ?? ({} as T);
  }

  #getLegacyBucket<T>(type: string): StoreBucket<T> {
    const raw = this.#getStorageItem(`${FILTER_STORE_PREFIX}${type}`);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? (parsed as StoreBucket<T>) : {};
    } catch {
      return {};
    }
  }

  #getStorageItem(key: string): string | null {
    try {
      return this.#storage.getItem(key);
    } catch {
      return null;
    }
  }

  #pathStorageKey(type: string, path: string): string {
    return `${FILTER_STORE_PATH_PREFIX}${type}:${encodeURIComponent(path)}`;
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
    return raw.slice(0, 5).flatMap((entry) => {
      if (typeof entry === 'string') {
        return isPrimitiveFilterValue(entry) ? [entry] : [];
      }
      if (!isRecord(entry) || !settings.property) {
        return [];
      }
      const value = entry[settings.property];
      return isPrimitiveFilterValue(value) ? [value] : [];
    });
  }
  if (Array.isArray(raw)) return raw.filter(isPrimitiveFilterValue);
  return isPrimitiveFilterValue(raw) ? [raw] : [];
}

function applySingleFilter<T>(
  items: readonly LibraryFilterPair<T>[],
  key: string,
  values: Array<string | number | boolean>,
  settings: LibraryFilterField | undefined
): LibraryFilterPair<T>[] {
  switch (settings?.filterCallback) {
    case 'unwatched':
      return items.filter(
        ({ record }) => numericValue(record.playcount) === 0 && record.watched !== true
      );
    case 'watched':
      return items.filter(
        ({ record }) => numericValue(record.playcount) > 0 || record.watched === true
      );
    case 'inprogress':
      return items.filter(({ record }) => {
        const resume = isRecord(record.resume) ? record.resume : {};
        const position = numericValue(resume.position);
        const total = numericValue(resume.total);
        return position > 0 && (total <= 0 || position < total);
      });
    case 'thumbsup':
      return items.filter(({ record }) => record.thumbsUp === true);
    case 'multiple':
    default: {
      const selected = new Set(values);
      return items.filter(({ record }) =>
        extractFilterValues(record, key, settings).some((value) => selected.has(value))
      );
    }
  }
}

function sortFilterPairs<T>(
  items: readonly LibraryFilterPair<T>[],
  key: string,
  order: LibrarySortOrder
): LibraryFilterPair<T>[] {
  const result = [...items];
  if (key === 'random') {
    return stableRandomSort(result, (pair) => stableRandomSortKey(pair.record));
  }
  return result
    .map((pair) => ({ pair, sortKey: sortValue(pair.record[key], pair.record.label) }))
    .sort((left, right) => comparePrimitive(left.sortKey, right.sortKey, order))
    .map(({ pair }) => pair);
}

function sortValue(value: unknown, fallbackLabel?: unknown): string | number | boolean {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ');
  if (isPrimitiveFilterValue(value)) return value;
  if (typeof fallbackLabel === 'string' && fallbackLabel.trim()) return fallbackLabel;
  return '';
}

function stableRandomSort<T>(items: readonly T[], keyForItem: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, hash: stableHash(keyForItem(item)) }))
    .sort((left, right) => left.hash - right.hash)
    .map(({ item }) => item);
}

function stableRandomSortKey(record: Record<string, unknown>): string {
  for (const key of [
    'songid',
    'albumid',
    'artistid',
    'movieid',
    'tvshowid',
    'episodeid',
    'musicvideoid',
    'id',
    'file',
    'path',
    'label',
    'title'
  ]) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return `${key}:${value}`;
    }
  }
  return Object.keys(record).sort().join('|');
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
