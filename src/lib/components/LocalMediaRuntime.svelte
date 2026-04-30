<script lang="ts">
  import { localPlayerStore, type LocalPlayerStore } from '$lib/stores/localPlayer.svelte';

  interface Props {
    store?: LocalPlayerStore;
  }

  let { store = localPlayerStore }: Props = $props();

  function attachLocalMedia(node: HTMLVideoElement): { destroy: () => void } {
    node.dataset.localMediaAdapter = 'attached';
    store.attach(node);

    return {
      destroy: () => {
        store.detach();
        delete node.dataset.localMediaAdapter;
      }
    };
  }
</script>

<video
  use:attachLocalMedia
  class="local-media-runtime"
  data-local-media-adapter="attached"
  aria-label="Local browser media playback runtime"
  preload="metadata"
  playsinline
  controls
></video>

<style>
  .local-media-runtime {
    width: min(100%, 42rem);
    max-height: 18rem;
    margin-block: var(--space-md);
    color: var(--color-text);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .local-media-runtime:not([src]) {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
