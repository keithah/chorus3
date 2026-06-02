import type { KodiEndpointDescription } from '$lib/kodi';

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
