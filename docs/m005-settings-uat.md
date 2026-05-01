# M005 Settings UAT Runbook

Date: 2026-05-01
Milestone: M005
Slice: S01

## Scope

This runbook is the tracked UAT surface for the first M005 settings route. It proves the real app entrypoint can render Kodi-shaped settings data through deterministic fixtures without requiring a live Kodi instance.

The proof covers:

- the direct `/settings` route
- the explicit fixture gate `?m005-browser-proof=1`
- safe route parsing for unknown settings subpaths
- visible settings sections, categories, editable controls, read-only unsupported settings, write diagnostics, rollback copy, and refresh-after-write copy
- visible DOM and fixture redaction boundaries

This runbook intentionally avoids local planning artifacts and live Kodi assumptions. It is safe to run in CI or a local dev server with no Kodi environment configured.

## CI-Safe Verification Commands

Run these commands from the repository root. They do not require a live Kodi instance.

```text
npm test -- src/lib/app/appRouter.test.ts src/lib/kodi/methods.test.ts src/lib/stores/settingsStore.test.ts src/lib/components/SettingsPanel.test.ts src/lib/testing/m005BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
test -s docs/m005-settings-uat.md
npm run verify
```

The first command is the slice-level targeted test set. The final command is the release gate for lint, typecheck, full tests, build, and no-Tailwind verification.

## Deterministic Browser Proof

Start the Vite dev server with the managed background-process tool from the repository root:

```text
npm run dev -- --host 127.0.0.1
```

Use the ready port reported by the tool. After verification, stop the managed process; do not leave the dev server running.

### Default and Disabled Fixture Gating

Open `/settings` with no M005 proof flag, then open `/settings?m005-browser-proof=0`.

Expected result:

- the Kodi Settings route renders safely
- distinctive M005 fixture labels are absent
- the route does not show fixture write diagnostics
- no console errors are recorded
- no failed network requests are recorded

Distinctive fixture labels include the autoplay, seek-step, HDR tone-mapping, pending-write, saved-write, rejected-write, media-source, and web-credentials labels used by the M005 fixture contract.

### Direct Settings Fixture Route

Open `/settings?m005-browser-proof=1`.

Expected visible state:

- `Kodi Settings`
- section navigation for `Player` and `Services`
- category navigation for `Videos` and `Interface`
- editable boolean, integer, number, string, and enum controls
- pending, saved, and rejected write proof rows
- safe write-error copy
- rollback copy showing the previous safe value
- refresh-after-write copy for the pending write proof
- write-count copy showing four attempted writes, two successes, and one failure
- unsupported path/custom settings rendered read-only with safe redacted values
- no loading-only copy for the populated fixture route

Expected behavior:

- fixture dispatches are inert and must not contact Kodi
- changing controls may update browser-local form state, but it must not make live network calls or browser-storage reads
- unsupported settings remain read-only

### Unsafe Settings Subpath

Open an intentionally unsafe settings subpath with the M005 proof flag and arbitrary query values. Use a path that contains credential-like, auth-like, storage-like, and sentinel-like categories, but do not copy real secrets into the URL.

Expected result:

- the app renders `Settings route not found`
- the shown path label is redacted to safe placeholder segments
- fixture settings data is not attached to the unknown route
- no raw unsafe path or query category appears in visible text
- no console errors are recorded
- no failed network requests are recorded

## Redaction Expectations

After default navigation, disabled fixture navigation, the direct fixture route, and the unsafe subpath route, scan the full visible DOM. The scan must reject category-level leaks for:

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

| Check                     | Expected evidence                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted M005 slice tests | Targeted command exits 0.                                                                                                                                   |
| UAT document exists       | `docs/m005-settings-uat.md` is tracked under `docs/` and is non-empty.                                                                                      |
| Full verification         | `npm run verify` exits 0.                                                                                                                                   |
| Default fixture absence   | `/settings` and disabled fixture mode do not show distinctive fixture labels.                                                                               |
| Direct fixture route      | `/settings?m005-browser-proof=1` shows settings labels, write diagnostics, rollback, refresh-after-write, write counts, and read-only unsupported settings. |
| Unsafe subpath route      | Unknown settings route redacts the path and does not attach fixture settings data.                                                                          |
| Browser diagnostics       | Console error and failed-network buffers are clean after each browser route.                                                                                |
| Visible DOM redaction     | Redaction scan passes all category checks.                                                                                                                  |

## Optional Live Kodi Checks

Live Kodi validation is out of scope for S01. If a later milestone adds live settings UAT, it must be opt-in, use a trusted test Kodi instance, and document restoration for every mutating setting. Do not run mutating settings checks against a personal or production Kodi profile.
