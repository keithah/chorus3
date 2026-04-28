<script module lang="ts">
  import type {
    PlayerAudioStreamValue,
    PlayerRepeatValue,
    PlayerShuffleValue,
    PlayerSubtitleValue
  } from '$lib/kodi';
  import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
  import type { PlayerDispatchSnapshot } from '$lib/stores/playerDispatch.svelte';

  export interface PlayerControlsDispatch {
    readonly snapshot: PlayerDispatchSnapshot;
    playPause(): Promise<void> | void;
    stop(): Promise<void> | void;
    previous(): Promise<void> | void;
    next(): Promise<void> | void;
    seekPercentage(percentage: number): Promise<void> | void;
    seekRelativeSeconds(seconds: number): Promise<void> | void;
    setVolume(volume: number): Promise<void> | void;
    toggleMute(): Promise<void> | void;
    setShuffle(shuffle: PlayerShuffleValue): Promise<void> | void;
    setRepeat(repeat: PlayerRepeatValue): Promise<void> | void;
    setSubtitle(subtitle: PlayerSubtitleValue): Promise<void> | void;
    setAudioStream(stream: PlayerAudioStreamValue): Promise<void> | void;
  }
</script>

<script lang="ts">
  import type { PlayerAudioStream, PlayerSubtitleStream } from '$lib/kodi';

  interface Props {
    snapshot: PlayerStoreSnapshot;
    dispatch: PlayerControlsDispatch;
  }

  let { snapshot, dispatch }: Props = $props();

  const canControl = $derived(isSingleActivePlayer(snapshot));
  const isRunning = $derived(dispatch.snapshot.commandStatus === 'running');
  const disabled = $derived(!canControl || isRunning);
  const disabledReason = $derived(getDisabledReason(snapshot, isRunning));
  const seekPercentage = $derived(readPercentage(snapshot.properties?.percentage));
  const volume = $derived(readVolume(snapshot.application.volume));
  const shuffleValue = $derived(String(snapshot.properties?.shuffled === true));
  const repeatValue = $derived(normalizeRepeat(snapshot.properties?.repeat));
  const subtitleValue = $derived(selectedStreamValue(snapshot.properties?.currentsubtitle));
  const audioValue = $derived(selectedStreamValue(snapshot.properties?.currentaudiostream));
  const subtitles = $derived(snapshot.properties?.subtitles ?? []);
  const audioStreams = $derived(snapshot.properties?.audiostreams ?? []);

  function handleSeek(event: Event): void {
    dispatch.seekPercentage(readControlNumber(event, seekPercentage));
  }

  function handleVolume(event: Event): void {
    dispatch.setVolume(readControlNumber(event, volume));
  }

  function handleShuffle(event: Event): void {
    dispatch.setShuffle(readSelectValue(event) === 'true');
  }

  function handleRepeat(event: Event): void {
    dispatch.setRepeat(readSelectValue(event) as PlayerRepeatValue);
  }

  function handleSubtitle(event: Event): void {
    const value = readSelectValue(event);
    dispatch.setSubtitle(value === 'off' ? 'off' : Number(value));
  }

  function handleAudioStream(event: Event): void {
    dispatch.setAudioStream(Number(readSelectValue(event)));
  }

  function readControlNumber(event: Event, fallback: number): number {
    const value =
      event.currentTarget instanceof HTMLInputElement
        ? Number(event.currentTarget.value)
        : fallback;
    return Number.isFinite(value) ? value : fallback;
  }

  function readSelectValue(event: Event): string {
    return event.currentTarget instanceof HTMLSelectElement ? event.currentTarget.value : '';
  }

  function readPercentage(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(100, Math.max(0, Math.round(value)))
      : 0;
  }

  function readVolume(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(100, Math.max(0, Math.round(value)))
      : 0;
  }

  function normalizeRepeat(value: unknown): PlayerRepeatValue {
    return value === 'one' || value === 'all' || value === 'cycle' ? value : 'off';
  }

  function selectedStreamValue(stream: unknown): string {
    if (!isRecord(stream) || typeof stream.index !== 'number' || !Number.isFinite(stream.index)) {
      return '';
    }

    return String(stream.index);
  }

  function isSingleActivePlayer(value: PlayerStoreSnapshot): boolean {
    return (
      value.playbackStatus === 'active' &&
      value.activePlayers.length === 1 &&
      value.primaryPlayer !== null
    );
  }

  function getDisabledReason(value: PlayerStoreSnapshot, running: boolean): string | null {
    if (running) {
      return 'A Kodi command is running. Controls are disabled until it finishes.';
    }

    if (value.activePlayers.length > 1 || value.playbackStatus === 'multiple') {
      return 'Multiple Kodi players are active. Controls are disabled until there is one active player.';
    }

    if (!value.primaryPlayer || value.playbackStatus !== 'active') {
      return 'No active Kodi player is available. Controls are disabled until playback starts.';
    }

    return null;
  }

  function audioLabel(stream: PlayerAudioStream, fallbackIndex: number): string {
    const parts = [
      textOrNull(stream.name) ?? streamIndexLabel('Audio stream', stream.index, fallbackIndex),
      textOrNull(stream.language),
      typeof stream.channels === 'number' && Number.isFinite(stream.channels)
        ? `${stream.channels}ch`
        : null,
      textOrNull(stream.codec)
    ].filter((part): part is string => Boolean(part));

    return parts.join(' · ');
  }

  function subtitleLabel(stream: PlayerSubtitleStream, fallbackIndex: number): string {
    const parts = [
      textOrNull(stream.name) ?? streamIndexLabel('Subtitle stream', stream.index, fallbackIndex),
      textOrNull(stream.language)
    ].filter((part): part is string => Boolean(part));

    return parts.join(' · ');
  }

  function streamIndexLabel(prefix: string, index: unknown, fallbackIndex: number): string {
    return `${prefix} ${typeof index === 'number' && Number.isFinite(index) ? index : fallbackIndex + 1}`;
  }

  function textOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
