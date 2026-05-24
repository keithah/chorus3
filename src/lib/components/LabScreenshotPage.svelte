<script lang="ts">
  import { buildAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { RemoteInputAction } from '$lib/kodi';
  import type { RemoteInputPanelRemoteDispatch } from './RemoteInputPanel.svelte';

  interface Props {
    dispatch: RemoteInputPanelRemoteDispatch;
    buildOptions?: BuildAppRouteOptions;
  }

  let { dispatch, buildOptions = {} }: Props = $props();

  let requested = $state(false);

  function navigateToHref(href: string): void {
    if (href.startsWith('#') && typeof globalThis.location?.hash === 'string') {
      globalThis.location.hash = href;
      return;
    }

    globalThis.history?.replaceState?.({}, '', href);
    globalThis.dispatchEvent?.(new PopStateEvent('popstate'));
  }

  $effect(() => {
    if (requested) {
      return;
    }

    requested = true;
    void dispatch.executeAction?.('screenshot' as RemoteInputAction);

    if (typeof window !== 'undefined') {
      window.queueMicrotask(() => {
        navigateToHref(buildAppRoute({ kind: 'primary', route: { kind: 'lab' } }, buildOptions));
      });
    }
  });
</script>

<section class="classic-lab-screenshot" aria-labelledby="lab-screenshot-title" role="status">
  <h2 id="lab-screenshot-title">Screenshot</h2>
  <p>Screenshot saved to your screenshots folder.</p>
</section>

<style>
  .classic-lab-screenshot {
    display: grid;
    gap: 0.75rem;
    padding: 2rem;
    color: #333;
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 2.25rem;
    font-weight: 300;
  }
</style>
