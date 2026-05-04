import type { PlayerControlsDispatch } from '$lib/components/PlayerControls.svelte';
import type { QueuePanelDispatch } from '$lib/components/QueuePanel.svelte';
import type {
  LocalPlaylistDispatch,
  LocalPlaylistStoreSnapshot,
  PlayerDispatchSnapshot,
  PlayerStoreSnapshot,
  QueueDispatchSnapshot,
  QueueStoreSnapshot
} from '$lib/stores';
import { KODI_WEBINTERFACE_BASE_PATH, parseAppRoute, type AppRoute } from '$lib/app/appRouter';
import {
  createM003BrowserProofAppProps,
  isM003BrowserProofFixtureSecretSafe,
  M003_BROWSER_PROOF_FORBIDDEN_TEXT,
  type M003BrowserProofAppProps
} from './m003BrowserProofFixtures';
import {
  createM004BrowserProofAppProps,
  isM004BrowserProofFixtureSecretSafe,
  M004_BROWSER_PROOF_FORBIDDEN_TEXT,
  type M004BrowserProofAppProps,
  type M004BrowserProofLocation
} from './m004BrowserProofFixtures';
import {
  createM005BrowserProofAppProps,
  isM005BrowserProofFixtureSecretSafe,
  M005_BROWSER_PROOF_FORBIDDEN_TEXT,
  type M005BrowserProofAppProps
} from './m005BrowserProofFixtures';

export interface M007VisualProofLocation {
  pathname?: unknown;
  search?: unknown;
}

export type M007VisualProofAppProps = {
  route: AppRoute;
  playerSnapshot: PlayerStoreSnapshot;
  playerDispatch: PlayerControlsDispatch;
  queueSnapshot: QueueStoreSnapshot;
  queueDispatch: QueuePanelDispatch;
  localPlaylistSnapshot: LocalPlaylistStoreSnapshot;
  localPlaylistDispatch: LocalPlaylistDispatch;
  m007ProofSnapshot: {
    fixture: 'm007-visual-proof';
    visibleLabels: string[];
  };
} & Partial<
  Omit<M003BrowserProofAppProps & M004BrowserProofAppProps & M005BrowserProofAppProps, 'route'>
>;

export const M007_VISUAL_PROOF_FORBIDDEN_TEXT = [
  ...M003_BROWSER_PROOF_FORBIDDEN_TEXT,
  ...M004_BROWSER_PROOF_FORBIDDEN_TEXT,
  ...M005_BROWSER_PROOF_FORBIDDEN_TEXT,
  'password=',
  'token=',
  'username=',
  'endpoint=',
  'storage=',
  'JSON-RPC body',
  'raw file path'
] as const;

const fixtureTime = '2026-05-04T12:00:00.000Z';
const noop = async (): Promise<void> => undefined;

export function createM007VisualProofAppProps(
  location: M007VisualProofLocation | null | undefined = globalThis.window?.location
): M007VisualProofAppProps {
  const route = normalizeVisualProofRoute(location);
  const m004Props = createM004BrowserProofAppProps(toM004FixtureLocation(location, route));
  const m005Props = normalizeM005AddonsForM007(
    createM005BrowserProofAppProps(toSafeFixtureLocation(location))
  );

  return {
    route,
    ...createM003BrowserProofAppProps(),
    ...withoutRoute(m004Props),
    ...withoutRoute(m005Props),
    playerSnapshot: createPlayerSnapshot(),
    playerDispatch: createPlayerDispatch(),
    queueSnapshot: createQueueSnapshot(),
    queueDispatch: createQueueDispatch(),
    localPlaylistSnapshot: createLocalPlaylistSnapshot(),
    localPlaylistDispatch: createLocalPlaylistDispatch(),
    m007ProofSnapshot: createProofSnapshot(route)
  };
}

export function isM007VisualProofFixtureSecretSafe(value: unknown): boolean {
  return (
    isM003BrowserProofFixtureSecretSafe(value) &&
    isM004BrowserProofFixtureSecretSafe(value) &&
    isM005BrowserProofFixtureSecretSafe(value) &&
    M007_VISUAL_PROOF_FORBIDDEN_TEXT.every(
      (forbidden) => !collectFixtureText(value).includes(forbidden)
    )
  );
}

function normalizeVisualProofRoute(location: M007VisualProofLocation | null | undefined): AppRoute {
  let route: AppRoute;

  try {
    route = parseAppRoute(readPathname(location), readSearch(location), {
      packageBasePath: KODI_WEBINTERFACE_BASE_PATH
    });
  } catch {
    return { kind: 'primary', route: { kind: 'home' } };
  }

  if (isSupportedVisualProofRoute(route)) {
    return route;
  }

  return { kind: 'primary', route: { kind: 'home' } };
}

