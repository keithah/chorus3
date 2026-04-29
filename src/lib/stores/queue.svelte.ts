import {
  KodiHttpClientError,
  clearPlaylist,
  getPlaylistItems,
  isKodiHttpClientError,
  removePlaylistItem,
  swapPlaylistItems,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type KodiNotification,
  type PlaylistItemPropertyName
} from '$lib/kodi';
import { isQueueRefreshNotification } from '$lib/kodi/notifications';
import { connectionStore as defaultConnectionStore } from './connection.svelte';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { playerStore as defaultPlayerStore, type PlayerStoreSnapshot } from './player.svelte';

export type QueueCommandStatus = 'idle' | 'running' | 'success' | 'error';
export type QueueCommandName = 'removeAt' | 'clear' | 'swap';
export type QueueDispatchErrorSource = 'config' | 'queue' | 'input' | 'http' | 'command';

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
  'label',
  'season',
  'showtitle',
  'thumbnail',
  'title',
  'track',
  'type'
] as const satisfies readonly PlaylistItemPropertyName[];

export class QueueStore {
  #snapshot = $state<QueueStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));

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
    return cloneSnapshot(this.#snapshot);
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
      return;
    }

    try {
      const client = this.#resolveClient();
      const result = await getPlaylistItems(client, {
        playlistid: activeQueue.playlistid,
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

class QueueClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'QueueClientError';
    this.code = code;
  }
}

function normalizeActiveQueue(queue: PlayerStoreSnapshot['queue']): {
  playlistid: number | null;
  activePosition: number | null;
} {
  return {
    playlistid:
      typeof queue.playlistid === 'number' && Number.isFinite(queue.playlistid)
        ? queue.playlistid
        : null,
    activePosition:
      typeof queue.position === 'number' && Number.isFinite(queue.position) ? queue.position : null
  };
}

function normalizeItems(items: unknown): QueueItemSnapshot[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(isRecord).map((item, index) => normalizeItem(item, index));
}

function normalizeItem(item: Record<string, unknown>, index: number): QueueItemSnapshot {
  const title = stringValue(item.title);
  const label = stringValue(item.label) ?? title ?? `Queue item ${index + 1}`;

  return {
    position: index,
    label,
    ...(title === undefined ? {} : { title }),
    ...stringArrayField('artist', item.artist),
    ...stringField('album', item.album),
    ...numberField('duration', item.duration),
    ...numberField('episode', item.episode),
    ...numberField('season', item.season),
    ...stringField('showtitle', item.showtitle),
    ...stringField('thumbnail', item.thumbnail),
    ...numberField('track', item.track),
    ...stringField('type', item.type)
  };
}

function normalizeLimits(limits: unknown, items: unknown): QueueLimitsSnapshot {
  const fallbackTotal = Array.isArray(items) ? items.filter(isRecord).length : 0;

  if (!isRecord(limits)) {
    return { start: 0, end: fallbackTotal, total: fallbackTotal };
  }

  const start = finiteNumberOr(limits.start, 0);
  const end = finiteNumberOr(limits.end, fallbackTotal);
  const total = finiteNumberOr(limits.total, fallbackTotal);

  return { start, end, total };
}

function createSafeError(error: unknown): QueueSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  if (error instanceof QueueClientError) {
    return {
      source: 'client',
      code: error.code,
      message: sanitizeErrorMessage(error.message)
    };
  }

  return {
    source: 'unknown',
    code: 'refresh-failed',
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Kodi queue refresh failed.'
    )
  };
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/https?:\/\/[^\s/@:]+:[^\s/@]+@/gi, 'http://credentials@')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/password/gi, 'credentials');
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

    const state = this.#resolveQueueState();
    if (!state.ok) {
      this.#failCommand(input.command, state.error);
      return;
    }

    const validationError = input.validate?.(state.value) ?? null;
    if (validationError) {
      this.#failCommand(input.command, validationError);
      return;
    }

    const clientResult = this.#resolveClient();
    if (!clientResult.ok) {
      this.#failCommand(input.command, clientResult.error);
      return;
    }

    let commandError: QueueDispatchSafeErrorSnapshot | null = null;

    try {
      await input.execute(clientResult.client, state.value);
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

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, string>> {
  const normalized = stringValue(value);
  return normalized === undefined ? {} : ({ [key]: normalized } as Partial<Record<Key, string>>);
}

function stringArrayField<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, string[]>> {
  if (!Array.isArray(value)) {
    return {};
  }

  const normalized = value.filter((entry): entry is string => typeof entry === 'string');
  return normalized.length === 0 ? {} : ({ [key]: normalized } as Partial<Record<Key, string[]>>);
}

function numberField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, number>> {
  return typeof value === 'number' && Number.isFinite(value)
    ? ({ [key]: value } as Partial<Record<Key, number>>)
    : {};
}

function finiteNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cloneSnapshot(snapshot: QueueStoreSnapshot): QueueStoreSnapshot {
  return {
    ...snapshot,
    items: snapshot.items.map((item) => ({
      ...item,
      ...(item.artist ? { artist: [...item.artist] } : {})
    })),
    limits: { ...snapshot.limits },
    lastError: snapshot.lastError
      ? {
          ...snapshot.lastError,
          ...(snapshot.lastError.endpoint ? { endpoint: { ...snapshot.lastError.endpoint } } : {})
        }
      : null
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
