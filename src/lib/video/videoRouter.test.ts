import { describe, expect, test, vi } from 'vitest';
import {
  buildVideoRoute,
  isVideoRoute,
  navigateVideoRoute,
  parseVideoRoute,
  type VideoRoute
} from './videoRouter';

describe('parseVideoRoute', () => {
  test('parses the dashboard route from root paths without using query identity', () => {
    expect(parseVideoRoute('/')).toEqual({ kind: 'dashboard' });
    expect(parseVideoRoute('', '?m004-browser-proof=1')).toEqual({ kind: 'dashboard' });
    expect(parseVideoRoute(undefined, undefined)).toEqual({ kind: 'dashboard' });
  });

  test('parses the video movies grid route with or without fixture search params', () => {
    expect(parseVideoRoute('/video/movies')).toEqual({ kind: 'videoMovies' });
    expect(parseVideoRoute('/video/movies', '?m004-browser-proof=1')).toEqual({
      kind: 'videoMovies'
    });
  });

  test('parses finite positive integer movie detail routes including a trailing slash', () => {
    expect(parseVideoRoute('/video/movies/42')).toEqual({
      kind: 'videoMovieDetail',
      movieid: 42
    });
    expect(parseVideoRoute('/video/movies/42/')).toEqual({
      kind: 'videoMovieDetail',
      movieid: 42
    });
    expect(parseVideoRoute(`/video/movies/${Number.MAX_SAFE_INTEGER}`)).toEqual({
      kind: 'videoMovieDetail',
      movieid: Number.MAX_SAFE_INTEGER
    });
  });

  test('parses finite positive integer movie stream routes with query ignored', () => {
    expect(parseVideoRoute('/video/movies/42/stream')).toEqual({
      kind: 'videoMovieStream',
      movieid: 42
    });
    expect(parseVideoRoute('/video/movies/42/stream?m004-browser-proof=1')).toEqual({
      kind: 'videoMovieStream',
      movieid: 42
    });
    expect(parseVideoRoute('/video/movies/42/stream', '?token=Authorization')).toEqual({
      kind: 'videoMovieStream',
      movieid: 42
    });
    expect(parseVideoRoute(`/video/movies/${Number.MAX_SAFE_INTEGER}/stream`)).toEqual({
      kind: 'videoMovieStream',
      movieid: Number.MAX_SAFE_INTEGER
    });
  });

  test('parses a trailing slash movie stream route as the same route identity', () => {
    expect(parseVideoRoute('/video/movies/42/stream/')).toEqual({
      kind: 'videoMovieStream',
      movieid: 42
    });
  });

  test.each([
    '/video/movies/0',
    '/video/movies/-1',
    '/video/movies/NaN',
    '/video/movies/Infinity',
    '/video/movies/not-a-number',
    '/video/movies/%2F42',
    '/video/movies/42/extra',
    '/video/movies/42/stream/extra',
    '/video/movies/42/Stream',
    '/video/movies/42/download',
    '/video/movies/0/stream',
    '/video/movies/-1/stream',
    '/video/movies/NaN/stream',
    '/video/movies/Infinity/stream',
    '/video/movies/%2F42/stream',
    '/video/movies/',
    '/video/movies//'
  ])('normalizes malformed movie route %s to a safe unknown video route', (pathname) => {
    const route = parseVideoRoute(pathname, '?token=Authorization%20Basic%20SENTINEL_SECRET');

    expect(route.kind).toBe('videoUnknown');
    expect(route).toHaveProperty('pathLabel');
    expect(JSON.stringify(route)).not.toMatch(/Authorization|Basic|SENTINEL_SECRET|token=/i);
    expect(JSON.stringify(route)).not.toContain('%2F');
  });

  test('normalizes unknown video paths without preserving raw unsafe strings', () => {
    const route = parseVideoRoute(
      '/video/smb://admin:p@ssword@example.local/Authorization/Basic/SENTINEL_SECRET'
    );

    expect(route.kind).toBe('videoUnknown');
    if (route.kind !== 'videoUnknown') {
      throw new Error('expected unknown video route');
    }
    expect(route.pathLabel).toBe('/video/[redacted]/[redacted]/[redacted]/[redacted]');
    expect(JSON.stringify(route)).not.toMatch(
      /smb:\/\/|admin:p@ssword|Authorization|Basic|SENTINEL_SECRET/i
    );
  });

  test('does not throw for malformed path or search inputs', () => {
    expect(() => parseVideoRoute('/video/movies/42', '%%%')).not.toThrow();
    expect(() => parseVideoRoute({ raw: '/video/movies/42' } as unknown as string)).not.toThrow();
    expect(parseVideoRoute({ raw: '/video/movies/42' } as unknown as string).kind).toBe(
      'videoUnknown'
    );
  });
});

