import {
  KodiHttpClientError,
  isKodiHttpClientError,
  type KodiEndpointDescription,
  type KodiLimits
} from '$lib/kodi';

export type VideoLibraryRefreshStatus = 'idle' | 'loading' | 'ready' | 'error';
export type VideoLibraryRefreshReason =
  | 'init'
  | 'manual'
  | 'poll'
  | `notification:${string}`
  | `command:${string}`
  | `error:${string}`;
export type VideoLibraryErrorSource = 'http' | 'client' | 'unknown';

export interface VideoLibrarySafeErrorSnapshot {
  source: VideoLibraryErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface VideoLibraryLimitsSnapshot {
  start: number;
  end: number;
  total: number;
}

export interface VideoLibraryResumeSnapshot {
  position: number;
  total: number;
}

export interface VideoLibraryMovieSnapshot {
  movieid: number;
  label: string;
  title?: string;
  year?: number;
  runtime?: number;
  thumbnail?: string;
  fanart?: string;
  art?: Record<string, string>;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoLibraryResumeSnapshot;
  dateadded?: string;
  watched?: boolean;
}

export interface VideoMovieVersionItemSnapshot {
  id: number;
  label: string;
}

export type VideoMovieVersionsSnapshot =
  | { status: 'ready'; items: VideoMovieVersionItemSnapshot[]; selectedId?: number }
  | { status: 'unavailable'; reason: string }
  | { status: 'unsupported'; reason: string }
  | { status: 'error'; message: string };

export interface VideoMovieDetailSnapshot {
  movieid: number;
  label: string;
  title?: string;
  year?: number;
  runtime?: number;
  plot?: string;
  plotoutline?: string;
  tagline?: string;
  genre?: string[];
  director?: string[];
  studio?: string[];
  mpaa?: string;
  rating?: number;
  userrating?: number;
  premiered?: string;
  uniqueid?: Record<string, string>;
  thumbnailAvailable: boolean;
  fanartAvailable: boolean;
  artwork: Record<string, boolean>;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoLibraryResumeSnapshot;
  dateadded?: string;
  watched?: boolean;
  versions: VideoMovieVersionsSnapshot;
}

export interface VideoMovieDetailStoreSnapshot {
  refreshStatus: VideoLibraryRefreshStatus;
  lastRefreshReason: VideoLibraryRefreshReason;
  lastUpdatedAt: string | null;
  selectedMovieId: number | null;
  detail: VideoMovieDetailSnapshot | null;
  lastError: VideoLibrarySafeErrorSnapshot | null;
}

export interface VideoLibraryStoreSnapshot {
  refreshStatus: VideoLibraryRefreshStatus;
  lastRefreshReason: VideoLibraryRefreshReason;
  lastUpdatedAt: string | null;
  movies: VideoLibraryMovieSnapshot[];
  limits: {
    movies: VideoLibraryLimitsSnapshot;
  };
  isEmpty: boolean;
  lastError: VideoLibrarySafeErrorSnapshot | null;
}

export class VideoLibraryClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'VideoLibraryClientError';
    this.code = code;
  }
}

export function normalizeVideoMovies(items: unknown): VideoLibraryMovieSnapshot[] {
  return normalizeRecordList(items).flatMap((item): VideoLibraryMovieSnapshot[] => {
    const movieid = finiteId(item.movieid);
    if (movieid === null) {
      return [];
    }

    const playcount = finiteNonNegativeNumber(item.playcount);
    const movie: VideoLibraryMovieSnapshot = {
      movieid,
      label: safeStringValue(item.label) ?? safeStringValue(item.title) ?? 'Unknown movie',
      ...stringField('title', item.title),
      ...numberField('year', item.year),
      ...numberField('runtime', item.runtime),
      ...stringField('thumbnail', item.thumbnail),
      ...stringField('fanart', item.fanart),
      ...artField(item.art),
      ...(playcount === undefined ? {} : { playcount, watched: playcount > 0 }),
      ...stringField('lastplayed', item.lastplayed),
      ...resumeField(item.resume),
      ...stringField('dateadded', item.dateadded)
    };

    return [movie];
  });
}

