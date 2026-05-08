<script lang="ts" module>
  import type { TranslationContext } from '$lib/i18n';
  import type {
    AddonsGroupBy,
    AddonsGroupSnapshot,
    AddonsStoreSnapshot,
    AddonSnapshot
  } from '$lib/stores/addonsStore.svelte';

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
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';

  interface Props {
    snapshot: AddonsStoreSnapshot;
    dispatch: AddonsPanelDispatch;
    i18n: TranslationContext;
    typeFilter?: AddonsTypeFilter | null;
    packageBasePath?: string;
    buildOptions?: BuildAppRouteOptions;
  }

  let {
    snapshot,
    dispatch,
    i18n,
    typeFilter = null,
    packageBasePath = '',
    buildOptions
  }: Props = $props();
  const routeBuildOptions = $derived(resolveBuildOptions(buildOptions, packageBasePath));

  function resolveBuildOptions(
    options: BuildAppRouteOptions | undefined,
    basePath: string
  ): BuildAppRouteOptions {
    return options ?? { packageBasePath: basePath, routeMode: basePath ? 'hash' : 'path' };
  }

  const isLoading = $derived(snapshot.loadStatus === 'loading');
  const filteredVisibleAddons = $derived(filterVisibleAddons(snapshot.visibleAddons, typeFilter));
  const hasInstalledAddons = $derived(snapshot.addons.length > 0);
  const hasVisibleAddons = $derived(filteredVisibleAddons.length > 0);
  const renderedGroups = $derived(createRenderedGroups());

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

  function filterVisibleAddons(
    addons: readonly AddonSnapshot[],
    filter: AddonsTypeFilter | null
  ): AddonSnapshot[] {
    if (!filter) return addons.filter(addonIsContentProvider);
    return addons.filter((addon) => addonMatchesTypeFilter(addon, filter));
  }

  function addonIsContentProvider(addon: AddonSnapshot): boolean {
    return (
      addonMatchesTypeFilter(addon, 'video') ||
      addonMatchesTypeFilter(addon, 'audio') ||
      addonMatchesTypeFilter(addon, 'executable')
    );
  }

  function addonMatchesTypeFilter(addon: AddonSnapshot, filter: AddonsTypeFilter): boolean {
    const provides = Array.isArray(addon.provides) ? addon.provides : [];
    if (filter === 'video' && provides.length > 0) return provides.includes('video');
    if (filter === 'audio' && provides.length > 0) return provides.includes('audio');
    if (filter === 'executable' && addon.canExecute === true) return true;

    const normalizedType = safeText(addon.type).trim().toLowerCase();
    if (!normalizedType) return false;
    if (filter === 'executable') return canExecuteAddon(addon);
    return normalizedType === `xbmc.addon.${filter}` || normalizedType.includes(`.${filter}`);
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
      return [
        {
          key: 'enabled',
          label: i18n.t('addons.panel.enabled'),
          addons: filteredVisibleAddons.filter((addon) => addon.enabled === true)
        },
        {
          key: 'disabled',
          label: i18n.t('addons.panel.disabled'),
          addons: filteredVisibleAddons.filter((addon) => addon.enabled === false)
        },
        {
          key: 'unknown',
          label: i18n.t('addons.panel.enablementUnknown'),
          addons: filteredVisibleAddons.filter(
            (addon) => addon.enabled !== true && addon.enabled !== false
          )
        }
      ].filter((group) => group.addons.length > 0);
    }

    const groups = new Map<string, AddonsGroupSnapshot>();
    for (const addon of filteredVisibleAddons) {
      const label = typeLabel(addon);
      const key = label || 'unknown';
      const group = groups.get(key) ?? { key, label, addons: [] };
      group.addons = [...group.addons, addon];
      groups.set(key, group);
    }

    return [...groups.values()];
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

  function dependencyLabel(addon: AddonSnapshot): string {
    return addon.dependencyCount === 1
      ? i18n.t('addons.panel.dependencies.one')
      : i18n.t('addons.panel.dependencies.many', { count: addon.dependencyCount });
  }

  function extraInfoLabel(addon: AddonSnapshot): string {
    return addon.extrainfoCount === 1
      ? i18n.t('addons.panel.extraFields.one')
      : i18n.t('addons.panel.extraFields.many', { count: addon.extrainfoCount });
  }

  function addonDetailHref(addon: AddonSnapshot): string {
    return buildPrimaryAppRoute({ kind: 'addonDetail', addonid: addon.addonid }, routeBuildOptions);
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
    return value
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
      .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s]+/gi, '[redacted-url]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=._-]+/gi, 'credentials [redacted]')
      .replace(/username or password/gi, 'credentials')
      .replace(/admin:p@ssword/gi, '[redacted-secret]')
      .replace(/p@ssword/gi, '[redacted-secret]')
      .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
      .replace(/\/[\w./-]+/gi, '[redacted-path]')
      .replace(/localStorage/gi, 'browser storage')
      .replace(/sessionStorage/gi, 'browser storage')
      .replace(/CHORUS_SENTINEL_SECRET|SENTINEL_SECRET/gi, '[redacted-sentinel]')
      .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
      .replace(/password/gi, 'credentials');
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
          total: snapshot.addons.length
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
                  </dl>
                  <div
                    class="addons-badges"
                    aria-label={i18n.t('addons.panel.badgesAria', { name: addonLabel(addon) })}
                  >
                    <span>{enabledLabel(addon)}</span>
                    {#if brokenLabel(addon)}<span class="danger">{brokenLabel(addon)}</span>{/if}
                    {#if addon.dependencyCount > 0}<span>{dependencyLabel(addon)}</span>{/if}
                    {#if addon.extrainfoCount > 0}<span>{extraInfoLabel(addon)}</span>{/if}
                  </div>
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
  {:else if hasInstalledAddons}
    <p class="addons-empty">
      {i18n.t('addons.panel.noMatches', { query: safeText(snapshot.searchQuery) })}
    </p>
  {:else}
    <p class="addons-empty">{i18n.t('addons.panel.noInstalled')}</p>
  {/if}
</section>

<style>
  .addons-panel {
    display: grid;
    gap: var(--space-lg);
  }

  .addons-hero,
  .addons-status-grid,
  .addons-toolbar,
  .addons-group,
  .addons-card-grid,
  .addons-card-heading,
  .addons-meta {
    display: grid;
    gap: var(--space-md);
  }

  .addons-hero {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-height: 50px;
    padding: 0.75rem 1rem;
    background: #f7f7f7;
    border-bottom: 1px solid #d0d0d0;
  }

  .addons-status span,
  .addons-group-heading span,
  .addons-meta dt,
  .addons-badges span {
    margin: 0;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2,
  h3,
  p,
  dl,
  dd {
    margin: 0;
  }

  h2 {
    color: #555;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1.2;
  }

  h3 {
    font-size: clamp(1.1rem, 2vw, 1.35rem);
  }

  p,
  dd,
  label,
  button,
  input,
  select,
  a {
    line-height: 1.5;
  }

  button,
  input,
  select {
    border: 1px solid #c8c8c8;
  }

  button {
    cursor: pointer;
  }

  button:disabled,
  input:disabled,
  select:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .addons-primary-action,
  .addons-error-actions button {
    padding: var(--space-xs) var(--space-md);
    color: #333;
    font-weight: 800;
    background: #9e9e9e;
    color: white;
  }

  .addons-primary-action:not(:disabled):hover,
  .addons-error-actions button:not(:disabled):hover,
  .addons-card a:hover {
    background: #777;
  }

  .addons-status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .addons-status,
  .addons-alert,
  .addons-toolbar,
  .addons-error-actions,
  .addons-group,
  .addons-card,
  .addons-empty {
    padding: var(--space-md);
    background: #f7f7f7;
    border: 1px solid #d0d0d0;
  }

  .addons-status {
    display: grid;
    gap: var(--space-2xs);
  }

  .addons-alert {
    display: grid;
    gap: var(--space-2xs);
    color: var(--color-danger, var(--color-warning));
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 42%,
      var(--color-border)
    );
  }

  .addons-toolbar {
    grid-template-columns: auto minmax(14rem, 1fr) auto minmax(10rem, 0.35fr);
    align-items: center;
  }

  .addons-toolbar input,
  .addons-toolbar select {
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
    color: #333;
    background: white;
  }

  .addons-error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm) var(--space-md);
    align-items: center;
    justify-content: space-between;
  }

  .addons-groups {
    display: grid;
    gap: var(--space-lg);
  }

  .addons-group-heading,
  .addons-card-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
    align-items: start;
  }

  .addons-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  .addons-card {
    display: grid;
    gap: 0;
    padding: 0;
    overflow: hidden;
    background: white;
    box-shadow: 0 1px 3px rgb(0 0 0 / 14%);
  }

  .addons-card.broken {
    border-color: color-mix(
      in srgb,
      var(--color-warning, var(--color-accent)) 42%,
      var(--color-border)
    );
  }

  .addons-summary,
  .addons-empty,
  .addons-error-actions p {
    color: var(--color-text-muted);
  }

  .addons-card a {
    color: #333;
    text-decoration: none;
  }

  .addons-card-primary {
    display: grid;
    grid-template-rows: 132px auto;
    min-width: 0;
  }

  .addons-card-primary span:last-child {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
    padding: 0.55rem 0.65rem;
  }

  .addons-card-primary strong,
  .addons-card-primary small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .addons-card-primary small {
    color: #888;
  }

  .addons-card-thumb {
    display: grid;
    place-items: center;
    background: #cfcfcf;
    color: #aaa;
    font-size: 3rem;
    font-weight: 700;
  }

  .addons-card-detail {
    padding: 0.45rem 0.65rem;
    border-top: 1px solid #eee;
    color: #42a5dc;
  }

  .addons-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .addons-meta div,
  .addons-badges span {
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-background) 34%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 76%, transparent);
    border-radius: var(--radius-md);
  }

  .addons-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .addons-actions {
    display: flex;
    justify-content: flex-end;
  }

  .addons-actions button {
    padding: var(--space-2xs) var(--space-sm);
    color: var(--color-text);
    font-weight: 800;
    background: color-mix(in srgb, var(--color-background) 32%, transparent);
  }

  .addons-actions button:not(:disabled):hover {
    border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
  }

  .addons-badges .danger {
    color: var(--color-danger, var(--color-warning));
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 42%,
      var(--color-border)
    );
  }

  @media (max-width: 760px) {
    .addons-hero,
    .addons-status-grid,
    .addons-toolbar,
    .addons-group-heading,
    .addons-card-heading,
    .addons-meta {
      grid-template-columns: 1fr;
    }
  }
</style>
