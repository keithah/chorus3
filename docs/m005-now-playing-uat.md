# M005 Now Playing embed UAT

This document captures deterministic, no-live-Kodi proof for the standalone `/now-playing` embed route. The route is intended to be safe for iframe packaging work in S06/S07 and must never require credentials in the URL.

## Safety rules

- Configure saved Kodi hosts through the main Chorus app before using the embed route with live data.
- Do not place usernames, passwords, bearer tokens, authorization headers, or endpoint credentials in the embed URL.
- Credential-like URL data is rejected by the route and is surfaced only as safe guidance; raw query values are not rendered.
- UAT evidence must not include raw endpoint URLs with embedded credentials, browser storage key names, raw config snapshots, raw Kodi error bodies, or raw media file paths.

## Deterministic fixture proof

Run these checks against the Vite dev server. They use the M005 browser-proof fixture flag and do not contact Kodi.

### Active Now Playing fixture

Open:

```text
/now-playing?m005-browser-proof=1&theme=light&locale=de
```

Expected evidence:

- German localized embed shell copy is visible.
- The deterministic fixture media title `Aurora Signal` is visible.
- Saved-host/status copy is visible using the safe fixture host label.
- The document root has `data-theme="light"`.
- There are no console errors and no failed network requests.
- A DOM text scan does not include forbidden URL schemes, credential words/tokens, browser storage names, sentinel-secret markers, raw media paths, or test-only raw payload markers.

### Setup guidance fixture

Open:

```text
/now-playing?m005-browser-proof=1&embed-state=setup&locale=de
```

Expected evidence:

- German localized setup guidance is visible.
- The route tells users to configure a saved host through the main app flow.
- No media controls depend on a live Kodi host.
- There are no console errors, no failed network requests, and no forbidden DOM text.

### English and dark-theme smoke check

Open:

```text
/now-playing?m005-browser-proof=1&theme=dark&locale=en
```

Expected evidence:

- English localized embed shell copy is visible.
- The deterministic fixture media title is visible.
- The document root has `data-theme="dark"`.
- There are no console errors, no failed network requests, and no forbidden DOM text.

### Credential-rejection fixture

Use the automated browser proof to navigate to a test-only URL containing credential-like query keys and sentinel values. Do not publish or reuse real credentials in this URL.

Expected evidence:

- A localized credential-rejection guidance message is visible.
- The page does not reflect the provided query values.
- A DOM scan rejects every M005 forbidden token plus common credential-query markers.
- There are no console errors and no failed network requests.

## Optional live saved-host iframe UAT

After a host has been configured through the main app, embed the standalone route without credential query parameters:

```html
<iframe title="Chorus Now Playing" src="/now-playing"></iframe>
```

Expected evidence:

- The iframe renders the current Now Playing state or safe setup guidance.
- Refresh/control status continues to use the existing Now Playing panel status surfaces.
- The iframe URL contains only non-secret presentation parameters such as `theme` or `locale` when needed.
- No live credentials, raw host snapshots, raw endpoint URLs, raw Kodi error bodies, or raw media paths appear in the visible DOM.

## Browser proof checklist for S06/S07

- [ ] Active fixture route proves localized copy, fixture media, saved-host/status copy, light theme, clean console/network, and no forbidden DOM text.
- [ ] Setup fixture route proves localized setup guidance, clean console/network, and no forbidden DOM text.
- [ ] Credential-rejection route proves safe rejection guidance without reflecting raw values.
- [ ] Optional iframe UAT uses saved app configuration only and never URL credentials.
