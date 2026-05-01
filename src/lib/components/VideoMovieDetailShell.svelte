<script lang="ts">
  import type {
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
    route: VideoRoute;
  }

  let { snapshot, route }: Props = $props();

  const routeMovieId = $derived(
    route.kind === 'videoMovieDetail' ? safeMovieId(route.movieid) : null
  );
  const movie = $derived(findMovie(snapshot.movies, routeMovieId));
  const title = $derived(movie ? safeMovieLabel(movie) : fallbackTitle(routeMovieId, route));

  function findMovie(
    movies: readonly VideoLibraryMovieSnapshot[],
    movieid: number | null
  ): VideoLibraryMovieSnapshot | null {
    if (movieid === null) {
      return null;
    }

    return movies.find((entry) => safeMovieId(entry.movieid) === movieid) ?? null;
  }

  function fallbackTitle(movieid: number | null, value: VideoRoute): string {
    if (value.kind !== 'videoMovieDetail') {
      return 'Movie route unavailable';
    }

    return movieid === null ? 'Movie route unavailable' : 'Movie not found';
  }

  function safeMovieId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function safeMovieLabel(value: VideoLibraryMovieSnapshot): string {
    return textOrNull(value.title) ?? textOrNull(value.label) ?? 'Unknown movie';
  }

  function movieMetadata(value: VideoLibraryMovieSnapshot): string {
    return [formatYear(value.year), formatDuration(value.runtime)].filter(Boolean).join(' · ');
  }

  function routeIdentity(): string | null {
    return routeMovieId === null ? null : `Movie ID ${routeMovieId}`;
  }

  function notFoundCopy(): string {
    return routeMovieId === null
      ? 'Open the movies grid and choose a movie detail link.'
      : `Movie ID ${routeMovieId} is not present in this read-only snapshot.`;
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

  function isWatched(value: VideoLibraryMovieSnapshot): boolean {
    return value.watched === true || (numberOrNull(value.playcount) ?? 0) > 0;
  }

  function hasResume(value: VideoLibraryMovieSnapshot): boolean {
    const position = numberOrNull(value.resume?.position);
    const total = numberOrNull(value.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
  }

  function artworkText(value: VideoLibraryMovieSnapshot): string | null {
    const art = value.art;
    const hasArtwork =
      typeof value.thumbnail === 'string' ||
      typeof value.fanart === 'string' ||
      (art !== undefined &&
        Object.entries(art).some(
          ([key, entry]) =>
            /^(poster|fanart|thumb|banner)$/i.test(key) &&
            typeof entry === 'string' &&
            entry.length > 0
        ));

    return hasArtwork ? 'Artwork metadata available' : null;
  }

  function versionText(value: VideoLibraryMovieSnapshot): string {
    const raw = value as VideoLibraryMovieSnapshot & {
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

<section class="video-movie-detail-shell surface" aria-labelledby="video-movie-detail-title">
  <a class="back-link" href={buildVideoRoute({ kind: 'videoMovies' })}>Back to movies</a>

  <div class="panel-heading">
    <p class="section-kicker">Read-only route shell</p>
    <h2 id="video-movie-detail-title">{title}</h2>
    <p class="summary-line">
      Playback, resume, queue, streaming, and watched-write actions arrive in S02.
    </p>
  </div>

  {#if movie}
    <dl class="detail-list">
      {#if routeIdentity()}
        <div>
          <dt>Route identity</dt>
          <dd>{routeIdentity()}</dd>
        </div>
      {/if}
      {#if movieMetadata(movie)}
        <div>
          <dt>Safe metadata</dt>
          <dd>{movieMetadata(movie)}</dd>
        </div>
      {/if}
      <div>
        <dt>Watched state</dt>
        <dd>{isWatched(movie) ? 'Watched' : 'Not watched in this snapshot'}</dd>
      </div>
      {#if hasResume(movie)}
        <div>
          <dt>Resume state</dt>
          <dd>Resume available</dd>
        </div>
      {/if}
      {#if artworkText(movie)}
        <div>
          <dt>Artwork</dt>
          <dd>{artworkText(movie)}</dd>
        </div>
      {/if}
      <div>
        <dt>Versions</dt>
        <dd>{versionText(movie)}</dd>
      </div>
    </dl>
  {:else}
    <div class="empty-state" role="status" aria-live="polite" aria-atomic="true">
      <p>{fallbackTitle(routeMovieId, route)}</p>
      <p>{notFoundCopy()}</p>
    </div>
  {/if}
</section>

<style>
  .video-movie-detail-shell {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .detail-list,
  .empty-state {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  p,
  dl,
  dt,
  dd {
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
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .summary-line,
  dd,
  .empty-state {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .back-link {
    justify-self: start;
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  .back-link:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .detail-list {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-md);
  }

  .detail-list div,
  .empty-state {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  dt {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
