/**
 * Minimal Home Assistant typings. We deliberately do not depend on
 * `custom-card-helpers`: only what the cards really use is declared here.
 */

export type EntityAttributes = Record<string, unknown>;

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: EntityAttributes;
  last_changed: string;
  last_updated: string;
}

export interface HassLocale {
  language: string;
  /** 'language' | 'system' | '12' | '24' */
  time_format?: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
  locale?: HassLocale;
  themes?: { darkMode?: boolean };
  user?: { id: string; name: string; is_admin?: boolean };
  config?: { unit_system?: { temperature?: string } };
  hassUrl(path?: string): string;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id?: string | string[] },
  ): Promise<unknown>;
  callWS<T = unknown>(message: Record<string, unknown>): Promise<T>;
  /** Present in recent Home Assistant versions; returns a localized state label. */
  formatEntityState?(stateObj: HassEntity, state?: string): string;
}

/** Base shape of any Lovelace card configuration. */
export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

/** Config shared by every Glass card. */
export interface GlassCardConfig extends LovelaceCardConfig {
  /** Overrides the default card title. */
  name?: string;
}

export type ActionType =
  'more-info' | 'toggle' | 'call-service' | 'perform-action' | 'navigate' | 'url' | 'none';

/** Same shape as the native Home Assistant `tap_action` / `hold_action`. */
export interface ActionConfig {
  action: ActionType;
  entity?: string;
  navigation_path?: string;
  url_path?: string;
  /** `domain.service` (new name). */
  perform_action?: string;
  /** `domain.service` (legacy name). */
  service?: string;
  data?: Record<string, unknown>;
  service_data?: Record<string, unknown>;
  target?: { entity_id?: string | string[] };
}

/** Element contract for a rendered Lovelace card. */
export type CardElement = HTMLElement & {
  hass?: HomeAssistant;
  setConfig?(config: LovelaceCardConfig): void;
};

export type LayoutSize = 'desktop' | 'tablet' | 'mobile';
