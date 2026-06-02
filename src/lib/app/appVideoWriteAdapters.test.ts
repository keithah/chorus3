import { describe, expect, it } from 'vitest';

import type { VideoWriteStoreSnapshot } from '$lib/stores/videoWriteStore.svelte';
import {
  assertVideoWriteSucceeded,
  toSeasonWriteSummary,
  toVideoWriteEpisodeItems
} from './appVideoWriteAdapters';

function snapshot(overrides: Partial<VideoWriteStoreSnapshot> = {}): VideoWriteStoreSnapshot {
  return {
    status: 'success',
    lastOperation: 'episodes-batch-watched',
    lastUpdatedAt: '2026-01-02T00:00:00.000Z',
    summary: { total: 2, succeeded: 2, failed: 0 },
    failedItems: [],
    lastError: null,
    writeCounts: {
      moviesWatched: 0,
      moviesUnwatched: 0,
      episodesWatched: 2,
      episodesUnwatched: 0,
      movieResumes: 0,
      episodeResumes: 0,
      retries: 0
    },
    ...overrides
  };
}

describe('app video write adapters', () => {
  it('throws only when the video write snapshot is in an error state', () => {
    expect(() => assertVideoWriteSucceeded(snapshot({ status: 'success' }))).not.toThrow();
    expect(() =>
      assertVideoWriteSucceeded(
        snapshot({
          status: 'error',
          lastError: {
            source: 'write',
            code: 'write/failed',
            message: 'Episode write failed.'
          }
        })
      )
    ).toThrow('Episode write failed.');
    expect(() => assertVideoWriteSucceeded(snapshot({ status: 'error' }))).toThrow(
      'Video write failed.'
    );
  });

  it('converts season shell items into video write episode items', () => {
    expect(
      toVideoWriteEpisodeItems([
        { episodeid: 42, label: 'Pilot' },
        { episodeid: 43, label: 'Finale' }
      ])
    ).toEqual([
      { episodeid: 42, label: 'Pilot' },
      { episodeid: 43, label: 'Finale' }
    ]);
  });

  it('summarizes video write snapshots for the season shell', () => {
    const failedItem = {
      kind: 'episode' as const,
      id: 42,
      label: 'Pilot',
      error: {
        source: 'write' as const,
        code: 'write/failed',
        message: 'Failed.'
      }
    };
    const summary = toSeasonWriteSummary(
      snapshot({
        status: 'partial',
        summary: { total: 0, succeeded: 1, failed: 1 },
        failedItems: [failedItem],
        lastError: failedItem.error
      }),
      2
    );

    expect(summary).toEqual({
      total: 2,
      succeeded: 1,
      failed: 1,
      failedItems: [failedItem],
      lastError: failedItem.error
    });
  });
});
