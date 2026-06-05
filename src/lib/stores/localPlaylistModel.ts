import { isTextSecretSafe, redactDiagnosticText } from '$lib/safety/redaction';

import type {
  LocalPlaylistItemRecord,
  LocalPlaylistItemSnapshot,
  LocalPlaylistPlayableItem,
  LocalPlaylistRecord,
  LocalPlaylistSafeErrorSnapshot,
  LocalPlaylistSnapshot,
  LocalPlaylistStorageWarning,
  LocalPlaylistStorageWarningCode,
  LocalPlaylistStoreSnapshot,
  LocalPlaylistValidationErrors,
  PersistedLocalPlaylistsPayload
} from './localPlaylistTypes';

export const MAX_ITEMS_PER_PLAYLIST = 1_000;
const MAX_PLAYLISTS = 100;
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
export const PLAYLIST_ID_PATTERN = /^playlist-[A-Za-z0-9_-]+$/;
export const ITEM_ID_PATTERN = /^item-[A-Za-z0-9_-]+$/;

export function validatePersistedPayload(value: unknown): PersistedLocalPlaylistsPayload {
  if (!isRecord(value) || !Array.isArray(value.playlists)) {
    throw new Error('Persisted local playlists must include a playlists array.');
  }

  if (value.playlists.length > MAX_PLAYLISTS) {
    throw new Error('Persisted local playlists exceeded the playlist limit.');
  }

  const playlists = value.playlists.map(validatePersistedPlaylist);
  const selectedPlaylistId = validatePersistedSelectedPlaylistId(
    value.selectedPlaylistId,
    playlists
  );

  return { playlists, selectedPlaylistId };
}

function validatePersistedPlaylist(value: unknown): LocalPlaylistRecord {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error('Persisted local playlist was invalid.');
  }

  if (!isValidPlaylistId(value.id)) {
    throw new Error('Persisted local playlist id was invalid.');
  }

  const label = normalizeSafeLabel(value.label, 'Local playlist name is required.');
  if (!label.ok) {
    throw new Error('Persisted local playlist label was invalid.');
  }

  if (value.items.length > MAX_ITEMS_PER_PLAYLIST) {
    throw new Error('Persisted local playlist item limit exceeded.');
  }

  return {
    id: value.id,
    label: label.value,
    items: normalizePositions(value.items.map(validatePersistedItem)),
    createdAt: validateIsoString(value.createdAt),
    updatedAt: validateIsoString(value.updatedAt)
  };
}

function validatePersistedItem(value: unknown): LocalPlaylistItemRecord {
  if (!isRecord(value)) {
    throw new Error('Persisted local playlist item was invalid.');
  }

  if (!isValidItemId(value.id)) {
    throw new Error('Persisted local playlist item id was invalid.');
  }

  if (value.kind !== 'audio' && value.kind !== 'video' && value.kind !== 'playlist') {
    throw new Error('Persisted local playlist item kind was invalid.');
  }

  const label = normalizeSafeLabel(value.label, 'Local playlist item label is required.');
  if (!label.ok) {
    throw new Error('Persisted local playlist item label was invalid.');
  }

  const file = validatePrivateFile(value.file);
  if (!file.ok) {
    throw new Error('Persisted local playlist item file was invalid.');
  }

  const sourceId = normalizeOptionalSourceId(value.sourceId);
  if (sourceId === false) {
    throw new Error('Persisted local playlist source id was invalid.');
  }

  const durationSeconds = normalizeOptionalDuration(value.durationSeconds);
  if (durationSeconds === false) {
    throw new Error('Persisted local playlist duration was invalid.');
  }

  const thumbnail = normalizeOptionalPrivateText(value.thumbnail);
  if (thumbnail === false) {
    throw new Error('Persisted local playlist thumbnail was invalid.');
  }

  return {
    id: value.id,
    kind: value.kind,
    label: label.value,
    file: file.value,
    position:
      typeof value.position === 'number' &&
      Number.isSafeInteger(value.position) &&
      value.position >= 0
        ? value.position
        : 0,
    ...(sourceId === undefined ? {} : { sourceId }),
    ...(durationSeconds === undefined ? {} : { durationSeconds }),
    ...(thumbnail === undefined ? {} : { thumbnail }),
    addedAt: validateIsoString(value.addedAt)
  };
}

function validatePersistedSelectedPlaylistId(
  value: unknown,
  playlists: LocalPlaylistRecord[]
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || !playlists.some((playlist) => playlist.id === value)) {
    throw new Error('Persisted selected local playlist id was invalid.');
  }

  return value;
}

export function normalizeSafeLabel(
  value: unknown,
  requiredMessage: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string') {
    return { ok: false, error: requiredMessage };
  }

  const label = value.trim().replace(/\s+/g, ' ');
  if (!label) {
    return { ok: false, error: requiredMessage };
  }

  if (!isTextSecretSafe(label)) {
    return { ok: false, error: 'Use a safe display name without paths, URLs, or credentials.' };
  }

  return { ok: true, value: label };
}

