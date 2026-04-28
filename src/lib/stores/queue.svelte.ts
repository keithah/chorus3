import {
  KodiHttpClientError,
  getPlaylistItems,
  isKodiHttpClientError,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type KodiNotification,
  type PlaylistItemPropertyName
} from '$lib/kodi';
import { isQueueRefreshNotification } from '$lib/kodi/notifications';
import { connectionStore as defaultConnectionStore } from './connection.svelte';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { playerStore as defaultPlayerStore, type PlayerStoreSnapshot } from './player.svelte';

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
    .replace(/username or password/gi, 'credentials')
    .replace(/Authorization:\s*Basic\s+[^\s]+/gi, 'Authorization credentials')
    .replace(/Basic\s+[^\s]+/gi, 'Basic credentials')
    .replace(/https?:\/\/[^\s/@:]+:[^\s/@]+@/gi, 'http://credentials@')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/password/gi, 'credentials');
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

export const queueStore = createQueueStore({ createClient: createActiveKodiJsonRpcHttpClient });
