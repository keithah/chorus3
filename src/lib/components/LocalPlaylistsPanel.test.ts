import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LocalPlaylistsPanel from './LocalPlaylistsPanel.svelte';
import type {
  LocalPlaylistDispatch,
  LocalPlaylistMutationResult,
  LocalPlaylistSnapshot,
  LocalPlaylistStoreSnapshot
} from '$lib/stores';

type MountedComponent = ReturnType<typeof mount>;

type FakeDispatch = LocalPlaylistDispatch & {
  createPlaylist: ReturnType<typeof vi.fn>;
  renamePlaylist: ReturnType<typeof vi.fn>;
  removePlaylist: ReturnType<typeof vi.fn>;
  selectPlaylist: ReturnType<typeof vi.fn>;
  clearPlaylist: ReturnType<typeof vi.fn>;
  addItems: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  moveItem: ReturnType<typeof vi.fn>;
  reorderItems: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
};

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function playlist(
  id: string,
  label: string,
  items: LocalPlaylistSnapshot['items'] = []
): LocalPlaylistSnapshot {
  return {
    id,
    label,
    items,
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T10:05:00.000Z'
  };
}

function item(id: string, label: string, position: number): LocalPlaylistSnapshot['items'][number] {
  return {
    id,
    kind: 'audio',
    label,
    position,
    durationSeconds: 125,
    addedAt: '2026-05-04T10:01:00.000Z'
  };
}

function createSnapshot(
  overrides: Partial<LocalPlaylistStoreSnapshot> = {}
): LocalPlaylistStoreSnapshot {
  const selectedPlaylist = overrides.selectedPlaylist ?? null;
  const playlists = overrides.playlists ?? (selectedPlaylist ? [selectedPlaylist] : []);

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
    lastUpdatedAt: '2026-05-04T10:05:00.000Z',
    ...overrides
  };
}

function ok<T extends object = object>(payload = {} as T): LocalPlaylistMutationResult<T> {
  return { ok: true, ...payload };
}

function createDispatch(overrides: Partial<FakeDispatch> = {}): FakeDispatch {
  return {
    createPlaylist: vi.fn((label: string) => ok({ playlist: playlist('playlist-new', label) })),
    renamePlaylist: vi.fn((playlistId: string, label: string) =>
      ok({ playlist: playlist(playlistId, label) })
    ),
    removePlaylist: vi.fn(() => ok()),
    selectPlaylist: vi.fn((playlistId: string) =>
      ok({ playlist: playlist(playlistId, 'Selected') })
    ),
    clearPlaylist: vi.fn(() => ok()),
    addItems: vi.fn(() => ok({ items: [] })),
    removeItem: vi.fn(() => ok()),
    moveItem: vi.fn(() => ok()),
    reorderItems: vi.fn(() => ok()),
    reset: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: {
    snapshot?: LocalPlaylistStoreSnapshot;
    dispatch?: LocalPlaylistDispatch;
  } = {}
): FakeDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(LocalPlaylistsPanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch
    }
  });
  return dispatch as FakeDispatch;
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function statusText(): string {
  return document.querySelector('[data-local-playlist-status]')?.textContent ?? '';
}

function input(label: string): HTMLInputElement {
  const labels = Array.from(document.querySelectorAll('label'));
  const labelNode = labels.find((node) => node.textContent?.includes(label));
  const controlId = labelNode?.getAttribute('for');
  const control = controlId
    ? document.getElementById(controlId)
    : labelNode?.querySelector('input');
  if (!(control instanceof HTMLInputElement)) {
    throw new Error(`Input not found: ${label}`);
  }
  return control;
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (node) =>
      node.getAttribute('aria-label') === labelOrText || node.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    const found = Array.from(document.querySelectorAll('button'))
      .map((node) => node.getAttribute('aria-label') ?? node.textContent?.trim())
      .join(', ');
    throw new Error(`Button not found: "${labelOrText}". Found: ${found}`);
  }
  return match;
}

function allButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('button'));
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic ');
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
  expect(value).not.toContain('raw storage payload');
}

