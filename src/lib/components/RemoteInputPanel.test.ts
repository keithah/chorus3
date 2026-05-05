import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RemoteInputPanel, { type RemoteInputPanelRemoteDispatch } from './RemoteInputPanel.svelte';
import { createTranslationContext } from '$lib/i18n';
import type { RemoteInputDispatchSnapshot } from '$lib/stores/remoteInputDispatch.svelte';
import type { PlayerControlsDispatch } from './PlayerControls.svelte';
import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';

type MountedComponent = ReturnType<typeof mount>;
type FakeRemoteDispatch = RemoteInputPanelRemoteDispatch & {
  sendInput: ReturnType<typeof vi.fn>;
};
type FakePlayerDispatch = PlayerControlsDispatch & {
  playPause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  previous: ReturnType<typeof vi.fn>;
  next: ReturnType<typeof vi.fn>;
  seekPercentage: ReturnType<typeof vi.fn>;
  seekRelativeSeconds: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  toggleMute: ReturnType<typeof vi.fn>;
  setShuffle: ReturnType<typeof vi.fn>;
  setRepeat: ReturnType<typeof vi.fn>;
  setSubtitle: ReturnType<typeof vi.fn>;
  setAudioStream: ReturnType<typeof vi.fn>;
  startLocalPlayback: ReturnType<typeof vi.fn>;
  resumeOnKodi: ReturnType<typeof vi.fn>;
};

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

describe('RemoteInputPanel', () => {
  it('renders the compact Chorus2-style controller with accessible command buttons', () => {
    mounted = mountPanel();

    expect(heading('Remote')).toBeTruthy();
    expect(screenText()).toContain('Last command: none');
    expect(screenText()).toContain('Status: idle');
    expect(document.body.querySelector('.kodi-remote')).toBeInstanceOf(HTMLElement);
    expect(document.body.querySelector('.remote-hero')).toBeNull();
    expect(document.body.querySelector('.remote-section')).toBeNull();

    for (const label of [
      'Move left',
      'Move up',
      'Move right',
      'Move down',
      'Select',
      'Go back',
      'Show info',
      'Open context menu',
      'Go home'
    ]) {
      const control = button(label);
      expect(control.disabled).toBe(false);
      expect(control.className).toContain('ibut');
    }
  });

  it('sends safe remote input commands through the injected remote dispatch and catches unexpected rejections', async () => {
    const remoteDispatch = createRemoteDispatch();
    remoteDispatch.sendInput.mockRejectedValueOnce(
      new Error('raw secret admin:p@ssword Authorization: Basic verysecret')
    );

    mounted = mountPanel({ remoteDispatch });

    button('Move left').click();
    await flushMicrotasks();

    expect(remoteDispatch.sendInput).toHaveBeenCalledWith('left');
    expect(screenText()).not.toContain('p@ssword');
    expect(screenText()).not.toContain('verysecret');
    expect(screenText()).not.toContain('Authorization: Basic');
  });

  it('routes the compact stop control through the injected PlayerControlsDispatch seam', () => {
    const playerDispatch = createPlayerDispatch();

    mounted = mountPanel({
      playerSnapshot: createActivePlayerSnapshot(),
      playerDispatch
    });

    button('Stop').click();

    expect(playerDispatch.stop).toHaveBeenCalledTimes(1);
  });

  it('keeps the Chorus2 power affordance visible, disabled, and unable to call dispatches', () => {
    const remoteDispatch = createRemoteDispatch();
    const playerDispatch = createPlayerDispatch();

    mounted = mountPanel({
      remoteDispatch,
      playerDispatch,
      playerSnapshot: createActivePlayerSnapshot()
    });

    const control = button('Power and system');
    expect(control.disabled).toBe(true);
    control.click();

    expect(remoteDispatch.sendInput).not.toHaveBeenCalled();
    expect(playerDispatch.playPause).not.toHaveBeenCalled();
    expect(playerDispatch.stop).not.toHaveBeenCalled();
    expect(playerDispatch.previous).not.toHaveBeenCalled();
    expect(playerDispatch.next).not.toHaveBeenCalled();
  });

  it('renders only secret-safe diagnostics from failed snapshots', () => {
    mounted = mountPanel({
      remoteSnapshot: createRemoteSnapshot({
        commandStatus: 'failed',
        lastCommand: 'home',
        lastCompletedAt: '2026-05-02T17:00:00.000Z',
        lastError: {
          source: 'http',
          code: 'transport/raw',
          message:
            'Could not call http://admin:p@ssword@kodi.local/jsonrpc with Authorization: Basic verysecret and /media/private/movie.mkv'
        }
      })
    });

    expect(screenText()).toContain('Last command: Home');
    expect(screenText()).toContain('Status: failed');
    expect(screenText()).toContain('transport/raw');
    expect(screenText()).toContain('[redacted-url]');
    expect(screenText()).toContain('credentials [redacted]');
    expect(screenText()).toContain('redacted-file');
    expect(screenText()).not.toContain('admin:p@ssword');
    expect(screenText()).not.toContain('verysecret');
    expect(screenText()).not.toContain('/media/private/movie.mkv');
  });
});

