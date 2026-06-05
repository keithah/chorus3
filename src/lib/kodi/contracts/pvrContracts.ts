import type { KodiLimits } from './coreContracts';

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
