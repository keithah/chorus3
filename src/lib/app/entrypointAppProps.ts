import {
  createM003BrowserProofAppProps,
  type M003BrowserProofAppProps
} from '$lib/testing/m003BrowserProofFixtures';
import {
  createM004BrowserProofAppProps,
  type M004BrowserProofAppProps
} from '$lib/testing/m004BrowserProofFixtures';
import {
  createM005BrowserProofAppProps,
  type M005BrowserProofAppProps
} from '$lib/testing/m005BrowserProofFixtures';
import {
  createM007VisualProofAppProps,
  type M007VisualProofAppProps
} from '$lib/testing/m007VisualProofFixtures';
import type { SavedKodiHost } from '$lib/stores';
import type { VideoRoute } from '$lib/video/videoRouter';
import type { AppRoute } from './appRouter';
import {
  resolveBaseEntrypointAppProps,
  shouldUseM003BrowserProofFixtures,
  shouldUseM004BrowserProofFixtures,
  shouldUseM005BrowserProofFixtures,
  shouldUseM007VisualProofFixtures,
  type EntrypointEnv,
  type EntrypointLocation
} from './entrypoint';

type AppProps = { route: AppRoute; packageMountedHost?: SavedKodiHost | null } & Partial<
  Omit<
    M003BrowserProofAppProps &
      M004BrowserProofAppProps &
      M005BrowserProofAppProps &
      M007VisualProofAppProps,
    'route'
  >
> & { packageBasePath?: string };

const canLoadM003BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM004BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM005BrowserProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';
const canLoadM007VisualProofFixtures = import.meta.env.DEV || import.meta.env.MODE === 'test';

export function resolveEntrypointAppProps(
  location: EntrypointLocation | null | undefined = globalThis.window?.location,
  env: EntrypointEnv = import.meta.env
): AppProps {
  const baseProps = resolveBaseEntrypointAppProps(location);

  if (canLoadM007VisualProofFixtures && shouldUseM007VisualProofFixtures(location, env)) {
    return createM007VisualProofAppProps(location);
  }

  if (canLoadM004BrowserProofFixtures && shouldUseM004BrowserProofFixtures(location, env)) {
    const props = createM004BrowserProofAppProps(location);
    return { ...props, route: toAppRoute(props.route) };
  }

  if (canLoadM003BrowserProofFixtures && shouldUseM003BrowserProofFixtures(location, env)) {
    return { route: baseProps.route, ...createM003BrowserProofAppProps() };
  }

  if (canLoadM005BrowserProofFixtures && shouldUseM005BrowserProofFixtures(location, env)) {
    const props = createM005BrowserProofAppProps(location);
    return props.settingsSnapshot || props.addonsSnapshot || props.nowPlayingRouteQuery
      ? props
      : baseProps;
  }

  return baseProps;
}

function toAppRoute(route: VideoRoute): AppRoute {
  return route.kind === 'dashboard' ? route : { kind: 'video', route };
}
