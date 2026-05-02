# M006 final proof

Reader: a future maintainer or executor landing cold on M006 closeout.

Post-read action: rerun the closeout commands and browser proof, update only the Awaiting evidence cells produced by S06 T03/T04, understand which requirements are validated or deferred, and avoid overclaiming full Chorus2 parity.

This document intentionally records tracked proof paths because it is a milestone evidence/runbook artifact. It records pass/fail outcomes and redaction categories only; it does not record live credentials, raw transport diagnostics, local ignored corpus paths, or host-specific values.

Pending markers are allowed only for fresh S06 command or browser evidence that later closeout tasks replace.

## Scope

M006 proves the Chorus2 parity foundation for Chorus3, not full feature parity for every Chorus2 behavior. The closeout scope is:

- Exhaustive source-scanned parity ledger coverage and route truthfulness.
- Package-mounted Kodi webinterface launch from `/addons/webinterface.chorus3/` into the Chorus2-style media shell.
- Real bounded Remote/Input behavior at `/addons/webinterface.chorus3/remote`.
- Honest owner-labeled placeholder behavior at `/addons/webinterface.chorus3/help` and other mapped-but-unbuilt Chorus2 surfaces.
- Responsive package-shell proof for mobile widths and landscape phone heights, including no horizontal overflow and reachable primary navigation.
- Deterministic command gates for the proof document, parity ledger, and package verifier.
- Browser diagnostics for console/network diagnostics, layout measurements, visible control states, and category-level redaction.

M006 does not claim blocking full live-Kodi parity across all Chorus2-equivalent feature families. That broader live proof remains deferred under R058 until the mapped downstream parity milestones are implemented.

## Requirements Cross-Reference

| Requirement | Closeout status                                   | Evidence boundary                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R025        | Awaiting S06 T04 browser matrix before validation | Requires browser DOM measurements for no horizontal overflow, reachable primary navigation, Remote touch target sizing, and short-height landscape rail reachability. S06 T01 already added the short-height rail CSS/test guard; final validation waits for the full matrix. |
| R047        | Validated                                         | `docs/m006-chorus2-parity.md`, `src/lib/app/chorus2ParityLedger.ts`, scanner/verifier tests, and `npm run verify:chorus2-parity` prove the parity ledger is structured, generated, and checked against the scanned Chorus2 inventory.                                         |
| R048        | Validated                                         | Router/App/package tests prove visible packaged shell/navigation links land on implemented routes or owner-labeled placeholder routes with surface/status/owner copy.                                                                                                         |
| R049        | Validated                                         | App-router/App/main tests preserve existing Chorus3 routes while adding curated Chorus2-compatible aliases for remote, media, settings, add-ons, help, Lab, PVR, and related surfaces.                                                                                        |
| R050        | Validated                                         | Remote/Input route uses real bounded directional/select/back/info/context/home controls, route-scoped keyboard handling, existing player dispatch seams, sanitized failures, and disabled/guarded power/system affordances.                                                   |
| R051        | Validated                                         | Placeholder component and App tests prove mapped-but-unbuilt surfaces render honest owner-labeled placeholder states without unsafe visible diagnostics.                                                                                                                      |
| R052        | Validated                                         | Scanner, ledger, generated report, and `npm run verify:chorus2-parity` mechanically compare source-scanned Chorus2 surfaces against structured coverage.                                                                                                                      |
| R053        | Validated                                         | Package shell tests, `npm run verify:kodi-package`, and S05 browser proof show the package root enters the media shell and does not expose the old multi-host console as the installed default.                                                                               |
| R058        | Deferred                                          | Full live-Kodi parity proof across all Chorus2 feature families is explicitly not an M006 blocking claim. Local/package/browser proof is blocking for M006; broad live parity belongs to the later mapped parity milestones.                                                  |
| R061        | Validated                                         | Visible actions are real, disabled/guarded with clear copy, or routed to an honest placeholder/owner; M006 does not ship fake enabled UI for unimplemented Chorus2 actions.                                                                                                   |

## Ledger and Route Truthfulness

The parity ledger is the source of truth for discovered Chorus2 surfaces. The generated report at `docs/m006-chorus2-parity.md` records totals by kind and status and links each row to an owner and evidence class.

