<script module lang="ts">
  import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
  import type {
    MoviePlaybackItem,
    PlayerDispatchSnapshot
  } from '$lib/stores/playerDispatch.svelte';

  export interface VideoMovieStreamDispatch {
    streamMovieItem: (item: MoviePlaybackItem) => Promise<void> | void;
    resumeOnKodi: () => Promise<void> | void;
  }

  export interface VideoMovieStreamStatusSnapshot {
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    dispatchSnapshot?: PlayerDispatchSnapshot;
  }
</script>

<script lang="ts">
  import LocalMediaRuntime from '$lib/components/LocalMediaRuntime.svelte';
  import type {
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import type {
    VideoMovieDetailSnapshot,
    VideoMovieDetailStoreSnapshot
  } from '$lib/stores/videoMovieDetailStore.svelte';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
    route: VideoRoute;
    detailSnapshot?: VideoMovieDetailStoreSnapshot;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    dispatchSnapshot?: PlayerDispatchSnapshot;
    actionDispatch?: VideoMovieStreamDispatch;
  }

  type StreamAction = 'play' | 'resume' | 'retry' | 'sendToKodi';
  type ActionStatus =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; action: StreamAction; message: string }
    | { kind: 'success'; action: StreamAction; message: string }
    | { kind: 'error'; action: StreamAction; message: string };

  const noopActionDispatch: VideoMovieStreamDispatch = {
    streamMovieItem: async () => undefined,
    resumeOnKodi: async () => undefined
  };

  let {
    snapshot,
    route,
    detailSnapshot,
    localPlayerSnapshot,
    dispatchSnapshot,
    actionDispatch = noopActionDispatch
  }: Props = $props();

  let actionStatus = $state<ActionStatus>({
    kind: 'idle',
    message: 'Browser stream controls are ready.'
  });

  const routeMovieId = $derived(
    route.kind === 'videoMovieStream' ? safeMovieId(route.movieid) : null
  );
  const listMovie = $derived(findMovie(snapshot.movies, routeMovieId));
  const detailMovie = $derived(findDetail(detailSnapshot, routeMovieId));
  const movie = $derived(detailMovie ?? listMovie);
  const movieid = $derived(movie ? safeMovieId(movie.movieid) : null);
  const title = $derived(movie ? safeMovieLabel(movie) : fallbackTitle(routeMovieId, route));
  const hasResumeState = $derived(movie ? hasResume(movie) : false);
  const actionDisabled = $derived(
    actionStatus.kind === 'pending' ||
      dispatchSnapshot?.commandStatus === 'running' ||
      movieid === null
  );
  const backHref = $derived(
    movieid === null
      ? buildVideoRoute({ kind: 'videoMovies' })
      : buildVideoRoute({ kind: 'videoMovieDetail', movieid })
  );
  const statusCopy = $derived(
    actionStatus.kind === 'idle' ? runtimeStatusCopy() : actionStatus.message
  );
  const showSendToKodi = $derived(
    localPlayerSnapshot.resumeAvailable ||
      localPlayerSnapshot.kodiPausedForLocal ||
      localPlayerSnapshot.status === 'error'
  );

  function findMovie(
    movies: readonly VideoLibraryMovieSnapshot[],
    targetMovieId: number | null
  ): VideoLibraryMovieSnapshot | null {
    if (targetMovieId === null) {
      return null;
    }

    return movies.find((entry) => safeMovieId(entry.movieid) === targetMovieId) ?? null;
  }

  function findDetail(
    detail: VideoMovieDetailStoreSnapshot | undefined,
    targetMovieId: number | null
  ): VideoMovieDetailSnapshot | null {
    if (!detail || targetMovieId === null || detail.selectedMovieId !== targetMovieId) {
      return null;
    }

    return safeMovieId(detail.detail?.movieid) === targetMovieId ? (detail.detail ?? null) : null;
  }

  function fallbackTitle(targetMovieId: number | null, value: VideoRoute): string {
    if (value.kind !== 'videoMovieStream') {
      return 'Movie stream unavailable';
    }

    return targetMovieId === null ? 'Movie stream unavailable' : 'Movie stream unavailable';
  }

  function notFoundCopy(): string {
    if (route.kind !== 'videoMovieStream' || routeMovieId === null) {
      return 'Open the movies grid and choose a safe stream link.';
    }

    return `Movie ID ${routeMovieId} is not present in this snapshot.`;
  }

  function safeMovieId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function safeMovieLabel(value: Pick<VideoLibraryMovieSnapshot, 'label' | 'title'>): string {
    return textOrNull(value.title) ?? textOrNull(value.label) ?? 'Unknown movie';
  }

  function hasResume(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): boolean {
    const position = numberOrNull(value.resume?.position);
    const total = numberOrNull(value.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
  }

  function runtimeStatusCopy(): string {
    const dispatchError = dispatchSnapshot?.lastError?.message;
    const localError = localPlayerSnapshot.lastError?.message;

    if (dispatchSnapshot?.commandStatus === 'running') {
      return 'Preparing the browser stream…';
    }

    if (dispatchSnapshot?.commandStatus === 'error' || localPlayerSnapshot.status === 'error') {
      return [
        'Browser playback needs attention.',
        dispatchError ? sanitizeUiText(dispatchError) : '',
        localError ? sanitizeUiText(localError) : '',
        'Use Retry or Send to Kodi to recover.'
      ]
        .filter(Boolean)
        .join(' ');
    }

    if (localPlayerSnapshot.status === 'playing') {
      return 'Local browser playback is playing.';
    }

    if (localPlayerSnapshot.status === 'paused') {
      return 'Local browser playback is paused.';
    }

    if (localPlayerSnapshot.status === 'loading') {
      return 'Local browser playback is loading.';
    }

    if (localPlayerSnapshot.status === 'ended') {
      return 'Local browser playback ended. Use Retry to start again or Send to Kodi to recover.';
    }

    return 'Browser stream controls are ready.';
  }

  function resumeCopy(): string | null {
    const position =
      numberOrNull(movie?.resume?.position) ?? numberOrNull(localPlayerSnapshot.currentSeconds);
    return hasResumeState && position !== null
      ? `Resume point available at ${formatDuration(position)}.`
      : null;
  }

  async function runStreamAction(action: Exclude<StreamAction, 'sendToKodi'>): Promise<void> {
    if (movieid === null || !movie) {
      actionStatus = {
        kind: 'error',
        action,
        message: 'Choose a valid movie before starting browser playback.'
      };
      return;
    }

    const label = safeMovieLabel(movie);
    const item: MoviePlaybackItem = action === 'resume' ? { movieid, resume: true } : { movieid };

    actionStatus = {
      kind: 'pending',
      action,
      message:
        action === 'resume'
          ? `Resuming browser playback for ${label}…`
          : `Starting browser playback for ${label}…`
    };

    try {
      await actionDispatch.streamMovieItem(item);
      actionStatus = {
        kind: 'success',
        action,
        message:
          action === 'resume'
            ? `Browser playback resumed for ${label}.`
            : `Browser playback started for ${label}.`
      };
    } catch (error) {
      actionStatus = {
        kind: 'error',
        action,
        message: `Could not start browser playback for ${label}. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  async function sendToKodi(): Promise<void> {
    actionStatus = {
      kind: 'pending',
      action: 'sendToKodi',
      message: 'Sending playback back to Kodi…'
    };

    try {
      await actionDispatch.resumeOnKodi();
      actionStatus = {
        kind: 'success',
        action: 'sendToKodi',
        message: 'Sent playback back to Kodi.'
      };
    } catch (error) {
      actionStatus = {
        kind: 'error',
        action: 'sendToKodi',
        message: `Could not send playback back to Kodi. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim()
      ? error.message
      : 'Playback action failed.';
  }

  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
    }

    return `${minutes}:${pad2(remainingSeconds)}`;
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
      .replace(/file:\/\/[^\s]+/gi, '[path]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/special:\/\/[^\s]+/gi, '[path]')
      .replace(/\/vfs\/[^\s]+/gi, '[path]')
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
      /^(?:https?:\/\/|file:\/\/|smb:\/\/|special:\/\/|image:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp|vfs)\//i.test(value) ||
      /\\/.test(value)
    );
  }

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="video-movie-stream-shell fullscreen" aria-labelledby="video-movie-stream-title">
  <a class="back-link" href={backHref}>Back to details</a>

  {#if movie && movieid !== null}
    <header class="stream-heading">
      <div class="stream-artwork-frame" aria-label="Safe movie stream artwork summary">
        <div class="stream-poster-frame" aria-hidden="true"><span>Poster</span></div>
        <div class="stream-heading-copy">
          <p class="section-kicker">Browser stream</p>
          <h2 id="video-movie-stream-title">{title}</h2>
          <p class="summary-line">
            Poster-led stream surface with fullscreen browser playback, fallback recovery, and safe
            dispatch actions.
          </p>
        </div>
      </div>
    </header>

    <div
      class={`stream-status ${actionStatus.kind}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {statusCopy}
      {#if resumeCopy()}
        <span>{resumeCopy()}</span>
      {/if}
    </div>

    <div class="runtime-frame" aria-label="Browser playback surface">
      <LocalMediaRuntime variant="fullscreen" className="stream-runtime" />
    </div>

    <div class="stream-actions" aria-label="Browser stream actions">
      <button
        type="button"
        disabled={actionDisabled}
        aria-label="Play in browser"
        onclick={() => void runStreamAction('play')}
      >
        Play in browser
      </button>
      {#if hasResumeState}
        <button
          type="button"
          disabled={actionDisabled}
          aria-label="Resume in browser"
          onclick={() => void runStreamAction('resume')}
        >
          Resume in browser
        </button>
      {/if}
      <button
        type="button"
        disabled={actionDisabled}
        aria-label="Retry"
        onclick={() => void runStreamAction('retry')}
      >
        Retry
      </button>
      <button
        type="button"
        disabled={actionDisabled || !showSendToKodi}
        aria-label="Send to Kodi"
        onclick={() => void sendToKodi()}
      >
        Send to Kodi
      </button>
    </div>
  {:else}
    <div class="empty-state" role="status" aria-live="polite" aria-atomic="true">
      <p class="section-kicker">Browser stream</p>
      <h2 id="video-movie-stream-title">Movie stream unavailable</h2>
      <p>{notFoundCopy()}</p>
    </div>
  {/if}
</section>

<style>
  .video-movie-stream-shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    align-content: start;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
    color: var(--color-text);
    background:
      radial-gradient(
        circle at top left,
        color-mix(in srgb, var(--color-accent) 16%, transparent),
        transparent 24rem
      ),
      var(--color-surface);
    -webkit-font-smoothing: antialiased;
  }

  .stream-heading,
  .stream-heading-copy,
  .empty-state {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  p {
    margin: 0;
  }

  .stream-artwork-frame {
    display: grid;
    grid-template-columns: minmax(6rem, 0.22fr) minmax(0, 1fr);
    gap: var(--space-md);
    align-items: end;
    padding: clamp(var(--space-md), 3vw, var(--space-lg));
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--color-accent) 22%, transparent),
        transparent 22rem
      ),
      color-mix(in srgb, var(--color-surface-raised) 70%, transparent);
    border-radius: calc(var(--radius-lg) + var(--space-xs));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--color-border) 82%, transparent),
      0 1.2rem 3rem color-mix(in srgb, black 18%, transparent);
  }

  .stream-poster-frame {
    aspect-ratio: 2 / 3;
    min-height: 8rem;
    display: grid;
    place-items: end start;
    padding: var(--space-sm);
    color: color-mix(in srgb, var(--color-text) 82%, transparent);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background:
      linear-gradient(
        160deg,
        color-mix(in srgb, var(--color-accent) 32%, transparent),
        transparent
      ),
      color-mix(in srgb, var(--color-surface) 88%, black);
    border-radius: var(--radius-lg);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, white 14%, transparent),
      0 1rem 2rem color-mix(in srgb, black 24%, transparent);
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    max-width: 22ch;
    font-size: clamp(1.8rem, 5vw, 4rem);
    line-height: 0.98;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .summary-line,
  .stream-status,
  .empty-state {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .back-link {
    justify-self: start;
    min-height: 2.5rem;
    display: inline-flex;
    align-items: center;
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  .runtime-frame,
  .stream-status,
  .empty-state {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: calc(var(--radius-lg) + var(--space-xs));
    box-shadow:
      inset 0 0 0 1px var(--color-border),
      0 1.25rem 3.5rem color-mix(in srgb, black 18%, transparent);
  }

  .stream-status {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs) var(--space-sm);
  }

  .stream-status.success {
    color: var(--color-success);
  }

  .stream-status.error {
    color: var(--color-danger);
  }

  .stream-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  button {
    min-height: 2.5rem;
    min-width: 2.5rem;
    padding: 0.7rem 1rem;
    border: 0;
    border-radius: var(--radius-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-accent) 24%, var(--color-surface-raised));
    font: inherit;
    font-weight: 850;
    cursor: pointer;
    transition-property: scale, background-color, opacity;
    transition-duration: 160ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }

  button:active:not(:disabled) {
    scale: 0.96;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  button:focus-visible,
  .back-link:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  @media (prefers-reduced-motion: reduce) {
    button {
      transition-duration: 0.01ms;
    }

    button:active:not(:disabled) {
      scale: 1;
    }
  }
</style>
