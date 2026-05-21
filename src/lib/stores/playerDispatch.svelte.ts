import {
  KodiHttpClientError,
  goToPlayerItem,
  getVideoLibraryEpisodeDetails,
  getVideoLibraryMovieDetails,
  getVideoLibraryMusicVideoDetails,
  isKodiHttpClientError,
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
  type KodiEndpointDescription,
  type KodiEpisodeLibraryItem,
  type KodiJsonRpcHttpClient,
  type KodiMovieLibraryItem,
  type KodiMusicVideoLibraryItem,
  type KodiMusicLibraryItem,
  type KodiPvrChannelItem,
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
  | 'setPartyMode'
  | 'setRepeat'
  | 'setAudioStream'
  | 'setSubtitle'
  | 'playMusicItem'
  | 'playMovieItem'
  | 'streamMovieItem'
  | 'playEpisodeItem'
  | 'playMusicVideoItem'
  | 'streamMusicVideoItem'
  | 'streamEpisodeItem'
  | 'playFileItem'
  | 'playChannelItem'
  | 'playPlaylistItem'
  | 'startLocalPlayback'
  | 'resumeOnKodi';
export type MusicPlaybackItem =
  | { kind: 'song'; songid: number }
  | { kind: 'album'; albumid: number }
  | { kind: 'artist'; artistid: number };
export type MoviePlaybackItem = { movieid: number; resume?: boolean };
export type EpisodePlaybackItem = { episodeid: number; resume?: boolean };
export type MusicVideoPlaybackItem = { musicvideoid: number };
export type PvrChannelPlaybackItem = { channelid: number };
export type EpisodeStreamItem = {
  episodeid: number;
  resume?: boolean;
  label?: string;
  title?: string;
};
export type FilePlaybackItem = {
  file: string;
  mediaKind: 'audio' | 'video';
  itemType?: 'file' | 'directory';
};
export type LocalFilePlaylistItem = { file: string; mediaKind: 'audio' } & {
  label?: string;
  title?: string;
  thumbnail?: string;
  id?: number;
  songid?: number;
  type?: string;
};
export type PlaylistPlaybackItem = {
  file: string;
  mediaKind: 'music' | 'video';
  playlistKind: 'smart' | 'basic';
};

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

type RefreshPlayableFileOptions = {
  requireDifferentFile?: boolean;
  allowSameFileAfterAttempts?: number;
};

export class PlayerDispatch {
  #snapshot = $state<PlayerDispatchSnapshot>({ ...DEFAULT_SNAPSHOT });

  readonly #playerStore: PlayerDispatchPlayerStore;
  readonly #localPlayerStore: LocalPlayerStore;
  readonly #configStore: ConfigStore;
  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;
  #localFilePlaylist: LocalFilePlaylistItem[] = [];
  #localFilePlaylistIndex = -1;
  #localShuffle = false;

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

  setLocalFilePlaylist(items: readonly LocalFilePlaylistItem[], startFile?: string): void {
    this.#localFilePlaylist = items.flatMap(toLocalFilePlaylistItem);
    this.#localFilePlaylistIndex = resolveLocalFilePlaylistIndex(
      this.#localFilePlaylist,
      startFile
    );
  }

  canNavigateLocalFilePlaylist(): boolean {
    return this.#snapshot.mode === 'local' && this.#localFilePlaylist.length > 1;
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
      if (this.#localFilePlaylist.length > 1) {
        return this.#runLocalFilePlaylistNavigation('previous');
      }

      return this.#runLocalPlaylistNavigation('previous');
    }

    return this.#runPlayerCommand({
      command: 'previous',
      execute: (client, playerid) => goToPlayerItem(client, playerid, 'previous')
    });
  }

  next(): Promise<void> {
    if (this.#snapshot.mode === 'local') {
      if (this.#localFilePlaylist.length > 1) {
        return this.#runLocalFilePlaylistNavigation('next');
      }

      return this.#runLocalPlaylistNavigation('next');
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
      return this.#runLocalMusicItemPlayback(item);
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

  async #runLocalMusicItemPlayback(item: MusicPlaybackItem): Promise<void> {
    this.#startCommand('playMusicItem');

    const validationError = validateMusicPlaybackItem(item);
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    const musicItem = toKodiMusicLibraryItem(item) as KodiMusicLibraryItem;
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

    try {
      await openPlayerItem(client, musicItem);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    const previousFile = currentPlayerFile(this.#playerStore.snapshot);
    const refreshed = await this.#refreshUntilPlayableFile('playMusicItem', previousFile, {
      allowSameFileAfterAttempts: 2
    });
    if (!refreshed) {
      return;
    }

    const snapshot = this.#playerStore.snapshot;
    const playerid = this.#resolveSinglePlayerId();
    if (playerid === null) {
      return;
    }

    const speed = typeof snapshot.properties?.speed === 'number' ? snapshot.properties.speed : null;
    const kodiIsPlaying = speed === null ? true : speed !== 0;
    if (kodiIsPlaying) {
      try {
        await playPausePlayer(client, playerid);
      } catch (error) {
        this.#failCommand(createSafeError(error));
        return;
      }
    }

    const file = typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';
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

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: extractLocalItemIdentity(snapshot.item),
        mediaKind: inferMediaKind(snapshot.primaryPlayer?.type),
        kodiWasPaused: true
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
    return this.#runStreamMovieItem(item);
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
    return this.#runStreamMusicVideoItem(item);
  }

  streamEpisodeItem(item: EpisodeStreamItem): Promise<void> {
    return this.#runStreamEpisodeItem(item);
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
      return this.#runLocalFilePlaybackCommand(item);
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

    this.#schedulePostCommandRefresh(`command:${input.command}`);

    this.#snapshot = {
      ...this.#snapshot,
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

  async #runStreamMovieItem(item: MoviePlaybackItem): Promise<void> {
    this.#startCommand('streamMovieItem');

    const validationError = validateMoviePlaybackItem(item);
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    const movieItem = toKodiMoviePlaybackItem(item) ?? { movieid: 0 };
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

    let detail: KodiMovieLibraryItem | null = null;
    try {
      detail = await resolveMovieStreamDetail(client, movieItem.movieid);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    const file = rawMediaFile(detail);

    if (!file) {
      this.#failCommand({
        source: 'input',
        code: 'input/missing-file',
        message: 'Kodi did not expose a playable movie file for browser streaming.'
      });
      return;
    }

    const kodiWasPaused = await this.#pauseActiveVideoPlayback(client, 'streamMovieItem');

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

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: extractMovieLocalItemIdentity(detail, movieItem.movieid),
        mediaKind: 'video',
        kodiWasPaused
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

  async #runStreamMusicVideoItem(item: MusicVideoPlaybackItem): Promise<void> {
    this.#startCommand('streamMusicVideoItem');

    const validationError = validateMusicVideoPlaybackItem(item);
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    const musicVideoItem = toKodiMusicVideoPlaybackItem(item) ?? { musicvideoid: 0 };
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

    let detail: KodiMusicVideoLibraryItem | null = null;
    try {
      detail = await resolveMusicVideoStreamDetail(client, musicVideoItem.musicvideoid);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    const file = rawMediaFile(detail);

    if (!file) {
      this.#failCommand({
        source: 'input',
        code: 'input/missing-file',
        message: 'Kodi did not expose a playable music video file for browser streaming.'
      });
      return;
    }

    const kodiWasPaused = await this.#pauseActiveVideoPlayback(client, 'streamMusicVideoItem');

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

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: extractMusicVideoLocalItemIdentity(detail, musicVideoItem.musicvideoid),
        mediaKind: 'video',
        kodiWasPaused
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

  async #runStreamEpisodeItem(item: EpisodeStreamItem): Promise<void> {
    this.#startCommand('streamEpisodeItem');

    const validationError = validateEpisodeStreamItem(item);
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    const episodeItem = toKodiEpisodeStreamItem(item) ?? { episodeid: 0 };
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

    let detail: KodiEpisodeLibraryItem | null = null;
    try {
      detail = await resolveEpisodeStreamDetail(client, episodeItem.episodeid);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    const file = rawMediaFile(detail);

    if (!file) {
      this.#failCommand({
        source: 'input',
        code: 'input/missing-file',
        message: 'Kodi did not expose a playable episode file for browser streaming.'
      });
      return;
    }

    const kodiWasPaused = await this.#pauseActiveVideoPlayback(client, 'streamEpisodeItem');

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

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: extractEpisodeLocalItemIdentity(detail, episodeItem.episodeid, item),
        mediaKind: 'video',
        kodiWasPaused
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

  async #runLocalFilePlaybackCommand(item: FilePlaybackItem): Promise<void> {
    this.#startCommand('playFileItem');

    const validationError = validateFilePlaybackItem(item);
    if (validationError) {
      this.#failCommand(validationError);
      return;
    }

    this.#ensureLocalFilePlaylistForFile(item.file);
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
        file: item.file,
        activeHost: this.#configStore.activeHost
      });
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: localFilePlaylistItemIdentity(this.#currentLocalFilePlaylistItem(), 'File item'),
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

  async #runLocalFilePlaylistNavigation(command: 'previous' | 'next'): Promise<void> {
    this.#startCommand(command);

    const client = this.#resolveClient();
    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before using local playback navigation.'
        )
      );
      return;
    }

    const currentIndex = this.#localFilePlaylistIndex >= 0 ? this.#localFilePlaylistIndex : 0;
    const nextIndex =
      this.#localShuffle && command === 'next'
        ? nextLocalShuffleIndex(this.#localFilePlaylist.length, currentIndex)
        : nextLocalSequentialIndex(this.#localFilePlaylist.length, currentIndex, command);
    const item = this.#localFilePlaylist[nextIndex];
    if (!item) {
      this.#failCommand(
        createInputError('input/missing-file', 'Choose a supported local playlist item.')
      );
      return;
    }

    let streamUrl: string;
    try {
      streamUrl = await prepareLocalStreamUrl({
        client,
        file: item.file,
        activeHost: this.#configStore.activeHost
      });
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    this.#localFilePlaylistIndex = nextIndex;

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: localFilePlaylistItemIdentity(item, 'File item'),
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

  async #runLocalShuffleCommand(shuffle: PlayerShuffleValue): Promise<void> {
    this.#startCommand('setShuffle');

    if (!(typeof shuffle === 'boolean' || shuffle === 'toggle')) {
      this.#failCommand(
        createInputError('input/invalid-shuffle', 'Choose a supported shuffle value.')
      );
      return;
    }

    this.#localShuffle = shuffle === 'toggle' ? !this.#localShuffle : shuffle;
    this.#snapshot = {
      ...this.#snapshot,
      mode: 'local',
      commandStatus: 'success',
      lastError: null,
      lastCompletedAt: this.#now()
    };
  }

  #ensureLocalFilePlaylistForFile(file: string): void {
    const index = this.#localFilePlaylist.findIndex((item) => item.file === file);
    if (index >= 0) {
      this.#localFilePlaylistIndex = index;
      return;
    }

    this.#localFilePlaylist = [{ file, mediaKind: 'audio', label: 'File item', type: 'file' }];
    this.#localFilePlaylistIndex = 0;
  }

  #currentLocalFilePlaylistItem(): LocalFilePlaylistItem | null {
    return this.#localFilePlaylist[this.#localFilePlaylistIndex] ?? null;
  }

  async #runStartLocalPlayback(): Promise<void> {
    this.#startCommand('startLocalPlayback');

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

    try {
      await this.#playerStore.refresh('command:startLocalPlayback');
    } catch {
      // PlayerStore owns refresh failure diagnostics; continue with the best available snapshot.
    }

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
      await this.#loadLocalMediaOrThrow({
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

  async #runLocalPlaylistNavigation(command: 'previous' | 'next'): Promise<void> {
    this.#startCommand(command);

    const client = this.#resolveClient();
    if (!client) {
      this.#failCommand(
        createConfigError(
          'config/no-active-host',
          'Choose an active Kodi host before using local playback navigation.'
        )
      );
      return;
    }

    const playerid = this.#resolveSinglePlayerId();
    if (playerid === null) {
      return;
    }

    try {
      await goToPlayerItem(client, playerid, command);
    } catch (error) {
      this.#failCommand(createSafeError(error));
      return;
    }

    const previousFile = currentPlayerFile(this.#playerStore.snapshot);
    const refreshed = await this.#refreshUntilPlayableFile(command, previousFile, {
      requireDifferentFile: true
    });
    if (!refreshed) {
      return;
    }

    const snapshot = this.#playerStore.snapshot;
    const file = typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';
    if (!file) {
      this.#failCommand({
        source: 'input',
        code: 'input/missing-file',
        message: 'Kodi did not expose a playable file after changing tracks.'
      });
      return;
    }

    const speed = typeof snapshot.properties?.speed === 'number' ? snapshot.properties.speed : null;
    const kodiIsPlaying = speed === null ? true : speed !== 0;

    if (kodiIsPlaying) {
      try {
        await playPausePlayer(client, playerid);
      } catch (error) {
        this.#failCommand(createSafeError(error));
        return;
      }
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

    try {
      await this.#loadLocalMediaOrThrow({
        source: streamUrl,
        item: extractLocalItemIdentity(snapshot.item),
        mediaKind: inferMediaKind(snapshot.primaryPlayer?.type),
        kodiWasPaused: true
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

  async #loadLocalMediaOrThrow(
    input: Parameters<LocalPlayerStore['loadAndPlay']>[0]
  ): Promise<void> {
    await this.#localPlayerStore.loadAndPlay(input);

    const localSnapshot = this.#localPlayerStore.snapshot;
    if (localSnapshot.status !== 'error') {
      return;
    }

    const error = new Error(
      localSnapshot.lastError?.message || 'Local media playback could not start.'
    ) as Error & { code: string };
    error.code = localSnapshot.lastError?.code || 'media/error';
    throw error;
  }

  async #pauseActiveVideoPlayback(
    client: KodiJsonRpcHttpClient,
    command: PlayerCommandName
  ): Promise<boolean> {
    try {
      await this.#playerStore.refresh(`command:${command}`);
    } catch {
      // PlayerStore owns refresh failure diagnostics. Browser streaming can still continue.
    }

    const playerid = this.#resolveSingleVideoPlayerId();
    if (playerid === null) {
      return false;
    }

    const speed = this.#playerStore.snapshot.properties?.speed;
    if (typeof speed === 'number' && speed === 0) {
      return false;
    }

    try {
      await playPausePlayer(client, playerid);
      return true;
    } catch {
      return false;
    }
  }

  async #refreshUntilPlayableFile(
    command: PlayerCommandName,
    previousFile: string,
    options: RefreshPlayableFileOptions = {}
  ): Promise<boolean> {
    const requireDifferentFile = options.requireDifferentFile === true && Boolean(previousFile);
    const allowSameFileAfterAttempts =
      options.allowSameFileAfterAttempts ?? Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        await this.#playerStore.refresh(`command:${command}`);
      } catch {
        // PlayerStore owns refresh failure diagnostics; retry with best available state.
      }

      const file = currentPlayerFile(this.#playerStore.snapshot);
      if (file && (!previousFile || file !== previousFile)) {
        return true;
      }

      if (file && !requireDifferentFile && attempt >= allowSameFileAfterAttempts) {
        return true;
      }

      await sleep(200);
    }

    const file = currentPlayerFile(this.#playerStore.snapshot);
    if (file && !requireDifferentFile) {
      return true;
    }

    if (file && requireDifferentFile) {
      this.#failCommand({
        source: 'input',
        code: 'input/unchanged-file',
        message: 'Kodi did not change tracks for local playback navigation.'
      });
      return false;
    }

    this.#failCommand({
      source: 'input',
      code: 'input/missing-file',
      message: 'Kodi did not expose a playable file for local playback.'
    });
    return false;
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

  #resolveSingleVideoPlayerId(): number | null {
    const snapshot = this.#playerStore.snapshot;

    if (!snapshot.primaryPlayer || snapshot.activePlayers.length === 0) {
      this.#failCommand({
        source: 'player',
        code: 'player/no-active-player',
        message: 'No active Kodi video player is available for browser streaming.'
      });
      return null;
    }

    if (snapshot.activePlayers.length > 1) {
      this.#failCommand({
        source: 'player',
        code: 'player/multiple-active-players',
        message: 'Multiple Kodi players are active. Choose one player before browser streaming.'
      });
      return null;
    }

    if (snapshot.primaryPlayer.type !== 'video') {
      this.#failCommand({
        source: 'player',
        code: 'player/no-active-video-player',
        message: 'Choose a movie with an active Kodi video player before browser streaming.'
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

function validateMoviePlaybackItem(
  item: MoviePlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiMoviePlaybackItem(item)
    ? null
    : createInputError('input/invalid-movie-item', 'Choose a movie with a valid library id.');
}

function validateEpisodePlaybackItem(
  item: EpisodePlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiEpisodePlaybackItem(item)
    ? null
    : createInputError('input/invalid-episode-item', 'Choose an episode with a valid library id.');
}

function validateMusicVideoPlaybackItem(
  item: MusicVideoPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiMusicVideoPlaybackItem(item)
    ? null
    : createInputError(
        'input/invalid-music-video-item',
        'Choose a music video with a valid library id.'
      );
}

function validatePvrChannelPlaybackItem(
  item: PvrChannelPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiPvrChannelItem(item)
    ? null
    : createInputError('input/invalid-pvr-channel-item', 'Choose a PVR channel with a valid id.');
}

function validateEpisodeStreamItem(
  item: EpisodeStreamItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiEpisodeStreamItem(item)
    ? null
    : createInputError('input/invalid-episode-item', 'Choose an episode with a valid library id.');
}

function validateFilePlaybackItem(item: FilePlaybackItem): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiFilePlaybackItem(item)
    ? null
    : createInputError('input/invalid-file-item', 'Choose a supported media file to play.');
}

