import {
  goToPlayerItem,
  openPlayerEpisodeItem,
  openPlayerFile,
  openPlayerItem,
  openPlayerMovieItem,
  openPlayerPlaylistFile,
  playPausePlayer,
  seekPlayer,
  setApplicationMute,
  setApplicationVolume,
  setPlayerAudioStream,
  setPlayerPartyMode,
  setPlayerRepeat,
  setPlayerShuffle,
  setPlayerSubtitle,
  stopPlayer,
  type KodiJsonRpcHttpClient,
  type KodiMusicLibraryItem,
  type PlayerAudioStreamValue,
  type PlayerPartyModeValue,
  type PlayerRepeatValue,
  type PlayerSeekStep,
  type PlayerShuffleValue,
  type PlayerSubtitleValue
} from '$lib/kodi';
import { configStore as defaultConfigStore, type ConfigStore } from './config.svelte.ts';
import {
  localPlayerStore as defaultLocalPlayerStore,
  type LocalPlayerStore
} from './localPlayer.svelte.ts';
import { playerStore as defaultPlayerStore, type PlayerStoreSnapshot } from './player.svelte.ts';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import { LocalFilePlaylistState } from './playerDispatchLocalItems';
import {
  runLocalFilePlaybackCommand,
  runLocalFilePlaylistNavigation,
  runLocalMusicItemPlayback,
  runLocalPlaylistNavigation,
  runResumeOnKodi,
  runStartLocalPlayback,
  type LocalPlaybackContext
} from './playerDispatchLocalPlayback';
import {
  runStreamEpisodeItem,
  runStreamMovieItem,
  runStreamMusicVideoItem
} from './playerDispatchVideoStreams';
import {
  DEFAULT_PLAYER_DISPATCH_SNAPSHOT,
  VALID_REPEAT_VALUES,
  VALID_SEEK_STEPS,
  cloneError,
  clonePlayerDispatchSnapshot,
  createConfigError,
  createInputError,
  createSafeError,
  resolveSinglePlayerIdFromSnapshot,
  resolveSingleVideoPlayerIdFromSnapshot,
  validateBoundedNumber,
  validateFiniteNumber
} from './playerDispatchSupport';
import {
  toKodiEpisodePlaybackItem,
  toKodiFilePlaybackItem,
  toKodiMoviePlaybackItem,
  toKodiMusicLibraryItem,
  toKodiMusicVideoPlaybackItem,
  toKodiPlaylistPlaybackItem,
  toKodiPvrChannelItem,
  validateAudioStream,
  validateEpisodePlaybackItem,
  validateFilePlaybackItem,
  validateMoviePlaybackItem,
  validateMusicPlaybackItem,
  validateMusicVideoPlaybackItem,
  validatePlaylistPlaybackItem,
  validatePvrChannelPlaybackItem,
  validateSubtitle
} from './playerDispatchCodecs';
import type {
  EpisodePlaybackItem,
  EpisodeStreamItem,
  FilePlaybackItem,
  LocalFilePlaylistItem,
  MoviePlaybackItem,
  MusicPlaybackItem,
  MusicVideoPlaybackItem,
  PlayerCommandName,
  PlayerDispatchMode,
  PlayerDispatchSafeErrorSnapshot,
  PlayerDispatchSnapshot,
  PlaylistPlaybackItem,
  PvrChannelPlaybackItem
} from './playerDispatchTypes';

export type {
  EpisodePlaybackItem,
  EpisodeStreamItem,
  FilePlaybackItem,
  LocalFilePlaylistItem,
  MoviePlaybackItem,
  MusicPlaybackItem,
  MusicVideoPlaybackItem,
  PlayerCommandName,
  PlayerCommandStatus,
  PlayerDispatchErrorSource,
  PlayerDispatchMode,
  PlayerDispatchSafeErrorSnapshot,
  PlayerDispatchSnapshot,
  PlaylistPlaybackItem,
  PvrChannelPlaybackItem
} from './playerDispatchTypes';

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
  afterSuccessfulCommand?: (command: PlayerCommandName) => Promise<void> | void;
  now?: () => string;
}

type CommandRunInput = {
  command: PlayerCommandName;
  validate?: () => PlayerDispatchSafeErrorSnapshot | null;
  execute: (client: KodiJsonRpcHttpClient, playerid: number) => Promise<unknown>;
  afterCommandSuccess?: () => Promise<void> | void;
};

