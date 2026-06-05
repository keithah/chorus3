import { describe, expect, it } from 'vitest';

import {
  albumMusicBrowseDetailEmptyCopy,
  formatMusicBrowseAlbumMeta,
  formatMusicBrowseArtistMeta,
  formatMusicBrowseDetailCountSummary,
  formatMusicBrowseSelectionTitle,
  formatMusicBrowseSongMeta,
  formatMusicBrowseStatus,
  musicBrowseActionForAlbum,
  musicBrowseActionForArtist,
  musicBrowseActionForSong,
  musicBrowseActionId,
  musicBrowseActionTargetKey,
  musicBrowseEachKey,
  safeMusicBrowseAlbumLabel,
  safeMusicBrowseArtistLabel,
  safeMusicBrowseGenreLabel,
  safeMusicBrowseSelectionLabel,
  safeMusicBrowseSongLabel,
  sanitizeMusicBrowseUiText,
  songMusicBrowseDetailEmptyCopy,
  topLevelMusicBrowseEmptyCopy
} from './musicBrowsePanelModel';
import type { MusicBrowseStoreSnapshot } from '$lib/stores/musicBrowse.svelte';

function browseSnapshot(
  overrides: Partial<MusicBrowseStoreSnapshot> = {}
): MusicBrowseStoreSnapshot {
  return {
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    selection: null,
    albums: [],
    songs: [],
    limits: {
      albums: { start: 0, end: 0, total: 0 },
      songs: { start: 0, end: 0, total: 0 }
    },
    isEmpty: true,
    lastError: null,
    ...overrides
  };
}

describe('musicBrowsePanelModel', () => {
  it('formats status and selection copy without component state', () => {
    expect(formatMusicBrowseStatus(browseSnapshot())).toBe(
      'Choose an artist, album, or genre to browse.'
    );
    expect(
      formatMusicBrowseStatus(
        browseSnapshot({
          refreshStatus: 'ready',
          selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
          isEmpty: false,
          lastUpdatedAt: '2026-04-29T13:00:00.000Z'
        })
      )
    ).toBe('Showing artist Nina Simone. Last updated 2026-04-29T13:00:00.000Z.');
    expect(formatMusicBrowseSelectionTitle({ kind: 'genre', id: 30, label: 'Jazz' })).toBe(
      'Genre: Jazz'
    );
  });

  it('sanitizes unsafe labels and errors before they reach UI copy', () => {
    const secret =
      'Authorization: Basic abc123 failed at http://admin:p@ssword@example.test/jsonrpc with raw response body from localStorage and smb://nas/private/song.flac';

    const sanitized = sanitizeMusicBrowseUiText(secret);

    expect(sanitized).toContain('credentials [redacted]');
    expect(sanitized).toContain('[redacted-url]');
    expect(sanitized).toContain('response body [redacted]');
    expect(sanitized).toContain('browser storage');
    expect(safeMusicBrowseArtistLabel({ artistid: 1, label: 'smb://secret/share' })).toBe(
      'Unknown artist'
    );
    expect(safeMusicBrowseAlbumLabel({ albumid: 10, label: 'C:\\secret\\album.flac' })).toBe(
      'Unknown album'
    );
    expect(safeMusicBrowseSongLabel({ songid: 3, label: 'https://example.test/song.mp3' })).toBe(
      'Unknown song'
    );
    expect(safeMusicBrowseGenreLabel({ genreid: 30, label: '', title: '/mnt/media/genre' })).toBe(
      'Unknown genre'
    );
  });

  it('formats music metadata and count copy consistently', () => {
    expect(
      formatMusicBrowseArtistMeta({ artistid: 1, label: 'Nina Simone', genre: ['Jazz'] })
    ).toBe('Jazz');
    expect(
      formatMusicBrowseAlbumMeta({
        albumid: 10,
        label: 'Pastel Blues',
        artist: ['Nina Simone'],
        year: 1965
      })
    ).toBe('Nina Simone · 1965');
    expect(
      formatMusicBrowseSongMeta({
        songid: 3,
        label: 'Sinnerman',
        artist: ['Nina Simone'],
        album: 'Pastel Blues',
        duration: 622,
        track: 8,
        playcount: 1
      })
    ).toBe('Nina Simone · Pastel Blues · 10:22 · Track 8 · Played 1 time');
    expect(formatMusicBrowseDetailCountSummary('songs', 3, { start: 0, end: 3, total: 10 })).toBe(
      'Songs 3 of 10'
    );
  });

  it('keeps action identity and fallbacks deterministic', () => {
    const artist = musicBrowseActionForArtist({ artistid: 1, label: 'Nina Simone' });
    const album = musicBrowseActionForAlbum({ albumid: 10, label: 'Pastel Blues' });
    const song = musicBrowseActionForSong({ songid: 3, label: 'Sinnerman' });

    expect(artist).toEqual({ kind: 'artist', artistid: 1 });
    expect(album).toEqual({ kind: 'album', albumid: 10 });
    expect(song).toEqual({ kind: 'song', songid: 3 });
    expect(musicBrowseActionForSong({ songid: 0, label: 'Invalid' })).toBeNull();
    expect(musicBrowseActionId('queue', song!)).toBe('queue:song:3');
    expect(musicBrowseActionTargetKey(album!)).toBe('album:10');
    expect(musicBrowseEachKey('song', Number.NaN, 4)).toBe('song:invalid:4');
    expect(topLevelMusicBrowseEmptyCopy('genres')).toBe('No genres in this snapshot.');
    expect(
      albumMusicBrowseDetailEmptyCopy({ kind: 'album', id: 10, label: 'Pastel Blues' }, '')
    ).toBe('Album selections show songs only.');
    expect(songMusicBrowseDetailEmptyCopy('artist Nina Simone')).toBe(
      'No songs found for artist Nina Simone.'
    );
    expect(safeMusicBrowseSelectionLabel({ kind: 'artist', id: 1, label: '' })).toBe(
      'Unknown artist'
    );
  });
});