function validatePlaylistPlaybackItem(
  item: PlaylistPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiPlaylistPlaybackItem(item)
    ? null
    : createInputError('input/invalid-playlist-item', 'Choose a supported smart playlist.');
}

function toKodiFilePlaybackItem(
  item: FilePlaybackItem
): { file: string } | { directory: string } | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (
    (keys.length === 2 || keys.length === 3) &&
    keys[0] === 'file' &&
    (keys.length === 2 || keys[1] === 'itemType') &&
    keys[keys.length - 1] === 'mediaKind' &&
    typeof candidate.file === 'string' &&
    candidate.file.trim().length > 0 &&
    (candidate.mediaKind === 'audio' || candidate.mediaKind === 'video') &&
    (keys.length === 2 || candidate.itemType === 'file' || candidate.itemType === 'directory')
  ) {
    if (candidate.itemType === 'directory') {
      return { directory: candidate.file };
    }

    return { file: candidate.file };
  }

  return null;
}

function toLocalFilePlaylistItem(item: LocalFilePlaylistItem): LocalFilePlaylistItem[] {
  if (!item || typeof item !== 'object') {
    return [];
  }

  const candidate = item as Record<string, unknown>;
  if (
    typeof candidate.file !== 'string' ||
    candidate.file.trim().length === 0 ||
    candidate.mediaKind !== 'audio'
  ) {
    return [];
  }

  return [
    {
      file: candidate.file,
      mediaKind: 'audio',
      ...(typeof candidate.label === 'string' && candidate.label.length > 0
        ? { label: candidate.label }
        : {}),
      ...(typeof candidate.title === 'string' && candidate.title.length > 0
        ? { title: candidate.title }
        : {}),
      ...(typeof candidate.thumbnail === 'string' && candidate.thumbnail.length > 0
        ? { thumbnail: candidate.thumbnail }
        : {}),
      ...(typeof candidate.id === 'number' && Number.isFinite(candidate.id)
        ? { id: candidate.id }
        : {}),
      ...(typeof candidate.songid === 'number' && Number.isFinite(candidate.songid)
        ? { songid: candidate.songid }
        : {}),
      ...(typeof candidate.type === 'string' && candidate.type.length > 0
        ? { type: candidate.type }
        : {})
    }
  ];
}

