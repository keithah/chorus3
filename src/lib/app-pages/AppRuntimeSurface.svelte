<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import type { LocalBrowserPlayerDispatch } from '$components/LocalBrowserPlayerRoute.svelte';
  import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
  import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
  import ParityPlaceholder from '$components/ParityPlaceholder.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import RemoteInputPanel, {
    type RemoteInputPanelRemoteDispatch
  } from '$components/RemoteInputPanel.svelte';
  import type { SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import type { VideoEpisodeActionDispatch } from '$components/VideoEpisodeDetailShell.svelte';
  import type { VideoMovieActionDispatch } from '$components/VideoMovieDetailShell.svelte';
  import type { VideoMovieStreamDispatch } from '$components/VideoMovieStreamShell.svelte';
  import type {
    VideoSeasonArtworkDispatch,
    VideoSeasonWriteDispatch
  } from '$components/VideoSeasonDetailShell.svelte';
  import { buildAppRoute, type AppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type {
    AppShellCallbacks,
    AppShellDestinationState,
    AppShellDrawerState,
    AppShellNavigationItem,
    AppShellPlayerSnapshot,
    AppShellPlaylistDestinationMode
  } from '$lib/app-shell/appShellTypes';
  import AppRuntimeShellFrame from '$lib/app-pages/AppRuntimeShellFrame.svelte';
  import LazyRouteComponent from '$lib/app-pages/LazyRouteComponent.svelte';
  import type AppPageStoreSurface from '$lib/app-pages/AppPageStoreSurface.svelte';
  import {
    bindLazyRoute,
    loadAppDashboardSurface,
    loadAppPageStoreSurface,
    loadAddonDetailShell,
    loadAddonsPanel,
    loadLocalBrowserPlayerRoute,
    loadMediaPlaylistsPanel,
    loadNowPlayingPanel,
    loadSettingsPanel,
    loadVideoEpisodeDetailShell,
    loadVideoMovieDetailShell,
    loadVideoMovieStreamShell,
    loadVideoMoviesPanel,
    loadVideoRecentPanel,
    loadVideoSeasonDetailShell,
    loadVideoTvShowsPanel,
    loadVideoTvShowDetailShell
  } from '$lib/app-pages/appPageSurfaceLazyRoutes';
  import type { LazyRouteComponentProps } from '$lib/app-pages/appPageSurfaceLazyRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type { LibraryQuickActionsDispatch } from './LibraryQuickActions.svelte';
  import type {
    AddonsStoreSnapshot,
    LocalPlayerStoreSnapshot,
    MediaPlaylistsStoreSnapshot,
    PlayerStoreSnapshot,
    QueueStoreSnapshot,
    RemoteInputDispatchSnapshot,
    SettingsStoreSnapshot
  } from '$lib/stores';
  import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
  import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
  import type { VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';
  import type { VideoRoute } from '$lib/video/videoRouter';

  type DashboardSurfaceProps = LazyRouteComponentProps<typeof loadAppDashboardSurface>;
  type PageSurfaceProps = ComponentProps<typeof AppPageStoreSurface>;

  interface Props {
    currentRoute: AppRoute;
    currentVideoRoute: VideoRoute | null;
    currentRenderableVideoRoute: VideoRoute;
    currentPrimaryShellRoute: PrimaryRoute | null;
    currentShellNavigationItems: readonly AppShellNavigationItem[];
    currentAppPageMetadata: { stageLabel: string };
    currentRouteBuildOptions: BuildAppRouteOptions & { routeMode?: 'path' | 'hash' };
    currentShellPlayer: AppShellPlayerSnapshot;
    currentShellStageArtUrl?: string;
    currentDrawerDestinationMode: AppShellPlaylistDestinationMode;
    currentPlaylistDrawer: AppShellDrawerState;
    currentPlaylistDestination: AppShellDestinationState;
    playlistDrawerCallbacks: AppShellCallbacks;
    currentAppPageSurfaceProps: PageSurfaceProps;
    remoteOverlayOpen: boolean;
    currentRemoteSnapshot: RemoteInputDispatchSnapshot;
    remoteInputDispatch: RemoteInputPanelRemoteDispatch;
    libraryMaintenanceDispatch: LibraryQuickActionsDispatch;
    currentPlayerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    remoteOverlayPlayerDispatch: PlayerControlsDispatch;
    currentI18n: TranslationContext;
    currentQueueSnapshot: QueueStoreSnapshot;
    queueDispatch: QueuePanelDispatch;
    currentLocalSnapshot: LocalPlayerStoreSnapshot;
    localBrowserPlayerActionDispatch: LocalBrowserPlayerDispatch;
    currentHomeContext: Omit<
      DashboardSurfaceProps,
      | 'musicBrowseDispatch'
      | 'musicActionDispatch'
      | 'mediaSearchDispatch'
      | 'mediaSearchActionDispatch'
      | 'mediaFilesDispatch'
      | 'mediaFilesActionDispatch'
      | 'mediaPlaylistsDispatch'
      | 'mediaPlaylistsActionDispatch'
      | 'playerSnapshot'
      | 'playerDispatch'
      | 'localPlayerSnapshot'
      | 'queueSnapshot'
      | 'queueDispatch'
      | 'i18n'
    >;
    musicBrowseDispatch: DashboardSurfaceProps['musicBrowseDispatch'];
    musicActionDispatch: DashboardSurfaceProps['musicActionDispatch'];
    mediaSearchDispatch: DashboardSurfaceProps['mediaSearchDispatch'];
    mediaSearchActionDispatch: DashboardSurfaceProps['mediaSearchActionDispatch'];
    mediaFilesDispatch: DashboardSurfaceProps['mediaFilesDispatch'];
    mediaFilesActionDispatch: DashboardSurfaceProps['mediaFilesActionDispatch'];
    mediaPlaylistsDispatch: DashboardSurfaceProps['mediaPlaylistsDispatch'];
    mediaPlaylistsActionDispatch: DashboardSurfaceProps['mediaPlaylistsActionDispatch'];
    isPackageMounted: boolean;
    currentParityPlaceholder: ComponentProps<typeof ParityPlaceholder>['placeholder'] | null;
    currentPackageBasePath: string;
    currentAddonsSnapshot?: AddonsStoreSnapshot;
    addonsDispatch: AddonsPanelDispatch;
    addonDetailDispatch: AddonDetailDispatch;
    settingsSnapshot?: SettingsStoreSnapshot;
    settingsDispatch: SettingsPanelDispatch;
    videoLibrarySnapshot?: VideoLibraryStoreSnapshot;
    videoMediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
    videoMediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
    videoMediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
    videoMovieDetailSnapshot?: VideoMovieDetailStoreSnapshot;
    videoMovieActionDispatch: VideoMovieActionDispatch;
    videoMovieStreamActionDispatch: VideoMovieStreamDispatch;
    videoTvSnapshot?: VideoTvStoreSnapshot;
    videoEpisodeActionDispatch: VideoEpisodeActionDispatch;
    videoSeasonArtworkDispatch: VideoSeasonArtworkDispatch;
    videoSeasonWriteDispatch: VideoSeasonWriteDispatch;
    toggleLocalShuffle: () => Promise<void>;
    toggleAppFullscreen: () => void;
    stopPlaybackFromShell: () => void;
    toggleRemoteOverlayFromPlayer: () => void;
    closeRemoteOverlay: () => void;
    openPrimaryRoute: (route: PrimaryRoute) => void;
    openSearchRoute: (query: string) => void;
    handleLocalMediaEnded: () => Promise<void>;
  }

  let {
    currentRoute,
    currentVideoRoute,
    currentRenderableVideoRoute,
    currentPrimaryShellRoute,
    currentShellNavigationItems,
    currentAppPageMetadata,
    currentRouteBuildOptions,
    currentShellPlayer,
    currentShellStageArtUrl,
    currentDrawerDestinationMode,
    currentPlaylistDrawer,
    currentPlaylistDestination,
    playlistDrawerCallbacks,
    currentAppPageSurfaceProps,
    remoteOverlayOpen,
    currentRemoteSnapshot,
    remoteInputDispatch,
    libraryMaintenanceDispatch,
    currentPlayerSnapshot,
    playerDispatch,
    remoteOverlayPlayerDispatch,
    currentI18n,
    currentQueueSnapshot,
    queueDispatch,
    currentLocalSnapshot,
    localBrowserPlayerActionDispatch,
    currentHomeContext,
    musicBrowseDispatch,
    musicActionDispatch,
    mediaSearchDispatch,
    mediaSearchActionDispatch,
    mediaFilesDispatch,
    mediaFilesActionDispatch,
    mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch,
    isPackageMounted,
    currentParityPlaceholder,
    currentPackageBasePath,
    currentAddonsSnapshot,
    addonsDispatch,
    addonDetailDispatch,
    settingsSnapshot,
    settingsDispatch,
    videoLibrarySnapshot,
    videoMediaPlaylistsSnapshot,
    videoMediaPlaylistsDispatch,
    videoMediaPlaylistsActionDispatch,
    videoMovieDetailSnapshot,
    videoMovieActionDispatch,
    videoMovieStreamActionDispatch,
    videoTvSnapshot,
    videoEpisodeActionDispatch,
    videoSeasonArtworkDispatch,
    videoSeasonWriteDispatch,
    toggleLocalShuffle,
    toggleAppFullscreen,
    stopPlaybackFromShell,
    toggleRemoteOverlayFromPlayer,
    closeRemoteOverlay,
    openPrimaryRoute,
    openSearchRoute,
    handleLocalMediaEnded
  }: Props = $props();

  const shellPlayerActions = $derived({
    previous: () => playerDispatch.previous(),
    playPause: () => playerDispatch.playPause(),
    next: () => playerDispatch.next(),
    toggleMute: () => playerDispatch.toggleMute(),
    shuffle:
      currentDrawerDestinationMode === 'kodi'
        ? () => playerDispatch.setShuffle('toggle')
        : toggleLocalShuffle,
    fullscreen: toggleAppFullscreen,
    stop: stopPlaybackFromShell,
    repeat:
      currentDrawerDestinationMode === 'kodi' ? () => playerDispatch.setRepeat('cycle') : undefined,
    openRemote:
      currentDrawerDestinationMode === 'kodi' ? () => toggleRemoteOverlayFromPlayer() : undefined
  });
  const currentVideoMediaPlaylistsSnapshot = $derived(videoMediaPlaylistsSnapshot);
  const currentSettingsSnapshot = $derived(settingsSnapshot);
  const currentVideoLibrarySnapshot = $derived(videoLibrarySnapshot);
  const currentVideoMovieDetailSnapshot = $derived(videoMovieDetailSnapshot);
  const currentVideoTvSnapshot = $derived(videoTvSnapshot);

  const shellCallbacks = $derived({
    ...playlistDrawerCallbacks,
    onSearchFocus: () => openPrimaryRoute({ kind: 'search' }),
    onSearchSubmit: openSearchRoute
  });
  const isNowPlayingRoute = $derived(currentRoute.kind === 'nowPlaying');
  const isLocalPlayerRoute = $derived(currentRoute.kind === 'localPlayer');
  const isPrimaryShellRoute = $derived(currentPrimaryShellRoute !== null);
  const isDashboardRoute = $derived(
    currentRoute.kind === 'dashboard' ||
      (currentRoute.kind === 'primary' && currentRoute.route.kind === 'home')
  );
  const isRemoteRoute = $derived(
    currentRoute.kind === 'remote' ||
      (currentRoute.kind === 'primary' && currentRoute.route.kind === 'remote')
  );
  const isAddonsRoute = $derived(currentRoute.kind === 'addons');
  const isAddonDetailRoute = $derived(currentRoute.kind === 'addonDetail');
  const isAddonsUnknownRoute = $derived(currentRoute.kind === 'addonsUnknown');
  const isLabUnknownRoute = $derived(currentRoute.kind === 'labUnknown');
  const isSettingsRoute = $derived(currentRoute.kind === 'settings');
  const isSettingsUnknownRoute = $derived(currentRoute.kind === 'settingsUnknown');
  const isVideoMoviesRoute = $derived(currentVideoRoute?.kind === 'videoMovies');
  const isVideoMovieDetailRoute = $derived(currentVideoRoute?.kind === 'videoMovieDetail');
  const isVideoMovieStreamRoute = $derived(currentVideoRoute?.kind === 'videoMovieStream');
  const isVideoTvShowsRoute = $derived(currentVideoRoute?.kind === 'videoTvShows');
  const isVideoTvShowDetailRoute = $derived(currentVideoRoute?.kind === 'videoTvShowDetail');
  const isVideoTvSeasonDetailRoute = $derived(currentVideoRoute?.kind === 'videoTvSeasonDetail');
  const isVideoEpisodeDetailRoute = $derived(currentVideoRoute?.kind === 'videoEpisodeDetail');
  const isVideoUnknownRoute = $derived(currentVideoRoute?.kind === 'videoUnknown');
</script>

{#if isLocalPlayerRoute && currentRoute.kind === 'localPlayer'}
  <LazyRouteComponent
    route={bindLazyRoute(loadLocalBrowserPlayerRoute, {
      route: currentRoute,
      localPlayerSnapshot: currentLocalSnapshot,
      dispatchSnapshot: playerDispatch.snapshot,
      actionDispatch: localBrowserPlayerActionDispatch
    })}
  />
{:else if isPrimaryShellRoute}
  <AppRuntimeShellFrame
    routeIdentity={{ kind: 'primary', route: currentPrimaryShellRoute ?? { kind: 'home' } }}
    navigationItems={currentShellNavigationItems}
    stageLabel={currentAppPageMetadata.stageLabel}
    logoHref={buildAppRoute({ kind: 'primary', route: { kind: 'home' } }, currentRouteBuildOptions)}
    player={currentShellPlayer}
    stageArtUrl={currentShellStageArtUrl}
    playerActions={shellPlayerActions}
    drawer={currentPlaylistDrawer}
    destination={currentPlaylistDestination}
    callbacks={shellCallbacks}
    {remoteOverlayOpen}
    remoteSnapshot={currentRemoteSnapshot}
    {remoteInputDispatch}
    playerSnapshot={currentPlayerSnapshot}
    {remoteOverlayPlayerDispatch}
    i18n={currentI18n}
    {closeRemoteOverlay}
    queueSnapshot={currentQueueSnapshot}
    {queueDispatch}
    {handleLocalMediaEnded}
  >
    <LazyRouteComponent
      route={bindLazyRoute(loadAppPageStoreSurface, currentAppPageSurfaceProps)}
    />
  </AppRuntimeShellFrame>
{:else}
  <AppRuntimeShellFrame
    routeIdentity={{ kind: 'primary', route: currentPrimaryShellRoute ?? { kind: 'home' } }}
    navigationItems={currentShellNavigationItems}
    stageLabel={currentAppPageMetadata.stageLabel}
    logoHref={buildAppRoute({ kind: 'primary', route: { kind: 'home' } }, currentRouteBuildOptions)}
    player={currentShellPlayer}
    stageArtUrl={currentShellStageArtUrl}
    playerActions={shellPlayerActions}
    drawer={currentPlaylistDrawer}
    destination={currentPlaylistDestination}
    callbacks={shellCallbacks}
    {remoteOverlayOpen}
    remoteSnapshot={currentRemoteSnapshot}
    {remoteInputDispatch}
    playerSnapshot={currentPlayerSnapshot}
    {remoteOverlayPlayerDispatch}
    i18n={currentI18n}
    {closeRemoteOverlay}
    queueSnapshot={currentQueueSnapshot}
    {queueDispatch}
    {handleLocalMediaEnded}
  >
    {#if isNowPlayingRoute}
      <main class="now-playing-route" aria-label={currentI18n.t('nowPlaying.kicker')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadNowPlayingPanel, {
            snapshot: currentPlayerSnapshot,
            dispatch: playerDispatch,
            localPlayerSnapshot: currentLocalSnapshot,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isDashboardRoute}
      {#if !isPackageMounted}
        <LazyRouteComponent
          route={bindLazyRoute(loadAppDashboardSurface, {
            ...currentHomeContext,
            musicBrowseDispatch,
            musicActionDispatch,
            mediaSearchDispatch,
            mediaSearchActionDispatch,
            mediaFilesDispatch,
            mediaFilesActionDispatch,
            mediaPlaylistsDispatch,
            mediaPlaylistsActionDispatch,
            playerSnapshot: currentPlayerSnapshot,
            playerDispatch,
            localPlayerSnapshot: currentLocalSnapshot,
            queueSnapshot: currentQueueSnapshot,
            queueDispatch,
            libraryMaintenanceDispatch,
            i18n: currentI18n
          })}
        />
      {/if}
    {:else if currentParityPlaceholder}
      <main class="parity-route" aria-label="Parity placeholder">
        <ParityPlaceholder
          placeholder={currentParityPlaceholder}
          packageBasePath={currentPackageBasePath}
          i18n={currentI18n}
        />
      </main>
    {:else if isRemoteRoute}
      <main class="remote-route" aria-label="Kodi Remote">
        <RemoteInputPanel
          remoteSnapshot={currentRemoteSnapshot}
          {remoteInputDispatch}
          playerSnapshot={currentPlayerSnapshot}
          {playerDispatch}
          i18n={currentI18n}
        />
      </main>
    {:else if isAddonsRoute}
      <main class="addons-route" aria-label={currentI18n.t('app.route.addons.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadAddonsPanel, {
            snapshot: currentAddonsSnapshot,
            dispatch: addonsDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isAddonDetailRoute}
      <main class="addons-route" aria-label={currentI18n.t('app.route.addonDetail.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadAddonDetailShell, {
            snapshot: currentAddonsSnapshot,
            dispatch: addonDetailDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isAddonsUnknownRoute}
      <main class="addons-route" aria-label={currentI18n.t('app.route.addonsUnknown.aria')}>
        <section
          class="addons-route-not-found surface"
          aria-labelledby="addons-route-not-found-title"
        >
          <p class="section-kicker">{currentI18n.t('app.route.addons.kicker')}</p>
          <h2 id="addons-route-not-found-title">
            {currentI18n.t('app.route.addons.notFoundTitle')}
          </h2>
          <p>
            {currentI18n.t('app.route.addons.notFoundDescription', {
              path:
                currentRoute.kind === 'addonsUnknown'
                  ? currentRoute.pathLabel
                  : '/addons/[redacted]'
            })}
          </p>
          <nav
            class="addons-route-recovery"
            aria-label={currentI18n.t('app.route.addons.recoveryAria')}
          >
            <a href={buildAppRoute({ kind: 'addons' }, currentRouteBuildOptions)}>Add-ons</a>
          </nav>
        </section>
      </main>
    {:else if isLabUnknownRoute}
      <main class="lab-route" aria-label={currentI18n.t('app.route.labUnknown.aria')}>
        <section class="lab-route-not-found surface" aria-labelledby="lab-route-not-found-title">
          <p class="section-kicker">{currentI18n.t('app.route.lab.kicker')}</p>
          <h2 id="lab-route-not-found-title">{currentI18n.t('app.route.lab.notFoundTitle')}</h2>
          <p>
            {currentI18n.t('app.route.lab.notFoundDescription', {
              path: currentRoute.kind === 'labUnknown' ? currentRoute.pathLabel : '/lab/[redacted]'
            })}
          </p>
          <nav class="lab-route-recovery" aria-label={currentI18n.t('app.route.lab.recoveryAria')}>
            <a
              href={buildAppRoute(
                { kind: 'primary', route: { kind: 'home' } },
                currentRouteBuildOptions
              )}>Home</a
            >
            <a
              href={buildAppRoute(
                { kind: 'primary', route: { kind: 'help' } },
                currentRouteBuildOptions
              )}>Help</a
            >
          </nav>
        </section>
      </main>
    {:else if isSettingsRoute}
      <main class="settings-route" aria-label={currentI18n.t('app.route.settings.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadSettingsPanel, {
            snapshot: currentSettingsSnapshot,
            dispatch: settingsDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isSettingsUnknownRoute}
      {@const unknownPathLabel =
        currentRoute.kind === 'settingsUnknown' ? currentRoute.pathLabel : '/[redacted]'}
      {@const isSettingsPath = unknownPathLabel.startsWith('/settings')}
      <main class="settings-route" aria-label={currentI18n.t('app.route.settingsUnknown.aria')}>
        <section
          class="settings-route-not-found surface"
          aria-labelledby="settings-route-not-found-title"
        >
          <p class="section-kicker">
            {isSettingsPath
              ? currentI18n.t('app.route.settings.kicker')
              : currentI18n.t('app.route.unknown.recoveryAria')}
          </p>
          <h2 id="settings-route-not-found-title">
            {isSettingsPath
              ? currentI18n.t('app.route.settings.notFoundTitle')
              : currentI18n.t('app.route.unknown.notFoundTitle')}
          </h2>
          <p>
            {isSettingsPath
              ? currentI18n.t('app.route.settings.notFoundDescription', {
                  path: unknownPathLabel
                })
              : currentI18n.t('app.route.unknown.notFoundDescription', {
                  path: unknownPathLabel
                })}
          </p>
          <nav
            class="settings-route-recovery"
            aria-label={isSettingsPath
              ? currentI18n.t('app.route.settings.recoveryAria')
              : currentI18n.t('app.route.unknown.recoveryAria')}
          >
            <a
              href={buildAppRoute(
                isSettingsPath
                  ? { kind: 'primary', route: { kind: 'settingsWeb' } }
                  : { kind: 'primary', route: { kind: 'home' } },
                currentRouteBuildOptions
              )}>{isSettingsPath ? 'Settings' : 'Home'}</a
            >
          </nav>
        </section>
      </main>
    {:else if isVideoMoviesRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoMovies.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoMoviesPanel, { snapshot: currentVideoLibrarySnapshot })}
        />
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoRecentPanel, {
            snapshot: currentVideoLibrarySnapshot,
            i18n: currentI18n
          })}
        />
        <LazyRouteComponent
          route={bindLazyRoute(loadMediaPlaylistsPanel, {
            snapshot: currentVideoMediaPlaylistsSnapshot,
            dispatch: videoMediaPlaylistsDispatch,
            actionDispatch: videoMediaPlaylistsActionDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isVideoMovieDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoMovieDetail.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoMovieDetailShell, {
            snapshot: currentVideoLibrarySnapshot,
            route: currentRenderableVideoRoute,
            detailSnapshot: currentVideoMovieDetailSnapshot,
            actionDispatch: videoMovieActionDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isVideoMovieStreamRoute}
      <main
        class="video-stream-route"
        aria-label={currentI18n.t('app.route.videoMovieStream.aria')}
      >
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoMovieStreamShell, {
            snapshot: currentVideoLibrarySnapshot,
            route: currentRenderableVideoRoute,
            detailSnapshot: currentVideoMovieDetailSnapshot,
            localPlayerSnapshot: currentLocalSnapshot,
            dispatchSnapshot: playerDispatch.snapshot,
            actionDispatch: videoMovieStreamActionDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isVideoTvShowsRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoTvShows.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoTvShowsPanel, { snapshot: currentVideoLibrarySnapshot })}
        />
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoRecentPanel, {
            snapshot: currentVideoLibrarySnapshot,
            i18n: currentI18n
          })}
        />
        <LazyRouteComponent
          route={bindLazyRoute(loadMediaPlaylistsPanel, {
            snapshot: currentVideoMediaPlaylistsSnapshot,
            dispatch: videoMediaPlaylistsDispatch,
            actionDispatch: videoMediaPlaylistsActionDispatch,
            i18n: currentI18n
          })}
        />
      </main>
    {:else if isVideoTvShowDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoTvShowDetail.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoTvShowDetailShell, {
            snapshot: currentVideoTvSnapshot,
            route: currentRenderableVideoRoute,
            i18n: currentI18n,
            buildOptions: currentRouteBuildOptions
          })}
        />
      </main>
    {:else if isVideoTvSeasonDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoTvSeasonDetail.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoSeasonDetailShell, {
            snapshot: currentVideoTvSnapshot,
            route: currentRenderableVideoRoute,
            artworkDispatch: videoSeasonArtworkDispatch,
            writeDispatch: videoSeasonWriteDispatch,
            i18n: currentI18n,
            buildOptions: currentRouteBuildOptions
          })}
        />
      </main>
    {:else if isVideoEpisodeDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoEpisodeDetail.aria')}>
        <LazyRouteComponent
          route={bindLazyRoute(loadVideoEpisodeDetailShell, {
            snapshot: currentVideoTvSnapshot,
            route: currentRenderableVideoRoute,
            actionDispatch: videoEpisodeActionDispatch,
            i18n: currentI18n,
            buildOptions: currentRouteBuildOptions
          })}
        />
      </main>
    {:else if isVideoUnknownRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoUnknown.aria')}>
        <section
          class="video-route-not-found surface"
          aria-labelledby="video-route-not-found-title"
        >
          <p class="section-kicker">{currentI18n.t('app.route.video.kicker')}</p>
          <h2 id="video-route-not-found-title">{currentI18n.t('app.route.video.notFoundTitle')}</h2>
          <p>
            {currentI18n.t('app.route.video.notFoundDescription', {
              path:
                currentVideoRoute?.kind === 'videoUnknown'
                  ? currentVideoRoute.pathLabel
                  : '/video/unknown'
            })}
          </p>
          <nav
            class="video-route-recovery"
            aria-label={currentI18n.t('app.route.video.recoveryAria')}
          >
            <a
              href={buildAppRoute(
                { kind: 'primary', route: { kind: 'movies' } },
                currentRouteBuildOptions
              )}>Movies</a
            >
            <a
              href={buildAppRoute(
                { kind: 'primary', route: { kind: 'tvshows' } },
                currentRouteBuildOptions
              )}>TV shows</a
            >
          </nav>
        </section>
      </main>
    {/if}
  </AppRuntimeShellFrame>
{/if}

<style>
  .section-kicker,
  h2,
  p {
    margin: 0;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .video-route-recovery,
  .settings-route-recovery,
  .addons-route-recovery,
  .lab-route-recovery {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
</style>
