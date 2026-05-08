import { describe, expect, it, vi } from 'vitest';

import {
  PLAYBACK_SHORTCUTS,
  clampShortcutVolume,
  handlePlaybackShortcut,
  isEditableShortcutTarget,
  readShortcutVolume
} from './playbackShortcuts';
import type { PlayerControlsDispatch } from '$lib/components/PlayerControls.svelte';
import type { PlayerDispatchSnapshot, PlayerStoreSnapshot } from '$lib/stores';

type MockedPlayerControlsDispatch = PlayerControlsDispatch & {
  [Method in Exclude<keyof PlayerControlsDispatch, 'snapshot'>]: ReturnType<typeof vi.fn>;
};

function createDispatch(): MockedPlayerControlsDispatch {
  const snapshot: PlayerDispatchSnapshot = {
    mode: 'kodi',
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null
  };

  return {
    snapshot,
    playPause: vi.fn(),
    stop: vi.fn(),
    previous: vi.fn(),
    next: vi.fn(),
    seekPercentage: vi.fn(),
    seekRelativeSeconds: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    setShuffle: vi.fn(),
    setPartyMode: vi.fn(),
    setRepeat: vi.fn(),
    setSubtitle: vi.fn(),
    setAudioStream: vi.fn(),
    startLocalPlayback: vi.fn(),
    resumeOnKodi: vi.fn()
  };
}

function createPlayerSnapshot(volume: unknown = 50): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: null,
    lastUpdatedAt: '2026-05-01T12:00:00.000Z',
    activePlayers: [{ playerid: 1, type: 'audio' }],
    primaryPlayer: { playerid: 1, type: 'audio' },
    item: null,
    properties: null,
    application: { volume: volume as number | null, muted: false },
    queue: { playlistid: 0, position: 0 },
    time: { currentSeconds: null, totalSeconds: null },
    lastError: null
  };
}

function keyboardEvent(key: string, overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key,
    target: document.body,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault: vi.fn(),
    ...overrides
  } as unknown as KeyboardEvent;
}

describe('PLAYBACK_SHORTCUTS', () => {
  it('exports stable shortcut labels and semantics for documentation reuse', () => {
    expect(PLAYBACK_SHORTCUTS).toEqual([
      expect.objectContaining({ key: 'Space', label: 'Play / pause', action: 'playPause' }),
      expect.objectContaining({
        key: 'ArrowLeft',
        label: 'Seek back 30 seconds',
        action: 'seekBack'
      }),
      expect.objectContaining({
        key: 'ArrowRight',
        label: 'Seek forward 30 seconds',
        action: 'seekForward'
      }),
      expect.objectContaining({ key: 'ArrowUp', label: 'Volume up', action: 'volumeUp' }),
      expect.objectContaining({ key: 'ArrowDown', label: 'Volume down', action: 'volumeDown' }),
      expect.objectContaining({ key: 'M', label: 'Toggle mute', action: 'toggleMute' }),
      expect.objectContaining({ key: 'N', label: 'Next item', action: 'next' }),
      expect.objectContaining({ key: 'P', label: 'Previous item', action: 'previous' }),
      expect.objectContaining({ key: 'F', label: 'Toggle fullscreen', action: 'fullscreen' })
    ]);
  });
});

describe('isEditableShortcutTarget', () => {
  it('detects native editable form targets', () => {
    expect(isEditableShortcutTarget(document.createElement('input'))).toBe(true);
    expect(isEditableShortcutTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableShortcutTarget(document.createElement('select'))).toBe(true);
  });

  it('detects nested contenteditable targets', () => {
    const editor = document.createElement('div');
    const child = document.createElement('span');
    editor.setAttribute('contenteditable', 'true');
    editor.append(child);

    expect(isEditableShortcutTarget(child)).toBe(true);
  });

  it('treats ordinary elements and null targets as non-editable', () => {
    expect(isEditableShortcutTarget(document.createElement('button'))).toBe(false);
    expect(isEditableShortcutTarget(null)).toBe(false);
  });
});

