export const KODI_PACKAGE_BASE_PATH = '/addons/webinterface.chorus3';

export const KODI_PACKAGE_ROUTE_FALLBACKS = Object.freeze([
  { name: 'music', routePath: '/music', stagedIndexPath: 'music/index.html' },
  { name: 'music-genres', routePath: '/music/genres', stagedIndexPath: 'music/genres/index.html' },
  { name: 'movies', routePath: '/movies', stagedIndexPath: 'movies/index.html' },
  { name: 'tvshows', routePath: '/tvshows', stagedIndexPath: 'tvshows/index.html' },
  { name: 'browser', routePath: '/browser', stagedIndexPath: 'browser/index.html' },
  { name: 'files', routePath: '/files', stagedIndexPath: 'files/index.html' },
  { name: 'addons-all', routePath: '/addons/all', stagedIndexPath: 'addons/all/index.html' },
  {
    name: 'addon-detail-safe-demo',
    routePath: '/addons/plugin.video.safe-demo',
    stagedIndexPath: 'addons/plugin.video.safe-demo/index.html'
  },
  { name: 'playlists', routePath: '/playlists', stagedIndexPath: 'playlists/index.html' },
  { name: 'settings-web', routePath: '/settings/web', stagedIndexPath: 'settings/web/index.html' },
  {
    name: 'settings-kodi-interface',
    routePath: '/settings/kodi/interface',
    stagedIndexPath: 'settings/kodi/interface/index.html'
  },
  { name: 'help', routePath: '/help', stagedIndexPath: 'help/index.html' },
  {
    name: 'help-keyboard',
    routePath: '/help/keyboard',
    stagedIndexPath: 'help/keyboard/index.html'
  },
  { name: 'remote', routePath: '/remote', stagedIndexPath: 'remote/index.html' },
  { name: 'now-playing', routePath: '/now-playing', stagedIndexPath: 'now-playing/index.html' }
]);

export function getKodiPackageRouteFallbacks() {
  return KODI_PACKAGE_ROUTE_FALLBACKS.map((fallback) => ({ ...fallback }));
}
