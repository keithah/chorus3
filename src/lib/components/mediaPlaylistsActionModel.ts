import type {
  MediaPlaylistCapabilitiesSnapshot,
  MediaPlaylistEntrySnapshot,
  MediaPlaylistKind,
  MediaPlaylistSnapshot,
  MediaPlaylistsMedia
} from '$lib/stores/mediaPlaylists.svelte';

export type PlaylistActionVerb = 'play' | 'queue';

export interface MediaPlaylistsActionItem {
  id: string;
  label: string;
  media: MediaPlaylistsMedia;
  kind: MediaPlaylistKind;
  capabilities: MediaPlaylistCapabilitiesSnapshot;
}

export interface MediaPlaylistsEntryActionItem {
  id: string;
  label: string;
  media: MediaPlaylistsMedia;
  mediaKind: 'audio' | 'video';
}

export interface MediaPlaylistsActionDispatch {
  playPlaylistItem: (item: MediaPlaylistsActionItem) => Promise<void> | void;
  queuePlaylistItem: (item: MediaPlaylistsActionItem) => Promise<void> | void;
  playEntryItem?: (item: MediaPlaylistsEntryActionItem) => Promise<void> | void;
  queueEntryItem?: (item: MediaPlaylistsEntryActionItem) => Promise<void> | void;
}

export type PendingPlaylistAction = {
  id: string;
  verb: PlaylistActionVerb;
  label: string;
  item: MediaPlaylistsActionItem | MediaPlaylistsEntryActionItem;
};

export type PlaylistActionRun = {
  verb: PlaylistActionVerb;
  item: MediaPlaylistsActionItem | MediaPlaylistsEntryActionItem;
  label: string;
  pendingCopy: string;
  successCopy: string;
  errorCopy: string;
  fallbackError: string;
  run: () => Promise<void> | void;
};

export function playlistActionFor(
  playlist: MediaPlaylistSnapshot,
  id: string,
  label: string
): MediaPlaylistsActionItem {
  return {
    id,
    label,
    media: playlist.media,
    kind: playlist.kind,
    capabilities: { ...playlist.capabilities }
  };
}

export function entryActionFor(
  entry: MediaPlaylistEntrySnapshot,
  id: string,
  label: string,
  media: MediaPlaylistsMedia,
  mediaKind: 'audio' | 'video'
): MediaPlaylistsEntryActionItem {
  return {
    id,
    label,
    media,
    mediaKind
  };
}

export function playlistActionRun(
  actionDispatch: MediaPlaylistsActionDispatch,
  verb: PlaylistActionVerb,
  item: MediaPlaylistsActionItem
): PlaylistActionRun {
  const action =
    verb === 'play' ? actionDispatch.playPlaylistItem : actionDispatch.queuePlaylistItem;
  const actionLabel = verb === 'play' ? 'Played' : 'Queued';
  return {
    verb,
    item,
    label: item.label,
    pendingCopy: `${capitalize(verb === 'play' ? 'playing' : 'queueing')} playlist ${item.label}…`,
    successCopy: `${actionLabel} playlist ${item.label}.`,
    errorCopy: `Could not ${verb} playlist ${item.label}.`,
    fallbackError: 'Playlist action failed.',
    run: () => action(item)
  };
}

export function entryActionRun(
  actionDispatch: MediaPlaylistsActionDispatch,
  verb: PlaylistActionVerb,
  item: MediaPlaylistsEntryActionItem
): PlaylistActionRun {
  const action = verb === 'play' ? actionDispatch.playEntryItem : actionDispatch.queueEntryItem;
  const actionLabel = verb === 'play' ? 'Played' : 'Queued';
  return {
    verb,
    item,
    label: item.label,
    pendingCopy: `${capitalize(verb === 'play' ? 'playing' : 'queueing')} ${item.label}…`,
    successCopy: `${actionLabel} ${item.label}.`,
    errorCopy: `Could not ${verb} ${item.label}.`,
    fallbackError: 'Playlist entry action failed.',
    run: () => action?.(item)
  };
}

export function actionId(
  verb: PlaylistActionVerb,
  item: MediaPlaylistsActionItem | MediaPlaylistsEntryActionItem
): string {
  return `${verb}:${item.id}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
