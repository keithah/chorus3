import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { PvrStoreSnapshot } from '$lib/stores';
import PvrPage, { type PvrPageDispatch } from './PvrPage.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function createSnapshot(overrides: Partial<PvrStoreSnapshot> = {}): PvrStoreSnapshot {
  const snapshot: PvrStoreSnapshot = {
    tvStatus: 'ready',
    radioStatus: 'ready',
    recordingsStatus: 'ready',
    lastUpdatedAt: null,
    tvChannels: [
      {
        channelid: 101,
        label: 'KTV',
        channel: '10.1',
        channeltype: 'tv',
        broadcastTitle: 'News'
      }
    ],
    radioChannels: [
      {
        channelid: 202,
        label: 'Radio One',
        channel: '88.1',
        channeltype: 'radio'
      }
    ],
    recordings: [],
    broadcastsByChannelId: {},
    lastError: null
  };
  return { ...snapshot, ...overrides };
}

function createDispatch(): PvrPageDispatch {
  return {
    refreshChannels: vi.fn(),
    refreshRecordings: vi.fn(),
    refreshBroadcasts: vi.fn(),
    loadChannelDetail: vi.fn(),
    toggleChannelRecording: vi.fn(),
    toggleBroadcastTimer: vi.fn(),
    addBroadcastTimer: vi.fn(),
    deleteTimer: vi.fn()
  };
}

function createPlayerDispatch(): PlayerControlsDispatch {
  return {
    snapshot: {
      mode: 'kodi',
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    },
    playPause: vi.fn(),
    stop: vi.fn(),
    previous: vi.fn(),
    next: vi.fn(),
    seekPercentage: vi.fn(),
    seekRelativeSeconds: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    setShuffle: vi.fn(),
    setPartyMode: vi.fn(),
    setRepeat: vi.fn(),
    setSubtitle: vi.fn(),
    setAudioStream: vi.fn(),
    startLocalPlayback: vi.fn(),
    resumeOnKodi: vi.fn()
  };
}

function renderPage(route: PrimaryRoute, snapshot: PvrStoreSnapshot = createSnapshot()): void {
  mounted = mount(PvrPage, {
    target: document.body,
    props: {
      route,
      snapshot,
      dispatch: createDispatch(),
      playerDispatch: createPlayerDispatch()
    }
  });
}

