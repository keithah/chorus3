import { getVideoLibraryTvShowDetails, type KodiJsonRpcHttpClient } from '$lib/kodi';
import {
  VIDEO_TV_SHOW_DETAIL_PROPERTIES,
  type VideoTvStoreSnapshot
} from '$lib/stores/videoTvStore.svelte';
import {
  normalizeVideoTvShowDetail,
  type VideoTvShowDetailSnapshot
} from '$lib/stores/videoLibraryNormalization';
import { buildTvShowMetadataEditorSource } from './metadataEditor';

export type TvShowMetadataSourceResolver = {
  resolve(tvshowid: number): Promise<Record<string, unknown> | null>;
  invalidate(tvshowid: number): void;
};

export type TvShowMetadataSourceResolverOptions = {
  snapshot: () => VideoTvStoreSnapshot | undefined;
  createClient: () => KodiJsonRpcHttpClient | null;
  failedLookupCooldownMs?: number;
};

const DEFAULT_FAILED_LOOKUP_COOLDOWN_MS = 30_000;
const MAX_CACHED_TV_SHOW_DETAILS = 100;
const MAX_FAILED_TV_SHOW_DETAILS = 100;

export function createTvShowMetadataSourceResolver({
  snapshot,
  createClient,
  failedLookupCooldownMs = DEFAULT_FAILED_LOOKUP_COOLDOWN_MS
}: TvShowMetadataSourceResolverOptions): TvShowMetadataSourceResolver {
  const cachedDetails = new Map<number, VideoTvShowDetailSnapshot>();
  const pendingDetails = new Map<number, Promise<VideoTvShowDetailSnapshot | null>>();
  const failedDetails = new Map<number, number>();

  return {
    async resolve(tvshowid: number): Promise<Record<string, unknown> | null> {
      const fromSnapshot = detailFromSnapshot(snapshot(), tvshowid);
      if (fromSnapshot) {
        rememberTvShowDetail(cachedDetails, tvshowid, fromSnapshot);
        return buildTvShowMetadataEditorSource({ ...fromSnapshot });
      }

      const cached = cachedDetails.get(tvshowid);
      if (cached) {
        cachedDetails.delete(tvshowid);
        cachedDetails.set(tvshowid, cached);
        return buildTvShowMetadataEditorSource({ ...cached });
      }

      const failedAt = failedDetails.get(tvshowid);
      if (
        failedAt !== undefined &&
        Number.isFinite(failedLookupCooldownMs) &&
        Date.now() - failedAt < failedLookupCooldownMs
      ) {
        return null;
      }

      const client = createClient();
      if (!client) {
        return null;
      }

      const detail = await fetchTvShowDetail(tvshowid, client, cachedDetails, pendingDetails);
      if (detail) {
        rememberTvShowDetail(cachedDetails, tvshowid, detail);
        failedDetails.delete(tvshowid);
        return buildTvShowMetadataEditorSource({ ...detail });
      }

      failedDetails.set(tvshowid, Date.now());
      trimNumberMap(failedDetails, MAX_FAILED_TV_SHOW_DETAILS);
      return null;
    },
    invalidate(tvshowid: number): void {
      cachedDetails.delete(tvshowid);
      pendingDetails.delete(tvshowid);
      failedDetails.delete(tvshowid);
    }
  };
}

async function fetchTvShowDetail(
  tvshowid: number,
  client: KodiJsonRpcHttpClient,
  cachedDetails: Map<number, VideoTvShowDetailSnapshot>,
  pendingDetails: Map<number, Promise<VideoTvShowDetailSnapshot | null>>
): Promise<VideoTvShowDetailSnapshot | null> {
  const pending = pendingDetails.get(tvshowid);
  if (pending) {
    return pending;
  }

  const request = getVideoLibraryTvShowDetails(client, {
    tvshowid,
    properties: [...VIDEO_TV_SHOW_DETAIL_PROPERTIES]
  })
    .then((result) => normalizeVideoTvShowDetail(result.tvshowdetails))
    .then((detail) => {
      if (detail) {
        rememberTvShowDetail(cachedDetails, tvshowid, detail);
      }
      return detail;
    })
    .finally(() => {
      pendingDetails.delete(tvshowid);
    });

  pendingDetails.set(tvshowid, request);
  return request;
}

function rememberTvShowDetail(
  cachedDetails: Map<number, VideoTvShowDetailSnapshot>,
  tvshowid: number,
  detail: VideoTvShowDetailSnapshot
): void {
  cachedDetails.delete(tvshowid);
  cachedDetails.set(tvshowid, detail);
  trimNumberMap(cachedDetails, MAX_CACHED_TV_SHOW_DETAILS);
}

function trimNumberMap<TValue>(map: Map<number, TValue>, maxEntries: number): void {
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (typeof oldestKey !== 'number') {
      return;
    }
    map.delete(oldestKey);
  }
}

function detailFromSnapshot(
  snapshot: VideoTvStoreSnapshot | undefined,
  tvshowid: number
): VideoTvShowDetailSnapshot | null {
  const detail = snapshot?.tvShowDetail;
  if (snapshot?.selectedTvShowId !== tvshowid || detail?.tvshowid !== tvshowid) {
    return null;
  }
  return detail;
}
