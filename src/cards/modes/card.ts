import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { runAction } from '../../shared/actions';
import { GlassCard } from '../../shared/base-card';
import { domainOf, findEntity } from '../../shared/entities';
import { Press } from '../../shared/press';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import type { ActionConfig, GlassCardConfig, HomeAssistant } from '../../shared/types';
import { isModeActive, type Mode } from './logic';
import './editor';

export interface ModeConfig extends Mode {
  /** Overrides the default behavior (select the option). */
  tap_action?: ActionConfig;
}

export interface ModesConfig extends GlassCardConfig {
  /** input_select / select entity holding the current mode (optional if every mode has a tap_action). */
  entity?: string;
  modes: ModeConfig[];
}

@customElement('glass-modes-card')
export class GlassModesCard extends GlassCard<ModesConfig> {
  static styles = [
    tokens,
    glass,
    css`
      :host {
        height: auto;
      }
      .wrap {
        container-type: inline-size;
      }
      .modes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }
      .mode {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 64px;
        padding: 10px 16px 10px 10px;
        border-radius: 22px;
        text-align: left;
        cursor: pointer;
        user-select: none;
        background: var(--g-surface);
        border: 1px solid var(--g-border);
        box-shadow: var(--g-shadow);
        backdrop-filter: blur(var(--g-blur)) saturate(180%);
        -webkit-backdrop-filter: blur(var(--g-blur)) saturate(180%);
        transition:
          transform 0.15s ease,
          box-shadow 0.2s ease;
      }
      .mode:active {
        transform: scale(0.98);
      }
      .mode[aria-pressed='true'] {
        box-shadow:
          var(--g-shadow),
          0 0 0 2px color-mix(in srgb, var(--g-accent) 55%, transparent);
      }
      .bubble {
        width: 44px;
        height: 44px;
        --mdc-icon-size: 24px;
        background: color-mix(in srgb, var(--bubble, var(--g-accent)) 14%, var(--g-chip));
      }
      .text {
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .name {
        font-size: 15px;
        font-weight: 600;
      }
      .sub {
        font-size: 12.5px;
        color: var(--g-text-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ---- compact: one glass panel, icon over label ---- */
      @container (max-width: 560px) {
        .modes {
          grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
          gap: 2px;
          padding: 8px 6px;
          border-radius: 22px;
          background: var(--g-surface);
          border: 1px solid var(--g-border);
          box-shadow: var(--g-shadow);
          backdrop-filter: blur(var(--g-blur)) saturate(180%);
          -webkit-backdrop-filter: blur(var(--g-blur)) saturate(180%);
        }
        .mode {
          flex-direction: column;
          gap: 4px;
          min-height: 0;
          padding: 6px 2px;
          text-align: center;
          background: transparent;
          border: 0;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .mode[aria-pressed='true'] {
          box-shadow: none;
        }
        .mode[aria-pressed='true'] .bubble {
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--g-accent) 55%, transparent);
        }
        .bubble {
          width: 38px;
          height: 38px;
        }
        .name {
          font-size: 12px;
          font-weight: 500;
        }
        .sub {
          display: none;
        }
      }
    `,
  ];

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-modes-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<ModesConfig> {
    return {
      entity: findEntity(hass, 'input_select') ?? 'input_select.house_mode',
      modes: [
        { name: 'Home', subtitle: 'Home mode', icon: 'mdi:home', option: 'Home' },
        { name: 'Night', subtitle: 'Night mode', icon: 'mdi:weather-night', option: 'Night' },
      ],
    };
  }

  protected validateConfig(config: ModesConfig): void {
    if (!Array.isArray(config.modes) || config.modes.length === 0) {
      throw new Error('"modes" must list at least one mode');
    }
  }

  protected watchedEntities(): string[] {
    const c = this._config;
    if (!c) return [];
    return [c.entity, ...c.modes.map((m) => m.entity)].filter(
      (id): id is string => typeof id === 'string',
    );
  }

  private _select(mode: ModeConfig): void {
    const c = this._config!;
    if (mode.tap_action) {
      runAction(this, this.hass, mode.tap_action);
      return;
    }
    const entity = mode.entity ?? c.entity;
    if (!entity || mode.option === undefined) return;
    const domain = domainOf(entity);
    if (domain === 'input_select' || domain === 'select') {
      void this.hass?.callService(domain, 'select_option', {
        entity_id: entity,
        option: mode.option,
      });
    }
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const states = this.hass?.states ?? {};
    return html`<div class="wrap">
      <div class="modes" role="group">
        ${c.modes.map((mode) => {
          const press = new Press(() => this._select(mode));
          return html`<div
            class="mode"
            role="button"
            tabindex="0"
            aria-pressed=${isModeActive(mode, c.entity, states)}
            @pointerdown=${press.down}
            @pointerup=${press.up}
            @pointerleave=${press.cancel}
            @pointercancel=${press.cancel}
            @keydown=${press.key}
          >
            <span class="bubble" style=${mode.color ? `--bubble:${mode.color}` : ''}
              ><ha-icon .icon=${mode.icon}></ha-icon
            ></span>
            <span class="text">
              <span class="name">${mode.name}</span>
              ${mode.subtitle ? html`<span class="sub">${mode.subtitle}</span>` : nothing}
            </span>
          </div>`;
        })}
      </div>
    </div>`;
  }

  public getGridOptions() {
    return { columns: 12, rows: 1 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-modes-card': GlassModesCard;
  }
}

registerCard({
  type: 'glass-modes-card',
  name: 'Glass Modes',
  description: 'Scene / house-mode shortcuts (Home, Night, Away, Eco…).',
});
