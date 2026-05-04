import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { AppShellNavigationItem } from './appShellTypes';

export interface AppNavigationOptions extends BuildAppRouteOptions {
  readonly activeRoute?: PrimaryRoute | null;
}

interface AppNavigationTarget {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly icon: string;
  readonly route: PrimaryRoute;
  readonly activeWhenHome?: boolean;
}

export const PRIMARY_APP_NAVIGATION_TARGETS = [
  {
    id: 'music',
    title: 'Music',
    label: 'Music',
    icon: 'mdi-av-my-library-music',
    route: { kind: 'music' },
    activeWhenHome: true
  },
  {
    id: 'movies',
    title: 'Movies',
    label: 'Movies',
    icon: 'mdi-image-movie-creation',
    route: { kind: 'movies' }
  },
  {
    id: 'tvshows',
    title: 'TV shows',
    label: 'TV shows',
    icon: 'mdi-hardware-tv',
    route: { kind: 'tvshows' }
  },
  {
    id: 'browser',
    title: 'Browser',
    label: 'Browser',
    icon: 'mdi-editor-format-list-bulleted',
    route: { kind: 'browser' }
  },
  {
    id: 'addons',
    title: 'Add-ons',
    label: 'Add-ons',
    icon: 'mdi-action-extension',
    route: { kind: 'addonsAll' }
  },
  {
    id: 'remote',
    title: 'Remote',
    label: 'Remote',
    icon: 'mdi-action-thumb-up',
    route: { kind: 'remote' }
  },
  {
    id: 'playlists',
    title: 'Playlists',
    label: 'Playlists',
    icon: 'mdi-av-playlist-add',
    route: { kind: 'playlists' }
  },
  {
    id: 'settings',
    title: 'Settings',
    label: 'Settings',
    icon: 'mdi-action-settings',
    route: { kind: 'settingsWeb' }
  },
  {
    id: 'help',
    title: 'Help',
    label: 'Help',
    icon: 'mdi-action-help',
    route: { kind: 'help' }
  }
] as const satisfies readonly AppNavigationTarget[];

export function createAppNavigationItems(
  options: AppNavigationOptions = {}
): readonly AppShellNavigationItem[] {
  const activeRoute = options.activeRoute ?? null;

  return PRIMARY_APP_NAVIGATION_TARGETS.map((target) => ({
    id: target.id,
    title: safeNavigationText(target.title, target.id),
    label: safeNavigationText(target.label, target.title),
    icon: target.icon,
    route: target.route,
    href: buildPrimaryAppRoute(target.route, { packageBasePath: options.packageBasePath }),
    isActive: isActiveNavigationTarget(target, activeRoute)
  }));
}

function isActiveNavigationTarget(
  target: AppNavigationTarget,
  activeRoute: PrimaryRoute | null
): boolean {
  if (!activeRoute) {
    return false;
  }

  return (
    target.route.kind === activeRoute.kind ||
    (target.activeWhenHome === true && activeRoute.kind === 'home')
  );
}

function safeNavigationText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
