<script lang="ts">
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { AppPageMetadata } from './appPageMetadata';

  interface Props {
    route: PrimaryRoute;
    metadata: AppPageMetadata;
  }

  let { route, metadata }: Props = $props();

  const detailTitle = $derived(deferredTitle(route, metadata));
  const ownerCopy = $derived(deferredOwnerCopy(route));

  function deferredTitle(value: PrimaryRoute, fallback: AppPageMetadata): string {
    if (value.kind === 'browserItem') return 'Deferred file browser detail';
    if (value.kind === 'playlistDetail') return 'Deferred playlist detail';
    if (value.kind === 'settingsKodiSection') return 'Deferred Kodi settings section';
    if (value.kind === 'addonExecute') return 'Deferred add-on action';
    return fallback.heading;
  }

  function deferredOwnerCopy(value: PrimaryRoute): string {
    if (value.kind === 'browserItem') {
      return 'S06-owned browser behavior will resolve this item through the file browser store without exposing raw file ids.';
    }

    if (value.kind === 'playlistDetail') {
      return 'S05-owned playlist editing will resolve this playlist through playlist-safe identifiers without local persistence claims.';
    }

    if (value.kind === 'settingsKodiSection') {
      return 'S06-owned Kodi settings behavior will map this section to safe settings categories without reflecting raw page ids.';
    }

    if (value.kind === 'addonExecute') {
      return 'Add-on execution stays disabled until a confirmed action surface owns the request boundary.';
    }

    return 'Detailed behavior for this supported route is deferred, but the primary shell owns a safe app-native frame.';
  }
</script>

<section class="deferred-primary-page" aria-labelledby="deferred-primary-title" role="status">
  <p class="section-kicker">Deferred detail</p>
  <h2 id="deferred-primary-title">{detailTitle}</h2>
  <p>{ownerCopy}</p>
  <p>
    This frame intentionally uses generic safe labels and does not echo raw route ids, file paths,
    credentials, JSON-RPC bodies, or browser storage internals.
  </p>
</section>

<style>
  .deferred-primary-page {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--color-warning) 14%, transparent), transparent 58%),
      var(--color-surface);
  }

  .deferred-primary-page h2,
  .deferred-primary-page p {
    margin: 0;
  }

  .deferred-primary-page p:not(.section-kicker) {
    max-width: 50rem;
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
