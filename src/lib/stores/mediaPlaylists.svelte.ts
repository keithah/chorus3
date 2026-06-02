import {
  type FileDirectoryPropertyName,
  type FileMediaType,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { getPagedFileDirectory } from './mediaDirectoryPages';
import {
  MusicLibraryClientError,
  cloneMusicLibrarySafeError,
  createMusicLibrarySafeError,
  type MusicLibraryRefreshStatus,
  type MusicLibrarySafeErrorSnapshot
} from './musicLibraryNormalization';

export type MediaPlaylistsMedia = Extract<FileMediaType, 'music' | 'video'>;
export type MediaPlaylistsRefreshStatus = MusicLibraryRefreshStatus;
export type MediaPlaylistsRefreshReason =
  | 'init'
  | 'manual'
  | `playlist:${string}`
  | `error:${string}`;
export type MediaPlaylistKind = 'smart' | 'basic' | 'unsupported';
export type MediaPlaylistEntryMediaKind = 'audio' | 'video' | 'unsupported';

export interface MediaPlaylistCapabilitiesSnapshot {
  canBrowse: boolean;
  canPlay: boolean;
  canQueue: boolean;
}

export interface MediaPlaylistSnapshot {
  id: string;
  label: string;
  media: MediaPlaylistsMedia;
  kind: MediaPlaylistKind;
  extension?: string;
  capabilities: MediaPlaylistCapabilitiesSnapshot;
}

export interface MediaPlaylistEntrySnapshot {
  id: string;
  label: string;
  mediaKind: MediaPlaylistEntryMediaKind;
  extension?: string;
  capabilities: Pick<MediaPlaylistCapabilitiesSnapshot, 'canPlay' | 'canQueue'>;
}

export interface MediaPlaylistsBreadcrumbSnapshot {
  id: string;
  label: string;
}

export interface MediaPlaylistsStoreSnapshot {
  refreshStatus: MediaPlaylistsRefreshStatus;
  lastRefreshReason: MediaPlaylistsRefreshReason;
  lastUpdatedAt: string | null;
  media: MediaPlaylistsMedia;
  playlists: MediaPlaylistSnapshot[];
  entries: MediaPlaylistEntrySnapshot[];
  breadcrumbs: MediaPlaylistsBreadcrumbSnapshot[];
  isEmpty: boolean;
  lastError: MusicLibrarySafeErrorSnapshot | null;
}

export interface MediaPlaylistsStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  media?: MediaPlaylistsMedia;
  now?: () => string;
}

export type MediaPlaylistsPlayablePlaylistResult =
  | {
      ok: true;
      playlist: {
        id: string;
        label: string;
        mediaKind: MediaPlaylistsMedia;
        playlistKind: Exclude<MediaPlaylistKind, 'unsupported'>;
        file: string;
      };
    }
  | { ok: false; error: MusicLibrarySafeErrorSnapshot };

export type MediaPlaylistsPlayableEntryResult =
  | {
      ok: true;
      entry: {
        id: string;
        label: string;
        media: MediaPlaylistsMedia;
        mediaKind: 'audio' | 'video';
        file: string;
      };
    }
  | { ok: false; error: MusicLibrarySafeErrorSnapshot };

type PlaylistRecord = {
  id: string;
  label: string;
  path: string;
  kind: MediaPlaylistKind;
  extension?: string;
  playable: boolean;
  browsable: boolean;
};

type EntryRecord = {
  id: string;
  label: string;
  path: string;
  playable: boolean;
  extension?: string;
};

const DEFAULT_MEDIA: MediaPlaylistsMedia = 'music';
const MUSIC_PLAYLIST_ROOT = 'special://musicplaylists';
const VIDEO_PLAYLIST_ROOT = 'special://videoplaylists';
const DIRECTORY_SORT = { method: 'label', order: 'ascending' } as const;
const ROOT_PROPERTIES = ['title', 'file'] as const satisfies readonly FileDirectoryPropertyName[];
const ENTRY_PROPERTIES = [
  'title',
  'artist',
  'album',
  'duration',
  'track',
  'thumbnail',
  'file'
] as const satisfies readonly FileDirectoryPropertyName[];
const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'm4a', 'aac', 'ogg', 'wav']);
const VIDEO_EXTENSIONS = new Set(['mkv', 'mp4', 'm4v', 'avi', 'mov', 'webm']);
const BASIC_PLAYLIST_EXTENSIONS = new Set(['m3u', 'pls']);

