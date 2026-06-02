export type IncrementalVisibility = {
  readonly count: number;
  showMore(): void;
  visibleItems<T>(items: readonly T[]): readonly T[];
  hasMore(total: number): boolean;
};

export function createIncrementalVisibility(
  initial: number,
  step = initial
): IncrementalVisibility {
  let count = $state(initial);

  return {
    get count() {
      return count;
    },
    showMore() {
      count += step;
    },
    visibleItems<T>(items: readonly T[]): readonly T[] {
      return items.slice(0, count);
    },
    hasMore(total: number) {
      return count < total;
    }
  };
}
