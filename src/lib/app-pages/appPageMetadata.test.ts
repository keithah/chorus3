import { describe, expect, test } from 'vitest';

import { getAppPageLabel, getAppPageMetadata, type AppPageMetadata } from './appPageMetadata';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';

const S03_ROUTE_KIND_CASES = [
  ['home', { kind: 'home' }],
  ['music', { kind: 'music' }],
  ['musicTop', { kind: 'musicTop' }],
  ['musicArtists', { kind: 'musicArtists' }],
  ['musicAlbums', { kind: 'musicAlbums' }],
  ['musicGenres', { kind: 'musicGenres' }],
  ['musicVideos', { kind: 'musicVideos' }],
  ['musicVideoDetail', { kind: 'musicVideoDetail', musicvideoid: 'video-1' }],
  ['musicAlbumDetail', { kind: 'musicAlbumDetail', albumid: 'album-1' }],
  ['musicArtistDetail', { kind: 'musicArtistDetail', artistid: 'artist-1' }],
  ['musicGenreDetail', { kind: 'musicGenreDetail', genreid: 'genre-1' }],
  ['movies', { kind: 'movies' }],
  ['moviesRecent', { kind: 'moviesRecent' }],
  ['movieDetail', { kind: 'movieDetail', movieid: 'movie-1' }],
  ['tvshows', { kind: 'tvshows' }],
  ['tvshowsRecent', { kind: 'tvshowsRecent' }],
  ['tvshowDetail', { kind: 'tvshowDetail', tvshowid: 'show-1' }],
  ['tvshowSeasonDetail', { kind: 'tvshowSeasonDetail', tvshowid: 'show-1', season: '1' }],
  [
    'tvshowEpisodeDetail',
    { kind: 'tvshowEpisodeDetail', tvshowid: 'show-1', season: '1', episodeid: 'episode-1' }
  ],
  ['browser', { kind: 'browser' }],
  ['browserItem', { kind: 'browserItem', media: 'music', itemid: 'root' }],
  ['addonsAll', { kind: 'addonsAll' }],
  ['addonsVideo', { kind: 'addonsVideo' }],
  ['addonsAudio', { kind: 'addonsAudio' }],
  ['addonsExecutable', { kind: 'addonsExecutable' }],
  ['addonDetail', { kind: 'addonDetail', addonid: 'plugin.video.demo' }],
  ['addonExecute', { kind: 'addonExecute', addonid: 'plugin.video.demo' }],
  ['playlists', { kind: 'playlists' }],
  ['playlistDetail', { kind: 'playlistDetail', playlistid: 'local' }],
  ['settingsWeb', { kind: 'settingsWeb' }],
  ['settingsKodi', { kind: 'settingsKodi' }],
  ['settingsKodiSection', { kind: 'settingsKodiSection', section: 'interface' }],
  ['settingsAddons', { kind: 'settingsAddons' }],
  ['settingsNav', { kind: 'settingsNav' }],
  ['settingsSearch', { kind: 'settingsSearch' }],
  ['help', { kind: 'help' }],
  ['helpOverview', { kind: 'helpOverview' }],
  ['helpPage', { kind: 'helpPage', pageid: 'keybind-readme' }],
  ['remote', { kind: 'remote' }],
  ['search', { kind: 'search' }],
  ['searchMedia', { kind: 'searchMedia', media: 'music', query: 'bowie' }],
  ['thumbsup', { kind: 'thumbsup' }],
  ['pvrTv', { kind: 'pvrTv' }],
  ['pvrRadio', { kind: 'pvrRadio' }],
  ['pvrRecordings', { kind: 'pvrRecordings' }]
] as const satisfies readonly [PrimaryRoute['kind'], PrimaryRoute][];

const FORBIDDEN_LABEL_TEXT =
  /Authorization|Basic|token|password|CHORUS3_SENTINEL_SECRET|smb:\/\/|special:\/\/|user:pass|localStorage|sessionStorage|jsonrpc|Input\.SendText/i;

function expectSafeMetadata(kind: PrimaryRoute['kind'], metadata: AppPageMetadata) {
  expect(metadata.routeKind, kind).toBe(kind);
  expect(metadata.surfaceKind, kind).toMatch(
    /^(music|movies|tv|browser|addons|playlists|settings|help|remote|search|pvr|home)$/u
  );
  expect(metadata.status, kind).toMatch(/^(implemented|static|deferred)$/u);
  expect(metadata.heading, kind).toMatch(/\S/u);
  expect(metadata.stageLabel, kind).toMatch(/\S/u);
  expect(metadata.statusLabel, kind).toMatch(/\S/u);
  expect(JSON.stringify(metadata), kind).not.toMatch(FORBIDDEN_LABEL_TEXT);
}

