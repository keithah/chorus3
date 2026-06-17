export interface JsonSnapshotCache<TSnapshot> {
  source: TSnapshot | null;
  snapshot: TSnapshot | null;
}

/**
 * Cache a public immutable snapshot for store snapshots that are intentionally JSON-shaped.
 * Do not use this for snapshots containing Dates, Maps, functions, class instances, or symbols.
 */
export function cachedFrozenJsonSnapshot<TSnapshot>(
  cache: JsonSnapshotCache<TSnapshot>,
  source: TSnapshot,
  materialize: (snapshot: TSnapshot) => TSnapshot
): TSnapshot {
  if (cache.source === source && cache.snapshot !== null) {
    return cache.snapshot;
  }

  const snapshot = deepFreeze(materialize(source));
  cache.source = source;
  cache.snapshot = snapshot;
  return snapshot;
}

export function materializeSmallJsonSnapshot<TSnapshot>(source: TSnapshot): TSnapshot {
  if (typeof source !== 'object' || source === null) {
    return source;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(source);
    } catch {
      // Some Svelte proxy-shaped test fixtures are not structured-cloneable.
      // The JSON fallback is slower but keeps this helper usable for small diagnostic snapshots.
    }
  }

  return JSON.parse(JSON.stringify(source)) as TSnapshot;
}

export function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return value;
}
