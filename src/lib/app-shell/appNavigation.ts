import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type {
  AppShellNavigationItem,
  AppShellNavigationSubmenuGroup,
  AppShellNavigationSubmenuItem
} from './appShellTypes';

export interface AppNavigationOptions extends BuildAppRouteOptions {
  readonly activeRoute?: PrimaryRoute | null;
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

const ADDON_ROUTE_KINDS = [
  'addonsAll',
  'addonsVideo',
  'addonsAudio',
  'addonsExecutable',
  'addonExecute'
] as const satisfies readonly PrimaryRoute['kind'][];

const PLAYLIST_ROUTE_KINDS = [
  'playlists',
  'playlistDetail',
  'thumbsup'
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
        label: 'Music library',
        items: [
          {
            id: 'home',
            title: 'Music home',
            label: 'Home',
            route: { kind: 'music' },
            activeRouteKinds: ['home', 'music']
          },
          {
            id: 'recent',
            title: 'Recently added music',
            label: 'Recent',
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
            id: 'genres',
            title: 'Music genres',
            label: 'Genres',
            route: { kind: 'musicGenres' },
            activeRouteKinds: ['musicGenres', 'musicGenreDetail']
          },
          { id: 'videos', title: 'Music videos', label: 'Videos', route: { kind: 'musicVideos' } }
        ]
      }
    ]
  },
  {
    id: 'movies',
    title: 'Movies',
    label: 'Movies',
    icon: 'mdi-image-movie-creation',
    route: { kind: 'movies' },
    activeRouteKinds: MOVIE_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'library',
        label: 'Movie library',
        items: [
          {
            id: 'all',
            title: 'All movies',
            label: 'All movies',
            route: { kind: 'movies' },
            activeRouteKinds: ['movies', 'movieDetail']
          },
          {
            id: 'recent',
            title: 'Recently added movies',
            label: 'Recent',
            route: { kind: 'moviesRecent' }
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
    route: { kind: 'tvshows' },
    activeRouteKinds: TV_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'library',
        label: 'TV library',
        items: [
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
          },
          {
            id: 'recent',
            title: 'Recently added TV shows',
            label: 'Recent',
            route: { kind: 'tvshowsRecent' }
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
    id: 'addons',
    title: 'Add-ons',
    label: 'Add-ons',
    icon: 'mdi-action-extension',
    route: { kind: 'addonsAll' },
    activeRouteKinds: ADDON_ROUTE_KINDS,
    submenuGroups: [
      {
        id: 'types',
        label: 'Add-on types',
        items: [
          {
            id: 'all',
            title: 'All add-ons',
            label: 'All',
            route: { kind: 'addonsAll' },
            activeRouteKinds: ['addonsAll', 'addonExecute']
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
    id: 'remote',
    title: 'Remote',
    label: 'Remote',
    icon: 'mdi-action-thumb-up',
    route: { kind: 'remote' },
    activeRouteKinds: ['remote'],
    submenuGroups: [
      {
        id: 'controls',
        label: 'Remote controls',
        items: [
          { id: 'remote', title: 'Remote control', label: 'Remote', route: { kind: 'remote' } }
        ]
      }
    ]
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
          },
          { id: 'thumbsup', title: 'Thumbs up', label: 'Thumbs up', route: { kind: 'thumbsup' } }
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
        id: 'settings',
        label: 'Settings',
        items: [
          {
            id: 'web-interface',
            title: 'Web interface settings',
            label: 'Web interface',
            route: { kind: 'settingsWeb' }
          },
          {
            id: 'kodi',
            title: 'Kodi settings',
            label: 'Kodi',
            route: { kind: 'settingsKodi' },
            activeRouteKinds: ['settingsKodi', 'settingsKodiSection']
          },
          {
            id: 'addons',
            title: 'Add-on settings',
            label: 'Add-ons',
            route: { kind: 'settingsAddons' }
          },
          {
            id: 'main-menu',
            title: 'Main menu settings',
            label: 'Main menu',
            route: { kind: 'settingsNav' }
          },
          {
            id: 'search',
            title: 'Search settings',
            label: 'Search',
            route: { kind: 'settingsSearch' }
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
        label: 'Help',
        items: [
          { id: 'home', title: 'Help home', label: 'Help', route: { kind: 'help' } },
          {
            id: 'overview',
            title: 'Help overview',
            label: 'Overview',
            route: { kind: 'helpOverview' },
            activeRouteKinds: ['helpOverview', 'helpPage']
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
  const buildOptions = { packageBasePath: options.packageBasePath };

  return PRIMARY_APP_NAVIGATION_TARGETS.map((target) => ({
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
    isActive: isActiveRouteKind(item.activeRouteKinds ?? [item.route.kind], activeRoute)
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

function safeNavigationText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
