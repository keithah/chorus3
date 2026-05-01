import { describe, expect, test, vi } from 'vitest';

import {
  M004_BROWSER_PROOF_FORBIDDEN_TEXT,
  createM004BrowserProofAppProps,
  isM004BrowserProofFixtureSecretSafe
} from './m004BrowserProofFixtures';

function collectText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'function') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectText(nested)}`)
      .join('\n');
  }

  return '';
}

describe('createM004BrowserProofAppProps', () => {
  test('creates safe routed video movie grid fixture props with distinctive movie states', () => {
    const props = createM004BrowserProofAppProps({
      pathname: '/video/movies',
      search: '?m004-browser-proof=1'
    });

    expect(props.route).toEqual({ kind: 'videoMovies' });
    expect(props.videoLibrarySnapshot.refreshStatus).toBe('ready');
    expect(props.videoLibrarySnapshot.isEmpty).toBe(false);
    expect(props.videoLibrarySnapshot.movies).toHaveLength(2);
    expect(props.videoLibrarySnapshot.limits.movies.total).toBe(2);

    const labels = props.videoLibrarySnapshot.movies.map((movie) => movie.label);
    expect(labels).toContain('Neon Harbor');
    expect(labels).toContain('Quiet Signal');
    expect(
      props.videoLibrarySnapshot.movies.some(
        (movie) => movie.watched === true || (movie.playcount ?? 0) > 0
      )
    ).toBe(true);
    expect(
      props.videoLibrarySnapshot.movies.some((movie) => (movie.resume?.position ?? 0) > 0)
    ).toBe(true);
    expect(
      props.videoLibrarySnapshot.movies.some(
        (movie) =>
          typeof (movie as typeof movie & { versionCount?: unknown }).versionCount === 'number'
      )
    ).toBe(true);
  });

  test('creates safe direct detail and unknown route variants from location input', () => {
    expect(createM004BrowserProofAppProps({ pathname: '/video/movies/4402' }).route).toEqual({
      kind: 'videoMovieDetail',
      movieid: 4402
    });

    const unknown = createM004BrowserProofAppProps({
      pathname: '/video/smb://admin:p@ssword@example.local/Authorization/SENTINEL_SECRET',
      search: '?token=Basic'
    }).route;

    expect(unknown.kind).toBe('videoUnknown');
    expect(JSON.stringify(unknown)).not.toMatch(
      /smb:\/\/|admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
  });

  test('uses inert navigation dispatch behavior without network or browser storage access', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies' });

    await expect(props.videoNavigationDispatch.openMovieGrid()).resolves.toBeUndefined();
    await expect(
      props.videoNavigationDispatch.openMovieDetail({ movieid: 4401 })
    ).resolves.toBeUndefined();
    await expect(
      props.videoNavigationDispatch.openRoute({ kind: 'videoUnknown', pathLabel: '/video/nope' })
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
  });

  test('keeps every fixture value clear of forbidden text and sentinel secrets', () => {
    const props = createM004BrowserProofAppProps({ pathname: '/video/movies/4401' });
    const text = collectText(props);

    expect(isM004BrowserProofFixtureSecretSafe(props)).toBe(true);
    for (const forbidden of M004_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(text).not.toContain(forbidden);
    }
  });
});
