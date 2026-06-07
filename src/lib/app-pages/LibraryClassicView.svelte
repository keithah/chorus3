<script lang="ts">
  import MetadataEditDialog from '$components/MetadataEditDialog.svelte';
  import MusicDetailRoute from '$components/MusicDetailRoute.svelte';
  import type { BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import {
    browserPlayableAction,
    downloadableAction,
    downloadActionKey,
    localPlaylistAction,
    localPlaylistActionKey,
    thumbsUpItem
  } from '$lib/app-pages/libraryCardActions';
  import type { LibraryCard } from '$lib/app-pages/libraryCards';
  import type { LibraryContentSection } from '$lib/app-pages/libraryContentSections';
  import type { LibraryPageFilters } from '$lib/app-pages/libraryPageFiltering';
  import type {
    LibraryNavItem,
    LibraryRoute,
    LibraryRouteFamily
  } from '$lib/app-pages/libraryRouteFilters';
  import {
    googleMovieSearchHref,
    imdbMovieHref,
    movieDetailMeta,
    movieDetailSearchHref,
    movieDuration,
    movieFanartUrl,
    moviePlot,
    moviePosterUrl,
    movieRating,
    movieStreamMeta,
    movieTagline,
    movieWatchedButtonLabel,
    youtubeMovieHref,
    type MovieDetailSource
  } from '$lib/app-pages/libraryMovieCards';
  import type { MetadataEditableAction, MetadataEditorPayload } from '$lib/metadata/metadataEditor';
  import type { LibraryFilterOption, LibraryParsedFilterField } from '$lib/stores/libraryFilter';
  import type { LocalPlaylistStoreSnapshot } from '$lib/stores/localPlaylist.svelte';
  import type { MusicDetailRouteStore } from '$lib/stores/musicDetailRouteStore.svelte';
  import type { MusicLibraryStoreSnapshot } from '$lib/stores/musicLibrary.svelte';

  type Card = LibraryCard;
  type MetadataEditTarget = {
    key: string;
    action: MetadataEditableAction;
    definition: import('$lib/metadata/metadataEditor').MetadataEditorDefinition;
    source: Record<string, unknown>;
  };
  type ActiveFilter = {
    key: string;
    title: string;
    values: readonly (string | number | boolean)[];
  };
  type SortableFilter = {
    key: string;
    title: string;
    active: boolean;
    order: 'asc' | 'desc';
  };

  const CARD_RENDER_WINDOW_INITIAL = 120;
  const CARD_RENDER_WINDOW_STEP = 120;

  interface Props {
    family: LibraryRouteFamily;
    route: LibraryRoute;
    navItems: readonly LibraryNavItem[];
    activeFilters: readonly ActiveFilter[];
    sortableFilters: readonly SortableFilter[];
    filterableFilters: readonly LibraryParsedFilterField[];
    selectedFilterOptions: readonly LibraryFilterOption[];
    hasSelectedCards: boolean;
    selectedCards: readonly Card[];
    selectedPlaylistCards: readonly Card[];
    sections: readonly LibraryContentSection[];
    libraryPageFilters: LibraryPageFilters;
    musicLibrarySnapshot: MusicLibraryStoreSnapshot;
    musicDetailRouteStore: MusicDetailRouteStore;
    selectedCardKeys: ReadonlySet<string>;
    localPlaylistSnapshot?: LocalPlaylistStoreSnapshot;
    localPlaylistDispatchAvailable: boolean;
    thumbsUpDispatchAvailable: boolean;
    pendingSelectedAction: 'play' | 'queue' | 'localadd' | null;
    pendingEditKey: string | null;
    pendingDownloadKey: string | null;
    pendingLocalPlaylistKey: string | null;
    pendingMovieMoreActionKey: string | null;
    metadataEditTarget: MetadataEditTarget | null;
    metadataEditError: string | null;
    actionStatus: string;
    buildOptions: BuildAppRouteOptions;
    filterPane: 'normal' | 'filters' | 'options';
    optionSearch: string;
    openMovieMoreId: number | null;
    hrefFor: (target: PrimaryRoute) => string;
    cardHref: (card: Card) => string | null;
    selectSort: (method: string, order: 'asc' | 'desc') => void;
    openFilterPane: () => void;
    closeFilterPane: () => void;
    selectFilter: (filter: LibraryParsedFilterField) => void;
    closeOptionsPane: () => void;
    toggleFilterOption: (option: LibraryFilterOption) => void;
    removeFilter: (key: string) => void;
    deselectCurrentFilterOptions: () => void;
    removeAllFilters: () => void;
    playMovieDetail: (movie: MovieDetailSource) => Promise<void>;
    queueMovieDetail: (movie: MovieDetailSource) => Promise<void>;
    streamMovieDetail: (movie: MovieDetailSource) => Promise<void>;
    downloadMovieDetail: (movie: MovieDetailSource) => Promise<void>;
    refreshMovieDetail: (movie: MovieDetailSource) => Promise<void>;
    editMovieMetadata: (movie: MovieDetailSource) => void;
    playCard: (card: Card) => Promise<void>;
    queueCard: (card: Card) => Promise<void>;
    playCardInBrowser: (card: Card) => Promise<void>;
    downloadCard: (card: Card) => Promise<void>;
    addCardToLocalPlaylist: (card: Card) => Promise<void>;
    toggleThumbsUp: (card: Card) => void;
    openMetadataEditor: (card: Card) => Promise<void>;
    isThumbedUp: (card: Card) => boolean;
    toggleCardSelection: (card: Card) => void;
    playSelectedCards: () => Promise<void>;
    queueSelectedCards: () => Promise<void>;
    addSelectedToLocalPlaylist: () => Promise<void>;
    clearSelectedCards: () => void;
    saveMetadataEdit: (payload: MetadataEditorPayload) => Promise<void>;
    cancelMetadataEdit: () => void;
  }

  let {
    family,
    route,
    navItems,
    activeFilters,
    sortableFilters,
    filterableFilters,
    selectedFilterOptions,
    hasSelectedCards,
    selectedCards,
    selectedPlaylistCards,
    sections,
    libraryPageFilters,
    musicLibrarySnapshot,
    musicDetailRouteStore,
    selectedCardKeys,
    localPlaylistSnapshot,
    localPlaylistDispatchAvailable,
    thumbsUpDispatchAvailable,
    pendingSelectedAction,
    pendingEditKey,
    pendingDownloadKey,
    pendingLocalPlaylistKey,
    pendingMovieMoreActionKey,
    metadataEditTarget,
    metadataEditError,
    actionStatus,
    buildOptions,
    filterPane,
    optionSearch = $bindable(),
    openMovieMoreId = $bindable(),
    hrefFor,
    cardHref,
    selectSort,
    openFilterPane,
    closeFilterPane,
    selectFilter,
    closeOptionsPane,
    toggleFilterOption,
    removeFilter,
    deselectCurrentFilterOptions,
    removeAllFilters,
    playMovieDetail,
    queueMovieDetail,
    streamMovieDetail,
    downloadMovieDetail,
    refreshMovieDetail,
    editMovieMetadata,
    playCard,
    queueCard,
    playCardInBrowser,
    downloadCard,
    addCardToLocalPlaylist,
    toggleThumbsUp,
    openMetadataEditor,
    isThumbedUp,
    toggleCardSelection,
    playSelectedCards,
    queueSelectedCards,
    addSelectedToLocalPlaylist,
    clearSelectedCards,
    saveMetadataEdit,
    cancelMetadataEdit
  }: Props = $props();

  let visibleCardCounts = $state<Record<string, number>>({});

  function safe(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function sectionKey(section: LibraryContentSection, index: number): string {
    return [route.kind, index, section.title ?? '', section.cards.length].join(':');
  }

  function visibleCardsForSection(section: LibraryContentSection, index: number): readonly Card[] {
    const key = sectionKey(section, index);
    const count = visibleCardCounts[key] ?? CARD_RENDER_WINDOW_INITIAL;
    return section.cards.slice(0, count);
  }

  function showMoreCards(section: LibraryContentSection, index: number): void {
    const key = sectionKey(section, index);
    const count = visibleCardCounts[key] ?? CARD_RENDER_WINDOW_INITIAL;
    visibleCardCounts = {
      ...visibleCardCounts,
      [key]: Math.min(section.cards.length, count + CARD_RENDER_WINDOW_STEP)
    };
  }
</script>

<section class="classic-library-page" data-classic-library-page={family}>
  <aside class="classic-section-nav" aria-label="Sections">
    <div
      class="classic-filter-panes"
      class:show-filters={filterPane === 'filters'}
      class:show-options={filterPane === 'options'}
    >
      <div class="classic-filter-pane current">
        <div class="classic-nav-section">
          <h2>Sections</h2>
          <nav>
            {#each navItems as item}
              <a href={hrefFor(item.route)} class:active={item.active}>{item.label}</a>
            {/each}
          </nav>
        </div>

        <h2>
          <button type="button" class="classic-pane-title" onclick={openFilterPane}>
            Filters
            <span aria-hidden="true">›</span>
          </button>
        </h2>
        <ul class="classic-active-list">
          {#if activeFilters.length}
            {#each activeFilters as filter}
              <li>
                <button
                  type="button"
                  class="classic-filter-btn"
                  onclick={() => removeFilter(filter.key)}
                >
                  {filter.title}
                </button>
              </li>
            {/each}
          {:else}
            <li>
              <button type="button" class="classic-filter-btn" onclick={openFilterPane}
                >Add filter</button
              >
            </li>
          {/if}
        </ul>

        <h2>Sort</h2>
        <ul class="classic-selection-list">
          {#each sortableFilters as sort}
            <li>
              <button
                type="button"
                class:active={sort.active}
                class:order-asc={sort.active && sort.order === 'asc'}
                class:order-desc={sort.active && sort.order === 'desc'}
                onclick={() => selectSort(sort.key, sort.order)}
              >
                {sort.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <div class="classic-filter-pane filters-page">
        <h2>
          <button type="button" class="classic-pane-title" onclick={closeFilterPane}>
            <span aria-hidden="true">‹</span>
            Sections
          </button>
        </h2>
        <ul class="classic-selection-list">
          {#if filterableFilters.length}
            {#each filterableFilters as filter}
              <li>
                <button
                  type="button"
                  class:active={filter.active}
                  onclick={() => selectFilter(filter)}
                >
                  {filter.title}
                </button>
              </li>
            {/each}
          {:else}
            <li class="classic-empty-filter">No filters available</li>
          {/if}
        </ul>
      </div>

      <div class="classic-filter-pane options-page">
        <h2>
          <button type="button" class="classic-pane-title" onclick={closeOptionsPane}>
            <span aria-hidden="true">‹</span>
            Select a filter
          </button>
        </h2>
        {#if selectedFilterOptions.length > 10 || optionSearch}
          <input
            class="classic-options-search"
            type="search"
            bind:value={optionSearch}
            aria-label="Search filter options"
          />
        {/if}
        <button type="button" class="classic-deselect-all" onclick={deselectCurrentFilterOptions}>
          Deselect all
        </button>
        <ul class="classic-selection-list">
          {#each selectedFilterOptions as option}
            <li>
              <button
                type="button"
                class:active={option.active}
                onclick={() => toggleFilterOption(option)}
              >
                {option.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </aside>

  <div class="classic-library-content">
    {#if activeFilters.length}
      <div class="classic-filters-active-bar">
        <span>{activeFilters.flatMap((filter) => filter.values).join(', ')}</span>
        <button type="button" aria-label="Remove all filters" onclick={removeAllFilters}>×</button>
      </div>
    {/if}
    {#if hasSelectedCards}
      <div class="classic-selected-toolbar" aria-label="Selected items">
        <span>{selectedCards.length} selected</span>
        <button
          type="button"
          disabled={pendingSelectedAction !== null}
          onclick={() => void playSelectedCards()}>Play selected</button
        >
        <button
          type="button"
          disabled={pendingSelectedAction !== null}
          onclick={() => void queueSelectedCards()}>Queue selected</button
        >
        <button
          type="button"
          disabled={pendingSelectedAction !== null ||
            !localPlaylistDispatchAvailable ||
            !localPlaylistSnapshot?.selectedPlaylistId ||
            selectedPlaylistCards.length === 0}
          onclick={() => void addSelectedToLocalPlaylist()}>Add selected to playlist</button
        >
        <button type="button" onclick={clearSelectedCards}>Clear selected</button>
      </div>
    {/if}
    {#if route.kind === 'musicAlbumDetail' || route.kind === 'musicArtistDetail'}
      <section class="classic-card-section">
        <MusicDetailRoute
          {route}
          {musicLibrarySnapshot}
          detailSnapshot={musicDetailRouteStore.snapshot}
          detailDispatch={musicDetailRouteStore}
          filterAlbums={libraryPageFilters.albums}
          filterSongs={libraryPageFilters.songs}
          onPlayCard={playCard}
          onQueueCard={queueCard}
          onStreamCard={playCardInBrowser}
          onAddToPlaylist={addCardToLocalPlaylist}
          onToggleThumbsUp={toggleThumbsUp}
          onEdit={openMetadataEditor}
          {isThumbedUp}
          {cardHref}
        />
      </section>
    {/if}
    {#each sections as section, sectionIndex}
      <section class="classic-card-section" class:compact={section.compact}>
        {#if section.movieDetail}
          {@const movie = section.movieDetail}
          {@const poster = moviePosterUrl(movie)}
          {@const fanart = movieFanartUrl(movie)}
          {@const title = safe(movie.title ?? movie.label, 'Movie')}
          {@const duration = movieDuration(movie)}
          {@const rating = movieRating(movie)}
          {@const moviesHref = hrefFor({ kind: 'movies' })}
          <article class="classic-movie-detail">
            <a class="classic-detail-back-link" href={moviesHref}>Back to movies</a>
            <header class="classic-movie-hero">
              {#if fanart}
                <img class="classic-movie-fanart" src={fanart} alt="" aria-hidden="true" />
              {/if}
              <div class="classic-movie-shade" aria-hidden="true"></div>
              <div class="classic-movie-poster" aria-label={`${title} poster`}>
                {#if poster}
                  <img src={poster} alt="" decoding="async" />
                {/if}
              </div>
              <div class="classic-movie-copy">
                <div class="classic-movie-title-row">
                  <h3>
                    {title}
                    {#if typeof movie.year === 'number'}
                      <span>{movie.year}</span>
                    {/if}
                  </h3>
                  {#if rating !== undefined}
                    <div class="classic-movie-rating" aria-label={`Rating ${rating}`}>
                      {rating.toFixed(1)}
                      <span aria-hidden="true">★</span>
                    </div>
                  {/if}
                </div>
                {#if duration}
                  <p class="classic-movie-runtime">{duration}</p>
                {/if}
                {#if movieTagline(movie)}
                  <p class="classic-movie-tagline">{movieTagline(movie)}</p>
                {/if}
                <dl class="classic-movie-meta">
                  {#each movieDetailMeta(movie) as row}
                    <div>
                      <dt>{row.label}:</dt>
                      <dd>{row.value}</dd>
                    </div>
                  {/each}
                </dl>
                <dl class="classic-movie-streams">
                  {#each movieStreamMeta(movie) as row}
                    <div>
                      <dt>{row.label}:</dt>
                      <dd>{row.value}</dd>
                    </div>
                  {/each}
                </dl>
                <div class="classic-movie-actions">
                  <button class="primary" type="button" onclick={() => void playMovieDetail(movie)}>
                    Play <span aria-hidden="true">▶</span>
                  </button>
                  <button type="button" onclick={() => void queueMovieDetail(movie)}>
                    Queue <span aria-hidden="true">＋</span>
                  </button>
                  <button type="button" onclick={() => void streamMovieDetail(movie)}>
                    Stream <span aria-hidden="true">▣</span>
                  </button>
                  <button type="button">{movieWatchedButtonLabel(movie)}</button>
                  <div class="classic-movie-more">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openMovieMoreId === movie.movieid}
                      onclick={() =>
                        (openMovieMoreId =
                          openMovieMoreId === movie.movieid ? null : movie.movieid)}
                    >
                      More <span aria-hidden="true">⋮</span>
                    </button>
                    {#if openMovieMoreId === movie.movieid}
                      <div class="classic-movie-more-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onclick={() => void downloadMovieDetail(movie)}
                        >
                          Download
                        </button>
                        <a role="menuitem" href={movieDetailSearchHref(movie, buildOptions)}
                          >Chorus Search</a
                        >
                        <a
                          role="menuitem"
                          href={googleMovieSearchHref(movie)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          External Search
                        </a>
                        <a
                          role="menuitem"
                          href={imdbMovieHref(movie)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          IMDb Search
                        </a>
                        <a
                          role="menuitem"
                          href={youtubeMovieHref(movie)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          YouTube Search
                        </a>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={pendingMovieMoreActionKey === `refresh:${movie.movieid}`}
                          onclick={() => void refreshMovieDetail(movie)}>Refresh</button
                        >
                        <button
                          type="button"
                          role="menuitem"
                          disabled={pendingMovieMoreActionKey === `edit:${movie.movieid}`}
                          onclick={() => editMovieMetadata(movie)}>Edit</button
                        >
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </header>

            <section class="classic-movie-synopsis">
              <h3>Synopsis</h3>
              <p>{moviePlot(movie) ?? 'No synopsis available.'}</p>
            </section>
          </article>
        {:else if section.title}
          <header>
            <h3>{section.title}</h3>
            <button type="button" aria-label={`${section.title} menu`}>⋮</button>
          </header>
        {/if}

        {#if !section.movieDetail && section.cards.length}
          {@const visibleCards = visibleCardsForSection(section, sectionIndex)}
          {#if section.detailRows?.length || section.description || section.rating !== undefined}
            <div class="classic-detail-meta">
              {#if section.rating !== undefined}
                <div class="classic-detail-rating" aria-label="Rating">{section.rating}</div>
              {/if}
              {#if section.detailRows?.length}
                <dl>
                  {#each section.detailRows as row}
                    <div>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  {/each}
                </dl>
              {/if}
              {#if section.description}
                <p>{section.description}</p>
              {/if}
            </div>
          {/if}
          <div class="classic-card-grid">
            {#each visibleCards as card}
              {@const artworkShape = card.artworkShape ?? (card.poster ? 'poster' : 'square')}
              <article
                class="classic-card"
                class:poster={artworkShape === 'poster'}
                class:art-square={artworkShape === 'square'}
                class:art-poster={artworkShape === 'poster'}
                data-artwork-shape={artworkShape}
              >
                <label class="classic-card-select">
                  <input
                    type="checkbox"
                    data-card-select={card.key}
                    aria-label={`Select ${card.title}`}
                    checked={selectedCardKeys.has(card.key)}
                    onchange={() => toggleCardSelection(card)}
                  />
                  {#if !section.compact}
                    <span>Select</span>
                  {/if}
                </label>
                {#if cardHref(card)}
                  <a class="classic-card-main" href={cardHref(card) ?? ''} aria-label={card.title}>
                    <div
                      class="classic-card-art"
                      class:has-artwork={Boolean(card.thumbnail)}
                      data-artwork-shape={artworkShape}
                      aria-hidden="true"
                    >
                      {#if card.thumbnail}
                        <img src={card.thumbnail} alt="" loading="lazy" decoding="async" />
                      {/if}
                    </div>
                    <div class="classic-card-copy">
                      <strong>{card.title}</strong>
                      {#if card.subtitle}
                        <span>{card.subtitle}</span>
                      {/if}
                    </div>
                  </a>
                {:else}
                  <div class="classic-card-main" aria-label={card.title}>
                    <div
                      class="classic-card-art"
                      class:has-artwork={Boolean(card.thumbnail)}
                      data-artwork-shape={artworkShape}
                      aria-hidden="true"
                    >
                      {#if card.thumbnail}
                        <img src={card.thumbnail} alt="" loading="lazy" decoding="async" />
                      {/if}
                    </div>
                    <div class="classic-card-copy">
                      <strong>{card.title}</strong>
                      {#if card.subtitle}
                        <span>{card.subtitle}</span>
                      {/if}
                    </div>
                  </div>
                {/if}
                {#if card.action}
                  {@const thumbsItem = thumbsUpItem(card)}
                  {@const downloadAction = downloadableAction(card.action)}
                  {@const browserAction = browserPlayableAction(card.action)}
                  {@const playlistAction = localPlaylistAction(card.action)}
                  <div class="classic-card-actions">
                    <button type="button" onclick={() => void playCard(card)}>Play</button>
                    <button type="button" onclick={() => void queueCard(card)}>Queue</button>
                    <button
                      type="button"
                      disabled={pendingEditKey === card.key}
                      onclick={() => void openMetadataEditor(card)}>Edit</button
                    >
                    {#if thumbsItem}
                      <button
                        type="button"
                        aria-pressed={isThumbedUp(card)}
                        disabled={!thumbsUpDispatchAvailable}
                        onclick={() => toggleThumbsUp(card)}
                      >
                        {isThumbedUp(card) ? 'Thumbed up' : 'Thumbs up'}
                      </button>
                    {/if}
                    {#if playlistAction}
                      <button
                        type="button"
                        disabled={!localPlaylistDispatchAvailable ||
                          !localPlaylistSnapshot?.selectedPlaylistId ||
                          pendingLocalPlaylistKey === localPlaylistActionKey(playlistAction)}
                        onclick={() => void addCardToLocalPlaylist(card)}>Add to playlist</button
                      >
                    {/if}
                    {#if browserAction}
                      <button type="button" onclick={() => void playCardInBrowser(card)}>
                        Play in browser
                      </button>
                    {/if}
                    {#if downloadAction}
                      <button
                        type="button"
                        disabled={pendingDownloadKey === downloadActionKey(downloadAction)}
                        onclick={() => void downloadCard(card)}>Download</button
                      >
                    {/if}
                  </div>
                {/if}
              </article>
            {/each}
          </div>
          {#if visibleCards.length < section.cards.length}
            <button
              type="button"
              class="classic-show-more"
              onclick={() => showMoreCards(section, sectionIndex)}
            >
              Show more ({visibleCards.length} of {section.cards.length})
            </button>
          {/if}
        {:else if !section.movieDetail}
          <p class="classic-empty">{section.empty}</p>
        {/if}
      </section>
    {/each}
    {#if metadataEditTarget}
      <MetadataEditDialog
        definition={metadataEditTarget.definition}
        source={metadataEditTarget.source}
        pending={pendingEditKey === metadataEditTarget.key}
        error={metadataEditError}
        onSave={saveMetadataEdit}
        onCancel={cancelMetadataEdit}
      />
    {/if}
    {#if actionStatus}
      <p class="classic-action-status" role="status" aria-live="polite">{actionStatus}</p>
    {/if}
  </div>
</section>
