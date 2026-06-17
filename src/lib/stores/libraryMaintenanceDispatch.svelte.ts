import {
  KodiHttpClientError,
  isKodiHttpClientError,
  scanAudioLibrary,
  scanVideoLibrary,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { redactStoreErrorMessage } from '$lib/safety/redaction';
import { configStore as defaultConfigStore, type ConfigStore } from './config.svelte.ts';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type LibraryMaintenanceCommand = 'scanVideo' | 'scanAudio';
export type LibraryMaintenanceCommandStatus = 'idle' | 'running' | 'success' | 'failed';
export type LibraryMaintenanceErrorSource = 'config' | 'http' | 'command';

export interface LibraryMaintenanceSafeErrorSnapshot {
  source: LibraryMaintenanceErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface LibraryMaintenanceDispatchSnapshot {
  commandStatus: LibraryMaintenanceCommandStatus;
  lastCommand: LibraryMaintenanceCommand | null;
  lastError: LibraryMaintenanceSafeErrorSnapshot | null;
  lastCompletedAt: string | null;
}

export interface LibraryMaintenanceDispatchOptions {
  configStore?: ConfigStore;
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const DEFAULT_SNAPSHOT: LibraryMaintenanceDispatchSnapshot = {
  commandStatus: 'idle',
  lastCommand: null,
  lastError: null,
  lastCompletedAt: null
};

export class LibraryMaintenanceDispatch {
  #snapshot = $state<LibraryMaintenanceDispatchSnapshot>({ ...DEFAULT_SNAPSHOT });

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;

  constructor(options: LibraryMaintenanceDispatchOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient =
      options.createClient ??
      (() =>
        createActiveKodiJsonRpcHttpClient({
          configStore: options.configStore ?? defaultConfigStore
        }));
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): LibraryMaintenanceDispatchSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  scanVideo(): Promise<void> {
    return this.#runCommand('scanVideo');
  }

  scanAudio(): Promise<void> {
    return this.#runCommand('scanAudio');
  }

  async #runCommand(command: LibraryMaintenanceCommand): Promise<void> {
    this.#startCommand(command);

    const { client, error } = this.#resolveClient();
    if (error) {
      this.#failCommand(error);
      return;
    }

    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before scanning a library.'
        )
      );
      return;
    }

    try {
      if (command === 'scanVideo') {
        await scanVideoLibrary(client);
      } else {
        await scanAudioLibrary(client);
      }
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastCommand: command,
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  #resolveClient(): {
    client: KodiJsonRpcHttpClient | null;
    error: LibraryMaintenanceSafeErrorSnapshot | null;
  } {
    if (this.#client) {
      return { client: this.#client, error: null };
    }

    try {
      return { client: this.#createClient(), error: null };
    } catch (error) {
      return { client: null, error: createSafeError(error) };
    }
  }

  #startCommand(command: LibraryMaintenanceCommand): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'running',
      lastCommand: command,
      lastError: null
    };
  }

  #failCommand(error: LibraryMaintenanceSafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'failed',
      lastError: error,
      lastCompletedAt: this.#now()
    };
  }
}

function createConfigError(code: string, message: string): LibraryMaintenanceSafeErrorSnapshot {
  return { source: 'config', code, message };
}

function createSafeError(error: unknown): LibraryMaintenanceSafeErrorSnapshot {
  if (isKodiHttpClientError(error)) {
    return {
      source: 'http',
      code: error.code,
      message: redactStoreErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  if (error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: redactStoreErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  return {
    source: 'command',
    code: 'command/library-maintenance-failed',
    message: redactStoreErrorMessage(
      error instanceof Error ? error.message : 'Library maintenance command failed.'
    )
  };
}

function cloneSnapshot(
  snapshot: LibraryMaintenanceDispatchSnapshot
): LibraryMaintenanceDispatchSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError
      ? {
          ...snapshot.lastError,
          ...(snapshot.lastError.endpoint ? { endpoint: { ...snapshot.lastError.endpoint } } : {})
        }
      : null
  };
}

export function createLibraryMaintenanceDispatch(
  options: LibraryMaintenanceDispatchOptions = {}
): LibraryMaintenanceDispatch {
  return new LibraryMaintenanceDispatch(options);
}

export const libraryMaintenanceDispatch = createLibraryMaintenanceDispatch();
