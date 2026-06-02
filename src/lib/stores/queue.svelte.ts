import {
  KodiHttpClientError,
  addEpisodePlaylistItem,
  addFilePlaylistItem,
  addMoviePlaylistItem,
  addMusicVideoPlaylistItem,
  addMusicPlaylistItem,
  addPlaylistFileItem,
  clearPlaylist,
  getPlaylistItems,
  isKodiHttpClientError,
  removePlaylistItem,
  swapPlaylistItems,
  type KodiEpisodeLibraryItem,
  type KodiJsonRpcBatchCall,
  type KodiJsonRpcHttpClient,
  type KodiMovieLibraryItem,
  type KodiMusicVideoLibraryItem,
  type KodiMusicLibraryItem,
  type PlaylistItemPropertyName
} from '$lib/kodi';
import { isQueueRefreshNotification } from '$lib/kodi/notifications';
import { connectionStore as defaultConnectionStore } from './connection.svelte.ts';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { playerStore as defaultPlayerStore } from './player.svelte.ts';
import {
  QueueClientError,
  cloneQueueStoreSnapshot,
  createSafeError,
  normalizeActiveQueue,
  normalizeItems,
  normalizeLimits,
  normalizePlayableItems,
  sanitizeErrorMessage
} from './queueStoreSnapshots';
import type {
  EpisodeQueueItem,
  FileQueueItem,
  LibraryQueueItem,
  MovieQueueItem,
  MusicQueueItem,
  MusicVideoQueueItem,
  PlaylistQueueItem,
  QueueCommandName,
  QueueDispatchOptions,
  QueueDispatchPlayerStore,
  QueueDispatchQueueStore,
  QueueDispatchSafeErrorSnapshot,
  QueueDispatchSnapshot,
  QueueLimitsSnapshot,
  QueuePlayableItemSnapshot,
  QueueRefreshReason,
  QueueStoreNotificationSource,
  QueueStoreOptions,
  QueueStorePlayerStore,
  QueueStoreSnapshot
} from './queueTypes';

export type {
  EpisodeQueueItem,
  FileQueueItem,
  LibraryQueueItem,
  MovieQueueItem,
  MusicQueueItem,
  MusicVideoQueueItem,
  PlaylistQueueItem,
  QueueCommandName,
  QueueCommandStatus,
  QueueDispatchErrorSource,
  QueueDispatchOptions,
  QueueDispatchPlayerStore,
  QueueDispatchQueueStore,
  QueueDispatchSafeErrorSnapshot,
  QueueDispatchSnapshot,
  QueueErrorSource,
  QueueItemSnapshot,
  QueueLimitsSnapshot,
  QueuePlayableItemSnapshot,
  QueueRefreshReason,
  QueueRefreshStatus,
  QueueSafeErrorSnapshot,
  QueueStoreNotificationSource,
  QueueStoreOptions,
  QueueStorePlayerStore,
  QueueStoreSnapshot
} from './queueTypes';

const DEFAULT_LIMITS: QueueLimitsSnapshot = { start: 0, end: 0, total: 0 };

const DEFAULT_SNAPSHOT: QueueStoreSnapshot = {
  refreshStatus: 'idle',
  playlistid: null,
  activePosition: null,
  items: [],
  limits: DEFAULT_LIMITS,
  lastRefreshReason: 'init',
  lastUpdatedAt: null,
  lastError: null
};

const DEFAULT_DISPATCH_SNAPSHOT: QueueDispatchSnapshot = {
  commandStatus: 'idle',
  lastCommand: null,
  lastError: null,
  lastCompletedAt: null
};

const DEFAULT_PLAYLIST_PROPERTIES = [
  'album',
  'artist',
  'duration',
  'episode',
  'file',
  'season',
  'showtitle',
  'thumbnail',
  'title',
  'track'
] as const satisfies readonly PlaylistItemPropertyName[];

export class QueueStore {
  #snapshot = $state<QueueStoreSnapshot>(cloneQueueStoreSnapshot(DEFAULT_SNAPSHOT));
  #playableItems = $state<QueuePlayableItemSnapshot[]>([]);

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #playerStore: QueueStorePlayerStore;
  readonly #notificationSource: QueueStoreNotificationSource | null;
  readonly #now: () => string;

  #requestId = 0;
  #unsubscribeNotifications: (() => void) | null = null;

