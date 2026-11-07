import type { HassEntity, HomeAssistant } from './types';

export function domainOf(entityId: string): string {
  return entityId.split('.')[0] ?? '';
}

export function isUnavailable(stateObj?: HassEntity): boolean {
  return !stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown';
}

/** Parses a state string into a finite number, or undefined. */
export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function numAttr(stateObj: HassEntity | undefined, key: string): number | undefined {
  return toNumber(stateObj?.attributes[key]);
}

export function strAttr(stateObj: HassEntity | undefined, key: string): string | undefined {
  const v = stateObj?.attributes[key];
  return typeof v === 'string' && v !== '' ? v : undefined;
}

export function entityName(stateObj: HassEntity | undefined, fallback = ''): string {
  return strAttr(stateObj, 'friendly_name') ?? fallback;
}

/** Localized state label (uses HA's formatter when available). */
export function stateLabel(hass: HomeAssistant | undefined, stateObj: HassEntity): string {
  if (hass?.formatEntityState) return hass.formatEntityState(stateObj);
  const s = stateObj.state;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

/** First entity of a domain, used to pre-fill stub configs in the card picker. */
export function findEntity(hass: HomeAssistant | undefined, domain: string): string | undefined {
  return Object.keys(hass?.states ?? {}).find((id) => domainOf(id) === domain);
}

/** Reasonable icon when the entity does not define one. */
export function defaultIcon(stateObj?: HassEntity): string {
  if (!stateObj) return 'mdi:help-circle-outline';
  const custom = strAttr(stateObj, 'icon');
  if (custom) return custom;
  const domain = domainOf(stateObj.entity_id);
  const deviceClass = strAttr(stateObj, 'device_class');
  const open = stateObj.state === 'open' || stateObj.state === 'on' || stateObj.state === 'opening';
  switch (domain) {
    case 'lock':
      return stateObj.state === 'locked' ? 'mdi:lock' : 'mdi:lock-open-variant';
    case 'cover':
      if (deviceClass === 'garage') return open ? 'mdi:garage-open' : 'mdi:garage';
      if (deviceClass === 'door') return open ? 'mdi:door-open' : 'mdi:door-closed';
      return open ? 'mdi:window-shutter-open' : 'mdi:window-shutter';
    case 'binary_sensor':
      if (deviceClass === 'door') return open ? 'mdi:door-open' : 'mdi:door-closed';
      if (deviceClass === 'window') return open ? 'mdi:window-open' : 'mdi:window-closed';
      if (deviceClass === 'motion') return open ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
      return open ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank';
    case 'calendar':
      return 'mdi:calendar-month';
    case 'light':
      return 'mdi:lightbulb';
    case 'switch':
      return 'mdi:toggle-switch';
    case 'climate':
      return 'mdi:thermostat';
    case 'sensor':
      return deviceClass === 'temperature' ? 'mdi:thermometer' : 'mdi:eye';
    default:
      return 'mdi:information-outline';
  }
}
