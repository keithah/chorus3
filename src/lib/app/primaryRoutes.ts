export type PrimaryRoute =
  | { kind: 'home' }
  | { kind: 'music' }
  | { kind: 'musicTop' }
  | { kind: 'musicArtists' }
  | { kind: 'musicAlbums' }
  | { kind: 'musicGenres' }
  | { kind: 'musicVideos' }
  | { kind: 'musicVideoDetail'; musicvideoid: string }
  | { kind: 'musicAlbumDetail'; albumid: string }
  | { kind: 'musicArtistDetail'; artistid: string }
  | { kind: 'musicGenreDetail'; genreid: string }
  | { kind: 'movies' }
  | { kind: 'moviesRecent' }
  | { kind: 'movieDetail'; movieid: string }
  | { kind: 'tvshows' }
  | { kind: 'tvshowsRecent' }
  | { kind: 'tvshowDetail'; tvshowid: string }
  | { kind: 'tvshowSeasonDetail'; tvshowid: string; season: string }
  | { kind: 'tvshowEpisodeDetail'; tvshowid: string; season: string; episodeid: string }
  | { kind: 'browser' }
  | { kind: 'browserItem'; media: string; itemid: string }
  | { kind: 'addonsAll' }
  | { kind: 'addonsVideo' }
  | { kind: 'addonsAudio' }
  | { kind: 'addonsExecutable' }
  | { kind: 'addonDetail'; addonid: string }
  | { kind: 'addonExecute'; addonid: string }
  | { kind: 'currentPlaylist' }
  | { kind: 'playlists' }
  | { kind: 'playlistDetail'; playlistid: string }
  | { kind: 'settingsWeb' }
  | { kind: 'settingsKodi' }
  | { kind: 'settingsKodiSection'; section: string }
  | { kind: 'settingsAddons' }
  | { kind: 'settingsNav' }
  | { kind: 'settingsSearch' }
  | { kind: 'help' }
  | { kind: 'helpOverview' }
  | { kind: 'helpPage'; pageid: string }
  | { kind: 'remote' }
  | { kind: 'search' }
  | { kind: 'searchMedia'; media: string; query: string }
  | { kind: 'lab' }
  | { kind: 'labApiBrowser' }
  | { kind: 'labApiBrowserMethod'; method: string }
  | { kind: 'labScreenshot' }
  | { kind: 'labIconBrowser' }
  | { kind: 'thumbsup' }
  | { kind: 'pvrTv' }
  | { kind: 'pvrEpg' }
  | { kind: 'pvrTvChannel'; channelid: string }
  | { kind: 'pvrRadio' }
  | { kind: 'pvrRadioChannel'; channelid: string }
  | { kind: 'pvrRecordings' };

const MAX_DYNAMIC_SEGMENT_LENGTH = 128;
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

