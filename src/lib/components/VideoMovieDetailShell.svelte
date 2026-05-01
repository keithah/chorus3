<script module lang="ts">
  import type { MoviePlaybackItem } from '$lib/stores/playerDispatch.svelte';
  import type { MovieQueueItem } from '$lib/stores/queue.svelte';

  export interface VideoMovieActionDispatch {
    playMovieItem: (item: MoviePlaybackItem) => Promise<void> | void;
    resumeMovieItem: (item: { movieid: number }) => Promise<void> | void;
    queueMovieItem: (item: MovieQueueItem) => Promise<void> | void;
    streamMovieItem?: (item: { movieid: number }) => Promise<void> | void;
    markMovieWatched?: (item: { movieid: number; watched: boolean }) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import type {
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import type {
    VideoMovieDetailSnapshot,
    VideoMovieDetailStoreSnapshot,
    VideoMovieVersionsSnapshot
  } from '$lib/stores/videoMovieDetailStore.svelte';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
    route: VideoRoute;
    detailSnapshot?: VideoMovieDetailStoreSnapshot;
    actionDispatch?: VideoMovieActionDispatch;
  }

  type ActionKind = 'play' | 'resume' | 'queue';
  type ActionStatus =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; action: ActionKind; message: string }
    | { kind: 'success'; action: ActionKind; message: string }
    | { kind: 'error'; action: ActionKind; message: string };

  const noopActionDispatch: VideoMovieActionDispatch = {
    playMovieItem: async () => undefined,
    resumeMovieItem: async () => undefined,
    queueMovieItem: async () => undefined
  };

  let { snapshot, route, detailSnapshot, actionDispatch = noopActionDispatch }: Props = $props();
  let actionStatus = $state<ActionStatus>({ kind: 'idle', message: 'Movie actions are ready.' });
  let selectedVersionId = $state('');

  const routeMovieId = $derived(
    route.kind === 'videoMovieDetail' ? safeMovieId(route.movieid) : null
  );
  const listMovie = $derived(findMovie(snapshot.movies, routeMovieId));
  const detailMovie = $derived(findDetail(detailSnapshot, routeMovieId));
  const movie = $derived(detailMovie ?? listMovie);
  const title = $derived(movie ? safeMovieLabel(movie) : fallbackTitle(routeMovieId, route));
  const movieid = $derived(movie ? safeMovieId(movie.movieid) : null);
  const hasResumeState = $derived(movie ? hasResume(movie) : false);
  const actionDisabled = $derived(actionStatus.kind === 'pending' || movieid === null);
  const versionItems = $derived(
    detailMovie?.versions.status === 'ready' ? safeVersionItems(detailMovie.versions) : []
  );
  const selectedVersionValue = $derived(
    selectedVersionId ||
      (detailMovie?.versions.status === 'ready' && detailMovie.versions.selectedId
        ? String(detailMovie.versions.selectedId)
        : versionItems[0]?.id === undefined
          ? ''
          : String(versionItems[0].id))
  );

  function findMovie(
    movies: readonly VideoLibraryMovieSnapshot[],
    movieid: number | null
  ): VideoLibraryMovieSnapshot | null {
    if (movieid === null) {
      return null;
    }

    return movies.find((entry) => safeMovieId(entry.movieid) === movieid) ?? null;
  }

  function findDetail(
    detail: VideoMovieDetailStoreSnapshot | undefined,
    movieid: number | null
  ): VideoMovieDetailSnapshot | null {
    if (!detail || movieid === null || detail.selectedMovieId !== movieid) {
      return null;
    }

    return safeMovieId(detail.detail?.movieid) === movieid ? (detail.detail ?? null) : null;
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

  function safeMovieLabel(value: Pick<VideoLibraryMovieSnapshot, 'label' | 'title'>): string {
    return textOrNull(value.title) ?? textOrNull(value.label) ?? 'Unknown movie';
  }

  function movieMetadata(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): string {
    return [formatYear(value.year), formatDuration(value.runtime)].filter(Boolean).join(' · ');
  }

  function routeIdentity(): string | null {
    return routeMovieId === null ? null : `Movie ID ${routeMovieId}`;
  }

  function notFoundCopy(): string {
    return routeMovieId === null
      ? 'Open the movies grid and choose a movie detail link.'
      : `Movie ID ${routeMovieId} is not present in this snapshot.`;
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

  function isWatched(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): boolean {
    return value.watched === true || (numberOrNull(value.playcount) ?? 0) > 0;
  }

  function hasResume(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): boolean {
    const position = numberOrNull(value.resume?.position);
    const total = numberOrNull(value.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
  }

  function artworkText(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): string[] {
    if ('thumbnailAvailable' in value) {
      const labels: string[] = [];
      if (value.thumbnailAvailable || value.artwork.poster) {
        labels.push('Poster artwork available');
      }
      if (value.fanartAvailable || value.artwork.fanart) {
        labels.push('Fanart artwork available');
      }
      for (const [key, available] of Object.entries(value.artwork)) {
        if (available && key !== 'poster' && key !== 'fanart') {
          labels.push(`${sanitizeUiText(key)} artwork available`);
        }
      }
      return labels;
    }

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

    return hasArtwork ? ['Artwork metadata available'] : [];
  }

  function versionText(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): string {
    if ('versions' in value) {
      return versionStateText(value.versions);
    }

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

    return 'Version metadata unavailable';
  }

  function versionStateText(versions: VideoMovieVersionsSnapshot): string {
    if (versions.status === 'ready') {
      const count = safeVersionItems(versions).length;
      return count === 1 ? '1 version available' : `${count} versions available`;
    }

    if (versions.status === 'unsupported') {
      return `Movie versions unsupported. ${sanitizeUiText(versions.reason)}`;
    }

    if (versions.status === 'error') {
      return `Movie versions failed. ${sanitizeUiText(versions.message)}`;
    }

    return `Movie versions unavailable. ${sanitizeUiText(versions.reason)}`;
  }

  function safeVersionItems(versions: VideoMovieVersionsSnapshot): { id: number; label: string }[] {
    return versions.status === 'ready'
      ? versions.items.flatMap((item) => {
          const label = textOrNull(item.label);
          return label && safeMovieId(item.id) ? [{ id: item.id, label }] : [];
        })
      : [];
  }

  function detailFields(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): {
    label: string;
    value: string;
  }[] {
    if (!('plot' in value)) {
      return [];
    }

    return [
      { label: 'Tagline', value: textOrNull(value.tagline) ?? '' },
      { label: 'Plot', value: textOrNull(value.plot) ?? textOrNull(value.plotoutline) ?? '' },
      { label: 'Genres', value: safeJoin(value.genre) },
      { label: 'Directors', value: safeJoin(value.director) },
      { label: 'Studios', value: safeJoin(value.studio) },
      { label: 'Rating', value: formatRating('Rating', value.rating) },
      { label: 'User rating', value: formatRating('User rating', value.userrating) },
      { label: 'Certification', value: textOrNull(value.mpaa) ?? '' },
      { label: 'Premiered', value: textOrNull(value.premiered) ?? '' }
    ].filter((field) => field.value.length > 0);
  }

  function safeJoin(values: readonly string[] | undefined): string {
    return (values ?? [])
      .map(textOrNull)
      .filter((value): value is string => value !== null)
      .join(', ');
  }

  function formatRating(label: string, value: unknown): string {
    const rating = numberOrNull(value);
    return rating === null
      ? ''
      : `${label} ${Number.isInteger(rating) ? rating : rating.toFixed(1)}`;
  }

  async function runAction(action: ActionKind): Promise<void> {
    if (movieid === null || !movie) {
      actionStatus = {
        kind: 'error',
        action,
        message: 'Choose a valid movie before sending an action.'
      };
      return;
    }

    const label = safeMovieLabel(movie);
    const commandLabel = actionLabel(action);
    actionStatus = {
      kind: 'pending',
      action,
      message: `${commandLabel.present} ${label}…`
    };

    try {
      if (action === 'play') {
        await actionDispatch.playMovieItem({ movieid });
      } else if (action === 'resume') {
        await actionDispatch.resumeMovieItem({ movieid });
      } else {
        await actionDispatch.queueMovieItem({ movieid });
      }

      actionStatus = {
        kind: 'success',
        action,
        message: action === 'play' ? `Playing ${label} started.` : `${commandLabel.past} ${label}.`
      };
    } catch (error) {
      actionStatus = {
        kind: 'error',
        action,
        message: `Could not ${commandLabel.verb} ${label}. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  function actionLabel(action: ActionKind): { verb: string; present: string; past: string } {
    if (action === 'play') {
      return { verb: 'play', present: 'Playing', past: 'Playing' };
    }

    if (action === 'resume') {
      return { verb: 'resume', present: 'Resuming', past: 'Resumed' };
    }

    return { verb: 'queue', present: 'Queueing', past: 'Queued' };
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim() ? error.message : 'Movie action failed.';
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
    <p class="section-kicker">Movie detail</p>
    <h2 id="video-movie-detail-title">{title}</h2>
    <p class="summary-line">
      Review safe movie metadata, version availability, watched state, and playback actions.
    </p>
  </div>

  {#if movie}
    <div
      class={`action-status ${actionStatus.kind}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {actionStatus.message}
    </div>

    <div class="movie-actions" aria-label="Movie actions">
      <button
        type="button"
        aria-label={`Play movie ${title}`}
        disabled={actionDisabled}
        onclick={() => void runAction('play')}
      >
        Play
      </button>
      <button
        type="button"
        aria-label={`Resume movie ${title}`}
        disabled={actionDisabled || !hasResumeState}
        onclick={() => void runAction('resume')}
      >
        Resume
      </button>
      <button
        type="button"
        aria-label={`Queue movie ${title}`}
        disabled={actionDisabled}
        onclick={() => void runAction('queue')}
      >
        Queue
      </button>
    </div>

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
      <div>
        <dt>Resume state</dt>
        <dd>{hasResumeState ? 'Resume available' : 'No resume point available'}</dd>
      </div>
      {#if artworkText(movie).length > 0}
        <div>
          <dt>Artwork</dt>
          <dd>{artworkText(movie).join(' · ')}</dd>
        </div>
      {/if}
      <div>
        <dt>Versions</dt>
        <dd>{versionText(movie)}</dd>
      </div>
    </dl>

    {#if versionItems.length > 0}
      <div class="version-control">
        <label for="video-movie-version">Movie version</label>
        <select
          id="video-movie-version"
          bind:value={selectedVersionId}
          aria-describedby="version-help"
        >
          {#each versionItems as item (item.id)}
            <option value={String(item.id)} selected={String(item.id) === selectedVersionValue}>
              {item.label}
            </option>
          {/each}
        </select>
        <p id="version-help">
          Version playback selection is visible when Kodi exposes safe version metadata.
        </p>
      </div>
    {/if}

    {#if detailFields(movie).length > 0}
      <dl class="detail-list rich-fields">
        {#each detailFields(movie) as field}
          <div>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}
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
  .empty-state,
  .version-control {
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

  .section-kicker,
  dt,
  label {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
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
  .empty-state,
  .action-status,
  .version-control p {
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

  .back-link:focus-visible,
  button:focus-visible,
  select:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .movie-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  button,
  select {
    border: 0;
    border-radius: var(--radius-md);
    color: var(--color-text);
    font: inherit;
  }

  button {
    min-height: 2.5rem;
    padding: 0.65rem 1rem;
    background: color-mix(in srgb, var(--color-accent) 24%, var(--color-surface-raised));
    font-weight: 850;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  select {
    width: min(100%, 24rem);
    padding: 0.65rem 0.75rem;
    background: var(--color-surface-raised);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .detail-list {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-md);
  }

  .detail-list div,
  .empty-state,
  .action-status,
  .version-control {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .action-status.success {
    color: var(--color-success);
  }

  .action-status.error {
    color: var(--color-danger);
  }
</style>
