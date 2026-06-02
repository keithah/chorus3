import { describe, expect, it } from 'vitest';

import {
  buildLibraryFilterHref,
  currentLibraryFilterSearchParams,
  replaceLibraryFilterUrl
} from './libraryFilterUrl';

describe('library filter URL helpers', () => {
  it('reads filter params from hash routes before falling back to search', () => {
    const hashLocation = {
      hash: '#/movies?sort=title&genre=Adventure',
      search: '?sort=year'
    } as Location;
    const searchLocation = { hash: '#/movies', search: '?sort=year' } as Location;

    expect(currentLibraryFilterSearchParams(hashLocation).get('genre')).toBe('Adventure');
    expect(currentLibraryFilterSearchParams(hashLocation).get('sort')).toBe('title');
    expect(currentLibraryFilterSearchParams(searchLocation).get('sort')).toBe('year');
    expect([...currentLibraryFilterSearchParams(null).keys()]).toEqual([]);
  });

  it('builds stable filter hrefs from available filter keys only', () => {
    expect(
      buildLibraryFilterHref({
        routeHref: '#/movies?old=value',
        availableFilters: { sort: ['title'], filter: ['genre', 'year'] },
        sort: { method: 'title', order: 'asc' },
        filters: {
          genre: ['Adventure', 'Animation'],
          year: [2015],
          ignored: ['hidden']
        }
      })
    ).toBe('#/movies?sort=title&order=asc&genre=Adventure&genre=Animation&year=2015');
  });

  it('replaces the browser URL through an injected history object', () => {
    const calls: unknown[][] = [];

    replaceLibraryFilterUrl({
      routeHref: '#/music',
      availableFilters: { sort: ['label'], filter: [] },
      sort: { method: 'label', order: 'desc' },
      filters: {},
      history: {
        replaceState: (...args: unknown[]) => {
          calls.push(args);
        }
      } as Pick<History, 'replaceState'>
    });

    expect(calls).toEqual([[{}, '', '#/music?sort=label&order=desc']]);
  });
});
