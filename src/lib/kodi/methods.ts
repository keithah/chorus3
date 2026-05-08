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

export type JsonRpcIntrospectionParams = Record<string, unknown> & {
  filter?: Record<string, unknown>;
  getdescriptions?: boolean;
  getmetadata?: boolean;
};

export type JsonRpcIntrospectionResult = Record<string, unknown>;

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

export type PvrChannelPropertyName =
  | 'thumbnail'
  | 'channeltype'
  | 'hidden'
  | 'locked'
  | 'channel'
  | 'lastplayed'
  | 'broadcastnow'
  | 'isrecording';

export type PvrRecordingPropertyName =
  | 'channel'
  | 'file'
  | 'title'
  | 'resume'
  | 'plot'
  | 'genre'
  | 'playcount'
  | 'starttime'
  | 'endtime'
  | 'runtime'
  | 'icon'
  | 'art'
  | 'streamurl'
  | 'directory'
  | 'radio'
  | 'isdeleted'
  | 'channeluid';

export type PvrBroadcastPropertyName =
  | 'title'
  | 'runtime'
  | 'starttime'
  | 'endtime'
  | 'genre'
  | 'progress'
  | 'plot'
  | 'plotoutline'
  | 'progresspercentage'
  | 'episodename'
  | 'episodenum'
  | 'episodepart'
  | 'firstaired'
  | 'hastimer'
  | 'isactive'
  | 'parentalrating'
  | 'wasactive'
  | 'thumbnail'
  | 'rating'
  | 'originaltitle'
  | 'cast'
  | 'director'
  | 'writer'
  | 'year'
  | 'imdbnumber'
  | 'hastimerrule'
  | 'hasrecording'
  | 'recording'
  | 'isseries';

export interface PvrChannel {
  channelid: number;
  label?: string;
  [key: string]: unknown;
}

export interface PvrRecording {
  recordingid: number;
  label?: string;
  [key: string]: unknown;
}

export interface PvrBroadcast {
  broadcastid: number;
  label?: string;
  [key: string]: unknown;
}

export type PvrRecordParams = {
  channel: number | 'current';
  record?: boolean | 'toggle';
};

export type PvrTimerBroadcastParams = {
  broadcastid: number;
  timerrule?: boolean;
};

export type PvrDeleteTimerParams = {
  timerid: number;
};

export type PvrGetChannelsParams = {
  channelgroupid: number | 'alltv' | 'allradio';
  properties?: readonly PvrChannelPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
};

