import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaSearchPanel, {
  type MediaSearchActionDispatch,
  type MediaSearchPanelDispatch
} from './MediaSearchPanel.svelte';
import { createTranslationContext, type TranslationContext } from '$lib/i18n';
import { createSearchAddonsStore, type SearchAddonsStore } from '$lib/stores/searchAddons.svelte';
import type { MediaSearchStoreSnapshot } from '$lib/stores/mediaSearch.svelte';
import type { SearchAddonSetting } from '$lib/stores/searchAddons.svelte';

type MountedComponent = ReturnType<typeof mount>;
type MediaSearchSnapshotOverrides = Partial<
  Omit<MediaSearchStoreSnapshot, 'results' | 'limits' | 'resultCounts'>
> & {
  results?: Partial<MediaSearchStoreSnapshot['results']>;
  limits?: Partial<MediaSearchStoreSnapshot['limits']>;
  resultCounts?: Partial<MediaSearchStoreSnapshot['resultCounts']>;
};

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createSnapshot(overrides: MediaSearchSnapshotOverrides = {}): MediaSearchStoreSnapshot {
  const base: MediaSearchStoreSnapshot = {
    searchStatus: 'ready',
    scope: 'music',
    query: 'nina',
    lastUpdatedAt: '2026-04-30T12:00:00.000Z',
    results: {
      artists: [{ kind: 'artist', artistid: 1, label: 'Nina Simone', genre: ['Jazz', 'Soul'] }],
      albums: [
        {
          kind: 'album',
          albumid: 10,
          label: 'Pastel Blues',
          title: 'Pastel Blues',
          artist: ['Nina Simone'],
          year: 1965
        }
      ],
      songs: [
        {
          kind: 'song',
          songid: 3,
          label: 'Sinnerman',
          title: 'Sinnerman',
          artist: ['Nina Simone'],
          album: 'Pastel Blues',
          duration: 622,
          track: 8,
          playcount: 3
        }
      ],
      genres: [{ kind: 'genre', genreid: 30, label: 'Jazz', title: 'Jazz' }],
      movies: [{ kind: 'movie', movieid: 40, label: 'Nina', title: 'Nina', year: 2016 }],
      tvShows: [{ kind: 'tvshow', tvshowid: 50, label: 'Nina TV', title: 'Nina TV', year: 2026 }],
      musicVideos: [
        {
          kind: 'musicvideo',
          musicvideoid: 60,
          label: 'Nina Live',
          title: 'Nina Live',
          artist: ['Nina Simone'],
          album: 'Live',
          year: 1969
        }
      ]
    },
    limits: {
      artists: { start: 0, end: 1, total: 1 },
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 },
      genres: { start: 0, end: 1, total: 1 },
      movies: { start: 0, end: 1, total: 1 },
      tvShows: { start: 0, end: 1, total: 1 },
      musicVideos: { start: 0, end: 1, total: 1 }
    },
    resultCounts: {
      artists: 1,
      albums: 1,
      songs: 1,
      genres: 1,
      movies: 1,
      tvShows: 1,
      musicVideos: 1,
      total: 7
    },
    isEmpty: false,
    lastError: null
  };

  return {
    ...base,
    ...overrides,
    results: { ...base.results, ...overrides.results },
    limits: { ...base.limits, ...overrides.limits },
    resultCounts: { ...base.resultCounts, ...overrides.resultCounts }
  };
}

function createEmptySnapshot(
  overrides: MediaSearchSnapshotOverrides = {}
): MediaSearchStoreSnapshot {
  return createSnapshot({
    searchStatus: 'idle',
    query: '',
    lastUpdatedAt: null,
    results: {
      artists: [],
      albums: [],
      songs: [],
      genres: [],
      movies: [],
      tvShows: [],
      musicVideos: []
    },
    limits: {
      artists: { start: 0, end: 0, total: 0 },
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 },
      genres: { start: 0, end: 0, total: 0 },
      movies: { start: 0, end: 0, total: 0 },
      tvShows: { start: 0, end: 0, total: 0 },
      musicVideos: { start: 0, end: 0, total: 0 }
    },
    resultCounts: {
      artists: 0,
      albums: 0,
      songs: 0,
      genres: 0,
      movies: 0,
      tvShows: 0,
      musicVideos: 0,
      total: 0
    },
    isEmpty: true,
    lastError: null,
    ...overrides
  });
}

