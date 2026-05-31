import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ThumbsUpPage from './ThumbsUpPage.svelte';
import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
import type { ThumbsUpDispatch, ThumbsUpStoreSnapshot } from '$lib/stores';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

describe('ThumbsUpPage', () => {
  it('uses in-page controls for media sections without changing the app route hash', () => {
    mounted = mount(ThumbsUpPage, {
      target: document.body,
      props: {
        snapshot: createSnapshot(),
        dispatch: createDispatch(),
        playerDispatch: createPlayerDispatch(),
        queueDispatch: createQueueDispatch(),
        buildOptions: {
          routeMode: 'path',
          packageBasePath: '/addons/webinterface.chorus3',
          packageSearch: '?cb=thumbs-up'
        }
      }
    });

    const controls = [...document.querySelectorAll('.thumbs-sidebar button')].map((button) =>
      button.textContent?.trim()
    );

    expect(controls).toContain('Movies');
    expect(document.querySelector('.thumbs-sidebar a')).toBeNull();
  });
});

function createSnapshot(): ThumbsUpStoreSnapshot {
  return {
    groups: {
      song: [],
      artist: [],
      album: [],
      tvshow: [],
      movie: [],
      episode: [],
      musicvideo: []
    },
    total: 0,
    lastUpdatedAt: null,
    storageWarning: null
  };
}

function createDispatch(): ThumbsUpDispatch {
  return {
    toggleItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn(() => false)
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

function createQueueDispatch(): QueuePanelDispatch {
  return {
    snapshot: {
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    },
    removeAt: vi.fn(),
    clear: vi.fn(),
    swap: vi.fn()
  };
}
