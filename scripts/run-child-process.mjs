import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';

export const DEFAULT_CHILD_PROCESS_TIMEOUT_MS = 60_000;
export const DEFAULT_CHILD_PROCESS_MAX_OUTPUT_BYTES = 1024 * 1024;

export function runChildProcess({
  command,
  args,
  cwd,
  timeoutMs = DEFAULT_CHILD_PROCESS_TIMEOUT_MS,
  killTimeoutMs = 2_000,
  maxOutputBytes = DEFAULT_CHILD_PROCESS_MAX_OUTPUT_BYTES
}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdoutBuffer = createOutputBuffer(maxOutputBytes);
    const stderrBuffer = createOutputBuffer(maxOutputBytes);
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
      stdoutBuffer.push(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderrBuffer.push(chunk);
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
        stdout: stdoutBuffer.value(),
        stderr: stderrBuffer.value()
      });
    });
  });
}

function createOutputBuffer(maxBytes) {
  const safeMaxBytes =
    Number.isFinite(maxBytes) && maxBytes > 0
      ? Math.max(1, Math.floor(maxBytes))
      : DEFAULT_CHILD_PROCESS_MAX_OUTPUT_BYTES;
  const headLimit = Math.ceil(safeMaxBytes / 2);
  const tailLimit = Math.floor(safeMaxBytes / 2);
  const head = [];
  const tail = [];
  let headBytes = 0;
  let tailBytes = 0;
  let truncatedBytes = 0;

  return {
    push(chunk) {
      const value = String(chunk);
      const bytes = Buffer.byteLength(value);

      if (headBytes + bytes <= headLimit) {
        head.push(value);
        headBytes += bytes;
        return;
      }

      truncatedBytes += bytes;
      tail.push(value);
      tailBytes += bytes;

      while (tailBytes > tailLimit && tail.length > 0) {
        const removed = tail.shift() ?? '';
        tailBytes -= Buffer.byteLength(removed);
      }
    },
    value() {
      if (truncatedBytes === 0) {
        return head.join('');
      }

      return `${head.join('')}\n[... truncated ${truncatedBytes} output bytes ...]\n${tail.join('')}`;
    }
  };
}
