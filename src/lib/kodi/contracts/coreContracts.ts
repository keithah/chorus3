export type KodiPropertiesRequest<TProperty extends string> = {
  properties: readonly TProperty[];
};

export interface KodiVersion {
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
  tag?: string;
  tagversion?: string;
  [key: string]: unknown;
}

export type JsonRpcVersionResult = {
  version: string | KodiVersion;
};

export type JsonRpcIntrospectionParams = Record<string, unknown> & {
  filter?: Record<string, unknown>;
  getdescriptions?: boolean;
  getmetadata?: boolean;
};

export type JsonRpcIntrospectionResult = Record<string, unknown>;

export type ApplicationPropertyName = 'muted' | 'name' | 'version' | 'volume';

export type ApplicationPropertiesResult = Partial<{
  muted: boolean;
  name: string;
  version: KodiVersion;
  volume: number;
}> &
  Record<string, unknown>;

export type SystemPropertyName = 'canhibernate' | 'canreboot' | 'canshutdown' | 'cansuspend';

export type SystemPropertiesResult = Partial<Record<SystemPropertyName, boolean>> &
  Record<string, unknown>;

export interface KodiLimits {
  start?: number;
  end?: number;
  total?: number;
  [key: string]: unknown;
}

export interface KodiListParams<TProperty extends string = string> {
  properties?: readonly TProperty[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
  filter?: unknown;
  [key: string]: unknown;
}

export interface KodiHttpConnectionTestResult {
  ping: string;
  jsonRpcVersion: JsonRpcVersionResult;
  application: ApplicationPropertiesResult;
}
