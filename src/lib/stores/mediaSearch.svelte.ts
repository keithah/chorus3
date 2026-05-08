import {
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibraryGenres,
  getAudioLibrarySongs,
  type AudioLibraryAlbumPropertyName,
  type AudioLibraryArtistPropertyName,
  type AudioLibraryGenrePropertyName,
  type AudioLibrarySongPropertyName,
  type KodiJsonRpcHttpClient
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

export type MediaSearchStatus = MusicLibraryRefreshStatus;
export type MediaSearchScope = 'music';

export interface MediaSearchQuery {
  scope?: MediaSearchScope;
  text: string;
}

export type MediaSearchArtistResult = MusicLibraryArtistSnapshot & { kind: 'artist' };
export type MediaSearchAlbumResult = MusicLibraryAlbumSnapshot & { kind: 'album' };
export type MediaSearchSongResult = MusicLibrarySongSnapshot & { kind: 'song' };
export type MediaSearchGenreResult = MusicLibraryGenreSnapshot & { kind: 'genre' };
export type MediaSearchResult =
  | MediaSearchArtistResult
  | MediaSearchAlbumResult
  | MediaSearchSongResult
  | MediaSearchGenreResult;

export interface MediaSearchResultGroups {
  artists: MediaSearchArtistResult[];
  albums: MediaSearchAlbumResult[];
  songs: MediaSearchSongResult[];
  genres: MediaSearchGenreResult[];
}

export interface MediaSearchResultCounts {
  artists: number;
  albums: number;
  songs: number;
  genres: number;
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

const EMPTY_RESULT_GROUPS: MediaSearchResultGroups = {
  artists: [],
  albums: [],
  songs: [],
  genres: []
};

const EMPTY_RESULT_COUNTS: MediaSearchResultCounts = {
  artists: 0,
  albums: 0,
  songs: 0,
  genres: 0,
  total: 0
};

const DEFAULT_SNAPSHOT: MediaSearchStoreSnapshot = {
  searchStatus: 'idle',
  scope: 'music',
  query: '',
  lastUpdatedAt: null,
  results: EMPTY_RESULT_GROUPS,
  limits: {
    artists: EMPTY_LIMITS,
    albums: EMPTY_LIMITS,
    songs: EMPTY_LIMITS,
    genres: EMPTY_LIMITS
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

    if (normalizedQuery.text.length < MIN_QUERY_LENGTH) {
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
      const [artistsResult, albumsResult, songsResult, genresResult] = await Promise.all([
        getAudioLibraryArtists(client, {
          properties: DEFAULT_ARTIST_PROPERTIES,
          limits: SEARCH_LIMIT,
          filter: containsFilter('artist', normalizedQuery.text),
          sort: LABEL_SORT
        }),
        getAudioLibraryAlbums(client, {
          properties: DEFAULT_ALBUM_PROPERTIES,
          limits: SEARCH_LIMIT,
          filter: containsFilter('album', normalizedQuery.text),
          sort: LABEL_SORT
        }),
        getAudioLibrarySongs(client, {
          properties: DEFAULT_SONG_PROPERTIES,
          limits: SEARCH_LIMIT,
          filter: containsFilter('title', normalizedQuery.text),
          sort: TITLE_SORT
        }),
        getAudioLibraryGenres(client, {
          properties: DEFAULT_GENRE_PROPERTIES,
          limits: GENRE_SEARCH_LIMIT,
          sort: TITLE_SORT
        })
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
      const resultCounts = countResults({ artists, albums, songs, genres });

      this.#snapshot = {
        searchStatus: 'ready',
        scope: normalizedQuery.scope,
        query: normalizedQuery.text,
        lastUpdatedAt: this.#now(),
        results: { artists, albums, songs, genres },
        limits: {
          artists: normalizeMusicLimits(artistsResult.limits, artists),
          albums: normalizeMusicLimits(albumsResult.limits, albums),
          songs: normalizeMusicLimits(songsResult.limits, songs),
          genres: normalizeMusicLimits(
            { start: 0, end: genres.length, total: genres.length },
            genres
          )
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
    this.#snapshot = cloneMediaSearchSnapshot(DEFAULT_SNAPSHOT);
  }

  destroy(): void {
    this.#requestId += 1;
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
}

export function createMediaSearchStore(options: MediaSearchStoreOptions = {}): MediaSearchStore {
  return new MediaSearchStore(options);
}

export const mediaSearchStore = createMediaSearchStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

function normalizeSearchQuery(query: string | MediaSearchQuery): Required<MediaSearchQuery> {
  if (typeof query === 'string') {
    return { scope: 'music', text: query.trim() };
  }

  return {
    scope: query.scope ?? 'music',
    text: query.text.trim()
  };
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

  return {
    artists,
    albums,
    songs,
    genres,
    total: artists + albums + songs + genres
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
      genres: cloneMusicLibraryLimits(snapshot.limits.genres)
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
    }))
  };
}
