import type { KodiHttpCallOptions, KodiLimits } from '$lib/kodi';

type KodiPagedListParams = {
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  [key: string]: unknown;
};

type KodiPagedListResult<TKey extends PropertyKey, TItem> = {
  limits?: KodiLimits;
} & Partial<Record<TKey, readonly TItem[]>>;

export const DEFAULT_FULL_LIBRARY_PAGE_SIZE = 500;
const DEFAULT_FULL_LIBRARY_PAGE_CONCURRENCY = 4;

export class KodiPagedLibraryResponseError extends Error {
  constructor(itemsKey: PropertyKey, total: number) {
    super(`Kodi returned ${total} ${String(itemsKey)} items without a ${String(itemsKey)} array.`);
    this.name = 'KodiPagedLibraryResponseError';
  }
}

export async function readPagedKodiLibraryList<
  TParams extends KodiPagedListParams,
  TKey extends PropertyKey,
  TItem,
  TResult extends KodiPagedListResult<TKey, TItem>
>(
  readPage: (params: TParams, options?: KodiHttpCallOptions) => Promise<TResult>,
  params: TParams,
  itemsKey: TKey,
  options?: KodiHttpCallOptions,
  pageSize = DEFAULT_FULL_LIBRARY_PAGE_SIZE
): Promise<TResult> {
  const safePageSize = normalizePageSize(pageSize);
  const firstResult = await readPage(withPageLimits(params, 0, safePageSize), options);
  const total = finiteNonNegativeInteger(firstResult.limits?.total);
  const firstItems = pagedArrayValue<TItem>(firstResult[itemsKey], itemsKey, total);

  if (total === null || total <= safePageSize || firstItems.length >= total) {
    return firstResult;
  }

  const remainingPages = pageRanges(safePageSize, total, safePageSize);
  const remainingItems = await readRemainingPages(
    readPage,
    params,
    itemsKey,
    total,
    remainingPages,
    options,
    DEFAULT_FULL_LIBRARY_PAGE_CONCURRENCY
  );
  const allItems = [...firstItems, ...remainingItems.flat()];

  return withPagedItems(firstResult, itemsKey, allItems, {
    start: 0,
    end: Math.max(total, allItems.length),
    total
  });
}

async function readRemainingPages<
  TParams extends KodiPagedListParams,
  TKey extends PropertyKey,
  TItem,
  TResult extends KodiPagedListResult<TKey, TItem>
>(
  readPage: (params: TParams, options?: KodiHttpCallOptions) => Promise<TResult>,
  params: TParams,
  itemsKey: TKey,
  total: number,
  ranges: readonly PageRange[],
  options: KodiHttpCallOptions | undefined,
  concurrency: number
): Promise<TItem[][]> {
  const results: TItem[][] = Array.from({ length: ranges.length }, () => []);
  let nextIndex = 0;
  const workerCount = Math.min(normalizeConcurrency(concurrency), ranges.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < ranges.length) {
        const index = nextIndex;
        nextIndex += 1;
        const range = ranges[index];
        const result = await readPage(withPageLimits(params, range.start, range.end), options);
        results[index] = pagedArrayValue<TItem>(result[itemsKey], itemsKey, total);
      }
    })
  );

  return results;
}

type PageRange = {
  start: number;
  end: number;
};

function pageRanges(start: number, total: number, pageSize: number): PageRange[] {
  const ranges: PageRange[] = [];
  for (let pageStart = start; pageStart < total; pageStart += pageSize) {
    ranges.push({ start: pageStart, end: Math.min(pageStart + pageSize, total) });
  }
  return ranges;
}

function withPageLimits<TParams extends KodiPagedListParams>(
  params: TParams,
  start: number,
  end: number
): TParams {
  return {
    ...params,
    limits: {
      ...(params.limits ?? {}),
      start,
      end
    }
  };
}

function withPagedItems<
  TKey extends PropertyKey,
  TItem,
  TResult extends KodiPagedListResult<TKey, TItem>
>(result: TResult, itemsKey: TKey, items: readonly TItem[], limits: KodiLimits): TResult {
  return {
    ...result,
    [itemsKey]: [...items],
    limits
  };
}

function pagedArrayValue<TItem>(
  value: readonly TItem[] | undefined,
  itemsKey: PropertyKey,
  total: number | null
): TItem[] {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (total === null || total === 0) {
    return [];
  }

  throw new KodiPagedLibraryResponseError(itemsKey, total);
}

function normalizePageSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_FULL_LIBRARY_PAGE_SIZE;
}

function normalizeConcurrency(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function finiteNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null;
}
