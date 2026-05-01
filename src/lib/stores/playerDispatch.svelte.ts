import {
  KodiHttpClientError,
  goToPlayerItem,
  isKodiHttpClientError,
  openPlayerFile,
  openPlayerItem,
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
  type KodiMusicLibraryItem,
  type PlayerAudioStreamValue,
  type PlayerRepeatValue,
  type PlayerSeekStep,
  type PlayerShuffleValue,
  type PlayerSubtitleValue
} from '$lib/kodi';
import { configStore as defaultConfigStore, type ConfigStore } from './config.svelte.ts';
import {
  localPlayerStore as defaultLocalPlayerStore,
  prepareLocalStreamUrl,
  type LocalMediaKind,
  type LocalPlayerStore
} from './localPlayer.svelte.ts';
import { playerStore as defaultPlayerStore, type PlayerStoreSnapshot } from './player.svelte.ts';
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
  | 'setSubtitle'
  | 'playMusicItem'
  | 'playFileItem'
  | 'startLocalPlayback'
  | 'resumeOnKodi';
export type MusicPlaybackItem =
  | { kind: 'song'; songid: number }
  | { kind: 'album'; albumid: number }
  | { kind: 'artist'; artistid: number };
export type FilePlaybackItem = { file: string; mediaKind: 'audio' };

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
  localPlayerStore?: LocalPlayerStore;
  configStore?: ConfigStore;
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

