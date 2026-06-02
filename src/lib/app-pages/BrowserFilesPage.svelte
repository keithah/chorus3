<script lang="ts">
  import { buildPrimaryAppRoute, type BuildAppRouteOptions } from '$lib/app/appRouter';
  import type {
    MediaFilesActionDispatch,
    MediaFilesPanelDispatch
  } from '$components/MediaFilesPanel.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type {
    MediaDirectoryEntrySnapshot,
    MediaFileSourceSnapshot,
    MediaFilesStoreSnapshot,
    MediaFilesMedia
  } from '$lib/stores';
  import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
  import { createIncrementalVisibility } from '$components/incrementalVisibility.svelte';

  interface Props {
    route?: PrimaryRoute;
    snapshot: MediaFilesStoreSnapshot;
    musicSnapshot?: MediaFilesStoreSnapshot;
    videoSnapshot?: MediaFilesStoreSnapshot;
    dispatch: MediaFilesPanelDispatch;
    musicDispatch?: MediaFilesPanelDispatch;
    videoDispatch?: MediaFilesPanelDispatch;
    actionDispatch: MediaFilesActionDispatch;
    buildOptions?: BuildAppRouteOptions;
  }

  type SourceGroup = {
    title: string;
    media: MediaFilesMedia;
    items: Array<{
      label: string;
      href: string;
      active: boolean;
      kind: 'source' | 'playlist';
      media: MediaFilesMedia;
      sourceId?: string;
    }>;
  };

  type BrowserEntryPartitions = {
    folders: MediaDirectoryEntrySnapshot[];
    files: MediaDirectoryEntrySnapshot[];
    playable: MediaDirectoryEntrySnapshot[];
    queueable: MediaDirectoryEntrySnapshot[];
  };

  type BrowserSortMode = 'none' | 'label' | 'dateadded' | 'year' | 'random';
  type BrowserSortOrder = 'ascending' | 'descending';

  let {
    route = { kind: 'browser' },
    snapshot,
    musicSnapshot,
    videoSnapshot,
    dispatch,
    musicDispatch,
    videoDispatch,
    actionDispatch,
    buildOptions = {}
  }: Props = $props();

  let sortMode = $state<BrowserSortMode>(storedBrowserSort().method);
  let sortOrder = $state<BrowserSortOrder>(storedBrowserSort().order);
  let lastRouteItemKey = $state('');
  const fileVisibility = createIncrementalVisibility(250);
  const folderVisibility = createIncrementalVisibility(250);

  const activeMedia = $derived(
    route.kind === 'browserItem' && route.media === 'video' ? 'video' : snapshot.media
  );
  const currentMusicSnapshot = $derived(
    musicSnapshot ?? (snapshot.media === 'music' ? snapshot : null)
  );
  const currentVideoSnapshot = $derived(
    videoSnapshot ?? (snapshot.media === 'video' ? snapshot : null)
  );
  const groups = $derived(buildGroups(currentMusicSnapshot, currentVideoSnapshot, activeMedia));
  const title = $derived(
    snapshot.breadcrumbs.at(-1)?.label ?? (activeMedia === 'video' ? 'Video' : 'Music')
  );
  const contentItems = $derived(snapshot.entries.length ? snapshot.entries : []);
  const sortedContentItems = $derived(sortEntries(contentItems, sortMode, sortOrder));
  const sortedPartitions = $derived(partitionBrowserEntries(sortedContentItems));
  const sortedFolderItems = $derived(sortedPartitions.folders);
  const sortedFileItems = $derived(sortedPartitions.files);
  const visibleFolderItems = $derived(folderVisibility.visibleItems(sortedFolderItems));
  const visibleFileItems = $derived(fileVisibility.visibleItems(sortedFileItems));
  const playableContentItems = $derived(sortedPartitions.playable);
  const queueableContentItems = $derived(sortedPartitions.queueable);
  const parentBreadcrumb = $derived(
    snapshot.breadcrumbs.length >= 2 ? snapshot.breadcrumbs.at(-2) : null
  );

  $effect(() => {
    if (route.kind !== 'browserItem') {
      return;
    }

    const key = `${route.media}:${route.itemid}:${snapshot.sources.map((source) => source.id).join('|')}`;
    if (key === lastRouteItemKey) {
      return;
    }

    lastRouteItemKey = key;
    void openRouteItem(route.media, route.itemid);
  });

  function buildGroups(
    musicValue: MediaFilesStoreSnapshot | null,
    videoValue: MediaFilesStoreSnapshot | null,
    media: MediaFilesMedia
  ): SourceGroup[] {
    const videoSources = videoValue?.sources.length
      ? videoValue.sources.map((source) => ({
          label: source.label,
          href: browserHref('video', source.id),
          active: media === 'video',
          kind: 'source' as const,
          media: 'video' as const,
          sourceId: source.id
        }))
      : [
          {
            label: 'Movies',
            href: browserHref('video', 'movies'),
            active: media === 'video',
            kind: 'source' as const,
            media: 'video' as const,
            sourceId: 'movies'
          }
        ];
    const musicSources = musicValue?.sources.length
      ? musicValue.sources.map((source) => ({
          label: source.label,
          href: browserHref('music', source.id),
          active: media === 'music',
          kind: 'source' as const,
          media: 'music' as const,
          sourceId: source.id
        }))
      : [
          {
            label: 'Music',
            href: browserHref('music', 'music'),
            active: media === 'music',
            kind: 'source' as const,
            media: 'music' as const,
            sourceId: 'music'
          }
        ];

    return [
      { title: 'Video', media: 'video', items: videoSources },
      {
        title: 'Music',
        media: 'music',
        items: musicSources
      }
    ];
  }

  function browserHref(media: MediaFilesMedia, id: string): string {
    return buildPrimaryAppRoute({ kind: 'browserItem', media, itemid: id }, buildOptions);
  }

  function routeIdForEntry(entry: MediaDirectoryEntrySnapshot): string {
    return entry.routeId ?? entry.id;
  }

  function sortEntries(
    entries: readonly MediaDirectoryEntrySnapshot[],
    mode: BrowserSortMode,
    order: BrowserSortOrder
  ): MediaDirectoryEntrySnapshot[] {
    const sorted = [...entries];
    if (mode === 'none') {
      return sorted;
    }

    if (mode === 'random') {
      return stableRandomSort(sorted);
    }

    sorted.sort((a, b) => {
      if (mode === 'dateadded') {
        const dateOrder = (b.dateadded ?? '').localeCompare(a.dateadded ?? '');
        if (dateOrder !== 0) return sortDirection(order) * dateOrder;
      }

      if (mode === 'year') {
        const yearOrder =
          (b.year ?? Number.NEGATIVE_INFINITY) - (a.year ?? Number.NEGATIVE_INFINITY);
        if (yearOrder !== 0) return sortDirection(order) * yearOrder;
      }

      const labelOrder = a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
      return sortDirection(order) * labelOrder;
    });

    return sorted;
  }

  function partitionBrowserEntries(
    entries: readonly MediaDirectoryEntrySnapshot[]
  ): BrowserEntryPartitions {
    const partitions: BrowserEntryPartitions = {
      folders: [],
      files: [],
      playable: [],
      queueable: []
    };
    for (const entry of entries) {
      if (entry.kind === 'directory') {
        partitions.folders.push(entry);
      } else if (entry.kind === 'file') {
        partitions.files.push(entry);
      }
      if (entry.capabilities.canPlay) {
        partitions.playable.push(entry);
      }
      if (entry.capabilities.canQueue) {
        partitions.queueable.push(entry);
      }
    }
    return partitions;
  }

  function sortDirection(order: BrowserSortOrder): 1 | -1 {
    return order === 'descending' ? -1 : 1;
  }

  function selectBrowserSort(method: BrowserSortMode): void {
    if (sortMode === method && method !== 'none') {
      sortOrder = sortOrder === 'ascending' ? 'descending' : 'ascending';
    } else {
      sortMode = method;
      sortOrder = 'ascending';
    }
    storeBrowserSort({ method: sortMode, order: sortOrder });
  }

  function storedBrowserSort(): { method: BrowserSortMode; order: BrowserSortOrder } {
    if (typeof localStorage === 'undefined') {
      return { method: 'none', order: 'ascending' };
    }
    try {
      const parsed = JSON.parse(localStorage.getItem('browserSort') ?? '{}') as {
        method?: unknown;
        order?: unknown;
      };
      return {
        method: isBrowserSortMode(parsed.method) ? parsed.method : 'none',
        order: isBrowserSortOrder(parsed.order) ? parsed.order : 'ascending'
      };
    } catch {
      return { method: 'none', order: 'ascending' };
    }
  }

  function storeBrowserSort(value: { method: BrowserSortMode; order: BrowserSortOrder }): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('browserSort', JSON.stringify(value));
    }
  }

  function isBrowserSortMode(value: unknown): value is BrowserSortMode {
    return (
      value === 'none' ||
      value === 'label' ||
      value === 'dateadded' ||
      value === 'year' ||
      value === 'random'
    );
  }

  function isBrowserSortOrder(value: unknown): value is BrowserSortOrder {
    return value === 'ascending' || value === 'descending';
  }

  function stableRandomSort(entries: MediaDirectoryEntrySnapshot[]): MediaDirectoryEntrySnapshot[] {
    return entries.sort((a, b) => {
      const left = hashText(routeIdForEntry(a));
      const right = hashText(routeIdForEntry(b));
      if (left !== right) return left - right;
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    });
  }

  function hashText(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
  }

  async function openRouteItem(media: string, itemid: string): Promise<void> {
    const targetDispatch = dispatchForMedia(media === 'video' ? 'video' : 'music');

    if (itemid === 'root') {
      await targetDispatch.refresh();
      return;
    }

    if (itemid.startsWith('source:')) {
      await targetDispatch.openSource(itemid);
      return;
    }

    if (itemid.startsWith('entry:')) {
      await targetDispatch.openEntry(itemid);
      return;
    }

    await targetDispatch.openPath?.(itemid);
  }

  async function openSourceId(
    event: MouseEvent,
    item: SourceGroup['items'][number]
  ): Promise<void> {
    const { sourceId } = item;
    if (!sourceId) return;
    event.preventDefault();
    await dispatchForMedia(item.media).openSource(sourceId);
    navigateToHref(item.href);
  }

  async function openSource(event: MouseEvent, source: MediaFileSourceSnapshot): Promise<void> {
    event.preventDefault();
    await dispatch.openSource(source.id);
    navigateToHref(browserHref(snapshot.media, source.id));
  }

  async function openEntry(event: MouseEvent, entry: MediaDirectoryEntrySnapshot): Promise<void> {
    event.preventDefault();
    if (entry.capabilities.canBrowse) {
      await dispatch.openEntry(entry.id);
      navigateToHref(browserHref(snapshot.media, routeIdForEntry(entry)));
    }
  }

  async function openBreadcrumb(
    event: MouseEvent,
    breadcrumb: { id: string; label: string }
  ): Promise<void> {
    event.preventDefault();
    await dispatch.openBreadcrumb(breadcrumb.id);
    navigateToHref(browserHref(snapshot.media, breadcrumb.id));
  }

  function dispatchForMedia(media: MediaFilesMedia): MediaFilesPanelDispatch {
    if (media === 'video') {
      return videoDispatch ?? dispatch;
    }

    return musicDispatch ?? dispatch;
  }

  function navigateToHref(href: string): void {
    if (href.startsWith('#') && typeof globalThis.location?.hash === 'string') {
      globalThis.location.hash = href;
      return;
    }

    globalThis.history?.pushState?.({}, '', href);
    globalThis.dispatchEvent?.(new PopStateEvent('popstate'));
  }

  async function playEntry(entry: MediaDirectoryEntrySnapshot): Promise<void> {
    if (!entry.capabilities.canPlay) return;
    await actionDispatch.playFileItem({
      id: entry.id,
      label: entry.label,
      media: snapshot.media
    });
  }

  async function queueEntry(entry: MediaDirectoryEntrySnapshot): Promise<void> {
    if (!entry.capabilities.canQueue) return;
    await actionDispatch.queueFileItem({
      id: entry.id,
      label: entry.label,
      media: snapshot.media
    });
  }

  async function playCurrentFolder(): Promise<void> {
    for (const entry of playableContentItems) {
      await playEntry(entry);
    }
  }

  async function queueCurrentFolder(): Promise<void> {
    for (const entry of queueableContentItems) {
      await queueEntry(entry);
    }
  }

  async function downloadEntry(entry: MediaDirectoryEntrySnapshot): Promise<void> {
    if (!entry.capabilities.canDownload) return;
    await actionDispatch.downloadFileItem({
      id: entry.id,
      label: entry.label,
      media: snapshot.media
    });
  }