  constructor(options: QueueStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#playerStore = options.playerStore ?? defaultPlayerStore;
    this.#notificationSource = Object.prototype.hasOwnProperty.call(options, 'notificationSource')
      ? (options.notificationSource ?? null)
      : defaultConnectionStore;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): QueueStoreSnapshot {
    return cloneQueueStoreSnapshot(this.#snapshot);
  }

  getPlayableItems(): QueuePlayableItemSnapshot[] {
    return this.#playableItems.map((item) => ({ ...item }));
  }

  async refresh(reason: QueueRefreshReason = 'manual'): Promise<void> {
    const requestId = ++this.#requestId;
    const activeQueue = normalizeActiveQueue(this.#playerStore.snapshot.queue);

    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      playlistid: activeQueue.playlistid,
      activePosition: activeQueue.activePosition,
      lastRefreshReason: reason,
      lastError: null
    };

    if (activeQueue.playlistid === null) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = {
        refreshStatus: 'ready',
        playlistid: null,
        activePosition: null,
        items: [],
        limits: { ...DEFAULT_LIMITS },
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        lastError: null
      };
      this.#playableItems = [];
      return;
    }

    try {
      const client = this.#resolveClient();
      const result = await getPlaylistItems(client, {
        playlistid: activeQueue.playlistid,
        limits: { start: 0, end: 1000 },
        properties: DEFAULT_PLAYLIST_PROPERTIES
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = {
        refreshStatus: 'ready',
        playlistid: activeQueue.playlistid,
        activePosition: activeQueue.activePosition,
        items: normalizeItems(result.items),
        limits: normalizeLimits(result.limits, result.items),
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        lastError: null
      };
      this.#playableItems = normalizePlayableItems(result.items);
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        playlistid: activeQueue.playlistid,
        activePosition: activeQueue.activePosition,
        lastRefreshReason: reason,
        lastUpdatedAt: this.#now(),
        lastError: createSafeError(error)
      };
    }
  }

  startNotificationRefresh(): boolean {
    if (this.#unsubscribeNotifications || !this.#notificationSource) {
      return false;
    }

    this.#unsubscribeNotifications = this.#notificationSource.subscribeToNotifications(
      (notification) => {
        if (!isQueueRefreshNotification(notification)) {
          return;
        }

        void this.refresh(`notification:${notification.method}`);
      }
    );

    return true;
  }

  stopNotificationRefresh(): void {
    this.#unsubscribeNotifications?.();
    this.#unsubscribeNotifications = null;
  }

