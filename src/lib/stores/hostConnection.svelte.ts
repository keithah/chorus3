import {
  KodiHttpClientError,
  createKodiJsonRpcHttpClient,
  describeKodiEndpoint,
  isKodiHttpClientError,
  testKodiHttpConnection,
  type KodiEndpointDescription,
  type KodiHttpConnectionTestResult,
  type KodiHttpHost,
  type KodiJsonRpcHttpClient,
  type KodiVersion
} from '$lib/kodi';
import {
  connectionStore as defaultConnectionStore,
  type ConnectionStoreSnapshot
} from './connection.svelte';
import {
  configStore as defaultConfigStore,
  type ConfigStore,
  type SavedKodiHost
} from './config.svelte';

export type HostTestStatus = 'idle' | 'testing' | 'success' | 'failed';
export type HostConnectionErrorSource = 'config' | 'host' | 'http';

export interface HostConnectionErrorSnapshot {
  source: HostConnectionErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface HostTestSnapshot {
  status: HostTestStatus;
  error: HostConnectionErrorSnapshot | null;
  endpoint: KodiEndpointDescription | null;
  kodiVersion: KodiVersion | string | null;
  applicationName: string | null;
  testedAt: string | null;
}

export interface ActiveHostSummary {
  id: string;
  label: string;
  host: string;
  port: number;
  useTls: boolean;
  useWebSocket: boolean;
  hasCredentials: boolean;
}

export interface HostConnectionStoreSnapshot {
  activeHostId: string | null;
  activeHostSummary: ActiveHostSummary | null;
  controllerError: HostConnectionErrorSnapshot | null;
  hostTests: Record<string, HostTestSnapshot>;
  connection: ConnectionStoreSnapshot | unknown;
}

export interface HostConnectionConnectionStore {
  connect(host: SavedKodiHost): Promise<void> | void;
  disconnect(): void;
  destroy(): void;
  readonly snapshot: ConnectionStoreSnapshot | unknown;
}

export interface HostConnectionStoreOptions {
  configStore?: ConfigStore;
  connectionStore?: HostConnectionConnectionStore;
  createHttpClient?: (host: KodiHttpHost) => KodiJsonRpcHttpClient;
  testHttpConnection?: (client: KodiJsonRpcHttpClient) => Promise<KodiHttpConnectionTestResult>;
  now?: () => string;
}

export class HostConnectionStore {
  hostTests = $state<Record<string, HostTestSnapshot>>({});
  controllerError = $state<HostConnectionErrorSnapshot | null>(null);

  readonly #configStore: ConfigStore;
  readonly #connectionStore: HostConnectionConnectionStore;
  readonly #createHttpClient: (host: KodiHttpHost) => KodiJsonRpcHttpClient;
  readonly #testHttpConnection: (
    client: KodiJsonRpcHttpClient
  ) => Promise<KodiHttpConnectionTestResult>;
  readonly #now: () => string;

  #testRequestIds = new Map<string, number>();
  #nextTestRequestId = 0;

  constructor(options: HostConnectionStoreOptions = {}) {
    this.#configStore = options.configStore ?? defaultConfigStore;
    this.#connectionStore = options.connectionStore ?? defaultConnectionStore;
    this.#createHttpClient = options.createHttpClient ?? createKodiJsonRpcHttpClient;
    this.#testHttpConnection = options.testHttpConnection ?? testKodiHttpConnection;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): HostConnectionStoreSnapshot {
    const activeHost = this.#configStore.activeHost;

    return {
      activeHostId: this.#configStore.snapshot.activeHostId,
      activeHostSummary: activeHost ? createActiveHostSummary(activeHost) : null,
      controllerError: this.controllerError ? { ...this.controllerError } : null,
      hostTests: cloneHostTests(this.hostTests),
      connection: this.#connectionStore.snapshot
    };
  }

