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

function dictionarySource(source: string): string {
  return `export const DICTIONARIES = ${source} as const;\n`;
}

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('i18n verification diagnostics', () => {
  it('reports dictionary parity, placeholders, and blank values with file/key diagnostics', () => {
    const root = createFixture({
      'src/lib/i18n/dictionaries.ts': dictionarySource(`{
        en: {
          'example.greeting': 'Hello {name}',
          'example.blank': 'Fallback',
          'example.onlyEnglish': 'Only English'
        },
        de: {
          'example.greeting': 'Hallo {person}',
          'example.blank': '',
          'example.onlyGerman': 'Nur Deutsch'
        }
      }`),
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
      'src/lib/i18n/dictionaries.ts': dictionarySource(`{
        en: { 'app.title': 'chorus3' },
        de: { 'app.title': 'chorus3' }
      }`),
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
});
