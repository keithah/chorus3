# M005 Lab UAT proof

This document captures deterministic no-live-Kodi proof for the M005 Lab routes and the optional live-Kodi smoke checks. The browser-proof route is intentionally gated to dev/test builds by `?m005-browser-proof=1` and uses injected clone-safe props, so it must not fetch Kodi or read browser storage.

## Deterministic no-live-Kodi proof

Run the route, fixture, and app tests:

```bash
npm test -- src/lib/testing/m005BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
```

Run the full project verification:

```bash
npm run verify
```

Expected deterministic route checks:

- `/lab/shortcuts?m005-browser-proof=1` renders the shared playback shortcut contract.
- `/lab/api-browser?m005-browser-proof=1` renders the real `LabApiBrowserPanel` with fixture state for:
  - introspection success
  - selected `Player.Open`
  - confirmation-required guard copy
  - blocked `System.Shutdown` method copy
  - validation error copy
  - timestamps
  - redacted request, response, and error JSON
- `/lab/api-browser` and `/lab/api-browser?m005-browser-proof=0` render the live/default Lab API browser state without fixture labels.
- Unsafe Lab subpaths such as `/lab/api-browser/Authorization/Basic/SENTINEL_SECRET?m005-browser-proof=1` recover to safe Lab not-found UI and must not expose raw input.

Forbidden strings in fixture props and rendered DOM include raw endpoints, `Authorization`, `Basic`, URL credentials, browser storage keys, local/media paths, sentinel secrets, and raw body/payload wording.

## Optional live Kodi smoke checks

These checks are opt-in only and should be skipped unless a trusted Kodi host is configured locally:

1. Start the app in dev mode.
2. Open `/lab/api-browser` without `?m005-browser-proof=1`.
3. Select **Load JSON-RPC methods**.
4. Verify introspection either loads methods from the configured host or shows the safe `config/no-active-host` guidance.
5. Select a read-only method such as `Application.GetProperties`, run it with object-shaped params, and verify request/response diagnostics remain redacted.
6. Select a mutating method such as `Player.Open` and verify it requires confirmation before execution.
7. Select a destructive method such as `System.Shutdown` and verify execution is blocked.

Do not add credentials or endpoint values to screenshots, logs, commits, or test fixtures.
