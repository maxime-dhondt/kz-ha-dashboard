import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { runAction } from '../../shared/actions';
import { GlassCard, type GridOptions } from '../../shared/base-card';
import { defaultIcon, findEntity, isUnavailable, stateLabel, strAttr } from '../../shared/entities';
import { formatShortDate, formatTime } from '../../shared/format';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import type { ActionConfig, GlassCardConfig, HomeAssistant } from '../../shared/types';
import { isSameDay, parseEventStart } from './logic';
import './editor';

export interface QuickInfoItem {
  entity: string;
  /** Label shown as the first line (default: the entity's friendly name). */
  name?: string;
  icon?: string;
  /** `calendar` shows the next event (title + start time); default `state`. */
  type?: 'state' | 'calendar';
  /** Default: more-info. */
  tap_action?: ActionConfig;
}

export interface QuickInfoConfig extends GlassCardConfig {
  items: QuickInfoItem[];
}

@customElement('glass-quick-info-card')
export class GlassQuickInfoCard extends GlassCard<QuickInfoConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .glass {
        padding-bottom: 12px;
      }
      .title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      .list {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        gap: 6px;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
        text-align: left;
        width: 100%;
        --mdc-icon-size: 24px;
      }
      .item > ha-icon {
        flex: none;
        color: var(--g-text-2);
        width: 28px;
      }
      .text {
        min-width: 0;
        display: flex;
        flex-direction: column;
        font-size: 13px;
        line-height: 1.3;
      }
      .text .label {
        color: var(--g-text-2);
      }
      .text .strong {
        font-weight: 600;
        color: var(--g-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .text .plain,
      .text .secondary {
        color: var(--g-text-2);
      }
    `,
  ];

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-quick-info-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<QuickInfoConfig> {
    return {
      items: [{ entity: findEntity(hass, 'cover') ?? 'cover.garage_door', name: 'Garage' }],
    };
  }

  protected validateConfig(config: QuickInfoConfig): void {
    if (!Array.isArray(config.items) || config.items.length === 0) {
      throw new Error('"items" must list at least one entity');
    }
    if (config.items.some((i) => !i.entity)) throw new Error('each item needs an "entity"');
  }

  protected watchedEntities(): string[] {
    return this._config?.items.map((i) => i.entity) ?? [];
  }

  protected get refreshInterval(): number {
    return 60_000; // keeps "today / date" wording fresh
  }

  protected load(): void {
    this.requestUpdate();
  }

  private _lines(item: QuickInfoItem): { label: string; strong: string; secondary?: string } {
    const stateObj = this.hass?.states[item.entity];
    const name = item.name ?? strAttr(stateObj, 'friendly_name') ?? item.entity;
    if (!stateObj || isUnavailable(stateObj)) {
      return { label: name, strong: this.t('common.unavailable') };
    }

    if (item.type === 'calendar' || item.entity.startsWith('calendar.')) {
      const title = strAttr(stateObj, 'message');
      if (!title) return { label: name, strong: this.t('quick_info.no_event') };
      const start = parseEventStart(stateObj.attributes.start_time);
      const allDay = stateObj.attributes.all_day === true;
      let when: string | undefined;
      if (start) {
        const time = allDay ? '' : formatTime(this.hass, start);
        when = isSameDay(start, new Date())
          ? time
          : `${formatShortDate(this.hass, start)} ${time}`.trim();
      }
      return { label: name, strong: title, secondary: when };
    }

    return { label: name, strong: stateLabel(this.hass, stateObj) };
  }

  protected render(): TemplateResult {
    const c = this._config!;
    return html`<div class="glass">
      <div class="title">${c.name ?? this.t('quick_info.title')}</div>
      <div class="list">
        ${c.items.map((item) => {
          const stateObj = this.hass?.states[item.entity];
          const lines = this._lines(item);
          const isCalendar = item.type === 'calendar' || item.entity.startsWith('calendar.');
          return html`<button
            class="item"
            @click=${() =>
              runAction(this, this.hass, item.tap_action ?? { action: 'more-info' }, item.entity)}
          >
            <ha-icon .icon=${item.icon ?? defaultIcon(stateObj)}></ha-icon>
            <span class="text">
              <span class="label">${lines.label}</span>
              <span class=${isCalendar ? 'strong' : 'plain'}>${lines.strong}</span>
              ${lines.secondary ? html`<span class="secondary">${lines.secondary}</span>` : nothing}
            </span>
          </button>`;
        })}
      </div>
    </div>`;
  }

  public getGridOptions(): GridOptions {
    return { columns: 12, rows: 4, min_columns: 6, min_rows: 2 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-quick-info-card': GlassQuickInfoCard;
  }
}

registerCard({
  type: 'glass-quick-info-card',
  name: 'Glass Quick Info',
  description: 'Compact list of entity states and the next calendar event.',
});
