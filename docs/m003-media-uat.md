# M003 Media UAT Runbook

Date: 2026-05-01
Milestone: M003
Slice: S07

## Scope

This runbook is the tracked UAT surface for M003 final validation of Music Library, Browse Music, Media Search, Media Files, and Media Playlists. It separates deterministic no-live-Kodi proof from optional live Kodi checks so CI remains safe and repeatable.

M003/S07 proves these assembled surfaces with fixtures and read-only smoke probes:

- artists
- albums
- songs
- genres
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

The full S07 final verification gate also includes a redaction grep against this runbook and the browser proof before running the targeted tests, smoke command, typecheck, build, and full verify. Keep the literal forbidden examples out of tracked docs so that gate can inspect the artifacts safely.

## No-Live Smoke Expectations

With no Kodi environment configured, `npm run smoke:kodi` must exit successfully while reporting skipped live probes. For the M003 media smoke specifically, the expected behavior is:

- exit code `0`
- message says the M003 media smoke was skipped because a Kodi endpoint was not configured
- message lists optional variable names only
- no live network call is attempted
- no play, queue, or library mutation method is called

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

Use either `KODI_HTTP_URL` or `KODI_HOST`/`KODI_PORT`, not both. Keep credentials in `KODI_USERNAME` and `KODI_PASSWORD`; do not embed credentials in URLs.

## Optional Read-Only Media Smoke Interpretation

When live Kodi variables are present, `npm run smoke:kodi:m003-media` performs bounded read-only JSON-RPC probes:

- `JSONRPC.Ping`
- `AudioLibrary.GetArtists`
- `AudioLibrary.GetAlbums`
- `AudioLibrary.GetSongs`
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

Do not use manual live checks to mutate a real library. S07 smoke and UAT are read-only unless a future milestone adds an explicit write smoke with separate safeguards.

## Deterministic Browser Proof

`docs/m003-browser-proof.md` records the required browser-level evidence for M003/S07. It covers:

- default no-live-Kodi route
- guarded fixture route enabled only in development/test mode
- Music Library populated fixture labels
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

R015 is only partially validated by M003/S01-S07. The implemented and proven surfaces cover artists, albums, songs, genres, and search through deterministic browser proof, tests, and optional read-only smoke guidance.

Recently added, recently played, and most-played browse surfaces are not implemented by S01-S07. Before marking R015 or the full milestone success criteria as fully validated, those recent/top-music surfaces must either be remediated in a later slice or formally re-scoped with explicit requirement validation notes.

## Final Validation Checklist

- CI-safe commands above pass without live Kodi credentials.
- `npm run smoke:kodi` succeeds in no-env mode with skip guidance.
- Optional live smoke, if run, remains read-only and reports only safe method-level summaries.
- Manual live browser checks, if run, do not mutate Kodi state.
- `docs/m003-browser-proof.md` remains present and records deterministic browser assertions.
- This runbook and browser proof pass redaction grep checks.
- R015 is not claimed fully validated until the recent/top-music gap is remediated or formally re-scoped.
