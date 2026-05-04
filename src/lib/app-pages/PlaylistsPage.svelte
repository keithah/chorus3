<script lang="ts">
  import MediaPlaylistsPanel, {
    type MediaPlaylistsActionDispatch,
    type MediaPlaylistsPanelDispatch
  } from '$components/MediaPlaylistsPanel.svelte';
  import type { TranslationContext } from '$lib/i18n';
  import type { MediaPlaylistsStoreSnapshot } from '$lib/stores';

  interface Props {
    snapshot: MediaPlaylistsStoreSnapshot;
    dispatch: MediaPlaylistsPanelDispatch;
    actionDispatch: MediaPlaylistsActionDispatch;
    i18n: TranslationContext;
  }

  let { snapshot, dispatch, actionDispatch, i18n }: Props = $props();
</script>

<section class="app-page-section playlists-page" aria-labelledby="playlists-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Playlist library</p>
    <h2 id="playlists-title">Playlist library</h2>
    <p>
      Browse Kodi playlists with safe play and queue actions. Media playlists and local playlist
      affordances stay app-native while creation remains guarded until persistence lands in the
      playlist slice.
    </p>
    <button
      type="button"
      class="disabled-affordance"
      disabled
      aria-disabled="true"
      title="Playlist creation is deferred until local playlist persistence is implemented."
    >
      New playlist
    </button>
  </div>

  {#if snapshot.playlists.length === 0}
    <p class="safe-empty-copy" role="status">
      No Kodi playlists are available in this snapshot. Local playlist creation is not persisted yet.
    </p>
  {/if}

  <MediaPlaylistsPanel {snapshot} {dispatch} {actionDispatch} {i18n} />
</section>

<style>
  .playlists-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .app-page-section__header h2,
  .app-page-section__header p,
  .safe-empty-copy {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker),
  .safe-empty-copy {
    max-width: 48rem;
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

  .disabled-affordance {
    justify-self: start;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 0.55rem 0.9rem;
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-surface) 82%, var(--color-border));
  }
</style>
