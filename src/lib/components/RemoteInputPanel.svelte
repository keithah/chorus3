<script module lang="ts">
  import type { RemoteInputCommand } from '$lib/kodi';
  import type { RemoteInputDispatchSnapshot } from '$lib/stores/remoteInputDispatch.svelte';

  export interface RemoteInputPanelRemoteDispatch {
    readonly snapshot: RemoteInputDispatchSnapshot;
    sendInput(command: RemoteInputCommand): Promise<void> | void;
  }

  type RemoteButtonDefinition = {
    command: RemoteInputCommand;
    labelKey: string;
    ariaKey: string;
    className?: string;
  };

  type PowerButtonDefinition = {
    labelKey: string;
  };

  const REMOTE_BUTTONS: readonly RemoteButtonDefinition[] = [
    {
      command: 'up',
      labelKey: 'remote.command.up',
      ariaKey: 'remote.command.upAria',
      className: 'up'
    },
    {
      command: 'left',
      labelKey: 'remote.command.left',
      ariaKey: 'remote.command.leftAria',
      className: 'left'
    },
    {
      command: 'select',
      labelKey: 'remote.command.select',
      ariaKey: 'remote.command.selectAria',
      className: 'select'
    },
    {
      command: 'right',
      labelKey: 'remote.command.right',
      ariaKey: 'remote.command.rightAria',
      className: 'right'
    },
    {
      command: 'down',
      labelKey: 'remote.command.down',
      ariaKey: 'remote.command.downAria',
      className: 'down'
    },
    { command: 'back', labelKey: 'remote.command.back', ariaKey: 'remote.command.backAria' },
    { command: 'info', labelKey: 'remote.command.info', ariaKey: 'remote.command.infoAria' },
    {
      command: 'contextMenu',
      labelKey: 'remote.command.contextMenu',
      ariaKey: 'remote.command.contextMenuAria'
    },
    { command: 'home', labelKey: 'remote.command.home', ariaKey: 'remote.command.homeAria' }
  ];

  const POWER_BUTTONS: readonly PowerButtonDefinition[] = [
    { labelKey: 'remote.power.quit' },
    { labelKey: 'remote.power.shutdown' },
    { labelKey: 'remote.power.reboot' },
    { labelKey: 'remote.power.suspend' },
    { labelKey: 'remote.power.hibernate' }
  ];
</script>

