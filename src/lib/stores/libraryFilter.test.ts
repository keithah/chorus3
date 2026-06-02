import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import {
  LibraryFilterStore,
  createMemoryStorage,
  type LibraryAvailableFilters
} from './libraryFilter';
import { enrichLibraryFilterRecord } from './libraryFilterRecords';

const available: LibraryAvailableFilters = {
  sort: ['title', 'year', 'dateadded', 'random'],
  filter: ['year', 'genre', 'cast', 'watched', 'unwatched', 'inprogress', 'thumbsUp']
};

function createStore(): LibraryFilterStore {
  return new LibraryFilterStore(createMemoryStorage());
}

describe('LibraryFilterStore', () => {
  it('keeps Kodi record enrichment out of the generic filter store', () => {
    const source = readFileSync('src/lib/stores/libraryFilter.ts', 'utf8');
    expect(source).not.toContain('libraryFilterRecords');
    expect(source).not.toContain('normalizeLibrarySetValue');
  });

  it('stores available filters and returns classic sortable/filterable entity state per route', () => {
    const store = createStore();
    store.setAvailable('music/albums', available);

    expect(store.getSortableEntities('music/albums').map((item) => item.key)).toEqual([
      'title',
      'year',
      'dateadded',
      'random'
    ]);
    expect(store.getSortableEntities('music/albums')[0]).toMatchObject({
      key: 'title',
      active: true,
      order: 'desc',
      title: 'title'
    });

    store.setStoreSort('music/albums', 'year', 'desc');
    expect(
      store.getSortableEntities('music/albums').find((item) => item.key === 'year')
    ).toMatchObject({
      active: true,
      order: 'asc'
    });

    store.updateStoreFiltersKey('music/albums', 'genre', ['Hip Hop']);
    expect(
      store.getFilterableEntities('music/albums').find((item) => item.key === 'genre')
    ).toMatchObject({
      active: true,
      title: 'genre'
    });
    expect(store.getFilterActive('music/albums')).toEqual([
      { key: 'genre', values: ['Hip Hop'], title: 'Hip Hop' }
    ]);
  });

  it('toggles and filters array, object, watched, in-progress, and thumbs-up values like classic', () => {
    const store = createStore();
    store.setAvailable('movies', available);
    const movies = [
      {
        title: 'Bravo',
        year: 2024,
        genre: ['Drama'],
        cast: [{ name: 'Actor One' }],
        playcount: 0,
        resume: { position: 0 },
        thumbsUp: false
      },
      {
        title: 'Alpha',
        year: 2020,
        genre: ['Comedy', 'Drama'],
        cast: [{ name: 'Actor Two' }],
        playcount: 2,
        resume: { position: 12 },
        thumbsUp: true
      }
    ];

    expect(store.toggleStoreFiltersKey('movies', 'genre', 'Comedy')).toEqual(['Comedy']);
    expect(store.applyFilters('movies', movies).map((item) => item.title)).toEqual(['Alpha']);

    store.setStoreFilters('movies', { cast: ['Actor One'] });
    expect(store.applyFilters('movies', movies).map((item) => item.title)).toEqual(['Bravo']);

    const castItems = [
      { title: 'Named Cast', cast: ['Actor Three'] },
      { title: 'Object Cast', cast: [{ name: 'Actor Four' }] }
    ];
    store.setStoreFilters('movies', { cast: ['Actor Three'] });
    expect(store.applyFilters('movies', castItems).map((item) => item.title)).toEqual([
      'Named Cast'
    ]);
    store.setStoreFilters('movies', { cast: ['Actor Four'] });
    expect(store.applyFilters('movies', castItems).map((item) => item.title)).toEqual([
      'Object Cast'
    ]);

    store.setStoreFilters('movies', { watched: ['watched'] });
    expect(store.applyFilters('movies', movies).map((item) => item.title)).toEqual(['Alpha']);

    store.setStoreFilters('movies', { unwatched: ['unwatched'] });
    expect(store.applyFilters('movies', movies).map((item) => item.title)).toEqual(['Bravo']);

    store.setStoreFilters('movies', { inprogress: ['in progress'] });
    expect(store.applyFilters('movies', movies).map((item) => item.title)).toEqual(['Alpha']);

    store.setStoreFilters('movies', { thumbsUp: ['Thumbs up'] });
    expect(store.applyFilters('movies', movies).map((item) => item.title)).toEqual(['Alpha']);

    store.setStoreFilters('movies', { watched: ['watched'] });
    expect(
      store
        .applyFilters('movies', [
          ...movies,
          {
            title: 'Charlie',
            playcount: 0,
            watched: true,
            resume: { position: 0 },
            thumbsUp: false
          }
        ])
        .map((item) => item.title)
    ).toEqual(['Alpha', 'Charlie']);
  });

  it('enriches library records for title, TV watched, and movie set metadata filters', () => {
    expect(enrichLibraryFilterRecord({ label: 'Atlanta' })).toMatchObject({
      label: 'Atlanta',
      title: 'Atlanta'
    });

    expect(
      enrichLibraryFilterRecord({
        label: 'Severance',
        unwatchedEpisodes: 2,
        hasUnwatched: true
      })
    ).toMatchObject({
      watched: false,
      playcount: 0
    });

    expect(
      enrichLibraryFilterRecord({
        title: 'Batman Begins',
        set: { set: 'Batman Collection' }
      })
    ).toMatchObject({
      set: 'Batman Collection'
    });

    const store = createStore();
    store.setAvailable('movies', available);
    store.updateStoreFiltersKey('movies', 'set', ['Batman Collection']);

    expect(
      store.applyFilterPairs(
        'movies',
        [
          { title: 'Batman Begins', set: { set: 'Batman Collection' } },
          { title: 'Other', set: 'Other Collection' }
        ].map((item) => ({ item, record: enrichLibraryFilterRecord(item) }))
      )
    ).toEqual([expect.objectContaining({ title: 'Batman Begins' })]);
  });

  it('builds active option lists and initializes sort/filter values from URL params', () => {
    const store = createStore();
    store.setAvailable('music/top', available);
    store.initFromParams(
      'music/top',
      available,
      new URLSearchParams('sort=year&order=desc&year=2024')
    );

    expect(store.getStoreSort('music/top')).toEqual({ method: 'year', order: 'desc' });
    expect(store.getStoreFilters('music/top')).toEqual({ year: [2024] });

    const options = store.getFilterOptions('music/top', 'year', [
      { title: 'One', year: 2024 },
      { title: 'Two', year: 2020 },
      { title: 'Three', year: 2024 }
    ]);

    expect(options).toEqual([
      { key: 'year', value: 2024, title: '2024', active: true },
      { key: 'year', value: 2020, title: '2020', active: false }
    ]);
  });
});
