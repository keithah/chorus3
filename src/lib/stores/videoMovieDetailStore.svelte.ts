import {
  getVideoLibraryMovieDetails,
  type KodiJsonRpcHttpClient,
  type VideoLibraryMoviePropertyName
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  VideoLibraryClientError,
  cloneVideoMovieDetailStoreSnapshot,
  createVideoLibrarySafeError,
  normalizeVideoMovieDetail,
  type VideoLibraryRefreshReason,
  type VideoMovieDetailStoreSnapshot
} from './videoLibraryNormalization';

export type {
  VideoMovieDetailSnapshot,
  VideoMovieDetailStoreSnapshot,
  VideoMovieVersionItemSnapshot,
  VideoMovieVersionsSnapshot
} from './videoLibraryNormalization';

export interface VideoMovieDetailStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const DEFAULT_MOVIE_DETAIL_PROPERTIES = [
  'title',
  'year',
  'runtime',
  'thumbnail',
  'fanart',
  'art',
  'playcount',
  'lastplayed',
  'resume',
  'dateadded',
  'plot',
  'plotoutline',
  'tagline',
  'genre',
  'director',
  'writer',
  'cast',
  'studio',
  'mpaa',
  'rating',
  'userrating',
  'premiered',
  'imdbnumber',
  'streamdetails',
  'uniqueid'
] as const satisfies readonly VideoLibraryMoviePropertyName[];

const DEFAULT_SNAPSHOT: VideoMovieDetailStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  selectedMovieId: null,
  detail: null,
  lastError: null
};

export class VideoMovieDetailStore {
  #snapshot = $state<VideoMovieDetailStoreSnapshot>(
    cloneVideoMovieDetailStoreSnapshot(DEFAULT_SNAPSHOT)
  );

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #now: () => string;

  #requestId = 0;

  constructor(options: VideoMovieDetailStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): VideoMovieDetailStoreSnapshot {
    return cloneVideoMovieDetailStoreSnapshot(this.#snapshot);
  }

  async refreshMovieDetail(
    movieid: number,
    reason: VideoLibraryRefreshReason = 'manual'
  ): Promise<void> {
    if (!isValidMovieId(movieid)) {
      this.#requestId += 1;
      const safeError = createVideoLibrarySafeError(
        new VideoLibraryClientError(
          'client/invalid-movieid',
          'Movie detail refresh requires a finite positive safe-integer movie ID.'
        )
      );
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: `error:${safeError.code}`,
        lastUpdatedAt: this.#now(),
        selectedMovieId: null,
        lastError: safeError
      };
      return;
    }

    const requestId = ++this.#requestId;

    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: reason,
      selectedMovieId: movieid,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const result = await getVideoLibraryMovieDetails(client, {
        movieid,
        properties: DEFAULT_MOVIE_DETAIL_PROPERTIES
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const detail = normalizeVideoMovieDetail(result.moviedetails);
      if (!detail) {
        throw new VideoLibraryClientError(
          'client/malformed-movie-detail',
          'Kodi movie detail response did not include a usable movie detail object.'
        );
      }

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        selectedMovieId: movieid,
        detail,
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
        selectedMovieId: movieid,
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
        'Kodi HTTP client is not configured for movie detail refresh.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export function createVideoMovieDetailStore(
  options: VideoMovieDetailStoreOptions = {}
): VideoMovieDetailStore {
  return new VideoMovieDetailStore(options);
}

export const videoMovieDetailStore = createVideoMovieDetailStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

function isValidMovieId(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value) && value > 0
  );
}
