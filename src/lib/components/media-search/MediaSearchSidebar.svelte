<script lang="ts">
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import type { MediaSearchScope } from '$lib/stores/mediaSearch.svelte';
  import type { SearchAddonSetting } from '$lib/stores/searchAddons.svelte';
  import { displayText } from './mediaSearchFormatting';
  import { EXTERNAL_SEARCH_PROVIDERS, LOCAL_SEARCH_LINKS } from './mediaSearchLinks';

  interface Props {
    i18n: TranslationContext;
    buildOptions: BuildAppRouteOptions;
    providerQuery: string;
    selectedScope: MediaSearchScope;
    activeScope: MediaSearchScope;
    customAddonRows: readonly SearchAddonSetting[];
    hasProviderLinks: boolean;
    searchAddonEnabled: boolean;
    pendingAddonSearchId: string | null;
    onAddonSearch: (row: SearchAddonSetting) => void;
  }

  let {
    i18n,
    buildOptions,
    providerQuery,
    selectedScope,
    activeScope,
    customAddonRows,
    hasProviderLinks,
    searchAddonEnabled,
    pendingAddonSearchId,
    onAddonSearch
  }: Props = $props();

  function localSearchHref(scope: MediaSearchScope): string {
    return providerQuery
      ? buildPrimaryAppRoute(
          { kind: 'searchMedia', media: scope, query: providerQuery },
          buildOptions
        )
      : buildPrimaryAppRoute({ kind: 'search' }, buildOptions);
  }

  function isLocalSearchActive(scope: MediaSearchScope): boolean {
    return selectedScope === scope || activeScope === scope;
  }

  function externalSearchUrl(provider: (typeof EXTERNAL_SEARCH_PROVIDERS)[number]): string {
    return provider.buildUrl(encodeURIComponent(providerQuery));
  }

  function addonSearchPluginUrl(row: SearchAddonSetting): string {
    return row.url.replaceAll('[QUERY]', providerQuery).replaceAll('{query}', providerQuery);
  }

  function customAddonSearchHref(row: SearchAddonSetting): string {
    return buildPrimaryAppRoute(
      { kind: 'browserItem', media: row.media, itemid: addonSearchPluginUrl(row) },
      buildOptions
    );
  }

  function canSearchAddon(row: SearchAddonSetting): boolean {
    return Boolean(searchAddonEnabled && hasProviderLinks && pendingAddonSearchId !== row.id);
  }

  function addonButtonLabel(row: SearchAddonSetting): string {
    return `Search ${displayText(row.title, 'add-on')} add-on`;
  }
</script>

<aside class="search-sidebar" aria-label={i18n.t('media.search.sidebarAria')}>
  <section class="sidebar-section">
    <h3>{i18n.t('media.search.localMedia')}</h3>
    <ul class="search-media-links">
      {#each LOCAL_SEARCH_LINKS as [scope, label] (scope)}
        <li>
          <a class:active={isLocalSearchActive(scope)} href={localSearchHref(scope)}>{label}</a>
        </li>
      {/each}
    </ul>
  </section>

  <section class="sidebar-section">
    <h3 id="media-search-providers-title">{i18n.t('media.search.addons')}</h3>
    <ul
      class="provider-search__links search-addon-links"
      aria-labelledby="media-search-providers-title"
    >
      {#each EXTERNAL_SEARCH_PROVIDERS as provider (provider.id)}
        <li>
          {#if hasProviderLinks}
            <a href={externalSearchUrl(provider)} target="_blank" rel="noreferrer">
              {provider.label}
            </a>
          {:else}
            <span class="disabled" aria-disabled="true">{provider.label}</span>
          {/if}
        </li>
      {/each}
      {#each customAddonRows as row (row.id)}
        <li>
          {#if searchAddonEnabled}
            <button
              type="button"
              class="provider-search__addon-button"
              aria-label={addonButtonLabel(row)}
              disabled={!canSearchAddon(row)}
              onclick={() => onAddonSearch(row)}
              data-custom-addon-search-button={row.id}
            >
              {displayText(row.title, 'Add-on search')}
            </button>
          {:else if hasProviderLinks}
            <a href={customAddonSearchHref(row)} data-custom-addon-search={row.id}>
              {displayText(row.title, 'Add-on search')}
            </a>
          {:else}
            <span class="disabled" aria-disabled="true"
              >{displayText(row.title, 'Add-on search')}</span
            >
          {/if}
        </li>
      {/each}
    </ul>
    <a
      class="configure-addons-link"
      href={buildPrimaryAppRoute({ kind: 'settingsSearch' }, buildOptions)}
      >{i18n.t('media.search.configureAddons')}</a
    >
  </section>
</aside>

<style>
  .search-sidebar {
    display: grid;
    align-content: start;
    gap: 1.65rem;
    padding: 1.45rem 1rem 2rem 1.35rem;
    color: var(--color-text-muted);
    background: var(--color-surface-raised);
    border-right: 1px solid var(--color-border-strong);
    box-shadow: 2px 0 4px rgb(0 0 0 / 0.08);
  }

  .sidebar-section {
    display: grid;
    gap: 0.5rem;
  }

  .sidebar-section h3 {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .search-media-links,
  .search-addon-links {
    display: grid;
    gap: 0.2rem;
    padding: 0;
    list-style: none;
  }

  .search-media-links a,
  .search-addon-links a,
  .provider-search__addon-button,
  .configure-addons-link {
    display: inline-block;
    max-width: 100%;
    padding: 0.12rem 0;
    color: var(--color-text);
    font: inherit;
    font-size: 0.95rem;
    font-weight: 400;
    line-height: 1.25;
    text-align: left;
    text-decoration: none;
    overflow-wrap: anywhere;
    background: transparent;
    border: 0;
    border-radius: 0;
    cursor: pointer;
  }

  .search-media-links a.active,
  .search-media-links a:hover,
  .search-addon-links a:hover,
  .provider-search__addon-button:hover:not(:disabled),
  .configure-addons-link:hover {
    color: var(--color-link);
  }

  .configure-addons-link {
    color: var(--color-link);
    font-size: 0.86rem;
  }

  .disabled,
  .provider-search__addon-button:disabled {
    color: var(--color-disabled-text);
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 820px) {
    .search-sidebar {
      border-right: 0;
      border-bottom: 1px solid var(--color-border-strong);
      box-shadow: 0 2px 4px rgb(0 0 0 / 0.08);
    }
  }
</style>
