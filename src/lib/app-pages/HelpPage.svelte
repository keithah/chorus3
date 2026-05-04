<script lang="ts">
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import { resolveHelpTopic } from './helpTopics';

  interface Props {
    route: PrimaryRoute;
  }

  let { route }: Props = $props();

  const topic = $derived(resolveHelpTopic(route));
</script>

<section class="help-page" aria-labelledby="help-page-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Help</p>
    <h2 id="help-page-title">{topic.title}</h2>
    <p>{topic.summary}</p>
  </div>

  <div class="help-card-grid" aria-label={`${topic.title} topics`}>
    {#each topic.cards as card (card.title)}
      <article class="help-card">
        <h3>{card.title}</h3>
        <p>{card.copy}</p>
      </article>
    {/each}
  </div>
</section>

<style>
  .help-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header,
  .help-card {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .help-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: var(--space-md);
  }

  .app-page-section__header h2,
  .app-page-section__header p,
  .help-card h3,
  .help-card p {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker),
  .help-card p {
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
