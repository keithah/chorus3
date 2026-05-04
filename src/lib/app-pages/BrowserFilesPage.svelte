<script lang="ts">
  import MediaFilesPanel, {
    type MediaFilesActionDispatch,
    type MediaFilesPanelDispatch
  } from '$components/MediaFilesPanel.svelte';
  import type { TranslationContext } from '$lib/i18n';
  import type { MediaFilesStoreSnapshot } from '$lib/stores';

  interface Props {
    snapshot: MediaFilesStoreSnapshot;
    dispatch: MediaFilesPanelDispatch;
    actionDispatch: MediaFilesActionDispatch;
    i18n: TranslationContext;
  }

  let { snapshot, dispatch, actionDispatch, i18n }: Props = $props();
</script>

<section class="app-page-section browser-files-page" aria-labelledby="browser-files-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Browser surface</p>
    <h2 id="browser-files-title">Browse files and add-ons</h2>
    <p>
      Open Kodi media sources from the app shell, then use supported file actions without exposing
      raw media paths or transport details. Media files stay inside the existing redacted browser panel.
    </p>
  </div>

  <MediaFilesPanel {snapshot} {dispatch} {actionDispatch} {i18n} />
</section>

<style>
  .browser-files-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 56%),
      var(--color-surface);
  }

  .app-page-section__header h2,
  .app-page-section__header p {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker) {
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
</style>