const STATIC_PRIMARY_ROUTES = new Map<string, PrimaryRoute>([
  ['/', { kind: 'home' }],
  ['/home', { kind: 'home' }],
  ['/music', { kind: 'music' }],
  ['/music/home', { kind: 'music' }],
  ['/music/top', { kind: 'musicTop' }],
  ['/artists', { kind: 'musicArtists' }],
  ['/music/artists', { kind: 'musicArtists' }],
  ['/albums', { kind: 'musicAlbums' }],
  ['/music/albums', { kind: 'musicAlbums' }],
  ['/genres', { kind: 'musicGenres' }],
  ['/music/genres', { kind: 'musicGenres' }],
  ['/music/videos', { kind: 'musicVideos' }],
  ['/movies', { kind: 'movies' }],
  ['/movies/all', { kind: 'movies' }],
  ['/movies/recent', { kind: 'moviesRecent' }],
  ['/video/movies', { kind: 'movies' }],
  ['/tvshows', { kind: 'tvshows' }],
  ['/tvshows/all', { kind: 'tvshows' }],
  ['/tvshows/recent', { kind: 'tvshowsRecent' }],
  ['/video/tv', { kind: 'tvshows' }],
  ['/browser', { kind: 'browser' }],
  ['/files', { kind: 'browser' }],
  ['/addons', { kind: 'addonsAll' }],
  ['/addons/all', { kind: 'addonsAll' }],
  ['/addons/video', { kind: 'addonsVideo' }],
  ['/addons/audio', { kind: 'addonsAudio' }],
  ['/addons/executable', { kind: 'addonsExecutable' }],
  ['/playlist', { kind: 'currentPlaylist' }],
  ['/playlists', { kind: 'playlists' }],
  ['/localPlaylist', { kind: 'playlists' }],
  ['/settings', { kind: 'settingsWeb' }],
  ['/settings/web', { kind: 'settingsWeb' }],
  ['/settings/web-interface', { kind: 'settingsWeb' }],
  ['/settings/kodi', { kind: 'settingsKodi' }],
  ['/settings/kodi/home', { kind: 'settingsKodi' }],
  ['/settings/games', { kind: 'settingsKodiSection', section: 'games' }],
  ['/settings/interface', { kind: 'settingsKodiSection', section: 'interface' }],
  ['/settings/media', { kind: 'settingsKodiSection', section: 'media' }],
  ['/settings/player', { kind: 'settingsKodiSection', section: 'player' }],
  ['/settings/pvr', { kind: 'settingsKodiSection', section: 'pvr' }],
  ['/settings/services', { kind: 'settingsKodiSection', section: 'services' }],
  ['/settings/system', { kind: 'settingsKodiSection', section: 'system' }],
  ['/settings/addons', { kind: 'settingsAddons' }],
  ['/settings/nav', { kind: 'settingsNav' }],
  ['/settings/main-menu', { kind: 'settingsNav' }],
  ['/settings/search', { kind: 'settingsSearch' }],
  ['/help', { kind: 'help' }],
  ['/help/about', { kind: 'help' }],
  ['/help/overview', { kind: 'helpOverview' }],
  ['/remote', { kind: 'remote' }],
  ['/search', { kind: 'search' }],
  ['/lab', { kind: 'lab' }],
  ['/lab/home', { kind: 'lab' }],
  ['/lab/api-browser', { kind: 'labApiBrowser' }],
  ['/lab/screenshot', { kind: 'labScreenshot' }],
  ['/lab/icon-browser', { kind: 'labIconBrowser' }],
  ['/thumbsup', { kind: 'thumbsup' }],
  ['/pvr', { kind: 'pvrTv' }],
  ['/pvr/tv', { kind: 'pvrTv' }],
  ['/pvr/epg', { kind: 'pvrEpg' }],
  ['/pvr/radio', { kind: 'pvrRadio' }],
  ['/pvr/recordings', { kind: 'pvrRecordings' }]
]);

