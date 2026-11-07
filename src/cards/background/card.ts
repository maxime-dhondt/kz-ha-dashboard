import { css, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassCard, type GridOptions } from '../../shared/base-card';
import { registerCard } from '../../shared/register';
import type { GlassCardConfig } from '../../shared/types';
import { findView, isMediaSource, toCssBackground } from '../../shared/view';
import './editor';

export interface BackgroundConfig extends GlassCardConfig {
  /**
   * Picture or CSS background of the whole view: `/local/house.jpg`, `https://…`,
   * `media-source://image_upload/<id>` (Settings → Media → Image upload) or a full CSS value.
   */
  background: string;
}

/**
 * Invisible card that paints the Lovelace view behind the other cards. It exists so the picture can be a
 * Home Assistant media source, which the view's own `background` option cannot resolve.
 */
@customElement('glass-background-card')
export class GlassBackgroundCard extends GlassCard<BackgroundConfig> {
  static styles = css`
    :host {
      display: block;
      height: 0;
    }
  `;

  private _applied?: string;
  private _view?: HTMLElement;

  static getConfigElement(): HTMLElement {
    return document.createElement('glass-background-card-editor');
  }

  static getStubConfig(): Partial<BackgroundConfig> {
    return { background: 'media-source://image_upload/<id>' };
  }

  protected validateConfig(config: BackgroundConfig): void {
    if (!config.background) throw new Error('"background" is required');
  }

  protected watchedEntities(): string[] {
    return [];
  }

  protected load(): void {
    void this._apply();
  }

  private async _apply(): Promise<void> {
    const config = this._config;
    if (!config || !this.hass) return;
    const view = (this._view ??= findView(this));
    if (!view || this._applied === config.background) return;
    this._applied = config.background;
    let url: string | undefined;
    if (isMediaSource(config.background)) {
      try {
        const res = await this.hass.callWS<{ url: string }>({
          type: 'media_source/resolve_media',
          media_content_id: config.background,
          expires: 3600 * 24,
        });
        url = this.hass.hassUrl ? this.hass.hassUrl(res.url) : res.url;
      } catch (err) {
        console.warn('glass-background-card: cannot resolve', config.background, err);
        this._applied = undefined;
        return;
      }
    }
    view.style.setProperty('background', toCssBackground(config.background, url));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._view?.style.removeProperty('background');
    this._view = undefined;
    this._applied = undefined;
  }

  protected render(): TemplateResult {
    return html``;
  }

  public getGridOptions(): GridOptions {
    return { columns: 12, rows: 1, min_columns: 3, min_rows: 1 };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'glass-background-card': GlassBackgroundCard;
  }
}

registerCard({
  type: 'glass-background-card',
  name: 'Glass Background',
  description: 'Invisible card: sets the view picture (URL, /local file or media-source://).',
});
