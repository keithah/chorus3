import thumbsRouteContract from './thumbsUpLegacyRoutes.json';
import type { PrimaryRoute } from './primaryRoutes';

export const THUMBS_UP_CANONICAL_PATH = thumbsRouteContract.canonicalPath;

export const THUMBS_UP_LEGACY_PATHS = thumbsRouteContract.legacyPaths as readonly string[];

export const THUMBS_UP_PRIMARY_ROUTE = { kind: 'thumbsup' } as const satisfies PrimaryRoute;

export function buildThumbsUpLegacyPackageFallbacks(): ReadonlyArray<{
  name: string;
  routePath: string;
  stagedIndexPath: string;
}> {
  return THUMBS_UP_LEGACY_PATHS.map((routePath) => {
    const segment = routePath.slice(1);

    return {
      name: `${segment}-legacy`,
      routePath,
      stagedIndexPath: `${segment}/index.html`
    };
  });
}

export function registerThumbsUpLegacyPrimaryRoutes(
  routes: Map<string, PrimaryRoute>
): void {
  for (const path of THUMBS_UP_LEGACY_PATHS) {
    routes.set(path, THUMBS_UP_PRIMARY_ROUTE);
  }
}

export function isThumbsUpRoutePath(path: string): boolean {
  return path === THUMBS_UP_CANONICAL_PATH || THUMBS_UP_LEGACY_PATHS.includes(path);
}
