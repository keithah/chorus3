<script lang="ts">
  import AppShell from '$components/AppShell.svelte';
  import HostSettings from '$components/HostSettings.svelte';
  import HostSwitcher from '$components/HostSwitcher.svelte';
  import LocalMediaRuntime from '$components/LocalMediaRuntime.svelte';
  import MediaFilesPanel, {
    type MediaFilesActionDispatch,
    type MediaFilesActionItem,
    type MediaFilesPanelDispatch
  } from '$components/MediaFilesPanel.svelte';
  import MediaPlaylistsPanel, {
    type MediaPlaylistsActionDispatch,
    type MediaPlaylistsActionItem,
    type MediaPlaylistsPanelDispatch
  } from '$components/MediaPlaylistsPanel.svelte';
  import MediaSearchPanel, {
    type MediaSearchActionDispatch,
    type MediaSearchActionItem,
    type MediaSearchPanelDispatch
  } from '$components/MediaSearchPanel.svelte';
  import MusicBrowsePanel, {
    type MusicBrowseActionDispatch,
    type MusicBrowsePanelDispatch
  } from '$components/MusicBrowsePanel.svelte';
  import MusicLibraryPanel from '$components/MusicLibraryPanel.svelte';
  import NowPlayingPanel from '$components/NowPlayingPanel.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import QueuePanel, { type QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import VideoMovieDetailShell, {
    type VideoMovieActionDispatch
  } from '$components/VideoMovieDetailShell.svelte';
  import VideoMovieStreamShell, {
    type VideoMovieStreamDispatch
  } from '$components/VideoMovieStreamShell.svelte';
  import VideoMoviesPanel from '$components/VideoMoviesPanel.svelte';
  import VideoTvShowsPanel from '$components/VideoTvShowsPanel.svelte';
  import VideoTvShowDetailShell from '$components/VideoTvShowDetailShell.svelte';
  import VideoSeasonDetailShell, {
    type VideoSeasonArtworkDispatch,
    type VideoSeasonWriteDispatch,
    type VideoSeasonWriteItem,
    type VideoSeasonWriteSummary
  } from '$components/VideoSeasonDetailShell.svelte';
  import VideoEpisodeDetailShell, {
    type VideoEpisodeActionDispatch
  } from '$components/VideoEpisodeDetailShell.svelte';
  import {
    configStore,
    connectionStore,
    localPlayerStore,
    mediaFilesStore,
    mediaPlaylistsStore,
    mediaSearchStore,
    musicBrowseStore,
    musicLibraryStore,
    playerDispatch as defaultPlayerDispatch,
    playerStore,
    queueDispatch as defaultQueueDispatch,
    queueStore,
    type ConnectionStoreSnapshot,
    type LocalPlayerStoreSnapshot,
    type MediaFilesStoreSnapshot,
    type MediaPlaylistsStoreSnapshot,
    type MediaSearchStoreSnapshot,
    type MusicBrowseStoreSnapshot,
    type MusicLibraryStoreSnapshot,
    type PlayerStoreSnapshot,
    type QueueStoreSnapshot
  } from '$lib/stores';
  import {
    videoLibraryStore,
    type VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import {
    videoMovieDetailStore,
    type VideoMovieDetailStoreSnapshot
  } from '$lib/stores/videoMovieDetailStore.svelte';
  import { videoTvStore, type VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';
  import {
    videoWriteStore,
    type VideoWriteStoreSnapshot
  } from '$lib/stores/videoWriteStore.svelte';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

  interface VideoNavigationDispatch {
    openMovieGrid: () => Promise<void>;
    openMovieDetail: (movie: { movieid: number }) => Promise<void>;
    openRoute: (route: VideoRoute) => Promise<void>;
  }

  interface Props {
    playerSnapshot?: PlayerStoreSnapshot;
    playerDispatch?: PlayerControlsDispatch;
    localPlayerSnapshot?: LocalPlayerStoreSnapshot;
    queueSnapshot?: QueueStoreSnapshot;
    queueDispatch?: QueuePanelDispatch;
    musicLibrarySnapshot?: MusicLibraryStoreSnapshot;
    musicBrowseSnapshot?: MusicBrowseStoreSnapshot;
    musicBrowseDispatch?: MusicBrowsePanelDispatch;
    musicActionDispatch?: MusicBrowseActionDispatch;
    mediaSearchSnapshot?: MediaSearchStoreSnapshot;
    mediaSearchDispatch?: MediaSearchPanelDispatch;
    mediaSearchActionDispatch?: MediaSearchActionDispatch;
    mediaFilesSnapshot?: MediaFilesStoreSnapshot;
    mediaFilesDispatch?: MediaFilesPanelDispatch;
    mediaFilesActionDispatch?: MediaFilesActionDispatch;
    mediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
    mediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
    mediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
    route?: VideoRoute;
    videoLibrarySnapshot?: VideoLibraryStoreSnapshot;
    videoMovieDetailSnapshot?: VideoMovieDetailStoreSnapshot;
    videoNavigationDispatch?: VideoNavigationDispatch;
    videoMovieActionDispatch?: VideoMovieActionDispatch;
    videoMovieStreamActionDispatch?: VideoMovieStreamDispatch;
    videoTvSnapshot?: VideoTvStoreSnapshot;
    videoEpisodeActionDispatch?: VideoEpisodeActionDispatch;
    videoSeasonArtworkDispatch?: VideoSeasonArtworkDispatch;
    videoSeasonWriteDispatch?: VideoSeasonWriteDispatch;
  }

  const defaultMusicBrowseDispatch: MusicBrowsePanelDispatch = {
    browseArtist: (artist) => musicBrowseStore.browseArtist(artist),
    browseAlbum: (album) => musicBrowseStore.browseAlbum(album),
    browseGenre: (genre) => musicBrowseStore.browseGenre(genre),
    clearSelection: () => musicBrowseStore.clearSelection()
  };

  const defaultMusicActionDispatch: MusicBrowseActionDispatch = {
    playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(item),
    queueMusicItem: (item) => defaultQueueDispatch.queueMusicItem(item)
  };

  const defaultMediaSearchDispatch: MediaSearchPanelDispatch = {
    search: ({ query }) => mediaSearchStore.search(query),
    clear: () => mediaSearchStore.clear()
  };

  const defaultMediaSearchActionDispatch: MediaSearchActionDispatch = {
    playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(toMusicPlaybackItem(item)),
    queueMusicItem: (item) => defaultQueueDispatch.queueMusicItem(toMusicQueueItem(item))
  };

  const defaultMediaFilesDispatch: MediaFilesPanelDispatch = {
    refresh: () => mediaFilesStore.refreshSources(),
    openSource: (id) => mediaFilesStore.openSource(id),
    openEntry: (id) => mediaFilesStore.openDirectory(id),
    openBreadcrumb: (id) => openMediaFilesBreadcrumb(id)
  };

  const defaultMediaFilesActionDispatch: MediaFilesActionDispatch = {
    playFileItem: (item) => defaultPlayerDispatch.playFileItem(toFilePlaybackItem(item)),
    queueFileItem: (item) => defaultQueueDispatch.queueFileItem(toFileQueueItem(item))
  };

  const defaultMediaPlaylistsDispatch: MediaPlaylistsPanelDispatch = {
    refresh: () => mediaPlaylistsStore.refreshPlaylists(),
    openPlaylist: (id) => mediaPlaylistsStore.openPlaylist(id),
    openBreadcrumb: (id) => mediaPlaylistsStore.openPlaylist(id)
  };

  const defaultMediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch = {
    playPlaylistItem: (item) =>
      defaultPlayerDispatch.playPlaylistItem(toPlaylistPlaybackItem(item)),
    queuePlaylistItem: (item) => defaultQueueDispatch.queuePlaylistItem(toPlaylistQueueItem(item))
  };

  const defaultVideoMovieActionDispatch: VideoMovieActionDispatch = {
    playMovieItem: ({ movieid }) => defaultPlayerDispatch.playMovieItem({ movieid }),
    resumeMovieItem: ({ movieid }) =>
      defaultPlayerDispatch.playMovieItem({ movieid, resume: true }),
    queueMovieItem: ({ movieid }) => defaultQueueDispatch.queueMovieItem({ movieid }),
    markMovieWatched: async ({ movieid, watched, label }) => {
      await videoWriteStore.markMovieWatched({ movieid, label }, watched);
      assertVideoWriteSucceeded(videoWriteStore.snapshot);
      await refreshAfterMovieWrite(movieid);
    }
  };

  const defaultVideoMovieStreamActionDispatch: VideoMovieStreamDispatch = {
    streamMovieItem: (item) => defaultPlayerDispatch.streamMovieItem(item),
    resumeOnKodi: () => defaultPlayerDispatch.resumeOnKodi()
  };

  const defaultVideoEpisodeActionDispatch: VideoEpisodeActionDispatch = {
    playEpisodeItem: ({ episodeid }) => defaultPlayerDispatch.playEpisodeItem({ episodeid }),
    resumeEpisodeItem: ({ episodeid }) =>
      defaultPlayerDispatch.playEpisodeItem({ episodeid, resume: true }),
    queueEpisodeItem: ({ episodeid }) => defaultQueueDispatch.queueEpisodeItem({ episodeid }),
    streamEpisodeItem: ({ episodeid }) => defaultPlayerDispatch.streamEpisodeItem({ episodeid }),
    markEpisodeWatched: async ({ episodeid, watched, label }) => {
      await videoWriteStore.markEpisodeWatched({ episodeid, label }, watched);
      assertVideoWriteSucceeded(videoWriteStore.snapshot);
      await refreshAfterEpisodeWrite(episodeid);
    }
  };

  const defaultVideoSeasonArtworkDispatch: VideoSeasonArtworkDispatch = {
    refreshSeasonArtwork: ({ tvshowid, season }) =>
      videoTvStore.refreshSeasonArtwork(tvshowid, season, 'command:refreshSeasonArtwork')
  };

  const defaultVideoSeasonWriteDispatch: VideoSeasonWriteDispatch = {
    markEpisodesWatched: async (items, watched) => {
      await videoWriteStore.markEpisodesWatched(toVideoWriteEpisodeItems(items), watched);
      const snapshot = videoWriteStore.snapshot;
      await refreshAfterSeasonWrite();
      return toSeasonWriteSummary(snapshot);
    },
    retryFailedVideoWrites: async (items) => {
      await videoWriteStore.retryFailed();
      const snapshot = videoWriteStore.snapshot;
      await refreshAfterSeasonWrite();
      return toSeasonWriteSummary(snapshot, items.length);
    }
  };

  let {
    playerSnapshot,
    playerDispatch = defaultPlayerDispatch,
    localPlayerSnapshot,
    queueSnapshot,
    queueDispatch = defaultQueueDispatch,
    musicLibrarySnapshot,
    musicBrowseSnapshot,
    musicBrowseDispatch = defaultMusicBrowseDispatch,
    musicActionDispatch = defaultMusicActionDispatch,
    mediaSearchSnapshot,
    mediaSearchDispatch = defaultMediaSearchDispatch,
    mediaSearchActionDispatch = defaultMediaSearchActionDispatch,
    mediaFilesSnapshot,
    mediaFilesDispatch = defaultMediaFilesDispatch,
    mediaFilesActionDispatch = defaultMediaFilesActionDispatch,
    mediaPlaylistsSnapshot,
    mediaPlaylistsDispatch = defaultMediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch = defaultMediaPlaylistsActionDispatch,
    route = { kind: 'dashboard' },
    videoLibrarySnapshot,
    videoMovieDetailSnapshot,
    videoMovieActionDispatch = defaultVideoMovieActionDispatch,
    videoMovieStreamActionDispatch = defaultVideoMovieStreamActionDispatch,
    videoTvSnapshot,
    videoEpisodeActionDispatch = defaultVideoEpisodeActionDispatch,
    videoSeasonArtworkDispatch = defaultVideoSeasonArtworkDispatch,
    videoSeasonWriteDispatch = defaultVideoSeasonWriteDispatch
  }: Props = $props();
  const currentRoute = $derived(route);
  const currentPlayerSnapshot = $derived(playerSnapshot ?? playerStore.snapshot);
  const currentLocalSnapshot = $derived(localPlayerSnapshot ?? localPlayerStore.snapshot);
  const currentQueueSnapshot = $derived(queueSnapshot ?? queueStore.snapshot);
  const currentMusicLibrarySnapshot = $derived(musicLibrarySnapshot ?? musicLibraryStore.snapshot);
  const currentMusicBrowseSnapshot = $derived(musicBrowseSnapshot ?? musicBrowseStore.snapshot);
  const currentMediaSearchSnapshot = $derived(mediaSearchSnapshot ?? mediaSearchStore.snapshot);
  const currentMediaFilesSnapshot = $derived(mediaFilesSnapshot ?? mediaFilesStore.snapshot);
  const currentMediaPlaylistsSnapshot = $derived(
    mediaPlaylistsSnapshot ?? mediaPlaylistsStore.snapshot
  );
  const currentVideoLibrarySnapshot = $derived(videoLibrarySnapshot ?? videoLibraryStore.snapshot);
  const currentVideoTvSnapshot = $derived(videoTvSnapshot ?? videoTvStore.snapshot);
  const isDashboardRoute = $derived(currentRoute.kind === 'dashboard');
  const isVideoMoviesRoute = $derived(currentRoute.kind === 'videoMovies');
  const isVideoMovieDetailRoute = $derived(currentRoute.kind === 'videoMovieDetail');
  const isVideoMovieStreamRoute = $derived(currentRoute.kind === 'videoMovieStream');
  const isVideoTvShowsRoute = $derived(currentRoute.kind === 'videoTvShows');
  const isVideoTvShowDetailRoute = $derived(currentRoute.kind === 'videoTvShowDetail');
  const isVideoTvSeasonDetailRoute = $derived(currentRoute.kind === 'videoTvSeasonDetail');
  const isVideoEpisodeDetailRoute = $derived(currentRoute.kind === 'videoEpisodeDetail');
  const isVideoUnknownRoute = $derived(currentRoute.kind === 'videoUnknown');

  function openMediaFilesBreadcrumb(id: string): Promise<void> {
    if (id.startsWith('source:')) {
      return mediaFilesStore.openSource(id);
    }

    return mediaFilesStore.openDirectory(id);
  }

  function toFilePlaybackItem(item: MediaFilesActionItem): { file: string; mediaKind: 'audio' } {
    const resolved = mediaFilesStore.getPlayableEntry(item.id);

    if (!resolved.ok) {
      throw new Error(resolved.error.message);
    }

    return { file: resolved.entry.file, mediaKind: 'audio' };
  }

  function toFileQueueItem(item: MediaFilesActionItem): { file: string; mediaKind: 'audio' } {
    return toFilePlaybackItem(item);
  }

  function toPlaylistPlaybackItem(item: MediaPlaylistsActionItem): {
    file: string;
    mediaKind: 'music';
    playlistKind: 'smart';
  } {
    const resolved = mediaPlaylistsStore.getPlayablePlaylist(item.id);

    if (!resolved.ok) {
      throw new Error(resolved.error.message);
    }

    return {
      file: resolved.playlist.file,
      mediaKind: resolved.playlist.mediaKind,
      playlistKind: resolved.playlist.playlistKind
    };
  }

  function toPlaylistQueueItem(item: MediaPlaylistsActionItem): {
    file: string;
    mediaKind: 'music';
    playlistKind: 'smart';
  } {
    return toPlaylistPlaybackItem(item);
  }

  function toMusicPlaybackItem(
    item: MediaSearchActionItem
  ):
    | { kind: 'artist'; artistid: number }
    | { kind: 'album'; albumid: number }
    | { kind: 'song'; songid: number } {
    if (item.kind === 'artist') {
      return { kind: 'artist', artistid: item.id };
    }

    if (item.kind === 'album') {
      return { kind: 'album', albumid: item.id };
    }

    return { kind: 'song', songid: item.id };
  }

  function toMusicQueueItem(
    item: MediaSearchActionItem
  ):
    | { kind: 'artist'; artistid: number }
    | { kind: 'album'; albumid: number }
    | { kind: 'song'; songid: number } {
    return toMusicPlaybackItem(item);
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
    if (currentRoute.kind !== 'videoTvSeasonDetail') {
      return;
    }

    await bestEffortRefresh([
      () =>
        videoTvStore.refreshSeasonEpisodes(
          currentRoute.tvshowid,
          currentRoute.season,
          'command:videoWrite'
        )
    ]);
  }

  async function bestEffortRefresh(refreshes: Array<() => Promise<void>>): Promise<void> {
    await Promise.allSettled(refreshes.map((refresh) => refresh()));
  }

  function assertVideoWriteSucceeded(snapshot: VideoWriteStoreSnapshot): void {
    if (snapshot.status !== 'error') {
      return;
    }

    throw new Error(snapshot.lastError?.message ?? 'Video write failed.');
  }

  function toVideoWriteEpisodeItems(items: readonly VideoSeasonWriteItem[]): {
    episodeid: number;
    label?: string;
  }[] {
    return items.map((item) => ({ episodeid: item.episodeid, label: item.label }));
  }

  function toSeasonWriteSummary(
    snapshot: VideoWriteStoreSnapshot,
    attemptedTotal = snapshot.summary.total
  ): VideoSeasonWriteSummary {
    const total = snapshot.summary.total || attemptedTotal;
    return {
      total,
      succeeded: snapshot.summary.succeeded,
      failed: snapshot.summary.failed,
      failedItems: snapshot.failedItems,
      lastError: snapshot.lastError
    };
  }

  function formatKodiVersion(version: ConnectionStoreSnapshot['kodiVersion']): string | null {
    if (version === null) {
      return null;
    }

    if (typeof version === 'string') {
      return version.trim() || null;
    }

    const parts = [version.major, version.minor, version.patch].filter(
      (part) => part !== undefined && part !== null
    );

    return parts.length > 0 ? parts.join('.') : null;
  }

  function connectionTone(
    snapshot: ConnectionStoreSnapshot
  ): 'neutral' | 'success' | 'warning' | 'danger' {
    if (snapshot.status === 'failed') {
      return 'danger';
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return 'warning';
    }

    if (snapshot.status === 'connected') {
      return 'success';
    }

    return 'neutral';
  }

  function connectionStatusText(snapshot: ConnectionStoreSnapshot): string {
    if (snapshot.status === 'idle') {
      return 'no host';
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return 'degraded';
    }

    return snapshot.status;
  }

  function connectionDescription(snapshot: ConnectionStoreSnapshot): string {
    const version = formatKodiVersion(snapshot.kodiVersion);
    const versionText = version ? ` Kodi ${version}.` : '';
    const lastConnectedText = snapshot.lastConnectedAt
      ? ` Last connected ${snapshot.lastConnectedAt}.`
      : '';

    if (snapshot.status === 'idle') {
      return 'Add a trusted Kodi host to begin HTTP diagnostics. HTTP and WebSocket checks are idle.';
    }

    if (snapshot.status === 'checking') {
      return 'Checking Kodi HTTP diagnostics before opening the notification WebSocket.';
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return `WebSocket degraded after HTTP diagnostics succeeded; retry attempt ${snapshot.reconnectAttempt}.${versionText}${lastConnectedText}`;
    }

    if (snapshot.status === 'failed') {
      return snapshot.lastError
        ? `Kodi connection failed (${snapshot.lastError.source}/${snapshot.lastError.code}): ${snapshot.lastError.message}`
        : 'Kodi connection failed with no additional diagnostics.';
    }

    const transportText = snapshot.webSocketEndpoint
      ? 'Kodi HTTP and WebSocket diagnostics are connected.'
      : 'Kodi HTTP diagnostics are connected.';

    return `${transportText}${versionText}${lastConnectedText}`;
  }
</script>

<AppShell>
  <header class="hero" aria-labelledby="app-title">
    <div class="hero-copy">
      <p class="eyebrow">Multi-host console</p>
      <h1 id="app-title">chorus3</h1>
      <p class="lede">
        Save trusted Kodi endpoints, test HTTP diagnostics, switch the active host, and watch
        connection status update without reloading the app.
      </p>
    </div>
    <ThemeToggle />
  </header>

  {#if isDashboardRoute}
    <main class="dashboard" aria-label="Kodi host configuration and status">
      <section class="mission surface" aria-labelledby="mission-title">
        <p class="section-kicker">Runtime surface</p>
        <h2 id="mission-title">
          {configStore.snapshot.activeHost?.label ?? 'No Kodi host configured yet'}
        </h2>
        <p>
          Host settings are persisted locally for trusted devices, while connection diagnostics stay
          secret-safe and visible in the status cards below.
        </p>
      </section>

      <div class="host-grid">
        <HostSettings />
        <HostSwitcher />
      </div>

      <section class="status-grid" aria-label="Kodi readiness status">
        <StatusCard
          title="Connection"
          status={connectionStatusText(connectionStore.snapshot)}
          tone={connectionTone(connectionStore.snapshot)}
          description={connectionDescription(connectionStore.snapshot)}
        />
        <StatusCard
          title="Theme contract"
          status="active"
          tone="success"
          description="The toggle updates the root data-theme attribute and keeps colors flowing through project tokens."
        />
      </section>

      <MusicLibraryPanel snapshot={currentMusicLibrarySnapshot} />
      <MusicBrowsePanel
        librarySnapshot={currentMusicLibrarySnapshot}
        browseSnapshot={currentMusicBrowseSnapshot}
        dispatch={musicBrowseDispatch}
        actionDispatch={musicActionDispatch}
      />
      <MediaSearchPanel
        snapshot={currentMediaSearchSnapshot}
        dispatch={mediaSearchDispatch}
        actionDispatch={mediaSearchActionDispatch}
      />
      <MediaFilesPanel
        snapshot={currentMediaFilesSnapshot}
        dispatch={mediaFilesDispatch}
        actionDispatch={mediaFilesActionDispatch}
      />
      <MediaPlaylistsPanel
        snapshot={currentMediaPlaylistsSnapshot}
        dispatch={mediaPlaylistsDispatch}
        actionDispatch={mediaPlaylistsActionDispatch}
      />

      <LocalMediaRuntime />
      <NowPlayingPanel
        snapshot={currentPlayerSnapshot}
        dispatch={playerDispatch}
        localPlayerSnapshot={currentLocalSnapshot}
      />
      <QueuePanel snapshot={currentQueueSnapshot} dispatch={queueDispatch} />
    </main>
  {:else if isVideoMoviesRoute}
    <main class="video-route" aria-label="Video movies route">
      <VideoMoviesPanel snapshot={currentVideoLibrarySnapshot} />
    </main>
  {:else if isVideoMovieDetailRoute}
    <main class="video-route" aria-label="Video movie detail route">
      <VideoMovieDetailShell
        snapshot={currentVideoLibrarySnapshot}
        route={currentRoute}
        detailSnapshot={videoMovieDetailSnapshot}
        actionDispatch={videoMovieActionDispatch}
      />
    </main>
  {:else if isVideoMovieStreamRoute}
    <main class="video-stream-route" aria-label="Video movie stream route">
      <VideoMovieStreamShell
        snapshot={currentVideoLibrarySnapshot}
        route={currentRoute}
        detailSnapshot={videoMovieDetailSnapshot}
        localPlayerSnapshot={currentLocalSnapshot}
        dispatchSnapshot={playerDispatch.snapshot}
        actionDispatch={videoMovieStreamActionDispatch}
      />
    </main>
  {:else if isVideoTvShowsRoute}
    <main class="video-route" aria-label="Video TV shows route">
      <VideoTvShowsPanel snapshot={currentVideoLibrarySnapshot} />
    </main>
  {:else if isVideoTvShowDetailRoute}
    <main class="video-route" aria-label="Video TV show detail route">
      <VideoTvShowDetailShell snapshot={currentVideoTvSnapshot} route={currentRoute} />
    </main>
  {:else if isVideoTvSeasonDetailRoute}
    <main class="video-route" aria-label="Video TV season detail route">
      <VideoSeasonDetailShell
        snapshot={currentVideoTvSnapshot}
        route={currentRoute}
        artworkDispatch={videoSeasonArtworkDispatch}
        writeDispatch={videoSeasonWriteDispatch}
      />
    </main>
  {:else if isVideoEpisodeDetailRoute}
    <main class="video-route" aria-label="Video episode detail route">
      <VideoEpisodeDetailShell
        snapshot={currentVideoTvSnapshot}
        route={currentRoute}
        actionDispatch={videoEpisodeActionDispatch}
      />
    </main>
  {:else if isVideoUnknownRoute}
    <main class="video-route" aria-label="Unknown video route">
      <section class="video-route-not-found surface" aria-labelledby="video-route-not-found-title">
        <p class="section-kicker">Video Library</p>
        <h2 id="video-route-not-found-title">Video route not found</h2>
        <p>
          The video route {currentRoute.kind === 'videoUnknown'
            ? currentRoute.pathLabel
            : '/video/unknown'} is not available in this app shell.
        </p>
        <nav class="video-route-recovery" aria-label="Video route recovery">
          <a href={buildVideoRoute({ kind: 'videoMovies' })}>Movies</a>
          <a href={buildVideoRoute({ kind: 'videoTvShows' })}>TV shows</a>
        </nav>
      </section>
    </main>
  {/if}
</AppShell>

<style>
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-lg);
    align-items: start;
    padding-block-start: clamp(var(--space-md), 4vw, var(--space-xl));
  }

  .hero-copy {
    max-width: 48rem;
  }

  .eyebrow,
  .section-kicker,
  h1,
  h2,
  p {
    margin: 0;
  }

  .eyebrow,
  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin-block-start: var(--space-sm);
    font-size: clamp(4rem, 16vw, 10rem);
    line-height: 0.82;
    letter-spacing: -0.08em;
  }

  .lede {
    max-width: 42rem;
    margin-block-start: var(--space-lg);
    color: var(--color-text-muted);
    font-size: clamp(1.05rem, 2vw, 1.35rem);
    line-height: 1.55;
  }

  .dashboard {
    display: grid;
    gap: var(--space-lg);
    align-self: end;
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

  .mission h2 {
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 0.95;
    letter-spacing: -0.045em;
  }

  .mission p:not(.section-kicker) {
    max-width: 48rem;
    color: var(--color-text-muted);
    font-size: 1rem;
    line-height: 1.7;
  }

  .video-route-recovery {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .host-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(20rem, 0.88fr);
    gap: var(--space-md);
    align-items: start;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .host-grid,
    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
