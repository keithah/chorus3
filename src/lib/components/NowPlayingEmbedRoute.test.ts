import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NowPlayingEmbedRoute from './NowPlayingEmbedRoute.svelte';
import { createTranslationContext, type TranslationContext } from '$lib/i18n';
import type { NowPlayingEmbedQuery } from '$lib/app/nowPlayingEmbedQuery';
import type { ActiveHostSummary } from '$lib/stores/hostConnection.svelte';
import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';
import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';

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

const FORBIDDEN_TEXT = [
  'CHORUS3_SENTINEL_SECRET',
  'admin:p@ssword',
  'p@ssword',
  'http://',
  'https://',
  'kodi.local',
  'localStorage',
  'Authorization',
  'Basic',
  'username',
  'password',
  'token',
  'secret-storage-key',
  '/mnt/private/movie.mkv'
];

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('NowPlayingEmbedRoute', () => {
  it('renders saved-host iframe shell and delegates playback UI to NowPlayingPanel', () => {
    renderRoute({
      snapshot: createActiveMovieSnapshot(),
      hostSummary: createHostSummary({ label: 'Living Room Kodi', hasCredentials: true })
    });

    const text = screenText();
    expect(document.querySelector('main[aria-labelledby="now-playing-embed-title"]')).toBeTruthy();
    expect(text).toContain('Now playing embed');
    expect(text).toContain('Living Room Kodi');
    expect(text).toContain('Using saved host');
    expect(text).toContain('Credentials saved: yes');
    expect(text).toContain('The Movie Title');
    expect(button('Play locally')).toBeTruthy();
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Using saved host');
    expectNoForbiddenText();
  });

  it('renders setup guidance and no playback controls when no saved host is active', () => {
    renderRoute({
      snapshot: createActiveMovieSnapshot(),
      hostSummary: null
    });

    const text = screenText();
    expect(text).toContain('Setup required');
    expect(text).toContain(
      'Open Chorus settings and save a trusted Kodi host before embedding this view.'
    );
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Setup required');
    expect(document.querySelector('.now-playing-panel')).toBeNull();
    expectNoForbiddenText();
  });

  it('surfaces credential query rejection diagnostics without reflecting raw credential names or values', () => {
    renderRoute({
      query: createQuery({
        rejectedCredentialParams: ['username', 'password', 'token', '[redacted]']
      }),
      hostSummary: createHostSummary({ label: 'Bedroom' })
    });

    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('4 unsafe URL parameters were blocked');
    expect(alert?.textContent).toContain('credential-like data cannot be configured in the URL');
    expectNoForbiddenText();
  });

  it('renders German embed copy for setup and credential rejection states', () => {
    renderRoute({
      hostSummary: null,
      query: createQuery({ rejectedCredentialParams: ['password'] }),
      i18n: createTranslationContext('de')
    });

    const text = screenText();
    expect(text).toContain('Aktuelle Wiedergabe einbetten');
    expect(text).toContain('Einrichtung erforderlich');
    expect(text).toContain('1 unsicherer URL-Parameter wurde blockiert');
    expect(text).toContain('Speichere zuerst einen vertrauenswürdigen Kodi-Host');
    expectNoForbiddenText();
  });

  it('sanitizes hostile host labels and handles malformed query snapshots as empty', () => {
    renderRoute({
      hostSummary: createHostSummary({
        label: 'http://admin:p@ssword@kodi.local secret-storage-key',
        host: 'kodi.local',
        hasCredentials: true
      }),
      query: undefined as never
    });

    const text = screenText();
    expect(text).toContain('Saved Kodi host');
    expect(text).toContain('Credentials saved: yes');
    expect(text).not.toContain('unsafe URL parameters were blocked');
    expectNoForbiddenText();
  });

  it('runs the optional refresh callback without leaking rejected errors', async () => {
    const onRefresh = vi
      .fn()
      .mockRejectedValue(new Error('failed with http://admin:p@ssword@kodi.local Basic token'));

    renderRoute({
      snapshot: createActiveMovieSnapshot(),
      hostSummary: createHostSummary({ label: 'Studio' }),
      onRefresh
    });

    button('Refresh player state').click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screenText()).toContain('Refresh player state');
    expectNoForbiddenText();
  });
});

function renderRoute(
  input: {
    snapshot?: PlayerStoreSnapshot;
    dispatch?: FakeDispatch;
    localPlayerSnapshot?: LocalPlayerStoreSnapshot;
    hostSummary?: ActiveHostSummary | null;
    query?: NowPlayingEmbedQuery;
    i18n?: TranslationContext;
    onRefresh?: () => Promise<void> | void;
  } = {}
): void {
  mounted = mount(NowPlayingEmbedRoute, {
    target: document.body,
    props: {
      snapshot: input.snapshot ?? createSnapshot(),
      dispatch: input.dispatch ?? createDispatch(),
      localPlayerSnapshot: input.localPlayerSnapshot ?? createLocalSnapshot(),
      hostSummary: input.hostSummary === undefined ? createHostSummary() : input.hostSummary,
      query: 'query' in input ? input.query : createQuery(),
      i18n: input.i18n ?? createTranslationContext('en'),
      onRefresh: input.onRefresh
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

function createLocalSnapshot(
  overrides: Partial<LocalPlayerStoreSnapshot> = {}
): LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'unknown',
    source: null,
    item: null,
    currentSeconds: 0,
    durationSeconds: null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null,
    ...overrides
  };
}

function createHostSummary(overrides: Partial<ActiveHostSummary> = {}): ActiveHostSummary {
  return {
    id: 'host-1',
    label: 'Living Room',
    host: '192.0.2.10',
    port: 8080,
    useTls: false,
    useWebSocket: true,
    hasCredentials: false,
    ...overrides
  };
}

function createQuery(overrides: Partial<NowPlayingEmbedQuery> = {}): NowPlayingEmbedQuery {
  return {
    theme: null,
    locale: null,
    rejectedCredentialParams: [],
    ignoredParams: [],
    ...overrides
  };
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

function expectNoForbiddenText(): void {
  const text = screenText();

  for (const token of FORBIDDEN_TEXT) {
    expect(text).not.toContain(token);
  }
}
