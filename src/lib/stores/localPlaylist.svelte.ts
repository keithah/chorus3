export const LOCAL_PLAYLIST_STORAGE_KEY = 'chorus3.localPlaylists';

import type {
  LocalPlaylistDispatch,
  LocalPlaylistItemRecord,
  LocalPlaylistItemSnapshot,
  LocalPlaylistMoveDirection,
  LocalPlaylistMutationName,
  LocalPlaylistMutationResult,
  LocalPlaylistPlayableItem,
  LocalPlaylistRecord,
  LocalPlaylistSnapshot,
  LocalPlaylistStorage,
  LocalPlaylistStoreOptions,
  LocalPlaylistStoreSnapshot,
  LocalPlaylistValidationErrors
} from './localPlaylistTypes';

export type {
  LocalPlaylistDispatch,
  LocalPlaylistItemInput,
  LocalPlaylistItemKind,
  LocalPlaylistItemSnapshot,
  LocalPlaylistMoveDirection,
  LocalPlaylistMutationName,
  LocalPlaylistMutationResult,
  LocalPlaylistMutationStatus,
  LocalPlaylistPlayableItem,
  LocalPlaylistSafeErrorSnapshot,
  LocalPlaylistSnapshot,
  LocalPlaylistStorage,
  LocalPlaylistStorageWarning,
  LocalPlaylistStorageWarningCode,
  LocalPlaylistStoreOptions,
  LocalPlaylistStoreSnapshot,
  LocalPlaylistValidationErrors,
  LocalPlaylistValidationField
} from './localPlaylistTypes';

import {
  ITEM_ID_PATTERN,
  MAX_ITEMS_PER_PLAYLIST,
  PLAYLIST_ID_PATTERN,
  cloneItemSnapshot,
  clonePlayableItem,
  clonePlaylistRecord,
  clonePlaylistSnapshot,
  cloneStoreSnapshot,
  cloneValidationErrors,
  createRandomId,
  createStorageWarning,
  cryptoRandomToken,
  isRecord,
  normalizeOptionalDuration,
  normalizeOptionalPrivateText,
  normalizeOptionalSourceId,
  normalizePositions,
  normalizeSafeLabel,
  validatePersistedPayload,
  validatePrivateFile
} from './localPlaylistModel';

export { createLocalPlaylistSafeError } from './localPlaylistModel';

const DEFAULT_SNAPSHOT: LocalPlaylistStoreSnapshot = {
  playlists: [],
  selectedPlaylistId: null,
  selectedPlaylist: null,
  playlistCount: 0,
  selectedItemCount: 0,
  mutationStatus: 'idle',
  lastMutation: null,
  validationErrors: {},
  storageWarning: null,
  lastError: null,
  lastUpdatedAt: null
};

export class LocalPlaylistStore implements LocalPlaylistDispatch {
  #snapshot = $state<LocalPlaylistStoreSnapshot>(cloneStoreSnapshot(DEFAULT_SNAPSHOT));
  #playlists = $state<LocalPlaylistRecord[]>([]);
  #selectedPlaylistId = $state<string | null>(null);

  readonly #storage: LocalPlaylistStorage | null;
  readonly #now: () => string;
  readonly #createId: (prefix: 'playlist' | 'item') => string;

  constructor(options: LocalPlaylistStoreOptions = {}) {
    this.#storage = options.storage ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#createId = options.createId ?? createRandomId;
    this.#load();
    this.#publish();
  }

  get snapshot(): LocalPlaylistStoreSnapshot {
    return cloneStoreSnapshot(this.#snapshot);
  }

  createPlaylist(label: string): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }> {
    this.#startMutation('createPlaylist');
    const labelResult = normalizeSafeLabel(label, 'Local playlist name is required.');

    if (!labelResult.ok) {
      return this.#reject({ label: labelResult.error });
    }

    const id = this.#createValidId('playlist');
    const now = this.#now();
    const playlist: LocalPlaylistRecord = {
      id,
      label: labelResult.value,
      items: [],
      createdAt: now,
      updatedAt: now
    };

    this.#playlists = [...this.#playlists, playlist];
    this.#selectedPlaylistId ??= id;
    this.#completeMutation(now);

    return { ok: true, playlist: clonePlaylistSnapshot(playlist) };
  }

