import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LabApiBrowserPanel, { type LabApiBrowserPanelDispatch } from './LabApiBrowserPanel.svelte';
import { createTranslationContext, type Locale } from '$lib/i18n';
import type { LabApiBrowserStoreSnapshot } from '$lib/stores/labApiBrowser.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

const SAFE_GUARD = {
  level: 'safe' as const,
  requiresConfirmation: false,
  blocked: false,
  reason: 'Read-only JSON-RPC method.'
};

const CONFIRM_GUARD = {
  level: 'confirmation-required' as const,
  requiresConfirmation: true,
  blocked: false,
  reason: 'Mutating JSON-RPC method requires explicit confirmation.'
};

const BLOCKED_GUARD = {
  level: 'blocked' as const,
  requiresConfirmation: false,
  blocked: true,
  reason: 'Destructive system-level JSON-RPC method blocked.'
};

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createSnapshot(
  overrides: Partial<LabApiBrowserStoreSnapshot> = {}
): LabApiBrowserStoreSnapshot {
  const getItem = {
    name: 'Player.GetItem',
    namespace: 'Player',
    shortName: 'GetItem',
    description: 'Returns the current player item.',
    params: { type: 'object', properties: { playerid: { type: 'integer' } } },
    returns: { type: 'object' },
    guard: SAFE_GUARD
  };
  const openItem = {
    name: 'Player.Open',
    namespace: 'Player',
    shortName: 'Open',
    description: 'Opens a playable item.',
    params: { type: 'object' },
    returns: { type: 'string' },
    guard: CONFIRM_GUARD
  };
  const shutdown = {
    name: 'System.Shutdown',
    namespace: 'System',
    shortName: 'Shutdown',
    description: 'Blocked system operation.',
    params: null,
    returns: null,
    guard: BLOCKED_GUARD
  };

  return {
    introspectionStatus: 'success',
    callStatus: 'idle',
    namespaces: [
      { name: 'Player', methods: [getItem, openItem] },
      { name: 'System', methods: [shutdown] }
    ],
    methods: [getItem, openItem, shutdown],
    selectedMethodName: 'Player.GetItem',
    selectedMethod: getItem,
    paramsText: '{"playerid":1}',
    validationError: null,
    guardDecision: SAFE_GUARD,
    confirmation: null,
    lastCall: null,
    lastError: null,
    rawRequestJson:
      '{\n  "jsonrpc": "2.0",\n  "method": "Player.GetItem",\n  "params": {\n    "playerid": 1\n  }\n}',
    rawResponseJson:
      '{\n  "item": {\n    "label": "Safe Song"\n  },\n  "redactedField1": "[redacted]"\n}',
    rawErrorJson: null,
    ...overrides
  };
}

