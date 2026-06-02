import { describe, expect, it } from 'vitest';

import type { PlaylistDisabledReasonContext } from './appPlaylistAdapters';
import {
  exportableLocalPlaylistItems,
  playableAudioItems,
  playlistClearDisabledReason,
  playlistPartyModeDisabledReason,
  queueSnapshotToPlayableItems,
  safePlaylistExportName,
  saveKodiPlaylistDisabledReason,
  toLocalPlaylistItemInput
} from './appPlaylistAdapters';

function disabledContext(
  overrides: Partial<PlaylistDisabledReasonContext> = {}
): PlaylistDisabledReasonContext {
  return {
    destinationMode: 'local',
    localPlaylistSnapshot: { selectedPlaylistId: 'playlist-1' },
    queueSnapshot: { refreshStatus: 'idle', items: [] },
    playerSnapshot: { primaryPlayer: { playerid: 1, type: 'audio' } },
    safeQueueItemCount: 1,
    isLocalPlaylistMutationRunning: false,
    isQueueCommandRunning: false,
    isPlayerDestinationCommandRunning: false,
    ...overrides
  } as PlaylistDisabledReasonContext;
}

describe('app playlist adapters', () => {
  it('derives local playlist menu disabled reasons from explicit context', () => {
    expect(
      playlistClearDisabledReason(
        disabledContext({
          localPlaylistSnapshot: { selectedPlaylistId: null } as never
        })
      )
    ).toBe('Select a local playlist before clearing it.');
    expect(
      saveKodiPlaylistDisabledReason(
        disabledContext({
          safeQueueItemCount: 0
        })
      )
    ).toBe('Current Kodi queue has no supported items to save.');
    expect(
      playlistPartyModeDisabledReason(
        disabledContext({
          destinationMode: 'kodi',
          playerSnapshot: { primaryPlayer: null } as never
        })
      )
    ).toBe('Start Kodi playback before toggling party mode.');
  });

  it('normalizes queue items for local playlist saves without leaking unsafe labels', () => {
    const playable = queueSnapshotToPlayableItems({
      refreshStatus: 'idle',
      items: [
        {
          position: 2,
          label: '  Safe   Song  ',
          title: 'ignored',
          type: 'song',
          duration: 12,
          thumbnail: 'thumb.jpg'
        },
        {
          position: 3,
          label: '',
          title: 'http://secret.example/media',
          type: 'movie'
        }
      ]
    } as never);

    expect(playable).toEqual([
      {
        position: 2,
        label: 'Safe Song',
        file: 'queue-item:2',
        type: 'song',
        duration: 12,
        thumbnail: 'thumb.jpg'
      }
    ]);
    expect(toLocalPlaylistItemInput(playable[0])).toEqual([
      {
        kind: 'audio',
        label: 'Safe Song',
        file: 'queue-item:2',
        sourceId: 'queue:2',
        durationSeconds: 12,
        thumbnail: 'thumb.jpg'
      }
    ]);
  });

  it('keeps local playlist export selection sorted and file-backed', () => {
    const items = [
      { position: 3, kind: 'audio', file: 'c.mp3' },
      { position: 1, kind: 'video', file: 'a.mp4' },
      { position: 2, kind: 'playlist', file: 'nested.m3u' },
      { position: 4, kind: 'audio', file: ' ' }
    ] as never;

    expect(playableAudioItems(items).map((item) => item.position)).toEqual([3]);
    expect(exportableLocalPlaylistItems(items).map((item) => item.position)).toEqual([1, 3]);
    expect(safePlaylistExportName(' My unsafe/name? ')).toBe('My-unsafe-name');
  });
});
