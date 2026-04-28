<script lang="ts">
  import AppShell from '$components/AppShell.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
</script>

<AppShell>
  <header class="hero" aria-labelledby="app-title">
    <div class="hero-copy">
      <p class="eyebrow">Foundation shell</p>
      <h1 id="app-title">chorus3</h1>
      <p class="lede">
        A token-driven media console foundation for Kodi control surfaces, ready for the connection
        client work that follows this slice.
      </p>
    </div>
    <ThemeToggle />
  </header>

  <main class="dashboard" aria-label="Foundation status">
    <section class="mission surface" aria-labelledby="mission-title">
      <p class="section-kicker">Runtime surface</p>
      <h2 id="mission-title">No Kodi host configured yet</h2>
      <p>
        This static shell intentionally renders useful placeholder diagnostics before any Kodi
        client, host store, or credential flow exists.
      </p>
    </section>

    <section class="status-grid" aria-label="Kodi readiness placeholders">
      <StatusCard
        title="Connection"
        status="standby"
        tone="warning"
        description="No Kodi host configured yet. S03 will replace this placeholder with live connection state."
      />
      <StatusCard
        title="Library sync"
        status="waiting"
        description="Media-library signals are paused until a real Kodi endpoint is configured by later slices."
      />
      <StatusCard
        title="Theme contract"
        status="active"
        tone="success"
        description="The toggle updates the root data-theme attribute and keeps colors flowing through project tokens."
      />
    </section>
  </main>
</AppShell>

<style>
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-lg);
    align-items: start;
    padding-block-start: clamp(var(--space-md), 4vw, var(--space-xl));
  }

  .hero-copy {
    max-width: 48rem;
  }

  .eyebrow,
  .section-kicker,
  h1,
  h2,
  p {
    margin: 0;
  }

  .eyebrow,
  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin-block-start: var(--space-sm);
    font-size: clamp(4rem, 16vw, 10rem);
    line-height: 0.82;
    letter-spacing: -0.08em;
  }

  .lede {
    max-width: 42rem;
    margin-block-start: var(--space-lg);
    color: var(--color-text-muted);
    font-size: clamp(1.05rem, 2vw, 1.35rem);
    line-height: 1.55;
  }

  .dashboard {
    display: grid;
    gap: var(--space-lg);
    align-self: end;
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

  .status-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
