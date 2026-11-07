import type { LovelaceCardConfig } from './shared/types';

declare global {
  /** Injected by Vite from package.json (see vite.config.ts). */
  const __VERSION__: string;

  interface Window {
    /** Registry read by the Home Assistant card picker. */
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
    /** Provided by the Home Assistant frontend. */
    loadCardHelpers?: () => Promise<{
      createCardElement(config: LovelaceCardConfig): HTMLElement;
    }>;
  }
}
