import { html, nothing, type TemplateResult } from 'lit';
import { localize } from './i18n';
import type { HomeAssistant } from './types';

/** Standard card header: tinted icon bubble + title (+ optional trailing content). */
export function cardHead(
  icon: string,
  title: string,
  color?: string,
  trailing?: TemplateResult | typeof nothing,
): TemplateResult {
  return html`<div class="card-head">
    <span class="bubble" style=${color ? `--bubble:${color}` : ''}
      ><ha-icon .icon=${icon}></ha-icon
    ></span>
    <span class="title">${title}</span>
    ${trailing ? html`<span class="spacer"></span>${trailing}` : nothing}
  </div>`;
}

/** Shown when a configured entity does not exist in the HA instance. */
export function missingEntity(hass: HomeAssistant | undefined, entityId: string): TemplateResult {
  return html`<div class="glass">
    <div class="missing">
      <ha-icon icon="mdi:help-circle-outline"></ha-icon>
      <span>${localize(hass, 'common.entity_not_found')}</span>
      <code title=${entityId}>${entityId}</code>
    </div>
  </div>`;
}
