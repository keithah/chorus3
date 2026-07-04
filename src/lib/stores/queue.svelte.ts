import {
  addEpisodePlaylistItem,
  addFilePlaylistItem,
  addMoviePlaylistItem,
  addMusicVideoPlaylistItem,
  addMusicPlaylistItem,
  addPlaylistFileItem,
  clearPlaylist,
  getPlaylistItems,
  removePlaylistItem,
  swapPlaylistItems,
  type KodiJsonRpcHttpClient,
  type PlaylistGetItemsParams,
  type PlaylistItemsResult,
  type PlaylistItemPropertyName
} from '$lib/kodi';
import { isQueueRefreshNotification } from '$lib/kodi/notifications';
import { connectionStore as defaultConnectionStore } from './connection.svelte.ts';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { playerStore as defaultPlayerStore } from './player.svelte.ts';
import {
  addNormalizedFileQueueItems,
  addNormalizedLibraryQueueItems,
  cloneDispatchError,
  cloneDispatchSnapshot,
  createDispatchSafeError,
  createQueueCommandError,
  createQueueInputError,
  normalizeEpisodeQueueItem,
  normalizeFileQueueItem,
  normalizeLibraryQueueItem,
  normalizeMovieQueueItem,
  normalizeMusicQueueItem,
  normalizeMusicVideoQueueItem,
  normalizePlaylistQueueItem,
  normalizeQueueItems,
  normalizeQueueItemValues,
  normalizedResultValue,
  validateQueuePosition
} from './queueDispatchModel';
import {
  QueueClientError,
  cloneQueueStoreSnapshot,
  createSafeError,
  normalizeActiveQueue,
  normalizeItems,
  normalizeLimits,
  normalizePlayableItems
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
import { DEFAULT_FULL_LIBRARY_PAGE_SIZE, readPagedKodiLibraryList } from './pagedKodiLibrary';

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
  #notificationRefresh: Promise<void> | null = null;
  #queuedNotificationReason: QueueRefreshReason | null = null;
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
      const result = await readPagedKodiLibraryList<
        PlaylistGetItemsParams,
        'items',
        NonNullable<PlaylistItemsResult['items']>[number],
        PlaylistItemsResult
      >(
        (params) => getPlaylistItems(client, params),
        {
          playlistid: activeQueue.playlistid,
          properties: DEFAULT_PLAYLIST_PROPERTIES
        },
        'items',
        undefined,
        DEFAULT_FULL_LIBRARY_PAGE_SIZE
      );

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

        void this.#refreshFromNotification(`notification:${notification.method}`);
      }
    );

    return true;
  }

  async #refreshFromNotification(reason: QueueRefreshReason): Promise<void> {
    this.#queuedNotificationReason = reason;
    if (this.#notificationRefresh) {
      return this.#notificationRefresh;
    }

    this.#notificationRefresh = this.#drainNotificationRefreshes();
    try {
      await this.#notificationRefresh;
    } finally {
      this.#notificationRefresh = null;
    }
  }

  async #drainNotificationRefreshes(): Promise<void> {
    while (this.#queuedNotificationReason) {
      const reason = this.#queuedNotificationReason;
      this.#queuedNotificationReason = null;
      await this.refresh(reason);
    }
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
