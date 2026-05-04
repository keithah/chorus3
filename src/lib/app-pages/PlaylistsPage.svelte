<script lang="ts">
  import LocalPlaylistsPanel from '$components/LocalPlaylistsPanel.svelte';
  import MediaPlaylistsPanel, {
    type MediaPlaylistsActionDispatch,
    type MediaPlaylistsPanelDispatch
  } from '$components/MediaPlaylistsPanel.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    LocalPlaylistDispatch,
    LocalPlaylistSnapshot,
    LocalPlaylistStoreSnapshot,
    MediaPlaylistsStoreSnapshot
  } from '$lib/stores';

  interface Props {
    snapshot: MediaPlaylistsStoreSnapshot;
    dispatch: MediaPlaylistsPanelDispatch;
    actionDispatch: MediaPlaylistsActionDispatch;
    localPlaylistSnapshot: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch: LocalPlaylistDispatch;
    i18n: TranslationContext;
    route?: PrimaryRoute;
  }

  let {
    snapshot,
    dispatch,
    actionDispatch,
    localPlaylistSnapshot,
    localPlaylistDispatch,
    i18n,
    route = { kind: 'playlists' }
  }: Props = $props();

  const localRoutePlaylist = $derived(resolveRoutePlaylist(route, localPlaylistSnapshot));
  const routeLocalSnapshot = $derived(
    route.kind === 'playlistDetail'
      ? withSelectedLocalPlaylist(localPlaylistSnapshot, localRoutePlaylist)
      : localPlaylistSnapshot
  );
  const routeNotFound = $derived(route.kind === 'playlistDetail' && !localRoutePlaylist);

  function resolveRoutePlaylist(
    value: PrimaryRoute,
    localSnapshot: LocalPlaylistStoreSnapshot
  ): LocalPlaylistSnapshot | null {
    if (value.kind !== 'playlistDetail') {
      return null;
    }

    return localSnapshot.playlists.find((playlist) => playlist.id === value.playlistid) ?? null;
  }

  function withSelectedLocalPlaylist(
    localSnapshot: LocalPlaylistStoreSnapshot,
    selectedPlaylist: LocalPlaylistSnapshot | null
  ): LocalPlaylistStoreSnapshot {
    return {
      ...localSnapshot,
      selectedPlaylistId: selectedPlaylist?.id ?? null,
      selectedPlaylist,
      selectedItemCount: selectedPlaylist?.items.length ?? 0
    };
  }
</script>

<section class="app-page-section playlists-page" aria-labelledby="playlists-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Playlist library</p>
    <h2 id="playlists-title">Playlist library</h2>
    <p>
      Manage local browser playlists with durable storage, then browse Kodi media playlists in a
      separate panel. Local playlist diagnostics remain safe while Kodi playlist play and queue
      actions stay scoped to Kodi media playlists.
    </p>
  </div>

  {#if routeNotFound}
    <p class="safe-empty-copy" role="status">
      Local playlist not found. Choose an existing local playlist from the saved browser playlists.
    </p>
  {/if}

  <div class="playlists-page__grid">
    <LocalPlaylistsPanel snapshot={routeLocalSnapshot} dispatch={localPlaylistDispatch} />
    <MediaPlaylistsPanel {snapshot} {dispatch} {actionDispatch} {i18n} />
  </div>
</section>

<style>
  .playlists-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header,
  .playlists-page__grid {
    display: grid;
    gap: var(--space-sm);
  }

  .app-page-section__header {
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .playlists-page__grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    align-items: start;
  }

  .app-page-section__header h2,
  .app-page-section__header p,
  .safe-empty-copy {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker),
  .safe-empty-copy {
    max-width: 52rem;
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
