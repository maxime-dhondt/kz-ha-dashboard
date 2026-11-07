# Architecture

## Big picture

```
 Home Assistant frontend
        │  loads dist/glass-home.js (HACS resource, type: module)
        ▼
 src/glass-home.ts ── imports ──► src/cards/*/card.ts
                                      │ each file: defines <glass-xxx-card>, registers it
                                      │ in window.customCards (card picker)
                                      ▼
                            src/shared/* (base class, styles, i18n, charts…)
```

There is **no server component**: everything runs in the browser, reading `hass` (the object HA
passes to every card) and calling services through `hass.callService`.

## Cards

| Tag                     | Role                                             |
| ----------------------- | ------------------------------------------------ |
| `glass-header-card`     | Greeting, clock, weather pill, search, avatar    |
| `glass-modes-card`      | House-mode shortcuts (Home / Night / Away / Eco) |
| `glass-climate-card`    | Temperature, target ± and history sparkline      |
| `glass-lights-card`     | Count, master switch, room tiles                 |
| `glass-camera-card`     | Snapshot, live badge, live stream                |
| `glass-security-card`   | Alarm state, doors summary, arm/disarm           |
| `glass-energy-card`     | Power draw and today's hourly bars               |
| `glass-media-card`      | Now playing, transport, volume                   |
| `glass-quick-info-card` | State list + next calendar event                 |

Every card can be used **standalone** in any Lovelace view; the intended host is the native Sections view.

## Anatomy of a card

```
card.ts  ── class GlassXxxCard extends GlassCard<XxxConfig>
              validateConfig()    throws on invalid config (HA shows the message)
              watchedEntities()   what triggers a re-render
              load()              async data (history) – first hass, config change, interval
              render()            Lit template using shared CSS classes
logic.ts ── pure functions used by render()/load()   → covered by test/
editor.ts ─ defineEditor('glass-xxx-card-editor', () => [ ha-form fields ])
```

`GlassCard` (src/shared/base-card.ts) handles: storing config, the `hass` property, dark-mode flag
(`hass.themes.darkMode`), **skipping renders** when none of `watchedEntities()` changed, and a
refresh timer (`refreshInterval`).

## Common card options

`GlassCard` implements `icon`, `color`, `tap_action` and `hold_action` for every card:

- `color` sets `--glass-accent` on the host (so switches, active tiles… follow it) and the header bubble.
- Pointer events are listened to on the host; presses that cross a `button`, `input`, `[role=button]`…
  (`shared/interaction.ts`) are ignored, so only the free area of the card runs the action.
- Hold is only armed when `hold_action` is configured; the `actionable` attribute drives `cursor: pointer`.

## Editors

`defineEditor(tag, (hass, t) => schema)` renders an `ha-form`. Shared pieces live in `shared/editor.ts`:
`appearanceSection()`, `interactionsSection()`, `listSelector()` (HA `object` selector with `multiple`
and `fields`: add / remove / reorder rows, nested entity / icon / color / action pickers).

## Sections view & responsiveness

Placement is entirely Home Assistant's: each card reports its default / minimum size with
`getGridOptions()` (12 columns per section column, rows of 56 px; `columns: 'full'` and `rows: 'auto'`
are used by header and modes) and the user overrides it with `grid_options`. HA decides how many
section columns fit (320–500 px each, at most `max_columns`), so desktop / tablet / phone layouts are
HA's, not ours. `dev/sections-sim.ts` reproduces those rules for the local preview.

The header and modes cards adapt to _their own_ width with container queries (`@container`), so they
also work standalone.

## Data flow for history charts

`fetchHistory()` → websocket `history/history_during_period` → `bucketize()` (time-weighted resample
of a step series) → `sparkline()` / `barRatios()` → SVG / flex bars. Refresh every 10 min.

## Styling

`shared/styles.ts` exports `tokens` (CSS variables on `:host`) and `glass` (surface, header, buttons).
All visual values derive from `--glass-*` variables so a HA theme or card-mod can restyle everything
(see THEMING.md). Glass effect = translucent surface + `backdrop-filter: blur() saturate()` + 1 px
light border + soft shadow.

## i18n

`localize(hass, key, vars)` picks the dictionary from the user's profile language (`hass.locale.language`),
falls back to English, then to the key. Add a language: create `translations/xx.ts`, register it in
`i18n.ts`, and the parity test tells you which keys are missing.

## Local preview

`dev/` mocks `hass` (states, service calls that mutate states, fake history) and an `ha-icon`
stand-in. `dev/main.ts` renders `examples/sections-view.yaml` in a simulated Sections view at three screen sizes. Nothing in `dev/` is bundled.

## Decisions log

- **Lit + TypeScript + Vite**: same stack as HA's frontend, single-file ES module output.
- **No `custom-card-helpers` dependency**: we declare the few HA types we use; fewer moving parts.
- **Pure `logic.ts` files**: tests run in plain Node, no browser/jsdom needed.
- **`ha-form` editors**: free visual editor for scalar fields; list fields use the YAML object selector.
- **Own tap/hold/navigate implementation** (`actions.ts`): depends only on stable DOM events.
