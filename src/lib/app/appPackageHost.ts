import type { SavedKodiHost } from '$lib/stores';

export type PackageHostConfigStore = {
  readonly activeHost: SavedKodiHost | null;
  readonly hosts: readonly SavedKodiHost[];
  addHost(host: SavedKodiHost): unknown;
  updateHost(id: string, host: SavedKodiHost): unknown;
  setActiveHost(id: string): unknown;
};

export function withPackageDefaultCredentials(host: SavedKodiHost): SavedKodiHost {
  if (host.username || host.password) {
    return host;
  }

  return {
    ...host,
    username: 'kodi',
    password: 'kodi'
  };
}

export function activatePackageMountedHost(
  store: PackageHostConfigStore,
  host: SavedKodiHost
): void {
  if (store.activeHost?.id === host.id) {
    return;
  }

  if (store.hosts.some((savedHost) => savedHost.id === host.id)) {
    store.updateHost(host.id, host);
  } else {
    store.addHost(host);
  }

  store.setActiveHost(host.id);
}

export async function bestEffortRefresh(refreshes: Array<() => Promise<void>>): Promise<void> {
  await Promise.allSettled(refreshes.map((refresh) => refresh()));
}
