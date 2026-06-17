<script lang="ts" module>
  export interface MediaPlaylistsPanelDispatch {
    refresh: () => Promise<void> | void;
    openPlaylist: (id: string) => Promise<void> | void;
    openBreadcrumb: (id: string) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import './mediaPlaylistsPanelClassic.css';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';
  import { safeIndexedKey, stringOrNull } from './listKeyHelpers';
  import { displayText, sanitizeUiText, textOrNull } from './textFormatting';
  import {
    actionId,
    entryActionFor as buildEntryAction,
    entryActionRun,
    playlistActionFor as buildPlaylistAction,
    playlistActionRun,
    type MediaPlaylistsActionDispatch,
    type MediaPlaylistsActionItem,
    type MediaPlaylistsEntryActionItem,
    type PendingPlaylistAction,
    type PlaylistActionRun,
    type PlaylistActionVerb
  } from './mediaPlaylistsActionModel';
  import {
    mediaPlaylistsStore,
    type MediaPlaylistEntrySnapshot,
    type MediaPlaylistSnapshot,
    type MediaPlaylistsBreadcrumbSnapshot,
    type MediaPlaylistsStoreSnapshot
  } from '$lib/stores/mediaPlaylists.svelte';

  interface Props {
    snapshot?: MediaPlaylistsStoreSnapshot;
    dispatch: MediaPlaylistsPanelDispatch;
    i18n?: TranslationContext;
    actionDispatch: MediaPlaylistsActionDispatch;
  }

  type BrowseOperationKind = 'refresh' | 'playlist' | 'breadcrumb';

  type PendingBrowseOperation = {
    kind: BrowseOperationKind;
    id: string;
  };

  let {
    snapshot: injectedSnapshot,
    dispatch,
    actionDispatch,
    i18n = createEnglishTranslationContext()
  }: Props = $props();
  const snapshot = $derived(injectedSnapshot ?? mediaPlaylistsStore.snapshot);

  let pendingBrowse = $state<PendingBrowseOperation | null>(null);
  let pendingAction = $state<PendingPlaylistAction | null>(null);
  let localStatusText = $state<string | null>(null);
  let localErrorText = $state<string | null>(null);
  const entryVisibility = createIncrementalVisibility(250);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const snapshotErrorText = $derived(
    snapshot.lastError ? sanitizeUiText(snapshot.lastError.message) : null
  );
  const statusText = $derived(localStatusText ?? formatStatus(snapshot));
  const visibleEntries = $derived(entryVisibility.visibleItems(snapshot.entries));

  async function handleRefresh(): Promise<void> {
    if (isBrowseDisabled('refresh', 'refresh')) {
      return;
    }

    pendingBrowse = { kind: 'refresh', id: 'refresh' };
    localErrorText = null;
    localStatusText = 'Refreshing media playlists…';

    try {
      await dispatch.refresh();
      localStatusText = null;
    } catch (error) {
      const message = sanitizeUiText(error instanceof Error ? error.message : 'Refresh failed.');
      localErrorText = `Could not refresh media playlists. ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingBrowse = null;
    }
  }

  async function handleOpenPlaylist(playlist: MediaPlaylistSnapshot, index: number): Promise<void> {
    const id = stringOrNull(playlist.id);
    if (!id || !playlist.capabilities.canBrowse || isBrowseDisabled('playlist', id)) {
      return;
    }

    const label = safePlaylistLabel(playlist, index);
    await runBrowseOperation({
      kind: 'playlist',
      id,
      pendingCopy: `Opening playlist ${label}…`,
      errorCopy: `Could not open playlist ${label}.`,
      run: () => dispatch.openPlaylist(id)
    });
  }

  async function handleOpenBreadcrumb(
    breadcrumb: MediaPlaylistsBreadcrumbSnapshot,
    index: number
  ): Promise<void> {
    const id = stringOrNull(breadcrumb.id);
    if (!id || isBrowseDisabled('breadcrumb', id)) {
      return;
    }

    const label = safeBreadcrumbLabel(breadcrumb, index);
    await runBrowseOperation({
      kind: 'breadcrumb',
      id,
      pendingCopy: `Opening breadcrumb ${label}…`,
      errorCopy: `Could not open breadcrumb ${label}.`,
      run: () => dispatch.openBreadcrumb(id)
    });
  }

  async function runBrowseOperation(options: {
    kind: BrowseOperationKind;
    id: string;
    pendingCopy: string;
    errorCopy: string;
    run: () => Promise<void> | void;
  }): Promise<void> {
    pendingBrowse = { kind: options.kind, id: options.id };
    localErrorText = null;
    localStatusText = options.pendingCopy;

    try {
      await options.run();
      localStatusText = null;
    } catch (error) {
      const message = sanitizeUiText(error instanceof Error ? error.message : 'Browse failed.');
      localErrorText = `${options.errorCopy} ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingBrowse = null;
    }
  }

  async function handleEntryAction(
    verb: PlaylistActionVerb,
    entry: MediaPlaylistEntrySnapshot,
    index: number
  ): Promise<void> {
    const item = entryActionFor(entry, index);
    if (!item || isEntryVerbDisabled(verb, entry, item)) {
      return;
    }

    await runPlaylistAction(entryActionRun(actionDispatch, verb, item));
  }

  async function handlePlaylistAction(
    verb: PlaylistActionVerb,
    playlist: MediaPlaylistSnapshot,
    index: number
  ): Promise<void> {
    const item = playlistActionFor(playlist, index);
    if (!item || isActionDisabled(item)) {
      return;
    }

    await runPlaylistAction(playlistActionRun(actionDispatch, verb, item));
  }

  async function runPlaylistAction(action: PlaylistActionRun): Promise<void> {
    pendingAction = {
      id: actionId(action.verb, action.item),
      verb: action.verb,
      label: action.label,
      item: action.item
    };
    localErrorText = null;
    localStatusText = action.pendingCopy;

    try {
      await action.run();
      localStatusText = action.successCopy;
    } catch (error) {
      const message = sanitizeUiText(error instanceof Error ? error.message : action.fallbackError);
      localErrorText = `${action.errorCopy} ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingAction = null;
    }
  }

  function formatStatus(value: MediaPlaylistsStoreSnapshot): string {
    const media = safeMediaLabel(value.media);

    if (value.refreshStatus === 'loading') {
      return `Loading ${media} playlists…`;
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.refreshStatus === 'idle') {
      return `Load Kodi ${media} playlists.`;
    }

    if (value.isEmpty) {
      return `No ${media} playlists found.`;
    }

    const playlistCount = value.playlists.length;
    const entryCount = value.entries.length;
    const updated = textOrNull(value.lastUpdatedAt);
    const updatedCopy = updated ? ` Last updated ${updated}.` : '';
    return `Showing ${media} playlists. ${playlistCount} ${plural('playlist', playlistCount)}, ${entryCount} ${plural('entry', entryCount)}.${updatedCopy}`;
  }

  function isBrowseDisabled(kind: BrowseOperationKind, id: string): boolean {
    if (isLoading || pendingAction) {
      return true;
    }

    if (!pendingBrowse) {
      return false;
    }

    return pendingBrowse.kind === kind && pendingBrowse.id === id;
  }

  function isActionDisabled(
    item: MediaPlaylistsActionItem | MediaPlaylistsEntryActionItem
  ): boolean {
    if (isLoading) {
      return true;
    }

    if (!pendingAction) {
      return false;
    }

    return pendingAction.item.id === item.id;
  }

  function playlistActionFor(
    playlist: MediaPlaylistSnapshot,
    index: number
  ): MediaPlaylistsActionItem | null {
    const id = stringOrNull(playlist.id);
    if (!id || (!playlist.capabilities.canPlay && !playlist.capabilities.canQueue)) {
      return null;
    }

    return buildPlaylistAction(playlist, id, safePlaylistLabel(playlist, index));
  }

  function entryActionFor(
    entry: MediaPlaylistEntrySnapshot,
    index: number
  ): MediaPlaylistsEntryActionItem | null {
    const id = stringOrNull(entry.id);
    if (
      !id ||
      (entry.mediaKind !== 'audio' && entry.mediaKind !== 'video') ||
      (!entry.capabilities.canPlay && !entry.capabilities.canQueue)
    ) {
      return null;
    }

    return buildEntryAction(
      entry,
      id,
      safeEntryLabel(entry, index),
      snapshot.media,
      entry.mediaKind
    );
  }

  function isEntryActionDisabled(item: MediaPlaylistsEntryActionItem): boolean {
    if (isLoading) {
      return true;
    }

    return isActionDisabled(item);
  }

  function isEntryVerbDisabled(
    verb: PlaylistActionVerb,
    entry: MediaPlaylistEntrySnapshot,
    item: MediaPlaylistsEntryActionItem
  ): boolean {
    if (verb === 'play' && !entry.capabilities.canPlay) {
      return true;
    }

    if (verb === 'queue' && !entry.capabilities.canQueue) {
      return true;
    }

    if (verb === 'play' && !actionDispatch.playEntryItem) {
      return true;
    }

    if (verb === 'queue' && !actionDispatch.queueEntryItem) {
      return true;
    }

    return isEntryActionDisabled(item);
  }

  function safePlaylistLabel(playlist: MediaPlaylistSnapshot, index: number): string {
    return displayText(playlist.label, `Playlist ${index + 1}`);
  }

  function safeBreadcrumbLabel(
    breadcrumb: MediaPlaylistsBreadcrumbSnapshot,
    index: number
  ): string {
    return displayText(breadcrumb.label, `Location ${index + 1}`);
  }

  function safeEntryLabel(entry: MediaPlaylistEntrySnapshot, index: number): string {
    const fallback =
      entry.mediaKind === 'audio'
        ? `Audio entry ${index + 1}`
        : entry.mediaKind === 'video'
          ? `Video entry ${index + 1}`
          : `Entry ${index + 1}`;
    return displayText(entry.label, fallback);
  }

  function playlistKicker(playlist: MediaPlaylistSnapshot): string {
    if (playlist.kind === 'smart') {
      return 'Smart playlist';
    }

    if (playlist.kind === 'basic') {
      return 'Playlist file';
    }

    return 'Unsupported playlist';
  }

  function playlistMeta(playlist: MediaPlaylistSnapshot): string {
    if (playlist.kind === 'smart') {
      return 'Can open, play, and queue';
    }

    if (playlist.kind === 'basic') {
      return 'Can play and queue';
    }

    return 'This playlist format is not supported';
  }

  function entryKicker(entry: MediaPlaylistEntrySnapshot): string {
    if (entry.mediaKind === 'audio') {
      return 'Audio entry';
    }

    if (entry.mediaKind === 'video') {
      return 'Video entry';
    }

    return 'Unsupported entry';
  }

  function entryMeta(entry: MediaPlaylistEntrySnapshot): string {
    if (entry.mediaKind === 'audio') {
      return entry.capabilities.canPlay && entry.capabilities.canQueue
        ? 'Playable item from the opened playlist'
        : 'Audio item without available actions';
    }

    if (entry.mediaKind === 'video') {
      return entry.capabilities.canPlay && entry.capabilities.canQueue
        ? 'Playable video item from the opened playlist'
        : 'Video item without available actions';
    }

    return 'This playlist entry cannot be played or queued from this view';
  }

  function browseReasonCopy(reason: string): string {
    if (reason === 'manual') {
      return 'Manual refresh';
    }

    if (reason === 'init') {
      return 'Initial state';
    }

    if (reason.startsWith('playlist:')) {
      return 'Opened playlist';
    }

    if (reason.startsWith('error:')) {
      return 'Error state';
    }

    return 'Media playlists';
  }

  function safeMediaTitle(media: string): string {
    return media === 'video' ? 'Video' : 'Music';
  }

  function safeMediaLabel(media: string): string {
    return media === 'video' ? 'video' : 'music';
  }

  function plural(noun: string, count: number): string {
    if (count === 1) {
      return noun;
    }

    return noun === 'entry' ? 'entries' : `${noun}s`;
  }
</script>

<section class="media-playlists-panel surface" aria-labelledby="media-playlists-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('media.playlists.kicker')}</p>
    <h2 id="media-playlists-title">{i18n.t('media.playlists.title')}</h2>
    <p class="summary-line">
      Browse Kodi {safeMediaLabel(snapshot.media)} playlists, open smart playlists to browse tracks, and
      play or queue supported items.
    </p>
  </div>

  <div class="toolbar" aria-label="Media playlists controls">
    <div>
      <p class="breadcrumb">{browseReasonCopy(snapshot.lastRefreshReason)}</p>
      <p class="summary-line">
        {snapshot.playlists.length}
        {plural('playlist', snapshot.playlists.length)} · {snapshot.entries.length}
        {plural('entry', snapshot.entries.length)}
      </p>
    </div>
    <button
      type="button"
      class="primary-button"
      aria-label="Refresh media playlists"
      disabled={isBrowseDisabled('refresh', 'refresh')}
      onclick={handleRefresh}
    >
      Refresh playlists
    </button>
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>
  {#if localErrorText}
    <p class="error-copy" role="alert">{localErrorText}</p>
  {:else if snapshot.refreshStatus === 'error' && snapshotErrorText}
    <p class="error-copy" role="alert">{snapshotErrorText}</p>
  {/if}

  {#if snapshot.refreshStatus === 'loading'}
    <p class="state-copy">Loading media playlist browser…</p>
  {:else if snapshot.refreshStatus === 'idle'}
    <p class="state-copy">
      No {safeMediaLabel(snapshot.media)} playlists loaded yet. Choose Refresh to load playlists from
      Kodi.
    </p>
  {:else if snapshot.isEmpty && snapshot.playlists.length > 0}
    <p class="state-copy">This playlist is empty.</p>
  {:else if snapshot.isEmpty}
    <p class="state-copy">No {safeMediaLabel(snapshot.media)} playlists are available.</p>
  {/if}

  <div class="browser-grid">
    <section class="playlists-section" aria-labelledby="media-playlists-list-title">
      <div class="section-heading">
        <h3 id="media-playlists-list-title">{safeMediaTitle(snapshot.media)} playlists</h3>
        <p>{snapshot.playlists.length} {plural('playlist', snapshot.playlists.length)}</p>
      </div>
      {#if snapshot.playlists.length === 0}
        <p class="empty-copy">No playlists in this snapshot.</p>
      {:else}
        <ul class="playlist-list">
          {#each snapshot.playlists as playlist, index (safeIndexedKey('playlist', playlist.id, index))}
            {@const label = safePlaylistLabel(playlist, index)}
            {@const id = stringOrNull(playlist.id)}
            {@const actionItem = playlistActionFor(playlist, index)}
            <li class="playlist-card">
              <div class="item-copy">
                <span class="item-kicker">{playlistKicker(playlist)}</span>
                <span class="item-title">{label}</span>
                <span class="item-meta">{playlistMeta(playlist)}</span>
              </div>

              {#if playlist.capabilities.canBrowse}
                <button
                  type="button"
                  class="action-button"
                  aria-label={`Open playlist ${label}`}
                  disabled={!id || isBrowseDisabled('playlist', id)}
                  onclick={() => handleOpenPlaylist(playlist, index)}
                >
                  Open
                </button>
              {/if}

              {#if actionItem}
                <div class="action-row" aria-label={`Actions for playlist ${label}`}>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Play playlist ${label}`}
                    disabled={isActionDisabled(actionItem)}
                    onclick={() => handlePlaylistAction('play', playlist, index)}
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Queue playlist ${label}`}
                    disabled={isActionDisabled(actionItem)}
                    onclick={() => handlePlaylistAction('queue', playlist, index)}
                  >
                    Queue
                  </button>
                </div>
              {:else if !playlist.capabilities.canBrowse}
                <button
                  type="button"
                  class="unsupported-button"
                  aria-label={`Unsupported playlist ${label}`}
                  disabled
                >
                  Unsupported
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="entries-section" aria-labelledby="media-playlists-entries-title">
      <div class="section-heading">
        <h3 id="media-playlists-entries-title">Playlist entries</h3>
        <p>{snapshot.entries.length} {plural('entry', snapshot.entries.length)}</p>
      </div>

      <nav class="breadcrumb-nav" aria-label="Breadcrumbs">
        <p class="breadcrumb">Breadcrumbs</p>
        {#if snapshot.breadcrumbs.length === 0}
          <p class="empty-copy">No playlist breadcrumbs yet.</p>
        {:else}
          <ol class="breadcrumb-list">
            {#each snapshot.breadcrumbs as crumb, index (safeIndexedKey('breadcrumb', crumb.id, index))}
              {@const label = safeBreadcrumbLabel(crumb, index)}
              {@const id = stringOrNull(crumb.id)}
              <li>
                <button
                  type="button"
                  class="breadcrumb-button"
                  aria-label={`Open breadcrumb ${label}`}
                  disabled={!id || isBrowseDisabled('breadcrumb', id)}
                  onclick={() => handleOpenBreadcrumb(crumb, index)}
                >
                  {label}
                </button>
              </li>
            {/each}
          </ol>
        {/if}
      </nav>

      {#if snapshot.entries.length === 0}
        <p class="empty-copy">No playlist entries in this snapshot.</p>
      {:else}
        <ul class="entry-list">
          {#each visibleEntries as entry, index (safeIndexedKey('entry', entry.id, index))}
            {@const label = safeEntryLabel(entry, index)}
            {@const entryAction = entryActionFor(entry, index)}
            <li class="entry-card">
              <div class="item-copy">
                <span class="item-kicker">{entryKicker(entry)}</span>
                <span class="item-title">{label}</span>
                <span class="item-meta">{entryMeta(entry)}</span>
              </div>
              {#if entryAction}
                <div class="action-row" aria-label={`Actions for ${label}`}>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Play ${label}`}
                    disabled={isEntryVerbDisabled('play', entry, entryAction)}
                    onclick={() => handleEntryAction('play', entry, index)}
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    class="action-button"
                    aria-label={`Queue ${label}`}
                    disabled={isEntryVerbDisabled('queue', entry, entryAction)}
                    onclick={() => handleEntryAction('queue', entry, index)}
                  >
                    Queue
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
        {#if entryVisibility.hasMore(snapshot.entries.length)}
          <button type="button" class="show-more-button" onclick={entryVisibility.showMore}>
            Show more entries
          </button>
        {/if}
      {/if}
    </section>
  </div>
</section>
