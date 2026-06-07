<script lang="ts">
  import { onMount } from 'svelte';
  import LazyRouteComponent, { type BoundLazyRoute } from './LazyRouteComponent.svelte';

  interface Props {
    route: BoundLazyRoute;
    label?: string;
    minHeight?: string;
    rootMargin?: string;
  }

  let {
    route,
    label = 'Loading panel...',
    minHeight = '28rem',
    rootMargin = '320px'
  }: Props = $props();

  let container = $state<HTMLElement | null>(null);
  let shouldLoad = $state(false);

  onMount(() => {
    if (typeof IntersectionObserver !== 'function' || !container) {
      shouldLoad = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          shouldLoad = true;
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  });
</script>

<section bind:this={container} class="lazy-viewport-panel" style:min-height={minHeight}>
  {#if shouldLoad}
    <LazyRouteComponent {route} {label} />
  {/if}
</section>

<style>
  .lazy-viewport-panel {
    display: block;
  }
</style>
