import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import HelpPage from './HelpPage.svelte';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

const HELP_TOPIC_CASES = [
  [{ kind: 'helpOverview' }, 'About Chorus', 'Status report', 'What is Chorus?'],
  [{ kind: 'helpPage', pageid: 'overview' }, 'About Chorus', 'Status report', 'What is Chorus?'],
  [{ kind: 'helpPage', pageid: 'keyboard' }, 'Keyboard controls', 'Remote shortcuts', 'Playback shortcuts'],
  [{ kind: 'helpPage', pageid: 'readme' }, 'Readme', 'Package usage', 'Primary shell routes'],
  [{ kind: 'helpPage', pageid: 'changelog' }, 'Changelog', 'Release notes', 'Verification history'],
  [{ kind: 'helpPage', pageid: 'addons' }, 'Add-ons', 'Add-on browser', 'Add-on settings'],
  [{ kind: 'helpPage', pageid: 'developers' }, 'Developers', 'Integration boundaries', 'Package verification'],
  [{ kind: 'helpPage', pageid: 'translations' }, 'Translations', 'Language support', 'Locale selector'],
  [{ kind: 'helpPage', pageid: 'license' }, 'License', 'Project license', 'Open source notice']
] as const satisfies readonly [PrimaryRoute, string, string, string][];

const FORBIDDEN_COPY =
  /Authorization|Basic|token|password|CHORUS3_SENTINEL_SECRET|smb:\/\/|special:\/\/|localStorage|sessionStorage|jsonrpc|Input\.SendText|admin:p@ssword/i;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function renderPage(route: PrimaryRoute): void {
  mounted = mount(HelpPage, {
    target: document.body,
    props: { route }
  });
}

function text(): string {
  return document.body.textContent ?? '';
}

describe('HelpPage', () => {
  it.each(HELP_TOPIC_CASES)(
    'renders typed static help topic copy for %s',
    (route, heading, cardTitle, cardCopy) => {
      renderPage(route);

      expect(document.querySelector('#help-page-title')?.textContent).toBe(heading);
      expect(document.querySelector('.help-card-grid')?.getAttribute('aria-label')).toBe(
        `${heading} topics`
      );
      expect(text()).toContain(cardTitle);
      expect(text()).toContain(cardCopy);
      expect(text()).not.toMatch(FORBIDDEN_COPY);
    }
  );

  it('renders the help landing as a labelled static topic grid', () => {
    renderPage({ kind: 'help' });

    expect(document.querySelector('#help-page-title')?.textContent).toBe('About Chorus');
    expect(document.querySelector('.help-card-grid')?.getAttribute('aria-label')).toBe(
      'About Chorus topics'
    );
    for (const topic of [
      'Keyboard controls',
      'Readme',
      'Changelog',
      'Add-ons',
      'Developers',
      'Translations',
      'License'
    ]) {
      expect(text()).toContain(topic);
    }
  });

  it('uses safe generic copy for unknown safe help ids without reflecting the raw id', () => {
    renderPage({ kind: 'helpPage', pageid: 'safe-custom-topic' });

    expect(document.querySelector('#help-page-title')?.textContent).toBe('Help page');
    expect(text()).toContain('Help content placeholder');
    expect(text()).toContain('This help route is supported by a safe app-native frame.');
    expect(text()).not.toContain('safe-custom-topic');
    expect(text()).not.toMatch(FORBIDDEN_COPY);
  });

  it('redacts unsafe help ids from visible generic fallback copy', () => {
    renderPage({ kind: 'helpPage', pageid: 'Authorization-Basic-CHORUS3_SENTINEL_SECRET' });

    expect(document.querySelector('#help-page-title')?.textContent).toBe('Help page');
    expect(text()).toContain('Help content placeholder');
    expect(text()).not.toContain('Authorization');
    expect(text()).not.toContain('CHORUS3_SENTINEL_SECRET');
    expect(text()).not.toMatch(FORBIDDEN_COPY);
  });
});
