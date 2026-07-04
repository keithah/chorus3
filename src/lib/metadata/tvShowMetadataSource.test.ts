import { describe, expect, it, vi } from 'vitest';

import { createTvShowMetadataSourceResolver } from './tvShowMetadataSource';
import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import type { VideoTvStoreSnapshot } from '$lib/stores/videoTvStore.svelte';

function snapshot(detail?: VideoTvStoreSnapshot['tvShowDetail']): VideoTvStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: '2026-06-01T12:00:00.000Z',
    tvShows: [],
    selectedTvShowId: detail?.tvshowid ?? null,
    selectedSeason: null,
    selectedEpisodeId: null,
    tvShowDetail: detail ?? null,
    seasons: [],
    episodes: [],
    episodeDetail: null,
    seasonArtworkCapability: { status: 'unavailable', reason: 'No season selected.' },
    limits: {
      tvShows: { start: 0, end: 0, total: 0 },
      seasons: { start: 0, end: 0, total: 0 },
      episodes: { start: 0, end: 0, total: 0 }
    },
    lastError: null
  };
}

describe('createTvShowMetadataSourceResolver', () => {
  it('uses the selected TV snapshot detail before making a Kodi request', async () => {
    const resolver = createTvShowMetadataSourceResolver({
      snapshot: () =>
        snapshot({
          tvshowid: 7,
          title: 'Severance',
          label: 'Severance',
          thumbnail: 'image://poster',
          fanart: 'image://fanart',
          thumbnailAvailable: true,
          fanartAvailable: true,
          artwork: { poster: true, fanart: true }
        }),
      createClient: vi.fn(() => {
        throw new Error('should not fetch');
      })
    });

    await expect(resolver.resolve(7)).resolves.toMatchObject({
      title: 'Severance',
      thumbnail: 'image://poster',
      fanart: 'image://fanart'
    });
  });

  it('fetches uncached TV detail once and reuses it for later editor opens', async () => {
    const client = {
      call: vi.fn(async () => ({
        tvshowdetails: {
          tvshowid: 11,
          title: 'Atlanta',
          label: 'Atlanta',
          art: { poster: 'image://atlanta-poster' },
          uniqueid: { imdb: 'tt4288182' }
        }
      }))
    };
    const resolver = createTvShowMetadataSourceResolver({
      snapshot: () => snapshot(),
      createClient: () => client as unknown as KodiJsonRpcHttpClient
    });

    await expect(resolver.resolve(11)).resolves.toMatchObject({
      title: 'Atlanta',
      thumbnail: 'image://atlanta-poster',
      imdbnumber: 'tt4288182'
    });
    await expect(resolver.resolve(11)).resolves.toMatchObject({
      title: 'Atlanta',
      thumbnail: 'image://atlanta-poster'
    });
    expect(client.call).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent fetches and supports explicit invalidation', async () => {
    const client = {
      call: vi
        .fn()
        .mockResolvedValueOnce({
          tvshowdetails: {
            tvshowid: 11,
            title: 'Atlanta',
            label: 'Atlanta'
          }
        })
        .mockResolvedValueOnce({
          tvshowdetails: {
            tvshowid: 11,
            title: 'Atlanta Updated',
            label: 'Atlanta Updated'
          }
        })
    };
    const resolver = createTvShowMetadataSourceResolver({
      snapshot: () => snapshot(),
      createClient: () => client as unknown as KodiJsonRpcHttpClient
    });

    await expect(Promise.all([resolver.resolve(11), resolver.resolve(11)])).resolves.toEqual([
      expect.objectContaining({ title: 'Atlanta' }),
      expect.objectContaining({ title: 'Atlanta' })
    ]);
    expect(client.call).toHaveBeenCalledTimes(1);

    resolver.invalidate(11);
    await expect(resolver.resolve(11)).resolves.toMatchObject({ title: 'Atlanta Updated' });
    expect(client.call).toHaveBeenCalledTimes(2);
  });

  it('does not cache transient fetch errors as missing TV details', async () => {
    const client = {
      call: vi
        .fn()
        .mockRejectedValueOnce(new Error('network interrupted'))
        .mockResolvedValueOnce({
          tvshowdetails: {
            tvshowid: 11,
            title: 'Atlanta',
            label: 'Atlanta'
          }
        })
    };
    const resolver = createTvShowMetadataSourceResolver({
      snapshot: () => snapshot(),
      createClient: () => client as unknown as KodiJsonRpcHttpClient
    });

    await expect(resolver.resolve(11)).rejects.toThrow('network interrupted');
    await expect(resolver.resolve(11)).resolves.toMatchObject({ title: 'Atlanta' });
    expect(client.call).toHaveBeenCalledTimes(2);
  });
});
