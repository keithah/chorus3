import { buildKodiPackageSafePrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
import type { TranslationContext } from '$lib/i18n';
import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
import type {
  MediaSearchResult,
  MediaSearchScope,
  MediaSearchStoreSnapshot
} from '$lib/stores/mediaSearch.svelte';
import { displayText, textOrNull } from './mediaSearchFormatting';
export type MediaSearchActionItem =
  | { kind: 'artist'; id: number }
  | { kind: 'album'; id: number }
  | { kind: 'song'; id: number };

export type ResultGroupKey =
  | 'artists'
  | 'albums'
  | 'songs'
  | 'genres'
  | 'movies'
  | 'tvShows'
  | 'musicVideos';

export type ResultLayout = 'poster' | 'square' | 'song' | 'text';

export const VISIBLE_RESULT_ORDER = [
  'movies',
  'tvShows',
  'artists',
  'albums',
  'songs',
  'musicVideos',
  'genres'
] as const satisfies readonly ResultGroupKey[];

export function resultSectionClass(kind: ResultGroupKey): string {
  const layout = resultLayout(kind);
  if (layout === 'song' || layout === 'text') {
    return 'result-section result-section--rows';
  }

  if (layout === 'square') {
    return 'result-section result-section--square';
  }

  return 'result-section result-section--poster';
}

export function resultLayout(kind: ResultGroupKey): ResultLayout {
  switch (kind) {
    case 'songs':
      return 'song';
    case 'genres':
      return 'text';
    case 'artists':
    case 'albums':
      return 'square';
    default:
      return 'poster';
  }
}

export function resultSectionHeading(kind: ResultGroupKey, i18n: TranslationContext): string {
  switch (kind) {
    case 'artists':
      return i18n.t('media.heading.artists');
    case 'albums':
      return i18n.t('media.heading.albums');
    case 'songs':
      return i18n.t('media.heading.songs');
    case 'genres':
      return i18n.t('media.heading.genres');
    case 'movies':
      return 'Movies';
    case 'tvShows':
      return 'TV Shows';
    case 'musicVideos':
      return 'Music Videos';
  }
}

function sectionMatchesScope(kind: ResultGroupKey, scope: MediaSearchScope): boolean {
  switch (scope) {
    case 'artist':
      return kind === 'artists';
    case 'album':
      return kind === 'albums';
    case 'song':
      return kind === 'songs';
    case 'genre':
      return kind === 'genres';
    case 'movie':
      return kind === 'movies';
    case 'tvshow':
      return kind === 'tvShows';
    case 'musicvideo':
      return kind === 'musicVideos';
    default:
      return false;
  }
}

export function shouldShowResultSection(
  snapshot: MediaSearchStoreSnapshot,
  kind: ResultGroupKey
): boolean {
  if (snapshot.searchStatus === 'idle') {
    return false;
  }

  if (snapshot.results[kind].length > 0) {
    return true;
  }

  return sectionMatchesScope(kind, snapshot.scope);
}

export function sectionEmptyCopy(kind: ResultGroupKey, i18n: TranslationContext): string {
  switch (kind) {
    case 'artists':
      return i18n.t('media.search.empty.artists');
    case 'albums':
      return i18n.t('media.search.empty.albums');
    case 'songs':
      return i18n.t('media.search.empty.songs');
    case 'genres':
      return i18n.t('media.search.empty.genres');
    case 'movies':
      return 'No matching movies.';
    case 'tvShows':
      return 'No matching TV shows.';
    case 'musicVideos':
      return 'No matching music videos.';
  }
}

export function searchActionFor(result: MediaSearchResult): MediaSearchActionItem | null {
  if (result.kind === 'artist') {
    return isPositiveInteger(result.artistid) ? { kind: 'artist', id: result.artistid } : null;
  }

  if (result.kind === 'album') {
    return isPositiveInteger(result.albumid) ? { kind: 'album', id: result.albumid } : null;
  }

  if (result.kind === 'song') {
    return isPositiveInteger(result.songid) ? { kind: 'song', id: result.songid } : null;
  }

  return null;
}

export function resultHref(
  result: MediaSearchResult,
  buildOptions: BuildAppRouteOptions
): string | null {
  switch (result.kind) {
    case 'movie':
      return isPositiveInteger(result.movieid)
        ? buildKodiPackageSafePrimaryAppRoute(
            { kind: 'movieDetail', movieid: String(result.movieid) },
            buildOptions
          )
        : null;
    case 'tvshow':
      return isPositiveInteger(result.tvshowid)
        ? buildKodiPackageSafePrimaryAppRoute(
            { kind: 'tvshowDetail', tvshowid: String(result.tvshowid) },
            buildOptions
          )
        : null;
    case 'musicvideo':
      return isPositiveInteger(result.musicvideoid)
        ? buildKodiPackageSafePrimaryAppRoute(
            { kind: 'musicVideoDetail', musicvideoid: String(result.musicvideoid) },
            buildOptions
          )
        : null;
    case 'artist':
      return isPositiveInteger(result.artistid)
        ? buildKodiPackageSafePrimaryAppRoute(
            { kind: 'musicArtistDetail', artistid: String(result.artistid) },
            buildOptions
          )
        : null;
    case 'album':
      return isPositiveInteger(result.albumid)
        ? buildKodiPackageSafePrimaryAppRoute(
            { kind: 'musicAlbumDetail', albumid: String(result.albumid) },
            buildOptions
          )
        : null;
    case 'genre':
      return isPositiveInteger(result.genreid)
        ? buildKodiPackageSafePrimaryAppRoute(
            { kind: 'musicGenreDetail', genreid: String(result.genreid) },
            buildOptions
          )
        : null;
    default:
      return null;
  }
}

export function resultImageUrl(result: MediaSearchResult): string | null {
  return (
    optionalKodiImageUrl(typeof result.thumbnail === 'string' ? result.thumbnail : null) ?? null
  );
}

export function safeEachKey(prefix: string, id: unknown, index: number): string {
  return isPositiveInteger(id) ? `${prefix}:${id}` : `${prefix}:invalid:${index}`;
}

export function resultStableKey(result: MediaSearchResult, index: number): string {
  switch (result.kind) {
    case 'artist':
      return safeEachKey('artist', result.artistid, index);
    case 'album':
      return safeEachKey('album', result.albumid, index);
    case 'song':
      return safeEachKey('song', result.songid, index);
    case 'genre':
      return safeEachKey('genre', result.genreid, index);
    case 'movie':
      return safeEachKey('movie', result.movieid, index);
    case 'tvshow':
      return safeEachKey('tvshow', result.tvshowid, index);
    case 'musicvideo':
      return safeEachKey('musicvideo', result.musicvideoid, index);
  }
}

export function resultLabel(result: MediaSearchResult, i18n: TranslationContext): string {
  switch (result.kind) {
    case 'artist':
      return displayText(result.label, i18n.t('media.unknown.artist'));
    case 'album':
      return displayText(result.title ?? result.label, i18n.t('media.unknown.album'));
    case 'song':
      return displayText(result.title ?? result.label, i18n.t('media.unknown.song'));
    case 'genre':
      return displayText(result.title ?? result.label, i18n.t('media.unknown.genre'));
    case 'movie':
      return displayText(result.title ?? result.label, 'Unknown movie');
    case 'tvshow':
      return displayText(result.title ?? result.label, 'Unknown TV show');
    case 'musicvideo':
      return displayText(result.title ?? result.label, 'Unknown music video');
  }
}

export function resultMeta(result: MediaSearchResult, i18n: TranslationContext): string | null {
  switch (result.kind) {
    case 'artist':
      return joinText(result.genre);
    case 'album':
      return [joinText(result.artist), formatYear(result.year)].filter(Boolean).join(' · ') || null;
    case 'song':
      return (
        [
          joinText(result.artist),
          textOrNull(result.album),
          formatDuration(result.duration),
          formatTrack(result.track, i18n),
          formatPlaycount(result.playcount, i18n)
        ]
          .filter(Boolean)
          .join(' · ') || null
      );
    case 'movie':
      return formatYear(result.year);
    case 'tvshow':
      return formatYear(result.year);
    case 'musicvideo':
      return (
        [joinText(result.artist), result.album, formatYear(result.year)]
          .filter(Boolean)
          .join(' · ') || null
      );
    case 'genre':
      return null;
  }
}

function joinText(values: unknown): string | null {
  if (Array.isArray(values)) {
    const joined = values
      .map((entry) => textOrNull(entry))
      .filter((entry): entry is string => Boolean(entry))
      .join(', ');
    return joined || null;
  }

  return textOrNull(values);
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function formatDuration(seconds: unknown): string | null {
  const value = numberOrNull(seconds);
  if (value === null) {
    return null;
  }

  const safeSeconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
  }

  return `${minutes}:${pad2(remainingSeconds)}`;
}

function formatYear(value: unknown): string | null {
  const year = numberOrNull(value);
  return year === null ? null : String(Math.trunc(year));
}

function formatTrack(value: unknown, i18n: TranslationContext): string | null {
  const track = numberOrNull(value);
  return track === null ? null : i18n.t('media.meta.track', { track: Math.trunc(track) });
}

function formatPlaycount(value: unknown, i18n: TranslationContext): string | null {
  const playcount = numberOrNull(value);
  if (playcount === null) {
    return null;
  }

  const rounded = Math.max(0, Math.trunc(playcount));
  return rounded === 1
    ? i18n.t('media.meta.playedOnce')
    : i18n.t('media.meta.playedTimes', { count: rounded });
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}
