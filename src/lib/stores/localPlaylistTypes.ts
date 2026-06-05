export type LocalPlaylistItemKind = 'audio' | 'video' | 'playlist';
export type LocalPlaylistMutationStatus = 'idle' | 'running' | 'success' | 'error';
export type LocalPlaylistMutationName =
  | 'createPlaylist'
  | 'renamePlaylist'
  | 'removePlaylist'
  | 'selectPlaylist'
  | 'clearPlaylist'
  | 'addItems'
  | 'removeItem'
  | 'moveItem'
  | 'reorderItems'
  | 'reset';
export type LocalPlaylistStorageWarningCode =
  | 'read-failed'
  | 'write-failed'
  | 'remove-failed'
  | 'invalid-storage';
export type LocalPlaylistValidationField =
  | 'id'
  | 'label'
  | 'playlistId'
  | 'itemId'
  | 'itemIds'
  | 'items';
export type LocalPlaylistValidationErrors = Partial<Record<LocalPlaylistValidationField, string>>;
export type LocalPlaylistMoveDirection = 'up' | 'down';

export type LocalPlaylistStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocalPlaylistStorageWarning {
  code: LocalPlaylistStorageWarningCode;
  message: string;
}

export interface LocalPlaylistSafeErrorSnapshot {
  source: 'input' | 'storage';
  code: string;
  message: string;
}

export interface LocalPlaylistItemInput {
  kind: LocalPlaylistItemKind;
  label: string;
  file: string;
  sourceId?: string;
  durationSeconds?: number;
  thumbnail?: string;
}

export interface LocalPlaylistItemSnapshot {
  id: string;
  kind: LocalPlaylistItemKind;
  label: string;
  position: number;
  sourceId?: string;
  durationSeconds?: number;
  addedAt: string;
}

export interface LocalPlaylistPlayableItem {
  id: string;
  kind: LocalPlaylistItemKind;
  label: string;
  file: string;
  position: number;
  sourceId?: string;
  durationSeconds?: number;
  thumbnail?: string;
}

export interface LocalPlaylistSnapshot {
  id: string;
  label: string;
  items: LocalPlaylistItemSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalPlaylistStoreSnapshot {
  playlists: LocalPlaylistSnapshot[];
  selectedPlaylistId: string | null;
  selectedPlaylist: LocalPlaylistSnapshot | null;
  playlistCount: number;
  selectedItemCount: number;
  mutationStatus: LocalPlaylistMutationStatus;
  lastMutation: LocalPlaylistMutationName | null;
  validationErrors: LocalPlaylistValidationErrors;
  storageWarning: LocalPlaylistStorageWarning | null;
  lastError: LocalPlaylistSafeErrorSnapshot | null;
  lastUpdatedAt: string | null;
}

export interface LocalPlaylistStoreOptions {
  storage?: LocalPlaylistStorage | null;
  now?: () => string;
  createId?: (prefix: 'playlist' | 'item') => string;
}

export type LocalPlaylistMutationResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; errors: LocalPlaylistValidationErrors };

export interface LocalPlaylistDispatch {
  createPlaylist(label: string): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }>;
  renamePlaylist(
    playlistId: string,
    label: string
  ): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }>;
  removePlaylist(playlistId: string): LocalPlaylistMutationResult;
  selectPlaylist(
    playlistId: string
  ): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }>;
  clearPlaylist(playlistId: string): LocalPlaylistMutationResult;
  addItems(
    playlistId: string,
    items: unknown
  ): LocalPlaylistMutationResult<{ items: LocalPlaylistItemSnapshot[] }>;
  removeItem(playlistId: string, itemId: string): LocalPlaylistMutationResult;
  moveItem(
    playlistId: string,
    itemId: string,
    direction: LocalPlaylistMoveDirection
  ): LocalPlaylistMutationResult;
  reorderItems(playlistId: string, itemIds: string[]): LocalPlaylistMutationResult;
  getPlayableItems?(playlistId: string): LocalPlaylistPlayableItem[];
  reset(): void;
}

export interface LocalPlaylistItemRecord extends LocalPlaylistItemSnapshot {
  file: string;
  thumbnail?: string;
}

export interface LocalPlaylistRecord extends Omit<LocalPlaylistSnapshot, 'items'> {
  items: LocalPlaylistItemRecord[];
}

export interface PersistedLocalPlaylistsPayload {
  playlists: LocalPlaylistRecord[];
  selectedPlaylistId: string | null;
}
