<script lang="ts" module>
  import type {
    SettingsEditKind,
    SettingsSettingSnapshot,
    SettingsStoreSnapshot
  } from '$lib/stores/settingsStore.svelte';
  import type { SettingsSettingValue } from '$lib/kodi';
  import type { TranslationContext } from '$lib/i18n';
  import { redactStoreErrorMessage } from '$lib/safety/redaction';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';

  export interface SettingsPanelDispatch {
    load: () => void | Promise<void>;
    retry: () => void | Promise<void>;
    selectSection: (sectionId: string) => void | Promise<void>;
    selectCategory: (categoryId: string) => void | Promise<void>;
    setValue: (settingId: string, value: SettingsSettingValue) => void | Promise<void>;
  }
</script>

<script lang="ts">
  import { settingsStore } from '$lib/stores/settingsStore.svelte';

  interface Props {
    snapshot?: SettingsStoreSnapshot;
    dispatch: SettingsPanelDispatch;
    i18n: TranslationContext;
  }

  let { snapshot: injectedSnapshot, dispatch, i18n }: Props = $props();
  const snapshot = $derived(injectedSnapshot ?? settingsStore.snapshot);

  const valueSeparator = '::';

  const settingsVisibility = createIncrementalVisibility(120);

  const isBusy = $derived(snapshot.loadStatus === 'loading' || snapshot.writeStatus === 'pending');
  const visibleSettingIds = $derived(new Set(snapshot.settings.map((setting) => setting.id)));
  const visibleSettings = $derived(settingsVisibility.visibleItems(snapshot.settings));
  const hasOnlyReadOnlySettings = $derived(
    snapshot.settings.length > 0 && snapshot.settings.every((setting) => !canEdit(setting))
  );
  const lastWriteTargetMissing = $derived(
    Boolean(snapshot.lastWrite && !visibleSettingIds.has(snapshot.lastWrite.settingId))
  );

  function callLoad(): void {
    void dispatch.load();
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

  function writeCountsCopy(): string {
    return `${i18n.t('settings.panel.writes')} ${i18n.t('settings.panel.writeCounts', {
      attempted: snapshot.writeCounts.attempted,
      succeeded: snapshot.writeCounts.succeeded,
      failed: snapshot.writeCounts.failed
    })}`;
  }

  function safeText(value: string): string {
    return redactStoreErrorMessage(value);
  }
</script>

<section class="settings-panel" aria-labelledby="settings-panel-title">
  <div class="settings-panel-toolbar">
    <h2 id="settings-panel-title">{i18n.t('settings.panel.title')}</h2>
    <button type="button" onclick={callLoad} disabled={isBusy}>
      {i18n.t('settings.panel.reload')}
    </button>
  </div>

  <div class="settings-status-line" role="status" aria-live="polite" aria-atomic="true">
    <span>{loadStatusCopy()}</span>
    <span>{writeStatusCopy()}</span>
    <span>{writeCountsCopy()}</span>
    {#if snapshot.lastWrite}
      <span
        >{i18n.t('settings.panel.lastWrite', {
          settingId: safeText(snapshot.lastWrite.settingId),
          status: snapshot.lastWrite.status,
          value: formatValue(snapshot.lastWrite.value)
        })}</span
      >
    {/if}
    {#if snapshot.rollbackValue !== null}
      <span
        >{i18n.t('settings.panel.rollbackValue', {
          value: formatValue(snapshot.rollbackValue)
        })}</span
      >
    {/if}
    {#if snapshot.refreshAfterWrite}
      <span
        >{i18n.t('settings.panel.refreshAfterWrite', {
          status: snapshot.refreshAfterWrite.refreshed
            ? i18n.t('settings.panel.refreshStatus.refreshed')
            : i18n.t('settings.panel.refreshStatus.pending'),
          settingId: safeText(snapshot.refreshAfterWrite.settingId)
        })}</span
      >
    {/if}
    {#if lastWriteTargetMissing}
      <span>{i18n.t('settings.panel.lastWriteMissing')}</span>
    {/if}
  </div>

  {#if snapshot.lastError}
    <p class="settings-alert" role="alert">
      {safeText(snapshot.lastError.code)}: {safeText(snapshot.lastError.message)}
    </p>
  {/if}

  <div class="settings-panel-body">
    <nav class="settings-section-tabs" aria-label={i18n.t('settings.panel.sectionsAria')}>
      <h3>{i18n.t('settings.panel.sectionsTitle')}</h3>
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
    </nav>

    <nav class="settings-category-tabs" aria-label={i18n.t('settings.panel.categoriesAria')}>
      <h3>{i18n.t('settings.panel.categoriesTitle')}</h3>
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
    </nav>

    {#if snapshot.sections.length === 0}
      <div class="settings-empty">
        <p>{i18n.t('settings.panel.noSections')}</p>
        {#if snapshot.categories.length === 0}
          <p>{i18n.t('settings.panel.noCategories')}</p>
        {/if}
        <p>{i18n.t('settings.panel.noSettings')}</p>
      </div>
    {:else if snapshot.settings.length > 0}
      {#if hasOnlyReadOnlySettings}
        <p class="settings-read-only-category">{i18n.t('settings.panel.readOnlyCategory')}</p>
      {/if}
      <div class="settings-list">
        {#each visibleSettings as setting (setting.id)}
          <label class="settings-row" class:read-only={!canEdit(setting)}>
            <span class="settings-label">
              <strong>{settingLabel(setting)}</strong>
              <small>{safeText(setting.id)}</small>
              <small>
                {canEdit(setting)
                  ? i18n.t('settings.panel.editable')
                  : i18n.t('settings.panel.readOnly')}
              </small>
              {#if !canEdit(setting)}
                <small>{readOnlyReason(setting)}</small>
              {/if}
            </span>
            <span class="settings-control">
              {#if canEdit(setting) && setting.editKind === 'boolean'}
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
              {:else if canEdit(setting) && (setting.editKind === 'integer' || setting.editKind === 'number')}
                <input
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
              {:else if canEdit(setting) && setting.editKind === 'string'}
                <input
                  data-setting-control={setting.id}
                  type="text"
                  value={typeof setting.value === 'string' ? safeText(setting.value) : ''}
                  aria-label={i18n.t('settings.panel.editSetting', {
                    label: settingLabel(setting)
                  })}
                  onchange={(event) => writeText(setting, event)}
                  disabled={isBusy}
                />
              {:else if canEdit(setting) && setting.editKind === 'enum'}
                <select
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
              {:else}
                <span>{formatValue(setting.value)}</span>
              {/if}
              <span class="setting-meta">
                {i18n.t('settings.panel.typeValue', { type: typeLabel(setting) })}
              </span>
              <span class="setting-meta">
                {i18n.t('settings.panel.defaultValue', {
                  value: formatValue(setting.defaultValue)
                })}
              </span>
            </span>
          </label>
        {/each}
      </div>
      {#if settingsVisibility.hasMore(snapshot.settings.length)}
        <button type="button" class="settings-show-more" onclick={settingsVisibility.showMore}>
          Show more settings
        </button>
      {/if}
    {:else}
      <div class="settings-empty">
        {#if snapshot.sections.length === 0}
          <p>{i18n.t('settings.panel.noSections')}</p>
        {/if}
        {#if snapshot.categories.length === 0}
          <p>{i18n.t('settings.panel.noCategories')}</p>
        {/if}
        <p>{i18n.t('settings.panel.noSettings')}</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .settings-panel {
    display: grid;
    gap: 0;
    color: #333;
    background: #dedede;
  }

  .settings-panel-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 52px;
    padding: 0 18px;
    background: #f7f7f7;
    border-bottom: 1px solid #d0d0d0;
  }

  .settings-panel-toolbar h2 {
    margin: 0;
    color: #555;
    font-size: 20px;
    font-weight: 400;
  }

  .settings-panel-toolbar button,
  .settings-section-tabs button,
  .settings-category-tabs button {
    border: 0;
    border-radius: 0;
    font: inherit;
    cursor: pointer;
  }

  .settings-panel-toolbar button {
    padding: 7px 13px;
    color: #fff;
    background: #9e9e9e;
  }

  .settings-status-line {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    padding: 8px 18px;
    color: #888;
    background: #fff;
    border-bottom: 1px solid #d0d0d0;
    font-size: 12px;
  }

  .settings-alert {
    margin: 0;
    padding: 12px 18px;
    color: #9d2f2f;
    background: #fff;
    border-bottom: 1px solid #d0d0d0;
  }

  .settings-panel-body {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    align-items: start;
  }

  .settings-section-tabs,
  .settings-category-tabs {
    display: grid;
    align-content: start;
  }

  .settings-section-tabs {
    grid-row: span 2;
    min-height: 100%;
    padding: 14px 0;
    background: #f3f3f3;
    border-right: 1px solid #d8d8d8;
  }

  .settings-category-tabs {
    grid-column: 2;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    background: #eee;
    border-bottom: 1px solid #d0d0d0;
  }

  .settings-section-tabs h3,
  .settings-category-tabs h3 {
    margin: 0;
    padding: 10px 14px 6px;
    color: #888;
    font-size: 13px;
    font-weight: 400;
    text-transform: uppercase;
  }

  .settings-section-tabs button,
  .settings-category-tabs button {
    min-height: 36px;
    padding: 0 14px;
    color: #333;
    background: transparent;
    text-align: left;
  }

  .settings-section-tabs button.active,
  .settings-category-tabs button.active,
  .settings-section-tabs button:hover:not(:disabled),
  .settings-category-tabs button:hover:not(:disabled) {
    color: #4db3e6;
  }

  .settings-list {
    grid-column: 2;
    display: grid;
    gap: 0;
    padding: 12px 18px 44px;
  }

  .settings-show-more {
    grid-column: 2;
    justify-self: start;
    margin: 0 18px 18px;
    padding: 7px 13px;
    color: #fff;
    background: #777;
    border: 0;
    border-radius: 0;
    font: inherit;
    cursor: pointer;
  }

  .settings-read-only-category {
    grid-column: 2;
    margin: 0;
    padding: 12px 18px 0;
    color: #888;
    font-size: 13px;
  }

  .settings-row {
    display: grid;
    grid-template-columns: minmax(12rem, 24rem) minmax(16rem, 32rem);
    gap: 1.4rem;
    align-items: start;
    min-height: 58px;
    padding: 12px 0;
    border-bottom: 1px solid #ececec;
  }

  .settings-label {
    display: grid;
    gap: 3px;
  }

  .settings-label strong {
    color: #333;
    font-size: 14px;
    font-weight: 700;
  }

  .settings-label small {
    color: #aaa;
    font-size: 12px;
    line-height: 1.35;
  }

  .settings-control {
    display: grid;
    gap: 4px;
    color: #777;
    font-size: 14px;
  }

  .setting-meta {
    color: #aaa;
    font-size: 12px;
  }

  .settings-control input:not([type='checkbox']),
  .settings-control select {
    width: 100%;
    height: 28px;
    border: 0;
    border-bottom: 1px solid #9e9e9e;
    border-radius: 0;
    background: transparent;
    color: #555;
    font: inherit;
  }

  .settings-control input[type='checkbox'] {
    width: 44px;
    height: 22px;
    margin: 0;
    accent-color: #57b6e6;
  }

  .settings-empty {
    grid-column: 2;
    margin: 0;
    padding: 18px;
    color: #888;
  }

  .settings-empty p {
    margin: 0 0 0.35rem;
  }

  @media (max-width: 840px) {
    .settings-panel-body,
    .settings-row {
      grid-template-columns: 1fr;
    }

    .settings-section-tabs,
    .settings-category-tabs,
    .settings-list,
    .settings-empty {
      grid-column: 1;
    }
  }
</style>
