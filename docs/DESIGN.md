# Design reference

Source mockups: `docs/design/dashboard-desktop.png` and `docs/design/dashboard-responsive.png`
(desktop / tablet / phone). Current implementation preview: `docs/design/preview-*.png`.

## Language

Apple-like "liquid glass": translucent white surfaces over a soft photographic/gradient background,
large rounded corners (≈ 26 px), 1 px light borders, soft blue-tinted shadows, SF-style typography,
tinted circular icon bubbles, iOS switches and sliders. Accent blue `#2f7bff`, success green `#1fb25a`.

## Desktop grid (24 columns)

```
┌ sidebar 240px ┬ header: greeting · weather pill · search · avatar ─────────────┐
│ brand         │ modes  (15 cols: 4 glass chips)                                │
│ nav items     ├────────────────────┬──────────────────┬────────────────────────┤
│ …             │ climate (7)        │ lights (8)       │ front door camera (9)  │
│ footer: status├──────────┬─────────┴───┬──────────────┴─┬──────────────────────┤
│ + date/time   │ security │ energy (7)  │ media (7)      │ quick info (5)       │
│               │ (5)      │             │                │                      │
└───────────────┴──────────┴─────────────┴────────────────┴──────────────────────┘
```

## Tablet (< 1100 px)

Sidebar becomes a 76 px icon rail. Cards span 8/24 (three per row); modes full width;
quick info hidden (`hidden_on: [tablet]`).

## Phone (< 700 px)

Compact top bar (brand + search + avatar), greeting, full-width weather pill, modes as a single panel
(icon over label), then cards stacked full width. Sidebar becomes a sticky bottom bar
(Home · Lights · Security · Energy · More).

## Intentional differences from the mockups

- Icons are Material Design Icons (`mdi:`) in tinted bubbles, not 3D-style illustrations.
- Background photo is not bundled: use `background:` with your own image.
- Chart windows are rolling (last N hours) instead of fixed 6AM–6PM labels.
