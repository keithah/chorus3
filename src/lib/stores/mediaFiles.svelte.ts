import {
  getAddons,
  getFileDirectory,
  getFileSources,
  type AddonPropertyName,
  type AddonSummary,
  type FileDirectoryPropertyName,
  type FileMediaType,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { getAddonExcludedPaths } from './addonsStore.svelte';
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
export type MediaDirectoryEntryMediaKind = 'audio' | 'video' | 'unsupported';

export interface MediaDirectoryEntryCapabilitiesSnapshot {
  canBrowse: boolean;
  canPlay: boolean;
  canQueue: boolean;
  canDownload?: boolean;
}

export interface MediaDirectoryEntrySnapshot {
  id: string;
  routeId?: string;
  kind: MediaDirectoryEntryKind;
  label: string;
  thumbnail?: string;
  dateadded?: string;
  year?: number;
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
  | {
      ok: true;
      entry: {
        id: string;
        label: string;
        media: MediaFilesMedia;
        itemType: MediaDirectoryEntryKind;
        mediaKind: Exclude<MediaDirectoryEntryMediaKind, 'unsupported'>;
        file: string;
      };
    }
  | { ok: false; error: MusicLibrarySafeErrorSnapshot };

export type MediaFilesDownloadableEntryResult =
  | { ok: true; entry: { id: string; label: string; media: MediaFilesMedia; file: string } }
  | { ok: false; error: MusicLibrarySafeErrorSnapshot };

type SourceRecord = {
  id: string;
  label: string;
  path: string;
  sourceType: 'source' | 'addon' | 'playlist';
};

type EntryRecord = {
  id: string;
  label: string;
  path: string;
  kind: MediaDirectoryEntryKind;
  mediaKind: MediaDirectoryEntryMediaKind;
  thumbnail?: string;
  dateadded?: string;
  year?: number;
  playable: boolean;
  downloadable: boolean;
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
  'dateadded',
  'year',
  'file'
] as const satisfies readonly FileDirectoryPropertyName[];
const ADDON_SOURCE_PROPERTIES = ['path', 'name'] as const satisfies readonly AddonPropertyName[];
const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'm4a', 'aac', 'ogg', 'wav']);
const VIDEO_EXTENSIONS = new Set(['mkv', 'mp4', 'm4v', 'avi', 'mov', 'webm']);
const DIRECTORY_MIMETYPES = new Set(['x-directory/normal']);

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
      const [sourceResult, addonResult] = await Promise.all([
        getFileSources(client, this.#media),
        getBrowserAddons(client, this.#media).catch(() => ({ addons: [] }))
      ]);

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const sources = [
        ...normalizeSources(sourceResult.sources),
        ...normalizeAddonSources(addonResult.addons),
        createPlaylistSource(this.#media)
      ];
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

    if (!entry && looksPathLike(id)) {
      await this.openPath(id);
      return;
    }

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

  async openPath(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);

    if (!normalizedPath) {
      this.#recordInputError(unknownEntryError());
      return;
    }

    await this.#openDirectoryPath({
      path: normalizedPath,
      reason: `directory:${normalizedPath}`,
      breadcrumbs: breadcrumbsForPath(normalizedPath)
    });
  }

  getPlayableEntry(id: string): MediaFilesPlayableEntryResult {
    const entry = this.#entries.get(id);

    if (!entry) {
      return { ok: false, error: unknownEntryError() };
    }

    if (!entry.playable || entry.mediaKind === 'unsupported') {
      return { ok: false, error: unsupportedEntryError() };
    }

    return {
      ok: true,
      entry: {
        id: entry.id,
        label: entry.label,
        media: this.#media,
        itemType: entry.kind,
        mediaKind: entry.mediaKind,
        file: entry.path
      }
    };
  }

  getDownloadableEntry(id: string): MediaFilesDownloadableEntryResult {
    const entry = this.#entries.get(id);

    if (!entry) {
      return { ok: false, error: unknownEntryError() };
    }

    if (entry.kind !== 'file') {
      return { ok: false, error: unsupportedDownloadEntryError() };
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

      const kind: MediaDirectoryEntryKind = isDirectoryEntry(item) ? 'directory' : 'file';
      const id = `entry:${++this.#entryCounter}`;
      const label = normalizePublicLabel(item.label, path, `Entry ${this.#entryCounter}`);
      const extension = kind === 'file' ? extensionFromPath(path) : undefined;
      const thumbnail = stringValue(item.thumbnail);
      const dateadded = stringValue(item.dateadded);
      const year = numberValue(item.year);
      const mediaKind = entryMediaKindForExtension(this.#media, kind, extension);
      const playable = kind === 'directory' || mediaKind === 'audio' || mediaKind === 'video';
      const downloadable = kind === 'file' && !path.startsWith('plugin://');
      const record: EntryRecord = {
        id,
        label,
        path,
        kind,
        mediaKind,
        ...(thumbnail ? { thumbnail } : {}),
        ...(dateadded ? { dateadded } : {}),
        ...(year !== null ? { year } : {}),
        playable,
        downloadable
      };
      const snapshot: MediaDirectoryEntrySnapshot = {
        id,
        kind,
        label,
        ...(thumbnail ? { thumbnail } : {}),
        ...(dateadded ? { dateadded } : {}),
        ...(year !== null ? { year } : {}),
        ...(kind === 'file'
          ? {
              mediaKind,
              ...(extension ? { extension } : {})
            }
          : {}),
        capabilities:
          kind === 'directory'
            ? { canBrowse: true, canPlay: true, canQueue: true }
            : {
                canBrowse: false,
                canPlay: playable,
                canQueue: playable,
                canDownload: downloadable
              }
      };

      return [{ record, snapshot: withNonEnumerableRouteId(snapshot, path) }];
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

function entryMediaKindForExtension(
  media: MediaFilesMedia,
  kind: MediaDirectoryEntryKind,
  extension: string | undefined
): MediaDirectoryEntryMediaKind {
  if (kind === 'directory') {
    return media === 'video' ? 'video' : 'audio';
  }

  if (!extension) {
    return 'unsupported';
  }

  if (media === 'video') {
    return VIDEO_EXTENSIONS.has(extension) ? 'video' : 'unsupported';
  }

  return AUDIO_EXTENSIONS.has(extension) ? 'audio' : 'unsupported';
}

export function createMediaFilesStore(options: MediaFilesStoreOptions = {}): MediaFilesStore {
  return new MediaFilesStore(options);
}

export const mediaFilesStore = createMediaFilesStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

export const videoMediaFilesStore = createMediaFilesStore({
  createClient: createActiveKodiJsonRpcHttpClient,
  media: 'video'
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
        path,
        sourceType: 'source'
      }
    ];
  });
}

