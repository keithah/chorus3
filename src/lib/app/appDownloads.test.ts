import { describe, expect, it, vi } from 'vitest';

import { exportLocalPlaylistM3u, startBrowserDownload } from './appDownloads';

function fakeDocument() {
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

  return { anchor, appended, click, document, remove };
}

describe('app downloads', () => {
  it('starts browser downloads with noopener anchors', () => {
    const { anchor, appended, click, document, remove } = fakeDocument();

    startBrowserDownload(document, 'blob:playlist', 'Browser-Jazz.m3u');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(anchor).toMatchObject({
      href: 'blob:playlist',
      download: 'Browser-Jazz.m3u',
      rel: 'noopener'
    });
    expect(appended).toEqual([anchor]);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('exports playable local playlist items as an M3U file and revokes the URL', async () => {
    const { anchor, click, document, remove } = fakeDocument();
    const originalBlob = globalThis.Blob;
    const blobs: Array<{ parts: BlobPart[]; options?: BlobPropertyBag }> = [];
    const urlApi = {
      createObjectURL: vi.fn((blob: Blob) => {
        blobs.push(blob as unknown as { parts: BlobPart[]; options?: BlobPropertyBag });
        return 'blob:playlist';
      }),
      revokeObjectURL: vi.fn()
    };

    vi.stubGlobal(
      'Blob',
      class FakeBlob {
        constructor(
          readonly parts: BlobPart[],
          readonly options?: BlobPropertyBag
        ) {}
      }
    );

    try {
      exportLocalPlaylistM3u(document, urlApi, ' Browser Jazz/Live ', [
        {
          id: 'bad',
          kind: 'audio',
          label: 'Missing file',
          durationSeconds: 10,
          file: '',
          position: 0
        },
        {
          id: 'one',
          kind: 'audio',
          label: 'Blue in Green',
          durationSeconds: 327.9,
          file: 'smb://nas/music/blue.flac',
          position: 1
        }
      ]);
    } finally {
      vi.stubGlobal('Blob', originalBlob);
    }

    expect(anchor.download).toBe('Browser-Jazz-Live.m3u');
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:playlist');
    expect(blobs[0]).toMatchObject({
      options: { type: 'audio/x-mpegurl;charset=utf-8' }
    });
    expect(blobs[0]?.parts.join('')).toBe(
      '#EXTCPlayListM3U::M3U\n#EXTINF:327,Blue in Green\nsmb://nas/music/blue.flac\n'
    );
  });

  it('skips local playlist export when no playable files are available', () => {
    const { click, document } = fakeDocument();
    const urlApi = {
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn()
    };

    exportLocalPlaylistM3u(document, urlApi, 'Empty', [
      { id: 'bad', kind: 'audio', label: 'Missing file', file: '', position: 0 }
    ]);

    expect(click).not.toHaveBeenCalled();
    expect(urlApi.createObjectURL).not.toHaveBeenCalled();
    expect(urlApi.revokeObjectURL).not.toHaveBeenCalled();
  });
});
