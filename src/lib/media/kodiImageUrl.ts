/** Kodi image proxy URL, or undefined when no path is available. */
export function optionalKodiImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return `/image/${encodeKodiImagePath(value.trim())}`;
}

function encodeKodiImagePath(value: string): string {
  return encodeURIComponent(value).replace(
    /[()']/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/** Accepts raw Kodi art paths or already-proxied `/image/...` URLs. */
export function resolveKodiImageUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('/image/')) {
    return trimmed;
  }

  return optionalKodiImageUrl(trimmed);
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
