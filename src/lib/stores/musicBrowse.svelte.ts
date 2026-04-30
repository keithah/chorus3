import {
  getAudioLibraryAlbums,
  getAudioLibrarySongs,
  type AudioLibraryAlbumPropertyName,
  type AudioLibrarySongPropertyName,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  MusicLibraryClientError,
  cloneMusicLibraryAlbumSnapshots,
  cloneMusicLibraryLimits,
  cloneMusicLibrarySafeError,
  cloneMusicLibrarySongSnapshots,
  createMusicLibrarySafeError,
  normalizeMusicAlbums,
  normalizeMusicLimits,
  normalizeMusicSongs,
  type MusicLibraryAlbumSnapshot,
  type MusicLibraryLimitsSnapshot,
  type MusicLibraryRefreshStatus,
  type MusicLibrarySafeErrorSnapshot,
  type MusicLibrarySongSnapshot
} from './musicLibraryNormalization';

export type MusicBrowseSelection =
  | { kind: 'artist'; id: number; label: string }
  | { kind: 'album'; id: number; label: string }
  | { kind: 'genre'; id: number; label: string }
  | null;

export type MusicBrowseRefreshStatus = MusicLibraryRefreshStatus;
export type MusicBrowseRefreshReason =
  | 'init'
  | 'manual'
  | `artist:${number}`
  | `album:${number}`
  | `genre:${number}`
  | `error:${string}`;
export type MusicBrowseSafeErrorSnapshot = MusicLibrarySafeErrorSnapshot;

export interface MusicBrowseStoreSnapshot {
  refreshStatus: MusicBrowseRefreshStatus;
  lastRefreshReason: MusicBrowseRefreshReason;
  lastUpdatedAt: string | null;
  selection: MusicBrowseSelection;
  albums: MusicLibraryAlbumSnapshot[];
  songs: MusicLibrarySongSnapshot[];
  limits: {
    albums: MusicLibraryLimitsSnapshot;
    songs: MusicLibraryLimitsSnapshot;
  };
  isEmpty: boolean;
  lastError: MusicBrowseSafeErrorSnapshot | null;
}

export interface MusicBrowseStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

export type MusicBrowseArtistPick = {
  artistid: number;
  label?: string;
};

export type MusicBrowseAlbumPick = {
  albumid: number;
  label?: string;
};

export type MusicBrowseGenrePick = {
  genreid: number;
  label?: string;
};

type MusicBrowseKind = NonNullable<MusicBrowseSelection>['kind'];
type MusicBrowseFilterKey = 'artistid' | 'albumid' | 'genreid';

const EMPTY_LIMITS: MusicLibraryLimitsSnapshot = { start: 0, end: 0, total: 0 };
const DETAIL_LIMIT = { start: 0, end: 50 } as const;
const ALBUM_SORT = { method: 'label', order: 'ascending' } as const;
const TRACK_SORT = { method: 'track', order: 'ascending' } as const;

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

const DEFAULT_SNAPSHOT: MusicBrowseStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  selection: null,
  albums: [],
  songs: [],
  limits: {
    albums: EMPTY_LIMITS,
    songs: EMPTY_LIMITS
  },
  isEmpty: true,
  lastError: null
};

export class MusicBrowseStore {
  #snapshot = $state<MusicBrowseStoreSnapshot>(cloneMusicBrowseSnapshot(DEFAULT_SNAPSHOT));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #now: () => string;

  #requestId = 0;

