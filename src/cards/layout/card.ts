import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { GlassCard, type GridOptions } from '../../shared/base-card';
import { registerCard } from '../../shared/register';
import { tokens } from '../../shared/styles';
import type {
  CardElement,
  GlassCardConfig,
  LayoutSize,
  LovelaceCardConfig,
} from '../../shared/types';
import {
  DEFAULT_BREAKPOINTS,
  resolveSpans,
  sizeForWidth,
  type Breakpoints,
  type GridConfig,
} from './logic';
import './editor';

export type LayoutCardEntry = LovelaceCardConfig & { grid?: GridConfig };

export interface LayoutConfig extends GlassCardConfig {
  /** Page background image URL (e.g. `/local/glass-home/house.jpg`). Gradient when omitted. */
  background?: string;
  /** Config of the `glass-sidebar-card`. `false` hides the sidebar. */
  sidebar?: Omit<LovelaceCardConfig, 'type'> | false;
  /** Config of the `glass-header-card`. `false` hides the header. */
  header?: Omit<LovelaceCardConfig, 'type'> | false;
  /** Cards laid out on a 24-column grid; each may carry a `grid` placement. */
  cards: LayoutCardEntry[];
  /** Pixel widths where the layout switches to tablet / mobile. */
  breakpoints?: Partial<Breakpoints>;
}

interface Cell {
  el: CardElement;
  grid: GridConfig | undefined;
}

/** Inline error shown instead of a card whose config is invalid. */
function errorElement(message: string): CardElement {
  const el = document.createElement('div') as CardElement;
  el.className = 'glass-error';
  el.textContent = message;
  return el;
}

@customElement('glass-layout-card')
export class GlassLayoutCard extends GlassCard<LayoutConfig> {
  static styles = [
    tokens,
    css`
      :host {
        display: block;
        /* Height of the visible dashboard area; override with --glass-view-height (e.g. with kiosk mode: 100vh). */
        --glass-view-h: var(--glass-view-height, calc(100vh - var(--header-height, 56px)));
        min-height: var(--glass-view-h);
        position: relative;
        --glass-gap: 14px;
      }
      .root {
        position: relative;
        min-height: inherit;
        display: grid;
        grid-template-columns: var(--side-w, 0px) minmax(0, 1fr);
        isolation: isolate;
      }
      .bg,
      .veil {
        position: absolute;
        inset: 0;
        z-index: -1;
      }
      .bg {
        background:
          var(--bg-image, none) center / cover no-repeat,
          linear-gradient(165deg, #aebdee 0%, #cdc6ea 45%, #efd8cf 100%);
      }
      .veil {
        background: linear-gradient(
          180deg,
          rgba(196, 205, 245, 0.55) 0%,
          rgba(230, 232, 250, 0.18) 45%,
          rgba(255, 255, 255, 0) 100%
        );
      }
      :host([dark]) .bg {
        background:
          var(--bg-image, none) center / cover no-repeat,
          linear-gradient(165deg, #141a33 0%, #232648 50%, #3a2b45 100%);
      }
      :host([dark]) .veil {
        background: linear-gradient(180deg, rgba(10, 14, 32, 0.55), rgba(10, 14, 32, 0.2));
      }
      aside {
        position: sticky;
        top: 0;
        align-self: start;
        height: var(--glass-view-h);
      }
      aside > * {
        height: 100%;
      }
      main {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--glass-gap);
        padding: 26px 28px 28px 26px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(24, minmax(0, 1fr));
        gap: var(--glass-gap);
        align-items: stretch;
      }
      .cell {
        grid-column: var(--start, auto) / span var(--span);
        min-width: 0;
      }
      .cell > * {
        height: 100%;
      }
      .glass-error {
        padding: 14px;
        border-radius: 18px;
        font-size: 13px;
        color: var(--g-red);
        background: var(--g-surface);
      }

      /* ---- tablet: icon rail ---- */
      :host([size='tablet']) .root {
        --side-w: 76px;
      }
      :host([size='tablet']) main {
        padding: 22px;
      }
      :host([size='tablet']) .cell {
        grid-column: var(--start, auto) / span var(--span-tablet);
      }
      :host([size='tablet']) .cell[data-hide~='tablet'] {
        display: none;
      }

      /* ---- mobile: bottom bar ---- */
      :host([size='mobile']) .root {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: 1fr auto;
      }
      :host([size='mobile']) main {
        grid-row: 1;
        grid-column: 1;
        padding: 16px 14px 20px;
      }
      :host([size='mobile']) aside {
        grid-row: 2;
        grid-column: 1;
        position: sticky;
        bottom: 0;
        top: auto;
        height: auto;
        min-height: 0;
        z-index: 2;
      }
      :host([size='mobile']) .cell {
        grid-column: var(--start, auto) / span var(--span-mobile);
      }
      :host([size='mobile']) .cell[data-hide~='mobile'] {
        display: none;
      }
      :host(:not([size='tablet']):not([size='mobile'])) .root {
        --side-w: 240px;
      }
      :host([size='desktop']) .cell[data-hide~='desktop'] {
        display: none;
      }
    `,
  ];

