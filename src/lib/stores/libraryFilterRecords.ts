export type LibraryFilterEnrichmentOptions = {
  thumbsUp?: boolean;
};

/** Normalize Kodi library snapshots so Chorus2 filter keys match local item shapes. */
export function enrichLibraryFilterRecord(
  item: Record<string, unknown>,
  options: LibraryFilterEnrichmentOptions = {}
): Record<string, unknown> {
  const record: Record<string, unknown> = { ...item };

  if (options.thumbsUp !== undefined) {
    record.thumbsUp = options.thumbsUp;
  }

  if (typeof record.label === 'string' && record.label.trim() && !stringValue(record.title)) {
    record.title = record.label;
  }

  if (typeof record.unwatchedEpisodes === 'number') {
    const hasUnwatched = record.unwatchedEpisodes > 0 || record.hasUnwatched === true;
    record.watched = !hasUnwatched;
    record.playcount = hasUnwatched ? 0 : 1;
  }

  const normalizedSet = normalizeLibrarySetValue(record.set);
  if (normalizedSet !== undefined) {
    record.set = normalizedSet;
  } else if ('set' in record && !isPrimitiveFilterValue(record.set)) {
    delete record.set;
  }

  return record;
}

export function libraryFilterRecordFrom(
  item: object,
  options: LibraryFilterEnrichmentOptions = {}
): Record<string, unknown> {
  return enrichLibraryFilterRecord({ ...item }, options);
}

export function normalizeLibrarySetValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return stringValue(value);
  }

  if (isRecord(value)) {
    return stringValue(value.set);
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitiveFilterValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
