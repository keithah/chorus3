import { readFileSync } from 'node:fs';

const sourceCache = new Map<string, string>();

export function readCachedSource(path: string): string {
  const cached = sourceCache.get(path);
  if (cached !== undefined) return cached;

  const source = readFileSync(path, 'utf8');
  sourceCache.set(path, source);
  return source;
}
