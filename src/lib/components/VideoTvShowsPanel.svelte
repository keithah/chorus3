<script lang="ts">
  import type {
    VideoLibraryStoreSnapshot,
    VideoTvShowSnapshot
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
      return `Refreshing TV shows from ${formatReason(value.lastRefreshReason)}.`;
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    return tvShowCountSummary(value);
  }

  function tvShowCountSummary(value: VideoLibraryStoreSnapshot): string {
    const count = Array.isArray(value.tvShows) ? value.tvShows.length : 0;
    return `${count} of ${formatTotal(value, count)} TV shows`;
  }

  function formatTotal(value: VideoLibraryStoreSnapshot, fallback: number): number {
    const total = value.limits?.tvShows?.total;
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

  function safeTvShowId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function detailHref(tvShow: VideoTvShowSnapshot): string | null {
    const tvshowid = safeTvShowId(tvShow.tvshowid);
    return tvshowid === null ? null : buildVideoRoute({ kind: 'videoTvShowDetail', tvshowid });
  }

  function safeTvShowLabel(tvShow: Pick<VideoTvShowSnapshot, 'label' | 'title'>): string {
    return textOrNull(tvShow.title) ?? textOrNull(tvShow.label) ?? 'Unknown TV show';
  }

  function tvShowMetadata(tvShow: VideoTvShowSnapshot): string {
    const values = [formatYear(tvShow.year), episodeCountText(tvShow.episodeCount)];
    return values.filter(Boolean).join(' · ');
  }

  function formatYear(value: unknown): string | null {
    const year = numberOrNull(value);
    return year === null ? null : String(Math.trunc(year));
  }

  function episodeCountText(value: unknown): string | null {
    const count = numberOrNull(value);
    if (count === null) {
      return null;
    }
    const rounded = Math.trunc(Math.max(0, count));
    return rounded === 1 ? '1 episode' : `${rounded} episodes`;
  }

  function unwatchedText(tvShow: VideoTvShowSnapshot): string {
    const count = numberOrNull(tvShow.unwatchedEpisodes) ?? 0;
    const rounded = Math.trunc(Math.max(0, count));
    return rounded === 1 ? '1 unwatched episode' : `${rounded} unwatched episodes`;
  }

  function isWatched(tvShow: VideoTvShowSnapshot): boolean {
    return tvShow.watched === true || (numberOrNull(tvShow.playcount) ?? 0) > 0;
  }

  function hasResume(tvShow: VideoTvShowSnapshot): boolean {
    return (numberOrNull(tvShow.unwatchedEpisodes) ?? 0) > 0 || tvShow.hasUnwatched === true;
  }

  function artworkText(tvShow: VideoTvShowSnapshot): string | null {
    const art = tvShow.art;
    const hasArtwork =
      hasArtworkMetadata(tvShow.thumbnail) ||
      hasArtworkMetadata(tvShow.fanart) ||
      (art !== undefined &&
        Object.entries(art).some(
          ([key, value]) => /^(poster|fanart|thumb|banner)$/i.test(key) && hasArtworkMetadata(value)
        ));

    return hasArtwork ? 'Artwork metadata available' : null;
  }

  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

  function hasArtworkMetadata(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0 && !containsForbiddenText(value);
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
      .replace(/localStorage|sessionStorage/gi, 'browser storage')
      .replace(/\/(mnt|media|home|users|volumes|var|tmp)\/[^\s]+/gi, '[path]');
  }

  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/|image:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }

  function containsForbiddenText(value: string): boolean {
    return /https?:\/\/|smb:\/\/|authorization|basic|sentinel_secret|localStorage|sessionStorage|p@ssword|password|\/mnt\//i.test(
      value
    );
  }
</script>

<section class="video-tv-shows-panel surface" aria-labelledby="video-tv-shows-title">
  <div class="panel-heading">
    <p class="section-kicker">Video Library</p>
    <h2 id="video-tv-shows-title">TV Shows</h2>
    <p class="summary-line">Browse safe TV show snapshots from Kodi-shaped data.</p>
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>

  {#if isLoading}
    <p class="state-copy">Loading TV shows…</p>
  {:else if snapshot.tvShows.length === 0}
    <p class="state-copy">No TV shows found in this snapshot.</p>
  {/if}

  <p class="count-summary">{tvShowCountSummary(snapshot)}</p>

  {#if snapshot.tvShows.length > 0}
    <ul class="tv-show-grid" aria-label="TV shows">
      {#each snapshot.tvShows as tvShow, index (safeTvShowId(tvShow.tvshowid) ?? index)}
        {@const href = detailHref(tvShow)}
        {@const metadata = tvShowMetadata(tvShow)}
        <li class="tv-show-card">
          {#if href}
            <a class="tv-show-link" {href}>{safeTvShowLabel(tvShow)}</a>
          {:else}
            <span class="tv-show-title">{safeTvShowLabel(tvShow)}</span>
          {/if}

          {#if metadata}
            <p class="tv-show-meta">{metadata}</p>
          {/if}

          <div class="badge-list" aria-label="TV show metadata">
            <span class="badge">{unwatchedText(tvShow)}</span>
            {#if isWatched(tvShow)}
              <span class="badge">Watched</span>
            {/if}
            {#if hasResume(tvShow)}
              <span class="badge">Resume available</span>
            {/if}
            {#if artworkText(tvShow)}
              <span class="badge">{artworkText(tvShow)}</span>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .video-tv-shows-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .tv-show-card {
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
  .tv-show-meta,
  .count-summary {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .status-line,
  .tv-show-card {
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    line-height: 1.5;
  }

  .tv-show-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: var(--space-md);
    padding: 0;
    list-style: none;
  }

  .tv-show-card {
    align-content: start;
    min-width: 0;
    padding: var(--space-md);
  }

  .tv-show-link,
  .tv-show-title {
    overflow-wrap: anywhere;
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  .tv-show-link:focus-visible {
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
    font-variant-numeric: tabular-nums;
    font-weight: 800;
    line-height: 1.4;
    background: color-mix(in srgb, var(--color-accent) 16%, var(--color-surface));
    border-radius: var(--radius-pill);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 82%, transparent);
  }
</style>
