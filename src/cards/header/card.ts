import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { navigate, openQuickBar, runAction } from '../../shared/actions';
import { GlassCard } from '../../shared/base-card';
import { findEntity, numAttr, stateLabel, strAttr, toNumber } from '../../shared/entities';
import { formatNumber, formatTime } from '../../shared/format';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import type { ActionConfig, GlassCardConfig, HomeAssistant } from '../../shared/types';
import { currentPerson, greetingKey, weatherLook } from './logic';
import './editor';

export interface HeaderConfig extends GlassCardConfig {
  /** weather.* entity: provides temperature, condition and humidity. */
  weather_entity?: string;
  /** Overrides the temperature read from the weather entity. */
  outdoor_temperature_entity?: string;
  /** Overrides the humidity read from the weather entity. */
  humidity_entity?: string;
  /** person.* entity for the avatar (default: the person linked to the logged-in user). */
  person_entity?: string;
  /** Append the first name to the greeting ("Good morning, Alex"). */
  show_name?: boolean;
  /** Title of the compact mobile top bar (default "Home"). */
  title?: string;
  /** Default: open the HA quick bar. */
  search_action?: ActionConfig;
  /** Default: navigate to /profile. */
  profile_action?: ActionConfig;
}

@customElement('glass-header-card')
export class GlassHeaderCard extends GlassCard<HeaderConfig> {
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
      .head {
        display: grid;
        grid-template-columns: 1fr auto auto;
        grid-template-areas: 'greeting weather actions';
        align-items: center;
        gap: 16px;
      }
      .greeting {
        grid-area: greeting;
        min-width: 0;
      }
      h1 {
        margin: 0;
        font-size: 38px;
        line-height: 1.1;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .wave {
        font-size: 0.9em;
      }
      .subtitle {
        margin-top: 4px;
        font-size: 16px;
        color: var(--g-text-2);
      }
      .brand {
        grid-area: brand;
        display: none;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;
        color: var(--g-accent);
        --mdc-icon-size: 24px;
      }
      .brand span {
        color: var(--g-text);
      }
      .weather {
        grid-area: weather;
        display: flex;
        align-items: center;
        gap: 14px;
        height: 54px;
        padding: 0 18px;
        border-radius: 27px;
        background: var(--g-surface);
        border: 1px solid var(--g-border);
        box-shadow: var(--g-shadow);
        backdrop-filter: blur(var(--g-blur)) saturate(180%);
        -webkit-backdrop-filter: blur(var(--g-blur)) saturate(180%);
        --mdc-icon-size: 28px;
      }
      .metric {
        display: flex;
        align-items: center;
        gap: 8px;
        line-height: 1.15;
      }
      .metric b {
        display: block;
        font-size: 17px;
        font-weight: 600;
      }
      .metric small {
        display: block;
        font-size: 12px;
        color: var(--g-text-2);
      }
      .metric.humidity {
        --mdc-icon-size: 22px;
        color: var(--g-accent);
      }
      .metric.humidity > div {
        color: var(--g-text);
      }
      .divider {
        width: 1px;
        height: 26px;
        background: var(--g-border);
      }
      .actions {
        grid-area: actions;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: var(--g-surface);
        border: 1px solid var(--g-border);
        box-shadow: var(--g-shadow);
        backdrop-filter: blur(var(--g-blur));
        -webkit-backdrop-filter: blur(var(--g-blur));
        --mdc-icon-size: 22px;
      }
      .circle img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .circle .initial {
        font-weight: 600;
        font-size: 17px;
      }

      /* ---- compact (tablet / phone) ---- */
      @container (max-width: 820px) {
        h1 {
          font-size: 32px;
        }
        .circle {
          width: 44px;
          height: 44px;
        }
      }
      @container (max-width: 560px) {
        .head {
          grid-template-columns: 1fr auto;
          grid-template-areas:
            'brand actions'
            'greeting greeting'
            'weather weather';
          gap: 14px 12px;
        }
        .brand {
          display: flex;
        }
        h1 {
          font-size: 26px;
        }
        .subtitle {
          font-size: 14px;
        }
        .weather {
          justify-content: space-around;
          height: 50px;
        }
        .circle {
          width: 38px;
          height: 38px;
        }
      }
    `,
  ];

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-header-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<HeaderConfig> {
    return { weather_entity: findEntity(hass, 'weather') ?? 'weather.home' };
  }

  protected watchedEntities(): string[] {
    const c = this._config;
    if (!c) return [];
    const person = c.person_entity ?? currentPerson(this.hass);
    return [c.weather_entity, c.outdoor_temperature_entity, c.humidity_entity, person].filter(
      (id): id is string => typeof id === 'string',
    );
  }

  protected get refreshInterval(): number {
    return 30_000; // clock
  }

  protected load(): void {
    this.requestUpdate();
  }

  private _outsideTemp(): string | undefined {
    const c = this._config!;
    const states = this.hass?.states ?? {};
    const sensor = c.outdoor_temperature_entity ? states[c.outdoor_temperature_entity] : undefined;
    const weather = c.weather_entity ? states[c.weather_entity] : undefined;
    const value = sensor ? toNumber(sensor.state) : numAttr(weather, 'temperature');
    if (value === undefined) return undefined;
    const unit =
      strAttr(sensor, 'unit_of_measurement') ??
      strAttr(weather, 'temperature_unit') ??
      this.hass?.config?.unit_system?.temperature ??
      '°C';
    return `${formatNumber(this.hass, value, 1)}${unit}`;
  }

  private _humidity(): string | undefined {
    const c = this._config!;
    const states = this.hass?.states ?? {};
    const sensor = c.humidity_entity ? states[c.humidity_entity] : undefined;
    const weather = c.weather_entity ? states[c.weather_entity] : undefined;
    const value = sensor ? toNumber(sensor.state) : numAttr(weather, 'humidity');
    return value === undefined ? undefined : `${formatNumber(this.hass, value, 0)}%`;
  }

  private _weatherPill(): TemplateResult | typeof nothing {
    const c = this._config!;
    const weather = c.weather_entity ? this.hass?.states[c.weather_entity] : undefined;
    const temp = this._outsideTemp();
    const humidity = this._humidity();
    if (!weather && !temp && !humidity) return nothing;
    const look = weatherLook(weather?.state);
    return html`<div class="weather">
      ${
        temp || weather
          ? html`<div class="metric">
              <ha-icon .icon=${look.icon} style="color:${look.color}"></ha-icon>
              <div>
                <b>${temp ?? '–'}</b>
                ${weather ? html`<small>${stateLabel(this.hass, weather)}</small>` : nothing}
              </div>
            </div>`
          : nothing
      }
      ${(temp || weather) && humidity ? html`<span class="divider"></span>` : nothing}
      ${
        humidity
          ? html`<div class="metric humidity">
              <ha-icon icon="mdi:water"></ha-icon>
              <div>
                <b>${humidity}</b>
                <small>${this.t('header.humidity')}</small>
              </div>
            </div>`
          : nothing
      }
    </div>`;
  }

  private _avatar(): TemplateResult {
    const c = this._config!;
    const person = this.hass?.states[c.person_entity ?? currentPerson(this.hass) ?? ''];
    const picture = strAttr(person, 'entity_picture');
    const name = strAttr(person, 'friendly_name') ?? this.hass?.user?.name ?? '';
    return html`<button
      class="circle"
      aria-label=${this.t('header.profile')}
      @click=${() =>
        c.profile_action ? runAction(this, this.hass, c.profile_action) : navigate('/profile')}
    >
      ${
        picture
          ? html`<img src=${this.hass?.hassUrl(picture) ?? picture} alt=${name} />`
          : name
            ? html`<span class="initial">${name.charAt(0).toUpperCase()}</span>`
            : html`<ha-icon icon="mdi:account"></ha-icon>`
      }
    </button>`;
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const now = new Date();
    const temp = this._outsideTemp();
    const firstName = (this.hass?.user?.name ?? '').split(' ')[0];
    const greeting = this.t(greetingKey(now.getHours()));
    const time = formatTime(this.hass, now);

    return html`<div class="wrap">
      <div class="head">
        <div class="brand">
          <ha-icon icon="mdi:home"></ha-icon><span>${c.title ?? 'Home'}</span>
        </div>
        <div class="greeting">
          <h1>
            ${greeting}${c.show_name && firstName ? `, ${firstName}` : ''}
            <span class="wave">👋</span>
          </h1>
          <div class="subtitle">
            ${
              temp
                ? this.t('header.subtitle_outside', { time, temp })
                : this.t('header.subtitle', { time })
            }
          </div>
        </div>
        ${this._weatherPill()}
        <div class="actions">
          <button
            class="circle"
            aria-label=${this.t('header.search')}
            @click=${() =>
              c.search_action ? runAction(this, this.hass, c.search_action) : openQuickBar()}
          >
            <ha-icon icon="mdi:magnify"></ha-icon>
          </button>
          ${this._avatar()}
        </div>
      </div>
    </div>`;
  }

  public getGridOptions() {
    return { columns: 12, rows: 2, min_columns: 6, min_rows: 1 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-header-card': GlassHeaderCard;
  }
}

registerCard({
  type: 'glass-header-card',
  name: 'Glass Header',
  description: 'Greeting, clock, weather pill, search and profile avatar.',
});
