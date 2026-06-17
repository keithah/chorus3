import { bestEffortRefresh } from '$lib/app/appPackageHost';
import { appRouteStores } from '$lib/app/appRouteStores';
import { playerStore } from '$lib/stores/player.svelte';
import { queueStore } from '$lib/stores/queue.svelte';

export async function refreshPackageMountedLibraries(): Promise<void> {
  await bestEffortRefresh([
    () => playerStore.refresh('manual'),
    () => queueStore.refresh('manual'),
    async () => (await appRouteStores.musicLibrary()).refresh('manual'),
    async () => (await appRouteStores.videoLibrary()).refresh('manual'),
    async () => (await appRouteStores.mediaFiles()).refreshSources(),
    async () => (await appRouteStores.videoMediaFiles()).refreshSources(),
    async () => (await appRouteStores.mediaPlaylists()).refreshPlaylists(),
    async () => (await appRouteStores.videoMediaPlaylists()).refreshPlaylists(),
    async () => (await appRouteStores.settings()).load(),
    async () => (await appRouteStores.addons()).loadAddons()
  ]);
}
