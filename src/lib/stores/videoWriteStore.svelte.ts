import {
  KodiHttpClientError,
  isKodiHttpClientError,
  setEpisodeDetails,
  setMovieDetails,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  executeVideoWriteTargets,
  type VideoWriteTarget,
  type VideoWriteWriteMethods
} from './videoWriteExecution';

export type { VideoWriteWriteMethods } from './videoWriteExecution';

export type VideoWriteStatus = 'idle' | 'writing' | 'success' | 'partial' | 'error';
export type VideoWriteOperation =
  | 'movie-watched'
  | 'movie-unwatched'
  | 'episode-watched'
  | 'episode-unwatched'
  | 'episodes-batch-watched'
  | 'episodes-batch-unwatched'
  | 'movie-resume'
  | 'episode-resume'
  | 'retry-failed';
export type VideoWriteFailedItemKind = 'movie' | 'episode';
export type VideoWriteErrorSource = 'validation' | 'config' | 'http' | 'write';

export interface VideoWriteSummarySnapshot {
  total: number;
  succeeded: number;
  failed: number;
}

export interface VideoWriteSafeErrorSnapshot {
  source: VideoWriteErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface VideoWriteFailedItemSnapshot {
  kind: VideoWriteFailedItemKind;
  id: number;
  label: string;
  error: VideoWriteSafeErrorSnapshot | null;
}

export interface VideoWriteCountsSnapshot {
  moviesWatched: number;
  moviesUnwatched: number;
  episodesWatched: number;
  episodesUnwatched: number;
  movieResumes: number;
  episodeResumes: number;
  retries: number;
}

export interface VideoWriteStoreSnapshot {
  status: VideoWriteStatus;
  lastOperation: VideoWriteOperation | null;
  lastUpdatedAt: string | null;
  summary: VideoWriteSummarySnapshot;
  failedItems: VideoWriteFailedItemSnapshot[];
  lastError: VideoWriteSafeErrorSnapshot | null;
  writeCounts: VideoWriteCountsSnapshot;
}

export interface VideoWriteMovieItem {
  movieid: number;
  label?: string;
}

export interface VideoWriteEpisodeItem {
  episodeid: number;
  label?: string;
}

export interface VideoWriteResumePosition {
  position: number;
  total: number;
}

export interface VideoWriteStoreOptions {
  createClient?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  now?: () => string;
  writeMethods?: VideoWriteWriteMethods;
}

const DEFAULT_SUMMARY: VideoWriteSummarySnapshot = { total: 0, succeeded: 0, failed: 0 };
const DEFAULT_WRITE_COUNTS: VideoWriteCountsSnapshot = {
  moviesWatched: 0,
  moviesUnwatched: 0,
  episodesWatched: 0,
  episodesUnwatched: 0,
  movieResumes: 0,
  episodeResumes: 0,
  retries: 0
};
const DEFAULT_SNAPSHOT: VideoWriteStoreSnapshot = {
  status: 'idle',
  lastOperation: null,
  lastUpdatedAt: null,
  summary: DEFAULT_SUMMARY,
  failedItems: [],
  lastError: null,
  writeCounts: DEFAULT_WRITE_COUNTS
};
const DEFAULT_WRITE_METHODS: VideoWriteWriteMethods = {
  setMovieDetails,
  setEpisodeDetails
};
const VALIDATION_INVALID_ID_ERROR: VideoWriteSafeErrorSnapshot = {
  source: 'validation',
  code: 'validation/invalid-id',
  message: 'Video write IDs must be finite positive safe integers.'
};
const NO_ACTIVE_HOST_ERROR: VideoWriteSafeErrorSnapshot = {
  source: 'config',
  code: 'config/no-active-host',
  message: 'Choose an active Kodi host before writing video library changes.'
};
export class VideoWriteStore {
  #snapshot = $state<VideoWriteStoreSnapshot>(cloneStoreSnapshot(DEFAULT_SNAPSHOT));

  readonly #createClient: () =>
    | KodiJsonRpcHttpClient
    | null
    | Promise<KodiJsonRpcHttpClient | null>;
  readonly #now: () => string;
  readonly #writeMethods: VideoWriteWriteMethods;
  readonly #useDefaultWriteMethods: boolean;
  #failedTargets: VideoWriteTarget[] = [];

