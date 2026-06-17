import { redactUiText } from '$lib/safety/redaction';

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
  return redactUiText(value);
}

export function looksLikePathOrUrl(value: string): boolean {
  return (
    /^(?:https?:\/\/|file:\/\/|smb:\/\/|special:\/\/|image:\/\/)/i.test(value) ||
    /^[a-z]:\\/i.test(value) ||
    /^\/(?:mnt|media|home|users|volumes|var|tmp|vfs)\//i.test(value) ||
    /\\/.test(value)
  );
}