type CommandRunInput = {
  command: PlayerCommandName;
  validate?: () => PlayerDispatchSafeErrorSnapshot | null;
  execute: (client: KodiJsonRpcHttpClient, playerid: number) => Promise<unknown>;
  afterCommandSuccess?: () => Promise<void> | void;
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
  readonly #localPlayerStore: LocalPlayerStore;
  readonly #configStore: ConfigStore;
  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;

  constructor(options: PlayerDispatchOptions = {}) {
    this.#snapshot = { ...DEFAULT_SNAPSHOT, mode: options.mode ?? 'kodi' };
    this.#playerStore = options.playerStore ?? defaultPlayerStore;
    this.#localPlayerStore = options.localPlayerStore ?? defaultLocalPlayerStore;
    this.#configStore = options.configStore ?? defaultConfigStore;
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
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'playPause',
        execute: async () => {
          await this.#localPlayerStore.togglePlayPause();
        }
      });
    }

    return this.#runPlayerCommand({
      command: 'playPause',
      execute: (client, playerid) => playPausePlayer(client, playerid)
    });
  }

  stop(): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'stop',
        execute: async () => {
          this.#localPlayerStore.stop();
        }
      });
    }

    return this.#runPlayerCommand({
      command: 'stop',
      execute: (client, playerid) => stopPlayer(client, playerid)
    });
  }

  previous(): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('previous');
    }

    return this.#runPlayerCommand({
      command: 'previous',
      execute: (client, playerid) => goToPlayerItem(client, playerid, 'previous')
    });
  }

  next(): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('next');
    }

    return this.#runPlayerCommand({
      command: 'next',
      execute: (client, playerid) => goToPlayerItem(client, playerid, 'next')
    });
  }

  seekPercentage(percentage: number): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'seekPercentage',
        validate: () => validateBoundedNumber(percentage, 0, 100, 'input/invalid-seek-percentage'),
        execute: async () => {
          const durationSeconds = this.#localPlayerStore.snapshot.durationSeconds;
          if (durationSeconds === null) {
            throw createInputError(
              'input/missing-duration',
              'Local playback must have a known duration before seeking by percentage.'
            );
          }

          const target = (durationSeconds * percentage) / 100;
          this.#localPlayerStore.seekToSeconds(target);
        }
      });
    }

    return this.#runPlayerCommand({
      command: 'seekPercentage',
      validate: () => validateBoundedNumber(percentage, 0, 100, 'input/invalid-seek-percentage'),
      execute: (client, playerid) => seekPlayer(client, playerid, { percentage })
    });
  }

  seekRelativeSeconds(seconds: number): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'seekRelativeSeconds',
        validate: () => validateFiniteNumber(seconds, 'input/invalid-seek-seconds'),
        execute: async () => {
          const current = this.#localPlayerStore.snapshot.currentSeconds;
          this.#localPlayerStore.seekToSeconds(Math.max(0, current + seconds));
        }
      });
    }

    return this.#runPlayerCommand({
      command: 'seekRelativeSeconds',
      validate: () => validateFiniteNumber(seconds, 'input/invalid-seek-seconds'),
      execute: (client, playerid) => seekPlayer(client, playerid, { seconds })
    });
  }

  seekStep(step: PlayerSeekStep): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'seekStep',
        validate: () =>
          VALID_SEEK_STEPS.has(step)
            ? null
            : createInputError('input/invalid-seek-step', 'Choose a supported seek step.'),
        execute: async () => {
          const delta =
            step === 'smallforward'
              ? 10
              : step === 'smallbackward'
                ? -10
                : step === 'bigforward'
                  ? 30
                  : -30;

          const current = this.#localPlayerStore.snapshot.currentSeconds;
          this.#localPlayerStore.seekToSeconds(Math.max(0, current + delta));
        }
      });
    }

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
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'setVolume',
        validate: () => validateFiniteNumber(volume, 'input/invalid-volume'),
        execute: async () => {
          this.#localPlayerStore.setVolume(volume);
        }
      });
    }

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
    if (this.#snapshot.mode === 'local') {
      return this.#runLocalCommand({
        command: 'toggleMute',
        execute: async () => {
          const snapshot = this.#localPlayerStore.snapshot;
          this.#localPlayerStore.setMuted(!snapshot.muted);
        }
      });
    }

    return this.#runApplicationCommand({
      command: 'toggleMute',
      execute: (client) => setApplicationMute(client, 'toggle')
    });
  }

  setShuffle(shuffle: PlayerShuffleValue): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('setShuffle');
    }

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
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('setRepeat');
    }

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
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('setAudioStream');
    }

    return this.#runPlayerCommand({
      command: 'setAudioStream',
      validate: () => validateAudioStream(stream),
      execute: (client, playerid) => setPlayerAudioStream(client, playerid, stream)
    });
  }

  setSubtitle(subtitle: PlayerSubtitleValue): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('setSubtitle');
    }

    return this.#runPlayerCommand({
      command: 'setSubtitle',
      validate: () => validateSubtitle(subtitle),
      execute: (client, playerid) => setPlayerSubtitle(client, playerid, subtitle)
    });
  }

  playMusicItem(item: MusicPlaybackItem): Promise<void> {
    const musicItem = toKodiMusicLibraryItem(item) as KodiMusicLibraryItem;

    return this.#runCommand({
      command: 'playMusicItem',
      validate: () => validateMusicPlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerItem(client, musicItem),
      afterCommandSuccess: () => {
        if (this.#snapshot.mode === 'local') {
          this.#localPlayerStore.stop();
          this.#snapshot = {
            ...this.#snapshot,
            mode: 'kodi'
          };
        }
      }
    });
  }

  playFileItem(item: FilePlaybackItem): Promise<void> {
    const fileItem = toKodiFilePlaybackItem(item) ?? { file: '' };

    if (this.#snapshot.mode === 'local') {
      return this.#runLocalFilePlaybackCommand(item);
    }

    return this.#runCommand({
      command: 'playFileItem',
      validate: () => validateFilePlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerFile(client, fileItem)
    });
  }

  startLocalPlayback(): Promise<void> {
    return this.#runStartLocalPlayback();
  }

  resumeOnKodi(): Promise<void> {
    return this.#runResumeOnKodi();
  }

  async #runApplicationCommand(
    input: Omit<CommandRunInput, 'execute'> & {
      execute: (client: KodiJsonRpcHttpClient) => Promise<unknown>;
    }
  ): Promise<void> {
    await this.#runCommand({
      command: input.command,
      validate: input.validate,
      resolvePlayerid: true,
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
      await input.afterCommandSuccess?.();
    } catch (error) {
      commandError = createSafeError(error);
    }

    try {
      await this.#playerStore.refresh(`command:${input.command}`);
    } catch {
      // Refresh errors are represented on playerStore.snapshot.lastError. Preserve command status.
    }

    if (commandError) {
      this.#failCommand(commandError);
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

  #failCommand(error: PlayerDispatchSafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'error',
      lastError: cloneError(error),
      lastCompletedAt: this.#now()
    };
  }

  #rejectUnsupportedLocal(command: PlayerCommandName): Promise<void> {
    this.#startCommand(command);
    this.#failCommand({
      source: 'mode',
      code: 'mode/unsupported-local',
      message: 'This playback control is only available when controlling Kodi.'
    });

    return Promise.resolve();
  }

  async #runLocalCommand(input: {
    command: PlayerCommandName;
    validate?: () => PlayerDispatchSafeErrorSnapshot | null;
    execute: () => Promise<void>;
  }): Promise<void> {
    this.#startCommand(input.command);

    const validationError = input.validate?.() ?? null;
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    let commandError: PlayerDispatchSafeErrorSnapshot | null = null;

    try {
      await input.execute();
    } catch (error) {
      commandError = createSafeError(error);
    }

    if (commandError) {
      this.#failCommand(commandError);
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  async #runLocalFilePlaybackCommand(item: FilePlaybackItem): Promise<void> {
    this.#startCommand('playFileItem');

    const validationError = validateFilePlaybackItem(item);
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    const fileItem = toKodiFilePlaybackItem(item) ?? { file: '' };
    const client = this.#resolveClient();
    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before starting local playback.'
        )
      );
      return;
    }

    let streamUrl: string;
    try {
      streamUrl = await prepareLocalStreamUrl({
        client,
        file: fileItem.file,
        activeHost: this.#configStore.activeHost
      });
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    try {
      await this.#localPlayerStore.loadAndPlay({
        source: streamUrl,
        item: { label: 'File item', type: 'file' },
        mediaKind: item.mediaKind,
        kodiWasPaused: false
      });
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      mode: 'local',
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  async #runStartLocalPlayback(): Promise<void> {
    this.#startCommand('startLocalPlayback');

    const playerid = this.#resolveSinglePlayerId();
    if (playerid === null) {
      return;
    }

    const snapshot = this.#playerStore.snapshot;
    const file = typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';

    if (!file) {
      this.#failCommand({
        source: 'input',
        code: 'input/missing-file',
        message: 'Choose a playable item before starting local playback.'
      });
      return;
    }

    const client = this.#resolveClient();
    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before starting local playback.'
        )
      );
      return;
    }

    const speed = typeof snapshot.properties?.speed === 'number' ? snapshot.properties.speed : null;
    const shouldPauseKodi = speed === null ? true : speed !== 0;

    if (shouldPauseKodi) {
      try {
        await playPausePlayer(client, playerid);
      } catch (error) {
        this.#failCommand(createSafeError(error));
        return;
      }
    }

    try {
      await this.#playerStore.refresh('command:startLocalPlayback');
    } catch {
      // PlayerStore owns refresh failure diagnostics.
    }

    let streamUrl: string;
    try {
      streamUrl = await prepareLocalStreamUrl({
        client,
        file,
        activeHost: this.#configStore.activeHost
      });
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    const mediaKind = inferMediaKind(snapshot.primaryPlayer?.type);

    try {
      await this.#localPlayerStore.loadAndPlay({
        source: streamUrl,
        item: extractLocalItemIdentity(snapshot.item),
        mediaKind,
        kodiWasPaused: shouldPauseKodi
      });
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      mode: 'local',
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  async #runResumeOnKodi(): Promise<void> {
    this.#startCommand('resumeOnKodi');

    const playerid = this.#resolveSinglePlayerId();
    if (playerid === null) {
      return;
    }

    const client = this.#resolveClient();
    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before resuming playback on Kodi.'
        )
      );
      return;
    }

    try {
      await playPausePlayer(client, playerid);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    try {
      await this.#playerStore.refresh('command:resumeOnKodi');
    } catch {
      // PlayerStore owns refresh failure diagnostics.
    }

    this.#snapshot = {
      ...this.#snapshot,
      mode: 'kodi',
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
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

function validateMusicPlaybackItem(
  item: MusicPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  const musicItem = toKodiMusicLibraryItem(item);

  if (!musicItem) {
    return createInputError(
      'input/invalid-music-item',
      'Choose a song, album, or artist with a valid library id.'
    );
  }

  return null;
}

function validateFilePlaybackItem(item: FilePlaybackItem): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiFilePlaybackItem(item)
    ? null
    : createInputError('input/invalid-file-item', 'Choose a supported audio file to play.');
}

