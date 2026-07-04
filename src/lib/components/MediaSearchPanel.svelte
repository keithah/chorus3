<script lang="ts" module>
  import './mediaSearchPanelClassic.css';
  import type { SearchAddonSetting } from '$lib/stores/searchAddons.svelte';
  import type { MediaSearchScope } from '$lib/stores/mediaSearch.svelte';

  export type MediaSearchActionItem =
    | { kind: 'artist'; id: number }
    | { kind: 'album'; id: number }
    | { kind: 'song'; id: number };

  export interface MediaSearchAddonResultItem {
    file: string;
    filetype?: string;
    label?: string;
    title?: string;
    thumbnail?: string;
  }

  export interface MediaSearchAddonResultGroup {
    row: SearchAddonSetting;
    query: string;
    items: MediaSearchAddonResultItem[];
  }

  export interface MediaSearchActionDispatch {
    playMusicItem: (item: MediaSearchActionItem) => Promise<void> | void;
    queueMusicItem: (item: MediaSearchActionItem) => Promise<void> | void;
  }

  export interface MediaSearchPanelDispatch {
    search: (request: { query: string; scope?: MediaSearchScope }) => Promise<void> | void;
    clear: () => Promise<void> | void;
    searchAddon?: (request: {
      row: SearchAddonSetting;
      query: string;
      pluginUrl: string;
    }) => Promise<MediaSearchAddonResultGroup> | MediaSearchAddonResultGroup;
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';
  import {
    searchAddonsStore as defaultSearchAddonsStore,
    type SearchAddonsStore
  } from '$lib/stores/searchAddons.svelte';
  import type { MediaSearchStoreSnapshot } from '$lib/stores/mediaSearch.svelte';
  import MediaSearchAddonResults from './media-search/MediaSearchAddonResults.svelte';
  import MediaSearchResultList from './media-search/MediaSearchResultList.svelte';
  import MediaSearchSidebar from './media-search/MediaSearchSidebar.svelte';
  import { displayText, sanitizeUiText, textOrNull } from './textFormatting';
  import {
    resultSectionClass,
    sectionEmptyCopy,
    resultSectionHeading,
    shouldShowResultSection,
    VISIBLE_RESULT_ORDER,
    type ResultGroupKey
  } from './media-search/mediaSearchResultDisplay';
  import type { MusicLibraryLimitsSnapshot } from '$lib/stores/musicLibraryNormalization';

  interface Props {
    snapshot: MediaSearchStoreSnapshot;
    dispatch: MediaSearchPanelDispatch;
    actionDispatch: MediaSearchActionDispatch;
    i18n?: TranslationContext;
    searchAddons?: SearchAddonsStore;
    buildOptions?: BuildAppRouteOptions;
  }

  type MusicActionVerb = 'play' | 'queue';
  type PendingOperation = 'search' | 'clear' | null;
  const SEARCH_SCOPE_OPTIONS = [
    ['all', 'All'],
    ['music', 'Music'],
    ['video', 'Video'],
    ['artist', 'Artists'],
    ['album', 'Albums'],
    ['song', 'Songs'],
    ['genre', 'Genres'],
    ['movie', 'Movies'],
    ['tvshow', 'TV Shows'],
    ['musicvideo', 'Music Videos']
  ] as const satisfies readonly [MediaSearchScope, string][];

  type PendingMusicAction = {
    verb: MusicActionVerb;
    label: string;
    item: MediaSearchActionItem;
  };

  let {
    snapshot,
    dispatch,
    actionDispatch,
    i18n = createEnglishTranslationContext(),
    searchAddons = defaultSearchAddonsStore,
    buildOptions = {}
  }: Props = $props();

  let inputValue = $state(untrack(() => snapshot.query));
  let pendingOperation = $state<PendingOperation>(null);
  let pendingAction = $state<PendingMusicAction | null>(null);
  let pendingAddonSearchId = $state<string | null>(null);
  let addonSearchResults = $state<MediaSearchAddonResultGroup[]>([]);
  let localStatusText = $state<string | null>(null);
  let localErrorText = $state<string | null>(null);
  let selectedScope = $state<MediaSearchScope>(untrack(() => snapshot.scope));
  let lastObservedSnapshotQuery = untrack(() => snapshot.query);
  let lastObservedSnapshotScope = untrack(() => snapshot.scope);

  const isSearchLoading = $derived(snapshot.searchStatus === 'loading');
  const providerQuery = $derived(inputValue.trim() || snapshot.query.trim());
  const searchDisabled = $derived(isSearchLoading || pendingOperation === 'search');
  const clearDisabled = $derived(isSearchLoading || pendingOperation === 'clear');
  const statusText = $derived(localStatusText ?? formatSearchStatus(snapshot));
  const customAddonSearchRows = $derived(
    searchAddons.snapshot.rows.filter((row) => row.title.trim() && row.url.trim())
  );
  const hasProviderLinks = $derived(providerQuery.length > 0);

  $effect(() => {
    const query = snapshot.query;
    const pending = pendingOperation;
    untrack(() => {
      if (query === lastObservedSnapshotQuery || pending === 'search') {
        return;
      }

      lastObservedSnapshotQuery = query;
      inputValue = query;
    });
  });

  $effect(() => {
    const scope = snapshot.scope;
    const pending = pendingOperation;
    untrack(() => {
      if (scope === lastObservedSnapshotScope || pending === 'search') {
        return;
      }

      lastObservedSnapshotScope = scope;
      selectedScope = scope;
    });
  });

  async function handleSearch(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (searchDisabled) {
      return;
    }

    const query = inputValue.trim();
    localStatusText =
      selectedScope === 'music'
        ? i18n.t('media.search.status.searchingQuery', {
            query: query || i18n.t('media.search.currentQuery')
          })
        : `Searching ${searchScopeNoun(selectedScope)} for ${query || 'the current query'}...`;
    localErrorText = null;
    pendingOperation = 'search';

    try {
      await dispatch.search({ query, scope: selectedScope });
      localStatusText = null;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : i18n.t('media.search.error.searchFailed')
      );
      localErrorText =
        selectedScope === 'music'
          ? i18n.t('media.search.error.couldNotSearch', { message })
          : `Could not search ${searchScopeNoun(selectedScope)}. ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingOperation = null;
    }
  }

  async function handleClear(): Promise<void> {
    if (clearDisabled) {
      return;
    }

    localStatusText = i18n.t('media.search.status.clearing');
    localErrorText = null;
    pendingOperation = 'clear';

    try {
      await dispatch.clear();
      inputValue = '';
      localStatusText = null;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : i18n.t('media.search.error.clearFailed')
      );
      localErrorText = i18n.t('media.search.error.couldNotClear', { message });
      localStatusText = localErrorText;
    } finally {
      pendingOperation = null;
    }
  }

  function handleScopeChange(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    if (isMediaSearchScope(select.value)) {
      selectedScope = select.value;
    }
  }

  function isMediaSearchScope(value: string): value is MediaSearchScope {
    return SEARCH_SCOPE_OPTIONS.some(([scope]) => scope === value);
  }

  async function handleMusicAction(
    verb: MusicActionVerb,
    item: MediaSearchActionItem,
    label: string
  ): Promise<void> {
    if (pendingAction || pendingOperation || isSearchLoading) {
      return;
    }

    pendingAction = { verb, item, label };
    localErrorText = null;
    localStatusText = i18n.t(verb === 'play' ? 'media.action.playing' : 'media.action.queueing', {
      label
    });

    try {
      if (verb === 'play') {
        await actionDispatch.playMusicItem(item);
      } else {
        await actionDispatch.queueMusicItem(item);
      }
      localStatusText = i18n.t(verb === 'play' ? 'media.action.played' : 'media.action.queued', {
        label
      });
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : i18n.t('media.action.errorFallback')
      );
      localErrorText = i18n.t('media.action.couldNotVerb', {
        verb: i18n.t(verb === 'play' ? 'media.action.verb.play' : 'media.action.verb.queue'),
        label,
        message
      });
      localStatusText = localErrorText;
    } finally {
      pendingAction = null;
    }
  }

  async function handleAddonSearch(row: SearchAddonSetting): Promise<void> {
    if (!dispatch.searchAddon || pendingAddonSearchId || !hasProviderLinks) {
      return;
    }

    const query = providerQuery;
    const pluginUrl = row.url.replaceAll('[QUERY]', query).replaceAll('{query}', query);
    pendingAddonSearchId = row.id;
    localErrorText = null;
    localStatusText = `Searching ${displayText(row.title, 'add-on')} for ${query}...`;

    try {
      const result = await dispatch.searchAddon({ row, query, pluginUrl });
      const safeItems = result.items.filter((item) => textOrNull(item.file));
      const safeResult = { row: result.row, query: result.query, items: safeItems };
      addonSearchResults = [
        safeResult,
        ...addonSearchResults.filter((group) => group.row.id !== row.id)
      ];
      localStatusText = `${displayText(row.title, 'Add-on')} returned ${safeItems.length} result${safeItems.length === 1 ? '' : 's'}.`;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : 'Add-on search failed.'
      );
      localErrorText = `Could not search ${displayText(row.title, 'add-on')}. ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingAddonSearchId = null;
    }
  }

  function formatSearchStatus(value: MediaSearchStoreSnapshot): string {
    const query = displayText(value.query, '');

    if (value.searchStatus === 'loading') {
      if (value.scope === 'music') {
        return query
          ? i18n.t('media.search.status.searchingQuery', { query })
          : i18n.t('media.search.status.searching');
      }
      return query
        ? `Searching ${searchScopeNoun(value.scope)} for ${query}...`
        : `Searching ${searchScopeNoun(value.scope)}...`;
    }

    if (value.searchStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.searchStatus === 'ready') {
      if (value.isEmpty || value.resultCounts.total === 0) {
        if (value.scope === 'music') {
          return query
            ? i18n.t('media.search.status.noResultsFor', { query })
            : i18n.t('media.search.status.noResults');
        }
        return query
          ? `No ${searchScopeNoun(value.scope)} results found for ${query}.`
          : `No ${searchScopeNoun(value.scope)} results found.`;
      }

      const updated = textOrNull(value.lastUpdatedAt);
      const suffix = updated ? i18n.t('media.status.lastUpdated', { updated }) : '';
      if (value.scope === 'music') {
        return query
          ? i18n.t('media.search.status.resultsFor', {
              query,
              count: resultCountCopy(value.resultCounts.total),
              suffix
            })
          : i18n.t('media.search.status.ready', {
              count: resultCountCopy(value.resultCounts.total),
              suffix
            });
      }
      return query
        ? `${searchResultsTitle(value.scope)} for ${query}. ${resultCountCopy(value.resultCounts.total)}.${suffix}`
        : `${searchResultsTitle(value.scope)} ready. ${resultCountCopy(value.resultCounts.total)}.${suffix}`;
    }

    return value.scope === 'music' ? i18n.t('media.search.status.idle') : 'Search Kodi media.';
  }

  function searchLabel(): string {
    return selectedScope === 'music'
      ? i18n.t('media.search.label')
      : `Search ${searchScopeNoun(selectedScope)}`;
  }

  function searchPlaceholder(): string {
    switch (selectedScope) {
      case 'music':
        return i18n.t('media.search.placeholder');
      case 'all':
        return 'Artist, album, song, movie, or TV show';
      case 'video':
        return 'Movie, TV show, or music video';
      case 'artist':
        return 'Artist name';
      case 'album':
        return 'Album title';
      case 'song':
        return 'Song title';
      case 'genre':
        return 'Genre';
      case 'movie':
        return 'Movie title';
      case 'tvshow':
        return 'TV show title';
      case 'musicvideo':
        return 'Music video title';
    }
  }

  function searchResultsHeading(): string {
    return snapshot.scope === 'music'
      ? i18n.t('media.search.resultsTitle')
      : searchResultsTitle(snapshot.scope);
  }

  function searchResultsTitle(scope: MediaSearchScope): string {
    if (scope === 'all') return 'All media results';
    if (scope === 'movie') return 'Movie results';
    if (scope === 'tvshow') return 'TV show results';
    if (scope === 'musicvideo') return 'Music video results';
    return `${titleCase(searchScopeNoun(scope))} results`;
  }

  function searchScopeNoun(scope: MediaSearchScope): string {
    switch (scope) {
      case 'all':
        return 'all media';
      case 'music':
        return 'music';
      case 'video':
        return 'video';
      case 'artist':
        return 'artists';
      case 'album':
        return 'albums';
      case 'song':
        return 'songs';
      case 'genre':
        return 'genres';
      case 'movie':
        return 'movies';
      case 'tvshow':
        return 'TV shows';
      case 'musicvideo':
        return 'music videos';
    }
  }

  function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function groupCountSummary(kind: ResultGroupKey): string {
    const count = snapshot.results[kind].length;
    return i18n.t('media.count.of', { count, total: formatTotal(snapshot.limits[kind], count) });
  }

  function formatTotal(limits: MusicLibraryLimitsSnapshot | undefined, fallback: number): number {
    return typeof limits?.total === 'number' && Number.isFinite(limits.total)
      ? limits.total
      : fallback;
  }

  function isActionDisabled(item: MediaSearchActionItem): boolean {
    if (isSearchLoading || pendingOperation) {
      return true;
    }

    if (!pendingAction) {
      return false;
    }

    return actionTargetKey(pendingAction.item) === actionTargetKey(item);
  }

  function actionTargetKey(item: MediaSearchActionItem): string {
    return `${item.kind}:${item.id}`;
  }

  function resultCountCopy(count: number): string {
    return count === 1
      ? i18n.t('media.count.result.one')
      : i18n.t('media.count.result.many', { count });
  }

  function itemKindLabel(kind: MediaSearchActionItem['kind']): string {
    if (kind === 'artist') return i18n.t('media.kind.artist');
    if (kind === 'album') return i18n.t('media.kind.album');
    return i18n.t('media.kind.song');
  }

  function actionLabel(verb: MusicActionVerb, item: MediaSearchActionItem, label: string): string {
    return i18n.t(verb === 'play' ? 'media.action.playItem' : 'media.action.queueItem', {
      kind: itemKindLabel(item.kind),
      label
    });
  }

  function actionTargetLabel(item: MediaSearchActionItem, label: string): string {
    return `${itemKindLabel(item.kind)} ${label}`;
  }
