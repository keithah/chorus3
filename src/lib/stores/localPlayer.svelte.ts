import {
  describeKodiEndpoint,
  isKodiHttpClientError,
  prepareFileDownload,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import type { PlayerItem } from '$lib/kodi';

import { savedKodiHostToKodiHttpHost } from './kodiClient';
import type { SavedKodiHost } from './config.svelte';

export type LocalPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
export type LocalMediaKind = 'audio' | 'video' | 'unknown';

export interface LocalPlayerErrorSnapshot {
  code: string;
  message: string;
}

export type LocalPlayerItemSnapshot = Pick<PlayerItem, 'id' | 'label' | 'title' | 'type'> &
  Partial<{
    songid: number;
    movieid: number;
    episodeid: number;
  }>;

export interface LocalPlayerStoreSnapshot {
  status: LocalPlaybackStatus;
  mediaKind: LocalMediaKind;
  item: LocalPlayerItemSnapshot | null;
  currentSeconds: number;
  durationSeconds: number | null;
  volume: number;
  muted: boolean;
  lastError: LocalPlayerErrorSnapshot | null;
  kodiPausedForLocal: boolean;
  resumeAvailable: boolean;
  lastUpdatedAt: string | null;
}

export interface MediaElementAdapter {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  volume: number;
  muted: boolean;

  play(): Promise<void>;
  pause(): void;
  load(): void;

  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export type LocalPlaybackProgressReason = `local:${string}`;

export interface LocalPlayerProgressEvaluator {
  evaluateAndWrite(reason: LocalPlaybackProgressReason): Promise<void> | void;
}

export interface LocalPlayerStoreOptions {
  now?: () => string;
  playbackProgressEvaluator?: LocalPlayerProgressEvaluator | null;
}

export type PrepareLocalStreamUrlOptions = {
  client: KodiJsonRpcHttpClient;
  file: string;
  activeHost: SavedKodiHost | null;
};

const DEFAULT_SNAPSHOT: LocalPlayerStoreSnapshot = {
  status: 'idle',
  mediaKind: 'unknown',
  item: null,
  currentSeconds: 0,
  durationSeconds: null,
  volume: 100,
  muted: false,
  lastError: null,
  kodiPausedForLocal: false,
  resumeAvailable: false,
  lastUpdatedAt: null
};

type LoadAndPlayInput = {
  source: string;
  item: LocalPlayerItemSnapshot;
  mediaKind: LocalMediaKind;
  kodiWasPaused: boolean;
};

export class LocalPlayerStore {
  #snapshot = $state<LocalPlayerStoreSnapshot>({ ...DEFAULT_SNAPSHOT });

  readonly #now: () => string;

  #adapter: MediaElementAdapter | null = null;
  #detachListeners: (() => void) | null = null;
  #playbackProgressEvaluator: LocalPlayerProgressEvaluator | null;

  constructor(options: LocalPlayerStoreOptions = {}) {
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#playbackProgressEvaluator = options.playbackProgressEvaluator ?? null;
  }

  get snapshot(): LocalPlayerStoreSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  setPlaybackProgressEvaluator(evaluator: LocalPlayerProgressEvaluator | null): void {
    this.#playbackProgressEvaluator = evaluator;
  }

  attach(adapter: MediaElementAdapter): void {
    this.detach();

    this.#adapter = adapter;
    this.#snapshot = {
      ...this.#snapshot,
      volume: normalizeVolume(adapter.volume),
      muted: Boolean(adapter.muted)
    };

    const onPlay = () => {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'playing',
        lastError: null,
        lastUpdatedAt: this.#now()
      };
    };

    const onPause = () => {
      this.#snapshot = {
        ...this.#snapshot,
        status:
          this.#snapshot.status === 'playing' || this.#snapshot.status === 'loading'
            ? 'paused'
            : this.#snapshot.status,
        currentSeconds: normalizeSeconds(adapter.currentTime),
        lastUpdatedAt: this.#now()
      };
    };

    const onCanPlay = () => {
      this.#snapshot = {
        ...this.#snapshot,
        status: this.#snapshot.status === 'loading' ? 'playing' : this.#snapshot.status,
        durationSeconds: normalizeDuration(adapter.duration),
        currentSeconds: normalizeSeconds(adapter.currentTime),
        lastUpdatedAt: this.#now()
      };
    };

    const onTimeUpdate = () => {
      this.#snapshot = {
        ...this.#snapshot,
        currentSeconds: normalizeSeconds(adapter.currentTime),
        lastUpdatedAt: this.#now()
      };
      this.#evaluatePlaybackProgress('local:timeupdate');
    };

    const onDurationChange = () => {
      this.#snapshot = {
        ...this.#snapshot,
        durationSeconds: normalizeDuration(adapter.duration),
        currentSeconds: normalizeSeconds(adapter.currentTime),
        lastUpdatedAt: this.#now()
      };
    };

    const onVolumeChange = () => {
      this.#snapshot = {
        ...this.#snapshot,
        volume: normalizeVolume(adapter.volume),
        muted: Boolean(adapter.muted),
        lastUpdatedAt: this.#now()
      };
    };

    const onEnded = () => {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'ended',
        currentSeconds: normalizeSeconds(adapter.currentTime),
        lastUpdatedAt: this.#now()
      };
      this.#evaluatePlaybackProgress('local:ended');
    };

    const onError = () => {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'error',
        lastError: {
          code: 'media/error',
          message: 'Local media playback encountered an error.'
        },
        lastUpdatedAt: this.#now()
      };
    };

    adapter.addEventListener('play', onPlay);
    adapter.addEventListener('pause', onPause);
    adapter.addEventListener('canplay', onCanPlay);
    adapter.addEventListener('loadedmetadata', onDurationChange);
    adapter.addEventListener('timeupdate', onTimeUpdate);
    adapter.addEventListener('durationchange', onDurationChange);
    adapter.addEventListener('seeked', onTimeUpdate);
    adapter.addEventListener('volumechange', onVolumeChange);
    adapter.addEventListener('ended', onEnded);
    adapter.addEventListener('error', onError);

    this.#detachListeners = () => {
      adapter.removeEventListener('play', onPlay);
      adapter.removeEventListener('pause', onPause);
      adapter.removeEventListener('canplay', onCanPlay);
      adapter.removeEventListener('loadedmetadata', onDurationChange);
      adapter.removeEventListener('timeupdate', onTimeUpdate);
      adapter.removeEventListener('durationchange', onDurationChange);
      adapter.removeEventListener('seeked', onTimeUpdate);
      adapter.removeEventListener('volumechange', onVolumeChange);
      adapter.removeEventListener('ended', onEnded);
      adapter.removeEventListener('error', onError);
    };
  }

  detach(): void {
    this.#detachListeners?.();
    this.#detachListeners = null;
    this.#adapter = null;
  }

  async loadAndPlay(input: LoadAndPlayInput): Promise<void> {
    const adapter = this.#adapter;

    if (!adapter) {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'error',
        lastError: {
          code: 'media/no-adapter',
          message: 'Local playback is not attached to a media element.'
        },
        resumeAvailable: Boolean(input.kodiWasPaused),
        kodiPausedForLocal: Boolean(input.kodiWasPaused),
        lastUpdatedAt: this.#now()
      };
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      status: 'loading',
      mediaKind: input.mediaKind,
      item: cloneItemSnapshot(input.item),
      currentSeconds: 0,
      durationSeconds: normalizeDuration(adapter.duration),
      volume: normalizeVolume(adapter.volume),
      muted: Boolean(adapter.muted),
      lastError: null,
      kodiPausedForLocal: Boolean(input.kodiWasPaused),
      resumeAvailable: Boolean(input.kodiWasPaused),
      lastUpdatedAt: this.#now()
    };

    adapter.src = sanitizeMediaSource(input.source);
    adapter.load();

    try {
      await adapter.play();
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'error',
        lastError: {
          code: 'media/play-rejected',
          message: sanitizeErrorMessage(
            error instanceof Error ? error.message : 'Local playback could not start.'
          )
        },
        lastUpdatedAt: this.#now()
      };
      return;
    }
  }

  pause(): void {
    const adapter = this.#adapter;
    adapter?.pause();

    this.#snapshot = {
      ...this.#snapshot,
      status:
        this.#snapshot.status === 'playing' || this.#snapshot.status === 'loading'
          ? 'paused'
          : this.#snapshot.status,
      lastUpdatedAt: this.#now()
    };
  }

  stop(): void {
    const adapter = this.#adapter;
    if (adapter) {
      adapter.pause();
      adapter.src = '';
      adapter.load();
    }

    this.#snapshot = {
      ...DEFAULT_SNAPSHOT,
      lastUpdatedAt: this.#now()
    };
  }

  async togglePlayPause(): Promise<void> {
    const adapter = this.#adapter;

    if (!adapter) {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'error',
        lastError: {
          code: 'media/no-adapter',
          message: 'Local playback is not attached to a media element.'
        },
        lastUpdatedAt: this.#now()
      };
      return;
    }

    if (adapter.paused) {
      try {
        await adapter.play();
        this.#snapshot = {
          ...this.#snapshot,
          status: 'playing',
          lastError: null,
          lastUpdatedAt: this.#now()
        };
      } catch (error) {
        this.#snapshot = {
          ...this.#snapshot,
          status: 'error',
          lastError: {
            code: 'media/play-rejected',
            message: sanitizeErrorMessage(
              error instanceof Error ? error.message : 'Local playback could not start.'
            )
          },
          lastUpdatedAt: this.#now()
        };
      }

      return;
    }

    adapter.pause();

    this.#snapshot = {
      ...this.#snapshot,
      status: 'paused',
      lastUpdatedAt: this.#now()
    };
  }

  seekToSeconds(seconds: number): void {
    const adapter = this.#adapter;
    if (!adapter) {
      return;
    }

    if (!Number.isFinite(seconds) || seconds < 0) {
      this.#snapshot = {
        ...this.#snapshot,
        status: 'error',
        lastError: {
          code: 'input/invalid-seek-seconds',
          message: 'Enter a valid seek time.'
        },
        lastUpdatedAt: this.#now()
      };
      return;
    }

    adapter.currentTime = seconds;

    this.#snapshot = {
      ...this.#snapshot,
      currentSeconds: seconds,
      lastUpdatedAt: this.#now()
    };
  }

  setVolume(volume: number): void {
    const adapter = this.#adapter;
    if (!adapter) {
      return;
    }

    const normalized = normalizeVolumePercentage(volume);
    adapter.volume = normalized / 100;

    this.#snapshot = {
      ...this.#snapshot,
      volume: normalized,
      lastUpdatedAt: this.#now()
    };
  }

  setMuted(muted: boolean): void {
    const adapter = this.#adapter;
    if (!adapter) {
      return;
    }

    adapter.muted = Boolean(muted);
    this.#snapshot = {
      ...this.#snapshot,
      muted: Boolean(muted),
      lastUpdatedAt: this.#now()
    };
  }

  #evaluatePlaybackProgress(reason: LocalPlaybackProgressReason): void {
    try {
      void Promise.resolve(this.#playbackProgressEvaluator?.evaluateAndWrite(reason)).catch(() => {
        // Playback progress diagnostics are owned by the evaluator. Media events must remain safe.
      });
    } catch {
      // Playback progress diagnostics are owned by the evaluator. Media events must remain safe.
    }
  }
}

