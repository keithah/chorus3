import type {
  VideoSeasonWriteItem,
  VideoSeasonWriteSummary
} from '$components/VideoSeasonDetailShell.svelte';
import type { VideoWriteStoreSnapshot } from '$lib/stores/videoWriteStore.svelte';

export function assertVideoWriteSucceeded(snapshot: VideoWriteStoreSnapshot): void {
  if (snapshot.status !== 'error') {
    return;
  }

  throw new Error(snapshot.lastError?.message ?? 'Video write failed.');
}

export function toVideoWriteEpisodeItems(items: readonly VideoSeasonWriteItem[]): {
  episodeid: number;
  label?: string;
}[] {
  return items.map((item) => ({ episodeid: item.episodeid, label: item.label }));
}

export function toSeasonWriteSummary(
  snapshot: VideoWriteStoreSnapshot,
  attemptedTotal = snapshot.summary.total
): VideoSeasonWriteSummary {
  const total = snapshot.summary.total || attemptedTotal;
  return {
    total,
    succeeded: snapshot.summary.succeeded,
    failed: snapshot.summary.failed,
    failedItems: snapshot.failedItems,
    lastError: snapshot.lastError
  };
}
