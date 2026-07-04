import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MusicDetailRoute from './MusicDetailRoute.svelte';
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

describe('MusicDetailRoute', () => {
  it('renders an explicit album load error instead of falling through to empty copy', () => {
    mounted = mount(MusicDetailRoute, {
      target: document.body,
      props: {
        route: { kind: 'musicAlbumDetail', albumid: '4' },
        musicLibrarySnapshot: createMusicSnapshot(),
        detailSnapshot: {
          albumDetails: { 4: { status: 'error' } },
          albumSongs: {},
          artistDetails: {}
        },
        detailDispatch: {
          loadAlbum: vi.fn(),
          loadArtist: vi.fn()
        },
        filterAlbums: (items) => [...items],
        filterSongs: (items) => [...items],
        onPlayCard: vi.fn(),
        onQueueCard: vi.fn(),
        onStreamCard: vi.fn(),
        onAddToPlaylist: vi.fn(),
        onToggleThumbsUp: vi.fn(),
        onEdit: vi.fn(),
        isThumbedUp: () => false,
        cardHref: () => null
      }
    });

    expect(document.body.textContent).toContain('Unable to load album details.');
    expect(document.body.textContent).not.toContain('No songs found for this album.');
  });
});

function createMusicSnapshot(): MusicLibraryStoreSnapshot {
  const emptyLimits = { start: 0, end: 0, total: 0 };
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    artists: [],
    albums: [],
    songs: [],
    recentlyAddedSongs: [],
    recentlyPlayedSongs: [],
    mostPlayedSongs: [],
    genres: [],
    limits: {
      artists: emptyLimits,
      albums: emptyLimits,
      songs: emptyLimits,
      recentlyAddedSongs: emptyLimits,
      recentlyPlayedSongs: emptyLimits,
      mostPlayedSongs: emptyLimits,
      genres: emptyLimits
    },
    isEmpty: true,
    lastError: null
  };
}
