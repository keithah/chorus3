import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import HostSettings from './HostSettings.svelte';
import HostSwitcher from './HostSwitcher.svelte';
import { createTranslationContext } from '$lib/i18n';
import { configStore, hostConnectionStore } from '$lib/stores';

let mountedComponent: Record<string, unknown> | undefined;

function renderHostSettings(locale: 'en' | 'de' = 'de'): HTMLElement {
  document.body.innerHTML = '<div id="host-settings-root"></div>';
  const target = document.getElementById('host-settings-root');

  if (!target) {
    throw new Error('Missing host settings test root');
  }

  mountedComponent = mount(HostSettings, {
    target,
    props: { i18n: createTranslationContext(locale) }
  }) as Record<string, unknown>;
  flushSync();

  return target;
}

function renderHostSwitcher(locale: 'en' | 'de' = 'de'): HTMLElement {
  document.body.innerHTML = '<div id="host-switcher-root"></div>';
  const target = document.getElementById('host-switcher-root');

  if (!target) {
    throw new Error('Missing host switcher test root');
  }

  mountedComponent = mount(HostSwitcher, {
    target,
    props: { i18n: createTranslationContext(locale) }
  }) as Record<string, unknown>;
  flushSync();

  return target;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function getButton(target: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === name
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

async function submitHostForm(target: HTMLElement): Promise<void> {
  const form = target.querySelector<HTMLFormElement>('form');
  expect(form).toBeInstanceOf(HTMLFormElement);
  form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  await tick();
}

async function addHost({
  label = 'Wohnzimmer Kodi',
  host = 'kodi.local',
  port = 8080,
  username = 'kodi',
  password = 'super-secret-password',
  useTls = true,
  useWebSocket = false
}: {
  label?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  useTls?: boolean;
  useWebSocket?: boolean;
} = {}): Promise<void> {
  const result = configStore.addHost({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
    host,
    port,
    username,
    password,
    useTls,
    useWebSocket
  });
  expect(result.ok).toBe(true);
  hostConnectionStore.syncActiveHost();
  await tick();
}

beforeEach(() => {
  configStore.reset();
  hostConnectionStore.destroy();
});

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  configStore.reset();
  hostConnectionStore.destroy();
  document.body.innerHTML = '';
});

describe('HostSettings i18n', () => {
  it('renders German host form labels, warnings, empty states, and validation errors without exposing credential-shaped host values', async () => {
    const target = renderHostSettings('de');

    expect(target.textContent).toContain('Kodi-Host-Einstellungen');
    expect(target.textContent).toContain(
      'Zugangsdaten nur auf einem vertrauenswürdigen Gerät speichern.'
    );
    expect(target.textContent).toContain('Noch keine Hosts gespeichert.');
    expect(target.textContent).toContain('0 gespeichert');
    expect(target.querySelector('form')?.getAttribute('aria-label')).toBe(
      'Kodi-Host-Einstellungen'
    );
    expect(target.textContent).toContain('Bezeichnung');
    expect(target.textContent).toContain('HTTP-Port');
    expect(target.textContent).toContain('WebSocket-Benachrichtigungen verwenden');
    expect(target.textContent).not.toContain('Kodi host settings');

    setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, 'Geheimer Host');
    setInputValue(
      target.querySelector<HTMLInputElement>('#host-address')!,
      'https://admin:secret@kodi.local/jsonrpc'
    );
    setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, '70000');
    setInputValue(
      target.querySelector<HTMLInputElement>('#host-username')!,
      'Authorization: Basic secret'
    );
    setInputValue(
      target.querySelector<HTMLInputElement>('#host-password')!,
      'Authorization: Basic secret'
    );
    await submitHostForm(target);

    expect(target.textContent).toContain(
      'Host darf kein Protokoll, keinen Pfad, keine Abfragezeichen und keine Zugangsdaten enthalten.'
    );
    expect(target.textContent).toContain(
      'HTTP-Port muss eine ganze Zahl zwischen 1 und 65535 sein.'
    );
    expect(target.textContent).toContain(
      'Benutzername darf keinen Authorization-Header enthalten.'
    );
    expect(target.textContent).toContain('Passwort darf keinen Authorization-Header enthalten.');
    expect(target.textContent).not.toContain('admin:secret');
    expect(target.textContent).not.toContain('https://admin:secret@kodi.local/jsonrpc');
  });

  it('renders German saved-host row states and keeps saved passwords out of the DOM', async () => {
    await addHost();
    const target = renderHostSettings('de');

    expect(target.textContent).toContain('Gespeicherte Hosts');
    expect(target.textContent).toContain('1 gespeichert');
    expect(target.textContent).toContain('Wohnzimmer Kodi');
    expect(target.textContent).toContain('WebSocket aus');
    expect(target.textContent).toContain('Zugangsdaten gespeichert');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.querySelector('button[aria-label="Wohnzimmer Kodi bearbeiten"]')).toBeInstanceOf(
      HTMLButtonElement
    );
    expect(target.querySelector('button[aria-label="Wohnzimmer Kodi löschen"]')).toBeInstanceOf(
      HTMLButtonElement
    );

    getButton(target, 'Bearbeiten').click();
    await tick();

    expect(target.textContent).toContain('Host aktualisieren');
    expect(target.querySelector<HTMLInputElement>('#host-password')?.placeholder).toBe(
      'Gespeichertes Passwort bleibt erhalten'
    );
    expect(target.textContent).toContain('Bearbeitung abbrechen');
  });

  it('localizes storage-warning codes at the component boundary', () => {
    configStore.storageWarning = {
      code: 'invalid-storage',
      message: 'Saved Kodi host settings were reset because stored data was invalid.'
    };
    const target = renderHostSettings('de');

    expect(target.textContent).toContain(
      'Gespeicherte Kodi-Host-Einstellungen wurden zurückgesetzt, weil die gespeicherten Daten ungültig waren.'
    );
    expect(target.textContent).not.toContain('Saved Kodi host settings were reset');
  });
});

describe('HostSwitcher i18n', () => {
  it('renders German empty and no-active-host states', () => {
    const target = renderHostSwitcher('de');

    expect(target.textContent).toContain('Aktiver Endpunkt');
    expect(target.textContent).toContain('Host-Umschalter');
    expect(target.textContent).toContain('Kein aktiver Host ausgewählt');
    expect(target.textContent).toContain(
      'Noch keine Hosts gespeichert. Host-Wechselsteuerung erscheint nach dem ersten Speichern.'
    );
    expect(target.textContent).not.toContain('No active host selected');
  });

  it('renders German saved-host action labels, status details, and active summary without exposing passwords', async () => {
    await addHost({ useWebSocket: true });
    const target = renderHostSwitcher('de');

    expect(target.textContent).toContain('Aktiver Host');
    expect(target.textContent).toContain('Wohnzimmer Kodi');
    expect(target.textContent).toContain('WebSocket aktiviert');
    expect(target.textContent).toContain('Zugangsdaten konfiguriert');
    expect(target.textContent).toContain('Nicht getestet');
    expect(target.textContent).toContain(
      'Sichere HTTP-JSON-RPC-Diagnose vor dem Wechsel ausführen'
    );
    expect(target.textContent).toContain('WebSocket an');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.querySelector('button[aria-label="Wohnzimmer Kodi testen"]')).toBeInstanceOf(
      HTMLButtonElement
    );
    expect(target.querySelector('button[aria-label="Wohnzimmer Kodi aktivieren"]')).toBeInstanceOf(
      HTMLButtonElement
    );
  });
});
