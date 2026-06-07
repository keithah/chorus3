<script lang="ts">
  import './videoRecentPanelClassic.css';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';
  import type {
    VideoEpisodeSnapshot,
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { buildVideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
    i18n?: TranslationContext;
  }

  type RecentSection = {
    key: RecentSectionKey;
    title: string;
    emptyCopy: string;
    total: number;
    items: Array<RecentCard>;
  };

  type RecentSectionKey =
    | 'recentlyAddedMovies'
    | 'recentlyPlayedMovies'
    | 'recentlyAddedEpisodes'
    | 'recentlyPlayedEpisodes';

  type RecentCard = {
    key: string;
    label: string;
    subtitle: string | null;
    href: string | null;
    dateLabel: string | null;
    badges: string[];
    artworkClass: string;
    initials: string;
  };

  let { snapshot, i18n = createEnglishTranslationContext() }: Props = $props();

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const statusText = $derived(formatStatus(snapshot));
  const sections = $derived(buildSections(snapshot));

  function buildSections(value: VideoLibraryStoreSnapshot): RecentSection[] {
    return [
      {
        key: 'recentlyAddedMovies',
        title: i18n.t('video.recent.recentlyAddedMovies'),
        emptyCopy: i18n.t('video.recent.empty.recentlyAddedMovies'),
        total: totalFor(value, 'recentlyAddedMovies', value.recentlyAddedMovies.length),
        items: value.recentlyAddedMovies.map((movie, index) => movieCard(movie, index, 'added'))
      },
      {
        key: 'recentlyPlayedMovies',
        title: i18n.t('video.recent.recentlyPlayedMovies'),
        emptyCopy: i18n.t('video.recent.empty.recentlyPlayedMovies'),
        total: totalFor(value, 'recentlyPlayedMovies', value.recentlyPlayedMovies.length),
        items: value.recentlyPlayedMovies.map((movie, index) => movieCard(movie, index, 'played'))
      },
      {
        key: 'recentlyAddedEpisodes',
        title: i18n.t('video.recent.recentlyAddedEpisodes'),
        emptyCopy: i18n.t('video.recent.empty.recentlyAddedEpisodes'),
        total: totalFor(value, 'recentlyAddedEpisodes', value.recentlyAddedEpisodes.length),
        items: value.recentlyAddedEpisodes.map((episode, index) =>
          episodeCard(episode, index, 'added')
        )
      },
      {
        key: 'recentlyPlayedEpisodes',
        title: i18n.t('video.recent.recentlyPlayedEpisodes'),
        emptyCopy: i18n.t('video.recent.empty.recentlyPlayedEpisodes'),
        total: totalFor(value, 'recentlyPlayedEpisodes', value.recentlyPlayedEpisodes.length),
        items: value.recentlyPlayedEpisodes.map((episode, index) =>
          episodeCard(episode, index, 'played')
        )
      }
    ];
  }

  function movieCard(
    movie: VideoLibraryMovieSnapshot,
    index: number,
    dateKind: 'added' | 'played'
  ): RecentCard {
    const movieid = positiveSafeIntegerOrNull(movie.movieid);
    const label = safeTitle(movie.title, movie.label, i18n.t('video.movie.unknown'));
    const subtitle = [formatYear(movie.year), formatDuration(movie.runtime)]
      .filter(Boolean)
      .join(' · ');
    const dateValue = dateKind === 'added' ? movie.dateadded : movie.lastplayed;

    return {
      key: `movie:${movieid ?? 'missing'}:${index}`,
      label,
      subtitle: subtitle || null,
      href: movieid === null ? null : buildVideoRoute({ kind: 'videoMovieDetail', movieid }),
      dateLabel: formatDateLabel(dateKind, dateValue),
      badges: buildBadges(movie),
      artworkClass: artworkClass(movie),
      initials: initialsFor(label, 'M')
    };
  }

  function episodeCard(
    episode: VideoEpisodeSnapshot,
    index: number,
    dateKind: 'added' | 'played'
  ): RecentCard {
    const episodeid = positiveSafeIntegerOrNull(episode.episodeid);
    const tvshowid = positiveSafeIntegerOrNull(episode.tvshowid);
    const season = positiveSafeIntegerOrNull(episode.season);
    const label = safeTitle(episode.title, episode.label, i18n.t('video.recent.unknownEpisode'));
    const showLabel = textOrNull(episode.showtitle);
    const numberLabel = formatEpisodeNumber(episode.season, episode.episode);
    const subtitle = [showLabel, numberLabel, formatDuration(episode.runtime)]
      .filter(Boolean)
      .join(' · ');
    const dateValue = dateKind === 'added' ? episode.dateadded : episode.lastplayed;
    const href =
      episodeid !== null && tvshowid !== null && season !== null
        ? buildVideoRoute({ kind: 'videoEpisodeDetail', tvshowid, season, episodeid })
        : null;

    return {
      key: `episode:${episodeid ?? 'missing'}:${index}`,
      label,
      subtitle: subtitle || null,
      href,
      dateLabel: formatDateLabel(dateKind, dateValue),
      badges: [
        ...buildBadges(episode),
        ...(href === null ? [i18n.t('video.recent.routeUnavailable')] : [])
      ],
      artworkClass: artworkClass(episode),
      initials: initialsFor(label, 'E')
    };
  }

  function buildBadges(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): string[] {
    return [
      isWatched(item) ? i18n.t('video.movie.watched') : null,
      hasResume(item) ? i18n.t('video.movie.resumeAvailable') : null,
      ...artworkBadges(item)
    ].filter((badge): badge is string => badge !== null);
  }

  function artworkBadges(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): string[] {
    const safeKeys = safeArtworkKeys(item);
    const badges: string[] = [];

    if (safeKeys.has('poster')) {
      badges.push(i18n.t('video.artwork.posterAvailable'));
    }

    if (safeKeys.has('fanart')) {
      badges.push(i18n.t('video.artwork.fanartMetadataAvailable'));
    }

    if (safeKeys.has('thumb')) {
      badges.push(i18n.t('video.artwork.thumbnailMetadataAvailable'));
    }

    if (safeKeys.size > 0 && badges.length === 0) {
      badges.push(i18n.t('video.artwork.metadataAvailable'));
    }

    if (safeKeys.size === 0) {
      badges.push(i18n.t('video.artwork.pending'));
    }

    return badges;
  }

  function safeArtworkKeys(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): Set<string> {
    const keys = new Set<string>();

    if (isSafeArtworkReference(item.thumbnail)) {
      keys.add('thumb');
    }

    if (isSafeArtworkReference(item.fanart)) {
      keys.add('fanart');
    }

    if (item.art) {
      for (const [key, value] of Object.entries(item.art)) {
        if (/^(poster|fanart|thumb|banner)$/i.test(key) && isSafeArtworkReference(value)) {
          keys.add(key.toLowerCase());
        }
      }
    }

    return keys;
  }

  function artworkClass(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): string {
    const keys = safeArtworkKeys(item);

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

  function formatStatus(value: VideoLibraryStoreSnapshot): string {
    if (value.refreshStatus === 'loading') {
      return i18n.t('video.recent.status.loading', {
        reason: formatReason(value.lastRefreshReason)
      });
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    const count =
      value.recentlyAddedMovies.length +
      value.recentlyPlayedMovies.length +
      value.recentlyAddedEpisodes.length +
      value.recentlyPlayedEpisodes.length;
    const updated = textOrNull(value.lastUpdatedAt);
    const updatedCopy = updated ? i18n.t('video.recent.status.updated', { updated }) : '';

    return i18n.t('video.recent.status.showing', {
      count,
      itemWord:
        count === 1 ? i18n.t('video.recent.status.item') : i18n.t('video.recent.status.items'),
      updated: updatedCopy
    });
  }

  function totalFor(
    value: VideoLibraryStoreSnapshot,
    key: RecentSectionKey,
    fallback: number
  ): number {
    const total = value.limits?.[key]?.total;
    return typeof total === 'number' && Number.isFinite(total) ? total : fallback;
  }

  function formatReason(reason: string): string {
    if (reason.startsWith('notification:')) {
      return i18n.t('video.common.notificationReason', {
        reason: sanitizeUiText(reason.slice('notification:'.length))
      });
    }

    if (reason.startsWith('command:')) {
      return i18n.t('video.common.commandReason', {
        reason: sanitizeUiText(reason.slice('command:'.length))
      });
    }

    if (reason.startsWith('error:')) {
      return i18n.t('video.common.errorReason', {
        reason: sanitizeUiText(reason.slice('error:'.length))
      });
    }

    return sanitizeUiText(reason);
  }

  function safeTitle(primary: unknown, fallback: unknown, emptyFallback: string): string {
    return textOrNull(primary) ?? textOrNull(fallback) ?? emptyFallback;
  }

  function formatDateLabel(kind: 'added' | 'played', value: unknown): string | null {
    const text = textOrNull(value);
    if (!text) {
      return null;
    }

    return i18n.t(kind === 'added' ? 'video.recent.date.added' : 'video.recent.date.played', {
      date: text
    });
  }

  function formatEpisodeNumber(season: unknown, episode: unknown): string | null {
    const seasonNumber = nonNegativeIntegerOrNull(season);
    const episodeNumber = nonNegativeIntegerOrNull(episode);

    if (seasonNumber === null || episodeNumber === null) {
      return null;
    }

    return i18n.t('video.recent.episodeNumber', { season: seasonNumber, episode: episodeNumber });
  }

  function formatYear(value: unknown): string | null {
    const number = finiteNumberOrNull(value);
    return number === null ? null : String(Math.trunc(number));
  }

  function formatDuration(value: unknown): string | null {
    const number = finiteNumberOrNull(value);
    if (number === null) {
      return null;
    }

    const safeSeconds = Math.max(0, Math.floor(number));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
    }

    return `${minutes}:${pad2(seconds)}`;
  }

  function isWatched(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): boolean {
    return item.watched === true || (finiteNumberOrNull(item.playcount) ?? 0) > 0;
  }

  function hasResume(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): boolean {
    const position = finiteNumberOrNull(item.resume?.position);
    const total = finiteNumberOrNull(item.resume?.total);
    return position !== null && total !== null && total > 0 && position > 0;
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

  function isSafeArtworkReference(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0 && !looksLikePathOrUrl(value);
  }

  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/|image:\/\/|special:\/\/|file:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }

  function sanitizeUiText(value: string): string {
    return value
      .replace(/raw response body/gi, 'response body [redacted]')
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[url]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/image:\/\/[^\s]+/gi, '[artwork]')
      .replace(/special:\/\/[^\s]+/gi, '[path]')
      .replace(/file:\/\/[^\s]+/gi, '[path]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/sentinel_secret/gi, '[redacted-secret]')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/password/gi, 'credentials')
      .replace(/localStorage|sessionStorage/gi, 'browser storage');
  }

  function positiveSafeIntegerOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  function nonNegativeIntegerOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  function finiteNumberOrNull(value: unknown): number | null {
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

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="video-recent-panel surface" aria-labelledby="video-recent-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('video.recent.kicker')}</p>
    <h2 id="video-recent-title">{i18n.t('video.recent.title')}</h2>
    <p class="summary-line">
      {i18n.t('video.recent.description')}
    </p>
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>

  {#if isLoading}
    <p class="state-copy">{i18n.t('video.recent.loadingLists')}</p>
  {/if}

  <div class="recent-grid" aria-label={i18n.t('video.recent.sectionsAria')}>
    {#each sections as section (section.key)}
      <section class="recent-section" aria-labelledby={`video-recent-${section.key}`}>
        <div class="section-heading">
          <h3 id={`video-recent-${section.key}`}>{section.title}</h3>
          <p>
            {i18n.t('video.recent.countOf', { count: section.items.length, total: section.total })}
          </p>
        </div>

        {#if section.items.length === 0}
          <p class="empty-copy">{section.emptyCopy}</p>
        {:else}
          <ul class="recent-list" aria-label={section.title}>
            {#each section.items as item (item.key)}
              <li class={`recent-card ${item.artworkClass}`}>
                <div class="fanart-wash" aria-hidden="true"></div>
                <div
                  class={`poster-frame ${item.artworkClass}`}
                  aria-label={i18n.t('video.recent.artworkAvailability', { label: item.label })}
                >
                  <span class="fallback-initials" aria-hidden="true">{item.initials}</span>
                  <span class="artwork-copy">
                    {item.artworkClass === 'no-artwork'
                      ? i18n.t('video.artwork.pending')
                      : i18n.t('video.recent.posterFrame')}
                  </span>
                  {#if item.artworkClass === 'has-fanart'}
                    <span class="artwork-copy muted">{i18n.t('video.recent.fanartWash')}</span>
                  {/if}
                </div>
                <div class="card-copy">
                  {#if item.href}
                    <a class="recent-link" href={item.href}>{item.label}</a>
                  {:else}
                    <span class="recent-title">{item.label}</span>
                  {/if}

                  {#if item.subtitle}
                    <p class="item-meta">{item.subtitle}</p>
                  {/if}

                  {#if item.dateLabel}
                    <p class="item-meta">{item.dateLabel}</p>
                  {/if}

                  {#if item.badges.length > 0}
                    <div class="badge-list" aria-label={i18n.t('video.recent.metadataAria')}>
                      {#each item.badges as badge (badge)}
                        <span class="badge">{badge}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  </div>
</section>
