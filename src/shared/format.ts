import { languageOf } from './i18n';
import type { HomeAssistant } from './types';

type LocaleHass = Pick<HomeAssistant, 'language' | 'locale'> | undefined;

/** Honors the user's 12h/24h profile setting; undefined = locale default. */
function hour12Of(hass: LocaleHass): boolean | undefined {
  const pref = hass?.locale?.time_format;
  if (pref === '12') return true;
  if (pref === '24') return false;
  return undefined;
}

/** "10:24 AM" / "10:24". */
export function formatTime(hass: LocaleHass, date: Date): string {
  return new Intl.DateTimeFormat(languageOf(hass), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: hour12Of(hass),
  }).format(date);
}

/** "Mon, Nov 3". */
export function formatShortDate(hass: LocaleHass, date: Date): string {
  return new Intl.DateTimeFormat(languageOf(hass), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Compact hour label for chart axes: "6AM", "12PM" or "06h". */
export function formatHourLabel(hass: LocaleHass, date: Date): string {
  return new Intl.DateTimeFormat(languageOf(hass), { hour: 'numeric', hour12: hour12Of(hass) })
    .format(date)
    .replace(/[\s\u202f\u00a0]/g, '');
}

export function formatNumber(hass: LocaleHass, value: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat(languageOf(hass), {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}
