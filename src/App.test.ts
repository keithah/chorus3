import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App.svelte';
import { connectionStore } from './lib/stores';
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

beforeEach(() => {
  connectionStore.destroy();
});

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  connectionStore.destroy();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
});

describe('App shell', () => {
  it('renders the shell with store-backed idle Kodi connection diagnostics', () => {
    const target = renderApp();

    expect(target.textContent).toContain('chorus3');
    expect(target.textContent).toContain('Foundation shell');
    expect(target.textContent).toContain('No Kodi host configured yet');
    expect(target.textContent).toContain('Connection');
    expect(target.textContent).toContain('no host');
    expect(target.textContent).toContain(
      'Configure a Kodi host in the upcoming host settings slice'
    );
    expect(target.textContent).toContain('HTTP and WebSocket checks are idle');
    expect(target.textContent).not.toContain('S03 will replace this placeholder');
    expect(target.textContent).toContain('Library sync');
  });

  it('renders degraded WebSocket diagnostics from the shared connection store', async () => {
    connectionStore.status = 'degraded';
    connectionStore.webSocketDegraded = true;
    connectionStore.reconnectAttempt = 3;
    connectionStore.lastConnectedAt = '2026-04-28T07:00:00.000Z';
    connectionStore.kodiVersion = { major: 21, minor: 1 };
    connectionStore.lastError = {
      source: 'websocket',
      code: 'closed',
      message: 'Kodi WebSocket closed unexpectedly (code 1006).',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      }
    };

    const target = renderApp();
    await tick();

    expect(target.textContent).toContain('degraded');
    expect(target.textContent).toContain('WebSocket degraded after HTTP diagnostics succeeded');
    expect(target.textContent).toContain('retry attempt 3');
    expect(target.textContent).toContain('Last connected 2026-04-28T07:00:00.000Z');
    expect(target.textContent).toContain('Kodi 21.1');
    expect(target.textContent).not.toContain('admin:secret');
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
