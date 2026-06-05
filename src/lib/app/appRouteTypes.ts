import type { DashboardRoute, VideoRoute } from '../video/videoRouter';
import type { PrimaryRoute } from './primaryRoutes';

export type AppDashboardRoute = DashboardRoute;
export type PrimaryAppRoute = { kind: 'primary'; route: PrimaryRoute };
export type SettingsRoute = { kind: 'settings' };
export type SettingsUnknownRoute = { kind: 'settingsUnknown'; pathLabel: string };
export type RemoteRoute = { kind: 'remote' };
export type AddonsRoute = { kind: 'addons' };
export type AddonDetailRoute = { kind: 'addonDetail'; addonid: string };
export type AddonsUnknownRoute = { kind: 'addonsUnknown'; pathLabel: string };
export type LabUnknownRoute = { kind: 'labUnknown'; pathLabel: string };
export type NowPlayingRoute = { kind: 'nowPlaying' };
export type LocalPlayerRoute =
  | { kind: 'localPlayer'; media: 'movie' | 'episode' | 'musicvideo'; id: number }
  | {
      kind: 'localPlayer';
      media: 'music';
      musicKind: 'artist' | 'album' | 'song';
      id: number;
    };
export type DelegatedVideoRoute = { kind: 'video'; route: Exclude<VideoRoute, DashboardRoute> };
export type ParityPlaceholderStatus = 'missing' | 'deferred' | 'intentionallyChanged';

export interface ParityRoutePlaceholder {
  readonly id: string;
  readonly surface: string;
  readonly title: string;
  readonly status: ParityPlaceholderStatus;
  readonly owner: string;
  readonly description: string;
  readonly recoveryRoute: string;
  readonly routePath: string;
}

export type ParityPlaceholderRoute = {
  kind: 'parityPlaceholder';
  placeholder: ParityRoutePlaceholder;
};

export type AppRoute =
  | PrimaryAppRoute
  | AppDashboardRoute
  | SettingsRoute
  | SettingsUnknownRoute
  | RemoteRoute
  | AddonsRoute
  | AddonDetailRoute
  | AddonsUnknownRoute
  | LabUnknownRoute
  | NowPlayingRoute
  | LocalPlayerRoute
  | DelegatedVideoRoute
  | ParityPlaceholderRoute;

export interface AppRouteHistory {
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
}

export interface NavigateAppRouteOptions {
  history?: AppRouteHistory | null;
}

export interface ParseAppRouteOptions {
  packageBasePath?: unknown;
}

export interface BuildAppRouteOptions {
  packageBasePath?: unknown;
  packageSearch?: unknown;
  routeMode?: 'path' | 'hash';
}

export interface KodiPackageRouteBuildOptions {
  packageBasePath?: unknown;
  packageSearch?: unknown;
}
