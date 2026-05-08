import { describe, expect, it, vi } from 'vitest';

import {
  REMOTE_INPUT_SHORTCUTS,
  handleRemoteInputShortcut,
  type RemoteInputShortcutEvent
} from './remoteInputShortcuts';
import type { RemoteInputCommand } from '$lib/kodi';

interface FakeRemoteInputDispatch {
  sendInput: ReturnType<typeof vi.fn>;
  executeAction: ReturnType<typeof vi.fn>;
}

function createDispatch(): FakeRemoteInputDispatch {
  return {
    sendInput: vi.fn().mockResolvedValue(undefined),
    executeAction: vi.fn().mockResolvedValue(undefined)
  };
}

function keyboardEvent(
  key: string,
  overrides: Partial<RemoteInputShortcutEvent> = {}
): RemoteInputShortcutEvent {
  return {
    key,
    target: document.body,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault: vi.fn(),
    ...overrides
  };
}

describe('REMOTE_INPUT_SHORTCUTS', () => {
  it('exports stable route-scoped remote shortcut labels and commands', () => {
    expect(REMOTE_INPUT_SHORTCUTS).toEqual([
      expect.objectContaining({ key: 'ArrowLeft', command: 'left', label: 'Move left' }),
      expect.objectContaining({ key: 'ArrowUp', command: 'up', label: 'Move up' }),
      expect.objectContaining({ key: 'ArrowRight', command: 'right', label: 'Move right' }),
      expect.objectContaining({ key: 'ArrowDown', command: 'down', label: 'Move down' }),
      expect.objectContaining({ key: 'Enter', command: 'select', label: 'Select' }),
      expect.objectContaining({ key: 'Backspace', command: 'back', label: 'Back' }),
      expect.objectContaining({ key: 'Escape', command: 'back', label: 'Back' }),
      expect.objectContaining({ key: 'I', command: 'info', label: 'Info' }),
      expect.objectContaining({ key: 'C', command: 'contextMenu', label: 'Context menu' }),
      expect.objectContaining({ key: 'H', command: 'home', label: 'Home' }),
      expect.objectContaining({ key: 'T', action: 'showsubtitles', label: 'Toggle subtitles' }),
      expect.objectContaining({ key: 'Tab', action: 'close', label: 'Close OSD' }),
      expect.objectContaining({ key: 'O', action: 'osd', label: 'Show OSD' }),
      expect.objectContaining({ key: '\\', action: 'fullscreen', label: 'Kodi fullscreen' })
    ]);
  });
});

describe('handleRemoteInputShortcut', () => {
  it.each([
    ['ArrowLeft', 'left'],
    ['ArrowUp', 'up'],
    ['ArrowRight', 'right'],
    ['ArrowDown', 'down'],
    ['Enter', 'select'],
    ['Backspace', 'back'],
    ['Escape', 'back'],
    ['i', 'info'],
    ['I', 'info'],
    ['c', 'contextMenu'],
    ['C', 'contextMenu'],
    ['h', 'home'],
    ['H', 'home']
  ] as const)('dispatches %s as %s and prevents default', (key, command) => {
    const dispatch = createDispatch();
    const event = keyboardEvent(key);

    const handled = handleRemoteInputShortcut(event, dispatch);

    expect(handled).toBe(true);
    expect(dispatch.sendInput).toHaveBeenCalledWith(command satisfies RemoteInputCommand);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['t', 'showsubtitles'],
    ['T', 'showsubtitles'],
    ['Tab', 'close'],
    ['o', 'osd'],
    ['O', 'osd'],
    ['\\', 'fullscreen']
  ] as const)('dispatches %s as execute action %s and prevents default', (key, action) => {
    const dispatch = createDispatch();
    const event = keyboardEvent(key);

    const handled = handleRemoteInputShortcut(event, dispatch);

    expect(handled).toBe(true);
    expect(dispatch.executeAction).toHaveBeenCalledWith(action);
    expect(dispatch.sendInput).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('ignores action shortcuts when executeAction is not provided', () => {
    const dispatch = { sendInput: vi.fn() };
    const event = keyboardEvent('t');

    expect(handleRemoteInputShortcut(event, dispatch)).toBe(false);
    expect(dispatch.sendInput).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('suppresses editable targets using the shared playback shortcut guard', () => {
    const dispatch = createDispatch();
    const editor = document.createElement('div');
    const child = document.createElement('span');
    editor.setAttribute('contenteditable', 'true');
    editor.append(child);

    for (const target of [
      document.createElement('input'),
      document.createElement('textarea'),
      document.createElement('select'),
      child
    ]) {
      const event = keyboardEvent('ArrowLeft', { target });

      expect(handleRemoteInputShortcut(event, dispatch)).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }

    expect(dispatch.sendInput).not.toHaveBeenCalled();
  });

  it.each([['ctrlKey'], ['metaKey'], ['altKey']] as const)(
    'suppresses shortcuts with %s without preventing default',
    (modifier) => {
      const dispatch = createDispatch();
      const event = keyboardEvent('ArrowLeft', { [modifier]: true });

      expect(handleRemoteInputShortcut(event, dispatch)).toBe(false);

      expect(dispatch.sendInput).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  );

  it('ignores unsupported keys without preventing default', () => {
    const dispatch = createDispatch();
    const event = keyboardEvent('x');

    expect(handleRemoteInputShortcut(event, dispatch)).toBe(false);

    expect(dispatch.sendInput).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('treats unknown non-Element targets as non-editable while still requiring supported keys', () => {
    const dispatch = createDispatch();
    const arbitraryTarget = new EventTarget();
    const handled = keyboardEvent('Enter', { target: arbitraryTarget });
    const ignored = keyboardEvent('x', { target: arbitraryTarget });

    expect(handleRemoteInputShortcut(handled, dispatch)).toBe(true);
    expect(handleRemoteInputShortcut(ignored, dispatch)).toBe(false);

    expect(dispatch.sendInput).toHaveBeenCalledWith('select');
    expect(handled.preventDefault).toHaveBeenCalledTimes(1);
    expect(ignored.preventDefault).not.toHaveBeenCalled();
  });

  it('does not prevent default when dispatch throws synchronously', () => {
    const dispatch = createDispatch();
    dispatch.sendInput.mockImplementation(() => {
      throw new Error('snapshot owns diagnostics');
    });
    const event = keyboardEvent('Enter');

    expect(() => handleRemoteInputShortcut(event, dispatch)).toThrow('snapshot owns diagnostics');
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