function resolveLocalFilePlaylistIndex(
  items: readonly LocalFilePlaylistItem[],
  startFile: string | undefined
): number {
  if (items.length === 0) {
    return -1;
  }

  if (typeof startFile === 'string' && startFile.trim()) {
    const index = items.findIndex((item) => item.file === startFile);
    if (index >= 0) {
      return index;
    }
  }

  return 0;
}

function nextLocalSequentialIndex(
  length: number,
  currentIndex: number,
  command: 'previous' | 'next'
): number {
  const offset = command === 'next' ? 1 : -1;
  return (currentIndex + offset + length) % length;
}

function nextLocalShuffleIndex(length: number, currentIndex: number): number {
  if (length <= 1) {
    return 0;
  }

  const randomIndex = Math.floor(Math.random() * (length - 1));
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex;
}

function localFilePlaylistItemIdentity(
  item: LocalFilePlaylistItem | null,
  fallbackLabel: string
): {
  id?: number;
  label?: string;
  title?: string;
  type?: string;
  songid?: number;
  thumbnail?: string;
} {
  if (!item) {
    return { label: fallbackLabel, type: 'file' };
  }

  return {
    ...(typeof item.id === 'number' && Number.isFinite(item.id) ? { id: item.id } : {}),
    label: item.label || item.title || fallbackLabel,
    ...(item.title ? { title: item.title } : {}),
    type: item.type || 'file',
    ...(typeof item.songid === 'number' && Number.isFinite(item.songid)
      ? { songid: item.songid }
      : {}),
    ...(item.thumbnail ? { thumbnail: item.thumbnail } : {})
  };
}