function isSupportedVisualProofRoute(route: AppRoute): boolean {
  if (route.kind === 'primary') {
    return [
      'home',
      'music',
      'movies',
      'moviesRecent',
      'movieDetail',
      'tvshows',
      'tvshowsRecent',
      'tvshowDetail',
      'tvshowSeasonDetail',
      'tvshowEpisodeDetail',
      'browser',
      'browserItem',
      'addonsAll',
      'addonsVideo',
      'addonDetail',
      'playlists',
      'playlistDetail',
      'settingsWeb',
      'settingsKodi',
      'settingsKodiSection',
      'help',
      'helpOverview',
      'helpPage',
      'helpReadme',
      'helpChangelog',
      'helpTranslations',
      'helpLicense',
      'helpAddons',
      'helpDevelopers',
      'remote'
    ].includes(route.route.kind);
  }

  return false;
}

function toSafeFixtureLocation(
  location: M007VisualProofLocation | null | undefined
): M007VisualProofLocation {
  return {
    pathname: stripPackageBasePath(readPathname(location)),
    search: '?m005-browser-proof=1'
  };
}

function stripPackageBasePath(pathname: unknown): unknown {
  if (typeof pathname !== 'string') {
    return pathname;
  }

  if (pathname === KODI_WEBINTERFACE_BASE_PATH) {
    return '/';
  }

  if (pathname.startsWith(`${KODI_WEBINTERFACE_BASE_PATH}/`)) {
    return pathname.slice(KODI_WEBINTERFACE_BASE_PATH.length) || '/';
  }

  return pathname;
}

function normalizeM005AddonsForM007(props: M005BrowserProofAppProps): M005BrowserProofAppProps {
  if (!props.addonsSnapshot) {
    return props;
  }

  const addons = props.addonsSnapshot.addons.map((addon) =>
    addon.addonid === 'plugin.video.safe-demo' ? { ...addon, type: 'xbmc.addon.video' } : addon
  );
  const visibleAddons = props.addonsSnapshot.visibleAddons.map((addon) =>
    addon.addonid === 'plugin.video.safe-demo' ? { ...addon, type: 'xbmc.addon.video' } : addon
  );
  const detail =
    props.addonsSnapshot.detail?.addonid === 'plugin.video.safe-demo'
      ? { ...props.addonsSnapshot.detail, type: 'xbmc.addon.video' }
      : props.addonsSnapshot.detail;

  return {
    ...props,
    addonsSnapshot: {
      ...props.addonsSnapshot,
      addons,
      visibleAddons,
      detail,
      groups: [
        {
          key: 'xbmc.addon.video',
          label: 'xbmc.addon.video',
          addons: addons.filter((addon) => addon.addonid === 'plugin.video.safe-demo')
        },
        ...props.addonsSnapshot.groups.filter((group) => group.key !== 'xbmc.python.pluginsource')
      ]
    }
  };
}

function toM004FixtureLocation(
  location: M007VisualProofLocation | null | undefined,
  route: AppRoute
): M004BrowserProofLocation {
  return {
    pathname: toVideoFixturePathname(route) ?? readPathname(location),
    search: '?m004-browser-proof=1'
  };
}

function toVideoFixturePathname(route: AppRoute): string | undefined {
  if (route.kind !== 'primary') {
    return undefined;
  }

  switch (route.route.kind) {
    case 'movies':
    case 'moviesRecent':
      return '/video/movies';
    case 'movieDetail':
      return `/video/movies/${route.route.movieid}`;
    case 'tvshows':
    case 'tvshowsRecent':
      return '/video/tv';
    case 'tvshowDetail':
      return `/video/tv/${route.route.tvshowid}`;
    case 'tvshowSeasonDetail':
      return `/video/tv/${route.route.tvshowid}/seasons/${route.route.season}`;
    case 'tvshowEpisodeDetail':
      return `/video/tv/${route.route.tvshowid}/seasons/${route.route.season}/episodes/${route.route.episodeid}`;
    default:
      return undefined;
  }
}

function withoutRoute<T extends { route?: unknown }>(value: T): Omit<T, 'route'> {
  const { route, ...rest } = value;
  void route;
  return rest;
}

function createPlayerSnapshot(): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: 'manual',
    lastUpdatedAt: fixtureTime,
    activePlayers: [{ playerid: 0, type: 'audio' }],
    primaryPlayer: { playerid: 0, type: 'audio' },
    item: {
      label: 'M007 Safe Groove',
      title: 'M007 Safe Groove',
      artist: ['Fixture Ensemble'],
      album: 'Neutral Shell Proof',
      type: 'song',
      thumbnail: 'poster:m007-safe-groove'
    },
    properties: {
      type: 'audio',
      percentage: 42,
      shuffled: false,
      repeat: 'off',
      subtitleenabled: false,
      subtitles: [],
      currentaudiostream: { index: 0, name: 'Main mix', language: 'eng', channels: 2 },
      audiostreams: [{ index: 0, name: 'Main mix', language: 'eng', channels: 2, codec: 'aac' }]
    },
    application: { volume: 64, muted: false },
    queue: { playlistid: 0, position: 1 },
    time: { currentSeconds: 94, totalSeconds: 224 },
    lastError: null
  };
}

