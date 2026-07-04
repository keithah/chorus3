<script lang="ts">
  import LazyRouteComponent from '$lib/app-pages/LazyRouteComponent.svelte';
  import { bindLazyRoute, loadMetadataEditDialog } from '$lib/app-pages/appPageSurfaceLazyRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import { buildKodiPackageSafeVideoAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import {
    METADATA_EDITOR_DEFINITIONS,
    buildTvShowMetadataEditorSource,
    displayTitleForMetadataEditor,
    type MetadataEditorPayload
  } from '$lib/metadata/metadataEditor';
  import { createActiveKodiJsonRpcHttpClient } from '$lib/stores/kodiClient';
  import {
    defaultEpisodeCollectionActionDispatch,
    type EpisodeCollectionActionDispatch
  } from '$lib/stores/episodeCollectionActions';
  import type {
    VideoSeasonSnapshot,
    VideoTvShowDetailSnapshot,
    VideoTvStoreSnapshot
  } from '$lib/stores/videoTvStore.svelte';
  import { videoTvStore } from '$lib/stores/videoTvStore.svelte';
  import { firstOptionalKodiImageUrl, optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import type { VideoRoute } from '$lib/video/videoRouter';
  import { sanitizeUiText, textOrNull } from './textFormatting';

  interface Props {
    snapshot?: VideoTvStoreSnapshot;
    route: VideoRoute;
    i18n?: TranslationContext;
    buildOptions?: BuildAppRouteOptions;
    metadataSave?: (method: string, params: Record<string, unknown>) => Promise<void> | void;
    actionDispatch?: EpisodeCollectionActionDispatch;
  }

  let {
    snapshot: injectedSnapshot,
    route,
    buildOptions = {},
    metadataSave = defaultMetadataSave,
    actionDispatch = defaultEpisodeCollectionActionDispatch
  }: Props = $props();
  const snapshot = $derived(injectedSnapshot ?? videoTvStore.snapshot);
  let editOpen = $state(false);
  let editPending = $state(false);
  let editError = $state<string | null>(null);
  let editStatus = $state('');
  let collectionActionStatus = $state('');
  let pendingCollectionAction = $state<'play' | 'queue' | null>(null);

  const routeTvShowId = $derived(
    route.kind === 'videoTvShowDetail' ? safePositiveId(route.tvshowid) : null
  );
  const tvShow = $derived(findTvShow(snapshot, routeTvShowId));
  const title = $derived(tvShow ? safeTvShowLabel(tvShow) : fallbackTitle(routeTvShowId, route));
  const posterUrl = $derived(tvShow ? preferredPosterUrl(tvShow) : undefined);
  const fanartUrl = $derived(
    tvShow ? optionalKodiImageUrl(tvShow.fanart ?? tvShow.art?.fanart) : undefined
  );
  const seasons = $derived(tvShow ? safeSeasons(snapshot.seasons, routeTvShowId) : []);
  const statusCopy = $derived(formatStatus(snapshot));

  function findTvShow(
    value: VideoTvStoreSnapshot,
    tvshowid: number | null
  ): VideoTvShowDetailSnapshot | null {
    if (tvshowid === null) {
      return null;
    }

    if (value.selectedTvShowId !== tvshowid) {
      return null;
    }

    return safePositiveId(value.tvShowDetail?.tvshowid) === tvshowid ? value.tvShowDetail : null;
  }

  function safeSeasons(
    values: readonly VideoSeasonSnapshot[],
    tvshowid: number | null
  ): VideoSeasonSnapshot[] {
    if (tvshowid === null) {
      return [];
    }
    return [...values]
      .filter(
        (season) =>
          safePositiveId(season.tvshowid) === tvshowid && safeSeason(season.season) !== null
      )
      .sort((left, right) => (safeSeason(left.season) ?? 0) - (safeSeason(right.season) ?? 0));
  }

  function formatStatus(value: VideoTvStoreSnapshot): string {
    if (value.refreshStatus === 'loading') {
      return `Loading TV show details from ${sanitizeUiText(value.lastRefreshReason)}.`;
    }
    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }
    return `${seasons.length} of ${formatTotal(value, seasons.length)} seasons`;
  }

  function formatTotal(value: VideoTvStoreSnapshot, fallback: number): number {
    const total = value.limits?.seasons?.total;
    return typeof total === 'number' && Number.isFinite(total) ? total : fallback;
  }

  function fallbackTitle(tvshowid: number | null, value: VideoRoute): string {
    if (value.kind !== 'videoTvShowDetail') {
      return 'TV show route unavailable';
    }
    return tvshowid === null ? 'TV show route unavailable' : 'TV show not found';
  }

  function notFoundCopy(): string {
    if (route.kind !== 'videoTvShowDetail' || routeTvShowId === null) {
      return 'Open the TV shows grid and choose a TV show link.';
    }
    return `TV show ID ${routeTvShowId} is not present in this snapshot.`;
  }

  function safePositiveId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function safeSeason(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  function safeTvShowLabel(value: Pick<VideoTvShowDetailSnapshot, 'label' | 'title'>): string {
    return textOrNull(value.title) ?? textOrNull(value.label) ?? 'Unknown TV show';
  }

  function safeSeasonLabel(value: VideoSeasonSnapshot): string {
    const season = safeSeason(value.season);
    return (
      textOrNull(value.title) ??
      textOrNull(value.label) ??
      (season === null ? 'Unknown season' : `Season ${season}`)
    );
  }

  function seasonHref(season: VideoSeasonSnapshot): string | null {
    const tvshowid = safePositiveId(season.tvshowid);
    const seasonNumber = safeSeason(season.season);
    return tvshowid === null || seasonNumber === null
      ? null
      : buildKodiPackageSafeVideoAppRoute(
          { kind: 'videoTvSeasonDetail', tvshowid, season: seasonNumber },
          buildOptions
        );
  }

  function videoHref(target: VideoRoute): string {
    return buildKodiPackageSafeVideoAppRoute(target, buildOptions);
  }

  function metadata(value: VideoTvShowDetailSnapshot): string {
    return [formatYear(value.year), episodeCountText(value.episodeCount)]
      .filter(Boolean)
      .join(' · ');
  }

  function detailFields(value: VideoTvShowDetailSnapshot): { label: string; value: string }[] {
    return [
      { label: 'Plot', value: textOrNull(value.plot) ?? '' },
      { label: 'Genres', value: safeJoin(value.genre) },
      { label: 'Studios', value: safeJoin(value.studio) },
      { label: 'Rating', value: formatRating('Rating', value.rating) },
      { label: 'User rating', value: formatRating('User rating', value.userrating) },
      { label: 'Premiered', value: textOrNull(value.premiered) ?? '' }
    ].filter((field) => field.value.length > 0);
  }

  function artworkText(value: VideoTvShowDetailSnapshot): string {
    const artwork = value.artwork ?? {};
    const poster = value.thumbnailAvailable || artwork.poster;
    const fanart = value.fanartAvailable || artwork.fanart;
    return `${poster ? 'Poster artwork available' : 'Poster artwork unavailable'} · ${
      fanart ? 'Fanart artwork available' : 'Fanart artwork unavailable'
    }`;
  }

  async function defaultMetadataSave(
    method: string,
    params: Record<string, unknown>
  ): Promise<void> {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before editing media.');
    }
    await client.call(method, params);
  }

  async function saveMetadata(payload: MetadataEditorPayload): Promise<void> {
    if (!tvShow || routeTvShowId === null) return;
    const definition = METADATA_EDITOR_DEFINITIONS.tvshow;
    const source = tvShowEditSource(tvShow);
    const currentTitle = displayTitleForMetadataEditor(definition, source, 'TV Show');
    editPending = true;
    editError = null;
    editStatus = `Saving ${currentTitle}...`;

    try {
      await metadataSave(definition.method, {
        [definition.idParam]: routeTvShowId,
        ...payload
      });
      const nextTitle = displayTitleForMetadataEditor(definition, payload, currentTitle);
      editOpen = false;
      editStatus = `Saved metadata for ${nextTitle}.`;
    } catch (error) {
      editError = sanitizeUiText(errorMessage(error));
      editStatus = `Could not save ${currentTitle}. ${sanitizeUiText(errorMessage(error))}`;
      throw error;
    } finally {
      editPending = false;
    }
  }

  async function runCollectionAction(action: 'play' | 'queue'): Promise<void> {
    if (routeTvShowId === null || !tvShow) {
      collectionActionStatus = 'Choose a valid TV show before playing episodes.';
      return;
    }

    pendingCollectionAction = action;
    collectionActionStatus = `${action === 'play' ? 'Playing' : 'Queueing'} ${title}...`;

    try {
      const result =
        action === 'play'
          ? await actionDispatch.playEpisodeCollection({ tvshowid: routeTvShowId, label: title })
          : await actionDispatch.queueEpisodeCollection({ tvshowid: routeTvShowId, label: title });
      collectionActionStatus =
        result.count === 0
          ? `No episodes found for ${title}.`
          : `${action === 'play' ? 'Played' : 'Queued'} ${result.count} ${episodeWord(result.count)} from ${title}.`;
    } catch (error) {
      collectionActionStatus = `Could not ${action} ${title}. ${sanitizeUiText(errorMessage(error))}`;
    } finally {
      pendingCollectionAction = null;
    }
  }

  function tvShowEditSource(value: VideoTvShowDetailSnapshot): Record<string, unknown> {
    return buildTvShowMetadataEditorSource({ ...value });
  }

  function preferredPosterUrl(value: VideoTvShowDetailSnapshot): string | undefined {
    return firstOptionalKodiImageUrl(value.art?.poster, value.art?.thumb, value.thumbnail);
  }

  function formatYear(value: unknown): string | null {
    const year = numberOrNull(value);
    return year === null ? null : String(Math.trunc(year));
  }

  function episodeCountText(value: unknown): string | null {
    const count = numberOrNull(value);
    if (count === null) return null;
    const rounded = Math.trunc(Math.max(0, count));
    return rounded === 1 ? '1 episode' : `${rounded} episodes`;
  }

  function episodeWord(count: number): string {
    return count === 1 ? 'episode' : 'episodes';
  }

  function unwatchedText(value: Pick<VideoSeasonSnapshot, 'unwatchedEpisodes'>): string {
    const count = Math.trunc(Math.max(0, numberOrNull(value.unwatchedEpisodes) ?? 0));
    return count === 1 ? '1 unwatched episode' : `${count} unwatched episodes`;
  }

  function showUnwatchedText(value: Pick<VideoTvShowDetailSnapshot, 'unwatchedEpisodes'>): string {
    const count = Math.trunc(Math.max(0, numberOrNull(value.unwatchedEpisodes) ?? 0));
    return count === 1 ? '1 unwatched episode' : `${count} unwatched episodes`;
  }

  function isWatched(value: VideoSeasonSnapshot): boolean {
    return value.watched === true || (numberOrNull(value.playcount) ?? 0) > 0;
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

  function errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim() ? error.message : 'Metadata save failed.';
  }
