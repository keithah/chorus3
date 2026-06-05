import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  KodiPropertiesRequest,
  JsonRpcVersionResult,
  JsonRpcIntrospectionParams,
  JsonRpcIntrospectionResult,
  ApplicationPropertyName,
  ApplicationPropertiesResult,
  SystemPropertyName,
  SystemPropertiesResult,
  PlayerCommandResult,
  RemoteInputCommand,
  RemoteInputAction
} from './methodContracts';

import { callKodi } from './methodCall';

const REMOTE_INPUT_METHODS: Record<RemoteInputCommand, string> = {
  left: 'Input.Left',
  up: 'Input.Up',
  right: 'Input.Right',
  down: 'Input.Down',
  back: 'Input.Back',
  select: 'Input.Select',
  contextMenu: 'Input.ContextMenu',
  info: 'Input.Info',
  home: 'Input.Home'
};

export function sendInputCommand(
  client: KodiJsonRpcHttpClient,
  command: RemoteInputCommand,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult>(client, REMOTE_INPUT_METHODS[command], undefined, options);
}

export function sendInputText(
  client: KodiJsonRpcHttpClient,
  text: string,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult>(client, 'Input.SendText', { text }, options);
}

export function executeInputAction(
  client: KodiJsonRpcHttpClient,
  action: RemoteInputAction,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult>(client, 'Input.ExecuteAction', { action }, options);
}

export function pingKodi(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<string> {
  return callKodi<string>(client, 'JSONRPC.Ping', undefined, options);
}

export function getJsonRpcVersion(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<JsonRpcVersionResult> {
  return callKodi<JsonRpcVersionResult>(client, 'JSONRPC.Version', undefined, options);
}

export function getJsonRpcIntrospection(
  client: KodiJsonRpcHttpClient,
  params?: JsonRpcIntrospectionParams,
  options?: KodiHttpCallOptions
): Promise<JsonRpcIntrospectionResult> {
  return callKodi<JsonRpcIntrospectionResult, JsonRpcIntrospectionParams>(
    client,
    'JSONRPC.Introspect',
    params,
    options
  );
}

export function getApplicationProperties(
  client: KodiJsonRpcHttpClient,
  properties: readonly ApplicationPropertyName[],
  options?: KodiHttpCallOptions
): Promise<ApplicationPropertiesResult> {
  return callKodi<ApplicationPropertiesResult, KodiPropertiesRequest<ApplicationPropertyName>>(
    client,
    'Application.GetProperties',
    { properties },
    options
  );
}

export function getSystemProperties(
  client: KodiJsonRpcHttpClient,
  properties: readonly SystemPropertyName[],
  options?: KodiHttpCallOptions
): Promise<SystemPropertiesResult> {
  return callKodi<SystemPropertiesResult, KodiPropertiesRequest<SystemPropertyName>>(
    client,
    'System.GetProperties',
    { properties },
    options
  );
}
