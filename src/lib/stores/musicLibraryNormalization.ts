import {
  KodiHttpClientError,
  isKodiHttpClientError,
  type KodiEndpointDescription,
  type KodiLimits
} from '$lib/kodi';

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
  fanart?: string;
  description?: string;
  born?: string;
  died?: string;
  formed?: string;
  yearsactive?: string[];
  instrument?: string[];
  genre?: string[];
  mood?: string[];
  style?: string[];
}

export interface MusicLibraryAlbumSnapshot {
  albumid: number;
  label: string;
  title?: string;
  artist?: string[];
  year?: number;
  thumbnail?: string;
  fanart?: string;
  description?: string;
  albumduration?: number;
  genre?: string[];
  mood?: string[];
  style?: string[];
  albumlabel?: string;
  displayartist?: string;
  rating?: number;
  userrating?: number;
  votes?: string;
  dateadded?: string;
  playcount?: number;
  watched?: boolean;
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
  genre?: string[];
  year?: number;
  rating?: number;
  mood?: string[];
  playcount?: number;
  lastplayed?: string;
  dateadded?: string;
  watched?: boolean;
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
  recentlyAddedSongs: MusicLibrarySongSnapshot[];
  recentlyPlayedSongs: MusicLibrarySongSnapshot[];
  mostPlayedSongs: MusicLibrarySongSnapshot[];
  genres: MusicLibraryGenreSnapshot[];
  limits: {
    artists: MusicLibraryLimitsSnapshot;
    albums: MusicLibraryLimitsSnapshot;
    songs: MusicLibraryLimitsSnapshot;
    recentlyAddedSongs: MusicLibraryLimitsSnapshot;
    recentlyPlayedSongs: MusicLibraryLimitsSnapshot;
    mostPlayedSongs: MusicLibraryLimitsSnapshot;
    genres: MusicLibraryLimitsSnapshot;
  };
  isEmpty: boolean;
  lastError: MusicLibrarySafeErrorSnapshot | null;
}

export class MusicLibraryClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'MusicLibraryClientError';
    this.code = code;
  }
}

export function normalizeMusicArtists(items: unknown): MusicLibraryArtistSnapshot[] {
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
        ...stringField('fanart', item.fanart),
        ...stringField('description', item.description),
        ...stringField('born', item.born),
        ...stringField('died', item.died),
        ...stringField('formed', item.formed),
        ...stringArrayField('yearsactive', item.yearsactive),
        ...stringArrayField('instrument', item.instrument),
        ...stringArrayField('genre', item.genre),
        ...stringArrayField('mood', item.mood),
        ...stringArrayField('style', item.style)
      }
    ];
  });
}

export function normalizeMusicAlbums(items: unknown): MusicLibraryAlbumSnapshot[] {
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
        ...stringField('thumbnail', item.thumbnail),
        ...stringField('fanart', item.fanart),
        ...stringField('description', item.description),
        ...numberField('albumduration', item.albumduration),
        ...stringArrayField('genre', item.genre),
        ...stringArrayField('mood', item.mood),
        ...stringArrayField('style', item.style),
        ...stringField('albumlabel', item.albumlabel),
        ...stringField('displayartist', item.displayartist),
        ...numberField('rating', item.rating),
        ...numberField('userrating', item.userrating),
        ...stringField('votes', item.votes),
        ...stringField('dateadded', item.dateadded),
        ...playcountFields(item)
      }
    ];
  });
}

export function normalizeMusicSongs(items: unknown): MusicLibrarySongSnapshot[] {
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
        ...stringArrayField('genre', item.genre),
        ...numberField('year', item.year),
        ...numberField('rating', item.rating),
        ...stringArrayField('mood', item.mood),
        ...playcountFields(item),
        ...stringField('lastplayed', item.lastplayed),
        ...stringField('dateadded', item.dateadded)
      }
    ];
  });
}

export function normalizeMusicGenres(items: unknown): MusicLibraryGenreSnapshot[] {
  return normalizeRecordList(items).flatMap((item): MusicLibraryGenreSnapshot[] => {
    const genreid = finiteId(item.genreid);
    if (genreid === null) {
      return [];
    }

    return [
      {
        genreid,
        label:
          stringValue(item.label) ??
          stringValue(item.title) ??
          stringValue(item.genre) ??
          'Unknown genre',
        ...stringField('title', item.title),
        ...stringField('thumbnail', item.thumbnail)
      }
    ];
  });
}

