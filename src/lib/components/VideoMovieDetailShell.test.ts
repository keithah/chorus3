import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import VideoMovieDetailShell from './VideoMovieDetailShell.svelte';
import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';
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
    isEmpty: true,
    lastError: null,
    ...overrides,
    limits: {
      movies: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
  };
}

function populatedSnapshot(overrides: VideoSnapshotOverrides = {}): VideoLibraryStoreSnapshot {
  return createVideoSnapshot({
    isEmpty: false,
    lastUpdatedAt: '2026-04-30T12:00:00.000Z',
    movies: [
      {
        movieid: 42,
        label: 'Alien',
        title: 'Alien',
        year: 1979,
        runtime: 7020,
        playcount: 1,
        watched: true,
        resume: { position: 0, total: 7020 },
        art: { poster: 'image://poster-alien/', fanart: 'image://fanart-alien/' }
      },
      {
        movieid: 84,
        label: 'Arrival',
        title: 'Arrival',
        year: 2016,
        runtime: 6960,
        resume: { position: 300, total: 6960 },
        versionCount: 2
      } as VideoLibraryStoreSnapshot['movies'][number]
    ],
    limits: { movies: { start: 0, end: 2, total: 2 } },
    ...overrides
  });
}

function renderShell(snapshot: VideoLibraryStoreSnapshot, route: VideoRoute): void {
  mounted = mount(VideoMovieDetailShell, {
    target: document.body,
    props: { snapshot, route }
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
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

describe('VideoMovieDetailShell', () => {
  it('renders safe metadata for an existing finite movie detail route', () => {
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 42 });

    const text = screenText();
    expect(
      document.querySelector(
        '.video-movie-detail-shell[aria-labelledby="video-movie-detail-title"]'
      )
    ).not.toBeNull();
    expect(document.querySelector('#video-movie-detail-title')?.textContent).toContain('Alien');
    expect(text).toContain('Movie ID 42');
    expect(text).toContain('1979');
    expect(text).toContain('1:57:00');
    expect(text).toContain('Watched');
    expect(text).toContain('Artwork metadata available');
    expect(text).toContain(
      'Playback, resume, queue, streaming, and watched-write actions arrive in S02.'
    );
    expect(document.querySelector('button')).toBeNull();
    expect(document.querySelector('a[href="/video/movies"]')?.textContent).toContain(
      'Back to movies'
    );
    expectSecretSafe(text);
  });

  it('renders resume and optional version metadata without enabling actions', () => {
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 84 });

    const text = screenText();
    expect(text).toContain('Arrival');
    expect(text).toContain('Resume available');
    expect(text).toContain('2 versions available');
    expect(text).toContain('Read-only route shell');
    expect(document.querySelectorAll('button')).toHaveLength(0);
    expect(
      Array.from(document.querySelectorAll('a')).map((link) => link.textContent?.trim())
    ).toEqual(['Back to movies']);
    expectSecretSafe(text);
  });

  it('renders a safe not-found state for a missing finite movie ID', () => {
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 999 });

    const text = screenText();
    expect(text).toContain('Movie not found');
    expect(text).toContain('Movie ID 999 is not present in this read-only snapshot.');
    expect(document.querySelector('a[href="/video/movies"]')).not.toBeNull();
    expectSecretSafe(text);
  });

  it('renders a safe invalid-route state when upstream route data is not a detail route', () => {
    renderShell(populatedSnapshot(), {
      kind: 'videoUnknown',
      pathLabel: '/video/Authorization/Basic/SENTINEL_SECRET'
    });

    const text = screenText();
    expect(text).toContain('Movie route unavailable');
    expect(text).toContain('Open the movies grid and choose a movie detail link.');
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      buildVideoRoute({ kind: 'videoMovies' })
    );
    expectSecretSafe(text);
  });

  it('defensively drops unsafe labels artwork values and malformed optional metadata', () => {
    renderShell(
      createVideoSnapshot({
        isEmpty: false,
        movies: [
          {
            movieid: 7,
            label: 'smb://nas.local/private/movie.mkv',
            title: 'https://admin:p@ssword@example.test/private/movie.mkv',
            year: Number.NaN,
            runtime: Number.POSITIVE_INFINITY,
            resume: { position: Number.NaN, total: 0 },
            art: { poster: 'image://poster-private/', fanart: 'smb://secret/fanart.jpg' }
          }
        ],
        limits: { movies: { start: 0, end: 1, total: 1 } }
      }),
      { kind: 'videoMovieDetail', movieid: 7 }
    );

    const text = screenText();
    expect(text).toContain('Unknown movie');
    expect(text).toContain('Movie ID 7');
    expect(text).toContain('Version metadata not loaded yet');
    expect(text).not.toContain('Resume available');
    expectSecretSafe(text);
  });
});
