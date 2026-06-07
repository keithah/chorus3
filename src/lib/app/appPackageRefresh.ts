import { bestEffortRefresh } from '$lib/app/appPackageHost';
import {
  addonsStore,
  mediaFilesStore,
  mediaPlaylistsStore,
  musicLibraryStore,
  playerStore,
  queueStore,
  settingsStore,
  videoMediaFilesStore,
  videoMediaPlaylistsStore
} from '$lib/stores';
import { videoLibraryStore } from '$lib/stores/videoLibrary.svelte';

export async function refreshPackageMountedLibraries(): Promise<void> {
  await bestEffortRefresh([
    () => playerStore.refresh('manual'),
    () => queueStore.refresh('manual'),
    () => musicLibraryStore.refresh('manual'),
    () => videoLibraryStore.refresh('manual'),
    () => mediaFilesStore.refreshSources(),
    () => videoMediaFilesStore.refreshSources(),
    () => mediaPlaylistsStore.refreshPlaylists(),
    () => videoMediaPlaylistsStore.refreshPlaylists(),
    () => settingsStore.load(),
    () => addonsStore.loadAddons()
  ]);
}
