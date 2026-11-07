/**
 * Tap / long-press detection for templates.
 *
 *   const p = new Press(() => tap(), () => hold());
 *   html`<div @pointerdown=${p.down} @pointerup=${p.up}
 *            @pointerleave=${p.cancel} @pointercancel=${p.cancel}
 *            @keydown=${p.key}></div>`
 */
export class Press {
  private timer?: number;
  private held = false;

  constructor(
    private readonly onTap: () => void,
    private readonly onHold?: () => void,
    private readonly holdMs = 500,
  ) {}

  down = (): void => {
    this.held = false;
    if (!this.onHold) return;
    this.timer = window.setTimeout(() => {
      this.held = true;
      this.onHold?.();
    }, this.holdMs);
  };

  up = (): void => {
    window.clearTimeout(this.timer);
    if (!this.held) this.onTap();
    this.held = false;
  };

  cancel = (): void => {
    window.clearTimeout(this.timer);
    this.held = false;
  };

  /** Keyboard accessibility: Enter / Space behave like a tap. */
  key = (ev: KeyboardEvent): void => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.onTap();
    }
  };
}
