export function safeBrowserFilename(label: string, fallback: string): string {
  return sanitizeFilename(label) || sanitizeFilename(fallback) || 'download';
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
