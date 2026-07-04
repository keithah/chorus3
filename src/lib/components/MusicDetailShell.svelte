<script lang="ts" module>
  export type MusicDetailActionCard = {
    key: string;
    title: string;
    subtitle?: string;
    thumbnail?: string;
    artworkShape?: 'square' | 'poster';
    poster?: boolean;
  };

  export type MusicDetailRow = {
    label: string;
    value: string;
  };

  export type MusicDetailTrack = {
    key: string;
    title: string;
    track?: number;
    duration?: string;
    card?: MusicDetailActionCard;
  };
</script>

<script lang="ts">
  interface Props {
    kind: 'album' | 'artist';
    title: string;
    byline?: string;
    coverUrl?: string;
    fanartUrl?: string;
    detailRows?: MusicDetailRow[];
    descriptionTitle: string;
    description?: string;
    descriptionFallback: string;
    relatedTitle?: string;
    relatedEmpty?: string;
    relatedCards?: MusicDetailActionCard[];
    trackTitle: string;
    tracks: MusicDetailTrack[];
    trackEmpty: string;
    loadingTrackEmpty?: string;
    loading?: boolean;
    onPlay: () => Promise<void> | void;
    onQueue: () => Promise<void> | void;
    onStream: () => Promise<void> | void;
    onAddToPlaylist: () => Promise<void> | void;
    onToggleThumbsUp: () => Promise<void> | void;
    onEdit: () => Promise<void> | void;
    isThumbedUp: boolean;
    onPlayTrack: (card: MusicDetailActionCard) => Promise<void> | void;
    onQueueTrack: (card: MusicDetailActionCard) => Promise<void> | void;
    cardHref: (card: MusicDetailActionCard) => string | null | undefined;
  }

  let {
    kind,
    title,
    byline,
    coverUrl,
    fanartUrl,
    detailRows = [],
    descriptionTitle,
    description,
    descriptionFallback,
    relatedTitle,
    relatedEmpty = 'No related items found.',
    relatedCards = [],
    trackTitle,
    tracks,
    trackEmpty,
    loadingTrackEmpty,
    loading = false,
    onPlay,
    onQueue,
    onStream,
    onAddToPlaylist,
    onToggleThumbsUp,
    onEdit,
    isThumbedUp,
    onPlayTrack,
    onQueueTrack,
    cardHref
  }: Props = $props();
</script>

