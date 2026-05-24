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
      const songid = (params as { filter?: { songid?: number } }).filter?.songid ?? 55;
      const title = songid === 56 ? 'Feeling Good' : 'Sinnerman';
      return {
        songs: [
          {
            songid,
            label: title,
            title,
            artist: ['Nina Simone'],
            duration: 320,
            thumbnail: 'image://song-thumb.jpg/',
            file: `smb://nas/private/${songid}.flac`
          }
        ]
      } as TResult;
    }

    if (method.endsWith('.SetSongDetails') || method.includes('Library.Set')) {
      return 'OK' as TResult;
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
            writer: ['Eric Heisserer'],
            cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'],
            studio: ['Paramount Pictures'],
            mpaa: 'PG-13',
            rating: 7.9,
            userrating: 8,
            premiered: '2016-11-11',
            imdbnumber: 'tt2543164',
            streamdetails: {
              video: ['H264 HD (1920 X 1080) [1.78]'],
              audio: ['DTS 6 (ENGLISH)'],
              subtitle: ['ENGLISH']
            },
            dateadded: '2026-05-20 01:02:03',
            plot: 'A linguist works with the military to communicate with alien lifeforms.',
            thumbnail: 'image://arrival-screenshot.jpg/',
            art: { poster: 'image://arrival-poster.jpg/', fanart: 'image://arrival-fanart.jpg/' },
            thumbnailAvailable: true,
            fanartAvailable: true,
            artwork: { poster: true, fanart: true },
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

    target!
      .querySelectorAll('button')
      .forEach((button) => button.textContent?.includes('More') && button.click());
    await settle();

    const text = target!.textContent ?? '';
    expect(text).toContain('Arrival');
    expect(text).toContain('Drama, Sci-Fi');
    expect(text).toContain('Denis Villeneuve');
    expect(text).toContain('Eric Heisserer');
    expect(text).toContain('Amy Adams, Jeremy Renner, Forest Whitaker');
    expect(text).toContain('PG-13');
    expect(text).toContain('01:56:00');
    expect(text).toContain('H264 HD (1920 X 1080) [1.78]');
    expect(text).toContain('DTS 6 (ENGLISH)');
    expect(text).toContain('Chorus Search');
    expect(text).toContain('External Search');
    expect(text).toContain('YouTube Search');
    expect(text).toContain(
      'A linguist works with the military to communicate with alien lifeforms.'
    );
    expect(target!.querySelector('.classic-movie-poster img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Farrival-poster.jpg%2F'
    );
    expect(target!.querySelector('.classic-movie-fanart')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Farrival-fanart.jpg%2F'
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
        file: 'smb://nas/private/55.flac',
        sourceId: 'song:55',
        durationSeconds: 320,
        thumbnail: 'image://song-thumb.jpg/'
      }
    ]);
    expect(target!.textContent).toContain('Added 1 item to playlist.');
    expect(target!.innerHTML).not.toContain('smb://');
  });

  it('supports Chorus2-style selected card bulk queue and local playlist actions', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const queueDispatch = {
      queueMusicItem: vi.fn()
    };
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
            { songid: 55, label: 'Sinnerman', title: 'Sinnerman', artist: ['Nina Simone'] },
            { songid: 56, label: 'Feeling Good', title: 'Feeling Good', artist: ['Nina Simone'] }
          ]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        localPlaylistSnapshot: { selectedPlaylistId: 'playlist-bayani' } as never,
        localPlaylistDispatch: localPlaylistDispatch as never,
        playerDispatch: { playMusicItem: vi.fn() } as never,
        queueDispatch: queueDispatch as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    const selectors = Array.from(
      target!.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-card-select]')
    );
    expect(selectors).toHaveLength(2);
    selectors.forEach((input) => input.click());
    await settle();

    expect(target!.textContent).toContain('2 selected');
    expect(target!.querySelectorAll('.classic-selected-toolbar')).toHaveLength(1);

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Queue selected')
      ?.click();
    await settle();

    expect(queueDispatch.queueMusicItem).toHaveBeenCalledTimes(2);
    expect(queueDispatch.queueMusicItem).toHaveBeenCalledWith({ kind: 'song', songid: 55 });
    expect(queueDispatch.queueMusicItem).toHaveBeenCalledWith({ kind: 'song', songid: 56 });

    fakeClient.calls = [];
    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Add selected to playlist')
      ?.click();
    await settle();

    expect(fakeClient.calls).toEqual(
      expect.arrayContaining([
        {
          method: 'AudioLibrary.GetSongs',
          params: {
            filter: { songid: 55 },
            properties: ['title', 'artist', 'album', 'duration', 'thumbnail', 'file'],
            limits: { start: 0, end: 1000 }
          }
        },
        {
          method: 'AudioLibrary.GetSongs',
          params: {
            filter: { songid: 56 },
            properties: ['title', 'artist', 'album', 'duration', 'thumbnail', 'file'],
            limits: { start: 0, end: 1000 }
          }
        }
      ])
    );
    expect(localPlaylistDispatch.addItems).toHaveBeenCalledWith(
      'playlist-bayani',
      expect.arrayContaining([
        expect.objectContaining({ kind: 'audio', sourceId: 'song:55' }),
        expect.objectContaining({ kind: 'audio', sourceId: 'song:56' })
      ])
    );
    expect(target!.textContent).toContain('Added 2 selected items to playlist.');
  });

  it('edits classic card titles through the matching Kodi SetDetails method', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('New Sinnerman');

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
        playerDispatch: { playMusicItem: vi.fn() } as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
      }
    });
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button'))
      .find((button) => button.textContent?.trim() === 'Edit')
      ?.click();
    await settle();

    expect(promptSpy).toHaveBeenCalledWith('Edit title', 'Sinnerman');
    expect(fakeClient.calls.at(-1)).toEqual({
      method: 'AudioLibrary.SetSongDetails',
      params: { songid: 55, title: 'New Sinnerman' }
    });
    expect(target!.textContent).toContain('Saved title for New Sinnerman.');
    promptSpy.mockRestore();
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

    const panes = target!.querySelector<HTMLElement>('.classic-filter-panes');
    expect(panes).toBeInstanceOf(HTMLElement);
    expect(panes?.classList.contains('show-filters')).toBe(true);
    expect(panes?.classList.contains('show-options')).toBe(false);
    expect(target!.querySelector('.classic-filter-pane.current')?.textContent).toContain('Music');
    expect(target!.querySelector('.filters-page .classic-pane-title')?.textContent).toContain(
      'Sections'
    );

    target!.querySelector<HTMLButtonElement>('.filters-page .classic-pane-title')?.click();
    await settle();

    expect(panes?.classList.contains('show-filters')).toBe(false);
    expect(panes?.classList.contains('show-options')).toBe(false);

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

  it('initializes classic filters from hash query params and writes filter changes back to the hash URL', async () => {
    window.history.replaceState({}, '', '/#movies?year=2026');
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'movies' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: {
          ...emptyVideoSnapshot(),
          isEmpty: false,
          movies: [
            { movieid: 1, label: 'Future Movie', title: 'Future Movie', year: 2026 },
            { movieid: 2, label: 'Past Movie', title: 'Past Movie', year: 1987 }
          ]
        } as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash' }
      }
    });
    await settle();

    expect(target!.textContent).toContain('Future Movie');
    expect(target!.textContent).not.toContain('Past Movie');
    expect(target!.textContent).toContain('2026');

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Filters'))
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.filters-page button'))
      .find((button) => button.textContent?.trim() === 'year')
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === '1987')
      ?.click();
    await settle();

    expect(window.location.hash).toBe('#movies?year=2026&year=1987');
    expect(target!.textContent).toContain('Future Movie');
    expect(target!.textContent).toContain('Past Movie');
  });

  it('exposes Chorus2 movie and TV filter sections exactly', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'movies' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never
      }
    });
    await settle();

    const movieFilters = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.filters-page button')
    )
      .map((button) => button.textContent?.replace(/\s+/g, ' ').trim())
      .filter((text) => text && text !== '‹ Sections');

    expect(movieFilters).toEqual([
      'year',
      'genre',
      'writer',
      'director',
      'actor',
      'set',
      'unwatched',
      'watched',
      'in progress',
      'rated',
      'studio',
      'Thumbs up',
      'tag'
    ]);

    unmount(mounted!);
    mounted = null;
    document.body.innerHTML = '<div id="target"></div>';

    mounted = mount(LibraryPage, {
      target: document.getElementById('target') as HTMLElement,
      props: {
        route: { kind: 'tvshows' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never
      }
    });
    await settle();

    const tvFilters = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.filters-page button')
    )
      .map((button) => button.textContent?.replace(/\s+/g, ' ').trim())
      .filter((text) => text && text !== '‹ Sections');

    expect(tvFilters).toEqual([
      'year',
      'genre',
      'unwatched',
      'in progress',
      'actor',
      'rated',
      'studio',
      'Thumbs up',
      'tag'
    ]);
  });
});
