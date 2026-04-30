import {
  KodiHttpClientError,
  isKodiHttpClientError,
  setEpisodeDetails,
  setMovieDetails,
  setSongDetails,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type KodiLibraryWriteResult,
  type VideoResumePosition
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  localPlayerStore as defaultLocalPlayerStore,
  type LocalPlayerItemSnapshot,
  type LocalPlayerStoreSnapshot
} from './localPlayer.svelte';

export type LocalLibraryItemKind = 'song' | 'movie' | 'episode';
export type LocalScrobbleAction = 'audio-scrobble' | 'video-resume' | 'video-watched';
export type LocalScrobbleNoopReason =
  | `status/${string}`
  | 'media/unsupported'
  | 'item/missing'
  | 'item/missing-songid'
  | 'item/missing-videoid'
  | 'duration/unknown'
  | 'threshold/not-crossed'
  | 'write/duplicate';
export type LocalScrobbleStatus =
  | 'idle'
  | 'evaluating'
  | 'skipped'
  | 'writing'
  | 'success'
  | 'error';
export type LocalScrobbleErrorSource = 'config' | 'http' | 'write';
export type LocalScrobbleEvaluationReason = 'manual' | `local:${string}`;

export interface LocalLibraryItemId {
  kind: LocalLibraryItemKind;
  id: number;
}

export interface LocalScrobbleResumePosition {
  position: number;
  total: number;
}

export type LocalScrobblePolicyDecision =
  | {
      shouldWrite: true;
      action: LocalScrobbleAction;
      item: LocalLibraryItemId;
      resume?: LocalScrobbleResumePosition;
    }
  | {
      shouldWrite: false;
      reason: LocalScrobbleNoopReason;
    };

export interface LocalScrobbleSafeErrorSnapshot {
  source: LocalScrobbleErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface LocalScrobbleWriteCountsSnapshot {
  audioScrobbles: number;
  videoResumes: number;
  videoWatched: number;
}

export interface LocalScrobbleStoreSnapshot {
  status: LocalScrobbleStatus;
  lastAction: LocalScrobbleAction | null;
  lastError: LocalScrobbleSafeErrorSnapshot | null;
  lastWriteAt: string | null;
  lastEvaluationReason: LocalScrobbleEvaluationReason | null;
  lastPolicyReason: LocalScrobbleAction | LocalScrobbleNoopReason | null;
  lastItem: LocalLibraryItemId | null;
  writeCounts: LocalScrobbleWriteCountsSnapshot;
}

export interface LocalScrobbleLocalPlayerSource {
  readonly snapshot: LocalPlayerStoreSnapshot;
}

export interface LocalScrobbleWriteMethods {
  setSongDetails(
    client: KodiJsonRpcHttpClient,
    params: { songid: number; playcount?: number; lastplayed?: string }
  ): Promise<KodiLibraryWriteResult>;
  setMovieDetails(
    client: KodiJsonRpcHttpClient,
    params: {
      movieid: number;
      playcount?: number;
      lastplayed?: string;
      resume?: VideoResumePosition;
    }
  ): Promise<KodiLibraryWriteResult>;
  setEpisodeDetails(
    client: KodiJsonRpcHttpClient,
    params: {
      episodeid: number;
      playcount?: number;
      lastplayed?: string;
      resume?: VideoResumePosition;
    }
  ): Promise<KodiLibraryWriteResult>;
}

export interface LocalScrobbleStoreOptions {
  localPlayerStore?: LocalScrobbleLocalPlayerSource;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
  writeMethods?: LocalScrobbleWriteMethods;
}

export interface LocalPlaybackProgressEvaluator {
  evaluateAndWrite(reason?: LocalScrobbleEvaluationReason): Promise<void> | void;
}

export interface EvaluateLocalPlaybackProgressOptions {
  scrobbleStore?: LocalPlaybackProgressEvaluator;
  reason?: LocalScrobbleEvaluationReason;
}

const AUDIO_MINIMUM_SECONDS = 240;
const AUDIO_FRACTION = 0.5;
const VIDEO_RESUME_MINIMUM_SECONDS = 30;
const VIDEO_WATCHED_FRACTION = 0.9;
const DEFAULT_WRITE_COUNTS: LocalScrobbleWriteCountsSnapshot = {
  audioScrobbles: 0,
  videoResumes: 0,
  videoWatched: 0
};
const DEFAULT_SNAPSHOT: LocalScrobbleStoreSnapshot = {
  status: 'idle',
  lastAction: null,
  lastError: null,
  lastWriteAt: null,
  lastEvaluationReason: null,
  lastPolicyReason: null,
  lastItem: null,
  writeCounts: DEFAULT_WRITE_COUNTS
};

const DEFAULT_WRITE_METHODS: LocalScrobbleWriteMethods = {
  setSongDetails,
  setMovieDetails,
  setEpisodeDetails
};

export class LocalScrobbleStore {
  #snapshot = $state<LocalScrobbleStoreSnapshot>(cloneStoreSnapshot(DEFAULT_SNAPSHOT));

