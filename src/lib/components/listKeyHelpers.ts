export function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function safeStableKey(prefix: string, id: unknown, index: number): string {
  const value = stringOrNull(id);
  if (value) {
    return `${prefix}:${value}`;
  }

  if (typeof id === 'number' && Number.isFinite(id)) {
    return `${prefix}:${id}`;
  }

  return `${prefix}:missing:${index}`;
}

export function safeIndexedKey(prefix: string, id: unknown, index: number): string {
  const value = stringOrNull(id);
  return value ? `${prefix}:${value}:${index}` : `${prefix}:missing:${index}`;
}