function createDispatch(
  overrides: Partial<MediaSearchPanelDispatch> = {}
): MediaSearchPanelDispatch {
  return {
    search: vi.fn(),
    clear: vi.fn(),
    ...overrides
  };
}

function createActionDispatch(
  overrides: Partial<MediaSearchActionDispatch> = {}
): MediaSearchActionDispatch {
  return {
    playMusicItem: vi.fn(),
    queueMusicItem: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: {
    snapshot?: MediaSearchStoreSnapshot;
    dispatch?: MediaSearchPanelDispatch;
    actionDispatch?: MediaSearchActionDispatch;
    i18n?: TranslationContext;
    searchAddons?: SearchAddonsStore;
  } = {}
): { dispatch: MediaSearchPanelDispatch; actionDispatch: MediaSearchActionDispatch } {
  const dispatch = props.dispatch ?? createDispatch();
  const actionDispatch = props.actionDispatch ?? createActionDispatch();
  mounted = mount(MediaSearchPanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      actionDispatch,
      i18n: props.i18n ?? createTranslationContext('en'),
      searchAddons: props.searchAddons
    }
  });
  return { dispatch, actionDispatch };
}

function resetMounted(): void {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function statusText(): string {
  return document.querySelector('[role="status"]')?.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (b) => b.getAttribute('aria-label') === labelOrText || b.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    const found = Array.from(document.querySelectorAll('button'))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())
      .join(', ');
    throw new Error(`Button not found: "${labelOrText}". Found: ${found}`);
  }
  return match;
}

function searchInput(): HTMLInputElement {
  const input = document.querySelector('#media-search-query');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Search input not found.');
  }
  return input;
}

function submitSearch(): void {
  const form = document.querySelector('form[role="search"]');
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Search form not found.');
  }
  form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
  expect(value).not.toContain('raw response body');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
}

