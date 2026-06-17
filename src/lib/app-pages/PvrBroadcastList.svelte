<script lang="ts">
  import type { PvrBroadcastSnapshot } from '$lib/stores';

  interface Props {
    broadcasts: readonly PvrBroadcastSnapshot[];
    visibleBroadcasts: readonly PvrBroadcastSnapshot[];
    ariaLabel: string;
    hasMore: boolean;
    showMore: () => void;
    play: () => void;
    record: () => void;
    toggleTimer: (broadcast: PvrBroadcastSnapshot) => void;
    formatClock?: (value?: string) => string;
    cardRows?: boolean;
  }

  let {
    broadcasts,
    visibleBroadcasts,
    ariaLabel,
    hasMore,
    showMore,
    play,
    record,
    toggleTimer,
    formatClock = (value?: string) => value ?? '',
    cardRows = false
  }: Props = $props();
</script>

{#if broadcasts.length === 0}
  <p class="empty-state">No broadcasts found.</p>
{:else}
  <div class:programmes={cardRows} class="broadcast-list" aria-label={ariaLabel}>
    {#each visibleBroadcasts as broadcast (broadcast.broadcastid)}
      <article
        class:active={broadcast.isactive}
        class:aired={cardRows && broadcast.wasactive}
        class:airing={cardRows && broadcast.isactive}
        class:hasTimer={cardRows && (broadcast.hastimer || broadcast.hastimerrule)}
        class:pvr-card={cardRows}
        class="broadcast-row"
      >
        <span class="broadcast-time">
          {formatClock(broadcast.starttime) || broadcast.starttime || ''}
          {#if broadcast.endtime}
            <small>{formatClock(broadcast.endtime) || broadcast.endtime}</small>
          {/if}
        </span>
        <span class="pvr-card__text">
          <strong>{broadcast.title ?? broadcast.label}</strong>
          {#if broadcast.plot}
            <span>{broadcast.plot}</span>
          {/if}
        </span>
        <button type="button" class="pvr-play" onclick={play}>Play</button>
        <button type="button" class="pvr-play" onclick={record}>Record</button>
        <button type="button" class="pvr-play" onclick={() => toggleTimer(broadcast)}>
          {broadcast.hastimer || broadcast.hastimerrule ? 'Timer on' : 'Timer'}
        </button>
      </article>
    {/each}
  </div>
  {#if hasMore}
    <button type="button" class="pvr-show-more" onclick={showMore}>Show more broadcasts</button>
  {/if}
{/if}