export function normalizeMusicLimits(
  limits: unknown,
  items: readonly unknown[]
): MusicLibraryLimitsSnapshot {
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

export function createMusicLibrarySafeError(error: unknown): MusicLibrarySafeErrorSnapshot {
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

export function cloneMusicLibraryArtistSnapshots(
  artists: readonly MusicLibraryArtistSnapshot[]
): MusicLibraryArtistSnapshot[] {
  return artists.map((artist) => ({
    ...artist,
    ...(artist.yearsactive ? { yearsactive: [...artist.yearsactive] } : {}),
    ...(artist.instrument ? { instrument: [...artist.instrument] } : {}),
    ...(artist.genre ? { genre: [...artist.genre] } : {}),
    ...(artist.mood ? { mood: [...artist.mood] } : {}),
    ...(artist.style ? { style: [...artist.style] } : {})
  }));
}

export function cloneMusicLibraryAlbumSnapshots(
  albums: readonly MusicLibraryAlbumSnapshot[]
): MusicLibraryAlbumSnapshot[] {
  return albums.map((album) => ({
    ...album,
    ...(album.artist ? { artist: [...album.artist] } : {}),
    ...(album.genre ? { genre: [...album.genre] } : {}),
    ...(album.mood ? { mood: [...album.mood] } : {}),
    ...(album.style ? { style: [...album.style] } : {})
  }));
}

export function cloneMusicLibrarySongSnapshots(
  songs: readonly MusicLibrarySongSnapshot[]
): MusicLibrarySongSnapshot[] {
  return songs.map((song) => ({
    ...song,
    ...(song.artist ? { artist: [...song.artist] } : {}),
    ...(song.genre ? { genre: [...song.genre] } : {}),
    ...(song.mood ? { mood: [...song.mood] } : {})
  }));
}

export function cloneMusicLibraryGenreSnapshots(
  genres: readonly MusicLibraryGenreSnapshot[]
): MusicLibraryGenreSnapshot[] {
  return genres.map((genre) => ({ ...genre }));
}

export function cloneMusicLibraryLimits(
  limits: MusicLibraryLimitsSnapshot
): MusicLibraryLimitsSnapshot {
  return { ...limits };
}

export function cloneMusicLibrarySafeError(
  error: MusicLibrarySafeErrorSnapshot | null
): MusicLibrarySafeErrorSnapshot | null {
  return error
    ? {
        ...error,
        ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
      }
    : null;
}

export function cloneMusicLibrarySnapshot(
  snapshot: MusicLibraryStoreSnapshot
): MusicLibraryStoreSnapshot {
  return {
    ...snapshot,
    artists: cloneMusicLibraryArtistSnapshots(snapshot.artists),
    albums: cloneMusicLibraryAlbumSnapshots(snapshot.albums),
    songs: cloneMusicLibrarySongSnapshots(snapshot.songs),
    recentlyAddedSongs: cloneMusicLibrarySongSnapshots(snapshot.recentlyAddedSongs),
    recentlyPlayedSongs: cloneMusicLibrarySongSnapshots(snapshot.recentlyPlayedSongs),
    mostPlayedSongs: cloneMusicLibrarySongSnapshots(snapshot.mostPlayedSongs),
    genres: cloneMusicLibraryGenreSnapshots(snapshot.genres),
    limits: {
      artists: cloneMusicLibraryLimits(snapshot.limits.artists),
      albums: cloneMusicLibraryLimits(snapshot.limits.albums),
      songs: cloneMusicLibraryLimits(snapshot.limits.songs),
      recentlyAddedSongs: cloneMusicLibraryLimits(snapshot.limits.recentlyAddedSongs),
      recentlyPlayedSongs: cloneMusicLibraryLimits(snapshot.limits.recentlyPlayedSongs),
      mostPlayedSongs: cloneMusicLibraryLimits(snapshot.limits.mostPlayedSongs),
      genres: cloneMusicLibraryLimits(snapshot.limits.genres)
    },
    lastError: cloneMusicLibrarySafeError(snapshot.lastError)
  };
}

function normalizeRecordList(items: unknown): Record<string, unknown>[] {
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/raw response body/gi, 'response body [redacted]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, 'redacted-url')
    .replace(/authorization\s*:\s*basic\s+[^\s,]+/gi, 'credentials [redacted]')
    .replace(/authorization\s+basic\s+[^\s,]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/smb:\/\/[^\s,]+/gi, 'redacted-path')
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

function playcountFields(
  item: Record<string, unknown>
): Partial<Pick<MusicLibraryAlbumSnapshot, 'playcount' | 'watched'>> {
  const playcount =
    typeof item.playcount === 'number' && Number.isFinite(item.playcount)
      ? Math.max(0, Math.trunc(item.playcount))
      : undefined;
  return playcount === undefined ? {} : { playcount, watched: playcount > 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