  constructor(options: MusicBrowseStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): MusicBrowseStoreSnapshot {
    return cloneMusicBrowseSnapshot(this.#snapshot);
  }

  async browseArtist(artist: MusicBrowseArtistPick): Promise<void> {
    await this.#browseDetail({
      kind: 'artist',
      id: artist.artistid,
      label: normalizeSelectionLabel(artist.label, 'Unknown artist'),
      filterKey: 'artistid',
      reasonPrefix: 'artist',
      includeAlbums: true,
      songSort: null
    });
  }

  async browseAlbum(album: MusicBrowseAlbumPick): Promise<void> {
    await this.#browseDetail({
      kind: 'album',
      id: album.albumid,
      label: normalizeSelectionLabel(album.label, 'Unknown album'),
      filterKey: 'albumid',
      reasonPrefix: 'album',
      includeAlbums: false,
      songSort: TRACK_SORT
    });
  }

  async browseGenre(genre: MusicBrowseGenrePick): Promise<void> {
    await this.#browseDetail({
      kind: 'genre',
      id: genre.genreid,
      label: normalizeSelectionLabel(genre.label, 'Unknown genre'),
      filterKey: 'genreid',
      reasonPrefix: 'genre',
      includeAlbums: true,
      songSort: null
    });
  }

  clearSelection(): void {
    this.#requestId += 1;
    this.#snapshot = cloneMusicBrowseSnapshot({
      ...DEFAULT_SNAPSHOT,
      lastRefreshReason: 'manual'
    });
  }

  destroy(): void {
    this.#requestId += 1;
  }

  async #browseDetail(options: {
    kind: MusicBrowseKind;
    id: number;
    label: string;
    filterKey: MusicBrowseFilterKey;
    reasonPrefix: 'artist' | 'album' | 'genre';
    includeAlbums: boolean;
    songSort: typeof TRACK_SORT | null;
  }): Promise<void> {
    const requestId = ++this.#requestId;
    const selection: NonNullable<MusicBrowseSelection> = {
      kind: options.kind,
      id: options.id,
      label: options.label
    };

    if (!isValidSelectionId(options.id)) {
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: 'error:client/invalid-selection',
        lastUpdatedAt: this.#now(),
        selection: this.#snapshot.selection,
        lastError: createMusicLibrarySafeError(
          new MusicLibraryClientError(
            'client/invalid-selection',
            'A finite positive music browse selection id is required.'
          )
        )
      };
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: `${options.reasonPrefix}:${options.id}`,
      selection,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const filter = { [options.filterKey]: options.id };
      const albumsPromise = options.includeAlbums
        ? getAudioLibraryAlbums(client, {
            properties: DEFAULT_ALBUM_PROPERTIES,
            limits: DETAIL_LIMIT,
            filter,
            sort: ALBUM_SORT
          })
        : Promise.resolve({ albums: [], limits: EMPTY_LIMITS });
      const songsPromise = getAudioLibrarySongs(client, {
        properties: DEFAULT_SONG_PROPERTIES,
        limits: DETAIL_LIMIT,
        filter,
        ...(options.songSort ? { sort: options.songSort } : {})
      });

      const [albumsResult, songsResult] = await Promise.all([albumsPromise, songsPromise]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const albums = options.includeAlbums ? normalizeMusicAlbums(albumsResult.albums) : [];
      const songs = normalizeMusicSongs(songsResult.songs);

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: `${options.reasonPrefix}:${options.id}`,
        lastUpdatedAt: this.#now(),
        selection,
        albums,
        songs,
        limits: {
          albums: options.includeAlbums
            ? normalizeMusicLimits(albumsResult.limits, albums)
            : cloneMusicLibraryLimits(EMPTY_LIMITS),
          songs: normalizeMusicLimits(songsResult.limits, songs)
        },
        isEmpty: albums.length === 0 && songs.length === 0,
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
        selection,
        lastError: safeError
      };
    }
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new MusicLibraryClientError(
        'client/no-active-host',
        'Kodi HTTP client is not configured for music browse refresh.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export function createMusicBrowseStore(options: MusicBrowseStoreOptions = {}): MusicBrowseStore {
  return new MusicBrowseStore(options);
}

export const musicBrowseStore = createMusicBrowseStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

function cloneMusicBrowseSnapshot(snapshot: MusicBrowseStoreSnapshot): MusicBrowseStoreSnapshot {
  return {
    ...snapshot,
    selection: snapshot.selection ? { ...snapshot.selection } : null,
    albums: cloneMusicLibraryAlbumSnapshots(snapshot.albums),
    songs: cloneMusicLibrarySongSnapshots(snapshot.songs),
    limits: {
      albums: cloneMusicLibraryLimits(snapshot.limits.albums),
      songs: cloneMusicLibraryLimits(snapshot.limits.songs)
    },
    lastError: cloneMusicLibrarySafeError(snapshot.lastError)
  };
}

function normalizeSelectionLabel(label: string | undefined, fallback: string): string {
  return typeof label === 'string' && label.length > 0 ? label : fallback;
}

function isValidSelectionId(id: number): boolean {
  return typeof id === 'number' && Number.isFinite(id) && id > 0;
}
