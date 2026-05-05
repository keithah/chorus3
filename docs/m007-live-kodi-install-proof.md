# M007 Live Kodi Install Proof

Date: 2026-05-04
Milestone: M007
Slice: S08

## Reader and Action

Reader: a fresh executor or release operator validating the packaged Chorus3 Kodi webinterface against a local live Kodi instance.

Post-read action: run the command gates, install or select the generated webinterface through normal Kodi add-on operation, open the active and package-mounted URLs, record route and diagnostic outcomes, and classify R069 without overclaiming unavailable live evidence.

## Scope and Requirement Boundary

This document is the mechanically checked live Kodi install proof contract for S08. It is the place to record whether the generated package installs and serves the rebuilt AppShell at the active webinterface root and package-mounted add-on root.

The S07 visual baseline is `docs/m007-visual-parity-proof.md`; that visual baseline is not live proof. It proves deterministic AppShell visual parity and screenshot coverage only. Do not use those screenshots to claim live Kodi install success.

R069 requires successful live Kodi install/browser proof. R069 remains blocked until live Kodi install/browser proof passes.

R073 remains satisfied only when Kodi server settings are not changed beyond normal webinterface installation, selection, and operation.

## Prerequisites

- A candidate package has been generated from the current revision.
- The operator has access to a local Kodi instance that exposes the normal webinterface port.
- Chorus3 is installed through the normal add-on install-from-zip flow or is already installed from the current candidate package.
- Chorus3 is selected as the active webinterface only through normal Kodi add-on selection or operation.
- Evidence is recorded as pass, fail, blocked, or not run without raw secrets, raw transport bodies, private media paths, or untracked local artifact locations.

## Command Gates

Run these command gates before recording live browser outcomes:

```text
npm run package:kodi
npm run verify:kodi-package
npm run test -- scripts/verify-m007-package-browser-proof.test.ts
npm run test -- scripts/verify-m007-live-kodi-proof-doc.test.ts scripts/verify-m007-visual-proof-doc.test.ts
```

Expected command evidence:

- package generation exits successfully and creates the installable candidate.
- package verification exits successfully and reports package route fallback, asset, zip, manifest, and forbidden-content diagnostics.
- no-live package browser proof exits successfully before live Kodi evidence is attempted.
- proof-document verifiers exit successfully so the recorded evidence remains mechanically bounded.

## S09 Local Live Runner

Use the local-only S09 runner to classify live availability and, when Chorus3 is reachable, record route, browser-diagnostic, asset, visible-DOM redaction, and remote-safe command classes:

```text
node scripts/verify-m007-live-kodi-browser-proof.mjs --origin http://localhost:8080 --dry-run
node scripts/verify-m007-live-kodi-browser-proof.mjs --origin http://localhost:8080 --output docs/m007-live-kodi-install-proof.md
```

The runner defaults to `http://localhost:8080/`. It accepts only loopback origins, rejects credential-bearing origins, and uses environment-provided credentials only for live HTTP contexts without printing them.

Sanitized runner classes:

| Class                                                            | Meaning                                                                                                                                                                                    | R069 effect                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `passed`                                                         | Active root, package root, bounded package routes, `/remote`, `/now-playing`, assets, browser diagnostics, visible DOM redaction, and safe remote command all passed against live Chorus3. | R069 may be validated only with this live-pass evidence plus command gates. |
| `unavailable`                                                    | The local Kodi webserver could not be reached.                                                                                                                                             | R069 remains blocked.                                                       |
| `auth-required`                                                  | The local Kodi webserver required credentials that were absent or rejected.                                                                                                                | R069 remains blocked.                                                       |
| `timeout`                                                        | A probe, route, browser, or remote phase timed out.                                                                                                                                        | R069 remains blocked.                                                       |
| `wrong-webinterface`                                             | The active or package route did not serve Chorus3 AppShell markers.                                                                                                                        | R069 remains blocked.                                                       |
| `malformed-response`                                             | The status endpoint returned a malformed envelope; no raw body is recorded.                                                                                                                | R069 remains blocked.                                                       |
| `route-failed`                                                   | A bounded route returned an unexpected status or redaction failure.                                                                                                                        | R069 remains blocked.                                                       |
| `asset-failed`                                                   | A JavaScript, CSS, image, or font asset failed during route checks.                                                                                                                        | R069 remains blocked.                                                       |
| `browser-error`, `browser-timeout`, `console-error`              | Browser diagnostics reported a sanitized network, timeout, or script class.                                                                                                                | R069 remains blocked.                                                       |
| `remote-sanitized-failure`, `remote-timeout`, `remote-malformed` | The bounded non-destructive remote command did not produce a sanitized pass class.                                                                                                         | R069 remains blocked.                                                       |

