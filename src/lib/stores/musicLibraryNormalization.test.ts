import { describe, expect, it } from 'vitest';

import { KodiHttpClientError } from '$lib/kodi';
import {
  MusicLibraryClientError,
  cloneMusicLibraryAlbumSnapshots,
  cloneMusicLibraryArtistSnapshots,
  cloneMusicLibraryGenreSnapshots,
  cloneMusicLibraryLimits,
  cloneMusicLibrarySafeError,
  cloneMusicLibrarySnapshot,
  cloneMusicLibrarySongSnapshots,
  createMusicLibrarySafeError,
  normalizeMusicAlbums,
  normalizeMusicArtists,
  normalizeMusicGenres,
  normalizeMusicLimits,
  normalizeMusicSongs,
  type MusicLibraryStoreSnapshot
} from './musicLibraryNormalization';

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

describe('music library normalization helpers', () => {
  it('normalizes artist album song and genre lists while dropping malformed entries and unsafe fields', () => {
    expect(
      normalizeMusicArtists([
        'bad',
        { artistid: Number.NaN, label: 'Dropped artist' },
        { artistid: 1, label: 'Autechre', thumbnail: 'artist.jpg', genre: ['Electronic', 123] },
        { artistid: 2, label: '', title: '' }
      ])
    ).toEqual([
      { artistid: 1, label: 'Autechre', thumbnail: 'artist.jpg', genre: ['Electronic'] },
      { artistid: 2, label: 'Unknown artist' }
    ]);

    expect(
      normalizeMusicAlbums([
        null,
        { albumid: Number.POSITIVE_INFINITY, label: 'Dropped album' },
        {
          albumid: 10,
          label: 'Tri Repetae',
          title: 'Tri Repetae',
          artist: ['Autechre', 7],
          year: 1995,
          thumbnail: 'album.jpg'
        },
        { albumid: 11, label: '', title: '', artist: 'invalid', year: Number.NaN }
      ])
    ).toEqual([
      {
        albumid: 10,
        label: 'Tri Repetae',
        title: 'Tri Repetae',
        artist: ['Autechre'],
        year: 1995,
        thumbnail: 'album.jpg'
      },
      { albumid: 11, label: 'Unknown album' }
    ]);

    const songs = normalizeMusicSongs([
      undefined,
      { songid: Number.NaN, label: 'Dropped song' },
      {
        songid: 100,
        label: 'Dael',
        title: 'Dael',
        artist: ['Autechre', false],
        album: 'Tri Repetae',
        duration: 380,
        track: 1,
        thumbnail: 'song.jpg',
        playcount: 4,
        lastplayed: '2026-01-01 01:02:03',
        file: 'smb://secret/music/Dael.flac'
      },
      { songid: 101, label: '', file: 'http://admin:p@ssword@kodi.local/song.mp3' }
    ]);
    expect(songs).toEqual([
      {
        songid: 100,
        label: 'Dael',
        title: 'Dael',
        artist: ['Autechre'],
        album: 'Tri Repetae',
        duration: 380,
        track: 1,
        thumbnail: 'song.jpg',
        playcount: 4,
        lastplayed: '2026-01-01 01:02:03'
      },
      { songid: 101, label: 'Unknown song' }
    ]);
    expectSecretSafe(songs);

    expect(
      normalizeMusicGenres([
        { genreid: Number.NaN, label: 'Dropped genre' },
        { genreid: 200, label: 'Electronic', title: 'Electronic', thumbnail: 'genre.jpg' },
        { genreid: 201, label: '', title: '' }
      ])
    ).toEqual([
      { genreid: 200, label: 'Electronic', title: 'Electronic', thumbnail: 'genre.jpg' },
      { genreid: 201, label: 'Unknown genre' }
    ]);
  });

  it('normalizes malformed containers and missing limits to safe empty or fallback values', () => {
    expect(normalizeMusicArtists(null)).toEqual([]);
    expect(normalizeMusicAlbums({ bad: true })).toEqual([]);
    expect(normalizeMusicSongs(['bad', 123, null])).toEqual([]);
    expect(normalizeMusicGenres(undefined)).toEqual([]);

    expect(normalizeMusicLimits(null, [{ songid: 5 }])).toEqual({ start: 0, end: 1, total: 1 });
    expect(
      normalizeMusicLimits(
        { start: Number.NaN, end: Number.POSITIVE_INFINITY, total: 'many' },
        [{ songid: 5 }]
      )
    ).toEqual({ start: 0, end: 1, total: 1 });
    expect(normalizeMusicLimits({ start: 5, end: 10, total: 50 }, [])).toEqual({
      start: 5,
      end: 10,
      total: 50
    });
  });

  it('creates safe client unknown and Kodi HTTP error snapshots with redacted diagnostic text', () => {
    const hostileMessage =
      'GET http://admin:p@ssword@kodi.local/jsonrpc failed with Authorization: Basic abc123, smb://secret/music, localStorage, password, raw response body';

    expect(createMusicLibrarySafeError(new MusicLibraryClientError('client/no-active-host', hostileMessage))).toMatchObject({
      source: 'client',
      code: 'client/no-active-host',
      message: expect.stringContaining('credentials [redacted]')
    });
    expect(createMusicLibrarySafeError(new Error(hostileMessage))).toMatchObject({
      source: 'unknown',
      code: 'refresh-failed',
      message: expect.stringContaining('redacted-url')
    });

    const httpError = createMusicLibrarySafeError(
      new KodiHttpClientError({
        code: 'json-rpc-error',
        method: 'AudioLibrary.GetSongs',
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

  it('clones nested arrays limits errors and snapshots so mutations cannot affect source data', () => {
    const artists = [{ artistid: 1, label: 'Autechre', genre: ['Electronic'] }];
    const albums = [{ albumid: 10, label: 'Tri Repetae', artist: ['Autechre'] }];
    const songs = [{ songid: 100, label: 'Dael', artist: ['Autechre'] }];
    const genres = [{ genreid: 200, label: 'Electronic' }];
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

    const clonedArtists = cloneMusicLibraryArtistSnapshots(artists);
    const clonedAlbums = cloneMusicLibraryAlbumSnapshots(albums);
    const clonedSongs = cloneMusicLibrarySongSnapshots(songs);
    const clonedGenres = cloneMusicLibraryGenreSnapshots(genres);
    const clonedLimits = cloneMusicLibraryLimits(limits);
    const clonedError = cloneMusicLibrarySafeError(error);

    clonedArtists[0].genre!.push('Mutated artist genre');
    clonedAlbums[0].artist!.push('Mutated album artist');
    clonedSongs[0].artist!.push('Mutated song artist');
    clonedGenres[0].label = 'Mutated genre';
    clonedLimits.total = 999;
    clonedError!.endpoint!.host = 'mutated.example';

    expect(artists[0].genre).toEqual(['Electronic']);
    expect(albums[0].artist).toEqual(['Autechre']);
    expect(songs[0].artist).toEqual(['Autechre']);
    expect(genres[0].label).toBe('Electronic');
    expect(limits.total).toBe(1);
    expect(error.endpoint.host).toBe('kodi.local');

    const snapshot: MusicLibraryStoreSnapshot = {
      refreshStatus: 'ready',
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-01-01T00:00:00.000Z',
      artists,
      albums,
      songs,
      genres,
      limits: { artists: limits, albums: limits, songs: limits, genres: limits },
      isEmpty: false,
      lastError: error
    };

    const clonedSnapshot = cloneMusicLibrarySnapshot(snapshot);
    clonedSnapshot.songs[0].artist!.push('Snapshot mutation');
    clonedSnapshot.limits.songs.total = 500;
    clonedSnapshot.lastError!.endpoint!.host = 'snapshot-mutated.example';

    expect(snapshot.songs[0].artist).toEqual(['Autechre']);
    expect(snapshot.limits.songs.total).toBe(1);
    expect(snapshot.lastError!.endpoint!.host).toBe('kodi.local');
  });
});
