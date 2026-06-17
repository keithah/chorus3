import type {
  JsonRpcParams,
  KodiHttpCallOptions,
  KodiJsonRpcBatchCall,
  KodiJsonRpcHttpClient
} from '$lib/kodi';

export async function callOrderedBatch(
  client: KodiJsonRpcHttpClient,
  calls: readonly KodiJsonRpcBatchCall[],
  options?: KodiHttpCallOptions
): Promise<void> {
  if (calls.length === 0) {
    return;
  }

  if (client.callBatch) {
    await client.callBatch(calls, options);
    return;
  }

  for (const call of calls) {
    await client.call(call.method, call.params as JsonRpcParams | undefined, options);
  }
}
