import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  PvrRecordParams,
  PvrTimerBroadcastParams,
  PvrDeleteTimerParams,
  PvrGetChannelsParams,
  PvrGetChannelsResult,
  PvrGetChannelDetailsParams,
  PvrGetChannelDetailsResult,
  PvrGetRecordingsParams,
  PvrGetRecordingsResult,
  PvrGetRecordingDetailsParams,
  PvrGetRecordingDetailsResult,
  PvrGetBroadcastsParams,
  PvrGetBroadcastsResult
} from './methodContracts';

import { callKodi } from './methodCall';

export function getPvrChannels(
  client: KodiJsonRpcHttpClient,
  params: PvrGetChannelsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetChannelsResult> {
  return callKodi<PvrGetChannelsResult, PvrGetChannelsParams>(
    client,
    'PVR.GetChannels',
    params,
    options
  );
}

export function getPvrChannelDetails(
  client: KodiJsonRpcHttpClient,
  params: PvrGetChannelDetailsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetChannelDetailsResult> {
  return callKodi<PvrGetChannelDetailsResult, PvrGetChannelDetailsParams>(
    client,
    'PVR.GetChannelDetails',
    params,
    options
  );
}

export function getPvrBroadcasts(
  client: KodiJsonRpcHttpClient,
  params: PvrGetBroadcastsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetBroadcastsResult> {
  return callKodi<PvrGetBroadcastsResult, PvrGetBroadcastsParams>(
    client,
    'PVR.GetBroadcasts',
    params,
    options
  );
}

export function getPvrRecordings(
  client: KodiJsonRpcHttpClient,
  params: PvrGetRecordingsParams = {},
  options?: KodiHttpCallOptions
): Promise<PvrGetRecordingsResult> {
  return callKodi<PvrGetRecordingsResult, PvrGetRecordingsParams>(
    client,
    'PVR.GetRecordings',
    params,
    options
  );
}

export function getPvrRecordingDetails(
  client: KodiJsonRpcHttpClient,
  params: PvrGetRecordingDetailsParams,
  options?: KodiHttpCallOptions
): Promise<PvrGetRecordingDetailsResult> {
  return callKodi<PvrGetRecordingDetailsResult, PvrGetRecordingDetailsParams>(
    client,
    'PVR.GetRecordingDetails',
    params,
    options
  );
}

export function recordPvrChannel(
  client: KodiJsonRpcHttpClient,
  params: PvrRecordParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrRecordParams>(client, 'PVR.Record', params, options);
}

export function togglePvrTimer(
  client: KodiJsonRpcHttpClient,
  params: PvrTimerBroadcastParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrTimerBroadcastParams>(
    client,
    'PVR.ToggleTimer',
    params,
    options
  );
}

export function addPvrTimer(
  client: KodiJsonRpcHttpClient,
  params: PvrTimerBroadcastParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrTimerBroadcastParams>(
    client,
    'PVR.AddTimer',
    params,
    options
  );
}

export function deletePvrTimer(
  client: KodiJsonRpcHttpClient,
  params: PvrDeleteTimerParams,
  options?: KodiHttpCallOptions
): Promise<Record<string, unknown>> {
  return callKodi<Record<string, unknown>, PvrDeleteTimerParams>(
    client,
    'PVR.DeleteTimer',
    params,
    options
  );
}
