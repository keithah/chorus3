import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { pathToFileURL } from 'node:url';
import { scanChorus2Parity } from './scan-chorus2-parity.mjs';

export const DEFAULT_CHORUS2_ROOT = 'chorus2-21.x-1.0.1';
export const DEFAULT_REPORT_PATH = 'docs/m006-chorus2-parity.md';

const VALID_KINDS = new Set(['route', 'nav', 'control', 'action', 'jsonrpc']);
const VALID_STATUSES = new Set(['implemented', 'missing', 'deferred', 'out-of-scope']);
const STATUS_ORDER = ['implemented', 'missing', 'deferred', 'out-of-scope'];
const KIND_ORDER = ['route', 'nav', 'control', 'action', 'jsonrpc'];
const UNSAFE_TEXT_PATTERN =
  /(Authorization|Basic\b|token=|password=|localStorage|sessionStorage|https?:\/\/[^\s/]+:[^\s/]+@|(?:^|\s)\/(?:home|Users|tmp)\/|[?&][A-Za-z0-9_.-]*(?:token|password|secret)[A-Za-z0-9_.-]*=)/u;
const ABSOLUTE_EVIDENCE_PATTERN = /^(?:[A-Za-z]:)?\//u;
const IGNORED_EVIDENCE_PATTERN = /(?:^|\/)(?:\.gsd|\.planning|\.audits)(?:\/|$)/u;
const DIAGNOSTIC_ID_LIMIT = 8;