  @property({ reflect: true }) public size: LayoutSize = 'desktop';
  @state() private _sidebar?: CardElement;
  @state() private _header?: CardElement;
  @state() private _cells: Cell[] = [];

  private _observer?: ResizeObserver;
  private _buildId = 0;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-layout-card-editor');
  }

  static getStubConfig(): Partial<LayoutConfig> {
    return { cards: [] };
  }

  protected validateConfig(config: LayoutConfig): void {
    if (!Array.isArray(config.cards)) throw new Error('"cards" must be a list');
  }

  public setConfig(config: LayoutConfig): void {
    super.setConfig(config);
    void this._build(config);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const bp = { ...DEFAULT_BREAKPOINTS, ...this._config?.breakpoints };
      this.size = sizeForWidth(entry.contentRect.width, bp);
    });
    this._observer.observe(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  /** Creates a card element; our own cards directly, any other type through HA's helpers. */
  private async _create(config: LovelaceCardConfig): Promise<CardElement> {
    try {
      const tag = config.type.startsWith('custom:') ? config.type.slice(7) : undefined;
      if (tag && customElements.get(tag)) {
        const el = document.createElement(tag) as CardElement;
        el.setConfig?.(config);
        return el;
      }
      const helpers = await window.loadCardHelpers?.();
      if (!helpers) return errorElement(`Unknown card type: ${config.type}`);
      return helpers.createCardElement(config) as CardElement;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return errorElement(`${config.type}: ${message}`);
    }
  }

  private async _build(config: LayoutConfig): Promise<void> {
    const id = ++this._buildId;
    const sidebar =
      config.sidebar === false
        ? undefined
        : config.sidebar
          ? await this._create({ type: 'custom:glass-sidebar-card', ...config.sidebar })
          : undefined;
    const header =
      config.header === false
        ? undefined
        : config.header
          ? await this._create({ type: 'custom:glass-header-card', ...config.header })
          : undefined;
    const cells = await Promise.all(
      config.cards.map(async ({ grid, ...cardConfig }) => ({
        el: await this._create(cardConfig as LovelaceCardConfig),
        grid,
      })),
    );
    if (id !== this._buildId) return; // a newer config superseded this build
    this._sidebar = sidebar;
    this._header = header;
    this._cells = cells;
    this._forwardHass();
  }

  private _forwardHass(): void {
    const hass = this.hass;
    if (!hass) return;
    for (const el of [this._sidebar, this._header, ...this._cells.map((c) => c.el)]) {
      if (el) el.hass = hass;
    }
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.has('hass')) this._forwardHass(); // children filter their own updates
    return super.shouldUpdate(changed);
  }

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
    if (this._sidebar) (this._sidebar as CardElement & { size?: LayoutSize }).size = this.size;
  }

  protected render(): TemplateResult {
    const c = this._config!;
    return html`<div
      class="root"
      style=${styleMap({
        '--bg-image': c.background ? `url("${c.background}")` : 'none',
      })}
    >
      <div class="bg"></div>
      <div class="veil"></div>
      ${this._sidebar ? html`<aside>${this._sidebar}</aside>` : nothing}
      <main>
        ${this._header ?? nothing}
        <div class="grid">
          ${this._cells.map(({ el, grid }) => {
            const span = resolveSpans(grid);
            return html`<div
              class="cell"
              data-hide=${(grid?.hidden_on ?? []).join(' ')}
              style=${styleMap({
                '--span': String(span.desktop),
                '--span-tablet': String(span.tablet),
                '--span-mobile': String(span.mobile),
                '--start': grid?.new_row ? '1' : 'auto',
              })}
            >
              ${el}
            </div>`;
          })}
        </div>
      </main>
    </div>`;
  }

  public getCardSize(): number {
    return 12;
  }

  public getGridOptions(): GridOptions {
    return { columns: 12, rows: 'auto' as const };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-layout-card': GlassLayoutCard;
  }
}

registerCard({
  type: 'glass-layout-card',
  name: 'Glass Layout',
  description:
    'Full-page responsive layout: background, sidebar, header and a 24-column card grid.',
  preview: false,
});
