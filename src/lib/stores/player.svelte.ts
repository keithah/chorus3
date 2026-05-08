import {
  KodiHttpClientError,
  getActivePlayers,
  getApplicationProperties,
  getPlayerItem,
  getPlayerProperties,
  isKodiHttpClientError,
  type ApplicationPropertiesResult,
  type ApplicationPropertyName,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type KodiNotification,
  type PlayerItem,
  type PlayerItemPropertyName,
  type PlayerPropertiesResult,
  type PlayerPropertyName
} from '$lib/kodi';
import {
  isPlayerStateRefreshNotification,
  isQueueRefreshNotification
} from '$lib/kodi/notifications';
import { connectionStore as defaultConnectionStore } from './connection.svelte';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type PlayerRefreshStatus = 'idle' | 'loading' | 'ready' | 'error';
export type PlayerPlaybackStatus = 'none' | 'active' | 'multiple';
export type PlayerRefreshReason =
  | 'init'
  | 'manual'
  | 'poll'
  | `notification:${string}`
  | `command:${string}`
  | `error:${string}`;
export type PlayerErrorSource = 'http' | 'client' | 'unknown';

export interface PlayerSafeErrorSnapshot {
  source: PlayerErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface PlayerApplicationSnapshot {
  volume: number | null;
  muted: boolean | null;
}

export interface PlayerQueueSnapshot {
  playlistid: number | null;
  position: number | null;
}

export interface PlayerTimeSnapshot {
  currentSeconds: number | null;
  totalSeconds: number | null;
}

export interface NormalizedActivePlayer {
  playerid: number;
  type: string;
}

export interface PlayerStoreSnapshot {
  refreshStatus: PlayerRefreshStatus;
  playbackStatus: PlayerPlaybackStatus;
  lastRefreshReason: PlayerRefreshReason;
  lastQueueRefreshReason: PlayerRefreshReason | null;
  lastUpdatedAt: string | null;
  activePlayers: NormalizedActivePlayer[];
  primaryPlayer: NormalizedActivePlayer | null;
  item: PlayerItem | null;
  properties: PlayerPropertiesResult | null;
  application: PlayerApplicationSnapshot;
  queue: PlayerQueueSnapshot;
  time: PlayerTimeSnapshot;
  lastError: PlayerSafeErrorSnapshot | null;
}

export interface PlayerStoreNotificationSource {
  subscribeToNotifications(listener: (notification: KodiNotification) => void): () => void;
}

export interface PlayerStoreTimers {
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(intervalId: unknown): void;
}

export interface PlayerStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  notificationSource?: PlayerStoreNotificationSource | null;
  now?: () => string;
  timers?: PlayerStoreTimers;
}

const DEFAULT_APPLICATION_PROPERTIES = [
  'volume',
  'muted'
] as const satisfies readonly ApplicationPropertyName[];
const DEFAULT_PLAYER_ITEM_PROPERTIES = [
  'album',
  'artist',
  'channel',
  'duration',
  'episode',
  'fanart',
  'file',
  'season',
  'showtitle',
  'streamdetails',
  'thumbnail',
  'title',
  'track'
] as const satisfies readonly PlayerItemPropertyName[];
const DEFAULT_PLAYER_PROPERTIES = [
  'audiostreams',
  'currentaudiostream',
  'currentsubtitle',
  'currentvideostream',
  'live',
  'partymode',
  'percentage',
  'playlistid',
  'position',
  'repeat',
  'shuffled',
  'speed',
  'subtitleenabled',
  'subtitles',
  'time',
  'totaltime',
  'type',
  'videostreams'
] as const satisfies readonly PlayerPropertyName[];

const DEFAULT_SNAPSHOT: PlayerStoreSnapshot = {
  refreshStatus: 'idle',
  playbackStatus: 'none',
  lastRefreshReason: 'init',
  lastQueueRefreshReason: null,
  lastUpdatedAt: null,
  activePlayers: [],
  primaryPlayer: null,
  item: null,
  properties: null,
  application: { volume: null, muted: null },
  queue: { playlistid: null, position: null },
  time: { currentSeconds: null, totalSeconds: null },
  lastError: null
};

export class PlayerStore {
  #snapshot = $state<PlayerStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #notificationSource: PlayerStoreNotificationSource | null;
  readonly #now: () => string;
  readonly #timers: PlayerStoreTimers;

