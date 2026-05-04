# M007 Visual Parity Proof

Date: 2026-05-04
Milestone: M007
Slice: S07
Reader: a fresh executor capturing AppShell screenshots for T04 or validating the proof before S08.
Post-read action: capture the planned current screenshots, classify each delta honestly, and record browser diagnostics without relying on live Kodi install proof.

## Scope

This document is the tracked visual proof contract for the rebuilt neutral AppShell. It compares the current primary shell against reference screenshots by route, visible state, screenshot path, and classified delta. It is not a pixel-diff baseline and it is not live Kodi install proof.

Covered surfaces:

- AppShell primary rail, secondary submenu, page stage, and right drawer.
- Music artists, movie library, TV library, add-ons, settings, now playing, files/browser, local playlists, and help/about surfaces.
- Drawer Kodi audio and drawer local video states.
- Browser command diagnostics, visible DOM redaction scan, and package verifier boundary checks.

The proof uses deterministic `m007-visual-proof=1` fixture state. Live Kodi install proof belongs to S08 live Kodi install proof and must not be claimed here.

## Redaction Rules

Do not add raw credentials, credential-bearing endpoints, auth header names or values, raw transport bodies, browser storage dumps or keys, raw media paths, sentinel token values, ignored local artifact paths, or generated browser session paths to this document, screenshots, README, test fixtures, task summaries, issue comments, or commit messages.

Allowed evidence is category-level only: route name, selector class, pass/fail status, command name, screenshot relative path, and sanitized diagnostic class. If a diagnostic contains sensitive-looking material, record the category and outcome, not the literal text.

## Reference Screenshot Inventory

These existing source-controlled reference screenshots are the historical visual inputs for this proof. They are referenced by path only and are not renamed after the current shell.

