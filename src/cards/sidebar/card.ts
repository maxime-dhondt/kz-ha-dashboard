import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { navigate } from '../../shared/actions';
import { GlassCard } from '../../shared/base-card';
import { isUnavailable } from '../../shared/entities';
import { formatShortDate, formatTime } from '../../shared/format';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import type { GlassCardConfig, LayoutSize } from '../../shared/types';
import { isActivePath, splitMobileItems } from './logic';
import './editor';

export interface SidebarItem {
  name: string;
  /** Label under the icon in the mobile bottom bar (default: `name`). */
  short_name?: string;
  icon: string;
  /** Dashboard path, e.g. `/dashboard-glass/lights`. */
  navigation_path: string;
  /** Keep this item in the mobile bottom bar (others go to "More"). */
  pin_mobile?: boolean;
}

export interface SidebarConfig extends GlassCardConfig {
  /** Brand title (default "Home"). */
  title?: string;
  subtitle?: string;
  /** Brand icon (default `mdi:home`). */
  icon?: string;
  items: SidebarItem[];
  /** Entities watched for the "All systems OK" footer (problem when unavailable). */
  status_entities?: string[];
  /** Items shown in the mobile bottom bar before the "More" menu (default 4). */
  mobile_max_items?: number;
}

@customElement('glass-sidebar-card')
export class GlassSidebarCard extends GlassCard<SidebarConfig> {
  static styles = [
    tokens,
    glass,
    css`
      :host {
        height: 100%;
      }
      /* The sidebar is a full-height panel, not a rounded card. */
      .panel {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 22px 16px 18px;
        background: var(--glass-sidebar-bg, var(--g-surface));
        border-right: 1px solid var(--g-border);
        backdrop-filter: blur(var(--g-blur)) saturate(180%);
        -webkit-backdrop-filter: blur(var(--g-blur)) saturate(180%);
      }
      .brand {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 0 6px 22px;
      }
      .logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(145deg, #4a93ff, var(--g-accent));
        box-shadow: 0 6px 14px color-mix(in srgb, var(--g-accent) 40%, transparent);
        --mdc-icon-size: 24px;
      }
      .brand-title {
        font-size: 17px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .brand-sub {
        font-size: 13px;
        color: var(--g-text-2);
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      a.item {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 40px;
        padding: 0 14px;
        border-radius: 14px;
        text-decoration: none;
        color: var(--g-text-2);
        font-size: 14.5px;
        font-weight: 500;
        --mdc-icon-size: 20px;
        transition: background 0.2s ease;
      }
      a.item:hover {
        background: var(--g-chip);
      }
      a.item[aria-current='page'] {
        color: #fff;
        background: var(--g-accent);
        box-shadow: 0 6px 14px color-mix(in srgb, var(--g-accent) 32%, transparent);
      }
      .foot {
        margin-top: auto;
        padding: 14px 6px 0;
        border-top: 1px solid var(--g-border);
        font-size: 12px;
        color: var(--g-text-2);
        line-height: 1.5;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .status i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--g-green);
      }
      .status.problem i {
        background: var(--g-orange);
      }

      /* ---- tablet: icon rail ---- */
      :host([size='tablet']) .panel {
        padding: 18px 10px;
        align-items: center;
      }
      :host([size='tablet']) .brand {
        padding: 0 0 18px;
      }
      :host([size='tablet']) .brand-text,
      :host([size='tablet']) .label,
      :host([size='tablet']) .foot {
        display: none;
      }
      :host([size='tablet']) a.item {
        width: 44px;
        height: 44px;
        padding: 0;
        justify-content: center;
        --mdc-icon-size: 22px;
      }

      /* ---- mobile: bottom bar ---- */
      .bar {
        display: flex;
        flex-direction: row;
        gap: 0;
        align-items: stretch;
        justify-content: space-around;
        padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0px));
        background: var(--glass-sidebar-bg, var(--g-surface));
        border-top: 1px solid var(--g-border);
        backdrop-filter: blur(var(--g-blur)) saturate(180%);
        -webkit-backdrop-filter: blur(var(--g-blur)) saturate(180%);
        position: relative;
      }
      .tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 4px 0;
        font-size: 11px;
        color: var(--g-text-2);
        text-decoration: none;
        --mdc-icon-size: 24px;
      }
      .tab[aria-current='page'],
      .tab.open {
        color: var(--g-accent);
      }
      .sheet {
        position: absolute;
        right: 8px;
        bottom: calc(100% + 8px);
        min-width: 190px;
        padding: 8px;
        border-radius: 20px;
        background: var(--g-surface);
        border: 1px solid var(--g-border);
        box-shadow: var(--g-shadow);
        backdrop-filter: blur(var(--g-blur));
        -webkit-backdrop-filter: blur(var(--g-blur));
      }
    `,
  ];

