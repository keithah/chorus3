<script lang="ts">
  import type { AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import AddonsPage from './AddonsPage.svelte';
  import BrowserFilesPage from './BrowserFilesPage.svelte';
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
  import MusicBrowsePanel, {
    type MusicBrowseActionDispatch,
    type MusicBrowsePanelDispatch
  } from '$components/MusicBrowsePanel.svelte';
  import MusicLibraryPanel from '$components/MusicLibraryPanel.svelte';
  import NowPlayingPanel from '$components/NowPlayingPanel.svelte';
  import ParityPlaceholder from '$components/ParityPlaceholder.svelte';
  import PlaylistsPage from './PlaylistsPage.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import QueuePanel, { type QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import RemoteInputPanel, {
    type RemoteInputPanelRemoteDispatch
  } from '$components/RemoteInputPanel.svelte';
  import SettingsPage from './SettingsPage.svelte';
  import type { SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import VideoEpisodeDetailShell, {
    type VideoEpisodeActionDispatch
  } from '$components/VideoEpisodeDetailShell.svelte';
  import VideoMovieDetailShell, {
    type VideoMovieActionDispatch
  } from '$components/VideoMovieDetailShell.svelte';
  import VideoMoviesPanel from '$components/VideoMoviesPanel.svelte';
  import VideoRecentPanel from '$components/VideoRecentPanel.svelte';
  import VideoSeasonDetailShell, {
    type VideoSeasonArtworkDispatch,
    type VideoSeasonWriteDispatch
  } from '$components/VideoSeasonDetailShell.svelte';
  import VideoTvShowDetailShell from '$components/VideoTvShowDetailShell.svelte';
  import VideoTvShowsPanel from '$components/VideoTvShowsPanel.svelte';
  import PageFrame from '$lib/app-shell/PageFrame.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { Chorus2RoutePlaceholder } from '$lib/app/appRouter';
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
    QueueStoreSnapshot,
    RemoteInputDispatchSnapshot,
    SettingsStoreSnapshot,
    LocaleStoreSnapshot
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
    chorus2Placeholder?: Chorus2RoutePlaceholder | null;
    homeContext: HomeSurfaceContext;
    localeSnapshot: LocaleStoreSnapshot;
    localeDispatch: LocaleToggleDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    remoteSnapshot: RemoteInputDispatchSnapshot;
    remoteInputDispatch: RemoteInputPanelRemoteDispatch;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    localPlaylistSnapshot: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch: LocalPlaylistDispatch;
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
    mediaPlaylistsSnapshot: MediaPlaylistsStoreSnapshot;
    mediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
    mediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
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
    chorus2Placeholder = null,
    homeContext,
    localeSnapshot,
    localeDispatch,
    playerSnapshot,
    playerDispatch,
    remoteSnapshot,
    remoteInputDispatch,
    localPlayerSnapshot,
    localPlaylistSnapshot,
    localPlaylistDispatch,
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
    mediaPlaylistsSnapshot,
    mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch,
    videoMediaPlaylistsSnapshot,
    videoMediaPlaylistsDispatch,
    videoMediaPlaylistsActionDispatch,
    videoLibrarySnapshot,
    settingsSnapshot,
    settingsDispatch,
    addonsSnapshot,
    addonsDispatch,
    addonDetailDispatch,
    videoMovieDetailSnapshot,
    videoMovieActionDispatch,
    videoTvSnapshot,
    videoEpisodeActionDispatch,
    videoSeasonArtworkDispatch,
    videoSeasonWriteDispatch,
    renderableVideoRoute
  }: Props = $props();
</script>

<div
  data-app-page-surface
  data-app-page-route={metadata.routeKind}
  data-app-page-surface-kind={metadata.surfaceKind}
  data-app-page-status={metadata.status}
