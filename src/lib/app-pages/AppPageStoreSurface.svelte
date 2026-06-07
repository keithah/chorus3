<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { addonsStore } from '$lib/stores/addonsStore.svelte';
  import { mediaFilesStore, videoMediaFilesStore } from '$lib/stores/mediaFiles.svelte';
  import { mediaPlaylistsStore } from '$lib/stores/mediaPlaylists.svelte';
  import { mediaSearchStore } from '$lib/stores/mediaSearch.svelte';
  import { musicBrowseStore } from '$lib/stores/musicBrowse.svelte';
  import { musicLibraryStore } from '$lib/stores/musicLibrary.svelte';
  import { pvrStore } from '$lib/stores/pvr.svelte';
  import { settingsStore } from '$lib/stores/settingsStore.svelte';
  import { thumbsUpStore } from '$lib/stores/thumbsUp.svelte';
  import { videoLibraryStore } from '$lib/stores/videoLibrary.svelte';
  import { videoMovieDetailStore } from '$lib/stores/videoMovieDetailStore.svelte';
  import { videoTvStore } from '$lib/stores/videoTvStore.svelte';
  import AppPageSurface from './AppPageSurface.svelte';

  type AppPageSurfaceProps = ComponentProps<typeof AppPageSurface>;
  type OptionalStoreSnapshotProps =
    | 'musicLibrarySnapshot'
    | 'musicBrowseSnapshot'
    | 'mediaSearchSnapshot'
    | 'mediaFilesSnapshot'
    | 'videoMediaFilesSnapshot'
    | 'mediaPlaylistsSnapshot'
    | 'pvrSnapshot'
    | 'thumbsUpSnapshot'
    | 'videoLibrarySnapshot'
    | 'settingsSnapshot'
    | 'addonsSnapshot'
    | 'videoMovieDetailSnapshot'
    | 'videoTvSnapshot';

  type Props = Omit<AppPageSurfaceProps, OptionalStoreSnapshotProps> &
    Partial<Pick<AppPageSurfaceProps, OptionalStoreSnapshotProps>>;

  let {
    route,
    metadata,
    i18n,
    packageBasePath,
    packageSearch,
    parityPlaceholder,
    homeContext,
    connectionSnapshot,
    localeSnapshot,
    localeDispatch,
    playerSnapshot,
    playerDispatch,
    remoteSnapshot,
    remoteInputDispatch,
    localPlayerSnapshot,
    localPlaylistSnapshot,
    localPlaylistDispatch,
    localPlaylistActions,
    queueSnapshot,
    queueDispatch,
    musicLibrarySnapshot: injectedMusicLibrarySnapshot,
    musicBrowseSnapshot: injectedMusicBrowseSnapshot,
    musicBrowseDispatch,
    musicActionDispatch,
    mediaSearchSnapshot: injectedMediaSearchSnapshot,
    mediaSearchDispatch,
    mediaSearchActionDispatch,
    mediaFilesSnapshot: injectedMediaFilesSnapshot,
    mediaFilesDispatch,
    mediaFilesActionDispatch,
    videoMediaFilesSnapshot: injectedVideoMediaFilesSnapshot,
    videoMediaFilesDispatch,
    videoMediaFilesActionDispatch,
    mediaPlaylistsSnapshot: injectedMediaPlaylistsSnapshot,
    mediaPlaylistsDispatch,
    mediaPlaylistsActionDispatch,
    pvrSnapshot: injectedPvrSnapshot,
    pvrDispatch,
    thumbsUpSnapshot: injectedThumbsUpSnapshot,
    thumbsUpDispatch,
    videoLibrarySnapshot: injectedVideoLibrarySnapshot,
    settingsSnapshot: injectedSettingsSnapshot,
    settingsDispatch,
    addonsSnapshot: injectedAddonsSnapshot,
    addonsDispatch,
    addonDetailDispatch,
    videoMovieDetailSnapshot: injectedVideoMovieDetailSnapshot,
    videoMovieActionDispatch,
    videoTvSnapshot: injectedVideoTvSnapshot,
    videoEpisodeActionDispatch,
    videoSeasonArtworkDispatch,
    videoSeasonWriteDispatch,
    renderableVideoRoute
  }: Props = $props();

  const musicLibrarySnapshot = $derived(injectedMusicLibrarySnapshot ?? musicLibraryStore.snapshot);
  const musicBrowseSnapshot = $derived(injectedMusicBrowseSnapshot ?? musicBrowseStore.snapshot);
  const mediaSearchSnapshot = $derived(injectedMediaSearchSnapshot ?? mediaSearchStore.snapshot);
  const mediaFilesSnapshot = $derived(injectedMediaFilesSnapshot ?? mediaFilesStore.snapshot);
  const videoMediaFilesSnapshot = $derived(
    injectedVideoMediaFilesSnapshot ?? videoMediaFilesStore.snapshot
  );
  const mediaPlaylistsSnapshot = $derived(
    injectedMediaPlaylistsSnapshot ?? mediaPlaylistsStore.snapshot
  );
  const pvrSnapshot = $derived(injectedPvrSnapshot ?? pvrStore.snapshot);
  const thumbsUpSnapshot = $derived(injectedThumbsUpSnapshot ?? thumbsUpStore.snapshot);
  const videoLibrarySnapshot = $derived(injectedVideoLibrarySnapshot ?? videoLibraryStore.snapshot);
  const settingsSnapshot = $derived(injectedSettingsSnapshot ?? settingsStore.snapshot);
  const addonsSnapshot = $derived(injectedAddonsSnapshot ?? addonsStore.snapshot);
  const videoMovieDetailSnapshot = $derived(
    injectedVideoMovieDetailSnapshot ?? videoMovieDetailStore.snapshot
  );
  const videoTvSnapshot = $derived(injectedVideoTvSnapshot ?? videoTvStore.snapshot);
</script>

<AppPageSurface
  {route}
  {metadata}
  {i18n}
  {packageBasePath}
  {packageSearch}
  {parityPlaceholder}
  {homeContext}
  {connectionSnapshot}
  {localeSnapshot}
  {localeDispatch}
  {playerSnapshot}
  {playerDispatch}
  {remoteSnapshot}
  {remoteInputDispatch}
  {localPlayerSnapshot}
  {localPlaylistSnapshot}
  {localPlaylistDispatch}
  {localPlaylistActions}
  {queueSnapshot}
  {queueDispatch}
  {musicLibrarySnapshot}
  {musicBrowseSnapshot}
  {musicBrowseDispatch}
  {musicActionDispatch}
  {mediaSearchSnapshot}
  {mediaSearchDispatch}
  {mediaSearchActionDispatch}
  {mediaFilesSnapshot}
  {mediaFilesDispatch}
  {mediaFilesActionDispatch}
  {videoMediaFilesSnapshot}
  {videoMediaFilesDispatch}
  {videoMediaFilesActionDispatch}
  {mediaPlaylistsSnapshot}
  {mediaPlaylistsDispatch}
  {mediaPlaylistsActionDispatch}
  {pvrSnapshot}
  {pvrDispatch}
  {thumbsUpSnapshot}
  {thumbsUpDispatch}
  {videoLibrarySnapshot}
  {settingsSnapshot}
  {settingsDispatch}
  {addonsSnapshot}
  {addonsDispatch}
  {addonDetailDispatch}
  {videoMovieDetailSnapshot}
  {videoMovieActionDispatch}
  {videoTvSnapshot}
  {videoEpisodeActionDispatch}
  {videoSeasonArtworkDispatch}
  {videoSeasonWriteDispatch}
  {renderableVideoRoute}
/>
