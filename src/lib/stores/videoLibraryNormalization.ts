import { KodiHttpClientError, isKodiHttpClientError, type KodiLimits } from '$lib/kodi';
import { redactStoreErrorMessage } from '$lib/safety/redaction';

import type {
  VideoEpisodeDetailSnapshot,
  VideoEpisodeSnapshot,
  VideoLibraryLimitsSnapshot,
  VideoLibraryMovieSnapshot,
  VideoLibrarySafeErrorSnapshot,
  VideoMovieDetailSnapshot,
  VideoMovieVersionItemSnapshot,
  VideoMovieVersionsSnapshot,
  VideoMusicVideoSnapshot,
  VideoSeasonArtworkRefreshCapabilitySnapshot,
  VideoSeasonSnapshot,
  VideoTvShowDetailSnapshot,
  VideoTvShowSnapshot
} from './videoLibraryTypes';
export type * from './videoLibraryTypes';

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
      ...arrayStringField('genre', item.genre),
      ...arrayStringField('director', item.director),
      ...arrayStringField('writer', item.writer),
      ...castField(item.cast),
      ...arrayStringField('studio', item.studio),
      ...stringField('mpaa', item.mpaa),
      ...numberField('rating', item.rating),
      ...setField(item.set),
      ...arrayStringField('tag', item.tag),
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
    ...stringField('thumbnail', item.thumbnail),
    ...stringField('fanart', item.fanart),
    ...artField(item.art),
    ...stringField('plot', item.plot),
    ...stringField('plotoutline', item.plotoutline),
    ...stringField('tagline', item.tagline),
    ...arrayStringField('genre', item.genre),
    ...arrayStringField('director', item.director),
    ...arrayStringField('writer', item.writer),
    ...castField(item.cast),
    ...arrayStringField('studio', item.studio),
    ...stringField('mpaa', item.mpaa),
    ...numberField('rating', item.rating),
    ...numberField('userrating', item.userrating),
    ...stringField('premiered', item.premiered),
    ...stringField('imdbnumber', item.imdbnumber),
    ...streamDetailsField(item.streamdetails),
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
    ...stringField('mpaa', item.mpaa),
    ...stringField('imdbnumber', item.imdbnumber),
    ...stringField('sorttitle', item.sorttitle),
    ...stringField('originaltitle', item.originaltitle),
    ...arrayStringField('tag', item.tag),
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

export function normalizeVideoEpisodes(
  items: unknown,
  options: { preserveOrder?: boolean } = {}
): VideoEpisodeSnapshot[] {
  const episodes = normalizeRecordList(items).flatMap((item): VideoEpisodeSnapshot[] => {
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
  });

  return options.preserveOrder
    ? episodes
    : episodes.sort(
        (left, right) =>
          (left.season ?? 0) - (right.season ?? 0) ||
          (left.episode ?? 0) - (right.episode ?? 0) ||
          left.episodeid - right.episodeid
      );
}

