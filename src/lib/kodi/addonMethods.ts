import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  AddonsGetAddonsParams,
  AddonsGetAddonsResult,
  AddonsGetAddonDetailsParams,
  AddonsGetAddonDetailsResult,
  AddonsSetAddonEnabledParams,
  AddonsSetAddonEnabledResult,
  AddonsExecuteAddonParams,
  AddonsExecuteAddonResult
} from './methodContracts';

import { callKodi } from './methodCall';

export function getAddons(
  client: KodiJsonRpcHttpClient,
  params: AddonsGetAddonsParams = {},
  options?: KodiHttpCallOptions
): Promise<AddonsGetAddonsResult> {
  return callKodi<AddonsGetAddonsResult, AddonsGetAddonsParams>(
    client,
    'Addons.GetAddons',
    params,
    options
  );
}

export function getAddonDetails(
  client: KodiJsonRpcHttpClient,
  params: AddonsGetAddonDetailsParams,
  options?: KodiHttpCallOptions
): Promise<AddonsGetAddonDetailsResult> {
  return callKodi<AddonsGetAddonDetailsResult, AddonsGetAddonDetailsParams>(
    client,
    'Addons.GetAddonDetails',
    params,
    options
  );
}

export function setAddonEnabled(
  client: KodiJsonRpcHttpClient,
  params: AddonsSetAddonEnabledParams,
  options?: KodiHttpCallOptions
): Promise<AddonsSetAddonEnabledResult> {
  return callKodi<AddonsSetAddonEnabledResult, AddonsSetAddonEnabledParams>(
    client,
    'Addons.SetAddonEnabled',
    params,
    options
  );
}

export function executeAddon(
  client: KodiJsonRpcHttpClient,
  params: AddonsExecuteAddonParams,
  options?: KodiHttpCallOptions
): Promise<AddonsExecuteAddonResult> {
  return callKodi<AddonsExecuteAddonResult, AddonsExecuteAddonParams>(
    client,
    'Addons.ExecuteAddon',
    params,
    options
  );
}
