import { isTextSecretSafe, redactDiagnosticText } from '$lib/safety/redaction';

export const THUMBS_UP_STORAGE_KEY = 'chorus3.thumbsUp';

export type ThumbsUpMedia =
  | 'song'
  | 'artist'
  | 'album'
  | 'tvshow'
  | 'movie'
  | 'episode'
  | 'musicvideo';

export interface ThumbsUpItemInput {
  media: ThumbsUpMedia;
  id: number;
  label: string;
  subtitle?: string;
  thumbnail?: string;
  file?: string;
}

export interface ThumbsUpItemSnapshot extends ThumbsUpItemInput {
  addedAt: string;
}

export interface ThumbsUpStoreSnapshot {
  groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>;
  total: number;
  lastUpdatedAt: string | null;
  storageWarning: string | null;
}

export interface ThumbsUpStoreOptions {
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  now?: () => string;
}

export interface ThumbsUpDispatch {
  toggleItem(item: ThumbsUpItemInput): void;
  removeItem(media: ThumbsUpMedia, id: number): void;
  hasItem(media: ThumbsUpMedia, id: number): boolean;
}

type ThumbsUpPayload = {
  groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>;
};

const MEDIA_ORDER: readonly ThumbsUpMedia[] = [
  'song',
  'artist',
  'album',
  'tvshow',
  'movie',
  'episode',
  'musicvideo'
];

const DEFAULT_GROUPS = createEmptyGroups();

export class ThumbsUpStore implements ThumbsUpDispatch {
  #snapshot = $state<ThumbsUpStoreSnapshot>({
    groups: cloneGroups(DEFAULT_GROUPS),
    total: 0,
    lastUpdatedAt: null,
    storageWarning: null
  });

  readonly #storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  readonly #now: () => string;
  #ids = createEmptyIdSets();

  constructor(options: ThumbsUpStoreOptions = {}) {
    this.#storage = options.storage ?? globalThis.localStorage ?? null;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#load();
  }

  get snapshot(): ThumbsUpStoreSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  toggleItem(item: ThumbsUpItemInput): void {
    const normalized = normalizeInput(item, this.#now());
    if (!normalized) {
      return;
    }

    const group = this.#snapshot.groups[normalized.media];
    const exists = this.#ids[normalized.media].has(normalized.id);
    const nextGroup = exists
      ? group.filter((candidate) => candidate.id !== normalized.id)
      : [normalized, ...group.filter((candidate) => candidate.id !== normalized.id)];

    this.#setGroups({
      ...this.#snapshot.groups,
      [normalized.media]: nextGroup
    });
  }

  removeItem(media: ThumbsUpMedia, id: number): void {
    if (!isSupportedMedia(media) || !isPositiveInteger(id)) {
      return;
    }

    this.#setGroups({
      ...this.#snapshot.groups,
      [media]: this.#snapshot.groups[media].filter((item) => item.id !== id)
    });
  }

  hasItem(media: ThumbsUpMedia, id: number): boolean {
    return isSupportedMedia(media) && isPositiveInteger(id) && this.#ids[media].has(id);
  }

  #setGroups(groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>): void {
    const now = this.#now();
    const sanitized = sanitizeGroups(groups);
    this.#snapshot = {
      groups: sanitized,
      total: totalItems(sanitized),
      lastUpdatedAt: now,
      storageWarning: null
    };
    this.#ids = createIdSets(sanitized);
    this.#persist();
  }

  #load(): void {
    if (!this.#storage) {
      return;
    }

    try {
      const raw = this.#storage.getItem(THUMBS_UP_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      const payload = validatePayload(parsed);
      this.#snapshot = {
        groups: payload.groups,
        total: totalItems(payload.groups),
        lastUpdatedAt: null,
        storageWarning: null
      };
      this.#ids = createIdSets(payload.groups);
    } catch {
      this.#snapshot = {
        groups: cloneGroups(DEFAULT_GROUPS),
        total: 0,
        lastUpdatedAt: null,
        storageWarning: 'Stored thumbs-up data could not be loaded.'
      };
      this.#ids = createEmptyIdSets();
    }
  }

  #persist(): void {
    if (!this.#storage) {
      return;
    }

    try {
      this.#storage.setItem(
        THUMBS_UP_STORAGE_KEY,
        JSON.stringify({ groups: this.#snapshot.groups } satisfies ThumbsUpPayload)
      );
    } catch {
      this.#snapshot = {
        ...this.#snapshot,
        storageWarning: 'Thumbs-up data could not be saved in this browser.'
      };
    }
  }
}

