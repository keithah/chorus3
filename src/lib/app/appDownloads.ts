import type { LocalPlaylistPlayableItem } from '$lib/stores';
import { exportableLocalPlaylistItems, safePlaylistExportName } from '$lib/app/appPlaylistAdapters';

export type BrowserUrlApi = Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;

export function exportLocalPlaylistM3u(
  document: Document,
  urlApi: BrowserUrlApi,
  playlistLabel: string,
  items: readonly LocalPlaylistPlayableItem[]
): void {
  const exportable = exportableLocalPlaylistItems(items);
  if (exportable.length === 0) {
    return;
  }

  const parts: BlobPart[] = ['#EXTCPlayListM3U::M3U\n'];
  for (const item of exportable) {
    parts.push(
      `#EXTINF:${Math.trunc(item.durationSeconds ?? -1)},${item.label}\n`,
      item.file,
      '\n'
    );
  }

  const blob = new Blob(parts, {
    type: 'audio/x-mpegurl;charset=utf-8'
  });
  const url = urlApi.createObjectURL(blob);
  startBrowserDownload(document, url, `${safePlaylistExportName(playlistLabel)}.m3u`);
  urlApi.revokeObjectURL(url);
}

export function startBrowserDownload(document: Document, url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