function defaultSnapshot(media: MediaPlaylistsMedia): MediaPlaylistsStoreSnapshot {
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    media,
    playlists: [],
    entries: [],
    breadcrumbs: [],
    isEmpty: true,
    lastError: null
  };
}

export class MediaPlaylistsStore {
  #snapshot = $state<MediaPlaylistsStoreSnapshot>(defaultSnapshot(DEFAULT_MEDIA));

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: (() => KodiJsonRpcHttpClient | null) | null;
  readonly #media: MediaPlaylistsMedia;
  readonly #now: () => string;

  #requestId = 0;
  #playlists = new Map<string, PlaylistRecord>();
  #entries = new Map<string, EntryRecord>();
  #entryCounter = 0;

  constructor(options: MediaPlaylistsStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? null;
    this.#media = options.media ?? DEFAULT_MEDIA;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#snapshot = cloneMediaPlaylistsSnapshot(defaultSnapshot(this.#media));
  }

  get snapshot(): MediaPlaylistsStoreSnapshot {
    return cloneMediaPlaylistsSnapshot(this.#snapshot);
  }

  async refreshPlaylists(): Promise<void> {
    const requestId = ++this.#requestId;
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: 'manual',
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const result = await getPagedFileDirectory(client, {
        directory: playlistRootForMedia(this.#media),
        media: this.#media,
        properties: ROOT_PROPERTIES,
        sort: DIRECTORY_SORT
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const playlists = this.#normalizePlaylists(result.files);
      this.#playlists = new Map(playlists.map((playlist) => [playlist.record.id, playlist.record]));
      this.#entries = new Map();
      this.#entryCounter = 0;

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: 'manual',
        lastUpdatedAt: this.#now(),
        media: this.#media,
        playlists: playlists.map((playlist) => playlist.snapshot),
        entries: [],
        breadcrumbs: [],
        isEmpty: playlists.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createSafeError(error);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: `error:${safeError.code}`,
        lastUpdatedAt: this.#now(),
        lastError: safeError
      };
    }
  }

  async openPlaylist(id: string): Promise<void> {
    const playlist = this.#playlists.get(id);

    if (!playlist) {
      this.#recordInputError(unknownPlaylistError());
      return;
    }

    if (!playlist.browsable) {
      this.#recordInputError(unsupportedPlaylistError());
      return;
    }

    const requestId = ++this.#requestId;
    const breadcrumbs = [{ id: playlist.id, label: playlist.label }];
    this.#snapshot = {
      ...this.#snapshot,
      refreshStatus: 'loading',
      lastRefreshReason: `playlist:${playlist.id}`,
      breadcrumbs: cloneBreadcrumbs(breadcrumbs),
      lastError: null
    };

    try {
      const client = this.#resolveClient();
      const result = await getPagedFileDirectory(client, {
        directory: playlist.path,
        media: this.#media,
        properties: ENTRY_PROPERTIES,
        sort: DIRECTORY_SORT
      });

      if (!this.#isCurrent(requestId)) {
        return;
      }

      const entries = this.#normalizeEntries(result.files);
      this.#entries = new Map(entries.map((entry) => [entry.record.id, entry.record]));

      this.#snapshot = {
        refreshStatus: 'ready',
        lastRefreshReason: `playlist:${playlist.id}`,
        lastUpdatedAt: this.#now(),
        media: this.#media,
        playlists: clonePlaylists(this.#snapshot.playlists),
        entries: entries.map((entry) => entry.snapshot),
        breadcrumbs: cloneBreadcrumbs(breadcrumbs),
        isEmpty: entries.length === 0,
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrent(requestId)) {
        return;
      }

      const safeError = createSafeError(error);
      this.#snapshot = {
        ...this.#snapshot,
        refreshStatus: 'error',
        lastRefreshReason: `error:${safeError.code}`,
        lastUpdatedAt: this.#now(),
        lastError: safeError
      };
    }
  }

