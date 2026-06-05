import type { KodiEndpointDescription } from '$lib/kodi';

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
  genre?: string[];
  director?: string[];
  writer?: string[];
  cast?: string[];
  studio?: string[];
  mpaa?: string;
  rating?: number;
  set?: string;
  tag?: string[];
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
  genre?: string[];
  cast?: string[];
  studio?: string[];
  mpaa?: string;
  rating?: number;
  tag?: string[];
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
  mpaa?: string;
  imdbnumber?: string;
  sorttitle?: string;
  originaltitle?: string;
  tag?: string[];
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

export interface VideoMusicVideoSnapshot {
  musicvideoid: number;
  label: string;
  title?: string;
  artist?: string[];
  album?: string;
  year?: number;
  runtime?: number;
  thumbnail?: string;
  fanart?: string;
  art?: Record<string, string>;
  genre?: string[];
  director?: string[];
  studio?: string[];
  plot?: string;
  rating?: number;
  track?: number;
  tag?: string[];
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
  thumbnail?: string;
  fanart?: string;
  art?: Record<string, string>;
  plot?: string;
  plotoutline?: string;
  tagline?: string;
  genre?: string[];
  director?: string[];
  writer?: string[];
  cast?: string[];
  studio?: string[];
  mpaa?: string;
  rating?: number;
  userrating?: number;
  premiered?: string;
  imdbnumber?: string;
  streamdetails?: VideoMovieStreamDetailsSnapshot;
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

export interface VideoMovieStreamDetailsSnapshot {
  video: string[];
  audio: string[];
  subtitle: string[];
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
  recentlyAddedMovies: VideoLibraryMovieSnapshot[];
  recentlyPlayedMovies: VideoLibraryMovieSnapshot[];
  recentlyAddedEpisodes: VideoEpisodeSnapshot[];
  recentlyPlayedEpisodes: VideoEpisodeSnapshot[];
  musicVideos?: VideoMusicVideoSnapshot[];
  limits: {
    movies: VideoLibraryLimitsSnapshot;
    tvShows: VideoLibraryLimitsSnapshot;
    recentlyAddedMovies: VideoLibraryLimitsSnapshot;
    recentlyPlayedMovies: VideoLibraryLimitsSnapshot;
    recentlyAddedEpisodes: VideoLibraryLimitsSnapshot;
    recentlyPlayedEpisodes: VideoLibraryLimitsSnapshot;
    musicVideos?: VideoLibraryLimitsSnapshot;
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
