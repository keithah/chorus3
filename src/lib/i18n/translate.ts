import { DEFAULT_LOCALE, DICTIONARIES, type Locale, type TranslationKey } from './dictionaries';
import { isLocale, LOCALES } from './localeCore';
import {
  createTranslationContextFromDictionary,
  translateFromDictionary,
  type TranslationContext as CoreTranslationContext,
  type TranslationContextSnapshot as CoreTranslationContextSnapshot,
  type TranslationParams
} from './translationCore';

export { DEFAULT_LOCALE, DICTIONARIES, isLocale, LOCALES, type Locale, type TranslationKey };
export type TranslationContext = CoreTranslationContext<Locale>;
export type TranslationContextSnapshot = CoreTranslationContextSnapshot<Locale>;
export type { TranslationParams };

export interface TranslateOptions {
  locale: Locale;
  params?: TranslationParams;
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

export function translate(key: TranslationKey | string, options: TranslateOptions): string {
  const dictionary = DICTIONARIES[options.locale] as Record<string, string>;
  return translateFromDictionary(dictionary, key, options.params);
}

export function createTranslationContext(locale: Locale): TranslationContext {
  return createTranslationContextFromDictionary(locale, DICTIONARIES[locale]);
}

export function getPlaceholders(value: string): string[] {
  const placeholders: string[] = [];
  const seen = new Set<string>();
  PLACEHOLDER_PATTERN.lastIndex = 0;

  for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
    const placeholder = match[1];

    if (!seen.has(placeholder)) {
      seen.add(placeholder);
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
  const basePlaceholdersByKey = new Map(
    baseKeys.map((key) => [key, getPlaceholders(baseDictionary[key])] as const)
  );
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

      const expected = basePlaceholdersByKey.get(key) ?? [];
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
  if (left.length !== right.length) {
    return false;
  }

  const rightValues = new Set(right);
  return left.every((value) => rightValues.has(value));
}

function formatPlaceholderList(placeholders: string[]): string {
  return placeholders.length > 0
    ? placeholders.map((placeholder) => `{${placeholder}}`).join(', ')
    : '(none)';
}
