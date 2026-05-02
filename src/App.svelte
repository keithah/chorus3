<script lang="ts">
  import { onMount } from 'svelte';

  import AddonDetailShell, { type AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import AddonsPanel, { type AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import AppShell from '$components/AppShell.svelte';
  import HostSettings from '$components/HostSettings.svelte';
  import HostSwitcher from '$components/HostSwitcher.svelte';
  import LocalMediaRuntime from '$components/LocalMediaRuntime.svelte';
  import LabApiBrowserPanel, {
    type LabApiBrowserPanelDispatch
  } from '$components/LabApiBrowserPanel.svelte';
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
  import SettingsPanel, { type SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import LocaleToggle, { type LocaleToggleDispatch } from '$components/LocaleToggle.svelte';
  import ShortcutsPanel from '$components/ShortcutsPanel.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import VideoRecentPanel from '$components/VideoRecentPanel.svelte';
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
    addonsStore,
    configStore,
    connectionStore,
    localPlayerStore,
    labApiBrowserStore,
    mediaFilesStore,
    mediaPlaylistsStore,
    videoMediaPlaylistsStore,
    mediaSearchStore,
    musicBrowseStore,
    musicLibraryStore,
    playerDispatch as defaultPlayerDispatch,
    playerStore,
    queueDispatch as defaultQueueDispatch,
    queueStore,
    settingsStore,
    localeStore,
    type AddonsStoreSnapshot,
    type ConnectionStoreSnapshot,
    type LocalPlayerStoreSnapshot,
    type LabApiBrowserStoreSnapshot,
    type MediaFilesStoreSnapshot,
    type MediaPlaylistsStoreSnapshot,
    type MediaSearchStoreSnapshot,
    type MusicBrowseStoreSnapshot,
    type MusicLibraryStoreSnapshot,
    type PlayerStoreSnapshot,
    type QueueStoreSnapshot,
    type SettingsStoreSnapshot,
    type LocaleStoreSnapshot
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
  import { buildAppRoute, type AppRoute } from '$lib/app/appRouter';
  import { createTranslationContext } from '$lib/i18n';
  import { handlePlaybackShortcut } from '$lib/app/playbackShortcuts';
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
    videoMediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
    videoMediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
    videoMediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
    route?: AppRoute | VideoRoute;
    videoLibrarySnapshot?: VideoLibraryStoreSnapshot;
    videoMovieDetailSnapshot?: VideoMovieDetailStoreSnapshot;
    videoNavigationDispatch?: VideoNavigationDispatch;
    settingsSnapshot?: SettingsStoreSnapshot;
    settingsDispatch?: SettingsPanelDispatch;
    localeSnapshot?: LocaleStoreSnapshot;
    localeDispatch?: LocaleToggleDispatch;
    addonsSnapshot?: AddonsStoreSnapshot;
    addonsDispatch?: AddonsPanelDispatch;
    addonDetailDispatch?: AddonDetailDispatch;
    labApiBrowserSnapshot?: LabApiBrowserStoreSnapshot;
    labApiBrowserDispatch?: LabApiBrowserPanelDispatch;
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

  const defaultVideoMediaPlaylistsDispatch: MediaPlaylistsPanelDispatch = {
    refresh: () => videoMediaPlaylistsStore.refreshPlaylists(),
    openPlaylist: (id) => videoMediaPlaylistsStore.openPlaylist(id),
    openBreadcrumb: (id) => videoMediaPlaylistsStore.openPlaylist(id)
  };

  const defaultVideoMediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch = {
    playPlaylistItem: async () => {
      throw new Error('Video playlist actions are disabled.');
    },
    queuePlaylistItem: async () => {
      throw new Error('Video playlist actions are disabled.');
    }
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

  const defaultLocaleDispatch: LocaleToggleDispatch = {
    setLocale: (locale) => localeStore.setLocale(locale)
  };

  const defaultSettingsDispatch: SettingsPanelDispatch = {
    load: () => settingsStore.load(),
    retry: () => settingsStore.retry(),
    selectSection: (sectionId) => settingsStore.selectSection(sectionId),
    selectCategory: (categoryId) => settingsStore.selectCategory(categoryId),
    setValue: (settingId, value) => settingsStore.writeSettingValue(settingId, value)
  };

  const defaultAddonsDispatch: AddonsPanelDispatch = {
    load: () => addonsStore.loadAddons(),
    retry: () => addonsStore.loadAddons(),
    setSearchQuery: (query) => addonsStore.setSearchQuery(query),
    setGroupBy: (groupBy) => addonsStore.setGroupBy(groupBy)
  };

  const defaultAddonDetailDispatch: AddonDetailDispatch = {
    load: () => loadCurrentAddonDetail(),
    retry: () => loadCurrentAddonDetail(),
    setAddonEnabled: (addonid, enabled) => addonsStore.setAddonEnabled(addonid, enabled),
    back: () => openAddonsRoute()
  };

  const defaultLabApiBrowserDispatch: LabApiBrowserPanelDispatch = {
    loadIntrospection: () => labApiBrowserStore.loadIntrospection(),
    retryIntrospection: () => labApiBrowserStore.loadIntrospection(),
    selectMethod: (methodName) => labApiBrowserStore.selectMethod(methodName),
    setParamsText: (paramsText) => labApiBrowserStore.setParamsText(paramsText),
    runSelectedMethod: () => labApiBrowserStore.runSelectedMethod(),
    confirmSelectedMethod: () => labApiBrowserStore.confirmSelectedMethod(),
    clearConfirmation: () => labApiBrowserStore.clearConfirmation()
  };

  const dashboardVideoRoute: VideoRoute = { kind: 'dashboard' };

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
    videoMediaPlaylistsSnapshot,
    videoMediaPlaylistsDispatch = defaultVideoMediaPlaylistsDispatch,
    videoMediaPlaylistsActionDispatch = defaultVideoMediaPlaylistsActionDispatch,
    route = { kind: 'dashboard' },
    videoLibrarySnapshot,
    videoMovieDetailSnapshot,
    settingsSnapshot,
    settingsDispatch = defaultSettingsDispatch,
    localeSnapshot,
    localeDispatch = defaultLocaleDispatch,
    addonsSnapshot,
    addonsDispatch = defaultAddonsDispatch,
    addonDetailDispatch = defaultAddonDetailDispatch,
    labApiBrowserSnapshot,
    labApiBrowserDispatch = defaultLabApiBrowserDispatch,
    videoMovieActionDispatch = defaultVideoMovieActionDispatch,
    videoMovieStreamActionDispatch = defaultVideoMovieStreamActionDispatch,
    videoTvSnapshot,
    videoEpisodeActionDispatch = defaultVideoEpisodeActionDispatch,
    videoSeasonArtworkDispatch = defaultVideoSeasonArtworkDispatch,
    videoSeasonWriteDispatch = defaultVideoSeasonWriteDispatch
  }: Props = $props();
  const currentRoute = $derived(toAppRoute(route));
  const currentVideoRoute = $derived(currentRoute.kind === 'video' ? currentRoute.route : null);
  const currentRenderableVideoRoute = $derived(currentVideoRoute ?? dashboardVideoRoute);
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
  const currentVideoMediaPlaylistsSnapshot = $derived(
    videoMediaPlaylistsSnapshot ?? videoMediaPlaylistsStore.snapshot
  );
  const currentVideoLibrarySnapshot = $derived(videoLibrarySnapshot ?? videoLibraryStore.snapshot);
  const currentSettingsSnapshot = $derived(settingsSnapshot ?? settingsStore.snapshot);
  const currentLocaleSnapshot = $derived(localeSnapshot ?? localeStore.snapshot);
  const currentI18n = $derived(createTranslationContext(currentLocaleSnapshot.locale));
  const currentAddonsSnapshot = $derived(addonsSnapshot ?? addonsStore.snapshot);
  const currentLabApiBrowserSnapshot = $derived(
    labApiBrowserSnapshot ?? labApiBrowserStore.snapshot
  );
  const currentVideoTvSnapshot = $derived(videoTvSnapshot ?? videoTvStore.snapshot);
  const isDashboardRoute = $derived(currentRoute.kind === 'dashboard');
  const isSettingsRoute = $derived(currentRoute.kind === 'settings');
  const isSettingsUnknownRoute = $derived(currentRoute.kind === 'settingsUnknown');
  const isAddonsRoute = $derived(currentRoute.kind === 'addons');
  const isAddonDetailRoute = $derived(currentRoute.kind === 'addonDetail');
  const isAddonsUnknownRoute = $derived(currentRoute.kind === 'addonsUnknown');
  const isLabShortcutsRoute = $derived(currentRoute.kind === 'labShortcuts');
  const isLabApiBrowserRoute = $derived(currentRoute.kind === 'labApiBrowser');
  const isLabUnknownRoute = $derived(currentRoute.kind === 'labUnknown');
  const isVideoMoviesRoute = $derived(currentVideoRoute?.kind === 'videoMovies');
  const isVideoMovieDetailRoute = $derived(currentVideoRoute?.kind === 'videoMovieDetail');
  const isVideoMovieStreamRoute = $derived(currentVideoRoute?.kind === 'videoMovieStream');
  const isVideoTvShowsRoute = $derived(currentVideoRoute?.kind === 'videoTvShows');
  const isVideoTvShowDetailRoute = $derived(currentVideoRoute?.kind === 'videoTvShowDetail');
  const isVideoTvSeasonDetailRoute = $derived(currentVideoRoute?.kind === 'videoTvSeasonDetail');
  const isVideoEpisodeDetailRoute = $derived(currentVideoRoute?.kind === 'videoEpisodeDetail');
  const isVideoUnknownRoute = $derived(currentVideoRoute?.kind === 'videoUnknown');

  function toAppRoute(input: AppRoute | VideoRoute): AppRoute {
    if (
      input.kind === 'dashboard' ||
      input.kind === 'settings' ||
      input.kind === 'settingsUnknown' ||
      input.kind === 'addons' ||
      input.kind === 'addonDetail' ||
      input.kind === 'addonsUnknown' ||
      input.kind === 'labShortcuts' ||
      input.kind === 'labApiBrowser' ||
      input.kind === 'labUnknown'
    ) {
      return input;
    }

    if (input.kind === 'video') {
      return input;
    }

    return { kind: 'video', route: input };
  }

  onMount(() => {
    const handleGlobalKeydown = (event: KeyboardEvent): void => {
      handlePlaybackShortcut(event, playerDispatch, {
        playerSnapshot: currentPlayerSnapshot,
        toggleFullscreen: toggleAppFullscreen
      });
    };

    window.addEventListener('keydown', handleGlobalKeydown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  function toggleAppFullscreen(): void {
    const documentElement = document.documentElement;

    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {
        // Fullscreen support is host-dependent; keyboard handling remains best-effort.
      });
      return;
    }

    void documentElement.requestFullscreen?.().catch(() => {
      // Fullscreen support is host-dependent; keyboard handling remains best-effort.
    });
  }

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

  function currentAddonId(): string | null {
    return currentRoute.kind === 'addonDetail' ? currentRoute.addonid : null;
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
      globalThis.history?.pushState({ routeKind: 'addons' }, '', buildAppRoute({ kind: 'addons' }));
    } catch {
      // Navigation recovery is best-effort; the route UI remains safe without it.
    }
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
      return currentI18n.t('app.connection.noHost');
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return currentI18n.t('app.connection.degraded');
    }

    return snapshot.status;
  }

  function connectionDescription(snapshot: ConnectionStoreSnapshot): string {
    const version = formatKodiVersion(snapshot.kodiVersion);
    const versionText = version ? currentI18n.t('app.connection.version', { version }) : '';
    const lastConnectedText = snapshot.lastConnectedAt
      ? currentI18n.t('app.connection.lastConnected', { lastConnectedAt: snapshot.lastConnectedAt })
      : '';

    if (snapshot.status === 'idle') {
      return currentI18n.t('app.connection.idleDescription');
    }

    if (snapshot.status === 'checking') {
      return currentI18n.t('app.connection.checkingDescription');
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return currentI18n.t('app.connection.degradedDescription', {
        attempt: snapshot.reconnectAttempt,
        version: versionText,
        lastConnected: lastConnectedText
      });
    }

    if (snapshot.status === 'failed') {
      return snapshot.lastError
        ? currentI18n.t('app.connection.failedDescription', {
            source: snapshot.lastError.source,
            code: snapshot.lastError.code,
            message: snapshot.lastError.message
          })
        : currentI18n.t('app.connection.failedFallback');
    }

    const transportText = snapshot.webSocketEndpoint
      ? currentI18n.t('app.connection.connectedHttpWs')
      : currentI18n.t('app.connection.connectedHttp');

    return `${transportText}${versionText}${lastConnectedText}`;
  }
</script>

<AppShell>
  <header class="hero" aria-labelledby="app-title">
    <div class="hero-copy">
      <p class="eyebrow">{currentI18n.t('app.shell.eyebrow')}</p>
      <h1 id="app-title">{currentI18n.t('app.name')}</h1>
      <p class="lede">{currentI18n.t('app.shell.lede')}</p>
    </div>
    <div class="hero-actions">
      <LocaleToggle
        locale={currentLocaleSnapshot.locale}
        i18n={currentI18n}
        dispatch={localeDispatch}
      />
      <ThemeToggle />
    </div>
  </header>

  {#if isDashboardRoute}
    <main class="dashboard" aria-label={currentI18n.t('app.dashboard.aria')}>
      <section class="mission surface" aria-labelledby="mission-title">
        <p class="section-kicker">{currentI18n.t('app.mission.kicker')}</p>
        <h2 id="mission-title">
          {configStore.snapshot.activeHost?.label ?? currentI18n.t('app.mission.noHost')}
        </h2>
        <p>
          {currentI18n.t('app.mission.description')}
        </p>
      </section>

      <div class="host-grid">
        <HostSettings />
        <HostSwitcher />
      </div>

      <section class="status-grid" aria-label={currentI18n.t('app.statusGrid.aria')}>
        <StatusCard
          title={currentI18n.t('app.connection.title')}
          status={connectionStatusText(connectionStore.snapshot)}
          tone={connectionTone(connectionStore.snapshot)}
          description={connectionDescription(connectionStore.snapshot)}
        />
        <StatusCard
          title={currentI18n.t('app.themeContract.title')}
          status={currentI18n.t('app.themeContract.status')}
          tone="success"
          description={currentI18n.t('app.themeContract.description')}
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
  {:else if isAddonsRoute}
    <main class="addons-route" aria-label={currentI18n.t('app.route.addons.aria')}>
      <AddonsPanel snapshot={currentAddonsSnapshot} dispatch={addonsDispatch} i18n={currentI18n} />
    </main>
  {:else if isAddonDetailRoute}
    <main class="addons-route" aria-label={currentI18n.t('app.route.addonDetail.aria')}>
      <AddonDetailShell
        snapshot={currentAddonsSnapshot}
        dispatch={addonDetailDispatch}
        i18n={currentI18n}
      />
    </main>
  {:else if isAddonsUnknownRoute}
    <main class="addons-route" aria-label={currentI18n.t('app.route.addonsUnknown.aria')}>
      <section
        class="addons-route-not-found surface"
        aria-labelledby="addons-route-not-found-title"
      >
        <p class="section-kicker">{currentI18n.t('app.route.addons.kicker')}</p>
        <h2 id="addons-route-not-found-title">{currentI18n.t('app.route.addons.notFoundTitle')}</h2>
        <p>
          {currentI18n.t('app.route.addons.notFoundDescription', {
            path:
              currentRoute.kind === 'addonsUnknown' ? currentRoute.pathLabel : '/addons/[redacted]'
          })}
        </p>
        <nav
          class="addons-route-recovery"
          aria-label={currentI18n.t('app.route.addons.recoveryAria')}
        >
          <a href={buildAppRoute({ kind: 'addons' })}>Add-ons</a>
        </nav>
      </section>
    </main>
  {:else if isLabShortcutsRoute}
    <main class="lab-route" aria-label={currentI18n.t('app.route.labShortcuts.aria')}>
      <ShortcutsPanel i18n={currentI18n} />
    </main>
  {:else if isLabApiBrowserRoute}
    <main class="lab-route" aria-label={currentI18n.t('app.route.labApiBrowser.aria')}>
      <LabApiBrowserPanel
        snapshot={currentLabApiBrowserSnapshot}
        dispatch={labApiBrowserDispatch}
        i18n={currentI18n}
      />
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
          <a href={buildAppRoute({ kind: 'labShortcuts' })}>Shortcuts</a>
          <a href={buildAppRoute({ kind: 'labApiBrowser' })}>API browser</a>
        </nav>
      </section>
    </main>
  {:else if isSettingsRoute}
    <main class="settings-route" aria-label={currentI18n.t('app.route.settings.aria')}>
      <SettingsPanel
        snapshot={currentSettingsSnapshot}
        dispatch={settingsDispatch}
        i18n={currentI18n}
      />
    </main>
  {:else if isSettingsUnknownRoute}
    <main class="settings-route" aria-label={currentI18n.t('app.route.settingsUnknown.aria')}>
      <section
        class="settings-route-not-found surface"
        aria-labelledby="settings-route-not-found-title"
      >
        <p class="section-kicker">{currentI18n.t('app.route.settings.kicker')}</p>
        <h2 id="settings-route-not-found-title">
          {currentI18n.t('app.route.settings.notFoundTitle')}
        </h2>
        <p>
          {currentI18n.t('app.route.settings.notFoundDescription', {
            path:
              currentRoute.kind === 'settingsUnknown' ? currentRoute.pathLabel : '/settings/unknown'
          })}
        </p>
        <nav
          class="settings-route-recovery"
          aria-label={currentI18n.t('app.route.settings.recoveryAria')}
        >
          <a href="/settings">Settings</a>
        </nav>
      </section>
    </main>
  {:else if isVideoMoviesRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoMovies.aria')}>
      <VideoMoviesPanel snapshot={currentVideoLibrarySnapshot} />
      <VideoRecentPanel snapshot={currentVideoLibrarySnapshot} />
      <MediaPlaylistsPanel
        snapshot={currentVideoMediaPlaylistsSnapshot}
        dispatch={videoMediaPlaylistsDispatch}
        actionDispatch={videoMediaPlaylistsActionDispatch}
      />
    </main>
  {:else if isVideoMovieDetailRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoMovieDetail.aria')}>
      <VideoMovieDetailShell
        snapshot={currentVideoLibrarySnapshot}
        route={currentRenderableVideoRoute}
        detailSnapshot={videoMovieDetailSnapshot}
        actionDispatch={videoMovieActionDispatch}
      />
    </main>
  {:else if isVideoMovieStreamRoute}
    <main class="video-stream-route" aria-label={currentI18n.t('app.route.videoMovieStream.aria')}>
      <VideoMovieStreamShell
        snapshot={currentVideoLibrarySnapshot}
        route={currentRenderableVideoRoute}
        detailSnapshot={videoMovieDetailSnapshot}
        localPlayerSnapshot={currentLocalSnapshot}
        dispatchSnapshot={playerDispatch.snapshot}
        actionDispatch={videoMovieStreamActionDispatch}
      />
    </main>
  {:else if isVideoTvShowsRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoTvShows.aria')}>
      <VideoTvShowsPanel snapshot={currentVideoLibrarySnapshot} />
      <VideoRecentPanel snapshot={currentVideoLibrarySnapshot} />
      <MediaPlaylistsPanel
        snapshot={currentVideoMediaPlaylistsSnapshot}
        dispatch={videoMediaPlaylistsDispatch}
        actionDispatch={videoMediaPlaylistsActionDispatch}
      />
    </main>
  {:else if isVideoTvShowDetailRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoTvShowDetail.aria')}>
      <VideoTvShowDetailShell
        snapshot={currentVideoTvSnapshot}
        route={currentRenderableVideoRoute}
      />
    </main>
  {:else if isVideoTvSeasonDetailRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoTvSeasonDetail.aria')}>
      <VideoSeasonDetailShell
        snapshot={currentVideoTvSnapshot}
        route={currentRenderableVideoRoute}
        artworkDispatch={videoSeasonArtworkDispatch}
        writeDispatch={videoSeasonWriteDispatch}
      />
    </main>
  {:else if isVideoEpisodeDetailRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoEpisodeDetail.aria')}>
      <VideoEpisodeDetailShell
        snapshot={currentVideoTvSnapshot}
        route={currentRenderableVideoRoute}
        actionDispatch={videoEpisodeActionDispatch}
      />
    </main>
  {:else if isVideoUnknownRoute}
    <main class="video-route" aria-label={currentI18n.t('app.route.videoUnknown.aria')}>
      <section class="video-route-not-found surface" aria-labelledby="video-route-not-found-title">
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

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    justify-content: flex-end;
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

  .video-route-recovery,
  .settings-route-recovery,
  .addons-route-recovery,
  .lab-route-recovery {
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
