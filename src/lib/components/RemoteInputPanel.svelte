<script module lang="ts">
  import type { RemoteInputCommand } from '$lib/kodi';
  import type { RemoteInputDispatchSnapshot } from '$lib/stores/remoteInputDispatch.svelte';

  export interface RemoteInputPanelRemoteDispatch {
    readonly snapshot: RemoteInputDispatchSnapshot;
    sendInput(command: RemoteInputCommand): Promise<void> | void;
  }

  type RemoteButtonDefinition = {
    command: RemoteInputCommand;
    ariaKey: string;
    iconClass: string;
    className?: string;
  };

  const DIRECTION_BUTTONS: readonly RemoteButtonDefinition[] = [
    {
      command: 'left',
      ariaKey: 'remote.command.leftAria',
      iconClass: 'mdi-hardware-keyboard-arrow-left',
      className: 'left'
    },
    {
      command: 'up',
      ariaKey: 'remote.command.upAria',
      iconClass: 'mdi-hardware-keyboard-arrow-up',
      className: 'up'
    },
    {
      command: 'down',
      ariaKey: 'remote.command.downAria',
      iconClass: 'mdi-hardware-keyboard-arrow-down',
      className: 'down'
    },
    {
      command: 'right',
      ariaKey: 'remote.command.rightAria',
      iconClass: 'mdi-hardware-keyboard-arrow-right',
      className: 'right'
    },
    {
      command: 'select',
      ariaKey: 'remote.command.selectAria',
      iconClass: 'mdi-image-brightness-1',
      className: 'ok'
    }
  ];

  const SIDE_BUTTONS: readonly RemoteButtonDefinition[] = [
    {
      command: 'contextMenu',
      ariaKey: 'remote.command.contextMenuAria',
      iconClass: 'mdi-navigation-more-vert'
    },
    { command: 'info', ariaKey: 'remote.command.infoAria', iconClass: 'mdi-action-info' }
  ];

  const SECONDARY_INPUTS: readonly RemoteButtonDefinition[] = [
    {
      command: 'back',
      ariaKey: 'remote.command.backAria',
      iconClass: 'mdi-hardware-keyboard-return'
    },
    {
      command: 'home',
      ariaKey: 'remote.command.homeAria',
      iconClass: 'mdi-maps-store-mall-directory'
    }
  ];
</script>