function normalizeSeconds(value: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeDuration(duration: number): number | null {
  return typeof duration === 'number' && Number.isFinite(duration) && duration > 0
    ? duration
    : null;
}

function normalizeVolume(volume: number): number {
  if (typeof volume !== 'number' || !Number.isFinite(volume)) {
    return 100;
  }

  const clamped = Math.min(1, Math.max(0, volume));
  return Math.round(clamped * 100);
}

function normalizeVolumePercentage(volume: number): number {
  if (!Number.isFinite(volume)) {
    return 100;
  }

  return Math.min(100, Math.max(0, Math.round(volume)));
}

function cloneItemSnapshot(item: LocalPlayerItemSnapshot): LocalPlayerItemSnapshot {
  return {
    ...(Object.prototype.hasOwnProperty.call(item, 'id') ? { id: item.id } : {}),
    ...(Object.prototype.hasOwnProperty.call(item, 'label') ? { label: item.label } : {}),
    ...(Object.prototype.hasOwnProperty.call(item, 'title') ? { title: item.title } : {}),
    ...(Object.prototype.hasOwnProperty.call(item, 'type') ? { type: item.type } : {}),
    ...(Object.prototype.hasOwnProperty.call(item, 'songid') ? { songid: item.songid } : {}),
    ...(Object.prototype.hasOwnProperty.call(item, 'movieid') ? { movieid: item.movieid } : {}),
    ...(Object.prototype.hasOwnProperty.call(item, 'episodeid')
      ? { episodeid: item.episodeid }
      : {})
  };
}

function cloneSnapshot(snapshot: LocalPlayerStoreSnapshot): LocalPlayerStoreSnapshot {
  return {
    ...snapshot,
    item: snapshot.item ? { ...snapshot.item } : null,
    lastError: snapshot.lastError ? { ...snapshot.lastError } : null
  };
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/localStorage|sessionStorage/gi, 'browser storage');
}

