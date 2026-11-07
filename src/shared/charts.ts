export interface XY {
  x: number;
  y: number;
}

const f = (n: number): string => (Math.round(n * 100) / 100).toString();

/** Smooth cubic path through the points (Catmull-Rom converted to Bézier). */
export function smoothPath(points: XY[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  if (points.length === 1) return `M${f(first.x)},${f(first.y)}`;
  let d = `M${f(first.x)},${f(first.y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`;
  }
  return d;
}

export interface Sparkline {
  line: string;
  area: string;
}

/** Builds the line + filled-area SVG paths for a series (nulls are skipped). */
export function sparkline(
  values: Array<number | null>,
  width: number,
  height: number,
  padding = 4,
): Sparkline {
  const valid = values.flatMap((v, i) => (v === null ? [] : [{ v, i }]));
  if (valid.length < 2) return { line: '', area: '' };

  const min = Math.min(...valid.map((p) => p.v));
  const max = Math.max(...valid.map((p) => p.v));
  const range = max - min || 1;
  const slots = Math.max(values.length - 1, 1);

  const points: XY[] = valid.map(({ v, i }) => ({
    x: padding + (i / slots) * (width - 2 * padding),
    y: padding + (1 - (v - min) / range) * (height - 2 * padding),
  }));

  const line = smoothPath(points);
  const last = points[points.length - 1]!;
  const first = points[0]!;
  return { line, area: `${line}L${f(last.x)},${height}L${f(first.x)},${height}Z` };
}

/** Normalizes values to 0..1 against the max (null -> 0). */
export function barRatios(values: Array<number | null>): number[] {
  const max = Math.max(0, ...values.map((v) => v ?? 0));
  return values.map((v) => (max > 0 && v !== null && v > 0 ? v / max : 0));
}
