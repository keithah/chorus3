<script lang="ts" module>
  import type {
    MediaPlaylistCapabilitiesSnapshot,
    MediaPlaylistKind,
    MediaPlaylistsMedia
  } from '$lib/stores/mediaPlaylists.svelte';

  export interface MediaPlaylistsPanelDispatch {
    refresh: () => Promise<void> | void;
    openPlaylist: (id: string) => Promise<void> | void;
    openBreadcrumb: (id: string) => Promise<void> | void;
  }

  export interface MediaPlaylistsActionItem {
    id: string;
    label: string;
    media: MediaPlaylistsMedia;
    kind: MediaPlaylistKind;
    capabilities: MediaPlaylistCapabilitiesSnapshot;
  }

  export interface MediaPlaylistsActionDispatch {
    playPlaylistItem: (item: MediaPlaylistsActionItem) => Promise<void> | void;
    queuePlaylistItem: (item: MediaPlaylistsActionItem) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import type {
    MediaPlaylistEntrySnapshot,
    MediaPlaylistSnapshot,
    MediaPlaylistsBreadcrumbSnapshot,
    MediaPlaylistsStoreSnapshot
  } from '$lib/stores/mediaPlaylists.svelte';

  interface Props {
    snapshot: MediaPlaylistsStoreSnapshot;
    dispatch: MediaPlaylistsPanelDispatch;
    actionDispatch: MediaPlaylistsActionDispatch;
  }

  type BrowseOperationKind = 'refresh' | 'playlist' | 'breadcrumb';
  type PlaylistActionVerb = 'play' | 'queue';

  type PendingBrowseOperation = {
    kind: BrowseOperationKind;
    id: string;
  };

  type PendingPlaylistAction = {
    id: string;
    verb: PlaylistActionVerb;
    label: string;
    item: MediaPlaylistsActionItem;
  };

  let { snapshot, dispatch, actionDispatch }: Props = $props();

  let pendingBrowse = $state<PendingBrowseOperation | null>(null);
  let pendingAction = $state<PendingPlaylistAction | null>(null);
  let localStatusText = $state<string | null>(null);
  let localErrorText = $state<string | null>(null);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const snapshotErrorText = $derived(
    snapshot.lastError ? sanitizeUiText(snapshot.lastError.message) : null
  );
  const statusText = $derived(localStatusText ?? formatStatus(snapshot));

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

  async function handlePlaylistAction(
    verb: PlaylistActionVerb,
    playlist: MediaPlaylistSnapshot,
    index: number
  ): Promise<void> {
    const item = playlistActionFor(playlist, index);
    if (!item || isActionDisabled(item)) {
      return;
    }

    const label = item.label;
    pendingAction = { id: actionId(verb, item), verb, label, item };
    localErrorText = null;
    localStatusText = `${capitalize(verb === 'play' ? 'playing' : 'queueing')} playlist ${label}…`;

    try {
      if (verb === 'play') {
        await actionDispatch.playPlaylistItem(item);
      } else {
        await actionDispatch.queuePlaylistItem(item);
      }
      localStatusText = `${verb === 'play' ? 'Played' : 'Queued'} playlist ${label}.`;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : 'Playlist action failed.'
      );
      localErrorText = `Could not ${verb} playlist ${label}. ${message}`;
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

  function isActionDisabled(item: MediaPlaylistsActionItem): boolean {
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
    if (
      !id ||
      playlist.kind !== 'smart' ||
      !playlist.capabilities.canPlay ||
      !playlist.capabilities.canQueue
    ) {
      return null;
    }

    return {
      id,
      label: safePlaylistLabel(playlist, index),
      media: playlist.media,
      kind: playlist.kind,
      capabilities: { ...playlist.capabilities }
    };
  }

  function actionId(verb: PlaylistActionVerb, item: MediaPlaylistsActionItem): string {
    return `${verb}:playlist:${item.id}`;
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

    return 'Unsupported playlist';
  }

  function playlistMeta(playlist: MediaPlaylistSnapshot): string {
    if (playlist.kind === 'smart') {
      if (playlist.media === 'video') {
        return 'Can open, but video playback and queueing are disabled';
      }

      return 'Can open, play, and queue';
    }

    if (playlist.kind === 'basic') {
      return 'Standard playlist files are visible but cannot be opened, played, or queued yet';
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
      return 'Video item is browse-only in this view';
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

  function displayText(value: unknown, fallback: string): string {
    return textOrNull(value) ?? fallback;
  }

  function textOrNull(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed || looksLikePathOrUrl(trimmed)) {
      return null;
    }

    return sanitizeUiText(trimmed);
  }

  function stringOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  function safeEachKey(prefix: string, id: unknown, index: number): string {
    const value = stringOrNull(id);
    return value ? `${prefix}:${value}:${index}` : `${prefix}:missing:${index}`;
  }

  function plural(noun: string, count: number): string {
    if (count === 1) {
      return noun;
    }

    return noun === 'entry' ? 'entries' : `${noun}s`;
  }

  function sanitizeUiText(value: string): string {
    return value
      .replace(/raw response body/gi, 'response body [redacted]')
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[url]')
      .replace(/smb:\/\/[^\s]+/gi, '[path]')
      .replace(/special:\/\/(?:music|video)playlists[^\s]*/gi, '[playlist-path]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]{6,}/gi, 'credentials [redacted]')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/p@ssword/gi, '[redacted-password]')
      .replace(/username or password/gi, 'credentials')
      .replace(/localStorage/gi, 'browser storage')
      .replace(/sessionStorage/gi, 'browser storage');
  }

  function looksLikePathOrUrl(value: string): boolean {
    return (
      /^(?:https?:\/\/|smb:\/\/)/i.test(value) ||
      /^[a-z]:\\/i.test(value) ||
      /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
      /\\/.test(value)
    );
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
</script>

<section class="media-playlists-panel surface" aria-labelledby="media-playlists-title">
  <div class="panel-heading">
    <p class="section-kicker">Shared Playlists</p>
    <h2 id="media-playlists-title">Media Playlists</h2>
    <p class="summary-line">
      Browse Kodi {safeMediaLabel(snapshot.media)} smart playlists and {#if snapshot.media === 'video'}inspect
        browse-only playlist IDs{:else}safely play or queue supported playlist IDs{/if}.
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
    <p class="state-copy">No {safeMediaLabel(snapshot.media)} playlists loaded yet.</p>
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
          {#each snapshot.playlists as playlist, index (safeEachKey('playlist', playlist.id, index))}
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
            {#each snapshot.breadcrumbs as crumb, index (safeEachKey('breadcrumb', crumb.id, index))}
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
          {#each snapshot.entries as entry, index (safeEachKey('entry', entry.id, index))}
            {@const label = safeEntryLabel(entry, index)}
            <li class="entry-card">
              <div class="item-copy">
                <span class="item-kicker">{entryKicker(entry)}</span>
                <span class="item-title">{label}</span>
                <span class="item-meta">{entryMeta(entry)}</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</section>

<style>
  .media-playlists-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .panel-heading,
  .toolbar,
  .playlists-section,
  .entries-section,
  .section-heading,
  .playlist-card,
  .entry-card,
  .item-copy,
  .breadcrumb-nav {
    display: grid;
    gap: var(--space-xs);
  }

  .section-kicker,
  h2,
  h3,
  p,
  ul,
  ol {
    margin: 0;
  }

  .section-kicker,
  .breadcrumb,
  .item-kicker,
  .section-heading p {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .section-kicker,
  .breadcrumb,
  .item-kicker {
    color: var(--color-accent);
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(1.4rem, 3vw, 2.1rem);
    line-height: 1.08;
    text-wrap: balance;
  }

  h3 {
    font-size: 1.08rem;
    line-height: 1.2;
    text-wrap: balance;
  }

  .summary-line,
  .state-copy,
  .empty-copy,
  .error-copy,
  .item-meta,
  .section-heading p {
    color: var(--color-text-muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .toolbar,
  .section-heading {
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-md);
  }

  .toolbar,
  .playlists-section,
  .entries-section {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 64%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .browser-grid {
    display: grid;
    grid-template-columns: minmax(14rem, 0.85fr) minmax(0, 1.15fr);
    gap: var(--space-md);
  }

  .playlist-list,
  .entry-list,
  .breadcrumb-list,
  .action-row {
    display: grid;
    gap: var(--space-xs);
    padding: 0;
    list-style: none;
  }

  .breadcrumb-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .breadcrumb-list li:not(:last-child)::after {
    content: '/';
    margin-inline: var(--space-xs);
    color: var(--color-text-muted);
  }

  .playlist-card,
  .entry-card {
    min-width: 0;
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-surface) 66%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 72%, transparent);
  }

  .playlist-card {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .action-row {
    grid-template-columns: repeat(2, minmax(5rem, 1fr));
  }

  .primary-button,
  .breadcrumb-button,
  .action-button,
  .unsupported-button {
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    font: inherit;
    color: var(--color-text);
    font-weight: 800;
    cursor: pointer;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      opacity 140ms ease,
      background-color 140ms ease;
  }

  .primary-button {
    background: color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-raised));
  }

  .breadcrumb-button,
  .action-button {
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  }

  .unsupported-button {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-border) 34%, var(--color-surface));
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  button:active:not(:disabled) {
    transform: scale(0.96);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .item-title {
    overflow-wrap: anywhere;
    font-weight: 800;
  }

  .item-meta {
    overflow-wrap: anywhere;
    font-size: 0.9rem;
  }

  .status-line {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-surface-raised) 74%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .error-copy {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-danger, #c2410c) 12%, var(--color-surface-raised));
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--color-danger, #c2410c) 36%, var(--color-border));
  }

  @media (max-width: 860px) {
    .browser-grid,
    .toolbar,
    .section-heading,
    .playlist-card {
      grid-template-columns: 1fr;
    }

    .primary-button,
    .action-button,
    .unsupported-button {
      width: 100%;
    }
  }
</style>
