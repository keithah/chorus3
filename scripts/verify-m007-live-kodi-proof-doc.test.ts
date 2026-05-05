import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const DOC_PATH = 'docs/m007-live-kodi-install-proof.md';
const VISUAL_BASELINE_DOC = 'docs/m007-visual-parity-proof.md';
const PACKAGE_ARTIFACT_PATTERN = 'dist/kodi/webinterface.chorus3-<version>.zip';
const ACTIVE_ROOT_URL = 'http://localhost:8080/';
const PACKAGE_ROOT_URL = 'http://localhost:8080/addons/webinterface.chorus3/';

const REQUIRED_SECTIONS = [
  '## Reader and Action',
  '## Scope and Requirement Boundary',
  '## Prerequisites',
  '## Command Gates',
  '## Package Artifact',
  '## Live Kodi Availability Status',
  '## Route Matrix',
  '## Browser Diagnostics',
  '## Redaction Rules',
  '## Result Classification',
  '## Evidence Log'
] as const;

const REQUIRED_COMMAND_GATES = [
  'npm run package:kodi',
  'npm run verify:kodi-package',
  'npm run test -- scripts/verify-m007-package-browser-proof.test.ts',
  'npm run test -- scripts/verify-m007-live-kodi-proof-doc.test.ts scripts/verify-m007-visual-proof-doc.test.ts'
] as const;

const REQUIRED_ROUTE_ROWS = [
  '| Active root | `http://localhost:8080/` |',
  '| Package root | `http://localhost:8080/addons/webinterface.chorus3/` |',
  '| Package music direct route | `http://localhost:8080/addons/webinterface.chorus3/music` |',
  '| Package movies direct route | `http://localhost:8080/addons/webinterface.chorus3/movies` |',
  '| Package TV shows direct route | `http://localhost:8080/addons/webinterface.chorus3/tvshows` |',
  '| Package add-ons direct route | `http://localhost:8080/addons/webinterface.chorus3/addons/all` |',
  '| Package settings direct route | `http://localhost:8080/addons/webinterface.chorus3/settings/addons` |',
  '| Package now-playing direct route | `http://localhost:8080/addons/webinterface.chorus3/now-playing` |'
] as const;

const REQUIRED_DIAGNOSTIC_TERMS = [
  'browser console errors',
  'failed network requests',
  'asset 404',
  'route fallback',
  'visible DOM redaction scan',
  'sanitized diagnostic class'
] as const;

const REQUIRED_RESULT_TERMS = [
  'Live Kodi unavailable',
  'No-live package proof passed',
  'Live Kodi install/browser proof passed',
  'R069 remains blocked until live Kodi install/browser proof passes',
  'R073 remains satisfied only when Kodi server settings are not changed beyond normal webinterface installation, selection, and operation'
] as const;

const FORBIDDEN_PATTERNS = [
  {
    label: 'credential-bearing URL literals',
    pattern: /https?:\/\/[^\s`|)]+:[^\s`|)@]+@/i
  },
  {
    label: 'Authorization header literals',
    pattern: /\b(?:Authorization|Proxy-Authorization)\s*:/i
  },
  {
    label: 'Basic auth literal values',
    pattern: /\bBasic\s+[A-Za-z0-9+/=]{8,}/
  },
  {
    label: 'Bearer token literal values',
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/
  },
  {
    label: 'raw JSON-RPC object literals',
    pattern: /\{[^\n{}]*"jsonrpc"\s*:/i
  },
  {
    label: 'raw JSON-RPC request or response bodies',
    pattern: /\b(?:request|response|body|payload)\s*[:=]\s*\{[^\n{}]*(?:"method"|"jsonrpc")/i
  },
  {
    label: 'ignored planning or agent artifact paths',
    pattern:
      /(?:^|[\s`|])(?:\.gsd|\.planning|\.audits|\.gsd\/browser-state|\.gsd\/browser-artifacts|\.gsd\/browser-baselines)\b/i
  },
  {
    label: 'absolute local paths',
    pattern: /\/home\/[^\s`|)]+/i
  },
  {
    label: 'Kodi media path schemes',
    pattern: /\b(?:smb|nfs|special):\/\//i
  },
  {
    label: 'sentinel secret token literals',
    pattern: /\b(?:sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,})\b/i
  },
  {
    label: 'TODO or TBD placeholders',
    pattern: /\b(?:TODO|TBD)\b/i
  }
] as const;

