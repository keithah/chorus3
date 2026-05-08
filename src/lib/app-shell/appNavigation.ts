import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
import { parsePrimaryRoutePath, type PrimaryRoute } from '$lib/app/primaryRoutes';
import type {
  AppShellNavigationItem,
  AppShellNavigationSubmenuGroup,
  AppShellNavigationSubmenuItem
} from './appShellTypes';

export interface AppNavigationOptions extends BuildAppRouteOptions {
  readonly activeRoute?: PrimaryRoute | null;
  readonly mainNavRows?: readonly AppNavigationMainNavRow[];
}

export interface AppNavigationMainNavRow {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly icon: string;
  readonly classes?: string;
  readonly parent?: number;
  readonly weight?: number;
}

interface AppNavigationTarget {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly icon: string;
  readonly route: PrimaryRoute;
  readonly activeRouteKinds: readonly PrimaryRoute['kind'][];
  readonly submenuGroups?: readonly AppNavigationSubmenuGroupTarget[];
}

interface AppNavigationSubmenuGroupTarget {
  readonly id: string;
  readonly label: string;
  readonly items: readonly AppNavigationSubmenuTarget[];
}

interface AppNavigationSubmenuTarget {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly route: PrimaryRoute;
  readonly activeRouteKinds?: readonly PrimaryRoute['kind'][];
}

const MUSIC_ROUTE_KINDS = [
  'home',
  'music',
  'musicTop',
  'musicArtists',
  'musicAlbums',
  'musicGenres',
  'musicVideos',
  'musicVideoDetail',
  'musicAlbumDetail',
  'musicArtistDetail',
  'musicGenreDetail'
] as const satisfies readonly PrimaryRoute['kind'][];

const MOVIE_ROUTE_KINDS = [
  'movies',
  'moviesRecent',
  'movieDetail'
] as const satisfies readonly PrimaryRoute['kind'][];

const TV_ROUTE_KINDS = [
  'tvshows',
  'tvshowsRecent',
  'tvshowDetail',
  'tvshowSeasonDetail',
  'tvshowEpisodeDetail'
] as const satisfies readonly PrimaryRoute['kind'][];

const BROWSER_ROUTE_KINDS = [
  'browser',
  'browserItem'
] as const satisfies readonly PrimaryRoute['kind'][];

const PVR_ROUTE_KINDS = [
  'pvrTv',
  'pvrTvChannel',
  'pvrRadio',
  'pvrRadioChannel',
  'pvrRecordings'
] as const satisfies readonly PrimaryRoute['kind'][];

const ADDON_ROUTE_KINDS = [
  'addonsAll',
  'addonsVideo',
  'addonsAudio',
  'addonsExecutable',
  'addonDetail',
  'addonExecute'
] as const satisfies readonly PrimaryRoute['kind'][];

const PLAYLIST_ROUTE_KINDS = [
  'playlists',
  'playlistDetail'
] as const satisfies readonly PrimaryRoute['kind'][];

const SETTINGS_ROUTE_KINDS = [
  'settingsWeb',
  'settingsKodi',
  'settingsKodiSection',
  'settingsAddons',
  'settingsNav',
  'settingsSearch'
] as const satisfies readonly PrimaryRoute['kind'][];

const HELP_ROUTE_KINDS = [
  'help',
  'helpOverview',
  'helpPage'
] as const satisfies readonly PrimaryRoute['kind'][];

