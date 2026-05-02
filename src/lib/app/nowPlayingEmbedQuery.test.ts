import { describe, expect, test, vi } from 'vitest';

import { parseNowPlayingEmbedQuery } from './nowPlayingEmbedQuery';

const FORBIDDEN_JSON_PATTERN =
  /CHORUS3_SENTINEL_SECRET|SENTINEL_SECRET|admin|p@ssword|Authorization: Basic|Bearer abc|https:\/\/kodi\.example|user@example\.com|raw-password|secret-value/i;

describe('parseNowPlayingEmbedQuery', () => {
  test('accepts valid non-secret theme and locale params', () => {
    expect(parseNowPlayingEmbedQuery('?theme=light&locale=de')).toEqual({
      theme: 'light',
      locale: 'de',
      rejectedCredentialParams: [],
      ignoredParams: []
    });
  });

  test('does not let duplicate or conflicting theme and locale params choose unsafe data', () => {
    expect(parseNowPlayingEmbedQuery('?theme=light&theme=dark&locale=de&locale=en')).toEqual({
      theme: null,
      locale: null,
      rejectedCredentialParams: [],
      ignoredParams: ['theme', 'locale']
    });
  });

  test('tracks unknown safe params by sanitized name only', () => {
    expect(parseNowPlayingEmbedQuery('?m005-browser-proof=1&safe_flag=yes&empty=')).toEqual({
      theme: null,
      locale: null,
      rejectedCredentialParams: [],
      ignoredParams: ['m005-browser-proof', 'safe_flag', 'empty']
    });
  });

  test('ignores invalid theme and locale values without reflecting values', () => {
    const parsed = parseNowPlayingEmbedQuery('?theme=solarized&locale=fr&mode=compact');

    expect(parsed).toEqual({
      theme: null,
      locale: null,
      rejectedCredentialParams: [],
      ignoredParams: ['theme', 'locale', 'mode']
    });
    expect(JSON.stringify(parsed)).not.toMatch(/solarized|fr|compact/);
  });

  test('rejects credential-like names case-insensitively without reflecting values', () => {
    const parsed = parseNowPlayingEmbedQuery(
      '?USERNAME=admin&PASSWORD=CHORUS3_SENTINEL_SECRET&Authorization=Bearer abc&BASIC=1'
    );

    expect(parsed).toEqual({
      theme: null,
      locale: null,
      rejectedCredentialParams: ['USERNAME', 'PASSWORD', 'Authorization', 'BASIC'],
      ignoredParams: []
    });
    expect(JSON.stringify(parsed)).not.toMatch(FORBIDDEN_JSON_PATTERN);
  });

  test('rejects credential-like values under harmless keys without reflecting those values', () => {
    const parsed = parseNowPlayingEmbedQuery(
      '?endpoint=https://kodi.example/jsonrpc&contact=user@example.com&header=Authorization:%20Basic&note=raw-password&api=secret-value'
    );

    expect(parsed).toEqual({
      theme: null,
      locale: null,
      rejectedCredentialParams: ['endpoint', 'contact', 'header', 'note', 'api'],
      ignoredParams: []
    });
    expect(JSON.stringify(parsed)).not.toMatch(FORBIDDEN_JSON_PATTERN);
  });

  test('handles malformed inputs and invalid percent escapes without throwing or reflecting raw input', () => {
    const malformedInputs: unknown[] = [
      null,
      undefined,
      42,
      { raw: '?token=secret' },
      '?bad=%E0%A4%A&=empty&theme=%E0%A4%A'
    ];

    for (const input of malformedInputs) {
      expect(() => parseNowPlayingEmbedQuery(input)).not.toThrow();
      expect(JSON.stringify(parseNowPlayingEmbedQuery(input))).not.toMatch(/token=secret|%E0%A4%A/);
    }
  });

  test('returns a safe default if URLSearchParams throws', () => {
    const original = globalThis.URLSearchParams;
    const throwingSearchParams = vi.fn(() => {
      throw new Error('parser unavailable');
    });

    vi.stubGlobal('URLSearchParams', throwingSearchParams);
    try {
      expect(parseNowPlayingEmbedQuery('?theme=light&password=secret')).toEqual({
        theme: null,
        locale: null,
        rejectedCredentialParams: [],
        ignoredParams: []
      });
    } finally {
      vi.stubGlobal('URLSearchParams', original);
    }
  });

  test('caps and deduplicates rejected and ignored parameter names', () => {
    const search = [
      ...Array.from({ length: 30 }, (_, index) => `unknown${index}=safe`),
      ...Array.from({ length: 30 }, () => 'token=CHORUS3_SENTINEL_SECRET')
    ].join('&');
    const parsed = parseNowPlayingEmbedQuery(`?${search}`);

    expect(parsed.ignoredParams).toHaveLength(20);
    expect(parsed.rejectedCredentialParams).toEqual(['token']);
    expect(JSON.stringify(parsed)).not.toMatch(FORBIDDEN_JSON_PATTERN);
  });
});
