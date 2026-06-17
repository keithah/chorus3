<script lang="ts" module>
  import type { TranslationContext } from '$lib/i18n';
  import type {
    AddonsGroupBy,
    AddonsGroupSnapshot,
    AddonsStoreSnapshot,
    AddonSnapshot
  } from '$lib/stores/addonsStore.svelte';
  import { redactAddonText } from '$lib/safety/redaction';

  export type AddonsTypeFilter = 'video' | 'audio' | 'executable';

  export interface AddonsPanelDispatch {
    load: () => void | Promise<void>;
    retry: () => void | Promise<void>;
    setSearchQuery: (query: string) => void | Promise<void>;
    setGroupBy: (groupBy: AddonsGroupBy) => void | Promise<void>;
    setAddonEnabled: (addonid: string, enabled: boolean) => void | Promise<void>;
    executeAddon?: (addonid: string) => void | Promise<void>;
  }
</script>

<script lang="ts">
  import './addonsPanelClassic.css';
  import {
    buildKodiPackageSafePrimaryAppRoute,
    buildPrimaryAppRoute,
    createKodiPackageRouteBuildOptions,
    type BuildAppRouteOptions
  } from '$lib/app/appRouter';
  import { addonsStore } from '$lib/stores/addonsStore.svelte';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';

  interface Props {
    snapshot?: AddonsStoreSnapshot;
    dispatch: AddonsPanelDispatch;
    i18n: TranslationContext;
    typeFilter?: AddonsTypeFilter | null;
    packageBasePath?: string;
    buildOptions?: BuildAppRouteOptions;
  }

  let {
    snapshot: injectedSnapshot,
    dispatch,
    i18n,
    typeFilter = null,
    packageBasePath = '',
    buildOptions
  }: Props = $props();
  const snapshot = $derived(injectedSnapshot ?? addonsStore.snapshot);
  const routeBuildOptions = $derived(resolveBuildOptions(buildOptions, packageBasePath));
  const addonVisibility = createIncrementalVisibility(150);

  function resolveBuildOptions(
    options: BuildAppRouteOptions | undefined,
    basePath: string
  ): BuildAppRouteOptions {
    return options ?? createKodiPackageRouteBuildOptions({ packageBasePath: basePath });
  }

  const isLoading = $derived(snapshot.loadStatus === 'loading');
  const categoryAddons = $derived(filterVisibleAddons(snapshot.addons, typeFilter));
  const filteredVisibleAddons = $derived(filterVisibleAddons(snapshot.visibleAddons, typeFilter));
  const hasInstalledAddons = $derived(categoryAddons.length > 0);
  const hasVisibleAddons = $derived(filteredVisibleAddons.length > 0);
  const renderedGroups = $derived(
    limitRenderedGroups(createRenderedGroups(), addonVisibility.count)
  );

  function callLoad(): void {
    if (isLoading) return;
    void dispatch.load();
  }

  function callRetry(): void {
    void dispatch.retry();
  }

  function updateSearch(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    void dispatch.setSearchQuery(input.value);
  }

  function updateGroupBy(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;
    const value = select.value;
    if (value === 'none' || value === 'type' || value === 'enabled') {
      void dispatch.setGroupBy(value);
    }
  }

  function loadStatusCopy(): string {
    if (snapshot.loadStatus === 'loading') return i18n.t('addons.panel.load.loading');
    if (snapshot.loadStatus === 'error') return i18n.t('addons.panel.load.error');
    if (snapshot.loadStatus === 'success') return i18n.t('addons.panel.load.success');
    return i18n.t('addons.panel.load.idle');
  }

  function groupingCopy(): string {
    if (snapshot.groupBy === 'none') return i18n.t('addons.panel.grouping.none');
    if (snapshot.groupBy === 'type') return i18n.t('addons.panel.grouping.type');
    return i18n.t('addons.panel.grouping.enabled');
  }

  function noInstalledCopy(): string {
    if (typeFilter === 'audio') return i18n.t('addons.panel.noInstalled.audio');
    if (typeFilter === 'video') return i18n.t('addons.panel.noInstalled.video');
    if (typeFilter === 'executable') return i18n.t('addons.panel.noInstalled.executable');
    return i18n.t('addons.panel.noInstalled');
  }

  function filterVisibleAddons(
    addons: readonly AddonSnapshot[],
    filter: AddonsTypeFilter | null
  ): AddonSnapshot[] {
    if (!filter) return [...addons];
    return addons.filter((addon) => addonMatchesTypeFilter(addon, filter));
  }

  function addonMatchesTypeFilter(addon: AddonSnapshot, filter: AddonsTypeFilter): boolean {
    const provides = Array.isArray(addon.provides)
      ? addon.provides.map((value) => safeText(value).trim().toLowerCase())
      : [];
    if (provides.includes(filter)) return true;

    const normalizedType = safeText(addon.type).trim().toLowerCase();
    return (
      (filter === 'audio' && normalizedType === 'xbmc.addon.audio') ||
      (filter === 'video' && normalizedType === 'xbmc.addon.video') ||
      (filter === 'executable' && normalizedType === 'xbmc.addon.executable')
    );
  }

  function canExecuteAddon(addon: AddonSnapshot): boolean {
    if (addon.canExecute === true) return true;
    const normalizedType = safeText(addon.type).trim().toLowerCase();
    return (
      normalizedType === 'xbmc.addon.executable' ||
      normalizedType.includes('.executable') ||
      normalizedType === 'xbmc.python.script' ||
      normalizedType.includes('.script')
    );
  }

  function createRenderedGroups(): AddonsGroupSnapshot[] {
    if (snapshot.groupBy === 'none') {
      return [
        { key: 'all', label: i18n.t('addons.panel.group.none'), addons: filteredVisibleAddons }
      ];
    }

    if (snapshot.groupBy === 'enabled') {
      const enabledGroups: AddonsGroupSnapshot[] = [
        { key: 'enabled', label: i18n.t('addons.panel.enabled'), addons: [] },
        { key: 'disabled', label: i18n.t('addons.panel.disabled'), addons: [] },
        { key: 'unknown', label: i18n.t('addons.panel.enablementUnknown'), addons: [] }
      ];

      for (const addon of filteredVisibleAddons) {
        const index = addon.enabled === true ? 0 : addon.enabled === false ? 1 : 2;
        enabledGroups[index].addons.push(addon);
      }

      return enabledGroups.filter((group) => group.addons.length > 0);
    }

    const groups = new Map<string, AddonsGroupSnapshot>();
    for (const addon of filteredVisibleAddons) {
      const label = typeLabel(addon);
      const key = label || 'unknown';
      const group = groups.get(key) ?? { key, label, addons: [] };
      group.addons.push(addon);
      groups.set(key, group);
    }

    return [...groups.values()];
  }

  function limitRenderedGroups(
    groups: readonly AddonsGroupSnapshot[],
    maxAddons: number
  ): AddonsGroupSnapshot[] {
    let remaining = maxAddons;
    const visibleGroups: AddonsGroupSnapshot[] = [];

    for (const group of groups) {
      if (remaining <= 0) break;
      const addons = group.addons.slice(0, remaining);
      remaining -= addons.length;
      visibleGroups.push({ ...group, addons });
    }

    return visibleGroups.filter((group) => group.addons.length > 0);
  }

  function addonLabel(addon: AddonSnapshot): string {
    const name = safeText(addon.name).trim();
    return name.length > 0 ? name : i18n.t('addons.panel.untitled');
  }

  function typeLabel(addon: AddonSnapshot): string {
    if (addon.providesDefault) {
      return addon.providesDefault === 'audio' ? 'music' : addon.providesDefault;
    }

    const type = safeText(addon.type).trim();
    return type.length > 0 ? type : i18n.t('addons.panel.unknown');
  }

  function versionLabel(addon: AddonSnapshot): string {
    const version = addon.version ? safeText(addon.version).trim() : '';
    return version.length > 0 ? version : i18n.t('addons.panel.unavailable');
  }

  function summaryLabel(addon: AddonSnapshot): string {
    const summary = addon.summary ? safeText(addon.summary).trim() : '';
    return summary.length > 0 ? summary : i18n.t('addons.panel.summaryUnavailable');
  }

  function enabledLabel(addon: AddonSnapshot): string {
    if (addon.enabled === true) return i18n.t('addons.panel.enabled');
    if (addon.enabled === false) return i18n.t('addons.panel.disabled');
    return i18n.t('addons.panel.enablementUnknown');
  }

  function brokenLabel(addon: AddonSnapshot): string | null {
    if (addon.broken === true) return i18n.t('addons.panel.broken');
    if (typeof addon.broken === 'string') {
      const reason = safeText(addon.broken).trim();
      return reason.length > 0
        ? i18n.t('addons.panel.brokenReason', { reason })
        : i18n.t('addons.panel.broken');
    }
    return null;
  }

  function addonDetailHref(addon: AddonSnapshot): string {
    return buildKodiPackageSafePrimaryAppRoute(
      { kind: 'addonDetail', addonid: addon.addonid },
      routeBuildOptions
    );
  }

  function addonPrimaryHref(addon: AddonSnapshot): string {
    if (addon.browseMedia && addon.browsePath) {
      return buildPrimaryAppRoute(
        { kind: 'browserItem', media: addon.browseMedia, itemid: addon.browsePath },
        routeBuildOptions
      );
    }

    if (canExecuteAddon(addon)) {
      return buildPrimaryAppRoute(
        { kind: 'addonExecute', addonid: addon.addonid },
        routeBuildOptions
      );
    }

    return addonDetailHref(addon);
  }

  function addonPrimaryAria(addon: AddonSnapshot): string {
    if (canExecuteAddon(addon) && !addon.browsePath) {
      return i18n.t('addons.panel.executeAria', { name: addonLabel(addon) });
    }
    return i18n.t('addons.panel.openDetails', { name: addonLabel(addon) });
  }

  function handleAddonPrimaryClick(event: MouseEvent, addon: AddonSnapshot): void {
    if (canExecuteAddon(addon) && !addon.browsePath && dispatch.executeAddon) {
      event.preventDefault();
      executeAddon(addon);
    }
  }

  function executeAddon(addon: AddonSnapshot): void {
    if (!canExecuteAddon(addon) || !dispatch.executeAddon) return;
    void dispatch.executeAddon(addon.addonid);
  }

  function safeKey(addon: AddonSnapshot, index: number): string {
    return `${addon.addonid || 'addon'}-${index}`;
  }

  function safeText(value: string): string {
    return redactAddonText(value);
  }
