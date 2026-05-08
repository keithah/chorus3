import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaPlaylistsPanel, {
  type MediaPlaylistsActionDispatch,
  type MediaPlaylistsPanelDispatch
} from './MediaPlaylistsPanel.svelte';
import type { MediaPlaylistsStoreSnapshot } from '$lib/stores/mediaPlaylists.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createSnapshot(
  overrides: Partial<MediaPlaylistsStoreSnapshot> = {}
): MediaPlaylistsStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'playlist:1',
    lastUpdatedAt: '2026-04-30T12:00:00.000Z',
    media: 'music',
    playlists: [
      {
        id: 'playlist:1',
        label: 'Favorites',
        media: 'music',
        kind: 'smart',
        extension: 'xsp',
        capabilities: { canBrowse: true, canPlay: true, canQueue: true }
      },
      {
        id: 'playlist:2',
        label: 'Party mix',
        media: 'music',
        kind: 'basic',
        extension: 'm3u',
        capabilities: { canBrowse: false, canPlay: true, canQueue: true }
      }
    ],
    breadcrumbs: [{ id: 'playlist:1', label: 'Favorites' }],
    entries: [
      {
        id: 'entry:1',
        label: 'Sinnerman.flac',
        mediaKind: 'audio',
        extension: 'flac',
        capabilities: { canPlay: true, canQueue: true }
      },
      {
        id: 'entry:2',
        label: 'cover.jpg',
        mediaKind: 'unsupported',
        extension: 'jpg',
        capabilities: { canPlay: false, canQueue: false }
      }
    ],
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function createEmptySnapshot(
  overrides: Partial<MediaPlaylistsStoreSnapshot> = {}
): MediaPlaylistsStoreSnapshot {
  return createSnapshot({
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    playlists: [],
    breadcrumbs: [],
    entries: [],
    isEmpty: true,
    lastError: null,
    ...overrides
  });
}

function createDispatch(
  overrides: Partial<MediaPlaylistsPanelDispatch> = {}
): MediaPlaylistsPanelDispatch {
  return {
    refresh: vi.fn(),
    openPlaylist: vi.fn(),
    openBreadcrumb: vi.fn(),
    ...overrides
  };
}

function createActionDispatch(
  overrides: Partial<MediaPlaylistsActionDispatch> = {}
): MediaPlaylistsActionDispatch {
  return {
    playPlaylistItem: vi.fn(),
    queuePlaylistItem: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: {
    snapshot?: MediaPlaylistsStoreSnapshot;
    dispatch?: MediaPlaylistsPanelDispatch;
    actionDispatch?: MediaPlaylistsActionDispatch;
  } = {}
): { dispatch: MediaPlaylistsPanelDispatch; actionDispatch: MediaPlaylistsActionDispatch } {
  const dispatch = props.dispatch ?? createDispatch();
  const actionDispatch = props.actionDispatch ?? createActionDispatch();
  mounted = mount(MediaPlaylistsPanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      actionDispatch
    }
  });
  return { dispatch, actionDispatch };
}

function resetMounted(): void {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function statusText(): string {
  return document.querySelector('[role="status"]')?.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (b) => b.getAttribute('aria-label') === labelOrText || b.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    const found = Array.from(document.querySelectorAll('button'))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())
      .join(', ');
    throw new Error(`Button not found: "${labelOrText}". Found: ${found}`);
  }
  return match;
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('.xsp');
  expect(value).not.toContain('special://');
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
  expect(value).not.toContain('raw response body');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
}

function playlistPayload(id: string, label: string, media: 'music' | 'video' = 'music') {
  return {
    id,
    label,
    media,
    kind: 'smart',
    capabilities: { canBrowse: true, canPlay: true, canQueue: true }
  };
}

