import { describe, expect, it } from 'vitest';

import {
  availableFiltersForRoute,
  optionItemsForRoute,
  routeFamily,
  routeFilterPath,
  sectionNav
} from './libraryRouteFilters';

const musicSnapshot = {
  albums: [{ albumid: 7, label: 'Kind of Blue', genre: ['Jazz'], year: 1959 }],
  artists: [{ artistid: 9, label: 'Miles Davis', genre: ['Jazz'] }],
  songs: [{ songid: 11, title: 'So What', artist: ['Miles Davis'], album: 'Kind of Blue' }]
};

const videoSnapshot = {
  movies: [{ movieid: 42, title: 'Tomorrowland', genre: ['Adventure'], year: 2015 }],
  recentlyAddedMovies: [{ movieid: 43, title: 'Big Buck Bunny', genre: ['Animation'] }],
  recentlyPlayedMovies: [{ movieid: 44, title: 'Watched Movie', genre: ['Drama'] }],
  tvShows: [{ tvshowid: 5, title: 'American Gods', genre: ['Fantasy'] }],
  recentlyAddedEpisodes: [{ episodeid: 50, title: 'Pilot', tvshowid: 5 }],
  recentlyPlayedEpisodes: [{ episodeid: 51, title: 'Replay', tvshowid: 5 }],
  musicVideos: [{ musicvideoid: 12, title: 'Video', artist: ['Artist'] }]
};

describe('library route filters', () => {
  it('maps primary library routes to their family, filter path, and active navigation item', () => {
    const route = { kind: 'tvshowSeasonDetail', tvshowid: '5', season: '2' } as const;

    expect(routeFamily(route)).toBe('tv');
    expect(routeFilterPath(route)).toBe('tvshows/5/seasons/2');
    expect(sectionNav(route)).toEqual([
      { label: 'TV shows', route: { kind: 'tvshowsRecent' }, active: false },
      { label: 'All TV shows', route: { kind: 'tvshows' }, active: true }
    ]);
  });

  it('uses table-driven filter sets for music, movies, and TV route families', () => {
    expect(availableFiltersForRoute({ kind: 'musicAlbumDetail', albumid: '7' })).toMatchObject({
      sort: expect.arrayContaining(['title', 'artist', 'album']),
      filter: expect.arrayContaining(['artist', 'album', 'genre'])
    });
    expect(availableFiltersForRoute({ kind: 'movies' })).toMatchObject({
      sort: expect.arrayContaining(['title', 'year', 'rating']),
      filter: expect.arrayContaining(['director', 'cast', 'thumbsUp'])
    });
    expect(availableFiltersForRoute({ kind: 'tvshowsRecent' })).toMatchObject({
      sort: expect.arrayContaining(['title', 'dateadded']),
      filter: expect.arrayContaining(['unwatched', 'watched', 'inprogress'])
    });
  });

  it('collects option records from the canonical library snapshot for each route', () => {
    expect(
      optionItemsForRoute(
        { kind: 'movieDetail', movieid: '42' },
        musicSnapshot as never,
        videoSnapshot as never
      ).map((item) => item.title)
    ).toEqual(['Tomorrowland']);
    expect(
      optionItemsForRoute(
        { kind: 'tvshowsRecent' },
        musicSnapshot as never,
        videoSnapshot as never
      ).map((item) => item.title)
    ).toEqual(['Pilot', 'Replay']);
    expect(
      optionItemsForRoute(
        { kind: 'musicArtists' },
        musicSnapshot as never,
        videoSnapshot as never
      ).map((item) => item.label)
    ).toEqual(['Miles Davis']);
  });

  it('preserves canonical movie collection precedence when duplicate ids exist', () => {
    expect(
      optionItemsForRoute(
        { kind: 'movieDetail', movieid: '42' },
        musicSnapshot as never,
        {
          ...videoSnapshot,
          recentlyAddedMovies: [{ movieid: 42, title: 'Duplicate recently added' }],
          recentlyPlayedMovies: [{ movieid: 42, title: 'Duplicate recently played' }]
        } as never
      ).map((item) => item.title)
    ).toEqual(['Tomorrowland']);
  });
});
