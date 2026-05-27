<script lang="ts">
  import { onMount } from 'svelte';

  import AddonDetailShell, { type AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import AddonsPanel, { type AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import HostSettings from '$components/HostSettings.svelte';
  import HostSwitcher from '$components/HostSwitcher.svelte';
  import LocalBrowserPlayerRoute, {
    type LocalBrowserPlayerDispatch
  } from '$components/LocalBrowserPlayerRoute.svelte';
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
    type MediaSearchAddonResultGroup,
    type MediaSearchActionDispatch,
    type MediaSearchActionItem,
    type MediaSearchPanelDispatch
  } from '$components/MediaSearchPanel.svelte';
  import MusicBrowsePanel, {
    type MusicBrowseActionDispatch,
    type MusicBrowsePanelDispatch
  } from '$components/MusicBrowsePanel.svelte';
  import MusicLibraryPanel from '$components/MusicLibraryPanel.svelte';
  import NowPlayingEmbedRoute from '$components/NowPlayingEmbedRoute.svelte';
  import NowPlayingPanel from '$components/NowPlayingPanel.svelte';
  import ParityPlaceholder from '$components/ParityPlaceholder.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import RemoteInputPanel, {
    type RemoteInputPanelRemoteDispatch
  } from '$components/RemoteInputPanel.svelte';
  import QueuePanel, { type QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import SettingsPanel, { type SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import type { LocaleToggleDispatch } from '$components/LocaleToggle.svelte';
  import StatusCard from '$components/StatusCard.svelte';
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
    createActiveKodiJsonRpcHttpClient,
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
    prepareLocalStreamUrl,
    pvrStore,
    remoteInputDispatch as defaultRemoteInputDispatch,
    playerStore,
    queueDispatch as defaultQueueDispatch,
    queueStore,
    settingsStore,
    thumbsUpStore,
    localeStore,
    type AddonsStoreSnapshot,
    type ActiveHostSummary,
    type ConnectionStoreSnapshot,
    type LocalPlayerStoreSnapshot,
    type LocalPlaylistDispatch,
    type LocalPlaylistItemInput,
    type LocalPlaylistPlayableItem,
    type LocalPlaylistStoreSnapshot,
    type MediaFilesStoreSnapshot,
    type MediaPlaylistsStoreSnapshot,
    type MediaSearchStoreSnapshot,
    type MusicBrowseStoreSnapshot,
    type MusicLibraryStoreSnapshot,
    type PlayerStoreSnapshot,
    type PvrStoreSnapshot,
    type QueueItemSnapshot,
    type QueuePlayableItemSnapshot,
    type QueueStoreSnapshot,
    type RemoteInputDispatchSnapshot,
    type SavedKodiHost,
    type SettingsStoreSnapshot,
    type ThumbsUpStoreSnapshot,
    type LocaleStoreSnapshot
  } from '$lib/stores';
  import type { SearchAddonSetting } from '$lib/stores/searchAddons.svelte';
  import {
    videoLibraryStore,
    type VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { mainNavStore } from '$lib/stores/mainNav.svelte';
  import {
    videoMovieDetailStore,
    type VideoMovieDetailStoreSnapshot
  } from '$lib/stores/videoMovieDetailStore.svelte';
  import { videoTvStore, type VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';
  import {
    videoWriteStore,
    type VideoWriteStoreSnapshot
  } from '$lib/stores/videoWriteStore.svelte';
  import {
    buildAppRoute,
    KODI_WEBINTERFACE_BASE_PATH,
    parseAppRoute,
    type AppRoute,
    type PrimaryAppRoute
  } from '$lib/app/appRouter';
  import PrimaryAppShell from '$lib/app-shell/AppShell.svelte';
  import { createAppNavigationItems } from '$lib/app-shell/appNavigation';
  import AppPageSurface from '$lib/app-pages/AppPageSurface.svelte';
  import type { LocalPlaylistPageActions } from '$lib/app-pages/PlaylistsPage.svelte';
  import { getAppPageMetadata } from '$lib/app-pages/appPageMetadata';
  import type {
    AppShellCallbacks,
    AppShellDrawerState,
    AppShellPlayerSnapshot,
    AppShellPlaylistDestinationMode,
    AppShellPlaylistMediaMode,
    AppShellPlaylistMenuAction
  } from '$lib/app-shell/appShellTypes';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { NowPlayingEmbedQuery } from '$lib/app/nowPlayingEmbedQuery';
  import { createTranslationContext } from '$lib/i18n';
  import { isTextSecretSafe } from '$lib/safety/redaction';
  import { handlePlaybackShortcut } from '$lib/app/playbackShortcuts';
  import { handleRemoteInputShortcut } from '$lib/app/remoteInputShortcuts';
  import type { VideoRoute } from '$lib/video/videoRouter';
  import { getFileDirectory } from '$lib/kodi';

  interface VideoNavigationDispatch {
    openMovieGrid: () => Promise<void>;
    openMovieDetail: (movie: { movieid: number }) => Promise<void>;
    openRoute: (route: VideoRoute) => Promise<void>;
  }

  type PlaylistPlaybackDispatch = PlayerControlsDispatch & {
    setMode?: (mode: 'kodi' | 'local') => void;
    playFileItem?: (item: {
      file: string;
      mediaKind: 'audio' | 'video';
      itemType?: 'file' | 'directory';
    }) => Promise<void> | void;
    canNavigateLocalFilePlaylist?: () => boolean;
    setLocalFilePlaylist?: (
      items: readonly {
        file: string;
        mediaKind: 'audio';
        label?: string;
        title?: string;
        type?: string;
        thumbnail?: string;
      }[],
      startFile?: string
    ) => void;
  };

  type PlaylistQueueDispatch = QueuePanelDispatch & {
    queueFileItem?: (item: {
      file: string;
      mediaKind: 'audio' | 'video';
      itemType?: 'file' | 'directory';
    }) => Promise<void> | void;
  };

  interface Props {
    playerSnapshot?: PlayerStoreSnapshot;
    playerDispatch?: PlayerControlsDispatch;
    remoteSnapshot?: RemoteInputDispatchSnapshot;
    remoteInputDispatch?: RemoteInputPanelRemoteDispatch;
    localPlayerSnapshot?: LocalPlayerStoreSnapshot;
    localPlaylistSnapshot?: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch?: LocalPlaylistDispatch;
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
    videoMediaFilesSnapshot?: MediaFilesStoreSnapshot;
    videoMediaFilesDispatch?: MediaFilesPanelDispatch;
    videoMediaFilesActionDispatch?: MediaFilesActionDispatch;
    mediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
    mediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
    mediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
    pvrSnapshot?: PvrStoreSnapshot;
    thumbsUpSnapshot?: ThumbsUpStoreSnapshot;
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
    nowPlayingEmbedQuery?: NowPlayingEmbedQuery;
    nowPlayingHostSummary?: ActiveHostSummary | null;
    nowPlayingRefreshDispatch?: () => Promise<void> | void;
    localBrowserPlayerActionDispatch?: LocalBrowserPlayerDispatch;
    packageMountedHost?: SavedKodiHost | null;
    packageBasePath?: string;
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
    search: ({ query, scope }) => mediaSearchStore.search({ text: query, scope }),
    clear: () => mediaSearchStore.clear(),
    searchAddon: async ({ row, query, pluginUrl }) => searchAddonInline(row, query, pluginUrl)
  };

  const defaultMediaSearchActionDispatch: MediaSearchActionDispatch = {
    playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(toMusicPlaybackItem(item)),
    queueMusicItem: (item) => defaultQueueDispatch.queueMusicItem(toMusicQueueItem(item))
  };

  async function searchAddonInline(
    row: SearchAddonSetting,
    query: string,
    pluginUrl: string
  ): Promise<MediaSearchAddonResultGroup> {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before searching add-ons.');
    }

    const result = await getFileDirectory(client, {
      directory: pluginUrl,
      media: row.media === 'video' ? 'video' : 'music',
      properties: ['title', 'thumbnail']
    });
    const files = Array.isArray(result.files) ? result.files : [];

    return {
      row,
      query,
      items: files.flatMap((item) => {
        if (
          !item ||
          typeof item !== 'object' ||
          !('file' in item) ||
          typeof item.file !== 'string'
        ) {
          return [];
        }

        const record = item as Record<string, unknown>;
        return [
          {
            file: item.file,
            filetype: typeof record.filetype === 'string' ? record.filetype : undefined,
            label: typeof record.label === 'string' ? record.label : undefined,
            title: typeof record.title === 'string' ? record.title : undefined,
            thumbnail: typeof record.thumbnail === 'string' ? record.thumbnail : undefined
          }
        ];
      })
    };
  }

  const defaultMediaFilesDispatch: MediaFilesPanelDispatch = {
    refresh: () => mediaFilesStore.refreshSources(),
    openSource: (id) => mediaFilesStore.openSource(id),
    openEntry: (id) => mediaFilesStore.openDirectory(id),
    openPath: (path) => mediaFilesStore.openPath(path),
    openBreadcrumb: (id) => openMediaFilesBreadcrumb(id)
  };

  const defaultVideoMediaFilesDispatch: MediaFilesPanelDispatch = {
    refresh: () => videoMediaFilesStore.refreshSources(),
    openSource: (id) => videoMediaFilesStore.openSource(id),
    openEntry: (id) => videoMediaFilesStore.openDirectory(id),
    openPath: (path) => videoMediaFilesStore.openPath(path),
    openBreadcrumb: (id) => openVideoMediaFilesBreadcrumb(id)
  };

  const defaultMediaFilesActionDispatch: MediaFilesActionDispatch = {
    playFileItem: (item) => defaultPlayerDispatch.playFileItem(toFilePlaybackItem(item)),
    queueFileItem: (item) => defaultQueueDispatch.queueFileItem(toFileQueueItem(item)),
    downloadFileItem: (item) => downloadMediaFileItem(toFileDownloadItem(item))
  };

  const defaultVideoMediaFilesActionDispatch: MediaFilesActionDispatch =
    defaultMediaFilesActionDispatch;

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

  const defaultPvrDispatch = {
    refreshChannels: (group: 'alltv' | 'allradio') => pvrStore.refreshChannels(group),
    refreshRecordings: () => pvrStore.refreshRecordings(),
    refreshBroadcasts: (channelid: number) => pvrStore.refreshBroadcasts(channelid),
    loadChannelDetail: (channelid: number) => pvrStore.loadChannelDetail(channelid),
    toggleChannelRecording: (channelid: number) => pvrStore.toggleChannelRecording(channelid),
    toggleBroadcastTimer: (broadcastid: number, timerrule?: boolean) =>
      pvrStore.toggleBroadcastTimer(broadcastid, timerrule),
    addBroadcastTimer: (broadcastid: number, timerrule?: boolean) =>
      pvrStore.addBroadcastTimer(broadcastid, timerrule),
    deleteTimer: (timerid: number) => pvrStore.deleteTimer(timerid)
  };

  const defaultVideoMediaPlaylistsDispatch: MediaPlaylistsPanelDispatch = {
    refresh: () => videoMediaPlaylistsStore.refreshPlaylists(),
    openPlaylist: (id) => videoMediaPlaylistsStore.openPlaylist(id),
    openBreadcrumb: (id) => videoMediaPlaylistsStore.openPlaylist(id)
  };

  const defaultVideoMediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch = {
    playPlaylistItem: (item) =>
      defaultPlayerDispatch.playPlaylistItem(toVideoPlaylistPlaybackItem(item)),
    queuePlaylistItem: (item) =>
      defaultQueueDispatch.queuePlaylistItem(toVideoPlaylistQueueItem(item))
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

  const defaultLocalBrowserPlayerActionDispatch: LocalBrowserPlayerDispatch = {
    setMode: (mode) => defaultPlayerDispatch.setMode(mode),
    playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(item),
    streamMovieItem: (item) => defaultPlayerDispatch.streamMovieItem(item),
    streamEpisodeItem: (item) => defaultPlayerDispatch.streamEpisodeItem(item),
    streamMusicVideoItem: (item) => defaultPlayerDispatch.streamMusicVideoItem(item)
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
    setGroupBy: (groupBy) => addonsStore.setGroupBy(groupBy),
    setAddonEnabled: (addonid, enabled) => addonsStore.setAddonEnabled(addonid, enabled),
    executeAddon: (addonid) => addonsStore.executeAddon(addonid)
  };

  const defaultAddonDetailDispatch: AddonDetailDispatch = {
    load: () => loadCurrentAddonDetail(),
    retry: () => loadCurrentAddonDetail(),
    setAddonEnabled: (addonid, enabled) => addonsStore.setAddonEnabled(addonid, enabled),
    back: () => openAddonsRoute()
  };

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
    musicBrowseDispatch = defaultMusicBrowseDispatch,
    musicActionDispatch = defaultMusicActionDispatch,
    mediaSearchSnapshot,
    mediaSearchDispatch = defaultMediaSearchDispatch,
    mediaSearchActionDispatch = defaultMediaSearchActionDispatch,
    mediaFilesSnapshot,
    mediaFilesDispatch = defaultMediaFilesDispatch,
    mediaFilesActionDispatch = defaultMediaFilesActionDispatch,
    videoMediaFilesSnapshot,
    videoMediaFilesDispatch = defaultVideoMediaFilesDispatch,
    videoMediaFilesActionDispatch = defaultVideoMediaFilesActionDispatch,
    mediaPlaylistsSnapshot,
    mediaPlaylistsDispatch = defaultMediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch = defaultMediaPlaylistsActionDispatch,
    pvrSnapshot,
    thumbsUpSnapshot,
    videoMediaPlaylistsSnapshot,
    videoMediaPlaylistsDispatch = defaultVideoMediaPlaylistsDispatch,
    videoMediaPlaylistsActionDispatch = defaultVideoMediaPlaylistsActionDispatch,
    route,
    videoLibrarySnapshot,
    videoMovieDetailSnapshot,
    settingsSnapshot,
    settingsDispatch = defaultSettingsDispatch,
    localeSnapshot,
    localeDispatch = defaultLocaleDispatch,
    addonsSnapshot,
    addonsDispatch = defaultAddonsDispatch,
    addonDetailDispatch = defaultAddonDetailDispatch,
    nowPlayingEmbedQuery,
    nowPlayingHostSummary,
    nowPlayingRefreshDispatch,
    localBrowserPlayerActionDispatch = defaultLocalBrowserPlayerActionDispatch,
    packageMountedHost = null,
    packageBasePath = '',
    videoMovieActionDispatch = defaultVideoMovieActionDispatch,
    videoMovieStreamActionDispatch = defaultVideoMovieStreamActionDispatch,
    videoTvSnapshot,
    videoEpisodeActionDispatch = defaultVideoEpisodeActionDispatch,
    videoSeasonArtworkDispatch = defaultVideoSeasonArtworkDispatch,
    videoSeasonWriteDispatch = defaultVideoSeasonWriteDispatch
  }: Props = $props();
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
      ? ({
          packageBasePath: currentPackageBasePath,
          packageSearch: currentPackageSearch || globalThis.location?.search || '',
          routeMode: 'path'
        } as const)
      : ({ packageBasePath: '' } as const)
  );
  const isPrimaryShellRoute = $derived(currentPrimaryShellRoute !== null);
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
      ? toAppShellLocalPlayerSnapshot(currentLocalSnapshot)
      : toAppShellPlayerSnapshot(currentPlayerSnapshot)
  );
  const currentKodiStageArtUrl = $derived(kodiImageUrl(currentPlayerSnapshot.item?.fanart));
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
    playInKodi: async (_playlistId, items) => playLocalPlaylistInKodi(items),
    playInBrowser: async (_playlistId, items) => playLocalPlaylistInBrowser(items),
    exportList: (_playlistId, playlistLabel, items) => exportLocalPlaylist(playlistLabel, items)
  });
  const isDashboardRoute = $derived(
    currentRoute.kind === 'dashboard' || currentPrimaryRoute?.kind === 'home'
  );
  const isSettingsRoute = $derived(currentRoute.kind === 'settings');
  const isRemoteRoute = $derived(
    currentRoute.kind === 'remote' || currentPrimaryRoute?.kind === 'remote'
  );
  const isSettingsUnknownRoute = $derived(currentRoute.kind === 'settingsUnknown');
  const isAddonsRoute = $derived(currentRoute.kind === 'addons');
  const isAddonDetailRoute = $derived(currentRoute.kind === 'addonDetail');
  const isAddonsUnknownRoute = $derived(currentRoute.kind === 'addonsUnknown');
  const currentParityPlaceholder = $derived(
    currentRoute.kind === 'parityPlaceholder'
      ? currentRoute.placeholder
      : primaryRouteToPlaceholder(currentPrimaryRoute)
  );
  const isLabUnknownRoute = $derived(currentRoute.kind === 'labUnknown');
  const isNowPlayingRoute = $derived(currentRoute.kind === 'nowPlaying');
  const isLocalPlayerRoute = $derived(currentRoute.kind === 'localPlayer');
  const isVideoMoviesRoute = $derived(currentVideoRoute?.kind === 'videoMovies');
  const isVideoMovieDetailRoute = $derived(currentVideoRoute?.kind === 'videoMovieDetail');
  const isVideoMovieStreamRoute = $derived(currentVideoRoute?.kind === 'videoMovieStream');
  const isVideoTvShowsRoute = $derived(currentVideoRoute?.kind === 'videoTvShows');
  const isVideoTvShowDetailRoute = $derived(currentVideoRoute?.kind === 'videoTvShowDetail');
  const isVideoTvSeasonDetailRoute = $derived(currentVideoRoute?.kind === 'videoTvSeasonDetail');
  const isVideoEpisodeDetailRoute = $derived(currentVideoRoute?.kind === 'videoEpisodeDetail');
  const isVideoUnknownRoute = $derived(currentVideoRoute?.kind === 'videoUnknown');

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

  function toAppRoute(input: AppRoute | VideoRoute): AppRoute {
    if (
      input.kind === 'dashboard' ||
      input.kind === 'settings' ||
      input.kind === 'settingsUnknown' ||
      input.kind === 'remote' ||
      input.kind === 'addons' ||
      input.kind === 'addonDetail' ||
      input.kind === 'addonsUnknown' ||
      input.kind === 'labUnknown' ||
      input.kind === 'nowPlaying' ||
      input.kind === 'localPlayer' ||
      input.kind === 'primary' ||
      input.kind === 'parityPlaceholder'
    ) {
      return input;
    }

    if (input.kind === 'video') {
      return input;
    }

    return { kind: 'video', route: input };
  }

  function videoRouteRefreshKey(videoRoute: VideoRoute): string {
    switch (videoRoute.kind) {
      case 'videoMovieDetail':
        return `movie:${videoRoute.movieid}`;
      case 'videoTvShowDetail':
        return `tvshow:${videoRoute.tvshowid}`;
      case 'videoTvSeasonDetail':
        return `season:${videoRoute.tvshowid}:${videoRoute.season}`;
      case 'videoEpisodeDetail':
        return `episode:${videoRoute.episodeid}`;
      default:
        return '';
    }
  }

  function videoDetailRefreshKey(
    videoRoute: VideoRoute | null | undefined,
    activeHost: SavedKodiHost | null
  ): string {
    if (!videoRoute || !activeHost) {
      return '';
    }

    const routeKey = videoRouteRefreshKey(videoRoute);
    return routeKey ? `${activeHost.id}:${routeKey}` : '';
  }

  async function refreshCurrentVideoDetailRoute(
    videoRoute: VideoRoute,
    expectedRefreshKey: string
  ): Promise<void> {
    if (videoTvSnapshot || videoMovieDetailSnapshot) {
      return;
    }

    if (videoRoute.kind === 'videoMovieDetail' && videoLibrarySnapshot) {
      return;
    }

    switch (videoRoute.kind) {
      case 'videoMovieDetail':
        await videoMovieDetailStore.refreshMovieDetail(videoRoute.movieid, 'manual');
        return;
      case 'videoTvShowDetail':
        await videoTvStore.refreshTvShow(videoRoute.tvshowid, 'manual');
        return;
      case 'videoTvSeasonDetail':
        await videoTvStore.refreshTvShow(videoRoute.tvshowid, 'manual');
        if (
          videoDetailRefreshKey(currentVideoRoute, currentActiveKodiHost) !== expectedRefreshKey
        ) {
          return;
        }
        await videoTvStore.refreshSeasonEpisodes(videoRoute.tvshowid, videoRoute.season, 'manual');
        return;
      case 'videoEpisodeDetail':
        await videoTvStore.refreshEpisodeDetail(videoRoute.episodeid, 'manual');
        return;
      default:
        return;
    }
  }

  function primaryRouteToVideoRoute(
    primaryRoute: PrimaryAppRoute['route'] | null
  ): Exclude<VideoRoute, { kind: 'dashboard' }> | null {
    if (!primaryRoute) {
      return null;
    }

    if (primaryRoute.kind === 'movies' || primaryRoute.kind === 'moviesRecent') {
      return { kind: 'videoMovies' };
    }

    if (primaryRoute.kind === 'tvshows' || primaryRoute.kind === 'tvshowsRecent') {
      return { kind: 'videoTvShows' };
    }

    if (primaryRoute.kind === 'movieDetail') {
      const movieid = parsePositiveSafeInteger(primaryRoute.movieid);
      return movieid === null ? null : { kind: 'videoMovieDetail', movieid };
    }

    if (primaryRoute.kind === 'tvshowDetail') {
      const tvshowid = parsePositiveSafeInteger(primaryRoute.tvshowid);
      return tvshowid === null ? null : { kind: 'videoTvShowDetail', tvshowid };
    }

    if (primaryRoute.kind === 'tvshowSeasonDetail') {
      const tvshowid = parsePositiveSafeInteger(primaryRoute.tvshowid);
      const season = parsePositiveSafeInteger(primaryRoute.season);
      return tvshowid === null || season === null
        ? null
        : { kind: 'videoTvSeasonDetail', tvshowid, season };
    }

    if (primaryRoute.kind === 'tvshowEpisodeDetail') {
      const tvshowid = parsePositiveSafeInteger(primaryRoute.tvshowid);
      const season = parsePositiveSafeInteger(primaryRoute.season);
      const episodeid = parsePositiveSafeInteger(primaryRoute.episodeid);
      return tvshowid === null || season === null || episodeid === null
        ? null
        : { kind: 'videoEpisodeDetail', tvshowid, season, episodeid };
    }

    return null;
  }

  function videoRouteToPrimaryRoute(videoRoute: VideoRoute | null): PrimaryRoute | null {
    if (!videoRoute) {
      return null;
    }

    switch (videoRoute.kind) {
      case 'videoMovies':
        return { kind: 'movies' };
      case 'videoMovieDetail':
        return { kind: 'movieDetail', movieid: String(videoRoute.movieid) };
      case 'videoTvShows':
        return { kind: 'tvshows' };
      case 'videoTvShowDetail':
        return { kind: 'tvshowDetail', tvshowid: String(videoRoute.tvshowid) };
      case 'videoTvSeasonDetail':
        return {
          kind: 'tvshowSeasonDetail',
          tvshowid: String(videoRoute.tvshowid),
          season: String(videoRoute.season)
        };
      case 'videoEpisodeDetail':
        return {
          kind: 'tvshowEpisodeDetail',
          tvshowid: String(videoRoute.tvshowid),
          season: String(videoRoute.season),
          episodeid: String(videoRoute.episodeid)
        };
      default:
        return null;
    }
  }

  function primaryRouteToPlaceholder(primaryRoute: PrimaryAppRoute['route'] | null) {
    if (!primaryRoute) {
      return null;
    }

    return null;
  }

  function parsePositiveSafeInteger(value: string): number | null {
    if (!/^\d+$/u.test(value)) {
      return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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
    const hash = globalThis.location?.hash;
    if (typeof hash !== 'string') {
      return null;
    }
    if (hash.length === 0) {
      return { kind: 'primary', route: { kind: 'home' } };
    }

    const raw = hash.slice(1).trim();
    if (!raw) {
      return { kind: 'primary', route: { kind: 'home' } };
    }

    const [path = '', query = ''] = raw.split('?', 2);

    try {
      return parseAppRoute(path.startsWith('/') ? path : `/${path}`, query ? `?${query}` : '', {
        packageBasePath: currentPackageBasePath
      });
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
      activatePackageMountedHost(activePackageHost);
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

  function withPackageDefaultCredentials(host: SavedKodiHost): SavedKodiHost {
    if (host.username || host.password) {
      return host;
    }

    return {
      ...host,
      username: 'kodi',
      password: 'kodi'
    };
  }

  function activatePackageMountedHost(host: SavedKodiHost): void {
    const activeHost = configStore.activeHost;

    if (activeHost?.id === host.id) {
      return;
    }

    if (configStore.hosts.some((savedHost) => savedHost.id === host.id)) {
      configStore.updateHost(host.id, host);
    } else {
      configStore.addHost(host);
    }

    configStore.setActiveHost(host.id);
  }

  async function refreshPackageMountedLibraries(): Promise<void> {
    await bestEffortRefresh([
      () => playerStore.refresh('manual'),
      () => queueStore.refresh('manual'),
      () => musicLibraryStore.refresh('manual'),
      () => videoLibraryStore.refresh('manual'),
      () => mediaFilesStore.refreshSources(),
      () => videoMediaFilesStore.refreshSources(),
      () => mediaPlaylistsStore.refreshPlaylists(),
      () => videoMediaPlaylistsStore.refreshPlaylists(),
      () => settingsStore.load(),
      () => addonsStore.loadAddons()
    ]);
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

  async function playLocalPlaylistInKodi(
    items: readonly LocalPlaylistPlayableItem[]
  ): Promise<void> {
    const playable = playableAudioItems(items);
    const first = playable[0];
    if (!first) {
      return;
    }

    const controls = playerDispatch as PlaylistPlaybackDispatch;
    const queueControls = queueDispatch as PlaylistQueueDispatch;
    controls.setMode?.('kodi');
    await controls.playFileItem?.({ file: first.file, mediaKind: 'audio' });

    for (const item of playable.slice(1)) {
      await queueControls.queueFileItem?.({ file: item.file, mediaKind: 'audio' });
    }
  }

  async function playLocalPlaylistInBrowser(
    items: readonly LocalPlaylistPlayableItem[]
  ): Promise<void> {
    const playable = playableAudioItems(items);
    const first = playable[0];
    if (!first) {
      return;
    }

    const controls = playerDispatch as PlaylistPlaybackDispatch;
    controls.setMode?.('local');
    controls.setLocalFilePlaylist?.(
      playable.map((item) => ({
        file: item.file,
        mediaKind: 'audio',
        label: item.label,
        title: item.label,
        type: 'song',
        ...(item.thumbnail ? { thumbnail: item.thumbnail } : {})
      })),
      first.file
    );
    await controls.playFileItem?.({ file: first.file, mediaKind: 'audio' });
  }

  function exportLocalPlaylist(
    playlistLabel: string,
    items: readonly LocalPlaylistPlayableItem[]
  ): void {
    const exportable = exportableLocalPlaylistItems(items);
    if (exportable.length === 0) {
      return;
    }

    const lines = exportable.flatMap((item) => [
      `#EXTINF:${Math.trunc(item.durationSeconds ?? -1)},${item.label}`,
      item.file
    ]);
    const blob = new Blob([`#EXTCPlayListM3U::M3U\n${lines.join('\n')}\n`], {
      type: 'audio/x-mpegurl;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safePlaylistExportName(playlistLabel)}.m3u`;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadMediaFileItem(item: { file: string; label: string }): Promise<void> {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before downloading media.');
    }

    const url = await prepareLocalStreamUrl({
      client,
      file: item.file,
      activeHost: configStore.activeHost
    });

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safePlaylistExportName(item.label);
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function playableAudioItems(
    items: readonly LocalPlaylistPlayableItem[]
  ): LocalPlaylistPlayableItem[] {
    return items
      .filter((item) => item.kind === 'audio' && item.file.trim().length > 0)
      .sort((a, b) => a.position - b.position);
  }

  function exportableLocalPlaylistItems(
    items: readonly LocalPlaylistPlayableItem[]
  ): LocalPlaylistPlayableItem[] {
    return items
      .filter((item) => item.kind !== 'playlist' && item.file.trim().length > 0)
      .sort((a, b) => a.position - b.position);
  }

  function safePlaylistExportName(label: string): string {
    return (
      label
        .trim()
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'playlist'
    );
  }

  function getPlaylistClearDisabledReason(): string | undefined {
    if (currentDrawerDestinationMode === 'local') {
      if (isLocalPlaylistMutationRunning) {
        return 'A local playlist change is running. Clear playlist is temporarily disabled.';
      }

      if (!currentLocalPlaylistSnapshot.selectedPlaylistId) {
        return 'Select a local playlist before clearing it.';
      }

      return undefined;
    }

    return isQueueCommandRunning
      ? 'Queue command is running. Clear playlist is temporarily disabled.'
      : undefined;
  }

  function getPlaylistRefreshDisabledReason(): string | undefined {
    if (currentDrawerDestinationMode === 'local') {
      return isLocalPlaylistMutationRunning
        ? 'A local playlist change is running. Refresh playlist is temporarily disabled.'
        : undefined;
    }

    return isQueueCommandRunning || currentQueueSnapshot.refreshStatus === 'loading'
      ? 'Queue refresh is already running.'
      : undefined;
  }

  function getPlaylistPartyModeDisabledReason(): string | undefined {
    if (currentDrawerDestinationMode === 'local') {
      return 'Party mode is only available when controlling Kodi playback.';
    }

    if (isPlayerDestinationCommandRunning) {
      return 'A player command is running. Party mode is temporarily disabled.';
    }

    if (!currentPlayerSnapshot.primaryPlayer) {
      return 'Start Kodi playback before toggling party mode.';
    }

    return undefined;
  }

  function getSaveKodiPlaylistDisabledReason(): string | undefined {
    if (currentDrawerDestinationMode !== 'local') {
      return 'Switch to Local destination before saving the current Kodi queue locally.';
    }

    if (isLocalPlaylistMutationRunning) {
      return 'A local playlist change is running. Save Kodi playlist is temporarily disabled.';
    }

    if (isQueueCommandRunning) {
      return 'Queue command is running. Save Kodi playlist is temporarily disabled.';
    }

    if (!currentLocalPlaylistSnapshot.selectedPlaylistId) {
      return 'Select a local playlist before saving the current Kodi queue.';
    }

    if (safeQueueItemsForLocalPlaylist.length === 0) {
      return 'Current Kodi queue has no supported items to save.';
    }

    return undefined;
  }

  function toLocalPlaylistItemInput(item: QueuePlayableItemSnapshot): LocalPlaylistItemInput[] {
    const label = firstSafeQueueText(item.label);

    if (!label) {
      return [];
    }

    const kind = queueItemTypeToLocalPlaylistKind(item.type);
    if (!kind) {
      return [];
    }

    return [
      {
        kind,
        label,
        file: item.file.trim(),
        sourceId: `queue:${item.position}`,
        ...(typeof item.duration === 'number' &&
        Number.isFinite(item.duration) &&
        item.duration >= 0
          ? { durationSeconds: item.duration }
          : {}),
        ...(typeof item.thumbnail === 'string' && item.thumbnail.trim()
          ? { thumbnail: item.thumbnail.trim() }
          : {})
      }
    ];
  }

  function queueSnapshotToPlayableItems(snapshot: QueueStoreSnapshot): QueuePlayableItemSnapshot[] {
    return snapshot.items.flatMap((item) => {
      const label = firstSafeQueueText(item.label, item.title);
      if (!label) {
        return [];
      }

      return [
        {
          position: item.position,
          label,
          file: `queue-item:${item.position}`,
          ...(item.type ? { type: item.type } : {}),
          ...(typeof item.duration === 'number' &&
          Number.isFinite(item.duration) &&
          item.duration >= 0
            ? { duration: item.duration }
            : {}),
          ...(typeof item.thumbnail === 'string' && item.thumbnail.trim()
            ? { thumbnail: item.thumbnail.trim() }
            : {})
        }
      ];
    });
  }

  function firstSafeQueueText(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value !== 'string') {
        continue;
      }

      const text = value.trim().replace(/\s+/g, ' ');
      if (text && isTextSecretSafe(text)) {
        return text;
      }
    }

    return null;
  }

  function queueItemTypeToLocalPlaylistKind(
    type: QueueItemSnapshot['type']
  ): LocalPlaylistItemInput['kind'] | null {
    if (type === 'movie' || type === 'episode' || type === 'video') {
      return 'video';
    }

    if (type === 'playlist') {
      return 'playlist';
    }

    if (type === undefined || type === 'song' || type === 'audio' || type === 'music') {
      return 'audio';
    }

    return null;
  }

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

  function openVideoMediaFilesBreadcrumb(id: string): Promise<void> {
    if (id.startsWith('source:')) {
      return videoMediaFilesStore.openSource(id);
    }

    return videoMediaFilesStore.openDirectory(id);
  }

  function toFilePlaybackItem(item: MediaFilesActionItem): {
    file: string;
    mediaKind: 'audio' | 'video';
    itemType?: 'file' | 'directory';
  } {
    const resolved = mediaFilesStoreForMedia(item.media).getPlayableEntry(item.id);

    if (!resolved.ok) {
      throw new Error(resolved.error.message);
    }

    return {
      file: resolved.entry.file,
      mediaKind: resolved.entry.mediaKind,
      itemType: resolved.entry.itemType
    };
  }

  function toFileQueueItem(item: MediaFilesActionItem): {
    file: string;
    mediaKind: 'audio' | 'video';
    itemType?: 'file' | 'directory';
  } {
    return toFilePlaybackItem(item);
  }

  function toFileDownloadItem(item: MediaFilesActionItem): { file: string; label: string } {
    const resolved = mediaFilesStoreForMedia(item.media).getDownloadableEntry(item.id);

    if (!resolved.ok) {
      throw new Error(resolved.error.message);
    }

    return { file: resolved.entry.file, label: resolved.entry.label };
  }

  function mediaFilesStoreForMedia(media: string) {
    return media === 'video' ? videoMediaFilesStore : mediaFilesStore;
  }

  function toPlaylistPlaybackItem(item: MediaPlaylistsActionItem): {
    file: string;
    mediaKind: 'music';
    playlistKind: 'smart' | 'basic';
  } {
    const resolved = mediaPlaylistsStore.getPlayablePlaylist(item.id);

    if (!resolved.ok) {
      throw new Error(resolved.error.message);
    }

    if (resolved.playlist.mediaKind !== 'music') {
      throw new Error('Choose a supported music playlist.');
    }

    return {
      file: resolved.playlist.file,
      mediaKind: 'music',
      playlistKind: resolved.playlist.playlistKind
    };
  }

  function toPlaylistQueueItem(item: MediaPlaylistsActionItem): {
    file: string;
    mediaKind: 'music';
    playlistKind: 'smart' | 'basic';
  } {
    return toPlaylistPlaybackItem(item);
  }

  function toVideoPlaylistPlaybackItem(item: MediaPlaylistsActionItem): {
    file: string;
    mediaKind: 'video';
    playlistKind: 'smart' | 'basic';
  } {
    const resolved = videoMediaPlaylistsStore.getPlayablePlaylist(item.id);

    if (!resolved.ok) {
      throw new Error(resolved.error.message);
    }

    if (resolved.playlist.mediaKind !== 'video') {
      throw new Error('Choose a supported video playlist.');
    }

    return {
      file: resolved.playlist.file,
      mediaKind: 'video',
      playlistKind: resolved.playlist.playlistKind
    };
  }

  function toVideoPlaylistQueueItem(item: MediaPlaylistsActionItem): {
    file: string;
    mediaKind: 'video';
    playlistKind: 'smart' | 'basic';
  } {
    return toVideoPlaylistPlaybackItem(item);
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

  function createActiveHostSummary(host: SavedKodiHost): ActiveHostSummary {
    return {
      id: host.id,
      label: host.label,
      host: host.host,
      port: host.port ?? (host.useTls ? 443 : 8080),
      useTls: host.useTls,
      useWebSocket: host.useWebSocket,
      hasCredentials: Boolean(host.username || host.password)
    };
  }

  function dashboardMediaTitle(value: PlayerStoreSnapshot): string {
    return firstDashboardText(
      value.item?.title,
      value.item?.label,
      value.item?.showtitle,
      value.item?.channel,
      'Nothing playing'
    );
  }

  function dashboardMediaCreator(value: PlayerStoreSnapshot): string {
    return firstDashboardText(
      joinDashboardText(value.item?.artist),
      joinDashboardText(value.item?.albumartist),
      value.item?.album,
      value.item?.showtitle,
      connectionStore.snapshot.status === 'connected' ? 'Kodi is ready' : 'Waiting for Kodi'
    );
  }

  function dashboardProgress(value: PlayerStoreSnapshot): number {
    const percentage = value.properties?.percentage;
    return typeof percentage === 'number' && Number.isFinite(percentage)
      ? Math.min(100, Math.max(0, percentage))
      : 0;
  }

  function toAppShellPlayerSnapshot(value: PlayerStoreSnapshot): AppShellPlayerSnapshot {
    return {
      title: dashboardMediaTitle(value),
      subtitle: dashboardMediaCreator(value),
      currentTime: dashboardTime(value.time.currentSeconds),
      totalTime: dashboardTime(value.time.totalSeconds),
      progressPercent: dashboardProgress(value),
      isPlaying: (value.properties?.speed ?? 0) > 0,
      isShuffled: value.properties?.shuffled === true,
      thumbnailUrl: kodiImageUrl(value.item?.thumbnail)
    };
  }

  function toAppShellLocalPlayerSnapshot(value: LocalPlayerStoreSnapshot): AppShellPlayerSnapshot {
    const title = firstDashboardText(value.item?.title, value.item?.label, 'Nothing playing');
    const subtitle =
      value.status === 'idle'
        ? 'Local player is ready'
        : `${value.mediaKind === 'video' ? 'Local video' : 'Local audio'} - ${value.status}`;
    const durationSeconds = value.durationSeconds;
    const progressPercent =
      typeof durationSeconds === 'number' && durationSeconds > 0
        ? Math.min(100, Math.max(0, (value.currentSeconds / durationSeconds) * 100))
        : 0;

    return {
      title,
      subtitle,
      currentTime: dashboardTime(value.currentSeconds),
      totalTime: dashboardTime(durationSeconds),
      progressPercent,
      isPlaying: value.status === 'playing',
      isShuffled: localShuffleEnabled,
      thumbnailUrl: kodiImageUrl(value.item?.thumbnail)
    };
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

  function kodiImageUrl(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value.trim()) {
      return undefined;
    }

    return `/image/${encodeURIComponent(value.trim())}`;
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

  function dashboardTime(seconds: number | null): string {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
      return '--:--';
    }

    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  function firstDashboardText(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return 'Unknown media';
  }

  function joinDashboardText(value: unknown): string | null {
    if (Array.isArray(value)) {
      const joined = value.filter((entry) => typeof entry === 'string' && entry.trim()).join(', ');
      return joined || null;
    }

    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
</script>

{#if isNowPlayingRoute}
  <NowPlayingEmbedRoute
    snapshot={currentPlayerSnapshot}
    dispatch={playerDispatch}
    localPlayerSnapshot={currentLocalSnapshot}
    hostSummary={currentNowPlayingHostSummary}
    query={nowPlayingEmbedQuery}
    i18n={currentI18n}
    onRefresh={refreshNowPlayingEmbed}
  />
{:else if isLocalPlayerRoute && currentRoute.kind === 'localPlayer'}
  <LocalBrowserPlayerRoute
    route={currentRoute}
    localPlayerSnapshot={currentLocalSnapshot}
    dispatchSnapshot={playerDispatch.snapshot}
    actionDispatch={localBrowserPlayerActionDispatch}
  />
{:else if isPrimaryShellRoute}
  <PrimaryAppShell
    routeIdentity={{ kind: 'primary', route: currentPrimaryShellRoute ?? { kind: 'home' } }}
    navigationItems={currentShellNavigationItems}
    stageLabel={currentAppPageMetadata.stageLabel}
    logoHref={buildAppRoute({ kind: 'primary', route: { kind: 'home' } }, currentRouteBuildOptions)}
    player={currentShellPlayer}
    stageArtUrl={currentShellStageArtUrl}
    playerActions={{
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
        currentDrawerDestinationMode === 'kodi'
          ? () => playerDispatch.setRepeat('cycle')
          : undefined,
      openRemote:
        currentDrawerDestinationMode === 'kodi' ? () => toggleRemoteOverlayFromPlayer() : undefined
    }}
    drawer={currentPlaylistDrawer}
    destination={currentPlaylistDestination}
    callbacks={{
      ...playlistDrawerCallbacks,
      onSearchFocus: () => openPrimaryRoute({ kind: 'search' }),
      onSearchSubmit: openSearchRoute
    }}
  >
    <AppPageSurface
      route={currentPrimaryShellRoute ?? { kind: 'home' }}
      metadata={currentAppPageMetadata}
      i18n={currentI18n}
      packageBasePath={currentPackageBasePath}
      parityPlaceholder={currentParityPlaceholder}
      homeContext={{
        hostLabel:
          packageMountedHost?.label ??
          configStore.snapshot.activeHost?.label ??
          currentI18n.t('app.mission.noHost'),
        description: currentI18n.t('app.mission.description'),
        storageWarningMessage: configStore.snapshot.storageWarning?.message ?? null,
        statusGridAria: currentI18n.t('app.statusGrid.aria'),
        connection: {
          title: currentI18n.t('app.connection.title'),
          status: connectionStatusText(connectionStore.snapshot),
          tone: connectionTone(connectionStore.snapshot),
          description: connectionDescription(connectionStore.snapshot)
        },
        themeContract: {
          title: currentI18n.t('app.themeContract.title'),
          status: currentI18n.t('app.themeContract.status'),
          tone: 'success',
          description: currentI18n.t('app.themeContract.description')
        }
      }}
      localeSnapshot={currentLocaleSnapshot}
      {localeDispatch}
      playerSnapshot={currentPlayerSnapshot}
      {playerDispatch}
      remoteSnapshot={currentRemoteSnapshot}
      {remoteInputDispatch}
      localPlayerSnapshot={currentLocalSnapshot}
      localPlaylistSnapshot={currentLocalPlaylistSnapshot}
      {localPlaylistDispatch}
      localPlaylistActions={localPlaylistPageActions}
      queueSnapshot={currentQueueSnapshot}
      {queueDispatch}
      musicLibrarySnapshot={currentMusicLibrarySnapshot}
      musicBrowseSnapshot={currentMusicBrowseSnapshot}
      {musicBrowseDispatch}
      {musicActionDispatch}
      mediaSearchSnapshot={currentMediaSearchSnapshot}
      {mediaSearchDispatch}
      {mediaSearchActionDispatch}
      mediaFilesSnapshot={currentMediaFilesSnapshot}
      {mediaFilesDispatch}
      {mediaFilesActionDispatch}
      videoMediaFilesSnapshot={currentVideoMediaFilesSnapshot}
      {videoMediaFilesDispatch}
      {videoMediaFilesActionDispatch}
      mediaPlaylistsSnapshot={currentMediaPlaylistsSnapshot}
      {mediaPlaylistsDispatch}
      {mediaPlaylistsActionDispatch}
      pvrSnapshot={currentPvrSnapshot}
      pvrDispatch={defaultPvrDispatch}
      thumbsUpSnapshot={currentThumbsUpSnapshot}
      thumbsUpDispatch={thumbsUpStore}
      videoMediaPlaylistsSnapshot={currentVideoMediaPlaylistsSnapshot}
      {videoMediaPlaylistsDispatch}
      {videoMediaPlaylistsActionDispatch}
      videoLibrarySnapshot={currentVideoLibrarySnapshot}
      settingsSnapshot={currentSettingsSnapshot}
      {settingsDispatch}
      addonsSnapshot={currentAddonsSnapshot}
      {addonsDispatch}
      {addonDetailDispatch}
      videoMovieDetailSnapshot={currentVideoMovieDetailSnapshot}
      {videoMovieActionDispatch}
      videoTvSnapshot={currentVideoTvSnapshot}
      {videoEpisodeActionDispatch}
      {videoSeasonArtworkDispatch}
      {videoSeasonWriteDispatch}
      renderableVideoRoute={currentRenderableVideoRoute}
    />

    {#if remoteOverlayOpen}
      <div class="remote-overlay" aria-label="Kodi remote overlay">
        <button
          type="button"
          class="remote-overlay__scrim"
          aria-hidden="true"
          tabindex="-1"
          onclick={closeRemoteOverlay}
        ></button>
        <div class="remote-overlay__panel">
          <button
            type="button"
            class="remote-overlay__close"
            aria-label="Close Kodi remote"
            onclick={closeRemoteOverlay}
          >
            <span class="mdi mdi-navigation-close" aria-hidden="true"></span>
          </button>
          <RemoteInputPanel
            remoteSnapshot={currentRemoteSnapshot}
            {remoteInputDispatch}
            playerSnapshot={currentPlayerSnapshot}
            playerDispatch={remoteOverlayPlayerDispatch}
            backgroundUrl={currentShellStageArtUrl}
            i18n={currentI18n}
          />
        </div>
      </div>
    {/if}

    {#snippet drawerContent()}
      <QueuePanel snapshot={currentQueueSnapshot} dispatch={queueDispatch} i18n={currentI18n} />
    {/snippet}

    {#snippet localRuntime()}
      <LocalMediaRuntime onEnded={handleLocalMediaEnded} />
    {/snippet}
  </PrimaryAppShell>
{:else}
  <PrimaryAppShell
    routeIdentity={{ kind: 'primary', route: currentPrimaryShellRoute ?? { kind: 'home' } }}
    navigationItems={currentShellNavigationItems}
    stageLabel={currentAppPageMetadata.stageLabel}
    logoHref={buildAppRoute({ kind: 'primary', route: { kind: 'home' } }, currentRouteBuildOptions)}
    player={currentShellPlayer}
    stageArtUrl={currentShellStageArtUrl}
    playerActions={{
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
        currentDrawerDestinationMode === 'kodi'
          ? () => playerDispatch.setRepeat('cycle')
          : undefined,
      openRemote:
        currentDrawerDestinationMode === 'kodi' ? () => toggleRemoteOverlayFromPlayer() : undefined
    }}
    drawer={currentPlaylistDrawer}
    destination={currentPlaylistDestination}
    callbacks={{
      ...playlistDrawerCallbacks,
      onSearchFocus: () => openPrimaryRoute({ kind: 'search' }),
      onSearchSubmit: openSearchRoute
    }}
  >
    {#if isDashboardRoute}
      <PrimaryAppShell
        routeIdentity={{ kind: 'primary', route: { kind: 'home' } }}
        navigationItems={currentShellNavigationItems}
        stageLabel={currentI18n.t('app.dashboard.aria')}
        logoHref={buildAppRoute(
          { kind: 'primary', route: { kind: 'home' } },
          currentRouteBuildOptions
        )}
        player={currentShellPlayer}
        stageArtUrl={currentShellStageArtUrl}
        playerActions={{
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
            currentDrawerDestinationMode === 'kodi'
              ? () => playerDispatch.setRepeat('cycle')
              : undefined,
          openRemote:
            currentDrawerDestinationMode === 'kodi'
              ? () => toggleRemoteOverlayFromPlayer()
              : undefined
        }}
        drawer={currentPlaylistDrawer}
        destination={currentPlaylistDestination}
        callbacks={playlistDrawerCallbacks}
      >
        {#if !isPackageMounted}
          <div class="dashboard" aria-label={currentI18n.t('app.dashboard.aria')}>
            <section class="mission surface" aria-labelledby="mission-title">
              <p class="section-kicker">{currentI18n.t('app.mission.kicker')}</p>
              <h2 id="mission-title">
                {packageMountedHost?.label ??
                  configStore.snapshot.activeHost?.label ??
                  currentI18n.t('app.mission.noHost')}
              </h2>
              <p>
                {currentI18n.t('app.mission.description')}
              </p>
            </section>

            <div class="host-grid">
              <HostSettings i18n={currentI18n} />
              <HostSwitcher i18n={currentI18n} />
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

            <MusicLibraryPanel snapshot={currentMusicLibrarySnapshot} i18n={currentI18n} />
            <MusicBrowsePanel
              librarySnapshot={currentMusicLibrarySnapshot}
              browseSnapshot={currentMusicBrowseSnapshot}
              dispatch={musicBrowseDispatch}
              actionDispatch={musicActionDispatch}
              i18n={currentI18n}
            />
            <MediaSearchPanel
              snapshot={currentMediaSearchSnapshot}
              dispatch={mediaSearchDispatch}
              actionDispatch={mediaSearchActionDispatch}
              i18n={currentI18n}
            />
            <MediaFilesPanel
              snapshot={currentMediaFilesSnapshot}
              dispatch={mediaFilesDispatch}
              actionDispatch={mediaFilesActionDispatch}
              i18n={currentI18n}
            />
            <MediaPlaylistsPanel
              snapshot={currentMediaPlaylistsSnapshot}
              dispatch={mediaPlaylistsDispatch}
              actionDispatch={mediaPlaylistsActionDispatch}
              i18n={currentI18n}
            />

            <NowPlayingPanel
              snapshot={currentPlayerSnapshot}
              dispatch={playerDispatch}
              localPlayerSnapshot={currentLocalSnapshot}
              i18n={currentI18n}
            />
            <QueuePanel
              snapshot={currentQueueSnapshot}
              dispatch={queueDispatch}
              i18n={currentI18n}
            />
          </div>
        {/if}

        {#if remoteOverlayOpen}
          <div class="remote-overlay" aria-label="Kodi remote overlay">
            <button
              type="button"
              class="remote-overlay__scrim"
              aria-hidden="true"
              tabindex="-1"
              onclick={closeRemoteOverlay}
            ></button>
            <div class="remote-overlay__panel">
              <button
                type="button"
                class="remote-overlay__close"
                aria-label="Close Kodi remote"
                onclick={closeRemoteOverlay}
              >
                <span class="mdi mdi-navigation-close" aria-hidden="true"></span>
              </button>
              <RemoteInputPanel
                remoteSnapshot={currentRemoteSnapshot}
                {remoteInputDispatch}
                playerSnapshot={currentPlayerSnapshot}
                playerDispatch={remoteOverlayPlayerDispatch}
                backgroundUrl={currentShellStageArtUrl}
                i18n={currentI18n}
              />
            </div>
          </div>
        {/if}

        {#snippet localRuntime()}
          <LocalMediaRuntime onEnded={handleLocalMediaEnded} />
        {/snippet}
      </PrimaryAppShell>
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
        <AddonsPanel
          snapshot={currentAddonsSnapshot}
          dispatch={addonsDispatch}
          i18n={currentI18n}
        />
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
                currentRoute.kind === 'settingsUnknown'
                  ? currentRoute.pathLabel
                  : '/settings/unknown'
            })}
          </p>
          <nav
            class="settings-route-recovery"
            aria-label={currentI18n.t('app.route.settings.recoveryAria')}
          >
            <a
              href={buildAppRoute(
                { kind: 'primary', route: { kind: 'settingsWeb' } },
                currentRouteBuildOptions
              )}>Settings</a
            >
          </nav>
        </section>
      </main>
    {:else if isVideoMoviesRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoMovies.aria')}>
        <VideoMoviesPanel snapshot={currentVideoLibrarySnapshot} />
        <VideoRecentPanel snapshot={currentVideoLibrarySnapshot} i18n={currentI18n} />
        <MediaPlaylistsPanel
          snapshot={currentVideoMediaPlaylistsSnapshot}
          dispatch={videoMediaPlaylistsDispatch}
          actionDispatch={videoMediaPlaylistsActionDispatch}
          i18n={currentI18n}
        />
      </main>
    {:else if isVideoMovieDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoMovieDetail.aria')}>
        <VideoMovieDetailShell
          snapshot={currentVideoLibrarySnapshot}
          route={currentRenderableVideoRoute}
          detailSnapshot={videoMovieDetailSnapshot}
          actionDispatch={videoMovieActionDispatch}
          i18n={currentI18n}
        />
      </main>
    {:else if isVideoMovieStreamRoute}
      <main
        class="video-stream-route"
        aria-label={currentI18n.t('app.route.videoMovieStream.aria')}
      >
        <VideoMovieStreamShell
          snapshot={currentVideoLibrarySnapshot}
          route={currentRenderableVideoRoute}
          detailSnapshot={videoMovieDetailSnapshot}
          localPlayerSnapshot={currentLocalSnapshot}
          dispatchSnapshot={playerDispatch.snapshot}
          actionDispatch={videoMovieStreamActionDispatch}
          i18n={currentI18n}
        />
      </main>
    {:else if isVideoTvShowsRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoTvShows.aria')}>
        <VideoTvShowsPanel snapshot={currentVideoLibrarySnapshot} />
        <VideoRecentPanel snapshot={currentVideoLibrarySnapshot} i18n={currentI18n} />
        <MediaPlaylistsPanel
          snapshot={currentVideoMediaPlaylistsSnapshot}
          dispatch={videoMediaPlaylistsDispatch}
          actionDispatch={videoMediaPlaylistsActionDispatch}
          i18n={currentI18n}
        />
      </main>
    {:else if isVideoTvShowDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoTvShowDetail.aria')}>
        <VideoTvShowDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          i18n={currentI18n}
          buildOptions={currentRouteBuildOptions}
        />
      </main>
    {:else if isVideoTvSeasonDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoTvSeasonDetail.aria')}>
        <VideoSeasonDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          artworkDispatch={videoSeasonArtworkDispatch}
          writeDispatch={videoSeasonWriteDispatch}
          i18n={currentI18n}
          buildOptions={currentRouteBuildOptions}
        />
      </main>
    {:else if isVideoEpisodeDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoEpisodeDetail.aria')}>
        <VideoEpisodeDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          actionDispatch={videoEpisodeActionDispatch}
          i18n={currentI18n}
          buildOptions={currentRouteBuildOptions}
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

    {#if remoteOverlayOpen}
      <div class="remote-overlay" aria-label="Kodi remote overlay">
        <button
          type="button"
          class="remote-overlay__scrim"
          aria-hidden="true"
          tabindex="-1"
          onclick={closeRemoteOverlay}
        ></button>
        <div class="remote-overlay__panel">
          <button
            type="button"
            class="remote-overlay__close"
            aria-label="Close Kodi remote"
            onclick={closeRemoteOverlay}
          >
            <span class="mdi mdi-navigation-close" aria-hidden="true"></span>
          </button>
          <RemoteInputPanel
            remoteSnapshot={currentRemoteSnapshot}
            {remoteInputDispatch}
            playerSnapshot={currentPlayerSnapshot}
            playerDispatch={remoteOverlayPlayerDispatch}
            backgroundUrl={currentShellStageArtUrl}
            i18n={currentI18n}
          />
        </div>
      </div>
    {/if}

    {#snippet drawerContent()}
      <QueuePanel snapshot={currentQueueSnapshot} dispatch={queueDispatch} i18n={currentI18n} />
    {/snippet}

    {#snippet localRuntime()}
      <LocalMediaRuntime onEnded={handleLocalMediaEnded} />
    {/snippet}
  </PrimaryAppShell>
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

  .remote-overlay {
    position: fixed;
    inset: 45px var(--classic-playlist-width, 300px) 60px 54px;
    z-index: 28;
    pointer-events: none;
  }

  .remote-overlay__scrim {
    position: absolute;
    inset: 0;
    z-index: 0;
    border: 0;
    background: transparent;
    pointer-events: none;
  }

  .remote-overlay__panel {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 320px;
    height: 380px;
    overflow: visible;
    background: transparent;
    pointer-events: none;
  }

  .remote-overlay__close {
    position: absolute;
    top: auto;
    right: auto;
    bottom: 210px;
    left: 272px;
    z-index: 3;
    display: grid;
    width: 2.25rem;
    height: 2.25rem;
    place-items: center;
    border: 0;
    background: rgb(0 0 0 / 0.38);
    color: #f4f4f4;
    font-size: 1.25rem;
    cursor: pointer;
    pointer-events: auto;
  }

  .remote-overlay__close:hover,
  .remote-overlay__close:focus-visible {
    background: rgb(77 179 230 / 0.82);
    outline: none;
  }

  .remote-overlay__panel :global(.remote-input-panel) {
    width: 320px;
    min-height: 380px;
    height: 380px;
    overflow: visible;
    background: transparent;
    pointer-events: none;
  }

  .remote-overlay__panel :global(.remote-background) {
    display: none;
  }

  .remote-overlay__panel :global(.kodi-remote) {
    right: auto;
    bottom: 0;
    left: 0;
    width: 320px;
    margin-inline: 0;
    pointer-events: auto;
  }

  @media (max-width: 760px) {
    .remote-overlay {
      inset: 45px 0 60px 0;
    }

    .remote-overlay__panel {
      width: 320px;
      height: 380px;
    }
  }
</style>