function readTrackedFile(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Missing required tracked path ${path}: ${message}`);
  }
}

function normalizeMarkdownTablePipes(value: string): string {
  return value
    .split('\n')
    .map((line) => (line.startsWith('|') ? line.replace(/\s*\|\s*/g, '|') : line))
    .join('\n');
}

function validateM007LiveKodiProofDoc(doc: string): string[] {
  const errors: string[] = [];
  const normalizedDoc = normalizeMarkdownTablePipes(doc);

  for (const section of REQUIRED_SECTIONS) {
    if (!doc.includes(section)) {
      errors.push(`${DOC_PATH} must include ${section}.`);
    }
  }

  if (!doc.includes(VISUAL_BASELINE_DOC)) {
    errors.push(`${DOC_PATH} must link the S07 visual baseline ${VISUAL_BASELINE_DOC}.`);
  }

  if (!/visual baseline[\s\S]{0,240}not[\s\S]{0,80}live proof/i.test(doc)) {
    errors.push(`${DOC_PATH} must state the visual baseline is not live Kodi proof.`);
  }

  if (!doc.includes('R069')) {
    errors.push(`${DOC_PATH} must mention R069.`);
  }

  if (!doc.includes('R073')) {
    errors.push(`${DOC_PATH} must mention R073.`);
  }

  for (const command of REQUIRED_COMMAND_GATES) {
    if (!doc.includes(command)) {
      errors.push(`${DOC_PATH} must include command gate ${command}.`);
    }
  }

  if (!doc.includes(PACKAGE_ARTIFACT_PATTERN)) {
    errors.push(`${DOC_PATH} must include package artifact pattern ${PACKAGE_ARTIFACT_PATTERN}.`);
  }

  if (!doc.includes(`\`${ACTIVE_ROOT_URL}\``)) {
    errors.push(`${DOC_PATH} must include active root URL ${ACTIVE_ROOT_URL}.`);
  }

  if (!doc.includes(`\`${PACKAGE_ROOT_URL}\``)) {
    errors.push(`${DOC_PATH} must include package root URL ${PACKAGE_ROOT_URL}.`);
  }

  for (const routeRow of REQUIRED_ROUTE_ROWS) {
    const normalizedRouteRow = normalizeMarkdownTablePipes(routeRow);
    if (!normalizedDoc.includes(normalizedRouteRow)) {
      errors.push(`${DOC_PATH} must include route matrix row ${routeRow}.`);
    }
  }

  for (const term of REQUIRED_DIAGNOSTIC_TERMS) {
    if (!doc.includes(term)) {
      errors.push(`${DOC_PATH} must include browser diagnostic term ${term}.`);
    }
  }

  for (const term of REQUIRED_RESULT_TERMS) {
    if (!doc.includes(term)) {
      errors.push(`${DOC_PATH} must include result classification term ${term}.`);
    }
  }

  if (!/R069[\s\S]{0,180}(?:requires|only)[\s\S]{0,180}live Kodi install\/browser proof/i.test(doc)) {
    errors.push(`${DOC_PATH} must state R069 requires successful live Kodi install/browser proof.`);
  }

  if (/R069[^\n|]*(?:validated|satisfied|passed|complete)[^\n|]*(?:no-live|screenshot|unavailable)/i.test(doc)) {
    errors.push(`${DOC_PATH} must not mark R069 validated before live proof passes.`);
  }

  if (/Live Kodi unavailable[^\n|]*(?:but|and)[^\n|]*(?:validated|satisfied|passed|complete)/i.test(doc)) {
    errors.push(`${DOC_PATH} must not pair unavailable live Kodi with success wording.`);
  }

  if (!/Live Kodi unavailable[\s\S]{0,260}R069 remains blocked/i.test(doc)) {
    errors.push(`${DOC_PATH} must record unavailable live Kodi as blocked for R069.`);
  }

  if (!/No-live package proof passed[\s\S]{0,220}not[\s\S]{0,80}validate R069/i.test(doc)) {
    errors.push(`${DOC_PATH} must state no-live package proof does not validate R069.`);
  }

  if (!/R073[\s\S]{0,240}not changed beyond normal webinterface installation, selection, and operation/i.test(doc)) {
    errors.push(`${DOC_PATH} must state R073 server-setting boundary.`);
  }

  if (!normalizedDoc.includes('|Check|Status|Evidence owner|Notes|')) {
    errors.push(`${DOC_PATH} must include an evidence log table.`);
  }

  for (const { label, pattern } of FORBIDDEN_PATTERNS) {
    if (pattern.test(doc)) {
      errors.push(`${DOC_PATH} must not include ${label}.`);
    }
  }

  return errors;
}