</script>

<section class="addons-panel" aria-labelledby="addons-panel-title">
  <header class="addons-hero">
    <div>
      <h2 id="addons-panel-title">{i18n.t('addons.panel.title')}</h2>
    </div>
    <button type="button" class="addons-primary-action" onclick={callLoad} disabled={isLoading}>
      {i18n.t('addons.panel.reload')}
    </button>
  </header>

  <div class="addons-status-grid" aria-label={i18n.t('addons.panel.statusAria')}>
    <div class="addons-status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('addons.panel.load')}</span>
      <strong>{loadStatusCopy()}</strong>
    </div>
    <div class="addons-status">
      <span>{i18n.t('addons.panel.visible')}</span>
      <strong
        >{i18n.t('addons.panel.visibleCount', {
          visible: filteredVisibleAddons.length,
          total: categoryAddons.length
        })}</strong
      >
    </div>
    <div class="addons-status">
      <span>{i18n.t('addons.panel.grouping')}</span>
      <strong>{groupingCopy()}</strong>
    </div>
  </div>

  {#if snapshot.lastError}
    <div class="addons-alert" role="alert">
      <strong>{safeText(snapshot.lastError.code)}</strong>
      <span>{safeText(snapshot.lastError.message)}</span>
    </div>
  {/if}

  <div class="addons-toolbar" aria-label={i18n.t('addons.panel.controlsAria')}>
    <label for="addon-search">{i18n.t('addons.panel.searchLabel')}</label>
    <input
      id="addon-search"
      name="addon-search"
      type="search"
      value={snapshot.searchQuery}
      aria-label={i18n.t('addons.panel.searchAria')}
      placeholder={i18n.t('addons.panel.searchPlaceholder')}
      oninput={updateSearch}
      disabled={isLoading}
    />

    <label for="addon-group-by">{i18n.t('addons.panel.groupByLabel')}</label>
    <select
      id="addon-group-by"
      name="addon-group-by"
      value={snapshot.groupBy}
      aria-label={i18n.t('addons.panel.groupByAria')}
      onchange={updateGroupBy}
      disabled={isLoading}
    >
      <option value="none">{i18n.t('addons.panel.group.none')}</option>
      <option value="type">{i18n.t('addons.panel.group.type')}</option>
      <option value="enabled">{i18n.t('addons.panel.group.enabled')}</option>
    </select>
  </div>

  {#if snapshot.loadStatus === 'error'}
    <div class="addons-error-actions">
      <p>{i18n.t('addons.panel.errorGuidance')}</p>
      <button type="button" onclick={callRetry}>{i18n.t('addons.panel.retryLoad')}</button>
    </div>
  {/if}

  {#if hasVisibleAddons}
    <div class="addons-groups">
      {#each renderedGroups as group (group.key)}
        {#if group.addons.length > 0}
          <section class="addons-group" aria-labelledby={`addons-group-${group.key}`}>
            <div class="addons-group-heading">
              <h3 id={`addons-group-${group.key}`}>{safeText(group.label)}</h3>
              <span>{i18n.t('addons.panel.groupCount', { count: group.addons.length })}</span>
            </div>
            <div class="addons-card-grid">
              {#each group.addons as addon, index (safeKey(addon, index))}
                <article class="addons-card" class:broken={brokenLabel(addon) !== null}>
                  <div class="addons-card-heading">
                    <a
                      class="addons-card-primary"
                      href={addonPrimaryHref(addon)}
                      aria-label={addonPrimaryAria(addon)}
                      onclick={(event) => handleAddonPrimaryClick(event, addon)}
                    >
                      <span class="addons-card-thumb" aria-hidden="true">K</span>
                      <span>
                        <strong>{addonLabel(addon)}</strong>
                        <small>{typeLabel(addon)}</small>
                      </span>
                    </a>
                    <a
                      class="addons-card-detail"
                      href={addonDetailHref(addon)}
                      aria-label={i18n.t('addons.panel.openDetails', { name: addonLabel(addon) })}
                      >Details</a
                    >
                  </div>
                  <p class="addons-summary">{summaryLabel(addon)}</p>
                  <dl class="addons-meta">
                    <div>
                      <dt>{i18n.t('addons.panel.type')}</dt>
                      <dd>{i18n.t('addons.panel.typeValue', { type: typeLabel(addon) })}</dd>
                    </div>
                    <div>
                      <dt>{i18n.t('addons.panel.version')}</dt>
                      <dd>
                        {i18n.t('addons.panel.versionValue', { version: versionLabel(addon) })}
                      </dd>
                    </div>
                    <div>
                      <dt>{i18n.t('addons.panel.status')}</dt>
                      <dd>{enabledLabel(addon)}</dd>
                    </div>
                    {#if brokenLabel(addon)}
                      <div>
                        <dt>{i18n.t('addons.panel.broken')}</dt>
                        <dd>{brokenLabel(addon)}</dd>
                      </div>
                    {/if}
                  </dl>
                  {#if canExecuteAddon(addon) && dispatch.executeAddon}
                    <div class="addons-actions">
                      <button
                        type="button"
                        onclick={() => executeAddon(addon)}
                        disabled={snapshot.writeStatus === 'pending' || addon.enabled === false}
                        aria-label={i18n.t('addons.panel.executeAria', {
                          name: addonLabel(addon)
                        })}
                      >
                        {i18n.t('addons.panel.execute')}
                      </button>
                    </div>
                  {/if}
                </article>
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    </div>
    {#if addonVisibility.hasMore(filteredVisibleAddons.length)}
      <button type="button" class="addons-show-more" onclick={addonVisibility.showMore}>
        Show more add-ons
      </button>
    {/if}
  {:else if hasInstalledAddons}
    <p class="addons-empty">
      {i18n.t('addons.panel.noMatches', { query: safeText(snapshot.searchQuery) })}
    </p>
  {:else}
    <p class="addons-empty">{noInstalledCopy()}</p>
  {/if}
</section>
