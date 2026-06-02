import {
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibrarySongs,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import {
  normalizeMusicAlbums,
  normalizeMusicArtists,
  normalizeMusicSongs,
  type MusicLibraryAlbumSnapshot,
  type MusicLibraryArtistSnapshot,
  type MusicLibrarySongSnapshot
} from '$lib/stores/musicLibraryNormalization';

export async function loadKodiAlbumDetail(
  client: KodiJsonRpcHttpClient,
  albumid: number
): Promise<MusicLibraryAlbumSnapshot | null> {
  const result = await getAudioLibraryAlbums(client, {
    filter: { albumid },
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
  });
  return normalizeMusicAlbums(result.albums)[0] ?? null;
}

export async function loadKodiArtistDetail(
  client: KodiJsonRpcHttpClient,
  artistid: number
): Promise<MusicLibraryArtistSnapshot | null> {
  const result = await getAudioLibraryArtists(client, {
    filter: { artistid },
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
  });
  return normalizeMusicArtists(result.artists)[0] ?? null;
}

export async function loadKodiAlbumSongs(
  client: KodiJsonRpcHttpClient,
  albumid: number
): Promise<MusicLibrarySongSnapshot[]> {
  const result = await getAudioLibrarySongs(client, {
    filter: { albumid },
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
  });
  return normalizeMusicSongs(result.songs);
}
