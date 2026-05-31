<script lang="ts">
  import type { AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import AddonsPage from './AddonsPage.svelte';
  import BrowserFilesPage from './BrowserFilesPage.svelte';
  import LibraryPage from './LibraryPage.svelte';
  import LabApiBrowserPage from '$components/LabApiBrowserPage.svelte';
  import LabIconBrowserPage from '$components/LabIconBrowserPage.svelte';
  import LabLandingPage from '$components/LabLandingPage.svelte';
  import LabScreenshotPage from '$components/LabScreenshotPage.svelte';
  import DeferredPrimaryPage from './DeferredPrimaryPage.svelte';
  import HelpPage from './HelpPage.svelte';
  import LocaleToggle, { type LocaleToggleDispatch } from '$components/LocaleToggle.svelte';
  import MediaFilesPanel, {
    type MediaFilesActionDispatch,
    type MediaFilesPanelDispatch
  } from '$components/MediaFilesPanel.svelte';
  import MediaPlaylistsPanel, {
    type MediaPlaylistsActionDispatch,
    type MediaPlaylistsPanelDispatch
  } from '$components/MediaPlaylistsPanel.svelte';
  import MediaSearchPanel, {
    type MediaSearchActionDispatch,
    type MediaSearchPanelDispatch
  } from '$components/MediaSearchPanel.svelte';
  import type { MediaSearchScope } from '$lib/stores/mediaSearch.svelte';
  import MusicBrowsePanel, {
    type MusicBrowseActionDispatch,
    type MusicBrowsePanelDispatch
  } from '$components/MusicBrowsePanel.svelte';
  import MusicLibraryPanel from '$components/MusicLibraryPanel.svelte';
  import NowPlayingPanel from '$components/NowPlayingPanel.svelte';
  import ParityPlaceholder from '$components/ParityPlaceholder.svelte';
  import PlaylistsPage, { type LocalPlaylistPageActions } from './PlaylistsPage.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import PvrPage, { type PvrPageDispatch } from './PvrPage.svelte';
  import QueuePanel, { type QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import RemoteInputPanel, {
    type RemoteInputPanelRemoteDispatch
  } from '$components/RemoteInputPanel.svelte';
  import SettingsPage from './SettingsPage.svelte';
  import type { SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import ThumbsUpPage from './ThumbsUpPage.svelte';
  import VideoEpisodeDetailShell, {
    type VideoEpisodeActionDispatch
  } from '$components/VideoEpisodeDetailShell.svelte';
  import type { VideoMovieActionDispatch } from '$components/VideoMovieDetailShell.svelte';
  import VideoMoviesPanel from '$components/VideoMoviesPanel.svelte';
  import VideoSeasonDetailShell, {
    type VideoSeasonArtworkDispatch,
    type VideoSeasonWriteDispatch
  } from '$components/VideoSeasonDetailShell.svelte';
  import VideoTvShowDetailShell from '$components/VideoTvShowDetailShell.svelte';
  import VideoTvShowsPanel from '$components/VideoTvShowsPanel.svelte';
  import PageFrame from '$lib/app-shell/PageFrame.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { ParityRoutePlaceholder } from '$lib/app/appRouter';
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

  const routeBuildOptions = $derived({
    packageBasePath,
    packageSearch,
    routeMode: 'path'
  } as const);
  const isChorus2LibraryRoute = $derived(
    route.kind === 'home' ||
      route.kind === 'music' ||
      route.kind === 'musicTop' ||
      route.kind === 'musicArtists' ||
      route.kind === 'musicAlbums' ||
      route.kind === 'musicGenres' ||
      route.kind === 'musicVideos' ||
      route.kind === 'musicVideoDetail' ||
      route.kind === 'musicAlbumDetail' ||
      route.kind === 'musicArtistDetail' ||
      route.kind === 'musicGenreDetail' ||
      route.kind === 'movies' ||
      route.kind === 'moviesRecent' ||
      route.kind === 'movieDetail' ||
      route.kind === 'tvshows' ||
      route.kind === 'tvshowsRecent' ||
      route.kind === 'tvshowDetail' ||
      route.kind === 'tvshowSeasonDetail' ||
      route.kind === 'tvshowEpisodeDetail'
  );
  const isChorus2TvDetailRoute = $derived(
    route.kind === 'tvshowDetail' ||
      route.kind === 'tvshowSeasonDetail' ||
      route.kind === 'tvshowEpisodeDetail'
  );
  const isChorus2BrowserRoute = $derived(route.kind === 'browser' || route.kind === 'browserItem');
  const isVideoBrowserRoute = $derived(route.kind === 'browserItem' && route.media === 'video');
  const isChorus2PlaylistRoute = $derived(
    route.kind === 'currentPlaylist' ||
      route.kind === 'playlists' ||
      route.kind === 'playlistDetail'
  );
  const isChorus2AddonsRoute = $derived(
    route.kind === 'addonsAll' ||
      route.kind === 'addonsVideo' ||
      route.kind === 'addonsAudio' ||
      route.kind === 'addonsExecutable' ||
      route.kind === 'addonExecute' ||
      route.kind === 'addonDetail'
  );
  const isChorus2SettingsRoute = $derived(
    route.kind === 'settingsWeb' ||
      route.kind === 'settingsKodi' ||
      route.kind === 'settingsKodiSection' ||
      route.kind === 'settingsAddons' ||
      route.kind === 'settingsNav' ||
      route.kind === 'settingsSearch'
  );
  const isChorus2HelpRoute = $derived(
    route.kind === 'help' || route.kind === 'helpOverview' || route.kind === 'helpPage'
  );
  const isChorus2SearchRoute = $derived(route.kind === 'search' || route.kind === 'searchMedia');
  const isChorus2LabRoute = $derived(
    route.kind === 'lab' ||
      route.kind === 'labApiBrowser' ||
      route.kind === 'labApiBrowserMethod' ||
      route.kind === 'labScreenshot' ||
      route.kind === 'labIconBrowser'
  );
  const isChorus2PvrRoute = $derived(
    route.kind === 'pvrTv' ||
      route.kind === 'pvrEpg' ||
      route.kind === 'pvrTvChannel' ||
      route.kind === 'pvrRadio' ||
      route.kind === 'pvrRadioChannel' ||
      route.kind === 'pvrRecordings'
  );
  const isChorus2ThumbsRoute = $derived(route.kind === 'thumbsup');
  let lastRouteSearchKey = $state('');
  let lastAddonExecuteKey = $state('');

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
  {#if isChorus2LibraryRoute}
    {#if isChorus2TvDetailRoute}
      {#if route.kind === 'tvshowDetail'}
        <VideoTvShowDetailShell
          snapshot={videoTvSnapshot}
          route={renderableVideoRoute}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'tvshowSeasonDetail'}
        <VideoSeasonDetailShell
          snapshot={videoTvSnapshot}
          route={renderableVideoRoute}
          artworkDispatch={videoSeasonArtworkDispatch}
          writeDispatch={videoSeasonWriteDispatch}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {:else}
        <VideoEpisodeDetailShell
          snapshot={videoTvSnapshot}
          route={renderableVideoRoute}
          actionDispatch={videoEpisodeActionDispatch}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {/if}
    {:else}
      <LibraryPage
        {route}
        {musicLibrarySnapshot}
        {videoLibrarySnapshot}
        {playerDispatch}
        {queueDispatch}
        {localPlaylistSnapshot}
        {localPlaylistDispatch}
        {thumbsUpDispatch}
        {videoMovieDetailSnapshot}
        buildOptions={routeBuildOptions}
      />
    {/if}
  {:else if isChorus2BrowserRoute}
    <BrowserFilesPage
      {route}
      snapshot={isVideoBrowserRoute ? videoMediaFilesSnapshot : mediaFilesSnapshot}
      musicSnapshot={mediaFilesSnapshot}
      videoSnapshot={videoMediaFilesSnapshot}
      dispatch={isVideoBrowserRoute ? videoMediaFilesDispatch : mediaFilesDispatch}
      musicDispatch={mediaFilesDispatch}
      videoDispatch={videoMediaFilesDispatch}
      actionDispatch={isVideoBrowserRoute
        ? videoMediaFilesActionDispatch
        : mediaFilesActionDispatch}
      buildOptions={routeBuildOptions}
    />
  {:else if isChorus2PlaylistRoute}
    {#if route.kind === 'currentPlaylist'}
      <section class="classic-current-playlist-page" aria-labelledby="current-playlist-title">
        <h2 id="current-playlist-title">Current playlist</h2>
        <QueuePanel snapshot={queueSnapshot} dispatch={queueDispatch} {i18n} />
      </section>
    {:else}
      <PlaylistsPage
        snapshot={mediaPlaylistsSnapshot}
        dispatch={mediaPlaylistsDispatch}
        actionDispatch={mediaPlaylistsActionDispatch}
        {localPlaylistSnapshot}
        {localPlaylistDispatch}
        {localPlaylistActions}
        {route}
        {i18n}
        buildOptions={routeBuildOptions}
      />
    {/if}
  {:else if isChorus2AddonsRoute}
    <AddonsPage
      {route}
      snapshot={addonsSnapshot}
      dispatch={addonsDispatch}
      {addonDetailDispatch}
      {i18n}
      {packageBasePath}
      buildOptions={routeBuildOptions}
    />
  {:else if isChorus2SettingsRoute}
    <SettingsPage
      {route}
      snapshot={settingsSnapshot}
      dispatch={settingsDispatch}
      {addonsSnapshot}
      {addonsDispatch}
      {i18n}
      buildOptions={routeBuildOptions}
    />
  {:else if isChorus2HelpRoute}
    <HelpPage {route} buildOptions={routeBuildOptions} {connectionSnapshot} />
  {:else if isChorus2SearchRoute}
    <MediaSearchPanel
      snapshot={mediaSearchSnapshot}
      dispatch={mediaSearchDispatch}
      actionDispatch={mediaSearchActionDispatch}
      {i18n}
      buildOptions={routeBuildOptions}
    />
  {:else if isChorus2LabRoute}
    {#if route.kind === 'lab'}
      <LabLandingPage buildOptions={routeBuildOptions} />
    {:else if route.kind === 'labApiBrowser' || route.kind === 'labApiBrowserMethod'}
      <LabApiBrowserPage
        {i18n}
        initialMethod={route.kind === 'labApiBrowserMethod' ? route.method : ''}
      />
    {:else if route.kind === 'labScreenshot'}
      <LabScreenshotPage dispatch={remoteInputDispatch} buildOptions={routeBuildOptions} />
    {:else if route.kind === 'labIconBrowser'}
      <LabIconBrowserPage />
    {/if}
  {:else if isChorus2PvrRoute}
    <PvrPage
      {route}
      snapshot={pvrSnapshot}
      dispatch={pvrDispatch}
      {playerDispatch}
      buildOptions={routeBuildOptions}
    />
  {:else if isChorus2ThumbsRoute}
    <ThumbsUpPage
      snapshot={thumbsUpSnapshot}
      dispatch={thumbsUpDispatch}
      {playerDispatch}
      {queueDispatch}
      buildOptions={routeBuildOptions}
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
        <MusicLibraryPanel snapshot={musicLibrarySnapshot} {i18n} />
        <MusicBrowsePanel
          librarySnapshot={musicLibrarySnapshot}
          browseSnapshot={musicBrowseSnapshot}
          dispatch={musicBrowseDispatch}
          actionDispatch={musicActionDispatch}
          {i18n}
        />
        <MediaSearchPanel
          snapshot={mediaSearchSnapshot}
          dispatch={mediaSearchDispatch}
          actionDispatch={mediaSearchActionDispatch}
          {i18n}
          buildOptions={routeBuildOptions}
        />
        <MediaFilesPanel
          snapshot={mediaFilesSnapshot}
          dispatch={mediaFilesDispatch}
          actionDispatch={mediaFilesActionDispatch}
          {i18n}
        />
        <MediaPlaylistsPanel
          snapshot={mediaPlaylistsSnapshot}
          dispatch={mediaPlaylistsDispatch}
          actionDispatch={mediaPlaylistsActionDispatch}
          {i18n}
        />
        <NowPlayingPanel
          snapshot={playerSnapshot}
          dispatch={playerDispatch}
          {localPlayerSnapshot}
          {i18n}
        />
        <QueuePanel snapshot={queueSnapshot} dispatch={queueDispatch} {i18n} />
      {:else if route.kind === 'music'}
        <MusicLibraryPanel snapshot={musicLibrarySnapshot} {i18n} />
      {:else if route.kind === 'movies' || route.kind === 'moviesRecent'}
        <VideoMoviesPanel snapshot={videoLibrarySnapshot} />
      {:else if route.kind === 'tvshows' || route.kind === 'tvshowsRecent'}
        <VideoTvShowsPanel snapshot={videoLibrarySnapshot} />
      {:else if route.kind === 'browser'}
        <BrowserFilesPage
          {route}
          snapshot={mediaFilesSnapshot}
          dispatch={mediaFilesDispatch}
          actionDispatch={mediaFilesActionDispatch}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'browserItem'}
        <BrowserFilesPage
          {route}
          snapshot={mediaFilesSnapshot}
          dispatch={mediaFilesDispatch}
          actionDispatch={mediaFilesActionDispatch}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'playlists'}
        <PlaylistsPage
          snapshot={mediaPlaylistsSnapshot}
          dispatch={mediaPlaylistsDispatch}
          actionDispatch={mediaPlaylistsActionDispatch}
          {localPlaylistSnapshot}
          {localPlaylistDispatch}
          {localPlaylistActions}
          {route}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'playlistDetail'}
        <PlaylistsPage
          snapshot={mediaPlaylistsSnapshot}
          dispatch={mediaPlaylistsDispatch}
          actionDispatch={mediaPlaylistsActionDispatch}
          {localPlaylistSnapshot}
          {localPlaylistDispatch}
          {localPlaylistActions}
          {route}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'addonsAll' || route.kind === 'addonsVideo' || route.kind === 'addonsAudio' || route.kind === 'addonsExecutable' || route.kind === 'addonDetail'}
        <AddonsPage
          {route}
          snapshot={addonsSnapshot}
          dispatch={addonsDispatch}
          {addonDetailDispatch}
          {i18n}
          {packageBasePath}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'addonExecute'}
        <DeferredPrimaryPage {route} {metadata} />
      {:else if route.kind === 'settingsWeb' || route.kind === 'settingsKodi' || route.kind === 'settingsKodiSection' || route.kind === 'settingsAddons' || route.kind === 'settingsNav' || route.kind === 'settingsSearch'}
        <SettingsPage
          {route}
          snapshot={settingsSnapshot}
          dispatch={settingsDispatch}
          {addonsSnapshot}
          {addonsDispatch}
          {i18n}
          buildOptions={routeBuildOptions}
        />
      {:else if route.kind === 'help' || route.kind === 'helpOverview' || route.kind === 'helpPage'}
        <HelpPage {route} buildOptions={routeBuildOptions} {connectionSnapshot} />
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
      {:else if route.kind === 'search' || route.kind === 'searchMedia'}
        <MediaSearchPanel
          snapshot={mediaSearchSnapshot}
          dispatch={mediaSearchDispatch}
          actionDispatch={mediaSearchActionDispatch}
          {i18n}
          buildOptions={routeBuildOptions}
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
