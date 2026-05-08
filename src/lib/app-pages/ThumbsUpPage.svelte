<script lang="ts">
  import type { BuildAppRouteOptions } from '$lib/app/appRouter';
  import type {
    ThumbsUpDispatch,
    ThumbsUpItemSnapshot,
    ThumbsUpMedia,
    ThumbsUpStoreSnapshot
  } from '$lib/stores';
  import type { PlayerControlsDispatch } from '$components/PlayerControls.svelte';
  import type { QueuePanelDispatch } from '$components/QueuePanel.svelte';

  type ThumbsPlayerDispatch = PlayerControlsDispatch & {
    playMusicItem?: (
      item:
        | { kind: 'song'; songid: number }
        | { kind: 'album'; albumid: number }
        | { kind: 'artist'; artistid: number }
    ) => Promise<void> | void;
    playMovieItem?: (item: { movieid: number }) => Promise<void> | void;
    playEpisodeItem?: (item: { episodeid: number }) => Promise<void> | void;
    playMusicVideoItem?: (item: { musicvideoid: number }) => Promise<void> | void;
  };

  type ThumbsQueueDispatch = QueuePanelDispatch & {
    queueMusicItem?: (
      item:
        | { kind: 'song'; songid: number }
        | { kind: 'album'; albumid: number }
        | { kind: 'artist'; artistid: number }
    ) => Promise<void> | void;
    queueMovieItem?: (item: { movieid: number }) => Promise<void> | void;
    queueEpisodeItem?: (item: { episodeid: number }) => Promise<void> | void;
    queueMusicVideoItem?: (item: { musicvideoid: number }) => Promise<void> | void;
  };

  interface Props {
    snapshot: ThumbsUpStoreSnapshot;
    dispatch: ThumbsUpDispatch;
    playerDispatch: ThumbsPlayerDispatch;
    queueDispatch: ThumbsQueueDispatch;
    buildOptions?: BuildAppRouteOptions;
  }

  let { snapshot, dispatch, playerDispatch, queueDispatch }: Props = $props();

  const sections: { media: ThumbsUpMedia; title: string }[] = [
    { media: 'song', title: 'Songs' },
    { media: 'artist', title: 'Artists' },
    { media: 'album', title: 'Albums' },
    { media: 'tvshow', title: 'TV shows' },
    { media: 'movie', title: 'Movies' },
    { media: 'episode', title: 'Episodes' },
    { media: 'musicvideo', title: 'Music videos' }
  ];

  async function play(item: ThumbsUpItemSnapshot): Promise<void> {
    if (item.media === 'song')
      await playerDispatch.playMusicItem?.({ kind: 'song', songid: item.id });
    if (item.media === 'album')
      await playerDispatch.playMusicItem?.({ kind: 'album', albumid: item.id });
    if (item.media === 'artist')
      await playerDispatch.playMusicItem?.({ kind: 'artist', artistid: item.id });
    if (item.media === 'movie') await playerDispatch.playMovieItem?.({ movieid: item.id });
    if (item.media === 'episode') await playerDispatch.playEpisodeItem?.({ episodeid: item.id });
    if (item.media === 'musicvideo')
      await playerDispatch.playMusicVideoItem?.({ musicvideoid: item.id });
  }

  async function queue(item: ThumbsUpItemSnapshot): Promise<void> {
    if (item.media === 'song')
      await queueDispatch.queueMusicItem?.({ kind: 'song', songid: item.id });
    if (item.media === 'album')
      await queueDispatch.queueMusicItem?.({ kind: 'album', albumid: item.id });
    if (item.media === 'artist')
      await queueDispatch.queueMusicItem?.({ kind: 'artist', artistid: item.id });
    if (item.media === 'movie') await queueDispatch.queueMovieItem?.({ movieid: item.id });
    if (item.media === 'episode') await queueDispatch.queueEpisodeItem?.({ episodeid: item.id });
    if (item.media === 'musicvideo')
      await queueDispatch.queueMusicVideoItem?.({ musicvideoid: item.id });
  }

  function imageUrl(rawPath: string): string {
    return rawPath.startsWith('/image/') ? rawPath : `/image/${encodeURIComponent(rawPath)}`;
  }
</script>

