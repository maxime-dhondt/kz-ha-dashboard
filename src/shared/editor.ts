import { html, LitElement, type TemplateResult } from 'lit';
import { fireEvent } from './actions';
import { localize } from './i18n';
import type { HomeAssistant, LovelaceCardConfig } from './types';

/** Subset of the `ha-form` schema format. */
export interface FormSchema {
  name: string;
  required?: boolean;
  selector?: Record<string, unknown>;
  /** `grid` or `expandable` for layout containers. */
  type?: string;
  schema?: FormSchema[];
  /** Container only: keep the data flat (no nested object). */
  flatten?: boolean;
  /** `expandable` only: open by default. */
  expanded?: boolean;
}

/** Translate an `editor.*` key (without the prefix) in the user's language. */
export type EditorT = (key: string) => string;

export type SchemaBuilder = (hass: HomeAssistant | undefined, t: EditorT) => FormSchema[];

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
      const t: EditorT = (key) => localize(this.hass, `editor.${key}`);
      return html`<ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${buildSchema(this.hass, t)}
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

export const entitiesSelector = (domain?: string | string[]): Record<string, unknown> => ({
  entity: domain ? { multiple: true, domain } : { multiple: true },
});

/** Free-form structured field edited as YAML (used where no visual editor exists). */
export const yamlSelector: Record<string, unknown> = { object: {} };

/** One column of a visual list editor. */
export interface ListField {
  selector: Record<string, unknown>;
  label: string;
  required?: boolean;
}

/**
 * Visual editor for a list of objects (rooms, modes, items…): rows can be added, removed and
 * reordered, each field uses a native selector (entity picker, icon picker, action editor…).
 * Backed by the Home Assistant `object` selector (`multiple` + `fields`).
 */
export function listSelector(options: {
  /** Field shown as the title of each row. */
  labelField: string;
  descriptionField?: string;
  fields: Record<string, ListField>;
}): Record<string, unknown> {
  return {
    object: {
      multiple: true,
      label_field: options.labelField,
      ...(options.descriptionField ? { description_field: options.descriptionField } : {}),
      fields: options.fields,
    },
  };
}

/** `name`, `icon`, `color` – the options every Glass card shares. */
export function appearanceSection(): FormSchema {
  return {
    type: 'expandable',
    name: 'appearance',
    flatten: true,
    schema: [
      { name: 'name', selector: { text: {} } },
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'icon', selector: { icon: {} } },
          { name: 'color', selector: { ui_color: {} } },
        ],
      },
    ],
  };
}

/** `tap_action` / `hold_action` of the card body. */
export function interactionsSection(defaultTap = 'more-info'): FormSchema {
  return {
    type: 'expandable',
    name: 'interactions',
    flatten: true,
    schema: [
      { name: 'tap_action', selector: { ui_action: { default_action: defaultTap } } },
      { name: 'hold_action', selector: { ui_action: { default_action: 'none' } } },
    ],
  };
}
