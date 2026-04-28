import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import App from './App.svelte';
import { configStore, connectionStore, createConfigStore, hostConnectionStore } from './lib/stores';
import { DEFAULT_THEME } from './lib/theme/theme';

let mountedComponent: Record<string, unknown> | undefined;

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

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

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

function createKodiFetchMock(): FetchMock {
  return vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
    async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { id?: number; method?: string };

      switch (body.method) {
        case 'JSONRPC.Ping':
          return jsonResponse({ jsonrpc: '2.0', id: body.id, result: 'pong' });
        case 'JSONRPC.Version':
          return jsonResponse({ jsonrpc: '2.0', id: body.id, result: { version: '2.0' } });
        case 'Application.GetProperties':
          return jsonResponse({
            jsonrpc: '2.0',
            id: body.id,
            result: { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 55, muted: false }
          });
        default:
          return jsonResponse({
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32601, message: 'Method not found' }
          });
      }
    }
  );
}

async function waitForText(target: HTMLElement, text: string): Promise<void> {
  await vi.waitFor(() => {
    expect(target.textContent).toContain(text);
  });
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function setCheckbox(input: HTMLInputElement, checked: boolean): void {
  input.checked = checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function submitHostForm(target: HTMLElement): Promise<void> {
  const form = target.querySelector<HTMLFormElement>('form[aria-label="Kodi host settings"]');
  expect(form).toBeInstanceOf(HTMLFormElement);
  form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  await tick();
}

async function addHost(
  target: HTMLElement,
  {
    label = 'Living Room Kodi',
    host = 'kodi.local',
    port = '8080',
    username = 'kodi',
    password = 'super-secret-password',
    useWebSocket = false
  }: {
    label?: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    useWebSocket?: boolean;
  } = {}
): Promise<void> {
  setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, label);
  setInputValue(target.querySelector<HTMLInputElement>('#host-address')!, host);
  setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, port);
  setInputValue(target.querySelector<HTMLInputElement>('#host-username')!, username);
  setInputValue(target.querySelector<HTMLInputElement>('#host-password')!, password);
  setCheckbox(target.querySelector<HTMLInputElement>('#host-websocket')!, useWebSocket);
  await submitHostForm(target);
}

