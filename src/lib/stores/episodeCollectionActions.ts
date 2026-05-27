import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export interface EpisodeCollectionActionRequest {
  tvshowid: number;
  season?: number;
  label: string;
}

export interface EpisodeCollectionActionResult {
  count: number;
}

export interface EpisodeCollectionActionDispatch {
  playEpisodeCollection: (
    request: EpisodeCollectionActionRequest
  ) => Promise<EpisodeCollectionActionResult> | EpisodeCollectionActionResult;
  queueEpisodeCollection: (
    request: EpisodeCollectionActionRequest
  ) => Promise<EpisodeCollectionActionResult> | EpisodeCollectionActionResult;
}

export const defaultEpisodeCollectionActionDispatch: EpisodeCollectionActionDispatch = {
  playEpisodeCollection,
  queueEpisodeCollection
};

async function playEpisodeCollection(
  request: EpisodeCollectionActionRequest
): Promise<EpisodeCollectionActionResult> {
  const client = resolveClient();
  const episodeIds = await fetchEpisodeIds(client, request);

  if (episodeIds.length === 0) {
    return { count: 0 };
  }

  await client.call('Playlist.Clear', { playlistid: 1 });
  await addEpisodesToPlaylist(client, episodeIds);
  await client.call('Player.Open', { item: { playlistid: 1, position: 0 } });

  return { count: episodeIds.length };
}

async function queueEpisodeCollection(
  request: EpisodeCollectionActionRequest
): Promise<EpisodeCollectionActionResult> {
  const client = resolveClient();
  const episodeIds = await fetchEpisodeIds(client, request);
  await addEpisodesToPlaylist(client, episodeIds);

  return { count: episodeIds.length };
}

function resolveClient(): KodiJsonRpcHttpClient {
  const client = createActiveKodiJsonRpcHttpClient();
  if (!client) {
    throw new Error('Choose an active Kodi host before playing TV episodes.');
  }
  return client;
}

async function fetchEpisodeIds(
  client: KodiJsonRpcHttpClient,
  request: EpisodeCollectionActionRequest
): Promise<number[]> {
  const result = await client.call<{ episodes?: { episodeid?: unknown }[] }>(
    'VideoLibrary.GetEpisodes',
    {
      tvshowid: request.tvshowid,
      properties: ['title'],
      limits: { start: 0 },
      sort: { method: 'episode', order: 'ascending' },
      ...(typeof request.season === 'number' ? { season: request.season } : {})
    }
  );

  return (Array.isArray(result.episodes) ? result.episodes : []).flatMap((episode) =>
    typeof episode.episodeid === 'number' &&
    Number.isSafeInteger(episode.episodeid) &&
    episode.episodeid > 0
      ? [episode.episodeid]
      : []
  );
}

async function addEpisodesToPlaylist(
  client: KodiJsonRpcHttpClient,
  episodeIds: readonly number[]
): Promise<void> {
  for (const episodeid of episodeIds) {
    await client.call('Playlist.Add', { playlistid: 1, item: { episodeid } });
  }
}
