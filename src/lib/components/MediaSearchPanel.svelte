<script lang="ts" module>
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
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import {
    searchAddonsStore as defaultSearchAddonsStore,
    type SearchAddonsStore
  } from '$lib/stores/searchAddons.svelte';
  import type { MediaSearchStoreSnapshot } from '$lib/stores/mediaSearch.svelte';
  import MediaSearchResultList from './media-search/MediaSearchResultList.svelte';
  import {
    resultSectionClass,
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
  type ExternalSearchProviderId = 'google' | 'imdb' | 'tmdb' | 'tvdb' | 'soundcloud' | 'youtube';

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

  const LOCAL_SEARCH_LINKS = [
    ['all', 'All Media'],
    ['movie', 'Movies'],
    ['tvshow', 'TV Shows'],
    ['artist', 'Artists'],
    ['album', 'Albums'],
    ['song', 'Songs']
  ] as const satisfies readonly [MediaSearchScope, string][];

  interface ExternalSearchProvider {
    id: ExternalSearchProviderId;
    label: string;
    buildUrl: (query: string) => string;
  }

  type PendingMusicAction = {
    verb: MusicActionVerb;
    label: string;
    item: MediaSearchActionItem;
  };

  let {
    snapshot,
    dispatch,
    actionDispatch,
    i18n = createTranslationContext('en'),
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

  const EXTERNAL_SEARCH_PROVIDERS: readonly ExternalSearchProvider[] = [
    {
      id: 'google',
      label: 'Google',
      buildUrl: (query) => `https://www.google.com/webhp?#q=${query}`
    },
    {
      id: 'imdb',
      label: 'IMDb',
      buildUrl: (query) => `https://www.imdb.com/find/?s=all&q=${query}`
    },
    { id: 'tvdb', label: 'TVDb', buildUrl: (query) => `https://thetvdb.com/search?query=${query}` },
    {
      id: 'tmdb',
      label: 'TMDb',
      buildUrl: (query) => `https://www.themoviedb.org/search?query=${query}`
    },
    {
      id: 'soundcloud',
      label: 'SoundCloud',
      buildUrl: (query) => `https://soundcloud.com/search?q=${query}`
    },
    {
      id: 'youtube',
      label: 'YouTube',
      buildUrl: (query) => `https://www.youtube.com/results?search_query=${query}`
    }
  ];

  const isSearchLoading = $derived(snapshot.searchStatus === 'loading');
  const searchDisabled = $derived(isSearchLoading || pendingOperation === 'search');
  const clearDisabled = $derived(isSearchLoading || pendingOperation === 'clear');
  const statusText = $derived(localStatusText ?? formatSearchStatus(snapshot));
  const customAddonSearchRows = $derived(
    searchAddons.snapshot.rows.filter((row) => row.title.trim() && row.url.trim())
  );
  const hasProviderLinks = $derived(providerQuery().length > 0);

  $effect(() => {
    if (snapshot.query !== inputValue && pendingOperation !== 'search') {
      inputValue = snapshot.query;
    }
  });

  $effect(() => {
    if (snapshot.scope !== selectedScope && pendingOperation !== 'search') {
      selectedScope = snapshot.scope;
    }
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

    const query = providerQuery();
    const pluginUrl = addonSearchPluginUrl(row, query);
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

  function sectionEmptyCopy(kind: ResultGroupKey): string {
    if (snapshot.scope !== 'music') {
      switch (kind) {
        case 'artists':
          return 'No matching artists.';
        case 'albums':
          return 'No matching albums.';
        case 'songs':
          return 'No matching songs.';
        case 'genres':
          return 'No matching genres.';
        case 'movies':
          return 'No matching movies.';
        case 'tvShows':
          return 'No matching TV shows.';
        case 'musicVideos':
          return 'No matching music videos.';
      }
    }

    switch (kind) {
      case 'artists':
        return i18n.t('media.search.empty.artists');
      case 'albums':
        return i18n.t('media.search.empty.albums');
      case 'songs':
        return i18n.t('media.search.empty.songs');
      case 'genres':
        return i18n.t('media.search.empty.genres');
      case 'movies':
        return 'No matching movies.';
      case 'tvShows':
        return 'No matching TV shows.';
      case 'musicVideos':
        return 'No matching music videos.';
    }
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

  function displayText(value: unknown, fallback: string): string {
    return textOrNull(value) ?? fallback;
  }

  function textOrNull(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed || looksLikePathOrUrl(trimmed)) {
      return null;
    }

    return sanitizeUiText(trimmed);
  }

  function joinText(values: unknown): string | null {
    if (Array.isArray(values)) {
      const joined = values
        .map((entry) => textOrNull(entry))
        .filter((entry): entry is string => Boolean(entry))
        .join(', ');
      return joined || null;
    }

    return textOrNull(values);
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

  function providerQuery(): string {
    return inputValue.trim() || snapshot.query.trim();
  }

  function externalSearchUrl(provider: ExternalSearchProvider): string {
    return provider.buildUrl(encodeURIComponent(providerQuery()));
  }

  function addonSearchPluginUrl(row: SearchAddonSetting, query = providerQuery()): string {
    return row.url.replaceAll('[QUERY]', query).replaceAll('{query}', query);
  }

  function customAddonSearchHref(row: SearchAddonSetting): string {
    const pluginUrl = addonSearchPluginUrl(row);

    return buildPrimaryAppRoute(
      { kind: 'browserItem', media: row.media, itemid: pluginUrl },
      buildOptions
    );
  }

  function localSearchHref(scope: MediaSearchScope): string {
    const query = providerQuery();
    return query
      ? buildPrimaryAppRoute({ kind: 'searchMedia', media: scope, query }, buildOptions)
      : buildPrimaryAppRoute({ kind: 'search' }, buildOptions);
  }

  function isLocalSearchActive(scope: MediaSearchScope): boolean {
    return selectedScope === scope || snapshot.scope === scope;
  }

  function addonItemHref(
    group: MediaSearchAddonResultGroup,
    item: MediaSearchAddonResultItem
  ): string {
    return buildPrimaryAppRoute(
      { kind: 'browserItem', media: group.row.media, itemid: item.file },
      buildOptions
    );
  }

  function addonResultLabel(item: MediaSearchAddonResultItem, fallbackIndex: number): string {
    return displayText(item.title ?? item.label, `Result ${fallbackIndex + 1}`);
  }

  function addonResultMeta(item: MediaSearchAddonResultItem): string {
    return textOrNull(item.filetype) ?? 'Add-on result';
  }

  function canSearchAddon(row: SearchAddonSetting): boolean {
    return Boolean(dispatch.searchAddon && hasProviderLinks && pendingAddonSearchId !== row.id);
  }

  function addonButtonLabel(row: SearchAddonSetting): string {
    return `Search ${displayText(row.title, 'add-on')} add-on`;
  }

  function sanitizeUiText(value: string): string {
    return value
      .replace(/raw response body/gi, 'response body [redacted]')
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[url]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/username or password/gi, 'credentials')
      .replace(/localStorage/gi, 'browser storage')
      .replace(/sessionStorage/gi, 'browser storage');
  }

  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }
</script>

<section class="media-search-page" aria-labelledby="media-search-title">
  <h2 id="media-search-title" class="sr-only">{i18n.t('media.search.title')}</h2>

  <aside class="search-sidebar" aria-label="Search navigation">
    <section class="sidebar-section">
      <h3>Local media</h3>
      <ul class="search-media-links">
        {#each LOCAL_SEARCH_LINKS as [scope, label] (scope)}
          <li>
            <a class:active={isLocalSearchActive(scope)} href={localSearchHref(scope)}>{label}</a>
          </li>
        {/each}
      </ul>
    </section>

    <section class="sidebar-section">
      <h3 id="media-search-providers-title">Addons</h3>
      <ul
        class="provider-search__links search-addon-links"
        aria-labelledby="media-search-providers-title"
      >
        {#each EXTERNAL_SEARCH_PROVIDERS as provider (provider.id)}
          <li>
            {#if hasProviderLinks}
              <a href={externalSearchUrl(provider)} target="_blank" rel="noreferrer">
                {provider.label}
              </a>
            {:else}
              <span class="disabled" aria-disabled="true">{provider.label}</span>
            {/if}
          </li>
        {/each}
        {#each customAddonSearchRows as row (row.id)}
          <li>
            {#if dispatch.searchAddon}
              <button
                type="button"
                class="provider-search__addon-button"
                aria-label={addonButtonLabel(row)}
                disabled={!canSearchAddon(row)}
                onclick={() => void handleAddonSearch(row)}
                data-custom-addon-search-button={row.id}
              >
                {displayText(row.title, 'Add-on search')}
              </button>
            {:else if hasProviderLinks}
              <a href={customAddonSearchHref(row)} data-custom-addon-search={row.id}>
                {displayText(row.title, 'Add-on search')}
              </a>
            {:else}
              <span class="disabled" aria-disabled="true"
                >{displayText(row.title, 'Add-on search')}</span
              >
            {/if}
          </li>
        {/each}
      </ul>
      <a
        class="configure-addons-link"
        href={buildPrimaryAppRoute({ kind: 'settingsSearch' }, buildOptions)}>Configure add-ons</a
      >
    </section>
  </aside>

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

    {#if addonSearchResults.length > 0}
      <section class="addon-results-shell" aria-labelledby="media-search-addon-results-title">
        <h3 id="media-search-addon-results-title">Add-on results</h3>
        {#each addonSearchResults as group (group.row.id)}
          <section
            class="result-section result-section--rows"
            aria-label={`${displayText(group.row.title, 'Add-on')} results`}
          >
            <div class="section-heading">
              <h4>{displayText(group.row.title, 'Add-on')} results</h4>
              <p>{group.items.length} result{group.items.length === 1 ? '' : 's'}</p>
            </div>
            {#if group.items.length === 0}
              <p class="empty-copy">No matching add-on results.</p>
            {:else}
              <ul class="result-list">
                {#each group.items as item, index (item.file)}
                  <li class="result-card">
                    <span class="item-kicker">{addonResultMeta(item)}</span>
                    <a class="item-title" href={addonItemHref(group, item)}>
                      {addonResultLabel(item, index)}
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        {/each}
      </section>
    {/if}

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
              <p class="empty-copy">{sectionEmptyCopy(kind)}</p>
            {:else}
              <MediaSearchResultList
                {kind}
                results={snapshot.results[kind]}
                {i18n}
                buildOptions={buildOptions}
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

<style>
  :global(.app-page-frame:has(.media-search-page)) {
    padding: 0;
    background: var(--color-background);
  }

  :global(.app-page-frame:has(.media-search-page) > .app-page-frame__copy) {
    display: none;
  }

  :global(.app-page-frame:has(.media-search-page) > .app-page-frame__body) {
    display: block;
    min-height: 100%;
  }

  .media-search-page {
    display: grid;
    grid-template-columns: 13.5rem minmax(0, 1fr);
    min-height: calc(100vh - 6.5rem);
    color: #303030;
    background: var(--color-background);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  h3,
  h4,
  p,
  ul {
    margin: 0;
  }

  .search-sidebar {
    display: grid;
    align-content: start;
    gap: 1.65rem;
    padding: 1.45rem 1rem 2rem 1.35rem;
    color: var(--color-text-muted);
    background: var(--color-surface-raised);
    border-right: 1px solid #d2d2d2;
    box-shadow: 2px 0 4px rgb(0 0 0 / 0.08);
  }

  .sidebar-section {
    display: grid;
    gap: 0.5rem;
  }

  .sidebar-section h3 {
    color: #777;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .search-media-links,
  .search-addon-links {
    display: grid;
    gap: 0.2rem;
    padding: 0;
    list-style: none;
  }

  .search-media-links a,
  .search-addon-links a,
  .provider-search__addon-button,
  .configure-addons-link {
    display: inline-block;
    max-width: 100%;
    padding: 0.12rem 0;
    color: #3b3b3b;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 400;
    line-height: 1.25;
    text-align: left;
    text-decoration: none;
    overflow-wrap: anywhere;
    background: transparent;
    border: 0;
    border-radius: 0;
    cursor: pointer;
  }

  .search-media-links a.active,
  .search-media-links a:hover,
  .search-addon-links a:hover,
  .provider-search__addon-button:hover:not(:disabled),
  .configure-addons-link:hover {
    color: #0b8bb3;
  }

  .configure-addons-link {
    color: #0b8bb3;
    font-size: 0.86rem;
  }

  .disabled,
  .provider-search__addon-button:disabled {
    color: #8c8c8c;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .search-content {
    min-width: 0;
    padding: 1.45rem 1.7rem 6rem;
  }

  .search-form {
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) 11rem auto;
    align-items: end;
    gap: 0.6rem;
    max-width: 54rem;
    margin: 0 0 1.3rem;
    padding: 0 0 1rem;
    border-bottom: 1px solid #c8c8c8;
  }

  .search-form,
  .status-line {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .search-form:focus-within {
    position: static;
    width: auto;
    height: auto;
    padding: 0 0 1rem;
    overflow: visible;
    white-space: normal;
    clip: auto;
    border-bottom: 1px solid #c8c8c8;
  }

  .search-field,
  .scope-field {
    display: grid;
    gap: 0.25rem;
  }

  .search-field label,
  .scope-field label {
    color: #555;
    font-size: 0.82rem;
  }

  input[type='search'],
  select[name='scope'] {
    min-height: 2.25rem;
    width: 100%;
    padding: 0.38rem 0.55rem;
    color: #303030;
    font: inherit;
    background: #fff;
    border: 1px solid #bdbdbd;
    border-radius: 2px;
  }

  input[type='search']:focus-visible,
  select[name='scope']:focus-visible,
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid #0b8bb3;
    outline-offset: 2px;
  }

  .search-actions,
  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .primary-button,
  .secondary-button,
  .action-button {
    min-height: 2.25rem;
    padding: 0.35rem 0.8rem;
    color: #333;
    font: inherit;
    background: #f7f7f7;
    border: 1px solid #bcbcbc;
    border-radius: 2px;
    cursor: pointer;
  }

  .primary-button:hover:not(:disabled),
  .secondary-button:hover:not(:disabled),
  .action-button:hover:not(:disabled) {
    background: #fff;
    border-color: #8f8f8f;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .status-line {
    color: #666;
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .error-copy,
  .state-copy,
  .empty-copy {
    color: #676767;
    line-height: 1.5;
  }

  .error-copy {
    margin-top: 0.65rem;
    color: #9f2d16;
  }

  .results-shell,
  .addon-results-shell {
    display: grid;
    gap: 1.8rem;
    margin-top: 1.35rem;
  }

  .result-section {
    display: grid;
    gap: 0.65rem;
    min-width: 0;
  }

  .section-heading {
    display: flex;
    align-items: baseline;
    gap: 0.7rem;
  }

  .section-heading h4,
  .addon-results-shell > h3 {
    color: #3f3f3f;
    font-size: 1.45rem;
    font-weight: 300;
    line-height: 1.2;
  }

  .section-heading p,
  .identity-chip {
    color: #777;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .result-list {
    display: grid;
    gap: 0.8rem;
    padding: 0;
    list-style: none;
  }

  .result-section--poster :global(.result-list),
  .result-section--square :global(.result-list) {
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 9.5rem));
  }

  .result-card {
    min-width: 0;
    color: #333;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.24);
  }

  .result-section--poster :global(.result-card),
  .result-section--square :global(.result-card) {
    display: grid;
    align-content: start;
    overflow: hidden;
  }

  .result-section--rows .result-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.2rem 0.8rem;
    padding: 0.55rem 0.7rem;
    background: transparent;
    border-bottom: 1px solid #c9c9c9;
    box-shadow: none;
  }

  .result-art {
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 2 / 3;
    color: #f5f5f5;
    font-size: 2rem;
    background: #bcbcbc;
  }

  .result-section--square :global(.result-art) {
    aspect-ratio: 1;
  }

  :global(.result-art) img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-title {
    display: block;
    min-width: 0;
    padding: 0.55rem 0.6rem 0.1rem;
    overflow: hidden;
    color: #333;
    font-weight: 500;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  a.item-title {
    text-decoration: none;
  }

  a.item-title:hover,
  a.item-title:focus-visible {
    color: #0b8bb3;
    text-decoration: underline;
    text-underline-offset: 0.15rem;
  }

  .result-section--rows .item-title {
    padding: 0;
    white-space: normal;
  }

  .item-kicker {
    color: #777;
    font-size: 0.78rem;
    text-transform: uppercase;
  }

  .item-meta {
    display: block;
    padding: 0 0.6rem 0.65rem;
    overflow: hidden;
    color: #777;
    font-size: 0.86rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-section--rows :global(.item-meta) {
    grid-column: 1 / -1;
    padding: 0;
    white-space: normal;
  }

  .action-row {
    padding: 0 0.6rem 0.65rem;
  }

  .result-section--rows :global(.action-row) {
    grid-column: 1 / -1;
    padding: 0;
  }

  @media (max-width: 820px) {
    .media-search-page {
      grid-template-columns: 1fr;
    }

    .search-sidebar {
      border-right: 0;
      border-bottom: 1px solid #d2d2d2;
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.08);
    }

    .search-form {
      position: static;
      grid-template-columns: 1fr;
      width: auto;
      height: auto;
      padding: 0 0 1rem;
      overflow: visible;
      white-space: normal;
      clip: auto;
      border-bottom: 1px solid #c8c8c8;
    }

    .status-line {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      white-space: normal;
      clip: auto;
    }

    .result-section--poster :global(.result-list),
    .result-section--square :global(.result-list) {
      grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    }
  }
</style>
