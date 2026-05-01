import { describe, expect, test, vi } from 'vitest';

import {
  M005_BROWSER_PROOF_FORBIDDEN_TEXT,
  createM005BrowserProofAppProps,
  isM005BrowserProofFixtureSecretSafe
} from './m005BrowserProofFixtures';

function collectText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'function') return value.toString();
  if (Array.isArray(value)) return value.map(collectText).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectText(nested)}`)
      .join('\n');
  }
  return '';
}

describe('createM005BrowserProofAppProps', () => {
  test('creates deterministic safe settings fixture props for the direct settings route', () => {
    const props = createM005BrowserProofAppProps({
      pathname: '/settings',
      search: '?m005-browser-proof=1'
    });

    const snapshot = props.settingsSnapshot;
    expect(snapshot).toBeDefined();
    if (!snapshot) throw new Error('Expected settings fixture snapshot.');

    expect(props.route).toEqual({ kind: 'settings' });
    expect(snapshot).toMatchObject({
      loadStatus: 'success',
      writeStatus: 'error',
      selectedSectionId: 'player',
      selectedCategoryId: 'videos',
      writeCounts: { attempted: 4, succeeded: 2, failed: 1 }
    });
    expect(snapshot.sections.map((section) => section.label)).toEqual(['Player', 'Services']);
    expect(snapshot.categories.map((category) => category.label)).toEqual(['Videos', 'Interface']);
    expect(snapshot.settings.map((setting) => setting.label)).toEqual(
      expect.arrayContaining([
        'Autoplay next item',
        'Seek step size',
        'HDR tone mapping',
        'Friendly device name',
        'Scaling method',
        'Pending write proof',
        'Saved write proof',
        'Rejected write proof',
        'Media source path'
      ])
    );
    expect(snapshot.lastError).toMatchObject({
      source: 'write',
      code: 'fixture/rejected-write',
      message: expect.stringContaining('safe fixture write rejection')
    });
    expect(snapshot.lastWrite).toMatchObject({
      settingId: 'fixture.rejectedwrite',
      value: 'blocked fixture value',
      status: 'error'
    });
    expect(snapshot.rollbackValue).toBe('previous safe value');
    expect(snapshot.refreshAfterWrite).toMatchObject({
      settingId: 'fixture.pendingwrite',
      categoryId: 'videos',
      refreshed: false
    });
    expect(snapshot.settings.find((setting) => setting.id === 'filebrowser.source')).toMatchObject({
      editKind: 'unsupported',
      readOnly: true,
      value: 'redacted-file'
    });
    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
  });

  test('returns only safe routed props for unsafe settings subpaths and unrelated routes', () => {
    const unsafe = createM005BrowserProofAppProps({
      pathname: '/settings/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET',
      search: '?m005-browser-proof=1&token=Basic'
    });
    const unrelated = createM005BrowserProofAppProps({
      pathname: '/video/movies',
      search: '?m005-browser-proof=1'
    });

    expect(unsafe.route.kind).toBe('settingsUnknown');
    expect(unsafe.settingsSnapshot).toBeUndefined();
    expect(JSON.stringify(unsafe.route)).not.toMatch(
      /admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
    expect(unrelated.route).toEqual({ kind: 'video', route: { kind: 'videoMovies' } });
    expect(unrelated.settingsSnapshot).toBeUndefined();
  });

  test('uses inert settings dispatches without network or browser storage side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM005BrowserProofAppProps({ pathname: '/settings' });

    await expect(props.settingsDispatch?.load()).resolves.toBeUndefined();
    await expect(props.settingsDispatch?.retry()).resolves.toBeUndefined();
    await expect(props.settingsDispatch?.selectSection('services')).resolves.toBeUndefined();
    await expect(props.settingsDispatch?.selectCategory('interface')).resolves.toBeUndefined();
    await expect(
      props.settingsDispatch?.setValue('videoplayer.autoplaynextitem', false)
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM005BrowserProofFixtureSecretSafe(props.settingsDispatch)).toBe(true);
  });

  test('keeps every fixture value clear of forbidden text and sentinel secrets', () => {
    const props = createM005BrowserProofAppProps({ pathname: '/settings' });
    const text = collectText(props);

    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(text).not.toContain(forbidden);
    }
  });
});
