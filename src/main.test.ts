import { readFileSync } from 'node:fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KODI_WEBINTERFACE_BASE_PATH } from './lib/app/appRouter';
import { M005_BROWSER_PROOF_FORBIDDEN_TEXT } from './lib/testing/m005BrowserProofFixtures';
import { M007_VISUAL_PROOF_FORBIDDEN_TEXT } from './lib/testing/m007VisualProofFixtures';
import { THEME_STORAGE_KEY } from './lib/theme/theme';

async function importMain(): Promise<typeof import('./main')> {
  return import('./main');
}

function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`);
}

function setPathAndSearch(pathname: string, search = ''): void {
  window.history.replaceState({}, '', `${pathname}${search}`);
}

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    document.querySelector('meta[name="chorus3:kodi-webinterface"]')?.remove();
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
    setSearch('');
  });

  it('keeps Vite production assets relative for Kodi package installs', () => {
    const viteConfigSource = readFileSync('vite.config.ts', 'utf8');

    expect(viteConfigSource).toMatch(/base:\s*['"]\.\/['"]/);
  });

  it('resolves Kodi package-mounted entrypoint routes to in-app routes', async () => {
    const { resolveEntrypointRoute } = await importMain();

    expect(
      resolveEntrypointRoute({ pathname: '/addons/webinterface.chorus3', search: '' })
    ).toEqual({
      kind: 'primary',
      route: { kind: 'home' }
    });
    expect(
      resolveEntrypointRoute({
        pathname: '/addons/webinterface.chorus3/now-playing',
        search: '?theme=light&locale=de'
      })
    ).toEqual({ kind: 'nowPlaying' });
    expect(
      resolveEntrypointRoute({
        pathname: '/addons/webinterface.chorus3/local-player/movie/1',
        search: ''
      })
    ).toEqual({ kind: 'localPlayer', media: 'movie', id: 1 });
    expect(
      resolveEntrypointRoute({
        pathname: '/addons/webinterface.chorus3/%2FAuthorization/Basic',
        search: '?token=Basic'
      })
    ).toEqual({ kind: 'settingsUnknown', pathLabel: '/[redacted]/[redacted]' });
  }, 15000);

  it('resolves package-mounted Chorus2 parity URLs to typed routes without reflecting unsafe input', async () => {
    const { resolveEntrypointAppProps, resolveEntrypointRoute } = await importMain();

    expect(
      resolveEntrypointRoute({
        pathname: '/addons/webinterface.chorus3/remote',
        search: '?endpoint=http://user:pass@example/jsonrpc&token=Basic'
      })
    ).toEqual({ kind: 'primary', route: { kind: 'remote' } });

    for (const [pathname, expectedRoute] of [
      ['/addons/webinterface.chorus3/help', { kind: 'primary', route: { kind: 'help' } }],
      ['/addons/webinterface.chorus3/playlists', { kind: 'primary', route: { kind: 'playlists' } }],
      [
        '/addons/webinterface.chorus3/settings/web',
        { kind: 'primary', route: { kind: 'settingsWeb' } }
      ],
      [
        '/addons/webinterface.chorus3/lab/screenshot',
        { kind: 'primary', route: { kind: 'labScreenshot' } }
      ],
      ['/addons/webinterface.chorus3/pvr/tv', { kind: 'primary', route: { kind: 'pvrTv' } }]
    ] as const) {
      const route = resolveEntrypointRoute({ pathname, search: '?token=Basic' });
      expect(route).toMatchObject(expectedRoute);
      expect(JSON.stringify(route)).not.toMatch(
        /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password|token|localStorage|sessionStorage/i
      );
    }

    expect(
      resolveEntrypointAppProps({
        pathname: '/addons/webinterface.chorus3/remote',
        search: '?password=CHORUS3_SENTINEL_SECRET&token=Basic',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toMatchObject({
      route: { kind: 'primary', route: { kind: 'remote' } },
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'kodi.local',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });
  });

  it('mounts package-mounted Chorus2 PVR routes without reflecting unsafe path or query input', async () => {
    setPathAndSearch(
      '/addons/webinterface.chorus3/pvr/tv',
      '?password=CHORUS3_SENTINEL_SECRET&token=Basic&next=smb://admin:p@ssword@nas/private'
    );

    await importMain();

    expect(document.body.textContent).toContain('PVR');
    expect(document.body.textContent).toContain('TV Channels');
    expect(document.body.textContent).toContain('No TV channels found.');
    expect(document.body.textContent).not.toContain('Classic surface');
    expect(document.body.textContent).not.toContain('Future owner');
    expect(document.body.textContent).not.toContain('Settings route not found');
    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password|token|smb:\/\/|admin:p@ssword|localStorage|sessionStorage/i
    );
  }, 15000);

  it('derives a local-only Kodi host from package-mounted entrypoint origins', async () => {
    const { resolveEntrypointAppProps, resolveEntrypointRoute } = await importMain();

    expect(
      resolveEntrypointAppProps({
        pathname: '/addons/webinterface.chorus3',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'primary', route: { kind: 'home' } },
      packageBasePath: '/addons/webinterface.chorus3',
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'kodi.local',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });

    expect(
      resolveEntrypointAppProps({
        pathname: '/',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({ route: { kind: 'primary', route: { kind: 'home' } } });

    expect(
      resolveEntrypointAppProps({
        pathname: '/Users/keith/Library/Application%20Support/Kodi/addons/webinterface.chorus3/',
        hash: '#music/genres',
        search: '',
        protocol: 'http:',
        hostname: 'localhost',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'primary', route: { kind: 'musicGenres' } },
      packageBasePath:
        '/Users/keith/Library/Application%20Support/Kodi/addons/webinterface.chorus3',
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'localhost',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });

    expect(
      resolveEntrypointAppProps({
        pathname: '/addons/webinterface.chorus3/index.html',
        hash: '#music/genres',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'primary', route: { kind: 'musicGenres' } },
      packageBasePath: '/addons/webinterface.chorus3',
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'kodi.local',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });

    expect(
      resolveEntrypointRoute({
        pathname: '/',
        hash: '#music',
        search: ''
      })
    ).toEqual({ kind: 'primary', route: { kind: 'music' } });

    expect(
      resolveEntrypointRoute({
        pathname: '/thumbsup',
        hash: '#thumbs-song',
        search: ''
      })
    ).toEqual({ kind: 'primary', route: { kind: 'thumbsup' } });

    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta name="chorus3:kodi-webinterface" content="webinterface.chorus3">'
    );

    expect(
      resolveEntrypointAppProps({
        pathname: '/',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'primary', route: { kind: 'home' } },
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'kodi.local',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });
  });

  it('supplies package host props only for package-mounted paths or marker-backed root', async () => {
    const { resolveEntrypointAppProps } = await importMain();
    const expectedHost = {
      id: 'kodi-package-origin',
      label: 'This Kodi',
      host: 'kodi.local',
      port: 8080,
      useTls: false,
      useWebSocket: false
    };

    for (const [pathname, expectedRoute] of [
      [`${KODI_WEBINTERFACE_BASE_PATH}/`, { kind: 'primary', route: { kind: 'home' } }],
      [`${KODI_WEBINTERFACE_BASE_PATH}/remote`, { kind: 'primary', route: { kind: 'remote' } }],
      [`${KODI_WEBINTERFACE_BASE_PATH}/help`, { kind: 'primary', route: { kind: 'help' } }]
    ] as const) {
      expect(
        resolveEntrypointAppProps({
          pathname,
          search: '?password=CHORUS3_SENTINEL_SECRET&token=Basic',
          protocol: 'http:',
          hostname: 'kodi.local',
          port: '8080'
        })
      ).toMatchObject({
        route: expectedRoute,
        packageMountedHost: expectedHost
      });
    }

    expect(
      resolveEntrypointAppProps({
        pathname: '/',
        search: '?password=CHORUS3_SENTINEL_SECRET&token=Basic',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({ route: { kind: 'primary', route: { kind: 'home' } } });

    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta name="chorus3:kodi-webinterface" content="webinterface.chorus3">'
    );

    expect(
      resolveEntrypointAppProps({
        pathname: '/',
        search: '?password=CHORUS3_SENTINEL_SECRET&token=Basic',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'primary', route: { kind: 'home' } },
      packageMountedHost: expectedHost
    });
  });

  it('mounts the Svelte app into the root element', async () => {
    await importMain();

    expect(document.body.textContent).toContain('Search Kodi');
    expect(document.body.textContent).toContain('Recently Added Albums');
    expect(document.body.textContent).toContain('Recently Played Albums');
  });

  it('applies the stored root theme before rendering', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    await importMain();

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('mounts direct now-playing M005 browser-proof fixtures with query theme and German locale without persisting theme or exposing forbidden text', async () => {
    setPathAndSearch('/now-playing', '?m005-browser-proof=1&theme=light&locale=de');

    await importMain();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.body.textContent).toContain('Aktuelle Wiedergabe einbetten');
    expect(document.body.textContent).toContain('Safe Room Kodi');
    expect(document.body.textContent).toContain('Aurora Signal');
    expect(document.body.textContent).not.toContain('Now playing embed');
    expect(document.body.textContent).not.toContain('Music Library');
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }
  });

  it('mounts direct now-playing setup fixtures and keeps M005 now-playing fixtures off unrelated routes', async () => {
    setPathAndSearch('/now-playing', '?m005-browser-proof=1&embed-state=setup&locale=de');

    await importMain();

    expect(document.body.textContent).toContain('Einrichtung erforderlich');
    expect(document.body.textContent).toContain(
      'Einrichtung erforderlich, bevor die Aktuelle-Wiedergabe-Einbettung verbinden kann.'
    );
    expect(document.body.textContent).not.toContain('Aurora Signal');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/settings', '?m005-browser-proof=1&embed-state=setup');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Aurora Signal');
    expect(document.body.textContent).not.toContain('Now playing embed');
  });

  it('rejects credential-bearing now-playing query values through the real entrypoint without reflecting secrets', async () => {
    setPathAndSearch(
      '/now-playing',
      '?m005-browser-proof=1&username=admin&password=CHORUS3_SENTINEL_SECRET&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('unsafe URL parameters were blocked');
    expect(document.body.textContent).toContain('Aurora Signal');
    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password=|token=|username|password|token|localStorage|sessionStorage|https?:\/\//i
    );
  });

  it('keeps default and disabled fixture query modes on the live/default app props', async () => {
    await importMain();

    expect(document.body.textContent).toContain('Recently Added Albums');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Pastel Blues');
    expect(document.body.textContent).not.toContain('Feeling Good');
    expect(document.body.textContent).not.toContain('I Put a Spell on You');
    expect(document.body.textContent).not.toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Quiet Signal');
    expect(document.body.textContent).not.toContain('Signal Mirror');
    expect(document.body.textContent).not.toContain('Rain City Thrillers.xsp');
    expect(document.body.textContent).not.toContain('Safe Video Demo');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setSearch('?m003-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Recently Added Albums');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Sinnerman.flac');
    expect(document.body.textContent).not.toContain('Feeling Good');
    expect(document.body.textContent).not.toContain('I Put a Spell on You');
    expect(document.body.textContent).not.toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Quiet Signal');
    expect(document.body.textContent).not.toContain('Signal Mirror');
    expect(document.body.textContent).not.toContain('Rain City Thrillers.xsp');
    expect(document.body.textContent).not.toContain('Safe Video Demo');
  });

  it('mounts populated M003 browser-proof fixtures in test mode when explicitly requested', async () => {
    setSearch('?m003-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Nina Simone');
    expect(document.body.textContent).toContain('Pastel Blues');
    expect(document.body.textContent).toContain('Recently Added');
    expect(document.body.textContent).toContain('Recently Played');
    expect(document.body.textContent).toContain('I Put a Spell on You');
    expect(document.body.textContent).toContain('Play');
    expect(document.body.textContent).toContain('Queue');
    expect(document.body.textContent).toContain('Albums');
    expect(document.body.textContent).toContain('Download');
    expect(document.body.textContent).not.toContain('Sinnerman.flac');
    expect(document.body.textContent).not.toContain('Late Night Jazz.xsp');
  });

  it('mounts populated M005 browser-proof fixtures for the direct settings route', async () => {
    setPathAndSearch('/settings', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('General options');
    expect(document.body.textContent).toContain('Web interface');
    expect(document.body.textContent).toContain('Default player');
    expect(document.body.textContent).toContain('Keyboard controls');
    expect(document.body.textContent).toContain('List options');
    expect(document.body.textContent).toContain('Appearance');
    expect(document.body.textContent).not.toContain('Settings support is loading for this route.');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
    expect(document.body.textContent).not.toContain('sessionStorage');
  });

  it('mounts M005 Settings browser-proof fixtures through the real entrypoint without route reload or forbidden tokens', async () => {
    setPathAndSearch('/settings', '?m005-browser-proof=1');

    await importMain();

    const beforePath = window.location.pathname;
    const beforeSearch = window.location.search;
    expect(document.body.textContent).toContain('General options');
    expect(document.body.textContent).toContain('Web interface');

    expect(window.location.pathname).toBe(beforePath);
    expect(window.location.search).toBe(beforeSearch);
    expect(document.body.textContent).toContain('General options');
    expect(document.body.textContent).toContain('Web interface');
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }
  });

  it('mounts M005 German settings fixture only when the locale query is valid', async () => {
    setPathAndSearch('/settings', '?m005-browser-proof=1&locale=de');

    await importMain();

    expect(document.body.textContent).toContain('General options');
    expect(document.body.textContent).toContain('Web interface');
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/settings', '?m005-browser-proof=1&locale=fr');

    await importMain();

    expect(document.body.textContent).toContain('General options');
    expect(document.body.textContent).not.toContain('Kodi-Einstellungen');
    expect(window.localStorage.getItem('chorus3.locale')).toBeNull();
  });

  it('mounts populated M005 browser-proof fixtures for direct add-ons routes only', async () => {
    setPathAndSearch('/addons', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Add-ons');
    expect(document.body.textContent).toContain('Safe Video Demo');
    expect(document.body.textContent).toContain('Safe Radio');
    expect(document.body.textContent).toContain('Broken: Safe fixture dependency missing');
    expect(document.body.textContent).not.toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/addons/plugin.video.safe-demo', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Safe Video Demo');
    expect(document.body.textContent).toContain('Add-on detail loaded.');
    expect(document.body.textContent).toContain('Enable add-on');
    expect(document.body.textContent).toContain('Refresh after write warning');
    expect(document.body.textContent).toContain('fixture.addon-write-rejected');
  });

  it('keeps unknown M005 browser-proof Lab routes non-routable while allowing real Lab routes', async () => {
    setPathAndSearch('/lab/shortcuts', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Lab route not found');
    expect(document.body.textContent).toContain('/lab/shortcuts');
    expect(document.body.textContent).not.toContain('Lab API browser');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/lab/api-browser', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Lab API browser');
    expect(document.body.textContent).not.toContain('Player.Open');
    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|admin:p@ssword|SENTINEL_SECRET|localStorage|sessionStorage|smb:\/\//i
    );
  });

  it('does not expose M005 Lab API fixtures when the flag is absent, disabled, production-like, or route is unsafe', async () => {
    setPathAndSearch('/lab/api-browser', '');

    await importMain();

    expect(document.body.textContent).toContain('Lab API browser');
    expect(document.body.textContent).not.toContain('Player.Open');
    expect(document.body.textContent).not.toContain('fixture-ok');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/lab/api-browser', '?m005-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Lab API browser');
    expect(document.body.textContent).not.toContain('Player.Open');

    const { resolveEntrypointAppProps } = await importMain();
    expect(
      resolveEntrypointAppProps(
        { pathname: '/lab/api-browser', search: '?m005-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toEqual({ route: { kind: 'primary', route: { kind: 'labApiBrowser' } } });

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch(
      '/lab/api-browser/Authorization/Basic/SENTINEL_SECRET/localStorage',
      '?m005-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Lab route not found');
    expect(document.body.textContent).toContain('/lab/[redacted]');
    expect(document.body.textContent).not.toContain('Player.Open');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('does not expose M005 add-ons fixtures when the flag is absent, disabled, or route is unsafe', async () => {
    setPathAndSearch('/addons', '');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Add-ons');
    expect(document.body.textContent).not.toContain('Safe Video Demo');
    expect(document.body.textContent).not.toContain('Safe Helper Module');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/addons', '?m005-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Add-ons');
    expect(document.body.textContent).not.toContain('Safe Video Demo');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch(
      '/addons/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET/localStorage',
      '?m005-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Add-ons route not found');
    expect(document.body.textContent).not.toContain('Safe Video Demo');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('does not expose M005 settings fixtures on unrelated routes or disabled fixture mode', async () => {
    setPathAndSearch('/video/movies', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Movies');
    expect(document.body.textContent).toContain('All movies');
    expect(document.body.textContent).not.toContain('Autoplay next item');
    expect(document.body.textContent).not.toContain('Rejected write proof');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/settings', '?m005-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('General options');
    expect(document.body.textContent).not.toContain('Autoplay next item');
    expect(document.body.textContent).not.toContain('Rejected write proof');
  });

  it('mounts a safe settings unknown route without raw unsafe input', async () => {
    setPathAndSearch(
      '/settings/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET/localStorage/sessionStorage',
      '?m005-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Settings route not found');
    expect(document.body.textContent).toContain('/settings/[redacted]/[redacted]');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
    expect(document.body.textContent).not.toContain('sessionStorage');
  });

  it('mounts populated M004 browser-proof fixtures for direct video grid recent sections and playlists', async () => {
    setPathAndSearch('/video/movies', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Video Movies');
    expect(document.body.textContent).toContain('2 of 503 movies');
    expect(document.body.textContent).toContain('Recent Video');
    expect(document.body.textContent).toContain('Recently added movies');
    expect(document.body.textContent).toContain('Recently played episodes');
    expect(document.body.textContent).toContain('Signal Mirror');
    expect(document.body.textContent).toContain('Cold Open');
    expect(document.body.textContent).toContain('Video playlists');
    expect(document.body.textContent).toContain('Rain City Thrillers.xsp');
    expect(document.body.textContent).toContain('Video item without available actions');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('mounts populated M004 browser-proof fixtures for direct video grid and detail routes in test mode', async () => {
    setPathAndSearch('/video/movies/4401', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Neon Harbor');
    expect(document.body.textContent).toContain(
      'A courier crosses a rain-lit city to protect a copied memory.'
    );
    expect(document.body.textContent).toContain('Science Fiction, Thriller');
    expect(document.body.textContent).toContain('2 versions available');
    expect(document.body.textContent).toContain('Play');
    expect(document.body.textContent).toContain('Resume');
    expect(document.body.textContent).toContain('Queue');
    expect(document.body.textContent).toContain('Mark unwatched');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/movies/4402', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Quiet Signal');
    expect(document.body.textContent).toContain('Movie ID 4402');
    expect(document.body.textContent).toContain('Movie versions unsupported');
    expect(document.body.textContent).toContain('Back to movies');
  });

  it('mounts populated M004 browser-proof fixtures for direct TV routes in test mode', async () => {
    setPathAndSearch('/video/tv', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('TV Shows');
    expect(document.body.textContent).toContain('Aurora Files');
    expect(document.body.textContent).toContain('3 unwatched episodes');
    expect(document.body.textContent).toContain('Recent Video');
    expect(document.body.textContent).toContain('Video playlists');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv/5501', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Aurora Files');
    expect(document.body.textContent).toContain('Season 1');
    expect(document.body.textContent).toContain('Poster artwork available');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv/5501/seasons/1', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Season 1');
    expect(document.body.textContent).toContain('Signal Mirror');
    expect(document.body.textContent).toContain('Season artwork unsupported');
    expect(document.body.textContent).toContain('Refresh artwork');
    expect(document.body.textContent).toContain('Mark season watched');
    expect(document.body.textContent).toContain('Mark season unwatched');
    expect(document.body.textContent).toContain('Season write actions are ready.');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv/5501/seasons/1/episodes/6601', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Signal Mirror');
    expect(document.body.textContent).toContain('Episode ID 6601');
    expect(document.body.textContent).toContain('Resume available');
    expect(document.body.textContent).toContain('Stream');
    expect(document.body.textContent).toContain('Mark watched');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('does not expose M004 TV fixture labels in default or disabled rendering', async () => {
    setPathAndSearch('/video/tv', '');

    await importMain();

    expect(document.body.textContent).not.toContain('Aurora Files');
    expect(document.body.textContent).not.toContain('Signal Mirror');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv', '?m004-browser-proof=0');

    await importMain();

    expect(document.body.textContent).not.toContain('Aurora Files');
    expect(document.body.textContent).not.toContain('Signal Mirror');
  });

  it('mounts safe M004 browser stream fixtures only when explicitly requested', async () => {
    setPathAndSearch('/video/movies/4401/stream', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Browser stream');
    expect(document.body.textContent).toContain('Neon Harbor');
    expect(document.body.textContent).toContain('Local browser playback is paused.');
    expect(document.body.textContent).toContain('Resume point available at 30:30.');
    expect(document.body.querySelector('video.local-media-runtime.fullscreen')).toBeInstanceOf(
      HTMLVideoElement
    );
    expect(document.body.textContent).toContain('Play in browser');
    expect(document.body.textContent).toContain('Resume in browser');
    expect(document.body.textContent).toContain('Retry');
    expect(document.body.textContent).toContain('Send to Kodi');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('localStorage');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/movies/4401/stream', '?m004-browser-proof=0');

    await importMain();

    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Local browser playback is paused.');
  });

  it('routes unknown video paths to safe in-app not-found UI without raw unsafe input', async () => {
    setPathAndSearch(
      '/video/smb://admin:p@ssword@example.local/Authorization/SENTINEL_SECRET',
      '?m004-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Video route not found');
    expect(document.body.textContent).toContain('Movies');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
  });

  it('exposes M005 pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { resolveEntrypointRoute, shouldUseM005BrowserProofFixtures } = await importMain();

    expect(resolveEntrypointRoute({ pathname: '/settings', search: '?ignored=1' })).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
    expect(resolveEntrypointRoute({ pathname: '/settings/', search: '?ignored=1' })).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
    expect(
      resolveEntrypointRoute({
        pathname: '/settings/Authorization/Basic/admin:p@ssword/SENTINEL_SECRET',
        search: '?token=Basic'
      })
    ).toEqual({
      kind: 'settingsUnknown',
      pathLabel: '/settings/[redacted]/[redacted]/[redacted]/[redacted]'
    });
    expect(resolveEntrypointRoute({ pathname: '?m005-browser-proof=1', search: '' })).toEqual({
      kind: 'primary',
      route: { kind: 'home' }
    });
    expect(resolveEntrypointRoute({ pathname: '//settings//', search: '' })).toEqual({
      kind: 'primary',
      route: { kind: 'settingsWeb' }
    });
    expect(
      resolveEntrypointRoute({
        get pathname(): string {
          throw new Error('untrusted location');
        },
        search: '?m005-browser-proof=1'
      }).kind
    ).toBe('dashboard');
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM005BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM005BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('exposes M004 pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { resolveEntrypointRoute, shouldUseM004BrowserProofFixtures } = await importMain();

    expect(
      resolveEntrypointRoute({ pathname: '/video/movies/4401/stream', search: '?ignored=1' })
    ).toEqual({
      kind: 'video',
      route: {
        kind: 'videoMovieStream',
        movieid: 4401
      }
    });
    expect(
      resolveEntrypointRoute({ pathname: '/video/movies/4401', search: '?ignored=1' })
    ).toEqual({
      kind: 'video',
      route: {
        kind: 'videoMovieDetail',
        movieid: 4401
      }
    });
    expect(
      resolveEntrypointRoute({
        pathname: '/video/tv/5501/seasons/1/episodes/6601',
        search: '?ignored=1'
      })
    ).toEqual({
      kind: 'video',
      route: {
        kind: 'videoEpisodeDetail',
        tvshowid: 5501,
        season: 1,
        episodeid: 6601
      }
    });
    expect(resolveEntrypointRoute(undefined)).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(
      resolveEntrypointRoute({
        get pathname(): string {
          throw new Error('untrusted location');
        },
        search: '?m004-browser-proof=1'
      }).kind
    ).toBe('dashboard');
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM004BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM004BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('exposes M007 pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { resolveEntrypointAppProps, shouldUseM007VisualProofFixtures } = await importMain();

    expect(
      shouldUseM007VisualProofFixtures(
        { search: '?m007-visual-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM007VisualProofFixtures(
        { search: '?m007-visual-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM007VisualProofFixtures(
        { search: '?m007-visual-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM007VisualProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM007VisualProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM007VisualProofFixtures(
        { search: '?m007-visual-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
    expect(
      resolveEntrypointAppProps(
        { pathname: '/addons/video', search: '?m007-visual-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toEqual({ route: { kind: 'primary', route: { kind: 'addonsVideo' } } });
  });

  it('mounts M007 visual proof fixtures through the real entrypoint without reflecting unsafe query values', async () => {
    setPathAndSearch(
      '/addons/webinterface.chorus3/addons/plugin.video.safe-demo',
      '?m007-visual-proof=1&token=Basic&password=CHORUS3_SENTINEL_SECRET&next=smb://admin:p@ssword@nas/private&storage=localStorage'
    );

    await importMain();

    expect(document.body.querySelector('[aria-label="Chorus media controller"]')).toBeInstanceOf(
      HTMLElement
    );
    expect(document.body.querySelector('[data-app-page-surface]')).toBeInstanceOf(HTMLElement);
    expect(document.body.textContent).toContain('Safe Video Demo');
    expect(document.body.textContent).toContain('Add-on detail loaded.');
    expect(document.body.textContent).not.toContain('Setup console');
    expect(document.body.textContent).not.toContain('Add-ons route not found');
    for (const forbidden of M007_VISUAL_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }
  });

  it('exposes pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { shouldUseM003BrowserProofFixtures } = await importMain();

    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM003BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM003BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('keeps the existing explicit mount error when #app is missing', async () => {
    document.body.innerHTML = '';

    await expect(importMain()).rejects.toThrow(
      'Unable to mount chorus3: #app element was not found.'
    );
  });
});
