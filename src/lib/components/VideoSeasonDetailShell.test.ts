import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoSeasonDetailShell, {
  type VideoSeasonArtworkDispatch,
  type VideoSeasonWriteDispatch,
  type VideoSeasonWriteSummary
} from './VideoSeasonDetailShell.svelte';
import type { BuildAppRouteOptions } from '$lib/app/appRouter';
import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';
import type { EpisodeCollectionActionDispatch } from '$lib/stores/episodeCollectionActions';
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
    tvShowDetail: {
      tvshowid: 11,
      label: 'Severance',
      title: 'Severance',
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: {}
    },
    seasons: [
      { tvshowid: 11, season: 2, label: 'Season 2', episodeCount: 3, unwatchedEpisodes: 2 }
    ],
    episodes: [
      {
        episodeid: 300,
        tvshowid: 11,
        season: 2,
        episode: 3,
        label: 'Who Is Alive?',
        title: 'Who Is Alive?',
        runtime: 3600,
        playcount: 1,
        watched: true
      },
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
      {
        episodeid: 200,
        tvshowid: 11,
        season: 2,
        episode: 2,
        label: 'Goodbye, Mrs. Selvig',
        title: 'Goodbye, Mrs. Selvig',
        runtime: 3500
      }
    ],
    seasonArtworkCapability: {
      status: 'supported',
      reason: 'Season artwork refresh is available.',
      availableArtTypes: ['poster', 'fanart'],
      availableArtwork: { poster: true, fanart: false }
    },
    limits: { episodes: { start: 0, end: 3, total: 10 } },
    ...overrides
  });
}

function renderShell(
  snapshot: VideoTvStoreSnapshot,
  route: VideoRoute,
  props: {
    artworkDispatch?: VideoSeasonArtworkDispatch;
    writeDispatch?: VideoSeasonWriteDispatch;
    actionDispatch?: EpisodeCollectionActionDispatch;
    buildOptions?: BuildAppRouteOptions;
  } = {}
): void {
  mounted = mount(VideoSeasonDetailShell, {
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
  expect(value).not.toContain('image://');
}

function getButton(label: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) =>
      candidate.getAttribute('aria-label') === label || candidate.textContent?.trim() === label
  );
  expect(button, `button ${label}`).toBeInstanceOf(HTMLButtonElement);
  return button!;
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await tick();
  await Promise.resolve();
  await tick();
}

function createSeasonWriteDispatch(
  overrides: Partial<VideoSeasonWriteDispatch> = {}
): VideoSeasonWriteDispatch {
  return {
    markEpisodesWatched: vi.fn(async () => ({
      total: 0,
      succeeded: 0,
      failed: 0,
      failedItems: []
    })),
    retryFailedVideoWrites: vi.fn(async () => ({
      total: 0,
      succeeded: 0,
      failed: 0,
      failedItems: []
    })),
    ...overrides
  };
}

function seasonEpisodes(count: number): VideoTvStoreSnapshot['episodes'] {
  return Array.from({ length: count }, (_, index) => ({
    episodeid: 1000 + index,
    tvshowid: 11,
    season: 2,
    episode: index + 1,
    label: `Episode ${String(index + 1).padStart(3, '0')}`,
    runtime: 1800 + index
  }));
}

