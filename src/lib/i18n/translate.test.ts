import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  createTranslationContext,
  getPlaceholders,
  isLocale,
  translate,
  validateDictionaryParity,
  type DictionaryByLocale
} from './translate';

describe('i18n translation primitives', () => {
  it('validates supported locale ids and rejects unknown values', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it('translates flat dictionary keys with deterministic interpolation', () => {
    expect(translate('settings.title', { locale: 'en' })).toBe('Settings');
    expect(translate('settings.title', { locale: 'de' })).toBe('Einstellungen');
    expect(
      translate('app.status.connectedTo', {
        locale: 'en',
        params: { host: 'Living Room' }
      })
    ).toBe('Connected to Living Room');
  });

  it('leaves unresolved placeholders visible when params are missing', () => {
    expect(translate('app.status.connectedTo', { locale: 'en' })).toBe('Connected to {host}');
  });

  it('returns a visible missing-key diagnostic for unknown keys', () => {
    expect(translate('settings.missing' as never, { locale: 'en' })).toBe(
      '[missing translation: settings.missing]'
    );
  });

  it('creates a translation context bound to the requested locale', () => {
    const context = createTranslationContext('de');

    expect(context.locale).toBe('de');
    expect(context.t('settings.title')).toBe('Einstellungen');
    expect(context.snapshot).toEqual({ locale: 'de' });
  });

  it('extracts placeholder names once per translated value', () => {
    expect(getPlaceholders('Hello {name}, {name}! {count} items.')).toEqual(['name', 'count']);
  });

  it('reports missing keys, extra keys, blank values, and placeholder mismatches', () => {
    const dictionaries: DictionaryByLocale<'en' | 'de'> = {
      en: {
        'example.greeting': 'Hello {name}',
        'example.blank': 'Blank fallback',
        'example.extraBase': 'Only English'
      },
      de: {
        'example.greeting': 'Hallo {person}',
        'example.blank': '',
        'example.extraGerman': 'Nur Deutsch'
      }
    };

    expect(validateDictionaryParity(dictionaries, 'en')).toEqual([
      {
        type: 'missing-key',
        locale: 'de',
        key: 'example.extraBase',
        message: 'de is missing translation key example.extraBase'
      },
      {
        type: 'extra-key',
        locale: 'de',
        key: 'example.extraGerman',
        message: 'de has extra translation key example.extraGerman'
      },
      {
        type: 'blank-value',
        locale: 'de',
        key: 'example.blank',
        message: 'de translation example.blank is blank'
      },
      {
        type: 'placeholder-mismatch',
        locale: 'de',
        key: 'example.greeting',
        expected: ['name'],
        actual: ['person'],
        message:
          'de translation example.greeting placeholders differ: expected {name}; found {person}'
      }
    ]);
  });
});
