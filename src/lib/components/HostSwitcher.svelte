<script lang="ts">
  import {
    configStore,
    hostConnectionStore,
    type HostConnectionErrorSnapshot,
    type HostTestSnapshot
  } from '$lib/stores';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';

  interface Props {
    i18n?: TranslationContext;
  }

  let { i18n = createEnglishTranslationContext() }: Props = $props();

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
      return i18n.t('hostSwitcher.testStatus.idle');
    }

    if (test.status === 'testing') {
      return i18n.t('hostSwitcher.testStatus.testing');
    }

    if (test.status === 'success') {
      return i18n.t('hostSwitcher.testStatus.success');
    }

    return i18n.t('hostSwitcher.testStatus.failed');
  }

  function formatTestDetails(test: HostTestSnapshot | undefined): string {
    if (!test || test.status === 'idle') {
      return i18n.t('hostSwitcher.testDetails.idle');
    }

    if (test.status === 'testing') {
      return i18n.t('hostSwitcher.testDetails.testing');
    }

    if (test.status === 'failed') {
      return formatError(test.error);
    }

    const parts = [formatKodiVersion(test.kodiVersion), test.applicationName]
      .filter(Boolean)
      .map((value, index) =>
        index === 0
          ? i18n.t('hostSwitcher.testDetails.kodiVersion', { version: value })
          : i18n.t('hostSwitcher.testDetails.application', { application: value })
      );

    return parts.length > 0 ? parts.join(' · ') : i18n.t('hostSwitcher.testDetails.success');
  }

  function formatError(error: HostConnectionErrorSnapshot | null): string {
    if (!error) {
      return i18n.t('hostSwitcher.error.empty');
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
    <p class="section-kicker">{i18n.t('hostSwitcher.kicker')}</p>
    <h2 id="host-switcher-title">{i18n.t('hostSwitcher.title')}</h2>
    <p>
      {i18n.t('hostSwitcher.description')}
    </p>
  </div>

  <div class="active-summary" aria-live="polite" aria-atomic="true">
    <p class="summary-label">{i18n.t('hostSwitcher.active.label')}</p>
    {#if connectionSnapshot.activeHostSummary}
      <p class="summary-value">{connectionSnapshot.activeHostSummary.label}</p>
      <p class="summary-meta">
        {connectionSnapshot.activeHostSummary.host}:{connectionSnapshot.activeHostSummary.port} · {connectionSnapshot
          .activeHostSummary.useTls
          ? 'HTTPS'
          : 'HTTP'} · {connectionSnapshot.activeHostSummary.useWebSocket
          ? i18n.t('hostSwitcher.summary.websocketEnabled')
          : i18n.t('hostSwitcher.summary.httpOnly')} · {connectionSnapshot.activeHostSummary
          .hasCredentials
          ? i18n.t('hostSwitcher.summary.credentialsConfigured')
          : i18n.t('hostSwitcher.summary.noCredentials')}
      </p>
    {:else}
      <p class="summary-value">{i18n.t('hostSwitcher.active.none')}</p>
      <p class="summary-meta">{i18n.t('hostSwitcher.active.noneDescription')}</p>
    {/if}
    {#if connectionSnapshot.controllerError}
      <p class="switcher-error" role="status">{formatError(connectionSnapshot.controllerError)}</p>
    {/if}
  </div>

  {#if configSnapshot.hosts.length === 0}
    <p class="empty-state">{i18n.t('hostSwitcher.empty')}</p>
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
                : 'HTTP'} · {savedHost.useWebSocket
                ? i18n.t('hostSwitcher.websocket.on')
                : i18n.t('hostSwitcher.websocket.off')}
            </p>
            <p class="test-result" aria-live="polite">
              <strong>{formatTestStatus(test)}</strong> — {formatTestDetails(test)}
            </p>
          </div>
          <div class="row-actions">
            <button
              class="secondary-button"
              type="button"
              aria-label={i18n.t('hostSwitcher.action.testAria', { label: savedHost.label })}
              disabled={test?.status === 'testing'}
              onclick={() => testHost(savedHost.id)}
            >
              {test?.status === 'testing'
                ? i18n.t('hostSwitcher.action.testing')
                : i18n.t('hostSwitcher.action.test')}
            </button>
            <button
              type="button"
              aria-label={i18n.t('hostSwitcher.action.activateAria', { label: savedHost.label })}
              aria-current={configSnapshot.activeHostId === savedHost.id ? 'true' : undefined}
              onclick={() => activateHost(savedHost.id)}
            >
              {configSnapshot.activeHostId === savedHost.id
                ? i18n.t('hostSwitcher.action.reconnect')
                : i18n.t('hostSwitcher.action.activate')}
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
