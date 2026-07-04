import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { LibraryAvailableFilters } from '$lib/stores/libraryFilter';
import { libraryFilterRecordFrom } from '$lib/stores/libraryFilterRecords';
import type { MusicLibraryStoreSnapshot } from '$lib/stores/musicLibrary.svelte';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
import { videoLibraryDetailIndexes } from '$lib/stores/videoLibraryIndexes';
import { findMovieSnapshot } from './libraryMovieCards';

export type LibraryRouteFamily = 'music' | 'movies' | 'tv';
export type LibraryNavItem = { label: string; route: LibraryRoute; active: boolean };
export type LibraryRoute = Extract<
  PrimaryRoute,
  | { kind: 'home' }
  | { kind: 'music' }
  | { kind: 'musicTop' }
  | { kind: 'musicArtists' }
  | { kind: 'musicAlbums' }
  | { kind: 'musicGenres' }
  | { kind: 'musicVideos' }
  | { kind: 'musicVideoDetail' }
  | { kind: 'musicAlbumDetail' }
  | { kind: 'musicArtistDetail' }
  | { kind: 'musicGenreDetail' }
  | { kind: 'movies' }
  | { kind: 'moviesRecent' }
  | { kind: 'movieDetail' }
  | { kind: 'tvshows' }
  | { kind: 'tvshowsRecent' }
  | { kind: 'tvshowDetail' }
  | { kind: 'tvshowSeasonDetail' }
  | { kind: 'tvshowEpisodeDetail' }
>;

type LibraryRouteKind = LibraryRoute['kind'];
type LibraryOptionSourceOwner = 'music' | 'video';
type LibraryRoutePolicyBase = {
  family: LibraryRouteFamily;
  filters: LibraryAvailableFilters;
};
type LibraryRoutePolicy =
  | (LibraryRoutePolicyBase & {
      optionSource?: undefined;
      optionSourceOwner?: undefined;
    })
  | (LibraryRoutePolicyBase & {
      optionSourceOwner: LibraryOptionSourceOwner;
      optionSource: (
        music: MusicLibraryStoreSnapshot,
        video: VideoLibraryStoreSnapshot
      ) => readonly object[];
    });

const optionSourceCache = new WeakMap<object, Map<LibraryRouteKind, readonly object[]>>();

const MUSIC_ALBUM_FILTERS: LibraryAvailableFilters = {
  sort: ['label', 'year', 'rating', 'artist', 'dateadded', 'random'],
  filter: ['year', 'genre', 'style', 'albumlabel', 'thumbsUp']
};

const MUSIC_SONG_FILTERS: LibraryAvailableFilters = {
  sort: ['title', 'artist', 'album', 'year', 'dateadded', 'random'],
  filter: ['artist', 'album', 'genre', 'year', 'thumbsUp']
};

const MOVIE_FILTERS: LibraryAvailableFilters = {
  sort: ['title', 'year', 'dateadded', 'rating', 'random'],
  filter: [
    'year',
    'genre',
    'writer',
    'director',
    'cast',
    'set',
    'unwatched',
    'watched',
    'inprogress',
    'mpaa',
    'studio',
    'thumbsUp',
    'tag'
  ]
};

const TV_SHOW_FILTERS: LibraryAvailableFilters = {
  sort: ['title', 'year', 'dateadded', 'rating', 'random'],
  filter: [
    'year',
    'genre',
    'unwatched',
    'watched',
    'inprogress',
    'cast',
    'mpaa',
    'studio',
    'thumbsUp',
    'tag'
  ]
};

