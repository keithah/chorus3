import type { AddonDetailDispatch } from '$lib/components/AddonDetailShell.svelte';
import type { AddonsPanelDispatch } from '$lib/components/AddonsPanel.svelte';
import type { SettingsPanelDispatch } from '$lib/components/SettingsPanel.svelte';
import { parseAppRoute, type AppRoute } from '$lib/app/appRouter';
import type { AddonSnapshot, AddonsStoreSnapshot } from '$lib/stores/addonsStore.svelte';
import type { SettingsStoreSnapshot } from '$lib/stores/settingsStore.svelte';

export interface M005BrowserProofLocation {
  pathname?: unknown;
  search?: unknown;
}

export interface M005BrowserProofAppProps {
  route: AppRoute;
  settingsSnapshot?: SettingsStoreSnapshot;
  settingsDispatch?: SettingsPanelDispatch;
  addonsSnapshot?: AddonsStoreSnapshot;
  addonsDispatch?: AddonsPanelDispatch;
  addonDetailDispatch?: AddonDetailDispatch;
}

export const M005_BROWSER_PROOF_FORBIDDEN_TEXT = [
  'smb://',
  'special://',
  'file://',
  'http://',
  'https://',
  '://admin:',
  'Authorization',
  'Basic',
  'localStorage',
  'sessionStorage',
  'admin:p@ssword',
  'super-secret-password',
  'SENTINEL_SECRET',
  'CHORUS3_SENTINEL_SECRET'
] as const;

const fixtureTime = '2026-05-01T20:00:00.000Z';
const noop = async (): Promise<void> => undefined;

export function createM005BrowserProofAppProps(
  location: M005BrowserProofLocation | null | undefined = globalThis.window?.location
): M005BrowserProofAppProps {
  const route = parseAppRoute(readPathname(location), readSearch(location));

  if (route.kind === 'settings') {
    return {
      route,
      settingsSnapshot: createSettingsSnapshot(),
      settingsDispatch: createSettingsDispatch()
    };
  }

  if (route.kind === 'addons') {
    return {
      route,
      addonsSnapshot: createAddonsListSnapshot(),
      addonsDispatch: createAddonsDispatch()
    };
  }

  if (route.kind === 'addonDetail' && route.addonid === 'plugin.video.safe-demo') {
    return {
      route,
      addonsSnapshot: createAddonDetailSnapshot(),
      addonsDispatch: createAddonsDispatch(),
      addonDetailDispatch: createAddonDetailDispatch()
    };
  }

  return { route };
}

export function isM005BrowserProofFixtureSecretSafe(value: unknown): boolean {
  const text = collectFixtureText(value);
  return M005_BROWSER_PROOF_FORBIDDEN_TEXT.every((forbidden) => !text.includes(forbidden));
}

