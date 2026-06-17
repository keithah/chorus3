import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTranslationContext, type Locale } from '$lib/i18n';
import LocaleToggle, { type LocaleToggleDispatch } from './LocaleToggle.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function renderToggle(locale: Locale = 'en', dispatch: LocaleToggleDispatch = createDispatch()) {
  mounted = mount(LocaleToggle, {
    target: document.body,
    props: {
      locale,
      i18n: createTranslationContext(locale),
      dispatch
    }
  });
  return dispatch;
}

function createDispatch(overrides: Partial<LocaleToggleDispatch> = {}): LocaleToggleDispatch {
  return {
    setLocale: vi.fn(),
    ...overrides
  };
}

describe('LocaleToggle', () => {
  it('renders an accessible compact language selector with translated option labels', () => {
    renderToggle('de');

    const select = document.querySelector('select');
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(select?.id).toBe('chorus-locale-toggle');
    expect(select?.getAttribute('name')).toBe('chorus-locale');
    expect(select?.getAttribute('aria-label')).toBe('Sprache');
    expect(select?.value).toBe('de');
    expect(document.body.textContent).toContain('Sprache');
    expect(document.body.textContent).toContain('Englisch');
    expect(document.body.textContent).toContain('Deutsch');
  });

  it('dispatches a locale change without touching browser storage directly', async () => {
    const getItem = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const setItem = vi.spyOn(window.localStorage.__proto__, 'setItem');
    const dispatch = renderToggle('en');
    const select = document.querySelector('select');
    expect(select).toBeInstanceOf(HTMLSelectElement);

    select!.value = 'de';
    select!.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();

    expect(dispatch.setLocale).toHaveBeenCalledWith('de');
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
