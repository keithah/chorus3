import { describe, expect, it, vi } from 'vitest';

import { KodiPagedLibraryResponseError, readPagedKodiLibraryList } from './pagedKodiLibrary';

describe('readPagedKodiLibraryList', () => {
  it('fetches remaining pages with bounded concurrency and preserves item order', async () => {
    let activeReads = 0;
    let maxActiveReads = 0;
    const readPage = vi.fn(async (params: { limits?: { start?: number; end?: number } }) => {
      activeReads += 1;
      maxActiveReads = Math.max(maxActiveReads, activeReads);
      await Promise.resolve();
      activeReads -= 1;

      const start = params.limits?.start ?? 0;
      const end = params.limits?.end ?? start + 2;
      return {
        movies: Array.from({ length: end - start }, (_value, index) => ({
          movieid: start + index
        })),
        limits: { start, end, total: 10 }
      };
    });

    const result = await readPagedKodiLibraryList(readPage, {}, 'movies', undefined, 2);

    expect(readPage).toHaveBeenCalledTimes(5);
    expect(maxActiveReads).toBeLessThanOrEqual(4);
    expect(result.movies?.map((movie) => movie.movieid)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.limits).toEqual({ start: 0, end: 10, total: 10 });
  });

  it('rejects positive totals that omit the item array', async () => {
    const readPage = vi.fn(async () => ({
      limits: { start: 0, end: 500, total: 2 }
    }));

    await expect(readPagedKodiLibraryList(readPage, {}, 'movies')).rejects.toBeInstanceOf(
      KodiPagedLibraryResponseError
    );
  });

  it('keeps zero-total responses empty when Kodi omits the item array', async () => {
    const readPage = vi.fn(async () => ({
      limits: { start: 0, end: 0, total: 0 }
    }));

    await expect(readPagedKodiLibraryList(readPage, {}, 'movies')).resolves.toMatchObject({
      limits: { start: 0, end: 0, total: 0 }
    });
  });
});
