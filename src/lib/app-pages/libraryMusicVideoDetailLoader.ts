import { getVideoLibraryMusicVideoDetails, type KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  normalizeVideoMusicVideos,
  type VideoMusicVideoSnapshot
} from '$lib/stores/videoLibraryNormalization';

const MUSIC_VIDEO_DETAIL_PROPERTIES = [
  'title',
  'artist',
  'album',
  'year',
  'runtime',
  'thumbnail',
  'fanart',
  'art',
  'genre',
  'director',
  'studio',
  'playcount',
  'lastplayed',
  'resume',
  'dateadded',
  'plot',
  'track',
  'tag',
  'rating'
] as const;

export async function loadLibraryMusicVideoDetail(
  client: KodiJsonRpcHttpClient,
  musicvideoid: number
): Promise<VideoMusicVideoSnapshot | null> {
  const result = await getVideoLibraryMusicVideoDetails(client, {
    musicvideoid,
    properties: MUSIC_VIDEO_DETAIL_PROPERTIES
  });
  const [detail] = normalizeVideoMusicVideos(
    result.musicvideodetails ? [result.musicvideodetails] : []
  );

  return detail ?? null;
}
