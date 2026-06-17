import { describe, expect, it, vi } from 'vitest';

import {
  KodiHttpClientError,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { createLibraryMaintenanceDispatch } from './libraryMaintenanceDispatch.svelte';

describe('libraryMaintenanceDispatch', () => {
  it('clones nested endpoint details in error snapshots', async () => {
    const endpoint: KodiEndpointDescription = {
      protocol: 'http:',
      host: 'kodi.local',
      port: 8080,
      path: '/jsonrpc',
      timeoutMs: 5000,
      hasCredentials: true
    };
    const client: KodiJsonRpcHttpClient = {
      call: vi.fn().mockRejectedValue(
        new KodiHttpClientError({
          code: 'network',
          method: 'VideoLibrary.Scan',
          endpoint
        })
      )
    };
    const dispatch = createLibraryMaintenanceDispatch({ client });

    await dispatch.scanVideo();

    const firstSnapshot = dispatch.snapshot;
    firstSnapshot.lastError!.endpoint!.host = 'mutated.example';

    expect(dispatch.snapshot.lastError?.endpoint?.host).toBe('kodi.local');
  });
});
