const ROOT_PATH = '/';
const UNSAFE_SEGMENT = '[redacted]';
const MAX_SAFE_PATH_SEGMENT_LENGTH = 128;
const FORBIDDEN_SEGMENT_PATTERN =
  /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

export interface NormalizePathnameInputOptions {
  preserveTrailingSlash?: boolean;
}

export interface NormalizedPathnameInput {
  path: string;
  hadTrailingSlash: boolean;
}

export function normalizePathnameInput(
  pathname: unknown,
  options: NormalizePathnameInputOptions = {}
): string {
  return normalizePathnameInputWithInfo(pathname, options).path;
}

export function normalizePathnameInputWithInfo(
  pathname: unknown,
  options: NormalizePathnameInputOptions = {}
): NormalizedPathnameInput {
  if (pathname === null || pathname === undefined || pathname === '') {
    return { path: ROOT_PATH, hadTrailingSlash: false };
  }

  if (typeof pathname !== 'string') {
    return { path: `/${UNSAFE_SEGMENT}`, hadTrailingSlash: false };
  }

  const pathOnly = pathname.split(/[?#]/, 1)[0]?.trim() ?? '';

  if (!pathOnly) {
    return { path: ROOT_PATH, hadTrailingSlash: false };
  }

  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const compacted = withLeadingSlash.replace(/\/{2,}/g, '/');
  const hadTrailingSlash = compacted.length > 1 && compacted.endsWith('/');
  const withoutTrailingSlash =
    compacted.length > 1 && !options.preserveTrailingSlash
      ? compacted.replace(/\/+$/g, '')
      : compacted;

  return {
    path: withoutTrailingSlash === '' ? ROOT_PATH : withoutTrailingSlash,
    hadTrailingSlash
  };
}

export function normalizeSearch(search: unknown): URLSearchParams | null {
  if (typeof search !== 'string' || search.length === 0) {
    return null;
  }

  try {
    return new URLSearchParams(search);
  } catch {
    return null;
  }
}

export function normalizePathLabel(pathname: string, fallback: string): string {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const safeSegments = segments.map(sanitizePathSegment).slice(0, 5);
  const pathLabel = `/${safeSegments.join('/')}`;

  return pathLabel === ROOT_PATH ? fallback : pathLabel;
}

export function hasUnsafePathPayload(pathname: string, payloadStartIndex: number): boolean {
  const normalized = normalizePathnameInput(pathname);
  const segments = normalized.split('/').filter(Boolean);

  return segments
    .slice(Math.max(0, payloadStartIndex))
    .some((segment) => sanitizePathSegment(segment) === UNSAFE_SEGMENT);
}

export function parseSafeIntegerSegment(segment: string | undefined): number | null {
  if (typeof segment !== 'string') {
    return null;
  }

  const decoded = safeDecode(segment).trim();

  if (decoded !== segment || !/^\d+$/u.test(segment)) {
    return null;
  }

  const parsed = Number(segment);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function sanitizePathSegment(segment: string): string {
  const decoded = safeDecode(segment).trim();

  if (
    !decoded ||
    decoded.length > MAX_SAFE_PATH_SEGMENT_LENGTH ||
    FORBIDDEN_SEGMENT_PATTERN.test(decoded) ||
    decoded.includes('/')
  ) {
    return UNSAFE_SEGMENT;
  }

  if (!/^[a-z0-9._-]+$/i.test(decoded)) {
    return UNSAFE_SEGMENT;
  }

  return decoded;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
