import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_DOC_PATH, validateKodiPackageDocs } from './verify-kodi-package.mjs';

const testRoots: string[] = [];

function createFixture(files: Record<string, string>): string {
  const root = join(tmpdir(), `chorus3-kodi-docs-${randomUUID()}`);
  testRoots.push(root);

  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  return root;
}

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('Kodi package UAT documentation', () => {
  it('validates the tracked package UAT doc required by package verification', () => {
    const result = validateKodiPackageDocs();

    expect(result.ok).toBe(true);
    expect(result.lines).toContain(
      '[docs] docs/m005-kodi-package-uat.md links package and now-playing UAT without credential examples.'
    );
  });

  it('rejects missing required package commands, artifact path, and now-playing UAT link', () => {
    const root = createFixture({
      [DEFAULT_DOC_PATH]: '# M005 Kodi package UAT\n\nThis doc is intentionally incomplete.'
    });

    const result = validateKodiPackageDocs({ root });

    expect(result.ok).toBe(false);
    expect(result.lines).toContain(
      `[docs] ${DEFAULT_DOC_PATH} must link docs/m005-now-playing-uat.md.`
    );
    expect(result.lines).toContain(`[docs] ${DEFAULT_DOC_PATH} must link npm run verify.`);
    expect(result.lines).toContain(`[docs] ${DEFAULT_DOC_PATH} must link npm run package:kodi.`);
    expect(result.lines).toContain(
      `[docs] ${DEFAULT_DOC_PATH} must link npm run verify:kodi-package.`
    );
    expect(result.lines).toContain(
      `[docs] ${DEFAULT_DOC_PATH} must link dist/kodi/webinterface.chorus3-<version>.zip.`
    );
  });

  it('rejects credential-bearing URL and query examples without echoing secret-like values', () => {
    const root = createFixture({
      [DEFAULT_DOC_PATH]: [
        '# M005 Kodi package UAT',
        'Run `npm run verify`, `npm run package:kodi`, and `npm run verify:kodi-package`.',
        'The zip is `dist/kodi/webinterface.chorus3-<version>.zip`.',
        'See docs/m005-now-playing-uat.md for packaged /now-playing checks.',
        'Bad examples: username=alice password=hunter2 token=abc http://user:pass@kodi.local Authorization Basic abc'
      ].join('\n')
    });

    const result = validateKodiPackageDocs({ root });
    const output = result.lines.join('\n');

    expect(result.ok).toBe(false);
    expect(output).toContain(
      `[docs] ${DEFAULT_DOC_PATH} contains forbidden credential-bearing example.`
    );
    expect(output).not.toContain('hunter2');
    expect(output).not.toContain('user:pass');
    expect(output).not.toContain('abc');
  });
});
