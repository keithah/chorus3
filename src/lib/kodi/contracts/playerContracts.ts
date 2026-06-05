import type { KodiPropertiesRequest, KodiLimits } from './coreContracts';

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

export type PlaylistItemPropertyName = Exclude<PlayerItemPropertyName, 'label' | 'type'>;

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
