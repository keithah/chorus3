import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import ShortcutsPanel from './ShortcutsPanel.svelte';
import { createTranslationContext, type Locale } from '$lib/i18n';
import { PLAYBACK_SHORTCUTS } from '$lib/app/playbackShortcuts';

let mounted: Record<string, unknown> | undefined;

function renderPanel(locale: Locale = 'en'): HTMLElement {
  document.body.innerHTML = '<div id="shortcuts-panel-root"></div>';
  const target = document.getElementById('shortcuts-panel-root');

  if (!target) {
    throw new Error('Missing shortcuts panel root');
  }

  mounted = mount(ShortcutsPanel, {
    target,
    props: { i18n: createTranslationContext(locale) }
  }) as Record<string, unknown>;
  flushSync();

  return target;
}

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = undefined;
  }

  document.body.innerHTML = '';
});

describe('ShortcutsPanel', () => {
  it('renders accessible playback shortcut documentation from the shared shortcut contract', () => {
    const target = renderPanel();
    const panel = target.querySelector<HTMLElement>(
      '.shortcuts-panel[aria-labelledby="shortcuts-panel-title"]'
    );

    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel?.textContent).toContain('Playback shortcuts');
    expect(panel?.textContent).toContain(
      'Shortcuts are ignored while focus is inside editable controls.'
    );

    for (const shortcut of PLAYBACK_SHORTCUTS) {
      expect(panel?.textContent).toContain(shortcut.key);
      expect(panel?.textContent).toContain(shortcut.label);
      expect(panel?.textContent).toContain(shortcut.description);
    }
  });

  it('renders playback shortcut documentation in German from the shared shortcut contract', () => {
    const target = renderPanel('de');
    const panel = target.querySelector<HTMLElement>(
      '.shortcuts-panel[aria-labelledby="shortcuts-panel-title"]'
    );

    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel?.textContent).toContain('Wiedergabe-Kurzbefehle');
    expect(panel?.textContent).toContain(
      'Kurzbefehle werden ignoriert, während der Fokus in bearbeitbaren Steuerelementen liegt.'
    );
    expect(panel?.textContent).toContain('Wiedergabe starten / pausieren');
    expect(panel?.textContent).toContain('Wiedergabe um 30 Sekunden zurückspringen.');

    for (const shortcut of PLAYBACK_SHORTCUTS) {
      expect(panel?.textContent).toContain(shortcut.key);
    }
  });

  it('does not render forbidden secret-like tokens in static shortcut docs', () => {
    renderPanel();

    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|admin:p@ssword|localStorage|sessionStorage|CHORUS3_SENTINEL_SECRET|smb:\/\//i
    );
  });
});