export function parsePrimaryRoutePath(path: string): PrimaryRoute | null {
  const direct = STATIC_PRIMARY_ROUTES.get(path);

  if (direct) {
    return direct;
  }

  const segments = path.split('/').filter(Boolean);

  if (segments.length === 3 && segments[0] === 'music' && segments[1] === 'album') {
    return withSafeDynamicSegment(segments[2], (albumid) => ({
      kind: 'musicAlbumDetail',
      albumid
    }));
  }

  if (segments.length === 3 && segments[0] === 'music' && segments[1] === 'artist') {
    return withSafeDynamicSegment(segments[2], (artistid) => ({
      kind: 'musicArtistDetail',
      artistid
    }));
  }

  if (segments.length === 3 && segments[0] === 'music' && segments[1] === 'genre') {
    return withSafeDynamicSegment(segments[2], (genreid) => ({
      kind: 'musicGenreDetail',
      genreid
    }));
  }

  if (segments.length === 3 && segments[0] === 'music' && segments[1] === 'video') {
    return withSafeDynamicSegment(segments[2], (musicvideoid) => ({
      kind: 'musicVideoDetail',
      musicvideoid
    }));
  }

  if (segments.length === 2 && segments[0] === 'movie') {
    return withSafeDynamicSegment(segments[1], (movieid) => ({ kind: 'movieDetail', movieid }));
  }

  if (segments[0] === 'tvshow') {
    const tvshowid = normalizeDynamicSegment(segments[1]);
    const season = normalizeDynamicSegment(segments[2]);
    const episodeid = normalizeDynamicSegment(segments[3]);

    if (segments.length === 2 && tvshowid) {
      return { kind: 'tvshowDetail', tvshowid };
    }

    if (segments.length === 3 && tvshowid && season) {
      return { kind: 'tvshowSeasonDetail', tvshowid, season };
    }

    if (segments.length === 4 && tvshowid && season && episodeid) {
      return { kind: 'tvshowEpisodeDetail', tvshowid, season, episodeid };
    }
  }

  if (segments.length === 2 && segments[0] === 'browser') {
    const media = normalizeBrowserMediaSegment(segments[1]);

    return media ? { kind: 'browserItem', media, itemid: 'root' } : null;
  }

  if (segments.length >= 2 && segments[0] === 'browser') {
    const media = normalizeBrowserMediaSegment(segments[1]);
    const itemid = normalizeBrowserItemSegment(segments.slice(2).join('/'), media);

    return media && itemid ? { kind: 'browserItem', media, itemid } : null;
  }

  if (segments.length === 2 && segments[0] === 'addons') {
    return withSafeDynamicSegment(segments[1], (addonid) => ({ kind: 'addonDetail', addonid }));
  }

  if (segments.length === 3 && segments[0] === 'addon' && segments[1] === 'execute') {
    return withSafeDynamicSegment(segments[2], (addonid) => ({ kind: 'addonExecute', addonid }));
  }

  if (
    (segments.length === 2 && segments[0] === 'playlist') ||
    (segments.length === 2 && segments[0] === 'playlists')
  ) {
    return withSafeDynamicSegment(segments[1], (playlistid) => ({
      kind: 'playlistDetail',
      playlistid
    }));
  }

  if (segments.length === 3 && segments[0] === 'settings' && segments[1] === 'kodi') {
    return withSafeDynamicSegment(segments[2], (section) => ({
      kind: 'settingsKodiSection',
      section
    }));
  }

  if (segments.length === 2 && segments[0] === 'help') {
    return withSafeDynamicSegment(segments[1], (pageid) => ({ kind: 'helpPage', pageid }));
  }

  if (segments.length === 3 && segments[0] === 'search') {
    const media = normalizeSearchMediaSegment(segments[1]);
    const query = normalizeSearchQuerySegment(segments[2]);

    return media && query ? { kind: 'searchMedia', media, query } : null;
  }

  if (segments.length === 3 && segments[0] === 'lab' && segments[1] === 'api-browser') {
    return withSafeDynamicSegment(segments[2], (method) => ({
      kind: 'labApiBrowserMethod',
      method
    }));
  }

  if (segments.length === 3 && segments[0] === 'pvr' && segments[1] === 'tv') {
    return withSafeDynamicSegment(segments[2], (channelid) => ({
      kind: 'pvrTvChannel',
      channelid
    }));
  }

  if (segments.length === 3 && segments[0] === 'pvr' && segments[1] === 'radio') {
    return withSafeDynamicSegment(segments[2], (channelid) => ({
      kind: 'pvrRadioChannel',
      channelid
    }));
  }

  return null;
}

