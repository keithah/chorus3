import type { AppRoute, PrimaryAppRoute } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { SavedKodiHost } from '$lib/stores';
import type { VideoRoute } from '$lib/video/videoRouter';

export function toAppRoute(input: AppRoute | VideoRoute): AppRoute {
  if (
    input.kind === 'dashboard' ||
    input.kind === 'settings' ||
    input.kind === 'settingsUnknown' ||
    input.kind === 'remote' ||
    input.kind === 'addons' ||
    input.kind === 'addonDetail' ||
    input.kind === 'addonsUnknown' ||
    input.kind === 'labUnknown' ||
    input.kind === 'nowPlaying' ||
    input.kind === 'localPlayer' ||
    input.kind === 'primary' ||
    input.kind === 'parityPlaceholder'
  ) {
    return input;
  }

  if (input.kind === 'video') {
    return input;
  }

  return { kind: 'video', route: input };
}

export function videoRouteRefreshKey(videoRoute: VideoRoute): string {
  switch (videoRoute.kind) {
    case 'videoMovieDetail':
      return `movie:${videoRoute.movieid}`;
    case 'videoTvShowDetail':
      return `tvshow:${videoRoute.tvshowid}`;
    case 'videoTvSeasonDetail':
      return `season:${videoRoute.tvshowid}:${videoRoute.season}`;
    case 'videoEpisodeDetail':
      return `episode:${videoRoute.episodeid}`;
    default:
      return '';
  }
}

export function videoDetailRefreshKey(
  videoRoute: VideoRoute | null | undefined,
  activeHost: SavedKodiHost | null
): string {
  if (!videoRoute || !activeHost) {
    return '';
  }

  const routeKey = videoRouteRefreshKey(videoRoute);
  return routeKey ? `${activeHost.id}:${routeKey}` : '';
}

export function primaryRouteToVideoRoute(
  primaryRoute: PrimaryAppRoute['route'] | null
): Exclude<VideoRoute, { kind: 'dashboard' }> | null {
  if (!primaryRoute) {
    return null;
  }

  if (primaryRoute.kind === 'movies' || primaryRoute.kind === 'moviesRecent') {
    return { kind: 'videoMovies' };
  }

  if (primaryRoute.kind === 'tvshows' || primaryRoute.kind === 'tvshowsRecent') {
    return { kind: 'videoTvShows' };
  }

  if (primaryRoute.kind === 'movieDetail') {
    const movieid = parsePositiveSafeInteger(primaryRoute.movieid);
    return movieid === null ? null : { kind: 'videoMovieDetail', movieid };
  }

  if (primaryRoute.kind === 'tvshowDetail') {
    const tvshowid = parsePositiveSafeInteger(primaryRoute.tvshowid);
    return tvshowid === null ? null : { kind: 'videoTvShowDetail', tvshowid };
  }

  if (primaryRoute.kind === 'tvshowSeasonDetail') {
    const tvshowid = parsePositiveSafeInteger(primaryRoute.tvshowid);
    const season = parsePositiveSafeInteger(primaryRoute.season);
    return tvshowid === null || season === null
      ? null
      : { kind: 'videoTvSeasonDetail', tvshowid, season };
  }

  if (primaryRoute.kind === 'tvshowEpisodeDetail') {
    const tvshowid = parsePositiveSafeInteger(primaryRoute.tvshowid);
    const season = parsePositiveSafeInteger(primaryRoute.season);
    const episodeid = parsePositiveSafeInteger(primaryRoute.episodeid);
    return tvshowid === null || season === null || episodeid === null
      ? null
      : { kind: 'videoEpisodeDetail', tvshowid, season, episodeid };
  }

  return null;
}

export function videoRouteToPrimaryRoute(videoRoute: VideoRoute | null): PrimaryRoute | null {
  if (!videoRoute) {
    return null;
  }

  switch (videoRoute.kind) {
    case 'videoMovies':
      return { kind: 'movies' };
    case 'videoMovieDetail':
      return { kind: 'movieDetail', movieid: String(videoRoute.movieid) };
    case 'videoTvShows':
      return { kind: 'tvshows' };
    case 'videoTvShowDetail':
      return { kind: 'tvshowDetail', tvshowid: String(videoRoute.tvshowid) };
    case 'videoTvSeasonDetail':
      return {
        kind: 'tvshowSeasonDetail',
        tvshowid: String(videoRoute.tvshowid),
        season: String(videoRoute.season)
      };
    case 'videoEpisodeDetail':
      return {
        kind: 'tvshowEpisodeDetail',
        tvshowid: String(videoRoute.tvshowid),
        season: String(videoRoute.season),
        episodeid: String(videoRoute.episodeid)
      };
    default:
      return null;
  }
}

function parsePositiveSafeInteger(value: string): number | null {
  if (!/^\d+$/u.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
