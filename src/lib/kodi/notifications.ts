export type JsonRpcVersion = '2.0';
export type JsonRpcId = string | number | null;
export type KodiNotificationParams = Record<string, unknown>;

export interface JsonRpcNotificationEnvelope<Method extends string = string> {
  jsonrpc: JsonRpcVersion;
  method: Method;
  params?: KodiNotificationParams;
}

export interface JsonRpcRequestEnvelope<
  Method extends string = string
> extends JsonRpcNotificationEnvelope<Method> {
  id: JsonRpcId;
}

export interface JsonRpcResponseEnvelope {
  jsonrpc: JsonRpcVersion;
  id: JsonRpcId;
  result?: unknown;
  error?: unknown;
}

export type KodiKnownNotificationMethod =
  | 'Application.OnVolumeChanged'
  | 'AudioLibrary.OnCleanFinished'
  | 'AudioLibrary.OnCleanStarted'
  | 'AudioLibrary.OnRemove'
  | 'AudioLibrary.OnScanFinished'
  | 'AudioLibrary.OnScanStarted'
  | 'AudioLibrary.OnUpdate'
  | 'Input.OnInputFinished'
  | 'Input.OnInputRequested'
  | 'Player.OnAVChange'
  | 'Player.OnPause'
  | 'Player.OnPlay'
  | 'Player.OnPropertyChanged'
  | 'Player.OnResume'
  | 'Player.OnSeek'
  | 'Player.OnSpeedChanged'
  | 'Player.OnStop'
  | 'Playlist.OnAdd'
  | 'Playlist.OnClear'
  | 'Playlist.OnRemove'
  | 'System.OnQuit'
  | 'System.OnRestart'
  | 'System.OnSleep'
  | 'System.OnWake'
  | 'VideoLibrary.OnCleanFinished'
  | 'VideoLibrary.OnCleanStarted'
  | 'VideoLibrary.OnRemove'
  | 'VideoLibrary.OnScanFinished'
  | 'VideoLibrary.OnScanStarted'
  | 'VideoLibrary.OnUpdate';

export type KnownKodiNotification = {
  [Method in KodiKnownNotificationMethod]: JsonRpcNotificationEnvelope<Method>;
}[KodiKnownNotificationMethod];

export interface UnknownKodiNotification extends JsonRpcNotificationEnvelope<string> {
  method: Exclude<string, KodiKnownNotificationMethod>;
}

export type KodiNotification = KnownKodiNotification | UnknownKodiNotification;

export type MalformedKodiNotificationCode =
  | 'empty'
  | 'invalid-json'
  | 'not-object'
  | 'invalid-jsonrpc'
  | 'missing-method'
  | 'invalid-method'
  | 'invalid-params'
  | 'not-notification';

export interface MalformedKodiNotificationDetails {
  jsonrpc?: unknown;
  hasId?: boolean;
  methodType?: string;
  paramsType?: string;
}

export interface MalformedKodiNotification {
  code: MalformedKodiNotificationCode;
  message: string;
  details?: MalformedKodiNotificationDetails;
}

export type KodiNotificationParseResult =
  | { ok: true; notification: KodiNotification }
  | { ok: false; error: MalformedKodiNotification };

function malformed(
  code: MalformedKodiNotificationCode,
  message: string,
  details?: MalformedKodiNotificationDetails
): KodiNotificationParseResult {
  return details === undefined
    ? { ok: false, error: { code, message } }
    : { ok: false, error: { code, message, details } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }

  return typeof value;
}

export function parseKodiNotificationMessage(raw: string): KodiNotificationParseResult {
  if (raw.trim() === '') {
    return malformed('empty', 'Kodi WebSocket notification message is empty.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return malformed('invalid-json', 'Kodi WebSocket notification message is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    return malformed('not-object', 'Kodi WebSocket notification message must be a JSON object.');
  }

  const jsonrpc = parsed.jsonrpc;
  const hasId = Object.prototype.hasOwnProperty.call(parsed, 'id');

  if (jsonrpc !== '2.0') {
    return malformed('invalid-jsonrpc', 'Kodi WebSocket notification must use JSON-RPC 2.0.', {
      jsonrpc,
      hasId
    });
  }

  if (hasId) {
    return malformed('not-notification', 'Kodi WebSocket message is not a notification.', {
      jsonrpc,
      hasId,
      methodType: valueType(parsed.method)
    });
  }

  if (!Object.prototype.hasOwnProperty.call(parsed, 'method')) {
    return malformed('missing-method', 'Kodi WebSocket notification method is required.', {
      jsonrpc,
      hasId
    });
  }

  if (typeof parsed.method !== 'string') {
    return malformed('invalid-method', 'Kodi WebSocket notification method must be a string.', {
      jsonrpc,
      hasId,
      methodType: valueType(parsed.method)
    });
  }

  if (Object.prototype.hasOwnProperty.call(parsed, 'params') && !isRecord(parsed.params)) {
    return malformed(
      'invalid-params',
      'Kodi WebSocket notification params must be an object when present.',
      {
        jsonrpc,
        hasId,
        methodType: 'string',
        paramsType: valueType(parsed.params)
      }
    );
  }

  const notification: KodiNotification = Object.prototype.hasOwnProperty.call(parsed, 'params')
    ? { jsonrpc: '2.0', method: parsed.method, params: parsed.params as KodiNotificationParams }
    : { jsonrpc: '2.0', method: parsed.method };

  return { ok: true, notification };
}
