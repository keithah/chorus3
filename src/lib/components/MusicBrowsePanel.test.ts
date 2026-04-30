import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MusicBrowsePanel, { type MusicBrowsePanelDispatch } from './MusicBrowsePanel.svelte';
import type { MusicBrowseStoreSnapshot } from '$lib/stores/musicBrowse.svelte';
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

function createLibrarySnapshot(
  overrides: Partial<MusicLibraryStoreSnapshot> = {}
): MusicLibraryStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
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
    songs: [],
    genres: [
      { genreid: 30, label: 'Jazz', title: 'Jazz' },
      { genreid: 31, label: 'Unknown genre' }
    ],
    limits: {
      artists: { start: 0, end: 2, total: 2 },
      albums: { start: 0, end: 2, total: 2 },
      songs: { start: 0, end: 0, total: 0 },
      genres: { start: 0, end: 2, total: 2 }
    },
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function createBrowseSnapshot(
  overrides: Partial<MusicBrowseStoreSnapshot> = {}
): MusicBrowseStoreSnapshot {
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    selection: null,
    albums: [],
    songs: [],
    limits: {
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 }
    },
    isEmpty: true,
    lastError: null,
    ...overrides
  };
}

function createDispatch(
  overrides: Partial<MusicBrowsePanelDispatch> = {}
): MusicBrowsePanelDispatch {
  return {
    browseArtist: vi.fn(),
    browseAlbum: vi.fn(),
    browseGenre: vi.fn(),
    clearSelection: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: {
    librarySnapshot?: MusicLibraryStoreSnapshot;
    browseSnapshot?: MusicBrowseStoreSnapshot;
    dispatch?: MusicBrowsePanelDispatch;
  } = {}
): MusicBrowsePanelDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(MusicBrowsePanel, {
    target: document.body,
    props: {
      librarySnapshot: props.librarySnapshot ?? createLibrarySnapshot(),
      browseSnapshot: props.browseSnapshot ?? createBrowseSnapshot(),
      dispatch
    }
  });
  return dispatch;
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
  expect(value).not.toContain('raw response body');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
}

