import { LitElement, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from './i18n';
import type { GlassCardConfig, HomeAssistant } from './types';

/**
 * Base class of every Glass card.
 *
 * Subclasses implement `render()` and, when relevant:
 *  - `validateConfig()`  throw an Error for an invalid config (HA shows it)
 *  - `watchedEntities()` entity ids that should trigger a re-render when they change
 *  - `load()`            fetch async data (history…); called on first `hass`, on
 *                        config change, and every `refreshInterval` ms
 *  - `refreshInterval`   periodic refresh (clock, history, image…)
 */
export abstract class GlassCard<C extends GlassCardConfig = GlassCardConfig> extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public dark = false;
  @state() protected _config?: C;

  private _hassSeen = false;
  private _timer?: number;

  public setConfig(config: C): void {
    this.validateConfig(config);
    this._config = config;
    this._restartTimer();
    if (this._hassSeen) this.load();
  }

  protected validateConfig(_config: C): void {}

  protected watchedEntities(): string[] {
    return [];
  }

  protected load(): void {}

  protected get refreshInterval(): number {
    return 0;
  }

  protected t(key: string, vars?: Record<string, string | number>): string {
    return localize(this.hass, key, vars);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._restartTimer();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
  }

  private _restartTimer(): void {
    window.clearInterval(this._timer);
    if (!this.isConnected) return;
    const every = this.refreshInterval;
    if (every > 0) this._timer = window.setInterval(() => this.load(), every);
  }

  /** Skip renders when none of the entities this card shows has changed. */
  protected shouldUpdate(changed: PropertyValues): boolean {
    if (!this._config) return false;
    if (!changed.has('hass') || changed.size > 1) return true;
    const previous = changed.get('hass') as HomeAssistant | undefined;
    const current = this.hass;
    if (!previous || !current) return true;
    if (
      previous.locale !== current.locale ||
      previous.language !== current.language ||
      previous.themes !== current.themes
    ) {
      return true;
    }
    return this.watchedEntities().some((id) => previous.states[id] !== current.states[id]);
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('hass')) this.dark = this.hass?.themes?.darkMode ?? false;
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('hass') && this.hass && !this._hassSeen) {
      this._hassSeen = true;
      this.load();
    }
  }

  /** Legacy masonry layout height (units of 50px). */
  public getCardSize(): number {
    return 3;
  }

  /** Sections-view sizing (12-column grid). */
  public getGridOptions(): { columns: number; rows: number | 'auto' } {
    return { columns: 6, rows: 3 };
  }
}

/** Throws when `entity` is missing; optionally checks the domain prefix. */
export function requireEntity(config: { entity?: unknown }, domain?: string): void {
  const entity = config.entity;
  if (typeof entity !== 'string' || entity === '') {
    throw new Error('"entity" is required');
  }
  if (domain && !entity.startsWith(`${domain}.`)) {
    throw new Error(`"entity" must be a ${domain}.* entity`);
  }
}
