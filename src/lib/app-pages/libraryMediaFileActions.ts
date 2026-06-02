import {
  getAudioLibrarySongs,
  getVideoLibraryEpisodeDetails,
  getVideoLibraryMovieDetails,
  getVideoLibraryMusicVideoDetails,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import type { LocalPlaylistItemInput } from '$lib/stores/localPlaylist.svelte';
import type {
  DownloadableCardAction,
  LocalPlaylistCardAction
} from '$lib/app-pages/libraryCardActions';

export async function resolveLibraryDownloadFile(
  client: KodiJsonRpcHttpClient,
  action: DownloadableCardAction
): Promise<string | null> {
  if (action.media === 'music') {
    const result = await getAudioLibrarySongs(client, {
      filter: { songid: action.songid },
      properties: ['file'],
      limits: { start: 0, end: 1 }
    });
    return rawFileFromRecord(result.songs?.[0]);
  }

  if (action.media === 'movie') {
    const result = await getVideoLibraryMovieDetails(client, {
      movieid: action.movieid,
      properties: ['file']
    });
    return rawFileFromRecord(result.moviedetails);
  }

  if (action.media === 'episode') {
    const result = await getVideoLibraryEpisodeDetails(client, {
      episodeid: action.episodeid,
      properties: ['file']
    });
    return rawFileFromRecord(result.episodedetails);
  }

  const result = await getVideoLibraryMusicVideoDetails(client, {
    musicvideoid: action.musicvideoid,
    properties: ['file']
  });
  return rawFileFromRecord(result.musicvideodetails);
}

export async function resolveLibraryLocalPlaylistItems(
  client: KodiJsonRpcHttpClient,
  action: LocalPlaylistCardAction
): Promise<LocalPlaylistItemInput[]> {
  const result = await getAudioLibrarySongs(client, {
    filter: localPlaylistSongFilter(action),
    properties: ['title', 'artist', 'album', 'duration', 'thumbnail', 'file'],
    limits: { start: 0, end: 1000 }
  });

  return recordsToLocalPlaylistItems(result.songs);
}

function localPlaylistSongFilter(
  action: LocalPlaylistCardAction
): { artistid: number } | { albumid: number } | { songid: number } {
  if (action.kind === 'artist') return { artistid: action.artistid };
  if (action.kind === 'album') return { albumid: action.albumid };
  return { songid: action.songid };
}

function recordsToLocalPlaylistItems(records: unknown): LocalPlaylistItemInput[] {
  if (!Array.isArray(records)) return [];

  return records.flatMap((record): LocalPlaylistItemInput[] => {
    if (typeof record !== 'object' || record === null || Array.isArray(record)) return [];
    const value = record as Record<string, unknown>;
    const file = typeof value.file === 'string' ? value.file.trim() : '';
    if (!file) return [];

    return [
      {
        kind: 'audio',
        label: localPlaylistSongLabel(value),
        file,
        ...(typeof value.songid === 'number' && Number.isSafeInteger(value.songid)
          ? { sourceId: `song:${value.songid}` }
          : {}),
        ...(typeof value.duration === 'number' && Number.isFinite(value.duration)
          ? { durationSeconds: value.duration }
          : {}),
        ...(typeof value.thumbnail === 'string' && value.thumbnail.trim()
          ? { thumbnail: value.thumbnail.trim() }
          : {})
      }
    ];
  });
}

function localPlaylistSongLabel(value: Record<string, unknown>): string {
  const title =
    typeof value.title === 'string' && value.title.trim()
      ? value.title.trim()
      : typeof value.label === 'string' && value.label.trim()
        ? value.label.trim()
        : 'Unknown song';
  const artists = Array.isArray(value.artist)
    ? value.artist.filter(
        (artist): artist is string => typeof artist === 'string' && artist.trim().length > 0
      )
    : [];

  return artists.length > 0 ? `${artists.join(', ')} - ${title}` : title;
}

function rawFileFromRecord(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const file = (value as { file?: unknown }).file;
  return typeof file === 'string' && file.trim().length > 0 ? file.trim() : null;
}
