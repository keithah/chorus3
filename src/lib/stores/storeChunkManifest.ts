export type StoreChunkName = 'stores-shell' | 'stores-route';

export const STORE_CHUNK_BY_MODULE = {
  addonsStore: 'stores-route',
  addonsStoreModel: 'stores-route',
  addonsStoreTypes: 'stores-route',
  backboneCollectionStorage: 'stores-shell',
  config: 'stores-shell',
  connection: 'stores-shell',
  defaultPlayerDispatch: 'stores-shell',
  episodeCollectionActions: 'stores-route',
  hostConnection: 'stores-shell',
  index: 'stores-route',
  kodiBatch: 'stores-shell',
  kodiClient: 'stores-shell',
  labApiBrowser: 'stores-route',
  libraryMaintenanceDispatch: 'stores-shell',
  libraryFilter: 'stores-route',
  libraryFilterRecords: 'stores-route',
  localPlayer: 'stores-shell',
  localPlaylist: 'stores-shell',
  localPlaylistModel: 'stores-shell',
  localPlaylistTypes: 'stores-shell',
  localScrobble: 'stores-shell',
  locale: 'stores-shell',
  mainNav: 'stores-shell',
  mediaDirectoryPages: 'stores-route',
  mediaFiles: 'stores-route',
  mediaPlaylists: 'stores-route',
  mediaSearch: 'stores-route',
  musicBrowse: 'stores-route',
  musicDetailLoaders: 'stores-route',
  musicDetailRouteStore: 'stores-route',
  musicLibraryIndexes: 'stores-route',
  musicLibrary: 'stores-route',
  musicLibraryNormalization: 'stores-route',
  pagedKodiLibrary: 'stores-route',
  player: 'stores-shell',
  playerDispatch: 'stores-shell',
  playerDispatchCodecs: 'stores-shell',
  playerDispatchLocalItems: 'stores-shell',
  playerDispatchLocalPlayback: 'stores-shell',
  playerDispatchStreams: 'stores-shell',
  playerDispatchSupport: 'stores-shell',
  playerDispatchTypes: 'stores-shell',
  playerDispatchVideoStreams: 'stores-shell',
  pvr: 'stores-route',
  queue: 'stores-shell',
  queueDispatchModel: 'stores-shell',
  queueStoreSnapshots: 'stores-shell',
  queueTypes: 'stores-shell',
  remoteInputDispatch: 'stores-shell',
  searchAddons: 'stores-route',
  settingsStore: 'stores-route',
  snapshotCache: 'stores-route',
  thumbsUp: 'stores-route',
  videoLibrary: 'stores-route',
  videoLibraryCloning: 'stores-route',
  videoLibraryIndexes: 'stores-route',
  videoLibraryNormalization: 'stores-route',
  videoLibraryTypes: 'stores-route',
  videoMovieDetailStore: 'stores-route',
  videoTvStore: 'stores-route',
  videoWriteExecution: 'stores-route',
  videoWriteStore: 'stores-route',
  webSettings: 'stores-shell'
} as const satisfies Record<string, StoreChunkName>;

export type StoreModuleName = keyof typeof STORE_CHUNK_BY_MODULE;

export function storeChunkNameForId(id: string): StoreChunkName {
  return storeChunkNameForModule(storeModuleNameFromId(id));
}

export function storeChunkNameForModule(moduleName: string): StoreChunkName {
  const chunkName = STORE_CHUNK_BY_MODULE[moduleName as StoreModuleName];

  if (!chunkName) {
    throw new Error(`Unclassified store module: ${moduleName}`);
  }

  return chunkName;
}

export function storeModuleNameFromId(id: string): string {
  const fileName = id.slice(id.lastIndexOf('/') + 1);
  return fileName.replace(/(?:\.svelte)?\.ts$/u, '');
}