  readonly #localPlayerStore: LocalScrobbleLocalPlayerSource;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;
  readonly #writeMethods: LocalScrobbleWriteMethods;
  readonly #completedWriteKeys = new Set<string>();

  constructor(options: LocalScrobbleStoreOptions = {}) {
    this.#localPlayerStore = options.localPlayerStore ?? defaultLocalPlayerStore;
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#writeMethods = options.writeMethods ?? DEFAULT_WRITE_METHODS;
  }

  get snapshot(): LocalScrobbleStoreSnapshot {
    return cloneStoreSnapshot(this.#snapshot);
  }

  async evaluateAndWrite(reason: LocalScrobbleEvaluationReason = 'manual'): Promise<void> {
    this.#snapshot = {
      ...this.#snapshot,
      status: 'evaluating',
      lastEvaluationReason: reason,
      lastError: null
    };

    const decision = evaluateLocalScrobblePolicy(this.#localPlayerStore.snapshot);
    if (!decision.shouldWrite) {
      this.#skip(decision.reason);
      return;
    }

    const writeKey = createWriteKey(decision);
    if (this.#completedWriteKeys.has(writeKey)) {
      this.#skip('write/duplicate', decision);
      return;
    }

    const client = this.#resolveClient();
    if (!client) {
      this.#fail({
        source: 'config',
        code: 'config/no-active-host',
        message: 'Choose an active Kodi host before writing playback progress.'
      });
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      status: 'writing',
      lastAction: decision.action,
      lastPolicyReason: decision.action,
      lastItem: cloneItemId(decision.item),
      lastError: null
    };

    try {
      await this.#writeDecision(client, decision);
    } catch (error) {
      this.#fail(createSafeError(error));
      return;
    }

    this.#completedWriteKeys.add(writeKey);
    this.#snapshot = {
      ...this.#snapshot,
      status: 'success',
      lastAction: decision.action,
      lastPolicyReason: decision.action,
      lastItem: cloneItemId(decision.item),
      lastError: null,
      lastWriteAt: this.#now(),
      writeCounts: incrementWriteCounts(this.#snapshot.writeCounts, decision.action)
    };
  }

  resetDuplicateTracking(): void {
    this.#completedWriteKeys.clear();
  }

