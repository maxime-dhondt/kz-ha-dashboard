import en from './translations/en';
import fr from './translations/fr';
import type { HomeAssistant } from './types';

const dictionaries: Record<string, Record<string, string>> = { en, fr };

/** Base language code ("fr-FR" -> "fr") following the user's HA profile. */
export function languageOf(hass?: Pick<HomeAssistant, 'language' | 'locale'>): string {
  const raw = hass?.locale?.language ?? hass?.language ?? 'en';
  return raw.toLowerCase().split(/[-_]/)[0] ?? 'en';
}

/**
 * Translates `key` in the user's language (fallback: English, then the key itself).
 * `{placeholder}` tokens are replaced from `vars`.
 */
export function localize(
  hass: Pick<HomeAssistant, 'language' | 'locale'> | undefined,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[languageOf(hass)] ?? en;
  const template = dict[key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
