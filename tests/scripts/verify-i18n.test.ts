import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runI18nVerification } from '../../scripts/verify-i18n.mjs';

const testRoots: string[] = [];

function createFixture(files: Record<string, string>): string {
  const root = join(tmpdir(), `chorus3-i18n-${randomUUID()}`);
  testRoots.push(root);

  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  return root;
}

function dictionarySource(): string {
  return [
    `import { DE_DICTIONARY } from './locales/de';`,
    `import { EN_DICTIONARY } from './locales/en';`,
    ``,
    `export const DICTIONARIES = {`,
    `  en: EN_DICTIONARY,`,
    `  de: DE_DICTIONARY`,
    `} as const;`,
    ``
  ].join('\n');
}

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('i18n verification diagnostics', () => {
  it('reports dictionary parity, placeholders, and blank values with file/key diagnostics', () => {
    const root = createFixture({
      'src/lib/i18n/dictionaries.ts': dictionarySource(),
      'src/lib/i18n/locales/en.ts': `export const EN_DICTIONARY = {
          'example.greeting': 'Hello {name}',
          'example.blank': 'Fallback',
          'example.onlyEnglish': 'Only English'
        } as const;`,
      'src/lib/i18n/locales/de.ts': `export const DE_DICTIONARY = {
          'example.greeting': 'Hallo {person}',
          'example.blank': '',
          'example.onlyGerman': 'Nur Deutsch'
        } as const;`,
      'src/App.svelte': '<main>{i18n.t("app.title")}</main>'
    });

    expect(runI18nVerification(root)).toEqual({
      ok: false,
      lines: [
        'Dictionary parity problems were found:',
        expect.stringMatching(
          /^src\/lib\/i18n\/dictionaries\.ts:\d+ key=example\.onlyEnglish locale=de missing-key /u
        ),
        expect.stringMatching(
          /^src\/lib\/i18n\/dictionaries\.ts:\d+ key=example\.onlyGerman locale=de extra-key /u
        ),
        expect.stringMatching(
          /^src\/lib\/i18n\/dictionaries\.ts:\d+ key=example\.blank locale=de blank-value /u
        ),
        expect.stringMatching(
          /^src\/lib\/i18n\/dictionaries\.ts:\d+ key=example\.greeting locale=de placeholder-mismatch /u
        )
      ]
    });
  });

  it('reports unapproved hardcoded visible copy with concise file and line diagnostics', () => {
    const root = createFixture({
      'src/lib/i18n/dictionaries.ts': dictionarySource(),
      'src/lib/i18n/locales/en.ts': `export const EN_DICTIONARY = { 'app.title': 'chorus3' } as const;`,
      'src/lib/i18n/locales/de.ts': `export const DE_DICTIONARY = { 'app.title': 'chorus3' } as const;`,
      'src/lib/components/Nested/UnsafePanel.svelte':
        '<section title="Unsafe Title">Visible unsafe copy</section>'
    });

    expect(runI18nVerification(root)).toEqual({
      ok: false,
      lines: [
        'Unapproved visible hardcoded strings were found:',
        'src/lib/components/Nested/UnsafePanel.svelte:1 text-node "Visible unsafe copy"',
        'src/lib/components/Nested/UnsafePanel.svelte:1 visible-attribute "Unsafe Title"'
      ]
    });
  });

  it('rejects inline dictionaries so locale files stay the canonical boundary', () => {
    const root = createFixture({
      'src/lib/i18n/dictionaries.ts': `export const DICTIONARIES = {
        en: { 'app.title': 'chorus3' },
        de: { 'app.title': 'chorus3' }
      } as const;`
    });

    expect(() => runI18nVerification(root)).toThrow(
      /DICTIONARIES locale en must reference an imported dictionary identifier/u
    );
  });
});