export function normalizeVideoMusicVideos(items: unknown): VideoMusicVideoSnapshot[] {
  return normalizeRecordList(items).flatMap((item): VideoMusicVideoSnapshot[] => {
    const musicvideoid = finitePositiveSafeId(item.musicvideoid);
    if (musicvideoid === null) {
      return [];
    }

    const playcount = finiteNonNegativeNumber(item.playcount);
    return [
      {
        musicvideoid,
        label: safeStringValue(item.label) ?? safeStringValue(item.title) ?? 'Unknown music video',
        ...stringField('title', item.title),
        ...arrayStringField('artist', item.artist),
        ...stringField('album', item.album),
        ...numberField('year', item.year),
        ...numberField('runtime', item.runtime),
        ...stringField('thumbnail', item.thumbnail),
        ...stringField('fanart', item.fanart),
        ...artField(item.art),
        ...arrayStringField('genre', item.genre),
        ...arrayStringField('director', item.director),
        ...arrayStringField('studio', item.studio),
        ...stringField('plot', item.plot),
        ...numberField('rating', item.rating),
        ...numberField('track', item.track),
        ...arrayStringField('tag', item.tag),
        ...(playcount === undefined ? {} : { playcount, watched: playcount > 0 }),
        ...stringField('lastplayed', item.lastplayed),
        ...resumeField(item.resume),
        ...stringField('dateadded', item.dateadded)
      }
    ];
  });
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

export * from './videoLibraryCloning';

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
    ...arrayStringField('genre', item.genre),
    ...castField(item.cast),
    ...arrayStringField('studio', item.studio),
    ...stringField('mpaa', item.mpaa),
    ...numberField('rating', item.rating),
    ...arrayStringField('tag', item.tag),
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
  return redactStoreErrorMessage(message);
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

function castField(value: unknown): Partial<Pick<VideoMovieDetailSnapshot, 'cast'>> {
  if (!Array.isArray(value)) {
    return {};
  }

  const cast = value.flatMap((entry): string[] => {
    if (typeof entry === 'string') {
      const name = safeStringValue(entry);
      return name === undefined ? [] : [name];
    }

    if (!isRecord(entry)) {
      return [];
    }

    const name = safeStringValue(entry.name);
    return name === undefined ? [] : [name];
  });

  return cast.length === 0 ? {} : { cast };
}

function streamDetailsField(
  value: unknown
): Partial<Pick<VideoMovieDetailSnapshot, 'streamdetails'>> {
  if (!isRecord(value)) {
    return {};
  }

  const video = streamDetailList(value.video, formatVideoStreamDetail);
  const audio = streamDetailList(value.audio, formatAudioStreamDetail);
  const subtitle = streamDetailList(value.subtitle, formatSubtitleStreamDetail);

  if (video.length === 0 && audio.length === 0 && subtitle.length === 0) {
    return {};
  }

  return { streamdetails: { video, audio, subtitle } };
}

function streamDetailList(
  value: unknown,
  formatter: (record: Record<string, unknown>) => string | null
): string[] {
  return Array.isArray(value)
    ? value.flatMap((entry): string[] => {
        if (!isRecord(entry)) {
          return [];
        }

        const formatted = formatter(entry);
        return formatted === null ? [] : [formatted];
      })
    : [];
}

function formatVideoStreamDetail(record: Record<string, unknown>): string | null {
  const codec = safeStringValue(record.codec)?.toUpperCase();
  const width = finiteNonNegativeNumber(record.width);
  const height = finiteNonNegativeNumber(record.height);
  const aspect = finiteNonNegativeNumber(record.aspect);
  const quality =
    width !== undefined && height !== undefined
      ? width >= 1280 || height >= 720
        ? 'HD'
        : 'SD'
      : undefined;
  const dimensions =
    width !== undefined && height !== undefined ? `(${width} X ${height})` : undefined;
  const aspectLabel =
    aspect !== undefined && aspect >= 1 && aspect <= 3
      ? `[${aspect.toFixed(2)}]`
      : '[UNKNOWN ASPECT RATIO]';

  return [codec, quality, dimensions, aspectLabel].filter(Boolean).join(' ') || null;
}

function formatAudioStreamDetail(record: Record<string, unknown>): string | null {
  const codec = safeStringValue(record.codec)?.toUpperCase();
  const channels = finiteNonNegativeNumber(record.channels);
  const language = languageLabel(record.language);
  const channelLabel =
    channels === undefined ? undefined : channels === 2 ? '2.1' : String(channels);

  return (
    [codec, channelLabel, language ? `(${language})` : undefined].filter(Boolean).join(' ') || null
  );
}

function formatSubtitleStreamDetail(record: Record<string, unknown>): string | null {
  return languageLabel(record.language) ?? safeStringValue(record.name) ?? null;
}

function languageLabel(value: unknown): string | undefined {
  const language = safeStringValue(value)?.trim().toLowerCase();
  if (!language || language === 'und') {
    return undefined;
  }

  const known: Record<string, string> = {
    eng: 'ENGLISH',
    en: 'ENGLISH',
    pol: 'POLISH',
    pl: 'POLISH',
    spa: 'SPANISH',
    es: 'SPANISH',
    fre: 'FRENCH',
    fra: 'FRENCH',
    fr: 'FRENCH',
    ger: 'GERMAN',
    deu: 'GERMAN',
    de: 'GERMAN',
    ita: 'ITALIAN',
    it: 'ITALIAN',
    jpn: 'JAPANESE',
    ja: 'JAPANESE'
  };

  return known[language] ?? language.toUpperCase();
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

function setField(value: unknown): Partial<Pick<VideoLibraryMovieSnapshot, 'set'>> {
  if (typeof value === 'string') {
    const normalized = safeStringValue(value);
    return normalized === undefined ? {} : { set: normalized };
  }

  if (!isRecord(value)) {
    return {};
  }

  const normalized = safeStringValue(value.set);
  return normalized === undefined ? {} : { set: normalized };
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
