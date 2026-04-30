<script lang="ts">
  import type {
    MusicLibraryAlbumSnapshot,
    MusicLibraryArtistSnapshot,
    MusicLibraryGenreSnapshot,
    MusicLibraryLimitsSnapshot,
    MusicLibrarySongSnapshot,
    MusicLibraryStoreSnapshot
  } from '$lib/stores/musicLibrary.svelte';

  interface Props {
    snapshot: MusicLibraryStoreSnapshot;
    onRefresh?: () => Promise<void> | void;
  }

  type ListKind = 'artists' | 'albums' | 'songs' | 'genres';

  let { snapshot, onRefresh }: Props = $props();
  let isRefreshing = $state(false);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const refreshDisabled = $derived(isLoading || isRefreshing);
  const statusText = $derived(formatStatus(snapshot, isRefreshing));

  async function handleRefresh(): Promise<void> {
    if (!onRefresh || refreshDisabled) {
      return;
    }

    try {
      isRefreshing = true;
      await onRefresh();
    } finally {
      isRefreshing = false;
    }
  }

  function formatStatus(value: MusicLibraryStoreSnapshot, callbackRunning: boolean): string {
    if (callbackRunning) {
      return 'Refresh requested. Waiting for the music library snapshot.';
    }

    if (value.refreshStatus === 'loading') {
      return `Refreshing music library from ${formatReason(value.lastRefreshReason)}.`;
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.isEmpty) {
      return 'Music library is empty.';
    }

    const updated = textOrNull(value.lastUpdatedAt);
    return updated ? `Music library ready. Last updated ${updated}.` : 'Music library ready.';
  }

  function formatReason(reason: string): string {
    if (reason.startsWith('notification:')) {
      return `notification ${sanitizeUiText(reason.slice('notification:'.length))}`;
    }

    if (reason.startsWith('command:')) {
      return `command ${sanitizeUiText(reason.slice('command:'.length))}`;
    }

    if (reason.startsWith('error:')) {
      return `error ${sanitizeUiText(reason.slice('error:'.length))}`;
    }

    return sanitizeUiText(reason);
  }

  function countSummary(kind: ListKind, count: number): string {
    const limits = snapshot.limits[kind];
    return `${count} of ${formatTotal(limits, count)}`;
  }

  function formatTotal(limits: MusicLibraryLimitsSnapshot | undefined, fallback: number): number {
    return typeof limits?.total === 'number' && Number.isFinite(limits.total)
      ? limits.total
      : fallback;
  }

  function sectionEmptyCopy(kind: ListKind): string {
    switch (kind) {
      case 'artists':
        return 'No artists in this snapshot.';
      case 'albums':
        return 'No albums in this snapshot.';
      case 'songs':
        return 'No songs in this snapshot.';
      case 'genres':
        return 'No genres in this snapshot.';
    }
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
</script>

<section class="music-library-panel surface" aria-labelledby="music-library-title">
  <div class="panel-heading">
    <p class="section-kicker">Music Library</p>
    <h2 id="music-library-title">Music Library</h2>
    <p class="summary-line">Read-only snapshots from Kodi artists, albums, songs, and genres.</p>
  </div>

  <div class="toolbar">
    <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>
    {#if onRefresh}
      <button
        type="button"
        class="refresh-button"
        aria-label="Refresh music library"
        disabled={refreshDisabled}
        onclick={handleRefresh}
      >
        Refresh music library
      </button>
    {/if}
  </div>

  {#if isLoading}
    <p class="state-copy">Loading music library…</p>
  {:else if snapshot.isEmpty}
    <p class="state-copy">No music library items found in this snapshot.</p>
  {/if}

  <div class="library-grid">
    <section class="library-section" aria-labelledby="music-library-artists-title">
      <div class="section-heading">
        <h3 id="music-library-artists-title">Artists</h3>
        <p>{countSummary('artists', snapshot.artists.length)}</p>
      </div>
      {#if snapshot.artists.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('artists')}</p>
      {:else}
        <ul>
          {#each snapshot.artists as artist (artist.artistid)}
            <li>
              <span class="item-title">{safeArtistLabel(artist)}</span>
              {#if joinText(artist.genre)}
                <span class="item-meta">{joinText(artist.genre)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="library-section" aria-labelledby="music-library-albums-title">
      <div class="section-heading">
        <h3 id="music-library-albums-title">Albums</h3>
        <p>{countSummary('albums', snapshot.albums.length)}</p>
      </div>
      {#if snapshot.albums.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('albums')}</p>
      {:else}
        <ul>
          {#each snapshot.albums as album (album.albumid)}
            <li>
              <span class="item-title">{safeAlbumLabel(album)}</span>
              <span class="item-meta">
                {[joinText(album.artist), formatYear(album.year)].filter(Boolean).join(' · ')}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="library-section" aria-labelledby="music-library-songs-title">
      <div class="section-heading">
        <h3 id="music-library-songs-title">Songs</h3>
        <p>{countSummary('songs', snapshot.songs.length)}</p>
      </div>
      {#if snapshot.songs.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('songs')}</p>
      {:else}
        <ul>
          {#each snapshot.songs as song (song.songid)}
            <li>
              <span class="item-title">{safeSongLabel(song)}</span>
              <span class="item-meta">
                {[
                  joinText(song.artist),
                  textOrNull(song.album),
                  formatDuration(song.duration),
                  formatTrack(song.track),
                  formatPlaycount(song.playcount)
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="library-section" aria-labelledby="music-library-genres-title">
      <div class="section-heading">
        <h3 id="music-library-genres-title">Genres</h3>
        <p>{countSummary('genres', snapshot.genres.length)}</p>
      </div>
      {#if snapshot.genres.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('genres')}</p>
      {:else}
        <ul>
          {#each snapshot.genres as genre (genre.genreid)}
            <li>
              <span class="item-title">{safeGenreLabel(genre)}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</section>

<style>
  .music-library-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .library-section,
  .section-heading,
  li {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  h3,
  p,
  ul {
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

  h2 {
    font-size: clamp(1.4rem, 3vw, 2.1rem);
    line-height: 1.08;
    text-wrap: balance;
  }

  h3 {
    font-size: 1rem;
    line-height: 1.2;
    text-wrap: balance;
  }

  .summary-line,
  .state-copy,
  .empty-copy,
  .item-meta,
  .section-heading p {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
  }

  .status-line {
    flex: 1 1 16rem;
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 74%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .refresh-button {
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    font: inherit;
    color: var(--color-text);
    font-weight: 800;
    cursor: pointer;
    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-raised));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease;
  }

  .refresh-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  .refresh-button:active:not(:disabled) {
    transform: scale(0.96);
  }

  .refresh-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .refresh-button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .library-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .library-section {
    align-content: start;
    min-width: 0;
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .section-heading {
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .section-heading p {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  ul {
    display: grid;
    gap: var(--space-xs);
    padding: 0;
    list-style: none;
  }

  li {
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

  @media (max-width: 760px) {
    .library-grid {
      grid-template-columns: 1fr;
    }

    .section-heading {
      grid-template-columns: 1fr;
    }
  }
</style>
