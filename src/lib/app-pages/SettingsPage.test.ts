import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './SettingsPage.svelte';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { SettingsPanelDispatch } from '$lib/components/SettingsPanel.svelte';
import type { AddonsPanelDispatch } from '$lib/components/AddonsPanel.svelte';
import { createTranslationContext } from '$lib/i18n';
import type { SettingsStoreSnapshot } from '$lib/stores/settingsStore.svelte';
import type { AddonSnapshot, AddonsStoreSnapshot } from '$lib/stores/addonsStore.svelte';
import {
  WEB_SETTINGS_STORAGE_KEY,
  createWebSettingsStore,
  type WebSettingsStore,
  type WebSettingsStorage
} from '$lib/stores/webSettings.svelte';
import {
  SEARCH_ADDONS_STORAGE_KEY,
  createSearchAddonsStore,
  type SearchAddonsStore,
  type SearchAddonsStorage
} from '$lib/stores/searchAddons.svelte';
import {
  MAIN_NAV_STORAGE_KEY,
  createMainNavStore,
  type MainNavStore,
  type MainNavStorage
} from '$lib/stores/mainNav.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

const VIDEO_ADDON: AddonSnapshot = {
  addonid: 'plugin.video.safe-demo',
  name: 'Safe Video Demo',
  version: '1.0.0',
  summary: 'Safe video fixture.',
  description: 'A deterministic video add-on.',
  author: 'Fixture Team',
  enabled: false,
  installed: true,
  type: 'xbmc.addon.video',
  broken: null,
  dependencyCount: 0,
  extrainfoCount: 0
};

const AUDIO_ADDON: AddonSnapshot = {
  ...VIDEO_ADDON,
  addonid: 'plugin.audio.safe-radio',
  name: 'Safe Radio',
  enabled: true,
  type: 'xbmc.addon.audio'
};

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createSnapshot(overrides: Partial<SettingsStoreSnapshot> = {}): SettingsStoreSnapshot {
  return {
    loadStatus: 'success',
    writeStatus: 'idle',
    sections: [
      { id: 'player', label: 'Player' },
      { id: 'interface', label: 'Interface' }
    ],
    categories: [
      { id: 'videos', label: 'Videos' },
      { id: 'lookandfeel', label: 'Look and feel' }
    ],
    settings: [
      {
        id: 'videoplayer.autoplaynextitem',
        label: 'Autoplay next item',
        type: 'boolean',
        editKind: 'boolean',
        value: true,
        defaultValue: false,
        options: [],
        readOnly: false
      },
      {
        id: 'filebrowser.source',
        label: 'Media source path',
        type: 'path',
        editKind: 'unsupported',
        value: 'smb://admin:p@ssword@nas.local/private/movie.mkv',
        defaultValue: null,
        options: [],
        readOnly: true
      },
      {
        id: 'services.action',
        label: 'Maintenance action',
        type: 'action',
        editKind: 'unsupported',
        value: 'Input.SendText',
        defaultValue: null,
        options: [],
        readOnly: true
      }
    ],
    selectedSectionId: 'player',
    selectedCategoryId: 'videos',
    lastError: null,
    lastWrite: null,
    rollbackValue: null,
    refreshAfterWrite: null,
    writeCounts: { attempted: 0, succeeded: 0, failed: 0 },
    ...overrides
  };
}

function createDispatch(overrides: Partial<SettingsPanelDispatch> = {}): SettingsPanelDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    selectSection: vi.fn(),
    selectCategory: vi.fn(),
    setValue: vi.fn(),
    ...overrides
  };
}

function createAddonsSnapshot(overrides: Partial<AddonsStoreSnapshot> = {}): AddonsStoreSnapshot {
  const addons = overrides.addons ?? [VIDEO_ADDON, AUDIO_ADDON];
  const visibleAddons = overrides.visibleAddons ?? addons;

  return {
    loadStatus: 'success',
    detailStatus: 'idle',
    writeStatus: 'idle',
    addons,
    selectedAddonId: null,
    detail: null,
    searchQuery: '',
    groupBy: 'none',
    visibleAddons,
    groups: [],
    pendingToggle: null,
    lastWrite: null,
    rollbackEnabled: null,
    refreshAfterWrite: null,
    writeCounts: { attempted: 0, succeeded: 0, failed: 0 },
    lastError: null,
    ...overrides
  };
}

function createAddonsDispatch(overrides: Partial<AddonsPanelDispatch> = {}): AddonsPanelDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setSearchQuery: vi.fn(),
    setGroupBy: vi.fn(),
    setAddonEnabled: vi.fn(),
    ...overrides
  };
}

