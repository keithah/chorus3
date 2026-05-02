import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  renderParityReport,
  runChorus2ParityVerification,
  validateParityLedger
} from './verify-chorus2-parity.mjs';

const tempRoots: string[] = [];

const discovered = [
  {
    id: 'route:shell:root',
    kind: 'route',
    family: 'shell',
    surface: '/',
    evidence: ['src/router.coffee:1']
  },
  {
    id: 'jsonrpc:input:left',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.Left',
    evidence: ['src/remote.coffee:2']
  }
] as const;

const baseLedger = [
  {
    id: 'route:shell:root',
    kind: 'route',
    family: 'shell',
    surface: '/',
    status: 'implemented',
    owner: 'M006/S01',
    evidence: ['src/lib/app/appRouter.ts'],
    notes: 'Static shell route proof.'
  },
  {
    id: 'jsonrpc:input:left',
    kind: 'jsonrpc',
    family: 'input',
    surface: 'Input.Left',
    status: 'missing',
    owner: 'M006/S03',
    evidence: ['scripts/scan-chorus2-parity.mjs']
  }
] as const;

function createTempPath(path: string): string {
  const root = join(tmpdir(), `chorus3-parity-verify-${randomUUID()}`);
  tempRoots.push(root);
  return join(root, path);
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('validateParityLedger', () => {
  it('accepts mapped, valid, safe ledger rows', () => {
    expect(validateParityLedger({ discovered, ledger: baseLedger })).toEqual({ diagnostics: [] });
  });

  it('fails with a capped [ledger] diagnostic when a discovered scan id is unmapped', () => {
    const ledger = baseLedger.filter((row) => row.id !== 'jsonrpc:input:left');

    expect(validateParityLedger({ discovered, ledger }).diagnostics).toEqual([
      '[ledger] unmapped 1 id(s): jsonrpc:input:left'
    ]);
  });

  it('rejects duplicate ids, invalid status values, missing owners, absolute evidence, ignored evidence, and unsafe text', () => {
    const unsafeLedger = [
      baseLedger[0],
      { ...baseLedger[0], owner: '' },
      { ...baseLedger[1], status: 'unknown', evidence: ['/home/user/project/file.ts'] },
      {
        ...baseLedger[1],
        id: 'jsonrpc:input:up',
        evidence: ['.gsd/private.md'],
        notes: 'token=secret'
      }
    ];

    expect(validateParityLedger({ discovered, ledger: unsafeLedger }).diagnostics).toEqual([
      '[ledger] duplicate 1 id(s): route:shell:root',
      '[ledger] invalid status for jsonrpc:input:left',
      '[ledger] missing owner for route:shell:root',
      '[safety] unsafe evidence for jsonrpc:input:left',
      '[safety] unsafe evidence for jsonrpc:input:up',
      '[safety] unsafe report text for jsonrpc:input:up'
    ]);
  });
});

describe('renderParityReport', () => {
  it('renders deterministic grouped markdown from ledger rows without unsafe text', () => {
    const report = renderParityReport(baseLedger);

    expect(report).toContain('# M006 Chorus2 Parity Ledger');
    expect(report).toContain('Generated from `CHORUS2_PARITY_LEDGER`; do not edit by hand.');
    expect(report).toContain(
      'S01 proof is static source comparison only; no live Kodi calls are performed.'
    );
    expect(report).toContain(
      'Later slices own route aliases, Remote/Input, media alias bridges, packaged shell proof, and closeout.'
    );
    expect(report).toContain('| kind | implemented | missing | deferred | out-of-scope | total |');
    expect(report).toContain('## Family: input');
    expect(report).toContain(
      '| `jsonrpc:input:left` | jsonrpc | `Input.Left` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |'
    );
    expect(report).not.toMatch(
      /Authorization|Basic\b|token=|password=|localStorage|sessionStorage|https?:\/\/[^\s/]+:[^\s/]+@|(?:^|\s)\/(?:home|Users|tmp)\//u
    );
  });
});

describe('runChorus2ParityVerification', () => {
  it('detects stale report contents unless write mode updates the file', async () => {
    const reportPath = createTempPath('docs/m006-chorus2-parity.md');
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, 'stale report\n');

    await expect(
      runChorus2ParityVerification({
        discovered,
        ledger: baseLedger,
        reportPath,
        root: 'unused-fixture-root',
        write: false
      })
    ).rejects.toThrow(
      '[report] docs/m006-chorus2-parity.md is out of date; run node scripts/verify-chorus2-parity.mjs --write'
    );

    await expect(
      runChorus2ParityVerification({
        discovered,
        ledger: baseLedger,
        reportPath,
        root: 'unused-fixture-root',
        write: true
      })
    ).resolves.toMatchObject({ reportPath, wrote: true });

    expect(readFileSync(reportPath, 'utf8')).toBe(renderParityReport(baseLedger));
  });
});
