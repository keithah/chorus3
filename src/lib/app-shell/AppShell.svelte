<script lang="ts">
  import type {
    AppShellCallbacks,
    AppShellDestinationState,
    AppShellDrawerState,
    AppShellNavigationItem,
    AppShellNavigationSubmenuGroup,
    AppShellNavigationSubmenuItem,
    AppShellPlayerActions,
    AppShellPlayerSnapshot,
    AppShellRouteIdentity
  } from './appShellTypes';
  import PlaylistDrawer from './PlaylistDrawer.svelte';
  import chorusFanartUrl from '$lib/assets/classic/tweeter.jpg';
  import chorusLogoUrl from '$lib/assets/classic/logo.png';
  import chorusThumbnailUrl from '$lib/assets/classic/thumbnail_default.png';

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
    isPlaying: false,
    isShuffled: false,
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
        label: safeText(item.label, item.title),
        submenuGroups: normalizeSubmenuGroups(item.submenuGroups ?? [])
      }))
  );
  const safeStageLabel = $derived(safeText(stageLabel, 'Kodi dashboard'));
  const safePlayer = $derived(normalizePlayer(player));
  const activeRouteKind = $derived(
    routeIdentity.kind === 'primary' ? routeIdentity.route.kind : routeIdentity.kind
  );
  let localDrawerCollapsed = $state(false);
  let shellSearchValue = $state('');
  let playerMoreOpen = $state(false);
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (drawer.collapsed !== undefined) {
      localDrawerCollapsed = Boolean(drawer.collapsed);
    }
  });

  const isDrawerCollapsed = $derived(drawer.collapsed ?? localDrawerCollapsed);
  const drawerLayoutState = $derived(isDrawerCollapsed ? 'collapsed' : 'expanded');
  const hasPlayerMoreActions = $derived(Boolean(playerActions.stop || playerActions.repeat));
  const shellCallbacks = $derived({
    ...callbacks,
    onPlaylistCollapseToggle: (collapsed: boolean) => {
      localDrawerCollapsed = collapsed;
      invoke(() => callbacks.onPlaylistCollapseToggle?.(collapsed));
    }
  });

  $effect(() => {
    if (!hasPlayerMoreActions) {
      playerMoreOpen = false;
    }
  });

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

  function invokePlayerMore(action: (() => void | Promise<void>) | undefined): void {
    playerMoreOpen = false;
    invoke(action);
  }

  function scheduleSearchNavigation(): void {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const query = shellSearchValue.trim();

    if (!query) {
      return;
    }

    searchDebounce = setTimeout(() => {
      submitShellSearch();
    }, 2000);
  }

  function submitShellSearch(): void {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
      searchDebounce = null;
    }

    const query = shellSearchValue.trim();

    if (!query) {
      invoke(shellCallbacks.onSearchFocus);
      return;
    }

    invoke(() => shellCallbacks.onSearchSubmit?.(query));
  }

  function handleSearchSubmit(event: SubmitEvent): void {
    event.preventDefault();
    submitShellSearch();
  }

  function safeText(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function normalizeSubmenuGroups(
    groups: readonly AppShellNavigationSubmenuGroup[]
  ): readonly AppShellNavigationSubmenuGroup[] {
    return groups
      .map((group) => ({
        ...group,
        label: safeText(group.label, group.id),
        items: normalizeSubmenuItems(group.items ?? [])
      }))
      .filter((group) => group.items.length > 0);
  }

  function normalizeSubmenuItems(
    items: readonly AppShellNavigationSubmenuItem[]
  ): readonly AppShellNavigationSubmenuItem[] {
    return items
      .filter((item) => item && typeof item.href === 'string' && item.href.trim())
      .map((item) => ({
        ...item,
        title: safeText(item.title, item.id),
        label: safeText(item.label, safeText(item.title, item.id))
      }));
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
      isPlaying: input.isPlaying === true,
      isShuffled: input.isShuffled === true,
      thumbnailUrl: safeText(input.thumbnailUrl, chorusThumbnailUrl),
      disabledReason: input.disabledReason
    };
  }
