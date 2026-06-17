import type {
  LocalPlaylistItemInput,
  LocalPlaylistPlayableItem,
  LocalPlaylistStoreSnapshot
} from '$lib/stores';
import type {
  PlayerStoreSnapshot,
  QueueItemSnapshot,
  QueuePlayableItemSnapshot,
  QueueStoreSnapshot
} from '$lib/stores';
import { isTextSecretSafe } from '$lib/safety/redaction';
import type { AppShellPlaylistDestinationMode } from '$lib/app-shell/appShellTypes';
import { safeBrowserFilename } from '$lib/app/browserFilename';

export type PlaylistDisabledReasonContext = {
  destinationMode: AppShellPlaylistDestinationMode;
  localPlaylistSnapshot: LocalPlaylistStoreSnapshot;
  queueSnapshot: QueueStoreSnapshot;
  playerSnapshot: PlayerStoreSnapshot;
  safeQueueItemCount: number;
  isLocalPlaylistMutationRunning: boolean;
  isQueueCommandRunning: boolean;
  isPlayerDestinationCommandRunning: boolean;
};

export function playableAudioItems(
  items: readonly LocalPlaylistPlayableItem[]
): LocalPlaylistPlayableItem[] {
  return items
    .filter((item) => item.kind === 'audio' && item.file.trim().length > 0)
    .sort((a, b) => a.position - b.position);
}

export function exportableLocalPlaylistItems(
  items: readonly LocalPlaylistPlayableItem[]
): LocalPlaylistPlayableItem[] {
  return items
    .filter((item) => item.kind !== 'playlist' && item.file.trim().length > 0)
    .sort((a, b) => a.position - b.position);
}

export function safePlaylistExportName(label: string): string {
  return safeBrowserFilename(label, 'playlist');
}

export function playlistClearDisabledReason(
  context: PlaylistDisabledReasonContext
): string | undefined {
  if (context.destinationMode === 'local') {
    if (context.isLocalPlaylistMutationRunning) {
      return 'A local playlist change is running. Clear playlist is temporarily disabled.';
    }

    if (!context.localPlaylistSnapshot.selectedPlaylistId) {
      return 'Select a local playlist before clearing it.';
    }

    return undefined;
  }

  return context.isQueueCommandRunning
    ? 'Queue command is running. Clear playlist is temporarily disabled.'
    : undefined;
}

export function playlistRefreshDisabledReason(
  context: PlaylistDisabledReasonContext
): string | undefined {
  if (context.destinationMode === 'local') {
    return context.isLocalPlaylistMutationRunning
      ? 'A local playlist change is running. Refresh playlist is temporarily disabled.'
      : undefined;
  }

  return context.isQueueCommandRunning || context.queueSnapshot.refreshStatus === 'loading'
    ? 'Queue refresh is already running.'
    : undefined;
}

export function playlistPartyModeDisabledReason(
  context: PlaylistDisabledReasonContext
): string | undefined {
  if (context.destinationMode === 'local') {
    return 'Party mode is only available when controlling Kodi playback.';
  }

  if (context.isPlayerDestinationCommandRunning) {
    return 'A player command is running. Party mode is temporarily disabled.';
  }

  if (!context.playerSnapshot.primaryPlayer) {
    return 'Start Kodi playback before toggling party mode.';
  }

  return undefined;
}

export function saveKodiPlaylistDisabledReason(
  context: PlaylistDisabledReasonContext
): string | undefined {
  if (context.destinationMode !== 'local') {
    return 'Switch to Local destination before saving the current Kodi queue locally.';
  }

  if (context.isLocalPlaylistMutationRunning) {
    return 'A local playlist change is running. Save Kodi playlist is temporarily disabled.';
  }

  if (context.isQueueCommandRunning) {
    return 'Queue command is running. Save Kodi playlist is temporarily disabled.';
  }

  if (!context.localPlaylistSnapshot.selectedPlaylistId) {
    return 'Select a local playlist before saving the current Kodi queue.';
  }

  if (context.safeQueueItemCount === 0) {
    return 'Current Kodi queue has no supported items to save.';
  }

  return undefined;
}

export function toLocalPlaylistItemInput(
  item: QueuePlayableItemSnapshot
): LocalPlaylistItemInput[] {
  const label = firstSafeQueueText(item.label);

  if (!label) {
    return [];
  }

  const kind = queueItemTypeToLocalPlaylistKind(item.type);
  if (!kind) {
    return [];
  }

  return [
    {
      kind,
      label,
      file: item.file.trim(),
      sourceId: `queue:${item.position}`,
      ...(typeof item.duration === 'number' && Number.isFinite(item.duration) && item.duration >= 0
        ? { durationSeconds: item.duration }
        : {}),
      ...(typeof item.thumbnail === 'string' && item.thumbnail.trim()
        ? { thumbnail: item.thumbnail.trim() }
        : {})
    }
  ];
}

export function queueSnapshotToPlayableItems(
  snapshot: QueueStoreSnapshot
): QueuePlayableItemSnapshot[] {
  return snapshot.items.flatMap((item) => {
    const label = firstSafeQueueText(item.label, item.title);
    if (!label) {
      return [];
    }

    return [
      {
        position: item.position,
        label,
        file: `queue-item:${item.position}`,
        ...(item.type ? { type: item.type } : {}),
        ...(typeof item.duration === 'number' &&
        Number.isFinite(item.duration) &&
        item.duration >= 0
          ? { duration: item.duration }
          : {}),
        ...(typeof item.thumbnail === 'string' && item.thumbnail.trim()
          ? { thumbnail: item.thumbnail.trim() }
          : {})
      }
    ];
  });
}

function firstSafeQueueText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const text = value.trim().replace(/\s+/g, ' ');
    if (text && isTextSecretSafe(text)) {
      return text;
    }
  }

  return null;
}

function queueItemTypeToLocalPlaylistKind(
  type: QueueItemSnapshot['type']
): LocalPlaylistItemInput['kind'] | null {
  if (type === 'movie' || type === 'episode' || type === 'video') {
    return 'video';
  }

  if (type === 'playlist') {
    return 'playlist';
  }

  if (type === undefined || type === 'song' || type === 'audio' || type === 'music') {
    return 'audio';
  }

  return null;
}