Known upstream evidence:

- S01 built the scanner, typed ledger, generated report, and `npm run verify:chorus2-parity` hook.
- S02 mapped shell/navigation parity URLs to implemented routes or typed placeholders and proved package-safe shell rail hrefs.
- S03 promoted `/remote` from placeholder to real Remote/Input route and reconciled the ledger/package verifier.
- S04 added curated movie/TV aliases and placeholder mappings for unsupported media, utility, PVR, add-on, help, Lab, and settings route families.
- S05 proved the packaged shell enters the Chorus2-style media shell instead of the legacy setup console.

Route truthfulness checks for closeout:

- `/addons/webinterface.chorus3/` must render the package-mounted Chorus2-style media shell.
- `/addons/webinterface.chorus3/remote` must render the Remote real panel, not a placeholder.
- `/addons/webinterface.chorus3/help` must render an owner-labeled placeholder that names the Chorus2 Help surface, current missing/deferred status, and future owner.

## Remote/Input Proof

Remote/Input is a real M006 feature, not a cosmetic link. The validated route exposes bounded controls for the safe consumed `Input.*` command set and keeps broader command families deferred unless a later surfaced feature consumes them.

Closeout expectations:

- The Remote real panel is visible at `/addons/webinterface.chorus3/remote` and package-mounted `/remote` routes.
- Directional, select, back, info, context, and home controls use the typed dispatch seam.
- Player controls continue to route through the existing player dispatch boundary rather than direct component-level JSON-RPC calls.
- Keyboard shortcuts are route-scoped and ignore editable/modifier contexts.
- Destructive power/system controls are disabled or guarded with clear copy.
- Remote button sizes are measured in S06 browser proof and must remain touch-friendly.
- Command failure copy is sanitized and user-readable.

## Package Shell Proof

S05 already records package-shell proof in `docs/m006-packaged-shell-proof.md`. This final proof carries that forward and expects S06 to refresh only the final closeout evidence rows.

Required package-shell signals:

- Package root `/addons/webinterface.chorus3/` loads the `Chorus media controller` shell.
- Primary navigation is visible, package-relative, and uses reachable primary navigation at mobile landscape heights.
- Old multi-host setup/default host grid stays hidden in package mode.
- Deferred controls are disabled, read-only, guarded, or linked to an honest owner-labeled placeholder.
- Remote route renders the Remote real panel.
- Help route renders an owner-labeled placeholder with package-base recovery.
- The package verifier checks route identities, staged bundle references, manifest metadata, archive root, relative assets, and package-safe shell assets.

## Responsive Browser Matrix

The final browser matrix is owned by S06 T04. R025 must not be marked validated until those measurements pass.

| Viewport or route class      | Required checks                                                                                    | Evidence state                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Package root mobile portrait | no horizontal overflow; shell remains readable; primary navigation remains reachable               | Awaiting S06 T04                                                       |
| Package root phone landscape | no horizontal overflow; rail can scroll vertically; Help link can become visible after rail scroll | S06 T01 proved the short-height rail guard; full matrix awaits S06 T04 |
| Package root desktop         | shell, nav, disabled/guarded controls, and placeholders remain truthful                            | Awaiting S06 T04                                                       |
| Package Remote route         | Remote button sizes, disabled/guarded control state, and real panel visibility                     | Awaiting S06 T04                                                       |
| Package Help route           | owner-labeled placeholder copy and package-base recovery link                                      | Awaiting S06 T04                                                       |

Required coverage terms for this matrix: no horizontal overflow, reachable primary navigation, Remote real panel, owner-labeled placeholder, parity ledger, package verifier, console/network diagnostics, and category-level redaction.

## Command Verification

The closeout command gates are deterministic and do not require a live Kodi instance.

