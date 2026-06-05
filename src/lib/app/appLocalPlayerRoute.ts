import type { LocalPlayerRoute } from './appRouteTypes';
import { parseSafeIntegerSegment } from './appRoutePathSafety';

const ROOT_PATH = '/';
const LOCAL_PLAYER_PATH = '/local-player';

export function parseLocalPlayerRoute(path: string): LocalPlayerRoute | null {
  if (path === LOCAL_PLAYER_PATH || !path.startsWith(`${LOCAL_PLAYER_PATH}/`)) {
    return null;
  }

  const segments = path
    .slice(LOCAL_PLAYER_PATH.length + 1)
    .split('/')
    .filter(Boolean);

  if (segments[0] === 'music') {
    const musicKind = segments[1];
    const id = parseSafeIntegerSegment(segments[2]);

    return segments.length === 3 &&
      (musicKind === 'artist' || musicKind === 'album' || musicKind === 'song') &&
      id !== null
      ? { kind: 'localPlayer', media: 'music', musicKind, id }
      : null;
  }

  const media = segments[0];
  const id = parseSafeIntegerSegment(segments[1]);

  return segments.length === 2 &&
    (media === 'movie' || media === 'episode' || media === 'musicvideo') &&
    id !== null
    ? { kind: 'localPlayer', media, id }
    : null;
}

export function buildLocalPlayerRoutePath(route: LocalPlayerRoute): string {
  if (!Number.isSafeInteger(route.id) || route.id <= 0) {
    return ROOT_PATH;
  }

  if (route.media === 'music') {
    return route.musicKind === 'artist' || route.musicKind === 'album' || route.musicKind === 'song'
      ? `${LOCAL_PLAYER_PATH}/music/${route.musicKind}/${route.id}`
      : ROOT_PATH;
  }

  return route.media === 'movie' || route.media === 'episode' || route.media === 'musicvideo'
    ? `${LOCAL_PLAYER_PATH}/${route.media}/${route.id}`
    : ROOT_PATH;
}
