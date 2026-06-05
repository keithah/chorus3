import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type { KodiHttpConnectionTestResult } from './methodContracts';

import { getApplicationProperties, getJsonRpcVersion, pingKodi } from './inputMethods';

export async function testKodiHttpConnection(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<KodiHttpConnectionTestResult> {
  const [ping, jsonRpcVersion, application] = await Promise.all([
    pingKodi(client, options),
    getJsonRpcVersion(client, options),
    getApplicationProperties(client, ['name', 'version', 'volume', 'muted'], options)
  ]);

  return { ping, jsonRpcVersion, application };
}
