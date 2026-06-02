import { describe, expect, it } from 'vitest';

import type { KodiJsonRpcHttpClient } from '$lib/kodi';
import { getPagedFileDirectory } from './mediaDirectoryPages';

type CallRecord = {
  method: string;
  params?: unknown;
};

class FakeKodiClient implements KodiJsonRpcHttpClient {
  readonly calls: CallRecord[] = [];
  readonly responses: unknown[] = [];

  enqueue(response: unknown): void {
    this.responses.push(response);
  }

  async call<TResult>(method: string, params?: unknown): Promise<TResult> {
    this.calls.push(params === undefined ? { method } : { method, params });
    const response = this.responses.shift();
    if (response === undefined) {
      throw new Error(`Unexpected Kodi call: ${method}`);
    }

    return response as TResult;
  }
}

describe('media directory pagination', () => {
  it('fetches follow-up file directory pages until Kodi reports the full total', async () => {
    const client = new FakeKodiClient();
    client.enqueue({
      files: [{ file: 'smb://media/first.mp3', filetype: 'file', label: 'First' }],
      limits: { start: 0, end: 500, total: 501 }
    });
    client.enqueue({
      files: [{ file: 'smb://media/last.mp3', filetype: 'file', label: 'Last' }],
      limits: { start: 500, end: 501, total: 501 }
    });

    const result = await getPagedFileDirectory(client, {
      directory: 'smb://media/',
      media: 'music',
      properties: ['title'],
      sort: { method: 'label', order: 'ascending' }
    });

    expect(client.calls).toEqual([
      {
        method: 'Files.GetDirectory',
        params: {
          directory: 'smb://media/',
          media: 'music',
          properties: ['title'],
          sort: { method: 'label', order: 'ascending' },
          limits: { start: 0, end: 500 }
        }
      },
      {
        method: 'Files.GetDirectory',
        params: {
          directory: 'smb://media/',
          media: 'music',
          properties: ['title'],
          sort: { method: 'label', order: 'ascending' },
          limits: { start: 500, end: 501 }
        }
      }
    ]);
    expect(result.files?.map((file) => file.label)).toEqual(['First', 'Last']);
    expect(result.limits).toEqual({ start: 0, end: 501, total: 501 });
  });

  it('returns a single page when Kodi does not report limits', async () => {
    const client = new FakeKodiClient();
    client.enqueue({
      files: [{ file: 'smb://media/only.mp3', filetype: 'file', label: 'Only' }]
    });

    const result = await getPagedFileDirectory(client, {
      directory: 'smb://media/',
      media: 'music'
    });

    expect(client.calls).toEqual([
      {
        method: 'Files.GetDirectory',
        params: {
          directory: 'smb://media/',
          media: 'music',
          limits: { start: 0, end: 500 }
        }
      }
    ]);
    expect(result.files?.map((file) => file.label)).toEqual(['Only']);
    expect(result.limits).toBeUndefined();
  });

  it('rejects incomplete multi-page responses instead of returning partial files', async () => {
    const client = new FakeKodiClient();
    client.enqueue({
      files: [{ file: 'smb://media/first.mp3', filetype: 'file', label: 'First' }],
      limits: { start: 0, end: 500, total: 501 }
    });
    client.enqueue({
      files: [{ file: 'smb://media/stalled.mp3', filetype: 'file', label: 'Stalled' }],
      limits: { start: 500, end: 500, total: 501 }
    });

    await expect(
      getPagedFileDirectory(client, {
        directory: 'smb://media/',
        media: 'music'
      })
    ).rejects.toThrow('stalled directory pagination limits');
  });
});