describe('MediaSearchPanel', () => {
  it('renders an accessible shared media search surface with grouped music results', () => {
    renderPanel();

    const region = document.querySelector('section[aria-labelledby="media-search-title"]');
    expect(region).not.toBeNull();
    expect(document.querySelector('#media-search-title')?.textContent).toContain('Media Search');
    expect(document.querySelector('form[role="search"]')).not.toBeNull();
    expect(document.querySelector('label[for="media-search-query"]')?.textContent).toContain(
      'Search music'
    );
    expect(document.querySelector('select[name="scope"]')).not.toBeNull();
    expect(searchInput().value).toBe('nina');
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');

    const text = screenText();
    expect(statusText()).toContain('Music results for nina.');
    expect(text).toContain('Media Search');
    expect(text).toContain('Music results');
    expect(text).toContain('Artists');
    expect(text).toContain('Albums');
    expect(text).toContain('Songs');
    expect(text).toContain('Genres');
    expect(text).toContain('Movies');
    expect(text).toContain('TV Shows');
    expect(text).toContain('Music Videos');
    expect(text).toContain('Search providers');
    expect(text).toContain('Google');
    expect(text).toContain('IMDb');
    expect(text).toContain('TVDb');
    expect(text).toContain('TMDb');
    expect(text).toContain('SoundCloud');
    expect(text).toContain('YouTube');
    expect(text).toContain('Nina Simone');
    expect(text).toContain('Pastel Blues');
    expect(text).toContain('Sinnerman');
    expect(text).toContain('Jazz');
    expect(text).toContain('Nina TV');
    expect(text).toContain('Nina Live');
    expect(text).toContain('7 results');
  });

  it('keeps movie and TV search routes scoped instead of relabeling them as music', async () => {
    const { dispatch } = renderPanel({
      snapshot: createSnapshot({
        scope: 'movie',
        query: 'bunny',
        results: {
          artists: [],
          albums: [],
          songs: [],
          genres: [],
          movies: [
            { kind: 'movie', movieid: 40, label: 'Big Buck Bunny', title: 'Big Buck Bunny' }
          ],
          tvShows: [],
          musicVideos: []
        },
        limits: {
          artists: { start: 0, end: 0, total: 0 },
          albums: { start: 0, end: 0, total: 0 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 0, total: 0 },
          movies: { start: 0, end: 1, total: 1 },
          tvShows: { start: 0, end: 0, total: 0 },
          musicVideos: { start: 0, end: 0, total: 0 }
        },
        resultCounts: {
          artists: 0,
          albums: 0,
          songs: 0,
          genres: 0,
          movies: 1,
          tvShows: 0,
          musicVideos: 0,
          total: 1
        },
        isEmpty: false
      })
    });
    await tick();

    const scope = document.querySelector<HTMLSelectElement>('select[name="scope"]');
    expect(document.querySelector('label[for="media-search-query"]')?.textContent).toContain(
      'Search movies'
    );
    expect(searchInput().placeholder).toBe('Movie title');
    expect(scope?.value).toBe('movie');
    expect(statusText()).toContain('Movie results for bunny. 1 result.');
    expect(screenText()).toContain('Movie results');
    expect(screenText()).toContain('Big Buck Bunny');
    expect(screenText()).not.toContain('Music results for bunny');
    expect(screenText()).not.toContain('music results');

    scope!.value = 'tvshow';
    scope!.dispatchEvent(new Event('change', { bubbles: true }));
    searchInput().value = 'lost';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));
    submitSearch();
    await tick();

    expect(dispatch.search).toHaveBeenCalledWith({ query: 'lost', scope: 'tvshow' });
  });

  it('renders Chorus2 external and custom add-on search links for the current query', () => {
    const searchAddons = createSearchAddonsStore({ storage: null });
    searchAddons.replace([
      {
        id: 'custom.addon.youtube',
        title: 'Kodi YouTube',
        url: 'plugin://plugin.video.youtube/search/?q=[QUERY]',
        media: 'video',
        weight: 0
      },
      {
        id: 'custom.addon.music',
        title: 'Music Plug-in',
        url: 'plugin://plugin.audio.example/search/?q={query}',
        media: 'music',
        weight: 1
      }
    ]);

    renderPanel({ searchAddons });

    const google = document.querySelector('a[href^="https://www.google.com"]');
    const imdb = document.querySelector('a[href^="https://www.imdb.com"]');
    const tvdb = document.querySelector('a[href^="https://thetvdb.com"]');
    const tmdb = document.querySelector('a[href^="https://www.themoviedb.org"]');
    const soundcloud = document.querySelector('a[href^="https://soundcloud.com"]');
    const youtube = document.querySelector('a[href^="https://www.youtube.com"]');
    const kodiYoutube = document.querySelector(
      'a[data-custom-addon-search="custom.addon.youtube"]'
    );
    const musicPlugin = document.querySelector('a[data-custom-addon-search="custom.addon.music"]');

    expect(google?.getAttribute('href')).toContain('nina');
    expect(imdb?.getAttribute('href')).toContain('nina');
    expect(tvdb?.getAttribute('href')).toContain('nina');
    expect(tmdb?.getAttribute('href')).toContain('nina');
    expect(soundcloud?.getAttribute('href')).toContain('nina');
    expect(youtube?.getAttribute('href')).toContain('nina');
    expect(kodiYoutube?.textContent).toBe('Kodi YouTube');
    expect(kodiYoutube?.getAttribute('href')).toContain('/browser/video/');
    expect(kodiYoutube?.getAttribute('href')).toContain('plugin.video.youtube');
    expect(kodiYoutube?.getAttribute('href')).toContain('q%3Dnina');
    expect(musicPlugin?.textContent).toBe('Music Plug-in');
    expect(musicPlugin?.getAttribute('href')).toContain('/browser/music/');
    expect(musicPlugin?.getAttribute('href')).toContain('plugin.audio.example');
  });

  it('loads custom add-on search results inline without leaving the search screen', async () => {
    const searchAddons = createSearchAddonsStore({ storage: null });
    searchAddons.replace([
      {
        id: 'custom.addon.youtube',
        title: 'Kodi YouTube',
        url: 'plugin://plugin.video.youtube/search/?q=[QUERY]',
        media: 'video',
        weight: 0
      }
    ]);
    const dispatch = createDispatch({
      searchAddon: vi.fn(async ({ row, query }: { row: SearchAddonSetting; query: string }) => ({
        row,
        query,
        items: [
          {
            file: 'plugin://plugin.video.youtube/play/?video_id=abc',
            filetype: 'file',
            label: `Video result for ${query}`,
            thumbnail: 'image://thumb.jpg/'
          }
        ]
      }))
    } as Partial<MediaSearchPanelDispatch>);

    renderPanel({ searchAddons, dispatch });

    const addonButton = button('Search Kodi YouTube add-on');
    addonButton.click();
    await tick();
    await tick();

    expect(dispatch.searchAddon).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'nina',
        row: expect.objectContaining({
          id: 'custom.addon.youtube',
          url: 'plugin://plugin.video.youtube/search/?q=[QUERY]'
        })
      })
    );
    expect(screenText()).toContain('Kodi YouTube results');
    expect(screenText()).toContain('Video result for nina');
    expect(document.querySelector('a[data-custom-addon-search="custom.addon.youtube"]')).toBeNull();
  });

  it('renders disabled provider controls without keyboard-focusable placeholder links', () => {
    const searchAddons = createSearchAddonsStore({ storage: null });
    searchAddons.replace([
      {
        id: 'custom.addon.music',
        title: 'Music Plug-in',
        url: 'plugin://plugin.audio.example/search/?q={query}',
        media: 'music',
        weight: 0
      }
    ]);

    renderPanel({
      snapshot: createEmptySnapshot(),
      searchAddons,
      dispatch: createDispatch({
        searchAddon: vi.fn()
      } as Partial<MediaSearchPanelDispatch>)
    });

    expect(
      Array.from(document.querySelectorAll('.provider-search__links a')).some(
        (link) => link.getAttribute('href') === '#'
      )
    ).toBe(false);
    expect(button('Search Music Plug-in add-on').disabled).toBe(true);
  });

  it('renders German search labels, counts, empty states, and fallback labels', () => {
    renderPanel({
      i18n: createTranslationContext('de'),
      snapshot: createEmptySnapshot({
        searchStatus: 'ready',
        query: 'zzzz',
        results: {
          artists: [{ kind: 'artist', artistid: 1, label: 'smb://secret/share/artist' }],
          albums: [],
          songs: [],
          genres: [],
          movies: [],
          tvShows: [],
          musicVideos: []
        },
        limits: {
          artists: { start: 0, end: 1, total: 1 },
          albums: { start: 0, end: 0, total: 0 },
          songs: { start: 0, end: 0, total: 0 },
          genres: { start: 0, end: 0, total: 0 },
          movies: { start: 0, end: 0, total: 0 },
          tvShows: { start: 0, end: 0, total: 0 },
          musicVideos: { start: 0, end: 0, total: 0 }
        },
        resultCounts: {
          artists: 1,
          albums: 0,
          songs: 0,
          genres: 0,
          movies: 0,
          tvShows: 0,
          musicVideos: 0,
          total: 1
        },
        isEmpty: false
      })
    });

    const text = screenText();
    expect(document.querySelector('#media-search-title')?.textContent).toContain('Mediensuche');
    expect(document.querySelector('label[for="media-search-query"]')?.textContent).toContain(
      'Musik suchen'
    );
    expect(searchInput().placeholder).toBe('Künstler, Album, Song oder Genre');
    expect(statusText()).toContain('Musikergebnisse für zzzz. 1 Ergebnis.');
    expect(text).toContain('Künstler');
    expect(text).toContain('Unbekannter Künstler');
    expect(text).toContain('Keine Alben in diesen Musikergebnissen.');
    expect(text).toContain('1 Ergebnis');
    expect(button('Medien suchen')).not.toBeNull();
    expect(button('Mediensuche leeren')).not.toBeNull();
    expectSecretSafe(text);
  });

  it('submits a trimmed query and clears through injected dispatch only', async () => {
    const { dispatch } = renderPanel({ snapshot: createEmptySnapshot() });
    const input = searchInput();
    const scope = document.querySelector<HTMLSelectElement>('select[name="scope"]');
    expect(scope).not.toBeNull();
    scope!.value = 'video';
    scope!.dispatchEvent(new Event('change', { bubbles: true }));
    input.value = '  pastel blues  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    submitSearch();
    await tick();

    expect(dispatch.search).toHaveBeenCalledTimes(1);
    expect(dispatch.search).toHaveBeenCalledWith({ query: 'pastel blues', scope: 'video' });

    button('Clear media search').click();
    await tick();

    expect(dispatch.clear).toHaveBeenCalledTimes(1);
  });

  it('renders idle, loading, empty, and error lifecycle status copy', () => {
    renderPanel({ snapshot: createEmptySnapshot() });
    expect(statusText()).toContain('Search music across Kodi.');
    expect(screenText()).toContain('No music results yet.');

    resetMounted();

    renderPanel({ snapshot: createEmptySnapshot({ searchStatus: 'loading', query: 'nina' }) });
    expect(statusText()).toContain('Searching music for nina…');
    expect(button('Search media').disabled).toBe(true);

    resetMounted();

    renderPanel({ snapshot: createEmptySnapshot({ searchStatus: 'ready', query: 'zzzz' }) });
    expect(statusText()).toContain('No music results found for zzzz.');

    resetMounted();

    renderPanel({
      snapshot: createEmptySnapshot({
        searchStatus: 'error',
        query: 'nina',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with localStorage raw response body smb://nas/private/song.flac'
        }
      })
    });
    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expectSecretSafe(screenText());
  });

  it('sanitizes hostile labels and metadata while preserving safe fallbacks', () => {
    renderPanel({
      snapshot: createSnapshot({
        results: {
          artists: [{ kind: 'artist', artistid: 1, label: 'smb://secret/share/artist' }],
          albums: [
            {
              kind: 'album',
              albumid: 10,
              label: 'C:\\music\\secret.flac',
              title: '/mnt/media/album',
              artist: ['http://example.test/private']
            }
          ],
          songs: [
            {
              kind: 'song',
              songid: 3,
              label: 'https://example.test/song.mp3',
              title: 'Safe Song',
              album: 'smb://nas/private'
            }
          ],
          genres: [{ kind: 'genre', genreid: 30, label: 'Authorization: Basic abc123' }]
        }
      })
    });

    const text = screenText();
    expect(text).toContain('Unknown artist');
    expect(text).toContain('Unknown album');
    expect(text).toContain('Safe Song');
    expect(text).toContain('credentials [redacted]');
    expectSecretSafe(text);
  });

  it('plays and queues only finite artist, album, and song IDs with narrow action payloads', async () => {
    const { actionDispatch } = renderPanel({
      snapshot: createSnapshot({
        results: {
          artists: [
            { kind: 'artist', artistid: 1, label: 'Nina Simone' },
            { kind: 'artist', artistid: Number.NaN, label: 'Invalid Artist' }
          ],
          albums: [
            { kind: 'album', albumid: 10, label: 'Pastel Blues', title: 'Pastel Blues' },
            { kind: 'album', albumid: Number.POSITIVE_INFINITY, label: 'Invalid Album' }
          ],
          songs: [
            { kind: 'song', songid: 3, label: 'Sinnerman', title: 'Sinnerman' },
            { kind: 'song', songid: 0, label: 'Invalid Song' }
          ],
          genres: [{ kind: 'genre', genreid: 30, label: 'Jazz', title: 'Jazz' }]
        },
        resultCounts: {
          artists: 2,
          albums: 2,
          songs: 2,
          genres: 1,
          movies: 0,
          tvShows: 0,
          musicVideos: 0,
          total: 7
        },
        isEmpty: false
      })
    });

    button('Play artist Nina Simone').click();
    await tick();
    await tick();
    button('Queue artist Nina Simone').click();
    await tick();
    await tick();
    button('Play album Pastel Blues').click();
    await tick();
    await tick();
    button('Queue album Pastel Blues').click();
    await tick();
    await tick();
    button('Play song Sinnerman').click();
    await tick();
    await tick();
    button('Queue song Sinnerman').click();
    await tick();

    expect(actionDispatch.playMusicItem).toHaveBeenCalledTimes(3);
    expect(actionDispatch.playMusicItem).toHaveBeenNthCalledWith(1, { kind: 'artist', id: 1 });
    expect(actionDispatch.playMusicItem).toHaveBeenNthCalledWith(2, { kind: 'album', id: 10 });
    expect(actionDispatch.playMusicItem).toHaveBeenNthCalledWith(3, { kind: 'song', id: 3 });
    expect(actionDispatch.queueMusicItem).toHaveBeenCalledTimes(3);
    expect(actionDispatch.queueMusicItem).toHaveBeenNthCalledWith(1, { kind: 'artist', id: 1 });
    expect(actionDispatch.queueMusicItem).toHaveBeenNthCalledWith(2, { kind: 'album', id: 10 });
    expect(actionDispatch.queueMusicItem).toHaveBeenNthCalledWith(3, { kind: 'song', id: 3 });

    const labels = Array.from(document.querySelectorAll('button')).map(
      (node) => node.getAttribute('aria-label') ?? node.textContent ?? ''
    );
    expect(labels.some((label) => label.includes('genre Jazz') && label.startsWith('Play'))).toBe(
      false
    );
    expect(labels.some((label) => label.includes('genre Jazz') && label.startsWith('Queue'))).toBe(
      false
    );
    expect(
      labels.some((label) => label.includes('Invalid Artist') && label.startsWith('Play'))
    ).toBe(false);
    expect(
      labels.some((label) => label.includes('Invalid Album') && label.startsWith('Queue'))
    ).toBe(false);
    expect(labels.some((label) => label.includes('Invalid Song') && label.startsWith('Play'))).toBe(
      false
    );
  });

  it('disables matching music action buttons while pending and reports sanitized rejection copy', async () => {
    let resolveAction: (() => void) | undefined;
    const actionDispatch = createActionDispatch({
      playMusicItem: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve;
          })
      ),
      queueMusicItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with sessionStorage raw response body and smb://nas/private/song.flac'
        );
      })
    });

    renderPanel({ actionDispatch });

    const playArtist = button('Play artist Nina Simone');
    const queueArtist = button('Queue artist Nina Simone');
    playArtist.click();
    await tick();

    expect(playArtist.disabled).toBe(true);
    expect(queueArtist.disabled).toBe(true);
    expect(statusText()).toContain('Playing artist Nina Simone…');
    playArtist.click();
    expect(actionDispatch.playMusicItem).toHaveBeenCalledTimes(1);

    resolveAction?.();
    await tick();
    await tick();

    expect(playArtist.disabled).toBe(false);
    expect(statusText()).toContain('Played artist Nina Simone.');

    button('Queue song Sinnerman').click();
    await tick();
    await tick();

    const text = screenText();
    expect(statusText()).toContain('Could not queue song Sinnerman');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('browser storage');
    expect(text).toContain('response body [redacted]');
    expect(button('Queue song Sinnerman').disabled).toBe(false);
    expectSecretSafe(text);
  });

  it('renders rejected search and clear dispatch failures as sanitized local status', async () => {
    const dispatch = createDispatch({
      search: vi.fn(async () => {
        throw new Error(
          'Search failed at http://admin:p@ssword@example.test/jsonrpc with localStorage raw response body'
        );
      }),
      clear: vi.fn(async () => {
        throw new Error('Clear failed for smb://nas/private with Authorization: Basic abc123');
      })
    });

    renderPanel({ dispatch });
    searchInput().value = 'nina';
    searchInput().dispatchEvent(new Event('input', { bubbles: true }));
    submitSearch();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not search music.');
    expect(statusText()).toContain('browser storage');
    expectSecretSafe(screenText());

    button('Clear media search').click();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not clear media search.');
    expect(statusText()).toContain('credentials [redacted]');
    expectSecretSafe(screenText());
  });
});
