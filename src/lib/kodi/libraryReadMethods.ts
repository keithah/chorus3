import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  KodiLibraryWriteResult,
  VideoLibraryTvShowPropertyName,
  AudioLibraryArtistsResult,
  AudioLibraryAlbumsResult,
  AudioLibrarySongsResult,
  AudioLibraryGenresResult,
  VideoLibraryMoviesResult,
  VideoLibraryTvShowsResult,
  VideoLibraryTvShowDetailsResult,
  VideoLibrarySeasonsResult,
  VideoLibrarySeasonDetailsResult,
  VideoLibraryEpisodesResult,
  VideoLibraryEpisodeDetailsResult,
  VideoLibraryMusicVideosResult,
  VideoLibraryMusicVideoDetailsResult,
  VideoLibraryAvailableArtParams,
  VideoLibraryAvailableArtResult,
  VideoLibraryAvailableArtTypesParams,
  VideoLibraryAvailableArtTypesResult,
  VideoLibraryRefreshTvShowParams,
  VideoLibraryRefreshMovieParams,
  VideoLibraryRefreshEpisodeParams,
  VideoLibraryScanParams,
  VideoLibraryCleanParams,
  AudioLibraryArtistsParams,
  AudioLibraryAlbumsParams,
  AudioLibrarySongsParams,
  AudioLibraryGenresParams,
  VideoLibraryMoviesParams,
  VideoLibraryMovieDetailsParams,
  VideoLibraryTvShowsParams,
  VideoLibraryTvShowDetailsParams,
  VideoLibrarySeasonsParams,
  VideoLibrarySeasonDetailsParams,
  VideoLibraryEpisodesParams,
  VideoLibraryEpisodeDetailsParams,
  VideoLibraryMusicVideosParams,
  VideoLibraryMusicVideoDetailsParams,
  VideoLibraryMovieDetailsResult
} from './methodContracts';

import { callKodi, withDefaultProperties } from './methodCall';

const DEFAULT_VIDEO_LIBRARY_TV_SHOW_PROPERTIES: readonly VideoLibraryTvShowPropertyName[] = [
  'title',
  'sorttitle',
  'thumbnail',
  'fanart',
  'art',
  'year',
  'plot',
  'episode',
  'watchedepisodes',
  'playcount',
  'lastplayed',
  'genre',
  'studio',
  'rating',
  'userrating'
];

export function getAudioLibraryArtists(
  client: KodiJsonRpcHttpClient,
  params: AudioLibraryArtistsParams = {},
  options?: KodiHttpCallOptions
): Promise<AudioLibraryArtistsResult> {
  return callKodi<AudioLibraryArtistsResult, AudioLibraryArtistsParams>(
    client,
    'AudioLibrary.GetArtists',
    params,
    options
  );
}

export function getAudioLibraryAlbums(
  client: KodiJsonRpcHttpClient,
  params: AudioLibraryAlbumsParams = {},
  options?: KodiHttpCallOptions
): Promise<AudioLibraryAlbumsResult> {
  return callKodi<AudioLibraryAlbumsResult, AudioLibraryAlbumsParams>(
    client,
    'AudioLibrary.GetAlbums',
    params,
    options
  );
}

export function getAudioLibrarySongs(
  client: KodiJsonRpcHttpClient,
  params: AudioLibrarySongsParams = {},
  options?: KodiHttpCallOptions
): Promise<AudioLibrarySongsResult> {
  return callKodi<AudioLibrarySongsResult, AudioLibrarySongsParams>(
    client,
    'AudioLibrary.GetSongs',
    params,
    options
  );
}

export function getAudioLibraryGenres(
  client: KodiJsonRpcHttpClient,
  params: AudioLibraryGenresParams = {},
  options?: KodiHttpCallOptions
): Promise<AudioLibraryGenresResult> {
  return callKodi<AudioLibraryGenresResult, AudioLibraryGenresParams>(
    client,
    'AudioLibrary.GetGenres',
    params,
    options
  );
}

export function getVideoLibraryMovies(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryMoviesParams = {},
  options?: KodiHttpCallOptions
): Promise<VideoLibraryMoviesResult> {
  return callKodi<VideoLibraryMoviesResult, VideoLibraryMoviesParams>(
    client,
    'VideoLibrary.GetMovies',
    params,
    options
  );
}

export function getVideoLibraryMovieDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryMovieDetailsParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibraryMovieDetailsResult> {
  return callKodi<VideoLibraryMovieDetailsResult, VideoLibraryMovieDetailsParams>(
    client,
    'VideoLibrary.GetMovieDetails',
    params,
    options
  );
}

