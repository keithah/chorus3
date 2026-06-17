import {
  KodiHttpClientError,
  getJsonRpcIntrospection,
  isKodiHttpClientError,
  type JsonRpcIntrospectionParams,
  type JsonRpcIntrospectionResult,
  type JsonRpcParams,
  type KodiEndpointDescription,
  type KodiJsonRpcHttpClient
} from '$lib/kodi';
import { redactDiagnosticText, redactJsonForDisplay } from '$lib/safety/redaction';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';
import {
  cachedFrozenJsonSnapshot,
  deepFreeze,
  materializeSmallJsonSnapshot,
  type JsonSnapshotCache
} from './snapshotCache';

export type LabApiBrowserIntrospectionStatus = 'idle' | 'loading' | 'success' | 'error';
export type LabApiBrowserCallStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error'
  | 'needs-confirmation'
  | 'blocked';
export type LabApiBrowserGuardLevel = 'safe' | 'confirmation-required' | 'blocked';
export type LabApiBrowserErrorSource = 'validation' | 'config' | 'http' | 'introspection' | 'call';

export interface LabApiBrowserSafeErrorSnapshot {
  source: LabApiBrowserErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface LabApiBrowserGuardDecisionSnapshot {
  level: LabApiBrowserGuardLevel;
  requiresConfirmation: boolean;
  blocked: boolean;
  reason: string;
}

export interface LabApiBrowserMethodSnapshot {
  name: string;
  namespace: string;
  shortName: string;
  description: string | null;
  params: unknown;
  returns: unknown;
  guard: LabApiBrowserGuardDecisionSnapshot;
}

export interface LabApiBrowserNamespaceSnapshot {
  name: string;
  methods: LabApiBrowserMethodSnapshot[];
}

export interface LabApiBrowserConfirmationSnapshot {
  method: string;
  paramsText: string;
  confirmed: boolean;
  requestedAt: string;
}

export interface LabApiBrowserLastCallSnapshot {
  method: string;
  guardLevel: LabApiBrowserGuardLevel;
  requestedAt: string;
  completedAt: string | null;
}

export interface LabApiBrowserStoreSnapshot {
  introspectionStatus: LabApiBrowserIntrospectionStatus;
  callStatus: LabApiBrowserCallStatus;
  namespaces: LabApiBrowserNamespaceSnapshot[];
  methods: LabApiBrowserMethodSnapshot[];
  selectedMethodName: string | null;
  selectedMethod: LabApiBrowserMethodSnapshot | null;
  paramsText: string;
  validationError: string | null;
  guardDecision: LabApiBrowserGuardDecisionSnapshot | null;
  confirmation: LabApiBrowserConfirmationSnapshot | null;
  lastCall: LabApiBrowserLastCallSnapshot | null;
  lastError: LabApiBrowserSafeErrorSnapshot | null;
  rawRequestJson: string | null;
  rawResponseJson: string | null;
  rawErrorJson: string | null;
}

export interface LabApiBrowserStoreMethods {
  getJsonRpcIntrospection(
    client: KodiJsonRpcHttpClient,
    params?: JsonRpcIntrospectionParams
  ): Promise<JsonRpcIntrospectionResult>;
  callJsonRpc(
    client: KodiJsonRpcHttpClient,
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown>;
}

export interface LabApiBrowserStoreOptions {
  createClient?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  methods?: LabApiBrowserStoreMethods;
  now?: () => string;
}

const DEFAULT_METHODS: LabApiBrowserStoreMethods = {
  getJsonRpcIntrospection,
  callJsonRpc(client, method, params) {
    return client.call<unknown, JsonRpcParams>(method, params);
  }
};

const DEFAULT_GUARD: LabApiBrowserGuardDecisionSnapshot = {
  level: 'safe',
  requiresConfirmation: false,
  blocked: false,
  reason: 'Read-only JSON-RPC method.'
};

const DEFAULT_SNAPSHOT: LabApiBrowserStoreSnapshot = {
  introspectionStatus: 'idle',
  callStatus: 'idle',
  namespaces: [],
  methods: [],
  selectedMethodName: null,
  selectedMethod: null,
  paramsText: '{}',
  validationError: null,
  guardDecision: null,
  confirmation: null,
  lastCall: null,
  lastError: null,
  rawRequestJson: null,
  rawResponseJson: null,
  rawErrorJson: null
};

const NO_ACTIVE_HOST_ERROR: LabApiBrowserSafeErrorSnapshot = {
  source: 'config',
  code: 'config/no-active-host',
  message: 'Choose an active Kodi host before using the Lab API browser.'
};

const MALFORMED_INTROSPECTION_ERROR: LabApiBrowserSafeErrorSnapshot = {
  source: 'introspection',
  code: 'introspection/malformed-response',
  message: 'Kodi returned a malformed JSON-RPC introspection response.'
};

const MALFORMED_CALL_RESPONSE_ERROR: LabApiBrowserSafeErrorSnapshot = {
  source: 'call',
  code: 'call/malformed-response',
  message: 'Kodi returned a malformed JSON-RPC call response.'
};

const SAFE_VERB_PATTERN = /^(GetProperties|Get|List|Query|Introspect|Ping|Version)/i;
const MUTATING_VERB_PATTERN =
  /^(PrepareDownload|GoTo|Set|Add|Remove|Delete|Clear|Open|Play|Pause|Stop|Seek|Execute|Send|Input|Scan|Clean|Refresh|Eject|Quit|Suspend|Hibernate|Reboot|Shutdown|Restart|Toggle)/i;
const BLOCKED_VERB_PATTERN = /^(Quit|Suspend|Hibernate|Reboot|Shutdown|Restart|Eject)/i;

export class LabApiBrowserStore {
  #snapshot = $state<LabApiBrowserStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));
  #publicSnapshot: JsonSnapshotCache<LabApiBrowserStoreSnapshot> = {
    source: null,
    snapshot: null
  };
  readonly #createClient: () =>
    | KodiJsonRpcHttpClient
    | null
    | Promise<KodiJsonRpcHttpClient | null>;
  readonly #methods: LabApiBrowserStoreMethods;
  readonly #now: () => string;
  #introspectionRequestId = 0;
  #callRequestId = 0;
  #hasLoadedIntrospection = false;

