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
const DEFAULT_LIST_LIMIT = { start: 0, end: 25 } as const;

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

const DEFAULT_SNAPSHOT: MusicLibraryStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  artists: [],
  albums: [],
  songs: [],
  genres: [],
  limits: {
    artists: DEFAULT_LIMITS,
    albums: DEFAULT_LIMITS,
    songs: DEFAULT_LIMITS,
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

  constructor(options: MusicLibraryStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): MusicLibraryStoreSnapshot {
    return cloneMusicLibrarySnapshot(this.#snapshot);
  }

  async refresh(reason: MusicLibraryRefreshReason = 'manual'): Promise<void> {
    const requestId = ++this.#requestId;

    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: reason,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const [artistsResult, albumsResult, songsResult, genresResult] = await Promise.all([
        getAudioLibraryArtists(client, {
          properties: DEFAULT_ARTIST_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        }),
        getAudioLibraryAlbums(client, {
          properties: DEFAULT_ALBUM_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        }),
        getAudioLibrarySongs(client, {
          properties: DEFAULT_SONG_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        }),
        getAudioLibraryGenres(client, {
          properties: DEFAULT_GENRE_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        })
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const artists = normalizeMusicArtists(artistsResult.artists);
      const albums = normalizeMusicAlbums(albumsResult.albums);
      const songs = normalizeMusicSongs(songsResult.songs);
      const genres = normalizeMusicGenres(genresResult.genres);

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        artists,
        albums,
        songs,
        genres,
        limits: {
          artists: normalizeMusicLimits(artistsResult.limits, artists),
          albums: normalizeMusicLimits(albumsResult.limits, albums),
          songs: normalizeMusicLimits(songsResult.limits, songs),
          genres: normalizeMusicLimits(genresResult.limits, genres)
        },
        isEmpty:
          artists.length === 0 && albums.length === 0 && songs.length === 0 && genres.length === 0,
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
}

export function createMusicLibraryStore(options: MusicLibraryStoreOptions = {}): MusicLibraryStore {
  return new MusicLibraryStore(options);
}

export const musicLibraryStore = createMusicLibraryStore({
  createClient: createActiveKodiJsonRpcHttpClient
});
