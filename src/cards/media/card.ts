import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { GlassCard, requireEntity } from '../../shared/base-card';
import { entityName, findEntity, isUnavailable, numAttr, strAttr } from '../../shared/entities';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import { cardHead, missingEntity } from '../../shared/templates';
import type { GlassCardConfig, HomeAssistant, ActionConfig } from '../../shared/types';
import './editor';

export interface MediaConfig extends GlassCardConfig {
  /** media_player.* entity (required). */
  entity: string;
}

@customElement('glass-media-card')
export class GlassMediaCard extends GlassCard<MediaConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .now {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .art {
        flex: none;
        width: 66px;
        height: 66px;
        border-radius: 14px;
        overflow: hidden;
        display: grid;
        place-items: center;
        background: var(--g-chip);
        color: var(--g-text-2);
        --mdc-icon-size: 30px;
      }
      .art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .meta {
        min-width: 0;
      }
      .song {
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .artist {
        font-size: 13.5px;
        color: var(--g-text-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 26px;
        margin: auto 0 4px;
        padding-top: 8px;
        --mdc-icon-size: 24px;
      }
      .controls .skip {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        color: var(--g-text);
      }
      .controls .main {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--g-chip);
        box-shadow: inset 0 0 0 1px var(--g-border);
        --mdc-icon-size: 28px;
      }
      .volume {
        display: flex;
        align-items: center;
        gap: 10px;
        --mdc-icon-size: 20px;
        color: var(--g-text-2);
      }
      input[type='range'] {
        flex: 1;
        height: 22px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
      }
      input[type='range']::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--g-accent) var(--pct, 0%),
          var(--g-track) var(--pct, 0%)
        );
      }
      input[type='range']::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: var(--g-track);
      }
      input[type='range']::-moz-range-progress {
        height: 4px;
        border-radius: 2px;
        background: var(--g-accent);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        margin-top: -5px;
        border-radius: 50%;
        background: var(--g-accent);
        border: 2px solid #fff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      }
      input[type='range']::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--g-accent);
        border: 2px solid #fff;
      }
    `,
  ];

  /** Volume being dragged (0..1); avoids the slider jumping back while sliding. */
  @state() private _dragVolume?: number;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-media-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<MediaConfig> {
    return { entity: findEntity(hass, 'media_player') ?? 'media_player.living_room' };
  }

  protected validateConfig(config: MediaConfig): void {
    requireEntity(config, 'media_player');
  }

  protected watchedEntities(): string[] {
    const c = this._config;
    return c ? [c.entity] : [];
  }

  private _call(service: string, data: Record<string, unknown> = {}): void {
    void this.hass?.callService('media_player', service, {
      entity_id: this._config!.entity,
      ...data,
    });
  }

  private _onVolumeInput(ev: Event): void {
    this._dragVolume = Number((ev.target as HTMLInputElement).value) / 100;
  }

  private _onVolumeChange(ev: Event): void {
    const volume = Number((ev.target as HTMLInputElement).value) / 100;
    this._call('volume_set', { volume_level: volume });
    window.setTimeout(() => (this._dragVolume = undefined), 800);
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const stateObj = this.hass?.states[c.entity];
    if (!stateObj) return missingEntity(this.hass, c.entity);

    const off = isUnavailable(stateObj) || stateObj.state === 'off';
    const playing = stateObj.state === 'playing';
    const picture = strAttr(stateObj, 'entity_picture');
    const friendly = entityName(stateObj, this.t('media.title'));
    const title = off ? friendly : (strAttr(stateObj, 'media_title') ?? friendly);
    const subtitle = off
      ? this.t('media.off')
      : (strAttr(stateObj, 'media_artist') ?? strAttr(stateObj, 'app_name') ?? friendly);
    const volume = this._dragVolume ?? numAttr(stateObj, 'volume_level') ?? 0;
    const muted = stateObj.attributes.is_volume_muted === true;
    const hasVolume = stateObj.attributes.volume_level !== undefined;

    return html`<div class="glass">
      ${cardHead(
        this.iconFor('mdi:music'),
        c.name ?? this.t('media.title'),
        this.colorFor('var(--g-accent)'),
      )}
      <div class="now">
        <div class="art">
          ${
            picture
              ? html`<img src=${this.hass?.hassUrl(picture) ?? picture} alt="" />`
              : html`<ha-icon icon="mdi:music-note"></ha-icon>`
          }
        </div>
        <div class="meta">
          <div class="song">${title}</div>
          <div class="artist">${subtitle}</div>
        </div>
      </div>
      <div class="controls">
        <button
          class="skip"
          aria-label=${this.t('media.previous')}
          @click=${() => this._call('media_previous_track')}
        >
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </button>
        <button
          class="main"
          aria-label=${playing ? this.t('media.pause') : this.t('media.play')}
          @click=${() => this._call('media_play_pause')}
        >
          <ha-icon .icon=${playing ? 'mdi:pause' : 'mdi:play'}></ha-icon>
        </button>
        <button
          class="skip"
          aria-label=${this.t('media.next')}
          @click=${() => this._call('media_next_track')}
        >
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </button>
      </div>
      ${
        hasVolume
          ? html`<div class="volume">
              <button
                aria-label=${muted ? this.t('media.unmute') : this.t('media.mute')}
                @click=${() => this._call('volume_mute', { is_volume_muted: !muted })}
              >
                <ha-icon
                  .icon=${muted || volume === 0 ? 'mdi:volume-off' : 'mdi:volume-high'}
                ></ha-icon>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                aria-label=${this.t('media.volume')}
                .value=${String(Math.round(volume * 100))}
                style="--pct:${Math.round(volume * 100)}%"
                @input=${this._onVolumeInput}
                @change=${this._onVolumeChange}
              />
            </div>`
          : nothing
      }
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
    'glass-media-card': GlassMediaCard;
  }
}

registerCard({
  type: 'glass-media-card',
  name: 'Glass Media',
  description: 'Now playing with artwork, transport controls and a volume slider.',
});
