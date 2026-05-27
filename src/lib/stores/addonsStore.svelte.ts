import {
  KodiHttpClientError,
  executeAddon,
  getAddonDetails,
  getAddons,
  isKodiHttpClientError,
  setAddonEnabled,
  type AddonPropertyName,
  type AddonsExecuteAddonParams,
  type AddonsExecuteAddonResult,
  type AddonsGetAddonDetailsParams,
  type AddonsGetAddonDetailsResult,
  type AddonsGetAddonsParams,
  type AddonsGetAddonsResult,
  type AddonsSetAddonEnabledParams,
  type AddonsSetAddonEnabledResult,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type AddonsLoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type AddonsDetailStatus = 'idle' | 'loading' | 'success' | 'error';
export type AddonsWriteStatus = 'idle' | 'pending' | 'success' | 'error';
export type AddonsGroupBy = 'none' | 'type' | 'enabled';
export type AddonsErrorSource = 'validation' | 'config' | 'http' | 'addons' | 'write' | 'refresh';

export interface AddonsSafeErrorSnapshot {
  source: AddonsErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface AddonSnapshot {
  addonid: string;
  name: string;
  version: string | null;
  summary: string | null;
  description: string | null;
  author: string | null;
  enabled: boolean | null;
  installed: boolean | null;
  type: string;
  provides?: string[];
  providesDefault?: string | null;
  browseMedia?: 'music' | 'video' | null;
  browsePath?: string | null;
  canExecute?: boolean;
  broken: boolean | string | null;
  dependencyCount: number;
  extrainfoCount: number;
}

export interface AddonsGroupSnapshot {
  key: string;
  label: string;
  addons: AddonSnapshot[];
}

export interface AddonsPendingToggleSnapshot {
  addonid: string;
  enabled: boolean;
  requestedAt: string;
}

export interface AddonsLastWriteSnapshot {
  addonid: string;
  enabled: boolean;
  status: Exclude<AddonsWriteStatus, 'idle'>;
  at: string;
}

export interface AddonsRefreshAfterWriteSnapshot {
  addonid: string;
  requestedAt: string;
  refreshed: boolean;
  warning: string | null;
}

export interface AddonsWriteCountsSnapshot {
  attempted: number;
  succeeded: number;
  failed: number;
}

export interface AddonsStoreSnapshot {
  loadStatus: AddonsLoadStatus;
  detailStatus: AddonsDetailStatus;
  writeStatus: AddonsWriteStatus;
  addons: AddonSnapshot[];
  selectedAddonId: string | null;
  detail: AddonSnapshot | null;
  searchQuery: string;
  groupBy: AddonsGroupBy;
  visibleAddons: AddonSnapshot[];
  groups: AddonsGroupSnapshot[];
  pendingToggle: AddonsPendingToggleSnapshot | null;
  lastWrite: AddonsLastWriteSnapshot | null;
  rollbackEnabled: boolean | null;
  refreshAfterWrite: AddonsRefreshAfterWriteSnapshot | null;
  writeCounts: AddonsWriteCountsSnapshot;
  lastError: AddonsSafeErrorSnapshot | null;
}

export type AddonEntityFilter = 'all' | 'video' | 'audio' | 'executable' | string;

export interface AddonSearchSetting {
  id: string;
  url: string;
  title: string;
  media: 'music' | 'video';
}

export interface AddonsStoreMethods {
  getAddons(
    client: KodiJsonRpcHttpClient,
    params?: AddonsGetAddonsParams
  ): Promise<AddonsGetAddonsResult>;
  getAddonDetails(
    client: KodiJsonRpcHttpClient,
    params: AddonsGetAddonDetailsParams
  ): Promise<AddonsGetAddonDetailsResult>;
  setAddonEnabled(
    client: KodiJsonRpcHttpClient,
    params: AddonsSetAddonEnabledParams
  ): Promise<AddonsSetAddonEnabledResult>;
  executeAddon(
    client: KodiJsonRpcHttpClient,
    params: AddonsExecuteAddonParams
  ): Promise<AddonsExecuteAddonResult>;
}

export interface AddonsStoreOptions {
  createClient?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  clientProvider?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  methods?: AddonsStoreMethods;
  now?: () => string;
}

const ADDON_PROPERTIES: readonly AddonPropertyName[] = [
  'name',
  'version',
  'summary',
  'description',
  'path',
  'author',
  'thumbnail',
  'disclaimer',
  'fanart',
  'broken',
  'dependencies',
  'extrainfo',
  'rating',
  'enabled'
];

const DEFAULT_METHODS: AddonsStoreMethods = {
  getAddons,
  getAddonDetails,
  setAddonEnabled,
  executeAddon
};
const KNOWN_ADDON_SEARCH_SETTINGS: Readonly<
  Record<string, readonly Omit<AddonSearchSetting, 'id'>[]>
> = {
  'plugin.audio.googlemusic.exp': [
    {
      url: 'plugin://plugin.audio.googlemusic.exp/?path=search_result&type=track&query=[QUERY]',
      title: 'GoogleMusic',
      media: 'music'
    }
  ],
  'plugin.audio.mixcloud': [
    {
      url: 'plugin://plugin.audio.mixcloud/?mode=30&key=cloudcast&offset=0&query=[QUERY]',
      title: 'MixCloud',
      media: 'music'
    }
  ],
  'plugin.audio.radio_de': [
    {
      url: 'plugin://plugin.audio.radio_de/stations/search/[QUERY]',
      title: 'Radio',
      media: 'music'
    }
  ],
  'plugin.audio.soundcloud': [
    {
      url: 'plugin://plugin.audio.soundcloud/search/?query=[QUERY]',
      title: 'SoundCloud',
      media: 'music'
    }
  ],
  'plugin.video.youtube': [
    {
      url: 'plugin://plugin.video.youtube/search/?q=[QUERY]',
      title: 'YouTube',
      media: 'video'
    }
  ]
};
const EXCLUDED_ADDON_PATHS: Readonly<Record<string, readonly string[]>> = {
  'plugin.video.youtube': [
    'plugin://plugin.video.youtube/special/',
    'plugin://plugin.video.youtube/kodion/search/',
    'plugin://plugin.video.youtube/kodion/',
    'plugin://plugin.video.youtube/channel/'
  ]
};
const DEFAULT_COUNTS: AddonsWriteCountsSnapshot = { attempted: 0, succeeded: 0, failed: 0 };
const DEFAULT_SNAPSHOT: AddonsStoreSnapshot = {
  loadStatus: 'idle',
  detailStatus: 'idle',
  writeStatus: 'idle',
  addons: [],
  selectedAddonId: null,
  detail: null,
  searchQuery: '',
  groupBy: 'none',
  visibleAddons: [],
  groups: [],
  pendingToggle: null,
  lastWrite: null,
  rollbackEnabled: null,
  refreshAfterWrite: null,
  writeCounts: DEFAULT_COUNTS,
  lastError: null
};

const NO_ACTIVE_HOST_ERROR: AddonsSafeErrorSnapshot = {
  source: 'config',
  code: 'config/no-active-host',
  message: 'Choose an active Kodi host before loading add-ons.'
};
const MALFORMED_RESPONSE_ERROR: AddonsSafeErrorSnapshot = {
  source: 'addons',
  code: 'addons/malformed-response',
  message: 'Kodi returned a malformed add-ons response.'
};
const INVALID_ADDON_ID_ERROR: AddonsSafeErrorSnapshot = {
  source: 'validation',
  code: 'validation/invalid-addon-id',
  message: 'Use a safe add-on ID.'
};

export class AddonsStore {
  #snapshot = $state<AddonsStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));
  readonly #createClient: () =>
    | KodiJsonRpcHttpClient
    | null
    | Promise<KodiJsonRpcHttpClient | null>;
  readonly #methods: AddonsStoreMethods;
  readonly #now: () => string;
  #listRequestId = 0;
  #detailRequestId = 0;

  constructor(options: AddonsStoreOptions = {}) {
    this.#createClient =
      options.createClient ?? options.clientProvider ?? createActiveKodiJsonRpcHttpClient;
    this.#methods = options.methods ?? DEFAULT_METHODS;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): AddonsStoreSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  reset(): void {
    this.#listRequestId += 1;
    this.#detailRequestId += 1;
    this.#snapshot = cloneSnapshot(DEFAULT_SNAPSHOT);
  }

  getAddonEntities(type: AddonEntityFilter = 'all'): AddonSnapshot[] {
    return this.#snapshot.addons
      .filter((addon) => addonMatchesEntityType(addon, type))
      .map(cloneAddon);
  }

  getEnabledAddons(): AddonSnapshot[] {
    return this.#snapshot.addons.filter((addon) => addon.enabled === true).map(cloneAddon);
  }

  isAddonEnabled(
    filter: Partial<Pick<AddonSnapshot, 'addonid' | 'name' | 'type'>> = {}
  ): AddonSnapshot | null {
    const match = this.getEnabledAddons().find((addon) =>
      Object.entries(filter).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return addon[key as keyof Pick<AddonSnapshot, 'addonid' | 'name' | 'type'>] === value;
      })
    );
    return match ? cloneAddon(match) : null;
  }

  getSearchSettings(
    addons: readonly AddonSnapshot[] = this.getEnabledAddons()
  ): AddonSearchSetting[] {
    return addons.flatMap((addon) => getAddonSearchSettings(addon.addonid));
  }

  getExcludedPaths(addonid: string): string[] {
    return getAddonExcludedPaths(addonid);
  }

  async loadAddons(): Promise<void> {
    const requestId = this.#beginListLoad();
    const client = await this.#resolveClient();
    if (!client) {
      this.#failListLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const addons = normalizeAddons(
        (await this.#methods.getAddons(client, createGetAddonsParams())).addons
      );
      this.#commitListLoad(requestId, addons);
    } catch (error) {
      this.#failListLoad(requestId, createSafeError(error, 'addons'));
    }
  }

  setSearchQuery(query: string): void {
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      searchQuery: sanitizeScalar(query).trim()
    });
  }

  setGroupBy(groupBy: AddonsGroupBy): void {
    this.#snapshot = recomputeDerived({ ...this.#snapshot, groupBy });
  }

  async loadAddonDetail(addonid: string): Promise<void> {
    if (!isSafeAddonId(addonid)) {
      this.#snapshot = {
        ...this.#snapshot,
        detailStatus: 'error',
        lastError: cloneError(INVALID_ADDON_ID_ERROR)
      };
      return;
    }

    const requestId = this.#beginDetailLoad(addonid);
    const client = await this.#resolveClient();
    if (!client) {
      this.#failDetailLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const detail = normalizeAddonDetail(
        getAddonDetailPayload(
          await this.#methods.getAddonDetails(client, {
            addonid,
            properties: ADDON_PROPERTIES
          })
        )
      );
      this.#commitDetailLoad(requestId, detail);
    } catch (error) {
      this.#failDetailLoad(requestId, createSafeError(error, 'addons'));
    }
  }

  async setAddonEnabled(addonid: string, enabled: boolean): Promise<void> {
    if (!isSafeAddonId(addonid) || typeof enabled !== 'boolean') {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: cloneError(INVALID_ADDON_ID_ERROR)
      };
      return;
    }

    const previousEnabled = this.#findKnownEnabled(addonid);
    const requestedAt = this.#now();
    const client = await this.#resolveClient();
    if (!client) {
      this.#setWriteError(NO_ACTIVE_HOST_ERROR, addonid, enabled, previousEnabled, false);
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'pending',
      lastError: null,
      pendingToggle: { addonid, enabled, requestedAt },
      rollbackEnabled: previousEnabled,
      lastWrite: { addonid, enabled, status: 'pending', at: requestedAt },
      refreshAfterWrite: { addonid, requestedAt, refreshed: false, warning: null },
      writeCounts: {
        ...this.#snapshot.writeCounts,
        attempted: this.#snapshot.writeCounts.attempted + 1
      }
    };

    try {
      await this.#methods.setAddonEnabled(client, { addonid, enabled });
    } catch (error) {
      this.#setWriteError(createSafeError(error, 'write'), addonid, enabled, previousEnabled, true);
      return;
    }

    const refreshError = await this.#refreshAfterSuccessfulWrite(client, addonid);
    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'success',
      pendingToggle: null,
      lastWrite: { addonid, enabled, status: 'success', at: requestedAt },
      lastError: refreshError,
      refreshAfterWrite: {
        addonid,
        requestedAt,
        refreshed: refreshError === null,
        warning: refreshError ? refreshError.message : null
      },
      writeCounts: {
        ...this.#snapshot.writeCounts,
        succeeded: this.#snapshot.writeCounts.succeeded + 1
      }
    };
  }

  async executeAddon(addonid: string): Promise<void> {
    if (!isSafeAddonId(addonid)) {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: cloneError(INVALID_ADDON_ID_ERROR)
      };
      return;
    }

    const client = await this.#resolveClient();
    if (!client) {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: cloneError(NO_ACTIVE_HOST_ERROR),
        writeCounts: { ...this.#snapshot.writeCounts }
      };
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'pending',
      lastError: null,
      writeCounts: {
        ...this.#snapshot.writeCounts,
        attempted: this.#snapshot.writeCounts.attempted + 1
      }
    };

    try {
      await this.#methods.executeAddon(client, { addonid });
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: createSafeError(error, 'write'),
        writeCounts: {
          ...this.#snapshot.writeCounts,
          failed: this.#snapshot.writeCounts.failed + 1
        }
      };
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'success',
      lastError: null,
      writeCounts: {
        ...this.#snapshot.writeCounts,
        succeeded: this.#snapshot.writeCounts.succeeded + 1
      }
    };
  }

  async #refreshAfterSuccessfulWrite(
    client: KodiJsonRpcHttpClient,
    addonid: string
  ): Promise<AddonsSafeErrorSnapshot | null> {
    try {
      const detail = normalizeAddonDetail(
        getAddonDetailPayload(
          await this.#methods.getAddonDetails(client, { addonid, properties: ADDON_PROPERTIES })
        )
      );
      let addons = this.#snapshot.addons;
      try {
        addons = normalizeAddons(
          (await this.#methods.getAddons(client, createGetAddonsParams())).addons
        );
      } catch {
        addons = this.#snapshot.addons;
      }
      addons = replaceAddon(addons, detail);
      this.#snapshot = recomputeDerived({
        ...this.#snapshot,
        detailStatus: 'success',
        selectedAddonId: detail.addonid,
        detail,
        addons
      });
      return null;
    } catch (error) {
      return {
        ...createSafeError(error, 'refresh'),
        source: 'refresh',
        code: 'refresh/failed',
        message: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
      };
    }
  }

  #findKnownEnabled(addonid: string): boolean | null {
    if (
      this.#snapshot.detail?.addonid === addonid &&
      typeof this.#snapshot.detail.enabled === 'boolean'
    ) {
      return this.#snapshot.detail.enabled;
    }
    const addon = this.#snapshot.addons.find((candidate) => candidate.addonid === addonid);
    return typeof addon?.enabled === 'boolean' ? addon.enabled : null;
  }

  #beginListLoad(): number {
    this.#listRequestId += 1;
    this.#snapshot = { ...this.#snapshot, loadStatus: 'loading', lastError: null };
    return this.#listRequestId;
  }

  #commitListLoad(requestId: number, addons: AddonSnapshot[]): void {
    if (requestId !== this.#listRequestId) return;
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      loadStatus: 'success',
      addons,
      lastError: null
    });
  }

  #failListLoad(requestId: number, error: AddonsSafeErrorSnapshot): void {
    if (requestId !== this.#listRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      loadStatus: 'error',
      lastError: cloneError(error)
    };
  }

  #beginDetailLoad(addonid: string): number {
    this.#detailRequestId += 1;
    this.#snapshot = {
      ...this.#snapshot,
      detailStatus: 'loading',
      selectedAddonId: addonid,
      lastError: null
    };
    return this.#detailRequestId;
  }

  #commitDetailLoad(requestId: number, detail: AddonSnapshot): void {
    if (requestId !== this.#detailRequestId) return;
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      detailStatus: 'success',
      selectedAddonId: detail.addonid,
      detail,
      addons: replaceAddon(this.#snapshot.addons, detail),
      lastError: null
    });
  }

  #failDetailLoad(requestId: number, error: AddonsSafeErrorSnapshot): void {
    if (requestId !== this.#detailRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      detailStatus: 'error',
      lastError: cloneError(error)
    };
  }

  #setWriteError(
    error: AddonsSafeErrorSnapshot,
    addonid: string,
    enabled: boolean,
    rollbackEnabled: boolean | null,
    incrementFailed: boolean
  ): void {
    const at = this.#now();
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      writeStatus: 'error',
      pendingToggle: null,
      lastError: cloneError(error),
      lastWrite: { addonid, enabled, status: 'error', at },
      rollbackEnabled,
      detail: rollbackDetail(this.#snapshot.detail, addonid, rollbackEnabled),
      addons: rollbackAddons(this.#snapshot.addons, addonid, rollbackEnabled),
      writeCounts: incrementFailed
        ? { ...this.#snapshot.writeCounts, failed: this.#snapshot.writeCounts.failed + 1 }
        : { ...this.#snapshot.writeCounts }
    });
  }

  async #resolveClient(): Promise<KodiJsonRpcHttpClient | null> {
    try {
      return await this.#createClient();
    } catch {
      return null;
    }
  }
}