| Reference state        | Reference screenshot                                  | Used by current states                                            |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Add-ons                | `chorus2-21.x-1.0.1/dist/screenshots/addons.jpg`      | Add-ons all                                                       |
| Music artists          | `chorus2-21.x-1.0.1/dist/screenshots/artists.jpg`     | Music artists                                                     |
| Movie library          | `chorus2-21.x-1.0.1/dist/screenshots/movie.jpg`       | Movie library                                                     |
| TV library             | `chorus2-21.x-1.0.1/dist/screenshots/tv.jpg`          | TV library                                                        |
| Settings               | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg`    | Settings Kodi add-ons, Help about, Files browser, Local playlists |
| Now playing and drawer | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | Now playing, Drawer Kodi audio, Drawer local video                |

## Current Screenshot Inventory

T04 must create the current screenshots below under the tracked documentation directory. Do not use ignored browser session directories or temporary capture folders as final evidence.

| Current state         | Planned current screenshot                                     | Capture status  |
| --------------------- | -------------------------------------------------------------- | --------------- |
| Music artists         | `docs/m007-visual-parity-screenshots/music-artists.png`        | Planned for T04 |
| Movie library         | `docs/m007-visual-parity-screenshots/movie-library.png`        | Planned for T04 |
| TV library            | `docs/m007-visual-parity-screenshots/tv-library.png`           | Planned for T04 |
| Add-ons all           | `docs/m007-visual-parity-screenshots/addons-all.png`           | Planned for T04 |
| Settings Kodi add-ons | `docs/m007-visual-parity-screenshots/settings-kodi-addons.png` | Planned for T04 |
| Now playing           | `docs/m007-visual-parity-screenshots/now-playing.png`          | Planned for T04 |
| Files browser         | `docs/m007-visual-parity-screenshots/files-browser.png`        | Planned for T04 |
| Local playlists       | `docs/m007-visual-parity-screenshots/local-playlists.png`      | Planned for T04 |
| Help about            | `docs/m007-visual-parity-screenshots/help-about.png`           | Planned for T04 |
| Drawer Kodi audio     | `docs/m007-visual-parity-screenshots/drawer-kodi-audio.png`    | Planned for T04 |
| Drawer local video    | `docs/m007-visual-parity-screenshots/drawer-local-video.png`   | Planned for T04 |

## Route and State Matrix

Each row must be exercised through the real app entrypoint with deterministic M007 fixtures. The current screenshot path is planned until T04 captures the file. The delta category must be one of `match`, `intentional-delta`, `deferred`, or `needs-follow-up`.

| State                 | Route                                                  | Reference screenshot                                  | Current screenshot                                             | Required visible anchors                                                    | Delta category      |
| --------------------- | ------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- |
| Music artists         | `/music/artists?m007-visual-proof=1`                   | `chorus2-21.x-1.0.1/dist/screenshots/artists.jpg`     | `docs/m007-visual-parity-screenshots/music-artists.png`        | AppShell rail, `SECTIONS`, `Artists`, artists page heading                  | `match`             |
| Movie library         | `/video/movies?m007-visual-proof=1`                    | `chorus2-21.x-1.0.1/dist/screenshots/movie.jpg`       | `docs/m007-visual-parity-screenshots/movie-library.png`        | AppShell rail, `SECTIONS`, `Movies`, movie library heading                  | `match`             |
| TV library            | `/video/tv?m007-visual-proof=1`                        | `chorus2-21.x-1.0.1/dist/screenshots/tv.jpg`          | `docs/m007-visual-parity-screenshots/tv-library.png`           | AppShell rail, `SECTIONS`, `TV shows`, TV library heading                   | `match`             |
| Add-ons all           | `/addons/all?m007-visual-proof=1`                      | `chorus2-21.x-1.0.1/dist/screenshots/addons.jpg`      | `docs/m007-visual-parity-screenshots/addons-all.png`           | AppShell rail, `ADD-ONS`, `All`, add-ons heading                            | `match`             |
| Settings Kodi add-ons | `/settings/addons?m007-visual-proof=1`                 | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg`    | `docs/m007-visual-parity-screenshots/settings-kodi-addons.png` | AppShell rail, `GENERAL`, `KODI SETTINGS`, `Add-ons`                        | `intentional-delta` |
| Now playing           | `/now-playing?m007-visual-proof=1`                     | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | `docs/m007-visual-parity-screenshots/now-playing.png`          | AppShell rail, Now playing heading, player stage                            | `match`             |
| Files browser         | `/files?m007-visual-proof=1`                           | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg`    | `docs/m007-visual-parity-screenshots/files-browser.png`        | AppShell rail, browser/files heading, source/add-on browse copy             | `deferred`          |
| Local playlists       | `/playlists?m007-visual-proof=1`                       | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg`    | `docs/m007-visual-parity-screenshots/local-playlists.png`      | AppShell rail, Playlists label, New Playlist action                         | `needs-follow-up`   |
| Help about            | `/help?m007-visual-proof=1`                            | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg`    | `docs/m007-visual-parity-screenshots/help-about.png`           | AppShell rail, `HELP TOPICS`, `About`, `What is Chorus?`                    | `match`             |
| Drawer Kodi audio     | `/music?m007-visual-proof=1&drawer=kodi-audio`         | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | `docs/m007-visual-parity-screenshots/drawer-kodi-audio.png`    | drawer ARIA/data attributes, Kodi tab, Audio tab, Current playlist          | `intentional-delta` |
| Drawer local video    | `/video/movies?m007-visual-proof=1&drawer=local-video` | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | `docs/m007-visual-parity-screenshots/drawer-local-video.png`   | drawer ARIA/data attributes, Local tab, Video tab, local playlist selectors | `deferred`          |

## Parity Checklist

Before a route/state row is marked pass, verify these signals and record the outcome in the evidence log:

- stable shell/stage/page/drawer/local playlist selectors are visible or intentionally absent for the state under test.
- route-specific visible headings match the route/state row.
- drawer ARIA/data attributes identify expanded, collapsed, Kodi, Local, Audio, and Video states where relevant.
- browser console errors are absent after route settlement.
- failed network requests are absent after route settlement.
- visible DOM redaction scan passes by category.
- package-mounted links remain under the webinterface base when package mode is checked.
- `npm run verify:kodi-package` remains the package boundary proof for this slice.

Automated pixel-diff parity is not blocking for M007. Screenshot review and explicit browser assertions are the blocking visual evidence.

## Classified Deltas

Use these exact categories only. Every route/state row must carry one category and a short explanation.

| Category            | Meaning                                                                                                               | When to use                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `match`             | The current AppShell is visually and structurally aligned enough for M007 screenshot proof.                           | Use when layout, labels, route heading, drawer state, and screenshot reference agree within the no-pixel-diff proof level. |
| `intentional-delta` | The current product differs by a deliberate M007 decision while preserving user-facing parity intent.                 | Use for neutral naming, safer disabled controls, fixture-only labels, or known AppShell implementation boundaries.         |
| `deferred`          | The surface is represented for screenshot continuity, but live behavior or final data proof belongs to a later owner. | Use for live Kodi install proof, package-installed runtime proof, or behavior explicitly assigned to S08.                  |
| `needs-follow-up`   | The screenshot exposes a visual or behavioral gap that must be filed or resolved before the milestone is closed.      | Use when the AppShell screenshot fails the route/state expectation without a documented deferral.                          |

Current classified deltas to carry into T04:

| State                 | Category            | Explanation                                                                                                                                                                    |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Settings Kodi add-ons | `intentional-delta` | T01 mapped `settingsKodi` and `settingsKodiSection` active state to the `KODI SETTINGS` / `Add-ons` proof anchor because the current labels omit a separate Kodi submenu item. |
| Files browser         | `deferred`          | S07 proves route visual presence; S08 owns live Kodi install proof and any package-installed source browsing behavior.                                                         |
| Local playlists       | `needs-follow-up`   | T04 must verify whether the New Playlist and empty local playlist state match the reference target closely enough or file the visual gap.                                      |
| Drawer Kodi audio     | `intentional-delta` | Drawer controls may be safe, disabled, or fixture-backed while still proving the AppShell state and ARIA/data attributes.                                                      |
| Drawer local video    | `deferred`          | Local drawer visual state is captured here; live playback or persisted local queue behavior is not claimed.                                                                    |

## Command and Browser Diagnostics

Command gates for this contract:

```text
npm run test -- scripts/verify-m007-visual-proof-doc.test.ts
npm run verify:kodi-package
```

Browser gates for T04:

- run every route in the route/state matrix through a managed local dev server or package-mounted runtime as appropriate for the task.
- assert route-specific visible headings and stable selectors before taking the screenshot.
- assert drawer ARIA/data attributes for both drawer rows.
- check browser console errors and failed network requests after every route/action.
- run a visible DOM redaction scan after every route/action.
- record sanitized results in this document without raw diagnostic payloads.

The verifier `scripts/verify-m007-visual-proof-doc.test.ts` enforces required proof sections, route/state rows, reference screenshot paths, planned current screenshot paths, allowed delta categories, S08 ownership wording, pixel-diff non-blocking wording, and forbidden sensitive/path categories.

## Evidence Log

| Check                        | Status   | Evidence owner | Notes                                                                                                                   |
| ---------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Proof document contract      | Planned  | T03            | `npm run test -- scripts/verify-m007-visual-proof-doc.test.ts` validates this skeleton before screenshots are captured. |
| Screenshot README contract   | Planned  | T03            | README lists planned filenames and capture/redaction expectations.                                                      |
| Current screenshots captured | Planned  | T04            | T04 must replace planned status with screenshot capture evidence for every current screenshot path.                     |
| Browser route assertions     | Planned  | T04            | T04 must record heading, selector, drawer, console, network, and redaction results by route/state.                      |
| Package verifier             | Planned  | T04/S08        | `npm run verify:kodi-package` remains required; package-installed live Kodi proof is S08-owned.                         |
| Live Kodi install proof      | Deferred | S08            | S08 owns live Kodi install proof. S07 must not mark it complete.                                                        |

## S08 Live Kodi Boundary

S07 is the screenshot-referenced visual parity proof for deterministic AppShell state. S08 owns live Kodi install proof, package-installed runtime behavior, and any evidence that requires a real Kodi instance. If live Kodi is unavailable during S07, the S07 visual proof can still pass when the document contract, screenshots, browser diagnostics, redaction scan, and package verifier pass.

Do not weaken S07 by treating missing S08 live proof as an S07 failure, and do not overclaim M007 as having completed live Kodi install proof from deterministic screenshots alone.