  destroy(): void {
    this.#requestId += 1;
    this.stopNotificationRefresh();
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new QueueClientError(
        'client/no-active-host',
        'Kodi HTTP client is not configured for queue refresh.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export class QueueDispatch {
  #snapshot = $state<QueueDispatchSnapshot>({ ...DEFAULT_DISPATCH_SNAPSHOT });

  readonly #queueStore: QueueDispatchQueueStore;
  readonly #playerStore: QueueDispatchPlayerStore;
  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;

  constructor(options: QueueDispatchOptions = {}) {
    this.#queueStore = options.queueStore ?? queueStore;
    this.#playerStore = options.playerStore ?? defaultPlayerStore;
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): QueueDispatchSnapshot {
    return cloneDispatchSnapshot(this.#snapshot);
  }

  removeAt(position: number): Promise<void> {
    return this.#runCommand({
      command: 'removeAt',
      validate: (state) => validateQueuePosition(position, state.itemCount),
      execute: (client, state) => removePlaylistItem(client, state.playlistid, position)
    });
  }

  clear(): Promise<void> {
    return this.#runCommand({
      command: 'clear',
      execute: (client, state) => clearPlaylist(client, state.playlistid)
    });
  }

  swap(position1: number, position2: number): Promise<void> {
    return this.#runCommand({
      command: 'swap',
      validate: (state) => {
        const firstError = validateQueuePosition(position1, state.itemCount);
        if (firstError) {
          return firstError;
        }

        const secondError = validateQueuePosition(position2, state.itemCount);
        if (secondError) {
          return secondError;
        }

        return position1 === position2
          ? createQueueInputError(
              'input/identical-positions',
              'Choose two different queue positions to reorder.'
            )
          : null;
      },
      execute: (client, state) => swapPlaylistItems(client, state.playlistid, position1, position2)
    });
  }

  queueMusicItem(item: MusicQueueItem): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueMusicItem',
      prepare: () => normalizeMusicQueueItem(item),
      execute: (client, prepared) => addMusicPlaylistItem(client, prepared)
    });
  }

  queueMovieItem(item: MovieQueueItem): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueMovieItem',
      prepare: () => normalizeMovieQueueItem(item),
      execute: (client, prepared) => addMoviePlaylistItem(client, prepared)
    });
  }

  queueEpisodeItem(item: EpisodeQueueItem): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueEpisodeItem',
      prepare: () => normalizeEpisodeQueueItem(item),
      execute: (client, prepared) => addEpisodePlaylistItem(client, prepared)
    });
  }

  queueMusicVideoItem(item: MusicVideoQueueItem): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueMusicVideoItem',
      prepare: () => normalizeMusicVideoQueueItem(item),
      execute: (client, prepared) => addMusicVideoPlaylistItem(client, prepared)
    });
  }

  queueLibraryItems(items: readonly LibraryQueueItem[]): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueLibraryItems',
      prepare: () => normalizeQueueItems(items, normalizeLibraryQueueItem),
      execute: (client, prepared) => addNormalizedLibraryQueueItems(client, prepared)
    });
  }

  queueFileItem(item: FileQueueItem): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueFileItem',
      prepare: () => normalizedResultValue(normalizeFileQueueItem(item)),
      execute: (client, prepared) => addFilePlaylistItem(client, prepared.playlistid, prepared.item)
    });
  }

  queueFileItems(items: readonly FileQueueItem[]): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queueFileItems',
      prepare: () => normalizeQueueItemValues(items, normalizeFileQueueItem),
      execute: (client, prepared) => addNormalizedFileQueueItems(client, prepared)
    });
  }

  queuePlaylistItem(item: PlaylistQueueItem): Promise<void> {
    return this.#runPreparedCommand({
      command: 'queuePlaylistItem',
      prepare: () => normalizedResultValue(normalizePlaylistQueueItem(item)),
      execute: (client, prepared) => addPlaylistFileItem(client, prepared.playlistid, prepared.item)
    });
  }

  async #runCommand(input: {
    command: QueueCommandName;
    validate?: (state: {
      playlistid: number;
      itemCount: number;
    }) => QueueDispatchSafeErrorSnapshot | null;
    execute: (
      client: KodiJsonRpcHttpClient,
      state: { playlistid: number; itemCount: number }
    ) => Promise<unknown>;
  }): Promise<void> {
    return this.#runPreparedCommand({
      command: input.command,
      prepare: () => {
        const state = this.#resolveQueueState();
        if (!state.ok) {
          return state;
        }

        const validationError = input.validate?.(state.value) ?? null;
        return validationError ? { ok: false, error: validationError } : state;
      },
      execute: input.execute
    });
  }

  async #runPreparedCommand<TPrepared>(input: {
    command: QueueCommandName;
    prepare: () =>
      | { ok: true; item: TPrepared }
      | { ok: true; value: TPrepared }
      | { ok: false; error: QueueDispatchSafeErrorSnapshot };
    execute: (client: KodiJsonRpcHttpClient, prepared: TPrepared) => Promise<unknown>;
  }): Promise<void> {
    if (this.#snapshot.commandStatus === 'running') {
      this.#failCommand(
        input.command,
        createQueueCommandError(
          'command/already-running',
          'Wait for the current queue command to finish before trying another action.'
        )
      );
      return;
    }

    this.#startCommand(input.command);

    const prepared = input.prepare();
    if (!prepared.ok) {
      this.#failCommand(input.command, prepared.error);
      return;
    }

    const preparedValue = 'item' in prepared ? prepared.item : prepared.value;

    const clientResult = this.#resolveClient();
    if (!clientResult.ok) {
      this.#failCommand(input.command, clientResult.error);
      return;
    }

    let commandError: QueueDispatchSafeErrorSnapshot | null = null;

    try {
      await input.execute(clientResult.client, preparedValue);
    } catch (error) {
      commandError = createDispatchSafeError(error);
    }

    await this.#refreshAfterCommand(input.command);

    if (commandError) {
      this.#failCommand(input.command, commandError);
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastCommand: input.command,
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  async #refreshAfterCommand(command: QueueCommandName): Promise<void> {
    try {
      await this.#queueStore.refresh(`command:${command}`);
    } catch {
      // QueueStore owns refresh failure diagnostics; preserve command status here.
    }

    try {
      await this.#playerStore.refresh(`command:${command}`);
    } catch {
      // PlayerStore owns refresh failure diagnostics; preserve command status here.
    }
  }

  #startCommand(command: QueueCommandName): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'running',
      lastCommand: command,
      lastError: null
    };
  }

  #failCommand(command: QueueCommandName, error: QueueDispatchSafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'error',
      lastCommand: command,
      lastError: cloneDispatchError(error),
      lastCompletedAt: this.#now()
    };
  }

  #resolveQueueState():
    | { ok: true; value: { playlistid: number; itemCount: number } }
    | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
    const snapshot = this.#queueStore.snapshot;

    if (typeof snapshot.playlistid !== 'number' || !Number.isFinite(snapshot.playlistid)) {
      return {
        ok: false,
        error: {
          source: 'queue',
          code: 'queue/no-active-playlist',
          message: 'No active Kodi playlist is available for this queue action.'
        }
      };
    }

    return {
      ok: true,
      value: {
        playlistid: snapshot.playlistid,
        itemCount: Array.isArray(snapshot.items) ? snapshot.items.length : 0
      }
    };
  }

  #resolveClient():
    | { ok: true; client: KodiJsonRpcHttpClient }
    | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
    try {
      const client = this.#client ?? this.#createClient();
      if (!client) {
        return {
          ok: false,
          error: {
            source: 'config',
            code: 'config/no-active-host',
            message: 'Choose an active Kodi host before editing the queue.'
          }
        };
      }

      return { ok: true, client };
    } catch (error) {
      return { ok: false, error: createDispatchSafeError(error) };
    }
  }
}

