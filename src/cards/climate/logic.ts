/** Moves `current` by one `step` in `direction`, snapped to the step grid and clamped. */
export function nextTarget(
  current: number,
  direction: 1 | -1,
  step: number,
  min?: number,
  max?: number,
): number {
  const snapped = Math.round((current + direction * step) / step) * step;
  const rounded = Math.round(snapped * 100) / 100;
  const lower = min ?? -Infinity;
  const upper = max ?? Infinity;
  return Math.min(upper, Math.max(lower, rounded));
}
