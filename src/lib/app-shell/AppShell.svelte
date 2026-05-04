<script lang="ts">
  import type {
    AppShellCallbacks,
    AppShellDestinationState,
    AppShellDrawerState,
    AppShellNavigationItem,
    AppShellPlayerActions,
    AppShellPlayerSnapshot,
    AppShellRouteIdentity
  } from './appShellTypes';
  import chorusFanartUrl from '$lib/assets/chorus2/tweeter.jpg';
  import chorusLogoUrl from '$lib/assets/chorus2/logo.png';
  import chorusThumbnailUrl from '$lib/assets/chorus2/thumbnail_default.png';

  interface Props {
    routeIdentity?: AppShellRouteIdentity;
    navigationItems?: readonly AppShellNavigationItem[];
    stageLabel?: string;
    stageArtUrl?: string;
    player?: AppShellPlayerSnapshot;
    playerActions?: AppShellPlayerActions;
    drawer?: AppShellDrawerState;
    destination?: AppShellDestinationState;
    callbacks?: AppShellCallbacks;
    logoHref?: string;
    children?: import('svelte').Snippet;
    drawerContent?: import('svelte').Snippet;
    playerContent?: import('svelte').Snippet;
    localRuntime?: import('svelte').Snippet;
  }

  const emptyPlayer: AppShellPlayerSnapshot = {
    title: 'Nothing playing',
    subtitle: 'Waiting for Kodi',
    currentTime: '--:--',
    totalTime: '--:--',
    progressPercent: 0,
    thumbnailUrl: chorusThumbnailUrl,
    disabledReason: 'Playback state is empty.'
  };

  let {
    routeIdentity = { kind: 'primary', route: { kind: 'home' } },
    navigationItems = [],
    stageLabel = 'Kodi dashboard',
    stageArtUrl = chorusFanartUrl,
    player = emptyPlayer,
    playerActions = {},
    drawer = { label: 'Current playlist', mediaMode: 'audio' },
    destination = { mode: 'kodi', mediaMode: 'audio' },
    callbacks = {},
    logoHref = '/',
    children,
    drawerContent,
    playerContent,
    localRuntime
  }: Props = $props();

  const safeNavigationItems = $derived(
    navigationItems
      .filter((item) => item && typeof item.href === 'string' && item.href.trim())
      .map((item) => ({
        ...item,
        title: safeText(item.title, item.id),
        label: safeText(item.label, item.title)
      }))
  );
  const safeStageLabel = $derived(safeText(stageLabel, 'Kodi dashboard'));
  const safeDrawerLabel = $derived(safeText(drawer.label, 'Current playlist'));
  const safePlayer = $derived(normalizePlayer(player));
  const activeRouteKind = $derived(
    routeIdentity.kind === 'primary' ? routeIdentity.route.kind : routeIdentity.kind
  );

  function invoke(action: (() => void | Promise<void>) | undefined): void {
    if (!action) {
      return;
    }

    try {
      void Promise.resolve(action()).catch(() => {
        // Player command diagnostics are owned by the dispatch snapshot rendered by App composition.
      });
    } catch {
      // Keep shell controls safe even when an injected action throws synchronously.
    }
  }

  function invokeDestinationMode(mode: AppShellDestinationState['mode']): void {
    invoke(() => callbacks.onDestinationModeChange?.(mode));
  }

  function safeText(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function normalizePlayer(value: AppShellPlayerSnapshot | undefined): AppShellPlayerSnapshot {
    const input = value ?? emptyPlayer;
    const progress =
      typeof input.progressPercent === 'number' && Number.isFinite(input.progressPercent)
        ? Math.min(100, Math.max(0, input.progressPercent))
        : 0;

    return {
      title: safeText(input.title, emptyPlayer.title),
      subtitle: safeText(input.subtitle, emptyPlayer.subtitle),
      currentTime: safeText(input.currentTime, emptyPlayer.currentTime),
      totalTime: safeText(input.totalTime, emptyPlayer.totalTime),
      progressPercent: progress,
      thumbnailUrl: safeText(input.thumbnailUrl, chorusThumbnailUrl),
      disabledReason: input.disabledReason
    };
  }
</script>

<div
  class="chorus-app"
  aria-label="Chorus media controller"
  data-route-kind={activeRouteKind}
  style={`--c2-stage-art-url: url('${stageArtUrl || chorusFanartUrl}'); --c2-thumb-url: url('${safePlayer.thumbnailUrl || chorusThumbnailUrl}')`}
>
  <header class="c2-topbar" aria-label="Chorus header">
    <a class="c2-logo" href={logoHref} aria-label="Kodi home">
      <img src={chorusLogoUrl} alt="" />
    </a>

    <label
      class="c2-search"
      title="Search is deferred to the search route owner for the packaged shell."
    >
      <span class="mdi mdi-action-search" aria-hidden="true"></span>
      <span class="visually-hidden">Search Kodi</span>
      <input
        type="search"
        placeholder="Search deferred"
        aria-label="Search Kodi deferred"
        readonly
      />
    </label>

    <div class="c2-destination-tabs" aria-label="Playback destination">
      <button
        type="button"
        class:active={destination.mode === 'kodi'}
        aria-label="Kodi playback destination selected"
        aria-disabled="true"
        disabled
      >
        <span class="c2-kodi-mark" aria-hidden="true">✣</span>
        Kodi
      </button>
      <button
        type="button"
        class:active={destination.mode === 'local'}
        title="Local playback destination is deferred."
        onclick={() => invokeDestinationMode('local')}
        disabled
      >
        <span class="mdi mdi-av-volume-up" aria-hidden="true"></span>
        Local
      </button>
      <button type="button" aria-label="Playlist menu" title="Playlist menu is deferred." disabled>
        <span class="mdi mdi-navigation-more-vert" aria-hidden="true"></span>
      </button>
      <button
        type="button"
        aria-label="Collapse playlist"
        title="Playlist collapse is deferred."
        disabled
      >
        <span class="mdi mdi-hardware-keyboard-arrow-right" aria-hidden="true"></span>
      </button>
    </div>
  </header>

  <aside class="c2-rail" aria-label="Primary navigation">
    <nav aria-label="Kodi sections">
      {#each safeNavigationItems as item}
        <a
          href={item.href}
          class:active={item.isActive}
          aria-current={item.isActive ? 'page' : undefined}
          title={item.title}
        >
          <span class={`mdi ${item.icon}`} aria-hidden="true"></span>
          <span class="visually-hidden">{item.label}</span>
        </a>
      {/each}
    </nav>
  </aside>

  <main class="c2-stage" aria-label={safeStageLabel}>
    <div class="c2-stage-art" aria-hidden="true"></div>
    <div class="c2-stage-content">
      {@render children?.()}
    </div>
  </main>

  <aside
    class="c2-playlist"
    aria-label={safeDrawerLabel}
    data-collapsed={drawer.collapsed ? 'true' : 'false'}
  >
    <div class="c2-media-tabs" role="tablist" aria-label="Playlist media type">
      <button
        type="button"
        role="tab"
        class:active={drawer.mediaMode !== 'video'}
        aria-selected={drawer.mediaMode !== 'video'}
        disabled>Audio</button
      >
      <button
        type="button"
        role="tab"
        class:active={drawer.mediaMode === 'video'}
        aria-selected={drawer.mediaMode === 'video'}
        title="Video playlists are deferred."
        disabled>Video</button
      >
    </div>

    {#if drawerContent}
      {@render drawerContent()}
    {:else}
      <div class="c2-playlist-menu" role="menu" aria-label="Playlist menu">
        <button type="button" role="menuitem" class="selected" aria-disabled="true" disabled>
          Current playlist
        </button>
        <button type="button" role="menuitem" disabled>Clear playlist</button>
        <button type="button" role="menuitem" title="Playlist refresh is deferred." disabled>
          Refresh playlist
        </button>
        <button type="button" role="menuitem" title="Party mode is deferred." disabled>
          Party mode
        </button>
        <button type="button" role="menuitem" class="selected" aria-disabled="true" disabled>
          Kodi
        </button>
        <button type="button" role="menuitem" title="Saving Kodi playlists is deferred." disabled>
          Save Kodi playlist
        </button>
      </div>
    {/if}
  </aside>

  {#if playerContent}
    {@render playerContent()}
  {:else}
    <footer class="c2-player" aria-label="Playback controls">
      <div class="c2-player-controls">
        <button type="button" aria-label="Previous" onclick={() => invoke(playerActions.previous)}>
          <span class="mdi mdi-av-skip-previous" aria-hidden="true"></span>
        </button>
        <button
          type="button"
          aria-label="Play or pause"
          onclick={() => invoke(playerActions.playPause)}
        >
          <span class="mdi mdi-av-play-arrow" aria-hidden="true"></span>
        </button>
        <button type="button" aria-label="Next" onclick={() => invoke(playerActions.next)}>
          <span class="mdi mdi-av-skip-next" aria-hidden="true"></span>
        </button>
      </div>
      <div class="c2-thumb" aria-hidden="true"></div>
      <div class="c2-nowline">
        <strong>{safePlayer.title}</strong>
        <span>{safePlayer.subtitle}</span>
        <div class="c2-progress" aria-hidden="true">
          <span style={`width: ${safePlayer.progressPercent}%`}></span>
        </div>
      </div>
      <div class="c2-time" aria-label="Playback time">
        <span>{safePlayer.currentTime}</span>
        <span>{safePlayer.totalTime}</span>
      </div>
      <div class="c2-player-actions">
        <button
          type="button"
          aria-label="Toggle mute"
          onclick={() => invoke(playerActions.toggleMute)}
        >
          <span class="mdi mdi-av-volume-up" aria-hidden="true"></span>
        </button>
        <button
          type="button"
          aria-label="Shuffle"
          title="Shuffle is deferred for package proof."
          disabled
        >
          <span class="mdi mdi-av-shuffle" aria-hidden="true"></span>
        </button>
        <button
          type="button"
          aria-label="Fullscreen"
          onclick={() => invoke(playerActions.fullscreen)}
        >
          <span class="mdi mdi-navigation-fullscreen" aria-hidden="true"></span>
        </button>
        <button
          type="button"
          aria-label="More"
          title="More playback actions are deferred."
          disabled
        >
          <span class="mdi mdi-navigation-more-vert" aria-hidden="true"></span>
        </button>
      </div>
    </footer>
  {/if}

  {@render localRuntime?.()}
</div>

<style>
  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('../assets/chorus2/fonts/opensans/opensans-light-webfont.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('../assets/chorus2/fonts/opensans/opensans-regular-webfont.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('../assets/chorus2/fonts/opensans/opensans-semibold-webfont.woff2') format('woff2');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Material-Design-Icons';
    src: url('../assets/chorus2/fonts/material/Material-Design-Icons.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }

  .chorus-app {
    --c2-blue: #4db3e6;
    --c2-header: #1d2021;
    --c2-dark: #181b1c;
    --c2-playlist: #2f3335;
    --c2-player: #17191a;
    position: relative;
    display: block;
    width: 100%;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
    padding: 0;
    color: #333;
    background: var(--c2-dark);
    font-family: 'Open Sans Chorus', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .mdi {
    font-family: 'Material-Design-Icons';
    font-style: normal;
    font-weight: 400;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .mdi-action-extension::before {
    content: '\e628';
  }
  .mdi-action-help::before {
    content: '\e633';
  }
  .mdi-action-search::before {
    content: '\e67f';
  }
  .mdi-action-settings::before {
    content: '\e680';
  }
  .mdi-action-thumb-up::before {
    content: '\e6a4';
  }
  .mdi-av-my-library-music::before {
    content: '\e6b3';
  }
  .mdi-av-play-arrow::before {
    content: '\e6b9';
  }
  .mdi-av-playlist-add::before {
    content: '\e6bc';
  }
  .mdi-av-shuffle::before {
    content: '\e6c5';
  }
  .mdi-av-skip-next::before {
    content: '\e6c6';
  }
  .mdi-av-skip-previous::before {
    content: '\e6c7';
  }
  .mdi-av-volume-up::before {
    content: '\e6d2';
  }
  .mdi-editor-format-list-bulleted::before {
    content: '\e783';
  }
  .mdi-hardware-keyboard-arrow-right::before {
    content: '\e7b6';
  }
  .mdi-hardware-tv::before {
    content: '\e7d0';
  }
  .mdi-image-movie-creation::before {
    content: '\e833';
  }
  .mdi-navigation-fullscreen::before {
    content: '\e89f';
  }
  .mdi-navigation-more-vert::before {
    content: '\e8a3';
  }

  .c2-topbar {
    position: absolute;
    inset: 0 0 auto;
    z-index: 20;
    height: 50px;
    background: var(--c2-header);
  }

  .c2-logo {
    position: absolute;
    inset: 0 auto auto 0;
    display: grid;
    place-items: center;
    width: 50px;
    height: 50px;
    overflow: hidden;
    text-decoration: none;
  }

  .c2-logo img {
    display: block;
    width: 181px;
    max-width: none;
    height: 50px;
    filter: brightness(0) saturate(100%) invert(62%) sepia(67%) saturate(1543%) hue-rotate(165deg)
      brightness(96%) contrast(88%);
    transform: translateX(-128px);
  }

  .c2-search {
    position: absolute;
    top: 0;
    right: 300px;
    display: grid;
    grid-template-columns: 42px 1fr;
    align-items: center;
    width: 205px;
    height: 50px;
    color: #565b5f;
    background: #f0f0f0;
  }

  .c2-search .mdi {
    justify-self: center;
    font-size: 20px;
  }

  .c2-search input {
    width: 100%;
    height: 50px;
    padding: 0;
    color: #333;
    background: transparent;
    border: 0;
    outline: 0;
  }

  .c2-destination-tabs {
    position: absolute;
    top: 0;
    right: 0;
    display: grid;
    grid-template-columns: 95px 120px 42px 43px;
    width: 300px;
    height: 50px;
  }

  .c2-destination-tabs button,
  .c2-media-tabs button,
  .c2-playlist-menu button,
  .c2-player button {
    font: inherit;
    border: 0;
    border-radius: 0;
    cursor: pointer;
  }

  .c2-destination-tabs button:disabled,
  .c2-media-tabs button:disabled,
  .c2-playlist-menu button:disabled,
  .c2-player button:disabled {
    cursor: default;
  }

  .c2-destination-tabs button {
    display: inline-grid;
    grid-auto-flow: column;
    gap: 7px;
    align-items: center;
    justify-content: center;
    min-width: 0;
    color: #c8c8c8;
    background: #292d2f;
  }

  .c2-destination-tabs button.active {
    color: var(--c2-blue);
    background: #1f2223;
  }

  .c2-destination-tabs button:nth-child(3),
  .c2-destination-tabs button:nth-child(4) {
    color: #888;
    font-size: 20px;
  }

  .c2-kodi-mark {
    color: var(--c2-blue);
    font-size: 16px;
    line-height: 1;
  }

  .c2-rail {
    position: absolute;
    top: 50px;
    bottom: 60px;
    left: 0;
    z-index: 10;
    width: 50px;
    background: #fff;
    box-shadow: inset -1px 0 0 rgb(0 0 0 / 0.05);
  }

  .c2-rail nav {
    display: grid;
    align-content: start;
    padding-top: 10px;
  }

  .c2-rail a {
    position: relative;
    display: grid;
    place-items: center;
    width: 50px;
    height: 39px;
    color: #303336;
    font-size: 23px;
    text-decoration: none;
  }

  .c2-rail a.active,
  .c2-rail a:hover {
    color: #fff;
    background: var(--c2-blue);
  }

  .c2-rail a.active::after,
  .c2-rail a:hover::after {
    position: absolute;
    left: 50px;
    top: 0;
    height: 39px;
    padding: 0 22px 0 19px;
    color: #fff;
    background: var(--c2-blue);
    content: attr(title);
    font-size: 15px;
    font-weight: 600;
    line-height: 39px;
    white-space: nowrap;
  }

  .c2-stage {
    position: absolute;
    top: 50px;
    right: 300px;
    bottom: 60px;
    left: 50px;
    overflow: auto;
    background: #1a1c1d;
  }

  .c2-stage-art {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgb(20 22 23 / 0.36), rgb(20 22 23 / 0.18) 52%, rgb(20 22 23 / 0.04)),
      var(--c2-stage-art-url) center bottom / cover no-repeat;
  }

  .c2-stage-content {
    position: relative;
    z-index: 1;
    min-height: 100%;
  }

  .c2-stage-content:empty {
    display: none;
  }

  .c2-playlist {
    position: absolute;
    top: 50px;
    right: 0;
    bottom: 60px;
    z-index: 8;
    width: 300px;
    background: var(--c2-playlist);
  }

  .c2-media-tabs {
    display: grid;
    grid-template-columns: 70px 70px 1fr;
    height: 28px;
    background: #242728;
  }

  .c2-media-tabs button {
    color: #888;
    background: #3d4143;
    font-size: 12px;
    text-align: center;
  }

  .c2-media-tabs button.active {
    color: #fff;
    background: #4d5153;
  }

  .c2-playlist-menu {
    position: absolute;
    top: -17px;
    right: 45px;
    z-index: 25;
    display: grid;
    width: 165px;
    padding: 0;
    background: #f4f4f4;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
  }

  .c2-playlist-menu button {
    height: 32px;
    padding: 0 13px;
    color: #858585;
    background: #f4f4f4;
    font-size: 13px;
    text-align: left;
  }

  .c2-playlist-menu button.selected {
    background: #d8d8d8;
  }

  .c2-playlist-menu button:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .c2-player {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 30;
    display: grid;
    grid-template-columns: 170px 70px minmax(0, 1fr) 56px 305px;
    height: 60px;
    color: #cfcfcf;
    background: var(--c2-player);
  }

  .c2-player-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: #202324;
  }

  .c2-player button {
    display: grid;
    place-items: center;
    min-width: 0;
    color: #8f9395;
    background: transparent;
  }

  .c2-player button:hover:not(:disabled) {
    color: #fff;
    background: #35393a;
  }

  .c2-player button:disabled {
    opacity: 0.55;
  }

  .c2-player-controls button {
    font-size: 32px;
  }

  .c2-player-controls button:nth-child(2) {
    font-size: 44px;
  }

  .c2-thumb {
    background:
      linear-gradient(rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.14)),
      var(--c2-thumb-url) center / cover no-repeat;
  }

  .c2-nowline {
    position: relative;
    display: grid;
    align-content: center;
    gap: 2px;
    min-width: 0;
    padding: 0 12px;
    background: #191c1d;
  }

  .c2-nowline strong,
  .c2-nowline span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .c2-nowline strong {
    color: #e2e2e2;
    font-size: 12px;
    font-weight: 600;
  }

  .c2-nowline span {
    color: #8e9498;
    font-size: 11px;
  }

  .c2-progress {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: #2d3032;
  }

  .c2-progress span {
    display: block;
    height: 100%;
    background: var(--c2-blue);
  }

  .c2-time {
    display: grid;
    align-content: center;
    justify-items: end;
    gap: 2px;
    padding-right: 9px;
    color: #fff;
    background: #191c1d;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .c2-player-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #3d4143;
  }

  .c2-player-actions button {
    font-size: 24px;
  }

  @media (max-width: 760px) {
    .c2-search {
      right: 0;
      width: 190px;
    }

    .c2-destination-tabs,
    .c2-playlist,
    .c2-playlist-menu {
      display: none;
    }

    .c2-stage {
      right: 0;
    }

    .c2-player {
      grid-template-columns: 150px 60px minmax(0, 1fr);
    }

    .c2-time,
    .c2-player-actions {
      display: none;
    }
  }

  @media (max-height: 420px) {
    .c2-rail {
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      scrollbar-width: none;
    }

    .c2-rail::-webkit-scrollbar {
      display: none;
    }

    .c2-rail nav {
      padding-block: 0;
    }

    .c2-rail a:hover::after,
    .c2-rail a.active::after {
      display: none;
    }
  }
</style>
