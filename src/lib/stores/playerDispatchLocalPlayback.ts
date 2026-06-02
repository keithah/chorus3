import { goToPlayerItem, playPausePlayer, type KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  localPlayerStore as defaultLocalPlayerStore,
  prepareLocalStreamUrl,
  type LocalPlayerStore
} from './localPlayer.svelte.ts';
import type { ConfigStore } from './config.svelte.ts';
import type { PlayerStoreSnapshot } from './player.svelte.ts';
import {
  currentPlayerFile,
  extractLocalItemIdentity,
  inferMediaKind,
  localFilePlaylistItemIdentity,
  type LocalFilePlaylistState
} from './playerDispatchLocalItems';
import { createConfigError, createInputError, createSafeError } from './playerDispatchSupport';
import {
  toKodiMusicLibraryItem,
  validateFilePlaybackItem,
  validateMusicPlaybackItem
} from './playerDispatchCodecs';
import type {
  FilePlaybackItem,
  MusicPlaybackItem,
  PlayerCommandName,
  PlayerDispatchSafeErrorSnapshot,
  PlayerDispatchSnapshot
} from './playerDispatchTypes';
import type { KodiMusicLibraryItem } from '$lib/kodi';
import { openPlayerItem } from '$lib/kodi';

type RefreshReason = `command:${PlayerCommandName}`;

type LocalPlaybackPlayerStore = {
  readonly snapshot: PlayerStoreSnapshot;
  refresh(reason: RefreshReason): Promise<void> | void;
};

export type LocalPlaybackContext = {
  readonly playerStore: LocalPlaybackPlayerStore;
  readonly localPlayerStore: LocalPlayerStore;
  readonly configStore: ConfigStore;
  readonly localFiles: LocalFilePlaylistState;
  startCommand(command: PlayerCommandName): void;
  failCommand(error: PlayerDispatchSafeErrorSnapshot): void;
  markCommandSuccess(patch?: Partial<PlayerDispatchSnapshot>): void;
  runAfterSuccessfulCommand(command: PlayerCommandName): Promise<void>;
  resolveClient(): KodiJsonRpcHttpClient | null;
  resolveSinglePlayerId(): number | null;
  resolveSingleVideoPlayerId(): number | null;
};

type RefreshPlayableFileOptions = {
  requireDifferentFile?: boolean;
  allowSameFileAfterAttempts?: number;
};

