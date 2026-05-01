import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import VideoTvShowsPanel from './VideoTvShowsPanel.svelte';
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

function createSnapshot(overrides: VideoSnapshotOverrides = {}): VideoLibraryStoreSnapshot {
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
  return createSnapshot({
    isEmpty: false,
    tvShows: [
      {
        tvshowid: 11,
        label: 'Severance',
        title: 'Severance',
        year: 2022,
        episodeCount: 19,
        watchedEpisodeCount: 9,
        unwatchedEpisodes: 10,
        hasUnwatched: true,
        thumbnail: 'image://poster-severance/',
        fanart: 'image://fanart-severance/',
        art: { poster: 'image://poster-severance/', fanart: 'image://fanart-severance/' }
      },
      {
        tvshowid: 12,
        label: 'The Bear',
        title: 'The Bear',
        episodeCount: 18,
        watchedEpisodeCount: 18,
        unwatchedEpisodes: 0,
        hasUnwatched: false,
        playcount: 1,
        watched: true
      }
    ],
    limits: { tvShows: { start: 0, end: 2, total: 5 } },
    ...overrides
  });
}

function renderPanel(snapshot: VideoLibraryStoreSnapshot): void {
  mounted = mount(VideoTvShowsPanel, {
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

describe('VideoTvShowsPanel', () => {
  it('renders an accessible TV grid region and loading status', () => {
    renderPanel(createSnapshot({ refreshStatus: 'loading', lastRefreshReason: 'manual' }));

    expect(
      document.querySelector('.video-tv-shows-panel[aria-labelledby="video-tv-shows-title"]')
    ).not.toBeNull();
    expect(document.querySelector('#video-tv-shows-title')?.textContent).toContain('TV Shows');
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');
    expect(statusText()).toContain('Refreshing TV shows from manual');
    expect(screenText()).toContain('Loading TV shows');
  });

  it('renders empty state and count summary without cards', () => {
    renderPanel(createSnapshot());

    const text = screenText();
    expect(text).toContain('No TV shows found in this snapshot.');
    expect(text).toContain('0 of 0 TV shows');
    expect(document.querySelectorAll('.tv-show-card')).toHaveLength(0);
  });

  it('renders sanitized error status while preserving safe TV show data', () => {
    renderPanel(
      populatedSnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Failed at http://admin:p@ssword@example.test/jsonrpc with Authorization: Basic abc123 and localStorage raw response body smb://secret/share/show.mkv'
        }
      })
    );

    const text = screenText();
    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expect(text).toContain('Severance');
    expect(text).toContain('The Bear');
    expectSecretSafe(text);
  });

  it('renders TV show cards with counts unwatched watched artwork and finite detail links', () => {
    renderPanel(populatedSnapshot());

    const text = screenText();
    expect(statusText()).toContain('2 of 5 TV shows');
    expect(text).toContain('Severance');
    expect(text).toContain('2022');
    expect(text).toContain('10 unwatched episodes');
    expect(text).toContain('Resume available');
    expect(text).toContain('Artwork metadata available');
    expect(text).toContain('Poster frame');
    expect(text).toContain('Fanart wash');
    expect(document.querySelectorAll('.poster-frame.has-fanart')).toHaveLength(1);
    expect(document.querySelectorAll('.poster-frame.no-artwork')).toHaveLength(1);
    expect(
      document.querySelector('[aria-label="Severance artwork availability"]')?.textContent
    ).toContain('Poster frame');
    expect(text).toContain('The Bear');
    expect(text).toContain('Watched');
    expect(text).toContain('0 unwatched episodes');

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.tv-show-link')).map(
      (link) => link.getAttribute('href')
    );
    expect(links).toEqual([
      buildVideoRoute({ kind: 'videoTvShowDetail', tvshowid: 11 }),
      buildVideoRoute({ kind: 'videoTvShowDetail', tvshowid: 12 })
    ]);
    expectSecretSafe(text);
  });

  it('omits invalid detail links and unsafe path-like labels or artwork', () => {
    renderPanel(
      createSnapshot({
        isEmpty: false,
        tvShows: [
          {
            tvshowid: Number.NaN,
            label: 'smb://nas.local/private/show.mkv',
            title: 'https://admin:p@ssword@example.test/private/show.mkv',
            thumbnail: 'http://admin:p@ssword@example.test/poster.jpg',
            fanart: '/mnt/media/private/fanart.jpg',
            art: { poster: 'image://poster-private/', fanart: 'smb://secret/fanart.jpg' }
          },
          { tvshowid: 7, label: 'Safe Show', title: undefined }
        ],
        limits: { tvShows: { start: 0, end: 2, total: 2 } }
      })
    );

    const text = screenText();
    expect(text).toContain('Unknown TV show');
    expect(text).toContain('Safe Show');
    expect(text).toContain('Artwork pending');
    expect(document.querySelector('.fallback-initials')?.textContent).toBe('UT');
    expect(document.querySelectorAll('a.tv-show-link')).toHaveLength(1);
    expect(document.querySelector('a.tv-show-link')?.getAttribute('href')).toBe('/video/tv/7');
    expectSecretSafe(text);
  });
});
