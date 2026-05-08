import { isTextSecretSafe, redactDiagnosticText } from '$lib/safety/redaction';

export const LOCAL_PLAYLIST_STORAGE_KEY = 'chorus3.localPlaylists';

const MAX_PLAYLISTS = 100;
const MAX_ITEMS_PER_PLAYLIST = 1_000;
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const PLAYLIST_ID_PATTERN = /^playlist-[A-Za-z0-9_-]+$/;
const ITEM_ID_PATTERN = /^item-[A-Za-z0-9_-]+$/;

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

interface LocalPlaylistItemRecord extends LocalPlaylistItemSnapshot {
  file: string;
  thumbnail?: string;
}

interface LocalPlaylistRecord extends Omit<LocalPlaylistSnapshot, 'items'> {
  items: LocalPlaylistItemRecord[];
}

interface PersistedLocalPlaylistsPayload {
  playlists: LocalPlaylistRecord[];
  selectedPlaylistId: string | null;
}

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

function validatePersistedPayload(value: unknown): PersistedLocalPlaylistsPayload {
  if (!isRecord(value) || !Array.isArray(value.playlists)) {
    throw new Error('Persisted local playlists must include a playlists array.');
  }

  if (value.playlists.length > MAX_PLAYLISTS) {
    throw new Error('Persisted local playlists exceeded the playlist limit.');
  }

  const playlists = value.playlists.map(validatePersistedPlaylist);
  const selectedPlaylistId = validatePersistedSelectedPlaylistId(
    value.selectedPlaylistId,
    playlists
  );

  return { playlists, selectedPlaylistId };
}

function validatePersistedPlaylist(value: unknown): LocalPlaylistRecord {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error('Persisted local playlist was invalid.');
  }

  if (!isValidPlaylistId(value.id)) {
    throw new Error('Persisted local playlist id was invalid.');
  }

  const label = normalizeSafeLabel(value.label, 'Local playlist name is required.');
  if (!label.ok) {
    throw new Error('Persisted local playlist label was invalid.');
  }

  if (value.items.length > MAX_ITEMS_PER_PLAYLIST) {
    throw new Error('Persisted local playlist item limit exceeded.');
  }

  return {
    id: value.id,
    label: label.value,
    items: normalizePositions(value.items.map(validatePersistedItem)),
    createdAt: validateIsoString(value.createdAt),
    updatedAt: validateIsoString(value.updatedAt)
  };
}

function validatePersistedItem(value: unknown): LocalPlaylistItemRecord {
  if (!isRecord(value)) {
    throw new Error('Persisted local playlist item was invalid.');
  }

  if (!isValidItemId(value.id)) {
    throw new Error('Persisted local playlist item id was invalid.');
  }

  if (value.kind !== 'audio' && value.kind !== 'video' && value.kind !== 'playlist') {
    throw new Error('Persisted local playlist item kind was invalid.');
  }

  const label = normalizeSafeLabel(value.label, 'Local playlist item label is required.');
  if (!label.ok) {
    throw new Error('Persisted local playlist item label was invalid.');
  }

  const file = validatePrivateFile(value.file);
  if (!file.ok) {
    throw new Error('Persisted local playlist item file was invalid.');
  }

  const sourceId = normalizeOptionalSourceId(value.sourceId);
  if (sourceId === false) {
    throw new Error('Persisted local playlist source id was invalid.');
  }

  const durationSeconds = normalizeOptionalDuration(value.durationSeconds);
  if (durationSeconds === false) {
    throw new Error('Persisted local playlist duration was invalid.');
  }

  const thumbnail = normalizeOptionalPrivateText(value.thumbnail);
  if (thumbnail === false) {
    throw new Error('Persisted local playlist thumbnail was invalid.');
  }

  return {
    id: value.id,
    kind: value.kind,
    label: label.value,
    file: file.value,
    position:
      typeof value.position === 'number' &&
      Number.isSafeInteger(value.position) &&
      value.position >= 0
        ? value.position
        : 0,
    ...(sourceId === undefined ? {} : { sourceId }),
    ...(durationSeconds === undefined ? {} : { durationSeconds }),
    ...(thumbnail === undefined ? {} : { thumbnail }),
    addedAt: validateIsoString(value.addedAt)
  };
}

function validatePersistedSelectedPlaylistId(
  value: unknown,
  playlists: LocalPlaylistRecord[]
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || !playlists.some((playlist) => playlist.id === value)) {
    throw new Error('Persisted selected local playlist id was invalid.');
  }

  return value;
}

function normalizeSafeLabel(
  value: unknown,
  requiredMessage: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string') {
    return { ok: false, error: requiredMessage };
  }

  const label = value.trim().replace(/\s+/g, ' ');
  if (!label) {
    return { ok: false, error: requiredMessage };
  }

  if (!isTextSecretSafe(label)) {
    return { ok: false, error: 'Use a safe display name without paths, URLs, or credentials.' };
  }

  return { ok: true, value: label };
}