  #requestId = 0;
  #pollIntervalId: unknown = null;
  #unsubscribeNotifications: (() => void) | null = null;

  constructor(options: PlayerStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#notificationSource = options.notificationSource ?? defaultConnectionStore;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#timers = options.timers ?? {
      setInterval: (callback, intervalMs) => globalThis.setInterval(callback, intervalMs),
      clearInterval: (intervalId) =>
        globalThis.clearInterval(intervalId as ReturnType<typeof setInterval>)
    };
  }

  get snapshot(): PlayerStoreSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  async refresh(reason: PlayerRefreshReason = 'manual'): Promise<void> {
    const requestId = ++this.#requestId;
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: reason,
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const activePlayersResponse = await getActivePlayers(client);
      const applicationResponse = await getApplicationProperties(
        client,
        DEFAULT_APPLICATION_PROPERTIES
      );
      const activePlayers = normalizeActivePlayers(activePlayersResponse);
      const primaryPlayer = choosePrimaryPlayer(activePlayers);

      let item: PlayerItem | null = null;
      let properties: PlayerPropertiesResult | null = null;

      if (primaryPlayer) {
        const itemResult = await getPlayerItem(
          client,
          primaryPlayer.playerid,
          DEFAULT_PLAYER_ITEM_PROPERTIES
        );
        const propertiesResult = await getPlayerProperties(
          client,
          primaryPlayer.playerid,
          DEFAULT_PLAYER_PROPERTIES
        );
        item = isRecord(itemResult.item) ? itemResult.item : null;
        properties = isRecord(propertiesResult) ? propertiesResult : null;
      }

      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = buildReadySnapshot({
        previous: this.#snapshot,
        reason,
        activePlayers,
        primaryPlayer,
        item,
        properties,
        application: applicationResponse,
        now: this.#now()
      });
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: reason,
        lastError: createSafeError(error),
        lastUpdatedAt: this.#now()
      };
    }
  }

  startNotificationRefresh(): boolean {
    if (this.#unsubscribeNotifications || !this.#notificationSource) {
      return false;
    }

    this.#unsubscribeNotifications = this.#notificationSource.subscribeToNotifications(
      (notification) => {
        if (
          !isPlayerStateRefreshNotification(notification) &&
          !isQueueRefreshNotification(notification)
        ) {
          return;
        }

        const reason = `notification:${notification.method}` as PlayerRefreshReason;
        if (isQueueRefreshNotification(notification)) {
          this.#snapshot = { ...this.#snapshot, lastQueueRefreshReason: reason };
        }
        void this.refresh(reason);
      }
    );

    return true;
  }

  stopNotificationRefresh(): void {
    this.#unsubscribeNotifications?.();
    this.#unsubscribeNotifications = null;
  }

  startPolling(intervalMs: number): boolean {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new Error('Polling interval must be greater than 0ms.');
    }

    if (this.#pollIntervalId !== null) {
      return false;
    }

    this.#pollIntervalId = this.#timers.setInterval(() => {
      void this.refresh('poll');
    }, intervalMs);
    return true;
  }

  stopPolling(): void {
    if (this.#pollIntervalId === null) {
      return;
    }

    this.#timers.clearInterval(this.#pollIntervalId);
    this.#pollIntervalId = null;
  }

  destroy(): void {
    this.#requestId += 1;
    this.stopPolling();
    this.stopNotificationRefresh();
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new Error('Kodi HTTP client is not configured for player refresh.');
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

function buildReadySnapshot(input: {
  previous: PlayerStoreSnapshot;
  reason: PlayerRefreshReason;
  activePlayers: NormalizedActivePlayer[];
  primaryPlayer: NormalizedActivePlayer | null;
  item: PlayerItem | null;
  properties: PlayerPropertiesResult | null;
  application: ApplicationPropertiesResult;
  now: string;
}): PlayerStoreSnapshot {
  const retainedPlayback = shouldRetainPreviousPlayback(input);
  const primaryPlayer = retainedPlayback ? input.previous.primaryPlayer : input.primaryPlayer;
  const item = retainedPlayback ? input.previous.item : input.item;
  const properties = retainedPlayback ? input.previous.properties : input.properties;
  const activePlayers = retainedPlayback
    ? input.previous.activePlayers.length > 0
      ? input.previous.activePlayers
      : input.previous.primaryPlayer
        ? [input.previous.primaryPlayer]
        : input.activePlayers
    : input.activePlayers;
  const queue = normalizeQueue(properties);

  return {
    refreshStatus: 'ready',
    playbackStatus:
      activePlayers.length === 0 ? 'none' : activePlayers.length === 1 ? 'active' : 'multiple',
    lastRefreshReason: input.reason,
    lastQueueRefreshReason: input.previous.lastQueueRefreshReason,
    lastUpdatedAt: input.now,
    activePlayers,
    primaryPlayer,
    item,
    properties,
    application: normalizeApplication(input.application),
    queue,
    time: normalizeTime(properties),
    lastError: null
  };
}

function shouldRetainPreviousPlayback(input: {
  previous: PlayerStoreSnapshot;
  reason: PlayerRefreshReason;
  activePlayers: NormalizedActivePlayer[];
}): boolean {
  if (input.activePlayers.length > 0 || !input.previous.primaryPlayer || !input.previous.item) {
    return false;
  }

  if (input.reason.startsWith('notification:')) {
    return true;
  }

  return input.reason === 'command:next' || input.reason === 'command:previous';
}

function normalizeActivePlayers(players: unknown): NormalizedActivePlayer[] {
  if (!Array.isArray(players)) {
    return [];
  }

  return players.filter(isRecord).flatMap((player): NormalizedActivePlayer[] => {
    const playerid = player.playerid;
    if (typeof playerid !== 'number' || !Number.isFinite(playerid)) {
      return [];
    }

    return [
      {
        playerid,
        type: typeof player.type === 'string' && player.type.length > 0 ? player.type : 'unknown'
      }
    ];
  });
}

function choosePrimaryPlayer(players: NormalizedActivePlayer[]): NormalizedActivePlayer | null {
  return [...players].sort((left, right) => left.playerid - right.playerid)[0] ?? null;
}

function normalizeApplication(application: ApplicationPropertiesResult): PlayerApplicationSnapshot {
  return {
    volume:
      typeof application.volume === 'number' && Number.isFinite(application.volume)
        ? application.volume
        : null,
    muted: typeof application.muted === 'boolean' ? application.muted : null
  };
}

function normalizeQueue(properties: PlayerPropertiesResult | null): PlayerQueueSnapshot {
  return {
    playlistid:
      typeof properties?.playlistid === 'number' && Number.isFinite(properties.playlistid)
        ? properties.playlistid
        : null,
    position:
      typeof properties?.position === 'number' && Number.isFinite(properties.position)
        ? properties.position
        : null
  };
}

function normalizeTime(properties: PlayerPropertiesResult | null): PlayerTimeSnapshot {
  return {
    currentSeconds: kodiTimeToSeconds(properties?.time),
    totalSeconds: kodiTimeToSeconds(properties?.totaltime)
  };
}

function kodiTimeToSeconds(time: unknown): number | null {
  if (!isRecord(time)) {
    return null;
  }

  const hours = numericOrZero(time.hours);
  const minutes = numericOrZero(time.minutes);
  const seconds = numericOrZero(time.seconds);
  const milliseconds = numericOrZero(time.milliseconds);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function numericOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function createSafeError(error: unknown): PlayerSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  return {
    source: 'unknown',
    code: 'refresh-failed',
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Kodi player refresh failed.'
    )
  };
}

function sanitizeErrorMessage(message: string): string {
  return message.replace(/username or password/gi, 'credentials');
}

function cloneSnapshot(snapshot: PlayerStoreSnapshot): PlayerStoreSnapshot {
  return {
    ...snapshot,
    activePlayers: snapshot.activePlayers.map((player) => ({ ...player })),
    primaryPlayer: snapshot.primaryPlayer ? { ...snapshot.primaryPlayer } : null,
    item: snapshot.item ? { ...snapshot.item } : null,
    properties: snapshot.properties ? { ...snapshot.properties } : null,
    application: { ...snapshot.application },
    queue: { ...snapshot.queue },
    time: { ...snapshot.time },
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

export function createPlayerStore(options: PlayerStoreOptions = {}): PlayerStore {
  return new PlayerStore(options);
}

export const playerStore = createPlayerStore({ createClient: createActiveKodiJsonRpcHttpClient });
