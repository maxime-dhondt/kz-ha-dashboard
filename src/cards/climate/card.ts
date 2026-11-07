import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { GlassCard, requireEntity } from '../../shared/base-card';
import { sparkline } from '../../shared/charts';
import { numAttr } from '../../shared/entities';
import { formatHourLabel, formatNumber } from '../../shared/format';
import { bucketize, fetchHistory } from '../../shared/history';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import { cardHead, missingEntity } from '../../shared/templates';
import type { GlassCardConfig, HomeAssistant } from '../../shared/types';
import { findEntity } from '../../shared/entities';
import { nextTarget } from './logic';
import './editor';

export interface ClimateConfig extends GlassCardConfig {
  /** climate.* entity (required). */
  entity: string;
  /** Sensor used for the chart. Default: the climate's `current_temperature` attribute. */
  history_entity?: string;
  /** Chart time window in hours (default 12). */
  hours?: number;
  /** Target temperature step. Default: the entity's `target_temp_step`, else 0.5. */
  step?: number;
  show_chart?: boolean;
}

const CHART_W = 300;
const CHART_H = 90;
const BUCKETS = 24;

@customElement('glass-climate-card')
export class GlassClimateCard extends GlassCard<ClimateConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .reading {
        display: flex;
        align-items: baseline;
        gap: 2px;
        margin-top: 2px;
      }
      .temp {
        font-size: 46px;
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1.05;
      }
      .unit {
        font-size: 22px;
        font-weight: 500;
        color: var(--g-text-2);
      }
      .target {
        font-size: 14px;
        color: var(--g-text-2);
        margin-top: 2px;
      }
      .adjust {
        display: flex;
        gap: 8px;
      }
      .chart {
        flex: 1;
        min-height: 70px;
        margin-top: 8px;
        position: relative;
      }
      svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .line {
        stroke: var(--g-accent);
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .axis {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--g-text-2);
        padding: 4px 6px 0;
      }
    `,
  ];

  @state() private _series: Array<number | null> = [];
  @state() private _range: { start: number; end: number } = { start: 0, end: 0 };
  @state() private _pending?: number;
  private _debounce?: number;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-climate-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<ClimateConfig> {
    return { entity: findEntity(hass, 'climate') ?? 'climate.living_room' };
  }

  protected validateConfig(config: ClimateConfig): void {
    requireEntity(config, 'climate');
  }

  protected watchedEntities(): string[] {
    const c = this._config;
    return c ? [c.entity] : [];
  }

  protected get refreshInterval(): number {
    return 10 * 60 * 1000;
  }

  protected async load(): Promise<void> {
    const hass = this.hass;
    const c = this._config;
    if (!hass || !c || c.show_chart === false) return;
    const hours = c.hours ?? 12;
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3_600_000);
    try {
      const points = await fetchHistory(
        hass,
        c.history_entity ?? c.entity,
        start,
        end,
        c.history_entity ? undefined : 'current_temperature',
      );
      this._series = bucketize(points, { start: +start, end: +end, buckets: BUCKETS });
      this._range = { start: +start, end: +end };
    } catch {
      this._series = [];
    }
  }

  private _adjust(direction: 1 | -1): void {
    const c = this._config;
    const stateObj = c ? this.hass?.states[c.entity] : undefined;
    if (!c || !stateObj) return;
    const base =
      this._pending ?? numAttr(stateObj, 'temperature') ?? numAttr(stateObj, 'target_temp_low');
    if (base === undefined) return;
    const step = c.step ?? numAttr(stateObj, 'target_temp_step') ?? 0.5;
    const target = nextTarget(
      base,
      direction,
      step,
      numAttr(stateObj, 'min_temp'),
      numAttr(stateObj, 'max_temp'),
    );
    this._pending = target;
    window.clearTimeout(this._debounce);
    this._debounce = window.setTimeout(() => {
      void this.hass
        ?.callService('climate', 'set_temperature', { entity_id: c.entity, temperature: target })
        .finally(() => window.setTimeout(() => (this._pending = undefined), 2000));
    }, 700);
  }

  private _chart(): TemplateResult | typeof nothing {
    if (this._config?.show_chart === false) return nothing;
    const { line, area } = sparkline(this._series, CHART_W, CHART_H, 3);
    const { start, end } = this._range;
    const labels = start
      ? [start, (start + end) / 2, end].map((t) => formatHourLabel(this.hass, new Date(t)))
      : [];
    return html`<div class="chart">
        <svg viewBox="0 0 ${CHART_W} ${CHART_H}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color:var(--g-accent);stop-opacity:0.32" />
              <stop offset="1" style="stop-color:var(--g-accent);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path d=${area} fill="url(#fill)" />
          <path class="line" d=${line} fill="none" vector-effect="non-scaling-stroke" />
        </svg>
      </div>
      <div class="axis">${labels.map((l) => html`<span>${l}</span>`)}</div>`;
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const stateObj = this.hass?.states[c.entity];
    if (!stateObj) return missingEntity(this.hass, c.entity);

    const unit = this.hass?.config?.unit_system?.temperature ?? '°C';
    const current = numAttr(stateObj, 'current_temperature');
    const target =
      this._pending ?? numAttr(stateObj, 'temperature') ?? numAttr(stateObj, 'target_temp_low');

    return html`<div class="glass">
      ${cardHead(
        'mdi:thermometer',
        c.name ?? this.t('climate.title'),
        'var(--g-orange)',
        html`<div class="adjust">
          <button
            class="round-btn"
            aria-label=${this.t('climate.decrease')}
            @click=${() => this._adjust(-1)}
          >
            <ha-icon icon="mdi:minus"></ha-icon>
          </button>
          <button
            class="round-btn"
            aria-label=${this.t('climate.increase')}
            @click=${() => this._adjust(1)}
          >
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
        </div>`,
      )}
      <div class="reading">
        <span class="temp"
          >${current !== undefined ? formatNumber(this.hass, current, 1) : '–'}</span
        >
        <span class="unit">${unit}</span>
      </div>
      <div class="target">
        ${
          target !== undefined
            ? this.t('climate.target', { temp: `${formatNumber(this.hass, target, 1)}${unit}` })
            : nothing
        }
      </div>
      ${this._chart()}
    </div>`;
  }

  public getGridOptions() {
    return { columns: 6, rows: 4 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-climate-card': GlassClimateCard;
  }
}

registerCard({
  type: 'glass-climate-card',
  name: 'Glass Climate',
  description: 'Current and target temperature with +/- control and a history chart.',
});
