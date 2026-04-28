import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App.svelte';
import { DEFAULT_THEME } from './lib/theme/theme';

let mountedComponent: Record<string, unknown> | undefined;

function renderApp() {
  document.body.innerHTML = '<div id="app-test-root"></div>';
  document.documentElement.dataset.theme = DEFAULT_THEME;
  const target = document.getElementById('app-test-root');

  if (!target) {
    throw new Error('Missing test root');
  }

  mountedComponent = mount(App, { target }) as Record<string, unknown>;

  return target;
}

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
});

describe('App shell', () => {
  it('renders the foundation shell and Kodi placeholder status surfaces', () => {
    const target = renderApp();

    expect(target.textContent).toContain('chorus3');
    expect(target.textContent).toContain('Foundation shell');
    expect(target.textContent).toContain('No Kodi host configured yet');
    expect(target.textContent).toContain('Connection');
    expect(target.textContent).toContain('Library sync');
  });

  it('toggles the typed root theme and updates accessible button text', async () => {
    const target = renderApp();
    const button = target.querySelector('button[aria-label]');

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.textContent).toContain('Switch to light theme');

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button?.textContent).toContain('Switch to dark theme');

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button?.textContent).toContain('Switch to light theme');
  });
});
