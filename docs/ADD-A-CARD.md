# Adding a card (checklist)

Example: `glass-weather-card`.

1. **Create the folder** `src/cards/weather/` with:
   - `logic.ts` – pure helpers (formatting, state mapping). Write `test/` cases for them.
   - `editor.ts`:
     ```ts
     import { defineEditor, entitySelector } from '../../shared/editor';
     defineEditor('glass-weather-card-editor', () => [
       { name: 'entity', required: true, selector: entitySelector('weather') },
       { name: 'name', selector: { text: {} } },
     ]);
     ```
   - `card.ts` (copy `media/card.ts` as a template, the simplest one):
     ```ts
     export interface WeatherConfig extends GlassCardConfig {
       entity: string;
     }

     @customElement('glass-weather-card')
     export class GlassWeatherCard extends GlassCard<WeatherConfig> {
       static styles = [
         tokens,
         glass,
         css`
           /* card specific */
         `,
       ];
       static getConfigElement() {
         return document.createElement('glass-weather-card-editor');
       }
       static getStubConfig(hass?: HomeAssistant) {
         return { entity: findEntity(hass, 'weather') ?? 'weather.home' };
       }
       protected validateConfig(c: WeatherConfig) {
         requireEntity(c, 'weather');
       }
       protected watchedEntities() {
         return this._config ? [this._config.entity] : [];
       }
       protected render() {
         /* use cardHead(), missingEntity(), this.t('…') */
       }
       getGridOptions() {
         return { columns: 6, rows: 4 };
       }
     }
     registerCard({ type: 'glass-weather-card', name: 'Glass Weather', description: '…' });
     ```
2. **Register** it: add `import './weather/card';` to `src/cards/index.ts`.
3. **Translate**: add every new `t('weather.…')` / `editor.…` key to `translations/en.ts` **and** `fr.ts`.
4. **Document**: add a section to `docs/CARDS.md` (options table + YAML example).
5. **Preview**: add mock entities to `dev/mock-hass.ts` and the card to `examples/sections-view.yaml`
   (use the `grid:` key), then check `npm run dev` in the 3 frames.
6. **Verify**: `npm run check`.
7. Add a line to `CHANGELOG.md`.

## Native-like options (do this for every card)

- Header: `cardHead(this.iconFor('mdi:default'), title, this.colorFor('var(--g-xxx)'))`.
- Body actions: nothing to write; override `defaultTapAction()` to return `{ action: 'more-info', entity }`.
- Editor: `appearanceSection()` (name, icon, color) and `interactionsSection()` (tap/hold).
- Lists: `listSelector({ labelField, fields })` instead of a YAML field.
- Size: `getGridOptions()` returning `columns`, `rows`, `min_columns`, `min_rows` (Sections view).

## Conventions recap

- Missing/unknown entity → `missingEntity(this.hass, id)`, never throw in `render()`.
- Use `.glass` as the root element, `.card-head`/`cardHead()` for the title row.
- Colors: only `var(--g-*)`; sizes in px, radius from `var(--g-radius)`.
- Interactive elements are `<button>` (or `role="button" tabindex="0"` + `Press`) with an `aria-label`.
- Async work (history, images) goes in `load()`; set `refreshInterval` if it must repeat.