export function validateParityLedger({ discovered = [], ledger = [] } = {}) {
  const diagnostics = [];
  const ids = new Set();
  const duplicateIds = new Set();

  for (const row of ledger) {
    if (ids.has(row.id)) {
      duplicateIds.add(row.id);
    }
    ids.add(row.id);
  }

  if (duplicateIds.size > 0) {
    diagnostics.push(`[ledger] duplicate ${formatIdList(duplicateIds)}`);
  }

  for (const row of ledger) {
    if (!row?.id || !/^[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/u.test(row.id)) {
      diagnostics.push(`[ledger] invalid id for ${row?.id || 'unknown'}`);
    }
    if (!VALID_KINDS.has(row?.kind)) {
      diagnostics.push(`[ledger] invalid kind for ${row?.id || 'unknown'}`);
    }
    if (!VALID_STATUSES.has(row?.status)) {
      diagnostics.push(`[ledger] invalid status for ${row?.id || 'unknown'}`);
    }
    if (!String(row?.owner ?? '').trim()) {
      diagnostics.push(`[ledger] missing owner for ${row?.id || 'unknown'}`);
    }
    if (!Array.isArray(row?.evidence) || row.evidence.length === 0) {
      diagnostics.push(`[ledger] missing evidence for ${row?.id || 'unknown'}`);
    }

    const evidenceValues = Array.isArray(row?.evidence) ? row.evidence : [];
    if (evidenceValues.some((evidence) => isUnsafeEvidence(evidence))) {
      diagnostics.push(`[safety] unsafe evidence for ${row?.id || 'unknown'}`);
    }

    const reportText = [row?.family, row?.surface, row?.owner, row?.notes ?? ''].join(' ');
    if (UNSAFE_TEXT_PATTERN.test(reportText)) {
      diagnostics.push(`[safety] unsafe report text for ${row?.id || 'unknown'}`);
    }
  }

  const unmappedIds = discovered.map((item) => item.id).filter((id) => !ids.has(id));

  if (unmappedIds.length > 0) {
    diagnostics.push(`[ledger] unmapped ${formatIdList(unmappedIds)}`);
  }

  return { diagnostics: uniqueSorted(diagnostics) };
}

export function renderParityReport(ledger = []) {
  const sortedRows = sortRows(ledger);
  const lines = [
    '# M006 Chorus2 Parity Ledger',
    '',
    '> Generated from `CHORUS2_PARITY_LEDGER`; do not edit by hand. Run `node scripts/verify-chorus2-parity.mjs --write` to refresh.',
    '',
    'S01 proof is static source comparison only; no live Kodi calls are performed.',
    'Later slices own route aliases, Remote/Input, media alias bridges, packaged shell proof, and closeout.',
    '',
    '<!-- prettier-ignore-start -->',
    '',
    '## Totals by Kind and Status',
    '',
    '| kind | implemented | missing | deferred | out-of-scope | total |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...renderKindTotals(sortedRows),
    '',
    '## Totals by Status',
    '',
    '| status | count |',
    '| --- | ---: |',
    ...STATUS_ORDER.map(
      (status) => `| ${status} | ${sortedRows.filter((row) => row.status === status).length} |`
    ),
    ''
  ];

  for (const family of uniqueSorted(sortedRows.map((row) => row.family))) {
    lines.push(`## Family: ${family}`, '');
    lines.push('| ID | kind | surface | status | owner | evidence | notes |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const row of sortedRows.filter((entry) => entry.family === family)) {
      lines.push(
        `| \`${escapeTable(row.id)}\` | ${escapeTable(row.kind)} | \`${escapeTable(row.surface)}\` | ${escapeTable(row.status)} | ${escapeTable(row.owner)} | ${row.evidence.map((item) => `\`${escapeTable(item)}\``).join('<br>')} | ${escapeTable(row.notes ?? '')} |`
      );
    }
    lines.push('');
  }

  lines.push('<!-- prettier-ignore-end -->');

  const report = `${lines
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()}\n`;
  assertSafeReport(report);
  return report;
}

export async function runChorus2ParityVerification({
  discovered,
  ledger,
  reportPath = DEFAULT_REPORT_PATH,
  root = DEFAULT_CHORUS2_ROOT,
  write = false
} = {}) {
  const actualDiscovered = discovered ?? scanDiscoveredItems(root);
  const actualLedger = ledger ?? (await loadParityLedger()).CHORUS2_PARITY_LEDGER;
  const validation = validateParityLedger({ discovered: actualDiscovered, ledger: actualLedger });

  if (validation.diagnostics.length > 0) {
    throw new VerificationError(validation.diagnostics.join('\n'));
  }

  const report = renderParityReport(actualLedger);
  const displayReportPath = canonicalReportDisplayPath(reportPath);

  if (write) {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, report);
    return { diagnostics: [], reportPath, scanned: actualDiscovered.length, wrote: true };
  }

  const current = existsSync(reportPath) ? readFileSync(reportPath, 'utf8') : '';
  if (current !== report) {
    throw new VerificationError(
      `[report] ${displayReportPath} is out of date; run node scripts/verify-chorus2-parity.mjs --write`
    );
  }

  return { diagnostics: [], reportPath, scanned: actualDiscovered.length, wrote: false };
}

export async function loadParityLedger(path = 'src/lib/app/chorus2ParityLedger.ts') {
  try {
    const source = readFileSync(path, 'utf8');
    const { transformSync } = await import('esbuild');
    const { code } = transformSync(source, {
      format: 'esm',
      loader: 'ts',
      sourcemap: false,
      target: 'node22'
    });
    const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
    return await import(url);
  } catch (error) {
    throw new VerificationError(
      `[ledger] failed to import ${displayPath(path)}: ${error.code ?? error.message}`
    );
  }
}

function scanDiscoveredItems(root) {
  if (!existsSync(root)) {
    throw new VerificationError(`[scan] missing root ${displayPath(root)}`);
  }

  const scan = scanChorus2Parity({ root });
  if (scan.diagnostics.length > 0) {
    throw new VerificationError(scan.diagnostics.join('\n'));
  }
  return scan.items;
}

function renderKindTotals(rows) {
  return KIND_ORDER.map((kind) => {
    const kindRows = rows.filter((row) => row.kind === kind);
    const counts = new Map(STATUS_ORDER.map((status) => [status, 0]));
    for (const row of kindRows) {
      counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    }
    return `| ${kind} | ${counts.get('implemented') ?? 0} | ${counts.get('missing') ?? 0} | ${counts.get('deferred') ?? 0} | ${counts.get('out-of-scope') ?? 0} | ${kindRows.length} |`;
  });
}

function sortRows(rows) {
  return [...rows].sort(
    (left, right) => left.family.localeCompare(right.family) || left.id.localeCompare(right.id)
  );
}

function formatIdList(values) {
  const ids = uniqueSorted([...values]);
  const shown = ids.slice(0, DIAGNOSTIC_ID_LIMIT).join(', ');
  const suffix =
    ids.length > DIAGNOSTIC_ID_LIMIT ? `, ... (+${ids.length - DIAGNOSTIC_ID_LIMIT} more)` : '';
  return `${ids.length} id(s): ${shown}${suffix}`;
}

function isUnsafeEvidence(evidence) {
  const value = String(evidence ?? '');
  return (
    !value.trim() ||
    ABSOLUTE_EVIDENCE_PATTERN.test(value) ||
    IGNORED_EVIDENCE_PATTERN.test(value) ||
    UNSAFE_TEXT_PATTERN.test(value)
  );
}

function assertSafeReport(report) {
  if (UNSAFE_TEXT_PATTERN.test(report)) {
    throw new VerificationError('[safety] generated report contains unsafe text');
  }
}

function escapeTable(value) {
  return String(value ?? '')
    .replace(/\|/gu, '\\|')
    .replace(/\r?\n/gu, '<br>');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function canonicalReportDisplayPath(path) {
  const normalized = String(path).split('\\').join('/');
  return normalized.endsWith(DEFAULT_REPORT_PATH) ? DEFAULT_REPORT_PATH : displayPath(path);
}

function displayPath(path) {
  const value = String(path);
  if (!isAbsolute(value)) {
    return value.split('\\').join('/');
  }
  const relativePath = relative(cwd(), value).split('\\').join('/');
  if (!relativePath || relativePath.startsWith('..')) {
    return value.split(/[\\/]/u).pop() || '.';
  }
  return relativePath;
}

class VerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VerificationError';
  }
}

function parseArgs(args) {
  const parsed = { root: DEFAULT_CHORUS2_ROOT, write: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      parsed.root = args[index + 1] ?? parsed.root;
      index += 1;
    } else if (arg === '--write') {
      parsed.write = true;
    }
  }
  return parsed;
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(new URL(import.meta.url).pathname).href;

if (invokedPath === modulePath) {
  const options = parseArgs(argv.slice(2));
  try {
    const result = await runChorus2ParityVerification(options);
    console.log(
      `[report] ${result.wrote ? 'wrote' : 'verified'} ${displayPath(result.reportPath)} (${result.scanned} scanned item(s))`
    );
  } catch (error) {
    console.error(error instanceof VerificationError ? error.message : `[ledger] ${error.message}`);
    exit(1);
  }
}
