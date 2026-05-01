# M004 Video UAT Runbook

Date: 2026-05-01
Milestone: M004
Slice: S08

## Scope

This runbook is the tracked UAT surface for M004 final validation of the video library. It separates deterministic no-live-Kodi proof, S08 requirement-reconciliation evidence, and optional live Kodi checks so CI remains safe and repeatable.

M004/S07 and S08 prove these assembled surfaces with fixtures, tests, browser diagnostics, reconciliation docs, and a read-only smoke probe:

- movie grid and recent movies, including deterministic bounded-count copy for a 25-of-503 large-library policy fixture
- movie detail metadata, versions, play/resume/queue controls, stream entrypoint, and watched-state controls
- local movie stream shell as a safe browser runtime proof
- TV grid and recent episodes
- TV show detail and seasons
- season episodes, artwork capability state, batch watched controls, partial failure, and retry state
- episode detail play/resume/queue/stream controls and watched-state controls
- browse-only video playlists
- no-env Kodi smoke safety and secret-safe diagnostics

## CI-Safe Verification Commands

Run these commands from the repository root. They do not require a live Kodi instance and are safe for CI.

```text
npm run test -- src/lib/testing/m004BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
npm run test -- src/lib/stores/videoLibrary.test.ts src/lib/stores/videoWriteStore.test.ts src/lib/components/VideoRecentPanel.test.ts src/lib/components/VideoSeasonDetailShell.test.ts src/lib/components/VideoMovieDetailShell.test.ts src/App.test.ts src/main.test.ts
test -s docs/m004-browser-proof.md
test -s docs/m004-video-uat.md
npm run test -- scripts/smoke-m004-video.test.ts src/lib/testing/m004BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
env -u KODI_HTTP_URL -u KODI_HOST -u KODI_PORT -u KODI_USERNAME -u KODI_PASSWORD npm run smoke:kodi
npm run typecheck
npm run build
npm run verify
```

The deterministic browser proof in the M004 browser proof document is also CI-safe when run against the local Vite dev server. It uses fixture data and must not require a live Kodi endpoint. S08 adds explicit no-live evidence for the bounded movie-grid count (`2 of 503 movies`), recent-played provider ordering, season artwork unsupported copy, partial season batch retry copy, and movie-version capability copy.

## Requirement Reconciliation Cross-Reference

Use `docs/m004-requirement-reconciliation.md` as the validation-gap map before treating an M004 video requirement as proven. The matrix distinguishes implemented/test-backed behavior from deliberately deferred or optional-live behavior for large-library inspection, movie-version selection, play-from-here expectations, artwork state handling, watched/resume batch policy, and restore-policy checks.

## No-Live Smoke Expectations

With no Kodi environment configured, `npm run smoke:kodi:m004-video` must exit successfully while reporting skipped live probes. Expected behavior:

- exit code `0`
- message says the M004 video smoke was skipped because a Kodi endpoint was not configured
- message lists optional variable names only
- no live network call is attempted
- no play, queue, stream preparation, watched/resume write, artwork refresh, or library mutation method is called

The no-live smoke result is a CI-safe readiness signal. It is not proof that a physical Kodi video library is reachable.

## Optional Live Kodi Environment Variables

Live Kodi validation is opt-in. Configure variables only in a local shell or CI secret store that is intentionally running against a test Kodi instance. Do not write secret values into docs, commits, screenshots, logs, summaries, or issue comments.

Supported variable names:

- `KODI_HTTP_URL` — optional full JSON-RPC endpoint variable without embedded credentials.
- `KODI_HOST` — optional host variable when not using `KODI_HTTP_URL`.
- `KODI_PORT` — optional HTTP port variable.
- `KODI_USE_TLS` — optional boolean for TLS when using split host variables.
- `KODI_PATH` — optional JSON-RPC path variable.
- `KODI_USERNAME` — optional username variable.
- `KODI_PASSWORD` — optional password variable.
- `KODI_TIMEOUT_MS` — optional positive timeout in milliseconds.

Use either the endpoint variable or the split host variables, not both. Keep credentials in the dedicated username/password variables; do not embed credentials in endpoint values.

## Optional Read-Only Video Smoke Interpretation

`npm run smoke:kodi:m004-video` is optional-live and read-only. When live Kodi variables are present, it performs bounded JSON-RPC probes for:

- JSON-RPC ping
- movie listing metadata
- TV show listing metadata
- season listing metadata only when a finite TV show identifier is available
- episode listing metadata
- video playlist root metadata

A passing live smoke prints method-level summaries with returned counts and total counts. It intentionally does not print raw media paths, raw response bodies, prepared stream addresses, or secret values.

Failure classes to interpret:

- `invalid-env` — local configuration is malformed or mutually exclusive.
- `auth` — Kodi rejected the request because the configured credentials or access policy were not accepted.
- `http` — Kodi returned another non-success HTTP status.
- `network` — the endpoint was unreachable.
- `timeout` — the configured timeout elapsed.
- `malformed-response` — Kodi returned invalid JSON or an unexpected JSON-RPC shape.
- `json-rpc-error` — Kodi returned a JSON-RPC error code for a probed method.

