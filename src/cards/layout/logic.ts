import type { LayoutSize } from '../../shared/types';

export interface Breakpoints {
  /** Below this width (px) the sidebar becomes an icon rail. Default 1100. */
  tablet: number;
  /** Below this width (px) the sidebar becomes a bottom bar. Default 700. */
  mobile: number;
}

export const DEFAULT_BREAKPOINTS: Breakpoints = { tablet: 1100, mobile: 700 };

export function sizeForWidth(width: number, bp: Breakpoints = DEFAULT_BREAKPOINTS): LayoutSize {
  if (width < bp.mobile) return 'mobile';
  if (width < bp.tablet) return 'tablet';
  return 'desktop';
}

/** Placement of a child card in the 24-column grid. */
export interface GridConfig {
  /** Columns spanned on desktop, 1-24 (default 24). */
  columns?: number;
  /** Columns spanned on tablet (default: same as desktop). */
  tablet_columns?: number;
  /** Columns spanned on mobile (default 24). */
  mobile_columns?: number;
  /** Sizes where the card is hidden. */
  hidden_on?: LayoutSize[];
  /** Start a new row (the card is placed in the first column). */
  new_row?: boolean;
}

const clamp = (n: number | undefined, fallback: number): number =>
  Math.min(24, Math.max(1, Math.round(n ?? fallback)));

export function resolveSpans(grid: GridConfig | undefined): {
  desktop: number;
  tablet: number;
  mobile: number;
} {
  const desktop = clamp(grid?.columns, 24);
  return {
    desktop,
    tablet: clamp(grid?.tablet_columns, desktop),
    mobile: clamp(grid?.mobile_columns, 24),
  };
}
