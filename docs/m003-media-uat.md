# M003 Media UAT Runbook

Date: 2026-05-01
Milestone: M003
Slice: S08

## Scope

This runbook is the tracked UAT surface for M003 final validation of Music Library, Browse Music, Media Search, Media Files, and Media Playlists. It separates deterministic no-live-Kodi proof from optional live Kodi checks so CI remains safe and repeatable.

M003/S08 proves these assembled surfaces with fixtures, tests, browser diagnostics, and read-only smoke probes:

- artists
- albums
- songs
- genres
- recently added songs
- recently played songs
- most-played songs
- media search
- music file sources and directory listing shape
- smart playlist root listing shape

## CI-Safe Verification Commands

Run these commands from the repository root. They do not require a live Kodi instance and are safe for CI.

```text
test -s docs/m003-media-uat.md
test -s docs/m003-browser-proof.md
npm run test -- src/lib/testing/m003BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts scripts/smoke-m003-media.test.ts
npm run smoke:kodi
npm run typecheck
npm run build
npm run verify
```

The full S08 final verification gate includes targeted fixture/entrypoint/App tests, no-env smoke, typecheck, build, full verify, and browser assertions against both default and guarded fixture routes. Keep literal secret examples out of tracked docs so documentation can be inspected safely.

## No-Live Smoke Expectations

With no Kodi environment configured, `npm run smoke:kodi` must exit successfully while reporting skipped live probes. For the M003 media smoke specifically, the expected behavior is:

- exit code `0`
- message says the M003 media smoke was skipped because a Kodi endpoint was not configured
- message lists optional variable names only
- no live network call is attempted
- no play, queue, library mutation, or playlist mutation method is called

The no-live smoke result is a CI-safe readiness signal, not proof that a physical Kodi library is reachable.

## Optional Live Kodi Environment Variables

Live Kodi validation is opt-in. Configure variables only in a local shell or CI secret store that is intentionally running against a test Kodi instance. Do not write secret values into docs, commits, screenshots, logs, or issue comments.

Supported variable names:

- `KODI_HTTP_URL` — optional full JSON-RPC endpoint URL without embedded credentials.
- `KODI_HOST` — optional host name when not using `KODI_HTTP_URL`.
- `KODI_PORT` — optional HTTP port.
- `KODI_USE_TLS` — optional boolean for HTTPS when using split host variables.
- `KODI_PATH` — optional JSON-RPC path.
- `KODI_USERNAME` — optional username.
- `KODI_PASSWORD` — optional password.
- `KODI_TIMEOUT_MS` — optional positive timeout in milliseconds.

Use either `KODI_HTTP_URL` or `KODI_HOST`/`KODI_PORT`, not both. Keep credentials in the dedicated username/password variables; do not embed credentials in URLs.

## Optional Read-Only Media Smoke Interpretation

When live Kodi variables are present, `npm run smoke:kodi:m003-media` performs bounded read-only JSON-RPC probes:

- `JSONRPC.Ping`
- `AudioLibrary.GetArtists`
- `AudioLibrary.GetAlbums`
- `AudioLibrary.GetSongs` for the main song list
- `AudioLibrary.GetSongs` for recently added songs
- `AudioLibrary.GetSongs` for recently played songs
- `AudioLibrary.GetSongs` for most-played songs
- `AudioLibrary.GetGenres`
- `Files.GetSources` for music
- `Files.GetDirectory` for the smart playlist root

A passing live smoke prints method-level summaries with returned counts and total counts. It intentionally does not print raw media paths, raw response bodies, prepared stream URLs, or secret values.

Failure classes to interpret:

- `invalid-env` — local configuration is malformed or mutually exclusive.
- `auth` — Kodi rejected the request with an authorization status.
- `http` — Kodi returned another non-success HTTP status.
- `network` — the endpoint was unreachable.
- `timeout` — the configured timeout elapsed.
- `malformed-response` — Kodi returned invalid JSON or an unexpected JSON-RPC shape.
- `json-rpc-error` — Kodi returned a JSON-RPC error code for a probed method.

