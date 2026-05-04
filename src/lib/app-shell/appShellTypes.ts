import type { Snippet } from 'svelte';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';

export type AppShellRouteIdentity =
  | { kind: 'primary'; route: PrimaryRoute }
  | { kind: 'dashboard' }
  | { kind: 'unknown'; label?: string };

export interface AppShellBaseHrefOptions {
  readonly packageBasePath?: string;
}

export interface AppShellNavigationItem {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly route: PrimaryRoute;
  readonly isActive?: boolean;
}

export interface AppShellContentStage {
  readonly ariaLabel: string;
  readonly artUrl?: string;
  readonly content?: Snippet;
}

export interface AppShellDrawerState {
  readonly label: string;
  readonly mediaMode?: 'audio' | 'video';
  readonly collapsed?: boolean;
  readonly disabledReason?: string;
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
  readonly mode: 'kodi' | 'local';
  readonly mediaMode: 'audio' | 'video';
}

export interface AppShellCallbacks {
  readonly onDestinationModeChange?: (
    mode: AppShellDestinationState['mode']
  ) => void | Promise<void>;
  readonly onMediaModeChange?: (
    mode: AppShellDestinationState['mediaMode']
  ) => void | Promise<void>;
}
