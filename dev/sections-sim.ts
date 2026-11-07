import type { HomeAssistant, LovelaceCardConfig } from '../src/shared/types';

/**
 * Simulation of the Home Assistant native "Sections" view, using the CSS and sizing rules of the
 * real frontend (hui-sections-view / hui-grid-section, frontend 2026.1):
 *
 *  - column count = clamp(floor((width - padding + gap) / (320 + gap)), 1, max_columns)
 *  - wrapper max-width = columns * 500px + (columns - 1) * gap, centered
 *  - each section spans `column_span` columns (clamped) and has 12 grid columns per column spanned
 *  - card size = `columns` x `rows` from getGridOptions() merged with `grid_options`
 *    (rows: 56px each, 8px gaps; rows "auto" = natural height; columns "full" = whole row)
 *  - gaps: 32px between sections (8px when the viewport is <= 600px wide)
 *
 * It also draws the HA chrome around the view: top bar (56px) and, from 870px, the 256px drawer.
 * Keep this file in sync with the real frontend when the Sections behavior changes.
 */

export interface SectionConfig {
  type?: string;
  column_span?: number;
  cards?: Array<LovelaceCardConfig & { grid_options?: GridOptionsConfig }>;
}

export interface GridOptionsConfig {
  columns?: number | 'full';
  rows?: number | 'auto';
}

export interface SectionsViewConfig {
  title?: string;
  max_columns?: number;
  background?: string;
  dense_section_placement?: boolean;
  sections: SectionConfig[];
}

type CardEl = HTMLElement & {
  hass?: HomeAssistant;
  setConfig?(c: unknown): void;
  getGridOptions?(): GridOptionsConfig;
  layout?: string;
};

const VIEW_CSS = `
:host{box-sizing:border-box;--row-height:56px;--row-gap:8px;--column-gap:32px;--column-max-width:500px;--column-min-width:320px;display:block}
:host(.narrow){--column-gap:var(--row-gap)}
.wrapper{display:block;padding:var(--row-gap) var(--column-gap);box-sizing:content-box;margin:0 auto;
  max-width:calc(var(--column-count) * var(--column-max-width) + (var(--column-count) - 1) * var(--column-gap))}
.container{display:grid;grid-template-columns:[content-start] repeat(var(--content-column-count),minmax(0,1fr));
  gap:var(--row-gap) var(--column-gap);padding:var(--row-gap) 0;align-items:flex-start}
.content{grid-column:content-start/-1;grid-row:1/-1;display:grid;align-items:start;justify-content:center;
  grid-template-columns:repeat(var(--content-column-count),minmax(0,1fr));grid-auto-flow:row;gap:var(--row-gap) var(--column-gap)}
.content.dense{grid-auto-flow:row dense}
.section{grid-column:span var(--column-span);min-width:0}
/* hui-grid-section */
.grid{--base-column-count:12;--row-gap:8px;--column-gap:8px;--row-height:56px;display:flex;flex-direction:column;gap:var(--row-gap)}
.grid .container{--grid-column-count:calc(var(--base-column-count) * var(--column-span, 1));display:grid;
  grid-template-columns:repeat(var(--grid-column-count),minmax(0,1fr));grid-auto-rows:auto;row-gap:var(--row-gap);
  column-gap:var(--column-gap);padding:0;margin:0}
.card{position:relative;grid-row:span var(--row-size,1);grid-column:span min(var(--column-size,1),var(--grid-column-count))}
.card.fit-rows{height:calc((var(--row-size,1) * (var(--row-height) + var(--row-gap))) - var(--row-gap))}
.card.full-width{grid-column:1/-1}
.card > *{display:block;height:100%}
`;

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Column count exactly as the real view computes it. */
export function sectionColumnCount(contentWidth: number, maxColumns: number): number {
  const narrow = contentWidth <= 600;
  const gap = narrow ? 8 : 32;
  const padding = 2 * gap;
  const min = 320;
  return clamp(Math.floor((contentWidth - padding + gap) / (min + gap)), 1, maxColumns);
}

class SimSectionsView extends HTMLElement {
  private readonly root = this.attachShadow({ mode: 'open' });
  private config?: SectionsViewConfig;
  private cards: CardEl[] = [];
  private observer?: ResizeObserver;

