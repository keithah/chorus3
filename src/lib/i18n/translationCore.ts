export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export interface TranslationContext<TLocale extends string = string> {
  locale: TLocale;
  t: (key: string, params?: TranslationParams) => string;
  snapshot: TranslationContextSnapshot<TLocale>;
}

export interface TranslationContextSnapshot<TLocale extends string = string> {
  locale: TLocale;
}

export function translateFromDictionary(
  dictionary: Record<string, string>,
  key: string,
  params?: TranslationParams
): string {
  const value = dictionary[key];

  if (value === undefined) {
    return `[missing translation: ${key}]`;
  }

  return interpolateTranslation(value, params ?? {});
}

export function createTranslationContextFromDictionary<TLocale extends string>(
  locale: TLocale,
  dictionary: Record<string, string>
): TranslationContext<TLocale> {
  return {
    locale,
    t: (key, params) => translateFromDictionary(dictionary, key, params),
    get snapshot() {
      return { locale };
    }
  };
}

function interpolateTranslation(value: string, params: TranslationParams): string {
  return value.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, name: string) => {
    const replacement = params[name];
    return replacement === undefined || replacement === null ? match : String(replacement);
  });
}
