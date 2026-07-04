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

  it('escapes characters that can break quoted CSS url literals', () => {
    expect(optionalKodiImageUrl("image://Ocean's (Eleven).jpg/")).toBe(
      '/image/image%3A%2F%2FOcean%27s%20%28Eleven%29.jpg%2F'
    );
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
