import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoMovieDetailShell, {
  type VideoMovieActionDispatch
} from './VideoMovieDetailShell.svelte';
import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';

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

function createMovieDetailSnapshot(
  overrides: Partial<VideoMovieDetailStoreSnapshot> = {}
): VideoMovieDetailStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    selectedMovieId: 42,
    detail: {
      movieid: 42,
      label: 'Alien',
      title: 'Alien',
      year: 1979,
      runtime: 7020,
      plot: 'A commercial crew investigates a distress call.',
      tagline: 'In space no one can hear you scream.',
      genre: ['Horror', 'Science Fiction'],
      director: ['Ridley Scott'],
      studio: ['20th Century Fox'],
      rating: 8.5,
      userrating: 9,
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: { poster: true, fanart: true },
      playcount: 1,
      watched: true,
      resume: { position: 0, total: 7020 },
      versions: { status: 'ready', selectedId: 1, items: [{ id: 1, label: 'Theatrical cut' }] }
    },
    lastError: null,
    ...overrides
  };
}

function createMovieActionDispatch(
  overrides: Partial<VideoMovieActionDispatch> = {}
): VideoMovieActionDispatch {
  return {
    playMovieItem: vi.fn(async () => undefined),
    resumeMovieItem: vi.fn(async () => undefined),
    queueMovieItem: vi.fn(async () => undefined),
    ...overrides
  };
}

