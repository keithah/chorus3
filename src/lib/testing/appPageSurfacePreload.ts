import {
  loadAppDashboardSurface,
  loadAppPageStoreSurface,
  loadAddonsPage,
  loadAddonsPanel,
  loadAddonDetailShell,
  loadBrowserFilesPage,
  loadHelpPage,
  loadLabApiBrowserPage,
  loadLabIconBrowserPage,
  loadLabLandingPage,
  loadLabScreenshotPage,
  loadLibraryPage,
  loadLocalBrowserPlayerRoute,
  loadMediaFilesPanel,
  loadMediaPlaylistsPanel,
  loadMediaSearchPanel,
  loadMetadataEditDialog,
  loadMusicBrowsePanel,
  loadMusicDetailRoute,
  loadMusicLibraryPanel,
  loadNowPlayingPanel,
  loadPlaylistsPage,
  loadPvrPage,
  loadRemoteInputPanel,
  loadSettingsPage,
  loadSettingsPanel,
  loadThumbsUpPage,
  loadVideoEpisodeDetailShell,
  loadVideoMovieDetailShell,
  loadVideoMoviesPanel,
  loadVideoMovieStreamShell,
  loadVideoRecentPanel,
  loadVideoSeasonDetailShell,
  loadVideoTvShowDetailShell,
  loadVideoTvShowsPanel,
  type LazyRouteLoader
} from '$lib/app-pages/appPageSurfaceLazyRoutes';

type TestPreloadOptions = {
  scope?: 'all' | 'dashboard';
};

const allRouteLoaders = [
  loadLibraryPage,
  loadBrowserFilesPage,
  loadPlaylistsPage,
  loadAddonsPage,
  loadSettingsPage,
  loadHelpPage,
  loadPvrPage,
  loadThumbsUpPage,
  loadVideoTvShowDetailShell,
  loadVideoSeasonDetailShell,
  loadVideoEpisodeDetailShell,
  loadVideoMoviesPanel,
  loadVideoRecentPanel,
  loadVideoTvShowsPanel,
  loadVideoMovieDetailShell,
  loadVideoMovieStreamShell,
  loadLabLandingPage,
  loadLabApiBrowserPage,
  loadLabScreenshotPage,
  loadLabIconBrowserPage,
  loadLocalBrowserPlayerRoute,
  loadAddonsPanel,
  loadAddonDetailShell,
  loadSettingsPanel,
  loadMediaPlaylistsPanel,
  loadMediaSearchPanel,
  loadMediaFilesPanel,
  loadMusicLibraryPanel,
  loadMusicBrowsePanel,
  loadMusicDetailRoute,
  loadMetadataEditDialog,
  loadNowPlayingPanel,
  loadRemoteInputPanel,
  loadAppPageStoreSurface
] as const;

const dashboardRouteLoaders = [
  loadAppDashboardSurface,
  loadAppPageStoreSurface,
  loadLibraryPage,
  loadMediaFilesPanel,
  loadMediaPlaylistsPanel,
  loadMediaSearchPanel,
  loadMusicBrowsePanel,
  loadMusicLibraryPanel,
  loadNowPlayingPanel
] as const;

export async function preloadAppPageSurfaceRoutesForTest({
  scope = 'all'
}: TestPreloadOptions = {}): Promise<void> {
  if (scope === 'dashboard') {
    await preloadLazyRouteLoaders(dashboardRouteLoaders);
    return;
  }

  await loadAppDashboardSurface();
  await preloadLazyRouteLoaders(allRouteLoaders);
}

async function preloadLazyRouteLoaders(loaders: readonly LazyRouteLoader[]): Promise<void> {
  // Keep Vitest module preloading deterministic. Loading many Svelte modules concurrently after
  // vi.resetModules() can race Vite's Svelte runtime helper initialization in jsdom.
  for (const load of loaders) {
    await load();
  }
}
