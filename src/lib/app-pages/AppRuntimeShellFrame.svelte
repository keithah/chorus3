<script lang="ts">
  import type { Snippet } from 'svelte';

  import QueuePanel, { type QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import type { RemoteInputPanelRemoteDispatch } from '$components/RemoteInputPanel.svelte';
  import LocalMediaRuntime from '$components/LocalMediaRuntime.svelte';
  import PrimaryAppShell from '$lib/app-shell/AppShell.svelte';
  import type {
    AppShellCallbacks,
    AppShellDestinationState,
    AppShellDrawerState,
    AppShellNavigationItem,
    AppShellPlayerActions,
    AppShellPlayerSnapshot,
    AppShellRouteIdentity
  } from '$lib/app-shell/appShellTypes';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    PlayerStoreSnapshot,
    QueueStoreSnapshot,
    RemoteInputDispatchSnapshot
  } from '$lib/stores';
  import AppRemoteOverlay from './AppRemoteOverlay.svelte';

  interface Props {
    routeIdentity: AppShellRouteIdentity;
    navigationItems: readonly AppShellNavigationItem[];
    stageLabel: string;
    logoHref: string;
    player: AppShellPlayerSnapshot;
    stageArtUrl?: string;
    playerActions: AppShellPlayerActions;
    drawer: AppShellDrawerState;
    destination: AppShellDestinationState;
    callbacks: AppShellCallbacks;
    remoteOverlayOpen: boolean;
    remoteSnapshot: RemoteInputDispatchSnapshot;
    remoteInputDispatch: RemoteInputPanelRemoteDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    remoteOverlayPlayerDispatch: PlayerControlsDispatch;
    i18n: TranslationContext;
    closeRemoteOverlay: () => void;
    queueSnapshot?: QueueStoreSnapshot;
    queueDispatch?: QueuePanelDispatch;
    handleLocalMediaEnded: () => Promise<void>;
    children?: Snippet;
  }

  let {
    routeIdentity,
    navigationItems,
    stageLabel,
    logoHref,
    player,
    stageArtUrl,
    playerActions,
    drawer,
    destination,
    callbacks,
    remoteOverlayOpen,
    remoteSnapshot,
    remoteInputDispatch,
    playerSnapshot,
    remoteOverlayPlayerDispatch,
    i18n,
    closeRemoteOverlay,
    queueSnapshot,
    queueDispatch,
    handleLocalMediaEnded,
    children
  }: Props = $props();
</script>

<PrimaryAppShell
  {routeIdentity}
  {navigationItems}
  {stageLabel}
  {logoHref}
  {player}
  {stageArtUrl}
  {playerActions}
  {drawer}
  {destination}
  {callbacks}
>
  {@render children?.()}

  {#if remoteOverlayOpen}
    <AppRemoteOverlay
      {remoteSnapshot}
      {remoteInputDispatch}
      {playerSnapshot}
      playerDispatch={remoteOverlayPlayerDispatch}
      backgroundUrl={stageArtUrl}
      {i18n}
      onClose={closeRemoteOverlay}
    />
  {/if}

  {#snippet drawerContent()}
    {#if queueSnapshot && queueDispatch}
      <QueuePanel snapshot={queueSnapshot} dispatch={queueDispatch} {i18n} />
    {/if}
  {/snippet}

  {#snippet localRuntime()}
    <LocalMediaRuntime onEnded={handleLocalMediaEnded} />
  {/snippet}
</PrimaryAppShell>
