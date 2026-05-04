import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './SettingsPage.svelte';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { SettingsPanelDispatch } from '$lib/components/SettingsPanel.svelte';
import { createTranslationContext } from '$lib/i18n';
import type { SettingsStoreSnapshot } from '$lib/stores/settingsStore.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

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

function renderPage(
  route: PrimaryRoute,
  props: {
    snapshot?: SettingsStoreSnapshot;
    dispatch?: SettingsPanelDispatch;
  } = {}
): SettingsPanelDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(SettingsPage, {
    target: document.body,
    props: {
      route,
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      i18n: createTranslationContext('en')
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
    [
      { kind: 'settingsWeb' } as const,
      'Web interface settings',
      'Package-safe web settings',
      'Browser storage editing remains read-only here.'
    ],
    [
      { kind: 'settingsKodi' } as const,
      'Kodi settings',
      'Kodi settings browser',
      'Browse Kodi sections and categories from the existing settings panel.'
    ],
    [
      { kind: 'settingsAddons' } as const,
      'Add-on settings',
      'Add-on settings',
      'Deep add-on-specific settings remain deferred.'
    ],
    [
      { kind: 'settingsNav' } as const,
      'Navigation settings',
      'Navigation settings',
      'Menu editing is represented as read-only route context.'
    ],
    [
      { kind: 'settingsSearch' } as const,
      'Search settings',
      'Search settings',
      'Search-provider editing is represented as read-only route context.'
    ]
  ])(
    'renders route-specific static settings copy for %s',
    (route, heading, cardTitle, cardCopy) => {
      const dispatch = renderPage(route);

      expect(document.querySelector('#settings-page-title')?.textContent).toBe(heading);
      expect(text()).toContain(cardTitle);
      expect(text()).toContain(cardCopy);
      expect(text()).toContain('Kodi Settings');
      expect(dispatch.selectSection).not.toHaveBeenCalled();
    }
  );

  it('selects a present Kodi section route at most once and keeps SettingsPanel active markers visible', async () => {
    const dispatch = renderPage({ kind: 'settingsKodiSection', section: 'interface' });

    await tick();
    await tick();

    expect(document.querySelector('#settings-page-title')?.textContent).toBe(
      'Kodi settings section'
    );
    expect(text()).toContain('Kodi section deep link');
    expect(text()).toContain(
      'Selects a known Kodi settings section once, then leaves panel navigation in control.'
    );
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
    expect(text()).toContain('Kodi section deep link');
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
