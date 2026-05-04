import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const DOC_PATH = 'docs/m007-visual-parity-proof.md';
const SCREENSHOT_README_PATH = 'docs/m007-visual-parity-screenshots/README.md';
const CURRENT_SCREENSHOT_DIR = 'docs/m007-visual-parity-screenshots/';

const REFERENCE_SCREENSHOTS = [
  'chorus2-21.x-1.0.1/dist/screenshots/addons.jpg',
  'chorus2-21.x-1.0.1/dist/screenshots/artists.jpg',
  'chorus2-21.x-1.0.1/dist/screenshots/movie.jpg',
  'chorus2-21.x-1.0.1/dist/screenshots/tv.jpg',
  'chorus2-21.x-1.0.1/dist/screenshots/settings.jpg',
  'chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg'
] as const;

const CURRENT_SCREENSHOTS = [
  'docs/m007-visual-parity-screenshots/current-music-home.png',
  'docs/m007-visual-parity-screenshots/current-music-submenu.png',
  'docs/m007-visual-parity-screenshots/current-movies.png',
  'docs/m007-visual-parity-screenshots/current-tvshows.png',
  'docs/m007-visual-parity-screenshots/current-browser-files.png',
  'docs/m007-visual-parity-screenshots/current-addons-list.png',
  'docs/m007-visual-parity-screenshots/current-addon-detail.png',
  'docs/m007-visual-parity-screenshots/current-playlists-local.png',
  'docs/m007-visual-parity-screenshots/current-settings-kodi.png',
  'docs/m007-visual-parity-screenshots/current-help-overview.png',
  'docs/m007-visual-parity-screenshots/current-drawer-expanded-menu.png',
  'docs/m007-visual-parity-screenshots/current-drawer-collapsed.png'
] as const;

const REQUIRED_SECTIONS = [
  '## Scope',
  '## Redaction Rules',
  '## Reference Screenshot Inventory',
  '## Current Screenshot Inventory',
  '## Route and State Matrix',
  '## Parity Checklist',
  '## Classified Deltas',
  '## Command and Browser Diagnostics',
  '## Evidence Log',
  '## S08 Live Kodi Boundary'
] as const;

const REQUIRED_ROUTE_STATES = [
  '| Music home | `/music?m007-visual-proof=1` |',
  '| Music submenu | `/music/artists?m007-visual-proof=1` |',
  '| Movies | `/movies?m007-visual-proof=1` |',
  '| TV shows | `/tvshows?m007-visual-proof=1` |',
  '| Browser files | `/files?m007-visual-proof=1` |',
  '| Add-ons list | `/addons/all?m007-visual-proof=1` |',
  '| Add-on detail | `/addons/plugin.video.safe-demo?m007-visual-proof=1` |',
  '| Local playlists | `/playlists?m007-visual-proof=1` |',
  '| Settings Kodi | `/settings/addons?m007-visual-proof=1` |',
  '| Help overview | `/help?m007-visual-proof=1` |',
  '| Drawer expanded menu | `/music?m007-visual-proof=1 plus playlist menu action` |',
  '| Drawer collapsed | `/music?m007-visual-proof=1 plus collapse action` |'
] as const;

const REQUIRED_DIAGNOSTIC_TERMS = [
  'stable shell/stage/page/drawer/local playlist selectors',
  'route-specific visible headings',
  'drawer ARIA/data attributes',
  'browser console errors',
  'failed network requests',
  'visible DOM redaction scan',
  'scripts/verify-m007-visual-proof-doc.test.ts',
  'npm run verify:kodi-package'
] as const;

