import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoSeasonDetailShell, {
  type VideoSeasonArtworkDispatch
} from './VideoSeasonDetailShell.svelte';
import { buildVideoRoute, type VideoRoute } from '$lib/video/videoRouter';
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
  artworkDispatch?: VideoSeasonArtworkDispatch
): void {
  mounted = mount(VideoSeasonDetailShell, {
    target: document.body,
    props: { snapshot, route, artworkDispatch }
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

describe('VideoSeasonDetailShell', () => {
  it('renders an ordered accessible episode list with finite episode links', () => {
    renderShell(populatedSnapshot(), { kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 });

    const text = screenText();
    expect(
      document.querySelector('.video-season-detail-shell[aria-labelledby="video-season-title"]')
    ).not.toBeNull();
    expect(document.querySelector('#video-season-title')?.textContent).toContain('Season 2');
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
      artworkDispatch
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
      artworkDispatch
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
      artworkDispatch
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
      artworkDispatch
    );

    const text = screenText();
    expect(text).toContain('Unknown episode');
    expect(text).toContain('Safe Episode');
    expect(document.querySelectorAll('a.episode-link')).toHaveLength(1);
    expectSecretSafe(text);
  });
});