describe('volume helpers', () => {
  it('clamps shortcut volume to 0 through 100', () => {
    expect(clampShortcutVolume(-1)).toBe(0);
    expect(clampShortcutVolume(0)).toBe(0);
    expect(clampShortcutVolume(55.6)).toBe(56);
    expect(clampShortcutVolume(101)).toBe(100);
    expect(clampShortcutVolume(Number.NaN)).toBe(0);
  });

  it('reads missing snapshot volume as 0 without throwing', () => {
    expect(readShortcutVolume()).toBe(0);
    expect(readShortcutVolume(createPlayerSnapshot(null))).toBe(0);
    expect(readShortcutVolume(createPlayerSnapshot('loud'))).toBe(0);
    expect(readShortcutVolume(createPlayerSnapshot(87))).toBe(87);
  });
});

describe('handlePlaybackShortcut', () => {
  it.each([
    [' ', 'playPause', []],
    ['Space', 'playPause', []],
    ['ArrowLeft', 'seekRelativeSeconds', [-30]],
    ['ArrowRight', 'seekRelativeSeconds', [30]],
    ['m', 'toggleMute', []],
    ['M', 'toggleMute', []],
    ['n', 'next', []],
    ['N', 'next', []],
    ['p', 'previous', []],
    ['P', 'previous', []]
  ])('dispatches %s through PlayerControlsDispatch.%s', (key, method, args) => {
    const dispatch = createDispatch();
    const event = keyboardEvent(key);

    const handled = handlePlaybackShortcut(event, dispatch, {
      playerSnapshot: createPlayerSnapshot(50)
    });

    expect(handled).toBe(true);
    const dispatched = dispatch[method as Exclude<keyof PlayerControlsDispatch, 'snapshot'>];
    expect(dispatched).toHaveBeenCalledWith(...args);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('adjusts volume in clamped five-point steps from the player snapshot', () => {
    const upDispatch = createDispatch();
    const downDispatch = createDispatch();
    const upEvent = keyboardEvent('ArrowUp');
    const downEvent = keyboardEvent('ArrowDown');

    expect(
      handlePlaybackShortcut(upEvent, upDispatch, { playerSnapshot: createPlayerSnapshot(98) })
    ).toBe(true);
    expect(
      handlePlaybackShortcut(downEvent, downDispatch, { playerSnapshot: createPlayerSnapshot(2) })
    ).toBe(true);

    expect(upDispatch.setVolume).toHaveBeenCalledWith(100);
    expect(downDispatch.setVolume).toHaveBeenCalledWith(0);
    expect(upEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(downEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('uses 0 as the safe volume fallback when snapshot volume is missing', () => {
    const dispatch = createDispatch();

    expect(handlePlaybackShortcut(keyboardEvent('ArrowUp'), dispatch)).toBe(true);

    expect(dispatch.setVolume).toHaveBeenCalledWith(5);
  });

  it('runs fullscreen only when the optional helper is available', () => {
    const dispatch = createDispatch();
    const toggleFullscreen = vi.fn();
    const event = keyboardEvent('f');

    expect(handlePlaybackShortcut(event, dispatch, { toggleFullscreen })).toBe(true);

    expect(toggleFullscreen).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(dispatch.playPause).not.toHaveBeenCalled();
  });

  it('does not handle fullscreen when the optional helper is unavailable', () => {
    const dispatch = createDispatch();
    const event = keyboardEvent('f');

    expect(handlePlaybackShortcut(event, dispatch)).toBe(false);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('suppresses shortcuts from editable targets without preventing default', () => {
    const dispatch = createDispatch();
    const input = document.createElement('input');
    const event = keyboardEvent(' ', { target: input });

    expect(handlePlaybackShortcut(event, dispatch)).toBe(false);

    expect(dispatch.playPause).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it.each([['ctrlKey'], ['metaKey'], ['altKey']] as const)(
    'suppresses shortcuts with %s without preventing default',
    (modifier) => {
      const dispatch = createDispatch();
      const event = keyboardEvent(' ', { [modifier]: true } as Partial<KeyboardEvent>);

      expect(handlePlaybackShortcut(event, dispatch)).toBe(false);

      expect(dispatch.playPause).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  );

  it('ignores unknown keys without preventing default', () => {
    const dispatch = createDispatch();
    const event = keyboardEvent('Escape');

    expect(handlePlaybackShortcut(event, dispatch)).toBe(false);

    expect(dispatch.playPause).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('does not prevent default when dispatch throws synchronously', () => {
    const dispatch = createDispatch();
    const event = keyboardEvent(' ');
    dispatch.playPause.mockImplementation(() => {
      throw new Error('owned by dispatch');
    });

    expect(() => handlePlaybackShortcut(event, dispatch)).toThrow('owned by dispatch');
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