function sourceSnapshot(source: SourceRecord): MediaFileSourceSnapshot {
  return { id: source.id, label: source.label };
}

async function getBrowserAddons(
  client: KodiJsonRpcHttpClient,
  media: MediaFilesMedia
): Promise<{ addons?: AddonSummary[] }> {
  const type = media === 'video' ? 'xbmc.addon.video' : 'xbmc.addon.audio';
  return getAddons(client, {
    type,
    content: 'unknown',
    enabled: true,
    properties: ADDON_SOURCE_PROPERTIES
  });
}

function normalizeAddonSources(items: unknown): SourceRecord[] {
  return normalizeRecordList(items).flatMap((item): SourceRecord[] => {
    const addonid = stringValue(item.addonid);
    if (!addonid || !isSafeAddonId(addonid)) {
      return [];
    }

    return [
      {
        id: `addon:${addonid}`,
        label: normalizePublicLabel(item.name, addonid, addonid),
        path: `plugin://${addonid}/`,
        sourceType: 'addon'
      }
    ];
  });
}

function createPlaylistSource(media: MediaFilesMedia): SourceRecord {
  return {
    id: `playlist:${media}`,
    label: 'Playlists',
    path: `special://profile/playlists/${media}`,
    sourceType: 'playlist'
  };
}

function withNonEnumerableRouteId(
  snapshot: MediaDirectoryEntrySnapshot,
  routeId: string
): MediaDirectoryEntrySnapshot {
  return Object.defineProperty(snapshot, 'routeId', {
    value: routeId,
    enumerable: false,
    configurable: true
  });
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

function isDirectoryEntry(item: Record<string, unknown>): boolean {
  if (item.filetype === 'directory') {
    return true;
  }

  return typeof item.mimetype === 'string' && DIRECTORY_MIMETYPES.has(item.mimetype);
}

function breadcrumbsForPath(path: string): MediaFilesBreadcrumbSnapshot[] {
  const pluginMatch = path.match(/^plugin:\/\/([A-Za-z0-9._-]+)\/?(.*)$/);
  if (!pluginMatch) {
    return [{ id: path, label: basenameFromPath(path) ?? path }];
  }

  const [, addonid, rest = ''] = pluginMatch;
  const excludedPaths = new Set(getAddonExcludedPaths(addonid));
  const breadcrumbs: MediaFilesBreadcrumbSnapshot[] = [
    { id: `plugin://${addonid}/`, label: addonid }
  ];
  let current = `plugin://${addonid}/`;
  for (const rawPart of rest.split('/')) {
    const part = rawPart.trim();
    if (!part) continue;
    current += `${part}/`;
    if (!excludedPaths.has(current)) {
      breadcrumbs.push({ id: current, label: decodeURIComponent(part) });
    }
  }
  return breadcrumbs;
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

function isSafeAddonId(value: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(value);
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
  return entries.map((entry) => {
    const snapshot = {
      ...entry,
      capabilities: { ...entry.capabilities }
    };

    return entry.routeId ? withNonEnumerableRouteId(snapshot, entry.routeId) : snapshot;
  });
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

function unsupportedDownloadEntryError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unsupported-entry',
      'The selected media file entry cannot be downloaded.'
    )
  );
}

function normalizeRecordList(items: unknown): Record<string, unknown>[] {
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
