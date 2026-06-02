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
};

export function createTvShowMetadataSourceResolver({
  snapshot,
  createClient
}: TvShowMetadataSourceResolverOptions): TvShowMetadataSourceResolver {
  const cachedDetails = new Map<number, VideoTvShowDetailSnapshot>();
  const pendingDetails = new Map<number, Promise<VideoTvShowDetailSnapshot | null>>();

  return {
    async resolve(tvshowid: number): Promise<Record<string, unknown> | null> {
      const fromSnapshot = detailFromSnapshot(snapshot(), tvshowid);
      if (fromSnapshot) {
        cachedDetails.set(tvshowid, fromSnapshot);
        return buildTvShowMetadataEditorSource({ ...fromSnapshot });
      }

      const cached = cachedDetails.get(tvshowid);
      if (cached) {
        return buildTvShowMetadataEditorSource({ ...cached });
      }

      const client = createClient();
      if (!client) {
        return null;
      }

      const detail = await fetchTvShowDetail(tvshowid, client, cachedDetails, pendingDetails);
      if (detail) {
        cachedDetails.set(tvshowid, detail);
        return buildTvShowMetadataEditorSource({ ...detail });
      }

      return null;
    },
    invalidate(tvshowid: number): void {
      cachedDetails.delete(tvshowid);
      pendingDetails.delete(tvshowid);
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
        cachedDetails.set(tvshowid, detail);
      }
      return detail;
    })
    .catch(() => null)
    .finally(() => {
      pendingDetails.delete(tvshowid);
    });

  pendingDetails.set(tvshowid, request);
  return request;
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
