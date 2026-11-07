/** Color names produced by the Home Assistant `ui_color` selector (-> `--<name>-color`). */
const NAMED = new Set([
  'primary',
  'accent',
  'red',
  'pink',
  'purple',
  'deep-purple',
  'indigo',
  'blue',
  'light-blue',
  'cyan',
  'teal',
  'green',
  'light-green',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deep-orange',
  'brown',
  'light-grey',
  'grey',
  'dark-grey',
  'blue-grey',
  'black',
  'white',
  'disabled',
]);

/**
 * Turns a card `color` option into a CSS color.
 * Accepts HA color names ("red", "deep-orange"), any CSS color ("#ff0000", "rgb(…)", "var(--x)").
 * Returns undefined for empty / "state" (meaning: keep the card's default).
 */
export function resolveColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (v === '' || v === 'state' || v === 'none') return undefined;
  return NAMED.has(v) ? `var(--${v}-color)` : v;
}
