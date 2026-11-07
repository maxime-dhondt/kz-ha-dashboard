# Publishing & HACS

Home Assistant has no "dashboard marketplace". Dashboards are distributed through **HACS**
(Home Assistant Community Store) as a _Dashboard/Plugin_ repository: HACS installs the card bundle
(`glass-home.js`) and registers it as a Lovelace resource. The dashboard layout itself is a YAML
file the user pastes (`examples/sections-view.yaml`).

## 1. Install as a custom repository (works immediately)

1. HACS → ⋮ → **Custom repositories** → add the GitHub URL, category **Dashboard** (a.k.a. _Plugin_).
2. Install **Glass Home Dashboard**, reload the browser.
3. Create a dashboard and paste `examples/sections-view.yaml` (Raw configuration editor).

## 2. Releasing

HACS installs from **GitHub releases** (it downloads `glass-home.js` from the release assets).

```bash
npm run check
npm version minor            # bumps package.json + creates the git tag vX.Y.Z
git push --follow-tags       # the release workflow builds and attaches dist/glass-home.js
```

`.github/workflows/release.yml` creates the GitHub release and uploads the file.

## 3. Getting into the default HACS store (optional)

Requirements (checked by the `hacs/action` CI job):

- public GitHub repo with **description** and **topics** (`home-assistant`, `hacs`, `lovelace`, …)
- `hacs.json` at the root (present) and a README (present)
- at least one release containing `glass-home.js`
- then open a PR on `hacs/default` adding the repository to the `plugin` list

## 4. Resource URL (manual install, without HACS)

Copy `glass-home.js` to `/config/www/glass-home/` and add the resource
`/local/glass-home/glass-home.js` (type **JavaScript module**) in Settings → Dashboards → Resources.

## Hiding the HA sidebar / header

Cards cannot hide Home Assistant's own chrome. Install the HACS plugin **kiosk-mode** and add
`kiosk_mode: { hide_sidebar: true, hide_header: true }` to the dashboard config; the
`glass-sidebar-card` then provides the navigation.
