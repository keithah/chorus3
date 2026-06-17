<script module lang="ts">
  import type {
    LibraryMaintenanceDispatchSnapshot,
    LibraryMaintenanceCommand
  } from '$lib/stores/libraryMaintenanceDispatch.svelte';

  export interface LibraryQuickActionsDispatch {
    readonly snapshot: LibraryMaintenanceDispatchSnapshot;
    scanVideo(): Promise<void> | void;
    scanAudio(): Promise<void> | void;
  }

  type QuickAction = {
    command: LibraryMaintenanceCommand;
    label: string;
    description: string;
    icon: string;
  };

  const QUICK_ACTIONS: readonly QuickAction[] = [
    {
      command: 'scanVideo',
      label: 'Scan video library',
      description: 'Ask Kodi to rescan configured video sources.',
      icon: 'mdi-av-my-library-video'
    },
    {
      command: 'scanAudio',
      label: 'Scan audio library',
      description: 'Ask Kodi to rescan configured music sources.',
      icon: 'mdi-av-my-library-music'
    }
  ];
</script>

<script lang="ts">
  interface Props {
    dispatch: LibraryQuickActionsDispatch;
  }

  let { dispatch }: Props = $props();

  const snapshot = $derived(dispatch.snapshot);
  const isRunning = $derived(snapshot.commandStatus === 'running');
  const lastActionLabel = $derived(
    QUICK_ACTIONS.find((action) => action.command === snapshot.lastCommand)?.label ?? null
  );

  async function runAction(command: LibraryMaintenanceCommand): Promise<void> {
    if (isRunning) {
      return;
    }

    try {
      if (command === 'scanVideo') {
        await dispatch.scanVideo();
      } else {
        await dispatch.scanAudio();
      }
    } catch {
      // Diagnostics are rendered from the sanitized dispatch snapshot.
    }
  }
</script>

<section class="library-quick-actions" aria-labelledby="library-quick-actions-title">
  <div class="quick-actions-header">
    <p class="section-kicker">Library tools</p>
    <h2 id="library-quick-actions-title">Library quick actions</h2>
  </div>

  <div class="quick-action-grid">
    {#each QUICK_ACTIONS as action}
      <button
        type="button"
        class="quick-action"
        disabled={isRunning}
        aria-label={action.label}
        onclick={() => runAction(action.command)}
      >
        <span class={`mdi ${action.icon}`} aria-hidden="true"></span>
        <span>
          <strong>{action.label}</strong>
          <small>{action.description}</small>
        </span>
      </button>
    {/each}
  </div>

  <p class="quick-action-status" role="status" aria-live="polite">
    {#if snapshot.commandStatus === 'running' && lastActionLabel}
      {lastActionLabel} started.
    {:else if snapshot.commandStatus === 'success' && lastActionLabel}
      {lastActionLabel} request sent.
    {:else if snapshot.commandStatus === 'failed' && snapshot.lastError}
      {snapshot.lastError.message}
    {:else}
      Ready to send library scan requests.
    {/if}
  </p>
</section>

<style>
  .library-quick-actions {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-lg);
    background: var(--color-surface);
  }

  .quick-actions-header {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker {
    margin: 0;
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .quick-actions-header h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .quick-action-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .quick-action {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-sm);
    align-items: center;
    min-height: 4.5rem;
    padding: var(--space-md);
    color: var(--color-text);
    text-align: left;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
  }

  .quick-action:disabled {
    cursor: not-allowed;
    opacity: 0.64;
  }

  .quick-action .mdi {
    color: var(--color-accent);
    font-size: 1.5rem;
  }

  .quick-action strong,
  .quick-action small {
    display: block;
  }

  .quick-action small {
    margin-top: 0.2rem;
    color: var(--color-text-muted);
    font-size: 0.82rem;
    line-height: 1.35;
  }

  .quick-action-status {
    min-height: 1.4rem;
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.88rem;
  }

  @media (max-width: 700px) {
    .quick-action-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
