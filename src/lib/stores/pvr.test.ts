import { describe, expect, it } from 'vitest';

import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import { createPvrStore } from './pvr.svelte';

type CallRecord = {
  method: string;
  params?: unknown;
};

class FakeKodiClient implements KodiJsonRpcHttpClient {
  readonly calls: CallRecord[] = [];
  readonly responses = new Map<string, unknown[]>();

  enqueue(method: string, response: unknown): void {
    this.responses.set(method, [...(this.responses.get(method) ?? []), response]);
  }

  async call<TResult>(method: string, params?: unknown): Promise<TResult> {
    this.calls.push(params === undefined ? { method } : { method, params });
    const queue = this.responses.get(method) ?? [];
    if (queue.length === 0) {
      throw new Error(`Unexpected Kodi call: ${method}`);
    }
    const response = queue.shift();
    this.responses.set(method, queue);
    if (response instanceof Error) {
      throw response;
    }
    return response as TResult;
  }
}

function createHarness() {
  const client = new FakeKodiClient();
  let nowMs = 1_000;
  const store = createPvrStore({
    client,
    now: () => new Date(nowMs).toISOString()
  });
  return {
    client,
    store,
    setNow: (value: number) => {
      nowMs = value;
    }
  };
}

describe('PvrStore', () => {
  it('loads channel collections and single channel details with Chorus2 entity semantics', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('PVR.GetChannels', {
      channels: [
        {
          channelid: 12,
          label: 'FOX',
          channel: '12.1',
          channeltype: 'tv',
          broadcastnow: { title: 'Local News' },
          isrecording: false
        },
        { channelid: 0, label: 'Invalid' }
      ]
    });
    setNow(1_500);

    await store.refreshChannels('alltv');

    expect(client.calls[0]).toMatchObject({
      method: 'PVR.GetChannels',
      params: {
        channelgroupid: 'alltv',
        properties: expect.arrayContaining(['thumbnail', 'broadcastnow', 'isrecording'])
      }
    });
    expect(store.snapshot.tvChannels).toEqual([
      {
        channelid: 12,
        label: 'FOX',
        channel: '12.1',
        channeltype: 'tv',
        broadcastTitle: 'Local News',
        isrecording: false
      }
    ]);
    expect(store.getChannelEntity(12)).toMatchObject({ channelid: 12, label: 'FOX' });

    client.enqueue('PVR.GetChannelDetails', {
      channeldetails: {
        channelid: 12,
        label: 'FOX HD',
        channel: '12.1',
        thumbnail: 'image://fox.png/'
      }
    });
    setNow(2_500);

    await expect(store.loadChannelDetail(12)).resolves.toMatchObject({
      channelid: 12,
      label: 'FOX HD',
      thumbnail: 'image://fox.png/'
    });
    expect(client.calls.at(-1)).toMatchObject({
      method: 'PVR.GetChannelDetails',
      params: {
        channelid: 12,
        properties: expect.arrayContaining(['thumbnail', 'broadcastnow'])
      }
    });
    expect(store.snapshot.tvChannels[0]).toMatchObject({
      channelid: 12,
      label: 'FOX HD',
      thumbnail: 'image://fox.png/'
    });
    expect(store.snapshot.radioChannels).toEqual([]);
    expect(store.snapshot.lastUpdatedAt).toBe(new Date(2_500).toISOString());

    await expect(store.loadChannelDetail(0)).resolves.toBeNull();
    expect(store.snapshot.lastError).toMatchObject({
      code: 'input/invalid-pvr-channel',
      message: 'Choose a valid PVR channel.'
    });
  });

  it('loads recording collections with Chorus2 entity semantics and clone-safe snapshots', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('PVR.GetRecordings', {
      recordings: [
        {
          recordingid: 2,
          label: 'Older show',
          title: 'Older show',
          channel: 'PBS',
          file: 'pvr://recordings/tv/2',
          starttime: '2026-05-01 12:00:00',
          runtime: 1800,
          radio: false
        },
        {
          recordingid: 1,
          label: 'Newest show',
          title: 'Newest show',
          channel: 'FOX',
          file: 'pvr://recordings/tv/1',
          starttime: '2026-05-02 12:00:00',
          runtime: 3600,
          resume: { position: 900 },
          radio: false
        },
        { recordingid: 0, label: 'Invalid' }
      ]
    });
    setNow(2_000);

    await store.refreshRecordings();

    expect(client.calls[0]).toMatchObject({
      method: 'PVR.GetRecordings',
      params: {
        properties: expect.arrayContaining(['file', 'title', 'starttime', 'radio'])
      }
    });
    expect(store.snapshot).toMatchObject({
      recordingsStatus: 'ready',
      lastUpdatedAt: new Date(2_000).toISOString(),
      recordings: [
        { recordingid: 1, title: 'Newest show', channel: 'FOX', progress: 25 },
        { recordingid: 2, title: 'Older show', channel: 'PBS' }
      ],
      lastError: null
    });
    expect(store.getRecordingEntity(1)).toMatchObject({
      recordingid: 1,
      file: 'pvr://recordings/tv/1'
    });

    const leaked = store.snapshot;
    expect(store.snapshot).toBe(leaked);
    expect(Object.isFrozen(leaked.recordings[0])).toBe(true);
    expect(() => {
      leaked.recordings[0].title = 'Mutated outside';
    }).toThrow(TypeError);
    expect(store.snapshot.recordings[0].title).toBe('Newest show');
  });

  it('loads single recording details, replaces cached rows, and records safe failures', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('PVR.GetRecordings', {
      recordings: [
        {
          recordingid: 1,
          label: 'Short title',
          title: 'Short title',
          file: 'pvr://recordings/tv/1',
          starttime: '2026-05-01 12:00:00'
        }
      ]
    });
    await store.refreshRecordings();
    client.enqueue('PVR.GetRecordingDetails', {
      recordingdetails: {
        recordingid: 1,
        label: 'Full title',
        title: 'Full title',
        channel: 'FOX',
        file: 'pvr://recordings/tv/1',
        plot: 'Detailed plot.',
        starttime: '2026-05-01 12:00:00',
        radio: false
      }
    });
    setNow(3_000);

    await expect(store.loadRecordingDetail(1)).resolves.toMatchObject({
      recordingid: 1,
      title: 'Full title',
      plot: 'Detailed plot.'
    });

    expect(client.calls.at(-1)).toMatchObject({
      method: 'PVR.GetRecordingDetails',
      params: {
        recordingid: 1,
        properties: expect.arrayContaining(['file', 'plot', 'radio'])
      }
    });
    expect(store.snapshot.recordings[0]).toMatchObject({
      recordingid: 1,
      title: 'Full title',
      plot: 'Detailed plot.'
    });
    expect(store.snapshot.lastUpdatedAt).toBe(new Date(3_000).toISOString());

    await expect(store.loadRecordingDetail(0)).resolves.toBeNull();
    expect(store.snapshot.lastError).toMatchObject({
      code: 'input/invalid-pvr-recording',
      message: 'Choose a valid PVR recording.'
    });
  });

  it('loads broadcasts with Chorus2 EPG timer and airing state semantics', async () => {
    const { client, setNow, store } = createHarness();
    client.enqueue('PVR.GetBroadcasts', {
      broadcasts: [
        {
          broadcastid: 501,
          label: 'Evening News',
          title: 'Evening News',
          starttime: '2026-05-24 18:00:00',
          endtime: '2026-05-24 18:30:00',
          plot: 'Local headlines.',
          isactive: true,
          wasactive: false,
          hastimer: true,
          hastimerrule: false,
          hasrecording: false
        },
        {
          broadcastid: 500,
          label: 'Earlier News',
          wasactive: true
        },
        { broadcastid: 0, label: 'Invalid' }
      ]
    });
    setNow(4_000);

    await store.refreshBroadcasts(101);

    expect(client.calls[0]).toMatchObject({
      method: 'PVR.GetBroadcasts',
      params: {
        channelid: 101,
        properties: expect.arrayContaining(['hastimer', 'isactive', 'wasactive'])
      }
    });
    expect(store.snapshot.broadcastsByChannelId[101]).toEqual([
      {
        broadcastid: 501,
        label: 'Evening News',
        title: 'Evening News',
        plot: 'Local headlines.',
        starttime: '2026-05-24 18:00:00',
        endtime: '2026-05-24 18:30:00',
        hastimer: true,
        hastimerrule: false,
        hasrecording: false,
        isactive: true,
        wasactive: false
      },
      {
        broadcastid: 500,
        label: 'Earlier News',
        wasactive: true
      }
    ]);
    expect(store.snapshot.lastUpdatedAt).toBe(new Date(4_000).toISOString());

    const leaked = store.snapshot;
    expect(store.snapshot).toBe(leaked);
    expect(Object.isFrozen(leaked.broadcastsByChannelId[101][0])).toBe(true);
    expect(() => {
      leaked.broadcastsByChannelId[101][0].title = 'Mutated outside';
    }).toThrow(TypeError);
    expect(store.snapshot.broadcastsByChannelId[101][0].title).toBe('Evening News');
  });

  it('prunes broadcasts for channels no longer present after channel refresh', async () => {
    const { client, store } = createHarness();
    client.enqueue('PVR.GetChannels', {
      channels: [
        { channelid: 101, label: 'News', channeltype: 'tv' },
        { channelid: 102, label: 'Sports', channeltype: 'tv' }
      ]
    });
    await store.refreshChannels('alltv');
    client.enqueue('PVR.GetBroadcasts', {
      broadcasts: [{ broadcastid: 1, label: 'News at 10' }]
    });
    await store.refreshBroadcasts(101);

    client.enqueue('PVR.GetChannels', {
      channels: [{ channelid: 102, label: 'Sports', channeltype: 'tv' }]
    });
    await store.refreshChannels('alltv');

    expect(store.snapshot.broadcastsByChannelId[101]).toBeUndefined();
  });
});
