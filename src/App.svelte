<script lang="ts">
  import AppShell from '$components/AppShell.svelte';
  import HostSettings from '$components/HostSettings.svelte';
  import HostSwitcher from '$components/HostSwitcher.svelte';
  import StatusCard from '$components/StatusCard.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import {
    configStore,
    connectionStore,
    playerStore,
    type ConnectionStoreSnapshot,
    type PlayerStoreSnapshot
  } from '$lib/stores';

  interface Props {
    playerSnapshot?: PlayerStoreSnapshot;
  }

  let { playerSnapshot }: Props = $props();
  const currentPlayerSnapshot = $derived(playerSnapshot ?? playerStore.snapshot);

  function formatKodiVersion(version: ConnectionStoreSnapshot['kodiVersion']): string | null {
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

  function connectionTone(
    snapshot: ConnectionStoreSnapshot
  ): 'neutral' | 'success' | 'warning' | 'danger' {
    if (snapshot.status === 'failed') {
      return 'danger';
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return 'warning';
    }

    if (snapshot.status === 'connected') {
      return 'success';
    }

    return 'neutral';
  }

  function connectionStatusText(snapshot: ConnectionStoreSnapshot): string {
    if (snapshot.status === 'idle') {
      return 'no host';
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return 'degraded';
    }

    return snapshot.status;
  }

  function connectionDescription(snapshot: ConnectionStoreSnapshot): string {
    const version = formatKodiVersion(snapshot.kodiVersion);
    const versionText = version ? ` Kodi ${version}.` : '';
    const lastConnectedText = snapshot.lastConnectedAt
      ? ` Last connected ${snapshot.lastConnectedAt}.`
      : '';

    if (snapshot.status === 'idle') {
      return 'Add a trusted Kodi host to begin HTTP diagnostics. HTTP and WebSocket checks are idle.';
    }

    if (snapshot.status === 'checking') {
      return 'Checking Kodi HTTP diagnostics before opening the notification WebSocket.';
    }

    if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
      return `WebSocket degraded after HTTP diagnostics succeeded; retry attempt ${snapshot.reconnectAttempt}.${versionText}${lastConnectedText}`;
    }

    if (snapshot.status === 'failed') {
      return snapshot.lastError
        ? `Kodi connection failed (${snapshot.lastError.source}/${snapshot.lastError.code}): ${snapshot.lastError.message}`
        : 'Kodi connection failed with no additional diagnostics.';
    }

    const transportText = snapshot.webSocketEndpoint
      ? 'Kodi HTTP and WebSocket diagnostics are connected.'
      : 'Kodi HTTP diagnostics are connected.';

    return `${transportText}${versionText}${lastConnectedText}`;
  }

  function playerTone(snapshot: PlayerStoreSnapshot): 'neutral' | 'success' | 'warning' | 'danger' {
    if (snapshot.refreshStatus === 'error') {
      return 'danger';
    }

    if (snapshot.refreshStatus === 'loading' || snapshot.playbackStatus === 'multiple') {
      return 'warning';
    }

    if (snapshot.playbackStatus === 'active') {
      return 'success';
    }

    return 'neutral';
  }

  function playerStatusText(snapshot: PlayerStoreSnapshot): string {
    if (snapshot.refreshStatus === 'loading' || snapshot.refreshStatus === 'error') {
      return snapshot.refreshStatus;
    }

    return snapshot.playbackStatus;
  }

  function playerDescription(snapshot: PlayerStoreSnapshot): string {
    return [
      playerStateSummary(snapshot),
      playerItemSummary(snapshot),
      playerTimeSummary(snapshot),
      playerVolumeSummary(snapshot),
      playerQueueSummary(snapshot)
    ].join(' ');
  }

  function playerStateSummary(snapshot: PlayerStoreSnapshot): string {
    if (snapshot.refreshStatus === 'error' && snapshot.lastError) {
      return `Player refresh error (${snapshot.lastError.source}/${snapshot.lastError.code}): ${snapshot.lastError.message}.`;
    }

    if (snapshot.refreshStatus === 'loading') {
      return 'Refreshing player state.';
    }

    if (snapshot.playbackStatus === 'multiple') {
      const players = snapshot.activePlayers
        .map((player) => `${player.type} #${player.playerid}`)
        .join(', ');
      const playerText = players || 'multiple active players';
      return `Multiple Kodi players detected: ${playerText}. Controls are not available in S01.`;
    }

    if (snapshot.playbackStatus === 'none') {
      return 'No active Kodi player detected.';
    }

    return 'Kodi player is active.';
  }

  function playerItemSummary(snapshot: PlayerStoreSnapshot): string {
    const title = firstNonEmptyString(snapshot.item?.label, snapshot.item?.title);
    return title ? `Now playing ${title}.` : 'Now playing unavailable.';
  }

  function playerTimeSummary(snapshot: PlayerStoreSnapshot): string {
    const percentage =
      typeof snapshot.properties?.percentage === 'number' &&
      Number.isFinite(snapshot.properties.percentage)
        ? Math.round(snapshot.properties.percentage)
        : null;

    if (snapshot.time.currentSeconds !== null && snapshot.time.totalSeconds !== null) {
      const percentText = percentage !== null ? ` (${percentage}%).` : '.';
      return `${formatDuration(snapshot.time.currentSeconds)} / ${formatDuration(snapshot.time.totalSeconds)}${percentText}`;
    }

    if (percentage !== null) {
      return `Progress ${percentage}%.`;
    }

    return 'Time unavailable.';
  }

  function playerVolumeSummary(snapshot: PlayerStoreSnapshot): string {
    if (snapshot.application.volume === null) {
      return 'Volume unavailable.';
    }

    const mutedText = snapshot.application.muted === true ? ' muted' : '';
    return `Volume ${snapshot.application.volume}%${mutedText}.`;
  }

  function playerQueueSummary(snapshot: PlayerStoreSnapshot): string {
    if (snapshot.queue.playlistid === null || snapshot.queue.position === null) {
      return 'Queue unavailable.';
    }

    return `Queue playlist ${snapshot.queue.playlistid} position ${snapshot.queue.position}.`;
  }

  function formatDuration(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function firstNonEmptyString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }
