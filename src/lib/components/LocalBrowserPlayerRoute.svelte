<script module lang="ts">
  import type { LocalPlayerStoreSnapshot } from '$lib/stores/localPlayer.svelte';
  import type {
    EpisodePlaybackItem,
    MoviePlaybackItem,
    MusicPlaybackItem,
    MusicVideoPlaybackItem,
    PlayerDispatchSnapshot
  } from '$lib/stores/playerDispatch.svelte';

  export interface LocalBrowserPlayerDispatch {
    setMode?: (mode: 'kodi' | 'local') => void;
    playMusicItem?: (item: MusicPlaybackItem) => Promise<void> | void;
    streamMovieItem?: (item: MoviePlaybackItem) => Promise<void> | void;
    streamEpisodeItem?: (item: EpisodePlaybackItem) => Promise<void> | void;
    streamMusicVideoItem?: (item: MusicVideoPlaybackItem) => Promise<void> | void;
  }
</script>

<script lang="ts">
  import type { LocalPlayerRoute } from '$lib/app/appRouter';
  import LocalMediaRuntime from '$lib/components/LocalMediaRuntime.svelte';

  interface Props {
    route: LocalPlayerRoute;
    localPlayerSnapshot: LocalPlayerStoreSnapshot;
    dispatchSnapshot?: PlayerDispatchSnapshot;
    actionDispatch?: LocalBrowserPlayerDispatch;
  }

  type Status =
    | { kind: 'idle'; message: string }
    | { kind: 'pending'; message: string }
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string };

  const noopDispatch: LocalBrowserPlayerDispatch = {};

  let {
    route,
    localPlayerSnapshot,
    dispatchSnapshot,
    actionDispatch = noopDispatch
  }: Props = $props();

  let status = $state<Status>({
    kind: 'idle',
    message: 'Local browser player is ready.'
  });
  let startedKey = $state('');

  const routeKey = $derived(localPlayerRouteKey(route));
  const runtimeStatus = $derived(runtimeStatusCopy());
  const streamHref = $derived(localPlayerSnapshot.source ?? '');
  const mediaNoun = $derived(route.media === 'music' ? 'audio' : 'video');
  const playerAriaLabel = $derived(`Chorus ${mediaNoun} player`);
  const downloadTitle = $derived(`Force download of this ${mediaNoun}`);
  const streamTitle = $derived(
    `Navigate to ${mediaNoun} so the browser can try and native stream it. Some browsers may still download`
  );

  $effect(() => {
    const key = routeKey;
    if (!key || startedKey === key) {
      return;
    }
    startedKey = key;
    void startBrowserPlayback();
  });

  async function startBrowserPlayback(): Promise<void> {
    status = {
      kind: 'pending',
      message: 'Starting browser playback...'
    };

    try {
      if (route.media === 'music') {
        actionDispatch.setMode?.('local');
        await actionDispatch.playMusicItem?.(musicPayload(route));
      } else if (route.media === 'movie') {
        await actionDispatch.streamMovieItem?.({ movieid: route.id });
      } else if (route.media === 'episode') {
        await actionDispatch.streamEpisodeItem?.({ episodeid: route.id });
      } else {
        await actionDispatch.streamMusicVideoItem?.({ musicvideoid: route.id });
      }

      status = {
        kind: 'success',
        message: 'Started browser playback.'
      };
    } catch (error) {
      status = {
        kind: 'error',
        message: `Could not start browser playback. ${safeErrorMessage(error)}`
      };
    }
  }

  function musicPayload(value: Extract<LocalPlayerRoute, { media: 'music' }>): MusicPlaybackItem {
    if (value.musicKind === 'artist') {
      return { kind: 'artist', artistid: value.id };
    }

    if (value.musicKind === 'album') {
      return { kind: 'album', albumid: value.id };
    }

    return { kind: 'song', songid: value.id };
  }

  function localPlayerRouteKey(value: LocalPlayerRoute): string {
    return value.media === 'music'
      ? `${value.media}:${value.musicKind}:${value.id}`
      : `${value.media}:${value.id}`;
  }

  function runtimeStatusCopy(): string {
    if (dispatchSnapshot?.commandStatus === 'running') {
      return 'Preparing stream from Kodi.';
    }

    const error = dispatchSnapshot?.lastError?.message ?? localPlayerSnapshot.lastError?.message;
    if (
      error ||
      dispatchSnapshot?.commandStatus === 'error' ||
      localPlayerSnapshot.status === 'error'
    ) {
      return `Playback needs attention. ${error ? sanitizeUiText(error) : ''}`.trim();
    }

    if (localPlayerSnapshot.status === 'playing') {
      return 'Browser playback is playing.';
    }

    if (localPlayerSnapshot.status === 'paused') {
      return 'Browser playback is paused.';
    }

    if (localPlayerSnapshot.status === 'loading') {
      return 'Browser playback is loading.';
    }

    if (localPlayerSnapshot.status === 'ended') {
      return 'Browser playback ended.';
    }

    return 'Browser playback will start in this window.';
  }

  function safeErrorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim()
      ? sanitizeUiText(error.message)
      : 'Playback failed.';
  }

  function sanitizeUiText(value: string): string {
    return value
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
      .replace(/sentinel_secret/gi, '[redacted-secret]')
      .replace(/admin:p@ssword/gi, '[redacted-credentials]')
      .replace(/localStorage|sessionStorage/gi, 'browser storage');
  }