function createGetAddonsParams(): AddonsGetAddonsParams {
  return { enabled: 'all', properties: ADDON_PROPERTIES };
}

function normalizeAddons(raw: unknown): AddonSnapshot[] {
  if (!Array.isArray(raw)) throw new AddonsMalformedResponseError();
  return raw.map(normalizeAddonDetail);
}

function getAddonDetailPayload(result: AddonsGetAddonDetailsResult): unknown {
  return result.addondetails ?? result.addon;
}

function normalizeAddonDetail(raw: unknown): AddonSnapshot {
  if (!isRecord(raw) || typeof raw.addonid !== 'string' || !isSafeAddonId(raw.addonid)) {
    throw new AddonsMalformedResponseError();
  }

  return {
    addonid: raw.addonid,
    name: sanitizeLabel(typeof raw.name === 'string' ? raw.name : raw.addonid, 'Untitled add-on'),
    version: optionalSanitizedString(raw.version),
    summary: optionalSanitizedString(raw.summary),
    description: optionalSanitizedString(raw.description),
    author: optionalSanitizedString(raw.author),
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : null,
    installed: typeof raw.installed === 'boolean' ? raw.installed : null,
    type: sanitizeLabel(typeof raw.type === 'string' ? raw.type : 'unknown', 'unknown'),
    ...normalizeAddonProvides(raw),
    broken: normalizeBroken(raw.broken),
    dependencyCount: countCollection(raw.dependencies),
    extrainfoCount: countCollection(raw.extrainfo)
  };
}

