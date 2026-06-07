import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
import type {
  MusicLibraryGenreSnapshot,
  MusicLibrarySongSnapshot,
  MusicLibraryStoreSnapshot
} from '$lib/stores/musicLibrary.svelte';
import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
import type {
  VideoEpisodeSnapshot,
  VideoLibraryStoreSnapshot,
  VideoMusicVideoSnapshot
} from '$lib/stores/videoLibrary.svelte';
import { albumCards, artistCards, type LibraryCard } from '$lib/app-pages/libraryCards';
import {
  findMovieSnapshot,
  movieCard,
  movieDetailRows,
  moviePlot,
  movieRating,
  type LibraryDetailRow,
  type MovieDetailSource
} from '$lib/app-pages/libraryMovieCards';
import type { LibraryPageFilters } from '$lib/app-pages/libraryPageFiltering';
import type { LibraryRoute } from '$lib/app-pages/libraryRouteFilters';

export type LibraryContentSection = {
  title?: string;
  cards: LibraryCard[];
  empty: string;
  compact?: boolean;
  detailRows?: LibraryDetailRow[];
  description?: string;
  rating?: number;
  movieDetail?: MovieDetailSource;
  movieDetailLoading?: boolean;
  movieDetailError?: boolean;
};

export function libraryContentSections({
  route,
  music,
  video,
  movieDetail,
  musicVideoDetailsById,
  missingMusicVideoDetailIds,
  loadingMusicVideoDetailIds,
  filters
}: {
  route: LibraryRoute;
  music: MusicLibraryStoreSnapshot;
  video: VideoLibraryStoreSnapshot;
  movieDetail?: VideoMovieDetailStoreSnapshot;
  musicVideoDetailsById: Readonly<Record<number, VideoMusicVideoSnapshot>>;
  missingMusicVideoDetailIds: Readonly<Record<number, true>>;
  loadingMusicVideoDetailIds: Readonly<Record<number, true>>;
  filters: LibraryPageFilters;
}): LibraryContentSection[] {
  switch (route.kind) {
    case 'music':
    case 'home':
      return [
        {
          title: 'Recently Added Albums',
          cards: albumCards(filters.albums(music.albums)),
          empty: 'No albums found.'
        },
        {
          title: 'Recently Played Albums',
          cards: songAlbumCards(music.recentlyPlayedSongs),
          empty: 'No recently played albums found.'
        }
      ];
    case 'musicTop':
      return [
        {
          title: 'Recently Added',
          cards: songCards(filters.songs(music.recentlyAddedSongs)),
          empty: 'No recently added music found.'
        },
        {
          title: 'Recently Played',
          cards: songCards(filters.songs(music.recentlyPlayedSongs)),
          empty: 'No recently played music found.'
        },
        {
          title: 'Most Played',
          cards: songCards(filters.songs(music.mostPlayedSongs)),
          empty: 'No top music found.'
        }
      ];
    case 'musicArtists':
      return [{ cards: artistCards(filters.artists(music.artists)), empty: 'No artists found.' }];
    case 'musicAlbums':
      return [{ cards: albumCards(filters.albums(music.albums)), empty: 'No albums found.' }];
    case 'musicGenres':
      return [{ cards: genreCards(music.genres), empty: 'No genres found.', compact: true }];
    case 'musicVideos':
      return [
        {
          cards: musicVideoCards(filters.musicVideos(video.musicVideos ?? [])),
          empty: 'No music videos found.'
        }
      ];
    case 'musicVideoDetail':
      return musicVideoDetailSections({
        route,
        video,
        filters,
        musicVideoDetailsById,
        missingMusicVideoDetailIds,
        loadingMusicVideoDetailIds
      });
    case 'musicAlbumDetail':
    case 'musicArtistDetail':
      return [];
    case 'musicGenreDetail':
      return musicGenreSections(route.genreid, music, filters);
    case 'moviesRecent':
      return [
        {
          title: 'Recently Added',
          cards: movieCards(filters.movies(video.recentlyAddedMovies)),
          empty: 'No recently added movies found.'
        },
        {
          title: 'Random Movies',
          cards: movieCards(
            filters.movies(
              video.recentlyPlayedMovies.length ? video.recentlyPlayedMovies : video.movies
            )
          ),
          empty: 'No random movies found.'
        }
      ];
    case 'movies':
      return [{ cards: movieCards(filters.movies(video.movies)), empty: 'No movies found.' }];
    case 'movieDetail':
      return movieDetailSections(route.movieid, video, movieDetail);
    case 'tvshowsRecent':
      return [
        {
          title: 'Recently Added Episodes',
          cards: episodeCards(filters.episodes(video.recentlyAddedEpisodes)),
          empty: 'No recently added episodes found.'
        },
        {
          title: 'Recently Played Episodes',
          cards: episodeCards(filters.episodes(video.recentlyPlayedEpisodes)),
          empty: 'No recently played episodes found.'
        }
      ];
    case 'tvshows':
      return [{ cards: tvShowCards(filters.tvShows(video.tvShows)), empty: 'No TV shows found.' }];
    case 'tvshowDetail': {
      const tvshowid = Number(route.tvshowid);
      const show = video.tvShows.find((item) => item.tvshowid === tvshowid);

      return [
        {
          title: show ? safe(show.title ?? show.label, 'TV show') : 'TV show',
          cards: show ? tvShowCards(filters.tvShows([show])) : [],
          empty: 'TV show not found.'
        }
      ];
    }
    case 'tvshowSeasonDetail':
    case 'tvshowEpisodeDetail':
      return [
        {
          title: 'Episodes',
          cards: episodeCards(filters.episodes(video.recentlyAddedEpisodes)),
          empty: 'No episodes found.'
        }
      ];
    default:
      return [{ cards: [], empty: 'This section is not available yet.' }];
  }
}