function minimalValidDoc(): string {
  return [
    '# M007 Live Kodi Install Proof',
    REQUIRED_SECTIONS.join('\n\n'),
    `The visual baseline is ${VISUAL_BASELINE_DOC}; that visual baseline is not live proof.`,
    'R069 requires successful live Kodi install/browser proof. R069 remains blocked until live Kodi install/browser proof passes.',
    'R073 remains satisfied only when Kodi server settings are not changed beyond normal webinterface installation, selection, and operation.',
    REQUIRED_COMMAND_GATES.join('\n'),
    PACKAGE_ARTIFACT_PATTERN,
    `\`${ACTIVE_ROOT_URL}\``,
    `\`${PACKAGE_ROOT_URL}\``,
    REQUIRED_ROUTE_ROWS.join('\n'),
    REQUIRED_DIAGNOSTIC_TERMS.join('\n'),
    REQUIRED_RESULT_TERMS.join('\n'),
    'Live Kodi unavailable means R069 remains blocked until a live browser run passes.',
    'No-live package proof passed is useful but does not validate R069.',
    '| Check | Status | Evidence owner | Notes |',
    '| Proof document contract | Pass | T04 | Required live proof boundaries are present. |'
  ].join('\n\n');
}

describe('M007 live Kodi install proof documentation contract', () => {
  it('keeps the tracked proof document available', () => {
    expect(() => readTrackedFile(DOC_PATH)).not.toThrow();
  });

  it('lists required sections, URLs, commands, routes, diagnostics, evidence, and boundaries', () => {
    const doc = readTrackedFile(DOC_PATH);

    expect(validateM007LiveKodiProofDoc(doc)).toEqual([]);
  });

  it('accepts the minimal required live proof boundary language', () => {
    expect(validateM007LiveKodiProofDoc(minimalValidDoc())).toEqual([]);
  });

  it('rejects missing route rows, live URLs, and unavailable-live status', () => {
    const errors = validateM007LiveKodiProofDoc(
      minimalValidDoc()
        .replace(REQUIRED_ROUTE_ROWS[0], '')
        .replace(ACTIVE_ROOT_URL, '')
        .split('Live Kodi unavailable')
        .join('Live Kodi skipped')
    ).join('\n');

    expect(errors).toContain(`${DOC_PATH} must include route matrix row ${REQUIRED_ROUTE_ROWS[0]}.`);
    expect(errors).toContain(`${DOC_PATH} must include active root URL ${ACTIVE_ROOT_URL}.`);
    expect(errors).toContain(`${DOC_PATH} must include result classification term Live Kodi unavailable.`);
  });

  it('rejects success wording when live Kodi is unavailable or R069 is marked validated', () => {
    const badDoc = minimalValidDoc()
      .replace('R069 remains blocked until live Kodi install/browser proof passes.', 'R069 validated by no-live proof.')
      .replace('Live Kodi unavailable means R069 remains blocked until a live browser run passes.', 'Live Kodi unavailable but R069 passed.');

    const errors = validateM007LiveKodiProofDoc(badDoc).join('\n');

    expect(errors).toContain(`${DOC_PATH} must not mark R069 validated before live proof passes.`);
    expect(errors).toContain(`${DOC_PATH} must not pair unavailable live Kodi with success wording.`);
  });

  it('rejects forbidden secret, raw transport, ignored-artifact, path, media-scheme, and placeholder content', () => {
    const badDoc = [
      minimalValidDoc(),
      'Authorization: redacted',
      'Basic abcdefghi',
      'Bearer abcdefghi',
      '{"jsonrpc":"2.0"}',
      '.gsd/browser-state/example.json',
      '/home/example/local-proof.png',
      'special://profile/addon_data',
      'TODO'
    ].join('\n');

    const errors = validateM007LiveKodiProofDoc(badDoc).join('\n');

    expect(errors).toContain(`${DOC_PATH} must not include Authorization header literals.`);
    expect(errors).toContain(`${DOC_PATH} must not include Basic auth literal values.`);
    expect(errors).toContain(`${DOC_PATH} must not include Bearer token literal values.`);
    expect(errors).toContain(`${DOC_PATH} must not include raw JSON-RPC object literals.`);
    expect(errors).toContain(`${DOC_PATH} must not include ignored planning or agent artifact paths.`);
    expect(errors).toContain(`${DOC_PATH} must not include absolute local paths.`);
    expect(errors).toContain(`${DOC_PATH} must not include Kodi media path schemes.`);
    expect(errors).toContain(`${DOC_PATH} must not include TODO or TBD placeholders.`);
  });
});
