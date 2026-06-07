import {
  getFileDirectory,
  type FileDirectoryParams,
  type FileDirectoryResult,
  type KodiHttpCallOptions
} from '$lib/kodi';
import type { KodiJsonRpcHttpClient } from '$lib/kodi';

export const MEDIA_DIRECTORY_PAGE_SIZE = 500;
const MEDIA_DIRECTORY_PAGE_CONCURRENCY = 4;

type DirectoryPageRange = {
  start: number;
  end: number;
};

export async function getPagedFileDirectory(
  client: KodiJsonRpcHttpClient,
  params: FileDirectoryParams,
  options?: KodiHttpCallOptions
): Promise<FileDirectoryResult> {
  const first = await getFileDirectory(
    client,
    withLimits(params, 0, MEDIA_DIRECTORY_PAGE_SIZE),
    options
  );
  const files = [...(Array.isArray(first.files) ? first.files : [])];
  const total = finiteLimit(first.limits?.total);
  const firstEnd = finiteLimit(first.limits?.end);

  if (total === null) {
    return { ...first, files };
  }

  if (firstEnd === null) {
    throw new Error('Kodi returned incomplete directory pagination limits.');
  }

  if (firstEnd >= total) {
    return { ...first, files };
  }

  const remainingRanges = directoryPageRanges(firstEnd, total);
  const remainingPages = await getDirectoryPages(client, params, remainingRanges, options);
  let end = firstEnd;
  for (const [index, next] of remainingPages.entries()) {
    const range = remainingRanges[index];
    if (!range) {
      continue;
    }

    files.push(...(Array.isArray(next.files) ? next.files : []));

    const reportedEnd = finiteLimit(next.limits?.end);
    if (reportedEnd === null || reportedEnd <= range.start) {
      throw new Error('Kodi returned stalled directory pagination limits.');
    }
    if (reportedEnd < range.end) {
      throw new Error('Kodi returned incomplete directory pagination limits.');
    }

    end = Math.max(end, reportedEnd);
  }

  return {
    ...first,
    files,
    limits: {
      ...first.limits,
      start: finiteLimit(first.limits?.start) ?? 0,
      end,
      total
    }
  };
}

function directoryPageRanges(start: number, total: number): DirectoryPageRange[] {
  const ranges: DirectoryPageRange[] = [];
  for (let pageStart = start; pageStart < total; pageStart += MEDIA_DIRECTORY_PAGE_SIZE) {
    ranges.push({
      start: pageStart,
      end: Math.min(pageStart + MEDIA_DIRECTORY_PAGE_SIZE, total)
    });
  }
  return ranges;
}

async function getDirectoryPages(
  client: KodiJsonRpcHttpClient,
  params: FileDirectoryParams,
  ranges: readonly DirectoryPageRange[],
  options?: KodiHttpCallOptions
): Promise<FileDirectoryResult[]> {
  const pages = new Array<FileDirectoryResult>(ranges.length);
  let nextIndex = 0;
  const workerCount = Math.min(MEDIA_DIRECTORY_PAGE_CONCURRENCY, ranges.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < ranges.length) {
      const index = nextIndex;
      nextIndex += 1;
      const range = ranges[index];
      if (!range) {
        return;
      }
      pages[index] = await getFileDirectory(
        client,
        withLimits(params, range.start, range.end),
        options
      );
    }
  });

  await Promise.all(workers);
  return pages;
}

function withLimits(params: FileDirectoryParams, start: number, end: number): FileDirectoryParams {
  return {
    ...params,
    limits: { start, end }
  };
}

function finiteLimit(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
