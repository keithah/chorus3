import { execPath } from 'node:process';
import { describe, expect, it } from 'vitest';

import { runChildProcess } from '../../scripts/run-child-process.mjs';

describe('runChildProcess', () => {
  it('caps retained stdout and stderr from noisy child processes', async () => {
    const result = await runChildProcess({
      command: execPath,
      args: ['-e', "process.stdout.write('a'.repeat(200)); process.stderr.write('b'.repeat(200));"],
      maxOutputBytes: 80
    });

    expect(result.status).toBe(0);
    expect(result.stdout.length).toBeLessThan(200);
    expect(result.stderr.length).toBeLessThan(200);
    expect(result.stdout).toContain('truncated');
    expect(result.stderr).toContain('truncated');
  });
});
