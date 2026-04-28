import {
  KodiHttpClientError,
  goToPlayerItem,
  isKodiHttpClientError,
  playPausePlayer,
  seekPlayer,
  setApplicationMute,
  setApplicationVolume,
  setPlayerAudioStream,
  setPlayerRepeat,
  setPlayerShuffle,
  setPlayerSubtitle,
  stopPlayer,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient,
  type PlayerAudioStreamValue,
  type PlayerRepeatValue,
  type PlayerSeekStep,
  type PlayerShuffleValue,
  type PlayerSubtitleValue
} from '$lib/kodi';
import { playerStore as defaultPlayerStore, type PlayerStoreSnapshot } from './player.svelte';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type PlayerDispatchMode = 'kodi' | 'local';
export type PlayerCommandStatus = 'idle' | 'running' | 'success' | 'error';
export type PlayerCommandName =
  | 'playPause'
  | 'stop'
  | 'previous'
  | 'next'
  | 'seekPercentage'
  | 'seekRelativeSeconds'
  | 'seekStep'
  | 'setVolume'
  | 'toggleMute'
  | 'setShuffle'
  | 'setRepeat'
  | 'setAudioStream'
  | 'setSubtitle';
export type PlayerDispatchErrorSource = 'config' | 'player' | 'mode' | 'input' | 'http' | 'command';

export interface PlayerDispatchSafeErrorSnapshot {
  source: PlayerDispatchErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface PlayerDispatchSnapshot {
  mode: PlayerDispatchMode;
  commandStatus: PlayerCommandStatus;
  lastCommand: PlayerCommandName | null;
  lastError: PlayerDispatchSafeErrorSnapshot | null;
  lastCompletedAt: string | null;
}

export interface PlayerDispatchPlayerStore {
  readonly snapshot: PlayerStoreSnapshot;
  refresh(reason: `command:${PlayerCommandName}`): Promise<void> | void;
}

export interface PlayerDispatchOptions {
  mode?: PlayerDispatchMode;
  playerStore?: PlayerDispatchPlayerStore;
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

type CommandRunInput = {
  command: PlayerCommandName;
  validate?: () => PlayerDispatchSafeErrorSnapshot | null;
  execute: (client: KodiJsonRpcHttpClient, playerid: number) => Promise<unknown>;
};

const DEFAULT_SNAPSHOT: PlayerDispatchSnapshot = {
  mode: 'kodi',
  commandStatus: 'idle',
  lastCommand: null,
  lastError: null,
  lastCompletedAt: null
};

const VALID_SEEK_STEPS = new Set<PlayerSeekStep>([
  'smallforward',
  'smallbackward',
  'bigforward',
  'bigbackward'
]);
const VALID_REPEAT_VALUES = new Set<PlayerRepeatValue>(['off', 'one', 'all', 'cycle']);
const VALID_AUDIO_STREAM_LITERALS = new Set<PlayerAudioStreamValue>(['previous', 'next']);
const VALID_SUBTITLE_LITERALS = new Set<PlayerSubtitleValue>(['previous', 'next', 'off', 'on']);

export class PlayerDispatch {
  #snapshot = $state<PlayerDispatchSnapshot>({ ...DEFAULT_SNAPSHOT });

  readonly #playerStore: PlayerDispatchPlayerStore;
  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;

  constructor(options: PlayerDispatchOptions = {}) {
    this.#snapshot = { ...DEFAULT_SNAPSHOT, mode: options.mode ?? 'kodi' };
    this.#playerStore = options.playerStore ?? defaultPlayerStore;
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): PlayerDispatchSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  setMode(mode: PlayerDispatchMode): void {
    this.#snapshot = {
      ...this.#snapshot,
      mode
    };
  }

