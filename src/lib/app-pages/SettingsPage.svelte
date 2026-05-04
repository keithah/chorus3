<script lang="ts">
  import SettingsPanel, { type SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type { SettingsStoreSnapshot } from '$lib/stores';

  interface Props {
    route: PrimaryRoute;
    snapshot: SettingsStoreSnapshot;
    dispatch: SettingsPanelDispatch;
    i18n: TranslationContext;
  }

  let { route, snapshot, dispatch, i18n }: Props = $props();

  const routeTitle = $derived(settingsTitle(route));

  function settingsTitle(value: PrimaryRoute): string {
    if (value.kind === 'settingsKodi') return 'Kodi settings';
    if (value.kind === 'settingsAddons') return 'Add-on settings';
    if (value.kind === 'settingsNav') return 'Navigation settings';
    if (value.kind === 'settingsSearch') return 'Search settings';
    return 'Web interface settings';
  }
</script>

<section class="app-page-section settings-page" aria-labelledby="settings-page-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Settings surface</p>
    <h2 id="settings-page-title">{routeTitle}</h2>
    <p>
      Review safe web and Kodi settings in the app shell. Unsupported or path-like values stay
      read-only and redacted by the settings panel.
    </p>
  </div>

  <section class="settings-affordances" aria-label="Static settings affordances">
    <article>
      <h3>General options</h3>
      <p>Shell preferences and safe control defaults are visible here without writing browser storage.</p>
      <label>
        <input type="checkbox" checked disabled aria-disabled="true" />
        Use package-safe navigation
      </label>
    </article>
    <article>
      <h3>Appearance</h3>
      <p>Theme controls remain available from the home surface; route-specific appearance editing is deferred.</p>
      <label for="settings-appearance-mode">Display mode</label>
      <select id="settings-appearance-mode" disabled aria-disabled="true">
        <option>Follow current theme</option>
      </select>
    </article>
  </section>

  <SettingsPanel {snapshot} {dispatch} {i18n} />
</section>

<style>
  .settings-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header,
  .settings-affordances article {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .settings-affordances {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .app-page-section__header h2,
  .app-page-section__header p,
  .settings-affordances h3,
  .settings-affordances p {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker),
  .settings-affordances p {
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  label {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text);
  }

  select {
    max-width: 18rem;
  }

  @media (max-width: 760px) {
    .settings-affordances {
      grid-template-columns: 1fr;
    }
  }
</style>