  getPlayableEntry(id: string): MediaPlaylistsPlayableEntryResult {
    const entry = this.#entries.get(id);

    if (!entry) {
      return { ok: false, error: unknownEntryError() };
    }

    if (!entry.playable) {
      return { ok: false, error: unsupportedEntryError() };
    }

    const mediaKind = entryMediaKindForExtension(
      this.#media,
      undefined,
      extensionFromPath(entry.path)
    );

    if (mediaKind !== 'audio' && mediaKind !== 'video') {
      return { ok: false, error: unsupportedEntryError() };
    }

    return {
      ok: true,
      entry: {
        id: entry.id,
        label: entry.label,
        media: this.#media,
        mediaKind,
        file: entry.path
      }
    };
  }

  getPlayablePlaylist(id: string): MediaPlaylistsPlayablePlaylistResult {
    const playlist = this.#playlists.get(id);

    if (!playlist) {
      return { ok: false, error: unknownPlaylistError() };
    }

    if (!playlist.playable) {
      return { ok: false, error: unsupportedPlaylistError() };
    }

    if (playlist.kind === 'unsupported') {
      return { ok: false, error: unsupportedPlaylistError() };
    }

    return {
      ok: true,
      playlist: {
        id: playlist.id,
        label: playlist.label,
        mediaKind: this.#media,
        playlistKind: playlist.kind,
        file: playlist.path
      }
    };
  }

  clear(): void {
    this.#requestId += 1;
    this.#playlists = new Map();
    this.#entries = new Map();
    this.#entryCounter = 0;
    this.#snapshot = cloneMediaPlaylistsSnapshot(defaultSnapshot(this.#media));
  }

  destroy(): void {
    this.#requestId += 1;
  }

  #normalizePlaylists(
    items: unknown
  ): { record: PlaylistRecord; snapshot: MediaPlaylistSnapshot }[] {
    let counter = 0;

    return normalizeRecordList(items).flatMap((item) => {
      const path = normalizePath(item.file);
      if (!path) {
        return [];
      }

      const extension = extensionFromPath(path);
      const kind = playlistKindForExtension(extension);
      if (kind === 'unsupported') {
        return [];
      }

      const id = `playlist:${++counter}`;
      const label = normalizePublicLabel(item.label, path, `Playlist ${counter}`);
      const playable = kind === 'smart' || kind === 'basic';
      const browsable = kind === 'smart';
      const record: PlaylistRecord = {
        id,
        label,
        path,
        kind,
        ...(extension ? { extension } : {}),
        playable,
        browsable
      };
      const snapshot: MediaPlaylistSnapshot = {
        id,
        label,
        media: this.#media,
        kind,
        ...(extension ? { extension } : {}),
        capabilities: {
          canBrowse: browsable,
          canPlay: playable,
          canQueue: playable
        }
      };

      return [{ record, snapshot }];
    });
  }

  #normalizeEntries(
    items: unknown
  ): { record: EntryRecord; snapshot: MediaPlaylistEntrySnapshot }[] {
    this.#entryCounter = 0;

    return normalizeRecordList(items).flatMap((item) => {
      const path = normalizePath(item.file);
      if (!path) {
        return [];
      }

      const id = `entry:${++this.#entryCounter}`;
      const label = normalizePublicLabel(item.label, path, `Entry ${this.#entryCounter}`);
      const extension = extensionFromPath(path);
      const mediaKind = entryMediaKindForExtension(this.#media, item.filetype, extension);
      const playable = mediaKind === 'audio' || mediaKind === 'video';
      const record: EntryRecord = {
        id,
        label,
        path,
        playable,
        ...(extension ? { extension } : {})
      };
      const snapshot: MediaPlaylistEntrySnapshot = {
        id,
        label,
        mediaKind,
        ...(extension ? { extension } : {}),
        capabilities: { canPlay: playable, canQueue: playable }
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
        'Kodi HTTP client is not configured for media playlists.'
      );
    }

    return client;
  }

  #isCurrent(requestId: number): boolean {
    return requestId === this.#requestId;
  }
}