  setup(config: SectionsViewConfig, hass: HomeAssistant): void {
    this.config = config;
    this.root.innerHTML = `<style>${VIEW_CSS}</style><div class="wrapper"><div class="container"><div class="content"></div></div></div>`;
    this.cards = [];
    const content = this.root.querySelector('.content') as HTMLElement;
    if (config.dense_section_placement) content.classList.add('dense');

    config.sections.forEach((section) => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'section';
      sectionEl.dataset.span = String(section.column_span ?? 1);
      const grid = document.createElement('div');
      grid.className = 'grid';
      const container = document.createElement('div');
      container.className = 'container';
      grid.append(container);
      sectionEl.append(grid);
      content.append(sectionEl);

      for (const entry of section.cards ?? []) {
        const { grid_options: override, ...cardConfig } = entry;
        const tag = cardConfig.type.replace(/^custom:/, '');
        const el = document.createElement(tag) as CardEl;
        el.setConfig?.(cardConfig);
        el.layout = 'grid';
        el.hass = hass;
        this.cards.push(el);

        const options = { ...el.getGridOptions?.(), ...override };
        const cell = document.createElement('div');
        cell.className = 'card';
        const columns = options.columns;
        const rows = options.rows;
        if (typeof columns === 'number') cell.style.setProperty('--column-size', String(columns));
        if (columns === 'full') cell.classList.add('full-width');
        if (typeof rows === 'number') {
          cell.style.setProperty('--row-size', String(rows));
          cell.classList.add('fit-rows');
        }
        cell.append(el);
        container.append(cell);
      }
    });

    this.observer?.disconnect();
    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(this);
  }

  set hass(value: HomeAssistant) {
    for (const el of this.cards) el.hass = value;
  }

  private layout(): void {
    if (!this.config) return;
    const width = this.getBoundingClientRect().width;
    if (!width) return;
    const count = sectionColumnCount(width, this.config.max_columns ?? 4);
    this.classList.toggle('narrow', width <= 600);
    const wrapper = this.root.querySelector('.wrapper') as HTMLElement;
    wrapper.style.setProperty('--column-count', String(count));
    wrapper.style.setProperty('--content-column-count', String(count));
    this.root.querySelectorAll<HTMLElement>('.section').forEach((section) => {
      const span = clamp(Number(section.dataset.span ?? 1), 1, count);
      section.style.setProperty('--column-span', String(span));
      (section.querySelector('.container') as HTMLElement).style.setProperty(
        '--column-span',
        String(span),
      );
    });
    this.dataset.columns = String(count);
  }
}

customElements.define('hui-sections-view', SimSectionsView);

const DRAWER_ITEMS = ['Overview', 'Map', 'Energy', 'Logbook', 'History', 'Media'];

/** Builds a Home Assistant page (top bar, drawer from 870px) around the simulated Sections view. */
export function createSectionsFrame(
  view: SectionsViewConfig,
  width: number,
  height: number,
  hass: HomeAssistant,
  dark: boolean,
  chrome = false,
): { element: HTMLElement; view: SimSectionsView } {
  const frame = document.createElement('div');
  const drawer = chrome && width >= 870;
  const bg = dark ? '#111111' : '#fafafa';
  const fg = dark ? '#e1e1e1' : '#212121';
  const bar = dark ? '#1c1c1c' : '#03a9f4';
  // The example points at /local/glass-home/house.jpg (HA's www folder); the preview serves it from examples/.
  const viewBg = (
    view.background ??
    'center / cover no-repeat linear-gradient(165deg,#aebdee 0%,#cdc6ea 45%,#efd8cf 100%)'
  ).replace('/local/glass-home/', '/examples/');
  frame.style.cssText = `display:flex;width:${width}px;height:${height}px;overflow:hidden;transform:translateZ(0);background:${bg};color:${fg};font:14px system-ui,sans-serif;`;
  frame.innerHTML = `
    ${
      drawer
        ? `<aside style="flex:none;width:256px;background:${dark ? '#1c1c1c' : '#fff'};border-right:1px solid rgba(127,127,127,.25);padding:56px 0 0">
            ${DRAWER_ITEMS.map((n, i) => `<div style="padding:10px 20px;opacity:${i === 0 ? 1 : 0.6};font-weight:${i === 0 ? 600 : 400}">${n}</div>`).join('')}
          </aside>`
        : ''
    }
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;position:relative">
      ${chrome ? `<header style="flex:none;height:56px;display:flex;align-items:center;padding:0 16px;background:${bar};color:#fff;font-size:20px;${drawer ? 'margin-top:0' : ''}">${view.title ?? 'Glass'}</header>` : ''}
      <div class="scroll" style="flex:1;overflow:auto;background:${viewBg}"></div>
    </div>`;
  if (drawer) {
    // drawer overlaps the top bar area in HA; keep the bar only above the content
    (frame.querySelector('aside') as HTMLElement).style.paddingTop = '56px';
  }
  const sections = document.createElement('hui-sections-view') as SimSectionsView;
  sections.setup(view, hass);
  (frame.querySelector('.scroll') as HTMLElement).append(sections);
  return { element: frame, view: sections };
}