const ROUTE_POLICIES: Record<LibraryRouteKind, LibraryRoutePolicy> = {
  home: {
    family: 'music',
    filters: MUSIC_ALBUM_FILTERS,
    optionSourceOwner: 'music',
    optionSource: (music) => music.albums
  },
  music: {
    family: 'music',
    filters: MUSIC_ALBUM_FILTERS,
    optionSourceOwner: 'music',
    optionSource: (music) => music.albums
  },
  musicTop: {
    family: 'music',
    filters: MUSIC_SONG_FILTERS,
    optionSourceOwner: 'music',
    optionSource: (music) => music.songs
  },
  musicArtists: {
    family: 'music',
    filters: { sort: ['label', 'random'], filter: ['mood', 'genre', 'style', 'thumbsUp'] },
    optionSourceOwner: 'music',
    optionSource: (music) => music.artists
  },
  musicAlbums: {
    family: 'music',
    filters: MUSIC_ALBUM_FILTERS,
    optionSourceOwner: 'music',
    optionSource: (music) => music.albums
  },
  musicGenres: { family: 'music', filters: { sort: ['title'], filter: [] } },
  musicVideos: {
    family: 'music',
    filters: {
      sort: ['label', 'year', 'artist', 'album'],
      filter: ['studio', 'director', 'artist', 'album', 'year']
    },
    optionSourceOwner: 'video',
    optionSource: (_music, video) => video.musicVideos ?? []
  },
  musicVideoDetail: {
    family: 'music',
    filters: {
      sort: ['label', 'year', 'artist', 'album'],
      filter: ['studio', 'director', 'artist', 'album', 'year']
    },
    optionSourceOwner: 'video',
    optionSource: (_music, video) => video.musicVideos ?? []
  },
  musicAlbumDetail: {
    family: 'music',
    filters: MUSIC_SONG_FILTERS,
    optionSourceOwner: 'music',
    optionSource: (music) => music.songs
  },
  musicArtistDetail: {
    family: 'music',
    filters: MUSIC_SONG_FILTERS,
    optionSourceOwner: 'music',
    optionSource: (music) => music.songs
  },
  musicGenreDetail: {
    family: 'music',
    filters: { sort: ['title'], filter: [] }
  },
  movies: {
    family: 'movies',
    filters: MOVIE_FILTERS,
    optionSourceOwner: 'video',
    optionSource: (_music, video) => [...video.movies, ...video.recentlyPlayedMovies]
  },
  moviesRecent: {
    family: 'movies',
    filters: MOVIE_FILTERS,
    optionSourceOwner: 'video',
    optionSource: (_music, video) => video.recentlyAddedMovies
  },
  movieDetail: {
    family: 'movies',
    filters: MOVIE_FILTERS
  },
  tvshows: {
    family: 'tv',
    filters: TV_SHOW_FILTERS,
    optionSourceOwner: 'video',
    optionSource: (_music, video) => video.tvShows
  },
  tvshowsRecent: {
    family: 'tv',
    filters: {
      sort: ['title', 'dateadded', 'random'],
      filter: ['unwatched', 'watched', 'inprogress', 'thumbsUp']
    },
    optionSourceOwner: 'video',
    optionSource: (_music, video) => [
      ...video.recentlyAddedEpisodes,
      ...video.recentlyPlayedEpisodes
    ]
  },
  tvshowDetail: {
    family: 'tv',
    filters: TV_SHOW_FILTERS
  },
  tvshowSeasonDetail: {
    family: 'tv',
    filters: TV_SHOW_FILTERS
  },
  tvshowEpisodeDetail: {
    family: 'tv',
    filters: TV_SHOW_FILTERS
  }
};

const FAMILY_NAV: Record<LibraryRouteFamily, readonly Omit<LibraryNavItem, 'active'>[]> = {
  movies: [
    { label: 'Movies', route: { kind: 'moviesRecent' } },
    { label: 'All movies', route: { kind: 'movies' } }
  ],
  tv: [
    { label: 'TV shows', route: { kind: 'tvshowsRecent' } },
    { label: 'All TV shows', route: { kind: 'tvshows' } }
  ],
  music: [
    { label: 'Music', route: { kind: 'music' } },
    { label: 'Genres', route: { kind: 'musicGenres' } },
    { label: 'Top music', route: { kind: 'musicTop' } },
    { label: 'Artists', route: { kind: 'musicArtists' } },
    { label: 'Albums', route: { kind: 'musicAlbums' } },
    { label: 'Videos', route: { kind: 'musicVideos' } }
  ]
};

export function isLibraryRoute(value: PrimaryRoute): value is LibraryRoute {
  return value.kind in ROUTE_POLICIES;
}

export function routeFamily(value: LibraryRoute): LibraryRouteFamily {
  return policyFor(value).family;
}

