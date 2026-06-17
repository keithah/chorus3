import { spawn } from 'node:child_process';

export const DEFAULT_CHILD_PROCESS_TIMEOUT_MS = 60_000;

export function runChildProcess({
  command,
  args,
  cwd,
  timeoutMs = DEFAULT_CHILD_PROCESS_TIMEOUT_MS,
  killTimeoutMs = 2_000
}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdoutChunks = [];
    const stderrChunks = [];
    let settled = false;
    let timedOut = false;
    let terminated = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!terminated) {
          child.kill('SIGKILL');
        }
      }, killTimeoutMs).unref();
    }, timeoutMs);

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      fn(value);
    };

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdoutChunks.push(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderrChunks.push(chunk);
    });
    child.on('error', (error) => {
      settle(reject, error);
    });
    child.on('close', (status) => {
      terminated = true;
      if (timedOut) {
        settle(reject, new Error(`${command} timed out after ${timeoutMs}ms.`));
        return;
      }

      settle(resolve, {
        status: status ?? 1,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join('')
      });
    });
  });
}
