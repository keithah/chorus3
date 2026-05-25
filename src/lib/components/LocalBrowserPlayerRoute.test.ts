import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LocalBrowserPlayerRoute, {
  type LocalBrowserPlayerDispatch
} from './LocalBrowserPlayerRoute.svelte';
import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

describe('LocalBrowserPlayerRoute', () => {
  it('renders Chorus2 popup video-player chrome instead of the app status screen', async () => {
    const dispatch: LocalBrowserPlayerDispatch = {
      streamMovieItem: vi.fn()
    };

    mounted = mount(LocalBrowserPlayerRoute, {
      target: document.body,
      props: {
        route: { kind: 'localPlayer', media: 'movie', id: 1 },
        localPlayerSnapshot: localSnapshot({
          status: 'playing',
          source: 'http://example.test/vfs/movie.mkv'
        }),
        dispatchSnapshot: dispatchSnapshot(),
        actionDispatch: dispatch
      }
    });
    await tick();

    const root = document.querySelector<HTMLElement>('.local-browser-player');
    expect(root).toBeInstanceOf(HTMLElement);
    expect(root?.getAttribute('aria-label')).toBe('Chorus video player');
    expect(root?.querySelector('.local-browser-player__header')).toBeNull();
    expect(document.body.textContent).not.toContain('BROWSER PLAYER');
    expect(document.body.textContent).not.toContain('Movie 1');

    const video = root?.querySelector<HTMLVideoElement>(
      'video.local-media-runtime.chorus2-popup-runtime'
    );
    expect(video).toBeInstanceOf(HTMLVideoElement);
    expect(video?.classList.contains('fullscreen')).toBe(false);
    expect(video?.dataset.localMediaVariant).toBe('inline');

    const selector = root?.querySelector<HTMLSelectElement>('#switch-player');
    expect(selector).toBeInstanceOf(HTMLSelectElement);
    expect(Array.from(selector!.options).map((option) => option.textContent)).toEqual(['html5']);
    expect(selector?.value).toBe('html5');

    const actions = root?.querySelector('#actions');
    expect(actions?.textContent?.replace(/\s+/gu, ' ').trim()).toBe('Download - Stream');
    expect(root?.querySelector<HTMLAnchorElement>('#download')?.href).toBe(
      'http://example.test/vfs/movie.mkv'
    );
    expect(root?.querySelector<HTMLAnchorElement>('#download')?.hasAttribute('download')).toBe(
      true
    );
    expect(root?.querySelector<HTMLAnchorElement>('#stream')?.href).toBe(
      'http://example.test/vfs/movie.mkv'
    );
    expect(root?.querySelector('[role="status"]')?.classList.contains('visually-hidden')).toBe(
      true
    );
    expect(dispatch.streamMovieItem).toHaveBeenCalledWith({ movieid: 1 });
  });

  it('keeps the Chorus2 player stage visible while Kodi is still preparing media', async () => {
    const dispatch: LocalBrowserPlayerDispatch = {
      streamMovieItem: vi.fn()
    };

    mounted = mount(LocalBrowserPlayerRoute, {
      target: document.body,
      props: {
        route: { kind: 'localPlayer', media: 'movie', id: 1 },
        localPlayerSnapshot: localSnapshot({
          status: 'loading',
          source: null
        }),
        dispatchSnapshot: dispatchSnapshot({ commandStatus: 'running' }),
        actionDispatch: dispatch
      }
    });
    await tick();

    const runtime = document.querySelector<HTMLElement>('.local-browser-player__runtime');
    const video = document.querySelector<HTMLVideoElement>(
      'video.local-media-runtime.chorus2-popup-runtime'
    );
    expect(runtime).toBeInstanceOf(HTMLElement);
    expect(video).toBeInstanceOf(HTMLVideoElement);
    expect(video?.hasAttribute('src')).toBe(false);
    expect(video?.classList.contains('fullscreen')).toBe(false);
    expect(video?.classList.contains('chorus2-popup-runtime--stage')).toBe(true);
    expect(runtime?.id).toBe('player');
  });

  it('labels music popup chrome as audio while keeping the html5-only Chorus2 actions', async () => {
    const dispatch: LocalBrowserPlayerDispatch = {
      playMusicItem: vi.fn()
    };

    mounted = mount(LocalBrowserPlayerRoute, {
      target: document.body,
      props: {
        route: { kind: 'localPlayer', media: 'music', musicKind: 'song', id: 176 },
        localPlayerSnapshot: localSnapshot({
          mediaKind: 'audio',
          status: 'playing',
          source: 'http://example.test/vfs/song.mp3'
        }),
        dispatchSnapshot: dispatchSnapshot(),
        actionDispatch: dispatch
      }
    });
    await tick();

    const root = document.querySelector<HTMLElement>('.local-browser-player');
    expect(root?.getAttribute('aria-label')).toBe('Chorus audio player');
    expect(root?.querySelector<HTMLAnchorElement>('#download')?.title).toBe(
      'Force download of this audio'
    );
    expect(root?.querySelector<HTMLAnchorElement>('#stream')?.title).toContain('Navigate to audio');
    expect(
      Array.from(root?.querySelector<HTMLSelectElement>('#switch-player')?.options ?? []).map(
        (option) => option.textContent
      )
    ).toEqual(['html5']);
    expect(dispatch.playMusicItem).toHaveBeenCalledWith({ kind: 'song', songid: 176 });
  });
});

function localSnapshot(
  overrides: Partial<LocalPlayerStoreSnapshot> = {}
): LocalPlayerStoreSnapshot {
  return {
    status: 'idle',
    mediaKind: 'video',
    source: null,
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

function dispatchSnapshot(overrides: Partial<PlayerDispatchSnapshot> = {}): PlayerDispatchSnapshot {
  return {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    mode: 'kodi',
    ...overrides
  };
}