export class PlayerDispatch {
  #snapshot = $state<PlayerDispatchSnapshot>({ ...DEFAULT_PLAYER_DISPATCH_SNAPSHOT });

  readonly #playerStore: PlayerDispatchPlayerStore;
  readonly #localPlayerStore: LocalPlayerStore;
  readonly #configStore: ConfigStore;
  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #afterSuccessfulCommand: (command: PlayerCommandName) => Promise<void> | void;
  readonly #now: () => string;
  readonly #localFiles = new LocalFilePlaylistState();

  constructor(options: PlayerDispatchOptions = {}) {
    this.#snapshot = { ...DEFAULT_PLAYER_DISPATCH_SNAPSHOT, mode: options.mode ?? 'kodi' };
    this.#playerStore = options.playerStore ?? defaultPlayerStore;
    this.#localPlayerStore = options.localPlayerStore ?? defaultLocalPlayerStore;
    this.#configStore = options.configStore ?? defaultConfigStore;
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#afterSuccessfulCommand = options.afterSuccessfulCommand ?? (() => {});
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): PlayerDispatchSnapshot {
    return clonePlayerDispatchSnapshot(this.#snapshot);
  }

  setMode(mode: PlayerDispatchMode): void {
    this.#snapshot = {
      ...this.#snapshot,
      mode
    };
  }

  setLocalFilePlaylist(items: readonly LocalFilePlaylistItem[], startFile?: string): void {
    this.#localFiles.setItems(items, startFile);
  }

  canNavigateLocalFilePlaylist(): boolean {
    return this.#snapshot.mode === 'local' && this.#localFiles.canNavigate();
  }