function createDispatch(
  overrides: Partial<LabApiBrowserPanelDispatch> = {}
): LabApiBrowserPanelDispatch {
  return {
    loadIntrospection: vi.fn(),
    retryIntrospection: vi.fn(),
    selectMethod: vi.fn(),
    setParamsText: vi.fn(),
    runSelectedMethod: vi.fn(),
    confirmSelectedMethod: vi.fn(),
    clearConfirmation: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: {
    snapshot?: LabApiBrowserStoreSnapshot;
    dispatch?: LabApiBrowserPanelDispatch;
    locale?: Locale;
    initialMethod?: string;
  } = {}
): LabApiBrowserPanelDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(LabApiBrowserPanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      i18n: createTranslationContext(props.locale ?? 'en'),
      initialMethod: props.initialMethod
    }
  });
  return dispatch;
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (candidate) =>
      candidate.getAttribute('aria-label') === labelOrText ||
      candidate.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Button not found: ${labelOrText}`);
  return match;
}

function methodSelect(): HTMLSelectElement {
  const select = document.querySelector('[data-lab-api-method-select]');
  if (!(select instanceof HTMLSelectElement)) throw new Error('Method select not found');
  return select;
}

function paramsEditor(): HTMLTextAreaElement {
  const textarea = document.querySelector('[data-lab-api-params-editor]');
  if (!(textarea instanceof HTMLTextAreaElement)) throw new Error('Params editor not found');
  return textarea;
}

async function chooseMethod(methodName: string): Promise<void> {
  const select = methodSelect();
  select.value = methodName;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await tick();
}

async function editParams(value: string): Promise<void> {
  const textarea = paramsEditor();
  textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
}

function expectSecretSafe(value: string): void {
  expect(value).not.toMatch(
    /Authorization|Basic|Bearer|admin:p@ssword|localStorage|sessionStorage|CHORUS3_SENTINEL_SECRET|SENTINEL_SECRET|smb:\/\/|https?:\/\/|\/mnt\/media|C:\\|raw response body/i
  );
}

describe('LabApiBrowserPanel', () => {
  it('renders accessible introspection, method metadata, guard state, and redacted diagnostics', () => {
    renderPanel();

    expect(
      document.querySelector('section[aria-labelledby="lab-api-browser-title"]')
    ).not.toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Introspection loaded.'
    );
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(screenText()).toContain('Lab API browser');
    expect(screenText()).toContain('Player.GetItem');
    expect(screenText()).toContain('Returns the current player item.');
    expect(screenText()).toContain('Guard: safe');
    expect(screenText()).toContain('Read-only JSON-RPC method.');
    expect(screenText()).toContain('Safe Song');
    expect(screenText()).toContain('redactedField1');
    expect(paramsEditor().getAttribute('aria-label')).toContain('JSON-RPC params');
    expectSecretSafe(screenText());
  });

  it('renders representative Lab API browser copy in German while preserving method and redacted JSON data', () => {
    renderPanel({ locale: 'de' });

    expect(screenText()).toContain('Labor-API-Browser');
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Introspektion geladen.'
    );
    expect(screenText()).toContain('JSON-RPC-Aufruf läuft nicht.');
    expect(screenText()).toContain('Ausgewählte Methode');
    expect(screenText()).toContain('Guard: safe');
    expect(screenText()).toContain('Redigierte JSON-Diagnosen');
    expect(screenText()).toContain('Player.GetItem');
    expect(screenText()).toContain('Safe Song');
    expect(paramsEditor().getAttribute('aria-label')).toContain('JSON-RPC-Parameterobjekt');
    expectSecretSafe(screenText());
  });

  it('dispatches introspection, selection, params editing, and safe run actions from native controls', async () => {
    const dispatch = renderPanel();

    button('Load JSON-RPC methods').click();
    await chooseMethod('System.Shutdown');
    await editParams('{"force":false}');
    button('Run selected JSON-RPC method').click();
    await tick();

    expect(dispatch.loadIntrospection).toHaveBeenCalledTimes(1);
    expect(dispatch.selectMethod).toHaveBeenCalledWith('System.Shutdown');
    expect(dispatch.setParamsText).toHaveBeenCalledWith('{"force":false}');
    expect(dispatch.runSelectedMethod).toHaveBeenCalledTimes(1);
  });

  it('applies an initial deep-linked method once without overriding later user selection', async () => {
    const dispatch = renderPanel({ initialMethod: 'Player.Open' });
    await tick();

    await chooseMethod('System.Shutdown');

    expect(dispatch.selectMethod).toHaveBeenCalledTimes(2);
    expect(dispatch.selectMethod).toHaveBeenNthCalledWith(1, 'Player.Open');
    expect(dispatch.selectMethod).toHaveBeenNthCalledWith(2, 'System.Shutdown');
  });

  it('renders empty method snapshots with guidance and disabled run controls', () => {
    renderPanel({
      snapshot: createSnapshot({
        namespaces: [],
        methods: [],
        selectedMethodName: null,
        selectedMethod: null,
        guardDecision: null,
        rawRequestJson: null,
        rawResponseJson: null
      })
    });

    expect(screenText()).toContain('No JSON-RPC methods are available.');
    expect(methodSelect().disabled).toBe(true);
    expect(button('Run selected JSON-RPC method').disabled).toBe(true);
  });

  it('renders no-active-host guidance and retry for config errors', async () => {
    const dispatch = renderPanel({
      snapshot: createSnapshot({
        introspectionStatus: 'error',
        lastError: {
          source: 'config',
          code: 'config/no-active-host',
          message: 'Choose an active Kodi host before using the Lab API browser.'
        }
      })
    });

    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'Choose an active Kodi host before using the Lab API browser.'
    );
    button('Retry JSON-RPC introspection').click();
    await tick();

    expect(dispatch.retryIntrospection).toHaveBeenCalledTimes(1);
  });

  it('renders malformed params validation state without dispatching confirmation', () => {
    const dispatch = renderPanel({
      snapshot: createSnapshot({
        callStatus: 'error',
        validationError: 'Params must be valid JSON object text.',
        lastError: {
          source: 'validation',
          code: 'validation/malformed-params',
          message: 'Params must be valid JSON object text.'
        }
      })
    });

    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'Params must be valid JSON object text.'
    );
    expect(paramsEditor().getAttribute('aria-invalid')).toBe('true');
    expect(dispatch.confirmSelectedMethod).not.toHaveBeenCalled();
  });

  it('renders needs-confirmation controls without invoking run when confirm is clicked', async () => {
    const dispatch = renderPanel({
      snapshot: createSnapshot({
        selectedMethodName: 'Player.Open',
        selectedMethod: createSnapshot().methods[1],
        guardDecision: CONFIRM_GUARD,
        callStatus: 'needs-confirmation',
        validationError: 'Confirm this mutating JSON-RPC method before running it.',
        confirmation: {
          method: 'Player.Open',
          paramsText: '{}',
          confirmed: false,
          requestedAt: '2026-05-01T20:00:00.000Z'
        }
      })
    });

    expect(screenText()).toContain('Confirmation required');
    button('Confirm selected JSON-RPC method').click();
    await tick();

    expect(dispatch.confirmSelectedMethod).toHaveBeenCalledTimes(1);
    expect(dispatch.runSelectedMethod).not.toHaveBeenCalled();
  });

  it('renders confirmed flow with an explicit run-after-confirmation action', async () => {
    const dispatch = renderPanel({
      snapshot: createSnapshot({
        selectedMethodName: 'Player.Open',
        selectedMethod: createSnapshot().methods[1],
        guardDecision: CONFIRM_GUARD,
        callStatus: 'idle',
        confirmation: {
          method: 'Player.Open',
          paramsText: '{}',
          confirmed: true,
          requestedAt: '2026-05-01T20:00:00.000Z'
        }
      })
    });

    expect(screenText()).toContain('Confirmed for Player.Open');
    button('Run selected JSON-RPC method').click();
    await tick();

    expect(dispatch.runSelectedMethod).toHaveBeenCalledTimes(1);
  });

  it('renders blocked method state with disabled execution', () => {
    renderPanel({
      snapshot: createSnapshot({
        selectedMethodName: 'System.Shutdown',
        selectedMethod: createSnapshot().methods[2],
        guardDecision: BLOCKED_GUARD,
        callStatus: 'blocked',
        validationError: 'This JSON-RPC method is blocked in the Lab API browser.',
        lastError: {
          source: 'validation',
          code: 'validation/blocked-method',
          message: 'This JSON-RPC method is blocked in the Lab API browser.'
        }
      })
    });

    expect(screenText()).toContain('Guard: blocked');
    expect(screenText()).toContain('Destructive system-level JSON-RPC method blocked.');
    expect(button('Run selected JSON-RPC method').disabled).toBe(true);
  });

  it('renders transport error snapshots and redacted raw error JSON safely', () => {
    renderPanel({
      snapshot: createSnapshot({
        callStatus: 'error',
        lastError: {
          source: 'http',
          code: 'http/failed',
          message: 'Request failed with [redacted] credentials [redacted]',
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: false
          }
        },
        rawErrorJson: '{\n  "name": "Error",\n  "message": "[redacted]"\n}',
        rawResponseJson: null
      })
    });

    expect(document.querySelector('[role="alert"]')?.textContent).toContain('http/failed');
    expect(screenText()).toContain('kodi.local:8080');
    expect(screenText()).toContain('"message": "[redacted]"');
    expectSecretSafe(screenText());
  });

  it('never renders forbidden raw diagnostic tokens from redacted snapshots', () => {
    renderPanel({
      snapshot: createSnapshot({
        rawRequestJson: '{\n  "redactedField1": "[redacted]"\n}',
        rawResponseJson: '{\n  "redactedField1": "[redacted]"\n}',
        rawErrorJson: '{\n  "redactedField1": "[redacted]"\n}',
        lastError: {
          source: 'call',
          code: 'call/failed',
          message: 'Operation failed with [redacted] values only.'
        }
      })
    });

    expectSecretSafe(document.body.textContent ?? '');
    expect(document.body.textContent).toContain('[redacted]');
  });
});
