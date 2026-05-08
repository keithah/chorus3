import {
  getPvrChannels,
  getPvrChannelDetails,
  getPvrBroadcasts,
  getPvrRecordingDetails,
  getPvrRecordings,
  recordPvrChannel,
  togglePvrTimer,
  addPvrTimer,
  deletePvrTimer,
  type PvrBroadcast,
  type PvrBroadcastPropertyName,
  type KodiJsonRpcHttpClient,
  type PvrChannel,
  type PvrChannelPropertyName,
  type PvrRecording,
  type PvrRecordingPropertyName
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  cloneMusicLibrarySafeError,
  createMusicLibrarySafeError,
  MusicLibraryClientError,
  type MusicLibraryRefreshStatus,
  type MusicLibrarySafeErrorSnapshot
} from './musicLibraryNormalization';

export type PvrChannelGroup = 'alltv' | 'allradio';
export type PvrRefreshStatus = MusicLibraryRefreshStatus;

export interface PvrChannelSnapshot {
  channelid: number;
  label: string;
  channel?: string;
  channeltype?: string;
  thumbnail?: string;
  broadcastTitle?: string;
  isrecording?: boolean;
  hidden?: boolean;
  locked?: boolean;
}

export interface PvrRecordingSnapshot {
  recordingid: number;
  label: string;
  title?: string;
  channel?: string;
  file?: string;
  thumbnail?: string;
  plot?: string;
  starttime?: string;
  endtime?: string;
  runtime?: number;
  progress?: number;
  radio?: boolean;
}

export interface PvrBroadcastSnapshot {
  broadcastid: number;
  label: string;
  title?: string;
  plot?: string;
  starttime?: string;
  endtime?: string;
  runtime?: number;
  progress?: number;
  progresspercentage?: number;
  thumbnail?: string;
  hastimer?: boolean;
  hastimerrule?: boolean;
  hasrecording?: boolean;
  isactive?: boolean;
}

export interface PvrStoreSnapshot {
  tvStatus: PvrRefreshStatus;
  radioStatus: PvrRefreshStatus;
  recordingsStatus: PvrRefreshStatus;
  lastUpdatedAt: string | null;
  tvChannels: PvrChannelSnapshot[];
  radioChannels: PvrChannelSnapshot[];
  recordings: PvrRecordingSnapshot[];
  broadcastsByChannelId: Record<number, PvrBroadcastSnapshot[]>;
  lastError: MusicLibrarySafeErrorSnapshot | null;
}

export interface PvrStoreOptions {
  client?: KodiJsonRpcHttpClient;
  createClient?: () => KodiJsonRpcHttpClient | null;
  now?: () => string;
}

const CHANNEL_PROPERTIES = [
  'thumbnail',
  'channeltype',
  'hidden',
  'locked',
  'channel',
  'lastplayed',
  'broadcastnow',
  'isrecording'
] as const satisfies readonly PvrChannelPropertyName[];

const RECORDING_PROPERTIES = [
  'channel',
  'file',
  'title',
  'resume',
  'plot',
  'genre',
  'playcount',
  'starttime',
  'endtime',
  'runtime',
  'icon',
  'art',
  'streamurl',
  'directory',
  'radio',
  'isdeleted',
  'channeluid'
] as const satisfies readonly PvrRecordingPropertyName[];

const BROADCAST_PROPERTIES = [
  'title',
  'runtime',
  'starttime',
  'endtime',
  'genre',
  'progress',
  'plot',
  'plotoutline',
  'progresspercentage',
  'episodename',
  'hastimer',
  'isactive',
  'wasactive',
  'thumbnail',
  'hastimerrule',
  'hasrecording',
  'recording',
  'isseries'
] as const satisfies readonly PvrBroadcastPropertyName[];

