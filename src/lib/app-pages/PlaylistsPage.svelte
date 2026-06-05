<script lang="ts">
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    LocalPlaylistDispatch,
    LocalPlaylistItemSnapshot,
    LocalPlaylistPlayableItem,
    LocalPlaylistSnapshot,
    LocalPlaylistStoreSnapshot,
    MediaPlaylistsStoreSnapshot
  } from '$lib/stores';
  import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
  import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
  import LazyRouteComponent from '$lib/app-pages/LazyRouteComponent.svelte';
  import { bindLazyRoute, loadMediaPlaylistsPanel } from '$lib/app-pages/appPageSurfaceLazyRoutes';

  export interface LocalPlaylistPageActions {
    playInKodi: (
      playlistId: string,
      items: readonly LocalPlaylistPlayableItem[]
    ) => Promise<void> | void;
    playInBrowser: (
      playlistId: string,
      items: readonly LocalPlaylistPlayableItem[]
    ) => Promise<void> | void;
    exportList: (
      playlistId: string,
      playlistLabel: string,
      items: readonly LocalPlaylistPlayableItem[]
    ) => void;
  }

  interface Props {
    snapshot: MediaPlaylistsStoreSnapshot;
    dispatch: MediaPlaylistsPanelDispatch;
    actionDispatch: MediaPlaylistsActionDispatch;
    localPlaylistSnapshot: LocalPlaylistStoreSnapshot;
    localPlaylistDispatch: LocalPlaylistDispatch;
    localPlaylistActions?: LocalPlaylistPageActions;
    i18n: TranslationContext;
    route?: PrimaryRoute;
    buildOptions?: BuildAppRouteOptions;
  }

  let {
    snapshot,
    dispatch,
    actionDispatch,
    localPlaylistSnapshot,
    localPlaylistDispatch,
    localPlaylistActions,
    i18n,
    route = { kind: 'playlists' },
    buildOptions = {}
  }: Props = $props();

  let newPlaylistName = $state('');
  let renameName = $state('');
  let menuOpen = $state(false);
  let pendingDelete = $state(false);
  let autoRefreshStarted = $state(false);

  const routePlaylist = $derived(resolveRoutePlaylist(route, localPlaylistSnapshot));
  const selectedPlaylist = $derived(
    route.kind === 'playlistDetail'
      ? routePlaylist
      : (localPlaylistSnapshot.selectedPlaylist ?? localPlaylistSnapshot.playlists[0] ?? null)
  );
  const selectedItems = $derived(selectedPlaylist?.items ?? []);
  const routeNotFound = $derived(route.kind === 'playlistDetail' && !routePlaylist);
  const isRunning = $derived(localPlaylistSnapshot.mutationStatus === 'running');
  const playableItems = $derived(
    selectedPlaylist ? (localPlaylistDispatch.getPlayableItems?.(selectedPlaylist.id) ?? []) : []
  );
  const canUsePlaylistActions = $derived(playableItems.length > 0 && !isRunning);

  $effect(() => {
    renameName = selectedPlaylist?.label ?? '';
    pendingDelete = false;
    menuOpen = false;
  });

  $effect(() => {
    if (autoRefreshStarted || snapshot.refreshStatus !== 'idle') {
      return;
    }

    autoRefreshStarted = true;
    void dispatch.refresh();
  });

  function resolveRoutePlaylist(
    value: PrimaryRoute,
    localSnapshot: LocalPlaylistStoreSnapshot
  ): LocalPlaylistSnapshot | null {
    if (value.kind !== 'playlistDetail') {
      return null;
    }

    return localSnapshot.playlists.find((playlist) => playlist.id === value.playlistid) ?? null;
  }

  function createPlaylist(): void {
    const name = newPlaylistName.trim();
    if (!name || isRunning) {
      return;
    }

    const result = localPlaylistDispatch.createPlaylist(name);
    if (result.ok) {
      newPlaylistName = '';
      navigateToPlaylist(result.playlist.id);
    }
  }

  function renameSelected(): void {
    if (!selectedPlaylist || !renameName.trim() || isRunning) {
      return;
    }

    localPlaylistDispatch.renamePlaylist(selectedPlaylist.id, renameName.trim());
  }

  function clearSelected(): void {
    if (!selectedPlaylist || selectedItems.length === 0 || isRunning) {
      return;
    }

    localPlaylistDispatch.clearPlaylist(selectedPlaylist.id);
    menuOpen = false;
  }

  async function playSelectedInKodi(): Promise<void> {
    if (!selectedPlaylist || !localPlaylistActions || !canUsePlaylistActions) {
      return;
    }

    await localPlaylistActions.playInKodi(selectedPlaylist.id, playableItems);
    menuOpen = false;
  }

  async function playSelectedInBrowser(): Promise<void> {
    if (!selectedPlaylist || !localPlaylistActions || !canUsePlaylistActions) {
      return;
    }

    await localPlaylistActions.playInBrowser(selectedPlaylist.id, playableItems);
    menuOpen = false;
  }

  function exportSelected(): void {
    if (!selectedPlaylist || !localPlaylistActions || !canUsePlaylistActions) {
      return;
    }

    localPlaylistActions.exportList(selectedPlaylist.id, selectedPlaylist.label, playableItems);
    menuOpen = false;
  }

  function deleteSelected(): void {
    if (!selectedPlaylist || isRunning) {
      return;
    }

    if (!pendingDelete) {
      pendingDelete = true;
      return;
    }

    localPlaylistDispatch.removePlaylist(selectedPlaylist.id);
    navigateToPlaylists();
  }

  function moveItem(item: LocalPlaylistItemSnapshot, direction: 'up' | 'down'): void {
    if (!selectedPlaylist || isRunning) {
      return;
    }

    localPlaylistDispatch.moveItem(selectedPlaylist.id, item.id, direction);
  }

  function removeItem(item: LocalPlaylistItemSnapshot): void {
    if (!selectedPlaylist || isRunning) {
      return;
    }

    localPlaylistDispatch.removeItem(selectedPlaylist.id, item.id);
  }

  function navigateToPlaylist(playlistId: string): void {
    navigateToHref(
      buildPrimaryAppRoute({ kind: 'playlistDetail', playlistid: playlistId }, buildOptions)
    );
  }

  function navigateToPlaylists(): void {
    navigateToHref(buildPrimaryAppRoute({ kind: 'playlists' }, buildOptions));
  }

  function navigateToHref(href: string): void {
    if (href.startsWith('#') && typeof globalThis.location?.hash === 'string') {
      globalThis.location.hash = href;
      return;
    }

    globalThis.history?.pushState?.({}, '', href);
    globalThis.dispatchEvent?.(new PopStateEvent('popstate'));
  }

  function formatDuration(seconds: number | undefined): string {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
      return '';
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainder = totalSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }
</script>

