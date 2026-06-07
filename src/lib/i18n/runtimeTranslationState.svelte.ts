import type { Locale } from './localeCore';
import {
  createRuntimeTranslationContext,
  getLoadedTranslationDictionary,
  preloadTranslationLocale
} from './runtimeTranslationContext';
import type { TranslationContext } from './translationCore';

type RuntimeTranslationContext = TranslationContext<Locale>;

export interface RuntimeTranslationState {
  readonly context: RuntimeTranslationContext;
}

export function createRuntimeTranslationState(readLocale: () => Locale): RuntimeTranslationState {
  let currentDictionary = $state<Record<string, string> | null>(null);
  const context = $derived.by(() => {
    const locale = readLocale();
    return createRuntimeTranslationContext(
      locale,
      currentDictionary ?? getLoadedTranslationDictionary(locale)
    );
  });

  $effect(() => {
    const locale = readLocale();
    currentDictionary = getLoadedTranslationDictionary(locale);

    void preloadTranslationLocale(locale).then((loaded) => {
      if (loaded && readLocale() === locale) {
        currentDictionary = getLoadedTranslationDictionary(locale);
      }
    });
  });

  return {
    get context() {
      return context;
    }
  };
}