</script>

<section class="classic-browser-page" aria-labelledby="browser-files-title">
  <aside class="classic-browser-nav">
    {#each groups as group}
      <section>
        <h2>{group.title}</h2>
        <nav aria-label={`${group.title} browser sources`}>
          {#each group.items as item}
            <a
              href={item.href}
              class:active={item.active}
              onclick={(event) => void openSourceId(event, item)}
            >
              <span aria-hidden="true">{item.kind === 'playlist' ? '▣' : '▱'}</span>
              {item.label}
            </a>
          {/each}
        </nav>
      </section>
    {/each}
  </aside>

  <div class="classic-browser-content">
    <header>
      <div class="classic-browser-heading">
        <h2 id="browser-files-title">{title}</h2>
        {#if snapshot.breadcrumbs.length}
          <nav class="classic-browser-breadcrumbs" aria-label="Browser path">
            {#each snapshot.breadcrumbs as breadcrumb, index}
              <a
                href={browserHref(snapshot.media, breadcrumb.id)}
                onclick={(event) => void openBreadcrumb(event, breadcrumb)}
              >
                {breadcrumb.label}
              </a>
              {#if index < snapshot.breadcrumbs.length - 1}
                <span aria-hidden="true">/</span>
              {/if}
            {/each}
          </nav>
        {/if}
      </div>
      <div class="classic-browser-toolbar">
        <button
          type="button"
          disabled={playableContentItems.length === 0}
          onclick={() => void playCurrentFolder()}>Play files</button
        >
        <button
          type="button"
          disabled={queueableContentItems.length === 0}
          onclick={() => void queueCurrentFolder()}>Queue files</button
        >
        <details class="sort-wrapper">
          <summary aria-label="Sort">Sort</summary>
          <ul class="sorts">
            {#each [['none', 'default'], ['label', 'title'], ['dateadded', 'date added'], ['year', 'year'], ['random', 'random']] as [method, label]}
              <li>
                <button
                  type="button"
                  class:active={sortMode === method}
                  class:order-ascending={sortMode === method && sortOrder === 'ascending'}
                  class:order-descending={sortMode === method && sortOrder === 'descending'}
                  onclick={() => selectBrowserSort(method as BrowserSortMode)}
                >
                  {label}
                </button>
              </li>
            {/each}
          </ul>
        </details>
      </div>
    </header>

    <div class="classic-browser-columns">
      <div class="classic-browser-list classic-browser-files" aria-label="Files">
        {#if sortedFileItems.length}
          {#each visibleFileItems as entry}
            {@const entryThumb = optionalKodiImageUrl(entry.thumbnail)}
            <article class="file-row">
              <button
                class="classic-browser-thumb"
                type="button"
                disabled={!entry.capabilities.canPlay}
                title={`Play ${entry.label}`}
                onclick={() => void playEntry(entry)}
              >
                {#if entryThumb}
                  <img src={entryThumb} alt="" loading="lazy" decoding="async" />
                {:else}
                  <span aria-hidden="true">▶</span>
                {/if}
              </button>
              <button
                class="classic-browser-title"
                type="button"
                disabled={!entry.capabilities.canPlay}
                ondblclick={() => void playEntry(entry)}
                onclick={() => void playEntry(entry)}>{entry.label}</button
              >
              <span class="classic-browser-actions">
                <button
                  type="button"
                  disabled={!entry.capabilities.canQueue}
                  title={`Queue ${entry.label}`}
                  onclick={() => void queueEntry(entry)}>+</button
                >
                {#if entry.capabilities.canDownload}
                  <button
                    type="button"
                    title={`Download ${entry.label}`}
                    onclick={() => void downloadEntry(entry)}>⇩</button
                  >
                {/if}
              </span>
            </article>
          {/each}
          {#if fileVisibility.hasMore(sortedFileItems.length)}
            <button
              type="button"
              class="classic-browser-show-more"
              onclick={fileVisibility.showMore}
            >
              Show more files
            </button>
          {/if}
        {:else if !contentItems.length && snapshot.sources.length}
          {#each snapshot.sources as source}
            <article>
              <span class="classic-browser-thumb" aria-hidden="true"></span>
              <a
                href={browserHref(snapshot.media, source.id)}
                onclick={(event) => void openSource(event, source)}>{source.label}</a
              >
              <span aria-hidden="true">⋯</span>
            </article>
          {/each}
        {:else}
          <p>no media in this folder</p>
        {/if}
      </div>
      <div class="classic-browser-list classic-browser-folders" aria-label="Folders">
        {#if parentBreadcrumb}
          <article class="back-row">
            <button
              class="classic-browser-thumb"
              type="button"
              title="Back"
              onclick={(event) => void openBreadcrumb(event, parentBreadcrumb)}
            >
              <span aria-hidden="true">↩</span>
            </button>
            <button
              class="classic-browser-title"
              type="button"
              onclick={(event) => void openBreadcrumb(event, parentBreadcrumb)}>Back</button
            >
            <span aria-hidden="true"></span>
          </article>
        {/if}
        {#if sortedFolderItems.length}
          {#each visibleFolderItems as entry}
            {@const entryThumb = optionalKodiImageUrl(entry.thumbnail)}
            <article class="folder-row">
              <button
                class="classic-browser-thumb"
                type="button"
                title={`Open ${entry.label}`}
                onclick={(event) => void openEntry(event, entry)}
              >
                {#if entryThumb}
                  <img src={entryThumb} alt="" loading="lazy" decoding="async" />
                {:else}
                  <span aria-hidden="true">▱</span>
                {/if}
              </button>
              <button
                class="classic-browser-title"
                type="button"
                onclick={(event) => void openEntry(event, entry)}>{entry.label}</button
              >
              <span class="classic-browser-actions">
                <button
                  type="button"
                  disabled={!entry.capabilities.canPlay}
                  title={`Play ${entry.label}`}
                  onclick={() => void playEntry(entry)}>▶</button
                >
                <button
                  type="button"
                  disabled={!entry.capabilities.canQueue}
                  title={`Queue ${entry.label}`}
                  onclick={() => void queueEntry(entry)}>+</button
                >
              </span>
            </article>
          {/each}
          {#if folderVisibility.hasMore(sortedFolderItems.length)}
            <button
              type="button"
              class="classic-browser-show-more"
              onclick={folderVisibility.showMore}
            >
              Show more folders
            </button>
          {/if}
        {:else if !contentItems.length}
          <div class="classic-browser-intro">
            <h3><span aria-hidden="true">←</span> Browse files and add-ons</h3>
            <p>
              This is where you can browse all Kodi content, not just what is in the library. Browse
              by source or add-on.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .classic-browser-page {
    display: grid;
    grid-template-columns: 255px minmax(0, 1fr);
    min-height: calc(100vh - 123px);
    background: #ddd;
    color: #333;
  }

  .classic-browser-nav {
    display: grid;
    align-content: start;
    gap: 2rem;
    padding: 2rem 1.5rem;
    background: #f2f2f2;
  }

  .classic-browser-nav h2 {
    margin: 0 0 0.8rem;
    color: #8d8d8d;
    font-size: 1rem;
    font-weight: 400;
    text-transform: uppercase;
  }

  .classic-browser-nav nav {
    display: grid;
    gap: 0.6rem;
  }

  .classic-browser-nav a {
    display: flex;
    gap: 0.45rem;
    color: #333;
    font-size: 0.95rem;
    text-decoration: none;
  }

  .classic-browser-nav a.active {
    color: #42a5dc;
    font-weight: 700;
  }

  .classic-browser-content header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 43px;
    padding: 0.8rem 1rem;
    background: #d1d1d1;
  }

  .classic-browser-content h2 {
    margin: 0;
    font-size: 1rem;
  }

  .classic-browser-heading {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
  }

  .classic-browser-breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    color: #777;
    font-size: 0.82rem;
  }

  .classic-browser-breadcrumbs a {
    color: #42a5dc;
    text-decoration: none;
  }

  .classic-browser-toolbar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .classic-browser-toolbar button,
  .sort-wrapper summary {
    min-height: 30px;
    border: 0;
    background: #9e9e9e;
    color: white;
    font: inherit;
    font-size: 0.85rem;
  }

  .classic-browser-toolbar button,
  .sort-wrapper summary {
    padding: 0 0.65rem;
  }

  .sort-wrapper {
    position: relative;
  }

  .sort-wrapper summary {
    display: grid;
    align-items: center;
    list-style: none;
    cursor: pointer;
  }

  .sort-wrapper summary::-webkit-details-marker {
    display: none;
  }

  .classic-browser-toolbar button:disabled {
    opacity: 0.45;
  }

  .sorts {
    position: absolute;
    right: 0;
    z-index: 3;
    min-width: 10rem;
    margin: 0;
    padding: 0.35rem 0;
    background: #fff;
    box-shadow: 0 2px 8px rgb(0 0 0 / 18%);
    list-style: none;
  }

  .sorts button {
    width: 100%;
    justify-content: space-between;
    background: #fff;
    color: #555;
    text-align: left;
  }

  .sorts button.active {
    color: #42a5dc;
    font-weight: 700;
  }

  .sorts button.order-ascending::after {
    content: '⌃';
    float: right;
  }

  .sorts button.order-descending::after {
    content: '⌄';
    float: right;
  }

  .classic-browser-columns {
    display: grid;
    grid-template-columns: minmax(300px, 1fr) minmax(260px, 0.95fr);
    gap: 0;
    padding: 0;
  }

  .classic-browser-list article {
    display: grid;
    grid-template-columns: 42px 1fr auto;
    align-items: center;
    min-height: 43px;
    border-bottom: 1px solid #ddd;
    background: #f4f4f4;
  }

  .classic-browser-show-more {
    width: 100%;
    min-height: 43px;
    color: #555;
    background: #ececec;
    border: 0;
    border-bottom: 1px solid #ddd;
    font: inherit;
    cursor: pointer;
    text-align: center;
  }

  .classic-browser-thumb {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 0;
    background: #cfcfcf;
    color: #777;
    font: inherit;
    cursor: pointer;
    overflow: hidden;
  }

  .classic-browser-thumb:disabled {
    cursor: default;
  }

  .classic-browser-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .classic-browser-list a,
  .classic-browser-title {
    overflow: hidden;
    padding: 0 0.7rem;
    border: 0;
    background: transparent;
    color: #333;
    font: inherit;
    font-weight: 400;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    cursor: pointer;
  }

  .classic-browser-list article > span:last-child {
    padding: 0 0.8rem;
    color: #b3b3b3;
  }

  .classic-browser-actions {
    display: flex;
    gap: 0.2rem;
    padding: 0 0.45rem;
  }

  .classic-browser-actions button {
    border: 0;
    background: transparent;
    color: #555;
    cursor: pointer;
  }

  .classic-browser-actions button:disabled {
    color: #bbb;
    cursor: default;
  }

  .classic-browser-folders {
    min-height: calc(100vh - 166px);
    background: #d8d8d8;
  }

  .classic-browser-folders article {
    background: #ececec;
  }

  .classic-browser-intro {
    padding: 1.5rem;
    color: #777;
  }

  .classic-browser-intro h3 {
    margin: 0 0 0.7rem;
    color: #666;
    font-size: 1.05rem;
    font-weight: 400;
  }

  .classic-browser-intro p {
    max-width: 34rem;
    margin: 0;
    color: #888;
    line-height: 1.45;
  }
</style>
