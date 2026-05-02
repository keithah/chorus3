import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const DOC_PATH = 'docs/m006-final-proof.md';
const REQUIRED_TRACKED_PATHS = [
  DOC_PATH,
  'docs/m006-packaged-shell-proof.md',
  'docs/m006-chorus2-parity.md',
  '.gsd/REQUIREMENTS.md',
  'package.json'
] as const;

const REQUIRED_SECTIONS = [
  '## Scope',
  '## Requirements Cross-Reference',
  '## Ledger and Route Truthfulness',
  '## Remote/Input Proof',
  '## Package Shell Proof',
  '## Responsive Browser Matrix',
  '## Command Verification',
  '## Browser Diagnostics',
  '## Visible-DOM Redaction Scan Categories',
  '## Evidence Log',
  '## Live Kodi Gap Note'
] as const;

const REQUIRED_ROUTES = [
  '/addons/webinterface.chorus3/',
  '/addons/webinterface.chorus3/remote',
  '/addons/webinterface.chorus3/help'
] as const;

const REQUIRED_COMMANDS = [
  'npm run test -- scripts/verify-m006-final-proof-doc.test.ts',
  'npm run verify:chorus2-parity',
  'npm run verify:kodi-package'
] as const;

const REQUIRED_REQUIREMENTS = [
  'R025',
  'R047',
  'R048',
  'R049',
  'R050',
  'R051',
  'R052',
  'R053',
  'R058',
  'R061'
] as const;

const REQUIRED_COVERAGE_TERMS = [
  'no horizontal overflow',
  'reachable primary navigation',
  'Remote real panel',
  'owner-labeled placeholder',
  'parity ledger',
  'package verifier',
  'console/network diagnostics',
  'category-level redaction'
] as const;

const REQUIRED_REDACTION_CATEGORIES = [
  'credential-bearing endpoint shapes',
  'auth header values',
  'browser storage internals',
  'raw JSON-RPC request/response/body/payload data',
  'SMB/special paths',
  'sentinel token values'
] as const;

const FORBIDDEN_LITERAL_PATTERNS = [
  {
    label: 'credential-bearing URL literals',
    pattern: /https?:\/\/[^\s`|)]+:[^\s`|)@]+@/i
  },
  {
    label: 'auth header literals',
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
    label: 'browser storage object internals',
    pattern: /\b(?:localStorage|sessionStorage)\s*[\[.]/
  },
  {
    label: 'raw JSON-RPC object literals',
    pattern: /\{[^\n{}]*"jsonrpc"\s*:/i
  },
  {
    label: 'raw JSON-RPC request body labels',
    pattern: /\b(?:request|response|body|payload)\s*[:=]\s*\{[^\n{}]*(?:"method"|"jsonrpc")/i
  },
  {
    label: 'SMB path literals',
    pattern: /\bsmb:\/\//i
  },
  {
    label: 'Kodi special path literals',
    pattern: /\bspecial:\/\//i
  },
  {
    label: 'sentinel secret token literals',
    pattern: /\b(?:sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,})\b/i
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

describe('M006 final proof documentation contract', () => {
  it('keeps all tracked proof inputs available with clear missing-path diagnostics', () => {
    for (const path of REQUIRED_TRACKED_PATHS) {
      expect(() => readTrackedFile(path)).not.toThrow();
    }
  });

  it('lists required sections, routes, commands, requirements, diagnostics, and redaction categories', () => {
    const doc = readTrackedFile(DOC_PATH);

    for (const section of REQUIRED_SECTIONS) {
      expect(doc, `${DOC_PATH} must include ${section}.`).toContain(section);
    }

    for (const route of REQUIRED_ROUTES) {
      expect(doc, `${DOC_PATH} must include route ${route}.`).toContain(route);
    }

    for (const command of REQUIRED_COMMANDS) {
      expect(doc, `${DOC_PATH} must include command ${command}.`).toContain(command);
    }

    for (const requirementId of REQUIRED_REQUIREMENTS) {
      expect(doc, `${DOC_PATH} must include requirement ${requirementId}.`).toContain(requirementId);
    }

    for (const term of REQUIRED_COVERAGE_TERMS) {
      expect(doc, `${DOC_PATH} must include coverage term ${term}.`).toContain(term);
    }

    for (const category of REQUIRED_REDACTION_CATEGORIES) {
      expect(doc, `${DOC_PATH} must include redaction category ${category}.`).toContain(category);
    }
  });

  it('does not leave unresolved placeholders or unsafe literal evidence', () => {
    const doc = readTrackedFile(DOC_PATH);

    expect(doc, `${DOC_PATH} must not leave TODO placeholders.`).not.toMatch(/\bTODO\b/i);
    expect(doc, `${DOC_PATH} must not leave TBD placeholders.`).not.toMatch(/\bTBD\b/i);
    expect(doc, `${DOC_PATH} may use Pending only as the explicit evidence marker.`).not.toMatch(
      /\bPending\b(?!\s*(?:\||markers?))/
    );

    for (const { label, pattern } of FORBIDDEN_LITERAL_PATTERNS) {
      expect(doc, `${DOC_PATH} must not include ${label}.`).not.toMatch(pattern);
    }
  });
});