>
  <PageFrame
    title={metadata.heading}
    eyebrow={metadata.statusLabel}
    description={metadata.description}
    deferredMessage={metadata.deferredMessage}
  >
    {#if route.kind !== 'home'}
      <div class="hero-actions">
        <LocaleToggle locale={localeSnapshot.locale} {i18n} dispatch={localeDispatch} />
        <ThemeToggle {i18n} />
      </div>
    {/if}
    {#if route.kind === 'home'}
      <div class="hero-actions">
        <LocaleToggle locale={localeSnapshot.locale} {i18n} dispatch={localeDispatch} />
        <ThemeToggle {i18n} />
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
    {:else if route.kind === 'movies' || route.kind === 'moviesRecent'}
      <VideoMoviesPanel snapshot={videoLibrarySnapshot} />
      <VideoRecentPanel snapshot={videoLibrarySnapshot} {i18n} />
      <MediaPlaylistsPanel
        snapshot={videoMediaPlaylistsSnapshot}
        dispatch={videoMediaPlaylistsDispatch}
        actionDispatch={videoMediaPlaylistsActionDispatch}
        {i18n}
      />
    {:else if route.kind === 'movieDetail'}
      <VideoMovieDetailShell
        snapshot={videoLibrarySnapshot}
        route={renderableVideoRoute}
        detailSnapshot={videoMovieDetailSnapshot}
        actionDispatch={videoMovieActionDispatch}
        {i18n}
      />
    {:else if route.kind === 'tvshows' || route.kind === 'tvshowsRecent'}
      <VideoTvShowsPanel snapshot={videoLibrarySnapshot} />
      <VideoRecentPanel snapshot={videoLibrarySnapshot} {i18n} />
    {:else if route.kind === 'tvshowDetail'}
      <VideoTvShowDetailShell snapshot={videoTvSnapshot} route={renderableVideoRoute} {i18n} />
    {:else if route.kind === 'tvshowSeasonDetail'}
      <VideoSeasonDetailShell
        snapshot={videoTvSnapshot}
        route={renderableVideoRoute}
        artworkDispatch={videoSeasonArtworkDispatch}
        writeDispatch={videoSeasonWriteDispatch}
        {i18n}
      />
    {:else if route.kind === 'tvshowEpisodeDetail'}
      <VideoEpisodeDetailShell
        snapshot={videoTvSnapshot}
        route={renderableVideoRoute}
        actionDispatch={videoEpisodeActionDispatch}
        {i18n}
      />
    {:else if route.kind === 'browser'}
      <BrowserFilesPage
        snapshot={mediaFilesSnapshot}
        dispatch={mediaFilesDispatch}
        actionDispatch={mediaFilesActionDispatch}
        {i18n}
      />
    {:else if route.kind === 'browserItem'}
      <DeferredPrimaryPage {route} {metadata} />
    {:else if route.kind === 'playlists'}
      <PlaylistsPage
        snapshot={mediaPlaylistsSnapshot}
        dispatch={mediaPlaylistsDispatch}
        actionDispatch={mediaPlaylistsActionDispatch}
        {localPlaylistSnapshot}
        {localPlaylistDispatch}
        {route}
        {i18n}
      />
    {:else if route.kind === 'playlistDetail'}
      <PlaylistsPage
        snapshot={mediaPlaylistsSnapshot}
        dispatch={mediaPlaylistsDispatch}
        actionDispatch={mediaPlaylistsActionDispatch}
        {localPlaylistSnapshot}
        {localPlaylistDispatch}
        {route}
        {i18n}
      />
    {:else if route.kind === 'addonsAll' || route.kind === 'addonsVideo' || route.kind === 'addonsAudio' || route.kind === 'addonsExecutable' || route.kind === 'addonDetail'}
      <AddonsPage
        {route}
        snapshot={addonsSnapshot}
        dispatch={addonsDispatch}
        {addonDetailDispatch}
        {i18n}
        {packageBasePath}
      />
    {:else if route.kind === 'addonExecute'}
      <DeferredPrimaryPage {route} {metadata} />
    {:else if route.kind === 'settingsWeb' || route.kind === 'settingsKodi' || route.kind === 'settingsKodiSection' || route.kind === 'settingsAddons' || route.kind === 'settingsNav' || route.kind === 'settingsSearch'}
      <SettingsPage {route} snapshot={settingsSnapshot} dispatch={settingsDispatch} {i18n} />
    {:else if route.kind === 'help' || route.kind === 'helpOverview' || route.kind === 'helpPage'}
      <HelpPage {route} />
    {:else if route.kind === 'remote'}
      <section class="remote-app-page" aria-labelledby="remote-app-page-title">
        <div class="remote-app-page__header">
          <p class="section-kicker">Remote control</p>
          <h2 id="remote-app-page-title">Remote control</h2>
          <p>
            Directional pad and playback commands are wired to the existing Kodi remote input panel.
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
    {:else if chorus2Placeholder}
      <ParityPlaceholder placeholder={chorus2Placeholder} {packageBasePath} {i18n} />
    {/if}
  </PageFrame>
</div>

<style>
  .hero-actions {
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
