import type {
  VideoLibraryMovieSnapshot,
  VideoLibraryStoreSnapshot
} from '$lib/stores/videoLibrary.svelte';
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
  videoNavigationDispatch: VideoNavigationDispatch;
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
  return {
    route: parseVideoRoute(readPathname(location), readSearch(location)),
    videoLibrarySnapshot: createVideoLibrarySnapshot(),
    videoNavigationDispatch: createVideoNavigationDispatch()
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
      resume: { position: 0, total: 6420 },
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
    limits: { movies: { start: 0, end: movies.length, total: movies.length } },
    isEmpty: false,
    lastError: null
  };
}

function createVideoNavigationDispatch(): VideoNavigationDispatch {
  return {
    openMovieGrid: noop,
    openMovieDetail: noop,
    openRoute: noop
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
