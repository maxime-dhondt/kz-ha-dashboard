import { html, LitElement, type TemplateResult } from 'lit';
import { fireEvent } from './actions';
import { localize } from './i18n';
import type { HomeAssistant, LovelaceCardConfig } from './types';

/** Subset of the `ha-form` schema format. */
export interface FormSchema {
  name: string;
  required?: boolean;
  selector?: Record<string, unknown>;
  type?: string;
  schema?: FormSchema[];
}

export type SchemaBuilder = (hass: HomeAssistant | undefined) => FormSchema[];

/**
 * Registers the visual editor of a card. A card editor is just a list of
 * `ha-form` fields: see any `editor.ts` for an example.
 * Labels come from the `editor.<field name>` translation keys.
 */
export function defineEditor(tag: string, buildSchema: SchemaBuilder): void {
  if (customElements.get(tag)) return;

  class GlassEditor extends LitElement {
    static properties = {
      hass: { attribute: false },
      _config: { state: true },
    };

    declare hass?: HomeAssistant;
    declare _config?: LovelaceCardConfig;

    setConfig(config: LovelaceCardConfig): void {
      this._config = config;
    }

    render(): TemplateResult {
      if (!this._config) return html``;
      return html`<ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${buildSchema(this.hass)}
        .computeLabel=${(schema: FormSchema) => this._label(schema)}
        @value-changed=${this._valueChanged}
      ></ha-form>`;
    }

    private _label(schema: FormSchema): string {
      const key = `editor.${schema.name}`;
      const label = localize(this.hass, key);
      return label === key ? schema.name : label;
    }

    private _valueChanged(ev: CustomEvent<{ value: LovelaceCardConfig }>): void {
      ev.stopPropagation();
      fireEvent(this, 'config-changed', { config: ev.detail.value });
    }
  }

  customElements.define(tag, GlassEditor);
}

export const entitySelector = (domain?: string | string[]): Record<string, unknown> => ({
  entity: domain ? { domain } : {},
});

/** Free-form structured field edited as YAML (rooms, modes, items…). */
export const yamlSelector: Record<string, unknown> = { object: {} };