function renderPage(
  route: PrimaryRoute,
  props: {
    snapshot?: SettingsStoreSnapshot;
    dispatch?: SettingsPanelDispatch;
    webSettings?: WebSettingsStore;
    searchAddons?: SearchAddonsStore;
    mainNav?: MainNavStore;
    addonsSnapshot?: AddonsStoreSnapshot;
    addonsDispatch?: AddonsPanelDispatch;
  } = {}
): SettingsPanelDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(SettingsPage, {
    target: document.body,
    props: {
      route,
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      i18n: createTranslationContext('en'),
      webSettings: props.webSettings,
      searchAddons: props.searchAddons,
      mainNav: props.mainNav,
      addonsSnapshot: props.addonsSnapshot,
      addonsDispatch: props.addonsDispatch
    }
  });
  return dispatch;
}

function text(): string {
  return document.body.textContent ?? '';
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('special://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('/private/movie.mkv');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
}

describe('SettingsPage', () => {
  it.each([
    [{ kind: 'settingsWeb' } as const, 'General options', 'Advanced options', 'API Keys'],
    [{ kind: 'settingsKodi' } as const, 'Kodi Settings', 'Reload settings', 'Sections'],
    [
      { kind: 'settingsAddons' } as const,
      'Add-ons',
      'Toggle installed Kodi add-ons.',
      'Open add-ons'
    ],
    [
      { kind: 'settingsNav' } as const,
      'Main Menu Structure',
      'Here you can change the title, url and',
      'Click here restore defaults'
    ],
    [
      { kind: 'settingsSearch' } as const,
      'Custom Add-on search',
      'Add custom add-on searches.',
      'Add-ons help page'
    ]
  ])('renders Chorus2 settings content for %s', (route, heading, firstCopy, secondCopy) => {
    const dispatch = renderPage(route);

    expect(document.querySelector('#settings-title')?.textContent).toBe(heading);
    expect(text()).toContain(firstCopy);
    expect(text()).toContain(secondCopy);
    expect(text()).toContain('Kodi Settings');
    expect(dispatch.selectSection).not.toHaveBeenCalled();
  });

  it('persists Chorus2 web interface settings as controls change', async () => {
    const storage = createMemoryStorage();
    const webSettings = createWebSettingsStore({ storage });
    renderPage({ kind: 'settingsWeb' }, { webSettings });

    const defaultPlayer = document.querySelector(
      'select[aria-label="Default player"]'
    ) as HTMLSelectElement | null;
    const vibrantHeaders = document.querySelector(
      'input[aria-label="Vibrant headers"]'
    ) as HTMLInputElement | null;
    const socketsPort = document.querySelector(
      'input[aria-label="Websockets port"]'
    ) as HTMLInputElement | null;

    expect(defaultPlayer).not.toBeNull();
    expect(vibrantHeaders).not.toBeNull();
    expect(socketsPort).not.toBeNull();

    defaultPlayer!.value = 'local';
    defaultPlayer!.dispatchEvent(new Event('change', { bubbles: true }));
    vibrantHeaders!.checked = false;
    vibrantHeaders!.dispatchEvent(new Event('change', { bubbles: true }));
    socketsPort!.value = '9091';
    socketsPort!.dispatchEvent(new Event('input', { bubbles: true }));

    await tick();

    expect(JSON.parse(storage.getItem(WEB_SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({
      defaultPlayer: 'local',
      vibrantHeaders: false,
      socketsPort: '9091'
    });
  });

  it('exposes the full Chorus2 language selector inventory', () => {
    renderPage({ kind: 'settingsWeb' });

    const language = document.querySelector(
      'select[aria-label="Language"]'
    ) as HTMLSelectElement | null;

    expect(language).not.toBeNull();
    expect(language!.options.length).toBe(76);
    expect([...language!.options].map((option) => [option.value, option.text])).toEqual(
      expect.arrayContaining([
        ['en', 'English (United Kingdom)'],
        ['de', 'German'],
        ['he', 'Hebrew (Israel)'],
        ['pt_br', 'Portuguese (Brazil)'],
        ['sr_rs@latin', 'Serbian (latin)'],
        ['zh_tw', 'Chinese (Traditional)']
      ])
    );
  });

  it('renders Chorus2 add-on settings as grouped toggles and dispatches enablement writes', async () => {
    const addonsDispatch = createAddonsDispatch();
    renderPage(
      { kind: 'settingsAddons' },
      {
        addonsSnapshot: createAddonsSnapshot(),
        addonsDispatch
      }
    );

    expect(text()).toContain('xbmc.addon.video');
    expect(text()).toContain('Safe Video Demo');
    expect(text()).toContain('xbmc.addon.audio');
    expect(text()).toContain('Safe Radio');

    const videoToggle = document.querySelector(
      'input[aria-label="Enable Safe Video Demo"]'
    ) as HTMLInputElement | null;
    expect(videoToggle).not.toBeNull();

    videoToggle!.checked = true;
    videoToggle!.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();

    expect(addonsDispatch.setAddonEnabled).toHaveBeenCalledWith('plugin.video.safe-demo', true);

    const settingsLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'Settings'
    );
    expect(settingsLink?.getAttribute('href')).toBe('/addons/plugin.video.safe-demo');
  });

  it('persists Chorus2 main menu rows in the compatible local format', async () => {
    const storage = createMemoryStorage();
    const mainNav = createMainNavStore({ storage });
    renderPage({ kind: 'settingsNav' }, { mainNav });
    await tick();

    const title = document.querySelector(
      'input[aria-label="Menu title 1"]'
    ) as HTMLInputElement | null;
    const path = document.querySelector(
      'input[aria-label="Menu url 1"]'
    ) as HTMLInputElement | null;
    const icon = document.querySelector(
      'select[aria-label="Menu icon 1"]'
    ) as HTMLSelectElement | null;

    expect(title).not.toBeNull();
    expect(path).not.toBeNull();
    expect(icon).not.toBeNull();

    title!.value = 'Tunes';
    title!.dispatchEvent(new Event('input', { bubbles: true }));
    path!.value = 'music';
    path!.dispatchEvent(new Event('input', { bubbles: true }));
    icon!.value = 'mdi-av-my-library-music';
    icon!.dispatchEvent(new Event('change', { bubbles: true }));
    document
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();

    expect(storage.getItem(MAIN_NAV_STORAGE_KEY)?.split(',')[0]).toBe('1');
    expect(JSON.parse(storage.getItem(`${MAIN_NAV_STORAGE_KEY}-1`) ?? '{}')).toMatchObject({
      id: '1',
      title: 'Tunes',
      path: 'music',
      icon: 'mdi-av-my-library-music',
      parent: 0,
      weight: 0
    });
  });

  it('adds, removes, and restores Chorus2 main menu rows', async () => {
    const storage = createMemoryStorage();
    const mainNav = createMainNavStore({ storage });
    renderPage({ kind: 'settingsNav' }, { mainNav });
    await tick();

    document
      .querySelector('.add-main-nav-row')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.querySelector('input[aria-label="Menu title 11"]')).not.toBeNull();

    document
      .querySelector('button[aria-label="Remove main menu item 1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.querySelector('input[aria-label="Menu title 10"]')).not.toBeNull();
    document
      .querySelector('.restore-defaults-link')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.querySelector('input[aria-label="Menu title 10"]')).not.toBeNull();
    expect(storage.getItem(MAIN_NAV_STORAGE_KEY)).toBeNull();
  });

  it('persists Chorus2 custom add-on search rows in the compatible local format', async () => {
    const storage = createMemoryStorage();
    const searchAddons = createSearchAddonsStore({ storage });
    renderPage({ kind: 'settingsSearch' }, { searchAddons });
    await tick();

    const title = document.querySelector('input[aria-label="Title 1"]') as HTMLInputElement | null;
    const url = document.querySelector('input[aria-label="Url 1"]') as HTMLInputElement | null;
    const media = document.querySelector(
      'select[aria-label="Media 1"]'
    ) as HTMLSelectElement | null;

    expect(title).not.toBeNull();
    expect(url).not.toBeNull();
    expect(media).not.toBeNull();
    expect(
      [...document.querySelectorAll('a')].some((link) => link.textContent === 'Add-ons help page')
    ).toBe(true);

    title!.value = 'YouTube';
    title!.dispatchEvent(new Event('input', { bubbles: true }));
    url!.value = 'plugin://plugin.video.youtube/search/?q={query}';
    url!.dispatchEvent(new Event('input', { bubbles: true }));
    media!.value = 'video';
    media!.dispatchEvent(new Event('change', { bubbles: true }));
    document
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();

    expect(storage.getItem(SEARCH_ADDONS_STORAGE_KEY)).toBe('custom.addon.0');
    expect(
      JSON.parse(storage.getItem(`${SEARCH_ADDONS_STORAGE_KEY}-custom.addon.0`) ?? '{}')
    ).toMatchObject({
      id: 'custom.addon.0',
      title: 'YouTube',
      url: 'plugin://plugin.video.youtube/search/?q={query}',
      media: 'video',
      weight: 0
    });
  });

  it('adds and removes Chorus2 custom add-on search rows', async () => {
    const searchAddons = createSearchAddonsStore({ storage: createMemoryStorage() });
    renderPage({ kind: 'settingsSearch' }, { searchAddons });
    await tick();

    document
      .querySelector('.add-search-row')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.querySelector('input[aria-label="Title 2"]')).not.toBeNull();

    document
      .querySelector('button[aria-label="Remove custom add-on search 1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.querySelector('input[aria-label="Title 1"]')).not.toBeNull();
    expect(document.querySelector('input[aria-label="Title 2"]')).toBeNull();
  });

  it('selects a present Kodi section route at most once and keeps SettingsPanel active markers visible', async () => {
    const dispatch = renderPage({ kind: 'settingsKodiSection', section: 'interface' });

    await tick();
    await tick();

    expect(document.querySelector('#settings-title')?.textContent).toBe('Kodi Settings');
    expect(text()).toContain('Editing interface settings from Kodi.');
    expect(dispatch.selectSection).toHaveBeenCalledTimes(1);
    expect(dispatch.selectSection).toHaveBeenCalledWith('interface');
    expect(
      document.querySelector('button[aria-label="Select settings section Player"]')
    ).not.toBeNull();
  });

  it('does not dispatch section selection when the routed section is already selected', async () => {
    const dispatch = renderPage(
      { kind: 'settingsKodiSection', section: 'interface' },
      { snapshot: createSnapshot({ selectedSectionId: 'interface' }) }
    );

    await tick();

    expect(dispatch.selectSection).not.toHaveBeenCalled();
    expect(
      document
        .querySelector('button[aria-label="Select settings section Interface"]')
        ?.getAttribute('aria-current')
    ).toBe('page');
  });

  it('ignores absent or unsafe Kodi section route text without reflecting it into visible copy', async () => {
    const dispatch = renderPage(
      { kind: 'settingsKodiSection', section: 'Authorization' },
      { snapshot: createSnapshot({ sections: [], selectedSectionId: null }) }
    );

    await tick();

    expect(dispatch.selectSection).not.toHaveBeenCalled();
    expect(text()).toContain('Choose a Kodi settings section.');
    expect(text()).toContain('No settings sections are available.');
    expect(text()).not.toContain('Authorization');
    expectSecretSafe(text());
  });

  it('keeps unsupported path, file, folder, custom, and action values read-only and redacted', () => {
    renderPage(
      { kind: 'settingsKodiSection', section: 'interface' },
      {
        snapshot: createSnapshot({
          settings: [
            {
              id: 'path.setting',
              label: 'Path setting',
              type: 'path',
              editKind: 'unsupported',
              value: 'smb://admin:p@ssword@nas.local/private/movie.mkv',
              defaultValue: null,
              options: [],
              readOnly: true
            },
            {
              id: 'file.setting',
              label: 'File setting',
              type: 'file',
              editKind: 'unsupported',
              value: 'C:\\Users\\admin\\secret.mkv',
              defaultValue: null,
              options: [],
              readOnly: true
            },
            {
              id: 'folder.setting',
              label: 'Folder setting',
              type: 'folder',
              editKind: 'unsupported',
              value: '/mnt/media/private/movie.mkv',
              defaultValue: null,
              options: [],
              readOnly: true
            },
            {
              id: 'custom.setting',
              label: 'Custom setting',
              type: 'custom',
              editKind: 'unsupported',
              value: '{"jsonrpc":"2.0","method":"Input.SendText"}',
              defaultValue: null,
              options: [],
              readOnly: true
            },
            {
              id: 'action.setting',
              label: 'Action setting',
              type: 'action',
              editKind: 'unsupported',
              value: 'Input.SendText',
              defaultValue: null,
              options: [],
              readOnly: true
            }
          ]
        })
      }
    );

    expect(document.querySelector('[data-setting-control="path.setting"]')).toBeNull();
    expect(document.querySelector('[data-setting-control="file.setting"]')).toBeNull();
    expect(document.querySelector('[data-setting-control="folder.setting"]')).toBeNull();
    expect(document.querySelector('[data-setting-control="custom.setting"]')).toBeNull();
    expect(document.querySelector('[data-setting-control="action.setting"]')).toBeNull();
    expect(text()).toContain('Read-only: Kodi path settings are not safe to edit here.');
    expect(text()).toContain('Read-only: Kodi file settings are not safe to edit here.');
    expect(text()).toContain('Read-only: Kodi folder settings are not safe to edit here.');
    expect(text()).toContain('Read-only: Kodi custom setting payloads are not safe to edit here.');
    expect(text()).toContain('Read-only: Kodi action settings are not safe to edit here.');
    expectSecretSafe(text());
  });
});

function createMemoryStorage(): WebSettingsStorage & SearchAddonsStorage & MainNavStorage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    })
  };
}