beforeEach(() => {
  vi.restoreAllMocks();
  configStore.reset();
  hostConnectionStore.destroy();
  connectionStore.destroy();
});

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  hostConnectionStore.destroy();
  configStore.reset();
  connectionStore.destroy();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('renders the shell with store-backed idle Kodi connection diagnostics and host controls', () => {
    const target = renderApp();

    expect(target.textContent).toContain('chorus3');
    expect(target.textContent).toContain('Multi-host console');
    expect(target.textContent).toContain('No Kodi host configured yet');
    expect(target.textContent).toContain('Connection');
    expect(target.textContent).toContain('no host');
    expect(target.textContent).toContain('Add a trusted Kodi host to begin HTTP diagnostics');
    expect(target.textContent).toContain('HTTP and WebSocket checks are idle');
    expect(target.textContent).not.toContain('S03 will replace this placeholder');
    expect(target.textContent).not.toContain('upcoming host settings slice');
    expect(target.textContent).toContain('Library sync');
    expect(target.textContent).toContain('Kodi host settings');
    expect(target.textContent).toContain('Only save credentials on a trusted device');
  });

  it('validates host fields accessibly and rejects credential-bearing host text', async () => {
    const target = renderApp();

    await submitHostForm(target);

    const labelInput = target.querySelector<HTMLInputElement>('#host-label');
    const hostInput = target.querySelector<HTMLInputElement>('#host-address');
    expect(labelInput?.getAttribute('aria-invalid')).toBe('true');
    expect(labelInput?.getAttribute('aria-describedby')).toContain('host-label-error');
    expect(hostInput?.getAttribute('aria-invalid')).toBe('true');
    expect(target.textContent).toContain('Label is required.');
    expect(target.textContent).toContain('Host is required.');

    setInputValue(labelInput!, 'Office Kodi');
    setInputValue(hostInput!, 'http://admin:secret@kodi.local/jsonrpc');
    setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, '70000');
    await submitHostForm(target);

    expect(target.textContent).toContain(
      'Host must not include a protocol, path, query string, or credentials.'
    );
    expect(target.textContent).toContain('HTTP port must be an integer between 1 and 65535.');
    expect(target.textContent).not.toContain('admin:secret');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('adds, tests, activates, edits, and deletes saved hosts without exposing secrets', async () => {
    const fetchMock = createKodiFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const target = renderApp();

    await addHost(target);

    expect(target.textContent).toContain('Living Room Kodi');
    expect(target.textContent).toContain('kodi.local:8080');
    expect(target.textContent).toContain('Credentials saved');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.textContent).not.toContain('Basic ');

    target.querySelector<HTMLButtonElement>('button[aria-label="Test Living Room Kodi"]')?.click();
    await waitForText(target, 'Test passed');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(target.textContent).toContain('Test passed');
    expect(target.textContent).toContain('Kodi 21.1');
    expect(target.textContent).toContain('Application Kodi');

    const activateButton = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Activate Living Room Kodi"]'
    );
    activateButton?.click();
    await waitForText(target, 'connected');

    expect(target.textContent).toContain('Active host');
    expect(target.textContent).toContain('connected');
    expect(target.textContent).toContain('Kodi HTTP diagnostics are connected. Kodi 21.1');

    target.querySelector<HTMLButtonElement>('button[aria-label="Edit Living Room Kodi"]')?.click();
    await tick();
    setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, 'Media Room Kodi');
    await submitHostForm(target);

    expect(target.textContent).toContain('Media Room Kodi');
    expect(target.textContent).not.toContain('super-secret-password');

    target.querySelector<HTMLButtonElement>('button[aria-label="Delete Media Room Kodi"]')?.click();
    await tick();

    expect(target.textContent).toContain('No saved hosts yet');
    expect(target.textContent).toContain('No active host selected');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('shows safe host test and connection failures while preserving saved-host controls', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(jsonResponse({ ok: false }, { status: 401, statusText: 'Unauthorized' }))
    );
    const target = renderApp();

    await addHost(target, { label: 'Failed Kodi', host: 'failed.local', password: 'bad-password' });

    target.querySelector<HTMLButtonElement>('button[aria-label="Test Failed Kodi"]')?.click();
    await waitForText(target, 'Test failed');

    expect(target.textContent).toContain('Test failed');
    expect(target.textContent).toContain(
      'Kodi rejected the configured username or password while calling JSONRPC.Ping.'
    );
    expect(
      target.querySelector<HTMLButtonElement>('button[aria-label="Test Failed Kodi"]')
    ).not.toBe(null);

    target.querySelector<HTMLButtonElement>('button[aria-label="Activate Failed Kodi"]')?.click();
    await waitForText(target, 'Kodi connection failed (http/auth)');

    expect(target.textContent).toContain('failed');
    expect(target.textContent).toContain('Kodi connection failed (http/auth)');
    expect(target.textContent).not.toContain('bad-password');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('renders storage recovery warnings without raw localStorage content', () => {
    const rawSecret = '{"hosts":[{"password":"raw-local-storage-secret"}]}';
    window.localStorage.setItem('chorus3.kodi.hosts', rawSecret);
    const recoveredStore = createConfigStore({ storage: window.localStorage });
    configStore.storageWarning = recoveredStore.snapshot.storageWarning;

    const target = renderApp();

    expect(target.textContent).toContain(
      'Saved Kodi host settings were reset because stored data was invalid.'
    );
    expect(target.textContent).not.toContain('raw-local-storage-secret');
    expect(target.textContent).not.toContain(rawSecret);
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
    const button = target.querySelector('button[aria-label^="Switch to"]');

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