function validateQueuePosition(
  position: number,
  itemCount: number
): QueueDispatchSafeErrorSnapshot | null {
  return Number.isInteger(position) && position >= 0 && position < itemCount
    ? null
    : createQueueInputError(
        'input/invalid-position',
        'Choose a valid queue position from the current playlist.'
      );
}

function normalizeMusicQueueItem(
  item: unknown
): { ok: true; item: KodiMusicLibraryItem } | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (!isRecord(item)) {
    return { ok: false, error: createInvalidMusicItemError() };
  }

  const idKeys = ['songid', 'albumid', 'artistid'].filter((key) =>
    Object.prototype.hasOwnProperty.call(item, key)
  );

  if (idKeys.length !== 1 || Object.prototype.hasOwnProperty.call(item, 'file')) {
    return { ok: false, error: createInvalidMusicItemError() };
  }

  const idKey = idKeys[0];
  const idValue = item[idKey];
  if (!isPositiveInteger(idValue)) {
    return { ok: false, error: createInvalidMusicItemError() };
  }

  if (idKey === 'songid') {
    return { ok: true, item: { songid: idValue } };
  }

  if (idKey === 'albumid') {
    return { ok: true, item: { albumid: idValue } };
  }

  return { ok: true, item: { artistid: idValue } };
}

function normalizeMovieQueueItem(
  item: unknown
): { ok: true; item: KodiMovieLibraryItem } | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (!isRecord(item)) {
    return { ok: false, error: createInvalidMovieItemError() };
  }

  const keys = Object.keys(item).sort();

  if (keys.length === 1 && keys[0] === 'movieid' && isPositiveSafeInteger(item.movieid)) {
    return { ok: true, item: { movieid: item.movieid } };
  }

  return { ok: false, error: createInvalidMovieItemError() };
}

function normalizeEpisodeQueueItem(
  item: unknown
):
  | { ok: true; item: KodiEpisodeLibraryItem }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (!isRecord(item)) {
    return { ok: false, error: createInvalidEpisodeItemError() };
  }

  const keys = Object.keys(item).sort();

  if (keys.length === 1 && keys[0] === 'episodeid' && isPositiveSafeInteger(item.episodeid)) {
    return { ok: true, item: { episodeid: item.episodeid } };
  }

  return { ok: false, error: createInvalidEpisodeItemError() };
}

function normalizeMusicVideoQueueItem(
  item: unknown
):
  | { ok: true; item: KodiMusicVideoLibraryItem }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (!isRecord(item)) {
    return { ok: false, error: createInvalidMusicVideoItemError() };
  }

  const keys = Object.keys(item).sort();

  if (keys.length === 1 && keys[0] === 'musicvideoid' && isPositiveSafeInteger(item.musicvideoid)) {
    return { ok: true, item: { musicvideoid: item.musicvideoid } };
  }

  return { ok: false, error: createInvalidMusicVideoItemError() };
}