export function normalizeVideoMovieDetail(item: unknown): VideoMovieDetailSnapshot | null {
  if (!isRecord(item)) {
    return null;
  }

  const movieid = finiteId(item.movieid);
  if (movieid === null) {
    return null;
  }

  const playcount = finiteNonNegativeNumber(item.playcount);
  return {
    movieid,
    label: safeStringValue(item.label) ?? safeStringValue(item.title) ?? 'Unknown movie',
    ...stringField('title', item.title),
    ...numberField('year', item.year),
    ...numberField('runtime', item.runtime),
    ...stringField('plot', item.plot),
    ...stringField('plotoutline', item.plotoutline),
    ...stringField('tagline', item.tagline),
    ...arrayStringField('genre', item.genre),
    ...arrayStringField('director', item.director),
    ...arrayStringField('studio', item.studio),
    ...stringField('mpaa', item.mpaa),
    ...numberField('rating', item.rating),
    ...numberField('userrating', item.userrating),
    ...stringField('premiered', item.premiered),
    ...uniqueIdField(item.uniqueid),
    thumbnailAvailable: isSafeArtworkReference(item.thumbnail),
    fanartAvailable: isSafeArtworkReference(item.fanart),
    artwork: artworkAvailabilityField(item.art),
    ...(playcount === undefined ? {} : { playcount, watched: playcount > 0 }),
    ...stringField('lastplayed', item.lastplayed),
    ...resumeField(item.resume),
    ...stringField('dateadded', item.dateadded),
    versions: normalizeVideoMovieVersions(item.versions)
  };
}

export function normalizeVideoMovieVersions(value: unknown): VideoMovieVersionsSnapshot {
  if (!isRecord(value)) {
    return {
      status: 'unsupported',
      reason: 'Kodi movie versions are not available through a proven JSON-RPC detail API.'
    };
  }

  if (value.status === 'unsupported') {
    return {
      status: 'unsupported',
      reason: safeStringValue(value.reason) ?? 'Kodi movie versions are not supported.'
    };
  }

  if (value.status === 'error') {
    const rawMessage =
      typeof value.message === 'string' && value.message.length > 0
        ? value.message
        : 'Movie versions failed.';
    return {
      status: 'error',
      message: sanitizeErrorMessage(rawMessage)
    };
  }

  if (value.status === 'ready') {
    const items = normalizeRecordList(value.items).flatMap(
      (item): VideoMovieVersionItemSnapshot[] => {
        const id = finitePositiveSafeId(item.id);
        const label = safeVersionLabel(item.label);
        return id === null || label === undefined ? [] : [{ id, label }];
      }
    );

    if (items.length === 0) {
      return { status: 'unavailable', reason: 'No safe movie versions are available.' };
    }

    const selectedId = finitePositiveSafeId(value.selectedId);
    return {
      status: 'ready',
      ...(selectedId === null ? {} : { selectedId }),
      items
    };
  }

  return {
    status: 'unavailable',
    reason: safeStringValue(value.reason) ?? 'Movie versions are unavailable.'
  };
}

export function normalizeVideoLibraryLimits(
  limits: unknown,
  items: readonly unknown[]
): VideoLibraryLimitsSnapshot {
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

export function createVideoLibrarySafeError(error: unknown): VideoLibrarySafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  if (error instanceof VideoLibraryClientError) {
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
      error instanceof Error ? error.message : 'Kodi video library refresh failed.'
    )
  };
}

export function cloneVideoLibraryMovieSnapshots(
  movies: readonly VideoLibraryMovieSnapshot[]
): VideoLibraryMovieSnapshot[] {
  return movies.map((movie) => ({
    ...movie,
    ...(movie.art ? { art: { ...movie.art } } : {}),
    ...(movie.resume ? { resume: { ...movie.resume } } : {})
  }));
}

export function cloneVideoMovieVersionsSnapshot(
  versions: VideoMovieVersionsSnapshot
): VideoMovieVersionsSnapshot {
  return versions.status === 'ready'
    ? {
        ...versions,
        items: versions.items.map((item) => ({ ...item }))
      }
    : { ...versions };
}

export function cloneVideoMovieDetailSnapshot(
  detail: VideoMovieDetailSnapshot | null
): VideoMovieDetailSnapshot | null {
  return detail
    ? {
        ...detail,
        ...(detail.genre ? { genre: [...detail.genre] } : {}),
        ...(detail.director ? { director: [...detail.director] } : {}),
        ...(detail.studio ? { studio: [...detail.studio] } : {}),
        ...(detail.uniqueid ? { uniqueid: { ...detail.uniqueid } } : {}),
        artwork: { ...detail.artwork },
        ...(detail.resume ? { resume: { ...detail.resume } } : {}),
        versions: cloneVideoMovieVersionsSnapshot(detail.versions)
      }
    : null;
}

