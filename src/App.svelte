<script lang="ts">
  import { onMount } from 'svelte';

  import AddonDetailShell, { type AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import AddonsPanel, { type AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import AmbientAppShell from '$components/AppShell.svelte';
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
    type AppRoute,
    type PrimaryAppRoute
  } from '$lib/app/appRouter';
  import PrimaryAppShell from '$lib/app-shell/AppShell.svelte';
  import PageFrame from '$lib/app-shell/PageFrame.svelte';
  import { createAppNavigationItems } from '$lib/app-shell/appNavigation';
  import type { AppShellPlayerSnapshot } from '$lib/app-shell/appShellTypes';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
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
  const currentPrimaryRoute = $derived(currentRoute.kind === 'primary' ? currentRoute.route : null);
  const currentPrimaryShellRoute = $derived<PrimaryRoute | null>(
    currentPrimaryRoute ?? (currentRoute.kind === 'dashboard' ? { kind: 'home' } : null)
  );
  const currentVideoRoute = $derived(
    currentRoute.kind === 'video'
      ? currentRoute.route
      : primaryRouteToVideoRoute(currentPrimaryRoute)
  );
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
  const isPrimaryShellRoute = $derived(currentPrimaryShellRoute !== null);
  const currentShellNavigationItems = $derived(
    createAppNavigationItems({
      packageBasePath: isPackageMounted ? KODI_WEBINTERFACE_BASE_PATH : '',
      activeRoute: currentPrimaryShellRoute
    })
  );
  const currentShellPlayer = $derived(toAppShellPlayerSnapshot(currentPlayerSnapshot));
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
  const currentChorus2Placeholder = $derived(
    currentRoute.kind === 'chorus2Placeholder'
      ? currentRoute.placeholder
      : primaryRouteToPlaceholder(currentPrimaryRoute)
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
      input.kind === 'primary' ||
      input.kind === 'chorus2Placeholder'
    ) {
      return input;
    }

    if (input.kind === 'video') {
      return input;
    }

    return { kind: 'video', route: input };
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

  function primaryRouteToPlaceholder(primaryRoute: PrimaryAppRoute['route'] | null) {
    if (!primaryRoute) {
      return null;
    }

    if (primaryRoute.kind === 'pvrTv') {
      return getChorus2PlaceholderMetadata('pvrTv') ?? null;
    }

    if (primaryRoute.kind === 'pvrRadio') {
      return getChorus2PlaceholderMetadata('pvrRadio') ?? null;
    }

    if (primaryRoute.kind === 'pvrRecordings') {
      return getChorus2PlaceholderMetadata('pvrRecordings') ?? null;
    }

    return null;
  }

  function primaryRouteTitle(route: PrimaryRoute | null): string {
    if (!route) {
      return 'Home';
    }

    const titles: Partial<Record<PrimaryRoute['kind'], string>> = {
      home: 'Home',
      music: 'Music',
      musicTop: 'Top music',
      musicArtists: 'Artists',
      musicAlbums: 'Albums',
      musicGenres: 'Genres',
      musicAlbumDetail: 'Album detail',
      musicArtistDetail: 'Artist detail',
      musicGenreDetail: 'Genre detail',
      movies: 'Movies',
      moviesRecent: 'Recent movies',
      movieDetail: 'Movie detail',
      tvshows: 'TV shows',
      tvshowsRecent: 'Recent TV shows',
      tvshowDetail: 'TV show detail',
      tvshowSeasonDetail: 'Season detail',
      tvshowEpisodeDetail: 'Episode detail',
      browser: 'Browser',
      browserItem: 'Browser item',
      addonsAll: 'Add-ons',
      addonsVideo: 'Video add-ons',
      addonsAudio: 'Audio add-ons',
      addonsExecutable: 'Executable add-ons',
      addonExecute: 'Execute add-on',
      playlists: 'Playlists',
      playlistDetail: 'Playlist detail',
      settingsWeb: 'Web settings',
      settingsKodi: 'Kodi settings',
      settingsKodiSection: 'Kodi settings section',
      settingsAddons: 'Add-on settings',
      settingsNav: 'Navigation settings',
      settingsSearch: 'Search settings',
      help: 'Help',
      helpOverview: 'Help overview',
      helpPage: 'Help page',
      remote: 'Remote',
      search: 'Search',
      searchMedia: 'Media search',
      thumbsup: 'Thumbs up',
      pvrTv: 'PVR TV',
      pvrRadio: 'PVR Radio',
      pvrRecordings: 'PVR recordings'
    };

    return titles[route.kind] ?? 'Chorus route';
  }

  function primaryRouteDescription(route: PrimaryRoute | null): string {
    if (!route || route.kind === 'home') {
      return 'chorus3 home: a package-safe Chorus media controller home stage for direct root loads.';
    }

    if (route.kind === 'music') {
      return 'Browse music library, discovery, search, files, and playlist surfaces through the app shell.';
    }

    if (route.kind === 'movies') {
      return 'Browse movie library surfaces without falling back to setup or unknown-route UI.';
    }

    if (route.kind === 'tvshows') {
      return 'Browse TV library surfaces without falling back to setup or unknown-route UI.';
    }

    if (route.kind === 'remote') {
      return 'Send safe Kodi remote input and playback commands from the primary app shell.';
    }

    if (route.kind === 'addonsAll') {
      return 'Inspect installed add-ons and write-state diagnostics inside the primary app shell.';
    }

    if (route.kind === 'settingsWeb') {
      return 'Manage Kodi settings through the primary app shell without exposing host setup as the root default.';
    }

    if (route.kind === 'browser') {
      return 'Browse media sources in an app-native frame while deeper browser parity lands in later slices.';
    }

    if (route.kind === 'playlists') {
      return 'Browse media playlists in an app-native frame while fuller playlist parity remains deferred.';
    }

    return 'This supported primary route is wired to an app-native shell frame; fuller behavior can land without changing the route boundary.';
  }

  function primaryRouteDeferredMessage(route: PrimaryRoute | null): string {
    if (!route) {
      return '';
    }

    const implemented = new Set<PrimaryRoute['kind']>([
      'home',
      'music',
      'movies',
      'tvshows',
      'browser',
      'addonsAll',
      'playlists',
      'settingsWeb',
      'remote'
    ]);

    return implemented.has(route.kind)
      ? ''
      : 'Detailed parity for this route is deferred, but the route itself is supported by the primary app shell.';
  }

  function parsePositiveSafeInteger(value: string): number | null {
    if (!/^\d+$/u.test(value)) {
      return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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

  function toAppShellPlayerSnapshot(value: PlayerStoreSnapshot): AppShellPlayerSnapshot {
    return {
      title: dashboardMediaTitle(value),
      subtitle: dashboardMediaCreator(value),
      currentTime: dashboardTime(value.time.currentSeconds),
      totalTime: dashboardTime(value.time.totalSeconds),
      progressPercent: dashboardProgress(value)
    };
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
{:else if isPrimaryShellRoute}
  <PrimaryAppShell
    routeIdentity={{ kind: 'primary', route: currentPrimaryShellRoute ?? { kind: 'home' } }}
    navigationItems={currentShellNavigationItems}
    stageLabel={primaryRouteTitle(currentPrimaryShellRoute)}
    logoHref={buildAppRoute(
      { kind: 'primary', route: { kind: 'home' } },
      { packageBasePath: isPackageMounted ? KODI_WEBINTERFACE_BASE_PATH : '' }
    )}
    player={currentShellPlayer}
    playerActions={{
      previous: () => playerDispatch.previous(),
      playPause: () => playerDispatch.playPause(),
      next: () => playerDispatch.next(),
      toggleMute: () => playerDispatch.toggleMute(),
      fullscreen: toggleAppFullscreen
    }}
  >
    <PageFrame
      title={primaryRouteTitle(currentPrimaryShellRoute)}
      eyebrow="Primary route"
      description={primaryRouteDescription(currentPrimaryShellRoute)}
      deferredMessage={primaryRouteDeferredMessage(currentPrimaryShellRoute)}
    >
      {#if currentPrimaryShellRoute?.kind === 'home'}
        <div class="hero-actions">
          <LocaleToggle
            locale={currentLocaleSnapshot.locale}
            i18n={currentI18n}
            dispatch={localeDispatch}
          />
          <ThemeToggle i18n={currentI18n} />
        </div>
        <section class="mission surface" aria-labelledby="primary-home-status-title">
          <p class="section-kicker">Runtime surface</p>
          <h3 id="primary-home-status-title">
            {packageMountedHost?.label ??
              configStore.snapshot.activeHost?.label ??
              currentI18n.t('app.mission.noHost')}
          </h3>
          <p>{currentI18n.t('app.mission.description')}</p>
          {#if configStore.snapshot.storageWarning}
            <p>{configStore.snapshot.storageWarning.message}</p>
          {/if}
        </section>
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
        <QueuePanel snapshot={currentQueueSnapshot} dispatch={queueDispatch} i18n={currentI18n} />
      {:else if currentPrimaryShellRoute?.kind === 'music'}
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
      {:else if currentPrimaryShellRoute?.kind === 'movies' || currentPrimaryShellRoute?.kind === 'moviesRecent'}
        <VideoMoviesPanel snapshot={currentVideoLibrarySnapshot} />
        <VideoRecentPanel snapshot={currentVideoLibrarySnapshot} i18n={currentI18n} />
        <MediaPlaylistsPanel
          snapshot={currentVideoMediaPlaylistsSnapshot}
          dispatch={videoMediaPlaylistsDispatch}
          actionDispatch={videoMediaPlaylistsActionDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'movieDetail'}
        <VideoMovieDetailShell
          snapshot={currentVideoLibrarySnapshot}
          route={currentRenderableVideoRoute}
          detailSnapshot={videoMovieDetailSnapshot}
          actionDispatch={videoMovieActionDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'tvshows' || currentPrimaryShellRoute?.kind === 'tvshowsRecent'}
        <VideoTvShowsPanel snapshot={currentVideoLibrarySnapshot} />
        <VideoRecentPanel snapshot={currentVideoLibrarySnapshot} i18n={currentI18n} />
      {:else if currentPrimaryShellRoute?.kind === 'tvshowDetail'}
        <VideoTvShowDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'tvshowSeasonDetail'}
        <VideoSeasonDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          artworkDispatch={videoSeasonArtworkDispatch}
          writeDispatch={videoSeasonWriteDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'tvshowEpisodeDetail'}
        <VideoEpisodeDetailShell
          snapshot={currentVideoTvSnapshot}
          route={currentRenderableVideoRoute}
          actionDispatch={videoEpisodeActionDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'browser'}
        <MediaFilesPanel
          snapshot={currentMediaFilesSnapshot}
          dispatch={mediaFilesDispatch}
          actionDispatch={mediaFilesActionDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'playlists'}
        <MediaPlaylistsPanel
          snapshot={currentMediaPlaylistsSnapshot}
          dispatch={mediaPlaylistsDispatch}
          actionDispatch={mediaPlaylistsActionDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'addonsAll'}
        <AddonsPanel
          snapshot={currentAddonsSnapshot}
          dispatch={addonsDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'settingsWeb'}
        <SettingsPanel
          snapshot={currentSettingsSnapshot}
          dispatch={settingsDispatch}
          i18n={currentI18n}
        />
      {:else if currentPrimaryShellRoute?.kind === 'remote'}
        <RemoteInputPanel
          remoteSnapshot={currentRemoteSnapshot}
          {remoteInputDispatch}
          playerSnapshot={currentPlayerSnapshot}
          {playerDispatch}
          i18n={currentI18n}
        />
      {:else if currentChorus2Placeholder}
        <ParityPlaceholder
          placeholder={currentChorus2Placeholder}
          packageBasePath={isPackageMounted ? KODI_WEBINTERFACE_BASE_PATH : ''}
          i18n={currentI18n}
        />
      {/if}
    </PageFrame>

    {#snippet localRuntime()}
      <LocalMediaRuntime />
    {/snippet}
  </PrimaryAppShell>
{:else}
  <AmbientAppShell chrome={isPackageMounted ? 'media' : 'default'}>
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

    {#if isDashboardRoute}
      <PrimaryAppShell
        routeIdentity={{ kind: 'primary', route: { kind: 'home' } }}
        navigationItems={currentShellNavigationItems}
        stageLabel={currentI18n.t('app.dashboard.aria')}
        logoHref={buildAppRoute(
          { kind: 'primary', route: { kind: 'home' } },
          { packageBasePath: isPackageMounted ? KODI_WEBINTERFACE_BASE_PATH : '' }
        )}
        player={currentShellPlayer}
        playerActions={{
          previous: () => playerDispatch.previous(),
          playPause: () => playerDispatch.playPause(),
          next: () => playerDispatch.next(),
          toggleMute: () => playerDispatch.toggleMute(),
          fullscreen: toggleAppFullscreen
        }}
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

        {#snippet localRuntime()}
          <LocalMediaRuntime />
        {/snippet}
      </PrimaryAppShell>
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
  </AmbientAppShell>
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
</style>
