import { describe, expect, test, vi } from 'vitest';

import {
  KODI_WEBINTERFACE_BASE_PATH,
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
    expect(parseAppRoute('/addons')).toEqual({ kind: 'addons' });
    expect(parseAppRoute('/addons', '?m005-browser-proof=1')).toEqual({ kind: 'addons' });
    expect(parseAppRoute('/lab/shortcuts')).toEqual({ kind: 'labShortcuts' });
    expect(parseAppRoute('/lab/api-browser')).toEqual({ kind: 'labApiBrowser' });
    expect(parseAppRoute('/now-playing')).toEqual({ kind: 'nowPlaying' });
    expect(parseAppRoute('/now-playing', '?theme=light&username=admin')).toEqual({
      kind: 'nowPlaying'
    });
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

  test('parses safe add-on detail routes with dotted ids', () => {
    expect(parseAppRoute('/addons/plugin.video.youtube')).toEqual({
      kind: 'addonDetail',
      addonid: 'plugin.video.youtube'
    });
    expect(parseAppRoute('/addons/script.module.safe-demo_1')).toEqual({
      kind: 'addonDetail',
      addonid: 'script.module.safe-demo_1'
    });
    expect(parseAppRoute('/addons/plugin.video.safe-demo', '?m005-browser-proof=1')).toEqual({
      kind: 'addonDetail',
      addonid: 'plugin.video.safe-demo'
    });
  });

  test('sanitizes unsafe add-ons subpaths and labels', () => {
    const unsafeInputs = [
      '/addons/plugin.video.youtube/extra',
      '/addons/plugin.video.youtube%2Fextra',
      '/addons/http:example',
      '/addons/https:example',
      '/addons/file:example',
      '/addons/user:pass@host',
      '/addons/Authorization',
      '/addons/Basic',
      '/addons/localStorage',
      '/addons/sessionStorage',
      '/addons/CHORUS3_SENTINEL_SECRET'
    ];

    for (const input of unsafeInputs) {
      const route = parseAppRoute(input, '?token=Basic');

      expect(route.kind).toBe('addonsUnknown');
      expect(JSON.stringify(route)).not.toMatch(
        /Authorization|Basic|user:pass@host|CHORUS3_SENTINEL_SECRET|localStorage|sessionStorage|token=|http:|https:|file:/i
      );
      expect(route).toEqual({ kind: 'addonsUnknown', pathLabel: '/addons/[redacted]' });
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

  test('redacts unsafe now-playing subpaths without letting query identity change the route', () => {
    const unsafeInputs = [
      '/now-playing/Authorization/Basic',
      '/now-playing/admin:p@ssword',
      '/now-playing/CHORUS3_SENTINEL_SECRET',
      '/now-playing/https://host.example/path',
      '/now-playing/user:pass@host'
    ];

    for (const input of unsafeInputs) {
      const route = parseAppRoute(input, '?password=CHORUS3_SENTINEL_SECRET&theme=light');

      expect(route.kind).toBe('settingsUnknown');
      expect(JSON.stringify(route)).not.toMatch(
        /Authorization|Basic|admin:p@ssword|CHORUS3_SENTINEL_SECRET|password=|theme=|https:|user:pass@host/i
      );
      expect(route).toEqual({ kind: 'settingsUnknown', pathLabel: '/now-playing/[redacted]' });
    }
  });

  test('redacts unsafe unknown lab route labels without throwing', () => {
    const unsafeInputs = [
      '/lab/Authorization:Basic',
      '/lab/admin:p@ssword',
      '/lab/localStorage',
      '/lab/%E0%A4%A',
      '/lab/smb://nas/private',
      '/lab/CHORUS3_SENTINEL_SECRET'
    ];

    for (const input of unsafeInputs) {
      const route = parseAppRoute(input, '?token=Basic');

      expect(route.kind).toBe('labUnknown');
      expect(JSON.stringify(route)).not.toMatch(
        /Authorization|Basic|admin:p@ssword|localStorage|CHORUS3_SENTINEL_SECRET|token=|smb:/i
      );
      expect(route).toEqual({ kind: 'labUnknown', pathLabel: '/lab/[redacted]' });
    }
  });

  test('keeps package mount paths as add-on details unless package-base parsing is requested', () => {
    expect(parseAppRoute('/addons/webinterface.chorus3')).toEqual({
      kind: 'addonDetail',
      addonid: 'webinterface.chorus3'
    });

    expect(
      parseAppRoute('/addons/webinterface.chorus3', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'dashboard' });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'dashboard' });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/now-playing', '?theme=light', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'nowPlaying' });
  });

  test('normalizes malformed package-mounted inputs without leaking unsafe labels', () => {
    expect(
      parseAppRoute('/addons//webinterface.chorus3//now-playing//', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'nowPlaying' });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/%2FAuthorization/Basic', '?token=Basic', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'settingsUnknown', pathLabel: '/[redacted]/[redacted]' });
    expect(
      parseAppRoute({ raw: '/addons/webinterface.chorus3' }, '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'settingsUnknown', pathLabel: '/[redacted]' });
  });
});

describe('buildAppRoute', () => {
  test.each<[AppRoute, string]>([
    [{ kind: 'dashboard' }, '/'],
    [{ kind: 'settings' }, '/settings'],
    [{ kind: 'nowPlaying' }, '/now-playing'],
    [{ kind: 'labShortcuts' }, '/lab/shortcuts'],
    [{ kind: 'labApiBrowser' }, '/lab/api-browser'],
    [{ kind: 'labUnknown', pathLabel: '/lab/Authorization/Basic' }, '/lab/[redacted]/[redacted]'],
    [{ kind: 'addons' }, '/addons'],
    [{ kind: 'addonDetail', addonid: 'plugin.video.youtube' }, '/addons/plugin.video.youtube'],
    [
      { kind: 'addonDetail', addonid: 'script.module.safe-demo_1' },
      '/addons/script.module.safe-demo_1'
    ],
    [
      { kind: 'addonsUnknown', pathLabel: '/addons/Authorization/Basic' },
      '/addons/[redacted]/[redacted]'
    ],
    [
      { kind: 'settingsUnknown', pathLabel: '/settings/Authorization/Basic' },
      '/settings/[redacted]/[redacted]'
    ],
    [{ kind: 'video', route: { kind: 'videoMovies' } }, '/video/movies'],
    [{ kind: 'video', route: { kind: 'videoMovieDetail', movieid: 4401 } }, '/video/movies/4401']
  ])('builds %j as %s', (route, expectedPath) => {
    expect(buildAppRoute(route)).toBe(expectedPath);
  });

  test('prefixes built routes when a package base is provided', () => {
    expect(
      buildAppRoute({ kind: 'dashboard' }, { packageBasePath: KODI_WEBINTERFACE_BASE_PATH })
    ).toBe('/addons/webinterface.chorus3');
    expect(
      buildAppRoute({ kind: 'nowPlaying' }, { packageBasePath: KODI_WEBINTERFACE_BASE_PATH })
    ).toBe('/addons/webinterface.chorus3/now-playing');
    expect(
      buildAppRoute(
        { kind: 'addonDetail', addonid: 'plugin.video.youtube' },
        { packageBasePath: KODI_WEBINTERFACE_BASE_PATH }
      )
    ).toBe('/addons/webinterface.chorus3/addons/plugin.video.youtube');
    expect(
      buildAppRoute({ kind: 'nowPlaying' }, { packageBasePath: '/addons/webinterface.chorus3/' })
    ).toBe('/addons/webinterface.chorus3/now-playing');
  });

  test('falls back safely for malformed routes', () => {
    expect(buildAppRoute({ kind: 'unexpected' } as unknown as AppRoute)).toBe('/');
    expect(buildAppRoute({ kind: 'video', route: { kind: 'videoMovieDetail', movieid: 0 } })).toBe(
      '/video/unknown'
    );
    expect(buildAppRoute({ kind: 'addonDetail', addonid: 'http:example' })).toBe(
      '/addons/[redacted]'
    );
    expect(buildAppRoute({ kind: 'addonDetail', addonid: 'plugin.video.youtube/extra' })).toBe(
      '/addons/[redacted]'
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
