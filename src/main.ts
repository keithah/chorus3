import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import {
  createM003BrowserProofAppProps,
  type M003BrowserProofAppProps
} from './lib/testing/m003BrowserProofFixtures';
import { applyTheme, resolveInitialTheme } from './lib/theme/theme';

export interface EntrypointEnv {
  DEV?: boolean;
  MODE?: string;
}

export interface EntrypointLocation {
  search?: string;
}

type AppProps = Record<string, never> | M003BrowserProofAppProps;

const canLoadM003BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';

export function shouldUseM003BrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  if (!env.DEV && env.MODE !== 'test') {
    return false;
  }

  try {
    const search = location?.search;

    if (!search) {
      return false;
    }

    return new URLSearchParams(search).get('m003-browser-proof') === '1';
  } catch {
    return false;
  }
}

export function resolveEntrypointAppProps(
  location: EntrypointLocation | null | undefined = globalThis.window?.location,
  env: EntrypointEnv = import.meta.env
): AppProps {
  if (!shouldUseM003BrowserProofFixtures(location, env) || !canLoadM003BrowserProofFixtures) {
    return {};
  }

  return createM003BrowserProofAppProps();
}

applyTheme(resolveInitialTheme(window.localStorage), {
  document,
  storage: window.localStorage
});

const target = document.getElementById('app');

if (!target) {
  throw new Error('Unable to mount chorus3: #app element was not found.');
}

const app = mount(App, {
  target,
  props: resolveEntrypointAppProps()
});

export default app;
