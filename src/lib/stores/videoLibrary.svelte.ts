import {
  getVideoLibraryEpisodes,
  getVideoLibraryMusicVideos,
  getVideoLibraryMovies,
  getVideoLibraryTvShows,
  type KodiJsonRpcHttpClient,
  type VideoLibraryEpisodePropertyName,
  type VideoLibraryMusicVideoPropertyName,
  type VideoLibraryMoviePropertyName,
  type VideoLibraryTvShowPropertyName
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  VideoLibraryClientError,
  cloneVideoLibrarySnapshot,
  createVideoLibrarySafeError,
  normalizeVideoLibraryLimits,
  normalizeVideoMovies,
  normalizeVideoEpisodes,
  normalizeVideoMusicVideos,
  normalizeVideoTvShows,
  type VideoLibraryLimitsSnapshot,
  type VideoLibraryRefreshReason,
  type VideoLibraryStoreSnapshot
} from './videoLibraryNormalization';

export type {
  VideoLibraryErrorSource,
  VideoLibraryLimitsSnapshot,
  VideoLibraryMovieSnapshot,
  VideoEpisodeSnapshot,
  VideoMusicVideoSnapshot,
  VideoLibraryRefreshReason,
  VideoLibraryRefreshStatus,
  VideoLibraryResumeSnapshot,
  VideoLibrarySafeErrorSnapshot,
  VideoLibraryStoreSnapshot,
  VideoTvShowSnapshot
} from './videoLibraryNormalization';

export interface VideoLibraryStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const DEFAULT_LIMITS: VideoLibraryLimitsSnapshot = { start: 0, end: 0, total: 0 };
const DEFAULT_LIST_LIMIT = { start: 0, end: 25 } as const;
const DEFAULT_MOVIE_PROPERTIES = [
  'title',
  'year',
  'runtime',
  'thumbnail',
  'fanart',
  'art',
  'playcount',
  'lastplayed',
  'resume',
  'dateadded'
] as const satisfies readonly VideoLibraryMoviePropertyName[];
const DEFAULT_TV_SHOW_PROPERTIES = [
  'title',
  'year',
  'thumbnail',
  'fanart',
  'art',
  'episode',
  'watchedepisodes',
  'playcount',
  'lastplayed',
  'dateadded'
] as const satisfies readonly VideoLibraryTvShowPropertyName[];
const DEFAULT_RECENT_EPISODE_PROPERTIES = [
  'title',
  'showtitle',
  'season',
  'episode',
  'thumbnail',
  'fanart',
  'art',
  'playcount',
  'lastplayed',
  'resume',
  'dateadded'
] as const satisfies readonly VideoLibraryEpisodePropertyName[];
const DEFAULT_MUSIC_VIDEO_PROPERTIES = [
  'title',
  'artist',
  'album',
  'year',
  'runtime',
  'thumbnail',
  'fanart',
  'art',
  'genre',
  'director',
  'studio',
  'playcount',
  'lastplayed',
  'resume',
  'dateadded'
] as const satisfies readonly VideoLibraryMusicVideoPropertyName[];

const DEFAULT_SNAPSHOT: VideoLibraryStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  movies: [],
  tvShows: [],
  recentlyAddedMovies: [],
  recentlyPlayedMovies: [],
  recentlyAddedEpisodes: [],
  recentlyPlayedEpisodes: [],
  musicVideos: [],
  limits: {
    movies: DEFAULT_LIMITS,
    tvShows: DEFAULT_LIMITS,
    recentlyAddedMovies: DEFAULT_LIMITS,
    recentlyPlayedMovies: DEFAULT_LIMITS,
    recentlyAddedEpisodes: DEFAULT_LIMITS,
    recentlyPlayedEpisodes: DEFAULT_LIMITS,
    musicVideos: DEFAULT_LIMITS
  },
  isEmpty: true,
  lastError: null
};

export class VideoLibraryStore {
  #snapshot = $state<VideoLibraryStoreSnapshot>(cloneVideoLibrarySnapshot(DEFAULT_SNAPSHOT));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #now: () => string;

  #requestId = 0;

