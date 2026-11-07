/** Helpers for cards that act on the Lovelace view that contains them (best effort). */

const VIEW_TAG = /^hui-(sections|masonry|panel)-view$/i;

/** Nearest view element above `start`, crossing shadow roots. */
export function findView(start: Node): HTMLElement | undefined {
  let node: Node | null = start;
  while (node) {
    if (node instanceof HTMLElement && VIEW_TAG.test(node.localName)) return node;
    const root: Node = node.getRootNode();
    node = node.parentNode ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return undefined;
}

/** `media-source://image_upload/<id>` style identifiers need a websocket call to become a URL. */
export function isMediaSource(value: string): boolean {
  return value.startsWith('media-source://');
}

/**
 * Turns the user's `background` option into a CSS `background` value.
 * - a bare image URL / path (`/local/x.jpg`, `https://…`) becomes `center / cover url(…)`;
 * - anything containing `url(` or a gradient is used as is;
 * - `media-source://…` must be resolved first (see `resolveMediaSource`) and then passed as a URL.
 */
export function toCssBackground(value: string, url?: string): string {
  const v = value.trim();
  if (/url\(|gradient\(|^#|^rgb|^hsl/i.test(v)) return v;
  const target = url ?? v;
  return `center / cover no-repeat url("${target.replace(/"/g, '%22')}") fixed`;
}