function toKodiFilePlaybackItem(item: FilePlaybackItem): { file: string } | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (
    keys.length === 2 &&
    keys[0] === 'file' &&
    keys[1] === 'mediaKind' &&
    typeof candidate.file === 'string' &&
    candidate.file.trim().length > 0 &&
    candidate.mediaKind === 'audio'
  ) {
    return { file: candidate.file };
  }

  return null;
}

function toKodiMusicLibraryItem(item: MusicPlaybackItem): KodiMusicLibraryItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (
    candidate.kind === 'song' &&
    keys.length === 2 &&
    keys[0] === 'kind' &&
    keys[1] === 'songid'
  ) {
    return isPositiveInteger(candidate.songid) ? { songid: candidate.songid } : null;
  }

  if (
    candidate.kind === 'album' &&
    keys.length === 2 &&
    keys[0] === 'albumid' &&
    keys[1] === 'kind'
  ) {
    return isPositiveInteger(candidate.albumid) ? { albumid: candidate.albumid } : null;
  }

  if (
    candidate.kind === 'artist' &&
    keys.length === 2 &&
    keys[0] === 'artistid' &&
    keys[1] === 'kind'
  ) {
    return isPositiveInteger(candidate.artistid) ? { artistid: candidate.artistid } : null;
  }

  return null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
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

  if (error instanceof Error && isErrorWithCode(error)) {
    const source: PlayerDispatchErrorSource = error.code.startsWith('input/')
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
    message: sanitizeErrorMessage(error instanceof Error ? error.message : 'Kodi command failed.')
  };
}