export function cloneVideoMovieDetailStoreSnapshot(
  snapshot: VideoMovieDetailStoreSnapshot
): VideoMovieDetailStoreSnapshot {
  return {
    ...snapshot,
    detail: cloneVideoMovieDetailSnapshot(snapshot.detail),
    lastError: cloneVideoLibrarySafeError(snapshot.lastError)
  };
}

export function cloneVideoLibraryLimits(
  limits: VideoLibraryLimitsSnapshot
): VideoLibraryLimitsSnapshot {
  return { ...limits };
}

export function cloneVideoLibrarySafeError(
  error: VideoLibrarySafeErrorSnapshot | null
): VideoLibrarySafeErrorSnapshot | null {
  return error
    ? {
        ...error,
        ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
      }
    : null;
}

export function cloneVideoLibrarySnapshot(
  snapshot: VideoLibraryStoreSnapshot
): VideoLibraryStoreSnapshot {
  return {
    ...snapshot,
    movies: cloneVideoLibraryMovieSnapshots(snapshot.movies),
    limits: {
      movies: cloneVideoLibraryLimits(snapshot.limits.movies)
    },
    lastError: cloneVideoLibrarySafeError(snapshot.lastError)
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

function finitePositiveSafeId(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value > 0
    ? value
    : null;
}

function safeStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && !containsForbiddenStorageText(value)
    ? value
    : undefined;
}

function safeVersionLabel(value: unknown): string | undefined {
  const label = safeStringValue(value);
  return label === undefined || /:\/\//.test(label) ? undefined : label;
}

function arrayStringField<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, string[]>> {
  if (!Array.isArray(value)) {
    return {};
  }

  const normalized = value.filter((item): item is string => safeStringValue(item) !== undefined);
  return normalized.length === 0 ? {} : ({ [key]: normalized } as Partial<Record<Key, string[]>>);
}

function uniqueIdField(value: unknown): Partial<Pick<VideoMovieDetailSnapshot, 'uniqueid'>> {
  if (!isRecord(value)) {
    return {};
  }

  const uniqueid = Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' && safeStringValue(entry[1]) !== undefined
    )
  );

  return Object.keys(uniqueid).length === 0 ? {} : { uniqueid };
}

function artworkAvailabilityField(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, artValue]) =>
          typeof key === 'string' &&
          !key.toLowerCase().includes('file') &&
          isSafeArtworkReference(artValue)
      )
      .map(([key]) => [key, true])
  );
}

function isSafeArtworkReference(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && !containsForbiddenStorageText(value);
}

function stringField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, string>> {
  const normalized = safeStringValue(value);
  return normalized === undefined ? {} : ({ [key]: normalized } as Partial<Record<Key, string>>);
}

function numberField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, number>> {
  return typeof value === 'number' && Number.isFinite(value)
    ? ({ [key]: value } as Partial<Record<Key, number>>)
    : {};
}

function finiteNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function artField(value: unknown): Partial<Pick<VideoLibraryMovieSnapshot, 'art'>> {
  if (!isRecord(value)) {
    return {};
  }

  const art = Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' &&
        !entry[0].toLowerCase().includes('file') &&
        typeof entry[1] === 'string' &&
        entry[1].length > 0 &&
        !containsForbiddenStorageText(entry[1])
    )
  );

  return Object.keys(art).length === 0 ? {} : { art };
}

function resumeField(value: unknown): Partial<Pick<VideoLibraryMovieSnapshot, 'resume'>> {
  if (!isRecord(value)) {
    return {};
  }

  const position = finiteNonNegativeNumber(value.position);
  const total = finiteNonNegativeNumber(value.total);

  return position === undefined || total === undefined ? {} : { resume: { position, total } };
}

function finiteNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function containsForbiddenStorageText(value: string): boolean {
  return (
    /https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/i.test(value) ||
    /authorization\s*:?\s*basic/i.test(value) ||
    /smb:\/\//i.test(value) ||
    /special:\/\//i.test(value) ||
    /localStorage/i.test(value) ||
    /sessionStorage/i.test(value) ||
    /SENTINEL_SECRET/i.test(value) ||
    /raw response body/i.test(value) ||
    /p@ssword/i.test(value) ||
    /password/i.test(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
