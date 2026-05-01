import {
  getVideoLibraryMovies,
  type KodiJsonRpcHttpClient,
  type VideoLibraryMoviePropertyName
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  VideoLibraryClientError,
  cloneVideoLibrarySnapshot,
  createVideoLibrarySafeError,
  normalizeVideoLibraryLimits,
  normalizeVideoMovies,
  type VideoLibraryLimitsSnapshot,
  type VideoLibraryRefreshReason,
  type VideoLibraryStoreSnapshot
} from './videoLibraryNormalization';

export type {
  VideoLibraryErrorSource,
  VideoLibraryLimitsSnapshot,
  VideoLibraryMovieSnapshot,
  VideoLibraryRefreshReason,
  VideoLibraryRefreshStatus,
  VideoLibraryResumeSnapshot,
  VideoLibrarySafeErrorSnapshot,
  VideoLibraryStoreSnapshot
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

const DEFAULT_SNAPSHOT: VideoLibraryStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  movies: [],
  limits: { movies: DEFAULT_LIMITS },
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
      const moviesResult = await getVideoLibraryMovies(client, {
        properties: DEFAULT_MOVIE_PROPERTIES,
        limits: DEFAULT_LIST_LIMIT
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const movies = normalizeVideoMovies(moviesResult.movies);

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        movies,
        limits: {
          movies: normalizeVideoLibraryLimits(moviesResult.limits, movies)
        },
        isEmpty: movies.length === 0,
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
