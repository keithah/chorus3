import type { LocalMediaKind } from './localPlayer.svelte';
import type { PlayerStoreSnapshot } from './player.svelte';
import type { EpisodeStreamItem, LocalFilePlaylistItem } from './playerDispatchTypes';

export class LocalFilePlaylistState {
  #items: LocalFilePlaylistItem[] = [];
  #index = -1;
  #shuffle = false;

  get shuffle(): boolean {
    return this.#shuffle;
  }

  set shuffle(value: boolean) {
    this.#shuffle = value;
  }

  setItems(items: readonly LocalFilePlaylistItem[], startFile?: string): void {
    this.#items = items.flatMap(toLocalFilePlaylistItem);
    this.#index = resolveLocalFilePlaylistIndex(this.#items, startFile);
  }

  canNavigate(): boolean {
    return this.#items.length > 1;
  }

  ensureFile(file: string): void {
    const index = this.#items.findIndex((item) => item.file === file);
    if (index >= 0) {
      this.#index = index;
      return;
    }

    this.#items = [{ file, mediaKind: 'audio', label: 'File item', type: 'file' }];
    this.#index = 0;
  }

  currentItem(): LocalFilePlaylistItem | null {
    return this.#items[this.#index] ?? null;
  }

  move(command: 'previous' | 'next'): LocalFilePlaylistItem | null {
    const currentIndex = this.#index >= 0 ? this.#index : 0;
    const nextIndex =
      this.#shuffle && command === 'next'
        ? nextLocalShuffleIndex(this.#items.length, currentIndex)
        : nextLocalSequentialIndex(this.#items.length, currentIndex, command);
    const item = this.#items[nextIndex] ?? null;
    if (item) {
      this.#index = nextIndex;
    }
    return item;
  }
}

export function toLocalFilePlaylistItem(item: LocalFilePlaylistItem): LocalFilePlaylistItem[] {
  if (!item || typeof item !== 'object') {
    return [];
  }

  const candidate = item as Record<string, unknown>;
  if (
    typeof candidate.file !== 'string' ||
    candidate.file.trim().length === 0 ||
    candidate.mediaKind !== 'audio'
  ) {
    return [];
  }

  return [
    {
      file: candidate.file,
      mediaKind: 'audio',
      ...(typeof candidate.label === 'string' && candidate.label.length > 0
        ? { label: candidate.label }
        : {}),
      ...(typeof candidate.title === 'string' && candidate.title.length > 0
        ? { title: candidate.title }
        : {}),
      ...(typeof candidate.thumbnail === 'string' && candidate.thumbnail.length > 0
        ? { thumbnail: candidate.thumbnail }
        : {}),
      ...(typeof candidate.id === 'number' && Number.isFinite(candidate.id)
        ? { id: candidate.id }
        : {}),
      ...(typeof candidate.songid === 'number' && Number.isFinite(candidate.songid)
        ? { songid: candidate.songid }
        : {}),
      ...(typeof candidate.type === 'string' && candidate.type.length > 0
        ? { type: candidate.type }
        : {})
    }
  ];
}

export function resolveLocalFilePlaylistIndex(
  items: readonly LocalFilePlaylistItem[],
  startFile: string | undefined
): number {
  if (items.length === 0) {
    return -1;
  }

  if (typeof startFile === 'string' && startFile.trim()) {
    const index = items.findIndex((item) => item.file === startFile);
    if (index >= 0) {
      return index;
    }
  }

  return 0;
}

export function nextLocalSequentialIndex(
  length: number,
  currentIndex: number,
  command: 'previous' | 'next'
): number {
  const offset = command === 'next' ? 1 : -1;
  return (currentIndex + offset + length) % length;
}

export function nextLocalShuffleIndex(length: number, currentIndex: number): number {
  if (length <= 1) {
    return 0;
  }

  const randomIndex = Math.floor(Math.random() * (length - 1));
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex;
}

export function localFilePlaylistItemIdentity(
  item: LocalFilePlaylistItem | null,
  fallbackLabel: string
): {
  id?: number;
  label?: string;
  title?: string;
  type?: string;
  songid?: number;
  thumbnail?: string;
} {
  if (!item) {
    return { label: fallbackLabel, type: 'file' };
  }

  return {
    ...(typeof item.id === 'number' && Number.isFinite(item.id) ? { id: item.id } : {}),
    label: item.label || item.title || fallbackLabel,
    ...(item.title ? { title: item.title } : {}),
    type: item.type || 'file',
    ...(typeof item.songid === 'number' && Number.isFinite(item.songid)
      ? { songid: item.songid }
      : {}),
    ...(item.thumbnail ? { thumbnail: item.thumbnail } : {})
  };
}

export function inferMediaKind(playerType: unknown): LocalMediaKind {
  return playerType === 'audio' ? 'audio' : playerType === 'video' ? 'video' : 'unknown';
}

export function extractLocalItemIdentity(item: PlayerStoreSnapshot['item']): {
  id?: number;
  label?: string;
  title?: string;
  type?: string;
  songid?: number;
  movieid?: number;
  episodeid?: number;
} {
  if (!item || typeof item !== 'object') {
    return { label: 'Unknown item', type: 'unknown' };
  }

  const candidate = item as Record<string, unknown>;

  return {
    ...(typeof candidate.id === 'number' && Number.isFinite(candidate.id)
      ? { id: candidate.id }
      : {}),
    ...(typeof candidate.label === 'string' && candidate.label.length > 0
      ? { label: candidate.label }
      : { label: 'Unknown item' }),
    ...(typeof candidate.title === 'string' && candidate.title.length > 0
      ? { title: candidate.title }
      : {}),
    ...(typeof candidate.type === 'string' && candidate.type.length > 0
      ? { type: candidate.type }
      : { type: 'unknown' }),
    ...(typeof candidate.songid === 'number' && Number.isFinite(candidate.songid)
      ? { songid: candidate.songid }
      : {}),
    ...(typeof candidate.movieid === 'number' && Number.isFinite(candidate.movieid)
      ? { movieid: candidate.movieid }
      : {}),
    ...(typeof candidate.episodeid === 'number' && Number.isFinite(candidate.episodeid)
      ? { episodeid: candidate.episodeid }
      : {}),
    ...(typeof candidate.thumbnail === 'string' && candidate.thumbnail.length > 0
      ? { thumbnail: candidate.thumbnail }
      : {})
  };
}

export function currentPlayerFile(snapshot: PlayerStoreSnapshot): string {
  return typeof snapshot.item?.file === 'string' ? snapshot.item.file.trim() : '';
}

export function extractEpisodeLocalItemIdentity(
  item: PlayerStoreSnapshot['item'],
  episodeid: number,
  requested: EpisodeStreamItem
): {
  label: string;
  title: string;
  type: 'episode';
  episodeid: number;
} {
  const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const requestedLabel = typeof requested.label === 'string' ? requested.label : undefined;
  const requestedTitle = typeof requested.title === 'string' ? requested.title : undefined;
  const snapshotLabel =
    typeof candidate.label === 'string' && candidate.label.length > 0 ? candidate.label : undefined;
  const snapshotTitle =
    typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : undefined;
  const label = requestedLabel ?? requestedTitle ?? snapshotLabel ?? snapshotTitle ?? 'Episode';
  const title = requestedTitle ?? snapshotTitle ?? label;

  return {
    label,
    title,
    type: 'episode',
    episodeid
  };
}

export function extractMovieLocalItemIdentity(
  item: PlayerStoreSnapshot['item'],
  movieid: number
): {
  label: string;
  title: string;
  type: 'movie';
  movieid: number;
} {
  const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const label =
    typeof candidate.label === 'string' && candidate.label.length > 0 ? candidate.label : 'Movie';
  const title =
    typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : label;

  return {
    label,
    title,
    type: 'movie',
    movieid
  };
}

export function extractMusicVideoLocalItemIdentity(
  item: PlayerStoreSnapshot['item'],
  musicvideoid: number
): {
  label: string;
  title: string;
  type: 'musicvideo';
  musicvideoid: number;
  thumbnail?: string;
} {
  const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const label =
    typeof candidate.label === 'string' && candidate.label.length > 0
      ? candidate.label
      : 'Music video';
  const title =
    typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : label;

  return {
    label,
    title,
    type: 'musicvideo',
    musicvideoid,
    ...(typeof candidate.thumbnail === 'string' && candidate.thumbnail.length > 0
      ? { thumbnail: candidate.thumbnail }
      : {})
  };
}
