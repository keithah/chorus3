import type {
  VideoLibraryMovieSnapshot,
  VideoLibraryStoreSnapshot
} from '$lib/stores/videoLibrary.svelte';
import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
import type { VideoMovieActionDispatch } from '$lib/components/VideoMovieDetailShell.svelte';
import type { VideoMovieStreamDispatch } from '$lib/components/VideoMovieStreamShell.svelte';
import { parseVideoRoute, type VideoRoute } from '$lib/video/videoRouter';

export interface M004BrowserProofLocation {
  pathname?: unknown;
  search?: unknown;
}

export interface VideoNavigationDispatch {
  openMovieGrid: () => Promise<void>;
  openMovieDetail: (movie: { movieid: number }) => Promise<void>;
  openRoute: (route: VideoRoute) => Promise<void>;
}

export interface M004BrowserProofAppProps {
  route: VideoRoute;
  videoLibrarySnapshot: VideoLibraryStoreSnapshot;
  videoMovieDetailSnapshot: VideoMovieDetailStoreSnapshot;
  localPlayerSnapshot: LocalPlayerStoreSnapshot;
  videoNavigationDispatch: VideoNavigationDispatch;
  videoMovieActionDispatch: VideoMovieActionDispatch;
  videoMovieStreamActionDispatch: VideoMovieStreamDispatch;
}

export const M004_BROWSER_PROOF_FORBIDDEN_TEXT = [
  'smb://',
  'special://',
  '://admin:',
  'Authorization',
  'Basic',
  'localStorage',
  'sessionStorage',
  'admin:p@ssword',
  'super-secret-password',
  'SENTINEL_SECRET',
  'CHORUS3_SENTINEL_SECRET'
] as const;

const readyAt = '2026-05-01T07:00:00.000Z';
const noop = async (): Promise<void> => undefined;

export function createM004BrowserProofAppProps(
  location: M004BrowserProofLocation | null | undefined = globalThis.window?.location
): M004BrowserProofAppProps {
  const route = parseVideoRoute(readPathname(location), readSearch(location));

  return {
    route,
    videoLibrarySnapshot: createVideoLibrarySnapshot(),
    videoMovieDetailSnapshot: createVideoMovieDetailSnapshot(route),
    localPlayerSnapshot: createLocalPlayerSnapshot(route),
    videoNavigationDispatch: createVideoNavigationDispatch(),
    videoMovieActionDispatch: createVideoMovieActionDispatch(),
    videoMovieStreamActionDispatch: createVideoMovieStreamActionDispatch()
  };
}

export function isM004BrowserProofFixtureSecretSafe(value: unknown): boolean {
  const text = collectFixtureText(value);
  return M004_BROWSER_PROOF_FORBIDDEN_TEXT.every((forbidden) => !text.includes(forbidden));
}

function createVideoLibrarySnapshot(): VideoLibraryStoreSnapshot {
  const movies: Array<VideoLibraryMovieSnapshot & { versionCount?: number }> = [
    {
      movieid: 4401,
      label: 'Neon Harbor',
      title: 'Neon Harbor',
      year: 2024,
      runtime: 6420,
      playcount: 1,
      watched: true,
      lastplayed: '2026-04-29 21:15:00',
      dateadded: '2026-04-28 10:00:00',
      resume: { position: 1830, total: 6420 },
      art: { poster: 'poster:neon-harbor', fanart: 'fanart:neon-harbor' },
      versionCount: 2
    },
    {
      movieid: 4402,
      label: 'Quiet Signal',
      title: 'Quiet Signal',
      year: 2025,
      runtime: 5940,
      playcount: 0,
      watched: false,
      dateadded: '2026-04-30 08:30:00',
      resume: { position: 1275, total: 5940 },
      art: { poster: 'poster:quiet-signal' }
    }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: readyAt,
    movies,
    tvShows: [],
    limits: {
      movies: { start: 0, end: movies.length, total: movies.length },
      tvShows: { start: 0, end: 0, total: 0 }
    },
    isEmpty: false,
    lastError: null
  };
}

