import type { PrimaryRoute } from '$lib/app/primaryRoutes';

export function isTvDetailRoute(route: PrimaryRoute): boolean {
  return (
    route.kind === 'tvshowDetail' ||
    route.kind === 'tvshowSeasonDetail' ||
    route.kind === 'tvshowEpisodeDetail'
  );
}

export function isBrowserRoute(route: PrimaryRoute): boolean {
  return route.kind === 'browser' || route.kind === 'browserItem';
}

export function isPlaylistRoute(route: PrimaryRoute): boolean {
  return (
    route.kind === 'currentPlaylist' ||
    route.kind === 'playlists' ||
    route.kind === 'playlistDetail'
  );
}

export function isAddonsRoute(route: PrimaryRoute): boolean {
  return (
    route.kind === 'addonsAll' ||
    route.kind === 'addonsVideo' ||
    route.kind === 'addonsAudio' ||
    route.kind === 'addonsExecutable' ||
    route.kind === 'addonExecute' ||
    route.kind === 'addonDetail'
  );
}

export function isSettingsRoute(route: PrimaryRoute): boolean {
  return (
    route.kind === 'settingsWeb' ||
    route.kind === 'settingsKodi' ||
    route.kind === 'settingsKodiSection' ||
    route.kind === 'settingsAddons' ||
    route.kind === 'settingsNav' ||
    route.kind === 'settingsSearch'
  );
}

export function isHelpRoute(route: PrimaryRoute): boolean {
  return route.kind === 'help' || route.kind === 'helpOverview' || route.kind === 'helpPage';
}

export function isSearchRoute(route: PrimaryRoute): boolean {
  return route.kind === 'search' || route.kind === 'searchMedia';
}

export function isLabRoute(route: PrimaryRoute): boolean {
  return (
    route.kind === 'lab' ||
    route.kind === 'labApiBrowser' ||
    route.kind === 'labApiBrowserMethod' ||
    route.kind === 'labScreenshot' ||
    route.kind === 'labIconBrowser'
  );
}

export function isPvrRoute(route: PrimaryRoute): boolean {
  return (
    route.kind === 'pvrTv' ||
    route.kind === 'pvrEpg' ||
    route.kind === 'pvrTvChannel' ||
    route.kind === 'pvrRadio' ||
    route.kind === 'pvrRadioChannel' ||
    route.kind === 'pvrRecordings'
  );
}
