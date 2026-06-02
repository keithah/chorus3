import { prepareLocalStreamUrl, type LocalPlayerItemSnapshot } from './localPlayer.svelte.ts';
import {
  extractEpisodeLocalItemIdentity,
  extractMovieLocalItemIdentity,
  extractMusicVideoLocalItemIdentity
} from './playerDispatchLocalItems';
import {
  loadLocalMediaOrThrow,
  pauseActiveVideoPlayback,
  type LocalPlaybackContext
} from './playerDispatchLocalPlayback';
import { createConfigError, createSafeError } from './playerDispatchSupport';
import {
  toKodiEpisodeStreamItem,
  toKodiMoviePlaybackItem,
  toKodiMusicVideoPlaybackItem,
  validateEpisodeStreamItem,
  validateMoviePlaybackItem,
  validateMusicVideoPlaybackItem
} from './playerDispatchCodecs';
import type {
  EpisodeStreamItem,
  MoviePlaybackItem,
  MusicVideoPlaybackItem,
  PlayerCommandName
} from './playerDispatchTypes';
import {
  rawMediaFile,
  resolveEpisodeStreamDetail,
  resolveMovieStreamDetail,
  resolveMusicVideoStreamDetail
} from './playerDispatchStreams';
import type {
  KodiEpisodeLibraryItem,
  KodiJsonRpcHttpClient,
  KodiMovieLibraryItem,
  KodiMusicVideoLibraryItem
} from '$lib/kodi';

type VideoStreamCommandInput<TDetail extends Record<string, unknown>> = {
  command: PlayerCommandName;
  validate: () => ReturnType<typeof validateMoviePlaybackItem>;
  resolveClientItem: () => unknown;
  resolveDetail: (client: KodiJsonRpcHttpClient, item: unknown) => Promise<TDetail | null>;
  missingFileMessage: string;
  resolveLocalItem: (detail: TDetail, item: unknown) => LocalPlayerItemSnapshot;
  afterSuccessfulCommand?: PlayerCommandName;
};

export async function runStreamMovieItem(
  context: LocalPlaybackContext,
  item: MoviePlaybackItem
): Promise<void> {
  return runVideoLibraryStream<KodiMovieLibraryItem>(context, {
    command: 'streamMovieItem',
    validate: () => validateMoviePlaybackItem(item),
    resolveClientItem: () => toKodiMoviePlaybackItem(item) ?? { movieid: 0 },
    resolveDetail: (client, movieItem) =>
      resolveMovieStreamDetail(client, (movieItem as { movieid: number }).movieid),
    missingFileMessage: 'Kodi did not expose a playable movie file for browser streaming.',
    resolveLocalItem: (detail, movieItem) =>
      extractMovieLocalItemIdentity(detail, (movieItem as { movieid: number }).movieid),
    afterSuccessfulCommand: 'playFileItem'
  });
}

export async function runStreamMusicVideoItem(
  context: LocalPlaybackContext,
  item: MusicVideoPlaybackItem
): Promise<void> {
  return runVideoLibraryStream<KodiMusicVideoLibraryItem>(context, {
    command: 'streamMusicVideoItem',
    validate: () => validateMusicVideoPlaybackItem(item),
    resolveClientItem: () => toKodiMusicVideoPlaybackItem(item) ?? { musicvideoid: 0 },
    resolveDetail: (client, musicVideoItem) =>
      resolveMusicVideoStreamDetail(
        client,
        (musicVideoItem as { musicvideoid: number }).musicvideoid
      ),
    missingFileMessage: 'Kodi did not expose a playable music video file for browser streaming.',
    resolveLocalItem: (detail, musicVideoItem) =>
      extractMusicVideoLocalItemIdentity(
        detail,
        (musicVideoItem as { musicvideoid: number }).musicvideoid
      )
  });
}

export async function runStreamEpisodeItem(
  context: LocalPlaybackContext,
  item: EpisodeStreamItem
): Promise<void> {
  return runVideoLibraryStream<KodiEpisodeLibraryItem>(context, {
    command: 'streamEpisodeItem',
    validate: () => validateEpisodeStreamItem(item),
    resolveClientItem: () => toKodiEpisodeStreamItem(item) ?? { episodeid: 0 },
    resolveDetail: (client, episodeItem) =>
      resolveEpisodeStreamDetail(client, (episodeItem as { episodeid: number }).episodeid),
    missingFileMessage: 'Kodi did not expose a playable episode file for browser streaming.',
    resolveLocalItem: (detail, episodeItem) =>
      extractEpisodeLocalItemIdentity(
        detail,
        (episodeItem as { episodeid: number }).episodeid,
        item
      )
  });
}

async function runVideoLibraryStream<TDetail extends Record<string, unknown>>(
  context: LocalPlaybackContext,
  input: VideoStreamCommandInput<TDetail>
): Promise<void> {
  context.startCommand(input.command);

  const validationError = input.validate();
  if (validationError) {
    context.failCommand(validationError);
    return;
  }

  const clientItem = input.resolveClientItem();
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

  let detail: TDetail | null = null;
  try {
    detail = await input.resolveDetail(client, clientItem);
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  const file = rawMediaFile(detail);

  if (!detail || !file) {
    context.failCommand({
      source: 'input',
      code: 'input/missing-file',
      message: input.missingFileMessage
    });
    return;
  }

  const kodiWasPaused = await pauseActiveVideoPlayback(context, client, input.command);

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
      item: input.resolveLocalItem(detail, clientItem),
      mediaKind: 'video',
      kodiWasPaused
    });
  } catch (error) {
    context.failCommand(createSafeError(error));
    return;
  }

  if (input.afterSuccessfulCommand) {
    await context.runAfterSuccessfulCommand(input.afterSuccessfulCommand);
  }
  context.markCommandSuccess({ mode: 'local' });
}
