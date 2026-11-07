import { LitElement, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { runAction } from './actions';
import { resolveColor } from './colors';
import { localize } from './i18n';
import { crossedInteractive } from './interaction';
import { Press } from './press';
import type { ActionConfig, GlassCardConfig, HomeAssistant } from './types';

/**
 * Base class of every Glass card.
 *
 * Subclasses implement `render()` and, when relevant:
 *  - `validateConfig()`  throw an Error for an invalid config (HA shows it)
 *  - `watchedEntities()` entity ids that should trigger a re-render when they change
 *  - `load()`            fetch async data (history…); called on first `hass`, on
 *                        config change, and every `refreshInterval` ms
 *  - `refreshInterval`   periodic refresh (clock, history, image…)
 *  - `defaultTapAction()` action of a tap on the card body when `tap_action` is not set
 *
 * Common options handled here for every card: `icon`, `color`, `tap_action`, `hold_action`.
 * Cards read them through `iconFor()` / `colorFor()`.
 */
export abstract class GlassCard<C extends GlassCardConfig = GlassCardConfig> extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public dark = false;
  /** Reflects whether tapping / holding the card body does something (cursor: pointer). */
  @property({ type: Boolean, reflect: true }) public actionable = false;
  @state() protected _config?: C;

  private _hassSeen = false;
  private _timer?: number;
  private _press?: Press;

  public setConfig(config: C): void {
    this.validateConfig(config);
    this._config = config;
    this._setupPress();
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

  /** Header icon: the `icon` option, else the card's default. */
  protected iconFor(defaultIcon: string): string {
    return this._config?.icon || defaultIcon;
  }

  /** Header bubble color: the `color` option, else the card's default. */
  protected colorFor(defaultColor: string): string {
    return resolveColor(this._config?.color) ?? defaultColor;
  }

  /** Action of a tap on the card body when `tap_action` is not configured. */
  protected defaultTapAction(): ActionConfig | undefined {
    return undefined;
  }

  private _tapAction(): ActionConfig | undefined {
    return this._config?.tap_action ?? this.defaultTapAction();
  }

  private _setupPress(): void {
    const hold = this._config?.hold_action;
    const hasHold = !!hold && hold.action !== 'none';
    this._press = new Press(
      () => runAction(this, this.hass, this._tapAction()),
      hasHold ? () => runAction(this, this.hass, hold) : undefined,
    );
    const tap = this._tapAction();
    this.actionable = (!!tap && tap.action !== 'none') || hasHold;
  }

  private _onPointer = (ev: PointerEvent): void => {
    if (!this.actionable || !this._press) return;
    if (ev.type === 'pointerleave' || ev.type === 'pointercancel') {
      this._press.cancel();
    } else if (crossedInteractive(ev.composedPath(), this)) {
      this._press.cancel();
    } else if (ev.type === 'pointerdown') {
      this._press.down();
    } else if (ev.type === 'pointerup') {
      this._press.up();
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    for (const type of ['pointerdown', 'pointerup', 'pointerleave', 'pointercancel']) {
      this.addEventListener(type, this._onPointer as EventListener);
    }
    this._restartTimer();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const type of ['pointerdown', 'pointerup', 'pointerleave', 'pointercancel']) {
      this.removeEventListener(type, this._onPointer as EventListener);
    }
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
    if (changed.has('_config')) {
      const accent = resolveColor(this._config?.color);
      if (accent) this.style.setProperty('--glass-accent', accent);
      else this.style.removeProperty('--glass-accent');
    }
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
