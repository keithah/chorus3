const CLASSIC_ASSET_BASE_PATH = 'classic-assets';

export function classicPublicAssetUrl(path: string, moduleUrl: string): string {
  const normalizedPath = path.replace(/^\/+/u, '');

  if (import.meta.env.DEV) {
    return ['', CLASSIC_ASSET_BASE_PATH, normalizedPath].join('/');
  }

  return new URL(`../classic-assets/${normalizedPath}`, moduleUrl).href;
}
