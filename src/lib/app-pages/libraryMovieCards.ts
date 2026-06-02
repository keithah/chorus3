import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
import { firstOptionalKodiImageUrl, optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
import type { VideoLibraryMovieSnapshot } from '$lib/stores/videoLibrary.svelte';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
import type { VideoMovieDetailSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
import type { LibraryCard } from './libraryCards';

export type LibraryDetailRow = { label: string; value: string };
export type MovieDetailSource = VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot;

export function movieCards(items: readonly VideoLibraryMovieSnapshot[]): LibraryCard[] {
  return items.map(movieCard);
}

export function movieCard(item: MovieDetailSource): LibraryCard {
  return {
    key: `movie:${item.movieid}`,
    title: safe(item.title ?? item.label, 'Unknown movie'),
    subtitle: typeof item.year === 'number' ? String(item.year) : undefined,
    thumbnail: moviePosterUrl(item),
    poster: true,
    route: { kind: 'movieDetail', movieid: String(item.movieid) },
    action: { media: 'movie', movieid: item.movieid },
    source: metadataSource(item)
  };
}

export function findMovieSnapshot(
  video: VideoLibraryStoreSnapshot,
  movieid: number
): VideoLibraryMovieSnapshot | null {
  return (
    [...video.movies, ...video.recentlyAddedMovies, ...video.recentlyPlayedMovies].find(
      (item) => item.movieid === movieid
    ) ?? null
  );
}

export function movieDetailRows(item: MovieDetailSource): LibraryDetailRow[] {
  const detail = movieDetailFields(item);
  const runtime = formatRuntime(item.runtime);
  const resume = formatResume(item.resume);

  return [
    { label: 'year', value: typeof item.year === 'number' ? String(item.year) : '' },
    { label: 'runtime', value: runtime },
    { label: 'genres', value: join(detail.genre) ?? '' },
    { label: 'Directors', value: join(detail.director) ?? '' },
    { label: 'Studios', value: join(detail.studio) ?? '' },
    { label: 'MPAA', value: safe(detail.mpaa, '') },
    { label: 'rating', value: typeof detail.rating === 'number' ? String(detail.rating) : '' },
    {
      label: 'user rating',
      value: typeof detail.userrating === 'number' ? String(detail.userrating) : ''
    },
    { label: 'premiered', value: safe(detail.premiered, '') },
    { label: 'date added', value: safe(item.dateadded, '') },
    { label: 'last played', value: safe(item.lastplayed, '') },
    { label: 'resume', value: resume },
    { label: 'watched', value: watchedLabel(item) }
  ].filter((row) => row.value.length > 0);
}

export function moviePlot(item: MovieDetailSource): string | undefined {
  const detail = movieDetailFields(item);
  return (
    safe(detail.plot, '') || safe(detail.plotoutline, '') || safe(detail.tagline, '') || undefined
  );
}

export function movieTagline(item: MovieDetailSource): string | undefined {
  return (
    safe(movieDetailFields(item).tagline, '') ||
    safe(movieDetailFields(item).plotoutline, '') ||
    undefined
  );
}

export function moviePosterUrl(item: MovieDetailSource): string | undefined {
  return preferredVideoPosterUrl(item);
}

export function movieFanartUrl(item: MovieDetailSource): string | undefined {
  return (
    optionalKodiImageUrl(item.art?.['fanart']) ??
    optionalKodiImageUrl(item.fanart) ??
    optionalKodiImageUrl(item.art?.['thumb']) ??
    optionalKodiImageUrl(item.thumbnail)
  );
}

export function movieDuration(item: MovieDetailSource): string {
  const runtime = typeof item.runtime === 'number' ? item.runtime : 0;
  if (!Number.isFinite(runtime) || runtime <= 0) {
    return '';
  }

  const hours = Math.floor(runtime / 3600);
  const minutes = Math.floor((runtime % 3600) / 60);
  const seconds = Math.floor(runtime % 60);
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function movieDetailMeta(item: MovieDetailSource): LibraryDetailRow[] {
  const detail = movieDetailFields(item);

  return [
    { label: 'Genre', value: join(detail.genre) ?? '' },
    { label: 'Director', value: join(detail.director) ?? '' },
    { label: 'Writers', value: join(detail.writer) ?? '' },
    { label: 'Cast', value: joinLimited(detail.cast, 12) ?? '' },
    { label: 'Rated', value: safe(detail.mpaa, '') }
  ].filter((row) => row.value.length > 0);
}

export function movieStreamMeta(item: MovieDetailSource): LibraryDetailRow[] {
  const streams = movieDetailFields(item).streamdetails;
  if (!streams) {
    return [];
  }

  return [
    { label: 'Video', value: streams.video.join(', ') },
    { label: 'Audio', value: streams.audio.join(', ') },
    { label: 'Subtitle', value: streams.subtitle.join(', ') }
  ].filter((row) => row.value.length > 0);
}

export function movieDetailSearchHref(
  movie: MovieDetailSource,
  buildOptions: BuildAppRouteOptions
): string {
  return buildPrimaryAppRoute(
    { kind: 'searchMedia', media: 'all', query: safe(movie.title ?? movie.label, 'Movie') },
    buildOptions
  );
}

export function googleMovieSearchHref(movie: MovieDetailSource): string {
  return `https://www.google.com/search?q=${encodeURIComponent(safe(movie.title ?? movie.label, 'Movie'))}`;
}

export function imdbMovieHref(movie: MovieDetailSource): string {
  const id = safe(movieDetailFields(movie).imdbnumber, '');
  return id
    ? `https://www.imdb.com/title/${encodeURIComponent(id)}/`
    : `https://www.imdb.com/find/?q=${encodeURIComponent(safe(movie.title ?? movie.label, 'Movie'))}`;
}

export function youtubeMovieHref(movie: MovieDetailSource): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(safe(movie.title ?? movie.label, 'Movie'))}`;
}

export function movieWatchedButtonLabel(movie: MovieDetailSource): string {
  return watchedLabel(movie) === 'Watched' ? 'Set unwatched' : 'Set watched';
}

export function movieRating(item: MovieDetailSource | null): number | undefined {
  if (!item) {
    return undefined;
  }

  const rating = movieDetailFields(item).rating;
  return typeof rating === 'number' ? rating : undefined;
}

function movieDetailFields(item: MovieDetailSource): Partial<VideoMovieDetailSnapshot> {
  return item as Partial<VideoMovieDetailSnapshot>;
}

function formatRuntime(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }

  const minutes = Math.round(value / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`;
}

function formatResume(value: unknown): string {
  if (
    !value ||
    typeof value !== 'object' ||
    !('position' in value) ||
    typeof value.position !== 'number' ||
    !Number.isFinite(value.position) ||
    value.position <= 0
  ) {
    return '';
  }

  return `${formatRuntime(value.position)} watched`;
}

function watchedLabel(item: MovieDetailSource): string {
  if (typeof item.watched === 'boolean') {
    return item.watched ? 'Watched' : 'Not watched';
  }

  return typeof item.playcount === 'number' && item.playcount > 0 ? 'Watched' : '';
}

function preferredVideoPosterUrl(item: {
  thumbnail?: string;
  art?: Record<string, unknown>;
}): string | undefined {
  return firstOptionalKodiImageUrl(item.art?.['poster'], item.thumbnail);
}

function metadataSource(item: object): Record<string, unknown> {
  return { ...item };
}

function joinLimited(values: unknown, limit: number): string | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const normalized = values.map((entry) => safe(entry, '')).filter(Boolean);
  if (normalized.length === 0) {
    return undefined;
  }

  return normalized.slice(0, limit).join(', ');
}

function join(values: unknown): string | undefined {
  if (Array.isArray(values)) return values.filter(Boolean).join(', ') || undefined;
  if (typeof values === 'string' && values.trim()) return values.trim();
  return undefined;
}

function safe(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