  playPause(): Promise<void> {
    return this.#runPlayerCommand({
      command: 'playPause',
      execute: (client, playerid) => playPausePlayer(client, playerid)
    });
  }

  stop(): Promise<void> {
    return this.#runPlayerCommand({
      command: 'stop',
      execute: (client, playerid) => stopPlayer(client, playerid)
    });
  }

  previous(): Promise<void> {
    return this.#runPlayerCommand({
      command: 'previous',
      execute: (client, playerid) => goToPlayerItem(client, playerid, 'previous')
    });
  }

  next(): Promise<void> {
    return this.#runPlayerCommand({
      command: 'next',
      execute: (client, playerid) => goToPlayerItem(client, playerid, 'next')
    });
  }

  seekPercentage(percentage: number): Promise<void> {
    return this.#runPlayerCommand({
      command: 'seekPercentage',
      validate: () => validateBoundedNumber(percentage, 0, 100, 'input/invalid-seek-percentage'),
      execute: (client, playerid) => seekPlayer(client, playerid, { percentage })
    });
  }

  seekRelativeSeconds(seconds: number): Promise<void> {
    return this.#runPlayerCommand({
      command: 'seekRelativeSeconds',
      validate: () => validateFiniteNumber(seconds, 'input/invalid-seek-seconds'),
      execute: (client, playerid) => seekPlayer(client, playerid, { seconds })
    });
  }

  seekStep(step: PlayerSeekStep): Promise<void> {
    return this.#runPlayerCommand({
      command: 'seekStep',
      validate: () =>
        VALID_SEEK_STEPS.has(step)
          ? null
          : createInputError('input/invalid-seek-step', 'Choose a supported seek step.'),
      execute: (client, playerid) => seekPlayer(client, playerid, { step })
    });
  }

  setVolume(volume: number): Promise<void> {
    const clampedVolume = Number.isFinite(volume)
      ? Math.min(100, Math.max(0, Math.round(volume)))
      : volume;

    return this.#runApplicationCommand({
      command: 'setVolume',
      validate: () => validateFiniteNumber(volume, 'input/invalid-volume'),
      execute: (client) => setApplicationVolume(client, clampedVolume)
    });
  }

  toggleMute(): Promise<void> {
    return this.#runApplicationCommand({
      command: 'toggleMute',
      execute: (client) => setApplicationMute(client, 'toggle')
    });
  }

  setShuffle(shuffle: PlayerShuffleValue): Promise<void> {
    return this.#runPlayerCommand({
      command: 'setShuffle',
      validate: () =>
        typeof shuffle === 'boolean' || shuffle === 'toggle'
          ? null
          : createInputError('input/invalid-shuffle', 'Choose a supported shuffle value.'),
      execute: (client, playerid) => setPlayerShuffle(client, playerid, shuffle)
    });
  }

  setRepeat(repeat: PlayerRepeatValue): Promise<void> {
    return this.#runPlayerCommand({
      command: 'setRepeat',
      validate: () =>
        VALID_REPEAT_VALUES.has(repeat)
          ? null
          : createInputError('input/invalid-repeat', 'Choose a supported repeat value.'),
      execute: (client, playerid) => setPlayerRepeat(client, playerid, repeat)
    });
  }

  setAudioStream(stream: PlayerAudioStreamValue): Promise<void> {
    return this.#runPlayerCommand({
      command: 'setAudioStream',
      validate: () => validateAudioStream(stream),
      execute: (client, playerid) => setPlayerAudioStream(client, playerid, stream)
    });
  }

  setSubtitle(subtitle: PlayerSubtitleValue): Promise<void> {
    return this.#runPlayerCommand({
      command: 'setSubtitle',
      validate: () => validateSubtitle(subtitle),
      execute: (client, playerid) => setPlayerSubtitle(client, playerid, subtitle)
    });
  }

  async #runApplicationCommand(
    input: Omit<CommandRunInput, 'execute'> & {
      execute: (client: KodiJsonRpcHttpClient) => Promise<unknown>;
    }
  ): Promise<void> {
    await this.#runCommand({
      command: input.command,
      validate: input.validate,
      resolvePlayerid: false,
      execute: (client) => input.execute(client)
    });
  }

  async #runPlayerCommand(input: CommandRunInput): Promise<void> {
    await this.#runCommand({ ...input, resolvePlayerid: true });
  }

  async #runCommand(input: CommandRunInput & { resolvePlayerid: boolean }): Promise<void> {
    this.#startCommand(input.command);

    const validationError = input.validate?.() ?? null;
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    const modeError = this.#validateMode();
    if (modeError) {
      this.#failCommand(modeError);
      return;
    }

    const client = this.#resolveClient();
    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before using playback controls.'
        )
      );
      return;
    }

    let playerid = 0;
    if (input.resolvePlayerid) {
      const resolvedPlayerid = this.#resolveSinglePlayerId();
      if (resolvedPlayerid === null) {
        return;
      }
      playerid = resolvedPlayerid;
    }

    let commandError: PlayerDispatchSafeErrorSnapshot | null = null;

    try {
      await input.execute(client, playerid);
    } catch (error) {
      commandError = createSafeError(error);
    }

    try {
      await this.#playerStore.refresh(`command:${input.command}`);
    } catch {
      // Refresh errors are represented on playerStore.snapshot.lastError. Preserve command status.
    }

    if (commandError) {
      this.#failCommand(commandError, { preserveCompletionTime: true });
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  #startCommand(command: PlayerCommandName): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'running',
      lastCommand: command,
      lastError: null
    };
  }

  #failCommand(
    error: PlayerDispatchSafeErrorSnapshot,
    options: { preserveCompletionTime?: boolean } = {}
  ): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'error',
      lastError: cloneError(error),
      lastCompletedAt: options.preserveCompletionTime ? this.#now() : this.#snapshot.lastCompletedAt
    };
  }

  #validateMode(): PlayerDispatchSafeErrorSnapshot | null {
    if (this.#snapshot.mode === 'kodi') {
      return null;
    }

    return {
      source: 'mode',
      code: 'mode/unsupported-local',
      message: 'Local playback controls are not available yet.'
    };
  }

  #resolveClient(): KodiJsonRpcHttpClient | null {
    try {
      return this.#client ?? this.#createClient();
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createSafeError(error)
      };
      return null;
    }
  }

  #resolveSinglePlayerId(): number | null {
    const snapshot = this.#playerStore.snapshot;

    if (!snapshot.primaryPlayer || snapshot.activePlayers.length === 0) {
      this.#failCommand({
        source: 'player',
        code: 'player/no-active-player',
        message: 'No active Kodi player is available for this command.'
      });
      return null;
    }

    if (snapshot.activePlayers.length > 1) {
      this.#failCommand({
        source: 'player',
        code: 'player/multiple-active-players',
        message: 'Multiple Kodi players are active. Choose one player before sending commands.'
      });
      return null;
    }

    return snapshot.primaryPlayer.playerid;
  }
}