function validatePrivateFile(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: 'Choose a playable local media item.' };
  }

  const file = value.trim();
  if (/https?:\/\//i.test(file) || /authorization\s*:/i.test(file)) {
    return {
      ok: false,
      error: 'Choose a playable local media item without remote URLs or credentials.'
    };
  }

  return { ok: true, value: file };
}

function normalizeOptionalSourceId(value: unknown): string | undefined | false {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const sourceId = value.trim();
  return sourceId && SAFE_ID_PATTERN.test(sourceId.replace(/:/g, '_')) ? sourceId : false;
}

function normalizeOptionalDuration(value: unknown): number | undefined | false {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : false;
}

function normalizeOptionalPrivateText(value: unknown): string | undefined | false {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const text = value.trim();
  return text ? text : undefined;
}

function validateIsoString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Persisted timestamp was invalid.');
  }

  return value;
}

function isValidPlaylistId(value: unknown): value is string {
  return typeof value === 'string' && PLAYLIST_ID_PATTERN.test(value);
}

function isValidItemId(value: unknown): value is string {
  return typeof value === 'string' && ITEM_ID_PATTERN.test(value);
}

function normalizePositions(items: LocalPlaylistItemRecord[]): LocalPlaylistItemRecord[] {
  return items.map((item, position) => ({ ...item, position }));
}

function clonePlaylistRecord(playlist: LocalPlaylistRecord): LocalPlaylistRecord {
  return {
    ...playlist,
    items: playlist.items.map((item) => ({ ...item }))
  };
}

function clonePlaylistSnapshot(playlist: LocalPlaylistRecord): LocalPlaylistSnapshot {
  return {
    id: playlist.id,
    label: playlist.label,
    items: playlist.items.map(cloneItemSnapshot),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt
  };
}

function cloneItemSnapshot(item: LocalPlaylistItemRecord): LocalPlaylistItemSnapshot {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    position: item.position,
    ...(item.sourceId === undefined ? {} : { sourceId: item.sourceId }),
    ...(item.durationSeconds === undefined ? {} : { durationSeconds: item.durationSeconds }),
    addedAt: item.addedAt
  };
}

function clonePlayableItem(item: LocalPlaylistItemRecord): LocalPlaylistPlayableItem {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    file: item.file,
    position: item.position,
    ...(item.sourceId === undefined ? {} : { sourceId: item.sourceId }),
    ...(item.durationSeconds === undefined ? {} : { durationSeconds: item.durationSeconds }),
    ...(item.thumbnail === undefined ? {} : { thumbnail: item.thumbnail })
  };
}

function cloneStoreSnapshot(snapshot: LocalPlaylistStoreSnapshot): LocalPlaylistStoreSnapshot {
  return {
    ...snapshot,
    playlists: snapshot.playlists.map((playlist) => ({
      ...playlist,
      items: playlist.items.map((item) => ({ ...item }))
    })),
    selectedPlaylist: snapshot.selectedPlaylist
      ? {
          ...snapshot.selectedPlaylist,
          items: snapshot.selectedPlaylist.items.map((item) => ({ ...item }))
        }
      : null,
    validationErrors: cloneValidationErrors(snapshot.validationErrors),
    storageWarning: snapshot.storageWarning ? { ...snapshot.storageWarning } : null,
    lastError: snapshot.lastError ? { ...snapshot.lastError } : null
  };
}

function cloneValidationErrors(
  errors: LocalPlaylistValidationErrors
): LocalPlaylistValidationErrors {
  return { ...errors };
}

function createStorageWarning(code: LocalPlaylistStorageWarningCode): LocalPlaylistStorageWarning {
  switch (code) {
    case 'read-failed':
      return {
        code,
        message: 'Local playlists could not be read. In-memory playlists are still available.'
      };
    case 'write-failed':
      return {
        code,
        message: 'Local playlists could not be written. Changes are kept in memory only.'
      };
    case 'remove-failed':
      return {
        code,
        message: 'Local playlists could not be removed from browser storage.'
      };
    case 'invalid-storage':
      return {
        code,
        message: 'Local playlists were reset because stored data was invalid.'
      };
  }
}

function createRandomId(prefix: 'playlist' | 'item'): string {
  return `${prefix}-${cryptoRandomToken()}`;
}

function cryptoRandomToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }

  return Math.random().toString(36).slice(2, 12);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createLocalPlaylistSafeError(error: unknown): LocalPlaylistSafeErrorSnapshot {
  return {
    source: 'storage',
    code: 'storage/failed',
    message: redactDiagnosticText(error)
  };
}