</script>

<section class="video-tv-show-detail-shell surface" aria-labelledby="video-tv-show-title">
  <a class="back-link" href={videoHref({ kind: 'videoTvShows' })}>Back to TV shows</a>

  <div
    class="panel-heading tv-show-hero"
    class:has-fanart={Boolean(fanartUrl)}
    aria-label="Safe TV show artwork summary"
    style={fanartUrl ? `--tvshow-fanart-url: url('${fanartUrl}')` : undefined}
  >
    <div class="show-fanart-wash" aria-hidden="true"></div>
    <div class="show-poster-frame" class:has-poster={Boolean(posterUrl)} aria-hidden="true">
      {#if posterUrl}
        <img src={posterUrl} alt="" loading="lazy" decoding="async" />
      {:else}
        <span>Poster</span>
      {/if}
    </div>
    <div class="hero-copy">
      <p class="section-kicker">TV show detail</p>
      <h2 id="video-tv-show-title">{title}</h2>
      <p class="summary-line">
        Poster-led TV show surface with safe fanart context and season browsing.
      </p>
    </div>
  </div>

  <div class="status-line" role="status" aria-live="polite" aria-atomic="true">{statusCopy}</div>

  {#if tvShow}
    {#if editStatus}
      <div class="edit-status" role="status" aria-live="polite">{editStatus}</div>
    {/if}
    <div class="tv-show-actions" aria-label="TV show actions">
      <button
        type="button"
        disabled={pendingCollectionAction !== null}
        onclick={() => void runCollectionAction('play')}>Play</button
      >
      <button
        type="button"
        disabled={pendingCollectionAction !== null}
        onclick={() => void runCollectionAction('queue')}>Queue</button
      >
      <button type="button" onclick={() => (editOpen = true)}>Edit</button>
    </div>
    {#if collectionActionStatus}
      <div class="collection-action-status" role="status" aria-live="polite">
        {collectionActionStatus}
      </div>
    {/if}

    <dl class="detail-list">
      <div>
        <dt>Route identity</dt>
        <dd>TV show ID {routeTvShowId}</dd>
      </div>
      {#if metadata(tvShow)}<div>
          <dt>Safe metadata</dt>
          <dd>{metadata(tvShow)}</dd>
        </div>{/if}
      <div>
        <dt>Unwatched state</dt>
        <dd>{showUnwatchedText(tvShow)}</dd>
      </div>
      <div>
        <dt>Artwork</dt>
        <dd>{artworkText(tvShow)}</dd>
      </div>
    </dl>

    {@const fields = detailFields(tvShow)}
    {#if fields.length > 0}
      <dl class="detail-list rich-fields">
        {#each fields as field}
          <div>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}

    {#if seasons.length === 0}
      <p class="state-copy">No seasons found for this TV show snapshot.</p>
    {:else}
      <ul class="season-list" aria-label="TV show seasons">
        {#each seasons as season (season.season)}
          {@const href = seasonHref(season)}
          <li class="season-card">
            <div class="season-card-art" aria-hidden="true"></div>
            <div class="season-card-copy">
              {#if href}
                <a class="season-link" {href}>{safeSeasonLabel(season)}</a>
              {:else}
                <span class="season-title">{safeSeasonLabel(season)}</span>
              {/if}
              <div class="badge-list" aria-label="Season metadata">
                <span class="badge">{unwatchedText(season)}</span>
                {#if isWatched(season)}<span class="badge">Watched</span>{/if}
                {#if episodeCountText(season.episodeCount)}<span class="badge subtle"
                    >{episodeCountText(season.episodeCount)}</span
                  >{/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
    {#if editOpen}
      <LazyRouteComponent
        route={bindLazyRoute(loadMetadataEditDialog, {
          definition: METADATA_EDITOR_DEFINITIONS.tvshow,
          source: tvShowEditSource(tvShow),
          pending: editPending,
          error: editError,
          onSave: saveMetadata,
          onCancel: () => {
            editOpen = false;
            editError = null;
          }
        })}
      />
    {/if}
  {:else}
    <div class="empty-state" role="status" aria-live="polite" aria-atomic="true">
      {#if snapshot.refreshStatus === 'loading'}
        <p>Loading TV show details…</p>
      {:else}
        <p>{fallbackTitle(routeTvShowId, route)}</p>
        <p>{notFoundCopy()}</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .video-tv-show-detail-shell {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
    color: var(--color-text);
    background: var(--color-background);
  }
  .panel-heading,
  .hero-copy,
  .detail-list,
  .empty-state,
  .season-card {
    display: grid;
    gap: var(--space-xs);
  }
  .tv-show-hero {
    position: relative;
    grid-template-columns: minmax(6.5rem, 0.3fr) minmax(0, 1fr);
    align-items: end;
    overflow: hidden;
    padding: clamp(var(--space-md), 3vw, var(--space-lg));
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 0;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  }
  .tv-show-hero.has-fanart {
    background:
      linear-gradient(90deg, rgb(243 243 243 / 0.96), rgb(243 243 243 / 0.78)),
      var(--tvshow-fanart-url) center / cover,
      var(--color-surface-raised);
  }
  .show-fanart-wash {
    position: absolute;
    inset: 0;
    background: transparent;
    opacity: 0;
  }
  .show-poster-frame {
    position: relative;
    z-index: 1;
    aspect-ratio: 2 / 3;
    min-height: 9rem;
    display: grid;
    place-items: end start;
    padding: var(--space-sm);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: #d7d7d7;
    border: 1px solid #bdbdbd;
    border-radius: 0;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.24);
  }
  .show-poster-frame.has-poster {
    place-items: stretch;
    padding: 0;
    background: #d7d7d7;
  }
  .show-poster-frame img {
    width: 100%;
    height: 100%;
    min-height: inherit;
    object-fit: contain;
    background: #d7d7d7;
  }
  .hero-copy {
    position: relative;
    z-index: 1;
  }
  .section-kicker,
  h2,
  p,
  dl,
  dt,
  dd,
  ul {
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
    color: var(--color-text);
    font-weight: 300;
    overflow-wrap: anywhere;
    font-size: clamp(1.4rem, 3vw, 2.1rem);
    line-height: 1.08;
    text-wrap: balance;
  }
  .summary-line,
  dd,
  .empty-state,
  .status-line,
  .state-copy {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }
  .back-link,
  .season-link,
  .season-title {
    color: var(--color-text);
    font-weight: 850;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
    overflow-wrap: anywhere;
  }
  .back-link:focus-visible,
  .season-link:focus-visible,
  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }
  .tv-show-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  button {
    min-height: 2.5rem;
    padding: 0.65rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 2px;
    color: var(--color-text);
    background: var(--color-surface-raised);
    font: inherit;
    font-weight: 850;
    cursor: pointer;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .detail-list {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-md);
  }
  .detail-list div,
  .empty-state,
  .status-line,
  .edit-status,
  .collection-action-status,
  .season-card {
    padding: var(--space-md);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 0;
    box-shadow: none;
  }
  .season-list {
    display: grid;
    gap: var(--space-md);
    padding: 0;
    list-style: none;
  }
  .season-card {
    grid-template-columns: 3.5rem minmax(0, 1fr);
    align-items: center;
  }
  .season-card-art {
    aspect-ratio: 2 / 3;
    border-radius: 0;
    background: #d7d7d7;
    border: 1px solid #bdbdbd;
    box-shadow: none;
  }
  .season-card-copy {
    display: grid;
    gap: var(--space-xs);
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
    background: #eaf6fa;
    border: 1px solid #c5dfe8;
    border-radius: 2px;
    box-shadow: none;
  }
  .badge.subtle {
    color: var(--color-text-muted);
    background: var(--color-surface);
  }
</style>
