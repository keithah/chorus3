<script lang="ts">
  import MusicDetailShell from '$components/MusicDetailShell.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import { firstOptionalKodiImageUrl, optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import {
    albumCards,
    artistCards,
    songCards,
    type LibraryCard
  } from '$lib/app-pages/libraryCards';
  import type {
    MusicLibraryAlbumSnapshot,
    MusicLibraryArtistSnapshot,
    MusicLibrarySongSnapshot,
    MusicLibraryStoreSnapshot
  } from '$lib/stores/musicLibrary.svelte';
  import type { MusicDetailRouteSnapshot } from '$lib/stores/musicDetailRouteStore.svelte';

  type Card = LibraryCard;
  type DetailRow = { label: string; value: string };

  interface Props {
    route: Extract<PrimaryRoute, { kind: 'musicAlbumDetail' | 'musicArtistDetail' }>;
    musicLibrarySnapshot: MusicLibraryStoreSnapshot;
    detailSnapshot: MusicDetailRouteSnapshot;
    detailDispatch: {
      loadAlbum(albumid: number): Promise<void> | void;
      loadArtist(artistid: number): Promise<void> | void;
    };
    filterAlbums: (items: readonly MusicLibraryAlbumSnapshot[]) => MusicLibraryAlbumSnapshot[];
    filterSongs: (items: readonly MusicLibrarySongSnapshot[]) => MusicLibrarySongSnapshot[];
    onPlayCard: (card: Card) => Promise<void> | void;
    onQueueCard: (card: Card) => Promise<void> | void;
    onStreamCard: (card: Card) => Promise<void> | void;
    onAddToPlaylist: (card: Card) => Promise<void> | void;
    onToggleThumbsUp: (card: Card) => Promise<void> | void;
    onEdit: (card: Card) => Promise<void> | void;
    isThumbedUp: (card: Card) => boolean;
    cardHref: (card: Card) => string | null | undefined;
  }

  let {
    route,
    musicLibrarySnapshot,
    detailSnapshot,
    detailDispatch,
    filterAlbums,
    filterSongs,
    onPlayCard,
    onQueueCard,
    onStreamCard,
    onAddToPlaylist,
    onToggleThumbsUp,
    onEdit,
    isThumbedUp,
    cardHref
  }: Props = $props();

  const music = $derived(musicLibrarySnapshot);

  $effect(() => {
    if (route.kind !== 'musicAlbumDetail') return;
    const albumid = Number(route.albumid);
    if (Number.isSafeInteger(albumid) && albumid > 0) {
      void detailDispatch.loadAlbum(albumid);
    }
  });

  $effect(() => {
    if (route.kind !== 'musicArtistDetail') return;
    const artistid = Number(route.artistid);
    if (Number.isSafeInteger(artistid) && artistid > 0) {
      void detailDispatch.loadArtist(artistid);
    }
  });

  const albumDetail = $derived.by(() => {
    if (route.kind !== 'musicAlbumDetail') return null;
    const albumid = Number(route.albumid);
    const loadedAlbum = detailSnapshot.albumDetails[albumid];
    const loadedSongs = detailSnapshot.albumSongs[albumid];
    const album =
      (loadedAlbum?.status === 'ready' ? loadedAlbum.data : null) ??
      music.albums.find((item) => item.albumid === albumid) ??
      null;
    const albumTitle = album ? safe(album.title ?? album.label, '') : '';
    const songs =
      (loadedSongs?.status === 'ready' ? loadedSongs.data : null) ??
      music.songs.filter((item) => safe(item.album, '') === albumTitle);

    return {
      album,
      songs: filterSongs(songs),
      loading: Boolean(loadedAlbum?.status === 'loading' || loadedSongs?.status === 'loading'),
      missing: loadedAlbum?.status === 'missing',
      empty:
        loadedSongs?.status === 'loading' ? 'Loading songs...' : 'No songs found for this album.'
    };
  });

  const artistDetail = $derived.by(() => {
    if (route.kind !== 'musicArtistDetail') return null;
    const artistid = Number(route.artistid);
    const loadedArtist = detailSnapshot.artistDetails[artistid];
    const artist =
      (loadedArtist?.status === 'ready' ? loadedArtist.data : null) ??
      music.artists.find((item) => item.artistid === artistid) ??
      null;
    const songs = music.songs.filter((item) => hasArtist(item.artist, artist?.label));
    const albums = music.albums.filter((item) => hasArtist(item.artist, artist?.label));

    return {
      artist,
      albums: filterAlbums(albums),
      songs: filterSongs(songs),
      loading: loadedArtist?.status === 'loading',
      missing: loadedArtist?.status === 'missing',
      empty: 'No albums found for this artist.'
    };
  });

  function albumDetailRows(album: MusicLibraryAlbumSnapshot): DetailRow[] {
    return [
      { label: 'Artist', value: album.displayartist || join(album.artist) || '' },
      { label: 'Year', value: typeof album.year === 'number' ? String(album.year) : '' },
      { label: 'Genre', value: join(album.genre) ?? '' },
      { label: 'Style', value: join(album.style) ?? '' },
      { label: 'Mood', value: join(album.mood) ?? '' },
      { label: 'Label', value: safe(album.albumlabel, '') },
      { label: 'Duration', value: formatDuration(album.albumduration) },
      { label: 'Rating', value: formatNumeric(album.rating) },
      { label: 'User rating', value: formatNumeric(album.userrating) },
      { label: 'Votes', value: safe(album.votes, '') },
      { label: 'Date added', value: safe(album.dateadded, '') },
      { label: 'Play count', value: formatNumeric(album.playcount) }
    ].filter((row) => row.value.length > 0);
  }

  function artistDetailRows(artist: MusicLibraryArtistSnapshot): DetailRow[] {
    return [
      { label: 'Born', value: safe(artist.born, '') },
      { label: 'Formed', value: safe(artist.formed, '') },
      { label: 'Died', value: safe(artist.died, '') },
      { label: 'Years active', value: join(artist.yearsactive) ?? '' },
      { label: 'Genre', value: join(artist.genre) ?? '' },
      { label: 'Style', value: join(artist.style) ?? '' },
      { label: 'Mood', value: join(artist.mood) ?? '' },
      { label: 'Instrument', value: join(artist.instrument) ?? '' }
    ].filter((row) => row.value.length > 0);
  }

  function songDetailTracks(items: readonly MusicLibrarySongSnapshot[]) {
    return items.map((song) => {
      const card = songCards([song])[0];
      return {
        key: `song:${song.songid}`,
        title: safe(song.title ?? song.label, 'Unknown song'),
        track: song.track,
        duration: formatDuration(song.duration),
        ...(card ? { card } : {})
      };
    });
  }

  function hasArtist(value: unknown, expected: string | undefined): boolean {
    if (!expected) return false;
    if (Array.isArray(value)) {
      return value.some((entry) => String(entry).toLowerCase() === expected.toLowerCase());
    }
    return String(value ?? '').toLowerCase() === expected.toLowerCase();
  }

  function formatNumeric(value: unknown): string {
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  }

  function formatDuration(seconds: unknown): string {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return '';

    const rounded = Math.round(seconds);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const remaining = rounded % 60;
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
      : `${minutes}:${String(remaining).padStart(2, '0')}`;
  }

  function join(value: unknown): string | undefined {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ') || undefined;
    if (typeof value === 'string' && value.trim()) return value.trim();
    return undefined;
  }

  function safe(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
</script>

{#if albumDetail}
  {#if albumDetail.album}
    {@const album = albumDetail.album}
    {@const albumCard = albumCards([album])[0]!}
    <MusicDetailShell
      kind="album"
      title={safe(album.title ?? album.label, 'Album')}
      byline={join(album.artist)}
      coverUrl={optionalKodiImageUrl(album.thumbnail)}
      fanartUrl={firstOptionalKodiImageUrl(album.fanart, album.thumbnail)}
      detailRows={albumDetailRows(album)}
      descriptionTitle="Album info"
      description={safe(album.description, '')}
      descriptionFallback="No album description available."
      trackTitle="Tracks"
      tracks={songDetailTracks(albumDetail.songs)}
      trackEmpty="No tracks found for this album."
      loadingTrackEmpty="Loading tracks..."
      loading={albumDetail.loading}
      onPlay={() => onPlayCard(albumCard)}
      onQueue={() => onQueueCard(albumCard)}
      onStream={() => onStreamCard(albumCard)}
      onAddToPlaylist={() => onAddToPlaylist(albumCard)}
      onToggleThumbsUp={() => onToggleThumbsUp(albumCard)}
      onEdit={() => onEdit(albumCard)}
      isThumbedUp={isThumbedUp(albumCard)}
      onPlayTrack={onPlayCard}
      onQueueTrack={onQueueCard}
      {cardHref}
    />
  {:else}
    <p class="classic-empty">
      {albumDetail.loading
        ? 'Loading album...'
        : albumDetail.missing
          ? 'Album not found.'
          : albumDetail.empty}
    </p>
  {/if}
{:else if artistDetail}
  {#if artistDetail.artist}
    {@const artist = artistDetail.artist}
    {@const artistCard = artistCards([artist])[0]!}
    <MusicDetailShell
      kind="artist"
      title={safe(artist.label, 'Artist')}
      coverUrl={optionalKodiImageUrl(artist.thumbnail)}
      fanartUrl={firstOptionalKodiImageUrl(artist.fanart, artist.thumbnail)}
      detailRows={artistDetailRows(artist)}
      descriptionTitle="Biography"
      description={safe(artist.description, '')}
      descriptionFallback="No artist biography available."
      relatedTitle="Albums"
      relatedCards={albumCards(artistDetail.albums)}
      relatedEmpty="No albums found for this artist."
      trackTitle="Songs"
      tracks={songDetailTracks(artistDetail.songs)}
      trackEmpty="No songs found for this artist."
      onPlay={() => onPlayCard(artistCard)}
      onQueue={() => onQueueCard(artistCard)}
      onStream={() => onStreamCard(artistCard)}
      onAddToPlaylist={() => onAddToPlaylist(artistCard)}
      onToggleThumbsUp={() => onToggleThumbsUp(artistCard)}
      onEdit={() => onEdit(artistCard)}
      isThumbedUp={isThumbedUp(artistCard)}
      onPlayTrack={onPlayCard}
      onQueueTrack={onQueueCard}
      {cardHref}
    />
  {:else}
    <p class="classic-empty">
      {artistDetail.loading
        ? 'Loading artist...'
        : artistDetail.missing
          ? 'Artist not found.'
          : artistDetail.empty}
    </p>
  {/if}
{/if}
