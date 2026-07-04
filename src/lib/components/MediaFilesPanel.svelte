<script lang="ts" module>
  import type { MediaFilesMedia } from '$lib/stores/mediaFiles.svelte';

  export interface MediaFilesPanelDispatch {
    refresh: () => Promise<void> | void;
    openSource: (id: string) => Promise<void> | void;
    openEntry: (id: string) => Promise<void> | void;
    openPath?: (path: string) => Promise<void> | void;
    openBreadcrumb: (id: string) => Promise<void> | void;
  }

  export interface MediaFilesActionItem {
    id: string;
    label: string;
    media: MediaFilesMedia;
  }

  export interface MediaFilesActionDispatch {
    playFileItem: (item: MediaFilesActionItem) => Promise<void> | void;
    queueFileItem: (item: MediaFilesActionItem) => Promise<void> | void;
    queueFileItems?: (items: readonly MediaFilesActionItem[]) => Promise<void> | void;
    downloadFileItem: (item: MediaFilesActionItem) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import './mediaFilesPanelClassic.css';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';
  import { createIncrementalVisibility } from './incrementalVisibility.svelte';
  import { safeStableKey, stringOrNull } from './listKeyHelpers';
  import { displayText, sanitizeUiText, textOrNull } from './textFormatting';
  import type {
    MediaDirectoryEntrySnapshot,
    MediaFileSourceSnapshot,
    MediaFilesBreadcrumbSnapshot,
    MediaFilesStoreSnapshot
  } from '$lib/stores/mediaFiles.svelte';

  interface Props {
    snapshot: MediaFilesStoreSnapshot;
    dispatch: MediaFilesPanelDispatch;
    i18n?: TranslationContext;
    actionDispatch: MediaFilesActionDispatch;
  }

  type BrowseOperationKind = 'refresh' | 'source' | 'entry' | 'breadcrumb';
  type FileActionVerb = 'play' | 'queue' | 'download';

  type PendingBrowseOperation = {
    kind: BrowseOperationKind;
    id: string;
  };

  type PendingFileAction = {
    id: string;
    verb: FileActionVerb;
    label: string;
    item: MediaFilesActionItem;
  };

  let {
    snapshot,
    dispatch,
    actionDispatch,
    i18n = createEnglishTranslationContext()
  }: Props = $props();

  let pendingBrowse = $state<PendingBrowseOperation | null>(null);
  let pendingAction = $state<PendingFileAction | null>(null);
  let localStatusText = $state<string | null>(null);
  let localErrorText = $state<string | null>(null);
  const entryVisibility = createIncrementalVisibility(96);

  const isLoading = $derived(snapshot.refreshStatus === 'loading');
  const statusText = $derived(localStatusText ?? formatStatus(snapshot));
  const visibleEntries = $derived(entryVisibility.visibleItems(snapshot.entries));

  async function handleRefresh(): Promise<void> {
    if (isBrowseDisabled('refresh', 'refresh')) {
      return;
    }

    pendingBrowse = { kind: 'refresh', id: 'refresh' };
    localErrorText = null;
    localStatusText = 'Refreshing media file sources…';

    try {
      await dispatch.refresh();
      localStatusText = null;
    } catch (error) {
      const message = sanitizeUiText(error instanceof Error ? error.message : 'Refresh failed.');
      localErrorText = `Could not refresh media files. ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingBrowse = null;
    }
  }

  async function handleOpenSource(source: MediaFileSourceSnapshot, index: number): Promise<void> {
    const id = stringOrNull(source.id);
    if (!id || isBrowseDisabled('source', id)) {
      return;
    }

    const label = safeSourceLabel(source, index);
    await runBrowseOperation({
      kind: 'source',
      id,
      pendingCopy: `Opening source ${label}…`,
      errorCopy: `Could not open source ${label}.`,
      run: () => dispatch.openSource(id)
    });
  }

  async function handleOpenEntry(entry: MediaDirectoryEntrySnapshot, index: number): Promise<void> {
    const id = stringOrNull(entry.id);
    if (!id || !entry.capabilities.canBrowse || isBrowseDisabled('entry', id)) {
      return;
    }

    const label = safeEntryLabel(entry, index);
    await runBrowseOperation({
      kind: 'entry',
      id,
      pendingCopy: `Opening folder ${label}…`,
      errorCopy: `Could not open folder ${label}.`,
      run: () => dispatch.openEntry(id)
    });
  }

  async function handleOpenBreadcrumb(
    breadcrumb: MediaFilesBreadcrumbSnapshot,
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

  async function handleFileAction(
    verb: FileActionVerb,
    entry: MediaDirectoryEntrySnapshot,
    index: number
  ): Promise<void> {
    const item = fileActionFor(entry, index);
    if (!item || isActionDisabled(item)) {
      return;
    }

    const label = item.label;
    pendingAction = { id: actionId(verb, item), verb, label, item };
    localErrorText = null;
    localStatusText = `${fileActionPendingCopy(verb)} file ${label}…`;

    try {
      if (verb === 'play') {
        await actionDispatch.playFileItem(item);
      } else if (verb === 'queue') {
        await actionDispatch.queueFileItem(item);
      } else {
        await actionDispatch.downloadFileItem(item);
      }
      localStatusText = `${fileActionDoneCopy(verb)} file ${label}.`;
    } catch (error) {
      const message = sanitizeUiText(
        error instanceof Error ? error.message : 'File action failed.'
      );
      localErrorText = `Could not ${fileActionErrorCopy(verb)} file ${label}. ${message}`;
      localStatusText = localErrorText;
    } finally {
      pendingAction = null;
    }
  }

  function formatStatus(value: MediaFilesStoreSnapshot): string {
    const media = safeMediaLabel(value.media);

    if (value.refreshStatus === 'loading') {
      return `Loading ${media} files…`;
    }

    if (value.refreshStatus === 'error' && value.lastError) {
      return sanitizeUiText(value.lastError.message);
    }

    if (value.refreshStatus === 'idle') {
      return `Load Kodi ${media} file sources.`;
    }

    if (value.isEmpty) {
      return `No ${media} files found.`;
    }

    const sourceCount = value.sources.length;
    const entryCount = value.entries.length;
    const updated = textOrNull(value.lastUpdatedAt);
    const updatedCopy = updated ? ` Last updated ${updated}.` : '';
    return `Showing ${media} files. ${sourceCount} ${plural('source', sourceCount)}, ${entryCount} ${plural('entry', entryCount)}.${updatedCopy}`;
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

  function isActionDisabled(item: MediaFilesActionItem): boolean {
    if (isLoading) {
      return true;
    }

    if (!pendingAction) {
      return false;
    }

    return pendingAction.item.id === item.id;
  }

  function fileActionFor(
    entry: MediaDirectoryEntrySnapshot,
    index: number
  ): MediaFilesActionItem | null {
    const id = stringOrNull(entry.id);
    if (
      !id ||
      entry.kind !== 'file' ||
      (!entry.capabilities.canDownload &&
        !entry.capabilities.canPlay &&
        !entry.capabilities.canQueue)
    ) {
      return null;
    }

    return {
      id,
      label: safeEntryLabel(entry, index),
      media: snapshot.media
    };
  }

  function actionId(verb: FileActionVerb, item: MediaFilesActionItem): string {
    return `${verb}:file:${item.id}`;
  }

  function fileActionPendingCopy(verb: FileActionVerb): string {
    if (verb === 'play') {
      return 'Playing';
    }

    if (verb === 'queue') {
      return 'Queueing';
    }

    return 'Preparing download for';
  }

  function fileActionDoneCopy(verb: FileActionVerb): string {
    if (verb === 'play') {
      return 'Played';
    }

    if (verb === 'queue') {
      return 'Queued';
    }

    return 'Started download for';
  }

  function fileActionErrorCopy(verb: FileActionVerb): string {
    return verb === 'download' ? 'download' : verb;
  }

  function safeSourceLabel(source: MediaFileSourceSnapshot, index: number): string {
    return displayText(source.label, `Source ${index + 1}`);
  }

  function safeBreadcrumbLabel(breadcrumb: MediaFilesBreadcrumbSnapshot, index: number): string {
    return displayText(breadcrumb.label, `Location ${index + 1}`);
  }

  function safeEntryLabel(entry: MediaDirectoryEntrySnapshot, index: number): string {
    const fallback =
      entry.kind === 'directory' ? `Folder ${index + 1}` : `${fileKindLabel(entry)} ${index + 1}`;
    return displayText(entry.label, fallback);
  }

  function entryKicker(entry: MediaDirectoryEntrySnapshot): string {
    return entry.kind === 'directory' ? 'Folder' : fileKindLabel(entry);
  }

  function fileKindLabel(entry: MediaDirectoryEntrySnapshot): string {
    if (entry.mediaKind === 'audio') {
      return 'Audio file';
    }

    if (entry.mediaKind === 'video') {
      return 'Video file';
    }

    return 'Unsupported file';
  }

  function entryMeta(entry: MediaDirectoryEntrySnapshot): string {
    if (entry.kind === 'directory') {
      return 'Browse folder';
    }

    const extension = textOrNull(entry.extension);
    const type = fileKindLabel(entry);
    return extension ? `${type} · .${extension}` : type;
  }

  function browseReasonCopy(reason: string): string {
    if (reason === 'manual') {
      return 'Manual refresh';
    }

    if (reason === 'init') {
      return 'Initial state';
    }

    if (reason.startsWith('source:')) {
      return 'Source directory';
    }

    if (reason.startsWith('directory:')) {
      return 'Folder directory';
    }

    if (reason.startsWith('error:')) {
      return 'Error state';
    }

    return 'Media files';
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

<section class="media-files-panel surface" aria-labelledby="media-files-title">
  <div class="panel-heading">
    <p class="section-kicker">{i18n.t('media.files.kicker')}</p>
    <h2 id="media-files-title">{i18n.t('media.files.title')}</h2>
    <p class="summary-line">
      Browse Kodi {safeMediaLabel(snapshot.media)} sources and safely play or queue supported audio files.
    </p>
  </div>

  <div class="toolbar" aria-label="Media files controls">
    <div>
      <p class="breadcrumb">{browseReasonCopy(snapshot.lastRefreshReason)}</p>
      <p class="summary-line">
        {snapshot.sources.length}
        {plural('source', snapshot.sources.length)} · {snapshot.entries.length}
        {plural('entry', snapshot.entries.length)}
      </p>
    </div>
    <button
      type="button"
      class="primary-button"
      aria-label="Refresh media file sources"
      disabled={isBrowseDisabled('refresh', 'refresh')}
      onclick={handleRefresh}
    >
      Refresh sources
    </button>
  </div>

  <div class="status-line" aria-live="polite" aria-atomic="true" role="status">{statusText}</div>
  {#if localErrorText}
    <p class="error-copy" role="alert">{localErrorText}</p>
  {/if}

  {#if snapshot.refreshStatus === 'loading'}
    <p class="state-copy">Loading media file browser…</p>
  {:else if snapshot.refreshStatus === 'idle'}
    <p class="state-copy">No {safeMediaLabel(snapshot.media)} file sources loaded yet.</p>
  {:else if snapshot.isEmpty && snapshot.sources.length > 0}
    <p class="state-copy">This directory is empty.</p>
  {:else if snapshot.isEmpty}
    <p class="state-copy">No {safeMediaLabel(snapshot.media)} file sources are available.</p>
  {/if}

  <div class="browser-grid">
    <section class="sources-section" aria-labelledby="media-files-sources-title">
      <div class="section-heading">
        <h3 id="media-files-sources-title">Music sources</h3>
        <p>{snapshot.sources.length} {plural('source', snapshot.sources.length)}</p>
      </div>
      {#if snapshot.sources.length === 0}
        <p class="empty-copy">No sources in this snapshot.</p>
      {:else}
        <ul class="choice-list">
          {#each snapshot.sources as source, index (safeStableKey('source', source.id, index))}
            {@const label = safeSourceLabel(source, index)}
            {@const id = stringOrNull(source.id)}
            <li>
              <button
                type="button"
                class="choice-button"
                aria-label={`Open source ${label}`}
                disabled={!id || isBrowseDisabled('source', id)}
                onclick={() => handleOpenSource(source, index)}
              >
                <span class="button-kicker">Source</span>
                <span class="item-title">{label}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="directory-section" aria-labelledby="media-files-directory-title">
      <div class="section-heading">
        <h3 id="media-files-directory-title">Directory</h3>
        <p>{snapshot.entries.length} {plural('entry', snapshot.entries.length)}</p>
      </div>

      <nav class="breadcrumb-nav" aria-label="Breadcrumbs">
        <p class="breadcrumb">Breadcrumbs</p>
        {#if snapshot.breadcrumbs.length === 0}
          <p class="empty-copy">No folder breadcrumbs yet.</p>
        {:else}
          <ol class="breadcrumb-list">
            {#each snapshot.breadcrumbs as crumb, index (safeStableKey('breadcrumb', crumb.id, index))}
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
        <p class="empty-copy">No directory entries in this snapshot.</p>
      {:else}
        <ul class="entry-list">
          {#each visibleEntries as entry, index (safeStableKey('entry', entry.id, index))}
            {@const label = safeEntryLabel(entry, index)}
            {@const actionItem = fileActionFor(entry, index)}
            {@const id = stringOrNull(entry.id)}
            <li class="entry-card">
              <div class="entry-copy">
                <span class="item-kicker">{entryKicker(entry)}</span>
                <span class="item-title">{label}</span>
                <span class="item-meta">{entryMeta(entry)}</span>
              </div>

              {#if entry.kind === 'directory' && entry.capabilities.canBrowse}
                <button
                  type="button"
                  class="action-button"
                  aria-label={`Open folder ${label}`}
                  disabled={!id || isBrowseDisabled('entry', id)}
                  onclick={() => handleOpenEntry(entry, index)}
                >
                  Open
                </button>
              {:else if actionItem}
                <div class="action-row" aria-label={`Actions for file ${label}`}>
                  {#if entry.capabilities.canPlay}
                    <button
                      type="button"
                      class="action-button"
                      aria-label={`Play file ${label}`}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() => handleFileAction('play', entry, index)}
                    >
                      Play
                    </button>
                  {/if}
                  {#if entry.capabilities.canQueue}
                    <button
                      type="button"
                      class="action-button"
                      aria-label={`Queue file ${label}`}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() => handleFileAction('queue', entry, index)}
                    >
                      Queue
                    </button>
                  {/if}
                  {#if entry.capabilities.canDownload}
                    <button
                      type="button"
                      class="action-button"
                      aria-label={`Download file ${label}`}
                      disabled={isActionDisabled(actionItem)}
                      onclick={() => handleFileAction('download', entry, index)}
                    >
                      Download
                    </button>
                  {/if}
                </div>
              {:else if entry.kind === 'file'}
                <button
                  type="button"
                  class="unsupported-button"
                  aria-label={`Unsupported file ${label}`}
                  disabled
                >
                  Unsupported
                </button>
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
