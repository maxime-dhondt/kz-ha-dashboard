import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassCard, requireEntity } from '../../shared/base-card';
import { entityName, findEntity } from '../../shared/entities';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import { cardHead, missingEntity } from '../../shared/templates';
import type { GlassCardConfig, HomeAssistant, ActionConfig } from '../../shared/types';
import { ARM_SERVICE, insecureDoors, securityView, type ArmMode } from './logic';
import './editor';

export interface SecurityConfig extends GlassCardConfig {
  /** alarm_control_panel.* entity (required). */
  entity: string;
  /** Doors / locks / covers used for the "All doors are secure" line. */
  door_entities?: string[];
  /** Which arm service the button calls when disarmed (default `home`). */
  arm_mode?: ArmMode;
  /** Alarm code. If omitted and the panel requires one, the user is prompted. */
  code?: string;
}

@customElement('glass-security-card')
export class GlassSecurityCard extends GlassCard<SecurityConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .body {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 2px;
        --tone: var(--g-green);
      }
      .body[data-tone='armed'] {
        --tone: var(--g-accent);
      }
      .body[data-tone='alert'] {
        --tone: var(--g-red);
      }
      .body[data-tone='pending'] {
        --tone: var(--g-orange);
      }
      .body[data-tone='unknown'] {
        --tone: var(--g-text-2);
      }
      .shield {
        color: var(--tone);
        --mdc-icon-size: 58px;
        line-height: 0;
        filter: drop-shadow(0 6px 10px color-mix(in srgb, var(--tone) 35%, transparent));
      }
      .status {
        font-size: 18px;
        font-weight: 600;
        color: var(--tone);
        margin-top: 4px;
      }
      .note {
        font-size: 12.5px;
        color: var(--g-text-2);
      }
      .action {
        margin-top: 12px;
        height: 38px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        background: var(--g-chip);
        box-shadow: inset 0 0 0 1px var(--g-border);
        --mdc-icon-size: 18px;
      }
      .action:active {
        transform: scale(0.98);
      }
    `,
  ];

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-security-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<SecurityConfig> {
    return { entity: findEntity(hass, 'alarm_control_panel') ?? 'alarm_control_panel.home' };
  }

  protected validateConfig(config: SecurityConfig): void {
    requireEntity(config, 'alarm_control_panel');
  }

  protected watchedEntities(): string[] {
    const c = this._config;
    return c ? [c.entity, ...(c.door_entities ?? [])] : [];
  }

  private _askCode(required: boolean): string | undefined | null {
    const c = this._config!;
    if (c.code) return c.code;
    if (!required) return undefined;
    return window.prompt(this.t('security.enter_code'));
  }

  private _toggle(): void {
    const c = this._config!;
    const stateObj = this.hass?.states[c.entity];
    if (!this.hass || !stateObj) return;

    const disarmed = stateObj.state === 'disarmed';
    const hasCode = stateObj.attributes.code_format != null;
    const needsCode = disarmed
      ? hasCode && stateObj.attributes.code_arm_required !== false
      : hasCode;
    const code = this._askCode(needsCode);
    if (code === null) return; // prompt cancelled

    const service = disarmed ? ARM_SERVICE[c.arm_mode ?? 'home'] : 'alarm_disarm';
    void this.hass.callService('alarm_control_panel', service, {
      entity_id: c.entity,
      ...(code ? { code } : {}),
    });
  }

  private _note(): string | typeof nothing {
    const c = this._config!;
    const doors = c.door_entities ?? [];
    if (doors.length === 0) return nothing;
    const open = insecureDoors(this.hass?.states ?? {}, doors);
    if (open.length === 0) return this.t('security.doors_ok');
    const names = open.map((id) => entityName(this.hass?.states[id], id)).join(', ');
    return this.t('security.doors_open', { names });
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const stateObj = this.hass?.states[c.entity];
    if (!stateObj) return missingEntity(this.hass, c.entity);

    const view = securityView(stateObj.state);
    const disarmed = stateObj.state === 'disarmed';
    const mode = c.arm_mode ?? 'home';

    return html`<div class="glass">
      ${cardHead(
        this.iconFor('mdi:shield-check'),
        c.name ?? this.t('security.title'),
        this.colorFor('var(--g-green)'),
      )}
      <div class="body" data-tone=${view.tone}>
        <span class="shield"><ha-icon .icon=${view.icon}></ha-icon></span>
        <div class="status">${this.t(view.labelKey)}</div>
        <div class="note">${this._note()}</div>
      </div>
      <button class="action" @click=${() => this._toggle()}>
        <ha-icon .icon=${disarmed ? 'mdi:lock' : 'mdi:lock-open-variant'}></ha-icon>
        ${disarmed ? this.t(`security.arm_${mode}`) : this.t('security.disarm')}
      </button>
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
    'glass-security-card': GlassSecurityCard;
  }
}

registerCard({
  type: 'glass-security-card',
  name: 'Glass Security',
  description: 'Alarm status with a door summary and an arm / disarm button.',
});
