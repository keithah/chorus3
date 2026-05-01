<script lang="ts" module>
  import type {
    AddonsGroupBy,
    AddonsStoreSnapshot,
    AddonSnapshot
  } from '$lib/stores/addonsStore.svelte';

  export interface AddonsPanelDispatch {
    load: () => void | Promise<void>;
    retry: () => void | Promise<void>;
    setSearchQuery: (query: string) => void | Promise<void>;
    setGroupBy: (groupBy: AddonsGroupBy) => void | Promise<void>;
  }
</script>

<script lang="ts">
  import { buildAppRoute } from '$lib/app/appRouter';

  interface Props {
    snapshot: AddonsStoreSnapshot;
    dispatch: AddonsPanelDispatch;
  }

  let { snapshot, dispatch }: Props = $props();

  const isLoading = $derived(snapshot.loadStatus === 'loading');
  const hasInstalledAddons = $derived(snapshot.addons.length > 0);
  const hasVisibleAddons = $derived(snapshot.visibleAddons.length > 0);
  const renderedGroups = $derived(
    snapshot.groupBy === 'none'
      ? [{ key: 'all', label: 'All add-ons', addons: snapshot.visibleAddons }]
      : snapshot.groups
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
    if (snapshot.loadStatus === 'loading') return 'Loading add-ons from Kodi.';
    if (snapshot.loadStatus === 'error') return 'Add-ons could not be loaded.';
    if (snapshot.loadStatus === 'success') return 'Add-ons loaded.';
    return 'Add-ons have not been loaded yet.';
  }

  function addonLabel(addon: AddonSnapshot): string {
    const name = safeText(addon.name).trim();
    return name.length > 0 ? name : 'Untitled add-on';
  }

  function addonId(addon: AddonSnapshot): string {
    const id = safeText(addon.addonid).trim();
    return id.length > 0 ? id : 'unknown-addon';
  }

  function typeLabel(addon: AddonSnapshot): string {
    const type = safeText(addon.type).trim();
    return type.length > 0 ? type : 'unknown';
  }

  function versionLabel(addon: AddonSnapshot): string {
    const version = addon.version ? safeText(addon.version).trim() : '';
    return version.length > 0 ? version : 'unavailable';
  }

  function summaryLabel(addon: AddonSnapshot): string {
    const summary = addon.summary ? safeText(addon.summary).trim() : '';
    return summary.length > 0 ? summary : 'Summary unavailable';
  }

  function enabledLabel(addon: AddonSnapshot): string {
    if (addon.enabled === true) return 'Enabled';
    if (addon.enabled === false) return 'Disabled';
    return 'Enablement unknown';
  }

  function brokenLabel(addon: AddonSnapshot): string | null {
    if (addon.broken === true) return 'Broken';
    if (typeof addon.broken === 'string') {
      const reason = safeText(addon.broken).trim();
      return reason.length > 0 ? `Broken: ${reason}` : 'Broken';
    }
    return null;
  }

  function addonDetailHref(addon: AddonSnapshot): string {
    return buildAppRoute({ kind: 'addonDetail', addonid: addon.addonid });
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
      <p class="addons-eyebrow">Kodi JSON-RPC</p>
      <h2 id="addons-panel-title">Kodi Add-ons</h2>
      <p>
        Browse the normalized installed add-ons snapshot, then open details without exposing Kodi
        paths, credentials, or transport diagnostics.
      </p>
    </div>
    <button type="button" class="addons-primary-action" onclick={callLoad} disabled={isLoading}>
      Reload add-ons
    </button>
  </header>

  <div class="addons-status-grid" aria-label="Add-ons status">
    <div class="addons-status" role="status" aria-live="polite" aria-atomic="true">
      <span>Load</span>
      <strong>{loadStatusCopy()}</strong>
    </div>
    <div class="addons-status">
      <span>Visible</span>
      <strong>{snapshot.visibleAddons.length} of {snapshot.addons.length} add-ons</strong>
    </div>
    <div class="addons-status">
      <span>Grouping</span>
      <strong>{snapshot.groupBy === 'none' ? 'Ungrouped' : `Grouped by ${snapshot.groupBy}`}</strong
      >
    </div>
  </div>

  {#if snapshot.lastError}
    <div class="addons-alert" role="alert">
      <strong>{safeText(snapshot.lastError.code)}</strong>
      <span>{safeText(snapshot.lastError.message)}</span>
    </div>
  {/if}

  <div class="addons-toolbar" aria-label="Add-ons list controls">
    <label for="addon-search">Search add-ons</label>
    <input
      id="addon-search"
      name="addon-search"
      type="search"
      value={snapshot.searchQuery}
      aria-label="Search installed add-ons"
      placeholder="Search name, ID, type, or summary"
      oninput={updateSearch}
      disabled={isLoading}
    />

    <label for="addon-group-by">Group by</label>
    <select
      id="addon-group-by"
      name="addon-group-by"
      value={snapshot.groupBy}
      aria-label="Group add-ons"
      onchange={updateGroupBy}
      disabled={isLoading}
    >
      <option value="none">No grouping</option>
      <option value="type">Type</option>
      <option value="enabled">Enabled status</option>
    </select>
  </div>

  {#if snapshot.loadStatus === 'error'}
    <div class="addons-error-actions">
      <p>Review the safe diagnostic above, then retry after the Kodi host or response is fixed.</p>
      <button type="button" onclick={callRetry}>Retry add-ons load</button>
    </div>
  {/if}

  {#if hasVisibleAddons}
    <div class="addons-groups">
      {#each renderedGroups as group (group.key)}
        {#if group.addons.length > 0}
          <section class="addons-group" aria-labelledby={`addons-group-${group.key}`}>
            <div class="addons-group-heading">
              <h3 id={`addons-group-${group.key}`}>{safeText(group.label)}</h3>
              <span>{group.addons.length} add-ons</span>
            </div>

            <div class="addons-card-grid">
              {#each group.addons as addon, index (safeKey(addon, index))}
                <article class="addons-card" class:broken={brokenLabel(addon) !== null}>
                  <div class="addons-card-heading">
                    <div>
                      <h4>{addonLabel(addon)}</h4>
                      <p>{addonId(addon)}</p>
                    </div>
                    <a href={addonDetailHref(addon)}>Open {addonLabel(addon)} details</a>
                  </div>

                  <p class="addons-summary">{summaryLabel(addon)}</p>

                  <dl class="addons-meta">
                    <div>
                      <dt>Type</dt>
                      <dd>Type {typeLabel(addon)}</dd>
                    </div>
                    <div>
                      <dt>Version</dt>
                      <dd>Version {versionLabel(addon)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{enabledLabel(addon)}</dd>
                    </div>
                  </dl>

                  <div class="addons-badges" aria-label={`${addonLabel(addon)} badges`}>
                    <span>{enabledLabel(addon)}</span>
                    {#if brokenLabel(addon)}
                      <span class="danger">{brokenLabel(addon)}</span>
                    {/if}
                    {#if addon.dependencyCount > 0}
                      <span>{addon.dependencyCount} dependencies</span>
                    {/if}
                    {#if addon.extrainfoCount > 0}
                      <span>{addon.extrainfoCount} extra fields</span>
                    {/if}
                  </div>
                </article>
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    </div>
  {:else if hasInstalledAddons}
    <p class="addons-empty">No add-ons match “{safeText(snapshot.searchQuery)}”.</p>
  {:else}
    <p class="addons-empty">No installed add-ons are available.</p>
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
    align-items: end;
    padding: var(--space-xl);
    overflow: hidden;
    background:
      radial-gradient(
        circle at top left,
        color-mix(in srgb, var(--color-accent) 22%, transparent),
        transparent 38%
      ),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--color-surface-raised) 86%, transparent),
        var(--color-surface)
      );
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-soft);
  }

  .addons-eyebrow,
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
  h4,
  p,
  dl,
  dd {
    margin: 0;
  }

  h2 {
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 0.95;
  }

  h3 {
    font-size: clamp(1.1rem, 2vw, 1.35rem);
  }

  h4 {
    font-size: 1.05rem;
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
  select,
  a {
    border-radius: var(--radius-md);
  }

  button,
  input,
  select {
    border: 1px solid var(--color-border);
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
    color: var(--color-text);
    font-weight: 800;
    background: color-mix(in srgb, var(--color-surface-raised) 84%, transparent);
  }

  .addons-primary-action:not(:disabled):hover,
  .addons-error-actions button:not(:disabled):hover,
  .addons-card a:hover {
    border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, transparent);
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
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
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
    color: var(--color-text);
    background: var(--color-surface-raised);
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
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  }

  .addons-card {
    display: grid;
    gap: var(--space-md);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-surface-raised) 44%, transparent),
        transparent
      ),
      var(--color-surface);
  }

  .addons-card.broken {
    border-color: color-mix(
      in srgb,
      var(--color-warning, var(--color-accent)) 42%,
      var(--color-border)
    );
  }

  .addons-card-heading p,
  .addons-summary,
  .addons-empty,
  .addons-error-actions p {
    color: var(--color-text-muted);
  }

  .addons-card a {
    padding: var(--space-2xs) var(--space-sm);
    color: var(--color-text);
    text-decoration: none;
    border: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-background) 32%, transparent);
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