</script>

<section class="local-browser-player" aria-label={playerAriaLabel}>
  <div id="player" class="local-browser-player__runtime">
    <LocalMediaRuntime
      variant="inline"
      className="chorus2-popup-runtime chorus2-popup-runtime--stage"
    />
  </div>

  <div id="player-actions" class="local-browser-player__chrome">
    <select id="switch-player" aria-label="Switch player">
      <option value="html5">html5</option>
    </select>
    <div id="actions">
      <a href={streamHref} title={downloadTitle} class="dl" id="download" download>Download</a>
      <span aria-hidden="true"> - </span>
      <a href={streamHref} title={streamTitle} class="dl" id="stream">Stream</a>
    </div>
  </div>

  <div
    class={`local-browser-player__status ${status.kind} visually-hidden`}
    role="status"
    aria-live="polite"
  >
    {runtimeStatus}
    {status.message}
  </div>
</section>

<style>
  .local-browser-player {
    min-height: 100vh;
    min-height: 100dvh;
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: minmax(0, 1fr) 2rem;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: #333;
    background: #000;
    font:
      12px Arial,
      Helvetica,
      'Nimbus Sans L',
      sans-serif;
  }

  .local-browser-player__runtime {
    position: relative;
    height: 0;
    min-height: 300px;
    margin: 0 10px;
    margin-top: 1%;
    padding-top: 25px;
    padding-bottom: 56.25%;
  }

  :global(.chorus2-popup-runtime.local-media-runtime) {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    max-height: none;
    margin: 0;
    aspect-ratio: auto;
    color: #fff;
    background: #000;
    border-radius: 0;
    box-shadow: none;
    overflow: visible;
    clip: auto;
    clip-path: none;
    white-space: normal;
  }

  .local-browser-player__chrome {
    min-height: 2rem;
  }

  #switch-player,
  #actions {
    display: block;
    margin: 1px 0 0;
    padding: 5px 10px 0 0;
    color: #333;
    font:
      12px Arial,
      Helvetica,
      'Nimbus Sans L',
      sans-serif;
  }

  #switch-player {
    float: left;
    padding: 5px 0 0 10px;
    border: none;
    color: #333;
    background: #000;
  }

  #actions {
    float: right;
  }

  a {
    color: #333;
    text-decoration: none;
  }

  #switch-player:hover,
  #switch-player:focus,
  .dl:hover,
  .dl:focus {
    color: #aaa;
    outline: none;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