All failure output must remain method-level and endpoint-level only. Do not paste raw Kodi response bodies into validation notes.

## Deterministic Browser Proof

The M004 browser proof document records the required browser-level evidence for S07. It covers:

- default no-fixture route gating
- guarded movie grid, movie detail, and movie stream routes
- guarded TV grid, show detail, season detail, and episode detail routes
- recent movie and recent episode evidence on the movie grid and TV grid routes
- browse-only video playlist evidence
- console and network diagnostics
- visible DOM redaction scan categories

The deterministic proof does not require a live Kodi endpoint and does not decode real media. The stream route proves route assembly and safe local runtime shell behavior only.

## Optional Manual Live Browser UAT

Manual live browser checks are optional. Run them only against a Kodi instance that is safe to inspect and, for mutating checks, safe to modify and restore.

### Optional live reconciliation checks

These checks are optional-live and should be recorded as "not run" rather than failed when no safe live Kodi test library is available.

- Large-library inspection is read-only unless it intentionally exercises watched/resume writes; confirm bounded lists or understandable empty states before attempting any mutation.
- Movie-version checks may confirm visible metadata or unsupported/unavailable copy, but must not claim selected-version dispatch unless a future task adds passing implementation and tests.
- Play-from-here checks are out of the deterministic proof baseline unless a future task adds explicit dispatch behavior and tests.
- Artwork checks should confirm visible supported, unsupported, unavailable, pending, success, or error states; live artwork mutation is not required for M004 closeout.
- Watched/resume and season-batch checks are opt-in mutating checks and must use only a restorable test library.
- Restore-policy evidence must include that every changed watched/resume state was restored, or that the mutating check was skipped because restoration was not safe.

### Read-only manual checks

1. Movies
   - Confirm the movie grid renders known library items or a clear empty state.
   - Confirm recent movie sections render bounded lists or understandable empty states.
   - Open a known movie detail page and confirm metadata, artwork availability, versions if present, watched state, and resume state are understandable.
2. TV
   - Confirm the TV grid renders known shows or a clear empty state.
   - Confirm recent episode sections render bounded lists or understandable empty states.
   - Open a known show, season, and episode detail page and confirm metadata, artwork state, watched state, and resume state are understandable.
3. Video playlists
   - Confirm video playlists are browse-only.
   - Confirm playlist entries and breadcrumbs can be inspected without exposing play or queue side effects unless a future milestone explicitly adds those writes.
4. Browser diagnostics
   - Confirm no browser console errors.
   - Confirm no failed app requests.
   - Confirm visible text does not expose path, URL, credential, auth-header, raw-body, browser-storage, prepared-stream, or sentinel-token categories.

### Opt-in mutating checks

The following checks are not CI-safe. They are opt-in, test-device-only, and test-library-only. Before running them, record the initial watched and resume state for each chosen movie, episode, and season. After running them, restore every changed watched/resume state before handing the device back.

- mark a movie watched and unwatched
- change a movie resume position only when the test device can be restored afterward
- mark a single episode watched and unwatched
- change an episode resume position only when the test device can be restored afterward
- mark a season watched and unwatched through batch episode writes
- run a 100+ item batch watched/unwatched check only on a disposable or restorable test library
- force a partial failure and retry flow only when the test setup can safely isolate and restore changed items

Do not run mutating checks against a personal or production Kodi library. If the test library cannot be restored, skip these checks and record them as not run.

## Redaction Expectations

Validation artifacts, terminal output, screenshots, issue comments, and milestone summaries must not include:

- raw Kodi file paths
- local, network, or special media path schemes
- URL schemes or credential-bearing endpoint values
- auth header names or values
- raw JSON-RPC request or response bodies
- password-like query strings or examples
- browser storage internals
- prepared stream addresses
- sentinel token labels or values

Prefer category-level statements such as "redaction scan passed for path, URL, credential, auth-header, raw-body, browser-storage, prepared-stream, and sentinel-token categories" rather than spelling sensitive examples.

## Final Validation Checklist

- CI-safe commands above pass without live Kodi credentials.
- `npm run smoke:kodi:m004-video` succeeds in no-env mode with skip guidance.
- Optional live smoke, if run, remains read-only and reports only safe method-level summaries.
- Deterministic browser proof covers default fixture absence and every primary M004 route.
- Manual live browser checks, if run, record whether they were read-only or mutating.
- Mutating checks, if run, use only a test device and test library, and all changed watched/resume state is restored.
- Video playlists remain documented and tested as browse-only.
- Recent video evidence remains on the movie grid and TV grid routes, not on invented recent routes.
- This runbook and the browser proof remain free of raw path, credential, auth-header, raw-body, browser-storage, prepared-stream, and sentinel-token examples.
