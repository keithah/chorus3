import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import HelpPage from './HelpPage.svelte';
import type { BuildAppRouteOptions } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { ConnectionStoreSnapshot } from '$lib/stores/connection.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

const HELP_TOPIC_CASES = [
  [{ kind: 'help' }, 'About Chorus 3', 'Status report', 'What is Chorus?', 'Bugs and Features'],
  [
    { kind: 'helpOverview' },
    'About Chorus 3',
    'Status report',
    'What is Chorus?',
    'Bugs and Features'
  ],
  [
    { kind: 'helpPage', pageid: 'overview' },
    'About Chorus 3',
    'Status report',
    'What is Chorus?',
    'Bugs and Features'
  ],
  [
    { kind: 'helpPage', pageid: 'app-readme' },
    'Kodi Web Interface - Chorus 3',
    'Streaming',
    'Kodi API browser',
    undefined
  ],
  [
    { kind: 'helpPage', pageid: 'app-changelog' },
    'Version 3.0.14',
    'multi-section metadata editor',
    'Added support for music videos',
    undefined
  ],
  [
    { kind: 'helpPage', pageid: 'keybind-readme' },
    'Key Binds',
    'Cursor LEFT = Direction LEFT',
    'Browser',
    undefined
  ],
  [
    { kind: 'helpPage', pageid: 'addons' },
    'Add-on Support',
    'Custom Add-on Search',
    'Enabling and disabling Add-ons',
    undefined
  ],
  [
    { kind: 'helpPage', pageid: 'developers' },
    'Developers information',
    'Docker dev environment',
    'Committing your changes',
    undefined
  ],
  [
    { kind: 'helpPage', pageid: 'lang-readme' },
    'Translations',
    'Where are the language files?',
    'Fallback',
    undefined
  ],
  [
    { kind: 'helpPage', pageid: 'license' },
    'Chorus 3 License',
    'Included Images',
    'Included Libraries',
    undefined
  ]
] as const satisfies readonly [PrimaryRoute, string, string, string, string?][];

const HELP_ALIAS_CASES = [
  [{ kind: 'helpPage', pageid: 'readme' }, 'Kodi Web Interface - Chorus 3'],
  [{ kind: 'helpPage', pageid: 'changelog' }, 'Version 3.0.13'],
  [{ kind: 'helpPage', pageid: 'keyboard' }, 'Key Binds'],
  [{ kind: 'helpPage', pageid: 'translations' }, 'Translations']
] as const satisfies readonly [PrimaryRoute, string][];

const FORBIDDEN_COPY =
  /Authorization|Basic|token|password|CHORUS3_SENTINEL_SECRET|smb:\/\/|special:\/\/|localStorage|sessionStorage|jsonrpc|Input\.SendText|admin:p@ssword/i;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function renderPage(
  route: PrimaryRoute,
  buildOptions: BuildAppRouteOptions = { routeMode: 'hash' },
  connectionSnapshot: ConnectionStoreSnapshot | null = null
): void {
  mounted = mount(HelpPage, {
    target: document.body,
    props: { route, buildOptions, connectionSnapshot }
  });
}

function text(): string {
  return document.body.textContent ?? '';
}

describe('HelpPage', () => {
  it.each(HELP_TOPIC_CASES)(
    'renders Chorus help topic content for %s',
    (route, heading, firstCopy, secondCopy, thirdCopy) => {
      renderPage(route);

      expect(text()).toContain(heading);
      expect(text()).toContain(firstCopy);
      expect(text()).toContain(secondCopy);
      if (thirdCopy) {
        expect(text()).toContain(thirdCopy);
      }
    }
  );

  it.each(HELP_ALIAS_CASES)(
    'keeps legacy package verifier aliases working for %s',
    (route, copy) => {
      renderPage(route);

      expect(text()).toContain(copy);
    }
  );

  it('renders the Chorus help topic sidebar in the expected order', () => {
    renderPage({ kind: 'help' });

    const links = [...document.querySelectorAll('.help-sidebar a')].map((link) => ({
      text: link.textContent,
      href: link.getAttribute('href')
    }));

    expect(links).toEqual([
      { text: 'About', href: '#help' },
      { text: 'Readme', href: '#help/app-readme' },
      { text: 'Changelog', href: '#help/app-changelog' },
      { text: 'Keyboard', href: '#help/keybind-readme' },
      { text: 'Add-ons', href: '#help/addons' },
      { text: 'Developers', href: '#help/developers' },
      { text: 'Translations', href: '#help/lang-readme' },
      { text: 'License', href: '#help/license' }
    ]);
  });

  it('keeps the About status report aligned with the HTML5-only local player decision', () => {
    renderPage({ kind: 'help' }, { routeMode: 'hash' }, createConnectedSnapshot());

    const content = text();
    expect(content).toContain('Kodi 22.0.0');
    expect(content).toContain('Chorus 3.0.14');
    expect(content).not.toContain('Connected Kodi version is shown on the Home connection card');
    expect(content).toContain('HTML 5');
    expect(content).not.toMatch(/\bVLC\b|DivX/i);
  });

  it('rewrites imported help body links through standalone path-mode routes', () => {
    renderPage({ kind: 'helpPage', pageid: 'addons' }, { routeMode: 'path' });

    const links = [...document.querySelectorAll('.help-content a')].map((link) =>
      link.getAttribute('href')
    );

    expect(links).toContain('/addons/all');
    expect(links).toContain('/browser');
    expect(links).toContain('/settings/search');
    expect(links).toContain('/settings/addons');
    expect(links.some((href) => href?.startsWith('#settings'))).toBe(false);
  });

  it('uses safe generic copy for unknown safe help ids without reflecting the raw id', () => {
    renderPage({ kind: 'helpPage', pageid: 'safe-custom-topic' });

    expect(text()).toContain('Help page');
    expect(text()).toContain('This help route is supported by a safe app-native frame.');
    expect(text()).not.toContain('safe-custom-topic');
    expect(text()).not.toMatch(FORBIDDEN_COPY);
  });

  it('redacts unsafe help ids from visible generic fallback copy', () => {
    renderPage({ kind: 'helpPage', pageid: 'Authorization-Basic-CHORUS3_SENTINEL_SECRET' });

    expect(text()).toContain('Help page');
    expect(text()).not.toContain('Authorization');
    expect(text()).not.toContain('CHORUS3_SENTINEL_SECRET');
    expect(text()).not.toMatch(FORBIDDEN_COPY);
  });
});

function createConnectedSnapshot(): ConnectionStoreSnapshot {
  return {
    status: 'connected',
    lastError: null,
    kodiVersion: { major: 22, minor: 0, patch: 0 },
    applicationName: 'Kodi',
    lastConnectedAt: '2026-05-26T00:00:00.000Z',
    reconnectAttempt: 0,
    webSocketDegraded: false,
    endpoint: {
      protocol: 'http:',
      host: '127.0.0.1',
      port: 8080,
      path: '/jsonrpc',
      hasCredentials: false,
      timeoutMs: 5000
    },
    webSocketEndpoint: null
  };
}
