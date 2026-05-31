import thumbsRouteContract from '../src/lib/app/thumbsUpLegacyRoutes.json' with { type: 'json' };

export const THUMBS_UP_CANONICAL_PATH = thumbsRouteContract.canonicalPath;

export const THUMBS_UP_LEGACY_PATHS = thumbsRouteContract.legacyPaths;

export const THUMBS_UP_PRIMARY_ROUTE = { kind: 'thumbsup' };

export function buildThumbsUpLegacyPackageFallbacks() {
  return THUMBS_UP_LEGACY_PATHS.map((routePath) => {
    const segment = routePath.slice(1);

    return {
      name: `${segment}-legacy`,
      routePath,
      stagedIndexPath: `${segment}/index.html`
    };
  });
}

export function isThumbsUpRoutePath(path) {
  return path === THUMBS_UP_CANONICAL_PATH || THUMBS_UP_LEGACY_PATHS.includes(path);
}