function normalizeAddonProvides(
  raw: Record<string, unknown>
): Pick<
  AddonSnapshot,
  'provides' | 'providesDefault' | 'browseMedia' | 'browsePath' | 'canExecute'
> {
  const provides = normalizeProvides(raw.extrainfo);
  const providesDefault = provides[0] ?? null;
  const browseMedia =
    providesDefault === 'video' ? 'video' : providesDefault === 'audio' ? 'music' : null;
  const browsePath = browseMedia ? `plugin://${raw.addonid}/` : null;
  const type = typeof raw.type === 'string' ? raw.type.toLowerCase() : '';
  const canExecute =
    provides.includes('executable') ||
    type === 'xbmc.addon.executable' ||
    type.includes('.executable') ||
    type === 'xbmc.python.script' ||
    type.includes('.script');

  return {
    provides,
    providesDefault,
    browseMedia,
    browsePath,
    canExecute
  };
}

function normalizeProvides(raw: unknown): string[] {
  const supported = new Set(['video', 'audio', 'executable']);
  const values = new Set<string>();
  const items = Array.isArray(raw) ? raw : isRecord(raw) ? Object.values(raw) : [];

  for (const item of items) {
    if (!isRecord(item)) continue;
    const key = typeof item.key === 'string' ? item.key.toLowerCase() : '';
    const value = typeof item.value === 'string' ? item.value.toLowerCase() : '';
    if (key === 'provides' && supported.has(value)) {
      values.add(value);
    }
  }

  return [...values];
}

