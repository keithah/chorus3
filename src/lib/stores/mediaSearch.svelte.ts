import {
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibraryGenres,
  getAudioLibrarySongs,
  getVideoLibraryMovies,
  getVideoLibraryMusicVideos,
  getVideoLibraryTvShows,
  type AudioLibraryAlbumPropertyName,
  type AudioLibraryArtistPropertyName,
  type AudioLibraryGenrePropertyName,
  type AudioLibrarySongPropertyName,
  type KodiJsonRpcHttpClient,
  type VideoLibraryMoviePropertyName,
  type VideoLibraryMusicVideoPropertyName,
  type VideoLibraryTvShowPropertyName
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  MusicLibraryClientError,
  cloneMusicLibraryAlbumSnapshots,
  cloneMusicLibraryArtistSnapshots,
  cloneMusicLibraryGenreSnapshots,
  cloneMusicLibraryLimits,
  cloneMusicLibrarySafeError,
  cloneMusicLibrarySongSnapshots,
  createMusicLibrarySafeError,
  normalizeMusicAlbums,
  normalizeMusicArtists,
  normalizeMusicGenres,
  normalizeMusicLimits,
  normalizeMusicSongs,
  type MusicLibraryAlbumSnapshot,
  type MusicLibraryArtistSnapshot,
  type MusicLibraryGenreSnapshot,
  type MusicLibraryLimitsSnapshot,
  type MusicLibraryRefreshStatus,
  type MusicLibrarySafeErrorSnapshot,
  type MusicLibrarySongSnapshot
} from './musicLibraryNormalization';
import {
  cloneVideoLibraryMovieSnapshots,
  cloneVideoMusicVideoSnapshots,
  cloneVideoTvShowSnapshots,
  normalizeVideoLibraryLimits,
  normalizeVideoMovies,
  normalizeVideoMusicVideos,
  normalizeVideoTvShows,
  type VideoLibraryLimitsSnapshot,
  type VideoLibraryMovieSnapshot,
  type VideoMusicVideoSnapshot,
  type VideoTvShowSnapshot
} from './videoLibraryNormalization';

export type MediaSearchStatus = MusicLibraryRefreshStatus;
export type MediaSearchScope =
  | 'all'
  | 'music'
  | 'video'
  | 'artist'
  | 'album'
  | 'song'
  | 'genre'
  | 'movie'
  | 'tvshow'
  | 'musicvideo';

export interface MediaSearchQuery {
  scope?: MediaSearchScope;
  text: string;
}

export type MediaSearchArtistResult = MusicLibraryArtistSnapshot & { kind: 'artist' };
export type MediaSearchAlbumResult = MusicLibraryAlbumSnapshot & { kind: 'album' };
export type MediaSearchSongResult = MusicLibrarySongSnapshot & { kind: 'song' };
export type MediaSearchGenreResult = MusicLibraryGenreSnapshot & { kind: 'genre' };
export type MediaSearchMovieResult = VideoLibraryMovieSnapshot & { kind: 'movie' };
export type MediaSearchTvShowResult = VideoTvShowSnapshot & { kind: 'tvshow' };
export type MediaSearchMusicVideoResult = VideoMusicVideoSnapshot & { kind: 'musicvideo' };
export type MediaSearchResult =
  | MediaSearchArtistResult
  | MediaSearchAlbumResult
  | MediaSearchSongResult
  | MediaSearchGenreResult
  | MediaSearchMovieResult
  | MediaSearchTvShowResult
  | MediaSearchMusicVideoResult;

export interface MediaSearchResultGroups {
  artists: MediaSearchArtistResult[];
  albums: MediaSearchAlbumResult[];
  songs: MediaSearchSongResult[];
  genres: MediaSearchGenreResult[];
  movies: MediaSearchMovieResult[];
  tvShows: MediaSearchTvShowResult[];
  musicVideos: MediaSearchMusicVideoResult[];
}

