# M005 Runtime i18n UAT

Date: 2026-05-01  
Milestone: M005  
Slice: S04

## Scope

This UAT proves runtime English/German localization through the real Svelte/Vite app entrypoint without a live Kodi server, host credentials, or user secrets. The proof uses DEV/test-only fixture mode from `src/main.ts` and `src/lib/testing/m005BrowserProofFixtures.ts`.

Fixture routes:

- `/settings?m005-browser-proof=1`
- `/addons?m005-browser-proof=1`
- `/lab/shortcuts`

Optional direct German fixture route:

- `/settings?m005-browser-proof=1&locale=de`

## Preconditions

1. Run from the repository root.
2. Start the app with the managed process tool or an equivalent foreground shell command:

   ```text
   npm run dev -- --host 127.0.0.1
   ```

3. Use the printed local URL, normally `http://127.0.0.1:5173/`.
4. Do not configure a Kodi host. Do not set Kodi credentials. The fixture proof must not require network access to Kodi.

## Settings runtime-switch proof

1. Open `http://127.0.0.1:5173/settings?m005-browser-proof=1`.
2. Assert English fixture text is visible:
   - `Kodi Settings`
   - `Settings loaded.`
   - `Autoplay next item`
   - `Seek step size`
   - `HDR tone mapping`
   - `Pending write proof`
   - `Saved write proof`
   - `Rejected write proof`
   - `Read-only: Kodi path settings are not safe to edit here.`
3. Record the current URL.
4. Use the `Language` control to select `German` / `Deutsch`.
5. Assert the URL is unchanged: the path remains `/settings` and the query remains `?m005-browser-proof=1`.
6. Assert German text appears without a page reload:
   - `Kodi-Einstellungen`
   - `Einstellungen geladen.`
   - `Vorheriger Wert: previous safe value`
   - `4 versucht, 2 erfolgreich, 1 fehlgeschlagen`
   - `Schreibgeschützt: Kodi-path-Einstellungen können hier nicht sicher bearbeitet werden.`
7. Assert translated English-only UI strings are gone from visible text:
   - `Kodi Settings`
   - `Settings loaded.`
   - `Read-only: Kodi path settings are not safe to edit here.`

## Direct German query proof

1. Open `http://127.0.0.1:5173/settings?m005-browser-proof=1&locale=de`.
2. Assert `Kodi-Einstellungen` and `Einstellungen geladen.` are visible.
3. Open `http://127.0.0.1:5173/settings?m005-browser-proof=1&locale=fr`.
4. Assert the invalid locale is ignored and English fallback text is visible (`Kodi Settings`).
5. Assert the invalid locale value is not stored or rendered.

## Add-ons fixture proof

1. Open `http://127.0.0.1:5173/addons?m005-browser-proof=1`.
2. Assert English add-ons fixture text is visible:
   - `Kodi Add-ons`
   - `Add-ons loaded.`
   - `Safe Video Demo`
   - `Safe Helper Module`
   - `Safe Radio`
   - `Broken: Safe fixture dependency missing`
3. Use the `Language` control to switch to German.
4. Assert German shell/list text is visible:
   - `Kodi-Add-ons`
   - `Add-ons geladen.`
5. Assert the safe add-on names remain unchanged because they are fixture data, not UI copy.

## Lab shortcuts proof

1. Open `http://127.0.0.1:5173/lab/shortcuts`.
2. Assert English shortcut text is visible:
   - `Playback shortcuts`
   - `Play / pause`
3. Use the `Language` control to switch to German.
4. Assert German shortcut shell text is visible:
   - `Wiedergabe-Kurzbefehle`
   - `Taste`
   - `Aktion`

## Forbidden-token expectations

After each fixture page and after each locale switch, scan visible page text. The following tokens must not appear:

- `smb://`
- `special://`
- `file://`
- `http://`
- `https://`
- `://admin:`
- `Authorization`
- `Basic`
- `localStorage`
- `sessionStorage`
- `admin:p@ssword`
- `super-secret-password`
- `SENTINEL_SECRET`
- `CHORUS3_SENTINEL_SECRET`
- `raw body`
- `raw payload`

If any forbidden token appears, treat it as a fixture construction, routing, or redaction regression. Do not fix by weakening the assertion; the visible page must stay secret-safe.

## Automated verification

Run the full quality gate:

```text
npm run verify
```

`npm run verify` must include `npm run verify:i18n`, and the i18n verifier must pass with dictionary parity, placeholder parity, non-blank values, and no unapproved hardcoded visible copy.