type NormalizedLibraryQueueItem =
  | { media: 'music'; item: KodiMusicLibraryItem }
  | { media: 'movie'; item: KodiMovieLibraryItem }
  | { media: 'episode'; item: KodiEpisodeLibraryItem }
  | { media: 'musicvideo'; item: KodiMusicVideoLibraryItem };

function normalizeQueueItems<TInput, TItem>(
  items: readonly TInput[],
  normalize: (
    item: TInput
  ) => { ok: true; item: TItem } | { ok: false; error: QueueDispatchSafeErrorSnapshot }
): { ok: true; item: TItem[] } | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  const normalized: TItem[] = [];
  for (const item of items) {
    const result = normalize(item);
    if (!result.ok) {
      return result;
    }
    normalized.push(result.item);
  }
  return { ok: true, item: normalized };
}

function normalizeQueueItemValues<TInput, TValue>(
  items: readonly TInput[],
  normalize: (
    item: TInput
  ) => ({ ok: true } & TValue) | { ok: false; error: QueueDispatchSafeErrorSnapshot }
): { ok: true; value: TValue[] } | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  const normalized: TValue[] = [];
  for (const item of items) {
    const result = normalize(item);
    if (!result.ok) {
      return result;
    }
    normalized.push(result);
  }
  return { ok: true, value: normalized };
}

function normalizedResultValue<TValue>(
  result: ({ ok: true } & TValue) | { ok: false; error: QueueDispatchSafeErrorSnapshot }
):
  | { ok: true; value: { ok: true } & TValue }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  return result.ok ? { ok: true, value: result } : result;
}

function normalizeLibraryQueueItem(
  item: LibraryQueueItem
):
  | { ok: true; item: NormalizedLibraryQueueItem }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (item.media === 'music') {
    const result = normalizeMusicQueueItem(item.item);
    return result.ok ? { ok: true, item: { media: 'music', item: result.item } } : result;
  }

  if (item.media === 'movie') {
    const result = normalizeMovieQueueItem(item.item);
    return result.ok ? { ok: true, item: { media: 'movie', item: result.item } } : result;
  }

  if (item.media === 'episode') {
    const result = normalizeEpisodeQueueItem(item.item);
    return result.ok ? { ok: true, item: { media: 'episode', item: result.item } } : result;
  }

  const result = normalizeMusicVideoQueueItem(item.item);
  return result.ok ? { ok: true, item: { media: 'musicvideo', item: result.item } } : result;
}

async function addNormalizedLibraryQueueItems(
  client: KodiJsonRpcHttpClient,
  items: readonly NormalizedLibraryQueueItem[]
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  if (client.callBatch) {
    await client.callBatch(items.map(playlistAddBatchCallForLibraryItem));
    return;
  }

  for (const item of items) {
    await addNormalizedLibraryQueueItem(client, item);
  }
}

function playlistAddBatchCallForLibraryItem(
  item: NormalizedLibraryQueueItem
): KodiJsonRpcBatchCall {
  return {
    method: 'Playlist.Add',
    params: {
      playlistid: item.media === 'music' ? 0 : 1,
      item: item.item
    }
  };
}

async function addNormalizedLibraryQueueItem(
  client: KodiJsonRpcHttpClient,
  item: NormalizedLibraryQueueItem
): Promise<void> {
  if (item.media === 'music') {
    await addMusicPlaylistItem(client, item.item);
    return;
  }

  if (item.media === 'movie') {
    await addMoviePlaylistItem(client, item.item);
    return;
  }

  if (item.media === 'episode') {
    await addEpisodePlaylistItem(client, item.item);
    return;
  }

  await addMusicVideoPlaylistItem(client, item.item);
}

function normalizeFileQueueItem(
  item: unknown
):
  | { ok: true; playlistid: number; item: { file: string } | { directory: string } }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (!isRecord(item)) {
    return { ok: false, error: createInvalidFileItemError() };
  }

  const keys = Object.keys(item).sort();

  if (
    (keys.length === 2 || keys.length === 3) &&
    keys[0] === 'file' &&
    (keys.length === 2 || keys[1] === 'itemType') &&
    keys[keys.length - 1] === 'mediaKind' &&
    typeof item.file === 'string' &&
    item.file.trim().length > 0 &&
    (item.mediaKind === 'audio' || item.mediaKind === 'video') &&
    (keys.length === 2 || item.itemType === 'file' || item.itemType === 'directory')
  ) {
    return {
      ok: true,
      playlistid: item.mediaKind === 'video' ? 1 : 0,
      item: item.itemType === 'directory' ? { directory: item.file } : { file: item.file }
    };
  }

  return { ok: false, error: createInvalidFileItemError() };
}

