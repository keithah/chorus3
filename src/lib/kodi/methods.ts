import type { KodiHttpCallOptions, KodiJsonRpcHttpClient, JsonRpcParams } from './jsonRpc';

export type KodiPropertiesRequest<TProperty extends string> = {
  properties: readonly TProperty[];
};

export interface KodiVersion {
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
  tag?: string;
  tagversion?: string;
  [key: string]: unknown;
}

export type JsonRpcVersionResult = {
  version: string | KodiVersion;
};

export type ApplicationPropertyName = 'muted' | 'name' | 'version' | 'volume';

export type ApplicationPropertiesResult = Partial<{
  muted: boolean;
  name: string;
  version: KodiVersion;
  volume: number;
}> &
  Record<string, unknown>;

export type SystemPropertyName = 'canhibernate' | 'canreboot' | 'canshutdown' | 'cansuspend';

export type SystemPropertiesResult = Partial<Record<SystemPropertyName, boolean>> &
  Record<string, unknown>;

export type PlayerType = 'audio' | 'picture' | 'video';

export interface ActivePlayer {
  playerid: number;
  type: PlayerType | string;
}

export interface KodiTime {
  hours?: number;
  milliseconds?: number;
  minutes?: number;
  seconds?: number;
  [key: string]: unknown;
}

export interface PlayerAudioStream {
  bitrate?: number;
  channels?: number;
  codec?: string;
  index?: number;
  language?: string;
  name?: string;
  [key: string]: unknown;
}

export interface PlayerSubtitleStream {
  index?: number;
  language?: string;
  name?: string;
  [key: string]: unknown;
}

export interface PlayerVideoStream {
  codec?: string;
  height?: number;
  index?: number;
  language?: string;
  name?: string;
  width?: number;
  [key: string]: unknown;
}

export type PlayerPropertyName =
  | 'audiostreams'
  | 'cachepercentage'
  | 'canchangespeed'
  | 'canmove'
  | 'canrepeat'
  | 'canrotate'
  | 'canseek'
  | 'canshuffle'
  | 'canzoom'
  | 'currentaudiostream'
  | 'currentsubtitle'
  | 'currentvideostream'
  | 'live'
  | 'partymode'
  | 'percentage'
  | 'playlistid'
  | 'position'
  | 'repeat'
  | 'shuffled'
  | 'speed'
  | 'subtitleenabled'
  | 'subtitles'
  | 'time'
  | 'totaltime'
  | 'type'
  | 'videostreams';

export type PlayerPropertiesParams = KodiPropertiesRequest<PlayerPropertyName> & {
  playerid: number;
};

export type PlayerPropertiesResult = Partial<{
  audiostreams: PlayerAudioStream[];
  cachepercentage: number;
  canchangespeed: boolean;
  canmove: boolean;
  canrepeat: boolean;
  canrotate: boolean;
  canseek: boolean;
  canshuffle: boolean;
  canzoom: boolean;
  currentaudiostream: PlayerAudioStream;
  currentsubtitle: PlayerSubtitleStream;
  currentvideostream: PlayerVideoStream;
  live: boolean;
  partymode: boolean;
  percentage: number;
  playlistid: number;
  position: number;
  repeat: string;
  shuffled: boolean;
  speed: number;
  subtitleenabled: boolean;
  subtitles: PlayerSubtitleStream[];
  time: KodiTime;
  totaltime: KodiTime;
  type: PlayerType | string;
  videostreams: PlayerVideoStream[];
}> &
  Record<string, unknown>;

export type PlayerItemPropertyName =
  | 'album'
  | 'albumartist'
  | 'artist'
  | 'cast'
  | 'channel'
  | 'channeltype'
  | 'dateadded'
  | 'description'
  | 'director'
  | 'duration'
  | 'episode'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'id'
  | 'imdbnumber'
  | 'label'
  | 'lastplayed'
  | 'lyrics'
  | 'movieid'
  | 'mpaa'
  | 'originaltitle'
  | 'plot'
  | 'plotoutline'
  | 'playcount'
  | 'premiered'
  | 'rating'
  | 'runtime'
  | 'season'
  | 'showtitle'
  | 'streamdetails'
  | 'studio'
  | 'tagline'
  | 'thumbnail'
  | 'title'
  | 'track'
  | 'tvshowid'
  | 'type'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'writer'
  | 'year';

export type PlayerItemParams = KodiPropertiesRequest<PlayerItemPropertyName> & {
  playerid: number;
};

export type PlayerItem = Partial<{
  album: string;
  albumartist: string[];
  artist: string[];
  cast: unknown[];
  channel: string;
  channeltype: string;
  dateadded: string;
  description: string;
  director: string[];
  duration: number;
  episode: number;
  fanart: string;
  file: string;
  genre: string[];
  id: number;
  imdbnumber: string;
  label: string;
  lastplayed: string;
  lyrics: string;
  movieid: number;
  mpaa: string;
  originaltitle: string;
  plot: string;
  plotoutline: string;
  playcount: number;
  premiered: string;
  rating: number;
  runtime: number;
  season: number;
  showtitle: string;
  streamdetails: unknown;
  studio: string[];
  tagline: string;
  thumbnail: string;
  title: string;
  track: number;
  tvshowid: number;
  type: string;
  uniqueid: Record<string, unknown>;
  userrating: number;
  votes: string;
  writer: string[];
  year: number;
}> &
  Record<string, unknown>;

