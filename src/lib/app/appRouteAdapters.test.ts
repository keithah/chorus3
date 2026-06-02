import { describe, expect, it } from 'vitest';

import {
  primaryRouteToVideoRoute,
  toAppRoute,
  videoDetailRefreshKey,
  videoRouteRefreshKey,
  videoRouteToPrimaryRoute
} from './appRouteAdapters';

describe('app route adapters', () => {
  it('wraps raw video routes as app video routes and preserves app routes', () => {
    expect(toAppRoute({ kind: 'videoMovies' })).toEqual({
      kind: 'video',
      route: { kind: 'videoMovies' }
    });
    expect(toAppRoute({ kind: 'dashboard' })).toEqual({ kind: 'dashboard' });
    expect(toAppRoute({ kind: 'primary', route: { kind: 'movies' } })).toEqual({
      kind: 'primary',
      route: { kind: 'movies' }
    });
  });

  it('maps primary Chorus2 video routes to video detail routes', () => {
    expect(primaryRouteToVideoRoute({ kind: 'movies' })).toEqual({ kind: 'videoMovies' });
    expect(primaryRouteToVideoRoute({ kind: 'movieDetail', movieid: '42' })).toEqual({
      kind: 'videoMovieDetail',
      movieid: 42
    });
    expect(
      primaryRouteToVideoRoute({ kind: 'tvshowSeasonDetail', tvshowid: '7', season: '3' })
    ).toEqual({
      kind: 'videoTvSeasonDetail',
      tvshowid: 7,
      season: 3
    });
    expect(
      primaryRouteToVideoRoute({
        kind: 'tvshowEpisodeDetail',
        tvshowid: '7',
        season: '3',
        episodeid: '99'
      })
    ).toEqual({
      kind: 'videoEpisodeDetail',
      tvshowid: 7,
      season: 3,
      episodeid: 99
    });
    expect(primaryRouteToVideoRoute({ kind: 'movieDetail', movieid: '0' })).toBeNull();
  });

  it('maps video routes back to primary metadata routes', () => {
    expect(videoRouteToPrimaryRoute({ kind: 'videoTvShows' })).toEqual({ kind: 'tvshows' });
    expect(videoRouteToPrimaryRoute({ kind: 'videoTvShowDetail', tvshowid: 8 })).toEqual({
      kind: 'tvshowDetail',
      tvshowid: '8'
    });
    expect(videoRouteToPrimaryRoute({ kind: 'videoUnknown', pathLabel: '/video/nope' })).toBeNull();
  });

  it('builds stable detail refresh keys with active host scope', () => {
    const activeHost = {
      id: 'host-a',
      label: 'Kodi',
      host: '127.0.0.1',
      port: 8080,
      useTls: false,
      useWebSocket: true,
      hasCredentials: false
    };

    expect(
      videoRouteRefreshKey({ kind: 'videoEpisodeDetail', tvshowid: 7, season: 3, episodeid: 9 })
    ).toBe('episode:9');
    expect(
      videoDetailRefreshKey({ kind: 'videoTvSeasonDetail', tvshowid: 7, season: 3 }, activeHost)
    ).toBe('host-a:season:7:3');
    expect(videoDetailRefreshKey({ kind: 'videoMovies' }, activeHost)).toBe('');
    expect(videoDetailRefreshKey(null, activeHost)).toBe('');
  });
});
