import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LibraryPage from './LibraryPage.svelte';
import { libraryFilterStore } from '$lib/stores/libraryFilter';

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
      const filter = (params as { filter?: { albumid?: number; songid?: number } }).filter;
      if (filter?.albumid === 24) {
        return {
          songs: [
            {
              songid: 2401,
              label: 'Sprawl II',
              title: 'Sprawl II',
              artist: ['Arcade Fire'],
              album: 'The Suburbs',
              duration: 325,
              track: 16,
              thumbnail: 'image://sprawl-thumb.jpg/'
            },
            {
              songid: 2402,
              label: 'Ready to Start',
              title: 'Ready to Start',
              artist: ['Arcade Fire'],
              album: 'The Suburbs',
              duration: 255,
              track: 2,
              thumbnail: 'image://ready-thumb.jpg/'
            }
          ]
        } as TResult;
      }

      const songid = filter?.songid ?? 55;
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

    if (method === 'AudioLibrary.GetAlbums') {
      return {
        albums: [
          {
            albumid: 24,
            label: 'The Suburbs',
            title: 'The Suburbs',
            artist: ['Arcade Fire'],
            displayartist: 'Arcade Fire',
            year: 2010,
            genre: ['Indie Rock'],
            style: ['Baroque Pop'],
            mood: ['Reflective'],
            albumlabel: 'Merge',
            albumduration: 3840,
            rating: 8.5,
            userrating: 9,
            votes: '42',
            dateadded: '2026-05-30 12:00:00',
            playcount: 3,
            thumbnail: 'image://suburbs-cover.jpg/',
            fanart: 'image://suburbs-fanart.jpg/',
            description: 'A wide-screen album about memory and city edges.'
          }
        ]
      } as TResult;
    }

    if (method === 'AudioLibrary.GetArtists') {
      return {
        artists: [
          {
            artistid: 35,
            label: 'Arcade Fire',
            genre: ['Indie Rock'],
            style: ['Baroque Pop'],
            mood: ['Anthemic'],
            instrument: ['Vocals', 'Guitar'],
            yearsactive: ['2001-present'],
            formed: '2001',
            thumbnail: 'image://arcade-thumb.jpg/',
            fanart: 'image://arcade-fanart.jpg/',
            description: 'A Canadian band with layered arrangements and large ensemble shows.'
          }
        ]
      } as TResult;
    }

    if (method === 'VideoLibrary.GetEpisodes') {
      return {
        episodes: [
          { episodeid: 501, label: 'Pilot', title: 'Pilot' },
          { episodeid: 502, label: 'Second', title: 'Second' }
        ]
      } as TResult;
    }

    if (method === 'Playlist.Clear' || method === 'Playlist.Add' || method === 'Player.Open') {
      return 'OK' as TResult;
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
let anchorClickSpy: { mockRestore: () => void } | null = null;
let windowOpenSpy: { mockRestore: () => void } | null = null;

afterEach(() => {
  anchorClickSpy?.mockRestore();
  anchorClickSpy = null;
  windowOpenSpy?.mockRestore();
  windowOpenSpy = null;
  localStorage.clear();
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  fakeClient.calls = [];
  libraryFilterStore.setStoreFilters('tvshows', {});
  window.history.replaceState({}, '', '/');
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
  it('sizes music artwork as square Chorus2-style cards instead of poster boxes', async () => {
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
              albumid: 7,
              label: 'Pastel Blues',
              title: 'Pastel Blues',
              artist: ['Nina Simone'],
              thumbnail: 'image://album-thumb.jpg/'
            }
          ]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    const card = target!.querySelector<HTMLElement>('.classic-card');
    const artwork = target!.querySelector<HTMLElement>('.classic-card-art');
    expect(card?.dataset.artworkShape).toBe('square');
    expect(card?.classList.contains('art-square')).toBe(true);
    expect(card?.classList.contains('art-poster')).toBe(false);
    expect(artwork?.dataset.artworkShape).toBe('square');
    expect(artwork?.querySelector('img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Falbum-thumb.jpg%2F'
    );
  });

  it('routes classic music localplay actions through local browser playback mode', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      setMode: vi.fn(),
      playMusicItem: vi.fn()
    };
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    buttons.find((button) => button.textContent?.trim() === 'Play in browser')?.click();
    await settle();

    expect(playerDispatch.setMode).not.toHaveBeenCalled();
    expect(playerDispatch.playMusicItem).not.toHaveBeenCalled();
    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/addons/webinterface.chorus3/#local-player/music/song/55',
      '_blank',
      'toolbar=no,scrollbars=no,resizable=yes,width=925,height=590,top=100,left=100'
    );
    expect(target!.textContent).toContain('Opened browser playback for Sinnerman.');
  });

  it('routes classic movie localplay actions through browser video streaming', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      streamMovieItem: vi.fn()
    };
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    expect(target!.querySelector('.classic-card-art img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Fmovie-poster.jpg%2F'
    );
    expect(target!.querySelector<HTMLElement>('.classic-card')?.dataset.artworkShape).toBe(
      'poster'
    );
    expect(
      target!.querySelector<HTMLElement>('.classic-card')?.classList.contains('art-poster')
    ).toBe(true);

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    buttons.find((button) => button.textContent?.trim() === 'Play in browser')?.click();
    await settle();

    expect(playerDispatch.streamMovieItem).not.toHaveBeenCalled();
    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/addons/webinterface.chorus3/#local-player/movie/88',
      '_blank',
      'toolbar=no,scrollbars=no,resizable=yes,width=925,height=590,top=100,left=100'
    );
    expect(target!.textContent).toContain('Opened browser playback for Big Buck Bunny.');
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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
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

  it('edits classic cards through the full Chorus2 song metadata editor', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button'))
      .find((button) => button.textContent?.trim() === 'Edit')
      ?.click();
    await settle();

    expect(target!.textContent).toContain('Edit Song');
    expect(target!.textContent).toContain('Information');
    Array.from(target!.querySelectorAll<HTMLButtonElement>('.metadata-edit-tabs button'))
      .find((button) => button.textContent?.trim() === 'Information')
      ?.click();
    await settle();
    expect(target!.querySelector<HTMLTextAreaElement>('textarea[name="file"]')?.disabled).toBe(
      true
    );
    Array.from(target!.querySelectorAll<HTMLButtonElement>('.metadata-edit-tabs button'))
      .find((button) => button.textContent?.trim() === 'General')
      ?.click();
    await settle();
    const titleInput = target!.querySelector<HTMLInputElement>('input[name="title"]');
    const artistInput = target!.querySelector<HTMLInputElement>('input[name="artist"]');
    const ratingInput = target!.querySelector<HTMLInputElement>('input[name="rating"]');
    expect(titleInput).toBeInstanceOf(HTMLInputElement);
    expect(artistInput).toBeInstanceOf(HTMLInputElement);
    expect(ratingInput).toBeInstanceOf(HTMLInputElement);

    titleInput!.value = 'New Sinnerman';
    titleInput!.dispatchEvent(new Event('input', { bubbles: true }));
    artistInput!.value = 'Nina Simone, Live Band';
    artistInput!.dispatchEvent(new Event('input', { bubbles: true }));
    ratingInput!.value = '9.5';
    ratingInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.metadata-edit-tabs button'))
      .find((button) => button.textContent?.trim() === 'Tags')
      ?.click();
    await settle();
    const genreInput = target!.querySelector<HTMLInputElement>('input[name="genre"]');
    expect(genreInput).toBeInstanceOf(HTMLInputElement);
    genreInput!.value = 'Soul, Jazz';
    genreInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();

    target!.querySelector<HTMLButtonElement>('.metadata-edit-save')?.click();
    await settle();

    expect(fakeClient.calls.at(-1)).toEqual({
      method: 'AudioLibrary.SetSongDetails',
      params: expect.objectContaining({
        songid: 55,
        title: 'New Sinnerman',
        artist: ['Nina Simone', 'Live Band'],
        genre: ['Soul', 'Jazz'],
        rating: 9.5
      })
    });
    expect(fakeClient.calls.at(-1)?.params).not.toHaveProperty('file');
    expect(target!.textContent).toContain('Saved metadata for New Sinnerman.');
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
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicVideoDetail', musicvideoid: '77' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: playerDispatch as never,
        queueDispatch: queueDispatch as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
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
    expect(playerDispatch.streamMusicVideoItem).not.toHaveBeenCalled();
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

  it('hydrates classic album detail routes from Kodi and keeps album actions playable', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      playMusicItem: vi.fn()
    };
    const queueDispatch = {
      queueMusicItem: vi.fn()
    };
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicAlbumDetail', albumid: '24' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: playerDispatch as never,
        queueDispatch: queueDispatch as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    expect(fakeClient.calls).toEqual([
      {
        method: 'AudioLibrary.GetAlbums',
        params: {
          filter: { albumid: 24 },
          properties: [
            'title',
            'artist',
            'displayartist',
            'year',
            'thumbnail',
            'fanart',
            'description',
            'albumduration',
            'genre',
            'mood',
            'style',
            'albumlabel',
            'rating',
            'userrating',
            'votes',
            'dateadded',
            'playcount'
          ],
          limits: { start: 0, end: 1 }
        }
      },
      {
        method: 'AudioLibrary.GetSongs',
        params: {
          filter: { albumid: 24 },
          properties: [
            'title',
            'artist',
            'album',
            'duration',
            'track',
            'thumbnail',
            'playcount',
            'lastplayed',
            'dateadded'
          ],
          limits: { start: 0, end: 1000 },
          sort: { method: 'track', order: 'ascending' }
        }
      }
    ]);

    const text = target!.textContent ?? '';
    expect(text).toContain('Album');
    expect(text).toContain('The Suburbs');
    expect(text).toContain('Arcade Fire');
    expect(text).toContain('Indie Rock');
    expect(text).toContain('Baroque Pop');
    expect(text).toContain('1:04:00');
    expect(text).toContain('A wide-screen album about memory and city edges.');
    expect(text).toContain('Sprawl II');
    expect(text).toContain('Ready to Start');
    expect(target!.querySelector('.classic-music-cover img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Fsuburbs-cover.jpg%2F'
    );
    expect(target!.querySelector('.classic-music-fanart')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Fsuburbs-fanart.jpg%2F'
    );

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-music-actions button')
    );
    buttons.find((button) => button.textContent?.includes('Play'))?.click();
    buttons.find((button) => button.textContent?.includes('Queue'))?.click();
    buttons.find((button) => button.textContent?.includes('Stream'))?.click();
    await settle();

    expect(playerDispatch.playMusicItem).toHaveBeenCalledWith({ kind: 'album', albumid: 24 });
    expect(queueDispatch.queueMusicItem).toHaveBeenCalledWith({ kind: 'album', albumid: 24 });
    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/addons/webinterface.chorus3/#local-player/music/album/24',
      '_blank',
      'toolbar=no,scrollbars=no,resizable=yes,width=925,height=590,top=100,left=100'
    );
  });

  it('hydrates classic artist detail routes from Kodi and keeps artist actions playable', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);
    const playerDispatch = {
      playMusicItem: vi.fn()
    };
    const queueDispatch = {
      queueMusicItem: vi.fn()
    };
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicArtistDetail', artistid: '35' },
        musicLibrarySnapshot: {
          ...emptyMusicSnapshot(),
          isEmpty: false,
          albums: [
            {
              albumid: 24,
              label: 'The Suburbs',
              title: 'The Suburbs',
              artist: ['Arcade Fire'],
              thumbnail: 'image://suburbs-cover.jpg/'
            }
          ],
          songs: [
            {
              songid: 2401,
              label: 'Sprawl II',
              title: 'Sprawl II',
              artist: ['Arcade Fire'],
              album: 'The Suburbs',
              duration: 325,
              track: 16
            }
          ]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: playerDispatch as never,
        queueDispatch: queueDispatch as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    expect(fakeClient.calls).toEqual([
      {
        method: 'AudioLibrary.GetArtists',
        params: {
          filter: { artistid: 35 },
          properties: [
            'thumbnail',
            'fanart',
            'description',
            'born',
            'died',
            'formed',
            'yearsactive',
            'instrument',
            'genre',
            'mood',
            'style'
          ],
          limits: { start: 0, end: 1 }
        }
      }
    ]);

    const text = target!.textContent ?? '';
    expect(text).toContain('Artist');
    expect(text).toContain('Arcade Fire');
    expect(text).toContain('Indie Rock');
    expect(text).toContain('2001-present');
    expect(text).toContain('Vocals, Guitar');
    expect(text).toContain('A Canadian band with layered arrangements and large ensemble shows.');
    expect(text).toContain('The Suburbs');
    expect(text).toContain('Sprawl II');
    expect(target!.querySelector('.classic-music-cover img')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Farcade-thumb.jpg%2F'
    );
    expect(target!.querySelector('.classic-music-fanart')?.getAttribute('src')).toContain(
      '/image/image%3A%2F%2Farcade-fanart.jpg%2F'
    );

    const buttons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-music-actions button')
    );
    buttons.find((button) => button.textContent?.includes('Play'))?.click();
    buttons.find((button) => button.textContent?.includes('Queue'))?.click();
    buttons.find((button) => button.textContent?.includes('Stream'))?.click();
    await settle();

    expect(playerDispatch.playMusicItem).toHaveBeenCalledWith({ kind: 'artist', artistid: 35 });
    expect(queueDispatch.queueMusicItem).toHaveBeenCalledWith({ kind: 'artist', artistid: 35 });
    expect(windowOpenSpy).toHaveBeenCalledWith(
      '/addons/webinterface.chorus3/#local-player/music/artist/35',
      '_blank',
      'toolbar=no,scrollbars=no,resizable=yes,width=925,height=590,top=100,left=100'
    );
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
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
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

    expect(window.location.hash).toBe('#movies?sort=title&order=asc&year=2026&year=1987');
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
      'watched',
      'in progress',
      'actor',
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
        route: { kind: 'tvshowsRecent' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never
      }
    });
    await settle();

    const recentTvFilters = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.filters-page button')
    )
      .map((button) => button.textContent?.replace(/\s+/g, ' ').trim())
      .filter((text) => text && text !== '‹ Sections');

    expect(recentTvFilters).toEqual(['unwatched', 'watched', 'in progress', 'Thumbs up']);
  });

  it('applies movie genre filters from library snapshot metadata', async () => {
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
            {
              movieid: 1,
              label: 'Alpha',
              title: 'Alpha',
              year: 2020,
              genre: ['Drama']
            },
            {
              movieid: 2,
              label: 'Beta',
              title: 'Beta',
              year: 2021,
              genre: ['Comedy']
            }
          ]
        } as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never
      }
    });
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Filters'))
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.filters-page button'))
      .find((button) => button.textContent?.trim() === 'genre')
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Comedy')
      ?.click();
    await settle();

    expect(target!.textContent).toContain('Beta');
    expect(target!.textContent).not.toContain('Alpha');
  });

  it('applies TV show genre filters from library snapshot metadata', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'tvshows' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: {
          ...emptyVideoSnapshot(),
          isEmpty: false,
          tvShows: [
            {
              tvshowid: 11,
              label: 'Atlanta',
              title: 'Atlanta',
              year: 2016,
              genre: ['Comedy', 'Drama']
            },
            {
              tvshowid: 12,
              label: 'Severance',
              title: 'Severance',
              year: 2022,
              genre: ['Sci-Fi']
            }
          ]
        } as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never
      }
    });
    await settle();

    expect(target!.textContent).toContain('Atlanta');
    expect(target!.textContent).toContain('Severance');

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Filters'))
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('.filters-page button'))
      .find((button) => button.textContent?.trim() === 'genre')
      ?.click();
    await settle();

    Array.from(target!.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Comedy')
      ?.click();
    await settle();

    expect(target!.textContent).toContain('Atlanta');
    expect(target!.textContent).not.toContain('Severance');
  });

  it('exposes Chorus2 play and queue actions for TV show collection cards', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'tvshows' },
        musicLibrarySnapshot: emptyMusicSnapshot() as never,
        videoLibrarySnapshot: {
          ...emptyVideoSnapshot(),
          isEmpty: false,
          tvShows: [{ tvshowid: 11, label: 'Severance', title: 'Severance', year: 2022 }]
        } as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never
      }
    });
    await settle();

    const cardButtons = Array.from(
      target!.querySelectorAll<HTMLButtonElement>('.classic-card-actions button')
    );
    expect(cardButtons.map((button) => button.textContent?.trim())).toContain('Play');
    cardButtons.find((button) => button.textContent?.trim() === 'Play')?.click();
    await settle();

    expect(fakeClient.calls).toEqual([
      {
        method: 'VideoLibrary.GetEpisodes',
        params: {
          tvshowid: 11,
          properties: ['title'],
          limits: { start: 0, end: 1000 },
          sort: { method: 'episode', order: 'ascending' }
        }
      },
      { method: 'Playlist.Clear', params: { playlistid: 1 } },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 501 } } },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 502 } } },
      { method: 'Player.Open', params: { item: { playlistid: 1, position: 0 } } }
    ]);
    expect(target!.textContent).toContain('Played 2 episodes from Severance.');

    fakeClient.calls = [];
    cardButtons.find((button) => button.textContent?.trim() === 'Queue')?.click();
    await settle();

    expect(fakeClient.calls).toEqual([
      {
        method: 'VideoLibrary.GetEpisodes',
        params: {
          tvshowid: 11,
          properties: ['title'],
          limits: { start: 0, end: 1000 },
          sort: { method: 'episode', order: 'ascending' }
        }
      },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 501 } } },
      { method: 'Playlist.Add', params: { playlistid: 1, item: { episodeid: 502 } } }
    ]);
    expect(target!.textContent).toContain('Queued 2 episodes from Severance.');
  });

  it('resolves Chorus2-style music genre detail routes by genre label', async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const target = document.getElementById('target');
    expect(target).toBeInstanceOf(HTMLElement);

    mounted = mount(LibraryPage, {
      target: target as HTMLElement,
      props: {
        route: { kind: 'musicGenreDetail', genreid: 'Hip-Hop' },
        musicLibrarySnapshot: {
          ...emptyMusicSnapshot(),
          isEmpty: false,
          genres: [{ genreid: 1, label: 'Hip-Hop', title: 'Hip-Hop' }],
          artists: [{ artistid: 35, label: 'Blue Scholars', genre: ['Hip-Hop'] }]
        } as never,
        videoLibrarySnapshot: emptyVideoSnapshot() as never,
        playerDispatch: {} as never,
        queueDispatch: {} as never,
        buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3/' }
      }
    });
    await settle();

    expect(target!.textContent).toContain('Hip-Hop');
    expect(target!.textContent).toContain('Blue Scholars');
    expect(target!.textContent).not.toContain('No artists found for this genre.');
  });
});
