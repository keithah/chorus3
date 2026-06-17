const REDACTED = '[redacted]';
const CIRCULAR = '[Circular]';
const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 100;
const MAX_OBJECT_KEYS = 100;
const MAX_TEXT_LENGTH = 20_000;

const SENSITIVE_KEY_PATTERN =
  /authorization|credential|password|passwd|token|secret|apikey|api[-_]?key|body|payload|response|raw|url|uri|path|file|directory/i;

const UNSAFE_TEXT_PATTERNS: readonly RegExp[] = [
  /Authorization\s*[:=]\s*Basic\s+[^\s,;}\]]+/gi,
  /Authorization\s*[:=]\s*Bearer\s+[^\s,;}\]]+/gi,
  /Authorization\s*[:=]\s*[^\n\r,;}\]]+/gi,
  /Basic\s+[A-Za-z0-9+/=._:-]+/gi,
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /https?:\/\/[^\s"'<>\\)]+/gi,
  /smb:\/\/[^\s"'<>\\)]+/gi,
  /special:\/\/[^\s"'<>\\)]+/gi,
  /file:\/\/[^\s"'<>\\)]+/gi,
  /\b[A-Za-z]:\\(?:[^\s"'<>\\]+\\)*[^\s"'<>\\]*/g,
  /(?:^|[\s"'])\/(?:Users|home|Volumes|mnt|media|var|tmp)\/[^\s"'<>)}\]]+/g,
  /\b(?:localStorage|sessionStorage)\b/gi,
  /\b(?:SENTINEL_SECRET|CHORUS3_SENTINEL_SECRET)\b/g,
  /admin:p@ssword/gi,
  /super-secret-password/gi,
  /\b(?:password|passwd|token|secret|authorization|basic|bearer|credential|body|payload|response|raw)\b/gi
];

export function redactDiagnosticText(value: unknown): string {
  return redactText(toDiagnosticText(value));
}

export function redactStoreErrorMessage(message: string): string {
  return redactJsonPayloadText(message)
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=._-]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/https?:\/\/[^\s/@:]+:[^\s/@]+@/gi, 'http://credentials@')
    .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-path')
    .replace(/special:\/\/[^\s]+/gi, 'redacted-path')
    .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-path')
    .replace(/\/[^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-path')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/localStorage|sessionStorage/gi, 'browser storage')
    .replace(
      /CHORUS_SENTINEL_SECRET|CHORUS3_SENTINEL_SECRET|SENTINEL_SECRET/gi,
      '[redacted-sentinel]'
    )
    .replace(/raw[_\s-]*response[_\s-]*body/gi, 'response body [redacted]')
    .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
    .replace(/\bInput\.SendText\b/gi, 'redacted action')
    .replace(/\bjsonrpc\b/gi, 'redacted payload')
    .replace(/password/gi, 'credentials');
}

export function redactUiText(value: string): string {
  return redactJsonPayloadText(value)
    .replace(/raw response body/gi, 'response body [redacted]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    .replace(/file:\/\/[^\s]+/gi, '[path]')
    .replace(/smb:\/\/[^\s]+/gi, '[path]')
    .replace(/image:\/\/[^\s]+/gi, '[artwork]')
    .replace(/special:\/\/(?:music|video)playlists[^\s]*/gi, '[playlist-path]')
    .replace(/special:\/\/[^\s]+/gi, '[path]')
    .replace(/\/vfs\/[^\s]+/gi, '[path]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]{6,}/gi, 'credentials [redacted]')
    .replace(/sentinel_secret/gi, '[redacted-secret]')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/password/gi, 'credentials')
    .replace(/\b[a-z]:\\[^\s]+/gi, '[path]')
    .replace(/username or password/gi, 'credentials')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/sessionStorage/gi, 'browser storage')
    .replace(/\/(mnt|media|home|users|volumes|var|tmp)\/[^\s]+/gi, '[path]');
}

export function redactJsonForDisplay(value: unknown): string {
  const normalized = normalizeForDisplay(value, new WeakSet<object>(), 0);

  try {
    return redactText(JSON.stringify(normalized, null, 2));
  } catch {
    return REDACTED;
  }
}

export function isTextSecretSafe(value: string): boolean {
  return redactText(value) === value;
}

export function redactAddonText(value: string): string {
  return redactJsonPayloadText(value)
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=._-]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/admin:p@ssword/gi, '[redacted-secret]')
    .replace(/p@ssword/gi, '[redacted-secret]')
    .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
    .replace(/\/[\w./-]+/gi, '[redacted-path]')
    .replace(/localStorage/gi, 'browser storage')
    .replace(/sessionStorage/gi, 'browser storage')
    .replace(
      /CHORUS_SENTINEL_SECRET|CHORUS3_SENTINEL_SECRET|SENTINEL_SECRET/gi,
      '[redacted-sentinel]'
    )
    .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
    .replace(/password/gi, 'credentials');
}

function redactJsonPayloadText(value: string): string {
  return value.replace(
    /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*(?:"jsonrpc"|Input\.SendText)(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/gi,
    'redacted payload'
  );
}

function normalizeForDisplay(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (depth > MAX_DEPTH) {
    return '[Truncated]';
  }

  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'string') {
    return redactText(value);
  }

  if (typeof value === 'symbol') {
    return '[Symbol]';
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (seen.has(value)) {
    return CIRCULAR;
  }

  seen.add(value);

  if (value instanceof Error) {
    return {
      name: redactText(value.name),
      message: redactText(value.message)
    };
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => normalizeForDisplay(item, seen, depth + 1));

    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`[Truncated ${value.length - MAX_ARRAY_ITEMS} items]`);
    }

    return items;
  }

  const output: Record<string, unknown> = {};
  let redactedIndex = 1;
  let processed = 0;

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (processed >= MAX_OBJECT_KEYS) {
      output.truncated = `[Truncated ${Object.keys(value as Record<string, unknown>).length - processed} keys]`;
      break;
    }

    processed += 1;
    const safeKey = SENSITIVE_KEY_PATTERN.test(key)
      ? `redactedField${redactedIndex++}`
      : redactText(key);

    if (SENSITIVE_KEY_PATTERN.test(key)) {
      output[safeKey] = REDACTED;
      continue;
    }

    try {
      output[safeKey] = normalizeForDisplay(
        (value as Record<string, unknown>)[key],
        seen,
        depth + 1
      );
    } catch {
      output[safeKey] = REDACTED;
    }
  }

  return output;
}

function toDiagnosticText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  if (value == null) {
    return String(value);
  }

  if (typeof value === 'object') {
    return redactJsonForDisplay(value);
  }

  try {
    return String(value);
  } catch {
    return REDACTED;
  }
}

function redactText(input: string): string {
  let text = input.slice(0, MAX_TEXT_LENGTH);

  for (const pattern of UNSAFE_TEXT_PATTERNS) {
    text = text.replace(pattern, REDACTED);
  }

  return text;
}
