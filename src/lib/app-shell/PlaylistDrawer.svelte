<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    AppShellCallbacks,
    AppShellDestinationState,
    AppShellDrawerState,
    AppShellPlaylistDestinationMode,
    AppShellPlaylistMediaMode,
    AppShellPlaylistMenuAction
  } from './appShellTypes';

  interface Props {
    drawer?: AppShellDrawerState;
    destination?: AppShellDestinationState;
    callbacks?: AppShellCallbacks;
    drawerContent?: Snippet;
  }

  const MENU_ID = 'c2-playlist-menu';

  const MENU_ACTION_LABELS: Record<AppShellPlaylistMenuAction, string> = {
    currentPlaylist: 'Current playlist',
    clear: 'Clear playlist',
    refresh: 'Refresh playlist',
    partyMode: 'Party mode',
    saveKodiPlaylist: 'Save Kodi playlist'
  };

  let {
    drawer = { label: 'Current playlist', mediaMode: 'audio' },
    destination = { mode: 'kodi', mediaMode: 'audio' },
    callbacks = {},
    drawerContent
  }: Props = $props();

  const DEFAULT_MENU_DISABLED_REASONS = {
    currentPlaylist: 'Current playlist is already selected.',
    clear: 'Clear playlist is deferred until a playlist action callback is supplied.',
    refresh: 'Refresh playlist is deferred to playlist persistence work.',
    partyMode: 'Party mode is deferred to Kodi playlist controls.',
    saveKodiPlaylist: 'Saving Kodi playlists is deferred to durable playlist persistence.'
  } satisfies Record<AppShellPlaylistMenuAction, string>;

  let localMenuOpen = $state(false);
  let localCollapsed = $state(false);
  let localDestinationMode = $state<AppShellPlaylistDestinationMode>('kodi');
  let localMediaMode = $state<AppShellPlaylistMediaMode>('audio');

  $effect(() => {
    if (drawer.menuOpen !== undefined) {
      localMenuOpen = Boolean(drawer.menuOpen);
    }

    if (drawer.collapsed !== undefined) {
      localCollapsed = Boolean(drawer.collapsed);
    }

    localDestinationMode = destination.mode === 'local' ? 'local' : 'kodi';
    localMediaMode = drawer.mediaMode ?? destination.mediaMode ?? 'audio';
  });

  const safeDrawerLabel = $derived(safeText(drawer.label, 'Current playlist'));
  const menuDisabledReasons = $derived(normalizeMenuDisabledReasons(drawer.menuDisabledReasons));
  const destinationDisabledReasons = $derived(destination.disabledReasons ?? {});

  function invoke(action: (() => void | Promise<void>) | undefined): void {
    if (!action) {
      return;
    }

    try {
      void Promise.resolve(action()).catch(() => {
        // Shell callback diagnostics are owned by the composing app's dispatch snapshots.
      });
    } catch {
      // Keep the drawer mounted even when an injected callback throws synchronously.
    }
  }

  function safeText(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function normalizeMenuDisabledReasons(
    reasons: AppShellDrawerState['menuDisabledReasons']
  ): Partial<Record<AppShellPlaylistMenuAction, string>> {
    const normalized: Partial<Record<AppShellPlaylistMenuAction, string>> = {
      ...DEFAULT_MENU_DISABLED_REASONS,
      ...reasons,
      currentPlaylist: reasons?.currentPlaylist ?? DEFAULT_MENU_DISABLED_REASONS.currentPlaylist,
      clear:
        callbacks.onPlaylistMenuAction && reasons?.clear === undefined
          ? undefined
          : (reasons?.clear ?? DEFAULT_MENU_DISABLED_REASONS.clear),
      refresh: reasons?.refresh ?? DEFAULT_MENU_DISABLED_REASONS.refresh,
      partyMode: reasons?.partyMode ?? DEFAULT_MENU_DISABLED_REASONS.partyMode,
      saveKodiPlaylist: reasons?.saveKodiPlaylist ?? DEFAULT_MENU_DISABLED_REASONS.saveKodiPlaylist
    };

    return normalized;
  }

  function selectDestinationMode(mode: AppShellPlaylistDestinationMode): void {
    if (destinationDisabledReasons[mode]) {
      return;
    }

    localDestinationMode = mode;
    invoke(() => callbacks.onDestinationModeChange?.(mode));
  }

  function selectMediaMode(mode: AppShellPlaylistMediaMode): void {
    localMediaMode = mode;
    invoke(() => callbacks.onMediaModeChange?.(mode));
  }

  function toggleMenu(): void {
    localMenuOpen = !localMenuOpen;
    invoke(() => callbacks.onPlaylistMenuToggle?.(localMenuOpen));
  }

  function toggleCollapsed(): void {
    localCollapsed = !localCollapsed;
    invoke(() => callbacks.onPlaylistCollapseToggle?.(localCollapsed));
  }

  function selectMenuAction(action: AppShellPlaylistMenuAction): void {
    if (menuDisabledReasons[action]) {
      return;
    }

    invoke(() => callbacks.onPlaylistMenuAction?.(action));
  }
</script>

<div class="c2-destination-tabs" aria-label="Playback destination">
  <button
    type="button"
    class:active={localDestinationMode === 'kodi'}
    aria-pressed={localDestinationMode === 'kodi'}
    aria-label={localDestinationMode === 'kodi'
      ? 'Kodi playback destination selected'
      : 'Use Kodi playback destination'}
    title={destinationDisabledReasons.kodi}
    disabled={Boolean(destinationDisabledReasons.kodi)}
    onclick={() => selectDestinationMode('kodi')}
  >
    <span class="c2-kodi-mark" aria-hidden="true">✣</span>
    Kodi
  </button>
  <button
    type="button"
    class:active={localDestinationMode === 'local'}
    aria-pressed={localDestinationMode === 'local'}
    title={destinationDisabledReasons.local}
    disabled={Boolean(destinationDisabledReasons.local)}
    onclick={() => selectDestinationMode('local')}
  >
    <span class="mdi mdi-av-volume-up" aria-hidden="true"></span>
    Local
  </button>
  <button
    type="button"
    aria-label="Playlist menu"
    aria-haspopup="menu"
    aria-expanded={localMenuOpen}
    aria-controls={MENU_ID}
    onclick={toggleMenu}
  >
    <span class="mdi mdi-navigation-more-vert" aria-hidden="true"></span>
  </button>
  <button
    type="button"
    aria-label={localCollapsed ? 'Expand playlist' : 'Collapse playlist'}
    aria-pressed={localCollapsed}
    onclick={toggleCollapsed}
  >
    <span
      class="mdi mdi-hardware-keyboard-arrow-right c2-collapse-icon"
      class:collapsed={localCollapsed}
      aria-hidden="true"
    ></span>
  </button>
</div>

<aside
  class="c2-playlist"
  aria-label={safeDrawerLabel}
  data-collapsed={localCollapsed ? 'true' : 'false'}
>
  <div class="c2-media-tabs" role="tablist" aria-label="Playlist media type">
    <button
      type="button"
      role="tab"
      class:active={localMediaMode !== 'video'}
      aria-selected={localMediaMode !== 'video'}
      onclick={() => selectMediaMode('audio')}>Audio</button
    >
    <button
      type="button"
      role="tab"
      class:active={localMediaMode === 'video'}
      aria-selected={localMediaMode === 'video'}
      onclick={() => selectMediaMode('video')}>Video</button
    >
  </div>

  {#if drawerContent}
    {@render drawerContent()}
  {:else if localMenuOpen}
    <div id={MENU_ID} class="c2-playlist-menu" role="menu" aria-label="Playlist menu">
      <button
        type="button"
        role="menuitem"
        class="selected"
        aria-disabled={menuDisabledReasons.currentPlaylist ? 'true' : undefined}
        title={menuDisabledReasons.currentPlaylist}
        disabled={Boolean(menuDisabledReasons.currentPlaylist)}
        onclick={() => selectMenuAction('currentPlaylist')}
      >
        {MENU_ACTION_LABELS.currentPlaylist}
      </button>
      <button
        type="button"
        role="menuitem"
        aria-disabled={menuDisabledReasons.clear ? 'true' : undefined}
        title={menuDisabledReasons.clear}
        disabled={Boolean(menuDisabledReasons.clear)}
        onclick={() => selectMenuAction('clear')}>{MENU_ACTION_LABELS.clear}</button
      >
      <button
        type="button"
        role="menuitem"
        aria-disabled={menuDisabledReasons.refresh ? 'true' : undefined}
        title={menuDisabledReasons.refresh}
        disabled={Boolean(menuDisabledReasons.refresh)}
        onclick={() => selectMenuAction('refresh')}>{MENU_ACTION_LABELS.refresh}</button
      >
      <button
        type="button"
        role="menuitem"
        aria-disabled={menuDisabledReasons.partyMode ? 'true' : undefined}
        title={menuDisabledReasons.partyMode}
        disabled={Boolean(menuDisabledReasons.partyMode)}
        onclick={() => selectMenuAction('partyMode')}>{MENU_ACTION_LABELS.partyMode}</button
      >
      <button type="button" role="menuitem" class="selected" aria-disabled="true" disabled>
        Kodi
      </button>
      <button
        type="button"
        role="menuitem"
        aria-disabled={menuDisabledReasons.saveKodiPlaylist ? 'true' : undefined}
        title={menuDisabledReasons.saveKodiPlaylist}
        disabled={Boolean(menuDisabledReasons.saveKodiPlaylist)}
        onclick={() => selectMenuAction('saveKodiPlaylist')}
        >{MENU_ACTION_LABELS.saveKodiPlaylist}</button
      >
    </div>
  {/if}
</aside>