export const PRIMARY_APP_NAVIGATION_TARGETS = [
  {
    id: 'music',
    title: 'Music',
    label: 'Music',
    icon: 'mdi-av-my-library-music',
    route: { kind: 'music' },
    activeRouteKinds: MUSIC_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'library',
        label: 'Music',
        items: [
          {
            id: 'home',
            title: 'Music home',
            label: 'Music',
            route: { kind: 'music' },
            activeRouteKinds: ['home', 'music']
          },
          {
            id: 'genres',
            title: 'Music genres',
            label: 'Genres',
            route: { kind: 'musicGenres' },
            activeRouteKinds: ['musicGenres', 'musicGenreDetail']
          },
          {
            id: 'recent',
            title: 'Top music',
            label: 'Top music',
            route: { kind: 'musicTop' }
          },
          {
            id: 'artists',
            title: 'Music artists',
            label: 'Artists',
            route: { kind: 'musicArtists' },
            activeRouteKinds: ['musicArtists', 'musicArtistDetail']
          },
          {
            id: 'albums',
            title: 'Music albums',
            label: 'Albums',
            route: { kind: 'musicAlbums' },
            activeRouteKinds: ['musicAlbums', 'musicAlbumDetail']
          },
          {
            id: 'videos',
            title: 'Music videos',
            label: 'Videos',
            route: { kind: 'musicVideos' },
            activeRouteKinds: ['musicVideos', 'musicVideoDetail']
          }
        ]
      }
    ]
  },
  {
    id: 'movies',
    title: 'Movies',
    label: 'Movies',
    icon: 'mdi-image-movie-creation',
    route: { kind: 'moviesRecent' },
    activeRouteKinds: MOVIE_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'library',
        label: 'Movie library',
        items: [
          {
            id: 'recent',
            title: 'Movies',
            label: 'Movies',
            route: { kind: 'moviesRecent' }
          },
          {
            id: 'all',
            title: 'All movies',
            label: 'All movies',
            route: { kind: 'movies' },
            activeRouteKinds: ['movies', 'movieDetail']
          }
        ]
      }
    ]
  },
  {
    id: 'tvshows',
    title: 'TV shows',
    label: 'TV shows',
    icon: 'mdi-hardware-tv',
    route: { kind: 'tvshowsRecent' },
    activeRouteKinds: TV_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'library',
        label: 'TV library',
        items: [
          {
            id: 'recent',
            title: 'TV shows',
            label: 'TV shows',
            route: { kind: 'tvshowsRecent' }
          },
          {
            id: 'all',
            title: 'All TV shows',
            label: 'All TV shows',
            route: { kind: 'tvshows' },
            activeRouteKinds: [
              'tvshows',
              'tvshowDetail',
              'tvshowSeasonDetail',
              'tvshowEpisodeDetail'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'browser',
    title: 'Browser',
    label: 'Browser',
    icon: 'mdi-editor-format-list-bulleted',
    route: { kind: 'browser' },
    activeRouteKinds: BROWSER_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'files',
        label: 'File browser',
        items: [
          {
            id: 'root',
            title: 'File browser',
            label: 'Browser',
            route: { kind: 'browser' },
            activeRouteKinds: BROWSER_ROUTE_KINDS
          }
        ]
      }
    ]
  },
  {
    id: 'pvr',
    title: 'PVR',
    label: 'PVR',
    icon: 'mdi-action-settings-input-antenna',
    route: { kind: 'pvrTv' },
    activeRouteKinds: PVR_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'pvr',
        label: 'PVR',
        items: [
          { id: 'tv', title: 'TV Channels', label: 'TV Channels', route: { kind: 'pvrTv' } },
          {
            id: 'radio',
            title: 'Radio Stations',
            label: 'Radio Stations',
            route: { kind: 'pvrRadio' }
          },
          {
            id: 'recordings',
            title: 'Recordings',
            label: 'Recordings',
            route: { kind: 'pvrRecordings' }
          }
        ]
      }
    ]
  },
  {
    id: 'addons',
    title: 'Add-ons',
    label: 'Add-ons',
    icon: 'mdi-action-extension',
    route: { kind: 'addonsAll' },
    activeRouteKinds: ADDON_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'types',
        label: 'ADD-ONS',
        items: [
          {
            id: 'all',
            title: 'All add-ons',
            label: 'All',
            route: { kind: 'addonsAll' },
            activeRouteKinds: ['addonsAll', 'addonDetail', 'addonExecute']
          },
          { id: 'video', title: 'Video add-ons', label: 'Video', route: { kind: 'addonsVideo' } },
          { id: 'audio', title: 'Audio add-ons', label: 'Audio', route: { kind: 'addonsAudio' } },
          {
            id: 'executable',
            title: 'Executable add-ons',
            label: 'Executable',
            route: { kind: 'addonsExecutable' }
          }
        ]
      }
    ]
  },
  {
    id: 'thumbsup',
    title: 'Thumbs up',
    label: 'Thumbs up',
    icon: 'mdi-action-thumb-up',
    route: { kind: 'thumbsup' },
    activeRouteKinds: ['thumbsup']
  },
  {
    id: 'playlists',
    title: 'Playlists',
    label: 'Playlists',
    icon: 'mdi-av-playlist-add',
    route: { kind: 'playlists' },
    activeRouteKinds: PLAYLIST_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'playlists',
        label: 'Playlists',
        items: [
          {
            id: 'all',
            title: 'Playlists',
            label: 'Playlists',
            route: { kind: 'playlists' },
            activeRouteKinds: ['playlists', 'playlistDetail']
          }
        ]
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    label: 'Settings',
    icon: 'mdi-action-settings',
    route: { kind: 'settingsWeb' },
    activeRouteKinds: SETTINGS_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'general',
        label: 'GENERAL',
        items: [
          {
            id: 'web-interface',
            title: 'Web interface settings',
            label: 'Web interface',
            route: { kind: 'settingsWeb' }
          },
          {
            id: 'main-menu',
            title: 'Main menu settings',
            label: 'Main menu',
            route: { kind: 'settingsNav' }
          },
          {
            id: 'addons',
            title: 'Add-on settings',
            label: 'Add-ons',
            route: { kind: 'settingsAddons' }
          },
          {
            id: 'search',
            title: 'Search settings',
            label: 'Search',
            route: { kind: 'settingsSearch' }
          }
        ]
      },
      {
        id: 'kodi-settings',
        label: 'KODI SETTINGS',
        items: [
          {
            id: 'games',
            title: 'Games',
            label: 'Games',
            route: { kind: 'settingsKodiSection', section: 'games' }
          },
          {
            id: 'interface',
            title: 'Interface',
            label: 'Interface',
            route: { kind: 'settingsKodiSection', section: 'interface' }
          },
          {
            id: 'media',
            title: 'Media',
            label: 'Media',
            route: { kind: 'settingsKodiSection', section: 'media' }
          },
          {
            id: 'player',
            title: 'Player',
            label: 'Player',
            route: { kind: 'settingsKodiSection', section: 'player' }
          },
          {
            id: 'pvr',
            title: 'PVR & Live TV',
            label: 'PVR & Live TV',
            route: { kind: 'settingsKodiSection', section: 'pvr' }
          },
          {
            id: 'services',
            title: 'Services',
            label: 'Services',
            route: { kind: 'settingsKodiSection', section: 'services' }
          },
          {
            id: 'system',
            title: 'System',
            label: 'System',
            route: { kind: 'settingsKodiSection', section: 'system' }
          }
        ]
      }
    ]
  },
  {
    id: 'help',
    title: 'Help',
    label: 'Help',
    icon: 'mdi-action-help',
    route: { kind: 'help' },
    activeRouteKinds: HELP_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'help',
        label: 'HELP TOPICS',
        items: [
          { id: 'home', title: 'Help home', label: 'About', route: { kind: 'help' } },
          {
            id: 'overview',
            title: 'Help overview',
            label: 'Readme',
            route: { kind: 'helpPage', pageid: 'readme' }
          },
          {
            id: 'changelog',
            title: 'Changelog',
            label: 'Changelog',
            route: { kind: 'helpPage', pageid: 'changelog' }
          },
          {
            id: 'keyboard',
            title: 'Keyboard controls',
            label: 'Keyboard',
            route: { kind: 'helpPage', pageid: 'keyboard' }
          },
          {
            id: 'addons',
            title: 'Add-ons help',
            label: 'Add-ons',
            route: { kind: 'helpPage', pageid: 'addons' }
          },
          {
            id: 'developers',
            title: 'Developer help',
            label: 'Developers',
            route: { kind: 'helpPage', pageid: 'developers' }
          },
          {
            id: 'translations',
            title: 'Translations',
            label: 'Translations',
            route: { kind: 'helpPage', pageid: 'translations' }
          },
          {
            id: 'license',
            title: 'License',
            label: 'License',
            route: { kind: 'helpPage', pageid: 'license' }
          }
        ]
      }
    ]
  }
] as const satisfies readonly AppNavigationTarget[];

