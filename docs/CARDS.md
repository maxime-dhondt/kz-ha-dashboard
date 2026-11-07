# Card reference

All cards accept `name` (title override) unless noted. Entities are **always** configured by you.
Type names: `custom:glass-<name>-card`.

## Common options (climate, lights, camera, security, energy, media)

| Option        | Description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| `name`        | Title override                                                                   |
| `icon`        | Header icon, e.g. `mdi:sofa`                                                     |
| `color`       | Accent color: HA color name (`red`, `deep-orange`…) or any CSS color (`#ff8800`) |
| `tap_action`  | Tap on the card body (default: `more-info` of the main entity; lights: none)     |
| `hold_action` | Long press on the card body (default: none)                                      |

Buttons, sliders and tiles inside a card keep their own behavior; only the free area of the card
triggers `tap_action` / `hold_action`. Actions use the native format (see _Actions_ below) and are
edited with the standard action editor.

All list options (rooms, modes, items) are edited **visually** in the card editor:
add, remove and reorder rows, with entity / icon / color / action pickers. The YAML shape is unchanged.

## Using the cards in a Sections view

The cards are made for the native **Sections** view: add them from the card picker, configure them in
the editor, and drag / resize them with the sections editor. They report default and minimum sizes
(`getGridOptions`). Use the view's `background` for the picture. Examples:

- [`examples/sections-view.yaml`](../examples/sections-view.yaml): responsive (4 → 1 columns), one
  full-width section with the sidebar as its first column and one column per card.
- [`examples/sections-view-wide.yaml`](../examples/sections-view-wide.yaml): exact desktop proportions of the
  mockup (36 cells); on phones the cards keep partial widths.

**Width and height of each card are yours to choose**: in the sections editor (card → Layout: columns / rows)
or with `grid_options`. A section column has 12 cells, a section can span up to `max_columns` columns.
Size per card with `grid_options` (12 columns per section column, 56 px rows; `columns: full`,
`rows: auto` are accepted):

```yaml
- type: custom:glass-modes-card
  grid_options: { columns: 30, rows: auto } # of a 4-column section (48 cells)
```

## `glass-background-card`

Invisible card that paints the whole view behind the others (its cell stays empty; keep it in the last section).

| Option       | Description                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background` | `/local/house.jpg`, `https://…`, **`media-source://image_upload/<id>`** (Settings → Media → Image upload), or a full CSS `background` value (`80% center / cover url(…)`) |

`media-source://` identifiers are resolved through Home Assistant (`media_source/resolve_media`), which the
view's own `background` option cannot do.

## `glass-sidebar-card`

| Option              | Type                         | Description                                                             |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `title`, `subtitle` | string                       | Brand text (default title `Home`)                                       |
| `icon`              | string                       | Brand icon (default `mdi:home`)                                         |
| `items` (required)  | list                         | `{ name, icon, navigation_path, short_name?, pin_mobile? }`             |
| `status_entities`   | list                         | Footer shows a warning if one is `unavailable`                          |
| `mobile_max_items`  | number                       | Items in the bottom bar (default 4); `pin_mobile` items win             |
| `position`          | `inline` (default) / `fixed` | `inline`: a normal card, a column of the section; `fixed`: screen edge  |
| `breakpoints`       | `{tablet, mobile}`           | View width (px) for the rail (fixed mode) / the bottom bar (1100 / 700) |

**Inline** (default): the sidebar is a tall card of your Sections view; size it in the sections editor
(`grid_options`, e.g. `{ columns: 12, rows: 14 }`). It shows an icon rail when its cell is narrow and the
bottom bar on phones. **Fixed**: it sticks to the screen edge (240 px panel, 76 px rail, bottom bar) and
shifts the view to make room; its cell stays empty. Combine both with `visibility` conditions as in
`examples/sections-view.yaml` (panel from 900 px, fixed rail / bar below), and with the **kiosk-mode** HACS
plugin to hide Home Assistant's own menu.

