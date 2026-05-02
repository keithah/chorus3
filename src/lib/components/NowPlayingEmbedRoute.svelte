<script lang="ts">
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import type { NowPlayingEmbedQuery } from '$lib/app/nowPlayingEmbedQuery';
  import type { ActiveHostSummary } from '$lib/stores/hostConnection.svelte';
  import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
  import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
  import NowPlayingPanel from './NowPlayingPanel.svelte';
  import type { PlayerControlsDispatch } from './PlayerControls.svelte';

  interface Props {
    snapshot: PlayerStoreSnapshot;
    dispatch: PlayerControlsDispatch;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    hostSummary: ActiveHostSummary | null;
    query?: NowPlayingEmbedQuery;
    i18n?: TranslationContext;
    onRefresh?: () => Promise<void> | void;
  }

  const EMPTY_QUERY: NowPlayingEmbedQuery = {
    theme: null,
    locale: null,
    rejectedCredentialParams: [],
    ignoredParams: []
  };

  let {
    snapshot,
    dispatch,
    localPlayerSnapshot,
    hostSummary,
    query,
    i18n = createTranslationContext('en'),
    onRefresh
  }: Props = $props();

  let refreshPending = $state(false);

  const safeQuery = $derived(isEmbedQuery(query) ? query : EMPTY_QUERY);
  const rejectedCredentialCount = $derived(safeQuery.rejectedCredentialParams.length);
  const safeHostLabel = $derived(formatHostLabel(hostSummary, i18n));
  const hasUsableHost = $derived(Boolean(hostSummary && safeHostLabel));
  const hostStatusText = $derived(
    hasUsableHost && hostSummary
      ? i18n.t('nowPlayingEmbed.host.status', {
          label: safeHostLabel,
          credentials: hostSummary.hasCredentials
            ? i18n.t('nowPlaying.yes')
            : i18n.t('nowPlaying.no')
        })
      : i18n.t('nowPlayingEmbed.setup.status')
  );
  const rejectedCredentialText = $derived(
    rejectedCredentialCount === 1
      ? i18n.t('nowPlayingEmbed.queryRejected.singular', { count: rejectedCredentialCount })
      : i18n.t('nowPlayingEmbed.queryRejected.plural', { count: rejectedCredentialCount })
  );

  async function handleRefresh(): Promise<void> {
    if (!onRefresh || refreshPending) {
      return;
    }

    refreshPending = true;

    try {
      await onRefresh();
    } catch {
      // The player/dispatch snapshots already expose sanitized status; raw callback errors stay hidden.
    } finally {
      refreshPending = false;
    }
  }

  function isEmbedQuery(value: unknown): value is NowPlayingEmbedQuery {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as NowPlayingEmbedQuery).rejectedCredentialParams) &&
      Array.isArray((value as NowPlayingEmbedQuery).ignoredParams)
    );
  }

  function formatHostLabel(value: ActiveHostSummary | null, context: TranslationContext): string {
    if (!value) {
      return '';
    }

    return isSafeUiLabel(value.label)
      ? value.label.trim()
      : context.t('nowPlayingEmbed.host.fallback');
  }

  function isSafeUiLabel(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }

    const trimmed = value.trim();

    return (
      trimmed.length > 0 &&
      trimmed.length <= 80 &&
      !/(https?:\/\/|@|authorization|basic|username|password|token|secret|localStorage|storage-key|:\/\/)/i.test(
        trimmed
      )
    );
  }
</script>

