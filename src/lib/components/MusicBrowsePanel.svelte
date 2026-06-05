<script lang="ts" module>
  import type { MusicBrowseActionItem as ImportedMusicBrowseActionItem } from './musicBrowsePanelModel';
  import type {
    MusicBrowseAlbumPick,
    MusicBrowseArtistPick,
    MusicBrowseGenrePick
  } from '$lib/stores/musicBrowse.svelte';

  export type MusicBrowseActionItem = ImportedMusicBrowseActionItem;

  export interface MusicBrowseActionDispatch {
    playMusicItem: (item: MusicBrowseActionItem) => Promise<void> | void;
    queueMusicItem: (item: MusicBrowseActionItem) => Promise<void> | void;
  }

  export interface MusicBrowsePanelDispatch {
    browseArtist: (artist: MusicBrowseArtistPick) => Promise<void> | void;
    browseAlbum: (album: MusicBrowseAlbumPick) => Promise<void> | void;
    browseGenre: (genre: MusicBrowseGenrePick) => Promise<void> | void;
    clearSelection: () => Promise<void> | void;
  }
</script>

<script lang="ts">
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';
  import {
    albumMusicBrowseDetailEmptyCopy,
    capitalizeMusicBrowseText,
    formatMusicBrowseAlbumMeta,
    formatMusicBrowseArtistMeta,
    formatMusicBrowseCountSummary,
    formatMusicBrowseDetailCountSummary,
    formatMusicBrowseSelectionTarget,
    formatMusicBrowseSelectionTitle,
    formatMusicBrowseSongMeta,
    formatMusicBrowseStatus,
    musicBrowseActionForAlbum,
    musicBrowseActionForArtist,
    musicBrowseActionForSong,
    musicBrowseActionId,
    musicBrowseActionTargetKey,
    musicBrowseEachKey,
    safeMusicBrowseAlbumLabel,
    safeMusicBrowseArtistLabel,
    safeMusicBrowseGenreLabel,
    safeMusicBrowseSelectionLabel,
    safeMusicBrowseSongLabel,
    sanitizeMusicBrowseUiText,
    songMusicBrowseDetailEmptyCopy,
    topLevelMusicBrowseEmptyCopy,
    type MusicBrowseActionVerb,
    type MusicBrowseDetailKind,
    type MusicBrowseTopLevelKind
  } from './musicBrowsePanelModel';
  import type { MusicBrowseStoreSnapshot } from '$lib/stores/musicBrowse.svelte';
  import type {
    MusicLibraryAlbumSnapshot,
    MusicLibraryArtistSnapshot,
    MusicLibraryGenreSnapshot,
    MusicLibraryStoreSnapshot
  } from '$lib/stores/musicLibrary.svelte';

  interface Props {
    librarySnapshot: MusicLibraryStoreSnapshot;
    browseSnapshot: MusicBrowseStoreSnapshot;
    dispatch: MusicBrowsePanelDispatch;
    i18n?: TranslationContext;
    actionDispatch: MusicBrowseActionDispatch;
  }

  type PendingMusicAction = {
    id: string;
    verb: MusicBrowseActionVerb;
    label: string;
    item: MusicBrowseActionItem;
  };

  let {
    librarySnapshot,
    browseSnapshot,
    dispatch,
    actionDispatch,
    i18n = createTranslationContext('en')
  }: Props = $props();

  let pendingAction = $state<PendingMusicAction | null>(null);
  let actionStatusText = $state<string | null>(null);
  let actionErrorText = $state<string | null>(null);
  const artistVisibility = createIncrementalVisibility(120);
  const albumVisibility = createIncrementalVisibility(120);
  const genreVisibility = createIncrementalVisibility(120);
  const detailAlbumVisibility = createIncrementalVisibility(120);
  const detailSongVisibility = createIncrementalVisibility(120);

  const isLoading = $derived(browseSnapshot.refreshStatus === 'loading');
  const hasSelection = $derived(Boolean(browseSnapshot.selection));
  const statusText = $derived(actionStatusText ?? formatMusicBrowseStatus(browseSnapshot));
  const selectionTitle = $derived(formatMusicBrowseSelectionTitle(browseSnapshot.selection));
  const detailTarget = $derived(formatMusicBrowseSelectionTarget(browseSnapshot.selection));
  const visibleArtists = $derived(artistVisibility.visibleItems(librarySnapshot.artists));
  const visibleAlbums = $derived(albumVisibility.visibleItems(librarySnapshot.albums));
  const visibleGenres = $derived(genreVisibility.visibleItems(librarySnapshot.genres));
  const visibleDetailAlbums = $derived(detailAlbumVisibility.visibleItems(browseSnapshot.albums));
  const visibleDetailSongs = $derived(detailSongVisibility.visibleItems(browseSnapshot.songs));

  function handleBrowseArtist(artist: MusicLibraryArtistSnapshot): void {
    if (isLoading) {
      return;
    }

    dispatch.browseArtist({ artistid: artist.artistid, label: safeMusicBrowseArtistLabel(artist) });
  }

  function handleBrowseAlbum(album: MusicLibraryAlbumSnapshot): void {
    if (isLoading) {
      return;
    }

    dispatch.browseAlbum({ albumid: album.albumid, label: safeMusicBrowseAlbumLabel(album) });
  }

  function handleBrowseGenre(genre: MusicLibraryGenreSnapshot): void {
    if (isLoading) {
      return;
    }

    dispatch.browseGenre({ genreid: genre.genreid, label: safeMusicBrowseGenreLabel(genre) });
  }

  function handleClearSelection(): void {
    if (isLoading) {
      return;
    }

    dispatch.clearSelection();
  }

  async function handleMusicAction(
    verb: MusicBrowseActionVerb,
    item: MusicBrowseActionItem,
    label: string
  ): Promise<void> {
    if (isLoading || pendingAction) {
      return;
    }

    const action = { id: musicBrowseActionId(verb, item), verb, item, label };
    pendingAction = action;
    actionErrorText = null;
    actionStatusText = `${capitalizeMusicBrowseText(
      verb === 'play' ? 'playing' : 'queueing'
    )} ${label}…`;

    try {
      if (verb === 'play') {
        await actionDispatch.playMusicItem(item);
      } else {
        await actionDispatch.queueMusicItem(item);
      }
      actionStatusText = `${verb === 'play' ? 'Played' : 'Queued'} ${label}.`;
    } catch (error) {
      const message = sanitizeMusicBrowseUiText(
        error instanceof Error ? error.message : 'Music action failed.'
      );
      actionErrorText = `Could not ${verb} ${label}. ${message}`;
      actionStatusText = `Could not ${verb} ${label}. ${message}`;
    } finally {
      pendingAction = null;
    }
  }

  function isActionDisabled(item: MusicBrowseActionItem): boolean {
    if (isLoading) {
      return true;
    }

    if (!pendingAction) {
      return false;
    }

    return musicBrowseActionTargetKey(pendingAction.item) === musicBrowseActionTargetKey(item);
  }

  function countSummary(kind: MusicBrowseTopLevelKind, count: number): string {
    const limits = librarySnapshot.limits[kind];
    return formatMusicBrowseCountSummary(count, limits);
  }

  function detailCountSummary(kind: MusicBrowseDetailKind, count: number): string {
    const limits = browseSnapshot.limits[kind];
    return formatMusicBrowseDetailCountSummary(kind, count, limits);
  }

  function albumDetailEmptyCopy(): string {
    return albumMusicBrowseDetailEmptyCopy(browseSnapshot.selection, detailTarget);
  }

  function songDetailEmptyCopy(): string {
    return songMusicBrowseDetailEmptyCopy(detailTarget);
  }
