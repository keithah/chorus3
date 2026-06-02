import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
import type { MetadataEditableAction } from '$lib/metadata/metadataEditor';
import type {
  MusicLibraryAlbumSnapshot,
  MusicLibraryArtistSnapshot,
  MusicLibrarySongSnapshot
} from '$lib/stores/musicLibrary.svelte';

export type LibraryCard = {
  key: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  artworkShape?: 'square' | 'poster';
  poster?: boolean;
  route?: PrimaryRoute;
  action?: MetadataEditableAction;
  source?: Record<string, unknown>;
};

export function artistCards(items: readonly MusicLibraryArtistSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `artist:${item.artistid}`,
    title: safe(item.label, 'Unknown artist'),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    artworkShape: 'square',
    route: { kind: 'musicArtistDetail', artistid: String(item.artistid) },
    action: { media: 'music', kind: 'artist', artistid: item.artistid },
    source: metadataSource(item)
  }));
}

export function albumCards(items: readonly MusicLibraryAlbumSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `album:${item.albumid}`,
    title: safe(item.title ?? item.label, 'Unknown album'),
    subtitle: join(item.artist),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    artworkShape: 'square',
    route: { kind: 'musicAlbumDetail', albumid: String(item.albumid) },
    action: { media: 'music', kind: 'album', albumid: item.albumid },
    source: metadataSource(item)
  }));
}

export function songCards(items: readonly MusicLibrarySongSnapshot[]): LibraryCard[] {
  return items.map((item) => ({
    key: `song:${item.songid}`,
    title: safe(item.title ?? item.label, 'Unknown song'),
    subtitle: join(item.artist) ?? safe(item.album, ''),
    thumbnail: optionalKodiImageUrl(item.thumbnail),
    artworkShape: 'square',
    action: { media: 'music', kind: 'song', songid: item.songid },
    source: metadataSource(item)
  }));
}

function metadataSource(item: object): Record<string, unknown> {
  return { ...item };
}

function join(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || undefined;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function safe(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
