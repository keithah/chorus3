import type { LibraryFilterOption, LibraryFilterStore } from '$lib/stores/libraryFilter';
import { libraryFilterRecordFrom } from '$lib/stores/libraryFilterRecords';
import type {
  MusicLibraryAlbumSnapshot,
  MusicLibraryArtistSnapshot,
  MusicLibrarySongSnapshot,
  MusicLibraryStoreSnapshot
} from '$lib/stores/musicLibrary.svelte';
import type { ThumbsUpDispatch } from '$lib/stores/thumbsUp.svelte';
import type {
  VideoEpisodeSnapshot,
  VideoLibraryMovieSnapshot,
  VideoLibraryStoreSnapshot,
  VideoMusicVideoSnapshot
} from '$lib/stores/videoLibrary.svelte';
import { optionItemsForRoute, type LibraryRoute } from './libraryRouteFilters';

export type LibraryPageFilters = ReturnType<typeof createLibraryPageFilters>;

export function createLibraryPageFilters({
  filterPath,
  store,
  thumbsUpDispatch
}: {
  filterPath: string;
  store: LibraryFilterStore;
  thumbsUpDispatch?: ThumbsUpDispatch;
}) {
  return {
    artists: (items: readonly MusicLibraryArtistSnapshot[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('artist', item.artistid)
      ),
    albums: (items: readonly MusicLibraryAlbumSnapshot[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('album', item.albumid)
      ),
    songs: (items: readonly MusicLibrarySongSnapshot[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('song', item.songid)
      ),
    movies: (items: readonly VideoLibraryMovieSnapshot[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('movie', item.movieid)
      ),
    episodes: (items: readonly VideoEpisodeSnapshot[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('episode', item.episodeid)
      ),
    musicVideos: (items: readonly VideoMusicVideoSnapshot[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('musicvideo', item.musicvideoid)
      ),
    tvShows: <T extends { tvshowid: number }>(items: readonly T[]) =>
      filterLibraryItems(filterPath, store, items, (item) =>
        thumbsUpDispatch?.hasItem('tvshow', item.tvshowid)
      ),
    optionsForRoute: (
      route: LibraryRoute,
      key: string,
      music: MusicLibraryStoreSnapshot,
      video: VideoLibraryStoreSnapshot
    ): LibraryFilterOption[] =>
      store.getFilterOptions(filterPath, key, optionItemsForRoute(route, music, video))
  };
}

function filterLibraryItems<T extends object>(
  filterPath: string,
  store: LibraryFilterStore,
  items: readonly T[],
  isThumbed: (item: T) => boolean | undefined
): T[] {
  return store.applyFilterPairs(
    filterPath,
    items.map((item) => ({
      item,
      record: libraryFilterRecordFrom(item, { thumbsUp: isThumbed(item) ?? false })
    }))
  );
}
