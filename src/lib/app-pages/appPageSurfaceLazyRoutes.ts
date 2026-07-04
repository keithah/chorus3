import type { Component } from 'svelte';

import type { BoundLazyRoute, LazyRouteLoader, LazyRouteModule } from './LazyRouteComponent.svelte';

export type { LazyRouteLoader };

export const loadAppDashboardSurface = lazyRoute(
  () => import('$lib/app-pages/AppDashboardSurface.svelte')
);
export const loadLibraryPage = lazyRoute(() => import('$lib/app-pages/LibraryPage.svelte'));
export const loadBrowserFilesPage = lazyRoute(
  () => import('$lib/app-pages/BrowserFilesPage.svelte')
);
export const loadPlaylistsPage = lazyRoute(() => import('$lib/app-pages/PlaylistsPage.svelte'));
export const loadAddonsPage = lazyRoute(() => import('$lib/app-pages/AddonsPage.svelte'));
export const loadSettingsPage = lazyRoute(() => import('$lib/app-pages/SettingsPage.svelte'));
export const loadHelpPage = lazyRoute(() => import('$lib/app-pages/HelpPage.svelte'));
export const loadPvrPage = lazyRoute(() => import('$lib/app-pages/PvrPage.svelte'));
export const loadThumbsUpPage = lazyRoute(() => import('$lib/app-pages/ThumbsUpPage.svelte'));
export const loadVideoTvShowDetailShell = lazyRoute(
  () => import('$components/VideoTvShowDetailShell.svelte')
);
export const loadVideoSeasonDetailShell = lazyRoute(
  () => import('$components/VideoSeasonDetailShell.svelte')
);
export const loadVideoEpisodeDetailShell = lazyRoute(
  () => import('$components/VideoEpisodeDetailShell.svelte')
);
export const loadVideoMoviesPanel = lazyRoute(() => import('$components/VideoMoviesPanel.svelte'));
export const loadVideoRecentPanel = lazyRoute(() => import('$components/VideoRecentPanel.svelte'));
export const loadVideoTvShowsPanel = lazyRoute(
  () => import('$components/VideoTvShowsPanel.svelte')
);
export const loadVideoMovieDetailShell = lazyRoute(
  () => import('$components/VideoMovieDetailShell.svelte')
);
export const loadVideoMovieStreamShell = lazyRoute(
  () => import('$components/VideoMovieStreamShell.svelte')
);
export const loadLabLandingPage = lazyRoute(() => import('$components/LabLandingPage.svelte'));
export const loadLabApiBrowserPage = lazyRoute(
  () => import('$components/LabApiBrowserPage.svelte')
);
export const loadLabScreenshotPage = lazyRoute(
  () => import('$components/LabScreenshotPage.svelte')
);
export const loadLabIconBrowserPage = lazyRoute(
  () => import('$components/LabIconBrowserPage.svelte')
);
export const loadLocalBrowserPlayerRoute = lazyRoute(
  () => import('$components/LocalBrowserPlayerRoute.svelte')
);
export const loadAddonsPanel = lazyRoute(() => import('$components/AddonsPanel.svelte'));
export const loadAddonDetailShell = lazyRoute(() => import('$components/AddonDetailShell.svelte'));
export const loadSettingsPanel = lazyRoute(() => import('$components/SettingsPanel.svelte'));
export const loadMediaPlaylistsPanel = lazyRoute(
  () => import('$components/MediaPlaylistsPanel.svelte')
);
export const loadMediaSearchPanel = lazyRoute(() => import('$components/MediaSearchPanel.svelte'));
export const loadMediaFilesPanel = lazyRoute(() => import('$components/MediaFilesPanel.svelte'));
export const loadMusicLibraryPanel = lazyRoute(
  () => import('$components/MusicLibraryPanel.svelte')
);
export const loadMusicBrowsePanel = lazyRoute(() => import('$components/MusicBrowsePanel.svelte'));
export const loadMusicDetailRoute = lazyRoute(() => import('$components/MusicDetailRoute.svelte'));
export const loadMetadataEditDialog = lazyRoute(
  () => import('$components/MetadataEditDialog.svelte')
);
export const loadNowPlayingPanel = lazyRoute(() => import('$components/NowPlayingPanel.svelte'));
export const loadRemoteInputPanel = lazyRoute(() => import('$components/RemoteInputPanel.svelte'));
export const loadAppPageStoreSurface = lazyRoute(
  () => import('$lib/app-pages/AppPageStoreSurface.svelte')
);

export type LazyRouteComponentProps<TLoader> =
  TLoader extends LazyRouteLoader<infer TComponent>
    ? TComponent extends Component<infer TProps>
      ? TProps
      : never
    : never;

export function bindLazyRoute<TLoader extends LazyRouteLoader>(
  load: TLoader,
  props: LazyRouteComponentProps<TLoader>
): BoundLazyRoute {
  return { load, props };
}

function lazyRoute<TModule extends LazyRouteModule<unknown>>(
  loader: () => Promise<TModule>
): LazyRouteLoader<TModule['default']> {
  let promise: Promise<TModule> | null = null;
  const load: LazyRouteLoader<TModule['default']> = () => {
    promise ??= loader();
    return promise.then((module) => {
      load.current = module;
      return module;
    });
  };
  return load;
}
