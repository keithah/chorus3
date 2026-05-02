# M006 S05 packaged shell proof

## Scope

This document records the S05 package-mounted shell proof for the Kodi webinterface base path `/addons/webinterface.chorus3/`. The proof covers local Vite runtime behavior and package verifier checks for the Chorus2-style shell without requiring a live Kodi install.

Covered runtime signals:

- Package root loads the `Chorus media controller` shell.
- Primary navigation remains visible and package-relative.
- The old multi-host setup console stays hidden in package mode.
- Deferred controls are disabled, read-only, or guarded instead of acting like live commands.
- `/addons/webinterface.chorus3/remote` renders the real Remote surface.
- `/addons/webinterface.chorus3/help` renders an owner-labeled Chorus2 placeholder with package-base recovery.
- Browser console diagnostics and network diagnostics are checked for runtime errors and failed package assets.

## Automated commands

| Command                                                                                                                          | Result class | Notes                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | -----------: | ------------------------------------------------------------------------------------------------ |
| `npm run test -- src/App.test.ts src/main.test.ts scripts/verify-kodi-package.test.ts scripts/package-kodi-webinterface.test.ts` |         Pass | 4 test files passed; 159 tests passed.                                                           |
| `npm run verify:kodi-package`                                                                                                    |         Pass | Package route support and staged bundle-reference checks passed, including primary shell routes. |
| `npm run verify:chorus2-parity`                                                                                                  |         Pass | Parity report verification passed for the tracked Chorus2 inventory.                             |
| `npm run typecheck`                                                                                                              |         Pass | Svelte/TypeScript check found 0 errors; one existing CSS compatibility warning remains.          |
| `npm run build`                                                                                                                  |         Pass | Production Vite bundle completed; existing chunk-size advisory remains.                          |
| `npm run verify`                                                                                                                 |         Pass | Final aggregate gate passed after browser proof, formatting, packaging, and verifier checks.     |

Large command logs are intentionally not pasted here; this document records pass/fail class only.

## Browser proof flow

Browser proof ran against a local Vite server only, using a placeholder local origin and package-relative routes:

1. Navigated to `/addons/webinterface.chorus3/`.
2. Asserted the packaged shell is visible and old setup UI is absent.
3. Inspected primary navigation hrefs and deferred controls.
4. Navigated to `/addons/webinterface.chorus3/remote` and asserted the real Remote panel plus guarded power affordances.
5. Navigated to `/addons/webinterface.chorus3/help` and asserted the Chorus2 placeholder owner/status copy plus package-base recovery link.
6. Checked browser console logs and network logs for no runtime errors and no failed package asset requests.

Because this proof does not require a live Kodi instance, the local `/jsonrpc` probe was intercepted with a minimal successful response during browser diagnostics. The proof does not record raw JSON-RPC bodies or real endpoint details.

## Evidence checklist

| Evidence item                                                | Result | Notes                                                                                               |
| ------------------------------------------------------------ | -----: | --------------------------------------------------------------------------------------------------- |
| Package root renders `Chorus media controller`               |   Pass | `.chorus-app[aria-label="Chorus media controller"]` was visible.                                    |
| `Primary navigation` is visible                              |   Pass | `.c2-rail[aria-label="Primary navigation"]` was visible.                                            |
| `Multi-host console` is absent                               |   Pass | Page text did not include the old setup copy.                                                       |
| `Save trusted Kodi endpoints` is absent                      |   Pass | Page text did not include the old setup action.                                                     |
| `.host-grid` is absent                                       |   Pass | DOM assertion confirmed no host grid in package mode.                                               |
| Visible rail hrefs stay under `/addons/webinterface.chorus3` |   Pass | All rail hrefs started with the Kodi webinterface base path.                                        |
| Deferred controls are disabled/read-only/guarded             |   Pass | Search was read-only; destination, playlist broad actions, Shuffle, and More were disabled/guarded. |
| Remote route renders real Remote panel                       |   Pass | `/remote` displayed the Remote panel and bounded input controls.                                    |
| Remote guarded power affordances are present                 |   Pass | Power/system controls rendered disabled with guard copy.                                            |
| Help placeholder renders `Chorus2 surface` owner/status copy |   Pass | `/help` displayed `Chorus2 Help`, `Chorus2 surface`, `missing`, and owner `M006/S02`.               |
| Help placeholder exposes package-base recovery link          |   Pass | Recovery link resolved to `/addons/webinterface.chorus3`.                                           |
| Console diagnostics are clean                                |   Pass | No console errors after the local no-live probe was mocked.                                         |
| Network diagnostics have no failed package assets            |   Pass | No failed requests after the local no-live probe was mocked; package assets loaded successfully.    |

## Live-Kodi optional gap

S05 proves package-mounted shell behavior with local dev-server routing and no-live package verification. A live Kodi install/static fallback proof remains optional here and is expected to be finalized or explicitly closed in S06.

## Redaction rules

Do not add secrets, credential-bearing URLs, raw endpoints from a real environment, localStorage/sessionStorage dumps, raw JSON-RPC request or response bodies, SMB paths, Kodi `special://` paths, or sentinel secret strings to this proof. Use package-relative paths and placeholder local origins only.
