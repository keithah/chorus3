import { describe, expect, test, vi } from 'vitest';

import {
  buildAppRoute,
  isDelegatedVideoRoute,
  navigateAppRoute,
  parseAppRoute,
  unwrapVideoRoute,
  type AppRoute
} from './appRouter';
import { buildVideoRoute, type VideoRoute } from '../video/videoRouter';

describe('parseAppRoute', () => {
  test('parses dashboard and settings routes without using query identity', () => {
    expect(parseAppRoute('/')).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute('', '?m005-browser-proof=1')).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute('/settings')).toEqual({ kind: 'settings' });
    expect(parseAppRoute('/settings', '?m005-browser-proof=1')).toEqual({ kind: 'settings' });
  });

  test('delegates video routes to the video router with parity', () => {
    const videoRoutes: VideoRoute[] = [
      { kind: 'videoMovies' },
      { kind: 'videoMovieDetail', movieid: 4401 },
      { kind: 'videoMovieStream', movieid: 4401 },
      { kind: 'videoTvShows' },
      { kind: 'videoTvShowDetail', tvshowid: 5501 },
      { kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 },
      { kind: 'videoEpisodeDetail', tvshowid: 5501, season: 1, episodeid: 6601 }
    ];

    for (const videoRoute of videoRoutes) {
      const path = buildVideoRoute(videoRoute);

      expect(parseAppRoute(path, '?ignored=1')).toEqual({ kind: 'video', route: videoRoute });
      expect(unwrapVideoRoute(parseAppRoute(path))).toEqual(videoRoute);
    }
  });

  test('normalizes edge inputs without throwing', () => {
    expect(() => parseAppRoute(null)).not.toThrow();
    expect(() => parseAppRoute({ raw: '/settings' })).not.toThrow();
    expect(parseAppRoute(null)).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute(undefined)).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute({ raw: '/settings' })).toEqual({
      kind: 'settingsUnknown',
      pathLabel: '/[redacted]'
    });
    expect(parseAppRoute('')).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute('?m005-browser-proof=1')).toEqual({ kind: 'dashboard' });
    expect(parseAppRoute('//settings//')).toEqual({ kind: 'settings' });
    expect(parseAppRoute('/settings/')).toEqual({ kind: 'settings' });
    expect(parseAppRoute('/video/movies/4401')).toEqual({
      kind: 'video',
      route: { kind: 'videoMovieDetail', movieid: 4401 }
    });
  });

  test('redacts credential-like unknown settings path labels', () => {
    const route = parseAppRoute(
      '/settings/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET/localStorage/sessionStorage',
      '?token=Basic'
    );

    expect(route.kind).toBe('settingsUnknown');
    expect(JSON.stringify(route)).not.toMatch(
      /Authorization|Basic|admin:p@ssword|SENTINEL_SECRET|localStorage|sessionStorage|token=/i
    );
    expect(route).toEqual({
      kind: 'settingsUnknown',
      pathLabel: '/settings/[redacted]/[redacted]/[redacted]/[redacted]'
    });
  });
});

describe('buildAppRoute', () => {
  test.each<[AppRoute, string]>([
    [{ kind: 'dashboard' }, '/'],
    [{ kind: 'settings' }, '/settings'],
    [
      { kind: 'settingsUnknown', pathLabel: '/settings/Authorization/Basic' },
      '/settings/[redacted]/[redacted]'
    ],
    [{ kind: 'video', route: { kind: 'videoMovies' } }, '/video/movies'],
    [{ kind: 'video', route: { kind: 'videoMovieDetail', movieid: 4401 } }, '/video/movies/4401']
  ])('builds %j as %s', (route, expectedPath) => {
    expect(buildAppRoute(route)).toBe(expectedPath);
  });

  test('falls back safely for malformed routes', () => {
    expect(buildAppRoute({ kind: 'unexpected' } as unknown as AppRoute)).toBe('/');
    expect(buildAppRoute({ kind: 'video', route: { kind: 'videoMovieDetail', movieid: 0 } })).toBe(
      '/video/unknown'
    );
  });
});

describe('app route helpers', () => {
  test('identify and unwrap delegated video routes', () => {
    const appRoute: AppRoute = { kind: 'video', route: { kind: 'videoMovies' } };

    expect(isDelegatedVideoRoute(appRoute)).toBe(true);
    expect(isDelegatedVideoRoute({ kind: 'settings' })).toBe(false);
    expect(unwrapVideoRoute(appRoute)).toEqual({ kind: 'videoMovies' });
    expect(unwrapVideoRoute({ kind: 'settings' })).toEqual({ kind: 'dashboard' });
  });

  test('pushes built app routes and returns false when history is unavailable or throws', () => {
    const pushState = vi.fn();

    expect(navigateAppRoute({ kind: 'settings' }, { history: { pushState } })).toBe(true);
    expect(pushState).toHaveBeenCalledWith({ routeKind: 'settings' }, '', '/settings');
    expect(navigateAppRoute({ kind: 'settings' }, { history: undefined })).toBe(false);
    expect(
      navigateAppRoute(
        { kind: 'settings' },
        {
          history: {
            pushState: () => {
              throw new Error('history unavailable');
            }
          }
        }
      )
    ).toBe(false);
  });
});
