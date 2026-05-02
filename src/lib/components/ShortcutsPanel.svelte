<script lang="ts">
  import { PLAYBACK_SHORTCUTS, type PlaybackShortcutAction } from '$lib/app/playbackShortcuts';
  import type { TranslationContext } from '$lib/i18n';

  interface Props {
    i18n: TranslationContext;
  }
  let { i18n }: Props = $props();
  function shortcutLabel(action: PlaybackShortcutAction): string {
    return i18n.t(`shortcuts.action.${action}.label`);
  }
  function shortcutDescription(action: PlaybackShortcutAction): string {
    return i18n.t(`shortcuts.action.${action}.description`);
  }
</script>

<section class="shortcuts-panel surface" aria-labelledby="shortcuts-panel-title">
  <div class="shortcuts-panel__header">
    <p class="section-kicker">{i18n.t('shortcuts.eyebrow')}</p>
    <h2 id="shortcuts-panel-title">{i18n.t('shortcuts.panel.title')}</h2>
    <p>{i18n.t('shortcuts.panel.description')}</p>
  </div>
  <div
    class="shortcuts-panel__guidance"
    role="note"
    aria-label={i18n.t('shortcuts.panel.guidanceAria')}
  >
    {i18n.t('shortcuts.panel.guidance')}
  </div>
  <table class="shortcuts-table">
    <caption>{i18n.t('shortcuts.panel.caption')}</caption>
    <thead
      ><tr
        ><th scope="col">{i18n.t('shortcuts.panel.key')}</th><th scope="col"
          >{i18n.t('shortcuts.panel.action')}</th
        ><th scope="col">{i18n.t('shortcuts.panel.behavior')}</th></tr
      ></thead
    >
    <tbody
      >{#each PLAYBACK_SHORTCUTS as shortcut (shortcut.action)}<tr
          ><th scope="row"><kbd>{shortcut.key}</kbd></th><td>{shortcutLabel(shortcut.action)}</td
          ><td>{shortcutDescription(shortcut.action)}</td></tr
        >{/each}</tbody
    >
  </table>
</section>

<style>
  .shortcuts-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-2xl));
  }

  .shortcuts-panel__header {
    display: grid;
    gap: var(--space-sm);
    max-width: 48rem;
  }

  .section-kicker,
  h2,
  p {
    margin: 0;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 0.95;
    letter-spacing: -0.045em;
  }

  .shortcuts-panel__header p,
  .shortcuts-panel__guidance {
    color: var(--color-text-muted);
    line-height: 1.65;
  }

  .shortcuts-panel__guidance {
    border: 1px solid color-mix(in srgb, var(--color-accent) 34%, transparent);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }

  .shortcuts-table {
    width: 100%;
    border-collapse: collapse;
  }

  caption {
    margin-block-end: var(--space-sm);
    color: var(--color-text-muted);
    text-align: left;
  }

  th,
  td {
    border-block-start: 1px solid var(--color-border);
    padding: var(--space-sm);
    text-align: left;
    vertical-align: top;
  }

  tbody th {
    width: 10rem;
  }

  kbd {
    display: inline-block;
    min-width: 4rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.15rem 0.45rem;
    background: var(--color-background);
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