export function buildPrimaryRoutePath(route: PrimaryRoute): string {
  if (!isPrimaryRouteLike(route)) {
    return '/';
  }

  switch (route.kind) {
    case 'home':
      return '/';
    case 'music':
      return '/music';
    case 'musicTop':
      return '/music/top';
    case 'musicArtists':
      return '/music/artists';
    case 'musicAlbums':
      return '/music/albums';
    case 'musicGenres':
      return '/music/genres';
    case 'musicVideos':
      return '/music/videos';
    case 'musicVideoDetail':
      return buildDynamicPath('/music/video', route.musicvideoid);
    case 'musicAlbumDetail':
      return buildDynamicPath('/music/album', route.albumid);
    case 'musicArtistDetail':
      return buildDynamicPath('/music/artist', route.artistid);
    case 'musicGenreDetail':
      return buildDynamicPath('/music/genre', route.genreid);
    case 'movies':
      return '/movies';
    case 'moviesRecent':
      return '/movies/recent';
    case 'movieDetail':
      return buildDynamicPath('/movie', route.movieid);
    case 'tvshows':
      return '/tvshows';
    case 'tvshowsRecent':
      return '/tvshows/recent';
    case 'tvshowDetail':
      return buildDynamicPath('/tvshow', route.tvshowid);
    case 'tvshowSeasonDetail':
      return buildMultiDynamicPath('/tvshow', [route.tvshowid, route.season]);
    case 'tvshowEpisodeDetail':
      return buildMultiDynamicPath('/tvshow', [route.tvshowid, route.season, route.episodeid]);
    case 'browser':
      return '/browser';
    case 'browserItem':
      if (route.itemid === 'root' && (route.media === 'music' || route.media === 'video')) {
        return `/browser/${route.media}`;
      }

      if (
        (route.media === 'music' || route.media === 'video') &&
        /^(source|entry):\d+$/u.test(route.itemid)
      ) {
        return `/browser/${route.media}/${encodeURIComponent(route.itemid)}`;
      }

      if (route.media === 'music' || route.media === 'video') {
        return `/browser/${route.media}/${encodeURIComponent(route.itemid)}`;
      }

      return buildMultiDynamicPath('/browser', [route.media, route.itemid]);
    case 'addonsAll':
      return '/addons/all';
    case 'addonsVideo':
      return '/addons/video';
    case 'addonsAudio':
      return '/addons/audio';
    case 'addonsExecutable':
      return '/addons/executable';
    case 'addonDetail':
      return buildDynamicPath('/addons', route.addonid);
    case 'addonExecute':
      return buildDynamicPath('/addon/execute', route.addonid);
    case 'currentPlaylist':
      return '/playlist';
    case 'playlists':
      return '/playlists';
    case 'playlistDetail':
      return buildDynamicPath('/playlist', route.playlistid);
    case 'settingsWeb':
      return '/settings/web';
    case 'settingsKodi':
      return '/settings/kodi';
    case 'settingsKodiSection':
      return buildDynamicPath('/settings/kodi', route.section);
    case 'settingsAddons':
      return '/settings/addons';
    case 'settingsNav':
      return '/settings/nav';
    case 'settingsSearch':
      return '/settings/search';
    case 'help':
      return '/help';
    case 'helpOverview':
      return '/help/overview';
    case 'helpPage':
      return buildDynamicPath('/help', route.pageid);
    case 'remote':
      return '/remote';
    case 'search':
      return '/search';
    case 'searchMedia':
      return buildSearchPath(route.media, route.query);
    case 'lab':
      return '/lab';
    case 'labApiBrowser':
      return '/lab/api-browser';
    case 'labApiBrowserMethod':
      return buildDynamicPath('/lab/api-browser', route.method);
    case 'labScreenshot':
      return '/lab/screenshot';
    case 'labIconBrowser':
      return '/lab/icon-browser';
    case 'thumbsup':
      return '/thumbsup';
    case 'pvrTv':
      return '/pvr/tv';
    case 'pvrEpg':
      return '/pvr/epg';
    case 'pvrTvChannel':
      return buildDynamicPath('/pvr/tv', route.channelid);
    case 'pvrRadio':
      return '/pvr/radio';
    case 'pvrRadioChannel':
      return buildDynamicPath('/pvr/radio', route.channelid);
    case 'pvrRecordings':
      return '/pvr/recordings';
    default:
      return '/';
  }
}

