/** Kodi image proxy URL, or undefined when no path is available. */
export function optionalKodiImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return `/image/${encodeURIComponent(value.trim())}`;
}

/** First available image URL from a list of Kodi art fields. */
export function firstOptionalKodiImageUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    const url = optionalKodiImageUrl(value);

    if (url) {
      return url;
    }
  }

  return undefined;
}
