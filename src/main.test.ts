import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY } from './lib/theme/theme';

async function importMain(): Promise<typeof import('./main')> {
  return import('./main');
}

function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`);
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

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setSearch('?m003-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Music Library');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Sinnerman.flac');
  });

  it('mounts populated M003 browser-proof fixtures in test mode when explicitly requested', async () => {
    setSearch('?m003-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Nina Simone');
    expect(document.body.textContent).toContain('Pastel Blues');
    expect(document.body.textContent).toContain('Sinnerman');
    expect(document.body.textContent).toContain('Albums');
    expect(document.body.textContent).toContain('Sinnerman.flac');
    expect(document.body.textContent).toContain('cover.jpg');
    expect(document.body.textContent).toContain('Late Night Jazz.xsp');
    expect(document.body.textContent).toContain('Road Trip.m3u');
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