export interface MediaSearchResultCounts {
  artists: number;
  albums: number;
  songs: number;
  genres: number;
  movies: number;
  tvShows: number;
  musicVideos: number;
  total: number;
}

export interface MediaSearchStoreSnapshot {
  searchStatus: MediaSearchStatus;
  scope: MediaSearchScope;
  query: string;
  lastUpdatedAt: string | null;
  results: MediaSearchResultGroups;
  limits: {
    artists: MusicLibraryLimitsSnapshot;
    albums: MusicLibraryLimitsSnapshot;
    songs: MusicLibraryLimitsSnapshot;
    genres: MusicLibraryLimitsSnapshot;
    movies: VideoLibraryLimitsSnapshot;
    tvShows: VideoLibraryLimitsSnapshot;
    musicVideos: VideoLibraryLimitsSnapshot;
  };
  resultCounts: MediaSearchResultCounts;
  isEmpty: boolean;
  lastError: MusicLibrarySafeErrorSnapshot | null;
}

export interface MediaSearchStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const EMPTY_LIMITS: MusicLibraryLimitsSnapshot = { start: 0, end: 0, total: 0 };
const SEARCH_LIMIT = { start: 0, end: 25 } as const;
const GENRE_SEARCH_LIMIT = { start: 0, end: 250 } as const;
const LABEL_SORT = { method: 'label', order: 'ascending' } as const;
const TITLE_SORT = { method: 'title', order: 'ascending' } as const;
const MIN_QUERY_LENGTH = 2;

const DEFAULT_ARTIST_PROPERTIES = [
  'thumbnail',
  'genre'
] as const satisfies readonly AudioLibraryArtistPropertyName[];
const DEFAULT_ALBUM_PROPERTIES = [
  'title',
  'artist',
  'year',
  'thumbnail'
] as const satisfies readonly AudioLibraryAlbumPropertyName[];
const DEFAULT_SONG_PROPERTIES = [
  'title',
  'artist',
  'album',
  'duration',
  'track',
  'thumbnail',
  'playcount',
  'lastplayed'
] as const satisfies readonly AudioLibrarySongPropertyName[];
const DEFAULT_GENRE_PROPERTIES = [
  'title',
  'thumbnail'
] as const satisfies readonly AudioLibraryGenrePropertyName[];
const DEFAULT_VIDEO_PROPERTIES = ['title', 'thumbnail', 'year'] as const satisfies readonly (
  | VideoLibraryMoviePropertyName
  | VideoLibraryTvShowPropertyName
)[];
const DEFAULT_MUSIC_VIDEO_PROPERTIES = [
  'title',
  'artist',
  'album',
  'thumbnail',
  'year'
] as const satisfies readonly VideoLibraryMusicVideoPropertyName[];

const EMPTY_RESULT_GROUPS: MediaSearchResultGroups = {
  artists: [],
  albums: [],
  songs: [],
  genres: [],
  movies: [],
  tvShows: [],
  musicVideos: []
};

const EMPTY_RESULT_COUNTS: MediaSearchResultCounts = {
  artists: 0,
  albums: 0,
  songs: 0,
  genres: 0,
  movies: 0,
  tvShows: 0,
  musicVideos: 0,
  total: 0
};

const DEFAULT_SNAPSHOT: MediaSearchStoreSnapshot = {
  searchStatus: 'idle',
  scope: 'all',
  query: '',
  lastUpdatedAt: null,
  results: EMPTY_RESULT_GROUPS,
  limits: {
    artists: EMPTY_LIMITS,
    albums: EMPTY_LIMITS,
    songs: EMPTY_LIMITS,
    genres: EMPTY_LIMITS,
    movies: EMPTY_LIMITS,
    tvShows: EMPTY_LIMITS,
    musicVideos: EMPTY_LIMITS
  },
  resultCounts: EMPTY_RESULT_COUNTS,
  isEmpty: true,
  lastError: null
};

