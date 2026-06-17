import './app.css';
import { mount, unmount } from 'svelte';

import App from './App.svelte';
import { resolveEntrypointAppProps } from './lib/app/entrypointAppProps';
import { applyTheme, resolveInitialTheme } from './lib/theme/theme';

export { resolveEntrypointAppProps } from './lib/app/entrypointAppProps';
export {
  resolveBaseEntrypointAppProps,
  resolveEntrypointRoute,
  shouldUseM003BrowserProofFixtures,
  shouldUseM004BrowserProofFixtures,
  shouldUseM005BrowserProofFixtures,
  shouldUseM007VisualProofFixtures,
  type EntrypointEnv,
  type EntrypointLocation
} from './lib/app/entrypoint';

const CHORUS3_MOUNT_STATE_KEY = '__chorus3MountedApp';

interface Chorus3MountState {
  target: HTMLElement;
  app: Record<string, unknown>;
}

type Chorus3Global = typeof globalThis & {
  [CHORUS3_MOUNT_STATE_KEY]?: Chorus3MountState;
};

const appProps = resolveEntrypointAppProps(window.location);
const initialTheme =
  appProps.nowPlayingRouteQuery?.theme ?? resolveInitialTheme(window.localStorage);
applyTheme(initialTheme, {
  document,
  storage: appProps.nowPlayingRouteQuery?.theme ? null : window.localStorage
});
const mountedAppProps = { ...appProps };
Reflect.deleteProperty(mountedAppProps, 'nowPlayingRouteQuery');

const target = document.getElementById('app');

if (!target) {
  throw new Error('Unable to mount chorus3: #app element was not found.');
}

const mountGlobal = globalThis as Chorus3Global;
const previousMount = mountGlobal[CHORUS3_MOUNT_STATE_KEY];

if (previousMount?.target === target) {
  void unmount(previousMount.app);
  target.replaceChildren();
}

const app = mount(App, {
  target,
  props: mountedAppProps
}) as Record<string, unknown>;

mountGlobal[CHORUS3_MOUNT_STATE_KEY] = { target, app };

export default app;
