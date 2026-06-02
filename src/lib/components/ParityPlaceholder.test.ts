import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { createTranslationContext } from '$lib/i18n';
import { getParityPlaceholderMetadataTable, type ParityRoutePlaceholder } from '$lib/app/appRouter';
import ParityPlaceholder from './ParityPlaceholder.svelte';

let mountedComponent: Record<string, unknown> | undefined;

function renderPlaceholder(
  placeholder: ParityRoutePlaceholder,
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

function getPlaceholderText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.parity-placeholder');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

const SYNTHETIC_PLACEHOLDER: ParityRoutePlaceholder = {
  id: 'synthetic-route',
  surface: 'synthetic',
  title: 'Synthetic Route',
  status: 'intentionallyChanged',
  owner: 'test',
  description: 'Synthetic incomplete-state route used only to exercise the component contract.',
  recoveryRoute: '/settings',
  routePath: '/synthetic'
};

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
  it('renders honest incomplete-state copy for a curated placeholder', () => {
    const target = renderPlaceholder(SYNTHETIC_PLACEHOLDER);
    const text = getPlaceholderText(target);

    expect(text).toContain('Synthetic Route');
    expect(text).toContain('Classic surface');
    expect(text).toContain('synthetic');
    expect(text).toContain('Parity status');
    expect(text).toContain('intentionallyChanged');
    expect(text).toContain('Future owner');
    expect(text).toContain('test');
    expect(text).toContain('not complete');
    expect(text).toContain('Recovery path');
    expect(target.querySelector('a')?.getAttribute('href')).toMatch(/^\//);
  });

  it('builds package-safe recovery links without using raw browser input', () => {
    const target = renderPlaceholder(SYNTHETIC_PLACEHOLDER, {
      packageBasePath: '/addons/webinterface.chorus3'
    });
    const link = target.querySelector<HTMLAnchorElement>('a');

    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link?.textContent).toContain('Open recovery path');
    expect(link?.getAttribute('href')).toBe('/addons/webinterface.chorus3/settings');
  });

  it('ignores unsafe diagnostic-shaped fields that are not part of the curated component contract', () => {
    const unsafePlaceholder = {
      ...SYNTHETIC_PLACEHOLDER,
      pathname: '/help?token=CHORUS3_SENTINEL_SECRET',
      search: '?password=admin:p@ssword&url=smb://nas/private',
      endpoint: 'http://admin:p@ssword@kodi.local/jsonrpc',
      body: '{"jsonrpc":"2.0","method":"JSONRPC.Ping"}',
      storage: 'localStorage sessionStorage special://profile'
    } as ParityRoutePlaceholder;

    const target = renderPlaceholder(unsafePlaceholder);

    expect(getPlaceholderText(target)).not.toMatch(FORBIDDEN_COPY);
    expect(target.innerHTML).not.toMatch(FORBIDDEN_COPY);
  });

  it('keeps exported placeholder metadata free from unsafe raw transport, storage, and request strings', () => {
    const metadata = getParityPlaceholderMetadataTable();
    const serializedMetadata = JSON.stringify(metadata);

    expect(metadata).toHaveLength(0);
    expect(serializedMetadata).not.toMatch(FORBIDDEN_COPY);
  });

  it('renders shared labels in German while preserving curated placeholder metadata', () => {
    const target = renderPlaceholder(SYNTHETIC_PLACEHOLDER, {
      i18n: createTranslationContext('de')
    });
    const text = getPlaceholderText(target);

    expect(text).toContain('Synthetic Route');
    expect(text).toContain('Klassische Oberfläche');
    expect(text).toContain('Paritätsstatus');
    expect(text).toContain('Zukünftiger Owner');
    expect(text).toContain('noch nicht vollständig');
    expect(text).toContain('Wiederherstellungspfad');
  });
});