describe('MediaPlaylistsPanel', () => {
  it('renders an accessible playlist browser with playlists, breadcrumbs, entries, and live status', () => {
    renderPanel();

    const region = document.querySelector('section[aria-labelledby="media-playlists-title"]');
    expect(region).not.toBeNull();
    expect(document.querySelector('#media-playlists-title')?.textContent).toContain(
      'Media Playlists'
    );
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');

    const text = screenText();
    expect(statusText()).toContain('Showing music playlists. 2 playlists, 2 entries.');
    expect(text).toContain('Music playlists');
    expect(text).toContain('Favorites');
    expect(text).toContain('Smart playlist');
    expect(text).toContain('Party mix');
    expect(text).toContain('Can play and queue');
    expect(text).toContain('Breadcrumbs');
    expect(text).toContain('Sinnerman.flac');
    expect(text).toContain('Audio entry');
    expect(text).toContain('cover.jpg');
    expect(text).toContain('Unsupported entry');
    expect(text).toContain('Last updated 2026-04-30T12:00:00.000Z.');
    expectSecretSafe(text);
  });

  it('routes refresh, open, breadcrumb, play, and queue clicks through injected dispatch only', async () => {
    const { dispatch, actionDispatch } = renderPanel();

    button('Refresh media playlists').click();
    await tick();
    button('Open playlist Favorites').click();
    await tick();
    button('Open breadcrumb Favorites').click();
    await tick();
    button('Play playlist Favorites').click();
    await tick();
    await tick();
    button('Queue playlist Favorites').click();
    await tick();

    expect(dispatch.refresh).toHaveBeenCalledTimes(1);
    expect(dispatch.openPlaylist).toHaveBeenCalledWith('playlist:1');
    expect(dispatch.openBreadcrumb).toHaveBeenCalledWith('playlist:1');
    expect(actionDispatch.playPlaylistItem).toHaveBeenCalledWith(
      playlistPayload('playlist:1', 'Favorites')
    );
    expect(actionDispatch.queuePlaylistItem).toHaveBeenCalledWith(
      playlistPayload('playlist:1', 'Favorites')
    );
  });

  it('renders loading, empty, and sanitized error lifecycle states while preserving previous data', () => {
    renderPanel({ snapshot: createEmptySnapshot() });
    expect(statusText()).toContain('Load Kodi music playlists.');
    expect(screenText()).toContain('No music playlists loaded yet.');

    resetMounted();

    renderPanel({ snapshot: createEmptySnapshot({ refreshStatus: 'loading' }) });
    expect(statusText()).toContain('Loading music playlists…');
    expect(button('Refresh media playlists').disabled).toBe(true);

    resetMounted();

    renderPanel({
      snapshot: createEmptySnapshot({
        refreshStatus: 'ready',
        playlists: [],
        entries: [],
        isEmpty: true
      })
    });
    expect(statusText()).toContain('No music playlists found.');
    expect(screenText()).toContain('No music playlists are available.');

    resetMounted();

    renderPanel({
      snapshot: createSnapshot({
        refreshStatus: 'error',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with localStorage raw response body smb://nas/private/Favorites.xsp'
        }
      })
    });
    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expect(screenText()).toContain('Favorites');
    expect(screenText()).toContain('Sinnerman.flac');
    expectSecretSafe(screenText());
  });

  it('sanitizes hostile labels and uses safe fallbacks without rendering raw paths or credentials', () => {
    renderPanel({
      snapshot: createSnapshot({
        playlists: [
          {
            id: 'playlist:1',
            label: 'smb://admin:p@ssword@nas/private/Favorites.xsp',
            media: 'music',
            kind: 'smart',
            extension: 'xsp',
            capabilities: { canBrowse: true, canPlay: true, canQueue: true }
          },
          {
            id: 'playlist:2',
            label: '',
            media: 'music',
            kind: 'basic',
            extension: 'm3u',
            capabilities: { canBrowse: false, canPlay: false, canQueue: false }
          },
          {
            id: 'playlist:2',
            label: 'Authorization: Basic abc123',
            media: 'music',
            kind: 'unsupported',
            capabilities: { canBrowse: false, canPlay: false, canQueue: false }
          }
        ],
        breadcrumbs: [
          { id: 'playlist:1', label: 'http://admin:p@ssword@example.test/Favorites.xsp' }
        ],
        entries: [
          {
            id: 'entry:1',
            label: '/mnt/media/secret.flac',
            mediaKind: 'audio',
            extension: 'flac',
            capabilities: { canPlay: true, canQueue: true }
          },
          {
            id: 'entry:2',
            label: 'C:\\music\\secret.jpg',
            mediaKind: 'unsupported',
            capabilities: { canPlay: false, canQueue: false }
          }
        ]
      })
    });

    const text = screenText();
    expect(text).toContain('Playlist 1');
    expect(text).toContain('Playlist 2');
    expect(text).toContain('Location 1');
    expect(text).toContain('Audio entry 1');
    expect(text).toContain('Entry 2');
    expect(text).toContain('credentials [redacted]');
    expectSecretSafe(text);
  });

  it('renders play and queue for standard playlist files but not missing-capability playlists', () => {
    renderPanel({
      snapshot: createSnapshot({
        playlists: [
          {
            id: 'playlist:1',
            label: 'Playable',
            media: 'music',
            kind: 'smart',
            capabilities: { canBrowse: true, canPlay: true, canQueue: true }
          },
          {
            id: 'playlist:2',
            label: 'Basic list',
            media: 'music',
            kind: 'basic',
            extension: 'm3u',
            capabilities: { canBrowse: false, canPlay: true, canQueue: true }
          },
          {
            id: '',
            label: 'Missing id',
            media: 'music',
            kind: 'smart',
            capabilities: { canBrowse: true, canPlay: true, canQueue: true }
          }
        ],
        entries: []
      })
    });

    expect(button('Play playlist Playable').disabled).toBe(false);
    expect(button('Queue playlist Playable').disabled).toBe(false);
    expect(button('Play playlist Basic list').disabled).toBe(false);
    expect(button('Queue playlist Basic list').disabled).toBe(false);

    const labels = Array.from(document.querySelectorAll('button')).map(
      (node) => node.getAttribute('aria-label') ?? node.textContent ?? ''
    );
    expect(labels.some((label) => label === 'Play playlist Missing id')).toBe(false);
    expect(labels.some((label) => label === 'Queue playlist Missing id')).toBe(false);
  });

  it('disables same-target duplicate actions while pending and reports sanitized action rejection copy', async () => {
    let resolveAction: (() => void) | undefined;
    const actionDispatch = createActionDispatch({
      playPlaylistItem: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve;
          })
      ),
      queuePlaylistItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with sessionStorage raw response body and smb://nas/private/Favorites.xsp'
        );
      })
    });

    renderPanel({ actionDispatch });

    const play = button('Play playlist Favorites');
    const queue = button('Queue playlist Favorites');
    play.click();
    await tick();

    expect(play.disabled).toBe(true);
    expect(queue.disabled).toBe(true);
    expect(statusText()).toContain('Playing playlist Favorites…');
    play.click();
    expect(actionDispatch.playPlaylistItem).toHaveBeenCalledTimes(1);

    resolveAction?.();
    await tick();
    await tick();

    expect(play.disabled).toBe(false);
    expect(statusText()).toContain('Played playlist Favorites.');

    queue.click();
    await tick();
    await tick();

    const text = screenText();
    expect(statusText()).toContain('Could not queue playlist Favorites.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('browser storage');
    expect(text).toContain('response body [redacted]');
    expect(queue.disabled).toBe(false);
    expectSecretSafe(text);
  });

  it('recovers browse controls after rejected refresh and open callbacks with sanitized errors', async () => {
    const dispatch = createDispatch({
      refresh: vi.fn(async () => {
        throw new Error(
          'Refresh failed at http://admin:p@ssword@example.test/jsonrpc with localStorage raw response body'
        );
      }),
      openPlaylist: vi.fn(async () => {
        throw new Error('Open failed for smb://nas/private with Authorization: Basic abc123');
      })
    });

    renderPanel({ dispatch });

    button('Refresh media playlists').click();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not refresh media playlists.');
    expect(statusText()).toContain('browser storage');
    expect(button('Refresh media playlists').disabled).toBe(false);
    expectSecretSafe(screenText());

    button('Open playlist Favorites').click();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not open playlist Favorites.');
    expect(statusText()).toContain('credentials [redacted]');
    expect(button('Open playlist Favorites').disabled).toBe(false);
    expectSecretSafe(screenText());
  });

  it('renders video playlists with playable actions, video entry metadata, and opaque navigation ids', async () => {
    const { dispatch, actionDispatch } = renderPanel({
      snapshot: createSnapshot({
        media: 'video',
        playlists: [
          {
            id: 'playlist:video:1',
            label: 'Recently Added Movies',
            media: 'video',
            kind: 'smart',
            extension: 'xsp',
            capabilities: { canBrowse: true, canPlay: true, canQueue: true }
          }
        ],
        breadcrumbs: [{ id: 'playlist:video:1', label: 'Recently Added Movies' }],
        entries: [
          {
            id: 'entry:1',
            label: 'Movie.mkv',
            mediaKind: 'video',
            extension: 'mkv',
            capabilities: { canPlay: true, canQueue: true }
          },
          {
            id: 'entry:2',
            label: 'notes.txt',
            mediaKind: 'unsupported',
            extension: 'txt',
            capabilities: { canPlay: false, canQueue: false }
          }
        ]
      })
    });

    const text = screenText();
    expect(statusText()).toContain('Showing video playlists. 1 playlist, 2 entries.');
    expect(text).toContain('Video playlists');
    expect(text).toContain('Recently Added Movies');
    expect(text).toContain('Can open, play, and queue');
    expect(text).toContain('Movie.mkv');
    expect(text).toContain('Video entry');
    expect(text).toContain('Playable video item from the opened playlist');
    expect(text).toContain('notes.txt');
    expect(text).toContain('Unsupported entry');
    expectSecretSafe(text);

    button('Open playlist Recently Added Movies').click();
    await tick();
    button('Open breadcrumb Recently Added Movies').click();
    await tick();
    button('Play playlist Recently Added Movies').click();
    await tick();
    await tick();
    button('Queue playlist Recently Added Movies').click();
    await tick();
    await tick();

    expect(dispatch.openPlaylist).toHaveBeenCalledWith('playlist:video:1');
    expect(dispatch.openBreadcrumb).toHaveBeenCalledWith('playlist:video:1');
    expect(actionDispatch.playPlaylistItem).toHaveBeenCalledWith(
      playlistPayload('playlist:video:1', 'Recently Added Movies', 'video')
    );
    expect(actionDispatch.queuePlaylistItem).toHaveBeenCalledWith(
      playlistPayload('playlist:video:1', 'Recently Added Movies', 'video')
    );
  });
});