export interface PvrGetChannelsResult {
  channels?: PvrChannel[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type PvrGetChannelDetailsParams = {
  channelid: number;
  properties?: readonly PvrChannelPropertyName[];
};

export interface PvrGetChannelDetailsResult {
  channeldetails?: PvrChannel;
  [key: string]: unknown;
}

export type PvrGetRecordingsParams = {
  properties?: readonly PvrRecordingPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
};

export interface PvrGetRecordingsResult {
  recordings?: PvrRecording[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type PvrGetRecordingDetailsParams = {
  recordingid: number;
  properties?: readonly PvrRecordingPropertyName[];
};

export interface PvrGetRecordingDetailsResult {
  recordingdetails?: PvrRecording;
  [key: string]: unknown;
}

export type PvrGetBroadcastsParams = {
  channelid: number;
  properties?: readonly PvrBroadcastPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
};

export interface PvrGetBroadcastsResult {
  broadcasts?: PvrBroadcast[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type SettingsLevel = 'basic' | 'standard' | 'advanced' | 'expert';
export type SettingsSettingValue = string | number | boolean | null;
export type SettingsGetSectionsParams = Record<string, unknown> & {
  level?: SettingsLevel;
};
export type SettingsGetCategoriesParams = Record<string, unknown> & {
  section?: string;
  level?: SettingsLevel;
};
export type SettingsGetSettingsParams = Record<string, unknown> & {
  category?: string;
  level?: SettingsLevel;
};
export type SettingsSetSettingValueParams = Record<string, unknown> & {
  setting: string;
  value: SettingsSettingValue;
};
export type SettingsSetSettingValueResult = 'OK';

export type AddonEnabledFilter = boolean | 'all';
export type AddonInstalledFilter = boolean | 'all';
export type AddonSetEnabledValue = boolean | 'toggle';
export type AddonPropertyName =
  | 'name'
  | 'version'
  | 'summary'
  | 'description'
  | 'path'
  | 'author'
  | 'type'
  | 'thumbnail'
  | 'disclaimer'
  | 'fanart'
  | 'dependencies'
  | 'broken'
  | 'extrainfo'
  | 'rating'
  | 'enabled'
  | 'installed';

export interface AddonSummary {
  addonid: string;
  type?: string;
  name?: string;
  version?: string;
  summary?: string;
  description?: string;
  path?: string;
  author?: string;
  thumbnail?: string;
  disclaimer?: string;
  fanart?: string;
  dependencies?: unknown;
  broken?: string | boolean;
  extrainfo?: unknown;
  rating?: number;
  enabled?: boolean;
  installed?: boolean;
  [key: string]: unknown;
}

export type AddonDetail = AddonSummary;

export type AddonsGetAddonsParams = Record<string, unknown> & {
  type?: string;
  content?: string;
  enabled?: AddonEnabledFilter;
  installed?: AddonInstalledFilter;
  properties?: readonly AddonPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
};

export interface AddonsGetAddonsResult {
  addons?: AddonSummary[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type AddonsGetAddonDetailsParams = Record<string, unknown> & {
  addonid: string;
  properties?: readonly AddonPropertyName[];
};

export interface AddonsGetAddonDetailsResult {
  addondetails?: AddonDetail;
  [key: string]: unknown;
}

export type AddonsSetAddonEnabledParams = Record<string, unknown> & {
  addonid: string;
  enabled: AddonSetEnabledValue;
};

export type AddonsSetAddonEnabledResult = 'OK';

export type AddonsExecuteAddonParams = Record<string, unknown> & {
  addonid: string;
  params?: Record<string, string> | readonly string[];
  wait?: boolean;
};

export type AddonsExecuteAddonResult = 'OK';

export interface KodiSettingsSection {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

export interface KodiSettingsCategory {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

export interface KodiSettingsSetting {
  id?: string;
  label?: string;
  type?: string;
  value?: unknown;
  default?: unknown;
  options?: unknown;
  [key: string]: unknown;
}

export interface SettingsGetSectionsResult {
  sections?: KodiSettingsSection[];
  [key: string]: unknown;
}

export interface SettingsGetCategoriesResult {
  categories?: KodiSettingsCategory[];
  [key: string]: unknown;
}

export interface SettingsGetSettingsResult {
  settings?: KodiSettingsSetting[];
  [key: string]: unknown;
}

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

export type PlaylistItemPropertyName = PlayerItemPropertyName;

export type PlaylistItem = PlayerItem;

export type PlaylistGetItemsParams = {
  playlistid: number;
  properties?: readonly PlaylistItemPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
};

export interface PlaylistItemsResult {
  items?: PlaylistItem[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type PlaylistRemoveParams = {
  playlistid: number;
  position: number;
};

export type PlaylistClearParams = {
  playlistid: number;
};

export type PlaylistSwapParams = {
  playlistid: number;
  position1: number;
  position2: number;
};

export type PlayerCommandResult = 'OK';

export const REMOTE_INPUT_COMMANDS = [
  'left',
  'up',
  'right',
  'down',
  'back',
  'select',
  'contextMenu',
  'info',
  'home'
] as const;
export const REMOTE_INPUT_ACTIONS = [
  'showsubtitles',
  'close',
  'fullscreen',
  'osd',
  'screenshot'
] as const;

export type RemoteInputCommand = (typeof REMOTE_INPUT_COMMANDS)[number];
export type RemoteInputAction = (typeof REMOTE_INPUT_ACTIONS)[number];

const REMOTE_INPUT_METHODS: Record<RemoteInputCommand, string> = {
  left: 'Input.Left',
  up: 'Input.Up',
  right: 'Input.Right',
  down: 'Input.Down',
  back: 'Input.Back',
  select: 'Input.Select',
  contextMenu: 'Input.ContextMenu',
  info: 'Input.Info',
  home: 'Input.Home'
};

export type KodiMusicLibraryItem =
  | { songid: number; albumid?: never; artistid?: never; playlistid?: never; file?: never }
  | { albumid: number; songid?: never; artistid?: never; playlistid?: never; file?: never }
  | { artistid: number; songid?: never; albumid?: never; playlistid?: never; file?: never };

export type KodiMovieLibraryItem = {
  movieid: number;
  songid?: never;
  albumid?: never;
  artistid?: never;
  episodeid?: never;
  playlistid?: never;
  file?: never;
};

export type KodiEpisodeLibraryItem = {
  episodeid: number;
  movieid?: never;
  musicvideoid?: never;
  songid?: never;
  albumid?: never;
  artistid?: never;
  playlistid?: never;
  file?: never;
};

export type KodiMusicVideoLibraryItem = {
  musicvideoid: number;
  movieid?: never;
  episodeid?: never;
  songid?: never;
  albumid?: never;
  artistid?: never;
  playlistid?: never;
  channelid?: never;
  file?: never;
};

export type KodiPvrChannelItem = {
  channelid: number;
  movieid?: never;
  episodeid?: never;
  musicvideoid?: never;
  songid?: never;
  albumid?: never;
  artistid?: never;
  playlistid?: never;
  file?: never;
};

export type PlayerOpenItem =
  | KodiMusicLibraryItem
  | KodiMusicVideoLibraryItem
  | KodiPvrChannelItem
  | {
      playlistid: number;
      songid?: never;
      albumid?: never;
      artistid?: never;
      channelid?: never;
      file?: never;
    };

export type PlayerOpenParams = {
  item: PlayerOpenItem;
};

export type PlayerOpenMovieParams = {
  item: KodiMovieLibraryItem;
  options?: {
    resume?: boolean;
  };
};

export type PlayerOpenEpisodeParams = {
  item: KodiEpisodeLibraryItem;
  options?: {
    resume?: boolean;
  };
};

export type PlaylistAddParams = {
  playlistid: number;
  item: KodiMusicLibraryItem;
};

export type PlaylistInsertItem =
  | KodiMusicLibraryItem
  | KodiMovieLibraryItem
  | KodiEpisodeLibraryItem
  | KodiMusicVideoLibraryItem
  | KodiFileItem;

export type PlaylistInsertParams = {
  playlistid: number;
  position: number;
  item: PlaylistInsertItem;
};

export type PlaylistAddMovieParams = {
  playlistid: number;
  item: KodiMovieLibraryItem;
};

export type PlaylistAddEpisodeParams = {
  playlistid: number;
  item: KodiEpisodeLibraryItem;
};

export type PlaylistAddMusicVideoParams = {
  playlistid: number;
  item: KodiMusicVideoLibraryItem;
};

export type KodiFileItem =
  | {
      file: string;
      directory?: never;
      songid?: never;
      albumid?: never;
      artistid?: never;
      playlistid?: never;
    }
  | {
      directory: string;
      file?: never;
      songid?: never;
      albumid?: never;
      artistid?: never;
      playlistid?: never;
    };

export type KodiPlaylistFileItem = {
  file: string;
  songid?: never;
  albumid?: never;
  artistid?: never;
  playlistid?: never;
};

export type PlayerOpenFileParams = {
  item: KodiFileItem;
};

export type PlayerOpenPlaylistFileParams = {
  item: KodiPlaylistFileItem;
};

export type FilePlaylistAddParams = {
  playlistid: number;
  item: KodiFileItem;
};

export type PlaylistFileAddParams = {
  playlistid: number;
  item: KodiPlaylistFileItem;
};

export type KodiLibraryWriteResult = 'OK';

export type AudioLibrarySetAlbumDetailsParams = {
  albumid: number;
  title?: string;
  artist?: string | readonly string[];
  description?: string;
  genre?: string | readonly string[];
  year?: number;
  rating?: number;
  userrating?: number;
  art?: Record<string, string>;
};

export type AudioLibrarySetArtistDetailsParams = {
  artistid: number;
  artist?: string;
  instrument?: string | readonly string[];
  style?: string | readonly string[];
  mood?: string | readonly string[];
  born?: string;
  formed?: string;
  description?: string;
  genre?: string | readonly string[];
  died?: string;
  disbanded?: string;
  yearsactive?: string | readonly string[];
  art?: Record<string, string>;
};

export type AudioLibrarySetSongDetailsParams = {
  songid: number;
  playcount?: number;
  lastplayed?: string;
};

export type AudioLibraryScanParams = {
  directory?: string;
};

export type AudioLibraryCleanParams = {
  showdialogs?: boolean;
};

export type VideoResumePosition = {
  position: number;
  total: number;
};

export type VideoLibrarySetMovieDetailsParams = {
  movieid: number;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoResumePosition;
};

export type VideoLibrarySetTvShowDetailsParams = {
  tvshowid: number;
  playcount?: number;
  lastplayed?: string;
  title?: string;
  userrating?: number;
  art?: Record<string, string>;
};

export type VideoLibrarySetEpisodeDetailsParams = {
  episodeid: number;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoResumePosition;
};

export type VideoLibrarySetMusicVideoDetailsParams = {
  musicvideoid: number;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoResumePosition;
  title?: string;
  artist?: string | readonly string[];
  album?: string;
  genre?: string | readonly string[];
  track?: number;
  year?: number;
  userrating?: number;
  art?: Record<string, string>;
};

export type VideoLibrarySetSeasonDetailsParams = {
  tvshowid: number;
  season: number;
  title?: string;
  userrating?: number;
  art?: Record<string, string>;
};

export type PlayerPlayPauseParams = {
  playerid: number;
};

export type PlayerPlayPauseResult = Partial<{
  speed: number;
}> &
  Record<string, unknown>;

export type PlayerStopParams = {
  playerid: number;
};

export type PlayerGoToTarget = 'previous' | 'next' | number;

export type PlayerGoToParams = {
  playerid: number;
  to: PlayerGoToTarget;
};

export type PlayerSeekStep = 'smallforward' | 'smallbackward' | 'bigforward' | 'bigbackward';

export type PlayerSeekValue =
  | { percentage: number }
  | { time: KodiTime }
  | { step: PlayerSeekStep }
  | { seconds: number };

export type PlayerSeekParams = {
  playerid: number;
  value: PlayerSeekValue;
};

export type PlayerSeekResult = Partial<{
  percentage: number;
  time: KodiTime;
  totaltime: KodiTime;
}> &
  Record<string, unknown>;

export type ApplicationVolumeValue = number;

export type ApplicationSetVolumeParams = {
  volume: ApplicationVolumeValue;
};

export type ApplicationMuteValue = boolean | 'toggle';

export type ApplicationSetMuteParams = {
  mute: ApplicationMuteValue;
};

export type PlayerShuffleValue = boolean | 'toggle';

export type PlayerSetShuffleParams = {
  playerid: number;
  shuffle: PlayerShuffleValue;
};

export type PlayerPartyModeValue = boolean | 'toggle';

export type PlayerSetPartyModeParams = {
  playerid: number;
  partymode: PlayerPartyModeValue;
};

export type PlayerRepeatValue = 'off' | 'one' | 'all' | 'cycle';

export type PlayerSetRepeatParams = {
  playerid: number;
  repeat: PlayerRepeatValue;
};

export type PlayerAudioStreamValue = number | 'previous' | 'next';

export type PlayerSetAudioStreamParams = {
  playerid: number;
  stream: PlayerAudioStreamValue;
};

export type PlayerSubtitleValue = number | 'previous' | 'next' | 'off' | 'on';

export type PlayerSetSubtitleParams = {
  playerid: number;
  subtitle: PlayerSubtitleValue;
};

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

export type FileDirectoryPropertyName = PlayerItemPropertyName;

export type FileDirectoryParams = {
  directory: string;
  media?: FileMediaType;
  properties?: readonly FileDirectoryPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
};

export interface FileDirectoryEntry {
  file: string;
  filetype?: 'directory' | 'file' | string;
  label?: string;
  type?: string;
  [key: string]: unknown;
}

export interface FileDirectoryResult {
  files?: FileDirectoryEntry[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type FileDetailsParams = {
  file: string;
  media?: FileMediaType;
  properties?: readonly FileDirectoryPropertyName[];
};

export interface FileDetailsResult {
  filedetails?: FileDirectoryEntry;
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

export type AudioLibraryGenrePropertyName = 'thumbnail' | 'title';

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

export type VideoLibrarySeasonPropertyName =
  | 'art'
  | 'episode'
  | 'fanart'
  | 'playcount'
  | 'season'
  | 'showtitle'
  | 'thumbnail'
  | 'title'
  | 'tvshowid'
  | 'userrating'
  | 'watchedepisodes';

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

export type VideoLibraryMusicVideoPropertyName =
  | 'album'
  | 'art'
  | 'artist'
  | 'dateadded'
  | 'director'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'lastplayed'
  | 'playcount'
  | 'plot'
  | 'rating'
  | 'resume'
  | 'runtime'
  | 'streamdetails'
  | 'studio'
  | 'tag'
  | 'thumbnail'
  | 'title'
  | 'track'
  | 'userrating'
  | 'votes'
  | 'year';

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

export interface AudioLibraryGenre extends LibraryItem {
  genreid: number;
}

export interface VideoLibraryMovie extends LibraryItem {
  movieid: number;
}

export interface VideoLibraryTvShow extends LibraryItem {
  tvshowid: number;
}

export interface VideoLibrarySeason extends LibraryItem {
  season: number;
  tvshowid?: number;
}

export interface VideoLibraryEpisode extends LibraryItem {
  episodeid: number;
}

export interface VideoLibraryMusicVideo extends LibraryItem {
  musicvideoid: number;
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

export interface AudioLibraryGenresResult {
  genres?: AudioLibraryGenre[];
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

export interface VideoLibraryTvShowDetailsResult {
  tvshowdetails?: VideoLibraryTvShow;
  [key: string]: unknown;
}

export interface VideoLibrarySeasonsResult {
  seasons?: VideoLibrarySeason[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibrarySeasonDetailsResult {
  seasondetails?: VideoLibrarySeason;
  [key: string]: unknown;
}

export interface VideoLibraryEpisodesResult {
  episodes?: VideoLibraryEpisode[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryEpisodeDetailsResult {
  episodedetails?: VideoLibraryEpisode;
  [key: string]: unknown;
}

export interface VideoLibraryMusicVideosResult {
  musicvideos?: VideoLibraryMusicVideo[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryMusicVideoDetailsResult {
  musicvideodetails?: VideoLibraryMusicVideo;
  [key: string]: unknown;
}

export type VideoLibraryAvailableArtMedia = 'movie' | 'tvshow' | 'season' | 'episode';

export type VideoLibraryAvailableArtParams = {
  media: VideoLibraryAvailableArtMedia;
  movieid?: number;
  tvshowid?: number;
  season?: number;
  episodeid?: number;
};

export interface VideoLibraryAvailableArtResult {
  availableart?: unknown;
  [key: string]: unknown;
}

export type VideoLibraryAvailableArtTypesParams = {
  media: VideoLibraryAvailableArtMedia;
};

export interface VideoLibraryAvailableArtTypesResult {
  availablearttypes?: unknown;
  [key: string]: unknown;
}

export type VideoLibraryRefreshTvShowParams = {
  tvshowid: number;
  ignorenfo?: boolean;
};

export type VideoLibraryRefreshMovieParams = {
  movieid: number;
  ignorenfo?: boolean;
};

export type VideoLibraryRefreshEpisodeParams = {
  episodeid: number;
  ignorenfo?: boolean;
};

export type VideoLibraryScanParams = {
  directory?: string;
};

export type VideoLibraryCleanParams = {
  showdialogs?: boolean;
  content?: 'movies' | 'tvshows' | 'musicvideos';
};

export type AudioLibraryArtistsParams = KodiListParams<AudioLibraryArtistPropertyName>;
export type AudioLibraryAlbumsParams = KodiListParams<AudioLibraryAlbumPropertyName>;
export type AudioLibrarySongsParams = KodiListParams<AudioLibrarySongPropertyName>;
export type AudioLibraryGenresParams = KodiListParams<AudioLibraryGenrePropertyName>;
export type VideoLibraryMoviesParams = KodiListParams<VideoLibraryMoviePropertyName>;
export type VideoLibraryMovieDetailsParams = {
  movieid: number;
  properties?: readonly VideoLibraryMoviePropertyName[];
};
export type VideoLibraryTvShowsParams = KodiListParams<VideoLibraryTvShowPropertyName>;
export type VideoLibraryTvShowDetailsParams = {
  tvshowid: number;
  properties?: readonly VideoLibraryTvShowPropertyName[];
};
export type VideoLibrarySeasonsParams = KodiListParams<VideoLibrarySeasonPropertyName> & {
  tvshowid: number;
};
export type VideoLibrarySeasonDetailsParams = {
  tvshowid: number;
  season: number;
  properties?: readonly VideoLibrarySeasonPropertyName[];
};
export type VideoLibraryEpisodesParams = KodiListParams<VideoLibraryEpisodePropertyName> & {
  tvshowid?: number;
  season?: number;
};
export type VideoLibraryEpisodeDetailsParams = {
  episodeid: number;
  properties?: readonly VideoLibraryEpisodePropertyName[];
};
export type VideoLibraryMusicVideosParams = KodiListParams<VideoLibraryMusicVideoPropertyName>;
export type VideoLibraryMusicVideoDetailsParams = {
  musicvideoid: number;
  properties?: readonly VideoLibraryMusicVideoPropertyName[];
};

export interface VideoLibraryMovieDetailsResult {
  moviedetails?: VideoLibraryMovie;
  [key: string]: unknown;
}

export interface KodiHttpConnectionTestResult {
  ping: string;
  jsonRpcVersion: JsonRpcVersionResult;
  application: ApplicationPropertiesResult;
}

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

function withDefaultProperties<
  TParams extends { properties?: readonly TProperty[] },
  TProperty extends string
>(
  params: TParams,
  properties: readonly TProperty[]
): TParams & { properties: readonly TProperty[] } {
  return params.properties
    ? (params as TParams & { properties: readonly TProperty[] })
    : { ...params, properties };
}

function callKodi<TResult, TParams extends JsonRpcParams = JsonRpcParams>(
  client: KodiJsonRpcHttpClient,
  method: string,
  params?: TParams,
  options?: KodiHttpCallOptions
): Promise<TResult> {
  return client.call<TResult, TParams>(method, params, options);
}

export function sendInputCommand(
  client: KodiJsonRpcHttpClient,
  command: RemoteInputCommand,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult>(client, REMOTE_INPUT_METHODS[command], undefined, options);
}

export function sendInputText(
  client: KodiJsonRpcHttpClient,
  text: string,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult>(client, 'Input.SendText', { text }, options);
}

export function executeInputAction(
  client: KodiJsonRpcHttpClient,
  action: RemoteInputAction,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult>(client, 'Input.ExecuteAction', { action }, options);
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

export function getJsonRpcIntrospection(
  client: KodiJsonRpcHttpClient,
  params?: JsonRpcIntrospectionParams,
  options?: KodiHttpCallOptions
): Promise<JsonRpcIntrospectionResult> {
  return callKodi<JsonRpcIntrospectionResult, JsonRpcIntrospectionParams>(
    client,
    'JSONRPC.Introspect',
    params,
    options
  );
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

export function getPvrChannels(
  client: KodiJsonRpcHttpClient,
  params: PvrGetChannelsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetChannelsResult> {
  return callKodi<PvrGetChannelsResult, PvrGetChannelsParams>(
    client,
    'PVR.GetChannels',
    params,
    options
  );
}

export function getPvrChannelDetails(
  client: KodiJsonRpcHttpClient,
  params: PvrGetChannelDetailsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetChannelDetailsResult> {
  return callKodi<PvrGetChannelDetailsResult, PvrGetChannelDetailsParams>(
    client,
    'PVR.GetChannelDetails',
    params,
    options
  );
}

export function getPvrBroadcasts(
  client: KodiJsonRpcHttpClient,
  params: PvrGetBroadcastsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetBroadcastsResult> {
  return callKodi<PvrGetBroadcastsResult, PvrGetBroadcastsParams>(
    client,
    'PVR.GetBroadcasts',
    params,
    options
  );
}

export function getPvrRecordings(
  client: KodiJsonRpcHttpClient,
  params: PvrGetRecordingsParams = {},
  options?: KodiHttpCallOptions
): Promise<PvrGetRecordingsResult> {
  return callKodi<PvrGetRecordingsResult, PvrGetRecordingsParams>(
    client,
    'PVR.GetRecordings',
    params,
    options
  );
}

export function getPvrRecordingDetails(
  client: KodiJsonRpcHttpClient,
  params: PvrGetRecordingDetailsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetRecordingDetailsResult> {
  return callKodi<PvrGetRecordingDetailsResult, PvrGetRecordingDetailsParams>(
    client,
    'PVR.GetRecordingDetails',
    params,
    options
  );
}

export function recordPvrChannel(
  client: KodiJsonRpcHttpClient,
  params: PvrRecordParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrRecordParams>(client, 'PVR.Record', params, options);
}

export function togglePvrTimer(
  client: KodiJsonRpcHttpClient,
  params: PvrTimerBroadcastParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrTimerBroadcastParams>(
    client,
    'PVR.ToggleTimer',
    params,
    options
  );
}

export function addPvrTimer(
  client: KodiJsonRpcHttpClient,
  params: PvrTimerBroadcastParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrTimerBroadcastParams>(
    client,
    'PVR.AddTimer',
    params,
    options
  );
}

export function deletePvrTimer(
  client: KodiJsonRpcHttpClient,
  params: PvrDeleteTimerParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrDeleteTimerParams>(
    client,
    'PVR.DeleteTimer',
    params,
    options
  );
}

export function getSettingsSections(
  client: KodiJsonRpcHttpClient,
  params: SettingsGetSectionsParams = {},
  options?: KodiHttpCallOptions
): Promise<SettingsGetSectionsResult> {
  return callKodi<SettingsGetSectionsResult, SettingsGetSectionsParams>(
    client,
    'Settings.GetSections',
    params,
    options
  );
}

export function getSettingsCategories(
  client: KodiJsonRpcHttpClient,
  params: SettingsGetCategoriesParams = {},
  options?: KodiHttpCallOptions
): Promise<SettingsGetCategoriesResult> {
  return callKodi<SettingsGetCategoriesResult, SettingsGetCategoriesParams>(
    client,
    'Settings.GetCategories',
    params,
    options
  );
}

export function getSettings(
  client: KodiJsonRpcHttpClient,
  params: SettingsGetSettingsParams = {},
  options?: KodiHttpCallOptions
): Promise<SettingsGetSettingsResult> {
  return callKodi<SettingsGetSettingsResult, SettingsGetSettingsParams>(
    client,
    'Settings.GetSettings',
    params,
    options
  );
}

export function setSettingValue(
  client: KodiJsonRpcHttpClient,
  params: SettingsSetSettingValueParams,
  options?: KodiHttpCallOptions
): Promise<SettingsSetSettingValueResult> {
  return callKodi<SettingsSetSettingValueResult, SettingsSetSettingValueParams>(
    client,
    'Settings.SetSettingValue',
    params,
    options
  );
}

export function getAddons(
  client: KodiJsonRpcHttpClient,
  params: AddonsGetAddonsParams = {},
  options?: KodiHttpCallOptions
): Promise<AddonsGetAddonsResult> {
  return callKodi<AddonsGetAddonsResult, AddonsGetAddonsParams>(
    client,
    'Addons.GetAddons',
    params,
    options
  );
}

export function getAddonDetails(
  client: KodiJsonRpcHttpClient,
  params: AddonsGetAddonDetailsParams,
  options?: KodiHttpCallOptions
): Promise<AddonsGetAddonDetailsResult> {
  return callKodi<AddonsGetAddonDetailsResult, AddonsGetAddonDetailsParams>(
    client,
    'Addons.GetAddonDetails',
    params,
    options
  );
}

export function setAddonEnabled(
  client: KodiJsonRpcHttpClient,
  params: AddonsSetAddonEnabledParams,
  options?: KodiHttpCallOptions
): Promise<AddonsSetAddonEnabledResult> {
  return callKodi<AddonsSetAddonEnabledResult, AddonsSetAddonEnabledParams>(
    client,
    'Addons.SetAddonEnabled',
    params,
    options
  );
}

export function executeAddon(
  client: KodiJsonRpcHttpClient,
  params: AddonsExecuteAddonParams,
  options?: KodiHttpCallOptions
): Promise<AddonsExecuteAddonResult> {
  return callKodi<AddonsExecuteAddonResult, AddonsExecuteAddonParams>(
    client,
    'Addons.ExecuteAddon',
    params,
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

export function getPlaylistItems(
  client: KodiJsonRpcHttpClient,
  params: PlaylistGetItemsParams,
  options?: KodiHttpCallOptions
): Promise<PlaylistItemsResult> {
  return callKodi<PlaylistItemsResult, PlaylistGetItemsParams>(
    client,
    'Playlist.GetItems',
    params,
    options
  );
}

export function openPlayer(
  client: KodiJsonRpcHttpClient,
  params: PlayerOpenParams,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerOpenParams>(client, 'Player.Open', params, options);
}

export function openPlayerItem(
  client: KodiJsonRpcHttpClient,
  item: PlayerOpenItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return openPlayer(client, { item }, options);
}

export function openPlayerMovieItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMovieLibraryItem,
  openOptions?: PlayerOpenMovieParams['options'],
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  const params: PlayerOpenMovieParams = openOptions ? { item, options: openOptions } : { item };
  return callKodi<PlayerCommandResult, PlayerOpenMovieParams>(
    client,
    'Player.Open',
    params,
    options
  );
}

export function openPlayerEpisodeItem(
  client: KodiJsonRpcHttpClient,
  item: KodiEpisodeLibraryItem,
  openOptions?: PlayerOpenEpisodeParams['options'],
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  const params: PlayerOpenEpisodeParams = openOptions ? { item, options: openOptions } : { item };
  return callKodi<PlayerCommandResult, PlayerOpenEpisodeParams>(
    client,
    'Player.Open',
    params,
    options
  );
}

export function openPlayerFile(
  client: KodiJsonRpcHttpClient,
  item: KodiFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerOpenFileParams>(
    client,
    'Player.Open',
    { item },
    options
  );
}

export function openPlayerPlaylistFile(
  client: KodiJsonRpcHttpClient,
  item: KodiPlaylistFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerOpenPlaylistFileParams>(
    client,
    'Player.Open',
    { item },
    options
  );
}

export function addPlaylistItem(
  client: KodiJsonRpcHttpClient,
  params: PlaylistAddParams,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddParams>(client, 'Playlist.Add', params, options);
}

export function insertPlaylistItem(
  client: KodiJsonRpcHttpClient,
  params: PlaylistInsertParams,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistInsertParams>(
    client,
    'Playlist.Insert',
    params,
    options
  );
}

export function addMusicPlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMusicLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return addPlaylistItem(client, { playlistid: 0, item }, options);
}

export function addMoviePlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMovieLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddMovieParams>(
    client,
    'Playlist.Add',
    { playlistid: 1, item },
    options
  );
}

export function addEpisodePlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiEpisodeLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddEpisodeParams>(
    client,
    'Playlist.Add',
    { playlistid: 1, item },
    options
  );
}

export function addMusicVideoPlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMusicVideoLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddMusicVideoParams>(
    client,
    'Playlist.Add',
    { playlistid: 1, item },
    options
  );
}

export function addFilePlaylistItem(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  item: KodiFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, FilePlaylistAddParams>(
    client,
    'Playlist.Add',
    { playlistid, item },
    options
  );
}

export function addPlaylistFileItem(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  item: KodiPlaylistFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistFileAddParams>(
    client,
    'Playlist.Add',
    { playlistid, item },
    options
  );
}

export function removePlaylistItem(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  position: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistRemoveParams>(
    client,
    'Playlist.Remove',
    { playlistid, position },
    options
  );
}

export function clearPlaylist(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistClearParams>(
    client,
    'Playlist.Clear',
    { playlistid },
    options
  );
}

export function swapPlaylistItems(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  position1: number,
  position2: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistSwapParams>(
    client,
    'Playlist.Swap',
    { playlistid, position1, position2 },
    options
  );
}

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

export function playPausePlayer(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  options?: KodiHttpCallOptions
): Promise<PlayerPlayPauseResult> {
  return callKodi<PlayerPlayPauseResult, PlayerPlayPauseParams>(
    client,
    'Player.PlayPause',
    { playerid },
    options
  );
}

export function stopPlayer(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerStopParams>(
    client,
    'Player.Stop',
    { playerid },
    options
  );
}

export function goToPlayerItem(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  to: PlayerGoToTarget,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerGoToParams>(
    client,
    'Player.GoTo',
    { playerid, to },
    options
  );
}

export function seekPlayer(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  value: PlayerSeekValue,
  options?: KodiHttpCallOptions
): Promise<PlayerSeekResult> {
  return callKodi<PlayerSeekResult, PlayerSeekParams>(
    client,
    'Player.Seek',
    { playerid, value },
    options
  );
}

export function setApplicationVolume(
  client: KodiJsonRpcHttpClient,
  volume: ApplicationVolumeValue,
  options?: KodiHttpCallOptions
): Promise<number> {
  return callKodi<number, ApplicationSetVolumeParams>(
    client,
    'Application.SetVolume',
    { volume },
    options
  );
}

export function setApplicationMute(
  client: KodiJsonRpcHttpClient,
  mute: ApplicationMuteValue,
  options?: KodiHttpCallOptions
): Promise<boolean> {
  return callKodi<boolean, ApplicationSetMuteParams>(
    client,
    'Application.SetMute',
    { mute },
    options
  );
}

export function setPlayerShuffle(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  shuffle: PlayerShuffleValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetShuffleParams>(
    client,
    'Player.SetShuffle',
    { playerid, shuffle },
    options
  );
}

export function setPlayerPartyMode(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  partymode: PlayerPartyModeValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetPartyModeParams>(
    client,
    'Player.SetPartymode',
    { playerid, partymode },
    options
  );
}

export function setPlayerRepeat(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  repeat: PlayerRepeatValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetRepeatParams>(
    client,
    'Player.SetRepeat',
    { playerid, repeat },
    options
  );
}

export function setPlayerAudioStream(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  stream: PlayerAudioStreamValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetAudioStreamParams>(
    client,
    'Player.SetAudioStream',
    { playerid, stream },
    options
  );
}

export function setPlayerSubtitle(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  subtitle: PlayerSubtitleValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetSubtitleParams>(
    client,
    'Player.SetSubtitle',
    { playerid, subtitle },
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

export function getFileDirectory(
  client: KodiJsonRpcHttpClient,
  params: FileDirectoryParams,
  options?: KodiHttpCallOptions
): Promise<FileDirectoryResult> {
  return callKodi<FileDirectoryResult, FileDirectoryParams>(
    client,
    'Files.GetDirectory',
    params,
    options
  );
}

export function getFileDetails(
  client: KodiJsonRpcHttpClient,
  params: FileDetailsParams,
  options?: KodiHttpCallOptions
): Promise<FileDetailsResult> {
  return callKodi<FileDetailsResult, FileDetailsParams>(
    client,
    'Files.GetFileDetails',
    params,
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
