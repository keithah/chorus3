<script lang="ts">
  import type {
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import { buildVideoRoute } from '$lib/video/videoRouter';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
  }

  type ArtworkPresentation = {
    className: 'has-fanart' | 'has-poster' | 'has-thumb' | 'no-artwork';
    badges: string[];
    initials: string;
    imageUrl?: string;
    fanartUrl?: string;
  };

  let { snapshot }: Props = $props();
  const movieVisibility = createIncrementalVisibility(240);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const statusText = $derived(formatStatus(snapshot));
  const visibleMovies = $derived(movieVisibility.visibleItems(snapshot.movies));

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

  function artworkPresentation(movie: VideoLibraryMovieSnapshot): ArtworkPresentation {
    const keys = artworkKeys(movie);
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
      initials: initialsFor(safeMovieLabel(movie), 'M'),
      ...optionalArtworkUrl('imageUrl', movie.art?.poster ?? movie.art?.thumb ?? movie.thumbnail),
      ...optionalArtworkUrl('fanartUrl', movie.art?.fanart ?? movie.fanart)
    };
  }

  function optionalArtworkUrl<Key extends string>(
    key: Key,
    value: unknown
  ): Partial<Record<Key, string>> {
    const url = optionalKodiImageUrl(value);
    return url ? ({ [key]: url } as Partial<Record<Key, string>>) : {};
  }

  function artworkKeys(movie: VideoLibraryMovieSnapshot): Set<string> {
    const keys = new Set<string>();

    if (hasArtworkMetadata(movie.thumbnail)) {
      keys.add('thumb');
    }

    if (hasArtworkMetadata(movie.fanart)) {
      keys.add('fanart');
    }

    if (movie.art) {
      for (const [key, value] of Object.entries(movie.art)) {
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
      {#each visibleMovies as movie, index (safeMovieId(movie.movieid) ?? index)}
        {@const href = detailHref(movie)}
        {@const label = safeMovieLabel(movie)}
        {@const metadata = movieMetadata(movie)}
        {@const artwork = artworkPresentation(movie)}
        <li class={`movie-card ${artwork.className}`}>
          <div
            class="fanart-wash"
            aria-hidden="true"
            style={artwork.fanartUrl
              ? `--movie-card-fanart-url: url('${artwork.fanartUrl}')`
              : undefined}
          ></div>
          <div
            class={`poster-frame ${artwork.className}`}
            class:has-image={Boolean(artwork.imageUrl)}
            aria-label={`${label} artwork availability`}
          >
            {#if artwork.imageUrl}
              <img src={artwork.imageUrl} alt="" loading="lazy" decoding="async" />
            {:else}
              <span class="fallback-initials" aria-hidden="true">{artwork.initials}</span>
              <span class="artwork-copy">{artwork.badges[0]}</span>
              {#if artwork.badges.includes('Fanart wash')}
                <span class="artwork-copy muted">Fanart wash</span>
              {/if}
            {/if}
          </div>

          <div class="card-copy">
            {#if href}
              <a class="movie-link" {href}>{label}</a>
            {:else}
              <span class="movie-title">{label}</span>
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
              {#each artwork.badges as badge (badge)}
                <span class="badge artwork-badge">{badge}</span>
              {/each}
              <span class="badge subtle">{versionText(movie)}</span>
            </div>
          </div>
        </li>
      {/each}
    </ul>
    {#if movieVisibility.hasMore(snapshot.movies.length)}
      <button type="button" class="show-more-button" onclick={movieVisibility.showMore}
        >Show more movies</button
      >
    {/if}
  {/if}
</section>

<style>
  .video-movies-panel {
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

  .movie-card {
    position: relative;
    display: grid;
    gap: var(--space-sm);
    align-content: start;
    min-width: 0;
    padding: var(--space-sm);
    overflow: hidden;
    background: color-mix(in srgb, var(--color-surface-raised) 68%, transparent);
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
        circle at 20% 10%,
        color-mix(in srgb, var(--color-accent) 24%, transparent),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        transparent,
        color-mix(in srgb, var(--color-surface) 62%, transparent)
      );
    opacity: 0.68;
    pointer-events: none;
  }

  .movie-card.has-fanart .fanart-wash {
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-surface) 74%, transparent),
        color-mix(in srgb, var(--color-surface) 44%, transparent)
      ),
      var(--movie-card-fanart-url) center / cover;
  }

  .movie-card.no-artwork .fanart-wash {
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
        circle at 28% 18%,
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

  .poster-frame.has-image {
    padding: 0;
    background: color-mix(in srgb, var(--color-surface-raised) 82%, transparent);
  }

  .poster-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

  .movie-link,
  .movie-title {
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

  .movie-link:hover {
    color: var(--color-accent);
  }

  .movie-link:active {
    scale: 0.96;
  }

  .movie-link:focus-visible {
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

  .badge.subtle,
  .artwork-badge {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-surface) 78%, transparent);
  }
</style>
