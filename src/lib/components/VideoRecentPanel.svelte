<script lang="ts">
  import type {
    VideoEpisodeSnapshot,
    VideoLibraryMovieSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import { buildVideoRoute } from '$lib/video/videoRouter';

  interface Props {
    snapshot: VideoLibraryStoreSnapshot;
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

  let { snapshot }: Props = $props();

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const statusText = $derived(formatStatus(snapshot));
  const sections = $derived(buildSections(snapshot));

  function buildSections(value: VideoLibraryStoreSnapshot): RecentSection[] {
    return [
      {
        key: 'recentlyAddedMovies',
        title: 'Recently added movies',
        emptyCopy: 'No recently added movies in this snapshot.',
        total: totalFor(value, 'recentlyAddedMovies', value.recentlyAddedMovies.length),
        items: value.recentlyAddedMovies.map((movie, index) => movieCard(movie, index, 'added'))
      },
      {
        key: 'recentlyPlayedMovies',
        title: 'Recently played movies',
        emptyCopy: 'No recently played movies in this snapshot.',
        total: totalFor(value, 'recentlyPlayedMovies', value.recentlyPlayedMovies.length),
        items: value.recentlyPlayedMovies.map((movie, index) => movieCard(movie, index, 'played'))
      },
      {
        key: 'recentlyAddedEpisodes',
        title: 'Recently added episodes',
        emptyCopy: 'No recently added episodes in this snapshot.',
        total: totalFor(value, 'recentlyAddedEpisodes', value.recentlyAddedEpisodes.length),
        items: value.recentlyAddedEpisodes.map((episode, index) =>
          episodeCard(episode, index, 'added')
        )
      },
      {
        key: 'recentlyPlayedEpisodes',
        title: 'Recently played episodes',
        emptyCopy: 'No recently played episodes in this snapshot.',
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
    const label = safeTitle(movie.title, movie.label, 'Unknown movie');
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
    const label = safeTitle(episode.title, episode.label, 'Unknown episode');
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
      badges: [...buildBadges(episode), ...(href === null ? ['Route unavailable'] : [])],
      artworkClass: artworkClass(episode),
      initials: initialsFor(label, 'E')
    };
  }

  function buildBadges(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): string[] {
    return [
      isWatched(item) ? 'Watched' : null,
      hasResume(item) ? 'Resume available' : null,
      ...artworkBadges(item)
    ].filter((badge): badge is string => badge !== null);
  }

  function artworkBadges(item: VideoLibraryMovieSnapshot | VideoEpisodeSnapshot): string[] {
    const safeKeys = safeArtworkKeys(item);
    const badges: string[] = [];

    if (safeKeys.has('poster')) {
      badges.push('Poster artwork available');
    }

    if (safeKeys.has('fanart')) {
      badges.push('Fanart metadata available');
    }

    if (safeKeys.has('thumb')) {
      badges.push('Thumbnail metadata available');
    }

    if (safeKeys.size > 0 && badges.length === 0) {
      badges.push('Artwork metadata available');
    }

    if (safeKeys.size === 0) {
      badges.push('Artwork pending');
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
      return `Loading recent video from ${formatReason(value.lastRefreshReason)}.`;
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
    const updatedCopy = updated ? ` Last updated ${updated}.` : '';

    return `Showing ${count} recent video ${count === 1 ? 'item' : 'items'}.${updatedCopy}`;
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

  function safeTitle(primary: unknown, fallback: unknown, emptyFallback: string): string {
    return textOrNull(primary) ?? textOrNull(fallback) ?? emptyFallback;
  }

  function formatDateLabel(kind: 'added' | 'played', value: unknown): string | null {
    const text = textOrNull(value);
    if (!text) {
      return null;
    }

    return `${kind === 'added' ? 'Added' : 'Played'} ${text}`;
  }

  function formatEpisodeNumber(season: unknown, episode: unknown): string | null {
    const seasonNumber = nonNegativeIntegerOrNull(season);
    const episodeNumber = nonNegativeIntegerOrNull(episode);

    if (seasonNumber === null || episodeNumber === null) {
      return null;
    }

    return `S${seasonNumber}:E${episodeNumber}`;
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
    <p class="section-kicker">Video Library</p>
    <h2 id="video-recent-title">Recent Video</h2>
    <p class="summary-line">
      Browse recent movie and episode snapshots without exposing raw Kodi artwork paths.
    </p>
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>

  {#if isLoading}
    <p class="state-copy">Loading recent video lists…</p>
  {/if}

  <div class="recent-grid" aria-label="Recent video sections">
    {#each sections as section (section.key)}
      <section class="recent-section" aria-labelledby={`video-recent-${section.key}`}>
        <div class="section-heading">
          <h3 id={`video-recent-${section.key}`}>{section.title}</h3>
          <p>{section.items.length} of {section.total}</p>
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
                  aria-label={`${item.label} artwork availability`}
                >
                  <span class="fallback-initials" aria-hidden="true">{item.initials}</span>
                  <span class="artwork-copy">
                    {item.artworkClass === 'no-artwork' ? 'Artwork pending' : 'Poster frame'}
                  </span>
                  {#if item.artworkClass === 'has-fanart'}
                    <span class="artwork-copy muted">Fanart wash</span>
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
                    <div class="badge-list" aria-label="Recent video metadata">
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

<style>
  .video-recent-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
    overflow: hidden;
  }

  .panel-heading,
  .recent-section,
  .card-copy {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  h3,
  p,
  ul {
    margin: 0;
  }

  .section-kicker,
  .section-heading p {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    line-height: 1.05;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }

  h3 {
    font-size: 1.02rem;
    line-height: 1.15;
    text-wrap: balance;
  }

  .summary-line,
  .state-copy,
  .empty-copy,
  .item-meta,
  .section-heading p {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent),
      color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .recent-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .recent-section {
    min-width: 0;
    padding: var(--space-md);
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--color-accent) 12%, transparent),
        transparent 46%
      ),
      color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .section-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
    align-items: baseline;
  }

  .recent-list {
    display: grid;
    gap: var(--space-xs);
    padding: 0;
    list-style: none;
  }

  .recent-card {
    position: relative;
    display: grid;
    grid-template-columns: 4.25rem minmax(0, 1fr);
    gap: var(--space-sm);
    align-items: center;
    min-width: 0;
    min-height: 5.5rem;
    padding: var(--space-sm);
    overflow: hidden;
    background: color-mix(in srgb, var(--color-surface) 70%, transparent);
    border-radius: var(--radius-lg);
    box-shadow:
      0 10px 24px color-mix(in srgb, black 8%, transparent),
      inset 0 0 0 1px color-mix(in srgb, var(--color-border) 72%, transparent);
    transition-property: box-shadow, transform;
    transition-duration: 160ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }

  .recent-card:hover {
    transform: translateY(-1px);
    box-shadow:
      0 14px 30px color-mix(in srgb, black 12%, transparent),
      inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
  }

  .fanart-wash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 18% 12%,
        color-mix(in srgb, var(--color-accent) 22%, transparent),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        transparent,
        color-mix(in srgb, var(--color-surface) 64%, transparent)
      );
    opacity: 0.62;
    pointer-events: none;
  }

  .recent-card.no-artwork .fanart-wash {
    opacity: 0.32;
  }

  .poster-frame,
  .card-copy {
    position: relative;
    z-index: 1;
  }

  .poster-frame {
    display: grid;
    place-items: center;
    min-height: 4.75rem;
    padding: 0.35rem;
    overflow: hidden;
    text-align: center;
    aspect-ratio: 2 / 3;
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--color-accent) 24%, transparent),
      color-mix(in srgb, var(--color-surface-raised) 86%, transparent)
    );
    border-radius: var(--radius-md);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, white 14%, transparent),
      inset 0 0 0 2px color-mix(in srgb, var(--color-border) 72%, transparent);
  }

  .poster-frame.has-fanart {
    background:
      radial-gradient(
        circle at 26% 18%,
        color-mix(in srgb, var(--color-accent) 70%, white),
        transparent 26%
      ),
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-accent) 28%, transparent),
        var(--color-surface)
      );
  }

  .poster-frame.has-poster,
  .poster-frame.has-thumb {
    background:
      linear-gradient(
        160deg,
        color-mix(in srgb, var(--color-accent) 34%, transparent),
        transparent 48%
      ),
      color-mix(in srgb, var(--color-surface-raised) 82%, transparent);
  }

  .poster-frame.no-artwork {
    background:
      repeating-linear-gradient(
        -35deg,
        color-mix(in srgb, var(--color-border) 30%, transparent) 0 1px,
        transparent 1px 10px
      ),
      color-mix(in srgb, var(--color-surface) 84%, transparent);
  }

  .fallback-initials {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
    font-weight: 900;
    letter-spacing: -0.08em;
    opacity: 0.86;
  }

  .artwork-copy {
    max-width: 100%;
    padding: 0.14rem 0.34rem;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.55rem;
    font-weight: 850;
    line-height: 1;
    text-transform: uppercase;
    background: color-mix(in srgb, var(--color-surface) 72%, transparent);
    border-radius: var(--radius-pill);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 74%, transparent);
  }

  .artwork-copy.muted {
    color: var(--color-text-muted);
  }

  .recent-link,
  .recent-title {
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

  .recent-link:hover {
    color: var(--color-accent);
  }

  .recent-link:active {
    scale: 0.96;
  }

  .recent-link:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-ring);
  }

  .badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem;
    padding: 0.18rem 0.55rem;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.74rem;
    font-weight: 800;
    line-height: 1;
    background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-raised));
    border-radius: var(--radius-pill);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, var(--color-border));
  }

  @media (max-width: 980px) {
    .recent-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .section-heading,
    .recent-card {
      grid-template-columns: 1fr;
    }

    .poster-frame {
      width: 4.25rem;
    }
  }
</style>
