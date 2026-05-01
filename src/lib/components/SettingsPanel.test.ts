import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SettingsPanel, { type SettingsPanelDispatch } from './SettingsPanel.svelte';
import type { SettingsStoreSnapshot } from '$lib/stores/settingsStore.svelte';

import type { SettingsSettingValue } from '$lib/kodi';

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
      { id: 'services', label: 'Services' }
    ],
    categories: [
      { id: 'videos', label: 'Videos' },
      { id: 'music', label: 'Music' }
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
        id: 'videoplayer.seeksteps',
        label: 'Seek steps',
        type: 'integer',
        editKind: 'integer',
        value: 30,
        defaultValue: 10,
        options: [],
        readOnly: false
      },
      {
        id: 'videoscreen.brightness',
        label: 'Brightness',
        type: 'number',
        editKind: 'number',
        value: 0.75,
        defaultValue: 0.5,
        options: [],
        readOnly: false
      },
      {
        id: 'services.devicename',
        label: 'Device name',
        type: 'string',
        editKind: 'string',
        value: 'Living Room',
        defaultValue: 'Kodi',
        options: [],
        readOnly: false
      },
      {
        id: 'videoplayer.upscaling',
        label: 'Upscaling method',
        type: 'string',
        editKind: 'enum',
        value: 'lanczos',
        defaultValue: 'nearest',
        options: [
          { value: 'nearest', label: 'Nearest' },
          { value: 'lanczos', label: 'Lanczos' }
        ],
        readOnly: false
      },
      {
        id: 'services.webserverpassword',
        label: 'Web server credentials',
        type: 'string',
        editKind: 'unsupported',
        value: '[redacted-password]',
        defaultValue: '[redacted-password]',
        options: [],
        readOnly: true
      },
      {
        id: 'filebrowser.source',
        label: 'Media source path',
        type: 'path',
        editKind: 'unsupported',
        value: 'redacted-file',
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

function renderPanel(
  props: { snapshot?: SettingsStoreSnapshot; dispatch?: SettingsPanelDispatch } = {}
): SettingsPanelDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(SettingsPanel, {
    target: document.body,
    props: { snapshot: props.snapshot ?? createSnapshot(), dispatch }
  });
  return dispatch;
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (candidate) =>
      candidate.getAttribute('aria-label') === labelOrText ||
      candidate.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${labelOrText}`);
  }
  return match;
}

function inputFor(settingId: string): HTMLInputElement {
  const input = document.querySelector(`[data-setting-control="${settingId}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Input not found: ${settingId}`);
  return input;
}

function selectFor(settingId: string): HTMLSelectElement {
  const select = document.querySelector(`[data-setting-control="${settingId}"]`);
  if (!(select instanceof HTMLSelectElement)) throw new Error(`Select not found: ${settingId}`);
  return select;
}

function changeControl(control: HTMLInputElement | HTMLSelectElement): void {
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

async function setInput(settingId: string, value: string): Promise<void> {
  const input = inputFor(settingId);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  changeControl(input);
  await tick();
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
  expect(value).not.toContain('raw response body');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
}

function expectWrite(
  dispatch: SettingsPanelDispatch,
  settingId: string,
  value: SettingsSettingValue
): void {
  expect(dispatch.setValue).toHaveBeenCalledWith(settingId, value);
}

describe('SettingsPanel', () => {
  it('renders accessible settings navigation, cards, metadata, and load/write diagnostics', () => {
    renderPanel({
      snapshot: createSnapshot({
        lastWrite: {
          settingId: 'videoplayer.autoplaynextitem',
          value: true,
          status: 'success',
          at: '2026-05-01T20:00:00.000Z'
        },
        refreshAfterWrite: {
          settingId: 'videoplayer.autoplaynextitem',
          categoryId: 'videos',
          requestedAt: '2026-05-01T20:00:00.000Z',
          refreshed: true
        },
        writeCounts: { attempted: 2, succeeded: 1, failed: 1 }
      })
    });

    expect(
      document.querySelector('section[aria-labelledby="settings-panel-title"]')
    ).not.toBeNull();
    expect(document.querySelector('#settings-panel-title')?.textContent).toContain('Kodi Settings');
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Settings loaded.');
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(screenText()).toContain('Sections');
    expect(screenText()).toContain('Categories');
    expect(screenText()).toContain('Autoplay next item');
    expect(screenText()).toContain('Type: boolean');
    expect(screenText()).toContain('Default: false');
    expect(screenText()).toContain('Refresh after write: refreshed');
    expect(screenText()).toContain('Writes: 2 attempted, 1 succeeded, 1 failed');
    expect(inputFor('videoplayer.autoplaynextitem').getAttribute('aria-label')).toContain(
      'Autoplay next item'
    );
  });

  it('dispatches browsing and retry actions once per user gesture', async () => {
    const dispatch = renderPanel();

    button('Select settings section Services').click();
    button('Select settings category Music').click();
    button('Reload settings').click();
    await tick();

    expect(dispatch.selectSection).toHaveBeenCalledTimes(1);
    expect(dispatch.selectSection).toHaveBeenCalledWith('services');
    expect(dispatch.selectCategory).toHaveBeenCalledTimes(1);
    expect(dispatch.selectCategory).toHaveBeenCalledWith('music');
    expect(dispatch.load).toHaveBeenCalledTimes(1);
  });

  it('dispatches supported boolean, integer, number, string, and enum edits with coerced values', async () => {
    const dispatch = renderPanel();

    const checkbox = inputFor('videoplayer.autoplaynextitem');
    checkbox.checked = false;
    changeControl(checkbox);
    await setInput('videoplayer.seeksteps', '42');
    await setInput('videoscreen.brightness', '0.9');
    await setInput('services.devicename', 'Den projector');
    const select = selectFor('videoplayer.upscaling');
    select.value = 'nearest';
    changeControl(select);
    await tick();

    expectWrite(dispatch, 'videoplayer.autoplaynextitem', false);
    expectWrite(dispatch, 'videoplayer.seeksteps', 42);
    expectWrite(dispatch, 'videoscreen.brightness', 0.9);
    expectWrite(dispatch, 'services.devicename', 'Den projector');
    expectWrite(dispatch, 'videoplayer.upscaling', 'nearest');
  });

  it('suppresses unsupported, non-finite number, invalid integer, and invalid enum writes', async () => {
    const dispatch = renderPanel();

    expect(
      document.querySelector('[data-setting-control="services.webserverpassword"]')
    ).toBeNull();
    await setInput('videoplayer.seeksteps', '4.5');
    await setInput('videoscreen.brightness', 'Infinity');
    const select = selectFor('videoplayer.upscaling');
    select.value = 'hostile';
    changeControl(select);
    await tick();

    expect(dispatch.setValue).not.toHaveBeenCalled();
    expect(screenText()).toContain('Read-only: Kodi marks this string setting as unsupported.');
    expect(screenText()).toContain('Read-only: Kodi path settings are not safe to edit here.');
  });

  it('disables controls during pending load or write and renders rollback/success/error status safely', () => {
    renderPanel({
      snapshot: createSnapshot({
        loadStatus: 'loading',
        writeStatus: 'error',
        lastError: {
          source: 'write',
          code: 'http/failed',
          message:
            'Failed using [redacted-url] credentials [redacted] redacted payload redacted-file',
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: false
          }
        },
        lastWrite: {
          settingId: 'services.devicename',
          value: 'Bedroom',
          status: 'error',
          at: '2026-05-01T20:00:00.000Z'
        },
        rollbackValue: 'Living Room'
      })
    });

    expect(inputFor('services.devicename').disabled).toBe(true);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Failed using');
    expect(screenText()).toContain('Rollback value: Living Room');
    expectSecretSafe(screenText());
  });

  it('renders empty and malformed snapshots without throwing', () => {
    renderPanel({
      snapshot: createSnapshot({
        loadStatus: 'success',
        sections: [],
        categories: [],
        settings: [],
        selectedSectionId: 'missing',
        selectedCategoryId: 'missing'
      })
    });

    expect(screenText()).toContain('No settings sections are available.');
    expect(screenText()).toContain('No settings are available for this category.');
  });

  it('renders missing labels and active setting not found states with safe fallback copy', () => {
    renderPanel({
      snapshot: createSnapshot({
        settings: [
          {
            id: 'broken.setting',
            label: '',
            type: 'number',
            editKind: 'number',
            value: Number.NaN,
            defaultValue: null,
            options: [],
            readOnly: false
          }
        ],
        lastWrite: {
          settingId: 'missing.setting',
          value: true,
          status: 'pending',
          at: '2026-05-01T20:00:00.000Z'
        }
      })
    });

    expect(screenText()).toContain('Untitled setting');
    expect(screenText()).toContain('Read-only: this value cannot be represented safely.');
    expect(screenText()).toContain('Last write target is no longer visible.');
    expect(document.querySelector('[data-setting-control="broken.setting"]')).toBeNull();
  });

  it('renders an unsupported-only category with read-only explanations and no editable controls', () => {
    renderPanel({
      snapshot: createSnapshot({
        settings: [
          {
            id: 'library.clean',
            label: 'Clean library',
            type: 'action',
            editKind: 'unsupported',
            value: null,
            defaultValue: null,
            options: [],
            readOnly: true
          },
          {
            id: 'skin.customshortcut',
            label: 'Custom shortcut',
            type: 'custom',
            editKind: 'unsupported',
            value: 'safe value',
            defaultValue: null,
            options: [],
            readOnly: true
          }
        ]
      })
    });

    expect(screenText()).toContain('This category is read-only in Chorus.');
    expect(screenText()).toContain('Read-only: Kodi action settings are not editable values.');
    expect(screenText()).toContain('Read-only: Kodi custom settings are not supported.');
    expect(document.querySelectorAll('[data-setting-control]').length).toBe(0);
  });
});
