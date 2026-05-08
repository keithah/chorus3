import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LocalMediaRuntime from './LocalMediaRuntime.svelte';
import { createLocalPlayerStore } from '$lib/stores/localPlayer.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

describe('LocalMediaRuntime', () => {
  it('attaches one native video adapter and preserves the inline presentation by default', async () => {
    const store = createLocalPlayerStore();
    const attach = vi.spyOn(store, 'attach');
    const detach = vi.spyOn(store, 'detach');

    mounted = mount(LocalMediaRuntime, {
      target: document.body,
      props: { store }
    });
    await tick();

    const video = document.querySelector<HTMLVideoElement>('video.local-media-runtime');
    expect(video).toBeInstanceOf(HTMLVideoElement);
    expect(video?.dataset.localMediaAdapter).toBe('attached');
    expect(video?.dataset.localMediaVariant).toBe('inline');
    expect(video?.getAttribute('aria-label')).toBe('Local browser media playback runtime');
    expect(video?.hasAttribute('controls')).toBe(true);
    expect(attach).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledWith(video);

    detach.mockClear();
    unmount(mounted);
    mounted = null;

    expect(detach).toHaveBeenCalledTimes(1);
  });

  it('renders an inspectable fullscreen runtime without adding another media attachment point', async () => {
    const store = createLocalPlayerStore();
    const attach = vi.spyOn(store, 'attach');

    mounted = mount(LocalMediaRuntime, {
      target: document.body,
      props: { store, variant: 'fullscreen', className: 'stream-runtime' }
    });
    await tick();

    const videos = document.querySelectorAll<HTMLVideoElement>('video[data-local-media-adapter]');
    expect(videos).toHaveLength(1);
    expect(videos[0].dataset.localMediaVariant).toBe('fullscreen');
    expect(videos[0].classList.contains('stream-runtime')).toBe(true);
    expect(videos[0].classList.contains('fullscreen')).toBe(true);
    expect(attach).toHaveBeenCalledTimes(1);
  });

  it('reports ended events for browser playlist auto-advance without replacing store listeners', async () => {
    const store = createLocalPlayerStore();
    const onEnded = vi.fn();

    mounted = mount(LocalMediaRuntime, {
      target: document.body,
      props: { store, onEnded }
    });
    await tick();

    const video = document.querySelector<HTMLVideoElement>('video.local-media-runtime');
    expect(video).toBeInstanceOf(HTMLVideoElement);
    video!.dispatchEvent(new Event('ended'));
    await tick();

    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});
