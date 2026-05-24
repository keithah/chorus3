<script lang="ts" module>
  export type MediaSearchActionItem =
    | { kind: 'artist'; id: number }
    | { kind: 'album'; id: number }
    | { kind: 'song'; id: number };

  export interface MediaSearchActionDispatch {
    playMusicItem: (item: MediaSearchActionItem) => Promise<void> | void;
    queueMusicItem: (item: MediaSearchActionItem) => Promise<void> | void;
  }

  export interface MediaSearchPanelDispatch {
    search: (request: { query: string; scope?: 'all' | 'music' | 'video' }) => Promise<void> | void;
    clear: () => Promise<void> | void;
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import {
    searchAddonsStore as defaultSearchAddonsStore,
    type SearchAddonSetting,
    type SearchAddonsStore
  } from '$lib/stores/searchAddons.svelte';
  import type {
    MediaSearchAlbumResult,
    MediaSearchArtistResult,
    MediaSearchGenreResult,
    MediaSearchMovieResult,
    MediaSearchMusicVideoResult,
    MediaSearchResult,
    MediaSearchStoreSnapshot,
    MediaSearchSongResult,
    MediaSearchTvShowResult
  } from '$lib/stores/mediaSearch.svelte';
  import type { MusicLibraryLimitsSnapshot } from '$lib/stores/musicLibraryNormalization';

  interface Props {
    snapshot: MediaSearchStoreSnapshot;
    dispatch: MediaSearchPanelDispatch;
    actionDispatch: MediaSearchActionDispatch;
    i18n?: TranslationContext;
    searchAddons?: SearchAddonsStore;
    buildOptions?: BuildAppRouteOptions;
  }

  type ResultGroupKey =
    | 'artists'
    | 'albums'
    | 'songs'
    | 'genres'
    | 'movies'
    | 'tvShows'
    | 'musicVideos';
  type MusicActionVerb = 'play' | 'queue';
  type PendingOperation = 'search' | 'clear' | null;

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
  let localStatusText = $state<string | null>(null);
  let localErrorText = $state<string | null>(null);

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

  async function handleSearch(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (searchDisabled) {
      return;
    }

    const query = inputValue.trim();
    localStatusText = i18n.t('media.search.status.searchingQuery', {
      query: query || i18n.t('media.search.currentQuery')
    });
    localErrorText = null;
    pendingOperation = 'search';

    try {
      await dispatch.search({ query, scope: 'all' });
      localStatusText = null;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : i18n.t('media.search.error.searchFailed')
      );
      localErrorText = i18n.t('media.search.error.couldNotSearch', { message });
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

  function formatSearchStatus(value: MediaSearchStoreSnapshot): string {
    const query = displayText(value.query, '');

    if (value.searchStatus === 'loading') {
      return query
        ? i18n.t('media.search.status.searchingQuery', { query })
        : i18n.t('media.search.status.searching');
    }

    if (value.searchStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.searchStatus === 'ready') {
      if (value.isEmpty || value.resultCounts.total === 0) {
        return query
          ? i18n.t('media.search.status.noResultsFor', { query })
          : i18n.t('media.search.status.noResults');
      }

      const updated = textOrNull(value.lastUpdatedAt);
      const suffix = updated ? i18n.t('media.status.lastUpdated', { updated }) : '';
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

    return i18n.t('media.search.status.idle');
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

  function searchActionFor(result: MediaSearchResult): MediaSearchActionItem | null {
    if (result.kind === 'artist') {
      return isPositiveInteger(result.artistid) ? { kind: 'artist', id: result.artistid } : null;
    }

    if (result.kind === 'album') {
      return isPositiveInteger(result.albumid) ? { kind: 'album', id: result.albumid } : null;
    }

    if (result.kind === 'song') {
      return isPositiveInteger(result.songid) ? { kind: 'song', id: result.songid } : null;
    }

    return null;
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

  function safeEachKey(prefix: string, id: unknown, index: number): string {
    return isPositiveInteger(id) ? `${prefix}:${id}` : `${prefix}:invalid:${index}`;
  }

  function safeArtistLabel(artist: MediaSearchArtistResult): string {
    return displayText(artist.label, i18n.t('media.unknown.artist'));
  }

  function safeAlbumLabel(album: MediaSearchAlbumResult): string {
    return displayText(album.title ?? album.label, i18n.t('media.unknown.album'));
  }

  function safeSongLabel(song: MediaSearchSongResult): string {
    return displayText(song.title ?? song.label, i18n.t('media.unknown.song'));
  }

  function safeGenreLabel(genre: MediaSearchGenreResult): string {
    return displayText(genre.title ?? genre.label, i18n.t('media.unknown.genre'));
  }

  function safeMovieLabel(movie: MediaSearchMovieResult): string {
    return displayText(movie.title ?? movie.label, 'Unknown movie');
  }

  function safeTvShowLabel(tvShow: MediaSearchTvShowResult): string {
    return displayText(tvShow.title ?? tvShow.label, 'Unknown TV show');
  }

  function safeMusicVideoLabel(musicVideo: MediaSearchMusicVideoResult): string {
    return displayText(musicVideo.title ?? musicVideo.label, 'Unknown music video');
  }

  function artistMeta(artist: MediaSearchArtistResult): string | null {
    return joinText(artist.genre);
  }

  function albumMeta(album: MediaSearchAlbumResult): string {
    return [joinText(album.artist), formatYear(album.year)].filter(Boolean).join(' · ');
  }

  function songMeta(song: MediaSearchSongResult): string {
    return [
      joinText(song.artist),
      textOrNull(song.album),
      formatDuration(song.duration),
      formatTrack(song.track),
      formatPlaycount(song.playcount)
    ]
      .filter(Boolean)
      .join(' · ');
  }

  function movieMeta(movie: MediaSearchMovieResult): string {
    return formatYear(movie.year) ?? '';
  }

  function tvShowMeta(tvShow: MediaSearchTvShowResult): string {
    return formatYear(tvShow.year) ?? '';
  }

  function musicVideoMeta(musicVideo: MediaSearchMusicVideoResult): string {
    return [joinText(musicVideo.artist), musicVideo.album, formatYear(musicVideo.year)]
      .filter(Boolean)
      .join(' · ');
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

  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }

  function formatDuration(seconds: unknown): string | null {
    const value = numberOrNull(seconds);
    if (value === null) {
      return null;
    }

    const safeSeconds = Math.max(0, Math.floor(value));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
    }

    return `${minutes}:${pad2(remainingSeconds)}`;
  }

  function formatYear(value: unknown): string | null {
    const year = numberOrNull(value);
    return year === null ? null : String(Math.trunc(year));
  }

  function formatTrack(value: unknown): string | null {
    const track = numberOrNull(value);
    return track === null ? null : i18n.t('media.meta.track', { track: Math.trunc(track) });
  }

  function formatPlaycount(value: unknown): string | null {
    const playcount = numberOrNull(value);
    if (playcount === null) {
      return null;
    }

    const rounded = Math.max(0, Math.trunc(playcount));
    return rounded === 1
      ? i18n.t('media.meta.playedOnce')
      : i18n.t('media.meta.playedTimes', { count: rounded });
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

  function externalSearchUrl(
    provider: 'google' | 'imdb' | 'tmdb' | 'tvdb' | 'soundcloud' | 'youtube'
  ): string {
    const query = encodeURIComponent(providerQuery());

    if (provider === 'google') return `https://www.google.com/webhp?#q=${query}`;
    if (provider === 'imdb') return `https://www.imdb.com/find/?s=all&q=${query}`;
    if (provider === 'tmdb') return `https://www.themoviedb.org/search?query=${query}`;
    if (provider === 'tvdb') return `https://thetvdb.com/search?query=${query}`;
    if (provider === 'soundcloud') return `https://soundcloud.com/search?q=${query}`;
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  function customAddonSearchHref(row: SearchAddonSetting): string {
    const query = providerQuery();
    const pluginUrl = row.url.replaceAll('[QUERY]', query).replaceAll('{query}', query);

    return buildPrimaryAppRoute(
      { kind: 'browserItem', media: row.media, itemid: pluginUrl },
      buildOptions
    );
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

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="media-search-panel surface" aria-labelledby="media-search-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('media.search.kicker')}</p>
    <h2 id="media-search-title">{i18n.t('media.search.title')}</h2>
    <p class="summary-line">
      {i18n.t('media.search.description')}
    </p>
  </div>

  <form
    class="search-form"
    role="search"
    aria-label={i18n.t('media.search.formAria')}
    onsubmit={handleSearch}
  >
    <div class="search-field">
      <label for="media-search-query">{i18n.t('media.search.label')}</label>
      <input
        id="media-search-query"
        name="query"
        type="search"
        autocomplete="off"
        bind:value={inputValue}
        placeholder={i18n.t('media.search.placeholder')}
      />
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

  <section class="provider-search" aria-labelledby="media-search-providers-title">
    <div class="provider-search__heading">
      <h3 id="media-search-providers-title">Search providers</h3>
      <a href={buildPrimaryAppRoute({ kind: 'settingsSearch' }, buildOptions)}>Configure add-ons</a>
    </div>
    <div class="provider-search__links">
      <a
        class:disabled={!hasProviderLinks}
        aria-disabled={!hasProviderLinks}
        href={hasProviderLinks ? externalSearchUrl('google') : '#'}
        target="_blank"
        rel="noreferrer">Google</a
      >
      <a
        class:disabled={!hasProviderLinks}
        aria-disabled={!hasProviderLinks}
        href={hasProviderLinks ? externalSearchUrl('imdb') : '#'}
        target="_blank"
        rel="noreferrer">IMDb</a
      >
      <a
        class:disabled={!hasProviderLinks}
        aria-disabled={!hasProviderLinks}
        href={hasProviderLinks ? externalSearchUrl('tvdb') : '#'}
        target="_blank"
        rel="noreferrer">TVDb</a
      >
      <a
        class:disabled={!hasProviderLinks}
        aria-disabled={!hasProviderLinks}
        href={hasProviderLinks ? externalSearchUrl('tmdb') : '#'}
        target="_blank"
        rel="noreferrer">TMDb</a
      >
      <a
        class:disabled={!hasProviderLinks}
        aria-disabled={!hasProviderLinks}
        href={hasProviderLinks ? externalSearchUrl('soundcloud') : '#'}
        target="_blank"
        rel="noreferrer">SoundCloud</a
      >
      <a
        class:disabled={!hasProviderLinks}
        aria-disabled={!hasProviderLinks}
        href={hasProviderLinks ? externalSearchUrl('youtube') : '#'}
        target="_blank"
        rel="noreferrer">YouTube</a
      >
      {#each customAddonSearchRows as row (row.id)}
        <a
          class:disabled={!hasProviderLinks}
          aria-disabled={!hasProviderLinks}
          href={hasProviderLinks ? customAddonSearchHref(row) : '#'}
          data-custom-addon-search={row.id}>{displayText(row.title, 'Add-on search')}</a
        >
      {/each}
    </div>
  </section>

  {#if snapshot.searchStatus === 'loading'}
    <p class="state-copy">{i18n.t('media.search.state.loading')}</p>
  {:else if snapshot.searchStatus === 'idle'}
    <p class="state-copy">{i18n.t('media.search.state.idle')}</p>
  {:else if snapshot.isEmpty}
    <p class="state-copy">{i18n.t('media.search.state.noMatch')}</p>
  {/if}

  <section class="results-shell" aria-labelledby="media-search-results-title">
    <div class="results-heading">
      <div>
        <p class="breadcrumb">{i18n.t('media.search.resultsKicker')}</p>
        <h3 id="media-search-results-title">{i18n.t('media.search.resultsTitle')}</h3>
      </div>
      <p class="count-chip">{resultCountCopy(snapshot.resultCounts.total)}</p>
    </div>

    <div class="results-grid">
      <section class="result-section" aria-labelledby="media-search-artists-title">
        <div class="section-heading">
          <h4 id="media-search-artists-title">{i18n.t('media.heading.artists')}</h4>
          <p>{groupCountSummary('artists')}</p>
        </div>
        {#if snapshot.results.artists.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('artists')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.artists as artist, index (safeEachKey('artist', artist.artistid, index))}
              {@const label = safeArtistLabel(artist)}
              {@const actionItem = searchActionFor(artist)}
              <li class="result-card">
                <span class="item-kicker">{i18n.t('media.kind.artist')}</span>
                <span class="item-title">{label}</span>
                {#if artistMeta(artist)}
                  <span class="item-meta">{artistMeta(artist)}</span>
                {/if}
                {#if actionItem}
                  <div
                    class="action-row"
                    aria-label={i18n.t('media.action.actionsFor', {
                      kind: itemKindLabel(actionItem.kind),
                      label
                    })}
                  >
                    <button
                      type="button"
                      class="action-button"
                      aria-label={actionLabel('play', actionItem, label)}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() =>
                        handleMusicAction('play', actionItem, actionTargetLabel(actionItem, label))}
                    >
                      {i18n.t('media.action.play')}
                    </button>
                    <button
                      type="button"
                      class="action-button"
                      aria-label={actionLabel('queue', actionItem, label)}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() =>
                        handleMusicAction(
                          'queue',
                          actionItem,
                          actionTargetLabel(actionItem, label)
                        )}
                    >
                      {i18n.t('media.action.queue')}
                    </button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="result-section" aria-labelledby="media-search-albums-title">
        <div class="section-heading">
          <h4 id="media-search-albums-title">{i18n.t('media.heading.albums')}</h4>
          <p>{groupCountSummary('albums')}</p>
        </div>
        {#if snapshot.results.albums.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('albums')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.albums as album, index (safeEachKey('album', album.albumid, index))}
              {@const label = safeAlbumLabel(album)}
              {@const actionItem = searchActionFor(album)}
              <li class="result-card">
                <span class="item-kicker">{i18n.t('media.kind.album')}</span>
                <span class="item-title">{label}</span>
                {#if albumMeta(album)}
                  <span class="item-meta">{albumMeta(album)}</span>
                {/if}
                {#if actionItem}
                  <div
                    class="action-row"
                    aria-label={i18n.t('media.action.actionsFor', {
                      kind: itemKindLabel(actionItem.kind),
                      label
                    })}
                  >
                    <button
                      type="button"
                      class="action-button"
                      aria-label={actionLabel('play', actionItem, label)}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() =>
                        handleMusicAction('play', actionItem, actionTargetLabel(actionItem, label))}
                    >
                      {i18n.t('media.action.play')}
                    </button>
                    <button
                      type="button"
                      class="action-button"
                      aria-label={actionLabel('queue', actionItem, label)}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() =>
                        handleMusicAction(
                          'queue',
                          actionItem,
                          actionTargetLabel(actionItem, label)
                        )}
                    >
                      {i18n.t('media.action.queue')}
                    </button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="result-section" aria-labelledby="media-search-songs-title">
        <div class="section-heading">
          <h4 id="media-search-songs-title">{i18n.t('media.heading.songs')}</h4>
          <p>{groupCountSummary('songs')}</p>
        </div>
        {#if snapshot.results.songs.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('songs')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.songs as song, index (safeEachKey('song', song.songid, index))}
              {@const label = safeSongLabel(song)}
              {@const actionItem = searchActionFor(song)}
              <li class="result-card" data-songid={song.songid}>
                <span class="item-kicker">{i18n.t('media.kind.song')}</span>
                <span class="item-title">{label}</span>
                <span class="identity-chip">{i18n.t('media.songId', { songid: song.songid })}</span>
                {#if songMeta(song)}
                  <span class="item-meta">{songMeta(song)}</span>
                {/if}
                {#if actionItem}
                  <div
                    class="action-row"
                    aria-label={i18n.t('media.action.actionsFor', {
                      kind: itemKindLabel(actionItem.kind),
                      label
                    })}
                  >
                    <button
                      type="button"
                      class="action-button"
                      aria-label={actionLabel('play', actionItem, label)}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() =>
                        handleMusicAction('play', actionItem, actionTargetLabel(actionItem, label))}
                    >
                      {i18n.t('media.action.play')}
                    </button>
                    <button
                      type="button"
                      class="action-button"
                      aria-label={actionLabel('queue', actionItem, label)}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() =>
                        handleMusicAction(
                          'queue',
                          actionItem,
                          actionTargetLabel(actionItem, label)
                        )}
                    >
                      {i18n.t('media.action.queue')}
                    </button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="result-section" aria-labelledby="media-search-movies-title">
        <div class="section-heading">
          <h4 id="media-search-movies-title">Movies</h4>
          <p>{groupCountSummary('movies')}</p>
        </div>
        {#if snapshot.results.movies.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('movies')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.movies as movie, index (safeEachKey('movie', movie.movieid, index))}
              {@const label = safeMovieLabel(movie)}
              <li class="result-card">
                <span class="item-kicker">Movie</span>
                <span class="item-title">{label}</span>
                {#if movieMeta(movie)}
                  <span class="item-meta">{movieMeta(movie)}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="result-section" aria-labelledby="media-search-tvshows-title">
        <div class="section-heading">
          <h4 id="media-search-tvshows-title">TV Shows</h4>
          <p>{groupCountSummary('tvShows')}</p>
        </div>
        {#if snapshot.results.tvShows.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('tvShows')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.tvShows as tvShow, index (safeEachKey('tvshow', tvShow.tvshowid, index))}
              {@const label = safeTvShowLabel(tvShow)}
              <li class="result-card">
                <span class="item-kicker">TV show</span>
                <span class="item-title">{label}</span>
                {#if tvShowMeta(tvShow)}
                  <span class="item-meta">{tvShowMeta(tvShow)}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="result-section" aria-labelledby="media-search-musicvideos-title">
        <div class="section-heading">
          <h4 id="media-search-musicvideos-title">Music Videos</h4>
          <p>{groupCountSummary('musicVideos')}</p>
        </div>
        {#if snapshot.results.musicVideos.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('musicVideos')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.musicVideos as musicVideo, index (safeEachKey('musicvideo', musicVideo.musicvideoid, index))}
              {@const label = safeMusicVideoLabel(musicVideo)}
              <li class="result-card">
                <span class="item-kicker">Music video</span>
                <span class="item-title">{label}</span>
                {#if musicVideoMeta(musicVideo)}
                  <span class="item-meta">{musicVideoMeta(musicVideo)}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="result-section" aria-labelledby="media-search-genres-title">
        <div class="section-heading">
          <h4 id="media-search-genres-title">{i18n.t('media.heading.genres')}</h4>
          <p>{groupCountSummary('genres')}</p>
        </div>
        {#if snapshot.results.genres.length === 0}
          <p class="empty-copy">{sectionEmptyCopy('genres')}</p>
        {:else}
          <ul class="result-list">
            {#each snapshot.results.genres as genre, index (safeEachKey('genre', genre.genreid, index))}
              {@const label = safeGenreLabel(genre)}
              <li class="result-card">
                <span class="item-kicker">{i18n.t('media.kind.genre')}</span>
                <span class="item-title">{label}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  </section>
</section>

<style>
  .media-search-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .search-form,
  .search-field,
  .results-shell,
  .result-section,
  .section-heading,
  .result-card {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  h3,
  h4,
  p,
  ul {
    margin: 0;
  }

  .section-kicker,
  .breadcrumb,
  .item-kicker,
  .identity-chip,
  .count-chip,
  .section-heading p {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .section-kicker,
  .breadcrumb,
  .item-kicker {
    color: var(--color-accent);
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(1.4rem, 3vw, 2.1rem);
    line-height: 1.08;
    text-wrap: balance;
  }

  h3 {
    font-size: 1.08rem;
    line-height: 1.2;
    text-wrap: balance;
  }

  h4 {
    font-size: 0.98rem;
    line-height: 1.25;
    text-wrap: balance;
  }

  .summary-line,
  .state-copy,
  .empty-copy,
  .error-copy,
  .item-meta,
  .section-heading p {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .search-form {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-md);
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 70%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .search-field label {
    color: var(--color-text);
    font-weight: 800;
  }

  input[type='search'] {
    min-height: 2.75rem;
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
    font: inherit;
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-surface) 82%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  input[type='search']:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .search-actions,
  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .primary-button,
  .secondary-button,
  .action-button {
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    font: inherit;
    color: var(--color-text);
    font-weight: 800;
    cursor: pointer;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease,
      background-color 140ms ease;
  }

  .primary-button {
    background: color-mix(in srgb, var(--color-accent) 20%, var(--color-surface-raised));
  }

  .secondary-button,
  .action-button {
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  button:active:not(:disabled) {
    transform: scale(0.96);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 74%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .provider-search {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .provider-search__heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .provider-search__heading a,
  .provider-search__links a {
    color: var(--color-accent);
    font-weight: 800;
    text-decoration: none;
  }

  .provider-search__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs) var(--space-md);
  }

  .provider-search__links a.disabled {
    color: var(--color-text-muted);
    pointer-events: none;
    opacity: 0.65;
  }

  .error-copy {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-danger, #c2410c) 12%, var(--color-surface-raised));
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--color-danger, #c2410c) 36%, var(--color-border));
  }

  .results-shell,
  .result-section {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .results-heading,
  .section-heading {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .count-chip,
  .identity-chip,
  .section-heading p {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .count-chip,
  .identity-chip {
    width: max-content;
    max-width: 100%;
    padding: 0.12rem 0.45rem;
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-accent) 16%, transparent);
    border-radius: var(--radius-pill);
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .result-section {
    align-content: start;
    min-width: 0;
  }

  .result-list {
    display: grid;
    gap: var(--space-xs);
    padding: 0;
    list-style: none;
  }

  .result-card {
    min-width: 0;
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-surface) 66%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 72%, transparent);
  }

  .item-title {
    overflow-wrap: anywhere;
    font-weight: 800;
  }

  .item-meta {
    overflow-wrap: anywhere;
    font-size: 0.9rem;
  }

  @media (max-width: 820px) {
    .search-form,
    .results-grid {
      grid-template-columns: 1fr;
    }

    .search-actions {
      align-items: stretch;
    }

    .primary-button,
    .secondary-button {
      flex: 1 1 10rem;
    }
  }

  @media (max-width: 560px) {
    .results-heading,
    .section-heading {
      grid-template-columns: 1fr;
    }
  }
</style>
