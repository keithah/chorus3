import { describe, expect, it, vi } from 'vitest';

import { MusicDetailRouteStore } from './musicDetailRouteStore.svelte';

describe('MusicDetailRouteStore', () => {
  it('loads album detail and songs once while exposing loading-safe snapshots', async () => {
    const loadAlbumDetail = vi.fn(async () => ({ albumid: 4, label: 'Kind of Blue' }));
    const loadAlbumSongs = vi.fn(async () => [{ songid: 8, label: 'So What' }]);
    const store = new MusicDetailRouteStore({
      createClient: () => ({ call: vi.fn() }),
      loadAlbumDetail,
      loadAlbumSongs,
      loadArtistDetail: vi.fn()
    });

    await store.loadAlbum(4);
    await store.loadAlbum(4);

    expect(loadAlbumDetail).toHaveBeenCalledTimes(1);
    expect(loadAlbumSongs).toHaveBeenCalledTimes(1);
    expect(store.snapshot.albumDetails[4]).toMatchObject({
      status: 'ready',
      data: { label: 'Kind of Blue' }
    });
    expect(store.snapshot.albumSongs[4]).toMatchObject({
      status: 'ready',
      data: [expect.objectContaining({ songid: 8 })]
    });
  });

  it('loads artist detail once and records missing details without retry churn', async () => {
    const loadArtistDetail = vi.fn(async () => null);
    const store = new MusicDetailRouteStore({
      createClient: () => ({ call: vi.fn() }),
      loadAlbumDetail: vi.fn(),
      loadAlbumSongs: vi.fn(),
      loadArtistDetail
    });

    await store.loadArtist(12);
    await store.loadArtist(12);

    expect(loadArtistDetail).toHaveBeenCalledTimes(1);
    expect(store.snapshot.artistDetails[12]).toEqual({ status: 'missing' });
  });
});
