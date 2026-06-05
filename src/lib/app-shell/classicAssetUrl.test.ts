import { describe, expect, it } from 'vitest';

import { classicPublicAssetUrl } from './classicAssetUrl';

describe('classicPublicAssetUrl', () => {
  it('serves public classic assets from the Vite dev public root', () => {
    expect(classicPublicAssetUrl('/images/fanart_default/tweeter.jpg', import.meta.url)).toBe(
      '/classic-assets/images/fanart_default/tweeter.jpg'
    );
  });
});