  async #writeDecision(
    client: KodiJsonRpcHttpClient,
    decision: Extract<LocalScrobblePolicyDecision, { shouldWrite: true }>
  ): Promise<void> {
    const lastplayed = formatKodiDateTime(this.#now());

    if (decision.action === 'audio-scrobble') {
      await this.#writeMethods.setSongDetails(client, {
        songid: decision.item.id,
        playcount: 1,
        lastplayed
      });
      return;
    }

    if (decision.item.kind === 'movie') {
      await this.#writeMethods.setMovieDetails(client, {
        movieid: decision.item.id,
        ...(decision.action === 'video-watched' ? { playcount: 1, lastplayed } : {}),
        ...(decision.action === 'video-resume' && decision.resume
          ? { resume: decision.resume }
          : {})
      });
      return;
    }

    await this.#writeMethods.setEpisodeDetails(client, {
      episodeid: decision.item.id,
      ...(decision.action === 'video-watched' ? { playcount: 1, lastplayed } : {}),
      ...(decision.action === 'video-resume' && decision.resume ? { resume: decision.resume } : {})
    });
  }

  #resolveClient(): KodiJsonRpcHttpClient | null {
    try {
      return this.#createClient();
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createSafeError(error)
      };
      return null;
    }
  }

  #skip(
    reason: LocalScrobbleNoopReason,
    decision?: Extract<LocalScrobblePolicyDecision, { shouldWrite: true }>
  ): void {
    this.#snapshot = {
      ...this.#snapshot,
      status: 'skipped',
      lastAction: decision?.action ?? this.#snapshot.lastAction,
      lastPolicyReason: reason,
      lastItem: decision?.item ? cloneItemId(decision.item) : this.#snapshot.lastItem,
      lastError: null
    };
  }

  #fail(error: LocalScrobbleSafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      status: 'error',
      lastError: cloneError(error)
    };
  }
}

export function evaluateLocalScrobblePolicy(
  snapshot: LocalPlayerStoreSnapshot
): LocalScrobblePolicyDecision {
  if (snapshot.status === 'idle' || snapshot.status === 'loading' || snapshot.status === 'error') {
    return { shouldWrite: false, reason: `status/${snapshot.status}` };
  }

  if (snapshot.mediaKind !== 'audio' && snapshot.mediaKind !== 'video') {
    return { shouldWrite: false, reason: 'media/unsupported' };
  }

  if (!snapshot.item) {
    return { shouldWrite: false, reason: 'item/missing' };
  }

  return snapshot.mediaKind === 'audio'
    ? evaluateAudioPolicy(snapshot)
    : evaluateVideoPolicy(snapshot);
}

