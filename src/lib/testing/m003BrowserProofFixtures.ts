import type {
  MediaFilesActionDispatch,
  MediaFilesPanelDispatch
} from '$components/MediaFilesPanel.svelte';
import type {
  MediaPlaylistsActionDispatch,
  MediaPlaylistsPanelDispatch
} from '$components/MediaPlaylistsPanel.svelte';
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
    genres: [{ genreid: 4, label: 'Soul', title: 'Soul' }],
    limits: {
      artists: { start: 0, end: 1, total: 1 },
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 },
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
      genres: [{ kind: 'genre', genreid: 4, label: 'Soul', title: 'Soul' }]
    },
    limits: {
      artists: { start: 0, end: 1, total: 1 },
      albums: { start: 0, end: 1, total: 1 },
      songs: { start: 0, end: 1, total: 1 },
      genres: { start: 0, end: 1, total: 1 }
    },
    resultCounts: { artists: 1, albums: 1, songs: 1, genres: 1, total: 4 },
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
      capabilities: { canBrowse: false, canPlay: true, canQueue: true }
    },
    {
      id: 'entry:cover',
      kind: 'file',
      label: 'cover.jpg',
      mediaKind: 'unsupported',
      extension: 'jpg',
      capabilities: { canBrowse: false, canPlay: false, canQueue: false }
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
    queueFileItem: noop
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