const DEFAULT_SNAPSHOT: PvrStoreSnapshot = {
  tvStatus: 'idle',
  radioStatus: 'idle',
  recordingsStatus: 'idle',
  lastUpdatedAt: null,
  tvChannels: [],
  radioChannels: [],
  recordings: [],
  broadcastsByChannelId: {},
  lastError: null
};

export class PvrStore {
  #snapshot = $state<PvrStoreSnapshot>(clonePvrSnapshot(DEFAULT_SNAPSHOT));
  readonly #client: KodiJsonRpcHttpClient | null;
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #now: () => string;
  #tvRequestId = 0;
  #radioRequestId = 0;
  #recordingsRequestId = 0;
  #broadcastRequestIds = new Map<number, number>();

  constructor(options: PvrStoreOptions = {}) {
    this.#client = options.client ?? null;
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): PvrStoreSnapshot {
    return clonePvrSnapshot(this.#snapshot);
  }

  async refreshChannels(group: PvrChannelGroup): Promise<void> {
    const requestId = group === 'alltv' ? ++this.#tvRequestId : ++this.#radioRequestId;
    const statusKey = group === 'alltv' ? 'tvStatus' : 'radioStatus';
    const channelKey = group === 'alltv' ? 'tvChannels' : 'radioChannels';

    this.#snapshot = { ...this.#snapshot, [statusKey]: 'loading', lastError: null };

    try {
      const result = await getPvrChannels(this.#resolveClient(), {
        channelgroupid: group,
        properties: CHANNEL_PROPERTIES
      });

      if (!this.#isCurrentChannelRequest(group, requestId)) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        [statusKey]: 'ready',
        [channelKey]: normalizePvrChannels(result.channels),
        lastUpdatedAt: this.#now(),
        lastError: null
      };
    } catch (error) {
      if (!this.#isCurrentChannelRequest(group, requestId)) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        [statusKey]: 'error',
        lastError: createMusicLibrarySafeError(error)
      };
    }
  }