| Command                                                                                                                                                                                                                                                                                                     | Purpose                                                                                                                                                                                     | Evidence state                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run test -- scripts/verify-m006-final-proof-doc.test.ts`                                                                                                                                                                                                                                               | Guards this proof document for required sections, routes, commands, requirements, coverage terms, and unsafe literal leakage.                                                               | Pass; exit 0; 1 test file and 3 tests passed after the S06 T03 evidence update.                                                                                                                                                                  |
| `npm run test -- scripts/verify-m006-final-proof-doc.test.ts src/App.test.ts src/main.test.ts scripts/verify-kodi-package.test.ts scripts/package-kodi-webinterface.test.ts src/lib/app/chorus2ParityLedger.test.ts src/lib/components/RemoteInputPanel.test.ts src/lib/stores/remoteInputDispatch.test.ts` | Focused M006 regression pack covering this proof guard, package verifier/package builder tests, app/main route behavior, parity ledger tests, Remote/Input panel tests, and dispatch tests. | Pass; exit 0; 8 test files and 183 tests passed.                                                                                                                                                                                                 |
| `npm run verify:chorus2-parity`                                                                                                                                                                                                                                                                             | Verifies scanner/ledger/report agreement for the Chorus2 parity ledger.                                                                                                                     | Pass; exit 0; report verification covered 481 scanned item(s).                                                                                                                                                                                   |
| `npm run verify:kodi-package`                                                                                                                                                                                                                                                                               | Runs the package verifier for manifest, route identity, archive structure, package assets, and staged bundle references.                                                                    | Pass; exit 0; staged 27 package entries, checked the 41-entry archive root, verified relative HTML assets, and confirmed package route identities for root, video aliases, browser, add-ons, Remote, playlists, settings, Help, and now-playing. |
| `npm run typecheck`                                                                                                                                                                                                                                                                                         | Runs Svelte/TypeScript diagnostics for application sources.                                                                                                                                 | Pass; exit 0; 0 errors and 1 known non-fatal CSS warning for `speak`.                                                                                                                                                                            |
| `npm run build`                                                                                                                                                                                                                                                                                             | Produces the production Vite bundle used by package staging.                                                                                                                                | Pass; exit 0; 220 modules transformed; the known non-fatal large-chunk advisory still appears.                                                                                                                                                   |
| `npm run verify`                                                                                                                                                                                                                                                                                            | Runs repository lint, formatting check, typecheck, full tests, build, no-Tailwind/i18n checks, Kodi package staging, and package verification.                                              | Pass; exit 0 after proof-doc and guard formatting; aggregate gate completed through package verification.                                                                                                                                        |

If `npm run build` is run before `npm run verify:kodi-package`, the package verifier stages current package artifacts before strict validation so Vite cleanup does not leave stale package output.

## Browser Diagnostics

S06 browser proof must record only outcomes and category names, not raw diagnostic payloads. Browser diagnostics are expected for:

- DOM measurements: document/body scroll width, viewport width, rail link bounding boxes, rail scrollability, Remote button sizes, disabled/guarded control state, placeholder copy, and package-base recovery links.
- Console diagnostics: no console errors during package root, Remote, and Help proof flows.
- Network diagnostics: no failed package assets or unexpected failed fetch/XHR requests in the deterministic no-live proof flow.
- Redaction scan: visible DOM must be scanned against category-level unsafe evidence classes.

The browser proof should name route, viewport, and check on failure so the next executor can reproduce the gap.

## Visible-DOM Redaction Scan Categories

The final proof and browser evidence use category-level redaction. Do not paste raw live diagnostics, raw request bodies, or storage dumps into this document.

Forbidden visible-DOM/document literal categories:

- credential-bearing endpoint shapes
- auth header values
- browser storage internals
- raw JSON-RPC request/response/body/payload data
- SMB/special paths
- sentinel token values

Allowed evidence form:

- category name
- pass/fail outcome
- route and viewport identifier
- sanitized user-facing copy
- tracked file path or npm command name

## Evidence Log

| Evidence item                                      | Source                                                                                                                                                                                                                                                                                                      |           Result | Notes                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Parity source scanner and deterministic IDs        | M006/S01 summaries, `scripts/scan-chorus2-parity.mjs`                                                                                                                                                                                                                                                       |             Pass | Scanner reports the discovered Chorus2 inventory and feeds the structured ledger.                                                                                                                                                          |
| Structured parity ledger and generated report      | `src/lib/app/chorus2ParityLedger.ts`, `docs/m006-chorus2-parity.md`                                                                                                                                                                                                                                         |             Pass | Human-readable report and machine-checkable ledger stay paired.                                                                                                                                                                            |
| Route placeholders and owner/status copy           | M006/S02 summaries, router/App/component tests                                                                                                                                                                                                                                                              |             Pass | Placeholder routes identify surface, status, and owner instead of pretending to be complete features.                                                                                                                                      |
| Real Remote/Input route                            | M006/S03 summaries, Remote/Input tests                                                                                                                                                                                                                                                                      |             Pass | `/remote` is first-class and package-mounted Remote resolves to the real panel.                                                                                                                                                            |
| Video/media aliases and placeholder reconciliation | M006/S04 summaries, router/App/main tests                                                                                                                                                                                                                                                                   |             Pass | Curated aliases preserve existing Chorus3 routes and map unsupported families honestly.                                                                                                                                                    |
| Package-mounted shell proof                        | `docs/m006-packaged-shell-proof.md`                                                                                                                                                                                                                                                                         |             Pass | Root, Remote, Help placeholder, diagnostics, and package-safe assets were proved in S05.                                                                                                                                                   |
| Short-height rail reachability guard               | M006/S06 T01 summary, `src/App.test.ts`, `src/App.svelte`                                                                                                                                                                                                                                                   |             Pass | CSS/test contract guards vertical rail scrolling for short phone-landscape heights.                                                                                                                                                        |
| Final proof document guard                         | `npm run test -- scripts/verify-m006-final-proof-doc.test.ts`                                                                                                                                                                                                                                               |             Pass | Exit 0 after the S06 T03 evidence update; 1 test file and 3 tests passed.                                                                                                                                                                  |
| Focused M006 regression pack                       | `npm run test -- scripts/verify-m006-final-proof-doc.test.ts src/App.test.ts src/main.test.ts scripts/verify-kodi-package.test.ts scripts/package-kodi-webinterface.test.ts src/lib/app/chorus2ParityLedger.test.ts src/lib/components/RemoteInputPanel.test.ts src/lib/stores/remoteInputDispatch.test.ts` |             Pass | Exit 0; 8 test files and 183 tests passed across proof, package, App/main, ledger, Remote/Input panel, and dispatch coverage.                                                                                                              |
| Final package/parity command refresh               | `npm run verify:chorus2-parity`, `npm run verify:kodi-package`                                                                                                                                                                                                                                              |             Pass | Parity verifier checked 481 scanned item(s). Package verifier staged 27 entries, checked a 41-entry archive root, confirmed relative assets, and verified package route identities including root, Remote, Help, aliases, and now-playing. |
| Type/build command refresh                         | `npm run typecheck`, `npm run build`                                                                                                                                                                                                                                                                        |             Pass | Typecheck reported 0 errors plus the known non-fatal CSS `speak` warning. Build transformed 220 modules and retained the known non-fatal large-chunk advisory.                                                                             |
| Aggregate repository verification                  | `npm run verify`                                                                                                                                                                                                                                                                                            |             Pass | Exit 0 after the S06 T03 proof-doc and guard formatting update; aggregate lint, formatting, typecheck, tests, build, no-Tailwind, i18n, package, and package verifier gates completed.                                                     |
| Final browser matrix                               | Package root, Remote, Help routes                                                                                                                                                                                                                                                                           | Awaiting S06 T04 | Must include no horizontal overflow, reachable primary navigation, Remote button sizes, placeholder copy, console/network diagnostics, and redaction scan outcomes.                                                                        |

## Live Kodi Gap Note

M006 closeout is intentionally CI-safe and deterministic. It proves package-mounted browser behavior, package artifacts, route truthfulness, Remote/Input bounds, placeholder honesty, and parity ledger coverage without requiring a live Kodi installation.

R058 remains deferred: blocking full live-Kodi parity proof across all Chorus2-equivalent feature families belongs after the mapped parity milestones implement those feature families. Optional live Kodi UAT can add confidence, but this document must not convert optional live evidence into a blocking M006 parity claim unless real live proof is added and recorded with sanitized pass/fail outcomes only.
