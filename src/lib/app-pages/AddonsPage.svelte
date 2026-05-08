<script lang="ts">
  import AddonDetailShell, { type AddonDetailDispatch } from '$components/AddonDetailShell.svelte';
  import AddonsPanel, {
    type AddonsPanelDispatch,
    type AddonsTypeFilter
  } from '$components/AddonsPanel.svelte';
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
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
    buildOptions?: BuildAppRouteOptions;
  }

  let {
    route,
    snapshot,
    dispatch,
    addonDetailDispatch,
    i18n,
    packageBasePath = '',
    buildOptions = {}
  }: Props = $props();

  const typeFilter = $derived(addonsTypeFilter(route));
  const routeBuildOptions = $derived(resolveBuildOptions(buildOptions, packageBasePath));
  const allAddonsHref = $derived(hrefFor({ kind: 'addonsAll' }));
  const videoAddonsHref = $derived(hrefFor({ kind: 'addonsVideo' }));
  const audioAddonsHref = $derived(hrefFor({ kind: 'addonsAudio' }));
  const executableAddonsHref = $derived(hrefFor({ kind: 'addonsExecutable' }));

  function addonsTitle(value: PrimaryRoute): string {
    if (value.kind === 'addonDetail') return 'Add-on details';
    if (value.kind === 'addonsVideo') return 'Video add-ons';
    if (value.kind === 'addonsAudio') return 'Audio add-ons';
    if (value.kind === 'addonsExecutable') return 'Executable add-ons';
    return 'Add-on catalog';
  }

  function addonsTypeFilter(value: PrimaryRoute): AddonsTypeFilter | null {
    if (value.kind === 'addonsVideo') return 'video';
    if (value.kind === 'addonsAudio') return 'audio';
    if (value.kind === 'addonsExecutable') return 'executable';
    return null;
  }

  function hrefFor(target: PrimaryRoute): string {
    return buildPrimaryAppRoute(target, routeBuildOptions);
  }

  function resolveBuildOptions(
    options: BuildAppRouteOptions,
    basePath: string
  ): BuildAppRouteOptions {
    return options.packageBasePath || options.routeMode
      ? options
      : { packageBasePath: basePath, routeMode: basePath ? 'hash' : 'path' };
  }

  function navigateToHref(href: string): void {
    if (href.startsWith('#') && typeof globalThis.location?.hash === 'string') {
      globalThis.location.hash = href;
      return;
    }

    globalThis.history?.pushState?.({}, '', href);
    globalThis.dispatchEvent?.(new PopStateEvent('popstate'));
  }

  function handleRouteLink(event: MouseEvent, href: string): void {
    event.preventDefault();
    navigateToHref(href);
  }
</script>

<section class="classic-page addons-page" aria-labelledby="addons-page-title">
  <aside class="classic-subnav" aria-label="Add-on sections">
    <p class="subnav-kicker">Add-ons</p>
    <a
      class:active={route.kind === 'addonsAll'}
      href={allAddonsHref}
      onclick={(event) => handleRouteLink(event, allAddonsHref)}>All add-ons</a
    >
    <a
      class:active={route.kind === 'addonsVideo'}
      href={videoAddonsHref}
      onclick={(event) => handleRouteLink(event, videoAddonsHref)}>Video add-ons</a
    >
    <a
      class:active={route.kind === 'addonsAudio'}
      href={audioAddonsHref}
      onclick={(event) => handleRouteLink(event, audioAddonsHref)}>Audio add-ons</a
    >
    <a
      class:active={route.kind === 'addonsExecutable'}
      href={executableAddonsHref}
      onclick={(event) => handleRouteLink(event, executableAddonsHref)}>Executable add-ons</a
    >
  </aside>

  <section class="addons-content" aria-labelledby="addons-page-title">
    <h2 id="addons-page-title">{addonsTitle(route)}</h2>
    {#if route.kind === 'addonDetail'}
      <AddonDetailShell {snapshot} dispatch={addonDetailDispatch} {i18n} />
    {:else}
      <AddonsPanel
        {snapshot}
        {dispatch}
        {i18n}
        {typeFilter}
        {packageBasePath}
        buildOptions={routeBuildOptions}
      />
    {/if}
  </section>
</section>

<style>
  .classic-page {
    display: grid;
    grid-template-columns: 256px minmax(0, 1fr);
    min-height: 100%;
    background: #ddd;
    color: #333;
  }

  .classic-subnav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 2rem 1.4rem;
    background: #f5f5f5;
  }

  .subnav-kicker {
    margin: 0 0 0.5rem;
    color: #888;
    font-size: 0.9rem;
    text-transform: uppercase;
  }

  .classic-subnav a {
    color: #333;
    text-decoration: none;
  }

  .classic-subnav a.active {
    color: #4bb3e8;
    font-weight: 700;
  }

  .addons-content {
    display: grid;
    align-content: start;
    gap: 1rem;
    padding: 1rem;
  }

  .addons-content > h2 {
    margin: 0;
    color: #555;
    font-size: 1.35rem;
    font-weight: 400;
  }

  @media (max-width: 760px) {
    .classic-page {
      grid-template-columns: 1fr;
    }

    .classic-subnav {
      flex-direction: row;
      flex-wrap: wrap;
      padding: 1rem;
    }

    .subnav-kicker {
      width: 100%;
    }
  }
</style>
