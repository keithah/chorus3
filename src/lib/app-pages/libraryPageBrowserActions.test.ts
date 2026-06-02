import { describe, expect, it, vi } from 'vitest';

import {
  safeFilename,
  safeLibraryActionErrorMessage,
  startBrowserDownload
} from './libraryPageBrowserActions';

describe('library page browser actions', () => {
  it('creates compact safe download filenames', () => {
    expect(safeFilename('  Big Buck Bunny: 1080p!.mkv  ')).toBe('Big-Buck-Bunny-1080p-.mkv');
    expect(safeFilename('***')).toBe('download');
    expect(safeFilename('a'.repeat(120))).toHaveLength(80);
  });

  it('starts a browser download with an inert noopener anchor', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appended: unknown[] = [];
    const anchor = {
      href: '',
      download: '',
      rel: '',
      click,
      remove
    };
    const document = {
      createElement: vi.fn(() => anchor),
      body: {
        append: vi.fn((value: unknown) => appended.push(value))
      }
    } as unknown as Document;

    startBrowserDownload(document, 'http://kodi.local/vfs/movie.mkv', 'Movie title');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(anchor).toMatchObject({
      href: 'http://kodi.local/vfs/movie.mkv',
      download: 'Movie-title',
      rel: 'noopener'
    });
    expect(appended).toEqual([anchor]);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('redacts action error messages while preserving useful context', () => {
    const message = safeLibraryActionErrorMessage(
      new Error(
        'Failed at http://admin:p@ssword@example.test/jsonrpc with Authorization: Basic abc123 localStorage raw response body smb://secret/movie.mkv'
      )
    );

    expect(message).toContain('[redacted-url]');
    expect(message).toContain('browser storage');
    expect(message).toContain('response body [redacted]');
    expect(message).not.toMatch(/admin:p@ssword|Authorization|Basic abc123|smb:\/\/secret/i);
  });
});