describe('PvrPage', () => {
  it('uses path-mode PVR links and dispatches route-state updates when switching sections', async () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);

    renderPage({ kind: 'pvrTv' });

    const radioLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'Radio Stations'
    );

    expect(radioLink?.getAttribute('href')).toBe('/pvr/radio');
    radioLink?.click();
    await tick();

    expect(pushState).toHaveBeenCalledWith({}, '', '/pvr/radio');
    expect(popstate).toHaveBeenCalledTimes(1);

    window.removeEventListener('popstate', popstate);
  });

  it('uses hash-mode PVR links for package-mounted routes', () => {
    mounted = mount(PvrPage, {
      target: document.body,
      props: {
        route: { kind: 'pvrTv' },
        snapshot: createSnapshot(),
        dispatch: createDispatch(),
        playerDispatch: createPlayerDispatch(),
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });

    const recordingsLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'Recordings'
    );

    expect(recordingsLink?.getAttribute('href')).toBe(
      '/addons/webinterface.chorus3#pvr/recordings'
    );

    const epgLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'Guide'
    );

    expect(epgLink?.getAttribute('href')).toBe('/addons/webinterface.chorus3#pvr/epg');
  });

  it('renders the global Chorus2 EPG route across TV channels', async () => {
    const dispatch = createDispatch();
    const playerDispatch = createPlayerDispatch();
    const playChannelItem = vi.fn();
    Object.assign(playerDispatch, { playChannelItem });
    const snapshot = createSnapshot({
      tvChannels: [
        {
          channelid: 101,
          label: 'KTV',
          channel: '10.1',
          channeltype: 'tv',
          broadcastTitle: 'News'
        },
        {
          channelid: 102,
          label: 'Cinema',
          channel: '10.2',
          channeltype: 'tv',
          broadcastTitle: 'Feature'
        }
      ],
      broadcastsByChannelId: {
        101: [
          {
            broadcastid: 501,
            label: 'Evening News',
            title: 'Evening News',
            starttime: '2026-05-24 18:00:00',
            endtime: '2026-05-24 18:30:00',
            plot: 'Local headlines.',
            isactive: true,
            hastimer: false
          }
        ],
        102: [
          {
            broadcastid: 601,
            label: 'Feature',
            title: 'Feature',
            starttime: '2026-05-24 18:30:00',
            endtime: '2026-05-24 20:00:00',
            plot: 'A movie.',
            isactive: false,
            hastimer: true
          }
        ]
      }
    });

    mounted = mount(PvrPage, {
      target: document.body,
      props: {
        route: { kind: 'pvrEpg' },
        snapshot,
        dispatch,
        playerDispatch
      }
    });
    await tick();

    expect(document.querySelector('#pvr-page-title')?.textContent).toBe('TV Guide');
    expect(document.body.textContent).toContain('KTV');
    expect(document.body.textContent).toContain('Cinema');
    expect(document.body.textContent).toContain('Evening News');
    expect(document.body.textContent).toContain('Feature');
    expect(document.body.textContent).not.toContain('Radio One');
    expect(dispatch.refreshChannels).toHaveBeenCalledWith('alltv');
    expect(dispatch.refreshBroadcasts).toHaveBeenCalledWith(101);
    expect(dispatch.refreshBroadcasts).toHaveBeenCalledWith(102);

    const refreshButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Refresh EPG'
    );
    refreshButton?.click();
    await tick();
    expect(dispatch.refreshBroadcasts).toHaveBeenCalledWith(101);
    expect(dispatch.refreshBroadcasts).toHaveBeenCalledWith(102);

    const playButtons = Array.from(document.querySelectorAll('button')).filter(
      (button) => button.textContent?.trim() === 'Play'
    );
    playButtons.at(0)?.click();
    await tick();
    expect(playChannelItem).toHaveBeenCalledWith({ channelid: 101 });
  });

  it('renders channel routes as focused Chorus2 EPG pages with programme actions', async () => {
    const dispatch = createDispatch();
    const playerDispatch = createPlayerDispatch();
    const playChannelItem = vi.fn();
    Object.assign(playerDispatch, { playChannelItem });
    const snapshot = createSnapshot({
      broadcastsByChannelId: {
        101: [
          {
            broadcastid: 501,
            label: 'Evening News',
            title: 'Evening News',
            starttime: '2026-05-24 18:00:00',
            endtime: '2026-05-24 18:30:00',
            plot: 'Local headlines.',
            isactive: true,
            hastimer: false
          }
        ]
      }
    });

    mounted = mount(PvrPage, {
      target: document.body,
      props: {
        route: { kind: 'pvrTvChannel', channelid: '101' },
        snapshot,
        dispatch,
        playerDispatch
      }
    });
    await tick();

    expect(document.querySelector('#pvr-page-title')?.textContent).toBe('KTV');
    expect(document.body.textContent).toContain('Evening News');
    expect(document.body.textContent).toContain('Local headlines.');
    expect(document.body.textContent).not.toContain('Radio One');
    expect(dispatch.loadChannelDetail).toHaveBeenCalledWith(101);
    expect(dispatch.refreshBroadcasts).toHaveBeenCalledWith(101);

    const refreshButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Refresh EPG'
    );
    refreshButton?.click();
    await tick();
    expect(dispatch.refreshBroadcasts).toHaveBeenCalledWith(101);

    const playButtons = Array.from(document.querySelectorAll('button')).filter(
      (button) => button.textContent?.trim() === 'Play'
    );
    playButtons.at(0)?.click();
    await tick();
    expect(playChannelItem).toHaveBeenCalledWith({ channelid: 101 });
  });
});
