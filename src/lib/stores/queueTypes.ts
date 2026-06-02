import type { KodiEndpointDescription, KodiJsonRpcHttpClient, KodiNotification } from '$lib/kodi';
import type { PlayerStoreSnapshot } from './player.svelte.ts';

export type QueueCommandStatus = 'idle' | 'running' | 'success' | 'error';
export type QueueCommandName =
  | 'removeAt'
  | 'clear'
  | 'swap'
  | 'queueMusicItem'
  | 'queueMovieItem'
  | 'queueEpisodeItem'
  | 'queueMusicVideoItem'
  | 'queueLibraryItems'
  | 'queueFileItem'
  | 'queueFileItems'
  | 'queuePlaylistItem';
export type QueueDispatchErrorSource = 'config' | 'queue' | 'input' | 'http' | 'command';

export type MusicQueueItem =
  | { kind?: 'song'; songid: number; albumid?: never; artistid?: never; file?: never }
  | { kind?: 'album'; albumid: number; songid?: never; artistid?: never; file?: never }
  | { kind?: 'artist'; artistid: number; songid?: never; albumid?: never; file?: never };

export type MovieQueueItem = { movieid: number };
export type EpisodeQueueItem = { episodeid: number };
export type MusicVideoQueueItem = { musicvideoid: number };
export type LibraryQueueItem =
  | { media: 'music'; item: MusicQueueItem }
  | { media: 'movie'; item: MovieQueueItem }
  | { media: 'episode'; item: EpisodeQueueItem }
  | { media: 'musicvideo'; item: MusicVideoQueueItem };
export type FileQueueItem = {
  file: string;
  mediaKind: 'audio' | 'video';
  itemType?: 'file' | 'directory';
};
export type PlaylistQueueItem = {
  file: string;
  mediaKind: 'music' | 'video';
  playlistKind: 'smart' | 'basic';
};

export interface QueueDispatchSafeErrorSnapshot {
  source: QueueDispatchErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface QueueDispatchSnapshot {
  commandStatus: QueueCommandStatus;
  lastCommand: QueueCommandName | null;
  lastError: QueueDispatchSafeErrorSnapshot | null;
  lastCompletedAt: string | null;
}

export interface QueueDispatchQueueStore {
  readonly snapshot: Pick<QueueStoreSnapshot, 'playlistid' | 'items'>;
  refresh(reason: `command:${QueueCommandName}`): Promise<void> | void;
}

export interface QueueDispatchPlayerStore {
  refresh(reason: `command:${QueueCommandName}`): Promise<void> | void;
}

export interface QueueDispatchOptions {
  queueStore?: QueueDispatchQueueStore;
  playerStore?: QueueDispatchPlayerStore;
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

export type QueueRefreshStatus = 'idle' | 'loading' | 'ready' | 'error';
export type QueueRefreshReason =
  | 'init'
  | 'manual'
  | 'poll'
  | `notification:${string}`
  | `command:${string}`;
export type QueueErrorSource = 'http' | 'client' | 'unknown';

export interface QueueSafeErrorSnapshot {
  source: QueueErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface QueueItemSnapshot {
  position: number;
  label: string;
  title?: string;
  artist?: string[];
  album?: string;
  duration?: number;
  episode?: number;
  season?: number;
  showtitle?: string;
  thumbnail?: string;
  track?: number;
  type?: string;
}

export interface QueuePlayableItemSnapshot {
  position: number;
  label: string;
  file: string;
  type?: string;
  duration?: number;
  thumbnail?: string;
}

export interface QueueLimitsSnapshot {
  start: number;
  end: number;
  total: number;
}

export interface QueueStoreSnapshot {
  refreshStatus: QueueRefreshStatus;
  playlistid: number | null;
  activePosition: number | null;
  items: QueueItemSnapshot[];
  limits: QueueLimitsSnapshot;
  lastRefreshReason: QueueRefreshReason;
  lastUpdatedAt: string | null;
  lastError: QueueSafeErrorSnapshot | null;
}

export interface QueueStorePlayerStore {
  readonly snapshot: Pick<PlayerStoreSnapshot, 'queue'>;
}

export interface QueueStoreNotificationSource {
  subscribeToNotifications(listener: (notification: KodiNotification) => void): () => void;
}

export interface QueueStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  playerStore?: QueueStorePlayerStore;
  notificationSource?: QueueStoreNotificationSource | null;
  now?: () => string;
}