All failure output must remain method-level and endpoint-level only. Do not paste raw Kodi response bodies into validation notes.

## Optional Manual Live Browser Checks

Use the deterministic browser proof in `docs/m003-browser-proof.md` as the required no-live baseline. Manual live browser checks are optional and should be run only against a Kodi instance that is safe to inspect.

Manual check areas:

1. Music Library
   - Confirm artists, albums, songs, and genres render from the configured Kodi library.
   - Confirm Recently Added, Recently Played, and Most Played sections render bounded lists or understandable empty states.
   - Confirm date-added, last-played, and playcount metadata is readable when Kodi provides it.
   - Confirm empty-library states remain understandable when Kodi returns no items.
2. Browse Music
   - Open artist, album, and genre browse actions.
   - Confirm status copy or aria-live feedback changes after each browse action.
3. Media Search
   - Search for a known artist, album, song, or genre.
   - Confirm results update without browser console errors or failed JSON-RPC requests.
4. Media Files
   - Open a music source and one directory level if available.
   - Confirm unsupported files are visible as non-actionable when appropriate.
5. Media Playlists
   - Open the smart playlist root when available.
   - Confirm unsupported playlist formats remain visible but non-actionable.

Do not use manual live checks to mutate a real library. S08 smoke and UAT are read-only unless a future milestone adds an explicit write smoke with separate safeguards.

## Deterministic Browser Proof

`docs/m003-browser-proof.md` records the required browser-level evidence for M003/S08. It covers:

- default no-live-Kodi route
- guarded fixture route enabled only in development/test mode
- production/default fixture absence for distinctive proof labels
- Music Library populated fixture labels
- Recent & Top Music fixture labels and metadata
- Browse Music artist/album/genre callbacks
- Media Search fixture query and clear behavior
- Media Files source, folder, breadcrumb, play, and queue callbacks
- Media Playlists smart playlist open, breadcrumb, play, and queue callbacks
- unsupported file and playlist disabled states
- console and network diagnostics
- visible text redaction scan categories

The browser proof is deterministic and does not require a live Kodi endpoint.

## Redaction Expectations

Validation artifacts, terminal output, screenshots, issue comments, and milestone summaries must not include:

- raw Kodi file paths
- local, network, or special media path schemes
- URLs containing credentials
- authorization header names or values
- raw JSON-RPC response bodies
- password-like query strings or examples
- browser storage internals
- prepared stream URLs
- sentinel secret labels from tests

Prefer category-level statements such as "redaction scan passed for path, credential, auth-header, storage, raw-body, and secret-token categories" rather than spelling sensitive examples.

## R015 Reconciliation Note

M003/S08 closes the previously documented recent/top browse validation gap for R015 at the CI-safe proof level. The implemented and proven surfaces now cover artists, albums, songs, genres, recently added songs, recently played songs, most-played songs, search, files, and playlists through deterministic browser proof, tests, and optional read-only smoke guidance.

Optional live Kodi validation remains useful before final release signoff, but it is no longer required to prove that the app entrypoint and fixture seam expose the recent/top Music Library states safely.

## Final Validation Checklist

- CI-safe commands above pass without live Kodi credentials.
- `npm run smoke:kodi` succeeds in no-env mode with skip guidance.
- Optional live smoke, if run, remains read-only and reports only safe method-level summaries.
- Manual live browser checks, if run, do not mutate Kodi state.
- `docs/m003-browser-proof.md` remains present and records deterministic browser assertions for default and fixture routes.
- This runbook and browser proof remain free of raw path, credential, auth-header, raw-body, browser-storage, and sentinel-secret examples.
- R015 recent/top Music Library evidence is represented by S08 tests, fixtures, docs, and browser proof.