  /** Set by the layout card; also usable standalone. */
  @property({ reflect: true }) public size: LayoutSize = 'desktop';
  @state() private _path = window.location.pathname;
  @state() private _moreOpen = false;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-sidebar-card-editor');
  }

  static getStubConfig(): Partial<SidebarConfig> {
    return {
      title: 'Home',
      items: [
        { name: 'Overview', icon: 'mdi:home', navigation_path: '/lovelace/0' },
        { name: 'Lights', icon: 'mdi:lightbulb', navigation_path: '/lovelace/lights' },
      ],
    };
  }

  protected validateConfig(config: SidebarConfig): void {
    if (!Array.isArray(config.items) || config.items.length === 0) {
      throw new Error('"items" must list at least one navigation entry');
    }
  }

  protected watchedEntities(): string[] {
    return this._config?.status_entities ?? [];
  }

  protected get refreshInterval(): number {
    return 30_000; // footer clock
  }

  protected load(): void {
    this.requestUpdate();
  }

  private _onLocation = (): void => {
    this._path = window.location.pathname;
    this._moreOpen = false;
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('location-changed', this._onLocation);
    window.addEventListener('popstate', this._onLocation);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('location-changed', this._onLocation);
    window.removeEventListener('popstate', this._onLocation);
  }

  private _link(item: SidebarItem, cls: string, content: TemplateResult): TemplateResult {
    const active = isActivePath(this._path, item.navigation_path);
    return html`<a
      class=${cls}
      href=${item.navigation_path}
      title=${item.name}
      aria-current=${active ? 'page' : 'false'}
      @click=${(ev: MouseEvent) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
        ev.preventDefault();
        navigate(item.navigation_path);
      }}
      >${content}</a
    >`;
  }

  private _brand(): TemplateResult {
    const c = this._config!;
    return html`<div class="brand">
      <div class="logo"><ha-icon .icon=${c.icon ?? 'mdi:home'}></ha-icon></div>
      <div class="brand-text">
        <div class="brand-title">${c.title ?? 'Home'}</div>
        ${c.subtitle ? html`<div class="brand-sub">${c.subtitle}</div>` : nothing}
      </div>
    </div>`;
  }

  private _footer(): TemplateResult {
    const c = this._config!;
    const states = this.hass?.states ?? {};
    const problems = (c.status_entities ?? []).filter((id) => isUnavailable(states[id])).length;
    const now = new Date();
    return html`<div class="foot">
      <div class="status ${problems > 0 ? 'problem' : ''}">
        <i></i>
        <span
          >${
            problems > 0
              ? this.t('sidebar.status_problem', { count: problems })
              : this.t('sidebar.status_ok')
          }</span
        >
      </div>
      <div>${formatShortDate(this.hass, now)} · ${formatTime(this.hass, now)}</div>
    </div>`;
  }

  private _renderBar(): TemplateResult {
    const c = this._config!;
    const { bar: visible, more } = splitMobileItems(c.items, c.mobile_max_items ?? 4);
    const overflow = more.length > 0;
    return html`<nav class="bar" aria-label=${this.t('sidebar.navigation')}>
      ${visible.map((item) =>
        this._link(
          item,
          'tab',
          html`<ha-icon .icon=${item.icon}></ha-icon><span>${item.short_name ?? item.name}</span>`,
        ),
      )}
      ${
        overflow
          ? html`<button
              class="tab ${this._moreOpen ? 'open' : ''}"
              aria-expanded=${this._moreOpen}
              @click=${() => (this._moreOpen = !this._moreOpen)}
            >
              <ha-icon icon="mdi:dots-horizontal"></ha-icon><span>${this.t('sidebar.more')}</span>
            </button>`
          : nothing
      }
      ${
        this._moreOpen
          ? html`<div class="sheet">
              ${more.map((item) =>
                this._link(
                  item,
                  'item',
                  html`<ha-icon .icon=${item.icon}></ha-icon
                    ><span class="label">${item.name}</span>`,
                ),
              )}
            </div>`
          : nothing
      }
    </nav>`;
  }

  protected render(): TemplateResult {
    const c = this._config!;
    if (this.size === 'mobile') return this._renderBar();
    return html`<div class="panel">
      ${this._brand()}
      <nav aria-label=${this.t('sidebar.navigation')}>
        ${c.items.map((item) =>
          this._link(
            item,
            'item',
            html`<ha-icon .icon=${item.icon}></ha-icon><span class="label">${item.name}</span>`,
          ),
        )}
      </nav>
      ${this._footer()}
    </div>`;
  }

  public getGridOptions() {
    return { columns: 4, rows: 8, min_columns: 2, min_rows: 4 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-sidebar-card': GlassSidebarCard;
  }
}

registerCard({
  type: 'glass-sidebar-card',
  name: 'Glass Sidebar',
  description: 'Navigation sidebar (rail on tablet, bottom bar on mobile) with a status footer.',
});
