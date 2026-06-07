import type { VideoRoute } from '$lib/video/videoRouter';

export type VideoMovieDetailRefreshStore = {
  refreshMovieDetail(movieid: number, reason: 'manual'): Promise<void> | void;
};

export type VideoTvRefreshStore = {
  refreshTvShow(tvshowid: number, reason: 'manual'): Promise<void> | void;
  refreshSeasonEpisodes(tvshowid: number, season: number, reason: 'manual'): Promise<void> | void;
  refreshEpisodeDetail(episodeid: number, reason: 'manual'): Promise<void> | void;
};

export type AppVideoDetailRefreshInput = {
  videoRoute: VideoRoute;
  expectedRefreshKey: string;
  hasInjectedVideoTvSnapshot: boolean;
  hasInjectedVideoMovieDetailSnapshot: boolean;
  hasInjectedVideoLibrarySnapshot: boolean;
  currentRefreshKey: () => string;
  movieDetailStore: VideoMovieDetailRefreshStore;
  tvStore: VideoTvRefreshStore;
};

export async function refreshAppVideoDetailRoute({
  videoRoute,
  expectedRefreshKey,
  hasInjectedVideoTvSnapshot,
  hasInjectedVideoMovieDetailSnapshot,
  hasInjectedVideoLibrarySnapshot,
  currentRefreshKey,
  movieDetailStore,
  tvStore
}: AppVideoDetailRefreshInput): Promise<void> {
  if (hasInjectedVideoTvSnapshot || hasInjectedVideoMovieDetailSnapshot) {
    return;
  }

  if (videoRoute.kind === 'videoMovieDetail' && hasInjectedVideoLibrarySnapshot) {
    return;
  }

  switch (videoRoute.kind) {
    case 'videoMovieDetail':
      await movieDetailStore.refreshMovieDetail(videoRoute.movieid, 'manual');
      return;
    case 'videoTvShowDetail':
      await tvStore.refreshTvShow(videoRoute.tvshowid, 'manual');
      return;
    case 'videoTvSeasonDetail':
      await tvStore.refreshTvShow(videoRoute.tvshowid, 'manual');
      if (currentRefreshKey() !== expectedRefreshKey) {
        return;
      }
      await tvStore.refreshSeasonEpisodes(videoRoute.tvshowid, videoRoute.season, 'manual');
      return;
    case 'videoEpisodeDetail':
      await tvStore.refreshTvShow(videoRoute.tvshowid, 'manual');
      if (currentRefreshKey() !== expectedRefreshKey) {
        return;
      }
      await tvStore.refreshSeasonEpisodes(videoRoute.tvshowid, videoRoute.season, 'manual');
      if (currentRefreshKey() !== expectedRefreshKey) {
        return;
      }
      await tvStore.refreshEpisodeDetail(videoRoute.episodeid, 'manual');
      return;
    default:
      return;
  }
}