## `glass-header-card`

| Option                       | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `weather_entity`             | `weather.*` – temperature, condition, humidity            |
| `outdoor_temperature_entity` | Sensor overriding the weather temperature                 |
| `humidity_entity`            | Sensor overriding the weather humidity                    |
| `person_entity`              | Avatar (default: person linked to the logged-in user)     |
| `show_name`                  | Append the first name to the greeting                     |
| `title`                      | Phone top-bar title (default `Home`)                      |
| `search_action`              | Action of the search button (default: opens HA quick bar) |
| `profile_action`             | Action of the avatar (default: navigate `/profile`)       |

## `glass-modes-card`

| Option         | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| `entity`       | `input_select.*` / `select.*` holding the current mode                     |
| `modes` (req.) | `{ name, subtitle?, icon, color?, option?, entity?, state?, tap_action? }` |

A mode is _active_ when `(mode.entity ?? entity)` has state `mode.state ?? mode.option`.
Tapping selects `option` on the entity, unless `tap_action` is set (e.g. to activate a scene).

```yaml
modes:
  - { name: Night, icon: mdi:weather-night, option: Night }
  - name: Movie
    icon: mdi:movie
    entity: scene.movie
    state: scening # not used for scenes – use tap_action to trigger
    tap_action:
      { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie } }
```

## `glass-climate-card`

| Option           | Default                          | Description                                                   |
| ---------------- | -------------------------------- | ------------------------------------------------------------- |
| `entity` (req.)  |                                  | `climate.*`                                                   |
| `history_entity` |                                  | Sensor for the chart (default: climate `current_temperature`) |
| `hours`          | 12                               | Chart window                                                  |
| `step`           | entity `target_temp_step` or 0.5 | ± step                                                        |
| `show_chart`     | true                             |                                                               |

## `glass-lights-card`

| Option         | Description                                        |
| -------------- | -------------------------------------------------- |
| `rooms` (req.) | `{ name, icon?, entities: [light.x, …] }` per tile |

Tile tap = toggle the room, hold = more-info of its first entity. The counter and master switch
cover all entities of all rooms.

## `glass-camera-card`

| Option             | Default | Description                |
| ------------------ | ------- | -------------------------- |
| `entity` (req.)    |         | `camera.*`                 |
| `refresh_interval` | 10      | Snapshot refresh (seconds) |

The play button switches to the live stream (`ha-camera-stream`).

## `glass-security-card`

| Option          | Default | Description                                                         |
| --------------- | ------- | ------------------------------------------------------------------- |
| `entity` (req.) |         | `alarm_control_panel.*`                                             |
| `door_entities` |         | `binary_sensor`/`lock`/`cover` for "All doors are secure"           |
| `arm_mode`      | `home`  | `home` / `away` / `night`: which arm service the button calls       |
| `code`          |         | Alarm code (stored in the dashboard config); else a prompt is shown |

Doors are "secure" when their state is `closed`, `locked` or `off`.

## `glass-energy-card`

| Option          | Default | Description                       |
| --------------- | ------- | --------------------------------- |
| `entity` (req.) |         | Power sensor (W / kW / MW)        |
| `bars`          | 24      | Bars covering today from midnight |

## `glass-media-card`

| Option          | Description      |
| --------------- | ---------------- |
| `entity` (req.) | `media_player.*` |

## `glass-quick-info-card`

| Option         | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `items` (req.) | `{ entity, name?, icon?, type?: state \| calendar, tap_action? }` |

`calendar` items (or any `calendar.*` entity) show the event title (`message`) and start time.
Other items show the localized state.

## Actions

`tap_action`-style objects follow the native format: `more-info`, `toggle`, `perform-action`
(`perform_action: domain.service`, `data`, `target`), `navigate` (`navigation_path`), `url`
(`url_path`), `none`.
