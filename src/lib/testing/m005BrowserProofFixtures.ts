import type { AddonDetailDispatch } from '$lib/components/AddonDetailShell.svelte';
import type { AddonsPanelDispatch } from '$lib/components/AddonsPanel.svelte';
import type { SettingsPanelDispatch } from '$lib/components/SettingsPanel.svelte';
import type { PlayerControlsDispatch } from '$lib/components/PlayerControls.svelte';
import { parseAppRoute, type AppRoute } from '$lib/app/appRouter';
import {
  parseNowPlayingRouteQuery,
  type NowPlayingRouteQuery
} from '$lib/app/nowPlayingRouteQuery';
import type { AddonSnapshot, AddonsStoreSnapshot } from '$lib/stores/addonsStore.svelte';
import type { SettingsStoreSnapshot } from '$lib/stores/settingsStore.svelte';
import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';
import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
import { isLocale, type Locale } from '$lib/i18n';
import type { LocaleStoreSnapshot } from '$lib/stores/locale.svelte';

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
  playerSnapshot?: PlayerStoreSnapshot;
  playerDispatch?: PlayerControlsDispatch;
  localPlayerSnapshot?: LocalPlayerStoreSnapshot;
  nowPlayingRouteQuery?: NowPlayingRouteQuery;
  localeSnapshot?: LocaleStoreSnapshot;
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
  'CHORUS3_SENTINEL_SECRET',
  'raw body',
  'raw payload'
] as const;

const fixtureTime = '2026-05-01T20:00:00.000Z';
const noop = async (): Promise<void> => undefined;

export function createM005BrowserProofAppProps(
  location: M005BrowserProofLocation | null | undefined = globalThis.window?.location
): M005BrowserProofAppProps {
  const route = parseAppRoute(readPathname(location), readSearch(location));
  const localeSnapshot = createLocaleSnapshot(location);

  if (isSettingsFixtureRoute(route)) {
    return {
      route,
      settingsSnapshot: createSettingsSnapshot(),
      settingsDispatch: createSettingsDispatch(),
      ...(localeSnapshot ? { localeSnapshot } : {})
    };
  }

  if (isAddonsListFixtureRoute(route)) {
    return {
      route,
      addonsSnapshot: createAddonsListSnapshot(),
      addonsDispatch: createAddonsDispatch()
    };
  }

  if (isAddonDetailFixtureRoute(route, 'plugin.video.safe-demo')) {
    return {
      route,
      addonsSnapshot: createAddonDetailSnapshot(),
      addonsDispatch: createAddonsDispatch(),
      addonDetailDispatch: createAddonDetailDispatch()
    };
  }

  if (route.kind === 'nowPlaying') {
    const query = parseNowPlayingRouteQuery(readSearch(location));
    const setupMode = readNowPlayingRouteFixtureState(location) === 'setup';

    return {
      route,
      playerSnapshot: setupMode
        ? createNowPlayingSetupPlayerSnapshot()
        : createNowPlayingPlayerSnapshot(),
      playerDispatch: createNowPlayingDispatch(),
      localPlayerSnapshot: createNowPlayingLocalPlayerSnapshot(),
      nowPlayingRouteQuery: query,
      ...(query.locale ? { localeSnapshot: { locale: query.locale } } : {})
    };
  }

  return { route };
}

function isSettingsFixtureRoute(route: AppRoute): boolean {
  return (
    route.kind === 'settings' ||
    (route.kind === 'primary' &&
      (route.route.kind === 'settingsWeb' ||
        route.route.kind === 'settingsKodi' ||
        route.route.kind === 'settingsKodiSection'))
  );
}

function isAddonsListFixtureRoute(route: AppRoute): boolean {
  return (
    route.kind === 'addons' ||
    (route.kind === 'primary' &&
      (route.route.kind === 'addonsAll' ||
        route.route.kind === 'addonsVideo' ||
        route.route.kind === 'addonsAudio' ||
        route.route.kind === 'addonsExecutable'))
  );
}

function isAddonDetailFixtureRoute(route: AppRoute, addonid: string): boolean {
  return (
    (route.kind === 'addonDetail' && route.addonid === addonid) ||
    (route.kind === 'primary' &&
      route.route.kind === 'addonDetail' &&
      route.route.addonid === addonid)
  );
}