function tvShowCards(
  items: readonly {
    tvshowid: number;
    title?: string;
    label: string;
    year?: number;
    thumbnail?: string;
    art?: Record<string, string>;
  }[]
): LibraryCard[] {
  return items.map((item) => ({
    key: `tvshow:${item.tvshowid}`,
    title: safe(item.title ?? item.label, 'Unknown TV show'),
    subtitle: typeof item.year === 'number' ? String(item.year) : undefined,
    thumbnail: preferredVideoPosterUrl(item),
    poster: true,
    route: { kind: 'tvshowDetail', tvshowid: String(item.tvshowid) },
    action: { media: 'tvshow', tvshowid: item.tvshowid },
    source: metadataSource(item)
  }));
}

function musicVideoCards(items: readonly VideoMusicVideoSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `musicvideo:${item.musicvideoid}`,
    title: safe(item.title ?? item.label, 'Unknown music video'),
    subtitle: join(item.artist) ?? safe(item.album, ''),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    artworkShape: 'square',
    route: { kind: 'musicVideoDetail', musicvideoid: String(item.musicvideoid) },
    action: { media: 'musicvideo', musicvideoid: item.musicvideoid },
    source: metadataSource(item)
  }));
}

function musicVideoDetailRows(item: VideoMusicVideoSnapshot): LibraryDetailRow[] {
  return [
    { label: 'artist', value: join(item.artist) ?? '' },
    { label: 'album', value: safe(item.album, '') },
    { label: 'genres', value: join(item.genre) ?? '' },
    { label: 'Directors', value: join(item.director) ?? '' },
    { label: 'Studios', value: join(item.studio) ?? '' },
    { label: 'year', value: typeof item.year === 'number' ? String(item.year) : '' },
    { label: 'track', value: typeof item.track === 'number' ? String(item.track) : '' },
    { label: 'tags', value: join(item.tag) ?? '' }
  ].filter((row) => row.value.length > 0);
}

function musicVideoDetailSections({
  route,
  video,
  filters,
  musicVideoDetailsById,
  missingMusicVideoDetailIds,
  loadingMusicVideoDetailIds
}: {
  route: Extract<LibraryRoute, { kind: 'musicVideoDetail' }>;
  video: VideoLibraryStoreSnapshot;
  filters: LibraryPageFilters;
  musicVideoDetailsById: Readonly<Record<number, VideoMusicVideoSnapshot>>;
  missingMusicVideoDetailIds: Readonly<Record<number, true>>;
  loadingMusicVideoDetailIds: Readonly<Record<number, true>>;
}): LibraryContentSection[] {
  const musicvideoid = Number(route.musicvideoid);
  const musicVideo =
    musicVideoDetailsById[musicvideoid] ??
    (video.musicVideos ?? []).find((item) => item.musicvideoid === musicvideoid);

  return [
    {
      title: musicVideo ? safe(musicVideo.title ?? musicVideo.label, 'Music video') : 'Music video',
      cards: musicVideo ? musicVideoCards(filters.musicVideos([musicVideo])) : [],
      detailRows: musicVideo ? musicVideoDetailRows(musicVideo) : [],
      description: musicVideo?.plot,
      rating: musicVideo?.rating,
      empty: loadingMusicVideoDetailIds[musicvideoid]
        ? 'Loading music video...'
        : missingMusicVideoDetailIds[musicvideoid]
          ? 'Music video not found.'
          : 'Loading music video...'
    }
  ];
}

function musicGenreSections(
  genreid: string,
  music: MusicLibraryStoreSnapshot,
  filters: LibraryPageFilters
): LibraryContentSection[] {
  const genre = resolveMusicGenre(genreid, music.genres);
  const genreLabel = resolveMusicGenreLabel(genreid, genre);
  const normalizedGenreLabel = normalizeComparableText(genreLabel);
  const artists = music.artists.filter((item) =>
    hasNormalizedArtist(item.genre, normalizedGenreLabel)
  );

  return [
    {
      title: safe(genreLabel, 'Genre'),
      cards: artists.length
        ? artistCards(filters.artists(artists))
        : genre
          ? genreCards([genre])
          : [],
      empty: 'No artists found for this genre.'
    }
  ];
}

