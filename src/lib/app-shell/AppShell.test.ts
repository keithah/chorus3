import { readFileSync } from 'node:fs';

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { buildAppRoute } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import AppShell from './AppShell.svelte';
import { createAppNavigationItems } from './appNavigation';
import type { AppShellNavigationItem } from './appShellTypes';

let mountedComponent: Record<string, unknown> | undefined;

function renderShell(props: Record<string, unknown> = {}): HTMLElement {
  document.body.innerHTML = '<div id="app-shell-test-root"></div>';
  const target = document.getElementById('app-shell-test-root');
  expect(target).toBeInstanceOf(HTMLElement);

  mountedComponent = mount(AppShell, {
    target: target as HTMLElement,
    props
  }) as Record<string, unknown>;
  flushSync();

  return target as HTMLElement;
}

function linksForTitle(target: HTMLElement, title: string): HTMLAnchorElement[] {
  return Array.from(
    target.querySelectorAll<HTMLAnchorElement>(
      `aside[aria-label="Primary navigation"] a[title="${title}"]`
    )
  );
}

function requireRailLink(target: HTMLElement, title: string): HTMLAnchorElement {
  const link = target.querySelector<HTMLAnchorElement>(
    `aside[aria-label="Primary navigation"] .c2-rail-primary[title="${title}"]`
  );
  expect(link).toBeInstanceOf(HTMLAnchorElement);
  return link as HTMLAnchorElement;
}

function requireSubmenuLink(target: HTMLElement, title: string): HTMLAnchorElement {
  const link = target.querySelector<HTMLAnchorElement>(
    `aside[aria-label="Primary navigation"] .c2-submenu-link[title="${title}"]`
  );
  expect(link).toBeInstanceOf(HTMLAnchorElement);
  return link as HTMLAnchorElement;
}

function createFixtureNavigation(activeRoute: PrimaryRoute): readonly AppShellNavigationItem[] {
  return createAppNavigationItems({ activeRoute });
}

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  document.body.innerHTML = '';
});

describe('AppShell navigation DOM', () => {
  it('renders primary rail and grouped submenu destinations as keyboard-reachable anchors', () => {
    const target = renderShell({
      navigationItems: createFixtureNavigation({ kind: 'musicArtists' }),
      routeIdentity: { kind: 'primary', route: { kind: 'musicArtists' } }
    });

    const primaryNav = target.querySelector(
      'aside[aria-label="Primary navigation"] nav[aria-label="Kodi sections"]'
    );
    expect(primaryNav).toBeInstanceOf(HTMLElement);

    const musicRailLink = requireRailLink(target, 'Music');
    expect(musicRailLink.href).toBe(new URL('/music', window.location.href).href);
    expect(musicRailLink.textContent).toContain('Music');
    expect(musicRailLink.getAttribute('aria-current')).toBe('page');

    const artistsLink = requireSubmenuLink(target, 'Music artists');
    expect(artistsLink.href).toBe(new URL('/music/artists', window.location.href).href);
    expect(artistsLink.textContent).toContain('Artists');
    expect(artistsLink.getAttribute('aria-current')).toBe('page');

    const albumsLink = requireSubmenuLink(target, 'Music albums');
    expect(albumsLink.href).toBe(new URL('/music/albums', window.location.href).href);
    expect(albumsLink.textContent).toContain('Albums');
    expect(albumsLink.getAttribute('aria-current')).toBeNull();

    expect(linksForTitle(target, 'Music')).toHaveLength(1);
  });

  it('uses aria-current only for the active rail parent and active submenu item', () => {
    const target = renderShell({
      navigationItems: createFixtureNavigation({ kind: 'settingsKodiSection', section: 'pvr' }),
      routeIdentity: {
        kind: 'primary',
        route: { kind: 'settingsKodiSection', section: 'pvr' }
      }
    });

    const currentLinks = Array.from(
      target.querySelectorAll<HTMLAnchorElement>(
        'aside[aria-label="Primary navigation"] a[aria-current="page"]'
      )
    );

    expect(currentLinks.map((link) => link.title)).toEqual(['Settings', 'Add-on settings']);
    expect(requireRailLink(target, 'Music').getAttribute('aria-current')).toBeNull();
    expect(
      requireSubmenuLink(target, 'Web interface settings').getAttribute('aria-current')
    ).toBeNull();
  });

  it('filters invalid submenu hrefs while safely labeling malformed text', () => {
    const malformedNavigation = [
      {
        id: 'music',
        title: 'Music',
        label: 'Music',
        icon: 'mdi-av-my-library-music',
        href: buildAppRoute({ kind: 'primary', route: { kind: 'music' } }),
        route: { kind: 'music' },
        isActive: true,
        submenuGroups: [
          {
            id: 'library',
            label: '',
            items: [
              {
                id: 'blank-href',
                title: 'Blank href',
                label: 'Blank href',
                href: '   ',
                route: { kind: 'musicAlbums' }
              },
              {
                id: 'fallback-label',
                title: '',
                label: '',
                href: '/music/genres',
                route: { kind: 'musicGenres' },
                isActive: true
              }
            ]
          }
        ]
      }
    ] satisfies readonly AppShellNavigationItem[];

    const target = renderShell({
      navigationItems: malformedNavigation,
      routeIdentity: { kind: 'primary', route: { kind: 'musicGenres' } }
    });

    expect(target.querySelector('a[href="   "]')).toBeNull();
    expect(target.textContent).not.toContain('Blank href');

    const fallbackLink = target.querySelector<HTMLAnchorElement>(
      '.c2-submenu-link[href="/music/genres"]'
    );
    expect(fallbackLink).toBeInstanceOf(HTMLAnchorElement);
    expect(fallbackLink?.textContent).toContain('fallback-label');
    expect(fallbackLink?.getAttribute('title')).toBe('fallback-label');
    expect(fallbackLink?.getAttribute('aria-current')).toBe('page');
  });

  it('renders safely with empty navigation data', () => {
    const target = renderShell({
      navigationItems: [],
      routeIdentity: { kind: 'unknown', label: 'fixture' }
    });

    expect(target.querySelector('[aria-label="Chorus media controller"]')).toBeInstanceOf(
      HTMLElement
    );
    expect(target.querySelectorAll('aside[aria-label="Primary navigation"] a')).toHaveLength(0);
  });

  it('keeps submenu CSS focusable, visible on focus-within, and contained on short viewports', () => {
    const source = readFileSync('src/lib/app-shell/AppShell.svelte', 'utf8');

    expect(source).toContain('.c2-rail-primary:focus-visible');
    expect(source).toContain('.c2-submenu-link:focus-visible');
    expect(source).toMatch(/\.c2-rail-item(?::hover|:focus-within|\.active)[\s\S]*\.c2-submenu/u);
    expect(source).toMatch(/\.c2-submenu[\s\S]*max-height/u);

    const mediaStart = source.indexOf('@media (max-height: 420px)');
    const shortHeightRule = mediaStart >= 0 ? source.slice(mediaStart) : '';
    expect(shortHeightRule).toContain('.c2-submenu');
    expect(shortHeightRule).toMatch(/max-height\s*:/u);
  });
});