function createSettingsSnapshot(): SettingsStoreSnapshot {
  return {
    loadStatus: 'success',
    writeStatus: 'error',
    sections: [
      { id: 'player', label: 'Player' },
      { id: 'services', label: 'Services' }
    ],
    categories: [
      { id: 'videos', label: 'Videos' },
      { id: 'interface', label: 'Interface' }
    ],
    settings: [
      {
        id: 'videoplayer.autoplaynextitem',
        label: 'Autoplay next item',
        type: 'boolean',
        editKind: 'boolean',
        value: true,
        defaultValue: false,
        options: [],
        readOnly: false
      },
      {
        id: 'videoplayer.seeksteps',
        label: 'Seek step size',
        type: 'integer',
        editKind: 'integer',
        value: 30,
        defaultValue: 10,
        options: [],
        readOnly: false
      },
      {
        id: 'videoscreen.hdrtonemapping',
        label: 'HDR tone mapping',
        type: 'number',
        editKind: 'number',
        value: 0.75,
        defaultValue: 0.5,
        options: [],
        readOnly: false
      },
      {
        id: 'services.devicename',
        label: 'Friendly device name',
        type: 'string',
        editKind: 'string',
        value: 'Fixture Room Kodi',
        defaultValue: 'Kodi',
        options: [],
        readOnly: false
      },
      {
        id: 'videoplayer.upscalingmethod',
        label: 'Scaling method',
        type: 'string',
        editKind: 'enum',
        value: 'lanczos',
        defaultValue: 'nearest',
        options: [
          { value: 'nearest', label: 'Nearest' },
          { value: 'lanczos', label: 'Lanczos' },
          { value: 'spline36', label: 'Spline36' }
        ],
        readOnly: false
      },
      {
        id: 'fixture.pendingwrite',
        label: 'Pending write proof',
        type: 'boolean',
        editKind: 'boolean',
        value: false,
        defaultValue: false,
        options: [],
        readOnly: false
      },
      {
        id: 'fixture.savedwrite',
        label: 'Saved write proof',
        type: 'string',
        editKind: 'string',
        value: 'saved safe value',
        defaultValue: 'default safe value',
        options: [],
        readOnly: false
      },
      {
        id: 'fixture.rejectedwrite',
        label: 'Rejected write proof',
        type: 'string',
        editKind: 'string',
        value: 'previous safe value',
        defaultValue: 'previous safe value',
        options: [],
        readOnly: false
      },
      {
        id: 'filebrowser.source',
        label: 'Media source path',
        type: 'path',
        editKind: 'unsupported',
        value: 'redacted-file',
        defaultValue: null,
        options: [],
        readOnly: true
      },
      {
        id: 'services.webservercredentials',
        label: 'Web server credentials',
        type: 'custom',
        editKind: 'unsupported',
        value: '[redacted-credentials]',
        defaultValue: '[redacted-credentials]',
        options: [],
        readOnly: true
      }
    ],
    selectedSectionId: 'player',
    selectedCategoryId: 'videos',
    lastError: {
      source: 'write',
      code: 'fixture/rejected-write',
      message: 'A safe fixture write rejection was rolled back without contacting Kodi.'
    },
    lastWrite: {
      settingId: 'fixture.rejectedwrite',
      value: 'blocked fixture value',
      status: 'error',
      at: fixtureTime
    },
    rollbackValue: 'previous safe value',
    refreshAfterWrite: {
      settingId: 'fixture.pendingwrite',
      categoryId: 'videos',
      requestedAt: fixtureTime,
      refreshed: false
    },
    writeCounts: { attempted: 4, succeeded: 2, failed: 1 }
  };
}

function createSettingsDispatch(): SettingsPanelDispatch {
  return {
    load: noop,
    retry: noop,
    selectSection: noop,
    selectCategory: noop,
    setValue: noop
  };
}

function createFixtureAddons(): AddonSnapshot[] {
  return [
    {
      addonid: 'plugin.video.safe-demo',
      name: 'Safe Video Demo',
      version: '1.2.3',
      summary: 'Browse safe fixture videos.',
      description: 'A deterministic add-on detail used for no-live-Kodi proof.',
      author: 'Fixture Maintainers',
      enabled: false,
      installed: true,
      type: 'xbmc.python.pluginsource',
      broken: null,
      dependencyCount: 2,
      extrainfoCount: 1
    },
    {
      addonid: 'script.module.safe-helper',
      name: 'Safe Helper Module',
      version: '2.0.0',
      summary: 'Dependency helper fixture.',
      description: 'A helper add-on fixture.',
      author: 'Fixture Maintainers',
      enabled: true,
      installed: true,
      type: 'xbmc.python.module',
      broken: null,
      dependencyCount: 0,
      extrainfoCount: 0
    },
    {
      addonid: 'plugin.audio.safe-radio',
      name: 'Safe Radio',
      version: '0.9.0',
      summary: 'Audio stream fixture without transport details.',
      description: 'A disabled audio add-on fixture.',
      author: 'Fixture Maintainers',
      enabled: false,
      installed: true,
      type: 'xbmc.addon.audio',
      broken: 'Safe fixture dependency missing',
      dependencyCount: 1,
      extrainfoCount: 2
    }
  ];
}