  async refreshRecordings(): Promise<void> {
    const requestId = ++this.#recordingsRequestId;
    this.#snapshot = { ...this.#snapshot, recordingsStatus: 'loading', lastError: null };

    try {
      const result = await getPvrRecordings(this.#resolveClient(), {
        properties: RECORDING_PROPERTIES
      });

      if (requestId !== this.#recordingsRequestId) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        recordingsStatus: 'ready',
        recordings: normalizePvrRecordings(result.recordings),
        lastUpdatedAt: this.#now(),
        lastError: null
      };
    } catch (error) {
      if (requestId !== this.#recordingsRequestId) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        recordingsStatus: 'error',
        lastError: createMusicLibrarySafeError(error)
      };
    }
  }

  getChannelEntity(channelid: number): PvrChannelSnapshot | null {
    if (!Number.isSafeInteger(channelid) || channelid <= 0) {
      return null;
    }

    const channel =
      this.#snapshot.tvChannels.find((candidate) => candidate.channelid === channelid) ??
      this.#snapshot.radioChannels.find((candidate) => candidate.channelid === channelid) ??
      null;
    return channel ? { ...channel } : null;
  }

  async loadChannelDetail(channelid: number): Promise<PvrChannelSnapshot | null> {
    if (!Number.isSafeInteger(channelid) || channelid <= 0) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createMusicLibrarySafeError(
          new MusicLibraryClientError('input/invalid-pvr-channel', 'Choose a valid PVR channel.')
        )
      };
      return null;
    }

    try {
      const result = await getPvrChannelDetails(this.#resolveClient(), {
        channelid,
        properties: CHANNEL_PROPERTIES
      });
      const detail = normalizePvrChannels([result.channeldetails]).at(0) ?? null;
      if (!detail) {
        throw new MusicLibraryClientError(
          'pvr/missing-channel',
          'Kodi did not return channel details.'
        );
      }

      const detailGroup = channelGroupForDetail(detail, this.#snapshot);
      this.#snapshot = {
        ...this.#snapshot,
        tvChannels: replaceChannel(this.#snapshot.tvChannels, detail, 'tv', detailGroup),
        radioChannels: replaceChannel(this.#snapshot.radioChannels, detail, 'radio', detailGroup),
        lastUpdatedAt: this.#now(),
        lastError: null
      };
      return { ...detail };
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createMusicLibrarySafeError(error)
      };
      return null;
    }
  }

  getRecordingEntity(recordingid: number): PvrRecordingSnapshot | null {
    if (!Number.isSafeInteger(recordingid) || recordingid <= 0) {
      return null;
    }

    const recording =
      this.#snapshot.recordings.find((candidate) => candidate.recordingid === recordingid) ?? null;
    return recording ? { ...recording } : null;
  }

  async loadRecordingDetail(recordingid: number): Promise<PvrRecordingSnapshot | null> {
    if (!Number.isSafeInteger(recordingid) || recordingid <= 0) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createMusicLibrarySafeError(
          new MusicLibraryClientError(
            'input/invalid-pvr-recording',
            'Choose a valid PVR recording.'
          )
        )
      };
      return null;
    }

    try {
      const result = await getPvrRecordingDetails(this.#resolveClient(), {
        recordingid,
        properties: RECORDING_PROPERTIES
      });
      const detail = normalizePvrRecordings([result.recordingdetails]).at(0) ?? null;
      if (!detail) {
        throw new MusicLibraryClientError(
          'pvr/missing-recording',
          'Kodi did not return recording details.'
        );
      }

      this.#snapshot = {
        ...this.#snapshot,
        recordings: replaceRecording(this.#snapshot.recordings, detail),
        lastUpdatedAt: this.#now(),
        lastError: null
      };
      return { ...detail };
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createMusicLibrarySafeError(error)
      };
      return null;
    }
  }

  async refreshBroadcasts(channelid: number): Promise<void> {
    if (!Number.isSafeInteger(channelid) || channelid <= 0) {
      this.#snapshot = {
        ...this.#snapshot,
        lastError: createMusicLibrarySafeError(
          new MusicLibraryClientError('input/invalid-pvr-channel', 'Choose a valid PVR channel.')
        )
      };
      return;
    }

    const requestId = (this.#broadcastRequestIds.get(channelid) ?? 0) + 1;
    this.#broadcastRequestIds.set(channelid, requestId);

    try {
      const result = await getPvrBroadcasts(this.#resolveClient(), {
        channelid,
        properties: BROADCAST_PROPERTIES
      });

      if (this.#broadcastRequestIds.get(channelid) !== requestId) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        broadcastsByChannelId: {
          ...this.#snapshot.broadcastsByChannelId,
          [channelid]: normalizePvrBroadcasts(result.broadcasts)
        },
        lastUpdatedAt: this.#now(),
        lastError: null
      };
    } catch (error) {
      if (this.#broadcastRequestIds.get(channelid) !== requestId) {
        return;
      }

      this.#snapshot = {
        ...this.#snapshot,
        lastError: createMusicLibrarySafeError(error)
      };
    }
  }

  async toggleChannelRecording(channelid: number): Promise<void> {
    await recordPvrChannel(this.#resolveClient(), { channel: channelid, record: 'toggle' });
    await Promise.allSettled([
      this.refreshChannels('alltv'),
      this.refreshChannels('allradio'),
      this.refreshBroadcasts(channelid)
    ]);
  }

  async toggleBroadcastTimer(broadcastid: number, timerrule = false): Promise<void> {
    await togglePvrTimer(this.#resolveClient(), { broadcastid, timerrule });
  }

  async addBroadcastTimer(broadcastid: number, timerrule = false): Promise<void> {
    await addPvrTimer(this.#resolveClient(), { broadcastid, timerrule });
  }

  async deleteTimer(timerid: number): Promise<void> {
    await deletePvrTimer(this.#resolveClient(), { timerid });
  }

  async refreshAll(): Promise<void> {
    await Promise.all([
      this.refreshChannels('alltv'),
      this.refreshChannels('allradio'),
      this.refreshRecordings()
    ]);
  }

  #resolveClient(): KodiJsonRpcHttpClient {
    const client = this.#client ?? this.#createClient();
    if (!client) {
      throw new MusicLibraryClientError(
        'config/no-active-host',
        'Choose an active Kodi host before loading PVR data.'
      );
    }

    return client;
  }

  #isCurrentChannelRequest(group: PvrChannelGroup, requestId: number): boolean {
    return group === 'alltv' ? requestId === this.#tvRequestId : requestId === this.#radioRequestId;
  }
}

export function createPvrStore(options: PvrStoreOptions = {}): PvrStore {
  return new PvrStore(options);
}

export const pvrStore = createPvrStore();

function normalizePvrChannels(items: unknown): PvrChannelSnapshot[] {
  return recordList(items).flatMap((item): PvrChannelSnapshot[] => {
    const channelid = positiveInteger(item.channelid);
    if (channelid === null) {
      return [];
    }

    const channel = item as PvrChannel;
    const broadcast = recordValue(channel.broadcastnow);
    return [
      {
        channelid,
        label: stringValue(channel.label) ?? stringValue(channel.channel) ?? `Channel ${channelid}`,
        ...stringField('channel', channel.channel),
        ...stringField('channeltype', channel.channeltype),
        ...stringField('thumbnail', channel.thumbnail),
        ...stringField('broadcastTitle', broadcast?.title ?? broadcast?.label),
        ...booleanField('isrecording', channel.isrecording),
        ...booleanField('hidden', channel.hidden),
        ...booleanField('locked', channel.locked)
      }
    ];
  });
}

function normalizePvrRecordings(items: unknown): PvrRecordingSnapshot[] {
  return recordList(items)
    .flatMap((item): PvrRecordingSnapshot[] => {
      const recordingid = positiveInteger(item.recordingid);
      if (recordingid === null) {
        return [];
      }

      const recording = item as PvrRecording;
      return [
        {
          recordingid,
          label:
            stringValue(recording.label) ??
            stringValue(recording.title) ??
            `Recording ${recordingid}`,
          ...stringField('title', recording.title),
          ...stringField('channel', recording.channel),
          ...stringField('file', recording.file),
          ...stringField('thumbnail', recording.thumbnail ?? recording.icon),
          ...stringField('plot', recording.plot),
          ...stringField('starttime', recording.starttime),
          ...stringField('endtime', recording.endtime),
          ...numberField('runtime', recording.runtime),
          ...numberField('progress', recordingProgress(recording)),
          ...booleanField('radio', recording.radio)
        }
      ];
    })
    .sort((a, b) => (b.starttime ?? '').localeCompare(a.starttime ?? ''));
}

function recordingProgress(recording: PvrRecording): number | undefined {
  const runtime =
    typeof recording.runtime === 'number' && recording.runtime > 0 ? recording.runtime : 0;
  const resume = recordValue(recording.resume);
  const position =
    typeof resume?.position === 'number' && Number.isFinite(resume.position) ? resume.position : 0;
  if (runtime <= 0 || position <= 0) {
    return undefined;
  }
  return Math.max(0, Math.min(100, Math.round((position / runtime) * 100)));
}

function clonePvrSnapshot(snapshot: PvrStoreSnapshot): PvrStoreSnapshot {
  return {
    ...snapshot,
    tvChannels: snapshot.tvChannels.map((channel) => ({ ...channel })),
    radioChannels: snapshot.radioChannels.map((channel) => ({ ...channel })),
    recordings: snapshot.recordings.map((recording) => ({ ...recording })),
    broadcastsByChannelId: Object.fromEntries(
      Object.entries(snapshot.broadcastsByChannelId).map(([channelid, broadcasts]) => [
        channelid,
        broadcasts.map((broadcast) => ({ ...broadcast }))
      ])
    ),
    lastError: cloneMusicLibrarySafeError(snapshot.lastError)
  };
}

function normalizePvrBroadcasts(items: unknown): PvrBroadcastSnapshot[] {
  return recordList(items).flatMap((item): PvrBroadcastSnapshot[] => {
    const broadcastid = positiveInteger(item.broadcastid);
    if (broadcastid === null) {
      return [];
    }

    const broadcast = item as PvrBroadcast;
    return [
      {
        broadcastid,
        label:
          stringValue(broadcast.label) ??
          stringValue(broadcast.title) ??
          `Broadcast ${broadcastid}`,
        ...stringField('title', broadcast.title),
        ...stringField('plot', broadcast.plot),
        ...stringField('starttime', broadcast.starttime),
        ...stringField('endtime', broadcast.endtime),
        ...stringField('thumbnail', broadcast.thumbnail),
        ...numberField('runtime', broadcast.runtime),
        ...numberField('progress', broadcast.progress),
        ...numberField('progresspercentage', broadcast.progresspercentage),
        ...booleanField('hastimer', broadcast.hastimer),
        ...booleanField('hastimerrule', broadcast.hastimerrule),
        ...booleanField('hasrecording', broadcast.hasrecording),
        ...booleanField('isactive', broadcast.isactive)
      }
    ];
  });
}

function replaceRecording(
  recordings: readonly PvrRecordingSnapshot[],
  detail: PvrRecordingSnapshot
): PvrRecordingSnapshot[] {
  let replaced = false;
  const next = recordings.map((recording) => {
    if (recording.recordingid !== detail.recordingid) {
      return { ...recording };
    }
    replaced = true;
    return { ...detail };
  });
  if (!replaced) {
    next.push({ ...detail });
  }
  return next.sort((a, b) => (b.starttime ?? '').localeCompare(a.starttime ?? ''));
}

function replaceChannel(
  channels: readonly PvrChannelSnapshot[],
  detail: PvrChannelSnapshot,
  group: 'tv' | 'radio',
  detailGroup: 'tv' | 'radio' | null
): PvrChannelSnapshot[] {
  let replaced = false;
  const next = channels.map((channel) => {
    if (channel.channelid !== detail.channelid) {
      return { ...channel };
    }
    replaced = true;
    return { ...channel, ...detail };
  });
  if (!replaced && detailGroup === group) {
    next.push({ ...detail });
  }
  return next.sort((a, b) => (a.channel ?? a.label).localeCompare(b.channel ?? b.label));
}

function channelGroupForDetail(
  detail: PvrChannelSnapshot,
  snapshot: PvrStoreSnapshot
): 'tv' | 'radio' | null {
  if (detail.channeltype === 'tv' || detail.channeltype === 'radio') {
    return detail.channeltype;
  }
  if (snapshot.tvChannels.some((channel) => channel.channelid === detail.channelid)) {
    return 'tv';
  }
  if (snapshot.radioChannels.some((channel) => channel.channelid === detail.channelid)) {
    return 'radio';
  }
  return null;
}

function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.flatMap((item): Record<string, unknown>[] => {
        const record = recordValue(item);
        return record ? [record] : [];
      })
    : [];
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function stringField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, string>> {
  const text = stringValue(value);
  return text ? ({ [key]: text } as Partial<Record<Key, string>>) : {};
}

function booleanField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, boolean>> {
  return typeof value === 'boolean' ? ({ [key]: value } as Partial<Record<Key, boolean>>) : {};
}

function numberField<Key extends string>(key: Key, value: unknown): Partial<Record<Key, number>> {
  return typeof value === 'number' && Number.isFinite(value)
    ? ({ [key]: value } as Partial<Record<Key, number>>)
    : {};
}
