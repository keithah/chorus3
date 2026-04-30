import {
  KodiHttpClientError,
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibraryGenres,
  getAudioLibrarySongs,
  isKodiHttpClientError,
  type AudioLibraryAlbumPropertyName,
  type AudioLibraryArtistPropertyName,
  type AudioLibraryGenrePropertyName,
  type AudioLibrarySongPropertyName,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type KodiLimits
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type MusicLibraryRefreshStatus = 'idle' | 'loading' | 'ready' | 'error';
export type MusicLibraryRefreshReason =
  | 'init'
  | 'manual'
  | 'poll'
  | `notification:${string}`
  | `command:${string}`
  | `error:${string}`;
export type MusicLibraryErrorSource = 'http' | 'client' | 'unknown';

export interface MusicLibrarySafeErrorSnapshot {
  source: MusicLibraryErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface MusicLibraryLimitsSnapshot {
  start: number;
  end: number;
  total: number;
}

export interface MusicLibraryArtistSnapshot {
  artistid: number;
  label: string;
  thumbnail?: string;
  genre?: string[];
}

export interface MusicLibraryAlbumSnapshot {
  albumid: number;
  label: string;
  title?: string;
  artist?: string[];
  year?: number;
  thumbnail?: string;
}

export interface MusicLibrarySongSnapshot {
  songid: number;
  label: string;
  title?: string;
  artist?: string[];
  album?: string;
  duration?: number;
  track?: number;
  thumbnail?: string;
  playcount?: number;
  lastplayed?: string;
}

export interface MusicLibraryGenreSnapshot {
  genreid: number;
  label: string;
  title?: string;
  thumbnail?: string;
}

export interface MusicLibraryStoreSnapshot {
  refreshStatus: MusicLibraryRefreshStatus;
  lastRefreshReason: MusicLibraryRefreshReason;
  lastUpdatedAt: string | null;
  artists: MusicLibraryArtistSnapshot[];
  albums: MusicLibraryAlbumSnapshot[];
  songs: MusicLibrarySongSnapshot[];
  genres: MusicLibraryGenreSnapshot[];
  limits: {
    artists: MusicLibraryLimitsSnapshot;
    albums: MusicLibraryLimitsSnapshot;
    songs: MusicLibraryLimitsSnapshot;
    genres: MusicLibraryLimitsSnapshot;
  };
  isEmpty: boolean;
  lastError: MusicLibrarySafeErrorSnapshot | null;
}

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
  #snapshot = $state<MusicLibraryStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));

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
    return cloneSnapshot(this.#snapshot);
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

      const artists = normalizeArtists(artistsResult.artists);
      const albums = normalizeAlbums(albumsResult.albums);
      const songs = normalizeSongs(songsResult.songs);
      const genres = normalizeGenres(genresResult.genres);

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        artists,
        albums,
        songs,
        genres,
        limits: {
          artists: normalizeLimits(artistsResult.limits, artists),
          albums: normalizeLimits(albumsResult.limits, albums),
          songs: normalizeLimits(songsResult.limits, songs),
          genres: normalizeLimits(genresResult.limits, genres)
        },
        isEmpty:
          artists.length === 0 && albums.length === 0 && songs.length === 0 && genres.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createSafeError(error);
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

class MusicLibraryClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'MusicLibraryClientError';
    this.code = code;
  }
}

function normalizeArtists(items: unknown): MusicLibraryArtistSnapshot[] {
  return normalizeRecordList(items).flatMap((item): MusicLibraryArtistSnapshot[] => {
    const artistid = finiteId(item.artistid);
    if (artistid === null) {
      return [];
    }

    return [
      {
        artistid,
        label: stringValue(item.label) ?? stringValue(item.title) ?? 'Unknown artist',
        ...stringField('thumbnail', item.thumbnail),
        ...stringArrayField('genre', item.genre)
      }
    ];
  });
}

function normalizeAlbums(items: unknown): MusicLibraryAlbumSnapshot[] {
  return normalizeRecordList(items).flatMap((item): MusicLibraryAlbumSnapshot[] => {
    const albumid = finiteId(item.albumid);
    if (albumid === null) {
      return [];
    }

    return [
      {
        albumid,
        label: stringValue(item.label) ?? stringValue(item.title) ?? 'Unknown album',
        ...stringField('title', item.title),
        ...stringArrayField('artist', item.artist),
        ...numberField('year', item.year),
        ...stringField('thumbnail', item.thumbnail)
      }
    ];
  });
}

function normalizeSongs(items: unknown): MusicLibrarySongSnapshot[] {
  return normalizeRecordList(items).flatMap((item): MusicLibrarySongSnapshot[] => {
    const songid = finiteId(item.songid);
    if (songid === null) {
      return [];
    }

    return [
      {
        songid,
        label: stringValue(item.label) ?? stringValue(item.title) ?? 'Unknown song',
        ...stringField('title', item.title),
        ...stringArrayField('artist', item.artist),
        ...stringField('album', item.album),
        ...numberField('duration', item.duration),
        ...numberField('track', item.track),
        ...stringField('thumbnail', item.thumbnail),
        ...numberField('playcount', item.playcount),
        ...stringField('lastplayed', item.lastplayed)
      }
    ];
  });
}

function normalizeGenres(items: unknown): MusicLibraryGenreSnapshot[] {
  return normalizeRecordList(items).flatMap((item): MusicLibraryGenreSnapshot[] => {
    const genreid = finiteId(item.genreid);
    if (genreid === null) {
      return [];
    }

    return [
      {
        genreid,
        label: stringValue(item.label) ?? stringValue(item.title) ?? 'Unknown genre',
        ...stringField('title', item.title),
        ...stringField('thumbnail', item.thumbnail)
      }
    ];
  });
}

function normalizeRecordList(items: unknown): Record<string, unknown>[] {
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

function normalizeLimits(limits: unknown, items: unknown[]): MusicLibraryLimitsSnapshot {
  const fallbackTotal = items.length;

  if (!isRecord(limits)) {
    return { start: 0, end: fallbackTotal, total: fallbackTotal };
  }

  const typedLimits = limits as KodiLimits;
  return {
    start: finiteNumberOr(typedLimits.start, 0),
    end: finiteNumberOr(typedLimits.end, fallbackTotal),
    total: finiteNumberOr(typedLimits.total, fallbackTotal)
  };
}

function createSafeError(error: unknown): MusicLibrarySafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  if (error instanceof MusicLibraryClientError) {
    return {
      source: 'client',
      code: error.code,
      message: sanitizeErrorMessage(error.message)
    };
  }

  return {
    source: 'unknown',
    code: 'refresh-failed',
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Kodi music library refresh failed.'
    )
  };
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/raw response body/gi, 'response body [redacted]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/https?:\/\/[^\s/@:]+:[^\s/@]+@/gi, 'http://credentials@')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-path')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/p@ssword/gi, 'credentials')
    .replace(/password/gi, 'credentials');
}

