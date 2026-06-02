import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PlaylistsPage, { type LocalPlaylistPageActions } from './PlaylistsPage.svelte';
import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
import type { BuildAppRouteOptions } from '$lib/app/appRouter';
import type { TranslationContext } from '$lib/i18n';
import type {
  LocalPlaylistDispatch,
  LocalPlaylistMutationResult,
  LocalPlaylistPlayableItem,
  LocalPlaylistSnapshot,
  LocalPlaylistStoreSnapshot,
  MediaPlaylistsStoreSnapshot
} from '$lib/stores';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  cleanupMounted();
});

function cleanupMounted(): void {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  window.location.hash = '';
}

function playlist(id: string, label: string): LocalPlaylistSnapshot {
  return {
    id,
    label,
    items: [
      {
        id: 'item-1',
        kind: 'audio',
        label: 'North By Northwest',
        position: 0,
        durationSeconds: 268,
        addedAt: '2026-05-04T10:01:00.000Z'
      }
    ],
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T10:05:00.000Z'
  };
}

function playableItems(): LocalPlaylistPlayableItem[] {
  return [
    {
      id: 'item-1',
      kind: 'audio',
      label: 'North By Northwest',
      file: 'smb://nas/private/North.flac',
      position: 0,
      durationSeconds: 268
    }
  ];
}

function createLocalSnapshot(
  selectedPlaylist: LocalPlaylistSnapshot | null = playlist('playlist-bayani', 'Bayani')
): LocalPlaylistStoreSnapshot {
  const playlists = selectedPlaylist ? [selectedPlaylist] : [];
  return {
    playlists,
    selectedPlaylistId: selectedPlaylist?.id ?? null,
    selectedPlaylist,
    playlistCount: playlists.length,
    selectedItemCount: selectedPlaylist?.items.length ?? 0,
    mutationStatus: 'idle',
    lastMutation: null,
    validationErrors: {},
    storageWarning: null,
    lastError: null,
    lastUpdatedAt: '2026-05-04T10:05:00.000Z'
  };
}

function ok<T extends object>(value: T): LocalPlaylistMutationResult<T> {
  return { ok: true, ...value };
}

function createDispatch(): LocalPlaylistDispatch {
  return {
    createPlaylist: vi.fn((label: string) => ok({ playlist: playlist('playlist-new', label) })),
    renamePlaylist: vi.fn(() => ok({ playlist: playlist('playlist-bayani', 'Renamed') })),
    removePlaylist: vi.fn(() => ok({})),
    selectPlaylist: vi.fn((playlistId: string) => ok({ playlist: playlist(playlistId, 'Bayani') })),
    clearPlaylist: vi.fn(() => ok({})),
    addItems: vi.fn(() => ok({ items: [] })),
    removeItem: vi.fn(() => ok({})),
    moveItem: vi.fn(() => ok({})),
    reorderItems: vi.fn(() => ok({})),
    getPlayableItems: vi.fn(() => playableItems()),
    reset: vi.fn()
  };
}

function createMediaSnapshot(): MediaPlaylistsStoreSnapshot {
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    media: 'music',
    playlists: [],
    entries: [],
    breadcrumbs: [],
    isEmpty: true,
    lastError: null
  };
}

function renderPage(
  localPlaylistSnapshot = createLocalSnapshot(),
  localPlaylistActions?: LocalPlaylistPageActions,
  buildOptions?: BuildAppRouteOptions
): {
  target: HTMLElement;
  dispatch: LocalPlaylistDispatch;
  mediaDispatch: MediaPlaylistsPanelDispatch;
} {
  document.body.innerHTML = '<div id="target"></div>';
  const target = document.getElementById('target');
  expect(target).toBeInstanceOf(HTMLElement);
  const dispatch = createDispatch();
  const mediaDispatch = {
    refresh: vi.fn().mockResolvedValue(undefined),
    openPlaylist: vi.fn(),
    openBreadcrumb: vi.fn()
  };

  mounted = mount(PlaylistsPage, {
    target: target as HTMLElement,
    props: {
      snapshot: createMediaSnapshot(),
      dispatch: mediaDispatch,
      actionDispatch: {
        playPlaylistItem: vi.fn(),
        queuePlaylistItem: vi.fn()
      },
      localPlaylistSnapshot,
      localPlaylistDispatch: dispatch,
      localPlaylistActions,
      i18n: { t: (key: string) => key } as TranslationContext,
      buildOptions
    }
  });
  flushSync();

  return { target: target as HTMLElement, dispatch, mediaDispatch };
}