describe('VideoSeasonDetailShell', () => {
  it('renders an ordered accessible episode list with finite episode links', () => {
    renderShell(populatedSnapshot(), { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 });

    const text = screenText();
    expect(
      document.querySelector('.video-season-detail-shell[aria-labelledby="video-season-title"]')
    ).not.toBeNull();
    expect(document.querySelector('#video-season-title')?.textContent).toContain('Season 2');
    expect(
      document.querySelector('.season-hero[aria-label="Safe season artwork summary"]')
    ).not.toBeNull();
    expect(document.querySelector('.season-poster-frame[aria-hidden="true"]')).not.toBeNull();
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(2);
    expect(text).toContain('Season poster surface');
    expect(document.querySelector('a[href="/video/tv/11"]')?.textContent).toContain(
      'Back to Severance'
    );
    expect(text).toContain('3 of 10 episodes');
    expect(text).toContain('Resume available');
    expect(text).toContain('Watched');
    expect(text).toContain('2 unwatched episodes');

    const titles = Array.from(document.querySelectorAll('.episode-title')).map((node) =>
      node.textContent?.trim()
    );
    expect(titles).toEqual(['Hello, Ms. Cobel', 'Goodbye, Mrs. Selvig', 'Who Is Alive?']);

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.episode-link')).map(
      (link) => link.getAttribute('href')
    );
    expect(links).toEqual([
      buildVideoRoute({ kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 100 }),
      buildVideoRoute({ kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 200 }),
      buildVideoRoute({ kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 300 })
    ]);
    expectSecretSafe(text);
  });

  it('uses hash links for episode drill-in when mounted from the Kodi package', () => {
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      {
        buildOptions: { packageBasePath: '/addons/webinterface.chorus3/', routeMode: 'path' }
      }
    );

    expect(
      document.querySelector('a[href="/addons/webinterface.chorus3/#video/tv/11"]')
    ).not.toBeNull();
    expect(
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a.episode-link')).map((link) =>
        link.getAttribute('href')
      )
    ).toEqual([
      '/addons/webinterface.chorus3/#video/tv/11/seasons/2/episodes/100',
      '/addons/webinterface.chorus3/#video/tv/11/seasons/2/episodes/200',
      '/addons/webinterface.chorus3/#video/tv/11/seasons/2/episodes/300'
    ]);
  });

  it('renders supported unsupported unavailable and error artwork refresh status honestly', () => {
    for (const capability of [
      {
        status: 'supported',
        reason: 'Season artwork refresh is available.',
        availableArtTypes: ['poster'] as string[],
        availableArtwork: { poster: true }
      } as const,
      { status: 'unsupported', reason: 'Kodi does not expose a proven mutation.' } as const,
      { status: 'unavailable', reason: 'No season selected.' } as const,
      {
        status: 'error',
        message: 'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc'
      } as const
    ]) {
      document.body.innerHTML = '';
      if (mounted) {
        unmount(mounted);
        mounted = null;
      }
      renderShell(populatedSnapshot({ seasonArtworkCapability: capability }), {
        kind: 'videoTvSeasonDetail',
        tvshowid: 11,
        season: 2
      });
      const text = screenText();
      expect(document.querySelector('[role="status"]')?.textContent).toMatch(
        /Season artwork (ready|unsupported|unavailable|failed)/
      );
      expectSecretSafe(text);
    }
  });

  it('dispatches artwork refresh with finite route IDs and disables while pending', async () => {
    let resolveRefresh: () => void = () => {
      throw new Error('resolver not assigned');
    };
    const artworkDispatch: VideoSeasonArtworkDispatch = {
      refreshSeasonArtwork: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          })
      )
    };
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { artworkDispatch }
    );

    const button = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Refresh artwork for Severance season 2"]'
    );
    expect(button).toBeInstanceOf(HTMLButtonElement);
    button!.click();
    await tick();

    expect(artworkDispatch.refreshSeasonArtwork).toHaveBeenCalledWith({ tvshowid: 11, season: 2 });
    expect(button!.disabled).toBe(true);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Refreshing artwork for Severance season 2…'
    );

    resolveRefresh();
    await tick();
    await tick();
    expect(button!.disabled).toBe(false);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Artwork refresh requested for Severance season 2.'
    );
  });

  it('sanitizes rejected artwork refresh errors', async () => {
    const artworkDispatch: VideoSeasonArtworkDispatch = {
      refreshSeasonArtwork: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/season'
        );
      })
    };
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { artworkDispatch }
    );

    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Refresh artwork for Severance season 2"]'
      )!
      .click();
    await tick();
    await tick();

    const text = screenText();
    expect(text).toContain('Could not refresh artwork for Severance season 2.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('[redacted-url]');
    expect(text).toContain('response body [redacted]');
    expectSecretSafe(text);
  });

  it('renders invalid route empty and hostile episode states safely without dispatch', () => {
    const artworkDispatch: VideoSeasonArtworkDispatch = { refreshSeasonArtwork: vi.fn() };
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 999 },
      { artworkDispatch }
    );

    expect(screenText()).toContain('Season 999 is not present in this snapshot.');
    expect(document.querySelector('button')).toBeNull();

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    renderShell(
      populatedSnapshot({
        episodes: [
          {
            episodeid: Number.NaN,
            tvshowid: 11,
            season: 2,
            episode: 1,
            label: 'smb://nas/private/episode.mkv',
            title: 'http://admin:p@ssword@example.test/episode.mkv',
            thumbnail: 'image://private/'
          },
          { episodeid: 7, tvshowid: 11, season: 2, episode: 2, label: 'Safe Episode' }
        ]
      }),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { artworkDispatch }
    );

    const text = screenText();
    expect(text).toContain('Unknown episode');
    expect(text).toContain('Safe Episode');
    expect(document.querySelectorAll('a.episode-link')).toHaveLength(1);
    expectSecretSafe(text);
  });

  it('routes 103 episode season watched and unwatched batches through injected write dispatch', async () => {
    const expectedItems = seasonEpisodes(103).map((episode) => ({
      episodeid: episode.episodeid,
      label: episode.label
    }));
    const writeDispatch = createSeasonWriteDispatch({
      markEpisodesWatched: vi.fn(async (items, watched) => ({
        total: items.length,
        succeeded: items.length,
        failed: 0,
        failedItems: [],
        watched
      }))
    });
    renderShell(
      populatedSnapshot({
        seasons: [
          { tvshowid: 11, season: 2, label: 'Season 2', episodeCount: 103, unwatchedEpisodes: 103 }
        ],
        episodes: seasonEpisodes(103),
        limits: { episodes: { start: 0, end: 103, total: 103 } }
      }),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { writeDispatch }
    );

    getButton('Mark season watched').click();
    await tick();
    await tick();

    expect(writeDispatch.markEpisodesWatched).toHaveBeenCalledWith(expectedItems, true);
    expect(screenText()).toContain('103 of 103 updated; 0 failed');

    getButton('Mark season unwatched').click();
    await tick();
    await tick();

    expect(writeDispatch.markEpisodesWatched).toHaveBeenLastCalledWith(expectedItems, false);
    expect(screenText()).toContain('103 of 103 updated; 0 failed');
    expectSecretSafe(screenText());
  });

  it('exposes Chorus2 play and queue actions for the season collection', async () => {
    const actionDispatch = {
      playEpisodeCollection: vi.fn(async () => ({ count: 3 })),
      queueEpisodeCollection: vi.fn(async () => ({ count: 3 }))
    };
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      {
        actionDispatch
      }
    );

    getButton('Play season').click();
    await settle();
    expect(actionDispatch.playEpisodeCollection).toHaveBeenCalledWith({
      tvshowid: 11,
      season: 2,
      label: 'Severance season 2'
    });
    expect(screenText()).toContain('Played 3 episodes from Severance season 2.');

    getButton('Queue season').click();
    await settle();
    expect(actionDispatch.queueEpisodeCollection).toHaveBeenCalledWith({
      tvshowid: 11,
      season: 2,
      label: 'Severance season 2'
    });
    expect(screenText()).toContain('Queued 3 episodes from Severance season 2.');
  });

  it('disables season write controls during pending batch writes', async () => {
    let resolveBatch: (value: VideoSeasonWriteSummary) => void = () => {
      throw new Error('resolver not assigned');
    };
    const writeDispatch = createSeasonWriteDispatch({
      markEpisodesWatched: vi.fn(
        () =>
          new Promise<VideoSeasonWriteSummary>((resolve) => {
            resolveBatch = resolve;
          })
      )
    });
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { writeDispatch }
    );

    getButton('Mark season watched').click();
    await tick();

    expect(getButton('Mark season watched').disabled).toBe(true);
    expect(getButton('Mark season unwatched').disabled).toBe(true);
    expect(screenText()).toContain('Marking 3 episodes watched…');

    resolveBatch({ total: 3, succeeded: 3, failed: 0, failedItems: [] });
    await tick();
    await tick();

    expect(getButton('Mark season watched').disabled).toBe(false);
    expect(screenText()).toContain('3 of 3 updated; 0 failed');
  });

  it('renders partial season batch summaries sanitizes failures and retries failed IDs only', async () => {
    const writeDispatch = createSeasonWriteDispatch({
      markEpisodesWatched: vi.fn(async () => ({
        total: 103,
        succeeded: 97,
        failed: 6,
        failedItems: [
          {
            kind: 'episode' as const,
            id: 1007,
            label: 'smb://nas/private/Episode 008.mkv',
            error: {
              source: 'http' as const,
              code: 'http/failed',
              message:
                'Authorization: Basic abc123 failed at http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage SENTINEL_SECRET'
            }
          },
          {
            kind: 'episode' as const,
            id: 1012,
            label: 'Episode 013',
            error: {
              source: 'write' as const,
              code: 'write/failed',
              message: '/mnt/media/private.mkv failed'
            }
          }
        ]
      })),
      retryFailedVideoWrites: vi.fn(async (items) => ({
        total: items.length,
        succeeded: items.length,
        failed: 0,
        failedItems: []
      }))
    });
    renderShell(
      populatedSnapshot({
        seasons: [
          { tvshowid: 11, season: 2, label: 'Season 2', episodeCount: 103, unwatchedEpisodes: 103 }
        ],
        episodes: seasonEpisodes(103),
        limits: { episodes: { start: 0, end: 103, total: 103 } }
      }),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { writeDispatch }
    );

    getButton('Mark season watched').click();
    await tick();
    await tick();

    const text = screenText();
    expect(text).toContain('97 of 103 updated; 6 failed');
    expect(text).toContain('Episode 1007');
    expect(text).toContain('Episode 013');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('response body [redacted]');
    expectSecretSafe(text);

    getButton('Retry failed').click();
    await tick();
    await tick();

    expect(writeDispatch.retryFailedVideoWrites).toHaveBeenCalledWith([
      { episodeid: 1007, label: 'Episode 1007' },
      { episodeid: 1012, label: 'Episode 013' }
    ]);
    expect(screenText()).toContain('2 of 2 updated; 0 failed');
  });

  it('filters unsafe episode IDs and shows no writable episode copy when none remain', async () => {
    const writeDispatch = createSeasonWriteDispatch();
    renderShell(
      populatedSnapshot({
        episodes: [
          { episodeid: Number.NaN, tvshowid: 11, season: 2, episode: 1, label: 'Unsafe NaN' },
          { episodeid: -5, tvshowid: 11, season: 2, episode: 2, label: 'Unsafe negative' },
          { episodeid: 2 ** 54, tvshowid: 11, season: 2, episode: 3, label: 'Unsafe large' }
        ],
        limits: { episodes: { start: 0, end: 3, total: 3 } }
      }),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { writeDispatch }
    );

    expect(screenText()).toContain('No writable episodes in this season snapshot.');
    expect(getButton('Mark season watched').disabled).toBe(true);
    expect(getButton('Mark season unwatched').disabled).toBe(true);

    getButton('Mark season watched').click();
    await tick();

    expect(writeDispatch.markEpisodesWatched).not.toHaveBeenCalled();
  });

  it('does not trust malformed season write summaries or expose retry targets', async () => {
    const writeDispatch = createSeasonWriteDispatch({
      markEpisodesWatched: vi.fn(async () => ({
        total: 999,
        succeeded: 998,
        failed: 1,
        failedItems: [
          {
            kind: 'episode' as const,
            id: 100,
            label: 'Hello, Ms. Cobel',
            error: { source: 'write' as const, code: 'write/failed', message: 'failed' }
          }
        ]
      }))
    });
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { writeDispatch }
    );

    getButton('Mark season watched').click();
    await tick();
    await tick();

    expect(screenText()).toContain(
      'Season write failed. The write dispatch returned a malformed summary.'
    );
    expect(
      document.querySelector<HTMLButtonElement>('button[aria-label="Retry failed"]')
    ).toBeNull();
  });

  it('sanitizes thrown season write errors and keeps retry unavailable without failed IDs', async () => {
    const writeDispatch = createSeasonWriteDispatch({
      markEpisodesWatched: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc and /mnt/media/private.mkv from sessionStorage'
        );
      })
    });
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 },
      { writeDispatch }
    );

    getButton('Mark season unwatched').click();
    await tick();
    await tick();

    const text = screenText();
    expect(text).toContain('Could not mark season unwatched.');
    expect(text).toContain('credentials [redacted]');
    expect(
      document.querySelector<HTMLButtonElement>('button[aria-label="Retry failed"]')
    ).toBeNull();
    expectSecretSafe(text);
  });
});
