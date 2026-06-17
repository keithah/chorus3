<script lang="ts">
  import type {
    MediaFilesActionDispatch,
    MediaFilesPanelDispatch
  } from '$components/MediaFilesPanel.svelte';
  import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
  import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
  import type {
    MediaSearchActionDispatch,
    MediaSearchPanelDispatch
  } from '$components/MediaSearchPanel.svelte';
  import type {
    MusicBrowseActionDispatch,
    MusicBrowsePanelDispatch
  } from '$components/MusicBrowsePanel.svelte';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import QueuePanel, { type QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import type { BuildAppRouteOptions } from '$lib/app/appRouter';
  import LibraryQuickActions, {
    type LibraryQuickActionsDispatch
  } from './LibraryQuickActions.svelte';
  import LazyViewportRouteComponent from '$lib/app-pages/LazyViewportRouteComponent.svelte';
  import {
    bindLazyRoute,
    loadMediaFilesPanel,
    loadMediaPlaylistsPanel,
    loadMediaSearchPanel,
    loadMusicBrowsePanel,
    loadMusicLibraryPanel,
    loadNowPlayingPanel
  } from '$lib/app-pages/appPageSurfaceLazyRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type {
    LocalPlayerStoreSnapshot,
    MediaFilesStoreSnapshot,
    MediaPlaylistsStoreSnapshot,
    MediaSearchStoreSnapshot,
    MusicBrowseStoreSnapshot,
    MusicLibraryStoreSnapshot,
    PlayerStoreSnapshot,
    QueueStoreSnapshot
  } from '$lib/stores';

  interface Props {
    musicLibrarySnapshot: MusicLibraryStoreSnapshot;
    musicBrowseSnapshot: MusicBrowseStoreSnapshot;
    musicBrowseDispatch: MusicBrowsePanelDispatch;
    musicActionDispatch: MusicBrowseActionDispatch;
    mediaSearchSnapshot: MediaSearchStoreSnapshot;
    mediaSearchDispatch: MediaSearchPanelDispatch;
    mediaSearchActionDispatch: MediaSearchActionDispatch;
    mediaFilesSnapshot: MediaFilesStoreSnapshot;
    mediaFilesDispatch: MediaFilesPanelDispatch;
    mediaFilesActionDispatch: MediaFilesActionDispatch;
    mediaPlaylistsSnapshot: MediaPlaylistsStoreSnapshot;
    mediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
    mediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    queueSnapshot: QueueStoreSnapshot;
    queueDispatch: QueuePanelDispatch;
    libraryMaintenanceDispatch: LibraryQuickActionsDispatch;
    i18n: TranslationContext;
    buildOptions?: BuildAppRouteOptions;
  }

  let {
    musicLibrarySnapshot,
    musicBrowseSnapshot,
    musicBrowseDispatch,
    musicActionDispatch,
    mediaSearchSnapshot,
    mediaSearchDispatch,
    mediaSearchActionDispatch,
    mediaFilesSnapshot,
    mediaFilesDispatch,
    mediaFilesActionDispatch,
    mediaPlaylistsSnapshot,
    mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch,
    playerSnapshot,
    playerDispatch,
    localPlayerSnapshot,
    queueSnapshot,
    queueDispatch,
    libraryMaintenanceDispatch,
    i18n,
    buildOptions
  }: Props = $props();
</script>

<LibraryQuickActions dispatch={libraryMaintenanceDispatch} {i18n} />
<LazyViewportRouteComponent
  minHeight="44rem"
  route={bindLazyRoute(loadMusicLibraryPanel, {
    snapshot: musicLibrarySnapshot,
    i18n
  })}
/>
<LazyViewportRouteComponent
  minHeight="48rem"
  route={bindLazyRoute(loadMusicBrowsePanel, {
    librarySnapshot: musicLibrarySnapshot,
    browseSnapshot: musicBrowseSnapshot,
    dispatch: musicBrowseDispatch,
    actionDispatch: musicActionDispatch,
    i18n
  })}
/>
<LazyViewportRouteComponent
  minHeight="36rem"
  route={bindLazyRoute(loadMediaSearchPanel, {
    snapshot: mediaSearchSnapshot,
    dispatch: mediaSearchDispatch,
    actionDispatch: mediaSearchActionDispatch,
    i18n,
    buildOptions
  })}
/>
<LazyViewportRouteComponent
  minHeight="36rem"
  route={bindLazyRoute(loadMediaFilesPanel, {
    snapshot: mediaFilesSnapshot,
    dispatch: mediaFilesDispatch,
    actionDispatch: mediaFilesActionDispatch,
    i18n
  })}
/>
<LazyViewportRouteComponent
  minHeight="36rem"
  route={bindLazyRoute(loadMediaPlaylistsPanel, {
    snapshot: mediaPlaylistsSnapshot,
    dispatch: mediaPlaylistsDispatch,
    actionDispatch: mediaPlaylistsActionDispatch,
    i18n
  })}
/>
<LazyViewportRouteComponent
  minHeight="28rem"
  route={bindLazyRoute(loadNowPlayingPanel, {
    snapshot: playerSnapshot,
    dispatch: playerDispatch,
    localPlayerSnapshot,
    i18n
  })}
/>
<QueuePanel snapshot={queueSnapshot} dispatch={queueDispatch} {i18n} />
