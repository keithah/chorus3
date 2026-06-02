import type {
  MediaSearchActionDispatch,
  MediaSearchActionItem
} from '$components/MediaSearchPanel.svelte';
import type { MusicPlaybackItem } from '$lib/stores/playerDispatchTypes';
import type { MusicQueueItem } from '$lib/stores/queue.svelte';

type MediaSearchPlayerDispatch = {
  playMusicItem(item: MusicPlaybackItem): Promise<void> | void;
};

type MediaSearchQueueDispatch = {
  queueMusicItem(item: MusicQueueItem): Promise<void> | void;
};

export function createMediaSearchActionDispatch({
  playerDispatch,
  queueDispatch
}: {
  playerDispatch: MediaSearchPlayerDispatch;
  queueDispatch: MediaSearchQueueDispatch;
}): MediaSearchActionDispatch {
  return {
    playMusicItem: (item) => playerDispatch.playMusicItem(toMusicActionItem(item)),
    queueMusicItem: (item) => queueDispatch.queueMusicItem(toMusicActionItem(item))
  };
}

function toMusicActionItem(item: MediaSearchActionItem): MusicPlaybackItem & MusicQueueItem {
  if (item.kind === 'artist') {
    return { kind: 'artist', artistid: item.id };
  }

  if (item.kind === 'album') {
    return { kind: 'album', albumid: item.id };
  }

  return { kind: 'song', songid: item.id };
}
