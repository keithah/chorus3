export type PrimaryRoute =
  | { kind: 'home' }
  | { kind: 'music' }
  | { kind: 'musicTop' }
  | { kind: 'musicArtists' }
  | { kind: 'musicAlbums' }
  | { kind: 'musicGenres' }
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
  | { kind: 'addonExecute'; addonid: string }
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
  | { kind: 'thumbsup' }
  | { kind: 'pvrTv' }
  | { kind: 'pvrRadio' }
  | { kind: 'pvrRecordings' };

const MAX_DYNAMIC_SEGMENT_LENGTH = 128;
const UNSAFE_SEGMENT = '[redacted]';
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

const STATIC_PRIMARY_ROUTES = new Map<string, PrimaryRoute>([
  ['/', { kind: 'home' }],
  ['/home', { kind: 'home' }],
  ['/music', { kind: 'music' }],
  ['/music/top', { kind: 'musicTop' }],
  ['/music/artists', { kind: 'musicArtists' }],
  ['/music/albums', { kind: 'musicAlbums' }],
  ['/music/genres', { kind: 'musicGenres' }],
  ['/movies', { kind: 'movies' }],
  ['/movies/recent', { kind: 'moviesRecent' }],
  ['/tvshows', { kind: 'tvshows' }],
  ['/tvshows/recent', { kind: 'tvshowsRecent' }],
  ['/browser', { kind: 'browser' }],
  ['/addons/all', { kind: 'addonsAll' }],
  ['/addons/video', { kind: 'addonsVideo' }],
  ['/addons/audio', { kind: 'addonsAudio' }],
  ['/addons/executable', { kind: 'addonsExecutable' }],
  ['/playlists', { kind: 'playlists' }],
  ['/settings/web', { kind: 'settingsWeb' }],
  ['/settings/kodi', { kind: 'settingsKodi' }],
  ['/settings/addons', { kind: 'settingsAddons' }],
  ['/settings/nav', { kind: 'settingsNav' }],
  ['/settings/search', { kind: 'settingsSearch' }],
  ['/help', { kind: 'help' }],
  ['/help/overview', { kind: 'helpOverview' }],
  ['/remote', { kind: 'remote' }],
  ['/search', { kind: 'search' }],
  ['/thumbsup', { kind: 'thumbsup' }],
  ['/pvr/tv', { kind: 'pvrTv' }],
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
    return withSafeDynamicSegment(segments[2], (albumid) => ({ kind: 'musicAlbumDetail', albumid }));
  }

  if (segments.length === 3 && segments[0] === 'music' && segments[1] === 'artist') {
    return withSafeDynamicSegment(segments[2], (artistid) => ({ kind: 'musicArtistDetail', artistid }));
  }

  if (segments.length === 3 && segments[0] === 'music' && segments[1] === 'genre') {
    return withSafeDynamicSegment(segments[2], (genreid) => ({ kind: 'musicGenreDetail', genreid }));
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

  if (segments.length === 3 && segments[0] === 'browser') {
    const media = normalizeDynamicSegment(segments[1]);
    const itemid = normalizeDynamicSegment(segments[2]);

    return media && itemid ? { kind: 'browserItem', media, itemid } : null;
  }

  if (segments.length === 3 && segments[0] === 'addon' && segments[1] === 'execute') {
    return withSafeDynamicSegment(segments[2], (addonid) => ({ kind: 'addonExecute', addonid }));
  }

  if (segments.length === 2 && segments[0] === 'playlist') {
    return withSafeDynamicSegment(segments[1], (playlistid) => ({ kind: 'playlistDetail', playlistid }));
  }

  if (segments.length === 3 && segments[0] === 'settings' && segments[1] === 'kodi') {
    return withSafeDynamicSegment(segments[2], (section) => ({ kind: 'settingsKodiSection', section }));
  }

  if (segments.length === 2 && segments[0] === 'help') {
    return withSafeDynamicSegment(segments[1], (pageid) => ({ kind: 'helpPage', pageid }));
  }

  if (segments.length === 3 && segments[0] === 'search') {
    const media = normalizeDynamicSegment(segments[1]);
    const query = normalizeDynamicSegment(segments[2]);

    return media && query ? { kind: 'searchMedia', media, query } : null;
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
      return buildMultiDynamicPath('/browser', [route.media, route.itemid]);
    case 'addonsAll':
      return '/addons/all';
    case 'addonsVideo':
      return '/addons/video';
    case 'addonsAudio':
      return '/addons/audio';
    case 'addonsExecutable':
      return '/addons/executable';
    case 'addonExecute':
      return buildDynamicPath('/addon/execute', route.addonid);
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
      return buildMultiDynamicPath('/search', [route.media, route.query]);
    case 'thumbsup':
      return '/thumbsup';
    case 'pvrTv':
      return '/pvr/tv';
    case 'pvrRadio':
      return '/pvr/radio';
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
