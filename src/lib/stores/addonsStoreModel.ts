import {
  KodiHttpClientError,
  executeAddon,
  getAddonDetails,
  getAddons,
  isKodiHttpClientError,
  setAddonEnabled,
  type AddonPropertyName,
  type AddonsGetAddonDetailsResult,
  type AddonsGetAddonsParams
} from '$lib/kodi';

import type {
  AddonEntityFilter,
  AddonSearchSetting,
  AddonSnapshot,
  AddonsErrorSource,
  AddonsGroupBy,
  AddonsGroupSnapshot,
  AddonsSafeErrorSnapshot,
  AddonsStoreMethods,
  AddonsStoreSnapshot,
  AddonsWriteCountsSnapshot
} from './addonsStoreTypes';

export const ADDON_PROPERTIES: readonly AddonPropertyName[] = [
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

export const DEFAULT_METHODS: AddonsStoreMethods = {
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
export const EXCLUDED_ADDON_PATHS: Readonly<Record<string, readonly string[]>> = {
  'plugin.video.youtube': [
    'plugin://plugin.video.youtube/special/',
    'plugin://plugin.video.youtube/kodion/search/',
    'plugin://plugin.video.youtube/kodion/',
    'plugin://plugin.video.youtube/channel/'
  ]
};
export const DEFAULT_COUNTS: AddonsWriteCountsSnapshot = { attempted: 0, succeeded: 0, failed: 0 };
export const DEFAULT_SNAPSHOT: AddonsStoreSnapshot = {
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

export const NO_ACTIVE_HOST_ERROR: AddonsSafeErrorSnapshot = {
  source: 'config',
  code: 'config/no-active-host',
  message: 'Choose an active Kodi host before loading add-ons.'
};
export const MALFORMED_RESPONSE_ERROR: AddonsSafeErrorSnapshot = {
  source: 'addons',
  code: 'addons/malformed-response',
  message: 'Kodi returned a malformed add-ons response.'
};
export const INVALID_ADDON_ID_ERROR: AddonsSafeErrorSnapshot = {
  source: 'validation',
  code: 'validation/invalid-addon-id',
  message: 'Use a safe add-on ID.'
};

export function createGetAddonsParams(): AddonsGetAddonsParams {
  return { enabled: 'all', properties: ADDON_PROPERTIES };
}

export function normalizeAddons(raw: unknown): AddonSnapshot[] {
  if (!Array.isArray(raw)) throw new AddonsMalformedResponseError();
  return raw.map(normalizeAddonDetail);
}

export function getAddonDetailPayload(result: AddonsGetAddonDetailsResult): unknown {
  return result.addondetails ?? result.addon;
}

export function normalizeAddonDetail(raw: unknown): AddonSnapshot {
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

export function recomputeDerived(snapshot: AddonsStoreSnapshot): AddonsStoreSnapshot {
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
    const bucket = buckets.get(key) ?? [];
    bucket.push(cloneAddon(addon));
    buckets.set(key, bucket);
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

export function addonMatchesEntityType(addon: AddonSnapshot, type: AddonEntityFilter): boolean {
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

export function replaceAddon(
  addons: readonly AddonSnapshot[],
  addon: AddonSnapshot
): AddonSnapshot[] {
  let replaced = false;
  const next = addons.map((candidate) => {
    if (candidate.addonid !== addon.addonid) return cloneAddon(candidate);
    replaced = true;
    return cloneAddon(addon);
  });
  if (!replaced) next.push(cloneAddon(addon));
  return next;
}

export function rollbackDetail(
  detail: AddonSnapshot | null,
  addonid: string,
  enabled: boolean | null
): AddonSnapshot | null {
  if (!detail) return null;
  if (detail.addonid !== addonid || enabled === null) return cloneAddon(detail);
  return { ...cloneAddon(detail), enabled };
}

export function rollbackAddons(
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

export function createSafeError(
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

export class AddonsMalformedResponseError extends Error {
  constructor() {
    super('Malformed Kodi add-ons response.');
  }
}

function sanitizeLabel(label: string, fallback: string): string {
  const sanitized = sanitizeScalar(label).trim();
  return sanitized.length > 0 ? sanitized : fallback;
}

export function sanitizeScalar(value: string): string {
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

export function isSafeAddonId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value);
}

export function cloneSnapshot(snapshot: AddonsStoreSnapshot): AddonsStoreSnapshot {
  return recomputeDerived(snapshot);
}

export function cloneAddon(addon: AddonSnapshot): AddonSnapshot {
  return { ...addon };
}

export function cloneError(error: AddonsSafeErrorSnapshot): AddonsSafeErrorSnapshot {
  return { ...error, ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {}) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