export function extractLocalLibraryItemId(
  item: LocalPlayerItemSnapshot | null
): LocalLibraryItemId | null {
  if (!item) {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const type = typeof candidate.type === 'string' ? candidate.type : '';

  const explicitSongId = finitePositiveInteger(candidate.songid);
  if (explicitSongId !== null) {
    return { kind: 'song', id: explicitSongId };
  }

  const explicitMovieId = finitePositiveInteger(candidate.movieid);
  if (explicitMovieId !== null) {
    return { kind: 'movie', id: explicitMovieId };
  }

  const explicitEpisodeId = finitePositiveInteger(candidate.episodeid);
  if (explicitEpisodeId !== null) {
    return { kind: 'episode', id: explicitEpisodeId };
  }

  const genericId = finitePositiveInteger(candidate.id);
  if (genericId === null) {
    return null;
  }

  if (type === 'song') {
    return { kind: 'song', id: genericId };
  }

  if (type === 'movie') {
    return { kind: 'movie', id: genericId };
  }

  if (type === 'episode') {
    return { kind: 'episode', id: genericId };
  }

  return null;
}

function evaluateAudioPolicy(snapshot: LocalPlayerStoreSnapshot): LocalScrobblePolicyDecision {
  const item = extractLocalLibraryItemId(snapshot.item);
  if (!item || item.kind !== 'song') {
    return { shouldWrite: false, reason: 'item/missing-songid' };
  }

  if (snapshot.status === 'ended') {
    return { shouldWrite: true, action: 'audio-scrobble', item };
  }

  const duration = finitePositiveNumber(snapshot.durationSeconds);
  if (duration === null) {
    return { shouldWrite: false, reason: 'duration/unknown' };
  }

  const current = finiteNonNegativeNumber(snapshot.currentSeconds);
  const threshold = Math.max(AUDIO_MINIMUM_SECONDS, duration * AUDIO_FRACTION);

  if (current < threshold) {
    return { shouldWrite: false, reason: 'threshold/not-crossed' };
  }

  return { shouldWrite: true, action: 'audio-scrobble', item };
}

function evaluateVideoPolicy(snapshot: LocalPlayerStoreSnapshot): LocalScrobblePolicyDecision {
  const item = extractLocalLibraryItemId(snapshot.item);
  if (!item || (item.kind !== 'movie' && item.kind !== 'episode')) {
    return { shouldWrite: false, reason: 'item/missing-videoid' };
  }

  if (snapshot.status === 'ended') {
    return { shouldWrite: true, action: 'video-watched', item };
  }

  const duration = finitePositiveNumber(snapshot.durationSeconds);
  if (duration === null) {
    return { shouldWrite: false, reason: 'duration/unknown' };
  }

  const current = finiteNonNegativeNumber(snapshot.currentSeconds);
  const watchedThreshold = duration * VIDEO_WATCHED_FRACTION;

  if (current >= watchedThreshold) {
    return { shouldWrite: true, action: 'video-watched', item };
  }

  if (current < VIDEO_RESUME_MINIMUM_SECONDS) {
    return { shouldWrite: false, reason: 'threshold/not-crossed' };
  }

  return {
    shouldWrite: true,
    action: 'video-resume',
    item,
    resume: { position: current, total: duration }
  };
}

function createWriteKey(
  decision: Extract<LocalScrobblePolicyDecision, { shouldWrite: true }>
): string {
  return `${decision.action}:${decision.item.kind}:${decision.item.id}`;
}

function incrementWriteCounts(
  counts: LocalScrobbleWriteCountsSnapshot,
  action: LocalScrobbleAction
): LocalScrobbleWriteCountsSnapshot {
  return {
    audioScrobbles: counts.audioScrobbles + (action === 'audio-scrobble' ? 1 : 0),
    videoResumes: counts.videoResumes + (action === 'video-resume' ? 1 : 0),
    videoWatched: counts.videoWatched + (action === 'video-watched' ? 1 : 0)
  };
}

function createSafeError(error: unknown): LocalScrobbleSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  if (isErrorWithCode(error)) {
    return {
      source: 'write',
      code: error.code,
      message: sanitizeErrorMessage(error.message)
    };
  }

  return {
    source: 'write',
    code: 'write/failed',
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Kodi playback progress write failed.'
    )
  };
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    Object.prototype.hasOwnProperty.call(error, 'code') &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
    .replace(/\/[^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-file')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/password/gi, 'credentials');
}

function formatKodiDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '')
      .replace(/Z$/, '');
  }

  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ${pad2(
    date.getUTCHours()
  )}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function cloneStoreSnapshot(snapshot: LocalScrobbleStoreSnapshot): LocalScrobbleStoreSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null,
    lastItem: snapshot.lastItem ? cloneItemId(snapshot.lastItem) : null,
    writeCounts: { ...snapshot.writeCounts }
  };
}

function cloneError(error: LocalScrobbleSafeErrorSnapshot): LocalScrobbleSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

function cloneItemId(item: LocalLibraryItemId): LocalLibraryItemId {
  return { ...item };
}

function finitePositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function finitePositiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function finiteNonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function createLocalScrobbleStore(
  options: LocalScrobbleStoreOptions = {}
): LocalScrobbleStore {
  return new LocalScrobbleStore(options);
}

export const localScrobbleStore = createLocalScrobbleStore();
defaultLocalPlayerStore.setPlaybackProgressEvaluator(localScrobbleStore);

export async function evaluateLocalPlaybackProgress(
  options: EvaluateLocalPlaybackProgressOptions = {}
): Promise<void> {
  const evaluator = options.scrobbleStore ?? localScrobbleStore;

  try {
    await evaluator.evaluateAndWrite(options.reason ?? 'manual');
  } catch {
    // LocalScrobbleStore owns diagnostics. Do not let lifecycle evaluation interrupt playback.
  }
}