<script lang="ts">
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';
  import type { PlayerControlsDispatch } from './PlayerControls.svelte';
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
  const isPlayerRunning = $derived(playerDispatch.snapshot.commandStatus === 'running');
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

  function handleStop(): void {
    try {
      void Promise.resolve(playerDispatch.stop()).catch(() => {
        // Player command diagnostics are owned by the dispatch snapshot.
      });
    } catch {
      // Keep the remote controller mounted if an injected action throws synchronously.
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
  <div class="remote-background" aria-hidden="true"></div>

  <section class="kodi-remote" aria-label={i18n.t('remote.input.aria')}>
    <h2 id="remote-input-title" class="remote-visually-hidden">{i18n.t('remote.panel.title')}</h2>

    <div class="playing-area" aria-live="polite" aria-atomic="true">
      <p class="remote-kicker">{i18n.t('remote.panel.eyebrow')}</p>
      <p>{i18n.t('remote.diagnostics.status', { status: remoteSnapshot.commandStatus })}</p>
      <p>{i18n.t('remote.diagnostics.lastCommand', { command: safeLastCommand })}</p>
      {#if remoteSnapshot.lastError && safeError}
        <p class="remote-error">
          {i18n.t('remote.diagnostics.error', {
            source: remoteSnapshot.lastError.source,
            code: remoteSnapshot.lastError.code,
            message: safeError
          })}
        </p>
      {/if}
    </div>

    <div class="main-controls">
      <div class="direction">
        <div class="pad">
          {#each DIRECTION_BUTTONS as button}
            <button
              type="button"
              class={`ibut input-button ${button.className ?? ''}`}
              aria-label={i18n.t(button.ariaKey)}
              disabled={isRemoteRunning}
              onclick={() => handleRemoteCommand(button.command)}
            >
              <span class={`mdi ${button.iconClass}`} aria-hidden="true"></span>
            </button>
          {/each}
        </div>
      </div>

      <div class="buttons">
        <button
          type="button"
          class="ibut power-button"
          aria-label={i18n.t('remote.power.title')}
          title={i18n.t('remote.power.guardCopy')}
          disabled
        >
          <span class="mdi mdi-action-settings-power" aria-hidden="true"></span>
        </button>
        {#each SIDE_BUTTONS as button}
          <button
            type="button"
            class="ibut input-button"
            aria-label={i18n.t(button.ariaKey)}
            disabled={isRemoteRunning}
            onclick={() => handleRemoteCommand(button.command)}
          >
            <span class={`mdi ${button.iconClass}`} aria-hidden="true"></span>
          </button>
        {/each}
      </div>
    </div>

    <div class="secondary-controls">
      <button
        type="button"
        class="ibut input-button"
        aria-label={i18n.t(SECONDARY_INPUTS[0].ariaKey)}
        disabled={isRemoteRunning}
        onclick={() => handleRemoteCommand(SECONDARY_INPUTS[0].command)}
      >
        <span class={`mdi ${SECONDARY_INPUTS[0].iconClass}`} aria-hidden="true"></span>
      </button>
      <button
        type="button"
        class="ibut player-button"
        aria-label={i18n.t('player.controls.stop')}
        disabled={isPlayerRunning}
        onclick={handleStop}
      >
        <span class="mdi mdi-av-stop" aria-hidden="true"></span>
      </button>
      <button
        type="button"
        class="ibut input-button"
        aria-label={i18n.t(SECONDARY_INPUTS[1].ariaKey)}
        disabled={isRemoteRunning}
        onclick={() => handleRemoteCommand(SECONDARY_INPUTS[1].command)}
      >
        <span class={`mdi ${SECONDARY_INPUTS[1].iconClass}`} aria-hidden="true"></span>
      </button>
    </div>
  </section>
</article>

<style>
  @font-face {
    font-family: 'Material-Design-Icons';
    src: url('../assets/chorus2/fonts/material/Material-Design-Icons.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }

  .remote-input-panel {
    --remote-background: #282c2e;
    --remote-button: #222324;
    position: relative;
    min-height: min(34rem, calc(100vh - 110px));
    overflow: hidden;
    color: #838b8d;
    background: var(--remote-background);
  }

  .remote-background {
    position: absolute;
    inset: 0 0 170px;
    background:
      linear-gradient(rgb(35 38 40 / 0.42), rgb(35 38 40 / 0.76)), var(--color-surface-raised);
    background-position: 50% 50%;
    background-size: cover;
  }

  .kodi-remote {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: min(100%, 320px);
    margin-inline: auto;
    overflow: hidden;
    color: #6f7374;
    font-size: 1.7rem;
  }

  .playing-area {
    position: relative;
    height: 150px;
    padding: 18px 20px 35px;
    color: #b1b6b8;
    font-size: 13px;
    text-align: right;
  }

  .playing-area p {
    margin: 0;
  }

  .remote-kicker {
    color: #d3d7d8;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .remote-error {
    margin-top: 6px;
    color: #ffba66;
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }

  .main-controls {
    display: grid;
    grid-template-columns: 3fr 1fr;
    background: var(--remote-background);
  }

  .direction {
    position: relative;
    z-index: 2;
    height: 155px;
    margin-top: -12px;
    background: var(--remote-button);
  }

  .pad {
    position: relative;
    width: 240px;
    height: 145px;
    margin: 5px auto;
    text-align: center;
  }

  .ibut {
    display: grid;
    place-items: center;
    padding: 0;
    color: #6f7374;
    font: inherit;
    cursor: pointer;
    background: var(--remote-button);
    border: 0;
    border-radius: 0;
    transition:
      color 140ms ease,
      background-color 140ms ease,
      opacity 140ms ease;
  }

  .ibut:hover:not(:disabled),
  .ibut:focus-visible {
    color: #ccc;
    background: #2c2f30;
  }

  .ibut:active:not(:disabled) {
    color: #fff;
  }

  .pad .ibut {
    position: absolute;
    top: 0;
    left: 80px;
    width: 80px;
    height: 145px;
    font-size: 125%;
  }

  .pad .up,
  .pad .down,
  .pad .ok {
    height: calc(145px / 3);
    line-height: calc(145px / 3);
  }

  .pad .down {
    top: calc((145px / 3) * 2);
  }

  .pad .ok {
    top: calc(145px / 3);
    font-size: 12px;
  }

  .pad .left {
    left: 0;
    padding-left: 20px;
    line-height: 145px;
  }

  .pad .right {
    right: 0;
    left: auto;
    padding-right: 20px;
    line-height: 145px;
  }

  .buttons {
    display: grid;
    gap: 9px;
    align-content: start;
    padding: 6px 8px 4px;
    margin-top: -20px;
  }

  .buttons .ibut {
    height: 44px;
    font-size: 1.05em;
  }

  .secondary-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    clear: both;
    background: var(--remote-background);
  }

  .secondary-controls .ibut {
    height: 75px;
    font-size: 1.5em;
  }

  .power-button {
    cursor: not-allowed;
  }

  .mdi {
    font-family: 'Material-Design-Icons';
    font-style: normal;
    font-weight: 400;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .mdi-action-info::before {
    content: '\e638';
  }
  .mdi-action-settings-power::before {
    content: '\e66e';
  }
  .mdi-av-stop::before {
    content: '\e6c9';
  }
  .mdi-hardware-keyboard-arrow-down::before {
    content: '\e7b4';
  }
  .mdi-hardware-keyboard-arrow-left::before {
    content: '\e7b5';
  }
  .mdi-hardware-keyboard-arrow-right::before {
    content: '\e7b6';
  }
  .mdi-hardware-keyboard-arrow-up::before {
    content: '\e7b7';
  }
  .mdi-hardware-keyboard-return::before {
    content: '\e7bc';
  }
  .mdi-image-brightness-1::before {
    content: '\e7da';
  }
  .mdi-maps-store-mall-directory::before {
    content: '\e88f';
  }
  .mdi-navigation-more-vert::before {
    content: '\e8a3';
  }

  button:disabled {
    opacity: 0.52;
  }

  button:focus-visible {
    outline: 2px solid #fff;
    outline-offset: -2px;
    box-shadow: 0 0 0 3px rgb(77 179 230 / 0.6);
  }

  .remote-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  @media (min-width: 760px) {
    .remote-input-panel {
      min-height: calc(100vh - 110px);
    }

    .remote-background {
      inset: 0;
    }

    .kodi-remote {
      right: auto;
      left: 0;
      margin-inline: 0;
    }
  }
</style>