function renderShell(
  snapshot: VideoLibraryStoreSnapshot,
  route: VideoRoute,
  props: {
    detailSnapshot?: VideoMovieDetailStoreSnapshot;
    actionDispatch?: VideoMovieActionDispatch;
  } = {}
): void {
  mounted = mount(VideoMovieDetailShell, {
    target: document.body,
    props: { snapshot, route, ...props }
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
    expect(text).not.toContain(
      'Playback, resume, queue, streaming, and watched-write actions arrive in S02.'
    );
    expect(document.querySelectorAll('button')).toHaveLength(3);
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
    expect(text).not.toContain('Read-only route shell');
    expect(document.querySelectorAll('button')).toHaveLength(3);
    expect(
      Array.from(document.querySelectorAll('a')).map((link) => link.textContent?.trim())
    ).toEqual(['Back to movies']);
    expectSecretSafe(text);
  });

  it('renders a safe not-found state for a missing finite movie ID', () => {
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 999 });

    const text = screenText();
    expect(text).toContain('Movie not found');
    expect(text).toContain('Movie ID 999 is not present in this snapshot.');
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
    expect(text).toContain('Version metadata unavailable');
    expect(text).not.toContain('Resume available');
    expectSecretSafe(text);
  });

  it('renders rich detail metadata, artwork availability, and ready version selection', () => {
    renderShell(
      populatedSnapshot(),
      { kind: 'videoMovieDetail', movieid: 42 },
      {
        detailSnapshot: createMovieDetailSnapshot({
          detail: {
            ...createMovieDetailSnapshot().detail!,
            versions: {
              status: 'ready',
              selectedId: 2,
              items: [
                { id: 1, label: 'Theatrical cut' },
                { id: 2, label: 'Director cut' },
                { id: 3, label: 'https://admin:p@ssword@example.test/private.mkv' }
              ]
            }
          }
        })
      }
    );

    const text = screenText();
    expect(text).toContain('A commercial crew investigates a distress call.');
    expect(text).toContain('In space no one can hear you scream.');
    expect(text).toContain('Horror, Science Fiction');
    expect(text).toContain('Ridley Scott');
    expect(text).toContain('20th Century Fox');
    expect(text).toContain('Rating 8.5');
    expect(text).toContain('User rating 9');
    expect(text).toContain('Poster artwork available');
    expect(text).toContain('Fanart artwork available');
    expect(text).toContain('Movie version');
    expect(document.querySelectorAll('select#video-movie-version option')).toHaveLength(2);
    expect(
      (document.querySelector('#video-movie-version') as HTMLSelectElement | null)?.value
    ).toBe('2');
    expectSecretSafe(text);
  });

  it('renders unsupported unavailable and error version states safely', () => {
    for (const versions of [
      { status: 'unsupported', reason: 'Kodi movie versions are not supported yet.' } as const,
      { status: 'unavailable', reason: 'No safe movie versions are available.' } as const,
      {
        status: 'error',
        message:
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc from localStorage'
      } as const
    ]) {
      document.body.innerHTML = '';
      if (mounted) {
        unmount(mounted);
        mounted = null;
      }
      renderShell(
        populatedSnapshot(),
        { kind: 'videoMovieDetail', movieid: 42 },
        {
          detailSnapshot: createMovieDetailSnapshot({
            detail: { ...createMovieDetailSnapshot().detail!, versions }
          })
        }
      );
      const text = screenText();
      expect(text).toMatch(/Movie versions (unsupported|unavailable|failed)/);
      expectSecretSafe(text);
    }
  });

  it('routes play resume and queue buttons through injected action dispatch with finite movie IDs', async () => {
    const actionDispatch = createMovieActionDispatch();
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 84 }, { actionDispatch });

    getButtonByAria('Play movie Arrival').click();
    await tick();
    await tick();
    getButtonByAria('Resume movie Arrival').click();
    await tick();
    await tick();
    getButtonByAria('Queue movie Arrival').click();
    await tick();
    await tick();

    expect(actionDispatch.playMovieItem).toHaveBeenCalledWith({ movieid: 84 });
    expect(actionDispatch.resumeMovieItem).toHaveBeenCalledWith({ movieid: 84 });
    expect(actionDispatch.queueMovieItem).toHaveBeenCalledWith({ movieid: 84 });
    expect(screenText()).toContain('Queued Arrival.');
  });

  it('disables action controls while a movie action is pending', async () => {
    let resolvePlay: () => void = () => {
      throw new Error('Play promise resolver was not assigned.');
    };
    const actionDispatch = createMovieActionDispatch({
      playMovieItem: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolvePlay = resolve;
          })
      )
    });
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 42 }, { actionDispatch });

    getButtonByAria('Play movie Alien').click();
    await tick();

    expect(getButtonByAria('Play movie Alien').disabled).toBe(true);
    expect(getButtonByAria('Resume movie Alien').disabled).toBe(true);
    expect(getButtonByAria('Queue movie Alien').disabled).toBe(true);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Playing Alien…');

    resolvePlay();
    await tick();
    await tick();

    expect(getButtonByAria('Play movie Alien').disabled).toBe(false);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Playing Alien started.'
    );
  });

  it('renders rejected action errors through sanitized accessible status copy', async () => {
    const actionDispatch = createMovieActionDispatch({
      queueMovieItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/movie.mkv'
        );
      })
    });
    renderShell(populatedSnapshot(), { kind: 'videoMovieDetail', movieid: 84 }, { actionDispatch });

    getButtonByAria('Queue movie Arrival').click();
    await tick();
    await tick();

    const text = screenText();
    expect(actionDispatch.queueMovieItem).toHaveBeenCalledWith({ movieid: 84 });
    expect(text).toContain('Could not queue Arrival.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('[redacted-url]');
    expect(text).toContain('response body [redacted]');
    expect(text).toContain('browser storage');
    expectSecretSafe(text);
  });

  it('does not call dispatch when no safe movie is selected', () => {
    const actionDispatch = createMovieActionDispatch();
    renderShell(
      populatedSnapshot(),
      { kind: 'videoMovieDetail', movieid: 999 },
      { actionDispatch }
    );

    expect(document.querySelectorAll('button')).toHaveLength(0);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Movie not found');
    expect(actionDispatch.playMovieItem).not.toHaveBeenCalled();
    expect(actionDispatch.queueMovieItem).not.toHaveBeenCalled();
  });
});

function getButtonByAria(ariaLabel: string): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}
