import { describe, expect, it, vi } from 'vitest';

import { refreshAppVideoDetailRoute } from './appVideoDetailRefresh';

describe('refreshAppVideoDetailRoute', () => {
  it('hydrates TV show, season, and episode context for episode detail routes', async () => {
    const calls: string[] = [];
    const tvStore = {
      refreshTvShow: vi.fn(async (tvshowid: number) => {
        calls.push(`show:${tvshowid}`);
      }),
      refreshSeasonEpisodes: vi.fn(async (tvshowid: number, season: number) => {
        calls.push(`season:${tvshowid}:${season}`);
      }),
      refreshEpisodeDetail: vi.fn(async (episodeid: number) => {
        calls.push(`episode:${episodeid}`);
      })
    };

    await refreshAppVideoDetailRoute({
      videoRoute: { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 300 },
      expectedRefreshKey: 'host:episode:300',
      hasInjectedVideoTvSnapshot: false,
      hasInjectedVideoMovieDetailSnapshot: false,
      hasInjectedVideoLibrarySnapshot: false,
      currentRefreshKey: () => 'host:episode:300',
      movieDetailStore: {
        refreshMovieDetail: vi.fn()
      },
      tvStore
    });

    expect(calls).toEqual(['show:11', 'season:11:2', 'episode:300']);
  });

  it('stops episode detail hydration when the route changes after parent refresh', async () => {
    const tvStore = {
      refreshTvShow: vi.fn(),
      refreshSeasonEpisodes: vi.fn(),
      refreshEpisodeDetail: vi.fn()
    };

    await refreshAppVideoDetailRoute({
      videoRoute: { kind: 'videoEpisodeDetail', tvshowid: 11, season: 2, episodeid: 300 },
      expectedRefreshKey: 'host:episode:300',
      hasInjectedVideoTvSnapshot: false,
      hasInjectedVideoMovieDetailSnapshot: false,
      hasInjectedVideoLibrarySnapshot: false,
      currentRefreshKey: () => 'host:episode:301',
      movieDetailStore: {
        refreshMovieDetail: vi.fn()
      },
      tvStore
    });

    expect(tvStore.refreshTvShow).toHaveBeenCalledWith(11, 'manual');
    expect(tvStore.refreshSeasonEpisodes).not.toHaveBeenCalled();
    expect(tvStore.refreshEpisodeDetail).not.toHaveBeenCalled();
  });
});
