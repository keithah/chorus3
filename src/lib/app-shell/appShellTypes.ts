import type { Snippet } from 'svelte';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';

export type AppShellRouteIdentity =
  | { kind: 'primary'; route: PrimaryRoute }
  | { kind: 'dashboard' }
  | { kind: 'unknown'; label?: string };

export interface AppShellBaseHrefOptions {
  readonly packageBasePath?: string;
}

export interface AppShellNavigationSubmenuItem {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly href: string;
  readonly route: PrimaryRoute;
  readonly isActive?: boolean;
}

export interface AppShellNavigationSubmenuGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly AppShellNavigationSubmenuItem[];
}

export interface AppShellNavigationItem {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly route: PrimaryRoute;
  readonly isActive?: boolean;
  readonly submenuGroups?: readonly AppShellNavigationSubmenuGroup[];
}

export interface AppShellContentStage {
  readonly ariaLabel: string;
  readonly artUrl?: string;
  readonly content?: Snippet;
}

export type AppShellPlaylistDestinationMode = 'kodi' | 'local';
export type AppShellPlaylistMediaMode = 'audio' | 'video';
export type AppShellPlaylistMenuAction =
  | 'currentPlaylist'
  | 'clear'
  | 'refresh'
  | 'partyMode'
  | 'saveKodiPlaylist';

export interface AppShellDrawerState {
  readonly label: string;
  readonly mediaMode?: AppShellPlaylistMediaMode;
  readonly collapsed?: boolean;
  readonly menuOpen?: boolean;
  readonly disabledReason?: string;
  readonly menuDisabledReasons?: Partial<Record<AppShellPlaylistMenuAction, string>>;
  readonly content?: Snippet;
}

export interface AppShellPlayerSnapshot {
  readonly title: string;
  readonly subtitle: string;
  readonly currentTime: string;
  readonly totalTime: string;
  readonly progressPercent: number;
  readonly thumbnailUrl?: string;
  readonly disabledReason?: string;
}

export interface AppShellPlayerActions {
  readonly previous?: () => void | Promise<void>;
  readonly playPause?: () => void | Promise<void>;
  readonly next?: () => void | Promise<void>;
  readonly toggleMute?: () => void | Promise<void>;
  readonly fullscreen?: () => void | Promise<void>;
}

export interface AppShellDestinationState {
  readonly mode: AppShellPlaylistDestinationMode;
  readonly mediaMode: AppShellPlaylistMediaMode;
  readonly disabledReasons?: Partial<Record<AppShellPlaylistDestinationMode, string>>;
}

export interface AppShellCallbacks {
  readonly onDestinationModeChange?: (
    mode: AppShellPlaylistDestinationMode
  ) => void | Promise<void>;
  readonly onMediaModeChange?: (mode: AppShellPlaylistMediaMode) => void | Promise<void>;
  readonly onPlaylistMenuAction?: (action: AppShellPlaylistMenuAction) => void | Promise<void>;
  readonly onPlaylistMenuToggle?: (open: boolean) => void | Promise<void>;
  readonly onPlaylistCollapseToggle?: (collapsed: boolean) => void | Promise<void>;
}
