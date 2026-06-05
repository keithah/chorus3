import {
  KodiHttpClientError,
  addEpisodePlaylistItem,
  addFilePlaylistItem,
  addMoviePlaylistItem,
  addMusicVideoPlaylistItem,
  addMusicPlaylistItem,
  isKodiHttpClientError,
  type KodiEpisodeLibraryItem,
  type KodiJsonRpcBatchCall,
  type KodiJsonRpcHttpClient,
  type KodiMovieLibraryItem,
  type KodiMusicLibraryItem,
  type KodiMusicVideoLibraryItem
} from '$lib/kodi';

import { sanitizeErrorMessage } from './queueStoreSnapshots';
import type {
  LibraryQueueItem,
  QueueDispatchSafeErrorSnapshot,
  QueueDispatchSnapshot
} from './queueTypes';

export function validateQueuePosition(
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

export function normalizeMusicQueueItem(
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

export function normalizeMovieQueueItem(
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

export function normalizeEpisodeQueueItem(
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

export function normalizeMusicVideoQueueItem(
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

export function normalizeQueueItems<TInput, TItem>(
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

export function normalizeQueueItemValues<TInput, TValue>(
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

export function normalizedResultValue<TValue>(
  result: ({ ok: true } & TValue) | { ok: false; error: QueueDispatchSafeErrorSnapshot }
):
  | { ok: true; value: { ok: true } & TValue }
  | { ok: false; error: QueueDispatchSafeErrorSnapshot } {
  return result.ok ? { ok: true, value: result } : result;
}

export function normalizeLibraryQueueItem(
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

export async function addNormalizedLibraryQueueItems(
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

export function normalizeFileQueueItem(
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

export async function addNormalizedFileQueueItems(
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

export function normalizePlaylistQueueItem(
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

export function createQueueInputError(
  code: string,
  message: string
): QueueDispatchSafeErrorSnapshot {
  return { source: 'input', code, message };
}

export function createQueueCommandError(
  code: string,
  message: string
): QueueDispatchSafeErrorSnapshot {
  return { source: 'command', code, message };
}

export function createDispatchSafeError(error: unknown): QueueDispatchSafeErrorSnapshot {
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

export function cloneDispatchSnapshot(snapshot: QueueDispatchSnapshot): QueueDispatchSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError ? cloneDispatchError(snapshot.lastError) : null
  };
}

export function cloneDispatchError(
  error: QueueDispatchSafeErrorSnapshot
): QueueDispatchSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