export function getVideoLibraryTvShows(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryTvShowsParams = {},
  options?: KodiHttpCallOptions
): Promise<VideoLibraryTvShowsResult> {
  return callKodi<VideoLibraryTvShowsResult, VideoLibraryTvShowsParams>(
    client,
    'VideoLibrary.GetTVShows',
    withDefaultProperties(params, DEFAULT_VIDEO_LIBRARY_TV_SHOW_PROPERTIES),
    options
  );
}

export function getVideoLibraryTvShowDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryTvShowDetailsParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibraryTvShowDetailsResult> {
  return callKodi<VideoLibraryTvShowDetailsResult, VideoLibraryTvShowDetailsParams>(
    client,
    'VideoLibrary.GetTVShowDetails',
    withDefaultProperties(params, DEFAULT_VIDEO_LIBRARY_TV_SHOW_PROPERTIES),
    options
  );
}

export function getVideoLibrarySeasons(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySeasonsParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibrarySeasonsResult> {
  return callKodi<VideoLibrarySeasonsResult, VideoLibrarySeasonsParams>(
    client,
    'VideoLibrary.GetSeasons',
    params,
    options
  );
}

export function getVideoLibrarySeasonDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibrarySeasonDetailsParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibrarySeasonDetailsResult> {
  return callKodi<VideoLibrarySeasonDetailsResult, VideoLibrarySeasonDetailsParams>(
    client,
    'VideoLibrary.GetSeasonDetails',
    params,
    options
  );
}

export function getVideoLibraryEpisodes(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryEpisodesParams = {},
  options?: KodiHttpCallOptions
): Promise<VideoLibraryEpisodesResult> {
  return callKodi<VideoLibraryEpisodesResult, VideoLibraryEpisodesParams>(
    client,
    'VideoLibrary.GetEpisodes',
    params,
    options
  );
}

export function getVideoLibraryMusicVideos(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryMusicVideosParams = {},
  options?: KodiHttpCallOptions
): Promise<VideoLibraryMusicVideosResult> {
  return callKodi<VideoLibraryMusicVideosResult, VideoLibraryMusicVideosParams>(
    client,
    'VideoLibrary.GetMusicVideos',
    params,
    options
  );
}

export function getVideoLibraryMusicVideoDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryMusicVideoDetailsParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibraryMusicVideoDetailsResult> {
  return callKodi<VideoLibraryMusicVideoDetailsResult, VideoLibraryMusicVideoDetailsParams>(
    client,
    'VideoLibrary.GetMusicVideoDetails',
    params,
    options
  );
}

export function getVideoLibraryEpisodeDetails(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryEpisodeDetailsParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibraryEpisodeDetailsResult> {
  return callKodi<VideoLibraryEpisodeDetailsResult, VideoLibraryEpisodeDetailsParams>(
    client,
    'VideoLibrary.GetEpisodeDetails',
    params,
    options
  );
}

export function getVideoLibraryAvailableArt(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryAvailableArtParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibraryAvailableArtResult> {
  return callKodi<VideoLibraryAvailableArtResult, VideoLibraryAvailableArtParams>(
    client,
    'VideoLibrary.GetAvailableArt',
    params,
    options
  );
}

export function getVideoLibraryAvailableArtTypes(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryAvailableArtTypesParams,
  options?: KodiHttpCallOptions
): Promise<VideoLibraryAvailableArtTypesResult> {
  return callKodi<VideoLibraryAvailableArtTypesResult, VideoLibraryAvailableArtTypesParams>(
    client,
    'VideoLibrary.GetAvailableArtTypes',
    params,
    options
  );
}

export function refreshVideoLibraryTvShow(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryRefreshTvShowParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibraryRefreshTvShowParams>(
    client,
    'VideoLibrary.RefreshTVShow',
    params,
    options
  );
}

export function refreshVideoLibraryMovie(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryRefreshMovieParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibraryRefreshMovieParams>(
    client,
    'VideoLibrary.RefreshMovie',
    params,
    options
  );
}

export function refreshVideoLibraryEpisode(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryRefreshEpisodeParams,
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibraryRefreshEpisodeParams>(
    client,
    'VideoLibrary.RefreshEpisode',
    params,
    options
  );
}

export function scanVideoLibrary(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryScanParams = {},
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibraryScanParams>(
    client,
    'VideoLibrary.Scan',
    params,
    options
  );
}

export function cleanVideoLibrary(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryCleanParams = { showdialogs: false },
  options?: KodiHttpCallOptions
): Promise<KodiLibraryWriteResult> {
  return callKodi<KodiLibraryWriteResult, VideoLibraryCleanParams>(
    client,
    'VideoLibrary.Clean',
    params,
    options
  );
}
