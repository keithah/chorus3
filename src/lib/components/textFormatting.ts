export function displayText(value: unknown, fallback: string): string {
  return textOrNull(value) ?? fallback;
}

export function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || looksLikePathOrUrl(trimmed)) {
    return null;
  }

  return sanitizeUiText(trimmed);
}

export function sanitizeUiText(value: string): string {
  return value
    .replace(/raw response body/gi, 'response body [redacted]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    .replace(/smb:\/\/[^\s]+/gi, '[path]')
    .replace(/special:\/\/(?:music|video)playlists[^\s]*/gi, '[playlist-path]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]{6,}/gi, 'credentials [redacted]')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/username or password/gi, 'credentials')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/sessionStorage/gi, 'browser storage');
}

function looksLikePathOrUrl(value: string): boolean {
  return (
    /^(?:https?:\/\/|smb:\/\/)/i.test(value) ||
    /^[a-z]:\\/i.test(value) ||
    /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
    /\\/.test(value)
  );
}
