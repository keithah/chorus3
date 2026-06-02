import { parseAppRoute, type AppRoute } from '$lib/app/appRouter';
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

export function parseHashAppRoute(
  hash: string | undefined,
  packageBasePath: string
): AppRoute | null {
  if (typeof hash !== 'string') {
    return null;
  }
  if (hash.length === 0) {
    return { kind: 'primary', route: { kind: 'home' } };
  }

  const raw = hash.slice(1).trim();
  if (!raw) {
    return { kind: 'primary', route: { kind: 'home' } };
  }

  const [path = '', query = ''] = raw.split('?', 2);

  return parseAppRoute(path.startsWith('/') ? path : `/${path}`, query ? `?${query}` : '', {
    packageBasePath
  });
}

export function toggleDocumentFullscreen(document: Document): void {
  const documentElement = document.documentElement;

  if (document.fullscreenElement) {
    void document.exitFullscreen?.().catch(() => {
      // Fullscreen support is host-dependent; keyboard handling remains best-effort.
    });
    return;
  }

  void documentElement.requestFullscreen?.().catch(() => {
    // Fullscreen support is host-dependent; keyboard handling remains best-effort.
  });
}