export function validatePrivateFile(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: 'Choose a playable local media item.' };
  }

  const file = value.trim();
  if (/https?:\/\//i.test(file) || /authorization\s*:/i.test(file)) {
    return {
      ok: false,
      error: 'Choose a playable local media item without remote URLs or credentials.'
    };
  }

  return { ok: true, value: file };
}

export function normalizeOptionalSourceId(value: unknown): string | undefined | false {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const sourceId = value.trim();
  return sourceId && SAFE_ID_PATTERN.test(sourceId.replace(/:/g, '_')) ? sourceId : false;
}

export function normalizeOptionalDuration(value: unknown): number | undefined | false {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : false;
}

export function normalizeOptionalPrivateText(value: unknown): string | undefined | false {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const text = value.trim();
  return text ? text : undefined;
}

export function validateIsoString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Persisted timestamp was invalid.');
  }

  return value;
}

function isValidPlaylistId(value: unknown): value is string {
  return typeof value === 'string' && PLAYLIST_ID_PATTERN.test(value);
}

function isValidItemId(value: unknown): value is string {
  return typeof value === 'string' && ITEM_ID_PATTERN.test(value);
}

export function normalizePositions(items: LocalPlaylistItemRecord[]): LocalPlaylistItemRecord[] {
  return items.map((item, position) => ({ ...item, position }));
}

export function clonePlaylistRecord(playlist: LocalPlaylistRecord): LocalPlaylistRecord {
  return {
    ...playlist,
    items: playlist.items.map((item) => ({ ...item }))
  };
}

export function clonePlaylistSnapshot(playlist: LocalPlaylistRecord): LocalPlaylistSnapshot {
  return {
    id: playlist.id,
    label: playlist.label,
    items: playlist.items.map(cloneItemSnapshot),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt
  };
}

export function cloneItemSnapshot(item: LocalPlaylistItemRecord): LocalPlaylistItemSnapshot {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    position: item.position,
    ...(item.sourceId === undefined ? {} : { sourceId: item.sourceId }),
    ...(item.durationSeconds === undefined ? {} : { durationSeconds: item.durationSeconds }),
    addedAt: item.addedAt
  };
}

export function clonePlayableItem(item: LocalPlaylistItemRecord): LocalPlaylistPlayableItem {
  return {
    id: item.id,
    kind: item.kind,
    label: item.label,
    file: item.file,
    position: item.position,
    ...(item.sourceId === undefined ? {} : { sourceId: item.sourceId }),
    ...(item.durationSeconds === undefined ? {} : { durationSeconds: item.durationSeconds }),
    ...(item.thumbnail === undefined ? {} : { thumbnail: item.thumbnail })
  };
}

export function cloneStoreSnapshot(
  snapshot: LocalPlaylistStoreSnapshot
): LocalPlaylistStoreSnapshot {
  return {
    ...snapshot,
    playlists: snapshot.playlists.map((playlist) => ({
      ...playlist,
      items: playlist.items.map((item) => ({ ...item }))
    })),
    selectedPlaylist: snapshot.selectedPlaylist
      ? {
          ...snapshot.selectedPlaylist,
          items: snapshot.selectedPlaylist.items.map((item) => ({ ...item }))
        }
      : null,
    validationErrors: cloneValidationErrors(snapshot.validationErrors),
    storageWarning: snapshot.storageWarning ? { ...snapshot.storageWarning } : null,
    lastError: snapshot.lastError ? { ...snapshot.lastError } : null
  };
}

export function cloneValidationErrors(
  errors: LocalPlaylistValidationErrors
): LocalPlaylistValidationErrors {
  return { ...errors };
}

export function createStorageWarning(
  code: LocalPlaylistStorageWarningCode
): LocalPlaylistStorageWarning {
  switch (code) {
    case 'read-failed':
      return {
        code,
        message: 'Local playlists could not be read. In-memory playlists are still available.'
      };
    case 'write-failed':
      return {
        code,
        message: 'Local playlists could not be written. Changes are kept in memory only.'
      };
    case 'remove-failed':
      return {
        code,
        message: 'Local playlists could not be removed from browser storage.'
      };
    case 'invalid-storage':
      return {
        code,
        message: 'Local playlists were reset because stored data was invalid.'
      };
  }
}

export function createRandomId(prefix: 'playlist' | 'item'): string {
  return `${prefix}-${cryptoRandomToken()}`;
}

export function cryptoRandomToken(): string {
  const cryptoApi = globalThis.crypto as
    | {
        randomUUID?: () => string;
        getRandomValues?: (array: Uint8Array) => Uint8Array;
      }
    | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID().replace(/-/g, '').slice(0, 16);
  }

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return Math.random().toString(36).slice(2, 12);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createLocalPlaylistSafeError(error: unknown): LocalPlaylistSafeErrorSnapshot {
  return {
    source: 'storage',
    code: 'storage/failed',
    message: redactDiagnosticText(error)
  };
}
