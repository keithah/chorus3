# M005 Final Integrated Proof

Date: 2026-05-01
Milestone: M005
Slice: S07

## Scope

This document is the tracked final proof contract for M005. It is written for a fresh executor running the integrated browser and package pass through the real Vite entrypoint, with deterministic M005 browser-proof fixtures where live Kodi is not required.

The proof covers the primary M005 surfaces:

- Settings route editing, write diagnostics, rollback, refresh-after-write, and safe unknown-route handling
- Add-ons list and add-on detail route diagnostics, confirmation controls, rollback, and refresh-after-write copy
- Lab shortcuts and Lab API Browser guard, confirmation, blocked-method, and redacted JSON diagnostics
- Runtime English/German i18n switching and direct locale query handling
- Standalone Now Playing embed active, setup, theme, locale, and unsafe-query states
- Kodi package verification and packaged route smoke coverage

The proof is intentionally no-live-Kodi by default. Optional live Kodi install checks are documented as out of scope for the required S07 proof and must not weaken the deterministic proof if skipped.

## Requirements Cross-Reference

Use these tracked M005 UAT documents as the requirement-level source of truth while filling the evidence log:

- `docs/m005-settings-uat.md`
- `docs/m005-addons-uat.md`
- `docs/m005-lab-uat.md`
- `docs/m005-i18n-uat.md`
- `docs/m005-now-playing-uat.md`
- `docs/m005-kodi-package-uat.md`

This final proof reconciles those route- and package-specific runbooks into one integrated release gate. Do not cite local planning, audit, browser-state, or generated artifact directories as required inputs.

## Server Lifecycle

Start the dev server from the repository root with the managed background-process tool:

```text
npm run dev -- --host 127.0.0.1
```

Use the actual ready port reported by the managed process. Run every browser route through the real Vite app origin on that port.

After verification, stop the managed process with the same background-process tool. Do not leave a dev server running after the proof.

## Command and Package Verification

Run and record these command gates in the evidence log:

```text
npm run verify
npm run verify:kodi-package
zipinfo -1 dist/kodi/webinterface.chorus3-0.0.0.zip | sort
```

Expected package evidence:

- `npm run verify` exits 0 and includes lint, typecheck, tests, build, no-Tailwind, i18n, package creation, and package verification phases.
- `npm run verify:kodi-package` exits 0 and reports manifest, HTML asset, archive root, forbidden-content, Now Playing, route, and documentation checks.
- The zip listing shows one package root with manifest, app entrypoint, asset files, and the standalone Now Playing entrypoint.
- Package evidence must not include literal credentials, raw endpoint values, raw host snapshots, browser storage values, or secret-bearing request data.

## Browser Route Matrix

Run every route below through the real Vite entrypoint. Record the final outcome in the evidence log.

