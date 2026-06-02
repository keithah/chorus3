import { startBrowserDownload as startBrowserDownloadWithFilename } from '$lib/app/appDownloads';

export function startBrowserDownload(document: Document, url: string, label: string): void {
  startBrowserDownloadWithFilename(document, url, safeFilename(label));
}

export function safeFilename(label: string): string {
  return (
    label
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'download'
  );
}

export function safeLibraryActionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Download failed.';
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    .replace(/smb:\/\/[^\s]+/gi, '[path]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization|basic|password|p@ssword/gi, 'credentials')
    .replace(/localStorage|sessionStorage/gi, 'browser storage')
    .replace(/raw response body/gi, 'response body [redacted]');
}