describe('MusicBrowsePanel', () => {
  it('renders an aria-labelled browse region, headings, status, and no-selection prompt', () => {
    renderPanel();

    const region = document.querySelector('section[aria-labelledby="music-browse-title"]');
    expect(region).not.toBeNull();
    expect(document.querySelector('#music-browse-title')?.textContent).toContain('Browse Music');
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');

    const text = screenText();
    expect(statusText()).toContain('Choose an artist, album, or genre to browse.');
    expect(text).toContain('Artists');
    expect(text).toContain('Albums');
    expect(text).toContain('Genres');
    expect(text).toContain('No browse selection yet.');
    expect(text).toContain('2 of 2');
  });

  it('renders deterministic selection buttons and calls injected browse callbacks once', () => {
    const dispatch = renderPanel();

    button('Browse artist Nina Simone').click();
    button('Browse album Pastel Blues').click();
    button('Browse genre Jazz').click();

    expect(dispatch.browseArtist).toHaveBeenCalledTimes(1);
    expect(dispatch.browseArtist).toHaveBeenCalledWith({ artistid: 1, label: 'Nina Simone' });
    expect(dispatch.browseAlbum).toHaveBeenCalledTimes(1);
    expect(dispatch.browseAlbum).toHaveBeenCalledWith({ albumid: 10, label: 'Pastel Blues' });
    expect(dispatch.browseGenre).toHaveBeenCalledTimes(1);
    expect(dispatch.browseGenre).toHaveBeenCalledWith({ genreid: 30, label: 'Jazz' });
  });

  it('disables browse controls while detail loading is visible', () => {
    const dispatch = renderPanel({
      browseSnapshot: createBrowseSnapshot({
        refreshStatus: 'loading',
        lastRefreshReason: 'artist:1',
        selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
        isEmpty: false
      })
    });

    expect(statusText()).toContain('Loading artist Nina Simone');
    expect(button('Browse artist Nina Simone').disabled).toBe(true);
    expect(button('Browse album Pastel Blues').disabled).toBe(true);
    expect(button('Browse genre Jazz').disabled).toBe(true);
    expect(button('Clear music browse selection').disabled).toBe(true);

    button('Browse artist Nina Simone').click();
    expect(dispatch.browseArtist).not.toHaveBeenCalled();
  });

  it('renders artist detail albums and songs with safe song identity metadata', () => {
    renderPanel({
      browseSnapshot: createBrowseSnapshot({
        refreshStatus: 'ready',
        lastRefreshReason: 'artist:1',
        lastUpdatedAt: '2026-04-29T13:00:00.000Z',
        selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
        albums: [
          {
            albumid: 10,
            label: 'Pastel Blues',
            title: 'Pastel Blues',
            artist: ['Nina Simone'],
            year: 1965
          }
        ],
        songs: [
          {
            songid: 3,
            label: 'Sinnerman',
            title: 'Sinnerman',
            artist: ['Nina Simone'],
            album: 'Pastel Blues',
            duration: 622,
            track: 8,
            playcount: 3
          }
        ],
        limits: {
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false
      })
    });

    const text = screenText();
    expect(text).toContain('Artist: Nina Simone');
    expect(text).toContain('Albums for Nina Simone');
    expect(text).toContain('Songs for Nina Simone');
    expect(text).toContain('Pastel Blues');
    expect(text).toContain('1965');
    expect(text).toContain('Sinnerman');
    expect(text).toContain('10:22');
    expect(text).toContain('Track 8');
    expect(text).toContain('Played 3 times');
    expect(document.querySelector('[data-songid="3"]')?.textContent).toContain('Song ID 3');
  });

  it('renders album detail as songs-only and calls clear selection from ready state', () => {
    const dispatch = renderPanel({
      browseSnapshot: createBrowseSnapshot({
        refreshStatus: 'ready',
        lastRefreshReason: 'album:10',
        lastUpdatedAt: '2026-04-29T13:00:00.000Z',
        selection: { kind: 'album', id: 10, label: 'Pastel Blues' },
        albums: [],
        songs: [{ songid: 3, label: 'Sinnerman', title: 'Sinnerman', album: 'Pastel Blues' }],
        limits: {
          albums: { start: 0, end: 0, total: 0 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false
      })
    });

    const text = screenText();
    expect(text).toContain('Album: Pastel Blues');
    expect(text).toContain('Album selections show songs only.');
    expect(text).toContain('Songs for Pastel Blues');
    expect(text).toContain('Song ID 3');

    button('Clear music browse selection').click();
    expect(dispatch.clearSelection).toHaveBeenCalledTimes(1);
  });

  it('renders genre empty detail state with per-list counts', () => {
    renderPanel({
      browseSnapshot: createBrowseSnapshot({
        refreshStatus: 'ready',
        lastRefreshReason: 'genre:30',
        lastUpdatedAt: '2026-04-29T13:00:00.000Z',
        selection: { kind: 'genre', id: 30, label: 'Jazz' },
        limits: {
          albums: { start: 0, end: 0, total: 0 },
          songs: { start: 0, end: 0, total: 0 }
        },
        isEmpty: true
      })
    });

    const text = screenText();
    expect(text).toContain('Genre: Jazz');
    expect(text).toContain('No albums or songs found for Jazz.');
    expect(text).toContain('Albums 0 of 0');
    expect(text).toContain('Songs 0 of 0');
  });

  it('renders sanitized error status while preserving safe detail data', () => {
    renderPanel({
      browseSnapshot: createBrowseSnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        lastUpdatedAt: '2026-04-29T13:00:00.000Z',
        selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
        albums: [{ albumid: 10, label: 'Pastel Blues', title: 'Pastel Blues' }],
        songs: [{ songid: 3, label: 'Sinnerman', title: 'Sinnerman' }],
        limits: {
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false,
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
    expect(text).toContain('Pastel Blues');
    expect(text).toContain('Sinnerman');
    expectSecretSafe(text);
  });

  it('defensively renders empty top-level sections and unsafe labels with fallbacks', () => {
    renderPanel({
      librarySnapshot: createLibrarySnapshot({
        artists: [{ artistid: 1, label: 'smb://secret/share/artist' }],
        albums: [{ albumid: 10, label: 'C:\\music\\secret.flac', title: '/mnt/media/album' }],
        genres: [],
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 1, total: 1 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 0, total: 0 }
        }
      }),
      browseSnapshot: createBrowseSnapshot({
        refreshStatus: 'ready',
        selection: { kind: 'genre', id: 30, label: 'smb://secret/share/genre' },
        songs: [{ songid: 44, label: 'https://example.test/song.mp3', title: 'Safe Song' }],
        limits: {
          albums: { start: 0, end: 0, total: 0 },
          songs: { start: 0, end: 1, total: 1 }
        },
        isEmpty: false
      })
    });

    const text = screenText();
    expect(text).toContain('Browse artist Unknown artist');
    expect(text).toContain('Browse album Unknown album');
    expect(text).toContain('No genres in this snapshot.');
    expect(text).toContain('Genre: Unknown genre');
    expect(text).toContain('Safe Song');
    expectSecretSafe(text);
  });
});
