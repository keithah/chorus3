<script lang="ts">
  import { localPlayerStore, type LocalPlayerStore } from '$lib/stores/localPlayer.svelte';

  type LocalMediaRuntimeVariant = 'inline' | 'fullscreen';

  interface Props {
    store?: LocalPlayerStore;
    variant?: LocalMediaRuntimeVariant;
    className?: string;
    onEnded?: () => Promise<void> | void;
  }

  let { store = localPlayerStore, variant = 'inline', className = '', onEnded }: Props = $props();

  function attachLocalMedia(node: HTMLVideoElement): { destroy: () => void } {
    node.dataset.localMediaAdapter = 'attached';
    store.attach(node);
    const handleEnded = (): void => {
      void Promise.resolve(onEnded?.()).catch(() => {
        // Auto-advance is best effort; local player diagnostics own media failures.
      });
    };
    node.addEventListener('ended', handleEnded);

    return {
      destroy: () => {
        node.removeEventListener('ended', handleEnded);
        store.detach();
        delete node.dataset.localMediaAdapter;
      }
    };
  }
</script>

<video
  use:attachLocalMedia
  class={`local-media-runtime ${variant} ${className}`.trim()}
  data-local-media-adapter="attached"
  data-local-media-variant={variant}
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
    box-shadow:
      inset 0 0 0 1px var(--color-border),
      0 1rem 3rem color-mix(in srgb, black 22%, transparent);
    border-radius: var(--radius-lg);
  }

  .local-media-runtime.fullscreen {
    display: block;
    width: 100%;
    max-height: min(68vh, 48rem);
    margin-block: 0;
    aspect-ratio: 16 / 9;
    background: #000;
    border-radius: calc(var(--radius-lg) + var(--space-xs));
  }

  .local-media-runtime:not([src]):not(.fullscreen) {
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