describe('buildVideoRoute', () => {
  test.each<[VideoRoute, string]>([
    [{ kind: 'dashboard' }, '/'],
    [{ kind: 'videoMovies' }, '/video/movies'],
    [{ kind: 'videoMovieDetail', movieid: 42 }, '/video/movies/42'],
    [{ kind: 'videoMovieStream', movieid: 42 }, '/video/movies/42/stream'],
    [
      { kind: 'videoMovieDetail', movieid: Number.MAX_SAFE_INTEGER },
      `/video/movies/${Number.MAX_SAFE_INTEGER}`
    ],
    [
      { kind: 'videoMovieStream', movieid: Number.MAX_SAFE_INTEGER },
      `/video/movies/${Number.MAX_SAFE_INTEGER}/stream`
    ],
    [{ kind: 'videoUnknown', pathLabel: '/video/tv' }, '/video/tv']
  ])('builds %j as %s', (route, expectedPath) => {
    expect(buildVideoRoute(route)).toBe(expectedPath);
  });

  test.each<VideoRoute>([
    { kind: 'dashboard' },
    { kind: 'videoMovies' },
    { kind: 'videoMovieDetail', movieid: 42 },
    { kind: 'videoMovieStream', movieid: 42 }
  ])('round trips %j through parse/build', (route) => {
    expect(parseVideoRoute(buildVideoRoute(route))).toEqual(route);
  });

  test('normalizes invalid detail routes and unsafe unknown labels when building', () => {
    expect(buildVideoRoute({ kind: 'videoMovieDetail', movieid: 0 })).toBe('/video/unknown');
    expect(buildVideoRoute({ kind: 'videoMovieStream', movieid: 0 })).toBe('/video/unknown');
    expect(buildVideoRoute({ kind: 'videoUnknown', pathLabel: '/video/Authorization/Basic' })).toBe(
      '/video/[redacted]/[redacted]'
    );
    expect(() => buildVideoRoute({ kind: 'unexpected' } as unknown as VideoRoute)).not.toThrow();
  });
});

describe('isVideoRoute', () => {
  test.each<VideoRoute>([
    { kind: 'videoMovies' },
    { kind: 'videoMovieDetail', movieid: 1 },
    { kind: 'videoMovieStream', movieid: 1 },
    { kind: 'videoUnknown', pathLabel: '/video/tv' }
  ])('returns true for video route %j', (route) => {
    expect(isVideoRoute(route)).toBe(true);
  });

  test('returns false for dashboard and malformed values', () => {
    expect(isVideoRoute({ kind: 'dashboard' })).toBe(false);
    expect(isVideoRoute(null)).toBe(false);
    expect(isVideoRoute({ kind: 'videoMovieDetail', movieid: 0 })).toBe(false);
    expect(isVideoRoute({ kind: 'videoMovieStream', movieid: 0 })).toBe(false);
  });
});

describe('navigateVideoRoute', () => {
  test('pushes built routes only when an explicit history object is available', () => {
    const pushState = vi.fn();

    expect(
      navigateVideoRoute({ kind: 'videoMovieDetail', movieid: 42 }, { history: { pushState } })
    ).toBe(true);

    expect(pushState).toHaveBeenCalledWith(
      { routeKind: 'videoMovieDetail' },
      '',
      '/video/movies/42'
    );
  });

  test('returns false instead of throwing when History API support is missing or throws', () => {
    expect(navigateVideoRoute({ kind: 'videoMovies' }, { history: undefined })).toBe(false);
    expect(
      navigateVideoRoute(
        { kind: 'videoMovies' },
        {
          history: {
            pushState: () => {
              throw new Error('history unavailable');
            }
          }
        }
      )
    ).toBe(false);
  });
});
