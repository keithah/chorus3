<script lang="ts">
  import './pvrPageClassic.css';
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
  import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import { createIncrementalVisibility } from '$components/incrementalVisibility.svelte';
  import PvrBroadcastList from './PvrBroadcastList.svelte';

  export interface PvrPageDispatch {
    refreshChannels(group: PvrChannelGroup): Promise<void> | void;
    refreshRecordings(): Promise<void> | void;
    refreshBroadcasts?(channelid: number): Promise<boolean | void> | boolean | void;
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
  let globalEpgRunId = 0;
  let pendingAction = $state<string | null>(null);
  let localStatusText = $state<string | null>(null);
  const GLOBAL_EPG_BROADCAST_LIMIT = 24;
  const channelVisibility = createIncrementalVisibility(240);
  const guideChannelVisibility = createIncrementalVisibility(50);
  const selectedBroadcastVisibility = createIncrementalVisibility(150);
  const recordingVisibility = createIncrementalVisibility(100);
  const mode = $derived(resolveMode(route));
  const channels = $derived(mode === 'radio' ? snapshot.radioChannels : snapshot.tvChannels);
  const visibleChannels = $derived(channelVisibility.visibleItems(channels));
  const visibleGuideChannels = $derived(guideChannelVisibility.visibleItems(channels));
  const channelStatus = $derived(mode === 'radio' ? snapshot.radioStatus : snapshot.tvStatus);
  const selectedChannel = $derived(resolveSelectedChannel(route, channels));
  const selectedBroadcasts = $derived(
    selectedChannel ? (snapshot.broadcastsByChannelId[selectedChannel.channelid] ?? []) : []
  );
  const visibleSelectedBroadcasts = $derived(
    selectedBroadcastVisibility.visibleItems(selectedBroadcasts)
  );
  const visibleRecordings = $derived(recordingVisibility.visibleItems(snapshot.recordings));
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
      if (snapshot.recordingsStatus === 'idle') {
        void dispatch.refreshRecordings();
      }
      return;
    }

    if (channelStatus === 'idle') {
      void dispatch.refreshChannels(activeGroup);
    }
  });

  $effect(() => {
    if (route.kind !== 'pvrEpg') {
      lastGlobalEpgKey = '';
      globalEpgRunId += 1;
      return;
    }

    const key = visibleGuideChannels.map((channel) => channel.channelid).join(',');
    if (!key || key === lastGlobalEpgKey) {
      return;
    }

    lastGlobalEpgKey = key;
    void refreshBroadcastsForChannels(visibleGuideChannels);
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
    await runAction(
      `play:channel:${channel.channelid}`,
      `Playing ${channel.label}.`,
      `Could not play ${channel.label}.`,
      () => playerDispatch.playChannelItem?.({ channelid: channel.channelid })
    );
  }

  async function refreshGlobalEpg(): Promise<void> {
    await dispatch.refreshChannels('alltv');
    await refreshBroadcastsForChannels(visibleGuideChannels);
  }

  async function refreshBroadcastsForChannels(
    items: readonly PvrChannelSnapshot[],
    concurrency = 6
  ): Promise<void> {
    const refreshBroadcasts = dispatch.refreshBroadcasts;
    if (!refreshBroadcasts || items.length === 0) {
      return;
    }

    const runId = ++globalEpgRunId;
    let nextIndex = 0;
    const workerCount = Math.min(Math.max(1, concurrency), items.length);
    let failed = 0;
    const workers = Array.from({ length: workerCount }, async () => {
      while (runId === globalEpgRunId) {
        const channel = items[nextIndex];
        nextIndex += 1;
        if (!channel) {
          return;
        }
        try {
          const result = await refreshBroadcasts(channel.channelid);
          if (result === false) {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
      }
    });

    await Promise.allSettled(workers);
    if (runId === globalEpgRunId && failed > 0) {
      localStatusText = `Updated TV guide with ${failed} channel${failed === 1 ? '' : 's'} failing.`;
    }
  }

  function broadcastsFor(channel: PvrChannelSnapshot): readonly PvrBroadcastSnapshot[] {
    return snapshot.broadcastsByChannelId[channel.channelid] ?? [];
  }

  function visibleGuideBroadcasts(channel: PvrChannelSnapshot): readonly PvrBroadcastSnapshot[] {
    return broadcastsFor(channel).slice(0, GLOBAL_EPG_BROADCAST_LIMIT);
  }

  async function toggleRecording(channel: PvrChannelSnapshot): Promise<void> {
    await runAction(
      `record:channel:${channel.channelid}`,
      `${channel.isrecording ? 'Stopping recording for' : 'Recording'} ${channel.label}.`,
      `${channel.isrecording ? 'Could not stop recording for' : 'Could not record'} ${channel.label}.`,
      () => dispatch.toggleChannelRecording?.(channel.channelid)
    );
  }

  async function toggleTimer(broadcast: PvrBroadcastSnapshot): Promise<void> {
    await runAction(
      `timer:broadcast:${broadcast.broadcastid}`,
      `${broadcast.hastimer || broadcast.hastimerrule ? 'Updating timer for' : 'Adding timer for'} ${broadcast.title ?? broadcast.label ?? 'broadcast'}.`,
      `Could not update timer for ${broadcast.title ?? broadcast.label ?? 'broadcast'}.`,
      async () => {
        await dispatch.toggleBroadcastTimer?.(broadcast.broadcastid, false);
        if (selectedChannel) {
          await dispatch.refreshBroadcasts?.(selectedChannel.channelid);
        }
      }
    );
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

    await runAction(
      `play:recording:${recording.recordingid}`,
      `Playing ${recording.title ?? recording.label ?? 'recording'}.`,
      `Could not play ${recording.title ?? recording.label ?? 'recording'}.`,
      () =>
        playerDispatch.playFileItem?.({
          file: recording.file!,
          mediaKind: recording.radio ? 'audio' : 'video'
        })
    );
  }

  async function runAction(
    key: string,
    successCopy: string,
    failureCopy: string,
    action: () => Promise<void> | void
  ): Promise<void> {
    if (pendingAction) {
      return;
    }

    pendingAction = key;
    localStatusText = successCopy.replace(/\.$/, '...');
    try {
      await action();
      localStatusText = successCopy;
    } catch (error) {
      localStatusText = `${failureCopy} ${pvrActionErrorCopy(error)}`;
    } finally {
      pendingAction = null;
    }
  }

  function pvrActionErrorCopy(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (/PVR\.Record|JSON-RPC error -32100|Failed to execute method/i.test(message)) {
      return 'Kodi rejected the recording command. Check that the PVR backend allows recording on this channel.';
    }

    return message.trim() || 'PVR action failed.';
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
    {#if localStatusText}
      <p class="pvr-status" role="status" aria-live="polite">{localStatusText}</p>
    {/if}

    {#if isGlobalEpgPage}
      {#if channelStatus === 'loading' && channels.length === 0}
        <p class="empty-state">Loading EPG...</p>
      {:else if channels.length === 0}
        <p class="empty-state">No TV channels found.</p>
      {:else}
        <div class="broadcast-list programmes global-epg" aria-label="TV Guide">
          {#each visibleGuideChannels as channel (channel.channelid)}
            {@const broadcasts = broadcastsFor(channel)}
            {@const visibleBroadcasts = visibleGuideBroadcasts(channel)}
            <section class="global-epg-channel" aria-labelledby={`pvr-guide-${channel.channelid}`}>
              <h3 id={`pvr-guide-${channel.channelid}`}>{channel.label}</h3>
              {#if broadcasts.length === 0}
                <p class="empty-state">No broadcasts found.</p>
              {:else}
                {#each visibleBroadcasts as broadcast (broadcast.broadcastid)}
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
                {#if broadcasts.length > visibleBroadcasts.length}
                  <p class="empty-state">
                    Showing {visibleBroadcasts.length} of {broadcasts.length} broadcasts.
                  </p>
                {/if}
              {/if}
            </section>
          {/each}
        </div>
        {#if guideChannelVisibility.hasMore(channels.length)}
          <button type="button" class="pvr-show-more" onclick={guideChannelVisibility.showMore}>
            Show more channels
          </button>
        {/if}
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
        <PvrBroadcastList
          broadcasts={selectedBroadcasts}
          visibleBroadcasts={visibleSelectedBroadcasts}
          ariaLabel={`${selectedChannel.label} EPG`}
          hasMore={selectedBroadcastVisibility.hasMore(selectedBroadcasts.length)}
          showMore={selectedBroadcastVisibility.showMore}
          play={playSelectedBroadcast}
          record={recordSelectedBroadcast}
          {toggleTimer}
          {formatClock}
          cardRows
        />
      {/if}
    {:else if isChannelPage}
      {#if channelStatus === 'loading' && channels.length === 0}
        <p class="empty-state">Loading channels...</p>
      {:else if channels.length === 0}
        <p class="empty-state">No {mode === 'radio' ? 'radio stations' : 'TV channels'} found.</p>
      {:else}
        <div class="pvr-grid" aria-label={heading}>
          {#each visibleChannels as channel (channel.channelid)}
            {@const channelThumb = optionalKodiImageUrl(channel.thumbnail)}
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
                  {#if channelThumb}
                    <img src={channelThumb} alt="" loading="lazy" decoding="async" />
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
        {#if channelVisibility.hasMore(channels.length)}
          <button type="button" class="pvr-show-more" onclick={channelVisibility.showMore}>
            Show more channels
          </button>
        {/if}
        {#if selectedChannel}
          <section class="broadcast-panel" aria-label={`${selectedChannel.label} broadcasts`}>
            <h3>{selectedChannel.label}</h3>
            <PvrBroadcastList
              broadcasts={selectedBroadcasts}
              visibleBroadcasts={visibleSelectedBroadcasts}
              ariaLabel={`${selectedChannel.label} broadcasts`}
              hasMore={selectedBroadcastVisibility.hasMore(selectedBroadcasts.length)}
              showMore={selectedBroadcastVisibility.showMore}
              play={playSelectedBroadcast}
              record={recordSelectedBroadcast}
              {toggleTimer}
            />
          </section>
        {/if}
      {/if}
    {:else if snapshot.recordingsStatus === 'loading' && snapshot.recordings.length === 0}
      <p class="empty-state">Loading recordings...</p>
    {:else if snapshot.recordings.length === 0}
      <p class="empty-state">No recordings found.</p>
    {:else}
      <div class="pvr-list" aria-label="Recordings">
        {#each visibleRecordings as recording (recording.recordingid)}
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
                  <div
                    class="current-progress"
                    style={`transform: scaleX(${recording.progress / 100})`}
                  ></div>
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
      {#if recordingVisibility.hasMore(snapshot.recordings.length)}
        <button type="button" class="pvr-show-more" onclick={recordingVisibility.showMore}>
          Show more recordings
        </button>
      {/if}
    {/if}
  </section>
</div>