<article class="classic-music-detail">
  <header class="classic-music-hero" class:artist={kind === 'artist'}>
    {#if fanartUrl}
      <img class="classic-music-fanart" src={fanartUrl} alt="" aria-hidden="true" />
    {/if}
    <div class="classic-music-shade" aria-hidden="true"></div>
    <div
      class="classic-music-cover"
      class:artist={kind === 'artist'}
      aria-label={kind === 'artist' ? `${title} artwork` : `${title} cover`}
    >
      {#if coverUrl}
        <img src={coverUrl} alt="" decoding="async" />
      {/if}
    </div>
    <div class="classic-music-copy">
      <p class="classic-detail-type">{kind === 'artist' ? 'Artist' : 'Album'}</p>
      <h3>{title}</h3>
      {#if byline}
        <p class="classic-music-byline">{byline}</p>
      {/if}
      {#if detailRows.length}
        <dl class="classic-music-meta">
          {#each detailRows as row}
            <div>
              <dt>{row.label}:</dt>
              <dd>{row.value}</dd>
            </div>
          {/each}
        </dl>
      {/if}
      <div class="classic-music-actions">
        <button class="primary" type="button" onclick={() => void onPlay()}>
          Play <span aria-hidden="true">▶</span>
        </button>
        <button type="button" onclick={() => void onQueue()}>
          Queue <span aria-hidden="true">＋</span>
        </button>
        <button type="button" onclick={() => void onStream()}>
          Stream <span aria-hidden="true">▣</span>
        </button>
        <button type="button" onclick={() => void onAddToPlaylist()}>Add to playlist</button>
        <button type="button" onclick={() => void onToggleThumbsUp()}>
          {isThumbedUp ? 'Thumbed up' : 'Thumbs up'}
        </button>
        <button type="button" onclick={() => void onEdit()}>Edit</button>
      </div>
    </div>
  </header>

  <section class="classic-music-description">
    <h3>{descriptionTitle}</h3>
    <p>{description || descriptionFallback}</p>
  </section>

  {#if relatedTitle}
    <section class="classic-related-section">
      <h3>{relatedTitle}</h3>
      {#if relatedCards.length}
        <div class="classic-card-grid">
          {#each relatedCards as card (card.key)}
            <article class="classic-card art-square" data-artwork-shape="square">
              <a class="classic-card-main" href={cardHref(card) ?? ''} aria-label={card.title}>
                <div class="classic-card-art" class:has-artwork={Boolean(card.thumbnail)}>
                  {#if card.thumbnail}
                    <img src={card.thumbnail} alt="" loading="lazy" decoding="async" />
                  {/if}
                </div>
                <div class="classic-card-copy">
                  <strong>{card.title}</strong>
                  {#if card.subtitle}<span>{card.subtitle}</span>{/if}
                </div>
              </a>
            </article>
          {/each}
        </div>
      {:else}
        <p class="classic-empty">{relatedEmpty}</p>
      {/if}
    </section>
  {/if}

  <section class="classic-track-list">
    <h3>{trackTitle}</h3>
    {#if tracks.length}
      <ol>
        {#each tracks as track (track.key)}
          <li>
            <span class="track-number">{track.track ?? ''}</span>
            <span class="track-title">{track.title}</span>
            <span class="track-duration">{track.duration ?? ''}</span>
            {#if track.card}
              <button type="button" onclick={() => void onPlayTrack(track.card!)}>Play</button>
              <button type="button" onclick={() => void onQueueTrack(track.card!)}>Queue</button>
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <p class="classic-empty">{loading && loadingTrackEmpty ? loadingTrackEmpty : trackEmpty}</p>
    {/if}
  </section>
</article>

<style>
  .classic-music-detail {
    margin: -1rem -1rem 1rem;
    background: #fff;
  }

  .classic-music-hero {
    position: relative;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 2rem;
    min-height: 320px;
    padding: 2rem;
    overflow: hidden;
    background: #333;
    color: #eee;
  }

  .classic-music-hero.artist {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .classic-music-fanart {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .classic-music-shade {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        90deg,
        rgb(38 38 38 / 0.98) 0%,
        rgb(38 38 38 / 0.84) 36%,
        rgb(38 38 38 / 0.32) 100%
      ),
      linear-gradient(0deg, rgb(38 38 38 / 0.9) 0%, rgb(38 38 38 / 0.18) 100%);
  }

  .classic-music-cover,
  .classic-music-copy {
    position: relative;
    z-index: 1;
  }

  .classic-music-cover {
    align-self: start;
    width: 260px;
    aspect-ratio: 1;
    overflow: hidden;
    background: #222;
    box-shadow: 0 2px 12px rgb(0 0 0 / 0.35);
  }

  .classic-music-cover.artist {
    width: 220px;
    border-radius: 50%;
  }

  .classic-music-cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .classic-music-copy {
    align-self: center;
    max-width: 760px;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }

  .classic-detail-type {
    margin: 0 0 0.35rem;
    color: #42a5dc;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .classic-music-copy h3 {
    margin: 0;
    color: #fff;
    font-size: 2.35rem;
    font-weight: 300;
  }

  .classic-music-byline {
    margin: 0.8rem 0 0;
    color: #d7d7d7;
    font-size: 1.08rem;
  }

  .classic-music-meta {
    display: grid;
    gap: 0.35rem;
    margin: 1rem 0;
    color: #ddd;
  }

  .classic-music-meta div {
    display: flex;
    gap: 0.35rem;
    line-height: 1.45;
  }

  .classic-music-meta dt {
    flex: 0 0 auto;
    margin: 0;
    font-weight: 700;
  }

  .classic-music-meta dd {
    margin: 0;
    color: #c9c9c9;
  }

  .classic-music-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }

  .classic-music-actions button,
  .classic-track-list button {
    min-height: 2.4rem;
    padding: 0 1rem;
    border: 0;
    background: rgb(75 75 75 / 0.88);
    color: #fff;
    font: inherit;
    cursor: pointer;
  }

  .classic-music-actions button.primary {
    background: #5dade2;
  }

  .classic-music-description,
  .classic-related-section,
  .classic-track-list {
    padding: 1.6rem 2rem;
    background: #fff;
    color: #333;
    border-top: 1px solid #e2e2e2;
  }

  .classic-music-description h3,
  .classic-related-section h3,
  .classic-track-list h3 {
    margin: 0 0 1rem;
    color: #555;
    font-size: 1.7rem;
    font-weight: 300;
  }

  .classic-music-description p {
    max-width: 92ch;
    margin: 0;
    line-height: 1.55;
  }

  .classic-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 159px);
    gap: 10px;
    align-items: start;
    justify-content: start;
    max-width: none;
  }

  .classic-card {
    position: relative;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
  }

  .classic-card-main {
    display: block;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }

  .classic-card-art {
    position: relative;
    aspect-ratio: 1;
    background: #cfcfcf;
  }

  .classic-card-art img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .classic-card-copy {
    display: grid;
    gap: 0.25rem;
    padding: 0.55rem;
  }

  .classic-card-copy strong,
  .classic-card-copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .classic-card-copy span,
  .classic-empty {
    color: #777;
  }

  .classic-track-list ol {
    display: grid;
    gap: 1px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .classic-track-list li {
    display: grid;
    grid-template-columns: 3.5rem minmax(0, 1fr) 5.5rem auto auto;
    align-items: center;
    gap: 0.5rem;
    min-height: 3rem;
    padding: 0.35rem 0.5rem;
    background: #f7f7f7;
  }

  .track-number,
  .track-duration {
    color: #888;
    font-variant-numeric: tabular-nums;
  }

  .track-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