<script lang="ts">
  import PlayerControls, { type PlayerControlsDispatch } from './PlayerControls.svelte';
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';

  interface Props {
    remoteSnapshot: RemoteInputDispatchSnapshot;
    remoteInputDispatch: RemoteInputPanelRemoteDispatch;
    playerSnapshot: PlayerStoreSnapshot;
    playerDispatch: PlayerControlsDispatch;
    i18n?: TranslationContext;
  }

  let {
    remoteSnapshot,
    remoteInputDispatch,
    playerSnapshot,
    playerDispatch,
    i18n = createTranslationContext('en')
  }: Props = $props();

  const isRemoteRunning = $derived(remoteSnapshot.commandStatus === 'running');
  const safeLastCommand = $derived(commandLabel(remoteSnapshot.lastCommand));
  const safeError = $derived(
    remoteSnapshot.lastError ? sanitizeDiagnostic(remoteSnapshot.lastError.message) : null
  );

  async function handleRemoteCommand(command: RemoteInputCommand): Promise<void> {
    try {
      await remoteInputDispatch.sendInput(command);
    } catch {
      // The dispatch snapshot is the only diagnostics surface. Do not render raw thrown values.
    }
  }

  function commandLabel(command: RemoteInputCommand | null): string {
    return command ? i18n.t(`remote.command.${command}`) : i18n.t('remote.command.none');
  }

  function sanitizeDiagnostic(message: string): string {
    return message
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/username or password/gi, 'credentials')
      .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
      .replace(/special:\/\/[^\s]+/gi, 'redacted-file')
      .replace(/\/[^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-file')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/localStorage|sessionStorage/gi, 'browser storage')
      .replace(/raw[_\s-]*response[_\s-]*body/gi, 'redacted response');
  }
</script>

<article class="remote-input-panel" aria-labelledby="remote-input-title">
  <header class="remote-hero">
    <p class="remote-kicker">{i18n.t('remote.panel.eyebrow')}</p>
    <h2 id="remote-input-title">{i18n.t('remote.panel.title')}</h2>
    <p>{i18n.t('remote.panel.description')}</p>
  </header>

  <section class="remote-section remote-pad" aria-labelledby="remote-pad-title">
    <div class="section-heading">
      <h3 id="remote-pad-title">{i18n.t('remote.input.title')}</h3>
      <p>{i18n.t('remote.input.help')}</p>
    </div>

    <div class="remote-button-grid" aria-label={i18n.t('remote.input.aria')}>
      {#each REMOTE_BUTTONS as button}
        <button
          type="button"
          class={`remote-command-button ${button.className ?? 'utility'}`}
          aria-label={i18n.t(button.ariaKey)}
          disabled={isRemoteRunning}
          onclick={() => handleRemoteCommand(button.command)}
        >
          {i18n.t(button.labelKey)}
        </button>
      {/each}
    </div>
  </section>

  <section class="remote-section diagnostics" aria-labelledby="remote-diagnostics-title">
    <div class="section-heading">
      <h3 id="remote-diagnostics-title">{i18n.t('remote.diagnostics.title')}</h3>
      <p>{i18n.t('remote.diagnostics.help')}</p>
    </div>

    <dl aria-live="polite" aria-atomic="true">
      <div>
        <dt>{i18n.t('remote.diagnostics.statusLabel')}</dt>
        <dd>{i18n.t('remote.diagnostics.status', { status: remoteSnapshot.commandStatus })}</dd>
      </div>
      <div>
        <dt>{i18n.t('remote.diagnostics.lastCommandLabel')}</dt>
        <dd>{i18n.t('remote.diagnostics.lastCommand', { command: safeLastCommand })}</dd>
      </div>
      <div>
        <dt>{i18n.t('remote.diagnostics.completedLabel')}</dt>
        <dd>
          {#if remoteSnapshot.lastCompletedAt}
            {i18n.t('remote.diagnostics.completed', {
              completedAt: remoteSnapshot.lastCompletedAt
            })}
          {:else}
            {i18n.t('remote.diagnostics.completedNever')}
          {/if}
        </dd>
      </div>
      {#if remoteSnapshot.lastError && safeError}
        <div class="diagnostic-error">
          <dt>{i18n.t('remote.diagnostics.errorLabel')}</dt>
          <dd>
            {i18n.t('remote.diagnostics.error', {
              source: remoteSnapshot.lastError.source,
              code: remoteSnapshot.lastError.code,
              message: safeError
            })}
          </dd>
        </div>
      {/if}
    </dl>
  </section>

  <section class="remote-section playback" aria-labelledby="remote-playback-title">
    <div class="section-heading">
      <h3 id="remote-playback-title">{i18n.t('remote.playback.title')}</h3>
      <p>{i18n.t('remote.playback.help')}</p>
    </div>
    <PlayerControls snapshot={playerSnapshot} dispatch={playerDispatch} {i18n} />
  </section>

  <section class="remote-section guarded-power" aria-labelledby="remote-power-title">
    <div class="section-heading">
      <h3 id="remote-power-title">{i18n.t('remote.power.title')}</h3>
      <p>{i18n.t('remote.power.help')}</p>
    </div>

    <div class="power-button-row" aria-label={i18n.t('remote.power.aria')}>
      {#each POWER_BUTTONS as button}
        <button type="button" class="power-button" disabled aria-describedby="remote-power-guard">
          {i18n.t(button.labelKey)}
        </button>
      {/each}
    </div>
    <p id="remote-power-guard" class="guard-copy">{i18n.t('remote.power.guardCopy')}</p>
  </section>
</article>

<style>
  .remote-input-panel {
    display: grid;
    gap: var(--space-lg);
  }

  .remote-hero,
  .remote-section {
    padding: var(--space-xl);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
  }

  .remote-hero {
    background:
      radial-gradient(
        circle at top left,
        color-mix(in srgb, var(--color-accent) 18%, transparent),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-surface-raised) 82%, transparent),
        var(--color-surface)
      );
  }

  .remote-kicker,
  .section-heading p,
  .remote-hero p,
  h2,
  h3,
  dl,
  .guard-copy {
    margin: 0;
  }

  .remote-kicker {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h2 {
    margin-top: var(--space-xs);
    font-size: clamp(2rem, 5vw, 3.8rem);
    line-height: 0.95;
  }

  .remote-hero p:not(.remote-kicker),
  .section-heading p,
  .guard-copy {
    max-width: 54rem;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .remote-section {
    display: grid;
    gap: var(--space-md);
  }

  .section-heading {
    display: grid;
    gap: var(--space-xs);
  }

  .remote-button-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(5.5rem, 1fr));
    gap: var(--space-sm);
    max-width: 32rem;
  }

  .remote-command-button,
  .power-button {
    min-height: 3.75rem;
    padding: var(--space-sm) var(--space-md);
    color: var(--color-accent-contrast);
    font: inherit;
    font-weight: 900;
    cursor: pointer;
    background: var(--color-accent);
    border: 0;
    border-radius: var(--radius-lg);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease;
  }

  .remote-command-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0.9rem 1.7rem rgb(0 0 0 / 0.16);
  }

  .remote-command-button:active:not(:disabled) {
    transform: scale(0.97);
  }

  .remote-command-button.up {
    grid-column: 2;
  }

  .remote-command-button.left {
    grid-column: 1;
  }

  .remote-command-button.select {
    grid-column: 2;
  }

  .remote-command-button.right {
    grid-column: 3;
  }

  .remote-command-button.down {
    grid-column: 2;
  }

  .remote-command-button.utility {
    color: var(--color-text);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
  }

  dl {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: var(--space-sm);
  }

  dl div {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .diagnostic-error {
    grid-column: 1 / -1;
    color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    border-color: color-mix(in srgb, var(--color-warning) 34%, transparent);
  }

  dt {
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .power-button-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .power-button {
    color: var(--color-text-muted);
    cursor: not-allowed;
    background: color-mix(in srgb, var(--color-surface-raised) 78%, transparent);
    border: 1px dashed color-mix(in srgb, var(--color-warning) 42%, var(--color-border));
  }

  button:disabled {
    opacity: 0.62;
  }

  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  @media (max-width: 640px) {
    .remote-hero,
    .remote-section {
      padding: var(--space-lg);
    }

    .remote-button-grid {
      grid-template-columns: repeat(3, minmax(4.5rem, 1fr));
    }
  }
</style>
