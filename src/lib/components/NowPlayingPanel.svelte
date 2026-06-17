<script lang="ts">
  import type { PlayerAudioStream, PlayerSubtitleStream } from '$lib/kodi';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';
  import type { PlayerStoreSnapshot } from '$lib/stores/player.svelte';
  import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
  import PlayerControls, { type PlayerControlsDispatch } from './PlayerControls.svelte';
  import { sanitizeUiText, textOrNull } from './textFormatting';

  interface Props {
    snapshot: PlayerStoreSnapshot;
    dispatch: PlayerControlsDispatch;
    localPlayerSnapshot?: LocalPlayerStoreSnapshot;
    i18n?: TranslationContext;
  }

  let {
    snapshot,
    dispatch,
    localPlayerSnapshot,
    i18n = createEnglishTranslationContext()
  }: Props = $props();

  const DEFAULT_LOCAL_SNAPSHOT: LocalPlayerStoreSnapshot = {
    status: 'idle',
    mediaKind: 'unknown',
    source: null,
    item: null,
    currentSeconds: 0,
    durationSeconds: null,
    volume: 100,
    muted: false,
    lastError: null,
    kodiPausedForLocal: false,
    resumeAvailable: false,
    lastUpdatedAt: null
  };

  const currentLocalSnapshot = $derived(localPlayerSnapshot ?? DEFAULT_LOCAL_SNAPSHOT);

  const title = $derived(mediaTitle(snapshot));
  const creator = $derived(mediaCreator(snapshot));
  const detail = $derived(mediaDetail(snapshot));
  const typeLabel = $derived(
    textOrFallback(
      snapshot.item?.type ?? snapshot.properties?.type,
      i18n.t('nowPlaying.unknownType')
    )
  );
  const currentTime = $derived(formatTime(snapshot.time.currentSeconds));
  const totalTime = $derived(formatTime(snapshot.time.totalSeconds));
  const percentage = $derived(formatPercentage(snapshot.properties?.percentage));
  const volume = $derived(formatVolume(snapshot.application.volume));
  const muted = $derived(
    snapshot.application.muted === true
      ? i18n.t('nowPlaying.yes')
      : snapshot.application.muted === false
        ? i18n.t('nowPlaying.no')
        : i18n.t('nowPlaying.unknown')
  );
  const shuffle = $derived(
    snapshot.properties?.shuffled === true
      ? i18n.t('player.controls.shuffle.on')
      : snapshot.properties?.shuffled === false
        ? i18n.t('player.controls.shuffle.off')
        : i18n.t('nowPlaying.unknown')
  );
  const repeat = $derived(
    textOrFallback(snapshot.properties?.repeat, i18n.t('nowPlaying.unknown'))
  );
  const queueSummary = $derived(formatQueueSummary(snapshot));
  const subtitleSummary = $derived(
    formatSubtitleSummary(
      snapshot.properties?.currentsubtitle,
      snapshot.properties?.subtitleenabled
    )
  );
  const audioSummary = $derived(formatAudioSummary(snapshot.properties?.currentaudiostream));
  const statusText = $derived(formatStatus(snapshot, currentLocalSnapshot, dispatch));

  function mediaTitle(value: PlayerStoreSnapshot): string {
    return firstText(
      value.item?.title,
      value.item?.label,
      value.item?.showtitle,
      value.item?.channel,
      i18n.t('nowPlaying.unknownTitle')
    );
  }

  function mediaCreator(value: PlayerStoreSnapshot): string {
    return firstText(
      joinText(value.item?.artist),
      joinText(value.item?.albumartist),
      value.item?.showtitle,
      value.item?.channel,
      i18n.t('nowPlaying.unknownArtist')
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
      return i18n.t('nowPlaying.seasonEpisode', { season, episode });
    }

    if (album) {
      return album;
    }

    return null;
  }

  function formatStatus(
    value: PlayerStoreSnapshot,
    localSnapshot: LocalPlayerStoreSnapshot,
    controls: PlayerControlsDispatch
  ): string {
    if (controls.snapshot.commandStatus === 'running') {
      return i18n.t('nowPlaying.status.running', {
        command: formatCommandName(controls.snapshot.lastCommand)
      });
    }

    if (controls.snapshot.commandStatus === 'error' && controls.snapshot.lastError) {
      return sanitizeUiText(controls.snapshot.lastError.message);
    }

    if (controls.snapshot.mode === 'local') {
      if (localSnapshot.lastError) {
        return sanitizeUiText(localSnapshot.lastError.message);
      }

      switch (localSnapshot.status) {
        case 'playing':
          return i18n.t('nowPlaying.status.local.playing');
        case 'paused':
          return i18n.t('nowPlaying.status.local.paused');
        case 'loading':
          return i18n.t('nowPlaying.status.local.loading');
        case 'ended':
          return i18n.t('nowPlaying.status.local.ended');
        case 'error':
          return i18n.t('nowPlaying.status.local.error');
        default:
          return i18n.t('nowPlaying.status.local.ready');
      }
    }

    if (value.refreshStatus === 'loading') {
      return i18n.t('nowPlaying.status.refreshing', { reason: value.lastRefreshReason });
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.playbackStatus === 'multiple') {
      return i18n.t('nowPlaying.status.multiple');
    }

    if (value.playbackStatus === 'none') {
      return i18n.t('nowPlaying.status.noActive');
    }

    const readyText = value.lastUpdatedAt
      ? i18n.t('nowPlaying.status.readyUpdated', { lastUpdated: value.lastUpdatedAt })
      : i18n.t('nowPlaying.status.ready');

    return i18n.t('nowPlaying.status.playingKodi', { readyText });
  }

  function formatCommandName(command: string | null): string {
    if (!command) {
      return 'command';
    }

    return command.replace(/([A-Z])/g, ' $1').toLowerCase();
  }

  function formatTime(seconds: number | null): string {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
      return i18n.t('nowPlaying.time.unknown');
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
      return i18n.t('nowPlaying.progress.unknown');
    }

    return `${Math.round(Math.min(100, Math.max(0, value)))}%`;
  }

  function formatVolume(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return i18n.t('nowPlaying.volume.unknown');
    }

    return i18n.t('nowPlaying.volume.value', {
      volume: Math.round(Math.min(100, Math.max(0, value)))
    });
  }

  function formatAudioSummary(stream: PlayerAudioStream | undefined): string {
    if (!stream) {
      return i18n.t('nowPlaying.audio.unknown');
    }

    return streamLabel('player.controls.audioStreamFallback', stream, 0);
  }

  function formatQueueSummary(value: PlayerStoreSnapshot): string {
    if (value.queue.playlistid === null || value.queue.position === null) {
      return i18n.t('nowPlaying.queue.unknown');
    }

    return i18n.t('nowPlaying.queue.position', {
      playlistid: value.queue.playlistid,
      position: value.queue.position
    });
  }

  function formatSubtitleSummary(
    stream: PlayerSubtitleStream | undefined,
    enabled: unknown
  ): string {
    if (enabled === false) {
      return i18n.t('nowPlaying.subtitle.off');
    }

    if (!stream) {
      return enabled === true
        ? i18n.t('nowPlaying.subtitle.streamUnknown')
        : i18n.t('nowPlaying.subtitle.unknown');
    }

    return streamLabel('player.controls.subtitleStreamFallback', stream, 0);
  }

  function streamLabel(
    fallbackKey: 'player.controls.audioStreamFallback' | 'player.controls.subtitleStreamFallback',
    stream: PlayerAudioStream | PlayerSubtitleStream,
    fallbackIndex: number
  ): string {
    const parts = [
      textOrNull(stream.name) ??
        i18n.t(fallbackKey, {
          index:
            typeof stream.index === 'number' && Number.isFinite(stream.index)
              ? stream.index
              : fallbackIndex + 1
        }),
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

    return i18n.t('nowPlaying.unknown');
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

  function pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
</script>

<section class="now-playing-panel surface" aria-labelledby="now-playing-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('nowPlaying.kicker')}</p>
    <h2 id="now-playing-title">{title}</h2>
    <p class="creator-line">{creator}</p>
    {#if detail}
      <p class="detail-line">{detail}</p>
    {/if}
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>

  <div class="mode-controls" aria-label={i18n.t('nowPlaying.destinationAria')}>
    {#if dispatch.snapshot.mode === 'local' && currentLocalSnapshot.resumeAvailable}
      <button
        type="button"
        class="mode-button"
        aria-label={i18n.t('nowPlaying.resumeKodi')}
        disabled={dispatch.snapshot.commandStatus === 'running'}
        onclick={() => dispatch.resumeOnKodi()}
      >
        {i18n.t('nowPlaying.resumeKodi')}
      </button>
    {:else}
      <button
        type="button"
        class="mode-button"
        aria-label={i18n.t('nowPlaying.playLocal')}
        disabled={dispatch.snapshot.commandStatus === 'running' ||
          snapshot.playbackStatus !== 'active' ||
          snapshot.activePlayers.length !== 1}
        onclick={() => dispatch.startLocalPlayback()}
      >
        {i18n.t('nowPlaying.playLocal')}
      </button>
    {/if}
  </div>

  <dl class="metadata-grid" aria-label={i18n.t('nowPlaying.metadataAria')}>
    <div>
      <dt>{i18n.t('nowPlaying.label.type')}</dt>
      <dd>{typeLabel}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.elapsed')}</dt>
      <dd>{currentTime}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.total')}</dt>
      <dd>{totalTime}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.progress')}</dt>
      <dd>{percentage}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.volume')}</dt>
      <dd>{volume}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.muted')}</dt>
      <dd>{i18n.t('nowPlaying.label.mutedValue', { value: muted })}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.shuffle')}</dt>
      <dd>{shuffle}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.repeat')}</dt>
      <dd>{repeat}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.queue')}</dt>
      <dd>{queueSummary}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.subtitle')}</dt>
      <dd>{subtitleSummary}</dd>
    </div>
    <div>
      <dt>{i18n.t('nowPlaying.label.audio')}</dt>
      <dd>{audioSummary}</dd>
    </div>
  </dl>

  <PlayerControls {snapshot} {dispatch} localPlayerSnapshot={currentLocalSnapshot} {i18n} />
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

  .mode-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .mode-button {
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    font: inherit;
    color: var(--color-text);
    font-weight: 800;
    cursor: pointer;
    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-raised));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease;
  }

  .mode-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  .mode-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .mode-button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
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
