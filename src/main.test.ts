import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY } from './lib/theme/theme';

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
  });

  it('mounts the Svelte app into the root element', async () => {
    await import('./main');

    expect(document.body.textContent).toContain('chorus3');
  });

  it('applies the stored root theme before rendering', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    await import('./main');

    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
