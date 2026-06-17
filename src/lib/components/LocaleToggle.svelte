<script lang="ts" module>
  import type { Locale, TranslationContext } from '$lib/i18n';
  import type { LocaleMutationResult } from '$lib/stores/locale.svelte';

  export interface LocaleToggleDispatch {
    setLocale: (locale: unknown) => LocaleMutationResult | void;
  }
</script>

<script lang="ts">
  interface Props {
    locale: Locale;
    i18n: TranslationContext;
    dispatch: LocaleToggleDispatch;
  }

  let { locale, i18n, dispatch }: Props = $props();

  function handleLocaleChange(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;
    dispatch.setLocale(select.value);
  }
</script>

<label class="locale-toggle">
  <span>{i18n.t('app.locale.switchLabel')}</span>
  <select
    id="chorus-locale-toggle"
    name="chorus-locale"
    aria-label={i18n.t('app.locale.switchLabel')}
    value={locale}
    onchange={handleLocaleChange}
  >
    <option value="en">{i18n.t('app.locale.english')}</option>
    <option value="de">{i18n.t('app.locale.german')}</option>
  </select>
</label>

<style>
  .locale-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    min-height: 2.75rem;
    padding: var(--space-xs) var(--space-sm) var(--space-xs) var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-surface-raised) 84%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.12);
  }

  .locale-toggle span {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .locale-toggle select {
    min-height: 2rem;
    padding: 0 var(--space-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
  }

  .locale-toggle:focus-within {
    box-shadow:
      var(--shadow-ring),
      0 0.75rem 2rem rgb(0 0 0 / 0.14);
  }

  .locale-toggle select:focus-visible {
    outline: none;
  }
</style>