</script>

<div
  class="player-controls"
  aria-label="Kodi playback controls"
  aria-describedby={disabledReason ? 'player-controls-disabled-reason' : undefined}
>
  {#if disabledReason}
    <p id="player-controls-disabled-reason" class="disabled-reason">{disabledReason}</p>
  {/if}

  <div class="control-group transport" aria-label="Transport controls">
    <button type="button" {disabled} onclick={() => dispatch.previous()}>Previous</button>
    <button type="button" {disabled} onclick={() => dispatch.playPause()}>Play or pause</button>
    <button type="button" {disabled} onclick={() => dispatch.stop()}>Stop</button>
    <button type="button" {disabled} onclick={() => dispatch.next()}>Next</button>
  </div>

  <div class="control-grid">
    <div class="field range-field">
      <label for="now-playing-seek">Seek position</label>
      <input
        id="now-playing-seek"
        type="range"
        min="0"
        max="100"
        step="1"
        value={seekPercentage}
        {disabled}
        oninput={handleSeek}
      />
      <div class="relative-seek cluster" aria-label="Relative seek controls">
        <button type="button" {disabled} onclick={() => dispatch.seekRelativeSeconds(-30)}
          >Seek back 30 seconds</button
        >
        <button type="button" {disabled} onclick={() => dispatch.seekRelativeSeconds(30)}
          >Seek forward 30 seconds</button
        >
      </div>
    </div>

    <div class="field range-field">
      <label for="now-playing-volume">Volume</label>
      <input
        id="now-playing-volume"
        type="range"
        min="0"
        max="100"
        step="1"
        value={volume}
        {disabled}
        oninput={handleVolume}
      />
      <button type="button" {disabled} onclick={() => dispatch.toggleMute()}>Toggle mute</button>
    </div>

    <div class="field">
      <label for="now-playing-shuffle">Shuffle</label>
      <select id="now-playing-shuffle" {disabled} value={shuffleValue} onchange={handleShuffle}>
        <option value="false">Shuffle off</option>
        <option value="true">Shuffle on</option>
      </select>
    </div>

    <div class="field">
      <label for="now-playing-repeat">Repeat mode</label>
      <select id="now-playing-repeat" {disabled} value={repeatValue} onchange={handleRepeat}>
        <option value="off">Repeat off</option>
        <option value="one">Repeat one</option>
        <option value="all">Repeat all</option>
        <option value="cycle">Repeat cycle</option>
      </select>
    </div>

    <div class="field">
      <label for="now-playing-subtitle">Subtitle stream</label>
      <select id="now-playing-subtitle" {disabled} value={subtitleValue} onchange={handleSubtitle}>
        <option value="off">Subtitles off</option>
        {#each subtitles as subtitle, index}
          <option
            value={typeof subtitle.index === 'number' && Number.isFinite(subtitle.index)
              ? String(subtitle.index)
              : String(index)}
          >
            {subtitleLabel(subtitle, index)}
          </option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label for="now-playing-audio">Audio stream</label>
      <select id="now-playing-audio" {disabled} value={audioValue} onchange={handleAudioStream}>
        {#if audioStreams.length === 0}
          <option value="">No audio streams reported</option>
        {:else}
          {#each audioStreams as stream, index}
            <option
              value={typeof stream.index === 'number' && Number.isFinite(stream.index)
                ? String(stream.index)
                : String(index)}
            >
              {audioLabel(stream, index)}
            </option>
          {/each}
        {/if}
      </select>
    </div>
  </div>
</div>

<style>
  .player-controls {
    display: grid;
    gap: var(--space-md);
  }

  .disabled-reason {
    padding: var(--space-sm) var(--space-md);
    margin: 0;
    color: var(--color-warning);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-warning) 26%, transparent);
  }

  .control-group,
  .relative-seek {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .control-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .field {
    display: grid;
    gap: var(--space-xs);
  }

  .range-field {
    align-content: start;
  }

  label {
    font-weight: 800;
  }

  button,
  select,
  input[type='range'] {
    font: inherit;
  }

  button,
  select {
    min-height: 2.5rem;
    border-radius: var(--radius-pill);
  }

  button {
    padding: var(--space-xs) var(--space-md);
    color: var(--color-accent-contrast);
    font-weight: 800;
    cursor: pointer;
    background: var(--color-accent);
    border: 0;
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease;
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  button:active:not(:disabled) {
    transform: scale(0.97);
  }

  select {
    width: 100%;
    padding: var(--space-xs) var(--space-md);
    color: var(--color-text);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
  }

  input[type='range'] {
    width: 100%;
    min-height: 2.5rem;
    accent-color: var(--color-accent);
  }

  button:disabled,
  select:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  @media (max-width: 760px) {
    .control-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
