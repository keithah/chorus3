<script lang="ts">
  interface Props {
    title: string;
    eyebrow?: string;
    description?: string;
    deferredMessage?: string;
    children?: import('svelte').Snippet;
  }

  let {
    title,
    eyebrow = 'Chorus route',
    description = '',
    deferredMessage = '',
    children
  }: Props = $props();
</script>

<section class="app-page-frame" aria-labelledby="app-page-frame-title">
  <div class="app-page-frame__copy">
    <p class="app-page-frame__eyebrow">{eyebrow}</p>
    <h2 id="app-page-frame-title">{title}</h2>
    {#if description}
      <p class="app-page-frame__description">{description}</p>
    {/if}
    {#if deferredMessage}
      <p class="app-page-frame__deferred">{deferredMessage}</p>
    {/if}
  </div>

  {#if children}
    <div class="app-page-frame__body">
      {@render children()}
    </div>
  {/if}
</section>

<style>
  .app-page-frame {
    display: grid;
    gap: 1rem;
    min-height: 100%;
    padding: clamp(1.25rem, 3vw, 2.5rem);
    color: #eef6fa;
  }

  .app-page-frame__copy {
    display: grid;
    gap: 0.45rem;
    max-width: 48rem;
    padding: clamp(1rem, 2.5vw, 1.5rem);
    background: rgb(20 24 26 / 0.72);
    border: 1px solid rgb(255 255 255 / 0.12);
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.26);
  }

  .app-page-frame__eyebrow,
  .app-page-frame__description,
  .app-page-frame__deferred,
  h2 {
    margin: 0;
  }

  .app-page-frame__eyebrow {
    color: #79cef4;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2 {
    color: #fff;
    font-size: clamp(2rem, 5vw, 4.25rem);
    line-height: 0.95;
    letter-spacing: -0.055em;
  }

  .app-page-frame__description,
  .app-page-frame__deferred {
    color: #c7d2d8;
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .app-page-frame__deferred {
    color: #9bd8f4;
  }

  .app-page-frame__body {
    display: grid;
    gap: 1rem;
  }

  .app-page-frame__body :global(.surface),
  .app-page-frame__body :global(.music-library-panel),
  .app-page-frame__body :global(.music-browse-panel),
  .app-page-frame__body :global(.media-search-panel),
  .app-page-frame__body :global(.media-files-panel),
  .app-page-frame__body :global(.media-playlists-panel),
  .app-page-frame__body :global(.remote-input-panel),
  .app-page-frame__body :global(.addons-panel),
  .app-page-frame__body :global(.settings-panel),
  .app-page-frame__body :global(.video-movies-panel),
  .app-page-frame__body :global(.video-tv-shows-panel),
  .app-page-frame__body :global(.video-recent-panel) {
    color: var(--color-text, #1f2933);
  }
</style>
