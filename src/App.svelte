<script lang="ts">
  const appName = 'chorus3';
</script>

<main class="app-shell" aria-labelledby="app-title">
  <p class="eyebrow">Foundation shell</p>
  <h1 id="app-title">{appName}</h1>
  <p>No Kodi host configured yet.</p>
</main>

<style>
  .app-shell {
    min-height: 100vh;
    display: grid;
    place-content: center;
    gap: 0.75rem;
    padding: 2rem;
    text-align: center;
  }

  .eyebrow {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    font-size: clamp(2.5rem, 8vw, 5rem);
    line-height: 1;
  }
</style>
