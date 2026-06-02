import type { AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
import type { LocalBrowserPlayerDispatch } from '$components/LocalBrowserPlayerRoute.svelte';
import type {
  MediaFilesActionDispatch,
  MediaFilesPanelDispatch
} from '$components/MediaFilesPanel.svelte';
import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
import type {
  MediaSearchActionDispatch,
  MediaSearchPanelDispatch
} from '$components/MediaSearchPanel.svelte';
import type {
  MusicBrowseActionDispatch,
  MusicBrowsePanelDispatch
} from '$components/MusicBrowsePanel.svelte';
import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
import type { RemoteInputPanelRemoteDispatch } from '$components/RemoteInputPanel.svelte';
import type { SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
import type { VideoEpisodeActionDispatch } from '$components/VideoEpisodeDetailShell.svelte';
import type { VideoMovieActionDispatch } from '$components/VideoMovieDetailShell.svelte';
import type { VideoMovieStreamDispatch } from '$components/VideoMovieStreamShell.svelte';
import type {
  VideoSeasonArtworkDispatch,
  VideoSeasonWriteDispatch
} from '$components/VideoSeasonDetailShell.svelte';
import type { AppRoute } from '$lib/app/appRouter';
import type { NowPlayingEmbedQuery } from '$lib/app/nowPlayingEmbedQuery';
import type { LocaleToggleDispatch } from '$components/LocaleToggle.svelte';
import type {
  AddonsStoreSnapshot,
  ActiveHostSummary,
  LocalPlayerStoreSnapshot,
  LocalPlaylistDispatch,
  LocalPlaylistPlayableItem,
  LocalPlaylistStoreSnapshot,
  MediaFilesStoreSnapshot,
  MediaPlaylistsStoreSnapshot,
  MediaSearchStoreSnapshot,
  MusicBrowseStoreSnapshot,
  MusicLibraryStoreSnapshot,
  PlayerStoreSnapshot,
  PvrStoreSnapshot,
  QueueStoreSnapshot,
  RemoteInputDispatchSnapshot,
  SavedKodiHost,
  SettingsStoreSnapshot,
  ThumbsUpStoreSnapshot,
  LocaleStoreSnapshot
} from '$lib/stores';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
import type { VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';
import type { VideoRoute } from '$lib/video/videoRouter';

export interface VideoNavigationDispatch {
  openMovieGrid: () => Promise<void>;
  openMovieDetail: (movie: { movieid: number }) => Promise<void>;
  openRoute: (route: VideoRoute) => Promise<void>;
}

export type PlaylistPlaybackDispatch = PlayerControlsDispatch & {
  setMode?: (mode: 'kodi' | 'local') => void;
  playFileItem?: (item: {
    file: string;
    mediaKind: 'audio' | 'video';
    itemType?: 'file' | 'directory';
  }) => Promise<void> | void;
  canNavigateLocalFilePlaylist?: () => boolean;
  setLocalFilePlaylist?: (
    items: readonly {
      file: string;
      mediaKind: 'audio';
      label?: string;
      title?: string;
      type?: string;
      thumbnail?: string;
    }[],
    startFile?: string
  ) => void;
};

export type PlaylistQueueDispatch = QueuePanelDispatch & {
  queueFileItem?: (item: {
    file: string;
    mediaKind: 'audio' | 'video';
    itemType?: 'file' | 'directory';
  }) => Promise<void> | void;
  queueFileItems?: (
    items: readonly {
      file: string;
      mediaKind: 'audio' | 'video';
      itemType?: 'file' | 'directory';
    }[]
  ) => Promise<void> | void;
};

export interface AppProps {
  playerSnapshot?: PlayerStoreSnapshot;
  playerDispatch?: PlayerControlsDispatch;
  remoteSnapshot?: RemoteInputDispatchSnapshot;
  remoteInputDispatch?: RemoteInputPanelRemoteDispatch;
  localPlayerSnapshot?: LocalPlayerStoreSnapshot;
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
  videoMediaFilesSnapshot?: MediaFilesStoreSnapshot;
  videoMediaFilesDispatch?: MediaFilesPanelDispatch;
  videoMediaFilesActionDispatch?: MediaFilesActionDispatch;
  mediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
  mediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
  mediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
  pvrSnapshot?: PvrStoreSnapshot;
  thumbsUpSnapshot?: ThumbsUpStoreSnapshot;
  videoMediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
  videoMediaPlaylistsDispatch?: MediaPlaylistsPanelDispatch;
  videoMediaPlaylistsActionDispatch?: MediaPlaylistsActionDispatch;
  route?: AppRoute | VideoRoute;
  videoLibrarySnapshot?: VideoLibraryStoreSnapshot;
  videoMovieDetailSnapshot?: VideoMovieDetailStoreSnapshot;
  videoNavigationDispatch?: VideoNavigationDispatch;
  settingsSnapshot?: SettingsStoreSnapshot;
  settingsDispatch?: SettingsPanelDispatch;
  localeSnapshot?: LocaleStoreSnapshot;
  localeDispatch?: LocaleToggleDispatch;
  addonsSnapshot?: AddonsStoreSnapshot;
  addonsDispatch?: AddonsPanelDispatch;
  addonDetailDispatch?: AddonDetailDispatch;
  nowPlayingEmbedQuery?: NowPlayingEmbedQuery;
  nowPlayingHostSummary?: ActiveHostSummary | null;
  nowPlayingRefreshDispatch?: () => Promise<void> | void;
  localBrowserPlayerActionDispatch?: LocalBrowserPlayerDispatch;
  packageMountedHost?: SavedKodiHost | null;
  packageBasePath?: string;
  videoMovieActionDispatch?: VideoMovieActionDispatch;
  videoMovieStreamActionDispatch?: VideoMovieStreamDispatch;
  videoTvSnapshot?: VideoTvStoreSnapshot;
  videoEpisodeActionDispatch?: VideoEpisodeActionDispatch;
  videoSeasonArtworkDispatch?: VideoSeasonArtworkDispatch;
  videoSeasonWriteDispatch?: VideoSeasonWriteDispatch;
}

export type { LocalPlaylistPlayableItem };
