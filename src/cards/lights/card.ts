import { css, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassCard } from '../../shared/base-card';
import { findEntity } from '../../shared/entities';
import { Press } from '../../shared/press';
import { fireEvent } from '../../shared/actions';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import { cardHead } from '../../shared/templates';
import type { GlassCardConfig, HomeAssistant } from '../../shared/types';
import { allEntities, countOn, isOn, masterService, type LightRoom } from './logic';
import './editor';

export interface LightsConfig extends GlassCardConfig {
  /**
   * Rooms shown as tiles. Tap toggles the room's entities, hold opens more-info.
   * The "x / y lights on" counter and the master switch cover every listed entity.
   */
  rooms: LightRoom[];
}

@customElement('glass-lights-card')
export class GlassLightsCard extends GlassCard<LightsConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .summary {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
      }
      .count {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.1;
      }
      .count .total {
        font-weight: 500;
        color: var(--g-text-2);
        font-size: 28px;
      }
      .sub {
        font-size: 14px;
        color: var(--g-text-2);
      }
      .switch {
        position: relative;
        width: 52px;
        height: 32px;
        border-radius: 16px;
        background: var(--g-track);
        transition: background 0.25s ease;
        margin-bottom: 6px;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        transition: transform 0.25s ease;
      }
      .switch[aria-checked='true'] {
        background: var(--g-accent);
      }
      .switch[aria-checked='true']::after {
        transform: translateX(20px);
      }
      .rooms {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
        gap: 8px;
        margin-top: 14px;
        align-items: stretch;
      }
      .room {
        min-height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px 2px;
        border-radius: 16px;
        background: var(--g-chip);
        color: var(--g-text-2);
        font-size: 11.5px;
        line-height: 1.15;
        text-align: center;
        cursor: pointer;
        user-select: none;
        --mdc-icon-size: 22px;
        transition:
          background 0.2s ease,
          color 0.2s ease;
      }
      .room[aria-pressed='true'] {
        background: color-mix(in srgb, var(--g-accent) 16%, var(--g-chip));
        color: var(--g-accent);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--g-accent) 30%, transparent);
      }
    `,
  ];

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-lights-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<LightsConfig> {
    const light = findEntity(hass, 'light') ?? 'light.living_room';
    return { rooms: [{ name: 'Living Room', icon: 'mdi:sofa', entities: [light] }] };
  }

  protected validateConfig(config: LightsConfig): void {
    if (!Array.isArray(config.rooms) || config.rooms.length === 0) {
      throw new Error('"rooms" must list at least one room');
    }
    for (const room of config.rooms) {
      if (!room.name || !Array.isArray(room.entities) || room.entities.length === 0) {
        throw new Error('each room needs a "name" and a non-empty "entities" list');
      }
    }
  }

  protected watchedEntities(): string[] {
    return this._config ? allEntities(this._config.rooms) : [];
  }

  private _call(service: 'turn_on' | 'turn_off' | 'toggle', ids: string[]): void {
    void this.hass?.callService('homeassistant', service, { entity_id: ids });
  }

  private _roomPress(room: LightRoom): Press {
    return new Press(
      () => this._call('toggle', room.entities),
      () => fireEvent(this, 'hass-more-info', { entityId: room.entities[0] }),
    );
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const states = this.hass?.states ?? {};
    const ids = allEntities(c.rooms);
    const onCount = countOn(states, ids);

    return html`<div class="glass">
      ${cardHead('mdi:lightbulb', c.name ?? this.t('lights.title'), 'var(--g-yellow)')}
      <div class="summary">
        <div>
          <div class="count">${onCount}<span class="total"> / ${ids.length}</span></div>
          <div class="sub">${this.t('lights.on')}</div>
        </div>
        <button
          class="switch"
          role="switch"
          aria-checked=${onCount > 0}
          aria-label=${this.t('lights.toggle_all')}
          @click=${() => this._call(masterService(onCount), ids)}
        ></button>
      </div>
      <div class="rooms">
        ${c.rooms.map((room) => {
          const press = this._roomPress(room);
          const active = room.entities.some((id) => isOn(states, id));
          return html`<div
            class="room"
            role="button"
            tabindex="0"
            aria-pressed=${active}
            @pointerdown=${press.down}
            @pointerup=${press.up}
            @pointerleave=${press.cancel}
            @pointercancel=${press.cancel}
            @keydown=${press.key}
            @contextmenu=${(e: Event) => e.preventDefault()}
          >
            <ha-icon .icon=${room.icon ?? 'mdi:lightbulb'}></ha-icon>
            <span>${room.name}</span>
          </div>`;
        })}
      </div>
    </div>`;
  }

  public getGridOptions() {
    return { columns: 6, rows: 4 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-lights-card': GlassLightsCard;
  }
}

registerCard({
  type: 'glass-lights-card',
  name: 'Glass Lights',
  description: 'Lights summary, master switch and one tile per room.',
});
