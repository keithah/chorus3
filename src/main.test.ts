import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY } from './lib/theme/theme';

async function importMain(): Promise<typeof import('./main')> {
  return import('./main');
}

function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`);
}

function setPathAndSearch(pathname: string, search = ''): void {
  window.history.replaceState({}, '', `${pathname}${search}`);
}

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
    setSearch('');
  });

  it('mounts the Svelte app into the root element', async () => {
    await importMain();

    expect(document.body.textContent).toContain('chorus3');
  });

  it('applies the stored root theme before rendering', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    await importMain();

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('keeps default and disabled fixture query modes on the live/default app props', async () => {
    await importMain();

    expect(document.body.textContent).toContain('Music Library');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Pastel Blues');
    expect(document.body.textContent).not.toContain('Feeling Good');
    expect(document.body.textContent).not.toContain('I Put a Spell on You');
    expect(document.body.textContent).not.toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Quiet Signal');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setSearch('?m003-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Music Library');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Sinnerman.flac');
    expect(document.body.textContent).not.toContain('Feeling Good');
    expect(document.body.textContent).not.toContain('I Put a Spell on You');
    expect(document.body.textContent).not.toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Quiet Signal');
  });

  it('mounts populated M003 browser-proof fixtures in test mode when explicitly requested', async () => {
    setSearch('?m003-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Nina Simone');
    expect(document.body.textContent).toContain('Pastel Blues');
    expect(document.body.textContent).toContain('Sinnerman');
    expect(document.body.textContent).toContain('Recent & Top Music');
    expect(document.body.textContent).toContain('Recently Added');
    expect(document.body.textContent).toContain('Recently Played');
    expect(document.body.textContent).toContain('Most Played');
    expect(document.body.textContent).toContain('Feeling Good');
    expect(document.body.textContent).toContain('I Put a Spell on You');
    expect(document.body.textContent).toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).toContain('Added 2026-04-29 11:22:33');
    expect(document.body.textContent).toContain('Played 2026-04-30 20:15:00');
    expect(document.body.textContent).toContain('Played 12 times');
    expect(document.body.textContent).toContain('Albums');
    expect(document.body.textContent).toContain('Sinnerman.flac');
    expect(document.body.textContent).toContain('cover.jpg');
    expect(document.body.textContent).toContain('Late Night Jazz.xsp');
    expect(document.body.textContent).toContain('Road Trip.m3u');
  });

  it('mounts populated M004 browser-proof fixtures for direct video grid and detail routes in test mode', async () => {
    setPathAndSearch('/video/movies/4401', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Neon Harbor');
    expect(document.body.textContent).toContain(
      'A courier crosses a rain-lit city to protect a copied memory.'
    );
    expect(document.body.textContent).toContain('Science Fiction, Thriller');
    expect(document.body.textContent).toContain('2 versions available');
    expect(document.body.textContent).toContain('Play');
    expect(document.body.textContent).toContain('Resume');
    expect(document.body.textContent).toContain('Queue');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/movies/4402', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Quiet Signal');
    expect(document.body.textContent).toContain('Movie ID 4402');
    expect(document.body.textContent).toContain('Movie versions unsupported');
    expect(document.body.textContent).toContain('Back to movies');
  });

  it('routes unknown video paths to safe in-app not-found UI without raw unsafe input', async () => {
    setPathAndSearch(
      '/video/smb://admin:p@ssword@example.local/Authorization/SENTINEL_SECRET',
      '?m004-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Video route not found');
    expect(document.body.textContent).toContain('Movies');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
  });

  it('exposes M004 pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { resolveEntrypointRoute, shouldUseM004BrowserProofFixtures } = await importMain();

    expect(
      resolveEntrypointRoute({ pathname: '/video/movies/4401', search: '?ignored=1' })
    ).toEqual({
      kind: 'videoMovieDetail',
      movieid: 4401
    });
    expect(resolveEntrypointRoute(undefined)).toEqual({ kind: 'dashboard' });
    expect(
      resolveEntrypointRoute({
        get pathname(): string {
          throw new Error('untrusted location');
        },
        search: '?m004-browser-proof=1'
      }).kind
    ).toBe('dashboard');
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM004BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM004BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('exposes pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { shouldUseM003BrowserProofFixtures } = await importMain();

    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM003BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM003BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('keeps the existing explicit mount error when #app is missing', async () => {
    document.body.innerHTML = '';

    await expect(importMain()).rejects.toThrow(
      'Unable to mount chorus3: #app element was not found.'
    );
  });
});
