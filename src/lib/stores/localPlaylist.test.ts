import { describe, expect, it, vi } from 'vitest';

import {
  LOCAL_PLAYLIST_STORAGE_KEY,
  createLocalPlaylistStore,
  type LocalPlaylistStorage
} from './localPlaylist.svelte';

function createStorage(initial: Record<string, string> = {}): LocalPlaylistStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    })
  };
}

function createThrowingStorage(
  options: { read?: boolean; write?: boolean; remove?: boolean } = {}
): LocalPlaylistStorage {
  return {
    getItem: vi.fn(() => {
      if (options.read) {
        throw new Error('raw localStorage read failed for /home/keith/private.flac token=secret');
      }

      return null;
    }),
    setItem: vi.fn(() => {
      if (options.write) {
        throw new Error('raw localStorage write failed for smb://admin:p@ssword@nas/music.flac');
      }
    }),
    removeItem: vi.fn(() => {
      if (options.remove) {
        throw new Error('raw localStorage remove failed for file:///Users/keith/private.mp3');
      }
    })
  };
}

function latestPersistedValue(storage: LocalPlaylistStorage): string {
  const calls = vi.mocked(storage.setItem).mock.calls;
  const latestCall = calls.at(-1);

  if (!latestCall) {
    throw new Error('Expected storage.setItem to have been called.');
  }

  return latestCall[1];
}

function createHarness(storage: LocalPlaylistStorage = createStorage()) {
  let id = 0;
  let nowMs = 1_700_000_000_000;

  return {
    storage,
    store: createLocalPlaylistStore({
      storage,
      createId: (prefix) => `${prefix}-${++id}`,
      now: () => new Date(nowMs).toISOString()
    }),
    tick(ms = 1_000) {
      nowMs += ms;
    }
  };
}

function snapshotText(value: unknown): string {
  return JSON.stringify(value);
}

function expectNoUnsafeText(value: unknown): void {
  const text = snapshotText(value);

  expect(text).not.toContain('/home/keith');
  expect(text).not.toContain('/Users/keith');
  expect(text).not.toContain('smb://');
  expect(text).not.toContain('file://');
  expect(text).not.toContain('http://');
  expect(text).not.toContain('https://');
  expect(text).not.toContain('admin:p@ssword');
  expect(text).not.toContain('Authorization');
  expect(text).not.toContain('secret-token');
  expect(text).not.toContain('localStorage');
}

