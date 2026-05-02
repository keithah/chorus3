<script lang="ts">
  import { onMount } from 'svelte';

  import chorus2FanartUrl from '$lib/assets/chorus2/tweeter.jpg';
  import chorus2LogoUrl from '$lib/assets/chorus2/logo.png';
  import chorus2ThumbnailUrl from '$lib/assets/chorus2/thumbnail_default.png';
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
  import NowPlayingEmbedRoute from '$components/NowPlayingEmbedRoute.svelte';
  import NowPlayingPanel from '$components/NowPlayingPanel.svelte';
  import ParityPlaceholder from '$components/ParityPlaceholder.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import RemoteInputPanel, {
    type RemoteInputPanelRemoteDispatch
  } from '$components/RemoteInputPanel.svelte';
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
    hostConnectionStore,
    localPlayerStore,
    labApiBrowserStore,
    mediaFilesStore,
    mediaPlaylistsStore,
    videoMediaPlaylistsStore,
    mediaSearchStore,
    musicBrowseStore,
    musicLibraryStore,
    playerDispatch as defaultPlayerDispatch,
    remoteInputDispatch as defaultRemoteInputDispatch,
    playerStore,
    queueDispatch as defaultQueueDispatch,
    queueStore,
    settingsStore,
    localeStore,
    type AddonsStoreSnapshot,
    type ActiveHostSummary,
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
    type RemoteInputDispatchSnapshot,
    type SavedKodiHost,
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
  import {
    buildAppRoute,
    getChorus2PlaceholderMetadata,
    KODI_WEBINTERFACE_BASE_PATH,
    type AppRoute
  } from '$lib/app/appRouter';
  import type { NowPlayingEmbedQuery } from '$lib/app/nowPlayingEmbedQuery';
  import { createTranslationContext } from '$lib/i18n';
  import { handlePlaybackShortcut } from '$lib/app/playbackShortcuts';
  import { handleRemoteInputShortcut } from '$lib/app/remoteInputShortcuts';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

  interface VideoNavigationDispatch {
    openMovieGrid: () => Promise<void>;
    openMovieDetail: (movie: { movieid: number }) => Promise<void>;
    openRoute: (route: VideoRoute) => Promise<void>;
  }

  interface Props {
    playerSnapshot?: PlayerStoreSnapshot;
    playerDispatch?: PlayerControlsDispatch;
    remoteSnapshot?: RemoteInputDispatchSnapshot;
    remoteInputDispatch?: RemoteInputPanelRemoteDispatch;
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
    nowPlayingEmbedQuery?: NowPlayingEmbedQuery;
    nowPlayingHostSummary?: ActiveHostSummary | null;
    nowPlayingRefreshDispatch?: () => Promise<void> | void;
    packageMountedHost?: SavedKodiHost | null;
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

  interface ShellRailItem {
    readonly title: string;
    readonly label: string;
    readonly icon: string;
    readonly route: AppRoute;
    readonly activeOnDashboard?: boolean;
  }

  const shellRailItems: readonly ShellRailItem[] = [
    {
      title: 'Music',
      label: 'Music',
      icon: 'mdi-av-my-library-music',
      route: { kind: 'dashboard' },
      activeOnDashboard: true
    },
    {
      title: 'Movies',
      label: 'Movies',
      icon: 'mdi-image-movie-creation',
      route: { kind: 'video', route: { kind: 'videoMovies' } }
    },
    {
      title: 'TV shows',
      label: 'TV shows',
      icon: 'mdi-hardware-tv',
      route: { kind: 'video', route: { kind: 'videoTvShows' } }
    },
    {
      title: 'Files',
      label: 'Files',
      icon: 'mdi-editor-format-list-bulleted',
      route: chorus2PlaceholderRoute('browser')
    },
    {
      title: 'Add-ons',
      label: 'Add-ons',
      icon: 'mdi-action-extension',
      route: { kind: 'addons' }
    },
    {
      title: 'Remote',
      label: 'Remote',
      icon: 'mdi-action-thumb-up',
      route: { kind: 'remote' }
    },
    {
      title: 'Playlists',
      label: 'Playlists',
      icon: 'mdi-av-playlist-add',
      route: chorus2PlaceholderRoute('playlists')
    },
    {
      title: 'Settings',
      label: 'Settings',
      icon: 'mdi-action-settings',
      route: { kind: 'settings' }
    },
    {
      title: 'Help',
      label: 'Help',
      icon: 'mdi-action-help',
      route: chorus2PlaceholderRoute('help')
    }
  ];

  function chorus2PlaceholderRoute(id: string): AppRoute {
    const placeholder = getChorus2PlaceholderMetadata(id);

    return placeholder ? { kind: 'chorus2Placeholder', placeholder } : { kind: 'dashboard' };
  }

  let {
    playerSnapshot,
    playerDispatch = defaultPlayerDispatch,
    remoteSnapshot,
    remoteInputDispatch = defaultRemoteInputDispatch,
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
    nowPlayingEmbedQuery,
    nowPlayingHostSummary,
    nowPlayingRefreshDispatch,
    packageMountedHost = null,
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
  const currentRemoteSnapshot = $derived(remoteSnapshot ?? remoteInputDispatch.snapshot);
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
  const currentNowPlayingHostSummary = $derived(
    nowPlayingHostSummary === undefined
      ? packageMountedHost
        ? createActiveHostSummary(packageMountedHost)
        : hostConnectionStore.snapshot.activeHostSummary
      : nowPlayingHostSummary
  );
  const currentVideoTvSnapshot = $derived(videoTvSnapshot ?? videoTvStore.snapshot);
  const isPackageMounted = $derived(packageMountedHost !== null);
  const isDashboardRoute = $derived(currentRoute.kind === 'dashboard');
  const isSettingsRoute = $derived(currentRoute.kind === 'settings');
  const isRemoteRoute = $derived(currentRoute.kind === 'remote');
  const isSettingsUnknownRoute = $derived(currentRoute.kind === 'settingsUnknown');
  const isAddonsRoute = $derived(currentRoute.kind === 'addons');
  const isAddonDetailRoute = $derived(currentRoute.kind === 'addonDetail');
  const isAddonsUnknownRoute = $derived(currentRoute.kind === 'addonsUnknown');
  const currentChorus2Placeholder = $derived(
    currentRoute.kind === 'chorus2Placeholder' ? currentRoute.placeholder : null
  );
  const isLabShortcutsRoute = $derived(currentRoute.kind === 'labShortcuts');
  const isLabApiBrowserRoute = $derived(currentRoute.kind === 'labApiBrowser');
  const isLabUnknownRoute = $derived(currentRoute.kind === 'labUnknown');
  const isNowPlayingRoute = $derived(currentRoute.kind === 'nowPlaying');
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
      input.kind === 'remote' ||
      input.kind === 'addons' ||
      input.kind === 'addonDetail' ||
      input.kind === 'addonsUnknown' ||
      input.kind === 'labShortcuts' ||
      input.kind === 'labApiBrowser' ||
      input.kind === 'labUnknown' ||
      input.kind === 'nowPlaying' ||
      input.kind === 'chorus2Placeholder'
    ) {
      return input;
    }

    if (input.kind === 'video') {
      return input;
    }

    return { kind: 'video', route: input };
  }

  function appHref(route: AppRoute): string {
    return buildAppRoute(route, {
      packageBasePath: isPackageMounted ? KODI_WEBINTERFACE_BASE_PATH : ''
    });
  }

  onMount(() => {
    if (packageMountedHost) {
      void connectionStore.connect(packageMountedHost);
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
{:else}
  <AppShell chrome={isPackageMounted ? 'media' : 'default'}>
    {#if !(isDashboardRoute && isPackageMounted)}
      <header class="hero" aria-labelledby="app-title">
        <div class="hero-copy">
          <p class="eyebrow">
            {currentI18n.t(isPackageMounted ? 'app.shell.packageEyebrow' : 'app.shell.eyebrow')}
          </p>
          <h1 id="app-title">{currentI18n.t('app.name')}</h1>
          <p class="lede">
            {currentI18n.t(isPackageMounted ? 'app.shell.packageLede' : 'app.shell.lede')}
          </p>
        </div>
        <div class="hero-actions">
          <LocaleToggle
            locale={currentLocaleSnapshot.locale}
            i18n={currentI18n}
            dispatch={localeDispatch}
          />
          <ThemeToggle i18n={currentI18n} />
        </div>
      </header>
    {/if}

    {#if isDashboardRoute && isPackageMounted}
      <div
        class="chorus-app"
        aria-label="Chorus media controller"
        style={`--c2-stage-art-url: url('${chorus2FanartUrl}'); --c2-thumb-url: url('${chorus2ThumbnailUrl}')`}
      >
        <header class="c2-topbar" aria-label="Chorus header">
          <a class="c2-logo" href={appHref({ kind: 'dashboard' })} aria-label="Kodi home">
            <img src={chorus2LogoUrl} alt="" />
          </a>

          <label class="c2-search" title="Search is deferred to the search route owner for the packaged shell.">
            <span class="mdi mdi-action-search" aria-hidden="true"></span>
            <span class="visually-hidden">Search Kodi</span>
            <input
              type="search"
              placeholder="Search deferred"
              aria-label="Search Kodi deferred"
              readonly
            />
          </label>

          <div class="c2-destination-tabs" aria-label="Playback destination">
            <button
              type="button"
              class="active"
              aria-label="Kodi playback destination selected"
              aria-disabled="true"
              disabled
            >
              <span class="c2-kodi-mark" aria-hidden="true">✣</span>
              Kodi
            </button>
            <button type="button" title="Local playback destination is deferred." disabled>
              <span class="mdi mdi-av-volume-up" aria-hidden="true"></span>
              Local
            </button>
            <button type="button" aria-label="Playlist menu" title="Playlist menu is deferred." disabled>
              <span class="mdi mdi-navigation-more-vert" aria-hidden="true"></span>
            </button>
            <button
              type="button"
              aria-label="Collapse playlist"
              title="Playlist collapse is deferred."
              disabled
            >
              <span class="mdi mdi-hardware-keyboard-arrow-right" aria-hidden="true"></span>
            </button>
          </div>
        </header>

        <aside class="c2-rail" aria-label="Primary navigation">
          <nav aria-label="Kodi sections">
            {#each shellRailItems as item}
              <a
                href={appHref(item.route)}
                class:active={item.activeOnDashboard && isDashboardRoute}
                aria-current={item.activeOnDashboard && isDashboardRoute ? 'page' : undefined}
                title={item.title}
              >
                <span class={`mdi ${item.icon}`} aria-hidden="true"></span>
                <span class="visually-hidden">{item.label}</span>
              </a>
            {/each}
          </nav>
        </aside>

        <main class="c2-stage" aria-label={currentI18n.t('app.dashboard.aria')}>
          <div class="c2-stage-art" aria-hidden="true"></div>
        </main>

        <aside class="c2-playlist" aria-label="Current playlist">
          <div class="c2-media-tabs" role="tablist" aria-label="Playlist media type">
            <button type="button" role="tab" class="active" aria-selected="true" disabled>Audio</button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              title="Video playlists are deferred."
              disabled
            >
              Video
            </button>
          </div>

          <div class="c2-playlist-menu" role="menu" aria-label="Playlist menu">
            <button type="button" role="menuitem" class="selected" aria-disabled="true" disabled>
              Current playlist
            </button>
            <button type="button" role="menuitem" disabled>Clear playlist</button>
            <button type="button" role="menuitem" title="Playlist refresh is deferred." disabled>
              Refresh playlist
            </button>
            <button type="button" role="menuitem" title="Party mode is deferred." disabled>
              Party mode
            </button>
            <button type="button" role="menuitem" class="selected" aria-disabled="true" disabled>
              Kodi
            </button>
            <button type="button" role="menuitem" title="Saving Kodi playlists is deferred." disabled>
              Save Kodi playlist
            </button>
          </div>
        </aside>

        <footer class="c2-player" aria-label="Playback controls">
          <div class="c2-player-controls">
            <button type="button" aria-label="Previous" onclick={() => playerDispatch.previous()}>
              <span class="mdi mdi-av-skip-previous" aria-hidden="true"></span>
            </button>
            <button
              type="button"
              aria-label="Play or pause"
              onclick={() => playerDispatch.playPause()}
            >
              <span class="mdi mdi-av-play-arrow" aria-hidden="true"></span>
            </button>
            <button type="button" aria-label="Next" onclick={() => playerDispatch.next()}>
              <span class="mdi mdi-av-skip-next" aria-hidden="true"></span>
            </button>
          </div>
          <div class="c2-thumb" aria-hidden="true"></div>
          <div class="c2-nowline">
            <strong>{dashboardMediaTitle(currentPlayerSnapshot)}</strong>
            <span>{dashboardMediaCreator(currentPlayerSnapshot)}</span>
            <div class="c2-progress" aria-hidden="true">
              <span style={`width: ${dashboardProgress(currentPlayerSnapshot)}%`}></span>
            </div>
          </div>
          <div class="c2-time" aria-label="Playback time">
            <span>{dashboardTime(currentPlayerSnapshot.time.currentSeconds)}</span>
            <span>{dashboardTime(currentPlayerSnapshot.time.totalSeconds)}</span>
          </div>
          <div class="c2-player-actions">
            <button
              type="button"
              aria-label="Toggle mute"
              onclick={() => playerDispatch.toggleMute()}
            >
              <span class="mdi mdi-av-volume-up" aria-hidden="true"></span>
            </button>
            <button type="button" aria-label="Shuffle" title="Shuffle is deferred for package proof." disabled>
              <span class="mdi mdi-av-shuffle" aria-hidden="true"></span>
            </button>
            <button type="button" aria-label="Fullscreen" onclick={toggleAppFullscreen}>
              <span class="mdi mdi-navigation-fullscreen" aria-hidden="true"></span>
            </button>
            <button type="button" aria-label="More" title="More playback actions are deferred." disabled>
              <span class="mdi mdi-navigation-more-vert" aria-hidden="true"></span>
            </button>
          </div>
        </footer>

        <LocalMediaRuntime />
      </div>
    {:else if isDashboardRoute}
      <main class="dashboard" aria-label={currentI18n.t('app.dashboard.aria')}>
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

        {#if !isPackageMounted}
          <div class="host-grid">
            <HostSettings i18n={currentI18n} />
            <HostSwitcher i18n={currentI18n} />
          </div>
        {/if}

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

        <LocalMediaRuntime />
        <NowPlayingPanel
          snapshot={currentPlayerSnapshot}
          dispatch={playerDispatch}
          localPlayerSnapshot={currentLocalSnapshot}
          i18n={currentI18n}
        />
        <QueuePanel snapshot={currentQueueSnapshot} dispatch={queueDispatch} i18n={currentI18n} />
      </main>
    {:else if currentChorus2Placeholder}
      <main class="parity-route" aria-label="Chorus2 parity placeholder">
        <ParityPlaceholder
          placeholder={currentChorus2Placeholder}
          packageBasePath={isPackageMounted ? KODI_WEBINTERFACE_BASE_PATH : ''}
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
                currentRoute.kind === 'settingsUnknown'
                  ? currentRoute.pathLabel
                  : '/settings/unknown'
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
        />
      </main>
    {:else if isVideoEpisodeDetailRoute}
      <main class="video-route" aria-label={currentI18n.t('app.route.videoEpisodeDetail.aria')}>
        <VideoEpisodeDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          actionDispatch={videoEpisodeActionDispatch}
          i18n={currentI18n}
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
            <a href={buildVideoRoute({ kind: 'videoMovies' })}>Movies</a>
            <a href={buildVideoRoute({ kind: 'videoTvShows' })}>TV shows</a>
          </nav>
        </section>
      </main>
    {/if}
  </AppShell>
{/if}

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

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('./lib/assets/chorus2/fonts/opensans/opensans-light-webfont.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('./lib/assets/chorus2/fonts/opensans/opensans-regular-webfont.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('./lib/assets/chorus2/fonts/opensans/opensans-semibold-webfont.woff2') format('woff2');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Material-Design-Icons';
    src: url('./lib/assets/chorus2/fonts/material/Material-Design-Icons.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }

  .chorus-app {
    --c2-blue: #4db3e6;
    --c2-header: #1d2021;
    --c2-dark: #181b1c;
    --c2-playlist: #2f3335;
    --c2-player: #17191a;
    position: relative;
    display: block;
    width: 100%;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
    padding: 0;
    color: #333;
    background: var(--c2-dark);
    font-family: 'Open Sans Chorus', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .mdi {
    font-family: 'Material-Design-Icons';
    font-style: normal;
    font-weight: 400;
    line-height: 1;
    speak: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .mdi-action-extension::before {
    content: '\e628';
  }
  .mdi-action-help::before {
    content: '\e633';
  }
  .mdi-action-search::before {
    content: '\e67f';
  }
  .mdi-action-settings::before {
    content: '\e680';
  }
  .mdi-action-thumb-up::before {
    content: '\e6a4';
  }
  .mdi-av-my-library-music::before {
    content: '\e6b3';
  }
  .mdi-av-play-arrow::before {
    content: '\e6b9';
  }
  .mdi-av-playlist-add::before {
    content: '\e6bc';
  }
  .mdi-av-shuffle::before {
    content: '\e6c5';
  }
  .mdi-av-skip-next::before {
    content: '\e6c6';
  }
  .mdi-av-skip-previous::before {
    content: '\e6c7';
  }
  .mdi-av-volume-up::before {
    content: '\e6d2';
  }
  .mdi-editor-format-list-bulleted::before {
    content: '\e783';
  }
  .mdi-hardware-keyboard-arrow-right::before {
    content: '\e7b6';
  }
  .mdi-hardware-tv::before {
    content: '\e7d0';
  }
  .mdi-image-movie-creation::before {
    content: '\e833';
  }
  .mdi-navigation-fullscreen::before {
    content: '\e89f';
  }
  .mdi-navigation-more-vert::before {
    content: '\e8a3';
  }

  .c2-topbar {
    position: absolute;
    inset: 0 0 auto;
    z-index: 20;
    height: 50px;
    background: var(--c2-header);
  }

  .c2-logo {
    position: absolute;
    inset: 0 auto auto 0;
    display: grid;
    place-items: center;
    width: 50px;
    height: 50px;
    overflow: hidden;
    text-decoration: none;
  }

  .c2-logo img {
    display: block;
    width: 181px;
    max-width: none;
    height: 50px;
    filter: brightness(0) saturate(100%) invert(62%) sepia(67%) saturate(1543%) hue-rotate(165deg)
      brightness(96%) contrast(88%);
    transform: translateX(-128px);
  }

  .c2-search {
    position: absolute;
    top: 0;
    right: 300px;
    display: grid;
    grid-template-columns: 42px 1fr;
    align-items: center;
    width: 205px;
    height: 50px;
    color: #565b5f;
    background: #f0f0f0;
  }

  .c2-search .mdi {
    justify-self: center;
    font-size: 20px;
  }

  .c2-search input {
    width: 100%;
    height: 50px;
    padding: 0;
    color: #333;
    background: transparent;
    border: 0;
    outline: 0;
  }

  .c2-destination-tabs {
    position: absolute;
    top: 0;
    right: 0;
    display: grid;
    grid-template-columns: 95px 120px 42px 43px;
    width: 300px;
    height: 50px;
  }

  .c2-destination-tabs button,
  .c2-media-tabs button,
  .c2-playlist-menu button,
  .c2-player button {
    font: inherit;
    border: 0;
    border-radius: 0;
    cursor: pointer;
  }

  .c2-destination-tabs button:disabled,
  .c2-media-tabs button:disabled,
  .c2-playlist-menu button:disabled,
  .c2-player button:disabled {
    cursor: default;
  }

  .c2-destination-tabs button {
    display: inline-grid;
    grid-auto-flow: column;
    gap: 7px;
    align-items: center;
    justify-content: center;
    min-width: 0;
    color: #c8c8c8;
    background: #292d2f;
  }

  .c2-destination-tabs button.active {
    color: var(--c2-blue);
    background: #1f2223;
  }

  .c2-destination-tabs button:nth-child(3),
  .c2-destination-tabs button:nth-child(4) {
    color: #888;
    font-size: 20px;
  }

  .c2-kodi-mark {
    color: var(--c2-blue);
    font-size: 16px;
    line-height: 1;
  }

  .c2-rail {
    position: absolute;
    top: 50px;
    bottom: 60px;
    left: 0;
    z-index: 10;
    width: 50px;
    background: #fff;
    box-shadow: inset -1px 0 0 rgb(0 0 0 / 0.05);
  }

  .c2-rail nav {
    display: grid;
    align-content: start;
    padding-top: 10px;
  }

  .c2-rail a {
    position: relative;
    display: grid;
    place-items: center;
    width: 50px;
    height: 39px;
    color: #303336;
    font-size: 23px;
    text-decoration: none;
  }

  .c2-rail a.active,
  .c2-rail a:hover {
    color: #fff;
    background: var(--c2-blue);
  }

  .c2-rail a.active::after,
  .c2-rail a:hover::after {
    position: absolute;
    left: 50px;
    top: 0;
    height: 39px;
    padding: 0 22px 0 19px;
    color: #fff;
    background: var(--c2-blue);
    content: attr(title);
    font-size: 15px;
    font-weight: 600;
    line-height: 39px;
    white-space: nowrap;
  }

  .c2-stage {
    position: absolute;
    top: 50px;
    right: 300px;
    bottom: 60px;
    left: 50px;
    overflow: hidden;
    background: #1a1c1d;
  }

  .c2-stage-art {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgb(20 22 23 / 0.36), rgb(20 22 23 / 0.18) 52%, rgb(20 22 23 / 0.04)),
      var(--c2-stage-art-url) center bottom / cover no-repeat;
  }

  .c2-playlist {
    position: absolute;
    top: 50px;
    right: 0;
    bottom: 60px;
    z-index: 8;
    width: 300px;
    background: var(--c2-playlist);
  }

  .c2-media-tabs {
    display: grid;
    grid-template-columns: 70px 70px 1fr;
    height: 28px;
    background: #242728;
  }

  .c2-media-tabs button {
    color: #888;
    background: #3d4143;
    font-size: 12px;
    text-align: center;
  }

  .c2-media-tabs button.active {
    color: #fff;
    background: #4d5153;
  }

  .c2-playlist-menu {
    position: absolute;
    top: -17px;
    right: 45px;
    z-index: 25;
    display: grid;
    width: 165px;
    padding: 0;
    background: #f4f4f4;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
  }

  .c2-playlist-menu button {
    height: 32px;
    padding: 0 13px;
    color: #858585;
    background: #f4f4f4;
    font-size: 13px;
    text-align: left;
  }

  .c2-playlist-menu button.selected {
    background: #d8d8d8;
  }

  .c2-playlist-menu button:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .c2-player {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 30;
    display: grid;
    grid-template-columns: 170px 70px minmax(0, 1fr) 56px 305px;
    height: 60px;
    color: #cfcfcf;
    background: var(--c2-player);
  }

  .c2-player-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: #202324;
  }

  .c2-player button {
    display: grid;
    place-items: center;
    min-width: 0;
    color: #8f9395;
    background: transparent;
  }

  .c2-player button:hover:not(:disabled) {
    color: #fff;
    background: #35393a;
  }

  .c2-player button:disabled {
    opacity: 0.55;
  }

  .c2-player-controls button {
    font-size: 32px;
  }

  .c2-player-controls button:nth-child(2) {
    font-size: 44px;
  }

  .c2-thumb {
    background:
      linear-gradient(rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.14)),
      var(--c2-thumb-url) center / cover no-repeat;
  }

  .c2-nowline {
    position: relative;
    display: grid;
    align-content: center;
    gap: 2px;
    min-width: 0;
    padding: 0 12px;
    background: #191c1d;
  }

  .c2-nowline strong,
  .c2-nowline span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .c2-nowline strong {
    color: #e2e2e2;
    font-size: 12px;
    font-weight: 600;
  }

  .c2-nowline span {
    color: #8e9498;
    font-size: 11px;
  }

  .c2-progress {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: #2d3032;
  }

  .c2-progress span {
    display: block;
    height: 100%;
    background: var(--c2-blue);
  }

  .c2-time {
    display: grid;
    align-content: center;
    justify-items: end;
    gap: 2px;
    padding-right: 9px;
    color: #fff;
    background: #191c1d;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .c2-player-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #3d4143;
  }

  .c2-player-actions button {
    font-size: 24px;
  }

  @media (max-width: 760px) {
    .c2-search {
      right: 0;
      width: 190px;
    }

    .c2-destination-tabs,
    .c2-playlist,
    .c2-playlist-menu {
      display: none;
    }

    .c2-stage {
      right: 0;
    }

    .c2-player {
      grid-template-columns: 150px 60px minmax(0, 1fr);
    }

    .c2-time,
    .c2-player-actions {
      display: none;
    }
  }
</style>
