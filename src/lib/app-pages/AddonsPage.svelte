<script lang="ts">
  import AddonDetailShell, { type AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import AddonsPanel, {
    type AddonsPanelDispatch,
    type AddonsTypeFilter
  } from '$components/AddonsPanel.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type { AddonsStoreSnapshot } from '$lib/stores';

  interface Props {
    route: PrimaryRoute;
    snapshot: AddonsStoreSnapshot;
    dispatch: AddonsPanelDispatch;
    addonDetailDispatch: AddonDetailDispatch;
    i18n: TranslationContext;
    packageBasePath?: string;
  }

  let {
    route,
    snapshot,
    dispatch,
    addonDetailDispatch,
    i18n,
    packageBasePath = ''
  }: Props = $props();

  const title = $derived(addonsTitle(route));
  const description = $derived(addonsDescription(route));
  const typeFilter = $derived(addonsTypeFilter(route));

  function addonsTitle(value: PrimaryRoute): string {
    if (value.kind === 'addonDetail') return 'Add-on details';
    if (value.kind === 'addonsVideo') return 'Video add-ons';
    if (value.kind === 'addonsAudio') return 'Audio add-ons';
    if (value.kind === 'addonsExecutable') return 'Executable add-ons';
    return 'Add-on catalog';
  }

  function addonsDescription(value: PrimaryRoute): string {
    if (value.kind === 'addonDetail')
      return 'Review add-on detail and enablement status through the safe add-on detail surface.';
    if (value.kind === 'addonsVideo')
      return 'Video add-ons are presented through the same safe installed add-ons panel.';
    if (value.kind === 'addonsAudio')
      return 'Audio add-ons are presented through the same safe installed add-ons panel.';
    if (value.kind === 'addonsExecutable')
      return 'Executable add-ons are inspect-only from this installed add-ons surface; execution is deferred.';
    return 'Inspect installed add-ons through the safe catalog panel without exposing raw add-on payloads or credentials.';
  }

  function addonsTypeFilter(value: PrimaryRoute): AddonsTypeFilter | null {
    if (value.kind === 'addonsVideo') return 'video';
    if (value.kind === 'addonsAudio') return 'audio';
    if (value.kind === 'addonsExecutable') return 'executable';
    return null;
  }
</script>

<section class="app-page-section addons-page" aria-labelledby="addons-page-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Installed add-ons</p>
    <h2 id="addons-page-title">{title}</h2>
    <p>{description}</p>
  </div>

  {#if route.kind === 'addonDetail'}
    <AddonDetailShell {snapshot} dispatch={addonDetailDispatch} {i18n} />
  {:else}
    <AddonsPanel {snapshot} {dispatch} {i18n} {typeFilter} {packageBasePath} />
  {/if}
</section>

<style>
  .addons-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .app-page-section__header h2,
  .app-page-section__header p {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker) {
    max-width: 48rem;
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
</style>
