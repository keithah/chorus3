import {
  type KodiJsonRpcBatchCall,
  type KodiJsonRpcHttpClient,
  type VideoResumePosition
} from '$lib/kodi';

export type VideoWriteTarget =
  | {
      kind: 'movie';
      id: number;
      label: string;
      operation: 'movie-watched' | 'movie-unwatched' | 'movie-resume';
      watched?: boolean;
      resume?: VideoResumePosition;
    }
  | {
      kind: 'episode';
      id: number;
      label: string;
      operation:
        | 'episode-watched'
        | 'episode-unwatched'
        | 'episodes-batch-watched'
        | 'episodes-batch-unwatched'
        | 'episode-resume';
      watched?: boolean;
      resume?: VideoResumePosition;
    };

export interface VideoWriteWriteMethods {
  setMovieDetails(
    client: KodiJsonRpcHttpClient,
    params: {
      movieid: number;
      playcount?: number;
      lastplayed?: string;
      resume?: VideoResumePosition;
    }
  ): Promise<unknown>;
  setEpisodeDetails(
    client: KodiJsonRpcHttpClient,
    params: {
      episodeid: number;
      playcount?: number;
      lastplayed?: string;
      resume?: VideoResumePosition;
    }
  ): Promise<unknown>;
}

export type VideoWriteExecutionMode = 'auto' | 'method';

export interface VideoWriteExecutionOptions {
  client: KodiJsonRpcHttpClient;
  targets: readonly VideoWriteTarget[];
  writeMethods: VideoWriteWriteMethods;
  mode: VideoWriteExecutionMode;
  now: () => string;
}

export interface VideoWriteExecutionFailure {
  target: VideoWriteTarget;
  error: unknown;
}

export interface VideoWriteExecutionResult {
  succeededTargets: VideoWriteTarget[];
  failures: VideoWriteExecutionFailure[];
}

const METHOD_WRITE_CONCURRENCY = 6;
const JSON_RPC_WRITE_BATCH_SIZE = 50;
type SelectedVideoWriteExecutionMode = 'method' | 'json-rpc-batch';

export async function executeVideoWriteTargets({
  client,
  targets,
  writeMethods,
  mode,
  now
}: VideoWriteExecutionOptions): Promise<VideoWriteExecutionResult> {
  return selectExecutionMode(client, targets, mode) === 'json-rpc-batch'
    ? executeJsonRpcBatches(client, targets, now)
    : executeMethodWrites(client, targets, writeMethods, now);
}

function selectExecutionMode(
  client: KodiJsonRpcHttpClient,
  targets: readonly VideoWriteTarget[],
  mode: VideoWriteExecutionMode
): SelectedVideoWriteExecutionMode {
  return mode === 'auto' && canUseJsonRpcBatch(client, targets) ? 'json-rpc-batch' : 'method';
}

function canUseJsonRpcBatch(
  client: KodiJsonRpcHttpClient,
  targets: readonly VideoWriteTarget[]
): boolean {
  return typeof client.callBatch === 'function' && targets.every((target) => !target.resume);
}

async function executeJsonRpcBatches(
  client: KodiJsonRpcHttpClient,
  targets: readonly VideoWriteTarget[],
  now: () => string
): Promise<VideoWriteExecutionResult> {
  const succeededTargets: VideoWriteTarget[] = [];
  const failures: VideoWriteExecutionFailure[] = [];

  for (const chunk of chunks(targets, JSON_RPC_WRITE_BATCH_SIZE)) {
    try {
      await client.callBatch?.(chunk.map((target) => createWriteBatchCall(target, now())));
      succeededTargets.push(...chunk);
    } catch (error) {
      failures.push(...chunk.map((target) => ({ target, error })));
    }
  }

  return { succeededTargets, failures };
}

async function executeMethodWrites(
  client: KodiJsonRpcHttpClient,
  targets: readonly VideoWriteTarget[],
  writeMethods: VideoWriteWriteMethods,
  now: () => string
): Promise<VideoWriteExecutionResult> {
  const succeededTargets: VideoWriteTarget[] = [];
  const failures: VideoWriteExecutionFailure[] = [];

  await runWithConcurrency(targets, METHOD_WRITE_CONCURRENCY, async (target) => {
    try {
      await writeTarget(client, target, writeMethods, now());
      succeededTargets.push(target);
    } catch (error) {
      failures.push({ target, error });
    }
  });

  return { succeededTargets, failures };
}

function writeTarget(
  client: KodiJsonRpcHttpClient,
  target: VideoWriteTarget,
  writeMethods: VideoWriteWriteMethods,
  now: string
): Promise<unknown> {
  if (target.kind === 'movie') {
    return writeMethods.setMovieDetails(client, {
      movieid: target.id,
      ...createWritePayload(target, now)
    });
  }

  return writeMethods.setEpisodeDetails(client, {
    episodeid: target.id,
    ...createWritePayload(target, now)
  });
}

function createWritePayload(
  target: VideoWriteTarget,
  now: string
): { playcount?: number; lastplayed?: string; resume?: VideoResumePosition } {
  if (target.resume) {
    return { resume: target.resume };
  }

  if (target.watched) {
    return { playcount: 1, lastplayed: formatKodiDateTime(now) };
  }

  return { playcount: 0, resume: { position: 0, total: 0 } };
}

function createWriteBatchCall(target: VideoWriteTarget, now: string): KodiJsonRpcBatchCall {
  const payload = createWritePayload(target, now);

  if (target.kind === 'movie') {
    return {
      method: 'VideoLibrary.SetMovieDetails',
      params: {
        movieid: target.id,
        ...payload
      }
    };
  }

  return {
    method: 'VideoLibrary.SetEpisodeDetails',
    params: {
      episodeid: target.id,
      ...payload
    }
  };
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const safeSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : items.length;
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += safeSize) {
    result.push(items.slice(start, start + safeSize));
  }
  return result;
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

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        if (item !== undefined) {
          await worker(item);
        }
      }
    })
  );
}
