export async function mapWithConcurrency(items, concurrency, mapper) {
  const results = Array.from({ length: items.length });
  let nextIndex = 0;
  const workerCount = Math.min(normalizeConcurrency(concurrency), items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        try {
          results[index] = await mapper(items[index], index);
        } catch (error) {
          nextIndex = items.length;
          throw error;
        }
      }
    })
  );

  return results;
}

export async function collectReachableItemsWithConcurrency(initialItems, concurrency, visit) {
  const queue = [];
  const seen = new Set();

  for (const item of initialItems) {
    if (!seen.has(item)) {
      seen.add(item);
      queue.push(item);
    }
  }

  let nextIndex = 0;
  const workerCount = Math.min(normalizeConcurrency(concurrency), queue.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < queue.length) {
        const index = nextIndex;
        nextIndex += 1;
        const discoveredItems = (await visit(queue[index], index)) ?? [];

        for (const item of discoveredItems) {
          if (!seen.has(item)) {
            seen.add(item);
            queue.push(item);
          }
        }
      }
    })
  );

  return queue;
}

function normalizeConcurrency(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
