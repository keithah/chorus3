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
import { appRouteStores } from '$lib/app/appRouteStores';
import { getFileDirectory } from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from '$lib/stores/kodiClient';
import { localeStore } from '$lib/stores/locale.svelte';
import { playerDispatch as defaultPlayerDispatch } from '$lib/stores/defaultPlayerDispatch';
import { prepareLocalStreamUrl } from '$lib/stores/localPlayer.svelte';
import { queueDispatch as defaultQueueDispatch } from '$lib/stores/queue.svelte';
import { configStore } from '$lib/stores/config.svelte';
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
    playFileItem: async (item) =>
      defaultPlayerDispatch.playFileItem(await toFilePlaybackItem(item)),
    queueFileItem: async (item) => defaultQueueDispatch.queueFileItem(await toFileQueueItem(item)),
    queueFileItems: async (items) =>
      defaultQueueDispatch.queueFileItems(await Promise.all(items.map(toFileQueueItem))),
    downloadFileItem: async (item) => downloadMediaFileItem(await toFileDownloadItem(item))
  };

  return {
    musicBrowseDispatch: {
      browseArtist: async (artist) => (await musicBrowse()).browseArtist(artist),
      browseAlbum: async (album) => (await musicBrowse()).browseAlbum(album),
      browseGenre: async (genre) => (await musicBrowse()).browseGenre(genre),
      clearSelection: async () => (await musicBrowse()).clearSelection()
    },
    musicActionDispatch: {
      playMusicItem: (item) => defaultPlayerDispatch.playMusicItem(item),
      queueMusicItem: (item) => defaultQueueDispatch.queueMusicItem(item)
    },
    mediaSearchDispatch: {
      search: async ({ query, scope }) => (await mediaSearch()).search({ text: query, scope }),
      clear: async () => (await mediaSearch()).clear(),
      searchAddon: async ({ row, query, pluginUrl }) => searchAddonInline(row, query, pluginUrl)
    },
    mediaSearchActionDispatch: createMediaSearchActionDispatch({
      playerDispatch: defaultPlayerDispatch,
      queueDispatch: defaultQueueDispatch
    }),
    mediaFilesDispatch: {
      refresh: async () => (await mediaFiles()).refreshSources(),
      openSource: async (id) => (await mediaFiles()).openSource(id),
      openEntry: async (id) => (await mediaFiles()).openDirectory(id),
      openPath: async (path) => (await mediaFiles()).openPath(path),
      openBreadcrumb: (id) => openMediaFilesBreadcrumb(id)
    },
    videoMediaFilesDispatch: {
      refresh: async () => (await videoMediaFiles()).refreshSources(),
      openSource: async (id) => (await videoMediaFiles()).openSource(id),
      openEntry: async (id) => (await videoMediaFiles()).openDirectory(id),
      openPath: async (path) => (await videoMediaFiles()).openPath(path),
      openBreadcrumb: (id) => openVideoMediaFilesBreadcrumb(id)
    },
    mediaFilesActionDispatch,
    videoMediaFilesActionDispatch: mediaFilesActionDispatch,
    mediaPlaylistsDispatch: {
      refresh: async () => (await mediaPlaylists()).refreshPlaylists(),
      openPlaylist: async (id) => (await mediaPlaylists()).openPlaylist(id),
      openBreadcrumb: async (id) => (await mediaPlaylists()).openPlaylist(id)
    },
    mediaPlaylistsActionDispatch: createMediaPlaylistActionDispatch({
      expectedPlaylistMediaKind: 'music',
      store: appRouteStores.mediaPlaylists,
      playerDispatch: defaultPlayerDispatch,
      queueDispatch: defaultQueueDispatch
    }),
    pvrDispatch: {
      refreshChannels: async (group) => (await pvr()).refreshChannels(group),
      refreshRecordings: async () => (await pvr()).refreshRecordings(),
      refreshBroadcasts: async (channelid) => (await pvr()).refreshBroadcasts(channelid),
      loadChannelDetail: async (channelid) => (await pvr()).loadChannelDetail(channelid),
      toggleChannelRecording: async (channelid) => (await pvr()).toggleChannelRecording(channelid),
      toggleBroadcastTimer: (broadcastid, timerrule) =>
        pvr().then((store) => store.toggleBroadcastTimer(broadcastid, timerrule)),
      addBroadcastTimer: (broadcastid, timerrule) =>
        pvr().then((store) => store.addBroadcastTimer(broadcastid, timerrule)),
      deleteTimer: async (timerid) => (await pvr()).deleteTimer(timerid)
    },
    videoMediaPlaylistsDispatch: {
      refresh: async () => (await videoMediaPlaylists()).refreshPlaylists(),
      openPlaylist: async (id) => (await videoMediaPlaylists()).openPlaylist(id),
      openBreadcrumb: async (id) => (await videoMediaPlaylists()).openPlaylist(id)
    },
    videoMediaPlaylistsActionDispatch: createMediaPlaylistActionDispatch({
      expectedPlaylistMediaKind: 'video',
      store: appRouteStores.videoMediaPlaylists,
      playerDispatch: defaultPlayerDispatch,
      queueDispatch: defaultQueueDispatch
    }),
    videoMovieActionDispatch: {
      playMovieItem: ({ movieid }) => defaultPlayerDispatch.playMovieItem({ movieid }),
      resumeMovieItem: ({ movieid }) =>
        defaultPlayerDispatch.playMovieItem({ movieid, resume: true }),
      queueMovieItem: ({ movieid }) => defaultQueueDispatch.queueMovieItem({ movieid }),
      markMovieWatched: async ({ movieid, watched, label }) => {
        const store = await videoWrite();
        await store.markMovieWatched({ movieid, label }, watched);
        assertVideoWriteSucceeded(store.snapshot);
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
        const store = await videoWrite();
        await store.markEpisodeWatched({ episodeid, label }, watched);
        assertVideoWriteSucceeded(store.snapshot);
        await callbacks.refreshAfterEpisodeWrite(episodeid);
      }
    },
    videoSeasonArtworkDispatch: {
      refreshSeasonArtwork: ({ tvshowid, season }) =>
        videoTv().then((store) =>
          store.refreshSeasonArtwork(tvshowid, season, 'command:refreshSeasonArtwork')
        )
    },
    videoSeasonWriteDispatch: {
      markEpisodesWatched: async (items, watched) => {
        const store = await videoWrite();
        await store.markEpisodesWatched(toVideoWriteEpisodeItems(items), watched);
        const snapshot = store.snapshot;
        await callbacks.refreshAfterSeasonWrite();
        return toSeasonWriteSummary(snapshot);
      },
      retryFailedVideoWrites: async (items) => {
        const store = await videoWrite();
        await store.retryFailed();
        const snapshot = store.snapshot;
        await callbacks.refreshAfterSeasonWrite();
        return toSeasonWriteSummary(snapshot, items.length);
      }
    },
    localeDispatch: {
      setLocale: (locale) => localeStore.setLocale(locale)
    },
    settingsDispatch: {
      load: async () => (await settings()).load(),
      retry: async () => (await settings()).retry(),
      selectSection: async (sectionId) => (await settings()).selectSection(sectionId),
      selectCategory: async (categoryId) => (await settings()).selectCategory(categoryId),
      setValue: async (settingId, value) => (await settings()).writeSettingValue(settingId, value)
    },
    addonsDispatch: {
      load: async () => (await addons()).loadAddons(),
      retry: async () => (await addons()).loadAddons(),
      setSearchQuery: async (query) => (await addons()).setSearchQuery(query),
      setGroupBy: async (groupBy) => (await addons()).setGroupBy(groupBy),
      setAddonEnabled: async (addonid, enabled) =>
        (await addons()).setAddonEnabled(addonid, enabled),
      executeAddon: async (addonid) => (await addons()).executeAddon(addonid)
    },
    addonDetailDispatch: {
      load: () => callbacks.loadCurrentAddonDetail(),
      retry: () => callbacks.loadCurrentAddonDetail(),
      setAddonEnabled: async (addonid, enabled) =>
        (await addons()).setAddonEnabled(addonid, enabled),
      back: () => callbacks.openAddonsRoute()
    }
  };
}

