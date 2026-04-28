<script lang="ts">
  import {
    configStore,
    hostConnectionStore,
    type HostConnectionErrorSnapshot,
    type HostTestSnapshot
  } from '$lib/stores';

  const configSnapshot = $derived(configStore.snapshot);
  const connectionSnapshot = $derived(hostConnectionStore.snapshot);

  function testHost(hostId: string): void {
    void hostConnectionStore.testHost(hostId);
  }

  function activateHost(hostId: string): void {
    void hostConnectionStore.activateHost(hostId);
  }

  function formatTestStatus(test: HostTestSnapshot | undefined): string {
    if (!test || test.status === 'idle') {
      return 'Not tested';
    }

    if (test.status === 'testing') {
      return 'Testing…';
    }

    if (test.status === 'success') {
      return 'Test passed';
    }

    return 'Test failed';
  }

  function formatTestDetails(test: HostTestSnapshot | undefined): string {
    if (!test || test.status === 'idle') {
      return 'Run a safe HTTP JSON-RPC diagnostic before switching if you want a quick check.';
    }

    if (test.status === 'testing') {
      return 'Checking HTTP JSON-RPC with secret-safe diagnostics.';
    }

    if (test.status === 'failed') {
      return formatError(test.error);
    }

    const parts = [formatKodiVersion(test.kodiVersion), test.applicationName]
      .filter(Boolean)
      .map((value, index) => (index === 0 ? `Kodi ${value}` : `Application ${value}`));

    return parts.length > 0 ? parts.join(' · ') : 'HTTP JSON-RPC responded successfully.';
  }

  function formatError(error: HostConnectionErrorSnapshot | null): string {
    if (!error) {
      return 'Kodi did not return additional diagnostics.';
    }

    return `${error.message} (${error.source}/${error.code})`;
  }

  function formatKodiVersion(version: HostTestSnapshot['kodiVersion']): string | null {
    if (version === null) {
      return null;
    }

    if (typeof version === 'string') {
      return version.trim() || null;
    }

    const parts = [version.major, version.minor, version.patch].filter(
      (part) => part !== undefined && part !== null
    );

    return parts.length > 0 ? parts.join('.') : null;
  }
</script>

<section class="host-switcher surface" aria-labelledby="host-switcher-title">
  <div class="section-heading">
    <p class="section-kicker">Active endpoint</p>
    <h2 id="host-switcher-title">Host switcher</h2>
    <p>
      Test saved hosts, activate a different Kodi endpoint, and inspect the current active-host
      summary without leaving the page.
    </p>
  </div>

  <div class="active-summary" aria-live="polite" aria-atomic="true">
    <p class="summary-label">Active host</p>
    {#if connectionSnapshot.activeHostSummary}
      <p class="summary-value">{connectionSnapshot.activeHostSummary.label}</p>
      <p class="summary-meta">
        {connectionSnapshot.activeHostSummary.host}:{connectionSnapshot.activeHostSummary.port} · {connectionSnapshot
          .activeHostSummary.useTls
          ? 'HTTPS'
          : 'HTTP'} · {connectionSnapshot.activeHostSummary.useWebSocket
          ? 'WebSocket enabled'
          : 'HTTP only'} · {connectionSnapshot.activeHostSummary.hasCredentials
          ? 'credentials configured'
          : 'no credentials'}
      </p>
    {:else}
      <p class="summary-value">No active host selected</p>
      <p class="summary-meta">Save a host, then activate it to start connection diagnostics.</p>
    {/if}
    {#if connectionSnapshot.controllerError}
      <p class="switcher-error" role="status">{formatError(connectionSnapshot.controllerError)}</p>
    {/if}
  </div>

  {#if configSnapshot.hosts.length === 0}
    <p class="empty-state">No saved hosts yet. Host switch controls appear after the first save.</p>
  {:else}
    <ul class="host-list">
      {#each configSnapshot.hosts as savedHost (savedHost.id)}
        {@const test = connectionSnapshot.hostTests[savedHost.id]}
        <li class:current={configSnapshot.activeHostId === savedHost.id}>
          <div class="host-copy">
            <p class="host-label">{savedHost.label}</p>
            <p class="host-meta">
              {savedHost.host}{savedHost.port ? `:${savedHost.port}` : ''} · {savedHost.useTls
                ? 'HTTPS'
                : 'HTTP'} · {savedHost.useWebSocket ? 'WebSocket on' : 'WebSocket off'}
            </p>
            <p class="test-result" aria-live="polite">
              <strong>{formatTestStatus(test)}</strong> — {formatTestDetails(test)}
            </p>
          </div>
          <div class="row-actions">
            <button
              class="secondary-button"
              type="button"
              aria-label={`Test ${savedHost.label}`}
              disabled={test?.status === 'testing'}
              onclick={() => testHost(savedHost.id)}
            >
              {test?.status === 'testing' ? 'Testing…' : 'Test'}
            </button>
            <button
              type="button"
              aria-label={`Activate ${savedHost.label}`}
              aria-current={configSnapshot.activeHostId === savedHost.id ? 'true' : undefined}
              onclick={() => activateHost(savedHost.id)}
            >
              {configSnapshot.activeHostId === savedHost.id ? 'Reconnect' : 'Activate'}
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .host-switcher {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .section-heading,
  .active-summary {
    display: grid;
    gap: var(--space-sm);
  }

  .section-kicker,
  h2,
  p {
    margin: 0;
  }

  .section-kicker,
  .summary-label {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2,
  .summary-value {
    text-wrap: balance;
  }

  .section-heading p:not(.section-kicker),
  .summary-meta,
  .host-meta,
  .test-result,
  .empty-state {
    color: var(--color-text-muted);
    line-height: 1.6;
    text-wrap: pretty;
  }

  .active-summary {
    padding: var(--space-md);
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--color-accent) 14%, transparent),
        transparent 58%
      ),
      color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .summary-value {
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.035em;
  }

  .switcher-error {
    color: var(--color-danger);
  }

  .host-list {
    display: grid;
    gap: var(--space-sm);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
    align-items: center;
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .current {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 58%, transparent),
      0 0 0 0.18rem color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  .host-copy {
    display: grid;
    gap: var(--space-2xs);
  }

  .host-label {
    color: var(--color-text);
    font-weight: 800;
  }

  .test-result strong {
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
  }

  button {
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    color: var(--color-accent-contrast);
    font-weight: 800;
    cursor: pointer;
    background: var(--color-accent);
    border: 0;
    border-radius: var(--radius-pill);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      background 140ms ease,
      opacity 140ms ease;
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  button:active:not(:disabled) {
    transform: scale(0.96);
  }

  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  button:disabled {
    cursor: wait;
    opacity: 0.62;
  }

  .secondary-button {
    color: var(--color-text);
    background: var(--color-surface-raised);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  @media (max-width: 760px) {
    li {
      grid-template-columns: 1fr;
    }
  }
</style>
