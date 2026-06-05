<script lang="ts" module>
  import type { Component } from 'svelte';

  export type LazyRouteModule<TComponent = unknown> = {
    default: TComponent;
  };

  export type LazyRouteLoader<TComponent = unknown> = (() => Promise<
    LazyRouteModule<TComponent>
  >) & {
    current?: LazyRouteModule<TComponent>;
  };

  export type BoundLazyRoute<TComponent = unknown> = {
    load: LazyRouteLoader<TComponent>;
    props?: object;
  };
</script>

<script lang="ts">
  interface Props {
    route?: BoundLazyRoute;
    load?: LazyRouteLoader;
    props?: object;
    label?: string;
  }

  let { route, load, props, label = 'Loading page...' }: Props = $props();

  const routeLoad = $derived(route?.load ?? load);
  const routeProps = $derived(route?.props ?? props);
  const loadedModule = $derived(routeLoad?.current ?? null);
  const loadedComponent = $derived((loadedModule?.default ?? null) as Component | null);
</script>

{#if !routeLoad}
  <p class="lazy-route-status" role="status">Could not load this page.</p>
{:else if loadedComponent}
  <!-- svelte-ignore svelte_component_deprecated -->
  <svelte:component this={loadedComponent} {...routeProps ?? {}} />
{:else}
  {#await routeLoad()}
    <p class="lazy-route-status" role="status">{label}</p>
  {:then module}
    {@const component = module.default as Component}
    <!-- svelte-ignore svelte_component_deprecated -->
    <svelte:component this={component} {...routeProps ?? {}} />
  {:catch}
    <p class="lazy-route-status" role="status">Could not load this page.</p>
  {/await}
{/if}

<style>
  .lazy-route-status {
    margin: 0;
    padding: 1rem;
    color: var(--color-text-muted);
  }
</style>