function toKodiPlaylistPlaybackItem(item: PlaylistPlaybackItem): { file: string } | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (
    keys.length === 3 &&
    keys[0] === 'file' &&
    keys[1] === 'mediaKind' &&
    keys[2] === 'playlistKind' &&
    typeof candidate.file === 'string' &&
    candidate.file.trim().length > 0 &&
    (candidate.mediaKind === 'music' || candidate.mediaKind === 'video') &&
    (candidate.playlistKind === 'smart' || candidate.playlistKind === 'basic')
  ) {
    return { file: candidate.file };
  }

  return null;
}

function toKodiEpisodePlaybackItem(item: EpisodePlaybackItem): KodiEpisodeLibraryItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  const hasValidKeys =
    (keys.length === 1 && keys[0] === 'episodeid') ||
    (keys.length === 2 && keys[0] === 'episodeid' && keys[1] === 'resume');

  if (!hasValidKeys || !isPositiveSafeInteger(candidate.episodeid)) {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, 'resume') &&
    typeof candidate.resume !== 'boolean'
  ) {
    return null;
  }

  return { episodeid: candidate.episodeid };
}

function toKodiEpisodeStreamItem(item: EpisodeStreamItem): KodiEpisodeLibraryItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  const allowedKeys = new Set(['episodeid', 'label', 'resume', 'title']);

  if (!keys.every((key) => allowedKeys.has(key)) || !isPositiveSafeInteger(candidate.episodeid)) {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, 'resume') &&
    typeof candidate.resume !== 'boolean'
  ) {
    return null;
  }

  for (const key of ['label', 'title']) {
    if (Object.prototype.hasOwnProperty.call(candidate, key) && !isSafeUiLabel(candidate[key])) {
      return null;
    }
  }

  return { episodeid: candidate.episodeid };
}

