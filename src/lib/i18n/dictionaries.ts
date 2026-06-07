import { DE_DICTIONARY } from './locales/de';
import { EN_DICTIONARY } from './locales/en';
import { DEFAULT_LOCALE, type Locale } from './localeCore';

export { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './localeCore';

export const DICTIONARIES = {
  en: EN_DICTIONARY,
  de: DE_DICTIONARY
} as const satisfies Record<Locale, Record<string, string>>;

export type Dictionary = (typeof DICTIONARIES)[typeof DEFAULT_LOCALE];
export type TranslationKey = keyof Dictionary;
