<script lang="ts">
  import { onMount } from 'svelte';

  import { DEFAULT_THEME, isThemeName, toggleTheme, type ThemeName } from '$lib/theme/theme';

  let currentTheme: ThemeName = $state(DEFAULT_THEME);

  onMount(() => {
    const rootTheme = document.documentElement.dataset.theme;

    currentTheme = isThemeName(rootTheme) ? rootTheme : DEFAULT_THEME;
  });

  function handleToggle(): void {
    currentTheme = toggleTheme({
      document,
      storage: window.localStorage
    });
  }

  const nextThemeLabel = $derived(currentTheme === 'dark' ? 'light' : 'dark');
</script>

<button
  class="theme-toggle"
  type="button"
  aria-label={`Switch to ${nextThemeLabel} theme`}
  onclick={handleToggle}
>
  <span class="toggle-orb" aria-hidden="true">{currentTheme === 'dark' ? '☾' : '☼'}</span>
  <span>Switch to {nextThemeLabel} theme</span>
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    min-height: 2.75rem;
    padding: var(--space-xs) var(--space-md) var(--space-xs) var(--space-xs);
    color: var(--color-text);
    cursor: pointer;
    background: color-mix(in srgb, var(--color-surface-raised) 84%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.12);
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease,
      background 160ms ease;
  }

  .theme-toggle:hover {
    background: var(--color-surface-raised);
    border-color: color-mix(in srgb, var(--color-accent) 42%, var(--color-border));
    transform: translateY(-1px);
  }

  .theme-toggle:active {
    transform: translateY(0);
  }

  .theme-toggle:focus-visible {
    outline: none;
    box-shadow:
      var(--shadow-ring),
      0 0.75rem 2rem rgb(0 0 0 / 0.14);
  }

  .toggle-orb {
    display: grid;
    width: 1.9rem;
    aspect-ratio: 1;
    place-items: center;
    color: var(--color-accent-contrast);
    background: var(--color-accent);
    border-radius: 50%;
  }
</style>
