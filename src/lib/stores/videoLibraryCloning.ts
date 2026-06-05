import type {
  VideoEpisodeDetailSnapshot,
  VideoEpisodeSnapshot,
  VideoLibraryLimitsSnapshot,
  VideoLibraryMovieSnapshot,
  VideoLibrarySafeErrorSnapshot,
  VideoLibraryStoreSnapshot,
  VideoMovieDetailSnapshot,
  VideoMovieDetailStoreSnapshot,
  VideoMovieVersionsSnapshot,
  VideoMusicVideoSnapshot,
  VideoSeasonArtworkRefreshCapabilitySnapshot,
  VideoSeasonSnapshot,
  VideoTvShowDetailSnapshot,
  VideoTvShowSnapshot,
  VideoTvStoreSnapshot
} from './videoLibraryTypes';

export function cloneVideoLibraryMovieSnapshots(
  movies: readonly VideoLibraryMovieSnapshot[]
): VideoLibraryMovieSnapshot[] {
  return movies.map((movie) => ({
    ...movie,
    ...(movie.art ? { art: { ...movie.art } } : {}),
    ...(movie.genre ? { genre: [...movie.genre] } : {}),
    ...(movie.director ? { director: [...movie.director] } : {}),
    ...(movie.writer ? { writer: [...movie.writer] } : {}),
    ...(movie.cast ? { cast: [...movie.cast] } : {}),
    ...(movie.studio ? { studio: [...movie.studio] } : {}),
    ...(movie.tag ? { tag: [...movie.tag] } : {}),
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
        ...(detail.writer ? { writer: [...detail.writer] } : {}),
        ...(detail.cast ? { cast: [...detail.cast] } : {}),
        ...(detail.studio ? { studio: [...detail.studio] } : {}),
        ...(detail.uniqueid ? { uniqueid: { ...detail.uniqueid } } : {}),
        ...(detail.streamdetails
          ? {
              streamdetails: {
                video: [...detail.streamdetails.video],
                audio: [...detail.streamdetails.audio],
                subtitle: [...detail.streamdetails.subtitle]
              }
            }
          : {}),
        ...(detail.art ? { art: { ...detail.art } } : {}),
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
    ...(tvShow.art ? { art: { ...tvShow.art } } : {}),
    ...(tvShow.genre ? { genre: [...tvShow.genre] } : {}),
    ...(tvShow.cast ? { cast: [...tvShow.cast] } : {}),
    ...(tvShow.studio ? { studio: [...tvShow.studio] } : {}),
    ...(tvShow.tag ? { tag: [...tvShow.tag] } : {})
  }));
}

function cloneVideoTvShowDetailSnapshot(
  detail: VideoTvShowDetailSnapshot | null
): VideoTvShowDetailSnapshot | null {
  return detail
    ? {
        ...detail,
        ...(detail.art ? { art: { ...detail.art } } : {}),
        ...(detail.genre ? { genre: [...detail.genre] } : {}),
        ...(detail.studio ? { studio: [...detail.studio] } : {}),
        ...(detail.tag ? { tag: [...detail.tag] } : {}),
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

export function cloneVideoMusicVideoSnapshots(
  musicVideos: readonly VideoMusicVideoSnapshot[]
): VideoMusicVideoSnapshot[] {
  return musicVideos.map((musicVideo) => ({
    ...musicVideo,
    ...(musicVideo.artist ? { artist: [...musicVideo.artist] } : {}),
    ...(musicVideo.genre ? { genre: [...musicVideo.genre] } : {}),
    ...(musicVideo.director ? { director: [...musicVideo.director] } : {}),
    ...(musicVideo.studio ? { studio: [...musicVideo.studio] } : {}),
    ...(musicVideo.tag ? { tag: [...musicVideo.tag] } : {}),
    ...(musicVideo.art ? { art: { ...musicVideo.art } } : {}),
    ...(musicVideo.resume ? { resume: { ...musicVideo.resume } } : {})
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
    recentlyAddedMovies: cloneVideoLibraryMovieSnapshots(snapshot.recentlyAddedMovies ?? []),
    recentlyPlayedMovies: cloneVideoLibraryMovieSnapshots(snapshot.recentlyPlayedMovies ?? []),
    recentlyAddedEpisodes: cloneVideoEpisodeSnapshots(snapshot.recentlyAddedEpisodes ?? []),
    recentlyPlayedEpisodes: cloneVideoEpisodeSnapshots(snapshot.recentlyPlayedEpisodes ?? []),
    musicVideos: cloneVideoMusicVideoSnapshots(snapshot.musicVideos ?? []),
    limits: {
      movies: cloneVideoLibraryLimits(snapshot.limits.movies),
      tvShows: cloneVideoLibraryLimits(snapshot.limits.tvShows ?? { start: 0, end: 0, total: 0 }),
      recentlyAddedMovies: cloneVideoLibraryLimits(
        snapshot.limits.recentlyAddedMovies ?? { start: 0, end: 0, total: 0 }
      ),
      recentlyPlayedMovies: cloneVideoLibraryLimits(
        snapshot.limits.recentlyPlayedMovies ?? { start: 0, end: 0, total: 0 }
      ),
      recentlyAddedEpisodes: cloneVideoLibraryLimits(
        snapshot.limits.recentlyAddedEpisodes ?? { start: 0, end: 0, total: 0 }
      ),
      recentlyPlayedEpisodes: cloneVideoLibraryLimits(
        snapshot.limits.recentlyPlayedEpisodes ?? { start: 0, end: 0, total: 0 }
      ),
      musicVideos: cloneVideoLibraryLimits(
        snapshot.limits.musicVideos ?? { start: 0, end: 0, total: 0 }
      )
    },
    isEmpty:
      snapshot.movies.length === 0 &&
      (snapshot.tvShows ?? []).length === 0 &&
      (snapshot.recentlyAddedMovies ?? []).length === 0 &&
      (snapshot.recentlyPlayedMovies ?? []).length === 0 &&
      (snapshot.recentlyAddedEpisodes ?? []).length === 0 &&
      (snapshot.recentlyPlayedEpisodes ?? []).length === 0 &&
      (snapshot.musicVideos ?? []).length === 0,
    lastError: cloneVideoLibrarySafeError(snapshot.lastError)
  };
}
