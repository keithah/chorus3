import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  LOCALES,
  type Locale,
  type TranslationKey
} from './dictionaries';

export { DEFAULT_LOCALE, DICTIONARIES, LOCALES, type Locale, type TranslationKey };

export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export interface TranslateOptions {
  locale: Locale;
  params?: TranslationParams;
}

export interface TranslationContext {
  locale: Locale;
  t: (key: TranslationKey | string, params?: TranslationParams) => string;
  snapshot: TranslationContextSnapshot;
}

export interface TranslationContextSnapshot {
  locale: Locale;
}

export type DictionaryByLocale<TLocale extends string = Locale> = Record<
  TLocale,
  Record<string, string>
>;

export type DictionaryParityIssue =
  | {
      type: 'missing-key' | 'extra-key' | 'blank-value';
      locale: string;
      key: string;
      message: string;
    }
  | {
      type: 'placeholder-mismatch';
      locale: string;
      key: string;
      expected: string[];
      actual: string[];
      message: string;
    };

const PLACEHOLDER_PATTERN = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function translate(key: TranslationKey | string, options: TranslateOptions): string {
  const dictionary = DICTIONARIES[options.locale] as Record<string, string>;
  const value = dictionary[key];

  if (value === undefined) {
    return `[missing translation: ${key}]`;
  }

  return interpolate(value, options.params ?? {});
}

export function createTranslationContext(locale: Locale): TranslationContext {
  return {
    locale,
    t: (key, params) => translate(key, { locale, params }),
    get snapshot() {
      return { locale };
    }
  };
}

export function getPlaceholders(value: string): string[] {
  const placeholders: string[] = [];
  PLACEHOLDER_PATTERN.lastIndex = 0;

  for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
    const placeholder = match[1];

    if (!placeholders.includes(placeholder)) {
      placeholders.push(placeholder);
    }
  }

  return placeholders;
}

export function validateDictionaryParity<TLocale extends string>(
  dictionaries: DictionaryByLocale<TLocale>,
  baseLocale: TLocale
): DictionaryParityIssue[] {
  const baseDictionary = dictionaries[baseLocale];
  const baseKeys = Object.keys(baseDictionary).sort();
  const issues: DictionaryParityIssue[] = [];

  for (const [locale, dictionary] of Object.entries(dictionaries) as Array<
    [TLocale, Record<string, string>]
  >) {
    if (locale === baseLocale) {
      issues.push(...findBlankValues(locale, dictionary));
      continue;
    }

    const keys = Object.keys(dictionary).sort();
    const missingKeys = baseKeys.filter((key) => !Object.hasOwn(dictionary, key));
    const extraKeys = keys.filter((key) => !Object.hasOwn(baseDictionary, key));

    for (const key of missingKeys) {
      issues.push({
        type: 'missing-key',
        locale,
        key,
        message: `${locale} is missing translation key ${key}`
      });
    }

    for (const key of extraKeys) {
      issues.push({
        type: 'extra-key',
        locale,
        key,
        message: `${locale} has extra translation key ${key}`
      });
    }

    issues.push(...findBlankValues(locale, dictionary));

    for (const key of baseKeys) {
      if (!Object.hasOwn(dictionary, key)) {
        continue;
      }

      const expected = getPlaceholders(baseDictionary[key]);
      const actual = getPlaceholders(dictionary[key]);

      if (!sameStringSet(expected, actual)) {
        issues.push({
          type: 'placeholder-mismatch',
          locale,
          key,
          expected,
          actual,
          message: `${locale} translation ${key} placeholders differ: expected ${formatPlaceholderList(
            expected
          )}; found ${formatPlaceholderList(actual)}`
        });
      }
    }
  }

  return issues;
}

function interpolate(value: string, params: TranslationParams): string {
  return value.replace(PLACEHOLDER_PATTERN, (match, name: string) => {
    const paramValue = params[name];

    return paramValue === undefined || paramValue === null ? match : String(paramValue);
  });
}

function findBlankValues(
  locale: string,
  dictionary: Record<string, string>
): DictionaryParityIssue[] {
  return Object.entries(dictionary).flatMap(([key, value]) =>
    value.trim() === ''
      ? [
          {
            type: 'blank-value' as const,
            locale,
            key,
            message: `${locale} translation ${key} is blank`
          }
        ]
      : []
  );
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function formatPlaceholderList(placeholders: string[]): string {
  return placeholders.length > 0
    ? placeholders.map((placeholder) => `{${placeholder}}`).join(', ')
    : '(none)';
}
