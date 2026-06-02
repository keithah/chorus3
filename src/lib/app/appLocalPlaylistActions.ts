import { exportLocalPlaylistM3u } from '$lib/app/appDownloads';
import { playableAudioItems } from '$lib/app/appPlaylistAdapters';
import type {
  LocalPlaylistPlayableItem,
  PlaylistPlaybackDispatch,
  PlaylistQueueDispatch
} from '$lib/app/appComponentTypes';

export async function playLocalPlaylistInKodi(
  playerDispatch: PlaylistPlaybackDispatch,
  queueDispatch: PlaylistQueueDispatch,
  items: readonly LocalPlaylistPlayableItem[]
): Promise<void> {
  const playable = playableAudioItems(items);
  const first = playable[0];
  if (!first) {
    return;
  }

  playerDispatch.setMode?.('kodi');
  await playerDispatch.playFileItem?.({ file: first.file, mediaKind: 'audio' });

  const rest = playable.slice(1).map((item) => ({ file: item.file, mediaKind: 'audio' }) as const);
  if (queueDispatch.queueFileItems) {
    await queueDispatch.queueFileItems(rest);
    return;
  }

  for (const item of rest) {
    await queueDispatch.queueFileItem?.(item);
  }
}

export async function playLocalPlaylistInBrowser(
  playerDispatch: PlaylistPlaybackDispatch,
  items: readonly LocalPlaylistPlayableItem[]
): Promise<void> {
  const playable = playableAudioItems(items);
  const first = playable[0];
  if (!first) {
    return;
  }

  playerDispatch.setMode?.('local');
  playerDispatch.setLocalFilePlaylist?.(
    playable.map((item) => ({
      file: item.file,
      mediaKind: 'audio',
      label: item.label,
      title: item.label,
      type: 'song',
      ...(item.thumbnail ? { thumbnail: item.thumbnail } : {})
    })),
    first.file
  );
  await playerDispatch.playFileItem?.({ file: first.file, mediaKind: 'audio' });
}

export function exportLocalPlaylist(
  playlistLabel: string,
  items: readonly LocalPlaylistPlayableItem[]
): void {
  exportLocalPlaylistM3u(document, URL, playlistLabel, items);
}
