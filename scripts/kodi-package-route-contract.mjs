export const KODI_PACKAGE_BASE_PATH = '/addons/webinterface.chorus3';

export const KODI_PACKAGE_ROUTE_FALLBACKS = Object.freeze([
  { name: 'music', routePath: '/music', stagedIndexPath: 'music/index.html' },
  { name: 'music-top', routePath: '/music/top', stagedIndexPath: 'music/top/index.html' },
  { name: 'artists-alias', routePath: '/artists', stagedIndexPath: 'artists/index.html' },
  {
    name: 'music-artists',
    routePath: '/music/artists',
    stagedIndexPath: 'music/artists/index.html'
  },
  { name: 'albums-alias', routePath: '/albums', stagedIndexPath: 'albums/index.html' },
  { name: 'music-albums', routePath: '/music/albums', stagedIndexPath: 'music/albums/index.html' },
  { name: 'genres-alias', routePath: '/genres', stagedIndexPath: 'genres/index.html' },
  { name: 'music-genres', routePath: '/music/genres', stagedIndexPath: 'music/genres/index.html' },
  { name: 'music-videos', routePath: '/music/videos', stagedIndexPath: 'music/videos/index.html' },
  { name: 'movies', routePath: '/movies', stagedIndexPath: 'movies/index.html' },
  {
    name: 'movies-recent',
    routePath: '/movies/recent',
    stagedIndexPath: 'movies/recent/index.html'
  },
  {
    name: 'legacy-video-movies',
    routePath: '/video/movies',
    stagedIndexPath: 'video/movies/index.html'
  },
  { name: 'tvshows', routePath: '/tvshows', stagedIndexPath: 'tvshows/index.html' },
  {
    name: 'tvshows-recent',
    routePath: '/tvshows/recent',
    stagedIndexPath: 'tvshows/recent/index.html'
  },
  { name: 'legacy-video-tv', routePath: '/video/tv', stagedIndexPath: 'video/tv/index.html' },
  { name: 'browser', routePath: '/browser', stagedIndexPath: 'browser/index.html' },
  { name: 'files', routePath: '/files', stagedIndexPath: 'files/index.html' },
  { name: 'addons', routePath: '/addons', stagedIndexPath: 'addons/index.html' },
  { name: 'addons-all', routePath: '/addons/all', stagedIndexPath: 'addons/all/index.html' },
  { name: 'addons-video', routePath: '/addons/video', stagedIndexPath: 'addons/video/index.html' },
  { name: 'addons-audio', routePath: '/addons/audio', stagedIndexPath: 'addons/audio/index.html' },
  {
    name: 'addons-executable',
    routePath: '/addons/executable',
    stagedIndexPath: 'addons/executable/index.html'
  },
  {
    name: 'addon-detail-safe-demo',
    routePath: '/addons/plugin.video.safe-demo',
    stagedIndexPath: 'addons/plugin.video.safe-demo/index.html'
  },
  { name: 'playlists', routePath: '/playlists', stagedIndexPath: 'playlists/index.html' },
  {
    name: 'local-playlist',
    routePath: '/localPlaylist',
    stagedIndexPath: 'localPlaylist/index.html'
  },
  { name: 'settings', routePath: '/settings', stagedIndexPath: 'settings/index.html' },
  { name: 'settings-web', routePath: '/settings/web', stagedIndexPath: 'settings/web/index.html' },
  {
    name: 'settings-web-interface',
    routePath: '/settings/web-interface',
    stagedIndexPath: 'settings/web-interface/index.html'
  },
  {
    name: 'settings-kodi',
    routePath: '/settings/kodi',
    stagedIndexPath: 'settings/kodi/index.html'
  },
  {
    name: 'settings-games',
    routePath: '/settings/games',
    stagedIndexPath: 'settings/games/index.html'
  },
  {
    name: 'settings-interface',
    routePath: '/settings/interface',
    stagedIndexPath: 'settings/interface/index.html'
  },
  {
    name: 'settings-media',
    routePath: '/settings/media',
    stagedIndexPath: 'settings/media/index.html'
  },
  {
    name: 'settings-player',
    routePath: '/settings/player',
    stagedIndexPath: 'settings/player/index.html'
  },
  { name: 'settings-pvr', routePath: '/settings/pvr', stagedIndexPath: 'settings/pvr/index.html' },
  {
    name: 'settings-services',
    routePath: '/settings/services',
    stagedIndexPath: 'settings/services/index.html'
  },
  {
    name: 'settings-system',
    routePath: '/settings/system',
    stagedIndexPath: 'settings/system/index.html'
  },
  {
    name: 'settings-addons',
    routePath: '/settings/addons',
    stagedIndexPath: 'settings/addons/index.html'
  },
  { name: 'settings-nav', routePath: '/settings/nav', stagedIndexPath: 'settings/nav/index.html' },
  {
    name: 'settings-main-menu',
    routePath: '/settings/main-menu',
    stagedIndexPath: 'settings/main-menu/index.html'
  },
  {
    name: 'settings-search',
    routePath: '/settings/search',
    stagedIndexPath: 'settings/search/index.html'
  },
  {
    name: 'settings-kodi-interface',
    routePath: '/settings/kodi/interface',
    stagedIndexPath: 'settings/kodi/interface/index.html'
  },
  { name: 'help', routePath: '/help', stagedIndexPath: 'help/index.html' },
  {
    name: 'help-overview',
    routePath: '/help/overview',
    stagedIndexPath: 'help/overview/index.html'
  },
  {
    name: 'help-keyboard',
    routePath: '/help/keyboard',
    stagedIndexPath: 'help/keyboard/index.html'
  },
  { name: 'help-readme', routePath: '/help/readme', stagedIndexPath: 'help/readme/index.html' },
  {
    name: 'help-changelog',
    routePath: '/help/changelog',
    stagedIndexPath: 'help/changelog/index.html'
  },
  {
    name: 'help-translations',
    routePath: '/help/translations',
    stagedIndexPath: 'help/translations/index.html'
  },
  { name: 'help-license', routePath: '/help/license', stagedIndexPath: 'help/license/index.html' },
  { name: 'search', routePath: '/search', stagedIndexPath: 'search/index.html' },
  { name: 'thumbsup', routePath: '/thumbsup', stagedIndexPath: 'thumbsup/index.html' },
  { name: 'pvr', routePath: '/pvr', stagedIndexPath: 'pvr/index.html' },
  { name: 'pvr-tv', routePath: '/pvr/tv', stagedIndexPath: 'pvr/tv/index.html' },
  { name: 'pvr-radio', routePath: '/pvr/radio', stagedIndexPath: 'pvr/radio/index.html' },
  {
    name: 'pvr-recordings',
    routePath: '/pvr/recordings',
    stagedIndexPath: 'pvr/recordings/index.html'
  },
  { name: 'remote', routePath: '/remote', stagedIndexPath: 'remote/index.html' },
  { name: 'now-playing', routePath: '/now-playing', stagedIndexPath: 'now-playing/index.html' }
]);

export function getKodiPackageRouteFallbacks() {
  return KODI_PACKAGE_ROUTE_FALLBACKS.map((fallback) => ({ ...fallback }));
}
