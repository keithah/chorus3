<script lang="ts" module>
  import type {
    MusicBrowseAlbumPick,
    MusicBrowseArtistPick,
    MusicBrowseGenrePick
  } from '$lib/stores/musicBrowse.svelte';

  export type MusicBrowseActionItem =
    | { kind: 'song'; songid: number }
    | { kind: 'album'; albumid: number }
    | { kind: 'artist'; artistid: number };

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
  import type {
    MusicBrowseSelection,
    MusicBrowseStoreSnapshot
  } from '$lib/stores/musicBrowse.svelte';
  import type {
    MusicLibraryAlbumSnapshot,
    MusicLibraryArtistSnapshot,
    MusicLibraryGenreSnapshot,
    MusicLibraryLimitsSnapshot,
    MusicLibrarySongSnapshot,
    MusicLibraryStoreSnapshot
  } from '$lib/stores/musicLibrary.svelte';

  interface Props {
    librarySnapshot: MusicLibraryStoreSnapshot;
    browseSnapshot: MusicBrowseStoreSnapshot;
    dispatch: MusicBrowsePanelDispatch;
    i18n?: TranslationContext;
    actionDispatch: MusicBrowseActionDispatch;
  }

  type TopLevelKind = 'artists' | 'albums' | 'genres';
  type DetailKind = 'albums' | 'songs';
  type MusicActionVerb = 'play' | 'queue';

  type PendingMusicAction = {
    id: string;
    verb: MusicActionVerb;
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

  const isLoading = $derived(browseSnapshot.refreshStatus === 'loading');
  const hasSelection = $derived(Boolean(browseSnapshot.selection));
  const statusText = $derived(actionStatusText ?? formatStatus(browseSnapshot));
  const selectionTitle = $derived(formatSelectionTitle(browseSnapshot.selection));
  const detailTarget = $derived(formatSelectionTarget(browseSnapshot.selection));

  function handleBrowseArtist(artist: MusicLibraryArtistSnapshot): void {
    if (isLoading) {
      return;
    }

    dispatch.browseArtist({ artistid: artist.artistid, label: safeArtistLabel(artist) });
  }

  function handleBrowseAlbum(album: MusicLibraryAlbumSnapshot): void {
    if (isLoading) {
      return;
    }

    dispatch.browseAlbum({ albumid: album.albumid, label: safeAlbumLabel(album) });
  }

  function handleBrowseGenre(genre: MusicLibraryGenreSnapshot): void {
    if (isLoading) {
      return;
    }

    dispatch.browseGenre({ genreid: genre.genreid, label: safeGenreLabel(genre) });
  }

  function handleClearSelection(): void {
    if (isLoading) {
      return;
    }

    dispatch.clearSelection();
  }

  async function handleMusicAction(
    verb: MusicActionVerb,
    item: MusicBrowseActionItem,
    label: string
  ): Promise<void> {
    if (isLoading || pendingAction) {
      return;
    }

    const action = { id: actionId(verb, item), verb, item, label };
    pendingAction = action;
    actionErrorText = null;
    actionStatusText = `${capitalize(verb === 'play' ? 'playing' : 'queueing')} ${label}…`;

    try {
      if (verb === 'play') {
        await actionDispatch.playMusicItem(item);
      } else {
        await actionDispatch.queueMusicItem(item);
      }
      actionStatusText = `${verb === 'play' ? 'Played' : 'Queued'} ${label}.`;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : 'Music action failed.'
      );
      actionErrorText = `Could not ${verb} ${label}. ${message}`;
      actionStatusText = `Could not ${verb} ${label}. ${message}`;
    } finally {
      pendingAction = null;
    }
  }

  function actionId(verb: MusicActionVerb, item: MusicBrowseActionItem): string {
    if (item.kind === 'song') {
      return `${verb}:song:${item.songid}`;
    }

    if (item.kind === 'album') {
      return `${verb}:album:${item.albumid}`;
    }

    return `${verb}:artist:${item.artistid}`;
  }

  function isActionDisabled(item: MusicBrowseActionItem): boolean {
    if (isLoading) {
      return true;
    }

    if (!pendingAction) {
      return false;
    }

    return actionTargetKey(pendingAction.item) === actionTargetKey(item);
  }

  function actionTargetKey(item: MusicBrowseActionItem): string {
    if (item.kind === 'song') {
      return `song:${item.songid}`;
    }

    if (item.kind === 'album') {
      return `album:${item.albumid}`;
    }

    return `artist:${item.artistid}`;
  }

  function musicActionForArtist(artist: MusicLibraryArtistSnapshot): MusicBrowseActionItem | null {
    return isPositiveInteger(artist.artistid)
      ? { kind: 'artist', artistid: artist.artistid }
      : null;
  }

  function musicActionForAlbum(album: MusicLibraryAlbumSnapshot): MusicBrowseActionItem | null {
    return isPositiveInteger(album.albumid) ? { kind: 'album', albumid: album.albumid } : null;
  }

  function musicActionForSong(song: MusicLibrarySongSnapshot): MusicBrowseActionItem | null {
    return isPositiveInteger(song.songid) ? { kind: 'song', songid: song.songid } : null;
  }

  function safeEachKey(prefix: string, id: unknown, index: number): string {
    return isPositiveInteger(id) ? `${prefix}:${id}` : `${prefix}:invalid:${index}`;
  }

  function formatStatus(snapshot: MusicBrowseStoreSnapshot): string {
    const selection = formatSelectionTarget(snapshot.selection);

    if (!snapshot.selection) {
      return 'Choose an artist, album, or genre to browse.';
    }

    if (snapshot.refreshStatus === 'loading') {
      return `Loading ${selection}.`;
    }

    if (snapshot.refreshStatus === 'error' && snapshot.lastError) {
      return sanitizeUiText(snapshot.lastError.message);
    }

    if (snapshot.isEmpty) {
      return `No albums or songs found for ${safeSelectionLabel(snapshot.selection)}.`;
    }

    const updated = textOrNull(snapshot.lastUpdatedAt);
    return updated ? `Showing ${selection}. Last updated ${updated}.` : `Showing ${selection}.`;
  }

  function formatSelectionTitle(selection: MusicBrowseSelection): string {
    if (!selection) {
      return 'No browse selection';
    }

    return `${capitalize(selection.kind)}: ${safeSelectionLabel(selection)}`;
  }

  function formatSelectionTarget(selection: MusicBrowseSelection): string {
    if (!selection) {
      return 'music browse details';
    }

    return `${selection.kind} ${safeSelectionLabel(selection)}`;
  }

  function countSummary(kind: TopLevelKind, count: number): string {
    const limits = librarySnapshot.limits[kind];
    return `${count} of ${formatTotal(limits, count)}`;
  }

  function detailCountSummary(kind: DetailKind, count: number): string {
    const limits = browseSnapshot.limits[kind];
    return `${capitalize(kind)} ${count} of ${formatTotal(limits, count)}`;
  }

  function formatTotal(limits: MusicLibraryLimitsSnapshot | undefined, fallback: number): number {
    return typeof limits?.total === 'number' && Number.isFinite(limits.total)
      ? limits.total
      : fallback;
  }

  function topLevelEmptyCopy(kind: TopLevelKind): string {
    switch (kind) {
      case 'artists':
        return 'No artists in this snapshot.';
      case 'albums':
        return 'No albums in this snapshot.';
      case 'genres':
        return 'No genres in this snapshot.';
    }
  }

  function albumDetailEmptyCopy(): string {
    if (browseSnapshot.selection?.kind === 'album') {
      return 'Album selections show songs only.';
    }

    return `No albums found for ${detailTarget}.`;
  }

  function songDetailEmptyCopy(): string {
    return `No songs found for ${detailTarget}.`;
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
    return track === null ? null : `Track ${Math.trunc(track)}`;
  }

  function formatPlaycount(value: unknown): string | null {
    const playcount = numberOrNull(value);
    if (playcount === null) {
      return null;
    }

    const rounded = Math.max(0, Math.trunc(playcount));
    return rounded === 1 ? 'Played 1 time' : `Played ${rounded} times`;
  }

  function safeArtistLabel(artist: MusicLibraryArtistSnapshot): string {
    return displayText(artist.label, 'Unknown artist');
  }

  function safeAlbumLabel(album: MusicLibraryAlbumSnapshot): string {
    return displayText(album.title ?? album.label, 'Unknown album');
  }

  function safeSongLabel(song: MusicLibrarySongSnapshot): string {
    return displayText(song.title ?? song.label, 'Unknown song');
  }

  function safeGenreLabel(genre: MusicLibraryGenreSnapshot): string {
    return displayText(genre.title ?? genre.label, 'Unknown genre');
  }

  function safeSelectionLabel(selection: NonNullable<MusicBrowseSelection>): string {
    switch (selection.kind) {
      case 'artist':
        return displayText(selection.label, 'Unknown artist');
      case 'album':
        return displayText(selection.label, 'Unknown album');
      case 'genre':
        return displayText(selection.label, 'Unknown genre');
    }
  }

  function songMeta(song: MusicLibrarySongSnapshot): string {
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

  function albumMeta(album: MusicLibraryAlbumSnapshot): string {
    return [joinText(album.artist), formatYear(album.year)].filter(Boolean).join(' · ');
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
      .replace(/localStorage/gi, 'browser storage');
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

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
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
        <p class="empty-copy">{topLevelEmptyCopy('artists')}</p>
      {:else}
        <ul class="choice-list">
          {#each librarySnapshot.artists as artist, index (safeEachKey('artist', artist.artistid, index))}
            {@const label = safeArtistLabel(artist)}
            {@const actionItem = musicActionForArtist(artist)}
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
                {#if joinText(artist.genre)}
                  <span class="item-meta">{joinText(artist.genre)}</span>
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
      {/if}
    </section>

    <section class="choice-section" aria-labelledby="music-browse-albums-title">
      <div class="section-heading">
        <h3 id="music-browse-albums-title">Albums</h3>
        <p>{countSummary('albums', librarySnapshot.albums.length)}</p>
      </div>
      {#if librarySnapshot.albums.length === 0}
        <p class="empty-copy">{topLevelEmptyCopy('albums')}</p>
      {:else}
        <ul class="choice-list">
          {#each librarySnapshot.albums as album, index (safeEachKey('album', album.albumid, index))}
            {@const label = safeAlbumLabel(album)}
            {@const actionItem = musicActionForAlbum(album)}
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
                {#if albumMeta(album)}
                  <span class="item-meta">{albumMeta(album)}</span>
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
      {/if}
    </section>

    <section class="choice-section" aria-labelledby="music-browse-genres-title">
      <div class="section-heading">
        <h3 id="music-browse-genres-title">Genres</h3>
        <p>{countSummary('genres', librarySnapshot.genres.length)}</p>
      </div>
      {#if librarySnapshot.genres.length === 0}
        <p class="empty-copy">{topLevelEmptyCopy('genres')}</p>
      {:else}
        <ul class="choice-list">
          {#each librarySnapshot.genres as genre, index (safeEachKey('genre', genre.genreid, index))}
            {@const label = safeGenreLabel(genre)}
            <li>
              <button
                type="button"
                class="choice-button"
                aria-label={`Browse genre ${label}`}
                disabled={isLoading}
                onclick={() => handleBrowseGenre(genre)}
              >
                <span class="button-kicker">Browse genre</span>
                <span class="item-title">{label}</span>
              </button>
            </li>
          {/each}
        </ul>
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
        <p class="error-copy">{sanitizeUiText(browseSnapshot.lastError.message)}</p>
      {/if}

      {#if browseSnapshot.isEmpty && !isLoading}
        <p class="state-copy">
          No albums or songs found for {safeSelectionLabel(browseSnapshot.selection)}.
        </p>
      {/if}

      <div class="detail-grid">
        <section class="result-section" aria-labelledby="music-browse-detail-albums-title">
          <div class="section-heading">
            <h4 id="music-browse-detail-albums-title">
              Albums for {safeSelectionLabel(browseSnapshot.selection)}
            </h4>
            <p>{detailCountSummary('albums', browseSnapshot.albums.length)}</p>
          </div>
          {#if browseSnapshot.albums.length === 0}
            <p class="empty-copy">{albumDetailEmptyCopy()}</p>
          {:else}
            <ul class="result-list">
              {#each browseSnapshot.albums as album, index (safeEachKey('detail-album', album.albumid, index))}
                {@const label = safeAlbumLabel(album)}
                {@const actionItem = musicActionForAlbum(album)}
                <li class="result-card">
                  <span class="item-title">{label}</span>
                  {#if albumMeta(album)}
                    <span class="item-meta">{albumMeta(album)}</span>
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
          {/if}
        </section>

        <section class="result-section" aria-labelledby="music-browse-detail-songs-title">
          <div class="section-heading">
            <h4 id="music-browse-detail-songs-title">
              Songs for {safeSelectionLabel(browseSnapshot.selection)}
            </h4>
            <p>{detailCountSummary('songs', browseSnapshot.songs.length)}</p>
          </div>
          {#if browseSnapshot.songs.length === 0}
            <p class="empty-copy">{songDetailEmptyCopy()}</p>
          {:else}
            <ul class="result-list">
              {#each browseSnapshot.songs as song, index (safeEachKey('song', song.songid, index))}
                {@const label = safeSongLabel(song)}
                {@const actionItem = musicActionForSong(song)}
                <li class="result-card" data-songid={song.songid}>
                  <span class="item-title">{label}</span>
                  <span class="identity-chip">Song ID {song.songid}</span>
                  {#if songMeta(song)}
                    <span class="item-meta">{songMeta(song)}</span>
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
  .clear-button {
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

  .clear-button {
    min-width: 8.5rem;
    padding: var(--space-xs) var(--space-md);
    font-weight: 800;
    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-raised));
    border-radius: var(--radius-pill);
  }

  .choice-button:hover:not(:disabled),
  .action-button:hover:not(:disabled),
  .clear-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  .choice-button:active:not(:disabled),
  .action-button:active:not(:disabled),
  .clear-button:active:not(:disabled) {
    transform: scale(0.96);
  }

  .choice-button:disabled,
  .action-button:disabled,
  .clear-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .choice-button:focus-visible,
  .action-button:focus-visible,
  .clear-button:focus-visible {
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
