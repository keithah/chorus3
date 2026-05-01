import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import App from './App.svelte';
import type {
  MusicBrowseActionDispatch,
  MusicBrowsePanelDispatch
} from './lib/components/MusicBrowsePanel.svelte';
import type { PlayerControlsDispatch } from './lib/components/PlayerControls.svelte';
import type {
  MediaSearchActionDispatch,
  MediaSearchPanelDispatch
} from './lib/components/MediaSearchPanel.svelte';
import type {
  MediaFilesActionDispatch,
  MediaFilesPanelDispatch
} from './lib/components/MediaFilesPanel.svelte';
import type {
  MediaPlaylistsActionDispatch,
  MediaPlaylistsPanelDispatch
} from './lib/components/MediaPlaylistsPanel.svelte';
import type { VideoMovieActionDispatch } from './lib/components/VideoMovieDetailShell.svelte';
import type { VideoMovieStreamDispatch } from './lib/components/VideoMovieStreamShell.svelte';
import type { VideoEpisodeActionDispatch } from './lib/components/VideoEpisodeDetailShell.svelte';
import type {
  VideoSeasonArtworkDispatch,
  VideoSeasonWriteDispatch
} from './lib/components/VideoSeasonDetailShell.svelte';
import type { QueuePanelDispatch } from './lib/components/QueuePanel.svelte';
import type { VideoLibraryStoreSnapshot } from './lib/stores/videoLibrary.svelte.ts';
import type { VideoTvStoreSnapshot } from './lib/stores/videoTvStore.svelte.ts';
import type { VideoRoute } from './lib/video/videoRouter';
import {
  configStore,
  connectionStore,
  createConfigStore,
  hostConnectionStore,
  localPlayerStore,
  mediaPlaylistsStore,
  playerDispatch as defaultPlayerDispatch,
  queueDispatch as defaultQueueDispatch,
  videoLibraryStore,
  videoMovieDetailStore,
  videoTvStore,
  videoWriteStore,
  type MusicBrowseStoreSnapshot,
  type MediaDirectoryEntrySnapshot,
  type MediaFilesBreadcrumbSnapshot,
  type MediaFilesStoreSnapshot,
  type MediaFileSourceSnapshot,
  type MediaPlaylistEntrySnapshot,
  type MediaPlaylistSnapshot,
  type MediaPlaylistsBreadcrumbSnapshot,
  type MediaPlaylistsStoreSnapshot,
  type MediaSearchStoreSnapshot,
  type MusicLibraryStoreSnapshot,
  type PlayerDispatchSnapshot,
  type PlayerStoreSnapshot,
  type QueueDispatchSnapshot,
  type QueueStoreSnapshot
} from './lib/stores';
import { DEFAULT_THEME } from './lib/theme/theme';

let mountedComponent: Record<string, unknown> | undefined;

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;
type AppProps = {
  playerSnapshot?: PlayerStoreSnapshot;
  playerDispatch?: PlayerControlsDispatch;
  localPlayerSnapshot?: import('./lib/stores/localPlayer.svelte').LocalPlayerStoreSnapshot;
  queueSnapshot?: QueueStoreSnapshot;
  queueDispatch?: QueuePanelDispatch;
  musicLibrarySnapshot?: MusicLibraryStoreSnapshot;
  musicBrowseSnapshot?: MusicBrowseStoreSnapshot;
  musicBrowseDispatch?: MusicBrowsePanelDispatch;
  musicActionDispatch?: MusicBrowseActionDispatch;
  mediaSearchSnapshot?: MediaSearchStoreSnapshot;
  mediaSearchDispatch?: MediaSearchPanelDispatch;
  mediaSearchActionDispatch?: MediaSearchActionDispatch;
  mediaFilesSnapshot?: MediaFilesStoreSnapshot;
  mediaFilesDispatch?: MediaFilesPanelDispatch;
  mediaFilesActionDispatch?: MediaFilesActionDispatch;
  mediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
  mediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
  mediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
  route?: VideoRoute;
  videoLibrarySnapshot?: VideoLibraryStoreSnapshot;
  videoMovieDetailSnapshot?: import('./lib/stores/videoMovieDetailStore.svelte').VideoMovieDetailStoreSnapshot;
  videoMovieActionDispatch?: VideoMovieActionDispatch;
  videoMovieStreamActionDispatch?: VideoMovieStreamDispatch;
  videoTvSnapshot?: VideoTvStoreSnapshot;
  videoEpisodeActionDispatch?: VideoEpisodeActionDispatch;
  videoSeasonArtworkDispatch?: VideoSeasonArtworkDispatch;
  videoSeasonWriteDispatch?: VideoSeasonWriteDispatch;
};

type MusicLibrarySnapshotOverrides = Omit<Partial<MusicLibraryStoreSnapshot>, 'limits'> & {
  limits?: Partial<MusicLibraryStoreSnapshot['limits']>;
};

function createMusicLibrarySnapshot(
  overrides: MusicLibrarySnapshotOverrides = {}
): MusicLibraryStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-04-29T12:00:00.000Z',
    artists: [],
    albums: [],
    songs: [],
    recentlyAddedSongs: [],
    recentlyPlayedSongs: [],
    mostPlayedSongs: [],
    genres: [],
    isEmpty: true,
    lastError: null,
    ...overrides,
    limits: {
      artists: { start: 0, end: 0, total: 0 },
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 },
      recentlyAddedSongs: { start: 0, end: 0, total: 0 },
      recentlyPlayedSongs: { start: 0, end: 0, total: 0 },
      mostPlayedSongs: { start: 0, end: 0, total: 0 },
      genres: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
  };
}

function createMusicBrowseSnapshot(
  overrides: Partial<MusicBrowseStoreSnapshot> = {}
): MusicBrowseStoreSnapshot {
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    selection: null,
    albums: [],
    songs: [],
    limits: {
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 }
    },
    isEmpty: true,
    lastError: null,
    ...overrides
  };
}

function createMediaSearchSnapshot(
  overrides: Partial<MediaSearchStoreSnapshot> = {}
): MediaSearchStoreSnapshot {
  return {
    searchStatus: 'ready',
    scope: 'music',
    query: 'nina',
    lastUpdatedAt: '2026-04-30T12:00:00.000Z',
    results: {
      artists: [{ kind: 'artist', artistid: 1, label: 'Nina Simone', genre: ['Soul'] }],
      albums: [
        {
          kind: 'album',
          albumid: 2,
          label: 'Pastel Blues',
          title: 'Pastel Blues',
          artist: ['Nina Simone'],
          year: 1965
        }
      ],
      songs: [
        {
          kind: 'song',
          songid: 3,
          label: 'Sinnerman',
          title: 'Sinnerman',
          artist: ['Nina Simone'],
          album: 'Pastel Blues',
          duration: 622
        }
      ],
      genres: [{ kind: 'genre', genreid: 4, label: 'Soul', title: 'Soul' }]
    },
    limits: {
      artists: { start: 0, end: 1, total: 1 },
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 },
      genres: { start: 0, end: 1, total: 1 }
    },
    resultCounts: { artists: 1, albums: 1, songs: 1, genres: 1, total: 4 },
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function createMediaSearchDispatch(
  overrides: Partial<MediaSearchPanelDispatch> = {}
): MediaSearchPanelDispatch {
  return {
    search: vi.fn(),
    clear: vi.fn(),
    ...overrides
  };
}

function createMediaSearchActionDispatch(
  overrides: Partial<MediaSearchActionDispatch> = {}
): MediaSearchActionDispatch {
  return {
    playMusicItem: vi.fn(),
    queueMusicItem: vi.fn(),
    ...overrides
  };
}

function createMediaFilesSnapshot(
  overrides: Partial<MediaFilesStoreSnapshot> = {}
): MediaFilesStoreSnapshot {
  const sources: MediaFileSourceSnapshot[] = [{ id: 'source:1', label: 'Albums' }];
  const entries: MediaDirectoryEntrySnapshot[] = [
    {
      id: 'entry:1',
      kind: 'directory',
      label: 'Nina Simone',
      capabilities: { canBrowse: true, canPlay: false, canQueue: false }
    },
    {
      id: 'entry:2',
      kind: 'file',
      label: 'Sinnerman.flac',
      mediaKind: 'audio',
      extension: 'flac',
      capabilities: { canBrowse: false, canPlay: true, canQueue: true }
    },
    {
      id: 'entry:3',
      kind: 'file',
      label: 'cover.jpg',
      mediaKind: 'unsupported',
      extension: 'jpg',
      capabilities: { canBrowse: false, canPlay: false, canQueue: false }
    }
  ];
  const breadcrumbs: MediaFilesBreadcrumbSnapshot[] = [
    { id: 'source:1', label: 'Albums' },
    { id: 'entry:1', label: 'Nina Simone' }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'directory:entry:1',
    lastUpdatedAt: '2026-04-30T14:00:00.000Z',
    media: 'music',
    sources,
    entries,
    breadcrumbs,
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function createMediaFilesDispatch(
  overrides: Partial<MediaFilesPanelDispatch> = {}
): MediaFilesPanelDispatch {
  return {
    refresh: vi.fn(),
    openSource: vi.fn(),
    openEntry: vi.fn(),
    openBreadcrumb: vi.fn(),
    ...overrides
  };
}

function createMediaFilesActionDispatch(
  overrides: Partial<MediaFilesActionDispatch> = {}
): MediaFilesActionDispatch {
  return {
    playFileItem: vi.fn(),
    queueFileItem: vi.fn(),
    ...overrides
  };
}

function createMediaPlaylistsSnapshot(
  overrides: Partial<MediaPlaylistsStoreSnapshot> = {}
): MediaPlaylistsStoreSnapshot {
  const playlists: MediaPlaylistSnapshot[] = [
    {
      id: 'playlist:1',
      label: 'Late Night Jazz.xsp',
      media: 'music',
      kind: 'smart',
      extension: 'xsp',
      capabilities: { canBrowse: true, canPlay: true, canQueue: true }
    },
    {
      id: 'playlist:2',
      label: 'Road Trip.m3u',
      media: 'music',
      kind: 'basic',
      extension: 'm3u',
      capabilities: { canBrowse: false, canPlay: false, canQueue: false }
    }
  ];
  const entries: MediaPlaylistEntrySnapshot[] = [
    {
      id: 'entry:1',
      label: 'Blue in Green.flac',
      mediaKind: 'audio',
      extension: 'flac',
      capabilities: { canPlay: true, canQueue: true }
    },
    {
      id: 'entry:2',
      label: 'cover.jpg',
      mediaKind: 'unsupported',
      extension: 'jpg',
      capabilities: { canPlay: false, canQueue: false }
    }
  ];
  const breadcrumbs: MediaPlaylistsBreadcrumbSnapshot[] = [
    { id: 'playlist:1', label: 'Late Night Jazz.xsp' }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'playlist:playlist:1',
    lastUpdatedAt: '2026-04-30T16:00:00.000Z',
    media: 'music',
    playlists,
    entries,
    breadcrumbs,
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function createMediaPlaylistsDispatch(
  overrides: Partial<MediaPlaylistsPanelDispatch> = {}
): MediaPlaylistsPanelDispatch {
  return {
    refresh: vi.fn(),
    openPlaylist: vi.fn(),
    openBreadcrumb: vi.fn(),
    ...overrides
  };
}

function createMediaPlaylistsActionDispatch(
  overrides: Partial<MediaPlaylistsActionDispatch> = {}
): MediaPlaylistsActionDispatch {
  return {
    playPlaylistItem: vi.fn(),
    queuePlaylistItem: vi.fn(),
    ...overrides
  };
}

function createVideoLibrarySnapshot(
  overrides: Partial<VideoLibraryStoreSnapshot> = {}
): VideoLibraryStoreSnapshot {
  const movies = overrides.movies ?? [
    {
      movieid: 4401,
      label: 'Neon Harbor',
      title: 'Neon Harbor',
      year: 2024,
      runtime: 6420,
      playcount: 1,
      watched: true,
      resume: { position: 0, total: 6420 },
      art: { poster: 'poster:neon-harbor' },
      versionCount: 2
    } as VideoLibraryStoreSnapshot['movies'][number] & { versionCount?: number },
    {
      movieid: 4402,
      label: 'Quiet Signal',
      title: 'Quiet Signal',
      year: 2025,
      runtime: 5940,
      playcount: 0,
      watched: false,
      resume: { position: 1275, total: 5940 }
    }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-05-01T07:00:00.000Z',
    movies,
    tvShows: [],
    limits: {
      movies: { start: 0, end: movies.length, total: movies.length },
      tvShows: { start: 0, end: 0, total: 0 }
    },
    isEmpty: movies.length === 0,
    lastError: null,
    ...overrides
  };
}

function createVideoTvSnapshot(
  overrides: Partial<VideoTvStoreSnapshot> = {}
): VideoTvStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-05-01T07:00:00.000Z',
    selectedTvShowId: 5501,
    selectedSeason: 1,
    selectedEpisodeId: 6601,
    tvShows: [
      {
        tvshowid: 5501,
        label: 'Aurora Files',
        title: 'Aurora Files',
        year: 2026,
        episodeCount: 6,
        watchedEpisodeCount: 3,
        unwatchedEpisodes: 3,
        hasUnwatched: true,
        watched: false,
        art: { poster: 'poster:aurora-files' }
      }
    ],
    tvShowDetail: {
      tvshowid: 5501,
      label: 'Aurora Files',
      title: 'Aurora Files',
      year: 2026,
      plot: 'Investigators decode aurora-borne transmissions without exposing raw media paths.',
      genre: ['Mystery', 'Science Fiction'],
      studio: ['Polar Signal'],
      episodeCount: 6,
      watchedEpisodeCount: 3,
      unwatchedEpisodes: 3,
      hasUnwatched: true,
      watched: false,
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: { poster: true, fanart: true }
    },
    seasons: [
      {
        tvshowid: 5501,
        season: 1,
        label: 'Season 1',
        title: 'Season 1',
        episodeCount: 2,
        watchedEpisodeCount: 1,
        unwatchedEpisodes: 1,
        hasUnwatched: true,
        watched: false
      }
    ],
    episodes: [
      {
        episodeid: 6601,
        tvshowid: 5501,
        season: 1,
        episode: 1,
        label: 'Signal Mirror',
        title: 'Signal Mirror',
        runtime: 2700,
        playcount: 0,
        watched: false,
        resume: { position: 600, total: 2700 }
      }
    ],
    episodeDetail: {
      episodeid: 6601,
      tvshowid: 5501,
      season: 1,
      episode: 1,
      label: 'Signal Mirror',
      title: 'Signal Mirror',
      runtime: 2700,
      plot: 'The team follows a safe fixture signal into a mirrored storm.',
      director: ['Rhea Vale'],
      writer: ['Noel Cross'],
      playcount: 0,
      watched: false,
      resume: { position: 600, total: 2700 },
      thumbnailAvailable: true,
      fanartAvailable: false,
      artwork: { thumb: true }
    },
    limits: {
      tvShows: { start: 0, end: 1, total: 1 },
      seasons: { start: 0, end: 1, total: 1 },
      episodes: { start: 0, end: 1, total: 1 }
    },
    seasonArtworkCapability: {
      status: 'unsupported',
      reason: 'Kodi does not expose a proven JSON-RPC season artwork refresh action.'
    },
    lastError: null,
    ...overrides
  };
}

function createEpisodeActionDispatch(
  overrides: Partial<VideoEpisodeActionDispatch> = {}
): VideoEpisodeActionDispatch {
  return {
    playEpisodeItem: vi.fn(),
    resumeEpisodeItem: vi.fn(),
    queueEpisodeItem: vi.fn(),
    streamEpisodeItem: vi.fn(),
    ...overrides
  };
}

function createSeasonArtworkDispatch(
  overrides: Partial<VideoSeasonArtworkDispatch> = {}
): VideoSeasonArtworkDispatch {
  return {
    refreshSeasonArtwork: vi.fn(),
    ...overrides
  };
}

function createSeasonWriteDispatch(
  overrides: Partial<VideoSeasonWriteDispatch> = {}
): VideoSeasonWriteDispatch {
  return {
    markEpisodesWatched: vi.fn(async (items) => ({
      total: items.length,
      succeeded: items.length,
      failed: 0,
      failedItems: []
    })),
    retryFailedVideoWrites: vi.fn(async (items) => ({
      total: items.length,
      succeeded: items.length,
      failed: 0,
      failedItems: []
    })),
    ...overrides
  };
}

function getVideoTvPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-tv-shows-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoTvShowDetailText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-tv-show-detail-shell');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoSeasonDetailText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-season-detail-shell');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoEpisodeDetailText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-episode-detail-shell');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function createMovieActionDispatch(
  overrides: Partial<VideoMovieActionDispatch> = {}
): VideoMovieActionDispatch {
  return {
    playMovieItem: vi.fn(),
    resumeMovieItem: vi.fn(),
    queueMovieItem: vi.fn(),
    ...overrides
  };
}

function createMovieStreamActionDispatch(
  overrides: Partial<VideoMovieStreamDispatch> = {}
): VideoMovieStreamDispatch {
  return {
    streamMovieItem: vi.fn(),
    resumeOnKodi: vi.fn(),
    ...overrides
  };
}

function getVideoMoviesPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-movies-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoDetailPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-movie-detail-shell');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoStreamPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-movie-stream-shell');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoNotFoundText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.video-route-not-found');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getVideoLink(target: HTMLElement, text: string): HTMLAnchorElement {
  const link = Array.from(target.querySelectorAll<HTMLAnchorElement>('a')).find(
    (candidate) => candidate.textContent?.trim() === text
  );
  expect(link).toBeInstanceOf(HTMLAnchorElement);
  return link as HTMLAnchorElement;
}

function getMediaPlaylistsPanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>('.media-playlists-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getMediaPlaylistsPanelText(target: HTMLElement): string {
  return getMediaPlaylistsPanel(target).textContent ?? '';
}

function getMediaFilesPanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>('.media-files-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getMediaFilesPanelText(target: HTMLElement): string {
  return getMediaFilesPanel(target).textContent ?? '';
}

function getMediaSearchPanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>('.media-search-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getMediaSearchPanelText(target: HTMLElement): string {
  return getMediaSearchPanel(target).textContent ?? '';
}

function createMusicBrowseDispatch(
  overrides: Partial<MusicBrowsePanelDispatch> = {}
): MusicBrowsePanelDispatch {
  return {
    browseArtist: vi.fn(),
    browseAlbum: vi.fn(),
    browseGenre: vi.fn(),
    clearSelection: vi.fn(),
    ...overrides
  };
}

function createMusicActionDispatch(
  overrides: Partial<MusicBrowseActionDispatch> = {}
): MusicBrowseActionDispatch {
  return {
    playMusicItem: vi.fn(),
    queueMusicItem: vi.fn(),
    ...overrides
  };
}

function createPlayerSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return {
    refreshStatus: 'idle',
    playbackStatus: 'none',
    lastRefreshReason: 'init',
    lastQueueRefreshReason: null,
    lastUpdatedAt: null,
    activePlayers: [],
    primaryPlayer: null,
    item: null,
    properties: null,
    application: { volume: null, muted: null },
    queue: { playlistid: null, position: null },
    time: { currentSeconds: null, totalSeconds: null },
    lastError: null,
    ...overrides
  };
}

function createLocalPlayerSnapshot(
  overrides: Partial<import('./lib/stores/localPlayer.svelte').LocalPlayerStoreSnapshot> = {}
): import('./lib/stores/localPlayer.svelte').LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'video',
    item: null,
    currentSeconds: 0,
    durationSeconds: null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null,
    ...overrides
  };
}

