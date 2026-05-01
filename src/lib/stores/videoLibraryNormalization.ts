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

export interface VideoTvShowSnapshot {
  tvshowid: number;
  label: string;
  title?: string;
  year?: number;
  thumbnail?: string;
  fanart?: string;
  art?: Record<string, string>;
  episodeCount?: number;
  watchedEpisodeCount?: number;
  unwatchedEpisodes?: number;
  hasUnwatched?: boolean;
  playcount?: number;
  lastplayed?: string;
  dateadded?: string;
  watched?: boolean;
}

export interface VideoTvShowDetailSnapshot extends VideoTvShowSnapshot {
  plot?: string;
  genre?: string[];
  studio?: string[];
  rating?: number;
  userrating?: number;
  premiered?: string;
  uniqueid?: Record<string, string>;
  thumbnailAvailable: boolean;
  fanartAvailable: boolean;
  artwork: Record<string, boolean>;
}

export interface VideoSeasonSnapshot {
  tvshowid: number;
  season: number;
  label: string;
  title?: string;
  showtitle?: string;
  thumbnail?: string;
  fanart?: string;
  art?: Record<string, string>;
  episodeCount?: number;
  watchedEpisodeCount?: number;
  unwatchedEpisodes?: number;
  hasUnwatched?: boolean;
  playcount?: number;
  userrating?: number;
  watched?: boolean;
}

export interface VideoEpisodeSnapshot {
  episodeid: number;
  tvshowid?: number;
  season?: number;
  episode?: number;
  label: string;
  title?: string;
  showtitle?: string;
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

export interface VideoEpisodeDetailSnapshot extends VideoEpisodeSnapshot {
  plot?: string;
  director?: string[];
  writer?: string[];
  rating?: number;
  userrating?: number;
  firstaired?: string;
  uniqueid?: Record<string, string>;
  thumbnailAvailable: boolean;
  fanartAvailable: boolean;
  artwork: Record<string, boolean>;
}

export type VideoSeasonArtworkRefreshCapabilitySnapshot =
  | {
      status: 'supported';
      reason: string;
      availableArtTypes: string[];
      availableArtwork: Record<string, boolean>;
    }
  | { status: 'unsupported'; reason: string }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; message: string };

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
  tvShows: VideoTvShowSnapshot[];
  limits: {
    movies: VideoLibraryLimitsSnapshot;
    tvShows: VideoLibraryLimitsSnapshot;
  };
  isEmpty: boolean;
  lastError: VideoLibrarySafeErrorSnapshot | null;
}

