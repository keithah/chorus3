import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n/localeCore';

export { DEFAULT_LOCALE, type Locale };

export const LOCALE_STORAGE_KEY = 'chorus3.locale';

export type LocaleStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface LocaleStoreOptions {
  storage?: LocaleStorage | null;
}

export interface LocaleStoreSnapshot {
  locale: Locale;
}

export type LocaleMutationResult = { ok: true; locale: Locale } | { ok: false; locale: Locale };

export class LocaleStore {
  locale = $state<Locale>(DEFAULT_LOCALE);

  readonly #storage: LocaleStorage | null;

  constructor(options: LocaleStoreOptions = {}) {
    this.#storage = options.storage ?? null;
    this.#load();
  }

  get snapshot(): LocaleStoreSnapshot {
    return { locale: this.locale };
  }

  setLocale(locale: unknown): LocaleMutationResult {
    if (!isLocale(locale)) {
      return { ok: false, locale: this.locale };
    }

    this.locale = locale;
    this.#persist();

    return { ok: true, locale: this.locale };
  }

  toggleLocale(): Locale {
    const nextLocale: Locale = this.locale === 'en' ? 'de' : 'en';
    this.locale = nextLocale;
    this.#persist();

    return this.locale;
  }

  #load(): void {
    if (!this.#storage) {
      return;
    }

    try {
      const storedLocale = this.#storage.getItem(LOCALE_STORAGE_KEY);
      this.locale = isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
    } catch {
      this.locale = DEFAULT_LOCALE;
    }
  }

  #persist(): void {
    if (!this.#storage) {
      return;
    }

    try {
      this.#storage.setItem(LOCALE_STORAGE_KEY, this.locale);
    } catch {
      // Storage can be disabled or quota-limited. The in-memory locale remains authoritative.
    }
  }
}

export function createLocaleStore(options: LocaleStoreOptions = {}): LocaleStore {
  return new LocaleStore(options);
}

export const localeStore = createLocaleStore({
  storage: typeof localStorage === 'undefined' ? null : localStorage
});
