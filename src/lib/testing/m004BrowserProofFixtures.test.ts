import { describe, expect, test, vi } from 'vitest';

import {
  M004_BROWSER_PROOF_FORBIDDEN_TEXT,
  createM004BrowserProofAppProps,
  isM004BrowserProofFixtureSecretSafe
} from './m004BrowserProofFixtures';

function collectText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'function') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectText(nested)}`)
      .join('\n');
  }

  return '';
}

describe('createM004BrowserProofAppProps', () => {
  test('creates safe routed video movie grid fixture props with distinctive movie states', () => {
    const props = createM004BrowserProofAppProps({
      pathname: '/video/movies',
      search: '?m004-browser-proof=1'
    });

    expect(props.route).toEqual({ kind: 'videoMovies' });
    expect(props.videoLibrarySnapshot.refreshStatus).toBe('ready');
    expect(props.videoLibrarySnapshot.isEmpty).toBe(false);
    expect(props.videoLibrarySnapshot.movies).toHaveLength(2);
    expect(props.videoLibrarySnapshot.limits.movies).toEqual({ start: 0, end: 25, total: 503 });

    const labels = props.videoLibrarySnapshot.movies.map((movie) => movie.label);
    expect(labels).toContain('Neon Harbor');
    expect(labels).toContain('Quiet Signal');
    expect(props.videoLibrarySnapshot.recentlyAddedMovies.map((movie) => movie.label)).toContain(
      'Neon Harbor'
    );
    expect(props.videoLibrarySnapshot.recentlyPlayedMovies.map((movie) => movie.label)).toContain(
      'Quiet Signal'
    );
    expect(
      props.videoLibrarySnapshot.recentlyAddedEpisodes.map((episode) => episode.label)
    ).toContain('Signal Mirror');
    expect(
      props.videoLibrarySnapshot.recentlyPlayedEpisodes.map((episode) => episode.label)
    ).toContain('Cold Open');
    expect(props.videoLibrarySnapshot.recentlyPlayedMovies.map((movie) => movie.label)).toEqual([
      'Quiet Signal',
      'Neon Harbor'
    ]);
    expect(
      props.videoLibrarySnapshot.recentlyPlayedEpisodes.map((episode) => episode.label)
    ).toEqual(['Cold Open', 'Signal Mirror']);
    expect(props.videoLibrarySnapshot.limits.recentlyAddedMovies.total).toBe(2);
    expect(props.videoLibrarySnapshot.limits.recentlyAddedEpisodes.total).toBe(2);
    expect(props.videoLibrarySnapshot.limits.recentlyPlayedMovies).toEqual({
      start: 0,
      end: 25,
      total: 503
    });
    expect(props.videoLibrarySnapshot.limits.recentlyPlayedEpisodes).toEqual({
      start: 0,
      end: 25,
      total: 503
    });
    expect(props.videoMediaPlaylistsSnapshot.media).toBe('video');
    expect(props.videoMediaPlaylistsSnapshot.playlists.map((playlist) => playlist.label)).toContain(
      'Rain City Thrillers.xsp'
    );
    expect(props.videoMediaPlaylistsSnapshot.playlists[0]?.capabilities).toMatchObject({
      canBrowse: true,
      canPlay: false,
      canQueue: false
    });
    expect(props.videoMediaPlaylistsSnapshot.entries.map((entry) => entry.mediaKind)).toContain(
      'video'
    );
    expect(
      props.videoLibrarySnapshot.movies.some(
        (movie) => movie.watched === true || (movie.playcount ?? 0) > 0
      )
    ).toBe(true);
    expect(
      props.videoLibrarySnapshot.movies.some((movie) => (movie.resume?.position ?? 0) > 0)
    ).toBe(true);
    expect(
      props.videoLibrarySnapshot.movies.some(
        (movie) =>
          typeof (movie as typeof movie & { versionCount?: unknown }).versionCount === 'number'
      )
    ).toBe(true);
  });

  test('uses inert video playlist dispatch behavior without playable side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies' });

    await expect(props.videoMediaPlaylistsDispatch.refresh()).resolves.toBeUndefined();
    await expect(
      props.videoMediaPlaylistsDispatch.openPlaylist('video-playlist:thrillers')
    ).resolves.toBeUndefined();
    await expect(
      props.videoMediaPlaylistsDispatch.openBreadcrumb('video-playlist:thrillers')
    ).resolves.toBeUndefined();
    await expect(
      props.videoMediaPlaylistsActionDispatch.playPlaylistItem({
        id: 'video-playlist:thrillers',
        label: 'Rain City Thrillers.xsp',
        media: 'video',
        kind: 'smart',
        capabilities: { canBrowse: true, canPlay: false, canQueue: false }
      })
    ).rejects.toThrow('Video playlist actions are disabled.');
    await expect(
      props.videoMediaPlaylistsActionDispatch.queuePlaylistItem({
        id: 'video-playlist:thrillers',
        label: 'Rain City Thrillers.xsp',
        media: 'video',
        kind: 'smart',
        capabilities: { canBrowse: true, canPlay: false, canQueue: false }
      })
    ).rejects.toThrow('Video playlist actions are disabled.');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(isM004BrowserProofFixtureSecretSafe(props.videoMediaPlaylistsSnapshot)).toBe(true);
    expect(isM004BrowserProofFixtureSecretSafe(props.videoMediaPlaylistsDispatch)).toBe(true);
    expect(isM004BrowserProofFixtureSecretSafe(props.videoMediaPlaylistsActionDispatch)).toBe(true);
  });

  test('creates rich safe S02 movie detail fixture props for Neon Harbor', () => {
    const props = createM004BrowserProofAppProps({
      pathname: '/video/movies/4401',
      search: '?m004-browser-proof=1'
    });

    expect(props.route).toEqual({ kind: 'videoMovieDetail', movieid: 4401 });
    expect(props.videoMovieDetailSnapshot.refreshStatus).toBe('ready');
    expect(props.videoMovieDetailSnapshot.lastRefreshReason).toBe('manual');
    expect(props.videoMovieDetailSnapshot.selectedMovieId).toBe(4401);
    expect(props.videoMovieDetailSnapshot.detail).toMatchObject({
      movieid: 4401,
      label: 'Neon Harbor',
      title: 'Neon Harbor',
      year: 2024,
      runtime: 6420,
      watched: true,
      plot: 'A courier crosses a rain-lit city to protect a copied memory.',
      tagline: 'One night can rewrite a city.',
      genre: ['Science Fiction', 'Thriller'],
      director: ['Mara Voss'],
      studio: ['Signal House'],
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: { poster: true, fanart: true },
      versions: {
        status: 'ready',
        selectedId: 2,
        items: [
          { id: 1, label: 'Theatrical cut' },
          { id: 2, label: 'Director commentary cut' }
        ]
      }
    });
  });

  test('creates rich safe S03 stream fixture props for the browser streaming route', () => {
    const props = createM004BrowserProofAppProps({
      pathname: '/video/movies/4401/stream',
      search: '?m004-browser-proof=1'
    });

    expect(props.route).toEqual({ kind: 'videoMovieStream', movieid: 4401 });
    expect(props.videoLibrarySnapshot.movies.map((movie) => movie.label)).toContain('Neon Harbor');
    expect(props.videoMovieDetailSnapshot.selectedMovieId).toBeNull();
    expect(props.localPlayerSnapshot).toMatchObject({
      status: 'paused',
      mediaKind: 'video',
      currentSeconds: 1830,
      durationSeconds: 6420,
      kodiPausedForLocal: true,
      resumeAvailable: true,
      item: { movieid: 4401, label: 'Neon Harbor', title: 'Neon Harbor', type: 'movie' }
    });
  });

  test('uses inert stream action dispatch behavior without unsafe side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies/4401/stream' });

    await expect(
      props.videoMovieStreamActionDispatch.streamMovieItem({ movieid: 4401 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoMovieStreamActionDispatch.streamMovieItem({ movieid: 4401, resume: true })
    ).resolves.toBeUndefined();
    await expect(props.videoMovieStreamActionDispatch.resumeOnKodi()).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM004BrowserProofFixtureSecretSafe(props.videoMovieStreamActionDispatch)).toBe(true);
  });

  test('creates honest unsupported detail fixture props for the second movie', () => {
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies/4402' });

    expect(props.videoMovieDetailSnapshot.selectedMovieId).toBe(4402);
    expect(props.videoMovieDetailSnapshot.detail).toMatchObject({
      movieid: 4402,
      label: 'Quiet Signal',
      watched: false,
      versions: {
        status: 'unsupported',
        reason: 'Kodi movie versions are not available through the proven detail fixture.'
      }
    });
  });

  test('uses inert movie action dispatch behavior without unsafe side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies/4401' });

    await expect(
      props.videoMovieActionDispatch.playMovieItem({ movieid: 4401 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoMovieActionDispatch.resumeMovieItem({ movieid: 4401 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoMovieActionDispatch.queueMovieItem({ movieid: 4401 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoMovieActionDispatch.markMovieWatched?.({ movieid: 4401, watched: false })
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(isM004BrowserProofFixtureSecretSafe(props.videoMovieActionDispatch)).toBe(true);
  });

  test('creates safe TV fixture props for direct TV routes', async () => {
    const grid = createM004BrowserProofAppProps({
      pathname: '/video/tv',
      search: '?m004-browser-proof=1'
    });
    expect(grid.route).toEqual({ kind: 'videoTvShows' });
    expect(grid.videoLibrarySnapshot.tvShows.map((show) => show.label)).toContain('Aurora Files');
    expect(grid.videoLibrarySnapshot.limits.tvShows.total).toBe(1);

    const show = createM004BrowserProofAppProps({
      pathname: '/video/tv/5501',
      search: '?m004-browser-proof=1'
    });
    expect(show.route).toEqual({ kind: 'videoTvShowDetail', tvshowid: 5501 });
    expect(show.videoTvSnapshot.selectedTvShowId).toBe(5501);
    expect(show.videoTvSnapshot.tvShowDetail?.label).toBe('Aurora Files');
    expect(show.videoTvSnapshot.seasons.map((season) => season.label)).toContain('Season 1');

    const season = createM004BrowserProofAppProps({
      pathname: '/video/tv/5501/seasons/1',
      search: '?m004-browser-proof=1'
    });
    expect(season.route).toEqual({ kind: 'videoTvSeasonDetail', tvshowid: 5501, season: 1 });
    expect(season.videoTvSnapshot.selectedSeason).toBe(1);
    expect(season.videoTvSnapshot.episodes.map((episode) => episode.label)).toContain(
      'Signal Mirror'
    );
    expect(season.videoTvSnapshot.seasonArtworkCapability).toMatchObject({
      status: 'unsupported',
      reason: expect.stringContaining('proven JSON-RPC')
    });

    const episode = createM004BrowserProofAppProps({
      pathname: '/video/tv/5501/seasons/1/episodes/6601',
      search: '?m004-browser-proof=1'
    });
    expect(episode.route).toEqual({
      kind: 'videoEpisodeDetail',
      tvshowid: 5501,
      season: 1,
      episodeid: 6601
    });
    expect(episode.videoTvSnapshot.selectedEpisodeId).toBe(6601);
    expect(episode.videoTvSnapshot.episodeDetail?.label).toBe('Signal Mirror');
    expect(episode.videoTvSnapshot.episodeDetail?.resume?.position).toBeGreaterThan(0);
  });

  test('uses inert TV episode and artwork dispatch behavior without unsafe side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM004BrowserProofAppProps({
      pathname: '/video/tv/5501/seasons/1/episodes/6601'
    });

    await expect(
      props.videoEpisodeActionDispatch.playEpisodeItem({ episodeid: 6601 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoEpisodeActionDispatch.resumeEpisodeItem({ episodeid: 6601 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoEpisodeActionDispatch.queueEpisodeItem({ episodeid: 6601 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoEpisodeActionDispatch.streamEpisodeItem({ episodeid: 6601 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoEpisodeActionDispatch.markEpisodeWatched?.({ episodeid: 6601, watched: true })
    ).resolves.toBeUndefined();
    await expect(
      props.videoSeasonArtworkDispatch.refreshSeasonArtwork({ tvshowid: 5501, season: 1 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoSeasonWriteDispatch.markEpisodesWatched(
        [
          { episodeid: 6601, label: 'Signal Mirror' },
          { episodeid: 6602, label: 'Cold Open' }
        ],
        true
      )
    ).resolves.toMatchObject({
      total: 2,
      succeeded: 1,
      failed: 1,
      failedItems: [
        {
          kind: 'episode',
          id: 6602,
          label: 'Cold Open',
          error: {
            source: 'write',
            code: 'fixture/partial-season-write',
            message: expect.stringContaining('retry proof')
          }
        }
      ]
    });
    await expect(
      props.videoSeasonWriteDispatch.retryFailedVideoWrites([
        { episodeid: 6602, label: 'Cold Open' }
      ])
    ).resolves.toMatchObject({ total: 1, succeeded: 1, failed: 0, failedItems: [] });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM004BrowserProofFixtureSecretSafe(props.videoEpisodeActionDispatch)).toBe(true);
    expect(isM004BrowserProofFixtureSecretSafe(props.videoSeasonArtworkDispatch)).toBe(true);
    expect(isM004BrowserProofFixtureSecretSafe(props.videoSeasonWriteDispatch)).toBe(true);
  });

  test('creates safe direct detail and unknown route variants from location input', () => {
    expect(createM004BrowserProofAppProps({ pathname: '/video/movies/4402' }).route).toEqual({
      kind: 'videoMovieDetail',
      movieid: 4402
    });

    const unknown = createM004BrowserProofAppProps({
      pathname: '/video/smb://admin:p@ssword@example.local/Authorization/SENTINEL_SECRET',
      search: '?token=Basic'
    }).route;

    expect(unknown.kind).toBe('videoUnknown');
    expect(JSON.stringify(unknown)).not.toMatch(
      /smb:\/\/|admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
  });

  test('uses inert navigation dispatch behavior without network or browser storage access', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies' });

    await expect(props.videoNavigationDispatch.openMovieGrid()).resolves.toBeUndefined();
    await expect(
      props.videoNavigationDispatch.openMovieDetail({ movieid: 4401 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoNavigationDispatch.openRoute({ kind: 'videoUnknown', pathLabel: '/video/nope' })
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
  });

  test('keeps every fixture value clear of forbidden text and sentinel secrets', () => {
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies/4401/stream' });
    const text = collectText(props);

    expect(isM004BrowserProofFixtureSecretSafe(props)).toBe(true);
    for (const forbidden of M004_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(text).not.toContain(forbidden);
    }
  });
});