function createVideoMovieDetailSnapshot(route: VideoRoute): VideoMovieDetailStoreSnapshot {
  const movieid = route.kind === 'videoMovieDetail' ? route.movieid : null;
  const detail =
    movieid === 4401
      ? createNeonHarborDetail()
      : movieid === 4402
        ? createQuietSignalDetail()
        : null;

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: readyAt,
    selectedMovieId: movieid,
    detail,
    lastError: null
  };
}

function createNeonHarborDetail(): VideoMovieDetailStoreSnapshot['detail'] {
  return {
    movieid: 4401,
    label: 'Neon Harbor',
    title: 'Neon Harbor',
    year: 2024,
    runtime: 6420,
    plot: 'A courier crosses a rain-lit city to protect a copied memory.',
    tagline: 'One night can rewrite a city.',
    genre: ['Science Fiction', 'Thriller'],
    director: ['Mara Voss'],
    studio: ['Signal House'],
    mpaa: 'PG-13',
    rating: 7.8,
    userrating: 8,
    premiered: '2024-10-12',
    uniqueid: { fixture: 'neon-harbor' },
    thumbnailAvailable: true,
    fanartAvailable: true,
    artwork: { poster: true, fanart: true },
    playcount: 1,
    lastplayed: '2026-04-29 21:15:00',
    resume: { position: 1830, total: 6420 },
    dateadded: '2026-04-28 10:00:00',
    watched: true,
    versions: {
      status: 'ready',
      selectedId: 2,
      items: [
        { id: 1, label: 'Theatrical cut' },
        { id: 2, label: 'Director commentary cut' }
      ]
    }
  };
}

function createQuietSignalDetail(): VideoMovieDetailStoreSnapshot['detail'] {
  return {
    movieid: 4402,
    label: 'Quiet Signal',
    title: 'Quiet Signal',
    year: 2025,
    runtime: 5940,
    plot: 'A field recordist follows a repeating number station into a remote valley.',
    tagline: 'Silence is never empty.',
    genre: ['Mystery'],
    director: ['Ilan Reed'],
    studio: ['Northline Pictures'],
    rating: 7.1,
    userrating: 7,
    thumbnailAvailable: true,
    fanartAvailable: false,
    artwork: { poster: true },
    playcount: 0,
    resume: { position: 1275, total: 5940 },
    dateadded: '2026-04-30 08:30:00',
    watched: false,
    versions: {
      status: 'unsupported',
      reason: 'Kodi movie versions are not available through the proven detail fixture.'
    }
  };
}

function createLocalPlayerSnapshot(route: VideoRoute): LocalPlayerStoreSnapshot {
  const movieid = route.kind === 'videoMovieStream' ? route.movieid : null;

  return {
    status: movieid === 4401 ? 'paused' : 'idle',
    mediaKind: 'video',
    item:
      movieid === 4401
        ? { movieid: 4401, label: 'Neon Harbor', title: 'Neon Harbor', type: 'movie' }
        : null,
    currentSeconds: movieid === 4401 ? 1830 : 0,
    durationSeconds: movieid === 4401 ? 6420 : null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: movieid === 4401,
    resumeAvailable: movieid === 4401,
    lastUpdatedAt: movieid === 4401 ? readyAt : null
  };
}

function createVideoNavigationDispatch(): VideoNavigationDispatch {
  return {
    openMovieGrid: noop,
    openMovieDetail: noop,
    openRoute: noop
  };
}

function createVideoMovieActionDispatch(): VideoMovieActionDispatch {
  return {
    playMovieItem: noop,
    resumeMovieItem: noop,
    queueMovieItem: noop
  };
}

function createVideoMovieStreamActionDispatch(): VideoMovieStreamDispatch {
  return {
    streamMovieItem: noop,
    resumeOnKodi: noop
  };
}

function readPathname(location: M004BrowserProofLocation | null | undefined): unknown {
  try {
    return location?.pathname;
  } catch {
    return undefined;
  }
}

function readSearch(location: M004BrowserProofLocation | null | undefined): unknown {
  try {
    return location?.search;
  } catch {
    return undefined;
  }
}

function collectFixtureText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'function') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(collectFixtureText).join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectFixtureText(nested)}`)
      .join('\n');
  }

  return '';
}