function mountPanel({
  remoteSnapshot = createRemoteSnapshot(),
  remoteDispatch = createRemoteDispatch(remoteSnapshot),
  playerSnapshot = createPlayerSnapshot(),
  playerDispatch = createPlayerDispatch()
}: {
  remoteSnapshot?: RemoteInputDispatchSnapshot;
  remoteDispatch?: FakeRemoteDispatch;
  playerSnapshot?: PlayerStoreSnapshot;
  playerDispatch?: FakePlayerDispatch;
} = {}): MountedComponent {
  return mount(RemoteInputPanel, {
    target: document.body,
    props: {
      remoteSnapshot,
      remoteInputDispatch: remoteDispatch,
      playerSnapshot,
      playerDispatch,
      i18n: createTranslationContext('en')
    }
  });
}

function createRemoteDispatch(snapshot = createRemoteSnapshot()): FakeRemoteDispatch {
  return {
    snapshot,
    sendInput: vi.fn().mockResolvedValue(undefined)
  };
}

function createRemoteSnapshot(
  overrides: Partial<RemoteInputDispatchSnapshot> = {}
): RemoteInputDispatchSnapshot {
  return {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

function createPlayerDispatch(overrides: Partial<PlayerDispatchSnapshot> = {}): FakePlayerDispatch {
  return {
    snapshot: {
      mode: 'kodi',
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null,
      ...overrides
    },
    playPause: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    previous: vi.fn().mockResolvedValue(undefined),
    next: vi.fn().mockResolvedValue(undefined),
    seekPercentage: vi.fn().mockResolvedValue(undefined),
    seekRelativeSeconds: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn().mockResolvedValue(undefined),
    toggleMute: vi.fn().mockResolvedValue(undefined),
    setShuffle: vi.fn().mockResolvedValue(undefined),
    setRepeat: vi.fn().mockResolvedValue(undefined),
    setSubtitle: vi.fn().mockResolvedValue(undefined),
    setAudioStream: vi.fn().mockResolvedValue(undefined),
    startLocalPlayback: vi.fn().mockResolvedValue(undefined),
    resumeOnKodi: vi.fn().mockResolvedValue(undefined)
  };
}

function createPlayerSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playbackStatus: 'none',
    lastRefreshReason: 'manual',
    lastQueueRefreshReason: null,
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    activePlayers: [],
    primaryPlayer: null,
    item: null,
    properties: null,
    application: { volume: 50, muted: false },
    queue: { playlistid: null, position: null },
    time: { currentSeconds: null, totalSeconds: null },
    lastError: null,
    ...overrides
  };
}

function createActivePlayerSnapshot(
  overrides: Partial<PlayerStoreSnapshot> = {}
): PlayerStoreSnapshot {
  return createPlayerSnapshot({
    playbackStatus: 'active',
    activePlayers: [{ playerid: 1, type: 'video' }],
    primaryPlayer: { playerid: 1, type: 'video' },
    properties: {
      percentage: 42,
      speed: 1,
      shuffled: false,
      repeat: 'off',
      subtitleenabled: false,
      audiostreams: [],
      currentaudiostream: {},
      subtitles: [],
      currentsubtitle: {}
    },
    ...overrides
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function heading(name: string): HTMLHeadingElement {
  const match = Array.from(document.querySelectorAll('h1, h2, h3')).find(
    (candidate) => candidate.textContent?.trim() === name
  );

  if (!(match instanceof HTMLHeadingElement)) {
    throw new Error(`Heading not found: ${name}`);
  }

  return match;
}

function button(name: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (candidate) =>
      candidate.textContent?.trim() === name || candidate.getAttribute('aria-label') === name
  );

  if (!(match instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${name}`);
  }

  return match;
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
