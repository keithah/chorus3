<script lang="ts">
  import {
    buildAppRoute,
    buildKodiPackageSafePrimaryAppRoute,
    type AppRoute,
    type BuildAppRouteOptions
  } from '$lib/app/appRouter';
  import './libraryPageClassic.css';
  import LibraryClassicView from './LibraryClassicView.svelte';
  import {
    libraryFilterStore,
    type LibraryFilterOption,
    type LibraryParsedFilterField
  } from '$lib/stores/libraryFilter';
  import { getVideoLibraryMusicVideoDetails, refreshVideoLibraryMovie } from '$lib/kodi';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import { createActiveKodiJsonRpcHttpClient } from '$lib/stores/kodiClient';
  import { configStore } from '$lib/stores/config.svelte';
  import { prepareLocalStreamUrl } from '$lib/stores/localPlayer.svelte';
  import { normalizeVideoMusicVideos } from '$lib/stores/videoLibraryNormalization';
  import type { VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';
  import { defaultEpisodeCollectionActionDispatch } from '$lib/stores/episodeCollectionActions';
  import type {
    LocalPlaylistDispatch,
    LocalPlaylistItemInput,
    LocalPlaylistStoreSnapshot
  } from '$lib/stores/localPlaylist.svelte';
  import type { ThumbsUpDispatch } from '$lib/stores/thumbsUp.svelte';
  import type { MusicLibraryStoreSnapshot } from '$lib/stores/musicLibrary.svelte';
  import { MusicDetailRouteStore } from '$lib/stores/musicDetailRouteStore.svelte';
  import type {
    VideoMusicVideoSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import type {
    EpisodePlaybackItem,
    MoviePlaybackItem,
    MusicVideoPlaybackItem,
    MusicPlaybackItem
  } from '$lib/stores/playerDispatch.svelte';
  import type {
    EpisodeQueueItem,
    LibraryQueueItem,
    MovieQueueItem,
    MusicQueueItem,
    MusicVideoQueueItem
  } from '$lib/stores/queue.svelte';
  import {
    displayTitleForMetadataEditor,
    metadataEditorDefinitionForAction,
    metadataEditorIdForAction,
    type MetadataEditableAction,
    type MetadataEditorDefinition,
    type MetadataEditorPayload
  } from '$lib/metadata/metadataEditor';
  import { type LibraryCard } from '$lib/app-pages/libraryCards';
  import {
    browserPlayableAction,
    browserPlayerRouteForAction,
    downloadableAction,
    downloadActionKey,
    localPlaylistAction,
    localPlaylistActionKey,
    thumbsUpItem,
    toMusicActionPayload,
    type DownloadableCardAction,
    type LocalPlaylistCardAction
  } from '$lib/app-pages/libraryCardActions';
  import { libraryContentSections } from '$lib/app-pages/libraryContentSections';
  import {
    resolveLibraryDownloadFile,
    resolveLibraryLocalPlaylistItems
  } from '$lib/app-pages/libraryMediaFileActions';
  import { movieCard, type MovieDetailSource } from '$lib/app-pages/libraryMovieCards';
  import {
    availableFiltersForRoute,
    type LibraryRoute,
    routeFamily,
    routeFilterPath,
    sectionNav
  } from '$lib/app-pages/libraryRouteFilters';
  import {
    currentLibraryFilterSearchParams,
    replaceLibraryFilterUrl
  } from '$lib/app-pages/libraryFilterUrl';
  import {
    safeLibraryActionErrorMessage,
    startBrowserDownload
  } from '$lib/app-pages/libraryPageBrowserActions';
  import { createLibraryPageFilters } from '$lib/app-pages/libraryPageFiltering';
  import { createTvShowMetadataSourceResolver } from '$lib/metadata/tvShowMetadataSource';

  interface Props {
    route: LibraryRoute;
    musicLibrarySnapshot: MusicLibraryStoreSnapshot;
    videoLibrarySnapshot: VideoLibraryStoreSnapshot;
    localPlaylistSnapshot?: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch?: LocalPlaylistDispatch;
    thumbsUpDispatch?: ThumbsUpDispatch;
    videoMovieDetailSnapshot?: VideoMovieDetailStoreSnapshot;
    videoTvSnapshot?: VideoTvStoreSnapshot;
    playerDispatch: PlayerControlsDispatch & {
      setMode?: (mode: 'kodi' | 'local') => void;
      playMusicItem?: (item: MusicPlaybackItem) => Promise<void> | void;
      playMovieItem?: (item: MoviePlaybackItem) => Promise<void> | void;
      playEpisodeItem?: (item: EpisodePlaybackItem) => Promise<void> | void;
      playMusicVideoItem?: (item: MusicVideoPlaybackItem) => Promise<void> | void;
      streamMovieItem?: (item: MoviePlaybackItem) => Promise<void> | void;
      streamEpisodeItem?: (item: EpisodePlaybackItem) => Promise<void> | void;
      streamMusicVideoItem?: (item: MusicVideoPlaybackItem) => Promise<void> | void;
    };
    queueDispatch: QueuePanelDispatch & {
      queueMusicItem?: (item: MusicQueueItem) => Promise<void> | void;
      queueMovieItem?: (item: MovieQueueItem) => Promise<void> | void;
      queueEpisodeItem?: (item: EpisodeQueueItem) => Promise<void> | void;
      queueMusicVideoItem?: (item: MusicVideoQueueItem) => Promise<void> | void;
      queueLibraryItems?: (items: readonly LibraryQueueItem[]) => Promise<void> | void;
    };
    buildOptions?: BuildAppRouteOptions;
  }

  type Card = LibraryCard;
  type MetadataEditTarget = {
    key: string;
    action: MetadataEditableAction;
    definition: MetadataEditorDefinition;
    source: Record<string, unknown>;
  };

  let {
    route,
    musicLibrarySnapshot,
    videoLibrarySnapshot,
    localPlaylistSnapshot,
    localPlaylistDispatch,
    thumbsUpDispatch,
    videoMovieDetailSnapshot,
    videoTvSnapshot,
    playerDispatch,
    queueDispatch,
    buildOptions = {}
  }: Props = $props();

  let musicVideoDetailsById = $state<Record<number, VideoMusicVideoSnapshot>>({});
  let missingMusicVideoDetailIds = $state<Record<number, true>>({});
  let loadingMusicVideoDetailIds = $state<Record<number, true>>({});
  let actionStatus = $state('');
  let pendingDownloadKey = $state<string | null>(null);
  let pendingMovieMoreActionKey = $state<string | null>(null);
  let pendingLocalPlaylistKey = $state<string | null>(null);
  let pendingSelectedAction = $state<'play' | 'queue' | 'localadd' | null>(null);
  let pendingEditKey = $state<string | null>(null);
  let metadataEditTarget = $state<MetadataEditTarget | null>(null);
  let metadataEditError = $state<string | null>(null);
  let selectedCardKeys = $state<Set<string>>(new Set());
  let openMovieMoreId = $state<number | null>(null);
  let filterRevision = $state(0);
  let filterPane: 'normal' | 'filters' | 'options' = $state('normal');
  let selectedFilterKey = $state<string | null>(null);
  let optionSearch = $state('');
  let initializedFilterPath = $state('');
  const musicDetailRouteStore = new MusicDetailRouteStore({
    createClient: createActiveKodiJsonRpcHttpClient
  });

  const family = $derived(routeFamily(route));
  const navItems = $derived(sectionNav(route));
  const filterPath = $derived(routeFilterPath(route));
  const availableFilters = $derived(availableFiltersForRoute(route));
  const libraryPageFilters = $derived(
    createLibraryPageFilters({
      filterPath,
      store: libraryFilterStore,
      thumbsUpDispatch
    })
  );
  const tvShowMetadataSourceResolver = createTvShowMetadataSourceResolver({
    snapshot: () => videoTvSnapshot,
    createClient: createActiveKodiJsonRpcHttpClient
  });
  const activeFilters = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    return libraryFilterStore.getFilterActive(filterPath);
  });
  const sortableFilters = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    return libraryFilterStore.getSortableEntities(filterPath);
  });
  const filterableFilters = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    return libraryFilterStore.getFilterableEntities(filterPath);
  });
  const selectedFilterOptionsAll = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    if (!selectedFilterKey) return [];
    return libraryPageFilters.optionsForRoute(
      route,
      selectedFilterKey,
      musicLibrarySnapshot,
      videoLibrarySnapshot
    );
  });
  const selectedFilterOptions = $derived.by(() => {
    const query = optionSearch.trim().toLowerCase();
    if (!query) return selectedFilterOptionsAll;
    return selectedFilterOptionsAll.filter((option) => option.title.toLowerCase().includes(query));
  });
  const sections = $derived.by(() => {
    void filterRevision;
    return libraryContentSections({
      route,
      music: musicLibrarySnapshot,
      video: videoLibrarySnapshot,
      movieDetail: videoMovieDetailSnapshot,
      musicVideoDetailsById,
      missingMusicVideoDetailIds,
      loadingMusicVideoDetailIds,
      filters: libraryPageFilters
    });
  });
  const cardsByKey = $derived.by(() => {
    const cards = new Map<string, LibraryCard>();
    for (const section of sections) {
      for (const card of section.cards) {
        cards.set(card.key, card);
      }
    }
    return cards;
  });
  const selectedCards = $derived.by(() =>
    [...selectedCardKeys].flatMap((key) => {
      const card = cardsByKey.get(key);
      return card ? [card] : [];
    })
  );
  const selectedPlaylistCards = $derived(
    selectedCards.filter((card) => localPlaylistAction(card.action))
  );
  const hasSelectedCards = $derived(selectedCards.length > 0);

  $effect(() => {
    ensureFilterAvailable();
    initializeFiltersFromCurrentUrl();
    if (!availableFilters.filter.includes(selectedFilterKey ?? '')) {
      selectedFilterKey = null;
      filterPane = filterPane === 'options' ? 'normal' : filterPane;
    }
  });

  $effect(() => {
    if (route.kind === 'musicVideoDetail') {
      const musicvideoid = Number(route.musicvideoid);
      if (Number.isSafeInteger(musicvideoid) && musicvideoid > 0) {
        void loadMusicVideoDetail(musicvideoid);
      }
    }
  });

  function ensureFilterAvailable(): void {
    libraryFilterStore.setAvailable(filterPath, availableFilters);
  }

  function initializeFiltersFromCurrentUrl(): void {
    if (initializedFilterPath === filterPath) return;
    initializedFilterPath = filterPath;
    const params = currentLibraryFilterSearchParams(
      typeof window === 'undefined' ? null : window.location
    );
    if ([...params.keys()].length > 0) {
      libraryFilterStore.initFromParams(filterPath, availableFilters, params);
    } else {
      libraryFilterStore.setStoreFilters(filterPath, {});
    }
    filterRevision += 1;
  }

  function movieDetailCard(movie: MovieDetailSource): Card {
    return movieCard(movie);
  }

  async function playMovieDetail(movie: MovieDetailSource): Promise<void> {
    await playCard(movieDetailCard(movie));
  }

  async function queueMovieDetail(movie: MovieDetailSource): Promise<void> {
    await queueCard(movieDetailCard(movie));
  }

  async function streamMovieDetail(movie: MovieDetailSource): Promise<void> {
    await playCardInBrowser(movieDetailCard(movie));
  }

  async function downloadMovieDetail(movie: MovieDetailSource): Promise<void> {
    openMovieMoreId = null;
    await downloadCard(movieDetailCard(movie));
  }

  async function refreshMovieDetail(movie: MovieDetailSource): Promise<void> {
    const movieid = movie.movieid;
    if (!Number.isSafeInteger(movieid) || movieid <= 0) return;

    openMovieMoreId = null;
    pendingMovieMoreActionKey = `refresh:${movieid}`;
    actionStatus = `Refreshing ${safe(movie.title ?? movie.label, 'movie')}...`;

    try {
      const client = createActiveKodiJsonRpcHttpClient();
      if (!client) {
        throw new Error('Choose an active Kodi host before refreshing media.');
      }

      await refreshVideoLibraryMovie(client, { movieid });
      actionStatus = `Refresh requested for ${safe(movie.title ?? movie.label, 'movie')}.`;
    } catch (error) {
      actionStatus = `Could not refresh ${safe(movie.title ?? movie.label, 'movie')}. ${safeLibraryActionErrorMessage(error)}`;
    } finally {
      pendingMovieMoreActionKey = null;
    }
  }

  function editMovieMetadata(movie: MovieDetailSource): void {
    openMovieMoreId = null;
    void openMetadataEditor(movieDetailCard(movie));
  }

  function selectSort(method: string, order: 'asc' | 'desc'): void {
    libraryFilterStore.setStoreSort(filterPath, method, order);
    filterRevision += 1;
    syncFilterUrl();
  }

  function openFilterPane(): void {
    filterPane = 'filters';
    selectedFilterKey = null;
    optionSearch = '';
  }

  function closeFilterPane(): void {
    filterPane = 'normal';
    selectedFilterKey = null;
    optionSearch = '';
  }

  function selectFilter(filter: LibraryParsedFilterField): void {
    if (filter.type === 'boolean') {
      libraryFilterStore.toggleStoreFiltersKey(filterPath, filter.key, filter.alias);
      filterRevision += 1;
      syncFilterUrl();
      return;
    }

    selectedFilterKey = filter.key;
    optionSearch = '';
    filterPane = 'options';
  }

  function closeOptionsPane(): void {
    selectedFilterKey = null;
    optionSearch = '';
    filterPane = 'filters';
  }

  function toggleFilterOption(option: LibraryFilterOption): void {
    libraryFilterStore.toggleStoreFiltersKey(filterPath, option.key, option.value);
    filterRevision += 1;
    syncFilterUrl();
  }

  function removeFilter(key: string): void {
    libraryFilterStore.updateStoreFiltersKey(filterPath, key, []);
    filterRevision += 1;
    syncFilterUrl();
  }

  function deselectCurrentFilterOptions(): void {
    if (!selectedFilterKey) return;
    libraryFilterStore.updateStoreFiltersKey(filterPath, selectedFilterKey, []);
    filterRevision += 1;
    syncFilterUrl();
  }

  function removeAllFilters(): void {
    libraryFilterStore.setStoreFilters(filterPath, {});
    filterPane = 'normal';
    selectedFilterKey = null;
    optionSearch = '';
    filterRevision += 1;
    syncFilterUrl();
  }

  function syncFilterUrl(): void {
    if (typeof window === 'undefined') return;
    replaceLibraryFilterUrl({
      routeHref: hrefFor(route),
      availableFilters,
      filters: libraryFilterStore.getStoreFilters(filterPath),
      sort: libraryFilterStore.getStoreSort(filterPath),
      history: window.history
    });
  }

  function hrefFor(target: PrimaryRoute): string {
    return buildKodiPackageSafePrimaryAppRoute(target, buildOptions);
  }

  function cardHref(card: Card): string | null {
    return card.route ? hrefFor(card.route) : null;
  }

  async function playCard(card: Card): Promise<void> {
    const action = card.action;
    if (!action) return;

    if (action.media === 'music') {
      await playerDispatch.playMusicItem?.(toMusicActionPayload(action));
      return;
    }

    if (action.media === 'movie') {
      await playerDispatch.playMovieItem?.({ movieid: action.movieid });
      return;
    }

    if (action.media === 'episode') {
      await playerDispatch.playEpisodeItem?.({ episodeid: action.episodeid });
      return;
    }

    if (action.media === 'tvshow') {
      await playTvShowCollection(card, action.tvshowid);
      return;
    }

    if (action.media === 'musicvideo') {
      await playerDispatch.playMusicVideoItem?.({ musicvideoid: action.musicvideoid });
    }
  }

  async function queueCard(card: Card): Promise<void> {
    const action = card.action;
    if (!action) return;

    if (action.media === 'music') {
      await queueDispatch.queueMusicItem?.(toMusicActionPayload(action));
      return;
    }

    if (action.media === 'movie') {
      await queueDispatch.queueMovieItem?.({ movieid: action.movieid });
      return;
    }

    if (action.media === 'episode') {
      await queueDispatch.queueEpisodeItem?.({ episodeid: action.episodeid });
      return;
    }

    if (action.media === 'tvshow') {
      await queueTvShowCollection(card, action.tvshowid);
      return;
    }

    if (action.media === 'musicvideo') {
      await queueDispatch.queueMusicVideoItem?.({ musicvideoid: action.musicvideoid });
    }
  }

  async function playTvShowCollection(card: Card, tvshowid: number): Promise<void> {
    actionStatus = `Playing ${card.title}...`;
    try {
      const result = await defaultEpisodeCollectionActionDispatch.playEpisodeCollection({
        tvshowid,
        label: card.title
      });
      actionStatus =
        result.count === 0
          ? `No episodes found for ${card.title}.`
          : `Played ${result.count} ${episodeWord(result.count)} from ${card.title}.`;
    } catch (error) {
      actionStatus = `Could not play ${card.title}. ${safeLibraryActionErrorMessage(error)}`;
    }
  }

  async function queueTvShowCollection(card: Card, tvshowid: number): Promise<void> {
    actionStatus = `Queueing ${card.title}...`;
    try {
      const result = await defaultEpisodeCollectionActionDispatch.queueEpisodeCollection({
        tvshowid,
        label: card.title
      });
      actionStatus =
        result.count === 0
          ? `No episodes found for ${card.title}.`
          : `Queued ${result.count} ${episodeWord(result.count)} from ${card.title}.`;
    } catch (error) {
      actionStatus = `Could not queue ${card.title}. ${safeLibraryActionErrorMessage(error)}`;
    }
  }

  function episodeWord(count: number): string {
    return count === 1 ? 'episode' : 'episodes';
  }

  async function downloadCard(card: Card): Promise<void> {
    const action = downloadableAction(card.action);
    if (!action) return;

    const key = downloadActionKey(action);
    pendingDownloadKey = key;
    actionStatus = `Preparing download for ${card.title}...`;

    try {
      const file = await resolveDownloadFile(action);
      if (!file) {
        throw new Error('Kodi did not expose a downloadable file for this item.');
      }

      const client = createActiveKodiJsonRpcHttpClient();
      if (!client) {
        throw new Error('Choose an active Kodi host before downloading media.');
      }

      const url = await prepareLocalStreamUrl({ client, file, activeHost: configStore.activeHost });
      startBrowserDownload(document, url, card.title);
      actionStatus = `Started download for ${card.title}.`;
    } catch (error) {
      actionStatus = `Could not download ${card.title}. ${safeLibraryActionErrorMessage(error)}`;
    } finally {
      pendingDownloadKey = null;
    }
  }

  async function addCardToLocalPlaylist(card: Card): Promise<void> {
    const action = localPlaylistAction(card.action);
    const playlistId = localPlaylistSnapshot?.selectedPlaylistId ?? null;
    if (!action || !playlistId || !localPlaylistDispatch) return;

    const key = localPlaylistActionKey(action);
    pendingLocalPlaylistKey = key;
    actionStatus = `Adding ${card.title} to playlist...`;

    try {
      const items = await resolveLocalPlaylistItems(action);
      if (items.length === 0) {
        throw new Error('Kodi did not expose playable songs for this item.');
      }

      const result = localPlaylistDispatch.addItems(playlistId, items);
      if (!result.ok) {
        const message = Object.values(result.errors).find(
          (value): value is string => typeof value === 'string' && value.length > 0
        );
        throw new Error(message ?? 'Could not add to playlist.');
      }

      actionStatus = `Added ${items.length} item${items.length === 1 ? '' : 's'} to playlist.`;
    } catch (error) {
      actionStatus = `Could not add ${card.title} to playlist. ${safeLibraryActionErrorMessage(error)}`;
    } finally {
      pendingLocalPlaylistKey = null;
    }
  }

  function toggleCardSelection(card: Card): void {
    const next = new Set(selectedCardKeys);
    if (next.has(card.key)) {
      next.delete(card.key);
    } else {
      next.add(card.key);
    }
    selectedCardKeys = next;
  }

  function clearSelectedCards(): void {
    selectedCardKeys = new Set();
  }

  async function playSelectedCards(): Promise<void> {
    if (pendingSelectedAction || selectedCards.length === 0) return;
    pendingSelectedAction = 'play';
    actionStatus = `Playing ${selectedCards.length} selected item${selectedCards.length === 1 ? '' : 's'}...`;

    try {
      for (const card of selectedCards) {
        await playCard(card);
      }
      actionStatus = `Played ${selectedCards.length} selected item${selectedCards.length === 1 ? '' : 's'}.`;
    } finally {
      pendingSelectedAction = null;
    }
  }

  async function queueSelectedCards(): Promise<void> {
    if (pendingSelectedAction || selectedCards.length === 0) return;
    pendingSelectedAction = 'queue';
    actionStatus = `Queueing ${selectedCards.length} selected item${selectedCards.length === 1 ? '' : 's'}...`;

    try {
      const libraryItems = selectedCards.map(libraryQueueItemForCard);
      if (queueDispatch.queueLibraryItems && libraryItems.every(isLibraryQueueItem)) {
        await queueDispatch.queueLibraryItems(libraryItems);
      } else {
        for (const card of selectedCards) {
          await queueCard(card);
        }
      }
      actionStatus = `Queued ${selectedCards.length} selected item${selectedCards.length === 1 ? '' : 's'}.`;
    } finally {
      pendingSelectedAction = null;
    }
  }

  async function addSelectedToLocalPlaylist(): Promise<void> {
    const playlistId = localPlaylistSnapshot?.selectedPlaylistId ?? null;
    if (
      pendingSelectedAction ||
      selectedPlaylistCards.length === 0 ||
      !playlistId ||
      !localPlaylistDispatch
    ) {
      return;
    }

    pendingSelectedAction = 'localadd';
    actionStatus = `Adding ${selectedPlaylistCards.length} selected item${selectedPlaylistCards.length === 1 ? '' : 's'} to playlist...`;

    try {
      const items = await resolveSelectedLocalPlaylistItems(selectedPlaylistCards);
      const result = localPlaylistDispatch.addItems(playlistId, items);
      if (!result.ok) {
        actionStatus = Object.values(result.errors).join(' ') || 'Could not add selected items.';
        return;
      }
      actionStatus = `Added ${items.length} selected item${items.length === 1 ? '' : 's'} to playlist.`;
    } catch (error) {
      actionStatus = `Could not add selected items. ${safeLibraryActionErrorMessage(error)}`;
    } finally {
      pendingSelectedAction = null;
    }
  }

  async function openMetadataEditor(card: Card): Promise<void> {
    const action = card.action;
    const definition = metadataEditorDefinitionForAction(action);
    if (!action || !definition) return;

    let source = enrichMetadataEditSource(card, definition, action);
    if (action.media === 'tvshow') {
      const tvSource = await tvShowMetadataSourceResolver.resolve(action.tvshowid);
      if (tvSource) {
        source = tvSource;
      }
    }

    metadataEditTarget = {
      key: card.key,
      action,
      definition,
      source
    };
    metadataEditError = null;
  }

  function enrichMetadataEditSource(
    card: Card,
    definition: MetadataEditorDefinition,
    action: MetadataEditableAction
  ): Record<string, unknown> {
    const base = {
      ...(card.source ?? {}),
      label: card.source?.label ?? card.title,
      [definition.displayKey]: card.source?.[definition.displayKey] ?? card.title
    };
    const detail = videoMovieDetailSnapshot?.detail;

    if (action.media === 'movie' && action.movieid && detail?.movieid === action.movieid) {
      return { ...base, ...detail };
    }

    return base;
  }

  async function saveMetadataEdit(payload: MetadataEditorPayload): Promise<void> {
    const target = metadataEditTarget;
    if (!target) return;
    const id = metadataEditorIdForAction(target.definition, target.action);
    if (!id) return;

    const currentTitle = displayTitleForMetadataEditor(
      target.definition,
      target.source,
      target.definition.title
    );
    pendingEditKey = target.key;
    metadataEditError = null;
    actionStatus = `Saving ${currentTitle}...`;

    try {
      const client = createActiveKodiJsonRpcHttpClient();
      if (!client) {
        throw new Error('Choose an active Kodi host before editing media.');
      }

      await client.call(target.definition.method, {
        [target.definition.idParam]: id,
        ...payload
      });
      const nextTitle = displayTitleForMetadataEditor(target.definition, payload, currentTitle);
      actionStatus = `Saved metadata for ${nextTitle}.`;
      if (target.action.media === 'tvshow') {
        tvShowMetadataSourceResolver.invalidate(target.action.tvshowid);
      }
      metadataEditTarget = null;
    } catch (error) {
      metadataEditError = safeLibraryActionErrorMessage(error);
      actionStatus = `Could not save ${currentTitle}. ${safeLibraryActionErrorMessage(error)}`;
    } finally {
      pendingEditKey = null;
      pendingMovieMoreActionKey = null;
    }
  }

  function toggleThumbsUp(card: Card): void {
    const item = thumbsUpItem(card);
    if (!item || !thumbsUpDispatch) {
      return;
    }

    thumbsUpDispatch.toggleItem(item);
  }

  function isThumbedUp(card: Card): boolean {
    const item = thumbsUpItem(card);
    return item ? (thumbsUpDispatch?.hasItem(item.media, item.id) ?? false) : false;
  }

  function libraryQueueItemForCard(card: Card): LibraryQueueItem | null {
    const action = card.action;
    if (!action) return null;
    if (action.media === 'music') return { media: 'music', item: toMusicActionPayload(action) };
    if (action.media === 'movie') return { media: 'movie', item: { movieid: action.movieid } };
    if (action.media === 'episode') {
      return { media: 'episode', item: { episodeid: action.episodeid } };
    }
    if (action.media === 'musicvideo') {
      return { media: 'musicvideo', item: { musicvideoid: action.musicvideoid } };
    }
    return null;
  }

  async function resolveSelectedLocalPlaylistItems(
    cards: readonly Card[]
  ): Promise<LocalPlaylistItemInput[]> {
    const batches: LocalPlaylistItemInput[][] = [];
    const concurrency = 4;

    for (let index = 0; index < cards.length; index += concurrency) {
      const chunk = cards.slice(index, index + concurrency);
      const resolved = await Promise.all(
        chunk.map((card) => {
          const action = localPlaylistAction(card.action);
          return action ? resolveLocalPlaylistItems(action) : [];
        })
      );
      batches.push(...resolved);
    }

    return batches.flat();
  }

  function isLibraryQueueItem(item: LibraryQueueItem | null): item is LibraryQueueItem {
    return item !== null;
  }

  async function playCardInBrowser(card: Card): Promise<void> {
    const action = browserPlayableAction(card.action);
    if (!action) return;

    actionStatus = `Opening browser playback for ${card.title}...`;
    openBrowserPlayerWindow(browserPlayerRouteForAction(action));
    actionStatus = `Opened browser playback for ${card.title}.`;
  }

  function openBrowserPlayerWindow(route: AppRoute): void {
    if (typeof window === 'undefined') return;
    try {
      const playerWindow = window.open(
        buildAppRoute(route, buildOptions),
        '_blank',
        'toolbar=no,scrollbars=no,resizable=yes,width=925,height=590,top=100,left=100'
      );
      playerWindow?.focus?.();
    } catch {
      actionStatus = 'The browser blocked the playback popup.';
    }
  }

  async function resolveDownloadFile(action: DownloadableCardAction): Promise<string | null> {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before downloading media.');
    }

    return resolveLibraryDownloadFile(client, action);
  }

  async function resolveLocalPlaylistItems(action: LocalPlaylistCardAction) {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before adding media to a playlist.');
    }

    return resolveLibraryLocalPlaylistItems(client, action);
  }

  async function loadMusicVideoDetail(musicvideoid: number): Promise<void> {
    if (
      musicVideoDetailsById[musicvideoid] ||
      loadingMusicVideoDetailIds[musicvideoid] ||
      missingMusicVideoDetailIds[musicvideoid]
    ) {
      return;
    }

    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      return;
    }

    loadingMusicVideoDetailIds = { ...loadingMusicVideoDetailIds, [musicvideoid]: true };

    try {
      const result = await getVideoLibraryMusicVideoDetails(client, {
        musicvideoid,
        properties: [
          'title',
          'artist',
          'album',
          'year',
          'runtime',
          'thumbnail',
          'fanart',
          'art',
          'genre',
          'director',
          'studio',
          'playcount',
          'lastplayed',
          'resume',
          'dateadded',
          'plot',
          'track',
          'tag',
          'rating'
        ]
      });
      const [detail] = normalizeVideoMusicVideos(
        result.musicvideodetails ? [result.musicvideodetails] : []
      );

      if (detail) {
        musicVideoDetailsById = { ...musicVideoDetailsById, [musicvideoid]: detail };
      } else {
        missingMusicVideoDetailIds = { ...missingMusicVideoDetailIds, [musicvideoid]: true };
      }
    } catch {
      missingMusicVideoDetailIds = { ...missingMusicVideoDetailIds, [musicvideoid]: true };
    } finally {
      const remaining = { ...loadingMusicVideoDetailIds };
      delete remaining[musicvideoid];
      loadingMusicVideoDetailIds = remaining;
    }
  }

  function safe(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
</script>

<LibraryClassicView
  {family}
  {route}
  {navItems}
  {activeFilters}
  {sortableFilters}
  {filterableFilters}
  {selectedFilterOptions}
  {hasSelectedCards}
  {selectedCards}
  {selectedPlaylistCards}
  {sections}
  {libraryPageFilters}
  {musicLibrarySnapshot}
  {musicDetailRouteStore}
  {selectedCardKeys}
  {localPlaylistSnapshot}
  localPlaylistDispatchAvailable={Boolean(localPlaylistDispatch)}
  thumbsUpDispatchAvailable={Boolean(thumbsUpDispatch)}
  {pendingSelectedAction}
  {pendingEditKey}
  {pendingDownloadKey}
  {pendingLocalPlaylistKey}
  {pendingMovieMoreActionKey}
  {metadataEditTarget}
  {metadataEditError}
  {actionStatus}
  {buildOptions}
  {filterPane}
  bind:optionSearch
  bind:openMovieMoreId
  {hrefFor}
  {cardHref}
  {selectSort}
  {openFilterPane}
  {closeFilterPane}
  {selectFilter}
  {closeOptionsPane}
  {toggleFilterOption}
  {removeFilter}
  {deselectCurrentFilterOptions}
  {removeAllFilters}
  {playMovieDetail}
  {queueMovieDetail}
  {streamMovieDetail}
  {downloadMovieDetail}
  {refreshMovieDetail}
  {editMovieMetadata}
  {playCard}
  {queueCard}
  {playCardInBrowser}
  {downloadCard}
  {addCardToLocalPlaylist}
  {toggleThumbsUp}
  {openMetadataEditor}
  {isThumbedUp}
  {toggleCardSelection}
  {playSelectedCards}
  {queueSelectedCards}
  {addSelectedToLocalPlaylist}
  {clearSelectedCards}
  {saveMetadataEdit}
  cancelMetadataEdit={() => {
    metadataEditTarget = null;
    metadataEditError = null;
  }}
/>
