import type { BoundLazyRoute } from './LazyRouteComponent.svelte';
import {
  bindLazyRoute,
  loadAddonDetailShell,
  loadAddonsPage,
  loadAddonsPanel,
  loadBrowserFilesPage,
  loadHelpPage,
  loadLabApiBrowserPage,
  loadLabIconBrowserPage,
  loadLabLandingPage,
  loadLabScreenshotPage,
  loadLibraryPage,
  loadMediaPlaylistsPanel,
  loadMediaSearchPanel,
  loadLocalBrowserPlayerRoute,
  loadMusicLibraryPanel,
  loadNowPlayingEmbedRoute,
  loadPlaylistsPage,
  loadPvrPage,
  loadSettingsPage,
  loadSettingsPanel,
  loadThumbsUpPage,
  loadVideoEpisodeDetailShell,
  loadVideoMovieDetailShell,
  loadVideoMovieStreamShell,
  loadVideoMoviesPanel,
  loadVideoRecentPanel,
  loadVideoSeasonDetailShell,
  loadVideoTvShowsPanel,
  loadVideoTvShowDetailShell,
  type LazyRouteComponentProps,
  type LazyRouteLoader
} from './appPageSurfaceLazyRoutes';

type Props<TLoader extends LazyRouteLoader> = LazyRouteComponentProps<TLoader>;

export function libraryPageRoute(props: Props<typeof loadLibraryPage>): BoundLazyRoute {
  return bindLazyRoute(loadLibraryPage, props);
}

export function browserFilesRoute(props: Props<typeof loadBrowserFilesPage>): BoundLazyRoute {
  return bindLazyRoute(loadBrowserFilesPage, props);
}

export function playlistsPageRoute(props: Props<typeof loadPlaylistsPage>): BoundLazyRoute {
  return bindLazyRoute(loadPlaylistsPage, props);
}

export function addonsPageRoute(props: Props<typeof loadAddonsPage>): BoundLazyRoute {
  return bindLazyRoute(loadAddonsPage, props);
}

export function settingsPageRoute(props: Props<typeof loadSettingsPage>): BoundLazyRoute {
  return bindLazyRoute(loadSettingsPage, props);
}

export function helpPageRoute(props: Props<typeof loadHelpPage>): BoundLazyRoute {
  return bindLazyRoute(loadHelpPage, props);
}

export function pvrPageRoute(props: Props<typeof loadPvrPage>): BoundLazyRoute {
  return bindLazyRoute(loadPvrPage, props);
}

export function thumbsUpPageRoute(props: Props<typeof loadThumbsUpPage>): BoundLazyRoute {
  return bindLazyRoute(loadThumbsUpPage, props);
}

export function mediaSearchPanelRoute(props: Props<typeof loadMediaSearchPanel>): BoundLazyRoute {
  return bindLazyRoute(loadMediaSearchPanel, props);
}

export function musicLibraryPanelRoute(props: Props<typeof loadMusicLibraryPanel>): BoundLazyRoute {
  return bindLazyRoute(loadMusicLibraryPanel, props);
}

export function mediaPlaylistsPanelRoute(
  props: Props<typeof loadMediaPlaylistsPanel>
): BoundLazyRoute {
  return bindLazyRoute(loadMediaPlaylistsPanel, props);
}

export function addonsPanelRoute(props: Props<typeof loadAddonsPanel>): BoundLazyRoute {
  return bindLazyRoute(loadAddonsPanel, props);
}

export function addonDetailShellRoute(props: Props<typeof loadAddonDetailShell>): BoundLazyRoute {
  return bindLazyRoute(loadAddonDetailShell, props);
}

export function settingsPanelRoute(props: Props<typeof loadSettingsPanel>): BoundLazyRoute {
  return bindLazyRoute(loadSettingsPanel, props);
}

export function labLandingPageRoute(props: Props<typeof loadLabLandingPage>): BoundLazyRoute {
  return bindLazyRoute(loadLabLandingPage, props);
}

export function labApiBrowserPageRoute(props: Props<typeof loadLabApiBrowserPage>): BoundLazyRoute {
  return bindLazyRoute(loadLabApiBrowserPage, props);
}

export function labScreenshotPageRoute(props: Props<typeof loadLabScreenshotPage>): BoundLazyRoute {
  return bindLazyRoute(loadLabScreenshotPage, props);
}

export function labIconBrowserPageRoute(): BoundLazyRoute {
  return { load: loadLabIconBrowserPage };
}

export function nowPlayingEmbedRoute(
  props: Props<typeof loadNowPlayingEmbedRoute>
): BoundLazyRoute {
  return bindLazyRoute(loadNowPlayingEmbedRoute, props);
}

export function localBrowserPlayerRoute(
  props: Props<typeof loadLocalBrowserPlayerRoute>
): BoundLazyRoute {
  return bindLazyRoute(loadLocalBrowserPlayerRoute, props);
}

export function videoMoviesPanelRoute(props: Props<typeof loadVideoMoviesPanel>): BoundLazyRoute {
  return bindLazyRoute(loadVideoMoviesPanel, props);
}

export function videoRecentPanelRoute(props: Props<typeof loadVideoRecentPanel>): BoundLazyRoute {
  return bindLazyRoute(loadVideoRecentPanel, props);
}

export function videoTvShowsPanelRoute(props: Props<typeof loadVideoTvShowsPanel>): BoundLazyRoute {
  return bindLazyRoute(loadVideoTvShowsPanel, props);
}

export function videoMovieDetailShellRoute(
  props: Props<typeof loadVideoMovieDetailShell>
): BoundLazyRoute {
  return bindLazyRoute(loadVideoMovieDetailShell, props);
}

export function videoMovieStreamShellRoute(
  props: Props<typeof loadVideoMovieStreamShell>
): BoundLazyRoute {
  return bindLazyRoute(loadVideoMovieStreamShell, props);
}

export function videoTvShowDetailShellRoute(
  props: Props<typeof loadVideoTvShowDetailShell>
): BoundLazyRoute {
  return bindLazyRoute(loadVideoTvShowDetailShell, props);
}

export function videoSeasonDetailShellRoute(
  props: Props<typeof loadVideoSeasonDetailShell>
): BoundLazyRoute {
  return bindLazyRoute(loadVideoSeasonDetailShell, props);
}

export function videoEpisodeDetailShellRoute(
  props: Props<typeof loadVideoEpisodeDetailShell>
): BoundLazyRoute {
  return bindLazyRoute(loadVideoEpisodeDetailShell, props);
}
