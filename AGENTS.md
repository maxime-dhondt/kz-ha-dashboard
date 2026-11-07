# AGENTS.md — guide for AI agents and humans

Glass Home is a set of **Home Assistant Lovelace custom cards** (TypeScript + Lit) that
reproduce an Apple-style "glass" dashboard. It ships as one file, `dist/glass-home.js`,
distributed through HACS (category: Dashboard / `plugin`).

## Commands

| Command          | What it does                                                            |
| ---------------- | ----------------------------------------------------------------------- |
| `npm ci`         | install                                                                 |
| `npm run dev`    | local preview at `/dev/` with a **mock Home Assistant** (3 viewports)   |
| `npm run check`  | typecheck + unit tests + prettier check + build — **run before commit** |
| `npm test`       | unit tests only (vitest, pure logic, no browser)                        |
| `npm run format` | prettier --write                                                        |

Preview URL options: `?lang=fr`, `?dark=1`, `?only=desktop|tablet|phone`.
`examples/dashboard.yaml` is both the user-facing example **and** the preview's source of truth.

## Repository map

```
src/glass-home.ts          bundle entry (imports all cards)
src/cards/<name>/
  card.ts                  the Lit element + its config interface + registerCard()
  logic.ts                 PURE functions (no DOM/Lit) -> unit-testable
  editor.ts                visual editor = a list of ha-form fields
src/cards/index.ts         import list of every card
src/shared/
  base-card.ts             GlassCard base class (config, hass, render filtering, timers)
  styles.ts                design tokens (--glass-*) + shared CSS (.glass, .bubble…)
  templates.ts             cardHead(), missingEntity()
  actions.ts / press.ts    tap / hold / navigate / service calls
  history.ts / charts.ts   history fetch + bucketing, SVG sparkline / bars
  i18n.ts + translations/  en.ts (reference) and fr.ts
  format.ts / entities.ts  locale formatting, entity helpers
  editor.ts                defineEditor() factory
dev/                       local preview only (never shipped): mock hass, ha-icon shim
test/                      vitest unit tests
docs/                      ARCHITECTURE, CARDS (config reference), ADD-A-CARD, THEMING, PUBLISHING
```

Read `docs/ARCHITECTURE.md` first for the design, `docs/ADD-A-CARD.md` to add a card.

## Rules (keep the project easy to maintain)

1. **Pure logic goes in `logic.ts`** and gets a test in `test/`. `card.ts` only renders + wires events.
2. **No hard-coded user entities.** Every entity comes from card config. Defaults only in `getStubConfig`.
3. **No hard-coded UI text.** Use `this.t('key')`; add the key to **both** `translations/en.ts` and `fr.ts`
   (`test/i18n.test.ts` fails otherwise). Text that comes from the user's config is shown as-is.
4. **No `any`**. TypeScript is `strict`. Declare only the HA types you use in `shared/types.ts`.
5. **Colors/radii/blur via tokens** (`--g-*` fed by `--glass-*` overridable variables) — never raw colors in cards
   (the only exceptions are weather icon colors in `header/logic.ts`).
6. **Performance:** a card must declare `watchedEntities()` so it re-renders only when its entities change.
7. **Layout is data-driven:** placement is configured in YAML (`grid:` on each card), not in code.
8. Don't import Home Assistant internals; rely on documented events (`hass-more-info`, `location-changed`)
   and the standard elements `ha-icon`, `ha-form`, `ha-camera-stream`.
9. Config keys are `snake_case`; document every new key in `docs/CARDS.md` **and** in the card's TS interface doc comment.
10. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`…). Update `CHANGELOG.md` for user-visible changes.

## Verifying visual changes

Run `npm run dev` and look at the three frames. Headless screenshots work too:

```bash
google-chrome --headless=new --no-sandbox --window-size=1500,900 --virtual-time-budget=6000 \
  --screenshot=out.png "http://127.0.0.1:5173/dev/?only=desktop"
```

The reference design (mockups) is described in `docs/DESIGN.md`.

## Known limitations / open points

- The Home Assistant native sidebar/header cannot be hidden by a card; use the `kiosk-mode` HACS plugin (see README).
- `search_action` default emulates the quick-bar shortcut (`e`); it is best effort.
- The visual editors use YAML (`object` selector) for list fields (rooms, modes, items).
