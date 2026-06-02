import type {
  KodiEpisodeLibraryItem,
  KodiMusicVideoLibraryItem,
  KodiMusicLibraryItem,
  KodiPvrChannelItem,
  PlayerAudioStreamValue,
  PlayerSubtitleValue
} from '$lib/kodi';
import type {
  EpisodePlaybackItem,
  EpisodeStreamItem,
  FilePlaybackItem,
  MoviePlaybackItem,
  MusicPlaybackItem,
  MusicVideoPlaybackItem,
  PlayerDispatchSafeErrorSnapshot,
  PlaylistPlaybackItem,
  PvrChannelPlaybackItem
} from './playerDispatchTypes';

const VALID_AUDIO_STREAM_LITERALS = new Set<PlayerAudioStreamValue>(['previous', 'next']);
const VALID_SUBTITLE_LITERALS = new Set<PlayerSubtitleValue>(['previous', 'next', 'off', 'on']);

export function validateAudioStream(
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

export function validateSubtitle(
  subtitle: PlayerSubtitleValue
): PlayerDispatchSafeErrorSnapshot | null {
  if (typeof subtitle === 'number') {
    return Number.isFinite(subtitle)
      ? null
      : createInputError('input/invalid-subtitle', 'Choose a valid subtitle stream.');
  }

  return VALID_SUBTITLE_LITERALS.has(subtitle)
    ? null
    : createInputError('input/invalid-subtitle', 'Choose a valid subtitle stream.');
}

export function validateMusicPlaybackItem(
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

export function validateMoviePlaybackItem(
  item: MoviePlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiMoviePlaybackItem(item)
    ? null
    : createInputError('input/invalid-movie-item', 'Choose a movie with a valid library id.');
}

export function validateEpisodePlaybackItem(
  item: EpisodePlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiEpisodePlaybackItem(item)
    ? null
    : createInputError('input/invalid-episode-item', 'Choose an episode with a valid library id.');
}

export function validateMusicVideoPlaybackItem(
  item: MusicVideoPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiMusicVideoPlaybackItem(item)
    ? null
    : createInputError(
        'input/invalid-music-video-item',
        'Choose a music video with a valid library id.'
      );
}

export function validatePvrChannelPlaybackItem(
  item: PvrChannelPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiPvrChannelItem(item)
    ? null
    : createInputError('input/invalid-pvr-channel-item', 'Choose a PVR channel with a valid id.');
}

export function validateEpisodeStreamItem(
  item: EpisodeStreamItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiEpisodeStreamItem(item)
    ? null
    : createInputError('input/invalid-episode-item', 'Choose an episode with a valid library id.');
}

export function validateFilePlaybackItem(
  item: FilePlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiFilePlaybackItem(item)
    ? null
    : createInputError('input/invalid-file-item', 'Choose a supported media file to play.');
}

export function validatePlaylistPlaybackItem(
  item: PlaylistPlaybackItem
): PlayerDispatchSafeErrorSnapshot | null {
  return toKodiPlaylistPlaybackItem(item)
    ? null
    : createInputError('input/invalid-playlist-item', 'Choose a supported smart playlist.');
}

export function toKodiFilePlaybackItem(
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

export function toKodiPlaylistPlaybackItem(item: PlaylistPlaybackItem): { file: string } | null {
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

export function toKodiEpisodePlaybackItem(
  item: EpisodePlaybackItem
): KodiEpisodeLibraryItem | null {
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

export function toKodiEpisodeStreamItem(item: EpisodeStreamItem): KodiEpisodeLibraryItem | null {
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

export function toKodiMoviePlaybackItem(item: MoviePlaybackItem): { movieid: number } | null {
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

export function toKodiMusicVideoPlaybackItem(
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

export function toKodiPvrChannelItem(item: PvrChannelPlaybackItem): KodiPvrChannelItem | null {
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

export function toKodiMusicLibraryItem(item: MusicPlaybackItem): KodiMusicLibraryItem | null {
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