<div class="thumbs-page set-page">
  <aside class="thumbs-sidebar" aria-label="Thumbs up sections">
    <p class="subnav-kicker">Thumbs up</p>
    {#each sections as section}
      <a href={`#thumbs-${section.media}`}>{section.title}</a>
    {/each}
  </aside>

  <section class="thumbs-content" aria-labelledby="thumbs-title">
    <header class="thumbs-header">
      <h2 id="thumbs-title">Thumbs up</h2>
      <p>{snapshot.total} saved item{snapshot.total === 1 ? '' : 's'}</p>
    </header>

    {#if snapshot.storageWarning}
      <p class="thumbs-warning" role="status">{snapshot.storageWarning}</p>
    {/if}

    {#if snapshot.total === 0}
      <p class="empty-state">No thumbs up items saved in this browser.</p>
    {/if}

    {#each sections as section}
      {@const items = snapshot.groups[section.media]}
      {#if items.length}
        <section class="thumbs-set" id={`thumbs-${section.media}`}>
          <h3>{section.title}</h3>
          <div class="thumbs-grid">
            {#each items as item (`${item.media}:${item.id}`)}
              <article class="thumb-card">
                <div
                  class="thumb-card__art"
                  class:has-art={Boolean(item.thumbnail)}
                  aria-hidden="true"
                >
                  {#if item.thumbnail}
                    <img src={imageUrl(item.thumbnail)} alt="" loading="lazy" decoding="async" />
                  {/if}
                </div>
                <div class="thumb-card__copy">
                  <strong>{item.label}</strong>
                  {#if item.subtitle}
                    <span>{item.subtitle}</span>
                  {/if}
                </div>
                <div class="thumb-card__actions">
                  {#if item.media !== 'tvshow'}
                    <button type="button" onclick={() => play(item)}>Play</button>
                    <button type="button" onclick={() => queue(item)}>Queue</button>
                  {/if}
                  <button type="button" onclick={() => dispatch.removeItem(item.media, item.id)}>
                    Remove
                  </button>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </section>
</div>

<style>
  .thumbs-page {
    display: grid;
    grid-template-columns: 256px minmax(0, 1fr);
    min-height: 100%;
    background: #ddd;
    color: #333;
  }

  .thumbs-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 2rem 1.4rem;
    background: #f5f5f5;
  }

  .subnav-kicker {
    margin: 0 0 0.5rem;
    color: #888;
    text-transform: uppercase;
  }

  .thumbs-sidebar a {
    color: #333;
    text-decoration: none;
  }

  .thumbs-content {
    padding: 1.25rem 1.25rem 5rem;
  }

  .thumbs-header {
    margin-bottom: 1rem;
    border-bottom: 1px solid #cfcfcf;
  }

  .thumbs-header h2 {
    margin: 0;
    color: #555;
    font-size: 1.8rem;
    font-weight: 300;
  }

  .thumbs-header p,
  .thumbs-set h3 {
    color: #777;
  }

  .thumbs-set {
    margin-bottom: 2rem;
  }

  .thumbs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .thumb-card {
    background: #f8f8f8;
    box-shadow: 0 1px 3px rgb(0 0 0 / 14%);
  }

  .thumb-card__art {
    aspect-ratio: 1;
    background: #c8c8c8;
  }

  .thumb-card__art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-card__copy {
    display: grid;
    gap: 0.15rem;
    min-height: 4.5rem;
    padding: 0.65rem;
  }

  .thumb-card__copy strong,
  .thumb-card__copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .thumb-card__copy span {
    color: #777;
    font-size: 0.88rem;
  }

  .thumb-card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    background: #ddd;
  }

  button {
    flex: 1;
    border: 0;
    background: #9e9e9e;
    color: white;
    padding: 0.45rem;
  }

  .empty-state,
  .thumbs-warning {
    margin: 0 0 1rem;
    padding: 1rem;
    background: #eee;
    color: #666;
  }

  @media (max-width: 760px) {
    .thumbs-page {
      grid-template-columns: 1fr;
    }

    .thumbs-sidebar {
      flex-direction: row;
      flex-wrap: wrap;
      padding: 1rem;
    }

    .subnav-kicker {
      width: 100%;
    }
  }
</style>
