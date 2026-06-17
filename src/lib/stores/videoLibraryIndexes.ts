import type {
  VideoLibraryStoreSnapshot,
  VideoMusicVideoSnapshot,
  VideoTvShowSnapshot
} from './videoLibrary.svelte';

export type VideoLibraryDetailIndexes = {
  tvShowsById: Map<number, VideoTvShowSnapshot>;
  musicVideosById: Map<number, VideoMusicVideoSnapshot>;
};

const detailIndexCache = new WeakMap<VideoLibraryStoreSnapshot, VideoLibraryDetailIndexes>();

export function videoLibraryDetailIndexes(
  video: VideoLibraryStoreSnapshot
): VideoLibraryDetailIndexes {
  const cached = detailIndexCache.get(video);
  if (cached) return cached;

  const indexes = {
    tvShowsById: new Map<number, VideoTvShowSnapshot>(),
    musicVideosById: new Map<number, VideoMusicVideoSnapshot>()
  };

  for (const tvShow of video.tvShows) {
    indexes.tvShowsById.set(tvShow.tvshowid, tvShow);
  }

  for (const musicVideo of video.musicVideos ?? []) {
    indexes.musicVideosById.set(musicVideo.musicvideoid, musicVideo);
  }

  detailIndexCache.set(video, indexes);
  return indexes;
}
