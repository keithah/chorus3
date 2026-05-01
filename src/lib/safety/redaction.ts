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
