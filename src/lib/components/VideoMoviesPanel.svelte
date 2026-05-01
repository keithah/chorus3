<script lang="ts">
  import type {
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { buildVideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
  }

  let { snapshot }: Props = $props();

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const statusText = $derived(formatStatus(snapshot));

  function formatStatus(value: VideoLibraryStoreSnapshot): string {
    if (value.refreshStatus === 'loading') {
      return `Refreshing video movies from ${formatReason(value.lastRefreshReason)}.`;
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    return movieCountSummary(value);
  }

  function movieCountSummary(value: VideoLibraryStoreSnapshot): string {
    const count = Array.isArray(value.movies) ? value.movies.length : 0;
    return `${count} of ${formatTotal(value, count)} movies`;
  }

  function formatTotal(value: VideoLibraryStoreSnapshot, fallback: number): number {
    const total = value.limits?.movies?.total;
    return typeof total === 'number' && Number.isFinite(total) ? total : fallback;
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

  function safeMovieId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function detailHref(movie: VideoLibraryMovieSnapshot): string | null {
    const movieid = safeMovieId(movie.movieid);
    return movieid === null ? null : buildVideoRoute({ kind: 'videoMovieDetail', movieid });
  }

  function safeMovieLabel(movie: VideoLibraryMovieSnapshot): string {
    return textOrNull(movie.title) ?? textOrNull(movie.label) ?? 'Unknown movie';
  }

  function movieMetadata(movie: VideoLibraryMovieSnapshot): string {
    return [formatYear(movie.year), formatDuration(movie.runtime)].filter(Boolean).join(' · ');
  }

  function formatYear(value: unknown): string | null {
    const year = numberOrNull(value);
    return year === null ? null : String(Math.trunc(year));
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

  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function isWatched(movie: VideoLibraryMovieSnapshot): boolean {
    return movie.watched === true || (numberOrNull(movie.playcount) ?? 0) > 0;
  }

  function hasResume(movie: VideoLibraryMovieSnapshot): boolean {
    const position = numberOrNull(movie.resume?.position);
    const total = numberOrNull(movie.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
  }

  function artworkText(movie: VideoLibraryMovieSnapshot): string | null {
    const art = movie.art;
    const hasArtwork =
      typeof movie.thumbnail === 'string' ||
      typeof movie.fanart === 'string' ||
      (art !== undefined &&
        Object.entries(art).some(
          ([key, value]) =>
            /^(poster|fanart|thumb|banner)$/i.test(key) &&
            typeof value === 'string' &&
            value.length > 0
        ));

    return hasArtwork ? 'Artwork metadata available' : null;
  }

  function versionText(movie: VideoLibraryMovieSnapshot): string {
    const raw = movie as VideoLibraryMovieSnapshot & {
      versionCount?: unknown;
      versions?: unknown;
      hasVersions?: unknown;
    };
    const versionCount = numberOrNull(raw.versionCount);

    if (versionCount !== null && versionCount > 0) {
      const count = Math.trunc(versionCount);
      return count === 1 ? '1 version available' : `${count} versions available`;
    }

    if (Array.isArray(raw.versions) && raw.versions.length > 0) {
      return raw.versions.length === 1
        ? '1 version available'
        : `${raw.versions.length} versions available`;
    }

    if (raw.hasVersions === true) {
      return 'Version metadata available';
    }

    return 'Version metadata not loaded yet';
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

  function sanitizeUiText(value: string): string {
    return value
      .replace(/raw response body/gi, 'response body [redacted]')
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[url]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/image:\/\/[^\s]+/gi, '[artwork]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/sentinel_secret/gi, '[redacted-secret]')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/username or password/gi, 'credentials')
      .replace(/localStorage|sessionStorage/gi, 'browser storage');
  }

  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/|image:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="video-movies-panel surface" aria-labelledby="video-movies-title">
  <div class="panel-heading">
    <p class="section-kicker">Video Library</p>
    <h2 id="video-movies-title">Video Movies</h2>
    <p class="summary-line">Read-only movie snapshots from Kodi-shaped data.</p>
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>

  {#if isLoading}
    <p class="state-copy">Loading video movies…</p>
  {:else if snapshot.isEmpty || snapshot.movies.length === 0}
    <p class="state-copy">No video movies found in this snapshot.</p>
  {/if}

  <p class="count-summary">{movieCountSummary(snapshot)}</p>

  {#if snapshot.movies.length > 0}
    <ul class="movie-grid" aria-label="Video movies">
      {#each snapshot.movies as movie, index (safeMovieId(movie.movieid) ?? index)}
        {@const href = detailHref(movie)}
        {@const metadata = movieMetadata(movie)}
        <li class="movie-card">
          {#if href}
            <a class="movie-link" {href}>{safeMovieLabel(movie)}</a>
          {:else}
            <span class="movie-title">{safeMovieLabel(movie)}</span>
          {/if}

          {#if metadata}
            <p class="movie-meta">{metadata}</p>
          {/if}

          <div class="badge-list" aria-label="Movie metadata">
            {#if isWatched(movie)}
              <span class="badge">Watched</span>
            {/if}
            {#if hasResume(movie)}
              <span class="badge">Resume available</span>
            {/if}
            {#if artworkText(movie)}
              <span class="badge">{artworkText(movie)}</span>
            {/if}
            <span class="badge subtle">{versionText(movie)}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .video-movies-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .movie-card {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
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

  .summary-line,
  .state-copy,
  .movie-meta,
  .count-summary {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 74%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .movie-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: var(--space-md);
    padding: 0;
    list-style: none;
  }

  .movie-card {
    align-content: start;
    min-width: 0;
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .movie-link,
  .movie-title {
    overflow-wrap: anywhere;
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  .movie-link:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .badge {
    padding: 0.18rem 0.55rem;
    color: var(--color-text);
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.4;
    background: color-mix(in srgb, var(--color-accent) 16%, var(--color-surface));
    border-radius: var(--radius-pill);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 82%, transparent);
  }

  .badge.subtle {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-surface) 78%, transparent);
  }
</style>
