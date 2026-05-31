import {
  getVideoLibraryAvailableArt,
  getVideoLibraryAvailableArtTypes,
  getVideoLibraryEpisodeDetails,
  getVideoLibraryEpisodes,
  getVideoLibrarySeasons,
  getVideoLibraryTvShowDetails,
  getVideoLibraryTvShows,
  type KodiJsonRpcHttpClient,
  type VideoLibraryEpisodePropertyName,
  type VideoLibrarySeasonPropertyName,
  type VideoLibraryTvShowPropertyName
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  VideoLibraryClientError,
  cloneVideoTvStoreSnapshot,
  createVideoLibrarySafeError,
  normalizeSeasonArtworkRefreshCapability,
  normalizeVideoEpisodeDetail,
  normalizeVideoEpisodes,
  normalizeVideoLibraryLimits,
  normalizeVideoSeasons,
  normalizeVideoTvShowDetail,
  normalizeVideoTvShows,
  type VideoLibraryLimitsSnapshot,
  type VideoLibraryRefreshReason,
  type VideoTvStoreSnapshot
} from './videoLibraryNormalization';

export type {
  VideoEpisodeDetailSnapshot,
  VideoEpisodeSnapshot,
  VideoSeasonArtworkRefreshCapabilitySnapshot,
  VideoSeasonSnapshot,
  VideoTvShowDetailSnapshot,
  VideoTvShowSnapshot,
  VideoTvStoreSnapshot
} from './videoLibraryNormalization';

export interface VideoTvStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const DEFAULT_LIMITS: VideoLibraryLimitsSnapshot = { start: 0, end: 0, total: 0 };
const DEFAULT_LIST_LIMIT = { start: 0, end: 5000 } as const;
const DEFAULT_TV_SHOW_PROPERTIES = [
  'title',
  'year',
  'thumbnail',
  'fanart',
  'art',
  'episode',
  'watchedepisodes',
  'playcount',
  'plot',
  'genre',
  'studio',
  'rating',
  'userrating',
  'premiered',
  'lastplayed',
  'dateadded'
] as const satisfies readonly VideoLibraryTvShowPropertyName[];
const DEFAULT_SEASON_PROPERTIES = [
  'title',
  'showtitle',
  'thumbnail',
  'fanart',
  'art',
  'episode',
  'watchedepisodes',
  'playcount',
  'userrating',
  'tvshowid',
  'season'
] as const satisfies readonly VideoLibrarySeasonPropertyName[];
const DEFAULT_EPISODE_PROPERTIES = [
  'title',
  'showtitle',
  'runtime',
  'thumbnail',
  'fanart',
  'art',
  'playcount',
  'lastplayed',
  'resume',
  'dateadded',
  'tvshowid',
  'season',
  'episode'
] as const satisfies readonly VideoLibraryEpisodePropertyName[];
const DEFAULT_EPISODE_DETAIL_PROPERTIES = [
  ...DEFAULT_EPISODE_PROPERTIES,
  'plot',
  'director',
  'writer',
  'rating',
  'userrating',
  'firstaired',
  'uniqueid'
] as const satisfies readonly VideoLibraryEpisodePropertyName[];

const DEFAULT_SNAPSHOT: VideoTvStoreSnapshot = {
  refreshStatus: 'idle',
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  selectedTvShowId: null,
  selectedSeason: null,
  selectedEpisodeId: null,
  tvShows: [],
  tvShowDetail: null,
  seasons: [],
  episodes: [],
  episodeDetail: null,
  limits: {
    tvShows: DEFAULT_LIMITS,
    seasons: DEFAULT_LIMITS,
    episodes: DEFAULT_LIMITS
  },
  seasonArtworkCapability: { status: 'unavailable', reason: 'No season selected.' },
  lastError: null
};

export class VideoTvStore {
  #snapshot = $state<VideoTvStoreSnapshot>(cloneVideoTvStoreSnapshot(DEFAULT_SNAPSHOT));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #now: () => string;

  #requestId = 0;