export function createThumbsUpStore(options: ThumbsUpStoreOptions = {}): ThumbsUpStore {
  return new ThumbsUpStore(options);
}

export const thumbsUpStore = createThumbsUpStore();

function validatePayload(value: unknown): ThumbsUpPayload {
  const input = recordValue(value);
  const rawGroups = recordValue(input?.groups);
  const groups = createEmptyGroups();

  for (const media of MEDIA_ORDER) {
    const rawItems = Array.isArray(rawGroups?.[media]) ? rawGroups[media] : [];
    groups[media] = rawItems.flatMap((item): ThumbsUpItemSnapshot[] => {
      const normalized = normalizeInput(item, stringValue(recordValue(item)?.addedAt) ?? '');
      return normalized ? [normalized] : [];
    });
  }

  return { groups };
}

function normalizeInput(value: unknown, addedAt: string): ThumbsUpItemSnapshot | null {
  const input = recordValue(value);
  if (!input) {
    return null;
  }

  const media = input?.media;
  const id = input?.id;
  const label = stringValue(input?.label);

  if (!isSupportedMedia(media) || !isPositiveInteger(id) || !label) {
    return null;
  }

  const source = input;
  return {
    media,
    id,
    label,
    addedAt: addedAt || new Date(0).toISOString(),
    ...optionalSafeString('subtitle', source.subtitle),
    ...optionalSafeString('thumbnail', source.thumbnail),
    ...optionalSafeString('file', source.file)
  };
}

function sanitizeGroups(
  groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>
): Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]> {
  const next = createEmptyGroups();
  for (const media of MEDIA_ORDER) {
    const seen = new Set<number>();
    next[media] = groups[media].flatMap((item): ThumbsUpItemSnapshot[] => {
      if (seen.has(item.id)) {
        return [];
      }
      seen.add(item.id);
      const normalized = normalizeInput(item, item.addedAt);
      return normalized ? [normalized] : [];
    });
  }
  return next;
}

function createEmptyGroups(): Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]> {
  return {
    song: [],
    artist: [],
    album: [],
    tvshow: [],
    movie: [],
    episode: [],
    musicvideo: []
  };
}

function createEmptyIdSets(): Record<ThumbsUpMedia, Set<number>> {
  return Object.fromEntries(MEDIA_ORDER.map((media) => [media, new Set<number>()])) as Record<
    ThumbsUpMedia,
    Set<number>
  >;
}

function createIdSets(
  groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>
): Record<ThumbsUpMedia, Set<number>> {
  return Object.fromEntries(
    MEDIA_ORDER.map((media) => [media, new Set(groups[media].map((item) => item.id))])
  ) as Record<ThumbsUpMedia, Set<number>>;
}

function cloneSnapshot(snapshot: ThumbsUpStoreSnapshot): ThumbsUpStoreSnapshot {
  return {
    groups: cloneGroups(snapshot.groups),
    total: snapshot.total,
    lastUpdatedAt: snapshot.lastUpdatedAt,
    storageWarning: snapshot.storageWarning
  };
}

function cloneGroups(
  groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>
): Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]> {
  return Object.fromEntries(
    MEDIA_ORDER.map((media) => [media, groups[media].map((item) => ({ ...item }))])
  ) as Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>;
}

function totalItems(groups: Record<ThumbsUpMedia, ThumbsUpItemSnapshot[]>): number {
  return MEDIA_ORDER.reduce((total, media) => total + groups[media].length, 0);
}

function isSupportedMedia(value: unknown): value is ThumbsUpMedia {
  return typeof value === 'string' && (MEDIA_ORDER as readonly string[]).includes(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return isTextSecretSafe(trimmed) ? trimmed : redactDiagnosticText(trimmed);
}

function optionalSafeString<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, string>> {
  const text = stringValue(value);
  return text ? ({ [key]: text } as Partial<Record<Key, string>>) : {};
}
