export {
  DEFAULT_KODI_HTTP_PATH,
  DEFAULT_KODI_HTTP_PORT,
  DEFAULT_KODI_TIMEOUT_MS,
  buildBasicAuthHeader,
  buildKodiJsonRpcHttpUrl,
  buildKodiRequestHeaders,
  describeKodiEndpoint,
  normalizeKodiHttpHost,
  type KodiEndpointDescription,
  type KodiHttpHost,
  type NormalizedKodiHttpHost
} from './host';

export {
  KodiHttpClientError,
  createKodiJsonRpcHttpClient,
  getKodiHttpClientErrorMessage,
  isKodiHttpClientError,
  type JsonRpcError,
  type JsonRpcFailure,
  type JsonRpcId,
  type JsonRpcParams,
  type JsonRpcRequest,
  type JsonRpcSuccess,
  type KodiHttpCallOptions,
  type KodiHttpClientErrorCode,
  type KodiHttpClientErrorDetails,
  type KodiHttpClientOptions,
  type KodiJsonRpcHttpClient
} from './jsonRpc';