export interface VideoTvStoreSnapshot {
  refreshStatus: VideoLibraryRefreshStatus;
  lastRefreshReason: VideoLibraryRefreshReason;
  lastUpdatedAt: string | null;
  selectedTvShowId: number | null;
  selectedSeason: number | null;
  selectedEpisodeId: number | null;
  tvShows: VideoTvShowSnapshot[];
  tvShowDetail: VideoTvShowDetailSnapshot | null;
  seasons: VideoSeasonSnapshot[];
  episodes: VideoEpisodeSnapshot[];
  episodeDetail: VideoEpisodeDetailSnapshot | null;
  limits: {
    tvShows: VideoLibraryLimitsSnapshot;
    seasons: VideoLibraryLimitsSnapshot;
    episodes: VideoLibraryLimitsSnapshot;
  };
  seasonArtworkCapability: VideoSeasonArtworkRefreshCapabilitySnapshot;
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

export function normalizeVideoTvShows(items: unknown): VideoTvShowSnapshot[] {
  return normalizeRecordList(items).flatMap((item): VideoTvShowSnapshot[] => {
    const tvshowid = finitePositiveSafeId(item.tvshowid);
    if (tvshowid === null) {
      return [];
    }

    return [normalizeTvShowBase(item, tvshowid, 'Unknown TV show')];
  });
}

export function normalizeVideoTvShowDetail(item: unknown): VideoTvShowDetailSnapshot | null {
  if (!isRecord(item)) {
    return null;
  }

  const tvshowid = finitePositiveSafeId(item.tvshowid);
  if (tvshowid === null) {
    return null;
  }

  return {
    ...normalizeTvShowBase(item, tvshowid, 'Unknown TV show'),
    ...stringField('plot', item.plot),
    ...arrayStringField('genre', item.genre),
    ...arrayStringField('studio', item.studio),
    ...numberField('rating', item.rating),
    ...numberField('userrating', item.userrating),
    ...stringField('premiered', item.premiered),
    ...uniqueIdField(item.uniqueid),
    thumbnailAvailable: isSafeArtworkReference(item.thumbnail),
    fanartAvailable: isSafeArtworkReference(item.fanart),
    artwork: artworkAvailabilityField(item.art)
  };
}

export function normalizeVideoSeasons(items: unknown): VideoSeasonSnapshot[] {
  return normalizeRecordList(items).flatMap((item): VideoSeasonSnapshot[] => {
    const tvshowid = finitePositiveSafeId(item.tvshowid);
    const season = finiteNonNegativeSafeInteger(item.season);
    if (tvshowid === null || season === null) {
      return [];
    }

    const playcount = finiteNonNegativeNumber(item.playcount);
    return [
      {
        tvshowid,
        season,
        label: safeStringValue(item.label) ?? safeStringValue(item.title) ?? `Season ${season}`,
        ...stringField('title', item.title),
        ...stringField('showtitle', item.showtitle),
        ...stringField('thumbnail', item.thumbnail),
        ...stringField('fanart', item.fanart),
        ...artField(item.art),
        ...episodeCountFields(item),
        ...(playcount === undefined ? {} : { playcount, watched: playcount > 0 }),
        ...numberField('userrating', item.userrating)
      }
    ];
  });
}

export function normalizeVideoEpisodes(items: unknown): VideoEpisodeSnapshot[] {
  return normalizeRecordList(items)
    .flatMap((item): VideoEpisodeSnapshot[] => {
      const episodeid = finitePositiveSafeId(item.episodeid);
      if (episodeid === null) {
        return [];
      }

      const season = finiteNonNegativeSafeInteger(item.season);
      if (item.season !== undefined && season === null) {
        return [];
      }

      const episode = finiteNonNegativeSafeInteger(item.episode);
      const playcount = finiteNonNegativeNumber(item.playcount);
      return [
        {
          episodeid,
          ...positiveIdField('tvshowid', item.tvshowid),
          ...(season === null ? {} : { season }),
          ...(episode === null ? {} : { episode }),
          label: safeStringValue(item.label) ?? safeStringValue(item.title) ?? 'Unknown episode',
          ...stringField('title', item.title),
          ...stringField('showtitle', item.showtitle),
          ...numberField('runtime', item.runtime),
          ...stringField('thumbnail', item.thumbnail),
          ...stringField('fanart', item.fanart),
          ...artField(item.art),
          ...(playcount === undefined ? {} : { playcount, watched: playcount > 0 }),
          ...stringField('lastplayed', item.lastplayed),
          ...resumeField(item.resume),
          ...stringField('dateadded', item.dateadded)
        }
      ];
    })
    .sort(
      (left, right) =>
        (left.season ?? 0) - (right.season ?? 0) ||
        (left.episode ?? 0) - (right.episode ?? 0) ||
        left.episodeid - right.episodeid
    );
}

export function normalizeVideoEpisodeDetail(item: unknown): VideoEpisodeDetailSnapshot | null {
  if (!isRecord(item)) {
    return null;
  }

  const episode = normalizeVideoEpisodes([item])[0];
  if (!episode) {
    return null;
  }

  return {
    ...episode,
    ...stringField('plot', item.plot),
    ...arrayStringField('director', item.director),
    ...arrayStringField('writer', item.writer),
    ...numberField('rating', item.rating),
    ...numberField('userrating', item.userrating),
    ...stringField('firstaired', item.firstaired),
    ...uniqueIdField(item.uniqueid),
    thumbnailAvailable: isSafeArtworkReference(item.thumbnail),
    fanartAvailable: isSafeArtworkReference(item.fanart),
    artwork: artworkAvailabilityField(item.art)
  };
}

export function normalizeSeasonArtworkRefreshCapability(
  value: unknown
): VideoSeasonArtworkRefreshCapabilitySnapshot {
  if (!isRecord(value)) {
    return { status: 'unavailable', reason: 'Season artwork capability response was malformed.' };
  }

  if (value.status === 'error') {
    return {
      status: 'error',
      message: sanitizeErrorMessage(
        typeof value.message === 'string' && value.message.length > 0
          ? value.message
          : 'Season artwork capability failed.'
      )
    };
  }

  const availableArtTypes = normalizeSafeArtTypeList(value.availablearttypes);
  const availableArtwork = normalizeAvailableArtwork(value.availableart, availableArtTypes);

  if (availableArtTypes.length === 0) {
    return { status: 'unsupported', reason: 'Kodi did not report safe season artwork types.' };
  }

  return {
    status: 'supported',
    reason: 'Season artwork refresh is available.',
    availableArtTypes,
    availableArtwork
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

export function cloneVideoTvShowSnapshots(
  tvShows: readonly VideoTvShowSnapshot[]
): VideoTvShowSnapshot[] {
  return tvShows.map((tvShow) => ({
    ...tvShow,
    ...(tvShow.art ? { art: { ...tvShow.art } } : {})
  }));
}

export function cloneVideoTvShowDetailSnapshot(
  detail: VideoTvShowDetailSnapshot | null
): VideoTvShowDetailSnapshot | null {
  return detail
    ? {
        ...detail,
        ...(detail.art ? { art: { ...detail.art } } : {}),
        ...(detail.genre ? { genre: [...detail.genre] } : {}),
        ...(detail.studio ? { studio: [...detail.studio] } : {}),
        ...(detail.uniqueid ? { uniqueid: { ...detail.uniqueid } } : {}),
        artwork: { ...detail.artwork }
      }
    : null;
}

export function cloneVideoSeasonSnapshots(
  seasons: readonly VideoSeasonSnapshot[]
): VideoSeasonSnapshot[] {
  return seasons.map((season) => ({
    ...season,
    ...(season.art ? { art: { ...season.art } } : {})
  }));
}

export function cloneVideoEpisodeSnapshots(
  episodes: readonly VideoEpisodeSnapshot[]
): VideoEpisodeSnapshot[] {
  return episodes.map((episode) => ({
    ...episode,
    ...(episode.art ? { art: { ...episode.art } } : {}),
    ...(episode.resume ? { resume: { ...episode.resume } } : {})
  }));
}

export function cloneVideoEpisodeDetailSnapshot(
  detail: VideoEpisodeDetailSnapshot | null
): VideoEpisodeDetailSnapshot | null {
  return detail
    ? {
        ...detail,
        ...(detail.art ? { art: { ...detail.art } } : {}),
        ...(detail.resume ? { resume: { ...detail.resume } } : {}),
        ...(detail.director ? { director: [...detail.director] } : {}),
        ...(detail.writer ? { writer: [...detail.writer] } : {}),
        ...(detail.uniqueid ? { uniqueid: { ...detail.uniqueid } } : {}),
        artwork: { ...detail.artwork }
      }
    : null;
}

export function cloneSeasonArtworkRefreshCapabilitySnapshot(
  capability: VideoSeasonArtworkRefreshCapabilitySnapshot
): VideoSeasonArtworkRefreshCapabilitySnapshot {
  return capability.status === 'supported'
    ? {
        ...capability,
        availableArtTypes: [...capability.availableArtTypes],
        availableArtwork: { ...capability.availableArtwork }
      }
    : { ...capability };
}

export function cloneVideoTvStoreSnapshot(snapshot: VideoTvStoreSnapshot): VideoTvStoreSnapshot {
  return {
    ...snapshot,
    tvShows: cloneVideoTvShowSnapshots(snapshot.tvShows),
    tvShowDetail: cloneVideoTvShowDetailSnapshot(snapshot.tvShowDetail),
    seasons: cloneVideoSeasonSnapshots(snapshot.seasons),
    episodes: cloneVideoEpisodeSnapshots(snapshot.episodes),
    episodeDetail: cloneVideoEpisodeDetailSnapshot(snapshot.episodeDetail),
    limits: {
      tvShows: cloneVideoLibraryLimits(snapshot.limits.tvShows),
      seasons: cloneVideoLibraryLimits(snapshot.limits.seasons),
      episodes: cloneVideoLibraryLimits(snapshot.limits.episodes)
    },
    seasonArtworkCapability: cloneSeasonArtworkRefreshCapabilitySnapshot(
      snapshot.seasonArtworkCapability
    ),
    lastError: cloneVideoLibrarySafeError(snapshot.lastError)
  };
}

export function cloneVideoLibrarySnapshot(
  snapshot: VideoLibraryStoreSnapshot
): VideoLibraryStoreSnapshot {
  return {
    ...snapshot,
    movies: cloneVideoLibraryMovieSnapshots(snapshot.movies),
    tvShows: cloneVideoTvShowSnapshots(snapshot.tvShows ?? []),
    limits: {
      movies: cloneVideoLibraryLimits(snapshot.limits.movies),
      tvShows: cloneVideoLibraryLimits(snapshot.limits.tvShows ?? { start: 0, end: 0, total: 0 })
    },
    lastError: cloneVideoLibrarySafeError(snapshot.lastError)
  };
}

function normalizeTvShowBase(
  item: Record<string, unknown>,
  tvshowid: number,
  fallbackLabel: string
): VideoTvShowSnapshot {
  const playcount = finiteNonNegativeNumber(item.playcount);
  return {
    tvshowid,
    label: safeStringValue(item.label) ?? safeStringValue(item.title) ?? fallbackLabel,
    ...stringField('title', item.title),
    ...numberField('year', item.year),
    ...stringField('thumbnail', item.thumbnail),
    ...stringField('fanart', item.fanart),
    ...artField(item.art),
    ...episodeCountFields(item),
    ...(playcount === undefined ? {} : { playcount, watched: playcount > 0 }),
    ...stringField('lastplayed', item.lastplayed),
    ...stringField('dateadded', item.dateadded)
  };
}

function episodeCountFields(
  item: Record<string, unknown>
): Pick<
  VideoTvShowSnapshot,
  'episodeCount' | 'watchedEpisodeCount' | 'unwatchedEpisodes' | 'hasUnwatched'
> {
  const episodeCount = finiteNonNegativeNumber(item.episode);
  const watchedEpisodeCount = finiteNonNegativeNumber(item.watchedepisodes);

  if (episodeCount === undefined && watchedEpisodeCount === undefined) {
    return {};
  }

  const total = episodeCount ?? 0;
  const watched = watchedEpisodeCount ?? 0;
  const unwatchedEpisodes = Math.max(total - watched, 0);

  return {
    ...(episodeCount === undefined ? {} : { episodeCount }),
    ...(watchedEpisodeCount === undefined ? {} : { watchedEpisodeCount }),
    unwatchedEpisodes,
    hasUnwatched: unwatchedEpisodes > 0
  };
}

function positiveIdField<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, number>> {
  const id = finitePositiveSafeId(value);
  return id === null ? {} : ({ [key]: id } as Partial<Record<Key, number>>);
}

function finiteNonNegativeSafeInteger(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function normalizeSafeArtTypeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => safeStringValue(item) !== undefined && item.toLowerCase() !== 'file'
  );
}

function normalizeAvailableArtwork(
  value: unknown,
  availableArtTypes: readonly string[]
): Record<string, boolean> {
  if (!isRecord(value)) {
    return Object.fromEntries(availableArtTypes.map((type) => [type, false]));
  }

  return Object.fromEntries(
    availableArtTypes.map((type) => {
      const artValue = value[type];
      const hasSafeArt = Array.isArray(artValue)
        ? artValue.some(isSafeArtworkReference)
        : isSafeArtworkReference(artValue);
      return [type, hasSafeArt];
    })
  );
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
