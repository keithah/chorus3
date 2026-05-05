# M007 Visual Parity Proof

Date: 2026-05-04
Milestone: M007
Slice: S07
Reader: a fresh executor validating AppShell screenshots before S08.
Post-read action: use this evidence as deterministic S07 visual proof only; S08 owns live Kodi install proof.

## Scope

This document is the tracked visual proof contract for the rebuilt neutral AppShell. It compares the current primary shell against reference screenshots by route, visible state, screenshot path, and classified delta. It is not a pixel-diff baseline and it is not live Kodi install proof.

Covered surfaces:

- AppShell primary rail, secondary submenu, page stage, and right drawer.
- Music, movies, TV shows, add-ons, settings, files/browser, local playlists, and help/about surfaces.
- Drawer expanded menu and collapsed states.
- Browser command diagnostics, visible DOM redaction scan, and package verifier boundary checks.

The proof uses deterministic `m007-visual-proof=1` fixture state. Live Kodi install proof belongs to S08 live Kodi install proof and must not be claimed here. Use `docs/m007-live-kodi-install-proof.md` for the S08 live Kodi install evidence contract.

## Redaction Rules

Do not add raw credentials, credential-bearing endpoints, auth header names or values, raw transport bodies, browser storage dumps or keys, raw media paths, sentinel token values, ignored local artifact paths, or generated browser session paths to this document, screenshots, README, test fixtures, task summaries, issue comments, or commit messages.

Allowed evidence is category-level only: route name, selector class, pass/fail status, command name, screenshot relative path, and sanitized diagnostic class. If a diagnostic contains sensitive-looking material, record the category and outcome, not the literal text.

## Reference Screenshot Inventory

These existing source-controlled reference screenshots are the historical visual inputs for this proof. They are referenced by path only and are not renamed after the current shell.