function validateFiniteNumber(value: number, code: string): PlayerDispatchSafeErrorSnapshot | null {
  return Number.isFinite(value)
    ? null
    : createInputError(code, 'Enter a finite numeric command value.');
}

function validateBoundedNumber(
  value: number,
  min: number,
  max: number,
  code: string
): PlayerDispatchSafeErrorSnapshot | null {
  if (!Number.isFinite(value) || value < min || value > max) {
    return createInputError(code, `Enter a value from ${min} to ${max}.`);
  }

  return null;
}

function validateAudioStream(
  stream: PlayerAudioStreamValue
): PlayerDispatchSafeErrorSnapshot | null {
  if (typeof stream === 'number') {
    return Number.isFinite(stream)
      ? null
      : createInputError('input/invalid-audio-stream', 'Choose a valid audio stream.');
  }

  return VALID_AUDIO_STREAM_LITERALS.has(stream)
    ? null
    : createInputError('input/invalid-audio-stream', 'Choose a valid audio stream.');
}

function validateSubtitle(subtitle: PlayerSubtitleValue): PlayerDispatchSafeErrorSnapshot | null {
  if (typeof subtitle === 'number') {
    return Number.isFinite(subtitle)
      ? null
      : createInputError('input/invalid-subtitle', 'Choose a valid subtitle stream.');
  }

  return VALID_SUBTITLE_LITERALS.has(subtitle)
    ? null
    : createInputError('input/invalid-subtitle', 'Choose a valid subtitle stream.');
}

function createInputError(code: string, message: string): PlayerDispatchSafeErrorSnapshot {
  return { source: 'input', code, message };
}

function createConfigError(code: string, message: string): PlayerDispatchSafeErrorSnapshot {
  return { source: 'config', code, message };
}

function createSafeError(error: unknown): PlayerDispatchSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  return {
    source: 'command',
    code: 'command/failed',
    message: sanitizeErrorMessage(error instanceof Error ? error.message : 'Kodi command failed.')
  };
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'Authorization: [redacted]')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'Basic [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/localStorage/gi, 'browser storage');
}

function cloneSnapshot(snapshot: PlayerDispatchSnapshot): PlayerDispatchSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null
  };
}

function cloneError(error: PlayerDispatchSafeErrorSnapshot): PlayerDispatchSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

export function createPlayerDispatch(options: PlayerDispatchOptions = {}): PlayerDispatch {
  return new PlayerDispatch(options);
}

export const playerDispatch = createPlayerDispatch();