function normalizeBroken(raw: unknown): boolean | string | null {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') return sanitizeScalar(raw);
  return null;
}

function countCollection(raw: unknown): number {
  if (Array.isArray(raw)) return raw.length;
  if (isRecord(raw)) return Object.keys(raw).length;
  return 0;
}

function optionalSanitizedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const sanitized = sanitizeScalar(value).trim();
  return sanitized.length > 0 ? sanitized : null;
}

function recomputeDerived(snapshot: AddonsStoreSnapshot): AddonsStoreSnapshot {
  const addons = snapshot.addons.map(cloneAddon);
  const detail = snapshot.detail ? cloneAddon(snapshot.detail) : null;
  const visibleAddons = filterAddons(addons, snapshot.searchQuery);
  return {
    ...snapshot,
    addons,
    detail,
    visibleAddons: visibleAddons.map(cloneAddon),
    groups: groupAddons(visibleAddons, snapshot.groupBy),
    pendingToggle: snapshot.pendingToggle ? { ...snapshot.pendingToggle } : null,
    lastWrite: snapshot.lastWrite ? { ...snapshot.lastWrite } : null,
    refreshAfterWrite: snapshot.refreshAfterWrite ? { ...snapshot.refreshAfterWrite } : null,
    writeCounts: { ...snapshot.writeCounts },
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null
  };
}

