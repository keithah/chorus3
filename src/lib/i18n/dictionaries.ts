import { DE_DICTIONARY } from './locales/de';
import { EN_DICTIONARY } from './locales/en';

export const LOCALES = ['en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const DICTIONARIES = {
  en: EN_DICTIONARY,
  de: DE_DICTIONARY
} as const satisfies Record<Locale, Record<string, string>>;

export type Dictionary = (typeof DICTIONARIES)[typeof DEFAULT_LOCALE];
export type TranslationKey = keyof Dictionary;
