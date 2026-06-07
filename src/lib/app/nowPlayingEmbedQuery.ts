import { isLocale, type Locale } from '../i18n/localeCore';
import { isThemeName, type ThemeName } from '../theme/theme';

export interface NowPlayingEmbedQuery {
  theme: ThemeName | null;
  locale: Locale | null;
  rejectedCredentialParams: string[];
  ignoredParams: string[];
}

const MAX_PARAM_NAMES = 20;
const EMPTY_QUERY: NowPlayingEmbedQuery = Object.freeze({
  theme: null,
  locale: null,
  rejectedCredentialParams: [],
  ignoredParams: []
});

const CREDENTIAL_KEY_PATTERN =
  /^(username|user|password|pass|token|access_token|auth|authorization|basic|credential|secret)$/i;
const CREDENTIAL_VALUE_PATTERN =
  /(:\/\/|@|authorization|basic|password|token|secret|sentinel_secret|chorus3_sentinel_secret)/i;
const SAFE_PARAM_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function parseNowPlayingEmbedQuery(search: unknown): NowPlayingEmbedQuery {
  const params = createSearchParams(search);

  if (!params) {
    return createEmbedQuery();
  }

  const rejectedCredentialParams = createCappedNameCollector();
  const ignoredParams = createCappedNameCollector();
  const valuesByName = new Map<string, string[]>();
  const displayNameByName = new Map<string, string>();

  for (const [rawName, rawValue] of params) {
    const normalizedName = rawName.toLowerCase();
    const safeName = sanitizeParamName(rawName);

    if (!displayNameByName.has(normalizedName)) {
      displayNameByName.set(normalizedName, safeName);
    }

    if (isCredentialLike(rawName, rawValue)) {
      rejectedCredentialParams.add(safeName);
      continue;
    }

    const values = valuesByName.get(normalizedName) ?? [];
    values.push(rawValue);
    valuesByName.set(normalizedName, values);
  }

  const theme = resolveSingleValue(valuesByName.get('theme'), isThemeName);
  const locale = resolveSingleValue(valuesByName.get('locale'), isLocale);

  for (const [normalizedName, values] of valuesByName) {
    const safeName = displayNameByName.get(normalizedName) ?? sanitizeParamName(normalizedName);

    if (normalizedName === 'theme') {
      if (theme === null) {
        ignoredParams.add(safeName);
      }
      continue;
    }

    if (normalizedName === 'locale') {
      if (locale === null) {
        ignoredParams.add(safeName);
      }
      continue;
    }

    if (values.length > 0) {
      ignoredParams.add(safeName);
    }
  }

  return createEmbedQuery({
    theme,
    locale,
    rejectedCredentialParams: rejectedCredentialParams.values(),
    ignoredParams: ignoredParams.values()
  });
}

function createSearchParams(search: unknown): URLSearchParams | null {
  if (typeof search !== 'string' || search.length === 0) {
    return null;
  }

  try {
    return new URLSearchParams(search);
  } catch {
    return null;
  }
}

function resolveSingleValue<TValue extends string>(
  values: string[] | undefined,
  validator: (value: unknown) => value is TValue
): TValue | null {
  if (!values || values.length !== 1) {
    return null;
  }

  const [value] = values;

  return validator(value) ? value : null;
}

function isCredentialLike(name: string, value: string): boolean {
  return CREDENTIAL_KEY_PATTERN.test(name) || CREDENTIAL_VALUE_PATTERN.test(value);
}

function sanitizeParamName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return '[empty]';
  }

  if (!SAFE_PARAM_NAME_PATTERN.test(trimmed)) {
    return '[redacted]';
  }

  return trimmed.slice(0, 64);
}

function createCappedNameCollector(): { add: (name: string) => void; values: () => string[] } {
  const names: string[] = [];
  const seen = new Set<string>();

  return {
    add(name: string): void {
      if (names.length >= MAX_PARAM_NAMES || seen.has(name)) {
        return;
      }

      seen.add(name);
      names.push(name);
    },
    values(): string[] {
      return names;
    }
  };
}

function createEmbedQuery(overrides: Partial<NowPlayingEmbedQuery> = {}): NowPlayingEmbedQuery {
  return {
    theme: overrides.theme ?? null,
    locale: overrides.locale ?? null,
    rejectedCredentialParams: [
      ...(overrides.rejectedCredentialParams ?? EMPTY_QUERY.rejectedCredentialParams)
    ],
    ignoredParams: [...(overrides.ignoredParams ?? EMPTY_QUERY.ignoredParams)]
  };
}