function filterAddons(addons: readonly AddonSnapshot[], query: string): AddonSnapshot[] {
  const terms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0 && !term.includes('[redacted'));
  if (terms.length === 0) return addons.map(cloneAddon);
  return addons
    .filter((addon) => {
      const haystack = [
        addon.addonid,
        addon.name,
        addon.summary,
        addon.description,
        addon.author,
        addon.type
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .map(cloneAddon);
}

function groupAddons(
  addons: readonly AddonSnapshot[],
  groupBy: AddonsGroupBy
): AddonsGroupSnapshot[] {
  if (groupBy === 'none') return [];
  const buckets = new Map<string, AddonSnapshot[]>();
  for (const addon of addons) {
    const key = groupBy === 'enabled' ? enabledGroupKey(addon.enabled) : addon.type;
    buckets.set(key, [...(buckets.get(key) ?? []), cloneAddon(addon)]);
  }

  return [...buckets.entries()].map(([key, groupedAddons]) => ({
    key,
    label: groupBy === 'enabled' ? enabledGroupLabel(key) : key,
    addons: groupedAddons.map(cloneAddon)
  }));
}

function enabledGroupKey(enabled: boolean | null): string {
  if (enabled === true) return 'enabled';
  if (enabled === false) return 'disabled';
  return 'unknown';
}

function enabledGroupLabel(key: string): string {
  if (key === 'enabled') return 'Enabled';
  if (key === 'disabled') return 'Disabled';
  return 'Unknown';
}

function addonMatchesEntityType(addon: AddonSnapshot, type: AddonEntityFilter): boolean {
  const normalizedType = type.toLowerCase();
  if (normalizedType === 'all') {
    return (
      addonMatchesEntityType(addon, 'video') ||
      addonMatchesEntityType(addon, 'audio') ||
      addonMatchesEntityType(addon, 'executable')
    );
  }
  if (normalizedType === 'executable') return addonCanExecute(addon);
  if (normalizedType === 'video' || normalizedType === 'audio') {
    const provides = Array.isArray(addon.provides) ? addon.provides : [];
    if (provides.length > 0) return provides.includes(normalizedType);
  }

  const addonType = addon.type.toLowerCase();
  return addonType === `xbmc.addon.${normalizedType}` || addonType.includes(`.${normalizedType}`);
}

function addonCanExecute(addon: AddonSnapshot): boolean {
  if (addon.canExecute === true) return true;
  const type = addon.type.toLowerCase();
  return (
    type === 'xbmc.addon.executable' ||
    type.includes('.executable') ||
    type === 'xbmc.python.script' ||
    type.includes('.script')
  );
}

export function getAddonSearchSettings(addonid: string): AddonSearchSetting[] {
  if (!isSafeAddonId(addonid)) return [];
  const settings = KNOWN_ADDON_SEARCH_SETTINGS[addonid] ?? [];
  return settings.map((setting, index) => ({
    id: `${addonid}.${index}`,
    ...setting
  }));
}

export function getAddonExcludedPaths(addonid: string): string[] {
  if (!isSafeAddonId(addonid)) return [];
  return [...(EXCLUDED_ADDON_PATHS[addonid] ?? [])];
}

function replaceAddon(addons: readonly AddonSnapshot[], addon: AddonSnapshot): AddonSnapshot[] {
  let replaced = false;
  const next = addons.map((candidate) => {
    if (candidate.addonid !== addon.addonid) return cloneAddon(candidate);
    replaced = true;
    return cloneAddon(addon);
  });
  if (!replaced) next.push(cloneAddon(addon));
  return next;
}

function rollbackDetail(
  detail: AddonSnapshot | null,
  addonid: string,
  enabled: boolean | null
): AddonSnapshot | null {
  if (!detail) return null;
  if (detail.addonid !== addonid || enabled === null) return cloneAddon(detail);
  return { ...cloneAddon(detail), enabled };
}

function rollbackAddons(
  addons: readonly AddonSnapshot[],
  addonid: string,
  enabled: boolean | null
): AddonSnapshot[] {
  return addons.map((addon) =>
    addon.addonid === addonid && enabled !== null
      ? { ...cloneAddon(addon), enabled }
      : cloneAddon(addon)
  );
}

function createSafeError(
  error: unknown,
  fallbackSource: AddonsErrorSource
): AddonsSafeErrorSnapshot {
  if (error instanceof AddonsMalformedResponseError) return MALFORMED_RESPONSE_ERROR;
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeScalar(error.message),
      endpoint: error.endpoint
    };
  }
  if (isErrorWithCode(error)) {
    return {
      source: fallbackSource,
      code: error.code,
      message: sanitizeScalar(error.message)
    };
  }
  return {
    source: fallbackSource,
    code: `${fallbackSource}/failed`,
    message: sanitizeScalar(
      error instanceof Error ? error.message : 'Kodi add-ons operation failed.'
    )
  };
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && typeof (error as { code?: unknown }).code === 'string';
}

class AddonsMalformedResponseError extends Error {
  constructor() {
    super('Malformed Kodi add-ons response.');
  }
}

function sanitizeLabel(label: string, fallback: string): string {
  const sanitized = sanitizeScalar(label).trim();
  return sanitized.length > 0 ? sanitized : fallback;
}

function sanitizeScalar(value: string): string {
  return value
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
    .replace(/\/[\w./-]+/gi, '[redacted-path]')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/sessionStorage/gi, 'browser storage')
    .replace(/CHORUS_SENTINEL_SECRET|SENTINEL_SECRET/gi, '[redacted-sentinel]')
    .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
    .replace(/password/gi, 'credentials');
}

function isSafeAddonId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value);
}

function cloneSnapshot(snapshot: AddonsStoreSnapshot): AddonsStoreSnapshot {
  return recomputeDerived(snapshot);
}

function cloneAddon(addon: AddonSnapshot): AddonSnapshot {
  return { ...addon };
}

function cloneError(error: AddonsSafeErrorSnapshot): AddonsSafeErrorSnapshot {
  return { ...error, ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {}) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function createAddonsStore(options: AddonsStoreOptions = {}): AddonsStore {
  return new AddonsStore(options);
}

export const addonsStore = createAddonsStore();