function toKodiMoviePlaybackItem(item: MoviePlaybackItem): { movieid: number } | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  const hasValidKeys =
    (keys.length === 1 && keys[0] === 'movieid') ||
    (keys.length === 2 && keys[0] === 'movieid' && keys[1] === 'resume');

  if (!hasValidKeys || !isPositiveSafeInteger(candidate.movieid)) {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, 'resume') &&
    typeof candidate.resume !== 'boolean'
  ) {
    return null;
  }

  return { movieid: candidate.movieid };
}

function toKodiMusicVideoPlaybackItem(
  item: MusicVideoPlaybackItem
): KodiMusicVideoLibraryItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (
    keys.length === 1 &&
    keys[0] === 'musicvideoid' &&
    isPositiveSafeInteger(candidate.musicvideoid)
  ) {
    return { musicvideoid: candidate.musicvideoid };
  }

  return null;
}

function toKodiPvrChannelItem(item: PvrChannelPlaybackItem): KodiPvrChannelItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  if (keys.length === 1 && keys[0] === 'channelid' && isPositiveSafeInteger(candidate.channelid)) {
    return { channelid: candidate.channelid };
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

function isSafeUiLabel(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !/https?:\/\//i.test(value) &&
    !/smb:\/\//i.test(value) &&
    !/authorization/i.test(value) &&
    !/basic\s+[a-z0-9+/=]+/i.test(value) &&
    !/localStorage|sessionStorage/i.test(value) &&
    !/p@ssword|password/i.test(value)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
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
      : {}),
    ...(typeof candidate.thumbnail === 'string' && candidate.thumbnail.length > 0
      ? { thumbnail: candidate.thumbnail }
      : {})
  };
}

