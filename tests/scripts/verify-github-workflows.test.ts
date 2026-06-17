import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CI_WORKFLOW_PATH = '.github/workflows/ci.yml';
const RELEASE_WORKFLOW_PATH = '.github/workflows/release.yml';
const KODI_ZIP_GLOB = 'dist/kodi/webinterface.chorus3-*.zip';

function readWorkflow(path: string): string {
  return readFileSync(path, 'utf8');
}

function expectWorkflowToUseNode22(workflow: string): void {
  expect(workflow).toContain('uses: actions/setup-node@v4');
  expect(workflow).toMatch(/node-version:\s*22\b/u);
  expect(workflow).toMatch(/cache:\s*npm\b/u);
}

function expectWorkflowToStayCiSafe(workflow: string): void {
  expect(workflow).not.toContain('scripts/ci_monitor.cjs');
  expect(workflow).not.toMatch(/\bKODI_(?:HTTP_URL|HOST|USERNAME|PASSWORD|WS_URL)\b/u);
  expect(workflow).not.toMatch(/secrets\.[A-Z0-9_]*KODI[A-Z0-9_]*/u);
}

describe('GitHub workflow verification', () => {
  it('keeps CI on the aggregate local verification path', () => {
    const workflow = readWorkflow(CI_WORKFLOW_PATH);

    expect(workflow).toContain('uses: actions/checkout@v4');
    expectWorkflowToUseNode22(workflow);
    expect(workflow).toContain('run: npm ci');
    expect(workflow).toContain('run: npm run verify');
    expect(workflow).not.toContain('run: npm run lint');
    expect(workflow).not.toContain('run: npm run typecheck');
    expect(workflow).not.toContain('run: npm run verify:no-tailwind');
    expectWorkflowToStayCiSafe(workflow);
  });

  it('publishes verified Kodi package artifacts from manual and version-tagged release runs', () => {
    const workflow = readWorkflow(RELEASE_WORKFLOW_PATH);

    expect(workflow).toMatch(/^on:\n(?:[\s\S]*?^ {2}workflow_dispatch:\s*$)/mu);
    expect(workflow).toMatch(/^ {2}push:\n\s+tags:\n\s+- ['"]v\*\.\*\.\*['"]/mu);
    expect(workflow).toMatch(/^permissions:\n\s+contents:\s+write\b/mu);
    expect(workflow).toContain('uses: actions/checkout@v4');
    expectWorkflowToUseNode22(workflow);
    expect(workflow).toContain('run: npm ci');
    expect(workflow).toContain('run: npm run verify');
    expect(workflow).not.toContain('run: npm run package:kodi');
    expect(workflow).not.toContain('run: npm run verify:kodi-package');
    expect(workflow).toContain('uses: actions/upload-artifact@v4');
    expect(workflow).toContain(`path: ${KODI_ZIP_GLOB}`);
    expect(workflow).toContain('if-no-files-found: error');
    expect(workflow).toContain("if: github.ref_type == 'tag'");
    expect(workflow).toContain('uses: softprops/action-gh-release@v3');
    expectWorkflowToStayCiSafe(workflow);
  });
});
