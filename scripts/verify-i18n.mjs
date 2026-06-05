#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { cwd, exit, argv } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

export const DEFAULT_SCAN_TARGETS = ['src/App.svelte', 'src/lib/components'];
export const DEFAULT_IGNORED_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '.gsd'
]);
export const DICTIONARY_SOURCE_PATH = 'src/lib/i18n/dictionaries.ts';
export const DEFAULT_BASE_LOCALE = 'en';

const TEXT_BETWEEN_TAGS_PATTERN = />\s*([^<>{}\n][^<>{}\n]*[A-Za-z][^<>{}\n]*)\s*</g;
const VISIBLE_ATTRIBUTE_PATTERN =
  /\b(?:aria-label|title|placeholder)=(['"])([^'"{}]*[A-Za-z][^'"{}]*)\1/g;
const SCRIPT_VISIBLE_LITERAL_PATTERN =
  /\b(?:label|title|heading|description|message|placeholder|emptyText|buttonText)\s*[:=]\s*(['"])([^'"\n{}]*[A-Za-z][^'"\n{}]*)\1/g;

// T01 establishes the guard before component extraction. Existing brownfield surfaces stay
// explicit here until later S04 tasks move their visible copy into dictionaries and narrow this list.
export const APPROVED_VISIBLE_COPY_FILE_PATTERNS = [
  /^src\/App\.svelte$/,
  /^src\/lib\/components\/[A-Za-z0-9]+\.svelte$/,
  /^src\/lib\/components\/media-search\/mediaSearchLinks\.ts$/,
  /^src\/lib\/stores\/[A-Za-z0-9]+\.svelte\.ts$/
];

export function runI18nVerification(root = cwd()) {
  const dictionarySource = readFileSync(join(root, DICTIONARY_SOURCE_PATH), 'utf8');
  const dictionaries = parseDictionaries(dictionarySource, root);
  const parityIssues = sortParityIssues(
    validateDictionaryParity(dictionaries, DEFAULT_BASE_LOCALE)
  );
  const hardcodedFindings = scanForHardcodedVisibleCopy({ root });
  const lines = [];

  if (parityIssues.length > 0) {
    lines.push('Dictionary parity problems were found:');
    lines.push(...parityIssues.map((issue) => formatParityIssue(issue, dictionarySource)));
  }

  if (hardcodedFindings.length > 0) {
    lines.push('Unapproved visible hardcoded strings were found:');
    lines.push(...hardcodedFindings.map(formatHardcodedFinding));
  }

  if (lines.length > 0) {
    return { ok: false, lines };
  }

  return {
    ok: true,
    lines: [
      'i18n verification passed: locale dictionaries have matching keys/placeholders, no blank values, and no unapproved visible hardcoded strings.'
    ]
  };
}

export function scanForHardcodedVisibleCopy({
  root,
  targets = DEFAULT_SCAN_TARGETS,
  ignoredSegments = DEFAULT_IGNORED_SEGMENTS,
  approvedFilePatterns = APPROVED_VISIBLE_COPY_FILE_PATTERNS
}) {
  const files = targets.flatMap((target) =>
    collectFiles(join(root, target), root, ignoredSegments)
  );

  return files.flatMap((file) => {
    const relativePath = toPosixPath(relative(root, file));

    if (approvedFilePatterns.some((pattern) => pattern.test(relativePath))) {
      return [];
    }

    if (!/\.(?:svelte|svelte\.ts|ts)$/.test(relativePath) || relativePath.endsWith('.test.ts')) {
      return [];
    }

    const contents = readFileSync(file, 'utf8');
    const scanContents = relativePath.endsWith('.svelte')
      ? maskSvelteStyleBlocks(contents)
      : contents;
    const patternSources = relativePath.endsWith('.ts')
      ? [[SCRIPT_VISIBLE_LITERAL_PATTERN, 'visible-literal']]
      : [
          [TEXT_BETWEEN_TAGS_PATTERN, 'text-node'],
          [VISIBLE_ATTRIBUTE_PATTERN, 'visible-attribute'],
          [SCRIPT_VISIBLE_LITERAL_PATTERN, 'visible-literal']
        ];
    const findings = [];

    for (const [pattern, source] of patternSources) {
      pattern.lastIndex = 0;

      for (const match of scanContents.matchAll(pattern)) {
        const text = (match[2] ?? match[1]).trim();

        if (!shouldReportVisibleCopy(text)) {
          continue;
        }

        findings.push({
          path: relativePath,
          line: lineNumberForOffset(contents, match.index ?? 0),
          source,
          text
        });
      }
    }

    return dedupeHardcodedFindings(findings);
  });
}

function dedupeHardcodedFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.path}:${finding.line}:${finding.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function maskSvelteStyleBlocks(contents) {
  return contents.replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi, (block) =>
    block.replace(/[^\n]/g, ' ')
  );
}

export function validateDictionaryParity(dictionaries, baseLocale = DEFAULT_BASE_LOCALE) {
  const baseDictionary = dictionaries[baseLocale];

  if (!baseDictionary) {
    return [
      {
        type: 'missing-base-locale',
        locale: baseLocale,
        message: `Base locale ${baseLocale} is missing from DICTIONARIES`
      }
    ];
  }

  const baseKeys = Object.keys(baseDictionary).sort();
  const issues = [];

  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    const keys = Object.keys(dictionary).sort();

    for (const [key, value] of Object.entries(dictionary)) {
      if (typeof value !== 'string' || value.trim() === '') {
        issues.push({
          type: 'blank-value',
          locale,
          key,
          message: `${locale} translation ${key} is blank`
        });
      }
    }

    if (locale === baseLocale) {
      continue;
    }

    for (const key of baseKeys.filter((key) => !Object.hasOwn(dictionary, key))) {
      issues.push({
        type: 'missing-key',
        locale,
        key,
        message: `${locale} is missing translation key ${key}`
      });
    }

    for (const key of keys.filter((key) => !Object.hasOwn(baseDictionary, key))) {
      issues.push({
        type: 'extra-key',
        locale,
        key,
        message: `${locale} has extra translation key ${key}`
      });
    }

    for (const key of baseKeys) {
      if (!Object.hasOwn(dictionary, key)) {
        continue;
      }

      const expected = getPlaceholders(baseDictionary[key]);
      const actual = getPlaceholders(dictionary[key]);

      if (!sameStringSet(expected, actual)) {
        issues.push({
          type: 'placeholder-mismatch',
          locale,
          key,
          expected,
          actual,
          message: `${locale} translation ${key} placeholders differ: expected ${formatPlaceholderList(
            expected
          )}; found ${formatPlaceholderList(actual)}`
        });
      }
    }
  }

  return issues;
}

export function loadDictionaries(root = cwd()) {
  const source = readFileSync(join(root, DICTIONARY_SOURCE_PATH), 'utf8');
  return parseDictionaries(source, root);
}

function parseDictionaries(source, root = cwd()) {
  const sourceFile = createSourceFile(DICTIONARY_SOURCE_PATH, source);
  const imports = extractNamedImports(sourceFile);
  const dictionaryObject = findExportedObjectInitializer(sourceFile, 'DICTIONARIES');
  const dictionaries = {};

  for (const property of dictionaryObject.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(
        `${DICTIONARY_SOURCE_PATH} DICTIONARIES only supports locale: importedDictionary entries.`
      );
    }

    const locale = propertyNameText(property.name);
    if (!locale) {
      throw new Error(`${DICTIONARY_SOURCE_PATH} DICTIONARIES contains an unsupported locale key.`);
    }
    if (!ts.isIdentifier(property.initializer)) {
      throw new Error(
        `${DICTIONARY_SOURCE_PATH} DICTIONARIES locale ${locale} must reference an imported dictionary identifier.`
      );
    }

    const constName = property.initializer.text;
    const importPath = imports.get(constName);
    if (!importPath) {
      throw new Error(`${DICTIONARY_SOURCE_PATH} references unresolved dictionary ${constName}`);
    }

    dictionaries[locale] = readImportedDictionary(root, importPath, constName);
  }

  return dictionaries;
}

function extractNamedImports(sourceFile) {
  const imports = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const specifier of namedBindings.elements) {
      imports.set(specifier.name.text, statement.moduleSpecifier.text);
    }
  }

  return imports;
}

function readImportedDictionary(root, importPath, constName) {
  const dictionaryDir = dirname(DICTIONARY_SOURCE_PATH);
  const sourcePath = join(root, dictionaryDir, `${importPath}.ts`);
  const source = readFileSync(sourcePath, 'utf8');
  const sourceFile = createSourceFile(sourcePath, source);
  const object = findExportedObjectInitializer(sourceFile, constName);

  return objectLiteralToStringRecord(object, sourcePath);
}

function createSourceFile(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function findExportedObjectInitializer(sourceFile, constName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== constName) continue;

      const initializer = declaration.initializer;
      const expression = unwrapSatisfiesExpression(initializer);
      if (expression && ts.isObjectLiteralExpression(expression)) {
        return expression;
      }
    }
  }

  throw new Error(`${sourceFile.fileName} must export object literal ${constName}`);
}

