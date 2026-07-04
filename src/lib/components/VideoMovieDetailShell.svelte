<script module lang="ts">
  import './videoMovieDetailShellClassic.css';
  import type { MoviePlaybackItem } from '$lib/stores/playerDispatch.svelte';
  import type { MovieQueueItem } from '$lib/stores/queue.svelte';

  export interface VideoMovieActionDispatch {
    playMovieItem: (item: MoviePlaybackItem) => Promise<void> | void;
    resumeMovieItem: (item: { movieid: number }) => Promise<void> | void;
    queueMovieItem: (item: MovieQueueItem) => Promise<void> | void;
    streamMovieItem?: (item: { movieid: number }) => Promise<void> | void;
    markMovieWatched?: (item: {
      movieid: number;
      watched: boolean;
      label?: string;
    }) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import type {
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { videoLibraryStore } from '$lib/stores/videoLibrary.svelte';
  import type {
    VideoMovieDetailSnapshot,
    VideoMovieDetailStoreSnapshot,
    VideoMovieVersionsSnapshot
  } from '$lib/stores/videoMovieDetailStore.svelte';
  import { videoMovieDetailStore } from '$lib/stores/videoMovieDetailStore.svelte';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';
  import { firstOptionalKodiImageUrl, optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';
  import { sanitizeUiText, textOrNull } from './textFormatting';

  interface Props {
    snapshot?: VideoLibraryStoreSnapshot;
    route: VideoRoute;
    detailSnapshot?: VideoMovieDetailStoreSnapshot;
    actionDispatch?: VideoMovieActionDispatch;
    i18n?: TranslationContext;
    backHref?: string;
  }

  type ActionKind = 'play' | 'resume' | 'queue' | 'mark-watched' | 'mark-unwatched';
  type ActionStatus =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; action: ActionKind; message: string }
    | { kind: 'success'; action: ActionKind; message: string }
    | { kind: 'error'; action: ActionKind; message: string };

  const noopActionDispatch: VideoMovieActionDispatch = {
    playMovieItem: async () => undefined,
    resumeMovieItem: async () => undefined,
    queueMovieItem: async () => undefined,
    markMovieWatched: async () => undefined
  };

  const defaultI18n = createEnglishTranslationContext();
  let {
    snapshot: injectedSnapshot,
    route,
    detailSnapshot: injectedDetailSnapshot,
    actionDispatch = noopActionDispatch,
    i18n = defaultI18n,
    backHref
  }: Props = $props();
  const snapshot = $derived(injectedSnapshot ?? videoLibraryStore.snapshot);
  const detailSnapshot = $derived(injectedDetailSnapshot ?? videoMovieDetailStore.snapshot);
  let actionStatus = $state<ActionStatus>({ kind: 'idle', message: '' });
  $effect.pre(() => {
    if (actionStatus.kind === 'idle') {
      actionStatus.message = i18n.t('video.movie.actionsReady');
    }
  });
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
  const streamHref = $derived(
    movieid === null ? null : buildVideoRoute({ kind: 'videoMovieStream', movieid })
  );
  const moviesHref = $derived(backHref ?? buildVideoRoute({ kind: 'videoMovies' }));
  const posterUrl = $derived(movie ? preferredPosterUrl(movie) : undefined);
  const fanartUrl = $derived(
    movie ? optionalKodiImageUrl(movie.fanart ?? movie.art?.fanart) : undefined
  );
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
      return i18n.t('video.movie.routeUnavailable');
    }

    return movieid === null
      ? i18n.t('video.movie.routeUnavailable')
      : i18n.t('video.movie.notFound');
  }

  function safeMovieId(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function safeMovieLabel(value: Pick<VideoLibraryMovieSnapshot, 'label' | 'title'>): string {
    return textOrNull(value.title) ?? textOrNull(value.label) ?? i18n.t('video.movie.unknown');
  }

  function movieMetadata(value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot): string {
    return [formatYear(value.year), formatDuration(value.runtime)].filter(Boolean).join(' · ');
  }

  function routeIdentity(): string | null {
    return routeMovieId === null ? null : i18n.t('video.movie.movieId', { id: routeMovieId });
  }

  function notFoundCopy(): string {
    return routeMovieId === null
      ? i18n.t('video.movie.openGrid')
      : i18n.t('video.movie.notPresent', { id: routeMovieId });
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
        labels.push(i18n.t('video.movie.posterArtworkAvailable'));
      }
      if (value.fanartAvailable || value.artwork.fanart) {
        labels.push(i18n.t('video.movie.fanartArtworkAvailable'));
      }
      for (const [key, available] of Object.entries(value.artwork)) {
        if (available && key !== 'poster' && key !== 'fanart') {
          labels.push(i18n.t('video.movie.namedArtworkAvailable', { name: sanitizeUiText(key) }));
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

    return hasArtwork ? [i18n.t('video.movie.artworkMetadataAvailable')] : [];
  }

  function preferredPosterUrl(
    value: VideoLibraryMovieSnapshot | VideoMovieDetailSnapshot
  ): string | undefined {
    return firstOptionalKodiImageUrl(value.art?.poster, value.art?.thumb, value.thumbnail);
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
      return count === 1
        ? i18n.t('video.movie.versionOne')
        : i18n.t('video.movie.versionMany', { count });
    }

    if (Array.isArray(raw.versions) && raw.versions.length > 0) {
      return raw.versions.length === 1
        ? i18n.t('video.movie.versionOne')
        : i18n.t('video.movie.versionMany', { count: raw.versions.length });
    }

    if (raw.hasVersions === true) {
      return i18n.t('video.movie.versionMetadataAvailable');
    }

    return i18n.t('video.movie.versionMetadataUnavailable');
  }

  function versionStateText(versions: VideoMovieVersionsSnapshot): string {
    if (versions.status === 'ready') {
      const count = safeVersionItems(versions).length;
      return count === 1
        ? i18n.t('video.movie.versionOne')
        : i18n.t('video.movie.versionMany', { count });
    }

    if (versions.status === 'unsupported') {
      return i18n.t('video.movie.versionsUnsupported', { reason: sanitizeUiText(versions.reason) });
    }

    if (versions.status === 'error') {
      return i18n.t('video.movie.versionsFailed', { message: sanitizeUiText(versions.message) });
    }

    return i18n.t('video.movie.versionsUnavailable', { reason: sanitizeUiText(versions.reason) });
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
      { label: i18n.t('video.movie.field.tagline'), value: textOrNull(value.tagline) ?? '' },
      {
        label: i18n.t('video.movie.field.plot'),
        value: textOrNull(value.plot) ?? textOrNull(value.plotoutline) ?? ''
      },
      { label: i18n.t('video.movie.field.genres'), value: safeJoin(value.genre) },
      { label: i18n.t('video.movie.field.directors'), value: safeJoin(value.director) },
      { label: i18n.t('video.movie.field.studios'), value: safeJoin(value.studio) },
      {
        label: i18n.t('video.movie.field.rating'),
        value: formatRating(i18n.t('video.movie.field.rating'), value.rating)
      },
      {
        label: i18n.t('video.movie.field.userRating'),
        value: formatRating(i18n.t('video.movie.field.userRating'), value.userrating)
      },
      { label: i18n.t('video.movie.field.certification'), value: textOrNull(value.mpaa) ?? '' },
      { label: i18n.t('video.movie.field.premiered'), value: textOrNull(value.premiered) ?? '' }
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
        message: i18n.t('video.movie.chooseValid')
      };
      return;
    }

    const label = safeMovieLabel(movie);
    actionStatus = {
      kind: 'pending',
      action,
      message: actionPendingMessage(action, label)
    };

    try {
      if (action === 'play') {
        await actionDispatch.playMovieItem({ movieid });
      } else if (action === 'resume') {
        await actionDispatch.resumeMovieItem({ movieid });
      } else if (action === 'queue') {
        await actionDispatch.queueMovieItem({ movieid });
      } else {
        await actionDispatch.markMovieWatched?.({
          movieid,
          watched: action === 'mark-watched',
          label
        });
      }

      actionStatus = {
        kind: 'success',
        action,
        message:
          action === 'play'
            ? i18n.t('video.movie.action.playStarted', { label })
            : action === 'mark-watched'
              ? i18n.t('video.movie.action.markedWatched', { label })
              : action === 'mark-unwatched'
                ? i18n.t('video.movie.action.markedUnwatched', { label })
                : action === 'resume'
                  ? i18n.t('video.movie.action.resumed', { label })
                  : i18n.t('video.movie.action.queued', { label })
      };
    } catch (error) {
      actionStatus = {
        kind: 'error',
        action,
        message: `${actionErrorPrefix(action, label)}. ${sanitizeUiText(errorMessage(error))}`
      };
    }
  }

  function actionErrorPrefix(action: ActionKind, label: string): string {
    if (action === 'mark-watched')
      return i18n.t('video.movie.action.couldNotMarkWatched', { label });
    if (action === 'mark-unwatched')
      return i18n.t('video.movie.action.couldNotMarkUnwatched', { label });
    if (action === 'play') return i18n.t('video.movie.action.couldNotPlay', { label });
    if (action === 'resume') return i18n.t('video.movie.action.couldNotResume', { label });
    return i18n.t('video.movie.action.couldNotQueue', { label });
  }

  function actionPendingMessage(action: ActionKind, label: string): string {
    if (action === 'mark-watched') return i18n.t('video.movie.action.markingWatched', { label });
    if (action === 'mark-unwatched')
      return i18n.t('video.movie.action.markingUnwatched', { label });
    if (action === 'play') return i18n.t('video.movie.action.playing', { label });
    if (action === 'resume') return i18n.t('video.movie.action.resuming', { label });
    return i18n.t('video.movie.action.queueing', { label });
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim()
      ? error.message
      : i18n.t('video.movie.actionFailed');
  }

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="video-movie-detail-shell surface" aria-labelledby="video-movie-detail-title">
  <a class="back-link" href={moviesHref}>{i18n.t('video.movie.backToMovies')}</a>

  <div
    class="panel-heading movie-detail-hero"
    class:has-fanart={Boolean(fanartUrl)}
    aria-label={i18n.t('video.movie.artworkAria')}
    style={fanartUrl ? `--movie-fanart-url: url('${fanartUrl}')` : undefined}
  >
    <div class="fanart-wash" aria-hidden="true"></div>
    <div class="poster-frame" class:has-poster={Boolean(posterUrl)} aria-hidden="true">
      {#if posterUrl}
        <img src={posterUrl} alt="" loading="lazy" decoding="async" />
      {:else}
        <span>{i18n.t('video.movie.poster')}</span>
      {/if}
    </div>
    <div class="hero-copy">
      <p class="section-kicker">{i18n.t('video.movie.detailKicker')}</p>
      <h2 id="video-movie-detail-title">{title}</h2>
      <p class="summary-line">
        {i18n.t('video.movie.detailDescription')}
      </p>
    </div>
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

    <div class="movie-actions" aria-label={i18n.t('video.movie.actionsAria')}>
      <button
        type="button"
        aria-label={i18n.t('video.movie.playAria', { title })}
        disabled={actionDisabled}
        onclick={() => void runAction('play')}
      >
        {i18n.t('video.movie.play')}
      </button>
      <button
        type="button"
        aria-label={i18n.t('video.movie.resumeAria', { title })}
        disabled={actionDisabled || !hasResumeState}
        onclick={() => void runAction('resume')}
      >
        {i18n.t('video.movie.resume')}
      </button>
      <button
        type="button"
        aria-label={i18n.t('video.movie.queueAria', { title })}
        disabled={actionDisabled}
        onclick={() => void runAction('queue')}
      >
        {i18n.t('video.movie.queue')}
      </button>
      <button
        type="button"
        aria-label={i18n.t('video.movie.markAria', {
          title,
          state: isWatched(movie)
            ? i18n.t('video.movie.state.unwatched')
            : i18n.t('video.movie.state.watched')
        })}
        disabled={actionDisabled}
        onclick={() => void runAction(isWatched(movie) ? 'mark-unwatched' : 'mark-watched')}
      >
        {isWatched(movie) ? i18n.t('video.movie.markUnwatched') : i18n.t('video.movie.markWatched')}
      </button>
      {#if streamHref}
        <a
          class="stream-link"
          href={streamHref}
          aria-label={i18n.t('video.movie.streamAria', { title })}
        >
          {i18n.t('video.movie.streamInBrowser')}
        </a>
      {/if}
    </div>

    <dl class="detail-list">
      {#if routeIdentity()}
        <div>
          <dt>{i18n.t('video.movie.routeIdentity')}</dt>
          <dd>{routeIdentity()}</dd>
        </div>
      {/if}
      {#if movieMetadata(movie)}
        <div>
          <dt>{i18n.t('video.movie.safeMetadata')}</dt>
          <dd>{movieMetadata(movie)}</dd>
        </div>
      {/if}
      <div>
        <dt>{i18n.t('video.movie.watchedState')}</dt>
        <dd>
          {isWatched(movie) ? i18n.t('video.movie.watched') : i18n.t('video.movie.notWatched')}
        </dd>
      </div>
      <div>
        <dt>{i18n.t('video.movie.resumeState')}</dt>
        <dd>
          {hasResumeState ? i18n.t('video.movie.resumeAvailable') : i18n.t('video.movie.noResume')}
        </dd>
      </div>
      {#if artworkText(movie).length > 0}
        <div>
          <dt>{i18n.t('video.movie.artwork')}</dt>
          <dd>{artworkText(movie).join(' · ')}</dd>
        </div>
      {/if}
      <div>
        <dt>{i18n.t('video.movie.versions')}</dt>
        <dd>{versionText(movie)}</dd>
      </div>
    </dl>

    {#if versionItems.length > 0}
      <div class="version-control">
        <label for="video-movie-version">{i18n.t('video.movie.versionLabel')}</label>
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
          {i18n.t('video.movie.versionHelp')}
        </p>
      </div>
    {/if}

    {@const fields = detailFields(movie)}
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
  {:else}
    <div class="empty-state" role="status" aria-live="polite" aria-atomic="true">
      <p>{fallbackTitle(routeMovieId, route)}</p>
      <p>{notFoundCopy()}</p>
    </div>
  {/if}
</section>