  constructor(options: VideoTvStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): VideoTvStoreSnapshot {
    return cloneVideoTvStoreSnapshot(this.#snapshot);
  }

  async refreshTvShows(reason: VideoLibraryRefreshReason = 'manual'): Promise<void> {
    const requestId = this.#beginLoading(reason, {});

    try {
      const client = this.#resolveClient('TV show list refresh');
      const result = await getVideoLibraryTvShows(client, {
        properties: DEFAULT_TV_SHOW_PROPERTIES,
        limits: DEFAULT_LIST_LIMIT
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const tvShows = normalizeVideoTvShows(result.tvshows);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        tvShows,
        limits: {
          ...this.#snapshot.limits,
          tvShows: normalizeVideoLibraryLimits(result.limits, tvShows)
        },
        lastError: null
      };
    } catch (error) {
      this.#recordError(requestId, error);
    }
  }

  async refreshTvShow(
    tvshowid: number,
    reason: VideoLibraryRefreshReason = 'manual'
  ): Promise<void> {
    if (!isValidPositiveId(tvshowid)) {
      this.#rejectInvalid(
        'client/invalid-tvshowid',
        'TV show refresh requires a finite positive safe-integer TV show ID.',
        {
          selectedTvShowId: null
        }
      );
      return;
    }

    const requestId = this.#beginLoading(reason, {
      selectedTvShowId: tvshowid,
      selectedSeason: null,
      selectedEpisodeId: null
    });

    try {
      const client = this.#resolveClient('TV show detail refresh');
      const [detailResult, seasonsResult] = await Promise.all([
        getVideoLibraryTvShowDetails(client, { tvshowid, properties: DEFAULT_TV_SHOW_PROPERTIES }),
        getVideoLibrarySeasons(client, {
          tvshowid,
          properties: DEFAULT_SEASON_PROPERTIES,
          limits: DEFAULT_LIST_LIMIT
        })
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const tvShowDetail = normalizeVideoTvShowDetail(detailResult.tvshowdetails);
      if (!tvShowDetail) {
        throw new VideoLibraryClientError(
          'client/malformed-tvshow-detail',
          'Kodi TV show detail response did not include a usable TV show detail object.'
        );
      }
      const seasons = normalizeVideoSeasons(seasonsResult.seasons);

      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        selectedTvShowId: tvshowid,
        selectedSeason: null,
        selectedEpisodeId: null,
        tvShowDetail,
        seasons,
        episodes: [],
        episodeDetail: null,
        limits: {
          ...this.#snapshot.limits,
          seasons: normalizeVideoLibraryLimits(seasonsResult.limits, seasons),
          episodes: DEFAULT_LIMITS
        },
        seasonArtworkCapability: { status: 'unavailable', reason: 'No season selected.' },
        lastError: null
      };
    } catch (error) {
      this.#recordError(requestId, error);
    }
  }

