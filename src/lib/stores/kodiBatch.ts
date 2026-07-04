import type {
  JsonRpcParams,
  KodiHttpCallOptions,
  KodiJsonRpcBatchCall,
  KodiJsonRpcHttpClient
} from '$lib/kodi';

export async function callKodiCallsSequentially(
  client: KodiJsonRpcHttpClient,
  calls: readonly KodiJsonRpcBatchCall[],
  options?: KodiHttpCallOptions
): Promise<void> {
  if (calls.length === 0) {
    return;
  }

  for (const call of calls) {
    await client.call(call.method, call.params as JsonRpcParams | undefined, options);
  }
}
