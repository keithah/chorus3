import type { AppRoute } from '$lib/app/appRouter';
import type { ThumbsUpItemInput } from '$lib/stores/thumbsUp.svelte';
import type { MusicPlaybackItem } from '$lib/stores/playerDispatchTypes';
import type { MusicQueueItem } from '$lib/stores/queue.svelte';
import type { LibraryCard } from './libraryCards';

export type DownloadableCardAction =
  | { media: 'music'; kind: 'song'; songid: number }
  | { media: 'movie'; movieid: number }
  | { media: 'episode'; episodeid: number }
  | { media: 'musicvideo'; musicvideoid: number };

export type LocalPlaylistCardAction =
  | { media: 'music'; kind: 'artist'; artistid: number }
  | { media: 'music'; kind: 'album'; albumid: number }
  | { media: 'music'; kind: 'song'; songid: number };

export type BrowserPlayableCardAction =
  | { media: 'music'; kind: 'artist'; artistid: number }
  | { media: 'music'; kind: 'album'; albumid: number }
  | { media: 'music'; kind: 'song'; songid: number }
  | { media: 'movie'; movieid: number }
  | { media: 'episode'; episodeid: number }
  | { media: 'musicvideo'; musicvideoid: number };

export function downloadableAction(action: LibraryCard['action']): DownloadableCardAction | null {
  if (!action) return null;
  if (action.media === 'music' && action.kind === 'song') return action;
  if (action.media === 'movie') return action;
  if (action.media === 'episode') return action;
  if (action.media === 'musicvideo') return action;
  return null;
}

export function localPlaylistAction(action: LibraryCard['action']): LocalPlaylistCardAction | null {
  if (!action) return null;
  if (action.media === 'music') return action;
  return null;
}

export function browserPlayableAction(
  action: LibraryCard['action']
): BrowserPlayableCardAction | null {
  if (!action) return null;
  if (action.media === 'music') return action;
  if (action.media === 'movie') return action;
  if (action.media === 'episode') return action;
  if (action.media === 'musicvideo') return action;
  return null;
}

export function localPlaylistActionKey(action: LocalPlaylistCardAction): string {
  if (action.kind === 'artist') return `artist:${action.artistid}`;
  if (action.kind === 'album') return `album:${action.albumid}`;
  return `song:${action.songid}`;
}

export function downloadActionKey(action: DownloadableCardAction): string {
  if (action.media === 'music') return `song:${action.songid}`;
  if (action.media === 'movie') return `movie:${action.movieid}`;
  if (action.media === 'episode') return `episode:${action.episodeid}`;
  return `musicvideo:${action.musicvideoid}`;
}

export function browserPlayerRouteForAction(action: BrowserPlayableCardAction): AppRoute {
  if (action.media === 'music') {
    return {
      kind: 'localPlayer',
      media: 'music',
      musicKind: action.kind,
      id: musicActionId(action)
    };
  }

  if (action.media === 'movie') {
    return { kind: 'localPlayer', media: 'movie', id: action.movieid };
  }

  if (action.media === 'episode') {
    return { kind: 'localPlayer', media: 'episode', id: action.episodeid };
  }

  return { kind: 'localPlayer', media: 'musicvideo', id: action.musicvideoid };
}

export function toMusicActionPayload(
  action: LocalPlaylistCardAction
): MusicPlaybackItem & MusicQueueItem {
  if (action.kind === 'artist') {
    return { kind: 'artist', artistid: action.artistid };
  }

  if (action.kind === 'album') {
    return { kind: 'album', albumid: action.albumid };
  }

  return { kind: 'song', songid: action.songid };
}

export function thumbsUpItem(card: LibraryCard): ThumbsUpItemInput | null {
  const action = card.action;
  if (!action) {
    return null;
  }

  const common = {
    label: card.title,
    ...optionalCardText('subtitle', card.subtitle),
    ...optionalRawThumbnail(card.thumbnail)
  };

  if (action.media === 'music' && action.kind === 'song') {
    return { media: 'song', id: action.songid, ...common };
  }

  if (action.media === 'music' && action.kind === 'album') {
    return { media: 'album', id: action.albumid, ...common };
  }

  if (action.media === 'music' && action.kind === 'artist') {
    return { media: 'artist', id: action.artistid, ...common };
  }

  if (action.media === 'movie') {
    return { media: 'movie', id: action.movieid, ...common };
  }

  if (action.media === 'episode') {
    return { media: 'episode', id: action.episodeid, ...common };
  }

  if (action.media === 'musicvideo') {
    return { media: 'musicvideo', id: action.musicvideoid, ...common };
  }

  if (action.media === 'tvshow') {
    return { media: 'tvshow', id: action.tvshowid, ...common };
  }

  return null;
}

function musicActionId(action: Extract<BrowserPlayableCardAction, { media: 'music' }>): number {
  if (action.kind === 'artist') return action.artistid;
  if (action.kind === 'album') return action.albumid;
  return action.songid;
}

function optionalCardText<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, string>> {
  return typeof value === 'string' && value.trim()
    ? ({ [key]: value.trim() } as Partial<Record<Key, string>>)
    : {};
}

function optionalRawThumbnail(value: unknown): { thumbnail?: string } {
  return typeof value === 'string' && value.trim() ? { thumbnail: value.trim() } : {};
}
