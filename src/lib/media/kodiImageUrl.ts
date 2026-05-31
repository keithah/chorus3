export const KODI_DEFAULT_THUMBNAIL_URL =
  '/addons/webinterface.chorus3/assets/classic/thumbnail_default.png';

/** Kodi image proxy URL, or undefined when no path is available. */
export function optionalKodiImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return `/image/${encodeURIComponent(value.trim())}`;
}

/** Kodi image proxy URL with the classic default thumbnail when no path is available. */
export function kodiImagePath(value?: unknown): string {
  return optionalKodiImageUrl(value) ?? KODI_DEFAULT_THUMBNAIL_URL;
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
