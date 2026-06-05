export type BackboneCollectionStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key'
> & {
  readonly length: number;
};

export type BackboneCollectionRow = Record<string, unknown>;

export function readBackboneCollectionRows(
  storage: BackboneCollectionStorage,
  collectionKey: string
): BackboneCollectionRow[] {
  const raw = storage.getItem(collectionKey);
  const jsonRows = parseJsonRows(raw);
  if (jsonRows) return jsonRows;

  const ids = raw
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (!ids?.length) return [];

  return ids.flatMap((id, index) => {
    const row = readBackboneModel(storage, collectionKey, id);
    return row ? [{ ...row, id, weight: index }] : [];
  });
}

function parseJsonRows(raw: string | null): BackboneCollectionRow[] | null {
  if (!raw || !['[', '{'].includes(raw.trimStart()[0] ?? '')) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rows = Array.isArray(parsed) ? parsed : isRecord(parsed) ? parsed.rows : null;
    return Array.isArray(rows) ? rows.filter(isRecord) : null;
  } catch {
    return null;
  }
}

function readBackboneModel(
  storage: BackboneCollectionStorage,
  collectionKey: string,
  id: string
): BackboneCollectionRow | null {
  const raw = storage.getItem(`${collectionKey}-${id}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is BackboneCollectionRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