describe('app page metadata', () => {
  test.each(S03_ROUTE_KIND_CASES)(
    'returns deterministic safe metadata for primary route kind %s',
    (kind, route) => {
      const first = getAppPageMetadata(route);
      const second = getAppPageMetadata(route);

      expect(first).toEqual(second);
      expectSafeMetadata(kind, first);
      expect(getAppPageLabel(route)).toBe(first.heading);
    }
  );

  test('classifies Browser/Files as an implemented browser surface with neutral copy', () => {
    expect(getAppPageMetadata({ kind: 'browser' })).toMatchObject({
      routeKind: 'browser',
      surfaceKind: 'browser',
      status: 'implemented',
      heading: 'Browser / Files',
      stageLabel: 'File browser'
    });
  });

  test('classifies add-on detail as a safe generic static add-on surface', () => {
    const metadata = getAppPageMetadata({
      kind: 'addonDetail',
      addonid: 'plugin.video.demo?token=CHORUS3_SENTINEL_SECRET'
    });

    expect(metadata).toMatchObject({
      routeKind: 'addonDetail',
      surfaceKind: 'addons',
      status: 'static',
      heading: 'Add-on details',
      stageLabel: 'Add-on catalog'
    });
    expect(JSON.stringify(metadata)).not.toMatch(FORBIDDEN_LABEL_TEXT);
  });

  test('classifies playlist routes as implemented local playlist surfaces', () => {
    expect(getAppPageMetadata({ kind: 'playlists' })).toMatchObject({
      routeKind: 'playlists',
      surfaceKind: 'playlists',
      status: 'implemented',
      heading: 'Playlists',
      stageLabel: 'Playlist library'
    });
    expect(
      getAppPageMetadata({ kind: 'playlistDetail', playlistid: 'playlist-local_jazz' })
    ).toMatchObject({
      routeKind: 'playlistDetail',
      surfaceKind: 'playlists',
      status: 'implemented',
      heading: 'Playlist details',
      stageLabel: 'Playlist library'
    });
    expect(getAppPageMetadata({ kind: 'playlists' }).description).toContain(
      'local browser playlists'
    );
    expect(
      getAppPageMetadata({ kind: 'playlistDetail', playlistid: 'playlist-local_jazz' })
        .deferredMessage
    ).toBe('');
  });

  test('classifies Kodi settings section routes as real settings surfaces with generic copy', () => {
    const metadata = getAppPageMetadata({
      kind: 'settingsKodiSection',
      section: 'interface?token=CHORUS3_SENTINEL_SECRET'
    });

    expect(metadata).toMatchObject({
      routeKind: 'settingsKodiSection',
      surfaceKind: 'settings',
      status: 'static',
      heading: 'Kodi settings section',
      stageLabel: 'Settings',
      statusLabel: 'Section route'
    });
    expect(metadata.deferredMessage).toBe('');
    expect(metadata.description).toContain('Select a known Kodi settings section');
    expect(JSON.stringify(metadata)).not.toMatch(FORBIDDEN_LABEL_TEXT);
  });

  test.each([
    ['overview', 'Help overview'],
    ['keybind-readme', 'Keyboard'],
    ['keyboard', 'Keyboard'],
    ['app-readme', 'Readme'],
    ['readme', 'Readme'],
    ['app-changelog', 'Changelog'],
    ['changelog', 'Changelog'],
    ['addons', 'Add-ons'],
    ['developers', 'Developers'],
    ['lang-readme', 'Translations'],
    ['translations', 'Translations'],
    ['license', 'License']
  ] as const)('classifies known help topic %s as a static help surface', (pageid, heading) => {
    const route =
      pageid === 'overview'
        ? ({ kind: 'helpOverview' } as const)
        : ({ kind: 'helpPage', pageid } as const);

    const metadata = getAppPageMetadata(route);

    expect(metadata).toMatchObject({
      surfaceKind: 'help',
      status: 'static',
      heading,
      stageLabel: 'Help',
      statusLabel: 'Static route'
    });
    expect(metadata.deferredMessage).toBe('');
    expect(metadata.description).toContain('static help');
    expect(JSON.stringify(metadata)).not.toMatch(FORBIDDEN_LABEL_TEXT);
  });

  test('keeps unknown safe help pages on the safe help surface without reflecting the raw id', () => {
    const metadata = getAppPageMetadata({ kind: 'helpPage', pageid: 'safe-custom-topic' });

    expect(metadata).toMatchObject({
      routeKind: 'helpPage',
      surfaceKind: 'help',
      status: 'implemented',
      heading: 'Help page',
      stageLabel: 'Help',
      statusLabel: 'Chorus2 help topic'
    });
    expect(metadata.description).toContain('safe static help fallback');
    expect(metadata.deferredMessage).toBe('');
    expect(JSON.stringify(metadata)).not.toContain('safe-custom-topic');
    expect(JSON.stringify(metadata)).not.toMatch(FORBIDDEN_LABEL_TEXT);
  });

  test('keeps dynamic and malformed route labels generic without leaking route payloads', () => {
    const unsafeRoutes = [
      { kind: 'browserItem', media: 'music', itemid: 'smb://nas/passwords' },
      { kind: 'addonDetail', addonid: 'plugin.video.demo?token=CHORUS3_SENTINEL_SECRET' },
      { kind: 'addonExecute', addonid: 'plugin.video.demo?token=CHORUS3_SENTINEL_SECRET' },
      { kind: 'settingsKodiSection', section: 'Authorization' },
      { kind: 'helpPage', pageid: 'localStorage' },
      { kind: 'searchMedia', media: 'video', query: '{"jsonrpc":"2.0","method":"Input.SendText"}' }
    ] as const satisfies readonly PrimaryRoute[];

    for (const route of unsafeRoutes) {
      const metadata = getAppPageMetadata(route);
      const serialized = JSON.stringify(metadata);

      expect(metadata.heading).not.toMatch(FORBIDDEN_LABEL_TEXT);
      expect(metadata.statusLabel).not.toMatch(FORBIDDEN_LABEL_TEXT);
      expect(serialized).not.toMatch(FORBIDDEN_LABEL_TEXT);
    }
  });
});