export function createAppNavigationItems(
  options: AppNavigationOptions = {}
): readonly AppShellNavigationItem[] {
  const activeRoute = options.activeRoute ?? null;
  const buildOptions = { packageBasePath: options.packageBasePath, routeMode: options.routeMode };
  const customRows = options.mainNavRows?.filter((row) => row.title.trim() && row.path.trim());

  if (customRows?.length) {
    return customRows.map((row, index) =>
      createCustomNavigationItem(row, index, activeRoute, options)
    );
  }

  return PRIMARY_APP_NAVIGATION_TARGETS.map((target: AppNavigationTarget) => ({
    id: target.id,
    title: safeNavigationText(target.title, target.id),
    label: safeNavigationText(target.label, target.title),
    icon: target.icon,
    route: target.route,
    href: buildPrimaryAppRoute(target.route, buildOptions),
    isActive: isActiveNavigationTarget(target, activeRoute),
    submenuGroups: createSubmenuGroups(target.submenuGroups ?? [], activeRoute, buildOptions)
  }));
}

function createCustomNavigationItem(
  row: AppNavigationMainNavRow,
  index: number,
  activeRoute: PrimaryRoute | null,
  options: BuildAppRouteOptions
): AppShellNavigationItem {
  const normalizedPath = row.path.replace(/^#+/, '').replace(/^\/+/, '');
  const route = parsePrimaryRoutePath(`/${normalizedPath}`) ?? { kind: 'home' };
  return {
    id: row.id || `custom-${index}`,
    title: safeNavigationText(row.title, `Menu item ${index + 1}`),
    label: safeNavigationText(row.title, `Menu item ${index + 1}`),
    icon: safeNavigationText(row.icon, 'mdi-action-extension'),
    route,
    href: buildCustomNavigationHref(normalizedPath, options),
    isActive: activeRoute ? route.kind === activeRoute.kind : false
  };
}

function buildCustomNavigationHref(path: string, options: BuildAppRouteOptions): string {
  const cleanPath = path.replace(/[<>"']/g, '').replace(/^\/+/, '');
  if (!cleanPath) {
    return buildPrimaryAppRoute({ kind: 'home' }, options);
  }

  const base =
    typeof options.packageBasePath === 'string' ? options.packageBasePath.replace(/\/+$/, '') : '';
  if (options.routeMode === 'hash') {
    return base ? `${base}/#${cleanPath}` : `#${cleanPath}`;
  }
  return `${base}/${cleanPath}`.replace(/\/{2,}/g, '/');
}

function createSubmenuGroups(
  groups: readonly AppNavigationSubmenuGroupTarget[],
  activeRoute: PrimaryRoute | null,
  buildOptions: BuildAppRouteOptions
): readonly AppShellNavigationSubmenuGroup[] {
  return groups.map((group) => ({
    id: group.id,
    label: safeNavigationText(group.label, group.id),
    items: group.items.map((item) => createSubmenuItem(item, activeRoute, buildOptions))
  }));
}

function createSubmenuItem(
  item: AppNavigationSubmenuTarget,
  activeRoute: PrimaryRoute | null,
  buildOptions: BuildAppRouteOptions
): AppShellNavigationSubmenuItem {
  return {
    id: item.id,
    title: safeNavigationText(item.title, item.id),
    label: safeNavigationText(item.label, item.title),
    route: item.route,
    href: buildPrimaryAppRoute(item.route, buildOptions),
    isActive: item.activeRouteKinds
      ? isActiveRouteKind(item.activeRouteKinds, activeRoute)
      : isSamePrimaryRoute(item.route, activeRoute)
  };
}

function isActiveNavigationTarget(
  target: AppNavigationTarget,
  activeRoute: PrimaryRoute | null
): boolean {
  return isActiveRouteKind(target.activeRouteKinds, activeRoute);
}

function isActiveRouteKind(
  routeKinds: readonly PrimaryRoute['kind'][],
  activeRoute: PrimaryRoute | null
): boolean {
  return activeRoute ? routeKinds.includes(activeRoute.kind) : false;
}

function isSamePrimaryRoute(route: PrimaryRoute, activeRoute: PrimaryRoute | null): boolean {
  if (!activeRoute || route.kind !== activeRoute.kind) {
    return false;
  }

  if ('section' in route || 'section' in activeRoute) {
    return 'section' in route && 'section' in activeRoute && route.section === activeRoute.section;
  }

  if ('pageid' in route || 'pageid' in activeRoute) {
    return 'pageid' in route && 'pageid' in activeRoute && route.pageid === activeRoute.pageid;
  }

  return true;
}

function safeNavigationText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
