export function safeBrowserFilename(label: string, fallback: string): string {
  return (
    label
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || fallback
  );
}
