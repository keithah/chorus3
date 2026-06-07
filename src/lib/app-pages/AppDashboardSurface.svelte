<script lang="ts">
  import HostSettings from '$components/HostSettings.svelte';
  import HostSwitcher from '$components/HostSwitcher.svelte';
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
  import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import AppHomeMediaPanels from '$lib/app-pages/AppHomeMediaPanels.svelte';
  import type { TranslationContext } from '$lib/i18n';
  import { mediaFilesStore } from '$lib/stores/mediaFiles.svelte';
  import { mediaPlaylistsStore } from '$lib/stores/mediaPlaylists.svelte';
  import { mediaSearchStore } from '$lib/stores/mediaSearch.svelte';
  import { musicBrowseStore } from '$lib/stores/musicBrowse.svelte';
  import { musicLibraryStore } from '$lib/stores/musicLibrary.svelte';
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

  type StatusCardProps = {
    title: string;
    status: string;
    tone: 'neutral' | 'success' | 'warning' | 'danger';
    description: string;
  };

  interface Props {
    hostLabel: string;
    description: string;
    statusGridAria: string;
    connection: StatusCardProps;
    themeContract: StatusCardProps;
    musicLibrarySnapshot?: MusicLibraryStoreSnapshot;
    musicBrowseSnapshot?: MusicBrowseStoreSnapshot;
    musicBrowseDispatch: MusicBrowsePanelDispatch;
    musicActionDispatch: MusicBrowseActionDispatch;
    mediaSearchSnapshot?: MediaSearchStoreSnapshot;
    mediaSearchDispatch: MediaSearchPanelDispatch;
    mediaSearchActionDispatch: MediaSearchActionDispatch;
    mediaFilesSnapshot?: MediaFilesStoreSnapshot;
    mediaFilesDispatch: MediaFilesPanelDispatch;
    mediaFilesActionDispatch: MediaFilesActionDispatch;
    mediaPlaylistsSnapshot?: MediaPlaylistsStoreSnapshot;
    mediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
    mediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    queueSnapshot: QueueStoreSnapshot;
    queueDispatch: QueuePanelDispatch;
    i18n: TranslationContext;
  }

  let {
    hostLabel,
    description,
    statusGridAria,
    connection,
    themeContract,
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
    i18n
  }: Props = $props();

  const currentMusicLibrarySnapshot = $derived(musicLibrarySnapshot ?? musicLibraryStore.snapshot);
  const currentMusicBrowseSnapshot = $derived(musicBrowseSnapshot ?? musicBrowseStore.snapshot);
  const currentMediaSearchSnapshot = $derived(mediaSearchSnapshot ?? mediaSearchStore.snapshot);
  const currentMediaFilesSnapshot = $derived(mediaFilesSnapshot ?? mediaFilesStore.snapshot);
  const currentMediaPlaylistsSnapshot = $derived(
    mediaPlaylistsSnapshot ?? mediaPlaylistsStore.snapshot
  );
</script>

<div class="dashboard" aria-label={i18n.t('app.dashboard.aria')}>
  <section class="mission surface" aria-labelledby="mission-title">
    <p class="section-kicker">{i18n.t('app.mission.kicker')}</p>
    <h2 id="mission-title">{hostLabel}</h2>
    <p>{description}</p>
  </section>

  <div class="host-grid">
    <HostSettings {i18n} />
    <HostSwitcher {i18n} />
  </div>

  <section class="status-grid" aria-label={statusGridAria}>
    <StatusCard {...connection} />
    <StatusCard {...themeContract} />
  </section>

  <AppHomeMediaPanels
    musicLibrarySnapshot={currentMusicLibrarySnapshot}
    musicBrowseSnapshot={currentMusicBrowseSnapshot}
    {musicBrowseDispatch}
    {musicActionDispatch}
    mediaSearchSnapshot={currentMediaSearchSnapshot}
    {mediaSearchDispatch}
    {mediaSearchActionDispatch}
    mediaFilesSnapshot={currentMediaFilesSnapshot}
    {mediaFilesDispatch}
    {mediaFilesActionDispatch}
    mediaPlaylistsSnapshot={currentMediaPlaylistsSnapshot}
    {mediaPlaylistsDispatch}
    {mediaPlaylistsActionDispatch}
    {playerSnapshot}
    {playerDispatch}
    {localPlayerSnapshot}
    {queueSnapshot}
    {queueDispatch}
    {i18n}
  />
</div>

<style>
  .dashboard {
    display: grid;
    gap: var(--space-lg);
    align-self: end;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .mission {
    display: grid;
    gap: var(--space-sm);
    padding: clamp(var(--space-lg), 4vw, var(--space-2xl));
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-accent) 16%, transparent),
        transparent 52%
      ),
      var(--color-surface);
  }

  .mission h2,
  .mission p {
    margin: 0;
  }

  .mission h2 {
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 0.95;
    letter-spacing: -0.045em;
  }

  .mission p:not(.section-kicker) {
    max-width: 48rem;
    color: var(--color-text-muted);
    font-size: 1rem;
    line-height: 1.7;
  }

  .host-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(20rem, 0.88fr);
    gap: var(--space-md);
    align-items: start;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }
</style>