describe('PlaylistsPage', () => {
  it('loads Kodi playlists automatically on first visit', async () => {
    const { mediaDispatch } = renderPage();
    await Promise.resolve();
    flushSync();

    expect(mediaDispatch.refresh).toHaveBeenCalledTimes(1);
  });

  it('renders the Chorus2 local playlist layout without the Chorus3 hero shell', () => {
    const { target } = renderPage();

    expect(target.querySelector('.classic-local-playlists')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.local-playlists-sidebar')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.local-playlist-header h2')?.textContent).toBe('Bayani');
    expect(target.textContent).toContain('North By Northwest');
    expect(target.textContent).not.toContain('Playlist library');
    expect(target.textContent).not.toContain('Media Playlists');
    expect(target.textContent).not.toContain('smb://');
  });

  it('runs Chorus2 local playlist menu actions with private playable items', async () => {
    const actions: LocalPlaylistPageActions = {
      playInKodi: vi.fn(),
      playInBrowser: vi.fn(),
      exportList: vi.fn()
    };
    let { target } = renderPage(createLocalSnapshot(), actions);

    const menuButton = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Playlist actions"]'
    );
    expect(menuButton).toBeInstanceOf(HTMLButtonElement);
    menuButton!.click();
    flushSync();

    const menuButtons = Array.from(
      target.querySelectorAll<HTMLButtonElement>('.dropdown-menu button')
    );
    const playKodi = menuButtons.find((button) => button.textContent === 'Play in Kodi');
    const playBrowser = menuButtons.find((button) => button.textContent === 'Play in browser');
    const exportList = menuButtons.find((button) => button.textContent === 'Export list');
    expect(playKodi).toBeInstanceOf(HTMLButtonElement);
    expect(playBrowser).toBeInstanceOf(HTMLButtonElement);
    expect(exportList).toBeInstanceOf(HTMLButtonElement);

    playKodi!.click();
    await Promise.resolve();
    flushSync();
    expect(actions.playInKodi).toHaveBeenCalledWith('playlist-bayani', playableItems());

    cleanupMounted();
    ({ target } = renderPage(createLocalSnapshot(), actions));
    const browserMenuButton = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Playlist actions"]'
    );
    expect(browserMenuButton).toBeInstanceOf(HTMLButtonElement);
    browserMenuButton!.click();
    flushSync();
    target.querySelectorAll<HTMLButtonElement>('.dropdown-menu button').forEach((button) => {
      if (button.textContent === 'Play in browser') {
        button.click();
      }
    });
    await Promise.resolve();
    flushSync();
    expect(actions.playInBrowser).toHaveBeenCalledWith('playlist-bayani', playableItems());

    cleanupMounted();
    ({ target } = renderPage(createLocalSnapshot(), actions));
    const exportMenuButton = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Playlist actions"]'
    );
    expect(exportMenuButton).toBeInstanceOf(HTMLButtonElement);
    exportMenuButton!.click();
    flushSync();
    target.querySelectorAll<HTMLButtonElement>('.dropdown-menu button').forEach((button) => {
      if (button.textContent === 'Export list') {
        button.click();
      }
    });
    expect(actions.exportList).toHaveBeenCalledWith('playlist-bayani', 'Bayani', playableItems());
    expect(target.textContent).not.toContain('smb://');
  });

  it('creates a playlist and routes to the standalone playlist detail path', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);
    const { target, dispatch } = renderPage(createLocalSnapshot(null));
    const input = target.querySelector<HTMLInputElement>('input[aria-label="New playlist name"]');
    const button = target.querySelector<HTMLButtonElement>('button.new-list');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(button).toBeInstanceOf(HTMLButtonElement);

    input!.value = 'Road queue';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    button!.click();

    expect(dispatch.createPlaylist).toHaveBeenCalledWith('Road queue');
    expect(pushState).toHaveBeenCalledWith({}, '', '/playlist/playlist-new');
    expect(popstate).toHaveBeenCalledTimes(1);

    window.removeEventListener('popstate', popstate);
    pushState.mockRestore();
  });

  it('creates a playlist and routes to the package playlist detail hash in hash mode', () => {
    const { target, dispatch } = renderPage(createLocalSnapshot(null), undefined, {
      routeMode: 'hash',
      packageBasePath: '/addons/webinterface.chorus3'
    });
    const input = target.querySelector<HTMLInputElement>('input[aria-label="New playlist name"]');
    const button = target.querySelector<HTMLButtonElement>('button.new-list');

    input!.value = 'Road queue';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    button!.click();

    expect(dispatch.createPlaylist).toHaveBeenCalledWith('Road queue');
    expect(window.location.hash).toBe('#playlist/playlist-new');
  });
});