  #localPlaybackContext(): LocalPlaybackContext {
    return {
      playerStore: this.#playerStore,
      localPlayerStore: this.#localPlayerStore,
      configStore: this.#configStore,
      localFiles: this.#localFiles,
      startCommand: (command) => this.#startCommand(command),
      failCommand: (error) => this.#failCommand(error),
      markCommandSuccess: (patch) => this.#markCommandSuccess(patch),
      runAfterSuccessfulCommand: (command) => this.#runAfterSuccessfulCommand(command),
      resolveClient: () => this.#resolveClient(),
      resolveSinglePlayerId: () => this.#resolveSinglePlayerId(),
      resolveSingleVideoPlayerId: () => this.#resolveSingleVideoPlayerId()
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
      if (this.#localFiles.canNavigate()) {
        return runLocalFilePlaylistNavigation(this.#localPlaybackContext(), 'previous');
      }

      return runLocalPlaylistNavigation(this.#localPlaybackContext(), 'previous');
    }

    return this.#runPlayerCommand({
      command: 'previous',
      execute: (client, playerid) => goToPlayerItem(client, playerid, 'previous')
    });
  }

  next(): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      if (this.#localFiles.canNavigate()) {
        return runLocalFilePlaylistNavigation(this.#localPlaybackContext(), 'next');
      }

      return runLocalPlaylistNavigation(this.#localPlaybackContext(), 'next');
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
      return this.#runLocalShuffleCommand(shuffle);
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

  setPartyMode(partymode: PlayerPartyModeValue): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      return this.#rejectUnsupportedLocal('setPartyMode');
    }

    return this.#runPlayerCommand({
      command: 'setPartyMode',
      validate: () =>
        typeof partymode === 'boolean' || partymode === 'toggle'
          ? null
          : createInputError('input/invalid-party-mode', 'Choose a supported party mode value.'),
      execute: (client, playerid) => setPlayerPartyMode(client, playerid, partymode)
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

    if (this.#snapshot.mode === 'local') {
      return runLocalMusicItemPlayback(this.#localPlaybackContext(), item);
    }

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

  playMovieItem(item: MoviePlaybackItem): Promise<void> {
    const movieItem = toKodiMoviePlaybackItem(item) ?? { movieid: 0 };
    const openOptions = item?.resume === true ? { resume: true } : undefined;

    return this.#runCommand({
      command: 'playMovieItem',
      validate: () => validateMoviePlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerMovieItem(client, movieItem, openOptions),
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

  streamMovieItem(item: MoviePlaybackItem): Promise<void> {
    return runStreamMovieItem(this.#localPlaybackContext(), item);
  }

  playEpisodeItem(item: EpisodePlaybackItem): Promise<void> {
    const episodeItem = toKodiEpisodePlaybackItem(item) ?? { episodeid: 0 };
    const openOptions = item?.resume === true ? { resume: true } : undefined;

    return this.#runCommand({
      command: 'playEpisodeItem',
      validate: () => validateEpisodePlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerEpisodeItem(client, episodeItem, openOptions),
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

  playMusicVideoItem(item: MusicVideoPlaybackItem): Promise<void> {
    const musicVideoItem = toKodiMusicVideoPlaybackItem(item) ?? { musicvideoid: 0 };

    return this.#runCommand({
      command: 'playMusicVideoItem',
      validate: () => validateMusicVideoPlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerItem(client, musicVideoItem),
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

  streamMusicVideoItem(item: MusicVideoPlaybackItem): Promise<void> {
    return runStreamMusicVideoItem(this.#localPlaybackContext(), item);
  }

  streamEpisodeItem(item: EpisodeStreamItem): Promise<void> {
    return runStreamEpisodeItem(this.#localPlaybackContext(), item);
  }

  playChannelItem(item: PvrChannelPlaybackItem): Promise<void> {
    const channelItem = toKodiPvrChannelItem(item) ?? { channelid: 0 };

    return this.#runCommand({
      command: 'playChannelItem',
      validate: () => validatePvrChannelPlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerItem(client, channelItem),
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

    if (
      this.#snapshot.mode === 'local' &&
      item.mediaKind === 'audio' &&
      item.itemType !== 'directory'
    ) {
      return runLocalFilePlaybackCommand(this.#localPlaybackContext(), item);
    }

    return this.#runCommand({
      command: 'playFileItem',
      validate: () => validateFilePlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerFile(client, fileItem),
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

  playPlaylistItem(item: PlaylistPlaybackItem): Promise<void> {
    const playlistItem = toKodiPlaylistPlaybackItem(item) ?? { file: '' };

    return this.#runCommand({
      command: 'playPlaylistItem',
      validate: () => validatePlaylistPlaybackItem(item),
      resolvePlayerid: false,
      execute: (client) => openPlayerPlaylistFile(client, playlistItem),
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

  startLocalPlayback(): Promise<void> {
    return runStartLocalPlayback(this.#localPlaybackContext());
  }

  resumeOnKodi(): Promise<void> {
    return runResumeOnKodi(this.#localPlaybackContext());
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

    this.#schedulePostCommandRefresh(`command:${input.command}`);

    await this.#runAfterSuccessfulCommand(input.command);
    this.#markCommandSuccess();
  }

  async #runAfterSuccessfulCommand(command: PlayerCommandName): Promise<void> {
    try {
      await this.#afterSuccessfulCommand(command);
    } catch {
      // Follow-up effects must not turn a successful playback command into a failed command.
    }
  }

  #markCommandSuccess(patch: Partial<PlayerDispatchSnapshot> = {}): void {
    this.#snapshot = {
      ...this.#snapshot,
      ...patch,
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  #schedulePostCommandRefresh(reason: `command:${PlayerCommandName}`): void {
    if (this.#client !== null || typeof globalThis.setTimeout !== 'function') {
      return;
    }

    const timeout = globalThis.setTimeout(() => {
      void this.#playerStore.refresh(reason);
    }, 750);

    if (typeof timeout === 'object' && timeout && 'unref' in timeout) {
      (timeout as { unref: () => void }).unref();
    }
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

  async #runLocalShuffleCommand(shuffle: PlayerShuffleValue): Promise<void> {
    this.#startCommand('setShuffle');

    if (!(typeof shuffle === 'boolean' || shuffle === 'toggle')) {
      this.#failCommand(
        createInputError('input/invalid-shuffle', 'Choose a supported shuffle value.')
      );
      return;
    }

    this.#localFiles.shuffle = shuffle === 'toggle' ? !this.#localFiles.shuffle : shuffle;
    this.#snapshot = {
      ...this.#snapshot,
      mode: 'local',
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
    const resolved = resolveSinglePlayerIdFromSnapshot(this.#playerStore.snapshot);
    if (resolved.ok) return resolved.playerid;
    this.#failCommand(resolved.error);
    return null;
  }

  #resolveSingleVideoPlayerId(): number | null {
    const resolved = resolveSingleVideoPlayerIdFromSnapshot(this.#playerStore.snapshot);
    if (resolved.ok) return resolved.playerid;
    this.#failCommand(resolved.error);
    return null;
  }
}

export function createPlayerDispatch(options: PlayerDispatchOptions = {}): PlayerDispatch {
  return new PlayerDispatch(options);
}

export const playerDispatch = createPlayerDispatch();
