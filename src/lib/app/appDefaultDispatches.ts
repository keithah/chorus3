import type { AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
import type { LocalBrowserPlayerDispatch } from '$components/LocalBrowserPlayerRoute.svelte';
import type {
  MediaFilesActionDispatch,
  MediaFilesActionItem,
  MediaFilesPanelDispatch
} from '$components/MediaFilesPanel.svelte';
import type {
  MediaSearchAddonResultGroup,
  MediaSearchPanelDispatch
} from '$components/MediaSearchPanel.svelte';
import type {
  MusicBrowseActionDispatch,
  MusicBrowsePanelDispatch
} from '$components/MusicBrowsePanel.svelte';
import type { LocaleToggleDispatch } from '$components/LocaleToggle.svelte';
import type { SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
import type { VideoMovieStreamDispatch } from '$components/VideoMovieStreamShell.svelte';
import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
import type { PvrPageDispatch } from '$lib/app-pages/PvrPage.svelte';
import type { VideoEpisodeActionDispatch } from '$components/VideoEpisodeDetailShell.svelte';
import type { VideoMovieActionDispatch } from '$components/VideoMovieDetailShell.svelte';
import type {
  VideoSeasonArtworkDispatch,
  VideoSeasonWriteDispatch
} from '$components/VideoSeasonDetailShell.svelte';
import {
  assertVideoWriteSucceeded,
  toSeasonWriteSummary,
  toVideoWriteEpisodeItems
} from '$lib/app/appVideoWriteAdapters';
import { createMediaSearchActionDispatch } from '$lib/app/appMediaSearchAdapters';
import { createMediaPlaylistActionDispatch } from '$lib/app/mediaPlaylistActionDispatch';
import { startBrowserDownload } from '$lib/app/appDownloads';
import { safePlaylistExportName } from '$lib/app/appPlaylistAdapters';
import { getFileDirectory } from '$lib/kodi';
import {
  createActiveKodiJsonRpcHttpClient,
  addonsStore,
  localeStore,
  mediaFilesStore,
  mediaPlaylistsStore,
  mediaSearchStore,
  musicBrowseStore,
  playerDispatch as defaultPlayerDispatch,
  prepareLocalStreamUrl,
  pvrStore,
  queueDispatch as defaultQueueDispatch,
  settingsStore,
  videoMediaFilesStore,
  videoMediaPlaylistsStore
} from '$lib/stores';
import { configStore } from '$lib/stores/config.svelte';
import { videoTvStore } from '$lib/stores/videoTvStore.svelte';
import { videoWriteStore } from '$lib/stores/videoWriteStore.svelte';
import type { SearchAddonSetting } from '$lib/stores/searchAddons.svelte';

interface AppDefaultDispatchCallbacks {
  loadCurrentAddonDetail: () => Promise<void>;
  openAddonsRoute: () => void;
  refreshAfterMovieWrite: (movieid: number) => Promise<void>;
  refreshAfterEpisodeWrite: (episodeid: number) => Promise<void>;
  refreshAfterSeasonWrite: () => Promise<void>;
}

export interface AppDefaultDispatches {
  musicBrowseDispatch: MusicBrowsePanelDispatch;
  musicActionDispatch: MusicBrowseActionDispatch;
  mediaSearchDispatch: MediaSearchPanelDispatch;
  mediaSearchActionDispatch: ReturnType<typeof createMediaSearchActionDispatch>;
  mediaFilesDispatch: MediaFilesPanelDispatch;
  videoMediaFilesDispatch: MediaFilesPanelDispatch;
  mediaFilesActionDispatch: MediaFilesActionDispatch;
  videoMediaFilesActionDispatch: MediaFilesActionDispatch;
  mediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
  mediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
  pvrDispatch: PvrPageDispatch;
  videoMediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
  videoMediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
  videoMovieActionDispatch: VideoMovieActionDispatch;
  videoMovieStreamActionDispatch: VideoMovieStreamDispatch;
  localBrowserPlayerActionDispatch: LocalBrowserPlayerDispatch;
  videoEpisodeActionDispatch: VideoEpisodeActionDispatch;
  videoSeasonArtworkDispatch: VideoSeasonArtworkDispatch;
  videoSeasonWriteDispatch: VideoSeasonWriteDispatch;
  localeDispatch: LocaleToggleDispatch;
  settingsDispatch: SettingsPanelDispatch;
  addonsDispatch: AddonsPanelDispatch;
  addonDetailDispatch: AddonDetailDispatch;
}

export function createAppDefaultDispatches(
  callbacks: AppDefaultDispatchCallbacks
): AppDefaultDispatches {
  const mediaFilesActionDispatch: MediaFilesActionDispatch = {
    playFileItem: (item) => defaultPlayerDispatch.playFileItem(toFilePlaybackItem(item)),
    queueFileItem: (item) => defaultQueueDispatch.queueFileItem(toFileQueueItem(item)),
    queueFileItems: (items) => defaultQueueDispatch.queueFileItems(items.map(toFileQueueItem)),
    downloadFileItem: (item) => downloadMediaFileItem(toFileDownloadItem(item))
  };

  return {
    musicBrowseDispatch: {
      browseArtist: (artist) => musicBrowseStore.browseArtist(artist),
      browseAlbum: (album) => musicBrowseStore.browseAlbum(album),
      browseGenre: (genre) => musicBrowseStore.browseGenre(genre),
      clearSelection: () => musicBrowseStore.clearSelection()
    },
    musicActionDispatch: {
      playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(item),
      queueMusicItem: (item) => defaultQueueDispatch.queueMusicItem(item)
    },
    mediaSearchDispatch: {
      search: ({ query, scope }) => mediaSearchStore.search({ text: query, scope }),
      clear: () => mediaSearchStore.clear(),
      searchAddon: async ({ row, query, pluginUrl }) => searchAddonInline(row, query, pluginUrl)
    },
    mediaSearchActionDispatch: createMediaSearchActionDispatch({
      playerDispatch: defaultPlayerDispatch,
      queueDispatch: defaultQueueDispatch
    }),
    mediaFilesDispatch: {
      refresh: () => mediaFilesStore.refreshSources(),
      openSource: (id) => mediaFilesStore.openSource(id),
      openEntry: (id) => mediaFilesStore.openDirectory(id),
      openPath: (path) => mediaFilesStore.openPath(path),
      openBreadcrumb: (id) => openMediaFilesBreadcrumb(id)
    },
    videoMediaFilesDispatch: {
      refresh: () => videoMediaFilesStore.refreshSources(),
      openSource: (id) => videoMediaFilesStore.openSource(id),
      openEntry: (id) => videoMediaFilesStore.openDirectory(id),
      openPath: (path) => videoMediaFilesStore.openPath(path),
      openBreadcrumb: (id) => openVideoMediaFilesBreadcrumb(id)
    },
    mediaFilesActionDispatch,
    videoMediaFilesActionDispatch: mediaFilesActionDispatch,
    mediaPlaylistsDispatch: {
      refresh: () => mediaPlaylistsStore.refreshPlaylists(),
      openPlaylist: (id) => mediaPlaylistsStore.openPlaylist(id),
      openBreadcrumb: (id) => mediaPlaylistsStore.openPlaylist(id)
    },
    mediaPlaylistsActionDispatch: createMediaPlaylistActionDispatch({
      expectedPlaylistMediaKind: 'music',
      store: mediaPlaylistsStore,
      playerDispatch: defaultPlayerDispatch,
      queueDispatch: defaultQueueDispatch
    }),
    pvrDispatch: {
      refreshChannels: (group) => pvrStore.refreshChannels(group),
      refreshRecordings: () => pvrStore.refreshRecordings(),
      refreshBroadcasts: (channelid) => pvrStore.refreshBroadcasts(channelid),
      loadChannelDetail: (channelid) => pvrStore.loadChannelDetail(channelid),
      toggleChannelRecording: (channelid) => pvrStore.toggleChannelRecording(channelid),
      toggleBroadcastTimer: (broadcastid, timerrule) =>
        pvrStore.toggleBroadcastTimer(broadcastid, timerrule),
      addBroadcastTimer: (broadcastid, timerrule) =>
        pvrStore.addBroadcastTimer(broadcastid, timerrule),
      deleteTimer: (timerid) => pvrStore.deleteTimer(timerid)
    },
    videoMediaPlaylistsDispatch: {
      refresh: () => videoMediaPlaylistsStore.refreshPlaylists(),
      openPlaylist: (id) => videoMediaPlaylistsStore.openPlaylist(id),
      openBreadcrumb: (id) => videoMediaPlaylistsStore.openPlaylist(id)
    },
    videoMediaPlaylistsActionDispatch: createMediaPlaylistActionDispatch({
      expectedPlaylistMediaKind: 'video',
      store: videoMediaPlaylistsStore,
      playerDispatch: defaultPlayerDispatch,
      queueDispatch: defaultQueueDispatch
    }),
    videoMovieActionDispatch: {
      playMovieItem: ({ movieid }) => defaultPlayerDispatch.playMovieItem({ movieid }),
      resumeMovieItem: ({ movieid }) =>
        defaultPlayerDispatch.playMovieItem({ movieid, resume: true }),
      queueMovieItem: ({ movieid }) => defaultQueueDispatch.queueMovieItem({ movieid }),
      markMovieWatched: async ({ movieid, watched, label }) => {
        await videoWriteStore.markMovieWatched({ movieid, label }, watched);
        assertVideoWriteSucceeded(videoWriteStore.snapshot);
        await callbacks.refreshAfterMovieWrite(movieid);
      }
    },
    videoMovieStreamActionDispatch: {
      streamMovieItem: (item) => defaultPlayerDispatch.streamMovieItem(item),
      resumeOnKodi: () => defaultPlayerDispatch.resumeOnKodi()
    },
    localBrowserPlayerActionDispatch: {
      setMode: (mode) => defaultPlayerDispatch.setMode(mode),
      playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(item),
      streamMovieItem: (item) => defaultPlayerDispatch.streamMovieItem(item),
      streamEpisodeItem: (item) => defaultPlayerDispatch.streamEpisodeItem(item),
      streamMusicVideoItem: (item) => defaultPlayerDispatch.streamMusicVideoItem(item)
    },
    videoEpisodeActionDispatch: {
      playEpisodeItem: ({ episodeid }) => defaultPlayerDispatch.playEpisodeItem({ episodeid }),
      resumeEpisodeItem: ({ episodeid }) =>
        defaultPlayerDispatch.playEpisodeItem({ episodeid, resume: true }),
      queueEpisodeItem: ({ episodeid }) => defaultQueueDispatch.queueEpisodeItem({ episodeid }),
      streamEpisodeItem: ({ episodeid }) => defaultPlayerDispatch.streamEpisodeItem({ episodeid }),
      markEpisodeWatched: async ({ episodeid, watched, label }) => {
        await videoWriteStore.markEpisodeWatched({ episodeid, label }, watched);
        assertVideoWriteSucceeded(videoWriteStore.snapshot);
        await callbacks.refreshAfterEpisodeWrite(episodeid);
      }
    },
    videoSeasonArtworkDispatch: {
      refreshSeasonArtwork: ({ tvshowid, season }) =>
        videoTvStore.refreshSeasonArtwork(tvshowid, season, 'command:refreshSeasonArtwork')
    },
    videoSeasonWriteDispatch: {
      markEpisodesWatched: async (items, watched) => {
        await videoWriteStore.markEpisodesWatched(toVideoWriteEpisodeItems(items), watched);
        const snapshot = videoWriteStore.snapshot;
        await callbacks.refreshAfterSeasonWrite();
        return toSeasonWriteSummary(snapshot);
      },
      retryFailedVideoWrites: async (items) => {
        await videoWriteStore.retryFailed();
        const snapshot = videoWriteStore.snapshot;
        await callbacks.refreshAfterSeasonWrite();
        return toSeasonWriteSummary(snapshot, items.length);
      }
    },
    localeDispatch: {
      setLocale: (locale) => localeStore.setLocale(locale)
    },
    settingsDispatch: {
      load: () => settingsStore.load(),
      retry: () => settingsStore.retry(),
      selectSection: (sectionId) => settingsStore.selectSection(sectionId),
      selectCategory: (categoryId) => settingsStore.selectCategory(categoryId),
      setValue: (settingId, value) => settingsStore.writeSettingValue(settingId, value)
    },
    addonsDispatch: {
      load: () => addonsStore.loadAddons(),
      retry: () => addonsStore.loadAddons(),
      setSearchQuery: (query) => addonsStore.setSearchQuery(query),
      setGroupBy: (groupBy) => addonsStore.setGroupBy(groupBy),
      setAddonEnabled: (addonid, enabled) => addonsStore.setAddonEnabled(addonid, enabled),
      executeAddon: (addonid) => addonsStore.executeAddon(addonid)
    },
    addonDetailDispatch: {
      load: () => callbacks.loadCurrentAddonDetail(),
      retry: () => callbacks.loadCurrentAddonDetail(),
      setAddonEnabled: (addonid, enabled) => addonsStore.setAddonEnabled(addonid, enabled),
      back: () => callbacks.openAddonsRoute()
    }
  };
}

async function searchAddonInline(
  row: SearchAddonSetting,
  query: string,
  pluginUrl: string
): Promise<MediaSearchAddonResultGroup> {
  const client = createActiveKodiJsonRpcHttpClient();
  if (!client) {
    throw new Error('Choose an active Kodi host before searching add-ons.');
  }

  const result = await getFileDirectory(client, {
    directory: pluginUrl,
    media: row.media === 'video' ? 'video' : 'music',
    properties: ['title', 'thumbnail']
  });
  const files = Array.isArray(result.files) ? result.files : [];

  return {
    row,
    query,
    items: files.flatMap((item) => {
      if (!item || typeof item !== 'object' || !('file' in item) || typeof item.file !== 'string') {
        return [];
      }

      const record = item as Record<string, unknown>;
      return [
        {
          file: item.file,
          filetype: typeof record.filetype === 'string' ? record.filetype : undefined,
          label: typeof record.label === 'string' ? record.label : undefined,
          title: typeof record.title === 'string' ? record.title : undefined,
          thumbnail: typeof record.thumbnail === 'string' ? record.thumbnail : undefined
        }
      ];
    })
  };
}

function openMediaFilesBreadcrumb(id: string): Promise<void> {
  return id.startsWith('source:')
    ? mediaFilesStore.openSource(id)
    : mediaFilesStore.openDirectory(id);
}

function openVideoMediaFilesBreadcrumb(id: string): Promise<void> {
  return id.startsWith('source:')
    ? videoMediaFilesStore.openSource(id)
    : videoMediaFilesStore.openDirectory(id);
}

function toFilePlaybackItem(item: MediaFilesActionItem): {
  file: string;
  mediaKind: 'audio' | 'video';
  itemType?: 'file' | 'directory';
} {
  const resolved = mediaFilesStoreForMedia(item.media).getPlayableEntry(item.id);

  if (!resolved.ok) {
    throw new Error(resolved.error.message);
  }

  return {
    file: resolved.entry.file,
    mediaKind: resolved.entry.mediaKind,
    itemType: resolved.entry.itemType
  };
}

function toFileQueueItem(item: MediaFilesActionItem): {
  file: string;
  mediaKind: 'audio' | 'video';
  itemType?: 'file' | 'directory';
} {
  return toFilePlaybackItem(item);
}

function toFileDownloadItem(item: MediaFilesActionItem): { file: string; label: string } {
  const resolved = mediaFilesStoreForMedia(item.media).getDownloadableEntry(item.id);

  if (!resolved.ok) {
    throw new Error(resolved.error.message);
  }

  return { file: resolved.entry.file, label: resolved.entry.label };
}

async function downloadMediaFileItem(item: { file: string; label: string }): Promise<void> {
  const client = createActiveKodiJsonRpcHttpClient();
  if (!client) {
    throw new Error('Choose an active Kodi host before downloading media.');
  }

  const url = await prepareLocalStreamUrl({
    client,
    file: item.file,
    activeHost: configStore.activeHost
  });

  startBrowserDownload(document, url, safePlaylistExportName(item.label));
}

function mediaFilesStoreForMedia(media: string) {
  return media === 'video' ? videoMediaFilesStore : mediaFilesStore;
}
