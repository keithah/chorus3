# M005 Add-ons UAT Runbook

Date: 2026-05-01
Milestone: M005
Slice: S02

## Scope

This runbook is the tracked UAT surface for the M005 add-ons route. It proves the real app entrypoint can render installed Kodi add-on list/detail data through deterministic fixtures without requiring a live Kodi instance.

The proof covers:

- the direct `/addons` route
- the direct `/addons/plugin.video.safe-demo` detail route
- the explicit fixture gate `?m005-browser-proof=1`
- safe route parsing for unknown or unsafe add-on subpaths
- visible installed add-ons, search/group controls, detail metadata, confirmation controls, rollback/write diagnostics, and refresh-after-write copy
- visible DOM and fixture redaction boundaries

This runbook intentionally avoids local planning artifacts and live Kodi assumptions. It is safe to run in CI or a local dev server with no Kodi environment configured.

## CI-Safe Verification Commands

Run these commands from the repository root. They do not require a live Kodi instance.

```text
npm test -- src/lib/testing/m005BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
test -s docs/m005-addons-uat.md
npm run verify
```

The first command is the targeted add-ons app/entrypoint/fixture test set. The final command is the release gate for lint, typecheck, full tests, build, and no-Tailwind verification.

## Deterministic Browser Proof

Start the Vite dev server with the managed background-process tool from the repository root:

```text
npm run dev -- --host 127.0.0.1
```

Use the ready port reported by the tool. After verification, stop the managed process; do not leave the dev server running.

### Default and Disabled Fixture Gating

Open `/addons` with no M005 proof flag, then open `/addons?m005-browser-proof=0`.

Expected result:

- the Kodi Add-ons route renders safely
- distinctive M005 fixture add-on labels are absent
- the route does not show fixture write diagnostics
- no console errors are recorded
- no failed network requests are recorded

Distinctive fixture labels include `Safe Video Demo`, `Safe Helper Module`, `Safe Radio`, and the fixture write diagnostic text.

### Direct Add-ons Fixture Route

Open `/addons?m005-browser-proof=1`.

Expected visible state:

- `Kodi Add-ons`
- `Add-ons loaded.`
- `Safe Video Demo`, `Safe Helper Module`, and `Safe Radio`
- type grouping labels for the installed fixture add-ons
- enabled, disabled, dependency, extra-field, and broken-state badges
- search and group controls with accessible labels
- safe detail links such as `/addons/plugin.video.safe-demo`

Expected behavior:

- fixture dispatches are inert and must not contact Kodi
- changing search or grouping controls must not make live network calls or browser-storage reads
- fixture data appears only on the direct add-ons fixture route

### Direct Add-on Detail Fixture Route

Open `/addons/plugin.video.safe-demo?m005-browser-proof=1`.

Expected visible state:

- `Safe Video Demo`
- `Add-on detail loaded.`
- `Add-on write failed.`
- `fixture.addon-write-rejected`
- safe rollback copy showing rollback to enabled
- pending-toggle copy for the safe demo add-on
- last-write copy for the safe radio add-on
- refresh-after-write warning copy
- write-count copy showing three attempted writes, one success, and one failure
- `Enable add-on`

Expected confirm/cancel behavior:

1. Click `Enable add-on`.
2. Confirm that `Confirm enable` and `Cancel enable` controls appear.
3. Click `Cancel enable`; the confirmation affordance should disappear and no network or storage side effects should be recorded.
4. Click `Enable add-on` again, then `Confirm enable`; fixture dispatches remain inert, so no live Kodi mutation occurs.

### Unsafe Add-ons Subpath

Open an intentionally unsafe add-ons subpath with the M005 proof flag and arbitrary query values. Use a path that contains credential-like, auth-like, storage-like, and sentinel-like categories, but do not copy real secrets into the URL.

Expected result:

- the app renders `Add-ons route not found`
- the shown path label is redacted to safe placeholder segments
- fixture add-ons data is not attached to the unknown route
- no raw unsafe path or query category appears in visible text
- no console errors are recorded
- no failed network requests are recorded

## Redaction Expectations

After default navigation, disabled fixture navigation, the direct fixture routes, and the unsafe subpath route, scan the full visible DOM. The scan must reject category-level leaks for:

- local, network, special, and URL schemes
- credential-bearing endpoint shapes
- auth header names or values
- browser storage internals
- raw JSON-RPC request or response bodies
- raw Kodi paths
- sentinel token names or values

Prefer category-level notes such as "redaction scan passed for path, URL, credential, auth-header, browser-storage, raw-body, and sentinel categories". Do not paste literal secrets, endpoint values, storage keys, raw response bodies, or ignored local artifact paths into validation notes.

## Evidence Checklist

Record each check as pass, fail, or not run:

| Check                       | Expected evidence                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted M005 add-ons tests | Targeted command exits 0.                                                                                                                            |
| UAT document exists         | `docs/m005-addons-uat.md` is tracked under `docs/` and is non-empty.                                                                                 |
| Full verification           | `npm run verify` exits 0.                                                                                                                            |
| Default fixture absence     | `/addons` and disabled fixture mode do not show distinctive fixture add-on labels.                                                                   |
| Direct add-ons route        | `/addons?m005-browser-proof=1` shows add-ons list, search/group controls, grouped add-ons, statuses, and safe detail links.                          |
| Direct detail route         | `/addons/plugin.video.safe-demo?m005-browser-proof=1` shows detail metadata, confirm/cancel controls, write diagnostics, rollback, and refresh copy. |
| Unsafe subpath route        | Unknown add-ons route redacts the path and does not attach fixture add-ons data.                                                                     |
| Browser diagnostics         | Console error and failed-network buffers are clean after each browser route.                                                                         |
| Visible DOM redaction       | Redaction scan passes all category checks.                                                                                                           |

## Optional Live Kodi Checks

Live Kodi validation is out of scope for the required S02 proof. If a later check opts into live Kodi validation, use only a trusted disposable test Kodi profile, document the original enabled/disabled state of every add-on touched, and restore that state immediately after the test. Do not run mutating add-on enable/disable checks against a personal or production Kodi profile.
