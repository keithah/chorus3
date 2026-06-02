import type {
  MediaPlaylistsActionDispatch,
  MediaPlaylistsActionItem,
  MediaPlaylistsEntryActionItem
} from '$components/mediaPlaylistsActionModel';
import type {
  MediaPlaylistsPlayableEntryResult,
  MediaPlaylistsPlayablePlaylistResult
} from '$lib/stores/mediaPlaylists.svelte';
import type { FilePlaybackItem, PlaylistPlaybackItem } from '$lib/stores/playerDispatch.svelte';
import type { FileQueueItem, PlaylistQueueItem } from '$lib/stores/queue.svelte';

type MediaPlaylistStoreLike = {
  getPlayablePlaylist(id: string): MediaPlaylistsPlayablePlaylistResult;
  getPlayableEntry(id: string): MediaPlaylistsPlayableEntryResult;
};

type PlayerPlaylistDispatchLike = {
  playPlaylistItem(item: PlaylistPlaybackItem): Promise<void> | void;
  playFileItem(item: FilePlaybackItem): Promise<void> | void;
};

type QueuePlaylistDispatchLike = {
  queuePlaylistItem(item: PlaylistQueueItem): Promise<void> | void;
  queueFileItem(item: FileQueueItem): Promise<void> | void;
};

export type MediaPlaylistActionDispatchOptions = {
  expectedPlaylistMediaKind: 'music' | 'video';
  store: MediaPlaylistStoreLike;
  playerDispatch: PlayerPlaylistDispatchLike;
  queueDispatch: QueuePlaylistDispatchLike;
};

export function createMediaPlaylistActionDispatch({
  expectedPlaylistMediaKind,
  store,
  playerDispatch,
  queueDispatch
}: MediaPlaylistActionDispatchOptions): MediaPlaylistsActionDispatch {
  const playlistItem = (item: MediaPlaylistsActionItem): PlaylistPlaybackItem & PlaylistQueueItem =>
    toPlaylistItem(store, expectedPlaylistMediaKind, item);
  const entryItem = (item: MediaPlaylistsEntryActionItem): FilePlaybackItem & FileQueueItem =>
    toEntryItem(store, item);

  return {
    playPlaylistItem: (item) => playerDispatch.playPlaylistItem(playlistItem(item)),
    queuePlaylistItem: (item) => queueDispatch.queuePlaylistItem(playlistItem(item)),
    playEntryItem: (item) => playerDispatch.playFileItem(entryItem(item)),
    queueEntryItem: (item) => queueDispatch.queueFileItem(entryItem(item))
  };
}

function toPlaylistItem(
  store: MediaPlaylistStoreLike,
  expectedPlaylistMediaKind: 'music' | 'video',
  item: MediaPlaylistsActionItem
): PlaylistPlaybackItem & PlaylistQueueItem {
  const resolved = store.getPlayablePlaylist(item.id);

  if (!resolved.ok) {
    throw new Error(resolved.error.message);
  }

  if (resolved.playlist.mediaKind !== expectedPlaylistMediaKind) {
    throw new Error(`Choose a supported ${expectedPlaylistMediaKind} playlist.`);
  }

  return {
    file: resolved.playlist.file,
    mediaKind: expectedPlaylistMediaKind,
    playlistKind: resolved.playlist.playlistKind
  };
}

function toEntryItem(
  store: MediaPlaylistStoreLike,
  item: MediaPlaylistsEntryActionItem
): FilePlaybackItem & FileQueueItem {
  const resolved = store.getPlayableEntry(item.id);

  if (!resolved.ok) {
    throw new Error(resolved.error.message);
  }

  return { file: resolved.entry.file, mediaKind: resolved.entry.mediaKind };
}
