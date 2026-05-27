<script module lang="ts">
  import type {
    VideoWriteFailedItemSnapshot,
    VideoWriteSafeErrorSnapshot
  } from '$lib/stores/videoWriteStore.svelte';

  export interface VideoSeasonArtworkDispatch {
    refreshSeasonArtwork: (item: { tvshowid: number; season: number }) => Promise<void> | void;
  }

  export interface VideoSeasonWriteItem {
    episodeid: number;
    label: string;
  }

  export interface VideoSeasonWriteSummary {
    total: number;
    succeeded: number;
    failed: number;
    failedItems?: readonly VideoWriteFailedItemSnapshot[];
    lastError?: VideoWriteSafeErrorSnapshot | null;
  }

  export interface VideoSeasonWriteDispatch {
    markEpisodesWatched: (
      items: readonly VideoSeasonWriteItem[],
      watched: boolean
    ) => Promise<VideoSeasonWriteSummary> | VideoSeasonWriteSummary;
    retryFailedVideoWrites: (
      items: readonly VideoSeasonWriteItem[]
    ) => Promise<VideoSeasonWriteSummary> | VideoSeasonWriteSummary;
  }
</script>

<script lang="ts">
  import { buildKodiPackageSafeVideoAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    VideoEpisodeSnapshot,
    VideoSeasonArtworkRefreshCapabilitySnapshot,
    VideoSeasonSnapshot,
    VideoTvStoreSnapshot
  } from '$lib/stores/videoTvStore.svelte';
  import {
    defaultEpisodeCollectionActionDispatch,
    type EpisodeCollectionActionDispatch
  } from '$lib/stores/episodeCollectionActions';
  import type { VideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoTvStoreSnapshot;
    route: VideoRoute;
    artworkDispatch?: VideoSeasonArtworkDispatch;
    writeDispatch?: VideoSeasonWriteDispatch;
    actionDispatch?: EpisodeCollectionActionDispatch;
    i18n?: TranslationContext;
    buildOptions?: BuildAppRouteOptions;
  }

  type ArtworkStatus =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; message: string }
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string };

  type WriteAction = 'mark-watched' | 'mark-unwatched' | 'retry-failed';
  type WriteStatus =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; action: WriteAction; message: string }
    | { kind: 'success'; action: WriteAction; message: string }
    | { kind: 'partial'; action: WriteAction; message: string }
    | { kind: 'error'; action: WriteAction; message: string };

  const noopArtworkDispatch: VideoSeasonArtworkDispatch = {
    refreshSeasonArtwork: async () => undefined
  };
  const noopWriteDispatch: VideoSeasonWriteDispatch = {
    markEpisodesWatched: async (items) => ({
      total: items.length,
      succeeded: items.length,
      failed: 0,
      failedItems: []
    }),
    retryFailedVideoWrites: async (items) => ({
      total: items.length,
      succeeded: items.length,
      failed: 0,
      failedItems: []
    })
  };

  let {
    snapshot,
    route,
    artworkDispatch = noopArtworkDispatch,
    writeDispatch = noopWriteDispatch,
    actionDispatch = defaultEpisodeCollectionActionDispatch,
    buildOptions = {}
  }: Props = $props();
  let artworkStatusOverride = $state<ArtworkStatus | null>(null);
  let writeStatus = $state<WriteStatus>({
    kind: 'idle',
    message: 'Season write actions are ready.'
  });
  let retryItems = $state<VideoSeasonWriteItem[]>([]);
  let collectionActionStatus = $state('');
  let pendingCollectionAction = $state<'play' | 'queue' | null>(null);

  const routeTvShowId = $derived(
    route.kind === 'videoTvSeasonDetail' ? safePositiveId(route.tvshowid) : null
  );
  const routeSeason = $derived(
    route.kind === 'videoTvSeasonDetail' ? safeSeason(route.season) : null
  );
  const tvShow = $derived(
    snapshot.selectedTvShowId === routeTvShowId ? snapshot.tvShowDetail : null
  );
  const season = $derived(findSeason(snapshot.seasons, routeTvShowId, routeSeason));
  const episodes = $derived(
    season ? orderedEpisodes(snapshot.episodes, routeTvShowId, routeSeason) : []
  );
  const title = $derived(season ? safeSeasonLabel(season) : fallbackTitle(route));
  const showTitle = $derived(tvShow ? safeLabel(tvShow, 'Unknown TV show') : 'TV show');
  const statusMessage = $derived(
    artworkStatusOverride?.message ?? capabilityText(snapshot.seasonArtworkCapability)
  );
  const pending = $derived(artworkStatusOverride?.kind === 'pending');
  const writableEpisodes = $derived(buildWritableEpisodes(episodes));
  const writePending = $derived(writeStatus.kind === 'pending');
  const writeDisabled = $derived(writePending || writableEpisodes.length === 0);

  function findSeason(
    values: readonly VideoSeasonSnapshot[],
    tvshowid: number | null,
    seasonNumber: number | null
  ): VideoSeasonSnapshot | null {
    if (
      tvshowid === null ||
      seasonNumber === null ||
      snapshot.selectedTvShowId !== tvshowid ||
      snapshot.selectedSeason !== seasonNumber
    )
      return null;
    return (
      values.find(
        (item) =>
          safePositiveId(item.tvshowid) === tvshowid && safeSeason(item.season) === seasonNumber
      ) ?? null
    );
  }

  function orderedEpisodes(
    values: readonly VideoEpisodeSnapshot[],
    tvshowid: number | null,
    seasonNumber: number | null
  ): VideoEpisodeSnapshot[] {
    if (tvshowid === null || seasonNumber === null) return [];
    return [...values]
      .filter(
        (episode) =>
          (episode.tvshowid === undefined || safePositiveId(episode.tvshowid) === tvshowid) &&
          (episode.season === undefined || safeSeason(episode.season) === seasonNumber)
      )
      .sort(
        (left, right) =>
          (safeSeason(left.episode) ?? 0) - (safeSeason(right.episode) ?? 0) ||
          (safePositiveId(left.episodeid) ?? 0) - (safePositiveId(right.episodeid) ?? 0)
      );
  }

  function buildWritableEpisodes(values: readonly VideoEpisodeSnapshot[]): VideoSeasonWriteItem[] {
    return values.flatMap((episode) => {
      const episodeid = safePositiveId(episode.episodeid);
      if (episodeid === null) return [];
      return [{ episodeid, label: safeEpisodeLabel(episode) }];
    });
  }

  function episodeKey(episode: VideoEpisodeSnapshot, index: number): string {
    const episodeid = safePositiveId(episode.episodeid);
    return episodeid === null ? `invalid-${index}` : `episode-${episodeid}`;
  }

  function failedItemsFromSummary(summary: VideoSeasonWriteSummary): VideoSeasonWriteItem[] {
    return (Array.isArray(summary.failedItems) ? summary.failedItems : []).flatMap((item) => {
      const episodeid = safePositiveId(item.id);
      if (episodeid === null) return [];
      return [{ episodeid, label: safeFailedLabel(item, episodeid) }];
    });
  }

  function safeFailedLabel(item: VideoWriteFailedItemSnapshot, episodeid: number): string {
    return textOrNull(item.label) ?? `Episode ${episodeid}`;
  }

  function normalizeSummary(
    value: VideoSeasonWriteSummary,
    attemptedTotal: number
  ):
    | {
        ok: true;
        total: number;
        succeeded: number;
        failed: number;
        failedItems: VideoWriteFailedItemSnapshot[];
      }
    | { ok: false; message: string } {
    const total = finiteNonNegativeInteger(value?.total);
    const succeeded = finiteNonNegativeInteger(value?.succeeded);
    const failed = finiteNonNegativeInteger(value?.failed);
    if (
      total === null ||
      succeeded === null ||
      failed === null ||
      total > attemptedTotal ||
      succeeded + failed > total
    ) {
      return {
        ok: false,
        message: 'Season write failed. The write dispatch returned a malformed summary.'
      };
    }
    const failedItems = Array.isArray(value.failedItems)
      ? value.failedItems.map((item) => ({ ...item, error: item.error ? { ...item.error } : null }))
      : [];
    return { ok: true, total, succeeded, failed, failedItems };
  }

  function finiteNonNegativeInteger(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  function writeSummaryMessage(summary: {
    total: number;
    succeeded: number;
    failed: number;
  }): string {
    return `${summary.succeeded} of ${summary.total} updated; ${summary.failed} failed`;
  }

  function failedItemsMessage(items: readonly VideoWriteFailedItemSnapshot[]): string {
    const visible = items.slice(0, 3).map((item) => {
      const id = safePositiveId(item.id);
      const label = id === null ? (textOrNull(item.label) ?? 'Episode') : safeFailedLabel(item, id);
      const message = item.error?.message ? `: ${sanitizeUiText(item.error.message)}` : '';
      return `${label}${message}`;
    });
    const remaining = items.length - visible.length;
    return [visible.join('; '), remaining > 0 ? `${remaining} more failed.` : '']
      .filter(Boolean)
      .join(' ');
  }

  async function markSeasonWatched(watched: boolean): Promise<void> {
    const items = writableEpisodes;
    const action: WriteAction = watched ? 'mark-watched' : 'mark-unwatched';
    retryItems = [];
    if (items.length === 0) {
      writeStatus = {
        kind: 'error',
        action,
        message: 'No writable episodes in this season snapshot.'
      };
      return;
    }
    writeStatus = {
      kind: 'pending',
      action,
      message: `Marking ${items.length} ${items.length === 1 ? 'episode' : 'episodes'} ${watched ? 'watched' : 'unwatched'}…`
    };
    try {
      const result = normalizeSummary(
        await writeDispatch.markEpisodesWatched(items, watched),
        items.length
      );
      if (!result.ok) {
        writeStatus = { kind: 'error', action, message: result.message };
        return;
      }
      retryItems = failedItemsFromSummary({ ...result, failedItems: result.failedItems });
      const detail = result.failed > 0 ? failedItemsMessage(result.failedItems) : '';
      writeStatus = {
        kind: result.failed === 0 ? 'success' : result.succeeded === 0 ? 'error' : 'partial',
        action,
        message: `${writeSummaryMessage(result)}${detail ? `. ${detail}` : ''}`
      };
    } catch (error) {
      retryItems = [];
      writeStatus = {
        kind: 'error',
        action,
        message: `Could not mark season ${watched ? 'watched' : 'unwatched'}. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  async function retryFailedWrites(): Promise<void> {
    const items = retryItems;
    if (items.length === 0) return;
    writeStatus = {
      kind: 'pending',
      action: 'retry-failed',
      message: `Retrying ${items.length} failed ${items.length === 1 ? 'episode' : 'episodes'}…`
    };
    try {
      const result = normalizeSummary(
        await writeDispatch.retryFailedVideoWrites(items),
        items.length
      );
      if (!result.ok) {
        retryItems = [];
        writeStatus = { kind: 'error', action: 'retry-failed', message: result.message };
        return;
      }
      retryItems = failedItemsFromSummary({ ...result, failedItems: result.failedItems });
      const detail = result.failed > 0 ? failedItemsMessage(result.failedItems) : '';
      writeStatus = {
        kind: result.failed === 0 ? 'success' : result.succeeded === 0 ? 'error' : 'partial',
        action: 'retry-failed',
        message: `${writeSummaryMessage(result)}${detail ? `. ${detail}` : ''}`
      };
    } catch (error) {
      retryItems = [];
      writeStatus = {
        kind: 'error',
        action: 'retry-failed',
        message: `Could not retry failed season writes. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  function episodeHref(episode: VideoEpisodeSnapshot): string | null {
    const tvshowid = routeTvShowId;
    const seasonNumber = routeSeason;
    const episodeid = safePositiveId(episode.episodeid);
    return tvshowid === null || seasonNumber === null || episodeid === null
      ? null
      : videoHref({ kind: 'videoEpisodeDetail', tvshowid, season: seasonNumber, episodeid });
  }

  function videoHref(target: VideoRoute): string {
    return buildKodiPackageSafeVideoAppRoute(target, buildOptions);
  }

  async function refreshArtwork(): Promise<void> {
    if (routeTvShowId === null || routeSeason === null || !season) {
      artworkStatusOverride = {
        kind: 'error',
        message: 'Choose a valid season before refreshing artwork.'
      };
      return;
    }
    const label = `${showTitle} season ${routeSeason}`;
    artworkStatusOverride = { kind: 'pending', message: `Refreshing artwork for ${label}…` };
    try {
      await artworkDispatch.refreshSeasonArtwork({ tvshowid: routeTvShowId, season: routeSeason });
      artworkStatusOverride = {
        kind: 'success',
        message: `Artwork refresh requested for ${label}.`
      };
    } catch (error) {
      artworkStatusOverride = {
        kind: 'error',
        message: `Could not refresh artwork for ${label}. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  async function runCollectionAction(action: 'play' | 'queue'): Promise<void> {
    if (routeTvShowId === null || routeSeason === null || !season) {
      collectionActionStatus = 'Choose a valid season before playing episodes.';
      return;
    }

    const label = `${showTitle} season ${routeSeason}`;
    pendingCollectionAction = action;
    collectionActionStatus = `${action === 'play' ? 'Playing' : 'Queueing'} ${label}...`;

    try {
      const result =
        action === 'play'
          ? await actionDispatch.playEpisodeCollection({
              tvshowid: routeTvShowId,
              season: routeSeason,
              label
            })
          : await actionDispatch.queueEpisodeCollection({
              tvshowid: routeTvShowId,
              season: routeSeason,
              label
            });
      collectionActionStatus =
        result.count === 0
          ? `No episodes found for ${label}.`
          : `${action === 'play' ? 'Played' : 'Queued'} ${result.count} ${episodeWord(result.count)} from ${label}.`;
    } catch (error) {
      collectionActionStatus = `Could not ${action} ${label}. ${sanitizeUiText(errorMessage(error))}`;
    } finally {
      pendingCollectionAction = null;
    }
  }

  function capabilityText(capability: VideoSeasonArtworkRefreshCapabilitySnapshot): string {
    if (capability.status === 'supported') {
      const types = capability.availableArtTypes.map(sanitizeUiText).join(', ');
      return `Season artwork ready. ${sanitizeUiText(capability.reason)}${types ? ` Available types: ${types}.` : ''}`;
    }
    if (capability.status === 'unsupported')
      return `Season artwork unsupported. ${sanitizeUiText(capability.reason)}`;
    if (capability.status === 'unavailable')
      return `Season artwork unavailable. ${sanitizeUiText(capability.reason)}`;
    return `Season artwork failed. ${sanitizeUiText(capability.message)}`;
  }

  function fallbackTitle(value: VideoRoute): string {
    if (value.kind !== 'videoTvSeasonDetail') return 'Season route unavailable';
    return routeSeason === null ? 'Season route unavailable' : `Season ${routeSeason} not found`;
  }

  function notFoundCopy(): string {
    if (route.kind !== 'videoTvSeasonDetail' || routeTvShowId === null || routeSeason === null)
      return 'Open a TV show and choose a season link.';
    return `Season ${routeSeason} is not present in this snapshot.`;
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
  function safeSeasonLabel(value: VideoSeasonSnapshot): string {
    const seasonNumber = safeSeason(value.season);
    return safeLabel(value, seasonNumber === null ? 'Unknown season' : `Season ${seasonNumber}`);
  }
  function safeEpisodeLabel(value: VideoEpisodeSnapshot): string {
    return safeLabel(value, 'Unknown episode');
  }
  function episodeNumberText(value: VideoEpisodeSnapshot): string | null {
    const episode = safeSeason(value.episode);
    return episode === null ? null : `Episode ${episode}`;
  }
  function durationText(value: unknown): string | null {
    const seconds = numberOrNull(value);
    if (seconds === null) return null;
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  function unwatchedText(value: Pick<VideoSeasonSnapshot, 'unwatchedEpisodes'>): string {
    const count = Math.trunc(Math.max(0, numberOrNull(value.unwatchedEpisodes) ?? 0));
    return count === 1 ? '1 unwatched episode' : `${count} unwatched episodes`;
  }
  function countSummary(): string {
    const total =
      typeof snapshot.limits.episodes.total === 'number' &&
      Number.isFinite(snapshot.limits.episodes.total)
        ? snapshot.limits.episodes.total
        : episodes.length;
    return `${episodes.length} of ${total} episodes`;
  }
  function episodeWord(count: number): string {
    return count === 1 ? 'episode' : 'episodes';
  }
  function isWatched(value: VideoEpisodeSnapshot): boolean {
    return value.watched === true || (numberOrNull(value.playcount) ?? 0) > 0;
  }
  function hasResume(value: VideoEpisodeSnapshot): boolean {
    const position = numberOrNull(value.resume?.position);
    const total = numberOrNull(value.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
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
      : 'Season artwork refresh failed.';
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

<section class="video-season-detail-shell surface" aria-labelledby="video-season-title">
  <a
    class="back-link"
    href={routeTvShowId
      ? videoHref({ kind: 'videoTvShowDetail', tvshowid: routeTvShowId })
      : videoHref({ kind: 'videoTvShows' })}>Back to {showTitle}</a
  >
  <div class="panel-heading season-hero" aria-label="Safe season artwork summary">
    <div class="season-poster-frame" aria-hidden="true"><span>Season poster</span></div>
    <div class="hero-copy">
      <p class="section-kicker">Season detail</p>
      <h2 id="video-season-title">{title}</h2>
      <p class="summary-line">
        Season poster surface for ordered episodes, artwork refresh feedback, and watched write
        recovery.
      </p>
    </div>
  </div>

  {#if season}
    <div class="artwork-actions">
      <button
        type="button"
        disabled={pendingCollectionAction !== null}
        onclick={() => void runCollectionAction('play')}>Play season</button
      >
      <button
        type="button"
        disabled={pendingCollectionAction !== null}
        onclick={() => void runCollectionAction('queue')}>Queue season</button
      >
      <button
        type="button"
        aria-label={`Refresh artwork for ${showTitle} season ${routeSeason}`}
        disabled={pending}
        onclick={() => void refreshArtwork()}>Refresh artwork</button
      >
      <div class="action-status" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
    </div>
    {#if collectionActionStatus}
      <div class="action-status" role="status" aria-live="polite" aria-atomic="true">
        {collectionActionStatus}
      </div>
    {/if}
    <div class="season-write-actions" aria-label="Season watched actions">
      <button
        type="button"
        aria-label="Mark season watched"
        disabled={writeDisabled}
        onclick={() => void markSeasonWatched(true)}>Mark season watched</button
      >
      <button
        type="button"
        aria-label="Mark season unwatched"
        disabled={writeDisabled}
        onclick={() => void markSeasonWatched(false)}>Mark season unwatched</button
      >
      {#if retryItems.length > 0}
        <button
          type="button"
          aria-label="Retry failed"
          disabled={writePending}
          onclick={() => void retryFailedWrites()}>Retry failed</button
        >
      {/if}
      <div
        class={`write-status ${writeStatus.kind}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {writableEpisodes.length === 0
          ? 'No writable episodes in this season snapshot.'
          : writeStatus.message}
      </div>
    </div>
    <p class="count-summary">{countSummary()}</p>
    <p class="state-copy">{unwatchedText(season)}</p>
    {#if episodes.length === 0}
      <p class="state-copy">No episodes found for this season snapshot.</p>
    {:else}
      <ul class="episode-list" aria-label="Season episodes">
        {#each episodes as episode, index (episodeKey(episode, index))}
          {@const href = episodeHref(episode)}
          <li class="episode-card">
            {#if href}<a class="episode-link episode-title" {href}>{safeEpisodeLabel(episode)}</a
              >{:else}<span class="episode-title">{safeEpisodeLabel(episode)}</span>{/if}
            <p class="episode-meta">
              {[episodeNumberText(episode), durationText(episode.runtime)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div class="badge-list" aria-label="Episode metadata">
              {#if isWatched(episode)}<span class="badge">Watched</span>{/if}
              {#if hasResume(episode)}<span class="badge">Resume available</span>{/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    <div class="empty-state" role="status" aria-live="polite" aria-atomic="true">
      <p>{fallbackTitle(route)}</p>
      <p>{notFoundCopy()}</p>
    </div>
  {/if}
</section>

<style>
  .video-season-detail-shell {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }
  .panel-heading,
  .hero-copy,
  .episode-card,
  .empty-state,
  .artwork-actions,
  .season-write-actions {
    display: grid;
    gap: var(--space-xs);
  }
  .season-hero {
    grid-template-columns: minmax(5rem, 0.22fr) minmax(0, 1fr);
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
  .season-poster-frame {
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
  ul {
    margin: 0;
  }
  .section-kicker {
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
  .episode-meta,
  .empty-state,
  .action-status,
  .write-status,
  .state-copy,
  .count-summary {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }
  .back-link,
  .episode-link,
  .episode-title {
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
    overflow-wrap: anywhere;
  }
  .back-link:focus-visible,
  .episode-link:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }
  button {
    min-height: 2.5rem;
    min-width: 2.5rem;
    justify-self: start;
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
  .episode-list {
    display: grid;
    gap: var(--space-md);
    padding: 0;
    list-style: none;
  }
  .episode-card,
  .empty-state,
  .action-status,
  .write-status {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }
  .write-status.success {
    color: var(--color-success);
  }
  .write-status.partial,
  .write-status.error {
    color: var(--color-danger);
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
