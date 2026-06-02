import { describe, expect, it, vi } from 'vitest';

import type { SavedKodiHost } from '$lib/stores';
import {
  activatePackageMountedHost,
  bestEffortRefresh,
  withPackageDefaultCredentials
} from './appPackageHost';

function host(overrides: Partial<SavedKodiHost> = {}): SavedKodiHost {
  return {
    id: 'package',
    label: 'Package Kodi',
    host: '127.0.0.1',
    port: 8080,
    useTls: false,
    useWebSocket: true,
    ...overrides
  };
}

describe('app package host helpers', () => {
  it('adds default Kodi credentials only when no credentials are present', () => {
    expect(withPackageDefaultCredentials(host())).toMatchObject({
      username: 'kodi',
      password: 'kodi'
    });

    const explicit = host({ username: 'alice', password: '' });
    expect(withPackageDefaultCredentials(explicit)).toBe(explicit);
  });

  it('activates new and existing package-mounted hosts without duplicating the active host', () => {
    const packageHost = host();
    const store = {
      activeHost: null as SavedKodiHost | null,
      hosts: [] as SavedKodiHost[],
      addHost: vi.fn((value: SavedKodiHost) => store.hosts.push(value)),
      updateHost: vi.fn((id: string, value: SavedKodiHost) => {
        store.hosts = store.hosts.map((saved) => (saved.id === id ? value : saved));
      }),
      setActiveHost: vi.fn((id: string) => {
        store.activeHost = store.hosts.find((saved) => saved.id === id) ?? null;
      })
    };

    activatePackageMountedHost(store, packageHost);

    expect(store.addHost).toHaveBeenCalledWith(packageHost);
    expect(store.updateHost).not.toHaveBeenCalled();
    expect(store.setActiveHost).toHaveBeenCalledWith('package');

    const updated = host({ label: 'Updated package Kodi' });
    store.activeHost = null;
    activatePackageMountedHost(store, updated);

    expect(store.updateHost).toHaveBeenCalledWith('package', updated);
    expect(store.setActiveHost).toHaveBeenCalledTimes(2);

    activatePackageMountedHost(store, updated);
    expect(store.addHost).toHaveBeenCalledTimes(1);
    expect(store.updateHost).toHaveBeenCalledTimes(1);
    expect(store.setActiveHost).toHaveBeenCalledTimes(2);
  });

  it('runs refreshes best-effort without failing when one rejects', async () => {
    const calls: string[] = [];

    await expect(
      bestEffortRefresh([
        async () => {
          calls.push('first');
        },
        async () => {
          calls.push('second');
          throw new Error('refresh failed');
        }
      ])
    ).resolves.toBeUndefined();

    expect(calls).toEqual(['first', 'second']);
  });
});
