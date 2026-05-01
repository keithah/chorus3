import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoEpisodeDetailShell, {
  type VideoEpisodeActionDispatch
} from './VideoEpisodeDetailShell.svelte';
import type { VideoRoute } from '$lib/video/videoRouter';
import type { VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';

let mounted: ReturnType<typeof mount> | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

type TvSnapshotOverrides = Omit<Partial<VideoTvStoreSnapshot>, 'limits'> & {
  limits?: Partial<VideoTvStoreSnapshot['limits']>;
};

function createTvSnapshot(overrides: TvSnapshotOverrides = {}): VideoTvStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: null,
    selectedTvShowId: null,
    selectedSeason: null,
    selectedEpisodeId: null,
    tvShows: [],
    tvShowDetail: null,
    seasons: [],
    episodes: [],
    episodeDetail: null,
    seasonArtworkCapability: { status: 'unavailable', reason: 'No season selected.' },
    lastError: null,
    ...overrides,
    limits: {
      tvShows: { start: 0, end: 0, total: 0 },
      seasons: { start: 0, end: 0, total: 0 },
      episodes: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
  };
}

function populatedSnapshot(overrides: TvSnapshotOverrides = {}): VideoTvStoreSnapshot {
  return createTvSnapshot({
    selectedTvShowId: 11,
    selectedSeason: 2,
    selectedEpisodeId: 100,
    tvShowDetail: {
      tvshowid: 11,
      label: 'Severance',
      title: 'Severance',
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: {}
    },
    seasons: [{ tvshowid: 11, season: 2, label: 'Season 2' }],
    episodes: [
      {
        episodeid: 100,
        tvshowid: 11,
        season: 2,
        episode: 1,
        label: 'Hello, Ms. Cobel',
        title: 'Hello, Ms. Cobel',
        runtime: 3300,
        resume: { position: 600, total: 3300 }
      },
      { episodeid: 200, tvshowid: 11, season: 2, episode: 2, label: 'Goodbye, Mrs. Selvig' }
    ],
    episodeDetail: {
      episodeid: 100,
      tvshowid: 11,
      season: 2,
      episode: 1,
      label: 'Hello, Ms. Cobel',
      title: 'Hello, Ms. Cobel',
      showtitle: 'Severance',
      runtime: 3300,
      plot: 'Mark returns to Lumon.',
      director: ['Ben Stiller'],
      writer: ['Dan Erickson'],
      rating: 8.4,
      userrating: 9,
      firstaired: '2025-01-17',
      thumbnailAvailable: true,
      fanartAvailable: false,
      artwork: { thumb: true, fanart: false },
      resume: { position: 600, total: 3300 }
    },
    ...overrides
  });
}

function createActionDispatch(
  overrides: Partial<VideoEpisodeActionDispatch> = {}
): VideoEpisodeActionDispatch {
  return {
    playEpisodeItem: vi.fn(async () => undefined),
    resumeEpisodeItem: vi.fn(async () => undefined),
    queueEpisodeItem: vi.fn(async () => undefined),
    streamEpisodeItem: vi.fn(async () => undefined),
    markEpisodeWatched: vi.fn(async () => undefined),
    ...overrides
  };
}

