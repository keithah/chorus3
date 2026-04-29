<script lang="ts">
  import type { QueueDispatchSnapshot, QueueStoreSnapshot } from '$lib/stores';

  export interface QueuePanelDispatch {
    readonly snapshot: QueueDispatchSnapshot;
    removeAt(position: number): Promise<void> | void;
    clear(): Promise<void> | void;
    swap(position1: number, position2: number): Promise<void> | void;
  }

  interface Props {
    snapshot: QueueStoreSnapshot;
    dispatch: QueuePanelDispatch;
  }

  let { snapshot, dispatch }: Props = $props();

  const isDisabled = $derived(
    dispatch.snapshot.commandStatus === 'running' ||
      snapshot.refreshStatus === 'loading' ||
      snapshot.playlistid === null
  );

  const hasPlaylist = $derived(snapshot.playlistid !== null);
  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const isEmpty = $derived(hasPlaylist && !isLoading && snapshot.items.length === 0);

  function sanitize(text: string): string {
    return text
      .replace(/https?:\/\/[^\s]*/gi, '[url]')
      .replace(/smb:\/\/[^\s]*/gi, '[url]')
      .replace(/Authorization[^\s]*/gi, '[header]')
      .replace(/Basic\s+[A-Za-z0-9+/=]+/g, '[credentials]')
      .replace(/p@ssword/gi, '[redacted]')
      .replace(/localStorage/gi, '[storage]');
  }

  function formatDuration(seconds: number | undefined): string | null {
    if (seconds === undefined || seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const statusText = $derived((): string => {
    if (dispatch.snapshot.commandStatus === 'running') {
      return `Running ${dispatch.snapshot.lastCommand ?? 'command'}…`;
    }
    if (dispatch.snapshot.commandStatus === 'error' && dispatch.snapshot.lastError) {
      return sanitize(dispatch.snapshot.lastError.message);
    }
    if (isLoading) {
      return 'Loading queue…';
    }
    if (snapshot.refreshStatus === 'error' && snapshot.lastError) {
      return sanitize(snapshot.lastError.message);
    }
    if (!hasPlaylist) {
      return 'No active Kodi playlist';
    }
    return '';
  });
</script>

<section class="queue-panel" aria-label="Kodi queue">
  <div aria-live="polite" aria-atomic="true" role="status">{statusText()}</div>

  {#if !hasPlaylist}
    <p>No active Kodi playlist. Start playback in Kodi to manage the queue here.</p>
    <button disabled>Clear queue</button>
  {:else if isLoading}
    <p>Loading…</p>
    <button disabled>Clear queue</button>
  {:else if isEmpty}
    <p>The queue is empty.</p>
    <button disabled>Clear queue</button>
  {:else}
    <ol>
      {#each snapshot.items as item (item.position)}
        {@const isActive = item.position === snapshot.activePosition}
        {@const isFirst = item.position === snapshot.items[0].position}
        {@const isLast = item.position === snapshot.items[snapshot.items.length - 1].position}
        {@const duration = formatDuration((item as { duration?: number }).duration)}
        <li aria-current={isActive ? 'true' : undefined}>
          <span>{item.label}</span>
          {#if duration}
            <span>{duration}</span>
          {/if}
          <button
            aria-label="Move {item.label} up"
            disabled={isDisabled || isFirst}
            onclick={() => {
              const idx = snapshot.items.findIndex((x) => x.position === item.position);
              if (idx > 0) dispatch.swap(snapshot.items[idx - 1].position, item.position);
            }}>↑</button
          >
          <button
            aria-label="Move {item.label} down"
            disabled={isDisabled || isLast}
            onclick={() => {
              const idx = snapshot.items.findIndex((x) => x.position === item.position);
              if (idx < snapshot.items.length - 1)
                dispatch.swap(item.position, snapshot.items[idx + 1].position);
            }}>↓</button
          >
          <button
            aria-label="Remove {item.label}"
            disabled={isDisabled}
            onclick={() => dispatch.removeAt(item.position)}>Remove</button
          >
        </li>
      {/each}
    </ol>
    <button disabled={isDisabled} onclick={() => dispatch.clear()}>Clear queue</button>
  {/if}
</section>

<style>
  .queue-panel {
    display: grid;
    gap: var(--space-sm, 0.5rem);
  }

  ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
  }

  li[aria-current='true'] {
    font-weight: 700;
  }
</style>
