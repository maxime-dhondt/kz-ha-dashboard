# Changelog

## Unreleased

- Dev preview: simulated Sections view (`?view=sections` / `?view=sections-native`) reproducing HA's
  column count, 12-column section grid, 56px rows and top bar/drawer (`dev/sections-sim.ts`).
- `glass-layout-card` is now full-width in Sections (`columns: full`, `rows: auto`);
  `examples/sections-view.yaml` hosts it (mockup look), the native-card layout moved to
  `examples/sections-view-native.yaml`.

## 0.2.1

- Sections view: cards now default to a full section column (12/12), header and modes to the full
  view width; `examples/sections-view.yaml` rebuilt as a 4-column layout closer to the mockup.

## 0.2.0

- Visual editors for list options (rooms, modes, items, sidebar items): no YAML needed.
- Per-card `icon`, `color`, `tap_action`, `hold_action` (native action editor).
- Cards can be used directly in a Sections view (`getGridOptions` with minimum sizes);
  new `examples/sections-view.yaml`.

## 0.1.0 — unreleased

- Initial release: layout, sidebar, header, modes, climate, lights, camera, security, energy, media
  and quick-info cards.
- Responsive layout (desktop / tablet rail / phone bottom bar), light & dark, EN + FR.
- Visual editors, local preview with mock Home Assistant, unit tests, CI and release workflows.