function currentPlayerFile(snapshot: PlayerStoreSnapshot): string {
  return typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';
}

async function resolveMovieStreamDetail(
  client: KodiJsonRpcHttpClient,
  movieid: number
): Promise<KodiMovieLibraryItem | null> {
  const result = await getVideoLibraryMovieDetails(client, {
    movieid,
    properties: ['title', 'thumbnail', 'file', 'art']
  });
  return result.moviedetails ?? null;
}

async function resolveEpisodeStreamDetail(
  client: KodiJsonRpcHttpClient,
  episodeid: number
): Promise<KodiEpisodeLibraryItem | null> {
  const result = await getVideoLibraryEpisodeDetails(client, {
    episodeid,
    properties: ['title', 'showtitle', 'thumbnail', 'file', 'art']
  });
  return result.episodedetails ?? null;
}

async function resolveMusicVideoStreamDetail(
  client: KodiJsonRpcHttpClient,
  musicvideoid: number
): Promise<KodiMusicVideoLibraryItem | null> {
  const result = await getVideoLibraryMusicVideoDetails(client, {
    musicvideoid,
    properties: ['title', 'thumbnail', 'file', 'art']
  });
  return result.musicvideodetails ?? null;
}

function rawMediaFile(item: Record<string, unknown> | null): string {
  return typeof item?.file === 'string' ? item.file.trim() : '';
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const timeout = globalThis.setTimeout?.(resolve, ms);
    if (typeof timeout === 'object' && timeout && 'unref' in timeout) {
      (timeout as { unref: () => void }).unref();
    }
  });
}