function buildDynamicPath(prefix: string, segment: unknown): string {
  const normalized = normalizeDynamicSegment(segment);
  return normalized ? `${prefix}/${encodeURIComponent(normalized)}` : '/[redacted]';
}

function buildMultiDynamicPath(prefix: string, segments: unknown[]): string {
  const normalized = segments.map(normalizeDynamicSegment);

  return normalized.every(Boolean)
    ? `${prefix}/${normalized.map((segment) => encodeURIComponent(segment as string)).join('/')}`
    : '/[redacted]';
}

function buildSearchPath(media: unknown, query: unknown): string {
  const normalizedMedia = normalizeSearchMediaSegment(media);
  const normalizedQuery = normalizeSearchQuerySegment(query);

  return normalizedMedia && normalizedQuery
    ? `/search/${encodeURIComponent(normalizedMedia)}/${encodeURIComponent(normalizedQuery)}`
    : '/[redacted]';
}

function withSafeDynamicSegment<T extends PrimaryRoute>(
  segment: string | undefined,
  createRoute: (segment: string) => T
): T | null {
  const normalized = normalizeDynamicSegment(segment);
  return normalized ? createRoute(normalized) : null;
}

function normalizeDynamicSegment(segment: unknown): string | null {
  if (typeof segment !== 'string') {
    return null;
  }

  const decoded = safeDecode(segment).trim();

  if (
    !decoded ||
    decoded !== segment ||
    decoded.length > MAX_DYNAMIC_SEGMENT_LENGTH ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('..') ||
    decoded.includes('/') ||
    FORBIDDEN_SEGMENT_PATTERN.test(decoded)
  ) {
    return null;
  }

  return /^[a-z0-9._-]+$/i.test(decoded) ? decoded : null;
}

function normalizeSearchMediaSegment(segment: unknown): string | null {
  const normalized = normalizeDynamicSegment(segment);
  return normalized && /^[a-z0-9._-]+$/i.test(normalized) ? normalized : null;
}

function normalizeBrowserMediaSegment(segment: unknown): string | null {
  const normalized = normalizeDynamicSegment(segment);
  return normalized === 'music' || normalized === 'video' ? normalized : null;
}

function normalizeSearchQuerySegment(segment: unknown): string | null {
  if (typeof segment !== 'string') {
    return null;
  }

  const decoded = safeDecode(segment).trim();

  if (
    !decoded ||
    decoded.length > MAX_DYNAMIC_SEGMENT_LENGTH ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('..') ||
    decoded.includes('/') ||
    FORBIDDEN_SEGMENT_PATTERN.test(decoded) ||
    !/^[a-z0-9 _.,'()[\]&!?:+-]+$/i.test(decoded)
  ) {
    return null;
  }

  return decoded;
}

function normalizeBrowserItemSegment(segment: unknown, media: string | null): string | null {
  if (typeof segment !== 'string') {
    return null;
  }

  const decoded = safeDecode(segment).trim();
  if (/^(source|entry):\d+$/u.test(decoded)) {
    return decoded;
  }

  if (
    (media === 'music' || media === 'video') &&
    /^plugin:\/\/[A-Za-z0-9._-]+\/?$/u.test(decoded)
  ) {
    return decoded.endsWith('/') ? decoded : `${decoded}/`;
  }

  const safeDynamic = normalizeDynamicSegment(segment);
  if (safeDynamic) {
    return safeDynamic;
  }

  if (
    (media !== 'music' && media !== 'video') ||
    !decoded ||
    decoded.length > 2048 ||
    FORBIDDEN_SEGMENT_PATTERN.test(decoded) ||
    /authorization|basic\s+|password|p@ssword|localStorage/i.test(decoded)
  ) {
    return null;
  }

  return decoded;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isPrimaryRouteLike(route: unknown): route is { kind: string } {
  return typeof route === 'object' && route !== null && 'kind' in route;
}