describe('local playlist store', () => {
  it('starts with clone-safe empty defaults and no storage warning', () => {
    const { store } = createHarness();

    expect(store.snapshot).toEqual({
      playlists: [],
      selectedPlaylistId: null,
      selectedPlaylist: null,
      playlistCount: 0,
      selectedItemCount: 0,
      mutationStatus: 'idle',
      lastMutation: null,
      validationErrors: {},
      storageWarning: null,
      lastError: null,
      lastUpdatedAt: null
    });

    const snapshot = store.snapshot;
    const clone = structuredClone(snapshot);
    expect(clone).toEqual(snapshot);
    expect(clone).not.toBe(snapshot);
  });

  it('creates, renames, selects, and removes playlists deterministically', () => {
    const { store, storage, tick } = createHarness();

    const first = store.createPlaylist('  Morning Mix  ');
    tick();
    const second = store.createPlaylist('Road Trip');

    expect(first).toEqual({
      ok: true,
      playlist: expect.objectContaining({ id: 'playlist-1', label: 'Morning Mix' })
    });
    expect(second).toEqual({
      ok: true,
      playlist: expect.objectContaining({ id: 'playlist-2', label: 'Road Trip' })
    });
    expect(store.snapshot.selectedPlaylistId).toBe('playlist-1');

    expect(store.selectPlaylist('playlist-2')).toEqual({
      ok: true,
      playlist: expect.objectContaining({ id: 'playlist-2' })
    });
    expect(store.renamePlaylist('playlist-2', '  Road Trip 2026  ')).toEqual({
      ok: true,
      playlist: expect.objectContaining({ id: 'playlist-2', label: 'Road Trip 2026' })
    });

    expect(store.removePlaylist('playlist-2')).toEqual({ ok: true });
    expect(store.snapshot.playlists).toEqual([
      expect.objectContaining({ id: 'playlist-1', label: 'Morning Mix' })
    ]);
    expect(store.snapshot.selectedPlaylistId).toBe('playlist-1');
    expect(storage.setItem).toHaveBeenLastCalledWith(
      LOCAL_PLAYLIST_STORAGE_KEY,
      expect.any(String)
    );
  });

  it('rejects unsafe playlist labels without persisting raw input', () => {
    const { store, storage } = createHarness();

    for (const label of [
      ' ',
      '/home/keith/music',
      'https://example.test/playlist',
      'Authorization: Basic secret-token',
      'admin:p@ssword mix'
    ]) {
      const result = store.createPlaylist(label);
      expect(result.ok).toBe(false);
      expectNoUnsafeText(result);
    }

    expect(store.snapshot.playlists).toEqual([]);
    expect(store.snapshot.validationErrors).toHaveProperty('label');
    expectNoUnsafeText(store.snapshot);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('adds, removes, clears, and reorders safe public item snapshots while retaining private playable records', () => {
    const { store } = createHarness();
    store.createPlaylist('Queue Save');

    expect(
      store.addItems('playlist-1', [
        {
          kind: 'audio',
          label: 'Song One',
          file: 'smb://admin:p@ssword@nas/Music/song-one.flac',
          sourceId: 'song:1',
          durationSeconds: 180
        },
        {
          kind: 'video',
          label: 'Movie One',
          file: '/home/keith/private/movie-one.mkv',
          sourceId: 'movie:1'
        },
        {
          kind: 'playlist',
          label: 'Smart List',
          file: 'special://profile/playlists/music/list.xsp'
        }
      ])
    ).toEqual({
      ok: true,
      items: expect.arrayContaining([expect.objectContaining({ id: 'item-2' })])
    });

    expect(store.snapshot.selectedPlaylist?.items.map((item) => item.label)).toEqual([
      'Song One',
      'Movie One',
      'Smart List'
    ]);
    expect(store.snapshot.selectedPlaylist?.items.map((item) => item.position)).toEqual([0, 1, 2]);
    expectNoUnsafeText(store.snapshot);

    expect(store.moveItem('playlist-1', 'item-3', 'up')).toEqual({ ok: true });
    expect(store.moveItem('playlist-1', 'item-3', 'up')).toEqual({ ok: true });
    expect(store.moveItem('playlist-1', 'item-4', 'down')).toEqual({ ok: true });
    expect(store.snapshot.selectedPlaylist?.items.map((item) => item.id)).toEqual([
      'item-3',
      'item-2',
      'item-4'
    ]);

    expect(store.reorderItems('playlist-1', ['item-4', 'item-3', 'item-2'])).toEqual({ ok: true });
    expect(store.removeItem('playlist-1', 'item-3')).toEqual({ ok: true });
    expect(store.snapshot.selectedPlaylist?.items.map((item) => item.id)).toEqual([
      'item-4',
      'item-2'
    ]);

    expect(store.clearPlaylist('playlist-1')).toEqual({ ok: true });
    expect(store.clearPlaylist('playlist-1')).toEqual({ ok: true });
    expect(store.snapshot.selectedPlaylist?.items).toEqual([]);
  });

  it('rejects malformed item inputs and malformed reorder requests', () => {
    const { store } = createHarness();
    store.createPlaylist('Invalid Items');

    for (const item of [
      null,
      { kind: 'unknown', label: 'Bad', file: '/home/keith/private.flac' },
      { kind: 'audio', label: '', file: '/home/keith/private.flac' },
      { kind: 'audio', label: 'Bad URL', file: 'https://example.test/file.mp3' },
      { kind: 'audio', label: 'Bad auth', file: 'Authorization: Basic secret-token' }
    ]) {
      const result = store.addItems('playlist-1', [item]);
      expect(result.ok).toBe(false);
      expectNoUnsafeText(result);
    }

    expect(store.addItems('playlist-1', {})).toEqual({
      ok: false,
      errors: { items: 'Choose one or more supported local playlist items.' }
    });
    expect(store.reorderItems('playlist-1', ['item-missing'])).toEqual({
      ok: false,
      errors: { itemIds: 'Provide each current local playlist item id exactly once.' }
    });
    expect(store.snapshot.selectedPlaylist?.items).toEqual([]);
    expectNoUnsafeText(store.snapshot);
  });

  it('persists and reloads valid playlists, items, selection, and timestamps from injected storage', () => {
    const { store, storage, tick } = createHarness();

    store.createPlaylist('Persisted');
    tick();
    store.addItems('playlist-1', [
      {
        kind: 'audio',
        label: 'Persisted Song',
        file: 'smb://nas/music/song.flac',
        sourceId: 'song:99'
      }
    ]);

    const persisted = latestPersistedValue(storage);
    expect(persisted).toContain('smb://nas/music/song.flac');

    const reloaded = createLocalPlaylistStore({
      storage: createStorage({ [LOCAL_PLAYLIST_STORAGE_KEY]: persisted }),
      createId: (prefix) => `${prefix}-unused`,
      now: () => '2026-01-01T00:00:00.000Z'
    });

    expect(reloaded.snapshot).toMatchObject({
      selectedPlaylistId: 'playlist-1',
      playlistCount: 1,
      selectedItemCount: 1,
      storageWarning: null,
      lastError: null
    });
    expect(reloaded.snapshot.selectedPlaylist).toMatchObject({
      id: 'playlist-1',
      label: 'Persisted',
      items: [
        expect.objectContaining({
          id: 'item-2',
          kind: 'audio',
          label: 'Persisted Song',
          sourceId: 'song:99'
        })
      ]
    });
    expectNoUnsafeText(reloaded.snapshot);
  });

  it('persists reordered saved items and clears items without deleting playlist metadata', () => {
    const { store, storage, tick } = createHarness();

    store.createPlaylist('Durable Queue Save');
    tick();
    store.addItems('playlist-1', [
      { kind: 'audio', label: 'First Saved', file: 'queue-item:0', sourceId: 'queue:0' },
      { kind: 'video', label: 'Second Saved', file: 'queue-item:1', sourceId: 'queue:1' }
    ]);
    expect(store.reorderItems('playlist-1', ['item-3', 'item-2'])).toEqual({ ok: true });

    const reordered = createLocalPlaylistStore({
      storage: createStorage({ [LOCAL_PLAYLIST_STORAGE_KEY]: latestPersistedValue(storage) }),
      createId: (prefix) => `${prefix}-unused`,
      now: () => '2026-01-01T00:00:00.000Z'
    });

    expect(reordered.snapshot.selectedPlaylist?.items.map((item) => item.label)).toEqual([
      'Second Saved',
      'First Saved'
    ]);
    expect(reordered.clearPlaylist('playlist-1')).toEqual({ ok: true });
    expect(reordered.snapshot.selectedPlaylist).toMatchObject({
      id: 'playlist-1',
      label: 'Durable Queue Save',
      items: []
    });
    expect(reordered.snapshot.playlistCount).toBe(1);
    expectNoUnsafeText(reordered.snapshot);
  });

  it('starts fresh with safe warnings for invalid persisted payloads', () => {
    const invalidPayloads = [
      '{bad json',
      JSON.stringify({ playlists: {} }),
      JSON.stringify({
        playlists: [{ id: 'playlist-1', label: '/home/keith/private', items: [] }],
        selectedPlaylistId: 'playlist-1'
      }),
      JSON.stringify({
        playlists: [{ id: 'bad/id', label: 'Bad id', items: [] }],
        selectedPlaylistId: 'bad/id'
      }),
      JSON.stringify({
        playlists: [{ id: 'playlist-1', label: 'Bad Items', items: {} }],
        selectedPlaylistId: 'playlist-1'
      }),
      JSON.stringify({
        playlists: [
          {
            id: 'playlist-1',
            label: 'Unknown Kind',
            items: [{ id: 'item-1', kind: 'unknown', label: 'Bad' }]
          }
        ],
        selectedPlaylistId: 'playlist-1'
      }),
      JSON.stringify({
        playlists: [{ id: 'playlist-1', label: 'Valid', items: [] }],
        selectedPlaylistId: 'playlist-missing'
      })
    ];

    for (const rawValue of invalidPayloads) {
      const store = createLocalPlaylistStore({
        storage: createStorage({ [LOCAL_PLAYLIST_STORAGE_KEY]: rawValue })
      });

      expect(store.snapshot.playlists).toEqual([]);
      expect(store.snapshot.selectedPlaylistId).toBeNull();
      expect(store.snapshot.storageWarning).toMatchObject({ code: 'invalid-storage' });
      expect(store.snapshot.storageWarning?.message).toContain('Local playlists were reset');
      expect(store.snapshot.storageWarning?.message).not.toContain(rawValue);
      expectNoUnsafeText(store.snapshot);
    }
  });

  it('keeps in-memory state and safe diagnostics when storage throws', () => {
    const readFailure = createLocalPlaylistStore({
      storage: createThrowingStorage({ read: true })
    });
    expect(readFailure.snapshot.storageWarning).toMatchObject({ code: 'read-failed' });
    expectNoUnsafeText(readFailure.snapshot);

    const writeFailure = createLocalPlaylistStore({
      storage: createThrowingStorage({ write: true }),
      createId: (prefix) => `${prefix}-1`,
      now: () => '2026-01-01T00:00:00.000Z'
    });
    expect(writeFailure.createPlaylist('Kept In Memory').ok).toBe(true);
    expect(writeFailure.snapshot.playlists).toHaveLength(1);
    expect(writeFailure.snapshot.storageWarning).toMatchObject({ code: 'write-failed' });
    expectNoUnsafeText(writeFailure.snapshot);

    const removeFailure = createLocalPlaylistStore({
      storage: createThrowingStorage({ remove: true })
    });
    removeFailure.reset();
    expect(removeFailure.snapshot.storageWarning).toMatchObject({ code: 'remove-failed' });
    expectNoUnsafeText(removeFailure.snapshot);
  });

  it('returns clone-safe snapshots that cannot mutate private store records', () => {
    const { store } = createHarness();
    store.createPlaylist('Clone Safety');
    store.addItems('playlist-1', [
      { kind: 'audio', label: 'Safe Label', file: '/home/keith/private.flac' }
    ]);

    const snapshot = store.snapshot;
    snapshot.playlists[0].label = 'Mutated';
    snapshot.playlists[0].items[0].label = 'Mutated Item';
    if (snapshot.selectedPlaylist) {
      snapshot.selectedPlaylist.items.length = 0;
    }

    expect(store.snapshot.playlists[0].label).toBe('Clone Safety');
    expect(store.snapshot.playlists[0].items[0].label).toBe('Safe Label');
    expect(store.snapshot.selectedItemCount).toBe(1);
    expectNoUnsafeText(store.snapshot);
  });
});
