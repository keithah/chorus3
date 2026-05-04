<script lang="ts" module>
  import type {
    SettingsEditKind,
    SettingsSettingSnapshot,
    SettingsStoreSnapshot
  } from '$lib/stores/settingsStore.svelte';
  import type { SettingsSettingValue } from '$lib/kodi';
  import type { TranslationContext } from '$lib/i18n';

  export interface SettingsPanelDispatch {
    load: () => void | Promise<void>;
    retry: () => void | Promise<void>;
    selectSection: (sectionId: string) => void | Promise<void>;
    selectCategory: (categoryId: string) => void | Promise<void>;
    setValue: (settingId: string, value: SettingsSettingValue) => void | Promise<void>;
  }
</script>

<script lang="ts">
  interface Props {
    snapshot: SettingsStoreSnapshot;
    dispatch: SettingsPanelDispatch;
    i18n: TranslationContext;
  }

  let { snapshot, dispatch, i18n }: Props = $props();

  const valueSeparator = '::';

  const isBusy = $derived(snapshot.loadStatus === 'loading' || snapshot.writeStatus === 'pending');
  const visibleSettingIds = $derived(new Set(snapshot.settings.map((setting) => setting.id)));
  const hasOnlyReadOnlySettings = $derived(
    snapshot.settings.length > 0 && snapshot.settings.every((setting) => !canEdit(setting))
  );
  const lastWriteTargetMissing = $derived(
    Boolean(snapshot.lastWrite && !visibleSettingIds.has(snapshot.lastWrite.settingId))
  );

  function callLoad(): void {
    void dispatch.load();
  }

  function callRetry(): void {
    void dispatch.retry();
  }

  function selectSection(sectionId: string): void {
    void dispatch.selectSection(sectionId);
  }

  function selectCategory(categoryId: string): void {
    void dispatch.selectCategory(categoryId);
  }

  function writeBoolean(setting: SettingsSettingSnapshot, event: Event): void {
    if (!canEdit(setting)) return;
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    void dispatch.setValue(setting.id, input.checked);
  }

  function writeText(setting: SettingsSettingSnapshot, event: Event): void {
    if (!canEdit(setting)) return;
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    if (setting.editKind === 'string') {
      void dispatch.setValue(setting.id, input.value);
      return;
    }
    const coerced = coerceNumber(setting.editKind, input.value);
    if (coerced === null) return;
    void dispatch.setValue(setting.id, coerced);
  }

  function writeEnum(setting: SettingsSettingSnapshot, event: Event): void {
    if (!canEdit(setting)) return;
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;
    const option = setting.options.find((candidate) => optionKey(candidate.value) === select.value);
    if (!option) return;
    void dispatch.setValue(setting.id, option.value);
  }

  function coerceNumber(editKind: SettingsEditKind, rawValue: string): number | null {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return null;
    if (editKind === 'integer' && !Number.isSafeInteger(value)) return null;
    return value;
  }

  function canEdit(setting: SettingsSettingSnapshot): boolean {
    if (setting.readOnly || setting.editKind === 'unsupported') return false;
    if (setting.editKind === 'boolean') return typeof setting.value === 'boolean';
    if (setting.editKind === 'integer') return Number.isSafeInteger(setting.value);
    if (setting.editKind === 'number')
      return typeof setting.value === 'number' && Number.isFinite(setting.value);
    if (setting.editKind === 'string') return typeof setting.value === 'string';
    if (setting.editKind === 'enum') {
      return setting.options.some((option) => Object.is(option.value, setting.value));
    }
    return false;
  }

  function optionKey(value: SettingsSettingValue): string {
    if (typeof value === 'string') return value;
    return `${value === null ? 'null' : typeof value}${valueSeparator}${String(value)}`;
  }

  function settingLabel(setting: SettingsSettingSnapshot): string {
    const sanitized = safeText(setting.label).trim();
    return sanitized.length > 0 ? sanitized : i18n.t('settings.panel.untitled');
  }

  function typeLabel(setting: SettingsSettingSnapshot): string {
    const sanitized = safeText(setting.type).trim();
    return sanitized.length > 0 ? sanitized : i18n.t('settings.panel.unknown');
  }

  function formatValue(value: SettingsSettingValue): string {
    if (value === null) return i18n.t('settings.panel.value.notSet');
    if (typeof value === 'number')
      return Number.isFinite(value) ? String(value) : i18n.t('settings.panel.value.unavailable');
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return safeText(value);
  }

  function readOnlyReason(setting: SettingsSettingSnapshot): string {
    if (!canRepresentValue(setting)) return i18n.t('settings.panel.readOnly.unrepresentable');
    const type = typeLabel(setting).toLowerCase();
    if (type === 'action') return i18n.t('settings.panel.readOnly.action');
    if (type === 'path' || type === 'folder' || type === 'file') {
      return i18n.t('settings.panel.readOnly.unsafeType', { type });
    }
    if (type === 'custom') return i18n.t('settings.panel.readOnly.custom');
    return i18n.t('settings.panel.readOnly.unsupported', { type });
  }

  function canRepresentValue(setting: SettingsSettingSnapshot): boolean {
    if (setting.value === null) return true;
    if (typeof setting.value === 'number') return Number.isFinite(setting.value);
    return ['string', 'boolean'].includes(typeof setting.value);
  }

  function loadStatusCopy(): string {
    if (snapshot.loadStatus === 'loading') return i18n.t('settings.panel.load.loading');
    if (snapshot.loadStatus === 'error') return i18n.t('settings.panel.load.error');
    if (snapshot.loadStatus === 'success') return i18n.t('settings.panel.load.success');
    return i18n.t('settings.panel.load.idle');
  }

  function writeStatusCopy(): string {
    if (snapshot.writeStatus === 'pending') return i18n.t('settings.panel.write.pending');
    if (snapshot.writeStatus === 'success') return i18n.t('settings.panel.write.success');
    if (snapshot.writeStatus === 'error') return i18n.t('settings.panel.write.error');
    return i18n.t('settings.panel.write.idle');
  }

  function safeText(value: string): string {
    return value
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/username or password/gi, 'credentials')
      .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
      .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
      .replace(/\/[^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-file')
      .replace(/\{[^{}]*(jsonrpc|Input\.SendText)[^{}]*\}/gi, 'redacted payload')
      .replace(/\bInput\.SendText\b/gi, 'redacted action')
      .replace(/\bjsonrpc\b/gi, 'redacted payload')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/CHORUS_SENTINEL_SECRET|SENTINEL_SECRET/gi, '[redacted-sentinel]')
      .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
      .replace(/localStorage|sessionStorage/gi, 'browser storage')
      .replace(/password/gi, 'credentials');
  }