export class MediaSearchStore {
  #snapshot = $state<MediaSearchStoreSnapshot>(cloneMediaSearchSnapshot(DEFAULT_SNAPSHOT));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #now: () => string;

  #requestId = 0;
  #abortController: AbortController | null = null;

  constructor(options: MediaSearchStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): MediaSearchStoreSnapshot {
    return cloneMediaSearchSnapshot(this.#snapshot);
  }

  async search(query: string | MediaSearchQuery): Promise<void> {
    const requestId = ++this.#requestId;
    const normalizedQuery = normalizeSearchQuery(query);
    const signal = this.#startRequest();

    if (normalizedQuery.text.length < MIN_QUERY_LENGTH) {
      this.#abortActiveRequest();
      this.#snapshot = cloneMediaSearchSnapshot(DEFAULT_SNAPSHOT);
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      searchStatus: 'loading',
      scope: normalizedQuery.scope,
      query: normalizedQuery.text,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const includeArtists =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'music' ||
        normalizedQuery.scope === 'artist';
      const includeAlbums =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'music' ||
        normalizedQuery.scope === 'album';
      const includeSongs =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'music' ||
        normalizedQuery.scope === 'song';
      const includeGenres =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'music' ||
        normalizedQuery.scope === 'genre';
      const includeMovies =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'video' ||
        normalizedQuery.scope === 'movie';
      const includeTvShows =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'video' ||
        normalizedQuery.scope === 'tvshow';
      const includeMusicVideos =
        normalizedQuery.scope === 'all' ||
        normalizedQuery.scope === 'video' ||
        normalizedQuery.scope === 'musicvideo';
      const [
        artistsResult,
        albumsResult,
        songsResult,
        genresResult,
        moviesResult,
        tvShowsResult,
        musicVideosResult
      ] = await Promise.all([
        includeArtists
          ? getAudioLibraryArtists(
              client,
              {
                properties: DEFAULT_ARTIST_PROPERTIES,
                limits: SEARCH_LIMIT,
                filter: containsFilter('artist', normalizedQuery.text),
                sort: LABEL_SORT
              },
              { signal }
            )
          : Promise.resolve({ artists: [], limits: EMPTY_LIMITS }),
        includeAlbums
          ? getAudioLibraryAlbums(
              client,
              {
                properties: DEFAULT_ALBUM_PROPERTIES,
                limits: SEARCH_LIMIT,
                filter: containsFilter('album', normalizedQuery.text),
                sort: LABEL_SORT
              },
              { signal }
            )
          : Promise.resolve({ albums: [], limits: EMPTY_LIMITS }),
        includeSongs
          ? getAudioLibrarySongs(
              client,
              {
                properties: DEFAULT_SONG_PROPERTIES,
                limits: SEARCH_LIMIT,
                filter: containsFilter('title', normalizedQuery.text),
                sort: TITLE_SORT
              },
              { signal }
            )
          : Promise.resolve({ songs: [], limits: EMPTY_LIMITS }),
        includeGenres
          ? getAudioLibraryGenres(
              client,
              {
                properties: DEFAULT_GENRE_PROPERTIES,
                limits: GENRE_SEARCH_LIMIT,
                sort: TITLE_SORT
              },
              { signal }
            )
          : Promise.resolve({ genres: [], limits: EMPTY_LIMITS }),
        includeMovies
          ? getVideoLibraryMovies(
              client,
              {
                properties: DEFAULT_VIDEO_PROPERTIES,
                limits: SEARCH_LIMIT,
                filter: containsFilter('title', normalizedQuery.text),
                sort: TITLE_SORT
              },
              { signal }
            )
          : Promise.resolve({ movies: [], limits: EMPTY_LIMITS }),
        includeTvShows
          ? getVideoLibraryTvShows(
              client,
              {
                properties: DEFAULT_VIDEO_PROPERTIES,
                limits: SEARCH_LIMIT,
                filter: containsFilter('title', normalizedQuery.text),
                sort: TITLE_SORT
              },
              { signal }
            )
          : Promise.resolve({ tvshows: [], limits: EMPTY_LIMITS }),
        includeMusicVideos
          ? getVideoLibraryMusicVideos(
              client,
              {
                properties: DEFAULT_MUSIC_VIDEO_PROPERTIES,
                limits: SEARCH_LIMIT,
                filter: containsFilter('title', normalizedQuery.text),
                sort: TITLE_SORT
              },
              { signal }
            )
          : Promise.resolve({ musicvideos: [], limits: EMPTY_LIMITS })
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const artists = withResultKind(normalizeMusicArtists(artistsResult.artists), 'artist');
      const albums = withResultKind(normalizeMusicAlbums(albumsResult.albums), 'album');
      const songs = withResultKind(normalizeMusicSongs(songsResult.songs), 'song');
      const genres = withResultKind(
        normalizeMusicGenres(genresResult.genres).filter((genre) =>
          genreMatchesSearch(genre, normalizedQuery.text)
        ),
        'genre'
      );
      const movies = withResultKind(normalizeVideoMovies(moviesResult.movies), 'movie');
      const tvShows = withResultKind(normalizeVideoTvShows(tvShowsResult.tvshows), 'tvshow');
      const musicVideos = withResultKind(
        normalizeVideoMusicVideos(musicVideosResult.musicvideos),
        'musicvideo'
      );
      const resultCounts = countResults({
        artists,
        albums,
        songs,
        genres,
        movies,
        tvShows,
        musicVideos
      });

      this.#snapshot = {
        searchStatus: 'ready',
        scope: normalizedQuery.scope,
        query: normalizedQuery.text,
        lastUpdatedAt: this.#now(),
        results: { artists, albums, songs, genres, movies, tvShows, musicVideos },
        limits: {
          artists: normalizeMusicLimits(artistsResult.limits, artists),
          albums: normalizeMusicLimits(albumsResult.limits, albums),
          songs: normalizeMusicLimits(songsResult.limits, songs),
          genres: normalizeMusicLimits(
            { start: 0, end: genres.length, total: genres.length },
            genres
          ),
          movies: normalizeVideoLibraryLimits(moviesResult.limits, movies),
          tvShows: normalizeVideoLibraryLimits(tvShowsResult.limits, tvShows),
          musicVideos: normalizeVideoLibraryLimits(musicVideosResult.limits, musicVideos)
        },
        resultCounts,
        isEmpty: resultCounts.total === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        searchStatus: 'error',
        scope: normalizedQuery.scope,
        query: normalizedQuery.text,
        lastUpdatedAt: this.#now(),
        lastError: createMusicLibrarySafeError(error)
      };
    }
  }

  clear(): void {
    this.#requestId += 1;
    this.#abortActiveRequest();
    this.#snapshot = cloneMediaSearchSnapshot(DEFAULT_SNAPSHOT);
  }

  destroy(): void {
    this.#requestId += 1;
    this.#abortActiveRequest();
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new MusicLibraryClientError(
        'client/no-active-host',
        'Kodi HTTP client is not configured for media search.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }

  #startRequest(): AbortSignal {
    this.#abortActiveRequest();
    this.#abortController = new AbortController();
    return this.#abortController.signal;
  }

  #abortActiveRequest(): void {
    this.#abortController?.abort();
    this.#abortController = null;
  }
}

export function createMediaSearchStore(options: MediaSearchStoreOptions = {}): MediaSearchStore {
  return new MediaSearchStore(options);
}

export const mediaSearchStore = createMediaSearchStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

function normalizeSearchQuery(query: string | MediaSearchQuery): Required<MediaSearchQuery> {
  if (typeof query === 'string') {
    return { scope: 'all', text: query.trim() };
  }

  return {
    scope: normalizeMediaSearchScope(query.scope),
    text: query.text.trim()
  };
}

function normalizeMediaSearchScope(scope: unknown): MediaSearchScope {
  return typeof scope === 'string' &&
    [
      'all',
      'music',
      'video',
      'artist',
      'album',
      'song',
      'genre',
      'movie',
      'tvshow',
      'musicvideo'
    ].includes(scope)
    ? (scope as MediaSearchScope)
    : 'all';
}

function containsFilter(
  field: 'artist' | 'album' | 'title',
  value: string
): {
  field: 'artist' | 'album' | 'title';
  operator: 'contains';
  value: string;
} {
  return { field, operator: 'contains', value };
}

function genreMatchesSearch(
  genre: Pick<MusicLibraryGenreSnapshot, 'label' | 'title'>,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return false;
  }

  return [genre.title, genre.label].some(
    (value) => typeof value === 'string' && value.toLocaleLowerCase().includes(normalizedQuery)
  );
}

function withResultKind<TItem extends object, TKind extends MediaSearchResult['kind']>(
  items: readonly TItem[],
  kind: TKind
): (TItem & { kind: TKind })[] {
  return items.map((item) => ({ kind, ...item }));
}

function countResults(results: MediaSearchResultGroups): MediaSearchResultCounts {
  const artists = results.artists.length;
  const albums = results.albums.length;
  const songs = results.songs.length;
  const genres = results.genres.length;
  const movies = results.movies.length;
  const tvShows = results.tvShows.length;
  const musicVideos = results.musicVideos.length;

  return {
    artists,
    albums,
    songs,
    genres,
    movies,
    tvShows,
    musicVideos,
    total: artists + albums + songs + genres + movies + tvShows + musicVideos
  };
}

function cloneMediaSearchSnapshot(snapshot: MediaSearchStoreSnapshot): MediaSearchStoreSnapshot {
  const results = cloneMediaSearchResultGroups(snapshot.results);
  return {
    ...snapshot,
    results,
    limits: {
      artists: cloneMusicLibraryLimits(snapshot.limits.artists),
      albums: cloneMusicLibraryLimits(snapshot.limits.albums),
      songs: cloneMusicLibraryLimits(snapshot.limits.songs),
      genres: cloneMusicLibraryLimits(snapshot.limits.genres),
      movies: normalizeVideoLibraryLimits(snapshot.limits.movies, results.movies),
      tvShows: normalizeVideoLibraryLimits(snapshot.limits.tvShows, results.tvShows),
      musicVideos: normalizeVideoLibraryLimits(snapshot.limits.musicVideos, results.musicVideos)
    },
    resultCounts: { ...snapshot.resultCounts },
    isEmpty: snapshot.resultCounts.total === 0,
    lastError: cloneMusicLibrarySafeError(snapshot.lastError)
  };
}

function cloneMediaSearchResultGroups(results: MediaSearchResultGroups): MediaSearchResultGroups {
  return {
    artists: cloneMusicLibraryArtistSnapshots(results.artists).map((artist) => ({
      kind: 'artist',
      ...artist
    })),
    albums: cloneMusicLibraryAlbumSnapshots(results.albums).map((album) => ({
      kind: 'album',
      ...album
    })),
    songs: cloneMusicLibrarySongSnapshots(results.songs).map((song) => ({
      kind: 'song',
      ...song
    })),
    genres: cloneMusicLibraryGenreSnapshots(results.genres).map((genre) => ({
      kind: 'genre',
      ...genre
    })),
    movies: cloneVideoLibraryMovieSnapshots(results.movies).map((movie) => ({
      kind: 'movie',
      ...movie
    })),
    tvShows: cloneVideoTvShowSnapshots(results.tvShows).map((tvShow) => ({
      kind: 'tvshow',
      ...tvShow
    })),
    musicVideos: cloneVideoMusicVideoSnapshots(results.musicVideos).map((musicVideo) => ({
      kind: 'musicvideo',
      ...musicVideo
    }))
  };
}
