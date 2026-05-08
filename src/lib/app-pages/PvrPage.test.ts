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

function createSnapshot(): PvrStoreSnapshot {
  return {
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

function renderPage(route: PrimaryRoute): void {
  mounted = mount(PvrPage, {
    target: document.body,
    props: {
      route,
      snapshot: createSnapshot(),
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
  });
});