function isErrorWithCode(error: Error): error is Error & { code: string } {
  return (
    Object.prototype.hasOwnProperty.call(error, 'code') &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function inferMediaKind(playerType: unknown): LocalMediaKind {
  return playerType === 'audio' ? 'audio' : playerType === 'video' ? 'video' : 'unknown';
}

function extractLocalItemIdentity(item: PlayerStoreSnapshot['item']): {
  id?: number;
  label?: string;
  title?: string;
  type?: string;
  songid?: number;
  movieid?: number;
  episodeid?: number;
} {
  if (!item || typeof item !== 'object') {
    return { label: 'Unknown item', type: 'unknown' };
  }

  const candidate = item as Record<string, unknown>;

  return {
    ...(typeof candidate.id === 'number' && Number.isFinite(candidate.id)
      ? { id: candidate.id }
      : {}),
    ...(typeof candidate.label === 'string' && candidate.label.length > 0
      ? { label: candidate.label }
      : { label: 'Unknown item' }),
    ...(typeof candidate.title === 'string' && candidate.title.length > 0
      ? { title: candidate.title }
      : {}),
    ...(typeof candidate.type === 'string' && candidate.type.length > 0
      ? { type: candidate.type }
      : { type: 'unknown' }),
    ...(typeof candidate.songid === 'number' && Number.isFinite(candidate.songid)
      ? { songid: candidate.songid }
      : {}),
    ...(typeof candidate.movieid === 'number' && Number.isFinite(candidate.movieid)
      ? { movieid: candidate.movieid }
      : {}),
    ...(typeof candidate.episodeid === 'number' && Number.isFinite(candidate.episodeid)
      ? { episodeid: candidate.episodeid }
      : {})
  };
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
    .replace(/\/[^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-file')
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
