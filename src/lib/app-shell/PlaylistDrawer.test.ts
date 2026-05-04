import { readFileSync } from 'node:fs';

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PlaylistDrawer from './PlaylistDrawer.svelte';
import AppShell from './AppShell.svelte';

let mountedComponent: Record<string, unknown> | undefined;

function renderDrawer(props: Record<string, unknown> = {}): HTMLElement {
  document.body.innerHTML = '<div id="playlist-drawer-test-root"></div>';
  const target = document.getElementById('playlist-drawer-test-root');
  expect(target).toBeInstanceOf(HTMLElement);

  mountedComponent = mount(PlaylistDrawer, {
    target: target as HTMLElement,
    props
  }) as Record<string, unknown>;
  flushSync();

  return target as HTMLElement;
}

function getButtonByText(target: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === text
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function getButtonByAria(target: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function click(button: HTMLButtonElement): void {
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  document.body.innerHTML = '';
});

describe('PlaylistDrawer', () => {
  it('renders neutral default drawer landmarks and selectors', () => {
    const target = renderDrawer();

    expect(
      target.querySelector('.c2-destination-tabs[aria-label="Playback destination"]')
    ).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.c2-playlist[aria-label="Current playlist"]')).toBeInstanceOf(
      HTMLElement
    );
    expect(target.querySelector('.c2-media-tabs[role="tablist"]')).toBeInstanceOf(HTMLElement);
    expect(target.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('false');
    expect(
      getButtonByAria(target, 'Kodi playback destination selected').classList.contains('active')
    ).toBe(true);
    expect(getButtonByText(target, 'Audio').getAttribute('aria-selected')).toBe('true');
    expect(getButtonByText(target, 'Video').disabled).toBe(false);
    expect(getButtonByAria(target, 'Playlist menu').getAttribute('aria-expanded')).toBe('false');
    expect(getButtonByAria(target, 'Playlist menu').getAttribute('aria-controls')).toBe(
      'c2-playlist-menu'
    );
    expect(target.querySelector('.c2-playlist-menu')).toBeNull();
  });

  it('falls back to Current playlist for an empty drawer label and tolerates absent snippets', () => {
    const target = renderDrawer({ drawer: { label: '', mediaMode: 'video', collapsed: true } });

    const drawer = target.querySelector<HTMLElement>('.c2-playlist');
    expect(drawer).toBeInstanceOf(HTMLElement);
    expect(drawer?.getAttribute('aria-label')).toBe('Current playlist');
    expect(drawer?.getAttribute('data-collapsed')).toBe('true');
    expect(getButtonByText(target, 'Video').getAttribute('aria-selected')).toBe('true');
    expect(target.querySelector('.c2-playlist-menu')).toBeNull();
  });

  it('defaults malformed drawer and destination state to expanded Audio controls', () => {
    const target = renderDrawer({
      drawer: { label: '' },
      destination: {}
    });

    expect(target.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('false');
    expect(getButtonByText(target, 'Audio').getAttribute('aria-selected')).toBe('true');
    expect(getButtonByText(target, 'Video').getAttribute('aria-selected')).toBe('false');
    expect(getButtonByAria(target, 'Kodi playback destination selected')).toBeInstanceOf(
      HTMLButtonElement
    );
  });

  it('exposes clickable menu, media, destination, and collapse primitives', () => {
    const onDestinationModeChange = vi.fn();
    const onMediaModeChange = vi.fn();
    const onPlaylistMenuToggle = vi.fn();
    const onPlaylistCollapseToggle = vi.fn();
    const onPlaylistMenuAction = vi.fn();
    const target = renderDrawer({
      callbacks: {
        onDestinationModeChange,
        onMediaModeChange,
        onPlaylistMenuToggle,
        onPlaylistCollapseToggle,
        onPlaylistMenuAction
      }
    });

    click(getButtonByAria(target, 'Playlist menu'));
    expect(getButtonByAria(target, 'Playlist menu').getAttribute('aria-expanded')).toBe('true');
    expect(target.querySelector('.c2-playlist-menu[role="menu"]')).toBeInstanceOf(HTMLElement);
    expect(onPlaylistMenuToggle).toHaveBeenCalledWith(true);

    click(getButtonByText(target, 'Clear playlist'));
    expect(onPlaylistMenuAction).toHaveBeenCalledWith('clear');
    for (const label of [
      'Current playlist',
      'Refresh playlist',
      'Party mode',
      'Save Kodi playlist'
    ]) {
      const menuItem = getButtonByText(target, label);
      expect(menuItem.disabled, `${label} guarded`).toBe(true);
      click(menuItem);
    }
    expect(onPlaylistMenuAction).toHaveBeenCalledTimes(1);

    click(getButtonByText(target, 'Video'));
    expect(getButtonByText(target, 'Video').getAttribute('aria-selected')).toBe('true');
    expect(onMediaModeChange).toHaveBeenCalledWith('video');

    click(getButtonByText(target, 'Local'));
    expect(getButtonByText(target, 'Local').classList.contains('active')).toBe(true);
    expect(onDestinationModeChange).toHaveBeenCalledWith('local');

    click(getButtonByAria(target, 'Collapse playlist'));
    expect(target.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('true');
    expect(onPlaylistCollapseToggle).toHaveBeenCalledWith(true);
    expect(getButtonByAria(target, 'Expand playlist')).toBeInstanceOf(HTMLButtonElement);

    click(getButtonByAria(target, 'Expand playlist'));
    expect(target.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('false');
    expect(onPlaylistCollapseToggle).toHaveBeenLastCalledWith(false);

    click(getButtonByAria(target, 'Playlist menu'));
    expect(getButtonByAria(target, 'Playlist menu').getAttribute('aria-expanded')).toBe('false');
    expect(target.querySelector('.c2-playlist-menu')).toBeNull();
  });

  it('keeps rendering when injected callbacks throw or reject', async () => {
    const target = renderDrawer({
      callbacks: {
        onDestinationModeChange: () => {
          throw new Error('destination callback failed');
        },
        onMediaModeChange: vi.fn().mockRejectedValue(new Error('media callback failed')),
        onPlaylistMenuAction: () => {
          throw new Error('menu callback failed');
        },
        onPlaylistMenuToggle: () => {
          throw new Error('menu toggle failed');
        },
        onPlaylistCollapseToggle: () => {
          throw new Error('collapse callback failed');
        }
      }
    });

    click(getButtonByText(target, 'Local'));
    click(getButtonByText(target, 'Video'));
    click(getButtonByAria(target, 'Playlist menu'));
    click(getButtonByText(target, 'Refresh playlist'));
    click(getButtonByAria(target, 'Collapse playlist'));
    await Promise.resolve();

    expect(target.querySelector('.c2-playlist')).toBeInstanceOf(HTMLElement);
    expect(getButtonByAria(target, 'Playlist menu').getAttribute('aria-expanded')).toBe('true');
    expect(target.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('true');
    expect(getButtonByText(target, 'Local').classList.contains('active')).toBe(true);
    expect(getButtonByText(target, 'Video').getAttribute('aria-selected')).toBe('true');
  });

  it('updates AppShell collapsed layout diagnostics through the drawer control', () => {
    document.body.innerHTML = '<div id="app-shell-drawer-test-root"></div>';
    const target = document.getElementById('app-shell-drawer-test-root');
    expect(target).toBeInstanceOf(HTMLElement);

    mountedComponent = mount(AppShell, {
      target: target as HTMLElement,
      props: {
        navigationItems: [],
        stageLabel: 'Fixture stage',
        drawer: { label: 'Fixture playlist' }
      }
    }) as Record<string, unknown>;
    flushSync();

    const shell = target?.querySelector<HTMLElement>('.chorus-app');
    expect(shell).toBeInstanceOf(HTMLElement);
    expect(shell?.classList.contains('playlist-collapsed')).toBe(false);
    expect(shell?.getAttribute('data-playlist-layout')).toBe('expanded');
    expect(shell?.getAttribute('style')).toContain('--c2-playlist-width: 300px');
    expect(target?.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('false');

    click(getButtonByAria(target as HTMLElement, 'Collapse playlist'));

    expect(shell?.classList.contains('playlist-collapsed')).toBe(true);
    expect(shell?.getAttribute('data-playlist-layout')).toBe('collapsed');
    expect(shell?.getAttribute('style')).toContain('--c2-playlist-width: 43px');
    expect(shell?.getAttribute('style')).toContain('--c2-search-right: 43px');
    expect(target?.querySelector('.c2-playlist')?.getAttribute('data-collapsed')).toBe('true');
    expect(getButtonByAria(target as HTMLElement, 'Expand playlist')).toBeInstanceOf(
      HTMLButtonElement
    );

    const source = readFileSync('src/lib/app-shell/AppShell.svelte', 'utf8');
    expect(source).toMatch(/\.c2-stage[\s\S]*right:\s*var\(--c2-playlist-width/u);
    expect(source).toMatch(/\.c2-search[\s\S]*right:\s*var\(--c2-search-right/u);
  });

  it('keeps app-shell files store-agnostic and panel-free', () => {
    for (const file of [
      'src/lib/app-shell/AppShell.svelte',
      'src/lib/app-shell/PlaylistDrawer.svelte',
      'src/lib/app-shell/appNavigation.ts'
    ]) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} must not import stores`).not.toMatch(
        /['"]\$lib\/stores|['"]\.\.\/stores|['"]\.\/stores/u
      );
      expect(source, `${file} must not import app page panels`).not.toMatch(
        /MusicLibraryPanel|MusicBrowsePanel|MediaFilesPanel|MediaPlaylistsPanel|MediaSearchPanel|VideoMoviesPanel|VideoTvShowsPanel|AddonsPanel|SettingsPanel|RemoteInputPanel/u
      );
    }

    const playlistDrawerSource = readFileSync('src/lib/app-shell/PlaylistDrawer.svelte', 'utf8');
    expect(playlistDrawerSource).not.toMatch(/Chorus2|classic|reference-shell/u);
  });
});