  constructor(options: LabApiBrowserStoreOptions = {}) {
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#methods = options.methods ?? DEFAULT_METHODS;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): LabApiBrowserStoreSnapshot {
    return cachedFrozenJsonSnapshot(
      this.#publicSnapshot,
      this.#snapshot,
      materializeSmallJsonSnapshot
    );
  }

  async loadIntrospection(): Promise<void> {
    const requestId = this.#beginIntrospectionLoad();
    const client = await this.#resolveClient();
    if (!client) {
      this.#failIntrospection(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const result = await this.#methods.getJsonRpcIntrospection(client, {
        getdescriptions: true,
        getmetadata: true
      });
      const normalized = normalizeIntrospection(result);
      this.#commitIntrospection(requestId, normalized);
    } catch (error) {
      this.#failIntrospection(requestId, createSafeError(error, 'introspection'));
    }
  }

  selectMethod(methodName: string): void {
    const normalizedName = methodName.trim();
    const selectedMethod = this.#snapshot.methods.find((method) => method.name === normalizedName);
    const guardDecision = selectedMethod?.guard ?? classifyMethodGuard(normalizedName);
    this.#snapshot = {
      ...this.#snapshot,
      selectedMethodName: normalizedName || null,
      selectedMethod: selectedMethod ? cloneMethod(selectedMethod) : null,
      guardDecision: normalizedName ? cloneGuard(guardDecision) : null,
      validationError: null,
      confirmation: null,
      lastError: null
    };
  }

  setParamsText(paramsText: string): void {
    this.#snapshot = {
      ...this.#snapshot,
      paramsText,
      validationError: null,
      confirmation: null,
      lastError: null
    };
  }

  confirmSelectedMethod(): void {
    const methodName = this.#snapshot.selectedMethodName;
    const guard = this.#resolveSelectedGuard();
    if (!methodName || !guard.requiresConfirmation || guard.blocked) return;

    this.#snapshot = {
      ...this.#snapshot,
      confirmation: {
        method: methodName,
        paramsText: this.#snapshot.paramsText,
        confirmed: true,
        requestedAt: this.#now()
      },
      validationError: null,
      lastError: null
    };
  }

  clearConfirmation(): void {
    this.#snapshot = { ...this.#snapshot, confirmation: null };
  }

  async runSelectedMethod(): Promise<void> {
    const methodName = this.#snapshot.selectedMethodName;
    if (!methodName) {
      this.#setCallValidationError(
        'validation/no-method',
        'Select a JSON-RPC method before running it.'
      );
      return;
    }

    const selectedMethod = this.#snapshot.methods.find((method) => method.name === methodName);
    if (this.#hasLoadedIntrospection && !selectedMethod) {
      this.#setCallValidationError(
        'validation/unknown-method',
        'Select a known introspected method.'
      );
      return;
    }

    const guard = selectedMethod?.guard ?? classifyMethodGuard(methodName);
    if (guard.blocked) {
      this.#snapshot = {
        ...this.#snapshot,
        callStatus: 'blocked',
        guardDecision: cloneGuard(guard),
        lastError: {
          source: 'validation',
          code: 'validation/blocked-method',
          message: 'This JSON-RPC method is blocked in the Lab API browser.'
        },
        validationError: 'This JSON-RPC method is blocked in the Lab API browser.'
      };
      return;
    }

    const parsedParams = parseParamsText(this.#snapshot.paramsText);
    if (!parsedParams.ok) {
      this.#setCallValidationError(parsedParams.code, parsedParams.message);
      return;
    }

    if (guard.requiresConfirmation && !this.#isConfirmed(methodName)) {
      this.#snapshot = {
        ...this.#snapshot,
        callStatus: 'needs-confirmation',
        guardDecision: cloneGuard(guard),
        confirmation: {
          method: methodName,
          paramsText: this.#snapshot.paramsText,
          confirmed: false,
          requestedAt: this.#now()
        },
        validationError: 'Confirm this mutating JSON-RPC method before running it.',
        lastError: {
          source: 'validation',
          code: 'validation/needs-confirmation',
          message: 'Confirm this mutating JSON-RPC method before running it.'
        }
      };
      return;
    }

    const client = await this.#resolveClient();
    if (!client) {
      this.#setCallError(NO_ACTIVE_HOST_ERROR);
      return;
    }

    const requestedAt = this.#now();
    const requestId = this.#beginCall(methodName, guard, parsedParams.params, requestedAt);

    try {
      const result = await this.#methods.callJsonRpc(client, methodName, parsedParams.params);
      if (result === undefined) throw new LabApiBrowserMalformedCallResponseError();
      this.#commitCall(requestId, result, requestedAt);
    } catch (error) {
      this.#failCall(requestId, createSafeError(error, 'call'), error, requestedAt);
    }
  }

  #beginIntrospectionLoad(): number {
    this.#introspectionRequestId += 1;
    this.#snapshot = {
      ...this.#snapshot,
      introspectionStatus: 'loading',
      lastError: null,
      validationError: null
    };
    return this.#introspectionRequestId;
  }

  #commitIntrospection(
    requestId: number,
    data: Pick<LabApiBrowserStoreSnapshot, 'methods' | 'namespaces'>
  ): void {
    if (requestId !== this.#introspectionRequestId) return;
    this.#hasLoadedIntrospection = true;
    const selectedMethod = data.methods.find(
      (method) => method.name === this.#snapshot.selectedMethodName
    );
    this.#snapshot = {
      ...this.#snapshot,
      introspectionStatus: 'success',
      methods: data.methods.map(cloneMethod),
      namespaces: data.namespaces.map(cloneNamespace),
      selectedMethod: selectedMethod ? cloneMethod(selectedMethod) : null,
      guardDecision: selectedMethod
        ? cloneGuard(selectedMethod.guard)
        : this.#snapshot.selectedMethodName
          ? classifyMethodGuard(this.#snapshot.selectedMethodName)
          : null,
      lastError: null,
      validationError: null
    };
  }

  #failIntrospection(requestId: number, error: LabApiBrowserSafeErrorSnapshot): void {
    if (requestId !== this.#introspectionRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      introspectionStatus: 'error',
      lastError: cloneError(error)
    };
  }

  #resolveSelectedGuard(): LabApiBrowserGuardDecisionSnapshot {
    if (this.#snapshot.selectedMethod) return cloneGuard(this.#snapshot.selectedMethod.guard);
    if (this.#snapshot.selectedMethodName)
      return classifyMethodGuard(this.#snapshot.selectedMethodName);
    return cloneGuard(DEFAULT_GUARD);
  }

  #isConfirmed(methodName: string): boolean {
    const confirmation = this.#snapshot.confirmation;
    return (
      confirmation?.method === methodName &&
      confirmation.paramsText === this.#snapshot.paramsText &&
      confirmation.confirmed === true
    );
  }

  #beginCall(
    methodName: string,
    guard: LabApiBrowserGuardDecisionSnapshot,
    params: Record<string, unknown>,
    requestedAt: string
  ): number {
    this.#callRequestId += 1;
    this.#snapshot = {
      ...this.#snapshot,
      callStatus: 'pending',
      guardDecision: cloneGuard(guard),
      validationError: null,
      lastError: null,
      rawRequestJson: redactJsonForDisplay({ jsonrpc: '2.0', method: methodName, params }),
      rawResponseJson: null,
      rawErrorJson: null,
      lastCall: {
        method: methodName,
        guardLevel: guard.level,
        requestedAt,
        completedAt: null
      }
    };
    return this.#callRequestId;
  }

  #commitCall(requestId: number, result: unknown, requestedAt: string): void {
    if (requestId !== this.#callRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      callStatus: 'success',
      lastError: null,
      validationError: null,
      rawResponseJson: redactJsonForDisplay(result),
      rawErrorJson: null,
      lastCall: this.#snapshot.lastCall
        ? { ...this.#snapshot.lastCall, requestedAt, completedAt: this.#now() }
        : null
    };
  }

  #failCall(
    requestId: number,
    error: LabApiBrowserSafeErrorSnapshot,
    rawError: unknown,
    requestedAt: string
  ): void {
    if (requestId !== this.#callRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      callStatus: 'error',
      lastError: cloneError(error),
      rawErrorJson: redactJsonForDisplay(rawError),
      rawResponseJson: null,
      lastCall: this.#snapshot.lastCall
        ? { ...this.#snapshot.lastCall, requestedAt, completedAt: this.#now() }
        : null
    };
  }

  #setCallValidationError(code: string, message: string): void {
    this.#snapshot = {
      ...this.#snapshot,
      callStatus: 'error',
      validationError: message,
      lastError: { source: 'validation', code, message }
    };
  }

  #setCallError(error: LabApiBrowserSafeErrorSnapshot): void {
    this.#snapshot = {
      ...this.#snapshot,
      callStatus: 'error',
      lastError: cloneError(error),
      validationError: null
    };
  }

  async #resolveClient(): Promise<KodiJsonRpcHttpClient | null> {
    try {
      return await this.#createClient();
    } catch {
      return null;
    }
  }
}