</script>

<section class="music-browse-panel surface" aria-labelledby="music-browse-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('music.browse.kicker')}</p>
    <h2 id="music-browse-title">{i18n.t('music.browse.title')}</h2>
    <p class="summary-line">
      Select an artist, album, or genre to inspect read-only Kodi-shaped music details.
    </p>
  </div>

  <div class="browse-grid" aria-label="Music browse choices">
    <section class="choice-section" aria-labelledby="music-browse-artists-title">
      <div class="section-heading">
        <h3 id="music-browse-artists-title">Artists</h3>
        <p>{countSummary('artists', librarySnapshot.artists.length)}</p>
      </div>
      {#if librarySnapshot.artists.length === 0}
        <p class="empty-copy">{topLevelMusicBrowseEmptyCopy('artists')}</p>
      {:else}
        <ul class="choice-list">
          {#each visibleArtists as artist, index (musicBrowseEachKey('artist', artist.artistid, index))}
            {@const label = safeMusicBrowseArtistLabel(artist)}
            {@const actionItem = musicBrowseActionForArtist(artist)}
            <li>
              <button
                type="button"
                class="choice-button"
                aria-label={`Browse artist ${label}`}
                disabled={isLoading}
                onclick={() => handleBrowseArtist(artist)}
              >
                <span class="button-kicker">Browse artist</span>
                <span class="item-title">{label}</span>
                {#if formatMusicBrowseArtistMeta(artist)}
                  <span class="item-meta">{formatMusicBrowseArtistMeta(artist)}</span>
                {/if}
              </button>
              {#if actionItem}
                <div class="action-row" aria-label={`Actions for artist ${label}`}>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Play artist ${label}`}
                    disabled={isActionDisabled(actionItem)}
                    onclick={() => handleMusicAction('play', actionItem, `artist ${label}`)}
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Queue artist ${label}`}
                    disabled={isActionDisabled(actionItem)}
                    onclick={() => handleMusicAction('queue', actionItem, `artist ${label}`)}
                  >
                    Queue
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
        {#if artistVisibility.hasMore(librarySnapshot.artists.length)}
          <button type="button" class="show-more-button" onclick={artistVisibility.showMore}>
            Show more artists
          </button>
        {/if}
      {/if}
    </section>

    <section class="choice-section" aria-labelledby="music-browse-albums-title">
      <div class="section-heading">
        <h3 id="music-browse-albums-title">Albums</h3>
        <p>{countSummary('albums', librarySnapshot.albums.length)}</p>
      </div>
      {#if librarySnapshot.albums.length === 0}
        <p class="empty-copy">{topLevelMusicBrowseEmptyCopy('albums')}</p>
      {:else}
        <ul class="choice-list">
          {#each visibleAlbums as album, index (musicBrowseEachKey('album', album.albumid, index))}
            {@const label = safeMusicBrowseAlbumLabel(album)}
            {@const actionItem = musicBrowseActionForAlbum(album)}
            <li>
              <button
                type="button"
                class="choice-button"
                aria-label={`Browse album ${label}`}
                disabled={isLoading}
                onclick={() => handleBrowseAlbum(album)}
              >
                <span class="button-kicker">Browse album</span>
                <span class="item-title">{label}</span>
                {#if formatMusicBrowseAlbumMeta(album)}
                  <span class="item-meta">{formatMusicBrowseAlbumMeta(album)}</span>
                {/if}
              </button>
              {#if actionItem}
                <div class="action-row" aria-label={`Actions for album ${label}`}>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Play album ${label}`}
                    disabled={isActionDisabled(actionItem)}
                    onclick={() => handleMusicAction('play', actionItem, `album ${label}`)}
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Queue album ${label}`}
                    disabled={isActionDisabled(actionItem)}
                    onclick={() => handleMusicAction('queue', actionItem, `album ${label}`)}
                  >
                    Queue
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
        {#if albumVisibility.hasMore(librarySnapshot.albums.length)}
          <button type="button" class="show-more-button" onclick={albumVisibility.showMore}>
            Show more albums
          </button>
        {/if}
      {/if}
    </section>

    <section class="choice-section" aria-labelledby="music-browse-genres-title">
      <div class="section-heading">
        <h3 id="music-browse-genres-title">Genres</h3>
        <p>{countSummary('genres', librarySnapshot.genres.length)}</p>
      </div>
      {#if librarySnapshot.genres.length === 0}
        <p class="empty-copy">{topLevelMusicBrowseEmptyCopy('genres')}</p>
      {:else}
        <ul class="choice-list">
          {#each visibleGenres as genre, index (musicBrowseEachKey('genre', genre.genreid, index))}
            {@const label = safeMusicBrowseGenreLabel(genre)}
            <li>
              <button
                type="button"
                class="choice-button"
                aria-label={`Browse genre ${label}`}
                disabled={isLoading}
                onclick={() => handleBrowseGenre(genre)}
              >
                <span class="item-title">{label}</span>
                <span class="button-kicker">Browse genre</span>
              </button>
            </li>
          {/each}
        </ul>
        {#if genreVisibility.hasMore(librarySnapshot.genres.length)}
          <button type="button" class="show-more-button" onclick={genreVisibility.showMore}>
            Show more genres
          </button>
        {/if}
      {/if}
    </section>
  </div>

  <section class="detail-section" aria-labelledby="music-browse-detail-title">
    <div class="detail-heading">
      <div>
        <p class="breadcrumb">{selectionTitle}</p>
        <h3 id="music-browse-detail-title">Browse Details</h3>
      </div>
      <button
        type="button"
        class="clear-button"
        aria-label="Clear music browse selection"
        disabled={!hasSelection || isLoading}
        onclick={handleClearSelection}
      >
        Clear selection
      </button>
    </div>

    <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>
    {#if actionErrorText}
      <p class="error-copy" role="alert">{actionErrorText}</p>
    {/if}

    {#if !browseSnapshot.selection}
      <p class="state-copy">No browse selection yet.</p>
    {:else}
      {#if isLoading}
        <p class="state-copy">Loading browse details…</p>
      {/if}

      {#if browseSnapshot.refreshStatus === 'error' && browseSnapshot.lastError}
        <p class="error-copy">{sanitizeMusicBrowseUiText(browseSnapshot.lastError.message)}</p>
      {/if}

      {#if browseSnapshot.isEmpty && !isLoading}
        <p class="state-copy">
          No albums or songs found for {safeMusicBrowseSelectionLabel(browseSnapshot.selection)}.
        </p>
      {/if}

      <div class="detail-grid">
        <section class="result-section" aria-labelledby="music-browse-detail-albums-title">
          <div class="section-heading">
            <h4 id="music-browse-detail-albums-title">
              Albums for {safeMusicBrowseSelectionLabel(browseSnapshot.selection)}
            </h4>
            <p>{detailCountSummary('albums', browseSnapshot.albums.length)}</p>
          </div>
          {#if browseSnapshot.albums.length === 0}
            <p class="empty-copy">{albumDetailEmptyCopy()}</p>
          {:else}
            <ul class="result-list">
              {#each visibleDetailAlbums as album, index (musicBrowseEachKey('detail-album', album.albumid, index))}
                {@const label = safeMusicBrowseAlbumLabel(album)}
                {@const actionItem = musicBrowseActionForAlbum(album)}
                <li class="result-card">
                  <span class="item-title">{label}</span>
                  {#if formatMusicBrowseAlbumMeta(album)}
                    <span class="item-meta">{formatMusicBrowseAlbumMeta(album)}</span>
                  {/if}
                  {#if actionItem}
                    <div class="action-row" aria-label={`Actions for album ${label}`}>
                      <button
                        type="button"
                        class="action-button"
                        aria-label={`Play album ${label}`}
                        disabled={isActionDisabled(actionItem)}
                        onclick={() => handleMusicAction('play', actionItem, `album ${label}`)}
                      >
                        Play
                      </button>
                      <button
                        type="button"
                        class="action-button"
                        aria-label={`Queue album ${label}`}
                        disabled={isActionDisabled(actionItem)}
                        onclick={() => handleMusicAction('queue', actionItem, `album ${label}`)}
                      >
                        Queue
                      </button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
            {#if detailAlbumVisibility.hasMore(browseSnapshot.albums.length)}
              <button
                type="button"
                class="show-more-button"
                onclick={detailAlbumVisibility.showMore}
              >
                Show more albums
              </button>
            {/if}
          {/if}
        </section>

        <section class="result-section" aria-labelledby="music-browse-detail-songs-title">
          <div class="section-heading">
            <h4 id="music-browse-detail-songs-title">
              Songs for {safeMusicBrowseSelectionLabel(browseSnapshot.selection)}
            </h4>
            <p>{detailCountSummary('songs', browseSnapshot.songs.length)}</p>
          </div>
          {#if browseSnapshot.songs.length === 0}
            <p class="empty-copy">{songDetailEmptyCopy()}</p>
          {:else}
            <ul class="result-list">
              {#each visibleDetailSongs as song, index (musicBrowseEachKey('song', song.songid, index))}
                {@const label = safeMusicBrowseSongLabel(song)}
                {@const actionItem = musicBrowseActionForSong(song)}
                <li class="result-card" data-songid={song.songid}>
                  <span class="item-title">{label}</span>
                  <span class="identity-chip">Song ID {song.songid}</span>
                  {#if formatMusicBrowseSongMeta(song)}
                    <span class="item-meta">{formatMusicBrowseSongMeta(song)}</span>
                  {/if}
                  {#if actionItem}
                    <div class="action-row" aria-label={`Actions for song ${label}`}>
                      <button
                        type="button"
                        class="action-button"
                        aria-label={`Play song ${label}`}
                        disabled={isActionDisabled(actionItem)}
                        onclick={() => handleMusicAction('play', actionItem, `song ${label}`)}
                      >
                        Play
                      </button>
                      <button
                        type="button"
                        class="action-button"
                        aria-label={`Queue song ${label}`}
                        disabled={isActionDisabled(actionItem)}
                        onclick={() => handleMusicAction('queue', actionItem, `song ${label}`)}
                      >
                        Queue
                      </button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
            {#if detailSongVisibility.hasMore(browseSnapshot.songs.length)}
              <button
                type="button"
                class="show-more-button"
                onclick={detailSongVisibility.showMore}
              >
                Show more songs
              </button>
            {/if}
          {/if}
        </section>
      </div>
    {/if}
  </section>
</section>

<style>
  .music-browse-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .choice-section,
  .detail-section,
  .result-section,
  .detail-heading,
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
  .button-kicker,
  .breadcrumb,
  .identity-chip {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .section-kicker,
  .breadcrumb {
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

  .browse-grid,
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .choice-section,
  .detail-section,
  .result-section {
    align-content: start;
    min-width: 0;
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .detail-section {
    gap: var(--space-md);
  }

  .detail-heading {
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: var(--space-md);
  }

  .section-heading {
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .section-heading p,
  .identity-chip {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .choice-list,
  .result-list,
  .action-row {
    display: grid;
    gap: var(--space-xs);
    padding: 0;
    list-style: none;
  }

  .action-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-block-start: var(--space-xs);
  }

  .choice-button,
  .action-button,
  .clear-button,
  .show-more-button {
    min-height: 2.5rem;
    font: inherit;
    color: var(--color-text);
    cursor: pointer;
    border: 1px solid var(--color-border);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease,
      background-color 140ms ease;
  }

  .choice-button {
    display: grid;
    width: 100%;
    gap: var(--space-2xs, 0.25rem);
    padding: var(--space-sm);
    text-align: left;
    background: color-mix(in srgb, var(--color-surface) 66%, transparent);
    border-radius: var(--radius-md);
  }

  .action-button {
    min-height: 2.25rem;
    padding: var(--space-2xs, 0.25rem) var(--space-sm);
    font-size: 0.9rem;
    font-weight: 800;
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
    border-radius: var(--radius-pill);
  }

  .show-more-button {
    justify-self: start;
    min-height: 2.25rem;
    margin-top: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    font-weight: 800;
    background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-raised));
    border-radius: var(--radius-sm);
  }

  .clear-button {
    min-width: 8.5rem;
    padding: var(--space-xs) var(--space-md);
    font-weight: 800;
    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-raised));
    border-radius: var(--radius-pill);
  }

  .choice-button:hover:not(:disabled),
  .action-button:hover:not(:disabled),
  .clear-button:hover:not(:disabled),
  .show-more-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  .choice-button:active:not(:disabled),
  .action-button:active:not(:disabled),
  .clear-button:active:not(:disabled),
  .show-more-button:active:not(:disabled) {
    transform: scale(0.96);
  }

  .choice-button:disabled,
  .action-button:disabled,
  .clear-button:disabled,
  .show-more-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .choice-button:focus-visible,
  .action-button:focus-visible,
  .clear-button:focus-visible,
  .show-more-button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .button-kicker {
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 74%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .error-copy {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-danger, #c2410c) 12%, var(--color-surface-raised));
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--color-danger, #c2410c) 36%, var(--color-border));
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

  .identity-chip {
    width: max-content;
    max-width: 100%;
    padding: 0.12rem 0.45rem;
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-accent) 16%, transparent);
    border-radius: var(--radius-pill);
  }

  @media (max-width: 940px) {
    .browse-grid,
    .detail-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .detail-heading,
    .section-heading {
      grid-template-columns: 1fr;
    }

    .clear-button {
      width: 100%;
    }
  }
</style>
