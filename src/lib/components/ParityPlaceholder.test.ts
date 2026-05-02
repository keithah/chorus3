import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { createTranslationContext } from '$lib/i18n';
import {
  getChorus2PlaceholderMetadata,
  getChorus2PlaceholderMetadataTable,
  type Chorus2RoutePlaceholder
} from '$lib/app/appRouter';
import ParityPlaceholder from './ParityPlaceholder.svelte';

let mountedComponent: Record<string, unknown> | undefined;

function renderPlaceholder(
  placeholder: Chorus2RoutePlaceholder,
  props: Partial<{
    packageBasePath: string;
    i18n: ReturnType<typeof createTranslationContext>;
  }> = {}
): HTMLElement {
  document.body.innerHTML = '<div id="parity-placeholder-root"></div>';
  const target = document.getElementById('parity-placeholder-root');

  if (!target) {
    throw new Error('Missing parity placeholder test root');
  }

  mountedComponent = mount(ParityPlaceholder, {
    target,
    props: {
      placeholder,
      ...props
    }
  }) as Record<string, unknown>;
  flushSync();

  return target;
}

function requirePlaceholder(id: string): Chorus2RoutePlaceholder {
  const placeholder = getChorus2PlaceholderMetadata(id);
  expect(placeholder).toBeDefined();
  return placeholder as Chorus2RoutePlaceholder;
}

function getPlaceholderText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.parity-placeholder');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

const FORBIDDEN_COPY =
  /Authorization|Basic|CHORUS3_SENTINEL_SECRET|sentinel_secret|admin:p@ssword|password|token|smb:\/\/|special:\/\/|https?:\/\/|localStorage|sessionStorage|JSONRPC\.Ping|jsonrpc|endpoint|body/i;

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  document.body.innerHTML = '';
});

describe('ParityPlaceholder', () => {
  it.each([
    ['help', 'Chorus2 Help', 'help', 'missing', 'M006/S02'],
    ['playlists', 'Chorus2 Playlists', 'playlists', 'deferred', 'R055/M006/S04'],
    [
      'labApiBrowserMethod',
      'Lab API Browser Method',
      'lab/api-browser/:method',
      'missing',
      'M006/S02'
    ]
  ])('renders honest incomplete-state copy for %s', (id, title, surface, status, owner) => {
    const target = renderPlaceholder(requirePlaceholder(id));
    const text = getPlaceholderText(target);

    expect(text).toContain(title);
    expect(text).toContain('Chorus2 surface');
    expect(text).toContain(surface);
    expect(text).toContain('Parity status');
    expect(text).toContain(status);
    expect(text).toContain('Future owner');
    expect(text).toContain(owner);
    expect(text).toContain('not complete');
    expect(text).toContain('Recovery path');
    expect(target.querySelector('a')?.getAttribute('href')).toMatch(/^\//);
  });

  it('builds package-safe recovery links without using raw browser input', () => {
    const target = renderPlaceholder(requirePlaceholder('settingsWeb'), {
      packageBasePath: '/addons/webinterface.chorus3'
    });
    const link = target.querySelector<HTMLAnchorElement>('a');

    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link?.textContent).toContain('Open recovery path');
    expect(link?.getAttribute('href')).toBe('/addons/webinterface.chorus3/settings');
  });

  it('ignores unsafe diagnostic-shaped fields that are not part of the curated component contract', () => {
    const unsafePlaceholder = {
      ...requirePlaceholder('help'),
      pathname: '/help?token=CHORUS3_SENTINEL_SECRET',
      search: '?password=admin:p@ssword&url=smb://nas/private',
      endpoint: 'http://admin:p@ssword@kodi.local/jsonrpc',
      body: '{"jsonrpc":"2.0","method":"JSONRPC.Ping"}',
      storage: 'localStorage sessionStorage special://profile'
    } as Chorus2RoutePlaceholder;

    const target = renderPlaceholder(unsafePlaceholder);

    expect(getPlaceholderText(target)).not.toMatch(FORBIDDEN_COPY);
    expect(target.innerHTML).not.toMatch(FORBIDDEN_COPY);
  });

  it('keeps exported placeholder metadata free from unsafe raw transport, storage, and request strings', () => {
    const serializedMetadata = JSON.stringify(getChorus2PlaceholderMetadataTable());

    expect(serializedMetadata).not.toMatch(FORBIDDEN_COPY);
  });

  it('renders shared labels in German while preserving curated Chorus2 metadata', () => {
    const target = renderPlaceholder(requirePlaceholder('help'), {
      i18n: createTranslationContext('de')
    });
    const text = getPlaceholderText(target);

    expect(text).toContain('Chorus2 Help');
    expect(text).toContain('Chorus2-Oberfläche');
    expect(text).toContain('Paritätsstatus');
    expect(text).toContain('Zukünftiger Owner');
    expect(text).toContain('noch nicht vollständig');
    expect(text).toContain('Wiederherstellungspfad');
  });
});
