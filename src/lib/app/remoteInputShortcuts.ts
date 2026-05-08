import type { RemoteInputAction, RemoteInputCommand } from '$lib/kodi';
import { isEditableShortcutTarget } from './playbackShortcuts';

export interface RemoteInputShortcutDefinition {
  key: string;
  label: string;
  command?: RemoteInputCommand;
  action?: RemoteInputAction;
  description: string;
}

export type RemoteInputShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'target' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'
>;

export interface RemoteInputShortcutDispatch {
  sendInput(command: RemoteInputCommand): Promise<void> | void;
  executeAction?(action: RemoteInputAction): Promise<void> | void;
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
  },
  {
    key: 'T',
    label: 'Toggle subtitles',
    action: 'showsubtitles',
    description: 'Send Kodi Input.ExecuteAction showsubtitles on the Remote route.'
  },
  {
    key: 'Tab',
    label: 'Close OSD',
    action: 'close',
    description: 'Send Kodi Input.ExecuteAction close on the Remote route.'
  },
  {
    key: 'O',
    label: 'Show OSD',
    action: 'osd',
    description: 'Send Kodi Input.ExecuteAction osd on the Remote route.'
  },
  {
    key: '\\',
    label: 'Kodi fullscreen',
    action: 'fullscreen',
    description: 'Send Kodi Input.ExecuteAction fullscreen on the Remote route.'
  }
] as const;

const REMOTE_INPUT_SHORTCUT_COMMANDS: ReadonlyMap<string, RemoteInputCommand> = new Map(
  REMOTE_INPUT_SHORTCUTS.flatMap((shortcut) =>
    shortcut.command
      ? [
          [normalizeRemoteShortcutKey(shortcut.key), shortcut.command],
          ...(shortcut.key.length === 1
            ? [[shortcut.key.toLowerCase(), shortcut.command] as const]
            : [])
        ]
      : []
  )
);
const REMOTE_INPUT_SHORTCUT_ACTIONS: ReadonlyMap<string, RemoteInputAction> = new Map(
  REMOTE_INPUT_SHORTCUTS.flatMap((shortcut) =>
    shortcut.action
      ? [
          [normalizeRemoteShortcutKey(shortcut.key), shortcut.action],
          ...(shortcut.key.length === 1
            ? [[shortcut.key.toLowerCase(), shortcut.action] as const]
            : [])
        ]
      : []
  )
);

export function handleRemoteInputShortcut(
  event: RemoteInputShortcutEvent,
  dispatch: RemoteInputShortcutDispatch
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey || isEditableShortcutTarget(event.target)) {
    return false;
  }

  const command = REMOTE_INPUT_SHORTCUT_COMMANDS.get(normalizeRemoteShortcutKey(event.key));
  const action = REMOTE_INPUT_SHORTCUT_ACTIONS.get(normalizeRemoteShortcutKey(event.key));
  if (!command && !action) {
    return false;
  }

  if (command) {
    dispatch.sendInput(command);
  } else if (action && dispatch.executeAction) {
    dispatch.executeAction(action);
  } else {
    return false;
  }
  event.preventDefault();

  return true;
}

function normalizeRemoteShortcutKey(key: string): string {
  return key.toLowerCase();
}
