import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NowPlayingPanel from './NowPlayingPanel.svelte';
import { createTranslationContext, type TranslationContext } from '$lib/i18n';
import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';

type MountedComponent = ReturnType<typeof mount>;
type FakeDispatch = {
  snapshot: PlayerDispatchSnapshot;
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

describe('NowPlayingPanel', () => {
  it('renders an explanatory disabled state when no player is active', () => {
    renderPanel({ snapshot: createSnapshot() });

    expect(screenText()).toContain('No active Kodi player');
    expect(button('Play or pause').disabled).toBe(true);
    expect(slider('Seek position').disabled).toBe(true);
    expect(slider('Volume').disabled).toBe(true);
  });

  it('renders active Kodi-mode metadata and live status without exposing raw media file paths', () => {
    renderPanel({ snapshot: createActiveMovieSnapshot() });

    expect(screenText()).toContain('The Movie Title');
    expect(screenText()).toContain('Example Artist');
    expect(screenText()).toContain('movie');
    expect(screenText()).toContain('01:05');
    expect(screenText()).toContain('02:10');
    expect(screenText()).toContain('50%');
    expect(screenText()).toContain('Volume 75');
    expect(screenText()).toContain('Muted: no');
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Playing on Kodi.'
    );
    expect(screenText()).not.toContain('/mnt/private/movie.mkv');
  });

  it('blocks controls and explains ambiguity when multiple players are active', () => {
    renderPanel({
      snapshot: createSnapshot({
        playbackStatus: 'multiple',
        activePlayers: [
          { playerid: 2, type: 'audio' },
          { playerid: 7, type: 'video' }
        ],
        primaryPlayer: { playerid: 2, type: 'audio' }
      })
    });

    expect(screenText()).toContain('Multiple Kodi players are active');
    expect(button('Next').disabled).toBe(true);
    expect(select('Repeat mode').disabled).toBe(true);
  });

  it('disables every command control while a command is running', () => {
    renderPanel({
      snapshot: createActiveMovieSnapshot(),
      dispatch: createDispatch({ commandStatus: 'running', lastCommand: 'setVolume' })
    });

    expect(screenText()).toContain('Running set volume');
    for (const control of document.querySelectorAll('button, input, select')) {
      const input = control instanceof HTMLInputElement ? control : null;
      const isRange = input?.type === 'range';
      expect((control as HTMLButtonElement | HTMLInputElement | HTMLSelectElement).disabled).toBe(
        !isRange
      );
    }
  });

  it('renders a Play locally button and dispatches startLocalPlayback', () => {
    const dispatch = createDispatch();
    renderPanel({ snapshot: createActiveMovieSnapshot(), dispatch });

    click(button('Play locally'));

    expect(dispatch.startLocalPlayback).toHaveBeenCalledTimes(1);
  });

  it('renders Resume on Kodi when local playback can resume', () => {
    const dispatch = createDispatch({ mode: 'local' });
    renderPanel({
      snapshot: createActiveMovieSnapshot(),
      dispatch,
      localPlayerSnapshot: {
        status: 'paused',
        mediaKind: 'audio',
        source: null,
        item: { label: 'Song', type: 'song' },
        currentSeconds: 10,
        durationSeconds: 100,
        volume: 100,
        muted: false,
        lastError: null,
        kodiPausedForLocal: true,
        resumeAvailable: true,
        lastUpdatedAt: '2026-01-01T00:00:00.000Z'
      }
    });

    click(button('Resume on Kodi'));

    expect(dispatch.resumeOnKodi).toHaveBeenCalledTimes(1);
  });

  it('enables only local-safe transport controls in Local mode when the local snapshot is active', () => {
    renderPanel({
      snapshot: createActiveMovieSnapshot(),
      dispatch: createDispatch({ mode: 'local' }),
      localPlayerSnapshot: {
        status: 'playing',
        mediaKind: 'video',
        source: null,
        item: { label: 'Local Movie', type: 'movie' },
        currentSeconds: 45,
        durationSeconds: 300,
        volume: 66,
        muted: false,
        lastError: null,
        kodiPausedForLocal: true,
        resumeAvailable: true,
        lastUpdatedAt: '2026-01-01T00:00:00.000Z'
      }
    });

    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Playing locally in the browser.'
    );
    expect(button('Play or pause').disabled).toBe(false);
    expect(button('Stop').disabled).toBe(false);
    expect(slider('Seek position').disabled).toBe(false);
    expect(slider('Volume').disabled).toBe(false);
    expect(button('Previous').disabled).toBe(true);
    expect(button('Next').disabled).toBe(true);
    expect(select('Shuffle').disabled).toBe(true);
    expect(select('Repeat mode').disabled).toBe(true);
    expect(select('Audio stream').disabled).toBe(true);
    expect(select('Subtitle stream').disabled).toBe(true);
  });

  it('keeps local transport controls disabled in Local mode until a local snapshot is active', () => {
    renderPanel({
      snapshot: createActiveMovieSnapshot(),
      dispatch: createDispatch({ mode: 'local' }),
      localPlayerSnapshot: {
        status: 'idle',
        mediaKind: 'unknown',
        source: null,
        item: null,
        currentSeconds: 0,
        durationSeconds: null,
        volume: 100,
        muted: false,
        lastError: null,
        kodiPausedForLocal: true,
        resumeAvailable: true,
        lastUpdatedAt: null
      }
    });

    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Local playback ready.'
    );
    expect(button('Play or pause').disabled).toBe(true);
    expect(button('Stop').disabled).toBe(true);
    expect(slider('Seek position').disabled).toBe(true);
    expect(slider('Volume').disabled).toBe(true);
    expect(button('Resume on Kodi').disabled).toBe(false);
  });

  it('shows local playback errors in the live region without leaking URLs', () => {
    renderPanel({
      snapshot: createActiveMovieSnapshot(),
      dispatch: createDispatch({ mode: 'local' }),
      localPlayerSnapshot: {
        status: 'error',
        mediaKind: 'video',
        source: null,
        item: { label: 'Video', type: 'movie' },
        currentSeconds: 0,
        durationSeconds: null,
        volume: 100,
        muted: false,
        lastError: { code: 'media/error', message: 'failed for http://admin:p@ssword@kodi.local' },
        kodiPausedForLocal: false,
        resumeAvailable: false,
        lastUpdatedAt: '2026-01-01T00:00:00.000Z'
      }
    });

    const status = document.querySelector('[aria-live="polite"]');
    expect(status?.textContent).toContain('failed');
    expect(status?.textContent).not.toContain('admin:p@ssword');
  });

  it('shows sanitized command errors in a polite live region', () => {
    renderPanel({
      snapshot: createActiveMovieSnapshot(),
      dispatch: createDispatch({
        commandStatus: 'error',
        lastCommand: 'playPause',
        lastError: {
          source: 'http',
          code: 'http/auth-failed',
          message: 'Kodi rejected credentials for [redacted-url] using credentials [redacted]'
        }
      })
    });

    const status = document.querySelector('[aria-live="polite"]');
    expect(status?.textContent).toContain('Kodi rejected credentials');
    expect(status?.textContent).not.toContain('p@ssword');
    expect(status?.textContent).not.toContain('Authorization');
    expect(status?.textContent).not.toContain('http://admin');
  });

  it('renders stream lists with readable fallbacks and dispatches selected stream indexes', () => {
    const dispatch = createDispatch();
    renderPanel({
      snapshot: createActiveMovieSnapshot({
        properties: {
          percentage: 10,
          speed: 1,
          shuffled: false,
          repeat: 'off',
          subtitleenabled: true,
          audiostreams: [
            { index: 0, name: 'Stereo', language: 'eng', channels: 2 },
            { index: 1, language: 'jpn' }
          ],
          currentaudiostream: { index: 1, language: 'jpn' },
          subtitles: [{ index: 3, language: 'spa' }, { name: 'Commentary' }],
          currentsubtitle: { index: 3, language: 'spa' }
        }
      }),
      dispatch
    });

    expect(select('Audio stream').textContent).toContain('Stereo · eng · 2ch');
    expect(select('Audio stream').textContent).toContain('Audio stream 1 · jpn');
    expect(select('Subtitle stream').textContent).toContain('Subtitle stream 3 · spa');
    expect(select('Subtitle stream').textContent).toContain('Commentary');

    changeSelect('Audio stream', '0');
    changeSelect('Subtitle stream', 'off');

    expect(dispatch.setAudioStream).toHaveBeenCalledWith(0);
    expect(dispatch.setSubtitle).toHaveBeenCalledWith('off');
  });

  it('calls only injected dispatch methods for playback, seek, volume, shuffle, and repeat commands', () => {
    const dispatch = createDispatch();
    renderPanel({ snapshot: createActiveMovieSnapshot(), dispatch });

    click(button('Play or pause'));
    click(button('Stop'));
    click(button('Previous'));
    click(button('Next'));
    click(button('Seek back 30 seconds'));
    click(button('Seek forward 30 seconds'));
    changeRange('Seek position', '100');
    changeRange('Volume', '0');
    click(button('Toggle mute'));
    changeSelect('Shuffle', 'true');
    changeSelect('Repeat mode', 'all');

    expect(dispatch.playPause).toHaveBeenCalledTimes(1);
    expect(dispatch.stop).toHaveBeenCalledTimes(1);
    expect(dispatch.previous).toHaveBeenCalledTimes(1);
    expect(dispatch.next).toHaveBeenCalledTimes(1);
    expect(dispatch.seekRelativeSeconds).toHaveBeenNthCalledWith(1, -30);
    expect(dispatch.seekRelativeSeconds).toHaveBeenNthCalledWith(2, 30);
    expect(dispatch.seekPercentage).toHaveBeenCalledWith(100);
    expect(dispatch.setVolume).toHaveBeenCalledWith(0);
    expect(dispatch.toggleMute).toHaveBeenCalledTimes(1);
    expect(dispatch.setShuffle).toHaveBeenCalledWith(true);
    expect(dispatch.setRepeat).toHaveBeenCalledWith('all');
  });

  it('handles malformed metadata, unknown duration, muted volume, and missing selected streams safely', () => {
    renderPanel({
      snapshot: createSnapshot({
        playbackStatus: 'active',
        activePlayers: [{ playerid: 4, type: 'video' }],
        primaryPlayer: { playerid: 4, type: 'video' },
        item: { file: 'smb://admin:p@ssword@server/private-file.mkv' },
        properties: {
          percentage: 0,
          speed: 0,
          shuffled: true,
          repeat: 'cycle',
          audiostreams: [{}],
          subtitles: [{}]
        },
        application: { volume: null, muted: true },
        time: { currentSeconds: 0, totalSeconds: null }
      })
    });

    expect(screenText()).toContain('Unknown title');
    expect(screenText()).toContain('00:00');
    expect(screenText()).toContain('Unknown duration');
    expect(screenText()).toContain('Volume unknown');
    expect(screenText()).toContain('Muted: yes');
    expect(screenText()).toContain('Audio stream 1');
    expect(screenText()).toContain('Subtitle stream 1');
    expect(screenText()).not.toContain('p@ssword');
    expect(screenText()).not.toContain('private-file.mkv');
    expect(slider('Seek position').value).toBe('0');
  });

  it('renders German now-playing metadata labels, empty state, and local error diagnostics', () => {
    renderPanel({
      snapshot: createSnapshot({
        playbackStatus: 'none',
        item: { file: 'smb://admin:p@ssword@server/private-file.mkv' },
        application: { volume: null, muted: null },
        time: { currentSeconds: null, totalSeconds: null }
      }),
      dispatch: createDispatch({ mode: 'local' }),
      localPlayerSnapshot: {
        status: 'error',
        mediaKind: 'video',
        source: null,
        item: null,
        currentSeconds: 0,
        durationSeconds: null,
        volume: 100,
        muted: false,
        lastError: { code: 'media/error', message: 'failed for http://admin:p@ssword@kodi.local' },
        kodiPausedForLocal: false,
        resumeAvailable: false,
        lastUpdatedAt: '2026-01-01T00:00:00.000Z'
      },
      i18n: createTranslationContext('de')
    });

    const text = screenText();
    expect(text).toContain('Unbekannter Titel');
    expect(text).toContain('Unbekannter Künstler');
    expect(text).toContain('Unbekannte Dauer');
    expect(text).toContain('Lautstärke unbekannt');
    expect(text).toContain('Stumm: unbekannt');
    expect(text).toContain('Warteschlange unbekannt');
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain('failed');
    expect(document.querySelector('[aria-live="polite"]')?.textContent).not.toContain(
      'admin:p@ssword'
    );
    expect(button('Lokal abspielen').disabled).toBe(true);
    expect(slider('Suchposition').value).toBe('0');
    expect(select('Wiederholmodus').disabled).toBe(true);
  });
});

function renderPanel(input: {
  snapshot: PlayerStoreSnapshot;
  dispatch?: FakeDispatch;
  localPlayerSnapshot?: import('$lib/stores/localPlayer.svelte').LocalPlayerStoreSnapshot;
  i18n?: TranslationContext;
}): void {
  mounted = mount(NowPlayingPanel, {
    target: document.body,
    props: {
      snapshot: input.snapshot,
      dispatch: input.dispatch ?? createDispatch(),
      localPlayerSnapshot: input.localPlayerSnapshot,
      i18n: input.i18n
    }
  });
}

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

function createActiveMovieSnapshot(
  overrides: Partial<PlayerStoreSnapshot> = {}
): PlayerStoreSnapshot {
  return createSnapshot({
    playbackStatus: 'active',
    activePlayers: [{ playerid: 7, type: 'video' }],
    primaryPlayer: { playerid: 7, type: 'video' },
    item: {
      type: 'movie',
      label: 'The Movie Label',
      title: 'The Movie Title',
      artist: ['Example Artist'],
      file: '/mnt/private/movie.mkv'
    },
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
    application: { volume: 75, muted: false },
    time: { currentSeconds: 65, totalSeconds: 130 },
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

function click(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
