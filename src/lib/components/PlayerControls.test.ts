import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PlayerControls, { type PlayerControlsDispatch } from './PlayerControls.svelte';
import { createTranslationContext } from '$lib/i18n';
import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';

type MountedComponent = ReturnType<typeof mount>;
type FakeDispatch = PlayerControlsDispatch & {
  playPause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  previous: ReturnType<typeof vi.fn>;
  next: ReturnType<typeof vi.fn>;
  seekPercentage: ReturnType<typeof vi.fn>;
  seekRelativeSeconds: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  toggleMute: ReturnType<typeof vi.fn>;
  setShuffle: ReturnType<typeof vi.fn>;
  setPartyMode: ReturnType<typeof vi.fn>;
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

describe('PlayerControls', () => {
  it('renders German playback control labels and disabled copy without changing dispatch behavior', () => {
    const dispatch = createDispatch();

    mounted = mount(PlayerControls, {
      target: document.body,
      props: {
        snapshot: createSnapshot(),
        dispatch,
        i18n: createTranslationContext('de')
      }
    });

    expect(document.querySelector('.player-controls')?.getAttribute('aria-label')).toBe(
      'Kodi-Wiedergabesteuerung'
    );
    expect(screenText()).toContain('Kein aktiver Kodi-Player ist verfügbar.');
    expect(button('Wiedergabe starten oder pausieren').disabled).toBe(true);
    expect(slider('Suchposition').disabled).toBe(true);
    expect(select('Wiederholmodus').textContent).toContain('Wiederholung aus');

    button('Wiedergabe starten oder pausieren').click();

    expect(dispatch.playPause).not.toHaveBeenCalled();
  });

  it('renders German selectable stream fallbacks and still dispatches selected control values', () => {
    const dispatch = createDispatch();

    mounted = mount(PlayerControls, {
      target: document.body,
      props: {
        snapshot: createActiveSnapshot({
          properties: {
            percentage: 25,
            speed: 1,
            shuffled: false,
            repeat: 'off',
            subtitleenabled: true,
            audiostreams: [{ index: 2, language: 'deu', channels: 2 }, {}],
            currentaudiostream: { index: 2, language: 'deu' },
            subtitles: [{ index: 4, language: 'eng' }, {}],
            currentsubtitle: { index: 4, language: 'eng' }
          }
        }),
        dispatch,
        i18n: createTranslationContext('de')
      }
    });

    expect(select('Audiostream').textContent).toContain('Audiostream 2 · deu · 2ch');
    expect(select('Audiostream').textContent).toContain('Audiostream 2');
    expect(select('Untertitelspur').textContent).toContain('Untertitelspur 4 · eng');
    expect(select('Untertitelspur').textContent).toContain('Untertitelspur 2');

    changeRange('Suchposition', '55');
    changeRange('Lautstärke', '12');
    changeSelect('Zufall', 'true');
    changeSelect('Wiederholmodus', 'all');
    changeSelect('Untertitelspur', 'off');
    changeSelect('Audiostream', '2');

    expect(dispatch.seekPercentage).toHaveBeenCalledWith(55);
    expect(dispatch.setVolume).toHaveBeenCalledWith(12);
    expect(dispatch.setShuffle).toHaveBeenCalledWith(true);
    expect(dispatch.setRepeat).toHaveBeenCalledWith('all');
    expect(dispatch.setSubtitle).toHaveBeenCalledWith('off');
    expect(dispatch.setAudioStream).toHaveBeenCalledWith(2);
  });

  it('commits range controls on change instead of every drag tick', () => {
    const dispatch = createDispatch();

    mounted = mount(PlayerControls, {
      target: document.body,
      props: {
        snapshot: createActiveSnapshot(),
        dispatch,
        i18n: createTranslationContext('en')
      }
    });

    const seek = slider('Seek position');
    seek.value = '55';
    seek.dispatchEvent(new Event('input', { bubbles: true }));
    expect(dispatch.seekPercentage).not.toHaveBeenCalled();
    seek.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dispatch.seekPercentage).toHaveBeenCalledWith(55);

    const volume = slider('Volume');
    volume.value = '12';
    volume.dispatchEvent(new Event('input', { bubbles: true }));
    expect(dispatch.setVolume).not.toHaveBeenCalled();
    volume.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dispatch.setVolume).toHaveBeenCalledWith(12);
  });

  it('keeps range controls enabled while another command is running', () => {
    const dispatch = createDispatch({ commandStatus: 'running' });

    mounted = mount(PlayerControls, {
      target: document.body,
      props: {
        snapshot: createActiveSnapshot(),
        dispatch,
        i18n: createTranslationContext('en')
      }
    });

    expect(slider('Seek position').disabled).toBe(false);
    expect(slider('Volume').disabled).toBe(false);
    expect(button('Play or pause').disabled).toBe(true);
    expect(screenText()).toContain('Another player command is running.');
    expect(screenText()).not.toContain('Controls are disabled');
  });
});

function createDispatch(overrides: Partial<PlayerDispatchSnapshot> = {}): FakeDispatch {
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
    setPartyMode: vi.fn().mockResolvedValue(undefined),
    setRepeat: vi.fn().mockResolvedValue(undefined),
    setSubtitle: vi.fn().mockResolvedValue(undefined),
    setAudioStream: vi.fn().mockResolvedValue(undefined),
    startLocalPlayback: vi.fn().mockResolvedValue(undefined),
    resumeOnKodi: vi.fn().mockResolvedValue(undefined)
  };
}

function createSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
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

function createActiveSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return createSnapshot({
    playbackStatus: 'active',
    activePlayers: [{ playerid: 7, type: 'video' }],
    primaryPlayer: { playerid: 7, type: 'video' },
    properties: {
      percentage: 50,
      speed: 1,
      shuffled: false,
      repeat: 'one',
      subtitleenabled: false,
      audiostreams: [{ index: 0, name: 'English 5.1', language: 'eng', channels: 6 }],
      currentaudiostream: { index: 0, name: 'English 5.1', language: 'eng' },
      subtitles: [{ index: 0, name: 'English captions', language: 'eng' }],
      currentsubtitle: { index: 0, name: 'English captions', language: 'eng' }
    },
    ...overrides
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
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

function slider(name: string): HTMLInputElement {
  const label = labelFor(name);
  const control = document.getElementById(label.htmlFor);

  if (!(control instanceof HTMLInputElement)) {
    throw new Error(`Slider not found: ${name}`);
  }

  return control;
}

function select(name: string): HTMLSelectElement {
  const label = labelFor(name);
  const control = document.getElementById(label.htmlFor);

  if (!(control instanceof HTMLSelectElement)) {
    throw new Error(`Select not found: ${name}`);
  }

  return control;
}

function labelFor(text: string): HTMLLabelElement {
  const match = Array.from(document.querySelectorAll('label')).find(
    (candidate) => candidate.textContent?.trim() === text
  );

  if (!(match instanceof HTMLLabelElement) || !match.htmlFor) {
    throw new Error(`Label not found: ${text}`);
  }

  return match;
}

function changeRange(name: string, value: string): void {
  const input = slider(name);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function changeSelect(name: string, value: string): void {
  const control = select(name);
  control.value = value;
  control.dispatchEvent(new Event('change', { bubbles: true }));
}