  constructor(options: VideoLibraryStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): VideoLibraryStoreSnapshot {
    return cloneVideoLibrarySnapshot(this.#snapshot);
  }

  async refresh(reason: VideoLibraryRefreshReason = 'manual'): Promise<void> {
    const requestId = ++this.#requestId;

    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: reason,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const [
        moviesResult,
        tvShowsResult,
        recentlyAddedMoviesResult,
        recentlyPlayedMoviesResult,
        recentlyAddedEpisodesResult,
        recentlyPlayedEpisodesResult,
        musicVideosResult
      ] = await Promise.all([
        getVideoLibraryMovies(client, {
          properties: DEFAULT_MOVIE_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        }),
        getVideoLibraryTvShows(client, {
          properties: DEFAULT_TV_SHOW_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        }),
        getVideoLibraryMovies(client, {
          properties: DEFAULT_MOVIE_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT,
          sort: { method: 'dateadded', order: 'descending' }
        }),
        getVideoLibraryMovies(client, {
          properties: DEFAULT_MOVIE_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT,
          sort: { method: 'lastplayed', order: 'descending' }
        }),
        getVideoLibraryEpisodes(client, {
          properties: DEFAULT_RECENT_EPISODE_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT,
          sort: { method: 'dateadded', order: 'descending' }
        }),
        getVideoLibraryEpisodes(client, {
          properties: DEFAULT_RECENT_EPISODE_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT,
          sort: { method: 'lastplayed', order: 'descending' }
        }),
        getVideoLibraryMusicVideos(client, {
          properties: DEFAULT_MUSIC_VIDEO_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT,
          sort: { method: 'title', order: 'ascending' }
        })
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const movies = normalizeVideoMovies(moviesResult.movies);
      const tvShows = normalizeVideoTvShows(tvShowsResult.tvshows);
      const recentlyAddedMovies = normalizeVideoMovies(recentlyAddedMoviesResult.movies);
      const recentlyPlayedMovies = normalizeVideoMovies(recentlyPlayedMoviesResult.movies);
      const recentlyAddedEpisodes = normalizeVideoEpisodes(recentlyAddedEpisodesResult.episodes, {
        preserveOrder: true
      });
      const recentlyPlayedEpisodes = normalizeVideoEpisodes(recentlyPlayedEpisodesResult.episodes, {
        preserveOrder: true
      });
      const musicVideos = normalizeVideoMusicVideos(musicVideosResult.musicvideos);

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        movies,
        tvShows,
        recentlyAddedMovies,
        recentlyPlayedMovies,
        recentlyAddedEpisodes,
        recentlyPlayedEpisodes,
        musicVideos,
        limits: {
          movies: normalizeVideoLibraryLimits(moviesResult.limits, movies),
          tvShows: normalizeVideoLibraryLimits(tvShowsResult.limits, tvShows),
          recentlyAddedMovies: normalizeVideoLibraryLimits(
            recentlyAddedMoviesResult.limits,
            recentlyAddedMovies
          ),
          recentlyPlayedMovies: normalizeVideoLibraryLimits(
            recentlyPlayedMoviesResult.limits,
            recentlyPlayedMovies
          ),
          recentlyAddedEpisodes: normalizeVideoLibraryLimits(
            recentlyAddedEpisodesResult.limits,
            recentlyAddedEpisodes
          ),
          recentlyPlayedEpisodes: normalizeVideoLibraryLimits(
            recentlyPlayedEpisodesResult.limits,
            recentlyPlayedEpisodes
          ),
          musicVideos: normalizeVideoLibraryLimits(musicVideosResult.limits, musicVideos)
        },
        isEmpty:
          movies.length === 0 &&
          tvShows.length === 0 &&
          recentlyAddedMovies.length === 0 &&
          recentlyPlayedMovies.length === 0 &&
          recentlyAddedEpisodes.length === 0 &&
          recentlyPlayedEpisodes.length === 0 &&
          musicVideos.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createVideoLibrarySafeError(error);
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
      throw new VideoLibraryClientError(
        'client/no-active-host',
        'Kodi HTTP client is not configured for video library refresh.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export function createVideoLibraryStore(options: VideoLibraryStoreOptions = {}): VideoLibraryStore {
  return new VideoLibraryStore(options);
}

export const videoLibraryStore = createVideoLibraryStore({
  createClient: createActiveKodiJsonRpcHttpClient
});