function extractEpisodeLocalItemIdentity(
  item: PlayerStoreSnapshot['item'],
  episodeid: number,
  requested: EpisodeStreamItem
): {
  label: string;
  title: string;
  type: 'episode';
  episodeid: number;
} {
  const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const requestedLabel = typeof requested.label === 'string' ? requested.label : undefined;
  const requestedTitle = typeof requested.title === 'string' ? requested.title : undefined;
  const snapshotLabel =
    typeof candidate.label === 'string' && candidate.label.length > 0 ? candidate.label : undefined;
  const snapshotTitle =
    typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : undefined;
  const label = requestedLabel ?? requestedTitle ?? snapshotLabel ?? snapshotTitle ?? 'Episode';
  const title = requestedTitle ?? snapshotTitle ?? label;

  return {
    label,
    title,
    type: 'episode',
    episodeid
  };
}

function extractMovieLocalItemIdentity(
  item: PlayerStoreSnapshot['item'],
  movieid: number
): {
  label: string;
  title: string;
  type: 'movie';
  movieid: number;
} {
  const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const label =
    typeof candidate.label === 'string' && candidate.label.length > 0 ? candidate.label : 'Movie';
  const title =
    typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : label;

  return {
    label,
    title,
    type: 'movie',
    movieid
  };
}

function extractMusicVideoLocalItemIdentity(
  item: PlayerStoreSnapshot['item'],
  musicvideoid: number
): {
  label: string;
  title: string;
  type: 'musicvideo';
  musicvideoid: number;
  thumbnail?: string;
} {
  const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const label =
    typeof candidate.label === 'string' && candidate.label.length > 0
      ? candidate.label
      : 'Music video';
  const title =
    typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : label;

  return {
    label,
    title,
    type: 'musicvideo',
    musicvideoid,
    ...(typeof candidate.thumbnail === 'string' && candidate.thumbnail.length > 0
      ? { thumbnail: candidate.thumbnail }
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
