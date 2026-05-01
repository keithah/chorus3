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

function safeStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && !containsForbiddenStorageText(value)
    ? value
    : undefined;
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
    /localStorage/i.test(value) ||
    /raw response body/i.test(value) ||
    /p@ssword/i.test(value) ||
    /password/i.test(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