  constructor(options: VideoWriteStoreOptions = {}) {
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#writeMethods = options.writeMethods ?? DEFAULT_WRITE_METHODS;
    this.#useDefaultWriteMethods = !options.writeMethods;
  }

  get snapshot(): VideoWriteStoreSnapshot {
    return cloneStoreSnapshot(this.#snapshot);
  }

  async markMovieWatched(item: VideoWriteMovieItem, watched: boolean): Promise<void> {
    const operation: VideoWriteOperation = watched ? 'movie-watched' : 'movie-unwatched';
    const id = finitePositiveSafeInteger(item.movieid);
    if (id === null) {
      this.#validationFailure(operation, 'movie', item.movieid, item.label);
      return;
    }

    await this.#runTargets(operation, [
      { kind: 'movie', id, label: sanitizeLabel(item.label ?? `Movie ${id}`), operation, watched }
    ]);
  }

  async markEpisodeWatched(item: VideoWriteEpisodeItem, watched: boolean): Promise<void> {
    const operation: VideoWriteOperation = watched ? 'episode-watched' : 'episode-unwatched';
    const id = finitePositiveSafeInteger(item.episodeid);
    if (id === null) {
      this.#validationFailure(operation, 'episode', item.episodeid, item.label);
      return;
    }

    await this.#runTargets(operation, [
      {
        kind: 'episode',
        id,
        label: sanitizeLabel(item.label ?? `Episode ${id}`),
        operation,
        watched
      }
    ]);
  }

  async markEpisodesWatched(
    items: readonly VideoWriteEpisodeItem[],
    watched: boolean
  ): Promise<void> {
    const operation: VideoWriteOperation = watched
      ? 'episodes-batch-watched'
      : 'episodes-batch-unwatched';
    const targets: VideoWriteTarget[] = [];
    const invalidFailures: VideoWriteFailedItemSnapshot[] = [];

    for (const item of items) {
      const id = finitePositiveSafeInteger(item.episodeid);
      if (id === null) {
        invalidFailures.push(
          createFailedItem('episode', item.episodeid, item.label, VALIDATION_INVALID_ID_ERROR)
        );
        continue;
      }

      targets.push({
        kind: 'episode',
        id,
        label: sanitizeLabel(item.label ?? `Episode ${id}`),
        operation,
        watched
      });
    }

    if (invalidFailures.length > 0 && targets.length === 0) {
      this.#setResult(operation, {
        total: items.length,
        succeeded: 0,
        failed: invalidFailures.length,
        failures: invalidFailures,
        failedTargets: [],
        status: 'error',
        lastError: VALIDATION_INVALID_ID_ERROR,
        incrementCounts: false
      });
      return;
    }

    await this.#runTargets(operation, targets, invalidFailures, items.length);
  }

  async writeMovieResume(
    item: VideoWriteMovieItem,
    resume: VideoWriteResumePosition
  ): Promise<void> {
    const operation: VideoWriteOperation = 'movie-resume';
    const id = finitePositiveSafeInteger(item.movieid);
    if (id === null) {
      this.#validationFailure(operation, 'movie', item.movieid, item.label);
      return;
    }

    await this.#runTargets(operation, [
      {
        kind: 'movie',
        id,
        label: sanitizeLabel(item.label ?? `Movie ${id}`),
        operation,
        resume: normalizeResume(resume)
      }
    ]);
  }

  async writeEpisodeResume(
    item: VideoWriteEpisodeItem,
    resume: VideoWriteResumePosition
  ): Promise<void> {
    const operation: VideoWriteOperation = 'episode-resume';
    const id = finitePositiveSafeInteger(item.episodeid);
    if (id === null) {
      this.#validationFailure(operation, 'episode', item.episodeid, item.label);
      return;
    }

    await this.#runTargets(operation, [
      {
        kind: 'episode',
        id,
        label: sanitizeLabel(item.label ?? `Episode ${id}`),
        operation,
        resume: normalizeResume(resume)
      }
    ]);
  }

  async retryFailed(): Promise<void> {
    const targets = this.#failedTargets.map(cloneTarget);
    if (targets.length === 0) {
      this.#setResult('retry-failed', {
        total: 0,
        succeeded: 0,
        failed: 0,
        failures: [],
        failedTargets: [],
        status: 'success',
        lastError: null,
        incrementCounts: false
      });
      return;
    }

    await this.#runTargets('retry-failed', targets, [], targets.length, true);
  }

  async #runTargets(
    operation: VideoWriteOperation,
    targets: VideoWriteTarget[],
    existingFailures: VideoWriteFailedItemSnapshot[] = [],
    explicitTotal = targets.length + existingFailures.length,
    isRetry = false
  ): Promise<void> {
    this.#snapshot = {
      ...this.#snapshot,
      status: 'writing',
      lastOperation: operation,
      summary: { total: explicitTotal, succeeded: 0, failed: existingFailures.length },
      failedItems: existingFailures.map(cloneFailedItem),
      lastError: existingFailures.at(-1)?.error ?? null
    };

    if (targets.length === 0) {
      const status: VideoWriteStatus = existingFailures.length > 0 ? 'error' : 'success';
      this.#setResult(operation, {
        total: explicitTotal,
        succeeded: 0,
        failed: existingFailures.length,
        failures: existingFailures,
        failedTargets: [],
        status,
        lastError: existingFailures.at(-1)?.error ?? null,
        incrementCounts: false
      });
      return;
    }

    const client = await this.#resolveClient();
    if (!client) {
      const failures = [
        ...existingFailures,
        ...targets.map((target) =>
          createFailedItem(target.kind, target.id, target.label, NO_ACTIVE_HOST_ERROR)
        )
      ];
      this.#setResult(operation, {
        total: explicitTotal,
        succeeded: 0,
        failed: failures.length,
        failures,
        failedTargets: targets,
        status: 'error',
        lastError: NO_ACTIVE_HOST_ERROR,
        incrementCounts: false
      });
      return;
    }

    const failures = existingFailures.map(cloneFailedItem);

    const execution = await executeVideoWriteTargets({
      client,
      targets,
      writeMethods: this.#writeMethods,
      mode: this.#useDefaultWriteMethods ? 'auto' : 'method',
      now: this.#now
    });

    for (const failure of execution.failures) {
      const safeError = createSafeError(failure.error);
      failures.push(
        createFailedItem(failure.target.kind, failure.target.id, failure.target.label, safeError)
      );
    }

    const succeeded = execution.succeededTargets.length;
    const failedTargets = execution.failures.map((failure) => failure.target);
    const failed = failures.length;
    const status: VideoWriteStatus =
      failed === 0 ? 'success' : succeeded === 0 ? 'error' : 'partial';
    this.#setResult(operation, {
      total: explicitTotal,
      succeeded,
      failed,
      failures,
      failedTargets,
      status,
      lastError: failures.at(-1)?.error ?? null,
      incrementCounts: true,
      succeededTargets: execution.succeededTargets,
      isRetry
    });
  }

  async #resolveClient(): Promise<KodiJsonRpcHttpClient | null> {
    try {
      return await this.#createClient();
    } catch {
      return null;
    }
  }

  #validationFailure(
    operation: VideoWriteOperation,
    kind: VideoWriteFailedItemKind,
    rawId: unknown,
    label: string | undefined
  ): void {
    this.#setResult(operation, {
      total: 1,
      succeeded: 0,
      failed: 1,
      failures: [createFailedItem(kind, rawId, label, VALIDATION_INVALID_ID_ERROR)],
      failedTargets: [],
      status: 'error',
      lastError: VALIDATION_INVALID_ID_ERROR,
      incrementCounts: false
    });
  }

  #setResult(
    operation: VideoWriteOperation,
    result: {
      total: number;
      succeeded: number;
      failed: number;
      failures: VideoWriteFailedItemSnapshot[];
      failedTargets: VideoWriteTarget[];
      status: VideoWriteStatus;
      lastError: VideoWriteSafeErrorSnapshot | null;
      incrementCounts: boolean;
      succeededTargets?: VideoWriteTarget[];
      isRetry?: boolean;
    }
  ): void {
    this.#failedTargets = result.failedTargets.map(cloneTarget);
    this.#snapshot = {
      ...this.#snapshot,
      status: result.status,
      lastOperation: operation,
      lastUpdatedAt: this.#now(),
      summary: {
        total: result.total,
        succeeded: result.succeeded,
        failed: result.failed
      },
      failedItems: result.failures.map(cloneFailedItem),
      lastError: result.lastError ? cloneError(result.lastError) : null,
      writeCounts: result.incrementCounts
        ? incrementWriteCounts(
            this.#snapshot.writeCounts,
            result.succeededTargets ?? [],
            result.isRetry ?? false
          )
        : { ...this.#snapshot.writeCounts }
    };
  }
}

