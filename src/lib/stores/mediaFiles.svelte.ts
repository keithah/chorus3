import {
  getFileDirectory,
  getFileSources,
  type FileDirectoryPropertyName,
  type FileMediaType,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  MusicLibraryClientError,
  cloneMusicLibrarySafeError,
  createMusicLibrarySafeError,
  type MusicLibraryRefreshStatus,
  type MusicLibrarySafeErrorSnapshot
} from './musicLibraryNormalization';

export type MediaFilesMedia = Extract<FileMediaType, 'music' | 'video'>;
export type MediaFilesRefreshStatus = MusicLibraryRefreshStatus;
export type MediaFilesRefreshReason =
  | 'init'
  | 'manual'
  | `source:${string}`
  | `directory:${string}`
  | `error:${string}`;

export interface MediaFileSourceSnapshot {
  id: string;
  label: string;
}

export type MediaDirectoryEntryKind = 'directory' | 'file';
export type MediaDirectoryEntryMediaKind = 'audio' | 'unsupported';

export interface MediaDirectoryEntryCapabilitiesSnapshot {
  canBrowse: boolean;
  canPlay: boolean;
  canQueue: boolean;
}

export interface MediaDirectoryEntrySnapshot {
  id: string;
  kind: MediaDirectoryEntryKind;
  label: string;
  mediaKind?: MediaDirectoryEntryMediaKind;
  extension?: string;
  capabilities: MediaDirectoryEntryCapabilitiesSnapshot;
}

export interface MediaFilesBreadcrumbSnapshot {
  id: string;
  label: string;
}

export interface MediaFilesStoreSnapshot {
  refreshStatus: MediaFilesRefreshStatus;
  lastRefreshReason: MediaFilesRefreshReason;
  lastUpdatedAt: string | null;
  media: MediaFilesMedia;
  sources: MediaFileSourceSnapshot[];
  entries: MediaDirectoryEntrySnapshot[];
  breadcrumbs: MediaFilesBreadcrumbSnapshot[];
  isEmpty: boolean;
  lastError: MusicLibrarySafeErrorSnapshot | null;
}

export interface MediaFilesStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  media?: MediaFilesMedia;
  now?: () => string;
}

export type MediaFilesPlayableEntryResult =
  | { ok: true; entry: { id: string; label: string; media: MediaFilesMedia; file: string } }
  | { ok: false; error: MusicLibrarySafeErrorSnapshot };

type SourceRecord = {
  id: string;
  label: string;
  path: string;
};

type EntryRecord = {
  id: string;
  label: string;
  path: string;
  kind: MediaDirectoryEntryKind;
  playable: boolean;
};

const DEFAULT_MEDIA: MediaFilesMedia = 'music';
const DIRECTORY_SORT = { method: 'label', order: 'ascending' } as const;
const DIRECTORY_PROPERTIES = [
  'title',
  'artist',
  'album',
  'duration',
  'track',
  'thumbnail',
  'file'
] as const satisfies readonly FileDirectoryPropertyName[];
const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'm4a', 'aac', 'ogg', 'wav']);

function defaultSnapshot(media: MediaFilesMedia): MediaFilesStoreSnapshot {
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    media,
    sources: [],
    entries: [],
    breadcrumbs: [],
    isEmpty: true,
    lastError: null
  };
}

export class MediaFilesStore {
  #snapshot = $state<MediaFilesStoreSnapshot>(defaultSnapshot(DEFAULT_MEDIA));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #media: MediaFilesMedia;
  readonly #now: () => string;

  #requestId = 0;
  #sources = new Map<string, SourceRecord>();
  #entries = new Map<string, EntryRecord>();
  #entryCounter = 0;

  constructor(options: MediaFilesStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#media = options.media ?? DEFAULT_MEDIA;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#snapshot = cloneMediaFilesSnapshot(defaultSnapshot(this.#media));
  }

  get snapshot(): MediaFilesStoreSnapshot {
    return cloneMediaFilesSnapshot(this.#snapshot);
  }

  async refreshSources(): Promise<void> {
    const requestId = ++this.#requestId;
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: 'manual',
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const result = await getFileSources(client, this.#media);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const sources = normalizeSources(result.sources);
      this.#sources = new Map(sources.map((source) => [source.id, source]));
      this.#entries = new Map();
      this.#entryCounter = 0;

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: 'manual',
        lastUpdatedAt: this.#now(),
        media: this.#media,
        sources: sources.map(sourceSnapshot),
        entries: [],
        breadcrumbs: [],
        isEmpty: sources.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createMusicLibrarySafeError(error);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: `error:${safeError.code}`,
        lastUpdatedAt: this.#now(),
        lastError: safeError
      };
    }
  }

