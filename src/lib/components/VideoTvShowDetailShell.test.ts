import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoTvShowDetailShell from './VideoTvShowDetailShell.svelte';
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
    tvShows: [{ tvshowid: 11, label: 'Severance', title: 'Severance' }],
    tvShowDetail: {
      tvshowid: 11,
      label: 'Severance',
      title: 'Severance',
      year: 2022,
      plot: 'Workers split office and home memories.',
      genre: ['Drama', 'Science Fiction'],
      studio: ['Lumon'],
      rating: 8.7,
      userrating: 9,
      premiered: '2022-02-18',
      episodeCount: 19,
      watchedEpisodeCount: 9,
      unwatchedEpisodes: 10,
      hasUnwatched: true,
      thumbnailAvailable: true,
      fanartAvailable: false,
      artwork: { poster: true, fanart: false }
    },
    seasons: [
      {
        tvshowid: 11,
        season: 1,
        label: 'Season 1',
        title: 'Season 1',
        episodeCount: 9,
        watchedEpisodeCount: 9,
        unwatchedEpisodes: 0,
        hasUnwatched: false,
        playcount: 1,
        watched: true,
        art: { poster: 'image://safe-season-1/' }
      },
      {
        tvshowid: 11,
        season: 2,
        label: 'Season 2',
        title: 'Season 2',
        episodeCount: 10,
        watchedEpisodeCount: 0,
        unwatchedEpisodes: 10,
        hasUnwatched: true
      }
    ],
    limits: { seasons: { start: 0, end: 2, total: 2 } },
    ...overrides
  });
}