<section class="classic-local-playlists" aria-labelledby="local-playlists-heading">
  <aside class="local-playlists-sidebar">
    <div class="side-inner">
      <div class="current-lists">
        <h3>Playlists</h3>
        {#if localPlaylistSnapshot.playlists.length === 0}
          <p class="sidebar-empty">No local playlists yet. Create one below.</p>
        {:else}
          <ul class="lists options">
            {#each localPlaylistSnapshot.playlists as playlist (playlist.id)}
              {@const playlistHref = buildPrimaryAppRoute(
                { kind: 'playlistDetail', playlistid: playlist.id },
                buildOptions
              )}
              <li>
                <span class="item">
                  <a
                    href={playlistHref}
                    class:active={selectedPlaylist?.id === playlist.id}
                    onclick={(event) => {
                      event.preventDefault();
                      navigateToPlaylist(playlist.id);
                    }}>{playlist.label}</a
                  >
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      <form
        class="new-list-form"
        onsubmit={(event) => {
          event.preventDefault();
          createPlaylist();
        }}
      >
        <input
          aria-label="New playlist name"
          bind:value={newPlaylistName}
          placeholder="New playlist"
          disabled={isRunning}
        />
        <button type="submit" class="new-list" disabled={isRunning || !newPlaylistName.trim()}>
          New playlist
        </button>
      </form>
    </div>
  </aside>

  <div class="local-playlist">
    {#if routeNotFound}
      <div class="empty-content" role="status">
        Local playlist not found. Choose an existing playlist.
      </div>
    {:else if !selectedPlaylist}
      <div class="empty-content" role="status">
        Empty playlist, you should probably add something to it?
      </div>
    {:else}
      <div class="local-playlist-header">
        <h2 id="local-playlists-heading">{selectedPlaylist.label}</h2>
        <div class="dropdown">
          <button
            type="button"
            aria-label="Playlist actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onclick={() => (menuOpen = !menuOpen)}
          ></button>
          {#if menuOpen}
            <ul class="dropdown-menu" role="menu">
              <li role="menuitem">
                <button
                  type="button"
                  onclick={playSelectedInKodi}
                  disabled={!localPlaylistActions || !canUsePlaylistActions}>Play in Kodi</button
                >
              </li>
              <li role="menuitem">
                <button
                  type="button"
                  onclick={playSelectedInBrowser}
                  disabled={!localPlaylistActions || !canUsePlaylistActions}>Play in browser</button
                >
              </li>
              <li role="menuitem">
                <button
                  type="button"
                  onclick={exportSelected}
                  disabled={!localPlaylistActions || !canUsePlaylistActions}>Export list</button
                >
              </li>
              <li class="divider" aria-hidden="true"></li>
              <li role="menuitem">
                <button type="button" onclick={renameSelected} disabled={isRunning}
                  >Rename playlist</button
                >
              </li>
              <li role="menuitem">
                <button
                  type="button"
                  onclick={clearSelected}
                  disabled={isRunning || selectedItems.length === 0}>Clear playlist</button
                >
              </li>
              <li role="menuitem">
                <button type="button" onclick={deleteSelected} disabled={isRunning}>
                  {pendingDelete ? 'Confirm delete playlist' : 'Delete playlist'}
                </button>
              </li>
            </ul>
          {/if}
        </div>
      </div>

      <div class="rename-row">
        <label for="playlist-rename">Rename playlist</label>
        <input id="playlist-rename" bind:value={renameName} disabled={isRunning} />
      </div>

      <div class="item-container">
        {#if selectedItems.length === 0}
          <div class="empty-content">Empty playlist, you should probably add something to it?</div>
        {:else}
          <ol class="playlist-items">
            {#each selectedItems as item, index (item.id)}
              <li>
                <div class="meta">
                  <span class="title">{item.label}</span>
                  <span class="subtitle">{formatDuration(item.durationSeconds)}</span>
                </div>
                <div class="item-actions">
                  <button
                    type="button"
                    disabled={isRunning || index === 0}
                    onclick={() => moveItem(item, 'up')}>Up</button
                  >
                  <button
                    type="button"
                    disabled={isRunning || index === selectedItems.length - 1}
                    onclick={() => moveItem(item, 'down')}>Down</button
                  >
                  <button type="button" disabled={isRunning} onclick={() => removeItem(item)}
                    >Remove</button
                  >
                </div>
              </li>
            {/each}
          </ol>
        {/if}
      </div>
    {/if}
  </div>
</section>

<section class="kodi-playlists" aria-label="Kodi playlists">
  <LazyRouteComponent
    route={bindLazyRoute(loadMediaPlaylistsPanel, {
      snapshot,
      dispatch,
      actionDispatch,
      i18n
    })}
  />
</section>

<style>
  .classic-local-playlists {
    display: grid;
    grid-template-columns: 255px minmax(0, 1fr);
    min-height: calc(100vh - 109px);
    background: #fff;
    color: #333;
  }

  .kodi-playlists {
    background: #fff;
    color: #333;
  }

  .local-playlists-sidebar {
    background: #f2f2f2;
  }

  .side-inner {
    padding: 24px 22px;
  }

  h3 {
    margin: 0 0 13px;
    color: #888;
    font-size: 17px;
    font-weight: 400;
  }

  .sidebar-empty {
    margin: 0 0 12px;
    color: #888;
    font-size: 13px;
    line-height: 1.4;
  }

  .lists {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lists li {
    margin: 8px 0;
  }

  .lists a {
    color: #333;
    font-size: 14px;
    text-decoration: none;
  }

  .lists a.active,
  .lists a:hover {
    color: #4db3e6;
  }

  .new-list-form {
    display: grid;
    gap: 10px;
    margin-top: 24px;
  }

  .new-list-form input,
  .rename-row input {
    height: 28px;
    border: 0;
    border-bottom: 1px solid #aaa;
    border-radius: 0;
    background: #fff;
    color: #333;
  }

  .new-list,
  .dropdown-menu button {
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
  }

  .new-list {
    color: #4db3e6;
    font-weight: 600;
  }

  .local-playlist {
    min-width: 0;
    background: #fff;
  }

  .local-playlist-header {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    align-items: center;
    min-height: 53px;
    padding: 0 0 0 17px;
    border-bottom: 1px solid #ddd;
    background: #f5f5f5;
  }

  .local-playlist-header h2 {
    margin: 0;
    color: #333;
    font-size: 19px;
    font-weight: 400;
  }

  .dropdown {
    position: relative;
    height: 100%;
  }

  .dropdown > button {
    width: 44px;
    height: 100%;
    border: 0;
    background: transparent;
    color: #777;
  }

  .dropdown > button::before {
    content: '⋮';
    font-size: 24px;
    line-height: 1;
  }

  .dropdown-menu {
    position: absolute;
    top: 45px;
    right: 8px;
    z-index: 5;
    width: 170px;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    background: #fff;
    box-shadow: 0 2px 7px rgb(0 0 0 / 0.24);
  }

  .dropdown-menu li,
  .dropdown-menu button {
    width: 100%;
    padding: 8px 13px;
    color: #666;
    font-size: 13px;
  }

  .dropdown-menu button:disabled {
    color: #bbb;
  }

  .divider {
    height: 1px;
    margin: 4px 0;
    padding: 0 !important;
    background: #eee;
  }

  .rename-row {
    display: grid;
    grid-template-columns: 150px minmax(12rem, 22rem);
    gap: 18px;
    align-items: center;
    padding: 22px 17px;
    color: #555;
    font-size: 14px;
  }

  .item-container {
    padding: 0 17px 40px;
  }

  .empty-content {
    padding: 18px 0;
    color: #888;
    font-size: 15px;
  }

  .playlist-items {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .playlist-items li {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 42px;
    border-bottom: 1px solid #eee;
    color: #777;
  }

  .playlist-items li:hover {
    background: #eee;
  }

  .meta {
    display: grid;
    gap: 2px;
    min-width: 0;
    padding: 8px 10px 6px 0;
  }

  .title,
  .subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title {
    color: #333;
  }

  .subtitle {
    color: #999;
    font-size: 13px;
  }

  .item-actions {
    display: none;
    gap: 5px;
    align-items: center;
  }

  .playlist-items li:hover .item-actions {
    display: flex;
  }

  .item-actions button {
    border: 0;
    background: transparent;
    color: #777;
    font-size: 12px;
  }

  @media (max-width: 760px) {
    .classic-local-playlists {
      grid-template-columns: 1fr;
    }
  }
</style>