export function createMediaPlaylistsStore(
  options: MediaPlaylistsStoreOptions = {}
): MediaPlaylistsStore {
  return new MediaPlaylistsStore(options);
}

export const mediaPlaylistsStore = createMediaPlaylistsStore({
  createClient: createActiveKodiJsonRpcHttpClient
});

export const videoMediaPlaylistsStore = createMediaPlaylistsStore({
  media: 'video',
  createClient: createActiveKodiJsonRpcHttpClient
});

function playlistRootForMedia(media: MediaPlaylistsMedia): string {
  return media === 'video' ? VIDEO_PLAYLIST_ROOT : MUSIC_PLAYLIST_ROOT;
}

function playlistKindForExtension(extension: string | undefined): MediaPlaylistKind {
  if (extension === 'xsp') {
    return 'smart';
  }

  if (extension && BASIC_PLAYLIST_EXTENSIONS.has(extension)) {
    return 'basic';
  }

  return 'unsupported';
}

function entryMediaKindForExtension(
  media: MediaPlaylistsMedia,
  filetype: unknown,
  extension: string | undefined
): MediaPlaylistEntryMediaKind {
  if (filetype === 'directory' || !extension) {
    return 'unsupported';
  }

  if (media === 'video') {
    return VIDEO_EXTENSIONS.has(extension) ? 'video' : 'unsupported';
  }

  return AUDIO_EXTENSIONS.has(extension) ? 'audio' : 'unsupported';
}

function createSafeError(error: unknown): MusicLibrarySafeErrorSnapshot {
  const safeError = createMusicLibrarySafeError(error);
  return {
    ...safeError,
    message: sanitizeAdditionalSensitiveText(safeError.message),
    ...(safeError.endpoint ? { endpoint: { ...safeError.endpoint } } : {})
  };
}

function sanitizeAdditionalSensitiveText(message: string): string {
  return message
    .replace(/[a-z]:\\[^\s,]+/gi, 'redacted-path')
    .replace(/\/(?:mnt|home|users|var|tmp)\/[^\s,]+/gi, 'redacted-path')
    .replace(/special:\/\/(?:music|video)playlists[^\s,]*/gi, 'redacted-playlist');
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

function cloneMediaPlaylistsSnapshot(
  snapshot: MediaPlaylistsStoreSnapshot
): MediaPlaylistsStoreSnapshot {
  return {
    ...snapshot,
    playlists: clonePlaylists(snapshot.playlists),
    entries: cloneEntries(snapshot.entries),
    breadcrumbs: cloneBreadcrumbs(snapshot.breadcrumbs),
    lastError: cloneMusicLibrarySafeError(snapshot.lastError)
  };
}

function clonePlaylists(playlists: readonly MediaPlaylistSnapshot[]): MediaPlaylistSnapshot[] {
  return playlists.map((playlist) => ({
    ...playlist,
    capabilities: { ...playlist.capabilities }
  }));
}

function cloneEntries(
  entries: readonly MediaPlaylistEntrySnapshot[]
): MediaPlaylistEntrySnapshot[] {
  return entries.map((entry) => ({
    ...entry,
    capabilities: { ...entry.capabilities }
  }));
}

function cloneBreadcrumbs(
  breadcrumbs: readonly MediaPlaylistsBreadcrumbSnapshot[]
): MediaPlaylistsBreadcrumbSnapshot[] {
  return breadcrumbs.map((breadcrumb) => ({ ...breadcrumb }));
}

function unknownEntryError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unknown-entry',
      'The selected playlist entry is no longer available.'
    )
  );
}

function unsupportedEntryError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unsupported-entry',
      'The selected playlist entry cannot be played from this view.'
    )
  );
}

function unknownPlaylistError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unknown-playlist',
      'The selected playlist is no longer available.'
    )
  );
}

function unsupportedPlaylistError(): MusicLibrarySafeErrorSnapshot {
  return createMusicLibrarySafeError(
    new MusicLibraryClientError(
      'client/unsupported-playlist',
      'The selected playlist format is not supported.'
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
