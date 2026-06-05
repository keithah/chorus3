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
  cloneMusicLibrarySnapshot,
  createMusicLibrarySafeError,
  normalizeMusicAlbums,
  normalizeMusicArtists,
  normalizeMusicGenres,
  normalizeMusicLimits,
  normalizeMusicSongs,
  type MusicLibraryLimitsSnapshot,
  type MusicLibraryRefreshReason,
  type MusicLibraryStoreSnapshot
} from './musicLibraryNormalization';
import { DEFAULT_FULL_LIBRARY_PAGE_SIZE, readPagedKodiLibraryList } from './pagedKodiLibrary';

export type {
  MusicLibraryAlbumSnapshot,
  MusicLibraryArtistSnapshot,
  MusicLibraryErrorSource,
  MusicLibraryGenreSnapshot,
  MusicLibraryLimitsSnapshot,
  MusicLibraryRefreshReason,
  MusicLibraryRefreshStatus,
  MusicLibrarySafeErrorSnapshot,
  MusicLibrarySongSnapshot,
  MusicLibraryStoreSnapshot
} from './musicLibraryNormalization';

export interface MusicLibraryStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const DEFAULT_LIMITS: MusicLibraryLimitsSnapshot = { start: 0, end: 0, total: 0 };
const DEFAULT_LIBRARY_LIMIT = { start: 0, end: DEFAULT_FULL_LIBRARY_PAGE_SIZE } as const;
const DEFAULT_RECENT_LIMIT = { start: 0, end: 25 } as const;

const DEFAULT_ARTIST_LIST_PROPERTIES = [
  'thumbnail',
  'genre',
  'mood',
  'style'
] as const satisfies readonly AudioLibraryArtistPropertyName[];
const DEFAULT_ALBUM_LIST_PROPERTIES = [
  'title',
  'artist',
  'year',
  'thumbnail',
  'genre',
  'mood',
  'style',
  'albumlabel',
  'rating',
  'dateadded',
  'playcount'
] as const satisfies readonly AudioLibraryAlbumPropertyName[];
const DEFAULT_SONG_LIST_PROPERTIES = [
  'title',
  'artist',
  'album',
  'duration',
  'track',
  'thumbnail',
  'playcount',
  'lastplayed',
  'dateadded',
  'genre',
  'year',
  'rating',
  'mood'
] as const satisfies readonly AudioLibrarySongPropertyName[];
const DEFAULT_SONG_RECENT_PROPERTIES = [
  'title',
  'artist',
  'album',
  'duration',
  'track',
  'thumbnail',
  'playcount',
  'lastplayed',
  'dateadded',
  'year',
  'rating'
] as const satisfies readonly AudioLibrarySongPropertyName[];
const DEFAULT_GENRE_PROPERTIES = [
  'title',
  'thumbnail'
] as const satisfies readonly AudioLibraryGenrePropertyName[];

const DEFAULT_SNAPSHOT: MusicLibraryStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  artists: [],
  albums: [],
  songs: [],
  recentlyAddedSongs: [],
  recentlyPlayedSongs: [],
  mostPlayedSongs: [],
  genres: [],
  limits: {
    artists: DEFAULT_LIMITS,
    albums: DEFAULT_LIMITS,
    songs: DEFAULT_LIMITS,
    recentlyAddedSongs: DEFAULT_LIMITS,
    recentlyPlayedSongs: DEFAULT_LIMITS,
    mostPlayedSongs: DEFAULT_LIMITS,
    genres: DEFAULT_LIMITS
  },
  isEmpty: true,
  lastError: null
};

export class MusicLibraryStore {
  #snapshot = $state<MusicLibraryStoreSnapshot>(cloneMusicLibrarySnapshot(DEFAULT_SNAPSHOT));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #now: () => string;

  #requestId = 0;
  #abortController: AbortController | null = null;
  #refreshPromise: { reason: MusicLibraryRefreshReason; promise: Promise<void> } | null = null;