  async openSource(id: string): Promise<void> {
    const source = this.#sources.get(id);

    if (!source) {
      this.#recordInputError(unknownEntryError());
      return;
    }

    await this.#openDirectoryPath({
      path: source.path,
      reason: `source:${source.id}`,
      breadcrumbs: [{ id: source.id, label: source.label }]
    });
  }

  async openDirectory(id: string): Promise<void> {
    const entry = this.#entries.get(id);

    if (!entry || entry.kind !== 'directory') {
      this.#recordInputError(unknownEntryError());
      return;
    }

    await this.#openDirectoryPath({
      path: entry.path,
      reason: `directory:${entry.id}`,
      breadcrumbs: [...this.#snapshot.breadcrumbs, { id: entry.id, label: entry.label }]
    });
  }

  getPlayableEntry(id: string): MediaFilesPlayableEntryResult {
    const entry = this.#entries.get(id);

    if (!entry) {
      return { ok: false, error: unknownEntryError() };
    }

    if (!entry.playable) {
      return { ok: false, error: unsupportedEntryError() };
    }

    return {
      ok: true,
      entry: {
        id: entry.id,
        label: entry.label,
        media: this.#media,
        file: entry.path
      }
    };
  }

  clear(): void {
    this.#requestId += 1;
    this.#sources = new Map();
    this.#entries = new Map();
    this.#entryCounter = 0;
    this.#snapshot = cloneMediaFilesSnapshot(defaultSnapshot(this.#media));
  }

  destroy(): void {
    this.#requestId += 1;
  }

  async #openDirectoryPath(options: {
    path: string;
    reason: Extract<MediaFilesRefreshReason, `source:${string}` | `directory:${string}`>;
    breadcrumbs: MediaFilesBreadcrumbSnapshot[];
  }): Promise<void> {
    const requestId = ++this.#requestId;
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: options.reason,
      breadcrumbs: cloneBreadcrumbs(options.breadcrumbs),
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const result = await getFileDirectory(client, {
        directory: options.path,
        media: this.#media,
        properties: DIRECTORY_PROPERTIES,
        sort: DIRECTORY_SORT
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const entries = this.#normalizeEntries(result.files);
      this.#entries = new Map(entries.map((entry) => [entry.record.id, entry.record]));

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: options.reason,
        lastUpdatedAt: this.#now(),
        media: this.#media,
        sources: cloneSources(this.#snapshot.sources),
        entries: entries.map((entry) => entry.snapshot),
        breadcrumbs: cloneBreadcrumbs(options.breadcrumbs),
        isEmpty: entries.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createMusicLibrarySafeError(error);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: `error:${safeError.code}`,
        lastUpdatedAt: this.#now(),
        lastError: safeError
      };
    }
  }

  #normalizeEntries(
    items: unknown
  ): { record: EntryRecord; snapshot: MediaDirectoryEntrySnapshot }[] {
    this.#entryCounter = 0;

    return normalizeRecordList(items).flatMap((item) => {
      const path = normalizePath(item.file);
      if (!path) {
        return [];
      }

      const kind: MediaDirectoryEntryKind = item.filetype === 'directory' ? 'directory' : 'file';
      const id = `entry:${++this.#entryCounter}`;
      const label = normalizePublicLabel(item.label, path, `Entry ${this.#entryCounter}`);
      const extension = kind === 'file' ? extensionFromPath(path) : undefined;
      const playable =
        kind === 'file' && extension !== undefined && AUDIO_EXTENSIONS.has(extension);
      const record: EntryRecord = { id, label, path, kind, playable };
      const snapshot: MediaDirectoryEntrySnapshot = {
        id,
        kind,
        label,
        ...(kind === 'file'
          ? {
              mediaKind: playable ? 'audio' : 'unsupported',
              ...(extension ? { extension } : {})
            }
          : {}),
        capabilities:
          kind === 'directory'
            ? { canBrowse: true, canPlay: false, canQueue: false }
            : { canBrowse: false, canPlay: playable, canQueue: playable }
      };

      return [{ record, snapshot }];
    });
  }

  #recordInputError(error: MusicLibrarySafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'error',
      lastRefreshReason: `error:${error.code}`,
      lastUpdatedAt: this.#now(),
      lastError: cloneMusicLibrarySafeError(error)
    };
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient?.() ?? null;

    if (!client) {
      throw new MusicLibraryClientError(
        'client/no-active-host',
        'Kodi HTTP client is not configured for media files.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export function createMediaFilesStore(options: MediaFilesStoreOptions = {}): MediaFilesStore {
  return new MediaFilesStore(options);
}

export const mediaFilesStore = createMediaFilesStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

function normalizeSources(items: unknown): SourceRecord[] {
  let counter = 0;

  return normalizeRecordList(items).flatMap((item) => {
    const path = normalizePath(item.file);
    if (!path) {
      return [];
    }

    const id = `source:${++counter}`;
    return [
      {
        id,
        label: normalizeSourceLabel(item, path, counter),
        path
      }
    ];
  });
}

function sourceSnapshot(source: SourceRecord): MediaFileSourceSnapshot {
  return { id: source.id, label: source.label };
}

function normalizeSourceLabel(
  item: Record<string, unknown>,
  path: string,
  ordinal: number
): string {
  const label = stringValue(item.label);
  if (label && !containsSensitiveText(label) && !looksPathLike(label)) {
    return label;
  }

  if (label === undefined && !containsCredentials(path)) {
    return basenameFromPath(path) ?? `Source ${ordinal}`;
  }

  return `Source ${ordinal}`;
}

function normalizePublicLabel(value: unknown, path: string, fallback: string): string {
  const label = stringValue(value);
  if (label && !containsSensitiveText(label) && !looksPathLike(label)) {
    return label;
  }

  return basenameFromPath(path) ?? fallback;
}

function normalizePath(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function basenameFromPath(path: string): string | null {
  const withoutTrailingSeparators = path.replace(/[\\/]+$/, '');
  if (withoutTrailingSeparators.length === 0) {
    return null;
  }

  const segments = withoutTrailingSeparators.split(/[\\/]/).filter(Boolean);
  const candidate = segments.at(-1)?.trim();

  if (!candidate || containsCredentials(candidate) || containsSensitiveText(candidate)) {
    return null;
  }

  return candidate;
}

function extensionFromPath(path: string): string | undefined {
  const basename = basenameFromPath(path);
  const match = basename?.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase();
}

function containsSensitiveText(value: string): boolean {
  return /authorization|basic\s+|password|p@ssword|raw response body|localStorage/i.test(value);
}

function containsCredentials(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\/[^\s/@]+:[^\s/@]+@/i.test(value);
}

function looksPathLike(value: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ||
    /^[a-z]:\\/i.test(value) ||
    value.startsWith('/') ||
    value.includes('\\')
  );
}

function cloneMediaFilesSnapshot(snapshot: MediaFilesStoreSnapshot): MediaFilesStoreSnapshot {
  return {
    ...snapshot,
    sources: cloneSources(snapshot.sources),
    entries: cloneEntries(snapshot.entries),
    breadcrumbs: cloneBreadcrumbs(snapshot.breadcrumbs),
    lastError: cloneMusicLibrarySafeError(snapshot.lastError)
  };
}

function cloneSources(sources: readonly MediaFileSourceSnapshot[]): MediaFileSourceSnapshot[] {
  return sources.map((source) => ({ ...source }));
}

function cloneEntries(
  entries: readonly MediaDirectoryEntrySnapshot[]
): MediaDirectoryEntrySnapshot[] {
  return entries.map((entry) => ({
    ...entry,
    capabilities: { ...entry.capabilities }
  }));
}

function cloneBreadcrumbs(
  breadcrumbs: readonly MediaFilesBreadcrumbSnapshot[]
): MediaFilesBreadcrumbSnapshot[] {
  return breadcrumbs.map((breadcrumb) => ({ ...breadcrumb }));
}

function unknownEntryError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unknown-entry',
      'The selected media file entry is no longer available.'
    )
  );
}

function unsupportedEntryError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unsupported-entry',
      'The selected media file entry cannot be played or queued.'
    )
  );
}

function normalizeRecordList(items: unknown): Record<string, unknown>[] {
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
