import { KodiHttpClientError, isKodiHttpClientError } from '$lib/kodi';
import { redactStoreErrorMessage } from '$lib/safety/redaction';
import type { PlayerStoreSnapshot } from './player.svelte.ts';
import type {
  QueueItemSnapshot,
  QueueLimitsSnapshot,
  QueuePlayableItemSnapshot,
  QueueSafeErrorSnapshot,
  QueueStoreSnapshot
} from './queueTypes';

export class QueueClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'QueueClientError';
    this.code = code;
  }
}

export function normalizeActiveQueue(queue: PlayerStoreSnapshot['queue']): {
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

export function normalizeItems(items: unknown): QueueItemSnapshot[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized: QueueItemSnapshot[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (isRecord(item)) {
      normalized.push(normalizeItem(item, index));
    }
  }
  return normalized;
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

export function normalizePlayableItems(items: unknown): QueuePlayableItemSnapshot[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized: QueuePlayableItemSnapshot[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (isRecord(item)) {
      normalized.push(...normalizePlayableItem(item, index));
    }
  }
  return normalized;
}

function normalizePlayableItem(
  item: Record<string, unknown>,
  index: number
): QueuePlayableItemSnapshot[] {
  const file = stringValue(item.file);
  if (!file) {
    return [];
  }

  const title = stringValue(item.title);
  const label = stringValue(item.label) ?? title ?? `Queue item ${index + 1}`;

  return [
    {
      position: index,
      label,
      file,
      ...stringField('type', item.type),
      ...numberField('duration', item.duration),
      ...stringField('thumbnail', item.thumbnail)
    }
  ];
}

export function normalizeLimits(limits: unknown, items: unknown): QueueLimitsSnapshot {
  const fallbackTotal = countRecords(items);

  if (!isRecord(limits)) {
    return { start: 0, end: fallbackTotal, total: fallbackTotal };
  }

  const start = finiteNumberOr(limits.start, 0);
  const end = finiteNumberOr(limits.end, fallbackTotal);
  const total = finiteNumberOr(limits.total, fallbackTotal);

  return { start, end, total };
}

function countRecords(items: unknown): number {
  if (!Array.isArray(items)) return 0;

  let count = 0;
  for (const item of items) {
    if (isRecord(item)) count += 1;
  }
  return count;
}

export function createSafeError(error: unknown): QueueSafeErrorSnapshot {
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

export function sanitizeErrorMessage(message: string): string {
  return redactStoreErrorMessage(message);
}

export function cloneQueueStoreSnapshot(snapshot: QueueStoreSnapshot): QueueStoreSnapshot {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