function normalizeIntrospection(
  result: JsonRpcIntrospectionResult
): Pick<LabApiBrowserStoreSnapshot, 'methods' | 'namespaces'> {
  if (!isRecord(result) || !isRecord(result.methods))
    throw new LabApiBrowserMalformedIntrospectionError();

  const methods = Object.entries(result.methods)
    .map(([name, metadata]) => normalizeMethod(name, metadata))
    .sort((a, b) => a.name.localeCompare(b.name));

  const namespaceMap = new Map<string, LabApiBrowserMethodSnapshot[]>();
  for (const method of methods) {
    const namespaceMethods = namespaceMap.get(method.namespace) ?? [];
    namespaceMethods.push(cloneMethod(method));
    namespaceMap.set(method.namespace, namespaceMethods);
  }

  const namespaces = [...namespaceMap.entries()]
    .map(([name, namespaceMethods]) => ({
      name,
      methods: namespaceMethods.map(cloneMethod).sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { methods, namespaces };
}

function normalizeMethod(name: string, metadata: unknown): LabApiBrowserMethodSnapshot {
  if (!isSafeMethodName(name)) throw new LabApiBrowserMalformedIntrospectionError();
  const [namespace, shortName] = splitMethodName(name);
  const record = isRecord(metadata) ? metadata : {};
  return {
    name,
    namespace,
    shortName,
    description:
      typeof record.description === 'string' ? redactDiagnosticText(record.description) : null,
    params: cloneDisplayMetadata(record.params),
    returns: cloneDisplayMetadata(record.returns),
    guard: classifyMethodGuard(name)
  };
}

function classifyMethodGuard(methodName: string): LabApiBrowserGuardDecisionSnapshot {
  const shortName = splitMethodName(methodName)[1] ?? methodName;
  if (BLOCKED_VERB_PATTERN.test(shortName)) {
    return {
      level: 'blocked',
      requiresConfirmation: false,
      blocked: true,
      reason: 'Destructive system-level JSON-RPC method blocked.'
    };
  }
  if (MUTATING_VERB_PATTERN.test(shortName)) {
    return {
      level: 'confirmation-required',
      requiresConfirmation: true,
      blocked: false,
      reason: 'Mutating JSON-RPC method requires explicit confirmation.'
    };
  }
  if (SAFE_VERB_PATTERN.test(shortName)) return cloneGuard(DEFAULT_GUARD);
  return {
    level: 'confirmation-required',
    requiresConfirmation: true,
    blocked: false,
    reason: 'Unclassified JSON-RPC method requires explicit confirmation.'
  };
}

function parseParamsText(
  paramsText: string
): { ok: true; params: Record<string, unknown> } | { ok: false; code: string; message: string } {
  const text = paramsText.trim();
  if (text.length === 0) return { ok: true, params: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      code: 'validation/malformed-params',
      message: 'Params must be valid JSON object text.'
    };
  }

  if (!isRecord(parsed) || Array.isArray(parsed)) {
    return {
      ok: false,
      code: 'validation/invalid-params',
      message: 'Params must be a JSON object, not an array or scalar.'
    };
  }

  return { ok: true, params: clonePlainRecord(parsed) };
}

function createSafeError(
  error: unknown,
  fallbackSource: Exclude<LabApiBrowserErrorSource, 'validation' | 'config' | 'http'>
): LabApiBrowserSafeErrorSnapshot {
  if (error instanceof LabApiBrowserMalformedIntrospectionError)
    return MALFORMED_INTROSPECTION_ERROR;
  if (error instanceof LabApiBrowserMalformedCallResponseError)
    return MALFORMED_CALL_RESPONSE_ERROR;
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: redactDiagnosticText(error.message),
      endpoint: error.endpoint
    };
  }
  if (isErrorWithCode(error)) {
    return {
      source: fallbackSource,
      code: error.code,
      message: redactDiagnosticText(error.message)
    };
  }
  return {
    source: fallbackSource,
    code: `${fallbackSource}/failed`,
    message: redactDiagnosticText(
      error instanceof Error ? error.message : 'Lab API browser operation failed.'
    )
  };
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && typeof (error as { code?: unknown }).code === 'string';
}