function incrementWriteCounts(
  counts: VideoWriteCountsSnapshot,
  targets: readonly VideoWriteTarget[],
  isRetry: boolean
): VideoWriteCountsSnapshot {
  const next = { ...counts };
  for (const target of targets) {
    if (target.operation === 'movie-watched') next.moviesWatched += 1;
    if (target.operation === 'movie-unwatched') next.moviesUnwatched += 1;
    if (target.operation === 'episode-watched' || target.operation === 'episodes-batch-watched') {
      next.episodesWatched += 1;
    }
    if (
      target.operation === 'episode-unwatched' ||
      target.operation === 'episodes-batch-unwatched'
    ) {
      next.episodesUnwatched += 1;
    }
    if (target.operation === 'movie-resume') next.movieResumes += 1;
    if (target.operation === 'episode-resume') next.episodeResumes += 1;
  }

  if (isRetry && targets.length > 0) {
    next.retries += 1;
  }

  return next;
}

function createFailedItem(
  kind: VideoWriteFailedItemKind,
  rawId: unknown,
  label: string | undefined,
  error: VideoWriteSafeErrorSnapshot | null
): VideoWriteFailedItemSnapshot {
  return {
    kind,
    id: finitePositiveSafeInteger(rawId) ?? 0,
    label: sanitizeLabel(label ?? `${kind === 'movie' ? 'Movie' : 'Episode'} ${String(rawId)}`),
    error: error ? cloneError(error) : null
  };
}