function finiteId(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, string>> {
  const normalized = stringValue(value);
  return normalized === undefined ? {} : ({ [key]: normalized } as Partial<Record<Key, string>>);
}

function stringArrayField<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, string[]>> {
  if (!Array.isArray(value)) {
    return {};
  }

  const normalized = value.filter((entry): entry is string => typeof entry === 'string');
  return normalized.length === 0 ? {} : ({ [key]: normalized } as Partial<Record<Key, string[]>>);
}

function numberField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, number>> {
  return typeof value === 'number' && Number.isFinite(value)
    ? ({ [key]: value } as Partial<Record<Key, number>>)
    : {};
}

function finiteNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cloneSnapshot(snapshot: MusicLibraryStoreSnapshot): MusicLibraryStoreSnapshot {
  return {
    ...snapshot,
    artists: snapshot.artists.map((artist) => ({
      ...artist,
      ...(artist.genre ? { genre: [...artist.genre] } : {})
    })),
    albums: snapshot.albums.map((album) => ({
      ...album,
      ...(album.artist ? { artist: [...album.artist] } : {})
    })),
    songs: snapshot.songs.map((song) => ({
      ...song,
      ...(song.artist ? { artist: [...song.artist] } : {})
    })),
    genres: snapshot.genres.map((genre) => ({ ...genre })),
    limits: {
      artists: { ...snapshot.limits.artists },
      albums: { ...snapshot.limits.albums },
      songs: { ...snapshot.limits.songs },
      genres: { ...snapshot.limits.genres }
    },
    lastError: snapshot.lastError
      ? {
          ...snapshot.lastError,
          ...(snapshot.lastError.endpoint ? { endpoint: { ...snapshot.lastError.endpoint } } : {})
        }
      : null
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createMusicLibraryStore(options: MusicLibraryStoreOptions = {}): MusicLibraryStore {
  return new MusicLibraryStore(options);
}

export const musicLibraryStore = createMusicLibraryStore({
  createClient: createActiveKodiJsonRpcHttpClient
});