class LabApiBrowserMalformedIntrospectionError extends Error {
  constructor() {
    super('Malformed JSON-RPC introspection response.');
  }
}

class LabApiBrowserMalformedCallResponseError extends Error {
  constructor() {
    super('Malformed JSON-RPC call response.');
  }
}

function splitMethodName(name: string): [string, string] {
  const index = name.indexOf('.');
  if (index === -1) return ['Unknown', name];
  return [name.slice(0, index), name.slice(index + 1)];
}

function isSafeMethodName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+$/.test(name);
}

function cloneDisplayMetadata(value: unknown): unknown {
  if (value === undefined) return null;
  return deepFreeze(JSON.parse(redactJsonForDisplay(value)));
}

function clonePlainRecord(record: Record<string, unknown>): Record<string, unknown> {
  if (typeof structuredClone === 'function') {
    return structuredClone(record) as Record<string, unknown>;
  }
  return JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
}

function cloneSnapshot(snapshot: LabApiBrowserStoreSnapshot): LabApiBrowserStoreSnapshot {
  return {
    ...snapshot,
    namespaces: snapshot.namespaces.map(cloneNamespace),
    methods: snapshot.methods.map(cloneMethod),
    selectedMethod: snapshot.selectedMethod ? cloneMethod(snapshot.selectedMethod) : null,
    guardDecision: snapshot.guardDecision ? cloneGuard(snapshot.guardDecision) : null,
    confirmation: snapshot.confirmation ? { ...snapshot.confirmation } : null,
    lastCall: snapshot.lastCall ? { ...snapshot.lastCall } : null,
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null
  };
}

function cloneNamespace(namespace: LabApiBrowserNamespaceSnapshot): LabApiBrowserNamespaceSnapshot {
  return { name: namespace.name, methods: namespace.methods.map(cloneMethod) };
}

function cloneMethod(method: LabApiBrowserMethodSnapshot): LabApiBrowserMethodSnapshot {
  return {
    ...method,
    params: method.params,
    returns: method.returns,
    guard: cloneGuard(method.guard)
  };
}

function cloneGuard(guard: LabApiBrowserGuardDecisionSnapshot): LabApiBrowserGuardDecisionSnapshot {
  return { ...guard };
}

function cloneError(error: LabApiBrowserSafeErrorSnapshot): LabApiBrowserSafeErrorSnapshot {
  return { ...error, ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {}) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function createLabApiBrowserStore(
  options: LabApiBrowserStoreOptions = {}
): LabApiBrowserStore {
  return new LabApiBrowserStore(options);
}

export const labApiBrowserStore = createLabApiBrowserStore();