| Route                                                           | Proves                                                                                                                                                                  | Required visible text or actions                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/settings?m005-browser-proof=1`                                | Settings route, editable controls, unsupported read-only controls, write diagnostics, rollback, refresh-after-write, and safe redaction categories.                     | Settings heading, loaded status, Player and Services sections, Videos and Interface categories, autoplay, seek-step, tone-mapping, pending-write, saved-write, rejected-write, safe write-error, rollback, refresh-after-write, write counts, and read-only unsupported settings. |
| `/settings?m005-browser-proof=1&locale=de`                      | Direct German locale query handling for the Settings fixture.                                                                                                           | German Settings heading and loaded status, German write-count copy, German read-only unsupported-setting guidance, and absence of invalid-locale reflection.                                                                                                                      |
| `/addons?m005-browser-proof=1`                                  | Add-ons list route, fixture grouping, search/group controls, installed/enabled/disabled/broken/dependency metadata, and safe detail links.                              | Add-ons heading, loaded status, Safe Video Demo, Safe Helper Module, Safe Radio, grouped add-on type labels, badges, search/group controls, and safe detail link to the demo add-on.                                                                                              |
| `/addons/plugin.video.safe-demo?m005-browser-proof=1`           | Add-on detail route, confirmation controls, write diagnostics, rollback, refresh-after-write, and inert fixture dispatches.                                             | Safe Video Demo detail, loaded status, failed write status, safe fixture error code, rollback copy, pending-toggle copy, last-write copy, refresh warning, write counts, Enable add-on, Confirm enable, and Cancel enable.                                                        |
| `/lab/shortcuts?m005-browser-proof=1`                           | Lab shortcuts route and runtime i18n switch surface.                                                                                                                    | Playback shortcuts, Play / pause, language control, German shortcut heading after switching language, Key, and Action copy.                                                                                                                                                       |
| `/lab/api-browser?m005-browser-proof=1`                         | Lab API Browser fixture, method introspection, guard decisions, confirmation-required flow, blocked-method diagnostics, validation copy, and redacted JSON diagnostics. | Application.GetProperties, Player.Open, System.Shutdown, confirmation-required guard copy, blocked destructive-method copy, validation error, confirmation affordance, redacted request JSON, redacted response JSON, and redacted error JSON.                                    |
| `/now-playing?m005-browser-proof=1&theme=light&locale=de`       | Active standalone Now Playing embed with German locale, light theme, saved-host/status copy, fixture media, controls, and clean diagnostics.                            | German embed shell copy, Safe Room Kodi, Aurora Signal, light root theme, refresh/status copy, and media controls that do not require a live Kodi host.                                                                                                                           |
| `/now-playing?m005-browser-proof=1&embed-state=setup&locale=de` | Setup guidance state for standalone Now Playing without a configured host.                                                                                              | German setup-required guidance, saved-host configuration guidance through the main app flow, no fixture media title dependency, and clean diagnostics.                                                                                                                            |
| `/now-playing?m005-browser-proof=1&theme=dark&locale=en`        | English standalone Now Playing embed with dark theme.                                                                                                                   | English embed shell copy, Aurora Signal, dark root theme, saved-host/status copy, and clean diagnostics.                                                                                                                                                                          |
| `/now-playing?m005-browser-proof=1&credential-category=blocked` | Unsafe-query rejection behavior without reflecting raw query values.                                                                                                    | Safe unsafe-query guidance, fixture media remains safe, raw query values are not reflected, and category-level redaction scan passes.                                                                                                                                             |

Also run default or disabled fixture-gating checks for the primary route families before treating fixture evidence as valid:

- `/settings`
- `/addons`
- `/lab/api-browser`
- `/now-playing`

Distinctive fixture labels must be absent when the fixture flag is missing or disabled, except for route shells and generic app copy that can appear in normal UI.

## Browser Diagnostics

After default navigation and after each route in the matrix:

- assert no browser console errors
- assert no failed network requests
- inspect required route-specific visible text and interactions before marking the route passed
- clear or scope diagnostic buffers so failures can be attributed to the route that caused them
- record visible route status, alert, and live-region copy where the surface exposes it

Expected M005 diagnostic surfaces include Settings write/rollback/refresh copy, Add-ons write/rollback/refresh copy, Lab guard and redacted JSON copy, Now Playing setup and unsafe-query guidance, and package verifier phase diagnostics.

## Visible-DOM Redaction Scan Categories

Scan the full visible DOM after default navigation and after every fixture route. Record results by category, not by literal sensitive examples.

The scan must reject leaks in these categories:

- local, network, special, and web URL schemes
- credential-bearing endpoint shapes
- authentication header names or values
- credential and userinfo patterns
- browser storage internals
- raw JSON-RPC request, response, body, or payload data
- Kodi media path or prepared-stream address categories
- sentinel token names or values
- ignored local artifact paths and generated browser-state paths

Do not paste literal forbidden fixture strings, endpoint examples, credential examples, raw JSON bodies, storage key names, or sentinel values into this document, terminal notes, screenshots, summaries, issue comments, or commit messages.

## Evidence Log

T02 and T03 must replace the pending markers with pass/fail evidence from real commands and browser assertions.

| Check                               | Outcome | Notes                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server started with managed process | Pass    | Managed Vite server started from the repository root at the ready localhost origin on port 5173 for the browser proof pass. The process was stopped with the same managed-process tool after route evidence was collected.                                                                                                                     |
| `npm run verify`                    | Pass    | Exit 0 in 34.4s. Lint/prettier passed, svelte-check reported 0 errors and 0 warnings, Vitest passed 78 files / 1049 tests, production build passed twice with the known non-fatal >500 kB chunk-size warning, no-Tailwind and i18n verifiers passed, package staging wrote 5 entries, zip creation succeeded, and package verification passed. |
| `npm run verify:kodi-package`       | Pass    | Exit 0 in 108ms after the aggregate gate. Verifier reported staging inspection, matching manifest, relative HTML assets, 8-entry archive root, Now Playing package route support, packaged Now Playing entry, and safe package UAT docs.                                                                                                       |
| Zip listing                         | Pass    | Exit 0 in 1ms from the regenerated package. Archive is rooted at `webinterface.chorus3/` and contains `addon.xml`, `index.html`, generated CSS/JS assets, and `now-playing/index.html` with no source, env, planning, browser-state, or absolute-path entries.                                                                                 |
| Default fixture absence             | Pass    | Browser proof covered default Settings, Add-ons, Lab API Browser, and Now Playing routes without the M005 proof flag. Distinctive fixture labels were absent, while route shells and generic app copy remained safe to render.                                                                                                                 |
| Settings route                      | Pass    | Browser proof saw the Settings loaded status, Player and Services sections, Videos and Interface categories, editable autoplay/seek/tone-mapping controls, write counts, pending/saved/rejected write diagnostics, rollback copy, refresh-after-write copy, unsupported read-only guidance, and a passing DOM redaction scan.                  |
| Settings German locale route        | Pass    | Browser proof saw German Settings heading/status copy, German write-count copy, German unsupported read-only guidance, safe category labels, and no invalid-locale reflection.                                                                                                                                                                 |
| Add-ons list route                  | Pass    | Browser proof saw the Add-ons loaded status, safe list fixture labels, grouping and search controls, installed/enabled/disabled/broken/dependency metadata, safe detail navigation copy, and a passing DOM redaction scan.                                                                                                                     |
| Add-on detail route                 | Pass    | Browser proof saw detail loaded and write diagnostic statuses, safe fixture error-code copy, pending-toggle copy, last-write copy, rollback copy, refresh warning, write counts, and inert enable confirmation/cancel controls that kept diagnostics visible and safe.                                                                         |
| Lab shortcuts route                 | Pass    | Browser proof saw shortcut heading, play/pause entry, key/action table copy, and the runtime language control switching the route to German shortcut copy.                                                                                                                                                                                     |
| Lab API Browser route               | Pass    | Browser proof saw method introspection, confirmation-required guard copy, blocked destructive-method metadata, validation guidance, confirmation affordance, and request/response/error JSON diagnostics with redacted fields only.                                                                                                            |
| Now Playing active route            | Pass    | Browser proof saw German standalone embed copy, saved-host/status copy, Safe Room Kodi, Aurora Signal media, controls that do not require live Kodi, light root theme, clean diagnostics, and a passing DOM redaction scan.                                                                                                                    |
| Now Playing setup route             | Pass    | Browser proof saw German setup-required guidance directing setup through saved Chorus host settings, no fixture media dependency in setup state, clean diagnostics, and a passing DOM redaction scan.                                                                                                                                          |
| Now Playing English dark route      | Pass    | Browser proof saw English standalone embed copy, saved-host/status copy, Aurora Signal media, dark root theme, clean diagnostics, and a passing DOM redaction scan.                                                                                                                                                                            |
| Now Playing unsafe-query route      | Pass    | Browser proof generated a credential-like query locally, saw generic unsafe-parameter rejection guidance, retained safe fixture media, did not reflect the raw query value, and passed the category-level DOM redaction scan.                                                                                                                  |
| Console diagnostics                 | Pass    | Browser route matrix completed with zero console errors. Benign Vite connection debug messages observed during manual inspection were non-error diagnostics and were not counted as route failures.                                                                                                                                            |
| Network diagnostics                 | Pass    | Browser route matrix completed with zero failed network requests across fixture, default-gating, and unsafe-route checks.                                                                                                                                                                                                                      |
| Visible DOM redaction categories    | Pass    | Every checked route passed category-level visible DOM scans for forbidden fixture literals, credential/userinfo patterns, browser storage internals, raw transport payload labels, unredacted scheme categories, Kodi media path categories, generated artifact categories, and sentinel categories.                                           |

## Live Kodi Out-of-Scope Note

The required S07 proof is deterministic and no-live-Kodi. Optional live install or saved-host iframe checks may be recorded only as supplemental evidence after the deterministic command, package, browser, diagnostic, and redaction checks pass.

If live Kodi is unavailable, skipped, or times out, record that as supplemental live UAT status only. Do not mark the M005 final integrated proof failed solely because optional live Kodi checks were not run.
