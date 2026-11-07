import { css } from 'lit';

/**
 * Design tokens. Every value can be overridden from a HA theme or card-mod by
 * defining the matching `--glass-*` variable (see docs/THEMING.md).
 */
export const tokens = css`
  :host {
    --g-accent: var(--glass-accent, #2f7bff);
    --g-green: var(--glass-green, #1fb25a);
    --g-orange: var(--glass-orange, #ff9f0a);
    --g-yellow: var(--glass-yellow, #ffc400);
    --g-red: var(--glass-red, #ff453a);
    --g-slate: var(--glass-slate, #5b6477);
    --g-text: var(--glass-text, #121a2e);
    --g-text-2: var(--glass-text-secondary, #5d6985);
    --g-surface: var(--glass-surface, rgba(255, 255, 255, 0.6));
    --g-chip: var(--glass-chip, rgba(255, 255, 255, 0.55));
    --g-track: var(--glass-track, rgba(110, 125, 165, 0.28));
    --g-border: var(--glass-border, rgba(255, 255, 255, 0.72));
    --g-shadow: var(--glass-shadow, 0 8px 30px rgba(40, 60, 120, 0.14));
    --g-radius: var(--glass-radius, 26px);
    --g-blur: var(--glass-blur, 26px);
    font-family: var(
      --glass-font,
      -apple-system,
      BlinkMacSystemFont,
      'SF Pro Display',
      'Inter',
      'Segoe UI',
      Roboto,
      sans-serif
    );
    color: var(--g-text);
    -webkit-font-smoothing: antialiased;
  }

  :host([dark]) {
    --g-accent: var(--glass-accent, #5c9dff);
    --g-slate: var(--glass-slate, #b4bdd6);
    --g-text: var(--glass-text, #f3f6ff);
    --g-text-2: var(--glass-text-secondary, #cdd5ee);
    --g-surface: var(--glass-surface, rgba(30, 36, 60, 0.4));
    --g-chip: var(--glass-chip, rgba(255, 255, 255, 0.14));
    --g-track: var(--glass-track, rgba(190, 200, 235, 0.25));
    --g-border: var(--glass-border, rgba(255, 255, 255, 0.22));
    --g-shadow: var(--glass-shadow, 0 8px 30px rgba(0, 0, 0, 0.35));
  }
`;

/** Shared building blocks: glass surface, card header, round buttons, errors. */
export const glass = css`
  :host {
    display: block;
    height: 100%;
  }

  .glass {
    box-sizing: border-box;
    height: 100%;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    border-radius: var(--g-radius);
    background: var(--g-surface);
    border: 1px solid var(--g-border);
    box-shadow: var(--g-shadow);
    backdrop-filter: blur(var(--g-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--g-blur)) saturate(180%);
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
    margin-bottom: 8px;
  }
  .card-head .title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .card-head .spacer {
    flex: 1;
  }

  .bubble {
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--bubble, var(--g-accent));
    background: color-mix(in srgb, var(--bubble, var(--g-accent)) 16%, transparent);
    --mdc-icon-size: 19px;
  }

  button {
    font: inherit;
    color: inherit;
    border: 0;
    padding: 0;
    cursor: pointer;
    background: none;
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible,
  [role='button']:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--g-accent);
    outline-offset: 2px;
  }

  .round-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--g-chip);
    box-shadow: inset 0 0 0 1px var(--g-border);
    --mdc-icon-size: 20px;
    transition: transform 0.15s ease;
  }
  .round-btn:active {
    transform: scale(0.92);
  }

  .muted {
    color: var(--g-text-2);
  }

  .error {
    margin: auto;
    padding: 8px;
    text-align: center;
    font-size: 13px;
    color: var(--g-red);
  }

  /* Placeholder shown when a configured entity does not exist. */
  .missing {
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    text-align: center;
    color: var(--g-text-2);
    font-size: 13px;
    --mdc-icon-size: 30px;
  }
  .missing code {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--g-chip);
    font-size: 12px;
  }
`;