  async refreshSeasonEpisodes(
    tvshowid: number,
    season: number,
    reason: VideoLibraryRefreshReason = 'manual'
  ): Promise<void> {
    if (!isValidPositiveId(tvshowid)) {
      this.#rejectInvalid(
        'client/invalid-tvshowid',
        'Season episode refresh requires a finite positive safe-integer TV show ID.',
        {
          selectedTvShowId: null
        }
      );
      return;
    }
    if (!isValidSeason(season)) {
      this.#rejectInvalid(
        'client/invalid-season',
        'Season episode refresh requires a finite non-negative safe-integer season.',
        {
          selectedSeason: null
        }
      );
      return;
    }

    const requestId = this.#beginLoading(reason, {
      selectedTvShowId: tvshowid,
      selectedSeason: season,
      selectedEpisodeId: null
    });

    try {
      const client = this.#resolveClient('season episode refresh');
      const result = await getVideoLibraryEpisodes(client, {
        tvshowid,
        season,
        properties: DEFAULT_EPISODE_PROPERTIES,
        limits: DEFAULT_LIST_LIMIT
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const episodes = normalizeVideoEpisodes(result.episodes);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        selectedTvShowId: tvshowid,
        selectedSeason: season,
        selectedEpisodeId: null,
        episodes,
        episodeDetail: null,
        limits: {
          ...this.#snapshot.limits,
          episodes: normalizeVideoLibraryLimits(result.limits, episodes)
        },
        lastError: null
      };
    } catch (error) {
      this.#recordError(requestId, error);
    }
  }

  async refreshEpisodeDetail(
    episodeid: number,
    reason: VideoLibraryRefreshReason = 'manual'
  ): Promise<void> {
    if (!isValidPositiveId(episodeid)) {
      this.#rejectInvalid(
        'client/invalid-episodeid',
        'Episode detail refresh requires a finite positive safe-integer episode ID.',
        {
          selectedEpisodeId: null
        }
      );
      return;
    }

    const requestId = this.#beginLoading(reason, { selectedEpisodeId: episodeid });

    try {
      const client = this.#resolveClient('episode detail refresh');
      const result = await getVideoLibraryEpisodeDetails(client, {
        episodeid,
        properties: DEFAULT_EPISODE_DETAIL_PROPERTIES
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const episodeDetail = normalizeVideoEpisodeDetail(result.episodedetails);
      if (!episodeDetail) {
        throw new VideoLibraryClientError(
          'client/malformed-episode-detail',
          'Kodi episode detail response did not include a usable episode detail object.'
        );
      }

      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        selectedEpisodeId: episodeid,
        episodeDetail,
        lastError: null
      };
    } catch (error) {
      this.#recordError(requestId, error);
    }
  }

  async refreshSeasonArtworkCapability(
    tvshowid: number,
    season: number,
    reason: VideoLibraryRefreshReason = 'manual'
  ): Promise<void> {
    if (!isValidPositiveId(tvshowid)) {
      this.#rejectInvalid(
        'client/invalid-tvshowid',
        'Season artwork capability refresh requires a finite positive safe-integer TV show ID.',
        {
          selectedTvShowId: null
        }
      );
      return;
    }
    if (!isValidSeason(season)) {
      this.#rejectInvalid(
        'client/invalid-season',
        'Season artwork capability refresh requires a finite non-negative safe-integer season.',
        {
          selectedSeason: null
        }
      );
      return;
    }

    const requestId = this.#beginLoading(reason, {
      selectedTvShowId: tvshowid,
      selectedSeason: season
    });

    try {
      const client = this.#resolveClient('season artwork capability refresh');
      const [typesResult, artResult] = await Promise.all([
        getVideoLibraryAvailableArtTypes(client, { media: 'season' }),
        getVideoLibraryAvailableArt(client, { media: 'season', tvshowid, season })
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'ready',
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        selectedTvShowId: tvshowid,
        selectedSeason: season,
        seasonArtworkCapability: normalizeSeasonArtworkRefreshCapability({
          availablearttypes: typesResult.availablearttypes,
          availableart: artResult.availableart
        }),
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
        selectedTvShowId: tvshowid,
        selectedSeason: season,
        seasonArtworkCapability: normalizeSeasonArtworkRefreshCapability({
          status: 'error',
          message: safeError.message
        }),
        lastError: safeError
      };
    }
  }

  async refreshSeasonArtwork(
    tvshowid: number,
    season: number,
    reason: VideoLibraryRefreshReason = 'manual'
  ): Promise<void> {
    if (!isValidPositiveId(tvshowid)) {
      this.#rejectInvalid(
        'client/invalid-tvshowid',
        'Season artwork refresh requires a finite positive safe-integer TV show ID.',
        {
          selectedTvShowId: null
        }
      );
      return;
    }
    if (!isValidSeason(season)) {
      this.#rejectInvalid(
        'client/invalid-season',
        'Season artwork refresh requires a finite non-negative safe-integer season.',
        {
          selectedSeason: null
        }
      );
      return;
    }

    this.#requestId += 1;
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'ready',
      lastRefreshReason: reason,
      lastUpdatedAt: this.#now(),
      selectedTvShowId: tvshowid,
      selectedSeason: season,
      seasonArtworkCapability: {
        status: 'unsupported',
        reason: 'Kodi does not expose a proven JSON-RPC season artwork refresh action.'
      },
      lastError: null
    };
  }

  destroy(): void {
    this.#requestId += 1;
  }

  #beginLoading(
    reason: VideoLibraryRefreshReason,
    selection: Partial<
      Pick<VideoTvStoreSnapshot, 'selectedTvShowId' | 'selectedSeason' | 'selectedEpisodeId'>
    >
  ): number {
    const requestId = ++this.#requestId;
    this.#snapshot = {
      ...this.#snapshot,
      ...selection,
      refreshStatus: 'loading',
      lastRefreshReason: reason,
      lastError: null
    };
    return requestId;
  }

  #rejectInvalid(
    code: string,
    message: string,
    selection: Partial<
      Pick<VideoTvStoreSnapshot, 'selectedTvShowId' | 'selectedSeason' | 'selectedEpisodeId'>
    >
  ): void {
    this.#requestId += 1;
    const safeError = createVideoLibrarySafeError(new VideoLibraryClientError(code, message));
    this.#snapshot = {
      ...this.#snapshot,
      ...selection,
      refreshStatus: 'error',
      lastRefreshReason: `error:${safeError.code}`,
      lastUpdatedAt: this.#now(),
      lastError: safeError
    };
  }

  #recordError(requestId: number, error: unknown): void {
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

  #resolveClient(operation: string): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new VideoLibraryClientError(
        'client/no-active-host',
        `Kodi HTTP client is not configured for ${operation}.`
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export function createVideoTvStore(options: VideoTvStoreOptions = {}): VideoTvStore {
  return new VideoTvStore(options);
}

export const videoTvStore = createVideoTvStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

function isValidPositiveId(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value) && value > 0
  );
}

function isValidSeason(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value) && value >= 0
  );
}