</script>

<AppShell>
  <header class="hero" aria-labelledby="app-title">
    <div class="hero-copy">
      <p class="eyebrow">Multi-host console</p>
      <h1 id="app-title">chorus3</h1>
      <p class="lede">
        Save trusted Kodi endpoints, test HTTP diagnostics, switch the active host, and watch
        connection status update without reloading the app.
      </p>
    </div>
    <ThemeToggle />
  </header>

  <main class="dashboard" aria-label="Kodi host configuration and status">
    <section class="mission surface" aria-labelledby="mission-title">
      <p class="section-kicker">Runtime surface</p>
      <h2 id="mission-title">
        {configStore.snapshot.activeHost?.label ?? 'No Kodi host configured yet'}
      </h2>
      <p>
        Host settings are persisted locally for trusted devices, while connection diagnostics stay
        secret-safe and visible in the status cards below.
      </p>
    </section>

    <div class="host-grid">
      <HostSettings />
      <HostSwitcher />
    </div>

    <section class="status-grid" aria-label="Kodi readiness status">
      <StatusCard
        title="Connection"
        status={connectionStatusText(connectionStore.snapshot)}
        tone={connectionTone(connectionStore.snapshot)}
        description={connectionDescription(connectionStore.snapshot)}
      />
      <StatusCard
        title="Player state"
        status={playerStatusText(currentPlayerSnapshot)}
        tone={playerTone(currentPlayerSnapshot)}
        description={playerDescription(currentPlayerSnapshot)}
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

  .host-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(20rem, 0.88fr);
    gap: var(--space-md);
    align-items: start;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .host-grid,
    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
