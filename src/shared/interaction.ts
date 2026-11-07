/** Elements that handle their own clicks: card-level tap/hold actions must ignore them. */
export const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, [role="button"], [role="switch"], ha-camera-stream';

interface MaybeElement {
  matches?: (selector: string) => boolean;
}

/**
 * True when the event passed through an interactive element before reaching `host`
 * (`path` is `event.composedPath()`).
 */
export function crossedInteractive(path: unknown[], host: unknown): boolean {
  for (const node of path) {
    if (node === host) return false;
    if ((node as MaybeElement).matches?.(INTERACTIVE_SELECTOR)) return true;
  }
  return false;
}
