<script lang="ts">
  import type { PlayerAudioStream, PlayerSubtitleStream } from '$lib/kodi';
  import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
  import PlayerControls, { type PlayerControlsDispatch } from './PlayerControls.svelte';

  interface Props {
    snapshot: PlayerStoreSnapshot;
    dispatch: PlayerControlsDispatch;
  }

  let { snapshot, dispatch }: Props = $props();

  const title = $derived(mediaTitle(snapshot));
  const creator = $derived(mediaCreator(snapshot));
  const detail = $derived(mediaDetail(snapshot));
  const typeLabel = $derived(
    textOrFallback(snapshot.item?.type ?? snapshot.properties?.type, 'unknown type')
  );
  const currentTime = $derived(formatTime(snapshot.time.currentSeconds));
  const totalTime = $derived(formatTime(snapshot.time.totalSeconds));
  const percentage = $derived(formatPercentage(snapshot.properties?.percentage));
  const volume = $derived(formatVolume(snapshot.application.volume));
  const muted = $derived(
    snapshot.application.muted === true
      ? 'yes'
      : snapshot.application.muted === false
        ? 'no'
        : 'unknown'
  );
  const shuffle = $derived(
    snapshot.properties?.shuffled === true
      ? 'on'
      : snapshot.properties?.shuffled === false
        ? 'off'
        : 'unknown'
  );
  const repeat = $derived(textOrFallback(snapshot.properties?.repeat, 'unknown'));
  const subtitleSummary = $derived(
    formatSubtitleSummary(
      snapshot.properties?.currentsubtitle,
      snapshot.properties?.subtitleenabled
    )
  );
  const audioSummary = $derived(formatAudioSummary(snapshot.properties?.currentaudiostream));
  const statusText = $derived(formatStatus(snapshot, dispatch));

  function mediaTitle(value: PlayerStoreSnapshot): string {
    return firstText(
      value.item?.title,
      value.item?.label,
      value.item?.showtitle,
      value.item?.channel,
      'Unknown title'
    );
  }

  function mediaCreator(value: PlayerStoreSnapshot): string {
    return firstText(
      joinText(value.item?.artist),
      joinText(value.item?.albumartist),
      value.item?.showtitle,
      value.item?.channel,
      'Unknown artist'
    );
  }

  function mediaDetail(value: PlayerStoreSnapshot): string | null {
    const season =
      typeof value.item?.season === 'number' && Number.isFinite(value.item.season)
        ? value.item.season
        : null;
    const episode =
      typeof value.item?.episode === 'number' && Number.isFinite(value.item.episode)
        ? value.item.episode
        : null;
    const album = textOrNull(value.item?.album);

    if (season !== null && episode !== null) {
      return `Season ${season}, episode ${episode}`;
    }

    if (album) {
      return album;
    }

    return null;
  }

  function formatStatus(value: PlayerStoreSnapshot, controls: PlayerControlsDispatch): string {
    if (controls.snapshot.commandStatus === 'running') {
      return `Running ${formatCommandName(controls.snapshot.lastCommand)}.`;
    }

    if (controls.snapshot.commandStatus === 'error' && controls.snapshot.lastError) {
      return sanitizeUiText(controls.snapshot.lastError.message);
    }

    if (value.refreshStatus === 'loading') {
      return `Refreshing player state from ${value.lastRefreshReason}.`;
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.playbackStatus === 'multiple') {
      return 'Multiple Kodi players are active. Choose one player before sending controls.';
    }

    if (value.playbackStatus === 'none') {
      return 'No active Kodi player is available.';
    }

    return value.lastUpdatedAt
      ? `Player state ready. Last updated ${value.lastUpdatedAt}.`
      : 'Player state ready.';
  }

  function formatCommandName(command: string | null): string {
    if (!command) {
      return 'command';
    }

    return command.replace(/([A-Z])/g, ' $1').toLowerCase();
  }

  function formatTime(seconds: number | null): string {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
      return 'Unknown duration';
    }

    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
    }

    return `${pad2(minutes)}:${pad2(remainingSeconds)}`;
  }

  function formatPercentage(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 'Unknown progress';
    }

    return `${Math.round(Math.min(100, Math.max(0, value)))}%`;
  }

  function formatVolume(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 'Volume unknown';
    }

    return `Volume ${Math.round(Math.min(100, Math.max(0, value)))}`;
  }

  function formatAudioSummary(stream: PlayerAudioStream | undefined): string {
    if (!stream) {
      return 'Audio stream unknown';
    }

    return streamLabel('Audio stream', stream, 0);
  }

  function formatSubtitleSummary(
    stream: PlayerSubtitleStream | undefined,
    enabled: unknown
  ): string {
    if (enabled === false) {
      return 'Subtitles off';
    }

    if (!stream) {
      return enabled === true ? 'Subtitle stream unknown' : 'Subtitles unknown';
    }

    return streamLabel('Subtitle stream', stream, 0);
  }

  function streamLabel(
    prefix: string,
    stream: PlayerAudioStream | PlayerSubtitleStream,
    fallbackIndex: number
  ): string {
    const parts = [
      textOrNull(stream.name) ??
        `${prefix} ${typeof stream.index === 'number' && Number.isFinite(stream.index) ? stream.index : fallbackIndex + 1}`,
      textOrNull(stream.language),
      'channels' in stream &&
      typeof stream.channels === 'number' &&
      Number.isFinite(stream.channels)
        ? `${stream.channels}ch`
        : null
    ].filter((part): part is string => Boolean(part));

    return parts.join(' · ');
  }

  function firstText(...values: unknown[]): string {
    for (const value of values) {
      const text = textOrNull(value);
      if (text) {
        return text;
      }
    }

    return 'Unknown';
  }

  function textOrFallback(value: unknown, fallback: string): string {
    return textOrNull(value) ?? fallback;
  }

  function joinText(value: unknown): string | null {
    if (Array.isArray(value)) {
      const joined = value
        .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
        .join(', ');
      return joined || null;
    }

    return textOrNull(value);
  }

  function textOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? sanitizeUiText(value.trim()) : null;
  }

  function sanitizeUiText(value: string): string {
    return value
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/username or password/gi, 'credentials')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/localStorage/gi, 'browser storage');
  }

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="now-playing-panel surface" aria-labelledby="now-playing-title">
  <div class="panel-heading">
    <p class="section-kicker">Now playing</p>
    <h2 id="now-playing-title">{title}</h2>
    <p class="creator-line">{creator}</p>
    {#if detail}
      <p class="detail-line">{detail}</p>
    {/if}
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>

  <dl class="metadata-grid" aria-label="Current player metadata">
    <div>
      <dt>Type</dt>
      <dd>{typeLabel}</dd>
    </div>
    <div>
      <dt>Elapsed</dt>
      <dd>{currentTime}</dd>
    </div>
    <div>
      <dt>Total</dt>
      <dd>{totalTime}</dd>
    </div>
    <div>
      <dt>Progress</dt>
      <dd>{percentage}</dd>
    </div>
    <div>
      <dt>Volume</dt>
      <dd>{volume}</dd>
    </div>
    <div>
      <dt>Muted</dt>
      <dd>Muted: {muted}</dd>
    </div>
    <div>
      <dt>Shuffle</dt>
      <dd>{shuffle}</dd>
    </div>
    <div>
      <dt>Repeat</dt>
      <dd>{repeat}</dd>
    </div>
    <div>
      <dt>Subtitle</dt>
      <dd>{subtitleSummary}</dd>
    </div>
    <div>
      <dt>Audio</dt>
      <dd>{audioSummary}</dd>
    </div>
  </dl>

  <PlayerControls {snapshot} {dispatch} />
</section>

<style>
  .now-playing-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  p,
  dl,
  dd {
    margin: 0;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(1.4rem, 3vw, 2.2rem);
    line-height: 1.08;
    text-wrap: balance;
  }

  .creator-line,
  .detail-line {
    color: var(--color-text-muted);
    line-height: 1.55;
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 74%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .metadata-grid div {
    display: grid;
    gap: var(--space-2xs);
    min-width: 0;
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
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

  @media (max-width: 980px) {
    .metadata-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .metadata-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