Dry-run output is status-only and does not edit this document. The output mode may append or replace the S09 runner evidence block, but it must still preserve the redaction rules below and must not claim live proof has passed unless the runner status is `passed`.

## Package Artifact

The installable artifact pattern is:

```text
dist/kodi/webinterface.chorus3-<version>.zip
```

Use the generated candidate package from that pattern for normal Kodi install-from-zip. Do not edit generated package contents by hand while collecting this proof.

## Live Kodi Availability Status

Current status classification for this document: Live Kodi unavailable.

Live Kodi unavailable means R069 remains blocked until a live browser run passes. A blocked live run is honest evidence when the Kodi instance is not available, cannot be selected as the active webinterface, or times out before route checks can be completed.

No-live package proof passed is useful but does not validate R069. It only proves deterministic package structure, route fallback, asset loading, and no-live browser diagnostics before live installation.

Live Kodi install/browser proof passed may be recorded only after the same candidate package is installed or selected in Kodi and every required route row passes with clean browser diagnostics.

## Route Matrix

Use this matrix for live browser proof. The active root proves Chorus3 is selected as Kodi's active webinterface. The package root proves direct package mounting under the add-on path. Direct route rows prove package route fallback and asset resolution after page reload. The remote route row additionally proves the remote surface loads before any remote-safe command proof is attempted.

| Surface                          | URL                                                                 | Expected outcome                                                                                               | Status                         | Sanitized diagnostics |
| -------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------- |
| Active root                      | `http://localhost:8080/`                                            | AppShell loads as the active Kodi webinterface.                                                                | Blocked: Live Kodi unavailable | Not run.              |
| Package root                     | `http://localhost:8080/addons/webinterface.chorus3/`                | AppShell loads from the package-mounted add-on root.                                                           | Blocked: Live Kodi unavailable | Not run.              |
| Package music direct route       | `http://localhost:8080/addons/webinterface.chorus3/music`           | Direct load falls back to AppShell and renders the Music surface.                                              | Blocked: Live Kodi unavailable | Not run.              |
| Package movies direct route      | `http://localhost:8080/addons/webinterface.chorus3/movies`          | Direct load falls back to AppShell and renders the Movies surface.                                             | Blocked: Live Kodi unavailable | Not run.              |
| Package TV shows direct route    | `http://localhost:8080/addons/webinterface.chorus3/tvshows`         | Direct load falls back to AppShell and renders the TV shows surface.                                           | Blocked: Live Kodi unavailable | Not run.              |
| Package add-ons direct route     | `http://localhost:8080/addons/webinterface.chorus3/addons/all`      | Direct load falls back to AppShell and renders the Add-ons surface without confusing it with the package root. | Blocked: Live Kodi unavailable | Not run.              |
| Package settings direct route    | `http://localhost:8080/addons/webinterface.chorus3/settings/addons` | Direct load falls back to AppShell and renders the Settings add-ons surface.                                   | Blocked: Live Kodi unavailable | Not run.              |
| Package now-playing direct route | `http://localhost:8080/addons/webinterface.chorus3/now-playing`     | Direct load renders the packaged Now Playing embed or safe setup guidance.                                     | Blocked: Live Kodi unavailable | Not run.              |
| Package remote direct route      | `http://localhost:8080/addons/webinterface.chorus3/remote`          | Direct load falls back to AppShell and renders the Remote surface before safe-command checks are attempted.    | Blocked: Live Kodi unavailable | Not run.              |

## Browser Diagnostics

Remote-safe command proof is allowed only after the package remote direct route loads in live Kodi with clean browser diagnostics. Any bounded non-destructive remote command must be limited to volume readback or GUI notification only, and must not issue library mutations, playback changes, settings writes, file operations, or raw JSON-RPC bodies.

For each route row, record only sanitized diagnostic classes:

- browser console errors: pass only when no error-level entries appear after route settlement.
- failed network requests: pass only when no failed route, HTML, JavaScript, CSS, image, or font request remains after route settlement.
- asset 404: fail when a package asset returns missing-resource status.
- route fallback: pass only when direct route reload serves the AppShell rather than a Kodi 404 or directory listing.
- visible DOM redaction scan: pass only when visible text contains no credentials, secret-looking tokens, private media locations, raw transport bodies, or generated local evidence paths.
- sanitized diagnostic class: record the class of failure and route name, not the raw payload.

## Redaction Rules

Record category-level evidence only. Safe examples are command name, exit code, route label, route status, sanitized diagnostic class, and package artifact pattern.