type NormalizedFileQueueItem = {
  playlistid: number;
  item: { file: string } | { directory: string };
};

async function addNormalizedFileQueueItems(
  client: KodiJsonRpcHttpClient,
  items: readonly NormalizedFileQueueItem[]
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  if (client.callBatch) {
    await client.callBatch(items.map(playlistAddBatchCallForFileItem));
    return;
  }

  for (const item of items) {
    await addFilePlaylistItem(client, item.playlistid, item.item);
  }
}

function playlistAddBatchCallForFileItem(item: NormalizedFileQueueItem): KodiJsonRpcBatchCall {
  return {
    method: 'Playlist.Add',
    params: {
      playlistid: item.playlistid,
      item: item.item
    }
  };
}

function normalizePlaylistQueueItem(
  item: unknown
):
  | { ok: true; playlistid: number; item: { file: string } }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  if (!isRecord(item)) {
    return { ok: false, error: createInvalidPlaylistItemError() };
  }

  const keys = Object.keys(item).sort();

  if (
    keys.length === 3 &&
    keys[0] === 'file' &&
    keys[1] === 'mediaKind' &&
    keys[2] === 'playlistKind' &&
    typeof item.file === 'string' &&
    item.file.trim().length > 0 &&
    (item.mediaKind === 'music' || item.mediaKind === 'video') &&
    (item.playlistKind === 'smart' || item.playlistKind === 'basic')
  ) {
    return { ok: true, playlistid: item.mediaKind === 'video' ? 1 : 0, item: { file: item.file } };
  }

  return { ok: false, error: createInvalidPlaylistItemError() };
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value > 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function createInvalidMusicItemError(): QueueDispatchSafeErrorSnapshot {
  return createQueueInputError(
    'input/invalid-music-item',
    'Choose a valid song, album, or artist to add to the queue.'
  );
}

function createInvalidMovieItemError(): QueueDispatchSafeErrorSnapshot {
  return createQueueInputError(
    'input/invalid-movie-item',
    'Choose a valid movie to add to the queue.'
  );
}

function createInvalidEpisodeItemError(): QueueDispatchSafeErrorSnapshot {
  return createQueueInputError(
    'input/invalid-episode-item',
    'Choose a valid episode to add to the queue.'
  );
}

function createInvalidMusicVideoItemError(): QueueDispatchSafeErrorSnapshot {
  return createQueueInputError(
    'input/invalid-music-video-item',
    'Choose a valid music video to add to the queue.'
  );
}

function createInvalidFileItemError(): QueueDispatchSafeErrorSnapshot {
  return createQueueInputError(
    'input/invalid-file-item',
    'Choose a supported audio file to queue.'
  );
}

function createInvalidPlaylistItemError(): QueueDispatchSafeErrorSnapshot {
  return createQueueInputError(
    'input/invalid-playlist-item',
    'Choose a supported music smart playlist to queue.'
  );
}

function createQueueInputError(code: string, message: string): QueueDispatchSafeErrorSnapshot {
  return { source: 'input', code, message };
}

function createQueueCommandError(code: string, message: string): QueueDispatchSafeErrorSnapshot {
  return { source: 'command', code, message };
}

function createDispatchSafeError(error: unknown): QueueDispatchSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  return {
    source: 'command',
    code: 'command/failed',
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Kodi queue command failed.'
    )
  };
}

function cloneDispatchSnapshot(snapshot: QueueDispatchSnapshot): QueueDispatchSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError ? cloneDispatchError(snapshot.lastError) : null
  };
}

function cloneDispatchError(error: QueueDispatchSafeErrorSnapshot): QueueDispatchSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createQueueStore(options: QueueStoreOptions = {}): QueueStore {
  return new QueueStore(options);
}

export function createQueueDispatch(options: QueueDispatchOptions = {}): QueueDispatch {
  return new QueueDispatch(options);
}

export const queueStore = createQueueStore({ createClient: createActiveKodiJsonRpcHttpClient });
export const queueDispatch = createQueueDispatch({
  createClient: createActiveKodiJsonRpcHttpClient,
  playerStore: defaultPlayerStore,
  queueStore
});
