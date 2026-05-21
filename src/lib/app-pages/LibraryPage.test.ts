import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LibraryPage from './LibraryPage.svelte';

const fakeClient = {
  calls: [] as Array<{ method: string; params?: unknown }>,
  async call<TResult>(method: string, params?: unknown): Promise<TResult> {
    this.calls.push(params === undefined ? { method } : { method, params });

    if (method === 'VideoLibrary.GetMusicVideoDetails') {
      const properties = Array.isArray((params as { properties?: unknown }).properties)
        ? ((params as { properties: unknown[] }).properties as unknown[])
        : [];

      if (properties.length === 1 && properties[0] === 'file') {
        return {
          musicvideodetails: {
            musicvideoid: 77,
            label: 'Live cut',
            file: 'smb://nas/private/live-cut.mkv'
          }
        } as TResult;
      }

      return {
        musicvideodetails: {
          musicvideoid: 77,
          label: 'Live cut',
          title: 'Live cut',
          artist: ['The Band'],
          album: 'Stage Lights',
          genre: ['Live'],
          director: ['Director One'],
          studio: ['Studio One'],
          plot: 'A live performance cut.',
          rating: 8,
          track: 3,
          tag: ['concert'],
          thumbnail: 'image://music-video-thumb.jpg/'
        }
      } as TResult;
    }

    if (method === 'AudioLibrary.GetSongs') {
      return {
        songs: [
          {
            songid: 55,
            label: 'Sinnerman',
            title: 'Sinnerman',
            artist: ['Nina Simone'],
            duration: 320,
            thumbnail: 'image://song-thumb.jpg/',
            file: 'smb://nas/private/sinnerman.flac'
          }
        ]
      } as TResult;
    }

    throw new Error(`Unexpected Kodi call: ${method}`);
  }
};

vi.mock('$lib/stores/kodiClient', () => ({
  createActiveKodiJsonRpcHttpClient: () => fakeClient
}));

vi.mock('$lib/stores/localPlayer.svelte', () => ({
  prepareLocalStreamUrl: vi.fn(async () => 'http://kodi.local:8080/vfs/live-cut.mkv')
}));

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;
let anchorClickSpy: ReturnType<typeof vi.spyOn> | null = null;

afterEach(() => {
  anchorClickSpy?.mockRestore();
  anchorClickSpy = null;
  localStorage.clear();
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  fakeClient.calls = [];
});

function emptyMusicSnapshot() {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: null,
    artists: [],
    albums: [],
    songs: [],
    genres: [],
    recentlyAddedSongs: [],
    recentlyPlayedSongs: [],
    mostPlayedSongs: [],
    limits: {
      artists: { start: 0, end: 0, total: 0 },
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 },
      genres: { start: 0, end: 0, total: 0 },
      recentlyAddedSongs: { start: 0, end: 0, total: 0 },
      recentlyPlayedSongs: { start: 0, end: 0, total: 0 },
      mostPlayedSongs: { start: 0, end: 0, total: 0 }
    },
    isEmpty: true,
    lastError: null
  };
}

function emptyVideoSnapshot() {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: null,
    movies: [],
    tvShows: [],
    recentlyAddedMovies: [],
    recentlyPlayedMovies: [],
    recentlyAddedEpisodes: [],
    recentlyPlayedEpisodes: [],
    musicVideos: [],
    limits: {
      movies: { start: 0, end: 0, total: 0 },
      tvShows: { start: 0, end: 0, total: 0 },
      recentlyAddedMovies: { start: 0, end: 0, total: 0 },
      recentlyPlayedMovies: { start: 0, end: 0, total: 0 },
      recentlyAddedEpisodes: { start: 0, end: 0, total: 0 },
      recentlyPlayedEpisodes: { start: 0, end: 0, total: 0 },
      musicVideos: { start: 0, end: 0, total: 0 }
    },
    isEmpty: true,
    lastError: null
  };
}

