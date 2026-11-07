# Changelog

## Unreleased

- **Breaking:** only the native Sections view is supported. Removed `glass-layout-card` and the panel
  example `examples/dashboard.yaml`.
- `glass-sidebar-card` is back and works standalone in Sections: fixed panel / rail / bottom bar sized from
  the view width, `position: inline` to keep it in its cell.
- Dev preview simulates HA's Sections view (`dev/sections-sim.ts`) at desktop / tablet / phone sizes.
- Header and modes use automatic row height; `examples/sections-view.yaml` rebuilt to match the mockups.

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
