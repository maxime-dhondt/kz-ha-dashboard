import * as mdi from '@mdi/js';

/**
 * `ha-icon` is provided by the Home Assistant frontend. In the local preview we
 * stand in for it with a minimal element that draws the matching MDI path.
 */
const paths = mdi as unknown as Record<string, string>;

const camel = (name: string): string =>
  'mdi' +
  name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

class HaIconShim extends HTMLElement {
  static observedAttributes = ['icon'];
  private _icon = '';
  // Shadow DOM, like the real ha-icon: light-DOM children would shift Lit's template part indexes.
  private readonly _root = this.attachShadow({ mode: 'open' });

  get icon(): string {
    return this._icon;
  }
  set icon(value: string) {
    this._icon = value;
    this._render();
  }

  attributeChangedCallback(_n: string, _o: string | null, value: string | null): void {
    this.icon = value ?? '';
  }

  connectedCallback(): void {
    this._render();
  }

  private _render(): void {
    const name = this._icon.replace(/^mdi:/, '');
    const d = paths[camel(name)] ?? '';
    this._root.innerHTML = `<style>:host{display:inline-flex}</style><svg viewBox="0 0 24 24" fill="currentColor"
      style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)"><path d="${d}"/></svg>`;
  }
}

customElements.define('ha-icon', HaIconShim);