function createAddonsListSnapshot(): AddonsStoreSnapshot {
  const addons = createFixtureAddons();
  return cloneAddonsSnapshot({
    loadStatus: 'success',
    detailStatus: 'idle',
    writeStatus: 'idle',
    addons,
    selectedAddonId: null,
    detail: null,
    searchQuery: 'safe',
    groupBy: 'type',
    visibleAddons: addons,
    groups: createTypeGroups(addons),
    pendingToggle: null,
    lastWrite: null,
    rollbackEnabled: null,
    refreshAfterWrite: null,
    writeCounts: { attempted: 3, succeeded: 1, failed: 1 },
    lastError: null
  });
}

function createAddonDetailSnapshot(): AddonsStoreSnapshot {
  const addons = createFixtureAddons();
  const detail = addons[0];
  return cloneAddonsSnapshot({
    loadStatus: 'success',
    detailStatus: 'success',
    writeStatus: 'error',
    addons,
    selectedAddonId: detail.addonid,
    detail,
    searchQuery: 'safe',
    groupBy: 'type',
    visibleAddons: addons,
    groups: createTypeGroups(addons),
    pendingToggle: {
      addonid: 'plugin.video.safe-demo',
      enabled: true,
      requestedAt: fixtureTime
    },
    lastWrite: {
      addonid: 'plugin.audio.safe-radio',
      enabled: false,
      status: 'error',
      at: fixtureTime
    },
    rollbackEnabled: true,
    refreshAfterWrite: {
      addonid: 'plugin.audio.safe-radio',
      requestedAt: fixtureTime,
      refreshed: false,
      warning: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
    },
    writeCounts: { attempted: 3, succeeded: 1, failed: 1 },
    lastError: {
      source: 'write',
      code: 'fixture.addon-write-rejected',
      message: 'Safe add-on write rejection was rolled back.'
    }
  });
}

function createTypeGroups(addons: AddonSnapshot[]): AddonsStoreSnapshot['groups'] {
  const byType = new Map<string, AddonSnapshot[]>();
  for (const addon of addons) {
    byType.set(addon.type, [...(byType.get(addon.type) ?? []), addon]);
  }
  return [...byType.entries()].map(([type, groupedAddons]) => ({
    key: type,
    label: type,
    addons: groupedAddons.map(cloneAddon)
  }));
}

function createAddonsDispatch(): AddonsPanelDispatch {
  return {
    load: noop,
    retry: noop,
    setSearchQuery: noop,
    setGroupBy: noop
  };
}

function createAddonDetailDispatch(): AddonDetailDispatch {
  return {
    load: noop,
    retry: noop,
    setAddonEnabled: noop,
    back: noop
  };
}

function cloneAddonsSnapshot(snapshot: AddonsStoreSnapshot): AddonsStoreSnapshot {
  return {
    ...snapshot,
    addons: snapshot.addons.map(cloneAddon),
    detail: snapshot.detail ? cloneAddon(snapshot.detail) : null,
    visibleAddons: snapshot.visibleAddons.map(cloneAddon),
    groups: snapshot.groups.map((group) => ({
      ...group,
      addons: group.addons.map(cloneAddon)
    })),
    pendingToggle: snapshot.pendingToggle ? { ...snapshot.pendingToggle } : null,
    lastWrite: snapshot.lastWrite ? { ...snapshot.lastWrite } : null,
    refreshAfterWrite: snapshot.refreshAfterWrite ? { ...snapshot.refreshAfterWrite } : null,
    writeCounts: { ...snapshot.writeCounts },
    lastError: snapshot.lastError ? { ...snapshot.lastError } : null
  };
}

function cloneAddon(addon: AddonSnapshot): AddonSnapshot {
  return { ...addon };
}

function readPathname(location: M005BrowserProofLocation | null | undefined): unknown {
  try {
    return location?.pathname;
  } catch {
    return undefined;
  }
}

function readSearch(location: M005BrowserProofLocation | null | undefined): unknown {
  try {
    return location?.search;
  } catch {
    return undefined;
  }
}

function collectFixtureText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'function') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(collectFixtureText).join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectFixtureText(nested)}`)
      .join('\n');
  }

  return '';
}
