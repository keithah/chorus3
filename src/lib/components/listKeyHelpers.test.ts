import { describe, expect, it } from 'vitest';

import { safeStableKey } from './listKeyHelpers';

describe('listKeyHelpers', () => {
  it('keeps numeric ids in a separate prefixed key space from missing-index fallbacks', () => {
    expect(safeStableKey('movie', 7, 2)).toBe('movie:7');
    expect(safeStableKey('movie', Number.NaN, 7)).toBe('movie:missing:7');
  });
});
