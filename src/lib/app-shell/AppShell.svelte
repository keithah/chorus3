<script lang="ts">
  import { onDestroy } from 'svelte';
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
  const chorusFanartUrl = new URL(
    /* @vite-ignore */ '../classic-assets/images/fanart_default/tweeter.jpg',
    import.meta.url
  ).href;

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

  function clearSearchDebounce(): void {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
      searchDebounce = null;
    }
  }

  onDestroy(clearSearchDebounce);

  function scheduleSearchNavigation(): void {
    clearSearchDebounce();

    const query = shellSearchValue.trim();

    if (!query) {
      return;
    }

    searchDebounce = setTimeout(() => {
      submitShellSearch();
    }, 2000);
  }

  function submitShellSearch(): void {
    clearSearchDebounce();

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
          <span style={`transform: scaleX(${safePlayer.progressPercent / 100})`}></span>
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
  @import './appShellClassic.css';
</style>
