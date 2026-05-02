<script module lang="ts">
  export interface VideoEpisodeActionDispatch {
    playEpisodeItem: (item: { episodeid: number }) => Promise<void> | void;
    resumeEpisodeItem: (item: { episodeid: number }) => Promise<void> | void;
    queueEpisodeItem: (item: { episodeid: number }) => Promise<void> | void;
    streamEpisodeItem: (item: { episodeid: number }) => Promise<void> | void;
    markEpisodeWatched?: (item: {
      episodeid: number;
      watched: boolean;
      label?: string;
    }) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import type { TranslationContext } from '$lib/i18n';
  import type {
    VideoEpisodeDetailSnapshot,
    VideoEpisodeSnapshot,
    VideoTvStoreSnapshot
  } from '$lib/stores/videoTvStore.svelte';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoTvStoreSnapshot;
    route: VideoRoute;
    actionDispatch?: VideoEpisodeActionDispatch;
    i18n?: TranslationContext;
  }

  type ActionKind = 'play' | 'resume' | 'queue' | 'stream' | 'mark-watched' | 'mark-unwatched';
  type ActionStatus =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; action: ActionKind; message: string }
    | { kind: 'success'; action: ActionKind; message: string }
    | { kind: 'error'; action: ActionKind; message: string };

  const noopActionDispatch: VideoEpisodeActionDispatch = {
    playEpisodeItem: async () => undefined,
    resumeEpisodeItem: async () => undefined,
    queueEpisodeItem: async () => undefined,
    streamEpisodeItem: async () => undefined,
    markEpisodeWatched: async () => undefined
  };

  let { snapshot, route, actionDispatch = noopActionDispatch }: Props = $props();
  let actionStatus = $state<ActionStatus>({ kind: 'idle', message: 'Episode actions are ready.' });

  const routeTvShowId = $derived(
    route.kind === 'videoEpisodeDetail' ? safePositiveId(route.tvshowid) : null
  );
  const routeSeason = $derived(
    route.kind === 'videoEpisodeDetail' ? safeSeason(route.season) : null
  );
  const routeEpisodeId = $derived(
    route.kind === 'videoEpisodeDetail' ? safePositiveId(route.episodeid) : null
  );
  const tvShow = $derived(
    snapshot.selectedTvShowId === routeTvShowId ? snapshot.tvShowDetail : null
  );
  const episode = $derived(findEpisode(snapshot, routeTvShowId, routeSeason, routeEpisodeId));
  const title = $derived(episode ? safeEpisodeLabel(episode) : fallbackTitle(route));
  const showTitle = $derived(tvShow ? safeLabel(tvShow, 'TV show') : 'TV show');
  const actionDisabled = $derived(
    actionStatus.kind === 'pending' || !episode || routeEpisodeId === null
  );
  const hasResumeState = $derived(episode ? hasResume(episode) : false);

  function findEpisode(
    value: VideoTvStoreSnapshot,
    tvshowid: number | null,
    seasonNumber: number | null,
    episodeid: number | null
  ): VideoEpisodeDetailSnapshot | VideoEpisodeSnapshot | null {
    if (
      tvshowid === null ||
      seasonNumber === null ||
      episodeid === null ||
      value.selectedTvShowId !== tvshowid ||
      value.selectedSeason !== seasonNumber ||
      value.selectedEpisodeId !== episodeid
    ) {
      return null;
    }
    const detail = value.episodeDetail;
    if (
      safePositiveId(detail?.episodeid) === episodeid &&
      detail &&
      (detail.tvshowid === undefined || detail.tvshowid === tvshowid) &&
      (detail.season === undefined || detail.season === seasonNumber)
    ) {
      return detail;
    }
    return (
      value.episodes.find(
        (item) =>
          safePositiveId(item.episodeid) === episodeid &&
          (item.tvshowid === undefined || item.tvshowid === tvshowid) &&
          (item.season === undefined || item.season === seasonNumber)
      ) ?? null
    );
  }

  async function runAction(action: ActionKind): Promise<void> {
    if (!episode || routeEpisodeId === null) {
      actionStatus = {
        kind: 'error',
        action,
        message: 'Choose a valid episode before sending an action.'
      };
      return;
    }
    const label = safeEpisodeLabel(episode);
    const commandLabel = actionLabel(action);
    actionStatus = { kind: 'pending', action, message: actionPendingMessage(action, label) };
    try {
      if (action === 'play') await actionDispatch.playEpisodeItem({ episodeid: routeEpisodeId });
      else if (action === 'resume')
        await actionDispatch.resumeEpisodeItem({ episodeid: routeEpisodeId });
      else if (action === 'queue')
        await actionDispatch.queueEpisodeItem({ episodeid: routeEpisodeId });
      else if (action === 'stream')
        await actionDispatch.streamEpisodeItem({ episodeid: routeEpisodeId });
      else
        await actionDispatch.markEpisodeWatched?.({
          episodeid: routeEpisodeId,
          watched: action === 'mark-watched',
          label
        });
      actionStatus = {
        kind: 'success',
        action,
        message:
          action === 'play'
            ? `Playing ${label} started.`
            : action === 'mark-watched' || action === 'mark-unwatched'
              ? `Marked ${label} ${action === 'mark-watched' ? 'watched' : 'unwatched'}.`
              : `${commandLabel.past} ${label}${action === 'stream' ? ' requested' : ''}.`
      };
    } catch (error) {
      actionStatus = {
        kind: 'error',
        action,
        message: `${actionErrorPrefix(action, label)}. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  function actionLabel(action: ActionKind): { verb: string; present: string; past: string } {
    if (action === 'play') return { verb: 'play', present: 'Playing', past: 'Playing' };
    if (action === 'resume') return { verb: 'resume', present: 'Resuming', past: 'Resumed' };
    if (action === 'queue') return { verb: 'queue', present: 'Queueing', past: 'Queued' };
    if (action === 'stream') return { verb: 'stream', present: 'Streaming', past: 'Streaming' };
    return { verb: 'mark', present: 'Marking', past: 'Marked' };
  }

  function actionPendingMessage(action: ActionKind, label: string): string {
    if (action === 'mark-watched' || action === 'mark-unwatched') {
      return `Marking ${label} ${action === 'mark-watched' ? 'watched' : 'unwatched'}…`;
    }

    return `${actionLabel(action).present} ${label}…`;
  }

  function actionErrorPrefix(action: ActionKind, label: string): string {
    if (action === 'mark-watched' || action === 'mark-unwatched') {
      return `Could not mark ${label} ${action === 'mark-watched' ? 'watched' : 'unwatched'}`;
    }

    return `Could not ${actionLabel(action).verb} ${label}`;
  }

  function fallbackTitle(value: VideoRoute): string {
    if (value.kind !== 'videoEpisodeDetail') return 'Episode route unavailable';
    return routeEpisodeId === null ? 'Episode route unavailable' : 'Episode not found';
  }
  function notFoundCopy(): string {
    if (route.kind !== 'videoEpisodeDetail' || routeEpisodeId === null)
      return 'Open a season and choose an episode link.';
    return `Episode ID ${routeEpisodeId} is not present in this snapshot.`;
  }
  function routeIdentity(): string | null {
    return routeEpisodeId === null ? null : `Episode ID ${routeEpisodeId}`;
  }
  function episodePosition(
    value: VideoEpisodeSnapshot | VideoEpisodeDetailSnapshot
  ): string | null {
    const season = safeSeason(value.season ?? routeSeason);
    const episodeNumber = safeSeason(value.episode);
    if (season === null && episodeNumber === null) return null;
    return [
      season === null ? null : `Season ${season}`,
      episodeNumber === null ? null : `Episode ${episodeNumber}`
    ]
      .filter(Boolean)
      .join(' · ');
  }
  function detailFields(
    value: VideoEpisodeSnapshot | VideoEpisodeDetailSnapshot
  ): { label: string; value: string }[] {
    if (!('plot' in value)) return [];
    return [
      { label: 'Plot', value: textOrNull(value.plot) ?? '' },
      { label: 'Directors', value: safeJoin(value.director) },
      { label: 'Writers', value: safeJoin(value.writer) },
      { label: 'Rating', value: formatRating('Rating', value.rating) },
      { label: 'User rating', value: formatRating('User rating', value.userrating) },
      { label: 'First aired', value: textOrNull(value.firstaired) ?? '' }
    ].filter((field) => field.value.length > 0);
  }
  function safePositiveId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  function safeSeason(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  function safeLabel(value: { label?: string; title?: string }, fallback: string): string {
    return textOrNull(value.title) ?? textOrNull(value.label) ?? fallback;
  }
  function safeEpisodeLabel(value: VideoEpisodeSnapshot | VideoEpisodeDetailSnapshot): string {
    return safeLabel(value, 'Unknown episode');
  }
  function durationText(value: unknown): string | null {
    const seconds = numberOrNull(value);
    if (seconds === null) return null;
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  function watchedText(value: VideoEpisodeSnapshot | VideoEpisodeDetailSnapshot): string {
    return isWatched(value) ? 'Watched' : 'Not watched in this snapshot';
  }
  function isWatched(value: VideoEpisodeSnapshot | VideoEpisodeDetailSnapshot): boolean {
    return value.watched === true || (numberOrNull(value.playcount) ?? 0) > 0;
  }
  function hasResume(value: VideoEpisodeSnapshot | VideoEpisodeDetailSnapshot): boolean {
    const position = numberOrNull(value.resume?.position);
    const total = numberOrNull(value.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
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
  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  function textOrNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || looksLikePathOrUrl(trimmed)) return null;
    return sanitizeUiText(trimmed);
  }
  function errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim()
      ? error.message
      : 'Episode action failed.';
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
      .replace(/localStorage|sessionStorage/gi, 'browser storage')
      .replace(/\/(mnt|media|home|users|volumes|var|tmp)\/[^\s]+/gi, '[path]');
  }
  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/|image:\/\/)/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }
</script>

<section class="video-episode-detail-shell surface" aria-labelledby="video-episode-title">
  <nav class="back-links" aria-label="Episode navigation">
    <a
      href={routeTvShowId && routeSeason !== null
        ? buildVideoRoute({
            kind: 'videoTvSeasonDetail',
            tvshowid: routeTvShowId,
            season: routeSeason
          })
        : buildVideoRoute({ kind: 'videoTvShows' })}>Back to Season {routeSeason}</a
    >
    <a
      href={routeTvShowId
        ? buildVideoRoute({ kind: 'videoTvShowDetail', tvshowid: routeTvShowId })
        : buildVideoRoute({ kind: 'videoTvShows' })}>Back to {showTitle}</a
    >
  </nav>
  <div class="panel-heading episode-hero" aria-label="Safe episode artwork summary">
    <div class="episode-frame" aria-hidden="true"><span>Episode</span></div>
    <div class="hero-copy">
      <p class="section-kicker">Episode detail</p>
      <h2 id="video-episode-title">{title}</h2>
      <p class="summary-line">
        Episode artwork surface with safe metadata and playback action seams.
      </p>
    </div>
  </div>

  {#if episode}
    <div
      class={`action-status ${actionStatus.kind}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {actionStatus.message}
    </div>
    <div class="episode-actions" aria-label="Episode actions">
      <button
        type="button"
        aria-label={`Play episode ${title}`}
        disabled={actionDisabled}
        onclick={() => void runAction('play')}>Play</button
      >
      <button
        type="button"
        aria-label={`Resume episode ${title}`}
        disabled={actionDisabled || !hasResumeState}
        onclick={() => void runAction('resume')}>Resume</button
      >
      <button
        type="button"
        aria-label={`Queue episode ${title}`}
        disabled={actionDisabled}
        onclick={() => void runAction('queue')}>Queue</button
      >
      <button
        type="button"
        aria-label={`Stream episode ${title}`}
        disabled={actionDisabled}
        onclick={() => void runAction('stream')}>Stream</button
      >
      <button
        type="button"
        aria-label={`Mark episode ${title} ${isWatched(episode) ? 'unwatched' : 'watched'}`}
        disabled={actionDisabled}
        onclick={() => void runAction(isWatched(episode) ? 'mark-unwatched' : 'mark-watched')}
        >{isWatched(episode) ? 'Mark unwatched' : 'Mark watched'}</button
      >
    </div>
    <dl class="detail-list">
      {#if routeIdentity()}<div>
          <dt>Route identity</dt>
          <dd>{routeIdentity()}</dd>
        </div>{/if}
      {#if episodePosition(episode)}<div>
          <dt>Episode order</dt>
          <dd>{episodePosition(episode)}</dd>
        </div>{/if}
      {#if durationText(episode.runtime)}<div>
          <dt>Runtime</dt>
          <dd>{durationText(episode.runtime)}</dd>
        </div>{/if}
      <div>
        <dt>Watched state</dt>
        <dd>{watchedText(episode)}</dd>
      </div>
      <div>
        <dt>Resume state</dt>
        <dd>{hasResumeState ? 'Resume available' : 'No resume point available'}</dd>
      </div>
    </dl>
    {#if detailFields(episode).length > 0}
      <dl class="detail-list rich-fields">
        {#each detailFields(episode) as field}<div>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>{/each}
      </dl>
    {/if}
  {:else}
    <div class="empty-state" role="status" aria-live="polite" aria-atomic="true">
      <p>{fallbackTitle(route)}</p>
      <p>{notFoundCopy()}</p>
    </div>
  {/if}
</section>

<style>
  .video-episode-detail-shell {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }
  .panel-heading,
  .hero-copy,
  .detail-list,
  .empty-state {
    display: grid;
    gap: var(--space-xs);
  }
  .episode-hero {
    grid-template-columns: minmax(7rem, 0.34fr) minmax(0, 1fr);
    align-items: end;
    padding: clamp(var(--space-md), 3vw, var(--space-lg));
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--color-accent) 20%, transparent),
        transparent 20rem
      ),
      color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: calc(var(--radius-lg) + var(--space-xs));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--color-border) 82%, transparent),
      0 1.2rem 3rem color-mix(in srgb, black 14%, transparent);
  }
  .episode-frame {
    aspect-ratio: 16 / 9;
    min-height: 5.5rem;
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
        color-mix(in srgb, var(--color-accent) 30%, transparent),
        transparent
      ),
      color-mix(in srgb, var(--color-surface) 88%, black);
    border-radius: var(--radius-lg);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, white 14%, transparent),
      0 1rem 2rem color-mix(in srgb, black 22%, transparent);
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
  dt {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h2 {
    overflow-wrap: anywhere;
    font-size: clamp(1.4rem, 3vw, 2.1rem);
    line-height: 1.08;
    text-wrap: balance;
  }
  .summary-line,
  dd,
  .empty-state,
  .action-status,
  .state-copy {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }
  .back-links,
  .episode-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  .back-links a {
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }
  .back-links a:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }
  button {
    min-height: 2.5rem;
    min-width: 2.5rem;
    padding: 0.65rem 1rem;
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
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  button:active:not(:disabled) {
    scale: 0.96;
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      transition-duration: 0.01ms;
    }
    button:active:not(:disabled) {
      scale: 1;
    }
  }
  .detail-list {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-md);
  }
  .detail-list div,
  .empty-state,
  .action-status {
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
