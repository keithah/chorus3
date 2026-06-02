import type {
  MediaFilesActionDispatch,
  MediaFilesPanelDispatch
} from '$components/MediaFilesPanel.svelte';
import type { MediaPlaylistsPanelDispatch } from '$components/MediaPlaylistsPanel.svelte';
import type { MediaPlaylistsActionDispatch } from '$components/mediaPlaylistsActionModel';
import type {
  MediaSearchActionDispatch,
  MediaSearchPanelDispatch
} from '$components/MediaSearchPanel.svelte';
import type {
  MusicBrowseActionDispatch,
  MusicBrowsePanelDispatch
} from '$components/MusicBrowsePanel.svelte';
import type {
  MediaDirectoryEntrySnapshot,
  MediaFilesBreadcrumbSnapshot,
  MediaFilesStoreSnapshot,
  MediaFileSourceSnapshot,
  MediaPlaylistEntrySnapshot,
  MediaPlaylistSnapshot,
  MediaPlaylistsBreadcrumbSnapshot,
  MediaPlaylistsStoreSnapshot,
  MediaSearchStoreSnapshot,
  MusicBrowseStoreSnapshot,
  MusicLibraryStoreSnapshot
} from '$lib/stores';

export interface M003BrowserProofAppProps {
  musicLibrarySnapshot: MusicLibraryStoreSnapshot;
  musicBrowseSnapshot: MusicBrowseStoreSnapshot;
  musicBrowseDispatch: MusicBrowsePanelDispatch;
  musicActionDispatch: MusicBrowseActionDispatch;
  mediaSearchSnapshot: MediaSearchStoreSnapshot;
  mediaSearchDispatch: MediaSearchPanelDispatch;
  mediaSearchActionDispatch: MediaSearchActionDispatch;
  mediaFilesSnapshot: MediaFilesStoreSnapshot;
  mediaFilesDispatch: MediaFilesPanelDispatch;
  mediaFilesActionDispatch: MediaFilesActionDispatch;
  mediaPlaylistsSnapshot: MediaPlaylistsStoreSnapshot;
  mediaPlaylistsDispatch: MediaPlaylistsPanelDispatch;
  mediaPlaylistsActionDispatch: MediaPlaylistsActionDispatch;
}

export const M003_BROWSER_PROOF_FORBIDDEN_TEXT = [
  'smb://',
  'special://',
  '://admin:',
  'Authorization',
  'Basic',
  'localStorage',
  'sessionStorage',
  'admin:p@ssword',
  'super-secret-password',
  'SENTINEL_SECRET',
  'CHORUS3_SENTINEL_SECRET'
] as const;

const readyAt = '2026-04-30T18:00:00.000Z';
const noop = async (): Promise<void> => undefined;

export function createM003BrowserProofAppProps(): M003BrowserProofAppProps {
  return {
    musicLibrarySnapshot: createMusicLibrarySnapshot(),
    musicBrowseSnapshot: createMusicBrowseSnapshot(),
    musicBrowseDispatch: createMusicBrowseDispatch(),
    musicActionDispatch: createMusicActionDispatch(),
    mediaSearchSnapshot: createMediaSearchSnapshot(),
    mediaSearchDispatch: createMediaSearchDispatch(),
    mediaSearchActionDispatch: createMediaSearchActionDispatch(),
    mediaFilesSnapshot: createMediaFilesSnapshot(),
    mediaFilesDispatch: createMediaFilesDispatch(),
    mediaFilesActionDispatch: createMediaFilesActionDispatch(),
    mediaPlaylistsSnapshot: createMediaPlaylistsSnapshot(),
    mediaPlaylistsDispatch: createMediaPlaylistsDispatch(),
    mediaPlaylistsActionDispatch: createMediaPlaylistsActionDispatch()
  };
}

export function isM003BrowserProofFixtureSecretSafe(value: unknown): boolean {
  const text = collectFixtureText(value);
  return M003_BROWSER_PROOF_FORBIDDEN_TEXT.every((forbidden) => !text.includes(forbidden));
}