export interface PlayerItemResult {
  item?: PlayerItem;
  [key: string]: unknown;
}

export type FileMediaType = 'files' | 'music' | 'pictures' | 'programs' | 'video';

export interface FileSource {
  file: string;
  label: string;
  [key: string]: unknown;
}

export interface FileSourcesResult {
  sources?: FileSource[];
  [key: string]: unknown;
}

export interface PrepareFileDownloadResult {
  details?: unknown;
  mode?: string;
  protocol?: string;
  [key: string]: unknown;
}

export interface KodiLimits {
  start?: number;
  end?: number;
  total?: number;
  [key: string]: unknown;
}

export interface KodiListParams<TProperty extends string = string> {
  properties?: readonly TProperty[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
  filter?: unknown;
  [key: string]: unknown;
}

export type AudioLibraryArtistPropertyName =
  | 'born'
  | 'compilationartist'
  | 'description'
  | 'died'
  | 'disambiguation'
  | 'fanart'
  | 'formed'
  | 'genre'
  | 'instrument'
  | 'isalbumartist'
  | 'mood'
  | 'musicbrainzartistid'
  | 'roles'
  | 'songgenres'
  | 'style'
  | 'thumbnail'
  | 'yearsactive';

export type AudioLibraryAlbumPropertyName =
  | 'albumduration'
  | 'albumlabel'
  | 'albumstatus'
  | 'artist'
  | 'artistid'
  | 'compilation'
  | 'dateadded'
  | 'description'
  | 'displayartist'
  | 'fanart'
  | 'genre'
  | 'isboxset'
  | 'lastplayed'
  | 'mood'
  | 'musicbrainzalbumartistid'
  | 'musicbrainzalbumid'
  | 'playcount'
  | 'rating'
  | 'releasetype'
  | 'songgenres'
  | 'style'
  | 'theme'
  | 'thumbnail'
  | 'title'
  | 'type'
  | 'userrating'
  | 'votes'
  | 'year';

export type AudioLibrarySongPropertyName =
  | 'album'
  | 'albumartist'
  | 'albumartistid'
  | 'albumid'
  | 'artist'
  | 'artistid'
  | 'bitrate'
  | 'comment'
  | 'contributors'
  | 'dateadded'
  | 'disc'
  | 'displayartist'
  | 'duration'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'lastplayed'
  | 'lyrics'
  | 'mood'
  | 'musicbrainzartistid'
  | 'musicbrainztrackid'
  | 'playcount'
  | 'rating'
  | 'samplerate'
  | 'thumbnail'
  | 'title'
  | 'track'
  | 'userrating'
  | 'votes'
  | 'year';

export type VideoLibraryMoviePropertyName =
  | 'art'
  | 'cast'
  | 'country'
  | 'dateadded'
  | 'director'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'imdbnumber'
  | 'lastplayed'
  | 'mpaa'
  | 'originaltitle'
  | 'playcount'
  | 'plot'
  | 'plotoutline'
  | 'premiered'
  | 'rating'
  | 'resume'
  | 'runtime'
  | 'set'
  | 'sorttitle'
  | 'streamdetails'
  | 'studio'
  | 'tag'
  | 'tagline'
  | 'thumbnail'
  | 'title'
  | 'trailer'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'writer'
  | 'year';

export type VideoLibraryTvShowPropertyName =
  | 'art'
  | 'cast'
  | 'dateadded'
  | 'episode'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'imdbnumber'
  | 'lastplayed'
  | 'mpaa'
  | 'originaltitle'
  | 'playcount'
  | 'plot'
  | 'premiered'
  | 'rating'
  | 'season'
  | 'sorttitle'
  | 'studio'
  | 'tag'
  | 'thumbnail'
  | 'title'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'watchedepisodes'
  | 'year';

export type VideoLibraryEpisodePropertyName =
  | 'art'
  | 'cast'
  | 'dateadded'
  | 'director'
  | 'episode'
  | 'fanart'
  | 'file'
  | 'firstaired'
  | 'lastplayed'
  | 'plot'
  | 'playcount'
  | 'rating'
  | 'resume'
  | 'runtime'
  | 'season'
  | 'showtitle'
  | 'streamdetails'
  | 'thumbnail'
  | 'title'
  | 'tvshowid'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'writer';

export interface LibraryItem {
  label: string;
  [key: string]: unknown;
}

export interface AudioLibraryArtist extends LibraryItem {
  artistid: number;
}

export interface AudioLibraryAlbum extends LibraryItem {
  albumid: number;
}

export interface AudioLibrarySong extends LibraryItem {
  songid: number;
}

export interface VideoLibraryMovie extends LibraryItem {
  movieid: number;
}

export interface VideoLibraryTvShow extends LibraryItem {
  tvshowid: number;
}

export interface VideoLibraryEpisode extends LibraryItem {
  episodeid: number;
}

export interface AudioLibraryArtistsResult {
  artists?: AudioLibraryArtist[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface AudioLibraryAlbumsResult {
  albums?: AudioLibraryAlbum[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface AudioLibrarySongsResult {
  songs?: AudioLibrarySong[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryMoviesResult {
  movies?: VideoLibraryMovie[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryTvShowsResult {
  tvshows?: VideoLibraryTvShow[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryEpisodesResult {
  episodes?: VideoLibraryEpisode[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type AudioLibraryArtistsParams = KodiListParams<AudioLibraryArtistPropertyName>;
export type AudioLibraryAlbumsParams = KodiListParams<AudioLibraryAlbumPropertyName>;
export type AudioLibrarySongsParams = KodiListParams<AudioLibrarySongPropertyName>;
export type VideoLibraryMoviesParams = KodiListParams<VideoLibraryMoviePropertyName>;
export type VideoLibraryTvShowsParams = KodiListParams<VideoLibraryTvShowPropertyName>;
export type VideoLibraryEpisodesParams = KodiListParams<VideoLibraryEpisodePropertyName>;

export interface KodiHttpConnectionTestResult {
  ping: string;
  jsonRpcVersion: JsonRpcVersionResult;
  application: ApplicationPropertiesResult;
}

function callKodi<TResult, TParams extends JsonRpcParams = JsonRpcParams>(
  client: KodiJsonRpcHttpClient,
  method: string,
  params?: TParams,
  options?: KodiHttpCallOptions
): Promise<TResult> {
  return client.call<TResult, TParams>(method, params, options);
}

export function pingKodi(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<string> {
  return callKodi<string>(client, 'JSONRPC.Ping', undefined, options);
}

export function getJsonRpcVersion(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<JsonRpcVersionResult> {
  return callKodi<JsonRpcVersionResult>(client, 'JSONRPC.Version', undefined, options);
}

export function getApplicationProperties(
  client: KodiJsonRpcHttpClient,
  properties: readonly ApplicationPropertyName[],
  options?: KodiHttpCallOptions
): Promise<ApplicationPropertiesResult> {
  return callKodi<ApplicationPropertiesResult, KodiPropertiesRequest<ApplicationPropertyName>>(
    client,
    'Application.GetProperties',
    { properties },
    options
  );
}

export function getSystemProperties(
  client: KodiJsonRpcHttpClient,
  properties: readonly SystemPropertyName[],
  options?: KodiHttpCallOptions
): Promise<SystemPropertiesResult> {
  return callKodi<SystemPropertiesResult, KodiPropertiesRequest<SystemPropertyName>>(
    client,
    'System.GetProperties',
    { properties },
    options
  );
}

export function getActivePlayers(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<ActivePlayer[]> {
  return callKodi<ActivePlayer[]>(client, 'Player.GetActivePlayers', undefined, options);
}

export function getPlayerProperties(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  properties: readonly PlayerPropertyName[],
  options?: KodiHttpCallOptions
): Promise<PlayerPropertiesResult> {
  return callKodi<PlayerPropertiesResult, PlayerPropertiesParams>(
    client,
    'Player.GetProperties',
    { playerid, properties },
    options
  );
}

export function getPlayerItem(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  properties: readonly PlayerItemPropertyName[],
  options?: KodiHttpCallOptions
): Promise<PlayerItemResult> {
  return callKodi<PlayerItemResult, PlayerItemParams>(
    client,
    'Player.GetItem',
    { playerid, properties },
    options
  );
}

export function getFileSources(
  client: KodiJsonRpcHttpClient,
  media: FileMediaType,
  options?: KodiHttpCallOptions
): Promise<FileSourcesResult> {
  return callKodi<FileSourcesResult, { media: FileMediaType }>(
    client,
    'Files.GetSources',
    { media },
    options
  );
}

export function prepareFileDownload(
  client: KodiJsonRpcHttpClient,
  path: string,
  options?: KodiHttpCallOptions
): Promise<PrepareFileDownloadResult> {
  return callKodi<PrepareFileDownloadResult, { path: string }>(
    client,
    'Files.PrepareDownload',
    { path },
    options
  );
}

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

export function getVideoLibraryTvShows(
  client: KodiJsonRpcHttpClient,
  params: VideoLibraryTvShowsParams = {},
  options?: KodiHttpCallOptions
): Promise<VideoLibraryTvShowsResult> {
  return callKodi<VideoLibraryTvShowsResult, VideoLibraryTvShowsParams>(
    client,
    'VideoLibrary.GetTVShows',
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

export async function testKodiHttpConnection(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<KodiHttpConnectionTestResult> {
  const ping = await pingKodi(client, options);
  const jsonRpcVersion = await getJsonRpcVersion(client, options);
  const application = await getApplicationProperties(
    client,
    ['name', 'version', 'volume', 'muted'],
    options
  );

  return { ping, jsonRpcVersion, application };
}
