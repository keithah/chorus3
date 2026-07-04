import {
  getVideoLibraryEpisodes,
  type KodiJsonRpcHttpClient,
  type VideoLibraryEpisodesParams,
  type VideoLibraryEpisodesResult
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { callKodiCallsSequentially } from './kodiBatch';
import { DEFAULT_FULL_LIBRARY_PAGE_SIZE, readPagedKodiLibraryList } from './pagedKodiLibrary';

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

export interface EpisodeCollectionActionDispatchOptions {
  createClient?: () => KodiJsonRpcHttpClient | null;
}

export function createEpisodeCollectionActionDispatch(
  options: EpisodeCollectionActionDispatchOptions = {}
): EpisodeCollectionActionDispatch {
  const resolveClient = (): KodiJsonRpcHttpClient => {
    const client = (options.createClient ?? createActiveKodiJsonRpcHttpClient)();
    if (!client) {
      throw new Error('Choose an active Kodi host before playing TV episodes.');
    }
    return client;
  };

  return {
    playEpisodeCollection: (request) => playEpisodeCollection(resolveClient(), request),
    queueEpisodeCollection: (request) => queueEpisodeCollection(resolveClient(), request)
  };
}

export const defaultEpisodeCollectionActionDispatch = createEpisodeCollectionActionDispatch();

async function playEpisodeCollection(
  client: KodiJsonRpcHttpClient,
  request: EpisodeCollectionActionRequest
): Promise<EpisodeCollectionActionResult> {
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
  client: KodiJsonRpcHttpClient,
  request: EpisodeCollectionActionRequest
): Promise<EpisodeCollectionActionResult> {
  const episodeIds = await fetchEpisodeIds(client, request);
  await addEpisodesToPlaylist(client, episodeIds);

  return { count: episodeIds.length };
}

async function fetchEpisodeIds(
  client: KodiJsonRpcHttpClient,
  request: EpisodeCollectionActionRequest
): Promise<number[]> {
  const result = await readPagedKodiLibraryList<
    VideoLibraryEpisodesParams,
    'episodes',
    NonNullable<VideoLibraryEpisodesResult['episodes']>[number],
    VideoLibraryEpisodesResult
  >(
    (params) => getVideoLibraryEpisodes(client, params),
    {
      tvshowid: request.tvshowid,
      properties: [],
      sort: { method: 'episode', order: 'ascending' },
      ...(typeof request.season === 'number' ? { season: request.season } : {})
    },
    'episodes',
    undefined,
    DEFAULT_FULL_LIBRARY_PAGE_SIZE
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
  if (episodeIds.length === 0) {
    return;
  }

  await callKodiCallsSequentially(
    client,
    episodeIds.map((episodeid) => ({
      method: 'Playlist.Add',
      params: { playlistid: 1, item: { episodeid } }
    }))
  );
}