const REQUIRED_DELTA_CATEGORIES = [
  'match',
  'intentional-delta',
  'deferred',
  'needs-follow-up'
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
    label: 'browser storage internals',
    pattern: /\b(?:localStorage|sessionStorage)\b/i
  },
  {
    label: 'raw JSON-RPC object literals',
    pattern: /\{[^\n{}]*"jsonrpc"\s*:/i
  },
  {
    label: 'raw request or response bodies',
    pattern: /\b(?:request|response|body|payload)\s*[:=]\s*\{[^\n{}]*(?:"method"|"jsonrpc")/i
  },
  {
    label: 'ignored GSD or browser artifact paths',
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

function validateM007VisualProofDoc(doc: string): string[] {
  const errors: string[] = [];
  const normalizedDoc = normalizeMarkdownTablePipes(doc);

  for (const section of REQUIRED_SECTIONS) {
    if (!doc.includes(section)) {
      errors.push(`${DOC_PATH} must include ${section}.`);
    }
  }

  for (const referencePath of REFERENCE_SCREENSHOTS) {
    if (!existsSync(referencePath)) {
      errors.push(`Missing reference screenshot ${referencePath}.`);
    }
    if (!doc.includes(referencePath)) {
      errors.push(`${DOC_PATH} must link reference screenshot ${referencePath}.`);
    }
    if (!/\.jpe?g$/i.test(referencePath)) {
      errors.push(
        `Reference screenshot ${referencePath} must use a known jpg/jpeg image extension.`
      );
    }
  }

  for (const currentPath of CURRENT_SCREENSHOTS) {
    if (!currentPath.startsWith(CURRENT_SCREENSHOT_DIR)) {
      errors.push(`Current screenshot ${currentPath} must stay under ${CURRENT_SCREENSHOT_DIR}.`);
    }
    if (!/\.png$/i.test(currentPath)) {
      errors.push(`Current screenshot ${currentPath} must use a png extension.`);
    }
    if (!doc.includes(currentPath)) {
      errors.push(`${DOC_PATH} must inventory current screenshot ${currentPath}.`);
    }
    if (!existsSync(currentPath)) {
      errors.push(`Current screenshot ${currentPath} is required after capture.`);
    }
  }

  for (const routeState of REQUIRED_ROUTE_STATES) {
    const normalizedRouteState = normalizeMarkdownTablePipes(routeState);
    if (!normalizedDoc.includes(normalizedRouteState)) {
      errors.push(`${DOC_PATH} must include route/state row ${routeState}.`);
    }
  }

  for (const term of REQUIRED_DIAGNOSTIC_TERMS) {
    if (!doc.includes(term)) {
      errors.push(`${DOC_PATH} must include diagnostic term ${term}.`);
    }
  }

  for (const category of REQUIRED_DELTA_CATEGORIES) {
    if (!doc.includes(`\`${category}\``)) {
      errors.push(`${DOC_PATH} must define allowed delta category ${category}.`);
    }
  }

  const deltaTableRows = doc
    .split('\n')
    .filter((line) => line.startsWith('|') && !line.includes('---'))
    .filter((line) =>
      REQUIRED_DELTA_CATEGORIES.some((category) => line.includes(`\`${category}\``))
    );

  if (deltaTableRows.length < REQUIRED_DELTA_CATEGORIES.length) {
    errors.push(
      `${DOC_PATH} must include at least one classified delta row for every allowed category.`
    );
  }

  const backtickLabels = [...doc.matchAll(/`([a-z][a-z-]*)`/gi)].map((match) => match[1]);
  const unsupportedDeltaCategory = backtickLabels.find(
    (label) =>
      (label.includes('delta') || ['blocked', 'todo', 'unknown', 'unclassified'].includes(label)) &&
      !REQUIRED_DELTA_CATEGORIES.includes(label as (typeof REQUIRED_DELTA_CATEGORIES)[number])
  );
  if (unsupportedDeltaCategory) {
    errors.push(`${DOC_PATH} contains unsupported delta category ${unsupportedDeltaCategory}.`);
  }

  if (!/S08[^\n]+live Kodi install proof/i.test(doc)) {
    errors.push(`${DOC_PATH} must name S08 as owner of live Kodi install proof.`);
  }

  if (!/pixel-diff[^\n]+not[^\n]+blocking/i.test(doc)) {
    errors.push(`${DOC_PATH} must state pixel-diff parity is not blocking for M007.`);
  }

  if (/M007[^\n]+live Kodi install proof[^\n]+(?:complete|passed|done|verified)/i.test(doc)) {
    errors.push(`${DOC_PATH} must not overclaim M007 live Kodi install proof completion.`);
  }

  if (/\b(?:TODO|TBD)\b/i.test(doc)) {
    errors.push(`${DOC_PATH} must not leave TODO/TBD placeholders.`);
  }

  if (!normalizedDoc.includes('|Check|Status|Evidence owner|Notes|')) {
    errors.push(`${DOC_PATH} must include a non-empty evidence log table.`);
  }

  for (const { label, pattern } of FORBIDDEN_PATTERNS) {
    if (pattern.test(doc)) {
      errors.push(`${DOC_PATH} must not include ${label}.`);
    }
  }

  return errors;
}

function minimalValidDoc(): string {
  const sections = REQUIRED_SECTIONS.join('\n\n');
  const references = REFERENCE_SCREENSHOTS.map((path) => `- ${path}`).join('\n');
  const current = CURRENT_SCREENSHOTS.map((path) => `- ${path}`).join('\n');
  const routes = REQUIRED_ROUTE_STATES.map(
    (row, index) =>
      `${row} ${REFERENCE_SCREENSHOTS[index % REFERENCE_SCREENSHOTS.length]} | ${CURRENT_SCREENSHOTS[index]} | \`match\` |`
  ).join('\n');
  const deltas = REQUIRED_DELTA_CATEGORIES.map(
    (category) => `| ${category} | \`${category}\` |`
  ).join('\n');

  return [
    sections,
    references,
    current,
    routes,
    deltas,
    REQUIRED_DIAGNOSTIC_TERMS.join('\n'),
    '| Check | Status | Evidence owner | Notes |',
    '| Doc proof | Pass | T04 | Contract exists. |',
    'S08 owns live Kodi install proof after this no-live screenshot proof.',
    'Automated pixel-diff parity is not blocking for M007.'
  ].join('\n\n');
}

describe('M007 visual proof documentation contract', () => {
  it('keeps required reference screenshots, current screenshots, and tracked proof-doc files available', () => {
    expect(() => readTrackedFile(DOC_PATH)).not.toThrow();
    expect(() => readTrackedFile(SCREENSHOT_README_PATH)).not.toThrow();

    for (const path of REFERENCE_SCREENSHOTS) {
      expect(() => readTrackedFile(path)).not.toThrow();
    }

    for (const path of CURRENT_SCREENSHOTS) {
      expect(existsSync(path), `${path} must exist after T04 capture.`).toBe(true);
    }
  });

  it('lists required sections, routes, screenshots, diagnostics, deltas, and ownership boundaries', () => {
    const doc = readTrackedFile(DOC_PATH);

    expect(validateM007VisualProofDoc(doc)).toEqual([]);
  });

  it('documents captured current screenshot names in the README without placeholder language drift', () => {
    const readme = readTrackedFile(SCREENSHOT_README_PATH);

    expect(readme).toContain('Do not add placeholder binary images');
    expect(readme).toContain('m007-visual-proof=1');
    expect(readme).toContain('tracked documentation directory');

    for (const currentPath of CURRENT_SCREENSHOTS) {
      expect(readme, `${SCREENSHOT_README_PATH} must list ${currentPath}.`).toContain(currentPath);
    }

    for (const { label, pattern } of FORBIDDEN_PATTERNS) {
      expect(readme, `${SCREENSHOT_README_PATH} must not include ${label}.`).not.toMatch(pattern);
    }
  });

  it('requires current screenshot files once the T04 capture contract is active', () => {
    expect(validateM007VisualProofDoc(minimalValidDoc())).toEqual([]);
  });

  it('rejects malformed docs with missing sections, route rows, inventories, evidence, and boundaries', () => {
    const errors = validateM007VisualProofDoc('# Incomplete proof\n\n`unknown-delta`\n');
    const output = errors.join('\n');

    expect(output).toContain(`${DOC_PATH} must include ## Scope.`);
    expect(output).toContain(
      `${DOC_PATH} must link reference screenshot ${REFERENCE_SCREENSHOTS[0]}.`
    );
    expect(output).toContain(
      `${DOC_PATH} must inventory current screenshot ${CURRENT_SCREENSHOTS[0]}.`
    );
    expect(output).toContain(
      `${DOC_PATH} must include route/state row ${REQUIRED_ROUTE_STATES[0]}.`
    );
    expect(output).toContain(`${DOC_PATH} contains unsupported delta category unknown-delta.`);
    expect(output).toContain(`${DOC_PATH} must name S08 as owner of live Kodi install proof.`);
    expect(output).toContain(`${DOC_PATH} must include a non-empty evidence log table.`);
  });

  it('rejects forbidden secret, storage, path, ignored-artifact, and live-overclaim language', () => {
    const badDoc = [
      minimalValidDoc(),
      'Authorization: redacted',
      'Basic abcdefghi',
      'localStorage dump',
      '.gsd/browser-state/example.json',
      '/home/example/local-proof.png',
      'M007 live Kodi install proof passed'
    ].join('\n');
    const output = validateM007VisualProofDoc(badDoc).join('\n');

    expect(output).toContain(`${DOC_PATH} must not include Authorization header literals.`);
    expect(output).toContain(`${DOC_PATH} must not include Basic auth literal values.`);
    expect(output).toContain(`${DOC_PATH} must not include browser storage internals.`);
    expect(output).toContain(`${DOC_PATH} must not include ignored GSD or browser artifact paths.`);
    expect(output).toContain(`${DOC_PATH} must not include absolute local paths.`);
    expect(output).toContain(
      `${DOC_PATH} must not overclaim M007 live Kodi install proof completion.`
    );
  });
});
