import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fireEvent } from '../../shared/actions';
import { GlassCard, requireEntity } from '../../shared/base-card';
import { entityName, findEntity, isUnavailable, strAttr } from '../../shared/entities';
import { registerCard } from '../../shared/register';
import { glass, tokens } from '../../shared/styles';
import { cardHead, missingEntity } from '../../shared/templates';
import type { GlassCardConfig, HomeAssistant } from '../../shared/types';
import './editor';

export interface CameraConfig extends GlassCardConfig {
  /** camera.* entity (required). */
  entity: string;
  /** Still image refresh period in seconds (default 10). */
  refresh_interval?: number;
}

@customElement('glass-camera-card')
export class GlassCameraCard extends GlassCard<CameraConfig> {
  static styles = [
    tokens,
    glass,
    css`
      .live {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--g-green);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--g-green) 25%, transparent);
      }
      .dot.off {
        background: var(--g-text-2);
        box-shadow: none;
      }
      .view {
        position: relative;
        flex: 1;
        min-height: 120px;
        border-radius: 18px;
        overflow: hidden;
        background: rgba(20, 28, 48, 0.35);
      }
      .view img,
      .view ha-camera-stream {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .play {
        position: absolute;
        right: 10px;
        bottom: 10px;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background: rgba(30, 38, 58, 0.55);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        --mdc-icon-size: 24px;
      }
    `,
  ];

  @state() private _tick = Date.now();
  @state() private _live = false;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-camera-card-editor');
  }

  static getStubConfig(hass?: HomeAssistant): Partial<CameraConfig> {
    return { entity: findEntity(hass, 'camera') ?? 'camera.front_door' };
  }

  protected validateConfig(config: CameraConfig): void {
    requireEntity(config, 'camera');
  }

  protected watchedEntities(): string[] {
    const c = this._config;
    return c ? [c.entity] : [];
  }

  protected get refreshInterval(): number {
    return (this._config?.refresh_interval ?? 10) * 1000;
  }

  protected load(): void {
    this._tick = Date.now();
  }

  private _imageUrl(picture: string): string {
    const url = this.hass?.hassUrl(picture) ?? picture;
    if (url.startsWith('data:')) return url;
    return `${url}${url.includes('?') ? '&' : '?'}_t=${this._tick}`;
  }

  private _togglePlay(): void {
    const c = this._config!;
    if (!customElements.get('ha-camera-stream')) {
      fireEvent(this, 'hass-more-info', { entityId: c.entity });
      return;
    }
    this._live = !this._live;
  }

  protected render(): TemplateResult {
    const c = this._config!;
    const stateObj = this.hass?.states[c.entity];
    if (!stateObj) return missingEntity(this.hass, c.entity);

    const offline = isUnavailable(stateObj);
    const picture = strAttr(stateObj, 'entity_picture');
    const name = c.name ?? entityName(stateObj, this.t('camera.title'));

    return html`<div class="glass">
      ${cardHead(
        'mdi:video',
        name,
        'var(--g-slate)',
        html`<span class="live"
          ><span class="dot ${offline ? 'off' : ''}"></span>${
            offline ? this.t('camera.offline') : this.t('camera.live')
          }</span
        >`,
      )}
      <div class="view">
        ${
          this._live
            ? html`<ha-camera-stream
                .hass=${this.hass}
                .stateObj=${stateObj}
                muted
                playsinline
              ></ha-camera-stream>`
            : picture
              ? html`<img src=${this._imageUrl(picture)} alt=${name} />`
              : nothing
        }
        <button
          class="play"
          aria-label=${this._live ? this.t('camera.stop') : this.t('camera.play')}
          @click=${() => this._togglePlay()}
        >
          <ha-icon .icon=${this._live ? 'mdi:stop' : 'mdi:play'}></ha-icon>
        </button>
      </div>
    </div>`;
  }

  public getGridOptions() {
    return { columns: 6, rows: 4 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-camera-card': GlassCameraCard;
  }
}

registerCard({
  type: 'glass-camera-card',
  name: 'Glass Camera',
  description: 'Camera snapshot with a live badge and one-tap live stream.',
});