function renderShell(
  snapshot: VideoTvStoreSnapshot,
  route: VideoRoute,
  metadataSave?: (method: string, params: Record<string, unknown>) => Promise<void> | void,
  buildOptions?: BuildAppRouteOptions,
  actionDispatch?: EpisodeCollectionActionDispatch
): void {
  mounted = mount(VideoTvShowDetailShell, {
    target: document.body,
    props: { snapshot, route, metadataSave, buildOptions, actionDispatch }
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

describe('VideoTvShowDetailShell', () => {
  it('renders safe TV show metadata and accessible season links', () => {
    renderShell(populatedSnapshot(), { kind: 'videoTvShowDetail', tvshowid: 11 });

    const text = screenText();
    expect(
      document.querySelector('.video-tv-show-detail-shell[aria-labelledby="video-tv-show-title"]')
    ).not.toBeNull();
    expect(document.querySelector('#video-tv-show-title')?.textContent).toContain('Severance');
    expect(
      document.querySelector('.tv-show-hero[aria-label="Safe TV show artwork summary"]')
    ).not.toBeNull();
    expect(document.querySelector('.show-poster-frame[aria-hidden="true"]')).not.toBeNull();
    expect(document.querySelector('.show-fanart-wash[aria-hidden="true"]')).not.toBeNull();
    expect(text).toContain('Poster-led TV show surface');
    expect(getTextButton('Edit')).not.toBeNull();
    expect(document.querySelector('a[href="/video/tv"]')?.textContent).toContain(
      'Back to TV shows'
    );
    expect(text).toContain('TV show ID 11');
    expect(text).toContain('Workers split office and home memories.');
    expect(text).toContain('Drama, Science Fiction');
    expect(text).toContain('Poster artwork available');
    expect(text).toContain('Fanart artwork unavailable');
    expect(text).toContain('10 unwatched episodes');

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.season-link')).map(
      (link) => link.getAttribute('href')
    );
    expect(links).toEqual([
      buildVideoRoute({ kind: 'videoTvSeasonDetail', tvshowid: 11, season: 1 }),
      buildVideoRoute({ kind: 'videoTvSeasonDetail', tvshowid: 11, season: 2 })
    ]);
    expectSecretSafe(text);
  });

  it('uses hash links for season drill-in when mounted from the Kodi package', () => {
    renderShell(populatedSnapshot(), { kind: 'videoTvShowDetail', tvshowid: 11 }, undefined, {
      packageBasePath: '/addons/webinterface.chorus3/',
      routeMode: 'path'
    });

    expect(
      document.querySelector('a[href="/addons/webinterface.chorus3/#video/tv"]')
    ).not.toBeNull();
    expect(
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a.season-link')).map((link) =>
        link.getAttribute('href')
      )
    ).toEqual([
      '/addons/webinterface.chorus3/#video/tv/11/seasons/1',
      '/addons/webinterface.chorus3/#video/tv/11/seasons/2'
    ]);
  });

  it('edits TV show detail routes through the full Chorus2 metadata editor', async () => {
    const metadataSave = vi.fn(async () => undefined);
    renderShell(populatedSnapshot(), { kind: 'videoTvShowDetail', tvshowid: 11 }, metadataSave);

    getTextButton('Edit').click();

    await vi.waitFor(() => {
      expect(screenText()).toContain('Edit TV Show: Severance');
    });
    expect(screenText()).toContain('General');
    expect(screenText()).toContain('Poster');
    expect(screenText()).toContain('Background');

    const title = document.querySelector<HTMLInputElement>('input[name="title"]');
    const studio = document.querySelector<HTMLInputElement>('input[name="studio"]');
    const rating = document.querySelector<HTMLInputElement>('input[name="rating"]');
    expect(title).toBeInstanceOf(HTMLInputElement);
    expect(studio).toBeInstanceOf(HTMLInputElement);
    expect(rating).toBeInstanceOf(HTMLInputElement);

    title!.value = 'New Severance';
    title!.dispatchEvent(new Event('input', { bubbles: true }));
    studio!.value = 'Lumon, Macrodata';
    studio!.dispatchEvent(new Event('input', { bubbles: true }));
    rating!.value = '9.1';
    rating!.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    document.querySelector<HTMLButtonElement>('.metadata-edit-save')?.click();
    await tick();
    await tick();

    expect(metadataSave).toHaveBeenCalledWith(
      'VideoLibrary.SetTVShowDetails',
      expect.objectContaining({
        tvshowid: 11,
        title: 'New Severance',
        studio: ['Lumon', 'Macrodata'],
        rating: 9.1
      })
    );
    expect(screenText()).toContain('Saved metadata for New Severance.');
  });

  it('renders watched and unwatched season boundary states', () => {
    renderShell(populatedSnapshot(), { kind: 'videoTvShowDetail', tvshowid: 11 });

    const text = screenText();
    expect(text).toContain('Season 1');
    expect(text).toContain('Watched');
    expect(text).toContain('0 unwatched episodes');
    expect(text).toContain('Season 2');
    expect(text).toContain('10 unwatched episodes');
  });

  it('exposes Chorus2 play and queue actions for the whole TV show collection', async () => {
    const actionDispatch = {
      playEpisodeCollection: vi.fn(async () => ({ count: 19 })),
      queueEpisodeCollection: vi.fn(async () => ({ count: 19 }))
    };
    renderShell(
      populatedSnapshot(),
      { kind: 'videoTvShowDetail', tvshowid: 11 },
      undefined,
      undefined,
      actionDispatch
    );

    getTextButton('Play').click();
    await settle();
    expect(actionDispatch.playEpisodeCollection).toHaveBeenCalledWith({
      tvshowid: 11,
      label: 'Severance'
    });
    expect(screenText()).toContain('Played 19 episodes from Severance.');

    getTextButton('Queue').click();
    await settle();
    expect(actionDispatch.queueEpisodeCollection).toHaveBeenCalledWith({
      tvshowid: 11,
      label: 'Severance'
    });
    expect(screenText()).toContain('Queued 19 episodes from Severance.');
  });

  it('renders loading error empty and not-found states without throwing', () => {
    renderShell(
      createTvSnapshot({
        refreshStatus: 'error',
        selectedTvShowId: 11,
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc'
        }
      }),
      { kind: 'videoTvShowDetail', tvshowid: 11 }
    );

    let text = screenText();
    expect(text).toContain('TV show not found');
    expect(text).toContain('credentials');
    expectSecretSafe(text);

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    renderShell(createTvSnapshot({ refreshStatus: 'loading', selectedTvShowId: 11 }), {
      kind: 'videoTvShowDetail',
      tvshowid: 11
    });
    text = screenText();
    expect(text).toContain('Loading TV show details');

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    renderShell(populatedSnapshot({ tvShowDetail: null, seasons: [] }), {
      kind: 'videoTvShowDetail',
      tvshowid: 999
    });
    expect(screenText()).toContain('TV show ID 999 is not present in this snapshot.');
  });

  it('renders safe invalid-route and route/detail mismatch states', () => {
    renderShell(populatedSnapshot(), {
      kind: 'videoUnknown',
      pathLabel: '/video/Authorization/Basic/SENTINEL_SECRET'
    });

    const text = screenText();
    expect(text).toContain('TV show route unavailable');
    expect(text).toContain('Open the TV shows grid and choose a TV show link.');
    expectSecretSafe(text);

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    renderShell(populatedSnapshot({ selectedTvShowId: 12 }), {
      kind: 'videoTvShowDetail',
      tvshowid: 11
    });
    expect(screenText()).toContain('TV show ID 11 is not present in this snapshot.');
  });

  it('defensively drops unsafe labels and artwork references', () => {
    renderShell(
      populatedSnapshot({
        tvShowDetail: {
          ...populatedSnapshot().tvShowDetail!,
          label: 'smb://nas/private/show.mkv',
          title: 'http://admin:p@ssword@example.test/show.mkv',
          plot: 'Stored in /mnt/media/private with SENTINEL_SECRET',
          thumbnailAvailable: false,
          fanartAvailable: false,
          artwork: { poster: false }
        },
        seasons: [
          {
            tvshowid: 11,
            season: Number.NaN,
            label: 'smb://nas/private/season',
            title: 'http://admin:p@ssword@example.test/season'
          },
          { tvshowid: 11, season: 3, label: 'Safe Season' }
        ]
      }),
      { kind: 'videoTvShowDetail', tvshowid: 11 }
    );

    const text = screenText();
    expect(text).toContain('Unknown TV show');
    expect(text).toContain('Safe Season');
    expect(document.querySelectorAll('a.season-link')).toHaveLength(1);
    expectSecretSafe(text);
  });
});

function getTextButton(text: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === text
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await tick();
  await Promise.resolve();
  await tick();
}
