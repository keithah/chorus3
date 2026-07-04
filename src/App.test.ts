import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import App from './App.svelte';
import { preloadAppPageSurfaceRoutesForTest } from './lib/testing/appPageSurfacePreload';
import { readCachedSource } from './lib/testing/readCachedSource';
import {
  createM007VisualProofAppProps,
  M007_VISUAL_PROOF_FORBIDDEN_TEXT
} from './lib/testing/m007VisualProofFixtures';
import PrimaryAppShell from './lib/app-shell/AppShell.svelte';
import { createAppNavigationItems } from './lib/app-shell/appNavigation';
import { localeStore, type LocaleMutationResult, type LocaleStoreSnapshot } from './lib/stores';
import {
  KODI_WEBINTERFACE_BASE_PATH,
  buildAppRoute,
  buildKodiPackageSafePrimaryAppRoute,
  parseAppRoute,
  type AppRoute
} from './lib/app/appRouter';
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
import type { MediaPlaylistsPanelDispatch } from './lib/components/MediaPlaylistsPanel.svelte';
import type { MediaPlaylistsActionDispatch } from './lib/components/mediaPlaylistsActionModel';
import type { SettingsPanelDispatch } from './lib/components/SettingsPanel.svelte';
import type { AddonDetailDispatch } from './lib/components/AddonDetailShell.svelte';
import type { AddonsPanelDispatch } from './lib/components/AddonsPanel.svelte';
import type { VideoMovieActionDispatch } from './lib/components/VideoMovieDetailShell.svelte';
import type { VideoMovieStreamDispatch } from './lib/components/VideoMovieStreamShell.svelte';
import type { VideoEpisodeActionDispatch } from './lib/components/VideoEpisodeDetailShell.svelte';
import type {
  VideoSeasonArtworkDispatch,
  VideoSeasonWriteDispatch
} from './lib/components/VideoSeasonDetailShell.svelte';
import type { QueuePanelDispatch } from './lib/components/QueuePanel.svelte';
import type { RemoteInputPanelRemoteDispatch } from './lib/components/RemoteInputPanel.svelte';
import type { RemoteInputDispatchSnapshot } from './lib/stores/remoteInputDispatch.svelte.ts';
import type { VideoLibraryStoreSnapshot } from './lib/stores/videoLibrary.svelte.ts';
import type { VideoTvStoreSnapshot } from './lib/stores/videoTvStore.svelte.ts';
import type { VideoRoute } from './lib/video/videoRouter';
import {
  configStore,
  connectionStore,
  addonsStore,
  hostConnectionStore,
  localPlayerStore,
  localPlaylistStore,
  mediaSearchStore,
  mediaPlaylistsStore,
  playerStore,
  queueStore,
  settingsStore,
  videoMediaPlaylistsStore,
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
  type QueueStoreSnapshot,
  type AddonsStoreSnapshot,
  type LocalPlaylistDispatch,
  type LocalPlaylistStoreSnapshot
} from './lib/stores';
import { DEFAULT_THEME } from './lib/theme/theme';

let mountedComponent: Record<string, unknown> | undefined;

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;
type AppProps = {
  playerSnapshot?: PlayerStoreSnapshot;
  playerDispatch?: PlayerControlsDispatch;
  remoteSnapshot?: RemoteInputDispatchSnapshot;
  remoteInputDispatch?: RemoteInputPanelRemoteDispatch;
  localPlayerSnapshot?: import('./lib/stores/localPlayer.svelte').LocalPlayerStoreSnapshot;
  localPlaylistSnapshot?: LocalPlaylistStoreSnapshot;
  localPlaylistDispatch?: LocalPlaylistDispatch;
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
  videoMediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
  videoMediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
  videoMediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
  route?: AppRoute | VideoRoute;
  settingsSnapshot?: import('./lib/stores/settingsStore.svelte').SettingsStoreSnapshot;
  settingsDispatch?: SettingsPanelDispatch;
  addonsSnapshot?: AddonsStoreSnapshot;
  addonsDispatch?: AddonsPanelDispatch;
  addonDetailDispatch?: AddonDetailDispatch;
  packageMountedHost?: import('./lib/stores').SavedKodiHost | null;
  localeSnapshot?: LocaleStoreSnapshot;
  localeDispatch?: { setLocale: (locale: unknown) => LocaleMutationResult };
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
      capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
    },
    {
      id: 'entry:3',
      kind: 'file',
      label: 'cover.jpg',
      mediaKind: 'unsupported',
      extension: 'jpg',
      capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: true }
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
    downloadFileItem: vi.fn(),
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

function createVideoMediaPlaylistsSnapshot(
  overrides: Partial<MediaPlaylistsStoreSnapshot> = {}
): MediaPlaylistsStoreSnapshot {
  const playlists: MediaPlaylistSnapshot[] = [
    {
      id: 'video-playlist:1',
      label: 'Rain City Thrillers.xsp',
      media: 'video',
      kind: 'smart',
      extension: 'xsp',
      capabilities: { canBrowse: true, canPlay: false, canQueue: false }
    }
  ];
  const entries: MediaPlaylistEntrySnapshot[] = [
    {
      id: 'video-entry:1',
      label: 'Neon Harbor.mkv',
      mediaKind: 'video',
      extension: 'mkv',
      capabilities: { canPlay: false, canQueue: false }
    }
  ];
  const breadcrumbs: MediaPlaylistsBreadcrumbSnapshot[] = [
    { id: 'video-playlist:1', label: 'Rain City Thrillers.xsp' }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'playlist:video-playlist:1',
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    media: 'video',
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

type VideoLibrarySnapshotOverrides = Omit<Partial<VideoLibraryStoreSnapshot>, 'limits'> & {
  limits?: Partial<VideoLibraryStoreSnapshot['limits']>;
};

function createVideoLibrarySnapshot(
  overrides: VideoLibrarySnapshotOverrides = {}
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
    recentlyAddedMovies: [],
    recentlyPlayedMovies: [],
    recentlyAddedEpisodes: [],
    recentlyPlayedEpisodes: [],
    isEmpty: movies.length === 0,
    lastError: null,
    ...overrides,
    limits: {
      movies: { start: 0, end: movies.length, total: movies.length },
      tvShows: { start: 0, end: 0, total: 0 },
      recentlyAddedMovies: { start: 0, end: 0, total: 0 },
      recentlyPlayedMovies: { start: 0, end: 0, total: 0 },
      recentlyAddedEpisodes: { start: 0, end: 0, total: 0 },
      recentlyPlayedEpisodes: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
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

function createSettingsSnapshot(
  overrides: Partial<import('./lib/stores/settingsStore.svelte').SettingsStoreSnapshot> = {}
): import('./lib/stores/settingsStore.svelte').SettingsStoreSnapshot {
  return {
    loadStatus: 'success',
    writeStatus: 'idle',
    sections: [
      { id: 'player', label: 'Player' },
      { id: 'services', label: 'Services' }
    ],
    categories: [
      { id: 'videos', label: 'Videos' },
      { id: 'interface', label: 'Interface' }
    ],
    settings: [
      {
        id: 'videoplayer.autoplaynextitem',
        label: 'Autoplay next item',
        type: 'boolean',
        editKind: 'boolean',
        value: true,
        defaultValue: false,
        options: [],
        readOnly: false
      },
      {
        id: 'filebrowser.source',
        label: 'Media source path',
        type: 'path',
        editKind: 'unsupported',
        value: 'redacted-file',
        defaultValue: null,
        options: [],
        readOnly: true
      }
    ],
    selectedSectionId: 'player',
    selectedCategoryId: 'videos',
    lastError: null,
    lastWrite: null,
    rollbackValue: null,
    refreshAfterWrite: null,
    writeCounts: { attempted: 0, succeeded: 0, failed: 0 },
    ...overrides
  };
}

function createSettingsDispatch(
  overrides: Partial<SettingsPanelDispatch> = {}
): SettingsPanelDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    selectSection: vi.fn(),
    selectCategory: vi.fn(),
    setValue: vi.fn(),
    ...overrides
  };
}

function createAddonSnapshot(
  overrides: Partial<AddonsStoreSnapshot['addons'][number]> = {}
): AddonsStoreSnapshot['addons'][number] {
  const type = overrides.type ?? 'xbmc.python.pluginsource';
  const inferredProvides = inferAddonProvides(type);
  return {
    addonid: 'plugin.video.safe-demo',
    name: 'Safe Video Demo',
    version: '1.2.3',
    summary: 'Browse safe fixture videos.',
    description: 'A deterministic add-on detail used for no-live-Kodi proof.',
    author: 'Fixture Maintainers',
    enabled: false,
    installed: true,
    type,
    broken: null,
    dependencyCount: 2,
    extrainfoCount: 1,
    provides: inferredProvides,
    providesDefault: inferredProvides[0] ?? null,
    ...overrides
  };
}

function inferAddonProvides(type: string): string[] {
  if (type.includes('audio')) return ['audio'];
  if (type.includes('executable') || type.startsWith('script.')) return ['executable'];
  if (type.includes('video') || type === 'xbmc.python.pluginsource') return ['video'];
  return [];
}

function createAddonsSnapshot(overrides: Partial<AddonsStoreSnapshot> = {}): AddonsStoreSnapshot {
  const addons = overrides.addons ?? [
    createAddonSnapshot(),
    createAddonSnapshot({
      addonid: 'script.module.safe-helper',
      name: 'Safe Helper Module',
      summary: 'Dependency helper fixture.',
      description: 'A helper add-on fixture.',
      enabled: true,
      type: 'xbmc.python.module',
      dependencyCount: 0,
      extrainfoCount: 0
    }),
    createAddonSnapshot({
      addonid: 'plugin.audio.safe-radio',
      name: 'Safe Radio',
      summary: 'Audio stream fixture without transport details.',
      description: 'A disabled audio add-on fixture.',
      enabled: false,
      type: 'xbmc.addon.audio',
      broken: 'Safe fixture dependency missing',
      dependencyCount: 1,
      extrainfoCount: 2
    })
  ];
  const searchQuery = overrides.searchQuery ?? '';
  const visibleAddons = overrides.visibleAddons ?? addons;
  const groupBy = overrides.groupBy ?? 'type';

  return {
    loadStatus: 'success',
    detailStatus: 'success',
    writeStatus: 'error',
    addons,
    selectedAddonId: 'plugin.video.safe-demo',
    detail: addons[0],
    searchQuery,
    groupBy,
    visibleAddons,
    groups: overrides.groups ?? [
      { key: 'xbmc.python.pluginsource', label: 'xbmc.python.pluginsource', addons: [addons[0]] },
      { key: 'xbmc.python.module', label: 'xbmc.python.module', addons: [addons[1]] },
      { key: 'xbmc.addon.audio', label: 'xbmc.addon.audio', addons: [addons[2]] }
    ],
    pendingToggle: {
      addonid: 'plugin.video.safe-demo',
      enabled: true,
      requestedAt: '2026-05-01T21:00:00.000Z'
    },
    lastWrite: {
      addonid: 'plugin.audio.safe-radio',
      enabled: false,
      status: 'error',
      at: '2026-05-01T21:00:00.000Z'
    },
    rollbackEnabled: true,
    refreshAfterWrite: {
      addonid: 'plugin.audio.safe-radio',
      requestedAt: '2026-05-01T21:00:00.000Z',
      refreshed: false,
      warning: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
    },
    writeCounts: { attempted: 3, succeeded: 1, failed: 1 },
    lastError: {
      source: 'write',
      code: 'fixture.addon-write-rejected',
      message: 'Safe add-on write rejection was rolled back.'
    },
    ...overrides
  };
}

function createAddonsDispatch(overrides: Partial<AddonsPanelDispatch> = {}): AddonsPanelDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setSearchQuery: vi.fn(),
    setGroupBy: vi.fn(),
    setAddonEnabled: vi.fn(),
    ...overrides
  };
}

function createAddonDetailDispatch(
  overrides: Partial<AddonDetailDispatch> = {}
): AddonDetailDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setAddonEnabled: vi.fn(),
    back: vi.fn(),
    ...overrides
  };
}

function getAddonsPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.addons-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getAddonDetailText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.addon-detail');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getAddonsNotFoundText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.addons-route-not-found');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getLabNotFoundText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.lab-route-not-found');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function getRemoteInputPanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>('.remote-input-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getRemoteInputPanelText(target: HTMLElement): string {
  return getRemoteInputPanel(target).textContent ?? '';
}

