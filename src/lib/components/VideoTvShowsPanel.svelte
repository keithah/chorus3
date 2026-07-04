<script lang="ts">
  import type {
    VideoLibraryStoreSnapshot,
    VideoTvShowSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { videoLibraryStore } from '$lib/stores/videoLibrary.svelte';
  import { buildVideoRoute } from '$lib/video/videoRouter';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';
  import { safeStableKey } from './listKeyHelpers';
  import { sanitizeUiText, textOrNull } from './textFormatting';

  interface Props {
    snapshot?: VideoLibraryStoreSnapshot;
  }

  type ArtworkPresentation = {
    className: 'has-fanart' | 'has-poster' | 'has-thumb' | 'no-artwork';
    badges: string[];
    initials: string;
  };

  let { snapshot: injectedSnapshot }: Props = $props();
  const snapshot = $derived(injectedSnapshot ?? videoLibraryStore.snapshot);
  const tvShowVisibility = createIncrementalVisibility(96);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const statusText = $derived(formatStatus(snapshot));
  const visibleTvShows = $derived(tvShowVisibility.visibleItems(snapshot.tvShows));

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

  function artworkPresentation(tvShow: VideoTvShowSnapshot): ArtworkPresentation {
    const keys = artworkKeys(tvShow);
    const badges: string[] = [];

    if (keys.has('poster')) {
      badges.push('Poster frame');
      badges.push('Artwork metadata available');
    }

    if (keys.has('fanart')) {
      badges.push('Fanart wash');
      if (!badges.includes('Artwork metadata available')) {
        badges.push('Artwork metadata available');
      }
    }

    if (keys.has('thumb') && badges.length === 0) {
      badges.push('Thumbnail frame');
      badges.push('Artwork metadata available');
    }

    if (keys.size === 0) {
      badges.push('Artwork pending');
    }

    return {
      className: artworkClass(keys),
      badges,
      initials: initialsFor(safeTvShowLabel(tvShow), 'T')
    };
  }

  function artworkKeys(tvShow: VideoTvShowSnapshot): Set<string> {
    const keys = new Set<string>();

    if (hasArtworkMetadata(tvShow.thumbnail)) {
      keys.add('thumb');
    }

    if (hasArtworkMetadata(tvShow.fanart)) {
      keys.add('fanart');
    }

    if (tvShow.art) {
      for (const [key, value] of Object.entries(tvShow.art)) {
        if (/^(poster|fanart|thumb|banner)$/i.test(key) && hasArtworkMetadata(value)) {
          keys.add(key.toLowerCase() === 'banner' ? 'fanart' : key.toLowerCase());
        }
      }
    }

    return keys;
  }

  function hasArtworkMetadata(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function artworkClass(keys: Set<string>): ArtworkPresentation['className'] {
    if (keys.has('fanart')) {
      return 'has-fanart';
    }

    if (keys.has('poster')) {
      return 'has-poster';
    }

    if (keys.has('thumb')) {
      return 'has-thumb';
    }

    return 'no-artwork';
  }

  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function initialsFor(value: string, fallback: string): string {
    const words = value
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return fallback;
    }

    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
      .padEnd(2, fallback)
      .slice(0, 2);
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
      {#each visibleTvShows as tvShow, index (safeStableKey('tv-show', safeTvShowId(tvShow.tvshowid), index))}
        {@const href = detailHref(tvShow)}
        {@const label = safeTvShowLabel(tvShow)}
        {@const metadata = tvShowMetadata(tvShow)}
        {@const artwork = artworkPresentation(tvShow)}
        <li class={`tv-show-card ${artwork.className}`}>
          <div class="fanart-wash" aria-hidden="true"></div>
          <div
            class={`poster-frame ${artwork.className}`}
            aria-label={`${label} artwork availability`}
          >
            <span class="fallback-initials" aria-hidden="true">{artwork.initials}</span>
            <span class="artwork-copy">{artwork.badges[0]}</span>
            {#if artwork.badges.includes('Fanart wash')}
              <span class="artwork-copy muted">Fanart wash</span>
            {/if}
          </div>

          <div class="card-copy">
            {#if href}
              <a class="tv-show-link" {href}>{label}</a>
            {:else}
              <span class="tv-show-title">{label}</span>
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
              {#each artwork.badges as badge (badge)}
                <span class="badge artwork-badge">{badge}</span>
              {/each}
            </div>
          </div>
        </li>
      {/each}
    </ul>
    {#if tvShowVisibility.hasMore(snapshot.tvShows.length)}
      <button type="button" class="show-more-button" onclick={tvShowVisibility.showMore}
        >Show more TV shows</button
      >
    {/if}
  {/if}
</section>

<style>
  .video-tv-shows-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .card-copy {
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

  .status-line {
    padding: var(--space-sm) var(--space-md);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .tv-show-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-md);
    padding: 0;
    list-style: none;
  }

  .show-more-button {
    justify-self: start;
    min-height: 2.35rem;
    padding: var(--space-xs) var(--space-sm);
    font: inherit;
    color: var(--color-text);
    font-weight: 800;
    cursor: pointer;
    background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-raised));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .tv-show-card {
    position: relative;
    display: grid;
    gap: var(--space-sm);
    align-content: start;
    min-width: 0;
    padding: var(--space-sm);
    overflow: hidden;
    background: color-mix(in srgb, var(--color-surface-raised) 66%, transparent);
    border-radius: calc(var(--radius-lg) + var(--space-sm));
    box-shadow:
      0 18px 40px color-mix(in srgb, black 10%, transparent),
      inset 0 0 0 1px color-mix(in srgb, var(--color-border) 78%, transparent);
  }

  .fanart-wash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 80% 14%,
        color-mix(in srgb, var(--color-accent) 24%, transparent),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        transparent,
        color-mix(in srgb, var(--color-surface) 64%, transparent)
      );
    opacity: 0.68;
    pointer-events: none;
  }

  .tv-show-card.no-artwork .fanart-wash {
    opacity: 0.34;
  }

  .poster-frame,
  .card-copy {
    position: relative;
    z-index: 1;
  }

  .poster-frame {
    display: grid;
    place-items: center;
    min-height: 10.5rem;
    padding: var(--space-sm);
    overflow: hidden;
    color: var(--color-text);
    text-align: center;
    aspect-ratio: 2 / 3;
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--color-accent) 22%, transparent),
      color-mix(in srgb, var(--color-surface) 92%, transparent)
    );
    border-radius: var(--radius-lg);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, white 16%, transparent),
      inset 0 0 0 2px color-mix(in srgb, var(--color-border) 70%, transparent),
      0 14px 28px color-mix(in srgb, black 14%, transparent);
  }

  .poster-frame.has-fanart {
    background:
      radial-gradient(
        circle at 72% 16%,
        color-mix(in srgb, var(--color-accent) 76%, white),
        transparent 24%
      ),
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-accent) 30%, transparent),
        var(--color-surface)
      );
  }

  .poster-frame.has-poster,
  .poster-frame.has-thumb {
    background:
      linear-gradient(
        160deg,
        color-mix(in srgb, var(--color-accent) 36%, transparent),
        transparent 48%
      ),
      color-mix(in srgb, var(--color-surface-raised) 82%, transparent);
  }

  .poster-frame.no-artwork {
    background:
      repeating-linear-gradient(
        -35deg,
        color-mix(in srgb, var(--color-border) 30%, transparent) 0 1px,
        transparent 1px 12px
      ),
      color-mix(in srgb, var(--color-surface) 84%, transparent);
  }

  .fallback-initials {
    font-family: var(--font-mono);
    font-size: clamp(1.85rem, 8vw, 3.2rem);
    font-variant-numeric: tabular-nums;
    font-weight: 900;
    letter-spacing: -0.08em;
    opacity: 0.86;
  }

  .artwork-copy {
    align-self: end;
    min-height: 1.45rem;
    padding: 0.22rem 0.58rem;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 850;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
    background: color-mix(in srgb, var(--color-surface) 70%, transparent);
    border-radius: var(--radius-pill);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 74%, transparent);
  }

  .artwork-copy.muted {
    color: var(--color-text-muted);
  }

  .card-copy {
    padding: 0 var(--space-xs) var(--space-xs);
  }

  .tv-show-link,
  .tv-show-title {
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
    overflow-wrap: anywhere;
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
    text-wrap: balance;
    transition-property: color, scale;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }

  .tv-show-link:hover {
    color: var(--color-accent);
  }

  .tv-show-link:active {
    scale: 0.96;
  }

  .tv-show-link:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
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

  .artwork-badge {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-surface) 78%, transparent);
  }
</style>