function renderShell(
  snapshot: VideoTvStoreSnapshot,
  route: VideoRoute,
  actionDispatch?: VideoEpisodeActionDispatch
): void {
  mounted = mount(VideoEpisodeDetailShell, {
    target: document.body,
    props: { snapshot, route, actionDispatch }
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
  expect(value).not.toContain('image://');
}

describe('VideoEpisodeDetailShell', () => {
  it('renders safe episode metadata actions status and navigation links', () => {
    renderShell(populatedSnapshot(), {
      kind: 'videoEpisodeDetail',
      tvshowid: 11,
      season: 2,
      episodeid: 100
    });

    const text = screenText();
    expect(
      document.querySelector('.video-episode-detail-shell[aria-labelledby="video-episode-title"]')
    ).not.toBeNull();
    expect(document.querySelector('#video-episode-title')?.textContent).toContain(
      'Hello, Ms. Cobel'
    );
    expect(document.querySelector('a[href="/video/tv/11/seasons/2"]')?.textContent).toContain(
      'Back to Season 2'
    );
    expect(document.querySelector('a[href="/video/tv/11"]')?.textContent).toContain(
      'Back to Severance'
    );
    expect(text).toContain('Episode ID 100');
    expect(text).toContain('Season 2 · Episode 1');
    expect(text).toContain('55:00');
    expect(text).toContain('Resume available');
    expect(text).toContain('Mark returns to Lumon.');
    expect(getButton('Mark episode Hello, Ms. Cobel watched').textContent).toContain(
      'Mark watched'
    );
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Episode actions are ready.'
    );
    expect(document.querySelectorAll('button')).toHaveLength(5);
    expectSecretSafe(text);
  });

  it('routes play resume queue and stream through injected dispatch with finite episode IDs', async () => {
    const actionDispatch = createActionDispatch();
    renderShell(
      populatedSnapshot(),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 100 },
      actionDispatch
    );

    getButton('Play episode Hello, Ms. Cobel').click();
    await tick();
    await tick();
    getButton('Resume episode Hello, Ms. Cobel').click();
    await tick();
    await tick();
    getButton('Queue episode Hello, Ms. Cobel').click();
    await tick();
    await tick();
    getButton('Stream episode Hello, Ms. Cobel').click();
    await tick();
    await tick();

    expect(actionDispatch.playEpisodeItem).toHaveBeenCalledWith({ episodeid: 100 });
    expect(actionDispatch.resumeEpisodeItem).toHaveBeenCalledWith({ episodeid: 100 });
    expect(actionDispatch.queueEpisodeItem).toHaveBeenCalledWith({ episodeid: 100 });
    expect(actionDispatch.streamEpisodeItem).toHaveBeenCalledWith({ episodeid: 100 });
    expect(screenText()).toContain('Streaming Hello, Ms. Cobel requested.');
  });

  it('routes watched and unwatched episode buttons through injected dispatch with finite episode IDs', async () => {
    const actionDispatch = createActionDispatch();

    renderShell(
      populatedSnapshot(),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 100 },
      actionDispatch
    );
    getButton('Mark episode Hello, Ms. Cobel watched').click();
    await tick();
    await tick();

    expect(actionDispatch.markEpisodeWatched).toHaveBeenCalledWith({
      episodeid: 100,
      watched: true
    });
    expect(screenText()).toContain('Marked Hello, Ms. Cobel watched.');

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }

    renderShell(
      populatedSnapshot({
        selectedEpisodeId: 200,
        episodeDetail: null,
        episodes: [
          {
            episodeid: 200,
            tvshowid: 11,
            season: 2,
            episode: 2,
            label: 'Goodbye, Mrs. Selvig',
            playcount: 1,
            watched: true
          }
        ]
      }),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 200 },
      actionDispatch
    );
    getButton('Mark episode Goodbye, Mrs. Selvig unwatched').click();
    await tick();
    await tick();

    expect(actionDispatch.markEpisodeWatched).toHaveBeenCalledWith({
      episodeid: 200,
      watched: false
    });
    expect(screenText()).toContain('Marked Goodbye, Mrs. Selvig unwatched.');
  });

  it('disables pending controls and sanitizes action dispatch errors', async () => {
    let resolvePlay: () => void = () => {
      throw new Error('resolver not assigned');
    };
    const actionDispatch = createActionDispatch({
      playEpisodeItem: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolvePlay = resolve;
          })
      ),
      queueEpisodeItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/episode'
        );
      })
    });
    renderShell(
      populatedSnapshot(),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 100 },
      actionDispatch
    );

    getButton('Play episode Hello, Ms. Cobel').click();
    await tick();

    expect(getButton('Play episode Hello, Ms. Cobel').disabled).toBe(true);
    expect(getButton('Queue episode Hello, Ms. Cobel').disabled).toBe(true);
    expect(getButton('Mark episode Hello, Ms. Cobel watched').disabled).toBe(true);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Playing Hello, Ms. Cobel…'
    );

    resolvePlay();
    await tick();
    await tick();
    getButton('Queue episode Hello, Ms. Cobel').click();
    await tick();
    await tick();

    const text = screenText();
    expect(text).toContain('Could not queue Hello, Ms. Cobel.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('[redacted-url]');
    expect(text).toContain('response body [redacted]');
    expectSecretSafe(text);
  });

  it('renders rejected watched episode errors through sanitized accessible status copy', async () => {
    const actionDispatch = createActionDispatch({
      markEpisodeWatched: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for https://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and /mnt/media/private/episode.mkv and SENTINEL_SECRET'
        );
      })
    });
    renderShell(
      populatedSnapshot(),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 100 },
      actionDispatch
    );

    getButton('Mark episode Hello, Ms. Cobel watched').click();
    await tick();
    await tick();

    const text = screenText();
    expect(actionDispatch.markEpisodeWatched).toHaveBeenCalledWith({
      episodeid: 100,
      watched: true
    });
    expect(text).toContain('Could not mark Hello, Ms. Cobel watched.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('[redacted-url]');
    expect(text).toContain('response body [redacted]');
    expect(text).toContain('browser storage');
    expectSecretSafe(text);
  });

  it('disables resume when no resume point exists and renders watched state', () => {
    renderShell(
      populatedSnapshot({
        selectedEpisodeId: 200,
        episodeDetail: null,
        episodes: [
          {
            episodeid: 200,
            tvshowid: 11,
            season: 2,
            episode: 2,
            label: 'Goodbye, Mrs. Selvig',
            playcount: 1,
            watched: true
          }
        ]
      }),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 200 }
    );

    const text = screenText();
    expect(text).toContain('Goodbye, Mrs. Selvig');
    expect(text).toContain('Watched');
    expect(getButton('Mark episode Goodbye, Mrs. Selvig unwatched').textContent).toContain(
      'Mark unwatched'
    );
    expect(text).toContain('No resume point available');
    expect(getButton('Resume episode Goodbye, Mrs. Selvig').disabled).toBe(true);
  });

  it('renders invalid route route-detail mismatch and hostile metadata safely without dispatch', () => {
    const actionDispatch = createActionDispatch();
    renderShell(
      populatedSnapshot(),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 999 },
      actionDispatch
    );

    expect(screenText()).toContain('Episode ID 999 is not present in this snapshot.');
    expect(document.querySelectorAll('button')).toHaveLength(0);
    expect(actionDispatch.playEpisodeItem).not.toHaveBeenCalled();

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    renderShell(
      populatedSnapshot({
        episodeDetail: {
          ...populatedSnapshot().episodeDetail!,
          label: 'smb://nas/private/episode.mkv',
          title: 'http://admin:p@ssword@example.test/episode.mkv',
          plot: 'Stored in /mnt/media/private with SENTINEL_SECRET',
          episodeid: 100
        }
      }),
      { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 100 },
      actionDispatch
    );

    const text = screenText();
    expect(text).toContain('Unknown episode');
    expectSecretSafe(text);

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    renderShell(populatedSnapshot(), {
      kind: 'videoUnknown',
      pathLabel: '/video/Authorization/Basic/SENTINEL_SECRET'
    });
    expect(screenText()).toContain('Episode route unavailable');
  });
});

function getButton(ariaLabel: string): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}
