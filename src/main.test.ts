import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('mounts the Svelte app into the root element', async () => {
    await import('./main');

    expect(document.body.textContent).toContain('chorus3');
  });
});
