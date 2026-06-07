import { DEFAULT_LOCALE, type Locale } from './localeCore';
import { EN_DICTIONARY } from './locales/en';
import { createTranslationContextFromDictionary, type TranslationContext } from './translationCore';

type RuntimeTranslationContext = TranslationContext<Locale>;
type LazyTranslationLocale = Exclude<Locale, typeof DEFAULT_LOCALE>;
type TranslationDictionary = Record<string, string>;
type LazyTranslationLoader = () => Promise<TranslationDictionary>;

const LAZY_TRANSLATION_LOADERS = {
  de: async () => {
    const module = await import('./locales/de');
    return module.DE_DICTIONARY;
  }
} satisfies Record<LazyTranslationLocale, LazyTranslationLoader>;

const loadedDictionaries: Partial<Record<Locale, TranslationDictionary>> = {
  en: EN_DICTIONARY
};

const pendingDictionaries = new Map<Locale, Promise<void>>();

export function getLoadedTranslationDictionary(locale: Locale): TranslationDictionary {
  return loadedDictionaries[locale] ?? loadedDictionaries[DEFAULT_LOCALE]!;
}

export function createRuntimeTranslationContext(
  locale: Locale,
  dictionary = getLoadedTranslationDictionary(locale)
): RuntimeTranslationContext {
  return createTranslationContextFromDictionary(locale, dictionary);
}

export function createEnglishTranslationContext(): RuntimeTranslationContext {
  return createRuntimeTranslationContext(DEFAULT_LOCALE);
}

export function preloadTranslationLocale(locale: Locale): Promise<boolean> {
  if (loadedDictionaries[locale]) {
    return Promise.resolve(false);
  }

  const pending =
    pendingDictionaries.get(locale) ??
    loadTranslationLocale(locale).finally(() => {
      pendingDictionaries.delete(locale);
    });

  pendingDictionaries.set(locale, pending);
  return pending.then(() => true);
}

async function loadTranslationLocale(locale: Locale): Promise<void> {
  if (locale === DEFAULT_LOCALE) {
    return;
  }

  loadedDictionaries[locale] = await LAZY_TRANSLATION_LOADERS[locale]();
}