function movieDetailSections(
  routeMovieId: string,
  video: VideoLibraryStoreSnapshot,
  movieDetail: VideoMovieDetailStoreSnapshot | undefined
): LibraryContentSection[] {
  const movieid = Number(routeMovieId);
  const detail =
    movieDetail?.selectedMovieId === movieid && movieDetail.detail?.movieid === movieid
      ? movieDetail.detail
      : null;
  const movie = detail ?? findMovieSnapshot(video, movieid);
  const isSelectedMovie = movieDetail?.selectedMovieId === movieid;
  const isLoading = isSelectedMovie && movieDetail?.refreshStatus === 'loading';
  const hasError = isSelectedMovie && movieDetail?.refreshStatus === 'error';
  const rating = movieRating(movie);

  return [
    {
      title: movie ? safe(movie.title ?? movie.label, 'Movie') : 'Movie',
      cards: [],
      movieDetail: movie ?? undefined,
      movieDetailLoading: isLoading,
      movieDetailError: hasError,
      ...(movie
        ? {
            detailRows: movieDetailRows(movie),
            description: moviePlot(movie),
            ...(rating === undefined ? {} : { rating })
          }
        : {}),
      empty: hasError
        ? 'Movie details could not be loaded.'
        : isLoading || !movie
          ? 'Loading movie...'
          : 'Movie not found.'
    }
  ];
}

function genreCards(items: readonly MusicLibraryGenreSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `genre:${item.genreid}`,
    title: safe(item.title ?? item.label, 'Unknown genre'),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    route: { kind: 'musicGenreDetail', genreid: String(item.genreid) }
  }));
}

function songAlbumCards(items: readonly MusicLibrarySongSnapshot[]): LibraryCard[] {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const title = safe(item.album, '');
    if (!title || seen.has(title)) return [];
    seen.add(title);
    return [
      {
        key: `song-album:${item.songid}`,
        title,
        subtitle: join(item.artist),
        thumbnail: optionalKodiImageUrl(item.thumbnail),
        artworkShape: 'square',
        action: { media: 'music', kind: 'song', songid: item.songid },
        source: metadataSource(item)
      }
    ];
  });
}

function songCards(items: readonly MusicLibrarySongSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `song:${item.songid}`,
    title: safe(item.title ?? item.label, 'Unknown song'),
    subtitle: join(item.artist) ?? safe(item.album, ''),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    artworkShape: 'square',
    action: { media: 'music', kind: 'song', songid: item.songid },
    source: metadataSource(item)
  }));
}

function movieCards(items: readonly MovieDetailSource[]): LibraryCard[] {
  return items.map(movieCard);
}

function episodeCards(items: readonly VideoEpisodeSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `episode:${item.episodeid}`,
    title: safe(item.title ?? item.label, 'Unknown episode'),
    subtitle: safe(item.showtitle, ''),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    action: { media: 'episode', episodeid: item.episodeid },
    source: metadataSource(item)
  }));
}

function metadataSource(item: object): Record<string, unknown> {
  return { ...item };
}

function preferredVideoPosterUrl(item: {
  thumbnail?: string;
  art?: Record<string, string> | undefined;
}): string | undefined {
  return (
    optionalKodiImageUrl(item.art?.poster) ??
    optionalKodiImageUrl(item.art?.thumb) ??
    optionalKodiImageUrl(item.thumbnail)
  );
}

function join(values: unknown): string | undefined {
  return Array.isArray(values)
    ? values
        .map((entry) => safe(entry, ''))
        .filter(Boolean)
        .join(', ') || undefined
    : undefined;
}

function hasNormalizedArtist(values: unknown, normalizedLabel: string): boolean {
  if (!normalizedLabel) return false;
  return Array.isArray(values)
    ? values.some((entry) => normalizeComparableText(safe(entry, '')) === normalizedLabel)
    : false;
}

function normalizeComparableText(value: string): string {
  return value.trim().toLowerCase();
}

function resolveMusicGenre(
  genreid: string,
  genres: readonly MusicLibraryGenreSnapshot[]
): MusicLibraryGenreSnapshot | null {
  const numericGenreId = Number(genreid);
  if (Number.isInteger(numericGenreId)) {
    return genres.find((item) => item.genreid === numericGenreId) ?? null;
  }

  const normalized = normalizeComparableText(genreid);
  return (
    genres.find((item) =>
      [item.title, item.label].some(
        (entry) => normalizeComparableText(safe(entry, '')) === normalized
      )
    ) ?? null
  );
}

function resolveMusicGenreLabel(genreid: string, genre: MusicLibraryGenreSnapshot | null): string {
  return safe(genre?.title ?? genre?.label, safe(genreid, 'Genre'));
}

function safe(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
