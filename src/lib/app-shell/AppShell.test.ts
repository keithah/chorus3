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
    `aside[aria-label="Primary navigation"] .classic-rail-primary[title="${title}"]`
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
  it('renders the classic primary rail with Chorus2-style flyout submenu anchors', () => {
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

    expect(linksForTitle(target, 'Music')).toHaveLength(1);
    const submenuLinks = Array.from(
      target.querySelectorAll<HTMLAnchorElement>('.classic-submenu-link')
    );
    expect(submenuLinks.length).toBeGreaterThan(0);
    expect(submenuLinks.map((link) => link.textContent?.trim())).toContain('Artists');
  });

  it('uses aria-current only for the active rail parent', () => {
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

    expect(currentLinks.map((link) => link.title)).toEqual(['Settings', 'PVR & Live TV']);
    expect(requireRailLink(target, 'Music').getAttribute('aria-current')).toBeNull();
  });

  it('filters invalid primary hrefs while safely labeling malformed text', () => {
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
    const submenuLinks = target.querySelectorAll<HTMLAnchorElement>('.classic-submenu-link');
    expect(submenuLinks).toHaveLength(1);
    expect(submenuLinks[0]?.textContent?.trim()).toBe('fallback-label');
    expect(submenuLinks[0]?.getAttribute('href')).toBe('/music/genres');
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

  it('uses the pause icon while Kodi reports active playback', () => {
    const target = renderShell({
      player: {
        title: '30 & Up',
        subtitle: 'Aceyalone',
        currentTime: '0:14',
        totalTime: '2:54',
        progressPercent: 8,
        isPlaying: true
      }
    });

    const button = target.querySelector<HTMLButtonElement>(
      'footer[aria-label="Playback controls"] button[aria-label="Pause"]'
    );
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.querySelector('.mdi-av-pause')).toBeInstanceOf(HTMLElement);
    expect(button?.querySelector('.mdi-av-play-arrow')).toBeNull();
  });

  it('opens the classic-style Kodi remote from the footer thumbnail when provided', () => {
    let opened = false;
    const target = renderShell({
      playerActions: {
        openRemote: () => {
          opened = true;
        }
      }
    });

    const button = target.querySelector<HTMLButtonElement>(
      'footer[aria-label="Playback controls"] button[aria-label="Open Kodi remote"]'
    );
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.querySelector('.mdi-action-settings-remote')).toBeInstanceOf(HTMLElement);

    button?.click();
    expect(opened).toBe(true);
  });

  it('uses the classic global search input to open search routes', () => {
    const submitted: string[] = [];
    let focused = false;
    const target = renderShell({
      callbacks: {
        onSearchFocus: () => {
          focused = true;
        },
        onSearchSubmit: (query: string) => {
          submitted.push(query);
        }
      }
    });

    const input = target.querySelector<HTMLInputElement>('input[aria-label="Search Kodi"]');
    const form = target.querySelector<HTMLFormElement>('form.classic-search');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(form).toBeInstanceOf(HTMLFormElement);
    expect(input?.readOnly).toBe(false);
    expect(input?.placeholder).toBe('Search');

    input?.focus();
    expect(focused).toBe(true);

    if (input) {
      input.value = '  blue scholars  ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(submitted).toEqual(['blue scholars']);
  });

  it('keeps the classic shell fanart as a persistent stage background separate from the remote', () => {
    const target = renderShell({
      stageArtUrl: '/image/image%3A%2F%2Fmusic%40fanart%2F',
      playerActions: {
        openRemote: () => undefined
      }
    });

    const shell = target.querySelector<HTMLElement>('[aria-label="Chorus media controller"]');
    const stageArt = target.querySelector<HTMLElement>('.classic-stage-art');
    const remoteButton = target.querySelector<HTMLButtonElement>(
      'footer[aria-label="Playback controls"] button[aria-label="Open Kodi remote"]'
    );

    expect(shell).toBeInstanceOf(HTMLElement);
    expect(stageArt).toBeInstanceOf(HTMLElement);
    expect(remoteButton).toBeInstanceOf(HTMLButtonElement);
    expect(shell?.getAttribute('style')).toContain(
      "--classic-stage-art-url: url('/image/image%3A%2F%2Fmusic%40fanart%2F')"
    );
  });

  it('enables footer shuffle when a real shuffle action is provided', () => {
    let shuffled = false;
    const target = renderShell({
      player: {
        title: 'Second Chapter',
        subtitle: 'Blue Scholars',
        currentTime: '0:00',
        totalTime: '1:54',
        progressPercent: 0,
        isShuffled: true
      },
      playerActions: {
        shuffle: () => {
          shuffled = true;
        }
      }
    });

    const button = target.querySelector<HTMLButtonElement>(
      'footer[aria-label="Playback controls"] button[aria-label="Shuffle"]'
    );
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.disabled).toBe(false);
    expect(button?.getAttribute('aria-pressed')).toBe('true');

    button?.click();
    expect(shuffled).toBe(true);
  });

  it('opens footer more actions for stop and repeat playback commands', () => {
    const commands: string[] = [];
    const target = renderShell({
      playerActions: {
        stop: () => {
          commands.push('stop');
        },
        repeat: () => {
          commands.push('repeat');
        }
      }
    });

    const moreButton = target.querySelector<HTMLButtonElement>(
      'footer[aria-label="Playback controls"] button[aria-label="More"]'
    );
    expect(moreButton).toBeInstanceOf(HTMLButtonElement);
    expect(moreButton?.disabled).toBe(false);
    expect(moreButton?.getAttribute('aria-expanded')).toBe('false');

    moreButton?.click();
    flushSync();

    const menu = target.querySelector<HTMLElement>(
      'footer[aria-label="Playback controls"] [role="menu"][aria-label="More playback actions"]'
    );
    const stopButton = target.querySelector<HTMLButtonElement>('[role="menuitem"]:nth-child(1)');
    const repeatButton = target.querySelector<HTMLButtonElement>('[role="menuitem"]:nth-child(2)');
    expect(menu).toBeInstanceOf(HTMLElement);
    expect(stopButton?.textContent).toContain('Stop');
    expect(repeatButton?.textContent).toContain('Repeat');

    stopButton?.click();
    flushSync();
    expect(commands).toEqual(['stop']);
    expect(target.querySelector('[role="menu"]')).toBeNull();

    moreButton?.click();
    flushSync();
    target.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[1]?.click();
    expect(commands).toEqual(['stop', 'repeat']);
  });

  it('keeps rail icons focusable without exposing hover flyout menus', () => {
    const componentSource = readFileSync('src/lib/app-shell/AppShell.svelte', 'utf8');
    const styleSource = readFileSync('src/lib/app-shell/appShellClassic.css', 'utf8');
    const defaultRailIcons = [
      'mdi-av-my-library-music',
      'mdi-image-movie-creation',
      'mdi-hardware-tv',
      'mdi-editor-format-list-bulleted',
      'mdi-action-settings-input-antenna',
      'mdi-action-extension',
      'mdi-action-thumb-up',
      'mdi-av-playlist-add',
      'mdi-action-settings',
      'mdi-action-help'
    ];

    expect(styleSource).toContain('.mdi-av-pause::before');
    expect(styleSource).toContain("content: '\\e6b6'");
    expect(styleSource).toContain('.mdi-action-settings-remote::before');
    for (const icon of defaultRailIcons) {
      expect(styleSource, `${icon} should render a visible glyph`).toContain(`.${icon}::before`);
    }
    expect(styleSource).toContain('.classic-player .classic-thumb');
    expect(styleSource).toContain('.classic-rail-primary:focus-visible');
    expect(componentSource).toMatch(/class="classic-submenu-link"/u);
    expect(styleSource).not.toContain('.classic-rail-item:focus-within .classic-submenu');
    expect(componentSource).not.toContain('classic-rail-label');
    expect(styleSource).not.toMatch(/\.classic-rail-item:hover\s+\.visually-hidden/u);
    expect(styleSource).not.toMatch(/\.classic-rail-item:focus-within\s+\.visually-hidden/u);
  });
});
