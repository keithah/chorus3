import {
  createKodiJsonRpcHttpClient,
  type KodiHttpHost,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import {
  configStore as defaultConfigStore,
  type ConfigStore,
  type SavedKodiHost
} from './config.svelte';

export interface ActiveKodiClientOptions {
  configStore?: ConfigStore;
  createClient?: (host: KodiHttpHost) => KodiJsonRpcHttpClient;
}

export function savedKodiHostToKodiHttpHost(host: SavedKodiHost): KodiHttpHost {
  return {
    host: host.host,
    ...(host.port === undefined ? {} : { port: host.port }),
    ...(host.username === undefined ? {} : { username: host.username }),
    ...(host.password === undefined ? {} : { password: host.password }),
    useTls: host.useTls
  };
}

export function createActiveKodiJsonRpcHttpClient(
  options: ActiveKodiClientOptions = {}
): KodiJsonRpcHttpClient | null {
  const configStore = options.configStore ?? defaultConfigStore;
  const activeHost = configStore.activeHost;

  if (!activeHost) {
    return null;
  }

  const createClient = options.createClient ?? createKodiJsonRpcHttpClient;
  return createClient(savedKodiHostToKodiHttpHost(activeHost));
}