  renamePlaylist(
    playlistId: string,
    label: string
  ): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }> {
    this.#startMutation('renamePlaylist');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    const labelResult = normalizeSafeLabel(label, 'Local playlist name is required.');
    if (!labelResult.ok) {
      return this.#reject({ label: labelResult.error });
    }

    const now = this.#now();
    this.#playlists = this.#playlists.map((candidate) =>
      candidate.id === playlistId
        ? { ...candidate, label: labelResult.value, updatedAt: now }
        : candidate
    );
    this.#completeMutation(now);

    return {
      ok: true,
      playlist: clonePlaylistSnapshot(this.#findPlaylist(playlistId) ?? playlist)
    };
  }

  removePlaylist(playlistId: string): LocalPlaylistMutationResult {
    this.#startMutation('removePlaylist');

    if (!this.#findPlaylist(playlistId)) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    this.#playlists = this.#playlists.filter((playlist) => playlist.id !== playlistId);
    if (this.#selectedPlaylistId === playlistId) {
      this.#selectedPlaylistId = this.#playlists[0]?.id ?? null;
    }
    this.#completeMutation(this.#now());

    return { ok: true };
  }

  selectPlaylist(
    playlistId: string
  ): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }> {
    this.#startMutation('selectPlaylist');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    this.#selectedPlaylistId = playlistId;
    this.#completeMutation(this.#now());

    return { ok: true, playlist: clonePlaylistSnapshot(playlist) };
  }

  clearPlaylist(playlistId: string): LocalPlaylistMutationResult {
    this.#startMutation('clearPlaylist');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    const now = this.#now();
    this.#playlists = this.#playlists.map((candidate) =>
      candidate.id === playlistId ? { ...candidate, items: [], updatedAt: now } : candidate
    );
    this.#completeMutation(now);

    return { ok: true };
  }

  addItems(
    playlistId: string,
    items: unknown
  ): LocalPlaylistMutationResult<{ items: LocalPlaylistItemSnapshot[] }> {
    this.#startMutation('addItems');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return this.#reject({ items: 'Choose one or more supported local playlist items.' });
    }

    const now = this.#now();
    const normalizedItems: LocalPlaylistItemRecord[] = [];

    for (const item of items) {
      const result = this.#normalizeItemInput(
        item,
        playlist.items.length + normalizedItems.length,
        now
      );
      if (!result.ok) {
        return this.#reject(result.errors);
      }
      normalizedItems.push(result.item);
    }

    if (playlist.items.length + normalizedItems.length > MAX_ITEMS_PER_PLAYLIST) {
      return this.#reject({ items: 'Local playlist item limit reached.' });
    }

    this.#playlists = this.#playlists.map((candidate) =>
      candidate.id === playlistId
        ? { ...candidate, items: [...candidate.items, ...normalizedItems], updatedAt: now }
        : candidate
    );
    this.#completeMutation(now);

    return { ok: true, items: normalizedItems.map(cloneItemSnapshot) };
  }

  removeItem(playlistId: string, itemId: string): LocalPlaylistMutationResult {
    this.#startMutation('removeItem');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    if (!playlist.items.some((item) => item.id === itemId)) {
      return this.#reject({ itemId: 'Choose an existing local playlist item.' });
    }

    const now = this.#now();
    this.#playlists = this.#playlists.map((candidate) =>
      candidate.id === playlistId
        ? {
            ...candidate,
            items: normalizePositions(candidate.items.filter((item) => item.id !== itemId)),
            updatedAt: now
          }
        : candidate
    );
    this.#completeMutation(now);

    return { ok: true };
  }

  moveItem(
    playlistId: string,
    itemId: string,
    direction: LocalPlaylistMoveDirection
  ): LocalPlaylistMutationResult {
    this.#startMutation('moveItem');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    const currentIndex = playlist.items.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) {
      return this.#reject({ itemId: 'Choose an existing local playlist item.' });
    }

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= playlist.items.length) {
      this.#completeMutation(this.#now());
      return { ok: true };
    }

    const items = [...playlist.items];
    const [item] = items.splice(currentIndex, 1);
    items.splice(nextIndex, 0, item);
    const now = this.#now();

    this.#playlists = this.#playlists.map((candidate) =>
      candidate.id === playlistId
        ? { ...candidate, items: normalizePositions(items), updatedAt: now }
        : candidate
    );
    this.#completeMutation(now);

    return { ok: true };
  }

  reorderItems(playlistId: string, itemIds: string[]): LocalPlaylistMutationResult {
    this.#startMutation('reorderItems');
    const playlist = this.#findPlaylist(playlistId);

    if (!playlist) {
      return this.#reject({ playlistId: 'Choose an existing local playlist.' });
    }

    const itemById = new Map(playlist.items.map((item) => [item.id, item]));
    const requestedIds = new Set(itemIds);
    const isExactSet =
      itemIds.length === playlist.items.length &&
      requestedIds.size === itemIds.length &&
      itemIds.every((id) => itemById.has(id));

    if (!isExactSet) {
      return this.#reject({ itemIds: 'Provide each current local playlist item id exactly once.' });
    }

    const now = this.#now();
    this.#playlists = this.#playlists.map((candidate) =>
      candidate.id === playlistId
        ? {
            ...candidate,
            items: normalizePositions(itemIds.map((id) => itemById.get(id)!)),
            updatedAt: now
          }
        : candidate
    );
    this.#completeMutation(now);

    return { ok: true };
  }

  getPlayableItems(playlistId: string): LocalPlaylistPlayableItem[] {
    const playlist = this.#findPlaylist(playlistId);
    if (!playlist) {
      return [];
    }

    return playlist.items.map(clonePlayableItem);
  }

  reset(): void {
    this.#startMutation('reset');
    this.#playlists = [];
    this.#selectedPlaylistId = null;
    this.#snapshot = {
      ...cloneStoreSnapshot(DEFAULT_SNAPSHOT),
      mutationStatus: 'success',
      lastMutation: 'reset',
      lastUpdatedAt: this.#now()
    };

    if (!this.#storage) {
      return;
    }

    try {
      this.#storage.removeItem(LOCAL_PLAYLIST_STORAGE_KEY);
    } catch {
      this.#snapshot = {
        ...this.#snapshot,
        storageWarning: createStorageWarning('remove-failed')
      };
    }
  }

  #load(): void {
    if (!this.#storage) {
      return;
    }

    let rawValue: string | null;

    try {
      rawValue = this.#storage.getItem(LOCAL_PLAYLIST_STORAGE_KEY);
    } catch {
      this.#snapshot = {
        ...this.#snapshot,
        storageWarning: createStorageWarning('read-failed')
      };
      return;
    }

    if (!rawValue) {
      return;
    }

    try {
      const payload = validatePersistedPayload(JSON.parse(rawValue) as unknown);
      this.#playlists = payload.playlists;
      this.#selectedPlaylistId = payload.selectedPlaylistId;
      this.#snapshot = {
        ...this.#snapshot,
        storageWarning: null
      };
    } catch {
      this.#playlists = [];
      this.#selectedPlaylistId = null;
      this.#snapshot = {
        ...this.#snapshot,
        storageWarning: createStorageWarning('invalid-storage')
      };
    }
  }

  #persist(): void {
    if (!this.#storage) {
      return;
    }

    try {
      this.#storage.setItem(
        LOCAL_PLAYLIST_STORAGE_KEY,
        JSON.stringify({
          playlists: this.#playlists.map(clonePlaylistRecord),
          selectedPlaylistId: this.#selectedPlaylistId
        })
      );
      this.#snapshot = { ...this.#snapshot, storageWarning: null };
    } catch {
      this.#snapshot = { ...this.#snapshot, storageWarning: createStorageWarning('write-failed') };
    }
  }

  #startMutation(mutation: LocalPlaylistMutationName): void {
    this.#snapshot = {
      ...this.#snapshot,
      mutationStatus: 'running',
      lastMutation: mutation,
      validationErrors: {},
      lastError: null
    };
  }

  #completeMutation(updatedAt: string): void {
    this.#persist();
    this.#publish({ mutationStatus: 'success', lastUpdatedAt: updatedAt });
  }

  #reject(errors: LocalPlaylistValidationErrors): {
    ok: false;
    errors: LocalPlaylistValidationErrors;
  } {
    const safeErrors = cloneValidationErrors(errors);
    this.#snapshot = {
      ...this.#snapshot,
      mutationStatus: 'error',
      validationErrors: safeErrors,
      lastError: {
        source: 'input',
        code: 'input/invalid-local-playlist',
        message: Object.values(safeErrors)[0] ?? 'Local playlist input was invalid.'
      }
    };
    this.#publish({
      mutationStatus: 'error',
      validationErrors: safeErrors,
      lastError: this.#snapshot.lastError
    });

    return { ok: false, errors: cloneValidationErrors(safeErrors) };
  }

  #publish(overrides: Partial<LocalPlaylistStoreSnapshot> = {}): void {
    const selectedPlaylist = this.#selectedPlaylistId
      ? this.#findPlaylist(this.#selectedPlaylistId)
      : null;
    const warning = overrides.storageWarning ?? this.#snapshot.storageWarning;
    const lastError = overrides.lastError ?? this.#snapshot.lastError;

    this.#snapshot = {
      playlists: this.#playlists.map(clonePlaylistSnapshot),
      selectedPlaylistId: selectedPlaylist?.id ?? null,
      selectedPlaylist: selectedPlaylist ? clonePlaylistSnapshot(selectedPlaylist) : null,
      playlistCount: this.#playlists.length,
      selectedItemCount: selectedPlaylist?.items.length ?? 0,
      mutationStatus: overrides.mutationStatus ?? this.#snapshot.mutationStatus,
      lastMutation: overrides.lastMutation ?? this.#snapshot.lastMutation,
      validationErrors: cloneValidationErrors(
        overrides.validationErrors ?? this.#snapshot.validationErrors
      ),
      storageWarning: warning ? { ...warning } : null,
      lastError: lastError ? { ...lastError } : null,
      lastUpdatedAt: overrides.lastUpdatedAt ?? this.#snapshot.lastUpdatedAt
    };
  }

  #findPlaylist(id: string): LocalPlaylistRecord | null {
    return this.#playlists.find((playlist) => playlist.id === id) ?? null;
  }

  #createValidId(prefix: 'playlist' | 'item'): string {
    const id = this.#createId(prefix);
    const pattern = prefix === 'playlist' ? PLAYLIST_ID_PATTERN : ITEM_ID_PATTERN;

    if (typeof id === 'string' && pattern.test(id)) {
      return id;
    }

    return `${prefix}-${cryptoRandomToken()}`;
  }

  #normalizeItemInput(
    value: unknown,
    position: number,
    addedAt: string
  ):
    | { ok: true; item: LocalPlaylistItemRecord }
    | { ok: false; errors: LocalPlaylistValidationErrors } {
    if (!isRecord(value)) {
      return { ok: false, errors: { items: 'Choose one or more supported local playlist items.' } };
    }

    const kind = value.kind;
    if (kind !== 'audio' && kind !== 'video' && kind !== 'playlist') {
      return { ok: false, errors: { items: 'Choose a supported local playlist item type.' } };
    }

    const labelResult = normalizeSafeLabel(value.label, 'Local playlist item label is required.');
    if (!labelResult.ok) {
      return { ok: false, errors: { items: labelResult.error } };
    }

    const fileResult = validatePrivateFile(value.file);
    if (!fileResult.ok) {
      return { ok: false, errors: { items: fileResult.error } };
    }

    const sourceId = normalizeOptionalSourceId(value.sourceId);
    if (sourceId === false) {
      return { ok: false, errors: { items: 'Local playlist source id is invalid.' } };
    }

    const durationSeconds = normalizeOptionalDuration(value.durationSeconds);
    if (durationSeconds === false) {
      return { ok: false, errors: { items: 'Local playlist duration is invalid.' } };
    }

    const thumbnail = normalizeOptionalPrivateText(value.thumbnail);
    if (thumbnail === false) {
      return { ok: false, errors: { items: 'Local playlist thumbnail is invalid.' } };
    }

    return {
      ok: true,
      item: {
        id: this.#createValidId('item'),
        kind,
        label: labelResult.value,
        file: fileResult.value,
        position,
        ...(sourceId === undefined ? {} : { sourceId }),
        ...(durationSeconds === undefined ? {} : { durationSeconds }),
        ...(thumbnail === undefined ? {} : { thumbnail }),
        addedAt
      }
    };
  }
}

export function createLocalPlaylistStore(
  options: LocalPlaylistStoreOptions = {}
): LocalPlaylistStore {
  return new LocalPlaylistStore(options);
}

export const localPlaylistStore = createLocalPlaylistStore({
  storage: typeof localStorage === 'undefined' ? null : localStorage
});
