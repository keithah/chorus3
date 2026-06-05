<script lang="ts">
  import './musicLibraryPanelClassic.css';
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import type {
    MusicLibraryAlbumSnapshot,
    MusicLibraryArtistSnapshot,
    MusicLibraryGenreSnapshot,
    MusicLibraryLimitsSnapshot,
    MusicLibrarySongSnapshot,
    MusicLibraryStoreSnapshot
  } from '$lib/stores/musicLibrary.svelte';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';

  interface Props {
    snapshot: MusicLibraryStoreSnapshot;
    onRefresh?: () => Promise<void> | void;
    i18n?: TranslationContext;
  }

  type ListKind = 'artists' | 'albums' | 'songs' | 'genres';
  type DiscoveryListKind = 'recentlyAddedSongs' | 'recentlyPlayedSongs' | 'mostPlayedSongs';
  type DiscoveryMetadataKind = 'recentlyAdded' | 'recentlyPlayed' | 'mostPlayed';

  let { snapshot, onRefresh, i18n = createTranslationContext('en') }: Props = $props();
  let isRefreshing = $state(false);
  const artistVisibility = createIncrementalVisibility(150);
  const albumVisibility = createIncrementalVisibility(150);
  const songVisibility = createIncrementalVisibility(150);
  const genreVisibility = createIncrementalVisibility(150);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const refreshDisabled = $derived(isLoading || isRefreshing);
  const statusText = $derived(formatStatus(snapshot, isRefreshing));
  const visibleArtists = $derived(artistVisibility.visibleItems(snapshot.artists));
  const visibleAlbums = $derived(albumVisibility.visibleItems(snapshot.albums));
  const visibleSongs = $derived(songVisibility.visibleItems(snapshot.songs));
  const visibleGenres = $derived(genreVisibility.visibleItems(snapshot.genres));

  async function handleRefresh(): Promise<void> {
    if (!onRefresh || refreshDisabled) {
      return;
    }

    try {
      isRefreshing = true;
      await onRefresh();
    } finally {
      isRefreshing = false;
    }
  }

  function formatStatus(value: MusicLibraryStoreSnapshot, callbackRunning: boolean): string {
    if (callbackRunning) {
      return i18n.t('music.library.status.refreshRequested');
    }

    if (value.refreshStatus === 'loading') {
      return i18n.t('music.library.status.refreshing', {
        reason: formatReason(value.lastRefreshReason)
      });
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.isEmpty) {
      return i18n.t('music.library.status.empty');
    }

    const updated = textOrNull(value.lastUpdatedAt);
    return updated
      ? i18n.t('music.library.status.readyUpdated', { updated })
      : i18n.t('music.library.status.ready');
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

  function countSummary(kind: ListKind, count: number): string {
    const limits = snapshot.limits[kind];
    return i18n.t('media.count.of', { count, total: formatTotal(limits, count) });
  }

  function formatTotal(limits: MusicLibraryLimitsSnapshot | undefined, fallback: number): number {
    return typeof limits?.total === 'number' && Number.isFinite(limits.total)
      ? limits.total
      : fallback;
  }

  function sectionEmptyCopy(kind: ListKind): string {
    switch (kind) {
      case 'artists':
        return i18n.t('music.library.empty.artists');
      case 'albums':
        return i18n.t('music.library.empty.albums');
      case 'songs':
        return i18n.t('music.library.empty.songs');
      case 'genres':
        return i18n.t('music.library.empty.genres');
    }
  }

  function discoveryCountSummary(kind: DiscoveryListKind, count: number): string {
    const limits = snapshot.limits[kind];
    return i18n.t('media.count.of', { count, total: formatTotal(limits, count) });
  }

  function discoveryEmptyCopy(kind: DiscoveryListKind): string {
    switch (kind) {
      case 'recentlyAddedSongs':
        return i18n.t('music.library.empty.recentlyAdded');
      case 'recentlyPlayedSongs':
        return i18n.t('music.library.empty.recentlyPlayed');
      case 'mostPlayedSongs':
        return i18n.t('music.library.empty.mostPlayed');
    }
  }

  function formatDiscoveryMeta(
    song: MusicLibrarySongSnapshot,
    kind: DiscoveryMetadataKind
  ): string {
    const values = [
      joinText(song.artist),
      textOrNull(song.album),
      discoveryPrimaryMeta(song, kind)
    ];
    return values.filter(Boolean).join(' · ');
  }

  function discoveryPrimaryMeta(
    song: MusicLibrarySongSnapshot,
    kind: DiscoveryMetadataKind
  ): string | null {
    if (kind === 'recentlyAdded') {
      const dateadded = textOrNull(song.dateadded);
      return dateadded ? i18n.t('music.library.meta.added', { date: dateadded }) : null;
    }

    if (kind === 'recentlyPlayed') {
      const lastplayed = textOrNull(song.lastplayed);
      return lastplayed ? i18n.t('music.library.meta.playedAt', { date: lastplayed }) : null;
    }

    return formatPlaycount(song.playcount);
  }

  function displayText(value: unknown, fallback: string): string {
    return textOrNull(value) ?? fallback;
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

  function joinText(values: unknown): string | null {
    if (Array.isArray(values)) {
      const joined = values
        .map((entry) => textOrNull(entry))
        .filter((entry): entry is string => Boolean(entry))
        .join(', ');
      return joined || null;
    }

    return textOrNull(values);
  }

  function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

  function formatYear(value: unknown): string | null {
    const year = numberOrNull(value);
    return year === null ? null : String(Math.trunc(year));
  }

  function formatTrack(value: unknown): string | null {
    const track = numberOrNull(value);
    return track === null ? null : i18n.t('media.meta.track', { track: Math.trunc(track) });
  }

  function formatPlaycount(value: unknown): string | null {
    const playcount = numberOrNull(value);
    if (playcount === null) {
      return null;
    }

    const rounded = Math.max(0, Math.trunc(playcount));
    return rounded === 1
      ? i18n.t('media.meta.playedOnce')
      : i18n.t('media.meta.playedTimes', { count: rounded });
  }

  function safeArtistLabel(artist: MusicLibraryArtistSnapshot): string {
    return displayText(artist.label, i18n.t('media.unknown.artist'));
  }

  function safeAlbumLabel(album: MusicLibraryAlbumSnapshot): string {
    return displayText(album.title ?? album.label, i18n.t('media.unknown.album'));
  }

  function safeSongLabel(song: MusicLibrarySongSnapshot): string {
    return displayText(song.title ?? song.label, i18n.t('media.unknown.song'));
  }

  function safeGenreLabel(genre: MusicLibraryGenreSnapshot): string {
    return displayText(genre.title ?? genre.label, i18n.t('media.unknown.genre'));
  }

  function sanitizeUiText(value: string): string {
    return value
      .replace(/raw response body/gi, 'response body [redacted]')
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[url]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/username or password/gi, 'credentials')
      .replace(/localStorage/gi, 'browser storage');
  }

  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="music-library-panel surface" aria-labelledby="music-library-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('music.library.kicker')}</p>
    <h2 id="music-library-title">{i18n.t('music.library.title')}</h2>
    <p class="summary-line">{i18n.t('music.library.description')}</p>
  </div>

  <div class="toolbar">
    <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>
    {#if onRefresh}
      <button
        type="button"
        class="refresh-button"
        aria-label={i18n.t('music.library.refresh')}
        disabled={refreshDisabled}
        onclick={handleRefresh}
      >
        {i18n.t('music.library.refresh')}
      </button>
    {/if}
  </div>

  {#if isLoading}
    <p class="state-copy">{i18n.t('music.library.state.loading')}</p>
  {:else if snapshot.isEmpty}
    <p class="state-copy">{i18n.t('music.library.state.empty')}</p>
  {/if}

  <div class="library-grid">
    <section class="library-section" aria-labelledby="music-library-artists-title">
      <div class="section-heading">
        <h3 id="music-library-artists-title">{i18n.t('media.heading.artists')}</h3>
        <p>{countSummary('artists', snapshot.artists.length)}</p>
      </div>
      {#if snapshot.artists.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('artists')}</p>
      {:else}
        <ul>
          {#each visibleArtists as artist (artist.artistid)}
            <li>
              <span class="item-title">{safeArtistLabel(artist)}</span>
              {#if joinText(artist.genre)}
                <span class="item-meta">{joinText(artist.genre)}</span>
              {/if}
            </li>
          {/each}
        </ul>
        {#if artistVisibility.hasMore(snapshot.artists.length)}
          <button type="button" class="show-more-button" onclick={artistVisibility.showMore}>
            Show more artists
          </button>
        {/if}
      {/if}
    </section>

    <section class="library-section" aria-labelledby="music-library-albums-title">
      <div class="section-heading">
        <h3 id="music-library-albums-title">{i18n.t('media.heading.albums')}</h3>
        <p>{countSummary('albums', snapshot.albums.length)}</p>
      </div>
      {#if snapshot.albums.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('albums')}</p>
      {:else}
        <ul>
          {#each visibleAlbums as album (album.albumid)}
            <li>
              <span class="item-title">{safeAlbumLabel(album)}</span>
              <span class="item-meta">
                {[joinText(album.artist), formatYear(album.year)].filter(Boolean).join(' · ')}
              </span>
            </li>
          {/each}
        </ul>
        {#if albumVisibility.hasMore(snapshot.albums.length)}
          <button type="button" class="show-more-button" onclick={albumVisibility.showMore}>
            Show more albums
          </button>
        {/if}
      {/if}
    </section>

    <section class="library-section" aria-labelledby="music-library-songs-title">
      <div class="section-heading">
        <h3 id="music-library-songs-title">{i18n.t('media.heading.songs')}</h3>
        <p>{countSummary('songs', snapshot.songs.length)}</p>
      </div>
      {#if snapshot.songs.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('songs')}</p>
      {:else}
        <ul>
          {#each visibleSongs as song (song.songid)}
            <li>
              <span class="item-title">{safeSongLabel(song)}</span>
              <span class="item-meta">
                {[
                  joinText(song.artist),
                  textOrNull(song.album),
                  formatDuration(song.duration),
                  formatTrack(song.track),
                  formatPlaycount(song.playcount)
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </li>
          {/each}
        </ul>
        {#if songVisibility.hasMore(snapshot.songs.length)}
          <button type="button" class="show-more-button" onclick={songVisibility.showMore}>
            Show more songs
          </button>
        {/if}
      {/if}
    </section>

    <section class="library-section" aria-labelledby="music-library-genres-title">
      <div class="section-heading">
        <h3 id="music-library-genres-title">{i18n.t('media.heading.genres')}</h3>
        <p>{countSummary('genres', snapshot.genres.length)}</p>
      </div>
      {#if snapshot.genres.length === 0}
        <p class="empty-copy">{sectionEmptyCopy('genres')}</p>
      {:else}
        <ul>
          {#each visibleGenres as genre (genre.genreid)}
            <li>
              <span class="item-title">{safeGenreLabel(genre)}</span>
            </li>
          {/each}
        </ul>
        {#if genreVisibility.hasMore(snapshot.genres.length)}
          <button type="button" class="show-more-button" onclick={genreVisibility.showMore}>
            Show more genres
          </button>
        {/if}
      {/if}
    </section>
  </div>

  <section class="discovery-section" aria-labelledby="music-library-discovery-title">
    <div class="panel-heading">
      <p class="section-kicker">{i18n.t('music.library.discoveryKicker')}</p>
      <h3 id="music-library-discovery-title">{i18n.t('music.library.discoveryTitle')}</h3>
      <p class="summary-line">{i18n.t('music.library.discoveryDescription')}</p>
    </div>

    <div class="discovery-grid">
      <section class="library-section" aria-labelledby="music-library-recently-added-title">
        <div class="section-heading">
          <h4 id="music-library-recently-added-title">{i18n.t('music.library.recentlyAdded')}</h4>
          <p>{discoveryCountSummary('recentlyAddedSongs', snapshot.recentlyAddedSongs.length)}</p>
        </div>
        {#if snapshot.recentlyAddedSongs.length === 0}
          <p class="empty-copy">{discoveryEmptyCopy('recentlyAddedSongs')}</p>
        {:else}
          <ul>
            {#each snapshot.recentlyAddedSongs as song (song.songid)}
              <li>
                <span class="item-title">{safeSongLabel(song)}</span>
                {#if formatDiscoveryMeta(song, 'recentlyAdded')}
                  <span class="item-meta">{formatDiscoveryMeta(song, 'recentlyAdded')}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="library-section" aria-labelledby="music-library-recently-played-title">
        <div class="section-heading">
          <h4 id="music-library-recently-played-title">{i18n.t('music.library.recentlyPlayed')}</h4>
          <p>{discoveryCountSummary('recentlyPlayedSongs', snapshot.recentlyPlayedSongs.length)}</p>
        </div>
        {#if snapshot.recentlyPlayedSongs.length === 0}
          <p class="empty-copy">{discoveryEmptyCopy('recentlyPlayedSongs')}</p>
        {:else}
          <ul>
            {#each snapshot.recentlyPlayedSongs as song (song.songid)}
              <li>
                <span class="item-title">{safeSongLabel(song)}</span>
                {#if formatDiscoveryMeta(song, 'recentlyPlayed')}
                  <span class="item-meta">{formatDiscoveryMeta(song, 'recentlyPlayed')}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="library-section" aria-labelledby="music-library-most-played-title">
        <div class="section-heading">
          <h4 id="music-library-most-played-title">{i18n.t('music.library.mostPlayed')}</h4>
          <p>{discoveryCountSummary('mostPlayedSongs', snapshot.mostPlayedSongs.length)}</p>
        </div>
        {#if snapshot.mostPlayedSongs.length === 0}
          <p class="empty-copy">{discoveryEmptyCopy('mostPlayedSongs')}</p>
        {:else}
          <ul>
            {#each snapshot.mostPlayedSongs as song (song.songid)}
              <li>
                <span class="item-title">{safeSongLabel(song)}</span>
                {#if formatDiscoveryMeta(song, 'mostPlayed')}
                  <span class="item-meta">{formatDiscoveryMeta(song, 'mostPlayed')}</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  </section>
</section>