function sanitizeMediaSource(source: string): string {
  try {
    const url = new URL(source);
    url.username = '';
    url.password = '';
    return url.toString();
  } catch {
    return source;
  }
}

class LocalStreamPrepareError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'LocalStreamPrepareError';
    this.code = code;
  }
}

export async function prepareLocalStreamUrl(
  options: PrepareLocalStreamUrlOptions
): Promise<string> {
  const file = options.file?.trim();

  if (!file) {
    throw new LocalStreamPrepareError(
      'input/missing-file',
      'Choose a playable item before starting local playback.'
    );
  }

  if (!options.activeHost) {
    throw new LocalStreamPrepareError(
      'config/no-active-host',
      'Choose an active Kodi host before starting local playback.'
    );
  }

  const endpoint = describeKodiEndpoint(savedKodiHostToKodiHttpHost(options.activeHost));
  const origin = `${endpoint.protocol}//${endpoint.host}:${endpoint.port}`;

  let prepared: unknown;
  try {
    prepared = await prepareFileDownload(options.client, file);
  } catch (error) {
    if (isKodiHttpClientError(error)) {
      throw error;
    }

    throw new LocalStreamPrepareError(
      'command/prepare-download-failed',
      sanitizeErrorMessage(
        error instanceof Error ? error.message : 'Kodi failed to prepare playback.'
      )
    );
  }

  const details = isRecord(prepared) ? prepared.details : undefined;
  const path = isRecord(details) && typeof details.path === 'string' ? details.path.trim() : '';

  if (!path) {
    throw new LocalStreamPrepareError(
      'command/prepare-download-missing-path',
      'Kodi did not return a playable download URL for local playback.'
    );
  }

  return sanitizePlayableUrl(path, origin);
}

function sanitizePlayableUrl(pathOrUrl: string, origin: string): string {
  const url = new URL(pathOrUrl, origin);

  url.username = '';
  url.password = '';

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createLocalPlayerStore(options: LocalPlayerStoreOptions = {}): LocalPlayerStore {
  return new LocalPlayerStore(options);
}

export const localPlayerStore = createLocalPlayerStore();
