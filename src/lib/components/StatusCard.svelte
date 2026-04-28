<script lang="ts">
  interface Props {
    title: string;
    status: string;
    description: string;
    tone?: 'neutral' | 'success' | 'warning';
  }

  let { title, status, description, tone = 'neutral' }: Props = $props();
</script>

<article class={`status-card status-card-${tone}`}>
  <div class="status-card-topline">
    <h2>{title}</h2>
    <span class="status-pill">{status}</span>
  </div>
  <p>{description}</p>
</article>

<style>
  .status-card {
    display: grid;
    gap: var(--space-md);
    min-height: 12rem;
    padding: var(--space-lg);
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-surface-raised) 74%, transparent),
        transparent
      ),
      var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
  }

  .status-card-topline {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: clamp(1.1rem, 2vw, 1.35rem);
    line-height: 1.15;
  }

  p {
    max-width: 36rem;
    color: var(--color-text-muted);
    line-height: 1.65;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-2xs) var(--space-sm);
    color: var(--status-color, var(--color-text-muted));
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: color-mix(in srgb, var(--status-color, var(--color-text-muted)) 12%, transparent);
    border: 1px solid
      color-mix(in srgb, var(--status-color, var(--color-text-muted)) 30%, transparent);
    border-radius: var(--radius-pill);
  }

  .status-pill::before {
    width: 0.5rem;
    aspect-ratio: 1;
    content: '';
    background: currentColor;
    border-radius: 50%;
    box-shadow: 0 0 1rem currentColor;
  }

  .status-card-neutral {
    --status-color: var(--color-text-muted);
  }

  .status-card-success {
    --status-color: var(--color-success);
  }

  .status-card-warning {
    --status-color: var(--color-warning);
  }
</style>