function createSafeError(error: unknown): VideoWriteSafeErrorSnapshot {
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
      error instanceof Error ? error.message : 'Kodi video library write failed.'
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

function normalizeResume(resume: VideoWriteResumePosition): VideoWriteResumePosition {
  return {
    position: finiteNonNegativeNumber(resume.position),
    total: finiteNonNegativeNumber(resume.total)
  };
}

function sanitizeLabel(label: string): string {
  const trimmed = sanitizeErrorMessage(label).trim();
  return trimmed.length > 0 ? trimmed : 'Untitled video item';
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
    .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
    .replace(/\/[^^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-file')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/sessionStorage/gi, 'browser storage')
    .replace(/CHORUS_SENTINEL_SECRET/gi, '[redacted-sentinel]')
    .replace(/password/gi, 'credentials');
}

function cloneStoreSnapshot(snapshot: VideoWriteStoreSnapshot): VideoWriteStoreSnapshot {
  return {
    ...snapshot,
    summary: { ...snapshot.summary },
    failedItems: snapshot.failedItems.map(cloneFailedItem),
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null,
    writeCounts: { ...snapshot.writeCounts }
  };
}

function cloneFailedItem(item: VideoWriteFailedItemSnapshot): VideoWriteFailedItemSnapshot {
  return {
    ...item,
    error: item.error ? cloneError(item.error) : null
  };
}

function cloneError(error: VideoWriteSafeErrorSnapshot): VideoWriteSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

function cloneTarget(target: VideoWriteTarget): VideoWriteTarget {
  return {
    ...target,
    ...(target.resume ? { resume: { ...target.resume } } : {})
  };
}

function finitePositiveSafeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function finiteNonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function createVideoWriteStore(options: VideoWriteStoreOptions = {}): VideoWriteStore {
  return new VideoWriteStore(options);
}

export const videoWriteStore = createVideoWriteStore();
