import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoMovieStreamShell, {
  type VideoMovieStreamDispatch
} from './VideoMovieStreamShell.svelte';
import { createTranslationContext } from '$lib/i18n';
import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';
import type { VideoLibraryStoreSnapshot } from '$lib/stores/videoLibrary.svelte';
import type { VideoMovieDetailStoreSnapshot } from '$lib/stores/videoMovieDetailStore.svelte';
import type { VideoRoute } from '$lib/video/videoRouter';

type MountedComponent = ReturnType<typeof mount>;
type VideoSnapshotOverrides = Omit<Partial<VideoLibraryStoreSnapshot>, 'limits'> & {
  limits?: Partial<VideoLibraryStoreSnapshot['limits']>;
};

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createVideoSnapshot(overrides: VideoSnapshotOverrides = {}): VideoLibraryStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    movies: [],
    tvShows: [],
    recentlyAddedMovies: [],
    recentlyPlayedMovies: [],
    recentlyAddedEpisodes: [],
    recentlyPlayedEpisodes: [],
    isEmpty: true,
    lastError: null,
    ...overrides,
    limits: {
      movies: { start: 0, end: 0, total: 0 },
      tvShows: { start: 0, end: 0, total: 0 },
      recentlyAddedMovies: { start: 0, end: 0, total: 0 },
      recentlyPlayedMovies: { start: 0, end: 0, total: 0 },
      recentlyAddedEpisodes: { start: 0, end: 0, total: 0 },
      recentlyPlayedEpisodes: { start: 0, end: 0, total: 0 },
      ...overrides.limits
    }
  };
}

function populatedSnapshot(overrides: VideoSnapshotOverrides = {}): VideoLibraryStoreSnapshot {
  return createVideoSnapshot({
    isEmpty: false,
    movies: [
      {
        movieid: 4401,
        label: 'Big Buck Bunny',
        title: 'Big Buck Bunny',
        year: 2008,
        runtime: 596,
        playcount: 0,
        watched: false,
        resume: { position: 123, total: 596 },
        art: { poster: 'image://poster-bunny/', fanart: 'image://fanart-bunny/' }
      },
      {
        movieid: 777,
        label: 'No Resume Movie',
        title: 'No Resume Movie',
        year: 2026,
        runtime: 3600,
        resume: { position: 0, total: 3600 }
      }
    ],
    limits: { movies: { start: 0, end: 2, total: 2 } },
    ...overrides
  });
}

function createMovieDetailSnapshot(
  overrides: Partial<VideoMovieDetailStoreSnapshot> = {}
): VideoMovieDetailStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    selectedMovieId: 4401,
    detail: {
      movieid: 4401,
      label: 'Big Buck Bunny',
      title: 'Big Buck Bunny',
      year: 2008,
      runtime: 596,
      plot: 'A safe browser proof movie.',
      tagline: '',
      genre: ['Animation'],
      director: ['Blender Foundation'],
      studio: ['Blender Institute'],
      rating: 7.1,
      userrating: 8,
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: { poster: true, fanart: true },
      playcount: 0,
      watched: false,
      resume: { position: 123, total: 596 },
      versions: { status: 'unavailable', reason: 'No safe movie versions are available.' }
    },
    lastError: null,
    ...overrides
  };
}

function createLocalPlayerSnapshot(
  overrides: Partial<LocalPlayerStoreSnapshot> = {}
): LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'video',
    item: null,
    currentSeconds: 0,
    durationSeconds: null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null,
    ...overrides
  };
}

