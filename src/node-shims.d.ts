declare module 'node:fs' {
  export function readFileSync(path: string | URL, options?: unknown): string;
}
