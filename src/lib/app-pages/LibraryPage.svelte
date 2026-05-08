<script lang="ts">
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import {
    libraryFilterStore,
    type LibraryAvailableFilters,
    type LibraryFilterOption,
    type LibraryParsedFilterField
  } from '$lib/stores/libraryFilter';
  import {
    getAudioLibrarySongs,
    getVideoLibraryEpisodeDetails,
    getVideoLibraryMovieDetails,
    getVideoLibraryMusicVideoDetails
  } from '$lib/kodi';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import { createActiveKodiJsonRpcHttpClient } from '$lib/stores/kodiClient';
  import { configStore } from '$lib/stores/config.svelte';
  import { prepareLocalStreamUrl } from '$lib/stores/localPlayer.svelte';
  import { normalizeMusicSongs } from '$lib/stores/musicLibraryNormalization';
  import { normalizeVideoMusicVideos } from '$lib/stores/videoLibraryNormalization';
  import type {
    LocalPlaylistDispatch,
    LocalPlaylistItemInput,
    LocalPlaylistStoreSnapshot
  } from '$lib/stores/localPlaylist.svelte';
  import type { ThumbsUpDispatch, ThumbsUpItemInput } from '$lib/stores/thumbsUp.svelte';
  import type {
    MusicLibraryAlbumSnapshot,
    MusicLibraryArtistSnapshot,
    MusicLibraryGenreSnapshot,
    MusicLibrarySongSnapshot,
    MusicLibraryStoreSnapshot
  } from '$lib/stores/musicLibrary.svelte';
  import type {
    VideoEpisodeSnapshot,
    VideoLibraryMovieSnapshot,
    VideoMusicVideoSnapshot,
    VideoLibraryStoreSnapshot
  } from '$lib/stores/videoLibrary.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import type {
    EpisodePlaybackItem,
    MoviePlaybackItem,
    MusicVideoPlaybackItem,
    MusicPlaybackItem
  } from '$lib/stores/playerDispatch.svelte';
  import type {
    EpisodeQueueItem,
    MovieQueueItem,
    MusicQueueItem,
    MusicVideoQueueItem
  } from '$lib/stores/queue.svelte';

  interface Props {
    route: PrimaryRoute;
    musicLibrarySnapshot: MusicLibraryStoreSnapshot;
    videoLibrarySnapshot: VideoLibraryStoreSnapshot;
    localPlaylistSnapshot?: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch?: LocalPlaylistDispatch;
    thumbsUpDispatch?: ThumbsUpDispatch;
    playerDispatch: PlayerControlsDispatch & {
      setMode?: (mode: 'kodi' | 'local') => void;
      playMusicItem?: (item: MusicPlaybackItem) => Promise<void> | void;
      playMovieItem?: (item: MoviePlaybackItem) => Promise<void> | void;
      playEpisodeItem?: (item: EpisodePlaybackItem) => Promise<void> | void;
      playMusicVideoItem?: (item: MusicVideoPlaybackItem) => Promise<void> | void;
      streamMovieItem?: (item: MoviePlaybackItem) => Promise<void> | void;
      streamEpisodeItem?: (item: EpisodePlaybackItem) => Promise<void> | void;
      streamMusicVideoItem?: (item: MusicVideoPlaybackItem) => Promise<void> | void;
    };
    queueDispatch: QueuePanelDispatch & {
      queueMusicItem?: (item: MusicQueueItem) => Promise<void> | void;
      queueMovieItem?: (item: MovieQueueItem) => Promise<void> | void;
      queueEpisodeItem?: (item: EpisodeQueueItem) => Promise<void> | void;
      queueMusicVideoItem?: (item: MusicVideoQueueItem) => Promise<void> | void;
    };
    buildOptions?: BuildAppRouteOptions;
  }

  type NavItem = { label: string; route: PrimaryRoute; active: boolean };
  type DetailRow = { label: string; value: string };
  type DownloadableCardAction =
    | { media: 'music'; kind: 'song'; songid: number }
    | { media: 'movie'; movieid: number }
    | { media: 'episode'; episodeid: number }
    | { media: 'musicvideo'; musicvideoid: number };
  type LocalPlaylistCardAction =
    | { media: 'music'; kind: 'artist'; artistid: number }
    | { media: 'music'; kind: 'album'; albumid: number }
    | { media: 'music'; kind: 'song'; songid: number };
  type BrowserPlayableCardAction =
    | { media: 'music'; kind: 'artist'; artistid: number }
    | { media: 'music'; kind: 'album'; albumid: number }
    | { media: 'music'; kind: 'song'; songid: number }
    | { media: 'movie'; movieid: number }
    | { media: 'episode'; episodeid: number }
    | { media: 'musicvideo'; musicvideoid: number };
  type Card =
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'music'; kind: 'artist'; artistid: number };
      }
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'music'; kind: 'album'; albumid: number };
      }
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'music'; kind: 'song'; songid: number };
      }
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'movie'; movieid: number };
      }
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'episode'; episodeid: number };
      }
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'musicvideo'; musicvideoid: number };
      }
    | {
        key: string;
        title: string;
        subtitle?: string;
        thumbnail?: string;
        poster?: boolean;
        route?: PrimaryRoute;
        action?: { media: 'tvshow'; tvshowid: number };
      };
  type Section = {
    title?: string;
    cards: Card[];
    empty: string;
    compact?: boolean;
    detailRows?: DetailRow[];
    description?: string;
    rating?: number;
  };

  let {
    route,
    musicLibrarySnapshot,
    videoLibrarySnapshot,
    localPlaylistSnapshot,
    localPlaylistDispatch,
    thumbsUpDispatch,
    playerDispatch,
    queueDispatch,
    buildOptions = {}
  }: Props = $props();

  let albumSongsByAlbumId = $state<Record<number, MusicLibrarySongSnapshot[]>>({});
  let loadingAlbumSongIds = $state<Record<number, true>>({});
  let musicVideoDetailsById = $state<Record<number, VideoMusicVideoSnapshot>>({});
  let missingMusicVideoDetailIds = $state<Record<number, true>>({});
  let loadingMusicVideoDetailIds = $state<Record<number, true>>({});
  let actionStatus = $state('');
  let pendingDownloadKey = $state<string | null>(null);
  let pendingLocalPlaylistKey = $state<string | null>(null);
  let filterRevision = $state(0);
  let filterPane: 'normal' | 'filters' | 'options' = $state('normal');
  let selectedFilterKey = $state<string | null>(null);
  let optionSearch = $state('');

  const family = $derived(routeFamily(route));
  const navItems = $derived(sectionNav(route));
  const filterPath = $derived(routeFilterPath(route));
  const availableFilters = $derived(availableFiltersForRoute(route));
  const activeFilters = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    return libraryFilterStore.getFilterActive(filterPath);
  });
  const sortableFilters = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    return libraryFilterStore.getSortableEntities(filterPath);
  });
  const filterableFilters = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    return libraryFilterStore.getFilterableEntities(filterPath);
  });
  const selectedFilterOptions = $derived.by(() => {
    void filterRevision;
    ensureFilterAvailable();
    if (!selectedFilterKey) return [];
    return filterOptionsForRoute(
      route,
      selectedFilterKey,
      musicLibrarySnapshot,
      videoLibrarySnapshot
    ).filter((option) => option.title.toLowerCase().includes(optionSearch.trim().toLowerCase()));
  });
  const sections = $derived.by(() => {
    void filterRevision;
    return contentSections(route, musicLibrarySnapshot, videoLibrarySnapshot);
  });

  $effect(() => {
    ensureFilterAvailable();
    if (!availableFilters.filter.includes(selectedFilterKey ?? '')) {
      selectedFilterKey = null;
      filterPane = filterPane === 'options' ? 'normal' : filterPane;
    }
  });

  $effect(() => {
    if (route.kind === 'musicAlbumDetail') {
      const albumid = Number(route.albumid);
      if (Number.isSafeInteger(albumid) && albumid > 0) {
        void loadAlbumSongs(albumid);
      }
    }
  });

  $effect(() => {
    if (route.kind === 'musicVideoDetail') {
      const musicvideoid = Number(route.musicvideoid);
      if (Number.isSafeInteger(musicvideoid) && musicvideoid > 0) {
        void loadMusicVideoDetail(musicvideoid);
      }
    }
  });

  function routeFamily(value: PrimaryRoute): 'music' | 'movies' | 'tv' {
    if (
      value.kind.startsWith('movie') ||
      value.kind === 'movies' ||
      value.kind === 'moviesRecent'
    ) {
      return 'movies';
    }

    if (
      value.kind.startsWith('tvshow') ||
      value.kind === 'tvshows' ||
      value.kind === 'tvshowsRecent'
    ) {
      return 'tv';
    }

    return 'music';
  }

  function sectionNav(value: PrimaryRoute): NavItem[] {
    if (family === 'movies') {
      return [
        { label: 'Movies', route: { kind: 'moviesRecent' }, active: value.kind === 'moviesRecent' },
        {
          label: 'All movies',
          route: { kind: 'movies' },
          active: value.kind === 'movies' || value.kind === 'movieDetail'
        }
      ];
    }

    if (family === 'tv') {
      return [
        {
          label: 'TV shows',
          route: { kind: 'tvshowsRecent' },
          active: value.kind === 'tvshowsRecent'
        },
        {
          label: 'All TV shows',
          route: { kind: 'tvshows' },
          active: value.kind === 'tvshows' || value.kind.startsWith('tvshow')
        }
      ];
    }

    return [
      {
        label: 'Music',
        route: { kind: 'music' },
        active: value.kind === 'music' || value.kind === 'home'
      },
      {
        label: 'Genres',
        route: { kind: 'musicGenres' },
        active: value.kind === 'musicGenres' || value.kind === 'musicGenreDetail'
      },
      { label: 'Top music', route: { kind: 'musicTop' }, active: value.kind === 'musicTop' },
      {
        label: 'Artists',
        route: { kind: 'musicArtists' },
        active: value.kind === 'musicArtists' || value.kind === 'musicArtistDetail'
      },
      {
        label: 'Albums',
        route: { kind: 'musicAlbums' },
        active: value.kind === 'musicAlbums' || value.kind === 'musicAlbumDetail'
      },
      {
        label: 'Videos',
        route: { kind: 'musicVideos' },
        active: value.kind === 'musicVideos' || value.kind === 'musicVideoDetail'
      }
    ];
  }

  function routeFilterPath(value: PrimaryRoute): string {
    switch (value.kind) {
      case 'home':
        return 'music';
      case 'musicAlbumDetail':
        return `music/albums/${value.albumid}`;
      case 'musicArtistDetail':
        return `music/artists/${value.artistid}`;
      case 'musicGenreDetail':
        return `music/genres/${value.genreid}`;
      case 'musicVideoDetail':
        return `music/videos/${value.musicvideoid}`;
      case 'movieDetail':
        return `movies/${value.movieid}`;
      case 'tvshowDetail':
        return `tvshows/${value.tvshowid}`;
      case 'tvshowSeasonDetail':
        return `tvshows/${value.tvshowid}/seasons/${value.season}`;
      case 'tvshowEpisodeDetail':
        return `tvshows/${value.tvshowid}/episodes/${value.episodeid}`;
      default:
        return value.kind;
    }
  }

  function availableFiltersForRoute(value: PrimaryRoute): LibraryAvailableFilters {
    if (value.kind === 'musicArtists') {
      return { sort: ['label', 'random'], filter: ['genre', 'thumbsUp'] };
    }
    if (value.kind === 'musicAlbums' || value.kind === 'music' || value.kind === 'home') {
      return {
        sort: ['title', 'artist', 'year', 'dateadded', 'random'],
        filter: ['artist', 'genre', 'year', 'albumlabel', 'thumbsUp']
      };
    }
    if (
      value.kind === 'musicTop' ||
      value.kind === 'musicAlbumDetail' ||
      value.kind === 'musicArtistDetail'
    ) {
      return {
        sort: ['title', 'artist', 'album', 'year', 'dateadded', 'random'],
        filter: ['artist', 'album', 'genre', 'year', 'thumbsUp']
      };
    }
    if (value.kind === 'musicVideos' || value.kind === 'musicVideoDetail') {
      return {
        sort: ['title', 'artist', 'album', 'year', 'dateadded', 'random'],
        filter: ['artist', 'album', 'genre', 'year', 'director', 'studio', 'tag', 'thumbsUp']
      };
    }
    if (value.kind === 'movies' || value.kind === 'moviesRecent' || value.kind === 'movieDetail') {
      return {
        sort: ['title', 'year', 'dateadded', 'rating', 'random'],
        filter: [
          'year',
          'genre',
          'watched',
          'unwatched',
          'inprogress',
          'director',
          'tag',
          'cast',
          'mpaa',
          'studio',
          'thumbsUp'
        ]
      };
    }
    if (value.kind.startsWith('tvshow')) {
      return {
        sort: ['title', 'year', 'dateadded', 'rating', 'random'],
        filter: [
          'year',
          'genre',
          'watched',
          'unwatched',
          'inprogress',
          'director',
          'writer',
          'tag',
          'cast',
          'studio',
          'thumbsUp'
        ]
      };
    }

    return { sort: ['title'], filter: [] };
  }

  function ensureFilterAvailable(): void {
    libraryFilterStore.setAvailable(filterPath, availableFilters);
  }

  function contentSections(
    value: PrimaryRoute,
    music: MusicLibraryStoreSnapshot,
    video: VideoLibraryStoreSnapshot
  ): Section[] {
    switch (value.kind) {
      case 'music':
      case 'home':
        return [
          {
            title: 'Recently Added Albums',
            cards: albumCards(filterAlbums(music.albums)),
            empty: 'No albums found.'
          },
          {
            title: 'Recently Played Albums',
            cards: songAlbumCards(music.recentlyPlayedSongs),
            empty: 'No recently played albums found.'
          }
        ];
      case 'musicTop':
        return [
          {
            title: 'Recently Added',
            cards: songCards(filterSongs(music.recentlyAddedSongs)),
            empty: 'No recently added music found.'
          },
          {
            title: 'Recently Played',
            cards: songCards(filterSongs(music.recentlyPlayedSongs)),
            empty: 'No recently played music found.'
          },
          {
            title: 'Most Played',
            cards: songCards(filterSongs(music.mostPlayedSongs)),
            empty: 'No top music found.'
          }
        ];
      case 'musicArtists':
        return [{ cards: artistCards(filterArtists(music.artists)), empty: 'No artists found.' }];
      case 'musicAlbums':
        return [{ cards: albumCards(filterAlbums(music.albums)), empty: 'No albums found.' }];
      case 'musicGenres':
        return [{ cards: genreCards(music.genres), empty: 'No genres found.', compact: true }];
      case 'musicVideos':
        return [
          {
            cards: musicVideoCards(filterMusicVideos(video.musicVideos ?? [])),
            empty: 'No music videos found.'
          }
        ];
      case 'musicVideoDetail': {
        const musicvideoid = Number(value.musicvideoid);
        const musicVideo =
          musicVideoDetailsById[musicvideoid] ??
          (video.musicVideos ?? []).find((item) => item.musicvideoid === musicvideoid);

        return [
          {
            title: musicVideo
              ? safe(musicVideo.title ?? musicVideo.label, 'Music video')
              : 'Music video',
            cards: musicVideo ? musicVideoCards(filterMusicVideos([musicVideo])) : [],
            detailRows: musicVideo ? musicVideoDetailRows(musicVideo) : [],
            description: musicVideo?.plot,
            rating: musicVideo?.rating,
            empty: loadingMusicVideoDetailIds[musicvideoid]
              ? 'Loading music video...'
              : missingMusicVideoDetailIds[musicvideoid]
                ? 'Music video not found.'
                : 'Loading music video...'
          }
        ];
      }
      case 'musicAlbumDetail': {
        const albumid = Number(value.albumid);
        const album = music.albums.find((item) => item.albumid === albumid);
        const albumTitle = album ? safe(album.title ?? album.label, '') : '';
        const songs =
          albumSongsByAlbumId[albumid] ??
          music.songs.filter((item) => safe(item.album, '') === albumTitle);

        return [
          {
            title: album ? safe(album.title ?? album.label, 'Album') : 'Album',
            cards: songs.length
              ? songCards(filterSongs(songs))
              : album
                ? albumCards(filterAlbums([album]))
                : [],
            empty: loadingAlbumSongIds[albumid]
              ? 'Loading songs...'
              : 'No songs found for this album.'
          }
        ];
      }
      case 'musicArtistDetail': {
        const artistid = Number(value.artistid);
        const artist = music.artists.find((item) => item.artistid === artistid);
        const songs = music.songs.filter((item) => hasArtist(item.artist, artist?.label));
        const albums = music.albums.filter((item) => hasArtist(item.artist, artist?.label));

        return [
          {
            title: artist ? safe(artist.label, 'Artist') : 'Artist',
            cards: albums.length
              ? albumCards(filterAlbums(albums))
              : artist
                ? artistCards(filterArtists([artist]))
                : [],
            empty: 'No albums found for this artist.'
          },
          {
            title: 'Songs',
            cards: songCards(filterSongs(songs)),
            empty: 'No songs found for this artist.'
          }
        ];
      }
      case 'musicGenreDetail': {
        const genreid = Number(value.genreid);
        const genre = music.genres.find((item) => item.genreid === genreid);
        const artists = music.artists.filter((item) => hasArtist(item.genre, genre?.title));

        return [
          {
            title: genre ? safe(genre.title ?? genre.label, 'Genre') : 'Genre',
            cards: artists.length
              ? artistCards(filterArtists(artists))
              : genre
                ? genreCards([genre])
                : [],
            empty: 'No artists found for this genre.'
          }
        ];
      }
      case 'moviesRecent':
        return [
          {
            title: 'Recently Added',
            cards: movieCards(filterMovies(video.recentlyAddedMovies)),
            empty: 'No recently added movies found.'
          },
          {
            title: 'Random Movies',
            cards: movieCards(
              filterMovies(
                video.recentlyPlayedMovies.length ? video.recentlyPlayedMovies : video.movies
              )
            ),
            empty: 'No random movies found.'
          }
        ];
      case 'movies':
        return [{ cards: movieCards(filterMovies(video.movies)), empty: 'No movies found.' }];
      case 'movieDetail': {
        const movieid = Number(value.movieid);
        const movie = video.movies.find((item) => item.movieid === movieid);

        return [
          {
            title: movie ? safe(movie.title ?? movie.label, 'Movie') : 'Movie',
            cards: movie ? movieCards(filterMovies([movie])) : [],
            empty: 'Movie not found.'
          }
        ];
      }
      case 'tvshowsRecent':
        return [
          {
            title: 'Recently Added Episodes',
            cards: episodeCards(filterEpisodes(video.recentlyAddedEpisodes)),
            empty: 'No recently added episodes found.'
          },
          {
            title: 'Recently Played Episodes',
            cards: episodeCards(filterEpisodes(video.recentlyPlayedEpisodes)),
            empty: 'No recently played episodes found.'
          }
        ];
      case 'tvshows':
        return [{ cards: tvShowCards(filterTvShows(video.tvShows)), empty: 'No TV shows found.' }];
      case 'tvshowDetail': {
        const tvshowid = Number(value.tvshowid);
        const show = video.tvShows.find((item) => item.tvshowid === tvshowid);

        return [
          {
            title: show ? safe(show.title ?? show.label, 'TV show') : 'TV show',
            cards: show ? tvShowCards(filterTvShows([show])) : [],
            empty: 'TV show not found.'
          }
        ];
      }
      case 'tvshowSeasonDetail':
      case 'tvshowEpisodeDetail':
        return [
          {
            title: 'Episodes',
            cards: episodeCards(filterEpisodes(video.recentlyAddedEpisodes)),
            empty: 'No episodes found.'
          }
        ];
      default:
        return [{ cards: [], empty: 'This section is not available yet.' }];
    }
  }

  function artistCards(items: readonly MusicLibraryArtistSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `artist:${item.artistid}`,
      title: safe(item.label, 'Unknown artist'),
      thumbnail: kodiImageUrl(item.thumbnail),
      route: { kind: 'musicArtistDetail', artistid: String(item.artistid) },
      action: { media: 'music', kind: 'artist', artistid: item.artistid }
    }));
  }

  function albumCards(items: readonly MusicLibraryAlbumSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `album:${item.albumid}`,
      title: safe(item.title ?? item.label, 'Unknown album'),
      subtitle: join(item.artist),
      thumbnail: kodiImageUrl(item.thumbnail),
      route: { kind: 'musicAlbumDetail', albumid: String(item.albumid) },
      action: { media: 'music', kind: 'album', albumid: item.albumid }
    }));
  }

  function genreCards(items: readonly MusicLibraryGenreSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `genre:${item.genreid}`,
      title: safe(item.title ?? item.label, 'Unknown genre'),
      thumbnail: kodiImageUrl(item.thumbnail),
      route: { kind: 'musicGenreDetail', genreid: String(item.genreid) }
    }));
  }

  function songCards(items: readonly MusicLibrarySongSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `song:${item.songid}`,
      title: safe(item.title ?? item.label, 'Unknown song'),
      subtitle: join(item.artist) ?? safe(item.album, ''),
      thumbnail: kodiImageUrl(item.thumbnail),
      action: { media: 'music', kind: 'song', songid: item.songid }
    }));
  }

  function songAlbumCards(items: readonly MusicLibrarySongSnapshot[]): Card[] {
    const seen = new Set<string>();
    return items.flatMap((item) => {
      const title = safe(item.album, '');
      if (!title || seen.has(title)) return [];
      seen.add(title);
      return [
        {
          key: `song-album:${item.songid}`,
          title,
          subtitle: join(item.artist),
          thumbnail: kodiImageUrl(item.thumbnail),
          action: { media: 'music', kind: 'song', songid: item.songid }
        }
      ];
    });
  }

  function movieCards(items: readonly VideoLibraryMovieSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `movie:${item.movieid}`,
      title: safe(item.title ?? item.label, 'Unknown movie'),
      subtitle: typeof item.year === 'number' ? String(item.year) : undefined,
      thumbnail: kodiImageUrl(item.thumbnail),
      poster: true,
      route: { kind: 'movieDetail', movieid: String(item.movieid) },
      action: { media: 'movie', movieid: item.movieid }
    }));
  }

  function episodeCards(items: readonly VideoEpisodeSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `episode:${item.episodeid}`,
      title: safe(item.title ?? item.label, 'Unknown episode'),
      subtitle: safe(item.showtitle, ''),
      thumbnail: kodiImageUrl(item.thumbnail),
      action: { media: 'episode', episodeid: item.episodeid }
    }));
  }

  function musicVideoCards(items: readonly VideoMusicVideoSnapshot[]): Card[] {
    return items.map((item) => ({
      key: `musicvideo:${item.musicvideoid}`,
      title: safe(item.title ?? item.label, 'Unknown music video'),
      subtitle: join(item.artist) ?? safe(item.album, ''),
      thumbnail: kodiImageUrl(item.thumbnail),
      route: { kind: 'musicVideoDetail', musicvideoid: String(item.musicvideoid) },
      action: { media: 'musicvideo', musicvideoid: item.musicvideoid }
    }));
  }

  function musicVideoDetailRows(item: VideoMusicVideoSnapshot): DetailRow[] {
    return [
      { label: 'artist', value: join(item.artist) ?? '' },
      { label: 'album', value: safe(item.album, '') },
      { label: 'genres', value: join(item.genre) ?? '' },
      { label: 'Directors', value: join(item.director) ?? '' },
      { label: 'Studios', value: join(item.studio) ?? '' },
      { label: 'year', value: typeof item.year === 'number' ? String(item.year) : '' },
      { label: 'track', value: typeof item.track === 'number' ? String(item.track) : '' },
      { label: 'tags', value: join(item.tag) ?? '' }
    ].filter((row) => row.value.length > 0);
  }

  function filterArtists(
    items: readonly MusicLibraryArtistSnapshot[]
  ): MusicLibraryArtistSnapshot[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('artist', item.artistid) ?? false
    );
  }

  function filterAlbums(items: readonly MusicLibraryAlbumSnapshot[]): MusicLibraryAlbumSnapshot[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('album', item.albumid) ?? false
    );
  }

  function filterSongs(items: readonly MusicLibrarySongSnapshot[]): MusicLibrarySongSnapshot[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('song', item.songid) ?? false
    );
  }

  function filterMovies(items: readonly VideoLibraryMovieSnapshot[]): VideoLibraryMovieSnapshot[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('movie', item.movieid) ?? false
    );
  }

  function filterEpisodes(items: readonly VideoEpisodeSnapshot[]): VideoEpisodeSnapshot[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('episode', item.episodeid) ?? false
    );
  }

  function filterMusicVideos(items: readonly VideoMusicVideoSnapshot[]): VideoMusicVideoSnapshot[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('musicvideo', item.musicvideoid) ?? false
    );
  }

  function filterTvShows<T extends { tvshowid: number }>(items: readonly T[]): T[] {
    return filterLibraryItems(
      items,
      (item) => thumbsUpDispatch?.hasItem('tvshow', item.tvshowid) ?? false
    );
  }

  function filterLibraryItems<T extends object>(
    items: readonly T[],
    isThumbed: (item: T) => boolean
  ): T[] {
    return libraryFilterStore.applyFilters(
      filterPath,
      items.map((item) => ({ ...item, thumbsUp: isThumbed(item) }))
    ) as T[];
  }

  function filterOptionsForRoute(
    value: PrimaryRoute,
    key: string,
    music: MusicLibraryStoreSnapshot,
    video: VideoLibraryStoreSnapshot
  ): LibraryFilterOption[] {
    return libraryFilterStore.getFilterOptions(
      filterPath,
      key,
      optionItemsForRoute(value, music, video)
    );
  }

  function optionItemsForRoute(
    value: PrimaryRoute,
    music: MusicLibraryStoreSnapshot,
    video: VideoLibraryStoreSnapshot
  ): Record<string, unknown>[] {
    if (value.kind === 'musicArtists') return recordsFrom(music.artists);
    if (value.kind === 'musicAlbums' || value.kind === 'music' || value.kind === 'home') {
      return recordsFrom(music.albums);
    }
    if (
      value.kind === 'musicTop' ||
      value.kind === 'musicAlbumDetail' ||
      value.kind === 'musicArtistDetail'
    ) {
      return recordsFrom(music.songs);
    }
    if (value.kind === 'musicVideos' || value.kind === 'musicVideoDetail') {
      return recordsFrom(video.musicVideos ?? []);
    }
    if (value.kind === 'movies' || value.kind === 'moviesRecent' || value.kind === 'movieDetail') {
      return recordsFrom([...video.movies, ...video.recentlyAddedMovies]);
    }
    if (value.kind.startsWith('tvshow')) {
      return recordsFrom([
        ...video.tvShows,
        ...video.recentlyAddedEpisodes,
        ...video.recentlyPlayedEpisodes
      ]);
    }
    return [];
  }

  function recordsFrom(items: readonly object[]): Record<string, unknown>[] {
    return items.map((item) => ({ ...item }));
  }

  function selectSort(method: string, order: 'asc' | 'desc'): void {
    libraryFilterStore.setStoreSort(filterPath, method, order);
    filterRevision += 1;
  }

  function openFilterPane(): void {
    filterPane = 'filters';
    selectedFilterKey = null;
    optionSearch = '';
  }

  function closeFilterPane(): void {
    filterPane = 'normal';
    selectedFilterKey = null;
    optionSearch = '';
  }

  function selectFilter(filter: LibraryParsedFilterField): void {
    if (filter.type === 'boolean') {
      libraryFilterStore.toggleStoreFiltersKey(filterPath, filter.key, filter.alias);
      filterRevision += 1;
      return;
    }

    selectedFilterKey = filter.key;
    optionSearch = '';
    filterPane = 'options';
  }

  function closeOptionsPane(): void {
    selectedFilterKey = null;
    optionSearch = '';
    filterPane = 'filters';
  }

  function toggleFilterOption(option: LibraryFilterOption): void {
    libraryFilterStore.toggleStoreFiltersKey(filterPath, option.key, option.value);
    filterRevision += 1;
  }

  function removeFilter(key: string): void {
    libraryFilterStore.updateStoreFiltersKey(filterPath, key, []);
    filterRevision += 1;
  }

  function deselectCurrentFilterOptions(): void {
    if (!selectedFilterKey) return;
    libraryFilterStore.updateStoreFiltersKey(filterPath, selectedFilterKey, []);
    filterRevision += 1;
  }

  function removeAllFilters(): void {
    libraryFilterStore.setStoreFilters(filterPath, {});
    filterPane = 'normal';
    selectedFilterKey = null;
    optionSearch = '';
    filterRevision += 1;
  }

  function tvShowCards(
    items: readonly {
      tvshowid: number;
      title?: string;
      label: string;
      year?: number;
      thumbnail?: string;
    }[]
  ): Card[] {
    return items.map((item) => ({
      key: `tvshow:${item.tvshowid}`,
      title: safe(item.title ?? item.label, 'Unknown TV show'),
      subtitle: typeof item.year === 'number' ? String(item.year) : undefined,
      thumbnail: kodiImageUrl(item.thumbnail),
      poster: true,
      route: { kind: 'tvshowDetail', tvshowid: String(item.tvshowid) },
      action: { media: 'tvshow', tvshowid: item.tvshowid }
    }));
  }

  function hrefFor(target: PrimaryRoute): string {
    return buildPrimaryAppRoute(target, buildOptions);
  }

  function cardHref(card: Card): string | null {
    return card.route ? hrefFor(card.route) : null;
  }

  function kodiImageUrl(rawPath: unknown): string | undefined {
    if (typeof rawPath !== 'string' || rawPath.trim() === '') {
      return undefined;
    }

    return `/image/${encodeURIComponent(rawPath.trim())}`;
  }

  function optionalCardText<Key extends string>(
    key: Key,
    value: unknown
  ): Partial<Record<Key, string>> {
    return typeof value === 'string' && value.trim()
      ? ({ [key]: value.trim() } as Partial<Record<Key, string>>)
      : {};
  }

  function optionalRawThumbnail(value: unknown): { thumbnail?: string } {
    return typeof value === 'string' && value.trim() ? { thumbnail: value.trim() } : {};
  }

  async function playCard(card: Card): Promise<void> {
    const action = card.action;
    if (!action) return;

    if (action.media === 'music') {
      await playerDispatch.playMusicItem?.(toMusicActionPayload(action));
      return;
    }

    if (action.media === 'movie') {
      await playerDispatch.playMovieItem?.({ movieid: action.movieid });
      return;
    }

    if (action.media === 'episode') {
      await playerDispatch.playEpisodeItem?.({ episodeid: action.episodeid });
      return;
    }

    if (action.media === 'musicvideo') {
      await playerDispatch.playMusicVideoItem?.({ musicvideoid: action.musicvideoid });
    }
  }

  async function queueCard(card: Card): Promise<void> {
    const action = card.action;
    if (!action) return;

    if (action.media === 'music') {
      await queueDispatch.queueMusicItem?.(toMusicActionPayload(action));
      return;
    }

    if (action.media === 'movie') {
      await queueDispatch.queueMovieItem?.({ movieid: action.movieid });
      return;
    }

    if (action.media === 'episode') {
      await queueDispatch.queueEpisodeItem?.({ episodeid: action.episodeid });
      return;
    }

    if (action.media === 'musicvideo') {
      await queueDispatch.queueMusicVideoItem?.({ musicvideoid: action.musicvideoid });
    }
  }

  async function downloadCard(card: Card): Promise<void> {
    const action = downloadableAction(card.action);
    if (!action) return;

    const key = downloadActionKey(action);
    pendingDownloadKey = key;
    actionStatus = `Preparing download for ${card.title}...`;

    try {
      const file = await resolveDownloadFile(action);
      if (!file) {
        throw new Error('Kodi did not expose a downloadable file for this item.');
      }

      const client = createActiveKodiJsonRpcHttpClient();
      if (!client) {
        throw new Error('Choose an active Kodi host before downloading media.');
      }

      const url = await prepareLocalStreamUrl({ client, file, activeHost: configStore.activeHost });
      startBrowserDownload(url, card.title);
      actionStatus = `Started download for ${card.title}.`;
    } catch (error) {
      actionStatus = `Could not download ${card.title}. ${safeErrorMessage(error)}`;
    } finally {
      pendingDownloadKey = null;
    }
  }

  async function addCardToLocalPlaylist(card: Card): Promise<void> {
    const action = localPlaylistAction(card.action);
    const playlistId = localPlaylistSnapshot?.selectedPlaylistId ?? null;
    if (!action || !playlistId || !localPlaylistDispatch) return;

    const key = localPlaylistActionKey(action);
    pendingLocalPlaylistKey = key;
    actionStatus = `Adding ${card.title} to playlist...`;

    try {
      const items = await resolveLocalPlaylistItems(action);
      if (items.length === 0) {
        throw new Error('Kodi did not expose playable songs for this item.');
      }

      const result = localPlaylistDispatch.addItems(playlistId, items);
      if (!result.ok) {
        const message = Object.values(result.errors).find(
          (value): value is string => typeof value === 'string' && value.length > 0
        );
        throw new Error(message ?? 'Could not add to playlist.');
      }

      actionStatus = `Added ${items.length} item${items.length === 1 ? '' : 's'} to playlist.`;
    } catch (error) {
      actionStatus = `Could not add ${card.title} to playlist. ${safeErrorMessage(error)}`;
    } finally {
      pendingLocalPlaylistKey = null;
    }
  }

  function toggleThumbsUp(card: Card): void {
    const item = thumbsUpItem(card);
    if (!item || !thumbsUpDispatch) {
      return;
    }

    thumbsUpDispatch.toggleItem(item);
  }

  function isThumbedUp(card: Card): boolean {
    const item = thumbsUpItem(card);
    return item ? (thumbsUpDispatch?.hasItem(item.media, item.id) ?? false) : false;
  }

  function thumbsUpItem(card: Card): ThumbsUpItemInput | null {
    const action = card.action;
    if (!action) {
      return null;
    }

    if (action.media === 'music' && action.kind === 'song') {
      return {
        media: 'song',
        id: action.songid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    if (action.media === 'music' && action.kind === 'album') {
      return {
        media: 'album',
        id: action.albumid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    if (action.media === 'music' && action.kind === 'artist') {
      return {
        media: 'artist',
        id: action.artistid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    if (action.media === 'movie') {
      return {
        media: 'movie',
        id: action.movieid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    if (action.media === 'episode') {
      return {
        media: 'episode',
        id: action.episodeid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    if (action.media === 'musicvideo') {
      return {
        media: 'musicvideo',
        id: action.musicvideoid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    if (action.media === 'tvshow') {
      return {
        media: 'tvshow',
        id: action.tvshowid,
        label: card.title,
        ...optionalCardText('subtitle', card.subtitle),
        ...optionalRawThumbnail(card.thumbnail)
      };
    }

    return null;
  }

  async function playCardInBrowser(card: Card): Promise<void> {
    const action = browserPlayableAction(card.action);
    if (!action) return;

    actionStatus = `Starting browser playback for ${card.title}...`;

    try {
      if (action.media === 'music') {
        playerDispatch.setMode?.('local');
        await playerDispatch.playMusicItem?.(toMusicActionPayload(action));
      } else if (action.media === 'movie') {
        await playerDispatch.streamMovieItem?.({ movieid: action.movieid });
      } else if (action.media === 'episode') {
        await playerDispatch.streamEpisodeItem?.({ episodeid: action.episodeid });
      } else {
        await playerDispatch.streamMusicVideoItem?.({ musicvideoid: action.musicvideoid });
      }

      actionStatus = `Started browser playback for ${card.title}.`;
    } catch (error) {
      actionStatus = `Could not play ${card.title} in browser. ${safeErrorMessage(error)}`;
    }
  }

  function downloadableAction(action: Card['action']): DownloadableCardAction | null {
    if (!action) return null;
    if (action.media === 'music' && action.kind === 'song') return action;
    if (action.media === 'movie') return action;
    if (action.media === 'episode') return action;
    if (action.media === 'musicvideo') return action;
    return null;
  }

  function localPlaylistAction(action: Card['action']): LocalPlaylistCardAction | null {
    if (!action) return null;
    if (action.media === 'music') return action;
    return null;
  }

  function browserPlayableAction(action: Card['action']): BrowserPlayableCardAction | null {
    if (!action) return null;
    if (action.media === 'music') return action;
    if (action.media === 'movie') return action;
    if (action.media === 'episode') return action;
    if (action.media === 'musicvideo') return action;
    return null;
  }

  function localPlaylistActionKey(action: LocalPlaylistCardAction): string {
    if (action.kind === 'artist') return `artist:${action.artistid}`;
    if (action.kind === 'album') return `album:${action.albumid}`;
    return `song:${action.songid}`;
  }

  function downloadActionKey(action: DownloadableCardAction): string {
    if (action.media === 'music') return `song:${action.songid}`;
    if (action.media === 'movie') return `movie:${action.movieid}`;
    if (action.media === 'episode') return `episode:${action.episodeid}`;
    return `musicvideo:${action.musicvideoid}`;
  }

  async function resolveDownloadFile(action: DownloadableCardAction): Promise<string | null> {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before downloading media.');
    }

    if (action.media === 'music') {
      const result = await getAudioLibrarySongs(client, {
        filter: { songid: action.songid },
        properties: ['file'],
        limits: { start: 0, end: 1 }
      });
      return rawFileFromRecord(result.songs?.[0]);
    }

    if (action.media === 'movie') {
      const result = await getVideoLibraryMovieDetails(client, {
        movieid: action.movieid,
        properties: ['file']
      });
      return rawFileFromRecord(result.moviedetails);
    }

    if (action.media === 'episode') {
      const result = await getVideoLibraryEpisodeDetails(client, {
        episodeid: action.episodeid,
        properties: ['file']
      });
      return rawFileFromRecord(result.episodedetails);
    }

    const result = await getVideoLibraryMusicVideoDetails(client, {
      musicvideoid: action.musicvideoid,
      properties: ['file']
    });
    return rawFileFromRecord(result.musicvideodetails);
  }

  async function resolveLocalPlaylistItems(
    action: LocalPlaylistCardAction
  ): Promise<LocalPlaylistItemInput[]> {
    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      throw new Error('Choose an active Kodi host before adding media to a playlist.');
    }

    const result = await getAudioLibrarySongs(client, {
      filter: localPlaylistSongFilter(action),
      properties: ['title', 'artist', 'album', 'duration', 'thumbnail', 'file'],
      limits: { start: 0, end: 1000 }
    });

    return recordsToLocalPlaylistItems(result.songs);
  }

  function localPlaylistSongFilter(
    action: LocalPlaylistCardAction
  ): { artistid: number } | { albumid: number } | { songid: number } {
    if (action.kind === 'artist') return { artistid: action.artistid };
    if (action.kind === 'album') return { albumid: action.albumid };
    return { songid: action.songid };
  }

  function recordsToLocalPlaylistItems(records: unknown): LocalPlaylistItemInput[] {
    if (!Array.isArray(records)) return [];

    return records.flatMap((record): LocalPlaylistItemInput[] => {
      if (typeof record !== 'object' || record === null || Array.isArray(record)) return [];
      const value = record as Record<string, unknown>;
      const file = typeof value.file === 'string' ? value.file.trim() : '';
      if (!file) return [];

      return [
        {
          kind: 'audio',
          label: localPlaylistSongLabel(value),
          file,
          ...(typeof value.songid === 'number' && Number.isSafeInteger(value.songid)
            ? { sourceId: `song:${value.songid}` }
            : {}),
          ...(typeof value.duration === 'number' && Number.isFinite(value.duration)
            ? { durationSeconds: value.duration }
            : {}),
          ...(typeof value.thumbnail === 'string' && value.thumbnail.trim()
            ? { thumbnail: value.thumbnail.trim() }
            : {})
        }
      ];
    });
  }

  function localPlaylistSongLabel(value: Record<string, unknown>): string {
    const title =
      typeof value.title === 'string' && value.title.trim()
        ? value.title.trim()
        : typeof value.label === 'string' && value.label.trim()
          ? value.label.trim()
          : 'Unknown song';
    const artists = Array.isArray(value.artist)
      ? value.artist.filter(
          (artist): artist is string => typeof artist === 'string' && artist.trim().length > 0
        )
      : [];

    return artists.length > 0 ? `${artists.join(', ')} - ${title}` : title;
  }

  function rawFileFromRecord(value: unknown): string | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    const file = (value as { file?: unknown }).file;
    return typeof file === 'string' && file.trim().length > 0 ? file.trim() : null;
  }

  function startBrowserDownload(url: string, label: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeFilename(label);
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function safeFilename(label: string): string {
    return (
      label
        .trim()
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'download'
    );
  }

  function safeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Download failed.';
    return message
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[url]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization|basic|password|p@ssword/gi, 'credentials')
      .replace(/localStorage|sessionStorage/gi, 'browser storage')
      .replace(/raw response body/gi, 'response body [redacted]');
  }

  function toMusicActionPayload(
    action:
      | { media: 'music'; kind: 'artist'; artistid: number }
      | { media: 'music'; kind: 'album'; albumid: number }
      | { media: 'music'; kind: 'song'; songid: number }
  ): MusicPlaybackItem & MusicQueueItem {
    if (action.kind === 'artist') {
      return { kind: 'artist', artistid: action.artistid };
    }

    if (action.kind === 'album') {
      return { kind: 'album', albumid: action.albumid };
    }

    return { kind: 'song', songid: action.songid };
  }

  async function loadAlbumSongs(albumid: number): Promise<void> {
    if (albumSongsByAlbumId[albumid] || loadingAlbumSongIds[albumid]) {
      return;
    }

    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      return;
    }

    loadingAlbumSongIds = { ...loadingAlbumSongIds, [albumid]: true };

    try {
      const result = await getAudioLibrarySongs(client, {
        filter: { albumid },
        properties: ['title', 'artist', 'album', 'duration', 'track', 'thumbnail']
      });
      albumSongsByAlbumId = {
        ...albumSongsByAlbumId,
        [albumid]: normalizeMusicSongs(result.songs)
      };
    } catch {
      albumSongsByAlbumId = {
        ...albumSongsByAlbumId,
        [albumid]: []
      };
    } finally {
      const remaining = { ...loadingAlbumSongIds };
      delete remaining[albumid];
      loadingAlbumSongIds = remaining;
    }
  }

  async function loadMusicVideoDetail(musicvideoid: number): Promise<void> {
    if (
      musicVideoDetailsById[musicvideoid] ||
      loadingMusicVideoDetailIds[musicvideoid] ||
      missingMusicVideoDetailIds[musicvideoid]
    ) {
      return;
    }

    const client = createActiveKodiJsonRpcHttpClient();
    if (!client) {
      return;
    }

    loadingMusicVideoDetailIds = { ...loadingMusicVideoDetailIds, [musicvideoid]: true };

    try {
      const result = await getVideoLibraryMusicVideoDetails(client, {
        musicvideoid,
        properties: [
          'title',
          'artist',
          'album',
          'year',
          'runtime',
          'thumbnail',
          'fanart',
          'art',
          'genre',
          'director',
          'studio',
          'playcount',
          'lastplayed',
          'resume',
          'dateadded',
          'plot',
          'track',
          'tag',
          'rating'
        ]
      });
      const [detail] = normalizeVideoMusicVideos(
        result.musicvideodetails ? [result.musicvideodetails] : []
      );

      if (detail) {
        musicVideoDetailsById = { ...musicVideoDetailsById, [musicvideoid]: detail };
      } else {
        missingMusicVideoDetailIds = { ...missingMusicVideoDetailIds, [musicvideoid]: true };
      }
    } catch {
      missingMusicVideoDetailIds = { ...missingMusicVideoDetailIds, [musicvideoid]: true };
    } finally {
      const remaining = { ...loadingMusicVideoDetailIds };
      delete remaining[musicvideoid];
      loadingMusicVideoDetailIds = remaining;
    }
  }

  function join(values: unknown): string | undefined {
    return Array.isArray(values)
      ? values
          .map((entry) => safe(entry, ''))
          .filter(Boolean)
          .join(', ') || undefined
      : undefined;
  }

  function hasArtist(values: unknown, label: string | undefined): boolean {
    if (!label) return false;
    return Array.isArray(values)
      ? values.some((entry) => safe(entry, '').toLowerCase() === label.toLowerCase())
      : false;
  }

  function safe(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
</script>

<section class="classic-library-page" data-classic-library-page={family}>
  <aside class="classic-section-nav" aria-label="Sections">
    <div
      class="classic-filter-panes"
      class:show-filters={filterPane === 'filters'}
      class:show-options={filterPane === 'options'}
    >
      <div class="classic-filter-pane current">
        <div class="classic-nav-section">
          <h2>Sections</h2>
          <nav>
            {#each navItems as item}
              <a href={hrefFor(item.route)} class:active={item.active}>{item.label}</a>
            {/each}
          </nav>
        </div>

        <h2>
          <button type="button" class="classic-pane-title" onclick={openFilterPane}>
            Filters
            <span aria-hidden="true">›</span>
          </button>
        </h2>
        <ul class="classic-active-list">
          {#if activeFilters.length}
            {#each activeFilters as filter}
              <li>
                <button
                  type="button"
                  class="classic-filter-btn"
                  onclick={() => removeFilter(filter.key)}
                >
                  {filter.title}
                </button>
              </li>
            {/each}
          {:else}
            <li>
              <button type="button" class="classic-filter-btn" onclick={openFilterPane}
                >Add filter</button
              >
            </li>
          {/if}
        </ul>

        <h2>Sort</h2>
        <ul class="classic-selection-list">
          {#each sortableFilters as sort}
            <li>
              <button
                type="button"
                class:active={sort.active}
                class:order-asc={sort.active && sort.order === 'asc'}
                class:order-desc={sort.active && sort.order === 'desc'}
                onclick={() => selectSort(sort.key, sort.order)}
              >
                {sort.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <div class="classic-filter-pane filters-page">
        <h2>
          <button type="button" class="classic-pane-title" onclick={closeFilterPane}>
            Select a filter
          </button>
        </h2>
        <ul class="classic-selection-list">
          {#each filterableFilters as filter}
            <li>
              <button
                type="button"
                class:active={filter.active}
                onclick={() => selectFilter(filter)}
              >
                {filter.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <div class="classic-filter-pane options-page">
        <h2>
          <button type="button" class="classic-pane-title" onclick={closeOptionsPane}>
            Select an option
          </button>
        </h2>
        {#if selectedFilterOptions.length > 10 || optionSearch}
          <input
            class="classic-options-search"
            type="search"
            bind:value={optionSearch}
            aria-label="Search filter options"
          />
        {/if}
        <button type="button" class="classic-deselect-all" onclick={deselectCurrentFilterOptions}>
          Deselect all
        </button>
        <ul class="classic-selection-list">
          {#each selectedFilterOptions as option}
            <li>
              <button
                type="button"
                class:active={option.active}
                onclick={() => toggleFilterOption(option)}
              >
                {option.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </aside>

  <div class="classic-library-content">
    {#if activeFilters.length}
      <div class="classic-filters-active-bar">
        <span>{activeFilters.flatMap((filter) => filter.values).join(', ')}</span>
        <button type="button" aria-label="Remove all filters" onclick={removeAllFilters}>×</button>
      </div>
    {/if}
    {#each sections as section}
      <section class="classic-card-section" class:compact={section.compact}>
        {#if section.title}
          <header>
            <h3>{section.title}</h3>
            <button type="button" aria-label={`${section.title} menu`}>⋮</button>
          </header>
        {/if}

        {#if section.cards.length}
          {#if section.detailRows?.length || section.description || section.rating !== undefined}
            <div class="classic-detail-meta">
              {#if section.rating !== undefined}
                <div class="classic-detail-rating" aria-label="Rating">{section.rating}</div>
              {/if}
              {#if section.detailRows?.length}
                <dl>
                  {#each section.detailRows as row}
                    <div>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  {/each}
                </dl>
              {/if}
              {#if section.description}
                <p>{section.description}</p>
              {/if}
            </div>
          {/if}
          <div class="classic-card-grid">
            {#each section.cards as card}
              <article class="classic-card" class:poster={card.poster}>
                <a class="classic-card-main" href={cardHref(card) ?? '#'} aria-label={card.title}>
                  <div
                    class="classic-card-art"
                    class:has-artwork={Boolean(card.thumbnail)}
                    aria-hidden="true"
                  >
                    {#if card.thumbnail}
                      <img src={card.thumbnail} alt="" loading="lazy" decoding="async" />
                    {/if}
                  </div>
                  <div class="classic-card-copy">
                    <strong>{card.title}</strong>
                    {#if card.subtitle}
                      <span>{card.subtitle}</span>
                    {/if}
                  </div>
                </a>
                {#if card.action}
                  {@const thumbsItem = thumbsUpItem(card)}
                  {@const downloadAction = downloadableAction(card.action)}
                  {@const browserAction = browserPlayableAction(card.action)}
                  {@const playlistAction = localPlaylistAction(card.action)}
                  <div class="classic-card-actions">
                    {#if card.action.media !== 'tvshow'}
                      <button type="button" onclick={() => void playCard(card)}>Play</button>
                      <button type="button" onclick={() => void queueCard(card)}>Queue</button>
                    {/if}
                    {#if thumbsItem}
                      <button
                        type="button"
                        aria-pressed={isThumbedUp(card)}
                        disabled={!thumbsUpDispatch}
                        onclick={() => toggleThumbsUp(card)}
                      >
                        {isThumbedUp(card) ? 'Thumbed up' : 'Thumbs up'}
                      </button>
                    {/if}
                    {#if playlistAction}
                      <button
                        type="button"
                        disabled={!localPlaylistDispatch ||
                          !localPlaylistSnapshot?.selectedPlaylistId ||
                          pendingLocalPlaylistKey === localPlaylistActionKey(playlistAction)}
                        onclick={() => void addCardToLocalPlaylist(card)}>Add to playlist</button
                      >
                    {/if}
                    {#if browserAction}
                      <button type="button" onclick={() => void playCardInBrowser(card)}>
                        Play in browser
                      </button>
                    {/if}
                    {#if downloadAction}
                      <button
                        type="button"
                        disabled={pendingDownloadKey === downloadActionKey(downloadAction)}
                        onclick={() => void downloadCard(card)}>Download</button
                      >
                    {/if}
                  </div>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <p class="classic-empty">{section.empty}</p>
        {/if}
      </section>
    {/each}
    {#if actionStatus}
      <p class="classic-action-status" role="status" aria-live="polite">{actionStatus}</p>
    {/if}
  </div>
</section>

<style>
  .classic-library-page {
    display: grid;
    grid-template-columns: 255px minmax(0, 1fr);
    min-height: calc(100vh - 123px);
    color: #333;
    background: #ddd;
  }

  .classic-section-nav {
    overflow: hidden;
    background: #f2f2f2;
  }

  .classic-filter-panes {
    display: grid;
    grid-template-columns: repeat(3, 100%);
    width: 300%;
    transition: transform 160ms ease;
  }

  .classic-filter-panes.show-filters {
    transform: translateX(-33.3333%);
  }

  .classic-filter-panes.show-options {
    transform: translateX(-66.6666%);
  }

  .classic-filter-pane {
    min-width: 0;
    padding: 2rem 1.5rem;
  }

  .classic-nav-section {
    margin-bottom: 2rem;
  }

  .classic-section-nav h2 {
    margin: 0 0 1rem;
    color: #8d8d8d;
    font-size: 1rem;
    font-weight: 400;
    text-transform: uppercase;
  }

  .classic-pane-title {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    text-transform: uppercase;
    cursor: pointer;
  }

  .classic-section-nav nav {
    display: grid;
    gap: 0.55rem;
  }

  .classic-section-nav a {
    color: #333;
    font-size: 0.98rem;
    font-weight: 500;
    text-decoration: none;
  }

  .classic-section-nav a.active {
    color: #42a5dc;
    font-weight: 700;
  }

  .classic-active-list,
  .classic-selection-list {
    display: grid;
    gap: 0.35rem;
    margin: 0 0 2rem;
    padding: 0;
    list-style: none;
  }

  .classic-selection-list button,
  .classic-filter-btn {
    width: 100%;
    min-height: 1.7rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: #333;
    font-size: 0.98rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }

  .classic-selection-list button.active,
  .classic-filter-btn:hover,
  .classic-selection-list button:hover {
    color: #42a5dc;
    font-weight: 700;
  }

  .classic-selection-list button.order-asc::after {
    content: '⌃';
    margin-left: 0.35rem;
  }

  .classic-selection-list button.order-desc::after {
    content: '⌄';
    margin-left: 0.35rem;
  }

  .classic-filter-btn {
    display: inline-flex;
    width: auto;
    min-height: 2rem;
    align-items: center;
    padding: 0.25rem 0.65rem;
    background: #a4a4a4;
    color: #fff;
  }

  .classic-filter-btn::after {
    content: '×';
    margin-left: 0.5rem;
    color: rgb(255 255 255 / 0.72);
  }

  .classic-options-search {
    width: 100%;
    min-height: 2rem;
    margin-bottom: 0.75rem;
    border: 0;
    border-bottom: 1px solid #aaa;
    background: #fff;
    color: #333;
    font: inherit;
  }

  .classic-deselect-all {
    width: 100%;
    min-height: 2rem;
    margin-bottom: 0.75rem;
    border: 0;
    background: #aaa;
    color: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .classic-library-content {
    min-width: 0;
    padding: 1rem;
  }

  .classic-filters-active-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2.75rem;
    margin: -1rem -1rem 1rem;
    padding: 0 1rem;
    background: #e8e8e8;
    color: #666;
    border-bottom: 1px solid #cfcfcf;
  }

  .classic-filters-active-bar button {
    border: 0;
    background: transparent;
    color: #888;
    font-size: 1.4rem;
    cursor: pointer;
  }

  .classic-card-section {
    margin-bottom: 1rem;
  }

  .classic-card-section header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 3.5rem;
    margin: -1rem -1rem 1rem;
    padding: 0 1rem;
    background: #f7f7f7;
    border-bottom: 1px solid #cfcfcf;
  }

  .classic-card-section h3 {
    margin: 0;
    color: #666;
    font-size: 1.15rem;
    font-weight: 400;
  }

  .classic-card-section button {
    border: 0;
    background: transparent;
    color: #333;
    font-size: 1.35rem;
  }

  .classic-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.65rem;
    max-width: 760px;
  }

  .classic-detail-meta {
    display: grid;
    gap: 0.9rem;
    max-width: 760px;
    margin: 0 0 1rem;
    color: #555;
  }

  .classic-detail-meta dl {
    display: grid;
    gap: 0.45rem;
    margin: 0;
  }

  .classic-detail-meta dl div {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 1rem;
  }

  .classic-detail-meta dt {
    color: #777;
    font-weight: 700;
    text-transform: capitalize;
  }

  .classic-detail-meta dd {
    margin: 0;
  }

  .classic-detail-meta p {
    max-width: 60ch;
    margin: 0;
    line-height: 1.55;
  }

  .classic-detail-rating {
    justify-self: start;
    color: #42a5dc;
    font-size: 1.35rem;
    font-weight: 700;
  }

  .compact .classic-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    max-width: 860px;
  }

  .classic-card {
    overflow: hidden;
    min-height: 132px;
    background: #fff;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.18);
  }

  .classic-card-main {
    display: block;
    color: inherit;
    text-decoration: none;
  }

  .classic-card.poster {
    min-height: 305px;
  }

  .compact .classic-card {
    min-height: auto;
  }

  .classic-card-art {
    display: grid;
    min-height: 98px;
    place-items: center;
    background: #cfcfcf;
  }

  .classic-card-art::before {
    content: '◆';
    color: #b5b5b5;
    font-size: 3.5rem;
    transform: rotate(45deg);
  }

  .classic-card-art.has-artwork::before {
    content: none;
  }

  .classic-card-art img {
    display: block;
    width: 100%;
    height: 98px;
    object-fit: cover;
  }

  .poster .classic-card-art {
    min-height: 215px;
  }

  .poster .classic-card-art img {
    height: 215px;
  }

  .compact .classic-card-art {
    display: none;
  }

  .classic-card-copy {
    display: grid;
    gap: 0.35rem;
    padding: 0.65rem;
  }

  .classic-card-copy strong,
  .classic-card-copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .classic-card-copy strong {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .classic-card-copy span {
    color: #8a8a8a;
    font-size: 0.85rem;
  }

  .classic-card-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
    border-top: 1px solid #eee;
  }

  .classic-card-actions button {
    min-height: 2rem;
    border: 0;
    border-right: 1px solid #eee;
    background: #fafafa;
    color: #555;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .classic-card-actions button:hover {
    color: #42a5dc;
    background: #fff;
  }

  .classic-action-status {
    position: sticky;
    bottom: 1rem;
    margin: 0;
    padding: 0.55rem 0.75rem;
    background: #1d1d1d;
    color: #f6f6f6;
    box-shadow: 0 2px 8px rgb(0 0 0 / 22%);
  }

  .classic-empty {
    margin: 1rem 0;
    color: #777;
  }
</style>