function createDispatchSnapshot(
  overrides: Partial<PlayerDispatchSnapshot> = {}
): PlayerDispatchSnapshot {
  return {
    mode: 'kodi',
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

function createPlayerDispatch(
  snapshot: PlayerDispatchSnapshot = createDispatchSnapshot()
): PlayerControlsDispatch {
  return {
    snapshot,
    playPause: vi.fn(),
    stop: vi.fn(),
    previous: vi.fn(),
    next: vi.fn(),
    seekPercentage: vi.fn(),
    seekRelativeSeconds: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    setShuffle: vi.fn(),
    setRepeat: vi.fn(),
    setSubtitle: vi.fn(),
    setAudioStream: vi.fn(),
    startLocalPlayback: vi.fn(),
    resumeOnKodi: vi.fn()
  };
}

function getButton(target: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === name
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function getInput(target: HTMLElement, selector: string): HTMLInputElement {
  const input = target.querySelector<HTMLInputElement>(selector);
  expect(input).toBeInstanceOf(HTMLInputElement);
  return input as HTMLInputElement;
}

function getSelect(target: HTMLElement, selector: string): HTMLSelectElement {
  const select = target.querySelector<HTMLSelectElement>(selector);
  expect(select).toBeInstanceOf(HTMLSelectElement);
  return select as HTMLSelectElement;
}

function getNowPlayingPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.now-playing-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getMusicLibraryPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.music-library-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getMusicBrowsePanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>('.music-browse-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getMusicBrowsePanelText(target: HTMLElement): string {
  return getMusicBrowsePanel(target).textContent ?? '';
}

function getButtonByAria(target: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function changeInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function changeSelectValue(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function activeVideoSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return createPlayerSnapshot({
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'command:playPause',
    lastUpdatedAt: '2026-04-28T12:00:00.000Z',
    activePlayers: [{ playerid: 1, type: 'video' }],
    primaryPlayer: { playerid: 1, type: 'video' },
    item: {
      label: 'Sintel',
      title: 'Sintel',
      showtitle: 'Open Movie Project',
      season: 1,
      episode: 2,
      file: 'smb://admin:p@ssword@nas.local/private/Sintel.mkv'
    },
    properties: {
      type: 'video',
      percentage: 42.4,
      shuffled: false,
      repeat: 'off',
      subtitleenabled: true,
      currentsubtitle: { index: 2, name: 'English SDH', language: 'eng' },
      subtitles: [
        { index: 2, name: 'English SDH', language: 'eng' },
        { index: 3, name: 'Deutsch', language: 'deu' }
      ],
      currentaudiostream: { index: 1, name: 'Director commentary', language: 'eng', channels: 2 },
      audiostreams: [
        { index: 0, name: 'Main mix', language: 'eng', channels: 6, codec: 'aac' },
        { index: 1, name: 'Director commentary', language: 'eng', channels: 2, codec: 'aac' }
      ]
    },
    application: { volume: 55, muted: false },
    queue: { playlistid: 1, position: 7 },
    time: { currentSeconds: 75, totalSeconds: 300 },
    ...overrides
  });
}

function renderApp(props: AppProps = {}) {
  document.body.innerHTML = '<div id="app-test-root"></div>';
  document.documentElement.dataset.theme = DEFAULT_THEME;
  const target = document.getElementById('app-test-root');

  if (!target) {
    throw new Error('Missing test root');
  }

  mountedComponent = mount(App, { target, props }) as Record<string, unknown>;
  flushSync();

  return target;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

function createKodiFetchMock(): FetchMock {
  return vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
    async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { id?: number; method?: string };

      switch (body.method) {
        case 'JSONRPC.Ping':
          return jsonResponse({ jsonrpc: '2.0', id: body.id, result: 'pong' });
        case 'JSONRPC.Version':
          return jsonResponse({ jsonrpc: '2.0', id: body.id, result: { version: '2.0' } });
        case 'Application.GetProperties':
          return jsonResponse({
            jsonrpc: '2.0',
            id: body.id,
            result: { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 55, muted: false }
          });
        default:
          return jsonResponse({
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32601, message: 'Method not found' }
          });
      }
    }
  );
}

async function waitForText(target: HTMLElement, text: string): Promise<void> {
  await vi.waitFor(() => {
    expect(target.textContent).toContain(text);
  });
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function setCheckbox(input: HTMLInputElement, checked: boolean): void {
  input.checked = checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function submitHostForm(target: HTMLElement): Promise<void> {
  const form = target.querySelector<HTMLFormElement>('form[aria-label="Kodi host settings"]');
  expect(form).toBeInstanceOf(HTMLFormElement);
  form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  await tick();
}

async function addHost(
  target: HTMLElement,
  {
    label = 'Living Room Kodi',
    host = 'kodi.local',
    port = '8080',
    username = 'kodi',
    password = 'super-secret-password',
    useWebSocket = false
  }: {
    label?: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    useWebSocket?: boolean;
  } = {}
): Promise<void> {
  setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, label);
  setInputValue(target.querySelector<HTMLInputElement>('#host-address')!, host);
  setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, port);
  setInputValue(target.querySelector<HTMLInputElement>('#host-username')!, username);
  setInputValue(target.querySelector<HTMLInputElement>('#host-password')!, password);
  setCheckbox(target.querySelector<HTMLInputElement>('#host-websocket')!, useWebSocket);
  await submitHostForm(target);
}

beforeEach(() => {
  vi.restoreAllMocks();
  configStore.reset();
  hostConnectionStore.destroy();
  connectionStore.destroy();
});

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  hostConnectionStore.destroy();
  localPlayerStore.stop();
  configStore.reset();
  connectionStore.destroy();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('keeps the dashboard route as the default application surface', () => {
    const target = renderApp({ route: { kind: 'dashboard' } });

    expect(target.textContent).toContain('chorus3');
    expect(target.textContent).toContain('Music Library');
    expect(target.textContent).toContain('Kodi host settings');
    expect(target.textContent).not.toContain('Video Movies');
  });

  it('renders the routed video movies grid with safe href detail links', () => {
    const target = renderApp({
      route: { kind: 'videoMovies' },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });
    const panelText = getVideoMoviesPanelText(target);
    const neonLink = getVideoLink(target, 'Neon Harbor');
    const quietLink = getVideoLink(target, 'Quiet Signal');

    expect(panelText).toContain('Video Movies');
    expect(panelText).toContain('2 of 2 movies');
    expect(panelText).toContain('Neon Harbor');
    expect(panelText).toContain('Quiet Signal');
    expect(panelText).toContain('Watched');
    expect(panelText).toContain('Resume available');
    expect(panelText).toContain('2 versions available');
    expect(neonLink.getAttribute('href')).toBe('/video/movies/4401');
    expect(quietLink.getAttribute('href')).toBe('/video/movies/4402');
    expect(target.textContent).not.toContain('Kodi host settings');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('Authorization');
  });

  it('renders routed movie details and a not-found detail shell from injected snapshots', () => {
    const detailTarget = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 4402 },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });
    const detailText = getVideoDetailPanelText(detailTarget);

    expect(detailText).toContain('Quiet Signal');
    expect(detailText).toContain('Movie ID 4402');
    expect(detailText).toContain('Resume available');
    expect(getVideoLink(detailTarget, 'Back to movies').getAttribute('href')).toBe('/video/movies');

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const missingTarget = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 9999 },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    expect(getVideoDetailPanelText(missingTarget)).toContain('Movie ID 9999 is not present');
  });

  it('routes default movie detail actions through PlayerDispatch and QueueDispatch movie seams', async () => {
    const playMovieItem = vi.spyOn(defaultPlayerDispatch, 'playMovieItem').mockResolvedValue();
    const queueMovieItem = vi.spyOn(defaultQueueDispatch, 'queueMovieItem').mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 4402 },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    getButtonByAria(target, 'Play movie Quiet Signal').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Resume movie Quiet Signal').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue movie Quiet Signal').click();
    await tick();
    await tick();

    expect(playMovieItem).toHaveBeenCalledTimes(2);
    expect(playMovieItem).toHaveBeenNthCalledWith(1, { movieid: 4402 });
    expect(playMovieItem).toHaveBeenNthCalledWith(2, { movieid: 4402, resume: true });
    expect(queueMovieItem).toHaveBeenCalledTimes(1);
    expect(queueMovieItem).toHaveBeenCalledWith({ movieid: 4402 });
    expect(getVideoDetailPanelText(target)).toContain('Queued Quiet Signal.');
  });

  it('routes default movie watched writes through videoWriteStore and refreshes movie reads best-effort', async () => {
    const markMovieWatched = vi.spyOn(videoWriteStore, 'markMovieWatched').mockResolvedValue();
    const refreshLibrary = vi.spyOn(videoLibraryStore, 'refresh').mockResolvedValue();
    const refreshMovieDetail = vi
      .spyOn(videoMovieDetailStore, 'refreshMovieDetail')
      .mockRejectedValue(new Error('refresh failed after write'));
    const target = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 4402 },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    getButtonByAria(target, 'Mark movie Quiet Signal watched').click();
    await tick();
    await tick();

    expect(markMovieWatched).toHaveBeenCalledWith({ movieid: 4402, label: 'Quiet Signal' }, true);
    expect(refreshLibrary).toHaveBeenCalledWith('command:videoWrite');
    expect(refreshMovieDetail).toHaveBeenCalledWith(4402, 'command:videoWrite');
    await waitForText(target, 'Marked Quiet Signal watched.');
  });

  it('preserves injected movie action dispatches for fixture mode without touching defaults', async () => {
    const playMovieItem = vi.spyOn(defaultPlayerDispatch, 'playMovieItem').mockResolvedValue();
    const queueMovieItem = vi.spyOn(defaultQueueDispatch, 'queueMovieItem').mockResolvedValue();
    const videoMovieActionDispatch = createMovieActionDispatch();
    const target = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 4401 },
      videoLibrarySnapshot: createVideoLibrarySnapshot(),
      videoMovieActionDispatch
    });

    getButtonByAria(target, 'Play movie Neon Harbor').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue movie Neon Harbor').click();
    await tick();
    await tick();

    expect(videoMovieActionDispatch.playMovieItem).toHaveBeenCalledWith({ movieid: 4401 });
    expect(videoMovieActionDispatch.queueMovieItem).toHaveBeenCalledWith({ movieid: 4401 });
    expect(playMovieItem).not.toHaveBeenCalled();
    expect(queueMovieItem).not.toHaveBeenCalled();
  });

  it('renders fixture-style rich movie detail props through the real App route shape', async () => {
    const videoMovieActionDispatch = createMovieActionDispatch();
    const target = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 4401 },
      videoLibrarySnapshot: createVideoLibrarySnapshot(),
      videoMovieDetailSnapshot: {
        refreshStatus: 'ready',
        lastRefreshReason: 'manual',
        lastUpdatedAt: '2026-05-01T07:00:00.000Z',
        selectedMovieId: 4401,
        detail: {
          movieid: 4401,
          label: 'Neon Harbor',
          title: 'Neon Harbor',
          year: 2024,
          runtime: 6420,
          plot: 'A courier crosses a rain-lit city to protect a copied memory.',
          tagline: 'One night can rewrite a city.',
          genre: ['Science Fiction', 'Thriller'],
          director: ['Mara Voss'],
          studio: ['Signal House'],
          rating: 7.8,
          userrating: 8,
          thumbnailAvailable: true,
          fanartAvailable: true,
          artwork: { poster: true, fanart: true },
          playcount: 1,
          watched: true,
          resume: { position: 0, total: 6420 },
          versions: {
            status: 'ready',
            selectedId: 2,
            items: [
              { id: 1, label: 'Theatrical cut' },
              { id: 2, label: 'Director commentary cut' }
            ]
          }
        },
        lastError: null
      },
      videoMovieActionDispatch
    });

    const detailText = getVideoDetailPanelText(target);

    expect(detailText).toContain('Neon Harbor');
    expect(detailText).toContain('A courier crosses a rain-lit city to protect a copied memory.');
    expect(detailText).toContain('One night can rewrite a city.');
    expect(detailText).toContain('Science Fiction, Thriller');
    expect(detailText).toContain('Poster artwork available');
    expect(detailText).toContain('2 versions available');
    expect(target.querySelector('#video-movie-version')).toBeInstanceOf(HTMLSelectElement);
    getButtonByAria(target, 'Play movie Neon Harbor').click();
    await tick();
    await tick();
    expect(videoMovieActionDispatch.playMovieItem).toHaveBeenCalledWith({ movieid: 4401 });
  });

  it('renders routed movie stream shell with Local runtime status and injected stream recovery dispatch', async () => {
    const videoMovieStreamActionDispatch = createMovieStreamActionDispatch();
    const videoLibrarySnapshot = createVideoLibrarySnapshot();
    videoLibrarySnapshot.movies[0] = {
      ...videoLibrarySnapshot.movies[0],
      resume: { position: 1830, total: 6420 }
    };
    const target = renderApp({
      route: { kind: 'videoMovieStream', movieid: 4401 },
      videoLibrarySnapshot,
      localPlayerSnapshot: createLocalPlayerSnapshot({
        status: 'paused',
        mediaKind: 'video',
        item: { movieid: 4401, label: 'Neon Harbor', title: 'Neon Harbor', type: 'movie' },
        currentSeconds: 1830,
        durationSeconds: 6420,
        resumeAvailable: true,
        kodiPausedForLocal: true
      }),
      playerDispatch: createPlayerDispatch(
        createDispatchSnapshot({ mode: 'local', lastCommand: 'streamMovieItem' })
      ),
      videoMovieStreamActionDispatch
    });
    const streamText = getVideoStreamPanelText(target);

    expect(streamText).toContain('Browser stream');
    expect(streamText).toContain('Neon Harbor');
    expect(streamText).toContain('Local browser playback is paused.');
    expect(streamText).toContain('Resume point available at 30:30.');
    expect(target.querySelector('video.local-media-runtime.fullscreen')).toBeInstanceOf(
      HTMLVideoElement
    );
    expect(getButtonByAria(target, 'Play in browser').disabled).toBe(false);
    expect(getButtonByAria(target, 'Resume in browser').disabled).toBe(false);
    expect(getButtonByAria(target, 'Retry').disabled).toBe(false);
    expect(getButtonByAria(target, 'Send to Kodi').disabled).toBe(false);

    getButtonByAria(target, 'Play in browser').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Resume in browser').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Send to Kodi').click();
    await tick();
    await tick();

    expect(videoMovieStreamActionDispatch.streamMovieItem).toHaveBeenNthCalledWith(1, {
      movieid: 4401
    });
    expect(videoMovieStreamActionDispatch.streamMovieItem).toHaveBeenNthCalledWith(2, {
      movieid: 4401,
      resume: true
    });
    expect(videoMovieStreamActionDispatch.resumeOnKodi).toHaveBeenCalledTimes(1);
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('Authorization');
    expect(target.textContent).not.toContain('localStorage');
  });

  it('routes default movie stream actions through PlayerDispatch stream and resume seams', async () => {
    const streamMovieItem = vi.spyOn(defaultPlayerDispatch, 'streamMovieItem').mockResolvedValue();
    const resumeOnKodi = vi.spyOn(defaultPlayerDispatch, 'resumeOnKodi').mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoMovieStream', movieid: 4402 },
      videoLibrarySnapshot: createVideoLibrarySnapshot(),
      localPlayerSnapshot: createLocalPlayerSnapshot({
        resumeAvailable: true,
        kodiPausedForLocal: true
      })
    });

    getButtonByAria(target, 'Play in browser').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Resume in browser').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Send to Kodi').click();
    await tick();
    await tick();

    expect(streamMovieItem).toHaveBeenNthCalledWith(1, { movieid: 4402 });
    expect(streamMovieItem).toHaveBeenNthCalledWith(2, { movieid: 4402, resume: true });
    expect(resumeOnKodi).toHaveBeenCalledTimes(1);
  });

  it('renders routed TV grid, show, season, and episode shells from injected snapshots', () => {
    const gridTarget = renderApp({
      route: { kind: 'videoTvShows' },
      videoLibrarySnapshot: createVideoLibrarySnapshot({
        tvShows: createVideoTvSnapshot().tvShows,
        limits: { movies: { start: 0, end: 2, total: 2 }, tvShows: { start: 0, end: 1, total: 1 } }
      })
    });

    expect(getVideoTvPanelText(gridTarget)).toContain('TV Shows');
    expect(getVideoTvPanelText(gridTarget)).toContain('Aurora Files');
    expect(getVideoLink(gridTarget, 'Aurora Files').getAttribute('href')).toBe('/video/tv/5501');

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const showTarget = renderApp({
      route: { kind: 'videoTvShowDetail', tvshowid: 5501 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    expect(getVideoTvShowDetailText(showTarget)).toContain('Aurora Files');
    expect(getVideoTvShowDetailText(showTarget)).toContain('Season 1');
    expect(getVideoLink(showTarget, 'Season 1').getAttribute('href')).toBe(
      '/video/tv/5501/seasons/1'
    );

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const seasonTarget = renderApp({
      route: { kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    expect(getVideoSeasonDetailText(seasonTarget)).toContain('Season 1');
    expect(getVideoSeasonDetailText(seasonTarget)).toContain('Signal Mirror');
    expect(getVideoSeasonDetailText(seasonTarget)).toContain('Season artwork unsupported');
    expect(getVideoLink(seasonTarget, 'Signal Mirror').getAttribute('href')).toBe(
      '/video/tv/5501/seasons/1/episodes/6601'
    );

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const episodeTarget = renderApp({
      route: { kind: 'videoEpisodeDetail', tvshowid: 5501, season: 1, episodeid: 6601 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    expect(getVideoEpisodeDetailText(episodeTarget)).toContain('Signal Mirror');
    expect(getVideoEpisodeDetailText(episodeTarget)).toContain('Episode ID 6601');
    expect(getVideoEpisodeDetailText(episodeTarget)).toContain('Resume available');
    expect(episodeTarget.textContent).not.toContain('smb://');
    expect(episodeTarget.textContent).not.toContain('Authorization');
  });

  it('routes default and injected TV episode/artwork actions through App seams', async () => {
    const playEpisodeItem = vi.spyOn(defaultPlayerDispatch, 'playEpisodeItem').mockResolvedValue();
    const streamEpisodeItem = vi
      .spyOn(defaultPlayerDispatch, 'streamEpisodeItem')
      .mockResolvedValue();
    const queueEpisodeItem = vi.spyOn(defaultQueueDispatch, 'queueEpisodeItem').mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoEpisodeDetail', tvshowid: 5501, season: 1, episodeid: 6601 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    getButtonByAria(target, 'Play episode Signal Mirror').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Resume episode Signal Mirror').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue episode Signal Mirror').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Stream episode Signal Mirror').click();
    await tick();
    await tick();

    expect(playEpisodeItem).toHaveBeenNthCalledWith(1, { episodeid: 6601 });
    expect(playEpisodeItem).toHaveBeenNthCalledWith(2, { episodeid: 6601, resume: true });
    expect(queueEpisodeItem).toHaveBeenCalledWith({ episodeid: 6601 });
    expect(streamEpisodeItem).toHaveBeenCalledWith({ episodeid: 6601 });

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const injectedEpisodeDispatch = createEpisodeActionDispatch();
    const injectedArtworkDispatch = createSeasonArtworkDispatch();
    const injectedEpisodeTarget = renderApp({
      route: { kind: 'videoEpisodeDetail', tvshowid: 5501, season: 1, episodeid: 6601 },
      videoTvSnapshot: createVideoTvSnapshot(),
      videoEpisodeActionDispatch: injectedEpisodeDispatch
    });
    getButtonByAria(injectedEpisodeTarget, 'Queue episode Signal Mirror').click();
    await tick();
    await tick();
    expect(injectedEpisodeDispatch.queueEpisodeItem).toHaveBeenCalledWith({ episodeid: 6601 });

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const injectedSeasonTarget = renderApp({
      route: { kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 },
      videoTvSnapshot: createVideoTvSnapshot(),
      videoSeasonArtworkDispatch: injectedArtworkDispatch
    });
    getButtonByAria(injectedSeasonTarget, 'Refresh artwork for Aurora Files season 1').click();
    await tick();
    await tick();
    expect(injectedArtworkDispatch.refreshSeasonArtwork).toHaveBeenCalledWith({
      tvshowid: 5501,
      season: 1
    });
  });

  it('routes default episode watched writes through videoWriteStore and refreshes episode detail', async () => {
    const markEpisodeWatched = vi.spyOn(videoWriteStore, 'markEpisodeWatched').mockResolvedValue();
    const refreshEpisodeDetail = vi.spyOn(videoTvStore, 'refreshEpisodeDetail').mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoEpisodeDetail', tvshowid: 5501, season: 1, episodeid: 6601 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    getButtonByAria(target, 'Mark episode Signal Mirror watched').click();
    await tick();
    await tick();

    expect(markEpisodeWatched).toHaveBeenCalledWith(
      { episodeid: 6601, label: 'Signal Mirror' },
      true
    );
    expect(refreshEpisodeDetail).toHaveBeenCalledWith(6601, 'command:videoWrite');
    await waitForText(target, 'Marked Signal Mirror watched.');
  });

  it('routes default season batch writes through videoWriteStore and refreshes season episodes after partial writes', async () => {
    const markEpisodesWatched = vi.spyOn(videoWriteStore, 'markEpisodesWatched').mockResolvedValue();
    const refreshSeasonEpisodes = vi.spyOn(videoTvStore, 'refreshSeasonEpisodes').mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    getButtonByAria(target, 'Mark season watched').click();
    await tick();
    await tick();

    expect(markEpisodesWatched).toHaveBeenCalledWith(
      [
        { episodeid: 6601, label: 'Signal Mirror' }
      ],
      true
    );
    expect(refreshSeasonEpisodes).toHaveBeenCalledWith(5501, 1, 'command:videoWrite');
  });

  it('preserves injected season write dispatches without touching the default video write store', async () => {
    const markEpisodesWatched = vi.spyOn(videoWriteStore, 'markEpisodesWatched').mockResolvedValue();
    const videoSeasonWriteDispatch = createSeasonWriteDispatch();
    const target = renderApp({
      route: { kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 },
      videoTvSnapshot: createVideoTvSnapshot(),
      videoSeasonWriteDispatch
    });

    getButtonByAria(target, 'Mark season watched').click();
    await tick();
    await tick();

    expect(videoSeasonWriteDispatch.markEpisodesWatched).toHaveBeenCalledWith(
      [{ episodeid: 6601, label: 'Signal Mirror' }],
      true
    );
    expect(markEpisodesWatched).not.toHaveBeenCalled();
  });

  it('renders unknown video route recovery links for movies and TV', () => {
    const target = renderApp({
      route: { kind: 'videoUnknown', pathLabel: '/video/[redacted]/clips' },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    expect(getVideoLink(target, 'Movies').getAttribute('href')).toBe('/video/movies');
    expect(getVideoLink(target, 'TV shows').getAttribute('href')).toBe('/video/tv');
  });

  it('renders unknown video routes as sanitized in-app not found UI with a movies link', () => {
    const target = renderApp({
      route: { kind: 'videoUnknown', pathLabel: '/video/[redacted]/clips' },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });
    const notFoundText = getVideoNotFoundText(target);

    expect(notFoundText).toContain('Video route not found');
    expect(notFoundText).toContain('/video/[redacted]/clips');
    expect(getVideoLink(target, 'Movies').getAttribute('href')).toBe('/video/movies');
    expect(notFoundText).not.toContain('Authorization');
    expect(notFoundText).not.toContain('Basic');
    expect(notFoundText).not.toContain('smb://');
  });

  it('renders default no-player Now Playing controls as disabled without dispatching', () => {
    const dispatch = createPlayerDispatch();
    const target = renderApp({ playerSnapshot: createPlayerSnapshot(), playerDispatch: dispatch });

    expect(target.textContent).toContain('Now playing');
    expect(target.textContent).toContain('Unknown title');
    expect(target.textContent).toContain('No active Kodi player is available.');
    expect(target.textContent).toContain(
      'No active Kodi player is available. Controls are disabled until playback starts.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getButton(target, 'Next').disabled).toBe(true);
    expect(getInput(target, '#now-playing-seek').disabled).toBe(true);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(true);
    expect(dispatch.playPause).not.toHaveBeenCalled();
  });

  it('renders multiple-player Now Playing controls as disabled with explanatory copy', () => {
    const target = renderApp({
      playerSnapshot: createPlayerSnapshot({
        refreshStatus: 'ready',
        playbackStatus: 'multiple',
        activePlayers: [
          { playerid: 1, type: 'video' },
          { playerid: 2, type: 'audio' }
        ],
        primaryPlayer: { playerid: 1, type: 'video' },
        item: { label: 'Concert Film' }
      }),
      playerDispatch: createPlayerDispatch()
    });

    expect(target.textContent).toContain('Concert Film');
    expect(target.textContent).toContain(
      'Multiple Kodi players are active. Choose one player before sending controls.'
    );
    expect(target.textContent).toContain(
      'Multiple Kodi players are active. Controls are disabled until there is one active player.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getButton(target, 'Next').disabled).toBe(true);
  });

  it('renders active video metadata, progress, volume, queue context, streams, and no raw file paths', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch: createPlayerDispatch()
    });

    expect(target.textContent).toContain('Now playing');
    expect(target.textContent).toContain('Sintel');
    expect(target.textContent).toContain('Open Movie Project');
    expect(target.textContent).toContain('Season 1, episode 2');
    expect(target.textContent).toContain('01:15');
    expect(target.textContent).toContain('05:00');
    expect(target.textContent).toContain('42%');
    expect(target.textContent).toContain('Volume 55');
    expect(target.textContent).toContain('Muted: no');
    expect(target.textContent).toContain('Playlist 1 · position 7');
    expect(target.textContent).toContain(
      'Player state ready. Last updated 2026-04-28T12:00:00.000Z.'
    );
    expect(target.textContent).toContain('English SDH · eng');
    expect(target.textContent).toContain('Director commentary · eng · 2ch');
    expect(getInput(target, '#now-playing-seek').value).toBe('42');
    expect(getInput(target, '#now-playing-volume').value).toBe('55');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('private/Sintel.mkv');
  });

  it('routes playback, seek, volume, shuffle, repeat, subtitle, and audio controls through injected dispatch', async () => {
    const dispatch = createPlayerDispatch();
    const target = renderApp({ playerSnapshot: activeVideoSnapshot(), playerDispatch: dispatch });

    getButton(target, 'Play or pause').click();
    getButton(target, 'Next').click();
    changeInputValue(getInput(target, '#now-playing-seek'), '64');
    changeInputValue(getInput(target, '#now-playing-volume'), '71');
    getButton(target, 'Toggle mute').click();
    changeSelectValue(getSelect(target, '#now-playing-shuffle'), 'true');
    changeSelectValue(getSelect(target, '#now-playing-repeat'), 'all');
    changeSelectValue(getSelect(target, '#now-playing-subtitle'), '3');
    changeSelectValue(getSelect(target, '#now-playing-audio'), '0');
    await tick();

    expect(dispatch.playPause).toHaveBeenCalledTimes(1);
    expect(dispatch.next).toHaveBeenCalledTimes(1);
    expect(dispatch.seekPercentage).toHaveBeenCalledWith(64);
    expect(dispatch.setVolume).toHaveBeenCalledWith(71);
    expect(dispatch.toggleMute).toHaveBeenCalledTimes(1);
    expect(dispatch.setShuffle).toHaveBeenCalledWith(true);
    expect(dispatch.setRepeat).toHaveBeenCalledWith('all');
    expect(dispatch.setSubtitle).toHaveBeenCalledWith(3);
    expect(dispatch.setAudioStream).toHaveBeenCalledWith(0);
  });

  it('renders running controls disabled to constrain rapid command bursts', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch: createPlayerDispatch(
        createDispatchSnapshot({ commandStatus: 'running', lastCommand: 'seekPercentage' })
      )
    });

    expect(target.textContent).toContain('Running seek percentage.');
    expect(target.textContent).toContain(
      'A Kodi command is running. Controls are disabled until it finishes.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getInput(target, '#now-playing-volume').disabled).toBe(true);
  });

  it('renders dispatch and refresh errors without secret-like details or raw endpoints', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot({
        refreshStatus: 'error',
        lastError: {
          source: 'http',
          code: 'auth',
          message: 'Kodi rejected configured credentials while calling Player.GetItem.',
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: true
          }
        }
      }),
      playerDispatch: createPlayerDispatch(
        createDispatchSnapshot({
          commandStatus: 'error',
          lastCommand: 'playPause',
          lastError: {
            source: 'http',
            code: 'auth',
            message:
              'Authorization: Basic admin:p@ssword failed for http://admin:p@ssword@kodi.local:8080/jsonrpc via localStorage.',
            endpoint: {
              protocol: 'http:',
              host: 'kodi.local',
              port: 8080,
              path: '/jsonrpc',
              timeoutMs: 5000,
              hasCredentials: true
            }
          }
        })
      )
    });

    const panelText = getNowPlayingPanelText(target);

    expect(panelText).toContain('credentials [redacted]');
    expect(panelText).toContain('[redacted-url]');
    expect(panelText).toContain('browser storage');
    expect(panelText).toContain('Sintel');
    expect(panelText).not.toContain('p@ssword');
    expect(panelText).not.toContain('admin:p@ssword');
    expect(panelText).not.toContain('http://kodi.local:8080/jsonrpc');
    expect(panelText).not.toContain('localStorage');
  });

  it('renders active audio snapshots with control affordances and missing stream indexes safely', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot({
        activePlayers: [{ playerid: 0, type: 'audio' }],
        primaryPlayer: { playerid: 0, type: 'audio' },
        item: {
          label: 'Arrival',
          artist: ['Max Richter'],
          album: 'Sleep',
          file: '/music/private/arrival.flac'
        },
        properties: {
          type: 'audio',
          percentage: 5,
          shuffled: true,
          repeat: 'all',
          subtitleenabled: false,
          audiostreams: [{ name: 'Stereo', language: 'eng', channels: 2 }]
        }
      }),
      playerDispatch: createPlayerDispatch()
    });

    expect(target.textContent).toContain('Arrival');
    expect(target.textContent).toContain('Max Richter');
    expect(target.textContent).toContain('Sleep');
    expect(target.textContent).toContain('Subtitles off');
    expect(target.textContent).toContain('Stereo · eng · 2ch');
    expect(getButton(target, 'Play or pause').disabled).toBe(false);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(false);
    expect(target.textContent).not.toContain('/music/private/arrival.flac');
  });

  it('renders injected Music Library artist, album, song, genre, recent, and top snapshots', () => {
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'Nina Simone', genre: ['Soul', 'Jazz'] }],
        albums: [
          {
            albumid: 2,
            label: 'Pastel Blues',
            title: 'Pastel Blues',
            artist: ['Nina Simone'],
            year: 1965
          }
        ],
        songs: [
          {
            songid: 3,
            label: 'Sinnerman',
            title: 'Sinnerman',
            artist: ['Nina Simone'],
            album: 'Pastel Blues',
            duration: 622,
            track: 8,
            playcount: 2
          }
        ],
        recentlyAddedSongs: [
          {
            songid: 5,
            label: 'Feeling Good',
            title: 'Feeling Good',
            artist: ['Nina Simone'],
            album: 'I Put a Spell on You',
            dateadded: '2026-04-30 09:15:00'
          }
        ],
        recentlyPlayedSongs: [
          {
            songid: 6,
            label: 'I Put a Spell on You',
            title: 'I Put a Spell on You',
            artist: ['Nina Simone'],
            album: 'I Put a Spell on You',
            lastplayed: '2026-04-29 22:04:00'
          }
        ],
        mostPlayedSongs: [
          {
            songid: 7,
            label: 'My Baby Just Cares for Me',
            title: 'My Baby Just Cares for Me',
            artist: ['Nina Simone'],
            album: 'Little Girl Blue',
            playcount: 12
          }
        ],
        genres: [{ genreid: 4, label: 'Soul', title: 'Soul' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 },
          recentlyAddedSongs: { start: 0, end: 1, total: 1 },
          recentlyPlayedSongs: { start: 0, end: 1, total: 1 },
          mostPlayedSongs: { start: 0, end: 1, total: 1 },
          genres: { start: 0, end: 1, total: 1 }
        }
      })
    });

    expect(target.textContent).toContain('Music Library');
    expect(target.textContent).toContain(
      'Read-only snapshots from Kodi artists, albums, songs, and genres.'
    );
    expect(target.textContent).toContain('Nina Simone');
    expect(target.textContent).toContain('Pastel Blues');
    expect(target.textContent).toContain('Sinnerman');
    expect(target.textContent).toContain('Soul');
    expect(target.textContent).toContain('10:22');
    expect(target.textContent).toContain('Played 2 times');
    expect(target.textContent).toContain('Recent & Top Music');
    expect(target.textContent).toContain('Feeling Good');
    expect(target.textContent).toContain('Added 2026-04-30 09:15:00');
    expect(target.textContent).toContain('I Put a Spell on You');
    expect(target.textContent).toContain('Played 2026-04-29 22:04:00');
    expect(target.textContent).toContain('My Baby Just Cares for Me');
    expect(target.textContent).toContain('Played 12 times');
    expect(target.textContent).not.toContain('Library sync');
    expect(target.textContent).not.toContain('paused until a real Kodi endpoint');
  });

  it('renders injected Music Library error snapshots without secret-like details', () => {
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        isEmpty: false,
        artists: [{ artistid: 1, label: 'smb://nas.local/private/artist' }],
        albums: [{ albumid: 2, label: 'http://admin:p@ssword@kodi.local/private/album' }],
        songs: [
          {
            songid: 3,
            label: 'Safe Song',
            title: 'Safe Song',
            artist: ['admin:p@ssword'],
            album: 'http://kodi.local/private/album',
            duration: 90
          }
        ],
        genres: [{ genreid: 4, label: 'Authorization: Basic abc123' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 },
          genres: { start: 0, end: 1, total: 1 }
        },
        lastError: {
          source: 'http',
          code: 'auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@kodi.local/jsonrpc with raw response body from localStorage.',
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: true
          }
        }
      })
    });

    const musicPanelText = getMusicLibraryPanelText(target);

    expect(musicPanelText).toContain('credentials [redacted]');
    expect(musicPanelText).toContain('[redacted-url]');
    expect(musicPanelText).toContain('response body [redacted]');
    expect(musicPanelText).toContain('browser storage');
    expect(musicPanelText).toContain('Safe Song');
    expect(musicPanelText).toContain('Unknown artist');
    expect(musicPanelText).toContain('Unknown album');
    expect(musicPanelText).not.toContain('smb://');
    expect(musicPanelText).not.toContain('admin:p@ssword');
    expect(musicPanelText).not.toContain('p@ssword');
    expect(musicPanelText).not.toContain('Authorization');
    expect(musicPanelText).not.toContain('Basic abc123');
    expect(musicPanelText).not.toContain('localStorage');
    expect(musicPanelText).not.toContain('raw response body');
    expect(musicPanelText).not.toContain('http://kodi.local');
  });

  it('renders injected Music Browse artist, album, genre, song identity details, and music actions', () => {
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'Nina Simone', genre: ['Soul', 'Jazz'] }],
        albums: [
          {
            albumid: 2,
            label: 'Pastel Blues',
            title: 'Pastel Blues',
            artist: ['Nina Simone'],
            year: 1965
          }
        ],
        songs: [],
        genres: [{ genreid: 4, label: 'Soul', title: 'Soul' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 1, total: 1 }
        }
      }),
      musicBrowseSnapshot: createMusicBrowseSnapshot({
        refreshStatus: 'ready',
        lastRefreshReason: 'artist:1',
        lastUpdatedAt: '2026-04-29T13:00:00.000Z',
        selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
        albums: [
          {
            albumid: 2,
            label: 'Pastel Blues',
            title: 'Pastel Blues',
            artist: ['Nina Simone'],
            year: 1965
          }
        ],
        songs: [
          {
            songid: 3,
            label: 'Sinnerman',
            title: 'Sinnerman',
            artist: ['Nina Simone'],
            album: 'Pastel Blues',
            duration: 622,
            track: 8,
            playcount: 2
          }
        ],
        limits: {
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false
      })
    });

    const browsePanel = getMusicBrowsePanel(target);
    const browseText = browsePanel.textContent ?? '';

    expect(browseText).toContain('Browse Music');
    expect(browseText).toContain('Nina Simone');
    expect(browseText).toContain('Pastel Blues');
    expect(browseText).toContain('Soul');
    expect(browseText).toContain('Artist: Nina Simone');
    expect(browseText).toContain('Songs for Nina Simone');
    expect(browseText).toContain('Sinnerman');
    expect(browseText).toContain('Song ID 3');
    expect(browsePanel.querySelector('[data-songid="3"]')?.textContent).toContain('Song ID 3');
    expect(browsePanel.querySelector('button[aria-label="Play song Sinnerman"]')).toBeInstanceOf(
      HTMLButtonElement
    );
    expect(browsePanel.querySelector('button[aria-label="Queue song Sinnerman"]')).toBeInstanceOf(
      HTMLButtonElement
    );
    expect(browseText).not.toContain('Play or pause');
    expect(browseText).not.toContain('Clear queue');
  });

  it('renders injected Music Browse error snapshots without secret-like details', () => {
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'smb://nas.local/private/artist' }],
        albums: [{ albumid: 2, label: 'http://admin:p@ssword@kodi.local/private/album' }],
        genres: [{ genreid: 4, label: 'Authorization: Basic abc123' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 1, total: 1 }
        }
      }),
      musicBrowseSnapshot: createMusicBrowseSnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        lastUpdatedAt: '2026-04-29T13:00:00.000Z',
        selection: { kind: 'genre', id: 4, label: 'smb://nas.local/private/genre' },
        albums: [{ albumid: 2, label: 'Safe Album', title: 'Safe Album' }],
        songs: [{ songid: 3, label: 'Safe Song', title: 'Safe Song' }],
        limits: {
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false,
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@kodi.local/jsonrpc with raw response body from localStorage and smb://nas/private/song.flac.'
        }
      })
    });

    const browseText = getMusicBrowsePanelText(target);

    expect(browseText).toContain('credentials [redacted]');
    expect(browseText).toContain('[redacted-url]');
    expect(browseText).toContain('response body [redacted]');
    expect(browseText).toContain('browser storage');
    expect(browseText).toContain('Safe Album');
    expect(browseText).toContain('Safe Song');
    expect(browseText).toContain('Unknown artist');
    expect(browseText).toContain('Unknown album');
    expect(browseText).toContain('Unknown genre');
    expect(browseText).not.toContain('smb://');
    expect(browseText).not.toContain('admin:p@ssword');
    expect(browseText).not.toContain('p@ssword');
    expect(browseText).not.toContain('Authorization');
    expect(browseText).not.toContain('Basic abc123');
    expect(browseText).not.toContain('localStorage');
    expect(browseText).not.toContain('raw response body');
    expect(browseText).not.toContain('http://kodi.local');
  });

  it('routes Music Browse artist, album, genre, and clear controls through injected dispatch once', async () => {
    const musicBrowseDispatch = createMusicBrowseDispatch();
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'Nina Simone', genre: ['Soul'] }],
        albums: [{ albumid: 2, label: 'Pastel Blues', title: 'Pastel Blues' }],
        genres: [{ genreid: 4, label: 'Soul', title: 'Soul' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 1, total: 1 }
        }
      }),
      musicBrowseSnapshot: createMusicBrowseSnapshot({
        refreshStatus: 'ready',
        lastRefreshReason: 'album:2',
        selection: { kind: 'album', id: 2, label: 'Pastel Blues' },
        songs: [{ songid: 3, label: 'Sinnerman', title: 'Sinnerman' }],
        limits: {
          albums: { start: 0, end: 0, total: 0 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false
      }),
      musicBrowseDispatch
    });

    getButtonByAria(target, 'Browse artist Nina Simone').click();
    getButtonByAria(target, 'Browse album Pastel Blues').click();
    getButtonByAria(target, 'Browse genre Soul').click();
    getButtonByAria(target, 'Clear music browse selection').click();
    await tick();

    expect(musicBrowseDispatch.browseArtist).toHaveBeenCalledTimes(1);
    expect(musicBrowseDispatch.browseArtist).toHaveBeenCalledWith({
      artistid: 1,
      label: 'Nina Simone'
    });
    expect(musicBrowseDispatch.browseAlbum).toHaveBeenCalledTimes(1);
    expect(musicBrowseDispatch.browseAlbum).toHaveBeenCalledWith({
      albumid: 2,
      label: 'Pastel Blues'
    });
    expect(musicBrowseDispatch.browseGenre).toHaveBeenCalledTimes(1);
    expect(musicBrowseDispatch.browseGenre).toHaveBeenCalledWith({ genreid: 4, label: 'Soul' });
    expect(musicBrowseDispatch.clearSelection).toHaveBeenCalledTimes(1);
  });

  it('routes Music Browse play and queue controls through injected music action dispatch once', async () => {
    const musicActionDispatch = createMusicActionDispatch();
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'Nina Simone', genre: ['Soul'] }],
        albums: [{ albumid: 2, label: 'Pastel Blues', title: 'Pastel Blues' }],
        genres: [{ genreid: 4, label: 'Soul', title: 'Soul' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 1, total: 1 }
        }
      }),
      musicBrowseSnapshot: createMusicBrowseSnapshot({
        refreshStatus: 'ready',
        lastRefreshReason: 'artist:1',
        selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
        albums: [{ albumid: 2, label: 'Pastel Blues', title: 'Pastel Blues' }],
        songs: [{ songid: 3, label: 'Sinnerman', title: 'Sinnerman' }],
        limits: {
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false
      }),
      musicActionDispatch
    });

    getButtonByAria(target, 'Play artist Nina Simone').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue artist Nina Simone').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Play album Pastel Blues').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue album Pastel Blues').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Play song Sinnerman').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue song Sinnerman').click();
    await tick();

    expect(musicActionDispatch.playMusicItem).toHaveBeenCalledTimes(3);
    expect(musicActionDispatch.playMusicItem).toHaveBeenNthCalledWith(1, {
      kind: 'artist',
      artistid: 1
    });
    expect(musicActionDispatch.playMusicItem).toHaveBeenNthCalledWith(2, {
      kind: 'album',
      albumid: 2
    });
    expect(musicActionDispatch.playMusicItem).toHaveBeenNthCalledWith(3, {
      kind: 'song',
      songid: 3
    });
    expect(musicActionDispatch.queueMusicItem).toHaveBeenCalledTimes(3);
    expect(musicActionDispatch.queueMusicItem).toHaveBeenNthCalledWith(1, {
      kind: 'artist',
      artistid: 1
    });
    expect(musicActionDispatch.queueMusicItem).toHaveBeenNthCalledWith(2, {
      kind: 'album',
      albumid: 2
    });
    expect(musicActionDispatch.queueMusicItem).toHaveBeenNthCalledWith(3, {
      kind: 'song',
      songid: 3
    });
  });

  it('lets App-level injected music action dispatch override production defaults and redacts action failures', async () => {
    const musicActionDispatch = createMusicActionDispatch({
      playMusicItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/song.flac'
        );
      })
    });
    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'http://admin:p@ssword@example.test/artist' }],
        albums: [{ albumid: 2, label: 'Pastel Blues', title: 'Pastel Blues' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 0, total: 0 }
        }
      }),
      musicActionDispatch
    });

    getButtonByAria(target, 'Play album Pastel Blues').click();
    await tick();
    await tick();

    const browseText = getMusicBrowsePanelText(target);
    expect(musicActionDispatch.playMusicItem).toHaveBeenCalledTimes(1);
    expect(musicActionDispatch.playMusicItem).toHaveBeenCalledWith({ kind: 'album', albumid: 2 });
    expect(browseText).toContain('Could not play album Pastel Blues');
    expect(browseText).toContain('credentials [redacted]');
    expect(browseText).toContain('[redacted-url]');
    expect(browseText).toContain('response body [redacted]');
    expect(browseText).toContain('browser storage');
    expect(browseText).toContain('Unknown artist');
    expect(browseText).not.toContain('admin:p@ssword');
    expect(browseText).not.toContain('Authorization');
    expect(browseText).not.toContain('Basic abc123');
    expect(browseText).not.toContain('localStorage');
    expect(browseText).not.toContain('raw response body');
    expect(browseText).not.toContain('http://admin');
    expect(browseText).not.toContain('smb://');
  });

  it('renders injected Media Search results without live Kodi and redacts hostile text', () => {
    const target = renderApp({
      mediaSearchSnapshot: createMediaSearchSnapshot({
        results: {
          artists: [{ kind: 'artist', artistid: 1, label: 'smb://nas.local/private/artist' }],
          albums: [
            {
              kind: 'album',
              albumid: 2,
              label: 'http://admin:p@ssword@example.test/private/album',
              title: 'Pastel Blues'
            }
          ],
          songs: [{ kind: 'song', songid: 3, label: 'Safe Song', title: 'Safe Song' }],
          genres: [{ kind: 'genre', genreid: 4, label: 'Authorization: Basic abc123' }]
        }
      }),
      mediaSearchDispatch: createMediaSearchDispatch(),
      mediaSearchActionDispatch: createMediaSearchActionDispatch()
    });

    const searchText = getMediaSearchPanelText(target);

    expect(searchText).toContain('Media Search');
    expect(searchText).toContain('Music results for nina.');
    expect(searchText).toContain('Artists');
    expect(searchText).toContain('Albums');
    expect(searchText).toContain('Songs');
    expect(searchText).toContain('Genres');
    expect(searchText).toContain('Unknown artist');
    expect(searchText).toContain('Pastel Blues');
    expect(searchText).toContain('Safe Song');
    expect(searchText).toContain('credentials [redacted]');
    expect(searchText).not.toContain('smb://');
    expect(searchText).not.toContain('admin:p@ssword');
    expect(searchText).not.toContain('Authorization');
    expect(searchText).not.toContain('Basic abc123');
  });

  it('routes Media Search submit, clear, play, and queue through injected dispatches once', async () => {
    const mediaSearchDispatch = createMediaSearchDispatch();
    const mediaSearchActionDispatch = createMediaSearchActionDispatch();
    const target = renderApp({
      mediaSearchSnapshot: createMediaSearchSnapshot(),
      mediaSearchDispatch,
      mediaSearchActionDispatch
    });

    const searchInput = getInput(target, '#media-search-query');
    changeInputValue(searchInput, '  pastel blues  ');
    const searchForm = target.querySelector<HTMLFormElement>('form[aria-label="Media search"]');
    expect(searchForm).toBeInstanceOf(HTMLFormElement);
    searchForm?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await tick();
    await tick();

    getButtonByAria(target, 'Play artist Nina Simone').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue artist Nina Simone').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Play album Pastel Blues').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue album Pastel Blues').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Play song Sinnerman').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue song Sinnerman').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Clear media search').click();
    await tick();

    expect(mediaSearchDispatch.search).toHaveBeenCalledTimes(1);
    expect(mediaSearchDispatch.search).toHaveBeenCalledWith({ query: 'pastel blues' });
    expect(mediaSearchDispatch.clear).toHaveBeenCalledTimes(1);
    expect(mediaSearchActionDispatch.playMusicItem).toHaveBeenCalledTimes(3);
    expect(mediaSearchActionDispatch.playMusicItem).toHaveBeenNthCalledWith(1, {
      kind: 'artist',
      id: 1
    });
    expect(mediaSearchActionDispatch.playMusicItem).toHaveBeenNthCalledWith(2, {
      kind: 'album',
      id: 2
    });
    expect(mediaSearchActionDispatch.playMusicItem).toHaveBeenNthCalledWith(3, {
      kind: 'song',
      id: 3
    });
    expect(mediaSearchActionDispatch.queueMusicItem).toHaveBeenCalledTimes(3);
    expect(mediaSearchActionDispatch.queueMusicItem).toHaveBeenNthCalledWith(1, {
      kind: 'artist',
      id: 1
    });
    expect(mediaSearchActionDispatch.queueMusicItem).toHaveBeenNthCalledWith(2, {
      kind: 'album',
      id: 2
    });
    expect(mediaSearchActionDispatch.queueMusicItem).toHaveBeenNthCalledWith(3, {
      kind: 'song',
      id: 3
    });
  });

  it('renders injected Media Search action rejection through panel status without live Kodi', async () => {
    const mediaSearchActionDispatch = createMediaSearchActionDispatch({
      queueMusicItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/song.flac'
        );
      })
    });
    const target = renderApp({
      mediaSearchSnapshot: createMediaSearchSnapshot(),
      mediaSearchDispatch: createMediaSearchDispatch(),
      mediaSearchActionDispatch
    });

    getButtonByAria(target, 'Queue song Sinnerman').click();
    await tick();
    await tick();

    const searchText = getMediaSearchPanelText(target);
    expect(mediaSearchActionDispatch.queueMusicItem).toHaveBeenCalledTimes(1);
    expect(mediaSearchActionDispatch.queueMusicItem).toHaveBeenCalledWith({ kind: 'song', id: 3 });
    expect(searchText).toContain('Could not queue song Sinnerman');
    expect(searchText).toContain('credentials [redacted]');
    expect(searchText).toContain('[redacted-url]');
    expect(searchText).toContain('response body [redacted]');
    expect(searchText).toContain('browser storage');
    expect(searchText).not.toContain('admin:p@ssword');
    expect(searchText).not.toContain('Authorization');
    expect(searchText).not.toContain('Basic abc123');
    expect(searchText).not.toContain('localStorage');
    expect(searchText).not.toContain('raw response body');
    expect(searchText).not.toContain('smb://');
  });

  it('renders injected Media Files sources, folders, files, unsupported state, and hostile text safely', () => {
    const target = renderApp({
      mediaFilesSnapshot: createMediaFilesSnapshot({
        sources: [{ id: 'source:1', label: 'smb://nas.local/private/music' }],
        entries: [
          {
            id: 'entry:1',
            kind: 'directory',
            label: 'http://admin:p@ssword@example.test/private/folder',
            capabilities: { canBrowse: true, canPlay: false, canQueue: false }
          },
          {
            id: 'entry:2',
            kind: 'file',
            label: 'Safe Song.flac',
            mediaKind: 'audio',
            extension: 'flac',
            capabilities: { canBrowse: false, canPlay: true, canQueue: true }
          },
          {
            id: 'entry:3',
            kind: 'file',
            label: 'Authorization: Basic abc123',
            mediaKind: 'unsupported',
            extension: 'jpg',
            capabilities: { canBrowse: false, canPlay: false, canQueue: false }
          }
        ],
        breadcrumbs: [{ id: 'source:1', label: 'localStorage' }],
        lastError: {
          source: 'http',
          code: 'auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/song.flac'
        }
      }),
      mediaFilesDispatch: createMediaFilesDispatch(),
      mediaFilesActionDispatch: createMediaFilesActionDispatch()
    });

    const panel = getMediaFilesPanel(target);
    const filesText = panel.textContent ?? '';

    expect(filesText).toContain('Media Files');
    expect(filesText).toContain('Music sources');
    expect(filesText).toContain('Source 1');
    expect(filesText).toContain('Folder 1');
    expect(filesText).toContain('Safe Song.flac');
    expect(filesText).toContain('Unsupported file');
    expect(filesText).toContain('Unsupported');
    const unsupportedButton = Array.from(panel.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Unsupported'
    );
    expect(unsupportedButton).toBeInstanceOf(HTMLButtonElement);
    expect(unsupportedButton?.disabled).toBe(true);
    expect(filesText).not.toContain('smb://');
    expect(filesText).not.toContain('admin:p@ssword');
    expect(filesText).not.toContain('Authorization');
    expect(filesText).not.toContain('Basic abc123');
    expect(filesText).not.toContain('localStorage');
    expect(filesText).not.toContain('raw response body');
  });

  it('routes Media Files refresh, source, folder, breadcrumb, play, and queue through injected dispatches', async () => {
    const mediaFilesDispatch = createMediaFilesDispatch();
    const mediaFilesActionDispatch = createMediaFilesActionDispatch();
    const target = renderApp({
      mediaFilesSnapshot: createMediaFilesSnapshot(),
      mediaFilesDispatch,
      mediaFilesActionDispatch
    });

    getButtonByAria(target, 'Refresh media file sources').click();
    await tick();
    getButtonByAria(target, 'Open source Albums').click();
    await tick();
    getButtonByAria(target, 'Open folder Nina Simone').click();
    await tick();
    getButtonByAria(target, 'Open breadcrumb Albums').click();
    await tick();
    getButtonByAria(target, 'Open breadcrumb Nina Simone').click();
    await tick();
    getButtonByAria(target, 'Play file Sinnerman.flac').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue file Sinnerman.flac').click();
    await tick();

    expect(mediaFilesDispatch.refresh).toHaveBeenCalledTimes(1);
    expect(mediaFilesDispatch.openSource).toHaveBeenCalledWith('source:1');
    expect(mediaFilesDispatch.openEntry).toHaveBeenCalledWith('entry:1');
    expect(mediaFilesDispatch.openBreadcrumb).toHaveBeenNthCalledWith(1, 'source:1');
    expect(mediaFilesDispatch.openBreadcrumb).toHaveBeenNthCalledWith(2, 'entry:1');
    expect(mediaFilesActionDispatch.playFileItem).toHaveBeenCalledWith({
      id: 'entry:2',
      label: 'Sinnerman.flac',
      media: 'music'
    });
    expect(mediaFilesActionDispatch.queueFileItem).toHaveBeenCalledWith({
      id: 'entry:2',
      label: 'Sinnerman.flac',
      media: 'music'
    });
  });

  it('renders injected Media Files action rejection through sanitized panel status', async () => {
    const mediaFilesActionDispatch = createMediaFilesActionDispatch({
      playFileItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/song.flac'
        );
      })
    });
    const target = renderApp({
      mediaFilesSnapshot: createMediaFilesSnapshot(),
      mediaFilesDispatch: createMediaFilesDispatch(),
      mediaFilesActionDispatch
    });

    getButtonByAria(target, 'Play file Sinnerman.flac').click();
    await tick();
    await tick();

    const filesText = getMediaFilesPanelText(target);
    expect(mediaFilesActionDispatch.playFileItem).toHaveBeenCalledTimes(1);
    expect(filesText).toContain('Could not play file Sinnerman.flac');
    expect(filesText).toContain('credentials [redacted]');
    expect(filesText).toContain('[redacted-url]');
    expect(filesText).toContain('response body [redacted]');
    expect(filesText).toContain('browser storage');
    expect(filesText).not.toContain('admin:p@ssword');
    expect(filesText).not.toContain('Authorization');
    expect(filesText).not.toContain('Basic abc123');
    expect(filesText).not.toContain('localStorage');
    expect(filesText).not.toContain('raw response body');
    expect(filesText).not.toContain('smb://');
  });

  it('renders injected Media Playlists without live Kodi and redacts hostile raw playlist paths', () => {
    const target = renderApp({
      mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot({
        playlists: [
          {
            id: 'playlist:1',
            label: 'smb://nas.local/private/Late Night Jazz.xsp',
            media: 'music',
            kind: 'smart',
            extension: 'xsp',
            capabilities: { canBrowse: true, canPlay: true, canQueue: true }
          },
          {
            id: 'playlist:2',
            label: 'http://admin:p@ssword@example.test/private/Road Trip.m3u',
            media: 'music',
            kind: 'basic',
            extension: 'm3u',
            capabilities: { canBrowse: false, canPlay: false, canQueue: false }
          }
        ],
        entries: [
          {
            id: 'entry:1',
            label: 'smb://nas.local/private/Blue in Green.flac',
            mediaKind: 'audio',
            extension: 'flac',
            capabilities: { canPlay: true, canQueue: true }
          }
        ],
        breadcrumbs: [{ id: 'playlist:1', label: '/home/kodi/playlists/Late Night Jazz.xsp' }],
        lastError: {
          source: 'http',
          code: 'auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and special://musicplaylists/private.xsp'
        }
      }),
      mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
      mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch()
    });

    const playlistsText = getMediaPlaylistsPanelText(target);

    expect(playlistsText).toContain('Media Playlists');
    expect(playlistsText).toContain('Music playlists');
    expect(playlistsText).toContain('Smart playlist');
    expect(playlistsText).toContain('Unsupported playlist');
    expect(playlistsText).toContain('Playlist 1');
    expect(playlistsText).toContain('Playlist 2');
    expect(playlistsText).toContain('Audio entry 1');
    expect(playlistsText).not.toContain('smb://');
    expect(playlistsText).not.toContain('admin:p@ssword');
    expect(playlistsText).not.toContain('Authorization');
    expect(playlistsText).not.toContain('Basic abc123');
    expect(playlistsText).not.toContain('localStorage');
    expect(playlistsText).not.toContain('raw response body');
    expect(playlistsText).not.toContain('special://');
    expect(playlistsText).not.toContain('/home/kodi');
    expect(playlistsText).not.toContain('.xsp');
  });

  it('routes Media Playlists refresh, open, breadcrumb, play, and queue through injected dispatches once', async () => {
    const mediaPlaylistsDispatch = createMediaPlaylistsDispatch();
    const mediaPlaylistsActionDispatch = createMediaPlaylistsActionDispatch();
    const target = renderApp({
      mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
      mediaPlaylistsDispatch,
      mediaPlaylistsActionDispatch
    });

    getButtonByAria(target, 'Refresh media playlists').click();
    await tick();
    getButtonByAria(target, 'Open playlist Late Night Jazz.xsp').click();
    await tick();
    getButtonByAria(target, 'Open breadcrumb Late Night Jazz.xsp').click();
    await tick();
    getButtonByAria(target, 'Play playlist Late Night Jazz.xsp').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue playlist Late Night Jazz.xsp').click();
    await tick();

    expect(mediaPlaylistsDispatch.refresh).toHaveBeenCalledTimes(1);
    expect(mediaPlaylistsDispatch.openPlaylist).toHaveBeenCalledTimes(1);
    expect(mediaPlaylistsDispatch.openPlaylist).toHaveBeenCalledWith('playlist:1');
    expect(mediaPlaylistsDispatch.openBreadcrumb).toHaveBeenCalledTimes(1);
    expect(mediaPlaylistsDispatch.openBreadcrumb).toHaveBeenCalledWith('playlist:1');
    expect(mediaPlaylistsActionDispatch.playPlaylistItem).toHaveBeenCalledTimes(1);
    expect(mediaPlaylistsActionDispatch.playPlaylistItem).toHaveBeenCalledWith({
      id: 'playlist:1',
      label: 'Late Night Jazz.xsp',
      media: 'music',
      kind: 'smart',
      capabilities: { canBrowse: true, canPlay: true, canQueue: true }
    });
    expect(mediaPlaylistsActionDispatch.queuePlaylistItem).toHaveBeenCalledTimes(1);
    expect(mediaPlaylistsActionDispatch.queuePlaylistItem).toHaveBeenCalledWith({
      id: 'playlist:1',
      label: 'Late Night Jazz.xsp',
      media: 'music',
      kind: 'smart',
      capabilities: { canBrowse: true, canPlay: true, canQueue: true }
    });
  });

  it('routes default Media Playlists play and queue through playlist-specific dispatch methods', async () => {
    const getPlayablePlaylist = vi.spyOn(mediaPlaylistsStore, 'getPlayablePlaylist');
    getPlayablePlaylist.mockReturnValue({
      ok: true,
      playlist: {
        id: 'playlist:1',
        label: 'Late Night Jazz.xsp',
        mediaKind: 'music',
        playlistKind: 'smart',
        file: 'special://musicplaylists/Late Night Jazz.xsp'
      }
    });
    const playPlaylistItem = vi
      .spyOn(defaultPlayerDispatch, 'playPlaylistItem')
      .mockResolvedValue();
    const playFileItem = vi.spyOn(defaultPlayerDispatch, 'playFileItem').mockResolvedValue();
    const queuePlaylistItem = vi
      .spyOn(defaultQueueDispatch, 'queuePlaylistItem')
      .mockResolvedValue();
    const queueFileItem = vi.spyOn(defaultQueueDispatch, 'queueFileItem').mockResolvedValue();
    const target = renderApp({ mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot() });

    getButtonByAria(target, 'Play playlist Late Night Jazz.xsp').click();
    await tick();
    await tick();
    getButtonByAria(target, 'Queue playlist Late Night Jazz.xsp').click();
    await tick();

    expect(getPlayablePlaylist).toHaveBeenCalledTimes(2);
    expect(getPlayablePlaylist).toHaveBeenNthCalledWith(1, 'playlist:1');
    expect(getPlayablePlaylist).toHaveBeenNthCalledWith(2, 'playlist:1');
    expect(playPlaylistItem).toHaveBeenCalledTimes(1);
    expect(playPlaylistItem).toHaveBeenCalledWith({
      file: 'special://musicplaylists/Late Night Jazz.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });
    expect(queuePlaylistItem).toHaveBeenCalledTimes(1);
    expect(queuePlaylistItem).toHaveBeenCalledWith({
      file: 'special://musicplaylists/Late Night Jazz.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });
    expect(playFileItem).not.toHaveBeenCalled();
    expect(queueFileItem).not.toHaveBeenCalled();
    expect(getMediaPlaylistsPanelText(target)).not.toContain('special://musicplaylists');
  });

  it('renders default Media Playlists resolver failures through sanitized action status', async () => {
    vi.spyOn(mediaPlaylistsStore, 'getPlayablePlaylist').mockReturnValue({
      ok: false,
      error: {
        source: 'client',
        code: 'client/unknown-playlist',
        message:
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and special://musicplaylists/private.xsp'
      }
    });
    const playPlaylistItem = vi
      .spyOn(defaultPlayerDispatch, 'playPlaylistItem')
      .mockResolvedValue();
    const target = renderApp({ mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot() });

    getButtonByAria(target, 'Play playlist Late Night Jazz.xsp').click();
    await tick();
    await tick();

    const playlistsText = getMediaPlaylistsPanelText(target);
    expect(playPlaylistItem).not.toHaveBeenCalled();
    expect(playlistsText).toContain('Could not play playlist Late Night Jazz.xsp');
    expect(playlistsText).toContain('credentials [redacted]');
    expect(playlistsText).toContain('[redacted-url]');
    expect(playlistsText).toContain('response body [redacted]');
    expect(playlistsText).toContain('browser storage');
    expect(playlistsText).not.toContain('admin:p@ssword');
    expect(playlistsText).not.toContain('Authorization');
    expect(playlistsText).not.toContain('Basic abc123');
    expect(playlistsText).not.toContain('localStorage');
    expect(playlistsText).not.toContain('raw response body');
    expect(playlistsText).not.toContain('special://');
    expect(playlistsText).not.toContain('.xsp failed');
  });

  it('renders default Music Browse idle prompt without a configured Kodi host', () => {
    const target = renderApp();
    const browseText = getMusicBrowsePanelText(target);

    expect(browseText).toContain('Browse Music');
    expect(browseText).toContain('Choose an artist, album, or genre to browse.');
    expect(browseText).toContain('No browse selection yet.');
    expect(target.textContent).toContain('No Kodi host configured yet');
  });

  it('renders the shell with store-backed idle Kodi connection diagnostics and host controls', () => {
    const target = renderApp();

    expect(target.textContent).toContain('chorus3');
    expect(target.textContent).toContain('Multi-host console');
    expect(target.textContent).toContain('No Kodi host configured yet');
    expect(target.textContent).toContain('Connection');
    expect(target.textContent).toContain('no host');
    expect(target.textContent).toContain('Add a trusted Kodi host to begin HTTP diagnostics');
    expect(target.textContent).toContain('HTTP and WebSocket checks are idle');
    expect(target.textContent).not.toContain('S03 will replace this placeholder');
    expect(target.textContent).not.toContain('upcoming host settings slice');
    expect(target.textContent).not.toContain('Library sync');
    expect(target.textContent).toContain('Music Library');
    expect(target.textContent).toContain('Music library is empty.');
    expect(target.textContent).toContain('Kodi host settings');
    expect(target.textContent).toContain('Only save credentials on a trusted device');
  });

  it('validates host fields accessibly and rejects credential-bearing host text', async () => {
    const target = renderApp();

    await submitHostForm(target);

    const labelInput = target.querySelector<HTMLInputElement>('#host-label');
    const hostInput = target.querySelector<HTMLInputElement>('#host-address');
    expect(labelInput?.getAttribute('aria-invalid')).toBe('true');
    expect(labelInput?.getAttribute('aria-describedby')).toContain('host-label-error');
    expect(hostInput?.getAttribute('aria-invalid')).toBe('true');
    expect(target.textContent).toContain('Label is required.');
    expect(target.textContent).toContain('Host is required.');

    setInputValue(labelInput!, 'Office Kodi');
    setInputValue(hostInput!, 'http://admin:secret@kodi.local/jsonrpc');
    setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, '70000');
    await submitHostForm(target);

    expect(target.textContent).toContain(
      'Host must not include a protocol, path, query string, or credentials.'
    );
    expect(target.textContent).toContain('HTTP port must be an integer between 1 and 65535.');
    expect(target.textContent).not.toContain('admin:secret');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('adds, tests, activates, edits, and deletes saved hosts without exposing secrets', async () => {
    const fetchMock = createKodiFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const target = renderApp();

    await addHost(target);

    expect(target.textContent).toContain('Living Room Kodi');
    expect(target.textContent).toContain('kodi.local:8080');
    expect(target.textContent).toContain('Credentials saved');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.textContent).not.toContain('Basic ');

    target.querySelector<HTMLButtonElement>('button[aria-label="Test Living Room Kodi"]')?.click();
    await waitForText(target, 'Test passed');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(target.textContent).toContain('Test passed');
    expect(target.textContent).toContain('Kodi 21.1');
    expect(target.textContent).toContain('Application Kodi');

    const activateButton = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Activate Living Room Kodi"]'
    );
    activateButton?.click();
    await waitForText(target, 'connected');

    expect(target.textContent).toContain('Active host');
    expect(target.textContent).toContain('connected');
    expect(target.textContent).toContain('Kodi HTTP diagnostics are connected. Kodi 21.1');

    target.querySelector<HTMLButtonElement>('button[aria-label="Edit Living Room Kodi"]')?.click();
    await tick();
    setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, 'Media Room Kodi');
    await submitHostForm(target);

    expect(target.textContent).toContain('Media Room Kodi');
    expect(target.textContent).not.toContain('super-secret-password');

    target.querySelector<HTMLButtonElement>('button[aria-label="Delete Media Room Kodi"]')?.click();
    await tick();

    expect(target.textContent).toContain('No saved hosts yet');
    expect(target.textContent).toContain('No active host selected');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('shows safe host test and connection failures while preserving saved-host controls', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(jsonResponse({ ok: false }, { status: 401, statusText: 'Unauthorized' }))
    );
    const target = renderApp();

    await addHost(target, { label: 'Failed Kodi', host: 'failed.local', password: 'bad-password' });

    target.querySelector<HTMLButtonElement>('button[aria-label="Test Failed Kodi"]')?.click();
    await waitForText(target, 'Test failed');

    expect(target.textContent).toContain('Test failed');
    expect(target.textContent).toContain(
      'Kodi rejected the configured username or password while calling JSONRPC.Ping.'
    );
    expect(
      target.querySelector<HTMLButtonElement>('button[aria-label="Test Failed Kodi"]')
    ).not.toBe(null);

    target.querySelector<HTMLButtonElement>('button[aria-label="Activate Failed Kodi"]')?.click();
    await waitForText(target, 'Kodi connection failed (http/auth)');

    expect(target.textContent).toContain('failed');
    expect(target.textContent).toContain('Kodi connection failed (http/auth)');
    expect(target.textContent).not.toContain('bad-password');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('renders storage recovery warnings without raw localStorage content', () => {
    const rawSecret = '{"hosts":[{"password":"raw-local-storage-secret"}]}';
    window.localStorage.setItem('chorus3.kodi.hosts', rawSecret);
    const recoveredStore = createConfigStore({ storage: window.localStorage });
    configStore.storageWarning = recoveredStore.snapshot.storageWarning;

    const target = renderApp();

    expect(target.textContent).toContain(
      'Saved Kodi host settings were reset because stored data was invalid.'
    );
    expect(target.textContent).not.toContain('raw-local-storage-secret');
    expect(target.textContent).not.toContain(rawSecret);
  });

  it('renders degraded WebSocket diagnostics from the shared connection store', async () => {
    connectionStore.status = 'degraded';
    connectionStore.webSocketDegraded = true;
    connectionStore.reconnectAttempt = 3;
    connectionStore.lastConnectedAt = '2026-04-28T07:00:00.000Z';
    connectionStore.kodiVersion = { major: 21, minor: 1 };
    connectionStore.lastError = {
      source: 'websocket',
      code: 'closed',
      message: 'Kodi WebSocket closed unexpectedly (code 1006).',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      }
    };

    const target = renderApp();
    await tick();

    expect(target.textContent).toContain('degraded');
    expect(target.textContent).toContain('WebSocket degraded after HTTP diagnostics succeeded');
    expect(target.textContent).toContain('retry attempt 3');
    expect(target.textContent).toContain('Last connected 2026-04-28T07:00:00.000Z');
    expect(target.textContent).toContain('Kodi 21.1');
    expect(target.textContent).not.toContain('admin:secret');
  });

  it('renders QueuePanel with no-active copy when no queue snapshot is provided', () => {
    const target = renderApp();
    const panel = target.querySelector('.queue-panel');

    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel?.textContent).toContain('No active Kodi playlist');
  });

  it('passes injected queue snapshot and dispatch to QueuePanel', () => {
    const queueSnapshot: QueueStoreSnapshot = {
      refreshStatus: 'ready',
      playlistid: 5,
      activePosition: 0,
      items: [{ position: 0, label: 'Test Track' }],
      limits: { start: 0, end: 1, total: 1 },
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-04-28T00:00:00.000Z',
      lastError: null
    };
    const queueDispatchSnapshot: QueueDispatchSnapshot = {
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    };
    const queueDispatch: QueuePanelDispatch = {
      snapshot: queueDispatchSnapshot,
      removeAt: vi.fn(),
      clear: vi.fn(),
      swap: vi.fn()
    };

    const target = renderApp({ queueSnapshot, queueDispatch });
    const panel = target.querySelector('.queue-panel');

    expect(panel?.textContent).toContain('Test Track');
  });

  it('attaches the local player store to a real HTMLMediaElement and reports safe runtime diagnostics', async () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);

    renderApp();

    const mediaElement = document.querySelector<HTMLMediaElement>(
      'audio[data-local-media-adapter], video[data-local-media-adapter]'
    );
    expect(mediaElement).toBeInstanceOf(HTMLMediaElement);
    if (!mediaElement) {
      throw new Error('Expected App to render a local media runtime element.');
    }
    expect(mediaElement.dataset.localMediaAdapter).toBe('attached');

    const rawStreamUrl = 'http://admin:p@ssword@kodi.local:8080/vfs/private/song.mp3';
    await localPlayerStore.loadAndPlay({
      source: rawStreamUrl,
      item: { id: 42, label: 'Private Song', type: 'song', songid: 42 },
      mediaKind: 'audio',
      kodiWasPaused: true
    });
    await tick();

    expect(load).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledTimes(1);
    expect(mediaElement?.src).not.toContain('admin:p@ssword');

    Object.defineProperty(mediaElement, 'duration', { configurable: true, value: 600 });
    mediaElement.currentTime = 301;
    mediaElement.dispatchEvent(new Event('canplay'));
    mediaElement.dispatchEvent(new Event('timeupdate'));
    await tick();

    expect(localPlayerStore.snapshot).toMatchObject({
      status: 'playing',
      mediaKind: 'audio',
      currentSeconds: 301,
      durationSeconds: 600,
      resumeAvailable: true
    });

    localPlayerStore.seekToSeconds(333);
    expect(mediaElement?.currentTime).toBe(333);

    localPlayerStore.setVolume(67);
    mediaElement?.dispatchEvent(new Event('volumechange'));
    expect(localPlayerStore.snapshot.volume).toBe(67);

    localPlayerStore.pause();
    expect(pause).toHaveBeenCalledTimes(1);
    expect(localPlayerStore.snapshot.status).toBe('paused');

    play.mockRejectedValueOnce(
      new Error(
        'NotAllowedError for http://admin:p@ssword@kodi.local:8080/vfs/private/song.mp3 with Authorization: Basic abc123 from localStorage'
      )
    );
    await localPlayerStore.loadAndPlay({
      source: rawStreamUrl,
      item: { id: 42, label: 'Private Song', type: 'song', songid: 42 },
      mediaKind: 'audio',
      kodiWasPaused: false
    });
    await tick();

    const serializedSnapshot = JSON.stringify(localPlayerStore.snapshot);
    expect(localPlayerStore.snapshot.lastError?.code).toBe('media/play-rejected');
    expect(serializedSnapshot).not.toContain(rawStreamUrl);
    expect(serializedSnapshot).not.toContain('admin:p@ssword');
    expect(serializedSnapshot).not.toContain('Authorization');
    expect(serializedSnapshot).not.toContain('Basic abc123');
    expect(serializedSnapshot).not.toContain('localStorage');
  });

  it('renders integrated Kodi mode, queue actions, and Local mode affordances safely', async () => {
    const playerDispatch = createPlayerDispatch(
      createDispatchSnapshot({ mode: 'local', lastCommand: 'startLocalPlayback' })
    );
    const queueDispatchSnapshot: QueueDispatchSnapshot = {
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    };
    const queueDispatch: QueuePanelDispatch = {
      snapshot: queueDispatchSnapshot,
      removeAt: vi.fn(),
      clear: vi.fn(),
      swap: vi.fn()
    };
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch,
      localPlayerSnapshot: {
        status: 'playing',
        mediaKind: 'video',
        item: { label: 'Sintel local', type: 'movie' },
        currentSeconds: 45,
        durationSeconds: 300,
        volume: 80,
        muted: false,
        lastError: null,
        kodiPausedForLocal: true,
        resumeAvailable: true,
        lastUpdatedAt: '2026-04-28T12:01:00.000Z'
      },
      queueSnapshot: {
        refreshStatus: 'ready',
        playlistid: 1,
        activePosition: 7,
        items: [
          { position: 7, label: 'Sintel' },
          { position: 8, label: 'Big Buck Bunny' }
        ],
        limits: { start: 0, end: 2, total: 2 },
        lastRefreshReason: 'manual',
        lastUpdatedAt: '2026-04-28T12:00:00.000Z',
        lastError: null
      },
      queueDispatch
    });

    expect(getNowPlayingPanelText(target)).toContain('Playing locally in the browser.');
    expect(getButton(target, 'Resume on Kodi').disabled).toBe(false);
    expect(getButton(target, 'Play or pause').disabled).toBe(false);
    expect(getButton(target, 'Previous').disabled).toBe(true);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(true);

    getButton(target, 'Resume on Kodi').click();
    target.querySelector<HTMLButtonElement>('button[aria-label="Remove Big Buck Bunny"]')?.click();
    target.querySelector<HTMLButtonElement>('button[aria-label="Move Big Buck Bunny up"]')?.click();
    getButton(target, 'Clear queue').click();
    await tick();

    expect(playerDispatch.resumeOnKodi).toHaveBeenCalledTimes(1);
    expect(queueDispatch.removeAt).toHaveBeenCalledWith(8);
    expect(queueDispatch.swap).toHaveBeenCalledWith(7, 8);
    expect(queueDispatch.clear).toHaveBeenCalledTimes(1);
    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('private/Sintel.mkv');
  });

  it('disables all QueuePanel controls when command is running', () => {
    const queueSnapshot: QueueStoreSnapshot = {
      refreshStatus: 'ready',
      playlistid: 5,
      activePosition: null,
      items: [{ position: 0, label: 'Track X' }],
      limits: { start: 0, end: 1, total: 1 },
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-04-28T00:00:00.000Z',
      lastError: null
    };
    const queueDispatch: QueuePanelDispatch = {
      snapshot: {
        commandStatus: 'running',
        lastCommand: 'clear',
        lastError: null,
        lastCompletedAt: null
      },
      removeAt: vi.fn(),
      clear: vi.fn(),
      swap: vi.fn()
    };

    const target = renderApp({ queueSnapshot, queueDispatch });
    const panel = target.querySelector('.queue-panel');
    const buttons = Array.from(panel?.querySelectorAll('button') ?? []);

    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('toggles the typed root theme and updates accessible button text', async () => {
    const target = renderApp();
    const button = target.querySelector('button[aria-label^="Switch to"]');

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.textContent).toContain('Switch to light theme');

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button?.textContent).toContain('Switch to dark theme');

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button?.textContent).toContain('Switch to light theme');
  });
});