</script>

<section class="media-search-page" aria-labelledby="media-search-title">
  <h2 id="media-search-title" class="sr-only">{i18n.t('media.search.title')}</h2>

  <MediaSearchSidebar
    {i18n}
    {buildOptions}
    {providerQuery}
    {selectedScope}
    activeScope={snapshot.scope}
    customAddonRows={customAddonSearchRows}
    {hasProviderLinks}
    searchAddonEnabled={Boolean(dispatch.searchAddon)}
    {pendingAddonSearchId}
    onAddonSearch={(row) => void handleAddonSearch(row)}
  />

  <div class="search-content">
    <form
      class="search-form"
      role="search"
      aria-label={i18n.t('media.search.formAria')}
      onsubmit={handleSearch}
    >
      <div class="search-field">
        <label for="media-search-query">{searchLabel()}</label>
        <input
          id="media-search-query"
          name="query"
          type="search"
          autocomplete="off"
          bind:value={inputValue}
          placeholder={searchPlaceholder()}
        />
      </div>
      <div class="scope-field">
        <label for="media-search-scope">Type</label>
        <select
          id="media-search-scope"
          name="scope"
          bind:value={selectedScope}
          onchange={handleScopeChange}
          disabled={searchDisabled}
        >
          {#each SEARCH_SCOPE_OPTIONS as [scope, label] (scope)}
            <option value={scope}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="search-actions">
        <button
          type="submit"
          class="primary-button"
          aria-label={i18n.t('media.search.action.search')}
          disabled={searchDisabled}
        >
          {i18n.t('media.search.action.search')}
        </button>
        <button
          type="button"
          class="secondary-button"
          aria-label={i18n.t('media.search.action.clear')}
          disabled={clearDisabled}
          onclick={handleClear}
        >
          {i18n.t('app.action.clear')}
        </button>
      </div>
    </form>

    <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>
    {#if localErrorText}
      <p class="error-copy" role="alert">{localErrorText}</p>
    {/if}

    <MediaSearchAddonResults groups={addonSearchResults} {i18n} {buildOptions} />

    {#if snapshot.searchStatus === 'loading'}
      <p class="state-copy">{i18n.t('media.search.state.loading')}</p>
    {:else if snapshot.searchStatus === 'idle'}
      <p class="state-copy">{i18n.t('media.search.state.idle')}</p>
    {:else if snapshot.isEmpty}
      <p class="state-copy">{i18n.t('media.search.state.noMatch')}</p>
    {/if}

    <section class="results-shell" aria-labelledby="media-search-results-title">
      <h3 id="media-search-results-title" class="sr-only">{searchResultsHeading()}</h3>

      {#each VISIBLE_RESULT_ORDER as kind (kind)}
        {#if shouldShowResultSection(snapshot, kind)}
          <section class={resultSectionClass(kind)} aria-labelledby={`media-search-${kind}-title`}>
            <div class="section-heading">
              <h4 id={`media-search-${kind}-title`}>{resultSectionHeading(kind, i18n)}</h4>
              <p>{groupCountSummary(kind)}</p>
            </div>

            {#if snapshot.results[kind].length === 0}
              <p class="empty-copy">{sectionEmptyCopy(kind, i18n)}</p>
            {:else}
              <MediaSearchResultList
                {kind}
                results={snapshot.results[kind]}
                {i18n}
                {buildOptions}
                {isActionDisabled}
                onMusicAction={handleMusicAction}
                {actionLabel}
                {actionTargetLabel}
                {itemKindLabel}
              />
            {/if}
          </section>
        {/if}
      {/each}
    </section>
  </div>
</section>
