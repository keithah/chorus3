import type { PlayerControlsDispatch } from '$lib/components/PlayerControls.svelte';
import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';

export type PlaybackShortcutAction =
  | 'playPause'
  | 'seekBack'
  | 'seekForward'
  | 'volumeUp'
  | 'volumeDown'
  | 'toggleMute'
  | 'next'
  | 'previous'
  | 'fullscreen';

export interface PlaybackShortcutDefinition {
  key: string;
  label: string;
  action: PlaybackShortcutAction;
  description: string;
}

export interface PlaybackShortcutOptions {
  playerSnapshot?: PlayerStoreSnapshot | null;
  volumeStep?: number;
  seekStepSeconds?: number;
  toggleFullscreen?: () => Promise<void> | void;
}

type PlaybackShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'target' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'
>;

type ShortcutHandler = (
  dispatch: PlayerControlsDispatch,
  options: Required<Pick<PlaybackShortcutOptions, 'volumeStep' | 'seekStepSeconds'>> &
    PlaybackShortcutOptions
) => void | Promise<void>;

const DEFAULT_VOLUME_STEP = 5;
const DEFAULT_SEEK_STEP_SECONDS = 30;

export const PLAYBACK_SHORTCUTS: readonly PlaybackShortcutDefinition[] = [
  {
    key: 'Space',
    label: 'Play / pause',
    action: 'playPause',
    description: 'Toggle playback for the active player.'
  },
  {
    key: 'ArrowLeft',
    label: 'Seek back 30 seconds',
    action: 'seekBack',
    description: 'Move playback backward by 30 seconds.'
  },
  {
    key: 'ArrowRight',
    label: 'Seek forward 30 seconds',
    action: 'seekForward',
    description: 'Move playback forward by 30 seconds.'
  },
  {
    key: 'ArrowUp',
    label: 'Volume up',
    action: 'volumeUp',
    description: 'Increase application volume by five points.'
  },
  {
    key: 'ArrowDown',
    label: 'Volume down',
    action: 'volumeDown',
    description: 'Decrease application volume by five points.'
  },
  {
    key: 'M',
    label: 'Toggle mute',
    action: 'toggleMute',
    description: 'Toggle application mute.'
  },
  {
    key: 'N',
    label: 'Next item',
    action: 'next',
    description: 'Skip to the next item.'
  },
  {
    key: 'P',
    label: 'Previous item',
    action: 'previous',
    description: 'Return to the previous item.'
  },
  {
    key: 'F',
    label: 'Toggle fullscreen',
    action: 'fullscreen',
    description: 'Toggle fullscreen when the host surface provides a fullscreen helper.'
  }
] as const;

const SHORTCUT_HANDLERS: ReadonlyMap<string, ShortcutHandler> = new Map<string, ShortcutHandler>([
  [' ', (dispatch) => dispatch.playPause()],
  ['space', (dispatch) => dispatch.playPause()],
  [
    'arrowleft',
    (dispatch, options) => dispatch.seekRelativeSeconds(-Math.abs(options.seekStepSeconds))
  ],
  [
    'arrowright',
    (dispatch, options) => dispatch.seekRelativeSeconds(Math.abs(options.seekStepSeconds))
  ],
  [
    'arrowup',
    (dispatch, options) =>
      dispatch.setVolume(
        clampShortcutVolume(readShortcutVolume(options.playerSnapshot) + options.volumeStep)
      )
  ],
  [
    'arrowdown',
    (dispatch, options) =>
      dispatch.setVolume(
        clampShortcutVolume(readShortcutVolume(options.playerSnapshot) - options.volumeStep)
      )
  ],
  ['m', (dispatch) => dispatch.toggleMute()],
  ['n', (dispatch) => dispatch.next()],
  ['p', (dispatch) => dispatch.previous()],
  [
    'f',
    (_dispatch, options) => {
      if (!options.toggleFullscreen) {
        return;
      }

      return options.toggleFullscreen();
    }
  ]
]);

export function handlePlaybackShortcut(
  event: PlaybackShortcutEvent,
  dispatch: PlayerControlsDispatch,
  options: PlaybackShortcutOptions = {}
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey || isEditableShortcutTarget(event.target)) {
    return false;
  }

  const key = normalizeShortcutKey(event.key);
  const handler = SHORTCUT_HANDLERS.get(key);
  if (!handler) {
    return false;
  }

  if (key === 'f' && !options.toggleFullscreen) {
    return false;
  }

  handler(dispatch, {
    ...options,
    volumeStep: normalizePositiveNumber(options.volumeStep, DEFAULT_VOLUME_STEP),
    seekStepSeconds: normalizePositiveNumber(options.seekStepSeconds, DEFAULT_SEEK_STEP_SECONDS)
  });
  event.preventDefault();

  return true;
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!target || !isElementLike(target)) {
    return false;
  }

  let element: Element | null = target;
  while (element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }

    const contentEditable = element.getAttribute('contenteditable');
    if (contentEditable === '' || contentEditable?.toLowerCase() === 'true') {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

export function clampShortcutVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(volume)));
}

export function readShortcutVolume(snapshot?: PlayerStoreSnapshot | null): number {
  return clampShortcutVolume(snapshot?.application.volume ?? 0);
}

function normalizeShortcutKey(key: string): string {
  return key === ' ' ? key : key.toLowerCase();
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function isElementLike(target: EventTarget): target is Element {
  return (
    typeof (target as Element).tagName === 'string' &&
    typeof (target as Element).getAttribute === 'function'
  );
}