  async testHost(hostId: string): Promise<void> {
    const host = this.#findHost(hostId);

    if (!host) {
      this.controllerError = createConfigError('unknown-host', 'Choose a saved Kodi host to test.');
      return;
    }

    const requestId = this.#startHostTest(host);
    let endpoint: KodiEndpointDescription;

    try {
      endpoint = describeKodiEndpoint(toHttpHost(host));
    } catch (error) {
      if (this.#isCurrentHostTest(host, requestId)) {
        this.#setHostTest(host.id, {
          status: 'failed',
          error: createHostError(error),
          endpoint: null,
          kodiVersion: null,
          applicationName: null,
          testedAt: this.#now()
        });
      }
      return;
    }

    this.#setHostTest(host.id, {
      ...this.hostTests[host.id],
      status: 'testing',
      endpoint,
      error: null
    });

    try {
      const client = this.#createHttpClient(toHttpHost(host));
      const result = await this.#testHttpConnection(client);

      if (!this.#isCurrentHostTest(host, requestId)) {
        return;
      }

      this.#setHostTest(host.id, {
        status: 'success',
        error: null,
        endpoint,
        kodiVersion: extractKodiVersion(result),
        applicationName:
          typeof result.application.name === 'string' ? result.application.name : null,
        testedAt: this.#now()
      });
      this.controllerError = null;
    } catch (error) {
      if (!this.#isCurrentHostTest(host, requestId)) {
        return;
      }

      this.#setHostTest(host.id, {
        status: 'failed',
        error: createHttpError(error, endpoint),
        endpoint,
        kodiVersion: null,
        applicationName: null,
        testedAt: this.#now()
      });
    }
  }

  async activateHost(hostId: string): Promise<void> {
    const host = this.#findHost(hostId);

    if (!host) {
      this.controllerError = createConfigError(
        'unknown-host',
        'Choose a saved Kodi host before connecting.'
      );
      return;
    }

    const activation = this.#configStore.setActiveHost(hostId);

    if (!activation.ok) {
      this.controllerError = createConfigError(
        'invalid-active-host',
        activation.errors.activeHostId ?? 'Choose a saved Kodi host before connecting.'
      );
      return;
    }

    if (!activation.host) {
      this.controllerError = createConfigError(
        'invalid-active-host',
        'Choose a saved Kodi host before connecting.'
      );
      return;
    }

    this.controllerError = null;
    await this.#connectionStore.connect(activation.host);
  }

  disconnectActiveHost(): void {
    this.#connectionStore.disconnect();
  }

  syncActiveHost(): void {
    const activeHost = this.#configStore.activeHost;

    if (activeHost) {
      return;
    }

    this.controllerError = null;
    this.#connectionStore.disconnect();
  }

  destroy(): void {
    this.#testRequestIds.clear();
    this.hostTests = {};
    this.controllerError = null;
    this.#connectionStore.destroy();
  }

  #findHost(hostId: string): SavedKodiHost | null {
    return this.#configStore.snapshot.hosts.find((host) => host.id === hostId) ?? null;
  }

  #startHostTest(host: SavedKodiHost): number {
    const requestId = ++this.#nextTestRequestId;
    this.#testRequestIds.set(host.id, requestId);
    this.#setHostTest(host.id, {
      status: 'testing',
      error: null,
      endpoint: null,
      kodiVersion: null,
      applicationName: null,
      testedAt: null
    });
    return requestId;
  }

  #isCurrentHostTest(startedHost: SavedKodiHost, requestId: number): boolean {
    const currentHost = this.#findHost(startedHost.id);

    if (!currentHost) {
      this.#removeHostTest(startedHost.id);
      return false;
    }

    return (
      this.#testRequestIds.get(startedHost.id) === requestId &&
      hostFingerprint(currentHost) === hostFingerprint(startedHost)
    );
  }

  #setHostTest(hostId: string, test: HostTestSnapshot): void {
    this.hostTests = {
      ...this.hostTests,
      [hostId]: cloneHostTest(test)
    };
  }

  #removeHostTest(hostId: string): void {
    const remainingTests = { ...this.hostTests };
    delete remainingTests[hostId];
    this.hostTests = remainingTests;
  }
}

export function createHostConnectionStore(
  options: HostConnectionStoreOptions = {}
): HostConnectionStore {
  return new HostConnectionStore(options);
}

export const hostConnectionStore = createHostConnectionStore();

function toHttpHost(host: SavedKodiHost): KodiHttpHost {
  return {
    host: host.host,
    ...(host.port === undefined ? {} : { port: host.port }),
    ...(host.username === undefined ? {} : { username: host.username }),
    ...(host.password === undefined ? {} : { password: host.password }),
    useTls: host.useTls
  };
}

function createActiveHostSummary(host: SavedKodiHost): ActiveHostSummary {
  const endpoint = describeKodiEndpoint(toHttpHost(host));

  return {
    id: host.id,
    label: host.label,
    host: endpoint.host,
    port: endpoint.port,
    useTls: host.useTls,
    useWebSocket: host.useWebSocket,
    hasCredentials: endpoint.hasCredentials
  };
}

function extractKodiVersion(result: KodiHttpConnectionTestResult): KodiVersion | string | null {
  return result.application.version ?? result.jsonRpcVersion.version ?? null;
}

function createConfigError(code: string, message: string): HostConnectionErrorSnapshot {
  return { source: 'config', code, message };
}

function createHostError(error: unknown): HostConnectionErrorSnapshot {
  return {
    source: 'host',
    code: 'invalid-host',
    message: error instanceof Error ? error.message : 'Kodi host configuration is invalid.'
  };
}

function createHttpError(
  error: unknown,
  fallbackEndpoint: KodiEndpointDescription
): HostConnectionErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: error.message,
      endpoint: error.endpoint
    };
  }

  return {
    source: 'http',
    code: 'network',
    message:
      error instanceof Error ? error.message : 'Could not reach Kodi while testing HTTP JSON-RPC.',
    endpoint: fallbackEndpoint
  };
}

function hostFingerprint(host: SavedKodiHost): string {
  return JSON.stringify({
    id: host.id,
    label: host.label,
    host: host.host,
    port: host.port ?? null,
    username: host.username ?? null,
    password: host.password ?? null,
    useTls: host.useTls,
    useWebSocket: host.useWebSocket
  });
}

function cloneHostTests(tests: Record<string, HostTestSnapshot>): Record<string, HostTestSnapshot> {
  return Object.fromEntries(
    Object.entries(tests).map(([hostId, test]) => [hostId, cloneHostTest(test)])
  );
}

function cloneHostTest(test: HostTestSnapshot): HostTestSnapshot {
  return {
    ...test,
    error: test.error ? cloneError(test.error) : null,
    endpoint: test.endpoint ? { ...test.endpoint } : null,
    kodiVersion:
      typeof test.kodiVersion === 'object' && test.kodiVersion !== null
        ? { ...test.kodiVersion }
        : test.kodiVersion
  };
}

function cloneError(error: HostConnectionErrorSnapshot): HostConnectionErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}
