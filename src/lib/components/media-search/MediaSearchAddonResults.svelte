<script lang="ts">
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    MediaSearchAddonResultGroup,
    MediaSearchAddonResultItem
  } from '../MediaSearchPanel.svelte';
  import { displayText, textOrNull } from '../textFormatting';

  interface Props {
    groups: MediaSearchAddonResultGroup[];
    i18n: TranslationContext;
    buildOptions: BuildAppRouteOptions;
  }

  let { groups, i18n, buildOptions }: Props = $props();

  function addonItemHref(
    group: MediaSearchAddonResultGroup,
    item: MediaSearchAddonResultItem
  ): string {
    return buildPrimaryAppRoute(
      { kind: 'browserItem', media: group.row.media, itemid: item.file },
      buildOptions
    );
  }

  function addonResultLabel(item: MediaSearchAddonResultItem, fallbackIndex: number): string {
    return displayText(item.title ?? item.label, `Result ${fallbackIndex + 1}`);
  }

  function addonResultMeta(item: MediaSearchAddonResultItem): string {
    return textOrNull(item.filetype) ?? i18n.t('media.search.addonResult');
  }
</script>

{#if groups.length > 0}
  <section class="addon-results-shell" aria-labelledby="media-search-addon-results-title">
    <h3 id="media-search-addon-results-title">{i18n.t('media.search.addonResults')}</h3>
    {#each groups as group (group.row.id)}
      <section
        class="result-section result-section--rows"
        aria-label={`${displayText(group.row.title, 'Add-on')} results`}
      >
        <div class="section-heading">
          <h4>{displayText(group.row.title, 'Add-on')} results</h4>
          <p>{group.items.length} result{group.items.length === 1 ? '' : 's'}</p>
        </div>
        {#if group.items.length === 0}
          <p class="empty-copy">{i18n.t('media.search.noAddonResults')}</p>
        {:else}
          <ul class="result-list">
            {#each group.items as item, index (item.file)}
              <li class="result-card">
                <span class="item-kicker">{addonResultMeta(item)}</span>
                <a class="item-title" href={addonItemHref(group, item)}>
                  {addonResultLabel(item, index)}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  </section>
{/if}

<style>
  @import './media-search-results.css';

  .addon-results-shell {
    display: grid;
    gap: 1.8rem;
    margin-top: 1.35rem;
  }

  .result-section {
    display: grid;
    gap: 0.65rem;
    min-width: 0;
  }

  .section-heading {
    display: flex;
    align-items: baseline;
    gap: 0.7rem;
  }

  .section-heading h4,
  .addon-results-shell > h3 {
    color: var(--color-text);
    font-size: 1.45rem;
    font-weight: 300;
    line-height: 1.2;
  }

  .section-heading p {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .empty-copy {
    color: var(--color-text-muted);
    line-height: 1.5;
  }
</style>
