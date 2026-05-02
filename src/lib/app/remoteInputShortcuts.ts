import type { RemoteInputCommand } from '$lib/kodi';
import { isEditableShortcutTarget } from './playbackShortcuts';

export interface RemoteInputShortcutDefinition {
  key: string;
  label: string;
  command: RemoteInputCommand;
  description: string;
}

export type RemoteInputShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'target' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'
>;

export interface RemoteInputShortcutDispatch {
  sendInput(command: RemoteInputCommand): Promise<void> | void;
}

export const REMOTE_INPUT_SHORTCUTS: readonly RemoteInputShortcutDefinition[] = [
  {
    key: 'ArrowLeft',
    label: 'Move left',
    command: 'left',
    description: 'Send Kodi Input.Left on the Remote route.'
  },
  {
    key: 'ArrowUp',
    label: 'Move up',
    command: 'up',
    description: 'Send Kodi Input.Up on the Remote route.'
  },
  {
    key: 'ArrowRight',
    label: 'Move right',
    command: 'right',
    description: 'Send Kodi Input.Right on the Remote route.'
  },
  {
    key: 'ArrowDown',
    label: 'Move down',
    command: 'down',
    description: 'Send Kodi Input.Down on the Remote route.'
  },
  {
    key: 'Enter',
    label: 'Select',
    command: 'select',
    description: 'Send Kodi Input.Select on the Remote route.'
  },
  {
    key: 'Backspace',
    label: 'Back',
    command: 'back',
    description: 'Send Kodi Input.Back on the Remote route.'
  },
  {
    key: 'Escape',
    label: 'Back',
    command: 'back',
    description: 'Send Kodi Input.Back on the Remote route.'
  },
  {
    key: 'I',
    label: 'Info',
    command: 'info',
    description: 'Send Kodi Input.Info on the Remote route.'
  },
  {
    key: 'C',
    label: 'Context menu',
    command: 'contextMenu',
    description: 'Send Kodi Input.ContextMenu on the Remote route.'
  },
  {
    key: 'H',
    label: 'Home',
    command: 'home',
    description: 'Send Kodi Input.Home on the Remote route.'
  }
] as const;

const REMOTE_INPUT_SHORTCUT_COMMANDS: ReadonlyMap<string, RemoteInputCommand> = new Map(
  REMOTE_INPUT_SHORTCUTS.flatMap((shortcut) => [
    [normalizeRemoteShortcutKey(shortcut.key), shortcut.command],
    ...(shortcut.key.length === 1 ? [[shortcut.key.toLowerCase(), shortcut.command] as const] : [])
  ])
);

export function handleRemoteInputShortcut(
  event: RemoteInputShortcutEvent,
  dispatch: RemoteInputShortcutDispatch
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey || isEditableShortcutTarget(event.target)) {
    return false;
  }

  const command = REMOTE_INPUT_SHORTCUT_COMMANDS.get(normalizeRemoteShortcutKey(event.key));
  if (!command) {
    return false;
  }

  dispatch.sendInput(command);
  event.preventDefault();

  return true;
}

function normalizeRemoteShortcutKey(key: string): string {
  return key.toLowerCase();
}