function createRemoteSnapshot(
  overrides: Partial<RemoteInputDispatchSnapshot> = {}
): RemoteInputDispatchSnapshot {
  return {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

function createRemoteInputDispatch(
  snapshot = createRemoteSnapshot()
): RemoteInputPanelRemoteDispatch & { sendInput: ReturnType<typeof vi.fn> } {
  return {
    snapshot,
    sendInput: vi.fn().mockResolvedValue(undefined)
  };
}

const PARITY_PLACEHOLDER_FORBIDDEN_COPY =
  /Authorization|Basic|CHORUS3_SENTINEL_SECRET|sentinel_secret|admin:p@ssword|password|token|smb:\/\/|special:\/\/|https?:\/\/|localStorage|sessionStorage|JSONRPC\.Ping|jsonrpc|endpoint|body/i;
const CHORUS2_VIDEO_ALIAS_FORBIDDEN_COPY =
  /Authorization|Basic|CHORUS3_SENTINEL_SECRET|sentinel_secret|admin:p@ssword|token=|secret|smb:\/\/|special:\/\/|localStorage|sessionStorage|jsonrpc/i;

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

function getSettingsPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.settings-panel');
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

function getVideoRecentPanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>('.video-recent-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getVideoRecentPanelText(target: HTMLElement): string {
  return getVideoRecentPanel(target).textContent ?? '';
}

function getAllMediaPlaylistsPanels(target: HTMLElement): HTMLElement[] {
  return Array.from(target.querySelectorAll<HTMLElement>('.media-playlists-panel'));
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
    source: null,
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

function createLocalPlaylistSnapshot(
  overrides: Partial<LocalPlaylistStoreSnapshot> = {}
): LocalPlaylistStoreSnapshot {
  const playlists = overrides.playlists ?? [
    {
      id: 'playlist-local_jazz',
      label: 'Browser Jazz',
      createdAt: '2026-05-04T10:00:00.000Z',
      updatedAt: '2026-05-04T10:05:00.000Z',
      items: [
        {
          id: 'item-blue_green',
          kind: 'audio',
          label: 'Blue in Green',
          position: 0,
          durationSeconds: 337,
          addedAt: '2026-05-04T10:01:00.000Z'
        }
      ]
    }
  ];
  const selectedPlaylistId =
    overrides.selectedPlaylistId === undefined
      ? (playlists[0]?.id ?? null)
      : overrides.selectedPlaylistId;
  const selectedPlaylist =
    overrides.selectedPlaylist === undefined
      ? (playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null)
      : overrides.selectedPlaylist;

  return {
    playlists,
    selectedPlaylistId: selectedPlaylist?.id ?? null,
    selectedPlaylist,
    playlistCount: playlists.length,
    selectedItemCount: selectedPlaylist?.items.length ?? 0,
    mutationStatus: 'idle',
    lastMutation: null,
    validationErrors: {},
    storageWarning: null,
    lastError: null,
    lastUpdatedAt: selectedPlaylist?.updatedAt ?? null,
    ...overrides
  };
}

function createLocalPlaylistDispatch(
  overrides: Partial<LocalPlaylistDispatch> = {}
): LocalPlaylistDispatch {
  return {
    createPlaylist: vi.fn(() => ({
      ok: true as const,
      playlist: createLocalPlaylistSnapshot().playlists[0]!
    })),
    renamePlaylist: vi.fn(() => ({
      ok: true as const,
      playlist: createLocalPlaylistSnapshot().playlists[0]!
    })),
    removePlaylist: vi.fn(() => ({ ok: true as const })),
    selectPlaylist: vi.fn(() => ({
      ok: true as const,
      playlist: createLocalPlaylistSnapshot().playlists[0]!
    })),
    clearPlaylist: vi.fn(() => ({ ok: true as const })),
    addItems: vi.fn(() => ({ ok: true as const, items: [] })),
    removeItem: vi.fn(() => ({ ok: true as const })),
    moveItem: vi.fn(() => ({ ok: true as const })),
    reorderItems: vi.fn(() => ({ ok: true as const })),
    reset: vi.fn(),
    ...overrides
  };
}

function getLocalPlaylistsPanel(target: HTMLElement): HTMLElement {
  const panel = target.querySelector<HTMLElement>(
    '[data-local-playlists-panel], .classic-local-playlists'
  );
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel as HTMLElement;
}

function getLocalPlaylistsPanelText(target: HTMLElement): string {
  return getLocalPlaylistsPanel(target).textContent ?? '';
}

function nowPlayingRouteProps(overrides: AppProps = {}): AppProps {
  return {
    route: { kind: 'nowPlaying' },
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
    setPartyMode: vi.fn(),
    setRepeat: vi.fn(),
    setSubtitle: vi.fn(),
    setAudioStream: vi.fn(),
    startLocalPlayback: vi.fn(),
    resumeOnKodi: vi.fn()
  };
}

function createQueueDispatchSnapshot(
  overrides: Partial<QueueDispatchSnapshot> = {}
): QueueDispatchSnapshot {
  return {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

function createQueuePanelDispatch(
  snapshot: QueueDispatchSnapshot = createQueueDispatchSnapshot()
): QueuePanelDispatch {
  return {
    snapshot,
    removeAt: vi.fn(),
    clear: vi.fn(),
    swap: vi.fn()
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

function getButtonByAria(target: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function changeInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function changeRangeValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
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

function unmountCurrentApp(): void {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }
}

function createPackageMountedHost(): import('./lib/stores').SavedKodiHost {
  return {
    id: 'kodi-package-origin',
    label: 'This Kodi',
    host: 'kodi.local',
    port: 8080,
    useTls: false,
    useWebSocket: false
  };
}

function requireRailLink(target: HTMLElement, title: string): HTMLAnchorElement {
  const link = target.querySelector<HTMLAnchorElement>(
    `aside[aria-label="Primary navigation"] a[title="${title}"]`
  );
  expect(link).toBeInstanceOf(HTMLAnchorElement);
  return link as HTMLAnchorElement;
}

function requireSubmenuLink(
  target: HTMLElement,
  railTitle: string,
  submenuLabel: string
): HTMLAnchorElement {
  const nav = target.querySelector<HTMLElement>('aside[aria-label="Primary navigation"]');
  expect(nav).toBeInstanceOf(HTMLElement);

  const railLink = requireRailLink(target, railTitle);
  const railItem = railLink.closest('.classic-rail-item');
  expect(railItem).toBeInstanceOf(HTMLElement);

  const link = Array.from(
    (railItem as HTMLElement).querySelectorAll<HTMLAnchorElement>('.classic-submenu-link')
  ).find((candidate) => candidate.textContent?.trim() === submenuLabel);
  const availableLabels = Array.from(
    (railItem as HTMLElement).querySelectorAll<HTMLAnchorElement>('.classic-submenu-link')
  )
    .map((candidate) => candidate.textContent?.trim())
    .filter(Boolean)
    .join(', ');
  expect(
    link,
    `${railTitle} submenu should include ${submenuLabel}; available: ${availableLabels || 'none'}`
  ).toBeInstanceOf(HTMLAnchorElement);
  return link as HTMLAnchorElement;
}

function requirePrimaryShellStage(target: HTMLElement): HTMLElement {
  const shell = target.querySelector<HTMLElement>('[aria-label="Chorus media controller"]');
  expect(shell).toBeInstanceOf(HTMLElement);
  expect(shell?.classList.contains('chorus-app')).toBe(true);

  const stage = target.querySelector<HTMLElement>('.classic-stage[aria-label]');
  expect(stage).toBeInstanceOf(HTMLElement);
  return stage as HTMLElement;
}

function requirePrimaryPageFrame(target: HTMLElement, title: string): HTMLElement {
  const frame =
    target.querySelector<HTMLElement>('.app-page-frame') ??
    target.querySelector<HTMLElement>('[data-app-page-surface]');
  expect(frame).toBeInstanceOf(HTMLElement);
  expect(frame?.textContent).toContain(title);
  expect(frame?.textContent).not.toContain('Route not found');
  return frame as HTMLElement;
}

function requireAppPageSurface(
  target: HTMLElement,
  routeKind: string,
  surfaceKind: string
): HTMLElement {
  const surface = target.querySelector<HTMLElement>('[data-app-page-surface]');
  expect(surface).toBeInstanceOf(HTMLElement);
  expect(surface?.dataset.appPageRoute).toBe(routeKind);
  expect(surface?.dataset.appPageSurfaceKind).toBe(surfaceKind);
  return surface as HTMLElement;
}

function requirePackageShellButtonByAria(
  target: HTMLElement,
  ariaLabel: string
): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>(
    `.chorus-app button[aria-label="${ariaLabel}"]`
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function requirePackageShellButtonByText(target: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll<HTMLButtonElement>('.chorus-app button')).find(
    (candidate) => candidate.textContent?.trim() === text
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function requirePackageShellButtonContainingText(
  target: HTMLElement,
  text: string
): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll<HTMLButtonElement>('.chorus-app button')).find(
    (candidate) => candidate.textContent?.includes(text)
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function isDisabledOrGuarded(control: HTMLButtonElement | HTMLInputElement): boolean {
  if (
    control.disabled ||
    (control instanceof HTMLInputElement && control.readOnly) ||
    control.getAttribute('aria-disabled') === 'true'
  ) {
    return true;
  }

  return [
    control.getAttribute('aria-label'),
    control.getAttribute('title'),
    control.getAttribute('placeholder'),
    control.getAttribute('aria-description'),
    control.closest('[title]')?.getAttribute('title'),
    control.closest('[aria-description]')?.getAttribute('aria-description')
  ]
    .filter((value): value is string => typeof value === 'string')
    .some((value) =>
      /not yet|deferred|disabled|guarded|placeholder|future owner|unsupported/i.test(value)
    );
}

function shellRailTargets(): readonly (readonly [string, AppRoute])[] {
  return createAppNavigationItems({ activeRoute: { kind: 'home' } }).map((item) => [
    item.title,
    { kind: 'primary', route: item.route }
  ]);
}

function buildPackageMountedHref(route: AppRoute): string {
  const options = { packageBasePath: KODI_WEBINTERFACE_BASE_PATH, routeMode: 'hash' } as const;

  return route.kind === 'primary'
    ? buildKodiPackageSafePrimaryAppRoute(route.route, options)
    : buildAppRoute(route, options);
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

beforeEach(async () => {
  await preloadAppPageSurfaceRoutesForTest({ scope: 'all' });
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
  addonsStore.reset();
  configStore.reset();
  hostConnectionStore.destroy();
  connectionStore.destroy();
  settingsStore.reset();
  localeStore.setLocale('en');
});

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  hostConnectionStore.destroy();
  addonsStore.reset();
  localPlayerStore.stop();
  localPlaylistStore.reset();
  settingsStore.reset();
  configStore.reset();
  connectionStore.destroy();
  localeStore.setLocale('en');
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('renders a neutral primary shell landmark for standalone and package roots', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());

    let target = renderApp({ route: { kind: 'dashboard' } });
    requirePrimaryShellStage(target);
    expect(requireRailLink(target, 'Music').getAttribute('href')).toBe(
      buildAppRoute({ kind: 'primary', route: { kind: 'music' } })
    );
    expect(requireRailLink(target, 'Movies').getAttribute('href')).toBe(
      buildAppRoute({ kind: 'primary', route: { kind: 'moviesRecent' } })
    );
    expect(target.textContent).not.toContain('Multi-host console');
    expect(target.textContent).not.toContain('Save trusted Kodi endpoints');

    unmountCurrentApp();

    target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost()
    });
    requirePrimaryShellStage(target);
    expect(requireRailLink(target, 'Music').getAttribute('href')).toBe(
      buildPackageMountedHref({ kind: 'primary', route: { kind: 'music' } })
    );
    expect(requireRailLink(target, 'Movies').getAttribute('href')).toBe(
      buildPackageMountedHref({ kind: 'primary', route: { kind: 'moviesRecent' } })
    );
    expect(target.textContent).not.toContain('Multi-host console');
    expect(target.textContent).not.toContain('Save trusted Kodi endpoints');
  });

  it.each([
    ['/', 'Music', 'home', 'home'],
    ['/addons/webinterface.chorus3/', 'Music', 'home', 'home'],
    ['/home', 'Music', 'home', 'home'],
    ['/addons/webinterface.chorus3/home', 'Music', 'home', 'home'],
    ['/music', 'Music', 'music', 'music'],
    ['/movies', 'Movies', 'movies', 'movies'],
    ['/tvshows', 'TV shows', 'tvshows', 'tv'],
    ['/browser', 'Albums', 'browser', 'browser'],
    ['/addons/all', 'Add-ons', 'addonsAll', 'addons'],
    ['/playlists', 'Playlists', 'playlists', 'playlists'],
    ['/settings/web', 'Web interface', 'settingsWeb', 'settings'],
    ['/settings/kodi', 'Kodi settings', 'settingsKodi', 'settings'],
    ['/settings/kodi/interface', 'Kodi settings section', 'settingsKodiSection', 'settings'],
    ['/settings/addons', 'Add-ons', 'settingsAddons', 'settings'],
    ['/settings/nav', 'Main Menu', 'settingsNav', 'settings'],
    ['/settings/search', 'Search', 'settingsSearch', 'settings'],
    ['/help', 'Help', 'help', 'help'],
    ['/remote', 'Remote', 'remote', 'remote'],
    ['/browser/music/safe-item', 'Albums', 'browserItem', 'browser']
  ] as const)(
    'renders %s as a primary shell route with app-shaped content',
    (pathname, title, routeKind, surfaceKind) => {
      vi.stubGlobal('fetch', createKodiFetchMock());
      const isPackagePath = pathname.startsWith(KODI_WEBINTERFACE_BASE_PATH);
      const target = renderApp({
        route: parseAppRoute(pathname, '', {
          packageBasePath: isPackagePath ? KODI_WEBINTERFACE_BASE_PATH : ''
        }),
        packageMountedHost: isPackagePath ? createPackageMountedHost() : null,
        remoteSnapshot: createRemoteSnapshot(),
        remoteInputDispatch: createRemoteInputDispatch(),
        playerSnapshot: activeVideoSnapshot(),
        playerDispatch: createPlayerDispatch(),
        videoLibrarySnapshot: createVideoLibrarySnapshot(),
        videoTvSnapshot: createVideoTvSnapshot(),
        addonsSnapshot: createAddonsSnapshot(),
        addonsDispatch: createAddonsDispatch(),
        settingsSnapshot: createSettingsSnapshot(),
        settingsDispatch: createSettingsDispatch(),
        mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
        mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
        mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch(),
        mediaFilesSnapshot: createMediaFilesSnapshot(),
        mediaFilesDispatch: createMediaFilesDispatch(),
        mediaFilesActionDispatch: createMediaFilesActionDispatch(),
        musicLibrarySnapshot: createMusicLibrarySnapshot(),
        musicBrowseSnapshot: createMusicBrowseSnapshot(),
        musicBrowseDispatch: createMusicBrowseDispatch(),
        musicActionDispatch: createMusicActionDispatch()
      });

      const stage = requirePrimaryShellStage(target);
      expect(target.querySelectorAll('.chorus-app')).toHaveLength(1);
      expect(target.querySelectorAll('header[aria-label="Chorus header"]')).toHaveLength(1);
      expect(target.querySelectorAll('main.classic-stage')).toHaveLength(1);
      expect(stage.textContent).not.toContain('Route not found');
      requirePrimaryPageFrame(target, title);
      requireAppPageSurface(target, routeKind, surfaceKind);
      expect(target.textContent).not.toContain('Multi-host console');
      expect(target.textContent).not.toContain('Save trusted Kodi endpoints');
    }
  );

  it('initializes standalone routes from the current browser location on mount', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    window.history.pushState({}, '', '/music');

    const target = renderApp({
      musicLibrarySnapshot: createMusicLibrarySnapshot(),
      musicBrowseSnapshot: createMusicBrowseSnapshot(),
      musicBrowseDispatch: createMusicBrowseDispatch(),
      musicActionDispatch: createMusicActionDispatch()
    });

    requireAppPageSurface(target, 'music', 'music');
    expect(target.textContent).toContain('Music');
    expect(target.textContent).not.toContain('Multi-host console');
  });

  it.each([
    ['/browser', ['Video', 'Music', 'Albums'], []],
    ['/files', ['Video', 'Music', 'Albums'], []],
    ['/addons/all', ['Kodi Add-ons', 'Add-ons loaded.'], []],
    ['/addons/video', ['Kodi Add-ons', 'Add-ons loaded.'], []],
    ['/addons/audio', ['Kodi Add-ons', 'Add-ons loaded.'], []],
    ['/addons/executable', ['Kodi Add-ons', 'Add-ons loaded.'], []],
    ['/playlists', ['Playlists', 'New playlist'], []],
    ['/settings/web', ['Web interface', 'Language', 'Default player'], []],
    ['/settings/kodi', ['Kodi Settings', 'Choose a Kodi settings section.', 'Games'], []],
    ['/settings/main-menu', ['Main Menu', 'Music', 'Movies'], []],
    ['/settings/addons', ['Add-ons', 'Toggle installed Kodi add-ons.', 'Safe Video Demo'], []],
    ['/settings/search', ['Search', 'Custom Add-on search', 'Add custom add-on searches.'], []],
    [
      '/help',
      [
        'About Chorus 3',
        'Status report',
        'What is Chorus?',
        'Help Topics',
        'Readme',
        'Changelog',
        'Translations',
        'License'
      ],
      []
    ],
    ['/help/overview', ['About Chorus 3', 'Status report', 'What is Chorus?'], []],
    ['/help/keyboard', ['Keyboard', 'Key Binds', 'Play/Pause'], []],
    ['/help/readme', ['Readme', 'Chorus 3', 'Kodi'], []],
    ['/help/changelog', ['Changelog', 'Chorus'], []],
    ['/help/translations', ['Translations', 'Fallback', 'Submitting an update'], []],
    ['/help/license', ['License', 'Chorus 3 License', 'GNU General Public License'], []],
    ['/remote', ['Remote control', 'Directional pad'], []],
    ['/browser/music/1', ['Video', 'Music', 'Albums'], ['music/1', 'smb://', 'special://']],
    [
      '/playlists/music',
      ['Playlists', 'Local playlist not found', 'Choose an existing playlist.'],
      ['playlists/music', 'smb://', 'special://']
    ],
    [
      '/settings/kodi/interface',
      ['Kodi Settings', 'Choose a Kodi settings section.', 'Interface', 'Reload settings'],
      [
        'settings/kodi/interface',
        'Deferred Kodi settings section',
        'S06-owned Kodi settings behavior',
        'smb://',
        'special://'
      ]
    ]
  ] as const)(
    'renders S03 route %s with app-native safe surface copy',
    (pathname, expectedCopy, forbiddenCopy) => {
      vi.stubGlobal('fetch', createKodiFetchMock());

      const target = renderApp({
        route: parseAppRoute(pathname),
        remoteSnapshot: createRemoteSnapshot(),
        remoteInputDispatch: createRemoteInputDispatch(),
        playerSnapshot: activeVideoSnapshot(),
        playerDispatch: createPlayerDispatch(),
        addonsSnapshot: createAddonsSnapshot(),
        addonsDispatch: createAddonsDispatch(),
        settingsSnapshot: createSettingsSnapshot(),
        settingsDispatch: createSettingsDispatch(),
        mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
        mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
        mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch(),
        mediaFilesSnapshot: createMediaFilesSnapshot(),
        mediaFilesDispatch: createMediaFilesDispatch(),
        mediaFilesActionDispatch: createMediaFilesActionDispatch()
      });

      requirePrimaryShellStage(target);
      const text = target.textContent ?? '';
      for (const expected of expectedCopy) {
        expect(text, `${pathname} should include ${expected}`).toContain(expected);
      }
      for (const forbidden of [
        'Route not found',
        'Multi-host console',
        'Save trusted Kodi endpoints',
        'Detailed parity for this route is deferred',
        ...forbiddenCopy
      ]) {
        expect(text, `${pathname} should not include ${forbidden}`).not.toContain(forbidden);
      }
    }
  );

  it('wires M007 visual proof fixtures through App surfaces without leaking unsafe proof query copy', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());

    const routes = [
      ['/music', ['Music', 'Nina Simone', 'Pastel Blues']],
      ['/movies', ['Movies', 'Neon Harbor', 'Quiet Signal']],
      ['/tvshows', ['TV shows', 'Aurora Files']],
      ['/browser', ['Albums', 'Sinnerman.flac']],
      ['/addons/video', ['Video add-ons', 'Safe Video Demo']],
      ['/addons/plugin.video.safe-demo', ['Safe Video Demo', 'Add-on detail loaded.']],
      ['/playlists', ['Playlists', 'Browser Jazz', 'Blue in Green']],
      [
        '/settings/kodi/interface',
        ['Kodi settings section', 'Kodi Settings', 'Autoplay next item']
      ],
      ['/help', ['Help', 'About Chorus 3', 'Add-ons', 'Developers']],
      ['/help/readme', ['Readme', 'Chorus 3']]
    ] as const;

    for (const [pathname, expectedCopy] of routes) {
      const target = renderApp(
        createM007VisualProofAppProps({
          pathname,
          search:
            '?m007-visual-proof=1&token=Basic&password=CHORUS3_SENTINEL_SECRET&next=smb://admin:p@ssword@nas/private&storage=localStorage'
        })
      );

      requirePrimaryShellStage(target);
      expect(target.querySelector('[data-app-page-surface]')).toBeInstanceOf(HTMLElement);
      if (pathname === '/playlists') {
        expect(
          target.querySelector('[data-local-playlists-panel], .classic-local-playlists')
        ).toBeInstanceOf(HTMLElement);
      }
      const text = target.textContent ?? '';
      for (const expected of expectedCopy) {
        expect(text, `${pathname} should include ${expected}`).toContain(expected);
      }
      expect(text, `${pathname} should avoid setup console`).not.toContain('Setup console');
      expect(text, `${pathname} should avoid generic not-found`).not.toMatch(
        /route not found|Route not found|Settings route not found|Add-ons route not found/u
      );
      expect(text, `${pathname} should avoid legacy placeholder copy`).not.toContain(
        'Detailed parity for this route is deferred'
      );
      for (const forbidden of M007_VISUAL_PROOF_FORBIDDEN_TEXT) {
        if (pathname.startsWith('/help/') && forbidden === 'http://') {
          continue;
        }
        expect(text, `${pathname} should not include ${forbidden}`).not.toContain(forbidden);
      }

      unmountCurrentApp();
    }
  });

  it('wires local and Kodi media playlists into /playlists without mixing their panels', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'playlists' } },
      localPlaylistSnapshot: createLocalPlaylistSnapshot({
        storageWarning: {
          code: 'write-failed',
          message: 'Local playlists could not be written. Changes are kept in memory only.'
        }
      }),
      localPlaylistDispatch: createLocalPlaylistDispatch(),
      mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
      mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
      mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch()
    });

    const surface = requireAppPageSurface(target, 'playlists', 'playlists');
    const localText = getLocalPlaylistsPanelText(target);

    expect(surface.dataset.appPageStatus).toBe('implemented');
    expect(
      Array.from(target.querySelectorAll('button')).some(
        (button) => button.textContent?.trim() === 'New playlist'
      )
    ).toBe(true);
    expect(target.textContent).not.toContain('creation remains guarded');
    expect(localText).toContain('Playlists');
    expect(localText).toContain('Browser Jazz');
    expect(localText).toContain('Blue in Green');
    expect(localText).not.toContain('creation remains guarded');
    const mediaPanel = target.querySelector('.media-playlists-panel');
    expect(mediaPanel).not.toBeNull();
    expect(mediaPanel?.textContent).toContain('Late Night Jazz.xsp');
    expect(mediaPanel?.textContent).not.toContain('Browser Jazz');
  });

  it('renders local playlist detail through the real local playlist surface without leaking unmatched route ids', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const localPlaylistSnapshot = createLocalPlaylistSnapshot();

    let target = renderApp({
      route: {
        kind: 'primary',
        route: { kind: 'playlistDetail', playlistid: 'playlist-local_jazz' }
      },
      localPlaylistSnapshot,
      localPlaylistDispatch: createLocalPlaylistDispatch(),
      mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
      mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
      mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch()
    });

    expect(requireAppPageSurface(target, 'playlistDetail', 'playlists').dataset.appPageStatus).toBe(
      'implemented'
    );
    expect(target.querySelector('.deferred-primary-page')).toBeNull();
    expect(getLocalPlaylistsPanelText(target)).toContain('Browser Jazz');
    expect(getLocalPlaylistsPanelText(target)).toContain('Blue in Green');

    unmountCurrentApp();

    target = renderApp({
      route: {
        kind: 'primary',
        route: { kind: 'playlistDetail', playlistid: 'missing-safe-id' }
      },
      localPlaylistSnapshot,
      localPlaylistDispatch: createLocalPlaylistDispatch(),
      mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
      mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
      mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch()
    });

    const text = target.textContent ?? '';
    expect(getLocalPlaylistsPanel(target)).toBeInstanceOf(HTMLElement);
    expect(text).toContain('Local playlist not found');
    expect(text).not.toContain('missing-safe-id');
    expect(text).not.toContain('smb://');
    expect(text).not.toContain('special://');
  });

  it('keeps primary shell modules store-agnostic and panel-free after app page extraction', () => {
    for (const file of [
      'src/lib/app-shell/AppShell.svelte',
      'src/lib/app-shell/PlaylistDrawer.svelte',
      'src/lib/app-shell/appNavigation.ts'
    ]) {
      const source = readCachedSource(file);
      expect(source, `${file} must not import stores`).not.toMatch(
        /['"]\$lib\/stores|['"]\.\.\/stores|['"]\.\/stores/u
      );
      expect(source, `${file} must not import app page panels`).not.toMatch(
        /MusicLibraryPanel|MusicBrowsePanel|MediaFilesPanel|MediaPlaylistsPanel|MediaSearchPanel|VideoMoviesPanel|VideoTvShowsPanel|AddonsPanel|SettingsPanel|RemoteInputPanel/u
      );
    }

    const surfaceSource = readCachedSource('src/lib/app-pages/AppPageSurface.svelte');
    expect(surfaceSource).toContain('data-app-page-surface');
    expect(surfaceSource).not.toMatch(/import\s+(?!type)[^;]+from ['"]\$lib\/stores/u);
    expect(surfaceSource).not.toMatch(/import\s+RemoteInputPanel\s+from/u);
  });

  it('keeps Chorus2 primary video detail routes on the classic library surface', () => {
    const surfaceSource = readCachedSource('src/lib/app-pages/AppPageSurface.svelte');
    const libraryBranch = surfaceSource.indexOf('{#if currentLibraryRoute}');

    expect(libraryBranch).toBeGreaterThanOrEqual(0);
    expect(surfaceSource).toContain("import { isLibraryRoute } from './libraryRouteFilters'");
    expect(surfaceSource).not.toContain('const isVideoDetailRoute = $derived(');
    expect(surfaceSource).not.toContain('<VideoMovieDetailShell');
  });

  it('keeps the extracted primary shell safe with empty nav, enabled drawer defaults, and trailing package base', () => {
    document.body.innerHTML = '<div id="app-test-root"></div>';
    const target = document.getElementById('app-test-root');
    expect(target).toBeInstanceOf(HTMLElement);

    mountedComponent = mount(PrimaryAppShell, {
      target: target as HTMLElement,
      props: {
        navigationItems: [],
        routeIdentity: { kind: 'unknown', label: 'fixture' },
        stageLabel: '',
        drawer: { label: '', mediaMode: 'audio', collapsed: false }
      }
    }) as Record<string, unknown>;
    flushSync();

    const shell = target?.querySelector<HTMLElement>('[aria-label="Chorus media controller"]');
    expect(shell).toBeInstanceOf(HTMLElement);
    expect(target?.querySelectorAll('aside[aria-label="Primary navigation"] a')).toHaveLength(0);
    expect(requirePackageShellButtonByText(target as HTMLElement, 'Audio').disabled).toBe(false);
    expect(requirePackageShellButtonByAria(target as HTMLElement, 'Playlist menu').disabled).toBe(
      false
    );
    expect(requirePackageShellButtonByAria(target as HTMLElement, 'Shuffle').disabled).toBe(true);

    const packageItems = createAppNavigationItems({
      packageBasePath: `${KODI_WEBINTERFACE_BASE_PATH}/`,
      activeRoute: { kind: 'home' }
    });

    for (const item of packageItems) {
      expect(item.href, `${item.title} package prefix`).toMatch(
        /^\/addons\/webinterface\.chorus3(?:\/|$)/u
      );
      expect(item.href, `${item.title} avoids doubled slashes`).not.toMatch(
        /webinterface\.chorus3\/\//u
      );
    }
  });

  it('uses an implicit local Kodi host and hides multi-host setup when package-mounted', async () => {
    const fetchMock = createKodiFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost()
    });

    expect(target.textContent).not.toContain('Multi-host console');
    expect(target.textContent).not.toContain('Save trusted Kodi endpoints');
    expect(target.querySelector('.host-grid')).toBeNull();

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(connectionStore.snapshot.status).toBe('connected');
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://kodi.local:8080/jsonrpc');
  });

  it('keeps package-mounted classic shell logo and rail links inside the package base with truthful targets', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost()
    });

    const logo = target.querySelector<HTMLAnchorElement>('.classic-logo');
    expect(logo).toBeInstanceOf(HTMLAnchorElement);
    expect(logo?.getAttribute('href')).toBe(
      buildAppRoute(
        { kind: 'primary', route: { kind: 'home' } },
        { packageBasePath: KODI_WEBINTERFACE_BASE_PATH, routeMode: 'hash' }
      )
    );

    const logoImage = logo?.querySelector<HTMLImageElement>('img');
    expect(logoImage).toBeInstanceOf(HTMLImageElement);
    expect(logoImage?.getAttribute('src')).not.toMatch(/^\/classic-assets(?:\/|$)/u);

    for (const [title, route] of shellRailTargets()) {
      const href = requireRailLink(target, title).getAttribute('href');
      const expectedHref = buildPackageMountedHref(route);

      expect(href, `${title} href`).toBe(expectedHref);
      expect(href, `${title} package target`).toMatch(
        /^\/addons\/webinterface\.chorus3(?:\/(?:[a-z0-9/.-]+)?|\/?#[a-z0-9/?=&%+_.:-]*)?$/iu
      );
    }

    expect(target.querySelector('.host-grid')).toBeNull();
    expect(target.textContent).not.toContain('Multi-host console');
    expect(target.textContent).not.toContain('Save trusted Kodi endpoints');
    expect(requireRailLink(target, 'Music').getAttribute('aria-current')).toBe('page');
    for (const [title] of shellRailTargets().filter(([title]) => title !== 'Music')) {
      expect(requireRailLink(target, title).getAttribute('aria-current'), `${title} active`).toBe(
        null
      );
    }
  });

  it('renders representative standalone and package-mounted submenu hrefs under the primary rail', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());

    const submenuExpectations = [
      ['Music', 'Genres', { kind: 'primary', route: { kind: 'musicGenres' } }],
      ['Movies', 'Movies', { kind: 'primary', route: { kind: 'moviesRecent' } }],
      ['TV shows', 'TV shows', { kind: 'primary', route: { kind: 'tvshowsRecent' } }],
      ['Add-ons', 'Video', { kind: 'primary', route: { kind: 'addonsVideo' } }],
      ['Settings', 'Add-ons', { kind: 'primary', route: { kind: 'settingsAddons' } }],
      ['Help', 'About', { kind: 'primary', route: { kind: 'help' } }]
    ] as const satisfies readonly (readonly [string, string, AppRoute])[];

    for (const [railTitle, submenuLabel, route] of submenuExpectations) {
      const primaryRoute = route.kind === 'primary' ? route.route : null;
      expect(primaryRoute, `${railTitle} primary route fixture`).not.toBeNull();
      const navItem = createAppNavigationItems({ activeRoute: primaryRoute }).find(
        (item) => item.title === railTitle
      );
      const submenuItem = navItem?.submenuGroups
        ?.flatMap((group) => group.items)
        .find((item) => item.label === submenuLabel);
      const href = submenuItem?.href ?? null;
      expect(href, `${railTitle} / ${submenuLabel} standalone href`).toBe(buildAppRoute(route));
      expect(
        href,
        `${railTitle} / ${submenuLabel} standalone href avoids package prefix`
      ).not.toMatch(/^\/addons\/webinterface\.chorus3(?:\/|$)/u);
    }

    for (const [railTitle, submenuLabel, route] of submenuExpectations) {
      const target = renderApp({
        route,
        packageMountedHost: createPackageMountedHost()
      });
      const href = requireSubmenuLink(target, railTitle, submenuLabel).getAttribute('href');
      const expectedHref = buildPackageMountedHref(route);
      expect(href, `${railTitle} / ${submenuLabel} package href`).toBe(expectedHref);
      expect(href, `${railTitle} / ${submenuLabel} package prefix`).toMatch(
        /^\/addons\/webinterface\.chorus3(?:\/|$)/u
      );
      expect(href, `${railTitle} / ${submenuLabel} avoids doubled slashes`).not.toMatch(
        /webinterface\.chorus3\/\//u
      );
      unmountCurrentApp();
    }
  });

  it.each([
    ['/addons/webinterface.chorus3/music/genres', 'Music', 'Genres'],
    ['/addons/webinterface.chorus3/settings/kodi/interface', 'Settings', 'Interface'],
    ['/addons/webinterface.chorus3/help/keyboard', 'Help', 'Keyboard']
  ] as const)(
    'marks package submenu %s as active without route fallback copy',
    (pathname, railTitle, submenuLabel) => {
      vi.stubGlobal('fetch', createKodiFetchMock());

      const target = renderApp({
        route: parseAppRoute(pathname, '', { packageBasePath: KODI_WEBINTERFACE_BASE_PATH }),
        packageMountedHost: createPackageMountedHost(),
        settingsSnapshot: createSettingsSnapshot(),
        settingsDispatch: createSettingsDispatch()
      });

      requirePrimaryShellStage(target);
      expect(target.textContent).not.toContain('Route not found');
      expect(target.textContent).not.toContain('Multi-host console');
      expect(target.textContent).not.toContain('Save trusted Kodi endpoints');
      expect(requireRailLink(target, railTitle).getAttribute('aria-current')).toBe('page');
      expect(requireSubmenuLink(target, railTitle, submenuLabel).getAttribute('aria-current')).toBe(
        'page'
      );
    }
  );

  it('wires primary drawer destination, media, collapse, and menu actions through App dispatch seams', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(
      createDispatchSnapshot({ mode: 'local', lastCommand: 'startLocalPlayback' })
    );
    const queueDispatch = createQueuePanelDispatch();

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch,
      queueDispatch
    });

    expect(
      requirePackageShellButtonContainingText(target, 'Local').getAttribute('aria-pressed')
    ).toBe('true');
    expect(
      requirePackageShellButtonContainingText(target, 'Kodi').getAttribute('aria-pressed')
    ).toBe('false');

    requirePackageShellButtonContainingText(target, 'Local').click();
    await tick();
    expect(playerDispatch.startLocalPlayback).not.toHaveBeenCalled();
    expect(playerDispatch.resumeOnKodi).not.toHaveBeenCalled();

    requirePackageShellButtonContainingText(target, 'Kodi').click();
    await tick();
    expect(playerDispatch.resumeOnKodi).toHaveBeenCalledTimes(1);

    const playlist = target.querySelector<HTMLElement>('aside.classic-playlist');
    expect(playlist).toBeInstanceOf(HTMLElement);
    expect(playlist?.dataset.collapsed).toBe('false');
    requirePackageShellButtonByAria(target, 'Collapse playlist').click();
    await tick();
    expect(playlist?.dataset.collapsed).toBe('true');
    expect(target.querySelector<HTMLElement>('.chorus-app')?.dataset.playlistLayout).toBe(
      'collapsed'
    );

    expect(requirePackageShellButtonByText(target, 'Audio').getAttribute('aria-selected')).toBe(
      'true'
    );
    requirePackageShellButtonByText(target, 'Video').click();
    await tick();
    expect(requirePackageShellButtonByText(target, 'Video').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(requirePackageShellButtonByText(target, 'Audio').getAttribute('aria-selected')).toBe(
      'false'
    );

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    expect(
      requirePackageShellButtonByAria(target, 'Playlist menu').getAttribute('aria-expanded')
    ).toBe('true');
    expect(requirePackageShellButtonByText(target, 'Clear playlist').disabled).toBe(false);
    requirePackageShellButtonByText(target, 'Clear playlist').click();
    await tick();
    expect(queueDispatch.clear).toHaveBeenCalledTimes(1);
    expect(requirePackageShellButtonByText(target, 'Refresh playlist').disabled).toBe(false);
    expect(requirePackageShellButtonByText(target, 'Party mode').disabled).toBe(false);
    expect(requirePackageShellButtonByText(target, 'Save Kodi playlist').disabled).toBe(true);
  });

  it('guards redundant and running drawer commands without leaking rejected dispatch details', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'kodi' }));
    vi.mocked(playerDispatch.startLocalPlayback).mockRejectedValue(
      new Error('smb://admin:p@ssword@nas.local/private/token')
    );
    vi.mocked(playerDispatch.resumeOnKodi).mockRejectedValue(
      new Error('http://admin:p@ssword@kodi.local:8080/jsonrpc token')
    );
    const queueDispatch = createQueuePanelDispatch(
      createQueueDispatchSnapshot({ commandStatus: 'running', lastCommand: 'clear' })
    );
    vi.mocked(queueDispatch.clear).mockRejectedValue(
      new Error('Authorization Basic abc123 localStorage')
    );

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch,
      queueDispatch
    });

    requirePackageShellButtonContainingText(target, 'Kodi').click();
    await tick();
    expect(playerDispatch.resumeOnKodi).not.toHaveBeenCalled();
    expect(playerDispatch.startLocalPlayback).not.toHaveBeenCalled();

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const clearButton = requirePackageShellButtonByText(target, 'Clear playlist');
    expect(clearButton.disabled).toBe(true);
    clearButton.click();
    await tick();
    expect(queueDispatch.clear).not.toHaveBeenCalled();

    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('Authorization Basic');
    expect(target.textContent).not.toContain('localStorage');
  });

  it('does not resume Kodi when Kodi destination is already active', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'kodi' }));

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch
    });

    requirePackageShellButtonContainingText(target, 'Kodi').click();
    await tick();

    expect(playerDispatch.resumeOnKodi).not.toHaveBeenCalled();
    expect(playerDispatch.startLocalPlayback).not.toHaveBeenCalled();
  });

  it('disables drawer Clear while the queue dispatch command is running', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const queueDispatch = createQueuePanelDispatch(
      createQueueDispatchSnapshot({ commandStatus: 'running', lastCommand: 'clear' })
    );

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      queueDispatch
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();

    const clearButton = requirePackageShellButtonByText(target, 'Clear playlist');
    expect(clearButton.disabled).toBe(true);
    expect(clearButton.title).toContain('Queue command is running');
  });

  it('routes local drawer Clear to the selected local playlist instead of the Kodi queue', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'local' }));
    const queueDispatch = createQueuePanelDispatch();
    const localPlaylistDispatch = createLocalPlaylistDispatch();
    const localPlaylistSnapshot = createLocalPlaylistSnapshot({
      selectedPlaylistId: 'playlist-local_jazz'
    });

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerDispatch,
      queueDispatch,
      localPlaylistSnapshot,
      localPlaylistDispatch
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const clearButton = requirePackageShellButtonByText(target, 'Clear playlist');
    expect(clearButton.disabled).toBe(false);

    clearButton.click();
    await tick();

    expect(localPlaylistDispatch.clearPlaylist).toHaveBeenCalledWith('playlist-local_jazz');
    expect(queueDispatch.clear).not.toHaveBeenCalled();
  });

  it('routes Kodi drawer Clear to the Kodi queue dispatch', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'kodi' }));
    const queueDispatch = createQueuePanelDispatch();
    const localPlaylistDispatch = createLocalPlaylistDispatch();

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerDispatch,
      queueDispatch,
      localPlaylistDispatch
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const clearButton = requirePackageShellButtonByText(target, 'Clear playlist');
    expect(clearButton.disabled).toBe(false);

    clearButton.click();
    await tick();

    expect(queueDispatch.clear).toHaveBeenCalledOnce();
    expect(localPlaylistDispatch.clearPlaylist).not.toHaveBeenCalled();
  });

  it('routes Kodi drawer Refresh to player and queue refreshes', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const refreshPlayer = vi.spyOn(playerStore, 'refresh').mockResolvedValue();
    const refreshQueue = vi.spyOn(queueStore, 'refresh').mockResolvedValue();
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'kodi' }));

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerDispatch
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const refreshButton = requirePackageShellButtonByText(target, 'Refresh playlist');
    expect(refreshButton.disabled).toBe(false);

    refreshButton.click();
    await tick();
    await tick();

    expect(refreshPlayer).toHaveBeenCalledWith('manual');
    expect(refreshQueue).toHaveBeenCalledWith('manual');
  });

  it('routes Kodi drawer Party mode to the Kodi player dispatch', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'kodi' }));

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const partyModeButton = requirePackageShellButtonByText(target, 'Party mode');
    expect(partyModeButton.disabled).toBe(false);

    partyModeButton.click();
    await tick();

    expect(playerDispatch.setPartyMode).toHaveBeenCalledWith('toggle');
  });

  it('disables local drawer Clear and Save with safe truthful copy when no local playlist is selected', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'local' }));
    const localPlaylistDispatch = createLocalPlaylistDispatch();
    const localPlaylistSnapshot = createLocalPlaylistSnapshot({
      playlists: [],
      selectedPlaylistId: null,
      selectedPlaylist: null
    });

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerDispatch,
      localPlaylistSnapshot,
      localPlaylistDispatch
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();

    const clearButton = requirePackageShellButtonByText(target, 'Clear playlist');
    const saveButton = requirePackageShellButtonByText(target, 'Save Kodi playlist');
    expect(clearButton.disabled).toBe(true);
    expect(clearButton.title).toContain('Select a local playlist');
    expect(saveButton.disabled).toBe(true);
    expect(saveButton.title).toContain('Select a local playlist');
    expect(target.textContent).not.toContain('localStorage');
  });

  it('saves safe current Kodi queue items into the selected local playlist from the drawer', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'local' }));
    const localPlaylistDispatch = createLocalPlaylistDispatch();
    const queueSnapshot: QueueStoreSnapshot = {
      refreshStatus: 'ready',
      playlistid: 1,
      activePosition: 0,
      items: [
        {
          position: 0,
          label: 'Blue in Green',
          type: 'song',
          duration: 337
        },
        {
          position: 1,
          label: 'smb://admin:p@ssword@nas/private/secret.flac',
          title: 'Safe fallback title',
          type: 'song'
        }
      ],
      limits: { start: 0, end: 2, total: 2 },
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-05-04T12:00:00.000Z',
      lastError: null
    };

    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'playlists' } },
      packageMountedHost: createPackageMountedHost(),
      playerDispatch,
      localPlaylistSnapshot: createLocalPlaylistSnapshot(),
      localPlaylistDispatch,
      queueSnapshot
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const saveButton = requirePackageShellButtonByText(target, 'Save Kodi playlist');
    expect(saveButton.disabled).toBe(false);

    saveButton.click();
    await tick();

    expect(localPlaylistDispatch.addItems).toHaveBeenCalledWith('playlist-local_jazz', [
      {
        kind: 'audio',
        label: 'Blue in Green',
        file: 'queue-item:0',
        sourceId: 'queue:0',
        durationSeconds: 337
      },
      {
        kind: 'audio',
        label: 'Safe fallback title',
        file: 'queue-item:1',
        sourceId: 'queue:1'
      }
    ]);
    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('smb://');
  });

  it('disables local drawer Save when the queue has no supported safe items or commands are running', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'local' }));

    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'playlists' } },
      packageMountedHost: createPackageMountedHost(),
      playerDispatch,
      localPlaylistSnapshot: createLocalPlaylistSnapshot(),
      queueSnapshot: {
        refreshStatus: 'ready',
        playlistid: 1,
        activePosition: null,
        items: [{ position: 0, label: 'https://example.test/private.mp3', type: 'unknown' }],
        limits: { start: 0, end: 1, total: 1 },
        lastRefreshReason: 'manual',
        lastUpdatedAt: '2026-05-04T12:00:00.000Z',
        lastError: null
      }
    });

    requirePackageShellButtonByAria(target, 'Playlist menu').click();
    await tick();
    const saveButton = requirePackageShellButtonByText(target, 'Save Kodi playlist');
    expect(saveButton.disabled).toBe(true);
    expect(saveButton.title).toContain('no supported items');
    expect(saveButton.title).not.toContain('durable playlist persistence');
  });

  it('guards package-mounted broad and deferred controls while keeping wired drawer and playback controls enabled', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const playerDispatch = createPlayerDispatch();
    const queueDispatch = createQueuePanelDispatch();

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch,
      queueDispatch
    });

    const searchInput = target.querySelector<HTMLInputElement>(
      '.classic-search input[type="search"]'
    );
    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect((searchInput as HTMLInputElement).getAttribute('placeholder'), 'shell search').toBe(
      'Search'
    );

    expect(
      requirePackageShellButtonContainingText(target, 'Kodi').getAttribute('aria-pressed')
    ).toBe('true');
    expect(requirePackageShellButtonContainingText(target, 'Local').disabled).toBe(false);
    expect(requirePackageShellButtonByAria(target, 'Playlist menu').disabled).toBe(false);
    expect(requirePackageShellButtonByAria(target, 'Collapse playlist').disabled).toBe(false);

    requirePackageShellButtonContainingText(target, 'Local').click();
    await tick();
    expect(playerDispatch.startLocalPlayback).toHaveBeenCalledTimes(1);

    const playlistMenuButton = requirePackageShellButtonByAria(target, 'Playlist menu');
    playlistMenuButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(playlistMenuButton.getAttribute('aria-expanded')).toBe('true');

    for (const label of ['Audio', 'Video']) {
      const button = requirePackageShellButtonByText(target, label);
      expect(button.disabled, `${label} enabled for drawer contract`).toBe(false);
    }

    requirePackageShellButtonByText(target, 'Video').click();
    await tick();
    expect(requirePackageShellButtonByText(target, 'Video').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(requirePackageShellButtonByText(target, 'Audio').getAttribute('aria-selected')).toBe(
      'false'
    );

    const clearButton = requirePackageShellButtonByText(target, 'Clear playlist');
    expect(clearButton.disabled, 'Local Clear requires a selected local playlist').toBe(true);
    expect(clearButton.title).toContain('Select a local playlist');
    clearButton.click();
    await tick();
    expect(queueDispatch.clear).not.toHaveBeenCalled();

    for (const label of ['Current playlist', 'Party mode']) {
      const button = requirePackageShellButtonByText(target, label);
      expect(button.disabled, `${label} guarded until downstream playlist support`).toBe(true);
    }
    const saveButton = requirePackageShellButtonByText(target, 'Save Kodi playlist');
    expect(saveButton.disabled, 'Local Save requires a selected local playlist').toBe(true);
    expect(saveButton.title).toContain('Select a local playlist');
    expect(isDisabledOrGuarded(requirePackageShellButtonByAria(target, 'Shuffle')), 'Shuffle').toBe(
      false
    );
    expect(isDisabledOrGuarded(requirePackageShellButtonByAria(target, 'More')), 'More').toBe(
      false
    );

    for (const label of ['Previous', 'Play', 'Next', 'Toggle mute', 'Fullscreen']) {
      expect(requirePackageShellButtonByAria(target, label).disabled, `${label} enabled`).toBe(
        false
      );
    }
  });

  it('routes package-mounted representative rail targets and Remote to real surfaces', () => {
    vi.stubGlobal('fetch', createKodiFetchMock());

    const railTarget = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost()
    });

    expect(requireRailLink(railTarget, 'Browser').getAttribute('href')).toBe(
      buildPackageMountedHref({ kind: 'primary', route: { kind: 'browser' } })
    );
    expect(requireRailLink(railTarget, 'Playlists').getAttribute('href')).toBe(
      buildPackageMountedHref({ kind: 'primary', route: { kind: 'playlists' } })
    );
    expect(requireRailLink(railTarget, 'Help').getAttribute('href')).toBe(
      buildPackageMountedHref({ kind: 'primary', route: { kind: 'help' } })
    );

    unmountCurrentApp();

    const remoteInputDispatch = createRemoteInputDispatch();
    const remoteTarget = renderApp({
      route: { kind: 'remote' },
      packageMountedHost: createPackageMountedHost(),
      remoteSnapshot: remoteInputDispatch.snapshot,
      remoteInputDispatch,
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch: createPlayerDispatch()
    });
    expect(getRemoteInputPanelText(remoteTarget)).toContain('Remote');
    expect(remoteTarget.querySelector('.parity-placeholder')).toBeNull();
    expect(remoteTarget.querySelector('.host-grid')).toBeNull();
    expect(railTarget.textContent).not.toMatch(PARITY_PLACEHOLDER_FORBIDDEN_COPY);
  });

  it('opens and closes the package shell Kodi remote overlay from the footer control', async () => {
    vi.stubGlobal('fetch', createKodiFetchMock());
    const remoteInputDispatch = createRemoteInputDispatch();
    const playerDispatch = createPlayerDispatch(createDispatchSnapshot({ mode: 'kodi' }));

    const target = renderApp({
      route: { kind: 'dashboard' },
      packageMountedHost: createPackageMountedHost(),
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch,
      remoteSnapshot: remoteInputDispatch.snapshot,
      remoteInputDispatch
    });

    expect(target.querySelector('.remote-overlay')).toBeNull();

    requirePackageShellButtonByAria(target, 'Open Kodi remote').click();
    await tick();

    expect(target.querySelector('.remote-overlay')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.remote-overlay__close')).toBeInstanceOf(HTMLButtonElement);
    expect(getRemoteInputPanelText(target)).toContain('Remote');

    requirePackageShellButtonByAria(target, 'Close Kodi remote').click();
    await tick();

    expect(target.querySelector('.remote-overlay')).toBeNull();

    requirePackageShellButtonByAria(target, 'Open Kodi remote').click();
    await tick();

    expect(target.querySelector('.remote-overlay')).toBeInstanceOf(HTMLElement);

    requirePackageShellButtonByAria(target, 'Stop').click();
    await tick();

    expect(playerDispatch.stop).toHaveBeenCalledTimes(1);
    expect(target.querySelector('.remote-overlay')).toBeNull();
  });

  it('builds classic shell rail targets as normal app paths outside package mode', () => {
    expect(
      Object.fromEntries(shellRailTargets().map(([title, route]) => [title, buildAppRoute(route)]))
    ).toEqual({
      Music: '/music',
      Movies: '/movies/recent',
      'TV shows': '/tvshows/recent',
      Browser: '/browser',
      PVR: '/pvr/tv',
      'Add-ons': '/addons/all',
      'Thumbs up': '/thumbsup',
      Playlists: '/playlists',
      Settings: '/settings/web',
      Help: '/help'
    });
  });

  it('keeps package shell rail vertically reachable on short landscape viewports', () => {
    const componentSource = readCachedSource('src/lib/app-shell/AppShell.svelte');
    const styleSource = readCachedSource('src/lib/app-shell/appShellClassic.css');
    const mediaStart = styleSource.indexOf('@media (max-height: 420px)');
    const nextMediaStart = styleSource.indexOf('@media', mediaStart + 1);
    const shortHeightRule =
      mediaStart >= 0
        ? styleSource.slice(mediaStart, nextMediaStart >= 0 ? nextMediaStart : undefined)
        : '';

    expect(shortHeightRule, 'short-height package shell media query').toContain('.classic-rail');
    expect(shortHeightRule, 'rail scrolls instead of being clipped').toMatch(
      /overflow-y\s*:\s*auto/u
    );
    expect(shortHeightRule, 'rail scroll gestures stay contained').toMatch(
      /overscroll-behavior(?:-y)?\s*:\s*contain/u
    );
    expect(componentSource, 'rail section-name flyouts are not rendered').not.toContain(
      'classic-rail-label'
    );
    expect(componentSource, 'rail labels stay screen-reader only').toContain(
      '<span class="visually-hidden">{item.label}</span>'
    );
    expect(shortHeightRule, 'short-height submenus stay bounded').toMatch(
      /\.classic-submenu[\s\S]*max-height\s*:\s*0/u
    );
  });

  it('renders the now-playing route inside the Chorus shell with injected player props', async () => {
    const target = renderApp({
      route: { kind: 'nowPlaying' },
      localeSnapshot: { locale: 'de' },
      playerSnapshot: activeVideoSnapshot({
        item: {
          label: 'Aurora Signal',
          title: 'Aurora Signal',
          file: 'opaque-media-token'
        }
      }),
      playerDispatch: createPlayerDispatch(),
      localPlayerSnapshot: createLocalPlayerSnapshot()
    });

    await vi.waitFor(() => {
      expect(target.textContent).toContain('Aktuelle Wiedergabe');
    });
    expect(target.textContent).toContain('Aurora Signal');
    expect(target.textContent).toContain('Search Kodi');
    expect(target.querySelector('.chorus-app')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.classic-rail')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.classic-player')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.now-playing-panel')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('main[aria-labelledby="now-playing-embed-title"]')).toBeNull();
    expect(target.textContent).not.toContain('Aktuelle Wiedergabe einbetten');
    expect(target.textContent).not.toContain('Now playing embed');
  });

  it('keeps local-player as the only intentional runtime shell bypass', async () => {
    const runtimeSource = readCachedSource('src/lib/app-pages/AppRuntimeSurface.svelte');
    const firstBranchStart = runtimeSource.indexOf('{#if');
    const shellBranchStart = runtimeSource.indexOf('{:else if isPrimaryShellRoute}');
    const preShellBranch = runtimeSource.slice(firstBranchStart, shellBranchStart);

    expect(preShellBranch).toContain('isLocalPlayerRoute');
    expect(preShellBranch).toContain('loadLocalBrowserPlayerRoute');
    expect(preShellBranch).not.toContain('isNowPlayingRoute');
    expect(preShellBranch).not.toContain('loadNowPlayingPanel');
    expect(runtimeSource).not.toMatch(/import\s+RemoteInputPanel\s+from/u);

    const localPlayerTarget = renderApp({
      route: { kind: 'localPlayer', media: 'movie', id: 88 },
      localPlayerSnapshot: createLocalPlayerSnapshot(),
      playerDispatch: createPlayerDispatch()
    });
    await tick();

    expect(localPlayerTarget.querySelector('.local-browser-player')).toBeInstanceOf(HTMLElement);
    expect(localPlayerTarget.querySelector('.chorus-app')).toBeNull();

    unmountCurrentApp();
    const nowPlayingTarget = renderApp(nowPlayingRouteProps());

    expect(nowPlayingTarget.querySelector('.chorus-app')).toBeInstanceOf(HTMLElement);
    expect(nowPlayingTarget.querySelector('.now-playing-panel')).toBeInstanceOf(HTMLElement);
  });

  it('renders now-playing as a Chorus playback screen when no safe saved host is available', () => {
    const target = renderApp({
      route: { kind: 'nowPlaying' },
      playerSnapshot: createPlayerSnapshot(),
      playerDispatch: createPlayerDispatch(),
      localPlayerSnapshot: createLocalPlayerSnapshot()
    });

    expect(target.textContent).toContain('Now playing');
    expect(target.textContent).toContain('No active Kodi player is available.');
    expect(target.querySelector('.chorus-app')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.now-playing-panel')).toBeInstanceOf(HTMLElement);
    expect(target.textContent).not.toContain('Now playing embed');
    expect(target.textContent).not.toContain(
      'Setup required before the Now Playing embed can connect.'
    );
  });

  it('renders now-playing without reflecting credential-like visible values', () => {
    const target = renderApp({
      route: { kind: 'nowPlaying' },
      playerSnapshot: createPlayerSnapshot(),
      playerDispatch: createPlayerDispatch(),
      localPlayerSnapshot: createLocalPlayerSnapshot()
    });

    expect(target.querySelector('.chorus-app')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.now-playing-panel')).toBeInstanceOf(HTMLElement);
    expect(target.textContent).not.toMatch(
      /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password=|token=|username|password|token|localStorage|sessionStorage|https?:\/\//i
    );
  });

  it('keeps the dashboard route as the default application surface', () => {
    const target = renderApp({ route: { kind: 'dashboard' } });

    expect(target.querySelector('.classic-library-page')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.app-page-frame')).toBeNull();
    expect(target.textContent).toContain('Recently Added Albums');
    expect(target.textContent).toContain('Recently Played Albums');
    expect(target.textContent).not.toContain('Kodi host settings');
    expect(target.textContent).not.toContain('Multi-host console');
    expect(target.textContent).not.toContain('Save trusted Kodi endpoints');
    expect(target.textContent).not.toContain('Video Movies');
  });

  it('renders the settings route through SettingsPanel with injected snapshots and dispatches', async () => {
    const settingsDispatch = createSettingsDispatch();
    const target = renderApp({
      route: { kind: 'settings' },
      settingsSnapshot: createSettingsSnapshot({
        writeStatus: 'error',
        lastError: {
          source: 'write',
          code: 'fixture/rejected-write',
          message: 'A safe fixture write rejection was rolled back.'
        },
        lastWrite: {
          settingId: 'videoplayer.autoplaynextitem',
          value: false,
          status: 'error',
          at: '2026-05-01T20:00:00.000Z'
        },
        rollbackValue: true,
        refreshAfterWrite: {
          settingId: 'videoplayer.autoplaynextitem',
          categoryId: 'videos',
          requestedAt: '2026-05-01T20:00:00.000Z',
          refreshed: false
        },
        writeCounts: { attempted: 2, succeeded: 1, failed: 1 }
      }),
      settingsDispatch
    });
    const settingsText = getSettingsPanelText(target);

    expect(settingsText).toContain('Kodi Settings');
    expect(settingsText).toContain('Settings loaded.');
    expect(settingsText).toContain('Setting change failed.');
    expect(settingsText).toContain('fixture/rejected-write');
    expect(settingsText).toContain('Rollback value: true');
    expect(settingsText).toContain('Refresh after write: pending for');
    expect(settingsText).toContain('videoplayer.autoplaynextitem');
    expect(settingsText).toContain('2 attempted, 1 succeeded, 1 failed');
    expect(settingsText).toContain('Autoplay next item');
    expect(settingsText).toContain('Media source path');
    expect(settingsText).toContain('Read-only: Kodi path settings are not safe to edit here.');
    expect(target.textContent).not.toContain('Kodi host settings');

    const checkbox = target.querySelector<HTMLInputElement>(
      '[data-setting-control="videoplayer.autoplaynextitem"]'
    );
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    checkbox!.checked = false;
    checkbox!.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();

    expect(settingsDispatch.setValue).toHaveBeenCalledWith('videoplayer.autoplaynextitem', false);
  });

  it('switches app shell, Settings, and Add-ons visible copy between English and German without a reload', async () => {
    localeStore.setLocale('en');
    const target = renderApp({
      route: { kind: 'settings' },
      settingsSnapshot: createSettingsSnapshot(),
      settingsDispatch: createSettingsDispatch(),
      addonsSnapshot: createAddonsSnapshot(),
      addonsDispatch: createAddonsDispatch()
    });

    expect(getSettingsPanelText(target)).toContain('Kodi Settings');
    expect(getSettingsPanelText(target)).not.toContain('Kodi-Einstellungen');

    localeStore.setLocale('de');
    await tick();

    expect(getSettingsPanelText(target)).toContain('Kodi-Einstellungen');
    expect(getSettingsPanelText(target)).toContain('Einstellungen geladen.');
    expect(target.querySelector('.classic-logo')).toBeInstanceOf(HTMLElement);

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const addonsTarget = renderApp({
      route: { kind: 'addons' },
      addonsSnapshot: createAddonsSnapshot(),
      addonsDispatch: createAddonsDispatch()
    });

    expect(getAddonsPanelText(addonsTarget)).toContain('Kodi-Add-ons');
    expect(getAddonsPanelText(addonsTarget)).toContain('Add-ons geladen.');
    expect(getAddonsPanelText(addonsTarget)).not.toContain('Kodi Add-ons');
    expect(getAddonsPanelText(addonsTarget)).not.toContain('Add-ons loaded.');
  });

  it('uses an injected locale snapshot for Settings rendering', async () => {
    const localeDispatch = { setLocale: vi.fn(() => ({ ok: true, locale: 'en' as const })) };
    const target = renderApp({
      route: { kind: 'settings' },
      localeSnapshot: { locale: 'de' },
      localeDispatch,
      settingsSnapshot: createSettingsSnapshot(),
      settingsDispatch: createSettingsDispatch()
    });

    expect(getSettingsPanelText(target)).toContain('Kodi-Einstellungen');
    expect(target.querySelector('.locale-toggle select')).toBeNull();
    expect(localeDispatch.setLocale).not.toHaveBeenCalled();
  });

  it('renders the add-ons browser route with injected snapshots and dispatches', async () => {
    const addonsDispatch = createAddonsDispatch();
    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'addonsAll' } },
      addonsSnapshot: createAddonsSnapshot(),
      addonsDispatch,
      settingsSnapshot: createSettingsSnapshot()
    });
    const addonsText = getAddonsPanelText(target);

    expect(addonsText).toContain('Kodi Add-ons');
    expect(addonsText).toContain('Add-ons loaded.');
    expect(addonsText).toContain('3 of 3 add-ons');
    expect(addonsText).toContain('Safe Video Demo');
    expect(addonsText).toContain('Safe Radio');
    expect(addonsText).toContain('Safe Helper Module');
    expect(addonsText).toContain('Broken: Safe fixture dependency missing');
    expect(target.textContent).not.toContain('Kodi Settings');
    expect(target.textContent).not.toContain('Kodi host settings');
    expect(
      target
        .querySelector<HTMLAnchorElement>('a[aria-label="Open Safe Radio details"]')
        ?.getAttribute('href')
    ).toBe('/addons/plugin.audio.safe-radio');

    getButton(target, 'Reload add-ons').click();
    await tick();
    expect(addonsDispatch.load).toHaveBeenCalledTimes(1);

    changeInputValue(getInput(target, '#addon-search'), 'radio');
    await tick();
    changeSelectValue(getSelect(target, '#addon-group-by'), 'enabled');
    await tick();
    expect(addonsDispatch.setSearchQuery).toHaveBeenCalledWith('radio');
    expect(addonsDispatch.setGroupBy).toHaveBeenCalledWith('enabled');
  });

  it('filters primary add-ons category routes without mutating add-ons search state', () => {
    const addonsDispatch = createAddonsDispatch();
    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'addonsVideo' } },
      addonsSnapshot: createAddonsSnapshot({
        addons: [
          createAddonSnapshot({ type: 'xbmc.addon.video' }),
          createAddonSnapshot({
            addonid: 'plugin.audio.safe-radio',
            name: 'Safe Radio',
            type: 'xbmc.addon.audio'
          }),
          createAddonSnapshot({
            addonid: 'script.safe-runner',
            name: 'Safe Runner',
            type: 'xbmc.addon.executable'
          })
        ],
        visibleAddons: [
          createAddonSnapshot({ type: 'xbmc.addon.video' }),
          createAddonSnapshot({
            addonid: 'plugin.audio.safe-radio',
            name: 'Safe Radio',
            type: 'xbmc.addon.audio'
          }),
          createAddonSnapshot({
            addonid: 'script.safe-runner',
            name: 'Safe Runner',
            type: 'xbmc.addon.executable'
          })
        ],
        groups: []
      }),
      addonsDispatch
    });
    const addonsText = getAddonsPanelText(target);

    expect(
      target.querySelector('[data-app-page-surface]')?.getAttribute('data-app-page-route')
    ).toBe('addonsVideo');
    expect(target.querySelector('#addons-page-title')?.textContent).toBe('Video add-ons');
    expect(addonsText).toContain('Safe Video Demo');
    expect(addonsText).not.toContain('Safe Radio');
    expect(addonsText).not.toContain('Safe Runner');
    expect(addonsText).toContain('1 of 1 add-ons');
    expect(addonsDispatch.setSearchQuery).not.toHaveBeenCalled();
  });

  it('preserves routed media search scopes when using the default search dispatch', async () => {
    const search = vi.spyOn(mediaSearchStore, 'search').mockResolvedValue(undefined);

    renderApp({
      route: { kind: 'primary', route: { kind: 'searchMedia', media: 'movie', query: 'bunny' } }
    });
    await tick();

    await vi.waitFor(() => {
      expect(search).toHaveBeenCalledWith({ text: 'bunny', scope: 'movie' });
    });
  });

  it('keeps primary add-ons category detail links package-safe under the package mount path', () => {
    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'addonsVideo' } },
      packageMountedHost: createPackageMountedHost(),
      addonsSnapshot: createAddonsSnapshot({
        addons: [createAddonSnapshot({ type: 'xbmc.addon.video' })],
        visibleAddons: [createAddonSnapshot({ type: 'xbmc.addon.video' })],
        groups: []
      })
    });

    expect(getVideoLink(target, 'Details').getAttribute('href')).toBe(
      '/addons/webinterface.chorus3/#addons/plugin.video.safe-demo'
    );
  });

  it('renders the add-on detail route with injected snapshots and confirmation dispatches', async () => {
    const addonDetailDispatch = createAddonDetailDispatch();
    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' } },
      addonsSnapshot: createAddonsSnapshot(),
      addonDetailDispatch,
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });
    const detailText = getAddonDetailText(target);

    expect(
      target.querySelector('[data-app-page-surface]')?.getAttribute('data-app-page-route')
    ).toBe('addonDetail');
    expect(target.querySelector('#addons-page-title')?.textContent).toBe('Add-on details');
    expect(detailText).toContain('Safe Video Demo');
    expect(detailText).toContain('Add-on detail loaded.');
    expect(detailText).toContain('Add-on write failed.');
    expect(detailText).toContain('fixture.addon-write-rejected');
    expect(detailText).toContain('Safe add-on write rejection was rolled back.');
    expect(detailText).toContain('Enabling plugin.video.safe-demo is pending.');
    expect(detailText).toContain('Last write: disable plugin.audio.safe-radio (error)');
    expect(detailText).toContain('Rolled back to enabled.');
    expect(detailText).toContain('Refresh after write warning');
    expect(detailText).toContain('3 attempted, 1 succeeded, 1 failed');
    expect(target.textContent).not.toContain('Video Movies');

    getButton(target, 'Enable add-on').click();
    await tick();
    expect(getAddonDetailText(target)).toMatch(/Confirm enable\s+Safe Video Demo\?/);
    getButton(target, 'Cancel enable').click();
    await tick();
    expect(addonDetailDispatch.setAddonEnabled).not.toHaveBeenCalled();

    getButton(target, 'Enable add-on').click();
    await tick();
    getButton(target, 'Confirm enable').click();
    await tick();
    expect(addonDetailDispatch.setAddonEnabled).toHaveBeenCalledWith(
      'plugin.video.safe-demo',
      true
    );
  });

  it('updates standalone route state after default add-on detail back navigation', async () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
    const target = renderApp({
      route: { kind: 'primary', route: { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' } },
      addonsSnapshot: createAddonsSnapshot(),
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    expect(
      target.querySelector('[data-app-page-surface]')?.getAttribute('data-app-page-route')
    ).toBe('addonDetail');

    getButton(target, 'Back to add-ons').click();
    await tick();

    expect(pushState).toHaveBeenCalledWith({ routeKind: 'addons' }, '', '/addons/all');
    expect(
      target.querySelector('[data-app-page-surface]')?.getAttribute('data-app-page-route')
    ).toBe('addonsAll');
    expect(target.querySelector('#addons-page-title')?.textContent).toBe('Add-on catalog');
  });

  it('renders standalone add-on execute routes as real status surfaces after dispatch', async () => {
    const executeAddon = vi.fn();
    const replaceState = vi
      .spyOn(window.history, 'replaceState')
      .mockImplementation(() => undefined);
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);

    renderApp({
      route: { kind: 'primary', route: { kind: 'addonExecute', addonid: 'script.safe-runner' } },
      addonsSnapshot: createAddonsSnapshot(),
      addonsDispatch: createAddonsDispatch({ executeAddon })
    });

    await tick();
    await Promise.resolve();

    expect(executeAddon).toHaveBeenCalledWith('script.safe-runner');
    expect(replaceState).not.toHaveBeenCalled();
    expect(popstate).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-app-page-surface]')?.getAttribute('data-app-page-route')
    ).toBe('addonExecute');
    expect(document.querySelector('#addons-page-title')?.textContent).toBe('Execute add-on');
    expect(document.body.textContent).not.toContain('Detailed parity for this route is deferred');

    window.removeEventListener('popstate', popstate);
  });

  it('routes default add-on browser and detail dispatches through the production add-ons store', async () => {
    const { addonsStore } = await import('./lib/stores/addonsStore.svelte');
    const loadAddons = vi.spyOn(addonsStore, 'loadAddons').mockResolvedValue();
    const setSearchQuery = vi.spyOn(addonsStore, 'setSearchQuery').mockImplementation(() => {});
    const setGroupBy = vi.spyOn(addonsStore, 'setGroupBy').mockImplementation(() => {});
    const loadAddonDetail = vi.spyOn(addonsStore, 'loadAddonDetail').mockResolvedValue();
    const setAddonEnabled = vi.spyOn(addonsStore, 'setAddonEnabled').mockResolvedValue();

    const browserTarget = renderApp({ route: { kind: 'addons' } });
    getButton(browserTarget, 'Reload add-ons').click();
    await tick();
    changeInputValue(getInput(browserTarget, '#addon-search'), 'safe');
    await tick();
    changeSelectValue(getSelect(browserTarget, '#addon-group-by'), 'enabled');
    await tick();

    await vi.waitFor(() => {
      expect(loadAddons).toHaveBeenCalledTimes(1);
      expect(setSearchQuery).toHaveBeenCalledWith('safe');
      expect(setGroupBy).toHaveBeenCalledWith('enabled');
    });

    unmount(mountedComponent!);
    mountedComponent = undefined;
    const detailTarget = renderApp({
      route: { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' },
      addonsSnapshot: createAddonsSnapshot()
    });
    getButton(detailTarget, 'Reload detail').click();
    await tick();
    getButton(detailTarget, 'Enable add-on').click();
    await tick();
    getButton(detailTarget, 'Confirm enable').click();
    await tick();

    await vi.waitFor(() => {
      expect(loadAddonDetail).toHaveBeenCalledWith('plugin.video.safe-demo');
      expect(setAddonEnabled).toHaveBeenCalledWith('plugin.video.safe-demo', true);
    });
  });

  it('automatically loads production add-on details for primary detail routes', async () => {
    const { addonsStore } = await import('./lib/stores/addonsStore.svelte');
    const host = createPackageMountedHost();
    const loadAddonDetail = vi.spyOn(addonsStore, 'loadAddonDetail').mockResolvedValue();

    configStore.addHost(host);
    configStore.setActiveHost(host.id);

    renderApp({
      route: {
        kind: 'primary',
        route: { kind: 'addonDetail', addonid: 'audioencoder.kodi.builtin.aac' }
      }
    });
    await tick();

    await vi.waitFor(() => {
      expect(loadAddonDetail).toHaveBeenCalledWith('audioencoder.kodi.builtin.aac');
    });
  });

  it('renders safe add-ons unknown routes without injected fixture data or raw unsafe path text', () => {
    const target = renderApp({
      route: { kind: 'addonsUnknown', pathLabel: '/addons/[redacted]' },
      addonsSnapshot: createAddonsSnapshot({
        addons: [createAddonSnapshot({ name: 'Leaked Fixture Add-on' })],
        visibleAddons: [createAddonSnapshot({ name: 'Leaked Fixture Add-on' })]
      })
    });
    const notFoundText = getAddonsNotFoundText(target);

    expect(notFoundText).toContain('Add-ons route not found');
    expect(notFoundText).toContain('/addons/[redacted]');
    expect(target.querySelector('.addons-panel')).toBeNull();
    expect(target.querySelector('.addon-detail')).toBeNull();
    expect(target.textContent).not.toContain('Leaked Fixture Add-on');
    expect(target.textContent).not.toContain('Authorization');
    expect(target.textContent).not.toContain('Basic');
    expect(target.textContent).not.toContain('SENTINEL_SECRET');
    expect(target.textContent).not.toContain('localStorage');
  });

  it('renders safe Lab unknown route recovery without raw unsafe path text', () => {
    const target = renderApp({
      route: { kind: 'labUnknown', pathLabel: '/lab/[redacted]' },
      settingsSnapshot: createSettingsSnapshot()
    });
    const notFoundText = getLabNotFoundText(target);

    expect(notFoundText).toContain('Lab route not found');
    expect(notFoundText).toContain('/lab/[redacted]');
    expect(target.querySelector('.settings-panel')).toBeNull();
    expect(getVideoLink(target, 'Home').getAttribute('href')).toBe('/');
    expect(getVideoLink(target, 'Help').getAttribute('href')).toBe('/help');
    expect(target.textContent).not.toMatch(/Authorization|Basic|localStorage|admin:p@ssword/i);
  });

  it('renders package-mounted classic PVR routes without fallback copy', () => {
    const target = renderApp({
      route: parseAppRoute('/addons/webinterface.chorus3/pvr/tv', '?token=Basic', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      }),
      packageMountedHost: createPackageMountedHost()
    });

    expect(target.querySelector('.pvr-page')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.parity-placeholder')).toBeNull();
    expect(target.textContent).not.toMatch(PARITY_PLACEHOLDER_FORBIDDEN_COPY);
  });

  it('renders the Remote/Input route as the real remote panel with injected snapshots instead of a parity placeholder', () => {
    const remoteInputDispatch = createRemoteInputDispatch();
    const playerDispatch = createPlayerDispatch();
    const target = renderApp({
      route: { kind: 'remote' },
      remoteSnapshot: createRemoteSnapshot({
        commandStatus: 'failed',
        lastCommand: 'info',
        lastCompletedAt: '2026-05-02T17:30:00.000Z',
        lastError: {
          source: 'http',
          code: 'transport/redacted',
          message: 'Safe fixture error without secrets.'
        }
      }),
      remoteInputDispatch,
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch
    });
    const remoteText = getRemoteInputPanelText(target);

    expect(remoteText).toContain('Remote');
    expect(target.querySelector('.kodi-remote')).toBeInstanceOf(HTMLElement);
    expect(getButtonByAria(target, 'Move left')).toBeInstanceOf(HTMLButtonElement);
    expect(getButtonByAria(target, 'Open context menu')).toBeInstanceOf(HTMLButtonElement);
    expect(target.querySelector('.parity-placeholder')).toBeNull();
  });

  it('routes Remote/Input buttons and playback controls through injected App dispatch seams', async () => {
    const remoteInputDispatch = createRemoteInputDispatch();
    const playerDispatch = createPlayerDispatch();
    const target = renderApp({
      route: { kind: 'remote' },
      remoteSnapshot: remoteInputDispatch.snapshot,
      remoteInputDispatch,
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch
    });

    getButtonByAria(target, 'Move left').click();
    getButtonByAria(target, 'Play').click();
    await tick();

    expect(remoteInputDispatch.sendInput).toHaveBeenCalledWith('left');
    expect(playerDispatch.playPause).toHaveBeenCalledTimes(1);
  });

  it('dispatches remote keyboard shortcuts only on the Remote route and ignores editable or modified events', async () => {
    const remoteInputDispatch = createRemoteInputDispatch();
    const playerDispatch = createPlayerDispatch();
    const target = renderApp({
      route: { kind: 'remote' },
      remoteSnapshot: remoteInputDispatch.snapshot,
      remoteInputDispatch,
      playerSnapshot: activeVideoSnapshot({ application: { volume: 40, muted: false } }),
      playerDispatch
    });

    const moved = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true })
    );
    const selected = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    );
    const modified = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, cancelable: true })
    );
    const search = document.createElement('input');
    target.append(search);
    search.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    await tick();

    expect(moved).toBe(false);
    expect(selected).toBe(false);
    expect(modified).toBe(true);
    expect(remoteInputDispatch.sendInput).toHaveBeenCalledWith('left');
    expect(remoteInputDispatch.sendInput).toHaveBeenCalledWith('select');
    expect(remoteInputDispatch.sendInput).toHaveBeenCalledTimes(2);
    expect(playerDispatch.seekRelativeSeconds).not.toHaveBeenCalled();
    expect(playerDispatch.setVolume).not.toHaveBeenCalled();
  });

  it('does not install remote keyboard shortcuts outside the Remote route and preserves playback shortcuts', async () => {
    const remoteInputDispatch = createRemoteInputDispatch();
    const playerDispatch = createPlayerDispatch();
    renderApp({
      route: { kind: 'dashboard' },
      remoteSnapshot: remoteInputDispatch.snapshot,
      remoteInputDispatch,
      playerSnapshot: activeVideoSnapshot({ application: { volume: 40, muted: false } }),
      playerDispatch
    });

    const seeked = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    );
    await tick();

    expect(seeked).toBe(false);
    expect(remoteInputDispatch.sendInput).not.toHaveBeenCalled();
    expect(playerDispatch.seekRelativeSeconds).toHaveBeenCalledWith(30);
  });

  it('dispatches playback shortcuts globally outside editable controls and removes the listener on unmount', async () => {
    const playerDispatch = createPlayerDispatch();
    const target = renderApp({
      route: { kind: 'dashboard' },
      playerSnapshot: activeVideoSnapshot({ application: { volume: 40, muted: false } }),
      playerDispatch
    });

    const played = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    );
    const volumeChanged = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    );
    const modified = window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, cancelable: true })
    );
    const editable = target.querySelector<HTMLInputElement>('.classic-search input[type="search"]');
    expect(editable).toBeInstanceOf(HTMLInputElement);
    editable?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true })
    );
    await tick();

    expect(played).toBe(false);
    expect(volumeChanged).toBe(false);
    expect(modified).toBe(true);
    expect(playerDispatch.playPause).toHaveBeenCalledTimes(1);
    expect(playerDispatch.setVolume).toHaveBeenCalledWith(45);
    expect(playerDispatch.seekRelativeSeconds).not.toHaveBeenCalled();
    expect(playerDispatch.toggleMute).not.toHaveBeenCalled();

    unmount(mountedComponent!);
    mountedComponent = undefined;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', cancelable: true }));

    expect(playerDispatch.next).not.toHaveBeenCalled();
  });

  it('renders store-backed settings load errors through SettingsPanel by default', async () => {
    await settingsStore.load();
    const target = renderApp({ route: { kind: 'settings' } });
    const settingsText = getSettingsPanelText(target);

    expect(settingsText).toContain('Kodi Settings');
    expect(settingsText).toContain('Settings could not be loaded.');
    expect(settingsText).toContain('No settings sections are available.');
    expect(settingsText).not.toContain('Settings support is loading for this route.');
  });

  it('does not render SettingsPanel for unknown settings subpaths', () => {
    const target = renderApp({
      route: { kind: 'settingsUnknown', pathLabel: '/settings/[redacted]' },
      settingsSnapshot: createSettingsSnapshot()
    });

    expect(target.querySelector('.settings-panel')).toBeNull();
    expect(target.textContent).toContain('Settings route not found');
    expect(target.textContent).not.toContain('Autoplay next item');
  });

  it('renders classic video aliases through existing video surfaces instead of parity placeholders', () => {
    const moviesTarget = renderApp({
      route: parseAppRoute('/movies/recent?Authorization=Basic'),
      videoLibrarySnapshot: createVideoLibrarySnapshot({
        recentlyAddedMovies: [createVideoLibrarySnapshot().movies[0]],
        limits: {
          recentlyAddedMovies: { start: 0, end: 1, total: 1 }
        }
      })
    });

    expect(moviesTarget.textContent).toContain('Movies');
    expect(moviesTarget.textContent).toContain('Recently Added');
    expect(moviesTarget.querySelector('.parity-placeholder')).toBeNull();
    expect(moviesTarget.textContent).not.toMatch(CHORUS2_VIDEO_ALIAS_FORBIDDEN_COPY);

    unmount(mountedComponent!);
    mountedComponent = undefined;

    const movieDetailTarget = renderApp({
      route: parseAppRoute('/movie/4401', '?token=secret'),
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    expect(movieDetailTarget.textContent).toContain('Neon Harbor');
    expect(movieDetailTarget.textContent).toContain('Movies');
    expect(movieDetailTarget.querySelector('.parity-placeholder')).toBeNull();
    expect(movieDetailTarget.textContent).not.toMatch(CHORUS2_VIDEO_ALIAS_FORBIDDEN_COPY);

    unmount(mountedComponent!);
    mountedComponent = undefined;

    const episodeTarget = renderApp({
      route: parseAppRoute('/tvshow/5501/1/6601?Authorization=Basic'),
      videoTvSnapshot: createVideoTvSnapshot()
    });

    expect(episodeTarget.textContent).toContain('Episode detail');
    expect(episodeTarget.textContent).toContain('Signal Mirror');
    expect(episodeTarget.textContent).toContain('Back to Aurora Files');
    expect(episodeTarget.querySelector('.parity-placeholder')).toBeNull();
    expect(episodeTarget.textContent).not.toMatch(CHORUS2_VIDEO_ALIAS_FORBIDDEN_COPY);
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

    await vi.waitFor(() => {
      expect(markMovieWatched).toHaveBeenCalledWith({ movieid: 4402, label: 'Quiet Signal' }, true);
      expect(refreshLibrary).toHaveBeenCalledWith('command:videoWrite');
      expect(refreshMovieDetail).toHaveBeenCalledWith(4402, 'command:videoWrite');
    });
    await waitForText(target, 'Marked Quiet Signal watched.');
  });

  it('surfaces sanitized failed movie writes without refreshing or fabricating local watched state', async () => {
    const markMovieWatched = vi
      .spyOn(videoWriteStore, 'markMovieWatched')
      .mockRejectedValue(
        new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/movie.mkv'
        )
      );
    const refreshLibrary = vi.spyOn(videoLibraryStore, 'refresh').mockResolvedValue();
    const refreshMovieDetail = vi
      .spyOn(videoMovieDetailStore, 'refreshMovieDetail')
      .mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoMovieDetail', movieid: 4402 },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    expect(getVideoDetailPanelText(target)).toContain('Not watched in this snapshot');

    getButtonByAria(target, 'Mark movie Quiet Signal watched').click();
    await waitForText(target, 'Could not mark Quiet Signal watched.');

    const detailText = getVideoDetailPanelText(target);
    expect(markMovieWatched).toHaveBeenCalledWith({ movieid: 4402, label: 'Quiet Signal' }, true);
    expect(refreshLibrary).not.toHaveBeenCalled();
    expect(refreshMovieDetail).not.toHaveBeenCalled();
    expect(detailText).toContain('Could not mark Quiet Signal watched.');
    expect(detailText).toContain('credentials [redacted]');
    expect(detailText).toContain('[redacted-url]');
    expect(detailText).toContain('response body [redacted]');
    expect(detailText).toContain('browser storage');
    expect(detailText).toContain('Not watched in this snapshot');
    expect(detailText).not.toContain('smb://');
    expect(detailText).not.toContain('Authorization');
    expect(detailText).not.toContain('Basic');
    expect(detailText).not.toContain('admin:p@ssword');
    expect(detailText).not.toContain('localStorage');
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

    await vi.waitFor(() => {
      expect(markEpisodeWatched).toHaveBeenCalledWith(
        { episodeid: 6601, label: 'Signal Mirror' },
        true
      );
      expect(refreshEpisodeDetail).toHaveBeenCalledWith(6601, 'command:videoWrite');
    });
    await waitForText(target, 'Marked Signal Mirror watched.');
  }, 15_000);

  it('routes default season batch writes through videoWriteStore and refreshes season episodes after partial writes', async () => {
    const markEpisodesWatched = vi
      .spyOn(videoWriteStore, 'markEpisodesWatched')
      .mockResolvedValue();
    const refreshSeasonEpisodes = vi
      .spyOn(videoTvStore, 'refreshSeasonEpisodes')
      .mockResolvedValue();
    const target = renderApp({
      route: { kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 },
      videoTvSnapshot: createVideoTvSnapshot()
    });

    getButtonByAria(target, 'Mark season watched').click();
    await tick();
    await tick();

    await vi.waitFor(() => {
      expect(markEpisodesWatched).toHaveBeenCalledWith(
        [{ episodeid: 6601, label: 'Signal Mirror' }],
        true
      );
      expect(refreshSeasonEpisodes).toHaveBeenCalledWith(5501, 1, 'command:videoWrite');
    });
  });

  it('preserves injected season write dispatches without touching the default video write store', async () => {
    const markEpisodesWatched = vi
      .spyOn(videoWriteStore, 'markEpisodesWatched')
      .mockResolvedValue();
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

  it('renders recent video sections and browse-only video playlists on video routes from injected snapshots', async () => {
    const videoMediaPlaylistsDispatch = createMediaPlaylistsDispatch();
    const videoMediaPlaylistsActionDispatch = createMediaPlaylistsActionDispatch();
    const videoLibrarySnapshot = createVideoLibrarySnapshot({
      recentlyAddedMovies: [
        {
          movieid: 4401,
          label: 'Neon Harbor',
          title: 'Neon Harbor',
          dateadded: '2026-04-28 10:00:00',
          watched: true,
          playcount: 1,
          art: { poster: 'poster:neon-harbor', fanart: 'fanart:neon-harbor' }
        }
      ],
      recentlyPlayedMovies: [
        {
          movieid: 4402,
          label: 'Quiet Signal',
          title: 'Quiet Signal',
          lastplayed: '2026-04-30 21:15:00',
          resume: { position: 1275, total: 5940 }
        }
      ],
      recentlyAddedEpisodes: [
        {
          episodeid: 6601,
          tvshowid: 5501,
          season: 1,
          episode: 1,
          label: 'Signal Mirror',
          title: 'Signal Mirror',
          showtitle: 'Aurora Files',
          dateadded: '2026-04-30 11:00:00'
        }
      ],
      recentlyPlayedEpisodes: [
        {
          episodeid: 6602,
          label: 'Cold Open',
          showtitle: 'Aurora Files',
          lastplayed: '2026-04-29 20:00:00',
          watched: true
        }
      ],
      limits: {
        recentlyAddedMovies: { start: 0, end: 1, total: 1 },
        recentlyPlayedMovies: { start: 0, end: 1, total: 1 },
        recentlyAddedEpisodes: { start: 0, end: 1, total: 1 },
        recentlyPlayedEpisodes: { start: 0, end: 1, total: 1 }
      }
    });
    const target = renderApp({
      route: { kind: 'videoMovies' },
      videoLibrarySnapshot,
      videoMediaPlaylistsSnapshot: createVideoMediaPlaylistsSnapshot(),
      videoMediaPlaylistsDispatch,
      videoMediaPlaylistsActionDispatch
    });

    const recentText = getVideoRecentPanelText(target);
    const playlistsText = getAllMediaPlaylistsPanels(target).at(-1)?.textContent ?? '';

    expect(recentText).toContain('Recently added movies');
    expect(recentText).toContain('Recently played movies');
    expect(recentText).toContain('Recently added episodes');
    expect(recentText).toContain('Recently played episodes');
    expect(recentText).toContain('Neon Harbor');
    expect(recentText).toContain('Quiet Signal');
    expect(recentText).toContain('Signal Mirror');
    expect(recentText).toContain('Cold Open');
    expect(getVideoLink(target, 'Signal Mirror').getAttribute('href')).toBe(
      '/video/tv/5501/seasons/1/episodes/6601'
    );
    expect(
      Array.from(target.querySelectorAll<HTMLAnchorElement>('a')).find(
        (link) => link.textContent?.trim() === 'Cold Open'
      )
    ).toBeUndefined();
    expect(playlistsText).toContain('Video playlists');
    expect(playlistsText).toContain('Rain City Thrillers.xsp');
    expect(playlistsText).toContain('Video item without available actions');
    expect(playlistsText).not.toContain('Play playlist Rain City Thrillers.xsp');
    expect(playlistsText).not.toContain('Queue playlist Rain City Thrillers.xsp');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('Authorization');

    getButtonByAria(target, 'Refresh media playlists').click();
    await tick();
    getButtonByAria(target, 'Open playlist Rain City Thrillers.xsp').click();
    await tick();

    expect(videoMediaPlaylistsDispatch.refresh).toHaveBeenCalledTimes(1);
    expect(videoMediaPlaylistsDispatch.openPlaylist).toHaveBeenCalledWith('video-playlist:1');
    expect(videoMediaPlaylistsActionDispatch.playPlaylistItem).not.toHaveBeenCalled();
    expect(videoMediaPlaylistsActionDispatch.queuePlaylistItem).not.toHaveBeenCalled();
  });

  it('routes default video playlist browsing through the video playlist singleton only', async () => {
    const refreshVideoPlaylists = vi
      .spyOn(videoMediaPlaylistsStore, 'refreshPlaylists')
      .mockResolvedValue();
    const openVideoPlaylist = vi
      .spyOn(videoMediaPlaylistsStore, 'openPlaylist')
      .mockResolvedValue();
    const refreshMusicPlaylists = vi.spyOn(mediaPlaylistsStore, 'refreshPlaylists');
    const openMusicPlaylist = vi.spyOn(mediaPlaylistsStore, 'openPlaylist');
    const target = renderApp({
      route: { kind: 'videoTvShows' },
      videoLibrarySnapshot: createVideoLibrarySnapshot(),
      videoMediaPlaylistsSnapshot: createVideoMediaPlaylistsSnapshot()
    });

    getButtonByAria(target, 'Refresh media playlists').click();
    await tick();
    getButtonByAria(target, 'Open playlist Rain City Thrillers.xsp').click();
    await tick();

    await vi.waitFor(() => {
      expect(refreshVideoPlaylists).toHaveBeenCalledTimes(1);
      expect(openVideoPlaylist).toHaveBeenCalledWith('video-playlist:1');
      expect(refreshMusicPlaylists).not.toHaveBeenCalled();
      expect(openMusicPlaylist).not.toHaveBeenCalled();
    });
  });

  it('renders sanitized recent-video and video-playlist error snapshots on video routes', () => {
    const target = renderApp({
      route: { kind: 'videoMovies' },
      videoLibrarySnapshot: createVideoLibrarySnapshot({
        refreshStatus: 'error',
        lastError: {
          source: 'http',
          code: 'auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/movie.mkv'
        }
      }),
      videoMediaPlaylistsSnapshot: createVideoMediaPlaylistsSnapshot({
        refreshStatus: 'error',
        lastError: {
          source: 'http',
          code: 'auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and special://videoplaylists/private.xsp'
        }
      })
    });

    expect(getVideoRecentPanelText(target)).toContain('credentials');
    expect(getAllMediaPlaylistsPanels(target).at(-1)?.textContent).toContain('credentials');
    expect(target.textContent).toContain('browser storage');
    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('Authorization');
    expect(target.textContent).not.toContain('Basic abc123');
    expect(target.textContent).not.toContain('localStorage');
    expect(target.textContent).not.toContain('raw response body');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('special://');
  });

  it('renders unknown video route recovery links for movies and TV', () => {
    const target = renderApp({
      route: { kind: 'videoUnknown', pathLabel: '/video/[redacted]/clips' },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });

    expect(getVideoLink(target, 'Movies').getAttribute('href')).toBe('/movies/recent');
    expect(getVideoLink(target, 'TV shows').getAttribute('href')).toBe('/tvshows/recent');
  });

  it('renders unknown video routes as sanitized in-app not found UI with a movies link', () => {
    const target = renderApp({
      route: { kind: 'videoUnknown', pathLabel: '/video/[redacted]/clips' },
      videoLibrarySnapshot: createVideoLibrarySnapshot()
    });
    const notFoundText = getVideoNotFoundText(target);

    expect(notFoundText).toContain('Video route not found');
    expect(notFoundText).toContain('/video/[redacted]/clips');
    expect(getVideoLink(target, 'Movies').getAttribute('href')).toBe('/movies/recent');
    expect(notFoundText).not.toContain('Authorization');
    expect(notFoundText).not.toContain('Basic');
    expect(notFoundText).not.toContain('smb://');
  });

  it('renders default no-player Now Playing controls as disabled without dispatching', () => {
    const dispatch = createPlayerDispatch();
    const target = renderApp(
      nowPlayingRouteProps({ playerSnapshot: createPlayerSnapshot(), playerDispatch: dispatch })
    );

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
    const target = renderApp(
      nowPlayingRouteProps({
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
      })
    );

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
    const target = renderApp(
      nowPlayingRouteProps({
        playerSnapshot: activeVideoSnapshot(),
        playerDispatch: createPlayerDispatch()
      })
    );

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
    const target = renderApp(
      nowPlayingRouteProps({ playerSnapshot: activeVideoSnapshot(), playerDispatch: dispatch })
    );

    getButton(target, 'Play or pause').click();
    getButton(target, 'Next').click();
    changeRangeValue(getInput(target, '#now-playing-seek'), '64');
    changeRangeValue(getInput(target, '#now-playing-volume'), '71');
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

  it('renders running command controls while range commits stay available', () => {
    const target = renderApp(
      nowPlayingRouteProps({
        playerSnapshot: activeVideoSnapshot(),
        playerDispatch: createPlayerDispatch(
          createDispatchSnapshot({ commandStatus: 'running', lastCommand: 'seekPercentage' })
        )
      })
    );

    expect(target.textContent).toContain('Running seek percentage.');
    expect(target.textContent).toContain(
      'Another player command is running. Some controls are paused until it finishes.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getInput(target, '#now-playing-volume').disabled).toBe(false);
  });

  it('renders dispatch and refresh errors without secret-like details or raw endpoints', () => {
    const target = renderApp(
      nowPlayingRouteProps({
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
      })
    );

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
    const target = renderApp(
      nowPlayingRouteProps({
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
      })
    );

    expect(target.textContent).toContain('Arrival');
    expect(target.textContent).toContain('Max Richter');
    expect(target.textContent).toContain('Sleep');
    expect(target.textContent).toContain('Subtitles off');
    expect(target.textContent).toContain('Stereo · eng · 2ch');
    expect(getButton(target, 'Play or pause').disabled).toBe(false);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(false);
    expect(target.textContent).not.toContain('/music/private/arrival.flac');
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
});