function createMusicLibrarySnapshot(): MusicLibraryStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'manual',
    lastUpdatedAt: readyAt,
    artists: [{ artistid: 1, label: 'Nina Simone', genre: ['Soul', 'Jazz'] }],
    albums: [
      {
        albumid: 2,
        label: 'Pastel Blues',
        title: 'Pastel Blues',
        artist: ['Nina Simone'],
        year: 1965
      }
    ],
    songs: [
      {
        songid: 3,
        label: 'Sinnerman',
        title: 'Sinnerman',
        artist: ['Nina Simone'],
        album: 'Pastel Blues',
        duration: 622,
        track: 8,
        playcount: 2
      }
    ],
    recentlyAddedSongs: [
      {
        songid: 30,
        label: 'Feeling Good',
        title: 'Feeling Good',
        artist: ['Nina Simone'],
        album: 'I Put a Spell on You',
        duration: 174,
        track: 1,
        playcount: 4,
        dateadded: '2026-04-29 11:22:33'
      }
    ],
    recentlyPlayedSongs: [
      {
        songid: 31,
        label: 'I Put a Spell on You',
        title: 'I Put a Spell on You',
        artist: ['Nina Simone'],
        album: 'I Put a Spell on You',
        duration: 155,
        track: 2,
        playcount: 7,
        lastplayed: '2026-04-30 20:15:00'
      }
    ],
    mostPlayedSongs: [
      {
        songid: 32,
        label: 'My Baby Just Cares for Me',
        title: 'My Baby Just Cares for Me',
        artist: ['Nina Simone'],
        album: 'Little Girl Blue',
        duration: 217,
        track: 6,
        playcount: 12,
        lastplayed: '2026-04-28 09:45:00',
        dateadded: '2026-04-20 08:00:00'
      }
    ],
    genres: [{ genreid: 4, label: 'Soul', title: 'Soul' }],
    limits: {
      artists: { start: 0, end: 1, total: 1 },
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 },
      recentlyAddedSongs: { start: 0, end: 1, total: 1 },
      recentlyPlayedSongs: { start: 0, end: 1, total: 1 },
      mostPlayedSongs: { start: 0, end: 1, total: 1 },
      genres: { start: 0, end: 1, total: 1 }
    },
    isEmpty: false,
    lastError: null
  };
}

function createMusicBrowseSnapshot(): MusicBrowseStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'artist:1',
    lastUpdatedAt: readyAt,
    selection: { kind: 'artist', id: 1, label: 'Nina Simone' },
    albums: [
      {
        albumid: 2,
        label: 'Pastel Blues',
        title: 'Pastel Blues',
        artist: ['Nina Simone'],
        year: 1965
      }
    ],
    songs: [
      {
        songid: 3,
        label: 'Sinnerman',
        title: 'Sinnerman',
        artist: ['Nina Simone'],
        album: 'Pastel Blues',
        duration: 622,
        track: 8,
        playcount: 2
      }
    ],
    limits: {
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 }
    },
    isEmpty: false,
    lastError: null
  };
}

function createMediaSearchSnapshot(): MediaSearchStoreSnapshot {
  return {
    searchStatus: 'ready',
    scope: 'music',
    query: 'nina',
    lastUpdatedAt: readyAt,
    results: {
      artists: [{ kind: 'artist', artistid: 1, label: 'Nina Simone', genre: ['Soul', 'Jazz'] }],
      albums: [
        {
          kind: 'album',
          albumid: 2,
          label: 'Pastel Blues',
          title: 'Pastel Blues',
          artist: ['Nina Simone'],
          year: 1965
        }
      ],
      songs: [
        {
          kind: 'song',
          songid: 3,
          label: 'Sinnerman',
          title: 'Sinnerman',
          artist: ['Nina Simone'],
          album: 'Pastel Blues',
          duration: 622
        }
      ],
      genres: [{ kind: 'genre', genreid: 4, label: 'Soul', title: 'Soul' }],
      movies: [{ kind: 'movie', movieid: 5, label: 'Nina', title: 'Nina', year: 2016 }],
      tvShows: [{ kind: 'tvshow', tvshowid: 6, label: 'Nina TV', title: 'Nina TV', year: 2026 }],
      musicVideos: [
        {
          kind: 'musicvideo',
          musicvideoid: 7,
          label: 'Nina Live',
          title: 'Nina Live',
          artist: ['Nina Simone'],
          album: 'Live',
          year: 1969
        }
      ]
    },
    limits: {
      artists: { start: 0, end: 1, total: 1 },
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 },
      genres: { start: 0, end: 1, total: 1 },
      movies: { start: 0, end: 1, total: 1 },
      tvShows: { start: 0, end: 1, total: 1 },
      musicVideos: { start: 0, end: 1, total: 1 }
    },
    resultCounts: {
      artists: 1,
      albums: 1,
      songs: 1,
      genres: 1,
      movies: 1,
      tvShows: 1,
      musicVideos: 1,
      total: 7
    },
    isEmpty: false,
    lastError: null
  };
}

