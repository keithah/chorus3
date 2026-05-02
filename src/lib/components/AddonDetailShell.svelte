<script lang="ts" module>
  import type { TranslationContext } from '$lib/i18n';
  import type { AddonSnapshot, AddonsStoreSnapshot } from '$lib/stores/addonsStore.svelte';

  export interface AddonDetailDispatch {
    load: () => void | Promise<void>;
    retry: () => void | Promise<void>;
    setAddonEnabled: (addonid: string, enabled: boolean) => void | Promise<void>;
    back?: () => void | Promise<void>;
  }
</script>

<script lang="ts">
  interface Props {
    snapshot: AddonsStoreSnapshot;
    dispatch: AddonDetailDispatch;
    i18n: TranslationContext;
  }
  type PendingConfirmation = { addonid: string; enabled: boolean } | null;
  let { snapshot, dispatch, i18n }: Props = $props();
  let pendingConfirmation = $state<PendingConfirmation>(null);

  const detail = $derived(snapshot.detail);
  const selectedAddonId = $derived(snapshot.selectedAddonId ?? detail?.addonid ?? null);
  const isBusy = $derived(
    snapshot.loadStatus === 'loading' ||
      snapshot.detailStatus === 'loading' ||
      snapshot.writeStatus === 'pending'
  );
  const canToggle = $derived(Boolean(detail && typeof detail.enabled === 'boolean'));

  function callLoad(): void {
    if (!isBusy) void dispatch.load();
  }
  function callRetry(): void {
    void dispatch.retry();
  }
  function callBack(): void {
    void dispatch.back?.();
  }
  function requestToggle(addon: AddonSnapshot): void {
    if (!isBusy && typeof addon.enabled === 'boolean')
      pendingConfirmation = { addonid: addon.addonid, enabled: !addon.enabled };
  }
  function cancelToggle(): void {
    pendingConfirmation = null;
  }
  function confirmToggle(): void {
    if (!pendingConfirmation || isBusy) return;
    const { addonid, enabled } = pendingConfirmation;
    pendingConfirmation = null;
    void dispatch.setAddonEnabled(addonid, enabled);
  }

  function detailStatusCopy(): string {
    if (snapshot.detailStatus === 'loading') return i18n.t('addon.detail.detail.loading');
    if (snapshot.detailStatus === 'error') return i18n.t('addon.detail.detail.error');
    if (snapshot.detailStatus === 'success' && detail) return i18n.t('addon.detail.detail.success');
    return i18n.t('addon.detail.detail.idle');
  }
  function writeStatusCopy(): string {
    if (snapshot.writeStatus === 'pending') return i18n.t('addon.detail.write.pending');
    if (snapshot.writeStatus === 'success') return i18n.t('addon.detail.write.success');
    if (snapshot.writeStatus === 'error') return i18n.t('addon.detail.write.error');
    return i18n.t('addon.detail.write.idle');
  }
  function addonLabel(addon: AddonSnapshot | null): string {
    const name = safeText(addon?.name ?? '').trim();
    return name.length > 0 ? name : i18n.t('addons.panel.untitled');
  }
  function addonIdLabel(addon: AddonSnapshot | null): string {
    const id = safeText(addon?.addonid ?? selectedAddonId ?? '').trim();
    return id.length > 0 ? id : i18n.t('addons.panel.unknownAddon');
  }
  function typeLabel(addon: AddonSnapshot): string {
    const type = safeText(addon.type).trim();
    return type.length > 0 ? type : i18n.t('addons.panel.unknown');
  }
  function versionLabel(addon: AddonSnapshot): string {
    const version = addon.version ? safeText(addon.version).trim() : '';
    return version.length > 0 ? version : i18n.t('addons.panel.unavailable');
  }
  function optionalCopy(value: string | null, fallback: string): string {
    const safe = value ? safeText(value).trim() : '';
    return safe.length > 0 ? safe : fallback;
  }
  function enabledLabel(addon: AddonSnapshot): string {
    if (addon.enabled === true) return i18n.t('addons.panel.enabled');
    if (addon.enabled === false) return i18n.t('addons.panel.disabled');
    return i18n.t('addons.panel.enablementUnknown');
  }
  function enabledStateLabel(enabled: boolean): string {
    return enabled
      ? i18n.t('addons.panel.enabled').toLowerCase()
      : i18n.t('addons.panel.disabled').toLowerCase();
  }
  function toggleButtonLabel(addon: AddonSnapshot | null): string {
    if (!addon || typeof addon.enabled !== 'boolean')
      return i18n.t('addon.detail.toggleUnavailable');
    return addon.enabled ? i18n.t('addon.detail.disable') : i18n.t('addon.detail.enable');
  }
  function actionVerb(enabled: boolean): string {
    return enabled ? i18n.t('addon.detail.action.enable') : i18n.t('addon.detail.action.disable');
  }
  function writeActionVerb(enabled: boolean): string {
    return enabled ? 'enable' : 'disable';
  }
  function pendingAction(enabled: boolean): string {
    return enabled
      ? i18n.t('addon.detail.pendingAction.enable')
      : i18n.t('addon.detail.pendingAction.disable');
  }
  function brokenLabel(addon: AddonSnapshot): string | null {
    if (addon.broken === true) return i18n.t('addons.panel.broken');
    if (typeof addon.broken === 'string') {
      const safe = safeText(addon.broken).trim();
      return safe.length > 0
        ? i18n.t('addons.panel.brokenReason', { reason: safe })
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
  function pendingToggleCopy(): string | null {
    if (!snapshot.pendingToggle) return null;
    return i18n.t('addon.detail.pendingToggle', {
      action: pendingAction(snapshot.pendingToggle.enabled),
      addonid: safeText(snapshot.pendingToggle.addonid)
    });
  }
  function lastWriteCopy(): string | null {
    if (!snapshot.lastWrite) return null;
    return i18n.t('addon.detail.lastWrite', {
      action: writeActionVerb(snapshot.lastWrite.enabled),
      addonid: safeText(snapshot.lastWrite.addonid),
      status: snapshot.lastWrite.status,
      at: safeText(snapshot.lastWrite.at)
    });
  }
  function rollbackCopy(): string | null {
    if (snapshot.writeStatus !== 'error' || snapshot.rollbackEnabled === null) return null;
    return i18n.t('addon.detail.rollback', { state: enabledStateLabel(snapshot.rollbackEnabled) });
  }
  function refreshCopy(): string | null {
    if (!snapshot.refreshAfterWrite) return null;
    if (snapshot.refreshAfterWrite.refreshed) return i18n.t('addon.detail.refresh.refreshed');
    const warning = snapshot.refreshAfterWrite.warning
      ? safeText(snapshot.refreshAfterWrite.warning)
      : i18n.t('addon.detail.refreshUnavailable');
    return i18n.t('addon.detail.refresh.warning', { warning });
  }
  function errorMessage(): string | null {
    return snapshot.lastError ? safeText(snapshot.lastError.message) : null;
  }
  function errorCode(): string | null {
    return snapshot.lastError ? safeText(snapshot.lastError.code) : null;
  }
  function writeCountsCopy(): string {
    return i18n.t('addon.detail.writeCounts', snapshot.writeCounts);
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

<section class="addon-detail" aria-labelledby="addon-detail-title">
  <header class="addon-detail-hero">
    <div>
      <p class="addon-eyebrow">{i18n.t('addon.detail.eyebrow')}</p>
      <h2 id="addon-detail-title">
        {detail ? addonLabel(detail) : i18n.t('addon.detail.titleFallback')}
      </h2>
      <p>{i18n.t('addon.detail.description')}</p>
    </div>
    <div class="addon-hero-actions">
      {#if dispatch.back}<button
          type="button"
          class="addon-secondary-action"
          onclick={callBack}
          disabled={isBusy}>{i18n.t('addon.detail.back')}</button
        >{/if}<button
        type="button"
        class="addon-primary-action"
        onclick={callLoad}
        disabled={isBusy}>{i18n.t('addon.detail.reload')}</button
      >
    </div>
  </header>
  <div class="addon-status-grid" aria-label={i18n.t('addon.detail.statusAria')}>
    <div class="addon-status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('addon.detail.detail')}</span><strong>{detailStatusCopy()}</strong>
    </div>
    <div class="addon-status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('addon.detail.write')}</span><strong>{writeStatusCopy()}</strong>
    </div>
    <div class="addon-status">
      <span>{i18n.t('addon.detail.writes')}</span><strong>{writeCountsCopy()}</strong>
    </div>
  </div>
  {#if errorMessage()}<div class="addon-alert" role="alert">
      {#if errorCode()}<strong>{errorCode()}</strong>{/if}<span>{errorMessage()}</span>
    </div>{/if}
  <div class="addon-diagnostics" aria-label={i18n.t('addon.detail.diagnosticsAria')}>
    {#if pendingToggleCopy()}<p>{pendingToggleCopy()}</p>{/if}{#if lastWriteCopy()}<p>
        {lastWriteCopy()}
      </p>{/if}{#if rollbackCopy()}<p>{rollbackCopy()}</p>{/if}{#if refreshCopy()}<p
        class:warning={snapshot.refreshAfterWrite?.refreshed === false}
      >
        {refreshCopy()}
      </p>{/if}
  </div>
  {#if snapshot.detailStatus === 'error'}<div class="addon-error-actions">
      <p>{i18n.t('addon.detail.errorGuidance')}</p>
      <button type="button" onclick={callRetry}>{i18n.t('addon.detail.retryLoad')}</button>
    </div>{/if}
  {#if detail}<article class="addon-card" class:broken={brokenLabel(detail) !== null}>
      <div class="addon-card-heading">
        <div>
          <h3>{addonLabel(detail)}</h3>
          <p>{addonIdLabel(detail)}</p>
        </div>
        <span class:enabled={detail.enabled === true} class:disabled={detail.enabled === false}
          >{enabledLabel(detail)}</span
        >
      </div>
      <p class="addon-summary">
        {optionalCopy(detail.summary, i18n.t('addons.panel.summaryUnavailable'))}
      </p>
      {#if optionalCopy(detail.description, '')}<p class="addon-description">
          {optionalCopy(detail.description, '')}
        </p>{:else}<p class="addon-description muted">
          {i18n.t('addon.detail.descriptionUnavailable')}
        </p>{/if}
      <dl class="addon-meta">
        <div>
          <dt>{i18n.t('addon.detail.addonId')}</dt>
          <dd>{addonIdLabel(detail)}</dd>
        </div>
        <div>
          <dt>{i18n.t('addons.panel.type')}</dt>
          <dd>{i18n.t('addons.panel.typeValue', { type: typeLabel(detail) })}</dd>
        </div>
        <div>
          <dt>{i18n.t('addons.panel.version')}</dt>
          <dd>{i18n.t('addons.panel.versionValue', { version: versionLabel(detail) })}</dd>
        </div>
        <div>
          <dt>{i18n.t('addon.detail.author')}</dt>
          <dd>
            {i18n.t('addon.detail.authorValue', {
              author: optionalCopy(detail.author, i18n.t('addons.panel.unavailable'))
            })}
          </dd>
        </div>
        <div>
          <dt>{i18n.t('addon.detail.installed')}</dt>
          <dd>
            {detail.installed === true
              ? i18n.t('addon.detail.installed')
              : detail.installed === false
                ? i18n.t('addon.detail.notInstalled')
                : i18n.t('addon.detail.installationUnknown')}
          </dd>
        </div>
        <div>
          <dt>{i18n.t('addon.detail.dependencies')}</dt>
          <dd>{dependencyLabel(detail)}</dd>
        </div>
      </dl>
      <div
        class="addon-badges"
        aria-label={i18n.t('addons.panel.badgesAria', { name: addonLabel(detail) })}
      >
        <span>{enabledLabel(detail)}</span><span>{dependencyLabel(detail)}</span><span
          >{extraInfoLabel(detail)}</span
        >{#if brokenLabel(detail)}<span class="danger">{brokenLabel(detail)}</span>{/if}
      </div>
      <div class="addon-toggle-panel" aria-live="polite" aria-atomic="true">
        <div>
          <h4>{i18n.t('addon.detail.enablement')}</h4>
          <p>
            {i18n.t('addon.detail.stateExplanation', { state: enabledLabel(detail).toLowerCase() })}
          </p>
        </div>
        <button
          type="button"
          class="addon-primary-action"
          onclick={() => requestToggle(detail)}
          disabled={isBusy || !canToggle}>{toggleButtonLabel(detail)}</button
        >
      </div>
      {#if pendingConfirmation}<div
          class="addon-confirm"
          role="group"
          aria-label={i18n.t('addon.detail.confirmAria')}
        >
          <p>
            {i18n.t('addon.detail.confirmPrompt', {
              action: actionVerb(pendingConfirmation.enabled),
              name: addonLabel(detail)
            })}
          </p>
          <div>
            <button
              type="button"
              class="addon-danger-action"
              onclick={confirmToggle}
              disabled={isBusy}
              >{i18n.t('addon.detail.confirm', {
                action: actionVerb(pendingConfirmation.enabled)
              })}</button
            ><button
              type="button"
              class="addon-secondary-action"
              onclick={cancelToggle}
              disabled={isBusy}
              >{i18n.t('addon.detail.cancel', {
                action: actionVerb(pendingConfirmation.enabled)
              })}</button
            >
          </div>
        </div>{/if}
    </article>{:else if snapshot.detailStatus !== 'error'}<p class="addon-empty">
      {selectedAddonId
        ? i18n.t('addon.detail.noDetailFor', { addonid: safeText(selectedAddonId) })
        : i18n.t('addon.detail.noDetail')}
    </p>{/if}
</section>

<style>
  .addon-detail {
    display: grid;
    gap: var(--space-lg);
  }

  .addon-detail-hero,
  .addon-status-grid,
  .addon-card,
  .addon-card-heading,
  .addon-meta,
  .addon-toggle-panel,
  .addon-confirm {
    display: grid;
    gap: var(--space-md);
  }

  .addon-detail-hero {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    padding: var(--space-xl);
    overflow: hidden;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--color-accent) 24%, transparent),
        transparent 40%
      ),
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-surface-raised) 86%, transparent),
        var(--color-surface)
      );
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-soft);
  }

  .addon-eyebrow,
  .addon-status span,
  .addon-card-heading > span,
  .addon-meta dt,
  .addon-badges span {
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
    font-size: clamp(1.1rem, 2vw, 1.45rem);
  }

  h4 {
    font-size: 1rem;
  }

  p,
  dd,
  button {
    line-height: 1.5;
  }

  button {
    cursor: pointer;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .addon-hero-actions,
  .addon-error-actions,
  .addon-confirm div,
  .addon-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
  }

  .addon-primary-action,
  .addon-secondary-action,
  .addon-danger-action,
  .addon-error-actions button {
    padding: var(--space-xs) var(--space-md);
    color: var(--color-text);
    font-weight: 800;
    background: color-mix(in srgb, var(--color-surface-raised) 84%, transparent);
  }

  .addon-danger-action {
    color: var(--color-danger, var(--color-warning));
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 44%,
      var(--color-border)
    );
  }

  .addon-primary-action:not(:disabled):hover,
  .addon-secondary-action:not(:disabled):hover,
  .addon-danger-action:not(:disabled):hover,
  .addon-error-actions button:not(:disabled):hover {
    border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, transparent);
  }

  .addon-status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .addon-status,
  .addon-alert,
  .addon-diagnostics,
  .addon-error-actions,
  .addon-card,
  .addon-empty,
  .addon-confirm {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .addon-status {
    display: grid;
    gap: var(--space-2xs);
  }

  .addon-alert {
    display: grid;
    gap: var(--space-2xs);
    color: var(--color-danger, var(--color-warning));
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 42%,
      var(--color-border)
    );
  }

  .addon-diagnostics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm) var(--space-lg);
    color: var(--color-text-muted);
  }

  .addon-diagnostics .warning {
    color: var(--color-warning, var(--color-accent));
  }

  .addon-error-actions {
    justify-content: space-between;
  }

  .addon-card {
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-surface-raised) 44%, transparent),
        transparent
      ),
      var(--color-surface);
  }

  .addon-card.broken {
    border-color: color-mix(
      in srgb,
      var(--color-warning, var(--color-accent)) 42%,
      var(--color-border)
    );
  }

  .addon-card-heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .addon-card-heading p,
  .addon-summary,
  .addon-description,
  .addon-empty,
  .addon-error-actions p,
  .addon-toggle-panel p {
    color: var(--color-text-muted);
  }

  .addon-description.muted {
    font-style: italic;
  }

  .addon-card-heading > span,
  .addon-badges span,
  .addon-meta div,
  .addon-toggle-panel {
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-background) 34%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 76%, transparent);
    border-radius: var(--radius-md);
  }

  .addon-card-heading > span.enabled {
    color: var(--color-success, var(--color-accent));
  }

  .addon-card-heading > span.disabled,
  .addon-badges .danger {
    color: var(--color-danger, var(--color-warning));
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 42%,
      var(--color-border)
    );
  }

  .addon-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .addon-toggle-panel {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .addon-confirm {
    border-color: color-mix(in srgb, var(--color-accent) 44%, var(--color-border));
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent),
      color-mix(in srgb, var(--color-surface) 88%, transparent);
  }

  @media (max-width: 760px) {
    .addon-detail-hero,
    .addon-status-grid,
    .addon-card-heading,
    .addon-meta,
    .addon-toggle-panel {
      grid-template-columns: 1fr;
    }
  }
</style>
