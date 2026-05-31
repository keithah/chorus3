<script lang="ts">
  import type { BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import type { MediaSearchResult } from '$lib/stores/mediaSearch.svelte';
  import type { MediaSearchActionItem } from './mediaSearchResultDisplay';
  import {
    resultHref,
    resultImageUrl,
    resultLabel,
    resultLayout,
    resultMeta,
    resultStableKey,
    searchActionFor,
    type ResultGroupKey
  } from './mediaSearchResultDisplay';

  type MusicActionVerb = 'play' | 'queue';

  interface Props {
    kind: ResultGroupKey;
    results: MediaSearchResult[];
    i18n: TranslationContext;
    buildOptions: BuildAppRouteOptions;
    isActionDisabled: (item: MediaSearchActionItem) => boolean;
    onMusicAction: (
      verb: MusicActionVerb,
      item: MediaSearchActionItem,
      targetLabel: string
    ) => void;
    actionLabel: (verb: MusicActionVerb, item: MediaSearchActionItem, label: string) => string;
    actionTargetLabel: (item: MediaSearchActionItem, label: string) => string;
    itemKindLabel: (kind: MediaSearchActionItem['kind']) => string;
  }

  let {
    kind,
    results,
    i18n,
    buildOptions,
    isActionDisabled,
    onMusicAction,
    actionLabel,
    actionTargetLabel,
    itemKindLabel
  }: Props = $props();

  const layout = $derived(resultLayout(kind));
</script>

<ul class="result-list">
  {#each results as result, index (resultStableKey(result, index))}
    {@const label = resultLabel(result, i18n)}
    {@const href = resultHref(result, buildOptions)}
    {@const meta = resultMeta(result, i18n)}
    {@const imageUrl = resultImageUrl(result)}
    {@const actionItem = searchActionFor(result)}
    <li
      class="result-card"
      data-songid={result.kind === 'song' ? result.songid : undefined}
    >
      {#if layout === 'poster' || layout === 'square'}
        <span class="result-art" aria-hidden="true">
          {#if imageUrl}
            <img src={imageUrl} alt="" loading="lazy" decoding="async" />
          {:else}
            <span>{label.slice(0, 1)}</span>
          {/if}
        </span>
      {/if}

      {#if href}
        <a class="item-title" {href}>{label}</a>
      {:else}
        <span class="item-title">{label}</span>
      {/if}

      {#if result.kind === 'song'}
        <span class="identity-chip">{i18n.t('media.songId', { songid: result.songid })}</span>
      {/if}

      {#if meta}
        <span class="item-meta">{meta}</span>
      {/if}

      {#if actionItem}
        <div
          class="action-row"
          aria-label={i18n.t('media.action.actionsFor', {
            kind: itemKindLabel(actionItem.kind),
            label
          })}
        >
          <button
            type="button"
            class="action-button"
            aria-label={actionLabel('play', actionItem, label)}
            disabled={isActionDisabled(actionItem)}
            onclick={() =>
              onMusicAction('play', actionItem, actionTargetLabel(actionItem, label))}
          >
            {i18n.t('media.action.play')}
          </button>
          <button
            type="button"
            class="action-button"
            aria-label={actionLabel('queue', actionItem, label)}
            disabled={isActionDisabled(actionItem)}
            onclick={() =>
              onMusicAction('queue', actionItem, actionTargetLabel(actionItem, label))}
          >
            {i18n.t('media.action.queue')}
          </button>
        </div>
      {/if}
    </li>
  {/each}
</ul>

<style>
  @import './media-search-results.css';
</style>
