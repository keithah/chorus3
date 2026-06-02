import { describe, expect, it, vi } from 'vitest';

import { createMediaPlaylistActionDispatch } from './mediaPlaylistActionDispatch';
import type {
  MediaPlaylistsPlayableEntryResult,
  MediaPlaylistsPlayablePlaylistResult
} from '$lib/stores/mediaPlaylists.svelte';

function playlistResult(
  mediaKind: 'music' | 'video',
  file = 'special://profile/playlists/example.xsp'
): MediaPlaylistsPlayablePlaylistResult {
  return {
    ok: true,
    playlist: {
      id: 'playlist:1',
      label: 'Example',
      mediaKind,
      playlistKind: 'smart',
      file
    }
  };
}

function entryResult(
  mediaKind: 'audio' | 'video',
  file = '/media/example.mkv'
): MediaPlaylistsPlayableEntryResult {
  return {
    ok: true,
    entry: {
      id: 'entry:1',
      label: 'Example entry',
      media: mediaKind === 'audio' ? 'music' : 'video',
      mediaKind,
      file
    }
  };
}

describe('createMediaPlaylistActionDispatch', () => {
  it('routes playlist and entry actions through injected player and queue dispatches', async () => {
    const store = {
      getPlayablePlaylist: vi.fn(() =>
        playlistResult('music', 'special://musicplaylists/favorites.xsp')
      ),
      getPlayableEntry: vi.fn(() => entryResult('audio', '/music/sinnerman.flac'))
    };
    const playerDispatch = {
      playPlaylistItem: vi.fn(),
      playFileItem: vi.fn()
    };
    const queueDispatch = {
      queuePlaylistItem: vi.fn(),
      queueFileItem: vi.fn()
    };

    const dispatch = createMediaPlaylistActionDispatch({
      expectedPlaylistMediaKind: 'music',
      store,
      playerDispatch,
      queueDispatch
    });

    await dispatch.playPlaylistItem({
      id: 'playlist:1',
      label: 'Favorites',
      media: 'music',
      kind: 'smart',
      capabilities: { canBrowse: true, canPlay: true, canQueue: true }
    });
    await dispatch.queuePlaylistItem({
      id: 'playlist:1',
      label: 'Favorites',
      media: 'music',
      kind: 'smart',
      capabilities: { canBrowse: true, canPlay: true, canQueue: true }
    });
    await dispatch.playEntryItem?.({
      id: 'entry:1',
      label: 'Sinnerman.flac',
      media: 'music',
      mediaKind: 'audio'
    });
    await dispatch.queueEntryItem?.({
      id: 'entry:1',
      label: 'Sinnerman.flac',
      media: 'music',
      mediaKind: 'audio'
    });

    expect(playerDispatch.playPlaylistItem).toHaveBeenCalledWith({
      file: 'special://musicplaylists/favorites.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });
    expect(queueDispatch.queuePlaylistItem).toHaveBeenCalledWith({
      file: 'special://musicplaylists/favorites.xsp',
      mediaKind: 'music',
      playlistKind: 'smart'
    });
    expect(playerDispatch.playFileItem).toHaveBeenCalledWith({
      file: '/music/sinnerman.flac',
      mediaKind: 'audio'
    });
    expect(queueDispatch.queueFileItem).toHaveBeenCalledWith({
      file: '/music/sinnerman.flac',
      mediaKind: 'audio'
    });
  });

  it('throws a clear error when the playlist media does not match the expected surface', async () => {
    const dispatch = createMediaPlaylistActionDispatch({
      expectedPlaylistMediaKind: 'music',
      store: {
        getPlayablePlaylist: () => playlistResult('video'),
        getPlayableEntry: () => entryResult('audio')
      },
      playerDispatch: {
        playPlaylistItem: vi.fn(),
        playFileItem: vi.fn()
      },
      queueDispatch: {
        queuePlaylistItem: vi.fn(),
        queueFileItem: vi.fn()
      }
    });

    expect(() =>
      dispatch.playPlaylistItem({
        id: 'playlist:1',
        label: 'Videos',
        media: 'music',
        kind: 'smart',
        capabilities: { canBrowse: true, canPlay: true, canQueue: true }
      })
    ).toThrow('Choose a supported music playlist.');
  });
});
