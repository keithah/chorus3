import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  FileMediaType,
  FileSourcesResult,
  FileDirectoryParams,
  FileDirectoryResult,
  FileDetailsParams,
  FileDetailsResult,
  PrepareFileDownloadResult
} from './methodContracts';

import { callKodi } from './methodCall';

export function getFileSources(
  client: KodiJsonRpcHttpClient,
  media: FileMediaType,
  options?: KodiHttpCallOptions
): Promise<FileSourcesResult> {
  return callKodi<FileSourcesResult, { media: FileMediaType }>(
    client,
    'Files.GetSources',
    { media },
    options
  );
}

export function getFileDirectory(
  client: KodiJsonRpcHttpClient,
  params: FileDirectoryParams,
  options?: KodiHttpCallOptions
): Promise<FileDirectoryResult> {
  return callKodi<FileDirectoryResult, FileDirectoryParams>(
    client,
    'Files.GetDirectory',
    params,
    options
  );
}

export function getFileDetails(
  client: KodiJsonRpcHttpClient,
  params: FileDetailsParams,
  options?: KodiHttpCallOptions
): Promise<FileDetailsResult> {
  return callKodi<FileDetailsResult, FileDetailsParams>(
    client,
    'Files.GetFileDetails',
    params,
    options
  );
}

export function prepareFileDownload(
  client: KodiJsonRpcHttpClient,
  path: string,
  options?: KodiHttpCallOptions
): Promise<PrepareFileDownloadResult> {
  return callKodi<PrepareFileDownloadResult, { path: string }>(
    client,
    'Files.PrepareDownload',
    { path },
    options
  );
}