Do not record raw credentials, credential-bearing URLs, secret HTTP header names or values, raw JSON-RPC bodies, raw request or response bodies, browser storage dumps or keys, raw endpoint snapshots, private media paths, generated browser session paths, ignored planning paths, or absolute operator-machine paths.

If a browser or Kodi diagnostic contains sensitive-looking material, write the category and outcome only. For example, record `failed network requests: route fallback failed on Package music direct route` rather than the raw request details.

## Result Classification

Use exactly one classification for the live proof status:

| Classification                         | Meaning                                                                                                                            | R069 outcome                                                       | R073 outcome                                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Live Kodi unavailable                  | Kodi could not be reached, selected, or exercised during this proof run.                                                           | R069 remains blocked until live Kodi install/browser proof passes. | R073 is not weakened when no server settings were changed.                                                                               |
| No-live package proof passed           | Package and no-live browser gates passed, but live Kodi was not exercised.                                                         | Does not validate R069.                                            | R073 remains satisfied only if no extra server-setting changes were made.                                                                |
| Live Kodi install/browser proof passed | The generated package was installed or selected through normal Kodi operation and every route row plus browser diagnostics passed. | R069 may be validated by this live evidence.                       | R073 remains satisfied only when Kodi server settings are not changed beyond normal webinterface installation, selection, and operation. |

Do not infer the third classification from deterministic screenshots, package zip inspection, or no-live browser proof alone.

## Evidence Log

| Check                          | Status                         | Evidence owner | Notes                                                                                                                                                             |
| ------------------------------ | ------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proof document contract        | Pass                           | T04            | The proof document and verifier define live, no-live, and unavailable-live boundaries.                                                                            |
| S07 visual baseline link       | Pass                           | T04            | `docs/m007-visual-parity-proof.md` is referenced as visual baseline only and not live proof.                                                                      |
| Command gates                  | Pass                           | T05            | `npm run verify`, `npm run verify:chorus2-parity`, `npm run verify:kodi-package`, and the targeted S08/S07/package browser/main test command exited 0.            |
| Package artifact               | Pass                           | T05            | `dist/kodi/webinterface.chorus3-<version>.zip` exists after the command gates.                                                                                    |
| Active root                    | Blocked: Live Kodi unavailable | T05            | Status-only probe and browser navigation reported connection refused for the active root; no live route assertions were run.                                      |
| Package root                   | Blocked: Live Kodi unavailable | T05            | Not run because the local Kodi webserver was unavailable before package-mounted route checks.                                                                     |
| Direct route fallback matrix   | Blocked: Live Kodi unavailable | T05            | Not run because the local Kodi webserver was unavailable; no-live package browser proof passed but does not validate R069.                                        |
| Remote route and command proof | Blocked: Live Kodi unavailable | T01            | Remote surface and remote-safe command proof are not run until live Kodi is available; allowed commands stay bounded and non-destructive.                         |
| Browser diagnostics            | Blocked: Live Kodi unavailable | T05            | Browser diagnostics are limited to unavailable connection class; console, asset, route fallback, and visible DOM redaction checks were not run against live Kodi. |
| R069                           | Blocked: Live Kodi unavailable | T05            | R069 remains blocked because successful live Kodi install/browser proof was not available.                                                                        |
| R073                           | Boundary documented            | T04            | R073 forbids changing Kodi server settings beyond normal webinterface installation, selection, and operation.                                                     |

<!-- S09_LIVE_KODI_RUNNER_EVIDENCE_START -->
## S09 Live Kodi Runner Evidence

Recorded status classification: unavailable.

```text
M007 live Kodi proof status: unavailable.
Origin class: local-loopback.
R069 validation: blocked; live-pass evidence absent.
Probe: unavailable.
Status endpoint: unavailable.
Remote safe command: remote-sanitized-failure.
Routes:
- active-root: unavailable; path=active-root; http=network-error; asset=not-run; visible-dom=not-run.
- package-root: unavailable; path=package-root; http=network-error; asset=not-run; visible-dom=not-run.
- package-music: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-music-genres: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-movies: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-tvshows: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-browser: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-files: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-addons-all: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-addon-detail-safe-demo: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-playlists: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-settings-web: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-settings-kodi-interface: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-help: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-help-keyboard: unavailable; path=package-route; http=network-error; asset=not-run; visible-dom=not-run.
- package-remote: unavailable; path=package-remote; http=network-error; asset=not-run; visible-dom=not-run.
- package-now-playing: unavailable; path=package-now-playing; http=network-error; asset=not-run; visible-dom=not-run.
```

R069 remains blocked until live Kodi install/browser proof passes.
<!-- S09_LIVE_KODI_RUNNER_EVIDENCE_END -->
