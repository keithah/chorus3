import { describe, expect, it } from 'vitest';

import { KodiHttpClientError } from '$lib/kodi';
import {
  VideoLibraryClientError,
  cloneVideoLibraryLimits,
  cloneVideoLibraryMovieSnapshots,
  cloneVideoLibrarySafeError,
  cloneVideoLibrarySnapshot,
  createVideoLibrarySafeError,
  normalizeSeasonArtworkRefreshCapability,
  normalizeVideoEpisodeDetail,
  normalizeVideoEpisodes,
  normalizeVideoLibraryLimits,
  normalizeVideoMovieDetail,
  normalizeVideoMovieVersions,
  normalizeVideoMovies,
  normalizeVideoSeasons,
  normalizeVideoTvShowDetail,
  normalizeVideoTvShows,
  type VideoLibraryStoreSnapshot
} from './videoLibraryNormalization';

function expectSecretSafe(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('file');
  expect(serialized).not.toContain('p@ssword');
  expect(serialized).not.toContain('admin:p@ssword');
  expect(serialized).not.toContain('Authorization');
  expect(serialized).not.toContain('Basic ');
  expect(serialized).not.toContain('http://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('https://admin:p@ssword@kodi.local');
  expect(serialized).not.toContain('smb://secret');
  expect(serialized).not.toContain('localStorage');
  expect(serialized).not.toContain('raw response body');
}

describe('video library normalization helpers', () => {
  it('normalizes Kodi movie records while dropping malformed ids and raw file paths', () => {
    const movies = normalizeVideoMovies([
      'bad',
      { movieid: Number.NaN, label: 'Dropped movie' },
      { movieid: 0, label: 'Zero id is allowed by Kodi' },
      {
        movieid: 42,
        label: 'Alien',
        title: 'Alien',
        year: 1979,
        runtime: 7020,
        thumbnail: 'image://poster.jpg/',
        fanart: 'image://fanart.jpg/',
        art: { poster: 'poster.jpg', fanart: 'fanart.jpg', bad: 123 },
        playcount: 1,
        lastplayed: '2026-01-01 01:02:03',
        resume: { position: 12.5, total: 7020, ignored: 'nope' },
        dateadded: '2025-12-31 23:59:58',
        file: 'smb://secret/video/Alien.mkv'
      },
      {
        movieid: 43,
        label: '',
        title: '',
        year: Number.POSITIVE_INFINITY,
        runtime: Number.NaN,
        thumbnail: 123,
        fanart: null,
        art: ['bad'],
        playcount: -1,
        resume: { position: 'bad', total: 100 },
        file: 'http://admin:p@ssword@kodi.local/video/hostile.mkv'
      }
    ]);

    expect(movies).toEqual([
      { movieid: 0, label: 'Zero id is allowed by Kodi' },
      {
        movieid: 42,
        label: 'Alien',
        title: 'Alien',
        year: 1979,
        runtime: 7020,
        thumbnail: 'image://poster.jpg/',
        fanart: 'image://fanart.jpg/',
        art: { poster: 'poster.jpg', fanart: 'fanart.jpg' },
        playcount: 1,
        lastplayed: '2026-01-01 01:02:03',
        resume: { position: 12.5, total: 7020 },
        dateadded: '2025-12-31 23:59:58',
        watched: true
      },
      { movieid: 43, label: 'Unknown movie' }
    ]);
    expectSecretSafe(movies);
  });

  it('normalizes malformed containers limits and resume metadata to safe fallback values', () => {
    expect(normalizeVideoMovies(null)).toEqual([]);
    expect(normalizeVideoMovies({ bad: true })).toEqual([]);
    expect(
      normalizeVideoMovies([
        { movieid: '7', label: 'Dropped' },
        { movieid: 7, label: '' }
      ])
    ).toEqual([{ movieid: 7, label: 'Unknown movie' }]);

    expect(normalizeVideoLibraryLimits(null, [{ movieid: 5 }])).toEqual({
      start: 0,
      end: 1,
      total: 1
    });
    expect(
      normalizeVideoLibraryLimits(
        { start: Number.NaN, end: Number.POSITIVE_INFINITY, total: 'many' },
        [{ movieid: 5 }]
      )
    ).toEqual({ start: 0, end: 1, total: 1 });
    expect(normalizeVideoLibraryLimits({ start: 5, end: 10, total: 50 }, [])).toEqual({
      start: 5,
      end: 10,
      total: 50
    });
  });

  it('normalizes safe rich movie detail metadata with watched resume artwork and default unsupported versions', () => {
    const detail = normalizeVideoMovieDetail({
      movieid: 42,
      label: 'Alien',
      title: 'Alien',
      year: 1979,
      runtime: 7020,
      plot: 'A safe plot.',
      plotoutline: 'Safe outline.',
      tagline: 'In space no one can hear you scream.',
      genre: ['Horror', 'Sci-Fi', '', 'smb://secret/genre'],
      director: ['Ridley Scott', 'http://admin:p@ssword@kodi.local/director'],
      writer: ['Dan O Bannon'],
      cast: [{ name: 'Sigourney Weaver' }, { name: 'Tom Skerritt' }],
      studio: ['20th Century Fox'],
      mpaa: 'R',
      rating: 8.5,
      userrating: 9,
      premiered: '1979-05-25',
      imdbnumber: 'tt0078748',
      streamdetails: {
        video: [{ codec: 'h264', width: 720, height: 294, aspect: 120 }],
        audio: [
          { codec: 'aac', channels: 2, language: 'eng' },
          { codec: 'aac', channels: 6, language: 'pol' }
        ],
        subtitle: [{ language: 'eng' }]
      },
      uniqueid: { imdb: 'tt0078748', hostile: 'smb://secret/id', empty: '' },
      thumbnail: 'image://poster.jpg/',
      fanart: 'http://cdn.example/fanart.jpg',
      art: {
        poster: 'image://poster.jpg/',
        fanart: 'https://cdn.example/fanart.jpg',
        file: 'smb://secret/poster.jpg',
        bad: 123
      },
      playcount: 1,
      resume: { position: 12.5, total: 7020 },
      file: 'smb://secret/video/Alien.mkv'
    });

    expect(detail).toEqual({
      movieid: 42,
      label: 'Alien',
      title: 'Alien',
      year: 1979,
      runtime: 7020,
      thumbnail: 'image://poster.jpg/',
      fanart: 'http://cdn.example/fanart.jpg',
      art: {
        poster: 'image://poster.jpg/',
        fanart: 'https://cdn.example/fanart.jpg'
      },
      plot: 'A safe plot.',
      plotoutline: 'Safe outline.',
      tagline: 'In space no one can hear you scream.',
      genre: ['Horror', 'Sci-Fi'],
      director: ['Ridley Scott'],
      writer: ['Dan O Bannon'],
      cast: ['Sigourney Weaver', 'Tom Skerritt'],
      studio: ['20th Century Fox'],
      mpaa: 'R',
      rating: 8.5,
      userrating: 9,
      premiered: '1979-05-25',
      imdbnumber: 'tt0078748',
      streamdetails: {
        video: ['H264 SD (720 X 294) [UNKNOWN ASPECT RATIO]'],
        audio: ['AAC 2.1 (ENGLISH)', 'AAC 6 (POLISH)'],
        subtitle: ['ENGLISH']
      },
      uniqueid: { imdb: 'tt0078748' },
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: { poster: true, fanart: true },
      playcount: 1,
      watched: true,
      resume: { position: 12.5, total: 7020 },
      versions: {
        status: 'unsupported',
        reason: 'Kodi movie versions are not available through a proven JSON-RPC detail API.'
      }
    });
    expectSecretSafe(detail);
  });

  it('normalizes malformed detail and D030 movie version states without unsafe labels', () => {
    expect(normalizeVideoMovieDetail(null)).toBeNull();
    expect(normalizeVideoMovieDetail({ movieid: '42', label: 'Dropped' })).toBeNull();
    expect(
      normalizeVideoMovieDetail({
        movieid: 7,
        label: '',
        playcount: 0,
        resume: { position: 0, total: 0 },
        genre: 'not-array',
        uniqueid: ['bad'],
        thumbnail: 'smb://secret/poster.jpg',
        fanart: 'https://admin:p@ssword@example/fanart.jpg',
        art: { poster: 'smb://secret/poster.jpg' },
        versions: { status: 'ready', items: [{ id: 1, label: 'Unsafe smb://secret/file.mkv' }] }
      })
    ).toEqual({
      movieid: 7,
      label: 'Unknown movie',
      playcount: 0,
      watched: false,
      resume: { position: 0, total: 0 },
      thumbnailAvailable: false,
      fanartAvailable: false,
      artwork: {},
      versions: { status: 'unavailable', reason: 'No safe movie versions are available.' }
    });

    expect(normalizeVideoMovieVersions({ status: 'unsupported', reason: 'not proven' })).toEqual({
      status: 'unsupported',
      reason: 'not proven'
    });
    expect(
      normalizeVideoMovieVersions({ status: 'error', message: 'Authorization: Basic abc123' })
    ).toEqual({
      status: 'error',
      message: 'credentials [redacted]'
    });
    expect(
      normalizeVideoMovieVersions({
        status: 'ready',
        selectedId: 2,
        items: [
          { id: 1, label: 'Theatrical cut' },
          { id: 2, label: 'Director cut' },
          { id: 3, label: 'http://admin:p@ssword@example/file.mkv' },
          { id: Number.NaN, label: 'Bad id' }
        ]
      })
    ).toEqual({
      status: 'ready',
      selectedId: 2,
      items: [
        { id: 1, label: 'Theatrical cut' },
        { id: 2, label: 'Director cut' }
      ]
    });
  });

  it('creates safe client unknown and Kodi HTTP error snapshots with redacted diagnostic text', () => {
    const hostileMessage =
      'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/video, localStorage, password, raw response body';

    expect(
      createVideoLibrarySafeError(
        new VideoLibraryClientError('client/no-active-host', hostileMessage)
      )
    ).toMatchObject({
      source: 'client',
      code: 'client/no-active-host',
      message: expect.stringContaining('credentials [redacted]')
    });
    expect(createVideoLibrarySafeError(new Error(hostileMessage))).toMatchObject({
      source: 'unknown',
      code: 'refresh-failed',
      message: expect.stringContaining('redacted-url')
    });

    const httpError = createVideoLibrarySafeError(
      new KodiHttpClientError({
        code: 'json-rpc-error',
        method: 'VideoLibrary.GetMovies',
        endpoint: {
          protocol: 'http:',
          host: 'kodi.local',
          port: 8080,
          path: '/jsonrpc',
          timeoutMs: 5000,
          hasCredentials: true
        },
        jsonRpcError: { code: -32000, message: hostileMessage }
      })
    );

    expect(httpError).toMatchObject({
      source: 'http',
      code: 'json-rpc-error',
      endpoint: { host: 'kodi.local', hasCredentials: true }
    });
    expect(JSON.stringify([httpError])).toContain('redacted-url');
    expect(JSON.stringify([httpError])).toContain('redacted-path');
    expect(JSON.stringify([httpError])).toContain('credentials [redacted]');
    expect(JSON.stringify([httpError])).toContain('browser storage');
    expectSecretSafe([httpError]);
  });

  it('clones nested movie artwork resume recent arrays limits errors and store snapshots', () => {
    const movies = [
      {
        movieid: 42,
        label: 'Alien',
        art: { poster: 'poster.jpg' },
        resume: { position: 12.5, total: 7020 }
      }
    ];
    const episodes = [
      {
        episodeid: 77,
        tvshowid: 7,
        season: 1,
        episode: 2,
        label: 'Recent episode',
        art: { thumb: 'episode.jpg' },
        resume: { position: 20, total: 3600 }
      }
    ];
    const limits = { start: 0, end: 1, total: 1 };
    const error = {
      source: 'http' as const,
      code: 'http',
      message: 'safe',
      endpoint: {
        protocol: 'http:' as const,
        host: 'kodi.local',
        port: 8080,
        path: '/jsonrpc',
        timeoutMs: 5000,
        hasCredentials: true
      }
    };

    const clonedMovies = cloneVideoLibraryMovieSnapshots(movies);
    const clonedLimits = cloneVideoLibraryLimits(limits);
    const clonedError = cloneVideoLibrarySafeError(error);

    clonedMovies[0].art!.poster = 'mutated.jpg';
    clonedMovies[0].resume!.position = 99;
    clonedLimits.total = 999;
    clonedError!.endpoint!.host = 'mutated.example';

    expect(movies[0].art.poster).toBe('poster.jpg');
    expect(movies[0].resume.position).toBe(12.5);
    expect(limits.total).toBe(1);
    expect(error.endpoint.host).toBe('kodi.local');

    const snapshot: VideoLibraryStoreSnapshot = {
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-01-01T00:00:00.000Z',
      movies,
      tvShows: [],
      recentlyAddedMovies: movies,
      recentlyPlayedMovies: movies,
      recentlyAddedEpisodes: episodes,
      recentlyPlayedEpisodes: episodes,
      limits: {
        movies: limits,
        tvShows: { start: 0, end: 0, total: 0 },
        recentlyAddedMovies: limits,
        recentlyPlayedMovies: limits,
        recentlyAddedEpisodes: limits,
        recentlyPlayedEpisodes: limits
      },
      isEmpty: false,
      lastError: error
    };

    const clonedSnapshot = cloneVideoLibrarySnapshot(snapshot);
    clonedSnapshot.movies[0].art!.poster = 'snapshot-mutated.jpg';
    clonedSnapshot.movies[0].resume!.total = 1;
    clonedSnapshot.recentlyAddedMovies[0].label = 'Mutated recent movie';
    clonedSnapshot.recentlyPlayedMovies[0].art!.poster = 'recent-mutated.jpg';
    clonedSnapshot.recentlyAddedEpisodes[0].art!.thumb = 'mutated-episode.jpg';
    clonedSnapshot.recentlyPlayedEpisodes[0].resume!.position = 99;
    clonedSnapshot.limits.movies.end = 100;
    clonedSnapshot.limits.recentlyAddedMovies.total = 100;
    clonedSnapshot.limits.recentlyPlayedEpisodes.total = 100;
    clonedSnapshot.lastError!.endpoint!.path = '/mutated';

    expect(snapshot.movies[0].art!.poster).toBe('poster.jpg');
    expect(snapshot.movies[0].resume!.total).toBe(7020);
    expect(snapshot.recentlyAddedMovies[0].label).toBe('Alien');
    expect(snapshot.recentlyPlayedMovies[0].art!.poster).toBe('poster.jpg');
    expect(snapshot.recentlyAddedEpisodes[0].art!.thumb).toBe('episode.jpg');
    expect(snapshot.recentlyPlayedEpisodes[0].resume!.position).toBe(20);
    expect(snapshot.limits.movies.end).toBe(1);
    expect(snapshot.limits.recentlyAddedMovies.total).toBe(1);
    expect(snapshot.limits.recentlyPlayedEpisodes.total).toBe(1);
    expect(snapshot.lastError!.endpoint!.path).toBe('/jsonrpc');
  });

  it('normalizes TV shows and detail snapshots with unwatched counts and safe artwork', () => {
    const tvShows = normalizeVideoTvShows([
      'bad',
      { tvshowid: Number.NaN, label: 'Dropped' },
      {
        tvshowid: 7,
        label: 'Severance',
        title: 'Severance',
        year: 2022,
        thumbnail: 'image://poster.jpg/',
        fanart: 'image://fanart.jpg/',
        art: { poster: 'poster.jpg', file: 'smb://secret/poster.jpg', bad: 123 },
        episode: 9,
        watchedepisodes: 3,
        playcount: 0,
        lastplayed: '',
        dateadded: '2026-01-01 00:00:00',
        file: 'http://admin:p@ssword@kodi.local/show'
      },
      {
        tvshowid: 8,
        label: '',
        title: '',
        episode: 2,
        watchedepisodes: 5,
        thumbnail: 'smb://secret/poster.jpg'
      }
    ]);

    expect(tvShows).toEqual([
      {
        tvshowid: 7,
        label: 'Severance',
        title: 'Severance',
        year: 2022,
        thumbnail: 'image://poster.jpg/',
        fanart: 'image://fanart.jpg/',
        art: { poster: 'poster.jpg' },
        episodeCount: 9,
        watchedEpisodeCount: 3,
        unwatchedEpisodes: 6,
        hasUnwatched: true,
        playcount: 0,
        watched: false,
        dateadded: '2026-01-01 00:00:00'
      },
      {
        tvshowid: 8,
        label: 'Unknown TV show',
        episodeCount: 2,
        watchedEpisodeCount: 5,
        unwatchedEpisodes: 0,
        hasUnwatched: false
      }
    ]);

    const detail = normalizeVideoTvShowDetail({
      tvshowid: 7,
      label: 'Severance',
      plot: 'Safe plot',
      genre: ['Drama', 'smb://secret/genre'],
      studio: ['Apple TV+'],
      uniqueid: { imdb: 'tt11280740', hostile: 'Authorization: Basic abc123' },
      thumbnail: 'image://poster.jpg/',
      fanart: 'https://cdn.example/fanart.jpg',
      art: { poster: 'poster.jpg', fanart: 'fanart.jpg', file: 'smb://secret/poster.jpg' },
      episode: 9,
      watchedepisodes: 3,
      file: 'smb://secret/show'
    });

    expect(detail).toMatchObject({
      tvshowid: 7,
      label: 'Severance',
      plot: 'Safe plot',
      genre: ['Drama'],
      studio: ['Apple TV+'],
      uniqueid: { imdb: 'tt11280740' },
      thumbnailAvailable: true,
      fanartAvailable: true,
      artwork: { poster: true, fanart: true },
      episodeCount: 9,
      watchedEpisodeCount: 3,
      unwatchedEpisodes: 6,
      hasUnwatched: true
    });
    expect(normalizeVideoTvShowDetail({ tvshowid: '7', label: 'Dropped' })).toBeNull();
    expectSecretSafe([tvShows, detail]);
  });

  it('normalizes seasons episodes and episode details with safe IDs ordering and resume boundaries', () => {
    expect(normalizeVideoSeasons(null)).toEqual([]);
    expect(
      normalizeVideoSeasons([
        { tvshowid: 7, season: -1, label: 'Dropped special' },
        { tvshowid: 7, season: 2, label: 'Season 2', episode: 3, watchedepisodes: 1 },
        { tvshowid: 'bad', season: 3, label: 'Season 3' }
      ])
    ).toEqual([
      {
        tvshowid: 7,
        season: 2,
        label: 'Season 2',
        episodeCount: 3,
        watchedEpisodeCount: 1,
        unwatchedEpisodes: 2,
        hasUnwatched: true
      }
    ]);

    const episodes = normalizeVideoEpisodes([
      { episodeid: 12, tvshowid: 7, season: 2, episode: 2, label: 'Second', playcount: 1 },
      {
        episodeid: 11,
        tvshowid: 7,
        season: 2,
        episode: 1,
        title: 'First',
        playcount: 0,
        resume: { position: 5000, total: 3600 },
        file: 'smb://secret/episode.mkv'
      },
      { episodeid: 13, tvshowid: 7, season: -1, episode: 3, label: 'Dropped' },
      { episodeid: Number.NaN, tvshowid: 7, season: 2, episode: 3, label: 'Dropped' }
    ]);

    expect(episodes).toEqual([
      {
        episodeid: 11,
        tvshowid: 7,
        season: 2,
        episode: 1,
        label: 'First',
        title: 'First',
        playcount: 0,
        watched: false,
        resume: { position: 5000, total: 3600 }
      },
      {
        episodeid: 12,
        tvshowid: 7,
        season: 2,
        episode: 2,
        label: 'Second',
        playcount: 1,
        watched: true
      }
    ]);

    expect(
      normalizeVideoEpisodeDetail({
        episodeid: 11,
        tvshowid: 7,
        season: 2,
        episode: 1,
        title: 'First',
        plot: 'Safe plot',
        director: ['Ben Stiller', 'smb://secret/director'],
        writer: ['Dan Erickson'],
        uniqueid: { imdb: 'tt123', hostile: 'raw response body' },
        thumbnail: 'image://episode.jpg/',
        art: { thumb: 'image://episode.jpg/', file: 'smb://secret/episode.jpg' },
        playcount: 0,
        resume: { position: 123, total: 3600 }
      })
    ).toMatchObject({
      episodeid: 11,
      tvshowid: 7,
      season: 2,
      episode: 1,
      label: 'First',
      plot: 'Safe plot',
      director: ['Ben Stiller'],
      writer: ['Dan Erickson'],
      uniqueid: { imdb: 'tt123' },
      thumbnailAvailable: true,
      artwork: { thumb: true },
      playcount: 0,
      watched: false,
      resume: { position: 123, total: 3600 }
    });
    expect(normalizeVideoEpisodeDetail({ episodeid: 0, label: 'Dropped' })).toBeNull();
    expectSecretSafe(episodes);
  });

  it('normalizes season artwork refresh capability without overstating support or leaking errors', () => {
    expect(
      normalizeSeasonArtworkRefreshCapability({
        availablearttypes: ['poster', 'fanart', '', 'file'],
        availableart: {
          poster: ['image://poster.jpg/'],
          fanart: [],
          file: ['smb://secret/art.jpg']
        }
      })
    ).toEqual({
      status: 'supported',
      reason: 'Season artwork refresh is available.',
      availableArtTypes: ['poster', 'fanart'],
      availableArtwork: { poster: true, fanart: false }
    });

    expect(
      normalizeSeasonArtworkRefreshCapability({ availablearttypes: [], availableart: {} })
    ).toEqual({
      status: 'unsupported',
      reason: 'Kodi did not report safe season artwork types.'
    });
    expect(normalizeSeasonArtworkRefreshCapability(null)).toEqual({
      status: 'unavailable',
      reason: 'Season artwork capability response was malformed.'
    });
    expect(
      normalizeSeasonArtworkRefreshCapability({
        status: 'error',
        message: 'Authorization: Basic abc123 raw response body smb://secret/art'
      })
    ).toEqual({
      status: 'error',
      message: 'credentials [redacted] response body [redacted] redacted-path'
    });
  });

  it('normalizes recent movie and episode collections without hostile labels paths or malformed identities', () => {
    const recentMovies = normalizeVideoMovies([
      { movieid: 'bad', label: 'Dropped movie' },
      { movieid: 101, label: 'smb://secret/movie.mkv', title: 'Safe movie title' },
      {
        movieid: 102,
        label: 'Recently watched',
        thumbnail: 'image://safe-poster.jpg/',
        fanart: 'image://safe-fanart.jpg/',
        art: {
          poster: 'image://safe-poster.jpg/',
          fanart: 'image://safe-fanart.jpg/',
          file: 'smb://secret/poster.jpg'
        },
        lastplayed: '2026-04-01 10:11:12',
        dateadded: '2026-03-01 01:02:03',
        file: 'http://admin:p@ssword@kodi.local/movie.mkv'
      }
    ]);
    const recentEpisodes = normalizeVideoEpisodes([
      { episodeid: 'bad', label: 'Dropped episode' },
      { episodeid: 201, season: 'bad', label: 'Dropped malformed season' },
      {
        episodeid: 202,
        label: 'smb://secret/episode.mkv',
        title: 'Safe episode title',
        showtitle: 'Safe show',
        episode: 4,
        thumbnail: 'image://episode-thumb.jpg/',
        fanart: 'image://episode-fanart.jpg/',
        art: {
          thumb: 'image://episode-thumb.jpg/',
          file: 'special://profile/Thumbnails/secret.jpg'
        },
        playcount: 1,
        lastplayed: '2026-04-02 10:11:12',
        resume: { position: 30, total: 1800 },
        dateadded: '2026-03-02 01:02:03',
        file: 'smb://secret/show/episode.mkv'
      },
      {
        episodeid: 203,
        tvshowid: 7,
        season: 1,
        episode: 5,
        label: 'Safe routed episode'
      }
    ]);

    expect(recentMovies).toEqual([
      { movieid: 101, label: 'Safe movie title', title: 'Safe movie title' },
      {
        movieid: 102,
        label: 'Recently watched',
        thumbnail: 'image://safe-poster.jpg/',
        fanart: 'image://safe-fanart.jpg/',
        art: { poster: 'image://safe-poster.jpg/', fanart: 'image://safe-fanart.jpg/' },
        lastplayed: '2026-04-01 10:11:12',
        dateadded: '2026-03-01 01:02:03'
      }
    ]);
    expect(recentEpisodes).toEqual([
      {
        episodeid: 202,
        episode: 4,
        label: 'Safe episode title',
        title: 'Safe episode title',
        showtitle: 'Safe show',
        thumbnail: 'image://episode-thumb.jpg/',
        fanart: 'image://episode-fanart.jpg/',
        art: { thumb: 'image://episode-thumb.jpg/' },
        playcount: 1,
        watched: true,
        lastplayed: '2026-04-02 10:11:12',
        resume: { position: 30, total: 1800 },
        dateadded: '2026-03-02 01:02:03'
      },
      {
        episodeid: 203,
        tvshowid: 7,
        season: 1,
        episode: 5,
        label: 'Safe routed episode'
      }
    ]);
    expectSecretSafe([recentMovies, recentEpisodes]);
  });

  it('treats recent-only video snapshots as non-empty', () => {
    const snapshot = cloneVideoLibrarySnapshot({
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-01-01T00:00:00.000Z',
      movies: [],
      tvShows: [],
      recentlyAddedMovies: [{ movieid: 1, label: 'Recent movie' }],
      recentlyPlayedMovies: [],
      recentlyAddedEpisodes: [],
      recentlyPlayedEpisodes: [],
      limits: {
        movies: { start: 0, end: 0, total: 0 },
        tvShows: { start: 0, end: 0, total: 0 },
        recentlyAddedMovies: { start: 0, end: 1, total: 1 },
        recentlyPlayedMovies: { start: 0, end: 0, total: 0 },
        recentlyAddedEpisodes: { start: 0, end: 0, total: 0 },
        recentlyPlayedEpisodes: { start: 0, end: 0, total: 0 }
      },
      isEmpty: false,
      lastError: null
    });

    expect(snapshot.isEmpty).toBe(false);
    expect(snapshot.recentlyAddedMovies).toEqual([{ movieid: 1, label: 'Recent movie' }]);
  });
});