function createDispatchSnapshot(
  overrides: Partial<PlayerDispatchSnapshot> = {}
): PlayerDispatchSnapshot {
  return {
    mode: 'kodi',
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

function createDispatch(
  overrides: Partial<VideoMovieStreamDispatch> = {}
): VideoMovieStreamDispatch {
  return {
    streamMovieItem: vi.fn(async () => undefined),
    resumeOnKodi: vi.fn(async () => undefined),
    ...overrides
  };
}

function renderShell(
  props: {
    snapshot?: VideoLibraryStoreSnapshot;
    detailSnapshot?: VideoMovieDetailStoreSnapshot;
    route?: VideoRoute;
    localPlayerSnapshot?: LocalPlayerStoreSnapshot;
    dispatchSnapshot?: PlayerDispatchSnapshot;
    actionDispatch?: VideoMovieStreamDispatch;
    i18n?: ReturnType<typeof createTranslationContext>;
  } = {}
): void {
  mounted = mount(VideoMovieStreamShell, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? populatedSnapshot(),
      detailSnapshot: props.detailSnapshot ?? createMovieDetailSnapshot(),
      route: props.route ?? { kind: 'videoMovieStream', movieid: 4401 },
      localPlayerSnapshot: props.localPlayerSnapshot ?? createLocalPlayerSnapshot(),
      dispatchSnapshot: props.dispatchSnapshot ?? createDispatchSnapshot(),
      actionDispatch: props.actionDispatch ?? createDispatch(),
      ...(props.i18n ? { i18n: props.i18n } : {})
    }
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function getButton(name: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll('button')).find(
    (entry) => entry.textContent?.trim() === name || entry.getAttribute('aria-label') === name
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('special://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('file://');
  expect(value).not.toContain('/vfs/');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('SENTINEL_SECRET');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
}

describe('VideoMovieStreamShell', () => {
  it('renders German localized stream status, actions, not-found state, and rejected diagnostics', async () => {
    const actionDispatch = createDispatch({
      streamMovieItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/vfs/movie.mkv from localStorage'
        );
      })
    });
    renderShell({
      actionDispatch,
      i18n: createTranslationContext('de'),
      localPlayerSnapshot: createLocalPlayerSnapshot({
        status: 'paused',
        currentSeconds: 123,
        resumeAvailable: true,
        kodiPausedForLocal: true
      })
    });

    let text = screenText();
    expect(text).toContain('Zurück zu Details');
    expect(text).toContain('Browser-Stream');
    expect(text).toContain('Lokale Browser-Wiedergabe ist pausiert.');
    expect(text).toContain('Fortsetzungspunkt verfügbar bei 2:03.');
    expect(getButton('Im Browser wiedergeben').disabled).toBe(false);
    expect(getButton('Im Browser fortsetzen').disabled).toBe(false);
    expect(getButton('Erneut versuchen').disabled).toBe(false);
    expect(getButton('An Kodi senden').disabled).toBe(false);

    getButton('Erneut versuchen').click();
    await tick();
    await tick();

    text = screenText();
    expect(text).toContain('Browser-Wiedergabe für Big Buck Bunny konnte nicht gestartet werden.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('[redacted-url]');
    expect(text).toContain('browser storage');
    expectSecretSafe(text);

    document.body.innerHTML = '';
    if (mounted) {
      unmount(mounted);
      mounted = null;
    }

    renderShell({ route: { kind: 'videoMovieStream', movieid: 999 }, i18n: createTranslationContext('de') });
    text = screenText();
    expect(text).toContain('Filmstream nicht verfügbar');
    expect(text).toContain('Film-ID 999 ist in diesem Snapshot nicht vorhanden.');
    expectSecretSafe(text);
  });

  it('renders a full-viewport streaming shell with safe title, Local runtime, and recovery controls', () => {
    renderShell({
      localPlayerSnapshot: createLocalPlayerSnapshot({
        status: 'paused',
        item: { movieid: 4401, label: 'Big Buck Bunny', title: 'Big Buck Bunny', type: 'movie' },
        currentSeconds: 123,
        durationSeconds: 596,
        resumeAvailable: true,
        kodiPausedForLocal: true
      })
    });

    const text = screenText();
    const shell = document.querySelector('.video-movie-stream-shell');
    expect(shell?.getAttribute('aria-labelledby')).toBe('video-movie-stream-title');
    expect(shell?.classList.contains('fullscreen')).toBe(true);
    expect(document.querySelector('#video-movie-stream-title')?.textContent).toContain(
      'Big Buck Bunny'
    );
    expect(
      document.querySelector(
        '.stream-artwork-frame[aria-label="Safe movie stream artwork summary"]'
      )
    ).not.toBeNull();
    expect(document.querySelector('.stream-poster-frame[aria-hidden="true"]')).not.toBeNull();
    expect(text).toContain('Poster-led stream surface');
    expect(
      document.querySelector<HTMLAnchorElement>('a[href="/video/movies/4401"]')?.textContent
    ).toContain('Back to details');
    expect(document.querySelector('video.local-media-runtime.fullscreen')).not.toBeNull();
    expect(
      document.querySelector<HTMLVideoElement>('video.local-media-runtime')?.dataset
        .localMediaVariant
    ).toBe('fullscreen');
    expect(getButton('Play in browser').disabled).toBe(false);
    expect(getButton('Resume in browser').disabled).toBe(false);
    expect(getButton('Retry').disabled).toBe(false);
    expect(getButton('Send to Kodi').disabled).toBe(false);
    expect(document.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(text).toContain('Local browser playback is paused.');
    expect(text).toContain('Resume point available at 2:03.');
    expectSecretSafe(text);
  });

  it('hides the resume-in-browser action when no resume state exists', () => {
    renderShell({ route: { kind: 'videoMovieStream', movieid: 777 } });

    expect(screenText()).toContain('No Resume Movie');
    expect(
      Array.from(document.querySelectorAll('button')).map((button) => button.textContent?.trim())
    ).toEqual(['Play in browser', 'Retry', 'Send to Kodi']);
  });

  it('routes play resume retry and Send to Kodi actions through injected dispatch only', async () => {
    const actionDispatch = createDispatch();
    renderShell({
      actionDispatch,
      localPlayerSnapshot: createLocalPlayerSnapshot({
        resumeAvailable: true,
        kodiPausedForLocal: true
      })
    });

    getButton('Play in browser').click();
    await tick();
    await tick();
    getButton('Resume in browser').click();
    await tick();
    await tick();
    getButton('Retry').click();
    await tick();
    await tick();
    getButton('Send to Kodi').click();
    await tick();
    await tick();

    expect(actionDispatch.streamMovieItem).toHaveBeenNthCalledWith(1, { movieid: 4401 });
    expect(actionDispatch.streamMovieItem).toHaveBeenNthCalledWith(2, {
      movieid: 4401,
      resume: true
    });
    expect(actionDispatch.streamMovieItem).toHaveBeenNthCalledWith(3, { movieid: 4401 });
    expect(actionDispatch.resumeOnKodi).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Sent playback back to Kodi.'
    );
  });

  it('disables duplicate commands while an action is pending and announces progress', async () => {
    let resolveStream: () => void = () => {
      throw new Error('stream resolver was not assigned');
    };
    const actionDispatch = createDispatch({
      streamMovieItem: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveStream = resolve;
          })
      )
    });
    renderShell({ actionDispatch });

    getButton('Play in browser').click();
    await tick();

    expect(getButton('Play in browser').disabled).toBe(true);
    expect(getButton('Resume in browser').disabled).toBe(true);
    expect(getButton('Retry').disabled).toBe(true);
    expect(getButton('Send to Kodi').disabled).toBe(true);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Starting browser playback for Big Buck Bunny…'
    );

    resolveStream();
    await tick();
    await tick();

    expect(getButton('Play in browser').disabled).toBe(false);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Browser playback started for Big Buck Bunny.'
    );
  });

  it('renders sanitized dispatch and Local fallback errors with retry and Send-to-Kodi recovery', async () => {
    const actionDispatch = createDispatch({
      streamMovieItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/vfs/movie.mkv from localStorage and smb://nas/private/movie.mkv'
        );
      })
    });
    renderShell({
      actionDispatch,
      localPlayerSnapshot: createLocalPlayerSnapshot({
        status: 'error',
        lastError: {
          code: 'media/play-rejected',
          message:
            'HTMLMediaElement play rejected for https://admin:p@ssword@example.test/vfs/movie.mkv from sessionStorage'
        },
        resumeAvailable: true,
        kodiPausedForLocal: true
      }),
      dispatchSnapshot: createDispatchSnapshot({
        commandStatus: 'error',
        lastCommand: 'streamMovieItem',
        lastError: {
          source: 'command',
          code: 'command/prepare-download-failed',
          message: 'Prepare failed for special://profile/SENTINEL_SECRET/movie.mkv'
        },
        lastCompletedAt: '2026-05-01T08:01:00.000Z'
      })
    });

    const initialText = screenText();
    expect(initialText).toContain('Browser playback needs attention.');
    expect(initialText).toContain('Retry');
    expect(initialText).toContain('Send to Kodi');
    expect(initialText).toContain('[path]');
    expectSecretSafe(initialText);

    getButton('Retry').click();
    await tick();
    await tick();

    const text = screenText();
    expect(text).toContain('Could not start browser playback for Big Buck Bunny.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('[redacted-url]');
    expect(text).toContain('browser storage');
    expectSecretSafe(text);
  });

  it('renders a safe not-found state for invalid or unavailable movie stream routes', () => {
    renderShell({ route: { kind: 'videoMovieStream', movieid: 999 } });

    const text = screenText();
    expect(text).toContain('Movie stream unavailable');
    expect(text).toContain('Movie ID 999 is not present in this snapshot.');
    expect(document.querySelector('video')).toBeNull();
    expect(document.querySelectorAll('button')).toHaveLength(0);
    expectSecretSafe(text);
  });
});
