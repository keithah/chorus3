import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MusicLibraryPanel from './MusicLibraryPanel.svelte';
import type { MusicLibraryStoreSnapshot } from '$lib/stores/musicLibrary.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

type MusicLibrarySnapshotOverrides = Omit<Partial<MusicLibraryStoreSnapshot>, 'limits'> & {
  limits?: Partial<MusicLibraryStoreSnapshot['limits']>;
};

function createMusicSnapshot(
  overrides: MusicLibrarySnapshotOverrides = {}
): MusicLibraryStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: null,
    artists: [],
    albums: [],
    songs: [],
    recentlyAddedSongs: [],
    recentlyPlayedSongs: [],
    mostPlayedSongs: [],
    genres: [],
    isEmpty: true,
    lastError: null,
    ...overrides,
    limits: {
      artists: { start: 0, end: 0, total: 0 },
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 },
      recentlyAddedSongs: { start: 0, end: 0, total: 0 },
      recentlyPlayedSongs: { start: 0, end: 0, total: 0 },
      mostPlayedSongs: { start: 0, end: 0, total: 0 },
      genres: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
  };
}

function populatedSnapshot(
  overrides: MusicLibrarySnapshotOverrides = {}
): MusicLibraryStoreSnapshot {
  return createMusicSnapshot({
    isEmpty: false,
    lastUpdatedAt: '2026-04-29T12:00:00.000Z',
    artists: [
      { artistid: 1, label: 'Nina Simone', genre: ['Jazz', 'Soul'] },
      { artistid: 2, label: 'Unknown artist' }
    ],
    albums: [
      {
        albumid: 10,
        label: 'Pastel Blues',
        title: 'Pastel Blues',
        artist: ['Nina Simone'],
        year: 1965
      },
      { albumid: 11, label: 'Unknown album' }
    ],
    songs: [
      {
        songid: 20,
        label: 'Sinnerman',
        title: 'Sinnerman',
        artist: ['Nina Simone'],
        album: 'Pastel Blues',
        duration: 622,
        track: 8,
        playcount: 3
      },
      { songid: 21, label: 'Unknown song' }
    ],
    genres: [
      { genreid: 30, label: 'Jazz', title: 'Jazz' },
      { genreid: 31, label: 'Unknown genre' }
    ],
    limits: {
      artists: { start: 0, end: 2, total: 2 },
      albums: { start: 0, end: 2, total: 2 },
      songs: { start: 0, end: 2, total: 2 },
      genres: { start: 0, end: 2, total: 2 }
    },
    ...overrides
  });
}

function renderPanel(props: {
  snapshot: MusicLibraryStoreSnapshot;
  onRefresh?: () => Promise<void> | void;
}): void {
  mounted = mount(MusicLibraryPanel, {
    target: document.body,
    props
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function statusText(): string {
  return document.querySelector('[role="status"]')?.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (b) => b.getAttribute('aria-label') === labelOrText || b.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    const found = Array.from(document.querySelectorAll('button'))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())
      .join(', ');
    throw new Error(`Button not found: "${labelOrText}". Found: ${found}`);
  }
  return match;
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
}

describe('MusicLibraryPanel', () => {
  it('renders an aria-labelled music library region and loading status', () => {
    renderPanel({
      snapshot: createMusicSnapshot({ refreshStatus: 'loading', lastRefreshReason: 'manual' })
    });

    const region = document.querySelector('section[aria-labelledby="music-library-title"]');
    expect(region).not.toBeNull();
    expect(document.querySelector('#music-library-title')?.textContent).toContain('Music Library');
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');
    expect(statusText()).toContain('Refreshing music library from manual');
    expect(screenText()).toContain('Loading music library');
  });

  it('renders all-empty state and section headings without a refresh button by default', () => {
    renderPanel({ snapshot: createMusicSnapshot() });

    const text = screenText();
    expect(text).toContain('No music library items found');
    expect(text).toContain('Artists');
    expect(text).toContain('Albums');
    expect(text).toContain('Songs');
    expect(text).toContain('Genres');
    expect(text).toContain('0 of 0');
    expect(document.querySelector('button')).toBeNull();
  });

  it('renders a refresh button only when a refresh callback is provided and disables it while loading', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    renderPanel({
      snapshot: createMusicSnapshot({ refreshStatus: 'loading' }),
      onRefresh
    });

    const refreshButton = button('Refresh music library');
    expect(refreshButton.disabled).toBe(true);
    refreshButton.click();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('calls the injected refresh callback from ready snapshots', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    renderPanel({ snapshot: populatedSnapshot(), onRefresh });

    button('Refresh music library').click();

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders sanitized error status while preserving safe list data', () => {
    renderPanel({
      snapshot: populatedSnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Failed at http://admin:p@ssword@example.test/jsonrpc with Authorization: Basic abc123 and localStorage raw response body smb://secret/share/song.flac'
        }
      })
    });

    const text = screenText();
    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expect(text).toContain('Nina Simone');
    expect(text).toContain('Sinnerman');
    expectSecretSafe(text);
  });

  it('renders populated artists albums songs and genres with optional metadata', () => {
    renderPanel({ snapshot: populatedSnapshot() });

    const text = screenText();
    expect(text).toContain('Music library ready');
    expect(text).toContain('Nina Simone');
    expect(text).toContain('Jazz, Soul');
    expect(text).toContain('Pastel Blues');
    expect(text).toContain('1965');
    expect(text).toContain('Sinnerman');
    expect(text).toContain('10:22');
    expect(text).toContain('Track 8');
    expect(text).toContain('Played 3 times');
    expect(text).toContain('Jazz');
    expect(text).toContain('2 of 2');
    expectSecretSafe(text);
  });

  it('defensively renders malformed snapshot labels and omits unsafe file-like values', () => {
    renderPanel({
      snapshot: createMusicSnapshot({
        isEmpty: false,
        artists: [{ artistid: 1, label: 'Unknown artist' }],
        albums: [{ albumid: 2, label: 'Unknown album' }],
        songs: [
          {
            songid: 3,
            label: 'Unknown song',
            title: 'C:\\music\\secret.mp3',
            album: '/mnt/media/private.flac',
            artist: ['Safe Artist']
          }
        ],
        genres: [{ genreid: 4, label: 'Unknown genre' }],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 },
          genres: { start: 0, end: 1, total: 1 }
        }
      })
    });

    const text = screenText();
    expect(text).toContain('Unknown artist');
    expect(text).toContain('Unknown album');
    expect(text).toContain('Unknown song');
    expect(text).toContain('Unknown genre');
    expect(text).toContain('Safe Artist');
    expectSecretSafe(text);
  });
});
