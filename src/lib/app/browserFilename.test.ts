import { describe, expect, it } from 'vitest';

import { safeBrowserFilename } from './browserFilename';

describe('safeBrowserFilename', () => {
  it('sanitizes fallback labels when the primary label is empty', () => {
    expect(safeBrowserFilename('   ', 'http://admin:p@ssword@example.test/My Movie.mkv')).toBe(
      'http-admin-p-ssword-example.test-My-Movie.mkv'
    );
  });

  it('uses a stable safe default when both labels normalize empty', () => {
    expect(safeBrowserFilename('///', '***')).toBe('download');
  });
});
