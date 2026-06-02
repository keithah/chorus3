import {
  getVideoLibraryEpisodeDetails,
  getVideoLibraryMovieDetails,
  getVideoLibraryMusicVideoDetails,
  type KodiEpisodeLibraryItem,
  type KodiJsonRpcHttpClient,
  type KodiMovieLibraryItem,
  type KodiMusicVideoLibraryItem
} from '$lib/kodi';

export async function resolveMovieStreamDetail(
  client: KodiJsonRpcHttpClient,
  movieid: number
): Promise<KodiMovieLibraryItem | null> {
  const result = await getVideoLibraryMovieDetails(client, {
    movieid,
    properties: ['title', 'thumbnail', 'file', 'art']
  });
  return result.moviedetails ?? null;
}

export async function resolveEpisodeStreamDetail(
  client: KodiJsonRpcHttpClient,
  episodeid: number
): Promise<KodiEpisodeLibraryItem | null> {
  const result = await getVideoLibraryEpisodeDetails(client, {
    episodeid,
    properties: ['title', 'showtitle', 'thumbnail', 'file', 'art']
  });
  return result.episodedetails ?? null;
}

export async function resolveMusicVideoStreamDetail(
  client: KodiJsonRpcHttpClient,
  musicvideoid: number
): Promise<KodiMusicVideoLibraryItem | null> {
  const result = await getVideoLibraryMusicVideoDetails(client, {
    musicvideoid,
    properties: ['title', 'thumbnail', 'file', 'art']
  });
  return result.musicvideodetails ?? null;
}

export function rawMediaFile(item: Record<string, unknown> | null): string {
  return typeof item?.file === 'string' ? item.file.trim() : '';
}
