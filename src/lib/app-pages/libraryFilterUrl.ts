import type { LibraryAvailableFilters, LibrarySortState } from '$lib/stores/libraryFilter';

export type LibraryFilterValues = Record<string, Array<string | number | boolean>>;

export type LibraryFilterUrlSyncInput = {
  routeHref: string;
  availableFilters: LibraryAvailableFilters;
  filters: LibraryFilterValues;
  sort: LibrarySortState;
  history?: Pick<History, 'replaceState'>;
};

export function currentLibraryFilterSearchParams(location: Location | null): URLSearchParams {
  if (!location) {
    return new URLSearchParams();
  }

  const hash = location.hash;
  if (hash.includes('?')) {
    return new URLSearchParams(hash.slice(hash.indexOf('?') + 1));
  }

  return new URLSearchParams(location.search);
}

export function buildLibraryFilterHref(input: LibraryFilterUrlSyncInput): string {
  const params = new URLSearchParams();
  params.set('sort', input.sort.method);
  params.set('order', input.sort.order);

  for (const key of input.availableFilters.filter) {
    for (const value of input.filters[key] ?? []) {
      params.append(key, String(value));
    }
  }

  const query = params.toString();
  const baseHref = input.routeHref.split('?', 1)[0] ?? input.routeHref;
  return query ? `${baseHref}?${query}` : baseHref;
}

export function replaceLibraryFilterUrl(input: LibraryFilterUrlSyncInput): void {
  input.history?.replaceState({}, '', buildLibraryFilterHref(input));
}
