import { css, html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { GlassCard, requireEntity } from '../../shared/base-card';
import { barRatios } from '../../shared/charts';
import { strAttr, toNumber } from '../../shared/entities';
import { formatHourLabel, formatNumber } from '../../shared/format';
import { bucketize, fetchHistory } from '../../shared/history';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import { cardHead, missingEntity } from '../../shared/templates';
import type { GlassCardConfig, HomeAssistant, ActionConfig } from '../../shared/types';
import { findEntity } from '../../shared/entities';
import { powerDigits, toKw } from './logic';
import './editor';

export interface EnergyConfig extends GlassCardConfig {
  /** Power sensor (W / kW), required. */
  entity: string;
  /** Number of bars covering today from midnight (default 24 = one per hour). */
  bars?: number;
}

@customElement('glass-energy-card')
export class GlassEnergyCard extends GlassCard<EnergyConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .reading {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }
      .value {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .unit {
        font-size: 20px;
        font-weight: 500;
        color: var(--g-text-2);
      }
      .label {
        font-size: 13.5px;
        color: var(--g-text-2);
      }
      .bars {
        flex: 1;
        min-height: 54px;
        display: flex;
        align-items: flex-end;
        gap: 3px;
        margin-top: 8px;
      }
      .bar {
        flex: 1;
        min-height: 3px;
        border-radius: 3px;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--g-green) 90%, white),
          color-mix(in srgb, var(--g-green) 45%, transparent)
        );
      }
      .bar.empty {
        height: 3px;
        background: var(--g-track);
      }
      .axis {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--g-text-2);
        padding-top: 5px;
      }
    `,
  ];

  @state() private _series: Array<number | null> = [];
  @state() private _dayStart = 0;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-energy-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<EnergyConfig> {
    return { entity: findEntity(hass, 'sensor') ?? 'sensor.power' };
  }

  protected validateConfig(config: EnergyConfig): void {
    requireEntity(config);
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
    if (!hass || !c) return;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const unit = strAttr(hass.states[c.entity], 'unit_of_measurement');
    try {
      const points = await fetchHistory(hass, c.entity, midnight, now);
      const kw = points.map((p) => ({ t: p.t, v: toKw(p.v, unit).value }));
      this._series = bucketize(kw, {
        start: +midnight,
        end: +midnight + 86_400_000,
        buckets: c.bars ?? 24,
        until: +now,
      });
      this._dayStart = +midnight;
    } catch {
      this._series = [];
    }
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const stateObj = this.hass?.states[c.entity];
    if (!stateObj) return missingEntity(this.hass, c.entity);

    const raw = toNumber(stateObj.state);
    const power =
      raw === undefined ? undefined : toKw(raw, strAttr(stateObj, 'unit_of_measurement'));
    const ratios = barRatios(this._series);
    const labels = this._dayStart
      ? [0, 6, 12, 18].map((h) =>
          formatHourLabel(this.hass, new Date(this._dayStart + h * 3_600_000)),
        )
      : [];

    return html`<div class="glass">
      ${cardHead(
        this.iconFor('mdi:lightning-bolt'),
        c.name ?? this.t('energy.title'),
        this.colorFor('var(--g-yellow)'),
      )}
      <div class="reading">
        <span class="value"
          >${power ? formatNumber(this.hass, power.value, powerDigits(power.value)) : '–'}</span
        >
        <span class="unit">${power?.unit}</span>
      </div>
      <div class="label">${this.t('energy.current')}</div>
      <div class="bars" aria-hidden="true">
        ${ratios.map((r, i) =>
          this._series[i] === null
            ? html`<span class="bar empty"></span>`
            : html`<span class="bar" style="height:${Math.max(r * 100, 4).toFixed(1)}%"></span>`,
        )}
      </div>
      <div class="axis">${labels.map((l) => html`<span>${l}</span>`)}</div>
    </div>`;
  }

  protected defaultTapAction(): ActionConfig | undefined {
    return { action: 'more-info', entity: this._config?.entity };
  }

  public getGridOptions() {
    return { columns: 6, rows: 4, min_columns: 3, min_rows: 3 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-energy-card': GlassEnergyCard;
  }
}

registerCard({
  type: 'glass-energy-card',
  name: 'Glass Energy',
  description: "Current power draw with a bar chart of today's consumption.",
});