async function settle(): Promise<void> {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
    flushSync();
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

describe('LibraryPage', () => {
  it('routes classic music localplay actions through local browser playback mode', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      setMode: vi.fn(),
      playMusicItem: vi.fn()
    };

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicTop' },
        musicLibrarySnapshot: {
          ...emptyMusicSnapshot(),
          isEmpty: false,
          recentlyAddedSongs: [
            {
              songid: 55,
              label: 'Sinnerman',
              title: 'Sinnerman',
              artist: ['Nina Simone']
            }
          ]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: playerDispatch as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    buttons.find((button) => button.textContent?.trim() === 'Play in browser')?.click();
    await settle();

    expect(playerDispatch.setMode).toHaveBeenCalledWith('local');
    expect(playerDispatch.playMusicItem).toHaveBeenCalledWith({ kind: 'song', songid: 55 });
    expect(target!.textContent).toContain('Started browser playback for Sinnerman.');
  });

  it('routes classic movie localplay actions through browser video streaming', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      streamMovieItem: vi.fn()
    };

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'movies' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: {
          ...emptyVideoSnapshot(),
          isEmpty: false,
          movies: [
            {
              movieid: 88,
              label: 'Big Buck Bunny',
              title: 'Big Buck Bunny',
              thumbnail: 'image://movie-screenshot.jpg/',
              art: { poster: 'image://movie-poster.jpg/' }
            }
          ]
        } as never,
        playerDispatch: playerDispatch as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    expect(target!.querySelector('.classic-card-art img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Fmovie-poster.jpg%2F'
    );

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    buttons.find((button) => button.textContent?.trim() === 'Play in browser')?.click();
    await settle();

    expect(playerDispatch.streamMovieItem).toHaveBeenCalledWith({ movieid: 88 });
    expect(target!.textContent).toContain('Started browser playback for Big Buck Bunny.');
  });

  it('renders movie detail metadata from the Kodi detail snapshot when the movie is outside the loaded list', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'movieDetail', movieid: '4401' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: {
          ...emptyVideoSnapshot(),
          isEmpty: false,
          movies: [{ movieid: 1, label: 'Loaded movie' }]
        } as never,
        videoMovieDetailSnapshot: {
          refreshStatus: 'ready',
          lastRefreshReason: 'manual',
          lastUpdatedAt: '2026-05-20T00:00:00.000Z',
          selectedMovieId: 4401,
          detail: {
            movieid: 4401,
            label: 'Arrival',
            title: 'Arrival',
            year: 2016,
            runtime: 6960,
            genre: ['Drama', 'Sci-Fi'],
            director: ['Denis Villeneuve'],
            studio: ['Paramount Pictures'],
            mpaa: 'PG-13',
            rating: 7.9,
            userrating: 8,
            premiered: '2016-11-11',
            dateadded: '2026-05-20 01:02:03',
            plot: 'A linguist works with the military to communicate with alien lifeforms.',
            thumbnail: 'image://arrival-screenshot.jpg/',
            art: { poster: 'image://arrival-poster.jpg/' },
            thumbnailAvailable: true,
            fanartAvailable: false,
            artwork: { poster: true },
            versions: { status: 'unsupported', reason: 'not requested' }
          },
          lastError: null
        } as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    const text = target!.textContent ?? '';
    expect(text).toContain('Arrival');
    expect(text).toContain('Drama, Sci-Fi');
    expect(text).toContain('Denis Villeneuve');
    expect(text).toContain('Paramount Pictures');
    expect(text).toContain('PG-13');
    expect(text).toContain(
      'A linguist works with the military to communicate with alien lifeforms.'
    );
    expect(target!.querySelector('.classic-card-art img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Farrival-poster.jpg%2F'
    );
    expect(text).not.toContain('Movie not found.');
  });

  it('adds classic music library actions to the selected local playlist', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const localPlaylistDispatch = {
      addItems: vi.fn(() => ({ ok: true, items: [] }))
    };

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicTop' },
        musicLibrarySnapshot: {
          ...emptyMusicSnapshot(),
          isEmpty: false,
          recentlyAddedSongs: [
            { songid: 55, label: 'Sinnerman', title: 'Sinnerman', artist: ['Nina Simone'] }
          ]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        localPlaylistSnapshot: { selectedPlaylistId: 'playlist-bayani' } as never,
        localPlaylistDispatch: localPlaylistDispatch as never,
        playerDispatch: { playMusicItem: vi.fn() } as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    buttons.find((button) => button.textContent?.trim() === 'Add to playlist')?.click();
    await settle();

    expect(fakeClient.calls).toEqual([
      {
        method: 'AudioLibrary.GetSongs',
        params: {
          filter: { songid: 55 },
          properties: ['title', 'artist', 'album', 'duration', 'thumbnail', 'file'],
          limits: { start: 0, end: 1000 }
        }
      }
    ]);
    expect(localPlaylistDispatch.addItems).toHaveBeenCalledWith('playlist-bayani', [
      {
        kind: 'audio',
        label: 'Nina Simone - Sinnerman',
        file: 'smb://nas/private/sinnerman.flac',
        sourceId: 'song:55',
        durationSeconds: 320,
        thumbnail: 'image://song-thumb.jpg/'
      }
    ]);
    expect(target!.textContent).toContain('Added 1 item to playlist.');
    expect(target!.innerHTML).not.toContain('smb://');
  });

  it('hydrates classic music video detail routes from Kodi and keeps actions playable', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      playMusicVideoItem: vi.fn(),
      streamMusicVideoItem: vi.fn()
    };
    const queueDispatch = {
      queueMusicVideoItem: vi.fn()
    };
    anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicVideoDetail', musicvideoid: '77' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: playerDispatch as never,
        queueDispatch: queueDispatch as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    expect(fakeClient.calls).toEqual([
      {
        method: 'VideoLibrary.GetMusicVideoDetails',
        params: {
          musicvideoid: 77,
          properties: [
            'title',
            'artist',
            'album',
            'year',
            'runtime',
            'thumbnail',
            'fanart',
            'art',
            'genre',
            'director',
            'studio',
            'playcount',
            'lastplayed',
            'resume',
            'dateadded',
            'plot',
            'track',
            'tag',
            'rating'
          ]
        }
      }
    ]);
    expect(target!.textContent).toContain('Live cut');
    expect(target!.textContent).toContain('The Band');
    expect(target!.textContent).toContain('Stage Lights');
    expect(target!.textContent).toContain('Director One');
    expect(target!.textContent).toContain('Studio One');
    expect(target!.textContent).toContain('A live performance cut.');
    expect(target!.textContent).toContain('8');
    expect(target!.innerHTML).not.toContain('smb://');

    fakeClient.calls = [];
    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    buttons.find((button) => button.textContent === 'Play')?.click();
    buttons.find((button) => button.textContent === 'Queue')?.click();
    buttons.find((button) => button.textContent === 'Play in browser')?.click();
    buttons.find((button) => button.textContent === 'Download')?.click();
    await settle();
    expect(playerDispatch.playMusicVideoItem).toHaveBeenCalledWith({ musicvideoid: 77 });
    expect(playerDispatch.streamMusicVideoItem).toHaveBeenCalledWith({ musicvideoid: 77 });
    expect(queueDispatch.queueMusicVideoItem).toHaveBeenCalledWith({ musicvideoid: 77 });
    expect(fakeClient.calls).toEqual([
      {
        method: 'VideoLibrary.GetMusicVideoDetails',
        params: { musicvideoid: 77, properties: ['file'] }
      }
    ]);
    expect(target!.textContent).toContain('Started download for Live cut.');
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(target!.innerHTML).not.toContain('live-cut.mkv');
  });

  it('renders classic filter panes and applies option filters to library cards', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicAlbums' },
        musicLibrarySnapshot: {
          ...emptyMusicSnapshot(),
          isEmpty: false,
          albums: [
            {
              albumid: 1,
              label: 'Bayani',
              title: 'Bayani',
              artist: ['Blue Scholars'],
              genre: ['Hip Hop'],
              year: 2024
            },
            {
              albumid: 2,
              label: 'Archive',
              title: 'Archive',
              artist: ['Big L'],
              genre: ['Rap'],
              year: 1999
            }
          ]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    expect(target!.textContent).toContain('Bayani');
    expect(target!.textContent).toContain('Archive');

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Filters'))
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.filters-page button'))
      .find((button) => button.textContent?.trim() === 'year')
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === '2024')
      ?.click();
    await settle();

    expect(target!.textContent).toContain('Bayani');
    expect(target!.textContent).not.toContain('Archive');
    expect(target!.textContent).toContain('2024');
  });
});