export async function runLocalMusicItemPlayback(
  context: LocalPlaybackContext,
  item: MusicPlaybackItem
): Promise<void> {
  context.startCommand('playMusicItem');

  const validationError = validateMusicPlaybackItem(item);
  if (validationError) {
    context.failCommand(validationError);
    return;
  }

  const musicItem = toKodiMusicLibraryItem(item) as KodiMusicLibraryItem;
  const client = context.resolveClient();
  if (!client) {
    context.failCommand(
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
    context.failCommand(createSafeError(error));
    return;
  }

  const previousFile = currentPlayerFile(context.playerStore.snapshot);
  const refreshed = await refreshUntilPlayableFile(context, 'playMusicItem', previousFile, {
    allowSameFileAfterAttempts: 2
  });
  if (!refreshed) {
    return;
  }

  const snapshot = context.playerStore.snapshot;
  const playerid = context.resolveSinglePlayerId();
  if (playerid === null) {
    return;
  }

  const speed = typeof snapshot.properties?.speed === 'number' ? snapshot.properties.speed : null;
  const kodiIsPlaying = speed === null ? true : speed !== 0;
  if (kodiIsPlaying) {
    try {
      await playPausePlayer(client, playerid);
    } catch (error) {
      context.failCommand(createSafeError(error));
      return;
    }
  }

  const file = typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';
  let streamUrl: string;
  try {
    streamUrl = await prepareLocalStreamUrl({
      client,
      file,
      activeHost: context.configStore.activeHost
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  try {
    await loadLocalMediaOrThrow(context.localPlayerStore, {
      source: streamUrl,
      item: extractLocalItemIdentity(snapshot.item),
      mediaKind: inferMediaKind(snapshot.primaryPlayer?.type),
      kodiWasPaused: true
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  await context.runAfterSuccessfulCommand('playMusicItem');
  context.markCommandSuccess({ mode: 'local' });
}

export async function runLocalFilePlaybackCommand(
  context: LocalPlaybackContext,
  item: FilePlaybackItem
): Promise<void> {
  context.startCommand('playFileItem');

  const validationError = validateFilePlaybackItem(item);
  if (validationError) {
    context.failCommand(validationError);
    return;
  }

  context.localFiles.ensureFile(item.file);
  const client = context.resolveClient();
  if (!client) {
    context.failCommand(
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
      activeHost: context.configStore.activeHost
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  try {
    await loadLocalMediaOrThrow(context.localPlayerStore, {
      source: streamUrl,
      item: localFilePlaylistItemIdentity(context.localFiles.currentItem(), 'File item'),
      mediaKind: item.mediaKind,
      kodiWasPaused: false
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  context.markCommandSuccess({ mode: 'local' });
}

export async function runLocalFilePlaylistNavigation(
  context: LocalPlaybackContext,
  command: 'previous' | 'next'
): Promise<void> {
  context.startCommand(command);

  const client = context.resolveClient();
  if (!client) {
    context.failCommand(
      createConfigError(
        'config/no-active-host',
        'Choose an active Kodi host before using local playback navigation.'
      )
    );
    return;
  }

  const item = context.localFiles.move(command);
  if (!item) {
    context.failCommand(
      createInputError('input/missing-file', 'Choose a supported local playlist item.')
    );
    return;
  }

  let streamUrl: string;
  try {
    streamUrl = await prepareLocalStreamUrl({
      client,
      file: item.file,
      activeHost: context.configStore.activeHost
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  try {
    await loadLocalMediaOrThrow(context.localPlayerStore, {
      source: streamUrl,
      item: localFilePlaylistItemIdentity(item, 'File item'),
      mediaKind: item.mediaKind,
      kodiWasPaused: false
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  context.markCommandSuccess({ mode: 'local' });
}

export async function runStartLocalPlayback(context: LocalPlaybackContext): Promise<void> {
  context.startCommand('startLocalPlayback');

  const client = context.resolveClient();
  if (!client) {
    context.failCommand(
      createConfigError(
        'config/no-active-host',
        'Choose an active Kodi host before starting local playback.'
      )
    );
    return;
  }

  try {
    await context.playerStore.refresh('command:startLocalPlayback');
  } catch {
    // PlayerStore owns refresh failure diagnostics; continue with the best available snapshot.
  }

  const playerid = context.resolveSinglePlayerId();
  if (playerid === null) {
    return;
  }

  const snapshot = context.playerStore.snapshot;
  const file = typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';

  if (!file) {
    context.failCommand({
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
      context.failCommand(createSafeError(error));
      return;
    }
  }

  let streamUrl: string;
  try {
    streamUrl = await prepareLocalStreamUrl({
      client,
      file,
      activeHost: context.configStore.activeHost
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  const mediaKind = inferMediaKind(snapshot.primaryPlayer?.type);

  try {
    await loadLocalMediaOrThrow(context.localPlayerStore, {
      source: streamUrl,
      item: extractLocalItemIdentity(snapshot.item),
      mediaKind,
      kodiWasPaused: shouldPauseKodi
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  context.markCommandSuccess({ mode: 'local' });
}

export async function runLocalPlaylistNavigation(
  context: LocalPlaybackContext,
  command: 'previous' | 'next'
): Promise<void> {
  context.startCommand(command);

  const client = context.resolveClient();
  if (!client) {
    context.failCommand(
      createConfigError(
        'config/no-active-host',
        'Choose an active Kodi host before using local playback navigation.'
      )
    );
    return;
  }

  const playerid = context.resolveSinglePlayerId();
  if (playerid === null) {
    return;
  }

  try {
    await goToPlayerItem(client, playerid, command);
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  const previousFile = currentPlayerFile(context.playerStore.snapshot);
  const refreshed = await refreshUntilPlayableFile(context, command, previousFile, {
    requireDifferentFile: true
  });
  if (!refreshed) {
    return;
  }

  const snapshot = context.playerStore.snapshot;
  const file = typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';
  if (!file) {
    context.failCommand({
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
      context.failCommand(createSafeError(error));
      return;
    }
  }

  let streamUrl: string;
  try {
    streamUrl = await prepareLocalStreamUrl({
      client,
      file,
      activeHost: context.configStore.activeHost
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  try {
    await loadLocalMediaOrThrow(context.localPlayerStore, {
      source: streamUrl,
      item: extractLocalItemIdentity(snapshot.item),
      mediaKind: inferMediaKind(snapshot.primaryPlayer?.type),
      kodiWasPaused: true
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  context.markCommandSuccess({ mode: 'local' });
}

export async function runResumeOnKodi(context: LocalPlaybackContext): Promise<void> {
  context.startCommand('resumeOnKodi');

  const playerid = context.resolveSinglePlayerId();
  if (playerid === null) {
    return;
  }

  const client = context.resolveClient();
  if (!client) {
    context.failCommand(
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
    context.failCommand(createSafeError(error));
    return;
  }

  try {
    await context.playerStore.refresh('command:resumeOnKodi');
  } catch {
    // PlayerStore owns refresh failure diagnostics.
  }

  context.markCommandSuccess({ mode: 'kodi' });
}

export async function pauseActiveVideoPlayback(
  context: LocalPlaybackContext,
  client: KodiJsonRpcHttpClient,
  command: PlayerCommandName
): Promise<boolean> {
  try {
    await context.playerStore.refresh(`command:${command}`);
  } catch {
    // PlayerStore owns refresh failure diagnostics. Browser streaming can still continue.
  }

  const playerid = context.resolveSingleVideoPlayerId();
  if (playerid === null) {
    return false;
  }

  const speed = context.playerStore.snapshot.properties?.speed;
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

export async function loadLocalMediaOrThrow(
  localPlayerStore: LocalPlayerStore = defaultLocalPlayerStore,
  input: Parameters<LocalPlayerStore['loadAndPlay']>[0]
): Promise<void> {
  await localPlayerStore.loadAndPlay(input);

  const localSnapshot = localPlayerStore.snapshot;
  if (localSnapshot.status !== 'error') {
    return;
  }

  const error = new Error(
    localSnapshot.lastError?.message || 'Local media playback could not start.'
  ) as Error & { code: string };
  error.code = localSnapshot.lastError?.code || 'media/error';
  throw error;
}

async function refreshUntilPlayableFile(
  context: LocalPlaybackContext,
  command: PlayerCommandName,
  previousFile: string,
  options: RefreshPlayableFileOptions = {}
): Promise<boolean> {
  const requireDifferentFile = options.requireDifferentFile === true && Boolean(previousFile);
  const allowSameFileAfterAttempts = options.allowSameFileAfterAttempts ?? Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      await context.playerStore.refresh(`command:${command}`);
    } catch {
      // PlayerStore owns refresh failure diagnostics; retry with best available state.
    }

    const file = currentPlayerFile(context.playerStore.snapshot);
    if (file && (!previousFile || file !== previousFile)) {
      return true;
    }

    if (file && !requireDifferentFile && attempt >= allowSameFileAfterAttempts) {
      return true;
    }

    await sleep(200);
  }

  const file = currentPlayerFile(context.playerStore.snapshot);
  if (file && !requireDifferentFile) {
    return true;
  }

  if (file && requireDifferentFile) {
    context.failCommand({
      source: 'input',
      code: 'input/unchanged-file',
      message: 'Kodi did not change tracks for local playback navigation.'
    });
    return false;
  }

  context.failCommand({
    source: 'input',
    code: 'input/missing-file',
    message: 'Kodi did not expose a playable file for local playback.'
  });
  return false;
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const timeout = globalThis.setTimeout?.(resolve, ms);
    if (typeof timeout === 'object' && timeout && 'unref' in timeout) {
      (timeout as { unref: () => void }).unref();
    }
  });
}
