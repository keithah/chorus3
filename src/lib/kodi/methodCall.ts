import type { KodiHttpCallOptions, KodiJsonRpcHttpClient, JsonRpcParams } from './jsonRpc';

export function withDefaultProperties<
  TParams extends { properties?: readonly TProperty[] },
  TProperty extends string
>(
  params: TParams,
  properties: readonly TProperty[]
): TParams & { properties: readonly TProperty[] } {
  return params.properties
    ? (params as TParams & { properties: readonly TProperty[] })
    : { ...params, properties };
}

export function callKodi<TResult, TParams extends JsonRpcParams = JsonRpcParams>(
  client: KodiJsonRpcHttpClient,
  method: string,
  params?: TParams,
  options?: KodiHttpCallOptions
): Promise<TResult> {
  return client.call<TResult, TParams>(method, params, options);
}