describe('LocalPlaylistsPanel', () => {
  it('renders accessible local playlist controls, status, empty state, and safe selectors', () => {
    renderPanel();

    const panel = document.querySelector('[data-local-playlists-panel]');
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute('aria-labelledby')).toBe('local-playlists-title');
    expect(document.querySelector('#local-playlists-title')?.textContent).toContain(
      'Local Playlists'
    );
    expect(document.querySelector('[data-local-playlist-status]')?.getAttribute('role')).toBe(
      'status'
    );
    expect(document.querySelector('[data-local-playlist-status]')?.getAttribute('aria-live')).toBe(
      'polite'
    );
    expect(statusText()).toContain('No local playlists yet.');
    expect(screenText()).toContain(
      'Create a local playlist to save playable items in this browser.'
    );
    expect(button('Rename playlist').disabled).toBe(true);
    expect(button('Remove playlist').disabled).toBe(true);
    expect(button('Clear selected playlist').disabled).toBe(true);
  });

  it('validates blank and unsafe create names locally before dispatching', async () => {
    const dispatch = renderPanel();

    button('Create playlist').click();
    await tick();
    expect(dispatch.createPlaylist).not.toHaveBeenCalled();
    expect(screenText()).toContain('Local playlist name is required.');

    const name = input('New playlist name');
    name.value = 'https://admin:p@ssword@example.test/secret.m3u';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    button('Create playlist').click();
    await tick();

    expect(dispatch.createPlaylist).not.toHaveBeenCalled();
    expect(screenText()).toContain('Use a safe display name without paths, URLs, or credentials.');
    expectSecretSafe(screenText());
  });

  it('dispatches create, select, rename, remove, clear, remove item, and move item actions', async () => {
    const selected = playlist('playlist-1', 'Road Trip', [
      item('item-1', 'Song A', 0),
      item('item-2', 'Song B', 1),
      item('item-3', 'Song C', 2)
    ]);
    const dispatch = renderPanel({
      snapshot: createSnapshot({
        playlists: [selected, playlist('playlist-2', 'Quiet Mix')],
        selectedPlaylist: selected,
        selectedPlaylistId: selected.id,
        playlistCount: 2,
        selectedItemCount: 3
      })
    });

    const createName = input('New playlist name');
    createName.value = 'Late Night';
    createName.dispatchEvent(new Event('input', { bubbles: true }));
    button('Create playlist').click();
    await tick();

    button('Select playlist Quiet Mix').click();
    await tick();

    const rename = input('Rename selected playlist');
    rename.value = 'Road Trip 2026';
    rename.dispatchEvent(new Event('input', { bubbles: true }));
    button('Rename playlist').click();
    await tick();

    button('Remove playlist Road Trip').click();
    await tick();
    button('Confirm remove playlist Road Trip').click();
    await tick();

    button('Clear selected playlist').click();
    await tick();
    button('Remove item Song B').click();
    await tick();
    button('Move Song B up').click();
    await tick();
    button('Move Song B down').click();
    await tick();

    expect(dispatch.createPlaylist).toHaveBeenCalledWith('Late Night');
    expect(dispatch.selectPlaylist).toHaveBeenCalledWith('playlist-2');
    expect(dispatch.renamePlaylist).toHaveBeenCalledWith('playlist-1', 'Road Trip 2026');
    expect(dispatch.removePlaylist).toHaveBeenCalledWith('playlist-1');
    expect(dispatch.clearPlaylist).toHaveBeenCalledWith('playlist-1');
    expect(dispatch.removeItem).toHaveBeenCalledWith('playlist-1', 'item-2');
    expect(dispatch.moveItem).toHaveBeenNthCalledWith(1, 'playlist-1', 'item-2', 'up');
    expect(dispatch.moveItem).toHaveBeenNthCalledWith(2, 'playlist-1', 'item-2', 'down');
  });

  it('validates blank and unsafe rename names and shows dispatch validation errors safely', async () => {
    const selected = playlist('playlist-1', 'Road Trip');
    const dispatch = createDispatch({
      renamePlaylist: vi.fn(
        () =>
          ({
            ok: false,
            errors: { label: 'Use a safe display name without paths, URLs, or credentials.' }
          }) as const
      )
    });
    renderPanel({
      snapshot: createSnapshot({ playlists: [selected], selectedPlaylist: selected }),
      dispatch
    });

    const rename = input('Rename selected playlist');
    rename.value = '   ';
    rename.dispatchEvent(new Event('input', { bubbles: true }));
    button('Rename playlist').click();
    await tick();
    expect(dispatch.renamePlaylist).not.toHaveBeenCalled();
    expect(screenText()).toContain('Local playlist name is required.');

    rename.value = 'smb://admin:p@ssword@nas/private';
    rename.dispatchEvent(new Event('input', { bubbles: true }));
    button('Rename playlist').click();
    await tick();
    expect(dispatch.renamePlaylist).not.toHaveBeenCalled();
    expectSecretSafe(screenText());

    rename.value = 'Safe Name';
    rename.dispatchEvent(new Event('input', { bubbles: true }));
    button('Rename playlist').click();
    await tick();
    expect(dispatch.renamePlaylist).toHaveBeenCalledWith('playlist-1', 'Safe Name');
    expect(screenText()).toContain('Use a safe display name without paths, URLs, or credentials.');
  });

  it('renders storage warnings and mutation errors in safe live regions without raw payloads', () => {
    renderPanel({
      snapshot: createSnapshot({
        storageWarning: {
          code: 'invalid-storage',
          message: 'Local playlists were reset because stored data was invalid.'
        },
        lastError: {
          source: 'storage',
          code: 'storage/failed',
          message:
            'Storage failed for localStorage raw storage payload Authorization: Basic abc123 smb://nas/private'
        },
        mutationStatus: 'error',
        lastMutation: 'createPlaylist'
      })
    });

    expect(statusText()).toContain('Local playlist createPlaylist failed.');
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain(
      'Local playlists were reset because stored data was invalid.'
    );
    expect(screenText()).toContain('credentials');
    expectSecretSafe(screenText());
  });

  it('disables controls while mutation is running and keeps boundary move controls disabled', () => {
    const selected = playlist('playlist-1', 'Road Trip', [
      item('item-1', 'Song A', 0),
      item('item-2', 'Song B', 1),
      item('item-3', 'Song C', 2)
    ]);
    renderPanel({
      snapshot: createSnapshot({
        playlists: [selected],
        selectedPlaylist: selected,
        selectedPlaylistId: selected.id,
        selectedItemCount: 3,
        mutationStatus: 'running',
        lastMutation: 'clearPlaylist'
      })
    });

    expect(statusText()).toContain('Local playlist clearPlaylist is running…');
    for (const control of allButtons()) {
      expect(control.disabled).toBe(true);
    }
  });

  it('renders selected items with stable controls, boundary disabled states, and no private files', () => {
    const selected = playlist('playlist-1', 'Road Trip', [
      { ...item('item-1', 'Song A', 0), sourceId: 'song:1' },
      item('item-2', 'Song B', 1),
      item('item-3', 'Song C', 2)
    ]);
    renderPanel({
      snapshot: createSnapshot({
        playlists: [selected],
        selectedPlaylist: selected,
        selectedPlaylistId: selected.id,
        selectedItemCount: 3
      })
    });

    expect(screenText()).toContain('Song A');
    expect(screenText()).toContain('2:05');
    expect(button('Move Song A up').disabled).toBe(true);
    expect(button('Move Song A down').disabled).toBe(false);
    expect(button('Move Song B up').disabled).toBe(false);
    expect(button('Move Song B down').disabled).toBe(false);
    expect(button('Move Song C up').disabled).toBe(false);
    expect(button('Move Song C down').disabled).toBe(true);
    expectSecretSafe(screenText());
  });

  it('keeps no-selected and empty selected playlist operations safe and disabled where appropriate', () => {
    renderPanel({
      snapshot: createSnapshot({
        playlists: [playlist('playlist-1', 'Road Trip')],
        selectedPlaylist: null,
        selectedPlaylistId: null,
        selectedItemCount: 0
      })
    });

    expect(screenText()).toContain('Choose a local playlist to manage its items.');
    expect(button('Rename playlist').disabled).toBe(true);
    expect(button('Remove playlist').disabled).toBe(true);
    expect(button('Clear selected playlist').disabled).toBe(true);

    if (mounted) {
      unmount(mounted);
      mounted = null;
    }
    document.body.innerHTML = '';

    const empty = playlist('playlist-1', 'Road Trip');
    renderPanel({
      snapshot: createSnapshot({
        playlists: [empty],
        selectedPlaylist: empty,
        selectedPlaylistId: empty.id,
        selectedItemCount: 0
      })
    });

    expect(screenText()).toContain('Road Trip has no items yet.');
    expect(button('Clear selected playlist').disabled).toBe(true);
  });
});
