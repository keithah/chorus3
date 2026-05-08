<script lang="ts">
  import type { QueueDispatchSnapshot, QueueStoreSnapshot } from '$lib/stores';
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import { redactDiagnosticText } from '$lib/safety/redaction';

  export interface QueuePanelDispatch {
    readonly snapshot: QueueDispatchSnapshot;
    removeAt(position: number): Promise<void> | void;
    clear(): Promise<void> | void;
    swap(position1: number, position2: number): Promise<void> | void;
  }

  interface Props {
    snapshot: QueueStoreSnapshot;
    dispatch: QueuePanelDispatch;
    i18n?: TranslationContext;
  }

  let { snapshot, dispatch, i18n = createTranslationContext('en') }: Props = $props();

  const isDisabled = $derived(
    dispatch.snapshot.commandStatus === 'running' ||
      snapshot.refreshStatus === 'loading' ||
      snapshot.playlistid === null
  );

  const hasPlaylist = $derived(snapshot.playlistid !== null);
  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const isEmpty = $derived(hasPlaylist && !isLoading && snapshot.items.length === 0);

  function sanitize(text: string): string {
    return redactDiagnosticText(text);
  }

  function itemLabel(item: QueueStoreSnapshot['items'][number]): string {
    const sanitized = sanitize(item.label).trim();
    return sanitized.length > 0 ? sanitized : `Item ${item.position + 1}`;
  }

  function formatDuration(seconds: number | undefined): string | null {
    if (seconds === undefined || seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const statusText = $derived((): string => {
    if (dispatch.snapshot.commandStatus === 'running') {
      return i18n.t('queue.panel.running', { command: dispatch.snapshot.lastCommand ?? 'command' });
    }
    if (dispatch.snapshot.commandStatus === 'error' && dispatch.snapshot.lastError) {
      return sanitize(dispatch.snapshot.lastError.message);
    }
    if (isLoading) {
      return i18n.t('queue.panel.loadingQueue');
    }
    if (snapshot.refreshStatus === 'error' && snapshot.lastError) {
      return sanitize(snapshot.lastError.message);
    }
    if (!hasPlaylist) {
      return i18n.t('queue.panel.noActive');
    }
    return '';
  });
</script>

<section class="queue-panel" aria-label={i18n.t('queue.panel.aria')}>
  <div aria-live="polite" aria-atomic="true" role="status">{statusText()}</div>

  {#if !hasPlaylist}
    <p>{i18n.t('queue.panel.noActiveDescription')}</p>
    <button disabled>{i18n.t('queue.panel.clear')}</button>
  {:else if isLoading}
    <p>{i18n.t('queue.panel.loading')}</p>
    <button disabled>{i18n.t('queue.panel.clear')}</button>
  {:else if isEmpty}
    <p>{i18n.t('queue.panel.empty')}</p>
    <button disabled>{i18n.t('queue.panel.clear')}</button>
  {:else}
    <ol>
      {#each snapshot.items as item (item.position)}
        {@const isActive = item.position === snapshot.activePosition}
        {@const isFirst = item.position === snapshot.items[0].position}
        {@const isLast = item.position === snapshot.items[snapshot.items.length - 1].position}
        {@const duration = formatDuration((item as { duration?: number }).duration)}
        {@const label = itemLabel(item)}
        <li aria-current={isActive ? 'true' : undefined}>
          <span>{label}</span>
          {#if duration}
            <span>{duration}</span>
          {/if}
          <button
            aria-label={i18n.t('queue.panel.moveUp', { label })}
            disabled={isDisabled || isFirst}
            onclick={() => {
              const idx = snapshot.items.findIndex((x) => x.position === item.position);
              if (idx > 0) dispatch.swap(snapshot.items[idx - 1].position, item.position);
            }}>↑</button
          >
          <button
            aria-label={i18n.t('queue.panel.moveDown', { label })}
            disabled={isDisabled || isLast}
            onclick={() => {
              const idx = snapshot.items.findIndex((x) => x.position === item.position);
              if (idx < snapshot.items.length - 1)
                dispatch.swap(item.position, snapshot.items[idx + 1].position);
            }}>↓</button
          >
          <button
            aria-label={i18n.t('queue.panel.removeAria', { label })}
            disabled={isDisabled}
            onclick={() => dispatch.removeAt(item.position)}>{i18n.t('queue.panel.remove')}</button
          >
        </li>
      {/each}
    </ol>
    <button disabled={isDisabled} onclick={() => dispatch.clear()}
      >{i18n.t('queue.panel.clear')}</button
    >
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
