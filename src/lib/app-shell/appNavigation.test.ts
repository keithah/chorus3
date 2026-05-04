import { describe, expect, test } from 'vitest';

import { KODI_WEBINTERFACE_BASE_PATH, parseAppRoute } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import { createAppNavigationItems } from './appNavigation';

function byId(id: string, activeRoute: PrimaryRoute = { kind: 'home' }) {
  const item = createAppNavigationItems({ activeRoute }).find((candidate) => candidate.id === id);
  expect(item, `navigation item ${id}`).toBeDefined();
  return item!;
}

function primaryRouteFromPath(path: string): PrimaryRoute {
  const route = parseAppRoute(path);

  expect(route.kind, path).toBe('primary');

  if (route.kind !== 'primary') {
    throw new Error(`Expected primary route for ${path}`);
  }

  return route.route;
}

describe('createAppNavigationItems', () => {
  test('exposes stable primary rail items with submenu groups and safe text', () => {
    const items = createAppNavigationItems({ activeRoute: { kind: 'home' } });

    expect(items.map((item) => item.id)).toEqual([
      'music',
      'movies',
      'tvshows',
      'browser',
      'addons',
      'remote',
      'playlists',
      'settings',
      'help'
    ]);

    for (const item of items) {
      expect(item.label, item.id).toMatch(/\S/u);
      expect(item.title, item.id).toMatch(/\S/u);
      expect(item.href, item.id).toMatch(/^\//u);
      expect(item.route.kind, item.id).toEqual(expect.any(String));
      expect(item.submenuGroups, item.id).toBeDefined();

      for (const group of item.submenuGroups ?? []) {
        expect(group.id, `${item.id} group id`).toMatch(/^[a-z0-9-]+$/u);
        expect(group.label, `${item.id}/${group.id} group label`).toMatch(/\S/u);
        for (const submenuItem of group.items) {
          expect(submenuItem.id, `${item.id}/${group.id} submenu id`).toMatch(/^[a-z0-9-]+$/u);
          expect(submenuItem.label, submenuItem.id).toMatch(/\S/u);
          expect(submenuItem.title, submenuItem.id).toMatch(/\S/u);
          expect(submenuItem.href, submenuItem.id).toMatch(/^\//u);
          expect(submenuItem.route.kind, submenuItem.id).toEqual(expect.any(String));
        }
      }
    }
  });

  test('builds all rail and submenu hrefs inside the package base without doubled slashes', () => {
    const items = createAppNavigationItems({
      packageBasePath: `${KODI_WEBINTERFACE_BASE_PATH}/`,
      activeRoute: { kind: 'settingsKodiSection', section: 'library' }
    });
    const allTargets = items.flatMap((item) => [
      { id: item.id, href: item.href },
      ...(item.submenuGroups ?? []).flatMap((group) =>
        group.items.map((submenuItem) => ({
          id: `${item.id}/${group.id}/${submenuItem.id}`,
          href: submenuItem.href
        }))
      )
    ]);

    expect(allTargets.length).toBeGreaterThan(items.length);
    for (const target of allTargets) {
      expect(target.href, target.id).toMatch(/^\/addons\/webinterface\.chorus3(?:\/|$)/u);
      expect(target.href, target.id).not.toMatch(/webinterface\.chorus3\/\//u);
    }
  });

  test('groups detail and alias routes under the expected active rail item', () => {
    const cases: readonly [PrimaryRoute, string][] = [
      [{ kind: 'home' }, 'music'],
      [{ kind: 'musicAlbumDetail', albumid: 'abc' }, 'music'],
      [{ kind: 'musicVideos' }, 'music'],
      [{ kind: 'movieDetail', movieid: '4401' }, 'movies'],
      [
        { kind: 'tvshowEpisodeDetail', tvshowid: '5501', season: '1', episodeid: '6601' },
        'tvshows'
      ],
      [{ kind: 'addonDetail', addonid: 'plugin.video.demo' }, 'addons'],
      [{ kind: 'addonExecute', addonid: 'plugin.video.demo' }, 'addons'],
      [{ kind: 'settingsKodiSection', section: 'library' }, 'settings'],
      [{ kind: 'helpPage', pageid: 'keyboard' }, 'help'],
      [{ kind: 'playlistDetail', playlistid: 'local' }, 'playlists'],
      [{ kind: 'browserItem', media: 'music', itemid: 'root' }, 'browser'],
      [primaryRouteFromPath('/files'), 'browser']
    ];

    for (const [route, expectedActiveId] of cases) {
      const activeItems = createAppNavigationItems({ activeRoute: route }).filter(
        (item) => item.isActive
      );

      expect(
        activeItems.map((item) => item.id),
        route.kind
      ).toEqual([expectedActiveId]);
    }
  });

  test('exposes reference-aligned submenu labels for screenshot proof anchors', () => {
    const music = byId('music');
    expect(
      music.submenuGroups?.flatMap((group) => [
        group.label,
        ...group.items.map((item) => item.label)
      ])
    ).toEqual(['Music', 'Music', 'Top music', 'Artists', 'Albums', 'Genres', 'Videos']);

    const addons = byId('addons');
    expect(addons.submenuGroups?.map((group) => group.label)).toEqual(['ADD-ONS']);

    const settings = byId('settings');
    expect(
      settings.submenuGroups?.map((group) => ({
        label: group.label,
        items: group.items.map((item) => item.label)
      }))
    ).toEqual([
      { label: 'GENERAL', items: ['Web interface', 'Main menu'] },
      { label: 'KODI SETTINGS', items: ['Add-ons', 'Search'] }
    ]);
  });

  test('marks representative submenu items active with canonical hrefs', () => {
    const cases: readonly [string, PrimaryRoute, readonly [string, string, string]][] = [
      ['music', { kind: 'musicArtists' }, ['library', 'artists', '/music/artists']],
      ['music', { kind: 'musicVideos' }, ['library', 'videos', '/music/videos']],
      ['movies', { kind: 'moviesRecent' }, ['library', 'recent', '/movies/recent']],
      ['tvshows', { kind: 'tvshowsRecent' }, ['library', 'recent', '/tvshows/recent']],
      ['addons', { kind: 'addonsVideo' }, ['types', 'video', '/addons/video']],
      [
        'addons',
        { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' },
        ['types', 'all', '/addons/all']
      ],
      ['settings', { kind: 'settingsNav' }, ['general', 'main-menu', '/settings/nav']],
      ['settings', { kind: 'settingsWeb' }, ['general', 'web-interface', '/settings/web']],
      ['settings', { kind: 'settingsAddons' }, ['kodi-settings', 'addons', '/settings/addons']],
      ['settings', { kind: 'settingsSearch' }, ['kodi-settings', 'search', '/settings/search']],
      [
        'settings',
        { kind: 'settingsKodiSection', section: 'library' },
        ['kodi-settings', 'addons', '/settings/addons']
      ],
      ['help', { kind: 'helpOverview' }, ['help', 'overview', '/help/overview']],
      ['help', { kind: 'helpPage', pageid: 'addons' }, ['help', 'addons', '/help/addons']],
      [
        'help',
        { kind: 'helpPage', pageid: 'developers' },
        ['help', 'developers', '/help/developers']
      ]
    ];

    for (const [railId, activeRoute, [groupId, submenuId, expectedHref]] of cases) {
      const rail = byId(railId, activeRoute);
      const group = rail.submenuGroups?.find((candidate) => candidate.id === groupId);
      expect(group, `${railId}/${groupId}`).toBeDefined();
      const submenu = group?.items.find((candidate) => candidate.id === submenuId);
      expect(submenu, `${railId}/${groupId}/${submenuId}`).toBeDefined();
      expect(submenu?.href).toBe(expectedHref);
      expect(submenu?.isActive).toBe(true);
    }
  });
});
