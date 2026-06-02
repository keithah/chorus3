<script lang="ts">
  import { onMount } from 'svelte';

  import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import AppRuntimeSurface from '$lib/app-pages/AppRuntimeSurface.svelte';
  import {
    addonsStore,
    configStore,
    connectionStore,
    hostConnectionStore,
    localPlayerStore,
    localPlaylistStore,
    mediaFilesStore,
    videoMediaFilesStore,
    mediaPlaylistsStore,
    videoMediaPlaylistsStore,
    mediaSearchStore,
    musicBrowseStore,
    musicLibraryStore,
    playerDispatch as defaultPlayerDispatch,
    pvrStore,
    remoteInputDispatch as defaultRemoteInputDispatch,
    playerStore,
    queueDispatch as defaultQueueDispatch,
    queueStore,
    settingsStore,
    thumbsUpStore,
    localeStore,
    type QueuePlayableItemSnapshot
  } from '$lib/stores';
  import {
    connectionDescription,
    connectionStatusText,
    connectionTone,
    createActiveHostSummary,
    toAppShellLocalPlayerSnapshot,
    toAppShellPlayerSnapshot
  } from '$lib/app/appShellAdapters';
  import {
    playlistClearDisabledReason,
    playlistPartyModeDisabledReason,
    playlistRefreshDisabledReason,
    queueSnapshotToPlayableItems,
    saveKodiPlaylistDisabledReason,
    toLocalPlaylistItemInput,
    type PlaylistDisabledReasonContext
  } from '$lib/app/appPlaylistAdapters';
  import {
    exportLocalPlaylist as exportLocalPlaylistFile,
    playLocalPlaylistInBrowser as playLocalPlaylistInBrowserItems,
    playLocalPlaylistInKodi as playLocalPlaylistInKodiItems
  } from '$lib/app/appLocalPlaylistActions';
  import {
    primaryRouteToVideoRoute,
    toAppRoute,
    videoDetailRefreshKey,
    videoRouteToPrimaryRoute
  } from '$lib/app/appRouteAdapters';
  import { createAppDefaultDispatches } from '$lib/app/appDefaultDispatches';
  import {
    parseHashAppRoute,
    refreshPackageMountedLibraries,
    toggleDocumentFullscreen
  } from '$lib/app/appRuntimeHelpers';
  import type {
    AppProps,
    PlaylistPlaybackDispatch,
    PlaylistQueueDispatch
  } from '$lib/app/appComponentTypes';
  import {
    activatePackageMountedHost,
    bestEffortRefresh,
    withPackageDefaultCredentials
  } from '$lib/app/appPackageHost';
  import { refreshAppVideoDetailRoute } from '$lib/app/appVideoDetailRefresh';
  import { videoLibraryStore } from '$lib/stores/videoLibrary.svelte';
  import { mainNavStore } from '$lib/stores/mainNav.svelte';
  import { videoMovieDetailStore } from '$lib/stores/videoMovieDetailStore.svelte';
  import { videoTvStore } from '$lib/stores/videoTvStore.svelte';
  import {
    buildAppRoute,
    createKodiPackageRouteBuildOptions,
    KODI_WEBINTERFACE_BASE_PATH,
    parseAppRoute,
    type AppRoute
  } from '$lib/app/appRouter';
  import { createAppNavigationItems } from '$lib/app-shell/appNavigation';
  import type { LocalPlaylistPageActions } from '$lib/app-pages/PlaylistsPage.svelte';
  import { getAppPageMetadata } from '$lib/app-pages/appPageMetadata';
  import type {
    AppShellCallbacks,
    AppShellDrawerState,
    AppShellPlaylistDestinationMode,
    AppShellPlaylistMediaMode,
    AppShellPlaylistMenuAction
  } from '$lib/app-shell/appShellTypes';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import { createTranslationContext } from '$lib/i18n';
  import { handlePlaybackShortcut } from '$lib/app/playbackShortcuts';
  import { handleRemoteInputShortcut } from '$lib/app/remoteInputShortcuts';
  import type { VideoRoute } from '$lib/video/videoRouter';

  const appDefaultDispatches = createAppDefaultDispatches({
    loadCurrentAddonDetail,
    openAddonsRoute,
    refreshAfterMovieWrite,
    refreshAfterEpisodeWrite,
    refreshAfterSeasonWrite
  });

  const dashboardVideoRoute: VideoRoute = { kind: 'dashboard' };

  let {
    playerSnapshot,
    playerDispatch = defaultPlayerDispatch,
    remoteSnapshot,
    remoteInputDispatch = defaultRemoteInputDispatch,
    localPlayerSnapshot,
    localPlaylistSnapshot,
    localPlaylistDispatch = localPlaylistStore,
    queueSnapshot,
    queueDispatch = defaultQueueDispatch,
    musicLibrarySnapshot,
    musicBrowseSnapshot,
    musicBrowseDispatch = appDefaultDispatches.musicBrowseDispatch,
    musicActionDispatch = appDefaultDispatches.musicActionDispatch,
    mediaSearchSnapshot,
    mediaSearchDispatch = appDefaultDispatches.mediaSearchDispatch,
    mediaSearchActionDispatch = appDefaultDispatches.mediaSearchActionDispatch,
    mediaFilesSnapshot,
    mediaFilesDispatch = appDefaultDispatches.mediaFilesDispatch,
    mediaFilesActionDispatch = appDefaultDispatches.mediaFilesActionDispatch,
    videoMediaFilesSnapshot,
    videoMediaFilesDispatch = appDefaultDispatches.videoMediaFilesDispatch,
    videoMediaFilesActionDispatch = appDefaultDispatches.videoMediaFilesActionDispatch,
    mediaPlaylistsSnapshot,
    mediaPlaylistsDispatch = appDefaultDispatches.mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch = appDefaultDispatches.mediaPlaylistsActionDispatch,
    pvrSnapshot,
    thumbsUpSnapshot,
    videoMediaPlaylistsSnapshot,
    videoMediaPlaylistsDispatch = appDefaultDispatches.videoMediaPlaylistsDispatch,
    videoMediaPlaylistsActionDispatch = appDefaultDispatches.videoMediaPlaylistsActionDispatch,
    route,
    videoLibrarySnapshot,
    videoMovieDetailSnapshot,
    settingsSnapshot,
    settingsDispatch = appDefaultDispatches.settingsDispatch,
    localeSnapshot,
    localeDispatch = appDefaultDispatches.localeDispatch,
    addonsSnapshot,
    addonsDispatch = appDefaultDispatches.addonsDispatch,
    addonDetailDispatch = appDefaultDispatches.addonDetailDispatch,
    nowPlayingEmbedQuery,
    nowPlayingHostSummary,
    nowPlayingRefreshDispatch,
    localBrowserPlayerActionDispatch = appDefaultDispatches.localBrowserPlayerActionDispatch,
    packageMountedHost = null,
    packageBasePath = '',
    videoMovieActionDispatch = appDefaultDispatches.videoMovieActionDispatch,
    videoMovieStreamActionDispatch = appDefaultDispatches.videoMovieStreamActionDispatch,
    videoTvSnapshot,
    videoEpisodeActionDispatch = appDefaultDispatches.videoEpisodeActionDispatch,
    videoSeasonArtworkDispatch = appDefaultDispatches.videoSeasonArtworkDispatch,
    videoSeasonWriteDispatch = appDefaultDispatches.videoSeasonWriteDispatch
  }: AppProps = $props();
  let localRoute = $state<AppRoute | VideoRoute | null>(null);
  let lastVideoDetailRefreshKey = $state('');
  let lastAddonDetailAutoloadKey = $state('');
  let currentPackageSearch = $state('');
  const currentRoute = $derived(toAppRoute(localRoute ?? route ?? { kind: 'dashboard' }));
  const currentPrimaryRoute = $derived(currentRoute.kind === 'primary' ? currentRoute.route : null);
  const currentPrimaryShellRoute = $derived<PrimaryRoute | null>(
    currentPrimaryRoute ?? (currentRoute.kind === 'dashboard' ? { kind: 'home' } : null)
  );
  const currentVideoRoute = $derived(
    currentRoute.kind === 'video'
      ? currentRoute.route
      : primaryRouteToVideoRoute(currentPrimaryRoute)
  );
  const currentMetadataPrimaryRoute = $derived<PrimaryRoute>(
    currentPrimaryShellRoute ?? videoRouteToPrimaryRoute(currentVideoRoute) ?? { kind: 'home' }
  );
  const currentAppPageMetadata = $derived(getAppPageMetadata(currentMetadataPrimaryRoute));
  const currentRenderableVideoRoute = $derived(currentVideoRoute ?? dashboardVideoRoute);
  const currentPlayerSnapshot = $derived(playerSnapshot ?? playerStore.snapshot);
  const currentRemoteSnapshot = $derived(remoteSnapshot ?? remoteInputDispatch.snapshot);
  const currentLocalSnapshot = $derived(localPlayerSnapshot ?? localPlayerStore.snapshot);
  const currentLocalPlaylistSnapshot = $derived(
    localPlaylistSnapshot ?? localPlaylistStore.snapshot
  );
  const currentQueueSnapshot = $derived(queueSnapshot ?? queueStore.snapshot);
  const currentMusicLibrarySnapshot = $derived(musicLibrarySnapshot ?? musicLibraryStore.snapshot);
  const currentMusicBrowseSnapshot = $derived(musicBrowseSnapshot ?? musicBrowseStore.snapshot);
  const currentMediaSearchSnapshot = $derived(mediaSearchSnapshot ?? mediaSearchStore.snapshot);
  const currentMediaFilesSnapshot = $derived(mediaFilesSnapshot ?? mediaFilesStore.snapshot);
  const currentVideoMediaFilesSnapshot = $derived(
    videoMediaFilesSnapshot ?? videoMediaFilesStore.snapshot
  );
  const currentMediaPlaylistsSnapshot = $derived(
    mediaPlaylistsSnapshot ?? mediaPlaylistsStore.snapshot
  );
  const currentPvrSnapshot = $derived(pvrSnapshot ?? pvrStore.snapshot);
  const currentThumbsUpSnapshot = $derived(thumbsUpSnapshot ?? thumbsUpStore.snapshot);
  const currentVideoMediaPlaylistsSnapshot = $derived(
    videoMediaPlaylistsSnapshot ?? videoMediaPlaylistsStore.snapshot
  );
  const currentVideoLibrarySnapshot = $derived(videoLibrarySnapshot ?? videoLibraryStore.snapshot);
  const currentVideoMovieDetailSnapshot = $derived(
    videoMovieDetailSnapshot ?? videoMovieDetailStore.snapshot
  );
  const currentSettingsSnapshot = $derived(settingsSnapshot ?? settingsStore.snapshot);
  const currentLocaleSnapshot = $derived(localeSnapshot ?? localeStore.snapshot);
  const currentI18n = $derived(createTranslationContext(currentLocaleSnapshot.locale));
  const currentAddonsSnapshot = $derived(addonsSnapshot ?? addonsStore.snapshot);
  const currentNowPlayingHostSummary = $derived(
    nowPlayingHostSummary === undefined
      ? packageMountedHost
        ? createActiveHostSummary(packageMountedHost)
        : hostConnectionStore.snapshot.activeHostSummary
      : nowPlayingHostSummary
  );
  const currentVideoTvSnapshot = $derived(videoTvSnapshot ?? videoTvStore.snapshot);
  const currentActiveKodiHost = $derived(configStore.activeHost);
  const isPackageMounted = $derived(packageMountedHost !== null);
  const currentPackageBasePath = $derived(
    isPackageMounted ? packageBasePath || KODI_WEBINTERFACE_BASE_PATH : ''
  );
  const currentRouteBuildOptions = $derived(
    isPackageMounted
      ? createKodiPackageRouteBuildOptions({
          packageBasePath: currentPackageBasePath,
          packageSearch: currentPackageSearch || globalThis.location?.search || ''
        })
      : ({ packageBasePath: '' } as const)
  );
  const currentShellNavigationItems = $derived(
    createAppNavigationItems({
      ...currentRouteBuildOptions,
      activeRoute: currentPrimaryShellRoute,
      mainNavRows: mainNavStore.snapshot.customized ? mainNavStore.snapshot.rows : undefined
    })
  );
  let drawerMediaMode = $state<AppShellPlaylistMediaMode>('audio');
  let drawerDestinationModeOverride = $state<AppShellPlaylistDestinationMode | null>(null);
  let drawerCollapsed = $state(false);
  let drawerMenuOpen = $state(false);
  let remoteOverlayOpen = $state(false);
  let localShuffleEnabled = $state(false);
  let lastKnownKodiStageArtUrl = $state<string | undefined>(undefined);
  const currentPlaylistDispatchDestinationMode = $derived<AppShellPlaylistDestinationMode>(
    playerDispatch.snapshot?.mode === 'local' ? 'local' : 'kodi'
  );
  const currentDrawerDestinationMode = $derived<AppShellPlaylistDestinationMode>(
    drawerDestinationModeOverride ?? currentPlaylistDispatchDestinationMode
  );
  const currentShellPlayer = $derived(
    currentDrawerDestinationMode === 'local'
      ? toAppShellLocalPlayerSnapshot(currentLocalSnapshot, localShuffleEnabled)
      : toAppShellPlayerSnapshot(currentPlayerSnapshot, connectionStore.snapshot.status)
  );
  const currentKodiStageArtUrl = $derived(optionalKodiImageUrl(currentPlayerSnapshot.item?.fanart));
  const currentShellStageArtUrl = $derived(
    currentDrawerDestinationMode === 'kodi'
      ? (currentKodiStageArtUrl ?? lastKnownKodiStageArtUrl)
      : undefined
  );

  $effect(() => {
    if (remoteOverlayOpen && currentPlayerSnapshot.playbackStatus === 'none') {
      remoteOverlayOpen = false;
    }
  });
  const isPlayerDestinationCommandRunning = $derived(
    playerDispatch.snapshot?.commandStatus === 'running'
  );
  const isQueueCommandRunning = $derived(queueDispatch.snapshot?.commandStatus === 'running');
  const isLocalPlaylistMutationRunning = $derived(
    currentLocalPlaylistSnapshot.mutationStatus === 'running'
  );
  const remoteOverlayPlayerDispatch = $derived({
    ...playerDispatch,
    stop: stopPlaybackFromShell
  });
  const currentQueuePlayableItems = $derived<QueuePlayableItemSnapshot[]>(
    queueSnapshot === undefined
      ? queueStore.getPlayableItems()
      : queueSnapshotToPlayableItems(queueSnapshot)
  );
  const safeQueueItemsForLocalPlaylist = $derived(
    currentQueuePlayableItems.flatMap(toLocalPlaylistItemInput)
  );
  const playlistDisabledReasonContext = $derived<PlaylistDisabledReasonContext>({
    destinationMode: currentDrawerDestinationMode,
    localPlaylistSnapshot: currentLocalPlaylistSnapshot,
    queueSnapshot: currentQueueSnapshot,
    playerSnapshot: currentPlayerSnapshot,
    safeQueueItemCount: safeQueueItemsForLocalPlaylist.length,
    isLocalPlaylistMutationRunning,
    isQueueCommandRunning,
    isPlayerDestinationCommandRunning
  });
  const currentPlaylistDrawerMenuDisabledReasons = $derived({
    currentPlaylist: 'Current playlist is already selected.',
    clear: getPlaylistClearDisabledReason(),
    refresh: getPlaylistRefreshDisabledReason(),
    partyMode: getPlaylistPartyModeDisabledReason(),
    saveKodiPlaylist: getSaveKodiPlaylistDisabledReason()
  });
  const currentPlaylistDrawer = $derived<AppShellDrawerState>({
    label: 'Current playlist',
    mediaMode: drawerMediaMode,
    collapsed: drawerCollapsed,
    menuOpen: drawerMenuOpen,
    menuDisabledReasons: currentPlaylistDrawerMenuDisabledReasons
  });

  $effect(() => {
    if (currentKodiStageArtUrl) {
      lastKnownKodiStageArtUrl = currentKodiStageArtUrl;
    }
  });
  const currentPlaylistDestination = $derived({
    mode: currentDrawerDestinationMode,
    mediaMode: drawerMediaMode,
    disabledReasons: isPlayerDestinationCommandRunning
      ? {
          kodi: 'A player command is running. Destination changes are temporarily disabled.',
          local: 'A player command is running. Destination changes are temporarily disabled.'
        }
      : undefined
  });
  const playlistDrawerCallbacks = $derived<AppShellCallbacks>({
    onDestinationModeChange: handlePlaylistDestinationModeChange,
    onMediaModeChange: (mode) => {
      drawerMediaMode = mode;
    },
    onPlaylistMenuAction: handlePlaylistMenuAction,
    onPlaylistMenuToggle: (open) => {
      drawerMenuOpen = open;
    },
    onPlaylistCollapseToggle: (collapsed) => {
      drawerCollapsed = collapsed;
    }
  });
  const localPlaylistPageActions = $derived<LocalPlaylistPageActions>({
    playInKodi: async (_playlistId, items) =>
      playLocalPlaylistInKodiItems(
        playerDispatch as PlaylistPlaybackDispatch,
        queueDispatch as PlaylistQueueDispatch,
        items
      ),
    playInBrowser: async (_playlistId, items) =>
      playLocalPlaylistInBrowserItems(playerDispatch as PlaylistPlaybackDispatch, items),
    exportList: (_playlistId, playlistLabel, items) => exportLocalPlaylistFile(playlistLabel, items)
  });
  const currentParityPlaceholder = $derived(
    currentRoute.kind === 'parityPlaceholder' ? currentRoute.placeholder : null
  );
  const currentHomeContext = $derived({
    hostLabel:
      packageMountedHost?.label ??
      configStore.snapshot.activeHost?.label ??
      currentI18n.t('app.mission.noHost'),
    description: currentI18n.t('app.mission.description'),
    storageWarningMessage: configStore.snapshot.storageWarning?.message ?? null,
    statusGridAria: currentI18n.t('app.statusGrid.aria'),
    connection: {
      title: currentI18n.t('app.connection.title'),
      status: connectionStatusText(connectionStore.snapshot, currentI18n),
      tone: connectionTone(connectionStore.snapshot),
      description: connectionDescription(connectionStore.snapshot, currentI18n)
    },
    themeContract: {
      title: currentI18n.t('app.themeContract.title'),
      status: currentI18n.t('app.themeContract.status'),
      tone: 'success' as const,
      description: currentI18n.t('app.themeContract.description')
    }
  });
  const currentAppPageSurfaceProps = $derived({
    route: currentPrimaryShellRoute ?? { kind: 'home' as const },
    metadata: currentAppPageMetadata,
    i18n: currentI18n,
    packageBasePath: currentPackageBasePath,
    packageSearch: currentPackageSearch || globalThis.location?.search || '',
    parityPlaceholder: currentParityPlaceholder,
    homeContext: currentHomeContext,
    connectionSnapshot: connectionStore.snapshot,
    localeSnapshot: currentLocaleSnapshot,
    localeDispatch,
    playerSnapshot: currentPlayerSnapshot,
    playerDispatch,
    remoteSnapshot: currentRemoteSnapshot,
    remoteInputDispatch,
    localPlayerSnapshot: currentLocalSnapshot,
    localPlaylistSnapshot: currentLocalPlaylistSnapshot,
    localPlaylistDispatch,
    localPlaylistActions: localPlaylistPageActions,
    queueSnapshot: currentQueueSnapshot,
    queueDispatch,
    musicLibrarySnapshot: currentMusicLibrarySnapshot,
    musicBrowseSnapshot: currentMusicBrowseSnapshot,
    musicBrowseDispatch,
    musicActionDispatch,
    mediaSearchSnapshot: currentMediaSearchSnapshot,
    mediaSearchDispatch,
    mediaSearchActionDispatch,
    mediaFilesSnapshot: currentMediaFilesSnapshot,
    mediaFilesDispatch,
    mediaFilesActionDispatch,
    videoMediaFilesSnapshot: currentVideoMediaFilesSnapshot,
    videoMediaFilesDispatch,
    videoMediaFilesActionDispatch,
    mediaPlaylistsSnapshot: currentMediaPlaylistsSnapshot,
    mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch,
    pvrSnapshot: currentPvrSnapshot,
    pvrDispatch: appDefaultDispatches.pvrDispatch,
    thumbsUpSnapshot: currentThumbsUpSnapshot,
    thumbsUpDispatch: thumbsUpStore,
    videoMediaPlaylistsSnapshot: currentVideoMediaPlaylistsSnapshot,
    videoMediaPlaylistsDispatch,
    videoMediaPlaylistsActionDispatch,
    videoLibrarySnapshot: currentVideoLibrarySnapshot,
    settingsSnapshot: currentSettingsSnapshot,
    settingsDispatch,
    addonsSnapshot: currentAddonsSnapshot,
    addonsDispatch,
    addonDetailDispatch,
    videoMovieDetailSnapshot: currentVideoMovieDetailSnapshot,
    videoMovieActionDispatch,
    videoTvSnapshot: currentVideoTvSnapshot,
    videoEpisodeActionDispatch,
    videoSeasonArtworkDispatch,
    videoSeasonWriteDispatch,
    renderableVideoRoute: currentRenderableVideoRoute
  });
  const isRemoteRoute = $derived(
    currentRoute.kind === 'remote' || currentPrimaryRoute?.kind === 'remote'
  );

  $effect(() => {
    const videoRoute = currentVideoRoute;

    if (!videoRoute) {
      lastVideoDetailRefreshKey = '';
      return;
    }

    if (!currentActiveKodiHost) {
      return;
    }

    const refreshKey = videoDetailRefreshKey(videoRoute, currentActiveKodiHost);
    if (!refreshKey || refreshKey === lastVideoDetailRefreshKey) {
      return;
    }

    lastVideoDetailRefreshKey = refreshKey;
    void refreshCurrentVideoDetailRoute(videoRoute, refreshKey);
  });

  $effect(() => {
    const addonid = currentAddonId();

    if (!addonid || addonsSnapshot !== undefined) {
      lastAddonDetailAutoloadKey = '';
      return;
    }

    const activeHostId = currentActiveKodiHost?.id ?? '';
    if (!activeHostId) {
      return;
    }

    const detailLoadKey = `${activeHostId}:${addonid}`;
    if (
      currentAddonsSnapshot.detailStatus === 'success' &&
      currentAddonsSnapshot.detail?.addonid === addonid
    ) {
      lastAddonDetailAutoloadKey = detailLoadKey;
      return;
    }

    if (detailLoadKey === lastAddonDetailAutoloadKey) {
      return;
    }

    lastAddonDetailAutoloadKey = detailLoadKey;
    void addonsStore.loadAddonDetail(addonid);
  });

  async function refreshCurrentVideoDetailRoute(
    videoRoute: VideoRoute,
    expectedRefreshKey: string
  ): Promise<void> {
    await refreshAppVideoDetailRoute({
      videoRoute,
      expectedRefreshKey,
      hasInjectedVideoTvSnapshot: videoTvSnapshot !== undefined,
      hasInjectedVideoMovieDetailSnapshot: videoMovieDetailSnapshot !== undefined,
      hasInjectedVideoLibrarySnapshot: videoLibrarySnapshot !== undefined,
      currentRefreshKey: () => videoDetailRefreshKey(currentVideoRoute, currentActiveKodiHost),
      movieDetailStore: videoMovieDetailStore,
      tvStore: videoTvStore
    });
  }

  function updateLocalRouteFromHash(): void {
    if (!isPackageMounted) {
      return;
    }

    updateCurrentPackageSearch();
    const hashRoute = parseCurrentHashRoute();
    if (!hashRoute) {
      return;
    }

    localRoute = hashRoute;
  }

  function updateLocalRouteFromLocation(): void {
    updateCurrentPackageSearch();

    if (isPackageMounted) {
      updateLocalRouteFromHash();
      return;
    }

    try {
      localRoute = parseAppRoute(
        globalThis.location?.pathname ?? '/',
        globalThis.location?.search ?? ''
      );
    } catch {
      localRoute = { kind: 'dashboard' };
    }
  }

  function updateCurrentPackageSearch(): void {
    currentPackageSearch = isPackageMounted ? (globalThis.location?.search ?? '') : '';
  }

  function parseCurrentHashRoute(): AppRoute | null {
    try {
      return parseHashAppRoute(globalThis.location?.hash, currentPackageBasePath);
    } catch {
      return { kind: 'dashboard' };
    }
  }

  onMount(() => {
    updateCurrentPackageSearch();

    if (route === undefined) {
      updateLocalRouteFromLocation();
    }

    const handleHashChange = (): void => updateLocalRouteFromHash();
    const handlePopState = (): void => updateLocalRouteFromLocation();
    globalThis.addEventListener?.('hashchange', handleHashChange);
    globalThis.addEventListener?.('popstate', handlePopState);

    if (packageMountedHost) {
      const activePackageHost = withPackageDefaultCredentials(packageMountedHost);
      activatePackageMountedHost(configStore, activePackageHost);
      void connectionStore.connect(activePackageHost);
      playerStore.startNotificationRefresh();
      queueStore.startNotificationRefresh();
      try {
        playerStore.startPolling(2500);
      } catch {
        // Polling is opportunistic; command-triggered refreshes still own diagnostics.
      }
      void refreshPackageMountedLibraries();
    }

    const handleGlobalKeydown = (event: KeyboardEvent): void => {
      if (
        isRemoteRoute &&
        handleRemoteInputShortcut(event, {
          sendInput: (command) => {
            try {
              void Promise.resolve(remoteInputDispatch.sendInput(command)).catch(() => {
                // RemoteInputPanel owns secret-safe diagnostics through the dispatch snapshot.
              });
            } catch {
              // Keep the global listener alive; the dispatch snapshot is the diagnostics surface.
            }
          },
          executeAction: (action) => {
            if (!remoteInputDispatch.executeAction) {
              return;
            }
            try {
              void Promise.resolve(remoteInputDispatch.executeAction(action)).catch(() => {
                // RemoteInputPanel owns secret-safe diagnostics through the dispatch snapshot.
              });
            } catch {
              // Keep the global listener alive; the dispatch snapshot is the diagnostics surface.
            }
          }
        })
      ) {
        return;
      }

      handlePlaybackShortcut(event, playerDispatch, {
        playerSnapshot: currentPlayerSnapshot,
        toggleFullscreen: toggleAppFullscreen
      });
    };

    window.addEventListener('keydown', handleGlobalKeydown);

    return () => {
      globalThis.removeEventListener?.('hashchange', handleHashChange);
      globalThis.removeEventListener?.('popstate', handlePopState);
      if (packageMountedHost) {
        playerStore.stopNotificationRefresh();
        playerStore.stopPolling();
        queueStore.stopNotificationRefresh();
      }
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  async function refreshNowPlayingEmbed(): Promise<void> {
    if (nowPlayingRefreshDispatch) {
      await nowPlayingRefreshDispatch();
      return;
    }

    await playerStore.refresh('manual');
  }

  async function handlePlaylistDestinationModeChange(
    mode: AppShellPlaylistDestinationMode
  ): Promise<void> {
    if (playerDispatch.snapshot?.commandStatus === 'running') {
      return;
    }

    const currentMode = currentDrawerDestinationMode;

    if (mode === currentMode) {
      return;
    }

    drawerDestinationModeOverride = mode;

    if (mode === 'local') {
      await playerDispatch.startLocalPlayback();
      return;
    }

    if (currentMode === 'local') {
      await playerDispatch.resumeOnKodi();
    }
  }

  async function handlePlaylistMenuAction(action: AppShellPlaylistMenuAction): Promise<void> {
    if (action === 'refresh') {
      if (getPlaylistRefreshDisabledReason()) {
        return;
      }

      if (currentDrawerDestinationMode === 'local') {
        return;
      }

      await bestEffortRefresh([
        () => playerStore.refresh('manual'),
        () => queueStore.refresh('manual')
      ]);
      return;
    }

    if (action === 'partyMode') {
      if (getPlaylistPartyModeDisabledReason()) {
        return;
      }

      await playerDispatch.setPartyMode('toggle');
      return;
    }

    if (action === 'clear') {
      if (currentDrawerDestinationMode === 'local') {
        const playlistId = currentLocalPlaylistSnapshot.selectedPlaylistId;
        if (getPlaylistClearDisabledReason() || !playlistId) {
          return;
        }

        await localPlaylistDispatch.clearPlaylist(playlistId);
        return;
      }

      if (getPlaylistClearDisabledReason()) {
        return;
      }

      await queueDispatch.clear();
      return;
    }

    if (action === 'saveKodiPlaylist') {
      const playlistId = currentLocalPlaylistSnapshot.selectedPlaylistId;
      const items = safeQueueItemsForLocalPlaylist;
      if (getSaveKodiPlaylistDisabledReason() || !playlistId || items.length === 0) {
        return;
      }

      await localPlaylistDispatch.addItems(playlistId, items);
    }
  }

  function getPlaylistClearDisabledReason(): string | undefined {
    return playlistClearDisabledReason(playlistDisabledReasonContext);
  }

  function getPlaylistRefreshDisabledReason(): string | undefined {
    return playlistRefreshDisabledReason(playlistDisabledReasonContext);
  }

  function getPlaylistPartyModeDisabledReason(): string | undefined {
    return playlistPartyModeDisabledReason(playlistDisabledReasonContext);
  }

  function getSaveKodiPlaylistDisabledReason(): string | undefined {
    return saveKodiPlaylistDisabledReason(playlistDisabledReasonContext);
  }

  const toggleAppFullscreen = (): void => toggleDocumentFullscreen(document);

  function currentAddonId(): string | null {
    if (currentRoute.kind === 'addonDetail') {
      return currentRoute.addonid;
    }

    return currentPrimaryRoute?.kind === 'addonDetail' ? currentPrimaryRoute.addonid : null;
  }

  async function loadCurrentAddonDetail(): Promise<void> {
    const addonid = currentAddonId();

    if (!addonid) {
      return;
    }

    await addonsStore.loadAddonDetail(addonid);
  }

  function openAddonsRoute(): void {
    try {
      const href = buildAppRoute(
        { kind: 'primary', route: { kind: 'addonsAll' } },
        currentRouteBuildOptions
      );
      if (isPackageMounted && href.startsWith('#')) {
        globalThis.location.hash = href;
      } else {
        globalThis.history?.pushState({ routeKind: 'addons' }, '', href);
        localRoute = { kind: 'primary', route: { kind: 'addonsAll' } };
      }
    } catch {
      // Navigation recovery is best-effort; the route UI remains safe without it.
    }
  }

  function openPrimaryRoute(route: PrimaryRoute): void {
    try {
      const href = buildAppRoute({ kind: 'primary', route }, currentRouteBuildOptions);
      if (isPackageMounted && href.startsWith('#')) {
        globalThis.location.hash = href;
      } else {
        globalThis.history?.pushState({ routeKind: 'primary' }, '', href);
        localRoute = { kind: 'primary', route };
      }
    } catch {
      // Route recovery is best-effort; the current page remains usable.
    }
  }

  function openSearchRoute(query: string): void {
    const trimmed = query.trim();

    if (!trimmed) {
      openPrimaryRoute({ kind: 'search' });
      return;
    }

    openPrimaryRoute({ kind: 'searchMedia', media: 'all', query: trimmed });
  }

  async function refreshAfterMovieWrite(movieid: number): Promise<void> {
    await bestEffortRefresh([
      () => videoLibraryStore.refresh('command:videoWrite'),
      () => videoMovieDetailStore.refreshMovieDetail(movieid, 'command:videoWrite')
    ]);
  }

  async function refreshAfterEpisodeWrite(episodeid: number): Promise<void> {
    await bestEffortRefresh([
      () => videoTvStore.refreshEpisodeDetail(episodeid, 'command:videoWrite')
    ]);
  }

  async function refreshAfterSeasonWrite(): Promise<void> {
    if (currentVideoRoute?.kind !== 'videoTvSeasonDetail') {
      return;
    }

    await bestEffortRefresh([
      () =>
        videoTvStore.refreshSeasonEpisodes(
          currentVideoRoute.tvshowid,
          currentVideoRoute.season,
          'command:videoWrite'
        )
    ]);
  }

  async function toggleLocalShuffle(): Promise<void> {
    localShuffleEnabled = !localShuffleEnabled;
    await playerDispatch.setShuffle(localShuffleEnabled);
  }

  async function handleLocalMediaEnded(): Promise<void> {
    const controls = playerDispatch as PlaylistPlaybackDispatch;
    if (
      currentDrawerDestinationMode !== 'local' ||
      playerDispatch.snapshot?.commandStatus === 'running' ||
      controls.canNavigateLocalFilePlaylist?.() !== true
    ) {
      return;
    }

    await playerDispatch.next();
  }

  function toggleRemoteOverlayFromPlayer(): void {
    remoteOverlayOpen = !remoteOverlayOpen;
  }

  function closeRemoteOverlay(): void {
    remoteOverlayOpen = false;
  }

  function stopPlaybackFromShell(): void {
    closeRemoteOverlay();
    void playerDispatch.stop();
  }
</script>

<AppRuntimeSurface
  {currentRoute}
  {currentVideoRoute}
  {currentRenderableVideoRoute}
  {currentPrimaryShellRoute}
  {currentShellNavigationItems}
  {currentAppPageMetadata}
  {currentRouteBuildOptions}
  {currentShellPlayer}
  {currentShellStageArtUrl}
  {currentDrawerDestinationMode}
  {currentPlaylistDrawer}
  {currentPlaylistDestination}
  {playlistDrawerCallbacks}
  {currentAppPageSurfaceProps}
  {remoteOverlayOpen}
  {currentRemoteSnapshot}
  {remoteInputDispatch}
  {currentPlayerSnapshot}
  {playerDispatch}
  {remoteOverlayPlayerDispatch}
  {currentI18n}
  {currentQueueSnapshot}
  {queueDispatch}
  {currentLocalSnapshot}
  {currentNowPlayingHostSummary}
  {nowPlayingEmbedQuery}
  {localBrowserPlayerActionDispatch}
  {currentHomeContext}
  {currentMusicLibrarySnapshot}
  {currentMusicBrowseSnapshot}
  {musicBrowseDispatch}
  {musicActionDispatch}
  {currentMediaSearchSnapshot}
  {mediaSearchDispatch}
  {mediaSearchActionDispatch}
  {currentMediaFilesSnapshot}
  {mediaFilesDispatch}
  {mediaFilesActionDispatch}
  {currentMediaPlaylistsSnapshot}
  {mediaPlaylistsDispatch}
  {mediaPlaylistsActionDispatch}
  {isPackageMounted}
  {currentParityPlaceholder}
  {currentPackageBasePath}
  {currentAddonsSnapshot}
  {addonsDispatch}
  {addonDetailDispatch}
  {currentSettingsSnapshot}
  {settingsDispatch}
  {currentVideoLibrarySnapshot}
  {currentVideoMediaPlaylistsSnapshot}
  {videoMediaPlaylistsDispatch}
  {videoMediaPlaylistsActionDispatch}
  {videoMovieDetailSnapshot}
  {videoMovieActionDispatch}
  {videoMovieStreamActionDispatch}
  {currentVideoTvSnapshot}
  {videoEpisodeActionDispatch}
  {videoSeasonArtworkDispatch}
  {videoSeasonWriteDispatch}
  {refreshNowPlayingEmbed}
  {toggleLocalShuffle}
  {toggleAppFullscreen}
  {stopPlaybackFromShell}
  {toggleRemoteOverlayFromPlayer}
  {closeRemoteOverlay}
  {openPrimaryRoute}
  {openSearchRoute}
  {handleLocalMediaEnded}
/>