const {
  addons,
  mediaFiles,
  videoMediaFiles,
  mediaPlaylists,
  videoMediaPlaylists,
  mediaSearch,
  musicBrowse,
  pvr,
  settings,
  videoTv,
  videoWrite
} = appRouteStores;

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
    properties: ['title', 'thumbnail'],
    limits: { start: 0, end: 50 }
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
    ? mediaFiles().then((store) => store.openSource(id))
    : mediaFiles().then((store) => store.openDirectory(id));
}

function openVideoMediaFilesBreadcrumb(id: string): Promise<void> {
  return id.startsWith('source:')
    ? videoMediaFiles().then((store) => store.openSource(id))
    : videoMediaFiles().then((store) => store.openDirectory(id));
}

async function toFilePlaybackItem(item: MediaFilesActionItem): Promise<{
  file: string;
  mediaKind: 'audio' | 'video';
  itemType?: 'file' | 'directory';
}> {
  const resolved = (await mediaFilesStoreForMedia(item.media)).getPlayableEntry(item.id);

  if (!resolved.ok) {
    throw new Error(resolved.error.message);
  }

  return {
    file: resolved.entry.file,
    mediaKind: resolved.entry.mediaKind,
    itemType: resolved.entry.itemType
  };
}

async function toFileQueueItem(item: MediaFilesActionItem): Promise<{
  file: string;
  mediaKind: 'audio' | 'video';
  itemType?: 'file' | 'directory';
}> {
  return toFilePlaybackItem(item);
}

async function toFileDownloadItem(
  item: MediaFilesActionItem
): Promise<{ file: string; label: string }> {
  const resolved = (await mediaFilesStoreForMedia(item.media)).getDownloadableEntry(item.id);

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
  return media === 'video' ? videoMediaFiles() : mediaFiles();
}
