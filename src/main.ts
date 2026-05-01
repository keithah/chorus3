import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import {
  createM003BrowserProofAppProps,
  type M003BrowserProofAppProps
} from './lib/testing/m003BrowserProofFixtures';
import {
  createM004BrowserProofAppProps,
  type M004BrowserProofAppProps
} from './lib/testing/m004BrowserProofFixtures';
import { applyTheme, resolveInitialTheme } from './lib/theme/theme';
import { parseVideoRoute, type VideoRoute } from './lib/video/videoRouter';

export interface EntrypointEnv {
  DEV?: boolean;
  MODE?: string;
}

export interface EntrypointLocation {
  pathname?: unknown;
  search?: unknown;
}

type AppProps = { route: VideoRoute } & Partial<
  M003BrowserProofAppProps & M004BrowserProofAppProps
>;

const canLoadM003BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM004BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';

export function shouldUseM003BrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  return shouldUseBrowserProofFixtures(location, env, 'm003-browser-proof');
}

export function shouldUseM004BrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv
): boolean {
  return shouldUseBrowserProofFixtures(location, env, 'm004-browser-proof');
}

export function resolveEntrypointRoute(
  location: EntrypointLocation | null | undefined = globalThis.window?.location
): VideoRoute {
  try {
    return parseVideoRoute(location?.pathname, location?.search);
  } catch {
    return { kind: 'dashboard' };
  }
}

function shouldUseBrowserProofFixtures(
  location: EntrypointLocation | null | undefined,
  env: EntrypointEnv,
  key: string
): boolean {
  if (!env.DEV && env.MODE !== 'test') {
    return false;
  }

  try {
    const search = location?.search;

    if (typeof search !== 'string' || !search) {
      return false;
    }

    return new URLSearchParams(search).get(key) === '1';
  } catch {
    return false;
  }
}

export function resolveEntrypointAppProps(
  location: EntrypointLocation | null | undefined = globalThis.window?.location,
  env: EntrypointEnv = import.meta.env
): AppProps {
  const route = resolveEntrypointRoute(location);

  if (shouldUseM004BrowserProofFixtures(location, env) && canLoadM004BrowserProofFixtures) {
    return createM004BrowserProofAppProps(location);
  }

  if (shouldUseM003BrowserProofFixtures(location, env) && canLoadM003BrowserProofFixtures) {
    return { route, ...createM003BrowserProofAppProps() };
  }

  return { route };
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
