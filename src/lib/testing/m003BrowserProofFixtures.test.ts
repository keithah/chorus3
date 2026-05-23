import { describe, expect, it, vi } from 'vitest';

import {
  createM003BrowserProofAppProps,
  isM003BrowserProofFixtureSecretSafe,
  M003_BROWSER_PROOF_FORBIDDEN_TEXT
} from './m003BrowserProofFixtures';

function collectText(value: unknown): string {
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
    return value.map(collectText).join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectText(nested)}`)
      .join('\n');
  }

  return '';
}

describe('M003 browser proof fixtures', () => {
  it('builds tiny populated props for every M003 music surface', () => {
    const props = createM003BrowserProofAppProps();

    expect(props.musicLibrarySnapshot?.artists).toHaveLength(1);
    expect(props.musicLibrarySnapshot?.albums).toHaveLength(1);
    expect(props.musicLibrarySnapshot?.songs).toHaveLength(1);
    expect(props.musicLibrarySnapshot?.recentlyAddedSongs).toHaveLength(1);
    expect(props.musicLibrarySnapshot?.recentlyPlayedSongs).toHaveLength(1);
    expect(props.musicLibrarySnapshot?.mostPlayedSongs).toHaveLength(1);
    expect(props.musicLibrarySnapshot?.limits.recentlyAddedSongs.total).toBe(1);
    expect(props.musicLibrarySnapshot?.limits.recentlyPlayedSongs.total).toBe(1);
    expect(props.musicLibrarySnapshot?.limits.mostPlayedSongs.total).toBe(1);
    expect(props.musicLibrarySnapshot?.genres).toHaveLength(1);
    expect(props.musicBrowseSnapshot?.albums).toHaveLength(1);
    expect(props.musicBrowseSnapshot?.songs).toHaveLength(1);
    expect(props.mediaSearchSnapshot?.resultCounts.total).toBe(7);
    expect(props.mediaFilesSnapshot?.sources).toHaveLength(1);
    expect(props.mediaFilesSnapshot?.entries).toHaveLength(3);
    expect(props.mediaPlaylistsSnapshot?.playlists).toHaveLength(2);
    expect(props.mediaPlaylistsSnapshot?.entries).toHaveLength(2);
  });

  it('contains visible safe labels for browser proof without forbidden secret text', () => {
    const props = createM003BrowserProofAppProps();
    const text = collectText(props);

    expect(text).toContain('Nina Simone');
    expect(text).toContain('Pastel Blues');
    expect(text).toContain('Sinnerman');
    expect(text).toContain('Feeling Good');
    expect(text).toContain('I Put a Spell on You');
    expect(text).toContain('My Baby Just Cares for Me');
    expect(text).toContain('2026-04-29 11:22:33');
    expect(text).toContain('2026-04-30 20:15:00');
    expect(text).toContain('playcount: 12');
    expect(text).toContain('Albums');
    expect(text).toContain('Sinnerman.flac');
    expect(text).toContain('cover.jpg');
    expect(text).toContain('Late Night Jazz.xsp');
    expect(text).toContain('Road Trip.m3u');
    expect(isM003BrowserProofFixtureSecretSafe(props)).toBe(true);

    for (const forbidden of M003_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(text).not.toContain(forbidden);
    }
  });

  it('uses inert dispatches that resolve and do not perform network or storage calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSetSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');
    const props = createM003BrowserProofAppProps();

    await expect(
      props.musicBrowseDispatch?.browseArtist({ artistid: 1, label: 'Nina Simone' })
    ).resolves.toBeUndefined();
    await expect(
      props.musicBrowseDispatch?.browseAlbum({ albumid: 2, label: 'Pastel Blues' })
    ).resolves.toBeUndefined();
    await expect(
      props.musicBrowseDispatch?.browseGenre({ genreid: 4, label: 'Soul' })
    ).resolves.toBeUndefined();
    await expect(props.musicBrowseDispatch?.clearSelection()).resolves.toBeUndefined();
    await expect(
      props.musicActionDispatch?.playMusicItem({ kind: 'song', songid: 3 })
    ).resolves.toBeUndefined();
    await expect(
      props.musicActionDispatch?.queueMusicItem({ kind: 'album', albumid: 2 })
    ).resolves.toBeUndefined();
    await expect(
      props.mediaSearchDispatch?.search({ query: 'Sinnerman' })
    ).resolves.toBeUndefined();
    await expect(props.mediaSearchDispatch?.clear()).resolves.toBeUndefined();
    await expect(
      props.mediaSearchActionDispatch?.playMusicItem({ kind: 'artist', id: 1 })
    ).resolves.toBeUndefined();
    await expect(
      props.mediaSearchActionDispatch?.queueMusicItem({ kind: 'song', id: 3 })
    ).resolves.toBeUndefined();
    await expect(props.mediaFilesDispatch?.refresh()).resolves.toBeUndefined();
    await expect(props.mediaFilesDispatch?.openSource('source:albums')).resolves.toBeUndefined();
    await expect(props.mediaFilesDispatch?.openEntry('entry:nina-simone')).resolves.toBeUndefined();
    await expect(
      props.mediaFilesDispatch?.openBreadcrumb('source:albums')
    ).resolves.toBeUndefined();
    await expect(
      props.mediaFilesActionDispatch?.playFileItem({
        id: 'entry:sinnerman',
        label: 'Sinnerman.flac',
        media: 'music'
      })
    ).resolves.toBeUndefined();
    await expect(
      props.mediaFilesActionDispatch?.queueFileItem({
        id: 'entry:sinnerman',
        label: 'Sinnerman.flac',
        media: 'music'
      })
    ).resolves.toBeUndefined();
    await expect(
      props.mediaFilesActionDispatch?.downloadFileItem({
        id: 'entry:sinnerman',
        label: 'Sinnerman.flac',
        media: 'music'
      })
    ).resolves.toBeUndefined();
    await expect(props.mediaPlaylistsDispatch?.refresh()).resolves.toBeUndefined();
    await expect(
      props.mediaPlaylistsDispatch?.openPlaylist('playlist:late-night-jazz')
    ).resolves.toBeUndefined();
    await expect(
      props.mediaPlaylistsDispatch?.openBreadcrumb('playlist:late-night-jazz')
    ).resolves.toBeUndefined();
    await expect(
      props.mediaPlaylistsActionDispatch?.playPlaylistItem({
        id: 'playlist:late-night-jazz',
        label: 'Late Night Jazz.xsp',
        media: 'music',
        kind: 'smart',
        capabilities: { canBrowse: true, canPlay: true, canQueue: true }
      })
    ).resolves.toBeUndefined();
    await expect(
      props.mediaPlaylistsActionDispatch?.queuePlaylistItem({
        id: 'playlist:late-night-jazz',
        label: 'Late Night Jazz.xsp',
        media: 'music',
        kind: 'smart',
        capabilities: { canBrowse: true, canPlay: true, canQueue: true }
      })
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSetSpy).not.toHaveBeenCalled();
  });
});
