const loadAddonsStoreModule = lazyModule(() => import('$lib/stores/addonsStore.svelte'));
const loadMediaFilesStoreModule = lazyModule(() => import('$lib/stores/mediaFiles.svelte'));
const loadMediaPlaylistsStoreModule = lazyModule(() => import('$lib/stores/mediaPlaylists.svelte'));
const loadMediaSearchStoreModule = lazyModule(() => import('$lib/stores/mediaSearch.svelte'));
const loadMusicBrowseStoreModule = lazyModule(() => import('$lib/stores/musicBrowse.svelte'));
const loadMusicLibraryStoreModule = lazyModule(() => import('$lib/stores/musicLibrary.svelte'));
const loadPvrStoreModule = lazyModule(() => import('$lib/stores/pvr.svelte'));
const loadSettingsStoreModule = lazyModule(() => import('$lib/stores/settingsStore.svelte'));
const loadVideoLibraryStoreModule = lazyModule(() => import('$lib/stores/videoLibrary.svelte'));
const loadVideoMovieDetailStoreModule = lazyModule(
  () => import('$lib/stores/videoMovieDetailStore.svelte')
);
const loadVideoTvStoreModule = lazyModule(() => import('$lib/stores/videoTvStore.svelte'));
const loadVideoWriteStoreModule = lazyModule(() => import('$lib/stores/videoWriteStore.svelte'));

export const appRouteStores = {
  addons: lazyExport(loadAddonsStoreModule, 'addonsStore'),
  mediaFiles: lazyExport(loadMediaFilesStoreModule, 'mediaFilesStore'),
  videoMediaFiles: lazyExport(loadMediaFilesStoreModule, 'videoMediaFilesStore'),
  mediaPlaylists: lazyExport(loadMediaPlaylistsStoreModule, 'mediaPlaylistsStore'),
  videoMediaPlaylists: lazyExport(loadMediaPlaylistsStoreModule, 'videoMediaPlaylistsStore'),
  mediaSearch: lazyExport(loadMediaSearchStoreModule, 'mediaSearchStore'),
  musicBrowse: lazyExport(loadMusicBrowseStoreModule, 'musicBrowseStore'),
  musicLibrary: lazyExport(loadMusicLibraryStoreModule, 'musicLibraryStore'),
  pvr: lazyExport(loadPvrStoreModule, 'pvrStore'),
  settings: lazyExport(loadSettingsStoreModule, 'settingsStore'),
  videoLibrary: lazyExport(loadVideoLibraryStoreModule, 'videoLibraryStore'),
  videoMovieDetail: lazyExport(loadVideoMovieDetailStoreModule, 'videoMovieDetailStore'),
  videoTv: lazyExport(loadVideoTvStoreModule, 'videoTvStore'),
  videoWrite: lazyExport(loadVideoWriteStoreModule, 'videoWriteStore')
};

function lazyModule<TModule>(load: () => Promise<TModule>): () => Promise<TModule> {
  let promise: Promise<TModule> | null = null;
  return () => {
    promise ??= load();
    return promise;
  };
}

function lazyExport<TModule, TKey extends keyof TModule>(
  load: () => Promise<TModule>,
  key: TKey
): () => Promise<TModule[TKey]> {
  return async () => (await load())[key];
}