export function isM005BrowserProofFixtureSecretSafe(value: unknown): boolean {
  const text = collectFixtureText(value);
  return M005_BROWSER_PROOF_FORBIDDEN_TEXT.every((forbidden) => !text.includes(forbidden));
}

function createLocaleSnapshot(
  location: M005BrowserProofLocation | null | undefined
): LocaleStoreSnapshot | null {
  const locale = readLocaleQuery(location);
  return locale ? { locale } : null;
}

function readLocaleQuery(location: M005BrowserProofLocation | null | undefined): Locale | null {
  const search = readSearch(location);
  if (typeof search !== 'string' || search.length === 0) {
    return null;
  }

  try {
    const params = new URLSearchParams(search);
    const values = params.getAll('locale');
    if (values.length !== 1) {
      return null;
    }
    const value = values[0];
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

function readNowPlayingRouteFixtureState(
  location: M005BrowserProofLocation | null | undefined
): 'active' | 'setup' {
  const search = readSearch(location);
  if (typeof search !== 'string' || search.length === 0) {
    return 'active';
  }

  try {
    return new URLSearchParams(search).get('player-state') === 'setup' ? 'setup' : 'active';
  } catch {
    return 'active';
  }
}

function createNowPlayingPlayerSnapshot(): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: null,
    lastUpdatedAt: fixtureTime,
    activePlayers: [{ playerid: 1, type: 'video' }],
    primaryPlayer: { playerid: 1, type: 'video' },
    item: {
      label: 'Aurora Signal',
      title: 'Aurora Signal',
      showtitle: 'Fixture Series',
      season: 1,
      episode: 2,
      file: 'opaque-media-token',
      thumbnail: 'poster:aurora-signal'
    },
    properties: {
      type: 'video',
      percentage: 37.5,
      shuffled: false,
      repeat: 'off',
      subtitleenabled: false,
      subtitles: [],
      currentaudiostream: { index: 0, name: 'Main mix', language: 'eng', channels: 2 },
      audiostreams: [{ index: 0, name: 'Main mix', language: 'eng', channels: 2, codec: 'aac' }]
    },
    application: { volume: 64, muted: false },
    queue: { playlistid: 1, position: 3 },
    time: { currentSeconds: 45, totalSeconds: 120 },
    lastError: null
  };
}

function createNowPlayingSetupPlayerSnapshot(): PlayerStoreSnapshot {
  return {
    refreshStatus: 'idle',
    playbackStatus: 'none',
    lastRefreshReason: 'init',
    lastQueueRefreshReason: null,
    lastUpdatedAt: null,
    activePlayers: [],
    primaryPlayer: null,
    item: null,
    properties: null,
    application: { volume: null, muted: null },
    queue: { playlistid: null, position: null },
    time: { currentSeconds: null, totalSeconds: null },
    lastError: null
  };
}

function createNowPlayingLocalPlayerSnapshot(): LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'video',
    source: null,
    item: null,
    currentSeconds: 0,
    durationSeconds: null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null
  };
}

function createNowPlayingDispatch(): PlayerControlsDispatch {
  return {
    snapshot: createNowPlayingDispatchSnapshot(),
    playPause: noop,
    stop: noop,
    previous: noop,
    next: noop,
    seekPercentage: noop,
    seekRelativeSeconds: noop,
    setVolume: noop,
    toggleMute: noop,
    setShuffle: noop,
    setPartyMode: noop,
    setRepeat: noop,
    setSubtitle: noop,
    setAudioStream: noop,
    startLocalPlayback: noop,
    resumeOnKodi: noop
  };
}

function createNowPlayingDispatchSnapshot(): PlayerDispatchSnapshot {
  return {
    mode: 'kodi',
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null
  };
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
      provides: ['video'],
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
      canExecute: true,
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
      provides: ['audio'],
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
    const group = byType.get(addon.type);
    if (group) {
      group.push(addon);
    } else {
      byType.set(addon.type, [addon]);
    }
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
    setGroupBy: noop,
    setAddonEnabled: noop
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
