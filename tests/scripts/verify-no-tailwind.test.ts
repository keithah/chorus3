import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  runNoTailwindVerification,
  scanForTailwindReferences
} from '../../scripts/verify-no-tailwind.mjs';

const testRoots: string[] = [];

function createFixture(files: Record<string, string>): string {
  const root = join(tmpdir(), `chorus3-no-tailwind-${randomUUID()}`);
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

describe('no-Tailwind verification', () => {
  it('ignores historical roadmap references outside the scoped targets', () => {
    const root = createFixture({
      'package.json': JSON.stringify({ scripts: { build: 'vite build' } }),
      'src/App.svelte': '<h1>chorus3</h1>',
      'chorus3-roadmap.md': 'Historical note mentions tailwind but is not shipped app config.'
    });

    expect(scanForTailwindReferences({ root })).toEqual([]);
    expect(runNoTailwindVerification(root).ok).toBe(true);
  });

  it('flags Tailwind package/config/directive references inside app and config paths', () => {
    const root = createFixture({
      'package.json': JSON.stringify({ devDependencies: { tailwindcss: '^4.0.0' } }, null, 2),
      'src/app.css': '@tailwind base;'
    });

    expect(runNoTailwindVerification(root)).toEqual({
      ok: false,
      lines: [
        'Tailwind/PostCSS references were found in app/config/source/CI paths:',
        expect.stringContaining('package.json'),
        expect.stringContaining('src/app.css')
      ]
    });
  });
});
