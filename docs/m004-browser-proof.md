# M004 Browser Proof

Date: 2026-05-01
Milestone: M004
Slice: S07
Task: T02 draft for T03 execution

## Scope

This document defines the deterministic browser proof for the assembled M004 video-library routes. It is written for a future agent running the final S07 browser pass against the real Vite entrypoint.

The proof covers two modes:

- Default mode: open the app without the M004 proof flag and confirm distinctive fixture labels are absent.
- Deterministic proof mode: open each primary video route with the M004 proof flag and confirm the route-specific UI, actions, diagnostics, and redaction boundaries.

The proof uses deterministic fixture data only. It does not require a live Kodi instance, does not prove real media decoding, and does not use prepared stream addresses or raw Kodi responses.

## Server Lifecycle

Start the dev server with the managed background process tool from the repository root:

```text
npm run dev -- --host 127.0.0.1
```

Use the actual ready port reported by the process. The expected local dev entrypoint is the Vite app origin on that port.

After verification, stop the managed process with the same background-process tool. Do not leave a dev server running after the proof.

## Default Route and No-Fixture Gating

Open the default dashboard route without the M004 proof flag.

Expected visible baseline:

- host shell renders normally
- connection/status regions remain understandable without a configured Kodi host
- existing library, player, and route shells show idle or empty states rather than fixture content

Distinctive M004 fixture labels must be absent from the full visible DOM:

- `Neon Harbor`
- `Quiet Signal`
- `Aurora Files`
- `Signal Mirror`
- `Cold Open`
- `Rain City Thrillers.xsp`
- `Quiet Valley Watchlist.xsp`

If a no-flag video route is checked, use the same absence rule. Generic words such as `Movies`, `TV`, `Season`, or `Recent` are not valid fixture-gating assertions because they may appear in default UI copy.

## Primary Route Matrix

Run every route through the real Vite entrypoint with the M004 proof flag. Record the final outcome in the Evidence Log section.

| Route | Proves | Required visible text or actions |
| --- | --- | --- |
| `/video/movies?m004-browser-proof=1` | Movie grid, recent movie sections, recent episode sections, and browse-only video playlists render from safe fixtures. | `Neon Harbor`, `Quiet Signal`, recently added/played movie states, `Signal Mirror`, `Cold Open`, `Rain City Thrillers.xsp`, browse-only playlist copy, disabled play/queue affordances for video playlist entries. |
| `/video/movies/4401?m004-browser-proof=1` | Movie detail route assembles metadata, watched/resume state, versions, and action controls. | `Neon Harbor`, `One night can rewrite a city.`, `Theatrical cut`, `Director commentary cut`, play, resume, queue, stream, and watched-state controls. |
| `/video/movies/4401/stream?m004-browser-proof=1` | Local video stream shell renders a safe deterministic runtime marker without decoding live media. | `Neon Harbor`, paused local runtime state, resume availability, Send-to-Kodi or resume-on-Kodi action, retry or stream action copy where present. |
| `/video/tv?m004-browser-proof=1` | TV grid, recent video sections, and browse-only video playlists render from safe fixtures. | `Aurora Files`, watched/unwatched episode counts, `Signal Mirror`, `Cold Open`, `Rain City Thrillers.xsp`, browse-only playlist copy. |
| `/video/tv/5501?m004-browser-proof=1` | TV show detail route assembles show metadata, season list, artwork state, and watched summary. | `Aurora Files`, `Season 1`, mystery/science-fiction metadata, episode counts, watched/unwatched summary, artwork availability state. |
| `/video/tv/5501/seasons/1?m004-browser-proof=1` | Season detail route assembles episodes, season artwork capability, batch watched writes, partial failure, and retry state. | `Season 1`, `Signal Mirror`, `Cold Open`, unsupported season artwork copy, batch watched/unwatched controls, partial write failure copy, retry success copy. |
| `/video/tv/5501/seasons/1/episodes/6601?m004-browser-proof=1` | Episode detail route assembles metadata, resume state, stream controls, queue/play controls, and watched write controls. | `Signal Mirror`, `Aurora Files`, episode and season numbering, play, resume, queue, stream, and watched-state controls. |

## Expected Route-Specific Behavior

The fixture dispatchers are inert. Route actions should update visible status copy or remain safely no-op without causing live network requests, player mutations, Kodi writes, or browser storage access.

Video playlists in this proof are browse-only. They may expose playlist labels, breadcrumb labels, and entries, but they must not offer working play or queue side effects.

Recent video evidence belongs on the movie grid and TV grid routes. Do not invent separate recent-video routes for proof notes.

## Browser Diagnostics

After default navigation and after each fixture route:

- assert no browser console errors
- assert no failed network requests
- inspect route-specific visible text before treating a route as passed
- clear or scope diagnostic buffers so failures can be attributed to the route that caused them

Vite client connection messages are acceptable only when they are non-error diagnostics from the dev server.

## Visible DOM Redaction Scan

Scan the full visible DOM after default navigation and after every fixture route. The scan must reject category-level leaks for:

- local, network, and special media path schemes
- URL schemes and credential-bearing URL shapes
- credential or userinfo patterns
- auth header names or values
- raw JSON-RPC bodies or response bodies
- browser storage internals
- prepared stream addresses
- sentinel token names or values

Record the result by category. Do not paste literal sensitive examples into this document, terminal notes, screenshots, summaries, or issue comments.

## Evidence Log

T03 should update this section after the real browser run.

| Check | Outcome | Notes |
| --- | --- | --- |
| Server started with managed process | Pending | Record ready port only. |
| Default route fixture absence | Pending | Record distinctive labels absent. |
| Movie grid route | Pending | Record route assertions and diagnostics. |
| Movie detail route | Pending | Record route assertions and diagnostics. |
| Movie stream route | Pending | Record safe local runtime assertions and diagnostics. |
| TV grid route | Pending | Record route assertions and diagnostics. |
| TV show detail route | Pending | Record route assertions and diagnostics. |
| TV season detail route | Pending | Record partial-write/retry and artwork assertions. |
| TV episode detail route | Pending | Record route assertions and diagnostics. |
| Console diagnostics | Pending | Record no errors or exact non-sensitive failure class. |
| Network diagnostics | Pending | Record no failed requests or exact non-sensitive failure class. |
| Visible DOM redaction scan | Pending | Record category-level pass/fail only. |

## Verification Commands

Use these commands and checks for the final proof pass:

```text
npm run test -- scripts/smoke-m004-video.test.ts src/lib/testing/m004BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
env -u KODI_HTTP_URL -u KODI_HOST -u KODI_PORT -u KODI_USERNAME -u KODI_PASSWORD npm run smoke:kodi
npm run typecheck
npm run build
npm run verify
npm run dev -- --host 127.0.0.1
browser assertions and DOM scans against the default route
browser assertions and DOM scans against every primary M004 route in the matrix
```

The browser proof is deterministic and CI-safe. Optional live Kodi validation belongs in the M004 video UAT runbook, not in this proof baseline.
