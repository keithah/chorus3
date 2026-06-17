import { describe, expect, it } from 'vitest';

import {
  firstOptionalKodiImageUrl,
  optionalKodiImageUrl,
  resolveKodiImageUrl
} from './kodiImageUrl';

describe('kodiImageUrl', () => {
  it('builds proxied URLs for trimmed Kodi art paths', () => {
    expect(optionalKodiImageUrl('image://foo.jpg/')).toBe('/image/image%3A%2F%2Ffoo.jpg%2F');
  });

  it('returns undefined for empty or non-string values', () => {
    expect(optionalKodiImageUrl('')).toBeUndefined();
    expect(optionalKodiImageUrl('   ')).toBeUndefined();
    expect(optionalKodiImageUrl(null)).toBeUndefined();
  });

  it('preserves already-proxied URLs', () => {
    expect(resolveKodiImageUrl('/image/poster.jpg')).toBe('/image/poster.jpg');
    expect(resolveKodiImageUrl('raw.jpg')).toBe('/image/raw.jpg');
  });

  it('returns the first available art field URL', () => {
    expect(firstOptionalKodiImageUrl('', 'thumb.jpg', 'poster.jpg')).toBe('/image/thumb.jpg');
  });
});