  constructor(options: MusicLibraryStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): MusicLibraryStoreSnapshot {
    return cloneMusicLibrarySnapshot(this.#snapshot);
  }

  async refresh(reason: MusicLibraryRefreshReason = 'manual'): Promise<void> {
    if (this.#refreshPromise?.reason === reason) {
      return this.#refreshPromise.promise;
    }

    const promise = this.#refresh(reason);
    this.#refreshPromise = { reason, promise };

    try {
      await promise;
    } finally {
      if (this.#refreshPromise?.promise === promise) {
        this.#refreshPromise = null;
      }
    }
  }

  async #refresh(reason: MusicLibraryRefreshReason): Promise<void> {
    const requestId = ++this.#requestId;
    const signal = this.#startRequest();

    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: reason,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const [
        artistsResult,
        albumsResult,
        songsResult,
        recentlyAddedSongsResult,
        recentlyPlayedSongsResult,
        mostPlayedSongsResult,
        genresResult
      ] = await Promise.all([
        readPagedKodiLibraryList(
          (params, options) => getAudioLibraryArtists(client, params, options),
          {
            properties: DEFAULT_ARTIST_LIST_PROPERTIES,
            limits: DEFAULT_LIBRARY_LIMIT
          },
          'artists',
          { signal }
        ),
        readPagedKodiLibraryList(
          (params, options) => getAudioLibraryAlbums(client, params, options),
          {
            properties: DEFAULT_ALBUM_LIST_PROPERTIES,
            limits: DEFAULT_LIBRARY_LIMIT
          },
          'albums',
          { signal }
        ),
        readPagedKodiLibraryList(
          (params, options) => getAudioLibrarySongs(client, params, options),
          {
            properties: DEFAULT_SONG_LIST_PROPERTIES,
            limits: DEFAULT_LIBRARY_LIMIT
          },
          'songs',
          { signal }
        ),
        getAudioLibrarySongs(
          client,
          {
            properties: DEFAULT_SONG_RECENT_PROPERTIES,
            limits: DEFAULT_RECENT_LIMIT,
            sort: { method: 'dateadded', order: 'descending' }
          },
          { signal }
        ),
        getAudioLibrarySongs(
          client,
          {
            properties: DEFAULT_SONG_RECENT_PROPERTIES,
            limits: DEFAULT_RECENT_LIMIT,
            sort: { method: 'lastplayed', order: 'descending' }
          },
          { signal }
        ),
        getAudioLibrarySongs(
          client,
          {
            properties: DEFAULT_SONG_RECENT_PROPERTIES,
            limits: DEFAULT_RECENT_LIMIT,
            sort: { method: 'playcount', order: 'descending' }
          },
          { signal }
        ),
        readPagedKodiLibraryList(
          (params, options) => getAudioLibraryGenres(client, params, options),
          {
            properties: DEFAULT_GENRE_PROPERTIES,
            limits: DEFAULT_LIBRARY_LIMIT
          },
          'genres',
          { signal }
        )
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const artists = normalizeMusicArtists(artistsResult.artists);
      const albums = normalizeMusicAlbums(albumsResult.albums);
      const songs = normalizeMusicSongs(songsResult.songs);
      const recentlyAddedSongs = normalizeMusicSongs(recentlyAddedSongsResult.songs);
      const recentlyPlayedSongs = normalizeMusicSongs(recentlyPlayedSongsResult.songs);
      const mostPlayedSongs = normalizeMusicSongs(mostPlayedSongsResult.songs);
      const genres = normalizeMusicGenres(genresResult.genres);

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        artists,
        albums,
        songs,
        recentlyAddedSongs,
        recentlyPlayedSongs,
        mostPlayedSongs,
        genres,
        limits: {
          artists: normalizeMusicLimits(artistsResult.limits, artists),
          albums: normalizeMusicLimits(albumsResult.limits, albums),
          songs: normalizeMusicLimits(songsResult.limits, songs),
          recentlyAddedSongs: normalizeMusicLimits(
            recentlyAddedSongsResult.limits,
            recentlyAddedSongs
          ),
          recentlyPlayedSongs: normalizeMusicLimits(
            recentlyPlayedSongsResult.limits,
            recentlyPlayedSongs
          ),
          mostPlayedSongs: normalizeMusicLimits(mostPlayedSongsResult.limits, mostPlayedSongs),
          genres: normalizeMusicLimits(genresResult.limits, genres)
        },
        isEmpty:
          artists.length === 0 &&
          albums.length === 0 &&
          songs.length === 0 &&
          recentlyAddedSongs.length === 0 &&
          recentlyPlayedSongs.length === 0 &&
          mostPlayedSongs.length === 0 &&
          genres.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createMusicLibrarySafeError(error);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: `error:${safeError.code}`,
        lastUpdatedAt: this.#now(),
        lastError: safeError
      };
    }
  }

  destroy(): void {
    this.#requestId += 1;
    this.#refreshPromise = null;
    this.#abortActiveRequest();
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new MusicLibraryClientError(
        'client/no-active-host',
        'Kodi HTTP client is not configured for music library refresh.'
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

export function createMusicLibraryStore(options: MusicLibraryStoreOptions = {}): MusicLibraryStore {
  return new MusicLibraryStore(options);
}

export const musicLibraryStore = createMusicLibraryStore({
  createClient: createActiveKodiJsonRpcHttpClient
});
