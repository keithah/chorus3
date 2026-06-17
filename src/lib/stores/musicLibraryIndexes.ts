import type {
  MusicLibraryAlbumSnapshot,
  MusicLibraryArtistSnapshot,
  MusicLibraryGenreSnapshot,
  MusicLibrarySongSnapshot,
  MusicLibraryStoreSnapshot
} from './musicLibrary.svelte';

export type MusicLibraryDetailIndexes = {
  albumsById: Map<number, MusicLibraryAlbumSnapshot>;
  artistsById: Map<number, MusicLibraryArtistSnapshot>;
  songsByAlbumTitle: Map<string, readonly MusicLibrarySongSnapshot[]>;
  songsByArtistName: Map<string, readonly MusicLibrarySongSnapshot[]>;
  albumsByArtistName: Map<string, readonly MusicLibraryAlbumSnapshot[]>;
};

export type MusicLibraryGenreIndex = {
  byId: Map<number, MusicLibraryGenreSnapshot>;
  byName: Map<string, MusicLibraryGenreSnapshot>;
};

const detailIndexCache = new WeakMap<MusicLibraryStoreSnapshot, MusicLibraryDetailIndexes>();
const artistsByGenreCache = new WeakMap<
  MusicLibraryStoreSnapshot,
  Map<string, readonly MusicLibraryArtistSnapshot[]>
>();
const genreIndexCache = new WeakMap<readonly MusicLibraryGenreSnapshot[], MusicLibraryGenreIndex>();

export function musicLibraryDetailIndexes(
  music: MusicLibraryStoreSnapshot
): MusicLibraryDetailIndexes {
  const cached = detailIndexCache.get(music);
  if (cached) return cached;

  const indexes = {
    albumsById: new Map<number, MusicLibraryAlbumSnapshot>(),
    artistsById: new Map<number, MusicLibraryArtistSnapshot>(),
    songsByAlbumTitle: new Map<string, MusicLibrarySongSnapshot[]>(),
    songsByArtistName: new Map<string, MusicLibrarySongSnapshot[]>(),
    albumsByArtistName: new Map<string, MusicLibraryAlbumSnapshot[]>()
  };

  for (const album of music.albums) {
    indexes.albumsById.set(album.albumid, album);
    addArtistValues(indexes.albumsByArtistName, album.artist, album);
  }

  for (const artist of music.artists) {
    indexes.artistsById.set(artist.artistid, artist);
  }

  for (const song of music.songs) {
    const albumTitle = safeText(song.album);
    if (albumTitle) {
      addGroupedValue(indexes.songsByAlbumTitle, albumTitle, song);
    }
    addArtistValues(indexes.songsByArtistName, song.artist, song);
  }

  detailIndexCache.set(music, indexes);
  return indexes;
}

export function musicLibraryArtistsByGenreIndex(
  music: MusicLibraryStoreSnapshot
): Map<string, readonly MusicLibraryArtistSnapshot[]> {
  const cached = artistsByGenreCache.get(music);
  if (cached) return cached;

  const mutable = new Map<string, MusicLibraryArtistSnapshot[]>();
  for (const artist of music.artists) {
    if (!Array.isArray(artist.genre)) continue;

    for (const genre of artist.genre) {
      const key = normalizeComparableText(genre);
      if (key) addGroupedValue(mutable, key, artist);
    }
  }

  const index = new Map<string, readonly MusicLibraryArtistSnapshot[]>();
  for (const [key, artists] of mutable.entries()) {
    index.set(key, artists);
  }

  artistsByGenreCache.set(music, index);
  return index;
}

export function musicLibraryGenreIndex(
  genres: readonly MusicLibraryGenreSnapshot[]
): MusicLibraryGenreIndex {
  const cached = genreIndexCache.get(genres);
  if (cached) return cached;

  const byId = new Map<number, MusicLibraryGenreSnapshot>();
  const byName = new Map<string, MusicLibraryGenreSnapshot>();
  for (const genre of genres) {
    byId.set(genre.genreid, genre);
    for (const entry of [genre.title, genre.label]) {
      const normalized = normalizeComparableText(entry);
      if (normalized && !byName.has(normalized)) {
        byName.set(normalized, genre);
      }
    }
  }

  const index = { byId, byName };
  genreIndexCache.set(genres, index);
  return index;
}

export function normalizeMusicLibraryIndexKey(value: unknown): string {
  return safeText(value).toLowerCase();
}

function addArtistValues<TItem>(target: Map<string, TItem[]>, value: unknown, item: TItem): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const key = normalizeMusicLibraryIndexKey(entry);
      if (key) addGroupedValue(target, key, item);
    }
    return;
  }

  const key = normalizeMusicLibraryIndexKey(value);
  if (key) addGroupedValue(target, key, item);
}

function addGroupedValue<TItem>(target: Map<string, TItem[]>, key: string, item: TItem): void {
  const group = target.get(key);
  if (group) {
    group.push(item);
    return;
  }
  target.set(key, [item]);
}

function normalizeComparableText(value: unknown): string {
  return safeText(value).toLowerCase();
}

function safeText(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}