| Reference state | Reference screenshot | Used by current states |
| --- | --- | --- |
| Add-ons | `chorus2-21.x-1.0.1/dist/screenshots/addons.jpg` | Add-ons list and add-on detail |
| Music artists | `chorus2-21.x-1.0.1/dist/screenshots/artists.jpg` | Music home and submenu |
| Movie library | `chorus2-21.x-1.0.1/dist/screenshots/movie.jpg` | Movies |
| TV library | `chorus2-21.x-1.0.1/dist/screenshots/tv.jpg` | TV shows |
| Settings | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg` | Browser files, settings, local playlists, help |
| Now playing and drawer | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | Drawer states |

## Current Screenshot Inventory

T04 captured the current screenshots below under the tracked documentation directory. No ignored browser session directories or temporary capture folders are final evidence.

| Current state | Current screenshot | Capture status |
| --- | --- | --- |
| Music home | `docs/m007-visual-parity-screenshots/current-music-home.png` | Captured |
| Music submenu | `docs/m007-visual-parity-screenshots/current-music-submenu.png` | Captured |
| Movies | `docs/m007-visual-parity-screenshots/current-movies.png` | Captured |
| TV shows | `docs/m007-visual-parity-screenshots/current-tvshows.png` | Captured |
| Browser files | `docs/m007-visual-parity-screenshots/current-browser-files.png` | Captured |
| Add-ons list | `docs/m007-visual-parity-screenshots/current-addons-list.png` | Captured |
| Add-on detail | `docs/m007-visual-parity-screenshots/current-addon-detail.png` | Captured |
| Local playlists | `docs/m007-visual-parity-screenshots/current-playlists-local.png` | Captured |
| Settings Kodi | `docs/m007-visual-parity-screenshots/current-settings-kodi.png` | Captured |
| Help overview | `docs/m007-visual-parity-screenshots/current-help-overview.png` | Captured |
| Drawer expanded menu | `docs/m007-visual-parity-screenshots/current-drawer-expanded-menu.png` | Captured |
| Drawer collapsed | `docs/m007-visual-parity-screenshots/current-drawer-collapsed.png` | Captured |

## Route and State Matrix

Each row was exercised through the real app entrypoint with deterministic M007 fixtures. The delta category is one of `match`, `intentional-delta`, `deferred`, or `needs-follow-up`.

| State | Route/action | Reference screenshot | Current screenshot | Verified visible anchors | Delta category | Delta note |
| --- | --- | --- | --- | --- | --- | --- |
| Music home | `/music?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/artists.jpg` | `docs/m007-visual-parity-screenshots/current-music-home.png` | AppShell rail, Music, Music Library, Nina Simone | `match` | Primary music route renders deterministic music library content inside the neutral shell. |
| Music submenu | `/music/artists?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/artists.jpg` | `docs/m007-visual-parity-screenshots/current-music-submenu.png` | AppShell rail, Music submenu, Artists, Albums | `match` | Primary rail hover/focus submenu exposes music navigation anchors for screenshot parity. |
| Movies | `/movies?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/movie.jpg` | `docs/m007-visual-parity-screenshots/current-movies.png` | AppShell rail, Movies, Video Movies | `match` | Current router uses the tracked `/movies` primary route while package verification covers mounted aliases. |
| TV shows | `/tvshows?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/tv.jpg` | `docs/m007-visual-parity-screenshots/current-tvshows.png` | AppShell rail, TV shows, TV Shows | `match` | Current router uses the tracked `/tvshows` primary route while package verification covers mounted aliases. |
| Browser files | `/files?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg` | `docs/m007-visual-parity-screenshots/current-browser-files.png` | AppShell rail, Browser / Files, Media Files | `deferred` | S07 proves the route visual shell and fixture files panel; live source browsing remains S08-owned. |
| Add-ons list | `/addons/all?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/addons.jpg` | `docs/m007-visual-parity-screenshots/current-addons-list.png` | AppShell rail, Add-ons, Safe Video Demo | `match` | Add-ons list renders deterministic safe fixture data and the neutral card treatment. |
| Add-on detail | `/addons/plugin.video.safe-demo?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/addons.jpg` | `docs/m007-visual-parity-screenshots/current-addon-detail.png` | AppShell rail, Add-on details, Safe Video Demo | `intentional-delta` | Detail controls are safely fixture-backed; execute/deep add-on behavior remains outside S07. |
| Local playlists | `/playlists?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg` | `docs/m007-visual-parity-screenshots/current-playlists-local.png` | AppShell rail, Playlists, Browser Jazz, local playlist selector | `needs-follow-up` | The local playlist state is visible and deterministic, but final saved/local queue behavior remains a product follow-up. |
| Settings Kodi | `/settings/addons?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg` | `docs/m007-visual-parity-screenshots/current-settings-kodi.png` | AppShell rail, GENERAL, KODI SETTINGS, Add-ons | `intentional-delta` | Navigation maps Kodi settings active state to KODI SETTINGS / Add-ons without a standalone Kodi submenu label. |
| Help overview | `/help?m007-visual-proof=1` | `chorus2-21.x-1.0.1/dist/screenshots/settings.jpg` | `docs/m007-visual-parity-screenshots/current-help-overview.png` | AppShell rail, Help, What is Chorus? | `match` | Static Help overview gives a deterministic about/help surface for parity evidence. |
| Drawer expanded menu | `/music?m007-visual-proof=1 plus playlist menu action` | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | `docs/m007-visual-parity-screenshots/current-drawer-expanded-menu.png` | drawer ARIA/data attributes, Kodi, Audio, Current playlist menu | `intentional-delta` | Drawer menu is intentionally safe/disabled where persistence or Kodi commands are deferred. |
| Drawer collapsed | `/music?m007-visual-proof=1 plus collapse action` | `chorus2-21.x-1.0.1/dist/screenshots/now-playing.jpg` | `docs/m007-visual-parity-screenshots/current-drawer-collapsed.png` | drawer ARIA/data attributes, collapsed data state, shell layout | `match` | Collapsed drawer proof relies on data and ARIA state because the visible drawer label is intentionally hidden. |

## Parity Checklist

Before each route/state row was marked pass, the browser capture checked these signals:

- stable shell/stage/page/drawer/local playlist selectors were visible or intentionally absent for the state under test.
- route-specific visible headings matched the route/state row.
- drawer ARIA/data attributes identified expanded and collapsed states where relevant.
- browser console errors were absent after route settlement.
- failed network requests were absent after route settlement.
- visible DOM redaction scan passed by category.
- package-mounted links remain under the webinterface base when package mode is checked.
- `npm run verify:kodi-package` remains the package boundary proof for this slice.

Automated pixel-diff parity is not blocking for M007. Screenshot review and explicit browser assertions are the blocking visual evidence.

## Classified Deltas

Use these exact categories only. Every route/state row carries one category and a short explanation.

| Category | Meaning | When to use |
| --- | --- | --- |
| `match` | The current AppShell is visually and structurally aligned enough for M007 screenshot proof. | Use when layout, labels, route heading, drawer state, and screenshot reference agree within the no-pixel-diff proof level. |
| `intentional-delta` | The current product differs by a deliberate M007 decision while preserving user-facing parity intent. | Use for neutral naming, safer disabled controls, fixture-only labels, or known AppShell implementation boundaries. |
| `deferred` | The surface is represented for screenshot continuity, but live behavior or final data proof belongs to a later owner. | Use for live Kodi install proof, package-installed runtime proof, or behavior explicitly assigned to S08. |
| `needs-follow-up` | The screenshot exposes a visual or behavioral gap that must be filed or resolved before the milestone is closed. | Use when the AppShell screenshot fails the route/state expectation without a documented deferral. |

Current classified deltas:

| State | Category | Explanation |
| --- | --- | --- |
| Music home | `match` | Primary music route renders deterministic music library content inside the neutral shell. |
| Music submenu | `match` | Primary rail hover/focus submenu exposes music navigation anchors for screenshot parity. |
| Movies | `match` | Current router uses the tracked `/movies` primary route while package verification covers mounted aliases. |
| TV shows | `match` | Current router uses the tracked `/tvshows` primary route while package verification covers mounted aliases. |
| Browser files | `deferred` | S07 proves the route visual shell and fixture files panel; live source browsing remains S08-owned. |
| Add-ons list | `match` | Add-ons list renders deterministic safe fixture data and the neutral card treatment. |
| Add-on detail | `intentional-delta` | Detail controls are safely fixture-backed; execute/deep add-on behavior remains outside S07. |
| Local playlists | `needs-follow-up` | The local playlist state is visible and deterministic, but final saved/local queue behavior remains a product follow-up. |
| Settings Kodi | `intentional-delta` | Navigation maps Kodi settings active state to KODI SETTINGS / Add-ons without a standalone Kodi submenu label. |
| Help overview | `match` | Static Help overview gives a deterministic about/help surface for parity evidence. |
| Drawer expanded menu | `intentional-delta` | Drawer menu is intentionally safe/disabled where persistence or Kodi commands are deferred. |
| Drawer collapsed | `match` | Collapsed drawer proof relies on data and ARIA state because the visible drawer label is intentionally hidden. |

Modern card styling is accepted as an intentional visual modernization within this proof level. Deferred add-on execute, deep settings, PVR, icon-browser, Lab edges, package-installed runtime behavior, and live Kodi install behavior remain outside S07 and must not be inferred from deterministic screenshots.

## Command and Browser Diagnostics

Command gates for this contract:

```text
npm run test -- src/lib/app-shell/appNavigation.test.ts src/lib/app-pages/HelpPage.test.ts src/lib/testing/m007VisualProofFixtures.test.ts src/main.test.ts scripts/verify-m007-visual-proof-doc.test.ts
npm run typecheck
npm run build
npm run verify:kodi-package
```

Browser gates run during T04:

- every route/state in the route/state matrix was opened through a managed local dev server.
- route-specific visible headings and stable selectors were asserted before taking each screenshot.
- drawer ARIA/data attributes were asserted for expanded-menu and collapsed rows.
- browser console errors and failed network requests were checked after every route/action.
- visible DOM redaction scan ran after every route/action.
- sanitized results are recorded without raw diagnostic payloads.

The verifier `scripts/verify-m007-visual-proof-doc.test.ts` enforces required proof sections, route/state rows, reference screenshot paths, current screenshot paths, current screenshot file existence, allowed delta categories, S08 ownership wording, pixel-diff non-blocking wording, and forbidden sensitive/path categories.

## Evidence Log

| Check | Status | Evidence owner | Notes |
| --- | --- | --- | --- |
| Proof document contract | Pass | T04 | `npm run test -- scripts/verify-m007-visual-proof-doc.test.ts` is part of the targeted test gate. |
| Screenshot README contract | Pass | T04 | README lists captured filenames and capture/redaction expectations. |
| Current screenshots captured | Pass | T04 | All 12 required current screenshots exist under `docs/m007-visual-parity-screenshots/`. |
| Browser route assertions | Pass | T04 | Each screenshot was captured only after shell, stage, route anchors, diagnostics, and redaction checks passed. |
| Music home | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-music-home.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Music submenu | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-music-submenu.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Movies | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-movies.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| TV shows | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-tvshows.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Browser files | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-browser-files.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Add-ons list | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-addons-list.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Add-on detail | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-addon-detail.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Local playlists | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-playlists-local.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Settings Kodi | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-settings-kodi.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Help overview | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-help-overview.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Drawer expanded menu | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-drawer-expanded-menu.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Drawer collapsed | Pass | Browser route capture | `docs/m007-visual-parity-screenshots/current-drawer-collapsed.png` captured after selectors, route anchors, diagnostics, and redaction category scan passed. |
| Package verifier | Pass | T04/S08 | `npm run verify:kodi-package` passed; package-installed live Kodi proof is S08-owned. |
| Live Kodi install proof | Deferred | S08 | S08 owns live Kodi install proof. S07 must not mark it complete. |

## S08 Live Kodi Boundary

S07 is the screenshot-referenced visual parity proof for deterministic AppShell state. S08 owns live Kodi install proof, package-installed runtime behavior, and any evidence that requires a real Kodi instance. If live Kodi is unavailable during S07, the S07 visual proof can still pass when the document contract, screenshots, browser diagnostics, redaction scan, and package verifier pass.

Do not weaken S07 by treating missing S08 live proof as an S07 failure, and do not overclaim M007 as having completed live Kodi install proof from deterministic screenshots alone.