function createMediaFilesSnapshot(): MediaFilesStoreSnapshot {
  const sources: MediaFileSourceSnapshot[] = [{ id: 'source:albums', label: 'Albums' }];
  const entries: MediaDirectoryEntrySnapshot[] = [
    {
      id: 'entry:nina-simone',
      kind: 'directory',
      label: 'Nina Simone',
      capabilities: { canBrowse: true, canPlay: false, canQueue: false }
    },
    {
      id: 'entry:sinnerman',
      kind: 'file',
      label: 'Sinnerman.flac',
      mediaKind: 'audio',
      extension: 'flac',
      capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
    },
    {
      id: 'entry:cover',
      kind: 'file',
      label: 'cover.jpg',
      mediaKind: 'unsupported',
      extension: 'jpg',
      capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: true }
    }
  ];
  const breadcrumbs: MediaFilesBreadcrumbSnapshot[] = [
    { id: 'source:albums', label: 'Albums' },
    { id: 'entry:nina-simone', label: 'Nina Simone' }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'directory:entry:nina-simone',
    lastUpdatedAt: readyAt,
    media: 'music',
    sources,
    entries,
    breadcrumbs,
    isEmpty: false,
    lastError: null
  };
}

function createMediaPlaylistsSnapshot(): MediaPlaylistsStoreSnapshot {
  const playlists: MediaPlaylistSnapshot[] = [
    {
      id: 'playlist:late-night-jazz',
      label: 'Late Night Jazz.xsp',
      media: 'music',
      kind: 'smart',
      extension: 'xsp',
      capabilities: { canBrowse: true, canPlay: true, canQueue: true }
    },
    {
      id: 'playlist:road-trip',
      label: 'Road Trip.m3u',
      media: 'music',
      kind: 'basic',
      extension: 'm3u',
      capabilities: { canBrowse: false, canPlay: false, canQueue: false }
    }
  ];
  const entries: MediaPlaylistEntrySnapshot[] = [
    {
      id: 'playlist-entry:sinnerman',
      label: 'Sinnerman.flac',
      mediaKind: 'audio',
      extension: 'flac',
      capabilities: { canPlay: true, canQueue: true }
    },
    {
      id: 'playlist-entry:cover',
      label: 'cover.jpg',
      mediaKind: 'unsupported',
      extension: 'jpg',
      capabilities: { canPlay: false, canQueue: false }
    }
  ];
  const breadcrumbs: MediaPlaylistsBreadcrumbSnapshot[] = [
    { id: 'playlist:late-night-jazz', label: 'Late Night Jazz.xsp' }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'playlist:playlist:late-night-jazz',
    lastUpdatedAt: readyAt,
    media: 'music',
    playlists,
    entries,
    breadcrumbs,
    isEmpty: false,
    lastError: null
  };
}

function createMusicBrowseDispatch(): MusicBrowsePanelDispatch {
  return {
    browseArtist: noop,
    browseAlbum: noop,
    browseGenre: noop,
    clearSelection: noop
  };
}

function createMusicActionDispatch(): MusicBrowseActionDispatch {
  return {
    playMusicItem: noop,
    queueMusicItem: noop
  };
}

function createMediaSearchDispatch(): MediaSearchPanelDispatch {
  return {
    search: noop,
    clear: noop
  };
}

function createMediaSearchActionDispatch(): MediaSearchActionDispatch {
  return {
    playMusicItem: noop,
    queueMusicItem: noop
  };
}

function createMediaFilesDispatch(): MediaFilesPanelDispatch {
  return {
    refresh: noop,
    openSource: noop,
    openEntry: noop,
    openBreadcrumb: noop
  };
}

function createMediaFilesActionDispatch(): MediaFilesActionDispatch {
  return {
    playFileItem: noop,
    queueFileItem: noop,
    downloadFileItem: noop
  };
}

function createMediaPlaylistsDispatch(): MediaPlaylistsPanelDispatch {
  return {
    refresh: noop,
    openPlaylist: noop,
    openBreadcrumb: noop
  };
}

function createMediaPlaylistsActionDispatch(): MediaPlaylistsActionDispatch {
  return {
    playPlaylistItem: noop,
    queuePlaylistItem: noop
  };
}

function collectFixtureText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'function') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(collectFixtureText).join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectFixtureText(nested)}`)
      .join('\n');
  }

  return '';
}
