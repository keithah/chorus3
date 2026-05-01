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

  test('creates deterministic safe add-ons list and detail fixture props for direct add-ons routes', () => {
    const listProps = createM005BrowserProofAppProps({
      pathname: '/addons',
      search: '?m005-browser-proof=1'
    });
    const detailProps = createM005BrowserProofAppProps({
      pathname: '/addons/plugin.video.safe-demo',
      search: '?m005-browser-proof=1'
    });

    expect(listProps.route).toEqual({ kind: 'addons' });
    expect(listProps.addonsSnapshot).toMatchObject({
      loadStatus: 'success',
      detailStatus: 'idle',
      writeStatus: 'idle',
      selectedAddonId: null,
      searchQuery: 'safe',
      groupBy: 'type',
      writeCounts: { attempted: 3, succeeded: 1, failed: 1 }
    });
    expect(listProps.addonsSnapshot?.addons.map((addon) => addon.name)).toEqual([
      'Safe Video Demo',
      'Safe Helper Module',
      'Safe Radio'
    ]);
    expect(listProps.addonsSnapshot?.groups.map((group) => group.label)).toEqual([
      'xbmc.python.pluginsource',
      'xbmc.python.module',
      'xbmc.addon.audio'
    ]);

    expect(detailProps.route).toEqual({ kind: 'addonDetail', addonid: 'plugin.video.safe-demo' });
    expect(detailProps.addonsSnapshot).toMatchObject({
      loadStatus: 'success',
      detailStatus: 'success',
      writeStatus: 'error',
      selectedAddonId: 'plugin.video.safe-demo',
      pendingToggle: { addonid: 'plugin.video.safe-demo', enabled: true },
      lastWrite: { addonid: 'plugin.audio.safe-radio', enabled: false, status: 'error' },
      rollbackEnabled: true,
      refreshAfterWrite: { addonid: 'plugin.audio.safe-radio', refreshed: false },
      lastError: { code: 'fixture.addon-write-rejected' }
    });
    expect(detailProps.addonsSnapshot?.detail?.name).toBe('Safe Video Demo');
    expect(isM005BrowserProofFixtureSecretSafe(listProps)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(detailProps)).toBe(true);
  });

  test('creates deterministic safe Lab route fixtures only for direct Lab routes', () => {
    const shortcuts = createM005BrowserProofAppProps({
      pathname: '/lab/shortcuts',
      search: '?m005-browser-proof=1'
    });
    const apiBrowser = createM005BrowserProofAppProps({
      pathname: '/lab/api-browser',
      search: '?m005-browser-proof=1'
    });
    const unsafe = createM005BrowserProofAppProps({
      pathname: '/lab/api-browser/Authorization/Basic/SENTINEL_SECRET',
      search: '?m005-browser-proof=1&token=Basic'
    });

    expect(shortcuts.route).toEqual({ kind: 'labShortcuts' });
    expect(shortcuts.labApiBrowserSnapshot).toBeUndefined();
    expect(apiBrowser.route).toEqual({ kind: 'labApiBrowser' });
    expect(apiBrowser.labApiBrowserSnapshot).toMatchObject({
      introspectionStatus: 'success',
      callStatus: 'needs-confirmation',
      selectedMethodName: 'Player.Open',
      validationError: 'Confirm this mutating JSON-RPC method before running it.'
    });
    expect(apiBrowser.labApiBrowserSnapshot?.methods.map((method) => method.name)).toEqual([
      'Application.GetProperties',
      'Player.Open',
      'System.Shutdown'
    ]);
    expect(apiBrowser.labApiBrowserSnapshot?.methods[1].guard.level).toBe('confirmation-required');
    expect(apiBrowser.labApiBrowserSnapshot?.methods[2].guard.level).toBe('blocked');
    expect(apiBrowser.labApiBrowserSnapshot?.rawRequestJson).toContain('Player.Open');
    expect(apiBrowser.labApiBrowserSnapshot?.rawResponseJson).toContain('redactedField1');
    expect(apiBrowser.labApiBrowserSnapshot?.lastError?.message).toContain('Confirm this mutating');
    expect(unsafe.route.kind).toBe('labUnknown');
    expect(unsafe.labApiBrowserSnapshot).toBeUndefined();
    expect(JSON.stringify(unsafe.route)).not.toMatch(
      /admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
    expect(isM005BrowserProofFixtureSecretSafe(apiBrowser)).toBe(true);
  });

  test('uses inert Lab API browser dispatches without network or browser storage side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM005BrowserProofAppProps({ pathname: '/lab/api-browser' });

    await expect(props.labApiBrowserDispatch?.loadIntrospection()).resolves.toBeUndefined();
    await expect(props.labApiBrowserDispatch?.retryIntrospection()).resolves.toBeUndefined();
    await expect(
      props.labApiBrowserDispatch?.selectMethod('Application.GetProperties')
    ).resolves.toBeUndefined();
    await expect(props.labApiBrowserDispatch?.setParamsText('{}')).resolves.toBeUndefined();
    await expect(props.labApiBrowserDispatch?.runSelectedMethod()).resolves.toBeUndefined();
    await expect(props.labApiBrowserDispatch?.confirmSelectedMethod()).resolves.toBeUndefined();
    await expect(props.labApiBrowserDispatch?.clearConfirmation()).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM005BrowserProofFixtureSecretSafe(props.labApiBrowserDispatch)).toBe(true);
  });

  test('keeps add-ons fixtures direct-route-only and excludes unsafe subpaths', () => {
    const unsafe = createM005BrowserProofAppProps({
      pathname: '/addons/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET',
      search: '?m005-browser-proof=1&token=Basic'
    });
    const nested = createM005BrowserProofAppProps({
      pathname: '/addons/plugin.video.safe-demo/extra',
      search: '?m005-browser-proof=1'
    });
    const settings = createM005BrowserProofAppProps({
      pathname: '/settings',
      search: '?m005-browser-proof=1'
    });

    expect(unsafe.route.kind).toBe('addonsUnknown');
    expect(unsafe.addonsSnapshot).toBeUndefined();
    expect(nested.route.kind).toBe('addonsUnknown');
    expect(nested.addonsSnapshot).toBeUndefined();
    expect(settings.settingsSnapshot).toBeDefined();
    expect(settings.addonsSnapshot).toBeUndefined();
    expect(JSON.stringify(unsafe.route)).not.toMatch(
      /admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
  });

  test('returns fresh clone-safe add-ons snapshots and inert dispatches without side effects', async () => {
    const first = createM005BrowserProofAppProps({ pathname: '/addons' });
    const second = createM005BrowserProofAppProps({ pathname: '/addons' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');

    expect(first.addonsSnapshot).toBeDefined();
    expect(second.addonsSnapshot).toBeDefined();
    expect(first.addonsSnapshot).not.toBe(second.addonsSnapshot);
    expect(first.addonsSnapshot?.addons[0]).not.toBe(second.addonsSnapshot?.addons[0]);
    first.addonsSnapshot!.addons[0].name = 'Mutated fixture name';
    expect(second.addonsSnapshot?.addons[0].name).toBe('Safe Video Demo');

    await expect(first.addonsDispatch?.load()).resolves.toBeUndefined();
    await expect(first.addonsDispatch?.retry()).resolves.toBeUndefined();
    await expect(first.addonsDispatch?.setSearchQuery('video')).resolves.toBeUndefined();
    await expect(first.addonsDispatch?.setGroupBy('enabled')).resolves.toBeUndefined();

    const detail = createM005BrowserProofAppProps({ pathname: '/addons/plugin.video.safe-demo' });
    await expect(detail.addonDetailDispatch?.load()).resolves.toBeUndefined();
    await expect(detail.addonDetailDispatch?.retry()).resolves.toBeUndefined();
    await expect(
      detail.addonDetailDispatch?.setAddonEnabled('plugin.video.safe-demo', true)
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM005BrowserProofFixtureSecretSafe(first.addonsDispatch)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(detail.addonDetailDispatch)).toBe(true);
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
