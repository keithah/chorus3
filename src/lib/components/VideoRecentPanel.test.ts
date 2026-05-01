import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import VideoRecentPanel from './VideoRecentPanel.svelte';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';

let mounted: ReturnType<typeof mount> | null = null;

type VideoSnapshotOverrides = Omit<Partial<VideoLibraryStoreSnapshot>, 'limits'> & {
  limits?: Partial<VideoLibraryStoreSnapshot['limits']>;
};

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
    lastUpdatedAt: '2026-05-01T07:00:00.000Z',
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

function renderPanel(snapshot: VideoLibraryStoreSnapshot): void {
  mounted = mount(VideoRecentPanel, {
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

function getLink(label: string): HTMLAnchorElement | undefined {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
    (link) => link.textContent?.trim() === label
  );
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('image://');
  expect(value).not.toContain('special://');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('SENTINEL_SECRET');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('/mnt/media');
}

describe('VideoRecentPanel', () => {
  it('renders four accessible recent-video sections with links and safe fallback cards', () => {
    renderPanel(
      createVideoSnapshot({
        isEmpty: false,
        recentlyAddedMovies: [
          {
            movieid: 4401,
            label: 'Neon Harbor',
            title: 'Neon Harbor',
            year: 2024,
            runtime: 6420,
            dateadded: '2026-04-28 10:00:00',
            watched: true,
            playcount: 1,
            art: { poster: 'poster:neon-harbor', fanart: 'fanart:neon-harbor' }
          }
        ],
        recentlyPlayedMovies: [
          {
            movieid: 4402,
            label: 'Quiet Signal',
            title: 'Quiet Signal',
            lastplayed: '2026-04-30 21:15:00',
            resume: { position: 1275, total: 5940 },
            art: { poster: 'poster:quiet-signal' }
          }
        ],
        recentlyAddedEpisodes: [
          {
            episodeid: 6601,
            tvshowid: 5501,
            season: 1,
            episode: 1,
            label: 'Signal Mirror',
            title: 'Signal Mirror',
            showtitle: 'Aurora Files',
            dateadded: '2026-04-30 11:00:00',
            resume: { position: 600, total: 2700 },
            art: { thumb: 'thumb:signal-mirror' }
          }
        ],
        recentlyPlayedEpisodes: [
          {
            episodeid: 6602,
            label: 'Cold Open',
            showtitle: 'Aurora Files',
            lastplayed: '2026-04-29 20:00:00',
            watched: true,
            playcount: 1,
            thumbnail: 'thumb:cold-open'
          }
        ],
        limits: {
          recentlyAddedMovies: { start: 0, end: 1, total: 3 },
          recentlyPlayedMovies: { start: 0, end: 1, total: 2 },
          recentlyAddedEpisodes: { start: 0, end: 1, total: 4 },
          recentlyPlayedEpisodes: { start: 0, end: 1, total: 1 }
        }
      })
    );

    const text = screenText();

    expect(
      document.querySelector('.video-recent-panel[aria-labelledby="video-recent-title"]')
    ).not.toBeNull();
    expect(text).toContain('Recent Video');
    expect(text).toContain('Recently added movies');
    expect(text).toContain('Recently played movies');
    expect(text).toContain('Recently added episodes');
    expect(text).toContain('Recently played episodes');
    expect(text).toContain('Watched');
    expect(text).toContain('Resume available');
    expect(text).toContain('Added 2026-04-28 10:00:00');
    expect(text).toContain('Played 2026-04-30 21:15:00');
    expect(text).toContain('Poster artwork available');
    expect(text).toContain('Fanart metadata available');
    expect(text).toContain('Poster frame');
    expect(text).toContain('Fanart wash');
    expect(document.querySelectorAll('.poster-frame.has-fanart')).toHaveLength(1);
    expect(document.querySelectorAll('.poster-frame.has-poster')).toHaveLength(1);
    expect(document.querySelectorAll('.poster-frame.has-thumb')).toHaveLength(2);
    expect(document.querySelectorAll('.fanart-wash')).toHaveLength(4);
    expect(getLink('Neon Harbor')?.getAttribute('href')).toBe('/video/movies/4401');
    expect(getLink('Quiet Signal')?.getAttribute('href')).toBe('/video/movies/4402');
    expect(getLink('Signal Mirror')?.getAttribute('href')).toBe(
      '/video/tv/5501/seasons/1/episodes/6601'
    );
    expect(getLink('Cold Open')).toBeUndefined();
    expect(text).toContain('Route unavailable');
    expectSecretSafe(text);
  });

  it('renders sanitized loading and error copy without crashing', () => {
    renderPanel(
      createVideoSnapshot({
        refreshStatus: 'error',
        lastRefreshReason: 'error:http/auth',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Failed at http://admin:p@ssword@example.test/jsonrpc with Authorization: Basic abc123 localStorage raw response body smb://secret/movie.mkv'
        }
      })
    );

    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expect(screenText()).toContain('No recently added movies in this snapshot.');
    expectSecretSafe(screenText());

    unmount(mounted!);
    mounted = null;
    renderPanel(createVideoSnapshot({ refreshStatus: 'loading', lastRefreshReason: 'manual' }));

    expect(statusText()).toContain('Loading recent video from manual');
    expect(screenText()).toContain('Loading recent video lists…');
  });

  it('omits malformed links and path-like labels while keeping bounded empty sections visible', () => {
    renderPanel(
      createVideoSnapshot({
        isEmpty: false,
        recentlyAddedMovies: [
          {
            movieid: Number.NaN,
            label: 'smb://nas/private/movie.mkv',
            title: 'https://admin:p@ssword@example.test/private/movie.mkv',
            thumbnail: 'image://unsafe-poster/'
          },
          { movieid: 7, label: 'Safe Movie' }
        ],
        recentlyPlayedEpisodes: [
          {
            episodeid: 1,
            tvshowid: 2,
            label: 'Missing Season',
            title: 'Missing Season',
            fanart: '/mnt/media/private/fanart.jpg'
          }
        ],
        limits: {
          recentlyAddedMovies: { start: 0, end: 2, total: 2 },
          recentlyPlayedEpisodes: { start: 0, end: 1, total: 1 }
        }
      })
    );

    const text = screenText();

    expect(text).toContain('Unknown movie');
    expect(text).toContain('Safe Movie');
    expect(text).toContain('Missing Season');
    expect(text).toContain('Artwork pending');
    expect(document.querySelectorAll('.poster-frame.no-artwork').length).toBeGreaterThanOrEqual(2);
    expect(text).toContain('No recently played movies in this snapshot.');
    expect(text).toContain('No recently added episodes in this snapshot.');
    expect(getLink('Safe Movie')?.getAttribute('href')).toBe('/video/movies/7');
    expect(getLink('Unknown movie')).toBeUndefined();
    expect(getLink('Missing Season')).toBeUndefined();
    expectSecretSafe(text);
  });
});