</script>

<div
  class="chorus-app"
  class:playlist-collapsed={isDrawerCollapsed}
  aria-label="Chorus media controller"
  data-route-kind={activeRouteKind}
  data-playlist-layout={drawerLayoutState}
  style={`--classic-stage-art-url: url('${stageArtUrl || chorusFanartUrl}'); --classic-thumb-url: url('${safePlayer.thumbnailUrl || chorusThumbnailUrl}'); --classic-playlist-width: ${isDrawerCollapsed ? '43px' : '300px'}; --classic-search-right: ${isDrawerCollapsed ? '43px' : '300px'}`}
>
  <header class="classic-topbar" aria-label="Chorus header">
    <a class="classic-logo" href={logoHref} aria-label="Kodi home">
      <img src={chorusLogoUrl} alt="" />
    </a>

    <form
      class="classic-search"
      role="search"
      aria-label="Search Kodi"
      onsubmit={handleSearchSubmit}
    >
      <span class="mdi mdi-action-search" aria-hidden="true"></span>
      <label class="visually-hidden" for="chorus-shell-search">Search Kodi</label>
      <input
        id="chorus-shell-search"
        type="search"
        placeholder="Search"
        aria-label="Search Kodi"
        bind:value={shellSearchValue}
        onfocus={() => invoke(shellCallbacks.onSearchFocus)}
        oninput={scheduleSearchNavigation}
      />
    </form>
  </header>

  <aside class="classic-rail" aria-label="Primary navigation">
    <nav aria-label="Kodi sections">
      {#each safeNavigationItems as item}
        <div class="classic-rail-item" class:active={item.isActive}>
          <a
            class="classic-rail-primary"
            href={item.href}
            class:active={item.isActive}
            aria-current={item.isActive ? 'page' : undefined}
            title={item.title}
          >
            <span class={`mdi ${item.icon}`} aria-hidden="true"></span>
            <span class="visually-hidden">{item.label}</span>
          </a>
          {#if item.submenuGroups.length > 0}
            <div class="classic-submenu" role="menu" aria-label={`${item.label} sections`}>
              {#each item.submenuGroups as group}
                <div class="classic-submenu-group" role="group" aria-label={group.label}>
                  <div class="classic-submenu-heading">{group.label}</div>
                  {#each group.items as submenuItem}
                    <a
                      class="classic-submenu-link"
                      class:active={submenuItem.isActive}
                      href={submenuItem.href}
                      title={submenuItem.title}
                      role="menuitem"
                      aria-current={submenuItem.isActive ? 'page' : undefined}
                    >
                      {submenuItem.label}
                    </a>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </nav>
  </aside>

  <main class="classic-stage" aria-label={safeStageLabel}>
    <div class="classic-stage-art" aria-hidden="true"></div>
    <div class="classic-stage-content">
      {@render children?.()}
    </div>
  </main>
  <PlaylistDrawer {drawer} {destination} callbacks={shellCallbacks} {drawerContent} />

  {#if playerContent}
    {@render playerContent()}
  {:else}
    <footer class="classic-player" aria-label="Playback controls">
      <div class="classic-player-controls">
        <button type="button" aria-label="Previous" onclick={() => invoke(playerActions.previous)}>
          <span class="mdi mdi-av-skip-previous" aria-hidden="true"></span>
        </button>
        <button
          type="button"
          aria-label={safePlayer.isPlaying ? 'Pause' : 'Play'}
          onclick={() => invoke(playerActions.playPause)}
        >
          <span
            class={safePlayer.isPlaying ? 'mdi mdi-av-pause' : 'mdi mdi-av-play-arrow'}
            aria-hidden="true"
          ></span>
        </button>
        <button type="button" aria-label="Next" onclick={() => invoke(playerActions.next)}>
          <span class="mdi mdi-av-skip-next" aria-hidden="true"></span>
        </button>
      </div>
      {#if playerActions.openRemote}
        <button
          type="button"
          class="classic-thumb classic-thumb-button"
          aria-label="Open Kodi remote"
          onclick={() => invoke(playerActions.openRemote)}
        >
          <span class="mdi mdi-action-settings-remote" aria-hidden="true"></span>
        </button>
      {:else}
        <div class="classic-thumb" aria-hidden="true"></div>
      {/if}
      <div class="classic-nowline">
        <strong>{safePlayer.title}</strong>
        <span>{safePlayer.subtitle}</span>
        <div class="classic-progress" aria-hidden="true">
          <span style={`width: ${safePlayer.progressPercent}%`}></span>
        </div>
      </div>
      <div class="classic-time" aria-label="Playback time">
        <span>{safePlayer.currentTime}</span>
        <span>{safePlayer.totalTime}</span>
      </div>
      <div class="classic-player-actions">
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
          aria-pressed={safePlayer.isShuffled === true}
          title={playerActions.shuffle
            ? undefined
            : 'Shuffle is unavailable until Kodi playback is active.'}
          disabled={!playerActions.shuffle}
          onclick={() => invoke(playerActions.shuffle)}
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
          aria-haspopup="menu"
          aria-expanded={playerMoreOpen}
          title={hasPlayerMoreActions
            ? 'More playback actions'
            : 'More playback actions are unavailable.'}
          disabled={!hasPlayerMoreActions}
          onclick={() => {
            playerMoreOpen = !playerMoreOpen;
          }}
        >
          <span class="mdi mdi-navigation-more-vert" aria-hidden="true"></span>
        </button>
        {#if playerMoreOpen && hasPlayerMoreActions}
          <div class="classic-player-more-menu" role="menu" aria-label="More playback actions">
            {#if playerActions.stop}
              <button
                type="button"
                role="menuitem"
                onclick={() => invokePlayerMore(playerActions.stop)}
              >
                <span class="mdi mdi-av-stop" aria-hidden="true"></span>
                <span>Stop</span>
              </button>
            {/if}
            {#if playerActions.repeat}
              <button
                type="button"
                role="menuitem"
                onclick={() => invokePlayerMore(playerActions.repeat)}
              >
                <span class="mdi mdi-av-repeat" aria-hidden="true"></span>
                <span>Repeat</span>
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </footer>
  {/if}

  {@render localRuntime?.()}
</div>

<style>
  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('../assets/classic/fonts/opensans/opensans-light-webfont.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('../assets/classic/fonts/opensans/opensans-regular-webfont.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Open Sans Chorus';
    src: url('../assets/classic/fonts/opensans/opensans-semibold-webfont.woff2') format('woff2');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Material-Design-Icons';
    src: url('../assets/classic/fonts/material/Material-Design-Icons.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }

  .chorus-app {
    --classic-blue: #4db3e6;
    --classic-header: #1d2021;
    --classic-dark: #181b1c;
    --classic-playlist: #2f3335;
    --classic-player: #17191a;
    position: relative;
    display: block;
    width: 100%;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
    padding: 0;
    color: #333;
    background: var(--classic-dark);
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
  .mdi-action-settings-remote::before {
    content: '\e66f';
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
  .mdi-av-pause::before {
    content: '\e6b6';
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
  .mdi-av-stop::before {
    content: '\e6c9';
  }
  .mdi-av-volume-up::before {
    content: '\e6d2';
  }
  .mdi-av-repeat::before {
    content: '\e6b7';
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

  .classic-topbar {
    position: absolute;
    inset: 0 0 auto;
    z-index: 20;
    height: 50px;
    background: var(--classic-header);
  }

  .classic-logo {
    position: absolute;
    inset: 0 auto auto 0;
    display: grid;
    place-items: center;
    width: 50px;
    height: 50px;
    overflow: hidden;
    text-decoration: none;
  }

  .classic-logo img {
    display: block;
    width: 181px;
    max-width: none;
    height: 50px;
    filter: brightness(0) saturate(100%) invert(62%) sepia(67%) saturate(1543%) hue-rotate(165deg)
      brightness(96%) contrast(88%);
    transform: translateX(-128px);
  }

  .classic-search {
    position: absolute;
    top: 0;
    right: var(--classic-search-right, 300px);
    display: grid;
    grid-template-columns: 42px 1fr;
    align-items: center;
    width: 205px;
    height: 50px;
    color: #565b5f;
    background: #f0f0f0;
  }

  .classic-search .mdi {
    justify-self: center;
    font-size: 20px;
  }

  .classic-search input {
    width: 100%;
    height: 50px;
    padding: 0;
    color: #333;
    background: transparent;
    border: 0;
    outline: 0;
  }

  :global(.classic-destination-tabs) {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 21;
    display: grid;
    grid-template-columns: 95px 120px 42px 43px;
    width: 300px;
    height: 50px;
  }

  :global(.classic-destination-tabs button),
  :global(.classic-media-tabs button),
  :global(.classic-playlist-menu button),
  .classic-player button {
    font: inherit;
    border: 0;
    border-radius: 0;
    cursor: pointer;
  }

  :global(.classic-destination-tabs button:disabled),
  :global(.classic-media-tabs button:disabled),
  :global(.classic-playlist-menu button:disabled),
  .classic-player button:disabled {
    cursor: default;
  }

  :global(.classic-destination-tabs button) {
    display: inline-grid;
    grid-auto-flow: column;
    gap: 7px;
    align-items: center;
    justify-content: center;
    min-width: 0;
    color: #c8c8c8;
    background: #292d2f;
  }

  :global(.classic-destination-tabs button.active) {
    color: var(--classic-blue);
    background: #1f2223;
  }

  :global(.classic-destination-tabs button:nth-child(3)),
  :global(.classic-destination-tabs button:nth-child(4)) {
    color: #888;
    font-size: 20px;
  }

  :global(.classic-kodi-mark) {
    color: var(--classic-blue);
    font-size: 16px;
    line-height: 1;
  }

  .classic-rail {
    position: absolute;
    top: 50px;
    bottom: 60px;
    left: 0;
    z-index: 10;
    width: 50px;
    background: #fff;
    box-shadow: inset -1px 0 0 rgb(0 0 0 / 0.05);
  }

  .classic-rail nav {
    display: grid;
    align-content: start;
    padding-top: 10px;
  }

  .classic-rail-item {
    position: relative;
    width: 50px;
  }

  .classic-rail-primary {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 50px;
    height: 39px;
    color: #303336;
    font-size: 23px;
    text-decoration: none;
  }

  .classic-rail-item.active .classic-rail-primary,
  .classic-rail-primary.active,
  .classic-rail-primary:hover,
  .classic-rail-primary:focus-visible,
  .classic-rail-item:focus-within .classic-rail-primary {
    color: #fff;
    background: var(--classic-blue);
  }

  .classic-rail-primary:focus-visible,
  .classic-submenu-link:focus-visible {
    outline: 2px solid #fff;
    outline-offset: -3px;
    box-shadow: 0 0 0 3px rgb(77 179 230 / 0.55);
  }

  .classic-submenu {
    display: none;
    position: absolute;
    left: 50px;
    top: 39px;
    z-index: 4;
    min-width: 176px;
    max-height: min(320px, calc(100vh - 149px));
    overflow-y: auto;
    padding-block: 7px;
    color: #303336;
    background: #f7f7f7;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.22);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition-property: opacity, transform;
    transition-duration: 140ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }

  .classic-submenu-group {
    display: grid;
  }

  .classic-submenu-heading {
    padding: 5px 17px 4px;
    color: #7a7f82;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .classic-submenu-link {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 34px;
    padding: 0 17px;
    color: #303336;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  .classic-submenu-link:hover,
  .classic-submenu-link.active {
    color: #fff;
    background: var(--classic-blue);
  }

  .classic-stage {
    position: absolute;
    top: 50px;
    right: var(--classic-playlist-width, 300px);
    bottom: 60px;
    left: 50px;
    overflow: auto;
    background: #1a1c1d;
  }

  .classic-stage-art {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgb(20 22 23 / 0.36), rgb(20 22 23 / 0.18) 52%, rgb(20 22 23 / 0.04)),
      var(--classic-stage-art-url) center bottom / cover no-repeat;
  }

  .classic-stage-content {
    position: relative;
    z-index: 1;
    min-height: 100%;
  }

  .classic-stage-content:empty {
    display: none;
  }

  :global(.classic-playlist) {
    position: absolute;
    top: 50px;
    right: 0;
    bottom: 60px;
    z-index: 8;
    width: var(--classic-playlist-width, 300px);
    overflow: hidden;
    background: var(--classic-playlist);
    transition-property: width;
    transition-duration: 140ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }

  :global(.classic-media-tabs) {
    display: grid;
    grid-template-columns: 70px 70px 1fr;
    height: 28px;
    background: #242728;
  }

  :global(.classic-media-tabs button) {
    color: #888;
    background: #3d4143;
    font-size: 12px;
    text-align: center;
  }

  :global(.classic-media-tabs button.active) {
    color: #fff;
    background: #4d5153;
  }

  :global(.classic-playlist[data-collapsed='true'] .classic-media-tabs),
  :global(.classic-playlist[data-collapsed='true'] .classic-playlist-menu),
  :global(.classic-playlist[data-collapsed='true'] .queue-panel) {
    display: none;
  }

  :global(.classic-playlist .queue-panel) {
    display: grid;
    gap: 0;
    height: calc(100% - 28px);
    overflow: auto;
    color: #c8c8c8;
    background: #181b1c;
    scrollbar-width: thin;
  }

  :global(.classic-playlist .queue-panel [role='status']) {
    min-height: 0;
    padding: 9px 12px;
    overflow: hidden;
    color: #8e9498;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.classic-playlist .queue-panel p) {
    margin: 0;
    padding: 12px;
    color: #8e9498;
    font-size: 12px;
  }

  :global(.classic-playlist .queue-panel > button) {
    display: none;
  }

  :global(.classic-playlist .queue-panel ol) {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  :global(.classic-playlist .queue-panel li) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 8px;
    align-items: center;
    min-height: 48px;
    padding: 8px 12px;
    border-bottom: 1px solid #2d3032;
    color: #d7d7d7;
    font-size: 12px;
    font-weight: 600;
  }

  :global(.classic-playlist .queue-panel li[aria-current='true']) {
    color: #fff;
    background: #050606;
    box-shadow: inset 4px 0 0 var(--classic-blue);
  }

  :global(.classic-playlist .queue-panel li span:first-child) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.classic-playlist .queue-panel li span:nth-child(2)) {
    color: #8e9498;
    font-size: 11px;
    font-weight: 400;
  }

  :global(.classic-playlist .queue-panel li button) {
    width: 24px;
    height: 24px;
    border: 0;
    color: #8e9498;
    background: #242728;
    font-size: 0;
  }

  :global(.classic-playlist .queue-panel li button:hover:not(:disabled)) {
    color: #fff;
    background: #3d4143;
  }

  :global(.classic-playlist .queue-panel li button:nth-of-type(1)::before) {
    content: '↑';
    font-size: 13px;
  }

  :global(.classic-playlist .queue-panel li button:nth-of-type(2)::before) {
    content: '↓';
    font-size: 13px;
  }

  :global(.classic-playlist .queue-panel li button:nth-of-type(3)::before) {
    content: '×';
    font-size: 16px;
  }

  :global(.classic-collapse-icon) {
    transition-property: transform;
    transition-duration: 140ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }

  :global(.classic-collapse-icon.collapsed) {
    transform: rotate(180deg);
  }

  :global(.classic-playlist-menu) {
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

  :global(.classic-playlist-menu button) {
    height: 32px;
    padding: 0 13px;
    color: #858585;
    background: #f4f4f4;
    font-size: 13px;
    text-align: left;
  }

  :global(.classic-playlist-menu button.selected) {
    background: #d8d8d8;
  }

  :global(.classic-playlist-menu button:disabled) {
    opacity: 0.55;
    cursor: default;
  }

  .classic-player {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 30;
    display: grid;
    grid-template-columns: 170px 70px minmax(0, 1fr) 56px 305px;
    height: 60px;
    color: #cfcfcf;
    background: var(--classic-player);
  }

  .classic-player-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: #202324;
  }

  .classic-player button {
    display: grid;
    place-items: center;
    min-width: 0;
    color: #8f9395;
    background: transparent;
  }

  .classic-player button:hover:not(:disabled) {
    color: #fff;
    background: #35393a;
  }

  .classic-player button:disabled {
    opacity: 0.55;
  }

  .classic-player-controls button {
    font-size: 32px;
  }

  .classic-player-controls button:nth-child(2) {
    font-size: 44px;
  }

  .classic-player .classic-thumb {
    position: relative;
    min-width: 0;
    background:
      linear-gradient(rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.14)),
      var(--classic-thumb-url) center / cover no-repeat;
  }

  .classic-thumb-button {
    width: 70px;
    height: 60px;
    padding: 0;
    overflow: hidden;
    font-size: 36px;
  }

  .classic-thumb-button .mdi {
    display: none;
    width: 100%;
    height: 100%;
    place-items: center;
    color: rgb(255 255 255 / 0.82);
    background: rgb(0 0 0 / 0.28);
  }

  .classic-thumb-button:hover .mdi,
  .classic-thumb-button:focus-visible .mdi {
    display: grid;
  }

  .classic-nowline {
    position: relative;
    display: grid;
    align-content: center;
    gap: 2px;
    min-width: 0;
    padding: 0 12px;
    background: #191c1d;
  }

  .classic-nowline strong,
  .classic-nowline span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .classic-nowline strong {
    color: #e2e2e2;
    font-size: 12px;
    font-weight: 600;
  }

  .classic-nowline span {
    color: #8e9498;
    font-size: 11px;
  }

  .classic-progress {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: #2d3032;
  }

  .classic-progress span {
    display: block;
    height: 100%;
    background: var(--classic-blue);
  }

  .classic-time {
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

  .classic-player-actions {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #3d4143;
  }

  .classic-player-actions button {
    font-size: 24px;
  }

  .classic-player-more-menu {
    position: absolute;
    right: 8px;
    bottom: 58px;
    z-index: 36;
    display: grid;
    min-width: 150px;
    padding: 6px 0;
    color: #eee;
    background: #2f3335;
    box-shadow: 0 3px 12px rgb(0 0 0 / 0.32);
  }

  .classic-player-more-menu button {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 8px;
    align-items: center;
    justify-content: start;
    width: 100%;
    min-height: 38px;
    padding: 0 14px;
    color: #ddd;
    text-align: left;
    font-size: 14px;
  }

  .classic-player-more-menu .mdi {
    font-size: 20px;
  }

  @media (max-width: 760px) {
    .classic-search {
      right: 0;
      width: 190px;
    }

    :global(.classic-destination-tabs),
    :global(.classic-playlist),
    :global(.classic-playlist-menu) {
      display: none;
    }

    .classic-stage {
      right: 0;
    }

    .classic-player {
      grid-template-columns: 150px 60px minmax(0, 1fr);
    }

    .classic-time,
    .classic-player-actions {
      display: none;
    }
  }

  @media (max-height: 420px) {
    .classic-rail {
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      scrollbar-width: none;
    }

    .classic-rail::-webkit-scrollbar {
      display: none;
    }

    .classic-rail nav {
      padding-block: 0;
    }

    .classic-submenu {
      display: none;
      max-height: 0;
    }
  }
</style>