<main class="embed-route" aria-labelledby="now-playing-embed-title">
  <section class="embed-hero" aria-describedby="now-playing-embed-description">
    <p class="embed-kicker">{i18n.t('nowPlayingEmbed.kicker')}</p>
    <div class="hero-row">
      <div class="hero-copy">
        <h1 id="now-playing-embed-title">{i18n.t('nowPlayingEmbed.title')}</h1>
        <p id="now-playing-embed-description" class="embed-description">
          {i18n.t('nowPlayingEmbed.description')}
        </p>
      </div>

      {#if onRefresh}
        <button
          type="button"
          class="refresh-button"
          aria-label={i18n.t('nowPlayingEmbed.refresh.aria')}
          disabled={refreshPending}
          onclick={handleRefresh}
        >
          {i18n.t('nowPlayingEmbed.refresh.label')}
        </button>
      {/if}
    </div>
  </section>

  {#if rejectedCredentialCount > 0}
    <section class="credential-alert" role="alert" aria-live="assertive">
      <strong>{rejectedCredentialText}</strong>
      <span>{i18n.t('nowPlayingEmbed.queryRejected.description')}</span>
    </section>
  {/if}

  <section class="host-status" aria-labelledby="now-playing-embed-host-title">
    <p class="status-kicker">{i18n.t('nowPlayingEmbed.host.kicker')}</p>
    <h2 id="now-playing-embed-host-title">
      {hasUsableHost ? i18n.t('nowPlayingEmbed.host.title') : i18n.t('nowPlayingEmbed.setup.title')}
    </h2>
    <p role="status" aria-live="polite" aria-atomic="true">{hostStatusText}</p>

    {#if hasUsableHost && hostSummary}
      <dl class="host-facts" aria-label={i18n.t('nowPlayingEmbed.host.factsAria')}>
        <div>
          <dt>{i18n.t('nowPlayingEmbed.host.label')}</dt>
          <dd>{safeHostLabel}</dd>
        </div>
        <div>
          <dt>{i18n.t('nowPlayingEmbed.host.credentials')}</dt>
          <dd>
            {i18n.t('nowPlayingEmbed.host.credentialsValue', {
              value: hostSummary.hasCredentials ? i18n.t('nowPlaying.yes') : i18n.t('nowPlaying.no')
            })}
          </dd>
        </div>
      </dl>
    {:else}
      <p class="setup-copy">{i18n.t('nowPlayingEmbed.setup.description')}</p>
    {/if}
  </section>

  {#if hasUsableHost}
    <NowPlayingPanel {snapshot} {dispatch} {localPlayerSnapshot} {i18n} />
  {/if}
</main>

<style>
  .embed-route {
    display: grid;
    gap: clamp(var(--space-md), 3vw, var(--space-xl));
    min-height: 100vh;
    padding: clamp(var(--space-md), 3vw, var(--space-xl));
    color: var(--color-text);
    background:
      radial-gradient(
        circle at top left,
        color-mix(in srgb, var(--color-accent) 16%, transparent),
        transparent 34rem
      ),
      var(--color-background);
  }

  .embed-hero,
  .host-status,
  .credential-alert {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--color-surface) 92%, transparent);
    box-shadow: var(--shadow-panel);
  }

  .embed-hero,
  .host-status {
    display: grid;
    gap: var(--space-sm);
    padding: clamp(var(--space-md), 3vw, var(--space-lg));
  }

  .hero-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .hero-copy {
    display: grid;
    gap: var(--space-xs);
    max-width: 52rem;
  }

  .embed-kicker,
  .status-kicker,
  h1,
  h2,
  p,
  dl,
  dd {
    margin: 0;
  }

  .embed-kicker,
  .status-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    font-size: clamp(1.65rem, 5vw, 3rem);
    line-height: 0.96;
    text-wrap: balance;
  }

  h2 {
    font-size: clamp(1.1rem, 3vw, 1.6rem);
    line-height: 1.1;
  }

  .embed-description,
  .setup-copy,
  .host-status [role='status'] {
    color: var(--color-text-muted);
    line-height: 1.55;
  }

  .refresh-button {
    flex: 0 0 auto;
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    color: var(--color-text);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-raised));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
  }

  .refresh-button:disabled {
    cursor: wait;
    opacity: 0.62;
  }

  .refresh-button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .credential-alert {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-danger, #d33) 12%, var(--color-surface));
  }

  .credential-alert span {
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .host-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .host-facts div {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  dt {
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dd {
    overflow-wrap: anywhere;
    font-weight: 800;
  }

  :global(.embed-route .now-playing-panel) {
    padding: clamp(var(--space-md), 3vw, var(--space-lg));
  }

  @media (max-width: 640px) {
    .hero-row,
    .host-facts {
      grid-template-columns: 1fr;
    }

    .hero-row {
      display: grid;
    }

    .refresh-button {
      width: 100%;
    }
  }
</style>
