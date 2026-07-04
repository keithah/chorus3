<script lang="ts">
  import type { RemoteInputPanelRemoteDispatch } from '$components/RemoteInputPanel.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import LazyRouteComponent from '$lib/app-pages/LazyRouteComponent.svelte';
  import { bindLazyRoute, loadRemoteInputPanel } from '$lib/app-pages/appPageSurfaceLazyRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type { PlayerStoreSnapshot, RemoteInputDispatchSnapshot } from '$lib/stores';

  interface Props {
    remoteSnapshot: RemoteInputDispatchSnapshot;
    remoteInputDispatch: RemoteInputPanelRemoteDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    backgroundUrl?: string;
    i18n: TranslationContext;
    onClose: () => void;
  }

  let {
    remoteSnapshot,
    remoteInputDispatch,
    playerSnapshot,
    playerDispatch,
    backgroundUrl,
    i18n,
    onClose
  }: Props = $props();
</script>

<div class="remote-overlay" aria-label="Kodi remote overlay">
  <button
    type="button"
    class="remote-overlay__scrim"
    aria-hidden="true"
    tabindex="-1"
    onclick={onClose}
  ></button>
  <div class="remote-overlay__panel">
    <button
      type="button"
      class="remote-overlay__close"
      aria-label="Close Kodi remote"
      onclick={onClose}
    >
      <span class="mdi mdi-navigation-close" aria-hidden="true"></span>
    </button>
    <LazyRouteComponent
      route={bindLazyRoute(loadRemoteInputPanel, {
        remoteSnapshot,
        remoteInputDispatch,
        playerSnapshot,
        playerDispatch,
        backgroundUrl,
        i18n
      })}
    />
  </div>
</div>

<style>
  .remote-overlay {
    position: fixed;
    inset: 45px var(--classic-playlist-width, 300px) 60px 54px;
    z-index: 28;
    pointer-events: none;
  }

  .remote-overlay__scrim {
    position: absolute;
    inset: 0;
    z-index: 0;
    border: 0;
    background: transparent;
    pointer-events: none;
  }

  .remote-overlay__panel {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 320px;
    height: 380px;
    overflow: visible;
    background: transparent;
    pointer-events: none;
  }

  .remote-overlay__close {
    position: absolute;
    top: auto;
    right: auto;
    bottom: 210px;
    left: 272px;
    z-index: 3;
    display: grid;
    width: 2.25rem;
    height: 2.25rem;
    place-items: center;
    border: 0;
    background: rgb(0 0 0 / 0.38);
    color: #f4f4f4;
    font-size: 1.25rem;
    cursor: pointer;
    pointer-events: auto;
  }

  .remote-overlay__close:hover,
  .remote-overlay__close:focus-visible {
    background: rgb(77 179 230 / 0.82);
    outline: none;
  }

  .remote-overlay__panel :global(.remote-input-panel) {
    width: 320px;
    min-height: 380px;
    height: 380px;
    overflow: visible;
    background: transparent;
    pointer-events: none;
  }

  .remote-overlay__panel :global(.remote-background) {
    display: none;
  }

  .remote-overlay__panel :global(.kodi-remote) {
    right: auto;
    bottom: 0;
    left: 0;
    width: 320px;
    margin-inline: 0;
    pointer-events: auto;
  }

  @media (max-width: 760px) {
    .remote-overlay {
      inset: 45px 0 60px 0;
    }

    .remote-overlay__panel {
      width: 320px;
      height: 380px;
    }
  }
</style>
