import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { M005_BROWSER_PROOF_FORBIDDEN_TEXT } from '../src/lib/testing/m005BrowserProofFixtures';

const DOC_PATH = 'docs/m005-final-proof.md';
const REQUIRED_TRACKED_PATHS = [
  DOC_PATH,
  'docs/m005-settings-uat.md',
  'docs/m005-addons-uat.md',
  'docs/m005-lab-uat.md',
  'docs/m005-i18n-uat.md',
  'docs/m005-now-playing-uat.md',
  'docs/m005-kodi-package-uat.md',
  'src/lib/testing/m005BrowserProofFixtures.ts',
  'package.json'
] as const;

const REQUIRED_SECTIONS = [
  '## Scope',
  '## Requirements Cross-Reference',
  '## Server Lifecycle',
  '## Command and Package Verification',
  '## Browser Route Matrix',
  '## Browser Diagnostics',
  '## Visible-DOM Redaction Scan Categories',
  '## Evidence Log',
  '## Live Kodi Out-of-Scope Note'
] as const;

const REQUIRED_ROUTES = [
  '/settings?m005-browser-proof=1',
  '/settings?m005-browser-proof=1&locale=de',
  '/addons?m005-browser-proof=1',
  '/addons/plugin.video.safe-demo?m005-browser-proof=1',
  '/lab/shortcuts?m005-browser-proof=1',
  '/lab/api-browser?m005-browser-proof=1',
  '/now-playing?m005-browser-proof=1&theme=light&locale=de',
  '/now-playing?m005-browser-proof=1&embed-state=setup&locale=de',
  '/now-playing?m005-browser-proof=1&theme=dark&locale=en',
  '/now-playing?m005-browser-proof=1&credential-category=blocked'
] as const;

const REQUIRED_COMMANDS = [
  'npm run verify',
  'npm run verify:kodi-package',
  'zipinfo -1 dist/kodi/webinterface.chorus3-0.0.0.zip | sort'
] as const;

const REQUIRED_COVERAGE_TERMS = [
  'Settings write/rollback/refresh copy',
  'Add-ons write/rollback/refresh copy',
  'Lab guard and redacted JSON copy',
  'Now Playing setup and unsafe-query guidance',
  'package verifier phase diagnostics',
  'visible route status, alert, and live-region copy',
  'local, network, special, and web URL schemes',
  'credential-bearing endpoint shapes',
  'authentication header names or values',
  'browser storage internals',
  'raw JSON-RPC request, response, body, or payload data',
  'sentinel token names or values'
] as const;

function readTrackedFile(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Missing required tracked path ${path}: ${message}`);
  }
}

describe('M005 final proof documentation contract', () => {
  it('keeps all tracked proof inputs available with clear missing-path diagnostics', () => {
    for (const path of REQUIRED_TRACKED_PATHS) {
      expect(() => readTrackedFile(path)).not.toThrow();
    }
  });

  it('has a well-formed forbidden-text export for fail-closed redaction checks', () => {
    expect(Array.isArray(M005_BROWSER_PROOF_FORBIDDEN_TEXT)).toBe(true);
    expect(M005_BROWSER_PROOF_FORBIDDEN_TEXT.length).toBeGreaterThan(0);
    expect(M005_BROWSER_PROOF_FORBIDDEN_TEXT.every((value) => typeof value === 'string')).toBe(
      true
    );
    expect(M005_BROWSER_PROOF_FORBIDDEN_TEXT.every((value) => value.length > 0)).toBe(true);
  });

  it('lists required sections, route matrix, commands, diagnostics, and redaction categories', () => {
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

    for (const term of REQUIRED_COVERAGE_TERMS) {
      expect(doc, `${DOC_PATH} must include coverage term ${term}.`).toContain(term);
    }
  });

  it('does not document literal forbidden fixture text or unresolved placeholders', () => {
    const doc = readTrackedFile(DOC_PATH);

    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(doc, `${DOC_PATH} must not include forbidden literal from fixtures.`).not.toContain(
        forbidden
      );
    }

    expect(doc, `${DOC_PATH} must not leave TBD placeholders.`).not.toMatch(/\bTBD\b/i);
    expect(doc, `${DOC_PATH} must not leave TODO placeholders.`).not.toMatch(/\bTODO\b/i);
    expect(doc, `${DOC_PATH} may use Pending only as the explicit evidence marker.`).not.toMatch(
      /\bPending\b(?!\s*(?:\||markers?))/
    );
  });
});
