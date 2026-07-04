import { describe, expect, it } from 'vitest';

import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import { createEpisodeCollectionActionDispatch } from './episodeCollectionActions';

class FakeKodiClient implements KodiJsonRpcHttpClient {
  readonly calls: Array<{ method: string; params?: unknown }> = [];

  constructor(private readonly episodes: { episodeid?: unknown }[]) {}

  async call<TResult>(method: string, params?: unknown): Promise<TResult> {
    this.calls.push(params === undefined ? { method } : { method, params });
    if (method === 'VideoLibrary.GetEpisodes') {
      return { episodes: this.episodes } as TResult;
    }
    return 'OK' as TResult;
  }
}

describe('episode collection actions', () => {
  it('queues fetched episodes with ordered Playlist.Add calls', async () => {
    const client = new FakeKodiClient([{ episodeid: 10 }, { episodeid: 11 }, { episodeid: null }]);
    const dispatch = createEpisodeCollectionActionDispatch({ createClient: () => client });

    await expect(
      dispatch.queueEpisodeCollection({ tvshowid: 1, season: 2, label: 'Season 2' })
    ).resolves.toEqual({ count: 2 });

    expect(client.calls).toEqual([
      {
        method: 'VideoLibrary.GetEpisodes',
        params: {
          tvshowid: 1,
          properties: [],
          limits: { start: 0, end: 500 },
          sort: { method: 'episode', order: 'ascending' },
          season: 2
        }
      },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 10 } } },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 11 } } }
    ]);
  });

  it('falls back to sequential Playlist.Add calls for minimal clients', async () => {
    const client: KodiJsonRpcHttpClient & { calls: Array<{ method: string; params?: unknown }> } = {
      calls: [],
      async call<TResult>(method: string, params?: unknown): Promise<TResult> {
        this.calls.push(params === undefined ? { method } : { method, params });
        if (method === 'VideoLibrary.GetEpisodes') {
          return { episodes: [{ episodeid: 20 }, { episodeid: 21 }] } as TResult;
        }
        return 'OK' as TResult;
      }
    };
    const dispatch = createEpisodeCollectionActionDispatch({ createClient: () => client });

    await expect(
      dispatch.queueEpisodeCollection({ tvshowid: 1, label: 'All episodes' })
    ).resolves.toEqual({
      count: 2
    });

    expect(client.calls.slice(1)).toEqual([
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 20 } } },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 21 } } }
    ]);
  });

  it('reports missing active hosts through the injected resolver', async () => {
    const dispatch = createEpisodeCollectionActionDispatch({ createClient: () => null });

    await expect(
      Promise.resolve().then(() =>
        dispatch.playEpisodeCollection({ tvshowid: 1, label: 'All episodes' })
      )
    ).rejects.toThrow('Choose an active Kodi host before playing TV episodes.');
  });
});
