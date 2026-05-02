# M005 Kodi package UAT

This runbook is for release operators who need to prove the Chorus3 Kodi webinterface package. The automated proof does not require a live Kodi instance. Live install checks are optional and should be run only against a Kodi instance chosen by the operator.

## Automated no-live verification

Run the no-live verification from the repository root:

```sh
npm run verify
```

For package-only iteration, run the package steps directly:

```sh
npm run package:kodi
npm run verify:kodi-package
```

Expected automated evidence:

- The package verifier reports manifest, HTML asset, archive root, forbidden-content, `/now-playing`, route, and documentation checks.
- The commands exit successfully without contacting a Kodi host.
- Failures name the package file or path and the failed phase.
- Live Kodi UAT may be skipped without weakening this automated proof.

## Artifact locations

`npm run package:kodi` writes the installable zip to:

```text
dist/kodi/webinterface.chorus3-<version>.zip
```

The staging directory is under `dist/kodi/webinterface.chorus3/`. It is generated output and should be recreated by the package command rather than edited by hand.

## Zip structure expectations

The zip should contain one root directory named `webinterface.chorus3/`. At minimum, expect:

- `webinterface.chorus3/addon.xml`
- `webinterface.chorus3/index.html`
- `webinterface.chorus3/assets/` with JavaScript and CSS assets
- `webinterface.chorus3/now-playing/index.html`

The archive must not include source files, tests, planning artifacts, browser state, environment files, package-manager lockfiles, or raw secret-bearing files.

## Optional live install from zip

Live Kodi install is an operator UAT path, not a CI requirement.

1. Complete the automated proof above first.
2. In Kodi, install the zip from `dist/kodi/webinterface.chorus3-<version>.zip` using the normal add-on install-from-zip flow.
3. Select Chorus3 as the active webinterface if Kodi does not do so automatically.
4. Configure any Kodi host credentials through Kodi or the saved host configuration inside Chorus3. Do not place credentials in URLs, query strings, screenshots, logs, or shared evidence.
5. If install fails or Kodi does not load the interface, uninstall or disable the add-on, reinstall the same zip once, and keep the automated command output plus Kodi UI symptoms as evidence.

If the live Kodi instance is unavailable or the session times out, record the live UAT as skipped. The automated no-live verification remains the required release proof.

## Access paths to smoke

Use placeholder hostnames in notes and evidence, for example `http://kodi-device.local:8080`. Do not add URL user info, credential query parameters, or secret headers to examples or evidence.

Smoke these paths after install:

- Package root: `http://kodi-device.local:8080/addons/webinterface.chorus3/`
- Default webinterface root, when Chorus3 is selected as the active webinterface: `http://kodi-device.local:8080/`
- Dashboard: the initial app shell loads without asset 404s.
- Settings: navigate to Settings and confirm the saved-host surfaces are usable without exposing raw credentials.
- Add-ons: navigate to Add-ons and confirm the route is not confused with the package root.
- Lab: navigate to Lab and confirm the route renders from the packaged app shell.
- Packaged Now Playing: open `/addons/webinterface.chorus3/now-playing` and confirm it renders the Now Playing embed or safe setup guidance.

For optional iframe or live saved-host checks, follow `docs/m005-now-playing-uat.md`. The packaged `/now-playing` route must rely on saved host configuration. Its URL may include only non-secret presentation parameters such as `theme` and `locale`.

## Rollback and uninstall guidance

If live UAT reveals a problem:

1. Disable Chorus3 as the active webinterface or switch Kodi back to the previous webinterface.
2. Uninstall the Chorus3 webinterface add-on from Kodi.
3. Clear only operator-approved local test data. Do not delete unrelated Kodi configuration while collecting evidence.
4. Re-run `npm run package:kodi` and `npm run verify:kodi-package` before trying a rebuilt zip.
5. Record whether rollback restored the previous webinterface.

## Evidence checklist

- [ ] `npm run verify` passed for the candidate revision.
- [ ] `npm run package:kodi` produced `dist/kodi/webinterface.chorus3-<version>.zip`.
- [ ] `npm run verify:kodi-package` passed against that artifact.
- [ ] Zip contents are rooted under `webinterface.chorus3/` and include `addon.xml`, `index.html`, assets, and `now-playing/index.html`.
- [ ] Optional live install was either skipped with a reason or completed with install-from-zip evidence.
- [ ] Package root and default webinterface access paths were smoked when live UAT ran.
- [ ] Dashboard, Settings, Add-ons, Lab, and packaged `/now-playing` were smoked when live UAT ran.
- [ ] Evidence contains no credentials, secret headers, raw endpoint snapshots, or credential-bearing URLs.