</script>

<section class="settings-panel" aria-labelledby="settings-panel-title">
  <header class="settings-panel-hero">
    <div>
      <p class="settings-eyebrow">{i18n.t('settings.panel.eyebrow')}</p>
      <h2 id="settings-panel-title">{i18n.t('settings.panel.title')}</h2>
      <p>
        {i18n.t('settings.panel.description')}
      </p>
    </div>
    <button type="button" class="settings-primary-action" onclick={callLoad} disabled={isBusy}>
      {i18n.t('settings.panel.reload')}
    </button>
  </header>

  <div class="settings-status-grid" aria-label={i18n.t('settings.panel.statusAria')}>
    <div class="settings-status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('settings.panel.load')}</span>
      <strong>{loadStatusCopy()}</strong>
    </div>
    <div class="settings-status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('settings.panel.write')}</span>
      <strong>{writeStatusCopy()}</strong>
    </div>
    <div class="settings-status settings-status-muted">
      <span>{i18n.t('settings.panel.writes')}</span>
      <strong
        >{i18n.t('settings.panel.writeCounts', {
          attempted: snapshot.writeCounts.attempted,
          succeeded: snapshot.writeCounts.succeeded,
          failed: snapshot.writeCounts.failed
        })}</strong
      >
    </div>
  </div>

  {#if snapshot.lastError}
    <div class="settings-alert" role="alert">
      <strong>{safeText(snapshot.lastError.code)}</strong>
      <span>{safeText(snapshot.lastError.message)}</span>
    </div>
  {/if}

  <div class="settings-diagnostics" aria-label={i18n.t('settings.panel.diagnosticsAria')}>
    {#if snapshot.lastWrite}
      <p>
        {i18n.t('settings.panel.lastWrite', {
          settingId: safeText(snapshot.lastWrite.settingId),
          status: snapshot.lastWrite.status,
          value: formatValue(snapshot.lastWrite.value)
        })}
      </p>
    {/if}
    {#if snapshot.rollbackValue !== null}
      <p>
        {i18n.t('settings.panel.rollbackValue', { value: formatValue(snapshot.rollbackValue) })}
      </p>
    {/if}
    {#if snapshot.refreshAfterWrite}
      <p>
        {i18n.t('settings.panel.refreshAfterWrite', {
          status: snapshot.refreshAfterWrite.refreshed
            ? i18n.t('settings.panel.refreshStatus.refreshed')
            : i18n.t('settings.panel.refreshStatus.pending'),
          settingId: safeText(snapshot.refreshAfterWrite.settingId)
        })}
      </p>
    {/if}
    {#if lastWriteTargetMissing}
      <p>{i18n.t('settings.panel.lastWriteMissing')}</p>
    {/if}
  </div>

  <div class="settings-layout">
    <nav class="settings-nav" aria-label={i18n.t('settings.panel.sectionsAria')}>
      <h3>{i18n.t('settings.panel.sectionsTitle')}</h3>
      {#if snapshot.sections.length > 0}
        <div class="settings-nav-list">
          {#each snapshot.sections as section (section.id)}
            <button
              type="button"
              class:active={section.id === snapshot.selectedSectionId}
              aria-label={i18n.t('settings.panel.selectSection', {
                label: safeText(section.label)
              })}
              aria-current={section.id === snapshot.selectedSectionId ? 'page' : undefined}
              onclick={() => selectSection(section.id)}
              disabled={isBusy || section.id === snapshot.selectedSectionId}
            >
              {safeText(section.label)}
            </button>
          {/each}
        </div>
      {:else}
        <p class="settings-empty">{i18n.t('settings.panel.noSections')}</p>
      {/if}
    </nav>

    <nav class="settings-nav" aria-label={i18n.t('settings.panel.categoriesAria')}>
      <h3>{i18n.t('settings.panel.categoriesTitle')}</h3>
      {#if snapshot.categories.length > 0}
        <div class="settings-nav-list">
          {#each snapshot.categories as category (category.id)}
            <button
              type="button"
              class:active={category.id === snapshot.selectedCategoryId}
              aria-label={i18n.t('settings.panel.selectCategory', {
                label: safeText(category.label)
              })}
              aria-current={category.id === snapshot.selectedCategoryId ? 'page' : undefined}
              onclick={() => selectCategory(category.id)}
              disabled={isBusy || category.id === snapshot.selectedCategoryId}
            >
              {safeText(category.label)}
            </button>
          {/each}
        </div>
      {:else}
        <p class="settings-empty">{i18n.t('settings.panel.noCategories')}</p>
      {/if}
    </nav>

    <div class="settings-content">
      <div class="settings-content-heading">
        <div>
          <h3>{i18n.t('settings.panel.settingsTitle')}</h3>
          {#if hasOnlyReadOnlySettings}
            <p>{i18n.t('settings.panel.readOnlyCategory')}</p>
          {:else}
            <p>{i18n.t('settings.panel.editableCategory')}</p>
          {/if}
        </div>
        {#if snapshot.loadStatus === 'error'}
          <button type="button" onclick={callRetry}>{i18n.t('settings.panel.retryLoad')}</button>
        {/if}
      </div>

      {#if snapshot.settings.length > 0}
        <div class="settings-card-grid">
          {#each snapshot.settings as setting (setting.id)}
            <article class:read-only={!canEdit(setting)} class="settings-card">
              <div class="settings-card-header">
                <div>
                  <h4>{settingLabel(setting)}</h4>
                  <p>{safeText(setting.id)}</p>
                </div>
                <span
                  >{canEdit(setting)
                    ? i18n.t('settings.panel.editable')
                    : i18n.t('settings.panel.readOnly')}</span
                >
              </div>

              <dl class="settings-meta">
                <div>
                  <dt>{i18n.t('settings.panel.type')}</dt>
                  <dd>{i18n.t('settings.panel.typeValue', { type: typeLabel(setting) })}</dd>
                </div>
                <div>
                  <dt>{i18n.t('settings.panel.current')}</dt>
                  <dd>
                    {i18n.t('settings.panel.currentValue', { value: formatValue(setting.value) })}
                  </dd>
                </div>
                <div>
                  <dt>{i18n.t('settings.panel.default')}</dt>
                  <dd>
                    {i18n.t('settings.panel.defaultValue', {
                      value: formatValue(setting.defaultValue)
                    })}
                  </dd>
                </div>
              </dl>

              {#if canEdit(setting)}
                <div class="settings-control">
                  {#if setting.editKind === 'boolean'}
                    <label>
                      <input
                        data-setting-control={setting.id}
                        type="checkbox"
                        checked={setting.value === true}
                        aria-label={i18n.t('settings.panel.toggleSetting', {
                          label: settingLabel(setting)
                        })}
                        onchange={(event) => writeBoolean(setting, event)}
                        disabled={isBusy}
                      />
                      {i18n.t('settings.panel.enabled')}
                    </label>
                  {:else if setting.editKind === 'integer' || setting.editKind === 'number'}
                    <label for={`setting-${setting.id}`}>
                      {i18n.t('settings.panel.valueLabel', { label: settingLabel(setting) })}
                    </label>
                    <input
                      id={`setting-${setting.id}`}
                      data-setting-control={setting.id}
                      type="text"
                      inputmode={setting.editKind === 'integer' ? 'numeric' : 'decimal'}
                      value={formatValue(setting.value)}
                      aria-label={i18n.t('settings.panel.editSetting', {
                        label: settingLabel(setting)
                      })}
                      onchange={(event) => writeText(setting, event)}
                      disabled={isBusy}
                    />
                  {:else if setting.editKind === 'string'}
                    <label for={`setting-${setting.id}`}>
                      {i18n.t('settings.panel.valueLabel', { label: settingLabel(setting) })}
                    </label>
                    <input
                      id={`setting-${setting.id}`}
                      data-setting-control={setting.id}
                      type="text"
                      value={typeof setting.value === 'string' ? safeText(setting.value) : ''}
                      aria-label={i18n.t('settings.panel.editSetting', {
                        label: settingLabel(setting)
                      })}
                      onchange={(event) => writeText(setting, event)}
                      disabled={isBusy}
                    />
                  {:else if setting.editKind === 'enum'}
                    <label for={`setting-${setting.id}`}
                      >{i18n.t('settings.panel.optionLabel', {
                        label: settingLabel(setting)
                      })}</label
                    >
                    <select
                      id={`setting-${setting.id}`}
                      data-setting-control={setting.id}
                      value={optionKey(setting.value)}
                      aria-label={i18n.t('settings.panel.chooseSetting', {
                        label: settingLabel(setting)
                      })}
                      onchange={(event) => writeEnum(setting, event)}
                      disabled={isBusy}
                    >
                      {#each setting.options as option (optionKey(option.value))}
                        <option value={optionKey(option.value)}>{safeText(option.label)}</option>
                      {/each}
                    </select>
                  {/if}
                </div>
              {:else}
                <p class="settings-read-only">{readOnlyReason(setting)}</p>
              {/if}
            </article>
          {/each}
        </div>
      {:else}
        <p class="settings-empty">{i18n.t('settings.panel.noSettings')}</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .settings-panel {
    display: grid;
    gap: var(--space-lg);
  }

  .settings-panel-hero,
  .settings-content-heading,
  .settings-card-header,
  .settings-status-grid,
  .settings-layout {
    display: grid;
    gap: var(--space-md);
  }

  .settings-panel-hero {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    padding: var(--space-xl);
    overflow: hidden;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--color-accent) 20%, transparent),
        transparent 42%
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

  .settings-eyebrow,
  .settings-status span,
  .settings-card-header span,
  .settings-meta dt {
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
    font-size: 1rem;
  }

  p,
  dd,
  label,
  button,
  input,
  select {
    line-height: 1.5;
  }

  button,
  input,
  select {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
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

  .settings-primary-action,
  .settings-content-heading button,
  .settings-nav button {
    padding: var(--space-xs) var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-surface-raised) 84%, transparent);
  }

  .settings-primary-action {
    font-weight: 800;
  }

  .settings-nav button.active,
  .settings-primary-action:not(:disabled):hover,
  .settings-content-heading button:not(:disabled):hover,
  .settings-nav button:not(:disabled):hover {
    border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, transparent);
  }

  .settings-status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .settings-status,
  .settings-alert,
  .settings-diagnostics,
  .settings-nav,
  .settings-content,
  .settings-card {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .settings-status {
    display: grid;
    gap: var(--space-2xs);
  }

  .settings-alert {
    display: grid;
    gap: var(--space-2xs);
    color: var(--color-danger, var(--color-warning));
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 42%,
      var(--color-border)
    );
  }

  .settings-diagnostics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm) var(--space-lg);
    color: var(--color-text-muted);
  }

  .settings-layout {
    grid-template-columns: minmax(10rem, 0.55fr) minmax(10rem, 0.55fr) minmax(0, 2fr);
    align-items: start;
  }

  .settings-nav,
  .settings-content {
    display: grid;
    gap: var(--space-md);
  }

  .settings-nav-list,
  .settings-card-grid {
    display: grid;
    gap: var(--space-sm);
  }

  .settings-nav button {
    width: 100%;
    text-align: left;
  }

  .settings-content-heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .settings-card {
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

  .settings-card.read-only {
    background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
  }

  .settings-card-header {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .settings-card-header p,
  .settings-content-heading p,
  .settings-empty,
  .settings-read-only {
    color: var(--color-text-muted);
  }

  .settings-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .settings-meta div,
  .settings-control,
  .settings-read-only {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-background) 34%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 76%, transparent);
    border-radius: var(--radius-md);
  }

  .settings-control input:not([type='checkbox']),
  .settings-control select {
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
    color: var(--color-text);
    background: var(--color-surface-raised);
  }

  .settings-control label:has(input[type='checkbox']) {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  @media (max-width: 840px) {
    .settings-panel-hero,
    .settings-content-heading,
    .settings-layout,
    .settings-status-grid,
    .settings-meta {
      grid-template-columns: 1fr;
    }
  }
</style>
