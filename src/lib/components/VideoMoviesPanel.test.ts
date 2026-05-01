import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import VideoMoviesPanel from './VideoMoviesPanel.svelte';
import { buildVideoRoute } from '$lib/video/videoRouter';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';

type MountedComponent = ReturnType<typeof mount>;

type VideoSnapshotOverrides = Omit<Partial<VideoLibraryStoreSnapshot>, 'limits'> & {
  limits?: Partial<VideoLibraryStoreSnapshot['limits']>;
};

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createVideoSnapshot(overrides: VideoSnapshotOverrides = {}): VideoLibraryStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: null,
    movies: [],
    tvShows: [],
    recentlyAddedMovies: [],
    recentlyPlayedMovies: [],
    recentlyAddedEpisodes: [],
    recentlyPlayedEpisodes: [],
    isEmpty: true,
    lastError: null,
    ...overrides,
    limits: {
      movies: { start: 0, end: 0, total: 0 },
      tvShows: { start: 0, end: 0, total: 0 },
      recentlyAddedMovies: { start: 0, end: 0, total: 0 },
      recentlyPlayedMovies: { start: 0, end: 0, total: 0 },
      recentlyAddedEpisodes: { start: 0, end: 0, total: 0 },
      recentlyPlayedEpisodes: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
  };
}

function populatedSnapshot(overrides: VideoSnapshotOverrides = {}): VideoLibraryStoreSnapshot {
  return createVideoSnapshot({
    refreshStatus: 'ready',
    lastUpdatedAt: '2026-04-30T12:00:00.000Z',
    isEmpty: false,
    movies: [
      {
        movieid: 42,
        label: 'Alien',
        title: 'Alien',
        year: 1979,
        runtime: 7020,
        playcount: 1,
        watched: true,
        thumbnail: 'image://poster-alien/',
        fanart: 'image://fanart-alien/',
        art: { poster: 'image://poster-alien/', fanart: 'image://fanart-alien/' }
      },
      {
        movieid: 84,
        label: 'Arrival',
        title: 'Arrival',
        year: 2016,
        runtime: 6960,
        resume: { position: 300, total: 6960 },
        art: { poster: 'safe-poster-token' },
        versionCount: 2
      } as VideoLibraryStoreSnapshot['movies'][number]
    ],
    limits: { movies: { start: 0, end: 2, total: 7 } },
    ...overrides
  });
}

function renderPanel(snapshot: VideoLibraryStoreSnapshot): void {
  mounted = mount(VideoMoviesPanel, {
    target: document.body,
    props: { snapshot }
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function statusText(): string {
  return document.querySelector('[role="status"]')?.textContent ?? '';
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('SENTINEL_SECRET');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
  expect(value).not.toContain('image://');
}

describe('VideoMoviesPanel', () => {
  it('renders an accessible movie grid region and loading status', () => {
    renderPanel(createVideoSnapshot({ refreshStatus: 'loading', lastRefreshReason: 'manual' }));

    const region = document.querySelector(
      '.video-movies-panel[aria-labelledby="video-movies-title"]'
    );
    expect(region).not.toBeNull();
    expect(document.querySelector('#video-movies-title')?.textContent).toMatch(
      /Video Movies|Movies/
    );
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');
    expect(statusText()).toContain('Refreshing video movies from manual');
    expect(screenText()).toContain('Loading video movies');
  });

  it('renders empty state and count summary without movie cards', () => {
    renderPanel(createVideoSnapshot());

    const text = screenText();
    expect(text).toContain('No video movies found in this snapshot.');
    expect(text).toContain('0 of 0 movies');
    expect(document.querySelectorAll('.movie-card')).toHaveLength(0);
  });

  it('renders sanitized error status while preserving safe movie data', () => {
    renderPanel(
      populatedSnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Failed at http://admin:p@ssword@example.test/jsonrpc with Authorization: Basic abc123 and localStorage raw response body smb://secret/share/movie.mkv'
        }
      })
    );

    const text = screenText();
    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expect(text).toContain('Alien');
    expect(text).toContain('Arrival');
    expectSecretSafe(text);
  });

  it('renders movie cards with count watched resume versions and finite detail links', () => {
    renderPanel(populatedSnapshot());

    const text = screenText();
    expect(statusText()).toContain('2 of 7 movies');
    expect(text).toContain('Alien');
    expect(text).toContain('1979');
    expect(text).toContain('1:57:00');
    expect(text).toContain('Watched');
    expect(text).toContain('Arrival');
    expect(text).toContain('Resume available');
    expect(text).toContain('2 versions available');
    expect(text).toContain('Artwork metadata available');

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.movie-link')).map(
      (link) => link.getAttribute('href')
    );
    expect(links).toEqual([
      buildVideoRoute({ kind: 'videoMovieDetail', movieid: 42 }),
      buildVideoRoute({ kind: 'videoMovieDetail', movieid: 84 })
    ]);
    expectSecretSafe(text);
  });

  it('omits non-finite detail links and unsafe path-like artwork or labels', () => {
    renderPanel(
      createVideoSnapshot({
        isEmpty: false,
        movies: [
          {
            movieid: Number.NaN,
            label: 'smb://nas.local/private/movie.mkv',
            title: 'https://admin:p@ssword@example.test/private/movie.mkv',
            thumbnail: 'http://admin:p@ssword@example.test/poster.jpg',
            fanart: '/mnt/media/private/fanart.jpg',
            art: { poster: 'image://poster-private/', fanart: 'smb://secret/fanart.jpg' }
          },
          {
            movieid: 7,
            label: 'Safe Movie',
            title: undefined,
            year: undefined,
            runtime: undefined
          }
        ],
        limits: { movies: { start: 0, end: 2, total: 2 } }
      })
    );

    const text = screenText();
    expect(text).toContain('Unknown movie');
    expect(text).toContain('Safe Movie');
    expect(document.querySelectorAll('a.movie-link')).toHaveLength(1);
    expect(document.querySelector('a.movie-link')?.getAttribute('href')).toBe('/video/movies/7');
    expectSecretSafe(text);
  });
});
