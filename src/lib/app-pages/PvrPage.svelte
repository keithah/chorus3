<script lang="ts">
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type {
    PvrChannelGroup,
    PvrChannelSnapshot,
    PvrBroadcastSnapshot,
    PvrRecordingSnapshot,
    PvrStoreSnapshot
  } from '$lib/stores';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';

  export interface PvrPageDispatch {
    refreshChannels(group: PvrChannelGroup): Promise<void> | void;
    refreshRecordings(): Promise<void> | void;
    refreshBroadcasts?(channelid: number): Promise<void> | void;
    loadChannelDetail?(channelid: number): Promise<unknown> | unknown;
    toggleChannelRecording?(channelid: number): Promise<void> | void;
    toggleBroadcastTimer?(broadcastid: number, timerrule?: boolean): Promise<void> | void;
    addBroadcastTimer?(broadcastid: number, timerrule?: boolean): Promise<void> | void;
    deleteTimer?(timerid: number): Promise<void> | void;
  }

  type PvrPlayerDispatch = PlayerControlsDispatch & {
    playChannelItem?: (item: { channelid: number }) => Promise<void> | void;
    playFileItem?: (item: { file: string; mediaKind: 'audio' | 'video' }) => Promise<void> | void;
  };

  interface Props {
    route: PrimaryRoute;
    snapshot: PvrStoreSnapshot;
    dispatch: PvrPageDispatch;
    playerDispatch: PvrPlayerDispatch;
    buildOptions?: BuildAppRouteOptions;
  }

  let { route, snapshot, dispatch, playerDispatch, buildOptions = {} }: Props = $props();

  let lastRefreshKey = $state('');
  let lastGlobalEpgKey = $state('');
  const mode = $derived(resolveMode(route));
  const channels = $derived(mode === 'radio' ? snapshot.radioChannels : snapshot.tvChannels);
  const channelStatus = $derived(mode === 'radio' ? snapshot.radioStatus : snapshot.tvStatus);
  const selectedChannel = $derived(resolveSelectedChannel(route, channels));
  const selectedBroadcasts = $derived(
    selectedChannel ? (snapshot.broadcastsByChannelId[selectedChannel.channelid] ?? []) : []
  );
  const isGlobalEpgPage = $derived(route.kind === 'pvrEpg');
  const isEpgPage = $derived(
    route.kind === 'pvrEpg' || route.kind === 'pvrTvChannel' || route.kind === 'pvrRadioChannel'
  );
  const isChannelPage = $derived(mode === 'tv' || mode === 'radio');
  const isRecordingPage = $derived(mode === 'recordings');
  const heading = $derived(
    isGlobalEpgPage
      ? 'TV Guide'
      : isEpgPage
        ? (selectedChannel?.label ?? (mode === 'radio' ? 'Radio Station' : 'TV Channel'))
        : mode === 'radio'
          ? 'Radio Stations'
          : mode === 'recordings'
            ? 'Recordings'
            : 'TV Channels'
  );
  const activeGroup = $derived(mode === 'radio' ? 'allradio' : 'alltv');

  $effect(() => {
    const key = routeKey(route);
    if (key === lastRefreshKey) {
      return;
    }

    lastRefreshKey = key;
    if (mode === 'recordings') {
      void dispatch.refreshRecordings();
      return;
    }

    void dispatch.refreshChannels(activeGroup);
  });

  $effect(() => {
    if (route.kind !== 'pvrEpg') {
      lastGlobalEpgKey = '';
      return;
    }

    const key = snapshot.tvChannels.map((channel) => channel.channelid).join(',');
    if (!key || key === lastGlobalEpgKey) {
      return;
    }

    lastGlobalEpgKey = key;
    for (const channel of snapshot.tvChannels) {
      void dispatch.refreshBroadcasts?.(channel.channelid);
    }
  });

  $effect(() => {
    if (route.kind !== 'pvrTvChannel' && route.kind !== 'pvrRadioChannel') {
      return;
    }

    const channelid = Number(route.channelid);
    if (!Number.isSafeInteger(channelid) || channelid <= 0) {
      return;
    }

    void dispatch.loadChannelDetail?.(channelid);
    void dispatch.refreshBroadcasts?.(channelid);
  });

  function resolveMode(value: PrimaryRoute): 'tv' | 'radio' | 'recordings' {
    if (value.kind === 'pvrRadio' || value.kind === 'pvrRadioChannel') {
      return 'radio';
    }

    if (value.kind === 'pvrRecordings') {
      return 'recordings';
    }

    return 'tv';
  }

  function resolveSelectedChannel(
    value: PrimaryRoute,
    items: readonly PvrChannelSnapshot[]
  ): PvrChannelSnapshot | null {
    if (value.kind !== 'pvrTvChannel' && value.kind !== 'pvrRadioChannel') {
      return null;
    }

    const channelid = Number(value.channelid);
    return items.find((item) => item.channelid === channelid) ?? null;
  }

  function routeKey(value: PrimaryRoute): string {
    if (value.kind === 'pvrTvChannel' || value.kind === 'pvrRadioChannel') {
      return `${value.kind}:${value.channelid}`;
    }

    return value.kind;
  }

  function hrefFor(target: PrimaryRoute): string {
    return buildPrimaryAppRoute(target, buildOptions);
  }

  function channelHref(channel: PvrChannelSnapshot): string {
    return hrefFor(
      mode === 'radio'
        ? { kind: 'pvrRadioChannel', channelid: String(channel.channelid) }
        : { kind: 'pvrTvChannel', channelid: String(channel.channelid) }
    );
  }

  function navigateToHref(href: string): void {
    if (href.startsWith('#') && typeof globalThis.location?.hash === 'string') {
      globalThis.location.hash = href;
      return;
    }

    globalThis.history?.pushState?.({}, '', href);
    globalThis.dispatchEvent?.(new PopStateEvent('popstate'));
  }

  function handleRouteLink(event: MouseEvent, href: string): void {
    event.preventDefault();
    navigateToHref(href);
  }

  function imageUrl(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim()
      ? `/image/${encodeURIComponent(value.trim())}`
      : undefined;
  }

  async function refreshCurrent(): Promise<void> {
    if (mode === 'recordings') {
      await dispatch.refreshRecordings();
      return;
    }

    if (route.kind === 'pvrEpg') {
      await refreshGlobalEpg();
      return;
    }

    if (isEpgPage) {
      const channelid = Number(
        route.kind === 'pvrTvChannel' || route.kind === 'pvrRadioChannel' ? route.channelid : 0
      );
      if (Number.isSafeInteger(channelid) && channelid > 0) {
        await dispatch.refreshBroadcasts?.(channelid);
      }
      return;
    }

    await dispatch.refreshChannels(activeGroup);
  }

  async function playChannel(channel: PvrChannelSnapshot): Promise<void> {
    await playerDispatch.playChannelItem?.({ channelid: channel.channelid });
  }

  async function refreshGlobalEpg(): Promise<void> {
    await dispatch.refreshChannels('alltv');
    await Promise.all(
      snapshot.tvChannels.map((channel) => dispatch.refreshBroadcasts?.(channel.channelid))
    );
  }

  function broadcastsFor(channel: PvrChannelSnapshot): readonly PvrBroadcastSnapshot[] {
    return snapshot.broadcastsByChannelId[channel.channelid] ?? [];
  }

  async function toggleRecording(channel: PvrChannelSnapshot): Promise<void> {
    await dispatch.toggleChannelRecording?.(channel.channelid);
  }

  async function toggleTimer(broadcast: PvrBroadcastSnapshot): Promise<void> {
    await dispatch.toggleBroadcastTimer?.(broadcast.broadcastid, false);
    if (selectedChannel) {
      await dispatch.refreshBroadcasts?.(selectedChannel.channelid);
    }
  }

  async function playSelectedBroadcast(): Promise<void> {
    if (selectedChannel) {
      await playChannel(selectedChannel);
    }
  }

  async function recordSelectedBroadcast(): Promise<void> {
    if (selectedChannel) {
      await toggleRecording(selectedChannel);
    }
  }

  async function playRecording(recording: PvrRecordingSnapshot): Promise<void> {
    if (!recording.file) {
      return;
    }

    await playerDispatch.playFileItem?.({
      file: recording.file,
      mediaKind: recording.radio ? 'audio' : 'video'
    });
  }

  function formatClock(value: string | undefined): string {
    const date = kodiDate(value);
    return date
      ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
      : '';
  }

  function formatRecordingDate(value: string | undefined): string {
    const date = kodiDate(value);
    return date
      ? date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      : '';
  }

  function formatRuntime(seconds: number | undefined): string {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
      return '';
    }
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h ${rest}m` : `${minutes}m`;
  }

  function kodiDate(value: string | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
  }
</script>

<div class="classic-page pvr-page">
  <aside class="classic-subnav" aria-label="PVR sections">
    <p class="subnav-kicker">PVR</p>
    <a
      class:active={mode === 'tv'}
      href={hrefFor({ kind: 'pvrTv' })}
      onclick={(event) => handleRouteLink(event, hrefFor({ kind: 'pvrTv' }))}>TV Channels</a
    >
    <a
      class:active={route.kind === 'pvrEpg'}
      href={hrefFor({ kind: 'pvrEpg' })}
      onclick={(event) => handleRouteLink(event, hrefFor({ kind: 'pvrEpg' }))}>Guide</a
    >
    <a
      class:active={mode === 'radio'}
      href={hrefFor({ kind: 'pvrRadio' })}
      onclick={(event) => handleRouteLink(event, hrefFor({ kind: 'pvrRadio' }))}>Radio Stations</a
    >
    <a
      class:active={mode === 'recordings'}
      href={hrefFor({ kind: 'pvrRecordings' })}
      onclick={(event) => handleRouteLink(event, hrefFor({ kind: 'pvrRecordings' }))}>Recordings</a
    >
  </aside>

  <section class="pvr-content" aria-labelledby="pvr-page-title">
    <header class="pvr-toolbar">
      <h2 id="pvr-page-title">{heading}</h2>
      <button type="button" onclick={refreshCurrent}>
        {isRecordingPage ? 'Refresh recordings' : isEpgPage ? 'Refresh EPG' : 'Refresh channels'}
      </button>
    </header>

    {#if snapshot.lastError}
      <p class="pvr-error" role="status">{snapshot.lastError.message}</p>
    {/if}

    {#if isGlobalEpgPage}
      {#if channelStatus === 'loading' && channels.length === 0}
        <p class="empty-state">Loading EPG...</p>
      {:else if channels.length === 0}
        <p class="empty-state">No TV channels found.</p>
      {:else}
        <div class="broadcast-list programmes global-epg" aria-label="TV Guide">
          {#each channels as channel (channel.channelid)}
            <section class="global-epg-channel" aria-labelledby={`pvr-guide-${channel.channelid}`}>
              <h3 id={`pvr-guide-${channel.channelid}`}>{channel.label}</h3>
              {#if broadcastsFor(channel).length === 0}
                <p class="empty-state">No broadcasts found.</p>
              {:else}
                {#each broadcastsFor(channel) as broadcast (broadcast.broadcastid)}
                  <article
                    class:active={broadcast.isactive}
                    class:aired={broadcast.wasactive}
                    class:airing={broadcast.isactive}
                    class:hasTimer={broadcast.hastimer || broadcast.hastimerrule}
                    class="broadcast-row pvr-card"
                  >
                    <span class="broadcast-time">
                      {formatClock(broadcast.starttime) || broadcast.starttime || ''}
                      {#if broadcast.endtime}
                        <small>{formatClock(broadcast.endtime) || broadcast.endtime}</small>
                      {/if}
                    </span>
                    <span class="pvr-card__text">
                      <strong>{broadcast.title ?? broadcast.label}</strong>
                      {#if broadcast.plot}
                        <span>{broadcast.plot}</span>
                      {/if}
                    </span>
                    <button type="button" class="pvr-play" onclick={() => playChannel(channel)}>
                      Play
                    </button>
                    <button type="button" class="pvr-play" onclick={() => toggleRecording(channel)}>
                      Record
                    </button>
                    <button type="button" class="pvr-play" onclick={() => toggleTimer(broadcast)}>
                      {broadcast.hastimer || broadcast.hastimerrule ? 'Timer on' : 'Timer'}
                    </button>
                  </article>
                {/each}
              {/if}
            </section>
          {/each}
        </div>
      {/if}
    {:else if isEpgPage}
      {#if !selectedChannel && channelStatus === 'loading'}
        <p class="empty-state">Loading channel...</p>
      {:else if !selectedChannel}
        <p class="empty-state">Channel not found.</p>
      {:else}
        <section class="channel-actions" aria-label={`${selectedChannel.label} actions`}>
          <button type="button" class="pvr-play" onclick={() => playChannel(selectedChannel)}>
            Play
          </button>
          <button type="button" class="pvr-play" onclick={() => toggleRecording(selectedChannel)}>
            {selectedChannel.isrecording ? 'Stop record' : 'Record'}
          </button>
        </section>
        {#if selectedBroadcasts.length === 0}
          <p class="empty-state">No broadcasts found.</p>
        {:else}
          <div class="broadcast-list programmes" aria-label={`${selectedChannel.label} EPG`}>
            {#each selectedBroadcasts as broadcast (broadcast.broadcastid)}
              <article
                class:active={broadcast.isactive}
                class:aired={broadcast.wasactive}
                class:airing={broadcast.isactive}
                class:hasTimer={broadcast.hastimer || broadcast.hastimerrule}
                class="broadcast-row pvr-card"
              >
                <span class="broadcast-time">
                  {formatClock(broadcast.starttime) || broadcast.starttime || ''}
                  {#if broadcast.endtime}
                    <small>{formatClock(broadcast.endtime) || broadcast.endtime}</small>
                  {/if}
                </span>
                <span class="pvr-card__text">
                  <strong>{broadcast.title ?? broadcast.label}</strong>
                  {#if broadcast.plot}
                    <span>{broadcast.plot}</span>
                  {/if}
                </span>
                <button type="button" class="pvr-play" onclick={() => playSelectedBroadcast()}>
                  Play
                </button>
                <button type="button" class="pvr-play" onclick={() => recordSelectedBroadcast()}>
                  Record
                </button>
                <button type="button" class="pvr-play" onclick={() => toggleTimer(broadcast)}>
                  {broadcast.hastimer || broadcast.hastimerrule ? 'Timer on' : 'Timer'}
                </button>
              </article>
            {/each}
          </div>
        {/if}
      {/if}
    {:else if isChannelPage}
      {#if channelStatus === 'loading' && channels.length === 0}
        <p class="empty-state">Loading channels...</p>
      {:else if channels.length === 0}
        <p class="empty-state">No {mode === 'radio' ? 'radio stations' : 'TV channels'} found.</p>
      {:else}
        <div class="pvr-grid" aria-label={heading}>
          {#each channels as channel (channel.channelid)}
            <article
              class:active={selectedChannel?.channelid === channel.channelid}
              class="pvr-card"
            >
              <a
                class="pvr-card__main"
                href={channelHref(channel)}
                onclick={(event) => handleRouteLink(event, channelHref(channel))}
              >
                <span class="thumb" aria-hidden="true">
                  {#if imageUrl(channel.thumbnail)}
                    <img src={imageUrl(channel.thumbnail)} alt="" />
                  {:else}
                    <span class="thumb-placeholder">K</span>
                  {/if}
                </span>
                <span class="pvr-card__text">
                  <strong>{channel.label}</strong>
                  {#if channel.broadcastTitle}
                    <span>{channel.broadcastTitle}</span>
                  {:else if channel.channel}
                    <span>{channel.channel}</span>
                  {/if}
                </span>
              </a>
              <button type="button" class="pvr-play" onclick={() => playChannel(channel)}>
                Play
              </button>
              <button type="button" class="pvr-play" onclick={() => toggleRecording(channel)}>
                {channel.isrecording ? 'Stop record' : 'Record'}
              </button>
            </article>
          {/each}
        </div>
        {#if selectedChannel}
          <section class="broadcast-panel" aria-label={`${selectedChannel.label} broadcasts`}>
            <h3>{selectedChannel.label}</h3>
            {#if selectedBroadcasts.length === 0}
              <p class="empty-state">No broadcasts found.</p>
            {:else}
              <div class="broadcast-list">
                {#each selectedBroadcasts as broadcast (broadcast.broadcastid)}
                  <article class:active={broadcast.isactive} class="broadcast-row">
                    <span class="broadcast-time">
                      {broadcast.starttime ?? ''}
                      {#if broadcast.endtime}
                        <small>{broadcast.endtime}</small>
                      {/if}
                    </span>
                    <span class="pvr-card__text">
                      <strong>{broadcast.title ?? broadcast.label}</strong>
                      {#if broadcast.plot}
                        <span>{broadcast.plot}</span>
                      {/if}
                    </span>
                    <button type="button" class="pvr-play" onclick={() => playSelectedBroadcast()}>
                      Play
                    </button>
                    <button
                      type="button"
                      class="pvr-play"
                      onclick={() => recordSelectedBroadcast()}
                    >
                      Record
                    </button>
                    <button type="button" class="pvr-play" onclick={() => toggleTimer(broadcast)}>
                      {broadcast.hastimer || broadcast.hastimerrule ? 'Timer on' : 'Timer'}
                    </button>
                  </article>
                {/each}
              </div>
            {/if}
          </section>
        {/if}
      {/if}
    {:else if snapshot.recordingsStatus === 'loading' && snapshot.recordings.length === 0}
      <p class="empty-state">Loading recordings...</p>
    {:else if snapshot.recordings.length === 0}
      <p class="empty-state">No recordings found.</p>
    {:else}
      <div class="pvr-list" aria-label="Recordings">
        {#each snapshot.recordings as recording (recording.recordingid)}
          <article class="recording-row">
            <div class="recording-body">
              <div class="recording-title">
                <strong>{recording.title ?? recording.label}</strong>
                {#if recording.channel}
                  <span>- {recording.channel}</span>
                {/if}
              </div>
              <div class="recording-date">
                {formatClock(recording.starttime)}
                {#if formatClock(recording.endtime)}
                  - {formatClock(recording.endtime)}
                  {#if formatRuntime(recording.runtime)}
                    ({formatRuntime(recording.runtime)})
                  {/if}
                {:else}
                  - Now
                {/if}
                {#if formatRecordingDate(recording.starttime)}
                  <br />{formatRecordingDate(recording.starttime)}
                {/if}
              </div>
              {#if recording.plot}
                <div class="recording-plot">{recording.plot}</div>
              {/if}
              {#if typeof recording.progress === 'number'}
                <div class="entity-progress" title={`${recording.progress}% complete`}>
                  <div class="current-progress" style={`width: ${recording.progress}%`}></div>
                </div>
              {/if}
            </div>
            <button
              type="button"
              class="pvr-play"
              disabled={!recording.file}
              onclick={() => playRecording(recording)}
            >
              Play
            </button>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .classic-page {
    display: grid;
    grid-template-columns: 256px minmax(0, 1fr);
    min-height: 100%;
    background: #ddd;
    color: #333;
  }

  .classic-subnav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 2rem 1.4rem;
    background: #f5f5f5;
  }

  .subnav-kicker {
    margin: 0 0 0.5rem;
    color: #888;
    font-size: 0.9rem;
    text-transform: uppercase;
  }

  .classic-subnav a {
    color: #333;
    text-decoration: none;
  }

  .classic-subnav a.active {
    color: #4bb3e8;
    font-weight: 700;
  }

  .pvr-content {
    padding: 1.1rem 1.2rem 4rem;
  }

  .pvr-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #cfcfcf;
  }

  .pvr-toolbar h2 {
    margin: 0;
    color: #555;
    font-size: 1.3rem;
    font-weight: 400;
  }

  button {
    border: 0;
    background: #9e9e9e;
    color: white;
    font: inherit;
    padding: 0.45rem 0.7rem;
  }

  button:disabled {
    opacity: 0.45;
  }

  .pvr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .pvr-list,
  .broadcast-list {
    display: grid;
    gap: 0.5rem;
  }

  .pvr-card,
  .recording-row,
  .broadcast-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: stretch;
    min-height: 68px;
    background: #f8f8f8;
    box-shadow: 0 1px 3px rgb(0 0 0 / 14%);
  }

  .pvr-card.active,
  .broadcast-row.active {
    outline: 2px solid #4bb3e8;
  }

  .broadcast-row.airing {
    border-left: 4px solid #4bb3e8;
  }

  .broadcast-row.aired {
    opacity: 0.7;
  }

  .broadcast-row.hasTimer {
    border-right: 4px solid #8c8c8c;
  }

  .pvr-card__main,
  .recording-row {
    color: inherit;
    text-decoration: none;
  }

  .pvr-card__main {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    min-width: 0;
  }

  .recording-row {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 118px;
    align-items: stretch;
  }

  .broadcast-panel {
    margin-top: 1rem;
  }

  .broadcast-panel h3 {
    margin: 0 0 0.75rem;
    color: #555;
    font-size: 1.1rem;
    font-weight: 400;
  }

  .broadcast-row {
    grid-template-columns: 9rem minmax(0, 1fr) auto auto auto;
  }

  .broadcast-time {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0.55rem 0.7rem;
    color: #777;
    font-size: 0.82rem;
  }

  .thumb {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    background: #c8c8c8;
    overflow: hidden;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-placeholder {
    color: #aaa;
    font-weight: 700;
  }

  .pvr-card__text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: 0.55rem 0.7rem;
  }

  .pvr-card__text strong,
  .pvr-card__text span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pvr-card__text span {
    color: #777;
    font-size: 0.88rem;
  }

  .pvr-play {
    min-width: 72px;
  }

  .recording-body {
    display: grid;
    gap: 0.45rem;
    min-width: 0;
    padding: 0.75rem 0.9rem;
  }

  .recording-title {
    color: #444;
  }

  .recording-title span {
    color: #777;
  }

  .recording-date,
  .recording-plot {
    color: #777;
    font-size: 0.88rem;
    line-height: 1.35;
  }

  .recording-plot {
    color: #555;
  }

  .entity-progress {
    height: 4px;
    background: #d0d0d0;
  }

  .current-progress {
    height: 100%;
    background: #42a5dc;
  }

  .empty-state,
  .pvr-error {
    margin: 0;
    padding: 1rem;
    background: #eee;
    color: #666;
  }

  .pvr-error {
    margin-bottom: 1rem;
    color: #8a2b2b;
  }

  @media (max-width: 760px) {
    .classic-page {
      grid-template-columns: 1fr;
    }

    .classic-subnav {
      flex-direction: row;
      flex-wrap: wrap;
      padding: 1rem;
    }

    .subnav-kicker {
      width: 100%;
    }
  }
</style>
