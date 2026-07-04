import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import type {
  MusicLibraryAlbumSnapshot,
  MusicLibraryArtistSnapshot,
  MusicLibrarySongSnapshot
} from './musicLibrary.svelte';
import {
  loadKodiAlbumDetail,
  loadKodiAlbumSongs,
  loadKodiArtistDetail
} from './musicDetailLoaders';

export type MusicDetailRouteSnapshot = {
  albumSongs: KeyedResourceSnapshot<MusicLibrarySongSnapshot[]>;
  albumDetails: KeyedResourceSnapshot<MusicLibraryAlbumSnapshot>;
  artistDetails: KeyedResourceSnapshot<MusicLibraryArtistSnapshot>;
};

export type ResourceEntry<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'missing' }
  | { status: 'error' };

export type KeyedResourceSnapshot<T> = Record<number, ResourceEntry<T>>;

type MusicDetailRouteLoaders = {
  loadAlbumDetail: (
    client: KodiJsonRpcHttpClient,
    albumid: number
  ) => Promise<MusicLibraryAlbumSnapshot | null>;
  loadAlbumSongs: (
    client: KodiJsonRpcHttpClient,
    albumid: number
  ) => Promise<MusicLibrarySongSnapshot[]>;
  loadArtistDetail: (
    client: KodiJsonRpcHttpClient,
    artistid: number
  ) => Promise<MusicLibraryArtistSnapshot | null>;
};

export type MusicDetailRouteStoreOptions = Partial<MusicDetailRouteLoaders> & {
  createClient: () => KodiJsonRpcHttpClient | null;
};

const EMPTY_SNAPSHOT: MusicDetailRouteSnapshot = {
  albumSongs: {},
  albumDetails: {},
  artistDetails: {}
};

export class MusicDetailRouteStore {
  readonly #createClient: () => KodiJsonRpcHttpClient | null;
  readonly #loaders: MusicDetailRouteLoaders;
  #snapshot = $state<MusicDetailRouteSnapshot>(cloneSnapshot(EMPTY_SNAPSHOT));

  constructor(options: MusicDetailRouteStoreOptions) {
    this.#createClient = options.createClient;
    this.#loaders = {
      loadAlbumDetail: options.loadAlbumDetail ?? loadKodiAlbumDetail,
      loadAlbumSongs: options.loadAlbumSongs ?? loadKodiAlbumSongs,
      loadArtistDetail: options.loadArtistDetail ?? loadKodiArtistDetail
    };
  }

  get snapshot(): MusicDetailRouteSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  async loadAlbum(albumid: number): Promise<void> {
    await Promise.all([this.loadAlbumDetail(albumid), this.loadAlbumSongs(albumid)]);
  }

  async loadArtist(artistid: number): Promise<void> {
    await this.#loadResource('artistDetails', artistid, (client) =>
      this.#loaders.loadArtistDetail(client, artistid)
    );
  }

  async loadAlbumDetail(albumid: number): Promise<void> {
    await this.#loadResource('albumDetails', albumid, (client) =>
      this.#loaders.loadAlbumDetail(client, albumid)
    );
  }

  async loadAlbumSongs(albumid: number): Promise<void> {
    await this.#loadResource('albumSongs', albumid, async (client) =>
      this.#loaders.loadAlbumSongs(client, albumid)
    );
  }

  async #loadResource<TKey extends keyof MusicDetailRouteSnapshot>(
    bucketKey: TKey,
    id: number,
    load: (
      client: KodiJsonRpcHttpClient
    ) => Promise<ResourceData<MusicDetailRouteSnapshot[TKey]> | null>
  ): Promise<void> {
    const bucket = this.#snapshot[bucketKey];
    if (bucket[id] && bucket[id].status !== 'error') return;

    const client = this.#createClient();
    if (!client) return;

    this.#snapshot = setResourceEntry(this.#snapshot, bucketKey, id, { status: 'loading' });

    try {
      const data = await load(client);
      this.#snapshot = setResourceEntry(
        this.#snapshot,
        bucketKey,
        id,
        data === null ? { status: 'missing' } : { status: 'ready', data }
      );
    } catch {
      this.#snapshot = setResourceEntry(this.#snapshot, bucketKey, id, { status: 'error' });
    }
  }
}

function cloneSnapshot(snapshot: MusicDetailRouteSnapshot): MusicDetailRouteSnapshot {
  return {
    albumSongs: cloneResourceBucket(snapshot.albumSongs, (songs) => [...songs]),
    albumDetails: cloneResourceBucket(snapshot.albumDetails),
    artistDetails: cloneResourceBucket(snapshot.artistDetails)
  };
}

type ResourceData<T> = T extends KeyedResourceSnapshot<infer TValue> ? TValue : never;

function setResourceEntry<TKey extends keyof MusicDetailRouteSnapshot>(
  snapshot: MusicDetailRouteSnapshot,
  bucketKey: TKey,
  id: number,
  entry: ResourceEntry<ResourceData<MusicDetailRouteSnapshot[TKey]>>
): MusicDetailRouteSnapshot {
  return {
    ...snapshot,
    [bucketKey]: {
      ...snapshot[bucketKey],
      [id]: entry
    }
  };
}

function cloneResourceBucket<T>(
  bucket: KeyedResourceSnapshot<T>,
  cloneData: (data: T) => T = (data) => data
): KeyedResourceSnapshot<T> {
  return Object.fromEntries(
    Object.entries(bucket).map(([key, entry]) => [
      key,
      entry.status === 'ready' ? { status: 'ready', data: cloneData(entry.data) } : { ...entry }
    ])
  );
}
