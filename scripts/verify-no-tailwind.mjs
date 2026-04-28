#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cwd, exit, argv } from 'node:process';

export const DEFAULT_SCAN_TARGETS = [
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'svelte.config.js',
  'eslint.config.js',
  'src',
  '.github/workflows'
];

export const DEFAULT_IGNORED_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '.gsd'
]);

const TAILWIND_PATTERN = /@tailwind|tailwind|tailwind\.config|postcss\.config/gi;
const ALLOWED_GUARD_CONTROL_PATTERNS = [
  /verify:no-tailwind/,
  /verify-no-tailwind/,
  /Verify no Tailwind/
];

function isAllowedGuardControlLine(lineText) {
  return ALLOWED_GUARD_CONTROL_PATTERNS.some((pattern) => pattern.test(lineText));
}

function toPosixPath(path) {
  return path.split('\\').join('/');
}

function includesIgnoredSegment(path, ignoredSegments) {
  return toPosixPath(path)
    .split('/')
    .some((segment) => ignoredSegments.has(segment));
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

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const childPath = join(path, entry.name);
    const childRelativePath = relative(root, childPath);

    if (includesIgnoredSegment(childRelativePath, ignoredSegments)) {
      return [];
    }

    return collectFiles(childPath, root, ignoredSegments);
  });
}

export function scanForTailwindReferences({
  root,
  targets = DEFAULT_SCAN_TARGETS,
  ignoredSegments = DEFAULT_IGNORED_SEGMENTS
}) {
  const files = targets.flatMap((target) =>
    collectFiles(join(root, target), root, ignoredSegments)
  );

  return files.flatMap((file) => {
    const relativePath = toPosixPath(relative(root, file));
    const contents = readFileSync(file, 'utf8');

    return contents.split(/\r?\n/).flatMap((lineText, index) => {
      if (isAllowedGuardControlLine(lineText)) {
        return [];
      }

      const findings = [];
      TAILWIND_PATTERN.lastIndex = 0;

      for (const match of lineText.matchAll(TAILWIND_PATTERN)) {
        findings.push({
          path: relativePath,
          line: index + 1,
          column: (match.index ?? 0) + 1,
          match: match[0],
          text: lineText.trim()
        });
      }

      return findings;
    });
  });
}

export function formatFindings(findings) {
  return findings.map(
    (finding) => `${finding.path}:${finding.line}:${finding.column} ${finding.text}`
  );
}

export function runNoTailwindVerification(root = cwd()) {
  const findings = scanForTailwindReferences({ root });

  if (findings.length > 0) {
    return {
      ok: false,
      lines: [
        'Tailwind/PostCSS references were found in app/config/source/CI paths:',
        ...formatFindings(findings)
      ]
    };
  }

  return {
    ok: true,
    lines: [
      'No Tailwind/PostCSS dependencies, config, or directives found in scoped app/config/source/CI paths.'
    ]
  };
}

const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : undefined;
const modulePath = pathToFileURL(fileURLToPath(import.meta.url)).href;

if (invokedPath === modulePath) {
  const result = runNoTailwindVerification();
  const output = result.ok ? console.log : console.error;

  for (const line of result.lines) {
    output(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
