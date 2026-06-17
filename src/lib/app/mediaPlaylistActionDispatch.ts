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
  store: MediaPlaylistStoreLike | (() => Promise<MediaPlaylistStoreLike>);
  playerDispatch: PlayerPlaylistDispatchLike;
  queueDispatch: QueuePlaylistDispatchLike;
};

export function createMediaPlaylistActionDispatch({
  expectedPlaylistMediaKind,
  store,
  playerDispatch,
  queueDispatch
}: MediaPlaylistActionDispatchOptions): MediaPlaylistsActionDispatch {
  return {
    playPlaylistItem: (item) =>
      withStore(store, (resolvedStore) =>
        playerDispatch.playPlaylistItem(
          toPlaylistItem(resolvedStore, expectedPlaylistMediaKind, item)
        )
      ),
    queuePlaylistItem: (item) =>
      withStore(store, (resolvedStore) =>
        queueDispatch.queuePlaylistItem(
          toPlaylistItem(resolvedStore, expectedPlaylistMediaKind, item)
        )
      ),
    playEntryItem: (item) =>
      withStore(store, (resolvedStore) =>
        playerDispatch.playFileItem(toEntryItem(resolvedStore, item))
      ),
    queueEntryItem: (item) =>
      withStore(store, (resolvedStore) =>
        queueDispatch.queueFileItem(toEntryItem(resolvedStore, item))
      )
  };
}

function withStore(
  store: MediaPlaylistActionDispatchOptions['store'],
  run: (store: MediaPlaylistStoreLike) => Promise<void> | void
): Promise<void> | void {
  return typeof store === 'function' ? store().then(run) : run(store);
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