function createPlayerDispatch(): PlayerControlsDispatch {
  const snapshot: PlayerDispatchSnapshot = {
    mode: 'local',
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null
  };

  return {
    snapshot,
    playPause: noop,
    stop: noop,
    previous: noop,
    next: noop,
    seekPercentage: noop,
    seekRelativeSeconds: noop,
    setVolume: noop,
    toggleMute: noop,
    setShuffle: noop,
    setRepeat: noop,
    setSubtitle: noop,
    setAudioStream: noop,
    startLocalPlayback: noop,
    resumeOnKodi: noop
  };
}

function createQueueSnapshot(): QueueStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playlistid: 0,
    activePosition: 1,
    items: [
      {
        id: 1,
        position: 0,
        label: 'M007 Safe Groove',
        title: 'M007 Safe Groove',
        artist: ['Fixture Ensemble'],
        album: 'Neutral Shell Proof',
        duration: 224,
        type: 'song'
      },
      {
        id: 2,
        position: 1,
        label: 'Blue in Green',
        title: 'Blue in Green',
        artist: ['Fixture Quintet'],
        album: 'Browser Jazz',
        duration: 337,
        type: 'song'
      }
    ],
    limits: { start: 0, end: 2, total: 2 },
    lastRefreshReason: 'manual',
    lastUpdatedAt: fixtureTime,
    lastError: null
  };
}

function createQueueDispatch(): QueuePanelDispatch {
  const snapshot: QueueDispatchSnapshot = {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null
  };

  return {
    snapshot,
    removeAt: noop,
    clear: noop,
    swap: noop
  };
}

function createLocalPlaylistSnapshot(): LocalPlaylistStoreSnapshot {
  const selectedPlaylist = {
    id: 'playlist-browser-jazz',
    label: 'Browser Jazz',
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T10:05:00.000Z',
    items: [
      {
        id: 'item-blue-in-green',
        kind: 'audio' as const,
        label: 'Blue in Green',
        position: 0,
        durationSeconds: 337,
        addedAt: '2026-05-04T10:01:00.000Z'
      },
      {
        id: 'item-safe-scene',
        kind: 'video' as const,
        label: 'Neon Harbor clip',
        position: 1,
        durationSeconds: 180,
        addedAt: '2026-05-04T10:02:00.000Z'
      }
    ]
  };

  return {
    playlists: [selectedPlaylist],
    selectedPlaylistId: selectedPlaylist.id,
    selectedPlaylist,
    playlistCount: 1,
    selectedItemCount: selectedPlaylist.items.length,
    mutationStatus: 'idle',
    lastMutation: null,
    validationErrors: {},
    storageWarning: null,
    lastError: null,
    lastUpdatedAt: selectedPlaylist.updatedAt
  };
}

function createLocalPlaylistDispatch(): LocalPlaylistDispatch {
  const successPlaylist = createLocalPlaylistSnapshot().selectedPlaylist!;
  return {
    createPlaylist: () => ({ ok: true, playlist: successPlaylist }),
    renamePlaylist: () => ({ ok: true, playlist: successPlaylist }),
    removePlaylist: () => ({ ok: true }),
    selectPlaylist: () => ({ ok: true, playlist: successPlaylist }),
    clearPlaylist: () => ({ ok: true }),
    addItems: () => ({ ok: true, items: [] }),
    removeItem: () => ({ ok: true }),
    moveItem: () => ({ ok: true }),
    reorderItems: () => ({ ok: true }),
    reset: () => undefined
  };
}

function createProofSnapshot(route: AppRoute): M007VisualProofAppProps['m007ProofSnapshot'] {
  return {
    fixture: 'm007-visual-proof',
    visibleLabels: [
      route.kind,
      'Nina Simone',
      'Pastel Blues',
      'Neon Harbor',
      'Quiet Signal',
      'Aurora Files',
      'Signal Mirror',
      'Albums',
      'Sinnerman.flac',
      'Safe Video Demo',
      'plugin.video.safe-demo',
      'Enable add-on',
      'Browser Jazz',
      'Blue in Green',
      'Kodi settings section',
      'Autoplay next item',
      'About Chorus',
      'Add-ons and developers',
      'Readme',
      'Package usage'
    ]
  };
}

function readPathname(location: M007VisualProofLocation | null | undefined): unknown {
  try {
    return location?.pathname;
  } catch {
    return undefined;
  }
}

function readSearch(location: M007VisualProofLocation | null | undefined): unknown {
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
