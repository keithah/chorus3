import { describe, expect, test, vi } from 'vitest';

import {
  KODI_WEBINTERFACE_BASE_PATH,
  buildAppRoute,
  buildPrimaryAppRoute,
  getParityPlaceholderMetadata,
  getParityPlaceholderMetadataTable,
  isDelegatedVideoRoute,
  navigateAppRoute,
  parseAppRoute,
  resolveKodiWebinterfacePackageBasePath,
  unwrapVideoRoute,
  type AppRoute
} from './appRouter';
import { getChorus2ParityRowById } from './chorus2ParityLedger';
import { buildVideoRoute, type VideoRoute } from '../video/videoRouter';
import type { PrimaryRoute } from './primaryRoutes';

const EXPECTED_PLACEHOLDER_IDS = [] as const;

describe('chorus2 placeholder metadata', () => {
  test('exports only curated placeholder metadata with valid ledger references', () => {
    const metadata = getParityPlaceholderMetadataTable();

    expect(metadata.map((placeholder) => placeholder.id).sort()).toEqual(
      [...EXPECTED_PLACEHOLDER_IDS].sort()
    );

    for (const placeholder of metadata) {
      expect(placeholder.surface).toEqual(expect.any(String));
      expect(placeholder.status).toMatch(/^(missing|deferred|intentionallyChanged)$/u);
      expect(placeholder.owner).toMatch(/^(M006\/S0[2-4]|R0\d+\/M006\/S0[4-5])$/u);
      expect(placeholder.recoveryRoute).toMatch(/^\//u);

      for (const ledgerId of placeholder.ledgerIds) {
        const row = getChorus2ParityRowById(ledgerId);

        expect(row, ledgerId).toBeDefined();
        expect(row?.owner, ledgerId).toBe(placeholder.owner);
      }
    }

    expect(getParityPlaceholderMetadata('missing-id')).toBeUndefined();
  });
});

const PRIMARY_ROUTE_CASES = [
  ['/', { kind: 'home' }],
  ['/home', { kind: 'home' }],
  ['/music', { kind: 'music' }],
  ['/music/top', { kind: 'musicTop' }],
  ['/artists', { kind: 'musicArtists' }],
  ['/music/artists', { kind: 'musicArtists' }],
  ['/albums', { kind: 'musicAlbums' }],
  ['/music/albums', { kind: 'musicAlbums' }],
  ['/genres', { kind: 'musicGenres' }],
  ['/music/genres', { kind: 'musicGenres' }],
  ['/music/videos', { kind: 'musicVideos' }],
  ['/music/album/abc', { kind: 'musicAlbumDetail', albumid: 'abc' }],
  ['/music/artist/abc', { kind: 'musicArtistDetail', artistid: 'abc' }],
  ['/music/genre/recent', { kind: 'musicGenreDetail', genreid: 'recent' }],
  ['/movies/recent', { kind: 'moviesRecent' }],
  ['/movies', { kind: 'movies' }],
  ['/movie/abc', { kind: 'movieDetail', movieid: 'abc' }],
  ['/tvshows/recent', { kind: 'tvshowsRecent' }],
  ['/tvshows', { kind: 'tvshows' }],
  ['/tvshow/series', { kind: 'tvshowDetail', tvshowid: 'series' }],
  ['/tvshow/series/1', { kind: 'tvshowSeasonDetail', tvshowid: 'series', season: '1' }],
  [
    '/tvshow/series/1/2',
    { kind: 'tvshowEpisodeDetail', tvshowid: 'series', season: '1', episodeid: '2' }
  ],
  ['/browser', { kind: 'browser' }],
  ['/files', { kind: 'browser' }],
  ['/browser/music', { kind: 'browserItem', media: 'music', itemid: 'root' }],
  ['/browser/video', { kind: 'browserItem', media: 'video', itemid: 'root' }],
  ['/browser/video/source%3A1', { kind: 'browserItem', media: 'video', itemid: 'source:1' }],
  ['/browser/music/root', { kind: 'browserItem', media: 'music', itemid: 'root' }],
  ['/addons', { kind: 'addonsAll' }],
  ['/addons/all', { kind: 'addonsAll' }],
  ['/addons/video', { kind: 'addonsVideo' }],
  ['/addons/audio', { kind: 'addonsAudio' }],
  ['/addons/executable', { kind: 'addonsExecutable' }],
  ['/addons/plugin.video.safe-demo', { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' }],
  ['/addon/execute/plugin.video.demo', { kind: 'addonExecute', addonid: 'plugin.video.demo' }],
  ['/playlist', { kind: 'currentPlaylist' }],
  ['/playlists', { kind: 'playlists' }],
  ['/playlist/local', { kind: 'playlistDetail', playlistid: 'local' }],
  ['/settings', { kind: 'settingsWeb' }],
  ['/settings/web', { kind: 'settingsWeb' }],
  ['/settings/web-interface', { kind: 'settingsWeb' }],
  ['/settings/kodi', { kind: 'settingsKodi' }],
  ['/settings/kodi/library', { kind: 'settingsKodiSection', section: 'library' }],
  ['/settings/addons', { kind: 'settingsAddons' }],
  ['/settings/nav', { kind: 'settingsNav' }],
  ['/settings/main-menu', { kind: 'settingsNav' }],
  ['/settings/search', { kind: 'settingsSearch' }],
  ['/help', { kind: 'help' }],
  ['/help/overview', { kind: 'helpOverview' }],
  ['/help/keyboard', { kind: 'helpPage', pageid: 'keyboard' }],
  ['/remote', { kind: 'remote' }],
  ['/search', { kind: 'search' }],
  ['/search/music/query', { kind: 'searchMedia', media: 'music', query: 'query' }],
  ['/search/all/blue%20scholars', { kind: 'searchMedia', media: 'all', query: 'blue scholars' }],
  ['/lab', { kind: 'lab' }],
  ['/lab/api-browser', { kind: 'labApiBrowser' }],
  ['/lab/api-browser/JSONRPC.Ping', { kind: 'labApiBrowserMethod', method: 'JSONRPC.Ping' }],
  ['/lab/screenshot', { kind: 'labScreenshot' }],
  ['/lab/icon-browser', { kind: 'labIconBrowser' }],
  ['/thumbsup', { kind: 'thumbsup' }],
  ['/pvr', { kind: 'pvrTv' }],
  ['/pvr/tv', { kind: 'pvrTv' }],
  ['/pvr/tv/42', { kind: 'pvrTvChannel', channelid: '42' }],
  ['/pvr/radio', { kind: 'pvrRadio' }],
  ['/pvr/radio/99', { kind: 'pvrRadioChannel', channelid: '99' }],
  ['/pvr/recordings', { kind: 'pvrRecordings' }]
] as const;

const PRIMARY_ROUTE_CANONICAL_PATHS = new Map<PrimaryRoute['kind'], string>([
  ['musicArtists', '/music/artists'],
  ['musicAlbums', '/music/albums'],
  ['musicGenres', '/music/genres'],
  ['browser', '/browser'],
  ['addonsAll', '/addons/all'],
  ['settingsWeb', '/settings/web'],
  ['settingsNav', '/settings/nav'],
  ['pvrTv', '/pvr/tv']
]);

function expectedPrimaryCanonicalPath(
  path: string,
  route: (typeof PRIMARY_ROUTE_CASES)[number][1]
): string {
  if (route.kind === 'browserItem' && route.itemid === 'root') {
    return `/browser/${route.media}`;
  }

  return route.kind === 'home' ? '/' : (PRIMARY_ROUTE_CANONICAL_PATHS.get(route.kind) ?? path);
}

describe('parseAppRoute', () => {
  test.each(PRIMARY_ROUTE_CASES)(
    'parses primary route %s to an explicit typed identity',
    (path, route) => {
      expect(parseAppRoute(path, '?token=secret')).toEqual({ kind: 'primary', route });
      expect(
        parseAppRoute(
          `${KODI_WEBINTERFACE_BASE_PATH}${path === '/' ? '' : path}`,
          '?token=secret',
          {
            packageBasePath: KODI_WEBINTERFACE_BASE_PATH
          }
        )
      ).toEqual({ kind: 'primary', route });
    }
  );

  test.each(PRIMARY_ROUTE_CASES)(
    'builds canonical primary route for parsed route %s with and without package base',
    (path, route) => {
      const canonicalPath = expectedPrimaryCanonicalPath(path, route);

      expect(buildPrimaryAppRoute(route)).toBe(canonicalPath);
      expect(buildAppRoute({ kind: 'primary', route })).toBe(canonicalPath);
      expect(
        buildPrimaryAppRoute(route, { packageBasePath: `${KODI_WEBINTERFACE_BASE_PATH}/` })
      ).toBe(`${KODI_WEBINTERFACE_BASE_PATH}${canonicalPath === '/' ? '' : canonicalPath}`);
    }
  );

  test('builds hash routes for package shells without static-server path traversal', () => {
    expect(buildPrimaryAppRoute({ kind: 'music' }, { routeMode: 'hash' })).toBe('#music');
    expect(buildPrimaryAppRoute({ kind: 'musicGenres' }, { routeMode: 'hash' })).toBe(
      '#music/genres'
    );
    expect(buildPrimaryAppRoute({ kind: 'moviesRecent' }, { routeMode: 'hash' })).toBe(
      '#movies/recent'
    );
    expect(buildPrimaryAppRoute({ kind: 'browser' }, { routeMode: 'hash' })).toBe('#browser');
    expect(buildPrimaryAppRoute({ kind: 'home' }, { routeMode: 'hash' })).toBe('#home');
    expect(
      buildPrimaryAppRoute(
        { kind: 'music' },
        { packageBasePath: KODI_WEBINTERFACE_BASE_PATH, routeMode: 'hash' }
      )
    ).toBe(`${KODI_WEBINTERFACE_BASE_PATH}#music`);
    expect(
      buildAppRoute(
        { kind: 'primary', route: { kind: 'musicGenres' } },
        { packageBasePath: KODI_WEBINTERFACE_BASE_PATH, routeMode: 'hash' }
      )
    ).toBe(`${KODI_WEBINTERFACE_BASE_PATH}#music/genres`);
    expect(
      buildPrimaryAppRoute(
        { kind: 'searchMedia', media: 'all', query: 'blue scholars' },
        { routeMode: 'hash' }
      )
    ).toBe('#search/all/blue%20scholars');
    expect(buildAppRoute({ kind: 'primary', route: { kind: 'home' } }, { routeMode: 'hash' })).toBe(
      '#home'
    );
  });

  test('resolves Kodi package bases from canonical and filesystem-mounted paths', () => {
    expect(resolveKodiWebinterfacePackageBasePath('/addons/webinterface.chorus3/music')).toBe(
      '/addons/webinterface.chorus3'
    );
    expect(
      resolveKodiWebinterfacePackageBasePath(
        '/Users/keith/Library/Application%20Support/Kodi/addons/webinterface.chorus3/music'
      )
    ).toBe('/Users/keith/Library/Application%20Support/Kodi/addons/webinterface.chorus3');
    expect(resolveKodiWebinterfacePackageBasePath('/addons/webinterface.chorus3evil/music')).toBe(
      ''
    );
  });

  test('accepts classic browser hash paths without reflecting local filesystem segments', () => {
    expect(parseAppRoute('/browser/music/%2FUsers%2Fkeith%2FMusic%2FMusic')).toEqual({
      kind: 'primary',
      route: { kind: 'browserItem', media: 'music', itemid: '/Users/keith/Music/Music' }
    });
  });

  test('routes legacy primary aliases before settings and add-ons fallbacks', () => {
    expect(parseAppRoute('/addons')).toEqual({ kind: 'primary', route: { kind: 'addonsAll' } });
    expect(parseAppRoute('/settings')).toEqual({ kind: 'primary', route: { kind: 'settingsWeb' } });
    expect(parseAppRoute('/settings/web-interface')).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
    expect(parseAppRoute('/settings/main-menu')).toEqual({
      kind: 'primary',
      route: { kind: 'settingsNav' }
    });
    expect(parseAppRoute('/music/videos')).toEqual({
      kind: 'primary',
      route: { kind: 'musicVideos' }
    });
    expect(parseAppRoute('/music/video/77')).toEqual({
      kind: 'primary',
      route: { kind: 'musicVideoDetail', musicvideoid: '77' }
    });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/settings/main-menu', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'settingsNav' } });

    expect(buildPrimaryAppRoute({ kind: 'addonsAll' })).toBe('/addons/all');
    expect(buildPrimaryAppRoute({ kind: 'settingsWeb' })).toBe('/settings/web');
    expect(buildPrimaryAppRoute({ kind: 'settingsNav' })).toBe('/settings/nav');
    expect(buildPrimaryAppRoute({ kind: 'musicVideos' })).toBe('/music/videos');
    expect(buildPrimaryAppRoute({ kind: 'musicVideoDetail', musicvideoid: '77' })).toBe(
      '/music/video/77'
    );
  });

  test('rejects unsafe dynamic primary route segments without leaking sensitive payloads', () => {
    const unsafeInputs = [
      '/music/album/a%2Fb',
      '/music/artist/Authorization',
      '/music/genre/token',
      '/music/video/smb://nas/private',
      '/movie/password',
      '/tvshow/smb://nas/private',
      '/browser/music/secret',
      '/addons/plugin.video.youtube%2Fextra',
      '/addon/execute/plugin.video.youtube%2Fextra',
      '/settings/kodi/admin:p@ssword',
      '/help/special://profile/passwords',
      `/playlist/${'x'.repeat(129)}`
    ];

    for (const input of unsafeInputs) {
      const route = parseAppRoute(input, '?Authorization=Basic&password=CHORUS3_SENTINEL_SECRET');
      const serialized = JSON.stringify(route);

      expect(() => parseAppRoute(input)).not.toThrow();
      expect(serialized).not.toMatch(
        /Authorization|Basic|token|password|CHORUS3_SENTINEL_SECRET|smb:\/\/|special:\/\/|admin:p@ssword|youtube%2Fextra|xxxxxxxxxxxxxxxx/i
      );
      if (route.kind === 'primary') {
        expect(route.route.kind).not.toMatch(/Detail|Execute|Media|Item|Section/u);
      }
    }
  });

  test('handles malformed and unsupported primary route inputs without throwing or leaking secrets', () => {
    const unsafeInputs = [
      '/music/album/%E0%A4%A',
      '/movie/',
      `/movie/${'a'.repeat(129)}`,
      '/tvshow/series/%20/2',
      '/browser/music/smb://nas/passwords',
      '/addons/user:pass@host',
      '/addon/execute/user:pass@host',
      '/search/music/token',
      '/addons/webinterface.chorus3/unsupported/admin:p@ssword'
    ];

    for (const input of unsafeInputs) {
      expect(() =>
        parseAppRoute(input, '?token=secret&password=CHORUS3_SENTINEL_SECRET', {
          packageBasePath: KODI_WEBINTERFACE_BASE_PATH
        })
      ).not.toThrow();
      const route = parseAppRoute(input, '?token=secret&password=CHORUS3_SENTINEL_SECRET', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      });
      const serialized = JSON.stringify(route);

      expect(serialized).not.toMatch(
        /user:pass|token=|password=|secret|CHORUS3_SENTINEL_SECRET|smb:\/\/|admin:p@ssword|aaaaaaaaaaaaaaaa/i
      );
      if (route.kind === 'primary') {
        expect(route.route.kind).not.toMatch(/Detail|Execute|Media|Item/u);
      }
    }
  });

  test('keeps Chorus3 video aliases delegated to the video router', () => {
    expect(parseAppRoute('/video/movies')).toEqual({
      kind: 'primary',
      route: { kind: 'movies' }
    });
    expect(parseAppRoute('/video/tv')).toEqual({
      kind: 'primary',
      route: { kind: 'tvshows' }
    });
    expect(parseAppRoute('/video/movies/4401')).toEqual({
      kind: 'video',
      route: { kind: 'videoMovieDetail', movieid: 4401 }
    });
    expect(parseAppRoute('/video/tv/5501/seasons/1/episodes/6601')).toEqual({
      kind: 'video',
      route: { kind: 'videoEpisodeDetail', tvshowid: 5501, season: 1, episodeid: 6601 }
    });
  });

  test('parses dashboard and settings routes without using query identity', () => {
    expect(parseAppRoute('/')).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(parseAppRoute('', '?m005-browser-proof=1')).toEqual({
      kind: 'primary',
      route: { kind: 'home' }
    });
    expect(parseAppRoute('/settings')).toEqual({ kind: 'primary', route: { kind: 'settingsWeb' } });
    expect(parseAppRoute('/settings', '?m005-browser-proof=1')).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
    expect(parseAppRoute('/addons')).toEqual({ kind: 'primary', route: { kind: 'addonsAll' } });
    expect(parseAppRoute('/addons', '?m005-browser-proof=1')).toEqual({
      kind: 'primary',
      route: { kind: 'addonsAll' }
    });
    expect(parseAppRoute('/lab/shortcuts')).toEqual({
      kind: 'labUnknown',
      pathLabel: '/lab/shortcuts'
    });
    expect(parseAppRoute('/lab/api-browser')).toEqual({
      kind: 'primary',
      route: { kind: 'labApiBrowser' }
    });
    expect(parseAppRoute('/now-playing')).toEqual({ kind: 'nowPlaying' });
    expect(parseAppRoute('/now-playing', '?theme=light&username=admin')).toEqual({
      kind: 'nowPlaying'
    });
  });

  test('delegates video routes to the video router with parity', () => {
    const videoRoutes: VideoRoute[] = [
      { kind: 'videoMovieDetail', movieid: 4401 },
      { kind: 'videoMovieStream', movieid: 4401 },
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

  test.each([
    ['/movies/recent', { kind: 'moviesRecent' }],
    ['/tvshows/recent', { kind: 'tvshowsRecent' }],
    ['/movie/4401', { kind: 'movieDetail', movieid: '4401' }],
    ['/tvshow/5501', { kind: 'tvshowDetail', tvshowid: '5501' }],
    ['/tvshow/5501/1', { kind: 'tvshowSeasonDetail', tvshowid: '5501', season: '1' }],
    [
      '/tvshow/5501/1/6601',
      { kind: 'tvshowEpisodeDetail', tvshowid: '5501', season: '1', episodeid: '6601' }
    ]
  ] as const)(
    'parses reference-compatible video route %s as primary route identity',
    (path, route) => {
      expect(parseAppRoute(path, '?Authorization=Basic&ignored=1')).toEqual({
        kind: 'primary',
        route
      });
    }
  );

  test('parses package-mounted reference-compatible video routes to the same primary identity', () => {
    expect(
      parseAppRoute('/addons/webinterface.chorus3/movie/4401', '?token=secret', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'movieDetail', movieid: '4401' } });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/tvshow/5501/1/6601', '?token=secret', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({
      kind: 'primary',
      route: { kind: 'tvshowEpisodeDetail', tvshowid: '5501', season: '1', episodeid: '6601' }
    });
  });

  test('rejects malformed classic video aliases without leaking raw path or query payloads', () => {
    const unsafeCases = [
      `/movie/${'a'.repeat(129)}`,
      '/movie/4401/stream',
      '/movie/4401%2Fstream',
      '/tvshow/5501/%20',
      '/tvshow/5501%2F1',
      '/movie/Authorization',
      '/movie/admin:p@ssword'
    ];

    for (const path of unsafeCases) {
      expect(() => parseAppRoute(path, '?token=secret&Authorization=Basic')).not.toThrow();
      const route = parseAppRoute(path, '?token=secret&Authorization=Basic');
      const serialized = JSON.stringify(route);

      expect(route.kind).not.toBe('video');
      expect(serialized).not.toMatch(
        /Authorization|Basic|admin:p@ssword|token=|secret|aaaaaaaaaaaaaaaa|4401%2Fstream|5501%2F1/i
      );
    }
  });

  test('parses curated classic URLs to implemented routes or safe placeholders', () => {
    expect(parseAppRoute('/movies')).toEqual({ kind: 'primary', route: { kind: 'movies' } });
    expect(parseAppRoute('/tvshows')).toEqual({ kind: 'primary', route: { kind: 'tvshows' } });
    expect(parseAppRoute('/remote', '?endpoint=http://user:pass@example/jsonrpc')).toEqual({
      kind: 'primary',
      route: { kind: 'remote' }
    });
    expect(parseAppRoute('/search/video/star wars')).toEqual({
      kind: 'primary',
      route: { kind: 'searchMedia', media: 'video', query: 'star wars' }
    });
    expect(parseAppRoute('/localPlaylist')).toEqual({
      kind: 'primary',
      route: { kind: 'playlists' }
    });
    expect(parseAppRoute('/browser/music/%2Fstorage')).toEqual({
      kind: 'primary',
      route: { kind: 'browserItem', media: 'music', itemid: '/storage' }
    });

    expect(parseAppRoute('/pvr')).toEqual({
      kind: 'primary',
      route: { kind: 'pvrTv' }
    });

    expect(parseAppRoute('/lab')).toEqual({ kind: 'primary', route: { kind: 'lab' } });
    expect(parseAppRoute('/lab/screenshot')).toEqual({
      kind: 'primary',
      route: { kind: 'labScreenshot' }
    });
    expect(parseAppRoute('/lab/icon-browser')).toEqual({
      kind: 'primary',
      route: { kind: 'labIconBrowser' }
    });
    expect(parseAppRoute('/lab/api-browser/JSONRPC.Ping')).toEqual({
      kind: 'primary',
      route: { kind: 'labApiBrowserMethod', method: 'JSONRPC.Ping' }
    });
  });

  test('parses package-mounted classic URLs to implemented routes or the same placeholder identities', () => {
    expect(
      parseAppRoute('/addons/webinterface.chorus3/remote', '?Authorization=Basic', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'remote' } });
    expect(
      buildAppRoute({ kind: 'remote' }, { packageBasePath: KODI_WEBINTERFACE_BASE_PATH })
    ).toBe('/addons/webinterface.chorus3/remote');

    const mountedLabScreenshot = parseAppRoute(
      '/addons/webinterface.chorus3/lab/screenshot',
      '?Authorization=Basic',
      { packageBasePath: KODI_WEBINTERFACE_BASE_PATH }
    );

    expect(mountedLabScreenshot).toEqual({
      kind: 'primary',
      route: { kind: 'labScreenshot' }
    });
    expect(
      buildAppRoute(mountedLabScreenshot, { packageBasePath: KODI_WEBINTERFACE_BASE_PATH })
    ).toBe('/addons/webinterface.chorus3/lab/screenshot');
  });

  test('redacts unsafe classic placeholder route input instead of serializing raw path or query data', () => {
    const unsafeCases = [
      '/lab/api-browser/smb://nas/private',
      '/lab/api-browser/special://profile/passwords',
      '/lab/api-browser/{"method":"JSONRPC.Ping"}'
    ] as const;

    for (const path of unsafeCases) {
      const route = parseAppRoute(path, '?Authorization=Basic&body={"password":"secret"}');
      const serialized = JSON.stringify(route);

      expect(route).toEqual({ kind: 'labUnknown', pathLabel: '/lab/[redacted]' });
      expect(serialized).not.toMatch(
        /Authorization|Basic|user:pass@host|localStorage|sessionStorage|smb:\/\/|special:\/\/|jsonrpc|Input\.SendText|password|secret|body=/i
      );
    }
  });

  test('redacts malformed add-on execute route input without using the implemented action route', () => {
    for (const path of [
      '/addon/execute/user:pass@host',
      '/addon/execute/smb://nas/private',
      '/addon/execute/special://profile/passwords'
    ]) {
      const route = parseAppRoute(path, '?Authorization=Basic&body={"password":"secret"}');
      const serialized = JSON.stringify(route);

      expect(route.kind).toBe('settingsUnknown');
      if (route.kind !== 'settingsUnknown') {
        throw new Error('Expected malformed add-on execute path to become settingsUnknown');
      }
      expect(route.pathLabel).toContain('/addon/execute/[redacted]');
      expect(serialized).not.toMatch(
        /Authorization|Basic|user:pass@host|smb:\/\/|special:\/\/|password|secret|body=/i
      );
    }
  });

  test('normalizes malformed classic route inputs without leaking unsafe placeholder data', () => {
    expect(parseAppRoute('/movies?first=true')).toEqual(parseAppRoute('/movies?second=true'));
    expect(parseAppRoute('/movies', '?first=true')).toEqual(
      parseAppRoute('/movies', '?second=true')
    );
    expect(parseAppRoute('//movies///recent//')).toEqual(parseAppRoute('/movies/recent'));
    expect(parseAppRoute('/search/video/star%2Fwars')).toEqual({
      kind: 'settingsUnknown',
      pathLabel: '/search/video/[redacted]'
    });
    expect(
      parseAppRoute('/addons/webinterface.chorus3%2Fremote', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'addonsUnknown', pathLabel: '/addons/[redacted]' });
  });

  test('parses safe add-on detail routes as primary routes with dotted ids', () => {
    expect(parseAppRoute('/addons/plugin.video.youtube')).toEqual({
      kind: 'primary',
      route: { kind: 'addonDetail', addonid: 'plugin.video.youtube' }
    });
    expect(parseAppRoute('/addons/script.module.safe-demo_1')).toEqual({
      kind: 'primary',
      route: { kind: 'addonDetail', addonid: 'script.module.safe-demo_1' }
    });
    expect(parseAppRoute('/addons/plugin.video.safe-demo', '?m005-browser-proof=1')).toEqual({
      kind: 'primary',
      route: { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' }
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
    expect(parseAppRoute(null)).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(parseAppRoute(undefined)).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(parseAppRoute({ raw: '/settings' })).toEqual({
      kind: 'settingsUnknown',
      pathLabel: '/[redacted]'
    });
    expect(parseAppRoute('')).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(parseAppRoute('?m005-browser-proof=1')).toEqual({
      kind: 'primary',
      route: { kind: 'home' }
    });
    expect(parseAppRoute('//settings//')).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
    expect(parseAppRoute('/settings/')).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
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
      kind: 'primary',
      route: { kind: 'addonDetail', addonid: 'webinterface.chorus3' }
    });

    expect(
      parseAppRoute('/addons/webinterface.chorus3', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/now-playing', '?theme=light', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'nowPlaying' });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/lab/index.html', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'lab' } });
    expect(
      parseAppRoute('/addons/webinterface.chorus3/lab/api-browser/index.html', '', {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      })
    ).toEqual({ kind: 'primary', route: { kind: 'labApiBrowser' } });
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
    [{ kind: 'remote' }, '/remote'],
    [{ kind: 'nowPlaying' }, '/now-playing'],
    [{ kind: 'labUnknown', pathLabel: '/lab/Authorization/Basic' }, '/lab/[redacted]/[redacted]'],
    [{ kind: 'addons' }, '/addons'],
    [
      { kind: 'primary', route: { kind: 'addonDetail', addonid: 'plugin.video.youtube' } },
      '/addons/plugin.video.youtube'
    ],
    [
      { kind: 'primary', route: { kind: 'addonDetail', addonid: 'script.module.safe-demo_1' } },
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
    [{ kind: 'video', route: { kind: 'videoMovieDetail', movieid: 4401 } }, '/video/movies/4401'],
    [{ kind: 'labUnknown', pathLabel: '/lab' }, '/lab'],
    [{ kind: 'labUnknown', pathLabel: '/lab/screenshot' }, '/lab/screenshot'],
    [{ kind: 'labUnknown', pathLabel: '/lab/icon-browser' }, '/lab/icon-browser']
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
        { kind: 'primary', route: { kind: 'addonDetail', addonid: 'plugin.video.youtube' } },
        { packageBasePath: KODI_WEBINTERFACE_BASE_PATH }
      )
    ).toBe('/addons/webinterface.chorus3/addons/plugin.video.youtube');
    expect(
      buildAppRoute({ kind: 'remote' }, { packageBasePath: KODI_WEBINTERFACE_BASE_PATH })
    ).toBe('/addons/webinterface.chorus3/remote');
    expect(
      buildAppRoute({ kind: 'nowPlaying' }, { packageBasePath: '/addons/webinterface.chorus3/' })
    ).toBe('/addons/webinterface.chorus3/now-playing');
  });

  test('falls back safely for malformed routes', () => {
    expect(buildAppRoute({ kind: 'unexpected' } as unknown as AppRoute)).toBe('/');
    expect(buildAppRoute({ kind: 'video', route: { kind: 'videoMovieDetail', movieid: 0 } })).toBe(
      '/video/unknown'
    );
    expect(buildPrimaryAppRoute({ kind: 'addonDetail', addonid: 'http:example' })).toBe(
      '/[redacted]'
    );
    expect(
      buildPrimaryAppRoute({ kind: 'addonDetail', addonid: 'plugin.video.youtube/extra' })
    ).toBe('/[redacted]');
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