function unwrapSatisfiesExpression(node) {
  if (!node) return null;
  if (ts.isSatisfiesExpression(node)) return unwrapSatisfiesExpression(node.expression);
  if (ts.isAsExpression(node)) return unwrapSatisfiesExpression(node.expression);
  return node;
}

function objectLiteralToStringRecord(object, sourcePath) {
  const record = {};

  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`${sourcePath} dictionaries only support string key: string value entries.`);
    }

    const key = propertyNameText(property.name);
    const value = stringExpressionText(property.initializer);
    if (key === null || value === null) {
      throw new Error(`${sourcePath} contains a non-string dictionary entry.`);
    }

    record[key] = value;
  }

  return record;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function stringExpressionText(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = stringExpressionText(expression.left);
    const right = stringExpressionText(expression.right);
    return left !== null && right !== null ? `${left}${right}` : null;
  }

  return null;
}

function sortParityIssues(issues) {
  const order = new Map([
    ['missing-base-locale', 0],
    ['missing-key', 1],
    ['extra-key', 2],
    ['blank-value', 3],
    ['placeholder-mismatch', 4]
  ]);

  return [...issues].sort((left, right) => {
    const leftOrder = order.get(left.type) ?? 99;
    const rightOrder = order.get(right.type) ?? 99;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return `${left.locale ?? ''}:${left.key ?? ''}`.localeCompare(
      `${right.locale ?? ''}:${right.key ?? ''}`
    );
  });
}

function collectFiles(path, root, ignoredSegments) {
  let stats;

  try {
    stats = statSync(path);
  } catch {
    return [];
  }

  const relativePath = relative(root, path);
  if (relativePath && includesIgnoredSegment(relativePath, ignoredSegments)) {
    return [];
  }

  if (stats.isFile()) {
    return [path];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    collectFiles(join(path, entry.name), root, ignoredSegments)
  );
}

function includesIgnoredSegment(path, ignoredSegments) {
  return toPosixPath(path)
    .split('/')
    .some((segment) => ignoredSegments.has(segment));
}

function toPosixPath(path) {
  return path.split('\\').join('/');
}

function shouldReportVisibleCopy(text) {
  if (text.length < 2) {
    return false;
  }

  if (/^[\d\s.,:;!?()[\]{}#%+\-/]+$/.test(text)) {
    return false;
  }

  if (/^(?:http|https|ws|wss):\/\//i.test(text)) {
    return false;
  }

  return true;
}

function getPlaceholders(value) {
  const placeholders = [];
  const pattern = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

  for (const match of value.matchAll(pattern)) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }

  return placeholders;
}

function sameStringSet(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function formatPlaceholderList(placeholders) {
  return placeholders.length > 0
    ? placeholders.map((placeholder) => `{${placeholder}}`).join(', ')
    : '(none)';
}

function lineNumberForOffset(contents, offset) {
  return contents.slice(0, offset).split(/\r?\n/).length;
}

function formatParityIssue(issue, dictionarySource) {
  const line = issue.key
    ? lineNumberForDictionaryKey(dictionarySource, issue.locale, issue.key)
    : 1;
  const key = issue.key ? ` key=${issue.key}` : '';
  const locale = issue.locale ? ` locale=${issue.locale}` : '';
  return `${DICTIONARY_SOURCE_PATH}:${line}${key}${locale} ${issue.type} ${issue.message}`;
}

function lineNumberForDictionaryKey(source, locale, key) {
  const localeSectionStart = source.indexOf(`${locale}:`);
  const quotedKey = JSON.stringify(key).replaceAll('"', "'");
  const singleQuotedOffset =
    localeSectionStart === -1 ? -1 : source.indexOf(quotedKey, localeSectionStart);

  if (singleQuotedOffset !== -1) {
    return lineNumberForOffset(source, singleQuotedOffset);
  }

  const doubleQuotedKey = JSON.stringify(key);
  const doubleQuotedOffset =
    localeSectionStart === -1 ? -1 : source.indexOf(doubleQuotedKey, localeSectionStart);

  if (doubleQuotedOffset !== -1) {
    return lineNumberForOffset(source, doubleQuotedOffset);
  }

  const fallbackOffset =
    source.indexOf(quotedKey) !== -1 ? source.indexOf(quotedKey) : source.indexOf(doubleQuotedKey);
  return fallbackOffset !== -1 ? lineNumberForOffset(source, fallbackOffset) : 1;
}

function formatHardcodedFinding(finding) {
  return `${finding.path}:${finding.line} ${finding.source} ${JSON.stringify(finding.text)}`;
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = runI18nVerification();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
