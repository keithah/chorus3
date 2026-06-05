<script lang="ts">
  import type { AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import LocaleToggle, { type LocaleToggleDispatch } from '$components/LocaleToggle.svelte';
  import type {
    MediaFilesActionDispatch,
    MediaFilesPanelDispatch
  } from '$components/MediaFilesPanel.svelte';
  import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
  import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
  import type {
    MediaSearchActionDispatch,
    MediaSearchPanelDispatch
  } from '$components/MediaSearchPanel.svelte';
  import type { MediaSearchScope } from '$lib/stores/mediaSearch.svelte';
  import type {
    MusicBrowseActionDispatch,
    MusicBrowsePanelDispatch
  } from '$components/MusicBrowsePanel.svelte';
  import type { LocalPlaylistPageActions } from './PlaylistsPage.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import type { PvrPageDispatch } from './PvrPage.svelte';
  import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import type { RemoteInputPanelRemoteDispatch } from '$components/RemoteInputPanel.svelte';
  import type { SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import type { VideoEpisodeActionDispatch } from '$components/VideoEpisodeDetailShell.svelte';
  import type { VideoMovieActionDispatch } from '$components/VideoMovieDetailShell.svelte';
  import type {
    VideoSeasonArtworkDispatch,
    VideoSeasonWriteDispatch
  } from '$components/VideoSeasonDetailShell.svelte';
  import DeferredPrimaryPage from '$lib/app-pages/DeferredPrimaryPage.svelte';
  import AppHomeMediaPanels from '$lib/app-pages/AppHomeMediaPanels.svelte';
  import LazyRouteComponent from '$lib/app-pages/LazyRouteComponent.svelte';
  import ParityPlaceholder from '$components/ParityPlaceholder.svelte';
  import QueuePanel from '$components/QueuePanel.svelte';
  import RemoteInputPanel from '$components/RemoteInputPanel.svelte';
  import PageFrame from '$lib/app-shell/PageFrame.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import {
    createKodiPackageRouteBuildOptions,
    type ParityRoutePlaceholder
  } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    AddonsStoreSnapshot,
    LocalPlayerStoreSnapshot,
    LocalPlaylistDispatch,
    LocalPlaylistStoreSnapshot,
    MediaFilesStoreSnapshot,
    MediaPlaylistsStoreSnapshot,
    MediaSearchStoreSnapshot,
    MusicBrowseStoreSnapshot,
    MusicLibraryStoreSnapshot,
    PlayerStoreSnapshot,
    PvrStoreSnapshot,
    QueueStoreSnapshot,
    RemoteInputDispatchSnapshot,
    SettingsStoreSnapshot,
    ThumbsUpDispatch,
    ThumbsUpStoreSnapshot,
    LocaleStoreSnapshot,
    ConnectionStoreSnapshot
  } from '$lib/stores';
  import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
  import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
  import type { VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';
  import type { VideoRoute } from '$lib/video/videoRouter';
  import type { AppPageMetadata } from './appPageMetadata';
  import {
    isAddonsRoute,
    isBrowserRoute,
    isHelpRoute,
    isLabRoute,
    isPlaylistRoute,
    isPvrRoute,
    isSearchRoute,
    isSettingsRoute,
    isTvDetailRoute
  } from './appPageRouteGroups';
  import {
    addonsPageRoute,
    browserFilesRoute,
    helpPageRoute,
    labApiBrowserPageRoute,
    labIconBrowserPageRoute,
    labLandingPageRoute,
    labScreenshotPageRoute,
    libraryPageRoute,
    mediaSearchPanelRoute,
    musicLibraryPanelRoute,
    playlistsPageRoute,
    pvrPageRoute,
    settingsPageRoute,
    thumbsUpPageRoute,
    videoEpisodeDetailShellRoute,
    videoMoviesPanelRoute,
    videoSeasonDetailShellRoute,
    videoTvShowsPanelRoute,
    videoTvShowDetailShellRoute
  } from './appPageLazyRouteBindings';
  import { isLibraryRoute } from './libraryRouteFilters';

  type RouteSurfaceGroup =
    | 'library'
    | 'browser'
    | 'playlist'
    | 'addons'
    | 'settings'
    | 'help'
    | 'search'
    | 'lab'
    | 'pvr'
    | 'thumbs'
    | 'framed';

  interface HomeStatusCard {
    title: string;
    status: string;
    tone: 'neutral' | 'success' | 'warning' | 'danger';
    description: string;
  }

  interface HomeSurfaceContext {
    hostLabel: string;
    description: string;
    storageWarningMessage?: string | null;
    statusGridAria: string;
    connection: HomeStatusCard;
    themeContract: HomeStatusCard;
  }

  interface Props {
    route: PrimaryRoute;
    metadata: AppPageMetadata;
    i18n: TranslationContext;
    packageBasePath?: string;
    packageSearch?: string;
    parityPlaceholder?: ParityRoutePlaceholder | null;
    homeContext: HomeSurfaceContext;
    connectionSnapshot: ConnectionStoreSnapshot;
    localeSnapshot: LocaleStoreSnapshot;
    localeDispatch: LocaleToggleDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    remoteSnapshot: RemoteInputDispatchSnapshot;
    remoteInputDispatch: RemoteInputPanelRemoteDispatch;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    localPlaylistSnapshot: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch: LocalPlaylistDispatch;
    localPlaylistActions: LocalPlaylistPageActions;
    queueSnapshot: QueueStoreSnapshot;
    queueDispatch: QueuePanelDispatch;
    musicLibrarySnapshot: MusicLibraryStoreSnapshot;
    musicBrowseSnapshot: MusicBrowseStoreSnapshot;
    musicBrowseDispatch: MusicBrowsePanelDispatch;
    musicActionDispatch: MusicBrowseActionDispatch;
    mediaSearchSnapshot: MediaSearchStoreSnapshot;
    mediaSearchDispatch: MediaSearchPanelDispatch;
    mediaSearchActionDispatch: MediaSearchActionDispatch;
    mediaFilesSnapshot: MediaFilesStoreSnapshot;
    mediaFilesDispatch: MediaFilesPanelDispatch;
    mediaFilesActionDispatch: MediaFilesActionDispatch;
    videoMediaFilesSnapshot: MediaFilesStoreSnapshot;
    videoMediaFilesDispatch: MediaFilesPanelDispatch;
    videoMediaFilesActionDispatch: MediaFilesActionDispatch;
    mediaPlaylistsSnapshot: MediaPlaylistsStoreSnapshot;
    mediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
    mediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
    pvrSnapshot: PvrStoreSnapshot;
    pvrDispatch: PvrPageDispatch;
    thumbsUpSnapshot: ThumbsUpStoreSnapshot;
    thumbsUpDispatch: ThumbsUpDispatch;
    videoMediaPlaylistsSnapshot: MediaPlaylistsStoreSnapshot;
    videoMediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
    videoMediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
    videoLibrarySnapshot: VideoLibraryStoreSnapshot;
    settingsSnapshot: SettingsStoreSnapshot;
    settingsDispatch: SettingsPanelDispatch;
    addonsSnapshot: AddonsStoreSnapshot;
    addonsDispatch: AddonsPanelDispatch;
    addonDetailDispatch: AddonDetailDispatch;
    videoMovieDetailSnapshot?: VideoMovieDetailStoreSnapshot;
    videoMovieActionDispatch: VideoMovieActionDispatch;
    videoTvSnapshot: VideoTvStoreSnapshot;
    videoEpisodeActionDispatch: VideoEpisodeActionDispatch;
    videoSeasonArtworkDispatch: VideoSeasonArtworkDispatch;
    videoSeasonWriteDispatch: VideoSeasonWriteDispatch;
    renderableVideoRoute: VideoRoute;
  }

  let {
    route,
    metadata,
    i18n,
    packageBasePath = '',
    packageSearch = '',
    parityPlaceholder = null,
    homeContext,
    connectionSnapshot,
    localeSnapshot,
    localeDispatch,
    playerSnapshot,
    playerDispatch,
    remoteSnapshot,
    remoteInputDispatch,
    localPlayerSnapshot,
    localPlaylistSnapshot,
    localPlaylistDispatch,
    localPlaylistActions,
    queueSnapshot,
    queueDispatch,
    musicLibrarySnapshot,
    musicBrowseSnapshot,
    musicBrowseDispatch,
    musicActionDispatch,
    mediaSearchSnapshot,
    mediaSearchDispatch,
    mediaSearchActionDispatch,
    mediaFilesSnapshot,
    mediaFilesDispatch,
    mediaFilesActionDispatch,
    videoMediaFilesSnapshot,
    videoMediaFilesDispatch,
    videoMediaFilesActionDispatch,
    mediaPlaylistsSnapshot,
    mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch,
    pvrSnapshot,
    pvrDispatch,
    thumbsUpSnapshot,
    thumbsUpDispatch,
    videoLibrarySnapshot,
    settingsSnapshot,
    settingsDispatch,
    addonsSnapshot,
    addonsDispatch,
    addonDetailDispatch,
    videoMovieDetailSnapshot,
    videoTvSnapshot,
    videoEpisodeActionDispatch,
    videoSeasonArtworkDispatch,
    videoSeasonWriteDispatch,
    renderableVideoRoute
  }: Props = $props();

  const routeBuildOptions = $derived(
    createKodiPackageRouteBuildOptions({ packageBasePath, packageSearch })
  );
  const currentLibraryRoute = $derived(isLibraryRoute(route) ? route : null);
  const routeSurfaceGroup = $derived(resolveRouteSurfaceGroup(route));
  const isVideoBrowserRoute = $derived(route.kind === 'browserItem' && route.media === 'video');
  let lastRouteSearchKey = $state('');
  let lastAddonExecuteKey = $state('');

  function resolveRouteSurfaceGroup(route: PrimaryRoute): RouteSurfaceGroup {
    if (isLibraryRoute(route)) return 'library';
    if (isBrowserRoute(route)) return 'browser';
    if (isPlaylistRoute(route)) return 'playlist';
    if (isAddonsRoute(route)) return 'addons';
    if (isSettingsRoute(route)) return 'settings';
    if (isHelpRoute(route)) return 'help';
    if (isSearchRoute(route)) return 'search';
    if (isLabRoute(route)) return 'lab';
    if (isPvrRoute(route)) return 'pvr';
    return route.kind === 'thumbsup' ? 'thumbs' : 'framed';
  }

  $effect(() => {
    if (route.kind !== 'searchMedia') {
      return;
    }

    const query = route.query.trim();
    const key = `${route.media}:${query}`;

    if (!query || key === lastRouteSearchKey) {
      return;
    }

    lastRouteSearchKey = key;
    void mediaSearchDispatch.search({
      query,
      scope: mediaSearchScopeForRoute(route.media)
    });
  });

  function mediaSearchScopeForRoute(media: string): MediaSearchScope {
    return [
      'all',
      'music',
      'video',
      'artist',
      'album',
      'song',
      'genre',
      'movie',
      'tvshow',
      'musicvideo'
    ].includes(media)
      ? (media as MediaSearchScope)
      : 'all';
  }

  $effect(() => {
    if (route.kind !== 'addonExecute') {
      return;
    }

    const addonid = route.addonid.trim();
    if (!addonid || addonid === lastAddonExecuteKey) {
      return;
    }

    lastAddonExecuteKey = addonid;
    void addonsDispatch.executeAddon?.(addonid);
  });
</script>

<div
  data-app-page-surface
  data-app-page-route={metadata.routeKind}
  data-app-page-surface-kind={metadata.surfaceKind}
  data-app-page-status={metadata.status}
>
  {#if currentLibraryRoute}
    {#if isTvDetailRoute(route)}
      {#if route.kind === 'tvshowDetail'}
        <LazyRouteComponent
          route={videoTvShowDetailShellRoute({
            snapshot: videoTvSnapshot,
            route: renderableVideoRoute,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if route.kind === 'tvshowSeasonDetail'}
        <LazyRouteComponent
          route={videoSeasonDetailShellRoute({
            snapshot: videoTvSnapshot,
            route: renderableVideoRoute,
            artworkDispatch: videoSeasonArtworkDispatch,
            writeDispatch: videoSeasonWriteDispatch,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {:else}
        <LazyRouteComponent
          route={videoEpisodeDetailShellRoute({
            snapshot: videoTvSnapshot,
            route: renderableVideoRoute,
            actionDispatch: videoEpisodeActionDispatch,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {/if}
    {:else}
      <LazyRouteComponent
        route={libraryPageRoute({
          route: currentLibraryRoute,
          musicLibrarySnapshot,
          videoLibrarySnapshot,
          playerDispatch,
          queueDispatch,
          localPlaylistSnapshot,
          localPlaylistDispatch,
          thumbsUpDispatch,
          videoMovieDetailSnapshot,
          videoTvSnapshot,
          buildOptions: routeBuildOptions
        })}
      />
    {/if}
  {:else if routeSurfaceGroup === 'browser'}
    <LazyRouteComponent
      route={browserFilesRoute({
        route,
        snapshot: isVideoBrowserRoute ? videoMediaFilesSnapshot : mediaFilesSnapshot,
        musicSnapshot: mediaFilesSnapshot,
        videoSnapshot: videoMediaFilesSnapshot,
        dispatch: isVideoBrowserRoute ? videoMediaFilesDispatch : mediaFilesDispatch,
        musicDispatch: mediaFilesDispatch,
        videoDispatch: videoMediaFilesDispatch,
        actionDispatch: isVideoBrowserRoute
          ? videoMediaFilesActionDispatch
          : mediaFilesActionDispatch,
        buildOptions: routeBuildOptions
      })}
    />
  {:else if routeSurfaceGroup === 'playlist'}
    {#if route.kind === 'currentPlaylist'}
      <section class="classic-current-playlist-page" aria-labelledby="current-playlist-title">
        <h2 id="current-playlist-title">Current playlist</h2>
        <QueuePanel snapshot={queueSnapshot} dispatch={queueDispatch} {i18n} />
      </section>
    {:else}
      <LazyRouteComponent
        route={playlistsPageRoute({
          snapshot: mediaPlaylistsSnapshot,
          dispatch: mediaPlaylistsDispatch,
          actionDispatch: mediaPlaylistsActionDispatch,
          localPlaylistSnapshot,
          localPlaylistDispatch,
          localPlaylistActions,
          route,
          i18n,
          buildOptions: routeBuildOptions
        })}
      />
    {/if}
  {:else if routeSurfaceGroup === 'addons'}
    <LazyRouteComponent
      route={addonsPageRoute({
        route,
        snapshot: addonsSnapshot,
        dispatch: addonsDispatch,
        addonDetailDispatch,
        i18n,
        packageBasePath,
        buildOptions: routeBuildOptions
      })}
    />
  {:else if routeSurfaceGroup === 'settings'}
    <LazyRouteComponent
      route={settingsPageRoute({
        route,
        snapshot: settingsSnapshot,
        dispatch: settingsDispatch,
        addonsSnapshot,
        addonsDispatch,
        i18n,
        buildOptions: routeBuildOptions
      })}
    />
  {:else if routeSurfaceGroup === 'help'}
    <LazyRouteComponent
      route={helpPageRoute({
        route,
        buildOptions: routeBuildOptions,
        connectionSnapshot
      })}
    />
  {:else if routeSurfaceGroup === 'search'}
    <LazyRouteComponent
      route={mediaSearchPanelRoute({
        snapshot: mediaSearchSnapshot,
        dispatch: mediaSearchDispatch,
        actionDispatch: mediaSearchActionDispatch,
        i18n,
        buildOptions: routeBuildOptions
      })}
    />
  {:else if routeSurfaceGroup === 'lab'}
    {#if route.kind === 'lab'}
      <LazyRouteComponent route={labLandingPageRoute({ buildOptions: routeBuildOptions })} />
    {:else if route.kind === 'labApiBrowser' || route.kind === 'labApiBrowserMethod'}
      <LazyRouteComponent
        route={labApiBrowserPageRoute({
          i18n,
          initialMethod: route.kind === 'labApiBrowserMethod' ? route.method : ''
        })}
      />
    {:else if route.kind === 'labScreenshot'}
      <LazyRouteComponent
        route={labScreenshotPageRoute({
          dispatch: remoteInputDispatch,
          buildOptions: routeBuildOptions
        })}
      />
    {:else if route.kind === 'labIconBrowser'}
      <LazyRouteComponent route={labIconBrowserPageRoute()} />
    {/if}
  {:else if routeSurfaceGroup === 'pvr'}
    <LazyRouteComponent
      route={pvrPageRoute({
        route,
        snapshot: pvrSnapshot,
        dispatch: pvrDispatch,
        playerDispatch,
        buildOptions: routeBuildOptions
      })}
    />
  {:else if routeSurfaceGroup === 'thumbs'}
    <LazyRouteComponent
      route={thumbsUpPageRoute({
        snapshot: thumbsUpSnapshot,
        dispatch: thumbsUpDispatch,
        playerDispatch,
        queueDispatch,
        buildOptions: routeBuildOptions
      })}
    />
  {:else}
    <PageFrame
      title={metadata.heading}
      eyebrow={metadata.statusLabel}
      description={metadata.description}
      deferredMessage={metadata.deferredMessage}
    >
      {#if route.kind !== 'home'}
        <div class="page-actions">
          <LocaleToggle locale={localeSnapshot.locale} {i18n} dispatch={localeDispatch} />
        </div>
      {/if}
      {#if route.kind === 'home'}
        <div class="page-actions">
          <LocaleToggle locale={localeSnapshot.locale} {i18n} dispatch={localeDispatch} />
        </div>
        <section class="mission surface" aria-labelledby="primary-home-status-title">
          <p class="section-kicker">Runtime surface</p>
          <h3 id="primary-home-status-title">{homeContext.hostLabel}</h3>
          <p>{homeContext.description}</p>
          {#if homeContext.storageWarningMessage}
            <p>{homeContext.storageWarningMessage}</p>
          {/if}
        </section>
        <section class="status-grid" aria-label={homeContext.statusGridAria}>
          <StatusCard {...homeContext.connection} />
          <StatusCard {...homeContext.themeContract} />
        </section>
        <AppHomeMediaPanels
          {musicLibrarySnapshot}
          {musicBrowseSnapshot}
          {musicBrowseDispatch}
          {musicActionDispatch}
          {mediaSearchSnapshot}
          {mediaSearchDispatch}
          {mediaSearchActionDispatch}
          {mediaFilesSnapshot}
          {mediaFilesDispatch}
          {mediaFilesActionDispatch}
          {mediaPlaylistsSnapshot}
          {mediaPlaylistsDispatch}
          {mediaPlaylistsActionDispatch}
          {playerSnapshot}
          {playerDispatch}
          {localPlayerSnapshot}
          {queueSnapshot}
          {queueDispatch}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'music'}
        <LazyRouteComponent
          route={musicLibraryPanelRoute({
            snapshot: musicLibrarySnapshot,
            i18n
          })}
        />
      {:else if isLibraryRoute(route) && (route.kind === 'movies' || route.kind === 'moviesRecent')}
        <LazyRouteComponent route={videoMoviesPanelRoute({ snapshot: videoLibrarySnapshot })} />
      {:else if isLibraryRoute(route) && (route.kind === 'tvshows' || route.kind === 'tvshowsRecent')}
        <LazyRouteComponent route={videoTvShowsPanelRoute({ snapshot: videoLibrarySnapshot })} />
      {:else if route.kind === 'browser'}
        <LazyRouteComponent
          route={browserFilesRoute({
            route,
            snapshot: mediaFilesSnapshot,
            dispatch: mediaFilesDispatch,
            actionDispatch: mediaFilesActionDispatch,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if route.kind === 'browserItem'}
        <LazyRouteComponent
          route={browserFilesRoute({
            route,
            snapshot: mediaFilesSnapshot,
            dispatch: mediaFilesDispatch,
            actionDispatch: mediaFilesActionDispatch,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if route.kind === 'playlists'}
        <LazyRouteComponent
          route={playlistsPageRoute({
            snapshot: mediaPlaylistsSnapshot,
            dispatch: mediaPlaylistsDispatch,
            actionDispatch: mediaPlaylistsActionDispatch,
            localPlaylistSnapshot,
            localPlaylistDispatch,
            localPlaylistActions,
            route,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if route.kind === 'playlistDetail'}
        <LazyRouteComponent
          route={playlistsPageRoute({
            snapshot: mediaPlaylistsSnapshot,
            dispatch: mediaPlaylistsDispatch,
            actionDispatch: mediaPlaylistsActionDispatch,
            localPlaylistSnapshot,
            localPlaylistDispatch,
            localPlaylistActions,
            route,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if isAddonsRoute(route)}
        <LazyRouteComponent
          route={addonsPageRoute({
            route,
            snapshot: addonsSnapshot,
            dispatch: addonsDispatch,
            addonDetailDispatch,
            i18n,
            packageBasePath,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if route.kind === 'addonExecute'}
        <DeferredPrimaryPage {route} {metadata} />
      {:else if isSettingsRoute(route)}
        <LazyRouteComponent
          route={settingsPageRoute({
            route,
            snapshot: settingsSnapshot,
            dispatch: settingsDispatch,
            addonsSnapshot,
            addonsDispatch,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if isHelpRoute(route)}
        <LazyRouteComponent
          route={helpPageRoute({
            route,
            buildOptions: routeBuildOptions,
            connectionSnapshot
          })}
        />
      {:else if route.kind === 'remote'}
        <section class="remote-app-page" aria-labelledby="remote-app-page-title">
          <div class="remote-app-page__header">
            <p class="section-kicker">Remote control</p>
            <h2 id="remote-app-page-title">Remote control</h2>
            <p>
              Directional pad and playback commands are wired to the existing Kodi remote input
              panel.
            </p>
          </div>
          <RemoteInputPanel
            {remoteSnapshot}
            {remoteInputDispatch}
            {playerSnapshot}
            {playerDispatch}
            {i18n}
          />
        </section>
      {:else if isSearchRoute(route)}
        <LazyRouteComponent
          route={mediaSearchPanelRoute({
            snapshot: mediaSearchSnapshot,
            dispatch: mediaSearchDispatch,
            actionDispatch: mediaSearchActionDispatch,
            i18n,
            buildOptions: routeBuildOptions
          })}
        />
      {:else if parityPlaceholder}
        <ParityPlaceholder placeholder={parityPlaceholder} {packageBasePath} {i18n} />
      {/if}
    </PageFrame>
  {/if}
</div>

<style>
  .page-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    justify-content: flex-end;
  }

  .mission {
    display: grid;
    gap: var(--space-sm);
    padding: clamp(var(--space-lg), 4vw, var(--space-2xl));
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-accent) 16%, transparent),
        transparent 52%
      ),
      var(--color-surface);
  }

  .mission p,
  .mission h3,
  .section-kicker {
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

  .mission p:not(.section-kicker) {
    max-width: 48rem;
    color: var(--color-text-muted);
    font-size: 1rem;
    line-height: 1.7;
  }

  .remote-app-page {
    display: grid;
    gap: var(--space-md);
  }

  .remote-app-page__header {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .remote-app-page__header h2,
  .remote-app-page__header p {
    margin: 0;
  }

  .remote-app-page__header p:not(.section-kicker) {
    max-width: 48rem;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }
</style>
