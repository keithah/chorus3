import {
  KodiHttpClientError,
  executeInputAction,
  isKodiHttpClientError,
  sendInputCommand,
  sendInputText,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type RemoteInputAction,
  type RemoteInputCommand
} from '$lib/kodi';
import { redactStoreErrorMessage } from '$lib/safety/redaction';
import { configStore as defaultConfigStore, type ConfigStore } from './config.svelte.ts';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type RemoteInputCommandStatus = 'idle' | 'running' | 'success' | 'failed';
export type RemoteInputDispatchErrorSource = 'config' | 'input' | 'http' | 'command';

export interface RemoteInputDispatchSafeErrorSnapshot {
  source: RemoteInputDispatchErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface RemoteInputDispatchSnapshot {
  commandStatus: RemoteInputCommandStatus;
  lastCommand: RemoteInputCommand | 'sendText' | 'executeAction' | null;
  lastError: RemoteInputDispatchSafeErrorSnapshot | null;
  lastCompletedAt: string | null;
}

export interface RemoteInputDispatchOptions {
  configStore?: ConfigStore;
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const DEFAULT_SNAPSHOT: RemoteInputDispatchSnapshot = {
  commandStatus: 'idle',
  lastCommand: null,
  lastError: null,
  lastCompletedAt: null
};

const REMOTE_INPUT_COMMAND_SET = new Set<RemoteInputCommand>([
  'left',
  'up',
  'right',
  'down',
  'back',
  'select',
  'contextMenu',
  'info',
  'home'
]);
const REMOTE_INPUT_ACTION_SET = new Set<RemoteInputAction>([
  'showsubtitles',
  'close',
  'fullscreen',
  'osd',
  'screenshot'
]);

export class RemoteInputDispatch {
  #snapshot = $state<RemoteInputDispatchSnapshot>({ ...DEFAULT_SNAPSHOT });

  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;

  constructor(options: RemoteInputDispatchOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient =
      options.createClient ??
      (() =>
        createActiveKodiJsonRpcHttpClient({
          configStore: options.configStore ?? defaultConfigStore
        }));
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): RemoteInputDispatchSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  sendInput(command: RemoteInputCommand): Promise<void> {
    return this.send(command);
  }

  sendText(text: string): Promise<void> {
    return this.#runTextCommand(text);
  }

  executeAction(action: RemoteInputAction): Promise<void> {
    return this.#runActionCommand(action);
  }

  async send(command: RemoteInputCommand): Promise<void> {
    if (!isRemoteInputCommand(command)) {
      this.#snapshot = {
        ...this.#snapshot,
        commandStatus: 'failed',
        lastCommand: null,
        lastError: createInputError(
          'input/unknown-remote-command',
          'Choose a supported remote input command.'
        ),
        lastCompletedAt: this.#now()
      };
      return;
    }

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
          'Choose an active Kodi host before using remote controls.'
        )
      );
      return;
    }

    try {
      await sendInputCommand(client, command);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  async #runTextCommand(text: string): Promise<void> {
    const normalized = typeof text === 'string' ? text : '';
    if (!normalized || normalized.length > 1000) {
      this.#snapshot = {
        ...this.#snapshot,
        commandStatus: 'failed',
        lastCommand: 'sendText',
        lastError: createInputError('input/invalid-text', 'Enter text that Kodi can receive.'),
        lastCompletedAt: this.#now()
      };
      return;
    }

    this.#startCommand('sendText');

    const { client, error } = this.#resolveClient();
    if (error) {
      this.#failCommand(error);
      return;
    }

    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before using remote controls.'
        )
      );
      return;
    }

    try {
      await sendInputText(client, normalized);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  async #runActionCommand(action: RemoteInputAction): Promise<void> {
    if (!isRemoteInputAction(action)) {
      this.#snapshot = {
        ...this.#snapshot,
        commandStatus: 'failed',
        lastCommand: 'executeAction',
        lastError: createInputError(
          'input/unknown-remote-action',
          'Choose a supported remote input action.'
        ),
        lastCompletedAt: this.#now()
      };
      return;
    }

    this.#startCommand('executeAction');

    const { client, error } = this.#resolveClient();
    if (error) {
      this.#failCommand(error);
      return;
    }

    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before using remote controls.'
        )
      );
      return;
    }

    try {
      await executeInputAction(client, action);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  #startCommand(command: RemoteInputDispatchSnapshot['lastCommand']): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'running',
      lastCommand: command,
      lastError: null
    };
  }

  #failCommand(error: RemoteInputDispatchSafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'failed',
      lastError: cloneError(error),
      lastCompletedAt: this.#now()
    };
  }

  #resolveClient(): {
    client: KodiJsonRpcHttpClient | null;
    error: RemoteInputDispatchSafeErrorSnapshot | null;
  } {
    try {
      return { client: this.#client ?? this.#createClient(), error: null };
    } catch (error) {
      return { client: null, error: createSafeError(error) };
    }
  }
}

function isRemoteInputCommand(command: unknown): command is RemoteInputCommand {
  return typeof command === 'string' && REMOTE_INPUT_COMMAND_SET.has(command as RemoteInputCommand);
}

function isRemoteInputAction(action: unknown): action is RemoteInputAction {
  return typeof action === 'string' && REMOTE_INPUT_ACTION_SET.has(action as RemoteInputAction);
}

function createInputError(code: string, message: string): RemoteInputDispatchSafeErrorSnapshot {
  return { source: 'input', code, message };
}

function createConfigError(code: string, message: string): RemoteInputDispatchSafeErrorSnapshot {
  return { source: 'config', code, message };
}

function createSafeError(error: unknown): RemoteInputDispatchSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeKodiHttpErrorMessage(error),
      endpoint: error.endpoint
    };
  }

  if (error instanceof Error && isErrorWithCode(error)) {
    const source: RemoteInputDispatchErrorSource = error.code.startsWith('input/')
      ? 'input'
      : error.code.startsWith('config/')
        ? 'config'
        : 'command';

    return {
      source,
      code: error.code,
      message: sanitizeErrorMessage(error.message)
    };
  }

  return {
    source: 'command',
    code: 'command/failed',
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Remote input command failed.'
    )
  };
}

function isErrorWithCode(error: Error): error is Error & { code: string } {
  return (
    Object.prototype.hasOwnProperty.call(error, 'code') &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function sanitizeKodiHttpErrorMessage(error: KodiHttpClientError): string {
  if (error.code === 'timeout') {
    return `Kodi request timed out after ${error.timeoutMs ?? 'the configured timeout'}ms while calling ${error.method}.`;
  }

  return sanitizeErrorMessage(error.message);
}

function sanitizeErrorMessage(message: string): string {
  return redactStoreErrorMessage(message);
}

function cloneSnapshot(snapshot: RemoteInputDispatchSnapshot): RemoteInputDispatchSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null
  };
}

function cloneError(
  error: RemoteInputDispatchSafeErrorSnapshot
): RemoteInputDispatchSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

export function createRemoteInputDispatch(
  options: RemoteInputDispatchOptions = {}
): RemoteInputDispatch {
  return new RemoteInputDispatch(options);
}

export const remoteInputDispatch = createRemoteInputDispatch();