export function sectionNav(value: LibraryRoute): LibraryNavItem[] {
  return FAMILY_NAV[routeFamily(value)].map((item) => ({
    ...item,
    active: isNavRouteActive(value, item.route)
  }));
}

export function routeFilterPath(value: LibraryRoute): string {
  switch (value.kind) {
    case 'home':
      return 'music';
    case 'musicVideoDetail':
      return `music/videos/${value.musicvideoid}`;
    case 'musicAlbumDetail':
      return `music/albums/${value.albumid}`;
    case 'musicArtistDetail':
      return `music/artists/${value.artistid}`;
    case 'musicGenreDetail':
      return `music/genres/${value.genreid}`;
    case 'movieDetail':
      return `movies/${value.movieid}`;
    case 'tvshowDetail':
      return `tvshows/${value.tvshowid}`;
    case 'tvshowSeasonDetail':
      return `tvshows/${value.tvshowid}/seasons/${value.season}`;
    case 'tvshowEpisodeDetail':
      return `tvshows/${value.tvshowid}/episodes/${value.episodeid}`;
    default:
      return value.kind;
  }
}

export function availableFiltersForRoute(value: LibraryRoute): LibraryAvailableFilters {
  return policyFor(value).filters;
}

export function optionItemsForRoute(
  value: LibraryRoute,
  music: MusicLibraryStoreSnapshot,
  video: VideoLibraryStoreSnapshot
): Record<string, unknown>[] {
  const source = optionSourceForRoute(value, music, video);
  return source.map((item) => libraryFilterRecordFrom(item));
}

export function optionSourceForRoute(
  value: LibraryRoute,
  music: MusicLibraryStoreSnapshot,
  video: VideoLibraryStoreSnapshot
): readonly object[] {
  if (value.kind === 'movieDetail') {
    const movieid = Number(value.movieid);
    const movie = findMovieSnapshot(video, movieid);
    return movie ? [movie] : [];
  }

  if (value.kind === 'tvshowDetail') {
    const tvshowid = Number(value.tvshowid);
    const show = videoLibraryDetailIndexes(video).tvShowsById.get(tvshowid);
    return show ? [show] : [];
  }

  return cachedOptionSource(value.kind, music, video);
}

function cachedOptionSource(
  kind: LibraryRouteKind,
  music: MusicLibraryStoreSnapshot,
  video: VideoLibraryStoreSnapshot
): readonly object[] {
  const policy = ROUTE_POLICIES[kind];
  if (!policy.optionSource) return [];

  const sourceOwner = policy.optionSourceOwner === 'music' ? music : video;
  let cache = optionSourceCache.get(sourceOwner);
  if (!cache) {
    cache = new Map();
    optionSourceCache.set(sourceOwner, cache);
  }

  const cached = cache.get(kind);
  if (cached) return cached;

  const source = policy.optionSource(music, video);
  cache.set(kind, source);
  return source;
}

function policyFor(route: LibraryRoute): LibraryRoutePolicy {
  return ROUTE_POLICIES[route.kind];
}

function isNavRouteActive(current: LibraryRoute, navRoute: LibraryRoute): boolean {
  const currentFamily = routeFamily(current);
  if (currentFamily !== routeFamily(navRoute)) return false;

  if (navRoute.kind === 'music') return current.kind === 'music' || current.kind === 'home';
  if (navRoute.kind === 'musicGenres') {
    return current.kind === 'musicGenres' || current.kind === 'musicGenreDetail';
  }
  if (navRoute.kind === 'musicArtists') {
    return current.kind === 'musicArtists' || current.kind === 'musicArtistDetail';
  }
  if (navRoute.kind === 'musicAlbums') {
    return current.kind === 'musicAlbums' || current.kind === 'musicAlbumDetail';
  }
  if (navRoute.kind === 'musicVideos') {
    return current.kind === 'musicVideos' || current.kind === 'musicVideoDetail';
  }
  if (navRoute.kind === 'movies')
    return current.kind === 'movies' || current.kind === 'movieDetail';
  if (navRoute.kind === 'tvshows') {
    return (
      current.kind === 'tvshows' ||
      current.kind === 'tvshowDetail' ||
      current.kind === 'tvshowSeasonDetail' ||
      current.kind === 'tvshowEpisodeDetail'
    );
  }
  return current.kind === navRoute.kind;
}
