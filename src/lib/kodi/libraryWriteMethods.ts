import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  KodiLibraryWriteResult,
  AudioLibrarySetAlbumDetailsParams,
  AudioLibrarySetArtistDetailsParams,
  AudioLibrarySetSongDetailsParams,
  AudioLibraryScanParams,
  AudioLibraryCleanParams,
  VideoLibrarySetMovieDetailsParams,
  VideoLibrarySetTvShowDetailsParams,
  VideoLibrarySetEpisodeDetailsParams,
  VideoLibrarySetMusicVideoDetailsParams,
  VideoLibrarySetSeasonDetailsParams
} from './methodContracts';

import { callKodi } from './methodCall';

export function setSongDetails(
  client: KodiJsonRpcHttpClient,
  params: AudioLibrarySetSongDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, AudioLibrarySetSongDetailsParams>(
    client,
    'AudioLibrary.SetSongDetails',
    params,
    options
  );
}

export function setAlbumDetails(
  client: KodiJsonRpcHttpClient,
  params: AudioLibrarySetAlbumDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, AudioLibrarySetAlbumDetailsParams>(
    client,
    'AudioLibrary.SetAlbumDetails',
    params,
    options
  );
}

export function setArtistDetails(
  client: KodiJsonRpcHttpClient,
  params: AudioLibrarySetArtistDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, AudioLibrarySetArtistDetailsParams>(
    client,
    'AudioLibrary.SetArtistDetails',
    params,
    options
  );
}

export function scanAudioLibrary(
  client: KodiJsonRpcHttpClient,
  params: AudioLibraryScanParams = {},
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, AudioLibraryScanParams>(
    client,
    'AudioLibrary.Scan',
    params,
    options
  );
}

export function cleanAudioLibrary(
  client: KodiJsonRpcHttpClient,
  params: AudioLibraryCleanParams = { showdialogs: false },
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, AudioLibraryCleanParams>(
    client,
    'AudioLibrary.Clean',
    params,
    options
  );
}

export function setMovieDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySetMovieDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibrarySetMovieDetailsParams>(
    client,
    'VideoLibrary.SetMovieDetails',
    params,
    options
  );
}

export function setTvShowDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySetTvShowDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibrarySetTvShowDetailsParams>(
    client,
    'VideoLibrary.SetTVShowDetails',
    params,
    options
  );
}

export function setMusicVideoDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySetMusicVideoDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibrarySetMusicVideoDetailsParams>(
    client,
    'VideoLibrary.SetMusicVideoDetails',
    params,
    options
  );
}

export function setEpisodeDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySetEpisodeDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibrarySetEpisodeDetailsParams>(
    client,
    'VideoLibrary.SetEpisodeDetails',
    params,
    options
  );
}

export function setSeasonDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySetSeasonDetailsParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibrarySetSeasonDetailsParams>(
    client,
    'VideoLibrary.SetSeasonDetails',
    params,
    options
  );
}
